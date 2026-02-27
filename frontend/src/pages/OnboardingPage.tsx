import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Bot, Upload, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import SEO from '@/components/SEO';

export default function OnboardingPage() {
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState({ org_name: '', industry: '' });
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState(''); // Text status e.g. "Hiring CFO..."

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return;

        setLoading(true);
        setStatus('Creating Organization...');

        try {
            const data = new FormData();
            data.append('org_name', formData.org_name);
            data.append('industry', formData.industry);
            data.append('file', file);

            // Simulate steps for UX
            setTimeout(() => setStatus('Deploying Finance Agent...'), 1000);
            setTimeout(() => setStatus('Briefing Marketing Team...'), 2000);
            setTimeout(() => setStatus('Indexing Knowledge Base...'), 3000);

            await api.post('/onboarding/setup', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setStatus('Complete!');
            setTimeout(() => {
                navigate('/app');
            }, 1000);

        } catch (err) {
            console.error(err);
            setStatus('Error deploying agents.');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden p-6">
            <SEO title="Setup Organization" description="Initialize your Digital HQ and deploy AI agents." />
            <div className="absolute top-[20%] right-[30%] w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />

            <div className="w-full max-w-2xl animate-fade-in z-10">
                <div className="text-center mb-10">
                    <h2 className="text-4xl font-bold text-white mb-4">Initialize Your Digital HQ</h2>
                    <p className="text-slate-400">Tell us about your startup and upload a key document (Pitch Deck, Business Plan) to train your agents.</p>
                </div>

                <Card className="backdrop-blur-xl bg-surface/80 border-white/10">
                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">Startup Name</label>
                                <input
                                    type="text" required
                                    className="w-full p-3 rounded-lg glass-input outline-none"
                                    placeholder="Acme AI"
                                    value={formData.org_name}
                                    onChange={(e) => setFormData({ ...formData, org_name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">Industry</label>
                                <input
                                    type="text" required
                                    className="w-full p-3 rounded-lg glass-input outline-none"
                                    placeholder="SaaS / Fintech"
                                    value={formData.industry}
                                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* File Upload Zone */}
                        <div
                            className={cn(
                                "border-2 border-dashed border-white/10 rounded-xl p-10 flex flex-col items-center justify-center transition-all cursor-pointer hover:bg-white/5 group",
                                file ? "border-emerald-500/50 bg-emerald-500/5" : "hover:border-primary/50"
                            )}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept=".txt,.pdf,.md"
                                onChange={handleFileChange}
                            />

                            {file ? (
                                <>
                                    <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mb-4">
                                        <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                                    </div>
                                    <p className="text-lg font-medium text-white">{file.name}</p>
                                    <p className="text-sm text-emerald-400 mt-1">Ready for ingestion</p>
                                </>
                            ) : (
                                <>
                                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                                        <Upload className="w-8 h-8 text-slate-400 group-hover:text-primary transition-colors" />
                                    </div>
                                    <p className="text-lg font-medium text-white">Upload Knowledge Base</p>
                                    <p className="text-sm text-slate-500 mt-2">Drag & drop or click to browse (.pdf, .txt)</p>
                                </>
                            )}
                        </div>

                        <div className="border-t border-white/5 pt-6">
                            <Button
                                className="w-full h-14 text-lg font-semibold"
                                variant={loading ? "secondary" : "glow"}
                                disabled={loading || !file}
                            >
                                {loading ? (
                                    <span className="flex items-center gap-2">
                                        <Bot className="animate-bounce w-5 h-5" /> {status}
                                    </span>
                                ) : "Deploy Agents & Initialize HQ"}
                            </Button>
                        </div>

                    </form>
                </Card>
            </div>
        </div>
    )
}
