import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '../components/layout/MainLayout';
import { Phone, Clock, TrendingUp, Settings, MoreHorizontal, Plus, Loader2, X, Users, Search, Calendar } from 'lucide-react';
import { apiClient } from '../api/client';
import toast from 'react-hot-toast';

export function Campaign() {
    const navigate = useNavigate();
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [userRole, setUserRole] = useState('customer');
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        agentId: '',
        callerId: ''
    });

    const [availableAgents, setAvailableAgents] = useState<any[]>([]);
    const [availableNumbers, setAvailableNumbers] = useState<any[]>([]);
    const [uploadingContacts, setUploadingContacts] = useState(false);

    const [schedule, setSchedule] = useState({
        timezone: 'Asia/Kolkata',
        startTime: '09:00',
        endTime: '17:00',
        days: [1, 2, 3, 4, 5],
        maxConcurrent: 1,
        retries: 2,
        gapMin: 30
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const handleOutsideClick = () => {
            setActiveDropdown(null);
        };
        window.addEventListener('click', handleOutsideClick);
        return () => window.removeEventListener('click', handleOutsideClick);
    }, []);

    const fetchCampaigns = async () => {
        setLoading(true);
        try {
            const meRes = await apiClient.get('/auth/me');
            const currentUser = meRes.data;
            setUserRole(currentUser.role);

            if (!currentUser) {
                setCampaigns([]);
                setLoading(false);
                return;
            }

            const res = await apiClient.get('/api/ravan/campaigns');
            const data = res.data?.data;
            if (data && data.length > 0) {
                setCampaigns(data);
            } else {
                setCampaigns([]);
            }
        } catch (error) {
            console.error(error);
            setCampaigns([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCampaigns();
    }, []);

    const handleStartCampaign = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        const tid = toast.loading("Starting campaign...");
        try {
            await apiClient.post(`/api/ravan/campaigns/${id}/start`);
            toast.success("Campaign triggered successfully!", { id: tid });
            fetchCampaigns(); // refresh statuses naturally 
        } catch (err) {
            console.error(err);
            toast.error("Failed to start campaign", { id: tid });

            // Set local state status to 'failed' for this campaign to show status change immediately!
            setCampaigns(prev => prev.map(c => c.id === id ? { ...c, status: 'Failed' } : c));
        }
    };

    const handlePauseCampaign = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        const tid = toast.loading("Pausing campaign...");
        try {
            await apiClient.post(`/api/ravan/campaigns/${id}/pause`);
            toast.success("Campaign paused successfully!", { id: tid });
            fetchCampaigns(); // sync new status 
        } catch (err) {
            console.error(err);
            toast.error("Failed to pause campaign", { id: tid });
        }
    };

    const handleResumeCampaign = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        const tid = toast.loading("Resuming campaign...");
        try {
            await apiClient.post(`/api/ravan/campaigns/${id}/resume`);
            toast.success("Campaign resumed successfully!", { id: tid });
            fetchCampaigns();
        } catch (err) {
            console.error(err);
            toast.error("Failed to resume campaign", { id: tid });
        }
    };

    const handleDeleteCampaign = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!window.confirm("Are you sure you want to permanently delete this Campaign? This action is irreversible.")) {
            return;
        }

        const tid = toast.loading("Deleting campaign...");
        try {
            await apiClient.delete(`/api/ravan/campaigns/${id}`);
            toast.success("Campaign successfully deleted", { id: tid });
            fetchCampaigns();
        } catch (err) {
            console.error(err);
            toast.error("Failed to delete campaign", { id: tid });
        }
    };



    const fetchConfigData = async () => {
        try {
            const [agentsRes, numbersRes] = await Promise.all([
                apiClient.get('/agents/'),
                apiClient.get('/api/ravan/phone-numbers/my')
            ]);
            setAvailableAgents(agentsRes.data?.data || []);

            // Render successfully activated numbers logically 
            const nums = (numbersRes.data?.data || []).filter((n: any) => n.status === "Activate" || n.status === "Active");
            setAvailableNumbers(nums);

            if (agentsRes.data?.data?.length > 0) setFormData(p => ({ ...p, agentId: agentsRes.data.data[0].id }));
            if (nums.length > 0) setFormData(p => ({ ...p, callerId: nums[0].phone_number }));
        } catch (e) {
            console.error(e);
        }
    };

    const handleOpenModal = () => {
        setShowModal(true);
        fetchConfigData();
    };

    const handleFinalSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            // Mapping unified Campaign Payload securely via defaults
            const payload = {
                name: formData.name,
                agentId: formData.agentId,
                phoneNumberId: "phone-id-placeholder", // backend proxy will map this dynamically
                fromPhoneNumber: formData.callerId,
                contactIds: [],
                schedule: {
                    timezone: schedule.timezone,
                    windowStart: schedule.startTime,
                    windowEnd: schedule.endTime,
                    windowDays: schedule.days,
                    maxConcurrent: schedule.maxConcurrent,
                    retryAttempts: schedule.retries,
                    retryGapMin: schedule.gapMin
                }
            };

            await apiClient.post('/api/ravan/campaigns/create', payload);
            toast.success(`Campaign "${formData.name}" dispatched natively!`);
            setShowModal(false);
            setFormData({ name: '', agentId: '019f85d4-0222-759d-939e-0f6b91065c94', callerId: '+918031449343' });
            fetchCampaigns();
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.detail || "Failed to create campaign");
        } finally {
            setSubmitting(false);
        }
    };

    const toggleDay = (dayIndex: number) => {
        setSchedule(prev => {
            const days = prev.days.includes(dayIndex) ? prev.days.filter(d => d !== dayIndex) : [...prev.days, dayIndex];
            return { ...prev, days: days.sort() };
        });
    };

    return (
        <MainLayout>
            <div className="p-8 max-w-7xl mx-auto w-full">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Outbound Campaigns</h1>
                        <p className="text-[13px] font-medium text-gray-500 mt-1">{userRole === 'admin' ? 'Manage and track your automated AI dialing campaigns.' : 'View your assigned AI outbound dialing capacity.'}</p>
                    </div>
                    <button
                        onClick={handleOpenModal}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-[13px] font-bold shadow-md shadow-blue-600/20 transition-all flex items-center gap-2 tracking-wide"
                    >
                        <Plus size={16} /> New Campaign
                    </button>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center p-24">
                        <Loader2 size={32} className="animate-spin text-blue-500" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {campaigns.map((camp, i) => (
                            <div
                                key={i}
                                onClick={() => navigate(`/campaigns/outbound/${camp.id}`)}
                                className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer group"
                            >
                                <div className="flex justify-between items-start mb-4 relative">
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900">{camp.name}</h3>
                                        <p className="text-xs text-gray-400 font-mono mt-1">{camp.id}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`px-3 py-1 text-[10px] font-bold rounded-md uppercase tracking-wider ${camp.status?.toLowerCase() === 'failed'
                                                ? 'bg-red-100 text-red-600 border border-red-200'
                                                : camp.status?.toLowerCase() === 'running' || camp.status?.toLowerCase() === 'active'
                                                    ? 'bg-green-100 text-green-600 border border-green-200'
                                                    : 'bg-gray-100 text-gray-600 border border-gray-200'
                                            }`}>
                                            {camp.status || 'Active'}
                                        </span>

                                        {/* Three Dots Actions Menu */}
                                        <div className="relative">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setActiveDropdown(activeDropdown === camp.id ? null : camp.id);
                                                }}
                                                className="p-1 hover:bg-gray-100 rounded transition-colors text-gray-500 hover:text-gray-700"
                                            >
                                                <MoreHorizontal size={18} />
                                            </button>

                                            {activeDropdown === camp.id && (
                                                <div className="absolute right-0 mt-1 w-36 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-30 animate-in fade-in slide-in-from-top-1 duration-150">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setActiveDropdown(null);
                                                            navigate(`/campaigns/outbound/${camp.id}?tab=settings`);
                                                        }}
                                                        className="w-full text-left px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                                                    >
                                                        <Settings size={12} />
                                                        View Settings
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setActiveDropdown(null);
                                                            handleDeleteCampaign(e, camp.id);
                                                        }}
                                                        className="w-full text-left px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2 border-t border-gray-100"
                                                    >
                                                        <X size={12} />
                                                        Delete
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 py-3 px-4 border border-gray-100 rounded-xl mb-5 text-sm font-semibold text-gray-600 bg-gray-50/50">
                                    <div className="flex items-center gap-2"><Phone size={14} className="text-blue-500" /> {camp.fromPhoneNumber || 'unassigned'}</div>
                                    <div className="w-px h-4 bg-gray-200"></div>
                                    <div className="flex items-center gap-2 text-gray-400"><Clock size={14} /> {camp.createdAt ? new Date(camp.createdAt).toLocaleDateString() : new Date().toLocaleDateString()}</div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 mb-6">
                                    <div className="bg-gray-50/80 p-4 rounded-xl border border-gray-100">
                                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total</div>
                                        <div className="text-2xl font-black text-gray-900">{camp.contactStats?.total || 0}</div>
                                    </div>
                                    <div className="bg-green-50/50 p-4 rounded-xl border border-green-50">
                                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1"><TrendingUp size={12} className="text-green-500" /> Success Rate</div>
                                        <div className="text-2xl font-black text-green-500">{camp.contactStats?.successful ? Math.round((camp.contactStats.successful / Math.max(camp.contactStats.total, 1)) * 100) : 0}%</div>
                                    </div>
                                    <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-50">
                                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Contacted</div>
                                        <div className="text-2xl font-black text-blue-600">{camp.contactStats?.contacted || 0}</div>
                                    </div>
                                    <div className="bg-gray-50/80 p-4 rounded-xl border border-gray-100">
                                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Pending</div>
                                        <div className="text-2xl font-black text-gray-900">{camp.contactStats?.pending || 0}</div>
                                    </div>
                                </div>

                                <div className="flex gap-2 items-center justify-between w-full">
                                    <div className="flex gap-2">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); navigate(`/campaigns/outbound/${camp.id}?tab=settings`); }}
                                            className="p-2.5 border border-gray-200 bg-white rounded-lg hover:bg-gray-50 transition-colors group/set"
                                            title="Settings"
                                        >
                                            <Settings size={16} className="text-gray-500 group-hover/set:text-gray-700" />
                                        </button>
                                    </div>

                                    {camp.status?.toLowerCase() === 'completed' ? (
                                        <button
                                            onClick={(e) => e.stopPropagation()}
                                            disabled
                                            className="px-4 py-2 bg-gray-100/50 text-gray-500 text-xs font-bold rounded-lg transition-colors border border-gray-200 cursor-not-allowed"
                                        >
                                            Completed
                                        </button>
                                    ) : camp.status?.toLowerCase() === 'running' || camp.status?.toLowerCase() === 'active' ? (
                                        <button
                                            onClick={(e) => handlePauseCampaign(e, camp.id)}
                                            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
                                        >
                                            Pause Phase
                                        </button>
                                    ) : camp.status?.toLowerCase() === 'paused' ? (
                                        <button
                                            onClick={(e) => handleResumeCampaign(e, camp.id)}
                                            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
                                        >
                                            Resume Campaign
                                        </button>
                                    ) : (
                                        <button
                                            onClick={(e) => handleStartCampaign(e, camp.id)}
                                            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
                                        >
                                            Start Campaign
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* CAMPAIGN CREATION WORKFLOW */}
            {showModal && (
                <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">Create New Campaign</h2>
                                <p className="text-xs text-gray-500 font-medium mt-1">Configure your AI dialer pipeline.</p>
                            </div>
                            <button onClick={() => { setShowModal(false); }} className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-lg transition-colors">
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleFinalSubmit} className="p-6 space-y-5">
                            <div>
                                <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-widest mb-2">Campaign Name <span className="text-red-500">*</span></label>
                                <input
                                    required
                                    type="text"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g. Lead Follow-up Q3"
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-widest mb-2">AI Agent Assignment <span className="text-red-500">*</span></label>
                                <select
                                    required
                                    value={formData.agentId}
                                    onChange={e => setFormData({ ...formData, agentId: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all appearance-none"
                                >
                                    <option value="" disabled>Select an Agent</option>
                                    {availableAgents.map((ag: any) => (
                                        <option key={ag.id} value={ag.id}>{ag.agentName || 'Unnamed Agent'}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-widest mb-2">Caller ID Number <span className="text-red-500">*</span></label>
                                <select
                                    required
                                    value={formData.callerId}
                                    onChange={e => setFormData({ ...formData, callerId: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all appearance-none"
                                >
                                    <option value="" disabled>Select a Purchased Number</option>
                                    {availableNumbers.map((num: any) => (
                                        <option key={num.id} value={num.phone_number}>{num.phone_number} - Ravan.ai Mobile</option>
                                    ))}
                                </select>
                            </div>

                            <div className="pt-4 border-t border-gray-50 flex justify-end">
                                <button type="submit" className="w-full py-3 bg-gray-900 hover:bg-black text-white rounded-xl text-sm font-bold shadow-md transition-all">
                                    Continue to Step 2
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}


        </MainLayout>
    );
}
