import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { MainLayout } from '../components/layout/MainLayout';
import { AIAgentToolsSidebar } from '../components/AIAgentTools/AIAgentToolsSidebar';
import { apiClient } from '../api/client';
import { RoomEvent } from 'livekit-client';
import { Loader2, ArrowLeft, Save, Bot, Cpu, Mic, Settings, Play, X, Search, AudioLines, Square, Info, PhoneCall, ChevronDown, Globe, Phone, Plus, MessageSquare, MicOff, PhoneOff, Volume2, Braces } from 'lucide-react';
import { LiveKitRoom, useLocalParticipant, useConnectionState, useRoomContext, RoomAudioRenderer } from '@livekit/components-react';
import '@livekit/components-styles';

function WebCallActiveUI({ resetTestCall }: { resetTestCall: () => void }) {
    const { isMicrophoneEnabled, localParticipant } = useLocalParticipant();
    const state = useConnectionState();
    const room = useRoomContext();
    const [transcripts, setTranscripts] = useState<{ id: string, speaker: string, text: string }[]>([]);

    useEffect(() => {
        if (!room) return;
        const handleTranscription = (segments: any[], participant: any, publication: any) => {
            setTranscripts(prev => {
                let updated = [...prev];
                segments.forEach((segment: any) => {
                    if (!segment.text.trim()) return;
                    const speaker = participant?.identity === room.localParticipant.identity ? 'User' : 'Agent';
                    const idx = updated.findIndex(t => t.id === segment.id);
                    if (idx !== -1) {
                        updated[idx] = { ...updated[idx], text: segment.text };
                    } else {
                        updated.push({ id: segment.id, speaker, text: segment.text });
                    }
                });
                return updated;
            });
        };
        room.on(RoomEvent.TranscriptionReceived, handleTranscription);
        return () => { room.off(RoomEvent.TranscriptionReceived, handleTranscription); };
    }, [room]);

    return (
        <div className="flex flex-col items-center justify-center p-8 bg-white min-h-[480px]">
            {/* Active State Ring with AI Loader */}

            {/* Transcriptions Accordion (Wiped clean mapping live feeds) */}
            <div className="w-full border border-gray-100 rounded-xl overflow-hidden mb-6 shadow-sm mt-8">
                <div className="bg-gray-50 p-3.5 flex items-center justify-between cursor-default border-b border-gray-100">
                    <div className="flex items-center gap-2">
                        <MessageSquare size={14} className="text-gray-400" />
                        <span className="text-[12px] font-medium text-gray-600">Transcription Stream</span>
                        {state === 'connected' && <span className="w-2 h-2 bg-[#0a8ea0] rounded-full animate-pulse shadow-[0_0_5px_#0a8ea0]"></span>}
                        {transcripts.length > 0 && <span className="px-1.5 py-0.5 bg-gray-200 text-gray-600 rounded text-[9px] font-bold ml-1">{transcripts.length}</span>}
                    </div>
                </div>
                <div className="p-4 bg-white h-40 overflow-y-auto w-full flex flex-col gap-2">
                    {state !== 'connected' && transcripts.length === 0 && (
                        <div className="w-full text-center text-[11px] text-gray-400 font-medium uppercase tracking-widest mt-12">Establishing bridge context...</div>
                    )}

                    {state === 'connected' && transcripts.length === 0 && (
                        <div className="w-full text-center text-[11px] text-gray-400 font-medium uppercase tracking-widest mt-12 animate-pulse">Listening to neural verbal feed...</div>
                    )}

                    {transcripts.map(t => (
                        <div key={t.id} className={`p-3 rounded-lg text-[13px] font-medium max-w-[85%] border shadow-sm ${t.speaker === 'User' ? 'bg-white border-gray-200 ml-auto text-gray-800' : 'bg-purple-50 border-purple-100 text-purple-800 mr-auto'}`}>
                            <span className="text-[9px] font-black uppercase tracking-widest block mb-1 opacity-60 flex items-center gap-1">
                                {t.speaker === 'User' ? <Mic size={10} /> : <Bot size={10} />} {t.speaker}
                            </span>
                            {t.text}
                        </div>
                    ))}
                </div>
            </div>

            {/* Hardware Controls */}
            <div className="flex items-center justify-center gap-4 w-full mt-auto pt-4">
                <button
                    onClick={() => localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled)}
                    className={`flex-1 flex justify-center items-center gap-2 px-4 py-2.5 bg-gray-50 border transition-colors rounded-xl text-[12px] font-bold ${!isMicrophoneEnabled ? 'border-red-200 bg-red-50 hover:bg-red-100 text-red-600' : 'border-gray-200 hover:bg-gray-100 text-gray-600'}`}
                >
                    {isMicrophoneEnabled ? <Mic size={14} /> : <MicOff size={14} />}
                    {isMicrophoneEnabled ? "Mute audio" : "Unmute audio"}
                </button>
                <button
                    onClick={() => { room.disconnect(); resetTestCall(); }}
                    className="flex-1 flex justify-center items-center gap-2 px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-[12px] font-bold border border-red-200 transition-colors shadow-sm"
                >
                    <PhoneOff size={14} /> End Call
                </button>
            </div>
        </div>
    );
}

