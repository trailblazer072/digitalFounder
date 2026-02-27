import { useState, useEffect, useRef } from 'react';
import { useParams, useOutletContext } from 'react-router-dom';
import api from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import {
    Send,
    Paperclip,
    Image as ImageIcon,
    Mic,
    Bot,
    User
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import SEO from '@/components/SEO';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
}

export default function ChatInterface() {
    const { agentId } = useParams();
    const { sections, refreshCredits } = useOutletContext<{
        sections: { id: string; name: string }[];
        refreshCredits: () => Promise<void>;
    }>() || { sections: [], refreshCredits: async () => { } };
    const agentName = sections?.find((s) => s.id === agentId)?.name || 'Agent';

    const scrollRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    // Reuse loading for upload or add separate? Let's use loading prevents chat while uploading which is fine.

    // ... (useEffect hooks)

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !e.target.files[0] || !conversationId) return;
        const file = e.target.files[0];
        setLoading(true);

        try {
            const formData = new FormData();
            formData.append('file', file);

            await api.post('/documents/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            // Add system/user message indicating upload
            const uploadMsg: Message = {
                id: Date.now().toString(),
                role: 'user', // Show as user action
                content: `📎 Uploaded **${file.name}** for analysis.`,
                timestamp: new Date().toISOString()
            };
            setMessages(prev => [...prev, uploadMsg]);

            // Optionally notify agent immediately to analyze it? 
            // For now, just context is updated.

        } catch (err) {
            console.error("Upload failed", err);
            setMessages(prev => [...prev, {
                id: 'err', role: 'assistant',
                content: "Failed to upload document. Please try again.",
                timestamp: new Date().toISOString()
            }]);
        } finally {
            setLoading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const [loading, setLoading] = useState(false);
    const [conversationId, setConversationId] = useState<string | null>(null);

    // Initialize Conversation on Agent Switch
    useEffect(() => {
        if (!agentId) return;

        const initChat = async () => {
            setMessages([]); // Clear previous chat
            setConversationId(null);
            setLoading(true);

            try {
                // 1. Get/Create Conversation ID
                const res = await api.post(`/chat/start?section_id=${agentId}`);
                const convId = res.data;
                setConversationId(convId);

                // 2. Fetch History
                const historyRes = await api.get(`/chat/${convId}/history`);
                const history = historyRes.data.map((m: any) => ({
                    id: m.id,
                    role: m.role,
                    content: m.content,
                    timestamp: m.timestamp
                }));

                if (history.length > 0) {
                    setMessages(history);
                } else {
                    // Default greeting if new
                    setMessages([{
                        id: 'init', role: 'assistant', content: 'Hello! I am ready to review your documents. How can I help?', timestamp: new Date().toISOString()
                    }]);
                }
            } catch (err) {
                console.error("Failed to load chat", err);
            } finally {
                setLoading(false);
            }
        };
        initChat();
    }, [agentId]);

    // Auto Scroll
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || !conversationId) return;

        const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input, timestamp: new Date().toISOString() };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            const res = await api.post('/chat/', {
                conversation_id: conversationId,
                message: userMsg.content
            });

            const aiMsg: Message = {
                id: Date.now().toString(),
                role: 'assistant',
                content: res.data.response,
                timestamp: new Date().toISOString()
            };
            setMessages(prev => [...prev, aiMsg]);

            // Refresh credits live
            refreshCredits();

        } catch (err) {
            console.error("Chat Error", err);
            // Construct error message in chat
            setMessages(prev => [...prev, { id: 'err', role: 'assistant', content: "I'm having trouble connecting. Please try again.", timestamp: '' }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full relative">
            <SEO title="Agent Chat" description="Interact with your AI agents." />

            {/* Messages Area - Scrollable */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 pb-4 scroll-smooth">
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={cn(
                            "flex w-full max-w-3xl mx-auto gap-4 animate-slide-up",
                            msg.role === 'user' ? "justify-end" : "justify-start"
                        )}
                    >
                        {msg.role === 'assistant' && (
                            <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center flex-shrink-0">
                                <Bot className="w-5 h-5 text-emerald-400" />
                            </div>
                        )}

                        <div className={cn(
                            "text-sm md:text-base leading-relaxed",
                            msg.role === 'user'
                                ? "bg-secondary text-white px-4 py-2 rounded-2xl rounded-tr-none max-w-[80%]"
                                : "w-full pl-0 text-gray-100"
                        )}>
                            {/* Markdown Content */}
                            <div className="prose prose-invert prose-sm max-w-none leading-relaxed break-words text-slate-200">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {msg.content}
                                </ReactMarkdown>
                            </div>
                        </div>

                        {msg.role === 'user' && (
                            <div className="w-8 h-8 rounded-lg bg-gray-700/50 flex items-center justify-center flex-shrink-0 mt-1">
                                <User className="w-5 h-5 text-gray-400" />
                            </div>
                        )}
                    </div>
                ))}

                {loading && (
                    <div className="flex w-full max-w-3xl mx-auto gap-4">
                        <div className="w-8 h-8 rounded-lg bg-indigo-600/20 flex items-center justify-center flex-shrink-0">
                            <Bot className="w-5 h-5 text-indigo-400" />
                        </div>
                        <div className="bg-surface/50 border border-white/5 px-4 py-3 rounded-2xl rounded-tl-none">
                            <span className="flex gap-1">
                                <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce"></span>
                            </span>
                        </div>
                    </div>
                )}
                <div ref={scrollRef} />
            </div>

            {/* Fixed Input Area - Stacked separately */}
            <div className="flex-none px-4 pb-6 pt-2 flex justify-center w-full z-10 bg-[#212121]">
                <div className="w-full max-w-3xl rounded-2xl overflow-hidden shadow-lg bg-[#2f2f2f] transition-all">

                    {/* Input Area */}
                    <div className="p-3 flex items-end gap-2">
                        {/* Left Actions */}
                        <div className="flex gap-1 pb-1">
                            <Button variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} className="h-9 w-9 text-slate-400 hover:text-white rounded-full">
                                <Paperclip className="w-5 h-5" />
                            </Button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept=".pdf,.txt,.md"
                                onChange={handleFileUpload}
                            />
                            <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:text-white rounded-full">
                                <ImageIcon className="w-5 h-5" />
                            </Button>
                        </div>

                        {/* Textarea */}
                        <textarea
                            className="flex-1 bg-transparent border-0 focus:ring-0 focus:outline-none text-slate-200 placeholder:text-slate-500 resize-none h-12 py-3 max-h-32 min-h-[44px]"
                            placeholder={`Message ${agentName} bro`}
                            rows={1}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
                            }}
                        />

                        {/* Right Actions */}
                        <div className="flex gap-1 pb-1">
                            <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:text-white rounded-full">
                                <Mic className="w-5 h-5" />
                            </Button>
                            <Button
                                onClick={handleSend}
                                disabled={!input.trim() || loading}
                                className={cn(
                                    "h-9 w-9 rounded-full transition-all flex items-center justify-center",
                                    input.trim() ? "bg-white text-black hover:bg-slate-200" : "bg-white/10 text-slate-500"
                                )}
                            >
                                <div className={cn("bg-black rounded-full p-1", input.trim() ? "bg-transparent" : "bg-transparent")}>
                                    <Send className="w-4 h-4" />
                                </div>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
}
