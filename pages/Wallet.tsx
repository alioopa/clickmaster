
import React, { useState } from 'react';
import { useGame, EXCHANGE_RATE_USD, POINTS_PER_DOLLAR } from '../context/GameContext';
import { TransactionType, TransactionStatus } from '../types';
import { Wallet as WalletIcon, ArrowUpCircle, PlusCircle, DollarSign, History, ChevronLeft, CreditCard, Clock, Calendar, Info, RefreshCw, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Wallet: React.FC = () => {
  const { user, requestWithdrawal, requestDeposit, transactions } = useGame();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'withdraw' | 'deposit'>('withdraw');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('Zain Cash');
  const [txId, setTxId] = useState('');
  const [msg, setMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Limits
  const MIN_WITHDRAWAL_USD = 20;
  const MIN_DEPOSIT_USD = 10;

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg('');
    setErrorMsg('');
    const val = Number(amount);

    if (activeTab === 'withdraw') {
        const usdVal = val * EXCHANGE_RATE_USD;
        if (usdVal < MIN_WITHDRAWAL_USD) {
            setErrorMsg(`الحد الأدنى للسحب هو $${MIN_WITHDRAWAL_USD} (${(MIN_WITHDRAWAL_USD * POINTS_PER_DOLLAR).toLocaleString()} نقطة)`);
            return;
        }
        const res = await requestWithdrawal(val, method);
        if(res.success) setMsg(res.message);
        else setErrorMsg(res.message);
    } else {
        if (val < MIN_DEPOSIT_USD) {
            setErrorMsg(`الحد الأدنى للإيداع هو $${MIN_DEPOSIT_USD}`);
            return;
        }
        const res = await requestDeposit(val, method, txId);
        if(res.success) setMsg(res.message);
        else setErrorMsg(res.message);
    }
    setAmount(''); setTxId('');
  };

  const getProcessingEstimate = (tx: any) => {
      if (tx.status !== TransactionStatus.PENDING) return null;
      if (tx.type === TransactionType.WITHDRAWAL) return 'يتم المعالجة خلال 24-48 ساعة';
      if (tx.type === TransactionType.DEPOSIT) return 'يتم التحقق خلال 1-6 ساعات';
      return null;
  };

  // حاسبة التحويل الفورية
  const getEquivalentValue = () => {
      if (!amount) return null;
      const val = Number(amount);
      if (isNaN(val) || val <= 0) return null;

      if (activeTab === 'withdraw') {
          // المستخدم يكتب نقاط -> نعرض الدولار
          const usdVal = val * EXCHANGE_RATE_USD;
          return `$${usdVal.toFixed(2)}`;
      } else {
          // المستخدم يكتب دولار -> نعرض نقاط
          const pointsVal = val * POINTS_PER_DOLLAR;
          return `${pointsVal.toLocaleString()} نقطة`;
      }
  };

  return (
    <div className="h-screen bg-dark text-white px-6 pt-10 pb-32 overflow-y-auto custom-scrollbar" dir="rtl">
      <div className="flex items-center justify-between mb-8">
        <button onClick={() => navigate('/')} className="p-3 bg-white/5 rounded-xl border border-white/10 active:scale-90 transition-all"><ChevronLeft size={20} /></button>
        <h1 className="text-xl font-black">المحفظة</h1>
        <div className="w-10"></div>
      </div>

      {/* Balance Card */}
      <div className="bg-gradient-to-br from-secondary to-dark p-8 rounded-[2.5rem] border border-white/10 mb-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-primary/20"></div>
          <p className="text-slate-500 text-[10px] font-black uppercase mb-1">الرصيد القابل للسحب</p>
          <div className="flex items-baseline gap-2 mb-4">
              <h2 className="text-4xl font-black">{user.balance.toLocaleString()}</h2>
              <span className="text-primary text-xs font-bold">نقطة</span>
          </div>
          <div className="bg-black/30 p-3 rounded-2xl border border-white/5 inline-flex items-center gap-2">
              <DollarSign size={14} className="text-primary" />
              <span className="text-sm font-black">${(user.balance * EXCHANGE_RATE_USD).toFixed(2)}</span>
          </div>
      </div>

      {/* Exchange Rate Info */}
      <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4 mb-8 flex flex-col gap-2">
          <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <RefreshCw size={14} />
                  </div>
                  <div>
                      <p className="text-[10px] text-slate-400 font-bold">معلومات الصرف</p>
                      <p className="text-xs font-black text-white">إيداع: 1$ = 1,450 IQD</p>
                  </div>
              </div>
          </div>
          <div className="border-t border-primary/10 pt-2 mt-1">
              <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                  <Info size={12}/>
                  <span>ملاحظة السحب: يتم احتساب 1$ = 1 IQD (شامل الرسوم)</span>
              </p>
          </div>
      </div>

      {/* Action Form */}
      <div className="bg-white/5 rounded-[2rem] p-6 border border-white/10 mb-10">
          <div className="flex bg-black/40 p-1 rounded-xl mb-6">
              <button onClick={() => {setActiveTab('withdraw'); setAmount('');}} className={`flex-1 py-2 rounded-lg text-xs font-black transition-all ${activeTab === 'withdraw' ? 'bg-primary text-black' : 'text-slate-500'}`}>سحب</button>
              <button onClick={() => {setActiveTab('deposit'); setAmount('');}} className={`flex-1 py-2 rounded-lg text-xs font-black transition-all ${activeTab === 'deposit' ? 'bg-primary text-black' : 'text-slate-500'}`}>إيداع</button>
          </div>

          {msg && <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 p-3 rounded-xl mb-4 text-[10px] font-black text-center">{msg}</div>}
          {errorMsg && <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 p-3 rounded-xl mb-4 text-[10px] font-black text-center flex items-center justify-center gap-2"><AlertTriangle size={14}/> {errorMsg}</div>}

          <form onSubmit={handleAction} className="space-y-4">
              <div className="space-y-1">
                  <div className="flex justify-between">
                    <label className="text-[10px] text-slate-500 font-black pr-2">المبلغ ({activeTab === 'withdraw' ? 'بالنقاط' : 'بالدولار'})</label>
                    {getEquivalentValue() && (
                        <span className="text-[10px] text-emerald-400 font-black animate-pulse">
                            {activeTab === 'withdraw' ? 'يساوي تقريباً: ' : 'ستحصل على: '}
                            {getEquivalentValue()}
                        </span>
                    )}
                  </div>
                  <input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white font-black transition-all focus:border-primary/50" placeholder="0" />
                  
                  {/* Min Limit Hint */}
                  <p className="text-[9px] text-slate-500 font-bold px-2">
                      {activeTab === 'withdraw' 
                        ? `الحد الأدنى: $${MIN_WITHDRAWAL_USD} (${(MIN_WITHDRAWAL_USD * POINTS_PER_DOLLAR).toLocaleString()} نقطة)`
                        : `الحد الأدنى: $${MIN_DEPOSIT_USD}`
                      }
                  </p>
              </div>
              <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-black pr-2">وسيلة الدفع</label>
                  <select value={method} onChange={e => setMethod(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white font-black">
                      <option>Zain Cash</option>
                      <option>Payeer</option>
                      <option>USDT (TRC20)</option>
                  </select>
              </div>
              {activeTab === 'deposit' && (
                  <div className="space-y-1">
                      <label className="text-[10px] text-slate-500 font-black pr-2">رقم العملية (ID)</label>
                      <input type="text" value={txId} onChange={e => setTxId(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white font-black" placeholder="أدخل معرف التحويل" />
                  </div>
              )}
              <button type="submit" className="w-full py-4 bg-primary text-black font-black rounded-xl shadow-xl active:scale-95 transition-all">
                  {activeTab === 'withdraw' ? 'طلب سحب الأرباح' : 'تأكيد الإيداع'}
              </button>
          </form>
      </div>

      {/* History */}
      <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4"><History size={18} className="text-slate-500"/><h2 className="text-sm font-black">سجل العمليات التفصيلي</h2></div>
          {transactions.length === 0 && <p className="text-center text-slate-600 text-xs py-4">لا توجد عمليات سابقة</p>}
          {transactions.map(tx => {
              const txDate = new Date(tx.timestamp);
              const timeString = txDate.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
              const dateString = txDate.toLocaleDateString('ar-EG');
              const estimate = getProcessingEstimate(tx);

              return (
                <div key={tx.id} className="bg-[#0d1117] p-5 rounded-[2rem] border border-white/5 shadow-lg relative overflow-hidden group">
                    <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${tx.type === TransactionStatus.PENDING ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                                {tx.type === TransactionType.DEPOSIT ? <PlusCircle size={22}/> : <ArrowUpCircle size={22}/>}
                            </div>
                            <div>
                                <p className="text-xs font-black text-white mb-0.5">{tx.type === TransactionType.DEPOSIT ? 'إيداع رصيد' : 'سحب أرباح'}</p>
                                <p className="text-[10px] text-slate-500 font-bold">{tx.method}</p>
                            </div>
                        </div>
                        <div className="text-left">
                            <p className={`text-sm font-black ${tx.type === TransactionType.DEPOSIT ? 'text-emerald-500' : 'text-rose-500'}`}>
                                {tx.usdAmount ? `$${tx.usdAmount}` : `${tx.amount.toLocaleString()} P`}
                            </p>
                            <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase ${
                                tx.status === TransactionStatus.PENDING ? 'bg-amber-500/10 text-amber-500' : 
                                tx.status === TransactionStatus.COMPLETED ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
                            }`}>
                                {tx.status}
                            </span>
                        </div>
                    </div>

                    <div className="bg-black/20 rounded-xl p-3 border border-white/5 space-y-2">
                        <div className="flex items-center justify-between text-[10px] text-slate-400">
                             <div className="flex items-center gap-1.5">
                                 <Calendar size={12} />
                                 <span>{dateString}</span>
                             </div>
                             <div className="flex items-center gap-1.5">
                                 <Clock size={12} />
                                 <span>{timeString}</span>
                             </div>
                        </div>
                        
                        {estimate && (
                            <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                                <Clock size={12} className="text-primary animate-pulse" />
                                <span className="text-[9px] text-primary font-bold">{estimate}</span>
                            </div>
                        )}
                        
                        {tx.txId && (
                            <div className="pt-1">
                                <span className="text-[8px] text-slate-600 block">Transaction ID:</span>
                                <code className="text-[9px] text-slate-400 font-mono">{tx.txId}</code>
                            </div>
                        )}
                    </div>
                </div>
              );
          })}
      </div>
    </div>
  );
};
export default Wallet;
