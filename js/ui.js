'use strict';
/* ================= UI ================= */
const screens = {menu:$('menu'), shop:$('shop'), missions:$('missions'), settings:$('settings'), over:$('over'), pause:$('pause'), countries:$('countries')};
function show(name){ for (const k in screens) screens[k].hidden = k !== name; $('topIcons').hidden = name !== 'menu'; }
let toastTimer = 0;
function toast(msg){
  const el = $('toast'); el.textContent = msg; el.hidden = false; el.classList.toggle('low', state !== 'running' && state !== 'paused');
  el.style.animation = 'none'; void el.offsetWidth; el.style.animation = '';
  clearTimeout(toastTimer); toastTimer = setTimeout(() => { el.hidden = true; }, 2600);
}
let bannerTimer = 0;
function showWorldBanner(W){
  const el = $('worldBanner');
  el.innerHTML = `<small>NEUE WELT</small>${W.emoji} ${W.name}`;
  el.hidden = false; el.style.animation = 'none'; void el.offsetWidth; el.style.animation = '';
  clearTimeout(bannerTimer); bannerTimer = setTimeout(() => { el.hidden = true; }, 2600);
}
function updateCloudStatus(){
  const el = $('cloudStatus'); if (!el) return;
  const map = {
    cloud: ['ok', '☁️ Cloud-Speicher aktiv. Dein Fortschritt bleibt erhalten, auch wenn du das Spiel schließt, und ist auf allen Geräten gleich, auf denen du angemeldet bist.'],
    loading: ['', '☁️ Verbinde mit dem Cloud-Speicher …'],
    denied: ['warn', '⚠️ Für dieses Konto ist der Cloud-Speicher nicht freigegeben. Gespeichert wird nur in diesem Browser. Nutze den Speicher-Code als Backup.'],
    error: ['warn', '⚠️ Cloud-Speicher gerade nicht erreichbar. Beim nächsten Speichern wird es erneut versucht.'],
    local: ['warn', '💾 Gespeichert nur in diesem Browser. Öffne das Spiel angemeldet über claude.ai, dann wird zusätzlich in der Cloud gespeichert.']
  };
  const [cls, txt] = map[cloud.status] || map.local;
  el.className = 'cloud-line ' + cls; el.textContent = txt;
  const sb = $('saveBtn'); if (sb) sb.textContent = cloud.status === 'cloud' ? '☁️' : '💾';
}
function onSaveReplaced(){
  applySave();
  if (state === 'settings') renderSettings();
  if (state === 'missions') renderMissions();
}
function updateBadges(){
  const n = readyCount();
  for (const id of ['mBadge', 'oBadge']){ $(id).hidden = n === 0; $(id).textContent = n; }
}
function refreshMenu(){
  $('mBest').textContent = fmt(save.best);
  $('mCoins').textContent = fmt(save.coins);
  $('mCrates').textContent = save.crates;
  $('muteBtn').textContent = save.muted ? '🔇' : '🔊';
  $('musicBtn').textContent = save.settings.music ? '🎵' : '🎵̸';
  $('musicBtn').classList.toggle('off', !save.settings.music);
  $('mMult').textContent = 'x' + scoreMultiplier();
  $('dailyDot').hidden = !dailyAvailable();
  const C = countryById(save.country);
  $('cFlag').textContent = C.flag; $('cName').textContent = C.name; $('cWorlds').textContent = C.worlds.map(w => w.emoji).join(' ');
  updateBadges();
}
function goMenu(){
  state = 'menu'; resetGame(); setRunnerSkin(save.skin); setChaserSkin(save.chaser);
  show('menu'); $('hud').hidden = true; hideTalk(); $('warn').hidden = true; $('danger').style.opacity = 0; $('turboFx').style.opacity = 0;
  refreshMenu(); setMusic(false);
}
function startGame(){
  resetGame(); setRunnerSkin(save.skin); setChaserSkin(save.chaser);
  runFinished = false;
  if (!save.played.includes(save.country)){ save.played.push(save.country); }
  state = 'running'; show(null); $('hud').hidden = false;
  say("Komm sofort zurück!", 2);
  sfx('power'); setMusic(true, 0);
}
function pauseGame(){ if (state !== 'running') return; state = 'paused'; show('pause'); setMusic(false); }
function resumeGame(){ if (state !== 'paused') return; state = 'running'; show(null); last = performance.now(); setMusic(true, worldIdx); }
let coinBumpT = 0;
function bumpCoins(){
  const el = $('coinPill'); el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump');
}
$('playBtn').onclick = startGame;
$('againBtn').onclick = startGame;
$('overMenu').onclick = goMenu;
$('pauseBtn').onclick = pauseGame;
$('resumeBtn').onclick = resumeGame;
$('pauseMenu').onclick = () => { finishRun(); goMenu(); };
$('muteBtn').onclick = () => { save.muted = !save.muted; persist(); refreshMenu(); if (save.muted) setMusic(false); };
$('musicBtn').onclick = () => { save.settings.music = !save.settings.music; persist(); refreshMenu(); toast(save.settings.music ? '🎵 Musik an (läuft während des Laufs)' : '🎵 Musik aus'); };
document.addEventListener('visibilitychange', () => { if (document.hidden) pauseGame(); });

