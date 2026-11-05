'use strict';
/* ================= Game state ================= */
const G = {};
let state = 'menu';
const JL = 60; // length of a side street at a crossing

function removeJunction(J){
  worldG.remove(J);
  J.traverse(o => {
    if (o.geometry && o.geometry !== boxGeo && o.geometry !== tileGeo) o.geometry.dispose();
    if (o.userData && o.userData.tex){ o.userData.tex.dispose(); if (o.userData.glow) o.userData.glow.dispose(); o.material.dispose(); }
  });
  for (const t of J.userData.textures) t.dispose();
}
// A crossing: T (both ways), L (only left) or R (only right). Local frame: main road comes from +z.
function buildJunction(kind){
  const W = WORLDS[worldIdx], J = new THREE.Group();
  const ud = J.userData = {kind, open:{'-1': kind !== 'R', '1': kind !== 'L'}, branchRoads:[], post:[], textures:[]};
  const asphalt = new THREE.Color(0x35374b).multiply(new THREE.Color(W.road));
  const sq = new THREE.Mesh(new THREE.PlaneGeometry(6.6, 6.6), new THREE.MeshLambertMaterial({color: asphalt}));
  sq.rotation.x = -Math.PI/2; sq.position.y = .012; J.add(sq);
  for (let i = 0; i < 6; i++){ const s = new THREE.Mesh(new THREE.PlaneGeometry(.55, 1.5), lam(0xe9e6dc)); s.rotation.x = -Math.PI/2; s.position.set(-2.75 + i*1.1, .014, 4.4); J.add(s); }
  const walkBox = (len, x, z, alongX, post) => {
    const tex = walkTex.clone(); tex.needsUpdate = true; tex.repeat.set(alongX ? len/3 : 1, alongX ? 1 : len/3); ud.textures.push(tex);
    const m = new THREE.Mesh(new THREE.BoxGeometry(alongX ? len : 3, .25, alongX ? 3 : len), new THREE.MeshLambertMaterial({map: tex, color: W.walk}));
    m.position.set(x, .125, z); J.add(m);
    if (post){ m.visible = false; ud.post.push(m); }
    return m;
  };
  const roadStrip = (len, x, z, alongX, post) => {
    const tex = roadTex.clone(); tex.needsUpdate = true; tex.offset.set(0, 0); tex.repeat.set(1, len/10); ud.textures.push(tex);
    const rg = new THREE.Group(); rg.position.set(x, 0, z); if (alongX) rg.rotation.y = Math.PI/2; J.add(rg);
    const rd = new THREE.Mesh(new THREE.PlaneGeometry(6.6, len), new THREE.MeshLambertMaterial({map: tex, color: W.road}));
    rd.rotation.x = -Math.PI/2; rd.position.y = .01; rg.add(rd);
    if (post){ rd.visible = false; ud.post.push(rd); }
    return rd;
  };
  const bh = () => W.low ? 3 + Math.random()*5 : 7 + Math.random()*18;
  const bld = (x, z, sx, sz, h, post) => {
    const m = makeBuildingMesh(W, sx, h, sz); m.position.set(x, h/2, z); J.add(m);
    if (post){ m.visible = false; ud.post.push(m); }
    return m;
  };
  const rowAlongX = (dir, zSide, x0, x1) => {
    for (let x = x0; x < x1;){ const len = 6 + Math.random()*8, dep = 4 + Math.random()*4; bld(dir*(x + len/2), zSide*(6.4 + dep/2), len, dep, bh()); x += len + Math.random()*1.2; }
  };
  const rowAlongZ = (side, z0, z1, post) => {
    for (let z = z0; z < z1;){ const len = 6 + Math.random()*6, dep = 4 + Math.random()*4; bld(side*(6.4 + dep/2), z + len/2, dep, len, bh(), post); z += len + Math.random()*1.2; }
  };
  for (const dir of [-1, 1]){
    if (ud.open[dir]){
      ud.branchRoads.push(roadStrip(JL, dir*(3.3 + JL/2), 0, true));
      walkBox(JL, dir*(3.3 + JL/2), -4.8, true);
      walkBox(JL, dir*(3.3 + JL/2), 4.8, true);
      rowAlongX(dir, -1, 6.3, 6.3 + JL);
      rowAlongX(dir, 1, 14.6, 6.3 + JL);
    } else {
      walkBox(12.6, dir*4.8, 0, false);
      bld(dir*11.4, -6.3, 10, 25.2, Math.max(9, bh()));
    }
  }
  walkBox(6.6, 0, -4.8, true);
  bld(0, -6.4 - 8, 13, 16, Math.max(12, bh()));
  for (const side of [-1, 1]){
    rowAlongZ(side, 6.4, 22.3, false);
    rowAlongZ(side, 22.3, 52, true);
    walkBox(37, side*4.8, 24.8, false, true);
  }
  roadStrip(40, 0, 23.3, false, true);
  J.traverse(o => { if (o.isMesh && o.geometry !== boxGeo) o.receiveShadow = true; });
  return J;
}
function spawnJunction(z){
  const r = Math.random(), kind = r < .5 ? 'T' : r < .75 ? 'L' : 'R';
  if (G.junction) removeJunction(G.junction.J);
  const J = buildJunction(kind); J.position.set(0, 0, z); worldG.add(J);
  G.junction = {J, turned:false, kind}; G.mPlan = null; G.turnQueued = 0;
  coinLine(1, z + 18, 5);
  scrollWorld(0);
}

