import RegisteredUserController from '@/actions/App/Http/Controllers/Auth/RegisteredUserController';
import { login } from '@/routes';
import { Form, Head } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';

import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth-layout';

export default function Register() {
    return (
        <AuthLayout title="Create an account" description="Enter your details below to create your account">
            <Head title="Register" />
            <Form
                {...RegisteredUserController.store.form()}
                resetOnSuccess={['password', 'password_confirmation']}
                disableWhileProcessing
                className="flex flex-col gap-6"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-6">
                            <div className="grid gap-3">
                                <Label htmlFor="name" className="text-card-foreground font-medium">Full Name</Label>
                                <Input
                                    id="name"
                                    type="text"
                                    required
                                    autoFocus
                                    tabIndex={1}
                                    autoComplete="name"
                                    name="name"
                                    placeholder="Enter your full name"
                                    className="h-11 text-base transition-all duration-200 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                />
                                <InputError message={errors.name} />
                            </div>

                            <div className="grid gap-3">
                                <Label htmlFor="email" className="text-card-foreground font-medium">Email Address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    required
                                    tabIndex={2}
                                    autoComplete="email"
                                    name="email"
                                    placeholder="email@example.com"
                                    className="h-11 text-base transition-all duration-200 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                />
                                <InputError message={errors.email} />
                            </div>

                            <div className="grid gap-3">
                                <Label htmlFor="password" className="text-card-foreground font-medium">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    required
                                    tabIndex={3}
                                    autoComplete="new-password"
                                    name="password"
                                    placeholder="Create a secure password"
                                    className="h-11 text-base transition-all duration-200 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                />
                                <InputError message={errors.password} />
                            </div>

                            <div className="grid gap-3">
                                <Label htmlFor="password_confirmation" className="text-card-foreground font-medium">Confirm Password</Label>
                                <Input
                                    id="password_confirmation"
                                    type="password"
                                    required
                                    tabIndex={4}
                                    autoComplete="new-password"
                                    name="password_confirmation"
                                    placeholder="Confirm your password"
                                    className="h-11 text-base transition-all duration-200 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                />
                                <InputError message={errors.password_confirmation} />
                            </div>

                            <Button
                                type="submit"
                                className="mt-6 w-full h-11 bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-white font-semibold transition-all duration-200 transform hover:scale-[1.02] shadow-lg"
                                tabIndex={5}
                                data-test="register-user-button"
                            >
                                {processing && <LoaderCircle className="h-4 w-4 animate-spin mr-2" />}
                                {processing ? 'Creating account...' : 'Create your account'}
                            </Button>
                        </div>

                        <div className="text-center text-sm text-muted-foreground pt-4 border-t border-border/30">
                            Already have an account?{' '}
                            <TextLink href={login()} className="text-primary hover:text-primary/80 font-medium transition-colors" tabIndex={6}>
                                Sign in here
                            </TextLink>
                        </div>
                    </>
                )}
            </Form>
        </AuthLayout>
    );
}