/* ---- Shop ---- */
let shopTab = 'runner', preview = save.skin;
const SHOP = {
  runner: {list:SKINS, owned:() => save.owned, sel:() => save.skin, setSel:id => { save.skin = id; }, apply:setRunnerSkin},
  chaser: {list:CHASERS, owned:() => save.chOwned, sel:() => save.chaser, setSel:id => { save.chaser = id; }, apply:setChaserSkin}
};
function setShopTab(tab){
  shopTab = tab;
  for (const [id, t] of [['tabRunner', 'runner'], ['tabChaser', 'chaser'], ['tabUpg', 'upg']]){ $(id).classList.toggle('on', tab === t); $(id).setAttribute('aria-selected', tab === t); }
  const upg = tab === 'upg';
  for (const id of ['skinInfo', 'cards', 'shopAction']) $(id).hidden = upg;
  $('upgList').hidden = !upg;
  setRunnerSkin(save.skin); setChaserSkin(save.chaser);
  if (!upg){ preview = SHOP[tab].sel(); SHOP[tab].apply(preview); }
  renderShop();
}
function renderUpgrades(){
  const list = $('upgList'); list.innerHTML = '';
  for (const u of UPGRADES){
    const lvl = save.upgrades[u.id] || 0, max = lvl >= UPGRADE_MAX, cost = UPGRADE_COST[lvl];
    const el = document.createElement('div'); el.className = 'upg';
    const pips = Array.from({length: UPGRADE_MAX}, (_, i) => `<i class="${i < lvl ? 'on' : ''}"></i>`).join('');
    el.innerHTML = `<span class="upg-em">${u.emoji}</span><div><h4>${u.name}</h4><p>${u.desc} Dauer: ${powerDur(u.id).toFixed(1).replace('.', ',')} s</p><div class="pips">${pips}</div></div>`;
    const b = document.createElement('button'); b.className = 'btn small primary';
    if (max){ b.textContent = 'MAX'; b.disabled = true; }
    else { b.innerHTML = `<span class="coin-dot"></span> ${fmt(cost)}`; b.disabled = save.coins < cost; }
    b.onclick = () => {
      if (max || save.coins < cost) return;
      save.coins -= cost; save.upgrades[u.id] = lvl + 1; persist(); sfx('buy');
      toast(`${u.emoji} ${u.name} auf Stufe ${lvl + 1}!`); checkMissionToasts(); renderShop();
    };
    el.appendChild(b); list.appendChild(el);
  }
}
function openShop(){ state = 'shop'; show('shop'); setShopTab('runner'); }
function renderShop(){
  $('sCoins').textContent = fmt(save.coins);
  if (shopTab === 'upg'){ renderUpgrades(); return; }
  const S = SHOP[shopTab], cards = $('cards'); cards.innerHTML = '';
  for (const s of S.list){
    const owned = S.owned().includes(s.id);
    const b = document.createElement('button');
    b.className = 'card' + (s.id === preview ? ' sel' : '') + (owned ? '' : ' locked');
    b.setAttribute('aria-label', s.name);
    b.innerHTML = `<span class="em">${s.emoji}</span><span class="nm">${s.name}</span>` +
      (s.id === S.sel() ? '<span class="tag">AKTIV</span>' : owned ? '<span class="pr">Gekauft</span>' : `<span class="pr"><span class="coin-dot"></span>${fmt(s.price)}</span>`);
    b.onclick = () => { preview = s.id; S.apply(preview); renderShop(); };
    cards.appendChild(b);
  }
  const s = S.list.find(x => x.id === preview), owned = S.owned().includes(s.id), act = $('shopAction');
  $('sName').textContent = s.name; $('sDesc').textContent = s.desc;
  $('sCoins').textContent = fmt(save.coins);
  if (s.id === S.sel()){ act.textContent = 'AUSGEWÄHLT ✓'; act.disabled = true; }
  else if (owned){ act.textContent = 'AUSWÄHLEN'; act.disabled = false; }
  else if (save.coins >= s.price){ act.textContent = `KAUFEN · ${fmt(s.price)}`; act.disabled = false; }
  else { act.textContent = `NOCH ${fmt(s.price - save.coins)} MÜNZEN`; act.disabled = true; }
}
$('shopBtn').onclick = openShop;
$('shopBack').onclick = goMenu;
$('tabRunner').onclick = () => setShopTab('runner');
$('tabChaser').onclick = () => setShopTab('chaser');
$('tabUpg').onclick = () => setShopTab('upg');
$('shopAction').onclick = () => {
  const S = SHOP[shopTab], s = S.list.find(x => x.id === preview);
  if (!S.owned().includes(s.id)){
    if (save.coins < s.price) return;
    save.coins -= s.price; S.owned().push(s.id); sfx('buy'); toast(`${s.emoji} ${s.name} gekauft!`);
  }
  S.setSel(s.id); persist(); checkMissionToasts(); renderShop();
  if (shopTab === 'runner') runner.cheerT = 1.6;
};

