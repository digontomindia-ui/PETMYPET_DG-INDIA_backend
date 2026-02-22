import { useState, useEffect } from 'react';
import { 
  Search, Mic, Bell, Trophy, Swords, TrendingUp, Flame, 
  Home, BookOpen, BarChart2, MoreHorizontal, ChevronRight, Zap,
  CreditCard, MessageCircle, Settings, Menu, ArrowLeft, Clock,
  Volume2, Square, RotateCcw, ArrowRight, Wallet, GraduationCap, LogOut, Brain, Sparkles
} from 'lucide-react';

import { motion } from 'framer-motion';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar } from 'recharts';
import Logo from '../components/Logo';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const data = [
  { subject: 'Language', A: 120, fullMark: 150 },
  { subject: 'Grammar', A: 98, fullMark: 150 },
  { subject: 'Speaking', A: 86, fullMark: 150 },
  { subject: 'Reaction', A: 99, fullMark: 150 },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('home');

  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [activeChapterTab, setActiveChapterTab] = useState('lessons'); // lessons, speaking, quick-start
  const [speakingStatus, setSpeakingStatus] = useState('idle'); // idle, recording, result
  const [vocabText, setVocabText] = useState('');
  const [vocabStatus, setVocabStatus] = useState('idle'); // idle, analyzing, result
  const [dictQuery, setDictQuery] = useState('MONOPOLY');
  const [dictStatus, setDictStatus] = useState('idle'); // idle, result

  return (
    <div className="flex flex-col h-full bg-gray-50/50 md:flex-row md:h-full md:overflow-hidden relative">
      
      {/* Desktop Sidebar */}
      <div className="hidden md:flex flex-col w-72 bg-white/80 backdrop-blur-xl border-r border-white/20 p-6 shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-30">
        <div className="mb-10 scale-90 origin-top-left">
           <Logo />
        </div>
        
        <nav className="space-y-2 flex-1">
             <SidebarItem icon={Home} label="Home" active={activeTab === 'home'} onClick={() => setActiveTab('home')} />
             <SidebarItem icon={BookOpen} label="Learn" active={activeTab === 'learn'} onClick={() => setActiveTab('learn')} />
             <SidebarItem icon={Swords} label="Arena" active={activeTab === 'arena'} onClick={() => setActiveTab('arena')} />
             <SidebarItem icon={BarChart2} label="Leaderboard" active={activeTab === 'leaderboard'} onClick={() => setActiveTab('leaderboard')} />
             <SidebarItem icon={MoreHorizontal} label="More" active={activeTab === 'more'} onClick={() => setActiveTab('more')} />
        </nav>

        <div className="mt-auto pt-6 border-t border-gray-100/50 flex items-center gap-3">
             <div className="relative">
                <img src="https://i.pravatar.cc/150?img=11" alt="Profile" className="w-10 h-10 rounded-full border border-gray-200" />
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white"></div>
             </div>
             <div>
                 <p className="text-sm font-bold text-gray-800">Learner</p>
                 <p className="text-xs text-gray-500">View Profile</p>
             </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        
        {/* Header */}
        <div className="flex-1 overflow-y-auto hide-scrollbar pb-40">
            <div className="px-4 pt-2 pb-0 md:p-8 md:pb-6">
            
            {/* Mobile Custom Header (Matches Image) */}
             <div className="md:hidden flex flex-col items-center mb-6">
                 {/* Logo Centered with Tagline */}
                 <div className="flex flex-col items-center mb-4">
                     <div className="scale-90"> <Logo /> </div>
                     <p className="text-[10px] text-blue-500/80 font-medium tracking-wide mt-1">- Learn. Compete. Win. -</p>
                 </div>

                 {/* Top Row: Profile - Search - Bell */}
                 <div className="w-full flex items-center gap-3">
                     <div className="relative shrink-0">
                        <img src="https://i.pravatar.cc/150?img=11" alt="Profile" className="w-10 h-10 rounded-full border border-gray-200" />
                        <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white"></div>
                     </div>
                     
                     <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input type="text" placeholder="Search" className="w-full bg-white border border-gray-100 rounded-full pl-9 pr-9 py-2.5 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-purple-200 placeholder:text-gray-400 shadow-sm" />
                        <Mic className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                     </div>
                     
                     <button className="w-10 h-10 rounded-full bg-white border border-gray-100 flex items-center justify-center text-gray-600 shadow-sm shrink-0">
                         <Bell className="w-5 h-5" />
                     </button>
                 </div>
             </div>

             {/* Desktop Header (Hidden on Mobile) */}
             <div className="hidden md:flex items-center gap-4 mb-8">
                 <div className="flex-1 relative max-w-2xl">
                     <div className="absolute inset-0 bg-white/50 backdrop-blur-md rounded-full shadow-sm md:shadow-none md:bg-white/80"></div>
                     <div className="relative flex items-center">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input type="text" placeholder="Search for courses, friends..." className="w-full bg-transparent rounded-full pl-11 pr-10 py-3 text-sm font-medium focus:outline-none focus:ring-0 placeholder:text-gray-400" />
                        <Mic className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                     </div>
                 </div>
                 
                 <button className="w-11 h-11 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-gray-600 hover:bg-white hover:shadow-md transition-all relative shrink-0 shadow-sm">
                     <Bell className="w-5 h-5" />
                     <span className="absolute top-2.5 right-3 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                 </button>
             </div>

            {/* HOME VIEW */}
            {activeTab === 'home' && (
                <>
                    {/* Welcome Section */}
                    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                        <div>
                            <h1 className="text-xl md:text-3xl font-bold text-gray-900">Welcome back, {user?.name || 'Learner'}! </h1>
                            <p className="text-gray-500 text-sm md:text-base mt-1">Ready to compete and learn today?</p>

                        </div>
                    </div>

                    {/* Bento Grid Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
                        <StatCard 
                            icon={Trophy} 
                            label="Overall Rating" 
                            value="1000" 
                            gradient="bg-linear-to-br from-purple-500 to-indigo-600"
                            iconBg="bg-white/20"
                        />
                         <StatCard 
                            icon={Swords} 
                            label="Total Matches" 
                            value="0" 
                            subvalue="% win rate"
                            gradient="bg-linear-to-br from-yellow-400 to-orange-500"
                            iconBg="bg-white/20"
                        />
                         <StatCard 
                            icon={TrendingUp} 
                            label="Earnings" 
                            value="$0.00" 
                            gradient="bg-linear-to-br from-emerald-400 to-teal-600"
                            iconBg="bg-white/20"
                        />
                         <StatCard 
                            icon={Flame} 
                            label="Learning Streak" 
                            value="0 days" 
                            gradient="bg-linear-to-br from-cyan-400 to-blue-500"
                            iconBg="bg-white/20"
                        />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Skill Overview */}
                        <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 flex flex-col items-center justify-center">
                            <h3 className="font-bold text-gray-900 mb-4 w-full">Skill Overview</h3>
                            <div className="h-[280px] w-full relative">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
                                    <PolarGrid stroke="#e5e7eb" strokeDasharray="3 3" />
                                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#6b7280', fontSize: 11, fontWeight: 600 }} />
                                    <Radar
                                        name="Mike"
                                        dataKey="A"
                                        stroke="#8b5cf6"
                                        strokeWidth={3}
                                        fill="#a78bfa"
                                        fillOpacity={0.4}
                                    />
                                    </RadarChart>
                                </ResponsiveContainer>
                                {/* Center Icon */}
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-purple-50/80 backdrop-blur-sm rounded-full flex items-center justify-center border border-purple-100 shadow-sm z-0">
                                     <div className="w-2.5 h-2.5 bg-purple-500 rounded-full shadow-[0_0_10px_var(--color-purple-500)]"></div>
                                </div>
                            </div>
                        </div>

                         {/* Actions & Streaks */}
                        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                             <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 flex flex-col">
                                <div className="flex items-center justify-between mb-6">
                                     <h3 className="font-bold text-gray-900">Your Streaks</h3>
                                     <span className="px-3 py-1 bg-green-50 text-green-600 text-[10px] font-bold uppercase tracking-wider rounded-full">Active</span>
                                </div>
                                <div className="grid grid-cols-3 gap-3 flex-1">
                                    <StreakItem icon={Flame} value="0" label="days" color="text-cyan-500" bg="bg-cyan-50" />
                                    <StreakItem icon={Zap} value="0" label="wins" color="text-blue-500" bg="bg-blue-50" />
                                    <StreakItem icon={Trophy} value="0" label="mins" color="text-yellow-500" bg="bg-yellow-50" />
                                </div>
                             </div>
                             
                             {/* Ad / Promo Card Placeholder */}
                             <div className="bg-linear-to-br from-indigo-500 to-purple-600 rounded-[32px] p-6 shadow-sm flex flex-col justify-between text-white relative overflow-hidden">
                                 <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                                 <div>
                                    <span className="px-3 py-1 bg-white/20 rounded-full text-[10px] font-bold uppercase tracking-wider mb-3 inline-block">Pro</span>
                                    <h3 className="font-bold text-lg leading-tight">Unlock Premium Features</h3>
                                 </div>
                                 <button className="w-full py-3 bg-white text-indigo-600 rounded-xl text-xs font-bold mt-4 shadow-sm">Upgrade Now</button>
                             </div>
                        </div>
                    </div>

                    {/* Your Subject */}
                    <div>
                         <div className="flex items-center justify-between mb-6 px-2">
                            <h3 className="text-xl font-bold text-gray-900">Your Subject</h3>
                            <button className="text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                                View all <ChevronRight className="w-4 h-4" />
                            </button>
                         </div>

                         <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                             <SubjectCard 
                                title="English" 
                                level="Level 1 • 0 lessons" 
                                flag="🇬🇧" 
                                gradient="bg-linear-to-b from-[#3b82f6] to-[#4f46e5]" 
                             />
                              <SubjectCard 
                                title="Spanish" 
                                level="Level 1 • 0 lessons" 
                                flag="🇪🇸" 
                                gradient="bg-linear-to-b from-[#ef4444] to-[#f97316]" 
                             />
                              <SubjectCard 
                                title="French" 
                                level="Level 1 • 0 lessons" 
                                flag="🇫🇷" 
                                gradient="bg-linear-to-b from-[#a855f7] to-[#ec4899]" 
                             />
                              <SubjectCard 
                                title="Math" 
                                level="Level 1 • 0 lessons" 
                                flag="📐" 
                                gradient="bg-linear-to-b from-[#10b981] to-[#14b8a6]" 
                             />
                         </div>

                         {/* Bottom Action Menu */}
                         <div className="bg-white rounded-[32px] p-4 shadow-sm border border-gray-100 space-y-3">
                             <QuickActionItem icon={Swords} label="Find a Match" variant="dark" />
                             <QuickActionItem icon={BookOpen} label="Continue Learning" variant="light" />
                             <QuickActionItem icon={Trophy} label="Join Tournament" variant="light" />
                         </div>
                    </div>
                </>
            )}

            {/* LEARN VIEW */}
            {activeTab === 'learn' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {!selectedSubject ? (
                        // ROOT LEARN VIEW (Subject List)
                        <>
                            <div className="mb-6">
                                <h2 className="text-2xl font-bold text-gray-900">Learn</h2>
                                <p className="text-gray-500 text-sm">Choose a subject to start training</p>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <LearnCard 
                                    title="Learn English" 
                                    badge="Beginner" 
                                    flag="🇬🇧" 
                                    mastery={35} 
                                    pvp={0} 
                                    color="bg-blue-500"
                                    onClick={() => setSelectedSubject('English')}
                                />
                                <LearnCard 
                                    title="Learn German" 
                                    badge="Fluent" 
                                    flag="🇩🇪" 
                                    mastery={0} 
                                    pvp={50} 
                                    color="bg-orange-500"
                                    onClick={() => setSelectedSubject('German')}
                                />
                                <LearnCard 
                                    title="Learn French" 
                                    badge="Intermediate" 
                                    flag="🇫🇷" 
                                    mastery={60} 
                                    pvp={20} 
                                    color="bg-purple-500"
                                    onClick={() => setSelectedSubject('French')}
                                />
                                <LearnCard 
                                    title="Learn Math" 
                                    badge="Advanced" 
                                    flag="📐" 
                                    mastery={90} 
                                    pvp={80} 
                                    color="bg-emerald-500"
                                    onClick={() => setSelectedSubject('Math')}
                                />
                            </div>
                        </>
                    ) : !selectedLevel ? ( // BROWSE COURSE VIEW (Level List)
                        <div className="h-full">
                            <div className="flex items-center gap-4 mb-6">
                                <button 
                                    onClick={() => setSelectedSubject(null)}
                                    className="w-10 h-10 rounded-full bg-white border border-gray-100 flex items-center justify-center text-gray-600 shadow-sm active:scale-90 transition-transform"
                                >
                                    <ChevronRight className="w-5 h-5 rotate-180" />
                                </button>
                                <h2 className="text-xl font-bold text-gray-900 mx-auto pr-10">Browse Course</h2>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <CourseLevelCard 
                                    title={selectedSubject} 
                                    level="Beginner"
                                    progress={35}
                                    flag={selectedSubject === 'English' ? '🇬🇧' : selectedSubject === 'German' ? '🇩🇪' : selectedSubject === 'French' ? '🇫🇷' : '📐'}
                                    color="bg-blue-500"
                                    onClick={() => setSelectedLevel('Beginner')}
                                />
                                <CourseLevelCard 
                                    title={selectedSubject} 
                                    level="Intermediate"
                                    progress={0}
                                    flag={selectedSubject === 'English' ? '🇬🇧' : selectedSubject === 'German' ? '🇩🇪' : selectedSubject === 'French' ? '🇫🇷' : '📐'}
                                    color="bg-blue-500"
                                    onClick={() => setSelectedLevel('Intermediate')}
                                />
                                <CourseLevelCard 
                                    title={selectedSubject} 
                                    level="Advanced"
                                    progress={0}
                                    flag={selectedSubject === 'English' ? '🇬🇧' : selectedSubject === 'German' ? '🇩🇪' : selectedSubject === 'French' ? '🇫🇷' : '📐'}
                                    color="bg-blue-500"
                                    onClick={() => setSelectedLevel('Advanced')}
                                />
                                <CourseLevelCard 
                                    title={selectedSubject} 
                                    level="Fluent"
                                    progress={30}
                                    flag={selectedSubject === 'English' ? '🇬🇧' : selectedSubject === 'German' ? '🇩🇪' : selectedSubject === 'French' ? '🇫🇷' : '📐'}
                                    color="bg-blue-500"
                                    onClick={() => setSelectedLevel('Fluent')}
                                />
                            </div>
                        </div>
                    ) : ( // CHAPTER VIEW (Lesson List)
                        <div className="h-full animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col bg-gray-50/50">
                             {/* Header matching Image 1 */}
                             <div className="bg-white px-4 py-4 border-b border-gray-100 sticky top-0 z-10">
                                 <div className="flex items-center justify-between mb-4">
                                     <button 
                                         onClick={() => setSelectedLevel(null)}
                                         className="w-8 h-8 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-600 active:bg-gray-200"
                                     >
                                         <ChevronRight className="w-5 h-5 rotate-180" />
                                     </button>
                                     <h2 className="text-lg font-bold text-gray-900">{selectedLevel}</h2>
                                     <div className="w-8"></div> {/* Spacer for centering */}
                                 </div>
                                 
                                 <div className="flex justify-between items-end mb-2 px-1">
                                      <h3 className="font-bold text-gray-900 text-base">{selectedLevel}</h3>
                                      <span className="text-blue-600 font-bold text-lg">25%</span>
                                 </div>
                                 <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                      <div className="w-[25%] h-full bg-blue-600 rounded-full"></div>
                                 </div>
                             </div>

                             <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                {/* Filter Tabs (Pill shaped, Active=Purple) */}
                                <div className="flex items-center gap-2 mb-2 overflow-x-auto hide-scrollbar pb-2">
                                    <button 
                                        onClick={() => setActiveChapterTab('lessons')}
                                        className={`px-4 py-2.5 rounded-full text-xs font-bold shrink-0 flex items-center gap-2 border transition-all ${
                                            activeChapterTab === 'lessons' 
                                            ? 'bg-[#6C5DD3] text-white border-transparent shadow-md shadow-indigo-200' 
                                            : 'bg-white text-gray-500 border-gray-200'
                                        }`}
                                    >
                                        <BookOpen className="w-4 h-4" /> Lessons
                                    </button>
                                    <button 
                                        onClick={() => setActiveChapterTab('speaking')}
                                        className={`px-4 py-2.5 rounded-full text-xs font-bold shrink-0 flex items-center gap-2 border transition-all ${
                                            activeChapterTab === 'speaking' 
                                            ? 'bg-[#6C5DD3] text-white border-transparent shadow-md shadow-indigo-200' 
                                            : 'bg-white text-gray-500 border-gray-200'
                                        }`}
                                    >
                                        <Mic className="w-4 h-4" /> Speaking Practice
                                    </button>
                                    <button 
                                        onClick={() => setActiveChapterTab('quick-start')}
                                        className={`px-4 py-2.5 rounded-full text-xs font-bold shrink-0 flex items-center gap-2 border transition-all ${
                                            activeChapterTab === 'quick-start' 
                                            ? 'bg-[#6C5DD3] text-white border-transparent shadow-md shadow-indigo-200' 
                                            : 'bg-white text-gray-500 border-gray-200'
                                        }`}
                                    >
                                        <Zap className="w-4 h-4" /> Quick Quiz
                                    </button>
                                </div>

                                {/* CONTENT AREA */}
                                <div>
                                    
                                    {/* 1. LESSONS TAB */}
                                    {activeChapterTab === 'lessons' && (
                                        <div className="space-y-4 pb-20">
                                            {/* Active Lesson (Hero Card) */}
                                            <div className="bg-[#F0F2FF] border border-indigo-50 p-5 rounded-[24px] relative shadow-sm">
                                                <div className="flex gap-4 mb-4">
                                                    <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 shrink-0">
                                                        <Mic className="w-6 h-6" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <h4 className="font-bold text-gray-900 text-base mb-1">Basics Greetings</h4>
                                                        <p className="text-xs text-gray-500 leading-tight">Learn common greetings and introductions</p>
                                                    </div>
                                                </div>
                                                
                                                <div className="flex items-center gap-4 text-[11px] font-bold text-gray-500 mb-4 px-1">
                                                    <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> 20 min</span>
                                                    <span className="flex items-center gap-1.5 text-indigo-600"><Mic className="w-3.5 h-3.5" /> Speaking</span>
                                                </div>

                                                <div className="flex items-center gap-3 mb-5">
                                                     <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                                        <div className="w-1/2 h-full bg-blue-600 rounded-full"></div>
                                                     </div>
                                                     <span className="text-xs font-bold text-blue-600">50%</span>
                                                </div>

                                                <button className="w-full py-3 bg-[#6C5DD3] text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-200 flex items-center justify-center gap-2">
                                                    <span className="bg-white/20 p-1 rounded-full"><Zap className="w-3 h-3 fill-current" /></span>
                                                    Continue
                                                </button>
                                            </div>

                                            {/* Standard Lessons */}
                                            <LessonCard 
                                                title="Present Tense Verbs"
                                                desc="Master the present tense in everyday sentences"
                                                time="7 min"
                                                progress={0}
                                                icon={<BookOpen className="w-5 h-5 text-gray-400" />}
                                            />
                                            <LessonCard 
                                                title="Pronunciation: Vowels"
                                                desc="Perfect your vowel sounds with native examples"
                                                time="7 min"
                                                type="Speaking"
                                                progress={0}
                                                icon={<Mic className="w-5 h-5 text-indigo-500" />}
                                            />
                                            <LessonCard 
                                                title="Common Phrases"
                                                desc="Essential phrases for daily conversations"
                                                time="7 min"
                                                type="Speaking"
                                                progress={0}
                                                icon={<Mic className="w-5 h-5 text-indigo-500" />}
                                            />
                                            <LessonCard 
                                                title="Reading Comprehension"
                                                desc="Practice understanding written texts"
                                                time="7 min"
                                                progress={0}
                                                icon={<BookOpen className="w-5 h-5 text-gray-400" />}
                                            />
                                        </div>
                                    )}

                                    {/* 2. SPEAKING PRACTICE TAB */}
                                    {activeChapterTab === 'speaking' && (
                                        <div className="space-y-6 pb-20">
                                            {speakingStatus !== 'result' ? (
                                                <div className="bg-white border border-gray-100 p-6 rounded-[24px] flex flex-col items-center text-center shadow-sm min-h-[500px] relative">
                                                     <div className="w-full text-left mb-8">
                                                        <p className="text-xs font-medium text-gray-400 mb-2">Respond to this prompt:</p>
                                                        <h3 className="text-lg font-bold text-gray-900 leading-tight mb-4">Practice speaking: Describe your daily routine</h3>
                                                        <button className="flex items-center gap-2 text-xs font-bold text-gray-600">
                                                            <Volume2 className="w-4 h-4 text-gray-400" /> Listen to native pronunciation
                                                        </button>
                                                     </div>

                                                     <div className="flex-1 flex flex-col items-center justify-center w-full">
                                                         <p className="text-xs text-gray-400 mb-6 font-medium tracking-wide">
                                                            {speakingStatus === 'recording' ? 'Tap to stop' : 'Tap to start speaking'}
                                                         </p>

                                                         <div className="relative">
                                                             {speakingStatus === 'recording' && (
                                                                 <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-20 scale-150"></div>
                                                             )}
                                                             <button 
                                                                onClick={() => {
                                                                    if (speakingStatus === 'idle') setSpeakingStatus('recording');
                                                                    else setSpeakingStatus('result');
                                                                }}
                                                                className={`w-24 h-24 rounded-full flex items-center justify-center text-white shadow-xl transition-all hover:scale-105 active:scale-95 z-10 relative ${
                                                                    speakingStatus === 'recording' ? 'bg-red-500 shadow-red-500/30' : 'bg-[#6C5DD3] shadow-indigo-600/30'
                                                                }`}
                                                             >
                                                                 {speakingStatus === 'recording' ? <Square className="w-8 h-8 fill-current" /> : <Mic className="w-8 h-8" />}
                                                             </button>
                                                         </div>
                                                         
                                                         {speakingStatus === 'recording' && (
                                                             <div className="mt-8 flex gap-1 justify-center h-4 items-center">
                                                                {[...Array(5)].map((_,i) => (
                                                                    <div key={i} className="w-1 bg-[#6C5DD3] rounded-full animate-pulse" style={{ height: Math.random() * 20 + 5 + 'px', animationDelay: i * 0.1 + 's' }}></div>
                                                                ))}
                                                             </div>
                                                         )}
                                                     </div>
                                                </div>
                                            ) : (
                                                // RESULT VIEW
                                                <div className="space-y-4 animate-in slide-in-from-bottom-5 duration-500">
                                                    {/* Transcript Card */}
                                                    <div className="bg-[#F8F9FE] border border-gray-100 p-5 rounded-[24px]">
                                                        <p className="text-xs font-medium text-gray-400 mb-2">What you said:</p>
                                                        <p className="text-sm text-gray-900 font-bold leading-relaxed">
                                                            This is a simulated transcript of your speech. I described my daily routine starting with waking up at 7 AM...
                                                        </p>
                                                    </div>

                                                    {/* Score Card */}
                                                    <div className="bg-emerald-50 border border-emerald-100 p-5 rounded-[24px] flex items-center justify-between">
                                                        <span className="font-bold text-gray-500 text-xs">Overall Score</span>
                                                        <span className="font-bold text-emerald-500 text-3xl">92</span>
                                                    </div>

                                                    {/* Skill Cards */}
                                                    <div className="space-y-3">
                                                        <SkillBar label="Pronunciation" value={90} color="bg-emerald-500" />
                                                        <SkillBar label="Fluency" value={90} color="bg-emerald-500" />
                                                        <SkillBar label="Grammar" value={76} color="bg-orange-500" />
                                                        <SkillBar label="Intonation" value={72} color="bg-orange-500" />
                                                    </div>

                                                    {/* Improvement Card */}
                                                    <div className="bg-yellow-50 border border-yellow-100 p-4 rounded-[20px] flex gap-3 text-yellow-800">
                                                        <div className="mt-0.5"><Zap className="w-4 h-4 fill-yellow-500 text-yellow-500" /></div>
                                                        <div>
                                                            <p className="text-xs font-bold mb-1">Areas to improve</p>
                                                            <p className="text-[11px] leading-relaxed"><span className="font-bold">example</span>: Elongate the "a" sound.</p>
                                                        </div>
                                                    </div>

                                                    <div className="flex gap-3 pt-4">
                                                        <button 
                                                            onClick={() => setSpeakingStatus('idle')}
                                                            className="flex-1 py-3.5 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 hover:bg-gray-50 flex items-center justify-center gap-2"
                                                        >
                                                            <RotateCcw className="w-4 h-4" /> Try Again
                                                        </button>
                                                        <button className="flex-1 py-3.5 bg-black text-white rounded-xl text-xs font-bold shadow-lg shadow-black/20 flex items-center justify-center gap-2">
                                                            Continue <ArrowRight className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* 3. QUICK START TAB */}
                                    {activeChapterTab === 'quick-start' && (
                                        <div className="bg-white border border-gray-100 p-8 rounded-[32px] shadow-sm text-center flex flex-col items-center justify-center min-h-[500px]">
                                            <div className="w-20 h-20 bg-indigo-50 rounded-2xl flex items-center justify-center text-[#6C5DD3] mb-6">
                                                <Zap className="w-10 h-10 stroke-[1.5]" />
                                            </div>
                                            <h3 className="text-lg font-bold text-gray-900 mb-2">Quick Knowledge Check</h3>
                                            <p className="text-gray-500 text-sm mb-10 max-w-xs mx-auto leading-relaxed">
                                                Test your knowledge with a 5-question quiz. No stakes, just practice!
                                            </p>
                                            <button className="px-8 py-3.5 bg-black text-white rounded-xl text-xs font-bold shadow-lg hover:scale-105 transition-transform flex items-center gap-2">
                                                <Zap className="w-4 h-4 fill-current" /> Start Quiz
                                            </button>
                                        </div>
                                    )}

                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
            
            {/* MORE VIEW */}
            {activeTab === 'more' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 p-4 h-full flex flex-col max-w-lg mx-auto w-full">
                    {/* Profile Header */}
                    <div className="bg-white rounded-[24px] p-4 border border-gray-100 flex items-center gap-4 shadow-sm mb-6">
                        <img src="https://i.pravatar.cc/150?img=11" alt="Profile" className="w-12 h-12 rounded-full border border-gray-200" />
                        <div className="flex-1">
                            <h3 className="font-bold text-gray-900">John Doe</h3>
                            <p className="text-xs text-gray-500">olivia@untitledui.com</p>
                        </div>
                        <button className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors">
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Menu Items */}
                    <div className="bg-white rounded-[32px] p-2 border border-gray-100 shadow-sm flex-1 mb-6 flex flex-col gap-1">
                        <button className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 rounded-2xl transition-colors text-left group">
                            <div className="text-gray-500 group-hover:text-blue-600 transition-colors"><Wallet className="w-5 h-5" /></div>
                            <span className="font-bold text-gray-700 group-hover:text-gray-900 transition-colors text-sm">Wallet</span>
                        </button>
                        <button className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 rounded-2xl transition-colors text-left group">
                            <div className="text-gray-500 group-hover:text-blue-600 transition-colors"><Trophy className="w-5 h-5" /></div>
                            <span className="font-bold text-gray-700 group-hover:text-gray-900 transition-colors text-sm">Tournament</span>
                        </button>
                        <button onClick={() => setActiveTab('vocabulary')} className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 rounded-2xl transition-colors text-left group">
                            <div className="text-gray-500 group-hover:text-blue-600 transition-colors"><Brain className="w-5 h-5" /></div>
                            <span className="font-bold text-gray-700 group-hover:text-gray-900 transition-colors text-sm">Vocabulary Check</span>
                        </button>
                        <button onClick={() => setActiveTab('dictionary')} className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 rounded-2xl transition-colors text-left group">
                            <div className="text-gray-500 group-hover:text-blue-600 transition-colors"><BookOpen className="w-5 h-5" /></div>
                            <span className="font-bold text-gray-700 group-hover:text-gray-900 transition-colors text-sm">Dictionary</span>
                        </button>
                        <button className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 rounded-2xl transition-colors text-left group">
                            <div className="text-gray-500 group-hover:text-blue-600 transition-colors"><GraduationCap className="w-5 h-5" /></div>
                            <span className="font-bold text-gray-700 group-hover:text-gray-900 transition-colors text-sm">Tests</span>
                        </button>
                    </div>

                    {/* Sign Out */}
                    <div className="mt-auto mb-20 md:mb-0">
                         <button 
                            onClick={async () => {
                                await logout();
                                navigate('/signin');
                            }}
                            className="w-full bg-white border border-gray-100 rounded-[24px] p-4 flex items-center gap-4 text-gray-900 font-bold shadow-sm hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-colors"
                         >
                            <LogOut className="w-5 h-5" />
                            Sign out
                         </button>
                    </div>

                </div>
            )}

            {/* VOCABULARY CHECK VIEW */}
            {activeTab === 'vocabulary' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 h-full flex flex-col bg-gray-50/50">
                    <div className="bg-white px-4 py-4 sticky top-0 z-10 border-b border-gray-100">
                         <div className="flex items-center gap-4 mb-4">
                             <button onClick={() => setActiveTab('more')} className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-600">
                                 <ArrowLeft className="w-5 h-5" />
                             </button>
                             <div className="flex-1">
                                <div className="flex items-center gap-2">
                                     <h2 className="text-lg font-bold text-gray-900">Vocabulary Check With AI</h2>
                                     <span className="bg-black text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                        <Sparkles className="w-2 h-2" /> AI
                                     </span>
                                </div>
                                <p className="text-xs text-blue-500">Get instant AI feedback on your vocabulary usage</p>
                             </div>
                         </div>
                    </div>

                    <div className="p-4 space-y-4 flex-1 overflow-y-auto pb-24">
                        {/* Input Area */}
                            <div className="bg-white p-4 rounded-[24px] border border-gray-100 shadow-sm relative overflow-hidden">
                                <div className="flex justify-between items-center mb-4">
                                    <label className="text-xs font-bold text-gray-900">Enter Your Text</label>
                                    <button 
                                        type="button"
                                        onClick={() => setVocabStatus('recording')}
                                        className="p-1 rounded-full hover:bg-blue-50 transition-colors"
                                    >
                                        <Mic className="w-4 h-4 text-blue-500 cursor-pointer hover:scale-110 transition-transform" />
                                    </button>
                                </div>
                                <textarea 
                                    value={vocabText}
                                    onChange={(e) => setVocabText(e.target.value)}
                                    placeholder="Type or speak here..." 
                                    className="w-full h-40 resize-none text-sm font-medium text-gray-800 focus:outline-none placeholder:text-gray-300 bg-transparent"
                                ></textarea>
                                <div className="flex justify-between items-center mt-4">
                                    <span className="text-[10px] font-bold text-gray-400">{vocabText.split(' ').filter(w => w).length} words</span>
                                    <button 
                                        onClick={() => setVocabStatus('result')}
                                        className="px-4 py-2 bg-black text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-lg shadow-gray-200"
                                    >
                                        <Sparkles className="w-3 h-3" /> Analyze with AI
                                    </button>
                                </div>

                                {/* Recording Overlay (Removed from here) */}
                            </div>

                        {/* Results Area */}
                        {vocabStatus === 'result' && (
                            <div className="animate-in slide-in-from-bottom-5 duration-500 space-y-4">
                                {/* Score Card */}
                                <div className="bg-[#EBE9FE] p-5 rounded-[24px] border border-[#DCD6FC]">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <p className="text-xs font-bold text-gray-600 mb-1">Overall Score</p>
                                            <h3 className="text-3xl font-bold text-[#6C5DD3]">30/100</h3>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-bold text-gray-500 mb-1">Words analyzed</p>
                                            <p className="text-xl font-bold text-[#6C5DD3]">3</p>
                                        </div>
                                    </div>
                                    <span className="px-3 py-1 bg-white/60 text-[#6C5DD3] text-[10px] font-bold rounded-lg border border-[#6C5DD3]/20 inline-block mb-3">
                                        Beginner
                                    </span>
                                    <p className="text-[11px] text-gray-600 leading-relaxed">
                                        The text is very simple and lacks complexity with only three words analyzed. It uses beginner vocabulary.
                                    </p>
                                </div>

                                {/* Improvements */}
                                <div className="bg-white p-5 rounded-[24px] border border-gray-100 shadow-sm">
                                    <h3 className="font-bold text-gray-900 text-sm mb-4">Vocabulary Improvements</h3>
                                    <div className="space-y-3">
                                        <div className="p-3 border border-gray-100 rounded-xl bg-gray-50/50">
                                            <div className="flex gap-2 text-xs font-bold mb-1">
                                                <span className="text-gray-500 uppercase">DESIGNER</span>
                                                <span className="text-gray-400">→</span>
                                                <span className="text-green-600 uppercase">CREATOR</span>
                                            </div>
                                            <p className="text-[10px] text-gray-500">"Creator" may imply a broader range of creative activities.</p>
                                        </div>
                                        <div className="p-3 border border-gray-100 rounded-xl bg-gray-50/50">
                                            <div className="flex gap-2 text-xs font-bold mb-1">
                                                <span className="text-gray-500 uppercase">I</span>
                                                <span className="text-gray-400">→</span>
                                                <span className="text-green-600">As a professional</span>
                                            </div>
                                            <p className="text-[10px] text-gray-500">Adds professionalism and context to the statement.</p>
                                        </div>
                                        <div className="p-3 border border-gray-100 rounded-xl bg-gray-50/50">
                                            <div className="flex gap-2 text-xs font-bold mb-1">
                                                <span className="text-gray-500 uppercase">AM</span>
                                                <span className="text-gray-400">→</span>
                                                <span className="text-green-600">Hold the position of</span>
                                            </div>
                                            <p className="text-[10px] text-gray-500">Creates a more formal tone.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                    {/* Full Screen Recording Overlay (Fixed) */}
                    {vocabStatus === 'recording' && (
                        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-300">
                            {/* Card matches image: White, rounded, red button, blue dots */}
                            <div className="bg-white rounded-[32px] p-8 w-full max-w-sm shadow-2xl flex flex-col items-center animate-in zoom-in-95 duration-300">
                                <p className="text-sm font-medium text-gray-500 mb-8">Tap to stop</p>
                                
                                <div className="relative mb-8">
                                    <div className="absolute inset-0 bg-red-500/20 rounded-full animate-ping scale-150 duration-1000"></div>
                                    <div className="absolute inset-0 bg-red-500/40 rounded-full animate-pulse scale-125 duration-2000"></div>
                                    <button 
                                        onClick={() => {
                                            setVocabStatus('idle');
                                            setVocabText("I am a designer and I want to improve my vocabulary."); // Simulated result
                                        }} 
                                        className="w-24 h-24 bg-red-600 text-white rounded-full flex items-center justify-center shadow-2xl shadow-red-500/40 relative z-10 hover:scale-105 active:scale-95 transition-transform"
                                    >
                                        <Mic className="w-10 h-10 fill-current ml-0.5" strokeWidth={2.5} />
                                    </button>
                                </div>

                                {/* Audio Wave Dots (Blue as in image) */}
                                <div className="flex gap-1.5 h-6 items-center justify-center">
                                    {[...Array(15)].map((_, i) => (
                                        <div 
                                            key={i} 
                                            className="w-1.5 bg-[#4B4CED] rounded-full animate-bounce"
                                            style={{ 
                                                height: Math.random() * 16 + 6 + 'px', 
                                                animationDelay: `${i * 0.05}s`
                                            }}
                                        ></div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* DICTIONARY VIEW */}
            {activeTab === 'dictionary' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 h-full flex flex-col bg-gray-50/50">
                    <div className="bg-white px-4 py-4 sticky top-0 z-10 border-b border-gray-100">
                         <div className="flex items-center gap-4 mb-2">
                             <button onClick={() => setActiveTab('more')} className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-600">
                                 <ArrowLeft className="w-5 h-5" />
                             </button>
                             <div className="flex-1">
                                <h2 className="text-lg font-bold text-gray-900">English Dictionary</h2>
                                <p className="text-xs text-gray-500 font-medium">Search for word definitions, synonyms, and usage examples</p>
                             </div>
                         </div>
                    </div>

                    <div className="p-4 flex-1 overflow-y-auto pb-24 space-y-4">
                        {/* Search Area */}
                        <div className="bg-white rounded-[24px] p-4 border border-gray-100 shadow-sm">
                            <div className="relative mb-3">
                                <input 
                                    type="text" 
                                    value={dictQuery}
                                    onChange={(e) => setDictQuery(e.target.value.toUpperCase())}
                                    placeholder="MONOPOLY" 
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#6C5DD3] focus:bg-white transition-colors uppercase tracking-wide"
                                />
                                <button 
                                    type="button"
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                                >
                                    <Mic className="w-4 h-4 text-gray-400" />
                                </button>
                            </div>
                            <button 
                                onClick={() => setDictStatus('result')}
                                className="w-full bg-[#6C5DD3] text-white rounded-xl py-3 text-xs font-bold shadow-lg shadow-[#6C5DD3]/20 active:scale-[0.98] transition-all hover:bg-[#5B4EC2]"
                            >
                                Search
                            </button>
                        </div>
                        
                        {/* Recent Searches */}
                        {dictStatus === 'result' && (
                            <div className="flex items-center gap-2 px-1">
                                <span className="text-[10px] font-bold text-gray-400 uppercase">Recent:</span>
                                <div className="flex gap-2">
                                    <span className="px-2.5 py-1 bg-white border border-gray-200 rounded-lg text-[10px] font-bold text-gray-700 uppercase shadow-sm">{dictQuery}</span>
                                </div>
                            </div>
                        )}

                        {/* Search Result Card */}
                        {dictStatus === 'result' && (
                            <div className="bg-white rounded-[28px] border border-[#E8E5F8] shadow-sm relative overflow-hidden animate-in slide-in-from-bottom-4">
                                {/* Purple accent top bar */}
                                <div className="h-1 bg-gradient-to-r from-[#6C5DD3] to-[#8B7CF7]"></div>
                                
                                <div className="p-5">
                                    {/* Header */}
                                    <div className="flex justify-between items-start mb-5">
                                        <div>
                                            <h2 className="text-2xl font-black text-gray-900 mb-2 uppercase tracking-tight">{dictQuery}</h2>
                                            <div className="flex gap-2 items-center">
                                                <span className="px-2.5 py-1 bg-[#6C5DD3] text-white text-[10px] font-bold rounded-lg uppercase">noun</span>
                                                <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                                <span className="text-[10px] font-medium text-gray-500">Intermediate Level</span>
                                            </div>
                                        </div>
                                        <button className="w-10 h-10 rounded-full bg-[#EBE9FE] flex items-center justify-center text-[#6C5DD3] hover:bg-[#DCD6FC] transition-colors">
                                            <Volume2 className="w-5 h-5" />
                                        </button>
                                    </div>

                                    {/* Divider */}
                                    <div className="h-px w-full bg-gray-100 mb-5"></div>

                                    {/* Definition */}
                                    <div className="mb-5">
                                        <h4 className="text-[10px] font-bold text-[#6C5DD3] uppercase tracking-widest mb-2">DEFINITION</h4>
                                        <p className="text-sm font-medium text-gray-700 leading-relaxed">
                                            The exclusive possession or control of the supply or trade in a commodity or service.
                                        </p>
                                    </div>

                                    {/* Synonyms */}
                                    <div className="mb-5">
                                        <h4 className="text-[10px] font-bold text-[#6C5DD3] uppercase tracking-widest mb-2">SYNONYMS</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {['monopolization', 'dominance', 'hegemony', 'oligopoly', 'control'].map((word) => (
                                                <span key={word} className="px-3 py-1.5 bg-[#F8F7FC] border border-[#E8E5F8] rounded-lg text-[11px] font-bold text-gray-600 hover:bg-[#EBE9FE] hover:text-[#6C5DD3] transition-colors cursor-pointer">
                                                    {word}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Antonyms */}
                                    <div className="mb-5">
                                        <h4 className="text-[10px] font-bold text-[#6C5DD3] uppercase tracking-widest mb-2">ANTONYMS</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {['competition', 'diversity', 'multiplicity'].map((word) => (
                                                <span key={word} className="px-3 py-1.5 bg-[#F8F7FC] border border-[#E8E5F8] rounded-lg text-[11px] font-bold text-gray-600 hover:bg-[#EBE9FE] hover:text-[#6C5DD3] transition-colors cursor-pointer">
                                                    {word}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Common Phrases */}
                                    <div className="mb-5">
                                        <h4 className="text-[10px] font-bold text-[#6C5DD3] uppercase tracking-widest mb-2">COMMON PHRASES</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {['hold a monopoly', 'monopoly power', 'natural monopoly'].map((phrase) => (
                                                <span key={phrase} className="px-3 py-1.5 bg-white border border-[#DCD6FC] rounded-lg text-[11px] font-bold text-[#6C5DD3] shadow-sm">
                                                    "{phrase}"
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Etymology */}
                                    <div className="bg-gradient-to-br from-[#F8F7FC] to-[#EBE9FE] rounded-2xl p-4 border border-[#E8E5F8]">
                                        <div className="flex items-center gap-2 mb-2">
                                            <BookOpen className="w-3.5 h-3.5 text-[#6C5DD3]" />
                                            <h4 className="text-[10px] font-bold text-[#6C5DD3] uppercase tracking-widest">ETYMOLOGY</h4>
                                        </div>
                                        <p className="text-[11px] text-gray-600 leading-relaxed font-medium">
                                            From the late Middle English <span className="text-[#6C5DD3] font-bold">'monopolie'</span>, from Old French <span className="text-[#6C5DD3] font-bold">'monopole'</span>, from Latin <span className="text-[#6C5DD3] font-bold">'monopolium'</span>, from Greek <span className="text-[#6C5DD3] font-bold">'monopólion'</span> meaning 'to sell alone'.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div></div>

        {/* Mobile Bottom Navigation - Pinned via Flexbox */}
        <div className="md:hidden flex-none bg-white border-t border-gray-200 px-0 flex justify-between items-stretch z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] h-[72px]">
             <NavItem icon={Home} label="Home" active={activeTab === 'home'} onClick={() => setActiveTab('home')} />
             <NavItem icon={BookOpen} label="Learn" active={activeTab === 'learn'} onClick={() => setActiveTab('learn')} />
             <NavItem icon={Swords} label="Arena" active={activeTab === 'arena'} onClick={() => setActiveTab('arena')} />
             <NavItem icon={BarChart2} label="Leaderboard" active={activeTab === 'leaderboard'} onClick={() => setActiveTab('leaderboard')} />
             <NavItem icon={Menu} label="More" active={activeTab === 'more'} onClick={() => setActiveTab('more')} />
        </div>
      </div>
    </div>
  );
}

function SkillBar({ label, value, color }) {
    const textColor = color.replace('bg-', 'text-');
    return (
        <div className="bg-white border border-gray-100 p-4 rounded-[20px] shadow-sm">
             <div className="flex justify-between items-center mb-3">
                 <span className="text-xs font-bold text-gray-700">{label}</span>
                 <span className={`text-sm font-bold ${textColor}`}>{value}</span>
             </div>
             <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                 <div style={{ width: `${value}%` }} className={`h-full rounded-full ${color}`}></div>
             </div>
        </div>
    )
}



function StatCard({ icon: Icon, label, value, subvalue, gradient, iconBg }) {
    return (
        <div className={`${gradient} rounded-[28px] p-5 text-white shadow-lg shadow-gray-200/50 relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300`}>
             <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl -mr-6 -mt-6 group-hover:scale-110 transition-transform duration-500"></div>
             
             <div className={`w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center mb-3 backdrop-blur-sm`}>
                 <Icon className="w-5 h-5 text-white" />
             </div>
             <p className="text-[10px] md:text-xs font-medium text-white/80 uppercase tracking-wider mb-0.5">{label}</p>
             <div className="flex items-baseline gap-1">
                 <h3 className="text-xl md:text-2xl font-bold">{value}</h3>
                 {subvalue && <span className="text-[10px] md:text-xs text-white/70 font-medium">{subvalue}</span>}
             </div>
        </div>
    )
}

function SubjectCard({ title, level, flag, gradient }) {
    return (
        <div className={`${gradient} p-5 rounded-[32px] text-white relative overflow-hidden shadow-lg shadow-gray-200/50 flex flex-col items-center text-center group active:scale-[0.98] transition-transform`}>
             {/* Icon */}
             <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-2xl shadow-sm mb-4 shrink-0">
                 {flag}
             </div>
             
             <h3 className="font-bold text-lg mb-0.5">{title}</h3>
             <p className="text-[10px] font-medium text-white/80 mb-6">{level}</p>

             {/* Progress Bars */}
             <div className="w-full space-y-3 mb-6">
                 <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] font-medium opacity-90">
                        <span>Mastery</span>
                        <span>0%</span>
                    </div>
                    <div className="w-full h-1.5 bg-black/10 rounded-full overflow-hidden">
                        <div className="w-0 h-full bg-white rounded-full"></div>
                    </div>
                 </div>

                 <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] font-medium opacity-90">
                        <span>PvP Ready</span>
                        <span>0%</span>
                    </div>
                    <div className="w-full h-1.5 bg-black/10 rounded-full overflow-hidden">
                        <div className="w-0 h-full bg-white rounded-full"></div>
                    </div>
                 </div>
             </div>

             <button className="w-full mt-auto py-3 bg-white/20 hover:bg-white/25 active:bg-white/30 backdrop-blur-md rounded-xl text-xs font-bold flex items-center justify-between px-4 transition-colors">
                  Continue learning
                  <ChevronRight className="w-4 h-4" />
             </button>
        </div>
    )
}

function StreakItem({ icon: Icon, value, label, color, bg }) {
    return (
        <div className="flex-1 flex flex-col items-center justify-center py-4 bg-gray-50 rounded-2xl border border-gray-100 group hover:border-gray-200 transition-colors">
             <div className={`w-10 h-10 ${bg} ${color} rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform`}>
                 <Icon className="w-5 h-5 fill-current" />
             </div>
             <p className="font-bold text-gray-900 text-lg leading-none mb-1">{value}</p>
             <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{label}</p>
        </div>
    )
}

function QuickActionItem({ icon: Icon, label, variant }) {
    const isDark = variant === 'dark';
    return (
        <button className={`w-full py-4 px-5 rounded-2xl flex items-center justify-between text-sm font-bold transition-all active:scale-[0.98] ${
            isDark 
            ? 'bg-gray-900 text-white shadow-lg shadow-gray-900/20' 
            : 'bg-white border border-gray-100 text-gray-800 shadow-sm hover:bg-gray-50'
        }`}>
            <div className="flex items-center gap-4">
                <Icon className={`w-5 h-5 ${!isDark ? 'text-gray-900' : ''}`} strokeWidth={2} />
                {label}
            </div>
            <ChevronRight className={`w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
        </button>
    )
}

function NavItem({ icon: Icon, label, active, onClick }) {
    return (
        <button onClick={onClick} className="relative w-1/5 flex flex-col items-center justify-center gap-1 group">
             {active && (
                 <motion.div 
                    layoutId="activeTab"
                    className="absolute top-0 w-8 h-1 bg-indigo-600 rounded-b-full"
                 />
             )}
             <Icon className={`w-6 h-6 transition-colors duration-300 ${active ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-600'}`} strokeWidth={2} />
             <span className={`text-[11px] font-medium transition-colors duration-300 ${active ? 'text-indigo-600' : 'text-gray-500'}`}>{label}</span>
        </button>
    )
}

function SidebarItem({ icon: Icon, label, active, onClick }) {
    return (
        <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all ${active ? 'bg-purple-50 text-purple-600 shadow-sm' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}>
             <Icon className={`w-5 h-5 ${active ? 'fill-current' : ''}`} strokeWidth={2} />
             {label}
        </button>
    )
}

function LearnCard({ title, badge, flag, mastery, pvp, color, onClick }) {
    const badgeColors = badge === 'Beginner' ? 'bg-blue-50 text-blue-600 border-blue-100' : 
                        badge === 'Fluent' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                        badge === 'Advanced' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                        'bg-purple-50 text-purple-600 border-purple-100';

    return (
        <div onClick={onClick} className="bg-white rounded-[24px] border border-gray-100 shadow-sm relative overflow-hidden flex flex-col group cursor-pointer hover:shadow-md transition-all">
            <div className="p-5 pb-0 flex flex-col items-center text-center">
                 <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-sm text-white mb-3 ${color}`}>
                     {flag}
                 </div>
                 
                 <div className="flex items-center justify-center gap-2 mb-4 w-full">
                     <h3 className="font-bold text-sm text-gray-900">{title}</h3>
                     <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${badgeColors}`}>
                         {badge}
                     </span>
                 </div>

                 <div className="w-full space-y-3 mb-6">
                     <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-bold text-gray-500">
                             <span>Mastery</span>
                             <span>{mastery}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div style={{ width: `${mastery}%` }} className={`h-full rounded-full ${color.replace('bg-', 'bg-')}`}></div>
                        </div>
                     </div>

                     <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-bold text-gray-500">
                             <span>PvP Ready</span>
                             <span>{pvp}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                             <div style={{ width: `${pvp}%` }} className={`h-full rounded-full ${color.replace('bg-', 'bg-')}`}></div>
                        </div>
                     </div>
                 </div>
            </div>

            <button className="w-full py-3 bg-black text-white text-[10px] font-bold flex items-center justify-between px-5 mt-auto active:bg-gray-800 transition-colors">
                 Browse Courses
                 <ChevronRight className="w-3 h-3" />
            </button>
        </div>
    )
}


function CourseLevelCard({ title, level, progress, flag, color, active, onClick }) {
    const badgeColors = level === 'Beginner' ? 'bg-blue-50 text-blue-600 border-blue-100' : 
                        level === 'Fluent' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                        level === 'Advanced' ? 'bg-yellow-50 text-yellow-600 border-yellow-100' :
                        'bg-green-50 text-green-600 border-green-100';

    return (
        <div onClick={onClick} className={`bg-white rounded-[24px] border ${active ? 'border-2 border-blue-500 border-dashed' : 'border-gray-100'} shadow-sm relative overflow-hidden flex flex-col group cursor-pointer hover:shadow-md transition-all`}>
            {/* ... Content ... */}
            <div className="p-5 pb-0 flex flex-col items-center text-center">
                 <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-sm text-white mb-3 ${color}`}>
                     {flag}
                 </div>
                 
                 <div className="flex items-center justify-center gap-2 mb-4 w-full">
                     <h3 className="font-bold text-sm text-gray-900">{title}</h3>
                     <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${badgeColors}`}>
                         {level}
                     </span>
                 </div>

                 <div className="w-full space-y-3 mb-6">
                     <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-bold text-gray-500">
                             <span>{progress}% completed</span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div style={{ width: `${progress}%` }} className={`h-full rounded-full ${color.replace('bg-', 'bg-')}`}></div>
                        </div>
                     </div>
                 </div>
            </div>

            <button className="w-full py-3 bg-black text-white text-[10px] font-bold flex items-center justify-between px-5 mt-auto active:bg-gray-800 transition-colors">
                 Browse Course
                 <ChevronRight className="w-3 h-3" />
            </button>
        </div>
    )
}

function LessonCard({ title, desc, time, type, progress = 0, icon }) {
    return (
        <div className="bg-white border border-gray-100 p-4 rounded-[20px] flex gap-4 items-center shadow-sm">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${type === 'Speaking' ? 'bg-indigo-50 text-indigo-500' : 'bg-gray-50 text-gray-500'}`}>
                {icon || <BookOpen className="w-6 h-6" />}
            </div>
            <div className="flex-1 min-w-0">
                <h4 className="font-bold text-gray-900 text-sm mb-0.5 truncate">{title}</h4>
                <p className="text-[10px] text-gray-500 mb-2 truncate">{desc}</p>
                
                <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 text-[10px] font-bold text-gray-400">
                        <Clock className="w-3 h-3" /> {time}
                    </span>
                    {type === 'Speaking' && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-indigo-500">
                            <Mic className="w-3 h-3" /> Speaking
                        </span>
                    )}
                </div>

                <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden mt-3">
                    <div style={{ width: `${progress}%` }} className="h-full bg-blue-600 rounded-full"></div>
                </div>
            </div>

            <button className="h-10 px-5 bg-gray-50 hover:bg-gray-100 text-gray-900 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 shrink-0">
                <div className="w-0 h-0 border-t-[5px] border-t-transparent border-l-[8px] border-l-gray-900 border-b-[5px] border-b-transparent ml-0.5"></div>
                Start
            </button>
        </div>
    )
}
