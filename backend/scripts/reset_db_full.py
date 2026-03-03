import sys
import os

# Add the parent directory to sys.path to allow importing from app
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import sync_engine
from app.models import Base

def reset_db():
    print("=" * 60)
    print("  UNIFIED OFFICE MANAGEMENT - DATABASE RESET")
    print("=" * 60)
    
    try:
        print("\n1. Dropping all tables...")
        Base.metadata.drop_all(bind=sync_engine)
        print("   ✅ Done!")
        
        print("\n2. Creating all tables...")
        Base.metadata.create_all(bind=sync_engine)
        print("   ✅ Done!")
        
        print("\n" + "=" * 60)
        print("  DATABASE RESET COMPLETED SUCCESSFULLY!")
        print("=" * 60 + "\n")
        
    except Exception as e:
        print(f"\n❌ Error during database reset: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    reset_db()
