"""
Routing Agent - Routes user input to the appropriate domain agent.
Uses LLM to classify intent and select the best agent.
"""

import json
import time
import logging
from typing import Optional, Dict, Any, List, Tuple
from dataclasses import dataclass
from enum import Enum

from services.llm_service import LLMService, ChatMessage, get_llm_service
from services.kb_loader import KBLoader, get_kb_loader
from config.settings import get_settings

logger = logging.getLogger(__name__)


class AgentType(str, Enum):
    """Types of domain agents."""
    ATTENDANCE = "attendance"
    LEAVE = "leave"
    DESK_CONFERENCE = "desk_conference"
    CAFETERIA = "cafeteria"
    IT_MANAGEMENT = "it_management"
    GENERAL = "general"  # For greetings, chitchat, unclear requests


@dataclass
class RoutingResult:
    """Result from routing analysis."""
    selected_agent: AgentType
    confidence: float
    detected_intent: Optional[str]
    reasoning: str
    alternative_agents: List[Dict[str, Any]]
    is_greeting: bool = False
    is_farewell: bool = False
    needs_clarification: bool = False
    clarification_message: Optional[str] = None
    latency_ms: int = 0
    # Multi-agent support
    is_multi_intent: bool = False
    selected_agents: Optional[List[Dict[str, Any]]] = None  # [{"agent": AgentType, "intent": str, "confidence": float}]
    
    def to_dict(self) -> dict:
        return {
            "selected_agent": self.selected_agent.value,
            "confidence": self.confidence,
            "detected_intent": self.detected_intent,
            "reasoning": self.reasoning,
            "alternative_agents": self.alternative_agents,
            "is_greeting": self.is_greeting,
            "is_farewell": self.is_farewell,
            "needs_clarification": self.needs_clarification,
            "clarification_message": self.clarification_message,
            "latency_ms": self.latency_ms,
            "is_multi_intent": self.is_multi_intent,
            "selected_agents": self.selected_agents
        }


