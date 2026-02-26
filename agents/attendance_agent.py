"""
Attendance Agent - Handles attendance check-in/out and holiday queries.
Domains: attendance, holidays
"""

from typing import List
from agents.base_agent import BaseAgent, AgentContext


class AttendanceAgent(BaseAgent):
    """
    Agent for handling attendance-related requests.
    
    Capabilities:
    - Check in to office
    - Check out from office  
    - View attendance history
    - View attendance summary
    - Get list of holidays
    """
    
    @property
    def agent_id(self) -> str:
        return "attendance"
    
    @property
    def agent_name(self) -> str:
        return "Attendance Management Agent"
    
    @property
    def description(self) -> str:
        return "managing employee attendance including check-in, check-out, attendance history, and holiday information"
    
    @property
    def domain_names(self) -> List[str]:
        """Domains handled by this agent."""
        return ["attendance", "holidays"]
    
    def get_greeting(self) -> str:
        return "Hi! I can help you with attendance-related tasks like checking in, checking out, viewing your attendance history, or checking upcoming holidays. What would you like to do?"
    
    def get_api_documentation(self) -> str:
        """Get compact API documentation from base class."""
        return self._format_api_docs_compact()
    
    def get_agent_guidelines(self) -> str:
        """Return attendance-specific guidelines."""
        return """
## Attendance Guidelines
- Check-in/out: No params needed, call directly.
- History: Need start_date + end_date (default: last 7 days).
- Summary: Need month + year.
- Holidays: Year optional (defaults current).
"""
