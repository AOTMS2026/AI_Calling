import { MainLayout } from '../components/layout/MainLayout';
import { GlobeCdn } from '../components/ui/cobe-globe-cdn';
import {
    Clock, Ghost, Phone, Link2, Target, Zap,
    TrendingUp, Calendar, ChevronDown, CheckCircle2
} from 'lucide-react';

export function Dashboard() {
    return (
        <MainLayout>
            <div className="w-full bg-white rounded-2xl shadow-sm p-6 md:p-8 min-h-[85vh] text-gray-900 border border-gray-200">
                {/* Header Metrics */}
                <div className="mb-8">
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 mb-2">
                        Good Evening, ramanadham
                    </h1>
                    <p className="text-gray-500 text-sm md:text-base">
                        Your agents handled <span className="font-semibold text-gray-900">0 calls</span> this month with <span className="text-green-600 font-semibold">0.00% success</span>
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
                                    <h3 className="text-gray-500 text-[10px] uppercase font-bold tracking-wider mb-1">Total Minutes</h3>
                                    <p className="text-2xl font-bold text-gray-900">0</p>
                                </div>
                            </div>

                            {/* Card 2 */}
                            <div className="bg-white border border-gray-200 rounded-xl p-5 hover:border-gray-300 shadow-sm transition-colors relative group">
                                <Ghost size={16} className="text-gray-400 mb-6 inline-block" />
                                <div>
                                    <h3 className="text-gray-500 text-[10px] uppercase font-bold tracking-wider mb-1">Active Agents</h3>
                                    <p className="text-2xl font-bold text-gray-900">0</p>
                                </div>
                            </div>

                            {/* Card 3 - LIVE BADGE */}
                            <div className="bg-white border border-gray-200 rounded-xl p-5 hover:border-blue-200 shadow-sm transition-colors relative group">
                                <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2 py-1 bg-blue-50 rounded-full border border-blue-100">
                                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse shadow-[0_0_8px_#3b82f6]"></div>
                                    <span className="text-[9px] font-bold text-blue-600 tracking-wider uppercase">LIVE</span>
                                </div>
                                <Phone size={16} className="text-blue-500 mb-6 inline-block" />
                                <div>
                                    <h3 className="text-gray-500 text-[10px] uppercase font-bold tracking-wider mb-1">Live Calls</h3>
                                    <p className="text-2xl font-bold text-gray-900">0</p>
                                </div>
                            </div>

                            {/* Card 4 */}
                            <div className="bg-white border border-gray-200 rounded-xl p-5 hover:border-gray-300 shadow-sm transition-colors relative group">
                                <Link2 size={16} className="text-gray-400 mb-6 inline-block" />
                                <div>
                                    <h3 className="text-gray-500 text-[10px] uppercase font-bold tracking-wider mb-1">Credits</h3>
                                    <p className="text-2xl font-bold text-gray-900">0</p>
                                </div>
                            </div>

                            {/* Card 5 */}
                            <div className="bg-white border border-gray-200 rounded-xl p-5 hover:border-gray-300 shadow-sm transition-colors relative group">
                                <Target size={16} className="text-gray-400 mb-6 inline-block" />
                                <div>
                                    <h3 className="text-gray-500 text-[10px] uppercase font-bold tracking-wider mb-1">Success Rate</h3>
                                    <p className="text-2xl font-bold text-gray-900">0.00%</p>
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
                                    <p className="text-2xl font-bold text-gray-900">0%</p>
                                </div>
                            </div>
                        </div>

                        {/* Bottom Left: Usage Trends Placeholder */}
                        <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-6 relative flex-1 min-h-[220px]">
                            <div className="flex justify-between items-start mb-8">
                                <div>
                                    <h2 className="text-base font-bold text-gray-900 mb-0.5">Usage Trends</h2>
                                    <p className="text-xs text-gray-500">Last 30 days</p>
                                </div>
                                <div className="flex bg-gray-50 p-1 rounded-lg border border-gray-200">
                                    <button className="px-3 py-1 text-xs font-medium text-gray-500 hover:text-gray-900 rounded-md">Day</button>
                                    <button className="px-3 py-1 text-xs font-medium text-gray-500 hover:text-gray-900 rounded-md">Week</button>
                                    <button className="px-3 py-1 text-xs font-medium bg-white text-gray-900 shadow-sm rounded-md border border-gray-200">Month</button>
                                </div>
                            </div>

                            {/* Abstract Mock Line Chart overlay */}
                            <div className="absolute bottom-6 left-6 right-6 h-32 flex items-end">
                                <div className="w-full h-full border-l border-b border-gray-200 relative">
                                    {/* Fake Y Axis */}
                                    <div className="absolute -left-4 bottom-0 text-[9px] text-gray-400">0</div>
                                    <div className="absolute -left-4 top-[50%] -translate-y-1/2 text-[9px] text-gray-400">0</div>
                                    <div className="absolute -left-4 top-0 text-[9px] text-gray-400">0</div>
                                    {/* SVG Line mapping */}
                                    <svg className="w-full h-full opacity-30" preserveAspectRatio="none" viewBox="0 0 100 100">
                                        <path d="M 0,90 L 100,100" fill="none" stroke="#3b82f6" strokeWidth="1.5" />
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
                                        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#3b82f6" strokeWidth="3" strokeDasharray="0, 100" />
                                    </svg>
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center text-gray-900 font-bold text-[10px]">
                                        0%<br /><span className="text-[7px] text-gray-500 font-medium leading-none">SUCCESS</span>
                                    </div>
                                </div>

                                {/* Outcomes Grid */}
                                <div className="grid grid-cols-2 gap-3 w-full">
                                    <div className="bg-gray-50 border border-gray-200 p-3 rounded-lg flex flex-col items-start min-w-[70px]">
                                        <span className="text-gray-500 text-[9px] font-bold tracking-widest uppercase mb-1">TOTAL</span>
                                        <span className="text-gray-900 font-bold text-sm">0</span>
                                    </div>
                                    <div className="bg-gray-50 border border-green-200 p-3 rounded-lg flex flex-col items-start min-w-[70px]">
                                        <span className="text-green-600 text-[9px] font-bold tracking-widest uppercase mb-1">SUCCESS</span>
                                        <span className="text-green-600 font-bold text-sm">0</span>
                                    </div>
                                    <div className="bg-gray-50 border border-red-200 p-3 rounded-lg flex flex-col items-start min-w-[70px]">
                                        <span className="text-red-500 text-[9px] font-bold tracking-widest uppercase mb-1">FAILED</span>
                                        <span className="text-red-500 font-bold text-sm">0</span>
                                    </div>
                                    <div className="bg-gray-50 border border-gray-200 p-3 rounded-lg flex flex-col items-start min-w-[70px]">
                                        <span className="text-gray-500 text-[9px] font-bold tracking-widest uppercase mb-1">OUTBOUND</span>
                                        <span className="text-gray-900 font-bold text-sm">0</span>
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
                                <p className="text-xs text-gray-500">0 live</p>
                            </div>
                            <span className="text-xs font-medium text-gray-500 hover:text-gray-900 cursor-pointer">View all</span>
                        </div>

                        <div className="flex-1 flex flex-col gap-3">
                            <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 flex items-center justify-between opacity-60">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-500">
                                        NULL
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-gray-900">No active agents</p>
                                        <p className="text-xs text-gray-500">0 calls</p>
                                    </div>
                                </div>
                                <div className="w-1.5 h-1.5 rounded-full bg-gray-300"></div>
                            </div>

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
                                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">0 today</span>
                            </div>
                        </div>

                        {/* Chart Legend */}
                        <div className="flex items-center gap-6 mb-8 mt-2">
                            <span className="text-[10px] text-gray-500 font-medium">Peak hour <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-700 ml-1">--:--</span> <span className="ml-1 text-gray-900 font-bold">0 calls</span></span>
                            <div className="flex items-center gap-4 ml-auto">
                                <div className="flex items-center gap-1.5"><div className="w-3 h-0.5 bg-green-500"></div><span className="text-xs text-gray-500">Outbound</span></div>
                                <div className="flex items-center gap-1.5"><div className="w-3 h-0.5 bg-blue-500"></div><span className="text-xs text-gray-500">Inbound</span></div>
                                <div className="flex items-center gap-1.5"><div className="w-3 h-0.5 bg-purple-500"></div><span className="text-xs text-gray-500">Web</span></div>
                            </div>
                        </div>

                        {/* Abstract Chart mapping */}
                        <div className="flex-1 relative border-l border-b border-gray-200">
                            {/* Y-axis placeholders */}
                            <div className="absolute -left-4 bottom-0 text-[9px] text-gray-400">0</div>
                            <div className="absolute -left-4 top-[50%] -translate-y-1/2 text-[9px] text-gray-400">0</div>
                            <div className="absolute -left-4 top-0 text-[9px] text-gray-400">0</div>

                            {/* X-axis placeholders */}
                            <div className="absolute -bottom-5 left-0 text-[9px] text-gray-400">00:00</div>
                            <div className="absolute -bottom-5 left-1/4 -translate-x-1/2 text-[9px] text-gray-400">06:00</div>
                            <div className="absolute -bottom-5 left-2/4 -translate-x-1/2 text-[9px] text-gray-400">12:00</div>
                            <div className="absolute -bottom-5 left-3/4 -translate-x-1/2 text-[9px] text-gray-400">18:00</div>
                            <div className="absolute -bottom-5 right-0 text-[9px] text-gray-400">23:59</div>

                            {/* Flat straight baseline line showing ZERO data */}
                            <div className="absolute bottom-0 left-0 w-full h-[1.5px] bg-blue-500 opacity-50 shadow-[0_0_8px_#3b82f6]"></div>
                            <div className="absolute bottom-0 left-0 w-full h-[1px] bg-purple-500 opacity-50 shadow-[0_0_8px_#a855f7]"></div>
                            <div className="absolute bottom-0 left-0 w-full h-[1px] bg-green-500 opacity-50 shadow-[0_0_8px_#22c55e]"></div>
                        </div>

                        {/* Chart Bottom Labels */}
                        <div className="mt-8 flex justify-between items-center px-2">
                            <div className="flex items-center gap-4 text-gray-500 text-xs">
                                <span className="flex items-center gap-1.5"><Phone size={12} /> Outbound <span className="font-bold text-gray-900 border border-gray-200 px-1 rounded bg-gray-50 ml-1">0</span></span>
                                <span className="flex items-center gap-1.5"><Phone size={12} className="rotate-180" /> Inbound <span className="font-bold text-gray-900 border border-gray-200 px-1 rounded bg-gray-50 ml-1">0</span></span>
                                <span className="flex items-center gap-1.5"><GlobeCdn className="w-3 h-3 hidden" /> Web <span className="font-bold text-gray-900 border border-gray-200 px-1 rounded bg-gray-50 ml-1">0</span></span>
                            </div>
                            <span className="flex items-center gap-1.5 text-xs text-gray-500"><div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div> Done <span className="font-bold text-gray-900 border border-gray-200 px-1 rounded bg-gray-50 ml-1">0</span></span>
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
