import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ArrowRight, Bot, Target, TrendingUp, BarChart3 } from 'lucide-react';

export default function LandingPage() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-background relative overflow-hidden flex flex-col items-center">
            {/* Background Glows */}
            <div className="absolute top-[-20%] left-[20%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[10%] w-[400px] h-[400px] bg-secondary/10 rounded-full blur-[100px] pointer-events-none" />

            {/* Navbar */}
            <nav className="w-full max-w-7xl mx-auto p-6 flex justify-between items-center z-10">
                <div className="text-2xl font-bold flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                        <Bot className="text-white w-5 h-5" />
                    </div>
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                        Axel
                    </span>
                </div>
                <div className="flex gap-4">
                    <Button variant="ghost" onClick={() => navigate('/login')}>Login</Button>
                    <Button variant="outline" onClick={() => navigate('/signup')}>Sign Up</Button>
                </div>
            </nav>

            {/* Hero Section */}
            <main className="flex-1 w-full max-w-5xl px-6 flex flex-col items-center justify-center text-center z-10 mt-20">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm text-xs font-medium text-slate-300 mb-6 animate-fade-in">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Powered by Gemini Pro & Pinecone
                </div>

                <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 animate-slide-up">
                    Your AI <br className="hidden md:block" />
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-violet-400 to-fuchsia-400 neon-glow">
                        Board of Directors
                    </span>
                </h1>

                <p className="text-lg md:text-xl text-slate-400 max-w-2xl mb-10 animate-slide-up delay-100">
                    Scale your startup with expert AI Agents dedicated to Finance, Marketing, and Sales.
                    Upload your docs and get actionable C-level advice instantly.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 animate-slide-up delay-200">
                    <Button size="lg" variant="glow" onClick={() => navigate('/signup')}>
                        Start Your Journey <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                    <Button size="lg" variant="outline" onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>
                        Learn More
                    </Button>
                </div>
            </main>

            {/* Features Grid */}
            <section id="features" className="w-full max-w-7xl mx-auto px-6 py-32 grid md:grid-cols-3 gap-8 z-10">
                <FeatureCard
                    icon={<BarChart3 className="w-8 h-8 text-blue-400" />}
                    title="Finance Expert"
                    description="A strict CFO to analyze your runway, P&L, and optimize your burn rate."
                />
                <FeatureCard
                    icon={<Target className="w-8 h-8 text-fuchsia-400" />}
                    title="Marketing Guru"
                    description="Creative CMO to craft viral campaigns and refine your brand positioning."
                />
                <FeatureCard
                    icon={<TrendingUp className="w-8 h-8 text-emerald-400" />}
                    title="Sales Machine"
                    description="Aggressive logic to close deals, draft cold emails, and handle objections."
                />
            </section>
        </div>
    );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
    return (
        <Card className="hover:border-white/20 transition-all hover:-translate-y-1 group">
            <div className="mb-4 p-3 bg-white/5 w-fit rounded-lg group-hover:bg-white/10 transition-colors">
                {icon}
            </div>
            <h3 className="text-xl font-semibold mb-2 text-white">{title}</h3>
            <p className="text-slate-400">{description}</p>
        </Card>
    )
}
