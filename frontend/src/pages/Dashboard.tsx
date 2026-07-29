import { useState, useEffect } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import { GlobeCdn } from '../components/ui/cobe-globe-cdn';
import { apiClient } from '../api/client';
import {
    Clock, Ghost, Phone, Link2, Target, Zap,
    TrendingUp, Calendar, ChevronDown, CheckCircle2, Loader2
} from 'lucide-react';

export function Dashboard() {
    const [contacts, setContacts] = useState<any[]>([]);
    const [agentCount, setAgentCount] = useState<number>(0);
    const [loading, setLoading] = useState(true);
    const [usageTab, setUsageTab] = useState<'day' | 'week' | 'month'>('month');

    // New Additional Analytics Model
    const [analytics, setAnalytics] = useState<any>(null);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [contactsRes, agentsRes, meRes] = await Promise.all([
                    apiClient.get('/api/ravan/contacts'),
                    apiClient.get('/api/ravan/agents'),
                    apiClient.get('/auth/me').catch(() => null)
                ]);

                let validContacts = contactsRes.data?.data || [];
                let mappedQuota = 0;
                let boundCustomer: any = null;

                // Intelligently aggregate customer specific native bounded logic pulling strictly mapped quotas inside DB!
                if (meRes && meRes.data) {
                    boundCustomer = meRes.data;

                    if (typeof boundCustomer.agent_quota === 'number' && boundCustomer.agent_quota > 0) {
                        mappedQuota = boundCustomer.agent_quota;
                    }

                    // Secure Sandbox Limit constraint tracking natively over Target Ravan Agent UUID assigned from UserManagement!
                    if (boundCustomer.ravan_agent_id && boundCustomer.role !== 'admin') {
                        validContacts = validContacts.filter((c: any) =>
                            c.agentId === boundCustomer.ravan_agent_id ||
                            c.agent_id === boundCustomer.ravan_agent_id ||
                            c.campaignId === boundCustomer.ravan_agent_id ||
                            (c.campaign && c.campaign.id === boundCustomer.ravan_agent_id)
                        );
                    }
                }

                setContacts(validContacts);
                setAgentCount(mappedQuota > 0 ? mappedQuota : (agentsRes.data?.meta?.total || 0));

                // Force super-fast global coins cost aggregation reading native Ravan logs!
                try {
                    const globalAggRes = await apiClient.get(`/api/ravan/calling/global-cost-aggregation`);
                    if (globalAggRes.data && globalAggRes.data.success) {
                        (window as any)._oldGlobalTotal = globalAggRes.data.total_coins;
                    }
                } catch (aggErr) {
                    console.error('Global Cost Aggregation Engine failed:', aggErr);
                }

                // Fetch Call Sessions for EXACT cost_total sum via addition operator across all history!
                try {
                    const queryParams = boundCustomer?.ravan_agent_id ? `?agent_id=${boundCustomer.ravan_agent_id}&page_size=5000` : `?page_size=5000`;
                    const callSessionsRes = await apiClient.get(`/api/ravan/calling/call-sessions${queryParams}`);
                    const sessions = callSessionsRes.data?.data?.callSessions || callSessionsRes.data?.data || [];
                    const preciseSum = (Array.isArray(sessions) ? sessions : []).reduce((sum: number, session: any) => sum + Number(session.cost_total || session.costTotal || 0), 0);
                    (window as any)._preciseCreditsTotal = preciseSum;
                } catch (sessionErr) {
                    console.error('Explicit Session Cost engine failed:', sessionErr);
                }

                // New Additional Method: Rapid Analytics Extractor based on natively bound Campaign ID
                try {
                    if (boundCustomer?.ravan_campaign_id) {
                        const analyticsRes = await apiClient.get(`/api/ravan/campaigns/${boundCustomer.ravan_campaign_id}/analytics`);
                        if (analyticsRes.data && analyticsRes.data.success) {
                            setAnalytics(analyticsRes.data.data);
                        }
                    }
                } catch (analyticsErr) {
                    console.error("Failed to fetch additional analytics pipeline", analyticsErr);
                }

            } catch (err) {
                console.error("Dashboard Analytics extraction failed", err);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, []);

    // Perform live structural O(n) geometric aggregations natively over Ravan data endpoints!
    const totalCalls = analytics?.total_calls ?? contacts.filter(c => c.callDurationSec > 0 || c.status === 'completed' || c.status === 'success' || c.status === 'failed').length;

    // Format duration visually to perfectly align with Calls.tsx 
    const rawTotalSeconds = analytics?.total_seconds ?? contacts.reduce((sum, c) => sum + (c.callDurationSec || 0), 0);
    const mm = Math.floor(rawTotalSeconds / 60);
    const ss = Math.floor(rawTotalSeconds % 60);
    const formattedDuration = `${mm}m ${ss}s`;

    const successCalls = contacts.filter(c => c.status === 'success' || c.status === 'completed').length;
    const successRate = analytics?.success_rate ?? (totalCalls > 0 ? ((successCalls / totalCalls) * 100).toFixed(2) : "0.00");

    // Use precisely aggregated details backend pipeline or calculate manually by summing duration from all contact history
    const totalCreditsSpent = typeof (window as any)._preciseCreditsTotal === 'number' ? (window as any)._preciseCreditsTotal : contacts.reduce((sum, c) => sum + Number((c.callDurationSec || c.duration_sec || 0) / 60.0), 0);

    // Live Data Generation for Graph Mapping Today
    const today = new Date().toISOString().split('T')[0];
    const todayContacts = contacts.filter(c => c.createdAt && c.createdAt.startsWith(today));

    // Abstract real-time live calls dynamically mapped off queue latency state
    const liveCalls = analytics?.live_calls ?? contacts.filter(c => c.status === 'dialing' || c.status === 'pending' || c.status === 'in-progress').length;

    // Use specific fast mapped arrays if fetched by analytic pipelines!
    const hourlyCounts = analytics?.hourly_map ?? Array(24).fill(0);
    if (!analytics) {
        todayContacts.forEach(c => {
            const hour = new Date(c.createdAt).getHours();
            hourlyCounts[hour] += 1;
        });
    }

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
                filteredContacts = filteredContacts.filter(c => c.createdAt && c.createdAt.startsWith(todayStr));
                filteredContacts.forEach(c => {
                    const h = new Date(c.createdAt).getHours();
                    mappedData[Math.floor(h / 2)] += (c.callDurationSec || c.duration_sec || 0) / 60.0;
                });
            }
            else if (usageTab === 'week') {
                const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                filteredContacts = filteredContacts.filter(c => c.createdAt && new Date(c.createdAt) >= lastWeek);
                filteredContacts.forEach(c => {
                    const dayOffset = Math.floor((now.getTime() - new Date(c.createdAt).getTime()) / (24 * 60 * 60 * 1000));
                    if (dayOffset >= 0 && dayOffset < 7) {
                        mappedData[6 - dayOffset] += (c.callDurationSec || c.duration_sec || 0) / 60.0;
                    }
                });
            }
            else if (usageTab === 'month') {
                const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                filteredContacts = filteredContacts.filter(c => c.createdAt && new Date(c.createdAt) >= lastMonth);
                filteredContacts.forEach(c => {
                    const chunks = Math.floor((now.getTime() - new Date(c.createdAt).getTime()) / (3 * 24 * 60 * 60 * 1000));
                    if (chunks >= 0 && chunks < 10) {
                        mappedData[9 - chunks] += (c.callDurationSec || c.duration_sec || 0) / 60.0;
                    }
                });
            }
        }

        const maxScale = Math.max(...mappedData, 0.1);
        const polyPoints = mappedData.map((val, idx) => {
            const x = (idx / (mappedData.length - 1 || 1)) * 100;
            const y = 100 - ((val / maxScale) * 80);
            return `${x},${y}`;
        }).join(' ');

        return { points: polyPoints, max: (maxScale === 0.1 ? 0 : maxScale), total: mappedData.reduce((a, b) => a + b, 0) };
    };

    const trendData = getIntervalBoundData();

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
                        Your agents structured <span className="font-semibold text-gray-900">{loading ? <Loader2 size={12} className="inline animate-spin text-blue-500" /> : totalCalls} calls</span> this month mapping <span className="text-green-600 font-semibold">{loading ? '--' : successRate}% success</span> boundary.
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
                                    <p className="text-2xl font-bold text-gray-900">{loading ? <Loader2 size={20} className="animate-spin text-gray-400" /> : liveCalls}</p>
                                </div>
                            </div>

                            {/* Card 4 */}
                            <div className="bg-white border border-gray-200 rounded-xl p-5 hover:border-gray-300 shadow-sm transition-colors relative group">
                                <Link2 size={16} className="text-gray-400 mb-6 inline-block group-hover:text-teal-500 transition-colors" />
                                <div>
                                    <h3 className="text-gray-500 text-[10px] uppercase font-bold tracking-wider mb-1">Total Consumed</h3>
                                    <p className="text-2xl font-black text-gray-900 flex items-center gap-2">
                                        {loading ? <Loader2 size={18} className="animate-spin text-gray-400" /> : <span className="text-teal-600 tracking-tight">{(totalCreditsSpent * 5.2).toFixed(4)} Coins</span>}
                                    </p>
                                </div>
                            </div>



                            {/* Card 5 */}
                            <div className="bg-white border border-gray-200 rounded-xl p-5 hover:border-gray-300 shadow-sm transition-colors relative group">
                                <Target size={16} className="text-gray-400 mb-6 inline-block" />
                                <div>
                                    <h3 className="text-gray-500 text-[10px] uppercase font-bold tracking-wider mb-1">Success Rate</h3>
                                    <p className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                        {loading ? <Loader2 size={20} className="animate-spin text-gray-400" /> : `${successRate}%`}
                                    </p>
                                </div>
                            </div>

                            {/* Card 6 */}
                            <div className="bg-white border border-gray-200 rounded-xl p-5 hover:border-gray-300 shadow-sm transition-colors relative group">
                                <Zap size={16} className="text-gray-400 mb-6 inline-block" />
                                <div className="absolute top-8 left-10 opacity-30">
                                    <svg width="40" height="20" viewBox="0 0 40 20">
                                        <path d="M 0,20 L 10,12 L 20,15 L 40,2" fill="none" stroke="#e5e7eb" strokeWidth="2" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-gray-500 text-[10px] uppercase font-bold tracking-wider mb-1">Conversion</h3>
                                    <p className="text-2xl font-bold text-gray-900">{analytics?.conversion != null ? `${analytics.conversion}%` : `${successRate}%`}</p>
                                </div>
                            </div>
                        </div>

                        {/* Bottom Left: Usage Trends Placeholder */}
                        <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-6 relative flex-1 min-h-[220px]">
                            <div className="flex justify-between items-start mb-8">
                                <div>
                                    <h2 className="text-base font-bold text-gray-900 mb-0.5">Usage Trends</h2>
                                    <p className="text-xs text-gray-500">Live call duration mapping (minutes)</p>
                                </div>
                                <div className="flex bg-gray-50 p-1 rounded-lg border border-gray-200">
                                    <button onClick={() => setUsageTab('day')} className={`px-3 py-1 text-xs font-medium rounded-md ${usageTab === 'day' ? 'bg-white text-gray-900 shadow-sm border border-gray-200' : 'text-gray-500 hover:text-gray-900'}`}>Day</button>
                                    <button onClick={() => setUsageTab('week')} className={`px-3 py-1 text-xs font-medium rounded-md ${usageTab === 'week' ? 'bg-white text-gray-900 shadow-sm border border-gray-200' : 'text-gray-500 hover:text-gray-900'}`}>Week</button>
                                    <button onClick={() => setUsageTab('month')} className={`px-3 py-1 text-xs font-medium rounded-md ${usageTab === 'month' ? 'bg-white text-gray-900 shadow-sm border border-gray-200' : 'text-gray-500 hover:text-gray-900'}`}>Month</button>
                                </div>
                            </div>

                            {/* Abstract Mock Line Chart overlay */}
                            <div className="absolute bottom-6 left-6 right-6 h-32 flex items-end">
                                <div className="w-full h-full border-l border-b border-gray-200 relative">
                                    {/* Fake Y Axis precisely bound to Duration in minutes! */}
                                    <div className="absolute -left-4 bottom-0 text-[9px] text-gray-400">0m</div>
                                    <div className="absolute -left-4 top-[50%] -translate-y-1/2 text-[9px] text-gray-400">{Math.round(trendData.max / 2)}m</div>
                                    <div className="absolute -left-6 top-0 text-[9px] text-gray-400">{trendData.max.toFixed(1)}m</div>
                                    {/* SVG Line mapping dynamically onto the exact subset bounds parsed physically! */}
                                    <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 100">
                                        <defs>
                                            <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
                                                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                                            </linearGradient>
                                        </defs>
                                        <polygon points={`0,100 ${trendData.points} 100,100`} fill="url(#trendGradient)" className="transition-all duration-300" />
                                        <polyline points={trendData.points} fill="none" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="transition-all duration-300" />
                                        {trendData.total === 0 && (
                                            <line x1="0" y1="100" x2="100" y2="100" stroke="#9ca3af" strokeWidth="1" strokeDasharray="2 4" />
                                        )}
                                    </svg>
                                </div>
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

                            <div className="flex gap-6 items-center">
                                {/* SVG Donut representing 0% */}
                                <div className="relative w-16 h-16 shrink-0">
                                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                                        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#f3f4f6" strokeWidth="3" />
                                        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#3b82f6" strokeWidth="3" strokeDasharray={`${parseFloat(successRate)}, 100`} />
                                    </svg>
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center text-gray-900 font-bold text-[10px]">
                                        {loading ? <Loader2 size={10} className="animate-spin mx-auto" /> : `${Math.round(parseFloat(successRate))}%`}<br /><span className="text-[7px] text-gray-500 font-medium leading-none">SUCCESS</span>
                                    </div>
                                </div>

                                {/* Outcomes Grid */}
                                <div className="grid grid-cols-2 gap-3 w-full">
                                    <div className="bg-gray-50 border border-gray-200 p-3 rounded-lg flex flex-col items-start min-w-[70px]">
                                        <span className="text-gray-500 text-[9px] font-bold tracking-widest uppercase mb-1">TOTAL</span>
                                        <span className="text-gray-900 font-bold text-sm">{loading ? '--' : totalCalls}</span>
                                    </div>
                                    <div className="bg-gray-50 border border-green-200 p-3 rounded-lg flex flex-col items-start min-w-[70px]">
                                        <span className="text-green-600 text-[9px] font-bold tracking-widest uppercase mb-1">SUCCESS</span>
                                        <span className="text-green-600 font-bold text-sm">{loading ? '--' : successCalls}</span>
                                    </div>
                                    <div className="bg-gray-50 border border-red-200 p-3 rounded-lg flex flex-col items-start min-w-[70px]">
                                        <span className="text-red-500 text-[9px] font-bold tracking-widest uppercase mb-1">FAILED</span>
                                        <span className="text-red-500 font-bold text-sm">
                                            {loading ? '--' : (analytics?.failed_calls ?? contacts.filter(c => c.status === 'failed' || c.status === 'no_answer').length)}
                                        </span>
                                    </div>
                                    <div className="bg-gray-50 border border-gray-200 p-3 rounded-lg flex flex-col items-start min-w-[70px]">
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
                                <div className="flex items-center gap-1.5"><div className="w-3 h-0.5 bg-green-500"></div><span className="text-xs text-gray-500 font-bold">Outbound <span className="text-gray-900">({analytics?.today_activity?.outbound || 0})</span></span></div>
                                <div className="flex items-center gap-1.5"><div className="w-3 h-0.5 bg-blue-500"></div><span className="text-xs text-gray-500 font-bold">Inbound <span className="text-gray-900">({analytics?.today_activity?.inbound || 0})</span></span></div>
                                <div className="flex items-center gap-1.5"><div className="w-3 h-0.5 bg-purple-500"></div><span className="text-xs text-gray-500 font-bold">Web <span className="text-gray-900">({analytics?.today_activity?.web || 0})</span></span></div>
                            </div>
                        </div>

                        {/* Abstract Chart mapping */}
                        <div className="flex-1 relative border-l border-b border-gray-200">
                            {/* Y-axis placeholders */}
                            <div className="absolute -left-4 bottom-0 text-[9px] text-gray-400">0</div>
                            <div className="absolute -left-4 top-[50%] -translate-y-1/2 text-[9px] text-gray-400">{Math.round(maxPerHour / 2)}</div>
                            <div className="absolute -left-4 top-0 text-[9px] text-gray-400">{maxPerHour}</div>

                            {/* X-axis placeholders */}
                            <div className="absolute -bottom-5 left-0 text-[9px] text-gray-400">00:00</div>
                            <div className="absolute -bottom-5 left-1/4 -translate-x-1/2 text-[9px] text-gray-400">06:00</div>
                            <div className="absolute -bottom-5 left-2/4 -translate-x-1/2 text-[9px] text-gray-400">12:00</div>
                            <div className="absolute -bottom-5 left-3/4 -translate-x-1/2 text-[9px] text-gray-400">18:00</div>
                            <div className="absolute -bottom-5 right-0 text-[9px] text-gray-400">23:59</div>

                            {/* Live Active Data Graph! */}
                            <svg className="absolute w-full h-full inset-0 overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 100">
                                {/* Gradient Fill Masking Underneath Chart */}
                                <defs>
                                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
                                        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                                    </linearGradient>
                                </defs>
                                <polygon points={`0,100 ${points} 100,100`} fill="url(#chartGradient)" />
                                <polyline points={points} fill="none" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />

                                {/* Dynamically pulse the last node if active locally */}
                                {todayContacts.length > 0 && hourlyCounts[23] > 0 && (
                                    <circle cx="100" cy={100 - ((hourlyCounts[23] / maxPerHour) * 80)} r="2" fill="#22c55e" className="animate-pulse shadow-sm" />
                                )}
                            </svg>

                            {/* Empty baseline placeholder only seen if zero active mapping bounds */}
                            {todayContacts.length === 0 && (
                                <div className="absolute bottom-0 left-0 w-full h-[1.5px] bg-gray-200 opacity-50 border-dashed border-b border-gray-300"></div>
                            )}
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
