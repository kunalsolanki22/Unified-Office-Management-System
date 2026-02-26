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
    
    def _format_api_docs_compact(self) -> str:
        """
        Generate compact API documentation to minimize tokens.
        Uses abbreviated format instead of verbose JSON dumps.
        Includes enum values for fields that have them.
        """
        lines = []
        for domain in self.domains:
            for api in domain.apis:
                # Compact single-line format: id | method endpoint | required_fields | dependent_apis
                fields = []
                field_enums = []  # Track enum values for fields
                if api.request_body and api.request_body.get("required_fields"):
                    for f in api.request_body["required_fields"]:
                        if isinstance(f, dict):
                            fname = f.get('name', '')
                            fsource = f.get('source', '')
                            fenum = f.get('enum', [])
                            if fsource == 'dependent_api':
                                fields.append(f"{fname}*")  # * marks dependent field
                            else:
                                fields.append(fname)
                            # Track enums for this field
                            if fenum:
                                field_enums.append(f"{fname}=[{','.join(fenum)}]")
                        else:
                            fields.append(str(f))
                
                optional = []
                if api.request_body and api.request_body.get("optional_fields"):
                    for f in api.request_body["optional_fields"]:
                        if isinstance(f, dict):
                            optional.append(f.get('name', ''))
                        else:
                            optional.append(str(f))
                
                deps = ','.join(api.dependent_apis) if api.dependent_apis else '-'
                req_str = ','.join(fields) if fields else '-'
                opt_str = ','.join(optional) if optional else ''
                
                line = f"• {api.id}: {api.method} {api.endpoint}"
                if req_str != '-':
                    line += f" | req:[{req_str}]"
                if opt_str:
                    line += f" | opt:[{opt_str}]"
                if deps != '-':
                    line += f" | deps:{deps}"
                # Add enum values on next line if any exist
                if field_enums:
                    line += f"\n  enums: {' | '.join(field_enums)}"
                
                lines.append(line)
        
        return "\n".join(lines)

    def _parse_llm_response(self, content: str) -> Optional[Dict[str, Any]]:
        """
        Parse JSON from LLM response string.
        Handles markdown code blocks, raw JSON, and JSON embedded in text.
        
        Args:
            content: Raw LLM response content string
            
        Returns:
            Parsed JSON dict or None if parsing fails
        """
        import json
        import re
        
        if not content:
            return None
        
        content = content.strip()
        
        # Try to extract JSON from markdown code blocks
        if "```json" in content:
            start = content.find("```json") + 7
            end = content.find("```", start)
            if end > start:
                content = content[start:end].strip()
        elif "```" in content:
            start = content.find("```") + 3
            end = content.find("```", start)
            if end > start:
                content = content[start:end].strip()
        
        # Try to find JSON object in the content
        json_match = re.search(r'\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}', content, re.DOTALL)
        if json_match:
            content = json_match.group()
        
        try:
            return json.loads(content)
        except json.JSONDecodeError:
            logger.warning(f"Failed to parse LLM response as JSON: {content[:200]}...")
            return None
    
    def _call_llm_and_track_tokens(
        self, 
        system_prompt: str, 
        user_message: str, 
        conversation_history: Optional[List] = None,
        temperature: float = 0.7
    ):
        """
        Call LLM service and track token usage from Groq API.
        
        Args:
            system_prompt: System prompt for LLM
            user_message: User message to send
            conversation_history: Optional conversation history
            temperature: LLM temperature setting
            
        Returns:
            LLMResponse object with content and token info
        """
        response = self.llm_service.chat_with_system(
            system_prompt=system_prompt,
            user_message=user_message,
            conversation_history=conversation_history,
            temperature=temperature
        )
        
        # Track tokens from Groq API - accumulate across all LLM calls for this request
        tokens = response.tokens_used or 0
        self._total_tokens = getattr(self, '_total_tokens', 0) + tokens
        logger.info(f"LLM call used {tokens} tokens (total: {self._total_tokens})")
        
        return response
    
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
        
        prompt = f"""OUTPUT: Valid JSON only. No text/markdown before or after.

You are {self.agent_name} ({self.description}). Today: {today}

{user_context}

## APIs (ONLY use these)
{api_docs}
Note: Fields marked with * (e.g., table_id*, room_id*, desk_id*, food_item_id*, order_id, asset_id, etc) REQUIRE fetch_options first.

{agent_guidelines}

## CRITICAL: UUID Fields Rule
APIs with fields like table_id, room_id, desk_id, food_item_id, booking_id CANNOT be called directly.
You MUST use fetch_options to get the UUID first, even if user says "any" or "first available".
User NEVER knows UUIDs - they only know names/numbers shown to them.

## Action Decision Tree
1. Does API need UUID field (table_id, room_id, desk_id, food_item_id)?
   - YES + Have UUID from options_data in pending_action? → api_call with that UUID
   - YES + No UUID yet? → fetch_options (ALWAYS, no exceptions)
2. Missing date/time/text only? → clarify
3. Info query, no API needed? → respond
4. All data ready, no UUID needed? → api_call

## Response JSON Schema
{{"action_type": "api_call|fetch_options|clarify|respond|handoff",
  "api_id": "list_api_for_fetch OR target_api_for_call",
  "target_api_id": "final_api_we_need_params_for",
  "dependent_api_id": "list_api_to_call_for_options",
  "api_params": {{}},
  "collected_params": {{"booking_date": "2026-02-25", "start_time": "14:00", "end_time": "16:00"}},
  "message": "user message",
  "clarify_fields": [],
  "confidence": 0.9,
  "reasoning": "brief"}}

## Key Rules
- NEVER invent UUIDs - they MUST come from options_data
- If user says "any table/room/desk" → use fetch_options, then auto-select first available
- Dates: YYYY-MM-DD | Times: HH:MM (24h)
- Store collected info in collected_params for use after fetch
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

            response = self._call_llm_and_track_tokens(
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
        self._total_tokens = 0  # Track total tokens used across all LLM calls
        
        try:
            # Step 0: Check if user is responding to a pending selection (number or simple confirmation)
            # If so, handle directly without calling LLM to avoid wrong API decisions
            direct_action = self._try_direct_selection_handling(context)
            if direct_action:
                logger.info(f"Handled user selection directly without LLM: {direct_action.api_id}")
                action = direct_action
            else:
                # Step 1: Determine action from LLM
                action = self._determine_action(context)
                
                # Step 1.5: Auto-resolve user selection to actual IDs from options_data
                action = self._resolve_selection_to_id(action, context)
            
            # Step 2: Execute action
            result = self._execute_action(action, context)
            
            # Add timing info, token count, and execution logging
            result.latency_ms = int((time.time() - start_time) * 1000)
            result.tokens_used = self._total_tokens  # Total tokens from all LLM calls
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
                tokens_used=self._total_tokens if hasattr(self, '_total_tokens') else 0,
                latency_ms=int((time.time() - start_time) * 1000),
                prompt_sent=self._last_prompt,
                llm_response=self._last_llm_response
            )
    
    def _try_direct_selection_handling(self, context: AgentContext) -> Optional[AgentAction]:
        """
        Handle user selection from previously shown options.
        
        OPTIMIZATION: Uses regex for simple selections (numbers, "first", "last")
        to avoid LLM calls. Only uses LLM for complex selections.
        
        Returns AgentAction if selection can be handled, None otherwise.
        """
        if not context.pending_action:
            return None
        
        pending_api = context.pending_action.get('pending_api')
        options_data = context.pending_action.get('options_data')
        
        if not pending_api or not options_data:
            return None
        
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
            return None
        
        user_msg = context.user_message.strip().lower()
        selected_item = None
        quantity = 1
        
        # FAST PATH: Try regex matching first (no LLM call)
        # Pattern: "3" or "3 items" or "option 3" or "number 3"
        num_match = re.match(r'^(?:option\s*|number\s*|#\s*)?(\d+)(?:\s+.*)?$', user_msg)
        if num_match:
            idx = int(num_match.group(1))
            if 1 <= idx <= len(items):
                selected_item = items[idx - 1]
                logger.info(f"Fast path: Selected item {idx} via regex")
        
        # Pattern: "first" or "last"
        if not selected_item:
            if user_msg in ['first', 'the first', 'first one', '1st']:
                selected_item = items[0]
            elif user_msg in ['last', 'the last', 'last one']:
                selected_item = items[-1]
        
        # Pattern: "2 dal makhani" or "3 of item 2"
        if not selected_item:
            qty_match = re.match(r'^(\d+)\s+(?:of\s+)?(?:item\s+)?(\d+)$', user_msg)
            if qty_match:
                quantity = int(qty_match.group(1))
                idx = int(qty_match.group(2))
                if 1 <= idx <= len(items):
                    selected_item = items[idx - 1]
        
        # Pattern: exact name match (case insensitive)
        if not selected_item:
            for item in items:
                item_name = (item.get('name') or item.get('food_name') or 
                            item.get('room_label') or item.get('desk_label') or 
                            item.get('table_label') or '').lower()
                if item_name and item_name == user_msg:
                    selected_item = item
                    break
        
        # If fast path succeeded, build action directly
        if selected_item:
            item_id = selected_item.get('id') or selected_item.get('uuid')
            item_name = (selected_item.get('name') or selected_item.get('food_name') or 
                        selected_item.get('room_label') or selected_item.get('desk_label') or 
                        selected_item.get('table_label') or 'item')
            
            if item_id:
                return self._build_selection_action(pending_api, item_id, item_name, quantity, context)
        
        # SLOW PATH: Use LLM for complex selections (fuzzy matching, partial names)
        return self._llm_selection_handling(context, items, pending_api)
    
    def _build_selection_action(self, pending_api: str, item_id: str, item_name: str, 
                                 quantity: int, context: AgentContext) -> AgentAction:
        """Build AgentAction from selected item."""
        collected = context.pending_action.get('collected_params', {})
        api_params = {}
        
        if 'food' in pending_api.lower():
            api_params = {
                'items': [{'food_item_id': item_id, 'quantity': quantity}]
            }
        elif 'room' in pending_api.lower():
            api_params = {
                'room_id': item_id,
                'booking_date': collected.get('booking_date', ''),
                'start_time': collected.get('start_time', ''),
                'end_time': collected.get('end_time', ''),
                'title': collected.get('title', 'Meeting'),
                'attendees_count': collected.get('attendees_count', 2)
            }
        elif 'desk' in pending_api.lower():
            api_params = {
                'desk_id': item_id,
                'start_date': collected.get('start_date', ''),
                'end_date': collected.get('end_date', '')
            }
        elif 'table' in pending_api.lower() or 'cafeteria_book' in pending_api.lower():
            api_params = {
                'table_id': item_id,
                'booking_date': collected.get('booking_date', ''),
                'start_time': collected.get('start_time', ''),
                'end_time': collected.get('end_time', '')
            }
        else:
            api_params = {'item_id': item_id, 'quantity': quantity}
        
        # Merge other collected params
        for k, v in collected.items():
            if k not in api_params and k not in ['options_data', 'missing_fields'] and v:
                api_params[k] = v
        
        return AgentAction(
            action_type=ActionType.API_CALL,
            api_id=pending_api,
            api_params=api_params,
            confidence=1.0,
            reasoning=f"User selected '{item_name}'"
        )
    
    def _llm_selection_handling(self, context: AgentContext, items: list, 
                                 pending_api: str) -> Optional[AgentAction]:
        """Use LLM for complex selection matching (fuzzy names, partial matches)."""
        user_msg = context.user_message.strip()
        
        # Format options compactly for LLM
        options_text = []
        for idx, item in enumerate(items[:15], 1):  # Limit to 15 to reduce tokens
            if isinstance(item, dict):
                item_id = item.get('id') or item.get('uuid')
                item_name = (item.get('name') or item.get('food_name') or 
                            item.get('room_label') or item.get('desk_label') or 
                            item.get('table_label') or f'Item {idx}')
                options_text.append(f"{idx}. {item_name}|{item_id}")
        
        options_str = "\n".join(options_text)
        
        # Compact selection prompt
        selection_prompt = f"""Options (num. name|id):
{options_str}

