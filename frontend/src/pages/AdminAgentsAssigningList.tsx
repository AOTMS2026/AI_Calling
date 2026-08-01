import { useState, useEffect } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import { Loader2, Search, Database } from 'lucide-react';
import { apiClient } from '../api/client';
import toast from 'react-hot-toast';

export function AdminAgentsAssigningList() {
    const [loading, setLoading] = useState(true);
    const [assignments, setAssignments] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchAssignments = async () => {
        try {
            const res = await apiClient.get('/agents/assigned-agents/list');
            setAssignments(res.data?.data || []);
        } catch (error) {
            console.error("Failed to load assignments", error);
            toast.error("Failed to fetch assigned agents list");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAssignments();
    }, []);

    const filteredAssignments = assignments.filter(a =>
        (a.agent_id && a.agent_id.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (a.customer_name && a.customer_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (a.customer_email && a.customer_email.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <MainLayout>
            <div className="w-full bg-slate-50/50 rounded-2xl p-6 md:p-8 min-h-[85vh] flex flex-col relative">

                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 mb-2">
                            Agents Assigning List
                        </h1>
                        <p className="text-gray-500 text-sm md:text-base max-w-lg">
                            Admin view of all Immediate Agent IDs created by customers and stored in Assign_Agents table.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                        <div className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-xl border border-gray-200 w-full sm:w-80 shadow-sm">
                            <Search className="w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search agent or customer..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="bg-transparent border-none outline-none text-sm font-medium text-gray-700 w-full placeholder-gray-400"
                            />
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-24 flex-1">
                        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-6" />
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Fetching Assignments...</h3>
                    </div>
                ) : filteredAssignments.length > 0 ? (
                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200">
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Customer Details</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Agent ID</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Created At</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredAssignments.map((a, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center shrink-0">
                                                    <span className="text-blue-600 font-bold">{a.customer_name?.charAt(0).toUpperCase() || 'U'}</span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-gray-900">{a.customer_name || `User ID ${a.user_id}`}</span>
                                                    <span className="text-xs font-medium text-gray-500">{a.customer_email || 'No email provided'}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 text-gray-700 rounded-md font-mono text-[11px] font-bold">
                                                <Database size={12} className="text-gray-400" />
                                                {a.agent_id}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-xs font-medium text-gray-500">
                                                {new Date(a.created_at).toLocaleString()}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 px-4 text-center border-2 border-dashed border-gray-200 rounded-2xl bg-white flex-1">
                        <div className="w-16 h-16 bg-gray-50 border border-gray-200 rounded-full flex items-center justify-center mb-4 shadow-sm">
                            <Search size={24} className="text-gray-400" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">No agents assigned yet</h3>
                        <p className="text-gray-500 max-w-sm mx-auto mb-6 text-sm">
                            Customer agent creations logged in Assign_Agents will appear here automatically.
                        </p>
                    </div>
                )}
            </div>
        </MainLayout>
    );
}
