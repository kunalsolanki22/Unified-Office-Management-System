import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';

const AddFoodModal = ({ isOpen, onClose, onAdd, initialData = null }) => {
    const defaultState = {
        name: '',
        category: 'Main Course',
        price: '',
        status: 'Available'
    };

    const [newItem, setNewItem] = useState(defaultState);

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setNewItem({
                    name: initialData.name || '',
                    category: initialData.category || 'Main Course',
                    price: initialData.price || '',
                    status: initialData.status || 'Available'
                });
            } else {
                setNewItem(defaultState);
            }
        }
    }, [isOpen, initialData]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onAdd({
            ...newItem,
            price: parseFloat(newItem.price)
        });
        setNewItem(defaultState);
        onClose();
    };

    const isEdit = !!initialData;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? "Edit Food Item" : "Add New Food Item"} maxWidth="max-w-[400px]">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-xs font-bold text-[#1a367c] mb-1.5 uppercase tracking-wide">Item Name</label>
                    <Input
                        placeholder="e.g. Chicken Burger"
                        value={newItem.name}
                        onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                        required
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-[#1a367c] mb-1.5 uppercase tracking-wide">Category</label>
                    <select
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-[#1a367c] focus:outline-none focus:ring-1 focus:ring-[#1a367c] transition-colors bg-white"
                        value={newItem.category}
                        onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                    >
                        <option value="Main Course">Main Course</option>
                        <option value="Snacks">Snacks</option>
                        <option value="Beverages">Beverages</option>
                        <option value="Dessert">Dessert</option>
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-bold text-[#1a367c] mb-1.5 uppercase tracking-wide">Price ($)</label>
                    <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={newItem.price}
                        onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                        required
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-[#1a367c] mb-1.5 uppercase tracking-wide">Status</label>
                    <select
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-[#1a367c] focus:outline-none focus:ring-1 focus:ring-[#1a367c] transition-colors bg-white"
                        value={newItem.status}
                        onChange={(e) => setNewItem({ ...newItem, status: e.target.value })}
                    >
                        <option value="Available">Available</option>
                        <option value="Out of Stock">Out of Stock</option>
                        <option value="Unavailable">Unavailable</option>
                    </select>
                </div>

                <div className="flex gap-3 pt-4">
                    <Button type="submit" className="flex-1">{isEdit ? "Update Item" : "Add Item"}</Button>
                    <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
                </div>
            </form>
        </Modal>
    );
};

export default AddFoodModal;
