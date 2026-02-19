"""
Attendance Agent - Handles attendance check-in/out and holiday queries.
Domains: attendance, holidays
"""

import json
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
        """
        Fetch API documentation from knowledge base for attendance domains.
        This ensures request bodies and params are always in sync with KB.
        """
        lines = ["### Attendance & Holiday APIs"]
        lines.append("")
        
        for domain in self.domains:
            lines.append(f"**Domain: {domain.domain.replace('_', ' ').title()}**")
            lines.append(f"{domain.description}")
            lines.append("")
            
            for api in domain.apis:
                lines.append(f"**{api.id}**: {api.name}")
                lines.append(f"  - Description: {api.description}")
                lines.append(f"  - Endpoint: {api.method} {api.endpoint}")
                
                if api.request_body:
                    lines.append(f"  - Request Body (use EXACTLY these fields):")
                    lines.append(f"    {json.dumps(api.request_body, indent=4)}")
                    # Highlight fields that need dependent API
                    if api.request_body.get("required_fields"):
                        for field in api.request_body["required_fields"]:
                            if isinstance(field, dict) and field.get("source") == "dependent_api":
                                lines.append(f"    ⚠️ {field['name']}: MUST be fetched using dependent API (use fetch_options)")
                
                if api.query_params:
                    lines.append(f"  - Query Parameters:")
                    lines.append(f"    {json.dumps(api.query_params, indent=4)}")
                
                if api.path_params:
                    lines.append(f"  - Path Parameters: {', '.join(api.path_params)}")
                
                if api.dependent_apis:
                    lines.append(f"  - **DEPENDENT APIs** (MUST call first to get options):")
                    for dep_id in api.dependent_apis:
                        dep_api = self.kb_loader.get_api(dep_id)
                        if dep_api:
                            lines.append(f"    → {dep_id}: {dep_api.name} - {dep_api.description}")
                    lines.append(f"    Use action_type='fetch_options' with dependent_api_id to fetch these first!")
                
                lines.append("")
        
        return "\n".join(lines)
    
    def get_agent_guidelines(self) -> str:
        """Return attendance-specific guidelines."""
        return """
## Attendance-Specific Guidelines

### Check-in/Check-out
- If user tries to check in when already checked in, inform them politely
- Check-out requires being checked in first
- These APIs require NO parameters - just call them directly

### Attendance History
- Default to last 7 days if no date range specified
- Format dates as YYYY-MM-DD for API calls
- Always ask for date range if user doesn't specify

### Holidays
- Show upcoming holidays by default
- Can filter by specific year if requested

### Parameter Collection
- For attendance_history: Ask for start_date and end_date if not provided
- For attendance_summary: Ask for month and year if not provided
- For holidays_list: Year is optional, defaults to current year
"""
