"""
AI Chatbot Core - All chatbot logic in one file
Combines: config, logger, api_client, knowledge_base, llm_service, orchestrator
"""
import os
import re
import json
import uuid
import time
import logging
import sys
import httpx
from pathlib import Path
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, SystemMessage

# ============================================================================
# CONFIGURATION
# ============================================================================
load_dotenv()

BASE_DIR = Path(__file__).parent
DATA_DIR = BASE_DIR / "data"
LOGS_DIR = BASE_DIR / "logs"
DATA_DIR.mkdir(exist_ok=True)
LOGS_DIR.mkdir(exist_ok=True)

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
LLM_MODEL = os.getenv("LLM_MODEL", "meta-llama/llama-4-scout-17b-16e-instruct")
LLM_TEMPERATURE = float(os.getenv("LLM_TEMPERATURE", "0.1"))
LLM_MAX_TOKENS = int(os.getenv("LLM_MAX_TOKENS", "4096"))

BACKEND_BASE_URL = os.getenv("BACKEND_BASE_URL", "http://localhost:8000")
API_V1_PREFIX = os.getenv("API_V1_PREFIX", "/api/v1")
FULL_API_URL = f"{BACKEND_BASE_URL}{API_V1_PREFIX}"

DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite+aiosqlite:///{BASE_DIR}/chatbot.db")
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
LOG_FILE = LOGS_DIR / "chatbot.log"
KNOWLEDGE_BASE_PATH = DATA_DIR / "api_knowledge_base.json"