function resetGame(){
  clearObjs(); clearParticles();
  if (G.junction) removeJunction(G.junction.J);
  turnG.rotation.set(0, 0, 0); turnG.position.set(0, 0, 0); worldG.position.set(0, 0, 0);
  Object.assign(G, {
    t:0, speed:12, dist:0, coins:0, lane:1, prevLane:1, x:0, y:0, vy:0, grounded:true, gy:0, slide:0, queueSlide:false,
    stumbleT:0, closeT:2.2, closeFromStumble:false, invuln:0, chaseDist:4.0, chaseX:0, chaseY:0,
    magnet:0, shield:0, double:0, turbo:0, jet:0, score:0, mult: scoreMultiplier(), lastD:0, smashT:0,
    spawnZ:-45, lineT:1.2, shake:0, caughtT:0, caughtReason:'', lastWallLine:0, lastIceLine:0, pendingLine:null, missionT:0,
    junction:null, turning:null, turnQueued:0, nextJunction: 300 + Math.random()*150, mPlan:null, roofAcc:0
  });
  if (worldIdx !== 0) setWorld(0, true); else layoutMain(70, 80);
  scrollWorld(0);
}

function spawnRow(){
  if (G.dist - G.spawnZ > G.nextJunction){ spawnJunction(G.spawnZ - 24); return; }
  const gap = 13 + Math.random()*7 + G.speed*.3;
  const z = G.spawnZ - gap;
  const reserved = G.mPlan ? G.mPlan.lane : -1;
  const lanes = [0, 1, 2].filter(l => l !== reserved).sort(() => Math.random() - .5);
  const nonBlock = () => Math.random() < .5 ? 'barrier' : 'bar';
  const iceChance = Math.min(.2, .07 + G.dist/8000);
  const anyType = () => {
    const q = Math.random();
    if (q < .24) return 'barrier'; if (q < .46) return 'bar'; if (q < .46 + iceChance) return 'ice';
    if (q < .8) return 'wall'; if (q < .9 || G.dist < 250) return 'bus'; return 'train';
  };
  let extraLen = 0, blocking = 0;
  const placed = [null, null, null];
  const place = (type, lane) => {
    if (lane === undefined || lane === reserved) return;
    if (BLOCKING(type)){ if (reserved >= 0 && blocking >= 1) type = nonBlock(); else blocking++; }
    placed[lane] = type;
    if (type === 'bus'){ makeObstacle(type, lane, z - 3); extraLen = Math.max(extraLen, 6); }
    else if (type === 'ice'){ makeObstacle(type, lane, z - 2.2); extraLen = Math.max(extraLen, 4.4); }
    else if (type === 'train'){ makeObstacle(type, lane, z - TRAIN_LEN/2); extraLen = Math.max(extraLen, TRAIN_LEN); }
    else makeObstacle(type, lane, z);
  };
  const r = Math.random();
  if (r < .13){
    coinLine(lanes[0], z + 5, 6);
  } else if (r < .42){
    place(anyType(), lanes[0]);
    if (lanes[1] !== undefined) coinLine(lanes[1], z + 5, 6);
  } else if (r < .66){
    place(anyType(), lanes[0]); place(anyType(), lanes[1]);
    if (lanes[2] !== undefined) coinLine(lanes[2], z + 5, 6);
  } else if (r < .79 || G.dist < 180 || reserved >= 0){
    for (const l of lanes) place(nonBlock(), l);
  } else {
    // train yard: one train has a ramp so you can run across the roofs
    const rampLane = lanes[0];
    makeObstacle('ramp', rampLane, z + 2.6);
    makeObstacle('train', rampLane, z - TRAIN_LEN/2); placed[rampLane] = 'train';
    for (const l of lanes.slice(1)) if (Math.random() < .6){ makeObstacle('train', l, z - TRAIN_LEN/2); placed[l] = 'train'; }
    for (let i = 0; i < 6; i++) makeCoin(rampLane, z - 1.5 - i*2.2, TRAIN_H + .9);
    extraLen = TRAIN_LEN;
  }
  for (let l = 0; l < 3; l++){
    if (placed[l] === 'barrier' && Math.random() < .55) coinLine(l, z + 4.4, 5, 'arc');
    if (placed[l] === 'bar' && Math.random() < .4) coinLine(l, z + 4.4, 5, 'low');
  }
  if (Math.random() < .08 && G.dist > 120){
    const free = [0, 1, 2].filter(l => !placed[l] && l !== reserved);
    const lane = free.length ? pick(free) : lanes[0];
    makePower(pick(['magnet', 'shield', 'double', 'turbo', 'jet', 'magnet', 'double']), lane, z - gap*.5);
  }
  if (placed.includes('wall') && G.t - G.lastWallLine > 9 && Math.random() < .5){ G.lastWallLine = G.t; G.pendingLine = "Ich baue eine Mauer! Eine wunderschöne Mauer!"; }
  else if (placed.includes('ice') && G.t - G.lastIceLine > 9 && Math.random() < .5){ G.lastIceLine = G.t; G.pendingLine = "ICE! Schnappt ihn euch!"; sfx('siren'); }
  // oncoming train: keep its lane clear for a few rows, then send it
  if (G.mPlan){
    if (--G.mPlan.rows <= 0){ makeObstacle('mtrain', G.mPlan.lane, z - 10 - TRAIN_LEN/2); G.mPlan = null; }
  } else if (G.dist > 450 && Math.random() < .12) G.mPlan = {lane:(Math.random()*3)|0, rows:5};
  G.spawnZ = z - extraLen;
}

