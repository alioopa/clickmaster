
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserState, Task, Transaction, TransactionType, TransactionStatus, DigitalProduct, P2POffer, PaymentMethod } from '../types';

export const POINTS_PER_DOLLAR = 200000;
export const EXCHANGE_RATE_USD = 1 / POINTS_PER_DOLLAR;

const KEYS = {
  USER: 'tliker_user_data_v1',
  TX: 'tliker_transactions_v1',
  OFFERS: 'tliker_p2p_offers_v1',
  PRODUCTS: 'tliker_products_v1',
  TASKS: 'tliker_tasks_v1' // Added Tasks key
};

const getInitialUser = (): UserState => {
  const saved = localStorage.getItem(KEYS.USER);
  if (saved) return JSON.parse(saved);
  
  const tg = window.Telegram?.WebApp?.initDataUnsafe?.user;
  return {
    id: tg?.id ? String(tg.id) : `u_${Math.random().toString(36).substr(2, 9)}`,
    name: tg?.first_name || 'Nova Player',
    balance: 1000,
    energy: 1000,
    maxEnergy: 1000,
    referrals: 0,
    joinDate: new Date().toLocaleDateString(),
    walletAddress: '',
    role: 'user',
    isBanned: false,
    ownedProducts: [],
    completedTaskIds: [],
    notificationsEnabled: true
  };
};

// Initial Data Mock
const INITIAL_TASKS: Task[] = [
  { id: 't1', title: 'تابع قناتنا الرسمية', reward: 5000, type: 'social', link: 'https://t.me/' },
  { id: 't2', title: 'شاهد فيديو اليوم', reward: 2000, type: 'ad', link: '#' }
];

const INITIAL_PRODUCTS: DigitalProduct[] = [
    { id: 'p1', name: 'معدن المبتدئ', description: 'يربح 0.5 نقطة كل ثانية', pricePoints: 10000, priceStars: 0, isFree: false, category: 'mining', earningRate: 0.5, allowPoints: true, allowStars: false, imageData: 'https://images.unsplash.com/photo-1624365169344-933e4b3734e0?w=300' }
];

interface GameContextType {
  user: UserState;
  isReady: boolean;
  tasks: Task[];
  transactions: Transaction[];
  p2pOffers: P2POffer[];
  digitalProducts: DigitalProduct[];
  paymentMethods: PaymentMethod[];
  handleClick: () => boolean;
  completeTask: (taskId: string) => void;
  requestWithdrawal: (amount: number, method: string) => { success: boolean, message: string };
  requestDeposit: (usd: number, method: string, txId: string) => { success: boolean, message: string };
  updateWalletAddress: (addr: string) => void;
  getReferralLink: () => string;
  createP2POffer: (amount: number, priceUsd: number, method: string) => { success: boolean, message: string };
  buyP2POffer: (offerId: string) => { success: boolean, message: string };
  cancelP2POffer: (offerId: string) => { success: boolean, message: string };
  buyProductWithPoints: (productId: string) => { success: boolean, message: string };
  
  // Admin Functions
  adminLogin: () => void;
  adminLogout: () => void;
  toggleTheme: () => void;
  toggleNotifications: () => void;
  copyReferralLink: () => void;
  fetchReferralsList: () => Promise<UserState[]>;
  referralReward: number;
  
  // New Admin CRUD Actions
  adminAddTask: (task: Task) => void;
  adminDeleteTask: (id: string) => void;
  adminAddProduct: (product: DigitalProduct) => void;
  adminDeleteProduct: (id: string) => void;
  adminProcessTransaction: (id: string, status: TransactionStatus) => void;
  adminBanUser: (id: string, isBanned: boolean) => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserState>(getInitialUser());
  const [isReady] = useState(true);
  
  // Load from local storage or default
  const [tasks, setTasks] = useState<Task[]>(() => {
      const saved = localStorage.getItem(KEYS.TASKS);
      return saved ? JSON.parse(saved) : INITIAL_TASKS;
  });
  
  const [transactions, setTransactions] = useState<Transaction[]>(JSON.parse(localStorage.getItem(KEYS.TX) || '[]'));
  const [p2pOffers, setP2POffers] = useState<P2POffer[]>(JSON.parse(localStorage.getItem(KEYS.OFFERS) || '[]'));
  
