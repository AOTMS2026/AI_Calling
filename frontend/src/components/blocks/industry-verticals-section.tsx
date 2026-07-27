import { useState } from 'react';
import { Briefcase, HeartHandshake, ShieldCheck, ArrowRight, Zap, Target, BarChart2 } from 'lucide-react';

export function IndustryVerticalsSection() {
    const [activeTab, setActiveTab] = useState<'sales' | 'support' | 'collections'>('sales');

    const tabs = [
        { id: 'sales', label: 'Outbound Sales', icon: Briefcase },
        { id: 'support', label: 'Inbound Support', icon: HeartHandshake },
        { id: 'collections', label: 'Debt Collection', icon: ShieldCheck },
    ] as const;

    const content = {
        sales: {
            title: "Qualify leads and close deals unconditionally.",
            desc: "Unleash thousands of concurrent outbound SDRs that aggressively qualify leads, navigate objections, and book meetings directly onto your account executives' calendars.",
            metric1: "+340%", metric1Label: "Meeting Booking Rate",
            metric2: "$0.02", metric2Label: "Cost Per Qualified Lead",
            highlight: "Agent strictly adheres to BANT qualification frameworks.",
            color: "blue"
        },
        support: {
            title: "Zero hold times. Infinite patience.",
            desc: "Resolve Tier-1 and Tier-2 tickets instantly over the phone. The agent fetches underlying customer data via webhook, processes refunds, and updates CRM entries dynamically.",
            metric1: "< 2s", metric1Label: "Average Answer Time",
            metric2: "92%", metric2Label: "First Call Resolution",
            highlight: "Integrates natively with Zendesk and Salesforce.",
            color: "green"
        },
        collections: {
            title: "Compliant, empathetic debt recovery.",
            desc: "Recover outstanding balances automatically. The agent negotiates payment plans, verifies identity securely, and triggers Stripe payment links via SMS mid-conversation.",
            metric1: "+45%", metric1Label: "Recovery Rate Increase",
            metric2: "100%", metric2Label: "FDCPA Compliance",
            highlight: "Employs psychologically optimized negotiation pacing.",
            color: "purple"
        }
    };

    const activeContent = content[activeTab];

    return (
        <section className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 py-32 lg:py-48 relative z-10 border-t border-gray-100 bg-[#fafbfc]">
            <div className="text-center max-w-4xl mx-auto mb-16 lg:mb-24">
                <span className="text-gray-900 font-bold tracking-widest uppercase text-xs sm:text-sm">Built for every workflow</span>
                <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-gray-900 mt-4 mb-6 tracking-tight">
                    Scale operations across <br className="hidden sm:block" /> any <span className="text-blue-600">vertical.</span>
                </h2>
            </div>

            {/* Tab Navigation */}
            <div className="flex flex-wrap justify-center gap-2 sm:gap-4 mb-12 sm:mb-16">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-5 sm:px-8 py-3 sm:py-4 rounded-full text-sm sm:text-base font-bold transition-all shadow-sm ${activeTab === tab.id
                                ? 'bg-gray-900 text-white shadow-md transform scale-105'
                                : 'bg-white text-gray-500 hover:text-gray-900 hover:bg-gray-50 border border-gray-200'
                            }`}
                    >
                        <tab.icon size={18} className={activeTab === tab.id ? "text-blue-400" : ""} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Dynamic Content Morph Box */}
            <div className="relative bg-white rounded-[2rem] sm:rounded-[3rem] p-8 sm:p-12 lg:p-16 border border-gray-200/60 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] overflow-hidden transition-all duration-500 min-h-[400px]">
                {/* Background ambient glow based on color */}
                <div className={`absolute top-0 right-0 w-[60vw] max-w-[600px] h-full opacity-20 blur-[100px] transition-colors duration-700 pointer-events-none rounded-full translate-x-1/3 -translate-y-1/4 ${activeContent.color === 'blue' ? 'bg-blue-500' :
                        activeContent.color === 'green' ? 'bg-green-500' : 'bg-purple-500'
                    }`}></div>

                <div className="flex flex-col xl:flex-row gap-12 lg:gap-20 relative z-10">
                    <div className="flex-1 w-full flex flex-col justify-center">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-sm border ${activeContent.color === 'blue' ? 'bg-blue-50 border-blue-100 text-blue-600' :
                                activeContent.color === 'green' ? 'bg-green-50 border-green-100 text-green-600' : 'bg-purple-50 border-purple-100 text-purple-600'
                            }`}>
                            {activeTab === 'sales' && <Target size={28} />}
                            {activeTab === 'support' && <HeartHandshake size={28} />}
                            {activeTab === 'collections' && <ShieldCheck size={28} />}
                        </div>

                        <h3 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 tracking-tight leading-[1.1] mb-6">
                            {activeContent.title}
                        </h3>
                        <p className="text-gray-500 text-lg font-medium leading-relaxed mb-8 max-w-xl">
                            {activeContent.desc}
                        </p>

                        <div className="grid grid-cols-2 gap-6 pt-6 border-t border-gray-100">
                            <div>
                                <div className={`text-3xl sm:text-4xl font-black mb-1 tracking-tighter ${activeContent.color === 'blue' ? 'text-blue-600' :
                                        activeContent.color === 'green' ? 'text-green-600' : 'text-purple-600'
                                    }`}>
                                    {activeContent.metric1}
                                </div>
                                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">{activeContent.metric1Label}</div>
                            </div>
                            <div>
                                <div className={`text-3xl sm:text-4xl font-black mb-1 tracking-tighter ${activeContent.color === 'blue' ? 'text-blue-600' :
                                        activeContent.color === 'green' ? 'text-green-600' : 'text-purple-600'
                                    }`}>
                                    {activeContent.metric2}
                                </div>
                                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">{activeContent.metric2Label}</div>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 w-full bg-gray-900 rounded-[2rem] p-8 flex flex-col justify-center border border-gray-800 shadow-2xl relative overflow-hidden group">
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.05]"></div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                <span className="ml-2 text-xs font-mono text-gray-500 bg-gray-800 px-3 py-1 rounded-full border border-gray-700">agent_sys_prompt.md</span>
                            </div>
                            <div className="font-mono text-sm sm:text-base leading-relaxed text-gray-300">
                                <span className="text-gray-500 italic"># Engine Directive Initialization</span><br /><br />
                                You are a highly persuasive, hyper-realistic voice agent. <br /><br />
                                <span className={`font-semibold bg-opacity-20 px-1 rounded ${activeContent.color === 'blue' ? 'bg-blue-500 text-blue-300' :
                                        activeContent.color === 'green' ? 'bg-green-500 text-green-300' : 'bg-purple-500 text-purple-300'
                                    }`}>
                                    [SYSTEM OVERRIDE]: {activeContent.highlight}
                                </span><br /><br />
                                Acknowledge user latency delays instantly. Do not use robotic vernacular. Speak naturally. Proceed.
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
