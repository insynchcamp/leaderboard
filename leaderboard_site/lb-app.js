// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════
const ADMIN_EMAIL = 'insynch.camp@gmail.com';

const LEVELS = [
  { key:'none',    label:'Unranked', min:0,  color:'#8a93a8' },
  { key:'bronze',  label:'Bronze',   min:3,  color:'#c97f4a' },
  { key:'silver',  label:'Silver',   min:5,  color:'#b8c4d4' },
  { key:'gold',    label:'Gold',     min:10, color:'#ffc857' },
  { key:'diamond', label:'Diamond',  min:15, color:'#7dd8ff' },
];

const REWARDS = [
  { level:'bronze',  badges:3,  medal:'🥉', prize:'In Synch 2026 Tote Bag' },
  { level:'silver',  badges:5,  medal:'🥈', prize:'In Synch 2026 T-Shirt' },
  { level:'gold',    badges:10, medal:'🥇', prize:'Exclusive In Synch Hoodie' },
  { level:'diamond', badges:15, medal:'💎', prize:'Summer Champion Silver Swim Cap' },
];

// Avatar options
const SKIN_TONES = ['#ffe0c2','#ffcc99','#f0c8a0','#e0ac7a','#c68642','#a86b3f','#8d5524','#6b4226','#5c3a21'];
const HAIR_COLORS = ['#0c0c0c','#2b1b12','#3d2314','#5a3825','#7a4a23','#8a5a2e','#a9742c','#c9a13b','#e0c499','#d6453d','#8b3a1f','#9b4fc9','#5a5a5a','#888888','#e8e8e8'];
const ACCESSORIES = [
  {id:'none', emoji:'🚫'},
  {id:'goggles', emoji:'🥽'},
  {id:'cap', emoji:'🧢'},
  {id:'headband', emoji:'🎀'},
  {id:'glasses', emoji:'👓'},
  {id:'earrings', emoji:'💎'},
];
const EXPRESSIONS = [
  {id:'happy', emoji:'😊'},
  {id:'excited', emoji:'😄'},
  {id:'cool', emoji:'😎'},
  {id:'wink', emoji:'😉'},
  {id:'star-eyes', emoji:'🤩'},
  {id:'laugh', emoji:'😆'},
];

// Realistic Bitmoji-style hairstyles
const HAIR_STYLES = [
  {id:'short-crop',     emoji:'💇‍♂️', label:'Short Crop'},
  {id:'short-side-part',emoji:'👨', label:'Side Part'},
  {id:'quiff',          emoji:'🧑', label:'Quiff'},
  {id:'buzz',           emoji:'👦', label:'Buzz Cut'},
  {id:'curly-top',      emoji:'🦱', label:'Curly Crop'},
  {id:'afro',           emoji:'🧑‍🦱', label:'Afro'},
  {id:'long-straight',  emoji:'👩', label:'Long Straight'},
  {id:'long-wavy',      emoji:'👩‍🦰', label:'Long Wavy'},
  {id:'shoulder-bob',   emoji:'💁', label:'Bob'},
  {id:'high-bun',       emoji:'🩰', label:'High Bun'},
  {id:'ponytail',       emoji:'🎀', label:'Ponytail'},
  {id:'pigtails',       emoji:'👧', label:'Pigtails'},
  {id:'braids',         emoji:'👸', label:'Braids'},
  {id:'curtain-fringe', emoji:'🧑‍🎤', label:'Curtain Fringe'},
  {id:'slicked-back',   emoji:'🤵', label:'Slicked Back'},
];

const DEFAULT_AVATAR = {
  skin: SKIN_TONES[2],
  hairColor: HAIR_COLORS[1],
  hairStyle: 'short-crop',
  logoChoice: 'insynch',  // 'insynch' or 'club'
  accessory: 'none',
  expression: 'happy',
};

// ═══════════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════════
let CU = null, isAdmin = false;
let athletes = {}; // uid -> {name, club, email, role, avatar}
let badges = {}; // uid -> count
let unsubAthletes = null, unsubBadges = null;
let curAvatarDraft = {...DEFAULT_AVATAR};
let curAdminTab = 'manual';
let csvParsedData = null;

function dbRef(p){return window._fbFns.ref(window._db,p);}
function dbSet(p,v){return window._fbFns.set(dbRef(p),v);}
function dbUpd(p,v){return window._fbFns.update(dbRef(p),v);}
function dbGet(p){return window._fbFns.get(dbRef(p));}
function dbOn(p,cb){return window._fbFns.onValue(dbRef(p),s=>cb(s.val()));}
function esc(s){return(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function showErr(el,m){el.textContent=m;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),5000);}
function authErr(c){const m={'auth/invalid-email':'Invalid email.','auth/user-not-found':'No account found.','auth/wrong-password':'Incorrect password.','auth/email-already-in-use':'Email already in use.','auth/weak-password':'Password must be 6+ characters.','auth/invalid-credential':'Incorrect email or password.','auth/too-many-requests':'Too many attempts. Try later.'};return m[c]||'Error. Please try again.';}

// ═══════════════════════════════════════════════════════════════
// LEVEL HELPERS
// ═══════════════════════════════════════════════════════════════
function getLevel(badgeCount){
  let lvl = LEVELS[0];
  for(const l of LEVELS){ if(badgeCount >= l.min) lvl = l; }
  return lvl;
}
function getNextLevel(badgeCount){
  for(const l of LEVELS){ if(badgeCount < l.min) return l; }
  return null; // maxed out
}

