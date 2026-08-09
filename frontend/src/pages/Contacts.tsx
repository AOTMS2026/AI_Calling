import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '../components/layout/MainLayout';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { apiClient } from '../api/client';
import { Loader2, Plus, Edit2, Phone, Mail, Building2, X, CheckCircle2, Trash2, Search, Tag, UploadCloud, History, Clock, DollarSign, Calendar, MessageCircle, ChevronDown, ChevronUp, PlayCircle, Activity, Coins, Target, Filter } from 'lucide-react';
import toast from 'react-hot-toast';

const VariableCell = ({ contact }: { contact: any }) => {
    const defaultVars = contact.customVariables || contact.metadata || contact.variables;
    const [vars, setVars] = useState<any>(defaultVars || null);
    const [loading, setLoading] = useState(false);
    const [fetched, setFetched] = useState(!!defaultVars);

    let filteredVars = vars ? { ...vars } : {};

    // Safely parse deeply stringified variable containers
    Object.keys(filteredVars).forEach(k => {
        if (typeof filteredVars[k] === 'string') {
            try {
                const parsed = JSON.parse(filteredVars[k]);
                if (typeof parsed === 'object' && parsed !== null) {
                    filteredVars = { ...filteredVars, ...parsed };
                    delete filteredVars[k];
                }
            } catch (e) {
                // Not a valid JSON payload, leave safely intact
            }
        }
    });



    if (Object.keys(filteredVars).length > 0) {
        return (
            <div className="flex flex-wrap gap-1.5 min-w-[200px]">
                {Object.entries(filteredVars).map(([k, v], i) => (
                    <span key={i} className="px-2.5 py-1 bg-white text-gray-700 rounded-lg text-[10px] font-medium border border-gray-200 shadow-sm flex items-center gap-1.5 whitespace-nowrap">
                        <span className="text-gray-400 font-bold">{k}:</span>
                        <span className="text-gray-900 truncate max-w-[150px]">
                            {(typeof v === 'string') ? v : JSON.stringify(v)}
                        </span>
                    </span>
                ))}
            </div>
        );
    }

    if (fetched) {
        return <span className="text-gray-300 italic text-[11px]">No Variables Mapped</span>;
    }

    return (
        <button
            type="button"
            className="px-3 py-1 bg-gray-50 border border-gray-100 text-gray-500 rounded-full text-[10px] font-bold hover:bg-gray-100 hover:text-gray-700 flex items-center gap-1.5 transition-colors shadow-sm"
            onClick={async (e) => {
                e.stopPropagation();
                setLoading(true);
                try {
                    const res = await apiClient.get(`/contacts/${contact.contactId || contact.id}/detail`);
                    const fetchVars = res.data?.data?.contact?.customVariables || res.data?.data?.contact?.metadata || res.data?.data?.contact?.variables || {};
                    setVars(fetchVars);
                    setFetched(true);
                } catch (err) {
                    toast.error("Failed to fetch node variables from Ravan");
                    setFetched(true);
                }
                setLoading(false);
            }}
        >
            {loading ? <Loader2 size={12} className="animate-spin text-teal-500" /> : <Search size={10} />}
            Reveal
        </button>
    );
};

