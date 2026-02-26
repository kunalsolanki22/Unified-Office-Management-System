"""
Cafeteria Agent - Handles food orders and cafeteria table bookings.
Domains: food_orders, cafeteria_tables
"""

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
        """Get compact API documentation from base class."""
        return self._format_api_docs_compact()
    
    def get_agent_guidelines(self) -> str:
        """Return cafeteria-specific guidelines."""
        return """
## Cafeteria Guidelines
- Food Order: MUST fetch_options (food_menu) first to get food_item_id, then api_call food_order.
- Table Booking: MUST fetch_options (cafeteria_table_list) first to get table_id, then api_call cafeteria_book.
  - User says "any table" → fetch available tables, auto-select first one.
  - Store date/time in collected_params while fetching tables.
- Cancel: Only pending orders. May need order history first.
- NEVER call cafeteria_book or food_order without fetching UUIDs first.
"""
