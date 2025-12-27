
import React, { Suspense } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { GameProvider } from './context/GameContext';
import BottomNav from './components/BottomNav';
import { Loader2 } from 'lucide-react';

const Home = React.lazy(() => import('./pages/Home'));
const Earn = React.lazy(() => import('./pages/Earn'));
const Wallet = React.lazy(() => import('./pages/Wallet'));
const Friends = React.lazy(() => import('./pages/Friends'));
const Settings = React.lazy(() => import('./pages/Settings'));
const Admin = React.lazy(() => import('./pages/Admin'));
const Shop = React.lazy(() => import('./pages/Shop'));
const Leaderboard = React.lazy(() => import('./pages/Leaderboard'));
const Challenge = React.lazy(() => import('./pages/Challenge'));
const LuckWheel = React.lazy(() => import('./pages/LuckWheel'));
const Profile = React.lazy(() => import('./pages/Profile'));
const P2P = React.lazy(() => import('./pages/P2P'));

const LoadingFallback = () => (
  <div className="min-h-screen bg-slate-900 flex items-center justify-center z-50">
    <div className="flex flex-col items-center">
      <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
      <p className="text-slate-400 text-sm font-bold animate-pulse">جاري التحميل...</p>
    </div>
  </div>
);

const App: React.FC = () => {
  return (
    <GameProvider>
      <Router>
        <div className="font-sans antialiased text-white min-h-screen bg-slate-900">
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/p2p" element={<P2P />} />
              <Route path="/challenge" element={<Challenge />} />
              <Route path="/wheel" element={<LuckWheel />} />
              <Route path="/earn" element={<Earn />} />
              <Route path="/wallet" element={<Wallet />} />
              <Route path="/friends" element={<Friends />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
          <BottomNav />
        </div>
      </Router>
    </GameProvider>
  );
};

export default App;
