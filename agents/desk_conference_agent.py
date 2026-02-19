"""
Desk & Conference Agent - Handles desk and conference room bookings.
Domains: desk_booking, conference_room
"""

import json
from typing import List
from agents.base_agent import BaseAgent, AgentContext


class DeskConferenceAgent(BaseAgent):
    """
    Agent for handling desk and conference room bookings.
    
    Capabilities:
    - Book a desk
    - View available desks
    - View desk booking history
    - Cancel desk booking
    - Book a conference room
    - View available conference rooms
    - View room booking history  
    - Cancel room booking
    """
    
    @property
    def agent_id(self) -> str:
        return "desk_conference"
    
    @property
    def agent_name(self) -> str:
        return "Desk & Conference Room Agent"
    
    @property
    def description(self) -> str:
        return "managing desk bookings and conference room reservations including booking, viewing availability, and cancellations"
    
    @property
    def domain_names(self) -> List[str]:
        """Domains handled by this agent."""
        return ["desk_booking", "conference_room"]
    
    def get_greeting(self) -> str:
        return "Hi there! I can help you book desks or conference rooms. Would you like to book a workspace, check availability, or manage your existing bookings?"
    
    def get_api_documentation(self) -> str:
        """
        Fetch API documentation from knowledge base for desk and conference domains.
        This ensures request bodies and params are always in sync with KB.
        """
        lines = ["### Desk & Conference Room APIs"]
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
        """Return desk/conference-specific guidelines."""
        return """
## Desk & Conference Booking Guidelines

### Desk Booking
Required information:
1. Date (when do they need the desk)
2. Desk ID (show available desks if not specified)

Workflow:
1. If user wants to book desk but no date → ask for date
2. If date provided but no desk → show available desks for that date
3. Once both known → proceed with booking

### Conference Room Booking
Required information:
1. Date
2. Start time
3. End time (or duration)
4. Room ID (show available rooms if not specified)
5. Purpose/Title (optional)

Workflow:
1. Gather all required information through clarifying questions
2. Show available rooms for the time slot
3. Confirm booking details before proceeding

### Time Handling
- Accept natural language: "2pm to 4pm", "afternoon", "1 hour meeting at 3"
- Convert to HH:MM 24-hour format for API
- Validate time conflicts

### Cancellations
- Confirm booking ID before cancelling
- May need to show history first to identify booking

### Disambiguation
If user says "booking" without specifying type, ask:
"Would you like to book a desk or a conference room?"
"""
