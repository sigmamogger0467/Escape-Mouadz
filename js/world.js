'use strict';
/* ================= World scenery ================= */
const LANES = [-2.2, 0, 2.2];
// turnG pivots the whole street around the runner when turning at a crossing
const turnG = new THREE.Group(), worldG = new THREE.Group(); turnG.add(worldG); scene.add(turnG);

const roadTex = canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = '#35374b'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 1600; i++){ g.fillStyle = `rgba(255,255,255,${Math.random()*.05})`; g.fillRect(Math.random()*w, Math.random()*h, 2, 2); }
  g.fillStyle = '#e9e6dc';
  g.fillRect(4, 0, 5, h); g.fillRect(w - 9, 0, 5, h);
  g.fillRect(w/3 - 3, 0, 6, h*0.5); g.fillRect(2*w/3 - 3, 0, 6, h*0.5);
  g.fillStyle = '#2a2c3a'; g.beginPath(); g.arc(w/6, h*.72, 11, 0, 7); g.fill();
  g.strokeStyle = '#4c4e60'; g.lineWidth = 2; for (let i = -8; i <= 8; i += 4){ g.beginPath(); g.moveTo(w/6 - 9, h*.72 + i); g.lineTo(w/6 + 9, h*.72 + i); g.stroke(); }
  g.strokeStyle = 'rgba(20,20,30,.5)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(w*.6, h*.2); g.lineTo(w*.63, h*.27); g.lineTo(w*.61, h*.33); g.stroke();
});
roadTex.wrapS = roadTex.wrapT = THREE.RepeatWrapping; roadTex.repeat.set(1, 40);
const roadMat = new THREE.MeshLambertMaterial({map: roadTex});
const road = new THREE.Mesh(new THREE.PlaneGeometry(6.6, 400), roadMat);
road.rotation.x = -Math.PI/2; road.position.z = -120; road.receiveShadow = true; worldG.add(road);

const walkTex = canvasTex(128, 128, (g, w, h) => {
  g.fillStyle = '#9b97a8'; g.fillRect(0, 0, w, h);
  g.strokeStyle = '#7d798c'; g.lineWidth = 3;
  for (let i = 0; i <= 2; i++){ g.beginPath(); g.moveTo(0, i*h/2); g.lineTo(w, i*h/2); g.stroke(); g.beginPath(); g.moveTo(i*w/2, 0); g.lineTo(i*w/2, h); g.stroke(); }
  g.fillStyle = '#6d697c'; g.fillRect(0, 0, 7, h); g.fillRect(w - 7, 0, 7, h);
});
walkTex.wrapS = walkTex.wrapT = THREE.RepeatWrapping;
const tileTex = walkTex.clone(); tileTex.needsUpdate = true; tileTex.repeat.set(1, 5/3);
const walkMat = new THREE.MeshLambertMaterial({map: tileTex});
const TILE_LEN = 5, TILE_N = 80;
const tileGeo = new THREE.BoxGeometry(3, .25, 1);
const tiles = [];
for (const side of [-1, 1]) for (let i = 0; i < TILE_N; i++){
  const t = new THREE.Mesh(tileGeo, walkMat); t.position.set(side*4.8, .125, 0); t.scale.z = TILE_LEN;
  t.userData = {side, z:0, idx:i}; t.receiveShadow = true; worldG.add(t); tiles.push(t);
}
const groundMat = new THREE.MeshLambertMaterial({color: 0x2a2540});
const ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), groundMat);
ground.rotation.x = -Math.PI/2; ground.position.set(0, -0.02, -100); scene.add(ground);

