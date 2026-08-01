import { MainLayout } from '../components/layout/MainLayout';
import { Bot, Loader2, Circle, Cpu, Mic, Clock, Calendar, Pause, Search, Plus, MoreHorizontal, Copy, Trash2, Edit } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { apiClient } from '../api/client';

export function Agents() {
    const [activeTab, setActiveTab] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [agentsList, setAgentsList] = useState<any[]>([]);
    const [agentQuota, setAgentQuota] = useState<number>(1);
    const [loading, setLoading] = useState(true);
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
    const [agentToDelete, setAgentToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Provisioning State
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [newAgentName, setNewAgentName] = useState("");
    const [newAgentPrompt, setNewAgentPrompt] = useState("");

    const navigate = useNavigate();

    const fetchAgents = async () => {
        try {
            setLoading(true);
            const response = await apiClient.get('/agents/');
            const rawData = response.data;
            let extractedArray: any[] = [];

            if (Array.isArray(rawData)) {
                extractedArray = rawData;
            } else if (rawData?.success) {
                if (Array.isArray(rawData.data)) {
                    extractedArray = rawData.data;
                } else if (rawData.data && typeof rawData.data === 'object') {
                    const possibleArrays = Object.values(rawData.data).filter(val => Array.isArray(val));
                    if (possibleArrays.length > 0) {
                        extractedArray = possibleArrays[0] as any[];
                    }
                }
            }

            const meRes = await apiClient.get('/auth/me').catch(() => null);
            const user = meRes?.data;
            if (user) {
                let activeQuota = 1;
                if (typeof user.agent_quota === 'number' && user.agent_quota > 0) {
                    activeQuota = user.agent_quota;
                } else if (user.role === 'admin') {
                    activeQuota = 999;
                }
                setAgentQuota(activeQuota);

                // Backend natively scopes and limits results fully unconditionally, no frontend override filtering needed!
            }

            setAgentsList(extractedArray);
        } catch (error) {
            console.error("Failed to load backend Agents array", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAgents();
    }, []);

    // Utility to format ISO dates
    const formatDate = (isoString?: string) => {
        if (!isoString) return 'Unknown';
        try {
            const date = new Date(isoString.replace(' +0000 UTC', ''));
            return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }).format(date);
        } catch {
            return 'Unknown';
        }
    };

    // Advanced search and tab filtration
    const filteredAgents = agentsList.filter(agent => {
        // Tab Check
        if (activeTab === 'Active' && agent.status !== 'ACTIVE') return false;
        if (activeTab === 'Inactive' && agent.status === 'ACTIVE') return false;

        // Search Check
        if (searchQuery.trim() !== '') {
            const query = searchQuery.toLowerCase();
            const name = (agent.agentName || '').toLowerCase();
            if (!name.includes(query)) return false;
        }

        return true;
    });

    const executeDelete = async () => {
        if (!agentToDelete) return;
        setIsDeleting(true);

        try {
            // Delete directly from Ravan proxy backend route
            await apiClient.delete(`/agents/${agentToDelete}`);
            // Instant optimistic UI drop
            setAgentsList(prev => prev.filter(c => c.id !== agentToDelete));
            setActiveDropdown(null);
            setAgentToDelete(null);
        } catch (error) {
            console.error("Failed to delete Agent", error);
            toast.error("Failed to delete agent.");
        } finally {
            setIsDeleting(false);
        }
    };

    const togglePause = async (agentId: string, currentStatus: string) => {
        const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';

        try {
            // Optimistic UI update instantly
            setAgentsList(prev => prev.map(a => a.id === agentId ? { ...a, status: newStatus } : a));

            // Execute proxy network request
            await apiClient.patch(`/agents/${agentId}/status`, { status: newStatus });
        } catch (error) {
            console.error("Failed to toggle Agent status", error);
            // Revert state if failed
            setAgentsList(prev => prev.map(a => a.id === agentId ? { ...a, status: currentStatus } : a));
            toast.error("Failed to sync node status with Ravan.ai");
        }
    };

    const handleCreateAgent = async (e: React.FormEvent) => {
        e.preventDefault();
        // Forwarded to AgentBuilder natively!
    };

    return (
        <MainLayout>
            <div className="w-full bg-slate-50/50 rounded-2xl p-6 md:p-8 min-h-[85vh] flex flex-col">

                {/* Header Metrics */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 mb-2">
                            AOTMS Agents
                        </h1>
                        <p className="text-gray-500 text-sm md:text-base max-w-lg">
                            Manage your full fleet of voice intelligence nodes directly via Ravan.ai.
                        </p>
                    </div>

                    <div className="flex flex-col md:items-end gap-2 w-full md:w-auto">
                        <span className={`text-[12px] font-bold uppercase tracking-widest ${agentsList.length >= agentQuota ? 'text-red-500' : 'text-gray-400'}`}>
                            Agents Limits {agentsList.length}/{agentQuota} {agentsList.length >= agentQuota && '.. Upgrade'}
                        </span>
                        <button
                            onClick={() => agentsList.length >= agentQuota ? toast.error("Limits Reached.. Upgrade to spin up more nodes.") : navigate('/agents/new')}
                            className={`w-full md:w-auto px-6 py-3 text-white text-sm font-bold rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2 ${agentsList.length >= agentQuota ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                        >
                            <Plus size={18} /> New Agent
                        </button>
                    </div>
                </div>

                {/* Advanced Tab Bar */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-gray-200 pb-5 mb-8">
                    <div className="flex items-center gap-6">
                        {['All', 'Active', 'Inactive'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`text-sm font-bold pb-5 -mb-5 border-b-2 transition-colors ${activeTab === tab
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-800'
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Grid Layout Container */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-24 flex-1">
                        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-6" />
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Synchronizing with Ravan Node...</h3>
                    </div>
                ) : filteredAgents.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                        {filteredAgents.map(agent => (
                            <div key={agent.id} className="bg-white border border-gray-200 rounded-[24px] p-6 shadow-[0px_4px_20px_-8px_rgba(0,0,0,0.05)] flex flex-col relative transition-all hover:border-gray-300 hover:shadow-lg">
                                {/* Click Away Listener fallback for dropdown */}
                                {activeDropdown === agent.id && (
                                    <div className="fixed inset-0 z-10" onClick={() => setActiveDropdown(null)}></div>
                                )}

                                {/* Avatar & Header */}
                                <div
                                    className="flex items-center justify-between mb-5 cursor-pointer hover:bg-gray-50/50 p-2 -mx-2 rounded-xl transition-colors"
                                    onClick={() => navigate(`/agents/${agent.id}`)}
                                >
                                    <div className="flex items-center gap-3 w-full overflow-hidden">
                                        <div className="w-12 h-12 bg-blue-50/80 rounded-[14px] flex items-center justify-center border border-blue-100 shadow-inner shrink-0">
                                            <span className="text-blue-600 font-extrabold tracking-wider text-base">
                                                {agent.agentName ? (agent.agentName.substring(0, 1).toUpperCase() + 'A') : 'AI'}
                                            </span>
                                        </div>
                                        <div className="flex flex-col overflow-hidden">
                                            <h3 className="text-base font-bold text-gray-900 tracking-tight leading-tight truncate">
                                                {(agent.agentName || 'AI Assistant').split(' [HASH:')[0]}
                                            </h3>
                                            <span className="text-[11px] font-mono text-gray-400 truncate mt-0.5">{agent.id.split('-')[0]}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Live Status Badge Overlaid natively */}
                                <div className={`absolute top-6 right-6 flex items-center gap-1.5 px-2.5 py-1 rounded-full shrink-0 border ${agent.status === 'ACTIVE' ? 'bg-green-50 border-green-200' : 'bg-gray-100 border-gray-200'}`}>
                                    <Circle className={`w-2 h-2 ${agent.status === 'ACTIVE' ? 'text-green-500 fill-green-500 animate-pulse' : 'text-gray-500 fill-gray-500'}`} />
                                    <span className={`text-[10px] font-bold tracking-wide uppercase ${agent.status === 'ACTIVE' ? 'text-green-700' : 'text-gray-600'}`}>
                                        {agent.status === 'ACTIVE' ? 'Live' : 'Offline'}
                                    </span>
                                </div>

                                {/* Truncated Prompt Preview */}
                                <p className="text-gray-500 text-[12px] leading-relaxed line-clamp-2 mb-5 font-medium min-h-[36px]">
                                    {agent.prompt || 'No configuration prompt detected.'}
                                </p>

                                {/* Inner Data Layout Block */}
                                <div className="bg-gray-50/80 border border-gray-100 rounded-2xl p-3.5 flex flex-col gap-2.5 mb-5">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-gray-400">
                                            <Cpu className="w-3.5 h-3.5" />
                                            <span className="text-[12px] font-semibold text-gray-500">Model</span>
                                        </div>
                                        <span className="text-[12px] font-bold text-gray-900 max-w-[100px] truncate block text-right">{agent.model || 'Unknown'}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-gray-400">
                                            <Mic className="w-3.5 h-3.5" />
                                            <span className="text-[12px] font-semibold text-gray-500">Voice</span>
                                        </div>
                                        <span className="text-[12px] font-bold text-gray-900 max-w-[100px] truncate block text-right">{agent.voiceId || 'Unknown'}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-gray-400">
                                            <Bot className="w-3.5 h-3.5" />
                                            <span className="text-[12px] font-semibold text-gray-500">Agent name</span>
                                        </div>
                                        <span className="text-[12px] font-bold text-gray-900 max-w-[100px] truncate block text-right">{(agent.agentName || 'Unassigned').split(' [HASH:')[0]}</span>
                                    </div>
                                </div>

                                {/* Timestamps */}
                                <div className="flex flex-col gap-2 mb-6 px-1">
                                    <div className="flex items-center gap-2 text-gray-400">
                                        <Clock className="w-3 h-3" />
                                        <span className="text-[11.5px] font-medium text-gray-500">Updated:</span>
                                        <span className="text-[11.5px] font-semibold text-gray-600">{formatDate(agent.updatedAt)}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-400">
                                        <Calendar className="w-3 h-3" />
                                        <span className="text-[11.5px] font-medium text-gray-500">Created:</span>
                                        <span className="text-[11.5px] font-semibold text-gray-600">{formatDate(agent.createdAt)}</span>
                                    </div>
                                </div>

                                {/* Absolute Bottom Actions - Exactly matched layout constraints */}
                                <div className="flex items-center gap-2.5 mt-auto pt-2 border-t border-gray-100 relative">
                                    <button
                                        onClick={() => togglePause(agent.id, agent.status)}
                                        className="flex-1 flex items-center justify-center gap-2 py-2.5 mt-3 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl transition-colors shadow-sm"
                                    >
                                        {agent.status === 'ACTIVE' ? (
                                            <>
                                                <Pause className="w-3.5 h-3.5 text-gray-600" />
                                                <span className="text-gray-700 text-[12.5px] font-bold">Pause</span>
                                            </>
                                        ) : (
                                            <>
                                                <Circle className="w-3.5 h-3.5 text-blue-600 fill-blue-600" />
                                                <span className="text-gray-700 text-[12.5px] font-bold">Activate</span>
                                            </>
                                        )}
                                    </button>

                                    {/* Sub-menu Dropdown Trigger Block */}
                                    <div className="relative z-20">
                                        <button
                                            onClick={() => setActiveDropdown(activeDropdown === agent.id ? null : agent.id)}
                                            className="w-[42px] h-[40px] mt-3 flex items-center justify-center bg-white hover:bg-gray-50 border border-gray-200 rounded-xl transition-colors shrink-0 shadow-sm"
                                        >
                                            <MoreHorizontal className="w-4 h-4 text-gray-600" />
                                        </button>

                                        {/* Extremely Styled Dropdown Overlay */}
                                        {activeDropdown === agent.id && (
                                            <div className="absolute right-0 bottom-[50px] w-48 bg-white border border-gray-200 rounded-xl shadow-2xl py-2 flex flex-col z-50 transform origin-bottom-right">
                                                <button
                                                    onClick={() => navigate(`/agents/${agent.id}`)}
                                                    className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors text-left"
                                                >
                                                    <Edit className="w-4 h-4 text-blue-500" /> Edit Configuration
                                                </button>
                                                <div className="h-px bg-gray-100 my-1"></div>
                                                <button
                                                    onClick={() => {
                                                        setAgentToDelete(agent.id);
                                                        setActiveDropdown(null);
                                                    }}
                                                    className="flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 transition-colors text-left"
                                                >
                                                    <Trash2 className="w-4 h-4 text-red-600" /> Delete Agent
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 px-4 text-center border-2 border-dashed border-gray-200 rounded-xl bg-white flex-1">
                        <div className="w-16 h-16 bg-gray-50 border border-gray-200 rounded-full flex items-center justify-center mb-4 shadow-sm">
                            <Search size={24} className="text-gray-400" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">No agents found</h3>
                        <p className="text-gray-500 max-w-sm mx-auto mb-6 text-sm">
                            No Ravan.ai node configurations found matching this context. Adjust your search or click 'New Agent' to spin one up.
                        </p>
                    </div>
                )}

                {/* Native Custom Deletion Modal Layer */}
                {agentToDelete && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-gray-900/40 backdrop-blur-sm">
                        <div className="bg-white p-6 sm:p-8 rounded-[24px] shadow-2xl w-full max-w-md transform transition-all border border-gray-100 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-red-500"></div>

                            <div className="flex items-center justify-center w-16 h-16 bg-red-50 rounded-full mb-6 mx-auto sm:mx-0">
                                <Trash2 className="w-8 h-8 text-red-600" />
                            </div>

                            <h3 className="text-xl font-bold text-gray-900 mb-2 text-center sm:text-left">
                                Obliterate Agent Node?
                            </h3>
                            <p className="text-gray-500 text-sm leading-relaxed mb-8 text-center sm:text-left">
                                This action is irrevocable. It will permanently destroy the AI configuration, wipe associated analytics mappings, and immediately de-provision the node on Ravan.ai servers.
                            </p>

                            <div className="flex flex-col-reverse sm:flex-row gap-3 mt-4">
                                <button
                                    className="px-6 py-3 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 font-bold rounded-xl transition-colors sm:w-1/2 flex items-center justify-center"
                                    onClick={() => setAgentToDelete(null)}
                                    disabled={isDeleting}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="px-6 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors shadow-md sm:w-1/2 flex items-center justify-center gap-2"
                                    onClick={executeDelete}
                                    disabled={isDeleting}
                                >
                                    {isDeleting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Obliterating...
                                        </>
                                    ) : (
                                        "Confirm Deletion"
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}



            </div>
        </MainLayout>
    );
}