  const [digitalProducts, setDigitalProducts] = useState<DigitalProduct[]>(() => {
      const saved = localStorage.getItem(KEYS.PRODUCTS);
      return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });

  const [paymentMethods] = useState<PaymentMethod[]>([
    { id: 'm1', name: 'زين كاش', accountNumber: '07800000000', recipientName: 'Tliker Official' }
  ]);

  // Sync to LocalStorage
  useEffect(() => { localStorage.setItem(KEYS.USER, JSON.stringify(user)); }, [user]);
  useEffect(() => { localStorage.setItem(KEYS.TX, JSON.stringify(transactions)); }, [transactions]);
  useEffect(() => { localStorage.setItem(KEYS.OFFERS, JSON.stringify(p2pOffers)); }, [p2pOffers]);
  useEffect(() => { localStorage.setItem(KEYS.TASKS, JSON.stringify(tasks)); }, [tasks]);
  useEffect(() => { localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(digitalProducts)); }, [digitalProducts]);

  // Mining Logic
  useEffect(() => {
    // Energy Regen
    const energyTimer = setInterval(() => {
      setUser(prev => {
        if (prev.energy < prev.maxEnergy) {
          return { ...prev, energy: Math.min(prev.maxEnergy, prev.energy + 1) };
        }
        return prev;
      });
    }, 3000);

    // Passive Mining from Products
    const miningTimer = setInterval(() => {
        setUser(prev => {
            const ownedItems = digitalProducts.filter(p => prev.ownedProducts.includes(p.id));
            const miningRate = ownedItems.reduce((acc, curr) => acc + (curr.earningRate || 0), 0);
            if (miningRate > 0) {
                return { ...prev, balance: prev.balance + miningRate };
            }
            return prev;
        });
    }, 1000);

    return () => { clearInterval(energyTimer); clearInterval(miningTimer); };
  }, [digitalProducts]);

  const handleClick = () => {
    if (user.energy < 1 || user.isBanned) return false;
    setUser(prev => ({ ...prev, balance: prev.balance + 1.5, energy: prev.energy - 1 }));
    return true;
  };

  const completeTask = (taskId: string) => {
    if (user.completedTaskIds.includes(taskId)) return;
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    setUser(prev => ({ ...prev, balance: prev.balance + task.reward, completedTaskIds: [...prev.completedTaskIds, taskId] }));
  };

  const requestWithdrawal = (amount: number, method: string) => {
    if (user.balance < amount) return { success: false, message: 'رصيد غير كافٍ' };
    const newTx: Transaction = {
      id: `tx_${Date.now()}`, userId: user.id, type: TransactionType.WITHDRAWAL, amount,
      status: TransactionStatus.PENDING, date: new Date().toLocaleDateString(), timestamp: Date.now(), method
    };
    setTransactions(prev => [newTx, ...prev]);
    setUser(prev => ({ ...prev, balance: prev.balance - amount })); // Deduct immediately (refund if rejected)
    return { success: true, message: 'تم إرسال طلب السحب' };
  };

  const requestDeposit = (usd: number, method: string, txId: string) => {
    const newTx: Transaction = {
      id: `tx_${Date.now()}`, userId: user.id, type: TransactionType.DEPOSIT, amount: usd * POINTS_PER_DOLLAR,
      usdAmount: usd, status: TransactionStatus.PENDING, date: new Date().toLocaleDateString(), timestamp: Date.now(), method, txId
    };
    setTransactions(prev => [newTx, ...prev]);
    return { success: true, message: 'تم إرسال إشعار الإيداع' };
  };

  const createP2POffer = (amount: number, priceUsd: number, method: string) => {
    if (user.balance < amount) return { success: false, message: 'رصيد نقاطك غير كافٍ' };
    const newOffer: P2POffer = {
      id: `off_${Date.now()}`, sellerId: user.id, sellerName: user.name || 'User',
      amount, priceUsd, status: 'available', paymentMethod: method, createdAt: Date.now()
    };
    setP2POffers(prev => [newOffer, ...prev]);
    setUser(prev => ({ ...prev, balance: prev.balance - amount }));
    return { success: true, message: 'تم نشر العرض بنجاح' };
  };

  const buyP2POffer = (offerId: string) => {
      setP2POffers(prev => prev.map(o => o.id === offerId ? { ...o, status: 'pending', buyerId: user.id, buyerName: user.name } as P2POffer : o));
      return { success: true, message: 'تم بدء التداول' };
  };

  const cancelP2POffer = (offerId: string) => {
    const offer = p2pOffers.find(o => o.id === offerId);
    if (!offer) return { success: false, message: 'العرض غير موجود' };
    setUser(prev => ({ ...prev, balance: prev.balance + offer.amount }));
    setP2POffers(prev => prev.filter(o => o.id !== offerId));
    return { success: true, message: 'تم إلغاء العرض' };
  };

  const buyProductWithPoints = (productId: string) => {
    const prod = digitalProducts.find(p => p.id === productId);
    if (!prod || user.balance < prod.pricePoints) return { success: false, message: 'رصيد غير كافٍ' };
    setUser(prev => ({ ...prev, balance: prev.balance - prod.pricePoints, ownedProducts: [...prev.ownedProducts, productId] }));
    return { success: true, message: 'تم شراء المنتج' };
  };

  const updateWalletAddress = (addr: string) => setUser(prev => ({ ...prev, walletAddress: addr }));
  
  // UPDATE: Changed to the correct bot handle
  const getReferralLink = () => `https://t.me/tlakerbot?start=${user.id}`;
  
  const adminLogin = () => setUser(prev => ({ ...prev, role: 'admin' }));
  const adminLogout = () => setUser(prev => ({ ...prev, role: 'user' }));
  const toggleTheme = () => setUser(prev => ({ ...prev, theme: prev.theme === 'light' ? 'dark' : 'light' }));
  const toggleNotifications = () => setUser(prev => ({ ...prev, notificationsEnabled: !prev.notificationsEnabled }));
  
  const copyReferralLink = () => { navigator.clipboard.writeText(getReferralLink()); };
  const fetchReferralsList = async () => [];

  // --- ADMIN ACTIONS IMPLEMENTATION ---
  const adminAddTask = (task: Task) => setTasks(prev => [...prev, task]);
  const adminDeleteTask = (id: string) => setTasks(prev => prev.filter(t => t.id !== id));
  
  const adminAddProduct = (product: DigitalProduct) => setDigitalProducts(prev => [...prev, product]);
  const adminDeleteProduct = (id: string) => setDigitalProducts(prev => prev.filter(p => p.id !== id));
  
  const adminProcessTransaction = (id: string, status: TransactionStatus) => {
      setTransactions(prev => prev.map(t => {
          if (t.id !== id) return t;

          // Logic to update user balance based on approval/rejection
          if (t.userId === user.id) {
              if (t.type === TransactionType.WITHDRAWAL && status === TransactionStatus.REJECTED) {
                  // Refund user if withdrawal rejected
                  setUser(u => ({ ...u, balance: u.balance + t.amount }));
              } else if (t.type === TransactionType.DEPOSIT && status === TransactionStatus.COMPLETED) {
                  // Add funds if deposit approved
                  setUser(u => ({ ...u, balance: u.balance + t.amount }));
              }
          }
          return { ...t, status };
      }));
  };

  const adminBanUser = (id: string, isBanned: boolean) => {
      if (user.id === id) {
          setUser(prev => ({ ...prev, isBanned }));
      }
      // In a real backend, this would update the database for any user ID
  };

  return (
    <GameContext.Provider value={{
      user, isReady, tasks, transactions, p2pOffers, digitalProducts, paymentMethods,
      handleClick, completeTask, requestWithdrawal, requestDeposit, updateWalletAddress, getReferralLink,
      createP2POffer, buyP2POffer, cancelP2POffer, buyProductWithPoints, adminLogin, adminLogout, toggleTheme, toggleNotifications,
      copyReferralLink, fetchReferralsList, referralReward: 1000,
      // Admin Exports
      adminAddTask, adminDeleteTask, adminAddProduct, adminDeleteProduct, adminProcessTransaction, adminBanUser
    }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) throw new Error("useGame must be used within GameProvider");
  return context;
};