// ═══════════════════════════════════════════════════════════════
// AVATAR SVG RENDERER
// ═══════════════════════════════════════════════════════════════
function renderAvatarSVG(av){
  av = av || DEFAULT_AVATAR;
  const skin = av.skin || DEFAULT_AVATAR.skin;
  const hairColor = av.hairColor || DEFAULT_AVATAR.hairColor;
  const hairStyle = av.hairStyle || DEFAULT_AVATAR.hairStyle;
  const logoChoice = av.logoChoice || DEFAULT_AVATAR.logoChoice;
  const accessory = av.accessory || DEFAULT_AVATAR.accessory;
  const expression = av.expression || DEFAULT_AVATAR.expression;
  const clubName = av._clubName || '';
  const clubLogoUrl = av._clubLogoUrl || null;

  // Shade helper for shadows/highlights on skin & hair
  function shade(hex, pct){
    const n = parseInt(hex.replace('#',''),16);
    let r=(n>>16)+pct, g=(n>>8&0xff)+pct, b=(n&0xff)+pct;
    r=Math.max(0,Math.min(255,r));g=Math.max(0,Math.min(255,g));b=Math.max(0,Math.min(255,b));
    return '#'+(r<<16|g<<8|b).toString(16).padStart(6,'0');
  }
  const skinShadow = shade(skin, -28);
  const hairShadow = shade(hairColor, -30);
  const hairHi = shade(hairColor, 22);

  // ── FACE / EXPRESSION (realistic Bitmoji style: simple shapes, warm) ──
  let face = '';
  if(expression === 'happy'){
    face = `<ellipse cx="80" cy="98" rx="3.5" ry="4.5" fill="#26201c"/><ellipse cx="120" cy="98" rx="3.5" ry="4.5" fill="#26201c"/>
      <path d="M68 86 Q80 80 90 86" stroke="${hairShadow}" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      <path d="M110 86 Q120 80 132 86" stroke="${hairShadow}" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      <path d="M86 114 Q100 124 114 114" stroke="#7a3b30" stroke-width="3" fill="none" stroke-linecap="round"/>`;
  } else if(expression === 'excited'){
    face = `<ellipse cx="80" cy="97" rx="4" ry="5.5" fill="#26201c"/><ellipse cx="120" cy="97" rx="4" ry="5.5" fill="#26201c"/>
      <circle cx="81.5" cy="95" r="1.3" fill="#fff"/><circle cx="121.5" cy="95" r="1.3" fill="#fff"/>
      <path d="M68 86 Q80 79 90 85" stroke="${hairShadow}" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      <path d="M110 85 Q120 79 132 86" stroke="${hairShadow}" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      <path d="M84 112 Q100 130 116 112 Q100 122 84 112 Z" fill="#7a2a20"/><path d="M88 114 Q100 120 112 114 Q100 117 88 114 Z" fill="#fff"/>`;
  } else if(expression === 'cool'){
    face = `<rect x="64" y="88" width="32" height="15" rx="7.5" fill="#1c1c24"/><rect x="104" y="88" width="32" height="15" rx="7.5" fill="#1c1c24"/>
      <rect x="66" y="90" width="28" height="10" rx="5" fill="#5b9bd5" opacity="0.55"/><rect x="106" y="90" width="28" height="10" rx="5" fill="#5b9bd5" opacity="0.55"/>
      <rect x="96" y="93" width="8" height="4" fill="#1c1c24"/>
      <path d="M88 115 Q100 121 112 115" stroke="#7a3b30" stroke-width="3" fill="none" stroke-linecap="round"/>`;
  } else if(expression === 'wink'){
    face = `<ellipse cx="80" cy="98" rx="3.5" ry="4.5" fill="#26201c"/>
      <path d="M112 98 Q120 93 128 98" stroke="#26201c" stroke-width="3" fill="none" stroke-linecap="round"/>
      <path d="M68 86 Q80 80 90 86" stroke="${hairShadow}" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      <path d="M110 88 Q120 84 132 90" stroke="${hairShadow}" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      <path d="M86 114 Q100 126 116 113" stroke="#7a3b30" stroke-width="3" fill="none" stroke-linecap="round"/>`;
  } else if(expression === 'star-eyes'){
    face = `<path d="M80 90l3 6.5 7 1-5 5 1.5 7-6.5-3.5-6.5 3.5 1.5-7-5-5 7-1z" fill="#ffc857"/>
      <path d="M120 90l3 6.5 7 1-5 5 1.5 7-6.5-3.5-6.5 3.5 1.5-7-5-5 7-1z" fill="#ffc857"/>
      <ellipse cx="100" cy="116" rx="10" ry="6.5" fill="#7a2a20"/>`;
  } else if(expression === 'laugh'){
    face = `<path d="M73 95 Q80 91 87 95" stroke="#26201c" stroke-width="3" fill="none" stroke-linecap="round"/>
      <path d="M113 95 Q120 91 127 95" stroke="#26201c" stroke-width="3" fill="none" stroke-linecap="round"/>
      <path d="M68 84 Q80 78 90 84" stroke="${hairShadow}" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      <path d="M110 84 Q120 78 132 84" stroke="${hairShadow}" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      <path d="M82 110 Q100 132 118 110 Q100 116 82 110 Z" fill="#7a2a20"/><path d="M87 112 Q100 119 113 112 Q100 114 87 112 Z" fill="#fff"/>`;
  }

  // ── HAIR (realistic shapes rendered behind & in front of head) ──
  let hairBack = '', hairFront = '';
  const HS = hairStyle;

  if(HS === 'short-crop'){
    hairFront = `<path d="M56 78 Q54 32 100 28 Q146 32 144 78 Q140 50 100 46 Q60 50 56 78 Z" fill="${hairColor}"/>
      <path d="M58 60 Q70 36 100 32 Q130 36 142 60 Q128 44 100 40 Q72 44 58 60 Z" fill="${hairHi}" opacity="0.4"/>`;
  } else if(HS === 'short-side-part'){
    hairFront = `<path d="M55 76 Q50 30 78 26 Q92 22 110 26 Q146 32 145 76 Q142 48 110 42 Q124 36 116 28 Q90 24 70 34 Q56 42 58 64 Z" fill="${hairColor}"/>
      <path d="M88 28 Q70 34 60 52" stroke="${hairHi}" stroke-width="3" opacity="0.45" fill="none" stroke-linecap="round"/>`;
  } else if(HS === 'quiff'){
    hairFront = `<path d="M58 72 Q56 50 64 38 Q72 18 100 18 Q118 18 116 34 Q132 30 140 50 Q146 58 142 76 Q134 50 110 44 Q126 30 104 26 Q82 24 76 42 Q70 56 60 58 Z" fill="${hairColor}"/>
      <path d="M80 30 Q96 18 112 28" stroke="${hairHi}" stroke-width="3" opacity="0.5" fill="none" stroke-linecap="round"/>`;
  } else if(HS === 'buzz'){
    hairFront = `<path d="M58 70 Q58 36 100 33 Q142 36 142 70 Q140 56 100 53 Q60 56 58 70 Z" fill="${hairColor}" opacity="0.92"/>`;
  } else if(HS === 'curly-top'){
    hairFront = `<circle cx="64" cy="58" r="13" fill="${hairColor}"/><circle cx="78" cy="42" r="15" fill="${hairColor}"/><circle cx="98" cy="34" r="16" fill="${hairColor}"/><circle cx="120" cy="40" r="15" fill="${hairColor}"/><circle cx="136" cy="56" r="13" fill="${hairColor}"/><circle cx="142" cy="72" r="11" fill="${hairColor}"/><circle cx="58" cy="72" r="11" fill="${hairColor}"/>
      <circle cx="92" cy="34" r="6" fill="${hairHi}" opacity="0.4"/><circle cx="116" cy="38" r="5" fill="${hairHi}" opacity="0.35"/>`;
  } else if(HS === 'afro'){
    hairFront = `<circle cx="100" cy="58" r="50" fill="${hairColor}"/>
      <circle cx="68" cy="46" r="10" fill="${hairHi}" opacity="0.3"/><circle cx="128" cy="50" r="9" fill="${hairHi}" opacity="0.25"/>`;
    hairBack = `<circle cx="100" cy="62" r="52" fill="${hairColor}" opacity="0.5"/>`;
  } else if(HS === 'long-straight'){
    hairBack = `<path d="M52 78 Q44 150 56 190 L74 190 Q64 140 66 84 Z" fill="${hairColor}"/><path d="M148 78 Q156 150 144 190 L126 190 Q136 140 134 84 Z" fill="${hairColor}"/>`;
    hairFront = `<path d="M56 76 Q54 30 100 27 Q146 30 144 76 Q138 50 100 46 Q62 50 56 76 Z" fill="${hairColor}"/>`;
  } else if(HS === 'long-wavy'){
    hairBack = `<path d="M50 78 Q38 120 50 160 Q56 178 70 184 L78 178 Q62 150 64 100 Q66 86 70 80 Z" fill="${hairColor}"/>
      <path d="M150 78 Q162 120 150 160 Q144 178 130 184 L122 178 Q138 150 136 100 Q134 86 130 80 Z" fill="${hairColor}"/>`;
    hairFront = `<path d="M56 76 Q53 28 100 25 Q147 28 144 76 Q137 48 100 44 Q63 48 56 76 Z" fill="${hairColor}"/>
      <path d="M62 50 Q80 30 100 28" stroke="${hairHi}" stroke-width="2.5" opacity="0.4" fill="none" stroke-linecap="round"/>`;
  } else if(HS === 'shoulder-bob'){
    hairBack = `<path d="M54 80 Q48 116 58 140 Q64 150 76 150 L78 138 Q66 120 68 88 Z" fill="${hairColor}"/>
      <path d="M146 80 Q152 116 142 140 Q136 150 124 150 L122 138 Q134 120 132 88 Z" fill="${hairColor}"/>`;
    hairFront = `<path d="M56 78 Q53 30 100 27 Q147 30 144 78 Q137 50 100 46 Q63 50 56 78 Z" fill="${hairColor}"/>`;
  } else if(HS === 'high-bun'){
    hairBack = `<circle cx="100" cy="22" r="17" fill="${hairColor}"/><ellipse cx="100" cy="22" rx="17" ry="14" fill="${hairHi}" opacity="0.15"/>`;
    hairFront = `<path d="M58 74 Q56 36 100 32 Q144 36 142 74 Q136 52 100 48 Q64 52 58 74 Z" fill="${hairColor}"/>`;
  } else if(HS === 'ponytail'){
    hairBack = `<path d="M136 66 Q168 76 162 132 Q158 144 148 134 Q152 96 128 76 Z" fill="${hairColor}"/>`;
    hairFront = `<path d="M56 76 Q54 30 100 27 Q146 30 144 76 Q138 50 100 46 Q62 50 56 76 Z" fill="${hairColor}"/>`;
  } else if(HS === 'pigtails'){
    hairBack = `<ellipse cx="46" cy="92" rx="15" ry="20" fill="${hairColor}"/><ellipse cx="154" cy="92" rx="15" ry="20" fill="${hairColor}"/>
      <rect x="38" y="72" width="16" height="22" rx="8" fill="${hairColor}"/><rect x="146" y="72" width="16" height="22" rx="8" fill="${hairColor}"/>`;
    hairFront = `<path d="M58 74 Q56 30 100 27 Q144 30 142 74 Q136 50 100 46 Q64 50 58 74 Z" fill="${hairColor}"/>`;
  } else if(HS === 'braids'){
    hairBack = `<path d="M50 80 Q44 110 50 145 Q54 156 64 152 L62 140 Q56 112 60 86 Z" fill="${hairColor}"/>
      <path d="M150 80 Q156 110 150 145 Q146 156 136 152 L138 140 Q144 112 140 86 Z" fill="${hairColor}"/>
      <circle cx="56" cy="100" r="2" fill="${hairShadow}"/><circle cx="56" cy="116" r="2" fill="${hairShadow}"/><circle cx="56" cy="132" r="2" fill="${hairShadow}"/>
      <circle cx="144" cy="100" r="2" fill="${hairShadow}"/><circle cx="144" cy="116" r="2" fill="${hairShadow}"/><circle cx="144" cy="132" r="2" fill="${hairShadow}"/>`;
    hairFront = `<path d="M58 74 Q56 32 100 28 Q144 32 142 74 Q136 50 100 46 Q64 50 58 74 Z" fill="${hairColor}"/>`;
  } else if(HS === 'curtain-fringe'){
    hairFront = `<path d="M56 78 Q53 30 100 27 Q147 30 144 78 Q138 56 116 50 Q108 44 100 50 Q92 44 84 50 Q62 56 56 78 Z" fill="${hairColor}"/>
      <path d="M84 50 Q92 60 88 70" stroke="${hairShadow}" stroke-width="2" opacity="0.5" fill="none"/>
      <path d="M116 50 Q108 60 112 70" stroke="${hairShadow}" stroke-width="2" opacity="0.5" fill="none"/>`;
  } else if(HS === 'slicked-back'){
    hairFront = `<path d="M58 70 Q56 30 100 26 Q144 30 142 70 Q140 44 100 38 Q60 44 58 70 Z" fill="${hairColor}"/>
      <path d="M64 42 Q100 30 136 42" stroke="${hairHi}" stroke-width="2.5" opacity="0.5" fill="none" stroke-linecap="round"/>`;
  }

  // ── ACCESSORIES ──
  let accessoryEl = '';
  if(accessory === 'goggles'){
    accessoryEl = `<rect x="62" y="84" width="32" height="22" rx="11" fill="#1b3270" opacity="0.88"/><rect x="106" y="84" width="32" height="22" rx="11" fill="#1b3270" opacity="0.88"/><rect x="92" y="91" width="16" height="6" fill="#1b3270" opacity="0.88"/><circle cx="78" cy="95" r="9" fill="#7dd8ff" opacity="0.5"/><circle cx="122" cy="95" r="9" fill="#7dd8ff" opacity="0.5"/>`;
  } else if(accessory === 'cap'){
    accessoryEl = `<path d="M53 66 Q58 26 100 24 Q142 26 147 66 Q147 54 100 51 Q53 54 53 66 Z" fill="#1b3270"/><ellipse cx="100" cy="51" rx="48" ry="9" fill="#1b3270"/><ellipse cx="115" cy="50" rx="10" ry="5" fill="#2ee6c8" opacity="0.8"/>`;
  } else if(accessory === 'headband'){
    accessoryEl = `<path d="M55 64 Q100 48 145 64 L145 74 Q100 58 55 74 Z" fill="#ff6b81"/>`;
  } else if(accessory === 'glasses'){
    accessoryEl = `<circle cx="80" cy="96" r="14" fill="none" stroke="#2a2a2a" stroke-width="3"/><circle cx="120" cy="96" r="14" fill="none" stroke="#2a2a2a" stroke-width="3"/><line x1="94" y1="96" x2="106" y2="96" stroke="#2a2a2a" stroke-width="3"/><line x1="66" y1="92" x2="58" y2="86" stroke="#2a2a2a" stroke-width="3"/><line x1="134" y1="92" x2="142" y2="86" stroke="#2a2a2a" stroke-width="3"/>`;
  } else if(accessory === 'earrings'){
    accessoryEl = `<circle cx="56" cy="112" r="3.5" fill="#ffc857"/><circle cx="144" cy="112" r="3.5" fill="#ffc857"/>`;
  }

  // ── SWEATSHIRT with logo (club logo image or In Synch wordmark) ──
  const logoBadge = (logoChoice === 'club' && clubLogoUrl)
    ? `<clipPath id="clubLogoClip"><circle cx="100" cy="178" r="17"/></clipPath>
       <circle cx="100" cy="178" r="19" fill="#fff"/>
       <image href="${clubLogoUrl}" x="83" y="161" width="34" height="34" clip-path="url(#clubLogoClip)" preserveAspectRatio="xMidYMid slice"/>`
    : `<circle cx="100" cy="178" r="19" fill="#0d1b3e"/>
       <circle cx="100" cy="178" r="17" fill="none" stroke="#2ee6c8" stroke-width="1.5"/>
       <text x="100" y="183" text-anchor="middle" font-family="Fredoka,sans-serif" font-weight="700" font-size="13" fill="#2ee6c8">IS</text>`;

  return `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
    <circle cx="100" cy="100" r="100" fill="#eef2ff"/>
    ${hairBack}
    <!-- Neck -->
    <path d="M86 136 Q100 144 114 136 L114 156 Q100 162 86 156 Z" fill="${skinShadow}"/>
    <!-- Sweatshirt body -->
    <path d="M48 200 Q50 158 78 150 Q90 158 100 158 Q110 158 122 150 Q150 158 152 200 Z" fill="#2a3550"/>
    <path d="M78 150 Q90 162 100 162 Q110 162 122 150 L122 158 Q110 168 100 168 Q90 168 78 158 Z" fill="#1f2840"/>
    <!-- Sleeves shading -->
    <path d="M48 200 Q50 162 72 152 Q66 170 64 200 Z" fill="#212c47"/>
    <path d="M152 200 Q150 162 128 152 Q134 170 136 200 Z" fill="#212c47"/>
    ${logoBadge}
    <!-- Head -->
    <ellipse cx="100" cy="96" rx="46" ry="50" fill="${skin}"/>
    <ellipse cx="100" cy="118" rx="40" ry="24" fill="${skin}"/>
    <!-- Ears -->
    <ellipse cx="55" cy="98" rx="7" ry="11" fill="${skin}"/>
    <ellipse cx="145" cy="98" rx="7" ry="11" fill="${skin}"/>
    <ellipse cx="55" cy="99" rx="3.5" ry="6" fill="${skinShadow}" opacity="0.5"/>
    <ellipse cx="145" cy="99" rx="3.5" ry="6" fill="${skinShadow}" opacity="0.5"/>
    <!-- Eyebrows base shadow (subtle brow ridge) -->
    <ellipse cx="100" cy="78" rx="38" ry="14" fill="${skinShadow}" opacity="0.12"/>
    ${face}
    <!-- Nose -->
    <path d="M97 100 Q95 108 98 111 Q100 112.5 102 111" stroke="${skinShadow}" stroke-width="1.8" fill="none" stroke-linecap="round" opacity="0.55"/>
    <!-- Cheeks -->
    <ellipse cx="68" cy="108" rx="8" ry="5" fill="#ff8fa0" opacity="0.28"/>
    <ellipse cx="132" cy="108" rx="8" ry="5" fill="#ff8fa0" opacity="0.28"/>
    ${hairFront}
    ${accessoryEl}
  </svg>`;
}
function renderAthleteAvatar(athlete){
  if(!athlete) return renderAvatarSVG(DEFAULT_AVATAR);
  const av = {...(athlete.avatar||DEFAULT_AVATAR)};
  av._clubName = athlete.club || '';
  av._clubLogoUrl = getClubLogo(athlete.club);
  return renderAvatarSVG(av);
}

