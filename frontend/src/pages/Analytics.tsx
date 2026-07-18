import React from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { BarChart, Activity, TrendingUp, Users } from 'lucide-react';

export function Analytics() {
    return (
        <MainLayout>
            <div className="space-y-6 animate-in fade-in zoom-in duration-300">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">Analytics</h1>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="bg-white">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Total Calls</p>
                                    <h3 className="text-2xl font-bold mt-1">0</h3>
                                </div>
                                <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                                    <Activity size={20} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-white">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Avg. Duration</p>
                                    <h3 className="text-2xl font-bold mt-1">0m</h3>
                                </div>
                                <div className="p-3 bg-green-50 text-green-600 rounded-lg">
                                    <BarChart size={20} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-white">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Success Rate</p>
                                    <h3 className="text-2xl font-bold mt-1">0</h3>
                                </div>
                                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
                                    <TrendingUp size={20} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-white">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Active Campaigns</p>
                                    <h3 className="text-2xl font-bold mt-1">0</h3>
                                </div>
                                <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
                                    <Users size={20} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card className="h-96 flex justify-center items-center flex-col text-gray-400 bg-gray-50/50">
                    <BarChart size={48} className="mb-4 text-gray-300" />
                    <p>Detailed charts and visual data will be populated here as campaigns run.</p>
                </Card>
            </div>
        </MainLayout>
    );
}
