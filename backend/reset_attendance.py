from sqlalchemy import text, create_engine
from sqlalchemy.orm import sessionmaker
from datetime import date
from app.core.config import settings

def reset_attendance():
    # Use sync engine URL
    engine = create_engine(settings.DATABASE_URL_SYNC)
    Session = sessionmaker(bind=engine)
    db = Session()
    
    try:
        print("Resetting attendance for ALL users for today...")
        
        # 1. Delete associated entries first (Foreign Key Constraint)
        delete_entries_query = text("""
            DELETE FROM attendance_entries 
            WHERE attendance_id IN (
                SELECT id FROM attendances WHERE date = :today
            )
        """)
        res_entries = db.execute(delete_entries_query, {"today": date.today()})
        print(f"Deleted {res_entries.rowcount} attendance entries.")
        
        # 2. Delete attendances
        delete_attendance_query = text("DELETE FROM attendances WHERE date = :today")
        res_att = db.execute(delete_attendance_query, {"today": date.today()})
        db.commit()
        print(f"Attendance for {date.today()} has been reset for ALL users. Deleted {res_att.rowcount} attendance records.")
            
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    reset_attendance()
