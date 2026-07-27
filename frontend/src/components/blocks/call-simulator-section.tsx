import { useState, useEffect } from 'react';
import { Phone, Mic, Volume2, Sparkles } from 'lucide-react';

export function CallSimulatorSection() {
    const [callStatus, setCallStatus] = useState<'idle' | 'ringing' | 'connected'>('idle');
    const [callTime, setCallTime] = useState(0);
    const [transcript, setTranscript] = useState<string[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);

    // Simulate real transcript streaming
    const simulationScript = [
        "AI: Hello! Thank you for calling AOTMS Support. How can I help you scale today?",
        "User: I'm looking to deploy a new AI Calling agent.",
        "AI: Absolutely. I can configure a dedicated bare-metal SIP trunk for that volume immediately. Should I securely route you to our Enterprise billing portal?",
        "User: Yes, that sounds incredibly fast.",
        "AI: Connecting you now. Have a spectacular day building the future!"
    ];

    // Handle Call Start / Hangup
    const toggleCall = () => {
        if (callStatus === 'idle') {
            setCallStatus('ringing');
            setTranscript([]);
            setCurrentIndex(0);
            setCallTime(0);
        } else {
            // Hang up
            setCallStatus('idle');
            window.speechSynthesis.cancel(); // Stop speaking instantly on hangup
        }
    };

    // Synthesize a US Ringback Tone using Web Audio API
    useEffect(() => {
        if (callStatus === 'ringing') {
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const playRing = () => {
                const osc1 = audioCtx.createOscillator();
                const osc2 = audioCtx.createOscillator();
                const gain = audioCtx.createGain();

                osc1.frequency.value = 440;
                osc2.frequency.value = 480;

                osc1.connect(gain);
                osc2.connect(gain);
                gain.connect(audioCtx.destination);

                gain.gain.setValueAtTime(0.1, audioCtx.currentTime); // gentle volume

                osc1.start();
                osc2.start();

                // Ring for 2 seconds
                setTimeout(() => {
                    osc1.stop();
                    osc2.stop();
                }, 2000);
            };

            playRing();

            // Transition to connected after 3 seconds (1 ring + pause)
            const timeout = setTimeout(() => {
                setCallStatus('connected');
                audioCtx.close();
            }, 3000);

            return () => {
                clearTimeout(timeout);
                audioCtx.close();
            };
        }
    }, [callStatus]);

    // Handle Call Time
    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (callStatus === 'connected') {
            interval = setInterval(() => setCallTime(prev => prev + 1), 1000);
        }
        return () => clearInterval(interval);
    }, [callStatus]);

    // Handle Transcript Audio Sync
    useEffect(() => {
        if (callStatus === 'connected' && currentIndex < simulationScript.length) {
            const line = simulationScript[currentIndex];
            setTranscript(prev => [...prev, line]);

            const utterance = new SpeechSynthesisUtterance(line.split(': ')[1]);

            // Try to assign distinct voices to make it realistic
            const voices = window.speechSynthesis.getVoices();
            if (voices.length > 0) {
                if (line.startsWith('AI:')) {
                    // Find a crisp female voice for AI if available
                    utterance.voice = voices.find(v => v.name.includes('Female') || v.name.includes('Zira') || v.name.includes('Samantha') || v.name.includes('Google')) || voices[0];
                    utterance.pitch = 1.1;
                    utterance.rate = 1.05;
                } else {
                    // Find a standard male voice for the user
                    utterance.voice = voices.find(v => v.name.includes('Male') || v.name.includes('David') || v.name.includes('Alex')) || voices[0];
                    utterance.pitch = 0.9;
                    utterance.rate = 1.0;
                }
            }

            // Move to next line when done speaking
            utterance.onend = () => {
                setTimeout(() => {
                    if (callStatus === 'connected') { // Check if hasn't hung up
                        setCurrentIndex(idx => idx + 1);
                    }
                }, 800); // Natural pause between speakers
            };

            window.speechSynthesis.speak(utterance);

            return () => {
                utterance.onend = null; // cleanup
            };
        } else if (callStatus === 'connected' && currentIndex >= simulationScript.length) {
            // End of script
            const hangupTimeout = setTimeout(() => setCallStatus('idle'), 2000);
            return () => clearTimeout(hangupTimeout);
        }
    }, [callStatus, currentIndex]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <section className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-12 py-32 lg:py-48 relative z-10 border-t border-gray-100">
            <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">

                {/* Simulated Phone Interface */}
                <div className="flex-1 w-full flex justify-center lg:justify-end z-20">
                    <div className="relative w-full max-w-[340px] sm:max-w-[380px] bg-white rounded-[3rem] p-4 sm:p-6 shadow-[0_40px_100px_-20px_rgba(37,99,235,0.25)] border-[8px] sm:border-[12px] border-gray-900 overflow-hidden transform hover:-translate-y-2 transition-transform duration-700">
                        {/* Status Bar */}
                        <div className="flex justify-between items-center px-4 pt-2 pb-6">
                            <span className="text-[10px] font-bold text-gray-900">9:41</span>
                            <div className="flex gap-1.5 opacity-80">
                                <div className="w-4 h-3 bg-gray-900 rounded-sm"></div>
                                <div className="w-3 h-3 bg-gray-900 rounded-sm"></div>
                            </div>
                        </div>

                        {/* Caller Info */}
                        <div className="flex flex-col items-center mb-8">
                            <div className="w-20 h-20 bg-gradient-to-tr from-blue-100 to-indigo-50 rounded-full flex items-center justify-center border-4 border-white shadow-md mb-4 text-blue-600">
                                <Sparkles size={32} />
                            </div>
                            <h3 className="text-2xl font-black text-gray-900 mb-1 tracking-tight">AOTMS Agent</h3>
                            <span className="text-sm font-bold text-blue-600 animate-pulse">
                                {callStatus === 'idle' ? 'Ready to connect' : callStatus === 'ringing' ? 'Ringing...' : formatTime(callTime)}
                            </span>
                        </div>

                        {/* Transcript Area */}
                        <div className="h-64 sm:h-72 w-full bg-gray-50 rounded-2xl p-4 overflow-y-auto mb-8 border border-gray-200/60 shadow-inner flex flex-col gap-3 scroll-smooth">
                            {callStatus === 'idle' && transcript.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 gap-2">
                                    <Mic size={24} className="opacity-50" />
                                    <span className="text-xs font-bold uppercase tracking-widest">Tap dial to simulate</span>
                                </div>
                            ) : (
                                transcript.map((line, i) => (
                                    <div key={i} className={`p-3 rounded-2xl text-[13px] font-medium leading-relaxed max-w-[90%] shadow-sm ${line.startsWith('User:') ? 'bg-blue-600 text-white self-end rounded-br-sm' : 'bg-white text-gray-700 self-start rounded-bl-sm border border-gray-100'}`}>
                                        {line.split(': ')[1]}
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-center gap-6 pb-4">
                            <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 cursor-not-allowed">
                                <Volume2 size={24} />
                            </div>
                            <div
                                onClick={toggleCall}
                                className={`w-16 h-16 rounded-full flex items-center justify-center text-white cursor-pointer hover:scale-105 transition-transform shadow-lg ${callStatus !== 'idle' ? 'bg-red-500 hover:bg-red-600 shadow-red-500/30' : 'bg-green-500 hover:bg-green-600 shadow-green-500/30'}`}
                            >
                                <Phone size={28} className={callStatus !== 'idle' ? "rotate-[135deg] transition-transform duration-300" : ""} />
                            </div>
                            <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 cursor-not-allowed">
                                <Mic size={24} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right/Left Text Content */}
                <div className="flex-1 w-full text-center lg:text-left z-20">
                    <span className="text-indigo-600 font-bold tracking-widest uppercase text-xs sm:text-sm">Experience The Engine</span>
                    <h2 className="text-4xl sm:text-5xl lg:text-7xl font-black text-gray-900 mt-4 mb-6 tracking-tight leading-[1.05]">
                        You won't believe <br className="hidden lg:block" /> it's <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">code.</span>
                    </h2>
                    <p className="text-gray-500 text-lg sm:text-xl font-medium max-w-xl mx-auto lg:mx-0 leading-relaxed mb-8 sm:mb-12">
                        We eliminated robotically stiff voices by injecting breathing artifacts, natural pauses, and emotionally intelligent inflection into our native TTS bridge.
                    </p>
                    <div className="inline-flex items-center gap-3 px-5 py-3 rounded-2xl bg-blue-50 border border-blue-100 text-blue-700 font-bold shadow-sm">
                        <Volume2 size={20} className="animate-pulse" />
                        <span>Interactive Audio Simulation</span>
                    </div>
                </div>

            </div>
        </section>
    );
}
