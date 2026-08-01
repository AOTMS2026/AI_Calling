import { useState, useEffect } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import { Phone, Clock, Plus, Loader2, X, Trash2, Calendar, PhoneCall, Bot, Play, Pause, MoreHorizontal } from 'lucide-react';
import { apiClient } from '../api/client';
import toast from 'react-hot-toast';

export function InboundCampaign() {
    const [loading, setLoading] = useState(true);
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [agents, setAgents] = useState<any[]>([]);
    const [phoneNumbers, setPhoneNumbers] = useState<any[]>([]);
    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        phoneNumber: '',
        agentId: '',
        timezone: 'Asia/Kolkata',
        maxConcurrent: 1,
        budgetCredits: 'Unlimited',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        windowStartHour: '09',
        windowStartMin: '00',
        windowEndHour: '18',
        windowEndMin: '00',
        activeDays: [1, 2, 3, 4, 5] // Mon to Fri
    });

    const refreshData = async () => {
        setLoading(true);
        try {
            // Fetch own active phone numbers (Simulated fetching Ravan AI inventory via available/bought)
            // But since Ravan doesn't have a GET inventory, we will just use a hardcoded/mocked list or fetch from our DB.
            // Assuming we fetch from our own api if needed, logic falls back correctly.
            const agentsRes = await apiClient.get('/agents/');
            setAgents(agentsRes.data?.data || []);

            try {
                const numbersRes = await apiClient.get('/api/ravan/phone-numbers/my');
                const rawNumbers = numbersRes.data?.data || [];
                if (rawNumbers && rawNumbers.length > 0) {
                    setPhoneNumbers(rawNumbers.map((n: any) => ({
                        phone_number: n.phone_number,
                        label: n.status === 'Active' ? 'Indian Telephony' : 'Regional Number'
                    })));
                } else {
                    setPhoneNumbers([
                        { phone_number: '+918031449343', label: 'Indian Telephony' },
                        { phone_number: '+14155550100', label: 'US Regional' }
                    ]);
                }
            } catch (numErr) {
                console.error("Numbers fetch err, using fallbacks:", numErr);
                setPhoneNumbers([
                    { phone_number: '+918031449343', label: 'Indian Telephony' },
                    { phone_number: '+14155550100', label: 'US Regional' }
                ]);
            }

            const routesRes = await apiClient.get('/api/ravan/inbound-campaigns');
            setCampaigns(routesRes.data?.data || []);
        } catch (err) {
            console.error("Failed to fetch inbound data", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshData();
    }, []);

    const toggleDay = (dayIndex: number) => {
        setFormData(prev => {
            const days = prev.activeDays.includes(dayIndex) ? prev.activeDays.filter(d => d !== dayIndex) : [...prev.activeDays, dayIndex];
            return { ...prev, activeDays: days.sort() };
        });
    };

    const handleCreateRoute = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.phoneNumber || !formData.agentId) {
            toast.error("Please select a phone number and an AI agent to route to.");
            return;
        }

        const match = agents.find(a => a.id === formData.agentId);
        const agentName = match ? (match.agentName || match.name || 'Unknown Agent') : 'Unknown Agent';

        setSubmitting(true);
        try {
            const payload = {
                phone_number: formData.phoneNumber,
                agent_id: formData.agentId,
                agent_name: agentName,
                timezone: formData.timezone,
                max_concurrent: formData.maxConcurrent,
                budget_credits: formData.budgetCredits,
                start_date: formData.startDate,
                end_date: formData.endDate,
                window_start: `${formData.windowStartHour}:${formData.windowStartMin}`,
                window_end: `${formData.windowEndHour}:${formData.windowEndMin}`,
                active_days: formData.activeDays.join(',')
            };

            await apiClient.post('/api/ravan/inbound-campaigns/create', payload);
            toast.success("Inbound route established successfully!");

            // Reset slightly
            setFormData(prev => ({
                ...prev,
                phoneNumber: '',
                agentId: ''
            }));
            refreshData();
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.detail || "Failed to create inbound route");
        } finally {
            setSubmitting(false);
        }
    };

    const handlePause = async (id: number, currentStatus: string) => {
        const action = currentStatus === 'Live' ? 'pause' : 'resume';
        const tid = toast.loading(`${action === 'pause' ? 'Pausing' : 'Resuming'} route...`);
        try {
            await apiClient.post(`/api/ravan/inbound-campaigns/${id}/${action}`);
            toast.success(`Route ${action}d successfully.`, { id: tid });
            refreshData();
        } catch (err) {
            toast.error(`Failed to ${action} route.`, { id: tid });
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm("Are you sure you want to delete this routing rule?")) return;
        const tid = toast.loading("Deleting route...");
        try {
            await apiClient.delete(`/api/ravan/inbound-campaigns/${id}`);
            toast.success("Route deleted successfully.", { id: tid });
            refreshData();
        } catch (err) {
            toast.error("Failed to delete route.", { id: tid });
        }
    };

    return (
        <MainLayout>
            <div className="p-8 max-w-7xl mx-auto w-full space-y-8">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">Inbound Campaign</h1>
                    <p className="text-[13px] font-medium text-gray-500 mt-1">Link a phone number to an AI agent — all calls to that number will be handled automatically.</p>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <form onSubmit={handleCreateRoute} className="p-6 md:p-8 space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                            <div>
                                <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-widest mb-3">Incoming Calls To</label>
                                <select
                                    value={formData.phoneNumber}
                                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                                    required
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[13px] font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all"
                                >
                                    <option value="" disabled>Select Number...</option>
                                    {phoneNumbers.map((p, i) => (
                                        <option key={i} value={p.phone_number}>{p.phone_number} {p.label ? `- ${p.label}` : ''}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex items-center justify-center shrink-0 mt-6 hidden md:flex">
                                <div className="text-gray-300">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
                                </div>
                            </div>

                            <div className="md:col-start-2 md:row-start-1">
                                <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-widest mb-3">Routed To Agent</label>
                                <select
                                    value={formData.agentId}
                                    onChange={(e) => setFormData({ ...formData, agentId: e.target.value })}
                                    required
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[13px] font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all"
                                >
                                    <option value="" disabled>Select Agent...</option>
                                    {agents.map((a, i) => (
                                        <option key={i} value={a.id}>{a.agentName || a.name || 'Unnamed Agent'}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-gray-100">
                            <h3 className="text-sm font-bold text-gray-800 mb-6 flex items-center gap-2"><Calendar size={16} className="text-blue-500" /> Schedule & Rules</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Timezone <span className="text-red-500">*</span></label>
                                        <select
                                            value={formData.timezone}
                                            onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-[13px] font-semibold text-gray-700"
                                        >
                                            <option value="Asia/Kolkata">Asia/Kolkata</option>
                                            <option value="UTC">UTC</option>
                                            <option value="America/New_York">America/New_York</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Budget (Credits)</label>
                                        <input
                                            type="text"
                                            value={formData.budgetCredits}
                                            onChange={(e) => setFormData({ ...formData, budgetCredits: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-[13px] font-semibold text-gray-700"
                                        />
                                        <p className="text-[10px] font-medium text-gray-400 mt-1">New calls are rejected once spend reaches the cap. Blank = unlimited.</p>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">End Date</label>
                                        <div className="relative">
                                            <input
                                                type="date"
                                                value={formData.endDate}
                                                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-[13px] font-semibold text-gray-700"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Call Window End</label>
                                        <div className="flex gap-3">
                                            <select
                                                value={formData.windowEndHour}
                                                onChange={(e) => setFormData({ ...formData, windowEndHour: e.target.value })}
                                                className="flex-1 bg-gray-50 border border-gray-200 rounded-lg py-2.5 px-3 text-[13px] font-semibold"
                                            >
                                                {Array.from({ length: 24 }).map((_, i) => <option key={i} value={i.toString().padStart(2, '0')}>{i.toString().padStart(2, '0')}</option>)}
                                            </select>
                                            <div className="flex items-center text-gray-400 font-bold">:</div>
                                            <select
                                                value={formData.windowEndMin}
                                                onChange={(e) => setFormData({ ...formData, windowEndMin: e.target.value })}
                                                className="flex-1 bg-gray-50 border border-gray-200 rounded-lg py-2.5 px-3 text-[13px] font-semibold"
                                            >
                                                {['00', '15', '30', '45'].map(m => <option key={m} value={m}>{m}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Active Days</label>
                                        <div className="flex gap-2">
                                            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, ix) => {
                                                // map presentation to 1-7 ISO or 0-6 JS. Mon is 1.
                                                const idxVal = ix + 1 === 7 ? 0 : ix + 1;
                                                const isActive = formData.activeDays.includes(idxVal);
                                                return (
                                                    <button
                                                        type="button"
                                                        key={ix}
                                                        onClick={() => toggleDay(idxVal)}
                                                        className={`px-3 py-1.5 text-[11px] font-bold rounded-lg border transition-all ${isActive ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white border-gray-200 text-gray-400 hover:bg-gray-50'}`}
                                                    >
                                                        {day}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        <p className="text-[10px] font-medium text-gray-400 mt-2">Leave call window blank to allow calls at any time.</p>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Max Concurrent Calls</label>
                                        <input
                                            type="number"
                                            min={1}
                                            max={30}
                                            value={formData.maxConcurrent}
                                            onChange={(e) => setFormData({ ...formData, maxConcurrent: parseInt(e.target.value) || 1 })}
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-[13px] font-semibold text-gray-700"
                                        />
                                        <p className="text-[10px] font-medium text-gray-400 mt-1">Range: 1 - 30</p>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Start Date</label>
                                        <div className="relative">
                                            <input
                                                type="date"
                                                value={formData.startDate}
                                                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-[13px] font-semibold text-gray-700"
                                            />
                                        </div>
                                    </div>
                                    <div className="opacity-0 pointer-events-none h-16 hidden md:block"></div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Call Window Start</label>
                                        <div className="flex gap-3">
                                            <select
                                                value={formData.windowStartHour}
                                                onChange={(e) => setFormData({ ...formData, windowStartHour: e.target.value })}
                                                className="flex-1 bg-gray-50 border border-gray-200 rounded-lg py-2.5 px-3 text-[13px] font-semibold"
                                            >
                                                {Array.from({ length: 24 }).map((_, i) => <option key={i} value={i.toString().padStart(2, '0')}>{i.toString().padStart(2, '0')}</option>)}
                                            </select>
                                            <div className="flex items-center text-gray-400 font-bold">:</div>
                                            <select
                                                value={formData.windowStartMin}
                                                onChange={(e) => setFormData({ ...formData, windowStartMin: e.target.value })}
                                                className="flex-1 bg-gray-50 border border-gray-200 rounded-lg py-2.5 px-3 text-[13px] font-semibold"
                                            >
                                                {['00', '15', '30', '45'].map(m => <option key={m} value={m}>{m}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-gray-100 flex justify-end">
                            <button
                                type="submit"
                                disabled={submitting}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl text-[13px] font-bold shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {submitting ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                                Add Inbound Route
                            </button>
                        </div>
                    </form>
                </div>

                <div className="pt-4">
                    <div className="flex items-center gap-3 mb-6">
                        <h2 className="text-lg font-black text-gray-900">Routing Rules</h2>
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[12px] font-bold rounded-lg border border-gray-200">{campaigns.length}</span>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center p-20">
                            <Loader2 size={32} className="animate-spin text-blue-500" />
                        </div>
                    ) : campaigns.length === 0 ? (
                        <div className="bg-gray-50/50 border border-gray-200 border-dashed rounded-2xl p-12 text-center">
                            <PhoneCall size={32} className="mx-auto text-gray-300 mb-3" />
                            <h3 className="text-[14px] font-bold text-gray-600">No Routing Rules</h3>
                            <p className="text-[12px] font-medium text-gray-400 mt-1">Create an inbound route above to start handling calls.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {campaigns.map((camp) => (
                                <div key={camp.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-visible hover:border-gray-300 hover:shadow-md transition-all group">
                                    <div className="p-5 flex items-center justify-between border-b border-gray-100">
                                        <div className={`flex items-center gap-2 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest ${camp.status === 'Live' ? 'bg-green-50 text-green-600 border border-green-100/50' : 'bg-gray-50 text-gray-500 border border-gray-200'}`}>
                                            <div className={`w-1.5 h-1.5 rounded-full ${camp.status === 'Live' ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                                            {camp.status}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handlePause(camp.id, camp.status)}
                                                className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 text-[11px] font-bold rounded-lg transition-colors border border-amber-200/50 flex flex-row items-center gap-1.5"
                                            >
                                                {camp.status === 'Live' ? <Pause size={12} className="fill-amber-700" /> : <Play size={12} className="fill-amber-700" />}
                                                {camp.status === 'Live' ? 'Pause' : 'Resume'}
                                            </button>

                                            {/* Three dots menu Dropdown implementation (naive hover for demo style) */}
                                            <div className="relative group/menu">
                                                <button className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                                                    <MoreHorizontal size={16} />
                                                </button>
                                                <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-xl shadow-xl border border-gray-100 opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all z-10 py-1">
                                                    <button className="w-full text-left px-4 py-2 text-[12px] font-bold text-gray-600 hover:bg-gray-50 hover:text-gray-900 flex items-center gap-2">
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="M22 4 12 14.01l-3-3" /></svg>
                                                        Complete
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(camp.id)}
                                                        className="w-full text-left px-4 py-2 text-[12px] font-bold text-red-500 hover:bg-red-50 flex items-center gap-2"
                                                    >
                                                        <Trash2 size={14} /> Delete Rule
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-5 space-y-3 bg-gray-50/30">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center shrink-0">
                                                <PhoneCall size={14} className="text-gray-500" />
                                            </div>
                                            <div>
                                                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Inbound Number</div>
                                                <div className="text-[13px] font-black text-gray-900">{camp.phone_number}</div>
                                            </div>
                                        </div>

                                        <div className="pl-4 border-l border-gray-200 ml-3 py-1">
                                            <div className="w-0.5 h-4 bg-gray-200"></div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center shrink-0">
                                                <Bot size={14} className="text-blue-500" />
                                            </div>
                                            <div className="truncate">
                                                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Routed Agent</div>
                                                <div className="text-[13px] font-black text-gray-900 truncate">{camp.agent_name}</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="px-5 py-3 border-t border-gray-100 bg-white rounded-b-2xl flex justify-between items-center group-hover:bg-gray-50 transition-colors cursor-pointer">
                                        <span className="text-[11px] font-bold text-blue-600">View details</span>
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-blue-600"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </MainLayout>
    );
}