/* ================= Input ================= */
function junctionWindow(){
  if (!G.junction || G.junction.turned || G.turning) return null;
  const jz = G.junction.J.position.z;
  return jz > -16 && jz < 6 ? jz : null;
}
function moveLane(dir){
  if (state !== 'running' || G.turning) return;
  if (junctionWindow() !== null && G.junction.J.userData.open[dir]){ G.turnQueued = dir; return; }
  const n = Math.max(0, Math.min(2, G.lane + dir));
  if (n !== G.lane){ G.prevLane = G.lane; G.lane = n; }
}
function jump(){
  if (state !== 'running') return;
  if (G.grounded && G.jet <= 0){ G.vy = 11; G.grounded = false; G.slide = 0; sfx('jump'); addStat('jumps', 1); }
}
function startSlide(){ G.slide = .75; sfx('slide'); addStat('slides', 1); }
function slide(){
  if (state !== 'running') return;
  if (G.jet > 0) return;
  if (!G.grounded){ G.vy = -22; G.queueSlide = true; }
  else if (G.slide <= 0) startSlide();
}
window.addEventListener('keydown', e => {
  if (e.repeat || e.target.tagName === 'TEXTAREA') return;
  const k = e.key;
  if (state === 'running'){
    if (k === 'ArrowLeft' || k === 'a' || k === 'A') moveLane(-1);
    else if (k === 'ArrowRight' || k === 'd' || k === 'D') moveLane(1);
    else if (k === 'ArrowUp' || k === 'w' || k === 'W' || k === ' ') jump();
    else if (k === 'ArrowDown' || k === 's' || k === 'S') slide();
    else if (k === 'p' || k === 'P' || k === 'Escape') pauseGame();
    else return;
    e.preventDefault();
  } else if (state === 'paused' && (k === 'p' || k === 'P' || k === 'Escape')) resumeGame();
  else if ((state === 'menu' || state === 'over') && k === 'Enter') startGame();
});
let swipe = null;
window.addEventListener('pointerdown', e => { if (state === 'running' && e.target === canvas) swipe = {x:e.clientX, y:e.clientY, done:false}; });
window.addEventListener('pointermove', e => {
  if (!swipe || swipe.done) return;
  const dx = e.clientX - swipe.x, dy = e.clientY - swipe.y;
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 26) return;
  swipe.done = true;
  if (Math.abs(dx) > Math.abs(dy)) moveLane(dx > 0 ? 1 : -1); else if (dy < 0) jump(); else slide();
});
window.addEventListener('pointerup', () => { swipe = null; });
window.addEventListener('pointercancel', () => { swipe = null; });

