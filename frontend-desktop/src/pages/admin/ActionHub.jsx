import { Car, Coffee, Monitor, Users, HardDrive } from 'lucide-react';
import ActionHubShared from '../../components/shared/ActionHub';

const ActionHub = () => {
    const actions = [
        { icon: Coffee, label: 'Cafeteria Booking', sub: 'Order Food & Reserve Tables', path: '/admin/service-booking' },
        { icon: Monitor, label: 'Desk Booking', sub: 'Book a Workspace', path: '/admin/service-booking?tab=desk' },
        { icon: Car, label: 'Parking Allocation', sub: 'Reserve a Parking Slot', path: '/admin/service-booking?tab=parking' },
        { icon: Users, label: 'Conference Room', sub: 'Book Meeting Rooms', path: '/admin/service-booking?tab=conference' },
        { icon: HardDrive, label: 'IT Hardware Support', sub: 'Request IT Assets & Support', path: '/admin/service-booking?tab=hardware' },
    ];

    return <ActionHubShared actions={actions} title="SERVICES" />;
};

export default ActionHub;