/* ---- Missions & crates ---- */
function openMissions(){ state = 'missions'; show('missions'); renderMissions(); }
function renderMissions(){
  $('crateCount').textContent = save.crates; $('openCrate').disabled = save.crates <= 0;
  $('msCoins').textContent = fmt(save.coins);
  const list = $('missionList'); list.innerHTML = '';
  const items = MISSIONS.map(m => ({m, s:missionState(m)}))
    .sort((a, b) => (b.s.ready - a.s.ready) || (a.s.maxed - b.s.maxed) || (b.s.val/b.s.target - a.s.val/a.s.target));
  for (const {m, s} of items){
    const el = document.createElement('div');
    el.className = 'mission' + (s.ready ? ' ready' : '') + (s.maxed ? ' maxed' : '');
    const pct = s.maxed ? 100 : Math.min(100, s.val/s.target*100);
    const rw = s.reward;
    el.innerHTML = `<div><span class="lvl">${s.maxed ? 'Alle Stufen geschafft' : `Stufe ${s.lvl + 1} von ${m.targets.length}`}</span>
      <h4>${m.text(s.target)}</h4>
      ${s.maxed ? '' : `<span class="reward">Belohnung: <span class="coin-dot"></span> ${fmt(rw.coins)}${rw.crates ? ' + 📦 Kiste' : ''}</span>`}</div>`;
    if (s.ready){
      const b = document.createElement('button'); b.className = 'btn primary small'; b.textContent = 'ABHOLEN';
      b.onclick = () => claimMission(m); el.appendChild(b);
    } else {
      const p = document.createElement('span'); p.className = 'prog'; p.textContent = s.maxed ? '✓' : `${fmt(Math.min(s.val, s.target))} / ${fmt(s.target)}`; el.appendChild(p);
    }
    const bar = document.createElement('div'); bar.className = 'bar'; bar.innerHTML = `<b style="width:${pct}%"></b>`; el.appendChild(bar);
    list.appendChild(el);
  }
}
function claimMission(m){
  const s = missionState(m); if (!s.ready) return;
  save.coins += s.reward.coins; save.crates += s.reward.crates;
  save.missions[m.id] = s.lvl + 1;
  persist(); sfx('buy');
  toast(`+${fmt(s.reward.coins)} Münzen${s.reward.crates ? ' und eine Kiste' : ''}!`);
  markNotified(); renderMissions(); updateBadges();
}
function openCrate(){
  if (save.crates <= 0) return;
  save.crates--; addStat('cratesOpened', 1);
  const pool = [
    ...SKINS.filter(s => !save.owned.includes(s.id)).map(s => ({kind:'runner', s})),
    ...CHASERS.filter(s => !save.chOwned.includes(s.id)).map(s => ({kind:'chaser', s}))
  ];
  let res;
  if (pool.length && Math.random() < .3){
    const pick = pool[(Math.random()*pool.length)|0];
    (pick.kind === 'runner' ? save.owned : save.chOwned).push(pick.s.id);
    res = {big:pick.s.emoji, title:'NEUER SKIN!', text:`${pick.s.name} (${pick.kind === 'runner' ? 'Läufer' : 'Verfolger'}) gehört jetzt dir.`};
  } else {
    const q = Math.random(), amt = q < .4 ? 75 : q < .7 ? 150 : q < .9 ? 250 : 500;
    save.coins += amt;
    res = {big:'🪙', title:`+${amt} MÜNZEN`, text:'Ab in die Kasse.'};
  }
  persist();
  const box = $('crateBox'), out = $('crateResult'), ok = $('crateOk');
  $('crate').hidden = false; box.hidden = false; box.classList.add('shake'); out.hidden = true; ok.hidden = true;
  sfx('siren');
  setTimeout(() => {
    box.classList.remove('shake'); box.hidden = true;
    out.innerHTML = `<div class="big">${res.big}</div><h3>${res.title}</h3><p>${res.text}</p>`;
    out.hidden = false; ok.hidden = false; sfx('buy'); ok.focus();
  }, 1100);
}
$('openCrate').onclick = openCrate;
$('crateOk').onclick = () => { $('crate').hidden = true; checkMissionToasts(); renderMissions(); updateBadges(); };
$('missionBtn').onclick = openMissions;
$('overMissions').onclick = () => { goMenu(); openMissions(); };
$('missionsBack').onclick = goMenu;

