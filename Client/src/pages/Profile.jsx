import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { api } from '../lib/api';

const ACHIEVEMENTS = [
  { key: 'first_capture', icon: '🎯', name: 'First Capture',    desc: 'Caught your first creature' },
  { key: 'first_win',     icon: '🏆', name: 'First Victory',    desc: 'Won your first battle' },
  { key: 'first_merge',   icon: '🔬', name: 'Alchemist',        desc: 'Merged your first legendary' },
  { key: 'collector_10',  icon: '📦', name: 'Collector ×10',    desc: 'Owned 10+ creatures' },
];

function StatBlock({ label, value, color = '#7c3aed' }) {
  return (
    <div className="glass rounded-xl p-4 text-center">
      <p className="text-2xl font-black" style={{ color }}>{value}</p>
      <p className="text-xs text-slate-400 mt-1">{label}</p>
    </div>
  );
}

export default function Profile() {
  const { player } = useGameStore();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    api.getProfile().then(setProfile).catch(console.error);
  }, []);

  if (!profile) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-purple-400 animate-pulse">Loading profile...</div>
    </div>
  );

  const winRate = profile.battles_won + profile.battles_lost > 0
    ? Math.round((profile.battles_won / (profile.battles_won + profile.battles_lost)) * 100)
    : 0;
  const unlockedKeys = new Set((profile.achievements || []).map(a => a.achievement_key));
  const short = profile.wallet_address
    ? `${profile.wallet_address.slice(0,10)}...${profile.wallet_address.slice(-6)}`
    : '';

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <motion.div
        className="glass rounded-2xl p-6 mb-6 border border-purple-500/20"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl"
            style={{ background: 'linear-gradient(135deg,#7c3aed,#0d9488)' }}>
            👤
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-purple-300">
              {profile.username || 'Unnamed Trainer'}
            </h1>
            <p className="text-slate-500 text-sm font-mono">{short}</p>
            <p className="text-xs text-slate-600 mt-0.5">
              Joined {new Date(profile.created_at).toLocaleDateString()}
            </p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-2xl font-black text-amber-400">💎 {profile.shards?.toLocaleString()}</p>
            <p className="text-xs text-slate-500">Shards</p>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <StatBlock label="Creatures" value={profile.creature_count} color="#7c3aed" />
        <StatBlock label="Battles Won" value={profile.battles_won} color="#22c55e" />
        <StatBlock label="Battles Lost" value={profile.battles_lost} color="#ef4444" />
        <StatBlock label="Win Rate" value={`${winRate}%`} color="#fbbf24" />
      </div>

      {/* Achievements */}
      <motion.div
        className="glass rounded-2xl p-5 mb-6"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <h2 className="font-bold text-sm text-slate-300 uppercase tracking-wider mb-4">Achievements</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {ACHIEVEMENTS.map(ach => {
            const unlocked = unlockedKeys.has(ach.key);
            return (
              <div
                key={ach.key}
                className={`rounded-xl p-3 text-center border transition-all
                  ${unlocked
                    ? 'bg-amber-900/20 border-amber-500/40 glow-gold'
                    : 'bg-white/3 border-white/5 opacity-40 grayscale'}`}
              >
                <div className="text-3xl mb-1">{ach.icon}</div>
                <p className="text-xs font-bold text-amber-300">{ach.name}</p>
                <p className="text-xs text-slate-500 mt-0.5">{ach.desc}</p>
                {unlocked && (
                  <p className="text-xs text-teal-400 mt-1">✓ Unlocked</p>
                )}
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Battle History */}
      <motion.div
        className="glass rounded-2xl p-5"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="font-bold text-sm text-slate-300 uppercase tracking-wider mb-4">Recent Battles</h2>
        {(!profile.battle_history || profile.battle_history.length === 0) ? (
          <p className="text-slate-600 text-sm text-center py-4">No battles yet. Head to the arena!</p>
        ) : (
          <div className="space-y-2">
            {profile.battle_history.map((battle, i) => (
              <div key={battle.id}
                className={`flex items-center gap-3 p-3 rounded-xl text-sm border
                  ${battle.result === 'win'
                    ? 'bg-teal-900/20 border-teal-800/40'
                    : 'bg-red-900/20 border-red-800/40'}`}>
                <span className="text-xl">{battle.result === 'win' ? '🏆' : '💀'}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`font-bold text-xs ${battle.result === 'win' ? 'text-teal-300' : 'text-red-300'}`}>
                      {battle.result === 'win' ? 'Victory' : 'Defeat'}
                    </span>
                    <span className="text-xs text-slate-500 capitalize">{battle.difficulty}</span>
                  </div>
                  <div className="text-xs text-slate-500 truncate">
                    vs {(battle.enemy_team || []).map(c => c.name).join(', ')}
                  </div>
                </div>
                <div className="text-right text-xs">
                  <p className="text-purple-300">+{battle.xp_gained} XP</p>
                  {battle.shards_gained > 0 && <p className="text-amber-400">+{battle.shards_gained} 💎</p>}
                  <p className="text-slate-600">{new Date(battle.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