// --- buildings
function buildingSize(W){ return {w: 4 + Math.random()*4, d: 6 + Math.random()*8, h: W.lowBuildings ? 3 + Math.random()*5 : 7 + Math.random()*18}; }
// Two textures per building: the facade, and a glow map with only the lit windows (they shine at night)
function makeWindowTex(W, cols, rows){
  const base = pick(W.buildings), lit = [];
  const map = canvasTex(cols*16, rows*16, (g, Wd, H) => {
    g.fillStyle = base; g.fillRect(0, 0, Wd, H);
    g.fillStyle = 'rgba(255,255,255,.06)'; for (let r = 0; r < rows; r += 3) g.fillRect(0, r*16, Wd, 2);
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++){
      const on = Math.random() < W.litChance, col = on ? pick(W.lit) : W.dark;
      g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(c*16 + 3, r*16 + 3, 10, 11);
      g.fillStyle = col; g.fillRect(c*16 + 4, r*16 + 4, 8, 9);
      if (on) lit.push([c, r, col]);
    }
  });
  const glow = canvasTex(cols*16, rows*16, (g, Wd, H) => {
    g.fillStyle = '#000'; g.fillRect(0, 0, Wd, H);
    for (const [c, r, col] of lit){ g.fillStyle = col; g.fillRect(c*16 + 4, r*16 + 4, 8, 9); }
  });
  return {map, glow};
}
function buildingMat(t){ return new THREE.MeshLambertMaterial({map: t.map, emissive: 0xffffff, emissiveMap: t.glow, emissiveIntensity: palCur ? palCur.glow : .3}); }
const roofMat = lam(0x2a2833), acMat = lam(0x8a8f99);
function addRoof(m, sx, h, sz){
  for (const c of [...m.children]){ m.remove(c); }
  const ledge = new THREE.Mesh(boxGeo, roofMat); ledge.scale.set(1 + .3/sx, .3/h, 1 + .3/sz); ledge.position.y = .5 + .15/h; m.add(ledge);
  if (Math.random() < .7){
    const ac = new THREE.Mesh(boxGeo, acMat); ac.scale.set(1.2/sx, .7/h, 1.0/sz);
    ac.position.set((Math.random() - .5)*.5, .5 + .65/h, (Math.random() - .5)*.5); m.add(ac);
  }
  if (Math.random() < .35){
    const tank = new THREE.Mesh(cylGeo(.6, .6, 1.4, 12), lam(0x6a4a3a)); tank.scale.set(1/sx, 1/h, 1/sz);
    tank.position.set((Math.random() - .5)*.4, .5 + 1.0/h, (Math.random() - .5)*.4); m.add(tank);
  }
}
function makeBuildingMesh(W, sx, h, sz){
  const t = makeWindowTex(W, Math.max(2, Math.round(Math.max(sx, sz)/1.6)), Math.max(2, Math.round(h/2)));
  const m = new THREE.Mesh(boxGeo, buildingMat(t));
  m.scale.set(sx, h, sz); m.userData.tex = t.map; m.userData.glow = t.glow; addRoof(m, sx, h, sz); return m;
}
const buildings = [];
function skinMainBuilding(b){
  const W = WORLDS[worldIdx], s = buildingSize(W);
  if (b.userData.tex){ b.userData.tex.dispose(); b.userData.glow.dispose(); }
  const t = makeWindowTex(W, Math.max(2, Math.round(s.d/1.6)), Math.max(2, Math.round(s.h/2)));
  b.material.map = t.map; b.material.emissiveMap = t.glow; b.material.needsUpdate = true; b.userData.tex = t.map; b.userData.glow = t.glow;
  b.scale.set(s.w, s.h, s.d); addRoof(b, s.w, s.h, s.d); b.position.x = b.userData.side*(6.4 + s.w/2); b.position.y = s.h/2;
  b.userData.d = s.d; b.userData.world = worldIdx;
}

