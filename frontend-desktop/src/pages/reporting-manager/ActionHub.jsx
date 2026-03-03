import { useLocation } from 'react-router-dom';
import { Car, Coffee, Monitor, Users, HardDrive } from 'lucide-react';
import ActionHubShared from '../../components/shared/ActionHub';

const ActionHub = () => {
    const location = useLocation();
    const basePath = '/' + location.pathname.split('/')[1];

    const actions = [
        { icon: Coffee, label: 'Cafeteria Booking', sub: 'Order Food & Reserve Tables', path: `${basePath}/service-booking` },
        { icon: Monitor, label: 'Desk Booking', sub: 'Book a Workspace', path: `${basePath}/service-booking?tab=desk` },
        { icon: Car, label: 'Parking Allocation', sub: 'Reserve a Parking Slot', path: `${basePath}/service-booking?tab=parking` },
        { icon: Users, label: 'Conference Room', sub: 'Book Meeting Rooms', path: `${basePath}/service-booking?tab=conference` },
        { icon: HardDrive, label: 'IT Hardware Support', sub: 'Request IT Assets & Support', path: `${basePath}/service-booking?tab=hardware` },
    ];

    return <ActionHubShared actions={actions} title="QUICK ACTIONS" />;
};

export default ActionHub;