export function Contacts() {
    const navigate = useNavigate();
    const [contacts, setContacts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Pagination States
    const [page, setPage] = useState(1);
    const PAGE_SIZE = 50;
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [createForm, setCreateForm] = useState({
        name: '', email: '', phone: '', notes: '', tags: '', campaignId: ''
    });
    const [metaVars, setMetaVars] = useState<{ key: string, value: string }[]>([]);
    const [isCreating, setIsCreating] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploadingCSV, setIsUploadingCSV] = useState(false);
    const [tagSearch, setTagSearch] = useState('');
    const [showTagMenu, setShowTagMenu] = useState(false);
    const [selectedContacts, setSelectedContacts] = useState<string[]>([]);

    // Edit Contact State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editContact, setEditContact] = useState<any>(null);
    const [editLoading, setEditLoading] = useState(false);

    // History Modal State
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [historyContact, setHistoryContact] = useState<any>(null);
    const [historyCalls, setHistoryCalls] = useState<any[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historyPage, setHistoryPage] = useState(1);
    const [historyTotal, setHistoryTotal] = useState(0);

    // Advanced Global Filter States
    const [selectedStatusFilter, setSelectedStatusFilter] = useState('');
    const [selectedTagFilter, setSelectedTagFilter] = useState('');



    // Secure CSV Metadata Flow State
    const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
    const [csvTargetCampaignId, setCsvTargetCampaignId] = useState('');
    const [csvBatchTags, setCsvBatchTags] = useState('');
    const [availableCampaigns, setAvailableCampaigns] = useState<any[]>([]);

    const fetchCampaigns = async () => {
        try {
            const res = await apiClient.get('/campaigns');
            if (res.data?.data) {
                setAvailableCampaigns(res.data.data);
                if (res.data.data.length > 0) setCsvTargetCampaignId(res.data.data[0].id);
            }
        } catch (e) { }
    };

    useEffect(() => {
        if (isCsvModalOpen || isCreateModalOpen) {
            fetchCampaigns();
        }
    }, [isCsvModalOpen, isCreateModalOpen]);

    const fetchHistory = async (contact: any, pageNum = 1) => {
        if (!contact) return;
        const phone = contact.phoneNumber || contact.phone;
        if (!phone) {
            toast.error("Contact does not have a phone number.");
            return;
        }

        setHistoryLoading(true);
        try {
            // Seamlessly fetch role and explicitly sandbox non-Admins
            const meRes = await apiClient.get('/auth/me');
            const agentFilter = meRes.data?.role !== 'admin' ? meRes.data?.ravan_agent_id : undefined;

            const res = await apiClient.get('/calling/phone-history', {
                params: {
                    phone: phone,
                    page: pageNum,
                    page_size: 10,
                    include_transcripts: true,
                    ...(agentFilter ? { agent_id: agentFilter } : {})
                }
            });
            setHistoryCalls(res.data?.data?.calls || res.data?.calls || []);
            setHistoryTotal(res.data?.data?.total_count || res.data?.total_count || 0);
        } catch (e: any) {
            console.error(e);
            toast.error("Failed to load call history.");
            setHistoryCalls([]);
        } finally {
            setHistoryLoading(false);
        }
    };

    // Compute unique global configurations dynamically
    const globalTags = Array.from(new Set(contacts.flatMap(c => c.tags || []))).filter(t => t.trim() !== '');
    const globalStatuses = Array.from(new Set(contacts.map(c => c.status || 'Pending'))).filter(Boolean);

    const fetchContacts = async () => {
        setLoading(true);
        try {
            const meRes = await apiClient.get('/auth/me');
            const user = meRes.data;
            const isCustomer = user.role !== 'admin';



            let queryParam = '';
            if (isCustomer) {
                // Fetch globally for customer and isolate purely via Sandbox matching on the frontend
                if (user.ravan_agent_id) queryParam += `${queryParam ? '&' : '?'}agent_id=${user.ravan_agent_id}`;
            }

            const res = await apiClient.get(`/contacts${queryParam}`);
            let fetchedContacts = res.data?.data || [];



            setContacts(fetchedContacts);
        } catch (e) {
            console.error(e);
            setContacts([]);
        } finally {
            setLoading(false);
        }
    };



    const handleDeleteContact = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!window.confirm("Delete this contact permanently?")) return;
        const tid = toast.loading("Deleting contact...");
        try {
            await apiClient.delete(`/contacts/${id}`);
            toast.success("Contact successfully eliminated from ecosystem.", { id: tid });
            fetchContacts();
        } catch (err) {
            console.error(err);
            toast.error("Failed to delete contact", { id: tid });
        }
    };

    const handleBulkDelete = async () => {
        if (!window.confirm(`Are you absolutely sure you want to permanently destroy ${selectedContacts.length} contacts?`)) return;
        const tid = toast.loading(`Bulk terminating ${selectedContacts.length} contacts...`);
        try {
            await apiClient.post(`/contacts/bulk-delete`, { ids: selectedContacts });
            toast.success(`Successfully annihilated ${selectedContacts.length} contacts via macro bulk queue!`, { id: tid });
            setSelectedContacts([]);
            fetchContacts();
        } catch (err) {
            console.error(err);
            toast.error("Fatal failure attempting to execute bulk deletion.", { id: tid });
        }
    };

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

            await apiClient.patch(`/contacts/${editContact.contactId || editContact.id}`, payload);
            toast.success("Contact successfully updated!");
            setIsEditModalOpen(false);

            fetchContacts();

        } catch (err: any) {
            console.error("Failed to update contact:", err);
            toast.error(err.response?.data?.detail || "Failed to edit contact payload");
        } finally {
            setEditLoading(false);
        }
    };

    useEffect(() => {
        fetchContacts();
    }, []);

    const handleCreateContact = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsCreating(true);

        const payload: any = {};
        Object.entries(createForm).forEach(([k, v]) => {
            if (k === 'tags') {
                if (v && v.trim() !== '') {
                    payload.tags = v.split(',').map((t: string) => t.trim()).filter((t) => t !== '');
                }
            } else if (v && v.trim() !== '') {
                if (k === 'campaignId') {
                    payload['campaign_id'] = v.trim();
                } else {
                    payload[k] = v.trim();
                }
            }
        });

        const meRes = await apiClient.get('/auth/me').catch(() => null);
        const user = meRes?.data || null;

        // Parse custom variables securely and map them strictly into a single UI pill as requested!
        const metadataObj: any = {};
        metaVars.forEach(v => {
            if (v.key.trim() !== '') {
                metadataObj[v.key.trim()] = v.value.trim();
            }
        });



        if (Object.keys(metadataObj).length > 0) {
            const bundledPill = { CustomVariables: JSON.stringify(metadataObj) };
            payload.metadata = bundledPill;
            payload.customVariables = bundledPill; // Unified string block to prevent multi-pills
        }

        // Implicit Secure Native Sandbox Binding!
        if (user && user.ravan_agent_id) {
            payload.agent_id = user.ravan_agent_id;
        }

        try {
            const res = await apiClient.post('/contacts/single', payload);
            toast.success("Contact successfully created!");
            setIsCreateModalOpen(false);
            setCreateForm({ name: '', email: '', phone: '', notes: '', tags: '', campaignId: '' });
            setTagSearch('');
            setMetaVars([]);

            // Immediately physically inject the new contact node into the UI array 
            // bypassing the campaign-filtered fetch route so you see it instantly!
            const newContact = res.data?.data?.contact || res.data?.data || { ...payload, id: `temp-${Date.now()}`, status: 'pending' };
            setContacts(prev => [newContact, ...prev]);
            // Trailing timeout removed - persist optimistic UI natively!
        } catch (e: any) {
            toast.error(e.response?.data?.detail || "Failed to create contact");
        } finally {
            setIsCreating(false);
        }
    };

    const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploadingCSV(true);
        const reader = new FileReader();

        reader.onload = async (event) => {
            try {
                const text = event.target?.result as string;
                const rows = text.split('\n').map(row => row.trim()).filter(row => row !== '');
                if (rows.length < 2) {
                    toast.error("CSV file is structurally completely empty or missing required data mapping headers.");
                    return;
                }

                // Strictly validate columns, stripping hidden Byte Order Marks (BOM)
                const rawHeaders = rows[0].replace(/^\uFEFF/, '').split(',').map(h => h.trim().toLowerCase().replace(/[^a-z0-9\s_]/g, ''));
                const VALID_HEADERS = ['name', 'phone', 'email', 'tags', 'notes', 'custom variables', 'customvariables'];

                const meRes = await apiClient.get('/auth/me').catch(() => null);
                const user = meRes?.data || null;

                const isValid = rawHeaders.every(h => VALID_HEADERS.includes(h) || h === '');
                if (!isValid) {
                    toast.error(`CSV Validation Error: Unrecognized header. Discovered: ${rawHeaders.join(', ')}`);
                    return;
                }
                if (!rawHeaders.includes('name') || !rawHeaders.includes('phone')) {
                    toast.error("CSV Strict Fatal: You must include 'Name' and 'Phone' closely mapped inside the first row headers.");
                    return;
                }

                const loadingToast = toast.loading(`Uploading ${rows.length - 1} contacts natively via batch process...`);
                let successCount = 0;
                let failCount = 0;

                const headers = rawHeaders;

                const newlyCreated: any[] = [];

                // Concurrent mapped burst execution!
                await Promise.all(rows.slice(1).map(async (row) => {
                    // Smart Regex to split by commas ONLY if they are outside double quotes!
                    const columns = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(col => {
                        let clean = col.trim();
                        if (clean.startsWith('"') && clean.endsWith('"')) {
                            clean = clean.substring(1, clean.length - 1).replace(/""/g, '"');
                        }
                        return clean;
                    });

                    const payload: any = { name: '', phone: '' };
                    let localMeta: any = {};

                    headers.forEach((h, i) => {
                        const val = columns[i];
                        if (!val) return;

                        if (h === 'name') payload.name = val;
                        if (h === 'phone') payload.phone = val.replace(/[^\d+]/g, '');
                        if (h === 'email') payload.email = val;
                        if (h === 'tags') {
                            const inlineTags = val.split(';').map(t => t.trim()).filter(Boolean);
                            const batchArr = csvBatchTags ? csvBatchTags.split(',').map(t => t.trim()).filter(Boolean) : [];
                            payload.tags = Array.from(new Set([...inlineTags, ...batchArr]));
                        }
                        if (h === 'notes') payload.notes = val;
                        if (h === 'custom variables' || h === 'customvariables') {
                            localMeta = { CustomVariables: val.replace(/\\"/g, '"') };
                        }
                    });

                    // Overload tags exclusively if none provided by header
                    if (!payload.tags || payload.tags.length === 0) {
                        const batchArr = csvBatchTags ? csvBatchTags.split(',').map(t => t.trim()).filter(Boolean) : [];
                        payload.tags = batchArr.length > 0 ? batchArr : ['Customer'];
                    }

                    // Dynamically structure name into discrete custom variables
                    const nameParts = payload.name ? payload.name.trim().split(/\s+/) : [''];
                    const firstName = nameParts[0] || '';
                    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

                    if (Object.keys(localMeta).length > 0) {
                        payload.metadata = localMeta;
                        payload.customVariables = { ...localMeta, first_name: firstName, last_name: lastName }; // Dual bind
                    } else {
                        payload.customVariables = { first_name: firstName, last_name: lastName };
                    }

                    // Implicit Bulk Sandbox Binding natively securely overriding
                    if (user && user.ravan_agent_id) {
                        payload.agent_id = user.ravan_agent_id;
                    }

                    try {
                        if (payload.phone && payload.name) {
                            const res = await apiClient.post('/contacts/single', payload);
                            const createdNode = res.data?.data?.contact || res.data?.data || { ...payload, id: `temp-${Date.now()}-${Math.random()}`, status: 'pending' };
                            newlyCreated.push(createdNode);
                            successCount++;
                        } else {
                            failCount++;
                        }
                    } catch (e) {
                        failCount++;
                    }
                }));

                toast.dismiss(loadingToast);
                toast.success(`CSV Import Complete: ${successCount} Successful, ${failCount} Failed.`);

                // Instantly inject new contacts natively bypassing asynchronous API indexing delay
                if (newlyCreated.length > 0) {
                    setContacts(prev => [...newlyCreated, ...prev]);

                    if (csvTargetCampaignId) {
                        try {
                            const cIds = newlyCreated.map(c => c.contactId || c.id).filter(Boolean);
                            await apiClient.post(`/campaigns/${csvTargetCampaignId}/bind-contacts`, { contactIds: cIds });
                            toast.success(`Successfully mapped ${cIds.length} contacts to Target Campaign natively!`);
                        } catch (e) {
                            console.error(e);
                        }
                    }

                    setIsCsvModalOpen(false); // Close batch modal successfully
                    setCsvTargetCampaignId('');
                    setCsvBatchTags('');
                }

                // Silent trailing fetch removed to preserve newly bound contacts securely inside the DOM state gracefully
            } catch (error) {
                toast.error("Fatal CSV parser crash. Verify text string layout.");
            } finally {
                setIsUploadingCSV(false);
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        };

        reader.readAsText(file);
    };

    const filteredContacts = contacts.filter(c => {
        const variablesString = JSON.stringify(c.customVariables || c.variables || c.metadata || {}).toLowerCase();

        const q = searchQuery.toLowerCase();
        const matchesSearch = (c.name || '').toLowerCase().includes(q) ||
            (c.phoneNumber || c.phone || '').includes(searchQuery) ||
            variablesString.includes(q);

        const matchesStatus = selectedStatusFilter === '' || (c.status || 'Pending') === selectedStatusFilter;
        const matchesTag = selectedTagFilter === '' || (c.tags && c.tags.includes(selectedTagFilter));

        return matchesSearch && matchesStatus && matchesTag;
    });

    const totalPages = Math.max(1, Math.ceil(filteredContacts.length / PAGE_SIZE));
    const paginatedContacts = filteredContacts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    useEffect(() => {
        setPage(1);
    }, [searchQuery, contacts.length]);

    return (
        <MainLayout>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h1 className="text-2xl font-bold text-gray-900">Global Contacts</h1>

                <div className="flex items-center gap-4">
                    <div className="relative flex flex-col md:flex-row gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input
                                type="text"
                                placeholder="Search Name, Phone, or Variables..."
                                className="pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 w-full md:w-64 transition-all"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <select
                            className="px-4 py-2.5 text-sm font-semibold border border-gray-200 rounded-xl bg-white text-gray-700 outline-none focus:ring-2 focus:ring-teal-500 appearance-none min-w-[140px] shadow-sm cursor-pointer"
                            value={selectedStatusFilter}
                            onChange={(e) => setSelectedStatusFilter(e.target.value)}
                        >
                            <option value="">All Statuses</option>
                            {globalStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>

                        <select
                            className="px-4 py-2.5 text-sm font-semibold border border-gray-200 rounded-xl bg-white text-gray-700 outline-none focus:ring-2 focus:ring-teal-500 appearance-none min-w-[140px] shadow-sm cursor-pointer"
                            value={selectedTagFilter}
                            onChange={(e) => setSelectedTagFilter(e.target.value)}
                        >
                            <option value="">All Tags</option>
                            {globalTags.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                    {selectedContacts.length > 0 ? (
                        <div className="flex items-center gap-3 animate-in fade-in zoom-in-95">
                            <span className="text-sm font-bold text-gray-700 bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200">
                                {selectedContacts.length} Selected
                            </span>
                            <Button
                                variant="outline"
                                className="bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 border-red-200 font-bold tracking-wide"
                                onClick={handleBulkDelete}
                            >
                                <Trash2 size={16} className="mr-2" /> Bulk Delete
                            </Button>
                            <Button
                                variant="outline"
                                className="text-gray-500 hover:bg-gray-100 border-transparent shadow-none"
                                onClick={() => setSelectedContacts([])}
                            >
                                Cancel
                            </Button>
                        </div>
                    ) : (
                        <>
                            <Button variant="outline" onClick={fetchContacts}>Refresh</Button>
                            <input
                                type="file"
                                accept=".csv"
                                className="hidden"
                                ref={fileInputRef}
                                onChange={handleCSVUpload}
                            />
                            <Button
                                variant="outline"
                                className="text-gray-700 bg-white"
                                onClick={() => setIsCsvModalOpen(true)}
                                disabled={isUploadingCSV}
                            >
                                {isUploadingCSV ? <Loader2 size={16} className="animate-spin mr-2" /> : <UploadCloud size={16} className="mr-2 text-gray-500" />}
                                Import CSV
                            </Button>
                            <Button className="bg-teal-600 hover:bg-teal-700 text-white" onClick={() => setIsCreateModalOpen(true)}>
                                <Plus size={16} className="mr-2" /> New Contact
                            </Button>
                        </>
                    )}
                </div>
            </div>

            <Card className="shadow-sm overflow-hidden">
                <CardContent className="p-0 overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap min-w-[700px]">
                        <thead className="bg-gray-50/50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 w-12 text-center">
                                    <input
                                        type="checkbox"
                                        className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                                        checked={filteredContacts.length > 0 && selectedContacts.length === filteredContacts.length}
                                        onChange={(e) => {
                                            if (e.target.checked) setSelectedContacts(filteredContacts.map(c => c.contactId || c.id));
                                            else setSelectedContacts([]);
                                        }}
                                    />
                                </th>
                                <th className="px-6 py-4 font-semibold text-gray-400 uppercase tracking-wider text-xs w-1/4">Contact Name</th>
                                <th className="px-6 py-4 font-semibold text-gray-400 uppercase tracking-wider text-xs">Contact Info</th>
                                <th className="px-6 py-4 font-semibold text-gray-400 uppercase tracking-wider text-xs">Status</th>
                                <th className="px-6 py-4 font-semibold text-gray-400 uppercase tracking-wider text-xs">Campaigns</th>
                                <th className="px-6 py-4 font-semibold text-gray-400 uppercase tracking-wider text-xs">Tags</th>
                                <th className="px-6 py-4 font-semibold text-gray-400 uppercase tracking-wider text-xs w-1/4">Variables</th>
                                <th className="px-6 py-4 font-semibold text-gray-400 uppercase tracking-wider text-xs whitespace-nowrap">Total Consumed</th>
                                <th className="px-6 py-4 font-semibold text-gray-400 uppercase tracking-wider text-xs text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                                        <Loader2 size={32} className="animate-spin text-blue-500 mx-auto" />
                                    </td>
                                </tr>
                            ) : paginatedContacts.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="px-6 py-12 text-center text-gray-500 font-medium">No contacts found on this page.</td>
                                </tr>
                            ) : (
                                paginatedContacts.map((c: any) => (
                                    <tr
                                        key={c.id}
                                        onClick={() => navigate(`/contacts/${c.contactId || c.id}`)}
                                        className={`border-b border-gray-50 hover:bg-gray-50/50 transition-colors cursor-pointer ${selectedContacts.includes(c.contactId || c.id) ? 'bg-teal-50/20' : ''}`}
                                    >
                                        <td className="px-6 py-4 text-center">
                                            <input
                                                type="checkbox"
                                                className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                                                checked={selectedContacts.includes(c.contactId || c.id)}
                                                onChange={(e) => {
                                                    const cid = c.contactId || c.id;
                                                    if (e.target.checked) setSelectedContacts(prev => [...prev, cid]);
                                                    else setSelectedContacts(prev => prev.filter(id => id !== cid));
                                                }}
                                                onClick={e => e.stopPropagation()}
                                            />
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center text-gray-500 font-bold border border-gray-100 text-xs">
                                                    {c.name ? c.name.substring(0, 2).toUpperCase() : '??'}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-gray-900 text-sm">{c.name || 'Unknown Contact'}</div>
                                                    <div className="text-[11px] text-gray-400 mt-0.5">{new Date(c.createdAt || Date.now()).toLocaleDateString('en-GB')}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1.5 text-xs text-gray-600">
                                                <div className="flex items-center gap-2"><Mail size={12} className="text-gray-400" /> {c.email || '—'}</div>
                                                <div className="flex items-center gap-2"><Phone size={12} className="text-gray-400" /> {c.phoneNumber || c.phone || '—'}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-3 py-1 bg-gray-50 text-gray-700 rounded-lg text-[11px] font-medium border border-gray-200 flex items-center gap-1.5 w-fit">
                                                <span className="w-1.5 h-1.5 rounded-full bg-gray-500"></span>
                                                {c.status || 'Pending'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-400 italic text-xs">
                                            {c.campaignId ? 'Assigned' : 'Unassigned'}
                                        </td>
                                        <td className="px-6 py-4 max-w-[200px]">
                                            <div className="flex flex-wrap gap-1.5 items-center">
                                                {c.tags && c.tags.length > 0 ? (
                                                    <>
                                                        <span className="px-2.5 py-1 bg-teal-50 text-teal-600 border border-teal-100 rounded-full text-[10px] font-medium whitespace-nowrap overflow-hidden text-ellipsis max-w-[120px]">
                                                            {c.tags[0]}
                                                        </span>

                                                        {c.tags.length > 1 && (
                                                            <div className="relative group cursor-help flex items-center">
                                                                <span className="px-2.5 py-1 bg-gray-50 text-gray-500 border border-gray-200 rounded-full text-[10px] font-bold shadow-sm transition-colors group-hover:bg-gray-100">
                                                                    +{c.tags.length - 1}
                                                                </span>

                                                                {/* Hover Dropdown Menu */}
                                                                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 hidden group-hover:flex flex-col gap-1.5 w-max z-[100] bg-white border border-gray-200 shadow-xl rounded-lg p-3 animate-in fade-in zoom-in-95">
                                                                    <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest px-1 mb-0.5">Remaining Tags</div>
                                                                    {c.tags.slice(1).map((t: string, i: number) => (
                                                                        <span key={i} className="px-2.5 py-1.5 bg-teal-50/70 text-teal-700 rounded-md text-[11px] font-medium border border-teal-100/50 shadow-sm flex items-center gap-1.5 whitespace-nowrap">
                                                                            <Tag size={10} className="text-teal-400" /> {t}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </>
                                                ) : <span className="text-gray-300">—</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <VariableCell contact={c} />
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-50 border border-gray-200 rounded-md w-fit">
                                                <span className="text-[9px] font-bold text-gray-400 uppercase">INR</span>
                                                <span className="text-xs font-black text-gray-700">₹{((Number(c.callDurationSec || c.duration_sec || c.duration || 0) / 60.0) * 5.2).toFixed(2)}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2 text-gray-400">
                                                <button
                                                    className="p-1.5 hover:bg-blue-50 rounded-lg border border-gray-100 hover:text-blue-500 hover:border-blue-100 transition-colors"
                                                    title="Call History"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setHistoryContact(c);
                                                        setHistoryPage(1);
                                                        setIsHistoryModalOpen(true);
                                                        fetchHistory(c, 1);
                                                    }}
                                                >
                                                    <History size={14} />
                                                </button>
                                                <button
                                                    className="p-1.5 hover:bg-gray-100 rounded-lg border border-gray-100 transition-colors"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        const splitName = (c.name || '').split(' ');
                                                        setEditContact({
                                                            ...c,
                                                            first_name: c.first_name || splitName[0] || '',
                                                            last_name: c.last_name || splitName.slice(1).join(' ') || '',
                                                            company: c.company || '',
                                                            phone: c.phoneNumber || c.phone || ''
                                                        });
                                                        setIsEditModalOpen(true);
                                                    }}
                                                >
                                                    <Edit2 size={14} />
                                                </button>
                                                <button
                                                    className="p-1.5 hover:bg-red-50 rounded-lg border border-gray-100 hover:text-red-500 hover:border-red-100 transition-colors"
                                                    onClick={(e) => handleDeleteContact(e, c.contactId || c.id)}
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </CardContent>

                {/* Pagination Controls */}
                {!loading && filteredContacts.length > 0 && (
                    <div className="flex items-center justify-between p-4 border-t border-gray-100 bg-white">
                        <div className="text-sm text-gray-500">
                            Showing <span className="font-bold text-gray-900">{(page - 1) * PAGE_SIZE + 1}</span> to <span className="font-bold text-gray-900">{Math.min(page * PAGE_SIZE, filteredContacts.length)}</span> of <span className="font-bold text-gray-900">{filteredContacts.length}</span> mapped contacts
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="px-4 text-gray-600 border-gray-200"
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                            >
                                Previous
                            </Button>
                            <span className="text-sm font-black text-gray-700 px-3 tracking-widest">{page} <span className="text-gray-300 mx-1">/</span> {totalPages}</span>
                            <Button
                                variant="outline"
                                size="sm"
                                className="px-4 text-gray-600 border-gray-200"
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                )}
            </Card>



            {/* Create Contact Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <Card className="w-full max-w-lg shadow-xl animate-in zoom-in-95">
                        <div className="flex justify-between items-center p-6 border-b border-gray-100">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Create New Contact</h3>
                                <p className="text-xs text-gray-500 mt-1">Add a structural node into the Ravan core.</p>
                            </div>
                            <button onClick={() => setIsCreateModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleCreateContact} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-1.5 flex items-center gap-1">Full Name <span className="text-red-500">*</span></label>
                                <input required className="w-full text-sm p-2.5 border border-gray-200 rounded-lg outline-none focus:border-teal-500 transition-colors" placeholder="John Doe" value={createForm.name} onChange={e => setCreateForm({ ...createForm, name: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-1.5 flex items-center gap-1.5 justify-start"><Phone size={12} /> Phone Number <span className="text-red-500">*</span></label>
                                <input required maxLength={15} minLength={10} pattern="^\+?[0-9]{10,14}$" title="Valid phone format required (10+ digits)" className="w-full text-sm p-2.5 border border-gray-200 rounded-lg outline-none focus:border-teal-500 transition-colors font-mono" placeholder="+914157774444" value={createForm.phone} onChange={e => setCreateForm({ ...createForm, phone: e.target.value.replace(/[^\d+]/g, '') })} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-1.5 flex items-center gap-1.5 justify-start"><Mail size={12} /> Email Address <span className="text-red-500">*</span></label>
                                <input required type="email" className="w-full text-sm p-2.5 border border-gray-200 rounded-lg outline-none focus:border-teal-500 transition-colors" placeholder="alex@example.com" value={createForm.email} onChange={e => setCreateForm({ ...createForm, email: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-1.5 flex items-center gap-1.5 justify-start"><Target size={12} /> Target Campaign</label>
                                    <select
                                        className="w-full text-sm p-2.5 border border-gray-200 rounded-lg outline-none focus:border-teal-500 transition-colors appearance-none bg-white text-gray-700 font-medium shadow-sm"
                                        value={createForm.campaignId || ""}
                                        onChange={(e) => setCreateForm({ ...createForm, campaignId: e.target.value })}
                                        style={{ backgroundImage: 'url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3E%3Cpath stroke=\'%236b7280\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M6 8l4 4 4-4\'/%3E%3C/svg%3E")', backgroundPosition: 'right .5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em', paddingRight: '2.5rem' }}
                                    >
                                        <option value="">-- Let Backend Auto-Map --</option>
                                        {availableCampaigns.filter(c => !c.name.startsWith("[HASH:")).map((c) => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-1.5 flex items-center gap-1.5 justify-start">Notes</label>
                                    <textarea className="w-full text-sm p-2.5 border border-gray-200 rounded-lg outline-none focus:border-teal-500 transition-colors min-h-[60px]" placeholder="Add any relevant context or notes..." value={createForm.notes} onChange={e => setCreateForm({ ...createForm, notes: e.target.value })} />
                                </div>
                                <div className="relative col-span-2 sm:col-span-1">
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><Tag size={12} /> Tags</label>

                                    <div className="w-full text-sm p-1.5 border border-gray-200 rounded-lg focus-within:border-teal-500 transition-colors flex flex-wrap gap-1.5 items-center min-h-[42px] bg-white">
                                        {createForm.tags.split(',').map(t => t.trim()).filter(t => t).map((t, idx) => (
                                            <span key={idx} className="bg-teal-50 text-teal-700 px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1 border border-teal-100">
                                                {t}
                                                <X size={10} className="cursor-pointer hover:text-teal-900" onMouseDown={(e) => {
                                                    e.preventDefault();
                                                    const array = createForm.tags.split(',').map(x => x.trim()).filter(x => x);
                                                    array.splice(idx, 1);
                                                    setCreateForm({ ...createForm, tags: array.join(', ') + (array.length ? ', ' : '') });
                                                }} />
                                            </span>
                                        ))}

                                        <input
                                            className="flex-1 min-w-[70px] outline-none bg-transparent p-1 text-sm font-medium placeholder-gray-300"
                                            placeholder={createForm.tags.length > 0 ? "Add..." : "VIP, lead..."}
                                            value={tagSearch}
                                            onChange={e => {
                                                setTagSearch(e.target.value);
                                                setShowTagMenu(e.target.value.length >= 3);
                                            }}
                                            onKeyDown={e => {
                                                if (e.key === 'Enter' || e.key === ',') {
                                                    e.preventDefault();
                                                    if (tagSearch.trim()) {
                                                        const cleanTag = tagSearch.trim().replace(/,/g, '');
                                                        const current = createForm.tags.split(',').map(x => x.trim()).filter(x => x);
                                                        if (!current.includes(cleanTag)) {
                                                            current.push(cleanTag);
                                                            setCreateForm({ ...createForm, tags: current.join(', ') + ', ' });
                                                        }
                                                        setTagSearch('');
                                                        setShowTagMenu(false);
                                                    }
                                                }
                                            }}
                                            onBlur={() => setTimeout(() => setShowTagMenu(false), 200)}
                                        />
                                    </div>

                                    {/* Smart Tags Auto-Complete Dropdown */}
                                    {showTagMenu && globalTags.filter(t => t.toLowerCase().includes(tagSearch.toLowerCase())).length > 0 && (
                                        <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-40 overflow-y-auto">
                                            {globalTags.filter(t => t.toLowerCase().includes(tagSearch.toLowerCase())).map((t, idx) => (
                                                <div
                                                    key={idx}
                                                    className="px-4 py-2 text-sm text-gray-700 hover:bg-teal-50 hover:text-teal-700 cursor-pointer transition-colors border-b border-gray-50 last:border-0"
                                                    onMouseDown={(e) => {
                                                        e.preventDefault();
                                                        const current = createForm.tags.split(',').map(x => x.trim()).filter(x => x);
                                                        if (!current.includes(t)) {
                                                            current.push(t);
                                                            setCreateForm({ ...createForm, tags: current.join(', ') + ', ' });
                                                        }
                                                        setTagSearch('');
                                                        setShowTagMenu(false);
                                                    }}
                                                >
                                                    <div className="flex items-center gap-2"><Tag size={12} className="text-teal-500" /> {t}</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="pt-2">
                                <div className="flex justify-between items-center mb-2">
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest">Custom Variables (Metadata)</label>
                                    <button type="button" onClick={() => setMetaVars([...metaVars, { key: '', value: '' }])} className="text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1">
                                        <Plus size={12} /> Add
                                    </button>
                                </div>
                                {metaVars.map((mv, index) => (
                                    <div key={index} className="flex gap-3 mb-3">
                                        <input
                                            className="w-1/2 text-sm p-2 border border-gray-200 rounded-lg outline-none focus:border-teal-500 font-mono"
                                            placeholder="key"
                                            value={mv.key}
                                            onChange={e => {
                                                const nw = [...metaVars];
                                                nw[index].key = e.target.value;
                                                setMetaVars(nw);
                                            }}
                                        />
                                        <input
                                            className="w-1/2 text-sm p-2 border border-gray-200 rounded-lg outline-none focus:border-teal-500"
                                            placeholder="value"
                                            value={mv.value}
                                            onChange={e => {
                                                const nw = [...metaVars];
                                                nw[index].value = e.target.value;
                                                setMetaVars(nw);
                                            }}
                                        />
                                        <button type="button" onClick={() => setMetaVars(metaVars.filter((_, i) => i !== index))} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                                {metaVars.length === 0 && <p className="text-xs text-gray-400">Optional key/value pairs sent as JSON to the backend.</p>}
                            </div>

                            <div className="pt-4 border-t border-gray-100 flex justify-end gap-3 mt-6">
                                <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
                                <Button type="submit" className="bg-teal-600 hover:bg-teal-700 text-white font-bold" disabled={isCreating}>
                                    {isCreating ? <Loader2 size={16} className="animate-spin mr-2" /> : <CheckCircle2 size={16} className="mr-2" />} Save Contact
                                </Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}

            {/* Edit Contact Modal */}
            {isEditModalOpen && editContact && (
                <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
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
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-500 transition-all"
                                        placeholder="Alex"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Last Name</label>
                                    <input
                                        type="text"
                                        value={editContact.last_name || ''}
                                        onChange={(e) => setEditContact({ ...editContact, last_name: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-500 transition-all"
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
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-500 transition-all font-mono"
                                    placeholder="+14157774444"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Email Address</label>
                                <input
                                    type="email"
                                    value={editContact.email || ''}
                                    onChange={(e) => setEditContact({ ...editContact, email: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-500 transition-all"
                                    placeholder="alex@example.com"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Company</label>
                                <input
                                    type="text"
                                    value={editContact.company || ''}
                                    onChange={(e) => setEditContact({ ...editContact, company: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-500 transition-all"
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
                                    className="px-5 py-2.5 bg-teal-600 text-white font-bold text-sm rounded-xl hover:bg-teal-700 transition-colors shadow-sm shadow-teal-200 flex items-center justify-center min-w-[120px] disabled:opacity-75 disabled:cursor-not-allowed"
                                    disabled={editLoading}
                                >
                                    {editLoading ? <Loader2 size={16} className="animate-spin" /> : "Save Changes"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Phone History Modal */}
            {isHistoryModalOpen && historyContact && (
                <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50/50">
                            <div>
                                <h3 className="text-lg font-black text-gray-900 flex items-center gap-2"><History className="text-teal-600" size={20} /> Communication History</h3>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mt-0.5">{historyContact.name || 'Unknown Node'} — {historyContact.phone || historyContact.phoneNumber}</p>
                            </div>
                            <button
                                onClick={() => setIsHistoryModalOpen(false)}
                                className="p-2 bg-white hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-xl transition-colors border border-gray-100"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 bg-gray-50/30">
                            {historyLoading ? (
                                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                                    <Loader2 size={32} className="animate-spin text-teal-500 mb-4" />
                                    <span className="text-sm font-bold tracking-widest uppercase">Extracting Connection Timeline...</span>
                                </div>
                            ) : historyCalls.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                                    <History size={32} className="opacity-30 mb-4" />
                                    <span className="text-sm font-bold tracking-widest uppercase">No Connection Records Found</span>
                                    <p className="text-xs text-gray-300 mt-2">Data mapped against {historyContact.phone || historyContact.phoneNumber}</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {historyCalls.map((call: any) => (
                                        <div key={call.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                                            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                                                <div className="flex items-center gap-3">
                                                    <span className={`px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-widest rounded-md border shadow-sm ${call.status === 'completed' ? 'bg-green-50 text-green-700 border-green-100' :
                                                        call.status === 'failed' ? 'bg-red-50 text-red-600 border-red-100' :
                                                            'bg-gray-50 text-gray-600 border-gray-200'
                                                        }`}>
                                                        {call.status}
                                                    </span>
                                                    <div className="flex flex-col gap-0.5 text-xs text-gray-500 font-bold">
                                                        <span>Agent Node: {call.agent_name || 'System Robot'}</span>
                                                        <span className="flex items-center gap-1.5 text-gray-400"><Calendar size={10} /> {new Date(call.started_at).toLocaleString()}</span>
                                                    </div>
                                                </div>
                                                <div className="flex flex-wrap flex-col items-end gap-1.5 text-xs font-bold text-gray-600">
                                                    <div className="flex items-center gap-1.5 bg-gray-100 px-2 py-1 rounded-md border border-gray-200"><Clock size={12} /> {call.duration_sec}s Duration</div>
                                                    <div className="flex items-center gap-1.5 text-blue-700 bg-blue-50 px-2 py-1 rounded-md border border-blue-100"><Coins size={10} /> Consumed: {Number(call.cost_total || 0).toFixed(2)} Coins</div>
                                                </div>
                                            </div>

                                            <div className="p-4 border-t border-gray-100 bg-gray-50/50">
                                                <div className="font-bold text-xs uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-1.5">
                                                    <Activity size={12} /> Deep Analytics & Core Metadata
                                                </div>
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                                                    {/* Network & Identity */}
                                                    <div className="bg-white p-2.5 rounded-lg border border-gray-200 shadow-sm flex flex-col gap-0.5">
                                                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">From Caller</span>
                                                        <span className="font-mono text-gray-800 font-bold truncate" title={call.caller_number || '--'}>{call.caller_number || '--'}</span>
                                                        <span className="text-[9px] text-gray-500 truncate" title={call.caller_name || 'Anonymous'}>{call.caller_name || 'Anonymous'}</span>
                                                    </div>
                                                    <div className="bg-white p-2.5 rounded-lg border border-gray-200 shadow-sm flex flex-col gap-0.5">
                                                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">To Callee</span>
                                                        <span className="font-mono text-gray-800 font-bold truncate" title={call.callee_number || '--'}>{call.callee_number || '--'}</span>
                                                        <span className="text-[9px] text-gray-500">Target Dest</span>
                                                    </div>
                                                    <div className="bg-white p-2.5 rounded-lg border border-gray-200 shadow-sm flex flex-col gap-0.5">
                                                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Channel / Source</span>
                                                        <span className="text-xs text-gray-800 font-bold uppercase tracking-wide truncate">{call.channel || 'phone'}</span>
                                                        <span className="text-[9px] text-gray-500 font-mono truncate">Src: {call.metadata?.source || 'api'}</span>
                                                    </div>
                                                    <div className="bg-white p-2.5 rounded-lg border border-gray-200 shadow-sm flex flex-col gap-0.5">
                                                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Disconnect Reason</span>
                                                        <span className="text-[10px] text-gray-800 font-bold uppercase truncate" title={call.disconnect_reason?.replace(/_/g, ' ') || 'Unknown'}>{call.disconnect_reason?.replace(/_/g, ' ') || 'Unknown'}</span>
                                                        {call.error_message && <span className="text-[9px] text-red-500 font-bold truncate" title={call.error_message}>{call.error_message}</span>}
                                                    </div>

                                                    {/* System IDs & Timeline */}
                                                    <div className="bg-white p-2.5 rounded-lg border border-gray-200 shadow-sm flex flex-col gap-0.5 col-span-2">
                                                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">System Identifiers</span>
                                                        <span className="font-mono text-[9px] text-gray-500 truncate" title={call.agent_id}>Agent: {call.agent_id || 'N/A'}</span>
                                                        <span className="font-mono text-[9px] text-gray-500 truncate" title={call.organization_id}>Org: {call.organization_id || 'N/A'}</span>
                                                        <span className="font-mono text-[9px] text-gray-500 truncate" title={call.id}>Sess: {call.id || 'N/A'}</span>
                                                    </div>

                                                    <div className="bg-white p-2.5 rounded-lg border border-gray-200 shadow-sm flex flex-col gap-0.5 col-span-2 relative overflow-hidden">
                                                        <div className="absolute right-0 top-0 bottom-0 w-1 bg-blue-500 opacity-20"></div>
                                                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Timeline Map</span>
                                                        <span className="text-[10px] text-gray-600 font-mono"><span className="text-gray-400">Created:</span> {new Date(call.created_at).toLocaleString()}</span>
                                                        <span className="text-[10px] text-gray-600 font-mono"><span className="text-gray-400">Ended:</span> {new Date(call.ended_at).toLocaleString()}</span>
                                                    </div>

                                                    {/* Cost Matrix & Analysis */}
                                                    {(call.twilio_cost !== undefined || call.model_cost !== undefined || call.credit_breakdown) && (
                                                        <div className="bg-gray-900 p-3.5 rounded-xl border border-gray-700 shadow-sm flex flex-col gap-2 col-span-2 sm:col-span-4 mt-2">
                                                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1 flex items-center justify-between">
                                                                Financial & Computational Matrix
                                                                <span className="px-2 py-0.5 bg-gray-800 text-gray-300 rounded text-[9px] border border-gray-700">Latency: {call.call_latency_ms || 0}ms</span>
                                                            </span>
                                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                                                <div className="flex flex-col">
                                                                    <span className="text-[9px] text-gray-400 uppercase tracking-widest">Sentiment</span>
                                                                    <span className="text-emerald-400 font-bold uppercase tracking-wide truncate">{call.post_call_analysis_result?.sentiment || 'Neutral'}</span>
                                                                </div>
                                                                <div className="flex flex-col border-l border-gray-700 pl-4">
                                                                    <span className="text-[9px] text-gray-400 uppercase tracking-widest">Provider Coins</span>
                                                                    <span className="text-orange-400 font-mono font-bold">{Number(call.twilio_cost || call.credit_breakdown?.provider_credits || 0).toFixed(2)}</span>
                                                                </div>
                                                                <div className="flex flex-col border-l border-gray-700 pl-4">
                                                                    <span className="text-[9px] text-gray-400 uppercase tracking-widest">Model Coins</span>
                                                                    <span className="text-indigo-400 font-mono font-bold">{Number(call.model_cost || call.credit_breakdown?.model_credits || 0).toFixed(2)}</span>
                                                                </div>
                                                                <div className="flex flex-col border-l border-gray-700 pl-4">
                                                                    <span className="text-[9px] text-gray-400 uppercase tracking-widest">Telephony Coins</span>
                                                                    <span className="text-cyan-400 font-mono font-bold">{Number(call.credit_breakdown?.telephony_base_credits || 0).toFixed(2)}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="p-4 text-sm text-gray-700 border-t border-gray-100">
                                                <div className="font-bold text-xs uppercase tracking-widest text-gray-400 mb-2">AI Node Summary Context</div>
                                                <p className="bg-gray-50 border border-gray-100 p-3 rounded-lg text-sm text-gray-600 leading-relaxed">{call.summary || "No active context summary was computationally generated for this connection stream."}</p>

                                                {call.recording_url && (
                                                    <div className="mt-5">
                                                        <div className="font-bold text-xs uppercase tracking-widest text-gray-400 mb-2 flex items-center gap-1.5">
                                                            🎙️ Native Call Recording Stream
                                                        </div>
                                                        <div className="bg-gray-50 border border-gray-200 rounded-xl p-2 shadow-sm animate-in fade-in slide-in-from-top-4">
                                                            <audio
                                                                controls
                                                                src={`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/calling/audio-stream?url=${encodeURIComponent(`https://api.ravan.ai/api/v1/calling/sessions/${call.id}/recording`)}`}
                                                                className="w-full h-10 outline-none"
                                                                preload="metadata"
                                                            />
                                                        </div>
                                                    </div>
                                                )}

                                                {call.transcripts && call.transcripts.length > 0 && (
                                                    <div className="mt-5">
                                                        <div className="font-bold text-xs uppercase tracking-widest text-gray-400 mb-2 flex items-center gap-1.5"><MessageCircle size={12} /> Interaction Chat Transcript</div>
                                                        <div className="bg-gray-900 rounded-xl p-4 max-h-[350px] overflow-y-auto space-y-3 font-mono text-xs shadow-inner">
                                                            {call.transcripts.map((t: any) => (
                                                                <div key={t.id} className={t.message?.role === 'agent' ? 'text-teal-400 bg-teal-900/10 p-2 rounded-md' : 'text-gray-300 bg-gray-800 p-2 rounded-md'}>
                                                                    <div className="opacity-50 uppercase tracking-widest text-[9px] mb-1 flex items-center gap-2">
                                                                        [{t.message?.role || 'system'}]
                                                                        <span className="font-serif italic lowercase">{new Date(t.timestamp_ms).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                                                                    </div>
                                                                    <div className="pl-1 text-sm tracking-tight leading-relaxed text-white">
                                                                        {t.message?.content}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Pagination for Modal */}
                        {historyTotal > 10 && (
                            <div className="p-4 border-t border-gray-100 bg-white flex justify-between items-center shadow-sm">
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Global Connection Logs: {historyTotal}</span>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={historyPage === 1 || historyLoading}
                                        onClick={() => {
                                            const np = historyPage - 1;
                                            setHistoryPage(np);
                                            fetchHistory(historyContact, np);
                                        }}
                                    >Previous</Button>
                                    <span className="text-xs font-black text-gray-700 mx-2">{historyPage}</span>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={historyPage * 10 >= historyTotal || historyLoading}
                                        onClick={() => {
                                            const np = historyPage + 1;
                                            setHistoryPage(np);
                                            fetchHistory(historyContact, np);
                                        }}
                                    >Next Pages</Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
            {/* CSV Import Batch Modal */}
            {isCsvModalOpen && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <Card className="w-full max-w-md shadow-xl animate-in zoom-in-95">
                        <div className="flex justify-between items-center p-6 border-b border-gray-100">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Import CSV Batch</h3>
                                <p className="text-xs text-gray-500 mt-1">Configure global tags and batch naming.</p>
                            </div>
                            <button onClick={() => setIsCsvModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"><X size={20} /></button>
                        </div>
                        <div className="p-6">

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-1.5 flex items-center gap-2"><Target size={14} className="text-blue-500" /> Target Campaign</label>
                                    <select
                                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold text-gray-700 bg-white"
                                        value={csvTargetCampaignId}
                                        onChange={(e) => setCsvTargetCampaignId(e.target.value)}
                                    >
                                        <option value="">No Global Mapping (Default Workspace)</option>
                                        {availableCampaigns.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                    <p className="text-[10px] text-gray-400 mt-1">Directly maps uploaded batch to selected Campaign.</p>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-1.5">Batch Tags</label>
                                    <input
                                        type="text"
                                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                                        placeholder="lead, 2026-q2"
                                        value={csvBatchTags}
                                        onChange={(e) => setCsvBatchTags(e.target.value)}
                                    />
                                    <p className="text-[10px] text-gray-400 mt-1">Separate multiple tags with commas.</p>
                                </div>
                            </div>

                            <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-gray-100">
                                <Button type="button" variant="outline" onClick={() => setIsCsvModalOpen(false)}>Cancel</Button>
                                <Button
                                    className="bg-teal-600 hover:bg-teal-700 text-white font-bold"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <UploadCloud size={16} className="mr-2" />
                                    Select File & Start Import
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>
            )}
        </MainLayout>
    );
}