// --- lamps & decorations (per world)
const PROP_SPACING = 16, PROP_COUNT = 17;
const haloMat = new THREE.SpriteMaterial({map: glowTex, color: 0xffd27a, transparent:true, opacity:.5, blending: THREE.AdditiveBlending, depthWrite:false});
const props = [];
function makeLamp(side){
  const g = new THREE.Group();
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(.07, .09, 4.2, 6), lam(0x2b2d3a)); pole.position.y = 2.1; g.add(pole);
  box(.9, .08, .08, lam(0x2b2d3a), -side*.4, 4.15, 0, g);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(.17, 10, 8), glowMat(0xffe7a0)); bulb.position.set(-side*.8, 4.02, 0); g.add(bulb);
  cone(.28, .22, lam(0x2b2d3a), -side*.8, 4.18, 0, g, 10);
  const halo = new THREE.Sprite(haloMat); halo.scale.set(2.2, 2.2, 1); halo.position.set(-side*.8, 4.0, 0); g.add(halo);
  g.position.x = side*3.7; return g;
}
const goldMat = new THREE.MeshPhongMaterial({color:0xffcf3a, shininess:90, specular:0xfff0a0, emissive:0x3a2600});
function makeDeco(kind, side){
  const g = new THREE.Group();
  if (kind === 'neon'){
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, 3.2, 6), lam(0x22232e)); pole.position.y = 1.6; g.add(pole);
    box(.14, .9, 1.7, basic(pick([0xff3fd2, 0x3ff6ff, 0xffe066, 0x7dff7a])), 0, 3.0, 0, g);
  } else if (kind === 'cactus'){
    const m = lam(0x3f8f4a);
    const t = new THREE.Mesh(new THREE.CylinderGeometry(.22, .26, 2.2, 8), m); t.position.y = 1.1; g.add(t);
    for (const sx of [-1, 1]){
      const yb = sx > 0 ? 1.25 : .9;
      const a = new THREE.Mesh(new THREE.CylinderGeometry(.13, .13, .8, 6), m); a.position.set(sx*.45, yb + .4, 0); g.add(a);
      box(.4, .18, .18, m, sx*.27, yb, 0, g);
    }
  } else if (kind === 'pine'){
    const tr = new THREE.Mesh(new THREE.CylinderGeometry(.12, .16, .9, 6), lam(0x5a3b26)); tr.position.y = .45; g.add(tr);
    for (const [r, h, y] of [[1.1, 1.2, 1.1], [.85, 1.0, 1.8], [.6, .9, 2.45]]){ const c = new THREE.Mesh(new THREE.ConeGeometry(r, h, 8), lam(0x1f5a3a)); c.position.y = y; g.add(c); }
    const cap = new THREE.Mesh(new THREE.ConeGeometry(.36, .42, 8), lam(0xffffff)); cap.position.y = 2.82; g.add(cap);
  } else if (kind === 'palm'){
    let y = 0, x = 0;
    for (let i = 0; i < 5; i++){
      const s = new THREE.Mesh(new THREE.CylinderGeometry(.13, .16, .82, 6), lam(0x8a6a3a));
      x -= side*.09; s.position.set(x, y + .41, 0); s.rotation.z = side*.11; g.add(s); y += .78;
    }
    for (let i = 0; i < 6; i++){
      const a = i/6*Math.PI*2;
      const leaf = box(1.6, .06, .36, lam(0x2f9a4a), x + Math.cos(a)*.7, y + .02, Math.sin(a)*.7, g);
      leaf.rotation.set(0, -a, -.32);
    }
    for (let i = 0; i < 3; i++){ const c = new THREE.Mesh(new THREE.SphereGeometry(.12, 6, 5), lam(0x5a3a1a)); c.position.set(x + Math.cos(i*2.1)*.18, y - .15, Math.sin(i*2.1)*.18); g.add(c); }
  } else if (kind === 'goldtree'){
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(.12, .16, 1.4, 6), goldMat); trunk.position.y = .95; g.add(trunk);
    const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 0), goldMat); crown.position.y = 2.3; crown.scale.set(1, 1.15, 1); g.add(crown);
  } else {
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(.12, .16, 1.4, 6), lam(0x5a3b26)); trunk.position.y = .95; g.add(trunk);
    const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 0), lam(0x2f7a4a)); crown.position.y = 2.3; crown.scale.set(1, 1.15, 1); g.add(crown);
  }
  g.position.x = side*5.6; return g;
}
function disposeGroup(g){ g.traverse(o => { if (o.geometry && o.geometry !== boxGeo && o.geometry !== tileGeo) o.geometry.dispose(); }); }
function replaceDeco(k){
  const p = props[k], n = makeDeco(WORLDS[worldIdx].prop, p.userData.side);
  n.position.copy(p.position); n.visible = p.visible; n.userData = Object.assign({}, p.userData, {world: worldIdx});
  worldG.remove(p); disposeGroup(p); worldG.add(n); props[k] = n;
}

