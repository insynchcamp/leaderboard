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
const SKIN_TONES = ['#ffe0c2','#ffcc99','#e8b389','#c68642','#8d5524','#5c3a21'];
const HAIR_COLORS = ['#2b1b12','#5a3825','#8a5a2e','#c9a13b','#e8d3a0','#d6453d','#9b4fc9','#4a4a4a','#e8e8e8'];
const SUIT_COLORS = ['#ff6b81','#2ee6c8','#a78bfa','#ffc857','#4a9fff','#ff8fa0','#1b3270','#ffffff'];
const HAIR_STYLES = [
  {id:'short', emoji:'💇'},
  {id:'long', emoji:'👩'},
  {id:'bun', emoji:'🩰'},
  {id:'curly', emoji:'🦱'},
  {id:'pigtails', emoji:'👧'},
  {id:'ponytail', emoji:'🎀'},
];
const ACCESSORIES = [
  {id:'none', emoji:'🚫'},
  {id:'goggles', emoji:'🥽'},
  {id:'cap', emoji:'🧢'},
  {id:'flower', emoji:'🌸'},
  {id:'star', emoji:'⭐'},
  {id:'glasses', emoji:'👓'},
];
const EXPRESSIONS = [
  {id:'happy', emoji:'😊'},
  {id:'excited', emoji:'😄'},
  {id:'cool', emoji:'😎'},
  {id:'wink', emoji:'😉'},
  {id:'star-eyes', emoji:'🤩'},
];