/* ================= Game logic ================= */
function stumble(){
  if (G.invuln > 0) return;
  sfx('hit'); G.shake = .35;
  if (G.closeT > 0){ caught('stumble'); return; }
  G.closeT = 6; G.closeFromStumble = true; G.stumbleT = .9; G.invuln = .8;
  say(STUMBLE_LINES[(Math.random()*STUMBLE_LINES.length)|0], 1.8);
}
function knock(o){ o.hit = true; o.knockV = 6; }
function smashFx(m){ addStat('smashed', 1); emit(m.position.x, 1, Math.min(0, m.position.z), 16, 0xffe0a0, 4, .6, .7, 2); }
function startJet(){
  G.invuln = Math.max(G.invuln, 1); G.grounded = false; G.vy = 0; sfx('power');
  // a trail of coins in the air for the length of the flight
  let lane = G.lane, z = -10;
  const len = powerDur('jet')*G.speed*.95;
  while (-z < len){
    for (let i = 0; i < 10 && -z < len; i++, z -= 2.4) makeCoin(lane, z, 6.4);
    lane = Math.max(0, Math.min(2, lane + pick([-1, 1]))); z -= 3;
  }
}
let runFinished = true;
function finishRun(){
  if (runFinished) return null;
  runFinished = true;
  addStat('runs', 1);
  const score = Math.floor(G.score);
  maxStat('bestScore', score);
  save.coins += G.coins;
  const isBest = score > save.best; if (isBest) save.best = score;
  persist();
  return {score, isBest};
}
function caught(reason){
  if (state !== 'running') return;
  state = 'caught'; G.caughtT = 0; G.caughtReason = reason; G.slide = 0; G.turnQueued = 0;
  sfx('fired'); G.shake = .5; setMusic(false);
  say("YOU'RE FIRED!", 3);
  const earned = G.coins;
  const res = finishRun() || {score:0, isBest:false};
  const W = WORLDS[worldIdx];
  $('oScore').textContent = fmt(res.score);
  $('oDist').textContent = fmt(G.dist);
  $('oCoins').textContent = '+' + earned;
  $('newBest').hidden = !res.isBest;
  $('overWorld').textContent = `Welt erreicht: ${W.emoji} ${W.name}`;
  $('savedNote').textContent = cloud.ready ? `☁️ Gespeichert in Spielstand ${slot + 1} (Cloud)` : `💾 Gespeichert in Spielstand ${slot + 1}`;
  $('overSub').textContent = reason === 'crash' ? 'Volle Kanne dagegen gerannt. Er hat dich erwischt.'
    : reason === 'dead-end' ? 'Nicht abgebogen und gegen die Hauswand. Er hat dich erwischt.'
    : 'Zweimal gestolpert. Er hat dich erwischt.';
  checkMissionToasts(); updateBadges();
}

function startTurn(dir){
  G.turning = {t:0, dur:.3, dir}; G.turnQueued = 0;
  turnG.position.set(G.x, 0, 0); worldG.position.set(-G.x, 0, 0);
  sfx('slide'); addStat('turns', 1);
}
function finishTurn(){
  const J = G.junction.J;
  turnG.updateMatrixWorld(true);
  const m = J.matrixWorld.clone();
  turnG.rotation.set(0, 0, 0); turnG.position.set(0, 0, 0); worldG.position.set(0, 0, 0);
  turnG.updateMatrixWorld(true);
  m.decompose(J.position, J.quaternion, J.scale);
  const dx = -J.position.x; J.position.x = 0;
  G.x = Math.max(-2.6, Math.min(2.6, G.x + dx)); G.chaseX += dx;
  let best = 0; for (let i = 1; i < 3; i++) if (Math.abs(LANES[i] - G.x) < Math.abs(LANES[best] - G.x)) best = i;
  G.lane = G.prevLane = best;
  for (const r of J.userData.branchRoads) r.visible = false;
  for (const p of J.userData.post) p.visible = true;
  clearObjs();
  G.junction.turned = true; G.turning = null;
  layoutMain(J.position.z - 6.3 - JL, J.position.z - 3.3 - JL);
  G.spawnZ = J.position.z - 22;
  G.nextJunction = G.dist + 380 + Math.random()*320;
  scrollWorld(0);
}

function updateChase(dt){
  const close = G.closeT > 0;
  const targetDist = close ? 4.0 : 15;
  G.chaseDist += (targetDist - G.chaseDist)*Math.min(1, dt*(close ? 2.5 : .45));
  G.chaseX += (G.x - G.chaseX)*Math.min(1, dt*4);
}

