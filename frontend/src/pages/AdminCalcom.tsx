import React, { useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import { Calendar, Globe, Key, Settings, Loader2 } from 'lucide-react';
import { MainLayout } from '../components/layout/MainLayout';

interface CalcomConfig {
    id: number;
    agent_id: string;
    api_key: string;
    event_id: string;
    timezone: string;
    created_at: string;
}

export default function AdminCalcom() {
    const [configs, setConfigs] = useState<CalcomConfig[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchConfigs = async () => {
            try {
                const response = await apiClient.get('/api/appointments/calcom-config');
                setConfigs(response.data);
            } catch (error) {
                console.error("Failed to fetch Cal.com configs:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchConfigs();
    }, []);

    return (
        <MainLayout>
            <div className="p-8 max-w-7xl mx-auto flex flex-col h-full overflow-hidden">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Cal.com Integrations</h1>
                        <p className="text-sm font-medium text-gray-500 mt-1">Admin Panel: View Customer API Keys and Timezones</p>
                    </div>
                    <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100">
                        <Calendar size={18} className="text-blue-600" />
                        <span className="text-[13px] font-bold text-gray-700">{configs.length} Active Configs</span>
                    </div>
                </div>

                <div className="flex-1 overflow-auto custom-scrollbar">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center p-20">
                            <Loader2 size={32} className="animate-spin text-blue-500 mb-4" />
                            <p className="text-[14px] font-semibold text-gray-500">Loading configurations...</p>
                        </div>
                    ) : configs.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
                            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-100">
                                <Settings size={28} className="text-blue-500" />
                            </div>
                            <h3 className="text-[16px] font-bold text-gray-800">No Customers Linked Yet</h3>
                            <p className="text-[13px] font-medium text-gray-500 mt-2">When users configure Cal.com in their Agent Builder, they will appear here.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {configs.map((config) => (
                                <div key={config.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow group">
                                    <div className="p-5 border-b border-gray-50 bg-gray-50/50">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 shrink-0">
                                                <Calendar size={18} strokeWidth={2.5} />
                                            </div>
                                            <div className="min-w-0">
                                                <h3 className="text-[14px] font-bold text-gray-900 truncate">Agent: {config.agent_id}</h3>
                                                <p className="text-[11px] font-semibold text-gray-500 truncate">Config ID: #{config.id}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-5 space-y-4">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <Key size={14} className="text-gray-400" />
                                                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">API Key</span>
                                            </div>
                                            <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-100 font-mono text-[11px] text-gray-700 truncate w-full" title={config.api_key}>
                                                {config.api_key}
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Calendar size={13} className="text-gray-400" />
                                                    <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Event ID</span>
                                                </div>
                                                <div className="text-[13px] font-bold text-gray-800">
                                                    {config.event_id}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Globe size={13} className="text-gray-400" />
                                                    <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Timezone</span>
                                                </div>
                                                <div className="text-[13px] font-bold text-blue-600">
                                                    {config.timezone}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </MainLayout>
    );
}
