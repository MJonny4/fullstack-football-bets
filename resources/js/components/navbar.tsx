import { Link, usePage } from '@inertiajs/react';
import { ThemeToggle } from '@/components/theme-toggle';
import { type SharedData } from '@/types';
import { dashboard, login, register } from '@/routes';
import { Home, Info, LogIn, UserPlus, BarChart3, Trophy, Settings, User } from 'lucide-react';
import { useState } from 'react';

interface NavItem {
    href: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    showWhen: 'always' | 'authenticated' | 'guest';
}

export function Navbar() {
    const { auth, url } = usePage<SharedData>().props;
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Determine current route context
    const isHomepage = url === '/';
    const isDashboard = url.startsWith('/dashboard');
    const isAuthenticated = !!auth.user;

    // Define navigation items based on requirements
    const getNavigationItems = (): NavItem[] => {
        if (isHomepage) {
            // Homepage navigation
            if (isAuthenticated) {
                return [
                    { href: '/', label: 'Home', icon: Home, showWhen: 'always' },
                    { href: '/about', label: 'About', icon: Info, showWhen: 'always' },
                ];
            } else {
                return [
                    { href: '/', label: 'Home', icon: Home, showWhen: 'always' },
                    { href: '/about', label: 'About', icon: Info, showWhen: 'always' },
                    { href: login(), label: 'Login', icon: LogIn, showWhen: 'guest' },
                    { href: register(), label: 'Register', icon: UserPlus, showWhen: 'guest' },
                ];
            }
        } else if (isDashboard) {
            // Dashboard navigation (always authenticated)
            return [
                { href: '/', label: 'Home', icon: Home, showWhen: 'always' },
                { href: '/dashboard', label: 'Dashboard', icon: BarChart3, showWhen: 'authenticated' },
                { href: '/betting', label: 'Betting', icon: Trophy, showWhen: 'authenticated' },
                { href: '/leaderboard', label: 'Leaderboard', icon: Trophy, showWhen: 'authenticated' },
                { href: '/settings', label: 'Settings', icon: Settings, showWhen: 'authenticated' },
            ];
        } else {
            // Other pages navigation
            if (isAuthenticated) {
                return [
                    { href: '/', label: 'Home', icon: Home, showWhen: 'always' },
                    { href: '/dashboard', label: 'Dashboard', icon: BarChart3, showWhen: 'authenticated' },
                    { href: '/betting', label: 'Betting', icon: Trophy, showWhen: 'authenticated' },
                    { href: '/leaderboard', label: 'Leaderboard', icon: Trophy, showWhen: 'authenticated' },
                    { href: '/settings', label: 'Settings', icon: Settings, showWhen: 'authenticated' },
                ];
            } else {
                return [
                    { href: '/', label: 'Home', icon: Home, showWhen: 'always' },
                    { href: '/about', label: 'About', icon: Info, showWhen: 'always' },
                    { href: login(), label: 'Login', icon: LogIn, showWhen: 'guest' },
                    { href: register(), label: 'Register', icon: UserPlus, showWhen: 'guest' },
                ];
            }
        }
    };

    const navigationItems = getNavigationItems();
    const filteredItems = navigationItems.filter(item => {
        if (item.showWhen === 'always') return true;
        if (item.showWhen === 'authenticated') return isAuthenticated;
        if (item.showWhen === 'guest') return !isAuthenticated;
        return false;
    });

    const isActiveRoute = (href: string) => {
        if (href === '/') {
            return url === '/';
        }
        return url.startsWith(href);
    };

    return (
        <header className="px-6 py-4 mt-4">
            <nav className="max-w-5xl mx-auto">
                <div className="bg-card/80 backdrop-blur-lg rounded-2xl p-4 shadow-lg border border-border/50">
                    <div className="flex items-center justify-between">
                        {/* Logo */}
                        <Link href="/" className="flex items-center gap-3 group">
                            <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center transition-transform group-hover:scale-105">
                                <span className="text-white font-bold text-lg">SP</span>
                            </div>
                            <span className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                                ScorePredict
                            </span>
                        </Link>

                        {/* Desktop Navigation */}
                        <div className="hidden md:flex items-center gap-2">
                            {filteredItems.map((item) => {
                                const Icon = item.icon;
                                const isActive = isActiveRoute(item.href);

                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                                            isActive
                                                ? 'bg-primary text-primary-foreground shadow-md'
                                                : 'text-muted-foreground hover:text-card-foreground hover:bg-muted/50'
                                        }`}
                                    >
                                        <Icon className="w-4 h-4" />
                                        <span>{item.label}</span>
                                    </Link>
                                );
                            })}
                        </div>

                        {/* Right Side: User Menu + Theme Toggle */}
                        <div className="flex items-center gap-3">
                            {/* User Menu */}
                            {isAuthenticated && (
                                <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/50">
                                    <User className="w-4 h-4 text-muted-foreground" />
                                    <span className="text-sm font-medium text-card-foreground">
                                        {auth.user.name}
                                    </span>
                                </div>
                            )}

                            {/* Theme Toggle */}
                            <ThemeToggle />

                            {/* Mobile Menu Button */}
                            <button
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className="md:hidden flex items-center justify-center w-10 h-10 rounded-xl bg-muted/50 text-muted-foreground hover:text-card-foreground transition-colors"
                                aria-label="Toggle menu"
                            >
                                <svg
                                    className="w-5 h-5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d={isMobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
                                    />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Mobile Navigation */}
                    {isMobileMenuOpen && (
                        <div className="md:hidden mt-4 pt-4 border-t border-border/30">
                            <div className="flex flex-col gap-2">
                                {filteredItems.map((item) => {
                                    const Icon = item.icon;
                                    const isActive = isActiveRoute(item.href);

                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                                                isActive
                                                    ? 'bg-primary text-primary-foreground shadow-md'
                                                    : 'text-muted-foreground hover:text-card-foreground hover:bg-muted/50'
                                            }`}
                                        >
                                            <Icon className="w-5 h-5" />
                                            <span>{item.label}</span>
                                        </Link>
                                    );
                                })}

                                {/* Mobile User Info */}
                                {isAuthenticated && (
                                    <div className="mt-2 pt-2 border-t border-border/30">
                                        <div className="flex items-center gap-3 px-4 py-2 text-muted-foreground">
                                            <User className="w-5 h-5" />
                                            <span className="text-sm">Signed in as {auth.user.name}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </nav>
        </header>
    );
}