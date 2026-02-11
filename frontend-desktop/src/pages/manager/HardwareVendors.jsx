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
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8">
            <motion.div variants={itemVariants} className="flex justify-between items-start">
                <div>
                    <p className="text-[0.65rem] uppercase tracking-[1.5px] text-[#8892b0] mb-0.5 font-bold">Hardware Manager</p>
                    <h1 className="text-[1.8rem] font-extrabold text-[#1a367c]">
                        Vendor <span className="text-[#f9b012]">Directory</span>
                    </h1>
                    <p className="text-[0.7rem] uppercase tracking-[1.2px] text-[#8892b0] font-bold mt-1">Manage Hardware Suppliers & Contacts</p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="bg-[#1a367c] text-white px-6 py-3 rounded-xl text-xs font-bold tracking-widest flex items-center gap-2 hover:bg-[#2c4a96] transition-all hover:shadow-lg hover:shadow-blue-900/20"
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
                        className="bg-white rounded-[24px] shadow-sm border border-slate-100 p-8 overflow-hidden"
                    >
                        <h2 className="text-[0.7rem] uppercase tracking-[1.2px] text-[#8892b0] font-bold mb-6">New Vendor Details</h2>
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            {fields.map(field => (
                                <div key={field.key}>
                                    <label className="text-[0.65rem] uppercase tracking-[1.5px] text-[#8892b0] font-bold block mb-2">{field.label}</label>
                                    <input
                                        value={newVendor[field.key]}
                                        onChange={e => setNewVendor({ ...newVendor, [field.key]: e.target.value })}
                                        placeholder={field.placeholder}
                                        className="w-full bg-[#f8f9fa] border border-[#e0e0e0] rounded-xl px-4 py-2.5 text-sm text-[#1a367c] placeholder:text-[#b0b0b0] placeholder:text-xs focus:outline-none focus:border-[#1a367c]"
                                    />
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-3">
                            <button onClick={handleAdd} className="bg-[#1a367c] text-white px-6 py-2.5 rounded-xl text-xs font-bold tracking-widest hover:bg-[#2c4a96] transition-all">
                                SAVE VENDOR
                            </button>
                            <button onClick={() => setShowForm(false)} className="bg-slate-100 text-[#8892b0] px-6 py-2.5 rounded-xl text-xs font-bold tracking-widest hover:bg-slate-200 transition-all">
                                CANCEL
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {vendors.map((vendor, idx) => (
                    <motion.div
                        key={vendor.id}
                        variants={itemVariants}
                        whileHover={{ y: -6, boxShadow: '0 15px 35px rgba(0,0,0,0.08)' }}
                        className="bg-white rounded-[24px] p-8 shadow-sm border border-slate-100 relative overflow-hidden group"
                    >
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 rounded-full bg-[#1a367c] flex items-center justify-center text-white font-bold text-lg shadow-sm">
                                {vendor.name[0]}
                            </div>
                            <div>
                                <p className="font-bold text-[#1a367c] text-sm">{vendor.name}</p>
                                <p className="text-[0.65rem] text-[#f9b012] font-bold uppercase tracking-widest">{vendor.specialization}</p>
                            </div>
                        </div>
                        <div className="space-y-2 text-xs text-[#8892b0]">
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