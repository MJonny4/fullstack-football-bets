import { Navbar } from '@/components/navbar';
import { type BreadcrumbItem } from '@/types';
import { type PropsWithChildren } from 'react';

export default function AppNavbarLayout({ children, breadcrumbs = [] }: PropsWithChildren<{ breadcrumbs?: BreadcrumbItem[] }>) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-card to-background">
            {/* Navigation */}
            <Navbar />

            {/* Main Content */}
            <main className="px-6 pb-12">
                <div className="max-w-7xl mx-auto">
                    {/* Breadcrumbs */}
                    {breadcrumbs.length > 0 && (
                        <nav className="mb-6">
                            <ol className="flex items-center space-x-2 text-sm text-muted-foreground">
                                {breadcrumbs.map((crumb, index) => (
                                    <li key={index} className="flex items-center">
                                        {index > 0 && <span className="mx-2">/</span>}
                                        {crumb.href ? (
                                            <a href={crumb.href} className="hover:text-primary transition-colors">
                                                {crumb.title}
                                            </a>
                                        ) : (
                                            <span className="text-card-foreground font-medium">{crumb.title}</span>
                                        )}
                                    </li>
                                ))}
                            </ol>
                        </nav>
                    )}

                    {/* Page Content */}
                    {children}
                </div>
            </main>
        </div>
    );
}