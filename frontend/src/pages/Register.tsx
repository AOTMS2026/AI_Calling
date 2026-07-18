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
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <Card className="w-full max-w-2xl">
                <CardHeader className="text-center space-y-2 pb-2">
                    <div className="flex justify-center mb-2">
                        <div className="h-12 w-12 bg-primary-50 rounded-xl flex items-center justify-center text-primary-600">
                            <Activity size={24} />
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold">Create an account</CardTitle>
                    <p className="text-sm text-gray-500">Sign up to start your AI calling campaigns</p>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">

                        {errorResponse && <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md border border-red-100">{errorResponse}</div>}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label="Full Name"
                                name="name"
                                placeholder="Ravi Kumar"
                                value={formData.name}
                                onChange={handleChange}
                                error={errors.name}
                            />

                            <Input
                                label="Phone Number"
                                name="phone"
                                maxLength={10}
                                placeholder="9876543210"
                                value={formData.phone}
                                onChange={handleChange}
                                error={errors.phone}
                            />

                            <Input
                                label="Email Address"
                                type="email"
                                name="email"
                                placeholder="name@company.com"
                                value={formData.email}
                                onChange={handleChange}
                                error={errors.email}
                            />

                            <div className="w-full">
                                <Input
                                    label="Password"
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    error={errors.password}
                                    rightElement={
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="text-gray-400 hover:text-gray-600 focus:outline-none"
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    }
                                />
                                {/* Password Strength Meter */}
                                {formData.password && (
                                    <div className="mt-2 text-xs">
                                        <div className="flex gap-1 h-1.5 mt-1">
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
                                        <div className="text-gray-500 mt-1 flex justify-between">
                                            <span>
                                                {strength <= 2 ? 'Weak' : strength <= 4 ? 'Moderate' : 'Strong'}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="w-full md:w-1/2 mx-auto pt-2">
                            <Input
                                label="Confirm Password"
                                type={showConfirmPassword ? "text" : "password"}
                                name="confirm_password"
                                value={formData.confirm_password}
                                onChange={handleChange}
                                error={errors.confirm_password}
                                rightElement={
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="text-gray-400 hover:text-gray-600 focus:outline-none"
                                    >
                                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                }
                            />
                        </div>

                        <div className="pt-2">
                            <Button type="submit" className="w-full md:w-1/2 mx-auto flex" disabled={loading}>
                                {loading ? 'Registering...' : 'Register'}
                            </Button>
                        </div>

                    </form>

                    <div className="text-center mt-6 text-sm text-gray-600">
                        Already have an account?{' '}
                        <Link to="/login" className="text-primary-600 font-medium hover:underline">
                            Log in
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
