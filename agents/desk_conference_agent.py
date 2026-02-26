"""
Desk & Conference Agent - Handles desk and conference room bookings.
Domains: desk_booking, conference_room
"""

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
        """Get compact API documentation from base class."""
        return self._format_api_docs_compact()
    
    def get_agent_guidelines(self) -> str:
        """Return desk/conference-specific guidelines."""
        return """
## Desk/Conference Guidelines
- Desk Booking: MUST fetch_options (desk_list) first to get desk_id, then api_call desk_book.
  - User says "any desk" → fetch available desks, auto-select first one.
- Room Booking: MUST fetch_options (room_list) first to get room_id, then api_call room_book.
  - User says "any room" → fetch available rooms for the time slot, auto-select first.
  - Store date/time in collected_params while fetching.
- Ambiguous "booking"? Ask: desk or room?
- Cancel: Need booking_id. May fetch history first.
- NEVER call desk_book or room_book without fetching UUIDs first.
"""
