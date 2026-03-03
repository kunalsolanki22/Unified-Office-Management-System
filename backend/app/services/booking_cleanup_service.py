"""
Booking cleanup service.
Periodically cleans up expired/stale bookings to maintain data consistency.
"""
import asyncio
import logging
from datetime import datetime, timezone, date, timedelta
from sqlalchemy import select, and_, update
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.database import AsyncSessionLocal
from ..models.desk import DeskBooking, ConferenceRoomBooking
from ..models.enums import BookingStatus, DeskStatus

logger = logging.getLogger(__name__)


async def cleanup_expired_bookings():
    """
    Clean up expired bookings:
    - Mark past PENDING bookings as CANCELLED
    - Mark past CONFIRMED bookings as COMPLETED
    """
    try:
        async with AsyncSessionLocal() as db:
            today = date.today()
            now = datetime.now(timezone.utc)
            
            # Cancel expired PENDING desk bookings
            pending_result = await db.execute(
                update(DeskBooking)
                .where(
                    and_(
                        DeskBooking.status == BookingStatus.PENDING,
                        DeskBooking.end_date < today
                    )
                )
                .values(status=BookingStatus.CANCELLED)
            )
            pending_cancelled = pending_result.rowcount
            
            # Complete expired CONFIRMED desk bookings
            confirmed_result = await db.execute(
                update(DeskBooking)
                .where(
                    and_(
                        DeskBooking.status == BookingStatus.CONFIRMED,
                        DeskBooking.end_date < today
                    )
                )
                .values(status=BookingStatus.COMPLETED)
            )
            confirmed_completed = confirmed_result.rowcount
            
            # Cancel expired PENDING conference room bookings
            room_pending_result = await db.execute(
                update(ConferenceRoomBooking)
                .where(
                    and_(
                        ConferenceRoomBooking.status == BookingStatus.PENDING,
                        ConferenceRoomBooking.booking_date < today
                    )
                )
                .values(status=BookingStatus.CANCELLED)
            )
            room_pending_cancelled = room_pending_result.rowcount
            
            # Complete expired CONFIRMED conference room bookings
            room_confirmed_result = await db.execute(
                update(ConferenceRoomBooking)
                .where(
                    and_(
                        ConferenceRoomBooking.status == BookingStatus.CONFIRMED,
                        ConferenceRoomBooking.booking_date < today
                    )
                )
                .values(status=BookingStatus.COMPLETED)
            )
            room_confirmed_completed = room_confirmed_result.rowcount
            
            await db.commit()
            
            total_cleaned = (
                pending_cancelled + confirmed_completed +
                room_pending_cancelled + room_confirmed_completed
            )
            
            if total_cleaned > 0:
                logger.info(
                    f"Booking cleanup completed: "
                    f"desk_pending_cancelled={pending_cancelled}, "
                    f"desk_confirmed_completed={confirmed_completed}, "
                    f"room_pending_cancelled={room_pending_cancelled}, "
                    f"room_confirmed_completed={room_confirmed_completed}"
                )
            
    except Exception as e:
        logger.error(f"Booking cleanup error: {e}")


async def run_cleanup_scheduler(interval_minutes: int = 5):
    """
    Run the booking cleanup task periodically.
    
    Args:
        interval_minutes: Interval between cleanup runs in minutes.
    """
    while True:
        try:
            await asyncio.sleep(interval_minutes * 60)
            await cleanup_expired_bookings()
        except asyncio.CancelledError:
            logger.info("Cleanup scheduler cancelled")
            break
        except Exception as e:
            logger.error(f"Cleanup scheduler error: {e}")
            # Continue running even if there's an error
            await asyncio.sleep(60)  # Wait 1 minute before retrying
