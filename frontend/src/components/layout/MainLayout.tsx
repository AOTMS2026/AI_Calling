import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Phone, User, Settings, LogOut, FileText, PhoneCall, BarChart, ChevronDown, LayoutDashboard, Search, Coins, Bell, Building2, Users, Bot, History, Target, Calendar, Database, AlertOctagon, Volume2, PhoneOff, Play, Send } from 'lucide-react';
import { apiClient } from '../../api/client';
import toast from 'react-hot-toast';

interface MainLayoutProps {
    children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [liveCredits, setLiveCredits] = useState<number>(0);
    const [loadingCredits, setLoadingCredits] = useState(true);
    const [userProfile, setUserProfile] = useState<any>(null);
    const location = useLocation();
    const navigate = useNavigate();
    const userRole = localStorage.getItem('role') || 'customer';

    // SOS Alerts state
    const [activeAlerts, setActiveAlerts] = useState<any[]>([]);
    const [dismissedAlerts, setDismissedAlerts] = useState<Record<number, boolean>>({});
    const [webrtcCallId, setWebrtcCallId] = useState<number | null>(null);
    const [webrtcState, setWebrtcState] = useState<'idle' | 'connecting' | 'connected' | 'disconnected'>('idle');

    // Web Audio Synthesizer Emergency Warning Sound
    const playEmergencyAlarm = () => {
        try {
            const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
            if (!AudioCtx) return;
            const ctx = new AudioCtx();

            // Channel oscillator 1 (Emergency sweep alert)
            const osc1 = ctx.createOscillator();
            const gain = ctx.createGain();
            osc1.type = 'sine';
            osc1.frequency.setValueAtTime(880, ctx.currentTime);
            osc1.frequency.linearRampToValueAtTime(440, ctx.currentTime + 0.4);

            // Low sawtooth drone for urgency base
            const osc2 = ctx.createOscillator();
            osc2.type = 'sawtooth';
            osc2.frequency.setValueAtTime(220, ctx.currentTime);

            gain.gain.setValueAtTime(0.12, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.005, ctx.currentTime + 1.2);

            osc1.connect(gain);
            osc2.connect(gain);
            gain.connect(ctx.destination);

            osc1.start();
            osc2.start();
            osc1.stop(ctx.currentTime + 1.2);
            osc2.stop(ctx.currentTime + 1.2);
        } catch (err) {
            console.error("Synthesizer Alarm Interrupted:", err);
        }
    };

