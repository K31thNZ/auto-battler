import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useGameStore } from './store/gameStore';
import Nav from './components/ui/Nav';
import Landing     from './pages/Landing';
import Wilderness  from './pages/Wilderness';
import Collection  from './pages/Collection';
import Battle      from './pages/Battle';
import MergeLab    from './pages/MergeLab';
import Marketplace from './pages/Marketplace';
import Profile     from './pages/Profile';
import Infirmary   from './pages/Infirmary';
import ShardWallet from './pages/ShardWallet';
import SocketLab   from './pages/SocketLab';

function ProtectedRoute({ children }) {
  const player = useGameStore(s => s.player);
  const token  = useGameStore(s => s.token);
  if (!player || !token) return <Navigate to="/" replace />;
  return children;
}

const pageVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
  exit:    { opacity: 0, y: -8, transition: { duration: 0.18 } },
};

function Page({ k, children }) {
  return (
    <motion.div key={k} variants={pageVariants} initial="initial" animate="animate" exit="exit">
      {children}
    </motion.div>
  );
}

const PROTECTED_ROUTES = [
  ['/wilderness',  <Wilderness />],
  ['/collection',  <Collection />],
  ['/battle',      <Battle />],
  ['/infirmary',   <Infirmary />],
  ['/merge',       <MergeLab />],
  ['/marketplace', <Marketplace />],
  ['/shards',      <ShardWallet />],
  ['/socket',      <SocketLab />],
  ['/profile',     <Profile />],
];

export default function App() {
  const { token, refreshPlayer } = useGameStore();
  useEffect(() => { if (token) refreshPlayer(); }, [token]);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-animated">
        <Routes>
          <Route path="/" element={
            <AnimatePresence mode="wait">
              <Page k="landing"><Landing /></Page>
            </AnimatePresence>
          }/>
          {PROTECTED_ROUTES.map(([path, element]) => (
            <Route key={path} path={path} element={
              <ProtectedRoute>
                <Nav />
                <AnimatePresence mode="wait">
                  <Page k={path}>{element}</Page>
                </AnimatePresence>
              </ProtectedRoute>
            }/>
          ))}
          <Route path="*" element={<Navigate to="/" replace />}/>
        </Routes>
      </div>
    </BrowserRouter>
  );
}
