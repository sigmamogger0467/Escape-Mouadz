'use strict';
/* ================= Save slots (browser + cloud) ================= */
const SLOT_COUNT = 3;
const slotKey = i => 'mouadz_escapes_trump_slot' + i;
const slotCache = [];
function defaultSave(){
  return {v:2, coins:0, best:0, owned:['mouadz'], skin:'mouadz', chOwned:['classic'], chaser:'classic',
          muted:false, crates:1, stats:{}, missions:{}, savedAt:0,
          upgrades:{}, daily:{last:'', streak:0}, settings:{music:true, shadows:true}};
}
function sanitize(o){
  const d = defaultSave();
  if (!o || typeof o !== 'object') return d;
  const num = v => (typeof v === 'number' && isFinite(v) && v >= 0) ? Math.floor(v) : 0;
  d.coins = num(o.coins); d.best = num(o.best); d.crates = o.crates === undefined ? 1 : num(o.crates); d.savedAt = num(o.savedAt);
  d.muted = !!o.muted;
  if (Array.isArray(o.owned)) d.owned = [...new Set(['mouadz', ...o.owned.filter(id => SKINS.some(s => s.id === id))])];
  if (Array.isArray(o.chOwned)) d.chOwned = [...new Set(['classic', ...o.chOwned.filter(id => CHASERS.some(s => s.id === id))])];
  d.skin = d.owned.includes(o.skin) ? o.skin : 'mouadz';
  d.chaser = d.chOwned.includes(o.chaser) ? o.chaser : 'classic';
  if (o.stats && typeof o.stats === 'object') for (const k in o.stats) d.stats[k] = num(o.stats[k]);
  if (o.missions && typeof o.missions === 'object') for (const m of MISSIONS) d.missions[m.id] = Math.min(num(o.missions[m.id]), m.targets.length);
  if (o.upgrades && typeof o.upgrades === 'object') for (const u of UPGRADES) d.upgrades[u.id] = Math.min(num(o.upgrades[u.id]), UPGRADE_MAX);
  if (o.daily && typeof o.daily === 'object'){ d.daily.last = typeof o.daily.last === 'string' ? o.daily.last.slice(0, 10) : ''; d.daily.streak = Math.min(num(o.daily.streak), 10000); }
  if (o.settings && typeof o.settings === 'object'){ d.settings.music = o.settings.music !== false; d.settings.shadows = o.settings.shadows !== false; }
  return d;
}
function readSlot(i){
  try{ const r = localStorage.getItem(slotKey(i)); if (r) return sanitize(JSON.parse(r)); }catch(e){}
  return slotCache[i] ? sanitize(slotCache[i]) : null;
}
function writeSlot(i, d){
  slotCache[i] = JSON.parse(JSON.stringify(d));
  try{ localStorage.setItem(slotKey(i), JSON.stringify(d)); }catch(e){}
}
function migrateV1(){
  try{
    const g = k => { const v = localStorage.getItem('escrun_' + k); return v === null ? undefined : JSON.parse(v); };
    if (g('coins') === undefined && g('best') === undefined) return null;
    return sanitize({coins:g('coins'), best:g('best'), owned:g('owned'), skin:g('skin'), muted:g('muted'), crates:1});
  }catch(e){ return null; }
}
let slot = 0;
try{ slot = Math.min(SLOT_COUNT - 1, Math.max(0, parseInt(localStorage.getItem('mouadz_active_slot'), 10) || 0)); }catch(e){}
let save = readSlot(slot) || (slot === 0 && migrateV1()) || defaultSave();
function persist(){
  save.savedAt = Date.now();
  writeSlot(slot, save);
  try{ localStorage.setItem('mouadz_active_slot', String(slot)); }catch(e){}
  queueCloudSave();
}
function exportCode(){
  try{ return 'MET1-' + btoa(unescape(encodeURIComponent(JSON.stringify(save)))); }catch(e){ return ''; }
}
function importCode(code){
  const c = String(code || '').trim().replace(/\s+/g, '');
  if (!c.startsWith('MET1-')) throw new Error('prefix');
  const data = JSON.parse(decodeURIComponent(escape(atob(c.slice(5)))));
  if (!data || typeof data !== 'object' || data.v !== 2) throw new Error('format');
  return sanitize(data);
}

