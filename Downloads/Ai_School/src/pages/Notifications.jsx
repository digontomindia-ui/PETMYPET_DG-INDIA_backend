import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, Gift, BookOpen, Swords, Zap, Award, Info } from 'lucide-react';
import api from '../api/api';

export default function Notifications() {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const res = await api.get('/notifications');
                setNotifications(res.data.notifications || []);
            } catch (err) {
                console.error("Failed to fetch notifications", err);
            } finally {
                setLoading(false);
            }
        };
        fetchNotifications();
    }, []);

    const markAllRead = async () => {
        try {
            await api.post('/notifications/mark-read');
            setNotifications(prev => prev.map(n => ({...n, read: true})));
        } catch (err) {
            console.error("Failed to mark read", err);
        }
    };

    const getNotificationStyle = (type, title) => {
        switch (type) {
            case 'match':
                return { icon: Swords, color: title.includes('Victory') ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600' };
            case 'reward':
                return { icon: Zap, color: 'bg-orange-100 text-orange-600' };
            case 'tournament':
                return { icon: Award, color: 'bg-purple-100 text-purple-600' };
            case 'system':
            default:
                return { icon: Info, color: 'bg-blue-100 text-blue-600' };
        }
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 h-full flex flex-col bg-gray-50/50">
           <div className="bg-white px-4 py-4 sticky top-0 z-10 border-b border-gray-100">
                 <div className="flex items-center justify-between mb-2">
                     <div className="flex items-center gap-3">
                         <button onClick={() => navigate(-1)} className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors">
                             <ArrowLeft className="w-5 h-5" />
                         </button>
                         <h2 className="text-lg font-bold text-gray-900">Notifications</h2>
                     </div>
                     <button onClick={markAllRead} className="text-xs font-bold text-[#6C5DD3] hover:text-[#5B4EC2]">
                         Mark all as read
                     </button>
                 </div>
            </div>

            <div className="p-4 flex-1 overflow-y-auto pb-24 space-y-3">
                {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <Bell className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-sm font-bold text-gray-900">No notifications</h3>
                        <p className="text-xs text-gray-500 mt-1">You're all caught up!</p>
                    </div>
                ) : (
                    notifications.map((notif) => {
                        const style = getNotificationStyle(notif.type, notif.title);
                        const Icon = style.icon;
                        
                        // Format time (assuming ISO string from backend)
                        const timeDisplay = new Date(notif.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        
                        return (
                            <div 
                                key={notif.id} 
                                className={`bg-white rounded-[20px] p-4 border transition-all hover:shadow-md ${notif.read ? 'border-gray-100 opacity-80' : 'border-[#EBE9FE] shadow-sm bg-blue-50/30'}`}
                            >
                                <div className="flex gap-4">
                                    <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center ${style.color}`}>
                                        <Icon className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start mb-1">
                                            <h4 className={`text-sm font-bold ${notif.read ? 'text-gray-700' : 'text-gray-900'}`}>{notif.title}</h4>
                                            <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap ml-2">{timeDisplay}</span>
                                        </div>
                                        <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">{notif.message}</p>
                                    </div>
                                    {!notif.read && (
                                        <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5 flex-shrink-0"></div>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