class RoutingAgent:
    """
    Routes user requests to appropriate domain agents.
    
    Uses LLM to:
    1. Classify user intent
    2. Select the most appropriate agent
    3. Handle ambiguous or multi-intent requests
    """
    
    def __init__(self):
        self.llm_service = get_llm_service()
        self.kb_loader = get_kb_loader()
        self.settings = get_settings()
        self._routing_prompt: Optional[str] = None
    
    @property
    def routing_prompt(self) -> str:
        """Get or generate the routing system prompt."""
        if self._routing_prompt is None:
            self._routing_prompt = self._build_routing_prompt()
        return self._routing_prompt
    
    def _build_routing_prompt(self) -> str:
        """Build the system prompt for routing decisions with KB data."""
        # Build agent capabilities from knowledge base
        agent_capabilities = self._build_agent_capabilities_from_kb()
        
        prompt = f"""You are an intelligent routing agent for an Employee Services Chatbot.
Your job is to analyze user messages and route them to the appropriate specialist agent(s).
IMPORTANT: Users may have MULTIPLE intents in a single message - you MUST detect and route to ALL relevant agents.

## Available Agents and Their Capabilities

{agent_capabilities}

### GENERAL
Use for: Greetings, farewells, unclear requests, out-of-scope questions, capability inquiries

## Response Format
Respond with a JSON object:
{{
    "is_multi_intent": true/false,
    "selected_agents": [
        {{"agent": "AGENT_NAME", "intent": "what user wants from this agent", "confidence": 0.0-1.0}}
    ],
    "selected_agent": "AGENT_NAME",
    "confidence": 0.0-1.0,
    "detected_intent": "brief description of what user wants",
    "reasoning": "why you chose this agent(s)",
    "alternative_agents": [
        {{"agent": "AGENT_NAME", "confidence": 0.0-1.0, "reason": "why this could also apply"}}
    ],
    "is_greeting": true/false,
    "is_farewell": true/false,
    "needs_clarification": true/false,
    "clarification_message": "question to ask if clarification needed"
}}

## MULTI-INTENT DETECTION - CRITICAL
When a user has MULTIPLE distinct requests (e.g., "book a desk and check in", "order food and book a room"), you MUST:
1. Set "is_multi_intent" to true
2. List ALL relevant agents in "selected_agents" array with their specific intent
3. Set "selected_agent" to the FIRST agent in the list (for backwards compatibility)
4. Order agents logically (e.g., check-in before desk booking makes sense)

### Examples of Multi-Intent Messages:
- "book a desk and check in" → ATTENDANCE (check_in) + DESK_CONFERENCE (desk_book)
- "check in and order lunch" → ATTENDANCE (check_in) + CAFETERIA (food_order)
- "book a room and raise IT ticket" → DESK_CONFERENCE (room_book) + IT_MANAGEMENT (ticket)
- "apply leave and check balance" → LEAVE (apply) + LEAVE (balance) - same agent, but still list both intents

### Examples of Single-Intent Messages:
- "book a desk" → is_multi_intent: false, selected_agent: DESK_CONFERENCE
- "check in" → is_multi_intent: false, selected_agent: ATTENDANCE

## STRICT RULES - DO NOT VIOLATE
- **DETECT ALL INTENTS**: If user has 2+ actions, set is_multi_intent=true and list ALL agents
- **DO NOT HALLUCINATE**: Only route to agents that exist (ATTENDANCE, LEAVE, DESK_CONFERENCE, CAFETERIA, IT_MANAGEMENT, GENERAL)
- **DO NOT INVENT CAPABILITIES**: Only consider the capabilities listed above for each agent
- **MATCH USER INTENT TO API CAPABILITIES**: Route based on what APIs each agent can actually perform

## Guidelines
1. Choose the agent(s) with highest confidence for the user's intent(s)
2. If confidence is below 0.7, set needs_clarification to true
3. For mixed intents, LIST ALL AGENTS in selected_agents array
4. Be generous with routing - when in doubt, route to the most likely agent
5. Greetings and farewells should go to GENERAL
6. "What can you do?" or capability questions go to GENERAL

Always respond with valid JSON only.
"""
        return prompt
    
    def _build_agent_capabilities_from_kb(self) -> str:
        """Build agent capabilities section from knowledge base."""
        # Define agent to domain mapping
        agent_domains = {
            "ATTENDANCE": {
                "domains": ["attendance", "holidays"],
                "description": "Handles attendance tracking and holiday information"
            },
            "LEAVE": {
                "domains": ["leave"],
                "description": "Handles leave applications and management"
            },
            "DESK_CONFERENCE": {
                "domains": ["desk_booking", "conference_room"],
                "description": "Handles desk and conference room bookings"
            },
            "CAFETERIA": {
                "domains": ["food_orders", "cafeteria_tables"],
                "description": "Handles cafeteria food orders and table bookings"
            },
            "IT_MANAGEMENT": {
                "domains": ["it_requests"],
                "description": "Handles IT support requests and tickets"
            }
        }
        
        lines = []
        for agent_name, config in agent_domains.items():
            lines.append(f"### {agent_name} Agent")
            lines.append(f"{config['description']}")
            lines.append("")
            lines.append("**Can handle these requests:**")
            
            for domain_name in config["domains"]:
                domain = self.kb_loader.get_domain(domain_name)
                if domain:
                    for api in domain.apis:
                        lines.append(f"- {api.name}: {api.description}")
                        # Include intent examples from KB
                        if api.intent_examples:
                            examples = api.intent_examples[:3]  # Limit to 3 examples
                            quoted_examples = [f'"{ex}"' for ex in examples]
                            lines.append(f"  User might say: {', '.join(quoted_examples)}")
            lines.append("")
        
        return "\n".join(lines)
    
    def route(self, 
              user_message: str, 
              conversation_history: Optional[List[ChatMessage]] = None,
              current_agent: Optional[AgentType] = None) -> RoutingResult:
        """
        Route user message to appropriate agent.
        
        Args:
            user_message: The user's input message
            conversation_history: Previous messages for context
            current_agent: Currently active agent (for context continuity)
            
        Returns:
            RoutingResult with agent selection
        """
        start_time = time.time()
        
        try:
            # Build context message
            context_parts = [f"User message: {user_message}"]
            
            if current_agent:
                context_parts.append(f"Currently talking to: {current_agent.value} agent")
            
            if conversation_history:
                # Include last few messages for context
                recent = conversation_history[-4:]
                history_str = "\n".join([f"{m.role}: {m.content[:100]}..." for m in recent])
                context_parts.append(f"Recent conversation:\n{history_str}")
            
            context_message = "\n\n".join(context_parts)
            
            # Call LLM for routing
            response = self.llm_service.chat_with_system(
                system_prompt=self.routing_prompt,
                user_message=context_message,
                temperature=0.3  # Lower temperature for more consistent routing
            )
            
            latency_ms = int((time.time() - start_time) * 1000)
            
            # Parse response
            parsed = self.llm_service.parse_json_response(response)
            
            if not parsed:
                logger.warning(f"Failed to parse routing response: {response.content}")
                return self._fallback_routing(user_message, latency_ms)
            
            # Convert to RoutingResult
            agent_str = parsed.get("selected_agent", "GENERAL").upper()
            try:
                selected_agent = AgentType(agent_str.lower())
            except ValueError:
                selected_agent = AgentType.GENERAL
            
            # Parse multi-agent support
            is_multi_intent = parsed.get("is_multi_intent", False)
            selected_agents = None
            
            if is_multi_intent and parsed.get("selected_agents"):
                selected_agents = []
                for agent_info in parsed.get("selected_agents", []):
                    agent_name = agent_info.get("agent", "").upper()
                    try:
                        agent_type = AgentType(agent_name.lower())
                        selected_agents.append({
                            "agent": agent_type,
                            "intent": agent_info.get("intent", ""),
                            "confidence": agent_info.get("confidence", 0.8)
                        })
                    except ValueError:
                        logger.warning(f"Unknown agent type in multi-agent response: {agent_name}")
                        continue
                
                # If we have multiple agents, set the first one as selected_agent for backwards compatibility
                if selected_agents:
                    selected_agent = selected_agents[0]["agent"]
                    logger.info(f"Multi-intent detected: {[a['agent'].value for a in selected_agents]}")
            
            return RoutingResult(
                selected_agent=selected_agent,
                confidence=parsed.get("confidence", 0.5),
                detected_intent=parsed.get("detected_intent"),
                reasoning=parsed.get("reasoning", ""),
                alternative_agents=parsed.get("alternative_agents", []),
                is_greeting=parsed.get("is_greeting", False),
                is_farewell=parsed.get("is_farewell", False),
                needs_clarification=parsed.get("needs_clarification", False),
                clarification_message=parsed.get("clarification_message"),
                latency_ms=latency_ms,
                is_multi_intent=is_multi_intent,
                selected_agents=selected_agents
            )
            
        except Exception as e:
            logger.error(f"Routing error: {e}", exc_info=True)
            latency_ms = int((time.time() - start_time) * 1000)
            return self._fallback_routing(user_message, latency_ms)
    
    def _fallback_routing(self, user_message: str, latency_ms: int) -> RoutingResult:
        """
        Fallback routing using simple keyword matching.
        Used when LLM routing fails.
        """
        message_lower = user_message.lower()
        
        # Simple keyword matching
        keyword_map = {
            AgentType.ATTENDANCE: ["check in", "check out", "punch", "attendance", "holiday", "holidays"],
            AgentType.LEAVE: ["leave", "vacation", "sick", "time off", "pto"],
            AgentType.DESK_CONFERENCE: ["desk", "conference", "room", "meeting room", "workspace", "book a room"],
            AgentType.CAFETERIA: ["food", "lunch", "menu", "order", "cafeteria", "table", "eat", "meal"],
            AgentType.IT_MANAGEMENT: ["laptop", "computer", "it", "software", "network", "vpn", "wifi", "ticket"],
        }
        
        # Check for greetings
        greetings = ["hello", "hi", "hey", "good morning", "good afternoon", "good evening"]
        if any(g in message_lower for g in greetings):
            return RoutingResult(
                selected_agent=AgentType.GENERAL,
                confidence=0.9,
                detected_intent="greeting",
                reasoning="User is greeting",
                alternative_agents=[],
                is_greeting=True,
                latency_ms=latency_ms
            )
        
        # Check for farewells
        farewells = ["bye", "goodbye", "see you", "thanks", "thank you"]
        if any(f in message_lower for f in farewells):
            return RoutingResult(
                selected_agent=AgentType.GENERAL,
                confidence=0.9,
                detected_intent="farewell",
                reasoning="User is saying goodbye or thanking",
                alternative_agents=[],
                is_farewell=True,
                latency_ms=latency_ms
            )
        
        # Match keywords to agents
        matches = []
        for agent, keywords in keyword_map.items():
            for keyword in keywords:
                if keyword in message_lower:
                    matches.append((agent, 0.7))
                    break
        
        if matches:
            best_match = matches[0]
            return RoutingResult(
                selected_agent=best_match[0],
                confidence=best_match[1],
                detected_intent=f"keyword match for {best_match[0].value}",
                reasoning="Fallback keyword matching",
                alternative_agents=[{"agent": m[0].value, "confidence": m[1]} for m in matches[1:]],
                latency_ms=latency_ms
            )
        
        # Default to GENERAL if no match
        return RoutingResult(
            selected_agent=AgentType.GENERAL,
            confidence=0.3,
            detected_intent="unclear",
            reasoning="No clear intent detected",
            alternative_agents=[],
            needs_clarification=True,
            clarification_message="I'm not sure I understood that. Could you please tell me what you'd like help with? I can assist with attendance, leave, desk/room bookings, cafeteria services, or IT support.",
            latency_ms=latency_ms
        )
    
    def get_capabilities_message(self) -> str:
        """Generate a message describing chatbot capabilities."""
        return """I'm your Employee Services Assistant! Here's what I can help you with:

📋 **Attendance**
- Check in and check out
- View your attendance history
- Check upcoming holidays

🏖️ **Leave Management**
- Apply for leave (casual, sick, earned, etc.)
- Check your leave balance
- View leave history and cancel requests

🪑 **Desk & Conference Rooms**
- Book a desk or hot desk
- Reserve conference rooms for meetings
- Check availability and manage bookings

🍽️ **Cafeteria Services**
- View today's menu
- Place food orders
- Book tables in the cafeteria

💻 **IT Support**
- Raise IT support tickets
- Check status of your requests
- Report hardware/software issues

Just tell me what you need help with!"""