function avatarThumbHTML(av, size){
  size = size || 40;
  return `<div style="width:${size}px;height:${size}px;border-radius:50%;overflow:hidden;flex-shrink:0;background:#eef2ff;">${renderAvatarSVG(av)}</div>`;
}

// ═══════════════════════════════════════════════════════════════
// AUTH
// ═══════════════════════════════════════════════════════════════
window.onFirebaseLogin = async function(user){
  CU = user;
  isAdmin = (user.email === ADMIN_EMAIL || user.role === 'admin');
  document.getElementById('loadingScreen').style.display = 'none';

  // Check if this account requires a forced password change (bulk-imported)
  const snap = await dbGet('lb_users/'+user.uid);
  const profile = snap.val() || {};
  if(profile.mustChangePassword){
    document.getElementById('loginScreen').style.display = 'none';
    showForcePasswordScreen(profile.name || user.name);
    return;
  }

  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('appScreen').style.display = 'flex';
  applyRole();
  subscribeData();
  showPage('leaderboard');
};

function showForcePasswordScreen(name){
  document.getElementById('forcePwName').textContent = name;
  document.getElementById('forcePwScreen').style.display = 'flex';
}

async function doForcePasswordChange(){
  const p1 = document.getElementById('fpw1').value;
  const p2 = document.getElementById('fpw2').value;
  const err = document.getElementById('fpwErr');
  if(p1.length < 6){ showErr(err, 'Password must be 6+ characters.'); return; }
  if(p1 !== p2){ showErr(err, 'Passwords do not match.'); return; }
  const btn = document.getElementById('fpwBtn');
  btn.disabled = true; btn.textContent = 'Updating...';
  try{
    await window._fbFns.updatePassword(window._auth.currentUser, p1);
    await dbUpd('lb_users/'+CU.uid, { mustChangePassword: false });
    document.getElementById('forcePwScreen').style.display = 'none';
    document.getElementById('appScreen').style.display = 'flex';
    applyRole();
    subscribeData();
    showPage('leaderboard');
  } catch(ex){
    showErr(err, authErr(ex.code));
    btn.disabled = false; btn.textContent = 'Set New Password & Continue';
  }
}

