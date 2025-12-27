
import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Zap, Wallet, Users, ShoppingBag } from 'lucide-react';

const BottomNav: React.FC = () => {
  const navItems = [
    { to: "/", icon: Home, label: "الرئيسية" },
    { to: "/earn", icon: Zap, label: "المهام" },
    { to: "/friends", icon: Users, label: "الأصدقاء" },
    { to: "/shop", icon: ShoppingBag, label: "المتجر" },
    { to: "/wallet", icon: Wallet, label: "المحفظة" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] px-6 pb-8" dir="rtl">
      <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden">
        <div className="flex flex-row items-center h-20">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center flex-1 h-full transition-all duration-300 ${
                  isActive ? 'text-primary scale-110' : 'text-slate-500 opacity-60'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} fill={isActive ? "currentColor" : "none"} />
                  <span className={`text-[9px] font-black mt-1 ${isActive ? 'text-white' : ''}`}>
                    {item.label}
                  </span>
                  {isActive && (
                    <div className="absolute bottom-1 w-1 h-1 bg-primary rounded-full shadow-[0_0_8px_#facc15]"></div>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BottomNav;
