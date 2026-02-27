import { useState, useEffect, useRef } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { FileText, Upload, CheckCircle2 } from 'lucide-react';
import SEO from '@/components/SEO';

interface Document {
    id: string;
    filename: string;
    upload_date: string;
}

export default function AssetsLibrary() {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchDocuments = async () => {
        try {
            const res = await api.get('/documents/');
            setDocuments(res.data);
        } catch (err) {
            console.error("Failed to load documents", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDocuments();
    }, []);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !e.target.files[0]) return;

        const file = e.target.files[0];
        setUploading(true);

        try {
            const formData = new FormData();
            formData.append('file', file);

            await api.post('/documents/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            // Refresh list
            await fetchDocuments();

        } catch (err) {
            console.error("Upload failed", err);
            alert("Failed to upload document");
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <div className="p-8 h-full flex flex-col">
            <SEO title="Assets Library" description="Manage your organization's knowledge base." />
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Assets Library</h1>
                    <p className="text-slate-400">Manage your organization's knowledge base.</p>
                </div>

                <Button onClick={() => fileInputRef.current?.click()} disabled={uploading} variant="glow">
                    {uploading ? (
                        "Uploading..."
                    ) : (
                        <>
                            <Upload className="w-4 h-4 mr-2" /> Upload New Asset
                        </>
                    )}
                </Button>
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept=".txt,.pdf,.md"
                    onChange={handleFileUpload}
                />
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[1, 2, 3].map(i => <div key={i} className="h-32 bg-white/5 rounded-xl animate-pulse" />)}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {documents.length === 0 && (
                        <div className="col-span-full text-center py-20 text-slate-500 border border-dashed border-white/10 rounded-xl">
                            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>No documents found. Upload your first asset to train your agents.</p>
                        </div>
                    )}

                    {documents.map(doc => (
                        <Card key={doc.id} className="group hover:border-primary/50 transition-all cursor-default relative overflow-hidden">
                            <div className="flex items-start justify-between">
                                <div className="p-3 bg-white/5 rounded-lg group-hover:bg-primary/10 transition-colors">
                                    <FileText className="w-6 h-6 text-slate-300 group-hover:text-primary" />
                                </div>
                                {/* Identify as processed */}
                                <div className="px-2 py-1 bg-emerald-500/10 rounded text-xs text-emerald-400 font-medium flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" /> Indexed
                                </div>
                            </div>

                            <h3 className="mt-4 font-semibold text-white truncate" title={doc.filename}>
                                {doc.filename}
                            </h3>
                            <p className="text-xs text-slate-500 mt-1">
                                Added {new Date(doc.upload_date).toLocaleDateString()}
                            </p>

                            {/* Hover Decoration */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