function update(dt){
  G.t += dt;
  let target = Math.min(14 + G.t*.32, 34) * (G.stumbleT > 0 ? .7 : 1);
  if (G.turbo > 0) target *= 1.5;
  G.speed += (target - G.speed)*Math.min(1, dt*2.5);
  const d = G.speed*dt;
  G.dist += d; G.score += d*G.mult; G.lastD = 0;
  addStat('distTotal', d); maxStat('bestDist', G.dist);

  const sc = G.score;
  let wi = 0; for (let i = 0; i < WORLDS.length; i++) if (sc >= WORLDS[i].at) wi = i;
  if (wi > worldIdx){ setWorld(wi, false); maxStat('worldMax', wi); music.root = MUSIC_ROOTS[wi]; say("Auch diese Welt gehört bald mir!", 2.4); }

  G.stumbleT -= dt; G.invuln -= dt;
  const wasClose = G.closeT > 0;
  G.closeT -= dt;
  if (wasClose && G.closeT <= 0 && G.closeFromStumble){ G.closeFromStumble = false; addStat('escapes', 1); toast('😅 Entkommen! Er fällt zurück.'); }
  G.magnet = Math.max(0, G.magnet - dt);
  G.double = Math.max(0, G.double - dt);
  if (G.turbo > 0){ G.turbo -= dt; G.closeT = Math.min(G.closeT, 0); if (G.turbo <= 0) G.invuln = 1; if (Math.random() < .7) emit(G.x + (Math.random() - .5)*.6, G.y + .4 + Math.random()*1.2, .6, 1, 0xff8a2a, .4, .4, .6); }
  G.shake = Math.max(0, G.shake - dt);
  G.lineT -= dt;
  if (G.lineT <= 0){ G.lineT = 5 + Math.random()*5; say(TRUMP_LINES[(Math.random()*TRUMP_LINES.length)|0], 2.6); }
  G.missionT -= dt;
  if (G.missionT <= 0){ G.missionT = .5; checkMissionToasts(); }
  updateChase(dt);

  if (G.turning){
    G.turning.t += dt;
    const k = Math.min(1, G.turning.t/G.turning.dur), e = k*k*(3 - 2*k);
    turnG.rotation.y = (G.turning.dir < 0 ? -1 : 1)*Math.PI/2*e;
    if (k >= 1) finishTurn();
    return;
  }

  scrollWorld(d); G.lastD = d;
  G.spawnZ += d;
  while (G.spawnZ > -175 && !(G.junction && !G.junction.turned)) spawnRow();
  if (G.pendingLine){ say(G.pendingLine, 2.4); G.pendingLine = null; }

  // crossing: turn when the queued direction reaches the middle, crash into the house wall otherwise
  if (G.junction && !G.junction.turned){
    const J = G.junction.J, jz = J.position.z, open = J.userData.open;
    if (G.turnQueued && jz >= -.2){ startTurn(G.turnQueued); return; }
    if (jz >= 5.4){
      if (G.shield > 0 || G.turbo > 0 || G.jet > 0){ if (G.turbo <= 0 && G.jet <= 0) G.shield = 0; startTurn(open[-1] ? -1 : 1); return; }
      caught('dead-end'); return;
    }
  }

  // move everything first, so ground height and collisions see the same positions
  for (const o of objs){
    o.mesh.position.z += d;
    if (o.vz && !o.hit){
      o.mesh.position.z += o.vz*dt;
      if (!o.honked && o.mesh.position.z > -85){ o.honked = true; sfx('horn'); }
    }
  }
  // runner physics, with train roofs and ramps as ground
  G.x += (LANES[G.lane] - G.x)*Math.min(1, dt*14);
  const gnd = groundAt(G.x, 0); G.gy = gnd.h;
  if (G.jet > 0){
    G.jet -= dt; G.grounded = false; G.vy = 0; G.slide = 0; G.closeT = Math.min(G.closeT, 0);
    G.y += (5.6 - G.y)*Math.min(1, dt*3.5);
    addStat('jetDist', d);
    if (Math.random() < .8) for (const sx of [-.13, .13]) emit(G.x + sx, G.y + .75, .45, 1, 0xffa030, .6, .35, .55, -3);
    if (G.jet <= 0){ G.invuln = 1.6; sfx('whoosh'); }
  }
  else if (G.grounded){
    if (gnd.h > G.y && (gnd.ramp || gnd.h - G.y < .7)) G.y = gnd.h;
    else if (gnd.h < G.y - .05){ G.grounded = false; G.vy = 0; }
  }
  if (!G.grounded){
    G.vy -= 34*dt; G.y += G.vy*dt;
    if (G.vy <= 0 && G.y <= gnd.h && (gnd.ramp || gnd.h - G.y < .9)){
      if (G.vy < -8){ emit(G.x, gnd.h + .1, 0, 7, 0xd8d0c0, 1.6, .45, .9); sfx('land'); }
      G.y = gnd.h; G.vy = 0; G.grounded = true;
      if (G.queueSlide){ G.queueSlide = false; startSlide(); }
    }
    if (G.y < 0){ G.y = 0; G.vy = 0; G.grounded = true; }
  }
  if (G.grounded && G.y > 2){ G.roofAcc += d; if (G.roofAcc >= 1){ addStat('roofDist', Math.floor(G.roofAcc)); G.roofAcc %= 1; } }
  G.slide = Math.max(0, G.slide - dt);

  const ph = G.slide > 0 ? .9 : 2.0;
  for (let i = objs.length - 1; i >= 0; i--){
    const o = objs[i], m = o.mesh;
    if (o.kind === 'coin'){
      m.rotation.y += dt*4;
      if ((G.magnet > 0 || G.turbo > 0) && m.position.z > -18 && m.position.z < 3){
        m.position.x += (G.x - m.position.x)*Math.min(1, dt*9);
        m.position.y += (G.y + 1 - m.position.y)*Math.min(1, dt*9);
        m.position.z += (0 - m.position.z)*Math.min(1, dt*6);
      }
      if (Math.abs(m.position.z) < .75 && Math.abs(m.position.x - G.x) < .8 && m.position.y > G.y - .3 && m.position.y < G.y + ph + .3){
        const n = G.double > 0 ? 2 : 1;
        G.coins += n; G.score += 5*n*G.mult; addStat('coinsTotal', n); maxStat('bestCoinsRun', G.coins);
        emit(m.position.x, m.position.y, m.position.z, 5, 0xffd34a, 2.2, .4, .5);
        bumpCoins(); sfx('coin'); worldG.remove(m); objs.splice(i, 1); continue;
      }
    } else if (o.kind === 'power'){
      m.rotation.y += dt*2.5; o.inner.position.y = Math.sin(G.t*4)*.12;
      if (Math.abs(m.position.z) < .8 && Math.abs(m.position.x - G.x) < .9 && Math.abs(G.y + .2 - (m.position.y - 1)) < 1.6){
        if (o.type === 'shield') G.shield = 1; else G[o.type] = powerDur(o.type);
        if (o.type === 'turbo') say("Was?! Wie ist der so schnell?!", 2);
        if (o.type === 'jet'){ startJet(); say(pick(JET_LINES), 2.2); }
        emit(m.position.x, m.position.y, m.position.z, 14, 0xffffff, 3, .5, .6);
        addStat('powerups', 1);
        toast(POWER_INFO[o.type].label + '!');
        sfx('power'); worldG.remove(m); objs.splice(i, 1); continue;
      }
    } else if (o.kind === 'obstacle'){
      if (o.hit){
        m.rotation.x -= dt*5; m.position.y += o.knockV*dt; o.knockV -= 25*dt; m.position.z -= dt*6;
      } else {
        const zOver = Math.abs(m.position.z) < o.hd + .32;
        const xOver = Math.abs(m.position.x - G.x) < o.hw + .25;
        const yOver = G.y < o.y1 && G.y + ph > o.y0;
        if (zOver && xOver && yOver){
          const lateral = o.zPrev && !o.xPrev;
          if (G.turbo > 0){ knock(o); smashFx(m); G.shake = .15; sfx('hit'); }
          else if (G.shield > 0){ G.shield = 0; knock(o); smashFx(m); sfx('hit'); G.shake = .2; G.invuln = .4; }
          else if (lateral && BLOCKING(o.type)){ if (G.invuln <= 0){ G.lane = G.prevLane; stumble(); } }
          else if (BLOCKING(o.type)){ if (G.invuln <= 0) caught('crash'); }
          else { knock(o); stumble(); }
        }
        o.zPrev = zOver; o.xPrev = xOver;
        if (o.type === 'ice' && !o.counted && m.position.z - o.hd > .6){ o.counted = true; addStat('iceDodged', 1); }
      }
    }
    if (m.position.z > 16 || m.position.y < -5){ worldG.remove(m); objs.splice(i, 1); }
  }
}

