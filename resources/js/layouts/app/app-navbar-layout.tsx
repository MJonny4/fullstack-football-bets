import { Navbar } from '@/components/navbar';
import { type PropsWithChildren } from 'react';

export default function AppNavbarLayout({ children }: PropsWithChildren) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-card to-background">
            {/* Navigation */}
            <Navbar />

            {/* Main Content */}
            <main className="px-6 pb-12">
                <div className="max-w-7xl mx-auto">

                    {/* Page Content */}
                    {children}
                </div>
            </main>
        </div>
    );
}