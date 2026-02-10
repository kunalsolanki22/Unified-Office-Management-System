import { useState } from 'react';
import { Card } from '../../components/ui/Card';

const mockVendors = [
    { id: 1, name: 'TechSupply Co.', contact: 'Ravi Mehta', email: 'ravi@techsupply.com', phone: '+91 98765 43210', specialization: 'Laptops & Monitors' },
    { id: 2, name: 'InfoGear Ltd.', contact: 'Sneha Joshi', email: 'sneha@infogear.com', phone: '+91 91234 56789', specialization: 'Peripherals' },
    { id: 3, name: 'CoreTech Pvt.', contact: 'Amit Shah', email: 'amit@coretech.com', phone: '+91 99887 76655', specialization: 'Networking Equipment' },
];

function HardwareVendors() {
    const [vendors, setVendors] = useState(mockVendors);
    const [showForm, setShowForm] = useState(false);
    const [newVendor, setNewVendor] = useState({ name: '', contact: '', email: '', phone: '', specialization: '' });

    const handleAdd = () => {
        if (!newVendor.name || !newVendor.email) return;
        setVendors([...vendors, { id: vendors.length + 1, ...newVendor }]);
        setNewVendor({ name: '', contact: '', email: '', phone: '', specialization: '' });
        setShowForm(false);
    };

    const fields = [
        { key: 'name', label: 'Vendor Name', placeholder: 'e.g. TechSupply Co.' },
        { key: 'contact', label: 'Contact Person', placeholder: 'e.g. Ravi Mehta' },
        { key: 'email', label: 'Email', placeholder: 'e.g. ravi@vendor.com' },
        { key: 'phone', label: 'Phone', placeholder: 'e.g. +91 98765 43210' },
        { key: 'specialization', label: 'Specialization', placeholder: 'e.g. Laptops & Monitors' },
    ];

    return (
        <div>
            <div className="mb-8 flex justify-between items-start">
                <div>
                    <p className="text-xs text-slate-400 uppercase tracking-widest mb-1">Hardware Manager</p>
                    <h1 className="text-3xl font-bold text-slate-900">
                        Vendor <span className="text-orange-400">Directory</span>
                    </h1>
                    <p className="text-xs text-slate-400 uppercase tracking-widest mt-1">Manage Hardware Suppliers & Contacts</p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="bg-[#1a3a5c] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#16324f] uppercase tracking-widest"
                >
                    + Add Vendor
                </button>
            </div>

            {showForm && (
                <Card className="mb-6">
                    <h2 className="font-semibold text-slate-800 mb-4 uppercase tracking-widest text-sm">Add New Vendor</h2>
                    <div className="grid grid-cols-2 gap-4">
                        {fields.map(field => (
                            <div key={field.key}>
                                <label className="text-xs text-slate-500 uppercase tracking-widest mb-1 block">{field.label}</label>
                                <input
                                    value={newVendor[field.key]}
                                    onChange={e => setNewVendor({ ...newVendor, [field.key]: e.target.value })}
                                    placeholder={field.placeholder}
                                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                                />
                            </div>
                        ))}
                    </div>
                    <div className="flex gap-3 mt-4">
                        <button onClick={handleAdd} className="bg-orange-400 text-white px-4 py-2 rounded-lg text-sm hover:bg-orange-500 uppercase tracking-widest">
                            Save Vendor
                        </button>
                        <button onClick={() => setShowForm(false)} className="border border-slate-200 text-slate-500 px-4 py-2 rounded-lg text-sm hover:bg-slate-50 uppercase tracking-widest">
                            Cancel
                        </button>
                    </div>
                </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {vendors.map(vendor => (
                    <Card key={vendor.id}>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-[#1a3a5c] flex items-center justify-center text-white font-bold text-sm">
                                {vendor.name[0]}
                            </div>
                            <div>
                                <p className="font-semibold text-slate-800 text-sm">{vendor.name}</p>
                                <p className="text-xs text-orange-400 uppercase tracking-widest">{vendor.specialization}</p>
                            </div>
                        </div>
                        <div className="space-y-1 text-xs text-slate-500">
                            <p>👤 {vendor.contact}</p>
                            <p>✉️ {vendor.email}</p>
                            <p>📞 {vendor.phone}</p>
                        </div>
                        <div className="h-1 w-8 bg-orange-400 mt-4 rounded"></div>
                    </Card>
                ))}
            </div>
        </div>
    );
}

export default HardwareVendors;