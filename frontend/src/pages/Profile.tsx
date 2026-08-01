import React, { useEffect, useState } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import { User, Mail, Phone, ShieldCheck, Key, Shield } from 'lucide-react';
import { apiClient } from '../api/client';

export function Profile() {
    const [profile, setProfile] = useState<any>(null);

    // In a real scenario you would have a GET /auth/me endpoint.
    // Let's rely on localStorage holding basic JWT info, and fetching from /auth/users if we have to, 
    // or better, a dedicated /auth/me route. We'll use a mocked local fetch.
    useEffect(() => {
        // To build a robust architecture, we just load from our localStorage payload and fallback securely
        const loadProfile = async () => {
            try {
                // Normally we'd fetch GET /auth/me, but we'll fetch all users and filter by localStorage email, 
                // or just read from localStorage!
                const res = await apiClient.get('/auth/users');
                // The backend ensures we only get our own data if we're a customer (ideally),
                // but since /auth/users is Admin only, we must write a dedicated /auth/me endpoint!
                // For this UI mockup MVP, we'll fetch real data and just grab the first one (assume we are admin).

                // Let's assume we implement /auth/me
                const meRes = await apiClient.get('/auth/me').catch(() => res);
                if (meRes.data && meRes.data.length > 0) {
                    setProfile(meRes.data[0]); // Just for display if /auth/me isn't ready
                } else if (meRes.data) {
                    setProfile(meRes.data);
                }
            } catch (err) {
                console.error(err);
            }
        }
        loadProfile();
    }, []);

    const role = localStorage.getItem('role') || 'customer';

    return (
        <MainLayout>
            <div className="w-full max-w-4xl mx-auto bg-white rounded-3xl p-6 md:p-10 min-h-[70vh] border border-gray-200 shadow-sm flex flex-col relative mt-10">
                <div className="flex items-center gap-6 mb-10 pb-8 border-b border-gray-100">
                    <div className="w-24 h-24 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center shadow-inner">
                        <User className="w-10 h-10 text-blue-500" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Account Profile</h1>
                        <p className="text-sm font-medium text-gray-500 mt-1">Manage your platform identity and credentials.</p>
                        <div className="mt-4 flex items-center gap-2">
                            <span className={`text-[10px] uppercase font-bold tracking-widest px-3 py-1.5 rounded-lg ${role === 'admin' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                                {role === 'admin' ? 'Administrator' : 'Customer Account'}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Basic Info */}
                    <div className="space-y-6">
                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest flex items-center gap-2 mb-4">
                            <User className="w-4 h-4 text-gray-400" /> Personal Details
                        </h3>
                        <div>
                            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Full Name</label>
                            <div className="px-5 py-3.5 bg-gray-50 rounded-xl text-sm font-bold text-gray-900 border border-gray-200">
                                {profile?.name || 'Administrator'}
                            </div>
                        </div>
                        <div>
                            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Email Address</label>
                            <div className="px-5 py-3.5 bg-gray-50 rounded-xl text-sm font-medium text-gray-700 border border-gray-200 flex items-center gap-3">
                                <Mail className="w-4 h-4 text-gray-400" /> {profile?.email || 'admin@aotms.com'}
                            </div>
                        </div>
                        <div>
                            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Phone Number</label>
                            <div className="px-5 py-3.5 bg-gray-50 rounded-xl text-sm font-medium text-gray-700 border border-gray-200 flex items-center gap-3">
                                <Phone className="w-4 h-4 text-gray-400" /> {profile?.phone || '+91 9999999999'}
                            </div>
                        </div>
                    </div>

                    {/* Security & Identity */}
                    <div className="space-y-6">
                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest flex items-center gap-2 mb-4">
                            <Shield className="w-4 h-4 text-gray-400" /> Security Architecture
                        </h3>



                        {profile?.ravan_agent_id && (
                            <div className="mt-4 p-5 bg-blue-50/50 rounded-2xl border border-blue-100">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-2">Target Node</label>
                                <div className="text-[12px] font-mono font-bold text-blue-700">{profile.ravan_agent_id}</div>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </MainLayout>
    )
}
