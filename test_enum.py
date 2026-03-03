import sys
import os
os.chdir('c:/Users/aditya.j/Desktop/F_N_F/Unified-Office-Management-System/')
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from app.models.enums import ParkingSlotStatus

try:
    print("Trying 'available':", repr(ParkingSlotStatus("available")))
    print("Trying 'AVAILABLE':", repr(ParkingSlotStatus("AVAILABLE".lower())))
except Exception as e:
    print("Exception:", e)
