import { TYPE_COLORS } from '../../store/gameStore';

// ─── Per-creature SVG renderers ──────────────────────────────────────────────
// Each returns a React fragment of SVG elements inside a 64×64 viewBox.
// Primary colour comes from type1; accent from type2 (or lighter shade).

const SPRITES = {

  // ── TIER 1 ─────────────────────────────────────────────────────────────────

  Emberpup: ({ p, a }) => (
    <g>
      {/* body */}
      <ellipse cx="32" cy="40" rx="16" ry="13" fill={p} opacity=".9"/>
      {/* head */}
      <circle cx="32" cy="24" r="13" fill={p}/>
      {/* flame ears */}
      <polygon points="20,16 14,4 24,12" fill={a || '#fbbf24'}/>
      <polygon points="44,16 50,4 40,12" fill={a || '#fbbf24'}/>
      {/* eyes */}
      <circle cx="27" cy="22" r="3" fill="#fff"/>
      <circle cx="37" cy="22" r="3" fill="#fff"/>
      <circle cx="28" cy="23" r="1.5" fill="#1a0a2e"/>
      <circle cx="38" cy="23" r="1.5" fill="#1a0a2e"/>
      {/* nose */}
      <ellipse cx="32" cy="28" rx="2" ry="1.5" fill="#1a0a2e"/>
      {/* tail flame */}
      <polygon points="46,46 54,36 50,50" fill={a || '#fbbf24'} opacity=".9"/>
      <polygon points="48,48 56,40 53,52" fill={p} opacity=".7"/>
      {/* paws */}
      <ellipse cx="22" cy="52" rx="5" ry="3" fill={p} opacity=".8"/>
      <ellipse cx="42" cy="52" rx="5" ry="3" fill={p} opacity=".8"/>
    </g>
  ),

  Aquafin: ({ p, a }) => (
    <g>
      {/* body */}
      <ellipse cx="32" cy="36" rx="14" ry="18" fill={p} opacity=".9"/>
      {/* dorsal fin */}
      <polygon points="32,12 24,26 40,26" fill={a || '#67e8f9'}/>
      {/* tail */}
      <polygon points="32,54 22,62 42,62" fill={a || '#67e8f9'}/>
      {/* eyes */}
      <circle cx="26" cy="32" r="4" fill="#fff"/>
      <circle cx="26" cy="32" r="2.5" fill="#1a0a2e"/>
      <circle cx="25" cy="31" r="0.8" fill="#fff" opacity=".7"/>
      {/* scales pattern */}
      <ellipse cx="32" cy="38" rx="8" ry="5" fill="none" stroke={a || '#67e8f9'} strokeWidth="1" opacity=".5"/>
      <ellipse cx="32" cy="46" rx="6" ry="4" fill="none" stroke={a || '#67e8f9'} strokeWidth="1" opacity=".4"/>
      {/* side fins */}
      <polygon points="18,36 10,28 18,44" fill={a || '#67e8f9'} opacity=".8"/>
    </g>
  ),

  Galesprout: ({ p, a }) => (
    <g>
      {/* stem */}
      <rect x="29" y="36" width="6" height="20" rx="3" fill="#84cc16" opacity=".8"/>
      {/* leaf body */}
      <ellipse cx="32" cy="28" rx="18" ry="20" fill={p} opacity=".9"/>
      {/* wind swirl */}
      <path d="M22,22 Q32,14 42,22 Q38,30 32,28 Q26,26 22,22Z" fill={a || '#a3e635'} opacity=".7"/>
      {/* eyes */}
      <circle cx="27" cy="26" r="3" fill="#fff"/>
      <circle cx="37" cy="26" r="3" fill="#fff"/>
      <circle cx="28" cy="27" r="1.5" fill="#1a0a2e"/>
      <circle cx="38" cy="27" r="1.5" fill="#1a0a2e"/>
      {/* small leaf ears */}
      <ellipse cx="16" cy="18" rx="6" ry="9" fill={p} opacity=".8" transform="rotate(-30 16 18)"/>
      <ellipse cx="48" cy="18" rx="6" ry="9" fill={p} opacity=".8" transform="rotate(30 48 18)"/>
      {/* smile */}
      <path d="M28,32 Q32,36 36,32" fill="none" stroke="#1a0a2e" strokeWidth="1.5" strokeLinecap="round"/>
    </g>
  ),

  Stoneback: ({ p, a }) => (
    <g>
      {/* shell */}
      <ellipse cx="32" cy="36" rx="22" ry="16" fill={p} opacity=".9"/>
      {/* shell plates */}
      <ellipse cx="32" cy="34" rx="15" ry="10" fill={a || '#a3a3a3'} opacity=".6"/>
      <line x1="32" y1="24" x2="32" y2="44" stroke={p} strokeWidth="1.5" opacity=".5"/>
      <line x1="22" y1="26" x2="42" y2="44" stroke={p} strokeWidth="1" opacity=".4"/>
      <line x1="42" y1="26" x2="22" y2="44" stroke={p} strokeWidth="1" opacity=".4"/>
      {/* head */}
      <circle cx="32" cy="20" r="10" fill={p}/>
      {/* eyes */}
      <circle cx="28" cy="18" r="2.5" fill="#fff"/>
      <circle cx="36" cy="18" r="2.5" fill="#fff"/>
      <circle cx="28.5" cy="18.5" r="1.2" fill="#1a0a2e"/>
      <circle cx="36.5" cy="18.5" r="1.2" fill="#1a0a2e"/>
      {/* legs */}
      <ellipse cx="14" cy="46" rx="5" ry="4" fill={p} opacity=".8"/>
      <ellipse cx="50" cy="46" rx="5" ry="4" fill={p} opacity=".8"/>
      <ellipse cx="18" cy="54" rx="5" ry="4" fill={p} opacity=".8"/>
      <ellipse cx="46" cy="54" rx="5" ry="4" fill={p} opacity=".8"/>
    </g>
  ),

  Voltkit: ({ p, a }) => (
    <g>
      {/* body */}
      <ellipse cx="32" cy="38" rx="14" ry="12" fill={p} opacity=".9"/>
      {/* lightning ear-tufts */}
      <polygon points="20,22 14,8 26,20" fill={p}/>
      <polygon points="44,22 50,8 38,20" fill={p}/>
      <polygon points="22,18 18,8 28,18" fill={a || '#fbbf24'}/>
      <polygon points="42,18 46,8 36,18" fill={a || '#fbbf24'}/>
      {/* head */}
      <circle cx="32" cy="26" r="13" fill={p}/>
      {/* cheek sparks */}
      <circle cx="22" cy="30" r="4" fill={a || '#fbbf24'} opacity=".6"/>
      <circle cx="42" cy="30" r="4" fill={a || '#fbbf24'} opacity=".6"/>
      {/* eyes */}
      <circle cx="27" cy="23" r="3" fill="#fff"/>
      <circle cx="37" cy="23" r="3" fill="#fff"/>
      <circle cx="27.5" cy="23.5" r="1.5" fill="#1a0a2e"/>
      <circle cx="37.5" cy="23.5" r="1.5" fill="#1a0a2e"/>
      {/* lightning bolt tail */}
      <polygon points="44,40 50,32 47,38 54,30 48,44 52,40" fill={a || '#fbbf24'}/>
      {/* paws */}
      <ellipse cx="22" cy="50" rx="5" ry="3" fill={p} opacity=".8"/>
      <ellipse cx="42" cy="50" rx="5" ry="3" fill={p} opacity=".8"/>
    </g>
  ),

  Frostling: ({ p, a }) => (
    <g>
      {/* ice body crystal */}
      <polygon points="32,8 44,24 40,44 24,44 20,24" fill={p} opacity=".8"/>
      {/* inner crystal */}
      <polygon points="32,16 40,26 37,38 27,38 24,26" fill={a || '#e0f7fa'} opacity=".5"/>
      {/* sparkle points */}
      <polygon points="32,4 34,12 40,8 34,14 38,20 32,16 26,20 30,14 24,8 30,12" fill="#fff" opacity=".8"/>
      {/* eyes */}
      <circle cx="28" cy="28" r="3" fill="#fff"/>
      <circle cx="36" cy="28" r="3" fill="#fff"/>
      <circle cx="28" cy="28" r="1.5" fill={p}/>
      <circle cx="36" cy="28" r="1.5" fill={p}/>
      {/* smile */}
      <path d="M28,34 Q32,38 36,34" fill="none" stroke="#fff" strokeWidth="1.2" strokeLinecap="round"/>
      {/* frost particles */}
      <circle cx="14" cy="20" r="2" fill={p} opacity=".5"/>
      <circle cx="50" cy="16" r="1.5" fill={p} opacity=".4"/>
      <circle cx="52" cy="36" r="2" fill={p} opacity=".5"/>
    </g>
  ),

  Shadowpup: ({ p, a }) => (
    <g>
      {/* shadow aura */}
      <ellipse cx="32" cy="48" rx="20" ry="8" fill={p} opacity=".3"/>
      {/* body */}
      <ellipse cx="32" cy="40" rx="15" ry="12" fill={p} opacity=".95"/>
      {/* tall pointy ears */}
      <polygon points="20,28 16,8 26,24" fill={p}/>
      <polygon points="44,28 48,8 38,24" fill={p}/>
      {/* head */}
      <circle cx="32" cy="26" r="13" fill={p}/>
      {/* glowing eyes */}
      <circle cx="27" cy="24" r="4" fill={a || '#a855f7'} opacity=".9"/>
      <circle cx="37" cy="24" r="4" fill={a || '#a855f7'} opacity=".9"/>
      <circle cx="27" cy="24" r="2" fill="#fff" opacity=".8"/>
      <circle cx="37" cy="24" r="2" fill="#fff" opacity=".8"/>
      {/* wispy tail */}
      <path d="M46,42 Q56,36 58,44 Q60,52 52,50" fill={p} opacity=".6"/>
      {/* paws */}
      <ellipse cx="22" cy="52" rx="5" ry="3" fill={p}/>
      <ellipse cx="42" cy="52" rx="5" ry="3" fill={p}/>
    </g>
  ),

  Glimlet: ({ p, a }) => (
    <g>
      {/* halo */}
      <ellipse cx="32" cy="12" rx="16" ry="4" fill="none" stroke={a || '#fbbf24'} strokeWidth="2.5" opacity=".8"/>
      {/* wings */}
      <ellipse cx="14" cy="30" rx="10" ry="16" fill={p} opacity=".4" transform="rotate(-20 14 30)"/>
      <ellipse cx="50" cy="30" rx="10" ry="16" fill={p} opacity=".4" transform="rotate(20 50 30)"/>
      {/* body */}
      <ellipse cx="32" cy="36" rx="12" ry="16" fill={p} opacity=".95"/>
      {/* eyes */}
      <circle cx="27" cy="32" r="3.5" fill="#fff"/>
      <circle cx="37" cy="32" r="3.5" fill="#fff"/>
      <circle cx="27.5" cy="32.5" r="2" fill="#1a0a2e"/>
      <circle cx="37.5" cy="32.5" r="2" fill="#1a0a2e"/>
      {/* star sparkles */}
      <polygon points="32,18 33,22 37,22 34,25 35,29 32,26 29,29 30,25 27,22 31,22" fill={a || '#fbbf24'} opacity=".9"/>
      <polygon points="16,14 17,17 20,17 18,19 18,22 16,20 14,22 14,19 12,17 15,17" fill={a || '#fbbf24'} opacity=".6"/>
      <polygon points="48,20 49,22 51,22 50,24 50,26 48,25 46,26 46,24 45,22 47,22" fill={a || '#fbbf24'} opacity=".6"/>
    </g>
  ),

  // ── TIER 2 ─────────────────────────────────────────────────────────────────

  Infernog: ({ p, a }) => (
    <g>
      {/* flame aura */}
      <ellipse cx="32" cy="50" rx="22" ry="8" fill={p} opacity=".2"/>
      {/* body */}
      <ellipse cx="32" cy="40" rx="18" ry="14" fill={p} opacity=".9"/>
      {/* flame mane */}
      <polygon points="32,14 22,28 26,20 18,30 24,22 16,34 24,28 20,38 28,30" fill={a || '#fbbf24'} opacity=".8"/>
      <polygon points="32,14 42,28 38,20 46,30 40,22 48,34 40,28 44,38 36,30" fill={a || '#fbbf24'} opacity=".8"/>
      {/* head */}
      <circle cx="32" cy="26" r="15" fill={p}/>
      {/* snout */}
      <ellipse cx="32" cy="34" rx="7" ry="5" fill={a || '#fbbf24'} opacity=".7"/>
      {/* eyes */}
      <circle cx="25" cy="23" r="4" fill="#fff"/>
      <circle cx="39" cy="23" r="4" fill="#fff"/>
      <circle cx="25.5" cy="23.5" r="2.5" fill="#1a0a2e"/>
      <circle cx="39.5" cy="23.5" r="2.5" fill="#1a0a2e"/>
      {/* nostrils */}
      <circle cx="30" cy="34" r="1.5" fill="#1a0a2e"/>
      <circle cx="34" cy="34" r="1.5" fill="#1a0a2e"/>
      {/* paws */}
      <ellipse cx="18" cy="54" rx="7" ry="4" fill={p}/>
      <ellipse cx="46" cy="54" rx="7" ry="4" fill={p}/>
    </g>
  ),

  Torrentail: ({ p, a }) => (
    <g>
      {/* tail fin — large, sweeping */}
      <polygon points="46,50 60,38 60,62" fill={a || '#67e8f9'} opacity=".8"/>
      {/* body serpentine */}
      <ellipse cx="30" cy="38" rx="16" ry="20" fill={p} opacity=".9"/>
      {/* dorsal spines */}
      <polygon points="30,16 24,26 36,26" fill={a || '#67e8f9'}/>
      <polygon points="36,20 32,28 40,28" fill={a || '#67e8f9'} opacity=".7"/>
      {/* head */}
      <circle cx="26" cy="24" r="12" fill={p}/>
      {/* eye */}
      <circle cx="22" cy="21" r="5" fill="#fff"/>
      <circle cx="22" cy="21" r="3" fill="#1a0a2e"/>
      <circle cx="21" cy="20" r="1" fill="#fff" opacity=".7"/>
      {/* scales */}
      <path d="M22,36 Q30,32 38,36 Q30,40 22,36Z" fill={a || '#67e8f9'} opacity=".4"/>
      <path d="M22,44 Q30,40 38,44 Q30,48 22,44Z" fill={a || '#67e8f9'} opacity=".4"/>
    </g>
  ),

  Cyclomane: ({ p, a }) => (
    <g>
      {/* wind spiral bg */}
      <path d="M32,32 Q48,16 48,32 Q48,48 32,48 Q16,48 16,32 Q16,16 32,16" fill="none" stroke={a || '#a3e635'} strokeWidth="2" opacity=".4"/>
      {/* mane wind streaks */}
      <path d="M14,20 Q22,16 28,22" fill="none" stroke={a || '#a3e635'} strokeWidth="3" strokeLinecap="round" opacity=".7"/>
      <path d="M10,28 Q18,24 26,28" fill="none" stroke={a || '#a3e635'} strokeWidth="2" strokeLinecap="round" opacity=".6"/>
      <path d="M50,20 Q42,16 36,22" fill="none" stroke={a || '#a3e635'} strokeWidth="3" strokeLinecap="round" opacity=".7"/>
      {/* body */}
      <ellipse cx="32" cy="38" rx="16" ry="13" fill={p} opacity=".9"/>
      {/* head */}
      <circle cx="32" cy="26" r="14" fill={p}/>
      {/* eyes */}
      <circle cx="26" cy="23" r="4" fill="#fff"/>
      <circle cx="38" cy="23" r="4" fill="#fff"/>
      <circle cx="27" cy="24" r="2.5" fill="#1a0a2e"/>
      <circle cx="39" cy="24" r="2.5" fill="#1a0a2e"/>
      {/* swirl mark on forehead */}
      <path d="M32,16 Q36,18 36,22 Q36,26 32,26 Q30,26 30,24" fill="none" stroke={a || '#a3e635'} strokeWidth="1.5" strokeLinecap="round"/>
    </g>
  ),

  Ramrock: ({ p, a }) => (
    <g>
      {/* boulder body */}
      <ellipse cx="32" cy="42" rx="22" ry="18" fill={p} opacity=".95"/>
      {/* crack details */}
      <path d="M24,34 L28,44 L24,52" fill="none" stroke={a || '#a3a3a3'} strokeWidth="1.5" opacity=".5"/>
      <path d="M38,30 L36,42 L40,50" fill="none" stroke={a || '#a3a3a3'} strokeWidth="1.5" opacity=".5"/>
      {/* head */}
      <circle cx="32" cy="24" r="14" fill={p}/>
      {/* horns */}
      <polygon points="20,16 10,2 22,14" fill={a || '#6b7280'}/>
      <polygon points="44,16 54,2 42,14" fill={a || '#6b7280'}/>
      {/* eyes */}
      <circle cx="26" cy="22" r="3.5" fill="#fff"/>
      <circle cx="38" cy="22" r="3.5" fill="#fff"/>
      <circle cx="26.5" cy="22.5" r="2" fill="#1a0a2e"/>
      <circle cx="38.5" cy="22.5" r="2" fill="#1a0a2e"/>
      {/* nose ring */}
      <path d="M29,30 Q32,34 35,30" fill="none" stroke={a || '#6b7280'} strokeWidth="2.5" strokeLinecap="round"/>
      {/* boulder texture dots */}
      <circle cx="22" cy="46" r="2" fill={a || '#6b7280'} opacity=".4"/>
      <circle cx="40" cy="50" r="2.5" fill={a || '#6b7280'} opacity=".4"/>
      <circle cx="34" cy="44" r="1.5" fill={a || '#6b7280'} opacity=".3"/>
    </g>
  ),

  // ── TIER 3 ─────────────────────────────────────────────────────────────────

  Blazehorn: ({ p, a }) => (
    <g>
      {/* lava glow */}
      <ellipse cx="32" cy="52" rx="26" ry="8" fill={p} opacity=".2"/>
      {/* bull body */}
      <ellipse cx="32" cy="42" rx="22" ry="16" fill={a || '#84cc16'} opacity=".9"/>
      {/* magma cracks on body */}
      <path d="M18,38 L24,44 L20,50" fill="none" stroke={p} strokeWidth="2" opacity=".7"/>
      <path d="M40,36 L36,44 L42,52" fill="none" stroke={p} strokeWidth="2" opacity=".7"/>
      {/* head */}
      <circle cx="32" cy="26" r="16" fill={a || '#84cc16'}/>
      {/* magma horns */}
      <polygon points="18,18 8,2 20,16" fill={p}/>
      <polygon points="46,18 56,2 44,16" fill={p}/>
      <polygon points="20,16 10,4 22,14" fill={a || '#fbbf24'} opacity=".6"/>
      {/* eyes — glowing orange */}
      <circle cx="25" cy="24" r="5" fill={p} opacity=".9"/>
      <circle cx="39" cy="24" r="5" fill={p} opacity=".9"/>
      <circle cx="25" cy="24" r="2.5" fill="#fff"/>
      <circle cx="39" cy="24" r="2.5" fill="#fff"/>
      {/* snout */}
      <ellipse cx="32" cy="34" rx="8" ry="5" fill={a || '#84cc16'} opacity=".8"/>
      <circle cx="29" cy="34" r="2" fill="#1a0a2e"/>
      <circle cx="35" cy="34" r="2" fill="#1a0a2e"/>
    </g>
  ),

  Cinderfox: ({ p, a }) => (
    <g>
      {/* ember trail */}
      <circle cx="54" cy="28" r="2" fill={p} opacity=".5"/>
      <circle cx="58" cy="20" r="1.5" fill={a || '#10b981'} opacity=".4"/>
      <circle cx="56" cy="14" r="1" fill={p} opacity=".3"/>
      {/* wind tail */}
      <path d="M44,44 Q56,36 60,24 Q58,40 52,48" fill={a || '#10b981'} opacity=".5"/>
      {/* body */}
      <ellipse cx="30" cy="42" rx="16" ry="12" fill={p} opacity=".9"/>
      {/* chest tuft */}
      <ellipse cx="30" cy="36" rx="8" ry="6" fill={a || '#10b981'} opacity=".5"/>
      {/* head */}
      <circle cx="28" cy="26" r="14" fill={p}/>
      {/* pointed ears */}
      <polygon points="18,20 12,6 22,18" fill={p}/>
      <polygon points="38,20 42,6 34,18" fill={p}/>
      <polygon points="20,18 16,8 24,16" fill={a || '#10b981'} opacity=".6"/>
      {/* eyes */}
      <circle cx="23" cy="24" r="4" fill="#fff"/>
      <circle cx="33" cy="24" r="4" fill="#fff"/>
      <circle cx="23.5" cy="24.5" r="2.5" fill="#1a0a2e"/>
      <circle cx="33.5" cy="24.5" r="2.5" fill="#1a0a2e"/>
      {/* snout */}
      <ellipse cx="28" cy="33" rx="5" ry="3.5" fill={a || '#10b981'} opacity=".6"/>
      <ellipse cx="28" cy="31" rx="2.5" ry="1.5" fill="#1a0a2e"/>
    </g>
  ),

  Tidalwyrm: ({ p, a }) => (
    <g>
      {/* coral armour plates */}
      <ellipse cx="32" cy="44" rx="20" ry="14" fill={a || '#84cc16'} opacity=".7"/>
      {/* body */}
      <ellipse cx="32" cy="40" rx="16" ry="18" fill={p} opacity=".9"/>
      {/* scale ridges */}
      <path d="M18,30 Q32,26 46,30" fill="none" stroke={a || '#84cc16'} strokeWidth="2" opacity=".6"/>
      <path d="M16,38 Q32,34 48,38" fill="none" stroke={a || '#84cc16'} strokeWidth="2" opacity=".6"/>
      <path d="M18,46 Q32,42 46,46" fill="none" stroke={a || '#84cc16'} strokeWidth="2" opacity=".5"/>
      {/* head */}
      <ellipse cx="32" cy="20" rx="14" ry="12" fill={p}/>
      {/* crest */}
      <path d="M22,14 Q32,6 42,14 Q36,12 32,10 Q28,12 22,14Z" fill={a || '#84cc16'} opacity=".7"/>
      {/* eyes */}
      <circle cx="26" cy="19" r="4" fill="#fff"/>
      <circle cx="38" cy="19" r="4" fill="#fff"/>
      <circle cx="26.5" cy="19.5" r="2.5" fill="#1a0a2e"/>
      <circle cx="38.5" cy="19.5" r="2.5" fill="#1a0a2e"/>
    </g>
  ),

  Mistshade: ({ p, a }) => (
    <g>
      {/* mist aura */}
      <ellipse cx="32" cy="40" rx="28" ry="20" fill={p} opacity=".15"/>
      <ellipse cx="32" cy="36" rx="22" ry="16" fill={p} opacity=".2"/>
      {/* ghost body */}
      <path d="M18,24 Q18,50 22,58 Q26,62 32,58 Q38,62 42,58 Q46,50 46,24 Q40,14 32,14 Q24,14 18,24Z" fill={p} opacity=".7"/>
      {/* wind streaks */}
      <path d="M10,30 Q18,26 24,32" fill="none" stroke={a || '#10b981'} strokeWidth="2" strokeLinecap="round" opacity=".6"/>
      <path d="M54,28 Q46,24 40,30" fill="none" stroke={a || '#10b981'} strokeWidth="2" strokeLinecap="round" opacity=".6"/>
      {/* eyes */}
      <ellipse cx="26" cy="30" rx="4" ry="5" fill={a || '#10b981'} opacity=".9"/>
      <ellipse cx="38" cy="30" rx="4" ry="5" fill={a || '#10b981'} opacity=".9"/>
      <ellipse cx="26" cy="30" rx="2" ry="2.5" fill="#fff" opacity=".8"/>
      <ellipse cx="38" cy="30" rx="2" ry="2.5" fill="#fff" opacity=".8"/>
    </g>
  ),

  Zephyrax: ({ p, a }) => (
    <g>
      {/* lightning wings */}
      <path d="M14,30 L4,14 L16,26 L10,8 L22,24 L18,10 L28,28" fill="none" stroke={a || '#eab308'} strokeWidth="2.5" strokeLinejoin="round" opacity=".8"/>
      <path d="M50,30 L60,14 L48,26 L54,8 L42,24 L46,10 L36,28" fill="none" stroke={a || '#eab308'} strokeWidth="2.5" strokeLinejoin="round" opacity=".8"/>
      {/* body */}
      <ellipse cx="32" cy="40" rx="12" ry="16" fill={p} opacity=".9"/>
      {/* head */}
      <circle cx="32" cy="24" r="12" fill={p}/>
      {/* raptor beak */}
      <polygon points="32,30 26,34 32,36 38,34" fill={a || '#eab308'} opacity=".8"/>
      {/* eyes */}
      <circle cx="26" cy="22" r="4" fill="#fff"/>
      <circle cx="38" cy="22" r="4" fill="#fff"/>
      <circle cx="26.5" cy="22.5" r="2.5" fill="#1a0a2e"/>
      <circle cx="38.5" cy="22.5" r="2.5" fill="#1a0a2e"/>
      {/* crest feathers */}
      <polygon points="28,14 24,6 30,12" fill={a || '#eab308'} opacity=".7"/>
      <polygon points="32,12 32,4 34,12" fill={a || '#eab308'}/>
      <polygon points="36,14 40,6 34,12" fill={a || '#eab308'} opacity=".7"/>
    </g>
  ),

  Poisonmaw: ({ p, a }) => (
    <g>
      {/* toxic spore cloud */}
      <circle cx="18" cy="18" r="8" fill={a || '#22c55e'} opacity=".3"/>
      <circle cx="46" cy="14" r="6" fill={p} opacity=".3"/>
      <circle cx="52" cy="28" r="5" fill={a || '#22c55e'} opacity=".2"/>
      {/* plant body */}
      <ellipse cx="32" cy="44" rx="14" ry="12" fill={a || '#22c55e'} opacity=".8"/>
      {/* vines */}
      <path d="M18,44 Q14,36 18,28 Q22,20 20,14" fill="none" stroke={a || '#22c55e'} strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M46,44 Q50,36 46,28 Q42,20 44,14" fill="none" stroke={a || '#22c55e'} strokeWidth="2.5" strokeLinecap="round"/>
      {/* maw head */}
      <circle cx="32" cy="28" r="14" fill={p} opacity=".95"/>
      {/* teeth */}
      <path d="M22,30 L24,36 L26,30 L28,36 L30,30 L32,36 L34,30 L36,36 L38,30 L40,36 L42,30" fill="none" stroke="#fff" strokeWidth="1.5" opacity=".8"/>
      {/* eyes */}
      <circle cx="26" cy="24" r="3.5" fill={a || '#22c55e'} opacity=".9"/>
      <circle cx="38" cy="24" r="3.5" fill={a || '#22c55e'} opacity=".9"/>
      <circle cx="26" cy="24" r="1.5" fill="#1a0a2e"/>
      <circle cx="38" cy="24" r="1.5" fill="#1a0a2e"/>
    </g>
  ),

  Psyclaw: ({ p, a }) => (
    <g>
      {/* psychic aura rings */}
      <ellipse cx="32" cy="32" rx="28" ry="28" fill="none" stroke={p} strokeWidth="1" opacity=".2"/>
      <ellipse cx="32" cy="32" rx="22" ry="22" fill="none" stroke={a || '#8b5cf6'} strokeWidth="1" opacity=".3"/>
      {/* body */}
      <ellipse cx="32" cy="40" rx="14" ry="12" fill={a || '#8b5cf6'} opacity=".8"/>
      {/* shadow claws */}
      <path d="M14,46 L8,38 M14,46 L10,44 M14,46 L12,50" stroke={a || '#8b5cf6'} strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M50,46 L56,38 M50,46 L54,44 M50,46 L52,50" stroke={a || '#8b5cf6'} strokeWidth="2.5" strokeLinecap="round"/>
      {/* head */}
      <circle cx="32" cy="26" r="14" fill={a || '#8b5cf6'} opacity=".9"/>
      {/* third eye */}
      <ellipse cx="32" cy="20" rx="4" ry="5" fill={p} opacity=".9"/>
      <ellipse cx="32" cy="20" rx="2" ry="2.5" fill="#fff" opacity=".8"/>
      {/* eyes */}
      <circle cx="26" cy="26" r="3.5" fill={p} opacity=".9"/>
      <circle cx="38" cy="26" r="3.5" fill={p} opacity=".9"/>
      <circle cx="26" cy="26" r="1.5" fill="#fff" opacity=".8"/>
      <circle cx="38" cy="26" r="1.5" fill="#fff" opacity=".8"/>
    </g>
  ),

  Ironfang: ({ p, a }) => (
    <g>
      {/* metal plating body */}
      <ellipse cx="32" cy="42" rx="22" ry="16" fill={a || '#84cc16'} opacity=".7"/>
      {/* armour segments */}
      <path d="M12,36 Q32,30 52,36" fill="none" stroke={p} strokeWidth="3" opacity=".6"/>
      <path d="M14,44 Q32,38 50,44" fill="none" stroke={p} strokeWidth="3" opacity=".6"/>
      <path d="M16,52 Q32,46 48,52" fill="none" stroke={p} strokeWidth="3" opacity=".5"/>
      {/* head */}
      <circle cx="32" cy="24" r="14" fill={p} opacity=".95"/>
      {/* drill fang */}
      <polygon points="28,34 36,34 32,46" fill={a || '#84cc16'} opacity=".8"/>
      <polygon points="30,34 34,34 32,42" fill="#d1d5db" opacity=".9"/>
      {/* eyes */}
      <circle cx="25" cy="22" r="4" fill="#fff"/>
      <circle cx="39" cy="22" r="4" fill="#fff"/>
      <circle cx="25.5" cy="22.5" r="2.5" fill="#1a0a2e"/>
      <circle cx="39.5" cy="22.5" r="2.5" fill="#1a0a2e"/>
      {/* bolts on head */}
      <circle cx="18" cy="18" r="2" fill={a || '#84cc16'} opacity=".7"/>
      <circle cx="46" cy="18" r="2" fill={a || '#84cc16'} opacity=".7"/>
    </g>
  ),

  // ── TIER 4 — LEGENDARY ─────────────────────────────────────────────────────

  'Infernus Rex': ({ p, a }) => (
    <g>
      {/* corona */}
      {[0,45,90,135,180,225,270,315].map(angle => (
        <line key={angle}
          x1={32 + 24*Math.cos(angle*Math.PI/180)} y1={32 + 24*Math.sin(angle*Math.PI/180)}
          x2={32 + 30*Math.cos(angle*Math.PI/180)} y2={32 + 30*Math.sin(angle*Math.PI/180)}
          stroke={p} strokeWidth="2.5" opacity=".5"/>
      ))}
      {/* lava body */}
      <ellipse cx="32" cy="40" rx="20" ry="16" fill={a || '#84cc16'} opacity=".9"/>
      {/* magma veins */}
      <path d="M16,36 L22,42 L18,50" fill="none" stroke={p} strokeWidth="2.5" opacity=".8"/>
      <path d="M48,36 L42,42 L46,50" fill="none" stroke={p} strokeWidth="2.5" opacity=".8"/>
      <path d="M26,40 L32,36 L38,40" fill="none" stroke={p} strokeWidth="2" opacity=".7"/>
      {/* head */}
      <circle cx="32" cy="22" r="16" fill={a || '#84cc16'}/>
      {/* crown horns */}
      <polygon points="20,14 10,-2 22,12" fill={p}/>
      <polygon points="32,10 32,-4 34,10" fill={p}/>
      <polygon points="44,14 54,-2 42,12" fill={p}/>
      {/* eyes */}
      <circle cx="25" cy="20" r="5" fill={p} opacity=".9"/>
      <circle cx="39" cy="20" r="5" fill={p} opacity=".9"/>
      <circle cx="25" cy="20" r="2.5" fill="#fff"/>
      <circle cx="39" cy="20" r="2.5" fill="#fff"/>
    </g>
  ),

  Abyssalord: ({ p, a }) => (
    <g>
      {/* deep water aura */}
      <ellipse cx="32" cy="48" rx="26" ry="10" fill={p} opacity=".2"/>
      {/* coral armour */}
      <ellipse cx="32" cy="44" rx="22" ry="16" fill={a || '#84cc16'} opacity=".8"/>
      {/* tentacle hints */}
      <path d="M8,48 Q14,40 16,48 Q18,56 14,58" fill="none" stroke={p} strokeWidth="3" strokeLinecap="round" opacity=".7"/>
      <path d="M56,48 Q50,40 48,48 Q46,56 50,58" fill="none" stroke={p} strokeWidth="3" strokeLinecap="round" opacity=".7"/>
      {/* body */}
      <ellipse cx="32" cy="36" rx="18" ry="18" fill={p} opacity=".9"/>
      {/* head */}
      <circle cx="32" cy="22" r="16" fill={p}/>
      {/* crown fins */}
      <polygon points="22,12 14,0 24,10" fill={a || '#84cc16'} opacity=".8"/>
      <polygon points="32,8 32,-2 34,8" fill={a || '#84cc16'}/>
      <polygon points="42,12 50,0 40,10" fill={a || '#84cc16'} opacity=".8"/>
      {/* eyes */}
      <circle cx="24" cy="21" r="5.5" fill="#fff"/>
      <circle cx="40" cy="21" r="5.5" fill="#fff"/>
      <circle cx="24.5" cy="21.5" r="3.5" fill="#1a0a2e"/>
      <circle cx="40.5" cy="21.5" r="3.5" fill="#1a0a2e"/>
      <circle cx="23.5" cy="20.5" r="1" fill="#fff" opacity=".7"/>
    </g>
  ),

  Stormbinder: ({ p, a }) => (
    <g>
      {/* storm halo */}
      <ellipse cx="32" cy="18" rx="24" ry="8" fill="none" stroke={a || '#eab308'} strokeWidth="2" opacity=".5"/>
      {/* lightning body wings */}
      <path d="M8,32 L2,14 L12,28 L6,10 L18,26 L14,8 L26,28" fill="none" stroke={a || '#eab308'} strokeWidth="3" strokeLinejoin="round"/>
      <path d="M56,32 L62,14 L52,28 L58,10 L46,26 L50,8 L38,28" fill="none" stroke={a || '#eab308'} strokeWidth="3" strokeLinejoin="round"/>
      {/* body */}
      <ellipse cx="32" cy="42" rx="16" ry="14" fill={p} opacity=".9"/>
      {/* head */}
      <circle cx="32" cy="26" r="14" fill={p}/>
      {/* storm eye */}
      <circle cx="32" cy="22" r="7" fill={a || '#eab308'} opacity=".9"/>
      <circle cx="32" cy="22" r="4" fill="#fff" opacity=".9"/>
      <circle cx="32" cy="22" r="2" fill="#1a0a2e"/>
      {/* regular eyes */}
      <circle cx="24" cy="28" r="3" fill="#fff"/>
      <circle cx="40" cy="28" r="3" fill="#fff"/>
      <circle cx="24.5" cy="28.5" r="1.5" fill="#1a0a2e"/>
      <circle cx="40.5" cy="28.5" r="1.5" fill="#1a0a2e"/>
    </g>
  ),

  Voidmind: ({ p, a }) => (
    <g>
      {/* void rings */}
      <ellipse cx="32" cy="32" rx="30" ry="30" fill="none" stroke={a || '#8b5cf6'} strokeWidth="1" opacity=".15"/>
      <ellipse cx="32" cy="32" rx="24" ry="24" fill="none" stroke={p} strokeWidth="1" opacity=".25"/>
      <ellipse cx="32" cy="32" rx="18" ry="18" fill="none" stroke={a || '#8b5cf6'} strokeWidth="1.5" opacity=".35"/>
      {/* void body */}
      <ellipse cx="32" cy="36" rx="18" ry="20" fill={a || '#8b5cf6'} opacity=".85"/>
      {/* head */}
      <circle cx="32" cy="22" r="15" fill={p} opacity=".95"/>
      {/* mind rifts */}
      <path d="M22,16 L26,22 L22,28" fill="none" stroke={a || '#8b5cf6'} strokeWidth="1.5" opacity=".6"/>
      <path d="M42,16 L38,22 L42,28" fill="none" stroke={a || '#8b5cf6'} strokeWidth="1.5" opacity=".6"/>
      {/* central void eye */}
      <ellipse cx="32" cy="20" rx="6" ry="7" fill="#000" opacity=".9"/>
      <ellipse cx="32" cy="20" rx="3" ry="3.5" fill={p} opacity=".9"/>
      {/* side eyes */}
      <circle cx="24" cy="26" r="3.5" fill={a || '#8b5cf6'} opacity=".9"/>
      <circle cx="40" cy="26" r="3.5" fill={a || '#8b5cf6'} opacity=".9"/>
      <circle cx="24" cy="26" r="1.5" fill="#fff" opacity=".7"/>
      <circle cx="40" cy="26" r="1.5" fill="#fff" opacity=".7"/>
    </g>
  ),

  // ── TIER 5 — APEX ──────────────────────────────────────────────────────────

  Primordius: ({ p, a }) => (
    <g>
      {/* radiant corona — all elements */}
      {[0,30,60,90,120,150,180,210,240,270,300,330].map((angle, i) => {
        const colors = ['#ef4444','#3b82f6','#10b981','#eab308','#8b5cf6','#fbbf24',
                        '#0d9488','#ec4899','#84cc16','#67e8f9','#a855f7','#f97316'];
        return (
          <line key={angle}
            x1={32 + 20*Math.cos(angle*Math.PI/180)} y1={32 + 20*Math.sin(angle*Math.PI/180)}
            x2={32 + 30*Math.cos(angle*Math.PI/180)} y2={32 + 30*Math.sin(angle*Math.PI/180)}
            stroke={colors[i]} strokeWidth="2.5" opacity=".8"/>
        );
      })}
      {/* outer glow ring */}
      <circle cx="32" cy="32" r="20" fill="none" stroke="#fbbf24" strokeWidth="1.5" opacity=".4"/>
      {/* primordial body */}
      <circle cx="32" cy="32" r="16" fill="#fbbf24" opacity=".15"/>
      <circle cx="32" cy="32" r="13" fill={p} opacity=".9"/>
      {/* inner elemental swirl */}
      <path d="M22,26 Q32,18 42,26 Q40,34 32,36 Q24,34 22,26Z" fill="#fff" opacity=".2"/>
      {/* central eye of creation */}
      <circle cx="32" cy="32" r="6" fill="#fff" opacity=".95"/>
      <circle cx="32" cy="32" r="4" fill="#fbbf24"/>
      <circle cx="32" cy="32" r="2" fill="#1a0a2e"/>
      <circle cx="31" cy="31" r="0.7" fill="#fff" opacity=".9"/>
    </g>
  ),
};

