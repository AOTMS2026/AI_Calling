import { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { MainLayout } from '../components/layout/MainLayout';
import { apiClient } from '../api/client';
import { ArrowLeft, Loader2, Phone, Calendar, Activity, CheckCircle, XCircle, AlertCircle, BarChart2, TrendingUp, Settings, Users, Search, Filter, Tag, ShieldAlert, Edit2, X, Clock, Trash2, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

export function CampaignDetail() {
    const { id } = useParams<{ id: string }>();
    const [searchParams, setSearchParams] = useSearchParams();
    const currentTab = searchParams.get('tab') || 'overview';

    const [campaign, setCampaign] = useState<any>(null);
    const [contacts, setContacts] = useState<any[]>([]);

    const [loading, setLoading] = useState(true);
    const [contactsLoading, setContactsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editContact, setEditContact] = useState<any>(null);
    const [editLoading, setEditLoading] = useState(false);

    // Settings Form State
    const [settingsForm, setSettingsForm] = useState({
        name: '',
        windowStart: '09:00',
        windowEnd: '17:00',
        timezone: 'Asia/Kolkata',
        maxConcurrent: 1,
        retryAttempts: 0,
        retryGapMin: 30,
        windowDays: [1, 2, 3, 4, 5]
    });
    const [savingSettings, setSavingSettings] = useState(false);

    useEffect(() => {
        const fetchCampaignDetail = async () => {
            setLoading(true);
            try {
                const response = await apiClient.get(`/api/ravan/campaigns/${id}`);
                const data = response.data?.data;
                setCampaign(data);
                if (data) {
                    setSettingsForm({
                        name: data.name || '',
                        windowStart: data.schedule?.windowStart || '09:00',
                        windowEnd: data.schedule?.windowEnd || '17:00',
                        timezone: data.schedule?.timezone || 'Asia/Kolkata',
                        maxConcurrent: data.schedule?.maxConcurrent || 1,
                        retryAttempts: data.schedule?.retryAttempts || 0,
                        retryGapMin: data.schedule?.retryGapMin || 30,
                        windowDays: data.schedule?.windowDays || [1, 2, 3, 4, 5]
                    });
                }
            } catch (error) {
                const mock = {
                    id: id,
                    name: "Testing",
                    status: "Completed",
                    executionStatus: "finished",
                    fromPhoneNumber: "+918031449343",
                    contactStats: { total: 81, contacted: 81, successful: 64, failed: 12, noAnswer: 5, pending: 0, inProgress: 0 },
                    schedule: { timezone: "Asia/Kolkata", start: "2026-07-24T09:00:00Z", end: "2026-07-26T18:00:00Z", maxConcurrent: 5, retryAttempts: 3 },
                    createdAt: "2026-07-20T10:00:00Z"
                };
                setCampaign(mock);
                setSettingsForm({
                    name: mock.name,
                    windowStart: '09:00',
                    windowEnd: '17:00',
                    timezone: mock.schedule.timezone,
                    maxConcurrent: mock.schedule.maxConcurrent,
                    retryAttempts: mock.schedule.retryAttempts,
                    retryGapMin: 30,
                    windowDays: [1, 2, 3, 4, 5]
                });
            } finally {
                setLoading(false);
            }
        };

        const fetchCampaignContacts = async () => {
            setContactsLoading(true);
            try {
                const response = await apiClient.get(`/api/ravan/campaigns/${id}/contacts`);
                setContacts(response.data?.data || []);
            } catch (error) {
                setContacts([]);
            } finally {
                setContactsLoading(false);
            }
        };

        if (id) {
            fetchCampaignDetail();
            fetchCampaignContacts();
        }
    }, [id]);

    const handleEditContactFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editContact) return;

        setEditLoading(true);
        try {
            const payload = {
                name: `${editContact.first_name || ''} ${editContact.last_name || ''}`.trim(),
                first_name: editContact.first_name,
                last_name: editContact.last_name,
                email: editContact.email,
                phone: editContact.phone,
                company: editContact.company
            };

            await apiClient.patch(`/api/ravan/contacts/${editContact.contactId || editContact.id}`, payload);
            toast.success("Contact successfully updated!");
            setIsEditModalOpen(false);

            const response = await apiClient.get(`/api/ravan/campaigns/${id}/contacts`);
            setContacts(response.data?.data || []);

        } catch (err: any) {
            console.error("Failed to update contact:", err);
            toast.error(err.response?.data?.detail || "Failed to edit contact payload");
        } finally {
            setEditLoading(false);
        }
    };

    const handleSettingsSave = async () => {
        setSavingSettings(true);
        try {
            const payload = {
                name: settingsForm.name,
                schedule: {
                    windowStart: settingsForm.windowStart,
                    windowEnd: settingsForm.windowEnd,
                    timezone: settingsForm.timezone,
                    maxConcurrent: settingsForm.maxConcurrent,
                    retryAttempts: settingsForm.retryAttempts,
                    retryGapMin: settingsForm.retryGapMin,
                    windowDays: settingsForm.windowDays
                }
            };
            await apiClient.patch(`/api/ravan/campaigns/${id}`, payload);
            toast.success("Campaign configuration successfully saved to Ravan.ai");
            setCampaign({ ...campaign, name: settingsForm.name, schedule: { ...campaign.schedule, ...payload.schedule } });
        } catch (error: any) {
            console.error("Failed to save settings:", error);
            toast.error(error.response?.data?.detail || "Failed to update campaign configuration");
        } finally {
            setSavingSettings(false);
        }
    };

    const toggleDay = (dayIndex: number) => {
        setSettingsForm(prev => {
            const days = prev.windowDays.includes(dayIndex)
                ? prev.windowDays.filter(d => d !== dayIndex)
                : [...prev.windowDays, dayIndex].sort();
            return { ...prev, windowDays: days };
        });
    };

    const filteredContacts = contacts.filter(c =>
        (c.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.phone || '').includes(searchQuery)
    );

    if (loading) {
        return (
            <MainLayout>
                <div className="flex h-full items-center justify-center">
                    <Loader2 size={32} className="animate-spin text-blue-500" />
                </div>
            </MainLayout>
        );
    }

    if (!campaign) {
        return (
            <MainLayout>
                <div className="p-8 text-center text-gray-500">Campaign not found.</div>
            </MainLayout>
        )
    }

    const { contactStats, schedule } = campaign;
    const successRate = contactStats?.successful ? Math.round((contactStats.successful / Math.max(contactStats.total, 1)) * 100) : 0;

    return (
        <MainLayout>
            <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">

                <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link to="/campaigns/outbound" className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-sm text-gray-500">
                            <ArrowLeft size={18} />
                        </Link>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                                {campaign.name}
                                <span className={`px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest rounded-md ${campaign.status?.toLowerCase() === 'completed' ? 'bg-gray-100 text-gray-600' : 'bg-green-100 text-green-700'}`}>
                                    {campaign.status || 'Active'}
                                </span>
                            </h1>
                            <p className="text-xs text-gray-400 font-mono mt-0.5">{campaign.id}</p>
                        </div>
                    </div>
                </div>

                {/* Tabs Top Level Nav */}
                <div className="flex border-b border-gray-200 mb-6 gap-6 px-2">
                    <button onClick={() => setSearchParams({ tab: 'overview' })} className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${currentTab === 'overview' ? 'border-teal-500 text-teal-600' : 'border-transparent text-gray-400 hover:text-gray-600'} transition-all`}><Activity size={14} /> Overview</button>
                    <button onClick={() => setSearchParams({ tab: 'contacts' })} className={`flex items-center gap-2 pb-3 text-sm font-bold border-b-2 transition-colors ${currentTab === 'contacts' ? 'border-teal-500 text-teal-600' : 'border-transparent text-gray-400 hover:text-gray-600'} transition-all`}>
                        <Users size={14} /> Contacts 1 <span className={`text-[10px] px-2 py-0.5 rounded-full ${currentTab === 'contacts' ? 'bg-teal-100 text-teal-700' : 'bg-gray-100 text-gray-500'}`}>{contacts.length}</span>
                    </button>
                    <button onClick={() => setSearchParams({ tab: 'settings' })} className={`flex items-center gap-1.5 pb-3 text-sm font-bold border-b-2 transition-colors ${currentTab === 'settings' ? 'border-teal-500 text-teal-600' : 'border-transparent text-gray-400 hover:text-gray-600'} transition-all`}>
                        <Settings size={14} /> Settings
                    </button>
                </div>

                {currentTab === 'overview' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in zoom-in-95 duration-200">

                        <div className="lg:col-span-2 space-y-6">
                            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sm:p-6">
                                <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-6 border-b border-gray-50 pb-4">
                                    <BarChart2 size={16} className="text-blue-500" /> Pipeline Statistics
                                </h2>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total</p>
                                        <p className="text-2xl sm:text-3xl font-black text-gray-900">{contactStats?.total || 0}</p>
                                    </div>
                                    <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                                        <p className="text-[10px] font-bold text-green-600 uppercase tracking-widest mb-1 flex items-center gap-1"><TrendingUp size={12} /> Success Rate</p>
                                        <p className="text-2xl sm:text-3xl font-black text-green-600">{successRate}%</p>
                                    </div>
                                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                                        <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1">Contacted</p>
                                        <p className="text-2xl sm:text-3xl font-black text-blue-600">{contactStats?.contacted || 0}</p>
                                    </div>
                                    <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                                        <p className="text-[10px] font-bold text-orange-600 uppercase tracking-widest mb-1">Pending</p>
                                        <p className="text-2xl sm:text-3xl font-black text-orange-600">{contactStats?.pending || 0}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
                                    <div className="p-4 border border-gray-100 rounded-xl flex items-center gap-3">
                                        <CheckCircle size={24} className="text-green-500 opacity-20" />
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase">Successful</p>
                                            <p className="text-lg font-bold text-gray-800">{contactStats?.successful || 0}</p>
                                        </div>
                                    </div>
                                    <div className="p-4 border border-gray-100 rounded-xl flex items-center gap-3">
                                        <XCircle size={24} className="text-red-500 opacity-20" />
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase">Failed</p>
                                            <p className="text-lg font-bold text-gray-800">{contactStats?.failed || 0}</p>
                                        </div>
                                    </div>
                                    <div className="p-4 border border-gray-100 rounded-xl flex items-center gap-3">
                                        <AlertCircle size={24} className="text-yellow-500 opacity-20" />
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase">No Answer</p>
                                            <p className="text-lg font-bold text-gray-800">{contactStats?.noAnswer || 0}</p>
                                        </div>
                                    </div>
                                    <div className="p-4 border border-gray-100 rounded-xl flex items-center gap-3">
                                        <Activity size={24} className="text-blue-500 opacity-20" />
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase">In Progress</p>
                                            <p className="text-lg font-bold text-gray-800">{contactStats?.inProgress || 0}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                                <h2 className="text-sm font-bold text-gray-800 p-5 border-b border-gray-100 flex items-center gap-2">
                                    <Settings size={16} className="text-gray-400" /> Configuration
                                </h2>
                                <div className="divide-y divide-gray-50">
                                    <div className="p-4 flex items-center justify-between">
                                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Caller ID</span>
                                        <div className="flex items-center gap-1.5 text-sm font-bold text-gray-800">
                                            <Phone size={13} className="text-blue-500" /> {campaign.fromPhoneNumber || 'Unassigned'}
                                        </div>
                                    </div>
                                    <div className="p-4 flex items-center justify-between">
                                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Execution</span>
                                        <span className="text-sm font-bold text-gray-800 capitalize">{campaign.executionStatus || 'Unknown'}</span>
                                    </div>
                                    <div className="p-4 flex items-center justify-between">
                                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Timezone</span>
                                        <span className="text-sm font-bold text-gray-800">{schedule?.timezone || 'UTC'}</span>
                                    </div>
                                    <div className="p-4 flex flex-col gap-2">
                                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Schedule Engine</span>
                                        <div className="flex flex-col gap-1.5 text-xs text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100">
                                            <div className="flex justify-between"><span className="font-semibold">Start:</span> <span>{schedule?.start ? new Date(schedule.start).toLocaleString() : 'Immediate'}</span></div>
                                            <div className="flex justify-between"><span className="font-semibold">Max Concurrent:</span> <span>{schedule?.maxConcurrent || 0} channels</span></div>
                                            <div className="flex justify-between"><span className="font-semibold">Retries:</span> <span>{schedule?.retryAttempts || 0} attempts</span></div>
                                        </div>
                                    </div>
                                    <div className="p-4 bg-gray-50 flex items-center justify-between">
                                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest flex items-center gap-1.5"><Calendar size={12} /> Creation Date</span>
                                        <span className="text-[11px] font-bold text-gray-800">{campaign.createdAt ? new Date(campaign.createdAt).toLocaleString() : 'N/A'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {currentTab === 'contacts' && (
                    <div className="animate-in fade-in zoom-in-95 duration-200">
                        <div className="mt-0 bg-white p-4 rounded-t-2xl border border-gray-200 border-b-0 flex flex-col md:flex-row items-center justify-between gap-4 shrink-0">
                            <div className="flex items-center gap-2 text-sm font-bold text-gray-700 px-2">
                                <Users size={16} className="text-blue-500" />
                                Campaign Contacts <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full text-xs">{contacts.length}</span>
                            </div>
                            <div className="flex items-center gap-3 w-full md:w-auto">
                                <div className="relative w-full md:w-64 tracking-wide">
                                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search Name or Phone..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 focus:bg-white transition-all"
                                    />
                                </div>
                                <button className="p-2.5 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors">
                                    <Filter size={16} />
                                </button>
                            </div>
                        </div>

                        <div className="bg-white border border-gray-200 rounded-b-2xl shadow-sm overflow-hidden flex flex-col relative mb-8">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse relative">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr>
                                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">Name</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">Phone Number</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">Attempts</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">Status</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">Duration</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">Tags</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap text-right">Last Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {contactsLoading ? (
                                            <tr>
                                                <td colSpan={7} className="p-16 text-center">
                                                    <Loader2 size={32} className="animate-spin text-blue-500 mx-auto mb-4" />
                                                    <p className="text-sm font-semibold text-gray-400">Loading campaign contacts...</p>
                                                </td>
                                            </tr>
                                        ) : filteredContacts.length === 0 ? (
                                            <tr>
                                                <td colSpan={7} className="p-16 text-center">
                                                    <Users size={32} className="text-gray-300 mx-auto mb-4 opacity-50" />
                                                    <p className="text-sm font-semibold text-gray-400">No contacts physically mapped in this campaign.</p>
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredContacts.map((contact, idx) => (
                                                <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors group">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs tracking-tight uppercase">
                                                                {contact.name ? contact.name.substring(0, 2) : 'UK'}
                                                            </div>
                                                            <div className="flex flex-col max-w-[120px] sm:max-w-xs">
                                                                <span
                                                                    className="text-xs sm:text-[13px] font-black text-gray-900 group-hover:text-blue-600 transition-colors truncate block"
                                                                    title={contact.name || 'Unknown'}
                                                                >
                                                                    {contact.name || 'Unknown'}
                                                                </span>
                                                                <span className="text-[10px] text-gray-400 font-medium truncate block" title={contact.email || ''}>
                                                                    {contact.email || ''}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center gap-2">
                                                            <Phone size={12} className="text-gray-400" />
                                                            <span className="text-[13px] font-bold text-gray-600 tracking-tight">{contact.phone}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex flex-col justify-center">
                                                            <span className="text-sm font-black text-gray-800">{contact.attempt_count || 0}</span>
                                                            {contact.next_retry_at && <span className="text-[9px] text-orange-500 font-bold uppercase">Retry Scheduled</span>}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-widest rounded-md flex inline-flex items-center gap-1.5 w-fit
                                                        ${contact.status === 'contacted' || contact.status === 'successful' ? 'bg-green-50 text-green-700' :
                                                                contact.status === 'failed' ? 'bg-red-50 text-red-600' :
                                                                    contact.status === 'no_answer' ? 'bg-orange-50 text-orange-600' :
                                                                        contact.status === 'pending' ? 'bg-gray-100 text-gray-600' :
                                                                            'bg-gray-100 text-gray-600'}`}
                                                        >
                                                            {contact.error_message && <ShieldAlert size={10} />}
                                                            {contact.status || 'pending'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className="text-[13px] font-bold text-gray-600">
                                                            {contact.call_duration_sec ? `${Math.floor(contact.call_duration_sec / 60)}m ${contact.call_duration_sec % 60}s` : '-'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center">
                                                            {contact.tags && contact.tags.length > 0 ? (
                                                                <details className="group relative">
                                                                    <summary className="list-none cursor-pointer flex items-center gap-1.5 px-2.5 py-1 bg-blue-50/50 hover:bg-blue-100/50 border border-blue-100 text-blue-600 text-[10px] font-bold rounded-lg uppercase tracking-wider transition-colors">
                                                                        <Tag size={10} /> View Tags ({contact.tags.length})
                                                                    </summary>
                                                                    <div className="absolute left-0 top-full mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-xl p-3 z-50 flex flex-col gap-2">
                                                                        {contact.tags.map((tag: string, i: number) => (
                                                                            <span key={i} className="flex items-center gap-1.5 px-2 py-1 bg-gray-50 text-gray-600 text-[10px] font-bold rounded uppercase tracking-wider border border-gray-100">
                                                                                <Tag size={10} className="text-gray-400" /> {tag}
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                </details>
                                                            ) : (
                                                                <span className="text-[10px] text-gray-300 font-medium bg-gray-50 border border-gray-100 px-2.5 py-1 rounded-lg uppercase tracking-wide">None</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                                        <div className="flex flex-col items-end gap-1.5">
                                                            <span className="text-[11px] text-gray-900 font-bold">
                                                                {contact.last_attempted_at ? new Date(contact.last_attempted_at).toLocaleDateString() : 'Never'}
                                                            </span>
                                                            <div className="flex items-center gap-2">
                                                                {contact.last_attempted_at && (
                                                                    <span className="text-[10px] text-gray-400 font-medium">
                                                                        {new Date(contact.last_attempted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                    </span>
                                                                )}
                                                                <button
                                                                    onClick={() => {
                                                                        const splitName = (contact.name || '').split(' ');
                                                                        setEditContact({
                                                                            ...contact,
                                                                            first_name: contact.first_name || splitName[0] || '',
                                                                            last_name: contact.last_name || splitName.slice(1).join(' ') || '',
                                                                            company: contact.company || ''
                                                                        });
                                                                        setIsEditModalOpen(true);
                                                                    }}
                                                                    className="p-1.5 bg-gray-50 border border-gray-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 text-gray-400 rounded-md transition-colors" title="Edit Contact">
                                                                    <Edit2 size={12} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {currentTab === 'settings' && (
                    <div className="animate-in fade-in zoom-in-95 duration-200">
                        <div className="bg-white/50 border border-gray-200 rounded-2xl p-6 md:p-8 mb-6 shadow-sm">
                            <div className="flex flex-col gap-6 max-w-5xl">

                                <h2 className="text-[11px] font-black tracking-widest uppercase text-teal-800 bg-teal-50 border border-teal-100 flex inline-flex w-fit px-2 py-1 items-center gap-1 rounded mb-2">Campaign Information</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                                    <div className="w-full">
                                        <label className="text-[12px] font-semibold text-gray-500 mb-2 block tracking-wide">Campaign Name</label>
                                        <input
                                            type="text"
                                            value={settingsForm.name}
                                            onChange={(e) => setSettingsForm({ ...settingsForm, name: e.target.value })}
                                            className="w-full border border-gray-200 rounded-xl p-3 bg-white text-gray-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-500 transition-colors"
                                        />
                                    </div>
                                    <div className="hidden md:block"></div>
                                    <div className="w-full">
                                        <label className="text-[12px] font-semibold text-gray-500 mb-2 block tracking-wide flex items-center justify-between">Assigned Agent</label>
                                        <input
                                            type="text"
                                            readOnly
                                            disabled
                                            value={campaign.name || 'Testing'}
                                            className="w-full border border-dashed border-gray-200 rounded-xl p-3 bg-gray-50 text-gray-400 text-sm font-medium cursor-not-allowed"
                                        />
                                    </div>
                                    <div className="w-full">
                                        <label className="text-[12px] font-semibold text-gray-500 mb-2 block tracking-wide flex items-center justify-between">Phone Number <span className="text-[9px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded border border-red-100 uppercase tracking-widest opacity-80 cursor-default" title="Disabled in Customer Panel. Assigned via Admin.">🚫 Disabled</span></label>
                                        <input
                                            type="text"
                                            readOnly
                                            disabled
                                            value={campaign.fromPhoneNumber || '+918031449343'}
                                            className="w-full border border-dashed border-gray-200 rounded-xl p-3 bg-gray-50/70 text-gray-400 text-sm font-medium cursor-not-allowed opacity-90"
                                        />
                                        <p className="text-[10px] text-gray-400 font-medium mt-2">Only administrators can modify bound caller numbers centrally.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 mb-6 shadow-sm">
                            <div className="flex flex-col gap-6 max-w-5xl">
                                <h2 className="text-[11px] font-black tracking-widest uppercase text-gray-500 flex inline-flex w-fit items-center gap-1 mb-2">Schedule &amp; Rules</h2>

                                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end w-full">
                                    <div className="col-span-2 md:col-span-1">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Window Start</label>
                                        <div className="relative">
                                            <input
                                                type="time"
                                                value={settingsForm.windowStart}
                                                onChange={(e) => setSettingsForm({ ...settingsForm, windowStart: e.target.value })}
                                                className="w-full border border-gray-200 rounded-lg p-2.5 bg-white text-gray-800 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-500 transition-colors"
                                            />
                                        </div>
                                    </div>
                                    <div className="col-span-2 md:col-span-1">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Window End</label>
                                        <div className="relative">
                                            <input
                                                type="time"
                                                value={settingsForm.windowEnd}
                                                onChange={(e) => setSettingsForm({ ...settingsForm, windowEnd: e.target.value })}
                                                className="w-full border border-gray-200 rounded-lg p-2.5 bg-white text-gray-800 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-500 transition-colors"
                                            />
                                        </div>
                                    </div>

                                    <div className="col-span-2 md:col-span-1 border-l border-gray-100 pl-4 md:pl-6">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">Timezone <Settings size={10} /></label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={settingsForm.timezone}
                                                onChange={(e) => setSettingsForm({ ...settingsForm, timezone: e.target.value })}
                                                className="w-full border border-gray-200 rounded-lg p-2.5 bg-white text-gray-800 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-500 transition-colors"
                                            />
                                        </div>
                                    </div>
                                    <div className="col-span-2 md:col-span-1">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">Max Concurrent <Settings size={10} /></label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                value={settingsForm.maxConcurrent}
                                                onChange={(e) => setSettingsForm({ ...settingsForm, maxConcurrent: parseInt(e.target.value) || 1 })}
                                                min="1"
                                                className="w-full border border-gray-200 rounded-lg p-2.5 bg-white text-gray-800 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-500 transition-colors"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4 items-start w-full">
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4 block">Active Days</label>
                                        <div className="flex gap-2">
                                            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                                                <button
                                                    key={i}
                                                    type="button"
                                                    onClick={() => toggleDay(i)}
                                                    className={`w-9 h-9 rounded-md flex items-center justify-center text-[13px] font-bold shadow-sm transition-all focus:outline-none ${settingsForm.windowDays.includes(i) ? 'bg-teal-600 text-white border border-teal-700' : 'border border-gray-200 text-gray-400 bg-white hover:bg-gray-50'}`}
                                                >
                                                    {d}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-6 max-w-sm ml-auto w-full">
                                        <div>
                                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Retries</label>
                                            <input
                                                type="number"
                                                value={settingsForm.retryAttempts}
                                                onChange={(e) => setSettingsForm({ ...settingsForm, retryAttempts: parseInt(e.target.value) || 0 })}
                                                min="0"
                                                className="w-full border border-gray-200 rounded-lg p-2.5 bg-white text-gray-800 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-500 transition-colors"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Retry Gap (Minutes)</label>
                                            <input
                                                type="number"
                                                value={settingsForm.retryGapMin}
                                                onChange={(e) => setSettingsForm({ ...settingsForm, retryGapMin: parseInt(e.target.value) || 0 })}
                                                min="0"
                                                className="w-full border border-gray-200 rounded-lg p-2.5 bg-white text-gray-800 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-500 transition-colors"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white border text-red-500 border-red-100 rounded-2xl p-6 shadow-sm overflow-hidden relative">
                            <div className="flex flex-col gap-1 max-w-5xl">
                                <h2 className="text-[10px] font-black tracking-widest uppercase text-red-500 flex inline-flex w-fit items-center gap-2 mb-2"><div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div> Danger Zone</h2>
                                <div className="flex justify-between items-center w-full">
                                    <div>
                                        <div className="font-bold text-gray-900 text-sm">Delete Campaign</div>
                                        <div className="text-gray-500 text-[11px] font-medium mt-0.5">Permanently delete this campaign and all data</div>
                                    </div>
                                    <button className="px-5 py-2.5 border border-red-200 text-red-500 hover:bg-red-50 text-[11px] font-bold rounded-lg transition-all shadow-sm flex items-center gap-2">
                                        <Trash2 size={13} /> Delete Campaign
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end w-full max-w-5xl mt-6">
                            <button
                                onClick={handleSettingsSave}
                                disabled={savingSettings}
                                className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-teal-600/20 transition-colors disabled:opacity-75 disabled:cursor-not-allowed"
                            >
                                {savingSettings ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                                {savingSettings ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {isEditModalOpen && editContact && (
                <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 flex flex-col">

                        <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50/50">
                            <div>
                                <h3 className="text-lg font-black text-gray-900">Update Contact Details</h3>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mt-0.5">{editContact.contactId || editContact.id}</p>
                            </div>
                            <button
                                onClick={() => setIsEditModalOpen(false)}
                                className="p-2 bg-white hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-xl transition-colors border border-gray-100 disabled:opacity-50"
                                disabled={editLoading}
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <form onSubmit={handleEditContactFormSubmit} className="p-6 flex flex-col gap-5">

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">First Name</label>
                                    <input
                                        type="text"
                                        value={editContact.first_name || ''}
                                        onChange={(e) => setEditContact({ ...editContact, first_name: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all"
                                        placeholder="Alex"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Last Name</label>
                                    <input
                                        type="text"
                                        value={editContact.last_name || ''}
                                        onChange={(e) => setEditContact({ ...editContact, last_name: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all"
                                        placeholder="Smith"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Phone Number (E.164)</label>
                                <input
                                    type="text"
                                    value={editContact.phone || ''}
                                    onChange={(e) => setEditContact({ ...editContact, phone: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all font-mono"
                                    placeholder="+14157774444"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Email Address</label>
                                <input
                                    type="email"
                                    value={editContact.email || ''}
                                    onChange={(e) => setEditContact({ ...editContact, email: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all"
                                    placeholder="alex@example.com"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Company</label>
                                <input
                                    type="text"
                                    value={editContact.company || ''}
                                    onChange={(e) => setEditContact({ ...editContact, company: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all"
                                    placeholder="Acme Corp"
                                />
                            </div>

                            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="px-5 py-2.5 bg-white border border-gray-200 text-gray-600 font-bold text-sm rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
                                    disabled={editLoading}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2.5 bg-blue-600 text-white font-bold text-sm rounded-xl hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200 flex items-center justify-center min-w-[120px] disabled:opacity-75 disabled:cursor-not-allowed"
                                    disabled={editLoading}
                                >
                                    {editLoading ? <Loader2 size={16} className="animate-spin" /> : "Save Changes"}
                                </button>
                            </div>

                        </form>
                    </div>
                </div>
            )}
        </MainLayout>
    )
}
