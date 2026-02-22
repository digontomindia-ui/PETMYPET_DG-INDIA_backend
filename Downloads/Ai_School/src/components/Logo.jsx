import { Zap } from 'lucide-react';

export default function Logo() {
  return (
    <div className="flex items-center gap-3 p-0 pt-2 justify-center w-full z-10 relative">
      <div className="w-10 h-10 bg-[#7C3AED] rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30 rotate-3 hover:rotate-6 transition-transform">
        <Zap className="w-5 h-5 text-white fill-white" />
      </div>
      <div>
        <h1 className="text-xl font-bold text-gray-800 leading-none tracking-tight">SkillArena</h1>
        <p className="text-[10px] text-gray-500 font-medium tracking-widest uppercase mt-0.5">Learn. Compete. Win.</p>
      </div>
    </div>
  )
}
