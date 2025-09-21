import { Button } from '@/components/ui/button';
import { useAppearance } from '@/hooks/use-appearance';
import { Moon, Sun, Monitor } from 'lucide-react';

export function ThemeToggle() {
    const { appearance, updateAppearance } = useAppearance();

    const toggleTheme = () => {
        // Cycle through: light → dark → system → light
        if (appearance === 'light') {
            updateAppearance('dark');
        } else if (appearance === 'dark') {
            updateAppearance('system');
        } else {
            updateAppearance('light');
        }
    };

    const getIcon = () => {
        switch (appearance) {
            case 'light':
                return <Sun className="h-4 w-4" />;
            case 'dark':
                return <Moon className="h-4 w-4" />;
            case 'system':
                return <Monitor className="h-4 w-4" />;
            default:
                return <Sun className="h-4 w-4" />;
        }
    };

    const getAriaLabel = () => {
        switch (appearance) {
            case 'light':
                return 'Switch to dark mode';
            case 'dark':
                return 'Switch to system mode';
            case 'system':
                return 'Switch to light mode';
            default:
                return 'Toggle theme';
        }
    };

    return (
        <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className="h-8 w-8 px-0 text-primary hover:bg-primary/10"
            aria-label={getAriaLabel()}
        >
            {getIcon()}
        </Button>
    );
}