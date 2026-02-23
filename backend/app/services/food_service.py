from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from typing import Optional, List, Tuple, Union
from uuid import UUID
from datetime import datetime, timezone
from decimal import Decimal
import uuid as uuid_lib

from ..models.food import FoodItem, FoodOrder, FoodOrderItem, FoodCategory
from ..models.user import User
from ..models.enums import OrderStatus
from ..schemas.food import FoodItemCreate, FoodItemUpdate, FoodOrderCreate, FoodCategoryCreate, FoodCategoryUpdate
from .embedding_service import EmbeddingService
from ..core.redis import cache_manager


class FoodService:
    """
    Food item and order management service.
    
    Caching Strategy:
    - Food categories cached for 10 minutes (rarely changes)
    - Food items list cached for 5 minutes
    - Cache invalidated on create/update/delete
    """
    
    # Cache TTL constants
    CACHE_TTL_CATEGORY = 600  # 10 minutes for categories
    CACHE_TTL_FOOD_ITEM = 300  # 5 minutes for food items
    CACHE_TTL_FOOD_LIST = 300  # 5 minutes for food lists
    
    def __init__(self, db: AsyncSession):
        self.db = db
        self.embedding_service = EmbeddingService()
        self._cache_prefix = "food"
    
    async def _invalidate_category_cache(self):
        """Invalidate category cache."""
        await cache_manager.delete_pattern(f"{self._cache_prefix}:category:*")
        await cache_manager.delete_pattern(f"{self._cache_prefix}:categories:*")
    
    async def _invalidate_food_item_cache(self, item_id: UUID = None):
        """Invalidate food item cache."""
        if item_id:
            await cache_manager.delete(f"{self._cache_prefix}:item:{str(item_id)}")
        await cache_manager.delete_pattern(f"{self._cache_prefix}:items:*")
    
    def _serialize_category(self, category: FoodCategory) -> dict:
        """Serialize category for caching."""
        return {
            "id": str(category.id),
            "name": category.name,
            "description": category.description,
            "display_order": category.display_order,
            "is_active": category.is_active,
        }
    
    def _serialize_food_item(self, item: FoodItem) -> dict:
        """Serialize food item for caching."""
        return {
            "id": str(item.id),
            "name": item.name,
            "description": item.description,
            "category_id": str(item.category_id) if item.category_id else None,
            "category_name": item.category_name,
            "price": str(item.price) if item.price else None,
            "is_available": item.is_available,
            "is_active": item.is_active,
            "calories": item.calories,
            "preparation_time_minutes": item.preparation_time_minutes,
            "image_url": item.image_url,
        }
    
    # ==================== Food Category Management ====================
    
    async def get_category_by_id(self, category_id: UUID) -> Optional[FoodCategory]:
        """Get food category by ID."""
        result = await self.db.execute(
            select(FoodCategory).where(FoodCategory.id == category_id)
        )
        return result.scalar_one_or_none()
    
    async def get_category_by_name(self, name: str) -> Optional[FoodCategory]:
        """Get food category by name."""
        result = await self.db.execute(
            select(FoodCategory).where(FoodCategory.name == name)
        )
        return result.scalar_one_or_none()
    
    async def list_categories(
        self,
        is_active: Optional[bool] = True
    ) -> List[FoodCategory]:
        """List all food categories with caching."""
        # Build cache key
        cache_key = f"{self._cache_prefix}:categories:{is_active}"
        
        # Try cache first
        cached = await cache_manager.get(cache_key)
        if cached:
            # For now, still query DB for ORM objects
            pass
        
        query = select(FoodCategory)
        if is_active is not None:
            query = query.where(FoodCategory.is_active == is_active)
        query = query.order_by(FoodCategory.display_order, FoodCategory.name)
        result = await self.db.execute(query)
        categories = list(result.scalars().all())
        
        # Cache the result
        if categories:
            cached_data = [self._serialize_category(c) for c in categories]
            await cache_manager.set(cache_key, cached_data, self.CACHE_TTL_CATEGORY)
        
        return categories
    
    async def create_category(
        self,
        category_data: FoodCategoryCreate
    ) -> Tuple[Optional[FoodCategory], Optional[str]]:
        """Create a new food category."""
        # Check if category with same name exists
        existing = await self.get_category_by_name(category_data.name)
        if existing:
            return None, f"Food category '{category_data.name}' already exists"
        
        category = FoodCategory(
            name=category_data.name,
            description=category_data.description,
            display_order=category_data.display_order
        )
        
        self.db.add(category)
        await self.db.commit()
        await self.db.refresh(category)
        
        # Invalidate category cache
        await self._invalidate_category_cache()
        
        return category, None
    
    async def update_category(
        self,
        category_id: UUID,
        category_data: FoodCategoryUpdate
    ) -> Tuple[Optional[FoodCategory], Optional[str]]:
        """Update a food category."""
        category = await self.get_category_by_id(category_id)
        if not category:
            return None, "Food category not found"
        
        update_data = category_data.model_dump(exclude_unset=True)
        
        # Check if new name conflicts with existing category
        if 'name' in update_data and update_data['name'] != category.name:
            existing = await self.get_category_by_name(update_data['name'])
            if existing:
                return None, f"Food category '{update_data['name']}' already exists"
        
        for field, value in update_data.items():
            setattr(category, field, value)
        
        await self.db.commit()
        await self.db.refresh(category)
        
        # Invalidate category cache
        await self._invalidate_category_cache()
        
        return category, None
    
    async def delete_category(
        self,
        category_id: UUID
    ) -> Tuple[bool, Optional[str]]:
        """Soft delete a food category by setting is_active to False."""
        category = await self.get_category_by_id(category_id)
        if not category:
            return False, "Food category not found"
        
        category.is_active = False
        await self.db.commit()
        
        # Invalidate category cache
        await self._invalidate_category_cache()
        
        return True, None
    
    # ==================== Food Item Management ====================
    
    async def get_food_item_by_id(
        self,
        item_id: UUID
    ) -> Optional[FoodItem]:
        """Get food item by ID."""
        result = await self.db.execute(
            select(FoodItem).where(
                FoodItem.id == item_id,
                FoodItem.is_active == True
            )
        )
        return result.scalar_one_or_none()
    
    async def create_food_item(
        self,
        item_data: FoodItemCreate,
        created_by: User
    ) -> Tuple[Optional[FoodItem], Optional[str]]:
        """Create a new food item with embedding."""
        # Validate category_id if provided
        category_name = item_data.category_name or "Uncategorized"
        if item_data.category_id:
            category = await self.get_category_by_id(item_data.category_id)
            if not category:
                return None, f"Food category with ID '{item_data.category_id}' not found. Please provide a valid category ID or create the category first."
            # Use the category name from the database
            category_name = category.name
        
        # Generate embedding
        text_for_embedding = self.embedding_service.prepare_food_text(
            name=item_data.name,
            description=item_data.description,
            ingredients=item_data.ingredients,
            tags=item_data.tags,
            category=category_name
        )
        embedding = await self.embedding_service.generate_embedding(text_for_embedding)
        
        food_item = FoodItem(
            name=item_data.name,
            description=item_data.description,
            category_id=item_data.category_id,
            category_name=category_name,
            price=item_data.price,
            ingredients=item_data.ingredients,
            tags=item_data.tags,
            calories=item_data.calories,
            preparation_time_minutes=item_data.preparation_time_minutes,
            image_url=item_data.image_url,
            created_by_code=created_by.user_code,
            embedding=embedding
        )
        
        self.db.add(food_item)
        await self.db.commit()
        await self.db.refresh(food_item)
        
        return food_item, None
    
    async def update_food_item(
        self,
        item_id: UUID,
        item_data: FoodItemUpdate
    ) -> Tuple[Optional[FoodItem], Optional[str]]:
        """Update a food item."""
        food_item = await self.get_food_item_by_id(item_id)
        if not food_item:
            return None, "Food item not found"
        
        update_data = item_data.model_dump(exclude_unset=True)
        
        # Validate category_id if it's being updated
        if 'category_id' in update_data and update_data['category_id'] is not None:
            category = await self.get_category_by_id(update_data['category_id'])
            if not category:
                return None, f"Food category with ID '{update_data['category_id']}' not found. Please provide a valid category ID."
            # Also update the category_name if not explicitly provided
            if 'category_name' not in update_data:
                update_data['category_name'] = category.name
        
        for field, value in update_data.items():
            setattr(food_item, field, value)
        
        # Regenerate embedding if relevant fields changed
        if any(f in update_data for f in ['name', 'description', 'ingredients', 'tags', 'category_name']):
            text_for_embedding = self.embedding_service.prepare_food_text(
                name=food_item.name,
                description=food_item.description,
                ingredients=food_item.ingredients,
                tags=food_item.tags,
                category=food_item.category_name
            )
            food_item.embedding = await self.embedding_service.generate_embedding(text_for_embedding)
        
        await self.db.commit()
        await self.db.refresh(food_item)
        
        # Invalidate food item cache
        await self._invalidate_food_item_cache(item_id)
        
        return food_item, None
    
    async def list_food_items(
        self,
        category: Optional[str] = None,
        is_available: Optional[bool] = None,
        page: int = 1,
        page_size: int = 20
    ) -> Tuple[List[FoodItem], int]:
        """List food items with filtering and caching."""
        # Build cache key
        cache_key = f"{self._cache_prefix}:items:{category}:{is_available}:{page}:{page_size}"
        
        query = select(FoodItem).where(FoodItem.is_active == True)
        count_query = select(func.count(FoodItem.id)).where(FoodItem.is_active == True)
        
        if category:
            query = query.where(FoodItem.category_name == category)
            count_query = count_query.where(FoodItem.category_name == category)
        
        if is_available is not None:
            query = query.where(FoodItem.is_available == is_available)
            count_query = count_query.where(FoodItem.is_available == is_available)
        
        total_result = await self.db.execute(count_query)
        total = total_result.scalar()
        
        query = query.offset((page - 1) * page_size).limit(page_size)
        query = query.order_by(FoodItem.name)
        
        result = await self.db.execute(query)
        items = list(result.scalars().all())
        
        # Cache the result
        if items:
            cached_data = {
                "items": [self._serialize_food_item(i) for i in items],
                "total": total
            }
            await cache_manager.set(cache_key, cached_data, self.CACHE_TTL_FOOD_LIST)
        
        return items, total
    
    async def get_order_by_id(
        self,
        order_id: UUID
    ) -> Optional[FoodOrder]:
        """Get food order by ID with items."""
        result = await self.db.execute(
            select(FoodOrder)
            .where(FoodOrder.id == order_id)
            .options(selectinload(FoodOrder.items))
        )
        return result.scalar_one_or_none()
    
    def generate_order_number(self) -> str:
        """Generate unique order number."""
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        random_part = str(uuid_lib.uuid4())[:6].upper()
        return f"ORD-{timestamp}-{random_part}"
    
    async def create_order(
        self,
        order_data: FoodOrderCreate,
        user: User
    ) -> Tuple[Optional[FoodOrder], Optional[str]]:
        """Create a new food order."""
        # Validate all items exist and are available
        total_amount = Decimal("0.00")
        order_items = []
        
        for item_data in order_data.items:
            food_item = await self.get_food_item_by_id(item_data.food_item_id)
            if not food_item:
                return None, f"Food item {item_data.food_item_id} not found"
            if not food_item.is_available:
                return None, f"Food item {food_item.name} is not available"
            
            item_total = food_item.price * item_data.quantity
            total_amount += item_total
            
            order_items.append({
                "food_item": food_item,
                "quantity": item_data.quantity,
                "unit_price": food_item.price,
                "total_price": item_total,
                "special_instructions": item_data.special_instructions
            })
        
        # Create order
        order = FoodOrder(
            order_number=self.generate_order_number(),
            user_code=user.user_code,
            status=OrderStatus.PENDING,
            subtotal=total_amount,
            tax=Decimal("0.00"),
            total_amount=total_amount,
            is_scheduled=order_data.is_scheduled,
            scheduled_date=order_data.scheduled_date,
            scheduled_time=order_data.scheduled_time,
            notes=order_data.notes
        )
        self.db.add(order)
        await self.db.flush()
        
        # Create order items
        for item in order_items:
            order_item = FoodOrderItem(
                order_id=order.id,
                food_item_id=item["food_item"].id,
                item_name=item["food_item"].name,
                quantity=item["quantity"],
                unit_price=item["unit_price"],
                total_price=item["total_price"],
                special_instructions=item["special_instructions"]
            )
            self.db.add(order_item)
        
        await self.db.commit()
        await self.db.refresh(order)
        
        # Load items
        result = await self.db.execute(
            select(FoodOrder)
            .where(FoodOrder.id == order.id)
            .options(selectinload(FoodOrder.items))
        )
        order = result.scalar_one()
        
        return order, None
    
    async def update_order_status(
        self,
        order_id: UUID,
        status: OrderStatus,
        notes: Optional[str] = None,
        cancellation_reason: Optional[str] = None
    ) -> Tuple[Optional[FoodOrder], Optional[str]]:
        """Update order status."""
        order = await self.get_order_by_id(order_id)
        if not order:
            return None, "Order not found"
        
        # Validate status transition
        valid_transitions = {
            OrderStatus.PENDING: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
            OrderStatus.PREPARING: [OrderStatus.READY, OrderStatus.CANCELLED],
            OrderStatus.READY: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
            OrderStatus.DELIVERED: [],
            OrderStatus.CANCELLED: []
        }
        
        if status not in valid_transitions.get(order.status, []):
            return None, f"Cannot transition from {order.status.value} to {status.value}"
        
        order.status = status
        
        if status == OrderStatus.DELIVERED:
            order.completed_at = datetime.now(timezone.utc)
        elif status == OrderStatus.CANCELLED:
            order.cancelled_at = datetime.now(timezone.utc)
            order.cancellation_reason = cancellation_reason
        
        await self.db.commit()
        await self.db.refresh(order)
        
        return order, None
    
    async def list_orders(
        self,
        user_code: Optional[str] = None,
        status_filter: Optional[Union[OrderStatus, List[OrderStatus], str]] = None,
        page: int = 1,
        page_size: int = 20
    ) -> Tuple[List[FoodOrder], int]:
        """List food orders with filtering."""
        query = select(FoodOrder).options(selectinload(FoodOrder.items))
        count_query = select(func.count(FoodOrder.id))
        
        if user_code:
            query = query.where(FoodOrder.user_code == user_code)
            count_query = count_query.where(FoodOrder.user_code == user_code)
        
        if status_filter:
            if isinstance(status_filter, str) and "," in status_filter:
                # Handle comma-separated string
                statuses = [s.strip() for s in status_filter.split(",")]
                query = query.where(FoodOrder.status.in_(statuses))
                count_query = count_query.where(FoodOrder.status.in_(statuses))
            elif isinstance(status_filter, list):
                # Handle list of statuses
                query = query.where(FoodOrder.status.in_(status_filter))
                count_query = count_query.where(FoodOrder.status.in_(status_filter))
            else:
                # Handle single status
                query = query.where(FoodOrder.status == status_filter)
                count_query = count_query.where(FoodOrder.status == status_filter)
        
        total_result = await self.db.execute(count_query)
        total = total_result.scalar()
        
        query = query.offset((page - 1) * page_size).limit(page_size)
        query = query.order_by(FoodOrder.created_at.desc())
        
        result = await self.db.execute(query)
        orders = result.scalars().unique().all()
        
        return list(orders), total
    
    async def get_dashboard_stats(self) -> dict:
        """Get cafeteria dashboard statistics."""
        # Total orders today
        today = datetime.now(timezone.utc).date()
        today_orders = await self.db.execute(
            select(func.count(FoodOrder.id)).where(
                func.date(FoodOrder.created_at) == today
            )
        )
        
        # Orders by status
        status_counts = {}
        for status in OrderStatus:
            count_result = await self.db.execute(
                select(func.count(FoodOrder.id)).where(
                    FoodOrder.status == status,
                    func.date(FoodOrder.created_at) == today
                )
            )
            status_counts[status.value] = count_result.scalar()
        
        # Total revenue today
        revenue_result = await self.db.execute(
            select(func.sum(FoodOrder.total_amount)).where(
                FoodOrder.status == OrderStatus.DELIVERED,
                func.date(FoodOrder.created_at) == today
            )
        )
        
        return {
            "total_orders_today": today_orders.scalar(),
            "orders_by_status": status_counts,
            "revenue_today": float(revenue_result.scalar() or 0)
        }