import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Trophy, Swords, TrendingUp, Flame, Zap, ChevronRight, BookOpen
} from 'lucide-react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { StatCard, StreakItem, SubjectCard, QuickActionItem } from '../components/DashboardComponents';
import { useAuth } from '../context/AuthContext';
import api from '../api/api';

// Default skill data (used when no backend data available)
const defaultSkills = [
  { subject: 'Language', A: 0, fullMark: 100 },
  { subject: 'Grammar', A: 0, fullMark: 100 },
  { subject: 'Speaking', A: 0, fullMark: 100 },
  { subject: 'Reaction', A: 0, fullMark: 100 },
];

// Subject flag and gradient map
const subjectMeta = {
  'English':  { flag: '🇬🇧', gradient: 'bg-linear-to-br from-[#4F46E5] to-[#3B82F6]' },
  'Spanish':  { flag: '🇪🇸', gradient: 'bg-linear-to-br from-[#F97316] to-[#EF4444]' },
  'French':   { flag: '🇫🇷', gradient: 'bg-linear-to-br from-[#8B5CF6] to-[#C026D3]' },
  'Math':     { flag: '📐', gradient: 'bg-linear-to-br from-[#10B981] to-[#0D9488]' },
  'German':   { flag: '🇩🇪', gradient: 'bg-linear-to-br from-[#F59E0B] to-[#D97706]' },
  'Hindi':    { flag: '🇮🇳', gradient: 'bg-linear-to-br from-[#EF4444] to-[#DC2626]' },
};

const defaultSubjectMeta = { flag: '📚', gradient: 'bg-linear-to-br from-[#6366F1] to-[#4F46E5]' };

