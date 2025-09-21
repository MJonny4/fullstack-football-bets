import AppLayout from '@/layouts/app-layout';
import { register, login } from '@/routes';
import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';

export default function About() {
    const { auth } = usePage<SharedData>().props;

    return (
        <AppLayout>
            <Head title="About Us - Our Story">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />
            </Head>

                {/* Hero Section */}
                <section className="relative px-6 py-8">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center mb-16">
                            <div className="bg-card/80 backdrop-blur rounded-2xl p-12 border border-border shadow-xl">
                                <h1 className="text-5xl md:text-6xl font-bold mb-6">
                                    About <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">ScorePredict</span>
                                </h1>
                                <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                                    We're passionate football fans who believe that predicting matches should be as exciting as watching them. 
                                    Our mission is to create the ultimate platform where football knowledge meets friendly competition.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Mission Section */}
                <section className="px-6 py-10">
                    <div className="max-w-7xl mx-auto">
                        <div className="grid lg:grid-cols-2 gap-12 items-center">
                            <div className="bg-card/80 backdrop-blur rounded-2xl p-10 border border-border shadow-xl">
                                <h2 className="text-4xl font-bold mb-6">
                                    Our <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Mission</span>
                                </h2>
                                <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                                    At ScorePredict, we believe every football fan has an inner analyst waiting to shine. 
                                    We've created a platform that transforms your football passion into engaging predictions, 
                                    meaningful competition, and lasting connections with fellow fans worldwide.
                                </p>
                                <p className="text-lg text-muted-foreground leading-relaxed">
                                    Our advanced algorithms ensure fair play, while our community features foster the spirit 
                                    of friendly competition that makes football so special.
                                </p>
                            </div>
                            
                            <div className="bg-card/80 backdrop-blur rounded-2xl p-10 border border-border shadow-xl">
                                <div className="space-y-8">
                                    <div className="flex items-start space-x-4">
                                        <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center flex-shrink-0">
                                            <span className="text-white text-xl">🎯</span>
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-card-foreground mb-2">Accuracy First</h3>
                                            <p className="text-muted-foreground">We use cutting-edge technology to ensure fair scoring and real-time updates.</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-start space-x-4">
                                        <div className="w-12 h-12 bg-secondary rounded-xl flex items-center justify-center flex-shrink-0">
                                            <span className="text-white text-xl">🤝</span>
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-card-foreground mb-2">Community Driven</h3>
                                            <p className="text-muted-foreground">Built by football fans, for football fans. Every feature comes from community feedback.</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-start space-x-4">
                                        <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center flex-shrink-0">
                                            <span className="text-white text-xl">🛡️</span>
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-card-foreground mb-2">Safe & Responsible</h3>
                                            <p className="text-muted-foreground">We promote responsible gaming with built-in safeguards and age verification.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Values Section */}
                <section className="px-6 py-20">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center mb-16">
                            <h2 className="text-4xl md:text-5xl font-bold mb-6">
                                Our <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Values</span>
                            </h2>
                            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                                These principles guide everything we do at ScorePredict.
                            </p>
                        </div>
                        
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                            <div className="bg-card/80 backdrop-blur rounded-2xl p-8 text-center border border-border shadow-lg">
                                <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                    <span className="text-2xl">⚡</span>
                                </div>
                                <h3 className="text-xl font-bold text-card-foreground mb-4">Innovation</h3>
                                <p className="text-muted-foreground">We continuously push boundaries to create the most engaging prediction experience.</p>
                            </div>
                            
                            <div className="bg-card/80 backdrop-blur rounded-2xl p-8 text-center border border-border shadow-lg">
                                <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                    <span className="text-2xl">🏆</span>
                                </div>
                                <h3 className="text-xl font-bold text-card-foreground mb-4">Excellence</h3>
                                <p className="text-muted-foreground">Every detail matters. From user experience to data accuracy, we strive for perfection.</p>
                            </div>
                            
                            <div className="bg-card/80 backdrop-blur rounded-2xl p-8 text-center border border-border shadow-lg">
                                <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                    <span className="text-2xl">💙</span>
                                </div>
                                <h3 className="text-xl font-bold text-card-foreground mb-4">Integrity</h3>
                                <p className="text-muted-foreground">Transparency and fairness are at the core of our platform and community.</p>
                            </div>
                            
                            <div className="bg-card/80 backdrop-blur rounded-2xl p-8 text-center border border-border shadow-lg">
                                <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-400 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                    <span className="text-2xl">🌍</span>
                                </div>
                                <h3 className="text-xl font-bold text-card-foreground mb-4">Global</h3>
                                <p className="text-muted-foreground">Football is universal, and so is our platform. We welcome fans from every corner of the world.</p>
                            </div>
                            
                            <div className="bg-card/80 backdrop-blur rounded-2xl p-8 text-center border border-border shadow-lg">
                                <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-green-400 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                    <span className="text-2xl">🎉</span>
                                </div>
                                <h3 className="text-xl font-bold text-card-foreground mb-4">Fun First</h3>
                                <p className="text-muted-foreground">At the end of the day, football is about joy. We make sure every interaction is enjoyable.</p>
                            </div>
                            
                            <div className="bg-card/80 backdrop-blur rounded-2xl p-8 text-center border border-border shadow-lg">
                                <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                    <span className="text-2xl">📈</span>
                                </div>
                                <h3 className="text-xl font-bold text-card-foreground mb-4">Growth</h3>
                                <p className="text-muted-foreground">We help our users improve their prediction skills while growing as a football community.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Team Section */}
                <section className="px-6 py-20">
                    <div className="max-w-7xl mx-auto">
                        <div className="bg-card/80 backdrop-blur rounded-2xl p-12 border border-border shadow-xl">
                            <div className="text-center mb-12">
                                <h2 className="text-4xl md:text-5xl font-bold mb-6">
                                    Meet the <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Team</span>
                                </h2>
                                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                                    We're a passionate group of developers, designers, and football enthusiasts working to create the best prediction platform.
                                </p>
                            </div>
                            
                            <div className="grid md:grid-cols-3 gap-8">
                                <div className="text-center">
                                    <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <span className="text-2xl">👨‍💻</span>
                                    </div>
                                    <h3 className="text-xl font-bold text-card-foreground mb-2">Development Team</h3>
                                    <p className="text-muted-foreground">Building cutting-edge features with the latest technology to ensure the best user experience.</p>
                                </div>
                                
                                <div className="text-center">
                                    <div className="w-20 h-20 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <span className="text-2xl">🎨</span>
                                    </div>
                                    <h3 className="text-xl font-bold text-card-foreground mb-2">Design Team</h3>
                                    <p className="text-muted-foreground">Creating beautiful, intuitive interfaces that make predicting matches a delightful experience.</p>
                                </div>
                                
                                <div className="text-center">
                                    <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <span className="text-2xl">📊</span>
                                    </div>
                                    <h3 className="text-xl font-bold text-card-foreground mb-2">Data Team</h3>
                                    <p className="text-muted-foreground">Ensuring accurate, real-time football data and maintaining the integrity of our scoring system.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Contact CTA */}
                <section className="px-6 py-20">
                    <div className="max-w-4xl mx-auto">
                        <div className="bg-card/80 backdrop-blur rounded-2xl p-12 text-center border border-border shadow-xl">
                            <h2 className="text-4xl font-bold mb-6">
                                Join Our <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Community</span>
                            </h2>
                            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                                Ready to put your football knowledge to the test? Join thousands of passionate fans who've made ScorePredict their home.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                                <Link 
                                    href={register()} 
                                    className="bg-gradient-to-r from-primary to-secondary text-white px-8 py-4 rounded-xl font-semibold text-lg hover:opacity-90 transition-all transform hover:scale-105 shadow-xl"
                                >
                                    Get Started Today
                                </Link>
                                <Link 
                                    href="/" 
                                    className="text-foreground hover:text-primary font-semibold text-lg flex items-center space-x-2 transition-colors"
                                >
                                    <span>← Back to Home</span>
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>
        </AppLayout>
    );
}