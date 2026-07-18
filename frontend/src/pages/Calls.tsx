import { useState, useEffect } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { apiClient } from '../api/client';

export function Calls() {
    const [calls, setCalls] = useState([]);

    const fetchCalls = async () => {
        try {
            const res = await apiClient.get('/calls/history');
            setCalls(res.data);
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        fetchCalls();
    }, []);

    return (
        <MainLayout>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h1 className="text-2xl font-bold text-gray-900">Call History</h1>
                <Button variant="outline" onClick={fetchCalls}>Refresh Data</Button>
            </div>

            <Card>
                <CardContent className="p-0">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50/50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-gray-900">Contact #ID</th>
                                <th className="px-6 py-4 font-semibold text-gray-900">Status</th>
                                <th className="px-6 py-4 font-semibold text-gray-900">Duration</th>
                                <th className="px-6 py-4 font-semibold text-gray-900">Result</th>
                            </tr>
                        </thead>
                        <tbody>
                            {calls.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">No calls registered yet.</td>
                                </tr>
                            ) : (
                                calls.map((c: any) => (
                                    <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4 text-gray-900 font-medium">#{c.contact_id}</td>
                                        <td className="px-6 py-4 text-gray-500">{c.status}</td>
                                        <td className="px-6 py-4 text-gray-500">{c.duration || '--'} s</td>
                                        <td className="px-6 py-4 text-gray-500">{c.result_status}</td>
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
