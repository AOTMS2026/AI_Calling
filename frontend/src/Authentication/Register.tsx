import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { apiClient } from '../api/client';
import { Activity, Eye, EyeOff } from 'lucide-react';

export function Register() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [errorResponse, setErrorResponse] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        confirm_password: ''
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const calculateStrength = (pass: string) => {
        let score = 0;
        if (!pass) return 0;
        if (pass.length >= 8) score += 1;
        if (/[A-Z]/.test(pass)) score += 1;
        if (/[a-z]/.test(pass)) score += 1;
        if (/\d/.test(pass)) score += 1;
        if (/\W/.test(pass)) score += 1;
        return score;
    };

    const strength = calculateStrength(formData.password);

    const validate = () => {
        let isValid = true;
        const newErrors: Record<string, string> = {};

        if (formData.name.length < 3) {
            newErrors.name = 'Name must be at least 3 characters.';
            isValid = false;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email address.';
            isValid = false;
        }

        if (!/^\d{10}$/.test(formData.phone)) {
            newErrors.phone = 'Phone number must be exactly 10 digits.';
            isValid = false;
        }

        const pass = formData.password;
        if (strength < 5) {
            newErrors.password = 'Password must be 8+ chars and contain upper, lower, number, and special character.';
            isValid = false;
        }

        if (pass !== formData.confirm_password) {
            newErrors.confirm_password = 'Passwords do not match.';
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        if (name === 'phone' && !/^\d*$/.test(value)) return;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorResponse('');
        if (!validate()) return;

        setLoading(true);
        try {
            await apiClient.post('/auth/register', formData);
            sessionStorage.setItem('pending_verification_email', formData.email);
            navigate('/verify-otp');
        } catch (err: any) {
            setErrorResponse(err.response?.data?.detail || 'Failed to register. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#fafbfc] flex flex-col font-sans relative overflow-hidden select-none py-10">
            {/* Ambient Backgrounds */}
            <div className="absolute inset-0 pointer-events-none z-0">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-400/10 blur-[130px] rounded-full"></div>
                <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-indigo-400/10 blur-[150px] rounded-full"></div>
            </div>
            {/* Grid Pattern overlay */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>

            {/* Navbar Branding */}
            <nav className="relative z-50 px-8 py-2 w-full flex justify-start">
                <Link to="/" className="flex items-center gap-3 group">
                    <img src="/atm-logo.jpeg" alt="AOTMS Logo" className="w-10 h-10 object-cover rounded-xl shadow-md ring-1 ring-gray-900/10 group-hover:scale-105 transition-transform" />
                    <div className="flex flex-col justify-center">
                        <span className="text-xl font-black tracking-tighter text-gray-900 leading-none group-hover:text-blue-600 transition-colors">AOTMS.</span>
                        <span className="text-[9px] font-bold text-gray-400 tracking-widest uppercase mt-1">by sneha.ai</span>
                    </div>
                </Link>
            </nav>

            <div className="flex-1 flex items-center justify-center p-4 relative z-10 w-full mt-4">
                <div className="w-full max-w-[560px] bg-white/80 backdrop-blur-3xl rounded-[2.5rem] p-8 sm:p-12 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.1)] border border-white relative">
                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-black tracking-tight text-gray-900 mb-2">Create deployment</h2>
                        <p className="text-sm font-medium text-gray-500">Sign up to orchestrate AI campaigns</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {errorResponse && (
                            <div className="p-4 text-[13px] font-bold text-red-600 bg-red-50/80 rounded-xl border border-red-100 flex items-center justify-center text-center">
                                {errorResponse}
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {/* Full Name */}
                            <div>
                                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2 pl-1">Full Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    placeholder="Ravi Kumar"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-3 bg-gray-50 border ${errors.name ? 'border-red-400 focus:ring-red-500/20' : 'border-gray-200 focus:ring-blue-500/20 focus:border-blue-500'} rounded-2xl text-sm font-medium text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 transition-all`}
                                />
                                {errors.name && <span className="text-[10px] font-bold text-red-500 mt-1 block pl-1">{errors.name}</span>}
                            </div>

                            {/* Phone */}
                            <div>
                                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2 pl-1">Phone Number</label>
                                <input
                                    type="text"
                                    name="phone"
                                    maxLength={10}
                                    placeholder="9876543210"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-3 bg-gray-50 border ${errors.phone ? 'border-red-400 focus:ring-red-500/20' : 'border-gray-200 focus:ring-blue-500/20 focus:border-blue-500'} rounded-2xl text-sm font-medium text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 transition-all`}
                                />
                                {errors.phone && <span className="text-[10px] font-bold text-red-500 mt-1 block pl-1">{errors.phone}</span>}
                            </div>

                            {/* Email */}
                            <div className="md:col-span-2">
                                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2 pl-1">Email Address</label>
                                <input
                                    type="email"
                                    name="email"
                                    placeholder="name@company.com"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-3 bg-gray-50 border ${errors.email ? 'border-red-400 focus:ring-red-500/20' : 'border-gray-200 focus:ring-blue-500/20 focus:border-blue-500'} rounded-2xl text-sm font-medium text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 transition-all`}
                                />
                                {errors.email && <span className="text-[10px] font-bold text-red-500 mt-1 block pl-1">{errors.email}</span>}
                            </div>

                            {/* Password */}
                            <div>
                                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2 pl-1">Password</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        name="password"
                                        placeholder="••••••••"
                                        value={formData.password}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-3 pr-10 bg-gray-50 border ${errors.password ? 'border-red-400 focus:ring-red-500/20' : 'border-gray-200 focus:ring-blue-500/20 focus:border-blue-500'} rounded-2xl text-sm font-medium text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 transition-all`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                                {errors.password ? (
                                    <span className="text-[10px] font-bold text-red-500 mt-1 block pl-1">{errors.password}</span>
                                ) : formData.password && (
                                    <div className="mt-2 text-[10px] pl-1">
                                        <div className="flex gap-1 h-1 mt-1">
                                            {[1, 2, 3, 4, 5].map((level) => (
                                                <div
                                                    key={level}
                                                    className={`flex-1 rounded-full ${strength >= level
                                                        ? strength <= 2 ? 'bg-red-400' : strength <= 4 ? 'bg-amber-400' : 'bg-green-500'
                                                        : 'bg-gray-200'
                                                        }`}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Confirm Password */}
                            <div>
                                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2 pl-1">Confirm Password</label>
                                <div className="relative">
                                    <input
                                        type={showConfirmPassword ? "text" : "password"}
                                        name="confirm_password"
                                        placeholder="••••••••"
                                        value={formData.confirm_password}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-3 pr-10 bg-gray-50 border ${errors.confirm_password ? 'border-red-400 focus:ring-red-500/20' : 'border-gray-200 focus:ring-blue-500/20 focus:border-blue-500'} rounded-2xl text-sm font-medium text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 transition-all`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                                {errors.confirm_password && <span className="text-[10px] font-bold text-red-500 mt-1 block pl-1">{errors.confirm_password}</span>}
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 rounded-2xl bg-gray-900 hover:bg-black text-white text-[15px] font-bold shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                        >
                            {loading ? 'Registering...' : 'Complete Registration'}
                        </button>
                    </form>

                    <div className="text-center mt-8">
                        <span className="text-sm font-medium text-gray-500">
                            Already have an account?{' '}
                            <Link to="/login" className="text-blue-600 font-bold hover:text-blue-700 transition-colors">
                                Log in
                            </Link>
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
