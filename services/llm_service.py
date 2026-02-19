"""
LLM Service - Handles interactions with Large Language Models.
Supports Groq (primary) and OpenAI (fallback).
"""

import json
import time
import logging
from typing import Optional, List, Dict, Any, Union
from dataclasses import dataclass
from abc import ABC, abstractmethod

from config.settings import get_settings

logger = logging.getLogger(__name__)


@dataclass
class LLMResponse:
    """Structured response from LLM."""
    content: str
    tokens_used: int
    latency_ms: int
    model: str
    raw_response: Optional[dict] = None


@dataclass
class ChatMessage:
    """Chat message structure."""
    role: str  # "system", "user", "assistant"
    content: str
    
    def to_dict(self) -> dict:
        return {"role": self.role, "content": self.content}


class BaseLLMProvider(ABC):
    """Abstract base class for LLM providers."""
    
    @abstractmethod
    def chat(self, messages: List[ChatMessage], **kwargs) -> LLMResponse:
        """Send chat messages and get response."""
        pass
    
    @abstractmethod
    def is_available(self) -> bool:
        """Check if the provider is available."""
        pass


class GroqProvider(BaseLLMProvider):
    """Groq LLM provider using their API."""
    
    def __init__(self, api_key: str, model: str):
        self.api_key = api_key
        self.model = model
        self._client = None
    
    @property
    def client(self):
        """Lazy initialization of Groq client."""
        if self._client is None:
            try:
                from groq import Groq
                self._client = Groq(api_key=self.api_key)
            except ImportError:
                raise ImportError("groq package not installed. Run: pip install groq")
        return self._client
    
    def is_available(self) -> bool:
        """Check if Groq is available."""
        return bool(self.api_key)
    
    def chat(self, messages: List[ChatMessage], 
             temperature: float = 0.7,
             max_tokens: int = 1024,
             **kwargs) -> LLMResponse:
        """Send chat request to Groq."""
        start_time = time.time()
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[m.to_dict() for m in messages],
                temperature=temperature,
                max_tokens=max_tokens,
                **kwargs
            )
            
            latency_ms = int((time.time() - start_time) * 1000)
            
            return LLMResponse(
                content=response.choices[0].message.content,
                tokens_used=response.usage.total_tokens if response.usage else 0,
                latency_ms=latency_ms,
                model=self.model,
                raw_response=response.model_dump() if hasattr(response, 'model_dump') else None
            )
        except Exception as e:
            logger.error(f"Groq API error: {e}")
            raise


class OpenAIProvider(BaseLLMProvider):
    """OpenAI LLM provider."""
    
    def __init__(self, api_key: str, model: str):
        self.api_key = api_key
        self.model = model
        self._client = None
    
    @property
    def client(self):
        """Lazy initialization of OpenAI client."""
        if self._client is None:
            try:
                from openai import OpenAI
                self._client = OpenAI(api_key=self.api_key)
            except ImportError:
                raise ImportError("openai package not installed. Run: pip install openai")
        return self._client
    
    def is_available(self) -> bool:
        """Check if OpenAI is available."""
        return bool(self.api_key)
    
    def chat(self, messages: List[ChatMessage],
             temperature: float = 0.7,
             max_tokens: int = 1024,
             **kwargs) -> LLMResponse:
        """Send chat request to OpenAI."""
        start_time = time.time()
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[m.to_dict() for m in messages],
                temperature=temperature,
                max_tokens=max_tokens,
                **kwargs
            )
            
            latency_ms = int((time.time() - start_time) * 1000)
            
            return LLMResponse(
                content=response.choices[0].message.content,
                tokens_used=response.usage.total_tokens if response.usage else 0,
                latency_ms=latency_ms,
                model=self.model,
                raw_response=response.model_dump() if hasattr(response, 'model_dump') else None
            )
        except Exception as e:
            logger.error(f"OpenAI API error: {e}")
            raise


