"""
Knowledge Base Loader Service.
Loads and provides access to the user_services_kb.json knowledge base.
"""

import json
import logging
from pathlib import Path
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, field
from functools import lru_cache

from config.settings import get_settings

logger = logging.getLogger(__name__)


@dataclass
class APIDefinition:
    """Definition of a single API endpoint."""
    id: str
    name: str
    description: str
    intent_examples: List[str]
    endpoint: str
    method: str
    request_body: Optional[Dict[str, Any]] = None
    query_params: Optional[Dict[str, Any]] = None
    path_params: Optional[List[str]] = None
    dependent_apis: Optional[List[str]] = None  # List of API IDs for quick reference
    dependent_apis_config: Optional[List[Dict[str, Any]]] = None  # Full config with display_format, etc.
    requires_auth: bool = True
    
    @classmethod
    def from_dict(cls, data: dict) -> "APIDefinition":
        """Create APIDefinition from dictionary."""
        # Extract path params from endpoint (e.g., /leaves/{leave_id} -> ["leave_id"])
        endpoint = data.get("endpoint", "")
        path_params = []
        import re
        path_params = re.findall(r'\{(\w+)\}', endpoint)
        
        # Handle dependent_apis - can be list of strings or list of objects
        dependent_apis_raw = data.get("dependent_apis", [])
        dependent_apis = []
        dependent_apis_config = []
        if dependent_apis_raw:
            for dep in dependent_apis_raw:
                if isinstance(dep, str):
                    dependent_apis.append(dep)
                    dependent_apis_config.append({"api_id": dep})
                elif isinstance(dep, dict):
                    # Extract api_id from object like {"api_id": "leave_my_requests", ...}
                    api_id = dep.get("api_id", dep.get("id", ""))
                    if api_id:
                        dependent_apis.append(api_id)
                        dependent_apis_config.append(dep)
        
        return cls(
            id=data["id"],
            name=data["name"],
            description=data.get("description", ""),
            intent_examples=data.get("intent_examples", []),
            endpoint=endpoint,
            method=data.get("method", "GET"),
            request_body=data.get("request_body"),
            query_params=data.get("query_params"),
            path_params=path_params if path_params else None,
            dependent_apis=dependent_apis if dependent_apis else None,
            dependent_apis_config=dependent_apis_config if dependent_apis_config else None,
            requires_auth=data.get("requires_auth", True)
        )
    
    def to_prompt_string(self) -> str:
        """Convert to string for LLM prompts."""
        lines = [
            f"- {self.name} ({self.id})",
            f"  Description: {self.description}",
            f"  Endpoint: {self.method} {self.endpoint}"
        ]
        if self.request_body:
            lines.append(f"  Required fields: {list(self.request_body.keys())}")
        if self.query_params:
            lines.append(f"  Query params: {list(self.query_params.keys())}")
        if self.path_params:
            lines.append(f"  Path params: {self.path_params}")
        return "\n".join(lines)


@dataclass
class DomainKnowledge:
    """Knowledge for a specific domain."""
    domain: str
    description: str
    apis: List[APIDefinition] = field(default_factory=list)
    
    @classmethod
    def from_dict(cls, domain_key: str, data: dict) -> "DomainKnowledge":
        """Create DomainKnowledge from dictionary."""
        return cls(
            domain=domain_key,
            description=data.get("description", data.get("name", "")),
            apis=[APIDefinition.from_dict(api) for api in data.get("apis", [])]
        )
    
    def get_api(self, api_id: str) -> Optional[APIDefinition]:
        """Get API by ID."""
        for api in self.apis:
            if api.id == api_id:
                return api
        return None
    
    def to_prompt_string(self) -> str:
        """Convert to string for LLM prompts."""
        lines = [f"## {self.domain.replace('_', ' ').title()}", f"{self.description}", "", "Available APIs:"]
        for api in self.apis:
            lines.append(api.to_prompt_string())
        return "\n".join(lines)


@dataclass  
class KnowledgeBase:
    """Complete knowledge base."""
    version: str
    base_url: str
    domains: Dict[str, DomainKnowledge] = field(default_factory=dict)
    
    @classmethod
    def from_dict(cls, data: dict) -> "KnowledgeBase":
        """Create KnowledgeBase from dictionary."""
        kb = cls(
            version=data.get("version", "1.0"),
            base_url=data.get("base_url", "")
        )
        # Handle domains as a dictionary with domain names as keys
        domains_data = data.get("domains", {})
        if isinstance(domains_data, dict):
            for domain_key, domain_data in domains_data.items():
                domain = DomainKnowledge.from_dict(domain_key, domain_data)
                kb.domains[domain.domain] = domain
        elif isinstance(domains_data, list):
            # Fallback for list format
            for domain_data in domains_data:
                domain_key = domain_data.get("domain", domain_data.get("name", "unknown"))
                domain = DomainKnowledge.from_dict(domain_key, domain_data)
                kb.domains[domain.domain] = domain
        return kb
    
    def get_domain(self, domain_name: str) -> Optional[DomainKnowledge]:
        """Get domain by name."""
        return self.domains.get(domain_name)
    
    def get_api(self, api_id: str) -> Optional[APIDefinition]:
        """Get API by ID from any domain."""
        for domain in self.domains.values():
            api = domain.get_api(api_id)
            if api:
                return api
        return None
    
    def get_all_apis(self) -> List[APIDefinition]:
        """Get all APIs from all domains."""
        apis = []
        for domain in self.domains.values():
            apis.extend(domain.apis)
        return apis
    
    def get_domain_for_api(self, api_id: str) -> Optional[str]:
        """Get domain name for an API."""
        for domain_name, domain in self.domains.items():
            if domain.get_api(api_id):
                return domain_name
        return None


