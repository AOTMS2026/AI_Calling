import { MainLayout } from '../components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export function Profile() {
    return (
        <MainLayout>
            <div className="max-w-2xl mx-auto">
                <h1 className="text-2xl font-bold text-gray-900 mb-6">User Profile</h1>

                <div className="flex flex-col gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Personal Information</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form className="space-y-4">
                                <Input label="Full Name" defaultValue="Session User" disabled />
                                <Input label="Email Address" defaultValue="user@company.com" disabled />
                                <Input label="Phone Number" defaultValue="9876543210" disabled />
                            </form>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Change Password</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                                <Input label="Current Password" type="password" />
                                <Input label="New Password" type="password" />
                                <Input label="Confirm New Password" type="password" />
                                <div className="pt-2 flex justify-end">
                                    <Button variant="primary">Update Password</Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </MainLayout>
    );
}
