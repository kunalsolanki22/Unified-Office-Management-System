import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};
const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
};

const mockVendors = [
    { id: 1, name: 'TechSupply Co.', contact: 'Ravi Mehta', email: 'ravi@techsupply.com', phone: '+91 98765 43210', specialization: 'Laptops & Monitors' },
    { id: 2, name: 'InfoGear Ltd.', contact: 'Sneha Joshi', email: 'sneha@infogear.com', phone: '+91 91234 56789', specialization: 'Peripherals' },
    { id: 3, name: 'CoreTech Pvt.', contact: 'Amit Shah', email: 'amit@coretech.com', phone: '+91 99887 76655', specialization: 'Networking Equipment' },
];

const fields = [
    { key: 'name', label: 'VENDOR NAME', placeholder: 'e.g. TechSupply Co.' },
    { key: 'contact', label: 'CONTACT PERSON', placeholder: 'e.g. Ravi Mehta' },
    { key: 'email', label: 'EMAIL', placeholder: 'e.g. ravi@vendor.com' },
    { key: 'phone', label: 'PHONE', placeholder: 'e.g. +91 98765 43210' },
    { key: 'specialization', label: 'SPECIALIZATION', placeholder: 'e.g. Laptops & Monitors' },
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

    return (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
            <motion.div variants={itemVariants} className="flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold text-[#1a367c] mb-1">
                        VENDOR <span className="text-[#f9b012]">DIRECTORY</span>
                    </h1>
                    <p className="text-sm text-[#8892b0] font-medium tracking-wide uppercase">
                        Manage Hardware Suppliers & Contacts
                    </p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="bg-[#1a367c] text-white px-6 py-3 rounded-full text-xs font-bold tracking-widest hover:bg-[#2c4a96] transition-all shadow-lg shadow-blue-900/20 flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" /> ADD VENDOR
                </button>
            </motion.div>

            <AnimatePresence>
                {showForm && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="bg-white rounded-[20px] p-8 shadow-sm border border-slate-100 overflow-hidden"
                    >
                        <h3 className="text-sm font-bold text-[#1a367c] mb-6 tracking-wide">ADD NEW VENDOR</h3>
                        <div className="grid grid-cols-2 gap-6 mb-6">
                            {fields.map(field => (
                                <div key={field.key} className="space-y-2">
                                    <label className="text-[0.65rem] font-bold text-[#8892b0] tracking-wider">{field.label}</label>
                                    <input
                                        value={newVendor[field.key]}
                                        onChange={e => setNewVendor({ ...newVendor, [field.key]: e.target.value })}
                                        placeholder={field.placeholder}
                                        className="w-full bg-[#f8f9fa] p-3 rounded-lg text-sm border-none outline-none focus:ring-2 focus:ring-[#1a367c]/20 text-[#1a367c] font-medium"
                                    />
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setShowForm(false)} className="px-6 py-3 rounded-xl border border-red-100 text-red-500 text-xs font-bold hover:bg-red-50 transition-colors">
                                CANCEL
                            </button>
                            <button onClick={handleAdd} className="px-6 py-3 rounded-xl bg-[#1a367c] text-white text-xs font-bold hover:bg-[#2c4a96] transition-colors shadow-lg shadow-blue-900/10">
                                + SAVE VENDOR
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {vendors.map((vendor) => (
                    <motion.div
                        key={vendor.id}
                        variants={itemVariants}
                        whileHover={{ y: -6, boxShadow: '0 15px 35px rgba(0,0,0,0.08)' }}
                        className="bg-white rounded-[20px] p-8 shadow-sm border border-slate-100 relative overflow-hidden group"
                    >
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 rounded-lg bg-[#1a367c] flex items-center justify-center text-white font-bold text-lg shadow-sm">
                                {vendor.name[0]}
                            </div>
                            <div>
                                <p className="font-bold text-[#1a367c] text-sm">{vendor.name}</p>
                                <p className="text-[0.65rem] text-[#f9b012] font-bold uppercase tracking-widest">{vendor.specialization}</p>
                            </div>
                        </div>
                        <div className="space-y-2 text-xs text-[#8892b0] font-medium">
                            <p>👤 {vendor.contact}</p>
                            <p>✉️ {vendor.email}</p>
                            <p>📞 {vendor.phone}</p>
                        </div>
                        <div className="h-1 w-10 bg-[#f9b012] mt-6 rounded-full transition-all duration-300 group-hover:w-20"></div>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
}

export default HardwareVendors;