import { Link } from 'react-router-dom';
import { ArrowRight, Bot, Sparkles, Phone, BarChart, Mic, Volume2, MessageSquare, MessageCircle, Code2 } from 'lucide-react';
import { Pricing } from '../components/blocks/pricing';
import { RevenueCalculator } from '../components/blocks/revenue-calculator';
import { GlobeSection } from '../components/blocks/globe-section';
import { CallSimulatorSection } from '../components/blocks/call-simulator-section';
import { IndustryVerticalsSection } from '../components/blocks/industry-verticals-section';
const demoPlans = [
    {
        name: "DEVELOPER",
        price: "0",
        yearlyPrice: "0",
        period: "month",
        features: [
            "100 Free Minutes",
            "1 Concurrent Call",
            "Standard Voices",
            "Community Support",
        ],
        description: "Perfect for testing workflows.",
        buttonText: "Start Free",
        href: "/login",
        isPopular: false,
    },
    {
        name: "GROWTH",
        price: "49",
        yearlyPrice: "39",
        period: "month",
        features: [
            "Unlimited Minutes ($0.08/min)",
            "100 Concurrent Calls",
            "Premium Ultra-Realistic Voices",
            "Full API & Webhook Access",
        ],
        description: "For production workloads.",
        buttonText: "Upgrade To Growth",
        href: "/login",
        isPopular: true,
    },
    {
        name: "ENTERPRISE",
        price: "299",
        yearlyPrice: "239",
        period: "month",
        features: [
            "Bring Your Own Telephony",
            "Unlimited Concurrency",
            "Dedicated Virtual Private Cloud",
            "SLA & 24/7 Slack Support",
        ],
        description: "Custom infrastructure scale.",
        buttonText: "Contact Sales",
        href: "/login",
        isPopular: false,
    },
];


