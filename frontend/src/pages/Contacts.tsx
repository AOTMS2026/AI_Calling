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
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        s_no: '', email: '', first_name: '', last_name: '', branch: '',
        qualification: '', institute_name: '', district: '', phone: ''
    });

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

    const handleManualSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await apiClient.post('/contacts/single', formData);
            fetchContacts();
            setIsModalOpen(false);
            setFormData({
                s_no: '', email: '', first_name: '', last_name: '', branch: '',
                qualification: '', institute_name: '', district: '', phone: ''
            });
            alert("Contact Successfully Added to PostgreSQL!");
        } catch (err: any) {
            console.error(err);
            alert(err.response?.data?.detail || "Failed to save contact.");
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <MainLayout>
            <div className="p-8 pb-32">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Contacts/Campaigns</h1>
                        <p className="text-sm text-gray-500 mt-1">Upload Excel (.xlsx) files with up to 1 Million rows.</p>
                    </div>
                    <div className="flex items-center space-x-4">
                        <Button variant="secondary" onClick={() => setIsModalOpen(true)}>
                            + Single Contact
                        </Button>
                        <label className="cursor-pointer bg-white px-4 py-2 border border-blue-200 text-blue-600 rounded-lg shadow-sm hover:bg-blue-50 transition-colors font-medium">
                            {file ? `Selected: ${file.name}` : 'Select Excel / CSV'}
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
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 border-b-2 border-gray-100">Name</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 border-b-2 border-gray-100">Phone</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 border-b-2 border-gray-100">Email</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 border-b-2 border-gray-100">Branch</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 border-b-2 border-gray-100">Qualification</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 border-b-2 border-gray-100">District</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 border-b-2 border-gray-100">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {contacts.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-8 text-center text-gray-500 bg-gray-50/50">
                                            No contacts available. Upload your Excel data to begin modeling campaigns!
                                        </td>
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
                                            <td className="px-6 py-4">
                                                <Button
                                                    variant="primary"
                                                    className="!px-3 !py-1 text-xs"
                                                    onClick={async () => {
                                                        try {
                                                            await apiClient.post(`/contacts/dial-single/${c.phone}`);
                                                            alert(`Initiating manual call to ${c.phone}...`);
                                                        } catch (err: any) {
                                                            alert(err.response?.data?.detail || "Failed to trigger call");
                                                        }
                                                    }}
                                                >
                                                    📞 Call
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>

                {/* Manual Entry Modal */}
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                        <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-semibold text-gray-900">Add Single Contact</h2>
                                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            <form onSubmit={handleManualSubmit} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                                        <input required type="text" name="phone" value={formData.phone} onChange={handleInputChange} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. 9876543210" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">S.NO</label>
                                        <input type="text" name="s_no" value={formData.s_no} onChange={handleInputChange} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                                        <input type="text" name="first_name" value={formData.first_name} onChange={handleInputChange} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                                        <input type="text" name="last_name" value={formData.last_name} onChange={handleInputChange} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                        <input type="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
                                        <input type="text" name="branch" value={formData.branch} onChange={handleInputChange} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Qualification</label>
                                        <input type="text" name="qualification" value={formData.qualification} onChange={handleInputChange} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">District</label>
                                        <input type="text" name="district" value={formData.district} onChange={handleInputChange} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Institute Name</label>
                                    <input type="text" name="institute_name" value={formData.institute_name} onChange={handleInputChange} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>

                                <div className="flex justify-end space-x-3 pt-6 mt-6 border-t border-gray-100">
                                    <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                                    <Button type="submit" variant="primary">Save & Push to Database</Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </MainLayout>
    );
}
