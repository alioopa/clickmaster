
import React from 'react';
import { useGame } from '../context/GameContext';
import { Trophy, Medal, Crown, ChevronLeft, Star, UserCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Leaderboard: React.FC = () => {
  const { user } = useGame();
  const navigate = useNavigate();

  // Mock data for top users since Firebase is disabled
  const topUsers = [
      { id: user.id, name: user.name, balance: user.balance, photo_url: null }
  ];

  return (
    <div className="h-screen w-full bg-[#020617] flex flex-col overflow-hidden" dir="rtl">
      <div className="shrink-0 w-full flex items-center justify-between p-6 bg-[#0d1117]/90 backdrop-blur-xl border-b border-white/5 z-50">
          <button onClick={() => navigate('/')} className="w-11 h-11 bg-[#020617] rounded-2xl flex items-center justify-center text-white border border-white/5 active:scale-90 transition-all"><ChevronLeft size={22} /></button>
          <div className="text-center">
              <h1 className="text-xl font-black text-white">لوحة الشرف</h1>
              <p className="text-primary text-[9px] font-black uppercase tracking-widest">Global Champions</p>
          </div>
          <div className="w-11 h-11 bg-primary/10 rounded-2xl flex items-center justify-center text-primary"><Trophy size={20} /></div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-8 pb-40">
          <div className="text-center py-10 px-6 bg-white/5 rounded-3xl border border-white/5 mb-8">
              <p className="text-slate-400 text-xs font-bold leading-relaxed">بما أنك في وضع الـ Standalone، يتم عرض ترتيبك الحالي فقط.</p>
          </div>

          <div className="space-y-3">
              {topUsers.map((u, index) => (
                  <div key={u.id} className="bg-primary/5 p-5 rounded-[2rem] border border-primary/20 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                          <span className="text-primary font-black text-xs w-6 text-center">#1</span>
                          <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center overflow-hidden border border-white/5">
                              <span className="text-white font-black">{u.name ? u.name[0] : 'U'}</span>
                          </div>
                          <div className="text-right">
                              <p className="text-sm font-black text-primary leading-none mb-1.5">{u.name} (أنت)</p>
                              <p className="text-[8px] text-slate-500 font-black uppercase tracking-widest opacity-60">Global Competitor</p>
                          </div>
                      </div>
                      <div className="text-left">
                          <p className="text-white font-black text-base leading-none mb-1">{u.balance.toLocaleString()}</p>
                          <span className="text-[8px] font-black text-primary uppercase opacity-80">Points</span>
                      </div>
                  </div>
              ))}
          </div>
      </div>
    </div>
  );
};

export default Leaderboard;
