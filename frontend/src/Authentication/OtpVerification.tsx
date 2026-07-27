import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, ArrowRight } from 'lucide-react';
import { apiClient } from '../api/client';

export function OtpVerification() {
    const navigate = useNavigate();
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [successToast, setSuccessToast] = useState(false);
    const [timer, setTimer] = useState(60);

    const email = sessionStorage.getItem('pending_verification_email') || '';
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        if (!email) {
            navigate('/register');
        }
    }, [email, navigate]);

    useEffect(() => {
        let interval: any;
        if (timer > 0) {
            interval = setInterval(() => setTimer(prev => prev - 1), 1000);
        }
        return () => clearInterval(interval);
    }, [timer]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
        const val = e.target.value;
        if (/[^0-9]/.test(val)) return; // numbers only

        const newOtp = [...otp];
        newOtp[index] = val;
        setOtp(newOtp);

        // Auto next
        if (val && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
        if (!pastedData) return;

        const newOtp = [...otp];
        pastedData.split('').forEach((char, i) => {
            newOtp[i] = char;
        });
        setOtp(newOtp);
        // Focus last filled input
        const focusIndex = Math.min(pastedData.length, 5);
        inputRefs.current[focusIndex]?.focus();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg('');
        const code = otp.join('');
        if (code.length !== 6) {
            setErrorMsg('Please enter all 6 digits.');
            return;
        }

        setLoading(true);
        try {
            await apiClient.post('/auth/verify-otp', { email, code });
            sessionStorage.removeItem('pending_verification_email');

            // Trigger the native slick white toast
            setSuccessToast(true);

            // Route to dashboard seamlessly after they see the success response
            setTimeout(() => {
                navigate('/dashboard');
            }, 1800);

        } catch (err: any) {
            setErrorMsg(err.response?.data?.detail || 'Invalid or expired OTP.');
        } finally {
            setLoading(false);
        }
    };

    const handleResend = () => {
        setTimer(60);
        // Call resend endpoint if available 
        // Example: apiClient.post('/auth/resend-otp', { email })
    }

    return (
        <div className="min-h-screen bg-[#fafbfc] flex flex-col font-sans relative overflow-hidden select-none">
            {/* Ambient Backgrounds */}
            <div className="absolute inset-0 pointer-events-none z-0">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-400/10 blur-[130px] rounded-full"></div>
                <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-indigo-400/10 blur-[150px] rounded-full"></div>
            </div>
            {/* Grid Pattern overlay */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>

            {/* Navbar Branding */}
            <nav className="relative z-50 px-8 py-6 w-full flex justify-start">
                <div className="flex items-center gap-3 group cursor-pointer" onClick={() => navigate('/')}>
                    <img src="/atm-logo.jpeg" alt="AOTMS Logo" className="w-10 h-10 object-cover rounded-xl shadow-md ring-1 ring-gray-900/10 group-hover:scale-105 transition-transform" />
                    <div className="flex flex-col justify-center">
                        <span className="text-xl font-black tracking-tighter text-gray-900 leading-none group-hover:text-blue-600 transition-colors">AOTMS.</span>
                        <span className="text-[9px] font-bold text-gray-400 tracking-widest uppercase mt-1">by sneha.ai</span>
                    </div>
                </div>
            </nav>

            <div className="flex-1 flex items-center justify-center p-4 relative z-10 w-full">
                <div className="w-full max-w-[480px] bg-white/80 backdrop-blur-3xl rounded-[2.5rem] p-8 sm:p-12 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.1)] border border-white relative">

                    <div className="text-center mb-10 relative">
                        <div className="mx-auto w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-blue-100">
                            <ShieldCheck className="w-8 h-8 text-blue-600" />
                        </div>
                        <h2 className="text-3xl font-black tracking-tight text-gray-900 mb-2">Verify account</h2>
                        <p className="text-sm font-medium text-gray-500">
                            We dispatch a secure 6-digit code to<br /><span className="text-gray-900 font-bold">{email}</span>
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        {errorMsg && (
                            <div className="p-4 bg-red-50/80 rounded-2xl border border-red-100 flex items-start gap-3 shadow-sm">
                                <div className="flex flex-col">
                                    <span className="text-[13px] font-bold text-red-900 leading-tight">Verification Error</span>
                                    <span className="text-[13px] font-medium text-red-700 mt-1">{errorMsg}</span>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-between items-center space-x-2 sm:space-x-3">
                            {otp.map((digit, i) => (
                                <input
                                    key={i}
                                    ref={el => { inputRefs.current[i] = el; }}
                                    type="text"
                                    maxLength={1}
                                    autoComplete="off"
                                    className="w-12 h-16 sm:w-14 sm:h-16 bg-gray-50 border border-gray-200 rounded-2xl text-center text-xl font-black text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                                    value={digit}
                                    onChange={e => handleChange(e, i)}
                                    onKeyDown={e => handleKeyDown(e, i)}
                                    onPaste={handlePaste}
                                    autoFocus={i === 0}
                                />
                            ))}
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 rounded-2xl bg-gray-900 hover:bg-black text-white text-[15px] font-bold shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? 'Authenticating...' : 'Confirm Registration'}
                            {!loading && <ArrowRight className="w-4 h-4" />}
                        </button>
                    </form>

                    <div className="text-center mt-8">
                        {timer > 0 ? (
                            <p className="text-sm font-bold text-gray-400">
                                Resend verification in <span className="text-blue-600">{timer}s</span>
                            </p>
                        ) : (
                            <button type="button" onClick={handleResend} className="text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors uppercase tracking-wider">
                                Resend secure code
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Custom Bottom-Right Toast */}
            {successToast && (
                <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
                    <div className="bg-white px-6 py-4 rounded-xl shadow-2xl border border-gray-100 flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                            <ShieldCheck className="w-4 h-4 text-green-600" />
                        </div>
                        <p className="text-gray-900 font-bold text-sm tracking-wide">Account Verified Successfully!</p>
                    </div>
                </div>
            )}
        </div>
    );
}