// Fallback for any creature not in the map
const FallbackSprite = ({ p, a, name }) => {
  const initial = (name || '?')[0].toUpperCase();
  return (
    <g>
      <circle cx="32" cy="32" r="28" fill={p} opacity=".8"/>
      <circle cx="32" cy="32" r="20" fill={a || p} opacity=".4"/>
      <text x="32" y="38" textAnchor="middle" fontSize="20" fontWeight="bold" fill="#fff" opacity=".9">{initial}</text>
    </g>
  );
};

// ─── Animation variants ───────────────────────────────────────────────────────
const IDLE_ANIM = `
  @keyframes sprite-float  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
  @keyframes sprite-pulse  { 0%,100%{opacity:1} 50%{opacity:.85} }
  @keyframes sprite-shake  { 0%,100%{transform:rotate(0)} 25%{transform:rotate(-5deg)} 75%{transform:rotate(5deg)} }
  @keyframes sprite-faint  { 0%{opacity:1;transform:translateY(0)} 100%{opacity:0;transform:translateY(20px)} }
  @keyframes sprite-attack { 0%,100%{transform:translateX(0)} 30%{transform:translateX(8px)} 60%{transform:translateX(-4px)} }
  @keyframes sprite-heal   { 0%,100%{filter:brightness(1)} 50%{filter:brightness(1.6) saturate(1.4)} }
`;