class LLMService:
    """
    Main LLM service that handles all LLM interactions.
    Supports multiple providers with automatic fallback.
    """
    
    def __init__(self):
        self.settings = get_settings()
        self._providers: Dict[str, BaseLLMProvider] = {}
        self._initialize_providers()
    
    def _initialize_providers(self):
        """Initialize available LLM providers."""
        # Groq provider (primary)
        if self.settings.groq_api_key:
            self._providers["groq"] = GroqProvider(
                api_key=self.settings.groq_api_key,
                model=self.settings.groq_model
            )
        
        # Groq provider (secondary - for rate limit fallback)
        if self.settings.groq_api_key_2:
            self._providers["groq_2"] = GroqProvider(
                api_key=self.settings.groq_api_key_2,
                model=self.settings.groq_model_2
            )
        
        # OpenAI provider
        if self.settings.openai_api_key:
            self._providers["openai"] = OpenAIProvider(
                api_key=self.settings.openai_api_key,
                model=self.settings.openai_model
            )
        
        # Define fallback order
        self._fallback_order = ["groq", "groq_2", "openai"]
    
    @property
    def primary_provider(self) -> Optional[BaseLLMProvider]:
        """Get the primary LLM provider based on settings."""
        provider_name = self.settings.llm_provider
        return self._providers.get(provider_name)
    
    def chat(self, 
             messages: List[ChatMessage],
             temperature: Optional[float] = None,
             max_tokens: Optional[int] = None,
             provider: Optional[str] = None,
             **kwargs) -> LLMResponse:
        """
        Send a chat request to the LLM.
        
        Args:
            messages: List of chat messages
            temperature: Override default temperature
            max_tokens: Override default max tokens
            provider: Specific provider to use (defaults to primary)
            **kwargs: Additional provider-specific parameters
            
        Returns:
            LLMResponse with content and metadata
        """
        # Get provider
        if provider:
            llm_provider = self._providers.get(provider)
            if not llm_provider:
                raise ValueError(f"Provider '{provider}' not available")
        else:
            llm_provider = self.primary_provider
            if not llm_provider:
                raise ValueError("No LLM provider configured. Set GROQ_API_KEY or OPENAI_API_KEY")
        
        # Set defaults
        temp = temperature if temperature is not None else self.settings.llm_temperature
        tokens = max_tokens if max_tokens is not None else self.settings.llm_max_tokens
        
        # Try primary provider first, then fallback on rate limit
        providers_to_try = [llm_provider]
        
        # Add fallback providers if using primary
        if not provider:  # Only add fallbacks when not explicitly specifying a provider
            for fallback_name in self._fallback_order:
                fallback = self._providers.get(fallback_name)
                if fallback and fallback != llm_provider:
                    providers_to_try.append(fallback)
        
        last_error = None
        for current_provider in providers_to_try:
            try:
                logger.debug(f"Sending chat request to {current_provider.__class__.__name__}")
                return current_provider.chat(
                    messages=messages,
                    temperature=temp,
                    max_tokens=tokens,
                    **kwargs
                )
            except Exception as e:
                error_str = str(e).lower()
                # Check if it's a rate limit error
                if "rate_limit" in error_str or "rate limit" in error_str or "429" in error_str or "too many requests" in error_str:
                    logger.warning(f"Rate limit hit on {current_provider.__class__.__name__}, trying fallback...")
                    last_error = e
                    continue
                else:
                    # For non-rate-limit errors, raise immediately
                    raise
        
        # If all providers failed with rate limits
        if last_error:
            raise Exception(f"All LLM providers rate limited. Please wait and try again. Last error: {last_error}")
        
        # This shouldn't happen, but just in case
        raise Exception("No LLM provider could handle the request"
        )
    
    def chat_with_system(self,
                          system_prompt: str,
                          user_message: str,
                          conversation_history: Optional[List[ChatMessage]] = None,
                          **kwargs) -> LLMResponse:
        """
        Convenience method for chat with a system prompt.
        
        Args:
            system_prompt: System instruction for the LLM
            user_message: Current user message
            conversation_history: Previous messages in the conversation
            **kwargs: Additional parameters
            
        Returns:
            LLMResponse
        """
        messages = [ChatMessage(role="system", content=system_prompt)]
        
        if conversation_history:
            messages.extend(conversation_history)
        
        messages.append(ChatMessage(role="user", content=user_message))
        
        return self.chat(messages=messages, **kwargs)
    
    def parse_json_response(self, response: LLMResponse) -> Optional[Dict[str, Any]]:
        """
        Parse JSON from LLM response content.
        Handles markdown code blocks, raw JSON, and JSON embedded in text.
        
        Args:
            response: LLM response to parse
            
        Returns:
            Parsed JSON dict or None if parsing fails
        """
        content = response.content.strip()
        
        # Try to extract JSON from markdown code blocks
        if "```json" in content:
            start = content.find("```json") + 7
            end = content.find("```", start)
            if end > start:
                content = content[start:end].strip()
        elif "```" in content:
            start = content.find("```") + 3
            end = content.find("```", start)
            if end > start:
                content = content[start:end].strip()
        
        # Try direct parsing first
        try:
            return json.loads(content)
        except json.JSONDecodeError:
            pass
        
        # Try to find JSON object within text (LLM sometimes adds text before/after)
        # Look for { ... } pattern
        brace_start = content.find('{')
        if brace_start != -1:
            # Find the matching closing brace
            depth = 0
            brace_end = -1
            for i, char in enumerate(content[brace_start:], brace_start):
                if char == '{':
                    depth += 1
                elif char == '}':
                    depth -= 1
                    if depth == 0:
                        brace_end = i + 1
                        break
            
            if brace_end > brace_start:
                json_str = content[brace_start:brace_end]
                try:
                    return json.loads(json_str)
                except json.JSONDecodeError:
                    pass
        
        logger.warning(f"Failed to parse JSON from LLM response: {content[:200]}...")
        return None
    
    def generate_structured_response(self,
                                      system_prompt: str,
                                      user_message: str,
                                      response_schema: Dict[str, Any],
                                      conversation_history: Optional[List[ChatMessage]] = None,
                                      **kwargs) -> Optional[Dict[str, Any]]:
        """
        Generate a structured JSON response from the LLM.
        
        Args:
            system_prompt: System instruction
            user_message: User message
            response_schema: Expected JSON schema for response
            conversation_history: Previous messages
            **kwargs: Additional parameters
            
        Returns:
            Parsed JSON response or None
        """
        # Add schema instruction to system prompt
        schema_instruction = f"""
You must respond with valid JSON matching this schema:
{json.dumps(response_schema, indent=2)}

Do not include any text outside the JSON. Do not use markdown code blocks.
"""
        enhanced_prompt = system_prompt + "\n\n" + schema_instruction
        
        response = self.chat_with_system(
            system_prompt=enhanced_prompt,
            user_message=user_message,
            conversation_history=conversation_history,
            **kwargs
        )
        
        return self.parse_json_response(response)


# Global LLM service instance
_llm_service: Optional[LLMService] = None


def get_llm_service() -> LLMService:
    """Get or create the global LLM service instance."""
    global _llm_service
    if _llm_service is None:
        _llm_service = LLMService()
    return _llm_service
