import React, { useEffect, useState } from 'react';
import { Building2, Activity, User as UserIcon, Lock, Key, Users, Mail, ShieldCheck, CreditCard } from 'lucide-react';
import { apiClient } from '../api/client';
import toast from 'react-hot-toast';

export const Settings = () => {
    const [activeTab, setActiveTab] = useState('Organization');
    const [orgProfile, setOrgProfile] = useState<any>(null);
    const [userProfile, setUserProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const isAdmin = localStorage.getItem('user_role') === 'admin';

    const TABS = [
        { id: 'Organization', icon: Building2 },
        { id: 'Billing', icon: CreditCard },
        { id: 'Recent Activity', icon: Activity },
        { id: 'Profile', icon: UserIcon },
        { id: 'Security', icon: Lock },
        { id: 'API Keys', icon: Key },
        { id: 'Users', icon: Users },
    ];

    useEffect(() => {
        const fetchOrganization = async () => {
            try {
                if (activeTab !== 'Organization' && activeTab !== 'Billing') return;
                setLoading(true);
                const response = await apiClient.get('/organizations/profile');
                if (response.data?.success) {
                    setOrgProfile(response.data.data);
                } else {
                    toast.error(response.data?.message || 'Failed to map organization bounds.');
                }
            } catch (error: any) {
                console.error("Error fetching org:", error);
                toast.error(error.response?.data?.detail || "Network error loading organization profile.");
            } finally {
                setLoading(false);
            }
        };

        const fetchUserProfile = async () => {
            try {
                if (activeTab !== 'Profile' && activeTab !== 'API Keys') return;
                setLoading(true);
                const response = await apiClient.get('/auth/me');
                if (response.data) {
                    setUserProfile(response.data);
                    localStorage.setItem('user_role', response.data.role); // Update cache on demand
                }
            } catch (error) {
                console.error("User profile mapping failed:", error);
            } finally {
                setLoading(false);
            }
        };

        if (activeTab === 'Organization' || activeTab === 'Billing') {
            fetchOrganization();
        } else if (activeTab === 'Profile' || activeTab === 'API Keys') {
            fetchUserProfile();
        }
    }, [activeTab]);

    const handleSaveApiConfig = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const ravan_org_id = formData.get('ravan_org_id') as string;
        const ravan_api_key = formData.get('ravan_api_key') as string;

        try {
            await apiClient.patch(`/auth/users/${userProfile.id}`, { ravan_org_id, ravan_api_key });
            toast.success("Core enterprise identity keys mapped successfully!");
            // Refresh to update states
            const response = await apiClient.get('/auth/me');
            if (response.data) setUserProfile(response.data);
        } catch (error) {
            toast.error("Failed to map API bounds securely");
        }
    };

    return (
        <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-slate-50">
            {/* Sidebar Settings Navigation */}
            <div className="w-64 bg-white border-r border-slate-200 shadow-sm z-10 flex flex-col pt-6 shrink-0 h-full overflow-y-auto">
                <div className="px-6 mb-6">
                    <h2 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                        Settings
                    </h2>
                </div>
                <div className="flex-1 px-4 space-y-1">
                    {TABS.map((tab) => {
                        if (tab.id === 'API Keys' && !isAdmin) return null;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === tab.id
                                    ? 'bg-indigo-50/70 text-indigo-700 font-semibold border border-indigo-100 shadow-sm'
                                    : 'text-slate-600 font-medium hover:bg-slate-100 hover:text-slate-900 border border-transparent'
                                    }`}
                            >
                                <tab.icon size={18} className={activeTab === tab.id ? "text-indigo-600" : "text-slate-400"} />
                                <span className="text-[14.5px]">{tab.id}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Main Content Pane */}
            <div className="flex-1 bg-slate-50 overflow-y-auto p-8 md:p-12 relative h-full scroll-smooth">
                {activeTab === 'Organization' && (
                    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700 ease-out">
                        <div>
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Organization</h1>
                            <p className="text-slate-500 mt-1font-medium">Manage your organization settings, members, and view effective bounds.</p>
                        </div>

                        {/* Top Organizations Carousel Card */}
                        <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm p-6 overflow-hidden">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-[15px] font-bold text-slate-900 flex items-center gap-2">
                                    <Building2 size={16} className="text-blue-500" />
                                    Your Organizations
                                </h3>
                                <button className="text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors border border-blue-200">
                                    + New Organization
                                </button>
                            </div>
                            <p className="text-[13px] text-slate-500 mb-6">Select an organization to work on or create a new one.</p>

                            {/* Org Selector Card */}
                            <div className="flex">
                                <div className="bg-sky-50 border-2 border-sky-300 rounded-2xl p-4 min-w-[280px] shadow-sm relative cursor-pointer hover:shadow-md transition-shadow">
                                    <div className="flex items-center justify-between pointer-events-none">
                                        <h4 className="font-bold text-slate-900 text-sm truncate pr-4">{orgProfile?.name || 'Loading...'}</h4>
                                        <div className="bg-white rounded-full p-1 border border-sky-200 shrink-0 shadow-sm">
                                            <div className="w-2.5 h-2.5 bg-blue-500 rounded-full"></div>
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1 block">Admin</span>
                                </div>
                            </div>
                        </div>

                        {/* Main Settings Form Card */}
                        <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm min-h-[400px]">
                            {loading ? (
                                <div className="flex items-center justify-center h-64">
                                    <div className="w-8 h-8 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin"></div>
                                </div>
                            ) : orgProfile ? (
                                <div className="p-8">
                                    {/* Header Hero */}
                                    <div className="flex items-start gap-5 mb-10 pb-6 border-b border-slate-100">
                                        <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl flex items-center justify-center shrink-0 shadow-md transform -rotate-2">
                                            <Building2 size={32} className="text-white drop-shadow-sm" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h2 className="text-2xl font-black text-slate-900 truncate tracking-tight">{orgProfile.name}</h2>
                                            <div className="flex items-center gap-4 mt-2 text-xs font-semibold text-slate-500 flex-wrap">
                                                <span className="bg-slate-100 px-2.5 py-1 rounded-md font-mono border border-slate-200 flex items-center gap-1.5 text-slate-600 truncate max-w-[200px]">
                                                    <span className="text-slate-400">#</span> {orgProfile.id}
                                                </span>
                                                <span className="flex items-center gap-1">🌐 {orgProfile.slug}</span>
                                                <span className={`px-2.5 py-0.5 rounded-full border uppercase tracking-wider text-[10px] bg-slate-50 border-slate-200 text-slate-700`}>
                                                    {orgProfile.status}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Form Fields */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                        <div className="space-y-2">
                                            <label className="text-[13px] font-bold tracking-tight text-slate-700">Organization Name</label>
                                            <input type="text" readOnly value={orgProfile.name} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 font-medium shadow-sm transition-all focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[13px] font-bold tracking-tight text-slate-700">Website</label>
                                            <input type="text" readOnly value={orgProfile.website || 'https://'} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 font-medium shadow-sm" />
                                        </div>
                                        <div className="col-span-1 md:col-span-2 space-y-2">
                                            <label className="text-[13px] font-bold tracking-tight text-slate-700">Allowed Email Domains <span className="text-slate-400 font-normal">(comma-separated)</span></label>
                                            <input type="text" readOnly placeholder="e.g. acme.com" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 font-medium shadow-sm" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[13px] font-bold tracking-tight text-slate-700">Your Region</label>
                                            <input type="text" readOnly value={orgProfile.region_id || 'Global'} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 font-medium shadow-sm capitalize" />
                                        </div>
                                    </div>

                                    <button className="bg-[#1f708a] hover:bg-[#165a71] text-white font-semibold py-2.5 px-6 rounded-xl text-sm transition-colors shadow-sm tracking-wide">
                                        Save Changes
                                    </button>

                                    {/* Stats Grid Footer */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-10 p-6 bg-slate-50 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-100/40 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

                                        <div className="p-2 border-r border-slate-200/60 last:border-0 relative z-10">
                                            <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Credits Available</div>
                                            <div className="text-2xl font-black text-slate-900 tabular-nums">{Number(orgProfile.total_credits || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}</div>
                                        </div>
                                        <div className="p-2 border-r border-slate-200/60 last:border-0 relative z-10">
                                            <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Effective Plan</div>
                                            <div className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                                {orgProfile.plan_name || 'Enterprise'}
                                                {orgProfile.sub_status === 'active' && <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>}
                                            </div>
                                        </div>
                                        <div className="p-2 relative z-10">
                                            <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Max Concurrency</div>
                                            <div className="text-2xl font-black text-slate-900 tabular-nums">{orgProfile.max_concurrency || '∞'}</div>
                                        </div>

                                        {/* Advanced Capability Constraints */}
                                        <h3 className="text-sm font-bold text-slate-900 mt-10 mb-4 flex items-center gap-2">
                                            <Lock size={16} className="text-slate-400" />
                                            Advanced Capabilities
                                        </h3>

                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
                                                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Max Agents</div>
                                                <div className="text-xl font-black text-slate-900">{orgProfile.max_agents || 0}</div>
                                            </div>
                                            <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
                                                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Max Members</div>
                                                <div className="text-xl font-black text-slate-900">{orgProfile.max_members || 0}</div>
                                            </div>
                                            <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
                                                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">API Rate Limit</div>
                                                <div className="text-xl font-black text-slate-900 flex items-center gap-1">{orgProfile.api_rate_limit || 0} <span className="text-[10px] text-slate-400">/ window</span></div>
                                            </div>
                                            <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
                                                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Call Recording</div>
                                                <div className="text-sm font-black mt-1">
                                                    {orgProfile.can_record_calls ?
                                                        <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-[10px] uppercase tracking-widest">Enabled</span> :
                                                        <span className="px-2 py-1 bg-rose-100 text-rose-700 rounded text-[10px] uppercase tracking-widest">Restricted</span>
                                                    }
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 mt-4">
                                            {orgProfile.limits?.api_access && (
                                                <div className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl relative overflow-hidden">
                                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#1f708a]"></div>
                                                    <Key size={16} className="text-[#1f708a]" />
                                                    <div>
                                                        <div className="text-xs font-bold text-slate-900">Programmatic API Access</div>
                                                        <div className="text-[10px] text-slate-500 font-medium">Enterprise API limits unlocked</div>
                                                    </div>
                                                </div>
                                            )}
                                            {orgProfile.limits?.Basic_analytics && (
                                                <div className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl relative overflow-hidden">
                                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"></div>
                                                    <Activity size={16} className="text-blue-500" />
                                                    <div>
                                                        <div className="text-xs font-bold text-slate-900">Advanced Telemetry</div>
                                                        <div className="text-[10px] text-slate-500 font-medium">Basic analytics pipeline active</div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                    </div>

                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center p-12 text-center h-64">
                                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4"><Building2 size={24} className="text-slate-400" /></div>
                                    <h3 className="text-lg font-bold text-slate-900">Organization Not Found</h3>
                                    <p className="text-sm text-slate-500 mt-2 max-w-sm mx-auto">We couldn't scrape an organization context boundary from your active nodes.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'Profile' && (
                    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700 ease-out">
                        <div>
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Profile</h1>
                            <p className="text-slate-500 mt-1 font-medium">Manage your personal information</p>
                        </div>

                        <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden p-8">
                            <div className="flex items-center gap-6 p-6 bg-slate-50 border border-slate-200 rounded-2xl mb-8">
                                <div className="w-16 h-16 rounded-full bg-[#0a8698] flex items-center justify-center text-white shadow-sm shrink-0">
                                    <UserIcon size={32} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900">{userProfile?.name || 'Administrator'}</h2>
                                    <p className="text-slate-500 text-sm font-medium">{userProfile?.email || 'admin@aotms.com'}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                                <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Mail size={16} className="text-[#0a8698]" />
                                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Email</span>
                                    </div>
                                    <div className="text-sm font-medium text-slate-900">{userProfile?.email || 'N/A'}</div>
                                </div>
                                <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm">
                                    <div className="flex items-center gap-2 mb-2">
                                        <ShieldCheck size={16} className="text-[#0a8698]" />
                                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Role</span>
                                    </div>
                                    <div>
                                        <span className="px-3 py-1 bg-sky-100 text-sky-700 text-[10px] font-black tracking-widest uppercase rounded-full">
                                            {userProfile?.role?.toUpperCase() || 'CUSTOMER'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="border border-slate-200 rounded-2xl p-8 bg-slate-50/50 shadow-sm relative">
                                <h3 className="text-lg font-bold text-slate-900 mb-6">Edit Profile</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-700">Full Name</label>
                                        <input type="text" defaultValue={userProfile?.name || ''} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 font-medium shadow-sm transition-all focus:border-[#0a8698] focus:ring-4 focus:ring-[#0a8698]/10" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-700">Phone</label>
                                        <input type="text" defaultValue={userProfile?.phone || ''} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 font-medium shadow-sm transition-all focus:border-[#0a8698] focus:ring-4 focus:ring-[#0a8698]/10" />
                                    </div>
                                </div>
                                <button className="w-full md:w-auto bg-[#0a8698] hover:bg-[#076876] text-white font-bold py-3 px-8 rounded-xl text-sm transition-colors shadow-sm tracking-wide">
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'API Keys' && isAdmin && (
                    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700 ease-out">
                        <div>
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight">API Configuration</h1>
                            <p className="text-slate-500 mt-1 font-medium">Manage your Ravan.ai Enterprise Identity Bonds</p>
                        </div>
                        <form onSubmit={handleSaveApiConfig} className="bg-white rounded-3xl border border-slate-200/60 shadow-sm p-8 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-[#1f708a]"></div>
                            <h3 className="text-lg font-bold text-slate-900 mb-6">Ravan Native Credentials</h3>

                            <div className="grid grid-cols-1 gap-6 mb-8">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-700 uppercase tracking-widest">Target Organization ID</label>
                                    <input
                                        type="text"
                                        name="ravan_org_id"
                                        defaultValue={userProfile?.ravan_org_id || ''}
                                        placeholder="Organization UUID"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 font-mono focus:outline-none focus:ring-4 focus:ring-[#0a8698]/10 focus:border-[#0a8698] transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-700 uppercase tracking-widest">Root Authentication Token (X-Api-Key)</label>
                                    <input
                                        type="text"
                                        name="ravan_api_key"
                                        defaultValue={userProfile?.ravan_api_key || ''}
                                        placeholder="sk-xxxxxxxx"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 font-mono focus:outline-none focus:ring-4 focus:ring-[#0a8698]/10 focus:border-[#0a8698] transition-all"
                                    />
                                    <p className="text-[10px] text-slate-500 mt-3 font-medium border-l-2 border-indigo-500 pl-3">This key acts as the secure proxy bridge to decrypt your Organization's multi-tenant bounds in real-time. It completely overrides global .env configurations.</p>
                                </div>
                            </div>

                            <button type="submit" className="w-full md:w-auto bg-slate-900 hover:bg-black text-white font-bold py-3 px-8 rounded-xl text-sm transition-colors shadow-sm tracking-wide">
                                Save Native Configuration
                            </button>
                        </form>
                    </div>
                )}

                {activeTab === 'Billing' && (
                    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700 ease-out">
                        <div>
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Billing</h1>
                            <p className="text-slate-500 mt-1 font-medium">Manage organization credits and enterprise caps</p>
                        </div>

                        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 overflow-hidden">
                            <div className="flex gap-4 items-center">
                                <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="text-sm font-medium text-slate-500 mb-2">Credits</div>
                                    <div className="text-xl font-bold text-slate-900">{orgProfile?.total_credits || 0}</div>
                                </div>

                                <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="text-sm font-medium text-slate-500 mb-2">Plan</div>
                                    <div className="text-xl font-bold text-slate-900">{orgProfile?.plan_name || 'Enterprise'}</div>
                                </div>

                                <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="text-sm font-medium text-slate-500 mb-2">Max Concurrency</div>
                                    <div className="text-xl font-bold text-slate-900">{orgProfile?.max_concurrency || 0}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Fallback for other tabs */}
                {activeTab !== 'Organization' && activeTab !== 'Profile' && activeTab !== 'Billing' && (activeTab !== 'API Keys' || !isAdmin) && (
                    <div className="h-full flex items-center justify-center flex-col animate-in fade-in zoom-in-95 duration-500">
                        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6 shadow-sm border border-slate-200">
                            <Lock size={32} className="text-slate-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">{activeTab} Settings</h2>
                        <p className="text-slate-500 text-center max-w-md font-medium">This architectural tab is currently under construction. Infrastructure mapping for {activeTab} will be deployed soon.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
