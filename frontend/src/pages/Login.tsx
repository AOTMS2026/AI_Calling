import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { apiClient } from '../api/client';
import { LogIn } from 'lucide-react';

export function Login() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
        if (errorMsg) setErrorMsg('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg('');

        if (!formData.email || !formData.password) {
            setErrorMsg('Please enter both email and password.');
            return;
        }

        setLoading(true);
        try {
            const res = await apiClient.post('/auth/login', formData);
            localStorage.setItem('accessToken', res.data.access_token);
            localStorage.setItem('refreshToken', res.data.refresh_token);

            // Auto-redirect to dashboard
            navigate('/dashboard');
        } catch (err: any) {
            setErrorMsg(err.response?.data?.detail || 'Invalid email or password.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center space-y-2 pb-2">
                    <div className="flex justify-center mb-2">
                        <div className="h-12 w-12 bg-primary-50 rounded-xl flex items-center justify-center text-primary-600">
                            <LogIn size={24} />
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
                    <p className="text-sm text-gray-500">Sign in to manage your AI campaigns</p>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">

                        {errorMsg && <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md border border-red-100">{errorMsg}</div>}

                        <Input
                            label="Email Address"
                            type="email"
                            name="email"
                            placeholder="name@company.com"
                            value={formData.email}
                            onChange={handleChange}
                        />

                        <div className="space-y-1">
                            <Input
                                label="Password"
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                            />
                            <div className="text-right">
                                <a href="#" className="text-xs text-primary-600 hover:underline">Forgot password?</a>
                            </div>
                        </div>

                        <Button type="submit" className="w-full h-11 mt-2" disabled={loading}>
                            {loading ? 'Signing in...' : 'Sign in'}
                        </Button>

                    </form>

                    <div className="text-center mt-6 text-sm text-gray-600">
                        Don't have an account?{' '}
                        <Link to="/register" className="text-primary-600 font-medium hover:underline">
                            Create one
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
