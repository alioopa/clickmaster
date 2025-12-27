
import React, { useState, useRef } from 'react';
import { useGame } from '../context/GameContext';
import { Moon, Sun, ShieldCheck, ChevronRight, CreditCard, LogOut, CheckCircle, Smartphone, Lock, X, Fingerprint, ShieldAlert, ChevronLeft, Bell, BellOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Settings: React.FC = () => {
  const { user, updateWalletAddress, adminLogin, toggleTheme, toggleNotifications, adminLogout } = useGame();
  const navigate = useNavigate();
  const [address, setAddress] = useState(user.walletAddress);
  const [isSaved, setIsSaved] = useState(false);
  
  // Admin Login States
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPass, setAdminPass] = useState('');
  const [error, setError] = useState('');
  
  const tapCountRef = useRef(0);
  const tapTimerRef = useRef<any>(null);

  const handleSave = () => {
    updateWalletAddress(address);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleSecretTrigger = (e: any) => {
    if (e.cancelable) e.preventDefault();
    if (window.Telegram?.WebApp?.HapticFeedback) window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
    
    if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
    
    tapCountRef.current += 1;
    
    if (tapCountRef.current >= 10) {
        tapCountRef.current = 0;
        setShowAdminModal(true);
    } else {
        tapTimerRef.current = setTimeout(() => { tapCountRef.current = 0; }, 1500);
    }
  };

  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminEmail === 'alifakarr' && adminPass === 'Aliliwaa00') {
        adminLogin();
        setShowAdminModal(false);
        setAdminPass('');
        setAdminEmail('');
        if (window.Telegram?.WebApp?.HapticFeedback) window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
        navigate('/admin');
    } else {
        setError('بيانات الاعتماد غير صالحة');
        if (window.Telegram?.WebApp?.HapticFeedback) window.Telegram.WebApp.HapticFeedback.notificationOccurred('error');
        setTimeout(() => setError(''), 3000);
    }
  };

  return (
    <div className="h-screen w-full overflow-y-auto overflow-x-hidden bg-[#020617] pb-40 px-6 pt-8 custom-scrollbar scroll-smooth" dir="rtl">
      
      {/* 🔝 Header */}
      <div className="w-full flex items-center justify-between mb-10">
          <button 
            onClick={() => navigate('/')} 
            className="w-11 h-11 bg-[#0d1117] rounded-2xl flex items-center justify-center text-white active:scale-90 transition-transform border border-white/5 shadow-xl"
          >
              <ChevronLeft size={24} />
          </button>
          <div className="flex-1 flex justify-center items-center py-2 cursor-pointer" onTouchStart={handleSecretTrigger} onClick={handleSecretTrigger}>
              <div className="text-center">
                <h1 className="text-xl font-black text-white">الإعدادات</h1>
                <p className="text-slate-500 text-[8px] font-black uppercase tracking-widest mt-0.5 animate-pulse">System Config</p>
              </div>
          </div>
          <div className="w-11"></div>
      </div>

      <div className="w-full space-y-10">
          {/* Appearance Section */}
          <section>
              <div className="flex flex-row items-center gap-2 mb-5 pr-2">
                <Smartphone size={14} className="text-primary" />
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">تخصيص التجربة</h3>
              </div>
              
              <div className="space-y-4">
                  {/* Theme Toggle */}
                  <div className="bg-[#0d1117] rounded-[2.5rem] p-8 border border-white/5 shadow-2xl flex items-center justify-between group">
                      <div className="flex items-center gap-5">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${user.theme === 'light' ? 'bg-amber-500/10 text-amber-500' : 'bg-primary/10 text-primary border border-primary/10'}`}>
                              {user.theme === 'light' ? <Sun size={24} /> : <Moon size={24} />}
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-black text-white">الوضع الليلي</p>
                            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter">Dark UI Experience</p>
                          </div>
                      </div>
                      <button onClick={toggleTheme} className={`w-14 h-7 rounded-full relative transition-all duration-300 ${user.theme === 'dark' ? 'bg-primary' : 'bg-slate-800'}`}>
                          <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-lg transition-all duration-300 ${user.theme === 'dark' ? 'right-1' : 'right-8'}`}></div>
                      </button>
                  </div>

                  {/* Notifications Toggle */}
                  <div className="bg-[#0d1117] rounded-[2.5rem] p-8 border border-white/5 shadow-2xl flex items-center justify-between group">
                      <div className="flex items-center gap-5">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${user.notificationsEnabled ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-500/10 text-slate-500'}`}>
                              {user.notificationsEnabled ? <Bell size={24} /> : <BellOff size={24} />}
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-black text-white">إشعارات البوت</p>
                            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter">تنبيهات الإحالة والمكافآت</p>
                          </div>
                      </div>
                      <button onClick={toggleNotifications} className={`w-14 h-7 rounded-full relative transition-all duration-300 ${user.notificationsEnabled ? 'bg-emerald-500' : 'bg-slate-800'}`}>
                          <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-lg transition-all duration-300 ${user.notificationsEnabled ? 'right-1' : 'right-8'}`}></div>
                      </button>
                  </div>
              </div>
          </section>

          {/* Payment Section */}
          <section>
              <div className="flex flex-row items-center gap-2 mb-5 pr-2">
                <CreditCard size={14} className="text-primary" />
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">بيانات الدفع</h3>
              </div>
              <div className="bg-[#0d1117] rounded-[2.5rem] p-8 border border-white/5 shadow-2xl">
                  <p className="text-[9px] text-slate-600 font-black mb-3 pr-1">عنوان المحفظة أو رقم الحساب</p>
                  <input 
                    type="text" 
                    value={address} 
                    onChange={e => setAddress(e.target.value)} 
                    placeholder="أدخل رقم محفظة زين كاش..." 
                    className="w-full bg-[#020617] border border-white/10 rounded-2xl p-5 text-white font-black text-sm outline-none focus:border-primary transition-all text-center mb-6" 
                  />
                  <button onClick={handleSave} className={`w-full py-5 rounded-2xl font-black text-xs transition-all flex flex-row items-center justify-center gap-3 shadow-xl ${isSaved ? 'bg-emerald-500 text-white' : 'bg-primary text-black active:scale-95'}`}>
                      {isSaved ? <CheckCircle size={20} /> : null}
                      {isSaved ? 'تم التحديث بنجاح' : 'حفظ التغييرات'}
                  </button>
              </div>
          </section>

          {/* Admin Section */}
          {user.role === 'admin' && (
              <section className="animate-scale-in">
                  <div className="flex flex-row items-center gap-2 mb-5 pr-2 text-rose-500">
                    <ShieldCheck size={14} />
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">إدارة النظام</h3>
                  </div>
                  <div className="space-y-4">
                      <button onClick={() => navigate('/admin')} className="w-full bg-[#0d1117] p-6 rounded-2xl border border-white/5 flex flex-row items-center justify-between text-white font-black text-sm active:scale-95 transition-all shadow-xl">
                        <span>لوحة التحكم الرئيسية</span>
                        <ShieldCheck size={20} className="text-primary" />
                      </button>
                      <button onClick={adminLogout} className="w-full bg-rose-500/10 p-6 rounded-2xl border border-rose-500/20 flex flex-row items-center justify-between text-rose-500 font-black text-sm active:scale-95 transition-all">
                        <span>تسجيل الخروج الآمن</span>
                        <LogOut size={20} />
                      </button>
                  </div>
              </section>
          )}

          <div className="text-center pt-10">
            <p className="text-[10px] font-black text-slate-800 uppercase tracking-[0.5em]">Tliker Security Protocol</p>
          </div>
      </div>

      {/* 🔐 High-Security Admin Modal */}
      {showAdminModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/98 backdrop-blur-2xl px-6 animate-fade-in" dir="rtl">
            <div className="bg-[#0d1117] w-full max-w-sm rounded-[3rem] p-10 border border-white/10 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-primary"></div>
                <button onClick={() => setShowAdminModal(false)} className="absolute top-8 left-8 text-slate-600 active:scale-90"><X size={28} /></button>
                
                <div className="flex flex-col items-center mb-10 mt-6">
                    <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center text-primary mb-5 border border-primary/20 shadow-[0_0_30px_rgba(250,204,21,0.2)]">
                        <Fingerprint size={40} />
                    </div>
                    <h2 className="text-2xl font-black text-white tracking-tighter">توثيق الدخول</h2>
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">Root Access Required</p>
                </div>

                <form onSubmit={handleAdminSubmit} className="space-y-5">
                    <div className="relative">
                        <input 
                            type="text"
                            autoComplete="off"
                            value={adminEmail}
                            onChange={e => setAdminEmail(e.target.value)}
                            placeholder="رمز النظام"
                            className="w-full bg-[#020617] border border-white/10 rounded-2xl p-5 pr-14 text-white font-black text-sm outline-none focus:border-primary transition-all text-center"
                        />
                        <ShieldAlert className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-700" size={20} />
                    </div>

                    <div className="relative">
                        <input 
                            type="password"
                            autoComplete="new-password"
                            value={adminPass}
                            onChange={e => setAdminPass(e.target.value)}
                            placeholder="هوية الوصول"
                            className="w-full bg-[#020617] border border-white/10 rounded-2xl p-5 pr-14 text-white font-black text-sm outline-none focus:border-primary transition-all text-center tracking-[0.4em]"
                        />
                        <Lock className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-700" size={20} />
                    </div>

                    {error && <p className="text-rose-500 text-[11px] font-black text-center animate-pulse">{error}</p>}
                    
                    <button type="submit" className="w-full bg-primary text-black font-black h-16 rounded-2xl shadow-2xl active:scale-95 transition-transform text-sm mt-4 uppercase">
                        فتح النظام
                    </button>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};
export default Settings;
