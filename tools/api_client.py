"""
API Client - HTTP client for making calls to the backend API.
This is the "Tools" component that agents use to execute actions.
"""

import time
import logging
from typing import Optional, Dict, Any, Union
from dataclasses import dataclass
from enum import Enum
import httpx

from config.settings import get_settings

logger = logging.getLogger(__name__)


class HTTPMethod(str, Enum):
    """HTTP methods."""
    GET = "GET"
    POST = "POST"
    PUT = "PUT"
    PATCH = "PATCH"
    DELETE = "DELETE"


@dataclass
class APIResponse:
    """Structured API response."""
    success: bool
    status_code: int
    data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    latency_ms: int = 0
    
    def to_dict(self) -> dict:
        return {
            "success": self.success,
            "status_code": self.status_code,
            "data": self.data,
            "error": self.error,
            "latency_ms": self.latency_ms
        }


class APIClient:
    """
    HTTP client for backend API calls.
    Handles authentication, request formatting, and error handling.
    """
    
    def __init__(self, access_token: Optional[str] = None):
        """
        Initialize API client.
        
        Args:
            access_token: JWT token for authentication
        """
        self.settings = get_settings()
        self.base_url = self.settings.backend_base_url
        self.timeout = self.settings.api_timeout
        self._access_token = access_token
        self._client: Optional[httpx.Client] = None
    
    @property
    def access_token(self) -> Optional[str]:
        """Get current access token."""
        return self._access_token
    
    @access_token.setter
    def access_token(self, token: str):
        """Set access token and recreate client with new auth."""
        self._access_token = token
        # Close existing client so next request creates new one with auth
        if self._client:
            self._client.close()
            self._client = None
        logger.debug(f"Access token set: {token[:20]}..." if token else "Access token cleared")
    
    @property
    def client(self) -> httpx.Client:
        """Get or create HTTP client with current auth."""
        if self._client is None:
            headers = {
                "Content-Type": "application/json",
                "Accept": "application/json"
            }
            if self._access_token:
                headers["Authorization"] = f"Bearer {self._access_token}"
                logger.debug(f"Creating client with auth header")
            else:
                logger.debug(f"Creating client WITHOUT auth header")
            
            self._client = httpx.Client(
                base_url=self.base_url,
                headers=headers,
                timeout=self.timeout
            )
        return self._client
    
    def close(self):
        """Close the HTTP client."""
        if self._client:
            self._client.close()
            self._client = None
    
    def _build_url(self, endpoint: str) -> str:
        """Build full URL from endpoint."""
        # Remove leading slash if present
        endpoint = endpoint.lstrip("/")
        return endpoint
    
    def request(self,
                method: Union[HTTPMethod, str],
                endpoint: str,
                data: Optional[Dict[str, Any]] = None,
                params: Optional[Dict[str, Any]] = None,
                headers: Optional[Dict[str, str]] = None) -> APIResponse:
        """
        Make an HTTP request to the backend API.
        
        Args:
            method: HTTP method
            endpoint: API endpoint (relative to base URL)
            data: Request body (JSON)
            params: Query parameters
            headers: Additional headers
            
        Returns:
            APIResponse with result
        """
        start_time = time.time()
        url = self._build_url(endpoint)
        method_str = method.value if isinstance(method, HTTPMethod) else method.upper()
        
        try:
            logger.debug(f"API Request: {method_str} {url}")
            logger.debug(f"Data: {data}, Params: {params}")
            
            response = self.client.request(
                method=method_str,
                url=url,
                json=data,
                params=params,
                headers=headers
            )
            
            latency_ms = int((time.time() - start_time) * 1000)
            
            # Parse response
            try:
                response_data = response.json()
            except Exception:
                response_data = {"raw": response.text}
            
            # Check for success
            if response.is_success:
                return APIResponse(
                    success=True,
                    status_code=response.status_code,
                    data=response_data,
                    latency_ms=latency_ms
                )
            else:
                # Extract error message
                error_msg = self._extract_error_message(response_data, response.status_code)
                return APIResponse(
                    success=False,
                    status_code=response.status_code,
                    data=response_data,
                    error=error_msg,
                    latency_ms=latency_ms
                )
                
        except httpx.TimeoutException:
            latency_ms = int((time.time() - start_time) * 1000)
            logger.error(f"API timeout: {method_str} {url}")
            return APIResponse(
                success=False,
                status_code=0,
                error="Request timed out",
                latency_ms=latency_ms
            )
        except httpx.ConnectError as e:
            latency_ms = int((time.time() - start_time) * 1000)
            logger.error(f"API connection error: {e}")
            return APIResponse(
                success=False,
                status_code=0,
                error=f"Could not connect to server: {str(e)}",
                latency_ms=latency_ms
            )
        except Exception as e:
            latency_ms = int((time.time() - start_time) * 1000)
            logger.error(f"API request error: {e}")
            return APIResponse(
                success=False,
                status_code=0,
                error=str(e),
                latency_ms=latency_ms
            )
    
    def _extract_error_message(self, response_data: dict, status_code: int) -> str:
        """Extract human-readable error message from response."""
        if isinstance(response_data, dict):
            # Try common error field names
            for field in ["detail", "message", "error", "errors"]:
                if field in response_data:
                    value = response_data[field]
                    if isinstance(value, str):
                        return value
                    elif isinstance(value, list) and value:
                        return str(value[0])
                    elif isinstance(value, dict):
                        return str(value)
        
        # Default error messages based on status code
        status_messages = {
            400: "Bad request - invalid data provided",
            401: "Authentication required - please login",
            403: "Access denied - you don't have permission",
            404: "Resource not found",
            409: "Conflict - resource already exists",
            422: "Validation error - check your input",
            500: "Server error - please try again later"
        }
        return status_messages.get(status_code, f"Request failed with status {status_code}")
    
    # Convenience methods
    def get(self, endpoint: str, params: Optional[Dict[str, Any]] = None) -> APIResponse:
        """Make a GET request."""
        return self.request(HTTPMethod.GET, endpoint, params=params)
    
    def post(self, endpoint: str, data: Optional[Dict[str, Any]] = None,
             params: Optional[Dict[str, Any]] = None) -> APIResponse:
        """Make a POST request."""
        return self.request(HTTPMethod.POST, endpoint, data=data, params=params)
    
    def put(self, endpoint: str, data: Optional[Dict[str, Any]] = None) -> APIResponse:
        """Make a PUT request."""
        return self.request(HTTPMethod.PUT, endpoint, data=data)
    
    def patch(self, endpoint: str, data: Optional[Dict[str, Any]] = None) -> APIResponse:
        """Make a PATCH request."""
        return self.request(HTTPMethod.PATCH, endpoint, data=data)
    
    def delete(self, endpoint: str, params: Optional[Dict[str, Any]] = None) -> APIResponse:
        """Make a DELETE request."""
        return self.request(HTTPMethod.DELETE, endpoint, params=params)


