import React, { useEffect, useState } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import { apiClient } from '../api/client';
import { Building2, AlertTriangle, Loader2, ChevronDown, ChevronUp, CheckCircle2, Globe, Activity, Shield, Coins, Users, Rocket, Target, Zap } from 'lucide-react';
import toast from 'react-hot-toast';

export function OrganizationSettings() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [expandedLimits, setExpandedLimits] = useState(false);

    useEffect(() => {
        const fetchOrganization = async () => {
            try {
                setLoading(true);
                setError(null);

                const response = await apiClient.get('/api/ravan/organization');
                setData(response.data);
            } catch (err: any) {
                console.error("Failed to fetch organization Profile:", err);
                // Handle 401, 403, 404, 500
                const errorMessage = err.response?.data?.detail || "An unexpected error occurred while connecting to Ravan API.";
                setError(errorMessage);
                toast.error(errorMessage);
            } finally {
                setLoading(false);
            }
        };

        fetchOrganization();
    }, []);

    const renderCard = (title: string, value: any, icon: React.ReactNode) => (
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col gap-2 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-500 uppercase tracking-wider">
                {icon}
                <span>{title}</span>
            </div>
            <div className="text-xl font-bold text-gray-900 truncate">
                {value === true ? <CheckCircle2 className="text-green-500 mt-1" /> : value === false ? <Shield className="text-red-500 mt-1" /> : (value || 'N/A')}
            </div>
        </div>
    );

    return (
        <MainLayout>
            <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700 ease-out">

                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                        <Building2 className="w-8 h-8 text-blue-600" />
                        Organization Settings
                    </h1>
                    <p className="text-gray-500 mt-1 sm:text-lg">Manage your root enterprise profile and hardware capacities.</p>
                </div>

                {loading ? (
                    <div className="h-64 flex flex-col justify-center items-center gap-4 bg-white rounded-3xl border border-gray-200 shadow-sm">
                        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                        <div className="text-gray-500 font-medium">Authenticating directly with Ravan backend...</div>
                    </div>
                ) : error ? (
                    <div className="bg-red-50/50 border border-red-200 rounded-3xl p-8 flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                            <AlertTriangle className="w-8 h-8 text-red-600" />
                        </div>
                        <h2 className="text-xl font-bold text-red-900 mb-2">Connection Rejected</h2>
                        <p className="text-red-700 max-w-lg mb-6">{error}</p>
                        <button onClick={() => window.location.reload()} className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl shadow-sm transition-colors cursor-pointer">
                            Try Again
                        </button>
                    </div>
                ) : !data ? (
                    <div className="h-64 flex flex-col justify-center items-center bg-white rounded-3xl border border-gray-200 shadow-sm text-gray-500">
                        No organization data could be found for this profile.
                    </div>
                ) : (
                    <div className="space-y-8">
                        {/* Core Details Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                            {renderCard("Organization Name", data.name, <Building2 className="w-4 h-4" />)}
                            {renderCard("Plan Name", data.plan_name, <Rocket className="w-4 h-4" />)}
                            {renderCard("Status", data.status, <Activity className="w-4 h-4" />)}
                            {renderCard("Total Credits", data.total_credits, <Coins className="w-4 h-4" />)}
                            {renderCard("Max Credits", data.max_credits, <Target className="w-4 h-4" />)}
                            {renderCard("Max Agents", data.max_agents, <Zap className="w-4 h-4" />)}
                            {renderCard("Max Members", data.max_members, <Users className="w-4 h-4" />)}
                            {renderCard("Max Concurrency", data.max_concurrency, <Activity className="w-4 h-4" />)}
                            {renderCard("Website", data.website, <Globe className="w-4 h-4" />)}
                            {renderCard("Region", data.region_id, <Globe className="w-4 h-4" />)}
                            {renderCard("API Access", data.can_use_api, <Shield className="w-4 h-4" />)}
                            {renderCard("Call Recording", data.can_record_calls, <Shield className="w-4 h-4" />)}
                            {renderCard("Analytics Dashboard", data.limits?.Basic_analytics, <Activity className="w-4 h-4" />)}
                        </div>

                        {/* Expandable Limits Context */}
                        <div className="bg-white border text-left border-gray-200 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                            <button
                                onClick={() => setExpandedLimits(!expandedLimits)}
                                className="w-full flex items-center justify-between p-6 bg-slate-50 hover:bg-slate-100 transition-colors border-b border-gray-200 cursor-pointer"
                            >
                                <div className="flex flex-col text-left">
                                    <h3 className="text-lg font-bold text-gray-900">Advanced Feature Limits</h3>
                                    <p className="text-sm text-gray-500 font-medium">Expand to view detailed organizational constraints and boolean rules.</p>
                                </div>
                                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-200">
                                    {expandedLimits ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
                                </div>
                            </button>

                            {expandedLimits && (
                                <div className="p-6 bg-white animate-in slide-in-from-top-4 duration-300">
                                    <pre className="bg-slate-900 text-slate-50 p-6 rounded-2xl overflow-x-auto text-sm font-mono shadow-inner">
                                        {JSON.stringify(data.limits, null, 2)}
                                    </pre>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </MainLayout>
    );
}