/* ---- Save slots ---- */
let resetArmed = 0;
function openSettings(){ state = 'settings'; show('settings'); $('saveMsg').textContent = ''; $('saveMsg').className = 'msg'; renderSettings(); }
function slotSummary(d){ return `Rekord ${fmt(d.best)} · ${fmt(d.coins)} Münzen · ${d.owned.length + d.chOwned.length} Skins`; }
function renderSettings(){
  const box = $('slots'); box.innerHTML = '';
  for (let i = 0; i < SLOT_COUNT; i++){
    const d = i === slot ? save : readSlot(i);
    const el = document.createElement('div'); el.className = 'slot' + (i === slot ? ' on' : '');
    const when = d && d.savedAt ? new Date(d.savedAt).toLocaleString('de-DE', {dateStyle:'short', timeStyle:'short'}) : '';
    el.innerHTML = `<div><strong>Spielstand ${i + 1}${i === slot ? ' · aktiv' : ''}</strong><span>${d ? slotSummary(d) : 'Leer'}</span>${when ? `<span>Gespeichert: ${when}</span>` : ''}</div>`;
    const b = document.createElement('button'); b.className = 'btn small' + (i === slot ? '' : ' primary');
    b.textContent = i === slot ? 'AKTIV' : d ? 'LADEN' : 'NEU';
    b.disabled = i === slot;
    b.onclick = () => switchSlot(i);
    el.appendChild(b); box.appendChild(el);
  }
  $('saveCode').value = exportCode();
  updateCloudStatus(); renderToggles();
  $('resetSave').textContent = 'SPIELSTAND ' + (slot + 1) + ' LÖSCHEN';
}
function applySave(){
  setQuality(save.settings.quality);
  if (WORLDS !== countryById(save.country).worlds && state !== 'running' && state !== 'paused'){ setCountry(save.country); resetGame(); }
  notified.clear(); markNotified();
  setRunnerSkin(save.skin); setChaserSkin(save.chaser); refreshMenu();
}
function switchSlot(i){
  persist(); slot = i; save = readSlot(i) || defaultSave(); persist(); applySave(); renderSettings();
  setMsg(`Spielstand ${i + 1} geladen.`, true);
}
function setMsg(t, ok){ const m = $('saveMsg'); m.textContent = t; m.className = 'msg ' + (ok ? 'ok' : 'err'); }
$('saveBtn').onclick = openSettings;
$('settingsBack').onclick = goMenu;
$('copyCode').onclick = () => {
  const ta = $('saveCode'); ta.value = exportCode();
  const fallback = () => { ta.focus(); ta.select(); setMsg('Code markiert. Kopiere ihn mit Strg+C bzw. lange drücken.', true); };
  try{ navigator.clipboard.writeText(ta.value).then(() => setMsg('Code kopiert. Füge ihn auf dem anderen Gerät hier ein.', true), fallback); }catch(e){ fallback(); }
};
$('loadCode').onclick = () => {
  try{
    const data = importCode($('saveCode').value);
    save = data; persist(); applySave(); renderSettings();
    setMsg(`Code geladen in Spielstand ${slot + 1}.`, true);
  }catch(e){ setMsg('Der Code ist ungültig. Füge den kompletten Code ein, er beginnt mit MET1-.', false); }
};
$('resetSave').onclick = () => {
  const b = $('resetSave');
  if (Date.now() - resetArmed > 3000){ resetArmed = Date.now(); b.textContent = 'WIRKLICH LÖSCHEN? NOCHMAL TIPPEN'; return; }
  resetArmed = 0; const muted = save.muted; save = defaultSave(); save.muted = muted; persist(); applySave(); renderSettings();
  setMsg(`Spielstand ${slot + 1} wurde zurückgesetzt.`, true);
};

