import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    CreditCard, Trophy, BookOpen, Book, GraduationCap,
    LogOut, ChevronRight, User, Home, Swords, BarChart2, Menu
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function More() {
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const handleLogout = async () => {
        try {
            if (logout) await logout();
            navigate('/signin');
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    const menuItems = [
        { icon: CreditCard, label: 'Wallet', path: '/dashboard/wallet' },
        { icon: Trophy, label: 'Tournament', path: '/dashboard/arena', state: { tab: 'tournaments' } },
        { icon: BookOpen, label: 'Vocabulary Check', path: '/dashboard/vocabulary' },
        { icon: Book, label: 'Dictionary', path: '/dashboard/dictionary' },
        { icon: GraduationCap, label: 'Tests', path: '/dashboard/tests' },
    ];

    return (
        <div className="flex flex-col h-full bg-white animate-in fade-in duration-300 pb-20 md:pb-0">
            {/* User Profile Header - Clickable */}
            <div
                onClick={() => navigate('/dashboard/profile')}
                className="p-6 flex items-center gap-4 cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-100"
            >
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-200">
                    {user?.name ? (
                        <span className="text-lg font-bold text-gray-600">{user.name[0].toUpperCase()}</span>
                    ) : (
                        <User className="w-6 h-6 text-gray-400" />
                    )}
                </div>
                <div className="flex-1">
                    <h2 className="text-base font-bold text-gray-900">{user?.name || 'User'}</h2>
                    <p className="text-xs text-gray-500">{user?.email || 'user@example.com'}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>

            {/* Menu List */}
            <div className="flex-1 p-4 overflow-y-auto">
                <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm overflow-hidden mb-6">
                    {menuItems.map((item) => (
                        <button
                            key={item.label}
                            onClick={() => navigate(item.path, { state: item.state })}
                            className="w-full flex items-center gap-4 p-4 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors text-left group"
                        >
                            <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-white group-hover:shadow-sm transition-all border border-transparent group-hover:border-gray-200">
                                <item.icon className="w-5 h-5 text-gray-600 group-hover:text-[#6C5DD3]" strokeWidth={1.5} />
                            </div>
                            <span className="flex-1 text-sm font-bold text-gray-700 group-hover:text-gray-900">{item.label}</span>
                            <ChevronRight className="w-4 h-4 text-gray-300" />
                        </button>
                    ))}

                    {/* Sign Out Button (Inside the List) */}
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-4 p-4 hover:bg-red-50 transition-colors text-left group"
                    >
                        <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-white group-hover:shadow-sm transition-all border border-transparent group-hover:border-red-100">
                            <LogOut className="w-5 h-5 text-gray-600 group-hover:text-red-500" strokeWidth={1.5} />
                        </div>
                        <span className="flex-1 text-sm font-bold text-gray-700 group-hover:text-red-600">Sign out</span>
                        <ChevronRight className="w-4 h-4 text-gray-200" />
                    </button>
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
        { icon: BarChart2, label: 'Leaderboard', path: '/dashboard/leaderboard' },
        { icon: Menu, label: 'More', path: '/dashboard/more', active: true }
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
