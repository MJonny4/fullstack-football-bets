import AuthLayout from '@/layouts/auth-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Age Verification',
        href: '/age-verification',
    },
];

export default function AgeVerification() {
    const handleLogout = () => {
        router.post('/logout');
    };

    return (
        <AuthLayout breadcrumbs={breadcrumbs}>
            <Head title="Age Verification Required" />

            <div className="flex flex-col gap-6">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        Age Verification Required
                    </h2>
                    <p className="text-gray-600 mb-6">
                        You must be 18 or older to access this betting platform
                    </p>
                </div>

                <div className="text-center">
                    <div className="text-6xl mb-4">🔞</div>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-red-800 mb-2">Access Restricted</h3>
                        <p className="text-red-700 mb-4">
                            This is a betting platform restricted to adults 18 years and older. 
                            Please verify your date of birth in your profile settings.
                        </p>
                        
                        <div className="space-y-3">
                            <Link
                                href="/settings/profile"
                                className="inline-block bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                            >
                                Update Profile
                            </Link>
                            
                            <div className="text-sm text-gray-600">
                                Or{' '}
                                <button
                                    onClick={handleLogout}
                                    className="text-blue-500 hover:underline"
                                >
                                    sign out
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthLayout>
    );
}