/* ---- Speech ---- */
const bubble = $('bubble'), shout = $('shout');
let talk = {text:'', t:0};
function say(text, dur){ talk = {text, t: dur || 2.4}; }
function hideTalk(){ talk.t = 0; bubble.hidden = true; shout.hidden = true; }
const tmpV = new THREE.Vector3();
function updateTalk(dt){
  if (talk.t <= 0){ bubble.hidden = true; shout.hidden = true; return; }
  talk.t -= dt;
  trump.head.getWorldPosition(tmpV); tmpV.y += 1.0;
  tmpV.project(camera);
  const onScreen = tmpV.z < 1 && tmpV.x > -1.1 && tmpV.x < 1.1 && tmpV.y < 1.2 && tmpV.y > -1;
  if (onScreen && trump.group.visible){
    bubble.hidden = false; shout.hidden = true;
    bubble.textContent = talk.text;
    const x = (tmpV.x*.5 + .5)*innerWidth, y = (-tmpV.y*.5 + .5)*innerHeight;
    bubble.style.left = Math.max(90, Math.min(innerWidth - 90, x)) + 'px';
    bubble.style.top = Math.max(70, y) + 'px';
  } else {
    bubble.hidden = true; shout.hidden = false;
    shout.innerHTML = '<b>Trump (hinter dir):</b> ' + talk.text.replace(/[<>&]/g, '');
  }
}


/* ---- Daily reward ---- */
const dayKey = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
function dailyInfo(){
  const now = new Date(), today = dayKey(now), y = new Date(now); y.setDate(now.getDate() - 1);
  const cont = save.daily.last === dayKey(y);
  const streak = cont ? save.daily.streak : 0;
  return {today, available: save.daily.last !== today, day: streak % DAILY.length, streak};
}
function dailyAvailable(){ return dailyInfo().available; }
function rewardText(r){ return [r.coins ? `${fmt(r.coins)} Münzen` : '', r.crates ? (r.crates > 1 ? `${r.crates} Kisten` : '1 Kiste') : ''].filter(Boolean).join(' + '); }
function openDaily(){
  const info = dailyInfo(), grid = $('dailyGrid'); grid.innerHTML = '';
  DAILY.forEach((r, i) => {
    const done = info.available ? i < info.day : i <= ((save.daily.streak - 1) % DAILY.length);
    const el = document.createElement('div');
    el.className = 'day' + (info.available && i === info.day ? ' today' : '') + (done ? ' done' : '');
    el.innerHTML = `<small>Tag ${i + 1}</small><span>${r.crates && !r.coins ? '📦' : r.crates ? '🎁' : '🪙'}</span><b>${r.coins ? fmt(r.coins) : ''}${r.crates ? (r.coins ? ' +📦' : '×' + r.crates) : ''}</b>`;
    grid.appendChild(el);
  });
  $('dailyTitle').textContent = info.available ? `Tag ${info.day + 1}: ${rewardText(DAILY[info.day])}` : 'Heute schon abgeholt. Komm morgen wieder!';
  $('dailyClaim').hidden = !info.available;
  $('daily').hidden = false;
}
$('dailyClaim').onclick = () => {
  const info = dailyInfo(); if (!info.available) return;
  const r = DAILY[info.day];
  save.coins += r.coins || 0; save.crates += r.crates || 0;
  save.daily = {last: info.today, streak: info.streak + 1};
  addStat('dailyClaimed', 1); persist(); sfx('buy');
  toast(`🎁 ${rewardText(r)} erhalten!`);
  $('daily').hidden = true; checkMissionToasts(); refreshMenu();
  runner.cheerT = 1.8;
};
$('dailyClose').onclick = () => { $('daily').hidden = true; };
$('dailyBtn').onclick = openDaily;