function updateCaught(dt){
  G.caughtT += dt;
  G.speed = Math.max(0, G.speed - dt*40);
  const d = G.speed*dt; G.lastD = d;
  scrollWorld(d);
  for (const o of objs){
    o.mesh.position.z += d; if (o.kind === 'coin') o.mesh.rotation.y += dt*4;
    if (G.caughtT > .45 && o.mesh.position.z > -10 && o.mesh.position.z < 2 && Math.abs(o.mesh.position.x - G.x) < 1.6) o.mesh.visible = false;
  }
  G.vy -= 34*dt; G.y = Math.max(0, G.y + G.vy*dt); if (G.y <= 0) G.vy = 0;
  G.chaseDist += (1.5 - G.chaseDist)*Math.min(1, dt*3);
  G.chaseX += (G.x - G.chaseX)*Math.min(1, dt*4);
  G.shake = Math.max(0, G.shake - dt);
  if (G.caughtT > 2.1 && state === 'caught'){ state = 'over'; show('over'); $('hud').hidden = true; }
}

/* ================= Camera & render ================= */
const camPos = new THREE.Vector3(), camLook = new THREE.Vector3();
const curPos = new THREE.Vector3(1.2, 2, -5.5), curLook = new THREE.Vector3(0, 1.3, 0);
function resize(){
  const w = innerWidth, h = innerHeight;
  renderer.setSize(w, h, false); camera.aspect = w/h;
  camera.fov = w/h < .8 ? 72 : 62;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize); resize();

