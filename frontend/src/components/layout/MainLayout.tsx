import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Phone, User, Settings, LogOut, FileText, PhoneCall, BarChart, ChevronDown, LayoutDashboard, Search, Coins, Bell, Building2, Users } from 'lucide-react';

interface MainLayoutProps {
    children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const userRole = localStorage.getItem('role') || 'customer';

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
                            <Link to="/knowledge" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors">
                                <FileText size={16} /> Knowledge Base
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
                            <Link to="/calls" className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${currentPath === '/calls' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}>
                                <BarChart size={16} /> Call Logs
                            </Link>
                            <Link to="/integrations" className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${currentPath === '/integrations' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}>
                                <Settings size={16} /> Integrations
                            </Link>
                            <Link to="/phone-numbers" className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${currentPath === '/phone-numbers' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}>
                                <Phone size={16} /> Phone Numbers
                            </Link>
                        </div>
                    </div>

                    {/* RBAC Administration Group - Only Visible to Admins */}
                    {userRole === 'admin' && (
                        <div>
                            <h3 className="px-3 text-[10px] font-bold text-red-500 uppercase tracking-widest mb-3">Administration</h3>
                            <div className="space-y-1">
                                <Link to="/users" className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${currentPath === '/users' ? 'bg-red-50 text-red-700' : 'text-gray-600 hover:bg-red-50 hover:text-red-700'}`}>
                                    <User size={16} /> User Management
                                </Link>
                                <Link to="/organization" className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${currentPath === '/organization' ? 'bg-red-50 text-red-700' : 'text-gray-600 hover:bg-red-50 hover:text-red-700'}`}>
                                    <Building2 size={16} /> Organization Profile
                                </Link>
                            </div>
                        </div>
                    )}

                </div>

                {/* Bottom Profile Area */}
                <div className="p-4 border-t border-gray-200">
                    <button
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                        className="flex items-center justify-between w-full p-2 hover:bg-gray-100 rounded-xl transition-colors relative"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm shadow-sm">R</div>
                            <div className="text-left hidden lg:block">
                                <p className="text-xs font-bold text-gray-900">ramanadham</p>
                                <p className="text-[10px] text-gray-500">Admin Account</p>
                            </div>
                        </div>
                        <ChevronDown size={14} className="text-gray-400" />

                        {dropdownOpen && (
                            <div className="absolute bottom-full left-0 mb-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50">
                                <Link to="/profile" className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                                    <User size={16} /> My Profile
                                </Link>
                                <Link to="/settings" className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                                    <Settings size={16} /> Settings
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
                            <span className="text-xs font-bold text-gray-900">4,500 <span className="text-gray-500 font-medium">credits</span></span>
                        </div>

                        <button className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors flex shrink-0">
                            <Bell size={18} />
                            <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></div>
                        </button>
                    </div>
                </header>

                {/* Page Content Scrollable Area */}
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50/50 p-4 sm:p-6 lg:p-8">
                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
