import React, { useState, useEffect } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import { Calendar, Loader2, RefreshCw, Mail, Phone, FileText, Search, X } from 'lucide-react';
import { apiClient } from '../api/client';
import toast from 'react-hot-toast';

export function AdminAppointments() {
    const [appointments, setAppointments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedNote, setSelectedNote] = useState<string | null>(null);

    const fetchAppointments = async () => {
        setLoading(true);
        try {
            const response = await apiClient.get('/api/appointments/');
            if (response.data.success) {
                setAppointments(response.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch appointments:', error);
            toast.error('Failed to load appointment bookings');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAppointments();
    }, []);

    return (
        <MainLayout>
            <div className="w-full bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8 min-h-[85vh] text-gray-900 flex flex-col">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 pb-6 border-b border-gray-200">
                    <div>
                        <h1 className="text-2xl font-extrabold tracking-tight text-black flex items-center gap-3">
                            <Calendar className="text-black" />
                            Appointment Bookings
                        </h1>
                        <p className="text-sm font-medium text-gray-500 mt-1">
                            Manage all customer booked appointments across the platform.
                        </p>
                    </div>
                    <button
                        onClick={fetchAppointments}
                        disabled={loading}
                        className="mt-4 sm:mt-0 flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-sm font-bold text-gray-700 transition-colors"
                    >
                        {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                        Refresh List
                    </button>
                </div>

                <div className="flex-1 overflow-auto">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                            <Loader2 size={32} className="animate-spin mb-4" />
                            <p className="font-bold tracking-widest uppercase text-xs">Syncing Bookings...</p>
                        </div>
                    ) : appointments.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                            <Calendar size={32} className="text-gray-300 mb-4" />
                            <p className="font-bold text-gray-500">No appointments found</p>
                            <p className="text-xs text-gray-400 mt-1">Bookings will appear here once submitted.</p>
                        </div>
                    ) : (
                        <div className="bg-white border border-gray-200 rounded-xl shadow-xs overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50 border-b border-gray-200">
                                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest whitespace-nowrap">ID</th>
                                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Customer</th>
                                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Contact</th>
                                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Date</th>
                                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Action</th>
                                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest max-w-[200px]">Notes</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {appointments.map((appt) => (
                                            <tr key={appt.id} className="hover:bg-gray-50 transition-colors group">
                                                <td className="px-6 py-4 text-sm font-mono text-gray-500">
                                                    {appt.appointment_id || `INT-${appt.id}`}
                                                </td>
                                                <td className="px-6 py-4 text-sm font-bold text-gray-900">
                                                    {appt.name}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col gap-1">
                                                        <span className="flex items-center gap-1.5 text-xs font-medium text-gray-600"><Mail size={12} /> {appt.email}</span>
                                                        <span className="flex items-center gap-1.5 text-xs font-medium text-gray-600"><Phone size={12} /> {appt.phone}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2 text-sm font-semibold text-black bg-gray-100 px-3 py-1.5 rounded-lg w-fit">
                                                        <Calendar size={14} className="text-gray-500" />
                                                        {new Date(appt.appointment_datetime).toLocaleDateString()}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="px-3 py-1 bg-green-50 text-green-700 border border-green-200 rounded-full text-xs font-bold uppercase tracking-widest">
                                                        {appt.action || 'BOOKED'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {appt.notes ? (
                                                        <button
                                                            onClick={() => setSelectedNote(appt.notes)}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-transparent hover:border-blue-200 rounded-lg text-xs font-bold transition-all shadow-sm"
                                                        >
                                                            <Search size={14} /> View
                                                        </button>
                                                    ) : (
                                                        <span className="text-xs text-gray-400 font-medium px-2">--</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Notes Modal Overlay */}
            {selectedNote && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-opacity">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200 border border-gray-100">
                        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50/80">
                            <h3 className="font-bold text-gray-900 flex items-center gap-2 text-sm uppercase tracking-widest">
                                <FileText size={16} className="text-blue-500" />
                                Appointment Note
                            </h3>
                            <button
                                onClick={() => setSelectedNote(null)}
                                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>
                        <div className="p-6 max-h-[60vh] overflow-y-auto">
                            <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed font-medium">
                                {selectedNote}
                            </p>
                        </div>
                        <div className="p-4 border-t border-gray-100 bg-gray-50/80 flex justify-end">
                            <button
                                onClick={() => setSelectedNote(null)}
                                className="px-5 py-2.5 bg-black text-white text-xs font-bold uppercase tracking-widest rounded-lg hover:bg-gray-800 transition-colors shadow-sm"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </MainLayout>
    );
}
