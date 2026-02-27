import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import {
    LogOut,
    ChevronDown,
    Library,
    CreditCard
} from 'lucide-react';

interface Section {
    id: string;
    name: string;
    role_persona: string;
}

interface UserInfo {
    id: string;
    email: string;
    full_name: string;
    org: {
        name: string;
        industry: string;
        credits_used: number;
    } | null;
}

export default function DashboardLayout() {
    const navigate = useNavigate();
    const [sections, setSections] = useState<Section[]>([]);
    const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            const [meRes, sectionsRes] = await Promise.all([
                api.get('/auth/me'),
                api.get('/chat/sections')
            ]);

            setUserInfo(meRes.data);
            setSections(sectionsRes.data);
        } catch (err) {
            console.error("Failed to load dashboard data", err);
        } finally {
            setLoading(false);
        }
    };

    const refreshCredits = async () => {
        try {
            const meRes = await api.get('/auth/me');
            setUserInfo(meRes.data);
        } catch (err) {
            console.error("Failed to refresh credits", err);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    const creditsUsed = userInfo?.org?.credits_used || 0;
    const maxCredits = 100;
    const creditPercentage = Math.min((creditsUsed / maxCredits) * 100, 100);

    return (
        <div className="flex h-screen bg-[#212121] text-slate-200 overflow-hidden font-sans">
            {/* Sidebar - Barista Inspired */}
            <aside className="w-[280px] flex-shrink-0 border-r border-white/5 bg-[#171717] flex flex-col justify-between">

                {/* Top: Org & Nav */}
                <div className="flex flex-col h-full">
                    {/* Org Switcher */}
                    <div className="p-4 border-b border-white/5">
                        <button className="flex items-center gap-3 w-full hover:bg-white/5 p-2 rounded-lg transition-colors group">
                            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold group-hover:bg-indigo-500">
                                {userInfo?.org?.name?.[0]?.toUpperCase() || 'A'}
                            </div>
                            <div className="text-left flex-1 min-w-0">
                                <p className="text-sm font-semibold text-white truncate">{userInfo?.org?.name || 'Loading...'}</p>
                                <p className="text-xs text-slate-500 truncate">Pro Plan</p>
                            </div>
                            <ChevronDown className="w-4 h-4 text-slate-500" />
                        </button>
                    </div>

                    {/* Navigation Sections */}
                    <div className="flex-1 overflow-y-auto py-4 space-y-6 px-3">

                        {/* Resources Group */}
                        <div>
                            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 mb-2">Resources</h3>
                            <NavLink to="/app/assets" className={({ isActive }) => cn("flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-all", isActive && "bg-white/5 text-white")}>
                                <Library className="w-4 h-4" /> Assets Library
                            </NavLink>
                        </div>

                        {/* Projects / Agents Group */}
                        <div>
                            <div className="flex items-center justify-between px-3 mb-2">
                                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Agents</h3>
                                <span className="text-xs text-slate-600 hover:text-white cursor-pointer">+</span>
                            </div>

                            {loading ? (
                                <div className="px-3 space-y-2">
                                    {[1, 2, 3].map(i => <div key={i} className="h-8 bg-white/5 rounded animate-pulse" />)}
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    {sections.map(section => (
                                        <NavLink
                                            key={section.id}
                                            to={`/app/agent/${section.id}`}
                                            className={({ isActive }) => cn(
                                                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all",
                                                isActive ? "bg-[#2A2B32] text-white" : "text-[#ECECEC]/70 hover:bg-[#2A2B32]/50 hover:text-white"
                                            )}
                                        >
                                            <div className="w-2 h-2 rounded-full bg-emerald-500/50" />
                                            {section.name}
                                        </NavLink>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer / Usage */}
                        <div className="mt-auto">
                            <div className="p-3 bg-white/5 rounded-xl border border-white/5 mx-2">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-medium text-white">Credits Usage</span>
                                    <span className="text-xs text-slate-400">{creditsUsed}/{maxCredits}</span>
                                </div>
                                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                                        style={{ width: `${creditPercentage}%` }}
                                    />
                                </div>
                                <button className="mt-3 w-full py-1.5 text-xs font-medium bg-primary/20 text-primary hover:text-white hover:bg-primary rounded-lg transition-all flex items-center justify-center gap-1">
                                    <CreditCard className="w-3 h-3" /> Upgrade Plan
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* User Profile */}
                <div className="p-4 border-t border-white/5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <img
                                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(userInfo?.full_name || 'User')}&background=random`}
                                className="w-8 h-8 rounded-full"
                                alt="User"
                            />
                            <div className="text-sm">
                                <p className="text-white font-medium">{userInfo?.full_name || 'Founder'}</p>
                            </div>
                        </div>
                        <button onClick={handleLogout} className="text-slate-500 hover:text-white">
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                </div>

            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col relative min-w-0 bg-[#212121]">
                <Outlet context={{ sections, refreshCredits }} />
            </main>
        </div>
    );
}
