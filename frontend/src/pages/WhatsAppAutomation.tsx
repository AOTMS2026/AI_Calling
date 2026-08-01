import React, { useState, useEffect } from 'react';
import {
    Send, Play, Pause, X, Trash2, Plus, Download, UploadCloud,
    Check, CheckCheck, RefreshCw, Volume2, Video, Image, FileText,
    Search, Activity, Coins, AlertTriangle, User, Users, Clock, History
} from 'lucide-react';
import { MainLayout } from '../components/layout/MainLayout';
import { apiClient } from '../api/client';
import toast from 'react-hot-toast';

export default function WhatsAppAutomation() {
    const [activeTab, setActiveTab] = useState<'campaigns' | 'compose' | 'chat' | 'media'>('campaigns');
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [templates, setTemplates] = useState<any[]>([]);
    const [groups, setGroups] = useState<any[]>([]);
    const [messages, setMessages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Compose state
    const [campaignName, setCampaignName] = useState('');
    const [selectedTemplateId, setSelectedTemplateId] = useState<number | ''>('');
    const [selectedGroupId, setSelectedGroupId] = useState<number | ''>('');
    const [attachmentUrl, setAttachmentUrl] = useState('');
    const [attachmentType, setAttachmentType] = useState<'text' | 'image' | 'video' | 'audio' | 'document'>('text');
    const [csvFileContent, setCsvFileContent] = useState<any[]>([]);

    // Direct Chat state
    const [selectedContactPhone, setSelectedContactPhone] = useState('');
    const [directMsgText, setDirectMsgText] = useState('');
    const [directAttachmentUrl, setDirectAttachmentUrl] = useState('');
    const [directAttachmentType, setDirectAttachmentType] = useState<string>('text');

    // Fetch data
    const fetchData = async () => {
        try {
            setLoading(true);
            const campaignsRes = await apiClient.get('/whatsapp/campaigns');
            setCampaigns(campaignsRes.data || []);

            const tempRes = await apiClient.get('/whatsapp/templates');
            setTemplates(tempRes.data || []);

            const groupRes = await apiClient.get('/whatsapp/groups');
            setGroups(groupRes.data || []);

            const msgRes = await apiClient.get('/whatsapp/messages');
            setMessages(msgRes.data || []);
        } catch (e) {
            console.error("WhatsApp module fetch error:", e);
            toast.error("Failed to load WhatsApp data.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // CSV Parse Simulator
    const handleCsvUploadSimulate = (e: React.ChangeEvent<HTMLInputElement>) => {
        const mockParsed = [
            { phone: "9876543210", name: "Jayaveer", course: "AI Agent Builder" },
            { phone: "9123456789", name: "Raman Kumar", course: "LMS Pro Dev" },
            { phone: "8887776660", name: "Sara Smith", course: "Advanced Python" },
            { phone: "invalid-num-55", name: "Bad Lead", course: "Robotics" }
        ];
        setCsvFileContent(mockParsed);
        toast.success("CSV Upload Synced. 4 contacts loaded.");
    };

    // Campaign Actions
    const handleCampaignControl = async (id: number, action: 'pause' | 'resume' | 'cancel' | 'retry') => {
        try {
            const apiAction = action === 'retry' ? 'retry-failed' : action;
            await apiClient.post(`/whatsapp/campaigns/${id}/${apiAction}`);
            toast.success(`Campaign ${action} complete.`);
            fetchData();
        } catch (err) {
            toast.error("Action error.");
        }
    };

    const handleSendDirectMessage = async () => {
        if (!selectedContactPhone || !directMsgText) {
            toast.error("Please fill in contact phone and message text.");
            return;
        }

        try {
            await apiClient.post('/whatsapp/messages/send', {
                recipient_phone: selectedContactPhone,
                content_text: directMsgText,
                media_url: directAttachmentUrl || null,
                message_type: directAttachmentType
            });
            toast.success("Direct message sent!");
            setDirectMsgText('');
            setDirectAttachmentUrl('');
            setDirectAttachmentType('text');
            fetchData();
        } catch (e) {
            toast.error("Send failed.");
        }
    };

    const handleDispatchCampaign = async () => {
        if (!campaignName) {
            toast.error("Please specify a campaign name.");
            return;
        }

        const recipients = csvFileContent.map(row => ({
            phone: row.phone,
            variables: {
                customer_name: row.name,
                course: row.course
            }
        }));

        try {
            await apiClient.post('/whatsapp/campaigns', {
                name: campaignName,
                template_id: selectedTemplateId || null,
                recipients,
                media_url: attachmentUrl || null,
                message_type: attachmentType
            });
            toast.success("Bulk WhatsApp Campaign Dispatched!");
            setCampaignName('');
            setCsvFileContent([]);
            setSelectedTemplateId('');
            setActiveTab('campaigns');
            fetchData();
        } catch (e) {
            toast.error("Failed to start campaign.");
        }
    };

    // Selected template content resolver for previews
    const getActiveTemplateContent = () => {
        if (!selectedTemplateId) return "Construct your custom notification outreach template.";
        const tpl = templates.find(t => t.id === Number(selectedTemplateId));
        if (!tpl) return "";
        let txt = tpl.content;
        if (csvFileContent.length > 0) {
            txt = txt.replace("{{customer_name}}", csvFileContent[0].name || "Customer");
            txt = txt.replace("{{course}}", csvFileContent[0].course || "AI Course");
        } else {
            txt = txt.replace("{{customer_name}}", "[Customer Name]");
            txt = txt.replace("{{course}}", "[Course]");
        }
        return txt;
    };

    // Calculate dynamic dashboard aggregates
    const totalOutbound = campaigns.reduce((acc, c) => acc + c.total_recipients, 0);
    const totalSent = campaigns.reduce((acc, c) => acc + c.sent_count, 0);
    const totalFailed = campaigns.reduce((acc, c) => acc + c.failed_count, 0) + campaigns.reduce((acc, c) => acc + c.duplicate_count, 0);
    const totalCostCoins = campaigns.reduce((acc, c) => acc + c.cost_total, 0);
    const successRate = totalSent > 0 ? Math.round(((totalSent - totalFailed) / totalSent) * 100) : 100;

    return (
        <MainLayout>
            <div className="p-8 max-w-6xl mx-auto w-full space-y-6 text-slate-805">

                {/* Outbox campaign metrics display */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                            <Send size={24} className="text-emerald-650" /> WhatsApp Marketing Portal
                        </h1>
                        <p className="text-[13px] text-slate-500 mt-0.5 font-normal">
                            Automate CRM notification templates, execute bulk CSV broadcasts, and monitor delivery checkmarks.
                        </p>
                    </div>

                    <button
                        onClick={fetchData}
                        className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:border-slate-350 text-slate-700 rounded-lg text-xs font-semibold transition-all active:scale-95"
                    >
                        <RefreshCw size={13} className={loading ? "animate-spin text-emerald-500" : "text-slate-500"} /> Refresh Portal
                    </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-slate-50/50 rounded-xl border border-slate-200 p-4">
                        <div className="flex justify-between items-start">
                            <p className="text-[10px] font-bold text-slate-450 uppercase tracking-widest">Total Broadcasted</p>
                            <Users size={16} className="text-slate-400" />
                        </div>
                        <p className="text-2xl font-black text-slate-900 mt-1">{totalOutbound}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">Leads imported across files</p>
                    </div>

                    <div className="bg-slate-50/50 rounded-xl border border-slate-200 p-4">
                        <div className="flex justify-between items-start">
                            <p className="text-[10px] font-bold text-slate-450 uppercase tracking-widest">Outreach Cost</p>
                            <Coins size={16} className="text-emerald-500" />
                        </div>
                        <p className="text-2xl font-black text-slate-900 mt-1">Rs. {totalCostCoins.toFixed(2)}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">Calculated Meta Cloud API fee</p>
                    </div>

                    <div className="bg-slate-50/50 rounded-xl border border-slate-200 p-4">
                        <div className="flex justify-between items-start">
                            <p className="text-[10px] font-bold text-slate-450 uppercase tracking-widest">Success Deliver Rate</p>
                            <Activity size={16} className="text-blue-500" />
                        </div>
                        <p className="text-2xl font-black text-slate-900 mt-1">{successRate}%</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">Excludes failures and duplicates</p>
                    </div>

                    <div className="bg-slate-50/50 rounded-xl border border-slate-200 p-4">
                        <div className="flex justify-between items-start">
                            <p className="text-[10px] font-bold text-slate-450 uppercase tracking-widest">Active Campaigns</p>
                            <Clock size={16} className="text-amber-500" />
                        </div>
                        <p className="text-2xl font-black text-slate-900 mt-1">{campaigns.filter(c => c.status === "Running").length}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">Bulk campaigns executing</p>
                    </div>
                </div>

                <div className="flex border-b border-slate-200 gap-1">
                    <button
                        onClick={() => setActiveTab('campaigns')}
                        className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 ${activeTab === 'campaigns' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
                    >
                        Campaign Monitors
                    </button>
                    <button
                        onClick={() => setActiveTab('compose')}
                        className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 ${activeTab === 'compose' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
                    >
                        Bulk Campaign Composer
                    </button>
                    <button
                        onClick={() => setActiveTab('chat')}
                        className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 ${activeTab === 'chat' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
                    >
                        Direct Chat & Timelines
                    </button>
                    <button
                        onClick={() => setActiveTab('media')}
                        className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 ${activeTab === 'media' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
                    >
                        Outbox Media Library
                    </button>
                </div>

                {activeTab === 'campaigns' && (
                    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
                            <h3 className="text-xs font-bold text-slate-705 uppercase tracking-wider">Bulk Campaign Logs</h3>
                            <span className="text-[10px] text-slate-500">Real-time status updates</span>
                        </div>

                        <div className="divide-y divide-slate-100">
                            {campaigns.length === 0 ? (
                                <div className="p-8 text-center text-slate-400 text-xs font-medium">
                                    No bulk campaigns launched yet. Head over to the Composer tab.
                                </div>
                            ) : (
                                campaigns.map((campaign) => {
                                    const progress = campaign.total_recipients > 0
                                        ? Math.round(((campaign.sent_count + campaign.failed_count + campaign.duplicate_count) / campaign.total_recipients) * 100)
                                        : 0;

                                    return (
                                        <div key={campaign.id} className="p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-slate-50/30 transition-all">
                                            <div className="space-y-1.5 flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <h4 className="text-xs font-bold text-slate-800 truncate">{campaign.name}</h4>
                                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${campaign.status === "Running" ? "bg-blue-50 text-blue-700 animate-pulse" :
                                                            campaign.status === "Completed" ? "bg-emerald-50 text-emerald-700" :
                                                                campaign.status === "Paused" ? "bg-amber-50 text-amber-700" :
                                                                    "bg-slate-100 text-slate-650"
                                                        }`}>
                                                        {campaign.status}
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-4 text-[10px] text-slate-500 font-semibold flex-wrap">
                                                    <span>Recipients: <b className="text-slate-700">{campaign.total_recipients}</b></span>
                                                    <span>API Cost: <b className="text-slate-700 font-bold">Rs. {campaign.cost_total.toFixed(2)}</b></span>
                                                    <span>Duplicates Filtered: <b className="text-slate-700">{campaign.duplicate_count}</b></span>
                                                    <span>Errors: <b className="text-red-500">{campaign.failed_count}</b></span>
                                                </div>

                                                <div className="flex items-center gap-2 max-w-md w-full mt-2">
                                                    <div className="flex-1 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full transition-all ${campaign.status === "Completed" ? "bg-emerald-500" : "bg-emerald-450"
                                                                }`}
                                                            style={{ width: `${progress}%` }}
                                                        ></div>
                                                    </div>
                                                    <span className="text-[10px] font-bold text-slate-500">{progress}%</span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-1.5 shrink-0">
                                                {campaign.status === "Running" && (
                                                    <button
                                                        onClick={() => handleCampaignControl(campaign.id, 'pause')}
                                                        className="p-1.5 hover:bg-amber-50 rounded border border-slate-205 text-amber-600 hover:border-amber-200 text-[10px] font-bold flex items-center gap-1"
                                                    >
                                                        <Pause size={12} /> Pause
                                                    </button>
                                                )}
                                                {campaign.status === "Paused" && (
                                                    <button
                                                        onClick={() => handleCampaignControl(campaign.id, 'resume')}
                                                        className="p-1.5 hover:bg-blue-50 rounded border border-slate-205 text-blue-605 hover:border-blue-200 text-[10px] font-bold flex items-center gap-1"
                                                    >
                                                        <Play size={12} /> Resume
                                                    </button>
                                                )}
                                                {campaign.status === "Running" && (
                                                    <button
                                                        onClick={() => handleCampaignControl(campaign.id, 'cancel')}
                                                        className="p-1.5 hover:bg-rose-50 rounded border border-slate-205 text-rose-600 hover:border-rose-200 text-[10px] font-bold flex items-center gap-1"
                                                    >
                                                        <X size={12} /> Cancel
                                                    </button>
                                                )}
                                                {campaign.failed_count > 0 && (
                                                    <button
                                                        onClick={() => handleCampaignControl(campaign.id, 'retry')}
                                                        className="p-1.5 hover:bg-slate-100 rounded border border-slate-205 text-[10px] font-bold text-slate-700 flex items-center gap-1"
                                                    >
                                                        <RefreshCw size={12} /> Retry Failed
                                                    </button>
                                                )}
                                            </div>

                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'compose' && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-202 p-5 space-y-4">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1">Campaign Name</label>
                                <input
                                    type="text"
                                    placeholder="Enter campaign identifier, e.g. August Intake Followups"
                                    value={campaignName}
                                    onChange={e => setCampaignName(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1">WhatsApp Template</label>
                                    <select
                                        value={selectedTemplateId}
                                        onChange={e => setSelectedTemplateId(e.target.value === '' ? '' : Number(e.target.value))}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-202 rounded-lg text-xs font-semibold text-slate-705 focus:outline-none"
                                    >
                                        <option value="">Select Pre-approved Template</option>
                                        {templates.map(t => (
                                            <option key={t.id} value={t.id}>[{t.approval_status}] {t.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1">Target Contact Group</label>
                                    <select
                                        value={selectedGroupId}
                                        onChange={e => setSelectedGroupId(e.target.value === '' ? '' : Number(e.target.value))}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-202 rounded-lg text-xs font-semibold text-slate-705 focus:outline-none"
                                    >
                                        <option value="">Select Group List</option>
                                        {groups.map(g => (
                                            <option key={g.id} value={g.id}>{g.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="border-2 border-dashed border-slate-202 rounded-xl p-6 text-center hover:bg-slate-50/50 transition-all relative">
                                <input
                                    type="file"
                                    accept=".csv"
                                    onChange={handleCsvUploadSimulate}
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                />
                                <UploadCloud size={24} className="mx-auto text-emerald-500 mb-2" />
                                <h5 className="text-xs font-bold text-slate-750">Upload Outreach CSV file</h5>
                                <p className="text-[10px] text-slate-400 mt-1">Accepts phone, name, course headers data.</p>
                                {csvFileContent.length > 0 && (
                                    <div className="mt-3 inline-block px-3 py-1 bg-emerald-50 border border-emerald-100 rounded text-emerald-700 text-[10px] font-bold">
                                        Active File: {csvFileContent.length} Rows Synced
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="block text-[10px] font-bold text-slate-450 uppercase">Outbound Attachment (Optional)</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <select
                                        value={attachmentType}
                                        onChange={e => setAttachmentType(e.target.value as any)}
                                        className="px-3 py-2 bg-slate-50 border border-slate-202 rounded-lg text-xs font-semibold text-slate-705"
                                    >
                                        <option value="text">No Attachment (Text Only)</option>
                                        <option value="image">Image File (.png, .jpg)</option>
                                        <option value="video">Video File (.mp4)</option>
                                        <option value="audio">Voice Audio Note (.mp3)</option>
                                        <option value="document">PDF Document (.pdf)</option>
                                    </select>
                                    {attachmentType !== 'text' && (
                                        <input
                                            type="text"
                                            placeholder="Paste media attachment HTTPS URL"
                                            value={attachmentUrl}
                                            onChange={e => setAttachmentUrl(e.target.value)}
                                            className="px-3 py-2 bg-slate-50 border border-slate-202 rounded-lg text-xs font-semibold text-slate-800 placeholder-slate-450 focus:outline-none"
                                        />
                                    )}
                                </div>
                            </div>

                            <button
                                onClick={handleDispatchCampaign}
                                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5"
                            >
                                <Send size={14} /> Dispatch WhatsApp Campaign
                            </button>
                        </div>

                        <div className="lg:col-span-5 bg-slate-100 rounded-2xl border border-slate-200 p-6 flex flex-col items-center justify-center relative overflow-hidden min-h-[420px]">

                            <div className="w-64 h-[420px] bg-white rounded-3xl border-8 border-slate-805 shadow-2xl overflow-hidden flex flex-col relative">

                                <div className="h-6 bg-slate-800 flex items-center justify-between px-4 text-[9px] text-white shrink-0 font-bold">
                                    <span>23:58</span>
                                    <span>LTE 🔋</span>
                                </div>

                                <div className="h-10 bg-emerald-700 flex items-center gap-2 px-3 text-white shrink-0 shadow-sm">
                                    <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center font-bold text-xs">U</div>
                                    <div className="min-w-0">
                                        <p className="text-[10px] font-bold leading-tight">Outbox Test Lead</p>
                                        <p className="text-[8px] text-emerald-200">Online</p>
                                    </div>
                                </div>

                                <div className="flex-1 bg-[#ede6df] p-3 overflow-y-auto space-y-2 flex flex-col justify-end">

                                    {attachmentType !== 'text' && attachmentUrl && (
                                        <div className="self-end bg-emerald-100 max-w-[85%] rounded-lg p-1.5 shadow-xs border border-emerald-200/50 flex flex-col text-[10px] space-y-1">
                                            {attachmentType === 'image' && <img src={attachmentUrl} alt="Preview" className="w-full h-24 object-cover rounded" />}
                                            {attachmentType === 'video' && <div className="w-full h-20 bg-slate-850 rounded flex items-center justify-center text-white"><Video size={16} /></div>}
                                            {attachmentType === 'audio' && <div className="w-full py-1 bg-slate-200 rounded flex items-center gap-1 px-2"><Volume2 size={12} className="text-slate-650" /> VoiceNote.mp3</div>}
                                            {attachmentType === 'document' && <div className="w-full py-1.5 bg-white rounded border flex items-center gap-1.5 px-2"><FileText size={12} className="text-red-500" /> Syllabus.pdf</div>}
                                        </div>
                                    )}

                                    <div className="self-end bg-white max-w-[85%] rounded-lg p-2 shadow-xs border border-slate-200 flex flex-col relative">
                                        <p className="text-[10px] leading-relaxed text-slate-800 font-semibold">{getActiveTemplateContent()}</p>
                                        <div className="flex items-center gap-0.5 justify-end mt-1 shrink-0">
                                            <span className="text-[7.5px] text-slate-400 font-semibold">23:58</span>
                                            <CheckCheck size={9} className="text-blue-500" />
                                        </div>
                                    </div>

                                </div>

                                <div className="h-10 bg-slate-50 border-t border-slate-200 flex items-center px-2 shrink-0 gap-1">
                                    <div className="flex-1 bg-white border border-slate-200 rounded-full h-7 px-3 text-[9px] text-slate-400 flex items-center font-medium">Type message...</div>
                                    <div className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center text-white"><Send size={10} /></div>
                                </div>

                            </div>
                            <span className="text-[10px] text-slate-450 font-bold mt-3">Interactive Mobile Display Sync Mockup</span>
                        </div>

                    </div>
                )}

                {activeTab === 'chat' && (
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs h-[480px]">

                        <div className="md:col-span-4 border-r border-slate-200 flex flex-col h-full bg-slate-50/50">
                            <div className="p-3 border-b border-slate-200">
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-2 text-slate-400" size={13} />
                                    <input
                                        type="text"
                                        placeholder="Search chat recipient..."
                                        className="w-full pl-7 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                                <button
                                    onClick={() => setSelectedContactPhone('9876543210')}
                                    className={`w-full p-3 text-left flex items-center gap-3 transition-colors ${selectedContactPhone === '9876543210' ? 'bg-emerald-50/55' : 'hover:bg-slate-100/30'}`}
                                >
                                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">J</div>
                                    <div className="min-w-0">
                                        <p className="text-xs font-bold text-slate-800 text-normal">Jayaveer (Lead)</p>
                                        <p className="text-[9px] text-slate-400 truncate">9876543210</p>
                                    </div>
                                </button>
                                <button
                                    onClick={() => setSelectedContactPhone('9123456789')}
                                    className={`w-full p-3 text-left flex items-center gap-3 transition-colors ${selectedContactPhone === '9123456789' ? 'bg-emerald-50/55' : 'hover:bg-slate-100/30'}`}
                                >
                                    <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs shrink-0">R</div>
                                    <div className="min-w-0">
                                        <p className="text-xs font-bold text-slate-800 text-normal">Raman Kumar (Student)</p>
                                        <p className="text-[9px] text-slate-400 truncate">9123456789</p>
                                    </div>
                                </button>
                            </div>
                        </div>

                        <div className="md:col-span-8 flex flex-col h-full bg-[#f4f2f0]">
                            {selectedContactPhone ? (
                                <>
                                    <div className="bg-white border-b border-slate-200 px-4 py-2.5 flex items-center justify-between shrink-0 shadow-xs">
                                        <h4 className="text-xs font-bold text-slate-800">Recipient Phone: {selectedContactPhone}</h4>
                                        <span className="text-[9px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-bold">Standard Connection active</span>
                                    </div>

                                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                        {messages
                                            .filter(m => m.recipient_phone === selectedContactPhone)
                                            .map(msg => (
                                                <div key={msg.id} className="self-end bg-white max-w-[70%] ml-auto rounded-lg p-2.5 shadow-xs border border-slate-200 flex flex-col relative animate-in slide-in-from-bottom-2">

                                                    {msg.media_url && (
                                                        <div className="mb-2 bg-slate-50 border border-slate-150 rounded overflow-hidden">
                                                            {msg.message_type === 'image' && <img src={msg.media_url} alt="Attachment" className="max-h-36 object-cover" />}
                                                            {msg.message_type === 'video' && <div className="p-3 flex items-center gap-1.5"><Video size={13} /> Video clip</div>}
                                                            {msg.message_type === 'audio' && <div className="p-3 flex items-center gap-1.5"><Volume2 size={13} /> Audio voice note</div>}
                                                            {msg.message_type === 'document' && <div className="p-3 flex items-center gap-1.5"><FileText size={13} className="text-red-500" /> Syllabus doc</div>}
                                                        </div>
                                                    )}

                                                    <p className="text-[10.5px] leading-relaxed text-slate-850">{msg.content_text}</p>
                                                    <div className="flex items-center gap-0.5 justify-end mt-1 shrink-0">
                                                        <span className="text-[8px] text-slate-400 font-semibold">{msg.sent_at ? new Date(msg.sent_at).toLocaleTimeString() : 'Pending'}</span>
                                                        {msg.status === 'Read' && <CheckCheck size={10} className="text-blue-500" />}
                                                        {msg.status === 'Sent' && <Check size={10} className="text-slate-400" />}
                                                    </div>
                                                </div>
                                            ))}
                                    </div>

                                    <div className="bg-white border-t border-slate-200 p-3 flex flex-col gap-2 shrink-0">
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                placeholder="Fast text note payload..."
                                                value={directMsgText}
                                                onChange={e => setDirectMsgText(e.target.value)}
                                                className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none"
                                            />
                                            <button
                                                onClick={handleSendDirectMessage}
                                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1"
                                            >
                                                Send <Send size={11} />
                                            </button>
                                        </div>

                                        <div className="flex items-center gap-2 flex-wrap">
                                            <button
                                                onClick={() => { setDirectAttachmentType('image'); setDirectAttachmentUrl('https://picsum.photos/300/200'); toast.success('Mock Image attached.'); }}
                                                className="flex items-center gap-1 px-2 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-[9.5px] font-semibold text-slate-600"
                                            >
                                                <Image size={11} className="text-blue-500" /> Apply Image
                                            </button>
                                            <button
                                                onClick={() => { setDirectAttachmentType('document'); setDirectAttachmentUrl('https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'); toast.success('Mock PDF attached.'); }}
                                                className="flex items-center gap-1 px-2 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-[9.5px] font-semibold text-slate-600"
                                            >
                                                <FileText size={11} className="text-red-500" /> Apply Syllabus.pdf
                                            </button>
                                            {directAttachmentUrl && (
                                                <span className="text-[8px] bg-emerald-50 text-emerald-700 font-bold px-1.5 py-0.5 rounded">Attachment loaded: {directAttachmentType}</span>
                                            )}
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 text-xs font-medium">
                                    <Users size={32} className="text-slate-350 mb-2 animate-pulse" />
                                    Choose recipient lead from Left sidebar panel to view checkmarks Delivery Timeline.
                                </div>
                            )}
                        </div>

                    </div>
                )}

                {activeTab === 'media' && (
                    <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                            <h3 className="text-xs font-bold text-slate-705 uppercase tracking-wider">Outbox Media Library</h3>
                            <button
                                onClick={() => toast.success("Asset added to mock CDN.")}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5"
                            >
                                <Plus size={13} /> Add Assets
                            </button>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <div className="border border-slate-200 rounded-lg p-3 hover:shadow-sm transition-all text-center flex flex-col justify-between h-28 bg-slate-50/50">
                                <Image size={24} className="mx-auto text-blue-500 mt-2" />
                                <div className="space-y-0.5">
                                    <p className="text-[10px] font-bold text-slate-700 truncate">BannerImage.png</p>
                                    <p className="text-[8.5px] text-slate-450 truncate">Size: 450 KB</p>
                                </div>
                            </div>
                            <div className="border border-slate-200 rounded-lg p-3 hover:shadow-sm transition-all text-center flex flex-col justify-between h-28 bg-slate-50/50">
                                <FileText size={24} className="mx-auto text-red-500 mt-2" />
                                <div className="space-y-0.5">
                                    <p className="text-[10px] font-bold text-slate-700 truncate">AI_Syllabus.pdf</p>
                                    <p className="text-[8.5px] text-slate-450 truncate">Size: 1.2 MB</p>
                                </div>
                            </div>
                            <div className="border border-slate-200 rounded-lg p-3 hover:shadow-sm transition-all text-center flex flex-col justify-between h-28 bg-slate-50/50">
                                <Video size={24} className="mx-auto text-purple-500 mt-2" />
                                <div className="space-y-0.5">
                                    <p className="text-[10px] font-bold text-slate-700 truncate">CourseIntroVideo.mp4</p>
                                    <p className="text-[8.5px] text-slate-450 truncate">Size: 10.4 MB</p>
                                </div>
                            </div>
                            <div className="border border-slate-200 rounded-lg p-3 hover:shadow-sm transition-all text-center flex flex-col justify-between h-28 bg-slate-50/50">
                                <Volume2 size={24} className="mx-auto text-emerald-500 mt-2" />
                                <div className="space-y-0.5">
                                    <p className="text-[10px] font-bold text-slate-700 truncate">AudioWelcome.mp3</p>
                                    <p className="text-[8.5px] text-slate-450 truncate">Size: 180 KB</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </MainLayout>
    );
}
