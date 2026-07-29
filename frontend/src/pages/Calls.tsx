import React, { useState, useEffect } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { apiClient } from '../api/client';
import { Loader2, Phone, Calendar, Clock, DollarSign, RefreshCw, Layers, CheckCircle, ShieldAlert, XCircle, ChevronLeft, ChevronRight, PhoneCall } from 'lucide-react';
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

    const fetchCalls = async (pageNum = page) => {
        setLoading(true);
        try {
            const meRes = await apiClient.get('/auth/me');
            const user = meRes.data;
            const isCustomer = user.role !== 'admin';

            // If they are a customer and have NEITHER agent nor campaign assigned
            if (isCustomer && !user.ravan_campaign_id && !user.ravan_agent_id) {
                setCalls([]);
                setTotalPages(1);
                setLoading(false);
                return;
            }

            // Bind explicitly depending on their assignment (Agent OR Campaign)
            let queryParam = '';
            if (isCustomer) {
                if (user.ravan_agent_id) queryParam += `&agent_id=${user.ravan_agent_id}`;
                if (user.ravan_campaign_id) queryParam += `&campaign_id=${user.ravan_campaign_id}`;
            }

            const url = `/api/ravan/calling/call-sessions?page=${pageNum}&page_size=${PAGE_SIZE}${queryParam}`;

            const res = await apiClient.get(url);
            const fetchedData = res.data?.data;
            setCalls(fetchedData?.callSessions || []);

            // Reconstruct Total counting natively parsed from Ravan AI Meta block
            const totalCount = fetchedData?.meta?.total || fetchedData?.totalCount || (fetchedData?.callSessions || []).length;
            setTotalPages(Math.max(1, Math.ceil(totalCount / PAGE_SIZE)));
        } catch (e: any) {
            console.error("Failed to fetch calls:", e);
            toast.error(e.response?.data?.detail || "Failed to load call sessions.");
            setCalls([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCalls(page);
    }, []);

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

    const handleRowExpand = async (id: string) => {
        if (expandedId === id) {
            setExpandedId(null);
            return;
        }
        setExpandedId(id);

        if (!sessionDetails[id]) {
            setDetailLoading(true);
            try {
                const res = await apiClient.get(`/api/ravan/calling/call-sessions-detail/${id}`);
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
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold tracking-wide shadow-sm h-[38px]"
                        onClick={() => fetchCalls(page)}
                        disabled={loading}
                    >
                        {loading ? <Loader2 size={16} className="animate-spin mr-2" /> : <RefreshCw size={16} className="mr-2" />}
                        Refresh Feed
                    </Button>
                </div>
            </div>

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
                                                    <span className="font-bold text-gray-900 text-sm">{c.agentName || 'Unknown Agent'}</span>
                                                    <span className="text-[10px] font-mono text-gray-400 tracking-tight">{c.id}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-black border border-blue-200 text-[10px] uppercase">
                                                        {c.callerName ? c.callerName.substring(0, 2) : 'UK'}
                                                    </div>
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{c.callerName || 'Unknown Caller'}</span>
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
                                                        <DollarSign size={10} /> {c.costTotal || '0.00'}
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
                                                                    <audio controls className="h-8 max-w-md w-full ml-auto" src={(sessionDetails[c.id]?.recording_url || c.recordingUrl).includes('api.ravan.ai') ? `http://localhost:8000/api/ravan/calling/audio-stream?url=${encodeURIComponent(sessionDetails[c.id]?.recording_url || c.recordingUrl)}` : (sessionDetails[c.id]?.recording_url || c.recordingUrl)} />
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
                                                                                <span className="font-black text-green-600 bg-green-50 px-2 py-0.5 rounded">${sessionDetails[c.id]?.cost_total || c.costTotal || '0.00'}</span>
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
