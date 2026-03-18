import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useGameStore } from './store/gameStore';
import Nav from './components/ui/Nav';
import Landing from './pages/Landing';
import Wilderness from './pages/Wilderness';
import Collection from './pages/Collection';
import Battle from './pages/Battle';
import MergeLab from './pages/MergeLab';
import Marketplace from './pages/Marketplace';
import Profile from './pages/Profile';

function ProtectedRoute({ children }) {
  const player = useGameStore(s => s.player);
  const token = useGameStore(s => s.token);
  if (!player || !token) return <Navigate to="/" replace />;
  return children;
}

const pageVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
  exit:    { opacity: 0, y: -8, transition: { duration: 0.2 } }
};

export default function App() {
  const { player, token, refreshPlayer } = useGameStore();

  useEffect(() => {
    if (token) refreshPlayer();
  }, [token]);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-animated">
        {player && <Nav />}
        <AnimatePresence mode="wait">
          <Routes>
            <Route path="/" element={
              player
                ? <Navigate to="/wilderness" replace />
                : <motion.div key="landing" variants={pageVariants} initial="initial" animate="animate" exit="exit"><Landing /></motion.div>
            } />
            <Route path="/wilderness" element={
              <ProtectedRoute>
                <motion.div key="wilderness" variants={pageVariants} initial="initial" animate="animate" exit="exit"><Wilderness /></motion.div>
              </ProtectedRoute>
            } />
            <Route path="/collection" element={
              <ProtectedRoute>
                <motion.div key="collection" variants={pageVariants} initial="initial" animate="animate" exit="exit"><Collection /></motion.div>
              </ProtectedRoute>
            } />
            <Route path="/battle" element={
              <ProtectedRoute>
                <motion.div key="battle" variants={pageVariants} initial="initial" animate="animate" exit="exit"><Battle /></motion.div>
              </ProtectedRoute>
            } />
            <Route path="/merge" element={
              <ProtectedRoute>
                <motion.div key="merge" variants={pageVariants} initial="initial" animate="animate" exit="exit"><MergeLab /></motion.div>
              </ProtectedRoute>
            } />
            <Route path="/marketplace" element={
              <ProtectedRoute>
                <motion.div key="market" variants={pageVariants} initial="initial" animate="animate" exit="exit"><Marketplace /></motion.div>
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <motion.div key="profile" variants={pageVariants} initial="initial" animate="animate" exit="exit"><Profile /></motion.div>
              </ProtectedRoute>
            } />
          </Routes>
        </AnimatePresence>
      </div>
    </BrowserRouter>
  );
}