User: "{user_msg}"

JSON only: {{"ok":true,"idx":1,"id":"UUID","qty":1}} or {{"ok":false}}"""
        
        try:
            response = self._call_llm_and_track_tokens(
                system_prompt="JSON selector. Output ONLY valid JSON.",
                user_message=selection_prompt,
                temperature=0.0
            )
            
            result = self._parse_llm_response(response.content)
            
            if not result or not result.get('ok') or not result.get('id'):
                return None
            
            item_id = result['id']
            idx = result.get('idx', 1)
            quantity = result.get('qty', 1)
            item_name = items[idx-1].get('name', 'item') if idx <= len(items) else 'item'
            
            return self._build_selection_action(pending_api, item_id, item_name, quantity, context)
            
        except Exception as e:
            logger.error(f"LLM Selection failed: {e}")
            return None

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
                'cafeteria_book': ('table_id', False),
            }
            
            mapping = param_mappings.get(pending_api)
            if mapping:
                param_name, is_nested_array = mapping
                
                # Update api_params with the correct ID
                if action.api_params is None:
                    action.api_params = {}
                
                if is_nested_array:
                    # For APIs like food_order that need nested array structure
                    # Structure: {items: [{food_item_id: uuid, quantity: N}]}
                    
                    # Try to get quantity from multiple sources
                    quantity = 1
                    
                    # 1. From action.api_params
                    if action.api_params.get('quantity'):
                        quantity = action.api_params.get('quantity')
                    
                    # 2. From pending_action collected_params
                    prev_collected = context.pending_action.get('collected_params', {})
                    if prev_collected.get('quantity'):
                        quantity = prev_collected.get('quantity')
                    
                    # 3. Extract from user's current message (e.g., "yes order 2 dal makhani")
                    import re
                    qty_match = re.search(r'(\d+)\s+', context.user_message)
                    if qty_match:
                        quantity = int(qty_match.group(1))
                    
                    # Ensure quantity is int
                    try:
                        quantity = int(quantity)
                    except (ValueError, TypeError):
                        quantity = 1
                    
                    special_instructions = action.api_params.get('special_instructions', '')
                    
                    item_entry = {
                        param_name: selected_item['id'],
                        'quantity': quantity
                    }
                    if special_instructions:
                        item_entry['special_instructions'] = special_instructions
                    
                    action.api_params = {'items': [item_entry]}
                    logger.info(f"Built nested items array for {pending_api}: {action.api_params} (quantity={quantity})")
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
        
        response = self._call_llm_and_track_tokens(
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
            
            # LLM-BASED AUTO-MATCH: Ask LLM to match user's request to fetched options
            auto_match_result = self._llm_auto_match_and_execute(
                action, context, api_response.data
            )
            if auto_match_result:
                return auto_match_result
            
            # No auto-match possible, show options for user selection
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
    
    def _llm_auto_match_and_execute(
        self, 
        action: AgentAction, 
        context: AgentContext,
        options_data: Any
    ) -> Optional[AgentResult]:
        """
        Use LLM to intelligently match user's request to fetched options and execute directly.
        
        Instead of hardcoded regex matching, we ask the LLM to:
        1. Understand what item/room/desk the user wants
        2. Match it to the available options
        3. Extract quantity and other parameters
        4. Return the matched item's ID for execution
        
        Returns AgentResult if LLM match successful, None otherwise.
        """
        from datetime import datetime
        
        target_api_id = action.target_api_id
        collected = action.collected_params or {}
        
        if not target_api_id or not options_data:
            logger.info(f"LLM Auto-match: No target_api_id or no options_data")
            return None
        
        # Extract items list from nested response structures
        items_list = options_data
        if isinstance(options_data, dict):
            for key in ['data', 'items', 'options', 'results']:
                if key in options_data and isinstance(options_data[key], list):
                    items_list = options_data[key]
                    break
        
        if not isinstance(items_list, list) or len(items_list) == 0:
            logger.info(f"LLM Auto-match: No items found in options_data")
            return None
        
        # Format options for LLM - create a simple list with IDs and names
        options_text = []
        for idx, item in enumerate(items_list[:20], 1):  # Limit to 20 items
            if isinstance(item, dict):
                item_id = item.get('id') or item.get('uuid')
                item_name = (item.get('name') or item.get('food_name') or 
                            item.get('room_label') or item.get('desk_label') or 
                            item.get('table_label') or f'Item {idx}')
                price = item.get('price', '')
                price_str = f" - ${price}" if price else ""
                options_text.append(f"{idx}. {item_name} (ID: {item_id}){price_str}")
        
        options_str = "\n".join(options_text)
        today = datetime.now().strftime("%Y-%m-%d")
        
        # Determine if this is a booking API (room/desk/table)
        is_booking_api = any(x in target_api_id.lower() for x in ['room', 'desk', 'table', 'cafeteria_book'])
        
        # Build LLM prompt for matching - VERY strict about JSON only
        match_prompt = f"""Match this user request to the available options.

