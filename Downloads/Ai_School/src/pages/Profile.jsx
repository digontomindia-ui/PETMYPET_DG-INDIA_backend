import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, Edit2, LogOut, Award, Target, Trophy, TrendingUp, Zap, Shield, CheckCircle, Clock, Home, BookOpen, Swords, BarChart2, Menu, Star, Hexagon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/api';

export default function Profile() {
    const navigate = useNavigate();
    const { user, logout } = useAuth(); // Assuming logout is exposed
    const [loading, setLoading] = useState(true);
    const [dashboardData, setDashboardData] = useState(null);

    const handleLogout = async () => {
        try {
            if (logout) await logout();
            navigate('/signin');
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const response = await api.get('/user/dashboard');
                setDashboardData(response.data);
            } catch (error) {
                console.error("Failed to fetch dashboard data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, []);

    // Process API data or use fallback defaults
    const stats = {
        wins: dashboardData?.streaks?.match_wins || 0,
        losses: (dashboardData?.stats?.total_matches || 0) - (dashboardData?.streaks?.match_wins || 0),
        earned: dashboardData?.stats?.earnings?.replace('$', '') || 0,
        badges: dashboardData?.stats?.badges || 0, // Backend might not send badges count yet
        rating: dashboardData?.stats?.overall_rating || 1000,
        matches: dashboardData?.stats?.total_matches || 0,
        winRate: dashboardData?.stats?.win_rate?.replace('%', '') || 0
    };

    const skills = dashboardData?.skills?.length > 0 ? dashboardData.skills : [
        { name: 'Language', value: 100, color: 'bg-indigo-500' },
        { name: 'Grammar', value: 100, color: 'bg-emerald-500' },
        { name: 'Speaking', value: 100, color: 'bg-black' },
        { name: 'Reaction', value: 100, color: 'bg-amber-500' }
    ];

    const streaks = {
        learning: parseInt(dashboardData?.streaks?.learning_days || 0),
        wins: dashboardData?.streaks?.match_wins || 0,
        tournament: dashboardData?.streaks?.tournament_wins || 0
    };

    return (
        <div className="animate-in fade-in duration-300 h-full flex flex-col bg-gray-50/50 pb-20 md:pb-0">
            {/* Header */}
            <div className="bg-white px-4 py-3 sticky top-0 z-20 border-b border-gray-100">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-[#6C5DD3] rounded-lg flex items-center justify-center">
                        <Swords className="w-4 h-4 text-white" />
                    </div>
                    <div>
                        <h1 className="text-sm font-bold text-gray-900">SkillArena</h1>
                        <p className="text-[10px] text-gray-500">Learn. Compete. Win.</p>
                    </div>
                    <div className="ml-auto flex gap-2">
                        <div className="relative">
                            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input type="text" placeholder="Search" className="pl-10 pr-4 py-1.5 bg-gray-50 rounded-full text-xs font-medium w-32 focus:outline-none focus:ring-1 focus:ring-[#6C5DD3]" />
                        </div>
                        <button className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-500 relative">
                            <Bell className="w-4 h-4" />
                            <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-500 rounded-full border border-white"></span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="p-4 space-y-6 flex-1 overflow-y-auto">
                {/* Profile Card */}
                <div className="bg-linear-to-br from-[#6C5DD3] to-[#8B7CF7] rounded-[32px] p-6 text-white shadow-lg shadow-[#6C5DD3]/30 relative overflow-hidden">
                    <div className="relative z-10 flex items-start justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl font-bold border-2 border-white/30">
                                {user?.name?.[0] || 'P'}
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <h2 className="text-xl font-bold">{user?.name || 'Player'}</h2>
                                    <span className="px-2 py-0.5 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-bold border border-white/30 flex items-center gap-1">
                                        <Hexagon className="w-3 h-3 fill-current" /> Beginner
                                    </span>
                                </div>
                                <div className="flex gap-4 text-[11px] font-medium text-white/80">
                                    <div className="flex flex-col">
                                        <span className="text-white font-bold text-sm">{stats.rating}</span>
                                        <span>Rating</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-white font-bold text-sm">{stats.matches}</span>
                                        <span>Matches</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-white font-bold text-sm">{stats.winRate}%</span>
                                        <span>Win Rate</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 flex gap-3 relative z-10">
                        <button className="flex-1 py-2.5 bg-white text-[#6C5DD3] rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] transition-transform">
                            <Edit2 className="w-3 h-3" /> Edit Profile
                        </button>
                        <button onClick={handleLogout} className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center text-white backdrop-blur-md transition-colors">
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Background Circles */}
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/30 rounded-full blur-2xl"></div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center text-center">
                        <Trophy className="w-6 h-6 text-amber-500 mb-2" />
                        <span className="text-2xl font-bold text-gray-900">{stats.wins}</span>
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Wins</span>
                    </div>
                    <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center text-center">
                        <Target className="w-6 h-6 text-red-500 mb-2" />
                        <span className="text-2xl font-bold text-gray-900">{stats.losses}</span>
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Losses</span>
                    </div>
                    <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center text-center">
                        <TrendingUp className="w-6 h-6 text-green-500 mb-2" />
                        <span className="text-2xl font-bold text-gray-900">${stats.earned}</span>
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Earned</span>
                    </div>
                    <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center text-center">
                        <Award className="w-6 h-6 text-purple-500 mb-2" />
                        <span className="text-2xl font-bold text-gray-900">{stats.badges}</span>
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Badges</span>
                    </div>
                </div>

                {/* Skill Breakdown */}
                <div className="bg-white rounded-[32px] p-6 border border-gray-100 shadow-sm">
                    <h3 className="font-bold text-gray-900 text-sm mb-6">Skill Breakdown</h3>

                    <div className="flex flex-col md:flex-row items-center gap-8">
                        {/* Simplified Diamond/Radar Visual */}
                        <div className="w-48 h-48 relative flex items-center justify-center">
                            <div className="absolute inset-0 border border-gray-100 rotate-45 transform scale-100"></div>
                            <div className="absolute inset-0 border border-gray-100 rotate-45 transform scale-75"></div>
                            <div className="absolute inset-0 border border-gray-100 rotate-45 transform scale-50"></div>
                            <div className="relative w-24 h-24 bg-[#6C5DD3]/10 rotate-45 border border-[#6C5DD3]/50 flex items-center justify-center">
                                <div className="w-2 h-2 bg-[#6C5DD3] rounded-full"></div>
                            </div>
                            {/* Labels */}
                            <span className="absolute top-0 text-[10px] text-gray-400 font-medium -mt-2">Language</span>
                            <span className="absolute bottom-0 text-[10px] text-gray-400 font-medium -mb-2">Speaking</span>
                            <span className="absolute left-0 text-[10px] text-gray-400 font-medium -ml-4">Reaction</span>
                            <span className="absolute right-0 text-[10px] text-gray-400 font-medium -mr-4">Grammar</span>
                        </div>

                        {/* Progress Bars */}
                        <div className="flex-1 w-full space-y-4">
                            {skills.map((skill) => (
                                <div key={skill.name} className="flex items-center gap-4">
                                    <span className="text-[11px] font-medium text-gray-500 w-16">{skill.name}</span>
                                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <div className={`h-full rounded-full w-full ${skill.color}`}></div>
                                    </div>
                                    <span className="text-[11px] font-bold text-gray-900 w-8 text-right">{skill.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Streaks */}
                <div>
                    <h3 className="font-bold text-gray-900 text-sm mb-4 pl-2">Your Streaks</h3>
                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                        <div className="min-w-[100px] bg-white p-4 rounded-2xl border border-cyan-100 shadow-sm flex flex-col items-center">
                            <div className="w-10 h-10 rounded-full bg-cyan-50 flex items-center justify-center text-cyan-500 mb-2">
                                <Flame className="w-5 h-5 fill-current" />
                            </div>
                            <span className="text-xl font-bold text-gray-900">0</span>
                            <span className="text-[10px] text-gray-400 font-bold uppercase">Days</span>
                        </div>
                        <div className="min-w-[100px] bg-white p-4 rounded-2xl border border-blue-100 shadow-sm flex flex-col items-center">
                            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 mb-2">
                                <Zap className="w-5 h-5 fill-current" />
                            </div>
                            <span className="text-xl font-bold text-gray-900">0</span>
                            <span className="text-[10px] text-gray-400 font-bold uppercase">Wins</span>
                        </div>
                        <div className="min-w-[100px] bg-white p-4 rounded-2xl border border-amber-100 shadow-sm flex flex-col items-center">
                            <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-500 mb-2">
                                <Trophy className="w-5 h-5 fill-current" />
                            </div>
                            <span className="text-xl font-bold text-gray-900">0</span>
                            <span className="text-[10px] text-gray-400 font-bold uppercase">Wins</span>
                        </div>
                    </div>
                </div>

                {/* Account */}
                <div>
                    <h3 className="font-bold text-gray-900 text-sm mb-4 pl-2">Account</h3>
                    <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-4 flex items-center justify-between border-b border-gray-50">
                            <div>
                                <h4 className="font-bold text-sm text-gray-900">Account Verification</h4>
                                <p className="text-[10px] text-gray-500">Required for withdrawals</p>
                            </div>
                            <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded-lg text-[10px] font-bold">Not Verified</span>
                        </div>
                        <div className="p-4 flex items-center justify-between border-b border-gray-50">
                            <div>
                                <h4 className="font-bold text-sm text-gray-900">Beginner Protection</h4>
                                <p className="text-[10px] text-gray-500">Protected matches remaining</p>
                            </div>
                            <span className="font-bold text-sm text-gray-900">10 left</span>
                        </div>
                        <div className="p-4 flex items-center justify-between">
                            <div>
                                <h4 className="font-bold text-sm text-gray-900">Member Since</h4>
                                <p className="text-[10px] text-gray-500">Account creation date</p>
                            </div>
                            <span className="font-bold text-sm text-gray-900">N/A</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Navigation */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-between items-stretch z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] h-[72px]">
                <NavItem icon={Home} label="Home" path="/dashboard" />
                <NavItem icon={BookOpen} label="Learn" path="/dashboard/learn" />
                <NavItem icon={Swords} label="Arena" path="/dashboard/arena" />
                <NavItem icon={BarChart2} label="Leaderboard" path="/dashboard/leaderboard" />
                <NavItem icon={Menu} label="More" path="/dashboard/more" active />
            </div>
        </div>
    );
}

function Flame(props) {
    return <Zap {...props} /> // Fallback or custom icon
}

function NavItem({ icon: Icon, label, path, active }) {
    const navigate = useNavigate();
    return (
        <button onClick={() => navigate(path)}
            className={`flex-1 flex flex-col items-center justify-center gap-1 ${active ? 'text-[#6C5DD3]' : 'text-gray-400'}`}>
            <Icon className="w-6 h-6" strokeWidth={2} />
            <span className="text-[10px] font-medium">{label}</span>
        </button>
    );
}
