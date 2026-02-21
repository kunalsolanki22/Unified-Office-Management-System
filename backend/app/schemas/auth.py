from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator
from typing import Optional
from datetime import datetime

from ..utils.validators import validate_password_strength


class LoginRequest(BaseModel):
    """Login request schema."""
    email: EmailStr
    password: str = Field(..., min_length=8)


class LoginResponse(BaseModel):
    """Login response schema."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user_id: str
    role: str
    manager_type: Optional[str] = None  # For MANAGER role only


class TokenRefreshRequest(BaseModel):
    """Token refresh request schema."""
    refresh_token: str


class TokenRefreshResponse(BaseModel):
    """Token refresh response schema."""
    access_token: str
    token_type: str = "bearer"
    expires_in: int


class PasswordChangeRequest(BaseModel):
    """Password change request schema.
    
    Password Requirements:
    - At least 8 characters long
    - At least one uppercase letter
    - At least one lowercase letter
    - At least one digit
    - At least one special character (!@#$%^&*()_+-=[]{}|;:',.<>?/`~)
    """
    current_password: str = Field(..., min_length=8)
    new_password: str = Field(..., min_length=8)
    confirm_password: str = Field(..., min_length=8)
    
    @field_validator('new_password')
    @classmethod
    def validate_new_password_strength(cls, v: str) -> str:
        """Validate new password meets strength requirements."""
        is_valid, error_message = validate_password_strength(v)
        if not is_valid:
            raise ValueError(error_message)
        return v
    
    @model_validator(mode='after')
    def validate_passwords_match(self):
        """Validate new_password and confirm_password match."""
        if self.new_password != self.confirm_password:
            raise ValueError('New password and confirm password do not match')
        if self.current_password == self.new_password:
            raise ValueError('New password must be different from current password')
        return self


class TokenPayload(BaseModel):
    """JWT token payload schema."""
    user_id: str
    role: str
    manager_type: Optional[str] = None  # For MANAGER role only
    exp: datetime
    type: str  # access or refresh