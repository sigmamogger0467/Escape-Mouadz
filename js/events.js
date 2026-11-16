'use strict';
/* ================= Events: warnings, phases, combos, lane-switching agents, throws, boss, weather, alternative routes ================= */

/* ---- warning banner: every new danger announces itself here first ---- */
let alertTimer = 0;
function alertMsg(html, dur, cls){
  const el = $('alert'); if (!el) return;
  el.innerHTML = html; el.className = cls || ''; el.hidden = false;
  el.style.animation = 'none'; void el.offsetWidth; el.style.animation = '';
  clearTimeout(alertTimer); alertTimer = setTimeout(() => { el.hidden = true; }, (dur || 2.4)*1000);
}
// invisible marker that scrolls with the street and fires a warning when it comes close
function makeMarker(z, html, cls){ const m = new THREE.Object3D(); m.position.z = z; return addObj({kind:'marker', mesh:m, html, cls}); }

function resetEvents(){
  for (const k of ['boss', 'bossPending']) G[k] = null;
  Object.assign(G, {
    phase:{kind:'calm', t:22}, lastCombo:-99, throwT:14, mode:'street', modeLeft:0, exitWarned:false,
    weather:{kind:null, t:0, k:0, warn:0, next:38 + Math.random()*25}, flashT:0
  });
  heli.visible = false; tunnelG.visible = false;
  applyMode();
  applyWeatherLook(true);
}
const intensePhase = () => G.phase && G.phase.kind === 'intense' && !G.boss;

/* ---- 8) calm and intense phases ---- */
function updatePhase(dt){
  if (G.boss || G.turning) return;
  G.phase.t -= dt;
  if (G.phase.t > 0) return;
  if (G.phase.kind === 'calm'){
    G.phase = {kind:'intense', t:11 + Math.random()*5};
    if (G.dist > 300) alertMsg('🔥 JETZT WIRD ES WILD!<small>Mehr Hindernisse, Kombis und Würfe</small>', 2.6, 'hot');
  } else {
    G.phase = {kind:'calm', t:14 + Math.random()*6};
    alertMsg('😮‍💨 KURZ DURCHATMEN<small>Ruhige Strecke mit mehr Münzen</small>', 2.2, 'cool');
  }
}

/* ---- 1) obstacle combos: jump, roll and lane change in a row ---- */
function spawnCombo(z){
  const steps = ['jump', 'slide', 'switch'].sort(() => Math.random() - .5);
  const g = Math.max(17, G.speed*.85), guide = (Math.random()*3)|0;
  const icon = {jump:'⬆', slide:'⬇', switch:'↔'};
  makeMarker(z + 12, `⚠️ KOMBI: ${steps.map(s => icon[s]).join(' ')}<small>${steps.map(s => ({jump:'springen', slide:'rollen', switch:'Spur wechseln'}[s])).join(' → ')}</small>`, 'warn');
  let zz = z;
  for (const s of steps){
    if (s === 'jump'){ for (let l = 0; l < 3; l++) makeObstacle('barrier', l, zz); coinLine(guide, zz + 4.4, 5, 'arc'); }
    else if (s === 'slide'){ for (let l = 0; l < 3; l++) makeObstacle('bar', l, zz); coinLine(guide, zz + 4.4, 5, 'low'); }
    else { const free = (Math.random()*3)|0; for (let l = 0; l < 3; l++) if (l !== free) makeObstacle('wall', l, zz); coinLine(free, zz + 6, 6); }
    zz -= g;
  }
  G.lastCombo = G.t; G.spawnZ = zz + g - 6;
}

