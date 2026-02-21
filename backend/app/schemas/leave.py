from pydantic import BaseModel, Field, field_validator, model_validator
from typing import Optional, List
from datetime import datetime, date
from decimal import Decimal
from uuid import UUID

from ..models.enums import LeaveType, LeaveStatus


class LeaveRequestCreate(BaseModel):
    """
    Leave request creation schema.
    
    Single-level approval flow depends on user role:
    - Employee: Approved by Team Lead
    - Team Lead: Approved by Manager
    - Manager: Approved by Admin
    - Admin: Approved by Super Admin
    - Super Admin: Auto-approved
    """
    leave_type: LeaveType
    start_date: date
    end_date: date
    reason: Optional[str] = None
    is_half_day: bool = False
    half_day_type: Optional[str] = None  # first_half, second_half
    emergency_contact: Optional[str] = None
    emergency_phone: Optional[str] = None
    
    @field_validator('end_date')
    @classmethod
    def validate_dates(cls, v, info):
        start = info.data.get('start_date')
        if start and v < start:
            raise ValueError('End date must be on or after start date')
        return v
    
    @model_validator(mode='after')
    def validate_half_day(self):
        """Validate half_day_type based on is_half_day flag."""
        if self.is_half_day:
            if not self.half_day_type:
                raise ValueError('half_day_type is required when is_half_day is True')
            if self.half_day_type not in ['first_half', 'second_half']:
                raise ValueError('half_day_type must be either first_half or second_half')
        else:
            # Clear half_day_type if is_half_day is False
            self.half_day_type = None
        return self


class LeaveRequestUpdate(BaseModel):
    """Leave request update schema (only for PENDING status)."""
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    reason: Optional[str] = None
    is_half_day: Optional[bool] = None
    half_day_type: Optional[str] = None
    emergency_contact: Optional[str] = None
    emergency_phone: Optional[str] = None


class LeaveApproval(BaseModel):
    """
    Leave approval schema (single-level approval).
    
    Approval hierarchy:
    - Team Lead: Approves Employee leave
    - Manager: Approves Team Lead leave
    - Admin: Approves Manager leave
    - Super Admin: Approves Admin leave (own leave auto-approved)
    
    Approver details are automatically filled from current logged-in user.
    """
    action: str = Field(..., pattern="^(approve|reject)$")
    notes: Optional[str] = None
    rejection_reason: Optional[str] = None  # Required if action is 'reject'


class LeaveCancellation(BaseModel):
    """Leave cancellation schema."""
    reason: Optional[str] = None


class LeaveTypeResponse(BaseModel):
    """Leave type configuration response."""
    id: UUID
    name: str
    code: LeaveType
    default_days: int
    is_paid: bool
    requires_approval: bool
    is_active: bool
    description: Optional[str] = None
    can_carry_forward: bool
    max_carry_forward_days: int
    
    class Config:
        from_attributes = True


class LeaveBalanceResponse(BaseModel):
    """Leave balance response schema with user_code."""
    id: UUID
    user_code: str
    leave_type: LeaveType
    leave_type_name: Optional[str] = None
    year: int
    total_days: Decimal
    used_days: Decimal
    pending_days: Decimal
    available_days: float
    
    class Config:
        from_attributes = True


class LeaveRequestResponse(BaseModel):
    """Leave request response schema with user_code."""
    id: UUID
    user_code: str
    leave_type: LeaveType
    leave_type_name: Optional[str] = None
    start_date: date
    end_date: date
    total_days: Decimal
    is_half_day: bool
    half_day_type: Optional[str] = None
    reason: Optional[str] = None
    status: LeaveStatus
    
    # Single-level approval (approver details auto-filled from current user)
    approver_code: Optional[str] = None
    approver_name: Optional[str] = None
    approved_at: Optional[datetime] = None
    approval_notes: Optional[str] = None
    
    # Rejection (rejector details auto-filled from current user)
    rejection_reason: Optional[str] = None
    rejected_by_code: Optional[str] = None
    rejected_by_name: Optional[str] = None
    rejected_at: Optional[datetime] = None
    
    # Cancellation
    cancelled_at: Optional[datetime] = None
    cancellation_reason: Optional[str] = None
    
    # Emergency contact
    emergency_contact: Optional[str] = None
    emergency_phone: Optional[str] = None
    
    # Deprecated fields (kept for backward compatibility)
    # level1_approver_code: Optional[str] = None
    # level1_approver_name: Optional[str] = None
    # level1_approved_at: Optional[datetime] = None
    # level1_notes: Optional[str] = None
    # final_approver_code: Optional[str] = None
    # final_approver_name: Optional[str] = None
    # final_approved_at: Optional[datetime] = None
    # final_approval_notes: Optional[str] = None
    
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class LeaveRequestDetailResponse(LeaveRequestResponse):
    """Detailed leave request with user info."""
    user_name: Optional[str] = None
    user_email: Optional[str] = None
    user_department: Optional[str] = None
    
    class Config:
        from_attributes = True


class LeaveRequestListResponse(BaseModel):
    """Paginated leave request list response."""
    leave_requests: List[LeaveRequestDetailResponse]
    total: int
    page: int
    page_size: int


class PendingLeaveApprovalResponse(BaseModel):
    """Response for pending leave approvals."""
    request_id: UUID
    user_code: str
    user_name: str
    leave_type: LeaveType
    start_date: date
    end_date: date
    total_days: Decimal
    reason: Optional[str] = None
    status: LeaveStatus
    created_at: datetime
    
    class Config:
        from_attributes = True


class LeaveBalanceSummary(BaseModel):
    """Summary of all leave balances for a user."""
    user_code: str
    user_name: str
    year: int
    balances: List[LeaveBalanceResponse]