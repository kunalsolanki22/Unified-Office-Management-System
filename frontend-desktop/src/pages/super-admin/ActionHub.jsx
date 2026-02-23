import { useLocation } from 'react-router-dom';
import { Car, Coffee, Monitor, Users, HardDrive } from 'lucide-react';
import ActionHubShared from '../../components/shared/ActionHub';

const ActionHub = () => {
    const location = useLocation();
    const basePath = '/' + location.pathname.split('/')[1];

    const actions = [
        { icon: Coffee, label: 'CAFETERIA OPS', sub: 'Food Provisioning Oversight', path: `${basePath}/service-booking` },
        { icon: Monitor, label: 'DESK MANAGEMENT', sub: 'Workspace Allocation', path: `${basePath}/service-booking?tab=desk` },
        { icon: Car, label: 'PARKING MANAGER', sub: 'Slot & Capacity Controls', path: `${basePath}/service-booking?tab=parking` },
        { icon: Users, label: 'CONFERENCE MGMT', sub: 'Room Booking & Scheduling', path: `${basePath}/service-booking?tab=conference` },
        { icon: HardDrive, label: 'HARDWARE REGISTRY', sub: 'Inventory Assignment', path: `${basePath}/service-booking?tab=hardware` },
    ];

    return <ActionHubShared actions={actions} title="SERVICES" />;
};

export default ActionHub;
