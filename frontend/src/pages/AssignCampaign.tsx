import React, { useState, useEffect } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import { Target, Loader2, Search, Plus, Edit2, Trash2, Key, CheckCircle } from 'lucide-react';
import { apiClient } from '../api/client';
import toast from 'react-hot-toast';

export function AssignCampaign() {
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState<any[]>([]);

    // UI States
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Form States
    const [allocationCustomer, setAllocationCustomer] = useState<number | null>(null);
    const [campaignUUID, setCampaignUUID] = useState<string>("");
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
        setCampaignUUID("");
        setIsModalOpen(true);
    };

    const openEditModal = (u: any) => {
        setIsEditing(true);
        setAllocationCustomer(u.id);
        setCampaignUUID(u.ravan_campaign_id || "");
        setIsModalOpen(true);
    };

    const handleModalAllocate = async () => {
        if (!allocationCustomer || !campaignUUID.trim()) return;
        setIsAllocating(true);
        try {
            await apiClient.patch(`/auth/users/${allocationCustomer}`, {
                ravan_campaign_id: campaignUUID.trim()
            });

            // instantly structurally sync global lists natively mapping dynamically back!
            setUsers(users.map(u => u.id === allocationCustomer ? { ...u, ravan_campaign_id: campaignUUID.trim() } : u));
            toast.success(isEditing ? "Successfully updated Campaign binding!" : "Successfully bound Campaign to User!");
            setIsModalOpen(false);
        } catch (error) {
            console.error("Allocation mapping sync failed", error);
            toast.error("Failed to dynamically bound Campaign ID.");
        } finally {
            setIsAllocating(false);
        }
    };

    const handleDeleteAllocation = async (userId: number) => {
        if (!window.confirm("Are you sure you want to revoke this customer's campaign assignment?")) return;

        try {
            await apiClient.patch(`/auth/users/${userId}`, {
                ravan_campaign_id: ""
            });
            setUsers(users.map(u => u.id === userId ? { ...u, ravan_campaign_id: null } : u));
            toast.success("Campaign allocation permanently revoked.");
        } catch (e) {
            toast.error("Failed to revoke allocation");
        }
    };

    // Derived states
    const assignedUsers = users.filter(u => u.role !== 'admin' && u.ravan_campaign_id);
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
                            Assigned Campaigns
                        </h1>
                        <p className="text-gray-500 text-sm md:text-base max-w-lg">
                            Monitor and manage your active customer campaign bindings.
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
                            <Plus size={18} /> Add-Campaign
                        </button>
                    </div>
                </div>

                {/* Horizontal Grid Fitting */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-24 flex-1">
                        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-6" />
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Fetching Assignments...</h3>
                    </div>
                ) : filteredUsers.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredUsers.map(u => (
                            <div key={u.id} className="bg-white border border-gray-200 rounded-[20px] p-5 shadow-sm hover:shadow-md transition-all flex flex-col group">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center shrink-0">
                                            <span className="text-indigo-600 font-black text-lg">{u.name?.charAt(0).toUpperCase()}</span>
                                        </div>
                                        <div className="flex flex-col overflow-hidden">
                                            <h3 className="text-base font-bold text-gray-900 truncate">{u.name}</h3>
                                            <span className="text-[11px] font-mono text-gray-400 truncate mt-0.5">{u.email}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gray-50/80 rounded-xl p-4 flex flex-col gap-3 mb-5 border border-gray-100/50">
                                    <div className="flex flex-col gap-1.5">
                                        <div className="flex items-center gap-2 text-gray-500">
                                            <Target className="w-4 h-4 text-indigo-500" />
                                            <span className="text-xs font-bold uppercase tracking-wider">Campaign UUID</span>
                                        </div>
                                        <span className="text-xs font-mono font-black text-gray-900 break-all bg-white border border-gray-100 p-2 rounded-lg">{u.ravan_campaign_id}</span>
                                    </div>

                                    <div className="flex items-center gap-1.5 text-[10px] text-green-600 font-bold uppercase tracking-widest mt-1">
                                        <CheckCircle size={12} /> Live Target User
                                    </div>
                                </div>

                                {/* Bottom Actions Matrix */}
                                <div className="flex items-center gap-2 mt-auto pt-2 border-t border-gray-100 opacity-80 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => openEditModal(u)}
                                        className="flex-1 flex items-center justify-center gap-1.5 py-2 hover:bg-blue-50 text-gray-600 hover:text-blue-600 rounded-lg transition-colors text-xs font-bold"
                                    >
                                        <Edit2 className="w-3.5 h-3.5" /> Edit UUID
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
                            <Target size={24} className="text-gray-400" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">No active assignments</h3>
                        <p className="text-gray-500 max-w-sm mx-auto mb-6 text-sm">
                            You have not assigned any campaign configurations to your customers yet. Click '+ Add-Campaign' above to begin.
                        </p>
                    </div>
                )}

                {/* Interactive Allocation Overlay Block */}
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-gray-900/60 backdrop-blur-sm">
                        <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 flex flex-col relative animate-in fade-in zoom-in-95 duration-200">

                            <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex flex-col items-center relative">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
                                <div className="w-12 h-12 bg-blue-100 border border-blue-200 rounded-full flex items-center justify-center mb-3 shadow-inner mt-2">
                                    <Target className="w-6 h-6 text-blue-600" />
                                </div>
                                <h2 className="text-xl font-black text-gray-900 tracking-tight text-center">{isEditing ? 'Modify Target Campaign' : 'Assign Target User'}</h2>
                            </div>

                            <div className="p-6 flex flex-col gap-6">
                                <div>
                                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2 block pl-1">Target User</label>
                                    <select
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer appearance-none"
                                        value={allocationCustomer || ''}
                                        onChange={(e) => setAllocationCustomer(Number(e.target.value))}
                                        disabled={isEditing}
                                    >
                                        <option value="" disabled className="text-gray-400">-- Choose target client --</option>
                                        {users.filter(u => u.role !== 'admin').map((u) => (
                                            <option key={u.id} value={u.id}>{u.name} (UUID: {u.identity_hash ? u.identity_hash.substring(0, 8) : 'Pending'})</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2 block pl-1">Campaign UUID</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-mono"
                                        placeholder="e.g. 019f89f7-ae1d-70c6-b026-5db49f894941"
                                        value={campaignUUID}
                                        onChange={(e) => setCampaignUUID(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="p-6 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row gap-3">
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="w-full sm:w-1/2 py-2.5 bg-white border border-gray-300 rounded-xl text-gray-700 text-sm font-bold shadow-sm hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleModalAllocate}
                                    disabled={!allocationCustomer || !campaignUUID.trim() || isAllocating}
                                    className={`w-full sm:w-1/2 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-colors ${!allocationCustomer || !campaignUUID.trim() || isAllocating ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                                >
                                    {isAllocating ? <Loader2 className="w-4 h-4 animate-spin" /> : (isEditing ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />)}
                                    Continue
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </MainLayout>
    );
}