// Cloud save: one private document per player (data/users/<id>/game), kept by claude.ai.
const cloud = {ref:null, ready:false, writing:false, again:false, status:'local', timer:0};
function cloudDoc(){
  const slots = {};
  for (let i = 0; i < SLOT_COUNT; i++){ const d = i === slot ? save : readSlot(i); if (d) slots['s' + i] = d; }
  return {v:2, active:slot, updatedAt:Date.now(), slots};
}
function queueCloudSave(){
  if (!cloud.ready) return;
  clearTimeout(cloud.timer); cloud.timer = setTimeout(flushCloud, 1200);
}
async function flushCloud(){
  if (!cloud.ready) return;
  if (cloud.writing){ cloud.again = true; return; }
  cloud.writing = true;
  try{ await cloud.ref.set(cloudDoc()); cloud.status = 'cloud'; }
  catch(e){
    const code = e && e.code;
    cloud.status = code === 'invalid_argument' ? 'denied' : 'error';
    if (code === 'invalid_argument' || code === 'revoked' || code === 'not_granted') cloud.ready = false;
  }
  cloud.writing = false;
  updateCloudStatus();
  if (cloud.again){ cloud.again = false; queueCloudSave(); }
}
function mergeCloud(data){
  if (!data || typeof data !== 'object' || !data.slots || typeof data.slots !== 'object') return false;
  let replaced = false;
  for (let i = 0; i < SLOT_COUNT; i++){
    const raw = data.slots['s' + i]; if (!raw) continue;
    const remote = sanitize(raw), local = i === slot ? save : readSlot(i);
    if (!local || remote.savedAt > local.savedAt){
      writeSlot(i, remote);
      if (i === slot){ save = remote; replaced = true; }
    }
  }
  const ra = data.active;
  if (Number.isInteger(ra) && ra >= 0 && ra < SLOT_COUNT && ra !== slot){
    const r = readSlot(ra);
    if (r && r.savedAt > save.savedAt){
      slot = ra; save = r; replaced = true;
      try{ localStorage.setItem('mouadz_active_slot', String(slot)); }catch(e){}
    }
  }
  return replaced;
}
async function initCloud(){
  try{
    if (!window.claude || typeof window.claude.use !== 'function'){ updateCloudStatus(); return; }
    cloud.status = 'loading'; updateCloudStatus();
    const [db, user] = await Promise.all([window.claude.use('db'), window.claude.use('user')]);
    if (!db || !user){ cloud.status = 'local'; updateCloudStatus(); return; }
    const uid = await user.id();
    if (!uid){ cloud.status = 'local'; updateCloudStatus(); return; }
    cloud.ref = db.doc('data/users/' + uid + '/game');
    let snap;
    try{ snap = await cloud.ref.get(); }
    catch(e){ await new Promise(r => setTimeout(r, 600 + Math.random()*800)); snap = await cloud.ref.get(); }
    if (snap.exists && mergeCloud(snap.data())) onSaveReplaced();
    cloud.ready = true; cloud.status = 'cloud';
    flushCloud();
  }catch(e){ cloud.status = 'error'; }
  updateCloudStatus();
}
window.addEventListener('pagehide', () => {
  writeSlot(slot, save);
  if (cloud.ready){ clearTimeout(cloud.timer); flushCloud(); }
});

