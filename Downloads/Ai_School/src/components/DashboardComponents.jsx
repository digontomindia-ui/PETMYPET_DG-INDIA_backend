import React from 'react';
import { motion } from 'framer-motion';
import { 
  ChevronRight, Mic, BookOpen, Clock
} from 'lucide-react';

export function SkillBar({ label, value, color }) {
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

export function StatCard({ icon: Icon, label, value, subvalue, gradient, iconBg }) {
    return (
        <div className={`${gradient} rounded-[32px] p-5 text-white shadow-lg shadow-gray-200/50 relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300 flex flex-col items-center justify-center text-center aspect-square md:aspect-auto md:items-start md:justify-between md:text-left md:h-full md:min-h-[160px]`}>
             <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-8 -mt-8 group-hover:scale-110 transition-transform duration-500"></div>
             
             <div className={`w-12 h-12 ${iconBg} rounded-2xl flex items-center justify-center mb-1 backdrop-blur-sm mx-auto md:mx-0`}>
                 <Icon className="w-6 h-6 text-white" />
             </div>
             <div className="w-full">
                <p className="text-sm font-medium text-white/90 mb-0.5">{label}</p>
                <div className="flex items-baseline justify-center md:justify-start gap-1.5 leading-none">
                    <h3 className="text-3xl font-bold tracking-tight">{value}</h3>
                    {subvalue && <span className="text-xs font-medium text-white/80">{subvalue}</span>}
                </div>
             </div>
        </div>
    )
}

export function SubjectCard({ title, level, flag, gradient }) {
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
                        <span>History</span>
                        <span>0%</span>
                    </div>
                    <div className="w-full h-1.5 bg-black/10 rounded-full overflow-hidden">
                        <div className="w-0 h-full bg-white rounded-full"></div>
                    </div>
                 </div>

                 <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] font-medium opacity-90">
                        <span>Int. Avg</span>
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

export function StreakItem({ icon: Icon, value, label, color, bg }) {
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

export function QuickActionItem({ icon: Icon, label, variant, onClick }) {
    const isDark = variant === 'dark';
    return (
        <button onClick={onClick} className={`w-full py-4 px-5 rounded-2xl flex items-center justify-between text-sm font-bold transition-all active:scale-[0.98] ${
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

export function NavItem({ icon: Icon, label, active, onClick }) {
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

export function SidebarItem({ icon: Icon, label, active, onClick }) {
    return (
        <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all ${active ? 'bg-purple-50 text-purple-600 shadow-sm' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}>
             <Icon className={`w-5 h-5 ${active ? 'fill-current' : ''}`} strokeWidth={2} />
             {label}
        </button>
    )
}

export function LearnCard({ title, badge, flag, mastery, pvp, color, onClick }) {
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

export function CourseLevelCard({ title, level, progress, flag, color, active, onClick }) {
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

export function LessonCard({ title, desc, time, type, progress = 0, icon, onClick }) {
    return (
        <div onClick={onClick} className="bg-white border border-gray-100 p-4 rounded-[20px] flex gap-4 items-center shadow-sm cursor-pointer hover:shadow-md transition-shadow group">
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

            <button className="h-10 px-5 bg-gray-50 group-hover:bg-gray-100 text-gray-900 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 shrink-0">
                <div className="w-0 h-0 border-t-[5px] border-t-transparent border-l-[8px] border-l-gray-900 border-b-[5px] border-b-transparent ml-0.5"></div>
                Start
            </button>
        </div>
    )
}
