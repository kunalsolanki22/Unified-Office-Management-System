import { Car, Coffee, Monitor, Users, HardDrive } from 'lucide-react';
import ActionHubShared from '../../components/shared/ActionHub';

const ActionHub = () => {
    const actions = [
        { icon: Coffee, label: 'CAFETERIA OPS', sub: 'Food Provisioning Oversight', path: '/admin/service-booking' },
        { icon: Monitor, label: 'DESK MANAGEMENT', sub: 'Workspace Allocation', path: '/admin/service-booking?tab=desk' },
        { icon: Car, label: 'PARKING MANAGER', sub: 'Slot & Capacity Controls', path: '/admin/service-booking?tab=parking' },
        { icon: Users, label: 'CONFERENCE MGMT', sub: 'Room Booking & Scheduling', path: '/admin/service-booking?tab=conference' },
        { icon: HardDrive, label: 'HARDWARE REGISTRY', sub: 'Inventory Assignment', path: '/admin/service-booking?tab=hardware' },
    ];

    return <ActionHubShared actions={actions} title="SERVICES" />;
};

export default ActionHub;
