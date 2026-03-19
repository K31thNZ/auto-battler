import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useGameStore } from '../store/gameStore';

const FEATURES = [
  { icon: '🎯', title: 'Capture', desc: 'Hunt 25 unique creatures across 5 elemental zones' },
  { icon: '⚔️', title: 'Battle',  desc: 'Auto-battle system with type matchups and synergies' },
  { icon: '🔬', title: 'Fuse',    desc: 'Merge tier-3 creatures into legendary forms' },
  { icon: '💎', title: 'Trade',   desc: 'Buy and sell creatures in the open marketplace' },
];

const FLOATING_CREATURES = ['🔥','💧','⚡','🌿','❄️','👾','✨','🌀','🔮','⛈️','🌋','🌟'];

export default function Landing() {
  const [isConnecting, setIsConnecting] = useState(false);
  const { connectWallet } = useGameStore();
  const navigate = useNavigate();
  const canvasRef = useRef(null);

  // Particle canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = Array.from({ length: 80 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 2 + 0.5,
      dx: (Math.random() - 0.5) * 0.4,
      dy: (Math.random() - 0.5) * 0.4,
      alpha: Math.random() * 0.5 + 0.2,
      color: ['#7c3aed','#0d9488','#fbbf24','#ec4899'][Math.floor(Math.random() * 4)]
    }));

    let animId;
    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) {
        p.x += p.dx; p.y += p.dy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color + Math.round(p.alpha * 255).toString(16).padStart(2,'0');
        ctx.fill();
      }
      animId = requestAnimationFrame(draw);
    }
    draw();

    const handleResize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    window.addEventListener('resize', handleResize);
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', handleResize); };
  }, []);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      await connectWallet();
      navigate('/wilderness');
    } catch (e) {
      console.error(e);
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
      <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" />

      {/* Floating emoji creatures */}
      {FLOATING_CREATURES.map((emoji, i) => (
        <motion.div
          key={i}
          className="fixed text-2xl sm:text-4xl pointer-events-none select-none opacity-20"
          style={{
            left: `${5 + (i * 8.5) % 90}%`,
            top: `${10 + (i * 7.3) % 80}%`,
          }}
          animate={{ y: [0, -20, 0], rotate: [-5, 5, -5] }}
          transition={{ duration: 3 + i * 0.5, repeat: Infinity, delay: i * 0.3 }}
        >
          {emoji}
        </motion.div>
      ))}

      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        {/* Logo */}
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <h1 className="font-display text-5xl sm:text-7xl md:text-8xl font-black mb-2"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #0d9488, #fbbf24)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            PRIMAL SHARDS
          </h1>
          <p className="text-slate-400 text-lg sm:text-xl mb-2 font-light tracking-widest uppercase">
            Creature Collector · Auto-Battler · RPG
          </p>
          <div className="w-32 h-px mx-auto mb-8" style={{ background: 'linear-gradient(90deg, transparent, #7c3aed, transparent)' }} />
        </motion.div>

        {/* Tagline */}
        <motion.p
          className="text-slate-300 text-base sm:text-lg mb-10 max-w-xl mx-auto leading-relaxed"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          Capture legendary creatures across five elemental realms.
          Forge your ultimate team and conquer the arena.
        </motion.p>

        {/* Connect button */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          <button
            onClick={handleConnect}
            disabled={isConnecting}
            className="relative group px-10 py-4 rounded-xl font-bold text-lg transition-all duration-300 disabled:opacity-50"
            style={{
              background: 'linear-gradient(135deg, #7c3aed, #0d9488)',
              boxShadow: '0 0 40px rgba(124,58,237,0.5)'
            }}
          >
            <span className="relative z-10">
              {isConnecting ? '🔄 Connecting...' : '⚡ Connect Wallet & Play'}
            </span>
            <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{ background: 'linear-gradient(135deg, #6d28d9, #0f766e)', boxShadow: '0 0 60px rgba(124,58,237,0.7)' }} />
          </button>
          <p className="text-slate-600 text-xs mt-3">No real wallet needed — we generate one for you</p>
        </motion.div>

        {/* Features */}
        <motion.div
          className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-16"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.6 }}
        >
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              className="glass rounded-xl p-4 text-center"
              whileHover={{ scale: 1.05, y: -4 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <div className="text-3xl mb-2">{f.icon}</div>
              <h3 className="font-bold text-sm text-purple-300 mb-1">{f.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Lore */}
        <motion.p
          className="text-slate-600 text-xs mt-12 max-w-md mx-auto italic"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
        >
          "In the age before memory, the Primordius shattered itself into a thousand fragments —
          each becoming a creature of elemental power. Now, trainers scour the realms to reassemble
          what was lost."
        </motion.p>
      </div>
    </div>
  );
}
