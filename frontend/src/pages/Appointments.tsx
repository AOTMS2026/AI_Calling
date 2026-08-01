    import React, { useState } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import { Calendar, User, Mail, Phone, Clock, FileText, Send, Building, Bot, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiClient } from '../api/client';

export function Appointments() {
    const [loading, setLoading] = useState(false);

    // Calculate today's date (YYYY-MM-DD format)
    const today = new Date().toISOString().split('T')[0];

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        agent_id: '',
        org_id: '',
        appointment_datetime: today, // Auto default to today's date
        call_session_id: '',
        notes: '',
        days_ahead: 1,
        action: 'book'
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // 9 digits validation
        if (!/^[0-9]{10}$/.test(formData.phone)) {
            toast.error("Phone number must be exactly 10 digits. Found: " + formData.phone.length);
            return;
        }

        // Email validation for @gmail.com
        if (!formData.email.toLowerCase().endsWith('@gmail.com')) {
            toast.error("Email address must end with @gmail.com");
            return;
        }

        setLoading(true);

        try {
            const payload = {
                ...formData,
                days_ahead: parseInt(formData.days_ahead.toString(), 10)
            };
            const response = await apiClient.post('/api/appointments/book', payload);

            if (response.data.success) {
                toast.success('Appointment confirmed successfully');
                setFormData({
                    name: '',
                    email: '',
                    phone: '',
                    agent_id: '',
                    org_id: '',
                    appointment_datetime: today, // Reset to today
                    call_session_id: '',
                    notes: '',
                    days_ahead: 1,
                    action: 'book'
                });
            } else {
                toast.error(response.data.message || 'Failed to book appointment');
            }
        } catch (error: any) {
            console.error('Booking failed:', error);
            toast.error(error.response?.data?.detail || 'An error occurred while booking');
        } finally {
            setLoading(false);
        }
    };

    return (
        <MainLayout>
            <div className="w-full bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8 min-h-[85vh] text-gray-900">
                <div className="max-w-3xl mx-auto">
                    <div className="mb-8 text-center">
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Calendar className="w-6 h-6 text-gray-800" />
                        </div>
                        <h1 className="text-3xl font-extrabold tracking-tight text-black mb-2">
                            Book an Appointment
                        </h1>
                        <p className="text-gray-500 font-medium">
                            Fill in your details to schedule a call or meeting.
                        </p>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-xl shadow-xs overflow-hidden">
                        <form onSubmit={handleSubmit} className="p-6 md:p-8 flex flex-col gap-6">

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-2 flex items-center gap-2">
                                        <User size={14} /> Full Name <span className="text-red-500 text-sm">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        required
                                        value={formData.name}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all text-sm font-medium"
                                        placeholder="John Doe"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-2 flex items-center gap-2">
                                        <Mail size={14} /> Email Address <span className="text-red-500 text-sm">*</span>
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        required
                                        pattern=".*@gmail\.com$"
                                        title="Email must be a @gmail.com address"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all text-sm font-medium"
                                        placeholder="john@gmail.com"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-2 flex items-center gap-2">
                                        <Phone size={14} /> Phone Number <span className="text-red-500 text-sm">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="phone"
                                        required
                                        pattern="[0-9]{10}"
                                        title="Phone number must be exactly 10 digits"
                                        maxLength={11}
                                        value={formData.phone}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all text-sm font-medium"
                                        placeholder="5550000000"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-2 flex items-center gap-2">
                                        <Clock size={14} /> Date <span className="text-red-500 text-sm">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        name="appointment_datetime"
                                        required
                                        min={today}
                                        value={formData.appointment_datetime}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all text-sm font-medium"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-2 flex items-center gap-2">
                                        <Bot size={14} /> Agent ID <span className="text-red-500 text-sm">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="agent_id"
                                        required
                                        value={formData.agent_id}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all text-sm font-medium"
                                        placeholder="ag_123456"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-2 flex items-center gap-2">
                                        <Building size={14} /> Organization ID <span className="text-red-500 text-sm">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="org_id"
                                        required
                                        value={formData.org_id}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all text-sm font-medium"
                                        placeholder="org_7890"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-2 flex items-center gap-2">
                                    <FileText size={14} /> Notes <span className="text-red-500 text-sm">*</span>
                                </label>
                                <textarea
                                    name="notes"
                                    required
                                    rows={3}
                                    value={formData.notes}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-black focus:ring-1 focus:ring-black outline-none transition-all text-sm font-medium resize-none"
                                    placeholder="Any additional information..."
                                ></textarea>
                            </div>

                            <div className="pt-4 border-t border-gray-200">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full md:w-auto px-8 py-3 bg-black text-white rounded-lg font-bold text-sm tracking-wide transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mx-auto"
                                >
                                    {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                                    Confirm Appointment
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