class KBLoader:
    """
    Knowledge Base Loader.
    Loads and provides access to the knowledge base.
    """
    
    _instance: Optional["KBLoader"] = None
    _kb: Optional[KnowledgeBase] = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def __init__(self):
        if self._kb is None:
            self._load_kb()
    
    def _load_kb(self):
        """Load knowledge base from file."""
        settings = get_settings()
        kb_path = Path(settings.knowledge_base_path)
        
        if not kb_path.exists():
            logger.error(f"Knowledge base file not found: {kb_path}")
            raise FileNotFoundError(f"Knowledge base not found: {kb_path}")
        
        try:
            with open(kb_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            
            self._kb = KnowledgeBase.from_dict(data)
            logger.info(f"Loaded knowledge base v{self._kb.version} with {len(self._kb.domains)} domains")
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse knowledge base JSON: {e}")
            raise
        except Exception as e:
            logger.error(f"Failed to load knowledge base: {e}")
            raise
    
    @property
    def kb(self) -> KnowledgeBase:
        """Get the knowledge base."""
        if self._kb is None:
            self._load_kb()
        return self._kb
    
    def reload(self):
        """Reload the knowledge base from file."""
        self._kb = None
        self._load_kb()
    
    # Domain-based access methods
    def get_domain(self, domain_name: str) -> Optional[DomainKnowledge]:
        """Get knowledge for a specific domain."""
        return self.kb.get_domain(domain_name)
    
    def get_domain_names(self) -> List[str]:
        """Get list of all domain names."""
        return list(self.kb.domains.keys())
    
    # API-based access methods
    def get_api(self, api_id: str) -> Optional[APIDefinition]:
        """Get API definition by ID."""
        return self.kb.get_api(api_id)
    
    def get_all_apis(self) -> List[APIDefinition]:
        """Get all API definitions."""
        return self.kb.get_all_apis()
    
    def search_apis_by_intent(self, query: str) -> List[tuple[APIDefinition, float]]:
        """
        Search APIs by matching against intent examples.
        Returns list of (api, score) tuples sorted by relevance.
        
        This is a simple keyword matching - for better results,
        use the LLM to determine intent.
        """
        query_lower = query.lower()
        query_words = set(query_lower.split())
        
        results = []
        for api in self.get_all_apis():
            max_score = 0
            
            # Check intent examples
            for example in api.intent_examples:
                example_lower = example.lower()
                example_words = set(example_lower.split())
                
                # Word overlap score
                overlap = len(query_words & example_words)
                score = overlap / max(len(query_words), len(example_words)) if query_words else 0
                
                # Boost for substring match
                if query_lower in example_lower or example_lower in query_lower:
                    score += 0.3
                
                max_score = max(max_score, score)
            
            # Also check description
            if any(word in api.description.lower() for word in query_words):
                max_score = max(max_score, 0.2)
            
            if max_score > 0:
                results.append((api, max_score))
        
        # Sort by score descending
        results.sort(key=lambda x: x[1], reverse=True)
        return results
    
    def get_routing_prompt(self) -> str:
        """
        Generate a prompt section describing all domains for routing.
        Used by the routing agent to determine which domain agent to call.
        """
        lines = ["Available domains and their capabilities:", ""]
        
        agent_domains = {
            "ATTENDANCE": ["attendance", "holidays"],
            "LEAVE": ["leave"],
            "DESK_CONFERENCE": ["desk_booking", "conference_room"],
            "CAFETERIA": ["food_orders", "cafeteria_tables"],
            "IT_MANAGEMENT": ["it_requests"],
        }
        
        for agent_name, domain_names in agent_domains.items():
            lines.append(f"### {agent_name} Agent")
            for domain_name in domain_names:
                domain = self.get_domain(domain_name)
                if domain:
                    lines.append(f"  {domain.description}")
                    # List a few intent examples
                    for api in domain.apis[:3]:
                        if api.intent_examples:
                            lines.append(f"    - Example: \"{api.intent_examples[0]}\"")
            lines.append("")
        
        return "\n".join(lines)


# Global KB loader instance
_kb_loader: Optional[KBLoader] = None


@lru_cache(maxsize=1)
def get_kb_loader() -> KBLoader:
    """Get or create the global KB loader instance."""
    return KBLoader()
