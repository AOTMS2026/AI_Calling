import { useState, useEffect } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import { Users, Shield, ShieldCheck, Mail, Phone, Search, Save, Loader2, Bot, CheckCircle2, Copy } from 'lucide-react';
import { apiClient } from '../api/client';
import toast from 'react-hot-toast';

export function UserManagement() {
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [users, setUsers] = useState<any[]>([]);
    const [savingId, setSavingId] = useState<number | null>(null);
    const [successId, setSuccessId] = useState<number | null>(null);

    // Agent Allocation Modal Workflow State
    const [isAllocationModalOpen, setIsAllocationModalOpen] = useState(false);
    const [allocationCustomer, setAllocationCustomer] = useState<number | null>(null);
    const [agentTargetConfig, setAgentTargetConfig] = useState<string>("");
    const [isAllocating, setIsAllocating] = useState(false);

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

    const handleApplySync = async (user: any) => {
        try {
            setSavingId(user.id);
            await apiClient.patch(`/auth/users/${user.id}`, {
                role: user.role,
                ravan_agent_id: user.ravan_agent_id,
                ravan_api_key: user.ravan_api_key,
                ravan_org_id: user.ravan_org_id
            });
            setSuccessId(user.id);
            setTimeout(() => setSuccessId(null), 2000);
        } catch (error) {
            console.error("Failed to sync user attributes", error);
            alert("Failed to synchronize user attributes securely.");
        } finally {
            setSavingId(null);
        }
    };

    const updateLocalUser = (id: number, key: string, value: string) => {
        setUsers(users.map(u => u.id === id ? { ...u, [key]: value } : u));
    };

    const filteredUsers = users.filter((u) =>
        (u.name && u.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (u.phone && u.phone.includes(searchQuery)) ||
        (u.identity_hash && u.identity_hash.includes(searchQuery))
    );

    const handleModalAllocate = async () => {
        if (!allocationCustomer || !agentTargetConfig) return;
        setIsAllocating(true);
        const targetUser = users.find(u => u.id === allocationCustomer);
        try {
            await apiClient.patch(`/auth/users/${allocationCustomer}`, {
                role: targetUser?.role || 'customer',
                ravan_agent_id: agentTargetConfig,
                ravan_api_key: targetUser?.ravan_api_key,
                ravan_org_id: targetUser?.ravan_org_id
            });
            // instantly structurally sync global lists natively mapping dynamically back!
            setUsers(users.map(u => u.id === allocationCustomer ? { ...u, ravan_agent_id: agentTargetConfig } : u));
            toast.success("Successfully allocated Ravan Agents to customer payload!");
            setIsAllocationModalOpen(false);
            setAllocationCustomer(null);
            setAgentTargetConfig("");
        } catch (error) {
            console.error("Allocation mapping sync failed", error);
            toast.error("Failed to aggressively bind Agent Node explicitly.");
        } finally {
            setIsAllocating(false);
        }
    };

    return (
        <MainLayout>
            <div className="w-full bg-white rounded-3xl p-6 md:p-8 min-h-[85vh] border border-gray-200 shadow-sm flex flex-col relative">

                {/* Header Action Row */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 pb-6 border-b border-gray-100 gap-4">
                    <div>
                        <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                            <ShieldCheck className="w-8 h-8 text-red-500" />
                            Global Authorization
                        </h1>
                        <p className="text-sm font-medium text-gray-500 mt-2">Manage customer onboarding, roles, and Ravan UUID allocations natively.</p>
                    </div>

                    <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-xl border border-gray-200 w-full lg:w-80">
                        <Search className="w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by name, email, or identity hash..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-transparent border-none outline-none text-sm font-medium text-gray-700 w-full placeholder-gray-400"
                        />
                        <button onClick={() => setIsAllocationModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm border border-blue-500 transition-all shrink-0">
                            <Bot className="w-4 h-4" />
                            Agents
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-32 flex-1">
                        <Loader2 className="w-12 h-12 text-red-500 animate-spin" />
                        <h3 className="text-lg font-bold text-gray-900 mt-6 tracking-tight">Syncing Database...</h3>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6 pb-10">
                        {filteredUsers.length === 0 && (
                            <div className="text-center py-10 text-gray-500 font-medium">No users found matching your search.</div>
                        )}
                        {filteredUsers.map((u) => (
                            <div key={u.id} className="bg-white border border-gray-200 rounded-2xl p-5 md:p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col xl:flex-row xl:items-center justify-between gap-6">

                                <div className="flex items-start gap-4 flex-1">
                                    <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center shrink-0">
                                        <Users className="w-5 h-5 text-gray-600" />
                                    </div>
                                    <div className="w-full">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-[16px] font-bold text-gray-900 tracking-tight">{u.name}</h3>
                                            {u.role === 'admin' && <span className="bg-red-50 text-red-600 text-[10px] uppercase font-bold tracking-widest px-2 py-1 rounded-md">Admin</span>}
                                        </div>
                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2">
                                            <span className="text-[13px] font-medium text-gray-500 flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> {u.email}</span>
                                            <span className="text-[13px] font-medium text-gray-500 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> {u.phone}</span>
                                        </div>
                                        <div className="mt-3">
                                            <div className="inline-flex items-center gap-2 px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg group">
                                                <Shield className="w-3.5 h-3.5 text-gray-400" />
                                                <span className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-widest">
                                                    ID Hash: <span className="text-blue-600">{u.identity_hash ? `${u.identity_hash.substring(0, 16)}...` : 'PENDING'}</span>
                                                </span>
                                                {u.identity_hash && (
                                                    <button
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(u.identity_hash);
                                                            toast.success("Identity hash copied to clipboard!", { style: { fontSize: '12px', fontWeight: 'bold' } });
                                                        }}
                                                        className="text-gray-400 hover:text-blue-600 transition-colors opacity-0 group-hover:opacity-100 p-0.5 ml-1"
                                                        title="Copy full hash"
                                                    >
                                                        <Copy className="w-3 h-3" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-3 w-full xl:w-auto xl:flex-1">
                                    <div className="flex flex-col md:flex-row gap-4 w-full">
                                        <div className="w-full xl:w-64">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block pl-1">Target Ravan Agent UUID</label>
                                            <div className="relative">
                                                <Bot className="w-4 h-4 text-blue-500 absolute left-3 top-1/2 -translate-y-1/2" />
                                                <input
                                                    type="text"
                                                    value={u.ravan_agent_id || ''}
                                                    onChange={(e) => updateLocalUser(u.id, "ravan_agent_id", e.target.value)}
                                                    placeholder="Unassigned (Empty)"
                                                    className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono text-[12px]"
                                                />
                                            </div>
                                        </div>

                                        <div className="w-full md:w-32">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block pl-1">Role</label>
                                            <select
                                                value={u.role || 'customer'}
                                                onChange={(e) => updateLocalUser(u.id, "role", e.target.value)}
                                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all cursor-pointer"
                                            >
                                                <option value="customer">Customer</option>
                                                <option value="admin">Administrator</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => handleApplySync(u)}
                                    disabled={savingId === u.id}
                                    className={`w-full md:w-auto flex items-center justify-center gap-2 px-5 py-2.5 xl:mt-5 rounded-xl shadow-sm transition-colors text-sm font-bold shrink-0 ${successId === u.id ? 'bg-emerald-500 text-white' : 'bg-gray-900 hover:bg-black text-white'}`}
                                >
                                    {savingId === u.id ? <Loader2 className="w-4 h-4 animate-spin" /> : (successId === u.id ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />)}
                                    {successId === u.id ? 'Synced' : 'Apply Sync'}
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Structured Interactive Allocation Overlay Block */}
            {isAllocationModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-gray-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 flex flex-col">

                        {/* Header Area */}
                        <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex flex-col items-center">
                            <div className="w-12 h-12 bg-blue-100 border border-blue-200 rounded-full flex items-center justify-center mb-4 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                                <Bot className="w-6 h-6 text-blue-600" />
                            </div>
                            <h2 className="text-xl font-black text-gray-900 tracking-tight text-center">Allocate Node Capacity</h2>
                        </div>

                        {/* Interactive Data Block */}
                        <div className="p-6 flex flex-col gap-6">

                            {/* Input Field (Number of agents or Agent IDs) */}
                            <div>
                                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2 block pl-1">Agent Config Profile Maps (UUIDs)</label>
                                <input
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[13px] font-mono font-medium text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    placeholder="Enter Ravan Agent UUIDs / Config Map..."
                                    value={agentTargetConfig}
                                    onChange={(e) => setAgentTargetConfig(e.target.value)}
                                />
                                <p className="text-[11px] text-gray-400 mt-2 font-medium px-1">Define explicit active node UUID arrays bound matching physical `.env` scale capacity bounds.</p>
                            </div>

                            {/* Assign Customer List selection mapping structurally */}
                            <div>
                                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2 block pl-1">Select Customer Map Target</label>
                                <select
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[14px] font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer appearance-none"
                                    value={allocationCustomer || ''}
                                    onChange={(e) => setAllocationCustomer(Number(e.target.value))}
                                >
                                    <option value="" disabled className="text-gray-400">-- Choose target client --</option>
                                    {users.filter(u => u.role !== 'admin').map((u) => (
                                        <option key={u.id} value={u.id}>{u.name} (UUID: {u.identity_hash ? u.identity_hash.substring(0, 8) : 'Pending'})</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Control Actions Native Bound Sync */}
                        <div className="p-6 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row gap-3">
                            <button
                                onClick={() => setIsAllocationModalOpen(false)}
                                className="w-full sm:w-1/2 py-3 bg-white border border-gray-300 rounded-xl text-gray-700 font-bold shadow-sm hover:bg-gray-50 transition-colors"
                            >
                                Cancel Allocation
                            </button>
                            <button
                                onClick={handleModalAllocate}
                                disabled={!allocationCustomer || !agentTargetConfig || isAllocating}
                                className={`w-full sm:w-1/2 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm transition-colors ${!allocationCustomer || !agentTargetConfig || isAllocating ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                            >
                                {isAllocating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Bot className="w-5 h-5" />}
                                Assign Capacity Map
                            </button>
                        </div>

                    </div>
                </div>
            )}
        </MainLayout >
    );
}