/* ---- 2) helpers of the chaser who change lanes, with a warning arrow first ---- */
const arrowTex = canvasTex(128, 128, (g, w, h) => {
  g.fillStyle = '#ff2a3a'; g.beginPath(); g.moveTo(8, 64); g.lineTo(64, 14); g.lineTo(64, 44); g.lineTo(120, 44); g.lineTo(120, 84); g.lineTo(64, 84); g.lineTo(64, 114); g.closePath(); g.fill();
  g.lineWidth = 8; g.strokeStyle = '#ffffff'; g.stroke();
});
const laneWarnMat = new THREE.MeshBasicMaterial({color:0xff2a3a, transparent:true, opacity:.4, depthWrite:false});
const agentCount = () => objs.reduce((n, o) => n + (o.type === 'agent' && !o.hit ? 1 : 0), 0);
function makeAgent(lane, z){
  const rig = buildRunner(crewDef(chaserById(save.chaser).crew));
  rig.group.rotation.y = Math.PI; rig.group.scale.setScalar(1.06);
  rig.group.position.set(LANES[lane], 0, z);
  const opts = [lane - 1, lane + 1].filter(l => l >= 0 && l <= 2);
  const to = pick(opts), dir = to - lane;
  // the group faces the runner (turned by 180 degrees), so local x is mirrored
  const arrow = new THREE.Sprite(new THREE.SpriteMaterial({map:arrowTex, depthTest:false, transparent:true}));
  arrow.scale.set(1.3, 1.3, 1); arrow.position.set(-dir*.9, 2.9, 0); arrow.material.rotation = dir > 0 ? Math.PI : 0; arrow.visible = false;
  const mark = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 5), laneWarnMat); mark.rotation.x = -Math.PI/2; mark.position.set(-dir*2.2/1.06, .04, 0); mark.visible = false;
  rig.group.add(arrow); rig.group.add(mark);
  return addObj({kind:'obstacle', type:'agent', mesh:rig.group, rig, lane, to, hw:.55, hd:.4, y0:0, y1:2.0, sw:0, swT:0, arrow, mark});
}
function updateAgent(o, dt){
  const m = o.mesh;
  poseRunner(o.rig, G.clock + o.to, o.sw === 2 ? 'run' : 'grab', dt);
  const tta = -m.position.z/Math.max(8, G.speed);
  if (o.sw === 0 && tta < 1.75){ o.sw = 1; o.swT = 0; o.arrow.visible = o.mark.visible = true; sfx('siren'); }
  else if (o.sw === 1){
    o.swT += dt; o.arrow.visible = Math.floor(o.swT*10) % 2 === 0;
    if (o.swT > .7){ o.sw = 2; o.swT = 0; o.from = m.position.x; o.lane = o.to; o.arrow.visible = false; }
  } else if (o.sw === 2){
    o.swT += dt; const k = Math.min(1, o.swT/.32), e = k*k*(3 - 2*k);
    m.position.x = o.from + (LANES[o.to] - o.from)*e;
    o.mark.position.x = -(LANES[o.to] - m.position.x)/1.06;
    if (k >= 1){ o.sw = 3; o.mark.visible = false; }
  }
}

