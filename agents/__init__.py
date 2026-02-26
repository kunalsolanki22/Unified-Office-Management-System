"""
Agents package initialization.
"""

from agents.base_agent import (
    BaseAgent, AgentContext, AgentAction, AgentResult, ActionType
)
from agents.routing_agent import RoutingAgent, RoutingResult, AgentType
from agents.attendance_agent import AttendanceAgent
from agents.leave_agent import LeaveAgent
from agents.desk_conference_agent import DeskConferenceAgent
from agents.cafeteria_agent import CafeteriaAgent
from agents.it_agent import ITAgent

__all__ = [
    # Base
    "BaseAgent", "AgentContext", "AgentAction", "AgentResult", "ActionType",
    # Routing
    "RoutingAgent", "RoutingResult", "AgentType",
    # Domain Agents
    "AttendanceAgent",
    "LeaveAgent", 
    "DeskConferenceAgent",
    "CafeteriaAgent",
    "ITAgent"
]
