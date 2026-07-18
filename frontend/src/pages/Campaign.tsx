import { useState } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { apiClient } from '../api/client';
import { PlayCircle } from 'lucide-react';

export function Campaign() {
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        prompt: '',
        voice: 'alloy'
    });

    const handleChange = (e: any) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        setErrorMsg('');
        setSuccessMsg('');
        if (!formData.name) {
            setErrorMsg('Campaign name is required.');
            return;
        }

        setLoading(true);
        try {
            const res = await apiClient.post('/campaigns/create', formData);
            setSuccessMsg(`Campaign "${res.data.name}" was successfully created!`);
            // Simulating a quick start campaign execution
            await apiClient.post(`/campaigns/start/${res.data.id}`);
            setSuccessMsg(`Campaign "${res.data.name}" was created and officially queued!`);
        } catch (err: any) {
            setErrorMsg(err.response?.data?.detail || 'Failed to create campaign.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <MainLayout>
            <div className="max-w-2xl mx-auto">
                <h1 className="text-2xl font-bold text-gray-900 mb-6">New Campaign</h1>
                <Card>
                    <CardHeader>
                        <CardTitle>Campaign Configuration</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {errorMsg && <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md border border-red-100">{errorMsg}</div>}
                            {successMsg && <div className="p-3 text-sm text-green-600 bg-green-50 rounded-md border border-green-100">{successMsg}</div>}

                            <Input
                                label="Campaign Name"
                                name="name"
                                placeholder="e.g. Admission Follow-up Q3"
                                value={formData.name}
                                onChange={handleChange}
                            />

                            <div className="w-full flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-gray-700">AI Prompt Configuration</label>
                                <textarea
                                    name="prompt"
                                    rows={4}
                                    placeholder="You are a helpful assistant calling regarding admissions..."
                                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                                    value={formData.prompt}
                                    onChange={handleChange}
                                ></textarea>
                            </div>

                            <div className="w-full flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-gray-700">Voice Persona</label>
                                <select
                                    name="voice"
                                    value={formData.voice}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                                >
                                    <option value="alloy">Alloy (Neutral, professional)</option>
                                    <option value="echo">Echo (Warm, deep)</option>
                                    <option value="nova">Nova (Energetic, friendly)</option>
                                </select>
                            </div>

                            <div className="pt-4 flex items-center justify-end border-t border-gray-100">
                                <Button type="submit" disabled={loading} className="gap-2">
                                    <PlayCircle size={18} /> {loading ? 'Launching...' : 'Create & Start Campaign'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    );
}
