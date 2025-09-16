import AuthenticatedSessionController from '@/actions/App/Http/Controllers/Auth/AuthenticatedSessionController';
import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth-layout';
import { register } from '@/routes';
import { request } from '@/routes/password';
import { Form, Head } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';

interface LoginProps {
    status?: string;
    canResetPassword: boolean;
}

export default function Login({ status, canResetPassword }: LoginProps) {
    return (
        <AuthLayout title="Log in to your account" description="Enter your email and password below to log in">
            <Head title="Log in" />

            <Form {...AuthenticatedSessionController.store.form()} resetOnSuccess={['password']} className="flex flex-col gap-6">
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-6">
                            <div className="grid gap-3">
                                <Label htmlFor="email" className="text-card-foreground font-medium">Email address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    name="email"
                                    required
                                    autoFocus
                                    tabIndex={1}
                                    autoComplete="email"
                                    placeholder="email@example.com"
                                    className="h-11 text-base transition-all duration-200 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                />
                                <InputError message={errors.email} />
                            </div>

                            <div className="grid gap-3">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password" className="text-card-foreground font-medium">Password</Label>
                                    {canResetPassword && (
                                        <TextLink href={request()} className="text-sm text-primary hover:text-primary/80 transition-colors" tabIndex={5}>
                                            Forgot password?
                                        </TextLink>
                                    )}
                                </div>
                                <Input
                                    id="password"
                                    type="password"
                                    name="password"
                                    required
                                    tabIndex={2}
                                    autoComplete="current-password"
                                    placeholder="Enter your password"
                                    className="h-11 text-base transition-all duration-200 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                />
                                <InputError message={errors.password} />
                            </div>

                            <div className="flex items-center space-x-3 pt-2">
                                <Checkbox id="remember" name="remember" tabIndex={3} className="data-[state=checked]:bg-primary data-[state=checked]:border-primary" />
                                <Label htmlFor="remember" className="text-sm text-muted-foreground cursor-pointer">Remember me for 30 days</Label>
                            </div>

                            <Button
                                type="submit"
                                className="mt-6 w-full h-11 bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-white font-semibold transition-all duration-200 transform hover:scale-[1.02] shadow-lg"
                                tabIndex={4}
                                disabled={processing}
                                data-test="login-button"
                            >
                                {processing && <LoaderCircle className="h-4 w-4 animate-spin mr-2" />}
                                {processing ? 'Signing in...' : 'Sign in to your account'}
                            </Button>
                        </div>

                        <div className="text-center text-sm text-muted-foreground pt-4 border-t border-border/30">
                            Don't have an account?{' '}
                            <TextLink href={register()} className="text-primary hover:text-primary/80 font-medium transition-colors" tabIndex={5}>
                                Create one here
                            </TextLink>
                        </div>
                    </>
                )}
            </Form>

            {status && <div className="mb-4 text-center text-sm font-medium text-primary">{status}</div>}
        </AuthLayout>
    );
}
