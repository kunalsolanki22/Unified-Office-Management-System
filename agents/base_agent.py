"""
Base Agent - Abstract base class for all domain agents.
Provides common functionality for LLM interactions, API calls, and response generation.
"""

import json
import logging
import re
import time
from abc import ABC, abstractmethod
from typing import Optional, Dict, Any, List, Tuple
from dataclasses import dataclass, field
from enum import Enum

from services.llm_service import LLMService, ChatMessage, LLMResponse, get_llm_service
from services.kb_loader import KBLoader, DomainKnowledge, APIDefinition, get_kb_loader
from tools.api_client import APIClient, APIResponse

logger = logging.getLogger(__name__)


class ActionType(str, Enum):
    """Types of actions an agent can take."""
    RESPOND = "respond"              # Just respond with information
    API_CALL = "api_call"            # Make an API call
    CLARIFY = "clarify"              # Ask clarifying question
    FETCH_OPTIONS = "fetch_options"  # Fetch options from dependent API first
    HANDOFF = "handoff"              # Hand off to another agent
    ERROR = "error"                  # Report an error


@dataclass
class AgentContext:
    """Context passed to agents for processing."""
    user_message: str
    conversation_history: List[ChatMessage] = field(default_factory=list)
    user_info: Optional[Dict[str, Any]] = None
    pending_action: Optional[Dict[str, Any]] = None
    session_data: Optional[Dict[str, Any]] = None
    
    # Active conversation context
    conversation_id: Optional[str] = None
    conversation_title: Optional[str] = None
    conversation_summary: Optional[str] = None  # Summary of current conversation for context
    current_agent: Optional[str] = None  # Currently assigned agent for this conversation
    
    def to_dict(self) -> dict:
        return {
            "user_message": self.user_message,
            "conversation_history": [m.to_dict() for m in self.conversation_history],
            "user_info": self.user_info,
            "pending_action": self.pending_action,
            "session_data": self.session_data,
            "conversation_id": self.conversation_id,
            "conversation_title": self.conversation_title,
            "conversation_summary": self.conversation_summary,
            "current_agent": self.current_agent
        }


@dataclass
class AgentAction:
    """Action to be taken by the agent."""
    action_type: ActionType
    api_id: Optional[str] = None
    api_params: Optional[Dict[str, Any]] = None
    message: Optional[str] = None
    clarify_fields: Optional[List[str]] = None
    handoff_agent: Optional[str] = None
    confidence: float = 1.0
    reasoning: Optional[str] = None
    # For FETCH_OPTIONS action
    target_api_id: Optional[str] = None  # The API we're gathering params for
    dependent_api_id: Optional[str] = None  # The API to call to get options
    collected_params: Optional[Dict[str, Any]] = None  # Params already collected
    
    def to_dict(self) -> dict:
        return {
            "action_type": self.action_type.value,
            "api_id": self.api_id,
            "api_params": self.api_params,
            "message": self.message,
            "clarify_fields": self.clarify_fields,
            "handoff_agent": self.handoff_agent,
            "confidence": self.confidence,
            "reasoning": self.reasoning,
            "target_api_id": self.target_api_id,
            "dependent_api_id": self.dependent_api_id,
            "collected_params": self.collected_params
        }


@dataclass
class AgentResult:
    """Result from agent execution."""
    success: bool
    message: str
    action_taken: AgentAction
    api_response: Optional[APIResponse] = None
    needs_followup: bool = False
    followup_context: Optional[Dict[str, Any]] = None
    tokens_used: int = 0
    latency_ms: int = 0
    # Execution logging
    prompt_sent: Optional[str] = None
    llm_response: Optional[str] = None
    parsed_response: Optional[Dict[str, Any]] = None
    api_endpoint: Optional[str] = None
    api_method: Optional[str] = None
    request_payload: Optional[Dict[str, Any]] = None
    response_data: Optional[Dict[str, Any]] = None
    
    def to_dict(self) -> dict:
        return {
            "success": self.success,
            "message": self.message,
            "action_taken": self.action_taken.to_dict(),
            "api_response": self.api_response.to_dict() if self.api_response else None,
            "needs_followup": self.needs_followup,
            "followup_context": self.followup_context,
            "tokens_used": self.tokens_used,
            "latency_ms": self.latency_ms,
            "prompt_sent": self.prompt_sent,
            "llm_response": self.llm_response,
            "parsed_response": self.parsed_response,
            "api_endpoint": self.api_endpoint,
            "api_method": self.api_method,
            "request_payload": self.request_payload,
            "response_data": self.response_data
        }


