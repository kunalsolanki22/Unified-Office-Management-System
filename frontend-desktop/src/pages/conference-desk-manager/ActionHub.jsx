import { Car, Coffee, Monitor, Users, HardDrive } from 'lucide-react';
import ActionHubShared from '../../components/shared/ActionHub';

const ActionHub = () => {
    const actions = [
        { icon: Coffee, label: 'CAFETERIA OPS', sub: 'Food Provisioning Oversight', path: '/conference-desk-manager/service-booking' },
        { icon: Monitor, label: 'DESK MANAGEMENT', sub: 'Workspace Allocation', path: '/conference-desk-manager/service-booking?tab=desk' },
        { icon: Car, label: 'PARKING MANAGER', sub: 'Slot & Capacity Controls', path: '/conference-desk-manager/service-booking?tab=parking' },
        { icon: Users, label: 'CONFERENCE MGMT', sub: 'Room Booking & Scheduling', path: '/conference-desk-manager/service-booking?tab=conference' },
        { icon: HardDrive, label: 'HARDWARE REGISTRY', sub: 'Inventory Assignment', path: '/conference-desk-manager/service-booking?tab=hardware' },
    ];

    return <ActionHubShared actions={actions} title="QUICK ACTIONS" />;
};

export default ActionHub;