/* ---- Settings toggles ---- */
function renderToggles(){
  const set = (id, on, label) => { const b = $(id); b.classList.toggle('on', on); b.querySelector('b').textContent = on ? 'AN' : 'AUS'; b.setAttribute('aria-pressed', on); };
  set('tgMusic', save.settings.music); set('tgSound', !save.muted);
  const q = $('tgQuality'); q.classList.add('on'); q.querySelector('b').textContent = {high:'HOCH', mid:'MITTEL', low:'NIEDRIG'}[save.settings.quality];
}
$('tgMusic').onclick = () => { save.settings.music = !save.settings.music; persist(); renderToggles(); refreshMenu(); };
$('tgQuality').onclick = () => {
  const order = ['high', 'mid', 'low'];
  save.settings.quality = order[(order.indexOf(save.settings.quality) + 1) % 3];
  setQuality(save.settings.quality); persist(); renderToggles();
  toast({high:'🎨 Grafik hoch: Schatten und Umrisse', mid:'🎨 Grafik mittel: Umrisse ohne Schatten', low:'🎨 Grafik niedrig: am schnellsten'}[save.settings.quality]);
};
$('tgSound').onclick = () => { save.muted = !save.muted; persist(); renderToggles(); refreshMenu(); };

/* ---- Countries ---- */
let ctPreview = 'usa';
function openCountries(){ state = 'countries'; ctPreview = save.country; show('countries'); renderCountries(); }
function previewCountry(id){ ctPreview = id; setCountry(id); resetGame(); renderCountries(); }
function renderCountries(){
  $('ctBest').textContent = fmt(save.best);
  const list = $('countryList'); list.innerHTML = '';
  for (const c of COUNTRIES){
    const open = save.best >= c.need, sel = c.id === save.country;
    const b = document.createElement('button');
    b.className = 'card' + (c.id === ctPreview ? ' sel' : '') + (open ? '' : ' locked');
    b.innerHTML = `<span class="fl">${c.flag}</span><span class="nm">${c.name}</span>` +
      (sel ? '<span class="tag">AKTIV</span>' : open ? '<span class="pr">Frei</span>' : `<span class="pr">🔒 ${fmt(c.need)}</span>`);
    b.onclick = () => { if (c.id !== ctPreview) previewCountry(c.id); };
    list.appendChild(b);
  }
  const c = countryById(ctPreview), open = save.best >= c.need, act = $('countryAction');
  $('ctName').textContent = `${c.flag} ${c.name}`;
  $('ctWorlds').innerHTML = c.worlds.map((w, i) => `<span class="ctw">${w.emoji} ${w.name}${i ? ` <small>ab ${fmt(w.at)}</small>` : ''}</span>`).join('');
  if (c.id === save.country){ act.textContent = 'AUSGEWÄHLT ✓'; act.disabled = true; }
  else if (open){ act.textContent = 'AUSWÄHLEN'; act.disabled = false; }
  else { act.textContent = `NOCH ${fmt(c.need - save.best)} PUNKTE`; act.disabled = true; }
}
$('countryAction').onclick = () => {
  const c = countryById(ctPreview);
  if (save.best < c.need) return;
  save.country = c.id; persist(); sfx('buy'); runner.cheerT = 1.4;
  toast(`${c.flag} ${c.name}: Start in ${c.worlds[0].emoji} ${c.worlds[0].name}`);
  renderCountries(); refreshMenu();
};
$('countryBtn').onclick = openCountries;
$('countriesBack').onclick = () => { if (ctPreview !== save.country) setCountry(save.country); goMenu(); };
