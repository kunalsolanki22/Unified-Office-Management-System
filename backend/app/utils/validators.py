import re
from ..core.config import settings


def validate_company_email(email: str) -> bool:
    """Validate email matches company format."""
    pattern = rf"^[a-z]+\.[a-z]+@{re.escape(settings.COMPANY_DOMAIN)}$"
    return bool(re.match(pattern, email.lower()))


def validate_password_strength(password: str) -> tuple[bool, str]:
    """Validate password meets requirements.
    
    Requirements:
    - At least 8 characters long
    - At least one uppercase letter
    - At least one lowercase letter  
    - At least one digit
    - At least one special character (!@#$%^&*()_+-=[]{}|;:',.<>?/`~)
    """
    special_characters = "!@#$%^&*()_+-=[]{}|;:',.<>?/`~"
    
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
    
    if not any(c.isupper() for c in password):
        return False, "Password must contain at least one uppercase letter"
    
    if not any(c.islower() for c in password):
        return False, "Password must contain at least one lowercase letter"
    
    if not any(c.isdigit() for c in password):
        return False, "Password must contain at least one digit"
    
    if not any(c in special_characters for c in password):
        return False, "Password must contain at least one special character (!@#$%^&*()_+-=[]{}|;:',.<>?/`~)"
    
    return True, ""


def validate_vehicle_number(vehicle_number: str) -> tuple[bool, str]:
    """Validate Indian vehicle number format.
    
    Expected format: XX-00-XX-0000 (e.g., GJ-33-DD-3333)
    - First 2 characters: State code (letters)
    - Next 2 characters: District code (digits)
    - Next 1-2 characters: Series (letters)
    - Last 1-4 characters: Number (digits)
    
    Also accepts formats without hyphens: GJ33DD3333
    """
    # Remove spaces and convert to uppercase
    vehicle_number = vehicle_number.strip().upper()
    
    # Pattern with hyphens: GJ-33-DD-3333 or GJ-33-D-3333
    pattern_with_hyphens = r'^[A-Z]{2}-[0-9]{2}-[A-Z]{1,2}-[0-9]{1,4}$'
    
    # Pattern without hyphens: GJ33DD3333 or GJ33D3333
    pattern_without_hyphens = r'^[A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{1,4}$'
    
    if re.match(pattern_with_hyphens, vehicle_number):
        return True, ""
    elif re.match(pattern_without_hyphens, vehicle_number):
        return True, ""
    else:
        return False, "Vehicle number must be in format: XX-00-XX-0000 (e.g., GJ-33-DD-3333)"


def validate_phone_number(phone: str) -> tuple[bool, str]:
    """Validate phone number is exactly 10 digits.
    
    Requirements:
    - Exactly 10 digits
    - Only numeric characters allowed
    """
    # Remove any spaces, hyphens, or other common separators
    cleaned_phone = re.sub(r'[\s\-\(\)\+]', '', phone)
    
    # Check if it starts with country code (like 91 for India)
    if cleaned_phone.startswith('91') and len(cleaned_phone) == 12:
        cleaned_phone = cleaned_phone[2:]  # Remove country code
    
    # Check if exactly 10 digits
    if not cleaned_phone.isdigit():
        return False, "Phone number must contain only digits"
    
    if len(cleaned_phone) != 10:
        return False, "Phone number must be exactly 10 digits"
    
    return True, ""