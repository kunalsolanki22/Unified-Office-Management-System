"""
Booking Cleanup Service
- Auto-release expired desk bookings (end_date + end_time passed)
- Auto-release expired cafeteria table bookings (booking_date + end_time passed)
- Auto-reject expired pending conference room bookings (booking_date + end_time passed)
"""

import asyncio
import logging
from datetime import datetime, date, time, timezone, timedelta
from sqlalchemy import update, and_
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.database import AsyncSessionLocal
from ..models.desk import DeskBooking, ConferenceRoomBooking
from ..models.cafeteria import CafeteriaTableBooking
from ..models.enums import BookingStatus

logger = logging.getLogger(__name__)


async def cleanup_expired_bookings():
    """Run all cleanup tasks."""
    async with AsyncSessionLocal() as session:
        try:
            from zoneinfo import ZoneInfo
            ist = ZoneInfo("Asia/Kolkata")
            now = datetime.now(ist)
            today = now.date()
            current_time = now.time()

            # 1. Auto-release expired desk bookings
            desk_result = await session.execute(
                update(DeskBooking)
                .where(
                    and_(
                        DeskBooking.status.in_([BookingStatus.CONFIRMED]),
                        # Booking has expired: end_date is past, OR end_date is today but end_time has passed
                        DeskBooking.end_date <= today,
                    )
                )
                .where(
                    # Either end_date is strictly before today, or it's today and end_time has passed
                    (DeskBooking.end_date < today) | 
                    (and_(DeskBooking.end_date == today, DeskBooking.end_time <= current_time))
                )
                .values(
                    status=BookingStatus.COMPLETED,
                    notes="Auto-released: booking period ended"
                )
            )
            if desk_result.rowcount > 0:
                logger.info(f"Auto-released {desk_result.rowcount} expired desk bookings")

            # 2. Auto-release expired cafeteria table bookings
            cafe_result = await session.execute(
                update(CafeteriaTableBooking)
                .where(
                    and_(
                        CafeteriaTableBooking.status.in_([BookingStatus.CONFIRMED]),
                        CafeteriaTableBooking.booking_date <= today,
                    )
                )
                .where(
                    (CafeteriaTableBooking.booking_date < today) |
                    (and_(CafeteriaTableBooking.booking_date == today, CafeteriaTableBooking.end_time <= current_time))
                )
                .values(
                    status=BookingStatus.COMPLETED,
                    notes="Auto-released: booking period ended"
                )
            )
            if cafe_result.rowcount > 0:
                logger.info(f"Auto-released {cafe_result.rowcount} expired cafeteria bookings")

            # 3. Auto-reject expired PENDING conference room bookings
            conf_result = await session.execute(
                update(ConferenceRoomBooking)
                .where(
                    and_(
                        ConferenceRoomBooking.status == BookingStatus.PENDING,
                        ConferenceRoomBooking.booking_date <= today,
                    )
                )
                .where(
                    (ConferenceRoomBooking.booking_date < today) |
                    (and_(ConferenceRoomBooking.booking_date == today, ConferenceRoomBooking.end_time <= current_time))
                )
                .values(
                    status=BookingStatus.REJECTED,
                    notes="Auto-rejected: booking time has passed without approval"
                )
            )
            if conf_result.rowcount > 0:
                logger.info(f"Auto-rejected {conf_result.rowcount} expired pending conference bookings")

            # 4. Auto-complete expired CONFIRMED conference room bookings
            conf_complete_result = await session.execute(
                update(ConferenceRoomBooking)
                .where(
                    and_(
                        ConferenceRoomBooking.status == BookingStatus.CONFIRMED,
                        ConferenceRoomBooking.booking_date <= today,
                    )
                )
                .where(
                    (ConferenceRoomBooking.booking_date < today) |
                    (and_(ConferenceRoomBooking.booking_date == today, ConferenceRoomBooking.end_time <= current_time))
                )
                .values(
                    status=BookingStatus.COMPLETED,
                    notes="Auto-completed: meeting time ended"
                )
            )
            if conf_complete_result.rowcount > 0:
                logger.info(f"Auto-completed {conf_complete_result.rowcount} expired conference bookings")

            await session.commit()
            logger.info("Booking cleanup completed successfully")

        except Exception as e:
            await session.rollback()
            logger.error(f"Booking cleanup failed: {e}")


async def run_cleanup_scheduler(interval_minutes: int = 5):
    """
    Background task that runs cleanup every N minutes.
    Runs as an asyncio task inside the FastAPI event loop.
    """
    logger.info(f"Booking cleanup scheduler started (interval: {interval_minutes} min)")
    while True:
        try:
            await cleanup_expired_bookings()
        except Exception as e:
            logger.error(f"Cleanup scheduler error: {e}")
        await asyncio.sleep(interval_minutes * 60)