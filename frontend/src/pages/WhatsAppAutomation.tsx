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
    const [activeTab, setActiveTab] = useState<'campaigns' | 'chat' | 'templates'>('campaigns');
    const [previewMode, setPreviewMode] = useState<'phone' | 'full'>('phone');
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [templates, setTemplates] = useState<any[]>([]);
    const [messages, setMessages] = useState<any[]>([]);
    const [contacts, setContacts] = useState<any[]>([]); // Connect CRM database contacts
    const [loading, setLoading] = useState(false);
    const [expandedCampaignId, setExpandedCampaignId] = useState<number | null>(null);

    // Advanced Template Mode inside Templates tab: 'send' (dispatcher) or 'create' (creator)
    const [templateTabMode, setTemplateTabMode] = useState<'send' | 'create'>('send');

    // Campaign Dispatch state
    const [campaignName, setCampaignName] = useState('');
    const [selectedTemplateId, setSelectedTemplateId] = useState<number | ''>('');
    const [recipientSearchText, setRecipientSearchText] = useState('');
    const [selectedFilterTags, setSelectedFilterTags] = useState<string[]>([]);
    const [selectedRecipients, setSelectedRecipients] = useState<any[]>([]); // selected recipient IDs/phones

    // Variable Toggles for Template placeholders
    const [variableMappings, setVariableMappings] = useState<Record<string, { type: 'field' | 'static'; value: string }>>({});

    // Tele CRM style Template Creator State
    const [creatorTplName, setCreatorTplName] = useState('');
    const [creatorCategory, setCreatorCategory] = useState<'Marketing' | 'Utility'>('Marketing');
    const [creatorHeaderType, setCreatorHeaderType] = useState<'none' | 'text' | 'image' | 'video' | 'document'>('none');
    const [creatorHeaderText, setCreatorHeaderText] = useState('');
    const [creatorHeaderMediaUrl, setCreatorHeaderMediaUrl] = useState('');
    const [creatorFilePreviewUrl, setCreatorFilePreviewUrl] = useState('');
    const [creatorBody, setCreatorBody] = useState('Hello {{1}}, welcome to the course {{2}}!');
    const [creatorFooter, setCreatorFooter] = useState('Type STOP to unsubscribe');

    // Interactive buttons list containing quick reply, call button, coupon button, or URL
    const [creatorButtonsList, setCreatorButtonsList] = useState<Array<{ type: 'quick_reply' | 'phone' | 'url' | 'coupon'; text: string; value: string }>>([
        { type: 'phone', text: 'Call', value: '+919876543210' },
        { type: 'quick_reply', text: 'Interested', value: '' },
        { type: 'url', text: 'Free Demo link', value: 'https://academyoftechmasters.com' }
    ]);

    // Regex variable extraction helper
    const extractVariables = (text: string) => {
        if (!text) return [];
        const regex = /\{\{([^}]+)\}\}/g;
        const matches: string[] = [];
        let match;
        while ((match = regex.exec(text)) !== null) {
            const raw = match[1].trim();
            if (!matches.includes(raw)) {
                matches.push(raw);
            }
        }
        return matches;
    };

    const activeTextContent = templates.find(t => t.id === Number(selectedTemplateId))?.content || "";

    useEffect(() => {
        const found = extractVariables(activeTextContent);
        setVariableMappings(prev => {
            const next = { ...prev };
            found.forEach(v => {
                if (!next[v]) {
                    const low = v.toLowerCase();
                    if (low.includes('name') || v === '1') {
                        next[v] = { type: 'field', value: 'name' };
                    } else if (low.includes('course') || v === '2') {
                        next[v] = { type: 'field', value: 'course' };
                    } else if (low.includes('phone') || v === '3') {
                        next[v] = { type: 'field', value: 'phone' };
                    } else {
                        next[v] = { type: 'static', value: '' };
                    }
                }
            });
            return next;
        });
    }, [activeTextContent]);

    // Gather and format all unique tags from contacts list
    const allTags = React.useMemo(() => {
        const tagsSet = new Set<string>();
        contacts.forEach(c => {
            if (c.tags) {
                if (Array.isArray(c.tags)) {
                    c.tags.forEach(t => tagsSet.add(t));
                } else if (typeof c.tags === 'string') {
                    c.tags.split(',').map(t => t.trim()).filter(Boolean).forEach(t => tagsSet.add(t));
                }
            }
        });
        return Array.from(tagsSet);
    }, [contacts]);

    // Filter contacts based on search query and tag selection filtering
    const filteredContacts = React.useMemo(() => {
        return contacts.filter(c => {
            const displayName = c.name || `${c.first_name || ''} ${c.last_name || ''}`.trim() || 'Lead';
            const matchesSearch = displayName.toLowerCase().includes(recipientSearchText.toLowerCase()) ||
                c.phone.includes(recipientSearchText);

            if (selectedFilterTags.length === 0) return matchesSearch;

            const contactTags = Array.isArray(c.tags)
                ? c.tags
                : typeof c.tags === 'string'
                    ? c.tags.split(',').map(t => t.trim()).filter(Boolean)
                    : [];

            const hasMatchingTag = selectedFilterTags.some(t => contactTags.includes(t));
            return matchesSearch && hasMatchingTag;
        });
    }, [contacts, recipientSearchText, selectedFilterTags]);

    // Direct Chat state
    const [selectedContactPhone, setSelectedContactPhone] = useState('');
    const [directMsgText, setDirectMsgText] = useState('');
    const [directAttachmentUrl, setDirectAttachmentUrl] = useState('');
    const [directAttachmentType, setDirectAttachmentType] = useState<string>('text');

    // On-demand specific tab fetching (Optimized performance prevents head-of-line serial requests blocking)
    const fetchCampaignsData = async () => {
        try {
            setLoading(true);
            const [campaignsRes, msgRes] = await Promise.all([
                apiClient.get('/whatsapp/campaigns'),
                apiClient.get('/whatsapp/messages')
            ]);
            setCampaigns(campaignsRes.data || []);
            setMessages(msgRes.data || []);
        } catch (e) {
            console.error("WhatsApp campaign fetch error:", e);
        } finally {
            setLoading(false);
        }
    };

    const fetchComposeData = async () => {
        try {
            setLoading(true);
            const tempRes = await apiClient.get('/whatsapp/templates');
            setTemplates(tempRes.data || []);
        } catch (e) {
            console.error("WhatsApp templates fetch error:", e);
        } finally {
            setLoading(false);
        }
    };

    const fetchChatData = async () => {
        try {
            setLoading(true);
            const [contactsRes, msgRes] = await Promise.all([
                apiClient.get('/contacts'),
                apiClient.get('/whatsapp/messages')
            ]);
            setContacts(contactsRes.data || []);
            setMessages(msgRes.data || []);
        } catch (e) {
            console.error("WhatsApp direct chat info fetch error:", e);
        } finally {
            setLoading(false);
        }
    };

    // Load active tab data instantly
    useEffect(() => {
        if (activeTab === 'campaigns') {
            fetchCampaignsData();
        } else if (activeTab === 'chat') {
            fetchChatData();
        } else if (activeTab === 'templates') {
            fetchChatData();
            fetchComposeData();
        }
    }, [activeTab]);

    const handleRefresh = () => {
        if (activeTab === 'campaigns') fetchCampaignsData();
        else if (activeTab === 'chat') fetchChatData();
        else if (activeTab === 'templates') {
            fetchChatData();
            fetchComposeData();
        }
    };

    // Campaign Actions
    const handleCampaignControl = async (id: number, action: 'pause' | 'resume' | 'cancel' | 'retry') => {
        try {
            const apiAction = action === 'retry' ? 'retry-failed' : action;
            await apiClient.post(`/whatsapp/campaigns/${id}/${apiAction}`);
            toast.success(`Campaign ${action} complete.`);
            fetchCampaignsData();
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
            fetchChatData();
        } catch (e) {
            toast.error("Send failed.");
        }
    };

    const handleDispatchCampaign = async () => {
        if (!campaignName) {
            toast.error("Please specify a campaign name.");
            return;
        }
        if (!selectedTemplateId) {
            toast.error("Please select a template to dispatch.");
            return;
        }
        if (selectedRecipients.length === 0) {
            toast.error("Please select at least one recipient contact.");
            return;
        }

        const templateObj = templates.find(t => t.id === Number(selectedTemplateId));
        if (!templateObj) {
            toast.error("Invalid template selected.");
            return;
        }

        const recipients = contacts
            .filter(c => selectedRecipients.includes(c.id || c.phone))
            .map(c => {
                const varsObj: Record<string, string> = {};
                const textToInspect = templateObj.content || "";
                const foundVars = extractVariables(textToInspect);

                foundVars.forEach(v => {
                    const mapping = variableMappings[v];
                    if (mapping) {
                        if (mapping.type === 'field') {
                            varsObj[v] = String(c[mapping.value] || "");
                        } else {
                            varsObj[v] = String(mapping.value || "");
                        }
                    } else {
                        varsObj[v] = "";
                    }
                });

                return {
                    phone: c.phone || "",
                    variables: varsObj
                };
            });

        try {
            setLoading(true);
            await apiClient.post('/whatsapp/campaigns', {
                name: campaignName,
                template_id: Number(selectedTemplateId),
                recipients,
                media_url: (templateObj.header_media_type && templateObj.header_media_type !== 'none' && templateObj.header_media_type !== 'text') ? (templateObj.header_media_ref || null) : null,
                message_type: (templateObj.header_media_type && templateObj.header_media_type !== 'none') ? templateObj.header_media_type : 'text'
            });
            toast.success("Bulk Template Campaign Dispatched successfully!");
            // Reset dispatch fields
            setCampaignName('');
            setSelectedRecipients([]);
            setSelectedTemplateId('');
            setActiveTab('campaigns');
            fetchCampaignsData();
        } catch (e) {
            toast.error("Failed to dispatch template campaign.");
        } finally {
            setLoading(false);
        }
    };

    // Hydrate template variables dynamically for preview display
    const getCampaignPreviewContent = () => {
        const templateObj = templates.find(t => t.id === Number(selectedTemplateId));
        let text = templateObj?.content || "";
        if (!text) {
            return "Select a template configuration...";
        }

        const found = extractVariables(text);
        found.forEach(v => {
            const mapping = variableMappings[v];
            let val = `{{${v}}}`;
            if (mapping) {
                if (mapping.type === 'field') {
                    // Try to resolve first selected contact or first general contact
                    const firstContact = contacts.find(c => selectedRecipients.includes(c.id || c.phone)) || contacts[0];
                    if (firstContact) {
                        val = firstContact[mapping.value] || `[${mapping.value}]`;
                    } else {
                        val = `[Lead ${mapping.value}]`;
                    }
                } else if (mapping.type === 'static') {
                    val = mapping.value || `[${v}]`;
                }
            }
            text = text.split(`{{${v}}}`).join(val);
        });
        return text;
    };

    // Template Creator Submit Handler
    const handleCreateTemplate = async () => {
        if (!creatorTplName) {
            toast.error("Please enter a template name.");
            return;
        }
        if (!/^[a-z0-9_]+$/.test(creatorTplName)) {
            toast.error("Template name must be lower snake_case (letters, numbers and underscores only).");
            return;
        }
        if (!creatorBody) {
            toast.error("Template body text is required.");
            return;
        }

        try {
            setLoading(true);
            const buttonsData = creatorButtonsList
                .filter(b => b.text.trim() !== "")
                .map(b => {
                    if (b.type === 'quick_reply') {
                        return { type: 'QUICK_REPLY', text: b.text };
                    } else if (b.type === 'phone') {
                        return { type: 'PHONE', text: b.text, value: b.value };
                    } else if (b.type === 'coupon') {
                        return { type: 'COUPON', text: b.text, value: b.value };
                    } else {
                        return { type: 'URL', text: b.text, value: b.value };
                    }
                });

            await apiClient.post('/whatsapp/templates', {
                name: creatorTplName,
                category: creatorCategory,
                content: creatorBody,
                header_text: creatorHeaderType === 'text' ? creatorHeaderText : null,
                header_media_type: creatorHeaderType === 'none' ? null : creatorHeaderType,
                header_media_ref: (creatorHeaderType !== 'none' && creatorHeaderType !== 'text') ? (creatorFilePreviewUrl || creatorHeaderMediaUrl || null) : null,
                footer_text: creatorFooter || null,
                buttons: buttonsData
            });

            toast.success("WhatsApp Template Created & Submitted for Meta Approval!");
            // Reset creator state
            setCreatorTplName('');
            setCreatorCategory('Marketing');
            setCreatorHeaderType('none');
            setCreatorHeaderText('');
            setCreatorHeaderMediaUrl('');
            setCreatorFilePreviewUrl('');
            setCreatorBody('Hello {{1}}, welcome to the course {{2}}!');
            setCreatorFooter('Type STOP to unsubscribe');
            setCreatorButtonsList([
                { type: 'phone', text: 'Call', value: '+919876543210' },
                { type: 'quick_reply', text: 'Interested', value: '' },
                { type: 'url', text: 'Free Demo link', value: 'https://academyoftechmasters.com' }
            ]);
            // Refresh local list
            const res = await apiClient.get('/whatsapp/templates');
            setTemplates(res.data || []);
            setActiveTab('campaigns');
        } catch (e) {
            toast.error("Failed to create template.");
        } finally {
            setLoading(false);
        }
    };

    const handleCancelTemplate = () => {
        setCreatorTplName('');
        setCreatorCategory('Marketing');
        setCreatorHeaderType('none');
        setCreatorHeaderText('');
        setCreatorHeaderMediaUrl('');
        setCreatorFilePreviewUrl('');
        setCreatorBody('Hello {{1}}, welcome to the course {{2}}!');
        setCreatorFooter('Type STOP to unsubscribe');
        setCreatorButtonsList([
            { type: 'phone', text: 'Call', value: '+919876543210' },
            { type: 'quick_reply', text: 'Interested', value: '' },
            { type: 'url', text: 'Free Demo link', value: 'https://academyoftechmasters.com' }
        ]);
        setActiveTab('campaigns');
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setCreatorFilePreviewUrl(url);
            setCreatorHeaderMediaUrl(file.name);
            toast.success(`Selected local media: ${file.name}`);
        }
    };

    const handleLoadSampleTemplate = () => {
        setCreatorTplName('ai_crash_course_alert');
        setCreatorCategory('Marketing');
        setCreatorHeaderType('image');
        setCreatorHeaderText('');
        setCreatorHeaderMediaUrl('');
        setCreatorFilePreviewUrl(''); // Initially displays "No File Selected" box exactly like screen mockup
        setCreatorBody(
            `🚀 *Transform Your Career with AI in Just 30 Days!* 🤖

🎓 *Academy of Tech Masters* presents the *30 Days AI Crash Course* – a practical, hands-on program designed for Students, Freshers, Working Professionals & Entrepreneurs.

📅 *Course Duration:* 30 Days
💻 *Mode:* Online & Offline

### 🔥 *What You'll Learn:*

✅ AI Fundamentals
✅ ChatGPT Basics & Prompt Engineering
✅ AI Image Generation
✅ Create Short & Long Videos using AI
✅ Reels & YouTube Shorts Creation
✅ Practical Assignments & Tests
✅ Real-World AI Applications

### 💡 *Why Join?*

⭐ Learn by Doing
⭐ Hands-on Practical Sessions
⭐ Industry-Oriented Projects
⭐ Certificate on Course Completion
⭐ Lifetime Valuable AI Skills

🎯 *No Coding Required!* Perfect for beginners who want to start their AI journey.

⚡ *Limited Seats Available!* Don't miss this opportunity to upgrade your skills and stay ahead in the AI era.
*THANK YOU*
Team AOTMS`
        );
        setCreatorFooter('Team AOTMS');
        setCreatorButtonsList([
            { type: 'phone', text: 'Call', value: '+919876543210' },
            { type: 'quick_reply', text: 'Interested', value: '' },
            { type: 'url', text: 'Free Demo link', value: 'https://academyoftechmasters.com' }
        ]);
        toast.success("Sample template auto-filled in form!");
    };

    // Format bold (*), italic (_), and strikethroughs (~) for visual WhatsApp styling
    const formatWhatsAppMarkdown = (text: string) => {
        if (!text) return "";
        let formatted = text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");

        formatted = formatted.replace(/\*([^*]+)\*/g, '<strong>$1</strong>');
        formatted = formatted.replace(/_([^_]+)_/g, '<em>$1</em>');
        formatted = formatted.replace(/~([^~]+)~/g, '<del>$1</del>');
        formatted = formatted.replace(/\n/g, '<br/>');
        return <span dangerouslySetInnerHTML={{ __html: formatted }} />;
    };

    // Calculate dynamic dashboard aggregates
    const totalOutbound = campaigns.reduce((acc, c) => acc + c.total_recipients, 0);
    const totalSent = campaigns.reduce((acc, c) => acc + c.sent_count, 0);
    const totalFailed = campaigns.reduce((acc, c) => acc + c.failed_count, 0) + campaigns.reduce((acc, c) => acc + c.duplicate_count, 0);
    const totalCostCoins = campaigns.reduce((acc, c) => acc + c.cost_total, 0);
    const successRate = totalSent > 0 ? Math.round(((totalSent - totalFailed) / totalSent) * 100) : 100;


    // Render creator helper function
    const renderTemplateCreator = () => {
        return (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

                <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-5 space-y-4">

                    {/* Predefined Sample Load Section */}
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-slate-800">
                        <div className="space-y-0.5">
                            <h4 className="text-xs font-bold text-emerald-800 flex items-center gap-1.5 uppercase tracking-wider">
                                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                Predefined Template Available
                            </h4>
                            <p className="text-[10.5px] text-emerald-700 leading-normal font-medium">
                                Quickly load the professional AOTMS 30-Day AI Crash Course Marketing Template as a sample configuration.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={handleLoadSampleTemplate}
                            className="shrink-0 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-[10.5px] rounded-lg transition-all shadow-xs border-0 cursor-pointer"
                        >
                            ⚡ Load Sample Template
                        </button>
                    </div>

                    <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Create WhatsApp Business Template</h3>
                        <span className="text-[10px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded font-extrabold uppercase">Meta API Sandbox</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1 border-0">Template Identifier</label>
                            <input
                                type="text"
                                placeholder="e.g. course_welcome_alert"
                                value={creatorTplName}
                                onChange={e => setCreatorTplName(e.target.value.toLowerCase())}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-500"
                            />
                            <span className="text-[8px] text-slate-400 mt-1 block">Lower snake_case, e.g. promo_offer_tpl</span>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1 border-0">Category</label>
                            <select
                                value={creatorCategory}
                                onChange={e => setCreatorCategory(e.target.value as any)}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
                            >
                                <option value="Marketing">Marketing</option>
                                <option value="Utility">Utility</option>
                            </select>
                        </div>
                    </div>

                    {/* Header Section */}
                    <div className="border border-slate-150 rounded-xl p-3.5 space-y-3 bg-white">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                            <span className="text-[10px] font-bold text-slate-700 uppercase">Configure Template Header</span>
                            <select
                                value={creatorHeaderType}
                                onChange={e => {
                                    setCreatorHeaderType(e.target.value as any);
                                    setCreatorFilePreviewUrl('');
                                    setCreatorHeaderMediaUrl('');
                                }}
                                className="px-2 py-1 bg-slate-50 border border-slate-200 rounded text-[9.5px] font-bold text-slate-650 cursor-pointer focus:outline-none"
                            >
                                <option value="none">None</option>
                                <option value="text">Text Header</option>
                                <option value="image">Media (Image)</option>
                                <option value="video">Media (Video)</option>
                                <option value="document">Media (Document)</option>
                            </select>
                        </div>

                        {creatorHeaderType === 'text' && (
                            <div>
                                <label className="block text-[8.5px] font-extrabold text-slate-700 uppercase mb-1 border-0">Header Title Text</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Welcome {{1}} to Academy of Tech Masters!"
                                    value={creatorHeaderText}
                                    onChange={e => setCreatorHeaderText(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                                />
                            </div>
                        )}

                        {creatorHeaderType !== 'none' && creatorHeaderType !== 'text' && (
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-[8.5px] font-extrabold text-slate-700 uppercase mb-1 border-0">Choose Media (Upload Local Image/File)</label>
                                    <div className="flex items-center gap-3">
                                        <div className="border border-dashed border-slate-200 hover:border-slate-350 rounded-lg p-3 text-center transition-all relative cursor-pointer bg-slate-50/50 flex-1">
                                            <input
                                                type="file"
                                                accept={creatorHeaderType === 'image' ? 'image/*' : creatorHeaderType === 'video' ? 'video/*' : '.pdf,.docx,.xlsx'}
                                                onChange={handleFileChange}
                                                className="absolute inset-0 opacity-0 cursor-pointer"
                                            />
                                            <UploadCloud size={18} className="mx-auto text-blue-500 mb-0.5" />
                                            <span className="text-[10px] font-extrabold text-slate-700 block">Click to upload template {creatorHeaderType}</span>
                                            <span className="text-[7.5px] text-slate-400 font-semibold block uppercase">Up to 25MB Files supported</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="block text-[8.5px] font-extrabold text-slate-700 uppercase border-0">Or Enter Remote HTTPS URL</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. https://res.cloudinary.com/demo/image/upload/sample.jpg"
                                        value={creatorHeaderMediaUrl}
                                        onChange={e => setCreatorHeaderMediaUrl(e.target.value)}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Body Copy Section */}
                    <div className="border border-slate-150 rounded-xl p-3.5 space-y-2 bg-white">
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] font-bold text-slate-700 uppercase">Configure Message Body</span>
                            <div className="flex bg-slate-100 rounded-lg p-0.5 text-[8.5px] font-extrabold">
                                <button
                                    type="button"
                                    onClick={() => setCreatorBody(prev => prev + " {{1}}")}
                                    className="px-2 py-0.5 hover:bg-white rounded transition-colors text-slate-650"
                                >
                                    + Add {"{{1}}"}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setCreatorBody(prev => prev + " {{2}}")}
                                    className="px-2 py-0.5 hover:bg-white rounded transition-colors text-slate-650"
                                >
                                    + Add {"{{2}}"}
                                </button>
                            </div>
                        </div>
                        <textarea
                            rows={4}
                            placeholder="Enter the template main body copy here..."
                            value={creatorBody}
                            onChange={e => setCreatorBody(e.target.value)}
                            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-450 focus:outline-none focus:border-emerald-500 leading-relaxed font-sans"
                        />
                    </div>

                    {/* Footer Section */}
                    <div className="border border-slate-150 rounded-xl p-3.5 space-y-2 bg-white">
                        <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1 border-0">Template Footer Label (Optional)</label>
                        <input
                            type="text"
                            placeholder="e.g. Reply STOP to opt out"
                            value={creatorFooter}
                            onChange={e => setCreatorFooter(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                        />
                    </div>

                    {/* Quick Reply & Contact Actions Buttons Section */}
                    <div className="border border-slate-150 rounded-xl p-3.5 space-y-3.5 bg-white">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                            <div className="space-y-0.5">
                                <span className="text-[10px] font-bold text-slate-700 uppercase block">Outbound Call & Quick Reply Buttons</span>
                                <span className="text-[7.5px] text-slate-400 block font-semibold">Add up to 3 interactive campaign action elements</span>
                            </div>
                            {creatorButtonsList.length < 3 && (
                                <button
                                    type="button"
                                    onClick={() => setCreatorButtonsList(prev => [...prev, { type: 'quick_reply', text: 'New Button', value: '' }])}
                                    className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded text-[9px] font-bold text-blue-650 flex items-center gap-1 cursor-pointer"
                                >
                                    <Plus size={11} /> Add Action
                                </button>
                            )}
                        </div>

                        {creatorButtonsList.length > 0 && (
                            <div className="space-y-2.5">
                                {creatorButtonsList.map((btn, idx) => (
                                    <div key={idx} className="flex gap-2 items-center bg-slate-50 p-2 rounded-lg border border-slate-200">
                                        <select
                                            value={btn.type}
                                            onChange={e => {
                                                const copy = [...creatorButtonsList];
                                                copy[idx].type = e.target.value as any;
                                                copy[idx].value = '';
                                                setCreatorButtonsList(copy);
                                            }}
                                            className="w-1/4 px-2 py-1 bg-white border border-slate-200 rounded text-xs font-semibold text-slate-700 cursor-pointer focus:outline-none"
                                        >
                                            <option value="quick_reply">Quick Reply</option>
                                            <option value="phone">Call Phone</option>
                                            <option value="url">Visit URL</option>
                                            <option value="coupon">Apply Coupon</option>
                                        </select>
                                        <input
                                            type="text"
                                            placeholder="Label Text"
                                            value={btn.text}
                                            onChange={e => {
                                                const copy = [...creatorButtonsList];
                                                copy[idx].text = e.target.value;
                                                setCreatorButtonsList(copy);
                                            }}
                                            className="w-1/3 px-2 py-1 bg-white border border-slate-200 rounded text-xs font-semibold placeholder-slate-400 focus:outline-none"
                                        />
                                        {btn.type !== 'quick_reply' && (
                                            <input
                                                type="text"
                                                placeholder={btn.type === 'phone' ? 'Phone e.g. +91...' : btn.type === 'coupon' ? 'Code e.g. OFF50' : 'URL e.g. https://'}
                                                value={btn.value}
                                                onChange={e => {
                                                    const copy = [...creatorButtonsList];
                                                    copy[idx].value = e.target.value;
                                                    setCreatorButtonsList(copy);
                                                }}
                                                className="flex-1 px-2 py-1 bg-white border border-slate-200 rounded text-xs font-semibold placeholder-slate-400 focus:outline-none"
                                            />
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => setCreatorButtonsList(prev => prev.filter((_, i) => i !== idx))}
                                            className="text-red-500 hover:text-red-700 cursor-pointer ml-1"
                                        >
                                            <Trash2 size={13} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Submit & Cancel Buttons */}
                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={handleCancelTemplate}
                            disabled={loading}
                            className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border-0"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleCreateTemplate}
                            disabled={loading}
                            className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-350 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer border-0"
                        >
                            <Plus size={14} /> Submit For Review
                        </button>
                    </div>

                </div>

                {/* Phone Display Preview Sync Mockup */}
                <div className="lg:col-span-5">
                    <div className="sticky top-6 bg-slate-100 rounded-2xl border border-slate-200 p-5 flex flex-col items-stretch justify-start relative overflow-hidden min-h-[480px]">

                        {/* Selector Header */}
                        <div className="w-full flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
                            <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Preview Console</span>
                            <div className="flex bg-slate-200/60 p-0.5 rounded-lg text-[9px] font-extrabold">
                                <button
                                    type="button"
                                    onClick={() => setPreviewMode('phone')}
                                    className={`px-3 py-1 rounded-md transition-all cursor-pointer border-0 ${previewMode === 'phone' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                                >
                                    📱 Mobile Mockup
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPreviewMode('full')}
                                    className={`px-3 py-1 rounded-md transition-all cursor-pointer border-0 ${previewMode === 'full' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                                >
                                    📄 Full Scroll Overview
                                </button>
                            </div>
                        </div>

                        {previewMode === 'phone' ? (
                            <div className="flex flex-col items-center">
                                <div className="w-64 h-[440px] bg-white rounded-3xl border-8 border-slate-800 shadow-2xl overflow-hidden flex flex-col relative shrink-0">

                                    <div className="h-6 bg-slate-800 flex items-center justify-between px-4 text-[9px] text-white shrink-0 font-bold">
                                        <span>23:59</span>
                                        <span>5G 🔋</span>
                                    </div>

                                    <div className="h-10 bg-emerald-707 flex items-center gap-2 px-3 text-white shrink-0 shadow-sm">
                                        <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center font-bold text-xs" style={{ minWidth: 24 }}>S</div>
                                        <div className="min-w-0">
                                            <p className="text-[10px] font-bold leading-tight text-white">Meta Sandbox Preview</p>
                                            <p className="text-[8px] text-emerald-250">Template Simulator</p>
                                        </div>
                                    </div>

                                    <div className="flex-1 overflow-y-auto bg-[#ede6df] p-3 space-y-2 flex flex-col justify-start">

                                        <div className="self-end bg-white max-w-[90%] rounded-lg p-2.5 shadow-xs border border-slate-200 flex flex-col relative space-y-1.5">
                                            {/* Render Media Header if configured */}
                                            {creatorHeaderType !== 'none' && (
                                                <div className="text-[9.5px] border-b border-slate-100 pb-1.5 text-slate-800">
                                                    {creatorHeaderType === 'text' ? (
                                                        <span className="font-extrabold select-none leading-snug">{creatorHeaderText || "[Template Header Context]"}</span>
                                                    ) : (
                                                        <div className="bg-slate-100 bg-slate-100/70 rounded-lg border border-dashed border-slate-350 flex flex-col items-center justify-center p-3 text-[9px] font-bold text-slate-450 uppercase relative overflow-hidden min-h-24">
                                                            {creatorFilePreviewUrl ? (
                                                                creatorHeaderType === 'image' ? (
                                                                    <img src={creatorFilePreviewUrl} className="w-full h-full object-cover" />
                                                                ) : creatorHeaderType === 'video' ? (
                                                                    <div className="flex flex-col items-center gap-1"><Video size={16} /> Rich Video</div>
                                                                ) : (
                                                                    <div className="flex flex-col items-center gap-1"><FileText size={16} /> Document Asset</div>
                                                                )
                                                            ) : creatorHeaderMediaUrl ? (
                                                                creatorHeaderType === 'image' ? (
                                                                    <img src={creatorHeaderMediaUrl} className="w-full h-full object-cover" />
                                                                ) : creatorHeaderType === 'video' ? (
                                                                    <div className="flex flex-col items-center gap-1"><Video size={16} /> Clip Preview</div>
                                                                ) : (
                                                                    <div className="flex flex-col items-center gap-1"><FileText size={16} /> Doc Preview</div>
                                                                )
                                                            ) : (
                                                                <div className="flex flex-col items-center justify-center text-center space-y-1.5 py-1 z-10 w-full h-full">
                                                                    <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center">
                                                                        <Image size={16} className="text-blue-500" />
                                                                    </div>
                                                                    <span className="text-[9.5px] font-extrabold text-blue-600 select-none normal-case">No file selected</span>
                                                                    <span className="text-[7.5px] text-slate-400 select-none normal-case font-medium">Please choose a local media file</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Render body formatted */}
                                            <div className="text-[10px] leading-relaxed text-slate-700 font-semibold break-words">
                                                {formatWhatsAppMarkdown(
                                                    creatorBody.replace(/\{\{(\d+)\}\}/g, (match, dig) => {
                                                        return `[Placeholder ${dig}]`;
                                                    })
                                                )}
                                            </div>

                                            {/* Render footer */}
                                            {creatorFooter && (
                                                <div className="text-[8px] text-slate-400 select-none font-bold uppercase tracking-wide">
                                                    {creatorFooter}
                                                </div>
                                            )}

                                            <div className="flex items-center gap-0.5 justify-end mt-1 shrink-0">
                                                <span className="text-[7.5px] text-slate-400 font-semibold">23:59</span>
                                                <CheckCheck size={9} className="text-blue-500" />
                                            </div>
                                        </div>

                                        {/* Action Buttons Render Below Bubble exactly like Meta layout */}
                                        <div className="space-y-1 pb-1">
                                            {creatorButtonsList.filter(b => b.text.trim() !== "").map((btn, i) => (
                                                <div
                                                    key={i}
                                                    className="bg-white hover:bg-slate-50 transition-colors py-1.5 rounded-lg text-blue-600 font-extrabold text-[9.5px] flex items-center justify-center gap-1 border border-slate-100 shadow-xs cursor-pointer select-none"
                                                >
                                                    {btn.type === 'phone' ? '📞' : btn.type === 'url' ? '🔗' : btn.type === 'coupon' ? '🏷️' : '💬'} {btn.text}
                                                </div>
                                            ))}
                                        </div>

                                    </div>

                                    <div className="h-10 bg-slate-50 border-t border-slate-205 flex items-center px-2 shrink-0 gap-1 select-none">
                                        <div className="flex-1 bg-white border border-slate-200 rounded-full h-7 px-3 text-[9px] text-slate-450 flex items-center font-medium">Type message...</div>
                                        <div className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center text-white"><Send size={10} /></div>
                                    </div>

                                </div>
                                <span className="text-[10px] text-slate-455 font-bold mt-3">Interactive Mobile Display Sync Mockup</span>
                            </div>
                        ) : (
                            <div className="w-full flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
                                <div className="bg-emerald-50 border-b border-emerald-100 px-4 py-2.5 flex items-center justify-between shrink-0">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                        <span className="text-xs font-bold text-emerald-950">Full Landscape Overview</span>
                                    </div>
                                    <span className="text-[9px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-extrabold uppercase">Live Hydrated</span>
                                </div>

                                <div className="flex-1 overflow-y-auto p-5 bg-[#ede6df] space-y-4">
                                    <div className="bg-white rounded-xl p-5 shadow-xs border border-slate-200 flex flex-col relative space-y-3 mx-auto max-w-lg">
                                        {/* Render Media Header if configured */}
                                        {creatorHeaderType !== 'none' && (
                                            <div className="text-[10px] border-b border-slate-100 pb-2 text-slate-800">
                                                {creatorHeaderType === 'text' ? (
                                                    <span className="font-extrabold select-none leading-snug text-xs">{creatorHeaderText || "[Template Header Context]"}</span>
                                                ) : (
                                                    <div className="bg-slate-100/70 rounded-lg border border-dashed border-slate-350 flex flex-col items-center justify-center p-4 text-[10px] font-bold text-slate-500 uppercase relative overflow-hidden min-h-32">
                                                        {creatorFilePreviewUrl ? (
                                                            creatorHeaderType === 'image' ? (
                                                                <img src={creatorFilePreviewUrl} className="w-full h-full object-cover rounded" />
                                                            ) : creatorHeaderType === 'video' ? (
                                                                <div className="flex flex-col items-center gap-1.5"><Video size={20} className="text-emerald-600" /> Rich Video Asset Loaded</div>
                                                            ) : (
                                                                <div className="flex flex-col items-center gap-1.5"><FileText size={20} className="text-emerald-600" /> Document Asset Loaded</div>
                                                            )
                                                        ) : creatorHeaderMediaUrl ? (
                                                            creatorHeaderType === 'image' ? (
                                                                <img src={creatorHeaderMediaUrl} className="w-full h-full object-cover rounded" />
                                                            ) : creatorHeaderType === 'video' ? (
                                                                <div className="flex flex-col items-center gap-1.5"><Video size={20} className="text-emerald-600" /> Web Clip Preview</div>
                                                            ) : (
                                                                <div className="flex flex-col items-center gap-1.5"><FileText size={20} className="text-emerald-600" /> Web Doc Preview</div>
                                                            )
                                                        ) : (
                                                            <div className="flex flex-col items-center justify-center text-center space-y-2 py-2 w-full h-full">
                                                                <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
                                                                    <Image size={20} className="text-blue-500" />
                                                                </div>
                                                                <span className="text-[10px] font-extrabold text-blue-600 select-none normal-case">No asset selected</span>
                                                                <span className="text-[8px] text-slate-400 select-none normal-case font-medium">Please choose a file or URL link</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Render body formatted */}
                                        <div className="text-[11.5px] leading-relaxed text-slate-700 font-semibold break-words whitespace-pre-wrap">
                                            {formatWhatsAppMarkdown(
                                                creatorBody.replace(/\{\{(\d+)\}\}/g, (match, dig) => {
                                                    return `[Placeholder ${dig}]`;
                                                })
                                            )}
                                        </div>

                                        {/* Render footer */}
                                        {creatorFooter && (
                                            <div className="text-[9px] text-slate-400 select-none font-bold uppercase tracking-wide border-0 pt-1">
                                                {creatorFooter}
                                            </div>
                                        )}

                                        <div className="flex items-center gap-0.5 justify-end mt-2 shrink-0">
                                            <span className="text-[8px] text-slate-400 font-semibold">23:59</span>
                                            <CheckCheck size={10} className="text-blue-500" />
                                        </div>
                                    </div>

                                    {/* Action Buttons Render Below Bubble exactly like Meta layout */}
                                    <div className="space-y-1.5 max-w-lg mx-auto">
                                        {creatorButtonsList.filter(b => b.text.trim() !== "").map((btn, i) => (
                                            <div
                                                key={i}
                                                className="bg-white hover:bg-slate-50 transition-colors py-2 rounded-lg text-blue-600 font-extrabold text-[10px] flex items-center justify-center gap-1 border border-slate-100 shadow-xs cursor-pointer select-none"
                                            >
                                                {btn.type === 'phone' ? '📞' : btn.type === 'url' ? '🔗' : btn.type === 'coupon' ? '🏷️' : '💬'} {btn.text}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                    </div>
                </div>

            </div>
        );
    };


    // Render dispatcher helper function
    const renderCampaignDispatcher = () => {
        return (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-5 space-y-4">
                    <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Send Template Campaign</h3>
                        <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded font-extrabold uppercase">Campaign Outbox</span>
                    </div>

                    {/* Campaign Name Field */}
                    <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Campaign Identifier Name</label>
                        <input
                            type="text"
                            placeholder="e.g. welcome_batch_august"
                            value={campaignName}
                            onChange={e => setCampaignName(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                        />
                    </div>

                    {/* Select Approved Template */}
                    <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Approved WhatsApp Template</label>
                        <select
                            value={selectedTemplateId}
                            onChange={e => {
                                setSelectedTemplateId(e.target.value === '' ? '' : Number(e.target.value));
                                setSelectedRecipients([]);
                            }}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
                        >
                            {loading ? (
                                <option value="">Loading templates...</option>
                            ) : (
                                <>
                                    <option value="">Select Pre-approved Template</option>
                                    {templates.map(t => (
                                        <option key={t.id} value={t.id}>[{t.approval_status}] {t.name}</option>
                                    ))}
                                </>
                            )}
                        </select>
                    </div>

                    {/* CRM Recipients Selector Section */}
                    <div className="border border-slate-150 rounded-xl p-3.5 space-y-3 bg-white">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                            <span className="text-[10px] font-extrabold text-slate-700 uppercase">Recipients Selection</span>
                            <span className="text-[8.5px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-bold">Filtered: {filteredContacts.length} contacts</span>
                        </div>

                        {/* Search & Tag Filter badges */}
                        <div className="space-y-2">
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2 text-slate-400" size={13} style={{ top: '10px' }} />
                                <input
                                    type="text"
                                    placeholder="Search contacts by name or phone..."
                                    value={recipientSearchText}
                                    onChange={e => setRecipientSearchText(e.target.value)}
                                    className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none"
                                />
                            </div>

                            {/* Tags horizontal list */}
                            {allTags.length > 0 && (
                                <div className="space-y-1">
                                    <label className="block text-[8px] font-bold text-slate-400 uppercase">Filter by CRM Tags</label>
                                    <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto pt-0.5">
                                        {allTags.map(tag => {
                                            const isSelected = selectedFilterTags.includes(tag);
                                            return (
                                                <button
                                                    key={tag}
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedFilterTags(prev =>
                                                            isSelected ? prev.filter(t => t !== tag) : [...prev, tag]
                                                        );
                                                    }}
                                                    className={`px-2 py-0.5 rounded-full text-[9px] font-bold transition-all border cursor-pointer ${isSelected
                                                        ? 'bg-emerald-600 text-white border-emerald-600'
                                                        : 'bg-slate-50 text-slate-655 border-slate-200 hover:bg-slate-100'
                                                        }`}
                                                >
                                                    {tag}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Contact selection table/list */}
                        <div className="border border-slate-150 rounded-lg overflow-hidden">
                            <div className="bg-slate-50 px-3 py-2 flex items-center justify-between border-b border-slate-150">
                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={filteredContacts.length > 0 && filteredContacts.every(c => selectedRecipients.includes(c.id || c.phone))}
                                        onChange={e => {
                                            if (e.target.checked) {
                                                const allFiltered = filteredContacts.map(c => c.id || c.phone);
                                                setSelectedRecipients(prev => Array.from(new Set([...prev, ...allFiltered])));
                                            } else {
                                                const allFiltered = filteredContacts.map(c => c.id || c.phone);
                                                setSelectedRecipients(prev => prev.filter(r => !allFiltered.includes(r)));
                                            }
                                        }}
                                        className="h-3 w-3 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500 cursor-pointer"
                                    />
                                    <span className="text-[10px] font-extrabold text-slate-555 uppercase">Select All Filtered</span>
                                </label>
                                <span className="text-[10px] text-slate-600 font-extrabold">
                                    {selectedRecipients.filter(r => filteredContacts.some(c => (c.id || c.phone) === r)).length} / {filteredContacts.length} Selected
                                </span>
                            </div>

                            <div className="max-h-48 overflow-y-auto divide-y divide-slate-100">
                                {filteredContacts.length === 0 ? (
                                    <div className="p-4 text-center text-[10.5px] text-slate-450 italic">
                                        No matching CRM contacts found.
                                    </div>
                                ) : (
                                    filteredContacts.map(c => {
                                        const identifier = c.id || c.phone;
                                        const isChecked = selectedRecipients.includes(identifier);
                                        const displayName = c.name || `${c.first_name || ''} ${c.last_name || ''}`.trim() || 'Lead';
                                        const contactTags = Array.isArray(c.tags)
                                            ? c.tags
                                            : typeof c.tags === 'string'
                                                ? c.tags.split(',').map(tag => tag.trim()).filter(Boolean)
                                                : [];

                                        return (
                                            <div key={identifier} className="px-3 py-2 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                                <label className="flex items-center gap-3 cursor-pointer select-none min-w-0 flex-1">
                                                    <input
                                                        type="checkbox"
                                                        checked={isChecked}
                                                        onChange={() => {
                                                            setSelectedRecipients(prev =>
                                                                isChecked
                                                                    ? prev.filter(r => r !== identifier)
                                                                    : [...prev, identifier]
                                                            );
                                                        }}
                                                        className="h-3 w-3 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500 cursor-pointer"
                                                    />
                                                    <div className="w-5 h-5 rounded-full bg-slate-105 flex items-center justify-center text-[9px] font-bold text-slate-650 shrink-0 uppercase">
                                                        {displayName[0] || 'L'}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <span className="text-xs font-bold text-slate-700 block truncate">{displayName}</span>
                                                        <span className="text-[9px] text-slate-400 font-semibold block">{c.phone}</span>
                                                    </div>
                                                </label>
                                                <div className="flex gap-1 flex-wrap justify-end shrink-0 max-w-[40%]">
                                                    {contactTags.map(t => (
                                                        <span key={t} className="text-[8px] bg-slate-100 border border-slate-200 text-slate-650 font-extrabold px-1 py-0.2 rounded-full uppercase">{t}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Dynamic Variable Mapping Matrix */}
                    {extractVariables(activeTextContent).length > 0 && (
                        <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/50 space-y-2.5">
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wide">Variables Hydration Matrix</span>
                                <span className="text-[8px] bg-slate-205 text-slate-655 px-1.5 py-0.5 rounded font-bold">Dynamic Hydration</span>
                            </div>
                            <div className="space-y-2 max-h-48 overflow-y-auto divide-y divide-slate-100">
                                {extractVariables(activeTextContent).map((variable) => {
                                    const mapping = variableMappings[variable] || { type: 'static', value: '' };
                                    return (
                                        <div key={variable} className="pt-2 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                                            <span className="font-bold text-slate-600 shrink-0 text-[11px] sm:min-w-28">
                                                Variable: <code className="bg-emerald-50 text-emerald-800 px-1 py-0.5 rounded text-[10px] font-mono font-bold">{`{{${variable}}}`}</code>
                                            </span>

                                            <div className="flex items-center gap-2 flex-1">
                                                <select
                                                    value={mapping.type}
                                                    onChange={e => {
                                                        const type = e.target.value as 'field' | 'static';
                                                        setVariableMappings(prev => ({
                                                            ...prev,
                                                            [variable]: { type, value: type === 'field' ? 'name' : '' }
                                                        }));
                                                    }}
                                                    className="px-2 py-1 bg-white border border-slate-200 rounded text-[10px] font-semibold text-slate-600 cursor-pointer"
                                                >
                                                    <option value="field">Map to CRM Field</option>
                                                    <option value="static">Static Fallback Value</option>
                                                </select>

                                                {mapping.type === 'field' ? (
                                                    <select
                                                        value={mapping.value}
                                                        onChange={e => {
                                                            setVariableMappings(prev => ({
                                                                ...prev,
                                                                [variable]: { type: 'field', value: e.target.value }
                                                            }));
                                                        }}
                                                        className="flex-1 px-2 py-1 bg-white border border-slate-200 rounded text-[10px] font-semibold text-slate-700 cursor-pointer"
                                                    >
                                                        <option value="name">Contact Customer Name (name)</option>
                                                        <option value="phone">Contact Mobile Number (phone)</option>
                                                        <option value="course">Assigned Course (course)</option>
                                                    </select>
                                                ) : (
                                                    <input
                                                        type="text"
                                                        placeholder="Enter hardcoded default value"
                                                        value={mapping.value}
                                                        onChange={e => {
                                                            setVariableMappings(prev => ({
                                                                ...prev,
                                                                [variable]: { type: 'static', value: e.target.value }
                                                            }));
                                                        }}
                                                        className="flex-1 px-2.5 py-1 bg-white border border-slate-200 rounded text-[10px] font-semibold text-slate-800 focus:outline-none"
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <button
                        onClick={handleDispatchCampaign}
                        disabled={loading}
                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-350 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer border-0"
                    >
                        <Send size={14} /> Dispatch WhatsApp Campaign
                    </button>
                </div>

                {/* Simulated Mockup Phone preview of approved template */}
                <div className="lg:col-span-5">
                    <div className="sticky top-6 bg-slate-105 rounded-2xl border border-slate-200 p-5 flex flex-col items-stretch justify-start relative overflow-hidden min-h-[480px]">

                        {/* Selector Header */}
                        <div className="w-full flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
                            <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Preview Console</span>
                            <div className="flex bg-slate-200/60 p-0.5 rounded-lg text-[9px] font-extrabold">
                                <button
                                    type="button"
                                    onClick={() => setPreviewMode('phone')}
                                    className={`px-3 py-1 rounded-md transition-all cursor-pointer border-0 ${previewMode === 'phone' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                                >
                                    📱 Mobile Mockup
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPreviewMode('full')}
                                    className={`px-3 py-1 rounded-md transition-all cursor-pointer border-0 ${previewMode === 'full' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                                >
                                    📄 Full Scroll Overview
                                </button>
                            </div>
                        </div>

                        {previewMode === 'phone' ? (
                            <div className="flex flex-col items-center w-full">
                                <div className="w-64 h-[440px] bg-white rounded-3xl border-8 border-slate-800 shadow-2xl overflow-hidden flex flex-col relative shrink-0">
                                    <div className="h-6 bg-slate-800 flex items-center justify-between px-4 text-[9px] text-white shrink-0 font-bold">
                                        <span>23:59</span>
                                        <span>5G 🔋</span>
                                    </div>

                                    <div className="h-10 bg-emerald-700 flex items-center gap-2 px-3 text-white shrink-0 shadow-sm">
                                        <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center font-bold text-xs" style={{ minWidth: 24 }}>O</div>
                                        <div className="min-w-0">
                                            <p className="text-[10px] font-bold leading-tight text-white">Campaign Outbox Preview</p>
                                            <p className="text-[8px] text-emerald-250">Template Simulator</p>
                                        </div>
                                    </div>

                                    <div className="flex-1 overflow-y-auto bg-[#ede6df] p-3 space-y-2 flex flex-col justify-start">
                                        {selectedTemplateId ? (
                                            <div className="self-end bg-white max-w-[90%] rounded-lg p-2.5 shadow-xs border border-slate-200 flex flex-col relative space-y-1.5">
                                                {/* Render Media Header if template has media */}
                                                {(() => {
                                                    const templateObj = templates.find(t => t.id === Number(selectedTemplateId));
                                                    if (!templateObj) return null;
                                                    return (
                                                        <>
                                                            <div className="text-[10px] leading-relaxed text-slate-700 font-semibold break-words animate-in fade-in duration-200">
                                                                {formatWhatsAppMarkdown(getCampaignPreviewContent())}
                                                            </div>
                                                            <div className="flex items-center gap-0.5 justify-end mt-1 shrink-0">
                                                                <span className="text-[7.5px] text-slate-400 font-semibold">23:59</span>
                                                                <CheckCheck size={9} className="text-blue-500" />
                                                            </div>
                                                        </>
                                                    );
                                                })()}
                                            </div>
                                        ) : (
                                            <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                                                <AlertTriangle size={24} className="text-amber-500 mb-1.5" />
                                                <span className="text-[10px] font-extrabold text-slate-500 uppercase">Input Required</span>
                                                <span className="text-[8px] text-slate-400 leading-normal max-w-[140px] mt-0.5">Please select an approved Meta template to view the preview output.</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="h-10 bg-slate-50 border-t border-slate-200 flex items-center px-2 shrink-0 gap-1 select-none">
                                        <div className="flex-1 bg-white border border-slate-200 rounded-full h-7 px-3 text-[9px] text-slate-400 flex items-center font-medium">Type message...</div>
                                        <div className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center text-white"><Send size={10} /></div>
                                    </div>
                                </div>
                                <span className="text-[10px] text-slate-450 font-bold mt-3">Interactive Mobile Display Sync Mockup</span>
                            </div>
                        ) : (
                            <div className="w-full flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
                                <div className="bg-emerald-50 border-b border-emerald-100 px-4 py-2.5 flex items-center justify-between shrink-0">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                        <span className="text-xs font-bold text-emerald-950">Full Landscape Overview</span>
                                    </div>
                                    <span className="text-[9px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-extrabold uppercase">Live Hydrated</span>
                                </div>

                                <div className="flex-1 overflow-y-auto p-5 bg-[#ede6df] space-y-4 font-sans">
                                    {selectedTemplateId ? (
                                        <div className="bg-white rounded-xl p-5 shadow-xs border border-slate-200 flex flex-col relative space-y-3 mx-auto max-w-lg">
                                            <div className="text-[11.5px] leading-relaxed text-slate-700 font-semibold break-words whitespace-pre-wrap">
                                                {formatWhatsAppMarkdown(getCampaignPreviewContent())}
                                            </div>
                                            <div className="flex items-center gap-0.5 justify-end mt-2 shrink-0">
                                                <span className="text-[8px] text-slate-400 font-semibold">23:59</span>
                                                <CheckCheck size={10} className="text-blue-500" />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-white/50 rounded-xl max-w-lg mx-auto">
                                            <AlertTriangle size={28} className="text-amber-500 mb-2 animate-bounce" />
                                            <span className="text-[11px] font-extrabold text-slate-600 uppercase">Template Not Selected</span>
                                            <span className="text-[9.5px] text-slate-400 leading-normal max-w-[200px] mt-1 text-center font-medium">Please select an approved Meta template to view the hydrated spreadsheet preview.</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </div>
        );
    };

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
                        onClick={handleRefresh}
                        className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:border-slate-350 text-slate-700 rounded-lg text-xs font-semibold transition-all active:scale-95 cursor-pointer"
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
                        className={`px-4 py-2.5 text-sm font-bold transition-all border-b-2 cursor-pointer ${activeTab === 'campaigns' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
                    >
                        Campaign Monitors
                    </button>
                    <button
                        onClick={() => setActiveTab('chat')}
                        className={`px-4 py-2.5 text-sm font-bold transition-all border-b-2 cursor-pointer ${activeTab === 'chat' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
                    >
                        Direct Chat & Timelines
                    </button>
                    <button
                        onClick={() => setActiveTab('templates')}
                        className={`px-4 py-2.5 text-sm font-bold transition-all border-b-2 cursor-pointer ${activeTab === 'templates' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
                    >
                        WhatsApp Templates & Campaigns
                    </button>
                </div>

                {activeTab === 'campaigns' && (
                    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
                            <h3 className="text-xs font-bold text-slate-705 uppercase tracking-wider">Bulk Campaign Logs</h3>
                            <span className="text-[10px] text-slate-500">Real-time status updates</span>
                        </div>

                        <div className="divide-y divide-slate-100">
                            {loading ? (
                                <div className="p-8 text-center space-y-2">
                                    <RefreshCw className="animate-spin text-emerald-500 mx-auto" size={20} />
                                    <span className="text-xs text-slate-400 font-semibold block">Loading campaigns...</span>
                                </div>
                            ) : campaigns.length === 0 ? (
                                <div className="p-8 text-center text-slate-400 text-xs font-medium">
                                    No bulk campaigns launched yet. Head over to the Composer tab.
                                </div>
                            ) : (
                                campaigns.map((campaign) => {
                                    const progress = campaign.total_recipients > 0
                                        ? Math.round(((campaign.sent_count + campaign.failed_count + campaign.duplicate_count) / campaign.total_recipients) * 100)
                                        : 0;

                                    return (
                                        <div key={campaign.id} className="p-5 hover:bg-slate-50/15 transition-all border-b border-slate-100 last:border-0">
                                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
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

                                                <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                                                    <button
                                                        onClick={() => setExpandedCampaignId(expandedCampaignId === campaign.id ? null : campaign.id)}
                                                        className="p-1.5 hover:bg-slate-100 rounded border border-slate-205 text-[10px] font-bold text-slate-750 flex items-center gap-1 cursor-pointer transition-all"
                                                    >
                                                        {expandedCampaignId === campaign.id ? "Hide Logs" : "Outbox logs"}
                                                    </button>
                                                    {campaign.status === "Running" && (
                                                        <button
                                                            onClick={() => handleCampaignControl(campaign.id, 'pause')}
                                                            className="p-1.5 hover:bg-amber-50 rounded border border-slate-205 text-amber-600 hover:border-amber-200 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                                                        >
                                                            <Pause size={12} /> Pause
                                                        </button>
                                                    )}
                                                    {campaign.status === "Paused" && (
                                                        <button
                                                            onClick={() => handleCampaignControl(campaign.id, 'resume')}
                                                            className="p-1.5 hover:bg-blue-50 rounded border border-slate-205 text-blue-605 hover:border-blue-200 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                                                        >
                                                            <Play size={12} /> Resume
                                                        </button>
                                                    )}
                                                    {campaign.status === "Running" && (
                                                        <button
                                                            onClick={() => handleCampaignControl(campaign.id, 'cancel')}
                                                            className="p-1.5 hover:bg-rose-50 rounded border border-slate-205 text-rose-600 hover:border-rose-200 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                                                        >
                                                            <X size={12} /> Cancel
                                                        </button>
                                                    )}
                                                    {campaign.failed_count > 0 && (
                                                        <button
                                                            onClick={() => handleCampaignControl(campaign.id, 'retry')}
                                                            className="p-1.5 hover:bg-slate-100 rounded border border-slate-205 text-[10px] font-bold text-slate-700 flex items-center gap-1 cursor-pointer"
                                                        >
                                                            <RefreshCw size={12} /> Retry Failed
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Expandable Outbox Recipient Logs */}
                                            {expandedCampaignId === campaign.id && (
                                                <div className="mt-4 border-t border-slate-100 pt-3 space-y-2 animate-in fade-in duration-200">
                                                    <h5 className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Outbound Recipients & Statuses</h5>
                                                    <div className="bg-slate-50/50 rounded-lg border border-slate-200 divide-y divide-slate-100 max-h-48 overflow-y-auto">
                                                        {messages.filter(m => m.campaign_id === campaign.id).length === 0 ? (
                                                            <div className="p-4 text-center text-[10.5px] text-slate-450 italic">
                                                                No messages logged under this campaign yet.
                                                            </div>
                                                        ) : (
                                                            messages.filter(m => m.campaign_id === campaign.id).map(msg => (
                                                                <div key={msg.id} className="p-2.5 flex justify-between items-center text-[10.5px] font-semibold text-slate-700">
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="w-5 h-5 rounded-full bg-slate-200/50 text-[10px] flex items-center justify-center font-bold text-slate-600 uppercase">
                                                                            {(msg.recipient_phone || 'L')[0]}
                                                                        </div>
                                                                        <span>{msg.recipient_phone}</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-3">
                                                                        <span className="text-[9.5px] text-slate-450 truncate max-w-[240px] font-normal">{msg.content_text}</span>
                                                                        <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase ${msg.status === 'Read' ? 'bg-blue-105 bg-blue-50 text-blue-700' :
                                                                            msg.status === 'Sent' || msg.status === 'Delivered' ? 'bg-emerald-55 bg-emerald-50 text-emerald-700' :
                                                                                'bg-rose-55 bg-rose-50 text-rose-700'
                                                                            }`}>
                                                                            {msg.status}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            ))
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
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
                                {loading && contacts.length === 0 ? (
                                    <div className="p-8 text-center space-y-2">
                                        <RefreshCw className="animate-spin text-emerald-500 mx-auto" size={16} />
                                        <span className="text-[10px] text-slate-400 font-semibold block">Loading chats...</span>
                                    </div>
                                ) : (
                                    <>
                                        {/* Dynamic DB Contacts */}
                                        {contacts.map((contact) => {
                                            const displayName = contact.name || `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || 'Lead';
                                            const initial = displayName[0]?.toUpperCase() || 'L';
                                            return (
                                                <button
                                                    key={contact.id || contact.phone}
                                                    onClick={() => setSelectedContactPhone(contact.phone)}
                                                    className={`w-full p-3 text-left flex items-center gap-3 transition-colors cursor-pointer ${selectedContactPhone === contact.phone ? 'bg-emerald-50/55' : 'hover:bg-slate-100/30'}`}
                                                >
                                                    <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0 border border-emerald-100">
                                                        {initial}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-bold text-slate-800 text-normal">{displayName}</p>
                                                        <p className="text-[9px] text-slate-400 truncate">{contact.phone}</p>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                        {/* Fallback default list if no CRM database contacts exist yet */}
                                        {contacts.length === 0 && (
                                            <>
                                                <button
                                                    onClick={() => setSelectedContactPhone('9876543210')}
                                                    className={`w-full p-3 text-left flex items-center gap-3 transition-colors cursor-pointer ${selectedContactPhone === '9876543210' ? 'bg-emerald-50/55' : 'hover:bg-slate-100/30'}`}
                                                >
                                                    <div className="w-8 h-8 rounded-full bg-blue-105 bg-blue-50 text-blue-750 flex items-center justify-center font-bold text-xs shrink-0">J</div>
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-bold text-slate-800 text-normal">Jayaveer (Lead)</p>
                                                        <p className="text-[9px] text-slate-400 truncate">9876543210</p>
                                                    </div>
                                                </button>
                                                <button
                                                    onClick={() => setSelectedContactPhone('9123456789')}
                                                    className={`w-full p-3 text-left flex items-center gap-3 transition-colors cursor-pointer ${selectedContactPhone === '9123456789' ? 'bg-emerald-50/55' : 'hover:bg-slate-100/30'}`}
                                                >
                                                    <div className="w-8 h-8 rounded-full bg-purple-105 bg-purple-50 text-purple-750 flex items-center justify-center font-bold text-xs shrink-0">R</div>
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-bold text-slate-800 text-normal">Raman Kumar (Student)</p>
                                                        <p className="text-[9px] text-slate-400 truncate">9123456789</p>
                                                    </div>
                                                </button>
                                            </>
                                        )}
                                    </>
                                )}
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
                                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                                            >
                                                Send <Send size={11} />
                                            </button>
                                        </div>

                                        <div className="flex items-center gap-2 flex-wrap">
                                            <button
                                                onClick={() => { setDirectAttachmentType('image'); setDirectAttachmentUrl('https://picsum.photos/300/200'); toast.success('Mock Image attached.'); }}
                                                className="flex items-center gap-1 px-2 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-[9.5px] font-semibold text-slate-600 cursor-pointer"
                                            >
                                                <Image size={11} className="text-blue-500" /> Apply Image
                                            </button>
                                            <button
                                                onClick={() => { setDirectAttachmentType('document'); setDirectAttachmentUrl('https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'); toast.success('Mock PDF attached.'); }}
                                                className="flex items-center gap-1 px-2 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-[9.5px] font-semibold text-slate-600 cursor-pointer"
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



                {activeTab === 'templates' && (
                    <div className="space-y-4">
                        <div className="flex bg-slate-100 p-1 rounded-xl w-fit text-[11px] font-extrabold uppercase tracking-wider mb-2">
                            <button
                                type="button"
                                onClick={() => setTemplateTabMode('send')}
                                className={`px-4 py-1.5 rounded-lg transition-all cursor-pointer ${templateTabMode === 'send' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Send Template Campaign
                            </button>
                            <button
                                type="button"
                                onClick={() => setTemplateTabMode('create')}
                                className={`px-4 py-1.5 rounded-lg transition-all cursor-pointer ${templateTabMode === 'create' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Template Creator
                            </button>
                        </div>
                        {templateTabMode === 'send' ? renderCampaignDispatcher() : renderTemplateCreator()}
                    </div>
                )}

            </div>
        </MainLayout>
    );
}