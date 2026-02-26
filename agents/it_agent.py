"""
IT Management Agent - Handles IT support requests.
Domains: it_requests
"""

from typing import List
from agents.base_agent import BaseAgent, AgentContext


class ITAgent(BaseAgent):
    """
    Agent for handling IT-related requests.
    
    Capabilities:
    - Raise IT support tickets
    - View IT request history
    - Check IT request status
    """
    
    @property
    def agent_id(self) -> str:
        return "it_management"
    
    @property
    def agent_name(self) -> str:
        return "IT Management Agent"
    
    @property
    def description(self) -> str:
        return "managing IT support requests including raising tickets, checking status, and viewing request history"
    
    @property
    def domain_names(self) -> List[str]:
        """Domains handled by this agent."""
        return ["it_requests"]
    
    def get_greeting(self) -> str:
        return "Hello! I'm here to help with IT-related issues. You can raise a support ticket, check the status of an existing request, or view your IT request history. What do you need help with?"
    
    def get_api_documentation(self) -> str:
        """Get compact API documentation from base class."""
        return self._format_api_docs_compact()
    
    def get_agent_guidelines(self) -> str:
        """Return IT-specific guidelines."""
        return """
## IT Support Guidelines
- Infer request_type from user's words using request_type_mapping in API docs.
- Auto-generate title from user's intent.
- Default priority: medium (unless user says urgent).
- Only ask for description if user hasn't provided detail.
"""
