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

// Avatar options — powered by DiceBear Avataaars (https://www.dicebear.com/styles/avataaars/)
const DICEBEAR_BASE = 'https://api.dicebear.com/9.x/avataaars/svg';

const SKIN_TONES = [
  {id:'tanned',   hex:'FD9841'},
  {id:'yellow',   hex:'F8D25C'},
  {id:'pale',     hex:'FFDBB4'},
  {id:'light',    hex:'EDB98A'},
  {id:'brown',    hex:'D08B5B'},
  {id:'darkBrown',hex:'AE5D29'},
  {id:'black',    hex:'614335'},
];

const HAIR_COLORS = [
  {id:'auburn',      hex:'A55728'},
  {id:'black',       hex:'2C1B18'},
  {id:'blonde',      hex:'B89778'},
  {id:'blondeGolden',hex:'D6B370'},
  {id:'brown',       hex:'724133'},
  {id:'brownDark',   hex:'4A312C'},
  {id:'pastelPink',  hex:'F59797'},
  {id:'platinum',    hex:'ECDCBF'},
  {id:'red',         hex:'C93305'},
  {id:'silverGray',  hex:'E8E1E1'},
];

// Verified against https://github.com/HB0N0/AvataaarsJs (mirrors official Avataaars option set)
const HAIR_STYLES = [
  {id:'shortFlat',           label:'Short Flat'},
  {id:'shortCurly',          label:'Short Curly'},
  {id:'shortWaved',          label:'Short Waved'},
  {id:'shortRound',          label:'Short Round'},
  {id:'theCaesar',           label:'Caesar Crop'},
  {id:'theCaesarAndSidePart',label:'Caesar Side Part'},
  {id:'frizzle',             label:'Frizzle'},
  {id:'shaggy',              label:'Shaggy'},
  {id:'shaggyMullet',        label:'Shaggy Mullet'},
  {id:'sides',               label:'Buzzed Sides'},
  {id:'dreads01',            label:'Dreads'},
  {id:'dreads02',            label:'Dreads Long'},
  {id:'straight01',          label:'Long Straight'},
  {id:'straight02',          label:'Long Straight 2'},
  {id:'straightAndStrand',   label:'Straight & Strand'},
  {id:'curly',               label:'Long Curly'},
  {id:'curvy',               label:'Long Curvy'},
  {id:'bob',                 label:'Bob'},
  {id:'bun',                 label:'Bun'},
  {id:'fro',                 label:'Afro'},
  {id:'froAndBand',          label:'Afro & Band'},
  {id:'bigHair',             label:'Big Hair'},
  {id:'frida',               label:'Braided Crown'},
  {id:'miaWallace',          label:'Bob & Bangs'},
  {id:'longButNotTooLong',   label:'Medium Length'},
];

const EXPRESSIONS = [
  {id:'happy',   mouth:'smile',     eyes:'default',   eyebrow:'default',       label:'Happy'},
  {id:'excited', mouth:'twinkle',   eyes:'happy',     eyebrow:'raisedExcited', label:'Excited'},
  {id:'cool',    mouth:'smile',     eyes:'wink',      eyebrow:'upDown',        label:'Cool'},
  {id:'laugh',   mouth:'disbelief', eyes:'squint',    eyebrow:'defaultNatural',label:'Laughing'},
  {id:'serious', mouth:'serious',   eyes:'default',   eyebrow:'sadConcerned',  label:'Focused'},
  {id:'cheeky',  mouth:'grimace',   eyes:'surprised', eyebrow:'upDown',        label:'Cheeky'},
];

const ACCESSORIES = [
  {id:'blank',          label:'None'},
  {id:'round',          label:'Round Glasses'},
  {id:'prescription02', label:'Glasses'},
  {id:'sunglasses',     label:'Sunglasses'},
  {id:'wayfarers',      label:'Wayfarers'},
];

const CLOTHING_COLORS = [
  {id:'black',     hex:'262E33'},
  {id:'blue03',    hex:'65C9FF'},
  {id:'gray02',    hex:'929598'},
  {id:'heather',   hex:'3C4F5C'},
  {id:'pastelBlue',hex:'B1E2FF'},
  {id:'pastelGreen',hex:'A7FFC4'},
  {id:'pink',      hex:'FF488E'},
  {id:'red',       hex:'FF5C5C'},
  {id:'white',     hex:'FFFFFF'},
];

