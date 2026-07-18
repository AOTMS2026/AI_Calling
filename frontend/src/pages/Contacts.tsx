import { useState, useEffect } from 'react';
import type { ChangeEvent } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { apiClient } from '../api/client';
import { Upload } from 'lucide-react';

export function Contacts() {
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [uploadProgress, setUploadProgress] = useState<number | null>(null);

    const fetchContacts = async () => {
        try {
            const res = await apiClient.get('/contacts/');
            setContacts(res.data);
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        fetchContacts();
    }, []);

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!file) return;
        setLoading(true);
        setUploadProgress(0);
        const formData = new FormData();
        formData.append('file', file);
        try {
            const response = await apiClient.post('/contacts/bulk-upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            const jobId = response.data.job_id;

            // Poll for progress architecture
            const interval = setInterval(async () => {
                try {
                    const progRes = await apiClient.get(`/contacts/upload-progress/${jobId}`);
                    const data = progRes.data;

                    if (data.status === 'completed') {
                        clearInterval(interval);
                        setUploadProgress(100);
                        setTimeout(() => {
                            setUploadProgress(null);
                            setFile(null);
                            setLoading(false);
                            fetchContacts();
                        }, 800);
                    } else if (data.status === 'failed') {
                        clearInterval(interval);
                        setUploadProgress(null);
                        setLoading(false);
                        alert("Background processing failed: " + data.error);
                    } else {
                        setUploadProgress(data.progress || 0);
                    }
                } catch (err) {
                    console.error("Polling error", err);
                }
            }, 500); // Check every half second

        } catch (e: any) {
            console.error(e);
            alert(e.response?.data?.detail || "Upload failed.");
            setLoading(false);
            setUploadProgress(null);
        }
    };

    return (
        <MainLayout>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Contacts/Campaigns</h1>
                    <p className="text-sm text-gray-500 mt-1">Upload Excel (.xlsx) files with up to 1 Million rows.</p>
                </div>
                <div className="flex gap-3 items-center">
                    <label className="cursor-pointer inline-flex items-center justify-center px-4 py-2 bg-white text-gray-700 border border-gray-300 font-medium rounded-lg hover:bg-gray-50 transition-colors">
                        <Upload size={16} className="mr-2" /> Select Excel / CSV
                        <input type="file" accept=".xlsx, .xls, .csv" className="hidden" onChange={handleFileChange} />
                    </label>
                    <Button variant="primary" onClick={handleUpload} disabled={!file || loading}>
                        {uploadProgress !== null ? `Processing... ${uploadProgress}%` : (loading ? 'Uploading...' : 'Bulk Upload')}
                    </Button>
                </div>
            </div>

            {file && <div className="mb-6 text-sm text-gray-700 font-medium tracking-tight bg-blue-50/50 p-4 rounded-xl border border-blue-100 flex items-center justify-between">
                <span>Selected file: {file.name}</span>
                <button className="text-red-500 hover:underline" onClick={() => setFile(null)}>Remove</button>
            </div>}

            <Card>
                <CardContent className="p-0 overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-gray-50/50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-gray-900">Name</th>
                                <th className="px-6 py-4 font-semibold text-gray-900">Phone</th>
                                <th className="px-6 py-4 font-semibold text-gray-900">Email</th>
                                <th className="px-6 py-4 font-semibold text-gray-900">Branch</th>
                                <th className="px-6 py-4 font-semibold text-gray-900">Qualification</th>
                                <th className="px-6 py-4 font-semibold text-gray-900">District</th>
                            </tr>
                        </thead>
                        <tbody>
                            {contacts.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">No contacts found. Upload an Excel to get started.</td>
                                </tr>
                            ) : (
                                contacts.map((c: any) => (
                                    <tr key={c.phone} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4 text-gray-900 font-medium">{c.first_name || ''} {c.last_name || ''}</td>
                                        <td className="px-6 py-4 text-gray-500">{c.phone}</td>
                                        <td className="px-6 py-4 text-gray-500">{c.email || '-'}</td>
                                        <td className="px-6 py-4 text-gray-500">{c.branch || '-'}</td>
                                        <td className="px-6 py-4 text-gray-500">{c.qualification || '-'}</td>
                                        <td className="px-6 py-4 text-gray-500">{c.district || '-'}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </CardContent>
            </Card>

        </MainLayout>
    );
}