// --- palette (sky, fog, light, ground) blends between worlds
const skyCanvas = document.createElement('canvas'); skyCanvas.width = 256; skyCanvas.height = 256;
const STARS = Array.from({length: 90}, () => [Math.random()*256, Math.random()*130, Math.random()*1.3 + .4, Math.random()]);
const skyCtx = skyCanvas.getContext('2d'); const skyTex = new THREE.CanvasTexture(skyCanvas);
scene.background = skyTex;
function worldPalette(W){
  const C = c => new THREE.Color(c);
  return {sky: W.sky.map(C), fog: C(W.fog), hemiSky: C(W.hemiSky), hemiGround: C(W.hemiGround), ground: C(W.ground), walk: C(W.walk), road: C(W.road), hemiI: W.hemiI, sunI: W.sunI, glow: W.glow, stars: W.stars};
}
const PAL_KEYS = ['fog', 'hemiSky', 'hemiGround', 'ground', 'walk', 'road'];
function lerpPal(a, b, t){
  const L = k => a[k] + (b[k] - a[k])*t;
  const o = {sky: a.sky.map((c, i) => c.clone().lerp(b.sky[i], t)), hemiI: L('hemiI'), sunI: L('sunI'), glow: L('glow'), stars: L('stars')};
  for (const k of PAL_KEYS) o[k] = a[k].clone().lerp(b[k], t);
  return o;
}
function applyPalette(p){
  const gr = skyCtx.createLinearGradient(0, 0, 0, 256);
  [0, .45, .75, 1].forEach((s, i) => gr.addColorStop(s, '#' + p.sky[i].getHexString()));
  skyCtx.fillStyle = gr; skyCtx.fillRect(0, 0, 256, 256);
  if (p.stars > .02) for (const [x, y, r, a] of STARS){ skyCtx.fillStyle = `rgba(255,255,255,${(.35 + a*.65)*p.stars})`; skyCtx.fillRect(x, y, r, r); }
  skyTex.needsUpdate = true;
  sun.intensity = p.sunI; haloMat.opacity = .25 + p.glow*.75;
  for (const b of buildings) b.material.emissiveIntensity = p.glow;
  scene.fog.color.copy(p.fog); hemi.color.copy(p.hemiSky); hemi.groundColor.copy(p.hemiGround); hemi.intensity = p.hemiI;
  groundMat.color.copy(p.ground); walkMat.color.copy(p.walk); roadMat.color.copy(p.road);
}
let worldIdx = 0;
let palCur = worldPalette(WORLDS[0]), palFrom = palCur, palTo = palCur, palT = 1;
applyPalette(palCur);

for (const side of [-1, 1]){
  for (let i = 0; i < 20; i++){ const b = new THREE.Mesh(boxGeo, new THREE.MeshLambertMaterial({emissive:0xffffff, emissiveIntensity:palCur.glow})); b.userData = {side}; skinMainBuilding(b); worldG.add(b); buildings.push(b); }
  for (let i = 0; i < PROP_COUNT; i++){
    const l = makeLamp(side); l.userData = {side, kind:'lamp'}; worldG.add(l); props.push(l);
    const t = makeDeco(WORLDS[0].prop, side); t.userData = {side, kind:'deco', world:0}; worldG.add(t); props.push(t);
  }
}
function layoutMain(bStart, tStart){
  for (const side of [-1, 1]){
    let z = bStart;
    for (const b of buildings) if (b.userData.side === side){ b.position.z = z - b.userData.d/2; z -= b.userData.d + Math.random()*1.5; b.visible = true; }
    let li = 0, di = 0, ti = 0;
    for (const p of props) if (p.userData.side === side){
      p.position.z = p.userData.kind === 'lamp' ? bStart - (li++)*PROP_SPACING : bStart - PROP_SPACING/2 - (di++)*PROP_SPACING;
      p.visible = true;
    }
    for (const t of tiles) if (t.userData.side === side){ t.userData.z = tStart - TILE_LEN/2 - (ti++)*TILE_LEN; }
  }
}
function setWorld(i, instant){
  worldIdx = i; const W = WORLDS[i];
  palTo = worldPalette(W);
  const pill = $('worldPill'); if (pill) pill.textContent = `${W.emoji} ${W.name}`;
  if (instant){
    palCur = palTo; palFrom = palTo; palT = 1; applyPalette(palCur);
    for (const b of buildings) skinMainBuilding(b);
    props.forEach((p, k) => { if (p.userData.kind === 'deco') replaceDeco(k); });
    layoutMain(70, 80);
  } else {
    palFrom = palCur; palT = 0;
    showWorldBanner(W); sfx('power');
  }
}
function updatePalette(dt){
  if (palT >= 1) return;
  palT = Math.min(1, palT + dt/2.5);
  palCur = lerpPal(palFrom, palTo, palT*palT*(3 - 2*palT));
  applyPalette(palCur);
}

