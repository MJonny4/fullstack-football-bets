import AppLogoIcon from '@/components/app-logo-icon';
import { home } from '@/routes';
import { Link } from '@inertiajs/react';
import { type PropsWithChildren } from 'react';

interface AuthLayoutProps {
    name?: string;
    title?: string;
    description?: string;
}

export default function AuthSimpleLayout({ children, title, description }: PropsWithChildren<AuthLayoutProps>) {
    return (
        <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-gradient-to-br from-background via-card to-background p-6 md:p-10">
            <div className="w-full max-w-sm">
                <div className="flex flex-col gap-8">
                    {/* Enhanced Header with Tommy Hilfiger Branding */}
                    <div className="flex flex-col items-center gap-6">
                        <Link href={home()} className="flex flex-col items-center gap-3 font-medium group">
                            <div className="mb-1 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary shadow-lg transition-transform group-hover:scale-105">
                                <AppLogoIcon className="size-8 fill-current text-primary-foreground" />
                            </div>
                            <span className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                                ScorePredict
                            </span>
                        </Link>

                        <div className="space-y-3 text-center">
                            <h1 className="text-2xl font-bold text-card-foreground">{title}</h1>
                            <p className="text-center text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">{description}</p>
                        </div>
                    </div>

                    {/* Enhanced Form Container */}
                    <div className="bg-card/80 backdrop-blur-lg rounded-2xl p-8 shadow-xl border border-border/50">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}
