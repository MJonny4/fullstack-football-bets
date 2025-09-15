import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Betting',
        href: '/betting',
    },
];

interface Team {
    _id: string;
    name: string;
    short_name: string;
    logo_url?: string;
}

interface Match {
    _id: string;
    home_team: Team | null;
    away_team: Team | null;
    kickoff_time: string;
    status: string;
    home_score?: number;
    away_score?: number;
}

interface Bet {
    _id: string;
    match_id: string;
    prediction: '1' | 'X' | '2';
}

interface Props {
    matches: Match[];
    userBets: Record<string, Bet>;
    currentGameweek: { name: string; number: number; deadline_time: string } | null;
    deadline: string | null;
    message?: string;
}

// Team Logo Component
const TeamLogo = ({ team, size = 'lg' }: { team: Team | null; size?: 'xs' | 'sm' | 'lg' }) => {
    const sizeClasses = {
        xs: 'w-6 h-6',
        sm: 'w-8 h-8',
        lg: 'w-16 h-16'
    };

    if (!team) {
        return (
            <div className={`${sizeClasses[size]} bg-gray-300 rounded-full flex items-center justify-center text-white font-bold`}>
                ?
            </div>
        );
    }

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
        <div className={`${sizeClasses[size]} bg-blue-500 rounded-full flex items-center justify-center text-white font-bold`}>
            {team.short_name?.substring(0, 2) || '??'}
        </div>
    );
};

