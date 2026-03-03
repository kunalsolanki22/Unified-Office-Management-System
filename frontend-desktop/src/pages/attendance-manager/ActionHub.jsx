import { Car, Coffee, Monitor, Users, HardDrive } from 'lucide-react';
import ActionHubShared from '../../components/shared/ActionHub';

const ActionHub = () => {
    const actions = [
        { icon: Coffee, label: 'Cafeteria Booking', sub: 'Order Food & Reserve Tables', path: '/attendance-manager/service-booking' },
        { icon: Monitor, label: 'Desk Booking', sub: 'Book a Workspace', path: '/attendance-manager/service-booking?tab=desk' },
        { icon: Car, label: 'Parking Allocation', sub: 'Reserve a Parking Slot', path: '/attendance-manager/service-booking?tab=parking' },
        { icon: Users, label: 'Conference Room', sub: 'Book Meeting Rooms', path: '/attendance-manager/service-booking?tab=conference' },
        { icon: HardDrive, label: 'IT Hardware Support', sub: 'Request IT Assets & Support', path: '/attendance-manager/service-booking?tab=hardware' },
    ];

    return <ActionHubShared actions={actions} title="QUICK ACTIONS" />;
};

export default ActionHub;