USER REQUEST: "{context.user_message}"

AVAILABLE OPTIONS:
{options_str}

TARGET API: {target_api_id}
IS_BOOKING_API: {is_booking_api}

## CRITICAL RULES FOR ROOM/DESK/TABLE BOOKINGS:
- ONLY auto-select if user EXPLICITLY says words like: "any", "any available", "any room", "any desk", "any table", "free", "whichever", "whatever", "doesn't matter", "don't care", "first available", "available one"
- If user just says "book a room" or "book a desk" WITHOUT these explicit words → return {{"matched": false, "reason": "user did not specify which option - show choices"}}
- User MUST have choice unless they explicitly delegate the choice to you

## RULES FOR FOOD ORDERS:
- Match food item by name (e.g., "burger" → find burger in options)
- Extract quantity (default 1)

## TIME/DATE:
- Time "2pm" = start_time="14:00", end_time="15:00"
- Time "2 to 4pm" = start_time="14:00", end_time="16:00"
- Default date: {today}

RESPOND WITH ONLY THIS JSON (no explanation, no markdown):
{{"matched": true, "item_id": "UUID", "item_name": "name", "quantity": 1, "booking_date": "{today}", "start_time": "14:00", "end_time": "15:00", "reason": "matched X to Y"}}

OR if user did not explicitly request any available option:
{{"matched": false, "reason": "user did not specify which option - show choices"}}"""
        
        try:
            # Call LLM to match - very strict system prompt
            response = self._call_llm_and_track_tokens(
                system_prompt="You are a JSON-only matcher. Output ONLY valid JSON. No explanations. No markdown. No text. Just the JSON object.",
                user_message=match_prompt,
                temperature=0.0  # Zero temperature for deterministic output
            )
            llm_response = response.content
            logger.info(f"LLM Auto-match response: {llm_response[:200]}...")
            
            # Parse response
            match_result = self._parse_llm_response(llm_response)
            
            if not match_result or not match_result.get('matched') or not match_result.get('item_id'):
                logger.info(f"LLM Auto-match: No match found - {match_result.get('reason', 'unknown')}")
                return None
            
            item_id = match_result['item_id']
            item_name = match_result.get('item_name', 'item')
            quantity = match_result.get('quantity', 1)
            
            logger.info(f"LLM Auto-match successful: '{item_name}' (ID: {item_id}, qty: {quantity})")
            
            # Build API params based on target API
            api_params = {}
            
            if 'food' in target_api_id.lower():
                api_params = {
                    "items": [{
                        "food_item_id": item_id,
                        "quantity": quantity
                    }]
                }
            elif 'room' in target_api_id.lower():
                api_params = {
                    "room_id": item_id,
                    "booking_date": match_result.get('booking_date', today),
                    "start_time": match_result.get('start_time', '14:00'),
                    "end_time": match_result.get('end_time', '15:00'),
                    "title": collected.get('title', 'Meeting'),
                    "attendees_count": collected.get('attendees_count', 2)
                }
            elif 'desk' in target_api_id.lower():
                api_params = {
                    "desk_id": item_id,
                    "start_date": match_result.get('booking_date', today),
                    "end_date": match_result.get('booking_date', today)
                }
            elif 'table' in target_api_id.lower() or 'cafeteria_book' in target_api_id.lower():
                api_params = {
                    "table_id": item_id,
                    "booking_date": match_result.get('booking_date', today),
                    "start_time": match_result.get('start_time', '12:00'),
                    "end_time": match_result.get('end_time', '13:00')
                }
            else:
                api_params = {"item_id": item_id, "quantity": quantity}
            
            # Create and execute action
            auto_action = AgentAction(
                action_type=ActionType.API_CALL,
                api_id=target_api_id,
                api_params=api_params,
                confidence=0.9,
                reasoning=f"LLM matched to '{item_name}' and executing"
            )
            
            logger.info(f"LLM Auto-executing {target_api_id} with params: {api_params}")
            return self._execute_api_call(auto_action, context)
            
        except Exception as e:
            logger.error(f"LLM Auto-match failed with error: {e}")
            return None

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
                    lines.append(f"{i}. {available} {name} - ${price}")
                
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
        
        # SAFEGUARD: Check if API requires UUID fields that are missing
        # If so, redirect to fetch_options instead of failing with 422
        if api_def.dependent_apis and api_def.request_body:
            required_fields = api_def.request_body.get("required_fields", [])
            params = action.api_params or {}
            
            for field in required_fields:
                if isinstance(field, dict) and field.get("source") == "dependent_api":
                    field_name = field.get("name")
                    field_value = params.get(field_name)
                    
                    # Check if the field is missing or not a valid UUID
                    if not field_value or not self._is_valid_uuid(str(field_value)):
                        logger.warning(f"Missing required UUID field '{field_name}' - executing fetch_options instead")
                        
                        # Find the dependent API to call
                        dep_api_id = api_def.dependent_apis[0] if api_def.dependent_apis else None
                        if dep_api_id:
                            # Build and execute a fetch_options action
                            fetch_action = AgentAction(
                                action_type=ActionType.FETCH_OPTIONS,
                                api_id=dep_api_id,
                                target_api_id=action.api_id,
                                dependent_api_id=dep_api_id,
                                collected_params=action.collected_params or params,
                                confidence=1.0,
                                reasoning=f"Auto-redirected: missing {field_name}"
                            )
                            return self._execute_fetch_options(fetch_action, context)
        
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
        
        prompt = f"""You are a professional, helpful AI assistant. Convert this API response into a natural message.

## STRICT TONE RULES
- Be professional, warm, and helpful - NO sarcasm or jokes
- NO comments about user being demanding or making you work hard
- Be concise and factual

## User Info
- Name: {user_name if user_name else 'User'}
{conversation_context}

## API Result
- Action: {api_def.name}
- Success: {api_response.success}
- Data: {json.dumps(api_response.data, indent=2) if api_response.data else 'No data'}
- Error: {api_response.error if api_response.error else 'None'}

## User Request: "{context.user_message}"

## Guidelines
- Use user's name naturally
- Be concise with key details only
- For failures: Be empathetic, explain simply, state ONLY the error from API - do NOT invent alternatives or fake options
- NEVER make up room names, desk names, booking codes, or any data not in the API response
- No technical jargon

Respond with ONLY the message, no JSON.
"""
        
        try:
            response = self._call_llm_and_track_tokens(
                system_prompt="You are a professional, helpful assistant. Be warm but never sarcastic.",
                user_message=prompt,
                temperature=0.5
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