// Match Betting Component
const MatchBetting = ({ match, userBet, onBetPlaced }: {
    match: Match;
    userBet?: Bet;
    onBetPlaced: (matchId: string, prediction: '1' | 'X' | '2') => void;
}) => {
    const [selectedPrediction, setSelectedPrediction] = useState<'1' | 'X' | '2' | null>(userBet?.prediction || null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const formatTime = (datetime: string) => {
        return new Date(datetime).toLocaleString('en-GB', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handlePlaceBet = async (prediction: '1' | 'X' | '2') => {
        setIsSubmitting(true);
        try {
            await router.post('/betting', {
                match_id: match._id,
                prediction: prediction
            }, {
                preserveState: true,
                onSuccess: () => {
                    setSelectedPrediction(prediction);
                    onBetPlaced(match._id, prediction);
                }
            });
        } catch (error) {
            console.error('Error placing bet:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const isDeadlinePassed = new Date(match.kickoff_time) <= new Date();

    return (
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-gray-200/50">
            {/* Match Header with Team Logos */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-6 flex-1">
                    {/* Home Team */}
                    <div className="flex items-center space-x-3 flex-1">
                        <TeamLogo team={match.home_team} size="lg" />
                        <div className="text-center">
                            <div className="font-semibold text-gray-900">{match.home_team?.name || 'Unknown Team'}</div>
                            <div className="text-sm text-gray-600">{match.home_team?.short_name || 'N/A'}</div>
                        </div>
                    </div>
                    
                    {/* VS */}
                    <div className="text-2xl font-bold text-gray-400 px-4">vs</div>
                    
                    {/* Away Team */}
                    <div className="flex items-center space-x-3 flex-1 flex-row-reverse">
                        <TeamLogo team={match.away_team} size="lg" />
                        <div className="text-center">
                            <div className="font-semibold text-gray-900">{match.away_team?.name || 'Unknown Team'}</div>
                            <div className="text-sm text-gray-600">{match.away_team?.short_name || 'N/A'}</div>
                        </div>
                    </div>
                </div>
                
                {/* Match Time */}
                <div className="text-right ml-4">
                    <div className="text-sm text-gray-700 font-medium">{formatTime(match.kickoff_time)}</div>
                    <div className="text-xs text-gray-500">
                        {new Date(match.kickoff_time) > new Date() 
                            ? `${Math.ceil((new Date(match.kickoff_time).getTime() - new Date().getTime()) / (1000 * 60 * 60))}h from now`
                            : 'Started'
                        }
                    </div>
                </div>
            </div>

            {!isDeadlinePassed ? (
                <>
                    {/* Betting Buttons */}
                    <div className="grid grid-cols-3 gap-3">
                        {/* Home Win Button */}
                        <Button
                            onClick={() => handlePlaceBet('1')}
                            disabled={isSubmitting}
                            className={`px-4 py-4 text-center rounded-xl font-medium transition-all duration-300 transform hover:scale-105 ${
                                selectedPrediction === '1'
                                    ? 'bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-lg border-2 border-teal-400'
                                    : 'bg-white/80 text-gray-700 hover:bg-teal-50 border-2 border-gray-200 hover:border-teal-300'
                            }`}
                        >
                            <div className="flex items-center justify-center space-x-2 mb-1">
                                <TeamLogo team={match.home_team} size="xs" />
                                <span className="font-bold text-lg">1</span>
                            </div>
                            <div className="text-xs opacity-80">{match.home_team?.short_name || 'Home'} Win</div>
                        </Button>
                        
                        {/* Draw Button */}
                        <Button
                            onClick={() => handlePlaceBet('X')}
                            disabled={isSubmitting}
                            className={`px-4 py-4 text-center rounded-xl font-medium transition-all duration-300 transform hover:scale-105 ${
                                selectedPrediction === 'X'
                                    ? 'bg-gradient-to-r from-stone-500 to-stone-600 text-white shadow-lg border-2 border-stone-400'
                                    : 'bg-white/80 text-gray-700 hover:bg-stone-50 border-2 border-gray-200 hover:border-stone-300'
                            }`}
                        >
                            <div className="font-bold text-lg mb-1">X</div>
                            <div className="text-xs opacity-80">Draw</div>
                        </Button>
                        
                        {/* Away Win Button */}
                        <Button
                            onClick={() => handlePlaceBet('2')}
                            disabled={isSubmitting}
                            className={`px-4 py-4 text-center rounded-xl font-medium transition-all duration-300 transform hover:scale-105 ${
                                selectedPrediction === '2'
                                    ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg border-2 border-red-400'
                                    : 'bg-white/80 text-gray-700 hover:bg-red-50 border-2 border-gray-200 hover:border-red-300'
                            }`}
                        >
                            <div className="flex items-center justify-center space-x-2 mb-1">
                                <span className="font-bold text-lg">2</span>
                                <TeamLogo team={match.away_team} size="xs" />
                            </div>
                            <div className="text-xs opacity-80">{match.away_team?.short_name || 'Away'} Win</div>
                        </Button>
                    </div>

                    {selectedPrediction && (
                        <div className="mt-4 p-3 bg-teal-50 rounded-xl text-center border border-teal-200">
                            <div className="text-teal-700 text-sm font-medium flex items-center justify-center space-x-2">
                                <span>✓</span>
                                <span>Your prediction:</span>
                                {selectedPrediction === '1' ? (
                                    <>
                                        <TeamLogo team={match.home_team} size="xs" />
                                        <span>{match.home_team?.short_name || 'Home'} Win</span>
                                    </>
                                ) : selectedPrediction === 'X' ? (
                                    <span>Draw</span>
                                ) : (
                                    <>
                                        <TeamLogo team={match.away_team} size="xs" />
                                        <span>{match.away_team?.short_name || 'Away'} Win</span>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </>
            ) : (
                /* Betting Closed */
                <div className="text-center py-6 bg-gray-50 rounded-xl border border-gray-200">
                    <div className="text-red-500 font-medium text-lg mb-2">⏰ Betting Closed</div>
                    {selectedPrediction ? (
                        <div className="text-sm text-gray-700 flex items-center justify-center space-x-2">
                            <span>Your bet:</span>
                            {selectedPrediction === '1' ? (
                                <>
                                    <TeamLogo team={match.home_team} size="xs" />
                                    <span>{match.home_team?.short_name || 'Home'} Win</span>
                                </>
                            ) : selectedPrediction === 'X' ? (
                                <span>Draw</span>
                            ) : (
                                <>
                                    <TeamLogo team={match.away_team} size="xs" />
                                    <span>{match.away_team?.short_name || 'Away'} Win</span>
                                </>
                            )}
                        </div>
                    ) : (
                        <div className="text-sm text-gray-600">No bet placed</div>
                    )}
                </div>
            )}
        </div>
    );
};

export default function BettingIndex({ 
    matches = [], 
    userBets = {}, 
    currentGameweek, 
    deadline,
    message 
}: Props) {
    const [bets, setBets] = useState(userBets);

    const handleBetPlaced = (matchId: string, prediction: '1' | 'X' | '2') => {
        setBets(prev => ({
            ...prev,
            [matchId]: { _id: matchId, match_id: matchId, prediction }
        }));
    };

    if (message) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Betting" />
                <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-12 text-center shadow-lg border border-gray-200/50">
                    <p className="text-gray-600">{message}</p>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Betting" />
            
            {currentGameweek && matches.length > 0 ? (
                <>
                    {/* Header Card */}
                    <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-8 mb-6 shadow-lg border border-gray-200/50">
                        <div className="text-center">
                            <h1 className="text-3xl md:text-4xl font-bold mb-4">
                                {currentGameweek.name}
                            </h1>
                            <div className="flex items-center justify-center space-x-4 text-gray-600">
                                {deadline && (
                                    <>
                                        <div className="flex items-center space-x-2">
                                            <span className="text-blue-500">⏰</span>
                                            <span>Deadline: {new Date(deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
                                        </div>
                                        <div className="w-px h-4 bg-gray-300"></div>
                                    </>
                                )}
                                <div className="flex items-center space-x-2">
                                    <span className="text-orange-500">⚽</span>
                                    <span>{matches.length} Matches</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Matches Grid */}
                    <div className="space-y-6">
                        {matches.map((match) => (
                            <MatchBetting
                                key={match._id}
                                match={match}
                                userBet={bets[match._id]}
                                onBetPlaced={handleBetPlaced}
                            />
                        ))}
                    </div>

                    {/* Footer Info */}
                    <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 text-center mt-6 shadow-lg border border-gray-200/50">
                        <div className="flex items-center justify-center space-x-2 text-gray-600">
                            <span className="text-blue-500">💡</span>
                            <span className="text-sm">You can change your predictions until the deadline!</span>
                        </div>
                    </div>
                </>
            ) : (
                /* No Matches State */
                <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-12 text-center shadow-lg border border-gray-200/50">
                    <div className="text-6xl mb-6">⚽</div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">No Active Gameweek</h2>
                    <p className="text-gray-600 mb-6 max-w-md mx-auto">
                        There are currently no matches available for betting. New gameweeks are added regularly!
                    </p>
                    <a href="/teams" className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-medium hover:from-blue-600 hover:to-purple-600 transition-all shadow-lg hover:shadow-xl">
                        <span>Browse Teams</span>
                        <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path>
                        </svg>
                    </a>
                </div>
            )}
        </AppLayout>
    );
}