/* ---- 3) the chaser throws things; a shadow shows where they land ---- */
const throwShadowMat = new THREE.MeshBasicMaterial({color:0xd0102a, transparent:true, opacity:.55, depthWrite:false});
const throwRingMat = new THREE.MeshBasicMaterial({color:0xffffff, transparent:true, opacity:.9, depthWrite:false});
let throwTpl = null;
function throwTemplates(){
  if (throwTpl) return throwTpl;
  const burger = new THREE.Group();
  sph(.42, std(0xd89a4a, .7), 0, .16, 0, burger, 1, .42, 1);
  cyl(.44, .44, .12, std(0x5a2e16, .8), 0, .3, 0, burger, 18);
  cyl(.47, .47, .04, std(0xffc83d, .5), 0, .38, 0, burger, 18);
  torus(.42, .05, std(0x4caf50, .7), 0, .43, 0, burger).rotation.x = Math.PI/2;
  sph(.43, std(0xe0a050, .6), 0, .48, 0, burger, 1, .6, 1);
  for (let i = 0; i < 6; i++) sph(.025, std(0xfff0c8), Math.cos(i)*.2, .72 - (i % 2)*.03, Math.sin(i)*.2, burger);
  const paper = new THREE.Group();
  cyl(.2, .2, 1.1, std(0xeeeeea, .9), 0, .22, 0, paper, 14).rotation.z = Math.PI/2;
  for (const x of [-.3, 0, .3]) torus(.205, .015, std(0x3a3a44), x, .22, 0, paper).rotation.y = Math.PI/2;
  torus(.21, .03, std(0xd3122a), 0, .22, 0, paper).rotation.y = Math.PI/2;
  for (const t of [burger, paper]){ castAll(t); mergeTree(t); t.traverse(m => { if (m.geometry) m.geometry.userData.shared = true; }); }
  return throwTpl = {burger, paper};
}
function throwAt(lane, from, force){
  const T = 1.25, zl = -(G.speed*.55 + 4), z0 = zl - G.speed*T;
  if (!force){
    for (const o of objs) if (o.kind === 'obstacle' && !o.hit && (o.lane === lane || o.to === lane) && Math.abs(o.mesh.position.z - z0) < o.hd + 10) return false;
    if (G.junction && !G.junction.turned && G.junction.J.position.z > z0 - 30) return false;
  }
  const g = new THREE.Group(); g.position.set(LANES[lane], 0, z0);
  const tpl = throwTemplates(), item = (chaserById(save.chaser).face ? tpl.paper : tpl.burger).clone(true);
  const sh = new THREE.Mesh(new THREE.CircleGeometry(.85, 24), throwShadowMat); sh.rotation.x = -Math.PI/2; sh.position.y = .035;
  const ring = new THREE.Mesh(new THREE.RingGeometry(.86, .98, 28), throwRingMat); ring.rotation.x = -Math.PI/2; ring.position.y = .04;
  g.add(item); g.add(sh); g.add(ring);
  const start = new THREE.Vector3(from.x - LANES[lane], from.y, from.z - z0);
  item.position.copy(start);
  sfx('whoosh');
  return addObj({kind:'obstacle', type:'burger', mesh:g, lane, hw:.6, hd:.4, y0:0, y1:0, air:{t:0, T, start, arc: from.y > 4 ? 1 : 4.5}, item, sh, ring});
}
function updateThrown(o, dt){
  const a = o.air; if (!a) return;
  a.t += dt; const u = Math.min(1, a.t/a.T);
  o.item.position.set(a.start.x*(1 - u), a.start.y*(1 - u) + Math.sin(Math.PI*u)*a.arc, a.start.z*(1 - u));
  o.item.rotation.x += dt*9;
  const s = .45 + .55*u; o.sh.scale.setScalar(s); o.ring.scale.setScalar(1.25 - .25*u);
  throwShadowMat.opacity = .4 + Math.abs(Math.sin(G.clock*14))*.3;
  if (u >= 1){
    o.air = null; o.y1 = .55; o.item.position.set(0, 0, 0); o.item.rotation.set(0, 0, 0); o.sh.visible = o.ring.visible = false;
    emit(o.mesh.position.x, .2, o.mesh.position.z, 8, 0xd8d0c0, 2, .4, .8); sfx('land');
  }
}
function updateThrows(dt){
  if (G.boss || G.mode !== 'street' || G.dist < 350 || G.jet > 0 || G.turbo > 0) return;
  G.throwT -= dt;
  if (G.throwT > 0) return;
  const ok = throwAt(G.lane, {x:G.chaseX, y:2.6, z:Math.min(G.chaseDist, 10)}, false);
  G.throwT = ok ? (intensePhase() ? 4 + Math.random()*3 : 12 + Math.random()*8) : 1.5;
  if (ok){
    if (!G.throwSeen){ G.throwSeen = true; alertMsg('🍔 ER WIRFT!<small>Der rote Kreis zeigt, wo es landet. Spur wechseln oder springen</small>', 2.8, 'warn'); }
    else if (Math.random() < .4) say(pick(['Nimm das!', 'Fang!', 'Das trifft!']), 1.4);
  }
}

