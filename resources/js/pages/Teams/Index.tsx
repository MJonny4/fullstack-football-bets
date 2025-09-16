import { Card, CardContent } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Teams',
        href: '/teams',
    },
];

interface Team {
    id: string;
    name: string;
    short_name: string;
    logo_url?: string;
    country?: string;
    active: boolean;
}

interface Props {
    teams: Team[];
}

const TeamLogo = ({ team, size = 'lg' }: { team: Team; size?: 'xs' | 'sm' | 'lg' | '2xl' }) => {
    const sizeClasses = {
        xs: 'w-6 h-6',
        sm: 'w-8 h-8',
        lg: 'w-16 h-16',
        '2xl': 'w-24 h-24'
    };

    if (team.logo_url) {
        return (
            <img 
                src={team.logo_url} 
                alt={`${team.name} logo`} 
                className={`${sizeClasses[size]} object-contain`}
            />
        );
    }

    // Fallback with team initials
    return (
        <div className={`${sizeClasses[size]} bg-tommy-red dark:bg-tommy-red-dark rounded-full flex items-center justify-center text-white font-bold`}>
            {team.short_name.substring(0, 2)}
        </div>
    );
};

export default function TeamsIndex({ teams = [] }: Props) {
    const getLeagueBadge = (country: string) => {
        switch (country) {
            case 'ES':
                return (
                    <span className="px-3 py-1 text-sm font-semibold rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center gap-2">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/54/LaLiga_EA_Sports_2023_Vertical_Logo.svg/1920px-LaLiga_EA_Sports_2023_Vertical_Logo.svg.png" alt="La Liga" className="h-4 w-4" /> 
                        La Liga
                    </span>
                );
            case 'EN':
                return (
                    <span className="px-3 py-1 text-sm font-semibold rounded-full bg-tommy-red/10 dark:bg-tommy-red-dark/20 text-tommy-red dark:text-tommy-red-dark flex items-center gap-2">
                        <img src="https://upload.wikimedia.org/wikipedia/en/thumb/f/f2/Premier_League_Logo.svg/2560px-Premier_League_Logo.svg.png" alt="Premier League" className="h-4 w-10" /> 
                        Premier League
                    </span>
                );
            default:
                return (
                    <span className="px-3 py-1 text-xs font-semibold rounded-full bg-muted text-muted-foreground">
                        {country}
                    </span>
                );
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Teams" />
            
            {/* Header Card */}
            <div className="bg-card rounded-2xl border border-border p-8 mb-6">
                <div className="text-center">
                    <h1 className="text-3xl md:text-4xl font-bold mb-4 text-card-foreground">
                        Football Teams
                    </h1>
                    <p className="text-muted-foreground">Explore all the teams in our prediction platform</p>
                </div>
            </div>

            {/* Teams Grid */}
            {teams.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {teams.map((team) => (
                        <Card key={team.id} className="hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                            <CardContent className="p-6">
                                <div className="flex flex-col items-center text-center space-y-4">
                                    {/* Team Logo */}
                                    <TeamLogo team={team} size="2xl" />
                                    
                                    {/* Team Info */}
                                    <div className="space-y-2">
                                        <h3 className="font-bold text-lg text-card-foreground">{team.name}</h3>
                                        <p className="text-muted-foreground font-medium">{team.short_name}</p>
                                    </div>
                                    
                                    {/* Country Badge */}
                                    {team.country && (
                                        <div className="flex items-center space-x-2">
                                            {getLeagueBadge(team.country)}
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                /* Empty State */
                <Card className="p-12 text-center">
                    <CardContent>
                        <div className="text-6xl mb-6">⚽</div>
                        <h2 className="text-2xl font-bold text-card-foreground mb-4">No Teams Found</h2>
                        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                            No teams are currently available. Please run the database seeder to add sample teams.
                        </p>
                        <code className="bg-muted px-4 py-2 rounded-lg text-sm text-muted-foreground">
                            php artisan db:seed --class=TeamSeeder
                        </code>
                    </CardContent>
                </Card>
            )}
        </AppLayout>
    );
}