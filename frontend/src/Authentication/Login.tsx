import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { apiClient } from '../api/client';
import { Eye, EyeOff, AlertCircle, CheckCircle2, HelpCircle } from 'lucide-react';
import { authClient } from '../lib/auth-client';

export function Login() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [forgotPasswordStep, setForgotPasswordStep] = useState<0 | 1 | 2>(0); // 0=login, 1=email, 2=otp

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        otp: '',
        new_password: '',
        confirm_password: '',
        orgId: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
        if (errorMsg) setErrorMsg('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg('');
        setSuccessMsg('');

        if (forgotPasswordStep === 1) {
            if (!formData.email) {
                setErrorMsg('Please enter your email address.');
                return;
            }
            setLoading(true);
            try {
                // Trigger Backend -> which delegates securely to the Testing N8N Webhook Endpoint
                await apiClient.post('/auth/forgot-password', { email: formData.email });

                setSuccessMsg('Reset OTP sent! Please check your email inbox.');
                setForgotPasswordStep(2);
            } catch (err) {
                console.error(err);
                setErrorMsg('Failed to send reset link. Please try again.');
            } finally {
                setLoading(false);
            }
            return;
        }

        if (forgotPasswordStep === 2) {
            if (!formData.otp || !formData.new_password || !formData.confirm_password) {
                setErrorMsg('Please enter your OTP and new passwords.');
                return;
            }
            if (formData.new_password !== formData.confirm_password) {
                setErrorMsg('New passwords do not match.');
                return;
            }
            setLoading(true);
            try {
                // Delegate exactly to backend verification logic
                await apiClient.post('/auth/reset-password', {
                    email: formData.email,
                    code: formData.otp,
                    new_password: formData.new_password,
                    confirm_password: formData.confirm_password
                });
                setSuccessMsg('Verified successfully! Redirecting...');
                setTimeout(() => setForgotPasswordStep(0), 1500); // return to login after success
            } catch (err: any) {
                setErrorMsg(err.response?.data?.detail || 'Invalid details. Please try again.');
            } finally {
                setLoading(false);
            }
            return;
        }

        if (!formData.email || !formData.password) {
            setErrorMsg('Please enter both email and password.');
            return;
        }

        setLoading(true);
        try {
            const res = await apiClient.post('/auth/login', formData);
            localStorage.setItem('accessToken', res.data.access_token);
            localStorage.setItem('refreshToken', res.data.refresh_token);
            localStorage.setItem('role', res.data.role);
            if (res.data.ravan_agent_id) {
                localStorage.setItem('ravanAgentId', res.data.ravan_agent_id);
            }

            // Auto-redirect to dashboard directly as requested
            navigate('/dashboard');
        } catch (err: any) {
            setErrorMsg(err.response?.data?.detail || 'Invalid email or password.');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setErrorMsg('');
        setSuccessMsg('');
        setLoading(true);
        try {
            await authClient.signIn.social({
                provider: "google",
                callbackURL: window.location.origin + "/dashboard"
            });
        } catch (err: any) {
            console.error("Google Auth error:", err);
            setErrorMsg(err.message || 'Google Authentication failed.');
        } finally {
            setLoading(false);
        }
    };

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
                <Link to="/" className="flex items-center gap-3 group">
                    <img src="/atm-logo.jpeg" alt="AOTMS Logo" className="w-10 h-10 object-cover rounded-xl shadow-md ring-1 ring-gray-900/10 group-hover:scale-105 transition-transform" />
                    <div className="flex flex-col justify-center">
                        <span className="text-xl font-black tracking-tighter text-gray-900 leading-none group-hover:text-blue-600 transition-colors">AOTMS.</span>
                        <span className="text-[9px] font-bold text-gray-400 tracking-widest uppercase mt-1">by sneha.ai</span>
                    </div>
                </Link>
            </nav>

            <div className="flex-1 flex items-center justify-center p-4 relative z-10 w-full">
                <div className="w-full max-w-[420px] bg-white/80 backdrop-blur-3xl rounded-[2.5rem] p-8 sm:p-12 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.1)] border border-white relative">
                    <div className="text-center mb-10">
                        <h2 className="text-3xl font-black tracking-tight text-gray-900 mb-2">
                            {forgotPasswordStep === 0 ? 'Welcome back' : forgotPasswordStep === 1 ? 'Reset Password' : 'Enter OTP'}
                        </h2>
                        <p className="text-sm font-medium text-gray-500">
                            {forgotPasswordStep === 0 ? 'Sign in to your AOTMS dashboard' : forgotPasswordStep === 1 ? 'Enter your email to receive a secure OTP via n8n' : 'Enter the 6-digit verification code'}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {errorMsg && (
                            <div className="p-4 bg-red-50/80 rounded-2xl border border-red-100 flex items-start gap-3 shadow-sm">
                                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                                <div className="flex flex-col">
                                    <span className="text-[13px] font-bold text-red-900 leading-tight">Authentication Error</span>
                                    <span className="text-[13px] font-medium text-red-700 mt-1">{errorMsg}</span>
                                    <div className="w-full h-px bg-red-200/60 my-2"></div>
                                    <span className="text-[11px] font-bold text-red-500 uppercase tracking-widest flex items-center gap-1 cursor-pointer hover:text-red-600 transition-colors">
                                        <HelpCircle className="w-3 h-3" /> contact support@sneha.ai
                                    </span>
                                </div>
                            </div>
                        )}
                        {successMsg && (
                            <div className="p-4 bg-emerald-50/80 rounded-2xl border border-emerald-100 flex items-start gap-3 shadow-sm">
                                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                                <div className="flex flex-col">
                                    <span className="text-[13px] font-bold text-emerald-900 leading-tight">Action Successful</span>
                                    <span className="text-[13px] font-medium text-emerald-700 mt-1">{successMsg}</span>
                                </div>
                            </div>
                        )}

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 pl-1">Email Address</label>
                                <input
                                    type="email"
                                    name="email"
                                    required
                                    disabled={forgotPasswordStep === 2}
                                    placeholder="name@company.com"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className={`w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${forgotPasswordStep === 2 ? 'opacity-60 cursor-not-allowed' : ''}`}
                                />
                            </div>



                            {forgotPasswordStep === 2 && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 pl-1">Verification OTP</label>
                                        <input
                                            type="text"
                                            name="otp"
                                            required
                                            placeholder="123456"
                                            value={formData.otp}
                                            onChange={handleChange}
                                            className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium tracking-[0.2em] text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-center"
                                        />
                                    </div>
                                    <div className="relative">
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 pl-1">New Password</label>
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            name="new_password"
                                            required
                                            placeholder="••••••••"
                                            value={formData.new_password}
                                            onChange={handleChange}
                                            className="w-full px-5 py-3.5 pr-12 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-10 text-gray-400 hover:text-gray-600 transition-colors"
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 pl-1">Confirm Password</label>
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            name="confirm_password"
                                            required
                                            placeholder="••••••••"
                                            value={formData.confirm_password}
                                            onChange={handleChange}
                                            className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                        />
                                    </div>
                                </div>
                            )}

                            {forgotPasswordStep === 0 && (
                                <div>
                                    <div className="flex justify-between items-center mb-2 pl-1 pr-1">
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Password</label>
                                        <button type="button" onClick={() => { setForgotPasswordStep(1); setErrorMsg(''); setSuccessMsg(''); }} className="text-[11px] font-bold text-blue-600 hover:text-blue-700 transition-colors">Forgot?</button>
                                    </div>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            name="password"
                                            required={forgotPasswordStep === 0}
                                            placeholder="••••••••"
                                            value={formData.password}
                                            onChange={handleChange}
                                            className="w-full px-5 py-3.5 pr-12 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 rounded-2xl bg-gray-900 hover:bg-black text-white text-[15px] font-bold shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                        >
                            {loading ? (forgotPasswordStep > 0 ? 'Processing...' : 'Authenticating...') : (forgotPasswordStep === 1 ? 'Send Reset OTP' : forgotPasswordStep === 2 ? 'Verify OTP' : 'Sign In')}
                        </button>

                        {forgotPasswordStep === 0 && (
                            <>
                                <div className="relative my-4 flex items-center justify-center">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-gray-200"></div>
                                    </div>
                                    <span className="relative px-3 bg-white text-xs font-bold text-gray-400 uppercase tracking-widest">or</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleGoogleSignIn}
                                    className="w-full py-4 rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-[15px] font-bold shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-3 transform hover:-translate-y-0.5"
                                >
                                    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                    </svg>
                                    Sign in with Google
                                </button>
                            </>
                        )}

                        {forgotPasswordStep > 0 && (
                            <div className="text-center mt-4">
                                <button type="button" onClick={() => { setForgotPasswordStep(0); setSuccessMsg(''); setErrorMsg(''); }} className="text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors">
                                    Return to login
                                </button>
                            </div>
                        )}
                    </form>

                    <div className="text-center mt-10">
                        <span className="text-sm font-medium text-gray-500">
                            Don't have an account?{' '}
                            <Link to="/register" className="text-blue-600 font-bold hover:text-blue-700 transition-colors">
                                Create deployment
                            </Link>
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
