"""
Leave Agent - Handles leave applications and management.
Domains: leave
"""

from typing import List
from agents.base_agent import BaseAgent, AgentContext


class LeaveAgent(BaseAgent):
    """
    Agent for handling leave-related requests.
    
    Capabilities:
    - Apply for leave (casual, sick, earned, etc.)
    - View leave balance
    - View leave history
    - Cancel pending leave requests
    """
    
    @property
    def agent_id(self) -> str:
        return "leave"
    
    @property
    def agent_name(self) -> str:
        return "Leave Management Agent"
    
    @property
    def description(self) -> str:
        return "managing employee leave requests including applying for leave, checking balances, viewing history, and cancelling requests"
    
    @property
    def domain_names(self) -> List[str]:
        """Domains handled by this agent."""
        return ["leave"]
    
    def get_greeting(self) -> str:
        return "Hello! I can help you with leave-related matters. You can apply for leave, check your leave balance, view your leave history, or cancel a pending request. How can I assist you?"
    
    def get_api_documentation(self) -> str:
        """Get compact API documentation from base class."""
        return self._format_api_docs_compact()
    
    def get_agent_guidelines(self) -> str:
        """Return leave-specific guidelines."""
        return """
## Leave Guidelines
- Apply: Need leave_type + start_date + end_date + reason(optional).
- Date calc: "2 days from Feb 19" → end_date=Feb 20 (start counts as day 1).
- Balance: No params.
- Cancel: Need leave_id. Show history first to get ID.
"""
