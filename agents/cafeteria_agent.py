"""
Cafeteria Agent - Handles food orders and cafeteria table bookings.
Domains: food_orders, cafeteria_tables
"""

import json
from typing import List
from agents.base_agent import BaseAgent, AgentContext


class CafeteriaAgent(BaseAgent):
    """
    Agent for handling cafeteria-related requests.
    
    Capabilities:
    - View food menu
    - Place food order
    - View order history
    - Cancel food order
    - View available cafeteria tables
    - Book cafeteria table
    - View table booking history
    - Cancel table booking
    """
    
    @property
    def agent_id(self) -> str:
        return "cafeteria"
    
    @property
    def agent_name(self) -> str:
        return "Cafeteria Management Agent"
    
    @property
    def description(self) -> str:
        return "managing cafeteria services including viewing menus, placing food orders, and booking cafeteria tables"
    
    @property
    def domain_names(self) -> List[str]:
        """Domains handled by this agent."""
        return ["food_orders", "cafeteria_tables"]
    
    def get_greeting(self) -> str:
        return "Welcome! I can help you with cafeteria services. Would you like to see today's menu, place a food order, or book a table in the cafeteria?"
    
    def get_api_documentation(self) -> str:
        """
        Fetch API documentation from knowledge base for cafeteria domains.
        This ensures request bodies and params are always in sync with KB.
        """
        lines = ["### Cafeteria APIs (Food Orders & Table Bookings)"]
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
        """Return cafeteria-specific guidelines."""
        return """
## Cafeteria Service Guidelines

### Food Orders

#### Viewing Menu
- Show menu for today by default
- Can filter by date if requested
- Group items by category if available

#### Placing Orders
Required information:
1. Menu item ID(s) - from the menu
2. Quantity for each item
3. Pickup time (optional)

Workflow:
1. If user wants to order but hasn't seen menu → show menu first
2. Help user select items from menu
3. Confirm order before placing

#### Order Cancellation
- Only pending orders can be cancelled
- May need to show order history first

### Table Booking

#### Viewing Available Tables
Required: date, time slot
Optional: number of seats needed

#### Booking Tables
Required information:
1. Date (YYYY-MM-DD format)
2. Time slot (start_time, end_time in HH:MM format)
3. Table ID (show available if not specified)
4. Number of guests (optional)

Workflow:
1. Ask for date and time preference
2. Show available tables for that slot
3. Confirm selection and book

### Tips
- Be helpful with menu recommendations
- Suggest popular items if user is unsure
- Confirm dietary preferences if mentioned
"""
