import { register, login } from '@/routes';
import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';

export default function About() {
    const { auth } = usePage<SharedData>().props;

    return (
        <>
            <Head title="About Us - Our Story">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />
            </Head>
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
                {/* Navigation */}
                <header className="px-6 py-4">
                    <nav className="max-w-7xl mx-auto flex items-center justify-between">
                        <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            ScorePredict
                        </Link>
                        <div className="flex items-center gap-4">
                            {auth.user ? (
                                <Link
                                    href="/dashboard"
                                    className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-2 rounded-xl font-semibold hover:from-blue-600 hover:to-purple-600 transition-all transform hover:scale-105 shadow-lg"
                                >
                                    Dashboard
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        href={login()}
                                        className="text-gray-700 hover:text-blue-600 font-semibold transition-colors"
                                    >
                                        Log in
                                    </Link>
                                    <Link
                                        href={register()}
                                        className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-2 rounded-xl font-semibold hover:from-blue-600 hover:to-purple-600 transition-all transform hover:scale-105 shadow-lg"
                                    >
                                        Register
                                    </Link>
                                </>
                            )}
                        </div>
                    </nav>
                </header>

                {/* Hero Section */}
                <section className="relative px-6 py-8">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center mb-16">
                            <div className="bg-white/80 backdrop-blur rounded-2xl p-12 border border-gray-200 shadow-xl">
                                <h1 className="text-5xl md:text-6xl font-bold mb-6">
                                    About <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">ScorePredict</span>
                                </h1>
                                <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
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
                            <div className="bg-white/80 backdrop-blur rounded-2xl p-10 border border-gray-200 shadow-xl">
                                <h2 className="text-4xl font-bold mb-6">
                                    Our <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Mission</span>
                                </h2>
                                <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                                    At ScorePredict, we believe every football fan has an inner analyst waiting to shine. 
                                    We've created a platform that transforms your football passion into engaging predictions, 
                                    meaningful competition, and lasting connections with fellow fans worldwide.
                                </p>
                                <p className="text-lg text-gray-600 leading-relaxed">
                                    Our advanced algorithms ensure fair play, while our community features foster the spirit 
                                    of friendly competition that makes football so special.
                                </p>
                            </div>
                            
                            <div className="bg-white/80 backdrop-blur rounded-2xl p-10 border border-gray-200 shadow-xl">
                                <div className="space-y-8">
                                    <div className="flex items-start space-x-4">
                                        <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
                                            <span className="text-white text-xl">🎯</span>
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-800 mb-2">Accuracy First</h3>
                                            <p className="text-gray-600">We use cutting-edge technology to ensure fair scoring and real-time updates.</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-start space-x-4">
                                        <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center flex-shrink-0">
                                            <span className="text-white text-xl">🤝</span>
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-800 mb-2">Community Driven</h3>
                                            <p className="text-gray-600">Built by football fans, for football fans. Every feature comes from community feedback.</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-start space-x-4">
                                        <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center flex-shrink-0">
                                            <span className="text-white text-xl">🛡️</span>
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-800 mb-2">Safe & Responsible</h3>
                                            <p className="text-gray-600">We promote responsible gaming with built-in safeguards and age verification.</p>
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
                                Our <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Values</span>
                            </h2>
                            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                                These principles guide everything we do at ScorePredict.
                            </p>
                        </div>
                        
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                            <div className="bg-white/80 backdrop-blur rounded-2xl p-8 text-center border border-gray-200 shadow-lg">
                                <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                    <span className="text-2xl">⚡</span>
                                </div>
                                <h3 className="text-xl font-bold text-gray-800 mb-4">Innovation</h3>
                                <p className="text-gray-600">We continuously push boundaries to create the most engaging prediction experience.</p>
                            </div>
                            
                            <div className="bg-white/80 backdrop-blur rounded-2xl p-8 text-center border border-gray-200 shadow-lg">
                                <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                    <span className="text-2xl">🏆</span>
                                </div>
                                <h3 className="text-xl font-bold text-gray-800 mb-4">Excellence</h3>
                                <p className="text-gray-600">Every detail matters. From user experience to data accuracy, we strive for perfection.</p>
                            </div>
                            
                            <div className="bg-white/80 backdrop-blur rounded-2xl p-8 text-center border border-gray-200 shadow-lg">
                                <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                    <span className="text-2xl">💙</span>
                                </div>
                                <h3 className="text-xl font-bold text-gray-800 mb-4">Integrity</h3>
                                <p className="text-gray-600">Transparency and fairness are at the core of our platform and community.</p>
                            </div>
                            
                            <div className="bg-white/80 backdrop-blur rounded-2xl p-8 text-center border border-gray-200 shadow-lg">
                                <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-400 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                    <span className="text-2xl">🌍</span>
                                </div>
                                <h3 className="text-xl font-bold text-gray-800 mb-4">Global</h3>
                                <p className="text-gray-600">Football is universal, and so is our platform. We welcome fans from every corner of the world.</p>
                            </div>
                            
                            <div className="bg-white/80 backdrop-blur rounded-2xl p-8 text-center border border-gray-200 shadow-lg">
                                <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-green-400 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                    <span className="text-2xl">🎉</span>
                                </div>
                                <h3 className="text-xl font-bold text-gray-800 mb-4">Fun First</h3>
                                <p className="text-gray-600">At the end of the day, football is about joy. We make sure every interaction is enjoyable.</p>
                            </div>
                            
                            <div className="bg-white/80 backdrop-blur rounded-2xl p-8 text-center border border-gray-200 shadow-lg">
                                <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                    <span className="text-2xl">📈</span>
                                </div>
                                <h3 className="text-xl font-bold text-gray-800 mb-4">Growth</h3>
                                <p className="text-gray-600">We help our users improve their prediction skills while growing as a football community.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Team Section */}
                <section className="px-6 py-20">
                    <div className="max-w-7xl mx-auto">
                        <div className="bg-white/80 backdrop-blur rounded-2xl p-12 border border-gray-200 shadow-xl">
                            <div className="text-center mb-12">
                                <h2 className="text-4xl md:text-5xl font-bold mb-6">
                                    Meet the <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Team</span>
                                </h2>
                                <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                                    We're a passionate group of developers, designers, and football enthusiasts working to create the best prediction platform.
                                </p>
                            </div>
                            
                            <div className="grid md:grid-cols-3 gap-8">
                                <div className="text-center">
                                    <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <span className="text-2xl">👨‍💻</span>
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-800 mb-2">Development Team</h3>
                                    <p className="text-gray-600">Building cutting-edge features with the latest technology to ensure the best user experience.</p>
                                </div>
                                
                                <div className="text-center">
                                    <div className="w-20 h-20 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <span className="text-2xl">🎨</span>
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-800 mb-2">Design Team</h3>
                                    <p className="text-gray-600">Creating beautiful, intuitive interfaces that make predicting matches a delightful experience.</p>
                                </div>
                                
                                <div className="text-center">
                                    <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <span className="text-2xl">📊</span>
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-800 mb-2">Data Team</h3>
                                    <p className="text-gray-600">Ensuring accurate, real-time football data and maintaining the integrity of our scoring system.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Contact CTA */}
                <section className="px-6 py-20">
                    <div className="max-w-4xl mx-auto">
                        <div className="bg-white/80 backdrop-blur rounded-2xl p-12 text-center border border-gray-200 shadow-xl">
                            <h2 className="text-4xl font-bold mb-6">
                                Join Our <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Community</span>
                            </h2>
                            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                                Ready to put your football knowledge to the test? Join thousands of passionate fans who've made ScorePredict their home.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                                <Link 
                                    href={register()} 
                                    className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:from-blue-600 hover:to-purple-600 transition-all transform hover:scale-105 shadow-xl"
                                >
                                    Get Started Today
                                </Link>
                                <Link 
                                    href="/" 
                                    className="text-gray-700 hover:text-blue-600 font-semibold text-lg flex items-center space-x-2 transition-colors"
                                >
                                    <span>← Back to Home</span>
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </>
    );
}