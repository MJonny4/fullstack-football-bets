import { Link, usePage, router } from '@inertiajs/react';
import { ThemeToggle } from '@/components/theme-toggle';
import { type SharedData } from '@/types';
import { dashboard, login, register, logout } from '@/routes';
import { Home, Info, LogIn, UserPlus, BarChart3, Trophy, Settings, LogOut, User } from 'lucide-react';
import { useState } from 'react';

interface NavItem {
    href: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    showWhen: 'always' | 'authenticated' | 'guest';
}

export function Navbar() {
    const page = usePage<SharedData>();
    const { auth } = page.props;
    const currentUrl = page.url || '';
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

    // Handle logout
    const handleLogout = () => {
        router.post(logout.url());
    };

    // Determine current route context
    const isHomepage = currentUrl === '/';
    const isDashboard = currentUrl.startsWith('/dashboard');
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
                    { href: login.url(), label: 'Login', icon: LogIn, showWhen: 'guest' },
                    { href: register.url(), label: 'Register', icon: UserPlus, showWhen: 'guest' },
                ];
            }
        } else if (isDashboard) {
            // Dashboard navigation (always authenticated)
            return [
                { href: '/', label: 'Home', icon: Home, showWhen: 'always' },
                { href: '/dashboard', label: 'Dashboard', icon: BarChart3, showWhen: 'authenticated' },
                { href: '/betting', label: 'Betting', icon: Trophy, showWhen: 'authenticated' },
                { href: '/leaderboard', label: 'Leaderboard', icon: Trophy, showWhen: 'authenticated' },
            ];
        } else {
            // Other pages navigation
            if (isAuthenticated) {
                return [
                    { href: '/', label: 'Home', icon: Home, showWhen: 'always' },
                    { href: '/dashboard', label: 'Dashboard', icon: BarChart3, showWhen: 'authenticated' },
                    { href: '/betting', label: 'Betting', icon: Trophy, showWhen: 'authenticated' },
                    { href: '/leaderboard', label: 'Leaderboard', icon: Trophy, showWhen: 'authenticated' },
                ];
            } else {
                return [
                    { href: '/', label: 'Home', icon: Home, showWhen: 'always' },
                    { href: '/about', label: 'About', icon: Info, showWhen: 'always' },
                    { href: login.url(), label: 'Login', icon: LogIn, showWhen: 'guest' },
                    { href: register.url(), label: 'Register', icon: UserPlus, showWhen: 'guest' },
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
            return currentUrl === '/';
        }
        return currentUrl.startsWith(href);
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
                        <div className="hidden md:flex items-center gap-2 flex-1 justify-end mr-4">
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
                                <div className="hidden md:block relative">
                                    <button
                                        onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                                        className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary text-primary-foreground font-bold text-lg hover:bg-primary/90 transition-colors"
                                        aria-label="User menu"
                                    >
                                        {auth.user.name.charAt(0).toUpperCase()}
                                    </button>

                                    {/* Dropdown Menu */}
                                    {isUserDropdownOpen && (
                                        <>
                                            {/* Backdrop */}
                                            <div
                                                className="fixed inset-0 z-40"
                                                onClick={() => setIsUserDropdownOpen(false)}
                                            />

                                            {/* Dropdown Content */}
                                            <div className="absolute right-0 mt-2 w-56 bg-card rounded-xl border border-border shadow-lg z-50">
                                                <div className="p-3 border-b border-border">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground font-bold text-sm">
                                                            {auth.user.name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium text-card-foreground">{auth.user.name}</p>
                                                            <p className="text-xs text-muted-foreground">{auth.user.email}</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="p-2">
                                                    <Link
                                                        href="/settings"
                                                        onClick={() => setIsUserDropdownOpen(false)}
                                                        className="flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-muted transition-colors"
                                                    >
                                                        <Settings className="w-4 h-4" />
                                                        Settings
                                                    </Link>

                                                    <button
                                                        onClick={() => {
                                                            handleLogout();
                                                            setIsUserDropdownOpen(false);
                                                        }}
                                                        className="flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-muted transition-colors w-full text-left"
                                                    >
                                                        <LogOut className="w-4 h-4" />
                                                        Logout
                                                    </button>
                                                </div>
                                            </div>
                                        </>
                                    )}
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
                                        <div className="flex items-center gap-3 px-4 py-2 text-muted-foreground mb-2">
                                            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground font-bold text-sm">
                                                {auth.user.name.charAt(0).toUpperCase()}
                                            </div>
                                            <span className="text-sm">Signed in as {auth.user.name}</span>
                                        </div>

                                        {/* Mobile Settings Link */}
                                        <Link
                                            href="/settings"
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className="flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 text-muted-foreground hover:text-card-foreground hover:bg-muted/50"
                                        >
                                            <Settings className="w-5 h-5" />
                                            <span>Settings</span>
                                        </Link>

                                        {/* Mobile Logout Button */}
                                        <button
                                            onClick={() => {
                                                handleLogout();
                                                setIsMobileMenuOpen(false);
                                            }}
                                            className="flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 text-muted-foreground hover:text-card-foreground hover:bg-muted/50 w-full text-left"
                                        >
                                            <LogOut className="w-5 h-5" />
                                            <span>Logout</span>
                                        </button>
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