from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_
from sqlalchemy.orm import selectinload
from typing import Optional, List, Tuple
from uuid import UUID
from datetime import date, time, datetime, timezone, timedelta

from ..models.desk import Desk, DeskBooking, ConferenceRoom, ConferenceRoomBooking
from ..models.user import User
from ..models.enums import BookingStatus, DeskStatus, UserRole, ManagerType
from ..schemas.desk import (
    DeskCreate, DeskUpdate, DeskBookingCreate, DeskBookingUpdate,
    ConferenceRoomCreate, ConferenceRoomUpdate, ConferenceRoomBookingCreate, ConferenceRoomBookingUpdate
)


class DeskService:
    """
    Desk and Conference Room management service.
    Managed by DESK_CONFERENCE Manager.
    Simplified without location fields.
    """
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    def can_manage_desks(self, user: User) -> bool:
        """Check if user can manage desks and conference rooms."""
        if user.role == UserRole.SUPER_ADMIN:
            return True
        if user.role == UserRole.ADMIN:
            return True
        if user.role == UserRole.MANAGER and user.manager_type == ManagerType.DESK_CONFERENCE:
            return True
        return False
    
    # ==================== Desk Management ====================
    
    async def get_desk_by_id(self, desk_id: UUID) -> Optional[Desk]:
        """Get desk by ID."""
        result = await self.db.execute(
            select(Desk).where(Desk.id == desk_id)
        )
        return result.scalar_one_or_none()
    
    async def get_desk_by_code(self, desk_code: str) -> Optional[Desk]:
        """Get desk by code."""
        result = await self.db.execute(
            select(Desk).where(Desk.desk_code == desk_code)
        )
        return result.scalar_one_or_none()
    
    async def list_desks(
        self,
        status: Optional[DeskStatus] = None,
        is_active: Optional[bool] = True,
        booking_date: Optional[date] = None,
        start_time: Optional[time] = None,
        end_time: Optional[time] = None,
        page: int = 1,
        page_size: int = 20
    ) -> Tuple[List[Desk], int]:
        """List desks with filtering and dynamic status update based on booking time."""
        query = select(Desk)
        count_query = select(func.count(Desk.id))
        
        conditions = []
        if status:
            conditions.append(Desk.status == status)
        if is_active is not None:
            conditions.append(Desk.is_active == is_active)
        
        if conditions:
            query = query.where(and_(*conditions))
            count_query = count_query.where(and_(*conditions))
        
        # Get total count
        total_result = await self.db.execute(count_query)
        total = total_result.scalar()
        
        # Get paginated results
        query = query.offset((page - 1) * page_size).limit(page_size)
        query = query.execution_options(populate_existing=True)  # Refresh from DB to avoid stale in-memory edits
        result = await self.db.execute(query)
        desks = list(result.scalars().all())
        
        # Check for active bookings if date/time provided
        if booking_date:
            # Check which desks are booked during this time
            booking_query = select(DeskBooking).where(
                and_(
                    DeskBooking.desk_id.in_([d.id for d in desks]),
                    DeskBooking.status == BookingStatus.CONFIRMED,
                    DeskBooking.start_date <= booking_date,
                    DeskBooking.end_date >= booking_date
                )
            )
            
            booking_result = await self.db.execute(booking_query)
            active_bookings = booking_result.scalars().all()
            
            # Prepare request intervals
            # list_desks filters by a single date usually, but we treat it as a Start/End booking request of 1 day.
            req_intervals = self._get_booking_intervals(
                booking_date, 
                booking_date, 
                start_time, 
                end_time
            )

            booked_desk_ids = set()
            for booking in active_bookings:
                # Get intervals for this booking
                booking_intervals = self._get_booking_intervals(
                    booking.start_date,
                    booking.end_date,
                    booking.start_time,
                    booking.end_time
                )
                
                # Check Overlap
                is_overlap = False
                for r_start, r_end in req_intervals:
                    for b_start, b_end in booking_intervals:
                        if r_start < b_end and b_start < r_end:
                            is_overlap = True
                            break
                    if is_overlap:
                        break
                
                if is_overlap:
                    booked_desk_ids.add(booking.desk_id)
            
            # Update status for booked desks (InMemory only, not persisted)
            for desk in desks:
                if desk.id in booked_desk_ids:
                    # Expunge from session to prevent persistence of the manual status change
                    self.db.expunge(desk)
                    desk.status = DeskStatus.BOOKED
        
        return desks, total
    
    async def create_desk(
        self,
        desk_data: DeskCreate,
        created_by: User
    ) -> Tuple[Optional[Desk], Optional[str]]:
        """Create a new desk - Manager only."""
        if not self.can_manage_desks(created_by):
            return None, "Only DESK_CONFERENCE Manager can create desks"
        
        desk = Desk(
            desk_label=desk_data.desk_label,
            has_monitor=desk_data.has_monitor,
            has_docking_station=desk_data.has_docking_station,
            notes=desk_data.notes,
            created_by_code=created_by.user_code
        )
        
        self.db.add(desk)
        await self.db.commit()
        await self.db.refresh(desk)
        
        return desk, None
    
    async def update_desk(
        self,
        desk_id: UUID,
        desk_data: DeskUpdate,
        user: User
    ) -> Tuple[Optional[Desk], Optional[str]]:
        """Update a desk - Manager only."""
        if not self.can_manage_desks(user):
            return None, "Only DESK_CONFERENCE Manager can update desks"
        
        desk = await self.get_desk_by_id(desk_id)
        if not desk:
            return None, "Desk not found"
        
        update_data = desk_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(desk, field, value)
        
        await self.db.commit()
        await self.db.refresh(desk)
        
        return desk, None
    
    async def delete_desk(
        self,
        desk_id: UUID,
        user: User
    ) -> Tuple[bool, Optional[str]]:
        """Soft delete a desk - Manager only."""
        if not self.can_manage_desks(user):
            return False, "Only DESK_CONFERENCE Manager can delete desks"
        
        desk = await self.get_desk_by_id(desk_id)
        if not desk:
            return False, "Desk not found"
        
        # Check for active bookings
        active_bookings = await self.db.execute(
            select(DeskBooking).where(
                and_(
                    DeskBooking.desk_id == desk_id,
                    DeskBooking.status.in_([BookingStatus.PENDING, BookingStatus.CONFIRMED]),
                    DeskBooking.end_date >= date.today()
                )
            )
        )
        if active_bookings.scalar_one_or_none():
            return False, "Cannot delete desk with active bookings"
        
        desk.is_active = False
        await self.db.commit()
        
        return True, None
    
    # ==================== Desk Booking ====================
    
    async def get_booking_by_id(self, booking_id: UUID) -> Optional[DeskBooking]:
        """Get desk booking by ID."""
        result = await self.db.execute(
            select(DeskBooking)
            .options(selectinload(DeskBooking.desk))
            .where(DeskBooking.id == booking_id)
        )
        return result.scalar_one_or_none()
    
    def _get_booking_intervals(
        self,
        start_date: date,
        end_date: date,
        start_time: Optional[time] = None,
        end_time: Optional[time] = None
    ) -> List[Tuple[datetime, datetime]]:
        """
        Convert a booking request into a list of specific datetime intervals.
        Handles:
        1. Full day bookings (no time specified) -> One continuous interval per day (or huge block).
        2. Single day time-bound -> One interval.
        3. Multi-day time-bound (Recurring) -> Multiple intervals (e.g. 9am-5pm each day).
        4. Multi-day Overnight (e.g. 9pm-10am) -> Multiple intervals spanning days.
        """
        intervals = []
        
        # Case 1: Full Day (No time specified)
        # Treat as continuous block from start_date 00:00 to end_date 23:59:59
        if not start_time or not end_time:
            start_dt = datetime.combine(start_date, time(0, 0, 0))
            end_dt = datetime.combine(end_date, time(23, 59, 59))
            intervals.append((start_dt, end_dt))
            return intervals

        # Case 2: Time Specified
        # We iterate through the days.
        from datetime import timedelta
        
        current_date = start_date
        
        # Check standard vs overnight
        if start_time < end_time:
            # Daily slot (e.g. 09:00 to 17:00)
            # Occurs on EVERY day from start_date to end_date (Inclusive)
            while current_date <= end_date:
                s_dt = datetime.combine(current_date, start_time)
                e_dt = datetime.combine(current_date, end_time)
                intervals.append((s_dt, e_dt))
                current_date += timedelta(days=1)
                
        else:
            # Overnight slot (e.g. 21:00 to 09:00)
            # Starts on Day N, Ends on Day N+1
            # Occurs from start_date until... end_date.
            # If user says 18/2 to 20/2, 21:00-09:00.
            # Implicitly means:
            # 18/2 21:00 -> 19/2 09:00
            # 19/2 21:00 -> 20/2 09:00
            # So we iterate start dates from start_date to (end_date - 1 day)
            
            # Special Handling: If start_date == end_date and start_time > end_time.
            # This implies a single overnight slot: Start Day N, End Day N+1.
            # But the "end_date" field in DB usually encompasses the full range.
            # If user selects single day 18/2 in UI, but times 21:00-09:00, 
            # they likely expect it to end on 19/2. The UI might send end_date=18/2 or 19/2.
            # Assuming strictly: Loop until start_date_of_interval < end_date.
            
            while current_date < end_date:
                s_dt = datetime.combine(current_date, start_time)
                e_dt = datetime.combine(current_date + timedelta(days=1), end_time)
                intervals.append((s_dt, e_dt))
                current_date += timedelta(days=1)
                
            # Edge case: If start_date == end_date, the loop above doesn't run.
            # But specific overnight on single date (start PM, end AM next day) 
            # might come in as start=18/2, end=19/2.
            # If it comes as start=18/2, end=18/2, we should probably allow one slot if that's what UI sends.
            if start_date == end_date:
                 s_dt = datetime.combine(start_date, start_time)
                 e_dt = datetime.combine(start_date + timedelta(days=1), end_time)
                 intervals.append((s_dt, e_dt))

        return intervals

    async def check_booking_overlap(
        self,
        desk_id: UUID,
        start_date: date,
        end_date: date,
        start_time: Optional[time] = None,
        end_time: Optional[time] = None,
        exclude_booking_id: Optional[UUID] = None
    ) -> bool:
        """Check if there's an overlapping booking using interval intersection."""
        
        # 1. Base query: Get ALL bookings that overlap the broad DATE range.
        # We cast a wide net here.
        base_conditions = [
            DeskBooking.desk_id == desk_id,
            DeskBooking.status.in_([BookingStatus.PENDING, BookingStatus.CONFIRMED]),
            # Standard Date Overlap: Start1 <= End2 AND End1 >= Start2
            DeskBooking.start_date <= end_date,
            DeskBooking.end_date >= start_date
        ]
        
        if exclude_booking_id:
            base_conditions.append(DeskBooking.id != exclude_booking_id)
            
        query = select(DeskBooking).where(and_(*base_conditions))
        result = await self.db.execute(query)
        potential_conflicts = result.scalars().all()
        
        if not potential_conflicts:
            return False
            
        # 2. Refine with specific Interval Intersection
        req_intervals = self._get_booking_intervals(start_date, end_date, start_time, end_time)
        
        for booking in potential_conflicts:
            existing_intervals = self._get_booking_intervals(
                booking.start_date, 
                booking.end_date, 
                booking.start_time, 
                booking.end_time
            )
            
            # Check if ANY interval in request overlaps ANY interval in existing
            for r_start, r_end in req_intervals:
                for e_start, e_end in existing_intervals:
                    # Interval Overlap: Start1 < End2 AND Start2 < End1
                    if r_start < e_end and e_start < r_end:
                        return True
                        
        return False

    async def create_booking(
        self,
        booking_data: DeskBookingCreate,
        user: User
    ) -> Tuple[Optional[DeskBooking], Optional[str]]:
        """Create a new desk booking."""
        # Validate desk exists and is active
        desk = await self.get_desk_by_id(booking_data.desk_id)
        if not desk:
            return None, "Desk not found"
        if not desk.is_active:
            return None, "Desk is not active"
        if desk.status == DeskStatus.MAINTENANCE:
            return None, "Desk is under maintenance"

        # 1. Past Time Validation
        now = datetime.now()
        today = now.date()
        current_time = now.time()
        
        if booking_data.start_date < today:
             return None, "Cannot book for past dates"
        
        if booking_data.start_date == today:
             # If booking starts today, check start_time
             # If start_time is None (full day), we assume 00:00? Or start of day. 
             # If full day booking attempted NOW (e.g. 2pm), should we allow it?
             # "time of system is 10:17pm then he/she cannot select time past then"
             # Implicitly applies to specific time slots.
             if booking_data.start_time and booking_data.start_time < current_time:
                 return None, "Cannot book for past time"

        # 2. Max 2 Desks Per Day Validation
        # Get all active bookings for this user that overlap with the requested DATE range
        user_bookings_result = await self.db.execute(
            select(DeskBooking).where(
                and_(
                    DeskBooking.user_code == user.user_code,
                    DeskBooking.status.in_([BookingStatus.PENDING, BookingStatus.CONFIRMED]),
                    DeskBooking.start_date <= booking_data.end_date,
                    DeskBooking.end_date >= booking_data.start_date
                )
            )
        )
        existing_bookings = user_bookings_result.scalars().all()
        
        # Check daily limits
        # We iterate through every day of the requested booking
        # and checking if adding it would exceed 2 bookings for that day.
        
        # Helper to span dates
        def date_range(start, end):
            curr = start
            while curr <= end:
                yield curr
                curr += timedelta(days=1)
        
        # Build frequency map of existing bookings per day
        # Map: date -> count
        usage_map = {}
        for b in existing_bookings:
            for d in date_range(b.start_date, b.end_date):
                usage_map[d] = usage_map.get(d, 0) + 1
                
        # Check against requested dates
        for req_d in date_range(booking_data.start_date, booking_data.end_date):
            current_count = usage_map.get(req_d, 0)
            if current_count >= 2:
                return None, f"Booking limit reached (Max 2 desks) for date {req_d}"

        # Check for overlapping bookings
        has_overlap = await self.check_booking_overlap(
            booking_data.desk_id,
            booking_data.start_date,
            booking_data.end_date,
            booking_data.start_time,
            booking_data.end_time
        )
        if has_overlap:
            return None, "Date/Time range overlaps with existing booking"
        
        # 3. User Concurrent Booking Validation
        # Check if this user already has ANOTHER booking at the same time
        if booking_data.start_time and booking_data.end_time:
            req_intervals = self._get_booking_intervals(
                booking_data.start_date,
                booking_data.end_date,
                booking_data.start_time,
                booking_data.end_time
            )
            
            for b in existing_bookings:
                # Check if the user is busy on ANY desk.
                b_intervals = self._get_booking_intervals(
                    b.start_date, b.end_date, b.start_time, b.end_time
                )
                
                is_overlap = False
                for r_start, r_end in req_intervals:
                    for b_start, b_end in b_intervals:
                        if r_start < b_end and b_start < r_end:
                            is_overlap = True
                            break
                    if is_overlap:
                        break
                
                if is_overlap:
                    return None, f"You already have a desk booking at this time ({b.start_time} - {b.end_time})"
        
        booking = DeskBooking(
            desk_id=booking_data.desk_id,
            user_code=user.user_code,
            start_date=booking_data.start_date,
            end_date=booking_data.end_date,
            start_time=booking_data.start_time,
            end_time=booking_data.end_time,
            status=BookingStatus.CONFIRMED,
            notes=booking_data.notes
        )
        
        self.db.add(booking)
        await self.db.commit()
        await self.db.refresh(booking)
        
        # Re-query with eager-loaded desk relationship to avoid lazy loading in async context
        result = await self.db.execute(
            select(DeskBooking)
            .options(selectinload(DeskBooking.desk))
            .where(DeskBooking.id == booking.id)
        )
        booking = result.scalar_one()
        
        return booking, None
    
    async def update_booking(
        self,
        booking_id: UUID,
        booking_data: DeskBookingUpdate,
        user: User
    ) -> Tuple[Optional[DeskBooking], Optional[str]]:
        """Update a desk booking."""
        booking = await self.get_booking_by_id(booking_id)
        if not booking:
            return None, "Booking not found"
        
        # Check ownership or admin access
        if booking.user_code != user.user_code:
            if not self.can_manage_desks(user):
                return None, "Cannot modify another user's booking"
        
        # If updating dates, check for overlaps
        if booking_data.start_date or booking_data.end_date:
            start = booking_data.start_date or booking.start_date
            end = booking_data.end_date or booking.end_date
            
            has_overlap = await self.check_booking_overlap(
                booking.desk_id,
                start,
                end,
                exclude_booking_id=booking_id
            )
            if has_overlap:
                return None, "Date range overlaps with existing booking"
        
        update_data = booking_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(booking, field, value)
        
        await self.db.commit()
        await self.db.refresh(booking)
        
        return booking, None
    
    async def cancel_booking(
        self,
        booking_id: UUID,
        user: User,
        reason: Optional[str] = None
    ) -> Tuple[bool, Optional[str]]:
        """Cancel a desk booking."""
        booking = await self.get_booking_by_id(booking_id)
        if not booking:
            return False, "Booking not found"
        
        if booking.user_code != user.user_code:
            if not self.can_manage_desks(user):
                return False, "Cannot cancel another user's booking"
        
        if booking.status == BookingStatus.CANCELLED:
            return False, "Booking is already cancelled"
        
        booking.status = BookingStatus.CANCELLED
        booking.cancellation_reason = reason
        booking.cancelled_at = datetime.now(timezone.utc)
        
        await self.db.commit()
        
        return True, None
    
    async def list_bookings(
        self,
        desk_id: Optional[UUID] = None,
        user_code: Optional[str] = None,
        booking_date: Optional[date] = None,
        status: Optional[BookingStatus] = None,
        page: int = 1,
        page_size: int = 20
    ) -> Tuple[List[DeskBooking], int]:
        """List desk bookings with filtering."""
        query = select(DeskBooking).options(selectinload(DeskBooking.desk))
        count_query = select(func.count(DeskBooking.id))
        
        conditions = []
        if desk_id:
            conditions.append(DeskBooking.desk_id == desk_id)
        if user_code:
            conditions.append(DeskBooking.user_code == user_code)
        if booking_date:
            # Filter bookings that include this date
            conditions.append(DeskBooking.start_date <= booking_date)
            conditions.append(DeskBooking.end_date >= booking_date)
        if status:
            conditions.append(DeskBooking.status == status)
        
        if conditions:
            query = query.where(and_(*conditions))
            count_query = count_query.where(and_(*conditions))
        
        # Get total count
        total_result = await self.db.execute(count_query)
        total = total_result.scalar()
        
        # Get paginated results
        query = query.order_by(DeskBooking.start_date.desc())
        query = query.offset((page - 1) * page_size).limit(page_size)
        result = await self.db.execute(query)
        bookings = list(result.scalars().all())
        
        return bookings, total
    
    async def get_available_desks(
        self,
        start_date: date,
        end_date: date
    ) -> List[Desk]:
        """Get all available desks for a date range."""
        # Get all active desks
        query = select(Desk).where(
            and_(
                Desk.is_active == True,
                Desk.status != DeskStatus.MAINTENANCE
            )
        )
        
        result = await self.db.execute(query)
        all_desks = list(result.scalars().all())
        
        # Get booked desks for the date range
        booked_result = await self.db.execute(
            select(DeskBooking.desk_id).where(
                and_(
                    DeskBooking.status.in_([BookingStatus.PENDING, BookingStatus.CONFIRMED]),
                    DeskBooking.start_date <= end_date,
                    DeskBooking.end_date >= start_date
                )
            )
        )
        booked_desk_ids = set(row[0] for row in booked_result.fetchall())
        
        # Filter out booked desks
        available_desks = [d for d in all_desks if d.id not in booked_desk_ids]
        
        return available_desks
    
    # ==================== Conference Room Management ====================
    
    async def get_room_by_id(self, room_id: UUID) -> Optional[ConferenceRoom]:
        """Get conference room by ID."""
        result = await self.db.execute(
            select(ConferenceRoom).where(ConferenceRoom.id == room_id)
        )
        return result.scalar_one_or_none()
    
    async def get_room_by_code(self, room_code: str) -> Optional[ConferenceRoom]:
        """Get conference room by code."""
        result = await self.db.execute(
            select(ConferenceRoom).where(ConferenceRoom.room_code == room_code)
        )
        return result.scalar_one_or_none()
    
    async def list_rooms(
        self,
        min_capacity: Optional[int] = None,
        is_active: Optional[bool] = True,
        page: int = 1,
        page_size: int = 20
    ) -> Tuple[List[ConferenceRoom], int]:
        """List conference rooms with filtering."""
        query = select(ConferenceRoom)
        count_query = select(func.count(ConferenceRoom.id))
        
        conditions = []
        if min_capacity:
            conditions.append(ConferenceRoom.capacity >= min_capacity)
        if is_active is not None:
            conditions.append(ConferenceRoom.is_active == is_active)
        
        if conditions:
            query = query.where(and_(*conditions))
            count_query = count_query.where(and_(*conditions))
        
        # Get total count
        total_result = await self.db.execute(count_query)
        total = total_result.scalar()
        
        # Get paginated results
        query = query.offset((page - 1) * page_size).limit(page_size)
        result = await self.db.execute(query)
        rooms = list(result.scalars().all())
        
        return rooms, total
    
    async def create_room(
        self,
        room_data: ConferenceRoomCreate,
        created_by: User
    ) -> Tuple[Optional[ConferenceRoom], Optional[str]]:
        """Create a new conference room - Manager only."""
        if not self.can_manage_desks(created_by):
            return None, "Only DESK_CONFERENCE Manager can create conference rooms"
        
        room = ConferenceRoom(
            room_label=room_data.room_label,
            capacity=room_data.capacity,
            has_projector=room_data.has_projector,
            has_whiteboard=room_data.has_whiteboard,
            has_video_conferencing=room_data.has_video_conferencing,
            notes=room_data.notes,
            created_by_code=created_by.user_code
        )
        
        self.db.add(room)
        await self.db.commit()
        await self.db.refresh(room)
        
        return room, None
    
    async def update_room(
        self,
        room_id: UUID,
        room_data: ConferenceRoomUpdate,
        user: User
    ) -> Tuple[Optional[ConferenceRoom], Optional[str]]:
        """Update a conference room - Manager only."""
        if not self.can_manage_desks(user):
            return None, "Only DESK_CONFERENCE Manager can update conference rooms"
        
        room = await self.get_room_by_id(room_id)
        if not room:
            return None, "Conference room not found"
        
        update_data = room_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(room, field, value)
        
        await self.db.commit()
        await self.db.refresh(room)
        
        return room, None
    
    async def delete_room(
        self,
        room_id: UUID,
        user: User
    ) -> Tuple[bool, Optional[str]]:
        """Soft delete a conference room - Manager only."""
        if not self.can_manage_desks(user):
            return False, "Only DESK_CONFERENCE Manager can delete conference rooms"
        
        room = await self.get_room_by_id(room_id)
        if not room:
            return False, "Conference room not found"
        
        # Check for active bookings
        active_bookings = await self.db.execute(
            select(ConferenceRoomBooking).where(
                and_(
                    ConferenceRoomBooking.room_id == room_id,
                    ConferenceRoomBooking.status.in_([BookingStatus.PENDING, BookingStatus.CONFIRMED]),
                    ConferenceRoomBooking.booking_date >= date.today()
                )
            )
        )
        if active_bookings.scalar_one_or_none():
            return False, "Cannot delete room with active bookings"
        
        room.is_active = False
        await self.db.commit()
        
        return True, None
    
    # ==================== Conference Room Booking ====================
    
    async def get_room_booking_by_id(self, booking_id: UUID) -> Optional[ConferenceRoomBooking]:
        """Get conference room booking by ID."""
        result = await self.db.execute(
            select(ConferenceRoomBooking)
            .options(selectinload(ConferenceRoomBooking.room))
            .where(ConferenceRoomBooking.id == booking_id)
        )
        return result.scalar_one_or_none()
    
    async def check_room_booking_overlap(
        self,
        room_id: UUID,
        booking_date: date,
        start_time: time,
        end_time: time,
        exclude_booking_id: Optional[UUID] = None,
        user_code: Optional[str] = None
    ) -> bool:
        """
        Check if there's an overlapping CONFIRMED room booking,
        or if the same user already has a PENDING request for this slot.
        
        This allows multiple different users to request the same time slot,
        with the manager deciding which one to approve, but prevents a single
        user from submitting duplicate requests.
        """
        time_overlap = or_(
            and_(
                ConferenceRoomBooking.start_time <= start_time,
                ConferenceRoomBooking.end_time > start_time
            ),
            and_(
                ConferenceRoomBooking.start_time < end_time,
                ConferenceRoomBooking.end_time >= end_time
            ),
            and_(
                ConferenceRoomBooking.start_time >= start_time,
                ConferenceRoomBooking.end_time <= end_time
            )
        )

        # Check 1: Overlapping CONFIRMED bookings (any user)
        confirmed_query = select(ConferenceRoomBooking).where(
            and_(
                ConferenceRoomBooking.room_id == room_id,
                ConferenceRoomBooking.booking_date == booking_date,
                ConferenceRoomBooking.status == BookingStatus.CONFIRMED,
                time_overlap
            )
        )
        if exclude_booking_id:
            confirmed_query = confirmed_query.where(ConferenceRoomBooking.id != exclude_booking_id)
        
        result = await self.db.execute(confirmed_query)
        if result.scalar_one_or_none() is not None:
            return True

        # Check 2: Same user's own PENDING bookings for the same slot
        if user_code:
            pending_query = select(ConferenceRoomBooking).where(
                and_(
                    ConferenceRoomBooking.room_id == room_id,
                    ConferenceRoomBooking.booking_date == booking_date,
                    ConferenceRoomBooking.user_code == user_code,
                    ConferenceRoomBooking.status == BookingStatus.PENDING,
                    time_overlap
                )
            )
            if exclude_booking_id:
                pending_query = pending_query.where(ConferenceRoomBooking.id != exclude_booking_id)
            
            result = await self.db.execute(pending_query)
            if result.scalar_one_or_none() is not None:
                return True

        return False
    
    async def create_room_booking(
        self,
        booking_data: ConferenceRoomBookingCreate,
        user: User
    ) -> Tuple[Optional[ConferenceRoomBooking], Optional[str]]:
        """
        Create a new conference room booking.
        
        Multiple users can request the same room/time slot even if it's already
        booked or has pending requests. The conference manager will decide which
        request to approve. Only one booking can be CONFIRMED for a given time slot.
        """
        room = await self.get_room_by_id(booking_data.room_id)
        if not room:
            return None, "Conference room not found"
        if not room.is_active:
            return None, "Conference room is not active"
        if room.status == DeskStatus.MAINTENANCE:
            return None, "Conference room is under maintenance"
        
        # Check capacity
        if booking_data.attendees_count > room.capacity:
            return None, f"Attendees count exceeds room capacity ({room.capacity})"
        
        # Check for overlapping bookings
        # We pass user.user_code to ensure they can't book the same slot twice
        # (even if it's just PENDING)
        has_overlap = await self.check_room_booking_overlap(
            booking_data.room_id,
            booking_data.booking_date,
            booking_data.start_time,
            booking_data.end_time,
            user_code=user.user_code
        )
        if has_overlap:
            return None, "Time slot overlaps with an existing confirmed booking or your own pending request"
        
        booking = ConferenceRoomBooking(
            room_id=booking_data.room_id,
            user_code=user.user_code,
            booking_date=booking_data.booking_date,
            start_time=booking_data.start_time,
            end_time=booking_data.end_time,
            title=booking_data.title,
            description=booking_data.description,
            attendees_count=booking_data.attendees_count,
            status=BookingStatus.PENDING,  # Default to PENDING for approval workflow
            notes=booking_data.notes
        )
        
        self.db.add(booking)
        await self.db.commit()
        await self.db.refresh(booking)
        
        # Re-query with eager-loaded room relationship to avoid lazy loading in async context
        result = await self.db.execute(
            select(ConferenceRoomBooking)
            .options(selectinload(ConferenceRoomBooking.room))
            .where(ConferenceRoomBooking.id == booking.id)
        )
        booking = result.scalar_one()
        
        return booking, None
    
    async def cancel_room_booking(
        self,
        booking_id: UUID,
        user: User,
        reason: Optional[str] = None
    ) -> Tuple[bool, Optional[str]]:
        """Cancel a conference room booking."""
        booking = await self.get_room_booking_by_id(booking_id)
        if not booking:
            return False, "Booking not found"
        
        if booking.user_code != user.user_code:
            if not self.can_manage_desks(user):
                return False, "Cannot cancel another user's booking"
        
        if booking.status == BookingStatus.CANCELLED:
            return False, "Booking is already cancelled"
        
        booking.status = BookingStatus.CANCELLED
        booking.cancellation_reason = reason
        booking.cancelled_at = datetime.now(timezone.utc)
        
        await self.db.commit()
        
        return True, None
    
    async def list_room_bookings(
        self,
        room_id: Optional[UUID] = None,
        user_code: Optional[str] = None,
        booking_date: Optional[date] = None,
        status: Optional[BookingStatus] = None,
        page: int = 1,
        page_size: int = 20
    ) -> Tuple[List[ConferenceRoomBooking], int]:
        """List conference room bookings with filtering."""
        query = select(ConferenceRoomBooking).options(selectinload(ConferenceRoomBooking.room))
        count_query = select(func.count(ConferenceRoomBooking.id))
        
        conditions = []
        if room_id:
            conditions.append(ConferenceRoomBooking.room_id == room_id)
        if user_code:
            conditions.append(ConferenceRoomBooking.user_code == user_code)
        if booking_date:
            conditions.append(ConferenceRoomBooking.booking_date == booking_date)
        if status:
            conditions.append(ConferenceRoomBooking.status == status)
        
        if conditions:
            query = query.where(and_(*conditions))
            count_query = count_query.where(and_(*conditions))
        
        # Get total count
        total_result = await self.db.execute(count_query)
        total = total_result.scalar()
        
        # Get paginated results
        query = query.order_by(ConferenceRoomBooking.booking_date.desc(), ConferenceRoomBooking.start_time)
        query = query.offset((page - 1) * page_size).limit(page_size)
        result = await self.db.execute(query)
        bookings = list(result.scalars().all())
        
        return bookings, total
    
    async def approve_room_booking(
        self,
        booking_id: UUID,
        user: User,
        notes: Optional[str] = None
    ) -> Tuple[Optional[ConferenceRoomBooking], Optional[str]]:
        """Approve a pending conference room booking. Manager only."""
        if not self.can_manage_desks(user):
            return None, "Only DESK_CONFERENCE Manager can approve bookings"
        
        booking = await self.get_room_booking_by_id(booking_id)
        if not booking:
            return None, "Booking not found"
        
        if booking.status != BookingStatus.PENDING:
            return None, f"Cannot approve booking with status '{booking.status.value}'. Only PENDING bookings can be approved."
        
        # Check for overlapping confirmed bookings (in case another was approved first)
        has_overlap = await self.check_room_booking_overlap(
            booking.room_id,
            booking.booking_date,
            booking.start_time,
            booking.end_time,
            exclude_booking_id=booking_id
        )
        if has_overlap:
            return None, "Cannot approve: Time slot now conflicts with another confirmed booking"
        
        booking.status = BookingStatus.CONFIRMED
        if notes:
            booking.notes = (booking.notes or "") + f"\nApproval note: {notes}"
        
        await self.db.commit()
        await self.db.refresh(booking)
        
        return booking, None
    
    async def reject_room_booking(
        self,
        booking_id: UUID,
        user: User,
        reason: str
    ) -> Tuple[Optional[ConferenceRoomBooking], Optional[str]]:
        """Reject a pending conference room booking. Manager only."""
        if not self.can_manage_desks(user):
            return None, "Only DESK_CONFERENCE Manager can reject bookings"
        
        booking = await self.get_room_booking_by_id(booking_id)
        if not booking:
            return None, "Booking not found"
        
        if booking.status != BookingStatus.PENDING:
            return None, f"Cannot reject booking with status '{booking.status.value}'. Only PENDING bookings can be rejected."
        
        booking.status = BookingStatus.REJECTED
        booking.cancellation_reason = reason
        booking.cancelled_at = datetime.now(timezone.utc)
        
        await self.db.commit()
        await self.db.refresh(booking)
        
        return booking, None
    
    async def list_pending_room_bookings(
        self,
        page: int = 1,
        page_size: int = 20
    ) -> Tuple[List[ConferenceRoomBooking], int]:
        """List all pending conference room bookings for manager review."""
        return await self.list_room_bookings(
            status=BookingStatus.PENDING,
            page=page,
            page_size=page_size
        )
    
    async def get_conflicting_pending_bookings(
        self,
        room_id: UUID,
        booking_date: date,
        start_time: time,
        end_time: time,
        exclude_booking_id: Optional[UUID] = None
    ) -> List[ConferenceRoomBooking]:
        """
        Get all PENDING bookings that conflict with the given time slot.
        
        This helps managers see all pending requests for the same room/time
        when deciding which booking to approve.
        """
        query = select(ConferenceRoomBooking).options(
            selectinload(ConferenceRoomBooking.room)
        ).where(
            and_(
                ConferenceRoomBooking.room_id == room_id,
                ConferenceRoomBooking.booking_date == booking_date,
                ConferenceRoomBooking.status == BookingStatus.PENDING,
                or_(
                    and_(
                        ConferenceRoomBooking.start_time <= start_time,
                        ConferenceRoomBooking.end_time > start_time
                    ),
                    and_(
                        ConferenceRoomBooking.start_time < end_time,
                        ConferenceRoomBooking.end_time >= end_time
                    ),
                    and_(
                        ConferenceRoomBooking.start_time >= start_time,
                        ConferenceRoomBooking.end_time <= end_time
                    )
                )
            )
        )
        
        if exclude_booking_id:
            query = query.where(ConferenceRoomBooking.id != exclude_booking_id)
        
        query = query.order_by(ConferenceRoomBooking.created_at)
        result = await self.db.execute(query)
        return list(result.scalars().all())