export function AgentBuilder() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Core Agent State
    const [agentData, setAgentData] = useState<any>(null);
    const [prompt, setPrompt] = useState("");
    const [agentName, setAgentName] = useState("");
    const [voiceId, setVoiceId] = useState("");
    const toggleDayDefault: number[] = [1, 2, 3, 4, 5];
    const [modelId, setModelId] = useState("");
    const [startSpeaker, setStartSpeaker] = useState("agent");
    const [welcomeMessageType, setWelcomeMessageType] = useState<"dynamic" | "custom">("dynamic");
    const [beginMessage, setBeginMessage] = useState("");

    // Speech Configuration Settings
    const [ambientSound, setAmbientSound] = useState("none");
    const [ambientSoundVolume, setAmbientSoundVolume] = useState(1.0);
    const [reminderSeconds, setReminderSeconds] = useState(10);
    const [reminderMaxCount, setReminderMaxCount] = useState(2);
    const [reminderMessage, setReminderMessage] = useState("Hello, are you still there?");
    const [interruptionSensitivity, setInterruptionSensitivity] = useState(0.1);
    const [isSpeechSettingsSaving, setIsSpeechSettingsSaving] = useState(false);

    // Call Configuration Settings
    const [voicemailDetectionEnabled, setVoicemailDetectionEnabled] = useState(true);
    const [voicemailTimeout, setVoicemailTimeout] = useState(7); // seconds
    const [silenceTimeout, setSilenceTimeout] = useState(10); // seconds
    const [durationLimit, setDurationLimit] = useState(10); // minutes
    const [emergencyFallbackEnabled, setEmergencyFallbackEnabled] = useState(false);
    const [emergencyFallbackNumber, setEmergencyFallbackNumber] = useState("");
    const [ringDuration, setRingDuration] = useState(32); // seconds
    const [isCallSettingsSaving, setIsCallSettingsSaving] = useState(false);

    // Ravan Voices Architecture
    const [llmModels, setLlmModels] = useState<any[]>([]);
    const [voiceModalOpen, setVoiceModalOpen] = useState(false);
    const [voiceSearchQuery, setVoiceSearchQuery] = useState("");
    const [voiceGenderFilter, setVoiceGenderFilter] = useState("All");

    // Functions/Modal State
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [transferToolData, setTransferToolData] = useState<any>(null);
    const [loadingTransferTool, setLoadingTransferTool] = useState(false);

    const [showEndCallModal, setShowEndCallModal] = useState(false);
    const [endCallData, setEndCallData] = useState({ name: '', description: '', execution_msg: '' });

    const [showIVRModal, setShowIVRModal] = useState(false);
    const [ivrData, setIvrData] = useState({ name: '', description: '', pause_ms: 1000 });

    // Audio Playback State Management
    const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Sandbox Webcall Engine mapping
    const [webCallLoading, setWebCallLoading] = useState(false);
    const [activeTestRoomUrl, setActiveTestRoomUrl] = useState('');
    const [activeTestRoomToken, setActiveTestRoomToken] = useState('');
    const [activeCallSessionId, setActiveCallSessionId] = useState<string | null>(null);

    // Exact Screenshot UI states
    const [testCallMode, setTestCallMode] = useState<'web' | 'phone'>('phone');
    const [testCallState, setTestCallState] = useState<'idle' | 'calling' | 'active'>('idle');
    const [testCallFrom, setTestCallFrom] = useState('');
    const [testCallTo, setTestCallTo] = useState('');
    const [promptVars, setPromptVars] = useState<{ key: string, value: string }[]>([]);
    const [metaVars, setMetaVars] = useState<{ key: string, value: string }[]>([]);

    const resetTestCall = () => {
        if (activeCallSessionId) {
            // Guarantee a final sync on hard reset
            apiClient.post(`/calling/finalize-session/${activeCallSessionId}`).catch(() => { });
        }
        setTestCallState('idle');
        setActiveTestRoomUrl('');
        setActiveTestRoomToken('');
        setActiveCallSessionId(null);
        setWebCallLoading(false);
        setPromptVars([]);
        setMetaVars([]);
    };

    // Auto-polling mechanism to finalize calls immediately and stop efficiently
    useEffect(() => {
        let pollInterval: ReturnType<typeof setInterval>;
        if (testCallState === 'active' && activeCallSessionId) {
            pollInterval = setInterval(async () => {
                try {
                    const res = await apiClient.post(`/calling/finalize-session/${activeCallSessionId}`);
                    const data = res.data?.data;
                    const status = (data?.status || '').toLowerCase();
                    // Stop polling and update UI locally when disconnect occurs naturally
                    if (['ended', 'completed', 'failed', 'no_answer', 'error'].includes(status)) {
                        clearInterval(pollInterval);
                        toast.success("Call fully synchronized natively to dashboard history.");
                        resetTestCall();
                    }
                } catch (e) {
                    console.error("Silent polling parse error:", e);
                }
            }, 5000);
        }
        return () => { if (pollInterval) clearInterval(pollInterval); };
    }, [testCallState, activeCallSessionId]);

    const [agentTools, setAgentTools] = useState<any[]>([]);
    const [submittingTool, setSubmittingTool] = useState<string | null>(null);
    const [editingToolId, setEditingToolId] = useState<string | null>(null);

    const handleDeleteTool = async (toolId: string) => {
        try {
            await apiClient.delete(`/tools/${toolId}`);
            toast.success("Tool removed successfully");
            await fetchAgentTools();
        } catch (err) {
            toast.error("Failed to delete tool");
        }
    };

    const handleToggleTool = async (toolId: string, currentlyDisabled: boolean) => {
        try {
            await apiClient.patch(`/tools/${toolId}`, { disabled: !currentlyDisabled });
            toast.success(currentlyDisabled ? "Tool enabled" : "Tool disabled");
            await fetchAgentTools();
        } catch (err) {
            toast.error("Failed to toggle tool status");
        }
    };

    const handleEditTool = (tool: any) => {
        setEditingToolId(tool.id);
        if (tool.type === 'end_call') {
            setEndCallData({
                name: tool.name || "",
                description: tool.description || "",
                execution_msg: tool.definition?.execution_msg || ""
            });
            setShowEndCallModal(true);
        } else if (tool.type === 'press_digit') {
            setIvrData({
                name: tool.name || "",
                description: tool.description || "",
                pause_ms: tool.definition?.pause_ms || 1000
            });
            setShowIVRModal(true);
        } else if (tool.type === 'transfer_call') {
            setTransferToolData({ data: tool });
            setShowTransferModal(true);
        } else {
            toast("You can now safely edit this form configuration.");
        }
    };

    const handleSaveCalendar = async (apiKey: string, eventId: string, timezone: string) => {
        try {
            setSubmittingTool('calendar');
            const payload = {
                agent_id: id,
                agentId: id,
                cal_api_key: apiKey,
                api_key: apiKey,
                apiKey: apiKey,
                event_type_id: Number(eventId),
                eventTypeId: Number(eventId),
                timezone: timezone
            };

            await apiClient.post('/calcom/appointments/manage', payload);

            // Store mapping locally for Admin Panel transparency capability
            await apiClient.post('/api/appointments/calcom-config', {
                agent_id: id,
                api_key: apiKey,
                event_id: eventId,
                timezone: timezone
            });

            toast.success("10 min Updated Your Agent..");
            await fetchAgentTools();
        } catch (error: any) {
            toast.error(error.response?.data?.detail || "Failed to push calendar setup");
        } finally {
            setSubmittingTool(null);
        }
    };

    const fetchAgentTools = async () => {
        if (id && id !== 'new') {
            try {
                const res = await apiClient.get(`/tools?agent_id=${id}`);
                setAgentTools(res.data?.data || []);
            } catch (err) {
                console.error("Failed to map tools", err);
            }
        }
    };

    useEffect(() => {
        fetchAgentTools();
    }, [id]);

    const submitEndCall = async () => {
        try {
            setSubmittingTool('end_call');
            const payload = {
                agentId: id,
                type: 'end_call',
                name: endCallData.name,
                description: endCallData.description,
                definition: { execution_msg: endCallData.execution_msg }
            };
            if (editingToolId) {
                await apiClient.patch(`/tools/${editingToolId}`, payload);
            } else {
                await apiClient.post('/tools', payload);
            }
            toast.success("Function successfully synced to Ravan.ai.");
            await fetchAgentTools();
            setShowEndCallModal(false);
            setEditingToolId(null);
        } catch (error: any) {
            toast.error(error.response?.data?.detail || "Failed to push function");
        } finally {
            setSubmittingTool(null);
        }
    };

    const submitIVR = async () => {
        try {
            setSubmittingTool('press_digit');
            const payload = {
                agentId: id,
                type: 'press_digit',
                name: ivrData.name,
                description: ivrData.description,
                definition: { pause_ms: ivrData.pause_ms }
            };
            if (editingToolId) {
                await apiClient.patch(`/tools/${editingToolId}`, payload);
            } else {
                await apiClient.post('/tools', payload);
            }
            toast.success("Function successfully synced to Ravan.ai.");
            await fetchAgentTools();
            setShowIVRModal(false);
            setEditingToolId(null);
        } catch (error: any) {
            toast.error(error.response?.data?.detail || "Failed to push function");
        } finally {
            setSubmittingTool(null);
        }
    };

    const submitTransferCall = async () => {
        try {
            setSubmittingTool('transfer_call');
            const dataDef = transferToolData?.data?.definition || {};
            const payload = {
                agentId: id,
                type: 'transfer_call',
                name: transferToolData?.data?.name || "transfer_call",
                description: transferToolData?.data?.description || "",
                definition: {
                    mode: dataDef.mode || "cold_transfer",
                    execution_msg: dataDef.execution_msg || "",
                    on_hold_music: dataDef.on_hold_music || false,
                    custom_prompt: dataDef.custom_prompt || false,
                    show_user_number: dataDef.show_user_number || false,
                    client_transfer_id: dataDef.client_transfer_id || "",
                    transfer_to_type: dataDef.transfer_to_type || "static",
                    phone_number: dataDef.phone_number || "",
                    timezone: dataDef.timezone || "",
                    start_time: dataDef.start_time || "",
                    end_time: dataDef.end_time || ""
                }
            };
            if (editingToolId) {
                await apiClient.patch(`/tools/${editingToolId}`, payload);
            } else {
                await apiClient.post('/tools', payload);
            }
            toast.success("Function successfully synced to Ravan.ai.");
            await fetchAgentTools();
            setShowTransferModal(false);
            setEditingToolId(null);
        } catch (error: any) {
            toast.error(error.response?.data?.detail || "Failed to push function");
        } finally {
            setSubmittingTool(null);
        }
    };

    const initializeTestWebCall = async () => {
        try {
            setWebCallLoading(true);
            const parsedPromptVars = promptVars.reduce((acc, curr) => { if (curr.key) acc[curr.key] = curr.value; return acc; }, {} as any);
            const parsedMetaVars = metaVars.reduce((acc, curr) => { if (curr.key) acc[curr.key] = curr.value; return acc; }, {} as any);

            const meRes = await apiClient.get('/auth/me').catch(() => null);
            const user = meRes?.data || null;

            const callPayload: any = {
                type: testCallMode === 'web' ? 'web_call' : 'outbound_call',
                agent_id: id,
                metadata: { source: "atm_dashboard_agent_test", ...parsedMetaVars },
                prompt_dynamic_variables: parsedPromptVars
            };

            if (testCallMode === 'phone') {
                callPayload.from_phone_number = testCallFrom;
                callPayload.to_phone_number = testCallTo;
            }

            const res = await apiClient.post('/calling/create-call', callPayload);
            const rawPayload = res.data;
            const targetPayload = rawPayload.data || rawPayload;

            if (rawPayload.success || targetPayload.access_token) {
                toast.success(testCallMode === 'web' ? "Webcall Instance Activated! Bridging WebRTC." : "Phone Call successfully initiated on remote target.");
                if (testCallMode === 'web') {
                    setActiveTestRoomUrl(targetPayload.url || '');
                    setActiveTestRoomToken(targetPayload.access_token || '');
                    setActiveCallSessionId(targetPayload.id || rawPayload.id || null);
                    setTestCallState('active');
                }
                console.log("LIVEKIT SESSION PAYLOAD GENERATED:", targetPayload);
            } else {
                toast.error(rawPayload.message || "Failed to initialize standard sandbox web call");
            }
        } catch (error: any) {
            console.error("Initiation Fault Sequence:", error);
            toast.error("Internal network proxy block resolving Call API Endpoint.");
        } finally {
            setWebCallLoading(false);
        }
    };

    // Clean up audio instantly if component unmounts or modal closes
    useEffect(() => {
        if (!voiceModalOpen && audioRef.current) {
            audioRef.current.pause();
            setPlayingVoiceId(null);
        }
    }, [voiceModalOpen]);

    const handleModelChange = (newModelId: string) => {
        setModelId(newModelId);
        const selectedModel = llmModels.find(m => m.id === newModelId);
        if (selectedModel && selectedModel.voices && selectedModel.voices.length > 0) {
            // Check if current voiceId is compatible with the new model
            const isCompatible = selectedModel.voices.some((v: any) => v.id === voiceId);
            if (!isCompatible) {
                const defaultVoice = selectedModel.voices[0];
                setVoiceId(defaultVoice.id);
                toast.success(`Voice changed to ${defaultVoice.voiceName} to match ${selectedModel.llmModel}`);
            }
        }
    };

    useEffect(() => {
        const fetchAgentDetails = async () => {
            try {
                setLoading(true);

                if (id === "new") {
                    // It's a completely new Agent shell. Only fetch the models structure!
                    const modelsRes = await apiClient.get('/agents/voices');
                    setLlmModels(modelsRes.data?.data || []);
                    setAgentData({});
                    setPrompt("");
                    setAgentName("Unnamed Agent");

                    // We can default select Iris and Agni Premium globally to match Ravan portal
                    const models = modelsRes.data?.data || [];
                    const premium = models.find((m: any) => m.llmModel === "Agni Premium");
                    if (premium) {
                        setModelId(premium.id);
                        const iris = premium.voices?.find((v: any) => v.voiceName?.toLowerCase() === "iris");
                        if (iris) setVoiceId(iris.id);
                    }
                } else {
                    // Parallel fetch Agent Details & Available LLM Models from our Proxy Route
                    const [agentRes, modelsRes] = await Promise.all([
                        apiClient.get(`/agents/${id}`),
                        apiClient.get('/agents/voices')
                    ]);

                    const data = agentRes.data?.data || agentRes.data;
                    setAgentData(data);
                    setPrompt(data.prompt || "");
                    setAgentName((data.agentName || "Unnamed Agent").split(" [HASH:")[0]);

                    // Hydrate Speech Settings
                    setAmbientSound(data.ambientSound || "none");
                    setAmbientSoundVolume(data.ambientSoundVolume !== undefined ? data.ambientSoundVolume : 1.0);
                    setReminderSeconds(data.reminderTriggerMs ? Math.floor(data.reminderTriggerMs / 1000) : 10);
                    setReminderMaxCount(data.reminderMaxCount !== undefined ? data.reminderMaxCount : 2);
                    setReminderMessage(data.reminderMessage || "");
                    setInterruptionSensitivity(data.interruptionSensitivity !== undefined ? data.interruptionSensitivity : 0.1);
                    setStartSpeaker(data.startSpeaker || "agent");
                    if (data.beginMessage) {
                        setWelcomeMessageType("custom");
                        setBeginMessage(data.beginMessage);
                    } else {
                        setWelcomeMessageType("dynamic");
                        setBeginMessage("");
                    }

                    // Hydrate Call Settings
                    const isVoicemailEnabled = data.voicemailDetectionTimeoutMs !== undefined ? data.voicemailDetectionTimeoutMs > 0 : true;
                    setVoicemailDetectionEnabled(isVoicemailEnabled);
                    setVoicemailTimeout(data.voicemailDetectionTimeoutMs ? Math.floor(data.voicemailDetectionTimeoutMs / 1000) : 7);
                    setSilenceTimeout(data.endcallOnSilenceDuration ? Math.floor(data.endcallOnSilenceDuration / 1000) : 10);
                    setDurationLimit(data.maxCallDurationMs ? Math.floor(data.maxCallDurationMs / 60000) : 10);
                    setEmergencyFallbackNumber(data.emergencyFallback || "");
                    setEmergencyFallbackEnabled(!!data.emergencyFallback);
                    setRingDuration(data.ringDurationMs ? Math.floor(data.ringDurationMs / 1000) : 32);

                    const serverModels = modelsRes.data?.data || [];
                    setLlmModels(serverModels);

                    // Re-Hydrate Ravan Strings ("Agni Premium", "Iris") back to UUIDs for Native HTML form element bindings!
                    let reHydratedModelId = "";
                    const incomingModelStr = data.model || data.s2sModel || data.llmModelId || "";
                    const matchedModel = serverModels.find((m: any) => m.llmModel === incomingModelStr || m.id === incomingModelStr);
                    if (matchedModel) reHydratedModelId = matchedModel.id;
                    setModelId(reHydratedModelId || (serverModels[0]?.id || ""));

                    let reHydratedVoiceId = "";
                    const incomingVoiceStr = data.voiceId || "";
                    serverModels.forEach((m: any) => {
                        const matchedVoice = m.voices?.find((v: any) => v.voiceName === incomingVoiceStr || v.id === incomingVoiceStr);
                        if (matchedVoice) reHydratedVoiceId = matchedVoice.id;
                    });
                    setVoiceId(reHydratedVoiceId);
                }

            } catch (error) {
                console.error("Failed to fetch agent deeply.", error);
            } finally {
                setLoading(false);
            }
        };
        fetchAgentDetails();
    }, [id]);

    const handleSave = async () => {
        try {
            setSaving(true);

            // Constructing string-literal based properties because Ravan explicitly demands text references!
            const structModelName = llmModels.find(m => m.id === modelId)?.llmModel || "Agni Premium";
            let structVoiceName = "Iris";
            for (const m of llmModels) {
                const voiceMatch = m.voices?.find((v: any) => v.id === voiceId);
                if (voiceMatch) {
                    structVoiceName = voiceMatch.voiceName;
                    break;
                }
            }

            let secureAgentName = agentName.trim();

            if (id === "new") {
                // Provision a net-new node onto Ravan grid dynamically
                const response = await apiClient.post('/agents/', {
                    agentName: secureAgentName,
                    prompt: prompt,
                    voiceId: structVoiceName,
                    model: structModelName,
                    s2sModel: structModelName,
                    ambientSound: ambientSound,
                    ambientSoundVolume: ambientSoundVolume,
                    reminderTriggerMs: reminderSeconds * 1000,
                    reminderMaxCount: reminderMaxCount,
                    reminderMessage: reminderMessage,
                    interruptionSensitivity: interruptionSensitivity,
                    voicemailDetectionTimeoutMs: voicemailDetectionEnabled ? voicemailTimeout * 1000 : 0,
                    endcallOnSilenceDuration: silenceTimeout * 1000,
                    maxCallDurationMs: durationLimit * 60000,
                    emergencyFallback: emergencyFallbackEnabled ? emergencyFallbackNumber : "",
                    ringDurationMs: ringDuration * 1000,
                    beginMessage: welcomeMessageType === "custom" ? beginMessage : "",
                    startSpeaker: startSpeaker
                });

                toast.success("Agent configuration fully deployed to Ravan.ai");
                const newId = response.data?.data?.id;
                if (newId) {
                    navigate(`/agents/${newId}`, { replace: true });
                }
            } else {
                // Existing entity, issue a patch instead. Ravan demands exact string literal mapping.
                await apiClient.patch(`/agents/${id}`, {
                    agentName: agentName,
                    prompt: prompt,
                    voiceId: structVoiceName,
                    model: structModelName,
                    s2sModel: structModelName,
                    status: 'ACTIVE',
                    ambientSound: ambientSound,
                    ambientSoundVolume: ambientSoundVolume,
                    reminderTriggerMs: reminderSeconds * 1000,
                    reminderMaxCount: reminderMaxCount,
                    reminderMessage: reminderMessage,
                    interruptionSensitivity: interruptionSensitivity,
                    voicemailDetectionTimeoutMs: voicemailDetectionEnabled ? voicemailTimeout * 1000 : 0,
                    endcallOnSilenceDuration: silenceTimeout * 1000,
                    maxCallDurationMs: durationLimit * 60000,
                    emergencyFallback: emergencyFallbackEnabled ? emergencyFallbackNumber : "",
                    ringDurationMs: ringDuration * 1000,
                    beginMessage: welcomeMessageType === "custom" ? beginMessage : "",
                    startSpeaker: startSpeaker
                });
                toast.success("Configuration successfully synced to Ravan.ai!");
            }
        } catch (error: any) {
            console.error("Error saving agent.", error);
            toast.error(error.response?.data?.detail || "Failed to sync configuration.");
        } finally {
            setSaving(false);
        }
    };

    const handleSaveSpeechSettings = async () => {
        try {
            setIsSpeechSettingsSaving(true);
            const structModelName = llmModels.find(m => m.id === modelId)?.llmModel || "Agni Premium";
            let structVoiceName = "Iris";
            for (const m of llmModels) {
                const voiceMatch = m.voices?.find((v: any) => v.id === voiceId);
                if (voiceMatch) {
                    structVoiceName = voiceMatch.voiceName;
                    break;
                }
            }

            if (id === "new") {
                await handleSave();
            } else {
                await apiClient.patch(`/agents/${id}`, {
                    agentName: agentName,
                    prompt: prompt,
                    voiceId: structVoiceName,
                    model: structModelName,
                    s2sModel: structModelName,
                    status: 'ACTIVE',
                    ambientSound: ambientSound,
                    ambientSoundVolume: ambientSoundVolume,
                    reminderTriggerMs: reminderSeconds * 1000,
                    reminderMaxCount: reminderMaxCount,
                    reminderMessage: reminderMessage,
                    interruptionSensitivity: interruptionSensitivity
                });
                toast.success("Speech Settings successfully synced to Ravan.ai!");
            }
        } catch (error: any) {
            console.error("Error saving speech settings.", error);
            toast.error(error.response?.data?.detail || "Failed to sync speech settings.");
        } finally {
            setIsSpeechSettingsSaving(false);
        }
    };

    const handleSaveCallSettings = async () => {
        try {
            setIsCallSettingsSaving(true);
            const structModelName = llmModels.find(m => m.id === modelId)?.llmModel || "Agni Premium";
            let structVoiceName = "Iris";
            for (const m of llmModels) {
                const voiceMatch = m.voices?.find((v: any) => v.id === voiceId);
                if (voiceMatch) {
                    structVoiceName = voiceMatch.voiceName;
                    break;
                }
            }

            if (id === "new") {
                await handleSave();
            } else {
                await apiClient.patch(`/agents/${id}`, {
                    agentName: agentName,
                    prompt: prompt,
                    voiceId: structVoiceName,
                    model: structModelName,
                    s2sModel: structModelName,
                    status: 'ACTIVE',
                    voicemailDetectionTimeoutMs: voicemailDetectionEnabled ? voicemailTimeout * 1000 : 0,
                    endcallOnSilenceDuration: silenceTimeout * 1000,
                    maxCallDurationMs: durationLimit * 60000,
                    emergencyFallback: emergencyFallbackEnabled ? emergencyFallbackNumber : "",
                    ringDurationMs: ringDuration * 1000
                });
                toast.success("Call Settings successfully synced to Ravan.ai!");
            }
        } catch (error: any) {
            console.error("Error saving call settings.", error);
            toast.error(error.response?.data?.detail || "Failed to sync call settings.");
        } finally {
            setIsCallSettingsSaving(false);
        }
    };

    // Flatten all voices for the modal grid, inject the llmModel name for reference
    const allVoices = llmModels.flatMap(m => m.voices?.map((v: any) => ({ ...v, modelName: m.llmModel })) || []);

    const filteredVoices = allVoices.filter(v => {
        const matchesSearch = v.voiceName?.toLowerCase().includes(voiceSearchQuery.toLowerCase());
        const matchesGender = voiceGenderFilter === "All" || v.gender?.toLowerCase() === voiceGenderFilter.toLowerCase();
        return matchesSearch && matchesGender;
    });

    const activeVoice = allVoices.find(v => v.id === voiceId) || null;
    const activeModel = llmModels.find(m => m.id === modelId) || null;

    const playPreview = (e: React.MouseEvent, voiceId: string, recordingUrl: string) => {
        e.stopPropagation();

        // If they click the same voice that is actively playing, safely Halt the playback
        if (playingVoiceId === voiceId && audioRef.current) {
            audioRef.current.pause();
            setPlayingVoiceId(null);
            return;
        }

        // Hard reset any existing audio streams
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }

        if (recordingUrl) {
            const audio = new Audio(recordingUrl);
            audioRef.current = audio;
            setPlayingVoiceId(voiceId);

            audio.onended = () => {
                setPlayingVoiceId(null);
            };

            audio.play().catch(e => {
                console.error("Audio block failed mapping", e);
                setPlayingVoiceId(null);
            });
        } else {
            toast.error("Digital Master preview not available for this legacy construct.");
        }
    }

    const handleOpenTransferModal = async () => {
        setShowTransferModal(true);
        setLoadingTransferTool(true);
        try {
            // Using the specific ID the user wants to test with
            const toolId = "019f8de0-7878-7be0-b159-ec80e7559a6b";
            const response = await apiClient.get(`/tools/${toolId}`);
            setTransferToolData(response.data);
        } catch (error) {
            console.error("Failed to fetch Transfer tool:", error);
            toast.error("Failed to load Transfer Call details from Ravan.ai.");
        } finally {
            setLoadingTransferTool(false);
        }
    };

    const [isEditingName, setIsEditingName] = useState(false);

    return (
        <MainLayout>
            <div className="w-full bg-slate-50/50 rounded-2xl p-6 md:p-8 min-h-[85vh] flex flex-col relative">

                {/* Header Action Row */}
                <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-200">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/agents')}
                            className="w-10 h-10 bg-white border border-gray-200 rounded-xl flex items-center justify-center hover:bg-gray-50 transition-colors shadow-sm shrink-0"
                        >
                            <ArrowLeft className="w-5 h-5 text-gray-600" />
                        </button>
                        <div>
                            <div className="flex items-center gap-3">
                                {isEditingName ? (
                                    <input
                                        type="text"
                                        autoFocus
                                        className="text-2xl font-black text-gray-900 tracking-tight bg-white border border-[#0a8ea0] rounded-lg px-2 py-1 outline-none w-64"
                                        value={agentName}
                                        onChange={(e) => setAgentName(e.target.value)}
                                        onBlur={() => setIsEditingName(false)}
                                        onKeyDown={(e) => { if (e.key === 'Enter') setIsEditingName(false); }}
                                    />
                                ) : (
                                    <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                                        {agentName}
                                    </h1>
                                )}
                                <button onClick={() => setIsEditingName(!isEditingName)} className="text-gray-400 hover:text-[#0a8ea0] transition-colors"><Settings size={16} /></button>
                            </div>
                            <span className="text-xs font-mono text-gray-400 mt-1 block">ID: {id}</span>
                        </div>
                    </div>

                    <button
                        onClick={handleSave}
                        disabled={loading || saving}
                        className="flex items-center gap-2 px-6 py-2.5 bg-gray-900 hover:bg-black text-white rounded-[10px] shadow-sm transition-colors text-sm font-bold tracking-wide shrink-0"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Save Configuration
                    </button>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-32 flex-1">
                        <div className="relative">
                            <div className="w-16 h-16 bg-white rounded-[18px] border border-gray-100 flex items-center justify-center shadow-lg relative z-10 overflow-hidden">
                                <img src="/atm-logo.jpeg" alt="Loading" className="w-full h-full object-cover animate-pulse" />
                            </div>
                            <div className="absolute inset-0 bg-blue-400 rounded-[18px] animate-ping opacity-20"></div>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mt-6 tracking-tight">Syncing Node Architecture...</h3>
                        <p className="text-gray-500 text-sm mt-2">Pulling nested Ravan.ai configuration data</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-6">

                        {/* Custom Configurations Navbar */}
                        <div className="bg-white rounded-[20px] border border-gray-200 shadow-sm px-6 py-4 flex flex-col md:flex-row items-center gap-6">

                            <div className="flex items-center gap-4 w-full md:w-auto">
                                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2 shrink-0">
                                    <Cpu size={14} /> Cognitive Model
                                </label>
                                <select
                                    value={modelId}
                                    onChange={(e) => handleModelChange(e.target.value)}
                                    className="w-full md:w-64 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                >
                                    <option value="" disabled>Select LLM Model Engine</option>
                                    {llmModels.map(m => (
                                        <option key={m.id} value={m.id}>{m.llmModel} {m.llmModel === 'Agni Premium' ? '(Recommended)' : ''}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="hidden md:block w-px h-8 bg-gray-200"></div>

                            <div className="flex items-center gap-4 w-full md:w-auto flex-1">
                                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2 shrink-0">
                                    <Mic size={14} /> Neural Voice
                                </label>
                                <button
                                    onClick={() => setVoiceModalOpen(true)}
                                    className="w-full md:max-w-sm px-4 py-2.5 bg-gray-50 border border-gray-200 hover:border-blue-300 rounded-xl flex items-center justify-between transition-colors shadow-sm group"
                                >
                                    <div className="flex items-center gap-3">
                                        {activeVoice?.imgUrl ? (
                                            <div className="w-7 h-7 rounded-full border border-gray-300 overflow-hidden relative shadow-sm animate-in fade-in">
                                                <img src={activeVoice.imgUrl} className="w-full h-full object-cover" alt={activeVoice.voiceName} />
                                                <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border border-white ${activeVoice.gender?.toLowerCase() === 'female' ? 'bg-pink-500' : 'bg-blue-500'}`}></div>
                                            </div>
                                        ) : (
                                            <div className="w-7 h-7 rounded-full bg-blue-105 flex items-center justify-center"><Mic size={12} className="text-blue-500" /></div>
                                        )}
                                        <div className="text-left flex flex-col">
                                            <span className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors tracking-tight">{activeVoice?.voiceName || "Select a Voice"}</span>
                                        </div>
                                    </div>
                                    <Settings size={14} className="text-gray-400 group-hover:text-blue-500 transition-colors" />
                                </button>
                            </div>

                        </div>

                        {/* Two Column Layout (Prompt Editor vs Settings) */}
                        <div className="flex flex-col lg:flex-row gap-6 xl:gap-8 pb-10 items-stretch min-h-[600px] h-full lg:h-[700px] xl:h-[800px]">
                            {/* Editor Column */}
                            <div className="flex-[2] min-w-[300px] bg-white rounded-3xl border border-gray-200 shadow-sm p-4 md:p-6 overflow-hidden flex flex-col h-full transition-all">
                                <div className="flex items-center justify-between mb-4 px-2">
                                    <div className="flex items-center gap-2">
                                        <span className="flex items-center justify-center w-2 h-2 rounded-full bg-green-500"></span>
                                        <span className="flex items-center justify-center w-2 h-2 rounded-full bg-yellow-400"></span>
                                        <span className="flex items-center justify-center w-2 h-2 rounded-full bg-red-400"></span>
                                        <span className="ml-3 text-xs font-bold text-gray-500 uppercase tracking-widest">System Prompt Base</span>
                                    </div>
                                    <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
                                        ~{Math.floor(prompt.length / 4)} Tokens
                                    </span>
                                </div>
                                <textarea
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    className="w-full h-full flex-1 p-2 md:p-4 text-[13px] md:text-[14px] leading-relaxed text-gray-700 bg-white border-0 font-medium whitespace-pre-wrap outline-none resize-none scroll-smooth placeholder-gray-300"
                                    placeholder="Design your AI Agent's core brain instructions here..."
                                    spellCheck={false}
                                />
                            </div>

                            {/* Middle Settings / Tools Column (Red Box Request) */}
                            <AIAgentToolsSidebar
                                onOpenTransferModal={handleOpenTransferModal}
                                onOpenEndCallModal={() => setShowEndCallModal(true)}
                                onOpenIVRModal={() => setShowIVRModal(true)}
                                agentTools={agentTools}
                                onDeleteTool={handleDeleteTool}
                                onToggleTool={handleToggleTool}
                                onEditTool={handleEditTool}
                                onSaveCalendar={handleSaveCalendar}
                                isCalendarSaving={submittingTool === 'calendar'}
                                ambientSound={ambientSound}
                                setAmbientSound={setAmbientSound}
                                ambientSoundVolume={ambientSoundVolume}
                                setAmbientSoundVolume={setAmbientSoundVolume}
                                reminderSeconds={reminderSeconds}
                                setReminderSeconds={setReminderSeconds}
                                reminderMaxCount={reminderMaxCount}
                                setReminderMaxCount={setReminderMaxCount}
                                reminderMessage={reminderMessage}
                                setReminderMessage={setReminderMessage}
                                interruptionSensitivity={interruptionSensitivity}
                                setInterruptionSensitivity={setInterruptionSensitivity}
                                onSaveSpeechSettings={handleSaveSpeechSettings}
                                isSpeechSettingsSaving={isSpeechSettingsSaving}
                                voicemailDetectionEnabled={voicemailDetectionEnabled}
                                setVoicemailDetectionEnabled={setVoicemailDetectionEnabled}
                                voicemailTimeout={voicemailTimeout}
                                setVoicemailTimeout={setVoicemailTimeout}
                                silenceTimeout={silenceTimeout}
                                setSilenceTimeout={setSilenceTimeout}
                                durationLimit={durationLimit}
                                setDurationLimit={setDurationLimit}
                                emergencyFallbackEnabled={emergencyFallbackEnabled}
                                setEmergencyFallbackEnabled={setEmergencyFallbackEnabled}
                                emergencyFallbackNumber={emergencyFallbackNumber}
                                setEmergencyFallbackNumber={setEmergencyFallbackNumber}
                                ringDuration={ringDuration}
                                setRingDuration={setRingDuration}
                                onSaveCallSettings={handleSaveCallSettings}
                                isCallSettingsSaving={isCallSettingsSaving}
                                startSpeaker={startSpeaker}
                                setStartSpeaker={setStartSpeaker}
                                welcomeMessageType={welcomeMessageType}
                                setWelcomeMessageType={setWelcomeMessageType}
                                beginMessage={beginMessage}
                                setBeginMessage={setBeginMessage}
                            />

                        </div>

                        {/* Test Agent Engine Component */}
                        <div className="mt-8 bg-white border border-gray-100 rounded-2xl shadow-sm flex flex-col relative max-w-[420px] mx-auto w-full mb-10 transition-all">
                            {/* Header */}
                            <div className="flex items-center justify-between p-4 border-b border-gray-100">
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-md bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                                        <Mic size={12} />
                                    </div>
                                    <span className="text-[13px] font-bold text-gray-900 tracking-tight">Test Agent</span>
                                </div>
                                <button onClick={resetTestCall} className="px-3 py-1 bg-white border border-[#0a8ea0] rounded text-[11px] font-bold text-[#0a8ea0] hover:bg-[#0a8ea0]/5 transition-colors">
                                    Reset
                                </button>
                            </div>

                            {testCallState === 'idle' ? (
                                <div className="p-4 flex flex-col flex-1 gap-4">
                                    <div className="flex bg-gray-100 p-1 rounded-xl">
                                        <button
                                            onClick={() => setTestCallMode('phone')}
                                            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${testCallMode === 'phone' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                                        >
                                            Phone Call
                                        </button>
                                        <button
                                            onClick={() => setTestCallMode('web')}
                                            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${testCallMode === 'web' ? 'bg-white shadow-sm text-[#0a8ea0]' : 'text-gray-500 hover:text-gray-700'}`}
                                        >
                                            Web Call
                                        </button>
                                    </div>
                                    
                                    {testCallMode === 'phone' && (
                                        <>
                                            <div>
                                                <label className="block text-[11px] font-bold text-gray-500 mb-1.5 uppercase tracking-widest">From Number</label>
                                                <input type="text" value={testCallFrom} onChange={(e) => setTestCallFrom(e.target.value)} placeholder="+1234567890" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:border-[#0a8ea0]" />
                                            </div>
                                            <div>
                                                <label className="block text-[11px] font-bold text-gray-500 mb-1.5 uppercase tracking-widest">To Number</label>
                                                <input type="text" value={testCallTo} onChange={(e) => setTestCallTo(e.target.value)} placeholder="+0987654321" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:border-[#0a8ea0]" />
                                            </div>
                                        </>
                                    )}

                                    <div className="border border-gray-100 rounded-xl p-4 bg-white">
                                        <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1.5 mb-3">{'{ }'} PROMPT VARIABLES</span>
                                        <div className="flex flex-col gap-2 mb-3">
                                            {promptVars.map((v, i) => (
                                                <div key={i} className="flex items-center gap-2">
                                                    <input type="text" placeholder="Key" value={v.key} onChange={e => { const n = [...promptVars]; n[i].key = e.target.value; setPromptVars(n); }} className="w-1/2 px-3 py-1.5 border border-gray-250 rounded text-xs focus:border-[#0a8ea0] outline-none" />
                                                    <input type="text" placeholder="Value" value={v.value} onChange={e => { const n = [...promptVars]; n[i].value = e.target.value; setPromptVars(n); }} className="w-1/2 px-3 py-1.5 border border-gray-250 rounded text-xs focus:border-[#0a8ea0] outline-none" />
                                                    <button onClick={() => setPromptVars(promptVars.filter((_, idx) => idx !== i))} className="text-gray-400 hover:text-red-500"><X size={14} /></button>
                                                </div>
                                            ))}
                                        </div>
                                        <button onClick={() => setPromptVars([...promptVars, { key: '', value: '' }])} className="flex items-center gap-1.5 px-3 py-1 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded text-[11px] font-bold text-gray-650 transition-colors">
                                            <Plus size={12} /> Add
                                        </button>
                                    </div>

                                    <div className="border border-gray-100 rounded-xl p-4 bg-white">
                                        <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1.5 mb-3">{'{ }'} METADATA</span>
                                        <div className="flex flex-col gap-2 mb-3">
                                            {metaVars.map((v, i) => (
                                                <div key={i} className="flex items-center gap-2">
                                                    <input type="text" placeholder="Key" value={v.key} onChange={e => { const n = [...metaVars]; n[i].key = e.target.value; setMetaVars(n); }} className="w-1/2 px-3 py-1.5 border border-gray-250 rounded text-xs focus:border-[#0a8ea0] outline-none" />
                                                    <input type="text" placeholder="Value" value={v.value} onChange={e => { const n = [...metaVars]; n[i].value = e.target.value; setMetaVars(n); }} className="w-1/2 px-3 py-1.5 border border-gray-250 rounded text-xs focus:border-[#0a8ea0] outline-none" />
                                                    <button onClick={() => setMetaVars(metaVars.filter((_, idx) => idx !== i))} className="text-gray-400 hover:text-red-500"><X size={14} /></button>
                                                </div>
                                            ))}
                                        </div>
                                        <button onClick={() => setMetaVars([...metaVars, { key: '', value: '' }])} className="flex items-center gap-1.5 px-3 py-1 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded text-[11px] font-bold text-gray-650 transition-colors">
                                            <Plus size={12} /> Add
                                        </button>
                                    </div>

                                    <div className="mt-4 pt-4 border-t border-gray-100">
                                        <button
                                            disabled={!id || id === 'new' || webCallLoading}
                                            onClick={initializeTestWebCall}
                                            className="w-full flex items-center justify-center gap-2 py-3 bg-[#0a8ea0] hover:bg-[#077a8a] text-white rounded-[12px] font-bold text-[13px] tracking-wide transition-colors disabled:opacity-50 shadow-[0_4px_14px_0_rgba(10,142,160,0.39)]"
                                        >
                                            {webCallLoading ? <Loader2 size={16} className="animate-spin" /> : <PhoneCall size={16} />}
                                            Start {testCallMode === 'web' ? 'Web' : 'Phone'} Call
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                activeTestRoomToken && activeTestRoomUrl && testCallMode === 'web' ? (
                                    <LiveKitRoom
                                        serverUrl={activeTestRoomUrl}
                                        token={activeTestRoomToken}
                                        connect={true}
                                        audio={true}
                                        video={false}
                                        onDisconnected={resetTestCall}
                                    >
                                        <WebCallActiveUI resetTestCall={resetTestCall} />
                                        <RoomAudioRenderer />
                                    </LiveKitRoom>
                                ) : (
                                    <div className="flex flex-col items-center justify-center p-8 bg-white min-h-[480px]">
                                        {/* Physical Target Phone Animation */}
                                        <div className="relative mb-8 mt-4">
                                            <div className="w-32 h-32 rounded-full border-[6px] border-emerald-400 bg-transparent flex items-center justify-center shadow-[0_0_25px_#34d399] animate-[pulse_1s_ease-in-out_infinite]" style={{ filter: 'drop-shadow(0 0 10px rgba(52,211,153,0.5))' }}></div>
                                            <div className="absolute inset-0 flex flex-col items-center justify-center text-[13px] font-bold text-gray-600 mt-[140px] tracking-wide uppercase">Ringing Outbound...</div>
                                        </div>
                                        <button onClick={resetTestCall} className="w-full flex justify-center items-center gap-2 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-[12px] font-bold transition-colors shadow-sm mt-auto">
                                            <PhoneOff size={14} /> Stop Simulation
                                        </button>
                                    </div>
                                )
                            )}
                        </div>
                    </div>
                )}

                {/* Voice Selection Modal Portal */}
                {voiceModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                        <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl relative border border-gray-100 overflow-hidden transform transition-all scale-in">
                            {/* Modal Header */}
                            <div className="bg-white px-6 md:px-8 pt-8 pb-5 flex flex-col gap-5 border-b border-gray-100 shrink-0">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-2xl font-black text-gray-900 tracking-tight">Choose a Voice</h2>
                                        <p className="text-[13px] font-medium text-gray-500 mt-1">{filteredVoices.length} voices available • Current: {activeVoice ? activeVoice.voiceName : 'None'}</p>
                                    </div>
                                    <button onClick={() => setVoiceModalOpen(false)} className="w-8 h-8 bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-full flex items-center justify-center transition-colors">
                                        <X size={18} />
                                    </button>
                                </div>

                                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                                    {/* Search Bar */}
                                    <div className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded-xl w-full sm:w-96 shadow-sm focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">
                                        <Search size={16} className="text-gray-400 shrink-0" />
                                        <input
                                            type="text"
                                            placeholder="Search voices..."
                                            value={voiceSearchQuery}
                                            onChange={e => setVoiceSearchQuery(e.target.value)}
                                            className="w-full bg-transparent border-none outline-none text-sm font-medium text-gray-900 placeholder-gray-400"
                                        />
                                    </div>
                                    {/* Filter Pills */}
                                    <div className="flex bg-gray-100 p-1 rounded-xl w-fit">
                                        {["All", "Female", "Male"].map(g => (
                                            <button
                                                key={g}
                                                onClick={() => setVoiceGenderFilter(g)}
                                                className={`px-4 py-2 text-[12px] font-bold rounded-lg transition-all ${voiceGenderFilter === g ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
                                            >
                                                {g}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Modal Body (Scrollable Grid) */}
                            <div className="p-6 md:p-8 bg-slate-50/50 overflow-y-auto flex-1">
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                    {filteredVoices.map(v => (
                                        <div
                                            key={v.id}
                                            onClick={() => { setVoiceId(v.id); setModelId(v.llmModelId || modelId); setVoiceModalOpen(false); }}
                                            className={`bg-white border rounded-2xl p-4 flex flex-col gap-4 shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group ${voiceId === v.id ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-gray-200'}`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="relative w-12 h-12 rounded-full shadow-sm shrink-0">
                                                    {v.imgUrl ? (
                                                        <img src={v.imgUrl} alt={v.voiceName} className="w-full h-full rounded-full object-cover bg-gray-100" />
                                                    ) : (
                                                        <div className="w-full h-full rounded-full bg-gradient-to-br from-gray-100 to-gray-200 border border-gray-300 flex items-center justify-center shadow-inner">
                                                            <AudioLines size={16} className="text-gray-400" />
                                                        </div>
                                                    )}
                                                    <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm ${v.gender?.toLowerCase() === 'female' ? 'bg-pink-500' : 'bg-blue-500'}`}></div>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-bold text-gray-900 truncate tracking-tight text-[15px] group-hover:text-blue-600 transition-colors">{v.voiceName}</h3>
                                                    <p className="text-xs text-gray-500 font-medium capitalize truncate">{v.gender || 'Generic'} • {v.modelName}</p>
                                                </div>
                                            </div>

                                            <button
                                                onClick={(e) => playPreview(e, v.id, v.recordingUrl)}
                                                className={`w-full py-2.5 flex items-center justify-center gap-2 border rounded-xl text-[13px] font-bold transition-all shadow-sm ${playingVoiceId === v.id ? 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100 hover:border-red-300' : 'border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-blue-600'}`}
                                            >
                                                {playingVoiceId === v.id ? (
                                                    <><Square size={14} className="fill-current opacity-80" /> Stop Preview</>
                                                ) : (
                                                    <><Play size={14} className="fill-current opacity-60" /> Preview Audio</>
                                                )}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                {filteredVoices.length === 0 && (
                                    <div className="flex flex-col items-center justify-center py-20 text-center">
                                        <AudioLines size={40} className="text-gray-300 mb-4" />
                                        <h3 className="text-lg font-bold text-gray-900 tracking-tight">No voices found.</h3>
                                        <p className="text-sm font-medium text-gray-500">Try adjusting your filters.</p>
                                    </div>
                                )}
                            </div>

                            {/* Modal Footer */}
                            <div className="bg-white px-6 md:px-8 py-4 border-t border-gray-100 flex items-center justify-between shrink-0">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{filteredVoices.length} Results Rendered</span>
                                <button onClick={() => setVoiceModalOpen(false)} className="px-6 py-2.5 border border-gray-200 hover:bg-gray-50 rounded-xl text-sm font-bold text-gray-700 transition-colors">
                                    Close Framework
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Voice Selection Modal Portal */}
                {/* Voice Modal removed from diff for brevity but kept in code ...  it ends before Transfer Portal */}

                {/* End Call Creation Modal Portal */}
                {showEndCallModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/30 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                        <div className="bg-white rounded-[24px] w-full max-w-xl max-h-[95vh] flex flex-col shadow-2xl relative border border-gray-100 overflow-hidden transform transition-all scale-in">
                            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between shrink-0 bg-white">
                                <h2 className="text-[17px] font-black text-gray-800 tracking-tight flex items-center gap-2">
                                    <PhoneOff size={18} /> End Call <Info size={14} className="text-gray-400 cursor-pointer" />
                                </h2>
                                <button onClick={() => setShowEndCallModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors"><X size={20} /></button>
                            </div>
                            <div className="p-6 md:p-8 bg-slate-50/30 overflow-y-auto flex-1 flex flex-col gap-6">
                                <p className="text-[12px] font-medium text-gray-500 bg-gray-50 p-4 rounded-xl border border-gray-200">Lets the agent gracefully terminate the conversation when the user is done or the call... Define when the agent should end the call.</p>

                                <div>
                                    <label className="block text-[11px] font-semibold text-gray-700 mb-1.5">Name <span className="text-red-500">*</span></label>
                                    <input type="text" value={endCallData.name} onChange={e => setEndCallData({ ...endCallData, name: e.target.value })} placeholder="end_call" className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-[13px] font-medium text-gray-800 focus:outline-none focus:border-blue-500 shadow-sm transition-colors" />
                                </div>

                                <div>
                                    <label className="block text-[11px] font-semibold text-gray-700 mb-1.5">Description <span className="text-red-500">*</span></label>
                                    <textarea rows={2} value={endCallData.description} onChange={e => setEndCallData({ ...endCallData, description: e.target.value })} placeholder="Describe when the assistant should call this function." className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-[13px] font-medium text-gray-800 focus:outline-none focus:border-blue-500 shadow-sm transition-colors resize-none" />
                                </div>

                                <div>
                                    <label className="block text-[11px] font-semibold text-gray-700 mb-1.5">Execution Message</label>
                                    <input type="text" value={endCallData.execution_msg} onChange={e => setEndCallData({ ...endCallData, execution_msg: e.target.value })} placeholder="Message spoken while this function executes" className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-[13px] font-medium text-gray-800 focus:outline-none focus:border-blue-500 shadow-sm transition-colors" />
                                </div>

                                <div className="flex items-center justify-end gap-3 mt-4 pt-4 border-t border-gray-100">
                                    <button onClick={() => { setShowEndCallModal(false); setEditingToolId(null); }} className="px-5 py-2 hover:bg-gray-100 rounded-xl text-[13px] font-bold text-gray-600 transition-colors">Cancel</button>
                                    <button onClick={submitEndCall} disabled={submittingTool === 'end_call'} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[13px] flex items-center gap-2 font-bold tracking-wide transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                                        {submittingTool === 'end_call' && <Loader2 size={16} className="animate-spin" />} {editingToolId ? 'Update Function' : 'Add Function'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* IVR Modal Portal */}
                {showIVRModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/30 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                        <div className="bg-white rounded-[24px] w-full max-w-xl max-h-[95vh] flex flex-col shadow-2xl relative border border-gray-100 overflow-hidden transform transition-all scale-in">
                            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between shrink-0 bg-white">
                                <h2 className="text-[17px] font-black text-gray-800 tracking-tight flex items-center gap-2">
                                    IVR / Press Digit <Info size={14} className="text-gray-400 cursor-pointer" />
                                </h2>
                                <button onClick={() => setShowIVRModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors"><X size={20} /></button>
                            </div>
                            <div className="p-6 md:p-8 bg-slate-50/30 overflow-y-auto flex-1 flex flex-col gap-6">
                                <div className="flex flex-col gap-1.5 bg-gray-50 p-4 rounded-xl border border-gray-200">
                                    <h3 className="font-bold text-[14px]">Help information</h3>
                                    <p className="text-[12px] font-medium text-gray-500">Configure the digit-press IVR navigation function.</p>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-semibold text-gray-700 mb-1.5">Name <span className="text-red-500">*</span></label>
                                    <input type="text" value={ivrData.name} onChange={e => setIvrData({ ...ivrData, name: e.target.value })} placeholder="press_digit" className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-[13px] font-medium text-gray-800 focus:outline-none focus:border-blue-500 shadow-sm transition-colors" />
                                </div>

                                <div>
                                    <label className="block text-[11px] font-semibold text-gray-700 mb-1.5">Description (Optional)</label>
                                    <textarea rows={2} value={ivrData.description} onChange={e => setIvrData({ ...ivrData, description: e.target.value })} placeholder="Press a digit to navigate the IVR menu" className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-[13px] font-medium text-gray-800 focus:outline-none focus:border-blue-500 shadow-sm transition-colors resize-none" />
                                </div>

                                <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
                                    <h4 className="text-[13px] font-bold text-gray-800 mb-2">Press Digit Config</h4>
                                    <label className="block text-[11px] font-semibold text-gray-700 mb-1.5">Pause Detection Delay (ms)</label>
                                    <input type="number" value={ivrData.pause_ms} onChange={e => setIvrData({ ...ivrData, pause_ms: parseInt(e.target.value) })} placeholder="1000" className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-[13px] font-medium text-gray-800 focus:outline-none focus:border-blue-500 shadow-sm transition-colors mb-2" />
                                    <p className="text-[11px] text-gray-500">How long the agent waits after speaking before pressing a digit. Default: 1000ms.</p>
                                </div>

                                <div className="flex items-center justify-end gap-3 mt-4 pt-4 border-t border-gray-100">
                                    <button onClick={() => { setShowIVRModal(false); setEditingToolId(null); }} className="px-5 py-2 hover:bg-gray-100 rounded-xl text-[13px] font-bold text-gray-600 transition-colors">Cancel</button>
                                    <button onClick={submitIVR} disabled={submittingTool === 'press_digit'} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[13px] flex items-center gap-2 font-bold tracking-wide transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                                        {submittingTool === 'press_digit' && <Loader2 size={16} className="animate-spin" />} {editingToolId ? 'Update Function' : 'Add Function'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Transfer Call Creation Modal Portal */}
                {showTransferModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/30 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                        <div className="bg-white rounded-[24px] w-full max-w-3xl max-h-[95vh] flex flex-col shadow-2xl relative border border-gray-100 overflow-hidden transform transition-all scale-in">

                            {/* Header */}
                            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between shrink-0 bg-white">
                                <div className="flex items-center gap-2">
                                    <h2 className="text-[17px] font-black text-gray-800 tracking-tight">Transfer Call</h2>
                                    <Info size={14} className="text-gray-400 cursor-pointer" />
                                </div>
                                <button onClick={() => setShowTransferModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Body */}
                            <div className="p-6 md:p-8 bg-slate-50/30 overflow-y-auto flex-1 flex flex-col gap-6">

                                {loadingTransferTool ? (
                                    <div className="flex flex-col items-center justify-center py-20 flex-1">
                                        <Loader2 size={32} className="animate-spin text-blue-500 mb-4" />
                                        <span className="text-sm font-bold text-gray-600">Syncing with Ravan API...</span>
                                    </div>
                                ) : (
                                    <>
                                        {/* Name Row */}
                                        <div className="flex items-start justify-between gap-6">
                                            <div className="flex-1">
                                                <label className="block text-[11px] font-semibold text-gray-700 mb-1.5">Name <span className="text-red-500">*</span></label>
                                                <input type="text" disabled value={transferToolData?.data?.name || ""} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-[13px] font-medium text-gray-500 cursor-not-allowed shadow-sm" />
                                            </div>
                                            <div className="flex items-center gap-2 mt-7">
                                                <input type="checkbox" checked={transferToolData?.data?.definition?.on_hold_music || false} onChange={(e) => setTransferToolData({ ...transferToolData, data: { ...transferToolData?.data, definition: { ...transferToolData?.data?.definition, on_hold_music: e.target.checked } } })} className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                                <span className="text-[12px] font-semibold text-gray-600">On Hold Music</span>
                                            </div>
                                        </div>

                                        {/* Description */}
                                        <div>
                                            <label className="block text-[11px] font-semibold text-gray-500 mb-1.5">Description (Fixed)</label>
                                            <textarea rows={2} disabled value={transferToolData?.data?.description || ""} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-[13px] font-medium text-gray-400 cursor-not-allowed resize-y shadow-sm" />
                                        </div>

                                        {/* Execution Message */}
                                        <div>
                                            <label className="block text-[11px] font-semibold text-gray-500 mb-1.5">Execution Message</label>
                                            <input type="text" value={transferToolData?.data?.definition?.execution_msg || ""} onChange={(e) => setTransferToolData({ ...transferToolData, data: { ...transferToolData?.data, definition: { ...transferToolData?.data?.definition, execution_msg: e.target.value } } })} placeholder="Message spoken while the call is being transferred" className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-[13px] font-medium text-gray-400 focus:outline-none shadow-sm" />
                                        </div>

                                        {/* TRANSFER MODE Box */}
                                        <div className="p-4 bg-gray-50/50 border border-gray-100 rounded-xl">
                                            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-3">TRANSFER MODE</label>
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => setTransferToolData({ ...transferToolData, data: { ...transferToolData?.data, definition: { ...transferToolData?.data?.definition, mode: 'cold_transfer' } } })} className={`px-4 py-1.5 rounded-lg text-[12px] font-bold shadow-sm transition-colors ${transferToolData?.data?.definition?.mode === 'cold_transfer' ? 'bg-white border border-gray-200 text-gray-700' : 'bg-transparent text-gray-500 hover:text-gray-700 border border-transparent'}`}>Cold Transfer</button>
                                                <button onClick={() => setTransferToolData({ ...transferToolData, data: { ...transferToolData?.data, definition: { ...transferToolData?.data?.definition, mode: 'warm_transfer' } } })} className={`px-4 py-1.5 rounded-lg text-[12px] font-bold shadow-sm transition-colors ${transferToolData?.data?.definition?.mode === 'warm_transfer' ? 'bg-white border border-gray-200 text-gray-700' : 'bg-transparent text-gray-500 hover:text-gray-700 border border-transparent'}`}>Warm Transfer</button>
                                            </div>
                                        </div>

                                        {/* Custom Prompt Toggle */}
                                        <div className="flex items-center gap-2">
                                            <input type="checkbox" checked={transferToolData?.data?.definition?.custom_prompt || false} onChange={(e) => setTransferToolData({ ...transferToolData, data: { ...transferToolData?.data, definition: { ...transferToolData?.data?.definition, custom_prompt: e.target.checked } } })} className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500" />
                                            <label className="text-[12px] font-semibold text-gray-600">Custom System Prompt</label>
                                        </div>

                                        {/* Agent Connect config */}
                                        <div className="p-4 bg-gray-50/50 border border-gray-100 rounded-xl space-y-4">
                                            <div>
                                                <div className="flex items-center gap-2 opacity-50">
                                                    <input type="checkbox" disabled checked={transferToolData?.data?.definition?.transfer_to_assign_agent || false} className="w-4 h-4 text-gray-400 rounded border-gray-200 cursor-not-allowed" />
                                                    <label className="text-[13px] font-bold text-gray-600">Assign Human Agent</label>
                                                </div>
                                                <p className="text-[11px] text-gray-400 mt-1 pl-6 flex items-center gap-1"><Info size={10} /> To enable this, connect GoHighLevel or Salesforce in the Integrations section first.</p>
                                            </div>
                                            <div className="flex items-center gap-2 pl-6">
                                                <input type="checkbox" checked={transferToolData?.data?.definition?.show_user_number || false} onChange={(e) => setTransferToolData({ ...transferToolData, data: { ...transferToolData?.data, definition: { ...transferToolData?.data?.definition, show_user_number: e.target.checked } } })} className="w-4 h-4 text-blue-600 rounded border-gray-300" />
                                                <label className="text-[12px] font-semibold text-gray-600">Show User Number</label>
                                                <Info size={12} className="text-gray-400" />
                                            </div>
                                        </div>

                                        {/* TRANSFER TO BOX */}
                                        <div className="p-5 bg-gray-50/50 border border-gray-100 rounded-xl space-y-4">
                                            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1">TRANSFER TO</label>
                                            <div className="flex items-center gap-2 mb-4">
                                                <button onClick={() => setTransferToolData({ ...transferToolData, data: { ...transferToolData?.data, definition: { ...transferToolData?.data?.definition, transfer_to_type: 'static' } } })} className={`px-4 py-1.5 rounded-lg text-[12px] font-bold shadow-sm transition-colors ${transferToolData?.data?.definition?.transfer_to_type === 'static' ? 'bg-white border border-gray-200 text-gray-700' : 'bg-transparent text-gray-500 hover:text-gray-700 border border-transparent'}`}>Static</button>
                                                <button onClick={() => setTransferToolData({ ...transferToolData, data: { ...transferToolData?.data, definition: { ...transferToolData?.data?.definition, transfer_to_type: 'dynamic' } } })} className={`px-4 py-1.5 rounded-lg text-[12px] font-bold shadow-sm transition-colors ${transferToolData?.data?.definition?.transfer_to_type === 'dynamic' ? 'bg-white border border-gray-200 text-gray-700' : 'bg-transparent text-gray-500 hover:text-gray-700 border border-transparent'}`}>Dynamic</button>
                                            </div>

                                            <div className="flex items-start gap-3">
                                                <div className="w-1/3">
                                                    <label className="block text-[10px] font-bold text-gray-600 mb-1.5 uppercase">PHONE NUMBER <span className="text-red-500">*</span></label>
                                                    <select className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-[13px] font-medium text-gray-700 shadow-sm focus:outline-none">
                                                        <option>IN +91</option>
                                                    </select>
                                                </div>
                                                <div className="flex-1 mt-[22px]">
                                                    <div className="relative">
                                                        <PhoneCall size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                                        <input type="text" value={transferToolData?.data?.definition?.phone_number || ""} onChange={(e) => setTransferToolData({ ...transferToolData, data: { ...transferToolData?.data, definition: { ...transferToolData?.data?.definition, phone_number: e.target.value } } })} placeholder="Enter destination number" className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-[13px] font-medium text-gray-700 shadow-sm focus:outline-none placeholder-gray-300" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Client Transfer Number */}
                                        <div>
                                            <label className="block text-[11px] font-semibold text-gray-600 mb-1.5">Client Transfer Number</label>
                                            <select value={transferToolData?.data?.definition?.client_transfer_id || ""} onChange={(e) => setTransferToolData({ ...transferToolData, data: { ...transferToolData?.data, definition: { ...transferToolData?.data?.definition, client_transfer_id: e.target.value } } })} className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-[13px] font-medium text-gray-700 shadow-sm focus:outline-none text-left appearance-none">
                                                <option value="019f8420-cb91-7048-9aba-c4c8494a8d2a">+918031449343 - Indian Telephony</option>
                                            </select>
                                            <div className="relative">
                                                <ChevronDown size={14} className="absolute right-3 -top-[25px] text-gray-400 pointer-events-none" />
                                            </div>
                                        </div>

                                        {/* SCHEDULE */}
                                        <div className="p-4 bg-gray-50/50 border border-gray-100 rounded-xl space-y-4">
                                            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1">SCHEDULE (OPTIONAL)</label>
                                            <div className="grid grid-cols-3 gap-3">
                                                <div>
                                                    <label className="block text-[10px] font-bold text-gray-600 mb-1.5 uppercase">TIMEZONE</label>
                                                    <div className="relative">
                                                        <select value={transferToolData?.data?.definition?.timezone || ""} onChange={(e) => setTransferToolData({ ...transferToolData, data: { ...transferToolData?.data, definition: { ...transferToolData?.data?.definition, timezone: e.target.value } } })} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-[12px] text-gray-500 appearance-none shadow-sm focus:outline-none">
                                                            <option value="">Select timezone</option>
                                                            <option value="Asia/Kolkata">Asia/Kolkata</option>
                                                        </select>
                                                        <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold text-gray-600 mb-1.5 uppercase">START TIME</label>
                                                    <input type="text" value={transferToolData?.data?.definition?.start_time || ""} onChange={(e) => setTransferToolData({ ...transferToolData, data: { ...transferToolData?.data, definition: { ...transferToolData?.data?.definition, start_time: e.target.value } } })} placeholder="Select time" className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-[12px] text-gray-500 shadow-sm focus:outline-none" />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold text-gray-600 mb-1.5 uppercase">END TIME</label>
                                                    <input type="text" value={transferToolData?.data?.definition?.end_time || ""} onChange={(e) => setTransferToolData({ ...transferToolData, data: { ...transferToolData?.data, definition: { ...transferToolData?.data?.definition, end_time: e.target.value } } })} placeholder="Select time" className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-[12px] text-gray-500 shadow-sm focus:outline-none" />
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3 bg-white shrink-0">
                                <button onClick={() => { setShowTransferModal(false); setEditingToolId(null); }} className="px-5 py-2 border border-gray-200 rounded-lg text-[13px] font-bold text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
                                <button onClick={submitTransferCall} disabled={submittingTool === 'transfer_call' || loadingTransferTool} className="px-6 py-2 bg-[#4db5c2] hover:bg-[#3ea5b2] rounded-lg text-[13px] font-bold flex items-center gap-2 text-white shadow-sm transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                                    {submittingTool === 'transfer_call' && <Loader2 size={16} className="animate-spin" />} {editingToolId ? 'Update Function' : 'Save Function'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </MainLayout >
    );
}