/* ---- 5) boss phase at a world change: the chaser attacks from a helicopter ---- */
const heli = new THREE.Group(); heli.visible = false; scene.add(heli);
(() => {
  const body = std(0x24365e, .35, .5), red = std(0xd3122a, .4, .3), dark = std(0x1a1c24, .5, .4), gold = glossy(0xffcf3a, 0x3a2600);
  sph(1.5, body, 0, 0, -.4, heli, 1.2, .95, 1.5);
  const glass = sph(1.25, new THREE.MeshStandardMaterial({color:0xa8dcff, transparent:true, opacity:.38, roughness:.08, metalness:.2}), 0, .1, .9, heli, 1.05, .82, 1);
  glass.renderOrder = 3;
  cyl(.22, .5, 3.8, body, 0, .25, -4.2, heli, 12).rotation.x = Math.PI/2;
  rbox(.1, 1.3, .9, red, 0, .9, -5.9, heli, .04);
  rbox(1.6, .08, .5, red, 0, .35, -5.8, heli, .03);
  torus(1.52, .07, gold, 0, 0, -.4, heli).rotation.x = Math.PI/2;
  for (const sx of [-1, 1]){
    cyl(.07, .07, 3.6, dark, sx*1.1, -1.75, -.2, heli, 8).rotation.x = Math.PI/2;
    for (const sz of [-1, .8]) cyl(.05, .05, .9, dark, sx*.95, -1.35, sz, heli, 6).rotation.z = sx*.35;
  }
  cyl(.1, .1, .5, dark, 0, 1.55, -.4, heli, 8);
  castAll(heli); mergeTree(heli);
  const rotor = new THREE.Group(); rotor.position.set(0, 1.82, -.4); heli.add(rotor);
  rbox(7.6, .05, .34, dark, 0, 0, 0, rotor, .02); rbox(.34, .05, 7.6, dark, 0, 0, 0, rotor, .02);
  const tr = new THREE.Group(); tr.position.set(.18, .9, -6.1); heli.add(tr);
  rbox(.04, 1.5, .14, dark, 0, 0, 0, tr, .02); rbox(.04, .14, 1.5, dark, 0, 0, 0, tr, .02);
  heli.userData = {rotor, tr};
})();
function startBoss(){
  if (G.boss) return;
  if (G.mode !== 'street' || G.turning || (G.junction && !G.junction.turned)){ G.bossPending = true; return; }
  G.bossPending = null;
  G.boss = {t:0, vol:0, total:Math.min(13, 7 + G.stage), next:0, out:0, x:0};
  G.nextJunction = Math.max(G.nextJunction, G.dist + 700);
  G.closeT = Math.min(G.closeT, 0); G.mPlan = null;
  for (let i = objs.length - 1; i >= 0; i--){ const o = objs[i]; if (o.kind !== 'coin' && o.mesh.position.z < -80){ removeObj(i); } }
  heli.position.set(0, 16, 14); heli.visible = true;
  sfx('siren');
}
function updateBoss(dt){
  const B = G.boss; if (!B) return;
  B.t += dt;
  const tx = Math.sin(B.t*.9)*2.6;
  $('worldBanner').hidden = B.t > 2.2 || $('worldBanner').hidden;
  if (!B.warned && B.t > 2.6){ B.warned = true; alertMsg('🚁 BOSS-ANGRIFF!<small>Er wirft aus dem Hubschrauber. Achte auf die roten Kreise!</small>', 3.2, 'hot'); }
  if (B.out > 0){
    B.out += dt; heli.position.y += dt*7; heli.position.z -= dt*16;
    if (B.out > 2.2){ heli.visible = false; G.boss = null; G.phase = {kind:'calm', t:9}; G.spawnZ = Math.min(G.spawnZ, -45); }
    return;
  }
  heli.position.x += (tx - heli.position.x)*Math.min(1, dt*2.5);
  heli.position.y += (5.3 + Math.sin(B.t*2)*.25 - heli.position.y)*Math.min(1, dt*1.6);
  heli.position.z += (-12.5 - heli.position.z)*Math.min(1, dt*1.6);
  heli.rotation.z = -(tx - heli.position.x)*.08; heli.rotation.y = Math.PI + Math.sin(B.t*.9)*.12;
  const clear = !objs.some(o => o.kind === 'obstacle' && !o.hit && o.type !== 'burger' && o.mesh.position.z < -1);
  if (B.t < 4.6 || (!clear && B.t < 8)) return;
  B.next -= dt;
  if (B.next > 0) return;
  if (B.vol >= B.total){
    B.out = .01; const bonus = 20 + 5*G.stage;
    G.coins += bonus; addStat('coinsTotal', bonus); addStat('bosses', 1); G.score += 250*G.mult;
    alertMsg(`✅ BOSS ABGEWEHRT!<small>+${bonus} Münzen</small>`, 2.6, 'cool'); sfx('buy');
    for (let l = 0; l < 3; l++) coinLine(l, -30, 8);
    return;
  }
  const lanes = [G.lane];
  if (B.vol % 3 === 2){ const other = [0, 1, 2].filter(l => l !== G.lane); lanes.push(pick(other)); }
  for (const l of lanes) throwAt(l, heli.position, true);
  B.vol++; B.next = Math.max(1.05, 1.7 - G.stage*.06);
}

