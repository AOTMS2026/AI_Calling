import { MainLayout } from '../components/layout/MainLayout';
import { Card, CardContent } from '../components/ui/Card';
import { Users, FileText, PhoneCall, PhoneForwarded } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Link } from 'react-router-dom';

export function Dashboard() {
    return (
        <MainLayout>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h1 className="text-2xl font-bold text-gray-900">Overview</h1>
                <div className="flex gap-3">
                    <Link to="/contacts"><Button variant="outline">Upload Contacts</Button></Link>
                    <Link to="/campaigns"><Button variant="primary">Start Campaign</Button></Link>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

                <Card>
                    <CardContent className="flex flex-col gap-2 pt-6">
                        <div className="flex justify-between items-center text-gray-500">
                            <span className="font-medium text-sm">Total Contacts</span>
                            <Users size={18} />
                        </div>
                        <span className="text-3xl font-bold text-gray-900">0</span>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="flex flex-col gap-2 pt-6">
                        <div className="flex justify-between items-center text-gray-500">
                            <span className="font-medium text-sm">Campaigns</span>
                            <FileText size={18} />
                        </div>
                        <span className="text-3xl font-bold text-gray-900">0</span>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="flex flex-col gap-2 pt-6">
                        <div className="flex justify-between items-center text-gray-500">
                            <span className="font-medium text-sm">Calls Today</span>
                            <PhoneCall size={18} />
                        </div>
                        <span className="text-3xl font-bold text-gray-900">0</span>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="flex flex-col gap-2 pt-6">
                        <div className="flex justify-between items-center text-gray-500">
                            <span className="font-medium text-sm">Answered</span>
                            <PhoneForwarded size={18} className="text-green-500" />
                        </div>
                        <span className="text-3xl font-bold text-gray-900">0</span>
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    );
}
