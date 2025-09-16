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

            <div className="flex flex-col gap-8">
                <div className="text-center space-y-4">
                    <div className="w-20 h-20 mx-auto bg-destructive/10 rounded-full flex items-center justify-center">
                        <span className="text-4xl">🔞</span>
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-2xl font-bold text-card-foreground">
                            Age Verification Required
                        </h2>
                        <p className="text-muted-foreground">
                            You must be 18 or older to access this betting platform
                        </p>
                    </div>
                </div>

                <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-6 space-y-4">
                    <div className="text-center space-y-3">
                        <h3 className="text-lg font-semibold text-destructive">Access Restricted</h3>
                        <p className="text-muted-foreground leading-relaxed">
                            This is a betting platform restricted to adults 18 years and older.
                            Please verify your date of birth in your profile settings to continue.
                        </p>
                    </div>

                    <div className="space-y-4 pt-2">
                        <Link
                            href="/settings/profile"
                            className="w-full inline-block bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-white px-6 py-3 rounded-xl font-semibold text-center transition-all duration-200 transform hover:scale-[1.02] shadow-lg"
                        >
                            Update Your Profile
                        </Link>

                        <div className="text-center text-sm text-muted-foreground pt-2 border-t border-border/30">
                            Or{' '}
                            <button
                                onClick={handleLogout}
                                className="text-primary hover:text-primary/80 font-medium transition-colors"
                            >
                                sign out of your account
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </AuthLayout>
    );
}