/* ---- 6) weather events: slippery road, storm, night ---- */
function climate(W){ return W.snow ? 'cold' : ['cactus', 'palm', 'umbrella'].includes(W.prop) ? 'hot' : 'mild'; }
const WEATHER_TEXT = {
  slip:  {cold:['❄️ GLATTEIS VORAUS!', 'Spurwechsel dauern länger'], hot:['🛢️ ÖLSPUR VORAUS!', 'Spurwechsel dauern länger'], mild:['🌧️ REGEN: RUTSCHGEFAHR!', 'Spurwechsel dauern länger']},
  storm: {cold:['🌨️ SCHNEESTURM ZIEHT AUF!', 'Du siehst nicht mehr so weit'], hot:['🌪️ SANDSTURM ZIEHT AUF!', 'Du siehst nicht mehr so weit'], mild:['🌫️ NEBEL ZIEHT AUF!', 'Du siehst nicht mehr so weit']},
  night: {cold:['🌙 ES WIRD NACHT!', 'Hindernisse sind schwerer zu sehen'], hot:['🌙 ES WIRD NACHT!', 'Hindernisse sind schwerer zu sehen'], mild:['🌙 ES WIRD NACHT!', 'Hindernisse sind schwerer zu sehen']}
};
function startWeather(kind){
  const W = WORLDS[worldIdx], c = climate(W);
  if (kind === 'night' && W.stars >= .9) kind = 'storm';
  G.weather = {kind, t:17 + Math.random()*8, k:0, warn:2.6, next:0, climate:c};
  const [a, b] = WEATHER_TEXT[kind][c];
  alertMsg(`${a}<small>${b}</small>`, 3, 'warn');
  if (kind === 'storm') snowMat.color.setHex(c === 'hot' ? 0xe8c890 : 0xffffff);
}
function updateWeather(dt){
  const w = G.weather;
  if (!w.kind){
    if (w.k > 0){ w.k = Math.max(0, w.k - dt/1.5); applyWeatherLook(); }
    if (G.boss || G.mode === 'metro' || G.dist < 500) return;
    w.next -= dt;
    if (w.next <= 0) startWeather(pick(['slip', 'storm', 'night']));
    return;
  }
  if (G.mode === 'metro'){ w.kind = null; w.next = 40; return; }
  if (w.warn > 0){ w.warn -= dt; return; }
  w.t -= dt;
  const target = w.t > 0 ? 1 : 0;
  if (w.k !== target){ w.k = Math.max(0, Math.min(1, w.k + (target ? dt/1.5 : -dt/1.5))); applyWeatherLook(); }
  if (w.t <= 0 && w.k <= 0){
    alertMsg({slip:'✅ Die Straße ist wieder griffig', storm:'✅ Die Sicht ist wieder frei', night:'☀️ Es wird wieder hell'}[w.kind], 1.8, 'cool');
    G.weather = {kind:null, t:0, k:0, warn:0, next:45 + Math.random()*35};
    applyWeatherLook();
  }
}
const slipK = () => G.weather && G.weather.kind === 'slip' ? G.weather.k : 0;
const stormK = () => G.weather && G.weather.kind === 'storm' ? G.weather.k : 0;
const nightK = () => G.weather && G.weather.kind === 'night' ? G.weather.k : 0;
const lerpN = (a, b, t) => a + (b - a)*t;
// palette modifier: weather and the metro tunnel change the look on top of the world's own colors
const NIGHT_SKY = ['#02030c', '#070b24', '#101a44', '#1c2a5a'].map(c => new THREE.Color(c));
function paletteMod(p){
  const n = G.mode === 'metro' ? 1 : nightK(), s = G.weather && G.weather.kind === 'slip' ? G.weather.k : 0, roof = G.mode === 'roof';
  if (!n && !s && !roof) return p;
  const o = Object.assign({}, p);
  o.sky = p.sky.map((c, i) => c.clone().lerp(NIGHT_SKY[i], n*(G.mode === 'metro' ? 1 : .92)));
  const dark = new THREE.Color(G.mode === 'metro' ? 0x07080e : 0x0a0e24);
  for (const k of ['fog', 'hemiSky', 'hemiGround', 'ground', 'walk', 'road']) o[k] = p[k].clone();
  o.fog.lerp(dark, n*.92); o.ground.lerp(dark, n*.7); o.walk.multiplyScalar(1 - n*.45); o.road.multiplyScalar(1 - n*.35);
  o.hemiSky.lerp(new THREE.Color(0x8a98d8), n*.7);
  o.hemiI = p.hemiI*(1 - n*.5); o.sunI = p.sunI*(1 - n*.78);
  o.glow = Math.max(p.glow, n); o.stars = G.mode === 'metro' ? 0 : Math.max(p.stars, n); o.clouds = p.clouds*(1 - n);
  if (s){ const c = G.weather.climate; o.road.lerp(new THREE.Color(c === 'cold' ? 0xcfe8ff : c === 'hot' ? 0x4a4038 : 0x7888a8), s*.6); }
  if (roof){ o.road.lerp(new THREE.Color(0xb8b0a4), .55); o.walk.lerp(new THREE.Color(0x8a8a94), .5); o.ground.lerp(new THREE.Color(0x30303c), .7); }
  return o;
}
function applyWeatherLook(){
  applyPalette(palCur);
  const st = stormK(), fogMild = G.weather && G.weather.climate === 'mild';
  if (G.mode === 'metro'){ scene.fog.near = 14; scene.fog.far = 95; }
  else { scene.fog.near = lerpN(40, fogMild ? 6 : 12, st); scene.fog.far = lerpN(170, fogMild ? 52 : 64, st); }
  roadMat.roughness = lerpN(.95, .25, G.weather && G.weather.kind === 'slip' ? G.weather.k : 0);
}