// --- snow for the winter world
const SNOW_N = 700, snowPos = new Float32Array(SNOW_N*3);
for (let i = 0; i < SNOW_N; i++){ snowPos[i*3] = (Math.random() - .5)*30; snowPos[i*3 + 1] = Math.random()*14; snowPos[i*3 + 2] = -40 + Math.random()*50; }
const snowGeo = new THREE.BufferGeometry(); snowGeo.setAttribute('position', new THREE.BufferAttribute(snowPos, 3));
const snowMat = new THREE.PointsMaterial({color:0xffffff, size:.16, transparent:true, opacity:0, depthWrite:false});
const snow = new THREE.Points(snowGeo, snowMat); snow.frustumCulled = false; scene.add(snow);
function updateSnow(dt, speed){
  const target = WORLDS[worldIdx].snow ? .9 : 0;
  snowMat.opacity += (target - snowMat.opacity)*Math.min(1, dt*1.5);
  snow.visible = snowMat.opacity > .01;
  if (!snow.visible) return;
  for (let i = 0; i < SNOW_N; i++){
    snowPos[i*3 + 1] -= dt*(2 + (i % 5)*.3);
    snowPos[i*3] += Math.sin(i + snowPos[i*3 + 1])*dt*.3;
    snowPos[i*3 + 2] += speed*dt*.35;
    if (snowPos[i*3 + 1] < 0) snowPos[i*3 + 1] += 14;
    if (snowPos[i*3 + 2] > 10) snowPos[i*3 + 2] -= 50;
  }
  snowGeo.attributes.position.needsUpdate = true;
}

// --- scrolling: everything in worldG moves toward the camera (+z)
function scrollWorld(d){
  roadTex.offset.y += d/10;
  if (G.junction) G.junction.J.position.z += d;
  const J = G.junction && !G.junction.turned ? G.junction.J : null;
  const lim = J ? J.position.z + 6.3 : -Infinity;
  for (let k = 0; k < props.length; k++){
    let p = props[k];
    p.position.z += d;
    if (p.position.z > 70){
      p.position.z -= PROP_COUNT*PROP_SPACING;
      if (p.userData.kind === 'deco' && p.userData.world !== worldIdx){ replaceDeco(k); p = props[k]; }
    }
    p.visible = !J || p.position.z > lim;
  }
  for (const b of buildings){
    b.position.z += d;
    if (b.position.z - b.userData.d/2 > 70){
      if (b.userData.world !== worldIdx) skinMainBuilding(b);
      let minZ = Infinity;
      for (const o of buildings) if (o.userData.side === b.userData.side && o !== b) minZ = Math.min(minZ, o.position.z - o.userData.d/2);
      b.position.z = minZ - Math.random()*1.5 - b.userData.d/2;
    }
    b.visible = !J || b.position.z - b.userData.d/2 > lim + 16;
  }
  for (const t of tiles){
    const u = t.userData; u.z += d;
    if (u.z - TILE_LEN/2 > 80) u.z -= TILE_N*TILE_LEN;
    const near = u.z + TILE_LEN/2, far = u.z - TILE_LEN/2;
    if (!J || far >= lim){ t.visible = true; t.position.z = u.z; t.scale.z = TILE_LEN; }
    else if (near <= lim){ t.visible = false; }
    else { t.visible = true; t.position.z = (near + lim)/2; t.scale.z = near - lim; }
  }
}

