import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../lib/api';
import { useGameStore, TYPE_COLORS } from '../store/gameStore';

const ZONES = [
  {
    name: 'Ashveil Crater',
    emoji: '🌋',
    types: ['Fire', 'Earth'],
    difficulty: 'Medium',
    diffColor: '#f97316',
    description: 'A volcanic basin where fire-type beasts roam among rivers of lava.',
    creatures: ['Emberpup', 'Infernog', 'Blazehorn', 'Cinderfox'],
    bg: 'from-red-950/50 to-orange-950/50',
    border: '#ef4444',
  },
  {
    name: 'Tidehaven Depths',
    emoji: '🌊',
    types: ['Water', 'Earth'],
    difficulty: 'Easy',
    diffColor: '#22c55e',
    description: 'Submerged caverns teeming with aquatic creatures and ancient ruins.',
    creatures: ['Aquafin', 'Torrentail', 'Tidalwyrm', 'Mistshade'],
    bg: 'from-blue-950/50 to-cyan-950/50',
    border: '#3b82f6',
  },
  {
    name: 'Stormspire Peak',
    emoji: '⛈️',
    types: ['Wind', 'Thunder'],
    difficulty: 'Medium',
    diffColor: '#f97316',
    description: 'Storm-wracked mountains where electric creatures rule the skies.',
    creatures: ['Galesprout', 'Cyclomane', 'Zephyrax', 'Voltkit'],
    bg: 'from-emerald-950/50 to-yellow-950/50',
    border: '#10b981',
  },
  {
    name: 'Umbral Rift',
    emoji: '🌑',
    types: ['Shadow', 'Psychic', 'Ice'],
    difficulty: 'Hard',
    diffColor: '#ef4444',
    description: 'A tear in reality where shadow beings and psychic anomalies lurk.',
    creatures: ['Shadowpup', 'Psyclaw', 'Voidmind', 'Frostling'],
    bg: 'from-purple-950/50 to-indigo-950/50',
    border: '#8b5cf6',
  },
  {
    name: 'Sunstone Plateau',
    emoji: '☀️',
    types: ['Light', 'Earth', 'Nature', 'Metal'],
    difficulty: 'Easy',
    diffColor: '#22c55e',
    description: 'Vast golden plains blessed with light, home to diverse creature life.',
    creatures: ['Stoneback', 'Ramrock', 'Glimlet', 'Ironfang', 'Poisonmaw'],
    bg: 'from-yellow-950/50 to-lime-950/50',
    border: '#fbbf24',
  },
];

export default function Wilderness() {
  const { loadCollection, refreshPlayer } = useGameStore();
  const [captureResult, setCaptureResult] = useState(null);
  const [capturing, setCapturing] = useState(null);

  const handleCapture = async (zone) => {
    setCapturing(zone.name);
    setCaptureResult(null);
    try {
      const result = await api.captureCreature(zone.name);
      setCaptureResult({ ...result, zone: zone.name });
      if (result.success) {
        await loadCollection();
        await refreshPlayer();
      }
    } catch (err) {
      setCaptureResult({ success: false, message: err.message, zone: zone.name });
    } finally {
      setCapturing(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-purple-300 mb-2">🗺 Wilderness</h1>
        <p className="text-slate-400">Explore elemental zones to capture creatures</p>
      </div>

      {/* Capture result toast */}
      <AnimatePresence>
        {captureResult && (
          <motion.div
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -30, opacity: 0 }}
            className={`mb-6 p-4 rounded-xl border text-sm font-medium flex items-center gap-3
              ${captureResult.success
                ? 'bg-teal-900/40 border-teal-500/50 text-teal-300'
                : 'bg-red-900/40 border-red-500/50 text-red-300'}`}
          >
            <span className="text-2xl">{captureResult.success ? '🎉' : '💨'}</span>
            <div>
              <p className="font-bold">{captureResult.success ? 'Captured!' : 'Escaped!'}</p>
              <p>{captureResult.message}</p>
              {captureResult.success && captureResult.creature && (
                <p className="text-xs mt-1 opacity-75">
                  {captureResult.creature.creature_name || captureResult.creature.name} added to collection
                </p>
              )}
            </div>
            <button className="ml-auto text-slate-400 hover:text-white" onClick={() => setCaptureResult(null)}>✕</button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {ZONES.map((zone, i) => (
          <motion.div
            key={zone.name}
            className={`zone-card glass rounded-2xl overflow-hidden border`}
            style={{ borderColor: `${zone.border}44` }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            {/* Zone header */}
            <div className={`relative h-28 flex items-center justify-center bg-gradient-to-br ${zone.bg}`}
              style={{ borderBottom: `1px solid ${zone.border}44` }}>
              <div className="text-6xl" style={{ filter: `drop-shadow(0 0 16px ${zone.border}88)` }}>
                {zone.emoji}
              </div>
              <div className="absolute top-3 right-3 text-xs px-2 py-1 rounded-full font-medium"
                style={{ background: `${zone.diffColor}22`, color: zone.diffColor, border: `1px solid ${zone.diffColor}44` }}>
                {zone.difficulty}
              </div>
            </div>

            <div className="p-4 space-y-3">
              <h3 className="font-bold text-base" style={{ color: zone.border }}>{zone.name}</h3>
              <p className="text-slate-400 text-xs leading-relaxed">{zone.description}</p>

              {/* Type tags */}
              <div className="flex flex-wrap gap-1">
                {zone.types.map(t => (
                  <span key={t} className={`type-${t} text-xs px-2 py-0.5 rounded-full border`}>{t}</span>
                ))}
              </div>

              {/* Creatures found here */}
              <div>
                <p className="text-xs text-slate-500 mb-1">Creatures Found:</p>
                <div className="flex flex-wrap gap-1">
                  {zone.creatures.map(c => (
                    <span key={c} className="text-xs text-slate-400 bg-white/5 px-1.5 py-0.5 rounded">{c}</span>
                  ))}
                </div>
              </div>

              <button
                onClick={() => handleCapture(zone)}
                disabled={capturing === zone.name}
                className="w-full py-2.5 rounded-xl font-bold text-sm transition-all duration-200 disabled:opacity-50"
                style={{
                  background: capturing === zone.name
                    ? 'rgba(255,255,255,0.1)'
                    : `linear-gradient(135deg, ${zone.border}44, ${zone.border}22)`,
                  border: `1px solid ${zone.border}66`,
                  color: zone.border,
                  boxShadow: capturing !== zone.name ? `0 0 20px ${zone.border}22` : 'none'
                }}
              >
                {capturing === zone.name ? '🔄 Searching...' : '🎯 Explore & Capture'}
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
