import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Bot, Mail, Lock } from 'lucide-react';
import SEO from '@/components/SEO';

export default function LoginPage() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ username: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Backend expects form-data for OAuth2 spec
            const params = new URLSearchParams();
            params.append('username', formData.username);
            params.append('password', formData.password);

            const response = await api.post('/auth/login', params, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });

            localStorage.setItem('token', response.data.access_token);

            // Check if user has org (Need a new endpoint for 'me' or just try to fetch sections)
            // For now, simplify: Try to list sections. If fail -> Onboarding.
            try {
                await api.get('/chat/sections');
                navigate('/app');
            } catch (err) {
                navigate('/setup');
            }
        } catch (err) {
            setError('Invalid email or password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden p-6">
            <SEO title="Login" description="Sign in to your AI Board of Directors." />
            {/* Glows */}
            <div className="absolute top-[-50%] left-[-20%] w-[800px] h-[800px] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />

            <div className="w-full max-w-md animate-fade-in z-10">
                <div className="text-center mb-8">
                    <div className="mx-auto w-12 h-12 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-xl flex items-center justify-center mb-4 neon-glow">
                        <Bot className="text-white w-7 h-7" />
                    </div>
                    <h2 className="text-3xl font-bold text-white">Welcome Back</h2>
                    <p className="text-slate-400 mt-2">Sign in to your AI Board of Directors</p>
                </div>

                <Card>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-sm text-center">{error}</div>}

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300 ml-1">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-2.5 h-5 w-5 text-slate-500" />
                                <input
                                    type="email"
                                    required
                                    className="w-full pl-10 h-10 rounded-lg glass-input outline-none"
                                    placeholder="you@startup.com"
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300 ml-1">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-2.5 h-5 w-5 text-slate-500" />
                                <input
                                    type="password"
                                    required
                                    className="w-full pl-10 h-10 rounded-lg glass-input outline-none"
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                />
                            </div>
                        </div>

                        <Button className="w-full mt-4" size="lg" variant="glow" isLoading={loading}>
                            Sign In
                        </Button>

                        <div className="text-center text-sm text-slate-500 mt-4">
                            Don't have an account? <span className="text-primary hover:text-primary/80 cursor-pointer" onClick={() => navigate('/signup')}>Sign up</span>
                        </div>
                    </form>
                </Card>
            </div>
        </div>
    );
}
