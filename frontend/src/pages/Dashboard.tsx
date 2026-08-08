import { useState, useEffect } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import { GlobeCdn } from '../components/ui/cobe-globe-cdn';
import { apiClient } from '../api/client';
import {
    Clock, Ghost, Phone, Link2, Target, Zap,
    TrendingUp, Calendar, ChevronDown, CheckCircle2, Loader2
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';

export function Dashboard() {
    const [contacts, setContacts] = useState<any[]>([]);
    const [agentCount, setAgentCount] = useState<number>(0);
    const [loading, setLoading] = useState(true);
    const [usageTab, setUsageTab] = useState<'day' | 'week' | 'month'>('month');

    // Proper React state for DB metrics (not window globals!)
    const [analytics, setAnalytics] = useState<any>(null);
    const [totalContacts, setTotalContacts] = useState<number>(0);
    const [outboundCampaignsCount, setOutboundCampaignsCount] = useState<number>(0);
    const [dbMetrics, setDbMetrics] = useState<{
        total_cost: number;
        total_duration_sec: number;
        total_calls: number;
        success_calls: number;
        failed_calls: number;
        success_rate: number;
    } | null>(null);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [agentsRes, meRes] = await Promise.all([
                    apiClient.get('/agents/'),
                    apiClient.get('/auth/me').catch(() => null)
                ]);

                // Fire Sessions sync lazily in the background to prevent UI blocking for graphs
                apiClient.get('/calling/call-sessions?page_size=5000').then(sessionsRes => {
                    let validSessions = sessionsRes.data?.data?.callSessions || sessionsRes.data?.data || [];
                    setContacts(validSessions);
                }).catch(() => setContacts([]));

                let rawAgentsData = agentsRes.data?.data || agentsRes.data || [];
                if (!Array.isArray(rawAgentsData) && typeof rawAgentsData === 'object') {
                    const arrays = Object.values(rawAgentsData).filter(v => Array.isArray(v));
                    if (arrays.length > 0) rawAgentsData = arrays[0];
                    else rawAgentsData = [rawAgentsData];
                }
                setAgentCount(rawAgentsData.length);

                // Query Pre-Aggregated DB metrics — properly set into React state so UI re-renders!
                try {
                    const metricsRes = await apiClient.get(`/dashboard/metrics`);
                    const m = metricsRes.data?.data;
                    if (m) {
                        setDbMetrics({
                            total_cost: m.total_cost ?? 0,
                            total_duration_sec: m.total_duration_sec ?? 0,
                            total_calls: m.total_calls ?? 0,
                            success_calls: m.success_calls ?? 0,
                            failed_calls: m.failed_calls ?? 0,
                            success_rate: m.success_rate ?? 0,
                        });
                    }
                } catch (metricsErr) {
                    console.error('Dashboard DB metrics fetch failed:', metricsErr);
                }

                // Fetch actual contacts count
                apiClient.get('/contacts?limit=5000').then(contactsRes => {
                    const contactsList = contactsRes.data?.data || [];
                    setTotalContacts(contactsList.length);
                }).catch(() => setTotalContacts(0));

                // Fetch campaigns count
                apiClient.get('/campaigns?limit=500').then(campaignsRes => {
                    let campaignsList = campaignsRes.data?.data || campaignsRes.data || [];
                    if (!Array.isArray(campaignsList) && typeof campaignsList === 'object') {
                        const arrays = Object.values(campaignsList).filter(v => Array.isArray(v));
                        campaignsList = arrays.length > 0 ? arrays[0] : [];
                    }
                    setOutboundCampaignsCount(campaignsList.length);
                }).catch(() => setOutboundCampaignsCount(0));

            } catch (err) {
                console.error("Dashboard Analytics extraction failed", err);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, []);

    // Secure WebSocket Auto-Refresh natively tracking CallRecord Webhooks!

    // Secure WebSocket Auto-Refresh natively tracking CallRecord Webhooks!
    useEffect(() => {
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        // Connect accurately to FastAPI ws mount
        const wsUrl = import.meta.env.MODE === 'production'
            ? `${wsProtocol}//${window.location.host}/ws`
            : 'ws://localhost:8000/ws';

        const ws = new WebSocket(wsUrl);
        ws.onmessage = (event) => {
            if (event.data === 'update') {
                console.log("⚡ INJECTION DETECTED: Hot Relaying Native Dashboard...");
                window.location.reload();
            }
        };
        return () => ws.close();
    }, []);

    // Perform live structural O(n) geometric aggregations natively over Ravan data endpoints!
    const totalCalls = dbMetrics?.total_calls || analytics?.total_calls || contacts.filter(c => c.durationSec > 0 || c.callDurationSec > 0 || c.status === 'completed' || c.status === 'success' || c.status === 'failed').length;

    // Format duration from DB metrics or fallback to live sessions sum
    const rawTotalSeconds = dbMetrics?.total_duration_sec || analytics?.total_seconds || contacts.reduce((sum, c) => sum + (c.durationSec || c.callDurationSec || c.duration_sec || 0), 0);
    const mm = Math.floor(rawTotalSeconds / 60);
    const ss = Math.floor(rawTotalSeconds % 60);
    const formattedDuration = rawTotalSeconds > 0 ? `${mm}m ${ss}s` : '0m 0s';

    const successCalls = dbMetrics?.success_calls || contacts.filter(c => c.status === 'success' || c.status === 'completed').length;
    let _rate = dbMetrics?.success_rate || analytics?.success_rate || (totalCalls > 0 ? ((successCalls / totalCalls) * 100) : 0);
    if (typeof _rate === 'number') _rate = _rate.toFixed(2);
    const successRate = _rate;

    // Total credits consumed from DB or fallback to minute-based estimate from sessions
    const totalCreditsSpent = dbMetrics?.total_cost || contacts.reduce((sum, c) => sum + (c.costTotal !== undefined ? c.costTotal * 7.0 : (c.durationSec || c.callDurationSec || c.duration_sec || 0) / 60.0 * 7.0), 0);

    // Live Data Generation for Graph Mapping Today
    const today = new Date().toISOString().split('T')[0];
    const todayContacts = contacts.filter(c => {
        const targetStr = c.startedAt || c.createdAt;
        return targetStr && targetStr.startsWith(today);
    });

    // Abstract real-time live calls dynamically mapped off queue latency state
    const liveCalls = analytics?.live_calls ?? contacts.filter(c => c.status === 'dialing' || c.status === 'pending' || c.status === 'in-progress').length;

    // Use specific fast mapped arrays if fetched by analytic pipelines!
    const hourlyCounts = analytics?.hourly_map ?? Array(24).fill(0);
    if (!analytics) {
        todayContacts.forEach(c => {
            const targetStr = c.startedAt || c.createdAt;
            if (targetStr) {
                const hour = new Date(targetStr).getHours();
                hourlyCounts[hour] += 1;
            }
        });
    }

    const outboundCount = todayContacts.filter(c => c.channel?.toLowerCase().includes('outbound')).length;
    const inboundCount = todayContacts.filter(c => c.channel?.toLowerCase().includes('inbound')).length;
    const webCount = todayContacts.filter(c => c.channel?.toLowerCase().includes('web')).length;

    const maxPerHour = Math.max(...hourlyCounts, 1); // Avoid div zero

    // Build SVG coordinates mathematically (X mapping 0-100, Y mapping 100-0)
    const points = hourlyCounts.map((val: number, idx: number) => {
        const x = (idx / 23) * 100;
        const y = 100 - ((val / maxPerHour) * 80); // max 80% height padding
        return `${x},${y}`;
    }).join(' ');

    // Trending Polygon Usage Map Aggregation (Day/Week/Month)
    // Map bounds against active Contacts mapping interval subset array logic securely
    // Trending Polygon Usage Map Aggregation (Day/Week/Month)
    // Map bounds against active Contacts mapping interval subset array logic securely
    const getIntervalBoundData = () => {
        let mappedData = Array(12).fill(0); // Standardize on 12 plot points for visual coherence

        // Dynamically pull mapped true metrics if analytics graph is populated directly from Ravan bounds
        if (analytics) {
            if (usageTab === 'day' && analytics.usage_day) mappedData = analytics.usage_day;
            else if (usageTab === 'week' && analytics.usage_week) mappedData = analytics.usage_week;
            else if (usageTab === 'month' && analytics.usage_month) mappedData = analytics.usage_month;
        } else {
            // Deprecated fallback: mock extraction sequence on legacy structured db
            const now = new Date();
            let filteredContacts = [...contacts];

            if (usageTab === 'day') {
                const todayStr = now.toISOString().split('T')[0];
                filteredContacts = filteredContacts.filter(c => {
                    const targetStr = c.startedAt || c.createdAt;
                    return targetStr && targetStr.startsWith(todayStr)
                });
                filteredContacts.forEach(c => {
                    const targetStr = c.startedAt || c.createdAt;
                    const h = new Date(targetStr).getHours();
                    mappedData[Math.floor(h / 2)] += (c.durationSec || c.callDurationSec || c.duration_sec || 0) / 60.0;
                });
            }
            else if (usageTab === 'week') {
                const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                filteredContacts = filteredContacts.filter(c => {
                    const targetStr = c.startedAt || c.createdAt;
                    return targetStr && new Date(targetStr) >= lastWeek;
                });
                filteredContacts.forEach(c => {
                    const targetStr = c.startedAt || c.createdAt;
                    const dayOffset = Math.floor((now.getTime() - new Date(targetStr).getTime()) / (24 * 60 * 60 * 1000));
                    if (dayOffset >= 0 && dayOffset < 7) {
                        mappedData[6 - dayOffset] += (c.durationSec || c.callDurationSec || c.duration_sec || 0) / 60.0;
                    }
                });
            }
            else if (usageTab === 'month') {
                const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                filteredContacts = filteredContacts.filter(c => {
                    const targetStr = c.startedAt || c.createdAt;
                    return targetStr && new Date(targetStr) >= lastMonth;
                });
                filteredContacts.forEach(c => {
                    const targetStr = c.startedAt || c.createdAt;
                    const chunks = Math.floor((now.getTime() - new Date(targetStr).getTime()) / (3 * 24 * 60 * 60 * 1000));
                    if (chunks >= 0 && chunks < 10) {
                        mappedData[9 - chunks] += (c.durationSec || c.callDurationSec || c.duration_sec || 0) / 60.0;
                    }
                });
            }
        }

        const maxScale = Math.max(...mappedData, 0.1);
        const polyPoints = mappedData.map((val: number, idx: number) => {
            const x = (idx / (mappedData.length - 1 || 1)) * 100;
            const y = 100 - ((val / maxScale) * 80);
            return `${x},${y}`;
        }).join(' ');

        const chartData = mappedData.map((val: number, idx: number) => {
            let label = '';
            if (usageTab === 'day') {
                label = `${(idx * 2).toString().padStart(2, '0')}:00`;
            } else if (usageTab === 'week') {
                const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                label = days[idx % 7] || `D${idx + 1}`;
            } else {
                label = `Wk ${idx + 1}`;
            }
            return {
                name: label,
                duration: parseFloat(val.toFixed(2))
            };
        });

        return { points: polyPoints, max: (maxScale === 0.1 ? 0 : maxScale), total: mappedData.reduce((a, b) => a + b, 0), chartData };
    };

    const trendData = getIntervalBoundData();

    // Prepare data for Today's Activity Bar Chart
    const activityChartData = hourlyCounts.map((val: number, idx: number) => ({
        time: `${idx.toString().padStart(2, '0')}:00`,
        calls: val
    }));

    const peakHourIndex = hourlyCounts.indexOf(Math.max(...hourlyCounts));
    const peakHourCount = hourlyCounts[peakHourIndex];
    let peakHourStr = `${peakHourIndex.toString().padStart(2, '0')}:00`;
    if (peakHourCount === 0) peakHourStr = "--:--";

    return (
        <MainLayout>
            <div className="w-full bg-white rounded-2xl shadow-sm p-6 md:p-8 min-h-[85vh] text-gray-900 border border-gray-200">
                {/* Header Metrics */}
                <div className="mb-8">
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 mb-2">
                        Good Evening, ramanadham
                    </h1>
                    <p className="text-gray-500 text-sm md:text-base">
                        Your agents structured <span className="font-semibold text-gray-900">{loading ? <Loader2 size={12} className="inline animate-spin text-blue-500" /> : totalCalls} calls</span> this month.
                    </p>
                </div>

                {/* Dashboard Grid Payload */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                    {/* Left Metrics Matrix (8 columns) */}
                    <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-6">

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {/* Card 1 */}
                            <div className="bg-white border border-gray-200 rounded-xl p-5 hover:border-gray-300 shadow-sm transition-colors relative group">
                                <Clock size={16} className="text-gray-400 mb-6 inline-block" />
                                <div>
                                    <h3 className="text-gray-500 text-[10px] uppercase font-bold tracking-wider mb-1">Total Duration</h3>
                                    <p className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                        {loading ? <Loader2 size={20} className="animate-spin text-gray-400" /> : formattedDuration}
                                    </p>
                                </div>
                            </div>

                            {/* Card 2 */}
                            <div className="bg-white border border-gray-200 rounded-xl p-5 hover:border-gray-300 shadow-sm transition-colors relative group">
                                <Ghost size={16} className="text-gray-400 mb-6 inline-block" />
                                <div>
                                    <h3 className="text-gray-500 text-[10px] uppercase font-bold tracking-wider mb-1">Active Agents</h3>
                                    <p className="text-2xl font-bold text-gray-900">{loading ? <Loader2 size={20} className="animate-spin text-gray-400" /> : agentCount}</p>
                                </div>
                            </div>

                            {/* Card 3 - LIVE BADGE */}
                            <div className="bg-white border border-gray-200 rounded-xl p-5 hover:border-blue-200 shadow-sm transition-colors relative group">
                                <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2 py-1 bg-blue-50 rounded-full border border-blue-100">
                                    {liveCalls > 0 && <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse shadow-[0_0_8px_#3b82f6]"></div>}
                                    <span className="text-[9px] font-bold text-blue-600 tracking-wider uppercase">{liveCalls > 0 ? "LIVE" : "IDLE"}</span>
                                </div>
                                <Phone size={16} className="text-blue-500 mb-6 inline-block" />
                                <div>
                                    <h3 className="text-gray-500 text-[10px] uppercase font-bold tracking-wider mb-1">Live Calls</h3>
                                    <p className="text-2xl font-bold text-gray-900">{loading ? <Loader2 size={20} className="animate-spin text-gray-400" /> : totalCalls}</p>
                                </div>
                            </div>

                            {/* Card 4 */}
                            <div className="bg-white border border-gray-200 rounded-xl p-5 hover:border-gray-300 shadow-sm transition-colors relative group">
                                <Link2 size={16} className="text-gray-400 mb-6 inline-block group-hover:text-teal-500 transition-colors" />
                                <div>
                                    <h3 className="text-gray-500 text-[10px] uppercase font-bold tracking-wider mb-1">Total Consumed</h3>
                                    <p className="text-2xl font-black text-gray-900 flex items-center gap-2">
                                        {loading ? <Loader2 size={18} className="animate-spin text-gray-400" /> : <span className="text-teal-600 tracking-tight">{Number(totalCreditsSpent).toFixed(4)}</span>}
                                    </p>
                                </div>
                            </div>

                            {/* Card 5 */}
                            <div className="bg-white border border-gray-200 rounded-xl p-5 hover:border-gray-300 shadow-sm transition-colors relative group">
                                <Target size={16} className="text-gray-400 mb-6 inline-block" />
                                <div>
                                    <h3 className="text-gray-500 text-[10px] uppercase font-bold tracking-wider mb-1">All Contacts</h3>
                                    <p className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                        {loading ? <Loader2 size={20} className="animate-spin text-gray-400" /> : totalContacts}
                                    </p>
                                </div>
                            </div>

                            {/* Card 6 */}
                            <div className="bg-white border border-gray-200 rounded-xl p-5 hover:border-gray-300 shadow-sm transition-colors relative group">
                                <Zap size={16} className="text-gray-400 mb-6 inline-block" />
                                <div>
                                    <h3 className="text-gray-500 text-[10px] uppercase font-bold tracking-wider mb-1">Outbound Campaigns</h3>
                                    <p className="text-2xl font-bold text-gray-900">{loading ? <Loader2 size={20} className="animate-spin text-gray-400" /> : outboundCampaignsCount}</p>
                                </div>
                            </div>
                        </div>

                        {/* Bottom Left: Usage Trends Recharts Area */}
                        <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-6 relative flex flex-col min-h-[350px]">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h2 className="text-base font-bold text-gray-900 mb-0.5">Usage Trends</h2>
                                    <p className="text-xs text-gray-500">Live call duration mapping (minutes)</p>
                                </div>
                                <div className="flex bg-gray-50 p-1 rounded-lg border border-gray-200">
                                    <button onClick={() => setUsageTab('day')} className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${usageTab === 'day' ? 'bg-white text-blue-600 shadow-sm border border-gray-100' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100/50'}`}>Day</button>
                                    <button onClick={() => setUsageTab('week')} className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${usageTab === 'week' ? 'bg-white text-blue-600 shadow-sm border border-gray-100' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100/50'}`}>Week</button>
                                    <button onClick={() => setUsageTab('month')} className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${usageTab === 'month' ? 'bg-white text-blue-600 shadow-sm border border-gray-100' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100/50'}`}>Month</button>
                                </div>
                            </div>

                            <div className="flex-1 w-full mt-2">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={trendData.chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorDuration" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af', fontWeight: 600 }} dy={10} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af', fontWeight: 600 }} tickFormatter={(value) => `${value}m`} />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '12px', border: '1px solid #f3f4f6', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', fontWeight: 'bold', fontSize: '13px' }}
                                            itemStyle={{ color: '#3b82f6' }}
                                        />
                                        <Area type="monotone" dataKey="duration" name="Duration" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorDuration)" animationDuration={1500} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                    </div>

                    {/* Right Interactive Visuals (4 columns) */}
                    <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-6">

                        {/* Interactive Globe Container */}
                        <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-6 relative flex-1 overflow-hidden min-h-[380px] flex flex-col">
                            <div className="flex justify-between items-start absolute w-full left-0 top-0 p-6 z-10">
                                <div>
                                    <h2 className="text-base font-bold text-gray-900 mb-0.5">Global Reach</h2>
                                    <p className="text-xs text-gray-500">Active regions</p>
                                </div>
                                <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-50 rounded-full border border-blue-100">
                                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full shadow-[0_0_4px_#3b82f6]"></div>
                                    <span className="text-[9px] font-bold text-blue-600 tracking-wider uppercase">LIVE</span>
                                </div>
                            </div>

                            {/* The physical rendered cobe canvas (Small Size Responsive) */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[280px] h-[280px]">
                                <GlobeCdn />
                            </div>
                        </div>

                        {/* Call Outcomes Stats */}
                        <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-6 shrink-0">
                            <div>
                                <h2 className="text-base font-bold text-gray-900 mb-0.5">Call Outcomes</h2>
                                <p className="text-xs text-gray-500 mb-6">Success vs failed per week</p>
                            </div>

                            <div className="w-full">
                                {/* Outcomes Grid */}
                                <div className="grid grid-cols-3 gap-3 w-full">
                                    <div className="bg-gray-50 border border-gray-200 p-3 rounded-lg flex flex-col items-start w-full">
                                        <span className="text-gray-500 text-[9px] font-bold tracking-widest uppercase mb-1">TOTAL</span>
                                        <span className="text-gray-900 font-bold text-sm">{loading ? '--' : totalCalls}</span>
                                    </div>
                                    <div className="bg-gray-50 border border-red-200 p-3 rounded-lg flex flex-col items-start w-full">
                                        <span className="text-red-500 text-[9px] font-bold tracking-widest uppercase mb-1">FAILED</span>
                                        <span className="text-red-500 font-bold text-sm">
                                            {loading ? '--' : (analytics?.failed_calls ?? contacts.filter(c => c.status === 'failed' || c.status === 'no_answer').length)}
                                        </span>
                                    </div>
                                    <div className="bg-gray-50 border border-gray-200 p-3 rounded-lg flex flex-col items-start w-full">
                                        <span className="text-gray-500 text-[9px] font-bold tracking-widest uppercase mb-1">CONTACTED</span>
                                        <span className="text-gray-900 font-bold text-sm">{loading ? '--' : ((analytics?.success_calls || 0) + (analytics?.failed_calls || 0)) > 0 ? ((analytics?.success_calls || 0) + (analytics?.failed_calls || 0)) : totalCalls}</span>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>

                </div>

                {/* Bottom Supplemental Analytics Row */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">

                    {/* Active Agents Column */}
                    <div className="lg:col-span-3 bg-white border border-gray-200 shadow-sm rounded-xl p-6 flex flex-col">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h2 className="text-base font-bold text-gray-900 mb-0.5">Active Agents</h2>
                                <p className="text-xs text-gray-500">{loading ? '-' : agentCount} configured live</p>
                            </div>
                            <span className="text-xs font-medium text-gray-500 hover:text-gray-900 cursor-pointer">View all</span>
                        </div>

                        <div className="flex-1 flex flex-col gap-3">
                            {loading ? (
                                <div className="flex w-full items-center justify-center p-6 text-gray-300">
                                    <Loader2 size={16} className="animate-spin" />
                                </div>
                            ) : agentCount > 0 ? (
                                // Dynamically render actual generic array structure for the live agents matched
                                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center text-xs font-bold text-white shadow-sm ring-2 ring-blue-100">
                                            {agentCount}
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-gray-900">Active Ravan Pool</p>
                                            <p className="text-xs text-blue-600 font-medium">{liveCalls} live connections</p>
                                        </div>
                                    </div>
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_#3b82f6]"></div>
                                </div>
                            ) : (
                                <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 flex items-center justify-between opacity-60">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-500">
                                            NULL
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-gray-900">No active agents</p>
                                            <p className="text-xs text-gray-500">0 connections</p>
                                        </div>
                                    </div>
                                    <div className="w-1.5 h-1.5 rounded-full bg-gray-300"></div>
                                </div>
                            )}

                            <button className="w-full mt-auto py-2.5 rounded-lg border border-dashed border-gray-300 text-gray-600 text-sm font-medium hover:border-gray-400 hover:text-gray-900 hover:bg-gray-50 transition-colors">
                                + Create Agent
                            </button>
                        </div>
                    </div>

                    {/* Today's Activity Chart */}
                    <div className="lg:col-span-6 bg-white border border-gray-200 shadow-sm rounded-xl p-6 relative flex flex-col min-h-[300px]">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h2 className="text-base font-bold text-gray-900 mb-0.5">Today's Activity</h2>
                                <p className="text-xs text-gray-500">Call channels per hour</p>
                            </div>
                            <div className="py-1 px-3 bg-blue-50 border border-blue-100 rounded-full flex items-center gap-2">
                                <TrendingUp size={12} className="text-blue-500" />
                                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">{loading ? <Loader2 size={10} className="animate-spin inline" /> : (analytics ? (analytics.today_activity?.outbound + analytics.today_activity?.inbound + analytics.today_activity?.web) : todayContacts.length)} today</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-6 mb-8 mt-2">
                            <span className="text-[10px] text-gray-500 font-medium">Peak hour <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-700 ml-1">{peakHourStr}</span> <span className="ml-1 text-gray-900 font-bold">{loading ? '-' : peakHourCount} calls</span></span>
                            <div className="flex items-center gap-4 ml-auto">
                                <div className="flex items-center gap-1.5"><div className="w-3 h-0.5 bg-green-500"></div><span className="text-xs text-gray-500 font-bold">Outbound <span className="text-gray-900">({analytics?.today_activity?.outbound ?? outboundCount})</span></span></div>
                                <div className="flex items-center gap-1.5"><div className="w-3 h-0.5 bg-blue-500"></div><span className="text-xs text-gray-500 font-bold">Inbound <span className="text-gray-900">({analytics?.today_activity?.inbound ?? inboundCount})</span></span></div>
                                <div className="flex items-center gap-1.5"><div className="w-3 h-0.5 bg-purple-500"></div><span className="text-xs text-gray-500 font-bold">Web <span className="text-gray-900">({analytics?.today_activity?.web ?? webCount})</span></span></div>
                            </div>
                        </div>

                        {/* Interactive Recharts Activity Bar Chart */}
                        <div className="flex-1 w-full h-[180px] min-h-[160px] pb-2 mt-4 relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={activityChartData} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                    <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af', fontWeight: 600 }} dy={8} interval="preserveStartEnd" minTickGap={20} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af', fontWeight: 600 }} allowDecimals={false} />
                                    <Tooltip
                                        cursor={{ fill: '#f9fafb' }}
                                        contentStyle={{ borderRadius: '12px', border: '1px solid #f3f4f6', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', fontWeight: 'bold', fontSize: '13px' }}
                                        itemStyle={{ color: '#22c55e' }}
                                    />
                                    <Bar dataKey="calls" name="Total Calls" fill="#22c55e" radius={[4, 4, 0, 0]} animationDuration={1200} maxBarSize={16}>
                                        {activityChartData.map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={index === new Date().getHours() ? '#16a34a' : '#86efac'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Chart Bottom Labels */}
                        <div className="mt-8 flex justify-between items-center px-2">
                            <div className="flex items-center gap-4 text-gray-500 text-xs">
                                <span className="flex items-center gap-1.5"><Phone size={12} /> Outbound <span className="font-bold text-gray-900 border border-gray-200 px-1 rounded bg-gray-50 ml-1">{loading ? '-' : todayContacts.length}</span></span>
                                <span className="flex items-center gap-1.5 opacity-50"><Phone size={12} className="rotate-180" /> Inbound <span className="font-bold text-gray-900 border border-gray-200 px-1 rounded bg-gray-50 ml-1">0</span></span>
                            </div>
                            <span className="flex items-center gap-1.5 text-xs text-gray-500"><div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div> Total <span className="font-bold text-gray-900 border border-gray-200 px-1 rounded bg-gray-50 ml-1">{loading ? '-' : todayContacts.length}</span></span>
                        </div>
                    </div>

                    {/* Top Countries Column */}
                    <div className="lg:col-span-3 bg-white border border-gray-200 shadow-sm rounded-xl p-6 flex flex-col min-h-[300px]">
                        <h2 className="text-xs font-bold text-gray-500 tracking-wider uppercase mb-6">Top Countries</h2>

                        <div className="flex-1 flex items-center justify-center border-b border-gray-100">
                            <p className="text-gray-400 text-sm font-medium">No data yet</p>
                        </div>

                        <div className="pt-6">
                            <h3 className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-2">Countries</h3>
                            <p className="text-2xl font-bold text-gray-900">0</p>
                        </div>
                    </div>
                </div>

                {/* Quick Actions Panel */}
                <div className="mt-6 bg-white border border-gray-200 shadow-sm rounded-xl p-6">
                    <h2 className="text-base font-bold text-gray-900 mb-4">Quick Actions</h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

                        {/* Action 1 */}
                        <div className="group border border-gray-200 bg-gray-50 hover:bg-white hover:border-blue-200 hover:shadow-sm transition-all rounded-xl p-4 flex items-center gap-4 cursor-pointer">
                            <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center shrink-0 group-hover:bg-blue-50 group-hover:border-blue-100 transition-colors">
                                <Ghost size={18} className="text-gray-600 group-hover:text-blue-600" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-sm font-bold text-gray-900">Create Agent</h3>
                                <p className="text-[11px] text-gray-500 mt-0.5">Build AI assistant</p>
                            </div>
                            <ChevronDown size={14} className="text-gray-400 transform -rotate-90 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                        </div>

                        {/* Action 2 */}
                        <div className="group border border-gray-200 bg-gray-50 hover:bg-white hover:border-blue-200 hover:shadow-sm transition-all rounded-xl p-4 flex items-center gap-4 cursor-pointer">
                            <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center shrink-0 group-hover:bg-blue-50 group-hover:border-blue-100 transition-colors">
                                <Zap size={18} className="text-gray-600 group-hover:text-blue-600" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-sm font-bold text-gray-900">New Campaign</h3>
                                <p className="text-[11px] text-gray-500 mt-0.5">Launch outbound calls</p>
                            </div>
                            <ChevronDown size={14} className="text-gray-400 transform -rotate-90 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                        </div>

                        {/* Action 3 */}
                        <div className="group border border-gray-200 bg-gray-50 hover:bg-white hover:border-blue-200 hover:shadow-sm transition-all rounded-xl p-4 flex items-center gap-4 cursor-pointer">
                            <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center shrink-0 group-hover:bg-blue-50 group-hover:border-blue-100 transition-colors">
                                <Target size={18} className="text-gray-600 group-hover:text-blue-600" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-sm font-bold text-gray-900">Add Contact</h3>
                                <p className="text-[11px] text-gray-500 mt-0.5">Import or create</p>
                            </div>
                            <ChevronDown size={14} className="text-gray-400 transform -rotate-90 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                        </div>

                        {/* Action 4 */}
                        <div className="group border border-gray-200 bg-gray-50 hover:bg-white hover:border-blue-200 hover:shadow-sm transition-all rounded-xl p-4 flex items-center gap-4 cursor-pointer">
                            <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center shrink-0 group-hover:bg-blue-50 group-hover:border-blue-100 transition-colors">
                                <Phone size={18} className="text-gray-600 group-hover:text-blue-600" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-sm font-bold text-gray-900">Add Number</h3>
                                <p className="text-[11px] text-gray-500 mt-0.5">Provision number</p>
                            </div>
                            <ChevronDown size={14} className="text-gray-400 transform -rotate-90 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                        </div>

                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
