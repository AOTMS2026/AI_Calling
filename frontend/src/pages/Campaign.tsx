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

    const [formData, setFormData] = useState({
        name: '',
        agentId: '019f8637-4ba2-7c85-983f-f3b1d9bc716c', // default existing
        callerId: '+918031449343'
    });

    // Step 2 form states
    const [step, setStep] = useState(1);
    const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
    const [allContacts, setAllContacts] = useState<any[]>([]);
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
    const [contactsSearch, setContactsSearch] = useState('');

    const fetchCampaigns = async () => {
        setLoading(true);
        try {
            const meRes = await apiClient.get('/auth/me');
            const currentUser = meRes.data;
            setUserRole(currentUser.role);

            if (currentUser.role !== 'admin' && !currentUser.ravan_campaign_id) {
                // Customer has no active campaigns mapped
                setCampaigns([]);
                setLoading(false);
                return;
            }

            const res = await apiClient.get('/api/ravan/campaigns');
            const data = res.data?.data;
            if (data && data.length > 0) {
                if (currentUser.role !== 'admin') {
                    const assignedCampaigns = data.filter((c: any) => c.id === currentUser.ravan_campaign_id);
                    setCampaigns(assignedCampaigns);
                } else {
                    setCampaigns(data);
                }
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

    const fetchContacts = async () => {
        try {
            // Using the real campaign ID to simulate the global contacts pool for the demo
            const res = await apiClient.get('/api/ravan/campaigns/019f89f7-ae1d-70c6-b026-5db49f894941/contacts');
            setAllContacts(res.data?.data || []);
        } catch (err) {
            console.error("Failed fetching contacts for builder:", err);
            setAllContacts([]);
        }
    };

    const handleContinueToStep2 = (e: React.FormEvent) => {
        e.preventDefault();
        fetchContacts();
        setStep(2);
    };

    const handleFinalSubmit = async () => {
        setSubmitting(true);
        try {
            // Mapping Step 1 and Step 2 logically to Ravan native payload structure
            const payload = {
                name: formData.name,
                agentId: formData.agentId,
                phoneNumberId: "phone-id-placeholder", // backend proxy will map this dynamically
                fromPhoneNumber: formData.callerId,
                contactIds: selectedContacts,
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
            setStep(1);
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
                    {userRole === 'admin' && (
                        <button
                            onClick={() => setShowModal(true)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-[13px] font-bold shadow-md shadow-blue-600/20 transition-all flex items-center gap-2 tracking-wide"
                        >
                            <Plus size={16} /> New Campaign
                        </button>
                    )}
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
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900">{camp.name}</h3>
                                        <p className="text-xs text-gray-400 font-mono mt-1">{camp.id}</p>
                                    </div>
                                    <span className="px-3 py-1 bg-gray-100 text-gray-600 text-[10px] font-bold rounded-md uppercase tracking-wider">{camp.status || 'Active'}</span>
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
            {showModal && step === 1 && (
                <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">Step 1: Campaign Setup</h2>
                                <p className="text-xs text-gray-500 font-medium mt-1">Configure your AI dialer pipeline.</p>
                            </div>
                            <button onClick={() => { setShowModal(false); setStep(1); }} className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-lg transition-colors">
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleContinueToStep2} className="p-6 space-y-5">
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
                                    <option value="019f8637-4ba2-7c85-983f-f3b1d9bc716c">Primary AI Assistant</option>
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
                                    <option value="+918031449343">IN +91 80314 49343 - Indian Telephony</option>
                                    <option value="+14155550100">US +1 415 555 0100 - US Regional</option>
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

            {showModal && step === 2 && (
                <div className="fixed inset-0 bg-white z-50 flex flex-col animate-in slide-in-from-bottom-8 duration-300">
                    {/* Header */}
                    <div className="h-16 px-8 border-b border-gray-100 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-4">
                            <button onClick={() => setStep(1)} className="text-gray-500 hover:text-gray-900 p-2 border border-gray-200 rounded-lg">
                                <X size={16} /> Back
                            </button>
                            <h2 className="text-xl font-black text-gray-900">Step 2: Campaign Target & Schedule</h2>
                        </div>
                        <button onClick={handleFinalSubmit} disabled={submitting} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-8 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 flex items-center gap-2">
                            {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
                            Launch Campaign
                        </button>
                    </div>

                    <div className="flex-1 overflow-auto bg-gray-50/50 p-6 md:p-8">
                        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">

                            {/* LEFT LIST: CONTACTS */}
                            <div className="lg:col-span-8 bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col h-[700px]">
                                <div className="p-5 border-b border-gray-100 flex flex-col gap-3">
                                    <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                                        <Users size={16} className="text-blue-500" /> Contacts
                                        <span className="text-xs text-gray-400 font-medium">Select who to call</span>
                                    </h3>
                                    <div className="flex items-center gap-3">
                                        <div className="relative flex-1">
                                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <input
                                                value={contactsSearch} onChange={(e) => setContactsSearch(e.target.value)}
                                                placeholder="Search contacts..." className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none transition-colors"
                                            />
                                        </div>
                                        <button
                                            onClick={() => setSelectedContacts(selectedContacts.length === allContacts.length ? [] : allContacts.map(c => c.id))}
                                            className="px-4 py-2.5 border border-gray-200 text-sm font-bold text-gray-600 rounded-xl hover:bg-gray-50 hidden sm:block whitespace-nowrap"
                                        >
                                            {selectedContacts.length === allContacts.length ? 'Deselect All' : 'Select All'}
                                        </button>
                                    </div>
                                    <div className="flex gap-2 pb-1 overflow-x-auto hide-scrollbar">
                                        {["Siddhartha Degree 992", "Guntur_IB 500", "Cyber Security Meta Ad 81"].map((tag, i) => (
                                            <div key={i} className="px-3 py-1.5 border border-gray-200 rounded-lg text-[10px] font-bold text-gray-500 uppercase tracking-widest whitespace-nowrap bg-white hover:bg-gray-50 cursor-pointer">
                                                {tag}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto">
                                    {allContacts.filter(c => (c.name || '').toLowerCase().includes(contactsSearch.toLowerCase())).map((contact, i) => (
                                        <div key={i} onClick={() => setSelectedContacts(prev => prev.includes(contact.id) ? prev.filter(id => id !== contact.id) : [...prev, contact.id])} className={`px-6 py-4 flex items-center gap-4 cursor-pointer transition-colors border-b border-gray-50 ${selectedContacts.includes(contact.id) ? 'bg-blue-50/50' : 'hover:bg-gray-50'}`}>
                                            <input type="checkbox" readOnly checked={selectedContacts.includes(contact.id)} className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer pointer-events-none" />
                                            <div className="flex-1 text-sm font-black text-gray-800">{contact.name || 'Unknown User'}</div>
                                            <div className="text-xs font-bold text-gray-500">{contact.phone}</div>
                                        </div>
                                    ))}
                                </div>
                                <div className="p-4 border-t border-gray-100 flex justify-between items-center bg-gray-50 text-xs font-bold text-gray-500 rounded-b-2xl">
                                    <span>Selected {selectedContacts.length} of {allContacts.length}</span>
                                </div>
                            </div>

                            {/* RIGHT LIST: SETTINGS */}
                            <div className="lg:col-span-4 space-y-6">
                                {/* SUMMARY */}
                                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                                    <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Campaign Summary</h3>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center"><span className="text-xs font-semibold text-gray-500">Name</span><span className="text-sm font-bold text-gray-900">{formData.name || 'Unnamed'}</span></div>
                                        <div className="flex justify-between items-center"><span className="text-xs font-semibold text-gray-500">Agent</span><span className="text-sm font-bold text-gray-900 w-32 text-right truncate">AOTms Admin</span></div>
                                        <div className="flex justify-between items-center"><span className="text-xs font-semibold text-gray-500">Caller ID</span><span className="text-sm font-bold text-gray-900">{formData.callerId}</span></div>
                                        <div className="flex justify-between items-center text-blue-600 pt-2 border-t border-gray-50"><span className="text-xs font-semibold">Contacts Listed</span><span className="text-sm font-black">{selectedContacts.length}</span></div>
                                    </div>
                                </div>

                                {/* SCHEDULING WINDOW */}
                                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                                    <h3 className="text-sm font-bold text-gray-800 mb-5 flex items-center gap-2"><Calendar size={14} className="text-gray-400" /> Call Window</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-2">Timezone</label>
                                            <select value={schedule.timezone} onChange={e => setSchedule({ ...schedule, timezone: e.target.value })} className="w-full border border-gray-200 bg-gray-50 py-2 px-3 rounded-lg text-sm font-bold text-gray-700">
                                                <option value="Asia/Kolkata">Asia/Kolkata</option>
                                                <option value="UTC">UTC</option>
                                            </select>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">From</label>
                                                <input type="time" value={schedule.startTime} onChange={e => setSchedule({ ...schedule, startTime: e.target.value })} className="w-full border border-gray-200 bg-gray-50 p-2 rounded-lg text-sm font-bold text-gray-700 text-center" />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">To</label>
                                                <input type="time" value={schedule.endTime} onChange={e => setSchedule({ ...schedule, endTime: e.target.value })} className="w-full border border-gray-200 bg-gray-50 p-2 rounded-lg text-sm font-bold text-gray-700 text-center" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-2">Active Days</label>
                                            <div className="flex gap-1 justify-between">
                                                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, i) => (
                                                    <button type="button" key={i} onClick={() => toggleDay(i)} className={`flex-1 py-1.5 text-[11px] font-bold rounded box-border tracking-tight border transition-colors ${schedule.days.includes(i) ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white border-gray-200 text-gray-400 hover:bg-gray-50'}`}>
                                                        {d}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* ADVANCED SETTINGS */}
                                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                                    <h3 className="text-sm font-bold text-gray-800 mb-5 flex items-center gap-2"><Settings size={14} className="text-gray-400" /> Advanced Settings</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-2"># Max Concurrent (Channels)</label>
                                            <input type="number" min={1} max={30} value={schedule.maxConcurrent} onChange={e => setSchedule({ ...schedule, maxConcurrent: parseInt(e.target.value) || 1 })} className="w-full border border-gray-200 bg-gray-50 py-2 px-3 rounded-lg text-sm font-bold text-gray-700" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Retries</label>
                                                <input type="number" min={0} value={schedule.retries} onChange={e => setSchedule({ ...schedule, retries: parseInt(e.target.value) || 0 })} className="w-full border border-gray-200 bg-gray-50 p-2 rounded-lg text-sm font-bold text-gray-700 text-center" />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Gap (Min)</label>
                                                <input type="number" min={0} value={schedule.gapMin} onChange={e => setSchedule({ ...schedule, gapMin: parseInt(e.target.value) || 0 })} className="w-full border border-gray-200 bg-gray-50 p-2 rounded-lg text-sm font-bold text-gray-700 text-center" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            )}
        </MainLayout>
    );
}
