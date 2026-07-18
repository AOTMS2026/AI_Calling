import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { apiClient } from '../api/client';
import { ShieldCheck } from 'lucide-react';

export function OtpVerification() {
    const navigate = useNavigate();
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
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
            navigate('/login');
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
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center pb-2">
                    <div className="flex justify-center mb-2">
                        <div className="h-12 w-12 bg-green-50 rounded-xl flex items-center justify-center text-green-600">
                            <ShieldCheck size={24} />
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold">Verify your email</CardTitle>
                    <p className="text-sm text-gray-500 mt-2">
                        We've sent a 6-digit code to <span className="font-medium text-gray-900">{email}</span>
                    </p>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">

                        {errorMsg && <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md border border-red-100">{errorMsg}</div>}

                        <div className="flex justify-between items-center space-x-2">
                            {otp.map((digit, i) => (
                                <input
                                    key={i}
                                    ref={el => { inputRefs.current[i] = el; }}
                                    type="text"
                                    maxLength={1}
                                    autoComplete="off"
                                    className="w-12 h-14 text-center text-xl font-semibold border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                    value={digit}
                                    onChange={e => handleChange(e, i)}
                                    onKeyDown={e => handleKeyDown(e, i)}
                                    onPaste={handlePaste}
                                    autoFocus={i === 0}
                                />
                            ))}
                        </div>

                        <Button type="submit" className="w-full h-11" disabled={loading}>
                            {loading ? 'Verifying...' : 'Verify Email'}
                        </Button>

                    </form>

                    <div className="text-center mt-6 text-sm">
                        {timer > 0 ? (
                            <p className="text-gray-500">Resend code in {timer}s</p>
                        ) : (
                            <button type="button" onClick={handleResend} className="text-primary-600 font-medium hover:underline">
                                Resend Code
                            </button>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