    // Simulated WebRTC Agent dial
    const startSimulatedWebRTCDial = (todoId: number) => {
        setWebrtcCallId(todoId);
        setWebrtcState('connecting');
        setTimeout(() => {
            setWebrtcState('connected');
            // Play positive tone connect sound
            try {
                const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
                if (AudioCtx) {
                    const ctx = new AudioCtx();
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.frequency.setValueAtTime(600, ctx.currentTime);
                    gain.gain.setValueAtTime(0.08, ctx.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start();
                    osc.stop(ctx.currentTime + 0.25);
                }
            } catch { }
        }, 1500);
    };

    const endSimulatedWebRTCDial = () => {
        setWebrtcState('disconnected');
        setTimeout(() => {
            setWebrtcCallId(null);
            setWebrtcState('idle');
        }, 1000);
    };

    const acknowledgeAlert = async (alertId: number) => {
        try {
            await apiClient.patch(`/todos/${alertId}`, { status: 'Completed' });
            setDismissedAlerts(prev => ({ ...prev, [alertId]: true }));
            setActiveAlerts((prev: any[]) => prev.filter((a: any) => a.id !== alertId));
            toast.success("SOS Critical Alarm Responded & Silenced.");
        } catch (e) {
            toast.error("Failed to silence alarm.");
        }
    };

    // Keep reference of dismissedAlerts to avoid interval rebuild loops
    const dismissedAlertsRef = useRef(dismissedAlerts);
    useEffect(() => {
        dismissedAlertsRef.current = dismissedAlerts;
    }, [dismissedAlerts]);

    // Poll active SOS items periodically utilizing refs to halt re-render loop issues
    useEffect(() => {
        const checkSOS = async () => {
            try {
                const res = await apiClient.get('/todos/sos-alerts');
                const alerts = res.data?.data || [];
                const fresh = alerts.filter((a: any) => !dismissedAlertsRef.current[a.id]);

                setActiveAlerts(prevActive => {
                    if (fresh.length === 0) {
                        return prevActive.length === 0 ? prevActive : [];
                    }

                    const knownFreshIds = fresh.map((f: any) => f.id);
                    const hasNewAlert = knownFreshIds.some((id: any) => !prevActive.some((a: any) => a.id === id));

                    if (hasNewAlert) {
                        playEmergencyAlarm();
                    }

                    // Strict reference check comparison to avert React layout update cascade triggers
                    const isSame = prevActive.length === fresh.length &&
                        prevActive.every((a, idx) => a.id === fresh[idx]?.id);
                    return isSame ? prevActive : fresh;
                });
            } catch (err) {
                console.error("SOS Web Hook Alerts Poll failed:", err);
            }
        };

        checkSOS();
        const poller = setInterval(checkSOS, 5000);
        return () => clearInterval(poller);
    }, []);


    // Geometrical Aggregation Polling logic for Credits
    useEffect(() => {
        const fetchCredits = async () => {
            try {
                const meRes = await apiClient.get('/auth/me');
                const boundCustomer = meRes.data;
                setUserProfile(boundCustomer);
                const assignedCredits = boundCustomer?.allocated_credits || 500;

                // Natively source purely aggregated DB logic bypassing heavy legacy N-queries
                const metricsRes = await apiClient.get(`/dashboard/metrics`);
                const dbMetrics = metricsRes.data?.data;
                const consumedCoins = dbMetrics ? dbMetrics.total_cost : 0.0;

                const remainingCredits = Math.max(0, assignedCredits - consumedCoins);

                // Allow dynamic credit limits mapping cleanly natively
                setLiveCredits(remainingCredits);
            } catch (e) {
                console.error("Layout global credits sync failed:", e);
            } finally {
                setLoadingCredits(false);
            }
        };
        fetchCredits();

        // Polling explicitly disabled. System strictly natively Lazy Loads data once per component mount cycle.
    }, []);

    // Responsive Dropdown Auto-Close
    useEffect(() => {
        const handleResize = () => setDropdownOpen(false);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        navigate('/');
    };

    const currentPath = location.pathname;

    // Hardened Global React Router Security Barrier -> Completely encapsulates app payload
    if (!loadingCredits && userRole !== 'admin' && liveCredits <= 0) {
        return (
            <div className="flex flex-col items-center justify-center w-screen h-screen bg-red-600 text-white p-6 z-[9999] fixed inset-0 font-sans">
                <Target size={64} className="mb-6 opacity-30" />
                <h1 className="text-4xl md:text-5xl font-black uppercase tracking-widest mb-4">Account Locked</h1>
                <p className="text-lg md:text-xl font-semibold opacity-90 text-center mb-10 max-w-xl">
                    Your platform capacity balance has been fully exhausted. Outbound nodes have been halted.
                </p>
                <div className="flex flex-col sm:flex-row items-center gap-4">
                    <button className="bg-white text-red-600 font-black px-10 py-4 rounded-xl shadow-xl hover:bg-gray-100 hover:scale-105 active:scale-95 transition-all uppercase tracking-widest text-sm"
                        onClick={() => toast.success("Payment Gateway Triggered (Sandbox Mode)")}>
                        Finish Payment
                    </button>
                    <button onClick={handleLogout} className="bg-red-700 text-white font-bold px-8 py-4 rounded-xl hover:bg-red-800 transition-all text-sm uppercase tracking-wider border border-red-500">
                        Secure Logout
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">

            {/* Left Sidebar (Desktop) */}
            <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-gray-200">

                {/* Brand Header */}
                <div className="h-20 flex items-center px-6 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <img src="/atm-logo.jpeg" alt="AOTMS Logo" className="w-10 h-10 rounded-lg shadow-sm border border-gray-100 object-cover" />
                        <span className="text-xl font-extrabold tracking-tight text-gray-900">AOTMS</span>
                    </div>
                </div>

                {/* Navigation Links */}
                <div className="flex-1 overflow-y-auto py-6 px-4 space-y-8">

                    {/* Customer-Oriented Modules Group - Hidden for Admins */}
                    {userRole !== 'admin' && (
                        <>
                            {/* Platform Group */}
                            <div>
                                <h3 className="px-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Platform</h3>
                                <div className="space-y-1">
                                    <Link to="/dashboard" className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${currentPath === '/dashboard' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}>
                                        <LayoutDashboard size={16} /> Dashboard
                                    </Link>
                                    <Link to="/agents" className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${currentPath === '/agents' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}>
                                        <User size={16} /> Agents
                                    </Link>

                                </div>
                            </div>

                            {/* Campaigns Group */}
                            <div>
                                <h3 className="px-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Campaigns</h3>
                                <div className="space-y-1">
                                    <Link to="/campaigns/inbound" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors">
                                        <PhoneCall size={16} className="transform rotate-180" /> Inbound
                                    </Link>
                                    <Link to="/campaigns/outbound" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors">
                                        <Phone size={16} className="transform rotate-[270deg]" /> Outbound
                                    </Link>
                                </div>
                            </div>

                            {/* Management Group */}
                            <div>
                                <h3 className="px-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Management</h3>
                                <div className="space-y-1">
                                    <Link to="/contacts" className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${currentPath === '/contacts' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}>
                                        <Users size={16} /> Contacts
                                    </Link>
                                    <Link to="/calls" className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${currentPath === '/calls' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}>
                                        <History size={16} /> All Contact History
                                    </Link>
                                    <Link to="/integrations" className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${currentPath === '/integrations' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}>
                                        <Settings size={16} /> Integrations
                                    </Link>
                                    <Link to="/phone-numbers" className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${currentPath === '/phone-numbers' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}>
                                        <Phone size={16} /> Phone Numbers
                                    </Link>
                                    <Link to="/todos" className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${currentPath === '/todos' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}>
                                        <FileText size={16} /> Todo List
                                    </Link>
                                    <Link to="/whatsapp" className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${currentPath === '/whatsapp' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}>
                                        <Send size={16} /> WhatsApp Outreach
                                    </Link>
                                </div>
                            </div>

                            {/* Help Group */}
                            <div>
                                <h3 className="px-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-6 mb-3">Help</h3>
                                <div className="space-y-1">
                                    <Link to="/appointments" className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${currentPath === '/appointments' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}>
                                        <Calendar size={16} /> Appointments
                                    </Link>
                                </div>
                            </div>
                        </>
                    )}

                    {/* RBAC Administration Group - Only Visible to Admins */}
                    {userRole === 'admin' && (
                        <div>
                            <h3 className="px-3 text-[10px] font-bold text-red-500 uppercase tracking-widest mb-3">Administration</h3>
                            <div className="space-y-1">
                                <Link to="/users" className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${currentPath === '/users' ? 'bg-red-50 text-red-700' : 'text-gray-600 hover:bg-red-50 hover:text-red-700'}`}>
                                    <User size={16} /> User Management
                                </Link>
                                <Link to="/admin/appointments" className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${currentPath === '/admin/appointments' ? 'bg-red-50 text-red-700' : 'text-gray-600 hover:bg-red-50 hover:text-red-700'}`}>
                                    <Calendar size={16} /> Appoinment Booking
                                </Link>
                                <Link to="/admin/calcom" className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${currentPath === '/admin/calcom' ? 'bg-red-50 text-red-700' : 'text-gray-600 hover:bg-red-50 hover:text-red-700'}`}>
                                    <Calendar size={16} /> Cal.com
                                </Link>
                                <Link to="/organization" className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${currentPath === '/organization' ? 'bg-red-50 text-red-700' : 'text-gray-600 hover:bg-red-50 hover:text-red-700'}`}>
                                    <Building2 size={16} /> Organization Profile
                                </Link>
                                <Link to="/assign-agent" className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${currentPath === '/assign-agent' ? 'bg-red-50 text-red-700' : 'text-gray-600 hover:bg-red-50 hover:text-red-700'}`}>
                                    <Target size={16} /> Assign Agents Quota
                                </Link>
                                <Link to="/assign-credits" className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${currentPath === '/assign-credits' ? 'bg-red-50 text-emerald-700' : 'text-gray-600 hover:bg-red-50 hover:text-emerald-700'}`}>
                                    <Coins size={16} /> Assign Credits
                                </Link>
                                <Link to="/admin/phone-numbers" className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${currentPath === '/admin/phone-numbers' ? 'bg-red-50 text-blue-700' : 'text-gray-600 hover:bg-red-50 hover:text-blue-700'}`}>
                                    <Phone size={16} /> Phone_Numbers
                                </Link>
                            </div>
                        </div>
                    )}

                </div>

                {/* Bottom Profile Area */}
                <div className="p-4 border-t border-gray-200">
                    <button
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                        className={`flex items-center justify-between w-full p-2 rounded-xl transition-colors relative ${userRole === 'admin' ? 'hover:bg-red-50' : 'hover:bg-gray-100'}`}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-sm ${userRole === 'admin' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                                {userProfile?.name?.charAt(0)?.toUpperCase() || 'R'}
                            </div>
                            <div className="text-left hidden lg:block">
                                <p className={`text-xs font-bold ${userRole === 'admin' ? 'text-red-900' : 'text-gray-900'}`}>{userProfile?.name || 'Loading...'}</p>
                                <p className={`text-[10px] ${userRole === 'admin' ? 'text-red-500' : 'text-gray-500'}`}>{userRole === 'admin' ? 'Admin Account' : 'Customer Account'}</p>
                            </div>
                        </div>
                        <ChevronDown size={14} className={userRole === 'admin' ? 'text-red-400' : 'text-gray-400'} />

                        {dropdownOpen && (
                            <div className="absolute bottom-full left-0 mb-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50 cursor-default" onClick={e => e.stopPropagation()}>

                                <Link to="/profile" className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                                    <User size={16} /> My Profile
                                </Link>
                                <div className="h-px bg-gray-100 my-1"></div>
                                <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
                                    <LogOut size={16} /> Logout
                                </button>
                            </div>
                        )}
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Top Header */}
                <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 z-10 shrink-0 shadow-sm">
                    {/* Mobile Brand (Hidden on Desktop) */}
                    <div className="flex items-center gap-2.5">
                        <img src="/atm-logo.jpeg" alt="AOTMS Logo" className="w-8 h-8 rounded-md shadow-sm border border-gray-100 object-cover" />
                        <span className="text-lg font-extrabold tracking-tight text-gray-900">AOTMS</span>
                    </div>

                    {/* Search Bar - Desktop */}
                    <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-white transition-all cursor-text text-gray-500 w-96 ml-4">
                        <Search size={14} className="text-gray-400" />
                        <span className="text-xs font-medium text-gray-400 flex-1">Search campaigns, agents, calls...</span>
                        <div className="flex items-center gap-0.5 opacity-60">
                            <span className="text-[9px] bg-white border border-gray-200 rounded px-1 text-gray-500 font-bold">⌘</span>
                            <span className="text-[9px] bg-white border border-gray-200 rounded px-1 text-gray-500 font-bold">K</span>
                        </div>
                    </div>

                    {/* Right Side Actions */}
                    <div className="flex items-center gap-3 sm:gap-4 ml-auto">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-full border border-gray-200 shadow-sm whitespace-nowrap hidden sm:flex">
                            <Coins size={14} className="text-blue-500" />
                            <span className="text-xs font-bold text-gray-900"><span className="text-gray-500 font-medium mr-1">Total Tokens:</span>{loadingCredits ? '...' : (typeof liveCredits === 'number' ? Math.max(0, liveCredits).toFixed(4) : liveCredits)}</span>
                        </div>

                        <button className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors flex shrink-0">
                            <Bell size={18} />
                            <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></div>
                        </button>
                    </div>
                </header>

                {/* Page Content Scrollable Area */}
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50/50 p-4 sm:p-6 lg:p-8">
                    <div className="max-w-7xl mx-auto relative">
                        {children}
                    </div>
                </main>
            </div>

            {/* Global Real-time SOS alerts overlay */}
            {activeAlerts.length > 0 && (
                <div className="fixed bottom-6 right-6 z-50 w-96 flex flex-col gap-4 animate-bounce-short">
                    {activeAlerts.slice(0, 2).map((alert: any) => (
                        <div key={alert.id} className="bg-white rounded-xl shadow-2xl border-2 border-red-500 overflow-hidden flex flex-col animate-in slide-in-from-bottom-5 duration-200">

                            {/* Alert Header */}
                            <div className="bg-red-500 px-4 py-3 flex items-center justify-between text-white">
                                <div className="flex items-center gap-2">
                                    <AlertOctagon size={16} className="animate-pulse" />
                                    <span className="text-xs font-black tracking-wider uppercase">SOS Crital Failure Alert</span>
                                </div>
                                <span className="text-[9px] bg-red-700/50 px-2 py-0.5 rounded font-mono font-bold">TASKID #{alert.id}</span>
                            </div>

                            {/* Alert Body */}
                            <div className="p-4 space-y-3">
                                <div>
                                    <h4 className="text-xs font-bold text-slate-800">{alert.title}</h4>
                                    <p className="text-[10px] font-medium text-slate-500 mt-1 leading-normal">{alert.description}</p>
                                </div>

                                {/* WebRTC operator routing widgets */}
                                {webrtcCallId === alert.id ? (
                                    <div className="p-3 bg-slate-900 rounded-lg text-[10px] font-mono text-slate-300 space-y-2 border border-slate-800">
                                        <div className="flex justify-between items-center">
                                            <span className="flex items-center gap-1.5">
                                                <span className={`w-2 h-2 rounded-full ${webrtcState === 'connected' ? 'bg-green-500 animate-pulse' : 'bg-amber-500'}`}></span>
                                                Status: {webrtcState.toUpperCase()}
                                            </span>
                                            <span className="text-slate-550">WebRTC Signal Session</span>
                                        </div>

                                        {webrtcState === 'connecting' && (
                                            <p className="text-slate-450 italic">WebRTC Signal Shaking Hands (Peer-to-Peer STUN/TURN Client Route)...</p>
                                        )}
                                        {webrtcState === 'connected' && (
                                            <div className="space-y-1">
                                                <p className="text-green-400 font-bold">WebRTC Route Connected (G.711 PCMU Codec, 8kHz).</p>
                                                <p className="text-[9px] text-slate-400">Live Operator Audio Stream active. Press disconnect to close.</p>
                                            </div>
                                        )}
                                        {webrtcState === 'disconnected' && (
                                            <p className="text-red-400">RTC Session Ended.</p>
                                        )}

                                        <button
                                            onClick={endSimulatedWebRTCDial}
                                            className="w-full py-1 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white rounded text-[10px] font-semibold transition-all border border-red-500/30"
                                        >
                                            Disconnect Operator Line
                                        </button>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            onClick={() => startSimulatedWebRTCDial(alert.id)}
                                            className="py-1.5 bg-[#0a8ea0] hover:bg-[#077a8a] text-white rounded text-[10.5px] font-bold transition-all shadow-xs flex items-center justify-center gap-1.5"
                                        >
                                            <Volume2 size={13} /> RTC Dial Backup
                                        </button>

                                        <button
                                            onClick={() => acknowledgeAlert(alert.id)}
                                            className="py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10.5px] font-bold transition-all"
                                        >
                                            Mute & Resolve
                                        </button>
                                    </div>
                                )}
                            </div>

                        </div>
                    ))}
                </div>
            )}

        </div>
    );
}
