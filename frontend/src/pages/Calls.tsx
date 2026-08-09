import React, { useState, useEffect } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { apiClient } from '../api/client';
import { Loader2, Phone, Calendar, Clock, DollarSign, RefreshCw, Layers, CheckCircle, ShieldAlert, XCircle, ChevronLeft, ChevronRight, PhoneCall, Filter } from 'lucide-react';
import toast from 'react-hot-toast';

export function Calls() {
    const [calls, setCalls] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [sessionDetails, setSessionDetails] = useState<Record<string, any>>({});

    // Pagination State
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const PAGE_SIZE = 20;

    // Filter states
    const [filterExpanded, setFilterExpanded] = useState(false);
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterChannel, setFilterChannel] = useState('all');
    const [filterAgent, setFilterAgent] = useState('all');
    const [filterSentiment, setFilterSentiment] = useState('all');
    const [filterDisconnectReason, setFilterDisconnectReason] = useState('all');
    const [filterCallType, setFilterCallType] = useState('all');
    const [filterCallerName, setFilterCallerName] = useState('');
    const [filterCallerNumber, setFilterCallerNumber] = useState('');
    const [filterDurationMin, setFilterDurationMin] = useState('');
    const [filterDurationMax, setFilterDurationMax] = useState('');
    const [availableAgents, setAvailableAgents] = useState<any[]>([]);

    const fetchAvailableAgents = async () => {
        try {
            const res = await apiClient.get('/agents/');
            const agents = res.data?.data || [];
            setAvailableAgents(agents);
        } catch (e) {
            console.error('Failed to fetch agents:', e);
        }
    };

    const fetchCalls = async (pageNum = page, forceRefresh = false) => {
        setLoading(true);
        try {
            const params: any = {
                page: pageNum,
                page_size: PAGE_SIZE,
            };
            if (forceRefresh) params._forceRefresh = true;
            if (filterStatus && filterStatus !== 'all') params.status = filterStatus;
            if (filterChannel && filterChannel !== 'all') params.channel = filterChannel;
            if (filterAgent && filterAgent !== 'all') params.agent_id = filterAgent;
            if (filterSentiment && filterSentiment !== 'all') params.sentiment = filterSentiment;
            if (filterDisconnectReason && filterDisconnectReason !== 'all') params.disconnect_reason = filterDisconnectReason;
            if (filterCallType && filterCallType !== 'all') params.call_type = filterCallType;
            if (filterCallerName.trim()) params.caller_name = filterCallerName.trim();
            if (filterCallerNumber.trim()) params.caller_number = filterCallerNumber.trim();
            if (filterDurationMin) params.duration_min = parseInt(filterDurationMin);
            if (filterDurationMax) params.duration_max = parseInt(filterDurationMax);
            const res = await apiClient.get('/calling/call-sessions', { params });
            const fetchedData = res.data?.data || res.data || {};
            let finalCalls = fetchedData?.callSessions || fetchedData?.calls || [];

            const totalCount = fetchedData?.totalCount || fetchedData?.meta?.total || finalCalls.length;
            setTotalPages(Math.max(1, Math.ceil(totalCount / PAGE_SIZE)));

            setCalls(finalCalls);
        } catch (e: any) {
            console.error("Failed to fetch calls:", e);
            toast.error(e.response?.data?.detail || "Failed to load call sessions.");
            setCalls([]);
        } finally {
            setLoading(false);
        }
    };

    const handlePrevPage = () => {
        if (page > 1) {
            const newPage = page - 1;
            setPage(newPage);
            fetchCalls(newPage);
        }
    };

    const handleNextPage = () => {
        if (page < totalPages) {
            const newPage = page + 1;
            setPage(newPage);
            fetchCalls(newPage);
        }
    };

    useEffect(() => {
        fetchCalls(page);
        fetchAvailableAgents();
    }, []);

    useEffect(() => {
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = import.meta.env.MODE === 'production'
            ? `${wsProtocol}//${window.location.host}/ws`
            : 'ws://localhost:8000/ws';

        const ws = new WebSocket(wsUrl);
        ws.onmessage = (event) => {
            if (event.data === 'update') {
                console.log("⚡ HISTORY INJECTION: Refreshing Active Session Stream...");
                // Force fully transparent table reloading!
                fetchCalls(page, true);
            }
        };
        return () => ws.close();
    }, [page]);



    const handleRowExpand = async (id: string) => {
        if (expandedId === id) {
            setExpandedId(null);
            return;
        }
        setExpandedId(id);

        if (!sessionDetails[id]) {
            setDetailLoading(true);
            try {
                const res = await apiClient.get(`/calling/call-sessions-detail/${id}`);
                setSessionDetails(prev => ({ ...prev, [id]: res.data?.data || {} }));
            } catch (err) {
                console.error("Failed to fetch session detail", err);
            } finally {
                setDetailLoading(false);
            }
        }
    };

    return (
        <MainLayout>
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                        <Layers className="text-blue-600" size={24} /> Calling Engine Logs
                    </h1>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mt-1">Live Call Session Traversals</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center bg-white rounded-lg border border-gray-200 shadow-sm p-1">
                        <Button
                            variant="ghost"
                            className="px-3 py-1.5 h-auto text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded disabled:opacity-30 disabled:hover:bg-transparent"
                            onClick={handlePrevPage}
                            disabled={page === 1 || loading}
                        >
                            <ChevronLeft size={16} className="mr-1" /> Previous
                        </Button>
                        <div className="px-4 py-1.5 border-x border-gray-100 flex items-center justify-center min-w-[80px]">
                            <span className="text-sm font-black text-gray-700 tracking-wider">
                                {page} <span className="text-gray-300 mx-1">/</span> {totalPages}
                            </span>
                        </div>
                        <Button
                            variant="ghost"
                            className="px-3 py-1.5 h-auto text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded disabled:opacity-30 disabled:hover:bg-transparent"
                            onClick={handleNextPage}
                            disabled={page >= totalPages || loading}
                        >
                            Next <ChevronRight size={16} className="ml-1" />
                        </Button>
                    </div>

                    <Button
                        variant="outline"
                        className="text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 font-bold tracking-wide shadow-sm h-[38px] flex items-center"
                        onClick={() => setFilterExpanded(!filterExpanded)}
                    >
                        <Filter size={16} className="mr-2 text-gray-500" />
                        Filters
                    </Button>

                    <Button
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold tracking-wide shadow-sm h-[38px]"
                        onClick={() => fetchCalls(page, true)}
                        disabled={loading}
                    >
                        {loading ? <Loader2 size={16} className="animate-spin mr-2" /> : <RefreshCw size={16} className="mr-2" />}
                        Refresh Feed
                    </Button>
                </div>
            </div>

            {filterExpanded && (
                <Card className="shadow-sm border border-gray-200 mb-6 animate-in fade-in slide-in-from-top-1 duration-200">
                    <CardContent className="p-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                            <div>
                                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Status</label>
                                <select
                                    className="w-full text-sm p-2.5 border border-gray-200 rounded-xl bg-white text-gray-700 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all cursor-pointer"
                                    value={filterStatus}
                                    onChange={e => setFilterStatus(e.target.value)}
                                >
                                    <option value="all">All Status</option>
                                    <option value="completed">Completed</option>
                                    <option value="ringing">Ringing</option>
                                    <option value="in progress">In Progress</option>
                                    <option value="failed">Failed</option>
                                    <option value="pending">Pending</option>
                                    <option value="transfer">Transform / Transfer</option>
                                    <option value="user hangup">User Hangup</option>
                                    <option value="agent hangup">Agent Hangup</option>
                                    <option value="timeout">Timeout</option>
                                    <option value="error">Error</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Channel</label>
                                <select
                                    className="w-full text-sm p-2.5 border border-gray-200 rounded-xl bg-white text-gray-700 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all cursor-pointer"
                                    value={filterChannel}
                                    onChange={e => setFilterChannel(e.target.value)}
                                >
                                    <option value="all">All Channel</option>
                                    <option value="web_call">Web Call</option>
                                    <option value="inbound">Inbound</option>
                                    <option value="outbound">Outbound</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Agent</label>
                                <select
                                    className="w-full text-sm p-2.5 border border-gray-200 rounded-xl bg-white text-gray-700 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all cursor-pointer"
                                    value={filterAgent}
                                    onChange={e => setFilterAgent(e.target.value)}
                                >
                                    <option value="all">All Agents</option>
                                    {availableAgents.map((a: any) => (
                                        <option key={a.id} value={a.id}>{a.agentName || a.name || a.id}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Sentiment</label>
                                <select
                                    className="w-full text-sm p-2.5 border border-gray-200 rounded-xl bg-white text-gray-700 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all cursor-pointer"
                                    value={filterSentiment}
                                    onChange={e => setFilterSentiment(e.target.value)}
                                >
                                    <option value="all">All Sentiment</option>
                                    <option value="positive">Positive</option>
                                    <option value="negative">Negative</option>
                                    <option value="neutral">Neutral</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Disconnect Reason</label>
                                <select
                                    className="w-full text-sm p-2.5 border border-gray-200 rounded-xl bg-white text-gray-700 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all cursor-pointer"
                                    value={filterDisconnectReason}
                                    onChange={e => setFilterDisconnectReason(e.target.value)}
                                >
                                    <option value="all">All Reasons</option>
                                    <option value="agent hangup">Agent Hangup</option>
                                    <option value="user hangup">User Hangup</option>
                                    <option value="timeout">Timeout</option>
                                    <option value="error">Error</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Call Type</label>
                                <select
                                    className="w-full text-sm p-2.5 border border-gray-200 rounded-xl bg-white text-gray-700 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all cursor-pointer"
                                    value={filterCallType}
                                    onChange={e => setFilterCallType(e.target.value)}
                                >
                                    <option value="all">All Calls</option>
                                    <option value="transfer">Transfer Calls</option>
                                    <option value="web_call">Web Call</option>
                                    <option value="inbound">Inbound</option>
                                    <option value="outbound">Outbound</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Caller Name</label>
                                <input
                                    type="text"
                                    className="w-full text-sm p-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all bg-gray-50/50"
                                    placeholder="Search caller name..."
                                    value={filterCallerName}
                                    onChange={e => setFilterCallerName(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Caller Number</label>
                                <input
                                    type="text"
                                    className="w-full text-sm p-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all font-mono bg-gray-50/50"
                                    placeholder="+91XXXXXXXXXX"
                                    value={filterCallerNumber}
                                    onChange={e => setFilterCallerNumber(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Duration (sec)</label>
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        className="w-1/2 text-sm p-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all bg-gray-50/50"
                                        placeholder="Min"
                                        value={filterDurationMin}
                                        onChange={e => setFilterDurationMin(e.target.value)}
                                        min={0}
                                    />
                                    <input
                                        type="number"
                                        className="w-1/2 text-sm p-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all bg-gray-50/50"
                                        placeholder="Max"
                                        value={filterDurationMax}
                                        onChange={e => setFilterDurationMax(e.target.value)}
                                        min={0}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2 mt-5 pt-4 border-t border-gray-100">
                            <Button
                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold tracking-wide shadow-sm"
                                onClick={() => { setPage(1); fetchCalls(1); }}
                            >
                                Apply Filters
                            </Button>
                            <Button
                                variant="outline"
                                className="text-gray-700 bg-white border border-gray-200 hover:bg-gray-50"
                                onClick={() => {
                                    setFilterStatus('all');
                                    setFilterChannel('all');
                                    setFilterAgent('all');
                                    setFilterSentiment('all');
                                    setFilterDisconnectReason('all');
                                    setFilterCallType('all');
                                    setFilterCallerName('');
                                    setFilterCallerNumber('');
                                    setFilterDurationMin('');
                                    setFilterDurationMax('');
                                    setPage(1);
                                    fetchCalls(1);
                                }}
                            >
                                Reset Filters
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            <Card className="shadow-sm overflow-hidden border border-gray-200">
                <CardContent className="p-0 overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap min-w-[900px]">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4 font-black text-gray-400 uppercase tracking-widest text-[10px]">Session / Agent</th>
                                <th className="px-6 py-4 font-black text-gray-400 uppercase tracking-widest text-[10px]">Contact Block</th>
                                <th className="px-6 py-4 font-black text-gray-400 uppercase tracking-widest text-[10px]">Status</th>
                                <th className="px-6 py-4 font-black text-gray-400 uppercase tracking-widest text-[10px]">Channel</th>
                                <th className="px-6 py-4 font-black text-gray-400 uppercase tracking-widest text-[10px]">Duration & Cost</th>
                                <th className="px-6 py-4 font-black text-gray-400 uppercase tracking-widest text-[10px] text-right">Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-16 text-center text-gray-400">
                                        <Loader2 size={32} className="animate-spin text-blue-500 mx-auto mb-4" />
                                        <span className="font-semibold text-sm">Aggregating live call mapping (Page {page})...</span>
                                    </td>
                                </tr>
                            ) : calls.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-16 text-center text-gray-400">
                                        <Layers size={32} className="mx-auto mb-4 opacity-50" />
                                        <p className="font-semibold text-sm">No call sessions physically detected on this page.</p>
                                    </td>
                                </tr>
                            ) : (
                                calls.map((c: any) => (
                                    <React.Fragment key={c.id}>
                                        <tr
                                            onClick={() => handleRowExpand(c.id)}
                                            className="border-b border-gray-50 hover:bg-blue-50/30 transition-colors group cursor-pointer"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="font-bold text-gray-900 text-sm">{(c.agentName || 'Unknown Agent').split('[HASH:')[0].trim()}</span>
                                                    <span className="text-[10px] font-mono text-gray-400 tracking-tight">{c.id}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-black border border-blue-200 text-[10px] uppercase">
                                                        {c.callerName ? c.callerName.split('[HASH:')[0].trim().substring(0, 2) : 'UK'}
                                                    </div>
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{(c.callerName || 'Unknown Caller').split('[HASH:')[0].trim()}</span>
                                                        <span className="flex items-center gap-1.5 text-[11px] text-gray-500 font-medium">
                                                            <Phone size={10} /> {c.callerNumber || 'N/A'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-widest rounded-md inline-flex items-center gap-1.5 w-fit
                                                ${c.status === 'completed' || c.status === 'ended'
                                                        ? 'bg-green-50 text-green-700 border-green-100'
                                                        : c.status === 'failed'
                                                            ? 'bg-red-50 text-red-600 border-red-100'
                                                            : c.status === 'in-progress' || c.status === 'active'
                                                                ? 'bg-blue-50 text-blue-600 border-blue-100'
                                                                : 'bg-gray-50 text-gray-600 border-gray-100'
                                                    } border shadow-sm`}>

                                                    {c.status === 'failed' && <ShieldAlert size={10} />}
                                                    {c.status === 'completed' && <CheckCircle size={10} />}
                                                    {(c.status === 'in-progress' || c.status === 'active') && <RefreshCw size={10} className="animate-spin" />}

                                                    {c.status || 'unknown'}
                                                </span>
                                                {c.disconnectReason && (
                                                    <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1 truncate max-w-[120px]" title={c.disconnectReason}>
                                                        {c.disconnectReason}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="px-2.5 py-1 bg-gray-50 text-gray-700 rounded-lg text-[10px] font-black border border-gray-200 uppercase tracking-widest">
                                                    {c.channel || 'Voice'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1.5">
                                                    <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700">
                                                        <Clock size={12} className="text-gray-400" />
                                                        {c.durationSec ? `${Math.floor(c.durationSec / 60)}m ${c.durationSec % 60}s` : '0s'}
                                                    </div>
                                                    <div className="flex items-center gap-1 text-[11px] font-black text-green-600 tracking-wide">
                                                        {c.costTotal || '0.00'}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex flex-col items-end gap-1 text-gray-600">
                                                    <div className="flex items-center gap-1.5 font-bold text-sm">
                                                        <Calendar size={12} className="text-gray-400" />
                                                        {c.startedAt ? new Date(c.startedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Unknown'}
                                                    </div>
                                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                                        {c.startedAt ? new Date(c.startedAt).toLocaleTimeString() : ''}
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>

                                        {expandedId === c.id && (
                                            <tr className="bg-gray-50/80 border-b border-gray-100">
                                                <td colSpan={6} className="px-6 py-4">
                                                    {detailLoading && !sessionDetails[c.id] ? (
                                                        <div className="flex justify-center p-6 bg-white rounded-lg border border-gray-200">
                                                            <Loader2 size={24} className="animate-spin text-blue-500" />
                                                        </div>
                                                    ) : (
                                                        <div className="flex flex-col gap-4 animate-in slide-in-from-top-2 fade-in duration-200">
                                                            {(sessionDetails[c.id]?.recording_url || c.recordingUrl) && (
                                                                <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm flex items-center gap-4">
                                                                    <span className="text-xs font-bold text-gray-500 uppercase tracking-widest"><PhoneCall size={14} className="inline mr-1" /> Recording</span>
                                                                    <audio controls className="h-8 max-w-md w-full ml-auto" src={(sessionDetails[c.id]?.recording_url || c.recordingUrl).includes('api.ravan.ai') ? `http://localhost:8000/calling/audio-stream?url=${encodeURIComponent(sessionDetails[c.id]?.recording_url || c.recordingUrl)}` : (sessionDetails[c.id]?.recording_url || c.recordingUrl)} />
                                                                </div>
                                                            )}
                                                            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                                                                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm xl:col-span-1 flex flex-col gap-4">
                                                                    <div>
                                                                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 border-b border-gray-100 pb-2">Session Metadata</h4>
                                                                        {c.metadata && Object.keys(c.metadata).length > 0 ? (
                                                                            <div className="space-y-2">
                                                                                {Object.entries(c.metadata).map(([k, v]) => (
                                                                                    <div key={k} className="flex justify-between items-center text-xs border-b border-gray-50 pb-1 last:border-0">
                                                                                        <span className="font-semibold text-gray-500 capitalize">{k.replace(/_/g, ' ')}</span>
                                                                                        <span className="font-mono text-gray-900 bg-gray-50 px-2 py-0.5 rounded truncate max-w-[150px]" title={String(v)}>{String(v || 'N/A')}</span>
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        ) : (
                                                                            <div className="text-xs text-gray-400 italic">No structural metadata transmitted.</div>
                                                                        )}
                                                                    </div>

                                                                    <div>
                                                                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 border-b border-gray-100 pb-2">Credit Mapping</h4>
                                                                        {c.creditBreakdown || sessionDetails[c.id]?.credit_breakdown ? (
                                                                            <div className="space-y-2">
                                                                                {Object.entries(sessionDetails[c.id]?.credit_breakdown || c.creditBreakdown).map(([k, v]) => (
                                                                                    <div key={k} className="flex justify-between items-center text-xs border-b border-gray-50 pb-1 last:border-0">
                                                                                        <span className="font-semibold text-gray-500 capitalize">{k.replace(/_/g, ' ')}</span>
                                                                                        <span className="font-black text-green-600 bg-green-50 px-2 py-0.5 rounded">{typeof v === 'number' ? v.toFixed(4) : String(v)}</span>
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        ) : (
                                                                            <div className="flex justify-between items-center text-xs">
                                                                                <span className="font-semibold text-gray-500">Total Charged Cost</span>
                                                                                <span className="font-black text-green-600 bg-green-50 px-2 py-0.5 rounded">{sessionDetails[c.id]?.cost_total || c.costTotal || '0.00'}</span>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 shadow-inner xl:col-span-2">
                                                                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 border-b border-gray-200 pb-2">Call Transcripts</h4>

                                                                    {sessionDetails[c.id]?.transcripts && sessionDetails[c.id].transcripts.length > 0 ? (
                                                                        <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                                                            {sessionDetails[c.id].transcripts.map((msg: any, idx: number) => (
                                                                                <div key={idx} className={`flex flex-col max-w-[80%] ${msg.role === 'agent' ? 'mr-auto items-start' : 'ml-auto items-end'}`}>
                                                                                    <span className="text-[9px] font-bold text-gray-400 uppercase mb-0.5 tracking-widest">{msg.role === 'user' ? (c.callerName || 'User') : msg.role}</span>
                                                                                    <div className={`px-4 py-2.5 rounded-2xl text-sm shadow-sm ${msg.role === 'agent' ? 'bg-white text-gray-800 border border-gray-200 rounded-tl-sm' : 'bg-blue-600 text-white rounded-tr-sm'}`}>
                                                                                        {msg.content}
                                                                                    </div>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    ) : sessionDetails[c.id]?.transcripts ? (
                                                                        <div className="text-xs text-gray-400 italic">No transcripts mapped for this call segment.</div>
                                                                    ) : (
                                                                        <div className="text-xs text-gray-400 italic">Loading transcripts...</div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))
                            )}
                        </tbody>
                    </table>
                </CardContent>
            </Card>
        </MainLayout>
    );
}
