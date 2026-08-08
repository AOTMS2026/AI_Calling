import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '../components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { apiClient } from '../api/client';
import { Loader2, ArrowLeft, Phone, User, Activity, CheckCircle2, Clock, CalendarDays, PhoneCall, FileText, Mail } from 'lucide-react';

export function ContactDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [detail, setDetail] = useState<any>(null);
    const [activities, setActivities] = useState<any[]>([]);
    const [campaignsList, setCampaignsList] = useState<any[]>([]);
    const [notesList, setNotesList] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'activity' | 'calls' | 'notes'>('activity');

    // Action Modals State
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [campaignModalOpen, setCampaignModalOpen] = useState(false);
    const [callModalOpen, setCallModalOpen] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    const [editForm, setEditForm] = useState({ name: '', phone: '', email: '', company: '' });
    useEffect(() => {
        if (detail?.contact && editModalOpen) {
            setEditForm({ name: detail.contact.name || '', phone: detail.contact.phone || '', email: detail.contact.email || '', company: detail.contact.company || '' });
        }
    }, [detail, editModalOpen]);

    const handleEditSave = async () => {
        setActionLoading(true);
        try {
            await apiClient.patch(`/contacts/${id}`, editForm);
            setEditModalOpen(false);
            window.location.reload();
        } catch (e) {
            console.error(e);
        }
        setActionLoading(false);
    };

    const handleTriggerCampaign = async (selectedCampId: string) => {
        setActionLoading(true);
        try {
            await apiClient.post(`/campaigns/${selectedCampId}/bind-contacts`, { contactIds: [id] });
            setCampaignModalOpen(false);
            window.location.reload();
        } catch (e) {
            console.error(e);
        }
        setActionLoading(false);
    };

    const handleCallContact = async (fromNumber: string) => {
        setActionLoading(true);
        try {
            await apiClient.post(`/contacts/${id}/call`, { toNumber: contact?.phone, fromNumber });
            setTimeout(() => {
                setCallModalOpen(false);
                window.location.reload();
            }, 1000);
        } catch (e) {
            console.error(e);
        }
        setActionLoading(false);
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [detailRes, actsRes, campsRes, notesRes] = await Promise.all([
                    apiClient.get(`/contacts/${id}/detail`),
                    apiClient.get(`/contacts/${id}/activities`),
                    apiClient.get(`/contacts/${id}/campaigns`),
                    apiClient.get(`/contacts/${id}/notes`)
                ]);
                setDetail(detailRes.data?.data || null);
                setActivities(actsRes.data?.data || []);
                setCampaignsList(campsRes.data?.data || []);
                setNotesList(notesRes.data?.data || []);
            } catch (e) {
                console.error("Failed to fetch contact metrics:", e);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    if (loading) {
        return (
            <MainLayout>
                <div className="flex h-[80vh] items-center justify-center">
                    <Loader2 size={48} className="animate-spin text-blue-500" />
                </div>
            </MainLayout>
        );
    }

    if (!detail || !detail.contact) {
        return (
            <MainLayout>
                <div className="p-8 text-center text-gray-500">Contact details not found or failed to load.</div>
            </MainLayout>
        );
    }

    const { contact, callStats, campaigns, recentCalls, recentActivities } = detail;

    // Dynamically map exact duration values physically aggregating over all local array elements if available
    const activeCalls = recentCalls || [];
    const totalCalls = callStats?.totalCalls || activeCalls.length || 0;
    const completedCount = callStats?.completedCount || activeCalls.filter((c: any) => c.status === 'completed' || c.status === 'success').length;
    const noAnswerCount = callStats?.noAnswerCount || activeCalls.filter((c: any) => c.status === 'no_answer').length;
    const failedCount = callStats?.failedCount || activeCalls.filter((c: any) => c.status === 'failed').length;

    const latestCall = activeCalls[0] || null;
    const successRatio = totalCalls > 0 ? Math.round((completedCount / totalCalls) * 100) : 0;

    // Build perfect Time Format string outputs physically resolving fake baseline padding logic
    const totalSecs = activeCalls.reduce((acc: number, c: any) => acc + (c.duration_sec || c.durationSec || c.duration || 0), 0) || (callStats?.totalDuration || 0);
    const avgSecs = totalCalls > 0 ? Math.round(totalSecs / totalCalls) : 0;

    const formatTime = (secs: number) => {
        const m = Math.floor(secs / 60);
        const s = Math.floor(secs % 60);
        if (m > 59) {
            const h = Math.floor(m / 60);
            const remainingM = m % 60;
            return `${h}h ${remainingM}m ${s}s`;
        }
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <MainLayout>
            <div className="mb-6 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-gray-100 w-full overflow-hidden">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-5 w-full xl:w-auto">
                    <button onClick={() => navigate('/contacts')} className="hidden sm:flex p-2 shrink-0 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors self-start sm:self-auto">
                        <ArrowLeft size={20} />
                    </button>
                    <div className="flex text-gray-400 gap-2 mb-2 sm:hidden w-full border-b border-gray-100 pb-3">
                        <button onClick={() => navigate('/contacts')} className="flex items-center gap-1 text-sm"><ArrowLeft size={16} /> Back to Contacts</button>
                    </div>

                    <div className="w-full flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-3 w-full">
                            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate max-w-[200px] sm:max-w-md">{contact.name || 'Unknown'}</h1>
                            <span className="px-2 sm:px-3 py-1 bg-green-100 text-green-700 text-[10px] sm:text-xs font-bold rounded-full uppercase tracking-widest shrink-0">
                                {contact.status}
                            </span>
                        </div>

                        <div className="flex flex-col xl:flex-row items-start gap-4 mt-4 w-full">
                            <div className="flex flex-col items-start gap-2 text-sm text-gray-600 shrink-0 w-full xl:w-auto xl:border-r border-gray-100 xl:pr-6">
                                <span className="flex items-center gap-2 font-medium bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 w-fit max-w-full"><Phone size={14} className="text-gray-400 shrink-0" /> <span className="truncate">{contact.phone || 'No Phone'}</span></span>
                                {contact.email && (
                                    <span className="flex items-center gap-2 font-medium bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 w-fit max-w-full"><Mail size={14} className="text-gray-400 shrink-0" /> <span className="truncate">{contact.email}</span></span>
                                )}
                                <span className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 w-fit max-w-full"><Clock size={14} className="text-gray-400 shrink-0" /> <span className="truncate">Called: {contact.lastCalledAt ? new Date(contact.lastCalledAt).toLocaleString() : 'Never'}</span></span>
                            </div>

                            <div className="flex flex-wrap gap-2 w-full mt-2 xl:mt-0 max-w-full">
                                {contact.tags?.map((t: string) => (
                                    <span key={t} className="px-2 py-0.5 bg-orange-50 text-orange-600 rounded whitespace-nowrap text-[10px] sm:text-xs font-medium border border-orange-100 shrink-0">{t}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap sm:flex-nowrap shrink-0 gap-3 w-full xl:w-auto mt-4 xl:mt-0 pt-4 xl:pt-0 border-t xl:border-0 border-gray-100 justify-stretch sm:justify-end">
                    <Button variant="outline" onClick={() => setEditModalOpen(true)} className="flex-1 sm:flex-none text-gray-700 font-bold border-gray-200 hover:border-gray-300 shadow-sm"><FileText size={16} className="mr-2" /> Edit</Button>
                    <Button variant="outline" onClick={() => setCampaignModalOpen(true)} className="flex-1 sm:flex-none text-gray-700 font-bold border-gray-200 hover:border-gray-300 shadow-sm">Campaign</Button>
                    <Button onClick={() => setCallModalOpen(true)} className="bg-teal-600 hover:bg-teal-700 text-white font-bold border-0 flex-1 sm:flex-none shadow-sm"><PhoneCall size={16} className="mr-2 text-white" fill="white" /> Call</Button>
                </div>
            </div>

            {/* Metrics Header */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
                <Card className="shadow-sm">
                    <CardContent className="p-4">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total Calls</p>
                        <p className="text-2xl font-bold text-blue-600">{totalCalls}</p>
                    </CardContent>
                </Card>
                <Card className="shadow-sm">
                    <CardContent className="p-4">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Completed</p>
                        <p className="text-2xl font-bold text-green-600">{completedCount}</p>
                    </CardContent>
                </Card>
                <Card className="shadow-sm">
                    <CardContent className="p-4">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">No Answer</p>
                        <p className="text-2xl font-bold text-gray-900">{noAnswerCount}</p>
                    </CardContent>
                </Card>
                <Card className="shadow-sm">
                    <CardContent className="p-4">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Failed</p>
                        <p className="text-2xl font-bold text-gray-900">{failedCount}</p>
                    </CardContent>
                </Card>
                <Card className="shadow-sm">
                    <CardContent className="p-4">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Avg Duration</p>
                        <p className="text-2xl font-bold text-gray-900">{formatTime(avgSecs)}</p>
                    </CardContent>
                </Card>
                <Card className="shadow-sm">
                    <CardContent className="p-4">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total Time</p>
                        <p className="text-2xl font-bold text-gray-900">{formatTime(totalSecs)}</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column */}
                <div className="space-y-6">
                    <Card className="shadow-sm">
                        <CardHeader className="bg-gray-50/50 border-b border-gray-100 py-3 flex flex-row items-center gap-3">
                            <span className="p-2 bg-gray-100 rounded-lg text-gray-500"><User size={16} /></span>
                            <div>
                                <CardTitle className="text-sm font-bold text-gray-900">Contact snapshot</CardTitle>
                                <p className="text-xs text-gray-500">Core identity and record metadata</p>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4 grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Contact ID</p>
                                <p className="text-sm font-mono text-gray-700 bg-gray-50 p-2 rounded truncate">{contact.id}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Organization</p>
                                <p className="text-sm font-mono text-gray-700 bg-gray-50 p-2 rounded truncate">{contact.organizationId?.split('-')[0]}...</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Created</p>
                                <p className="text-sm font-medium text-gray-700 bg-gray-50 p-2 rounded truncate">{new Date(contact.createdAt).toLocaleDateString()}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Email Map</p>
                                <p className="text-sm font-medium text-gray-700 bg-gray-50 p-2 rounded truncate">{contact.email || 'None mapped'}</p>
                            </div>
                            <div className="col-span-2">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Custom Variables</p>
                                <p className="text-xs font-mono text-gray-600 bg-gray-50 p-3 rounded break-words">
                                    {contact.customVariables?.CustomVariables || 'None'}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm">
                        <CardHeader className="bg-gray-50/50 border-b border-gray-100 py-3 flex flex-row items-center gap-3">
                            <span className="p-2 bg-gray-100 rounded-lg text-gray-500"><FileText size={16} /></span>
                            <CardTitle className="text-sm font-bold text-gray-900">Campaign footprint</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 space-y-3">
                            {campaignsList?.filter((c: any) => !c.name?.includes('[HASH:')).length > 0 ? campaignsList.filter((c: any) => !c.name?.includes('[HASH:')).map((camp: any) => (
                                <div key={camp.id} className="border border-gray-100 rounded-lg p-3 hover:bg-gray-50/50 transition">
                                    <h4 className="text-sm font-bold text-gray-900">{camp.name}</h4>
                                    <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                                        <span className={`px-2 py-0.5 rounded border uppercase font-bold ${(camp.execution_status || camp.status) === 'completed'
                                            ? 'bg-green-50 text-green-700 border-green-100'
                                            : 'bg-orange-50 text-orange-700 border-orange-100'
                                            }`}>
                                            {camp.execution_status || camp.status || 'Active'}
                                        </span>
                                        <span>{camp.contact_stats?.total || 1} attempts</span>
                                    </div>
                                </div>
                            )) : (
                                <p className="text-sm text-gray-500 font-medium">No extended campaigns fetched.</p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Area (2 Cols wide) */}
                <div className="col-span-1 lg:col-span-2 space-y-6">
                    {/* Engagement Summary */}
                    <Card className="shadow-sm">
                        <CardHeader className="bg-gray-50/50 border-b border-gray-100 py-3 flex flex-row items-center gap-3">
                            <span className="p-2 bg-teal-50 text-teal-600 rounded-lg"><PhoneCall size={16} /></span>
                            <div>
                                <CardTitle className="text-sm font-bold text-gray-900">Engagement summary</CardTitle>
                                <p className="text-xs text-gray-500">Reach and outcome ratios across all calls</p>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 flex items-center gap-8">
                            <div
                                className="w-24 h-24 rounded-full flex flex-col items-center justify-center shrink-0 relative shadow-inner"
                                style={{ background: `conic-gradient(#22c55e ${successRatio}%, #f3f4f6 0)` }}
                            >
                                <div className="w-20 h-20 bg-white rounded-full flex flex-col items-center justify-center absolute">
                                    <span className="text-xl font-black text-gray-900">{successRatio}%</span>
                                    <span className="text-[10px] font-bold text-green-600 uppercase tracking-widest mt-1">Success</span>
                                </div>
                            </div>
                            <div className="flex-1 space-y-4">
                                <div>
                                    <div className="flex justify-between text-xs font-bold mb-1">
                                        <span className="text-gray-700">Completed</span>
                                        <span className="text-green-600">{completedCount}</span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-2">
                                        <div className="bg-green-500 h-2 rounded-full transition-all duration-500" style={{ width: `${totalCalls ? Math.round((completedCount / totalCalls) * 100) : 0}%` }}></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-xs font-bold mb-1">
                                        <span className="text-gray-700">No answer</span>
                                        <span className="text-gray-400">{noAnswerCount}</span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-2">
                                        <div className="bg-gray-400 h-2 rounded-full transition-all duration-500" style={{ width: `${totalCalls ? Math.round((noAnswerCount / totalCalls) * 100) : 0}%` }}></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-xs font-bold mb-1">
                                        <span className="text-gray-700">Failed</span>
                                        <span className="text-red-500">{failedCount}</span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-2">
                                        <div className="bg-red-500 h-2 rounded-full transition-all duration-500" style={{ width: `${totalCalls ? Math.round((failedCount / totalCalls) * 100) : 0}%` }}></div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Latest Call */}
                        <Card className={`shadow-sm border-l-4 ${latestCall ? 'border-l-green-500' : 'border-l-gray-300'}`}>
                            <CardHeader className="bg-white pb-0">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="text-sm font-bold text-gray-900">Latest call</CardTitle>
                                        <p className="text-xs text-gray-500 mt-1">Most recent outbound interaction</p>
                                    </div>
                                    {latestCall && (
                                        <span className="px-2 py-1 bg-green-50 text-green-700 text-[10px] font-bold rounded uppercase tracking-wider border border-green-100">
                                            {latestCall.status}
                                        </span>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="p-4 pt-4 space-y-4">
                                {latestCall ? (
                                    <>
                                        <h4 className="text-sm font-bold text-gray-900 mb-2 truncate max-w-full">{latestCall.campaignName || 'Direct Call'}</h4>
                                        <div className="flex justify-between">
                                            <div>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Duration</p>
                                                <p className="text-lg font-bold text-gray-900">{formatTime(latestCall.durationSec || latestCall.duration_sec || 0)}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Cost</p>
                                                <p className="text-lg font-bold text-gray-900">${latestCall.costTotal || '0.00'}</p>
                                            </div>
                                        </div>
                                        <div className="flex justify-between">
                                            <div>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">From</p>
                                                <p className="text-sm font-mono text-gray-600">{latestCall.callerNumber || 'N/A'}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">To</p>
                                                <p className="text-sm font-mono text-gray-600">{latestCall.calleeNumber || contact.phone}</p>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Disconnect Reason</p>
                                            <p className="text-sm text-gray-700 capitalize">{latestCall.disconnectReason?.replace('_', ' ') || 'Unknown'}</p>
                                        </div>
                                        <Button variant="link" className="text-teal-600 p-0 h-auto">View call details ↗</Button>
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center justify-center p-6 text-gray-400">
                                        <Phone size={32} className="mb-2 opacity-50" />
                                        <p className="text-sm font-medium">No recorded calls yet.</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Latest Activity */}
                        <Card className="shadow-sm border-l-4 border-l-pink-500">
                            <CardHeader className="bg-gray-50/50 border-b border-gray-100 py-3 flex flex-row items-center gap-3">
                                <span className="p-2 bg-gray-100 rounded-lg text-gray-500"><Activity size={16} /></span>
                                <div>
                                    <CardTitle className="text-sm font-bold text-gray-900">Latest activity</CardTitle>
                                    <p className="text-xs text-gray-500">Last event captured for this contact</p>
                                </div>
                            </CardHeader>
                            <CardContent className="p-4">
                                {recentActivities?.[0] ? (
                                    <>
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h4 className="text-sm font-bold text-gray-900 capitalize">{recentActivities[0].activityType?.replace('_', ' ')}</h4>
                                                <p className="text-xs text-gray-500 mt-1">{new Date(recentActivities[0].createdAt).toLocaleString()}</p>
                                            </div>
                                            <span className="px-2 py-0.5 bg-pink-50 text-pink-700 text-[10px] font-bold tracking-widest uppercase rounded border border-pink-100">Latest</span>
                                        </div>
                                        <div className="space-y-2 border-t border-gray-100 pt-3">
                                            {Object.entries(JSON.parse(recentActivities[0].metadata || '{}')).map(([k, v]) => (
                                                <div className="flex justify-between" key={k}>
                                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{k.replace('_', ' ')}</span>
                                                    <span className="text-xs font-mono text-gray-700">{(v as string).toString()}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                ) : (
                                    <p className="text-sm text-gray-500">No recent activity.</p>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
            {/* Bottom Activity Timeline Tab */}
            <Card className="shadow-sm mt-6 mb-12">
                <div className="flex border-b border-gray-100 p-2">
                    <button
                        onClick={() => setActiveTab('activity')}
                        className={`px-6 py-2 text-sm font-bold flex items-center gap-2 rounded-t-lg transition-colors ${activeTab === 'activity' ? 'border-b-2 border-teal-600 text-teal-600' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        <Activity size={16} /> Activity
                    </button>
                    <button
                        onClick={() => setActiveTab('calls')}
                        className={`px-6 py-2 text-sm font-bold flex items-center gap-2 rounded-t-lg transition-colors ${activeTab === 'calls' ? 'border-b-2 border-teal-600 text-teal-600' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        <PhoneCall size={16} /> Calls <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-[10px]">{totalCalls}</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('notes')}
                        className={`px-6 py-2 text-sm font-bold flex items-center gap-2 rounded-t-lg transition-colors ${activeTab === 'notes' ? 'border-b-2 border-teal-600 text-teal-600' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        <FileText size={16} /> Notes <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-[10px]">{notesList.length}</span>
                    </button>
                </div>
                <CardContent className="p-0">
                    {activeTab === 'activity' && (
                        activities.length > 0 ? (
                            <div className="divide-y divide-gray-50">
                                {activities.map((act) => (
                                    <div key={act.id} className="p-6 flex items-start gap-4 hover:bg-gray-50/50 transition-colors">
                                        <div className="p-2 bg-green-50 text-green-600 rounded-full shrink-0 border border-green-100 mt-1">
                                            <CheckCircle2 size={16} />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="text-sm font-bold text-gray-900 capitalize">{act.type?.replace(/_/g, ' ')}</h4>
                                            <p className="text-xs text-gray-600 mt-1 max-w-3xl leading-relaxed">{act.description}</p>
                                        </div>
                                        <div className="text-xs font-bold text-gray-400 shrink-0 uppercase tracking-widest whitespace-nowrap">
                                            {new Date(act.created_at || act.createdAt || Date.now()).toLocaleString()}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-8 text-center text-gray-500 font-medium">No activity history available.</div>
                        )
                    )}

                    {activeTab === 'notes' && (
                        notesList.length > 0 ? (
                            <div className="divide-y divide-gray-50">
                                {notesList.map((note) => (
                                    <div key={note.id} className="p-6 flex items-start gap-4 hover:bg-gray-50/50 transition-colors">
                                        <div className="p-2 bg-blue-50 text-blue-600 rounded-full shrink-0 border border-blue-100 mt-1">
                                            <FileText size={16} />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="text-sm font-bold text-gray-900">Operator Note</h4>
                                            <p className="text-xs text-gray-800 mt-1 max-w-3xl leading-relaxed font-mono bg-blue-50/30 p-3 rounded-xl border border-blue-100 mt-2">{note.content}</p>
                                        </div>
                                        <div className="text-xs font-bold text-gray-400 shrink-0 uppercase tracking-widest whitespace-nowrap">
                                            {new Date(note.created_at || note.createdAt || Date.now()).toLocaleString()}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-8 text-center text-gray-500 font-medium">No notes logically captured for this contact.</div>
                        )
                    )}

                    {activeTab === 'calls' && (
                        <div className="p-8 text-center text-gray-500 font-medium">Call logs mapping pending implementation.</div>
                    )}
                </CardContent>
            </Card>

            {/* ACTION MODALS */}
            {editModalOpen && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="text-lg font-black text-gray-900 flex items-center gap-2"><User size={18} className="text-teal-600" /> Edit Contact</h3>
                            <button onClick={() => setEditModalOpen(false)} className="text-gray-400 hover:text-gray-900 bg-white p-1 rounded-md border border-gray-200 shadow-sm">&times;</button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div><label className="text-xs font-bold text-gray-700 uppercase tracking-widest mb-1.5 block">Full Name</label><input className="w-full text-sm p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} /></div>
                            <div><label className="text-xs font-bold text-gray-700 uppercase tracking-widest mb-1.5 block">Phone Number</label><input className="w-full text-sm p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none font-mono" value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} /></div>
                            <div><label className="text-xs font-bold text-gray-700 uppercase tracking-widest mb-1.5 block">Email Map</label><input className="w-full text-sm p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} /></div>
                        </div>
                        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                            <Button variant="outline" onClick={() => setEditModalOpen(false)}>Cancel</Button>
                            <Button className="bg-teal-600 text-white font-bold" onClick={handleEditSave} disabled={actionLoading}>{actionLoading ? "Saving..." : "Update Record"}</Button>
                        </div>
                    </div>
                </div>
            )}

            {campaignModalOpen && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="text-lg font-black text-gray-900 flex items-center gap-2"><FileText size={18} className="text-teal-600" /> Execute Campaign Trigger</h3>
                            <button onClick={() => setCampaignModalOpen(false)} className="text-gray-400 hover:text-gray-900 bg-white p-1 rounded-md border border-gray-200 shadow-sm">&times;</button>
                        </div>
                        <div className="p-6">
                            <p className="text-sm text-gray-600 mb-4 tracking-tight">Select an active dashboard campaign to immediately bind and execute an outbound sequence towards <strong className="font-bold text-gray-900">{contact.name}</strong>.</p>

                            <select className="w-full p-3 border border-gray-200 rounded-xl font-bold text-gray-700 focus:ring-2 focus:ring-teal-500 outline-none cursor-pointer bg-white" onChange={(e) => handleTriggerCampaign(e.target.value)}>
                                <option value="">-- Click to Target Campaign --</option>
                                {campaignsList.filter((c: any) => !c.name.includes('[HASH:')).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                    </div>
                </div>
            )}

            {callModalOpen && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col relative">
                        {actionLoading && <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex flex-col justify-center items-center">
                            <div className="w-16 h-16 border-4 border-teal-100 border-t-teal-600 rounded-full animate-spin mb-3"></div>
                            <span className="text-teal-800 font-bold tracking-widest text-xs uppercase animate-pulse">Running Call Session...</span>
                        </div>}

                        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-teal-50/50">
                            <h3 className="text-lg font-black text-teal-900 flex items-center gap-2"><PhoneCall size={18} className="text-teal-600 animate-pulse" /> Instant Neural Dispatch</h3>
                            <button onClick={() => setCallModalOpen(false)} className="text-teal-400 hover:text-teal-900 bg-white p-1 rounded-xl border border-teal-100 shadow-sm">&times;</button>
                        </div>
                        <div className="p-6 space-y-5 relative">
                            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 text-center relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/10 rounded-full blur-2xl -mt-10 -mr-10"></div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 flex items-center justify-center gap-1"><User size={12} /> Handshake Target</p>
                                <p className="text-xl font-black text-gray-900 tracking-tight">{contact.name}</p>
                                <p className="text-sm font-mono text-gray-500 mt-1">{contact.phone}</p>
                            </div>

                            <form onSubmit={(e) => { e.preventDefault(); handleCallContact((e.target as any).fromNumber.value); }}>
                                <div>
                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 block">From Number (Ravan Mask)</label>
                                    <input name="fromNumber" required className="w-full text-sm p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none font-mono tracking-wide placeholder-gray-300 transition-colors" placeholder="+914441019..." />
                                </div>
                                <Button type="submit" className="w-full mt-6 bg-teal-600 hover:bg-teal-700 hover:scale-[1.02] shadow-lg shadow-teal-500/20 text-white font-black py-6 rounded-xl text-lg flex items-center justify-center gap-3 transition-all">
                                    <Phone size={20} fill="white" /> Connect Now
                                </Button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </MainLayout>
    );
}
