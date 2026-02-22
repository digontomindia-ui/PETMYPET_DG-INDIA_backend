import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Swords, Search, Bell, Mic, Trophy, Award, Flame, Shield, ChevronDown, CheckCircle, AlertCircle, Calendar, User, Star, TrendingUp, Target, Book, MessageSquare, Headphones, Eye, CircleDollarSign, Medal, Home, BookOpen, BarChart2, Menu, Zap } from 'lucide-react';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';

const skillBreakdown = [
    { name: 'Grammar', score: 1090, max: 2000 },
    { name: 'Vocabulary', score: 1050, max: 2000 },
    { name: 'Speaking', score: 1000, max: 2000 },
    { name: 'Reading', score: 1000, max: 2000 },
    { name: 'Listening', score: 1000, max: 2000 }
];

const radarData = [
    { label: 'Grammar', value: 80 },
    { label: 'Vocabulary', value: 70 },
    { label: 'Reading', value: 60 },
    { label: 'Speaking', value: 50 },
    { label: 'Listening', value: 65 }
];

export default function Leaderboard() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [filterPeriod, setFilterPeriod] = useState('All Time');
    const [filterScope, setFilterScope] = useState('Overall');
    const [activeTab, setActiveTab] = useState('Global'); // Global vs Your Tier

    const [leaderboardData, setLeaderboardData] = useState([]);
    const [userRank, setUserRank] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            setLoading(true);
            try {
                let endpoint = '/leaderboard';
                const timeframeMap = { 'All Time': 'all', 'This Week': 'week', 'This Month': 'month' };
                const params = { timeframe: timeframeMap[filterPeriod] || 'all', limit: 20 };

                if (activeTab === 'Tier') {
                    // TODO: dynamic tier based on user
                    endpoint = '/leaderboard/tier/gold'; 
                }

                const [leaderboardRes, userRankRes] = await Promise.all([
                    api.get(endpoint, { params }),
                    user?.id ? api.get(`/leaderboard/user/${user.id}`).catch(() => ({ data: null })) : Promise.resolve({ data: null })
                ]);

                setLeaderboardData(leaderboardRes.data.data || []);
                setUserRank(userRankRes.data);
            } catch (error) {
                console.error("Failed to fetch leaderboard:", error);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchLeaderboard();
        }
    }, [filterPeriod, activeTab, user]);

    // Derived Data
    const podiumData = leaderboardData.slice(0, 3).map((player, index) => ({
        ...player,
        score: player.rating || player.score, // Backend returns 'rating' or 'score' depending on endpoint? LB controller says 'rating'
        rank: index + 1,
        color: index === 0 ? 'bg-yellow-100 text-yellow-600' : index === 1 ? 'bg-amber-100 text-amber-600' : 'bg-orange-100 text-orange-600'
    }));

    // Re-order podium for visual display: 2nd, 1st, 3rd
    const podiumDisplay = [podiumData[1], podiumData[0], podiumData[2]].filter(Boolean);

    const listData = leaderboardData.slice(3).map((player, index) => ({
        ...player,
        rank: index + 4,
        score: player.rating,
        title: 'Player', // Placeholder
        tier: getTier(player.rating)
    }));

    function getTier(rating) {
        if (rating >= 2000) return 'Grand Master';
        if (rating >= 1800) return 'Master';
        if (rating >= 1600) return 'Diamond';
        if (rating >= 1400) return 'Platinum';
        if (rating >= 1200) return 'Gold';
        return 'Silver';
    }

    return (
        <div className="animate-in fade-in duration-300 h-full flex flex-col bg-gray-50/50">
            {/* Header */}
            <div className="bg-white px-4 py-3 sticky top-0 z-20 border-b border-gray-100">
                <div className="flex items-center gap-2 mb-4">
                     <div className="w-8 h-8 bg-[#6C5DD3] rounded-lg flex items-center justify-center">
                        <Swords className="w-4 h-4 text-white" />
                     </div>
                     <div>
                        <h1 className="text-sm font-bold text-gray-900">SkillArena</h1>
                        <p className="text-[10px] text-gray-500">Learn. Compete. Win.</p>
                     </div>
                     <div className="ml-auto flex gap-2">
                        <Search className="w-5 h-5 text-gray-400" />
                        <Bell className="w-5 h-5 text-gray-400" />
                     </div>
                </div>

                {/* Title & Filters */}
                <div className="mb-4">
                    <h2 className="text-xl font-bold text-gray-900 mb-1">Leaderboard</h2>
                    <p className="text-xs text-gray-500 mb-4">See how you rank against other learners</p>
                    
                    <div className="flex gap-2">
                        <button 
                            onClick={() => setFilterScope(prev => prev === 'Overall' ? 'Friends' : 'Overall')}
                            className="flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-700 shadow-sm active:bg-gray-50"
                        >
                            {filterScope} <ChevronDown className="w-3 h-3" />
                        </button>
                        <button 
                            onClick={() => {
                                const modes = ['All Time', 'This Week', 'This Month'];
                                const nextIndex = (modes.indexOf(filterPeriod) + 1) % modes.length;
                                setFilterPeriod(modes[nextIndex]);
                            }}
                            className="flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-700 shadow-sm active:bg-gray-50"
                        >
                            {filterPeriod} <ChevronDown className="w-3 h-3" />
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pb-24">
                {/* Podium Section - Orange Gradient */}
                <div className="mx-4 mt-2 mb-6 bg-gradient-to-b from-orange-400 to-orange-500 rounded-[32px] p-6 text-white shadow-lg shadow-orange-200 relative overflow-hidden min-h-[220px]">
                     {/* Background deco */}
                     <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                     
                     {loading ? (
                         <div className="flex items-center justify-center h-full pt-10">
                             <span className="text-white/80 font-bold animate-pulse">Loading podium...</span>
                         </div>
                     ) : (
                         <div className="flex justify-center items-end gap-2 relative z-10 pt-4 h-full">
                            {/* Render Podium Items: 2nd, 1st, 3rd logic */}
                            {podiumDisplay.map((player) => {
                                const isFirst = player.rank === 1;
                                const isSecond = player.rank === 2;
                                const isThird = player.rank === 3;
                                
                                return (
                                    <div key={player.id} className={`flex flex-col items-center ${isFirst ? '-translate-y-2 z-20' : isSecond ? 'translate-y-4 mb-0' : 'translate-y-8 mb-0'}`}>
                                        {isFirst && (
                                            <div className="relative">
                                                <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-8 h-8 text-yellow-300 animate-bounce">
                                                    <Trophy className="w-full h-full fill-current" />
                                                </div>
                                                <div className="w-20 h-20 rounded-full bg-yellow-400 border-4 border-yellow-200 flex items-center justify-center text-2xl font-bold text-white mb-2 shadow-lg ring-4 ring-orange-400/50 overflow-hidden">
                                                    {player.avatar || player.name[0].toUpperCase()}
                                                </div>
                                            </div>
                                        )}
                                        {!isFirst && (
                                            <div className={`w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold text-white mb-2 shadow-md overflow-hidden ${
                                                isSecond ? 'bg-orange-300 border-4 border-orange-200' : 'bg-orange-700/50 border-4 border-orange-800/30'
                                            }`}>
                                                {player.avatar || player.name[0].toUpperCase()}
                                            </div>
                                        )}

                                        <h3 className={`font-bold text-center leading-tight mb-0.5 truncate ${isFirst ? 'text-sm text-white drop-shadow-sm' : 'text-xs max-w-[60px]'}`}>
                                            {player.name}
                                        </h3>
                                        <p className={`font-medium mb ${isFirst ? 'text-xs font-bold text-yellow-100 mb-2' : 'text-[10px] text-orange-100 mb-1'}`}>
                                            {player.score}
                                        </p>
                                        
                                        <div className={`rounded-t-lg backdrop-blur-sm mt-1 mx-auto flex flex-col items-center justify-start pt-2 border-t ${
                                            isFirst ? 'w-20 h-32 bg-yellow-400 border-yellow-200 shadow-lg pt-3 rounded-t-xl' : 
                                            isSecond ? 'w-16 h-24 bg-white/20 border-white/30' : 
                                            'w-16 h-20 bg-orange-800/20 border-orange-800/30'
                                        }`}>
                                            <span className={`font-bold ${isFirst ? 'text-3xl text-yellow-600/30' : isSecond ? 'text-2xl text-gray-200/50' : 'text-2xl text-orange-900/30'}`}>
                                                {player.rank}
                                            </span>
                                            <div className={`mt-1 rounded-full flex items-center justify-center shadow-lg ${
                                                isFirst ? 'w-8 h-8 bg-gradient-to-br from-yellow-300 to-yellow-500 border border-yellow-200' :
                                                isSecond ? 'w-6 h-6 bg-gray-300 border border-gray-400' :
                                                'w-6 h-6 bg-orange-700 border border-orange-600'
                                            }`}>
                                                <span className={`${isFirst ? 'text-xs font-bold text-white' : 'text-[10px] font-bold ' + (isSecond ? 'text-gray-600' : 'text-orange-200')}`}>
                                                    {player.rank}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                         </div>
                     )}
                </div>

                {/* Scope Toggles */}
                <div className="px-4 mb-4 flex gap-4">
                    <button 
                        onClick={() => setActiveTab('Global')}
                        className={`px-6 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 ${activeTab === 'Global' ? 'bg-[#6C5DD3] text-white shadow-md shadow-[#6C5DD3]/20' : 'bg-transparent text-gray-500 hover:bg-gray-100'}`}
                    >
                         Global
                    </button>
                    <button 
                         onClick={() => setActiveTab('Tier')}
                         className={`px-6 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 ${activeTab === 'Tier' ? 'bg-[#6C5DD3] text-white shadow-md shadow-[#6C5DD3]/20' : 'bg-transparent text-gray-500 hover:bg-gray-100'}`}
                    >
                         <Star className="w-3 h-3" /> Your Tier
                    </button>
                </div>

                {/* List Header */}
                <div className="px-6 flex text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-wide">
                    <span className="w-8 text-center">Rank</span>
                    <span className="flex-1 px-4">Player</span>
                    <span className="w-16 text-center">Tier</span>
                    <span className="w-12 text-right">Rating</span>
                </div>

                {/* List Items */}
                <div className="px-4 space-y-2">
                    {listData.map((player) => (
                        <div key={player.id} className="bg-white rounded-2xl p-3 flex items-center shadow-sm border border-gray-50 active:scale-[0.99] transition-transform">
                            <div className="w-8 text-center text-xs font-bold text-gray-400">#{player.rank}</div>
                            
                            <div className="flex-1 px-3 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 text-sm font-bold">
                                    {player.avatar || <User className="w-5 h-5" />}
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-gray-900">{player.name}</h4>
                                    <p className="text-[10px] text-gray-400 font-medium">{player.title}</p>
                                </div>
                            </div>

                            <div className="w-16 flex justify-center">
                                {/* Tier Icon Placeholder */}
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                    player.tier === 'Grand Master' ? 'bg-pink-100 text-pink-600' :
                                    player.tier === 'Master' ? 'bg-purple-100 text-purple-600' :
                                    player.tier === 'Rising Star' ? 'bg-amber-100 text-amber-600' :
                                    'bg-gray-100 text-gray-600'
                                }`}>
                                    {player.tier === 'Grand Master' ? <Award className="w-3 h-3" /> :
                                     player.tier === 'Master' ? <Zap className="w-3 h-3" /> :
                                     <Star className="w-3 h-3" />}
                                </div>
                            </div>

                            <div className="w-12 text-right font-bold text-gray-900 text-sm">{player.score}</div>
                        </div>
                    ))}
                    
                    <div className="text-center py-4 text-xs text-gray-400">
                        {listData.length === 0 && !loading && "No other players found"}
                        {listData.length > 0 && (
                            <>
                                <span className="inline-block w-1 h-1 bg-gray-300 rounded-full mx-0.5"></span>
                                <span className="inline-block w-1 h-1 bg-gray-300 rounded-full mx-0.5"></span>
                                <span className="inline-block w-1 h-1 bg-gray-300 rounded-full mx-0.5"></span>
                            </>
                        )}
                    </div>

                    {/* Current User Fixed at Bottom */}
                    {userRank && (
                        <div className="sticky bottom-0 bg-white rounded-t-2xl shadow-[0_-4px_20px_rgba(0,0,0,0.05)] border-t border-gray-100 p-3 flex items-center mx-[-16px] px-6 z-10">
                            <div className="w-8 text-center text-xs font-bold text-gray-400">#{userRank.rank || '-'}</div>
                             <div className="flex-1 px-3 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-[#EBE9FE] flex items-center justify-center text-[#6C5DD3] text-sm font-bold border border-[#6C5DD3]/20">
                                    {user?.name?.[0]?.toUpperCase() || <User className="w-5 h-5" />}
                                </div>
                                <div>
                                     <h4 className="text-sm font-bold text-gray-900">You</h4>
                                    <p className="text-[10px] text-gray-400 font-medium">
                                        {userRank?.rank <= 3 ? "Top Player!" : `Top ${((userRank?.rank || 0) / 100).toFixed(0)}%`}
                                    </p>
                                </div>
                            </div>
                            <div className="w-12 text-right font-bold text-gray-900 text-sm">{userRank.rating || 0}</div>
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Navigation */}
            <BottomNav />
        </div>
    );
}

function BottomNav() {
    const navigate = useNavigate();
    const navItems = [
        { icon: Home, label: 'Home', path: '/dashboard' },
        { icon: BookOpen, label: 'Learn', path: '/dashboard/learn' },
        { icon: Swords, label: 'Arena', path: '/dashboard/arena' },
        { icon: BarChart2, label: 'Leaderboard', path: '/dashboard/leaderboard', active: true },
        { icon: Menu, label: 'More', path: '/dashboard/more' }
    ];
    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-between items-stretch z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] h-[72px]">
            {navItems.map((item) => (
                <button key={item.label} onClick={() => navigate(item.path)}
                    className={`flex-1 flex flex-col items-center justify-center gap-1 ${item.active ? 'text-[#6C5DD3]' : 'text-gray-400'}`}>
                    <item.icon className="w-5 h-5" />
                    <span className="text-[10px] font-medium">{item.label}</span>
                </button>
            ))}
        </div>
    );
}
