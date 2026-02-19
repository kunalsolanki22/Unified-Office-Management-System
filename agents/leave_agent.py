"""
Leave Agent - Handles leave applications and management.
Domains: leave
"""

import json
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
        """
        Fetch API documentation from knowledge base for leave domain.
        This ensures request bodies and params are always in sync with KB.
        """
        lines = ["### Leave Management APIs"]
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
        """Return leave-specific guidelines."""
        return """
## Leave-Specific Guidelines

### Applying for Leave
Required information - MUST collect all before API call:
1. leave_type (MUST be one of the values from the API documentation above)
2. start_date (YYYY-MM-DD format)
3. end_date (YYYY-MM-DD format)
4. reason (optional but recommended)

### CRITICAL: Date Calculation Rules
When user specifies number of days, calculate end_date correctly:
- The start_date counts as DAY 1 (not day 0)
- Formula: end_date = start_date + (number_of_days - 1)
- Example: 10 days starting Feb 23, 2026:
  - Day 1: Feb 23, Day 2: Feb 24, ... Day 6: Feb 28, Day 7: Mar 1, Day 8: Mar 2, Day 9: Mar 3, Day 10: Mar 4
  - end_date = 2026-03-04 (NOT 2026-03-05)
- Example: 2 days starting Feb 19, 2026:
  - Day 1: Feb 19, Day 2: Feb 20
  - end_date = 2026-02-20 (NOT 2026-02-21)
- ALWAYS verify your calculation before confirming with user

### Date Handling
- Accept natural language dates like "tomorrow", "next Monday", "March 15"
- ALWAYS convert to YYYY-MM-DD format for API calls
- Validate that end_date is not before start_date

### Leave Balance
- No parameters needed - just call the API

### Leave Cancellation
- Requires leave_id as path parameter
- Show leave_history first to get the leave_id if user doesn't know it
- Confirm before cancelling

### Parameter Collection Workflow
1. If user says "I want leave" - ask for type, dates
2. If user provides partial info - ask for missing required fields
3. Only call leave_apply when ALL required params are collected
"""