export default function DashboardHome() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [dashData, setDashData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                setLoading(true);
                const response = await api.get('/users/dashboard');
                setDashData(response.data);
            } catch (err) {
                console.error('Dashboard fetch error:', err);
                setError(err.response?.data?.message || 'Failed to load dashboard');
            } finally {
                setLoading(false);
            }
        };

        fetchDashboard();
    }, []);

    // Build display data from backend response
    const stats = dashData?.stats || {};
    const welcomeName = dashData?.welcome_message || `Welcome back, ${user?.name?.split(' ')[0] || 'Learner'}`;
    
    const skillsData = (dashData?.skills || []).map(s => ({
        subject: s.name,
        A: s.mastery_level || 0,
        fullMark: 100
    }));
    const radarData = skillsData.length > 0 ? skillsData : defaultSkills;

    const subjects = (dashData?.subjects || []).map(s => {
        const meta = subjectMeta[s.name] || defaultSubjectMeta;
        return {
            title: s.name,
            level: `Level ${s.level || 1} • ${s.lessons_count || 0} lessons`,
            flag: s.icon || meta.flag,
            gradient: meta.gradient
        };
    });

    const streaks = dashData?.streaks || { learning_days: 0, match_wins: 0, tournament_wins: 0 };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
                    <p className="text-gray-400 text-sm font-medium">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 p-4 md:p-0">
            {/* Welcome Section */}
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-xl md:text-3xl font-bold text-gray-900">{welcomeName}! </h1>
                    <p className="text-gray-500 text-sm md:text-base mt-1">Ready to compete and learn today?</p>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-100 rounded-2xl p-4 mb-6 text-red-600 text-sm">
                    {error}
                </div>
            )}

            {/* Bento Grid Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8">
                <StatCard 
                    icon={Trophy} 
                    label="Overall Rating" 
                    value={stats.overall_rating || '1000'} 
                    gradient="bg-linear-to-br from-[#7C3AED] to-[#5B21B6]"
                    iconBg="bg-white/20"
                />
                 <StatCard 
                    icon={Swords} 
                    label="Total Matches" 
                    value={stats.total_matches || '0'} 
                    subvalue={stats.win_rate || '0%'}
                    gradient="bg-linear-to-br from-[#F59E0B] to-[#D97706]"
                    iconBg="bg-white/20"
                />
                 <StatCard 
                    icon={TrendingUp} 
                    label="Earnings" 
                    value={stats.earnings || '$0.00'} 
                    gradient="bg-linear-to-br from-[#10B981] to-[#059669]"
                    iconBg="bg-white/20"
                />
                 <StatCard 
                    icon={Flame} 
                    label="Learning Streak" 
                    value={stats.learning_streak || '0 days'} 
                    gradient="bg-linear-to-br from-[#06B6D4] to-[#0891B2]"
                    iconBg="bg-white/20"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Skill Overview */}
            <div className="flex flex-col gap-4">
                <h3 className="font-bold text-gray-900 text-lg px-1">Skill Overview</h3>
                <div className="bg-white rounded-[24px] border border-gray-200 p-2 md:p-6 h-[340px] relative flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                            <PolarGrid stroke="#E2E8F0" />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748B', fontSize: 11, fontWeight: 600 }} />
                            <PolarRadiusAxis angle={45} domain={[0, 100]} tick={{ fill: '#94A3B8', fontSize: 9, fontWeight: 500 }} axisLine={false} />
                            <Radar
                                name="Skills"
                                dataKey="A"
                                stroke="#6366f1"
                                strokeWidth={2}
                                fill="#818cf8"
                                fillOpacity={0.5}
                            />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>
            </div>

                {/* Your Streaks & Actions */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                    <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 flex flex-col h-full">
                        <div className="flex items-center justify-between mb-6">
                                <h3 className="font-bold text-gray-900">Your Streaks</h3>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <StreakItem icon={Flame} value={String(streaks.learning_days)} label="days" color="text-cyan-500" bg="bg-cyan-50" />
                            <StreakItem icon={Zap} value={String(streaks.match_wins)} label="wins" color="text-blue-500" bg="bg-blue-50" />
                            <StreakItem icon={Trophy} value={String(streaks.tournament_wins)} label="trophies" color="text-yellow-500" bg="bg-yellow-50" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Your Subjects */}
            <div>
                 <div className="flex items-center justify-between mb-4 px-1">
                    <h3 className="text-lg font-bold text-gray-900">Your Subject</h3>
                    <button 
                        onClick={() => navigate('/dashboard/learn')}
                        className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                        View all <ChevronRight className="w-3 h-3" />
                    </button>
                 </div>

                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {subjects.length > 0 ? subjects.map((s, i) => (
                         <div key={i} onClick={() => navigate('/dashboard/learn', { state: { subjectName: s.title } })} className="cursor-pointer transition-transform active:scale-95">
                             <SubjectCard 
                                title={s.title} 
                                level={s.level} 
                                flag={s.flag} 
                                gradient={s.gradient} 
                             />
                         </div>
                    )) : (
                        <div className="col-span-full py-8 text-center bg-gray-50 rounded-[24px] border border-gray-100 border-dashed">
                            <p className="text-gray-500 font-medium mb-3">You haven't enrolled in any subjects yet.</p>
                            <button 
                                onClick={() => navigate('/dashboard/learn')}
                                className="px-6 py-2 bg-[#6C5DD3] text-white rounded-xl text-sm font-bold shadow-lg shadow-[#6C5DD3]/20 hover:bg-[#5B4EC2] transition-all"
                            >
                                Start Learning
                            </button>
                        </div>
                    )}
                 </div>

                 {/* Bottom Action Menu */}
                 <div className="bg-white rounded-[32px] p-4 shadow-sm border border-gray-100 space-y-3">
                     <QuickActionItem icon={Swords} label="Find a Match" variant="dark" onClick={() => navigate('/dashboard/arena')} />
                     <QuickActionItem icon={BookOpen} label="Continue Learning" variant="light" onClick={() => navigate('/dashboard/learn')} />
                     <QuickActionItem icon={Trophy} label="Join Tournament" variant="light" onClick={() => navigate('/dashboard/arena')} />
                 </div>
            </div>
        </div>
    );
}
