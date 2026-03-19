import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useGameStore } from '../../store/gameStore';

const LINKS = [
  { to: '/wilderness',  icon: '🗺',  label: 'Wilderness' },
  { to: '/collection',  icon: '🐉',  label: 'Collection' },
  { to: '/battle',      icon: '⚔️',  label: 'Battle' },
  { to: '/infirmary',   icon: '✚',   label: 'Heal',     badge: 'injured' },
  { to: '/merge',       icon: '🔬',  label: 'Fusion' },
  { to: '/marketplace', icon: '💎',  label: 'Market' },
  { to: '/shards',      icon: '◈',   label: 'Shards' },
  { to: '/socket',      icon: '⬡',   label: 'Sockets' },
  { to: '/profile',     icon: '👤',  label: 'Profile' },
];

export default function Nav() {
  const { player, collection, logout } = useGameStore();
  const navigate = useNavigate();

  const injuredCount = collection.filter(
    pc => (pc.current_hp ?? pc.max_hp) < pc.max_hp
  ).length;

  const short = player?.wallet_address
    ? `${player.wallet_address.slice(0, 6)}…${player.wallet_address.slice(-4)}`
    : '';

  return (
    <motion.nav
      initial={{ y: -56, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="glass-dark sticky top-0 z-40 flex items-center gap-1 px-3 py-2 overflow-x-auto"
    >
      {/* Logo — hidden on very small screens */}
      <span className="font-display text-purple-400 text-base whitespace-nowrap mr-2 hidden md:block select-none">
        PRIMAL SHARDS
      </span>

      {/* Nav links */}
      {LINKS.map(({ to, icon, label, badge }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors
             ${isActive
               ? 'bg-purple-600/30 text-purple-300'
               : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`
          }
        >
          <span className="text-sm leading-none">{icon}</span>
          <span className="hidden sm:inline">{label}</span>
          {badge === 'injured' && injuredCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-4 h-4 px-0.5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold leading-none">
              {injuredCount}
            </span>
          )}
        </NavLink>
      ))}

      {/* Right side */}
      <div className="ml-auto flex items-center gap-3 pl-2 shrink-0">
        <span className="text-amber-400 text-xs font-bold hidden sm:block">
          💎 {player?.shards?.toLocaleString() ?? 0}
        </span>
        <span className="text-slate-600 text-xs hidden lg:block">{short}</span>
        <button
          onClick={() => { logout(); navigate('/'); }}
          className="text-xs text-slate-600 hover:text-red-400 transition-colors px-1.5 py-1 rounded"
        >
          ✕
        </button>
      </div>
    </motion.nav>
  );
}
