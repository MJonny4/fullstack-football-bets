// Components
import EmailVerificationNotificationController from '@/actions/App/Http/Controllers/Auth/EmailVerificationNotificationController';
import { logout } from '@/routes';
import { Form, Head } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';

import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import AuthLayout from '@/layouts/auth-layout';

export default function VerifyEmail({ status }: { status?: string }) {
    return (
        <AuthLayout title="Verify email" description="Please verify your email address by clicking on the link we just emailed to you.">
            <Head title="Email verification" />

            {status === 'verification-link-sent' && (
                <div className="mb-6 p-4 text-center text-sm font-medium text-primary bg-primary/10 rounded-xl border border-primary/20">
                    ✅ A new verification link has been sent to the email address you provided during registration.
                </div>
            )}

            <div className="space-y-6 text-center">
                <div className="space-y-3">
                    <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-2xl">📧</span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        We've sent a verification link to your email address. Click the link in your email to verify your account and start making predictions!
                    </p>
                </div>

                <Form {...EmailVerificationNotificationController.store.form()} className="space-y-4">
                    {({ processing }) => (
                        <>
                            <Button
                                disabled={processing}
                                className="w-full h-11 bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-white font-semibold transition-all duration-200 transform hover:scale-[1.02] shadow-lg"
                            >
                                {processing && <LoaderCircle className="h-4 w-4 animate-spin mr-2" />}
                                {processing ? 'Sending...' : 'Resend verification email'}
                            </Button>

                            <div className="pt-4 border-t border-border/30">
                                <TextLink href={logout()} className="text-muted-foreground hover:text-primary transition-colors text-sm">
                                    Sign out and try a different account
                                </TextLink>
                            </div>
                        </>
                    )}
                </Form>
            </div>
        </AuthLayout>
    );
}