/* ================= Stats & missions ================= */
function addStat(k, n){ save.stats[k] = (save.stats[k] || 0) + n; }
function maxStat(k, v){ if (v > (save.stats[k] || 0)) save.stats[k] = Math.floor(v); }
function upgradesOwned(){ return UPGRADES.reduce((a, u) => a + (save.upgrades[u.id] || 0), 0); }
function getStat(m){
  if (m.stat === 'skinsOwned') return save.owned.length + save.chOwned.length;
  if (m.stat === 'upgradesOwned') return upgradesOwned();
  return Math.floor(save.stats[m.stat] || 0);
}
function missionLevels(){ return MISSIONS.reduce((a, m) => a + (save.missions[m.id] || 0), 0); }
function scoreMultiplier(){ return Math.min(20, 1 + Math.floor(missionLevels()/3)); }
function powerDur(id){ const u = UPGRADES.find(x => x.id === id); return u.base*(1 + .25*(save.upgrades[id] || 0)); }
function missionState(m){
  const lvl = save.missions[m.id] || 0, maxed = lvl >= m.targets.length;
  const target = m.targets[Math.min(lvl, m.targets.length - 1)], val = getStat(m);
  return {lvl, maxed, target, val, ready: !maxed && val >= target, reward: missionReward(m, lvl)};
}
const notified = new Set();
function markNotified(){ for (const m of MISSIONS){ const s = missionState(m); if (s.ready) notified.add(m.id + ':' + s.lvl); } }
markNotified();
function checkMissionToasts(){
  for (const m of MISSIONS){
    const s = missionState(m), key = m.id + ':' + s.lvl;
    if (s.ready && !notified.has(key)){ notified.add(key); toast('✅ Mission erfüllt: ' + m.text(s.target)); sfx('power'); }
  }
}
const readyCount = () => MISSIONS.filter(m => missionState(m).ready).length;

/* ================= Audio ================= */
let actx = null;
function sfx(type){
  if (save.muted) return;
  try{
    if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
    if (actx.state === 'suspended') actx.resume();
    const t = actx.currentTime, o = actx.createOscillator(), g = actx.createGain();
    o.connect(g); g.connect(actx.destination);
    const env = (v, len) => { g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0008, t + len); o.start(t); o.stop(t + len + 0.02); };
    switch(type){
      case 'coin':  o.type='square'; o.frequency.setValueAtTime(988,t); o.frequency.setValueAtTime(1319,t+.05); env(.045,.16); break;
      case 'jump':  o.type='sine'; o.frequency.setValueAtTime(280,t); o.frequency.exponentialRampToValueAtTime(720,t+.14); env(.12,.18); break;
      case 'slide': o.type='triangle'; o.frequency.setValueAtTime(420,t); o.frequency.exponentialRampToValueAtTime(140,t+.2); env(.12,.22); break;
      case 'hit':   o.type='sawtooth'; o.frequency.setValueAtTime(220,t); o.frequency.exponentialRampToValueAtTime(55,t+.3); env(.16,.32); break;
      case 'power': o.type='sine'; o.frequency.setValueAtTime(520,t); o.frequency.setValueAtTime(780,t+.07); o.frequency.setValueAtTime(1040,t+.14); env(.12,.3); break;
      case 'buy':   o.type='square'; o.frequency.setValueAtTime(660,t); o.frequency.setValueAtTime(990,t+.08); o.frequency.setValueAtTime(1320,t+.16); env(.06,.32); break;
      case 'siren': o.type='square'; o.frequency.setValueAtTime(700,t); o.frequency.linearRampToValueAtTime(950,t+.25); o.frequency.linearRampToValueAtTime(700,t+.5); env(.03,.55); break;
      case 'horn':  o.type='square'; o.frequency.setValueAtTime(330,t); o.frequency.setValueAtTime(415,t+.3); env(.07,.7); break;
      case 'whoosh': o.type='sine'; o.frequency.setValueAtTime(900,t); o.frequency.exponentialRampToValueAtTime(200,t+.3); env(.06,.32); break;
      case 'land':  o.type='triangle'; o.frequency.setValueAtTime(140,t); o.frequency.exponentialRampToValueAtTime(60,t+.1); env(.1,.12); break;
      case 'fired': o.type='sawtooth'; o.frequency.setValueAtTime(180,t); o.frequency.exponentialRampToValueAtTime(45,t+.9); env(.18,.95); break;
    }
  }catch(e){}
}