window.onFirebaseLogout = function(){
  CU = null; isAdmin = false;
  if(unsubAthletes){unsubAthletes();unsubAthletes=null;}
  if(unsubBadges){unsubBadges();unsubBadges=null;}
  document.getElementById('loadingScreen').style.display = 'none';
  document.getElementById('appScreen').style.display = 'none';
  document.getElementById('loginScreen').style.display = 'flex';
};

function switchAuthTab(tab){
  document.getElementById('tabSI').classList.toggle('active', tab==='signin');
  document.getElementById('tabSU').classList.toggle('active', tab==='signup');
  document.getElementById('siForm').style.display = tab==='signin'?'flex':'none';
  document.getElementById('suForm').style.display = tab==='signup'?'flex':'none';
}

async function doSignIn(){
  const e=document.getElementById('siEmail').value.trim(),p=document.getElementById('siPw').value;
  const err=document.getElementById('siErr'),btn=document.getElementById('siBtn');
  if(!e||!p){showErr(err,'Please enter email and password.');return;}
  btn.disabled=true;btn.textContent='Signing in...';
  try{await window._fbFns.signInWithEmailAndPassword(window._auth,e,p);}
  catch(ex){showErr(err,authErr(ex.code));btn.disabled=false;btn.textContent='Sign In';}
}

async function doSignUp(){
  const n=document.getElementById('suName').value.trim();
  const club=document.getElementById('suClub').value.trim();
  const e=document.getElementById('suEmail').value.trim();
  const p=document.getElementById('suPw').value;
  const err=document.getElementById('suErr'),btn=document.getElementById('suBtn');
  if(!n||!club||!e||!p){showErr(err,'Please fill in all fields.');return;}
  if(p.length<6){showErr(err,'Password must be 6+ characters.');return;}
  btn.disabled=true;btn.textContent='Creating...';
  try{
    const c=await window._fbFns.createUserWithEmailAndPassword(window._auth,e,p);
    await window._fbFns.updateProfile(c.user,{displayName:n});
    await dbSet('lb_users/'+c.user.uid,{name:n,club:club,email:e,role:'athlete',avatar:DEFAULT_AVATAR,createdAt:Date.now()});
    await dbSet('lb_badges/'+c.user.uid,0);
  }catch(ex){showErr(err,authErr(ex.code));btn.disabled=false;btn.textContent='Create Account';}
}

async function doLogout(){ await window._fbFns.signOut(window._auth); }

async function doChangePw(){
  const p1=document.getElementById('pw1').value,p2=document.getElementById('pw2').value;
  const err=document.getElementById('pwErr');
  if(p1.length<6){showErr(err,'Minimum 6 characters.');return;}
  if(p1!==p2){showErr(err,'Passwords do not match.');return;}
  try{await window._fbFns.updatePassword(window._auth.currentUser,p1);closeModal('pwModal');alert('Password updated.');}
  catch(ex){showErr(err,authErr(ex.code));}
}

function applyRole(){
  document.getElementById('userChipName').textContent = isAdmin ? 'Coach' : CU.name;
  document.getElementById('userChipAvatar').innerHTML = '';
  if(!isAdmin){
    dbGet('lb_users/'+CU.uid).then(snap=>{
      const av = (snap.val()||{}).avatar || DEFAULT_AVATAR;
      document.getElementById('userChipAvatar').innerHTML = renderAvatarSVG(av);
    });
  }
  document.getElementById('navAdmin').style.display = isAdmin ? '' : 'none';
  document.getElementById('mobNavAdmin').style.display = isAdmin ? '' : 'none';
  document.getElementById('navProfile').style.display = isAdmin ? 'none' : '';
}

function toggleMobMenu(){ document.getElementById('mobDrawer').classList.toggle('open'); }
document.addEventListener('click', e=>{
  const d=document.getElementById('mobDrawer');
  if(d.classList.contains('open') && !e.target.closest('.mob-drawer') && !e.target.closest('.menu-btn')) d.classList.remove('open');
});

// ═══════════════════════════════════════════════════════════════
// DATA SUBSCRIPTION
// ═══════════════════════════════════════════════════════════════
let unsubClubLogos = null;
let clubLogos = {};

function subscribeData(){
  if(unsubAthletes) unsubAthletes();
  if(unsubBadges) unsubBadges();
  if(unsubClubLogos) unsubClubLogos();
  unsubAthletes = dbOn('lb_users', data=>{
    athletes = data || {};
    renderCurrentPage();
  });
  unsubBadges = dbOn('lb_badges', data=>{
    badges = data || {};
    renderCurrentPage();
  });
  unsubClubLogos = dbOn('lb_club_logos', data=>{
    clubLogos = data || {};
    renderCurrentPage();
  });
}

function getClubLogo(clubName){
  if(!clubName) return null;
  const key = clubName.replace(/[^a-zA-Z0-9]/g,'_');
  return clubLogos[key] || null;
}

let curPage = 'leaderboard';
function renderCurrentPage(){
  if(curPage === 'leaderboard') renderLeaderboard();
  if(curPage === 'profile') renderProfilePage();
  if(curPage === 'admin') renderAdminPage();
}

function showPage(name){
  curPage = name;
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(t=>t.classList.remove('active'));
  document.querySelectorAll('.mob-nav-item').forEach(t=>t.classList.remove('active'));
  document.getElementById('page-'+name).classList.add('active');
  document.querySelectorAll('.nav-tab, .mob-nav-item').forEach(t=>{
    const txt = t.textContent.toLowerCase();
    if((name==='leaderboard'&&txt.includes('leaderboard'))||(name==='profile'&&txt.includes('avatar'))||(name==='admin'&&txt.includes('admin')))
      t.classList.add('active');
  });
  renderCurrentPage();
}