# ============================================================================
# LOGGER
# ============================================================================
def setup_logger(name: str = "chatbot") -> logging.Logger:
    """Setup and return a logger instance"""
    logger = logging.getLogger(name)
    if logger.handlers:
        return logger
    
    logger.setLevel(getattr(logging, LOG_LEVEL.upper(), logging.INFO))
    
    formatter = logging.Formatter('%(asctime)s | %(levelname)-8s | %(message)s', datefmt='%H:%M:%S')
    
    file_handler = logging.FileHandler(LOG_FILE, encoding='utf-8')
    file_handler.setLevel(logging.DEBUG)
    file_handler.setFormatter(logging.Formatter(
        '%(asctime)s | %(levelname)-8s | %(funcName)s:%(lineno)d | %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    ))
    
    # Console handler - only CRITICAL (effectively silent, logs go to file only)
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.CRITICAL)
    console_handler.setFormatter(formatter)
    
    logger.addHandler(file_handler)
    logger.addHandler(console_handler)
    return logger

logger = setup_logger()


# ============================================================================
# API CLIENT
# ============================================================================
class APIClient:
    """HTTP client for backend API calls"""
    
    def __init__(self):
        self.base_url = FULL_API_URL
        self.access_token: Optional[str] = None
        self.refresh_token: Optional[str] = None
        self.user_info: Optional[Dict] = None
        self.timeout = 30.0
    
    def set_auth_token(self, access_token: str, refresh_token: str = None):
        self.access_token = access_token
        if refresh_token:
            self.refresh_token = refresh_token
    
    def set_user_info(self, user_info: Dict):
        self.user_info = user_info
    
    def clear_auth(self):
        self.access_token = None
        self.refresh_token = None
        self.user_info = None
    
    def is_authenticated(self) -> bool:
        return self.access_token is not None
    
    def _get_headers(self) -> Dict[str, str]:
        headers = {"Content-Type": "application/json", "Accept": "application/json"}
        if self.access_token:
            headers["Authorization"] = f"Bearer {self.access_token}"
        return headers
    
    async def request(self, method: str, endpoint: str, body: Optional[Dict] = None,
                      query_params: Optional[Dict] = None, path_params: Optional[Dict] = None) -> Tuple[bool, Dict[str, Any]]:
        url = f"{self.base_url}{endpoint}"
        if path_params:
            for key, value in path_params.items():
                url = url.replace(f"{{{key}}}", str(value))
        
        logger.debug(f"Request: {method} {url}")
        
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.request(
                    method=method.upper(), url=url, headers=self._get_headers(),
                    json=body if body else None, params=query_params if query_params else None
                )
                
                try:
                    response_data = response.json()
                except Exception:
                    response_data = {"raw_text": response.text}
                
                if 200 <= response.status_code < 300:
                    return True, response_data
                else:
                    error_msg = response_data.get("detail", response_data.get("message", str(response_data)))
                    logger.error(f"API error: {response.status_code} - {error_msg}")
                    return False, {"success": False, "status_code": response.status_code, "error": error_msg, "detail": response_data}
                    
        except httpx.TimeoutException:
            return False, {"success": False, "error": "Request timed out"}
        except httpx.ConnectError as e:
            return False, {"success": False, "error": f"Could not connect to backend: {e}"}
        except Exception as e:
            return False, {"success": False, "error": str(e)}
    
    async def login(self, email: str, password: str) -> Tuple[bool, Dict]:
        success, response = await self.request("POST", "/auth/login", body={"email": email, "password": password})
        if success and response.get("success", True):
            data = response.get("data", response)
            self.set_auth_token(data.get("access_token"), data.get("refresh_token"))
            await self.get_current_user()
            return True, data
        return False, response
    
    async def get_current_user(self) -> Tuple[bool, Dict]:
        success, response = await self.request("GET", "/auth/me")
        if success and response.get("success", True):
            self.user_info = response.get("data", response)
            return True, self.user_info
        return False, response
    
    async def execute_api(self, api_id: str, api_info: Dict, payload: Dict) -> Tuple[bool, Dict]:
        method = api_info.get("method", "GET")
        endpoint = api_info.get("endpoint", "")
        body = payload.get("body", {}) if method.upper() not in ["GET", "DELETE"] else None
        query_params = payload.get("query_params", {})
        path_params = payload.get("path_params", {})
        
        logger.info(f"Executing API: {api_id} - {method} {endpoint}")
        return await self.request(method, endpoint, body, query_params, path_params)


# Global API client
api_client = APIClient()


# ============================================================================
# KNOWLEDGE BASE
# ============================================================================
class KnowledgeBase:
    """Load and query API knowledge base"""
    
    def __init__(self):
        self.knowledge_base: Dict = {}
        self.apis: Dict = {}
        self.categories: Dict = {}
        self._loaded = False
    
    def load(self) -> bool:
        try:
            if not KNOWLEDGE_BASE_PATH.exists():
                logger.error(f"Knowledge base not found: {KNOWLEDGE_BASE_PATH}")
                return False
            
            with open(KNOWLEDGE_BASE_PATH, 'r', encoding='utf-8') as f:
                self.knowledge_base = json.load(f)
            
            self.apis = self.knowledge_base.get("apis", {})
            self.categories = self.knowledge_base.get("categories", {})
            self._loaded = True
            logger.info(f"Loaded {len(self.apis)} APIs")
            return True
        except Exception as e:
            logger.error(f"Failed to load knowledge base: {e}")
            return False
    
    def get_api_summary(self) -> str:
        """
        Get API summary for LLM Call 1.
        Clearly shows each API's purpose and what data it requires/provides.
        """
        if not self._loaded:
            self.load()
        
        lines = []
        apis_by_cat: Dict[str, List] = {}
        
        for api_id, api_info in self.apis.items():
            cat = api_info.get("category", "other")
            if cat not in apis_by_cat:
                apis_by_cat[cat] = []
            apis_by_cat[cat].append((api_id, api_info))
        
        for cat, apis in apis_by_cat.items():
            cat_name = self.categories.get(cat, {}).get("name", cat.title())
            lines.append(f"\n=== {cat_name} ===")
            
            for api_id, api_info in apis:
                desc = api_info.get("short_description", api_info.get("description", ""))
                method = api_info.get("method", "GET")
                
                # What this API provides
                provides = []
                if method == "GET":
                    provides.append("retrieves data")
                elif method == "POST":
                    provides.append("creates/submits")
                elif method == "PUT" or method == "PATCH":
                    provides.append("updates")
                elif method == "DELETE":
                    provides.append("removes")
                
                # What this API requires (dependencies)
                requires = api_info.get("requires_data_from", [])
                
                # Build line
                line = f"• {api_id} [{method}]: {desc}"
                if requires:
                    line += f"\n  ↳ NEEDS DATA FROM: {', '.join(requires)}"
                
                # Check for path params that need IDs
                path_params = api_info.get("path_params", {})
                if path_params:
                    param_names = list(path_params.keys())
                    line += f"\n  ↳ REQUIRES PATH PARAMS: {', '.join(param_names)}"
                
                lines.append(line)
        
        return "\n".join(lines)
    
    def get_api_by_id(self, api_id: str) -> Optional[Dict]:
        if not self._loaded:
            self.load()
        return self.apis.get(api_id.upper())
    
    def extract_api_ids(self, text: str) -> List[str]:
        """Extract valid API IDs from text"""
        pattern = r'\b([A-Z][A-Z0-9_]+(?:_[A-Z0-9]+)*)\b'
        matches = re.findall(pattern, text)
        valid = []
        for m in matches:
            if m in self.apis and m not in valid:
                valid.append(m)
        return valid
    
    def format_apis_for_payload(self, api_ids: List[str]) -> str:
        """Format COMPLETE API schema as JSON for payload generation"""
        if not self._loaded:
            self.load()
        
        result = {}
        for api_id in api_ids:
            api = self.get_api_by_id(api_id)
            if not api:
                continue
            
            # Build exact schema
            schema = {
                "api_id": api_id,
                "method": api.get("method", "GET"),
                "endpoint": api.get("endpoint", ""),
                "description": api.get("description", ""),
            }
            
            # Request body - exact fields with types and requirements
            request_body = api.get("request_body", {})
            if request_body:
                schema["request_body"] = {}
                for field, info in request_body.items():
                    if isinstance(info, dict):
                        schema["request_body"][field] = {
                            "type": info.get("type", "string"),
                            "required": info.get("required", False),
                            "description": info.get("description", ""),
                        }
                        if "enum_values" in info:
                            schema["request_body"][field]["allowed_values"] = info["enum_values"]
                        if "example" in info:
                            schema["request_body"][field]["example"] = info["example"]
                        # Handle nested array item schemas (e.g., items array with food_item_id)
                        if info.get("type") == "array" and "items" in info:
                            nested_items = info["items"]
                            if isinstance(nested_items, dict):
                                schema["request_body"][field]["item_schema"] = {}
                                for nested_field, nested_info in nested_items.items():
                                    if isinstance(nested_info, dict):
                                        schema["request_body"][field]["item_schema"][nested_field] = {
                                            "type": nested_info.get("type", "string"),
                                            "required": nested_info.get("required", False),
                                            "description": nested_info.get("description", ""),
                                        }
                                        if "default" in nested_info:
                                            schema["request_body"][field]["item_schema"][nested_field]["default"] = nested_info["default"]
            
            # Path parameters
            path_params = api.get("path_params", {})
            if path_params:
                schema["path_params"] = {}
                for param, info in path_params.items():
                    if isinstance(info, dict):
                        schema["path_params"][param] = {
                            "type": info.get("type", "string"),
                            "required": True,
                            "description": info.get("description", ""),
                        }
            
            # Query parameters
            query_params = api.get("query_params", {})
            if query_params:
                schema["query_params"] = {}
                for param, info in query_params.items():
                    if isinstance(info, dict):
                        schema["query_params"][param] = {
                            "type": info.get("type", "string"),
                            "required": info.get("required", False),
                            "description": info.get("description", ""),
                        }
                        if "default" in info:
                            schema["query_params"][param]["default"] = info["default"]
            
            result[api_id] = schema
        
        return json.dumps(result, indent=2)


# Global knowledge base
knowledge_base = KnowledgeBase()


# ============================================================================
# LLM SERVICE
# ============================================================================
class LLMService:
    """Handle LLM interactions - Simple payload generation"""
    
    def __init__(self):
        self.llm = None
        self.session_id = str(uuid.uuid4())
        self._initialized = False
    
    def initialize(self):
        if not GROQ_API_KEY:
            raise ValueError("GROQ_API_KEY not set in .env")
        
        self.llm = ChatGroq(
            api_key=GROQ_API_KEY,
            model=LLM_MODEL,
            temperature=LLM_TEMPERATURE,
            max_tokens=LLM_MAX_TOKENS
        )
        self._initialized = True
        logger.info(f"LLM initialized: {LLM_MODEL}")
    
    def set_session_id(self, session_id: str):
        self.session_id = session_id
    
    def _get_current_datetime_info(self) -> str:
        """Get current date/time information"""
        now = datetime.now()
        return f"""CURRENT DATE AND TIME:
- Date: {now.strftime("%Y-%m-%d")} ({now.strftime("%A, %B %d, %Y")})
- Time: {now.strftime("%H:%M:%S")}
- Tomorrow: {(now + timedelta(days=1)).strftime("%Y-%m-%d")}"""

    async def call_1_api_selection(self, user_input: str) -> Tuple[List[str], str]:
        """LLM Call 1: Select which APIs are needed for the user's request"""
        if not self._initialized:
            self.initialize()
        
        api_summary = knowledge_base.get_api_summary()
        datetime_info = self._get_current_datetime_info()
        
        prompt = f"""{datetime_info}

You are an API orchestrator for an Office Management System. Analyze the user's request and select the MINIMUM APIs needed.

AVAILABLE APIs:
{api_summary}

USER REQUEST: "{user_input}"

INSTRUCTIONS:
1. Select ONLY the APIs that are absolutely necessary
2. If user provides a specific ID (like booking_id, order_id), you can directly use the action API
3. Only include prerequisite APIs (like LIST or MY_BOOKINGS) if user does NOT provide a specific ID
4. Choose the MOST SPECIFIC API for the task - don't select multiple similar APIs

DECISION RULES:
- User provides a specific booking/order ID → Use the action API directly (CANCEL, UPDATE, etc.)
- User asks to cancel WITHOUT providing an ID → First get MY_BOOKINGS, then CANCEL
- User asks to view their data → Select ONE appropriate MY_* API
- User asks to book/create → Get LIST first, then BOOK/CREATE
- NEVER select both DESK and CONFERENCE_ROOM APIs unless user specifically mentions both

OUTPUT FORMAT (strictly follow this):
SELECTED_APIS: [API_ID_1, API_ID_2]
REASONING: Brief explanation"""

        messages = [
            SystemMessage(content="Select APIs needed for the request. Output must include SELECTED_APIS: [list] format."),
            HumanMessage(content=prompt)
        ]
        
        response = await self.llm.ainvoke(messages)
        
        # Handle response - extract text properly
        raw = self._extract_text_from_response(response)
        
        logger.debug(f"LLM Call 1: {raw[:500]}")
        
        selected_apis = []
        reasoning = ""
        
        # Extract APIs from response
        match = re.search(r'SELECTED_APIS:\s*\[([^\]]*?)\]', raw, re.DOTALL | re.IGNORECASE)
        if match:
            selected_apis = knowledge_base.extract_api_ids(match.group(1))
        
        if not selected_apis:
            selected_apis = knowledge_base.extract_api_ids(raw)
        
        reasoning_match = re.search(r'REASONING:\s*(.+?)$', raw, re.DOTALL | re.IGNORECASE)
        if reasoning_match:
            reasoning = reasoning_match.group(1).strip()
        
        # ENFORCE CORRECT ORDERING: prerequisite APIs must come before dependent APIs
        selected_apis = self._enforce_api_order(selected_apis, user_input)
        
        logger.info(f"Selected APIs: {selected_apis}")
        return selected_apis, reasoning
    
    def _enforce_api_order(self, apis: List[str], user_input: str = "") -> List[str]:
        """Ensure prerequisite APIs come before their dependent APIs.
        Reads dependencies from the knowledge base 'requires_data_from' field.
        
        IMPORTANT: If user provides a specific ID (UUID pattern), don't add prerequisite APIs
        """
        # Check if user provided a UUID (booking_id, order_id, etc.)
        uuid_pattern = r'[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}'
        user_provided_id = bool(re.search(uuid_pattern, user_input))
        
        result = []
        for api in apis:
            # Get API info from knowledge base
            api_info = knowledge_base.get_api_by_id(api)
            if api_info:
                # Only add dependencies if user did NOT provide a specific ID
                if not user_provided_id:
                    dependencies = api_info.get("requires_data_from", [])
                    for dep in dependencies:
                        if dep not in result:
                            result.append(dep)
            
            if api not in result:
                result.append(api)
        
        return result
    
    async def call_2_payload_generation(self, user_input: str, api_details: str,
                                        previous_data: Dict = None) -> Dict:
        """
        LLM Call 2: Generate payload for a single API.
        Uses data from executed APIs to fill in IDs for subsequent APIs.
        """
        if not self._initialized:
            self.initialize()
        
        # Format previous API data if available
        prev_data_str = "NONE"
        selected_id_hint = ""
        if previous_data:
            # Check if there's a user-selected item (from multi-choice)
            if "_selected_item_id" in previous_data:
                selected_id_hint = f"\n\n**USER SELECTED ITEM ID: {previous_data['_selected_item_id']}** - Use this ID for booking_id or similar path params."
            
            prev_data_str = json.dumps(previous_data, indent=2, default=str)
            if len(prev_data_str) > 4000:
                prev_data_str = prev_data_str[:4000] + "..."
        
        # Extract API ID and method from details
        try:
            api_schema = json.loads(api_details)
            api_id = list(api_schema.keys())[0]
            schema = api_schema[api_id]
            method = schema.get("method", "GET")
        except:
            api_id = "UNKNOWN"
            schema = {}
            method = "GET"
        
        today = datetime.now().strftime("%Y-%m-%d")
        tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
        
        # For GET requests, never ask followup - just use defaults
        is_get_request = method == "GET"
        
        prompt = f"""Generate a JSON payload for the API call.

TODAY'S DATE: {today}
TOMORROW: {tomorrow}

USER REQUEST: "{user_input}"

API SCHEMA:
{api_details}

DATA FROM PREVIOUS API CALLS:
{prev_data_str}{selected_id_hint}

CRITICAL INSTRUCTIONS:
1. Use EXACT field names from API SCHEMA - do NOT rename or simplify them
2. For array fields with "item_schema": each array element must have the exact fields listed in item_schema
   - Example: if schema shows "items" with item_schema containing "food_item_id", use "food_item_id" NOT "id"
3. "required": true fields MUST be included with valid values
4. For IDs: Find the ID from PREVIOUS API data (look for "id" field in response items) or USER SELECTED ITEM ID
5. For dates: Use {today} for "today", {tomorrow} for "tomorrow"
6. For times: Use 24-hour format like "15:00:00" for 3pm, "17:00:00" for 5pm
7. For optional fields: Include only if user mentioned them, otherwise omit
8. DO NOT use null - either provide a value or omit the field
{"9. THIS IS A GET REQUEST - NEVER ask for more info. Use empty params if unsure." if is_get_request else "9. Only ask for info if REQUIRED fields cannot be determined."}

OUTPUT FORMAT (JSON ONLY, NO OTHER TEXT):
{{"body":{{}},"query_params":{{}},"path_params":{{}}}}"""

        messages = [
            SystemMessage(content=f"Output ONLY valid JSON. {'This is a GET request - use empty params, NEVER ask followup questions.' if is_get_request else 'No explanations.'}"),
            HumanMessage(content=prompt)
        ]
        
        response = await self.llm.ainvoke(messages)
        raw = self._extract_text_from_response(response)
        raw = raw.strip()
        logger.debug(f"LLM Call 2 raw for {api_id}: {raw[:500]}")
        
        # Parse the JSON response
        parsed = self._parse_json_response(raw, api_id)
        
        # For GET requests, NEVER return needs_followup - always proceed
        if is_get_request:
            return {
                "needs_followup": False,
                "followup_question": None,
                "payloads": {
                    api_id: {
                        "body": parsed.get("body", {}),
                        "query_params": parsed.get("query_params", {}),
                        "path_params": parsed.get("path_params", {})
                    }
                }
            }
        
        # For non-GET requests, check if followup is needed
        if "needs_info" in parsed and parsed.get("needs_info"):
            return {
                "needs_followup": True,
                "followup_question": parsed.get("question", "Could you provide more details?"),
                "payloads": None
            }
        
        # Ensure proper structure
        if "body" in parsed or "query_params" in parsed or "path_params" in parsed:
            return {
                "needs_followup": False,
                "followup_question": None,
                "payloads": {
                    api_id: {
                        "body": parsed.get("body", {}),
                        "query_params": parsed.get("query_params", {}),
                        "path_params": parsed.get("path_params", {})
                    }
                }
            }
        
        # Already in correct format
        if "payloads" in parsed:
            return parsed
        
        # Fallback - return empty payload
        logger.warning(f"Unexpected response format, using empty payload for {api_id}")
        return {
            "needs_followup": False,
            "followup_question": None,
            "payloads": {api_id: {"body": {}, "query_params": {}, "path_params": {}}}
        }
    
    def _parse_json_response(self, raw: str, api_id: str) -> Dict:
        """Parse LLM response to JSON, with multiple fallback strategies"""
        cleaned = raw.strip()
        
        # Remove markdown code blocks
        if "```" in cleaned:
            cleaned = re.sub(r'```json\s*', '', cleaned)
            cleaned = re.sub(r'```\s*', '', cleaned)
        
        # Remove any text before first {
        first_brace = cleaned.find('{')
        if first_brace > 0:
            cleaned = cleaned[first_brace:]
        
        # Remove any text after last }
        last_brace = cleaned.rfind('}')
        if last_brace >= 0:
            cleaned = cleaned[:last_brace + 1]
        
        # Try parsing
        try:
            return json.loads(cleaned)
        except json.JSONDecodeError as e:
            logger.warning(f"First JSON parse failed for {api_id}: {e}")
        
        # Try fixing common JSON issues
        try:
            # Replace null with empty string for problematic fields
            fixed = re.sub(r':\s*null\s*([,}])', r': ""\1', cleaned)
            # Remove trailing commas
            fixed = re.sub(r',\s*}', '}', fixed)
            fixed = re.sub(r',\s*]', ']', fixed)
            return json.loads(fixed)
        except json.JSONDecodeError:
            pass
        
        # Try to extract just the body/query_params/path_params
        body_match = re.search(r'"body"\s*:\s*(\{[^{}]*\})', cleaned)
        if body_match:
            try:
                body = json.loads(body_match.group(1))
                return {"body": body, "query_params": {}, "path_params": {}}
            except:
                pass
        
        logger.warning(f"All JSON parse attempts failed for {api_id}, returning empty")
        return {"body": {}, "query_params": {}, "path_params": {}}
    
    async def generate_response(self, user_input: str, results: Dict, errors: Dict = None) -> str:
        """
        LLM Call 3: Generate human-friendly response STRICTLY based on API response data.
        NO hallucination - only use data that is in the results.
        """
        if not self._initialized:
            self.initialize()
        
        has_errors = errors and len(errors) > 0
        has_results = results and len(results) > 0
        
        # Format the actual API response data
        results_str = json.dumps(results, indent=2, default=str)
        if len(results_str) > 4000:
            results_str = results_str[:4000] + "...(truncated)"
        
        errors_str = json.dumps(errors, indent=2) if has_errors else "None"
        
        prompt = f"""Convert this API response data into a simple message for the user.

USER ASKED: "{user_input}"

API RESPONSE:
{results_str}

ERRORS:
{errors_str}

RULES:
1. Use ONLY the data shown above - do not invent anything
2. Format lists with bullet points if needed
3. Include IDs, dates, times, names exactly as shown in the data
4. If errors occurred, explain briefly
5. Be concise - 2-4 sentences max unless showing a list
6. Do NOT start with phrases like "Here's...", "Based on...", "The API response shows..."
7. Speak directly to the user"""

        messages = [
            SystemMessage(content="Format the API response as a direct message. No meta-commentary. Only use data provided."),
            HumanMessage(content=prompt)
        ]
        
        response = await self.llm.ainvoke(messages)
        
        # Handle Gemini response - extract text properly
        result = self._extract_text_from_response(response)
        return result
    
    def _extract_text_from_response(self, response) -> str:
        """Extract plain text from LLM response (handles various formats)"""
        # Try direct content attribute
        if hasattr(response, 'content'):
            content = response.content
            
            # If content is a string, return it
            if isinstance(content, str):
                return content
            
            # If content is a list (Gemini format), extract text parts
            if isinstance(content, list):
                text_parts = []
                for part in content:
                    if isinstance(part, dict):
                        if part.get('type') == 'text':
                            text_parts.append(part.get('text', ''))
                    elif isinstance(part, str):
                        text_parts.append(part)
                return ''.join(text_parts) if text_parts else str(content)
        
        # Fallback to string conversion
        return str(response)

    async def generate_conversational_response(self, user_input: str, conversation_history: List[Dict] = None) -> str:
        """Generate a natural conversational response for non-API requests"""
        if not self.llm:
            self.initialize()
        
        # Build recent conversation context
        recent_context = ""
        if conversation_history and len(conversation_history) > 0:
            recent_msgs = conversation_history[-6:]  # Last 3 exchanges
            recent_context = "\n".join([f"{msg['role'].title()}: {msg['content']}" for msg in recent_msgs])
        
        prompt = f"""You are a friendly Office Management AI assistant. The user said something conversational that doesn't require any system action.

Recent conversation:
{recent_context}

User's message: "{user_input}"

Respond naturally and briefly (1-2 sentences). Be warm, helpful, and conversational.
- For greetings: greet back warmly
- For thanks: acknowledge graciously
- For goodbyes: wish them well
- For casual chat: respond friendly and offer to help with office tasks
- For unclear requests: politely ask what they need help with

Do NOT mention APIs, systems, or technical details. Just be a friendly assistant."""

        messages = [
            SystemMessage(content="You are a friendly, conversational office assistant. Keep responses brief and natural."),
            HumanMessage(content=prompt)
        ]
        
        response = await self.llm.ainvoke(messages)
        return self._extract_text_from_response(response)


# Global LLM service
llm_service = LLMService()


# ============================================================================
# ORCHESTRATOR
# ============================================================================
class ChatbotOrchestrator:
    """
    Simple orchestrator:
    1. LLM Call 1: Select APIs
    2. LLM Call 2: Generate ALL payloads at once (or ask user for missing info)
    3. Execute APIs sequentially
    """
    
    def __init__(self):
        self.session_id = str(uuid.uuid4())
        self.conversation_history: List[Dict] = []
        self.user_email: Optional[str] = None
        self.pending_followup: Optional[Dict] = None
        self._initialized = False
        self.executed_data: Dict[str, Any] = {}  # Stores API responses
    
    async def initialize(self):
        if self._initialized:
            return
        if not knowledge_base.load():
            raise RuntimeError("Failed to load knowledge base")
        llm_service.initialize()
        llm_service.set_session_id(self.session_id)
        self._initialized = True
        logger.info(f"Orchestrator initialized: {self.session_id}")
    
    def is_authenticated(self) -> bool:
        return api_client.is_authenticated()
    
    async def login(self, email: str, password: str) -> Tuple[bool, str]:
        success, response = await api_client.login(email, password)
        if success:
            self.user_email = email
            user = api_client.user_info
            return True, f"Welcome {user.get('first_name', '')} {user.get('last_name', '')}! You are logged in as {user.get('role', 'user')}."
        return False, f"Login failed: {response.get('error', 'Unknown error')}"
    
    def logout(self):
        api_client.clear_auth()
        self.user_email = None
        self.conversation_history = []
        self.pending_followup = None
        self.executed_data = {}
        logger.info("User logged out")
    
    def add_to_history(self, role: str, content: str):
        self.conversation_history.append({"role": role, "content": content, "timestamp": datetime.now().isoformat()})
        if len(self.conversation_history) > 20:
            self.conversation_history = self.conversation_history[-20:]
    
    async def process_input(self, user_input: str) -> str:
        """Main entry point"""
        await self.initialize()
        
        if not self.is_authenticated():
            return "⚠️ Please login first: /login"
        
        self.add_to_history("user", user_input)
        
        try:
            # Handle pending followup
            if self.pending_followup:
                return await self._handle_followup(user_input)
            
            # Clear previous data
            self.executed_data = {}
            
            # Step 1: Select APIs
            logger.info(f"Processing: {user_input[:100]}...")
            selected_apis, reasoning = await llm_service.call_1_api_selection(user_input)
            
            if not selected_apis:
                # Generate a natural conversational response instead of a robotic one
                response = await llm_service.generate_conversational_response(
                    user_input, 
                    self.conversation_history
                )
                self.add_to_history("assistant", response)
                return response
            
            logger.info(f"Selected APIs: {selected_apis}")
            
            # Step 2: Generate payloads and execute
            return await self._generate_and_execute(user_input, selected_apis)
            
        except Exception as e:
            logger.error(f"Error: {e}", exc_info=True)
            self.executed_data = {}
            error_response = f"❌ Error: {str(e)}"
            self.add_to_history("assistant", error_response)
            return error_response
    
    async def _handle_followup(self, user_response: str) -> str:
        """Handle user's answer to a followup question"""
        if not self.pending_followup:
            return "No pending question."
        
        info = self.pending_followup
        self.pending_followup = None
        
        # Restore executed data from before followup
        if "executed_data" in info:
            self.executed_data = info["executed_data"]
        
        # Check if this is a selection followup (user choosing from multiple items)
        if "selection_items" in info:
            return await self._handle_selection_followup(user_response, info)
        
        # Combine original request with user's answer
        combined_input = f"{info['original_input']}. User provided: {user_response}"
        
        # Continue with remaining APIs
        return await self._generate_and_execute(combined_input, info['apis'])
    
    async def _handle_selection_followup(self, user_response: str, info: Dict) -> str:
        """Handle user's selection from multiple items (e.g., which booking to cancel)"""
        items = info.get("selection_items", [])
        selection_type = info.get("selection_type", "")
        
        # Use LLM to match user's response to the correct item
        selected_item = await self._match_user_selection(user_response, items, selection_type)
        
        if not selected_item:
            # Could not determine selection - ask again
            self.pending_followup = info
            return "I couldn't determine which one you meant. Please specify by number (1, 2, 3...) or describe it more clearly."
        
        # Get the ID from the selected item
        item_id = self._extract_item_id(selected_item, selection_type)
        
        if not item_id:
            return "❌ Could not find the ID for the selected item."
        
        # Update user input to include the specific selection
        combined_input = f"{info['original_input']}. User selected booking with ID: {item_id}"
        
        # Store the selected item ID in executed_data for LLM Call 2
        self.executed_data["_selected_item_id"] = item_id
        self.executed_data["_selected_item"] = selected_item
        
        # Continue with booking/cancel API
        return await self._generate_and_execute(combined_input, info['apis'])
    
    async def _match_user_selection(self, user_response: str, items: List[Dict], selection_type: str) -> Optional[Dict]:
        """Use LLM to match user's response to one of the items"""
        user_input = user_response.strip().lower()
        
        # Check for numeric selection first (1, 2, 3, etc.)
        try:
            num = int(user_input)
            if 1 <= num <= len(items):
                return items[num - 1]
        except ValueError:
            pass
        
        # Check for direct name/code matching (e.g., "a3", "window desk a3", "d1")
        for item in items:
            # Check desk/room codes
            desk_code = str(item.get("desk_code", "")).lower()
            room_code = str(item.get("room_code", "")).lower()
            name = str(item.get("name", "")).lower()
            
            # Match partial codes like "a3" to "Window Desk A3" or "DSK-6543"
            if user_input in name or user_input in desk_code or user_input in room_code:
                return item
            
            # Extract alphanumeric part from name (e.g., "a3" from "Window Desk A3")
            import re
            name_match = re.search(r'([a-z]\d+)', name)
            if name_match and name_match.group(1) == user_input:
                return item
        
        # Format items for LLM matching
        items_desc = []
        for i, item in enumerate(items, 1):
            desc = self._format_item_description(item, selection_type)
            items_desc.append(f"{i}. {desc}")
        
        prompt = f"""User needs to select one item from this list:

{chr(10).join(items_desc)}

User said: "{user_response}"

Which item number (1-{len(items)}) is the user referring to? Consider:
- Room/desk codes
- Dates and times
- Purposes/titles

Output ONLY the number (1-{len(items)}). If unclear, output 0."""

        messages = [
            SystemMessage(content="Output ONLY a single number."),
            HumanMessage(content=prompt)
        ]
        
        try:
            response = await llm_service.llm.ainvoke(messages)
            raw = llm_service._extract_text_from_response(response)
            num = int(str(raw).strip())
            if 1 <= num <= len(items):
                return items[num - 1]
        except:
            pass
        
        return None
    
    def _format_item_description(self, item: Dict, selection_type: str) -> str:
        """Format an item for display to user"""
        if "CONFERENCE_ROOM" in selection_type or "DESK" in selection_type:
            room_code = item.get("room_code") or item.get("desk_code", "Unknown")
            date = item.get("booking_date") or item.get("date", "Unknown date")
            start = item.get("start_time", "")
            end = item.get("end_time", "")
            purpose = item.get("purpose", "")
            time_str = f"{start}-{end}" if start and end else ""
            return f"{room_code} on {date} {time_str} - {purpose}".strip()
        elif "FOOD_ORDER" in selection_type:
            date = item.get("order_date", "Unknown date")
            items_list = item.get("items", [])
            item_names = ", ".join([i.get("name", "") for i in items_list[:3]]) if items_list else "items"
            return f"Order on {date}: {item_names}"
        elif "LEAVE" in selection_type:
            start = item.get("start_date", "")
            end = item.get("end_date", "")
            leave_type = item.get("leave_type", "Leave")
            return f"{leave_type} from {start} to {end}"
        else:
            return str(item)[:100]
    
    def _extract_item_id(self, item: Dict, selection_type: str) -> Optional[str]:
        """Extract the appropriate ID from an item based on type"""
        # Common ID field names
        id_fields = ["id", "booking_id", "order_id", "leave_id", "request_id"]
        for field in id_fields:
            if field in item:
                return str(item[field])
        return None
    
    def _format_selection_question(self, cancel_api: str, items: List[Dict]) -> str:
        """Format a question asking user to choose which item to cancel"""
        lines = ["Which one would you like to cancel?\n"]
        
        for i, item in enumerate(items, 1):
            desc = self._format_item_description(item, cancel_api)
            lines.append(f"  {i}. {desc}")
        
        lines.append("\nPlease reply with the number or describe which one.")
        return "\n".join(lines)
    
    async def _filter_items_by_user_request(self, user_input: str, items: List[Dict], book_api: str) -> List[Dict]:
        """Use LLM to filter items based on user's specific requirements"""
        if not items:
            return items
        
        # Format items with all their details for LLM analysis
        items_desc = []
        for i, item in enumerate(items):
            # Include all relevant fields
            item_info = {
                "index": i,
                "id": item.get("id", ""),
                "code": item.get("desk_code", item.get("room_code", item.get("code", ""))),
                "name": item.get("label", item.get("name", "")),
                "zone": item.get("zone", ""),
                "equipment": item.get("equipment", item.get("amenities", item.get("features", []))),
                "capacity": item.get("capacity", ""),
                "status": item.get("status", ""),
                "floor": item.get("floor", item.get("location", "")),
            }
            # Remove empty values
            item_info = {k: v for k, v in item_info.items() if v}
            items_desc.append(json.dumps(item_info))
        
        prompt = f"""User wants to book: "{user_input}"

Available items (JSON format):
{chr(10).join(items_desc)}

Task: Return the indices (0-based) of items that match the user's requirements.

Rules:
1. If user specifies equipment (e.g., "docking station", "monitor", "projector"), only return items that have that equipment
2. If user specifies capacity, filter by capacity
3. If user specifies zone/floor/location, filter by that
4. If no specific requirements, return all indices
5. Equipment matching should be case-insensitive and partial (e.g., "docking" matches "Docking Station")

Output format: Return ONLY a JSON array of indices, e.g., [0, 2, 5] or [] if none match.
Do NOT include any explanation."""

        messages = [
            SystemMessage(content="Output ONLY a valid JSON array of indices. No explanation."),
            HumanMessage(content=prompt)
        ]
        
        try:
            response = await llm_service.llm.ainvoke(messages)
            raw = llm_service._extract_text_from_response(response).strip()
            
            # Extract JSON array from response
            import re
            match = re.search(r'\[[\d,\s]*\]', raw)
            if match:
                indices = json.loads(match.group())
                filtered = [items[i] for i in indices if 0 <= i < len(items)]
                if filtered:
                    logger.info(f"Filtered {len(items)} items to {len(filtered)} based on user requirements")
                    return filtered
        except Exception as e:
            logger.warning(f"Item filtering failed: {e}, returning all items")
        
        return items
    
    def _format_booking_selection_question(self, book_api: str, items: List[Dict], user_input: str = "") -> str:
        """Format a question asking user to choose which item to book"""
        # Determine type based on API
        item_type = "item"
        if "DESK" in book_api:
            item_type = "desk"
        elif "CONFERENCE" in book_api or "ROOM" in book_api:
            item_type = "conference room"
        elif "CAFETERIA" in book_api or "TABLE" in book_api:
            item_type = "table"
        
        lines = [f"Please select which {item_type} you would like to book:\n"]
        
        for i, item in enumerate(items, 1):
            desc = self._format_booking_item_description(item, book_api)
            lines.append(f"  {i}. {desc}")
        
        lines.append("\nReply with the number (1, 2, 3...) or name.")
        return "\n".join(lines)
    
    def _format_booking_item_description(self, item: Dict, book_api: str) -> str:
        """Format a single item for booking selection display - dynamically uses all available fields"""
        
        # Log item structure for debugging
        logger.debug(f"Formatting item with keys: {list(item.keys())}")
        logger.debug(f"Item data: {json.dumps(item, default=str)[:500]}")
        
        # Fields to exclude from display (internal/technical fields)
        exclude_fields = {"id", "created_at", "updated_at", "deleted_at", "user_id", "user_code", 
                          "created_by", "updated_by", "is_active", "is_deleted"}
        
        # Priority fields to show first (will be shown in this order if present)
        priority_fields = ["label", "name", "desk_name", "room_name", "title", 
                          "desk_code", "room_code", "code", "zone", "floor", "location",
                          "capacity", "seats", "equipment", "amenities", "features", "status"]
        
        parts = []
        shown_fields = set()
        
        # First, add priority fields in order
        for field in priority_fields:
            if field in item and field not in exclude_fields:
                value = item[field]
                if value is not None and value != "" and value != []:
                    shown_fields.add(field)
                    # Format the value
                    if isinstance(value, list):
                        formatted = ", ".join(str(v) for v in value)
                    else:
                        formatted = str(value)
                    
                    # First field (usually name) doesn't need a label
                    if not parts:
                        parts.append(formatted)
                    elif field in ["desk_code", "room_code", "code"]:
                        # Code goes in parentheses after name
                        if parts:
                            parts[0] = f"{parts[0]} ({formatted})"
                        else:
                            parts.append(f"({formatted})")
                    elif field in ["equipment", "amenities", "features"]:
                        parts.append(f"[{formatted}]")
                    elif field == "capacity" or field == "seats":
                        parts.append(f"Capacity: {formatted}")
                    else:
                        parts.append(f"{field.replace('_', ' ').title()}: {formatted}")
        
        # If no parts found, show all non-excluded fields
        if not parts:
            for key, value in item.items():
                if key not in exclude_fields and key not in shown_fields:
                    if value is not None and value != "" and value != []:
                        if isinstance(value, list):
                            formatted = ", ".join(str(v) for v in value)
                        else:
                            formatted = str(value)
                        parts.append(f"{key}: {formatted}")
        
        return " - ".join(parts) if parts else "Unknown Item"
    
    async def _generate_and_execute(self, user_input: str, api_ids: List[str]) -> str:
        """
        FLOW:
        1. For each API in sequence:
           a. Get EXACT API schema from knowledge base
           b. LLM Call 2: Generate payload matching the schema
           c. Execute API and store response
        2. LLM Call 3: Generate human-friendly response
        
        Special handling for DELETE/CANCEL operations with multiple items:
        - Ask user to choose which one to cancel by description, not ID
        """
        results = {}
        errors = {}
        
        # Build cancel_api_map dynamically from knowledge base (DELETE methods with dependencies)
        cancel_api_map = {}
        for api_id, api_info in knowledge_base.apis.items():
            if api_info.get("method") == "DELETE":
                dependencies = api_info.get("requires_data_from", [])
                if dependencies:
                    cancel_api_map[api_id] = dependencies[0]  # First dependency
        
        # Build book_api_map dynamically from knowledge base (POST methods with LIST dependencies)
        # Maps BOOK API -> LIST API (e.g., DESK_BOOK -> DESK_LIST)
        book_api_map = {}
        for api_id, api_info in knowledge_base.apis.items():
            if api_info.get("method") == "POST" and "BOOK" in api_id:
                dependencies = api_info.get("requires_data_from", [])
                if dependencies and "LIST" in dependencies[0]:
                    book_api_map[api_id] = dependencies[0]
        
        for i, api_id in enumerate(api_ids):
            # Get API info from knowledge base
            api_info = knowledge_base.get_api_by_id(api_id)
            if not api_info:
                errors[api_id] = "API not found in knowledge base"
                continue
            
            method = api_info.get("method", "GET")
            
            # Get EXACT API schema for LLM
            api_schema = knowledge_base.format_apis_for_payload([api_id])
            
            logger.info(f"[{i+1}/{len(api_ids)}] Generating payload for {api_id} ({method})")
            
            # LLM Call 2: Generate payload
            try:
                result = await llm_service.call_2_payload_generation(
                    user_input=user_input,
                    api_details=api_schema,
                    previous_data=self.executed_data
                )
            except Exception as e:
                logger.error(f"Payload generation failed for {api_id}: {e}")
                errors[api_id] = f"Failed to generate payload: {str(e)}"
                continue
            
            # Check if LLM needs more info (only for POST/PUT/DELETE, not GET)
            if result.get("needs_followup") and method != "GET":
                question = result.get("followup_question", "Could you provide more details?")
                self.pending_followup = {
                    "original_input": user_input,
                    "apis": api_ids[i:],
                    "executed_data": self.executed_data.copy()
                }
                self.add_to_history("assistant", question)
                return f"🤔 {question}"
            
            # Get the generated payload
            payloads = result.get("payloads", {})
            payload = payloads.get(api_id, {"body": {}, "query_params": {}, "path_params": {}})
            
            # Clean payload - remove None/null values
            payload = self._clean_payload(payload)
            
            # AUTO-FILL from _selected_item_id if available
            if "_selected_item_id" in self.executed_data:
                selected_id = self.executed_data["_selected_item_id"]
                
                # Fill path params for CANCEL/DELETE operations
                path_params_schema = api_info.get("path_params", {})
                for param_name in path_params_schema.keys():
                    if param_name in ["booking_id", "order_id", "leave_id", "request_id", "id"]:
                        if not payload.get("path_params", {}).get(param_name):
                            if "path_params" not in payload:
                                payload["path_params"] = {}
                            payload["path_params"][param_name] = selected_id
                            logger.info(f"Auto-filled path param {param_name}={selected_id}")
                
                # Fill body params for BOOK operations (desk_id, room_id, table_id)
                request_body_schema = api_info.get("request_body", {})
                for param_name in request_body_schema.keys():
                    if param_name in ["desk_id", "room_id", "table_id"]:
                        if not payload.get("body", {}).get(param_name):
                            if "body" not in payload:
                                payload["body"] = {}
                            payload["body"][param_name] = selected_id
                            logger.info(f"Auto-filled body param {param_name}={selected_id}")
            
            # Execute the API
            logger.info(f"Executing {api_id}: {json.dumps(payload, default=str)}")
            success, response = await api_client.execute_api(api_id, api_info, payload)
            
            if success:
                data = response.get("data", response)
                self.executed_data[api_id] = data
                results[api_id] = data
                logger.info(f"✓ {api_id} succeeded")
                
                # Check if next API needs user selection (CANCEL or BOOK with multiple items)
                if i + 1 < len(api_ids):
                    next_api = api_ids[i + 1]
                    items = data if isinstance(data, list) else []
                    
                    # Check for CANCEL operation
                    if next_api in cancel_api_map and cancel_api_map[next_api] == api_id:
                        if len(items) > 1:
                            # Ask user to choose which one to cancel
                            choice_question = self._format_selection_question(next_api, items)
                            self.pending_followup = {
                                "original_input": user_input,
                                "apis": api_ids[i + 1:],
                                "executed_data": self.executed_data.copy(),
                                "selection_items": items,
                                "selection_type": next_api
                            }
                            self.add_to_history("assistant", choice_question)
                            return choice_question
                        elif len(items) == 1:
                            # Only one item - auto-select it
                            item_id = self._extract_item_id(items[0], next_api)
                            if item_id:
                                self.executed_data["_selected_item_id"] = item_id
                                self.executed_data["_selected_item"] = items[0]
                            logger.info(f"Auto-selecting single item for {next_api}: {item_id}")
                        elif len(items) == 0:
                            return "You don't have any bookings to cancel."
                    
                    # Check for BOOK operation - ask user to select from available items
                    elif next_api in book_api_map and book_api_map[next_api] == api_id:
                        # Log item structure for debugging
                        if items:
                            logger.debug(f"First item keys: {items[0].keys() if items else 'empty'}")
                            logger.debug(f"First item data: {json.dumps(items[0], default=str)[:500] if items else 'empty'}")
                        
                        if len(items) > 1:
                            # Use LLM to filter/recommend items based on user's original request
                            filtered_items = await self._filter_items_by_user_request(user_input, items, next_api)
                            
                            if len(filtered_items) == 1:
                                # Only one matching item - auto-select it
                                item_id = self._extract_item_id(filtered_items[0], next_api)
                                if item_id:
                                    self.executed_data["_selected_item_id"] = item_id
                                    self.executed_data["_selected_item"] = filtered_items[0]
                                logger.info(f"Auto-selecting single matching item for {next_api}: {item_id}")
                            elif len(filtered_items) == 0:
                                return f"No items found matching your requirements. Please try different criteria."
                            else:
                                # Ask user to choose from filtered items
                                choice_question = self._format_booking_selection_question(next_api, filtered_items, user_input)
                                self.pending_followup = {
                                    "original_input": user_input,
                                    "apis": api_ids[i + 1:],
                                    "executed_data": self.executed_data.copy(),
                                    "selection_items": filtered_items,
                                    "selection_type": next_api
                                }
                                self.add_to_history("assistant", choice_question)
                                return choice_question
                        elif len(items) == 1:
                            # Only one item - auto-select it
                            item_id = self._extract_item_id(items[0], next_api)
                            if item_id:
                                self.executed_data["_selected_item_id"] = item_id
                                self.executed_data["_selected_item"] = items[0]
                            logger.info(f"Auto-selecting single item for booking {next_api}: {item_id}")
                        elif len(items) == 0:
                            return "No available items found to book."
            else:
                error_msg = response.get("error", str(response))
                errors[api_id] = error_msg
                logger.error(f"✗ {api_id} failed: {error_msg}")
        
        # LLM Call 3: Generate human-friendly response
        try:
            final_response = await llm_service.generate_response(user_input, results, errors)
        except Exception as e:
            logger.error(f"Response generation failed: {e}")
            if results and not errors:
                final_response = "✅ Done!"
            elif errors:
                final_response = f"⚠️ Some operations failed: {', '.join(errors.values())}"
            else:
                final_response = "❌ Could not complete the request."
        
        self.add_to_history("assistant", final_response)
        self.executed_data = {}
        
        return final_response
    
    def _clean_payload(self, payload: Dict) -> Dict:
        """Remove None/null values from payload"""
        cleaned = {}
        for key in ["body", "query_params", "path_params"]:
            if key in payload and payload[key]:
                cleaned[key] = {k: v for k, v in payload[key].items() if v is not None and v != "null"}
            else:
                cleaned[key] = {}
        return cleaned


# Global orchestrator
orchestrator = ChatbotOrchestrator()