const DEFAULT_AVATAR = {
  skin: 'light',
  hairColor: 'brownDark',
  hairStyle: 'shortFlat',
  expression: 'happy',
  accessory: 'blank',
  clothingColor: 'blue03',
  logoChoice: 'insynch',  // 'insynch' or 'club'
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
function buildAvatarUrl(av){
  av = av || DEFAULT_AVATAR;

  // Defensive lookups: if a saved value doesn't match any known option
  // (e.g. leftover data from an earlier version of the avatar builder),
  // silently fall back to the default instead of sending a bad value to the API.
  const skinObj = SKIN_TONES.find(s=>s.id===av.skin) || SKIN_TONES.find(s=>s.id===DEFAULT_AVATAR.skin);
  const hairColorObj = HAIR_COLORS.find(h=>h.id===av.hairColor) || HAIR_COLORS.find(h=>h.id===DEFAULT_AVATAR.hairColor);
  const clothColorObj = CLOTHING_COLORS.find(c=>c.id===av.clothingColor) || CLOTHING_COLORS.find(c=>c.id===DEFAULT_AVATAR.clothingColor);
  const exprObj = EXPRESSIONS.find(e=>e.id===av.expression) || EXPRESSIONS.find(e=>e.id===DEFAULT_AVATAR.expression);
  const hairStyleObj = HAIR_STYLES.find(h=>h.id===av.hairStyle);
  const hairStyle = hairStyleObj ? hairStyleObj.id : DEFAULT_AVATAR.hairStyle;
  const accessoryObj = ACCESSORIES.find(a=>a.id===av.accessory);
  const accessory = accessoryObj ? accessoryObj.id : DEFAULT_AVATAR.accessory;

  const params = new URLSearchParams();
  params.set('seed', 'static');
  params.set('top', hairStyle);
  params.set('topProbability', '100');
  params.set('hairColor', hairColorObj.hex);
  params.set('hairColorProbability', '100');
  params.set('skinColor', skinObj.hex);
  params.set('clothing', 'shirtCrewNeck');
  params.set('clothesColor', clothColorObj.hex);
  params.set('mouth', exprObj.mouth);
  params.set('mouthProbability', '100');
  params.set('eyes', exprObj.eyes);
  params.set('eyesProbability', '100');
  params.set('eyebrows', exprObj.eyebrow);
  params.set('eyebrowsProbability', '100');
  // Only send accessories params when an actual accessory is chosen.
  // Omitting the param entirely (rather than sending an empty/blank value)
  // avoids enum-validation errors from the API for the "none" case.
  if(accessory && accessory !== 'blank'){
    params.set('accessories', accessory);
    params.set('accessoriesProbability', '100');
  }
  params.set('facialHairProbability', '0');
  params.set('backgroundColor', 'transparent');

  return DICEBEAR_BASE + '?' + params.toString();
}

const INSYNCH_LOGO_URL = 'https://i.ibb.co/4n7TcPdP/Front-in-synch.png';

function avatarBadgeHTML(av, size){
  size = size || 40;
  const logoChoice = (av && av.logoChoice) || DEFAULT_AVATAR.logoChoice;
  const clubLogoUrl = av && av._clubLogoUrl;
  const badgeSize = Math.max(14, Math.round(size * 0.34));
  const logoUrl = (logoChoice === 'club' && clubLogoUrl) ? clubLogoUrl : INSYNCH_LOGO_URL;
  return `<div style="position:absolute;bottom:-2px;right:-2px;width:${badgeSize}px;height:${badgeSize}px;border-radius:50%;background:#000;border:2px solid var(--bg-deep);overflow:hidden;display:flex;align-items:center;justify-content:center;">
    <img src="${logoUrl}" style="width:100%;height:100%;object-fit:cover;" loading="lazy" alt="">
  </div>`;
}

function renderAvatarSVG(av, size){
  size = size || 40;
  const url = buildAvatarUrl(av);
  return `<div style="position:relative;width:${size}px;height:${size}px;flex-shrink:0;">
    <div style="width:100%;height:100%;border-radius:50%;overflow:hidden;background:#eef2ff;">
      <img src="${url}" style="width:100%;height:100%;object-fit:cover;" loading="lazy" alt="">
    </div>
    ${avatarBadgeHTML(av, size)}
  </div>`;
}

function avatarThumbHTML(av, size){
  return renderAvatarSVG(av, size||40);
}

function renderAthleteAvatar(athlete, size){
  if(!athlete) return renderAvatarSVG(DEFAULT_AVATAR, size);
  const av = {...(athlete.avatar||DEFAULT_AVATAR)};
  av._clubName = athlete.club || '';
  av._clubLogoUrl = getClubLogo(athlete.club);
  return renderAvatarSVG(av, size);
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
      document.getElementById('userChipAvatar').innerHTML = renderAvatarSVG(av, 26);
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
      <div class="podium-avatar-ring">${crown}${renderAthleteAvatar(athlete, rankNum===1?90:72)}</div>
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
      <div class="athlete-card-avatar">${renderAthleteAvatar(a, 54)}</div>
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
      <div class="rank-avatar">${renderAthleteAvatar(a, 38)}</div>
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
      <div class="profile-avatar-big" id="profileAvatarBig">${renderAvatarSVG(curAvatarDraft, 130)}</div>
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
          <div class="avatar-preview-circle" id="avatarPreviewCircle">${renderAvatarSVG(curAvatarDraft, 192)}</div>
          <button class="btn-save-avatar" onclick="saveAvatar()">💾 Save Avatar</button>
        </div>
        <div class="avatar-options">
          <div class="avatar-option-group">
            <h4>Sweatshirt Logo</h4>
            <div class="logo-choice-row" id="logoChoiceRow"></div>
          </div>
          <div class="avatar-option-group">
            <h4>Sweatshirt Colour</h4>
            <div class="swatch-row" id="clothingColorSwatches"></div>
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

function miniAvatarPreviewUrl(overrides){
  const merged = {...curAvatarDraft, ...overrides};
  return buildAvatarUrl(merged);
}

function buildAvatarOptionPickers(){
  // Skin tone — small live-preview face swatches
  const skinEl = document.getElementById('skinSwatches');
  if(skinEl) skinEl.innerHTML = SKIN_TONES.map(s=>`<div class="swatch ${curAvatarDraft.skin===s.id?'selected':''}" style="background:#${s.hex}" onclick="updateAvatarField('skin','${s.id}')" title="${s.id}"></div>`).join('');

  // Hair colour swatches
  const hairColorEl = document.getElementById('hairColorSwatches');
  if(hairColorEl) hairColorEl.innerHTML = HAIR_COLORS.map(c=>`<div class="swatch ${curAvatarDraft.hairColor===c.id?'selected':''}" style="background:#${c.hex}" onclick="updateAvatarField('hairColor','${c.id}')" title="${c.id}"></div>`).join('');

  // Hair style — mini avatar previews
  const hairStyleEl = document.getElementById('hairStyleTiles');
  if(hairStyleEl) hairStyleEl.innerHTML = HAIR_STYLES.map(h=>{
    const url = miniAvatarPreviewUrl({hairStyle:h.id});
    return `<div class="option-tile" title="${h.label}">
      <div class="option-tile-inner avatar-mini-tile ${curAvatarDraft.hairStyle===h.id?'selected':''}" onclick="updateAvatarField('hairStyle','${h.id}')">
        <img src="${url}" loading="lazy" alt="">
      </div>
      <div class="option-tile-label">${h.label}</div>
    </div>`;
  }).join('');

  // Expression — mini avatar previews
  const exprEl = document.getElementById('expressionTiles');
  if(exprEl) exprEl.innerHTML = EXPRESSIONS.map(x=>{
    const url = miniAvatarPreviewUrl({expression:x.id});
    return `<div class="option-tile" title="${x.label}">
      <div class="option-tile-inner avatar-mini-tile ${curAvatarDraft.expression===x.id?'selected':''}" onclick="updateAvatarField('expression','${x.id}')">
        <img src="${url}" loading="lazy" alt="">
      </div>
      <div class="option-tile-label">${x.label}</div>
    </div>`;
  }).join('');

  // Accessory — mini avatar previews
  const accEl = document.getElementById('accessoryTiles');
  if(accEl) accEl.innerHTML = ACCESSORIES.map(a=>{
    const url = miniAvatarPreviewUrl({accessory:a.id});
    return `<div class="option-tile" title="${a.label}">
      <div class="option-tile-inner avatar-mini-tile ${curAvatarDraft.accessory===a.id?'selected':''}" onclick="updateAvatarField('accessory','${a.id}')">
        <img src="${url}" loading="lazy" alt="">
      </div>
      <div class="option-tile-label">${a.label}</div>
    </div>`;
  }).join('');

  // Sweatshirt colour swatches
  const clothEl = document.getElementById('clothingColorSwatches');
  if(clothEl) clothEl.innerHTML = CLOTHING_COLORS.map(c=>`<div class="swatch ${curAvatarDraft.clothingColor===c.id?'selected':''}" style="background:#${c.hex};border:${c.hex==='FFFFFF'?'2px solid #ccc':'3px solid transparent'}" onclick="updateAvatarField('clothingColor','${c.id}')" title="${c.id}"></div>`).join('');

  // Logo choice
  const logoEl = document.getElementById('logoChoiceRow');
  if(logoEl){
    const hasClubLogo = !!curAvatarDraft._clubLogoUrl;
    logoEl.innerHTML = `
      <div class="logo-choice-tile ${curAvatarDraft.logoChoice==='insynch'?'selected':''}" onclick="updateAvatarField('logoChoice','insynch')">
        <div class="logo-choice-preview" style="background:#000;"><img src="${INSYNCH_LOGO_URL}"></div>
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
  document.getElementById('avatarPreviewCircle').innerHTML = renderAvatarSVG(curAvatarDraft, 192);
  buildAvatarOptionPickers();
}

async function saveAvatar(){
  if(!CU || isAdmin) return;
  // Strip internal club-context fields before saving — they're derived at render time
  const { _clubName, _clubLogoUrl, ...avatarToSave } = curAvatarDraft;
  await dbUpd('lb_users/'+CU.uid, {avatar: avatarToSave});
  document.getElementById('userChipAvatar').innerHTML = renderAvatarSVG(curAvatarDraft, 26);
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
          <div class="admin-athlete-avatar">${renderAthleteAvatar(a, 36)}</div>
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
          <div class="admin-athlete-avatar">${renderAthleteAvatar(a, 36)}</div>
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
