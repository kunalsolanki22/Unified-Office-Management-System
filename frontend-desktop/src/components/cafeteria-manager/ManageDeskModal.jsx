import React from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { User, Calendar, XCircle, AlertTriangle, CheckCircle } from 'lucide-react';

const ManageDeskModal = ({ isOpen, onClose, deskId, allocation, onCancel, onToggleMaintenance }) => {
    if (!deskId) return null;

    const maintenanceMode = allocation && allocation.status === 'Maintenance';
    const bookedMode = allocation && allocation.status === 'Booked';

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Desk ${deskId.split('-')[1]}`} maxWidth="max-w-[400px]">
            <div className="mb-6">
                <div className="text-sm font-medium text-slate-500 mb-4">
                    Status: <span className={`font-bold ${bookedMode ? 'text-blue-600' : maintenanceMode ? 'text-red-600' : 'text-green-600'
                        }`}>
                        {bookedMode ? 'Booked' : maintenanceMode ? 'Under Maintenance' : 'Available'}
                    </span>
                </div>

                {bookedMode && (
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
                        <div className="flex items-center gap-2 text-sm text-[#333]">
                            <User className="w-4 h-4 text-[#8892b0]" />
                            <span className="font-bold">{allocation.user}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-[#333]">
                            <Calendar className="w-4 h-4 text-[#8892b0]" />
                            <span>{allocation.date}</span>
                        </div>
                    </div>
                )}
            </div>

            <div className="flex flex-col gap-3">
                {bookedMode && (
                    <Button
                        variant="destructive"
                        className="w-full justify-center"
                        onClick={() => { onCancel(deskId); onClose(); }}
                    >
                        <XCircle className="w-4 h-4 mr-2" /> Cancel Booking
                    </Button>
                )}

                <Button
                    variant={maintenanceMode ? "success" : "secondary"}
                    className="w-full justify-center"
                    onClick={() => { onToggleMaintenance(deskId); onClose(); }}
                >
                    {maintenanceMode ? (
                        <><CheckCircle className="w-4 h-4 mr-2" /> Unmark Maintenance</>
                    ) : (
                        <><AlertTriangle className="w-4 h-4 mr-2" /> Mark as Maintenance</>
                    )}
                </Button>

                <Button variant="outline" onClick={onClose} className="w-full justify-center">
                    Close
                </Button>
            </div>
        </Modal>
    );
};

export default ManageDeskModal;
