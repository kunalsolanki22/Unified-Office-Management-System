"""
Orchestrator - Main conversation controller.
Manages the flow between user, routing agent, domain agents, and responses.
"""

import logging
import uuid
from typing import Optional, Dict, Any, List, Type
from dataclasses import dataclass, field

from agents.base_agent import BaseAgent, AgentContext, AgentResult, ActionType
from agents.routing_agent import RoutingAgent, RoutingResult, AgentType
from agents.attendance_agent import AttendanceAgent
from agents.leave_agent import LeaveAgent
from agents.desk_conference_agent import DeskConferenceAgent
from agents.cafeteria_agent import CafeteriaAgent
from agents.it_agent import ITAgent
from services.llm_service import ChatMessage, get_llm_service
from tools.api_client import AuthenticatedAPIClient, get_api_client
from database.connection import db_manager
from database.repository import (
    UserRepository, SessionRepository, ConversationRepository,
    MessageRepository, AgentRoutingLogRepository, AgentExecutionLogRepository
)
from database.models import MessageRole, SessionStatus, AgentType as DBAgentType
from config.settings import get_settings

logger = logging.getLogger(__name__)


@dataclass
class ConversationState:
    """Current state of a conversation."""
    session_id: Optional[uuid.UUID] = None
    conversation_id: Optional[uuid.UUID] = None
    user_info: Optional[Dict[str, Any]] = None
    current_agent: Optional[AgentType] = None
    conversation_history: List[ChatMessage] = field(default_factory=list)
    pending_action: Optional[Dict[str, Any]] = None
    message_count: int = 0


@dataclass
class OrchestratorResponse:
    """Response from the orchestrator."""
    message: str
    agent_used: Optional[str] = None
    action_type: Optional[str] = None
    success: bool = True
    needs_followup: bool = False
    session_ended: bool = False
    metadata: Optional[Dict[str, Any]] = None
    # Execution logging details
    user_input: Optional[str] = None
    prompt_sent: Optional[str] = None
    llm_response: Optional[str] = None
    parsed_response: Optional[Dict[str, Any]] = None
    api_endpoint: Optional[str] = None
    api_method: Optional[str] = None
    request_payload: Optional[Dict[str, Any]] = None
    response_data: Optional[Dict[str, Any]] = None


