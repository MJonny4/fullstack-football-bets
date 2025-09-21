import AppLayoutTemplate from '@/layouts/app/app-navbar-layout';
import { type ReactNode } from 'react';

interface AppLayoutProps {
    children: ReactNode;
}

export default ({ children }: AppLayoutProps) => (
    <AppLayoutTemplate>
        {children}
    </AppLayoutTemplate>
);
