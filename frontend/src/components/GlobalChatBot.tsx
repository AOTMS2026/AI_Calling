import React, { useState, useRef, useEffect } from 'react';
import { Send, X, User, Mic, MicOff, Volume2, PhoneCall, Bot, Sparkles } from 'lucide-react';
import { apiClient } from '../api/client';
import RecordRTC from 'recordrtc';

interface ChatMessage {
    id: string;
    text: string;
    sender: 'user' | 'bot';
    timestamp: Date;
    audioBase64?: string;
}

export const GlobalChatBot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [callMode, setCallMode] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            id: 'welcome-msg',
            text: 'Hello! I am your Vortex Intelligence Assistant. How can I help you today?',
            sender: 'bot',
            timestamp: new Date()
        }
    ]);
    const [inputText, setInputText] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Real RecordRTC explicitly strictly tied to hardware for PCM WAV format constraints
    const recorderRef = useRef<RecordRTC | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const recognitionRef = useRef<any>(null); // For immediate visual text tracking

    const startRecording = async () => {
        try {
            if (!streamRef.current) {
                streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
            }

            recorderRef.current = new RecordRTC(streamRef.current, {
                type: 'audio',
                mimeType: 'audio/wav',
                recorderType: RecordRTC.StereoAudioRecorder,
                desiredSampRate: 16000,
                numberOfAudioChannels: 1
            });

            recorderRef.current.startRecording();
            setIsRecording(true);
            setInputText('');

            // Native Web Speech API for Immediate Visual Text "Speaking showing"
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            if (SpeechRecognition) {
                recognitionRef.current = new SpeechRecognition();
                recognitionRef.current.lang = 'en-US';
                recognitionRef.current.interimResults = true; // Show text IMMEDIATELY
                recognitionRef.current.continuous = true;

                recognitionRef.current.onresult = (event: any) => {
                    let currentTranscript = '';
                    for (let i = 0; i < event.results.length; i++) {
                        currentTranscript += event.results[i][0].transcript;
                    }
                    setInputText(currentTranscript);
                };
                recognitionRef.current.start();
            }

        } catch (err) {
            console.error("Microphone Access Denied explicitly by browser:", err);
            alert("Please allow Microphone access in your browser to use physical voice calls.");
        }
    };

    const stopRecording = () => {
        if (recorderRef.current && isRecording) {
            recorderRef.current.stopRecording(() => {
                const audioBlob = recorderRef.current!.getBlob();
                const reader = new FileReader();
                reader.readAsDataURL(audioBlob);
                reader.onloadend = async () => {
                    const base64Audio = (reader.result as string).split(',')[1];
                    // Uses natively visually recognized text if the backend STT fails or drops
                    await sendPayloadToServer(inputText, base64Audio);
                };
            });

            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
            setIsRecording(false);
        }
    };

    const toggleRecording = () => {
        if (isRecording) stopRecording();
        else startRecording();
    };

    const playAudio = (base64Audio: string) => {
        if (!base64Audio) return;
        const audio = new Audio("data:audio/wav;base64," + base64Audio);
        audio.play().catch(e => console.error("Playback failed natively:", e));
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen, isTyping, callMode]);

    const sendPayloadToServer = async (textChunk: string, audioBase64: string = "") => {
        setIsTyping(true);

        if (textChunk) {
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                text: textChunk,
                sender: 'user',
                timestamp: new Date()
            }]);
        }

        // Simulating the clean architecture payload intercept (removed backend APIs completely)
        setTimeout(() => {
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                text: 'Backend processing is currently disabled on the Demo layer. I am operating in Offline Sandbox mode.',
                sender: 'bot',
                timestamp: new Date(),
                audioBase64: ""
            }]);
            setIsTyping(false);
        }, 1200);
    };

    const handleSend = () => {
        if (!inputText.trim()) return;
        const stored = inputText.trim();
        setInputText('');
        sendPayloadToServer(stored, "");
    };

    return (
        <>
            {isOpen && (
                <div className={`fixed bottom-24 right-4 sm:right-6 w-[calc(100vw-32px)] sm:w-[400px] h-[550px] bg-white/95 backdrop-blur-3xl rounded-[2rem] shadow-[0_40px_80px_-20px_rgba(0,0,80,0.15)] border border-white flex flex-col z-50 overflow-hidden font-sans transform transition-all duration-300 ease-out`}>

                    {/* Premium Header */}
                    <div className="h-20 bg-white/60 border-b border-gray-100 flex items-center justify-between px-6 shrink-0 relative overflow-hidden backdrop-blur-xl">
                        <div className="flex items-center gap-3 relative z-10 w-full justify-between">
                            <div className="flex items-center gap-3">
                                {/* Matched Hero Navbar Bot Icon Style */}
                                <div className="bg-gradient-to-tr from-gray-900 to-gray-700 text-white p-2 rounded-xl shadow-lg ring-1 ring-gray-900/10 flex items-center justify-center">
                                    <Bot size={20} className="stroke-[2.5]" />
                                </div>
                                <div className="flex flex-col">
                                    <h3 className="text-gray-900 font-extrabold text-sm tracking-tight flex items-center gap-1">Vortex Intelligence <Sparkles size={12} className="text-blue-500" /></h3>
                                    <span className="text-green-500 text-[10px] font-bold flex items-center gap-1.5 uppercase tracking-wider">
                                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                                        {callMode ? "LIVE Mode Active" : "Online"}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setCallMode(!callMode)}
                                    className={`transition-colors p-2 rounded-full text-xs font-semibold ${callMode ? 'bg-blue-50 text-blue-600 border border-blue-200 shadow-sm' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100'}`}
                                    title="Switch Call Type"
                                >
                                    <PhoneCall className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="text-gray-400 hover:text-gray-900 transition-colors p-2 hover:bg-gray-100 rounded-full"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 bg-gray-50/30 relative overflow-hidden flex flex-col justify-end">

                        {callMode ? (
                            <div className="absolute inset-0 p-4 flex flex-row items-stretch justify-center gap-4 animate-in fade-in zoom-in duration-300 h-full w-full bg-white/50 backdrop-blur-md">

                                {/* Left Side: AI Speaking */}
                                <div className="flex flex-col items-center w-[48%] h-[350px] mt-4 bg-white rounded-2xl shadow-sm border border-gray-100 p-4 justify-between relative overflow-hidden">
                                    {(isTyping || messages[messages.length - 1]?.sender === 'bot') && (
                                        <div className="absolute top-8 w-24 h-24 bg-blue-400 rounded-full animate-ping opacity-10"></div>
                                    )}
                                    <div className="flex flex-col items-center gap-3 relative z-10 w-full">
                                        <div className={`w-14 h-14 rounded-2xl shadow-sm flex items-center justify-center p-2 border-2 ${isTyping || messages[messages.length - 1]?.sender === 'bot' ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-gray-50 border-gray-100 text-gray-400'}`}>
                                            <Bot size={24} className="stroke-[2.5]" />
                                        </div>
                                        <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">AI Response</h3>
                                    </div>

                                    <div className="flex-1 w-full mt-4 bg-gray-50 rounded-xl p-3 flex flex-col justify-start overflow-hidden border border-gray-100 relative shadow-inner">
                                        <p className="text-gray-700 text-[11px] font-medium leading-relaxed overflow-y-auto min-h-0 stylish-scrollbar scroll-smooth">
                                            {isTyping ? <span className="animate-pulse text-blue-500 font-bold">Processing audio...</span> : (messages.filter(m => m.sender === 'bot').pop()?.text || "Listening...")}
                                        </p>
                                    </div>
                                </div>

                                {/* Right Side: User Speech */}
                                <div className="flex flex-col items-center w-[48%] h-[350px] mt-4 bg-gradient-to-b from-gray-900 to-black rounded-2xl shadow-md border border-gray-800 p-4 justify-between relative overflow-hidden transition-all duration-300">
                                    {isRecording && (
                                        <div className="absolute top-8 w-24 h-24 bg-red-400 rounded-full animate-ping opacity-20"></div>
                                    )}
                                    <div className="flex flex-col items-center gap-3 relative z-10 w-full">
                                        <div className={`w-14 h-14 rounded-2xl shadow-lg flex items-center justify-center border-2 ${isRecording ? 'bg-red-500/20 border-red-500/50 animate-pulse' : 'bg-gray-800 border-gray-700'}`}>
                                            {isRecording ? <Mic className="w-6 h-6 text-red-400" /> : <User className="w-6 h-6 text-gray-400" />}
                                        </div>
                                        <button
                                            onClick={toggleRecording}
                                            className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 transition-colors cursor-pointer px-3 py-1.5 rounded-full text-center shadow-sm border border-gray-700 active:scale-95"
                                        >
                                            <div className={`w-1.5 h-1.5 rounded-full ${isRecording ? 'bg-red-400 animate-pulse shadow-[0_0_8px_rgba(248,113,113,0.8)]' : 'bg-gray-500'}`}></div>
                                            <h3 className="text-[9px] font-bold text-gray-200 uppercase tracking-widest text-center min-w-[36px] select-none">
                                                {isRecording ? "Rec" : "Off"}
                                            </h3>
                                        </button>
                                    </div>

                                    <div className="flex-1 w-full mt-4 bg-gray-800/50 rounded-xl p-3 flex flex-col justify-start overflow-hidden border border-gray-700 pb-8 min-h-0 shadow-inner">
                                        <p className="text-gray-300 text-[11px] font-medium leading-relaxed overflow-y-auto stylish-scrollbar scroll-smooth">
                                            {inputText || (messages.filter(m => m.sender === 'user').pop()?.text || "Speak now...")}
                                        </p>
                                    </div>
                                </div>

                            </div>
                        ) : (
                            <div className="absolute inset-0 p-5 space-y-4 overflow-y-auto">
                                {messages.map((msg) => (
                                    <div key={msg.id} className={`flex w-full ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`flex gap-2 max-w-[85%] ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>

                                            {/* Chat Icons */}
                                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${msg.sender === 'user' ? 'bg-gradient-to-t from-gray-900 to-gray-800 ring-1 ring-gray-700' : 'bg-gradient-to-tr from-blue-100 to-indigo-100 text-blue-600 border border-blue-200/50'}`}>
                                                {msg.sender === 'user' ?
                                                    <User className="w-4 h-4 text-white" /> :
                                                    <Bot size={16} />
                                                }
                                            </div>

                                            {/* Bubbles */}
                                            <div className={`group relative px-4 py-3 rounded-2xl text-[13px] font-medium leading-relaxed shadow-sm
                                                ${msg.sender === 'user'
                                                    ? 'bg-gradient-to-b from-blue-600 to-indigo-600 text-white rounded-tr-sm border border-blue-500'
                                                    : 'bg-white text-gray-800 rounded-tl-sm border border-gray-200/80 shadow-[0_2px_10px_rgba(0,0,0,0.02)]'
                                                }`}
                                            >
                                                {msg.text}
                                                {msg.sender === 'bot' && msg.audioBase64 && (
                                                    <button
                                                        onClick={() => playAudio(msg.audioBase64!)}
                                                        className="absolute -right-8 top-1.5 text-gray-400 hover:text-blue-600 transition-colors opacity-0 group-hover:opacity-100 bg-white shadow-sm border border-gray-100 rounded-full p-1.5"
                                                        title="Play Audio"
                                                    >
                                                        <Volume2 className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {isTyping && (
                                    <div className="flex w-full justify-start">
                                        <div className="px-4 py-3 bg-white rounded-2xl rounded-tl-sm border border-gray-100 shadow-sm flex gap-1.5 items-center h-[42px]">
                                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce"></span>
                                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>
                        )}
                    </div>

                    <div className="p-4 bg-white border-t border-gray-100 shrink-0 z-10 w-full shadow-[0_-10px_30px_rgba(0,0,0,0.03)] rounded-b-[2rem]">
                        <div className="relative flex items-center gap-2">
                            <button
                                onClick={toggleRecording}
                                className={`flex shrink-0 items-center justify-center w-11 h-11 rounded-full transition-all duration-300 ${isRecording ? 'bg-red-50 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)] animate-pulse border-2 border-red-200' : 'bg-gray-50 text-gray-500 hover:text-blue-600 hover:bg-blue-50 border border-gray-200'}`}
                            >
                                {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                            </button>

                            <div className="relative flex-1">
                                <input
                                    type="text"
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                    placeholder={isRecording ? "Transcribing audio..." : "Message Vortex..."}
                                    className="w-full bg-gray-50/50 border border-gray-200 text-gray-800 text-[13px] font-medium rounded-full pl-5 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all placeholder:text-gray-400"
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={(!inputText.trim() && !isRecording) || isTyping}
                                    className="absolute right-1 top-1 w-8 h-8 flex items-center justify-center bg-gray-900 hover:bg-black disabled:opacity-50 disabled:hover:bg-gray-900 text-white rounded-full transition-all shadow-md transform hover:scale-105 active:scale-95"
                                >
                                    <Send className="w-3.5 h-3.5 ml-0.5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Floating Button exactly matching the new Vortex Navbar Branding Logo block */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-br from-gray-900 to-gray-800 hover:from-black hover:to-gray-900 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.2)] border border-gray-700/50 flex items-center justify-center z-50 transform hover:-translate-y-1 hover:scale-105 transition-all duration-300 group ring-4 ring-gray-900/10"
            >
                <Bot size={28} className="text-white stroke-[2] group-hover:scale-110 transition-transform duration-300" />

                {!isOpen && (
                    <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-blue-500 border-2 border-gray-900"></span>
                    </span>
                )}
            </button>
        </>
    );
};
