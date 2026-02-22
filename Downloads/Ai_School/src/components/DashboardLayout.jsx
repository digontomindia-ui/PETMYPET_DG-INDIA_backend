import React from 'react';
import { useLocation, useNavigate, Outlet } from 'react-router-dom';
import { 
  Search, Mic, Bell, Home, BookOpen, Swords, BarChart2, MoreHorizontal, Menu 
} from 'lucide-react';
import { SidebarItem, NavItem } from './DashboardComponents';
import Logo from './Logo';
import { useAuth } from '../context/AuthContext';

export default function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const userName = user?.name?.split(' ')[0] || 'Learner';
  
  // Logic to determine active tab from path
  const path = location.pathname;
  let activeTab = 'home';
  if (path === '/dashboard' || path === '/dashboard/') activeTab = 'home';
  else if (path.includes('/dashboard/learn')) activeTab = 'learn';
  else if (path.includes('/dashboard/arena')) activeTab = 'arena';
  else if (path.includes('/dashboard/leaderboard')) activeTab = 'leaderboard';
  else if (path.includes('/dashboard/more') || path.includes('/dashboard/vocabulary')) activeTab = 'more';

  // Helper to render profile avatar
  const renderProfileAvatar = () => {
      if (user?.profile_image) {
          return (
              <img 
                  src={user.profile_image} 
                  alt={user.name} 
                  className="w-10 h-10 rounded-full object-cover border border-gray-200"
              />
          );
      }
      
      const initials = user?.name 
          ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() 
          : 'U';
          
      return (
          <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-sm border border-gray-200">
             {initials}
          </div>
      );
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 md:flex-row md:h-full md:overflow-hidden relative">
      
      {/* Desktop Sidebar */}
      <div className="hidden md:flex flex-col w-72 bg-white/80 backdrop-blur-xl border-r border-white/20 p-6 shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-30">
        <div className="mb-10 scale-90 origin-top-left">
           <Logo />
        </div>
        
        <nav className="space-y-2 flex-1">
             <SidebarItem icon={Home} label="Home" active={activeTab === 'home'} onClick={() => navigate('/dashboard')} />
             <SidebarItem icon={BookOpen} label="Learn" active={activeTab === 'learn'} onClick={() => navigate('/dashboard/learn')} />
             <SidebarItem icon={Swords} label="Arena" active={activeTab === 'arena'} onClick={() => navigate('/dashboard/arena')} />
             <SidebarItem icon={BarChart2} label="Leaderboard" active={activeTab === 'leaderboard'} onClick={() => navigate('/dashboard/leaderboard')} />
             <SidebarItem icon={MoreHorizontal} label="More" active={activeTab === 'more'} onClick={() => navigate('/dashboard/more')} />
        </nav>

        <div className="mt-auto pt-6 border-t border-gray-100/50 flex items-center gap-3">
              <div 
                  onClick={() => navigate('/dashboard/profile')}
                  className="relative cursor-pointer hover:opacity-80 transition-opacity"
              >
                 {renderProfileAvatar()}
                 <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white"></div>
              </div>
              <div>
                  <p className="text-sm font-bold text-gray-800">{userName}</p>
                  <p className="text-xs text-gray-500">{user?.email || 'View Profile'}</p>
              </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        
        {/* Header */}
        <div className={`flex-1 overflow-y-auto hide-scrollbar ${['more', 'vocabulary'].some(p => path.includes(p)) ? '' : 'pb-40'}`}>
            <div className={` md:p-8 md:pb-6 ${['more', 'vocabulary'].some(p => path.includes(p)) ? 'h-full' : ''}`}>
            
             {/* Mobile Custom Header (Matches Image) - Hide on More & Vocabulary pages */}
            {!['more', 'vocabulary', 'arena', 'leaderboard', 'dictionary', 'tests', 'wallet', 'profile'].some(p => path.includes(p)) && (
             <div className="md:hidden flex flex-col items-center mb-6 px-4 pt-6">
                 {/* Logo Centered with Tagline */}
                 <div className="flex flex-col items-center mb-4">
                     <div className="scale-90"> <Logo /> </div>
                     <p className="text-[10px] text-blue-500/80 font-medium tracking-wide mt-1">- Learn. Compete. Win. -</p>
                 </div>

                 {/* Top Row: Profile - Search - Bell */}
                 <div className="w-full flex items-center gap-3">
                      <div 
                        onClick={() => navigate('/dashboard/profile')}
                        className="relative shrink-0 cursor-pointer"
                      >
                         {renderProfileAvatar()}
                         <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white"></div>
                      </div>
                     
                     <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="Search" 
                            className="w-full bg-white border border-gray-100 rounded-full pl-9 pr-9 py-2.5 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-purple-200 placeholder:text-gray-400 shadow-sm"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    const val = e.target.value.toLowerCase();
                                    if (val.includes('dic')) navigate('/dashboard/dictionary');
                                    else if (val.includes('vocab')) navigate('/dashboard/vocabulary');
                                    else if (val.includes('arena') || val.includes('play')) navigate('/dashboard/arena');
                                    else if (val.includes('prof')) navigate('/dashboard/profile');
                                    else if (val.includes('test')) navigate('/dashboard/tests');
                                    else if (val.includes('learn')) navigate('/dashboard/learn');
                                }
                            }}
                        />
                        <Mic className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                     </div>
                     
                     <button 
                        onClick={() => navigate('/dashboard/notifications')}
                        className="w-10 h-10 rounded-full bg-white border border-gray-100 flex items-center justify-center text-gray-600 shadow-sm shrink-0 active:scale-95 transition-transform"
                     >
                         <Bell className="w-5 h-5" />
                     </button>
                 </div>
             </div>
            )}

             {/* Desktop Header (Hidden on Mobile) */}
             <div className="hidden md:flex items-center gap-4 mb-8">
                 <div className="flex-1 relative max-w-2xl">
                     <div className="absolute inset-0 bg-white/50 backdrop-blur-md rounded-full shadow-sm md:shadow-none md:bg-white/80"></div>
                     <div className="relative flex items-center">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="Search for courses, friends..." 
                            className="w-full bg-transparent rounded-full pl-11 pr-10 py-3 text-sm font-medium focus:outline-none focus:ring-0 placeholder:text-gray-400" 
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    const val = e.target.value.toLowerCase();
                                    if (val.includes('dic')) navigate('/dashboard/dictionary');
                                    else if (val.includes('vocab')) navigate('/dashboard/vocabulary');
                                    else if (val.includes('arena') || val.includes('play')) navigate('/dashboard/arena');
                                    else if (val.includes('prof')) navigate('/dashboard/profile');
                                    else if (val.includes('test')) navigate('/dashboard/tests');
                                    else if (val.includes('learn')) navigate('/dashboard/learn');
                                }
                            }}
                        />
                        <Mic className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                     </div>
                 </div>
                 
                 <button 
                    onClick={() => navigate('/dashboard/notifications')}
                    className="w-11 h-11 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-gray-600 hover:bg-white hover:shadow-md transition-all relative shrink-0 shadow-sm active:scale-95"
                 >
                     <Bell className="w-5 h-5" />
                     <span className="absolute top-2.5 right-3 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                 </button>
             </div>

             {/* RENDER CONTENT */}
             <Outlet />

            </div>
        </div>

        {/* Mobile Bottom Navigation - Pinned via Flexbox - Hide on More & Vocabulary pages */}
        {!['more', 'vocabulary', 'arena', 'leaderboard', 'dictionary', 'tests'].some(p => path.includes(p)) && (
        <div className="md:hidden flex-none bg-white border-t border-gray-200 px-0 flex justify-between items-stretch z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] h-[72px]">
             <NavItem icon={Home} label="Home" active={activeTab === 'home'} onClick={() => navigate('/dashboard')} />
             <NavItem icon={BookOpen} label="Learn" active={activeTab === 'learn'} onClick={() => navigate('/dashboard/learn')} />
             <NavItem icon={Swords} label="Arena" active={activeTab === 'arena'} onClick={() => navigate('/dashboard/arena')} />
             <NavItem icon={BarChart2} label="Leaderboard" active={activeTab === 'leaderboard'} onClick={() => navigate('/dashboard/leaderboard')} />
             <NavItem icon={Menu} label="More" active={activeTab === 'more'} onClick={() => navigate('/dashboard/more')} />
        </div>
        )}
      </div>
    </div>
  );
}
