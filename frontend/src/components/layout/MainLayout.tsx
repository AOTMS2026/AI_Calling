import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Phone, User, Settings, LogOut, FileText, PhoneCall, BarChart, ChevronDown, LayoutDashboard } from 'lucide-react';

interface MainLayoutProps {
    children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        navigate('/');
    };

    const currentPath = location.pathname;

    const getNavClass = (path: string) => {
        return currentPath.startsWith(path)
            ? "text-primary-600 border-b-2 border-primary-600 font-medium pb-4 px-2"
            : "text-gray-500 hover:text-gray-900 pb-4 px-2 hover:border-b-2 hover:border-gray-200 transition-colors";
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Top Navbar */}
            <nav className="bg-white border-b border-gray-200 px-6 py-3 flex justify-between items-center sticky top-0 z-50">
                <div className="flex items-center gap-2">
                    <div className="bg-primary-600 text-white p-1.5 rounded-lg">
                        <Phone size={20} />
                    </div>
                    <span className="text-xl font-bold tracking-tight text-gray-900">AI Calling</span>
                </div>

                <div className="relative">
                    <button
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                        className="flex items-center gap-2 p-1.5 rounded-full hover:bg-gray-100 transition-colors focus:outline-none"
                    >
                        <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-semibold">
                            R
                        </div>
                        <ChevronDown size={16} className="text-gray-500" />
                    </button>

                    {dropdownOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50">
                            <Link to="/dashboard" onClick={() => setDropdownOpen(false)} className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                                <LayoutDashboard size={16} /> Dashboard
                            </Link>
                            <Link to="/profile" onClick={() => setDropdownOpen(false)} className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                                <User size={16} /> Profile
                            </Link>
                            <Link to="/settings" onClick={() => setDropdownOpen(false)} className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                                <Settings size={16} /> Settings
                            </Link>
                            <div className="h-px bg-gray-100 my-1"></div>
                            <button
                                onClick={handleLogout}
                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                            >
                                <LogOut size={16} /> Logout
                            </button>
                        </div>
                    )}
                </div>
            </nav>

            {/* Mini Navigation */}
            <div className="bg-white px-6 pt-4 border-b border-gray-200">
                <div className="flex gap-6 max-w-6xl mx-auto">
                    <Link to="/dashboard" className={getNavClass('/dashboard')}>
                        <span className="flex items-center gap-2"><LayoutDashboard size={18} /> Dashboard</span>
                    </Link>
                    <Link to="/contacts" className={getNavClass('/contacts')}>
                        <span className="flex items-center gap-2"><User size={18} /> Contacts</span>
                    </Link>
                    <Link to="/campaigns" className={getNavClass('/campaigns')}>
                        <span className="flex items-center gap-2"><FileText size={18} /> Campaigns</span>
                    </Link>
                    <Link to="/calls" className={getNavClass('/calls')}>
                        <span className="flex items-center gap-2"><PhoneCall size={18} /> Calls</span>
                    </Link>
                    <Link to="/analytics" className={getNavClass('/analytics')}>
                        <span className="flex items-center gap-2"><BarChart size={18} /> Analytics</span>
                    </Link>
                </div>
            </div>

            {/* Main Content Area */}
            <main className="flex-1 w-full max-w-6xl mx-auto p-6">
                {children}
            </main>
        </div>
    );
}