/* ================= Music: a small procedural loop that follows the current world ================= */
const music = {on:false, timer:0, step:0, next:0, gain:null, root:45};
const MUSIC_ROOTS = [45, 41, 43, 48, 47, 44]; // one key per world
function musicNote(freq, t, len, type, vol){
  const o = actx.createOscillator(), g = actx.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .01); g.gain.exponentialRampToValueAtTime(.0005, t + len);
  o.connect(g); g.connect(music.gain); o.start(t); o.stop(t + len + .05);
}
function musicNoise(t, len, vol, hp){
  const n = actx.sampleRate*len|0, buf = actx.createBuffer(1, n, actx.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random()*2 - 1)*(1 - i/n);
  const src = actx.createBufferSource(), f = actx.createBiquadFilter(), g = actx.createGain();
  src.buffer = buf; f.type = 'highpass'; f.frequency.value = hp; g.gain.value = vol;
  src.connect(f); f.connect(g); g.connect(music.gain); src.start(t);
}
const midi = n => 440*Math.pow(2, (n - 69)/12);
const BASS = [0, 0, 12, 0, 3, 3, 15, 3, 5, 5, 17, 5, 7, 7, 10, 12];
const LEAD = [12, null, 15, null, 19, null, 15, 17, null, 19, 22, null, 19, null, 17, 15];
function musicTick(){
  if (!music.on || !actx) return;
  const spb = 60/(118 + Math.min(30, (typeof G !== 'undefined' && G.speed ? G.speed : 14) - 14)); // speeds up with the run
  const s16 = spb/4;
  while (music.next < actx.currentTime + .2){
    const t = music.next, st = music.step % 16, bar = Math.floor(music.step/16) % 4;
    const shift = [0, 0, -2, 3][bar];
    if (st % 4 === 0) { musicNote(150, t, .18, 'sine', .5); musicNote(55, t, .2, 'sine', .4); }
    if (st % 4 === 2) musicNoise(t, .05, .25, 7000);
    if (st === 4 || st === 12) musicNoise(t, .14, .35, 1800);
    musicNote(midi(music.root + BASS[st] + shift), t, s16*.9, 'square', .06);
    const l = LEAD[st];
    if (l !== null && bar % 2 === 1) musicNote(midi(music.root + 12 + l + shift), t, s16*1.6, 'triangle', .05);
    music.next += s16; music.step++;
  }
}
function setMusic(on, worldI){
  if (worldI !== undefined) music.root = MUSIC_ROOTS[worldI] || 45;
  const want = on && save.settings.music && !save.muted;
  if (want === music.on) return;
  music.on = want;
  if (want){
    try{
      if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
      if (actx.state === 'suspended') actx.resume();
      if (!music.gain){ music.gain = actx.createGain(); music.gain.connect(actx.destination); }
      music.gain.gain.cancelScheduledValues(actx.currentTime);
      music.gain.gain.setValueAtTime(.0001, actx.currentTime); music.gain.gain.exponentialRampToValueAtTime(.35, actx.currentTime + .6);
      music.next = actx.currentTime + .05; music.step = 0;
      clearInterval(music.timer); music.timer = setInterval(musicTick, 60);
    }catch(e){ music.on = false; }
  } else if (music.gain && actx){
    music.gain.gain.cancelScheduledValues(actx.currentTime);
    music.gain.gain.setValueAtTime(music.gain.gain.value, actx.currentTime);
    music.gain.gain.exponentialRampToValueAtTime(.0001, actx.currentTime + .4);
    setTimeout(() => { if (!music.on) clearInterval(music.timer); }, 450);
  }
}