// ═══════════════════════════════════════════════════════════════
// LEADERBOARD PAGE
// ═══════════════════════════════════════════════════════════════
function getRankedAthletes(){
  return Object.entries(athletes)
    .filter(([,a])=>a.role==='athlete')
    .map(([uid,a])=>({uid, ...a, badgeCount: badges[uid]||0}))
    .sort((a,b)=>b.badgeCount - a.badgeCount);
}

function getClubRankings(){
  const ranked = getRankedAthletes();
  const clubTotals = {};
  ranked.forEach(a=>{
    const club = a.club || 'Unknown Club';
    clubTotals[club] = (clubTotals[club]||0) + a.badgeCount;
  });
  const arr = Object.entries(clubTotals).map(([club,total])=>({club,total})).sort((a,b)=>b.total-a.total);
  // assign ranks with ties
  let rank = 1;
  arr.forEach((c,i)=>{
    if(i>0 && arr[i-1].total !== c.total) rank = i+1;
    c.rank = rank;
  });
  return arr;
}

function renderLeaderboard(){
  const wrap = document.getElementById('leaderboardContent');
  const ranked = getRankedAthletes();

  if(!ranked.length){
    wrap.innerHTML = `<div class="lb-hero"><h1>🏆 In Synch <span class="accent">2026</span> Leaderboard</h1><p>Track your progress, unlock rewards, and climb the rankings</p></div>
      <div class="empty-st"><div class="emoji">🏊‍♀️</div><p>No athletes have joined yet. Be the first!</p></div>`;
    return;
  }

  const top3 = ranked.slice(0,3);
  const risingStars = [...ranked].sort((a,b)=>b.badgeCount-a.badgeCount).slice(0,4);
  const clubs = getClubRankings();

  // Podium
  const podiumSlot = (athlete, rankNum) => {
    if(!athlete) return `<div class="podium-slot rank-${rankNum} podium-empty"><div class="podium-avatar-ring"></div><div class="podium-name">—</div><div class="podium-base">${rankNum}</div></div>`;
    const crown = rankNum===1 ? '<div class="podium-crown">👑</div>' : '';
    return `<div class="podium-slot rank-${rankNum}">
      <div class="podium-avatar-ring">${crown}${renderAthleteAvatar(athlete)}</div>
      <div class="podium-name">${esc(athlete.name)}</div>
      <div class="podium-club">${getClubLogo(athlete.club)?`<img src="${getClubLogo(athlete.club)}" style="width:12px;height:12px;border-radius:3px;object-fit:cover;vertical-align:-2px;margin-right:3px;">`:''}${esc(athlete.club||'')}</div>
      <div class="podium-badges">🏅 ${athlete.badgeCount}</div>
      <div class="podium-base">${rankNum}</div>
    </div>`;
  };

  const podiumHtml = `<div class="podium-wrap">
    ${podiumSlot(top3[1], 2)}
    ${podiumSlot(top3[0], 1)}
    ${podiumSlot(top3[2], 3)}
  </div>`;

  const risingHtml = risingStars.map(a=>{
    const lvl = getLevel(a.badgeCount);
    return `<div class="athlete-card">
      <div class="athlete-card-avatar">${renderAthleteAvatar(a)}</div>
      <div class="athlete-card-name">${esc(a.name)}</div>
      <div class="athlete-card-club">${getClubLogo(a.club)?`<img src="${getClubLogo(a.club)}" style="width:11px;height:11px;border-radius:3px;object-fit:cover;vertical-align:-1px;margin-right:3px;">`:''}${esc(a.club||'')}</div>
      <div class="athlete-card-badges">🏅 ${a.badgeCount}</div>
      <div><span class="level-tag ${lvl.key}">${lvl.label}</span></div>
    </div>`;
  }).join('');

  const rewardsHtml = REWARDS.map(r=>`
    <div class="reward-card ${r.level}">
      <div class="reward-medal">${r.medal}</div>
      <div class="reward-level">${r.level.charAt(0).toUpperCase()+r.level.slice(1)} Level</div>
      <div class="reward-badges-needed">${r.badges} Badges</div>
      <div class="reward-prize">${r.prize}</div>
    </div>`).join('');

  const clubRows = clubs.map(c=>{
    const badgeClass = c.rank===1?'r1':c.rank===2?'r2':c.rank===3?'r3':'';
    const logo = getClubLogo(c.club);
    const logoHtml = logo ? `<img src="${logo}" style="width:22px;height:22px;border-radius:5px;object-fit:cover;vertical-align:-6px;margin-right:8px;">` : '';
    return `<tr><td><span class="club-rank-badge ${badgeClass}">${c.rank}</span></td><td>${logoHtml}${esc(c.club)}</td><td style="color:var(--gold);font-weight:700">${c.total}</td></tr>`;
  }).join('');

  const fullRankingsHtml = ranked.map((a,i)=>{
    const isMe = CU && a.uid === CU.uid;
    return `<div class="rank-row ${isMe?'is-me':''}">
      <div class="rank-num">${i+1}</div>
      <div class="rank-avatar">${renderAthleteAvatar(a)}</div>
      <div class="rank-info">
        <div class="rank-name">${esc(a.name)}${isMe?' (You)':''}</div>
        <div class="rank-club">${getClubLogo(a.club)?`<img src="${getClubLogo(a.club)}" style="width:12px;height:12px;border-radius:3px;object-fit:cover;vertical-align:-2px;margin-right:3px;">`:''}${esc(a.club||'')}</div>
      </div>
      <div class="rank-badges">🏅 ${a.badgeCount}</div>
    </div>`;
  }).join('');

  wrap.innerHTML = `
    <div class="lb-hero">
      <h1>🏆 In Synch <span class="accent">2026</span> Leaderboard</h1>
      <p>Track your progress, unlock rewards, and climb the rankings</p>
    </div>

    ${podiumHtml}

    <div class="lb-section">
      <div class="lb-section-hdr"><span class="emoji">⭐</span><h2>Rising Stars</h2></div>
      <div class="athlete-grid">${risingHtml}</div>
    </div>

    <div class="lb-section">
      <div class="lb-section-hdr"><span class="emoji">🥇</span><h2>Rewards</h2></div>
      <div class="rewards-grid">${rewardsHtml}</div>
    </div>

    <div class="lb-section">
      <div class="lb-section-hdr"><span class="emoji">🧜‍♀️</span><h2>Club Challenge</h2></div>
      <div class="club-table-wrap">
        <table class="club-table">
          <thead><tr><th>Rank</th><th>Club Name</th><th>Total Badges</th></tr></thead>
          <tbody>${clubRows}</tbody>
        </table>
      </div>
    </div>

    <div class="lb-section">
      <div class="lb-section-hdr"><span class="emoji">📋</span><h2>Full 2026 Rankings</h2></div>
      <div class="rankings-list">${fullRankingsHtml}</div>
    </div>
  `;
}