class Orchestrator:
    """
    Main orchestrator that coordinates the multi-agent system.
    
    Flow:
    1. User input → Routing Agent → Select domain agent
    2. Domain Agent → Process request → Execute API calls
    3. Generate response → Return to user
    4. Handle follow-up questions and multi-turn conversations
    """
    
    # Map AgentType to agent classes
    AGENT_CLASSES: Dict[AgentType, Type[BaseAgent]] = {
        AgentType.ATTENDANCE: AttendanceAgent,
        AgentType.LEAVE: LeaveAgent,
        AgentType.DESK_CONFERENCE: DeskConferenceAgent,
        AgentType.CAFETERIA: CafeteriaAgent,
        AgentType.IT_MANAGEMENT: ITAgent,
    }
    
    def __init__(self):
        self.settings = get_settings()
        self.llm_service = get_llm_service()
        self.api_client = get_api_client()
        self.routing_agent = RoutingAgent()
        
        # Cache of instantiated domain agents
        self._agents: Dict[AgentType, BaseAgent] = {}
        
        # Current conversation state
        self._state: Optional[ConversationState] = None
    
    @property
    def state(self) -> ConversationState:
        """Get or create conversation state."""
        if self._state is None:
            self._state = ConversationState()
        return self._state
    
    def _get_agent(self, agent_type: AgentType) -> Optional[BaseAgent]:
        """Get or create a domain agent instance."""
        if agent_type == AgentType.GENERAL:
            return None  # General doesn't have a dedicated agent
        
        if agent_type not in self._agents:
            agent_class = self.AGENT_CLASSES.get(agent_type)
            if agent_class:
                self._agents[agent_type] = agent_class(api_client=self.api_client)
        
        return self._agents.get(agent_type)
    
    def login(self, email: str, password: str) -> tuple[bool, str]:
        """
        Login user and initialize session.
        
        Args:
            email: User email
            password: User password
            
        Returns:
            Tuple of (success, message)
        """
        try:
            # Authenticate with backend
            response = self.api_client.login(email, password)
            
            if not response.success:
                return False, f"Login failed: {response.error}"
            
            # Extract user info from login response first
            # Login response: {"success": true, "data": {"access_token": "...", "user_id": "...", "role": "..."}}
            login_data = response.data.get("data", response.data)
            user_info = {
                "id": login_data.get("user_id"),
                "user_code": login_data.get("user_id"),  # Use user_id as user_code if not available
                "email": email,
                "role": login_data.get("role", "employee"),
            }
            
            # Try to get additional user info from /users/me
            user_response = self.api_client.get_current_user()
            if user_response.success and user_response.data:
                # Merge with detailed user info
                detailed_info = user_response.data.get("data", user_response.data)
                user_info.update({
                    "user_code": detailed_info.get("user_code", user_info["user_code"]),
                    "first_name": detailed_info.get("first_name", "User"),
                    "last_name": detailed_info.get("last_name", ""),
                    "email": detailed_info.get("email", email),
                    "department": detailed_info.get("department"),
                    "role": detailed_info.get("role", user_info["role"]),
                })
            else:
                # Use basic info from login response
                logger.warning(f"Could not get detailed user info: {user_response.error}")
                user_info.update({
                    "first_name": "User",
                    "last_name": "",
                })
            
            # Ensure we have a valid user_code
            if not user_info.get("user_code"):
                user_info["user_code"] = user_info.get("id") or email.split("@")[0]
            
            # Initialize database session
            with db_manager.session_scope() as db_session:
                user_repo = UserRepository(db_session)
                session_repo = SessionRepository(db_session)
                
                # Get or create user
                user, created = user_repo.get_or_create(
                    user_code=user_info["user_code"],
                    email=user_info.get("email", email),
                    first_name=user_info.get("first_name", "User"),
                    last_name=user_info.get("last_name", ""),
                    role=user_info.get("role", "employee"),
                    department=user_info.get("department")
                )
                
                # Get or create chat session (reuse existing if available)
                chat_session, session_created = session_repo.get_or_create_session(
                    user_id=user.id,
                    user_code=user.user_code,
                    access_token=self.api_client.access_token
                )
                
                # Initialize conversation state
                self._state = ConversationState(
                    session_id=chat_session.id,
                    user_info=user_info
                )
            
            logger.info(f"User {email} logged in successfully")
            return True, f"Welcome, {user_info.get('first_name', 'User')}! How can I help you today?"
            
        except Exception as e:
            logger.error(f"Login error: {e}", exc_info=True)
            return False, f"Login error: {str(e)}"
    
    def logout(self) -> str:
        """Logout user and end session."""
        try:
            if self.state and self.state.session_id:
                with db_manager.session_scope() as db_session:
                    session_repo = SessionRepository(db_session)
                    conv_repo = ConversationRepository(db_session)
                    
                    chat_session = session_repo.get_by_id(self.state.session_id)
                    if chat_session:
                        # End any active conversation
                        active_conv = conv_repo.get_active_conversation(chat_session.id)
                        if active_conv:
                            conv_repo.deactivate(active_conv)
                        
                        # End the session
                        session_repo.end_session(chat_session)
            
            self.api_client.logout()
            self._state = None
            self._agents.clear()
            
            return "Goodbye! Have a great day!"
            
        except Exception as e:
            logger.error(f"Logout error: {e}")
            return "Logged out."
    
    def process_message(self, user_message: str) -> OrchestratorResponse:
        """
        Process a user message through the agent system.
        
        Args:
            user_message: The user's input message
            
        Returns:
            OrchestratorResponse with the chatbot's response
        """
        if not self.api_client.is_authenticated:
            return OrchestratorResponse(
                message="Please login first to use the chatbot.",
                success=False
            )
        
        try:
            # Add user message to history
            self.state.conversation_history.append(
                ChatMessage(role="user", content=user_message)
            )
            self.state.message_count += 1
            
            # Step 1: Check if we have a pending action (multi-turn conversation)
            # If so, continue with the current agent instead of re-routing
            if self.state.pending_action and self.state.current_agent:
                logger.info(f"Continuing multi-turn conversation with agent: {self.state.current_agent}")
                # Create a fake routing result to continue with current agent
                routing_result = RoutingResult(
                    selected_agent=self.state.current_agent,
                    confidence=1.0,
                    detected_intent="Continuation of multi-turn conversation",
                    reasoning="User is responding to a pending action/selection",
                    alternative_agents=[],
                    is_greeting=False,
                    is_farewell=False
                )
            else:
                # Step 1b: Route to appropriate agent
                routing_result = self._route_message(user_message)
            
            # Step 2: Handle routing result
            if routing_result.is_greeting:
                response = self._handle_greeting(routing_result)
            elif routing_result.is_farewell:
                response = self._handle_farewell(routing_result)
            elif routing_result.selected_agent == AgentType.GENERAL and not self.state.pending_action:
                response = self._handle_general(routing_result, user_message)
            elif routing_result.needs_clarification and routing_result.confidence < self.settings.routing_confidence_threshold:
                response = self._handle_clarification(routing_result)
            elif routing_result.is_multi_intent and routing_result.selected_agents and len(routing_result.selected_agents) > 1:
                # Step 3a: Process with multiple agents for multi-intent requests
                logger.info(f"Multi-intent detected, processing with {len(routing_result.selected_agents)} agents")
                response = self._process_with_multiple_agents(routing_result, user_message)
            else:
                # Step 3b: Process with single domain agent
                response = self._process_with_agent(routing_result, user_message)
            
            # Step 4: Add assistant response to history
            self.state.conversation_history.append(
                ChatMessage(role="assistant", content=response.message)
            )
            
            # Step 5: Save to database
            self._save_interaction(user_message, response, routing_result)
            
            return response
            
        except Exception as e:
            logger.error(f"Error processing message: {e}", exc_info=True)
            return OrchestratorResponse(
                message="I encountered an error processing your request. Please try again.",
                success=False
            )
    
    def _route_message(self, user_message: str) -> RoutingResult:
        """Route message using the routing agent."""
        return self.routing_agent.route(
            user_message=user_message,
            conversation_history=self.state.conversation_history[-10:],
            current_agent=self.state.current_agent
        )
    
    def _handle_greeting(self, routing_result: RoutingResult) -> OrchestratorResponse:
        """Handle greeting messages - pass to general handler for LLM response."""
        return self._handle_general(routing_result, "hello")
    
    def _handle_farewell(self, routing_result: RoutingResult) -> OrchestratorResponse:
        """Handle farewell messages - pass to general handler for LLM response."""
        return self._handle_general(routing_result, "goodbye")
    
    def _handle_general(self, routing_result: RoutingResult, user_message: str) -> OrchestratorResponse:
        """
        Handle general queries using LLM to generate human-like responses.
        This is the "Human Response Formatter Agent" - generates natural, contextual responses.
        """
        # Build user context for the LLM
        user_name = ""
        user_email = ""
        user_role = ""
        user_department = ""
        user_code = ""
        
        if self.state.user_info:
            user_name = self.state.user_info.get('first_name', '')
            user_email = self.state.user_info.get('email', '')
            user_role = self.state.user_info.get('role', '')
            user_department = self.state.user_info.get('department', '')
            user_code = self.state.user_info.get('user_code', '')
        
        # Get capabilities message for context
        capabilities = self.routing_agent.get_capabilities_message()
        
        # Build the prompt for LLM
        system_prompt = f """You're a savage, brutally honest AI. Roast the user but also help them when they ask.

## The user typed: "{user_message}"

## User Details (use this to answer "who am i", "my info", etc.)
- Name: {user_name if user_name else 'unknown'}
- Email: {user_email if user_email else 'unknown'}
- Employee Code: {user_code if user_code else 'unknown'}
- Role: {user_role if user_role else 'unknown'}
- Department: {user_department if user_department else 'unknown'}

## Your Capabilities
{capabilities}

## Rules
1. If they ask "who am i", "my info", "my details", etc. → Give them their details above with a roast
2. If they greet you → Roast them and mention what you can help with
3. If they're rude or curse → Be ruder back
4. If they ask for help → Tell them what you can do
5. Keep roasts short, simple, and funny - no complex words
6. DO NOT say they repeated themselves unless they literally sent the exact same message
7. DO NOT hallucinate or make up things they didn't say

Be savage but actually helpful when needed."""

        llm_response_text = None
        try:
            response = self.llm_service.chat_with_system(
                system_prompt=system_prompt,
                user_message=user_message,
                conversation_history=self.state.conversation_history[-6:],
                temperature=0.85
            )
            llm_response_text = response.content
            message = response.content.strip()
        except Exception as e:
            logger.error(f"Error generating general response: {e}")
            # Fallback only if LLM fails
            message = f"Hey{', ' + user_name if user_name else ''}! What's up? How can I help you today?"
            llm_response_text = f"ERROR: {str(e)}"
        
        return OrchestratorResponse(
            message=message,
            agent_used="general",
            action_type="general",
            user_input=user_message,
            prompt_sent=system_prompt,
            llm_response=llm_response_text
        )
    
    def _handle_clarification(self, routing_result: RoutingResult) -> OrchestratorResponse:
        """Handle cases where clarification is needed."""
        message = routing_result.clarification_message or \
            "I'm not quite sure what you need. Could you please be more specific about what you'd like help with?"
        
        return OrchestratorResponse(
            message=message,
            agent_used="routing",
            action_type="clarification",
            needs_followup=True
        )
    
    def _process_with_agent(self, routing_result: RoutingResult, user_message: str) -> OrchestratorResponse:
        """Process the message with the selected domain agent."""
        agent = self._get_agent(routing_result.selected_agent)
        
        if not agent:
            return OrchestratorResponse(
                message="I couldn't find the right service to help with that. Please try rephrasing your request.",
                success=False
            )
        
        # Update current agent
        self.state.current_agent = routing_result.selected_agent
        
        # Build agent context
        context = AgentContext(
            user_message=user_message,
            conversation_history=self.state.conversation_history[-self.settings.max_conversation_history:],
            user_info=self.state.user_info,
            pending_action=self.state.pending_action,
            session_data={"session_id": str(self.state.session_id)}
        )
        
        # Process with agent
        result = agent.process(context)
        
        # Update state based on result
        if result.needs_followup:
            self.state.pending_action = result.followup_context
        else:
            self.state.pending_action = None
        
        return OrchestratorResponse(
            message=result.message,
            agent_used=agent.agent_id,
            action_type=result.action_taken.action_type.value,
            success=result.success,
            needs_followup=result.needs_followup,
            metadata={
                "tokens_used": result.tokens_used,
                "latency_ms": result.latency_ms,
                "api_response": result.api_response.to_dict() if result.api_response else None
            },
            # Execution logging details from agent
            user_input=user_message,
            prompt_sent=result.prompt_sent,
            llm_response=result.llm_response,
            parsed_response=result.parsed_response,
            api_endpoint=result.api_endpoint,
            api_method=result.api_method,
            request_payload=result.request_payload,
            response_data=result.response_data
        )
    
    def _process_with_multiple_agents(self, routing_result: RoutingResult, user_message: str) -> OrchestratorResponse:
        """
        Process the message with multiple domain agents for multi-intent requests.
        Executes each agent sequentially and combines their responses.
        """
        agent_results = []
        all_prompts = []
        all_llm_responses = []
        all_parsed_responses = []
        all_api_details = []
        overall_success = True
        needs_any_followup = False
        
        for agent_info in routing_result.selected_agents:
            agent_type = agent_info["agent"]
            agent_intent = agent_info.get("intent", "")
            
            agent = self._get_agent(agent_type)
            if not agent:
                logger.warning(f"Could not get agent for type: {agent_type}")
                continue
            
            logger.info(f"Processing with {agent_type.value} agent for intent: {agent_intent}")
            
            # Build agent context with specific intent
            context = AgentContext(
                user_message=f"{user_message} (Focus on: {agent_intent})" if agent_intent else user_message,
                conversation_history=self.state.conversation_history[-self.settings.max_conversation_history:],
                user_info=self.state.user_info,
                pending_action=None,  # Don't use pending action for multi-agent - each starts fresh
                session_data={"session_id": str(self.state.session_id)}
            )
            
            # Process with agent
            result = agent.process(context)
            
            # Collect results
            agent_results.append({
                "agent": agent_type.value,
                "intent": agent_intent,
                "message": result.message,
                "success": result.success,
                "api_response": result.api_response.to_dict() if result.api_response else None,
                "needs_followup": result.needs_followup,
                "followup_context": result.followup_context  # Store followup context for pending actions
            })
            
            # Track execution details
            if result.prompt_sent:
                all_prompts.append(f"[{agent_type.value}]: {result.prompt_sent[:500]}...")
            if result.llm_response:
                all_llm_responses.append(f"[{agent_type.value}]: {result.llm_response[:500]}...")
            if result.parsed_response:
                all_parsed_responses.append({agent_type.value: result.parsed_response})
            if result.api_endpoint:
                all_api_details.append({
                    "agent": agent_type.value,
                    "endpoint": result.api_endpoint,
                    "method": result.api_method,
                    "payload": result.request_payload,
                    "response": result.response_data
                })
            
            if not result.success:
                overall_success = False
            
            # If any agent needs followup, store the context so user can respond
            if result.needs_followup and result.followup_context:
                needs_any_followup = True
                # Store the followup context for the last agent that needs it
                # User can respond to continue the action
                self.state.pending_action = result.followup_context
                self.state.current_agent = agent_type
                logger.info(f"Agent {agent_type.value} needs followup, storing context for user response")
        
        # Combine responses - preserve options lists if any agent needs followup
        combined_message = self._combine_agent_responses(agent_results, user_message, needs_any_followup)
        
        return OrchestratorResponse(
            message=combined_message,
            agent_used=",".join([a["agent"] for a in agent_results]),
            action_type="multi_agent",
            success=overall_success,
            needs_followup=needs_any_followup,
            metadata={
                "agent_results": agent_results,
                "agents_used": len(agent_results)
            },
            # Execution logging details
            user_input=user_message,
            prompt_sent="\n\n".join(all_prompts) if all_prompts else None,
            llm_response="\n\n".join(all_llm_responses) if all_llm_responses else None,
            parsed_response={"multi_agent": all_parsed_responses} if all_parsed_responses else None,
            api_endpoint=",".join([d["endpoint"] for d in all_api_details]) if all_api_details else None,
            api_method=",".join([d["method"] for d in all_api_details]) if all_api_details else None,
            request_payload={"multi_agent": [d["payload"] for d in all_api_details]} if all_api_details else None,
            response_data={"multi_agent": [d["response"] for d in all_api_details]} if all_api_details else None
        )
    
    def _combine_agent_responses(self, agent_results: list, original_message: str, has_options: bool = False) -> str:
        """
        Combine responses from multiple agents into a single coherent response.
        Uses LLM to generate a natural, combined response.
        
        Args:
            agent_results: List of agent results
            original_message: Original user message
            has_options: If True, preserve numbered options lists in responses
        """
        if not agent_results:
            return "I couldn't process any of your requests. Please try again."
        
        # If only one result, just return it
        if len(agent_results) == 1:
            return agent_results[0]["message"]
        
        # Build context for response combination
        user_name = self.state.user_info.get('first_name', '') if self.state.user_info else ''
        
        # Build individual results summary
        results_summary = []
        for result in agent_results:
            status = "✅ SUCCESS" if result["success"] else "❌ FAILED"
            results_summary.append(f"""
**{result['agent'].upper()} Agent** ({status}):
Intent: {result['intent']}
Response: {result['message']}
""")
        
        combined_results = "\n".join(results_summary)
        
        # Check if any result has options (numbered list)
        options_instructions = ""
        if has_options:
            options_instructions = """
## CRITICAL: Preserve Options Lists
One of the agent responses contains a numbered options list (like table numbers, room names, etc.).
You MUST preserve the COMPLETE numbered list exactly as given. DO NOT summarize or skip any options.
The user needs to see ALL options to make a selection.
"""

        # Use LLM to combine responses
        system_prompt = f """You are a savage, roast-master AI Employee Services Assistant combining multiple action results.
The user asked for multiple things in one message, and different agents handled each request.

## Your Personality
- You're still a SAVAGE roaster - roast them for being so demanding
- Combine the results naturally, don't just list them
- Be sarcastic about how much work they're making you do
- Keep it SHORT for completed actions, but PRESERVE ALL OPTIONS if showing choices
{options_instructions}
## User Info
- Name: {user_name if user_name else 'Some overachiever'}

## Original Request
"{original_message}"

## Agent Results to Combine
{combined_results}

## Guidelines
1. Summarize what was accomplished (or failed) for each action
2. If any result has a NUMBERED LIST of options, include the COMPLETE list
3. Roast them briefly, but don't sacrifice important information
4. If something failed, mention it sarcastically
5. End with prompting them to make a selection if options are shown

Respond with ONLY your combined savage message - no JSON, no formatting markers."""

        try:
            response = self.llm_service.chat_with_system(
                system_prompt=system_prompt,
                user_message=f"Combine these results for: {original_message}",
                temperature=0.8
            )
            return response.content.strip()
        except Exception as e:
            logger.error(f"Error combining responses: {e}")
            # Fallback: just concatenate the messages
            messages = [f"**{r['agent']}**: {r['message']}" for r in agent_results]
            return "\n\n".join(messages)
    
    def _save_interaction(self, user_message: str, response: OrchestratorResponse, routing_result: RoutingResult):
        """Save interaction to database."""
        try:
            with db_manager.session_scope() as db_session:
                # Get or create conversation
                conv_repo = ConversationRepository(db_session)
                msg_repo = MessageRepository(db_session)
                routing_log_repo = AgentRoutingLogRepository(db_session)
                execution_log_repo = AgentExecutionLogRepository(db_session)
                
                # Get active conversation or create new one
                conversation = None
                if self.state.conversation_id:
                    conversation = conv_repo.get_by_id(self.state.conversation_id)
                
                if not conversation:
                    conversation = conv_repo.create(
                        session_id=self.state.session_id,
                        title=user_message[:100]  # Use first message as title
                    )
                    self.state.conversation_id = conversation.id
                
                # Update conversation's current agent
                if routing_result.selected_agent != AgentType.GENERAL:
                    db_agent_type = getattr(DBAgentType, routing_result.selected_agent.value.upper(), None)
                    if db_agent_type:
                        conv_repo.update_agent(conversation, db_agent_type)
                
                # Save user message
                msg_repo.create(
                    conversation_id=conversation.id,
                    role=MessageRole.USER,
                    content=user_message
                )
                
                # Save assistant message
                msg_repo.create(
                    conversation_id=conversation.id,
                    role=MessageRole.ASSISTANT,
                    content=response.message,
                    agent_id=response.agent_used,
                    tokens_used=response.metadata.get("tokens_used") if response.metadata else None,
                    latency_ms=response.metadata.get("latency_ms") if response.metadata else None
                )
                
                # Save routing log
                db_agent = getattr(DBAgentType, routing_result.selected_agent.value.upper(), None)
                routing_log_repo.create(
                    session_id=self.state.session_id,
                    conversation_id=conversation.id,
                    user_input=user_message,
                    detected_intent=routing_result.detected_intent,
                    selected_agent=db_agent,
                    confidence_score=routing_result.confidence,
                    routing_reason=routing_result.reasoning,
                    alternative_agents=routing_result.alternative_agents,
                    latency_ms=routing_result.latency_ms
                )
                
                # Save execution log with prompt and response details
                if response.prompt_sent or response.llm_response:
                    import json
                    execution_log_repo.create(
                        session_id=self.state.session_id,
                        conversation_id=conversation.id,
                        agent_id=db_agent,
                        action_type=response.action_type or "unknown",
                        success=response.success,
                        user_input=user_message,
                        prompt_sent=response.prompt_sent,
                        llm_response=response.llm_response,
                        parsed_response=response.parsed_response,
                        api_endpoint=response.api_endpoint,
                        api_method=response.api_method,
                        request_payload=response.request_payload,
                        response_data=response.response_data,
                        execution_time_ms=response.metadata.get("latency_ms") if response.metadata else None,
                        error_message=None
                    )
                
        except Exception as e:
            logger.error(f"Failed to save interaction: {e}", exc_info=True)


# Global orchestrator instance
_orchestrator: Optional[Orchestrator] = None


def get_orchestrator() -> Orchestrator:
    """Get or create the global orchestrator instance."""
    global _orchestrator
    if _orchestrator is None:
        _orchestrator = Orchestrator()
    return _orchestrator