class AuthenticatedAPIClient(APIClient):
    """
    API Client with authentication handling.
    Automatically handles login and token refresh.
    """
    
    def __init__(self):
        super().__init__()
        self._user_info: Optional[Dict[str, Any]] = None
    
    @property
    def is_authenticated(self) -> bool:
        """Check if client is authenticated."""
        return self._access_token is not None
    
    @property
    def user_info(self) -> Optional[Dict[str, Any]]:
        """Get cached user info."""
        return self._user_info
    
    def login(self, email: str, password: str) -> APIResponse:
        """
        Login and obtain access token.
        
        Args:
            email: User email
            password: User password
            
        Returns:
            APIResponse with token on success
        """
        response = self.post("/auth/login", data={
            "email": email,
            "password": password
        })
        
        if response.success and response.data:
            logger.debug(f"Login response data: {response.data}")
            # Extract token from response - handle nested structure
            token = response.data.get("access_token")
            if not token and "data" in response.data:
                # Handle nested: {"data": {"access_token": "..."}}
                token = response.data["data"].get("access_token")
            if not token and "token" in response.data:
                # Handle alternative: {"token": "..."}
                token = response.data.get("token")
                
            if token:
                self.access_token = token
                logger.info(f"Login successful for {email}, token set")
            else:
                logger.warning(f"Login response missing access_token: {response.data.keys()}")
        
        return response
    
    def get_current_user(self) -> APIResponse:
        """
        Get current user information.
        
        Returns:
            APIResponse with user data
        """
        response = self.get("/users/me")
        
        if response.success and response.data:
            self._user_info = response.data
        
        return response
    
    def logout(self):
        """Clear authentication state."""
        self._access_token = None
        self._user_info = None
        if self._client:
            self._client.close()
            self._client = None
        logger.info("Logged out")


# Global API client instance
_api_client: Optional[AuthenticatedAPIClient] = None


def get_api_client() -> AuthenticatedAPIClient:
    """Get or create the global API client instance."""
    global _api_client
    if _api_client is None:
        _api_client = AuthenticatedAPIClient()
    return _api_client
