import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';

export function RevenueCalculator() {
    const [leads, setLeads] = useState<number>(850);
    const [dealValue, setDealValue] = useState<number>(15000);
    const [conversion, setConversion] = useState<number>(5);
    const [delay, setDelay] = useState<number>(3); // 0.5 to 12 hrs

    // Calculations
    const missedPercentage = Math.min((delay / 4), 0.9);
    const missedLeads = Math.round(leads * missedPercentage);
    const revenueLost = missedLeads * (conversion / 100) * dealValue;
    const vortexCost = leads * 22.5;
    const netGain = Math.max(0, revenueLost - vortexCost);

    // Formatters
    const formatINR = (value: number) => {
        if (value >= 100000) {
            return `₹${(value / 100000).toFixed(1)}L`;
        }
        if (value >= 1000) {
            return `₹${(value / 1000).toFixed(1)}K`;
        }
        return `₹${value.toLocaleString('en-IN')}`;
    };

    return (
        <section className="w-full bg-white py-24 lg:py-32 relative z-10 border-t border-gray-100">
            <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-12 text-center">
                <div className="inline-block bg-blue-50 border border-blue-200 text-blue-700 font-bold text-xs uppercase tracking-widest px-4 py-1.5 rounded-full mb-6">
                    <span className="w-2 h-2 rounded-full bg-blue-500 inline-block mr-2 animate-pulse"></span>
                    ROI Calculator
                </div>
                <h2 className="text-4xl sm:text-5xl lg:text-5xl font-black text-gray-900 mb-6 tracking-tight">How Much Revenue Are You Leaking?</h2>
                <p className="text-gray-500 text-lg font-medium max-w-2xl mx-auto mb-16">
                    Delayed follow-ups cost Indian businesses crores every month. Model your exact metrics to see the impact of immediate AI response.
                </p>

                {/* Main Calculator Card */}
                <div className="bg-white border-2 border-slate-900 rounded-[2rem] sm:rounded-[3rem] shadow-[8px_8px_0px_#0f172a] text-left p-6 sm:p-10 lg:p-12 flex flex-col xl:flex-row gap-12 lg:gap-16">

                    {/* Left Column - Inputs */}
                    <div className="flex-1 space-y-10">
                        <h3 className="text-xl font-black text-gray-900 mb-8 border-b border-gray-100 pb-4">Your Business Numbers</h3>

                        {/* Slider 1 */}
                        <div className="group">
                            <div className="flex justify-between items-center mb-3">
                                <label className="font-bold text-gray-700 text-sm">Monthly Incoming Leads</label>
                                <div className="bg-blue-50 border border-blue-200 text-blue-700 font-black text-xs px-3 py-1 rounded-full">{leads} leads</div>
                            </div>
                            <input type="range" min="10" max="5000" step="10" value={leads} onChange={(e) => setLeads(Number(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600 outline-none" />
                            <div className="flex justify-between mt-2 text-[10px] font-bold text-gray-400"><span>10</span><span>5000</span></div>
                        </div>

                        {/* Slider 2 */}
                        <div className="group">
                            <div className="flex justify-between items-center mb-3">
                                <label className="font-bold text-gray-700 text-sm">Average Deal Value</label>
                                <div className="bg-blue-50 border border-blue-200 text-blue-700 font-black text-xs px-3 py-1 rounded-full">₹{dealValue.toLocaleString('en-IN')}</div>
                            </div>
                            <input type="range" min="1000" max="500000" step="1000" value={dealValue} onChange={(e) => setDealValue(Number(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600 outline-none" />
                            <div className="flex justify-between mt-2 text-[10px] font-bold text-gray-400"><span>₹1,000</span><span>₹5,00,000</span></div>
                        </div>

                        {/* Slider 3 */}
                        <div className="group">
                            <div className="flex justify-between items-center mb-3">
                                <label className="font-bold text-gray-700 text-sm">Lead Conversion Rate</label>
                                <div className="bg-blue-50 border border-blue-200 text-blue-700 font-black text-xs px-3 py-1 rounded-full">{conversion}%</div>
                            </div>
                            <input type="range" min="1" max="30" step="1" value={conversion} onChange={(e) => setConversion(Number(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600 outline-none" />
                            <div className="flex justify-between mt-2 text-[10px] font-bold text-gray-400"><span>1%</span><span>30%</span></div>
                        </div>

                        {/* Slider 4 */}
                        <div className="group">
                            <div className="flex justify-between items-center mb-3">
                                <label className="font-bold text-gray-700 text-sm">Average Response Delay</label>
                                <div className="bg-blue-50 border border-blue-200 text-blue-700 font-black text-xs px-3 py-1 rounded-full">{delay} hrs</div>
                            </div>
                            <input type="range" min="0.5" max="12" step="0.5" value={delay} onChange={(e) => setDelay(Number(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600 outline-none" />
                            <div className="flex justify-between mt-2 text-[10px] font-bold text-gray-400"><span>0.5 hrs</span><span>12 hrs</span></div>
                        </div>
                    </div>

                    {/* Right Column - Results */}
                    <div className="flex-1 space-y-4 xl:mt-0 xl:ml-8 flex flex-col justify-center">
                        <h3 className="text-xl font-black text-gray-900 mb-4 border-b border-gray-100 pb-4 hidden xl:block">Your Monthly Impact</h3>

                        <div className="bg-red-50 border border-red-100 rounded-2xl p-6">
                            <div className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-1">Estimated Missed Follow-ups</div>
                            <div className="text-3xl font-black text-red-600 tracking-tight leading-none mb-2">{missedLeads} <span className="text-xl">leads</span></div>
                            <div className="text-xs text-red-400/80 font-medium tracking-wide">slipping through because of delayed response</div>
                        </div>

                        <div className="bg-red-50 border border-red-100 rounded-2xl p-6">
                            <div className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-1">Monthly Revenue Delayed / Lost</div>
                            <div className="text-4xl font-black text-red-600 tracking-tight leading-none mb-2">{formatINR(revenueLost)}</div>
                            <div className="text-xs text-red-400/80 font-medium tracking-wide">estimated operating revenue leaking every month</div>
                        </div>

                        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
                            <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Vortex Estimated Monthly Cost</div>
                            <div className="text-3xl font-black text-gray-900 tracking-tight leading-none mb-2">{formatINR(vortexCost)}</div>
                            <div className="text-xs text-gray-500 font-medium tracking-wide">to handle all {leads} leads immediately within 5 seconds</div>
                        </div>

                        <div className="bg-green-500 rounded-2xl p-6 shadow-[0_10px_30px_-15px_rgba(34,197,94,0.5)] transform scale-[1.02] mt-4 border border-green-600 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3"></div>
                            <div className="text-[10px] font-black text-green-100 uppercase tracking-widest mb-2 relative z-10">Potential Net Gain</div>
                            <div className="text-5xl font-black text-white tracking-tighter leading-none mb-2 relative z-10">{formatINR(netGain)}</div>
                            <div className="text-xs text-green-100 font-medium tracking-wide relative z-10">per month with Vortex.ai deployed</div>
                        </div>

                        <p className="text-[10px] text-gray-400 font-medium leading-relaxed mt-6">
                            *Estimates based on industry conversion benchmarks. Actual results vary. Usage cost calculated at ₹6.90/min outbound x avg 3 min/call.
                        </p>

                        <button className="w-full mt-4 bg-gray-900 hover:bg-black text-white font-bold py-4 rounded-xl shadow-lg shadow-gray-900/20 transition-all flex items-center justify-center gap-2 group">
                            Operationalize Revenue <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>

                </div>
            </div>
        </section>
    );
}
