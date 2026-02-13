#!/usr/bin/env python3
"""
Script to regenerate embeddings for existing food items and IT assets.

Run this script after seeding data or if semantic search returns 0 results.

Usage:
    cd backend
    python scripts/regenerate_embeddings.py
"""

import asyncio
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.models.food import FoodItem
from app.models.it_asset import ITAsset
from app.services.embedding_service import EmbeddingService


async def regenerate_food_embeddings(db: AsyncSession, embedding_service: EmbeddingService):
    """Regenerate embeddings for all food items."""
    print("\n📦 Regenerating embeddings for Food Items...")
    
    # Get all active food items
    result = await db.execute(
        select(FoodItem).where(FoodItem.is_active == True)
    )
    food_items = result.scalars().all()
    
    if not food_items:
        print("  ⚠️  No food items found in database")
        return 0
    
    count = 0
    for item in food_items:
        text_for_embedding = embedding_service.prepare_food_text(
            name=item.name,
            description=item.description,
            ingredients=item.ingredients,
            tags=item.tags,
            category=item.category_name
        )
        embedding = await embedding_service.generate_embedding(text_for_embedding)
        
        if embedding:
            item.embedding = embedding
            count += 1
            print(f"  ✅ Generated embedding for: {item.name}")
        else:
            print(f"  ❌ Failed to generate embedding for: {item.name}")
    
    await db.commit()
    print(f"\n  📊 Updated {count}/{len(food_items)} food items")
    return count


async def regenerate_asset_embeddings(db: AsyncSession, embedding_service: EmbeddingService):
    """Regenerate embeddings for all IT assets."""
    print("\n💻 Regenerating embeddings for IT Assets...")
    
    # Get all active IT assets
    result = await db.execute(
        select(ITAsset).where(ITAsset.is_active == True)
    )
    assets = result.scalars().all()
    
    if not assets:
        print("  ⚠️  No IT assets found in database")
        return 0
    
    count = 0
    for asset in assets:
        text_for_embedding = embedding_service.prepare_asset_text(
            name=asset.name,
            description=asset.description,
            specifications=asset.specifications,
            vendor=asset.vendor,
            tags=asset.tags
        )
        embedding = await embedding_service.generate_embedding(text_for_embedding)
        
        if embedding:
            asset.embedding = embedding
            count += 1
            print(f"  ✅ Generated embedding for: {asset.name}")
        else:
            print(f"  ❌ Failed to generate embedding for: {asset.name}")
    
    await db.commit()
    print(f"\n  📊 Updated {count}/{len(assets)} IT assets")
    return count


async def main():
    print("=" * 60)
    print("🔄 Embedding Regeneration Script")
    print("=" * 60)
    
    # Check if embedding model is available
    embedding_service = EmbeddingService()
    model = embedding_service.get_model()
    
    if model is None:
        print("\n❌ ERROR: Embedding model not available!")
        print("   Please install sentence-transformers:")
        print("   pip install sentence-transformers")
        print("\n   Or check if the model can be downloaded:")
        print(f"   Model: {settings.EMBEDDING_MODEL}")
        return
    
    print(f"\n✅ Embedding model loaded: {settings.EMBEDDING_MODEL}")
    
    # Create async engine and session
    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as db:
        food_count = await regenerate_food_embeddings(db, embedding_service)
        asset_count = await regenerate_asset_embeddings(db, embedding_service)
        
        print("\n" + "=" * 60)
        print("✅ Embedding regeneration complete!")
        print(f"   Food items updated: {food_count}")
        print(f"   IT assets updated: {asset_count}")
        print("=" * 60)
    
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
