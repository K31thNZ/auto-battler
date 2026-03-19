import { NavLink, useNavigate } from 'react-router-dom';
import { useGameStore } from '../../store/gameStore';
import { motion } from 'framer-motion';

const links = [
  { to: '/wilderness', label: '🗺 Wilderness' },
  { to: '/collection', label: '🐉 Collection' },
  { to: '/battle',     label: '⚔️ Battle' },
  { to: '/merge',      label: '🔬 Fusion' },
  { to: '/marketplace',label: '💎 Market' },
  { to: '/profile',    label: '👤 Profile' },
];

export default function Nav() {
  const { player, logout } = useGameStore();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/'); };
  const short = player?.wallet_address
    ? `${player.wallet_address.slice(0,6)}...${player.wallet_address.slice(-4)}`
    : '';

  return (
    <motion.nav
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="glass-dark sticky top-0 z-40 px-4 py-3 flex items-center gap-4 overflow-x-auto"
    >
      <span className="font-display text-lg text-purple-400 whitespace-nowrap mr-2 hidden sm:block">PRIMAL SHARDS</span>
      <div className="flex items-center gap-1 flex-1 flex-wrap">
        {links.map(l => (
          <NavLink
            key={l.to}
            to={l.to}
            className={({ isActive }) =>
              `nav-link px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors
               ${isActive ? 'bg-purple-600/30 text-purple-300' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`
            }
          >
            {l.label}
          </NavLink>
        ))}
      </div>
      <div className="flex items-center gap-3 ml-auto whitespace-nowrap">
        <span className="text-amber-400 text-sm font-semibold hidden sm:block">
          💎 {player?.shards?.toLocaleString() ?? 0}
        </span>
        <span className="text-slate-500 text-xs hidden md:block">{short}</span>
        <button
          onClick={handleLogout}
          className="text-xs text-slate-500 hover:text-red-400 transition-colors px-2 py-1 rounded"
        >
          Disconnect
        </button>
      </div>
    </motion.nav>
  );
}