const DEFAULT_AVATAR = {
  skin: SKIN_TONES[1],
  hairColor: HAIR_COLORS[0],
  hairStyle: 'short',
  suitColor: SUIT_COLORS[0],
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
  const suitColor = av.suitColor || DEFAULT_AVATAR.suitColor;
  const accessory = av.accessory || DEFAULT_AVATAR.accessory;
  const expression = av.expression || DEFAULT_AVATAR.expression;

  // Face expressions
  let face = '';
  if(expression === 'happy'){
    face = `<circle cx="78" cy="95" r="4" fill="#2a2a2a"/><circle cx="122" cy="95" r="4" fill="#2a2a2a"/><path d="M82 112 Q100 124 118 112" stroke="#2a2a2a" stroke-width="3.5" fill="none" stroke-linecap="round"/>`;
  } else if(expression === 'excited'){
    face = `<circle cx="78" cy="95" r="5" fill="#2a2a2a"/><circle cx="122" cy="95" r="5" fill="#2a2a2a"/><ellipse cx="100" cy="115" rx="13" ry="9" fill="#2a2a2a"/><ellipse cx="100" cy="112" rx="9" ry="5" fill="#fff"/>`;
  } else if(expression === 'cool'){
    face = `<rect x="68" y="88" width="64" height="14" rx="7" fill="#2a2a2a"/><rect x="70" y="90" width="26" height="10" rx="5" fill="#4a9fff" opacity="0.6"/><rect x="104" y="90" width="26" height="10" rx="5" fill="#4a9fff" opacity="0.6"/><path d="M85 115 Q100 122 115 115" stroke="#2a2a2a" stroke-width="3.5" fill="none" stroke-linecap="round"/>`;
  } else if(expression === 'wink'){
    face = `<circle cx="78" cy="95" r="4" fill="#2a2a2a"/><path d="M115 95 Q122 92 129 95" stroke="#2a2a2a" stroke-width="3.5" fill="none" stroke-linecap="round"/><path d="M82 112 Q100 124 118 112" stroke="#2a2a2a" stroke-width="3.5" fill="none" stroke-linecap="round"/>`;
  } else if(expression === 'star-eyes'){
    face = `<path d="M78 90l2.5 5.5 6 1-4.5 4 1 6-5-3-5 3 1-6-4.5-4 6-1z" fill="#ffc857"/><path d="M122 90l2.5 5.5 6 1-4.5 4 1 6-5-3-5 3 1-6-4.5-4 6-1z" fill="#ffc857"/><ellipse cx="100" cy="115" rx="11" ry="8" fill="#2a2a2a"/>`;
  }

  // Hair styles (rendered behind/around head)
  let hairBack = '', hairFront = '';
  if(hairStyle === 'short'){
    hairFront = `<path d="M58 75 Q60 38 100 35 Q140 38 142 75 Q130 60 100 58 Q70 60 58 75 Z" fill="${hairColor}"/>`;
  } else if(hairStyle === 'long'){
    hairBack = `<path d="M55 80 Q50 140 60 175 L75 175 Q68 130 70 85 Z" fill="${hairColor}"/><path d="M145 80 Q150 140 140 175 L125 175 Q132 130 130 85 Z" fill="${hairColor}"/>`;
    hairFront = `<path d="M58 75 Q60 36 100 33 Q140 36 142 75 Q130 58 100 56 Q70 58 58 75 Z" fill="${hairColor}"/>`;
  } else if(hairStyle === 'bun'){
    hairBack = `<circle cx="100" cy="32" r="16" fill="${hairColor}"/>`;
    hairFront = `<path d="M58 75 Q60 40 100 38 Q140 40 142 75 Q130 60 100 58 Q70 60 58 75 Z" fill="${hairColor}"/>`;
  } else if(hairStyle === 'curly'){
    hairFront = `<circle cx="65" cy="55" r="14" fill="${hairColor}"/><circle cx="80" cy="42" r="15" fill="${hairColor}"/><circle cx="100" cy="36" r="16" fill="${hairColor}"/><circle cx="120" cy="42" r="15" fill="${hairColor}"/><circle cx="135" cy="55" r="14" fill="${hairColor}"/><circle cx="142" cy="72" r="12" fill="${hairColor}"/><circle cx="58" cy="72" r="12" fill="${hairColor}"/>`;
  } else if(hairStyle === 'pigtails'){
    hairBack = `<circle cx="48" cy="90" r="15" fill="${hairColor}"/><circle cx="152" cy="90" r="15" fill="${hairColor}"/><rect x="40" y="75" width="16" height="20" rx="8" fill="${hairColor}"/><rect x="144" y="75" width="16" height="20" rx="8" fill="${hairColor}"/>`;
    hairFront = `<path d="M58 75 Q60 38 100 35 Q140 38 142 75 Q130 60 100 58 Q70 60 58 75 Z" fill="${hairColor}"/>`;
  } else if(hairStyle === 'ponytail'){
    hairBack = `<path d="M138 70 Q165 80 158 130 Q154 140 145 132 Q150 95 130 78 Z" fill="${hairColor}"/>`;
    hairFront = `<path d="M58 75 Q60 38 100 35 Q140 38 142 75 Q130 60 100 58 Q70 60 58 75 Z" fill="${hairColor}"/>`;
  }

  // Accessories
  let accessoryEl = '';
  if(accessory === 'goggles'){
    accessoryEl = `<rect x="66" y="86" width="30" height="20" rx="10" fill="#1b3270" opacity="0.85"/><rect x="104" y="86" width="30" height="20" rx="10" fill="#1b3270" opacity="0.85"/><rect x="94" y="92" width="12" height="6" fill="#1b3270" opacity="0.85"/><circle cx="81" cy="96" r="8" fill="#7dd8ff" opacity="0.5"/><circle cx="119" cy="96" r="8" fill="#7dd8ff" opacity="0.5"/>`;
  } else if(accessory === 'cap'){
    accessoryEl = `<path d="M55 68 Q60 30 100 28 Q140 30 145 68 Q145 58 100 55 Q55 58 55 68 Z" fill="${suitColor}"/><ellipse cx="100" cy="55" rx="46" ry="9" fill="${suitColor}"/>`;
  } else if(accessory === 'flower'){
    accessoryEl = `<g transform="translate(128,48)"><circle cx="0" cy="-8" r="6" fill="#ff6b81"/><circle cx="7" cy="-3" r="6" fill="#ff6b81"/><circle cx="7" cy="6" r="6" fill="#ff6b81"/><circle cx="0" cy="10" r="6" fill="#ff6b81"/><circle cx="-7" cy="3" r="6" fill="#ff6b81"/><circle cx="0" cy="1" r="5" fill="#ffc857"/></g>`;
  } else if(accessory === 'star'){
    accessoryEl = `<g transform="translate(135,55)"><path d="M0 -10l3 7 7 1-5 5 1 7-6-4-6 4 1-7-5-5 7-1z" fill="#ffc857"/></g>`;
  } else if(accessory === 'glasses'){
    accessoryEl = `<circle cx="81" cy="96" r="13" fill="none" stroke="#2a2a2a" stroke-width="3"/><circle cx="119" cy="96" r="13" fill="none" stroke="#2a2a2a" stroke-width="3"/><line x1="94" y1="96" x2="106" y2="96" stroke="#2a2a2a" stroke-width="3"/>`;
  }

  return `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
    <circle cx="100" cy="100" r="100" fill="#eef2ff"/>
    ${hairBack}
    <!-- Neck -->
    <rect x="88" y="140" width="24" height="20" fill="${skin}"/>
    <!-- Swimsuit shoulders -->
    <path d="M55 200 Q55 155 100 155 Q145 155 145 200 Z" fill="${suitColor}"/>
    <!-- Head -->
    <ellipse cx="100" cy="100" rx="44" ry="48" fill="${skin}"/>
    <!-- Ears -->
    <ellipse cx="56" cy="100" rx="7" ry="10" fill="${skin}"/>
    <ellipse cx="144" cy="100" rx="7" ry="10" fill="${skin}"/>
    ${face}
    <!-- Cheeks -->
    <ellipse cx="70" cy="108" rx="7" ry="4" fill="#ff8fa0" opacity="0.35"/>
    <ellipse cx="130" cy="108" rx="7" ry="4" fill="#ff8fa0" opacity="0.35"/>
    ${hairFront}
    ${accessoryEl}
  </svg>`;
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
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('appScreen').style.display = 'flex';
  applyRole();
  subscribeData();
  showPage('leaderboard');
};

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
function subscribeData(){
  if(unsubAthletes) unsubAthletes();
  if(unsubBadges) unsubBadges();
  unsubAthletes = dbOn('lb_users', data=>{
    athletes = data || {};
    renderCurrentPage();
  });
  unsubBadges = dbOn('lb_badges', data=>{
    badges = data || {};
    renderCurrentPage();
  });
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
      <div class="podium-avatar-ring">${crown}${renderAvatarSVG(athlete.avatar)}</div>
      <div class="podium-name">${esc(athlete.name)}</div>
      <div class="podium-club">${esc(athlete.club||'')}</div>
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
      <div class="athlete-card-avatar">${renderAvatarSVG(a.avatar)}</div>
      <div class="athlete-card-name">${esc(a.name)}</div>
      <div class="athlete-card-club">${esc(a.club||'')}</div>
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
    return `<tr><td><span class="club-rank-badge ${badgeClass}">${c.rank}</span></td><td>${esc(c.club)}</td><td style="color:var(--gold);font-weight:700">${c.total}</td></tr>`;
  }).join('');

  const fullRankingsHtml = ranked.map((a,i)=>{
    const isMe = CU && a.uid === CU.uid;
    return `<div class="rank-row ${isMe?'is-me':''}">
      <div class="rank-num">${i+1}</div>
      <div class="rank-avatar">${renderAvatarSVG(a.avatar)}</div>
      <div class="rank-info">
        <div class="rank-name">${esc(a.name)}${isMe?' (You)':''}</div>
        <div class="rank-club">${esc(a.club||'')}</div>
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
            <h4>Skin Tone</h4>
            <div class="swatch-row" id="skinSwatches"></div>
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
            <h4>Swimsuit Colour</h4>
            <div class="swatch-row" id="suitSwatches"></div>
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
  skinEl.innerHTML = SKIN_TONES.map(c=>`<div class="swatch ${curAvatarDraft.skin===c?'selected':''}" style="background:${c}" onclick="updateAvatarField('skin','${c}')"></div>`).join('');

  const hairColorEl = document.getElementById('hairColorSwatches');
  hairColorEl.innerHTML = HAIR_COLORS.map(c=>`<div class="swatch ${curAvatarDraft.hairColor===c?'selected':''}" style="background:${c}" onclick="updateAvatarField('hairColor','${c}')"></div>`).join('');

  const suitEl = document.getElementById('suitSwatches');
  suitEl.innerHTML = SUIT_COLORS.map(c=>`<div class="swatch ${curAvatarDraft.suitColor===c?'selected':''}" style="background:${c};border:${c==='#ffffff'?'2px solid #ccc':'3px solid transparent'}" onclick="updateAvatarField('suitColor','${c}')"></div>`).join('');

  const hairStyleEl = document.getElementById('hairStyleTiles');
  hairStyleEl.innerHTML = HAIR_STYLES.map(h=>`<div class="option-tile ${curAvatarDraft.hairStyle===h.id?'selected':''}" onclick="updateAvatarField('hairStyle','${h.id}')">${h.emoji}</div>`).join('');

  const exprEl = document.getElementById('expressionTiles');
  exprEl.innerHTML = EXPRESSIONS.map(x=>`<div class="option-tile ${curAvatarDraft.expression===x.id?'selected':''}" onclick="updateAvatarField('expression','${x.id}')">${x.emoji}</div>`).join('');

  const accEl = document.getElementById('accessoryTiles');
  accEl.innerHTML = ACCESSORIES.map(a=>`<div class="option-tile ${curAvatarDraft.accessory===a.id?'selected':''}" onclick="updateAvatarField('accessory','${a.id}')">${a.emoji}</div>`).join('');
}

function updateAvatarField(field, value){
  curAvatarDraft[field] = value;
  document.getElementById('avatarPreviewCircle').innerHTML = renderAvatarSVG(curAvatarDraft);
  buildAvatarOptionPickers();
}

async function saveAvatar(){
  if(!CU || isAdmin) return;
  await dbUpd('lb_users/'+CU.uid, {avatar: curAvatarDraft});
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
      <p>Update athlete badge counts manually or upload a spreadsheet each week</p>
    </div>
    <div class="admin-tabs">
      <button class="admin-subtab ${curAdminTab==='manual'?'active':''}" onclick="switchAdminTab('manual')">✍️ Manual Entry</button>
      <button class="admin-subtab ${curAdminTab==='upload'?'active':''}" onclick="switchAdminTab('upload')">📥 Spreadsheet Upload</button>
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
          <div class="admin-athlete-avatar">${renderAvatarSVG(a.avatar)}</div>
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

  else if(curAdminTab === 'accounts'){
    const ranked = getRankedAthletes();
    el.innerHTML = `<div class="lb-section">
      <div class="lb-section-hdr"><h2>All Athlete Accounts</h2><span style="font-size:11px;color:var(--ink-faint)">${ranked.length} athletes</span></div>
      ${ranked.length ? ranked.map(a=>`
        <div class="admin-athlete-row">
          <div class="admin-athlete-avatar">${renderAvatarSVG(a.avatar)}</div>
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
// MODAL HELPERS
// ═══════════════════════════════════════════════════════════════
function openModal(id){ document.getElementById(id).classList.add('open'); }
function closeModal(id){ document.getElementById(id).classList.remove('open'); }
document.addEventListener('DOMContentLoaded', ()=>{
  document.querySelectorAll('.bkdrop').forEach(b=>b.addEventListener('click', e=>{ if(e.target===b) b.classList.remove('open'); }));
});

switchAuthTab('signin');
