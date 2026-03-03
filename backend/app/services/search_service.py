from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, text, or_, and_, String
from typing import List, Optional, Dict, Any
from uuid import UUID

from ..models.food import FoodItem
from ..models.it_asset import ITAsset
from ..schemas.search import SearchDomain, SearchResultItem, SemanticSearchResponse
from .embedding_service import EmbeddingService
from ..core.config import settings


class SearchService:
    """Semantic and hybrid search service."""
    
    def __init__(self, db: AsyncSession):
        self.db = db
        self.embedding_service = EmbeddingService()
    
    async def search(
        self,
        query: str,
        domain: SearchDomain,
        limit: int = 10,
        filters: Optional[Dict[str, Any]] = None
    ) -> SemanticSearchResponse:
        """Perform hybrid search (semantic + keyword)."""
        # Generate query embedding as list for search
        query_embedding = await self.embedding_service.generate_embedding_list(query)
        
        if domain == SearchDomain.FOOD:
            results = await self._search_food(query, query_embedding, limit, filters)
        elif domain == SearchDomain.IT_ASSETS:
            results = await self._search_assets(query, query_embedding, limit, filters)
        else:
            results = []
        
        # Determine search type
        search_type = "hybrid" if query_embedding else "keyword"
        
        return SemanticSearchResponse(
            query=query,
            domain=domain,
            results=results,
            total=len(results),
            search_type=search_type
        )
    
    async def _search_food(
        self,
        query: str,
        query_embedding: Optional[List[float]],
        limit: int,
        filters: Optional[Dict[str, Any]] = None
    ) -> List[SearchResultItem]:
        """Search food items."""
        results = []
        used_semantic = False
        
        if query_embedding:
            # Try semantic search using pgvector
            try:
                embedding_str = f"[{','.join(map(str, query_embedding))}]"
                
                sql = text("""
                    SELECT 
                        id, name, description, category_name as category, 
                        1 - (embedding <=> :embedding::vector) as similarity
                    FROM food_items
                    WHERE is_active = true 
                    AND is_available = true
                    AND embedding IS NOT NULL
                    ORDER BY embedding <=> :embedding::vector
                    LIMIT :limit
                """)
                
                result = await self.db.execute(
                    sql,
                    {"embedding": embedding_str, "limit": limit}
                )
                rows = result.fetchall()
                
                for row in rows:
                    results.append(SearchResultItem(
                        id=str(row.id),
                        name=row.name,
                        description=row.description or "",
                        score=float(row.similarity),
                        metadata={
                            "category": row.category,
                            "type": "food"
                        }
                    ))
                used_semantic = len(results) > 0
            except Exception as e:
                print(f"Semantic search failed, falling back to keyword: {e}")
                used_semantic = False
        
        # Fallback to keyword search if semantic didn't work or no embedding
        if not used_semantic:
            search_pattern = f"%{query}%"
            stmt = select(FoodItem).where(
                and_(
                    FoodItem.is_active == True,
                    FoodItem.is_available == True,
                    or_(
                        FoodItem.name.ilike(search_pattern),
                        FoodItem.description.ilike(search_pattern),
                        FoodItem.category_name.ilike(search_pattern)
                    )
                )
            ).limit(limit)
            
            result = await self.db.execute(stmt)
            items = result.scalars().all()
            
            for item in items:
                results.append(SearchResultItem(
                    id=str(item.id),
                    name=item.name,
                    description=item.description or "",
                    score=1.0,
                    metadata={
                        "category": item.category_name,
                        "type": "food"
                    }
                ))
        
        # Apply additional filters
        if filters:
            if "category" in filters:
                results = [r for r in results if r.metadata.get("category") == filters["category"]]
            if "min_score" in filters:
                results = [r for r in results if r.score >= filters["min_score"]]
        
        return results
    
    async def _search_assets(
        self,
        query: str,
        query_embedding: Optional[List[float]],
        limit: int,
        filters: Optional[Dict[str, Any]] = None
    ) -> List[SearchResultItem]:
        """Search IT assets."""
        results = []
        used_semantic = False
        
        if query_embedding:
            # Try semantic search using pgvector
            try:
                embedding_str = f"[{','.join(map(str, query_embedding))}]"
                
                sql = text("""
                    SELECT 
                        id, name, description, asset_type, vendor, status,
                        1 - (embedding <=> :embedding::vector) as similarity
                    FROM it_assets
                    WHERE is_active = true 
                    AND embedding IS NOT NULL
                    ORDER BY embedding <=> :embedding::vector
                    LIMIT :limit
                """)
                
                result = await self.db.execute(
                    sql,
                    {"embedding": embedding_str, "limit": limit}
                )
                rows = result.fetchall()
                
                for row in rows:
                    results.append(SearchResultItem(
                        id=str(row.id),
                        name=row.name,
                        description=row.description or "",
                        score=float(row.similarity),
                        metadata={
                            "asset_type": row.asset_type,
                            "vendor": row.vendor,
                            "status": row.status,
                            "type": "it_asset"
                        }
                    ))
                used_semantic = len(results) > 0
            except Exception as e:
                print(f"Semantic search failed for IT assets, falling back to keyword: {e}")
                used_semantic = False
        
        # Fallback to keyword search if semantic didn't work or no embedding
        if not used_semantic:
            search_pattern = f"%{query}%"
            stmt = select(ITAsset).where(
                and_(
                    ITAsset.is_active == True,
                    or_(
                        ITAsset.name.ilike(search_pattern),
                        ITAsset.description.ilike(search_pattern),
                        ITAsset.vendor.ilike(search_pattern),
                        ITAsset.asset_code.ilike(search_pattern)
                    )
                )
            ).limit(limit)
            
            result = await self.db.execute(stmt)
            items = result.scalars().all()
            
            for item in items:
                results.append(SearchResultItem(
                    id=str(item.id),
                    name=item.name,
                    description=item.description or "",
                    score=1.0,
                    metadata={
                        "asset_type": item.asset_type.value if item.asset_type else None,
                        "vendor": item.vendor,
                        "status": item.status.value if item.status else None,
                        "type": "it_asset"
                    }
                ))
        
        # Apply additional filters
        if filters:
            if "asset_type" in filters:
                results = [r for r in results if r.metadata.get("asset_type") == filters["asset_type"]]
            if "status" in filters:
                results = [r for r in results if r.metadata.get("status") == filters["status"]]
            if "min_score" in filters:
                results = [r for r in results if r.score >= filters["min_score"]]
        
        return results