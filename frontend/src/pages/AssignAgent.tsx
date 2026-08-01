import { useState, useEffect } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import { Bot, Loader2, Search, Plus, Edit2, Trash2, User, Coins } from 'lucide-react';
import { apiClient } from '../api/client';
import toast from 'react-hot-toast';

export function AssignAgent() {
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState<any[]>([]);

    // UI States
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Form States
    const [allocationCustomer, setAllocationCustomer] = useState<number | null>(null);
    const [agentTargetConfig, setAgentTargetConfig] = useState<string>("");
    const [agentUUIDConfig, setAgentUUIDConfig] = useState<string>("");
    const [creditsConfig, setCreditsConfig] = useState<string>("");
    const [isAllocating, setIsAllocating] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    const fetchUsers = async () => {
        try {
            const res = await apiClient.get('/auth/users');
            setUsers(res.data);
        } catch (error) {
            console.error("Failed to load users", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const openCreateModal = () => {
        setIsEditing(false);
        setAllocationCustomer(null);
        setAgentTargetConfig("");
        setAgentUUIDConfig("");
        setCreditsConfig("");
        setIsModalOpen(true);
    };

    const openEditModal = (u: any) => {
        setIsEditing(true);
        setAllocationCustomer(u.id);
        setAgentTargetConfig(u.agent_quota ? String(u.agent_quota) : "");
        setAgentUUIDConfig(u.ravan_agent_id || "");
        setCreditsConfig(u.allocated_credits ? String(u.allocated_credits) : "");
        setIsModalOpen(true);
    };

    const handleModalAllocate = async () => {
        if (!allocationCustomer) return;
        setIsAllocating(true);
        try {
            const parsedQuota = parseInt(agentTargetConfig) || 0;
            const parsedCredits = parseFloat(creditsConfig) || 0.0;

            await apiClient.patch(`/auth/users/${allocationCustomer}`, {
                agent_quota: parsedQuota,
                allocated_credits: parsedCredits,
                ravan_agent_id: agentUUIDConfig.trim() || undefined
            });

            // instantly structurally sync global lists natively mapping dynamically back!
            setUsers(users.map(u => u.id === allocationCustomer ? { ...u, agent_quota: parsedQuota, allocated_credits: parsedCredits, ravan_agent_id: agentUUIDConfig.trim() || null } : u));
            toast.success(isEditing ? "Successfully updated allocations!" : "Successfully assigned capacity!");
            setIsModalOpen(false);
        } catch (error) {
            console.error("Allocation mapping sync failed", error);
            toast.error("Failed to dynamically bound Agents quota.");
        } finally {
            setIsAllocating(false);
        }
    };

    const handleDeleteAllocation = async (userId: number) => {
        if (!window.confirm("Are you sure you want to revoke this customer's assignments?")) return;

        try {
            await apiClient.patch(`/auth/users/${userId}`, {
                agent_quota: 0,
                allocated_credits: 0.0,
                ravan_agent_id: ""
            });
            setUsers(users.map(u => u.id === userId ? { ...u, agent_quota: 0, allocated_credits: 0, ravan_agent_id: null } : u));
            toast.success("Allocations permanently revoked.");
        } catch (e) {
            toast.error("Failed to revoke allocation");
        }
    };

    // Derived states
    const assignedUsers = users.filter(u => u.role !== 'admin' && (u.agent_quota > 0 || u.allocated_credits > 0));
    const filteredUsers = assignedUsers.filter(u =>
        (u.name && u.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <MainLayout>
            <div className="w-full bg-slate-50/50 rounded-2xl p-6 md:p-8 min-h-[85vh] flex flex-col relative">

                {/* Header Navbar Actions */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 mb-2">
                            Assigned Web Agents / Calls History
                        </h1>
                        <p className="text-gray-500 text-sm md:text-base max-w-lg">
                            Monitor and assign agent allocations scaling call history routing.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                        <div className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-xl border border-gray-200 w-full sm:w-80 shadow-sm">
                            <Search className="w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search assigned customers..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="bg-transparent border-none outline-none text-sm font-medium text-gray-700 w-full placeholder-gray-400"
                            />
                        </div>

                        <button
                            onClick={openCreateModal}
                            className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2 shrink-0"
                        >
                            <Plus size={18} /> Assign Agent Profile
                        </button>
                    </div>
                </div>

                {/* Horizontal 3 Grid Fitting */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-24 flex-1">
                        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-6" />
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Fetching Allocations...</h3>
                    </div>
                ) : filteredUsers.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredUsers.map(u => (
                            <div key={u.id} className="bg-white border border-gray-200 rounded-[20px] p-5 shadow-sm hover:shadow-md transition-all flex flex-col group">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center shrink-0">
                                            <span className="text-blue-600 font-black text-lg">{u.name?.charAt(0).toUpperCase()}</span>
                                        </div>
                                        <div className="flex flex-col overflow-hidden">
                                            <h3 className="text-base font-bold text-gray-900 truncate">{u.name}</h3>
                                            <span className="text-[11px] font-mono text-gray-400 truncate mt-0.5">{u.email}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gray-50/80 rounded-xl p-4 flex flex-col gap-3 mb-5 border border-gray-100/50">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-gray-500">
                                            <Bot className="w-4 h-4 text-gray-400" />
                                            <span className="text-xs font-bold uppercase tracking-wider">Agents Quota Allowed</span>
                                        </div>
                                        <span className="text-sm font-black text-gray-900">{u.agent_quota || 0} Nodes</span>
                                    </div>
                                </div>

                                {/* Bottom Actions Matrix */}
                                <div className="flex items-center gap-2 mt-auto pt-2 border-t border-gray-100 opacity-80 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => openEditModal(u)}
                                        className="flex-1 flex items-center justify-center gap-1.5 py-2 hover:bg-blue-50 text-gray-600 hover:text-blue-600 rounded-lg transition-colors text-xs font-bold"
                                    >
                                        <Edit2 className="w-3.5 h-3.5" /> Edit Limit
                                    </button>
                                    <div className="w-px h-4 bg-gray-200"></div>
                                    <button
                                        onClick={() => handleDeleteAllocation(u.id)}
                                        className="flex-1 flex items-center justify-center gap-1.5 py-2 hover:bg-red-50 text-gray-600 hover:text-red-600 rounded-lg transition-colors text-xs font-bold"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" /> Revoke
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 px-4 text-center border-2 border-dashed border-gray-200 rounded-2xl bg-white flex-1">
                        <div className="w-16 h-16 bg-gray-50 border border-gray-200 rounded-full flex items-center justify-center mb-4 shadow-sm">
                            <Search size={24} className="text-gray-400" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">No active assignments</h3>
                        <p className="text-gray-500 max-w-sm mx-auto mb-6 text-sm">
                            You have not assigned any agent configurations or credits to your customers yet. Click 'Assign Capacity' above to begin.
                        </p>
                    </div>
                )}

                {/* Interactive Allocation Overlay Block */}
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-gray-900/40 backdrop-blur-sm">
                        <div className="bg-white rounded-[20px] shadow-2xl w-full max-w-[400px] overflow-hidden border border-gray-100 flex flex-col relative animate-in fade-in zoom-in-95 duration-200">

                            {/* Minimal Professional Header */}
                            <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-4 relative">
                                <div className="absolute top-0 left-0 w-full h-1 bg-blue-600"></div>
                                <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center border border-blue-100 shrink-0">
                                    <Bot className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900 tracking-tight leading-tight">{isEditing ? 'Update Quota' : 'Assign Quota'}</h2>
                                    <p className="text-[11px] font-medium text-gray-500 mt-0.5">Define node capacity limits per user.</p>
                                </div>
                            </div>

                            {/* Form Input Area */}
                            <div className="p-6 flex flex-col gap-5">
                                {/* Customer Selection */}
                                <div>
                                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 block">Target Customer</label>
                                    <select
                                        className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer appearance-none shadow-sm"
                                        value={allocationCustomer || ''}
                                        onChange={(e) => setAllocationCustomer(Number(e.target.value))}
                                        disabled={isEditing}
                                    >
                                        <option value="" disabled className="text-gray-400">--- Select Client ---</option>
                                        {users.filter(u => u.role !== 'admin').map((u) => (
                                            <option key={u.id} value={u.id}>{u.name} (UUID: {u.ravan_agent_id ? u.ravan_agent_id.substring(0, 8) : 'Pending'})</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid grid-cols-1 gap-4">
                                    <div>
                                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 block">Agent Quota Allowed</label>
                                        <input
                                            type="number"
                                            min="0"
                                            className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-semibold text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono shadow-sm"
                                            placeholder="E.g. 5 nodes"
                                            value={agentTargetConfig}
                                            onChange={(e) => setAgentTargetConfig(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Actions Mapping */}
                            <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-end gap-3">
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-5 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg text-sm font-bold shadow-sm hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleModalAllocate}
                                    disabled={!allocationCustomer || !agentTargetConfig || isAllocating}
                                    className={`px-5 py-2 rounded-lg font-bold text-sm min-w-[120px] shadow-sm transition-colors flex items-center justify-center gap-2 ${!allocationCustomer || !agentTargetConfig || isAllocating ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'}`}
                                >
                                    {isAllocating ? <Loader2 className="w-4 h-4 animate-spin" /> : (isEditing ? 'Save Limits' : 'Lock Capacity')}
                                </button>
                            </div>

                        </div>
                    </div>
                )}


            </div>
        </MainLayout>
    );
}