export default function CreatureSprite({
  name,
  type1,
  type2,
  tier = 1,
  size = 64,
  animation = 'idle', // idle | attack | faint | heal | none
  fainted = false,
  className = '',
}) {
  const SpriteComponent = SPRITES[name] || FallbackSprite;
  const p = TYPE_COLORS[type1] || '#7c3aed';
  const a = type2 ? TYPE_COLORS[type2] : null;

  const animMap = {
    idle:   `sprite-float ${2.5 + (tier * 0.3)}s ease-in-out infinite`,
    attack: 'sprite-attack 0.4s ease-in-out',
    faint:  'sprite-faint 0.8s ease-out forwards',
    heal:   'sprite-heal 1.2s ease-in-out 3',
    none:   'none',
  };

  const glowColor = tier >= 4 ? '#fbbf24' : tier >= 3 ? p : 'transparent';
  const glowSize  = tier >= 4 ? '0 0 20px' : tier >= 3 ? '0 0 12px' : 'none';

  return (
    <>
      <style>{IDLE_ANIM}</style>
      <div
        className={className}
        style={{
          width: size,
          height: size,
          display: 'inline-block',
          flexShrink: 0,
          animation: fainted ? 'sprite-faint 0.8s ease-out forwards' : animMap[animation],
          filter: fainted ? 'grayscale(1) brightness(0.5)' : 'none',
          willChange: 'transform',
        }}
      >
        <svg
          viewBox="0 0 64 64"
          width={size}
          height={size}
          style={{
            filter: tier >= 3 && !fainted ? `drop-shadow(${glowSize} ${glowColor}88)` : 'none',
            overflow: 'visible',
          }}
        >
          <SpriteComponent p={p} a={a} name={name} />
        </svg>
      </div>
    </>
  );
}