let last = performance.now();
function frame(now){
  requestAnimationFrame(frame);
  const dt = Math.min(.05, (now - last)/1000); last = now;
  const t = now/1000;
  const portrait = innerWidth/innerHeight < .8;
  const flash = Math.floor(t*6) % 2 === 0;
  sirenRed.color.setHex(flash ? 0xff2020 : 0x501010); sirenBlue.color.setHex(flash ? 0x102050 : 0x2050ff);

  if (state === 'running') update(dt);
  else if (state === 'caught' || state === 'over') updateCaught(dt);
  updatePalette(dt);
  updateParticles(state === 'paused' ? 0 : dt, (state === 'running' || state === 'caught' || state === 'over') && !G.turning ? G.lastD : 0);
  if (state !== 'running' && state !== 'caught' && state !== 'over') G.lastD = 0;
  updateSnow(state === 'paused' ? 0 : dt, state === 'running' ? G.speed : 2);

  if (state === 'menu' || state === 'shop' || state === 'missions' || state === 'settings'){
    const inShop = state === 'shop';
    const tx = portrait ? .95 : 1.9;
    runner.group.visible = !(inShop && shopTab === 'chaser');
    runner.group.position.set(inShop ? 0 : (portrait ? -.35 : -.6), 0, 0);
    runner.group.rotation.set(0, inShop ? t*.7 : -.25, 0);
    animRunner(runner, t, runner.cheerT > 0 ? 'cheer' : 'idle'); if (runner.cheerT > 0) runner.cheerT -= dt;
    trump.group.visible = !inShop || shopTab === 'chaser';
    if (inShop){ trump.group.position.set(0, 0, 0); trump.group.rotation.y = t*.7; }
    else { trump.group.position.set(tx, 0, 2.8); trump.group.rotation.y = portrait ? -.15 : -.35; }
    animTrump(trump, t, 'point');
    agents.forEach((a, i) => {
      a.group.visible = !inShop;
      a.group.position.set(tx + (i ? 1.25 : -1.25), 0, 4.6); a.group.rotation.y = 0;
      animRunner(a, t + i, 'grab');
    });
    if (!inShop){ camPos.set(portrait ? .3 : .9, 2.0, portrait ? -7.6 : -6.0); camLook.set(portrait ? .3 : .6, portrait ? 1.6 : 1.45, 0); }
    else if (shopTab === 'chaser'){ camPos.set(0, 1.6, portrait ? -7.6 : -6.4); camLook.set(0, portrait ? -.1 : .5, 0); }
    else { camPos.set(0, 1.4, portrait ? -6.6 : -5.5); camLook.set(0, portrait ? -.1 : .4, 0); }
    if (state === 'menu' && talk.t <= 0 && Math.random() < dt*.25) say(TRUMP_LINES[(Math.random()*TRUMP_LINES.length)|0], 2.6);
  } else {
    const caughtMode = state === 'caught' || state === 'over';
    runner.group.position.set(G.x, G.y, 0);
    runner.group.rotation.set(0, 0, 0);
    let mode = 'run';
    if (caughtMode) mode = G.caughtT > .15 ? 'fall' : 'run';
    else if (G.jet > 0) mode = 'fly';
    else if (!G.grounded) mode = 'jump';
    else if (G.slide > 0) mode = 'slide';
    const at = state === 'paused' ? 0 : t;
    animRunner(runner, G.turbo > 0 ? at*1.5 : at, mode);
    runner.shadow.position.y = .02 + Math.min(0, G.gy - G.y); runner.shadow.scale.setScalar(Math.max(.4, 1 - (G.y - G.gy)*.25));
    runner.group.visible = !(G.invuln > 0 && state === 'running' && Math.floor(t*16) % 2 === 0);
    if (!runner.shieldMesh){
      runner.shieldMesh = new THREE.Mesh(new THREE.SphereGeometry(1.25, 18, 14), new THREE.MeshPhongMaterial({color:0x4aa8ff, transparent:true, opacity:.22, emissive:0x1a4a99, depthWrite:false}));
      runner.shieldMesh.position.y = 1.05; runner.group.add(runner.shieldMesh);
    }
    runner.shieldMesh.visible = G.shield > 0;
    runner.jet.visible = G.jet > 0 && !caughtMode;

    const canGround = !G.turning && state !== 'paused';
    if (canGround){ const gh = groundAt(G.chaseX, G.chaseDist).h; G.chaseY += (gh - G.chaseY)*Math.min(1, dt*10); }
    trump.group.visible = true;
    trump.group.position.set(G.chaseX + (caughtMode ? .3 : 0), G.chaseY, G.chaseDist);
    trump.group.rotation.y = 0;
    animTrump(trump, at, !caughtMode || G.caughtT < .6 ? 'run' : G.caughtT < 1.4 ? 'angry' : 'point');
    agents.forEach((a, i) => {
      a.group.visible = true;
      const ax = Math.max(-3, Math.min(3, G.chaseX + (i ? 1.7 : -1.7)));
      const az = G.chaseDist + (caughtMode ? .6 : 1.6) + i*.4;
      const ay = canGround ? groundAt(ax, az).h : a.group.position.y;
      a.group.position.set(ax, a.group.position.y + (ay - a.group.position.y)*Math.min(1, dt*10), az);
      a.group.rotation.y = 0;
      animRunner(a, at*.93 + i*.5, caughtMode && G.caughtT > .9 ? 'grab' : 'run');
    });

    if (caughtMode && G.caughtT > .5){
      camPos.set(G.x + (portrait ? .4 : 1.6), 2.4 + G.y, portrait ? -6.8 : -5.2); camLook.set(G.x + .2, 1.5 + G.y*.5, 1.4);
    } else {
      camPos.set(G.x*.55, 6.0 + G.y*.45, 8.2); camLook.set(G.x*.55, .9 + G.y*.5, -6);
    }
  }
  const camRate = (state === 'running') ? 8 : 3;
  curPos.lerp(camPos, Math.min(1, dt*camRate)); curLook.lerp(camLook, Math.min(1, dt*camRate));
  camera.position.copy(curPos);
  if (G.shake > 0){ camera.position.x += (Math.random() - .5)*G.shake*.6; camera.position.y += (Math.random() - .5)*G.shake*.6; }
  camera.lookAt(curLook);

  if (state === 'running' || state === 'paused'){
    $('score').textContent = fmt(G.score);
    const mc = $('multChip'); const mt = 'x' + G.mult; if (mc.textContent !== mt) mc.textContent = mt;
    $('coinCount').textContent = G.coins;
    const close = G.closeT > 0;
    $('danger').style.opacity = close ? (.55 + Math.sin(t*10)*.25) : 0;
    $('turboFx').style.opacity = G.turbo > 0 ? .9 : 0;
    $('warn').hidden = !close;
    let ph = '';
    for (const k of ['magnet', 'double', 'turbo', 'jet']) if (G[k] > 0) ph += `<div class="power">${POWER_INFO[k].label} <i><b style="width:${Math.round(G[k]/powerDur(k)*100)}%"></b></i></div>`;
    if (G.shield > 0) ph += `<div class="power">${POWER_INFO.shield.label}</div>`;
    const pw = $('powers'); if (pw._last !== ph){ pw.innerHTML = ph; pw._last = ph; }
    // crossing hint
    const th = $('turnHint');
    if (G.junction && !G.junction.turned && !G.turning && G.junction.J.position.z > -50){
      const open = G.junction.J.userData.open;
      const txt = G.turnQueued ? (G.turnQueued < 0 ? '⬅ LINKS!' : 'RECHTS! ➡') : `${open[-1] ? '⬅ ' : ''}ABBIEGEN${open[1] ? ' ➡' : ''}`;
      if (th.textContent !== txt) th.textContent = txt;
      th.classList.toggle('queued', !!G.turnQueued); th.hidden = false;
    } else th.hidden = true;
  } else { $('warn').hidden = true; $('turnHint').hidden = true; $('turboFx').style.opacity = 0; if (state !== 'caught') $('danger').style.opacity = 0; }

  updateTalk(state === 'paused' ? 0 : dt);
  renderer.render(scene, camera);
}