// ═══════════════════════════════════════════════════════════════
// PROFILE / AVATAR PAGE
// ═══════════════════════════════════════════════════════════════
async function renderProfilePage(){
  if(isAdmin) return;
  const wrap = document.getElementById('profileContent');
  const snap = await dbGet('lb_users/'+CU.uid);
  const profile = snap.val() || {};
  curAvatarDraft = {...DEFAULT_AVATAR, ...(profile.avatar||{})};
  curAvatarDraft._clubName = profile.club || '';
  curAvatarDraft._clubLogoUrl = getClubLogo(profile.club);
  const badgeCount = badges[CU.uid] || 0;
  const lvl = getLevel(badgeCount);
  const nextLvl = getNextLevel(badgeCount);

  const trackPct = nextLvl ? Math.min(100, (badgeCount / nextLvl.min) * 100) : 100;

  wrap.innerHTML = `
    <div class="profile-hero">
      <div class="profile-avatar-big" id="profileAvatarBig">${renderAvatarSVG(curAvatarDraft)}</div>
      <div class="profile-name">${esc(profile.name||CU.name)}</div>
      <div class="profile-club">${esc(profile.club||'')}</div>
      <div class="profile-rank-pill">🏅 ${badgeCount} Badges &middot; ${lvl.label} Level</div>
    </div>

    <div class="level-progress-card">
      <div class="level-progress-hdr">
        <h3>Your Progress</h3>
        <div class="level-badges-count">${badgeCount} 🏅</div>
      </div>
      <div class="level-track"><div class="level-track-fill" style="width:${trackPct}%"></div></div>
      <div class="level-markers">
        <span class="level-marker ${badgeCount>=3?'reached':''}">🥉 3</span>
        <span class="level-marker ${badgeCount>=5?'reached':''}">🥈 5</span>
        <span class="level-marker ${badgeCount>=10?'reached':''}">🥇 10</span>
        <span class="level-marker ${badgeCount>=15?'reached':''}">💎 15</span>
      </div>
      <div class="level-next-msg">
        ${nextLvl
          ? `Just <strong>${nextLvl.min - badgeCount} more badge${(nextLvl.min-badgeCount)!==1?'s':''}</strong> until you reach ${nextLvl.label} level! 🎉`
          : `🎉 You've reached the highest level — Diamond! Amazing work.`}
      </div>
    </div>

    <div class="lb-section">
      <div class="lb-section-hdr"><span class="emoji">😎</span><h2>Customise Your Avatar</h2></div>
      <div class="avatar-builder">
        <div class="avatar-preview-pane">
          <div class="avatar-preview-circle" id="avatarPreviewCircle">${renderAvatarSVG(curAvatarDraft)}</div>
          <button class="btn-save-avatar" onclick="saveAvatar()">💾 Save Avatar</button>
        </div>
        <div class="avatar-options">
          <div class="avatar-option-group">
            <h4>Sweatshirt Logo</h4>
            <div class="logo-choice-row" id="logoChoiceRow"></div>
          </div>
          <div class="avatar-option-group">
            <h4>Hair Style</h4>
            <div class="option-tile-row" id="hairStyleTiles"></div>
          </div>
          <div class="avatar-option-group">
            <h4>Hair Colour</h4>
            <div class="swatch-row" id="hairColorSwatches"></div>
          </div>
          <div class="avatar-option-group">
            <h4>Skin Tone</h4>
            <div class="swatch-row" id="skinSwatches"></div>
          </div>
          <div class="avatar-option-group">
            <h4>Expression</h4>
            <div class="option-tile-row" id="expressionTiles"></div>
          </div>
          <div class="avatar-option-group">
            <h4>Accessory</h4>
            <div class="option-tile-row" id="accessoryTiles"></div>
          </div>
        </div>
      </div>
    </div>
  `;

  buildAvatarOptionPickers();
}

function buildAvatarOptionPickers(){
  const skinEl = document.getElementById('skinSwatches');
  if(skinEl) skinEl.innerHTML = SKIN_TONES.map(c=>`<div class="swatch ${curAvatarDraft.skin===c?'selected':''}" style="background:${c}" onclick="updateAvatarField('skin','${c}')"></div>`).join('');

  const hairColorEl = document.getElementById('hairColorSwatches');
  if(hairColorEl) hairColorEl.innerHTML = HAIR_COLORS.map(c=>`<div class="swatch ${curAvatarDraft.hairColor===c?'selected':''}" style="background:${c}" onclick="updateAvatarField('hairColor','${c}')"></div>`).join('');

  const hairStyleEl = document.getElementById('hairStyleTiles');
  if(hairStyleEl) hairStyleEl.innerHTML = HAIR_STYLES.map(h=>`<div class="option-tile" title="${h.label}"><div class="option-tile-inner ${curAvatarDraft.hairStyle===h.id?'selected':''}" onclick="updateAvatarField('hairStyle','${h.id}')">${h.emoji}</div><div class="option-tile-label">${h.label}</div></div>`).join('');

  const exprEl = document.getElementById('expressionTiles');
  if(exprEl) exprEl.innerHTML = EXPRESSIONS.map(x=>`<div class="option-tile-inner ${curAvatarDraft.expression===x.id?'selected':''}" onclick="updateAvatarField('expression','${x.id}')">${x.emoji}</div>`).join('');

  const accEl = document.getElementById('accessoryTiles');
  if(accEl) accEl.innerHTML = ACCESSORIES.map(a=>`<div class="option-tile-inner ${curAvatarDraft.accessory===a.id?'selected':''}" onclick="updateAvatarField('accessory','${a.id}')">${a.emoji}</div>`).join('');

  const logoEl = document.getElementById('logoChoiceRow');
  if(logoEl){
    const hasClubLogo = !!curAvatarDraft._clubLogoUrl;
    logoEl.innerHTML = `
      <div class="logo-choice-tile ${curAvatarDraft.logoChoice==='insynch'?'selected':''}" onclick="updateAvatarField('logoChoice','insynch')">
        <div class="logo-choice-preview" style="background:#0d1b3e;color:#2ee6c8;">IS</div>
        <div class="logo-choice-label">In Synch</div>
      </div>
      <div class="logo-choice-tile ${curAvatarDraft.logoChoice==='club'?'selected':''} ${!hasClubLogo?'disabled':''}" onclick="${hasClubLogo?"updateAvatarField('logoChoice','club')":''}">
        <div class="logo-choice-preview">${hasClubLogo?`<img src="${curAvatarDraft._clubLogoUrl}">`:'🏟️'}</div>
        <div class="logo-choice-label">${hasClubLogo?'My Club':'No club logo yet'}</div>
      </div>
    `;
  }
}

function updateAvatarField(field, value){
  curAvatarDraft[field] = value;
  document.getElementById('avatarPreviewCircle').innerHTML = renderAvatarSVG(curAvatarDraft);
  buildAvatarOptionPickers();
}

async function saveAvatar(){
  if(!CU || isAdmin) return;
  // Strip internal club-context fields before saving — they're derived at render time
  const { _clubName, _clubLogoUrl, ...avatarToSave } = curAvatarDraft;
  await dbUpd('lb_users/'+CU.uid, {avatar: avatarToSave});
  document.getElementById('userChipAvatar').innerHTML = renderAvatarSVG(curAvatarDraft);
  const btn = document.querySelector('.btn-save-avatar');
  const orig = btn.textContent;
  btn.textContent = '✅ Saved!';
  setTimeout(()=>{btn.textContent=orig;}, 1800);
}

// ═══════════════════════════════════════════════════════════════
// ADMIN PAGE
// ═══════════════════════════════════════════════════════════════
function renderAdminPage(){
  if(!isAdmin) return;
  const wrap = document.getElementById('adminContent');
  wrap.innerHTML = `
    <div class="lb-hero" style="text-align:left;margin-bottom:18px;">
      <h1 style="font-size:24px;">⚙️ Badge Admin</h1>
      <p>Manage athletes, badge counts, and club logos</p>
    </div>
    <div class="admin-tabs">
      <button class="admin-subtab ${curAdminTab==='manual'?'active':''}" onclick="switchAdminTab('manual')">✍️ Manual Entry</button>
      <button class="admin-subtab ${curAdminTab==='upload'?'active':''}" onclick="switchAdminTab('upload')">📥 Badge Upload</button>
      <button class="admin-subtab ${curAdminTab==='import'?'active':''}" onclick="switchAdminTab('import')">🆕 Import Athletes</button>
      <button class="admin-subtab ${curAdminTab==='logos'?'active':''}" onclick="switchAdminTab('logos')">🏷️ Club Logos</button>
      <button class="admin-subtab ${curAdminTab==='accounts'?'active':''}" onclick="switchAdminTab('accounts')">👥 Accounts</button>
    </div>
    <div id="adminTabContent"></div>
  `;
  renderAdminTabContent();
}

function switchAdminTab(tab){
  curAdminTab = tab;
  renderAdminPage();
}

function renderAdminTabContent(){
  const el = document.getElementById('adminTabContent');
  if(!el) return;

  if(curAdminTab === 'manual'){
    const ranked = getRankedAthletes();
    if(!ranked.length){
      el.innerHTML = `<div class="empty-st"><div class="emoji">🏊‍♀️</div><p>No athletes yet.</p></div>`;
      return;
    }
    el.innerHTML = `<div class="lb-section">
      <div class="lb-section-hdr"><h2>Update Badge Counts</h2></div>
      ${ranked.map(a=>`
        <div class="admin-athlete-row">
          <div class="admin-athlete-avatar">${renderAthleteAvatar(a)}</div>
          <div class="admin-athlete-info">
            <div class="admin-athlete-name">${esc(a.name)}</div>
            <div class="admin-athlete-club">${esc(a.club||'')}</div>
          </div>
          <input type="number" class="badge-input" id="badge_${a.uid}" value="${a.badgeCount}" min="0">
          <button class="btn-mini-save" onclick="saveBadgeCount('${a.uid}')">Save</button>
        </div>
      `).join('')}
    </div>`;
  }

  else if(curAdminTab === 'upload'){
    el.innerHTML = `<div class="lb-section">
      <div class="lb-section-hdr"><h2>Upload Weekly Spreadsheet</h2></div>
      <p style="font-size:12px;color:var(--ink-dim);margin-bottom:14px;line-height:1.6;">Upload a CSV with two columns: <strong>Email</strong> and <strong>Badges</strong>. The first row should be headers. Athlete emails must match their account email exactly.</p>
      <div class="upload-drop" id="csvDrop" onclick="document.getElementById('csvFileInput').click()" ondragover="event.preventDefault();this.classList.add('over')" ondragleave="this.classList.remove('over')" ondrop="handleCsvDrop(event)">
        <p>📄 Click to upload or drag & drop your CSV</p>
        <small>Columns: Email, Badges</small>
        <input type="file" id="csvFileInput" accept=".csv" style="display:none" onchange="handleCsvFile(event)">
      </div>
      <div id="csvPreviewArea"></div>
    </div>`;
  }

  else if(curAdminTab === 'import'){
    el.innerHTML = `<div class="lb-section">
      <div class="lb-section-hdr"><h2>Import New Athletes</h2></div>
      <p style="font-size:12px;color:var(--ink-dim);margin-bottom:14px;line-height:1.6;">Upload a CSV with columns: <strong>Name</strong>, <strong>Club</strong>, <strong>Email</strong>, and optionally <strong>Badges</strong>. An account will be created for each new athlete with the temporary password <strong style="color:var(--teal)">${TEMP_PASSWORD}</strong> — they'll be asked to set their own password the first time they log in. Athletes already registered will be skipped automatically.</p>
      <div class="upload-drop" id="athleteCsvDrop" onclick="document.getElementById('athleteCsvFileInput').click()" ondragover="event.preventDefault();this.classList.add('over')" ondragleave="this.classList.remove('over')" ondrop="handleAthleteCsvDrop(event)">
        <p>📄 Click to upload or drag & drop your CSV</p>
        <small>Columns: Name, Club, Email, Badges (optional)</small>
        <input type="file" id="athleteCsvFileInput" accept=".csv" style="display:none" onchange="handleAthleteCsvFile(event)">
      </div>
      <div id="athleteCsvPreviewArea"></div>
    </div>`;
  }

  else if(curAdminTab === 'logos'){
    const clubs = [...new Set(Object.values(athletes).filter(a=>a.role==='athlete').map(a=>a.club).filter(Boolean))].sort();
    dbGet('lb_club_logos').then(snap=>{
      const logos = snap.val() || {};
      el.innerHTML = `<div class="lb-section">
        <div class="lb-section-hdr"><h2>Club Logos</h2></div>
        <p style="font-size:12px;color:var(--ink-dim);margin-bottom:16px;line-height:1.6;">Upload a logo for each club. These appear next to club names on the leaderboard and club challenge table.</p>
        ${clubs.length ? clubs.map(club=>{
          const logoKey = club.replace(/[^a-zA-Z0-9]/g,'_');
          const logoUrl = logos[logoKey];
          return `<div class="admin-athlete-row">
            <div style="width:40px;height:40px;border-radius:10px;background:rgba(255,255,255,0.06);display:flex;align-items:center;justify-content:center;overflow:hidden;flex-shrink:0;">
              ${logoUrl ? `<img src="${logoUrl}" style="width:100%;height:100%;object-fit:cover;">` : '<span style="font-size:18px;opacity:0.3;">🏟️</span>'}
            </div>
            <div class="admin-athlete-info"><div class="admin-athlete-name">${esc(club)}</div></div>
            <input type="file" accept="image/*" id="logoInput_${logoKey}" style="display:none" onchange="handleClubLogoUpload('${logoKey.replace(/'/g,"\\'")}','${club.replace(/'/g,"\\'")}', this)">
            <button class="btn-mini-save" onclick="document.getElementById('logoInput_${logoKey}').click()">${logoUrl?'Change':'Upload'}</button>
          </div>`;
        }).join('') : '<div class="empty-st"><div class="emoji">🏟️</div><p>No clubs yet — add athletes first.</p></div>'}
      </div>`;
    });
    return;
  }

  else if(curAdminTab === 'accounts'){
    const ranked = getRankedAthletes();
    el.innerHTML = `<div class="lb-section">
      <div class="lb-section-hdr"><h2>All Athlete Accounts</h2><span style="font-size:11px;color:var(--ink-faint)">${ranked.length} athletes</span></div>
      ${ranked.length ? ranked.map(a=>`
        <div class="admin-athlete-row">
          <div class="admin-athlete-avatar">${renderAthleteAvatar(a)}</div>
          <div class="admin-athlete-info">
            <div class="admin-athlete-name">${esc(a.name)}</div>
            <div class="admin-athlete-club">${esc(a.email)} &middot; ${esc(a.club||'')}</div>
          </div>
          <div style="font-weight:700;color:var(--gold)">🏅 ${a.badgeCount}</div>
        </div>
      `).join('') : `<div class="empty-st"><div class="emoji">🏊‍♀️</div><p>No athletes yet.</p></div>`}
    </div>`;
  }
}

async function saveBadgeCount(uid){
  const input = document.getElementById('badge_'+uid);
  const val = parseInt(input.value) || 0;
  await dbSet('lb_badges/'+uid, val);
  const btn = input.nextElementSibling;
  const orig = btn.textContent;
  btn.textContent = '✓ Saved';
  setTimeout(()=>{btn.textContent=orig;}, 1500);
}

// ═══════════════════════════════════════════════════════════════
// CSV UPLOAD
// ═══════════════════════════════════════════════════════════════
function handleCsvDrop(e){
  e.preventDefault();
  document.getElementById('csvDrop').classList.remove('over');
  const file = e.dataTransfer.files[0];
  if(file) parseCsvFile(file);
}
function handleCsvFile(e){
  const file = e.target.files[0];
  if(file) parseCsvFile(file);
}

function parseCsvFile(file){
  const reader = new FileReader();
  reader.onload = (e) => {
    const text = e.target.result;
    const lines = text.split(/\r?\n/).filter(l=>l.trim());
    if(lines.length < 2){ alert('CSV appears empty or missing data rows.'); return; }

    const headers = lines[0].split(',').map(h=>h.trim().toLowerCase());
    const emailIdx = headers.findIndex(h=>h.includes('email'));
    const badgeIdx = headers.findIndex(h=>h.includes('badge'));

    if(emailIdx === -1 || badgeIdx === -1){
      alert('Could not find "Email" and "Badges" columns. Please check your CSV headers.');
      return;
    }

    const rows = lines.slice(1).map(line=>{
      const cols = line.split(',').map(c=>c.trim());
      return { email: cols[emailIdx], badges: parseInt(cols[badgeIdx])||0 };
    }).filter(r=>r.email);

    // Match against existing athletes
    const emailToUid = {};
    Object.entries(athletes).forEach(([uid,a])=>{
      if(a.email) emailToUid[a.email.toLowerCase()] = uid;
    });

    csvParsedData = rows.map(r=>{
      const uid = emailToUid[r.email.toLowerCase()];
      return { ...r, uid, matched: !!uid, name: uid ? athletes[uid].name : null };
    });

    renderCsvPreview();
  };
  reader.readAsText(file);
}

function renderCsvPreview(){
  const el = document.getElementById('csvPreviewArea');
  if(!csvParsedData || !csvParsedData.length){ el.innerHTML=''; return; }

  const matchedCount = csvParsedData.filter(r=>r.matched).length;
  const unmatchedCount = csvParsedData.length - matchedCount;

  el.innerHTML = `
    <p style="font-size:12px;color:var(--ink-dim);margin:14px 0 6px;font-weight:700;">
      ${matchedCount} matched <span style="color:var(--teal)">✓</span>
      ${unmatchedCount ? `&middot; ${unmatchedCount} not found <span style="color:var(--coral)">✗</span>` : ''}
    </p>
    <div style="overflow-x:auto">
      <table class="csv-preview-table">
        <thead><tr><th>Email</th><th>Name</th><th>New Badges</th><th>Status</th></tr></thead>
        <tbody>
          ${csvParsedData.map(r=>`
            <tr>
              <td>${esc(r.email)}</td>
              <td>${r.matched?esc(r.name):'—'}</td>
              <td>${r.badges}</td>
              <td class="${r.matched?'csv-match-ok':'csv-match-bad'}">${r.matched?'✓ Matched':'✗ No account found'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    ${matchedCount ? `<button class="btn-save-avatar" style="margin-top:16px;max-width:280px;" onclick="confirmCsvImport()">Import ${matchedCount} Badge Update${matchedCount!==1?'s':''}</button>` : ''}
  `;
}

async function confirmCsvImport(){
  if(!csvParsedData) return;
  const matched = csvParsedData.filter(r=>r.matched);
  const updates = {};
  matched.forEach(r=>{ updates[r.uid] = r.badges; });
  await dbUpd('lb_badges', updates);
  alert(`✅ Updated badge counts for ${matched.length} athlete(s)!`);
  csvParsedData = null;
  document.getElementById('csvFileInput').value = '';
  renderAdminTabContent();
}


// ═══════════════════════════════════════════════════════════════
// BULK ATHLETE IMPORT (from spreadsheet)
// ═══════════════════════════════════════════════════════════════
const TEMP_PASSWORD = 'insynch2026';
let athleteCsvData = null;

function handleAthleteCsvDrop(e){
  e.preventDefault();
  document.getElementById('athleteCsvDrop').classList.remove('over');
  const file = e.dataTransfer.files[0];
  if(file) parseAthleteCsv(file);
}
function handleAthleteCsvFile(e){
  const file = e.target.files[0];
  if(file) parseAthleteCsv(file);
}

function parseAthleteCsv(file){
  const reader = new FileReader();
  reader.onload = (e) => {
    const text = e.target.result;
    const lines = text.split(/\r?\n/).filter(l=>l.trim());
    if(lines.length < 2){ alert('CSV appears empty or missing data rows.'); return; }

    const headers = lines[0].split(',').map(h=>h.trim().toLowerCase());
    const nameIdx = headers.findIndex(h=>h.includes('name'));
    const clubIdx = headers.findIndex(h=>h.includes('club'));
    const emailIdx = headers.findIndex(h=>h.includes('email'));
    const badgeIdx = headers.findIndex(h=>h.includes('badge'));

    if(nameIdx === -1 || emailIdx === -1){
      alert('Could not find "Name" and "Email" columns. Please check your CSV headers.');
      return;
    }

    const existingEmails = new Set(Object.values(athletes).map(a=>(a.email||'').toLowerCase()));

    athleteCsvData = lines.slice(1).map(line=>{
      const cols = line.split(',').map(c=>c.trim());
      const email = cols[emailIdx] || '';
      return {
        name: cols[nameIdx] || '',
        club: clubIdx>-1 ? (cols[clubIdx]||'') : '',
        email: email,
        badges: badgeIdx>-1 ? (parseInt(cols[badgeIdx])||0) : 0,
        alreadyExists: existingEmails.has(email.toLowerCase()),
      };
    }).filter(r=>r.name && r.email);

    renderAthleteCsvPreview();
  };
  reader.readAsText(file);
}

function renderAthleteCsvPreview(){
  const el = document.getElementById('athleteCsvPreviewArea');
  if(!athleteCsvData || !athleteCsvData.length){ el.innerHTML=''; return; }

  const newCount = athleteCsvData.filter(r=>!r.alreadyExists).length;
  const existingCount = athleteCsvData.length - newCount;

  el.innerHTML = `
    <p style="font-size:12px;color:var(--ink-dim);margin:14px 0 6px;font-weight:700;">
      ${newCount} new account${newCount!==1?'s':''} to create
      ${existingCount ? `&middot; ${existingCount} already exist (will be skipped)` : ''}
    </p>
    <div style="overflow-x:auto">
      <table class="csv-preview-table">
        <thead><tr><th>Name</th><th>Club</th><th>Email</th><th>Badges</th><th>Status</th></tr></thead>
        <tbody>
          ${athleteCsvData.map(r=>`
            <tr>
              <td>${esc(r.name)}</td>
              <td>${esc(r.club)}</td>
              <td>${esc(r.email)}</td>
              <td>${r.badges}</td>
              <td class="${r.alreadyExists?'csv-match-bad':'csv-match-ok'}">${r.alreadyExists?'Already exists':'✓ Will create'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    ${newCount ? `
      <p style="font-size:11px;color:var(--ink-faint);margin-top:12px;">All new accounts will use the temporary password <strong style="color:var(--teal)">${TEMP_PASSWORD}</strong> and will be asked to set their own password on first login.</p>
      <button class="btn-save-avatar" style="margin-top:10px;max-width:320px;" id="btnRunAthleteImport" onclick="runAthleteImport()">Create ${newCount} Athlete Account${newCount!==1?'s':''}</button>
      <div id="athleteImportStatus" style="margin-top:10px;font-size:12px;font-weight:700;"></div>
    ` : ''}
  `;
}

async function runAthleteImport(){
  const btn = document.getElementById('btnRunAthleteImport');
  const statusEl = document.getElementById('athleteImportStatus');
  const toCreate = athleteCsvData.filter(r=>!r.alreadyExists);
  btn.disabled = true;
  btn.textContent = 'Creating accounts...';

  let created = 0, failed = [];
  for(const row of toCreate){
    try{
      const res = await fetch('https://identitytoolkit.googleapis.com/v1/accounts:signUp?key='+window._auth.app.options.apiKey, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ email: row.email, password: TEMP_PASSWORD, returnSecureToken: true })
      });
      const data = await res.json();
      if(data.error){ failed.push(row.name + ' (' + data.error.message + ')'); continue; }
      await dbSet('lb_users/'+data.localId, {
        name: row.name, club: row.club, email: row.email, role: 'athlete',
        avatar: DEFAULT_AVATAR, mustChangePassword: true, createdAt: Date.now()
      });
      await dbSet('lb_badges/'+data.localId, row.badges);
      created++;
      statusEl.textContent = `Created ${created} / ${toCreate.length}...`;
    } catch(ex){
      failed.push(row.name + ' (' + ex.message + ')');
    }
  }

  statusEl.innerHTML = `✅ Created ${created} account${created!==1?'s':''} successfully.` +
    (failed.length ? `<br>⚠️ ${failed.length} failed: ${failed.join(', ')}` : '');
  btn.textContent = 'Done!';
  athleteCsvData = null;
  setTimeout(()=>{ renderAdminTabContent(); }, 2500);
}


async function handleClubLogoUpload(logoKey, clubName, inputEl){
  const file = inputEl.files[0];
  if(!file) return;
  if(file.size > 2*1024*1024){ alert('Logo image must be under 2MB.'); return; }
  const reader = new FileReader();
  reader.onload = async (e) => {
    const dataUrl = e.target.result;
    await dbSet('lb_club_logos/'+logoKey, dataUrl);
    renderAdminTabContent();
  };
  reader.readAsDataURL(file);
}

// ═══════════════════════════════════════════════════════════════
// MODAL HELPERS
// ═══════════════════════════════════════════════════════════════
function openModal(id){ document.getElementById(id).classList.add('open'); }
function closeModal(id){ document.getElementById(id).classList.remove('open'); }
document.addEventListener('DOMContentLoaded', ()=>{
  document.querySelectorAll('.bkdrop').forEach(b=>b.addEventListener('click', e=>{ if(e.target===b) b.classList.remove('open'); }));
});

switchAuthTab('signin');
