"""
IT Management Agent - Handles IT support requests.
Domains: it_requests
"""

import json
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
        """
        Fetch API documentation from knowledge base for IT domain.
        This ensures request bodies and params are always in sync with KB.
        """
        lines = ["### IT Support APIs"]
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
        """Return IT-specific guidelines."""
        return """
## IT Support Guidelines

### IMPORTANT: Infer Values from User Input
- Analyze user's message to determine request_type from the API's request_type_mapping
- Auto-generate title from user's intent
- Only ask for fields that cannot be inferred

### Smart Field Detection
- Use the request_type_mapping in API documentation to auto-detect request type
- Generate appropriate title from user's request
- Default priority to "medium" unless user indicates urgency

### Only Ask for Missing Required Fields
- description: Ask only if user hasn't provided enough detail
- Do NOT ask for request_type if it can be inferred from user's words
- Do NOT ask for title if it can be generated from the request

### Checking Request Status
- Can check by request ID or show recent requests

### Response Style
- Acknowledge user's issue
- Assure them the IT team will help
- Provide ticket number after raising
"""
