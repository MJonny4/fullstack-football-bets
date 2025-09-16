// Components
import PasswordResetLinkController from '@/actions/App/Http/Controllers/Auth/PasswordResetLinkController';
import { login } from '@/routes';
import { Form, Head } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';

import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth-layout';

export default function ForgotPassword({ status }: { status?: string }) {
    return (
        <AuthLayout title="Forgot password" description="Enter your email to receive a password reset link">
            <Head title="Forgot password" />

            {status && (
                <div className="mb-6 p-4 text-center text-sm font-medium text-primary bg-primary/10 rounded-xl border border-primary/20">
                    ✅ {status}
                </div>
            )}

            <div className="space-y-6">
                <div className="space-y-3 text-center">
                    <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-2xl">🔑</span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        Enter your email address and we'll send you a link to reset your password.
                    </p>
                </div>

                <Form {...PasswordResetLinkController.store.form()}>
                    {({ processing, errors }) => (
                        <>
                            <div className="grid gap-3">
                                <Label htmlFor="email" className="text-card-foreground font-medium">Email address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    name="email"
                                    autoComplete="off"
                                    autoFocus
                                    placeholder="email@example.com"
                                    className="h-11 text-base transition-all duration-200 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                />
                                <InputError message={errors.email} />
                            </div>

                            <Button
                                className="w-full h-11 bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-white font-semibold transition-all duration-200 transform hover:scale-[1.02] shadow-lg mt-6"
                                disabled={processing}
                                data-test="email-password-reset-link-button"
                            >
                                {processing && <LoaderCircle className="h-4 w-4 animate-spin mr-2" />}
                                {processing ? 'Sending...' : 'Send password reset link'}
                            </Button>
                        </>
                    )}
                </Form>

                <div className="text-center text-sm text-muted-foreground pt-4 border-t border-border/30">
                    Remember your password?{' '}
                    <TextLink href={login()} className="text-primary hover:text-primary/80 font-medium transition-colors">
                        Sign in here
                    </TextLink>
                </div>
            </div>
        </AuthLayout>
    );
}
