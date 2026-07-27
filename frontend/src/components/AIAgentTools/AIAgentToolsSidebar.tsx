import { useState } from 'react';
import { Braces, Calendar, RefreshCw, Database, Volume2, PhoneCall, BarChart2, Link as LinkIcon, ChevronDown, Plus, Loader2 } from 'lucide-react';
import { apiClient } from '../../api/client';

interface AIAgentToolsSidebarProps {
    onOpenTransferModal: () => void;
}

export function AIAgentToolsSidebar({ onOpenTransferModal }: AIAgentToolsSidebarProps) {
    const [isFunctionsExpanded, setIsFunctionsExpanded] = useState(false);
    const [showFunctionDropdown, setShowFunctionDropdown] = useState(false);

    // Call Settings State
    const [isCallSettingsExpanded, setIsCallSettingsExpanded] = useState(false);
    const [availableNumbers, setAvailableNumbers] = useState<any[]>([]);
    const [fetchingNumbers, setFetchingNumbers] = useState(false);

    const fetchNumbers = async (country: string) => {
        setFetchingNumbers(true);
        try {
            const response = await apiClient.get(`/api/ravan/phone-numbers/available-numbers/${country}`);
            setAvailableNumbers(response.data.data || []);
        } catch (e) {
            console.error(e);
        }
        setFetchingNumbers(false);
    };

    return (
        <div className="w-full lg:w-[320px] 2xl:w-[380px] flex flex-col gap-3 shrink-0 transition-all overflow-y-auto">
            <div className="bg-white rounded-[20px] border border-gray-200 shadow-sm p-2 flex flex-col h-full">

                {/* Functions Item */}
                <div
                    onClick={() => setIsFunctionsExpanded(!isFunctionsExpanded)}
                    className="flex items-center justify-between p-3.5 hover:bg-slate-50 cursor-pointer rounded-xl transition-colors group"
                >
                    <div className="flex items-center gap-3">
                        <Braces size={18} className="text-gray-600 group-hover:text-blue-600 transition-colors" />
                        <span className="text-[14px] font-bold text-gray-800">Functions</span>
                        <span className="bg-gray-100 text-gray-500 text-[10px] font-bold px-2 py-0.5 rounded-full">2</span>
                    </div>
                    <ChevronDown size={16} className={`text-gray-400 transition-transform ${isFunctionsExpanded ? 'rotate-180' : ''}`} />
                </div>

                {isFunctionsExpanded && (
                    <div className="px-3 pb-3 flex flex-col gap-2 relative">
                        <button
                            onClick={() => setShowFunctionDropdown(!showFunctionDropdown)}
                            className="w-full flex items-center justify-center gap-2 py-2 bg-gray-50 hover:bg-gray-100 rounded-xl border border-dashed border-gray-300 text-sm font-bold text-gray-600 transition-colors relative z-10"
                        >
                            <Plus size={16} /> Add Function
                        </button>

                        {showFunctionDropdown && (
                            <div className="absolute top-12 left-3 right-3 bg-white rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] border border-gray-100 z-50 overflow-hidden transform transition-all">
                                <button className="w-full text-left px-4 py-3 hover:bg-slate-50 text-sm font-bold text-gray-700 flex items-center gap-3 border-b border-gray-50 transition-colors"><span className="text-lg leading-none">📞</span> End Call</button>
                                <button onClick={onOpenTransferModal} className="w-full text-left px-4 py-3 hover:bg-slate-50 text-sm font-bold text-gray-700 flex items-center gap-3 border-b border-gray-50 transition-colors"><span className="text-lg leading-none">⏩</span> Transfer Call</button>
                                <button className="w-full text-left px-4 py-3 hover:bg-slate-50 text-sm font-bold text-gray-700 flex items-center gap-3 border-b border-gray-50 transition-colors"><span className="text-lg leading-none">🔢</span> IVR/Press Digit</button>
                                <button className="w-full text-left px-4 py-3 hover:bg-slate-50 text-sm font-bold text-gray-700 flex items-center gap-3 transition-colors"><span className="text-lg leading-none">⚡</span> Custom Function</button>
                            </div>
                        )}
                    </div>
                )}
                <div className="h-px bg-gray-100 mx-4"></div>

                {/* Calendars */}
                <div className="flex items-center justify-between p-3.5 hover:bg-slate-50 cursor-pointer rounded-xl transition-colors group">
                    <div className="flex items-center gap-3">
                        <Calendar size={18} className="text-gray-600 group-hover:text-blue-600 transition-colors" />
                        <span className="text-[14px] font-bold text-gray-800">Calendars</span>
                    </div>
                    <ChevronDown size={16} className="text-gray-400" />
                </div>
                <div className="h-px bg-gray-100 mx-4"></div>

                {/* CRM Sync */}
                <div className="flex items-center justify-between p-3.5 hover:bg-slate-50 cursor-pointer rounded-xl transition-colors group">
                    <div className="flex flex-col">
                        <div className="flex items-center gap-3">
                            <RefreshCw size={18} className="text-gray-600 group-hover:text-blue-600 transition-colors" />
                            <span className="text-[14px] font-bold text-gray-800">CRM Sync</span>
                        </div>
                        <span className="text-[11px] text-gray-400 font-medium ml-8 mt-0.5">Connect a CRM to sync leads</span>
                    </div>
                    <ChevronDown size={16} className="text-gray-400" />
                </div>
                <div className="h-px bg-gray-100 mx-4"></div>

                {/* Knowledge Base */}
                <div className="flex items-center justify-between p-3.5 hover:bg-slate-50 cursor-pointer rounded-xl transition-colors group">
                    <div className="flex items-center gap-3">
                        <Database size={18} className="text-gray-600 group-hover:text-blue-600 transition-colors" />
                        <span className="text-[14px] font-bold text-gray-800">Knowledge Base</span>
                        <span className="bg-blue-50 text-blue-500 text-[10px] font-bold px-2 py-0.5 rounded-full bg-opacity-70">1</span>
                    </div>
                    <ChevronDown size={16} className="text-gray-400" />
                </div>
                <div className="h-px bg-gray-100 mx-4"></div>

                {/* Speech Settings */}
                <div className="flex items-center justify-between p-3.5 hover:bg-slate-50 cursor-pointer rounded-xl transition-colors group">
                    <div className="flex items-center gap-3">
                        <Volume2 size={18} className="text-gray-600 group-hover:text-blue-600 transition-colors" />
                        <span className="text-[14px] font-bold text-gray-800">Speech Settings</span>
                    </div>
                    <ChevronDown size={16} className="text-gray-400" />
                </div>
                <div className="h-px bg-gray-100 mx-4"></div>

                {/* Call Settings */}
                <div
                    onClick={() => setIsCallSettingsExpanded(!isCallSettingsExpanded)}
                    className="flex items-center justify-between p-3.5 hover:bg-slate-50 cursor-pointer rounded-xl transition-colors group"
                >
                    <div className="flex items-center gap-3">
                        <PhoneCall size={18} className="text-gray-600 group-hover:text-blue-600 transition-colors" />
                        <span className="text-[14px] font-bold text-gray-800">Call Settings</span>
                    </div>
                    <ChevronDown size={16} className={`text-gray-400 transition-transform ${isCallSettingsExpanded ? 'rotate-180' : ''}`} />
                </div>

                {isCallSettingsExpanded && (
                    <div className="px-4 pb-4">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-[11px] font-bold text-gray-500 uppercase">Available Phone Numbers</span>
                            <button onClick={() => fetchNumbers('US')} className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md hover:bg-blue-100 transition-colors flex items-center gap-1">
                                {fetchingNumbers ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />} Fetch US
                            </button>
                        </div>

                        <div className="flex flex-col gap-2 max-h-[150px] overflow-y-auto">
                            {availableNumbers.length === 0 && !fetchingNumbers && (
                                <div className="text-center p-3 text-[12px] text-gray-400 border border-dashed rounded-lg">No numbers fetched yet.</div>
                            )}
                            {availableNumbers.map((num, i) => (
                                <div key={i} className="flex flex-col p-2 bg-gray-50 rounded-lg border border-gray-100 hover:border-blue-200 transition-colors cursor-pointer shadow-sm">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[13px] font-bold text-gray-800 tracking-tight">{num.phoneNumber || num.phone_number}</span>
                                        <span className="text-[10px] font-bold text-slate-600 bg-slate-200/50 px-1.5 py-0.5 rounded">{num.isoCountry || num.iso_country}</span>
                                    </div>
                                    <span className="text-[10px] text-gray-500 font-medium">Inbound: ${num.perMinutePriceInbound ?? num.per_minute_price_inbound}/min • Outbound: ${num.perMinutePriceOutbound ?? num.per_minute_price_outbound}/min</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                <div className="h-px bg-gray-100 mx-4"></div>

                {/* Post Call */}
                <div className="flex items-center justify-between p-3.5 hover:bg-slate-50 cursor-pointer rounded-xl transition-colors group">
                    <div className="flex items-center gap-3">
                        <BarChart2 size={18} className="text-gray-600 group-hover:text-blue-600 transition-colors" />
                        <span className="text-[14px] font-bold text-gray-800">Post-Call Data Extraction</span>
                        <span className="bg-green-100 text-green-700 text-[11px] font-bold px-2.5 py-0.5 rounded-full">On</span>
                    </div>
                    <ChevronDown size={16} className="text-gray-400" />
                </div>
                <div className="h-px bg-gray-100 mx-4"></div>

                {/* Webhook Settings */}
                <div className="flex items-center justify-between p-3.5 hover:bg-slate-50 cursor-pointer rounded-xl transition-colors group">
                    <div className="flex items-center gap-3">
                        <LinkIcon size={18} className="text-gray-600 group-hover:text-blue-600 transition-colors" />
                        <span className="text-[14px] font-bold text-gray-800">Webhook Settings</span>
                    </div>
                    <ChevronDown size={16} className="text-gray-400" />
                </div>

            </div>
        </div>
    );
}