class BaseAgent(ABC):
    """
    Abstract base class for all domain agents.
    
    Each domain agent handles a specific set of user intents and APIs.
    Agents use LLM to understand intent, extract parameters, and generate responses.
    
    Domain agents MUST override:
    - agent_id, agent_name, description
    - domain_names: List of domain names this agent handles
    - get_api_documentation(): Returns API docs for this agent's domains
    - get_agent_guidelines(): Returns agent-specific guidelines
    """
    
    def __init__(self, api_client: APIClient):
        """
        Initialize base agent.
        
        Args:
            api_client: Authenticated API client for backend calls
        """
        self.api_client = api_client
        self.llm_service = get_llm_service()
        self.kb_loader = get_kb_loader()
        self._domains: Optional[List[DomainKnowledge]] = None
    
    @property
    @abstractmethod
    def agent_id(self) -> str:
        """Unique identifier for this agent."""
        pass
    
    @property
    @abstractmethod
    def agent_name(self) -> str:
        """Human-readable name for this agent."""
        pass
    
    @property
    @abstractmethod
    def description(self) -> str:
        """Description of what this agent handles."""
        pass
    
    @property
    @abstractmethod
    def domain_names(self) -> List[str]:
        """List of domain names this agent handles from knowledge base."""
        pass
    
    @property
    def domains(self) -> List[DomainKnowledge]:
        """Get domains handled by this agent."""
        if self._domains is None:
            self._domains = []
            for name in self.domain_names:
                domain = self.kb_loader.get_domain(name)
                if domain:
                    self._domains.append(domain)
        return self._domains
    
    @property
    def available_apis(self) -> List[APIDefinition]:
        """Get all APIs available to this agent."""
        apis = []
        for domain in self.domains:
            apis.extend(domain.apis)
        return apis
    
    def get_system_prompt(self, context: AgentContext) -> str:
        """
        Generate the system prompt for this agent.
        Combines base prompt with agent-specific API docs and guidelines.
        
        Args:
            context: Current agent context
            
        Returns:
            System prompt string
        """
        # Build user context
        user_context = self._build_user_context(context)
        
        # Get API documentation from domain agent (fetched from KB)
        api_docs = self.get_api_documentation()
        
        # Get agent-specific guidelines (implemented by each domain agent)
        agent_guidelines = self.get_agent_guidelines()
        
        # Get current date for reference
        from datetime import date
        today = date.today().strftime("%Y-%m-%d")
        
        prompt = f"""## CRITICAL: OUTPUT FORMAT
You MUST respond with ONLY a valid JSON object. No text, no explanations, no markdown - ONLY JSON.
If you respond with anything other than pure JSON, the system will fail.

You are {self.agent_name}, a smart AI agent specialized in {self.description}.

## YOUR PRIMARY ROLE
Your main responsibilities are:
1. **Understand** the user's intent and gather ALL required information
2. **Use dependent APIs** to fetch options (rooms, desks, bookings) when needed
3. **Present options** to users when they need to select from a list
4. **Ask clarifying questions** for missing required fields
5. **Generate correct API payloads** only when ALL required data is collected

Today's Date: {today}

{user_context}

## Available APIs (from Knowledge Base)
{api_docs}

{agent_guidelines}

## SMART WORKFLOW - MULTI-STEP OPERATIONS

### When User Wants to Book/Create/Modify Something:
1. **IMMEDIATELY use fetch_options** to show available options (rooms, desks, etc.)
2. Do NOT ask clarifying questions BEFORE showing options
3. Present the options to user first, then ask for date/time/other details
4. Only call the final API when ALL required fields are collected

### CRITICAL: For booking requests like "book a room" or "book a desk":
- FIRST: Use fetch_options to show available rooms/desks
- THEN: Collect date, time, purpose in the same or follow-up message
- Do NOT ask "what is the purpose?" before showing options

### When to use each action_type:
- **fetch_options**: FIRST action for any booking request - show available options
- **clarify**: ONLY for simple info (date, time) AFTER showing options
- **api_call**: When ALL required fields are present and validated
- **respond**: For informational queries that don't require API calls

## STRICT RULES
1. **NEVER call APIs requiring fields without having those fields**
2. **ALWAYS use fetch_options FIRST for booking requests**
3. **DATE FORMAT**: YYYY-MM-DD (today is {today})
4. **TIME FORMAT**: HH:MM in 24-hour format
5. **Parse natural language dates/times correctly**
6. **INFER VALUES from user input** - analyze user's message to extract field values
7. **Only ask for truly missing required fields** - not what can be inferred from context
8. **Use API documentation mappings** to auto-detect enum values from natural language

## Response Format (JSON ONLY)
{{
    "action_type": "api_call" | "fetch_options" | "clarify" | "respond" | "handoff",
    "api_id": "api_id_to_call",  
    "target_api_id": "final_api_we_are_building_params_for",
    "dependent_api_id": "dependent_api_to_call_for_options",
    "api_params": {{ }},
    "collected_params": {{ }},
    "message": "Question to ask user OR info response",
    "clarify_fields": ["field1", "field2"],
    "confidence": 0.0-1.0,
    "reasoning": "Why this action"
}}

## CRITICAL DECISION RULES

### Rule 1: GET APIs without request_body
- Use action_type: "api_call" immediately
- Set api_params to empty object {{}}

### Rule 2: Booking Requests (MOST IMPORTANT)
- When user says "book a room", "book a desk", "reserve", etc.
- IMMEDIATELY use fetch_options with the list API (room_list, desk_list)
- Do NOT ask clarifying questions first
- Set target_api_id to the booking API (room_book, desk_book)
- Set api_id to the list API (room_list, desk_list)

### Rule 3: User Selection from Pending Context
- When pending_action has options_data with real items from API
- User responds with a number (like "2") or name
- Find the matching item in the options_data list
- Extract the ACTUAL UUID from item['id']
- Use that real UUID in your api_params

### Rule 4: Missing Required Fields (simple values only)
- Use action_type: "clarify" for dates, times, text fields
- Do NOT use clarify for IDs that need to come from APIs
- Store known values in collected_params

### Rule 5: API Params Must Match Documentation EXACTLY
- Field names exactly as documented
- IDs must be valid UUIDs from options_data
- Date: YYYY-MM-DD, Time: HH:MM (24-hour)
- Empty params = {{}} NOT null

## CRITICAL WARNINGS
- NEVER invent or hallucinate data (room names, desk IDs, booking IDs)
- NEVER show fake options to users - use fetch_options to get real data
- IDs are UUIDs like "a42f2066-1a21-4eda-b7b2-72679c0106d9", not "1234"
- If you need to show options, use fetch_options action to call the list API

IMPORTANT: Your response must be ONLY valid JSON. No text before or after. No explanations. No markdown. Just the raw JSON object starting with {{ and ending with }}.
"""
        return prompt
    
    @abstractmethod
    def get_api_documentation(self) -> str:
        """
        Get API documentation for this agent's domains from knowledge base.
        Each domain agent MUST implement this to fetch from KB dynamically.
        
        Returns:
            Formatted string with API documentation including request bodies
        """
        pass
    
    @abstractmethod
    def get_agent_guidelines(self) -> str:
        """
        Get agent-specific guidelines and instructions.
        Each domain agent must implement this.
        
        Returns:
            Formatted string with agent-specific guidelines
        """
        pass
    
    def _extract_important_data(self, messages: List[Any]) -> Dict[str, Any]:
        """
        Extract important data (UUIDs, dates, codes) from messages BEFORE truncation.
        This ensures critical context is never lost.
        
        Args:
            messages: List of conversation messages
            
        Returns:
            Dictionary of extracted important data
        """
        extracted = {
            "uuids": set(),
            "dates": set(),
            "codes": set(),  # DSK-*, CNF-*, TBL-*, PKG-*, ITR-*
            "selections": [],  # User selections like "option 2", "first one"
            "key_values": {}  # Key-value pairs like desk_id, room_id, start_date
        }
        
        for msg in messages:
            content = msg.content if hasattr(msg, 'content') else str(msg.get('content', ''))
            
            # Extract UUIDs
            uuids = re.findall(r'[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}', content, re.IGNORECASE)
            extracted["uuids"].update(uuids)
            
            # Extract dates (YYYY-MM-DD format)
            dates = re.findall(r'\d{4}-\d{2}-\d{2}', content)
            extracted["dates"].update(dates)
            
            # Extract resource codes (DSK-*, CNF-*, TBL-*, PKG-*, ITR-*)
            codes = re.findall(r'(DSK-\d+|CNF-\d+|TBL-\d+|PKG-\d+|ITR-[A-Z0-9-]+)', content, re.IGNORECASE)
            extracted["codes"].update(codes)
            
            # Extract key-value assignments (desk_id: xxx, room_id: xxx, etc.)
            kv_patterns = re.findall(r'(desk_id|room_id|table_id|booking_id|start_date|end_date|start_time|end_time)[:\s="\']+([^\s,\'"}\]]+)', content, re.IGNORECASE)
            for key, value in kv_patterns:
                extracted["key_values"][key.lower()] = value
        
        # Convert sets to lists for JSON serialization
        extracted["uuids"] = list(extracted["uuids"])[:10]  # Limit to 10
        extracted["dates"] = list(extracted["dates"])[:5]
        extracted["codes"] = list(extracted["codes"])[:10]
        
        return extracted

    def _summarize_old_context(self, messages: List[Any], max_recent: int = 6) -> str:
        """
        Use LLM to summarize older conversation messages while preserving critical data.
        Only called when conversation history exceeds max_recent messages.
        
        Args:
            messages: Full conversation history
            max_recent: Number of recent messages to keep intact
            
        Returns:
            Summarized context string
        """
        if len(messages) <= max_recent:
            return ""
        
        # Get older messages to summarize
        older_messages = messages[:-max_recent]
        
        # First, extract important data programmatically (fast, no LLM needed)
        extracted = self._extract_important_data(older_messages)
        
        # Build message content for summarization
        older_content = []
        for msg in older_messages[-10:]:  # Only summarize last 10 of older messages
            role = msg.role if hasattr(msg, 'role') else msg.get('role', 'unknown')
            content = msg.content if hasattr(msg, 'content') else msg.get('content', '')
            older_content.append(f"[{role.upper()}]: {content[:300]}")
        
        # If very short, just return extracted data
        if len(older_content) <= 2:
            summary_parts = []
            if extracted["uuids"]:
                summary_parts.append(f"Referenced IDs: {', '.join(extracted['uuids'][:5])}")
            if extracted["dates"]:
                summary_parts.append(f"Dates mentioned: {', '.join(extracted['dates'])}")
            if extracted["codes"]:
                summary_parts.append(f"Resource codes: {', '.join(extracted['codes'])}")
            if extracted["key_values"]:
                summary_parts.append(f"Collected values: {json.dumps(extracted['key_values'])}")
            return "\n".join(summary_parts) if summary_parts else ""
        
        # Use LLM for intelligent summarization
        try:
            summary_prompt = f"""Summarize this conversation snippet, PRESERVING ALL:
1. UUIDs (like a42f2066-1a21-4eda-b7b2-72679c0106d9)
2. Dates (YYYY-MM-DD format)
3. Resource codes (DSK-*, CNF-*, TBL-*, PKG-*, ITR-*)
4. User selections and choices
5. API parameters collected (desk_id, room_id, dates, times)

Conversation to summarize:
{chr(10).join(older_content)}

Already extracted data (MUST include in summary):
- UUIDs: {extracted['uuids']}
- Dates: {extracted['dates']}
- Codes: {extracted['codes']}
- Parameters: {json.dumps(extracted['key_values'])}

Provide a concise summary (max 200 words) that preserves ALL the above data."""

            response = self.llm_service.chat_with_system(
                system_prompt="You are a context summarizer. Extract and preserve ALL IDs, dates, codes, and parameters. Be concise but complete.",
                user_message=summary_prompt,
                temperature=0.1  # Low temperature for accuracy
            )
            
            summary = response.content.strip()
            
            # Validate that critical data is preserved
            for uuid in extracted["uuids"][:3]:
                if uuid not in summary:
                    summary += f"\n[Preserved UUID: {uuid}]"
            
            return summary
            
        except Exception as e:
            logger.warning(f"LLM summarization failed, using extracted data: {e}")
            # Fallback to extracted data only
            summary_parts = []
            if extracted["uuids"]:
                summary_parts.append(f"Referenced IDs: {', '.join(extracted['uuids'][:5])}")
            if extracted["dates"]:
                summary_parts.append(f"Dates mentioned: {', '.join(extracted['dates'])}")
            if extracted["codes"]:
                summary_parts.append(f"Resource codes: {', '.join(extracted['codes'])}")
            if extracted["key_values"]:
                summary_parts.append(f"Collected values: {json.dumps(extracted['key_values'])}")
            return "\n".join(summary_parts) if summary_parts else ""

    def _build_user_context(self, context: AgentContext) -> str:
        """Build user and conversation context section for prompt."""
        lines = ["## User Context"]
        
        if context.user_info:
            user = context.user_info
            lines.append(f"- User: {user.get('first_name', '')} {user.get('last_name', '')}")
            lines.append(f"- User Code: {user.get('user_code', 'Unknown')}")
            lines.append(f"- Email: {user.get('email', 'Unknown')}")
            lines.append(f"- Role: {user.get('role', 'employee')}")
            if user.get('department'):
                lines.append(f"- Department: {user['department']}")
        else:
            lines.append("- User information not available")
        
        # Active conversation context
        lines.append("")
        lines.append("## Current Conversation Context")
        if context.conversation_id:
            lines.append(f"- Conversation ID: {context.conversation_id}")
        if context.conversation_title:
            lines.append(f"- Topic: {context.conversation_title}")
        if context.conversation_summary:
            lines.append(f"- Conversation Summary: {context.conversation_summary}")
        if context.current_agent:
            lines.append(f"- Handling Agent: {context.current_agent}")
        
        # Smart conversation history with LLM summarization
        if context.conversation_history:
            max_recent = 6  # Keep last 6 messages intact
            
            # If history is long, summarize older messages
            if len(context.conversation_history) > max_recent:
                lines.append("")
                lines.append("## Summarized Earlier Context (important data preserved)")
                summary = self._summarize_old_context(context.conversation_history, max_recent)
                if summary:
                    lines.append(summary)
                
                # Also extract and show preserved data explicitly
                extracted = self._extract_important_data(context.conversation_history)
                if extracted["key_values"]:
                    lines.append("")
                    lines.append("## PRESERVED PARAMETERS (from earlier conversation)")
                    for key, value in extracted["key_values"].items():
                        lines.append(f"- {key}: {value}")
            
            # Recent messages (always show last N intact)
            lines.append("")
            lines.append("## Recent Conversation History")
            recent_messages = context.conversation_history[-max_recent:]
            for msg in recent_messages:
                role = msg.role.upper() if hasattr(msg, 'role') else 'UNKNOWN'
                content = msg.content if hasattr(msg, 'content') else str(msg.get('content', ''))
                # Truncate very long messages but keep IDs intact
                if len(content) > 300:
                    # Preserve any UUIDs in the content
                    uuids = re.findall(r'[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}', content, re.IGNORECASE)
                    content = content[:300] + "..."
                    if uuids:
                        content += f" [IDs: {', '.join(uuids[:3])}]"
                lines.append(f"- [{role}]: {content}")
        
        if context.pending_action:
            lines.append("")
            lines.append("## Pending Action (Multi-turn Context) - IMPORTANT!")
            lines.append("The user is responding to a previous question. Use this context!")
            lines.append(f"- Target API to call: {context.pending_action.get('pending_api', 'N/A')}")
            lines.append(f"- Already Collected Parameters: {json.dumps(context.pending_action.get('collected_params', {}))}")
            lines.append(f"- Still Missing: {context.pending_action.get('missing_fields', [])}")
            
            # Show available options if user needs to select
            options_data = context.pending_action.get('options_data')
            if options_data:
                lines.append("")
                lines.append("## Available Options (user should select from these)")
                # Extract items from options_data
                items = []
                if isinstance(options_data, list):
                    items = options_data
                elif isinstance(options_data, dict):
                    for key in ['items', 'data', 'results', 'records']:
                        if key in options_data and isinstance(options_data[key], list):
                            items = options_data[key]
                            break
                
                for i, item in enumerate(items[:15], 1):  # Show up to 15 options
                    if isinstance(item, dict):
                        item_id = item.get('id', '')
                        name = item.get('room_label') or item.get('desk_label') or item.get('name') or item.get('label') or f"Option {i}"
                        capacity = item.get('capacity', '')
                        lines.append(f"  {i}. {name} (ID: {item_id}){f' - Capacity: {capacity}' if capacity else ''}")
                
                lines.append("")
                lines.append("When user says a number (like '5'), match it to the option above and use its ID!")
        
        return "\n".join(lines)
    
    def process(self, context: AgentContext) -> AgentResult:
        """
        Process user input and return result.
        
        Args:
            context: Agent context with user message and history
            
        Returns:
            AgentResult with response and any actions taken
        """
        start_time = time.time()
        
        # Initialize execution logging variables
        self._last_prompt = None
        self._last_llm_response = None
        self._last_parsed_response = None
        self._last_api_endpoint = None
        self._last_api_method = None
        self._last_request_payload = None
        self._last_response_data = None
        
        try:
            # Step 1: Determine action from LLM
            action = self._determine_action(context)
            
            # Step 1.5: Auto-resolve user selection to actual IDs from options_data
            action = self._resolve_selection_to_id(action, context)
            
            # Step 2: Execute action
            result = self._execute_action(action, context)
            
            # Add timing info and execution logging
            result.latency_ms = int((time.time() - start_time) * 1000)
            result.prompt_sent = self._last_prompt
            result.llm_response = self._last_llm_response
            result.parsed_response = self._last_parsed_response
            result.api_endpoint = self._last_api_endpoint
            result.api_method = self._last_api_method
            result.request_payload = self._last_request_payload
            result.response_data = self._last_response_data
            
            return result
            
        except Exception as e:
            logger.error(f"Agent {self.agent_id} error: {e}", exc_info=True)
            return AgentResult(
                success=False,
                message=f"I encountered an error processing your request. Please try again.",
                action_taken=AgentAction(
                    action_type=ActionType.ERROR,
                    message=str(e)
                ),
                latency_ms=int((time.time() - start_time) * 1000),
                prompt_sent=self._last_prompt,
                llm_response=self._last_llm_response
            )
    
    def _resolve_selection_to_id(self, action: AgentAction, context: AgentContext) -> AgentAction:
        """
        Resolve user selection (number or name) to actual ID from options_data.
        This is a post-processing step to ensure correct IDs are used.
        
        Args:
            action: The action determined by LLM
            context: Agent context with pending_action containing options_data
            
        Returns:
            AgentAction with resolved IDs in api_params
        """
        if not context.pending_action:
            return action
        
        options_data = context.pending_action.get('options_data')
        if not options_data:
            return action
        
        # Extract items from options_data
        items = []
        if isinstance(options_data, list):
            items = options_data
        elif isinstance(options_data, dict):
            for key in ['items', 'data', 'results', 'records']:
                if key in options_data and isinstance(options_data[key], list):
                    items = options_data[key]
                    break
        
        if not items:
            return action
        
        # Check if user message is a number (selection)
        user_msg = context.user_message.strip()
        selected_item = None
        
        # Try to match by number
        try:
            selection_num = int(user_msg)
            if 1 <= selection_num <= len(items):
                selected_item = items[selection_num - 1]
                logger.info(f"User selected option {selection_num}, resolved to item: {selected_item.get('id')}")
        except ValueError:
            # Try to match by name
            user_msg_lower = user_msg.lower()
            for item in items:
                item_name = (item.get('desk_label') or item.get('room_label') or 
                           item.get('name') or item.get('label', '')).lower()
                if user_msg_lower in item_name or item_name in user_msg_lower:
                    selected_item = item
                    logger.info(f"User selected by name '{user_msg}', resolved to item: {selected_item.get('id')}")
                    break
        
        if selected_item and selected_item.get('id'):
            # Determine which param field to use based on the API
            pending_api = context.pending_action.get('pending_api', '')
            
            # Map API to the correct parameter name and structure type
            # Format: api_id -> (param_name, is_nested_array)
            # is_nested_array: True means param should be wrapped in {items: [{param_name: id, quantity: 1}]}
            param_mappings = {
                'desk_book': ('desk_id', False),
                'room_book': ('room_id', False),
                'food_order': ('food_item_id', True),  # Nested array structure
                'food_create_order': ('food_item_id', True),  # Alternative API name
                'table_book': ('table_id', False),
            }
            
            mapping = param_mappings.get(pending_api)
            if mapping:
                param_name, is_nested_array = mapping
                
                # Update api_params with the correct ID
                if action.api_params is None:
                    action.api_params = {}
                
                if is_nested_array:
                    # For APIs like food_order that need nested array structure
                    # Structure: {items: [{food_item_id: uuid, quantity: 1}]}
                    quantity = action.api_params.get('quantity', 1)
                    special_instructions = action.api_params.get('special_instructions', '')
                    
                    item_entry = {
                        param_name: selected_item['id'],
                        'quantity': quantity if isinstance(quantity, int) else 1
                    }
                    if special_instructions:
                        item_entry['special_instructions'] = special_instructions
                    
                    action.api_params = {'items': [item_entry]}
                    logger.info(f"Built nested items array for {pending_api}: {action.api_params}")
                else:
                    # Standard flat parameter structure
                    action.api_params[param_name] = selected_item['id']
                
                # Also update collected_params
                if action.collected_params is None:
                    action.collected_params = {}
                action.collected_params[param_name] = selected_item['id']
                
                # Merge any previously collected params (for non-nested only)
                if not is_nested_array:
                    prev_collected = context.pending_action.get('collected_params', {})
                    for k, v in prev_collected.items():
                        if k not in action.api_params:
                            action.api_params[k] = v
                            action.collected_params[k] = v
                
                logger.info(f"Resolved {param_name}={selected_item['id']} for API {pending_api}")
        
        return action
    
    def _determine_action(self, context: AgentContext) -> AgentAction:
        """
        Use LLM to determine what action to take.
        
        Args:
            context: Agent context
            
        Returns:
            AgentAction to execute
        """
        system_prompt = self.get_system_prompt(context)
        
        # Save prompt for logging
        self._last_prompt = system_prompt
        
        # Include conversation history (limited)
        history = context.conversation_history[-10:] if context.conversation_history else []
        
        response = self.llm_service.chat_with_system(
            system_prompt=system_prompt,
            user_message=context.user_message,
            conversation_history=history
        )
        
        # Save raw LLM response for logging
        self._last_llm_response = response.content
        
        # Parse LLM response
        parsed = self.llm_service.parse_json_response(response)
        
        # Save parsed response for logging
        self._last_parsed_response = parsed
        
        if not parsed:
            logger.warning(f"Failed to parse LLM response: {response.content[:500]}")
            raw_content = response.content.strip()
            
            # Check if LLM is hallucinating fake data (IDs like 1234, 5678, etc.)
            import re
            fake_id_pattern = r'\b(ID:\s*\d{4}|ID:\s*\d+\))'
            if re.search(fake_id_pattern, raw_content):
                logger.warning("LLM hallucinated fake IDs - rejecting response")
                return AgentAction(
                    action_type=ActionType.RESPOND,
                    message="Let me fetch the actual available options for you. Please wait...",
                    confidence=0.5
                )
            
            # If LLM gave a conversational response that looks like a question, use it
            if raw_content and len(raw_content) > 20 and not raw_content.startswith('{'):
                # Check if it contains question markers
                is_question = any(q in raw_content.lower() for q in ['?', 'please', 'what', 'which', 'when', 'would you', 'can you', 'could you'])
                if is_question:
                    logger.info("Using LLM's conversational response as clarification")
                    return AgentAction(
                        action_type=ActionType.CLARIFY,
                        message=raw_content,
                        confidence=0.6
                    )
            
            return AgentAction(
                action_type=ActionType.RESPOND,
                message="I'm sorry, I didn't quite understand that. Could you please rephrase your request?",
                confidence=0.5
            )
        
        logger.info(f"LLM Decision: action_type={parsed.get('action_type')}, api_id={parsed.get('api_id')}, reasoning={parsed.get('reasoning')}")
        logger.debug(f"Full LLM response: {parsed}")
        
        # Convert to AgentAction
        action_type_str = parsed.get("action_type", "respond")
        try:
            action_type = ActionType(action_type_str)
        except ValueError:
            action_type = ActionType.RESPOND
        
        return AgentAction(
            action_type=action_type,
            api_id=parsed.get("api_id"),
            api_params=parsed.get("api_params", {}),
            message=parsed.get("message", ""),
            clarify_fields=parsed.get("clarify_fields"),
            handoff_agent=parsed.get("handoff_agent"),
            confidence=parsed.get("confidence", 0.8),
            reasoning=parsed.get("reasoning"),
            target_api_id=parsed.get("target_api_id"),
            dependent_api_id=parsed.get("dependent_api_id"),
            collected_params=parsed.get("collected_params", {})
        )
    
    def _execute_action(self, action: AgentAction, context: AgentContext) -> AgentResult:
        """
        Execute the determined action.
        
        Args:
            action: Action to execute
            context: Agent context
            
        Returns:
            AgentResult
        """
        if action.action_type == ActionType.API_CALL:
            return self._execute_api_call(action, context)
        
        elif action.action_type == ActionType.FETCH_OPTIONS:
            return self._execute_fetch_options(action, context)
        
        elif action.action_type == ActionType.CLARIFY:
            return AgentResult(
                success=True,
                message=action.message,
                action_taken=action,
                needs_followup=True,
                followup_context={
                    "pending_api": action.api_id or action.target_api_id,
                    "collected_params": action.api_params or action.collected_params or {},
                    "missing_fields": action.clarify_fields
                }
            )
        
        elif action.action_type == ActionType.HANDOFF:
            return AgentResult(
                success=True,
                message=action.message,
                action_taken=action,
                needs_followup=True,
                followup_context={
                    "handoff_to": action.handoff_agent,
                    "original_message": context.user_message
                }
            )
        
        else:  # RESPOND or ERROR
            return AgentResult(
                success=True,
                message=action.message,
                action_taken=action
            )
    
    def _execute_fetch_options(self, action: AgentAction, context: AgentContext) -> AgentResult:
        """
        Execute a fetch_options action - calls a dependent API to get options for the user.
        
        Args:
            action: Action with dependent API details
            context: Agent context
            
        Returns:
            AgentResult with options formatted for user selection
        """
        dependent_api_id = action.dependent_api_id or action.api_id
        if not dependent_api_id:
            return AgentResult(
                success=False,
                message="I need to fetch some options but couldn't determine which API to call.",
                action_taken=action
            )
        
        api_def = self.kb_loader.get_api(dependent_api_id)
        if not api_def:
            return AgentResult(
                success=False,
                message=f"I couldn't find the API to fetch options. Please try again.",
                action_taken=action
            )
        
        # Make the API call to get options
        try:
            endpoint = api_def.endpoint
            method = api_def.method.upper()
            params = action.api_params or {}
            
            # Substitute path parameters if any
            for key, value in params.items():
                placeholder = f"{{{key}}}"
                if placeholder in endpoint:
                    endpoint = endpoint.replace(placeholder, str(value))
            
            # Save API details for logging
            self._last_api_endpoint = endpoint
            self._last_api_method = method
            self._last_request_payload = params
            
            # Most fetch operations are GET
            if method in ["GET", "DELETE"]:
                api_response = self.api_client.request(method, endpoint, params=params)
            else:
                api_response = self.api_client.request(method, endpoint, data=params)
            
            # Save response for logging
            self._last_response_data = api_response.to_dict()
            
            if not api_response.success:
                return AgentResult(
                    success=False,
                    message=f"I couldn't fetch the available options: {api_response.error}",
                    action_taken=action
                )
            
            # Format options for user selection
            options_message = self._format_options_for_user(
                api_def, api_response, action, context
            )
            
            return AgentResult(
                success=True,
                message=options_message,
                action_taken=action,
                api_response=api_response,
                needs_followup=True,
                followup_context={
                    "pending_api": action.target_api_id,
                    "dependent_api": dependent_api_id,
                    "collected_params": action.collected_params or {},
                    "missing_fields": action.clarify_fields or [],
                    "options_data": api_response.data  # Store the options for selection
                }
            )
            
        except Exception as e:
            logger.error(f"Fetch options failed: {e}")
            return AgentResult(
                success=False,
                message=f"I encountered an error while fetching options: {str(e)}",
                action_taken=action
            )
    
    def _format_options_for_user(self, 
                                  api_def: APIDefinition,
                                  api_response: APIResponse,
                                  action: AgentAction,
                                  context: AgentContext) -> str:
        """
        Format fetched options into a user-friendly message with selection guidance.
        Uses simple formatting to avoid additional LLM calls (rate limit issues).
        
        Args:
            api_def: API definition for the dependent API
            api_response: Response with options data
            action: The action that triggered this
            context: Agent context
            
        Returns:
            Formatted message with options
        """
        user_name = ""
        if context.user_info:
            user_name = context.user_info.get('first_name', '')
        
        # Get target API info for context
        target_api_name = ""
        if action.target_api_id:
            target_api_def = self.kb_loader.get_api(action.target_api_id)
            if target_api_def:
                target_api_name = target_api_def.name
        
        # Extract items from response
        items = []
        if api_response.data:
            if isinstance(api_response.data, list):
                items = api_response.data
            elif isinstance(api_response.data, dict):
                # Look for common list keys
                for key in ['items', 'data', 'results', 'records']:
                    if key in api_response.data and isinstance(api_response.data[key], list):
                        items = api_response.data[key]
                        break
        
        # Get display format from dependent_apis config if available
        target_api_def = self.kb_loader.get_api(action.target_api_id) if action.target_api_id else None
        display_format = None
        extract_field = "id"
        
        if target_api_def and target_api_def.dependent_apis_config:
            # Find the dependent API config (with full info including display_format)
            for dep_config in target_api_def.dependent_apis_config:
                if isinstance(dep_config, dict) and dep_config.get('api_id') == api_def.id:
                    display_format = dep_config.get('display_format')
                    extract_field = dep_config.get('extract_field', 'id')
                    break
        
        # Build message without LLM to avoid rate limits
        lines = []
        
        # Greeting
        greeting = f"Hi {user_name}!" if user_name else "Hi there!"
        lines.append(greeting)
        lines.append("")
        
        # Context for what we're doing
        if target_api_name:
            lines.append(f"To **{target_api_name}**, here are your options:\n")
        else:
            lines.append("Here are the available options:\n")
        
        if not items:
            lines.append("*No options available at the moment.*")
            return "\n".join(lines)
        
        # Format each item
        for i, item in enumerate(items[:15], 1):  # Limit to 15 items
            if isinstance(item, dict):
                # Try to format using display_format template
                if display_format:
                    try:
                        line = display_format.format(**item)
                        lines.append(f"{i}. {line}")
                        continue
                    except (KeyError, ValueError):
                        pass
                
                # Fallback: smart field detection
                # For rooms (listing available rooms)
                if 'room_label' in item and 'booking_date' not in item:
                    label = item.get('room_label') or item.get('room_code', 'Room')
                    if label == 'string':  # Handle bad data
                        label = item.get('room_code', 'Room')
                    capacity = item.get('capacity', '?')
                    features = []
                    if item.get('has_projector'):
                        features.append("📽 Projector")
                    if item.get('has_video_conferencing'):
                        features.append("📹 Video")
                    if item.get('has_whiteboard'):
                        features.append("📝 Whiteboard")
                    feature_str = ", ".join(features) if features else "Standard"
                    lines.append(f"{i}. {label} (Capacity: {capacity}) - {feature_str}")
                
                # For bookings (room bookings with booking_date)
                elif 'booking_date' in item:
                    title = item.get('title', 'Booking')
                    if title == 'string':  # Handle bad data
                        title = 'Meeting'
                    date = item.get('booking_date', '')
                    start = item.get('start_time', '')[:5] if item.get('start_time') else ''
                    end = item.get('end_time', '')[:5] if item.get('end_time') else ''
                    room = item.get('room_label') or item.get('room_code') or item.get('desk_label') or ''
                    if room == 'string':  # Handle bad data
                        room = item.get('room_code', '')
                    status = item.get('status', '').upper()
                    status_emoji = {"PENDING": "⏳", "CONFIRMED": "✅", "CANCELLED": "❌"}.get(status, "")
                    lines.append(f"{i}. {status_emoji} [{status}] {title} - {date} ({start}-{end}) in {room}")
                
                # For desks
                elif 'desk_label' in item or 'desk_code' in item:
                    label = item.get('desk_label') or item.get('desk_code', 'Desk')
                    floor = item.get('floor', '')
                    status = item.get('status', '')
                    lines.append(f"{i}. {label}" + (f" - Floor {floor}" if floor else "") + (f" ({status})" if status else ""))
                
                # For food items
                elif 'price' in item:
                    name = item.get('name') or item.get('item_name', 'Item')
                    price = item.get('price', 0)
                    available = "✅" if item.get('is_available', True) else "❌"
                    lines.append(f"{i}. {available} {name} - ₹{price}")
                
                # Generic fallback
                else:
                    name = item.get('name') or item.get('label') or item.get('title') or f"Option {i}"
                    lines.append(f"{i}. {name}")
            else:
                lines.append(f"{i}. {item}")
        
        if len(items) > 15:
            lines.append(f"\n*... and {len(items) - 15} more*")
        
        lines.append("\nPlease reply with the **number** or **name** of your choice.")
        
        # Add info about missing fields
        if action.clarify_fields:
            other_fields = [f for f in action.clarify_fields if f not in ['id', extract_field, 'selection']]
            if other_fields:
                lines.append(f"Also, please provide: {', '.join(other_fields)}")
        
        return "\n".join(lines)
    
    def _resolve_item_name_to_id(self, action: AgentAction, context: AgentContext) -> AgentAction:
        """
        For APIs that need item IDs (like food_order), if the LLM provided an item name
        instead of UUID, fetch the dependent API data and resolve the name to ID.
        
        This handles the case when user says "order tea" directly without going through
        the fetch_options flow first.
        
        Args:
            action: Action with api_params that may contain names instead of UUIDs
            context: Agent context
            
        Returns:
            AgentAction with resolved UUIDs in api_params
        """
        if action.action_type != ActionType.API_CALL or not action.api_id:
            return action
        
        # Define which APIs need ID resolution and their dependent APIs
        # Format: api_id -> (dependent_api_id, param_name_to_resolve, name_field_in_response)
        resolution_config = {
            'food_order': ('food_menu', 'food_item_id', 'name'),
            'food_create_order': ('food_menu', 'food_item_id', 'name'),
        }
        
        config = resolution_config.get(action.api_id)
        if not config:
            return action
        
        dependent_api, param_name, name_field = config
        
        # Check if we need to resolve - look for non-UUID values that should be UUIDs
        params = action.api_params or {}
        
        # For food_order, check the items array
        if action.api_id in ['food_order', 'food_create_order']:
            items = params.get('items', [])
            if not items:
                # LLM might have put food_item_id at top level - handle that
                item_id = params.get('food_item_id') or params.get('item_id')
                if item_id:
                    items = [{'food_item_id': item_id, 'quantity': params.get('quantity', 1)}]
            
            needs_resolution = False
            item_to_resolve = None
            
            for item in items:
                item_id = item.get('food_item_id') or item.get('item_id')
                if item_id and not self._is_valid_uuid(str(item_id)):
                    needs_resolution = True
                    item_to_resolve = str(item_id)  # This is likely a name like "tea"
                    break
            
            if needs_resolution and item_to_resolve:
                logger.info(f"Resolving item name '{item_to_resolve}' to UUID via {dependent_api}")
                
                # Fetch the dependent API data
                dep_api_def = self.kb_loader.get_api(dependent_api)
                if dep_api_def:
                    try:
                        response = self.api_client.request("GET", dep_api_def.endpoint)
                        if response.success:
                            # Extract items from response
                            data = response.data
                            api_items = []
                            if isinstance(data, list):
                                api_items = data
                            elif isinstance(data, dict):
                                for key in ['items', 'data', 'results', 'records']:
                                    if key in data and isinstance(data[key], list):
                                        api_items = data[key]
                                        break
                            
                            # Find matching item by name
                            item_to_resolve_lower = item_to_resolve.lower()
                            for api_item in api_items:
                                item_name = str(api_item.get(name_field, '')).lower()
                                if item_name and (item_to_resolve_lower in item_name or item_name in item_to_resolve_lower):
                                    resolved_id = api_item.get('id')
                                    if resolved_id:
                                        logger.info(f"Resolved '{item_to_resolve}' to UUID: {resolved_id}")
                                        
                                        # Update the action params with correct structure
                                        quantity = items[0].get('quantity', 1) if items else 1
                                        action.api_params = {
                                            'items': [{
                                                'food_item_id': resolved_id,
                                                'quantity': quantity if isinstance(quantity, int) else 1
                                            }]
                                        }
                                        return action
                            
                            logger.warning(f"Could not find item matching '{item_to_resolve}' in {dependent_api} response")
                    except Exception as e:
                        logger.error(f"Error fetching dependent API {dependent_api}: {e}")
        
        return action
    
    def _is_valid_uuid(self, value: str) -> bool:
        """Check if a string is a valid UUID."""
        import re
        uuid_pattern = r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        return bool(re.match(uuid_pattern, value.lower()))
    
    def _execute_api_call(self, action: AgentAction, context: AgentContext) -> AgentResult:
        """
        Execute an API call.
        
        Args:
            action: Action with API details
            context: Agent context
            
        Returns:
            AgentResult with API response
        """
        api_def = self.kb_loader.get_api(action.api_id)
        if not api_def:
            logger.error(f"API not found in KB: {action.api_id}")
            return AgentResult(
                success=False,
                message=f"I couldn't find the API to perform this action. Please try again.",
                action_taken=action
            )
        
        # Resolve item names to IDs if needed (fetches from dependent API)
        action = self._resolve_item_name_to_id(action, context)
        
        # Make the API call
        try:
            endpoint = api_def.endpoint
            method = api_def.method.upper()
            
            logger.info(f"Executing API: {action.api_id} - {method} {endpoint}")
            logger.debug(f"API params: {action.api_params}")
            
            # Substitute path parameters if any
            params = action.api_params or {}
            for key, value in params.items():
                placeholder = f"{{{key}}}"
                if placeholder in endpoint:
                    endpoint = endpoint.replace(placeholder, str(value))
            
            # Save API details for logging
            self._last_api_endpoint = endpoint
            self._last_api_method = method
            self._last_request_payload = params
            
            # For GET/DELETE, only pass non-path params as query params
            # For POST/PUT/PATCH, pass all params in body
            if method in ["GET", "DELETE"]:
                # Filter out path params from query params
                query_params = {k: v for k, v in params.items() if f"{{{k}}}" not in api_def.endpoint}
                logger.debug(f"Making {method} request to {endpoint} with query params: {query_params}")
                api_response = self.api_client.request(method, endpoint, params=query_params if query_params else None)
            else:
                logger.debug(f"Making {method} request to {endpoint} with body: {params}")
                api_response = self.api_client.request(method, endpoint, data=params if params else None)
            
            logger.info(f"API response: success={api_response.success}, status={api_response.status_code}")
            
            # Save response data for logging
            self._last_response_data = api_response.to_dict()
            
            # Generate response message based on API result
            response_message = self._generate_api_response_message(
                api_def, api_response, context
            )
            
            return AgentResult(
                success=api_response.success,
                message=response_message,
                action_taken=action,
                api_response=api_response
            )
            
        except Exception as e:
            logger.error(f"API call failed: {e}", exc_info=True)
            return AgentResult(
                success=False,
                message=f"I encountered an error while processing your request: {str(e)}",
                action_taken=action
            )
    
    def _generate_api_response_message(self, 
                                        api_def: APIDefinition,
                                        api_response: APIResponse,
                                        context: AgentContext) -> str:
        """
        Generate a human-like conversational response from API result.
        This is the "Conversation Agent" logic - creates natural, friendly responses.
        
        Args:
            api_def: API definition
            api_response: Response from API
            context: Agent context
            
        Returns:
            Human-like conversational message
        """
        # Build conversation context for better response
        conversation_context = ""
        if context.conversation_summary:
            conversation_context = f"\nConversation Context: {context.conversation_summary}"
        
        user_name = ""
        if context.user_info:
            user_name = context.user_info.get('first_name', '')
        
        prompt = f"""You are a friendly conversational AI assistant. Convert this API response into a natural, human-like message.

## User Info
- Name: {user_name if user_name else 'User'}
{conversation_context}

## API Execution Details
- Action Performed: {api_def.name}
- Description: {api_def.description}
- Success: {api_response.success}
- Response Data: {json.dumps(api_response.data, indent=2) if api_response.data else 'No data'}
- Error (if any): {api_response.error if api_response.error else 'None'}

## User's Original Request
"{context.user_message}"

## Instructions for Response
1. **Be conversational**: Respond like a helpful colleague, not a robot
2. **Use the user's name** if available to make it personal
3. **Be concise but complete**: Include relevant details without being verbose
4. **Format nicely**: Use bullet points or line breaks for lists/multiple items
5. **Success responses**: Confirm what was done, provide key details
6. **Failure responses**: 
   - Be empathetic ("I'm sorry...")
   - Explain what went wrong in simple terms
   - Suggest what the user can do next
7. **Don't expose technical jargon**: No status codes, API names, or internal details
8. **Ask if they need anything else** when appropriate

Respond with ONLY the conversational message, no JSON or formatting markers.
"""
        
        try:
            response = self.llm_service.chat_with_system(
                system_prompt="You are a friendly, empathetic conversational AI that creates natural human-like responses from structured data.",
                user_message=prompt,
                temperature=0.7
            )
            return response.content
        except Exception as e:
            logger.error(f"Failed to generate response message: {e}")
            # Fallback to simple message
            if api_response.success:
                return f"Done! {api_def.name} completed successfully."
            else:
                return f"Sorry, {api_def.name} failed: {api_response.error}"
    
    @abstractmethod
    def get_greeting(self) -> str:
        """Get a greeting message for when this agent is activated."""
        pass
