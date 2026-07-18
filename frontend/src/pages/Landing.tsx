import { Link } from 'react-router-dom';
import {
    AudioLines,
    Network,
    Cloud,
    Table,
    Hash,
    Mail,
    Headset,
    BarChart2,
    BookOpen,
    Users,
    Webhook,
    Zap,
    ShieldCheck,
    RefreshCw,
    BarChart
} from 'lucide-react';
import { Button } from '../components/ui/Button';

export function Landing() {
    return (
        <div className="min-h-screen bg-[#fafbfc] flex flex-col font-sans overflow-x-hidden">
            {/* Navbar */}
            <nav className="border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
                <div className="mx-auto w-full max-w-7xl px-6 md:px-12 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className="bg-primary-600 text-white p-1.5 rounded-lg shadow-sm">
                            <AudioLines size={22} className="stroke-[2.5]" />
                        </div>
                        <span className="text-xl font-bold tracking-tight text-gray-900">AI Calling</span>
                    </div>

                    <div className="hidden lg:flex items-center gap-8 text-sm font-medium text-gray-600">
                        <a href="#features" className="hover:text-primary-600 transition-colors">Features</a>
                        <a href="#how-it-works" className="hover:text-primary-600 transition-colors">How it Works</a>
                        <a href="#integrations" className="hover:text-primary-600 transition-colors">Integrations</a>
                        <a href="#pricing" className="hover:text-primary-600 transition-colors">Pricing</a>
                        <a href="#resources" className="hover:text-primary-600 transition-colors">Resources</a>
                    </div>

                    <div className="flex items-center gap-4">
                        <Link to="/login" className="text-gray-600 hover:text-gray-900 font-medium text-sm transition-colors hidden sm:block">Log in</Link>
                        <Link to="/register"><Button variant="primary" className="shadow-sm rounded-lg hover:shadow-md transition-all">Get Started</Button></Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-8 pt-20 pb-16">
                <div className="text-center mb-16 max-w-3xl mx-auto">
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-gray-900 mb-6 leading-tight">
                        Autonomous Voice Intelligence,
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-indigo-600">Wired Into Your Entire Stack</span>
                    </h1>
                    <p className="text-lg md:text-xl text-gray-500 mb-8 max-w-2xl mx-auto">
                        Deploy hyper-realistic AI agents that seamlessly read from and write to your CRMs, databases, and everyday tools. Automate sales, support, and workflows instantly.
                    </p>
                </div>

                {/* Platform Dashboard Preview Image */}
                <div className="w-full max-w-5xl mx-auto mt-24 mb-10 px-2 sm:px-0">
                    <div className="rounded-2xl sm:rounded-3xl border border-gray-200/60 bg-white/50 backdrop-blur-sm p-2 sm:p-4 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] relative overflow-hidden group">
                        {/* Decorative glow behind image */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-primary-100 rounded-full blur-[100px] opacity-40 pointer-events-none"></div>

                        <img
                            src="/preview_dashboard.png"
                            alt="AI Calling Platform Dashboard Preview"
                            className="w-full h-auto rounded-xl sm:rounded-2xl border border-gray-100 shadow-sm object-cover relative z-10 transition-transform duration-700 ease-in-out group-hover:scale-[1.01]"
                        />
                    </div>
                </div>
            </main>

            {/* Bottom Features Banner */}
            <div className="w-full max-w-7xl mx-auto px-4 md:px-8 pb-20">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-8 md:gap-4 flex-wrap">
                    <FeatureItem icon={<Zap className="text-primary-500" size={24} />} title="Easy Integration" desc="Connect in minutes, not hours" />
                    <div className="hidden md:block w-px h-12 bg-gray-100"></div>
                    <FeatureItem icon={<ShieldCheck className="text-primary-500" size={24} />} title="Secure & Reliable" desc="Enterprise-grade security" />
                    <div className="hidden md:block w-px h-12 bg-gray-100"></div>
                    <FeatureItem icon={<RefreshCw className="text-primary-500" size={24} />} title="Real-time Sync" desc="Always up-to-date" />
                    <div className="hidden md:block w-px h-12 bg-gray-100"></div>
                    <FeatureItem icon={<BarChart className="text-primary-500" size={24} />} title="Workflow Automation" desc="Save time and close more deals" />
                </div>
            </div>

        </div>
    );
}

// Sub-components for cleaner structure

function IntegrationCard({ icon, name, desc, dotColor, dotPos }: { icon: React.ReactNode, name: string, desc: string, dotColor: string, dotPos: 'left' | 'right' }) {
    return (
        <div className="relative group bg-white rounded-xl border border-gray-100 p-3 shadow-sm hover:shadow-md hover:border-primary-100 transition-all duration-300 flex items-center gap-4 h-[76px]">
            {/* The colored icon container */}
            <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-gray-50 group-hover:bg-primary-50 transition-colors">
                {icon}
            </div>

            {/* Text content */}
            <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-gray-900 truncate">{name}</h3>
                <p className="text-[11px] leading-snug text-gray-500 line-clamp-2 mt-0.5">{desc}</p>
            </div>

            {/* Connection Dot */}
            <div
                className={`hidden md:block absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full ${dotPos === 'right' ? '-right-1' : '-left-1'}`}
                style={{ backgroundColor: dotColor }}
            />
        </div>
    );
}

function FeatureItem({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
    return (
        <div className="flex items-center gap-4 flex-1 w-full md:w-auto">
            <div className="p-2.5 bg-primary-50 rounded-xl shrink-0">
                {icon}
            </div>
            <div>
                <h4 className="text-sm font-bold text-gray-900">{title}</h4>
                <p className="text-xs text-gray-500 mt-1">{desc}</p>
            </div>
        </div>
    );
}
