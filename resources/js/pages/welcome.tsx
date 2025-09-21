import AppLayout from '@/layouts/app-layout';
import { dashboard, login, register } from '@/routes';
import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';

export default function Welcome() {
    const { auth } = usePage<SharedData>().props;

    return (
        <AppLayout>
            <Head title="Premium Football Predictions">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />
            </Head>

                {/* Hero Section */}
                <section className="relative px-6 py-10">
                    <div className="max-w-7xl mx-auto">
                        {/* Hero Content */}
                        <div className="text-center mb-16">
                            <div className="bg-card/80 backdrop-blur rounded-2xl p-12 mb-8 border border-border shadow-xl">
                                <h1 className="text-5xl md:text-7xl font-bold mb-6 text-card-foreground">
                                    Predict. <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Compete.</span> Win.
                                </h1>
                                <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
                                    Join the ultimate football prediction platform where your football knowledge pays off.
                                    Compete with friends, climb leaderboards, and prove you're the ultimate football oracle.
                                </p>
                                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                                    <Link
                                        href={register.url()}
                                        className="bg-gradient-to-r from-primary to-secondary text-white px-8 py-4 rounded-xl font-semibold text-lg hover:opacity-90 transition-all transform hover:scale-105 shadow-xl"
                                    >
                                        Start Predicting Free
                                    </Link>
                                    <Link
                                        href="/about"
                                        className="text-card-foreground hover:text-primary font-semibold text-lg flex items-center space-x-2 transition-colors"
                                    >
                                        <span>Learn More</span>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path>
                                        </svg>
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {/* Features Grid */}
                        <div id="features" className="grid md:grid-cols-3 gap-8 mb-20">
                            <div className="bg-card/80 backdrop-blur rounded-2xl p-8 text-center group border border-border shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                                <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                                    <span className="text-2xl">⚽</span>
                                </div>
                                <h3 className="text-2xl font-bold text-card-foreground mb-4">Live Predictions</h3>
                                <p className="text-muted-foreground leading-relaxed">
                                    Make predictions on live matches with real-time updates. Our advanced system tracks every game across major leagues.
                                </p>
                            </div>

                            <div className="bg-card/80 backdrop-blur rounded-2xl p-8 text-center group border border-border shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                                <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                                    <span className="text-2xl">🏆</span>
                                </div>
                                <h3 className="text-2xl font-bold text-card-foreground mb-4">Leaderboards</h3>
                                <p className="text-muted-foreground leading-relaxed">
                                    Compete with players worldwide. Rise through the ranks and prove you have the best football intuition on the planet.
                                </p>
                            </div>

                            <div className="bg-card/80 backdrop-blur rounded-2xl p-8 text-center group border border-border shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                                <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                                    <span className="text-2xl">📊</span>
                                </div>
                                <h3 className="text-2xl font-bold text-card-foreground mb-4">Smart Analytics</h3>
                                <p className="text-muted-foreground leading-relaxed">
                                    Get detailed insights into your prediction patterns, accuracy rates, and performance trends to improve your game.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Stats Section */}
                <section className="px-6 py-4">
                    <div className="max-w-7xl mx-auto">
                        <div className="bg-card/80 backdrop-blur rounded-2xl p-12 border border-border shadow-xl">
                            <div className="text-center mb-12">
                                <h2 className="text-4xl md:text-5xl font-bold mb-6 text-card-foreground">
                                    Trusted by <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Football Fans</span> Worldwide
                                </h2>
                                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                                    Join thousands of passionate football fans who have made ScorePredict their go-to prediction platform.
                                </p>
                            </div>

                            <div className="grid md:grid-cols-4 gap-8">
                                <div className="text-center">
                                    <div className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">50K+</div>
                                    <div className="text-muted-foreground">Active Predictors</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">1M+</div>
                                    <div className="text-muted-foreground">Predictions Made</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">500+</div>
                                    <div className="text-muted-foreground">Leagues Covered</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">24/7</div>
                                    <div className="text-muted-foreground">Live Updates</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* How It Works */}
                <section className="px-6 py-20">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center mb-16">
                            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-card-foreground">
                                How It <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Works</span>
                            </h2>
                            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                                Get started in minutes and begin your journey to becoming a prediction legend.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-8">
                            <div className="bg-card/80 backdrop-blur rounded-2xl p-8 text-center border border-border shadow-lg">
                                <div className="w-12 h-12 bg-blue-500 text-white rounded-full flex items-center justify-center mx-auto mb-6 text-xl font-bold">1</div>
                                <h3 className="text-xl font-bold text-card-foreground mb-4">Sign Up Free</h3>
                                <p className="text-muted-foreground">Create your account in seconds. No credit card required, just your passion for football.</p>
                            </div>

                            <div className="bg-card/80 backdrop-blur rounded-2xl p-8 text-center border border-border shadow-lg">
                                <div className="w-12 h-12 bg-purple-500 text-white rounded-full flex items-center justify-center mx-auto mb-6 text-xl font-bold">2</div>
                                <h3 className="text-xl font-bold text-card-foreground mb-4">Make Predictions</h3>
                                <p className="text-muted-foreground">Choose from upcoming matches and predict outcomes. Use your football knowledge to your advantage.</p>
                            </div>

                            <div className="bg-card/80 backdrop-blur rounded-2xl p-8 text-center border border-border shadow-lg">
                                <div className="w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto mb-6 text-xl font-bold">3</div>
                                <h3 className="text-xl font-bold text-card-foreground mb-4">Climb Rankings</h3>
                                <p className="text-muted-foreground">Earn points for correct predictions and watch yourself rise through the global leaderboards.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="px-6 py-20">
                    <div className="max-w-4xl mx-auto">
                        <div className="bg-card/80 backdrop-blur rounded-2xl p-12 text-center border border-border shadow-xl">
                            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-card-foreground">
                                Ready to <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Dominate</span>?
                            </h2>
                            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                                Join the most exciting football prediction community and turn your football knowledge into legendary status.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                                <Link
                                    href={register.url()}
                                    className="bg-gradient-to-r from-primary to-secondary text-white px-8 py-4 rounded-xl font-semibold text-lg hover:opacity-90 transition-all transform hover:scale-105 shadow-xl"
                                >
                                    Start Your Journey
                                </Link>
                                <div className="text-muted-foreground text-sm">
                                    18+ only • Responsible gaming • Free to play
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
        </AppLayout>
    );
}