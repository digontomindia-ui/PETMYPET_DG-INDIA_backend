import { Outlet } from 'react-router-dom';

export default function Layout() {
  return (
    <div className="h-[100dvh] w-full bg-linear-to-br from-[#E3D9F8] via-[#FCECF6] to-[#F3E6F5] font-sans text-gray-800 overflow-hidden">
        <Outlet />
    </div>
  );
}
