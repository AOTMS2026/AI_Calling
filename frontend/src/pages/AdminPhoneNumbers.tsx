import { useState, useEffect } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import { Phone, Loader2, RefreshCw, User } from 'lucide-react';
import { apiClient } from '../api/client';
import toast from 'react-hot-toast';

export function AdminPhoneNumbers() {
    const [numbers, setNumbers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState<number | null>(null);

    const handleStatusChange = async (id: number, status: string) => {
        setUpdating(id);
        try {
            await apiClient.patch(`/phone-numbers/${id}/status`, { status });
            toast.success(`Phone number status updated to ${status}!`);
            fetchNumbers();
        } catch (error) {
            toast.error("Failed to update status.");
        } finally {
            setUpdating(null);
        }
    };

    const fetchNumbers = async () => {
        setLoading(true);
        try {
            const response = await apiClient.get('/phone-numbers/all');
            setNumbers(response.data.data || []);
        } catch (error) {
            toast.error("Failed to fetch purchased phone numbers.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNumbers();
    }, []);

    return (
        <MainLayout>
            <div className="p-6 max-w-6xl mx-auto w-full flex flex-col items-center">
                <div className="w-full flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Admin - Purchased Numbers</h1>
                        <p className="text-[13px] font-medium text-gray-500 mt-1">Manage all phone numbers purchased by users across the platform.</p>
                    </div>
                    <button
                        onClick={fetchNumbers}
                        disabled={loading}
                        className="bg-gray-900 hover:bg-gray-800 text-white px-5 py-2.5 rounded-xl text-[13px] font-bold shadow-md transition-all flex items-center gap-2 group disabled:opacity-50"
                    >
                        {loading ? <Loader2 size={16} className="animate-spin text-gray-400" /> : <RefreshCw size={16} className="text-gray-400 group-hover:rotate-180 transition-transform duration-500" />}
                        Refresh List
                    </button>
                </div>

                <div className="w-full bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center p-24 text-gray-400">
                            <Loader2 size={32} className="animate-spin mb-4 text-blue-500" />
                            <p className="text-sm font-semibold">Loading purchased numbers...</p>
                        </div>
                    ) : numbers.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-24 text-gray-400">
                            <Phone size={32} className="mb-4 opacity-50" />
                            <p className="text-sm font-semibold">No phone numbers have been purchased yet.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50/50 border-b border-gray-100 text-[11px] uppercase tracking-wider text-gray-500 font-bold">
                                        <th className="px-6 py-4">Phone Number</th>
                                        <th className="px-6 py-4">User</th>

                                        <th className="px-6 py-4">Price</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4">Actions</th>
                                        <th className="px-6 py-4">Purchased At</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {numbers.map((num, i) => (
                                        <tr key={i} className="hover:bg-blue-50/30 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                                                        <Phone size={14} />
                                                    </div>
                                                    <span className="text-[14px] font-black text-gray-900">{num.phone_number}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex flex-col">
                                                    <span className="text-[13px] font-bold text-gray-900">{num.user_name}</span>
                                                    <span className="text-[11px] font-medium text-gray-500">{num.user_email}</span>
                                                </div>
                                            </td>

                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-[13px] font-black text-emerald-600">${num.price}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full ${num.status === 'Activate' || num.status === 'Approve' ? 'bg-emerald-50 text-emerald-600' :
                                                    num.status === 'Pending' ? 'bg-amber-50 text-amber-600' :
                                                        'bg-red-50 text-red-600'
                                                    }`}>
                                                    {num.status === 'Activate' ? 'Active' : num.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <select
                                                        disabled={updating === num.id}
                                                        onChange={(e) => handleStatusChange(num.id, e.target.value)}
                                                        value={num.status === 'Activate' ? 'Approve' : num.status}
                                                        className="text-[11px] font-bold text-gray-700 bg-white border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 cursor-pointer"
                                                    >
                                                        <option value="Pending">Pending</option>
                                                        <option value="Activate">Approve</option>
                                                        <option value="Block">Block</option>
                                                    </select>
                                                    {updating === num.id && <Loader2 size={14} className="animate-spin text-blue-500" />}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-[12px] font-medium text-gray-500">
                                                {new Date(num.created_at).toLocaleString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </MainLayout>
    );
}