export function Landing() {
    return (
        <div className="min-h-screen bg-[#fafbfc] flex flex-col font-sans relative overflow-x-hidden select-none">

            {/* Ultra-Premium Ambient Mesh Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400/20 blur-[120px] rounded-full"></div>
                <div className="absolute top-[20%] right-[-5%] w-[30%] h-[40%] bg-indigo-400/20 blur-[120px] rounded-full"></div>
                <div className="absolute bottom-[-10%] left-[20%] w-[50%] h-[50%] bg-teal-400/10 blur-[130px] rounded-full"></div>
            </div>

            {/* Grid Pattern overlay */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.015]" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>

            {/* Navbar */}
            <nav className="relative z-50 px-6 lg:px-12 py-6 flex justify-between items-center w-full max-w-[1400px] mx-auto">
                <div className="flex items-center gap-3">
                    <img
                        src="/atm-logo.jpeg"
                        alt="AOTMS Logo"
                        className="w-10 h-10 object-cover rounded-xl shadow-md ring-1 ring-gray-900/10"
                    />
                    <div className="flex flex-col justify-center">
                        <span className="text-xl font-black tracking-tighter text-gray-900 leading-none">AOTMS.</span>
                        <span className="text-[9px] font-bold text-gray-400 tracking-widest uppercase mt-1">by sneha.ai</span>
                    </div>
                </div>

                <div className="hidden lg:flex items-center gap-10 bg-white/60 backdrop-blur-xl border border-white px-8 py-3 rounded-full shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
                    <a href="#features" className="text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors">Platform</a>
                    <a href="#models" className="text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors">AI Models</a>
                    <a href="#pricing" className="text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors">Pricing</a>
                    <a href="#enterprise" className="text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors">Enterprise</a>
                </div>

                <div className="flex items-center gap-4">
                    <Link to="/login" className="hidden sm:block text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors">Login</Link>
                    <Link to="/register">
                        <button className="px-5 py-2.5 rounded-xl bg-gray-900 hover:bg-black text-white text-sm font-bold shadow-[0_8px_16px_rgba(0,0,0,0.12)] hover:shadow-[0_12px_24px_rgba(0,0,0,0.18)] transition-all transform hover:-translate-y-0.5 flex items-center gap-2">
                            Build Free <ArrowRight size={16} />
                        </button>
                    </Link>
                </div>
            </nav>

            {/* Hero Section Container */}
            <main className="flex-1 w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 pt-16 lg:pt-24 pb-20 relative z-10 flex flex-col lg:flex-row items-center gap-16 lg:gap-10">

                {/* Left Side: Copywriting */}
                <div className="flex-1 w-full text-center lg:text-left z-20">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-gray-200/60 shadow-sm mb-8 hover:shadow-md transition-shadow cursor-default group">
                        <Sparkles size={14} className="text-blue-500 group-hover:rotate-12 transition-transform" />
                        <span className="text-xs font-bold text-gray-700 tracking-wide">Next-Gen Audio Intelligence</span>
                    </div>

                    <h1 className="text-[2.25rem] leading-none sm:text-5xl lg:text-[5rem] font-black tracking-tighter text-gray-900 lg:leading-[1.05] mb-8 max-w-3xl mx-auto lg:mx-0 break-words">
                        Voice AI that sounds <br className="hidden lg:block" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
                            indistinguishable.
                        </span>
                    </h1>

                    <p className="text-base sm:text-xl text-gray-500 mb-10 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-medium">
                        Deploy hyper-realistic contextual AI agents capable of handling complex reasoning, sales negotiations, and ultra-fast customer support natively over the phone network.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
                        <button className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-b from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white text-base font-bold shadow-[0_8px_20px_rgba(37,99,235,0.25)] hover:shadow-[0_16px_32px_rgba(37,99,235,0.35)] transition-all transform hover:-translate-y-1 border border-blue-500/50">
                            Deploy your Agent
                        </button>
                        <button className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white border border-gray-200 hover:border-gray-300 text-gray-700 text-base font-bold shadow-sm hover:shadow-md hover:bg-gray-50 transition-all flex items-center justify-center gap-2">
                            <Phone size={18} /> Schedule Demo
                        </button>
                    </div>

                    <div className="mt-10 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 sm:gap-6 text-sm font-semibold text-gray-400">
                        <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-green-500"></div> No credit card required</span>
                        <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-green-500"></div> Sub-200ms latency</span>
                    </div>
                </div>

                {/* Right Side: Revolutionary Floating Glass UI Dashboard */}
                <div className="flex-1 w-full relative min-h-[450px] sm:min-h-[550px] lg:h-[600px] flex items-center justify-center lg:justify-end mt-4 sm:mt-8 lg:mt-0">

                    {/* Background glow specific to the cards */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] h-[90%] sm:w-[80%] sm:h-[80%] bg-gradient-to-tr from-blue-400 to-purple-400 rounded-full blur-[80px] sm:blur-[100px] opacity-30 sm:opacity-20 pointer-events-none"></div>

                    {/* Main Interaction Card (Tilted Glassmorphism) */}
                    <div className="relative z-20 w-full max-w-[340px] sm:max-w-none sm:w-[450px] bg-white/80 backdrop-blur-3xl rounded-[2rem] sm:rounded-[2.5rem] p-5 sm:p-8 shadow-[0_40px_80px_-20px_rgba(0,0,80,0.15)] border border-white transform lg:hover:-translate-y-2 lg:hover:rotate-1 transition-transform duration-700 ease-out mb-16 lg:mb-0">

                        {/* Header of Active Call */}
                        <div className="flex justify-between items-center mb-8 border-b border-gray-100 pb-5">
                            <div className="flex items-center gap-3 sm:gap-4">
                                <div className="relative shrink-0">
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-blue-100 to-indigo-100 flex items-center justify-center border border-blue-200/50 shadow-inner text-blue-600">
                                        <Mic size={20} className="sm:w-6 sm:h-6" />
                                    </div>
                                    <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white"></div>
                                </div>
                                <div className="min-w-0 pr-2">
                                    <h3 className="text-gray-900 font-extrabold text-sm sm:text-lg truncate">Sales Specialist</h3>
                                    <p className="text-[10px] sm:text-xs text-gray-400 font-semibold uppercase tracking-wider truncate">Live Bound Call</p>
                                </div>
                            </div>
                            <div className="px-2.5 py-1 bg-red-50 text-red-600 text-[10px] sm:text-xs font-bold rounded-full border border-red-100 animate-pulse shrink-0">
                                REC 02:44
                            </div>
                        </div>

                        {/* Interactive Waveform Audio Visualizer Loop */}
                        <div className="w-full flex items-center justify-center gap-1 sm:gap-1.5 h-16 sm:h-20 mb-8 overflow-hidden px-1">
                            {[45, 75, 35, 90, 60, 25, 80, 100, 30, 65, 85, 40, 70, 95, 50, 80, 45, 75, 30].map((val, i) => (
                                <div
                                    key={i}
                                    className="w-[3px] sm:w-[5px] rounded-full bg-gradient-to-t from-blue-600 to-indigo-500 shadow-sm"
                                    style={{
                                        height: `${val}%`,
                                        animation: `pulse-wave 1.5s ease-in-out infinite alternate`,
                                        animationDelay: `${i * 0.1}s`
                                    }}
                                ></div>
                            ))}
                        </div>

                        {/* Live Transcription Bubble Logic */}
                        <div className="bg-gray-50 border border-gray-200/60 rounded-2xl p-4 sm:p-5 relative shadow-inner">
                            <div className="absolute -top-3 left-4 sm:left-6 px-2 sm:px-3 py-0.5 bg-gray-900 text-white text-[9px] sm:text-[10px] uppercase font-bold tracking-widest rounded-full shadow-sm">AI Output</div>
                            <p className="text-gray-700 text-xs sm:text-sm font-medium leading-relaxed mt-1 sm:mt-2 relative">
                                <span className="opacity-100">"Absolutely! Based on your infrastructure, I can upgrade you to the Enterprise tier with zero downtime. Would you like me to process that transition?"</span>
                                {/* Blinking cursor imitating live typing constraint */}
                                <span className="w-1 sm:w-1.5 h-3 sm:h-4 bg-blue-500 inline-block ml-1 align-middle animate-pulse"></span>
                            </p>
                        </div>



                        {/* Floating Action Card nested INSIDE the main card absolute mapping */}
                        {/* Replaced 'sm:' tracking rules with 'lg:' */}
                        <div className="absolute -top-4 -right-2 lg:top-10 lg:-right-8 z-30 w-12 h-12 sm:w-14 sm:h-14 bg-white/95 backdrop-blur-xl border border-gray-200 lg:border-white/80 rounded-full flex items-center justify-center shadow-[0_10px_30px_-5px_rgba(0,0,0,0.15)] transform hover:rotate-12 transition-transform duration-500 cursor-pointer group">
                            <Volume2 size={20} className="text-gray-400 sm:w-6 sm:h-6 group-hover:text-blue-500 transition-colors" />
                        </div>
                    </div>
                </div>
            </main>

            {/* Social Proof Brands Marquee */}
            <section className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 py-16 border-t border-gray-200/50 relative z-10 flex flex-col items-center">
                <p className="text-center text-xs font-bold text-gray-400 uppercase tracking-widest mb-10">Trusted by modern sales & support teams globally</p>

                {/* Infinite Marquee Container */}
                <div className="relative w-full max-w-5xl mx-auto flex overflow-hidden group">
                    {/* Ghost Gradients for fade effect on edges */}
                    <div className="absolute top-0 left-0 w-16 sm:w-32 h-full bg-gradient-to-r from-[#fafbfc] to-transparent z-10 pointer-events-none"></div>
                    <div className="absolute top-0 right-0 w-16 sm:w-32 h-full bg-gradient-to-l from-[#fafbfc] to-transparent z-10 pointer-events-none"></div>

                    <div className="flex animate-marquee items-center group-hover:[animation-play-state:paused] w-max">
                        {/* Repeat logos twice for infinite seamless scroll trick (Must offset exactly -50% in keyframes) */}
                        {[...Array(2)].map((_, i) => (
                            <div key={i} className="flex gap-16 sm:gap-24 px-8 sm:px-12 items-center">
                                {/* SVG Logos (Minimalist Monotone) */}
                                <div className="text-gray-400/80 hover:text-gray-900 transition-colors cursor-pointer flex items-center gap-2">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5 sm:w-6 sm:h-6"><circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" /></svg>
                                    <span className="text-base sm:text-lg font-black tracking-tight">AcmeCorp</span>
                                </div>
                                <div className="text-gray-400/80 hover:text-gray-900 transition-colors cursor-pointer flex items-center gap-2">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5 sm:w-6 sm:h-6"><path d="M12 2L2 7l10 5 10-5-10-5Z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" /></svg>
                                    <span className="text-base sm:text-lg font-black tracking-tight">StackTech</span>
                                </div>
                                <div className="text-gray-400/80 hover:text-gray-900 transition-colors cursor-pointer flex items-center gap-2">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5 sm:w-6 sm:h-6"><polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" /></svg>
                                    <span className="text-base sm:text-lg font-black tracking-tight">Vercelio</span>
                                </div>
                                <div className="text-gray-400/80 hover:text-gray-900 transition-colors cursor-pointer flex items-center gap-2">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5 sm:w-6 sm:h-6"><path d="M12 2v20" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
                                    <span className="text-base sm:text-lg font-black tracking-tight">FinServe</span>
                                </div>
                                <div className="text-gray-400/80 hover:text-gray-900 transition-colors cursor-pointer flex items-center gap-2">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5 sm:w-6 sm:h-6"><ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" /><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" /></svg>
                                    <span className="text-base sm:text-lg font-black tracking-tight">DataCloud</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* High-Fidelity Bento Grid (Features) */}
            <section className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 py-32 lg:py-48 relative z-10">
                <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
                    <span className="text-blue-600 font-bold tracking-widest uppercase text-xs sm:text-sm">Vortex Core Architecture</span>
                    <h2 className="text-3xl sm:text-5xl font-black text-gray-900 mt-3 mb-6 tracking-tight">The engine behind the illusion.</h2>
                    <p className="text-gray-500 text-base sm:text-xl font-medium">We rebuilt the entire conversational stack from bare metal. No latency buffering. No API daisy-chaining. Pure unadulterated speed.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 auto-rows-min">

                    {/* Primary Bento Card: Latency */}
                    <div className="lg:col-span-2 relative bg-white rounded-[2rem] sm:rounded-[2.5rem] p-8 sm:p-12 overflow-hidden border border-gray-200/60 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] group hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] transition-shadow duration-500">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-100 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 group-hover:bg-blue-200 transition-colors"></div>

                        <div className="relative z-10 flex flex-col h-full justify-between">
                            <div className="mb-12">
                                <h3 className="text-2xl sm:text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">Human-level latency</h3>
                                <p className="text-gray-500 font-medium text-base sm:text-lg max-w-md">Our proprietary Edge-TTS model combined with raw WebRTC streaming achieves consistent glass-to-glass latency below 200 milliseconds.</p>
                            </div>

                            {/* Graphic */}
                            <div className="w-full bg-gray-50 rounded-2xl p-6 border border-gray-100 flex items-center justify-between">
                                <div className="flex flex-col items-center">
                                    <span className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">User</span>
                                    <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-gray-200 flex items-center justify-center">
                                        <Mic size={20} className="text-gray-900" />
                                    </div>
                                </div>
                                <div className="flex-1 flex items-center mx-4 relative">
                                    <div className="h-0.5 w-full bg-gray-200 rounded-full"></div>
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full text-xs font-bold border border-blue-100 whitespace-nowrap">
                                        <span className="animate-pulse inline-block mr-1">⚡</span> &lt; 200ms
                                    </div>
                                    <div className="absolute left-0 w-1/2 h-full bg-gradient-to-r from-transparent via-blue-400 to-transparent opacity-50 blur-sm h-1 rounded-full overflow-hidden animate-[pulse-wave_2s_ease-in-out_infinite]"></div>
                                </div>
                                <div className="flex flex-col items-center">
                                    <span className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">Vortex</span>
                                    <div className="w-12 h-12 bg-gray-900 rounded-xl shadow-md border border-gray-700 flex items-center justify-center">
                                        <Sparkles size={20} className="text-white" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Secondary Bento Card: Multi-lingual */}
                    <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-[2rem] sm:rounded-[2.5rem] p-8 sm:p-10 relative overflow-hidden shadow-lg border border-indigo-500">
                        <div className="absolute bottom-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-[60px] translate-y-1/2 translate-x-1/4"></div>
                        <div className="relative z-10 flex flex-col h-full">
                            <div className="w-12 h-12 bg-white/10 rounded-xl backdrop-blur-md border border-white/20 flex items-center justify-center mb-6">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6 text-white"><path d="m5 8 6 6" /><path d="m4 14 6-6 2-3" /><path d="M2 5h12" /><path d="M7 2h1" /><path d="m22 22-5-10-5 10" /><path d="M14 18h6" /></svg>
                            </div>
                            <h3 className="text-xl sm:text-2xl font-extrabold text-white mb-3 tracking-tight">Hyper-Polyglot</h3>
                            <p className="text-indigo-100/80 font-medium text-sm sm:text-base mb-8">Natively trained on 14+ specific regional languages including deeply native Telugu, Hindi, and distinct cultural inflections.</p>

                            <div className="mt-auto flex flex-wrap gap-2">
                                <span className="px-3 py-1 bg-white/10 backdrop-blur-sm border border-white/20 text-white text-[10px] font-bold rounded-full">Telugu</span>
                                <span className="px-3 py-1 bg-white/10 backdrop-blur-sm border border-white/20 text-white text-[10px] font-bold rounded-full">Hindi</span>
                                <span className="px-3 py-1 bg-white/10 backdrop-blur-sm border border-white/20 text-white text-[10px] font-bold rounded-full">English US</span>
                                <span className="px-3 py-1 bg-white/10 backdrop-blur-sm border border-white/20 text-white text-[10px] font-bold rounded-full">+11 more</span>
                            </div>
                        </div>
                    </div>

                    {/* Secondary Bento Card: Compliance */}
                    <div className="bg-gray-900 rounded-[2rem] sm:rounded-[2.5rem] p-8 sm:p-10 relative overflow-hidden shadow-xl border border-gray-800 h-full min-h-[300px]">
                        <div className="absolute top-0 right-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03]"></div>
                        <div className="relative z-10 flex flex-col h-full justify-between">
                            <div className="mb-6">
                                <h3 className="text-xl sm:text-2xl font-extrabold text-white mb-3 tracking-tight">Enterprise Grade</h3>
                                <p className="text-gray-400 font-medium text-sm sm:text-base">Compliant with severe SIP tracing regulations out of the box.</p>
                            </div>
                            <div className="bg-gray-800/50 backdrop-blur-sm w-full rounded-2xl border border-gray-700/50 p-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4 text-green-400"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                                    </div>
                                    <span className="text-white text-xs font-bold">SOC2 Type II Certified</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Omni-Channel Section */}
            <section className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 py-20 lg:py-32 relative z-10">
                <div className="text-center max-w-3xl mx-auto mb-16 lg:mb-24">
                    <h2 className="text-3xl sm:text-[2.75rem] font-bold text-gray-900 tracking-tight leading-tight">True omni-channel<br />communication.</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pb-12 lg:pb-36">
                    {/* Card 1 */}
                    <div className="bg-[#f8f9fb] rounded-2xl p-6 lg:p-8 flex flex-col min-h-[280px] border border-gray-100 transition-all hover:-translate-y-1 hover:shadow-md lg:mt-0">
                        <div className="flex justify-between items-start mb-12">
                            <h3 className="text-lg lg:text-xl font-medium text-gray-600">Voice Call</h3>
                            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-[0_4px_15px_rgba(0,0,0,0.03)] border border-gray-50">
                                <Phone size={20} className="text-[#0d152a] fill-[#0d152a]" />
                            </div>
                        </div>
                        <div className="mt-auto">
                            <p className="text-gray-500 font-medium text-[15px] leading-relaxed">Deliver natural, human-like phone conversations at scale.</p>
                        </div>
                    </div>

                    {/* Card 2 */}
                    <div className="bg-[#f8f9fb] rounded-2xl p-6 lg:p-8 flex flex-col min-h-[280px] border border-gray-100 transition-all hover:-translate-y-1 hover:shadow-md lg:mt-12">
                        <div className="flex justify-between items-start mb-12">
                            <h3 className="text-lg lg:text-xl font-medium text-gray-600">Chat</h3>
                            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-[0_4px_15px_rgba(0,0,0,0.03)] border border-gray-50">
                                <MessageSquare size={20} className="text-[#0d152a] fill-[#0d152a]" />
                            </div>
                        </div>
                        <div className="mt-auto">
                            <p className="text-gray-500 font-medium text-[15px] leading-relaxed">Deploy AI-powered conversations across web and in-app chat experiences.</p>
                        </div>
                    </div>

                    {/* Card 3 */}
                    <div className="bg-[#f8f9fb] rounded-2xl p-6 lg:p-8 flex flex-col min-h-[280px] border border-gray-100 transition-all hover:-translate-y-1 hover:shadow-md lg:mt-24">
                        <div className="flex justify-between items-start mb-12">
                            <h3 className="text-lg lg:text-xl font-medium text-gray-600">SMS</h3>
                            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-[0_4px_15px_rgba(0,0,0,0.03)] border border-gray-50">
                                <MessageCircle size={20} className="text-[#0d152a] fill-[#0d152a]" />
                            </div>
                        </div>
                        <div className="mt-auto">
                            <p className="text-gray-500 font-medium text-[15px] leading-relaxed">Engage customers through reliable, compliant text messages.</p>
                        </div>
                    </div>

                    {/* Card 4 */}
                    <div className="bg-[#f8f9fb] rounded-2xl p-6 lg:p-8 flex flex-col min-h-[280px] border border-gray-100 transition-all hover:-translate-y-1 hover:shadow-md lg:mt-36">
                        <div className="flex justify-between items-start mb-12">
                            <h3 className="text-lg lg:text-xl font-medium text-gray-600">API</h3>
                            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-[0_4px_15px_rgba(0,0,0,0.03)] border border-gray-50">
                                <Code2 size={20} className="text-[#0d152a] fill-[#0d152a]" />
                            </div>
                        </div>
                        <div className="mt-auto">
                            <p className="text-gray-500 font-medium text-[15px] leading-relaxed">Interface programmatically with Voice and logic via REST.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Indian Language Voice AI Section */}
            <section className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 py-32 lg:py-48 relative z-10 border-t border-gray-100">

                {/* Header */}
                <div className="flex flex-col lg:flex-row justify-between lg:items-end mb-16 lg:mb-24">
                    <div>
                        <span className="text-blue-600 font-bold tracking-[0.2em] uppercase text-xs sm:text-sm">INDIAN LANGUAGE VOICE AI</span>
                        <h2 className="text-4xl sm:text-5xl lg:text-7xl font-black text-gray-900 mt-6 mb-6 tracking-tight leading-[1.1]">Speaks your<br />customer's <span className="text-blue-600">language.</span></h2>
                        <p className="text-gray-500 text-lg lg:text-xl font-medium max-w-2xl leading-relaxed">Hindi, Hinglish, Tamil, Telugu, Kannada, Marathi, Bengali, Gujarati, Punjabi, Malayalam, Indian English plus many more languages and dialects.</p>
                    </div>
                    <div className="flex gap-16 mt-12 lg:mt-0 lg:pb-4">
                        <div>
                            <div className="text-6xl font-black text-blue-600 tracking-tighter italic">30+</div>
                            <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mt-3">Languages</div>
                        </div>
                        <div>
                            <div className="text-6xl font-black text-blue-600 tracking-tighter italic">800M+</div>
                            <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mt-3">People Covered</div>
                        </div>
                    </div>
                </div>

                {/* Grid Layout */}
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 lg:gap-12">

                    {/* Left Language Grid */}
                    <div className="xl:col-span-3 grid grid-cols-2 gap-4 auto-rows-max">
                        <div className="border border-gray-200 rounded-3xl flex flex-col items-center justify-center py-6 lg:py-8 hover:border-gray-300 transition-colors cursor-pointer bg-white hover:shadow-sm group">
                            <span className="text-4xl font-medium text-gray-800 mb-2 group-hover:scale-110 transition-transform">ह</span>
                            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.15em]">Hindi</span>
                        </div>
                        <div className="border border-gray-200 rounded-3xl flex flex-col items-center justify-center py-6 lg:py-8 hover:border-gray-300 transition-colors cursor-pointer bg-white hover:shadow-sm group">
                            <span className="text-4xl font-medium text-gray-800 mb-2 group-hover:scale-110 transition-transform">H</span>
                            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.15em]">Hinglish</span>
                        </div>
                        <div className="border border-gray-200 rounded-3xl flex flex-col items-center justify-center py-6 lg:py-8 hover:border-gray-300 transition-colors cursor-pointer bg-white hover:shadow-sm group">
                            <span className="text-4xl font-medium text-gray-800 mb-2 group-hover:scale-110 transition-transform">த</span>
                            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.15em]">Tamil</span>
                        </div>
                        {/* Selected Telugu Block */}
                        <div className="border border-gray-200 rounded-3xl flex flex-col items-center justify-center py-6 lg:py-8 hover:border-gray-300 transition-colors cursor-pointer bg-white hover:shadow-sm group">
                            <span className="text-4xl font-medium text-gray-800 mb-2 group-hover:scale-110 transition-transform">తె</span>
                            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.15em]">Telugu</span>
                        </div>
                        <div className="border border-gray-200 rounded-3xl flex flex-col items-center justify-center py-6 lg:py-8 hover:border-gray-300 transition-colors cursor-pointer bg-white hover:shadow-sm group">
                            <span className="text-4xl font-medium text-gray-800 mb-2 group-hover:scale-110 transition-transform">ಕ</span>
                            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.15em]">Kannada</span>
                        </div>
                        <div className="border border-gray-200 rounded-3xl flex flex-col items-center justify-center py-6 lg:py-8 hover:border-gray-300 transition-colors cursor-pointer bg-white hover:shadow-sm group">
                            <span className="text-4xl font-medium text-gray-800 mb-2 group-hover:scale-110 transition-transform">म</span>
                            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.15em]">Marathi</span>
                        </div>
                        <div className="border border-gray-200 rounded-3xl flex flex-col items-center justify-center py-6 lg:py-8 hover:border-gray-300 transition-colors cursor-pointer bg-white hover:shadow-sm group">
                            <span className="text-4xl font-medium text-gray-800 mb-2 group-hover:scale-110 transition-transform">ব</span>
                            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.15em]">Bengali</span>
                        </div>
                        <div className="border border-gray-200 rounded-3xl flex flex-col items-center justify-center py-6 lg:py-8 hover:border-gray-300 transition-colors cursor-pointer bg-white hover:shadow-sm group">
                            <span className="text-4xl font-medium text-gray-800 mb-2 group-hover:scale-110 transition-transform">ગ</span>
                            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.15em]">Gujarati</span>
                        </div>
                    </div>

                    {/* Right Display Board */}
                    <div className="xl:col-span-9 bg-white border border-gray-200 rounded-[3rem] p-10 lg:p-16 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] flex flex-col lg:flex-row justify-between lg:min-h-[440px] items-center lg:items-stretch">

                        <div className="flex-1 flex flex-col justify-center">
                            <span className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6">Talk Naturally</span>
                            <p className="text-2xl lg:text-4xl text-gray-800 font-medium leading-[1.4] mb-8 max-w-2xl">
                                నమస్కారం! నేను వోర్టెక్స్. ఈ రోజు నేను మీకు ఎలా సహాయపడగలను?
                            </p>
                            <div className="bg-gray-50 rounded-2xl p-6 text-gray-500 text-sm lg:text-base font-medium mb-10 lg:mb-12 border border-gray-100 shadow-inner max-w-lg">
                                Namaste! Nenu Vortex. Ee roju nenu meeku ela sahayapadagalanu?
                            </div>

                            <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-5 px-10 rounded-2xl shadow-xl shadow-blue-500/20 flex items-center justify-center gap-4 w-max transition-all hover:-translate-y-1 hover:shadow-blue-500/40 text-lg">
                                <Phone size={22} className="fill-white" />
                                Talk to Vortex in Telugu
                            </button>
                        </div>

                        <div className="hidden xl:flex flex-col items-center justify-center ml-12 border-l border-gray-100 pl-16">
                            <span className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-8 text-center">Population<br />Coverage</span>
                            <div className="relative w-48 h-48 flex items-center justify-center">
                                {/* SVG Circular progress */}
                                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                                    <circle cx="50" cy="50" r="42" stroke="#f3f4f6" strokeWidth="8" fill="none" />
                                    <circle cx="50" cy="50" r="42" stroke="#2563eb" strokeWidth="8" fill="none" strokeDasharray="263.89" strokeDashoffset="80" strokeLinecap="round" className="transition-all duration-1000 ease-out" />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-4xl font-black text-gray-900 tracking-tighter">95M+</span>
                                </div>
                            </div>
                            <div className="text-center mt-8">
                                <div className="text-gray-900 font-bold text-lg mb-1">South India</div>
                                <div className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.2em]">Region</div>
                            </div>
                        </div>

                    </div>
                </div>
            </section>

            <CallSimulatorSection />
            <IndustryVerticalsSection />
            <GlobeSection />

            {/* Developer Experience Bento Box */}
            <section className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 py-32 lg:py-48 relative z-10 border-t border-gray-100">

                <div className="text-center max-w-3xl mx-auto mb-16 lg:mb-24">
                    <span className="text-purple-600 font-bold tracking-widest uppercase text-xs sm:text-sm">Developer First</span>
                    <h2 className="text-3xl sm:text-5xl font-black text-gray-900 mt-3 mb-6 tracking-tight">Code your first agent <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">in 5 minutes.</span></h2>
                    <p className="text-gray-500 text-base sm:text-xl font-medium">
                        Vortex operates as a headless voice intelligence layer. Connect your SIP trunks, push transcripts via webhooks directly to your CRM, and trigger live Stripe payment links dynamically through the AI.
                    </p>
                </div>

                {/* The Bento Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 auto-rows-min">

                    {/* Main Bento: The API Terminal (Col Span 2) */}
                    <div className="lg:col-span-2 relative bg-[#111318] rounded-[2rem] sm:rounded-[2.5rem] border border-gray-800 p-8 sm:p-12 overflow-hidden shadow-2xl group hover:border-gray-700 transition-colors flex flex-col justify-between min-h-[400px]">
                        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-blue-500/10 to-purple-500/10 blur-[80px] rounded-full pointer-events-none translate-x-1/3 -translate-y-1/3"></div>

                        <div className="relative z-10 mb-10 text-white">
                            <h3 className="text-2xl sm:text-3xl font-bold tracking-tight mb-4 text-white">One API call. Infinite agents.</h3>
                            <p className="text-gray-400 font-medium text-sm sm:text-base max-w-md">Dispatch thousands of concurrent outbound sales agents globally with a singular cURL post request.</p>
                        </div>

                        <div className="relative z-20 bg-[#0d1015] rounded-2xl border border-gray-800 shadow-xl overflow-hidden w-full font-mono text-[13px] sm:text-sm select-all">
                            <div className="flex items-center px-5 py-3 bg-[#151921] border-b border-gray-800/80">
                                <div className="flex gap-2">
                                    <div className="w-3 h-3 rounded-full bg-[#ef4444]"></div>
                                    <div className="w-3 h-3 rounded-full bg-[#eab308]"></div>
                                    <div className="w-3 h-3 rounded-full bg-[#22c55e]"></div>
                                </div>
                                <span className="ml-4 text-[11px] font-medium text-gray-500 uppercase tracking-widest">vortex-dispatch.sh</span>
                            </div>
                            <div className="p-6 leading-relaxed overflow-x-auto text-left">
                                <div className="text-gray-500 mb-4 font-medium italic"># Initialize a fleet of outbound voice agents instantly</div>
                                <div className="flex whitespace-nowrap mb-1.5">
                                    <span className="text-[#f472b6] mr-2 font-semibold">curl</span>
                                    <span className="text-[#93c5fd] font-medium">-X POST</span>
                                    <span className="text-[#86efac] ml-2">https://api.vortex.ai/v1/call</span> <span className="text-gray-600 ml-2">\</span>
                                </div>
                                <div className="pl-4 whitespace-nowrap mb-1.5">
                                    <span className="text-[#93c5fd] font-medium">-H</span> <span className="text-[#fde047]">"Authorization: Bearer vk_live_abc123"</span> <span className="text-gray-600 ml-2">\</span>
                                </div>
                                <div className="pl-4 whitespace-nowrap mb-1.5">
                                    <span className="text-[#93c5fd] font-medium">-H</span> <span className="text-[#fde047]">"Content-Type: application/json"</span> <span className="text-gray-600 ml-2">\</span>
                                </div>
                                <div className="pl-4 break-all mt-3">
                                    <span className="text-[#93c5fd] font-medium">-d</span> <span className="text-[#fde047]">'{`{"phone": "+1234", "agent_id": "usr_sales_890", "concurrency": 100}`}'</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bento 2: Webhooks (Col Span 1) */}
                    <div className="relative bg-white rounded-[2rem] sm:rounded-[2.5rem] p-8 lg:p-10 border border-gray-200/60 shadow-[0_15px_30px_-10px_rgba(0,0,0,0.05)] group hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.08)] transition-all flex flex-col min-h-[400px]">
                        <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center border border-purple-100 shadow-sm mb-6">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-6 h-6"><path d="M4 22h14a2 2 0 0 0 2-2V7.5L14.5 2H6a2 2 0 0 0-2 2v4" /><polyline points="14 2 14 8 20 8" /><path d="M2.906 14.739c1.942 1.341 4.542 1.341 6.484 0M4.17 10.963c3.702-2.556 8.665-2.556 12.367 0" /></svg>
                        </div>
                        <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 tracking-tight">Streaming Webhooks</h3>
                        <p className="text-gray-500 font-medium text-sm mb-8">Receive live interim transcripts, call metrics, and intent payload extractions in sub-second JSON streams.</p>

                        <div className="mt-auto bg-gray-900 rounded-xl p-4 border border-gray-800 shadow-inner overflow-hidden relative">
                            <div className="absolute top-0 right-0 w-2 h-full bg-green-500/20 animate-pulse"></div>
                            <pre className="text-[10px] text-green-400 font-mono leading-tight">
                                {`{
  "event": "call.intent_identified",
  "call_id": "call_123456",
  "intent": {
    "type": "purchase_agreed",
    "confidence": 0.98
  }
}`}
                            </pre>
                        </div>
                    </div>

                    {/* Bento 3: BYOT (Col Span 1) */}
                    <div className="relative bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2rem] sm:rounded-[2.5rem] p-8 lg:p-10 overflow-hidden shadow-xl group border border-blue-500 min-h-[300px] flex flex-col justify-between">
                        <div className="absolute bottom-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-[60px] translate-y-1/3 translate-x-1/3"></div>
                        <div className="relative z-10 mb-8">
                            <div className="w-12 h-12 bg-white/10 text-white rounded-xl flex items-center justify-center border border-white/20 mb-6 backdrop-blur-md">
                                <Phone size={24} className="stroke-[2.5]" />
                            </div>
                            <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 tracking-tight">Bring Your Own Carrier</h3>
                            <p className="text-blue-100/90 font-medium text-sm">Natively integrate Twilio, Plivo, Exotel, or any SIP/PBX infrastructure zero-switching cost.</p>
                        </div>
                        <div className="relative z-10 flex gap-2">
                            <span className="px-3 py-1.5 bg-white/10 text-white text-[11px] font-bold rounded-lg border border-white/20 backdrop-blur-md">SIP</span>
                            <span className="px-3 py-1.5 bg-white/10 text-white text-[11px] font-bold rounded-lg border border-white/20 backdrop-blur-md">WebRTC</span>
                            <span className="px-3 py-1.5 bg-white/10 text-white text-[11px] font-bold rounded-lg border border-white/20 backdrop-blur-md">Telco</span>
                        </div>
                    </div>

                    {/* Bento 4: Integrations Network (Col Span 2) */}
                    <div className="lg:col-span-2 relative bg-white rounded-[2rem] sm:rounded-[2.5rem] p-8 lg:p-12 border border-gray-200/60 shadow-[0_15px_30px_-10px_rgba(0,0,0,0.05)] group hover:shadow-[0_20px_60px_-10px_rgba(0,0,0,0.08)] transition-shadow min-h-[300px] flex flex-col lg:flex-row items-center gap-10">
                        <div className="flex-1 w-full text-center lg:text-left z-20">
                            <h3 className="text-xl sm:text-3xl font-bold text-gray-900 mb-4 tracking-tight">Unrestricted Ecosystem</h3>
                            <p className="text-gray-500 font-medium text-sm sm:text-base max-w-sm mx-auto lg:mx-0">Trigger dynamic actions into CRM systems mid-conversation using deep Tool Calling functions.</p>
                        </div>

                        <div className="flex-1 w-full flex justify-center lg:justify-end pr-4">
                            <div className="relative flex items-center justify-center gap-6 sm:gap-10">
                                {/* Invisible connector line */}
                                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-100 z-0 border-t border-dashed border-gray-300"></div>

                                <div className="relative z-10 w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-2xl shadow-xl border border-gray-200 flex flex-col items-center justify-center group-hover:-translate-y-2 group-hover:scale-105 transition-all duration-500 bg-gradient-to-b from-white to-gray-50">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-8 h-8 text-blue-600 mb-1"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                                </div>
                                <div className="relative z-10 w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-2xl shadow-xl border border-gray-200 flex flex-col items-center justify-center group-hover:-translate-y-2 group-hover:scale-105 transition-all duration-500 bg-gradient-to-b from-white to-gray-50 delay-75">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-8 h-8 text-purple-600 mb-1"><rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" /></svg>
                                </div>
                                <div className="relative z-10 w-16 h-16 sm:w-20 sm:h-20 bg-gray-900 rounded-2xl shadow-2xl border border-gray-700 flex flex-col items-center justify-center group-hover:-translate-y-2 group-hover:scale-105 transition-all duration-500 delay-150">
                                    <Sparkles size={32} className="text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </section>

            {/* Interactive Revenue Calculator */}
            <RevenueCalculator />

            {/* Massive Trust & Scale Metrics Section */}
            <section className="w-full bg-white relative z-10 border-t border-gray-100 py-32 lg:py-40">
                <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12">
                    <div className="text-center max-w-3xl mx-auto mb-20 lg:mb-28">
                        <span className="text-blue-600 font-bold tracking-widest uppercase text-xs sm:text-sm">Built for Enterprise</span>
                        <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-gray-900 mt-4 mb-6 tracking-tight">Scale without friction.</h2>
                        <p className="text-gray-500 text-lg lg:text-xl font-medium">Powering the backbone of modern communications with absolutely zero compromise on security or up-time.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 mb-24 lg:mb-32">
                        <div className="flex flex-col border-l-4 border-blue-600 pl-6 group">
                            <span className="text-5xl lg:text-7xl font-black text-gray-900 tracking-tighter group-hover:scale-105 origin-left transition-transform duration-500">99.99<span className="text-blue-600">%</span></span>
                            <span className="text-gray-500 font-bold mt-4 uppercase tracking-wider text-sm">API Uptime SLA</span>
                        </div>
                        <div className="flex flex-col border-l-4 border-indigo-600 pl-6 group">
                            <span className="text-5xl lg:text-7xl font-black text-gray-900 tracking-tighter group-hover:scale-105 origin-left transition-transform duration-500">150<span className="text-indigo-600">M+</span></span>
                            <span className="text-gray-500 font-bold mt-4 uppercase tracking-wider text-sm">Calls processed</span>
                        </div>
                        <div className="flex flex-col border-l-4 border-purple-600 pl-6 group">
                            <span className="text-5xl lg:text-7xl font-black text-gray-900 tracking-tighter group-hover:scale-105 origin-left transition-transform duration-500">&lt;200<span className="text-purple-600">ms</span></span>
                            <span className="text-gray-500 font-bold mt-4 uppercase tracking-wider text-sm">Average latency</span>
                        </div>
                        <div className="flex flex-col border-l-4 border-green-500 pl-6 group">
                            <span className="text-5xl lg:text-7xl font-black text-gray-900 tracking-tighter group-hover:scale-105 origin-left transition-transform duration-500">SOC 2</span>
                            <span className="text-gray-500 font-bold mt-4 uppercase tracking-wider text-sm">Type II Certified</span>
                        </div>
                    </div>

                    {/* Dark Mode Testimonial Card */}
                    <div className="max-w-[1200px] mx-auto bg-[#0d1117] rounded-[2.5rem] lg:rounded-[3rem] p-10 lg:p-20 flex flex-col lg:flex-row items-center gap-12 lg:gap-24 shadow-2xl relative overflow-hidden border border-gray-800">
                        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-[100px] pointer-events-none translate-x-1/4 -translate-y-1/4"></div>
                        <div className="relative z-10 flex-1">
                            <svg className="w-12 h-12 text-blue-500 mb-8 opacity-50" fill="currentColor" viewBox="0 0 32 32"><path d="M9.352 4C4.456 7.456 1 13.12 1 19.36c0 5.088 3.072 8.064 6.624 8.064 3.36 0 5.856-2.688 5.856-5.856 0-3.168-2.208-5.472-5.088-5.472-.576 0-1.344.096-1.536.192.48-3.264 3.552-7.104 6.624-9.024L9.352 4zm16.512 0c-4.8 3.456-8.256 9.12-8.256 15.36 0 5.088 3.072 8.064 6.624 8.064 3.264 0 5.856-2.688 5.856-5.856 0-3.168-2.304-5.472-5.184-5.472-.576 0-1.248.096-1.44.192.48-3.264 3.456-7.104 6.528-9.024L25.864 4z"></path></svg>
                            <h3 className="text-white text-2xl lg:text-4xl font-bold leading-tight mb-10 tracking-tight">"Vortex completely decoupled our outbound sales dependency. We deployed a fleet of 50 AI agents over the weekend and saw a 300% lift in connection rates immediately."</h3>
                            <div className="flex items-center gap-5">
                                <div className="w-14 h-14 bg-gray-800 rounded-full flex items-center justify-center text-xl font-bold text-white border border-gray-700">S</div>
                                <div>
                                    <div className="text-white font-bold text-lg">Sarah Jenkins</div>
                                    <div className="text-gray-400 font-medium">VP of Revenue, Stellar Scale</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Minimalist Split Pricing Summary (Vortex Style) */}
            <section className="w-full bg-[#fdfbf7] relative z-10 py-24 lg:py-32 border-t border-gray-100">
                <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-12">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">

                        {/* Left Content */}
                        <div className="flex flex-col">
                            <h2 className="text-3xl md:text-4xl lg:text-[2.75rem] font-black text-gray-900 leading-[1.1] mb-6 tracking-tight">
                                Transparent INR pricing.<br />No stacked surprises.
                            </h2>
                            <p className="text-gray-500 text-lg font-medium mb-10 max-w-md leading-relaxed">
                                Pick a plan for your team size, concurrency, and call volume; or model your exact savings with the ROI calculator.
                            </p>

                            <div className="flex flex-wrap items-center gap-4">
                                <Link to="/register" className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all hover:-translate-y-0.5">
                                    See pricing
                                </Link>
                                <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="px-8 py-4 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-all shadow-sm">
                                    ROI calculator
                                </button>
                            </div>
                        </div>

                        {/* Right Content - Table */}
                        <div className="flex flex-col border-t border-gray-200/80 w-full lg:max-w-md">

                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-6 py-6 border-b border-gray-200/80">
                                <div className="text-lg md:text-xl font-black text-gray-900 w-36 shrink-0 font-mono tracking-tighter">₹2,999/mo</div>
                                <div className="text-[13px] font-medium text-gray-500 leading-tight">Plans starts. Includes 300 minutes</div>
                            </div>

                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-6 py-6 border-b border-gray-200/80">
                                <div className="text-lg md:text-xl font-black text-gray-900 w-36 shrink-0 font-mono tracking-tighter">upto ₹2/min</div>
                                <div className="text-[13px] font-medium text-gray-500 leading-tight">Enterprise volume rate at 10,000+ minutes</div>
                            </div>

                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-6 py-6 border-b border-gray-200/80">
                                <div className="text-lg md:text-xl font-black text-gray-900 w-36 shrink-0 font-mono tracking-tighter flex items-center gap-2">GST <span className="text-gray-500">invoice</span></div>
                                <div className="text-[13px] font-medium text-gray-500 leading-tight">ITC-claimable INR billing</div>
                            </div>

                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-6 py-6 border-b border-gray-200/80">
                                <div className="text-lg md:text-xl font-black text-gray-900 w-36 shrink-0 font-mono tracking-tighter flex items-center gap-2">Cancel <span className="text-gray-500">anytime</span></div>
                                <div className="text-[13px] font-medium text-gray-500 leading-tight">No credit card required to start</div>
                            </div>

                        </div>

                    </div>
                </div>
            </section>

            {/* Final Footer CTA & Links */}
            <footer className="w-full bg-white pt-24 pb-12 border-t border-gray-200 relative z-10 overflow-hidden">
                <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 relative z-20">

                    {/* Massive Pre-Footer CTA */}
                    <div className="flex flex-col items-center text-center bg-gray-50 rounded-[2.5rem] p-10 sm:p-16 lg:p-24 mb-24 border border-gray-200 shadow-xl relative overflow-hidden">
                        {/* Dramatic glow effect mapped to Vortex Theme */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-100/50 blur-[120px] rounded-full pointer-events-none"></div>

                        <div className="relative z-10 max-w-3xl mx-auto">
                            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 tracking-tight mb-6 leading-tight">Ready to operationalize AI calling?</h2>
                            <p className="text-gray-500 text-lg md:text-xl font-medium leading-relaxed mb-12">See how Vortex can support your sales, support, collections, scheduling, and operations teams with real-time AI phone agents.</p>

                            <div className="flex flex-col sm:flex-row items-center justify-center gap-5 mb-16">
                                <button className="w-full sm:w-auto px-10 py-5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/25 transition-all hover:-translate-y-0.5 text-lg">Talk to sales</button>
                                <button className="w-full sm:w-auto px-10 py-5 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-bold rounded-2xl transition-all text-lg shadow-sm">View API docs</button>
                            </div>

                            <div className="pt-10 flex flex-col items-center border-t border-gray-200 w-full max-w-lg mx-auto">
                                <span className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] mb-6">OR CALL OUR AI AGENT DIRECTLY</span>
                                <div className="text-4xl md:text-5xl font-black text-gray-900 tracking-widest font-mono mb-6">+91 11 4056 6600</div>
                                <div className="text-sm font-bold text-gray-500 mb-10">Available 24/7 · Hindi, Hinglish, English, Telugu</div>

                                <button className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-green-50 hover:bg-green-100 border border-green-200 rounded-full text-green-700 font-bold transition-colors w-max shadow-sm">
                                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.888-.788-1.487-1.761-1.66-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" /></svg>
                                    Chat on WhatsApp
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Standard Footer Links Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-10 mb-16">

                        <div className="col-span-2 lg:col-span-2">
                            <div className="flex items-center gap-2.5 mb-6">
                                <div className="bg-blue-600 text-white p-1.5 rounded-lg">
                                    <Phone size={18} className="stroke-[2.5]" />
                                </div>
                                <span className="text-xl font-extrabold tracking-tight text-gray-900">Vortex.ai</span>
                            </div>
                            <p className="text-gray-500 text-sm leading-relaxed max-w-xs mb-8">
                                The headless voice intelligence layer. Build hyper-realistic inbound and outbound AI agents natively over the SIP trunk protocol.
                            </p>
                            <div className="flex items-center gap-4">
                                <a href="#" className="w-10 h-10 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-900 hover:border-gray-300 transition-colors">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" /></svg>
                                </a>
                                <a href="#" className="w-10 h-10 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-900 hover:border-gray-300 transition-colors">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.8c0-1.2-.4-2.4-1.2-3.3 3.1-.3 6.4-1.5 6.4-7 0-1.5-.5-2.8-1.4-3.8.1-.4.6-1.8-.1-3.8 0 0-1.2-.4-3.9 1.4a13.4 13.4 0 0 0-7 0C6.2 2.7 5 3.1 5 3.1c-.7 2-.2 3.4-.1 3.8-.9 1-1.4 2.3-1.4 3.8 0 5.5 3.3 6.7 6.4 7-.8.8-1.1 2-1.2 3.3V22" /></svg>
                                </a>
                                <a href="#" className="w-10 h-10 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-900 hover:border-gray-300 transition-colors">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" /></svg>
                                </a>
                            </div>
                        </div>

                        <div>
                            <h4 className="text-gray-900 font-bold mb-6">Product</h4>
                            <ul className="space-y-4 text-sm text-gray-500 font-medium">
                                <li><a href="#" className="hover:text-blue-600 transition-colors">Inbound Routing</a></li>
                                <li><a href="#" className="hover:text-blue-600 transition-colors">Outbound Sales</a></li>
                                <li><a href="#" className="hover:text-blue-600 transition-colors">API Reference</a></li>
                                <li><a href="#" className="hover:text-blue-600 transition-colors">Webhooks</a></li>
                                <li><a href="#" className="hover:text-blue-600 transition-colors">SIP Trunking</a></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="text-gray-900 font-bold mb-6">Enterprise</h4>
                            <ul className="space-y-4 text-sm text-gray-500 font-medium">
                                <li><a href="#" className="hover:text-blue-600 transition-colors">Security</a></li>
                                <li><a href="#" className="hover:text-blue-600 transition-colors">Compliance</a></li>
                                <li><a href="#" className="hover:text-blue-600 transition-colors">SOC2 Details</a></li>
                                <li><a href="#" className="hover:text-blue-600 transition-colors">Case Studies</a></li>
                                <li><a href="#" className="hover:text-blue-600 transition-colors">Pricing</a></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="text-gray-900 font-bold mb-6">Resources</h4>
                            <ul className="space-y-4 text-sm text-gray-500 font-medium">
                                <li><a href="#" className="hover:text-blue-600 transition-colors">Documentation</a></li>
                                <li><a href="#" className="hover:text-blue-600 transition-colors">Discord Community</a></li>
                                <li><a href="#" className="hover:text-blue-600 transition-colors">System Status</a></li>
                                <li><a href="#" className="hover:text-blue-600 transition-colors">Blog</a></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="text-gray-900 font-bold mb-6">Company</h4>
                            <ul className="space-y-4 text-sm text-gray-500 font-medium">
                                <li><a href="#" className="hover:text-blue-600 transition-colors">About Us</a></li>
                                <li><a href="#" className="hover:text-blue-600 transition-colors">Careers</a></li>
                                <li><a href="#" className="hover:text-blue-600 transition-colors">Terms of Service</a></li>
                                <li><a href="#" className="hover:text-blue-600 transition-colors">Privacy Policy</a></li>
                            </ul>
                        </div>
                    </div>

                    <div className="pt-8 border-t border-gray-200 flex flex-col md:flex-row items-center justify-between text-sm text-gray-500 font-medium">
                        <p>© 2026 Vortex.ai Inc. All rights reserved. <span className="text-gray-400">Powered by AOTMS.</span></p>
                        <div className="flex items-center gap-6 mt-4 md:mt-0">
                            <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-500"></div> All systems operational</span>
                        </div>
                    </div>

                </div>
            </footer>

            {/* Embedded CSS for custom waveform animation */}
            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes pulse-wave {
                    0% { transform: scaleY(0.4); opacity: 0.7; }
                    100% { transform: scaleY(1); opacity: 1; }
                }
                @keyframes marquee {
                    0% { transform: translateX(0%); }
                    100% { transform: translateX(-50%); }
                }
                .animate-marquee {
                    animation: marquee 30s linear infinite;
                }
            `}} />
        </div>
    );
}