/* ---- 7) alternative routes at crossings: rooftops (jump) or metro (roll) ---- */
const tunnelG = new THREE.Group(); tunnelG.visible = false; scene.add(tunnelG);
const tunnelTex = canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = '#c8c4b4'; g.fillRect(0, 0, w, h);
  for (let y = 0; y < h; y += 32) for (let x = 0; x < w; x += 64){ g.fillStyle = `rgba(${200 + Math.random()*40|0},${196 + Math.random()*40|0},${180 + Math.random()*40|0},1)`; g.fillRect(x + (y/32 % 2 ? 32 : 0) - 32, y + 2, 60, 28); }
  g.fillStyle = '#2f6bff'; g.fillRect(0, h*.42, w, 14); g.fillStyle = '#3a3a44'; g.fillRect(0, h - 26, w, 26);
});
tunnelTex.wrapS = tunnelTex.wrapT = THREE.RepeatWrapping; tunnelTex.repeat.set(30, 1);
const tunnelRings = [];
(() => {
  const wallM = new THREE.MeshStandardMaterial({map:tunnelTex, roughness:.55});
  for (const sx of [-1, 1]){ const w = new THREE.Mesh(new THREE.PlaneGeometry(300, 6.4), wallM); w.rotation.y = -sx*Math.PI/2; w.position.set(sx*6.35, 3.2, -110); tunnelG.add(w); }
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(12.8, 300), std(0x2a2a34, .9)); ceil.rotation.x = Math.PI/2; ceil.position.set(0, 6.4, -110); tunnelG.add(ceil);
  for (let i = 0; i < 16; i++){
    const r = new THREE.Group();
    for (const sx of [-1, 1]) rbox(.5, 6.4, .5, std(0x4a4f5e, .6, .3), sx*3.55, 3.2, 0, r, .06);
    rbox(7.6, .5, .5, std(0x4a4f5e, .6, .3), 0, 6.1, 0, r, .06);
    rbox(3.2, .08, .3, glowMat(0xfff2c0), 0, 5.8, 0, r, .03);
    const hl = new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex, color:0xfff0b0, transparent:true, opacity:.55, blending:THREE.AdditiveBlending, depthWrite:false}));
    hl.scale.set(5, 2.4, 1); hl.position.set(0, 5.6, 0); r.add(hl);
    mergeTree(r); r.position.z = 10 - i*12; tunnelG.add(r); tunnelRings.push(r);
  }
})();
let signUp = null, signDown = null;
function addRouteSigns(J, alt){
  signUp = signUp || textTex('DACH ⬆', '#ffd23a', '#1d2a4a'); signDown = signDown || textTex('U-BAHN ⬇', '#2f6bff', '#ffffff');
  const add = (tex, x) => {
    const g = new THREE.Group(); g.position.set(x, 0, -3.5); J.add(g);
    cyl(.07, .07, 2.4, std(0x2b2d3a, .5, .4), 0, 1.2, 0, g, 8);
    plane(2.6, .98, tex, 0, 2.7, .02, 0, g); rbox(2.7, 1.06, .06, std(0x1a1c24, .6), 0, 2.7, -.02, g, .03);
  };
  if (alt.up) add(signUp, 1.75);
  if (alt.down) add(signDown, -1.75);
}
function applyMode(){
  const m = G.mode;
  tunnelG.visible = m === 'metro';
  backdrop.visible = m !== 'metro'; celestial.visible = m !== 'metro' && WORLDS[worldIdx].celestial !== 'none';
  ground.position.y = m === 'roof' ? -16 : -.02;
  for (const b of buildings) placeBuildingY(b);
}
// rooftops: the houses sink until their roofs lie just below the path
function placeBuildingY(b){ b.position.y = G.mode === 'roof' ? -b.scale.y/2 - .3 - (b.userData.side*b.position.z*7 % 1 + 1) % 1*2.4 : b.scale.y/2; }
function flash(color){ const f = $('flash'); if (!f) return; f.style.background = color; f.classList.remove('go'); void f.offsetWidth; f.classList.add('go'); }
function enterRoute(kind){
  const mode = kind === 'up' ? 'roof' : 'metro';
  removeJunction(G.junction.J); G.junction = null; G.turnQueued = 0;
  clearObjs();
  G.mode = mode; G.modeLeft = 330 + Math.random()*130; G.exitWarned = false;
  G.spawnZ = -48; G.nextJunction = G.dist + G.modeLeft + 320; G.invuln = Math.max(G.invuln, 1.2); G.mPlan = null;
  G.lane = G.prevLane = Math.max(0, Math.min(2, G.lane));
  applyMode(); layoutMain(70, 80); applyWeatherLook(); scrollWorld(0);
  flash(mode === 'roof' ? '#ffffff' : '#000000'); sfx('whoosh'); addStat('routes', 1);
  if (mode === 'roof'){ G.vy = 12; G.grounded = false; G.jumpT = 0; G.trick = true; alertMsg('🏙️ ÜBER DIE DÄCHER!<small>Viele Münzen, keine Autos</small>', 2.6, 'cool'); }
  else { startSlide(); alertMsg('🚇 DURCH DIE U-BAHN!<small>Doppelte Punkte, aber Züge von vorn</small>', 2.8, 'warn'); }
}
function exitRoute(){
  clearObjs();
  G.mode = 'street'; G.modeLeft = 0; G.spawnZ = -48; G.invuln = Math.max(G.invuln, 1.2); G.mPlan = null;
  G.nextJunction = G.dist + 380 + Math.random()*300;
  applyMode(); layoutMain(70, 80); applyWeatherLook(); scrollWorld(0);
  flash('#ffffff'); sfx('whoosh');
  alertMsg('🛣️ ZURÜCK AUF DER STRASSE', 1.8, 'cool');
}
function updateMode(d){
  if (G.mode === 'street') return;
  G.modeLeft -= d;
  if (G.mode === 'metro'){
    tunnelTex.offset.x -= 0; // walls are static tiles; the rings carry the motion
    for (const r of tunnelRings){ r.position.z += d; if (r.position.z > 14) r.position.z -= 16*12; }
  }
  if (!G.exitWarned && G.modeLeft < 70){ G.exitWarned = true; alertMsg(G.mode === 'roof' ? '⬇ Gleich geht es zurück auf die Straße' : '⬆ Gleich geht es zurück nach oben', 2, 'cool'); }
  if (G.modeLeft <= 0) exitRoute();
}

/* ---- per-step update, called from the game loop before collisions ---- */
function removeObj(i){ const o = objs[i]; worldG.remove(o.mesh); if (o.rig) disposeMerged(o.mesh); objs.splice(i, 1); }
function updateEvents(dt, d){
  updatePhase(dt); updateWeather(dt); updateMode(d);
  if (G.bossPending) startBoss();
  updateBoss(dt); updateThrows(dt);
  for (const o of objs){
    if (o.kind === 'marker'){ if (!o.fired && o.mesh.position.z > -62){ o.fired = true; alertMsg(o.html, 2.6, o.cls); } }
    else if (o.type === 'agent' && !o.hit) updateAgent(o, dt);
    else if (o.type === 'burger') updateThrown(o, dt);
  }
}
// per-frame visuals (helicopter, rotor); returns true while the chaser sits in the helicopter
function eventsFrame(dt){
  if (!heli.visible) return false;
  heli.userData.rotor.rotation.y += dt*38; heli.userData.tr.rotation.x += dt*45;
  return true;
}
