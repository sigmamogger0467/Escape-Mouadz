'use strict';
/* ================= World scenery ================= */
const LANES = [-2.2, 0, 2.2];
// turnG pivots the whole street around the runner when turning at a crossing
const turnG = new THREE.Group(), worldG = new THREE.Group(); turnG.add(worldG); scene.add(turnG);

const roadTex = canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = '#4a4c66'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 900; i++){ g.fillStyle = `rgba(255,255,255,${Math.random()*.05})`; g.fillRect(Math.random()*w, Math.random()*h, 3, 3); }
  g.fillStyle = '#ffd23a'; g.fillRect(5, 0, 6, h); g.fillRect(w - 11, 0, 6, h);
  g.fillStyle = '#f6f2e8';
  for (const x of [w/3, 2*w/3]){ g.beginPath(); g.roundRect ? g.roundRect(x - 4, 10, 8, h*.42, 4) : g.rect(x - 4, 10, 8, h*.42); g.fill(); }
  g.fillStyle = '#34364c'; g.beginPath(); g.arc(w/6, h*.72, 12, 0, 7); g.fill();
  g.strokeStyle = '#5a5c76'; g.lineWidth = 2; for (let i = -8; i <= 8; i += 4){ g.beginPath(); g.moveTo(w/6 - 9, h*.72 + i); g.lineTo(w/6 + 9, h*.72 + i); g.stroke(); }
  g.strokeStyle = '#2a2c40'; g.lineWidth = 2.5; g.beginPath(); g.arc(w/6, h*.72, 12, 0, 7); g.stroke();
});
roadTex.wrapS = roadTex.wrapT = THREE.RepeatWrapping; roadTex.repeat.set(1, 40);
const roadMat = toon({map: roadTex});
const road = new THREE.Mesh(new THREE.PlaneGeometry(6.6, 400), roadMat);
road.rotation.x = -Math.PI/2; road.position.z = -120; road.receiveShadow = true; worldG.add(road);

const walkTex = canvasTex(128, 128, (g, w, h) => {
  g.fillStyle = '#b8b4c8'; g.fillRect(0, 0, w, h);
  g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(4, 4, w/2 - 8, h/2 - 8); g.fillRect(w/2 + 4, h/2 + 4, w/2 - 8, h/2 - 8);
  g.strokeStyle = '#8c88a0'; g.lineWidth = 4;
  for (let i = 0; i <= 2; i++){ g.beginPath(); g.moveTo(0, i*h/2); g.lineTo(w, i*h/2); g.stroke(); g.beginPath(); g.moveTo(i*w/2, 0); g.lineTo(i*w/2, h); g.stroke(); }
  g.fillStyle = '#6d697c'; g.fillRect(0, 0, 9, h); g.fillRect(w - 9, 0, 9, h);
});
walkTex.wrapS = walkTex.wrapT = THREE.RepeatWrapping;
const tileTex = walkTex.clone(); tileTex.needsUpdate = true; tileTex.repeat.set(1, 5/3);
const walkMat = toon({map: tileTex});
const TILE_LEN = 5, TILE_N = 80;
const tileGeo = new THREE.BoxGeometry(3, .25, 1);
// sidewalk slabs: one instanced mesh, each slab is a light object holding its position and clip
const tiles = [];
const tilesIM = new THREE.InstancedMesh(tileGeo, walkMat, TILE_N*2);
tilesIM.receiveShadow = true; tilesIM.frustumCulled = false; worldG.add(tilesIM);
for (const side of [-1, 1]) for (let i = 0; i < TILE_N; i++){
  const t = new THREE.Object3D(); t.position.set(side*4.8, .125, 0); t.scale.z = TILE_LEN;
  t.userData = {side, z:0, idx:i}; tiles.push(t);
}
function syncTiles(){
  tiles.forEach((t, i) => { if (!t.visible) t.scale.set(0, 0, 0); else t.scale.x = t.scale.y = 1; t.updateMatrix(); tilesIM.setMatrixAt(i, t.matrix); });
  tilesIM.instanceMatrix.needsUpdate = true;
}
const groundMat = toon({color: 0x2a2540});
const ground = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), groundMat);
ground.rotation.x = -Math.PI/2; ground.position.set(0, -0.02, -150); scene.add(ground);

/* --- buildings: facade textures by style --- */
function buildingSize(W){ return {w: 4 + Math.random()*4, d: 6 + Math.random()*8, h: W.bh[0] + Math.random()*(W.bh[1] - W.bh[0])}; }
const shade = (hex, k) => { const c = new THREE.Color(hex); c.multiplyScalar(k); return '#' + c.getHexString(); };
// Two textures per building: the facade, and a glow map that only holds the lit windows (they shine at night)
function makeWindowTex(W, cols, rows){
  const base = pick(W.buildings), lit = [], C = 16, f = W.facade;
  const cell = (g, c, r, col, on) => {
    const x = c*C, y = r*C;
    if (f === 'arch'){
      g.fillStyle = col; g.beginPath(); g.moveTo(x + 4, y + 14); g.lineTo(x + 4, y + 8); g.arc(x + 8, y + 8, 4, Math.PI, 0); g.lineTo(x + 12, y + 14); g.fill();
    } else if (f === 'japan'){
      g.fillStyle = on ? col : '#f4ead0'; g.fillRect(x + 3, y + 3, 10, 10);
      g.fillStyle = 'rgba(60,30,20,.7)'; g.fillRect(x + 7.5, y + 3, 1, 10); g.fillRect(x + 3, y + 7.5, 10, 1);
    } else {
      g.fillStyle = col; g.fillRect(x + 4, y + (f === 'euro' ? 2 : 4), 8, f === 'euro' ? 12 : 9);
      g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(x + 4, y + (f === 'euro' ? 2 : 4), 8, 2);
    }
    if (on) lit.push([x, y]);
  };
  const map = canvasTex(cols*C, rows*C, (g, Wd, H) => {
    const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, base); gr.addColorStop(1, shade(base, .82));
    g.fillStyle = gr; g.fillRect(0, 0, Wd, H);
    if (f === 'brick'){ g.fillStyle = 'rgba(0,0,0,.12)'; for (let y = 0; y < H; y += 4) g.fillRect(0, y, Wd, 1); }
    if (f === 'japan'){ g.fillStyle = 'rgba(0,0,0,.15)'; for (let x = 0; x < Wd; x += 5) g.fillRect(x, 0, 1.5, H); }
    for (let r = 0; r < rows; r++){
      if (f === 'euro' || f === 'brick'){ g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(0, r*C + 14, Wd, 2); }
      if (f === 'timber'){ g.fillStyle = '#5a3420'; g.fillRect(0, r*C, Wd, 2.5); }
      for (let c = 0; c < cols; c++){
        const on = Math.random() < W.litChance;
        if (f === 'timber'){ g.fillStyle = '#5a3420'; g.fillRect(c*C, r*C, 2.5, C); g.beginPath(); g.moveTo(c*C, r*C); g.lineTo(c*C + C, r*C + C); g.lineWidth = 2; g.strokeStyle = '#5a3420'; if ((c + r) % 3 === 0) g.stroke(); }
        g.fillStyle = 'rgba(0,0,0,.2)'; if (f !== 'arch' && f !== 'japan') g.fillRect(c*C + 3, r*C + 3, 10, 11);
        cell(g, c, r, on ? pick(W.lit) : W.dark, on);
        if (f === 'euro' && c % 2 === 0){ g.fillStyle = 'rgba(40,80,60,.8)'; g.fillRect(c*C + 1.5, r*C + 2, 2, 12); g.fillRect(c*C + 12.5, r*C + 2, 2, 12); }
      }
    }
    if (f === 'shop') for (let i = 0; i < Math.max(1, cols/3); i++){
      const x = (Math.random()*(cols - 1)|0)*C + 4;
      g.fillStyle = pick(['#ff4a5a', '#ffd23a', '#3ac8ff', '#ff6ae0']); g.fillRect(x, C, 8, H*.6);
      g.fillStyle = 'rgba(255,255,255,.85)'; for (let y = C + 4; y < C + H*.6 - 6; y += 9) g.fillRect(x + 2, y, 4, 5);
    }
    if (f === 'favela'){ g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(0, H - 6, Wd, 3); }
    g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(0, H - 3, Wd, 3);
  });
  const glow = canvasTex(cols*C, rows*C, (g, Wd, H) => {
    g.fillStyle = '#000'; g.fillRect(0, 0, Wd, H);
    g.fillStyle = '#ffe9b0';
    for (const [x, y] of lit) g.fillRect(x + 4, y + 4, 8, 9);
  });
  return {map, glow};
}
function buildingMat(t){ return toon({map: t.map, emissive: 0xffffff, emissiveMap: t.glow, emissiveIntensity: palCur ? palCur.glow : .3}); }
const roofMat = lam(0x3a3646), acMat = lam(0x9a9fb0);
// unit triangular prism (pitched roof): base -0.5..0.5 in x and z, apex at y = 1
const prismGeo = (() => {
  const g = new THREE.BufferGeometry(), p = [];
  const A = [-.5, 0, -.5], B = [.5, 0, -.5], T = [0, 1, -.5], A2 = [-.5, 0, .5], B2 = [.5, 0, .5], T2 = [0, 1, .5];
  const tri = (...v) => v.forEach(x => p.push(...x));
  tri(A, T, B); tri(A2, B2, T2); tri(A, A2, T2); tri(A, T2, T); tri(B, T, T2); tri(B, T2, B2); tri(A, B, B2); tri(A, B2, A2);
  g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); g.computeVertexNormals(); return g;
})();
const prismEdges = new THREE.EdgesGeometry(prismGeo);
const pagodaGeo = new THREE.ConeGeometry(.75, 1, 4, 1); pagodaGeo.rotateY(Math.PI/4);
const domeGeo = new THREE.SphereGeometry(.5, 18, 10, 0, Math.PI*2, 0, Math.PI/2);
function addRoof(m, sx, h, sz, W){
  for (const c of [...m.children]) m.remove(c);
  m.userData.nearShown = undefined;
  W = W || WORLDS[worldIdx];
  const edges = new THREE.LineSegments(edgesGeo, edgeMat); m.add(edges);
  const rc = lam(W.roofColor);
  if (W.roof === 'pitched'){
    const rh = Math.min(3, sx*.45);
    const r = new THREE.Mesh(prismGeo, rc); r.scale.set(1 + .5/sx, rh/h, 1 + .3/sz); r.position.y = .5; r.castShadow = true; m.add(r);
    const e = new THREE.LineSegments(prismEdges, edgeMat); e.scale.copy(r.scale); e.position.copy(r.position); m.add(e);
    if (Math.random() < .5){ const ch = new THREE.Mesh(boxGeo, lam(0x8a4a3a)); ch.scale.set(.5/sx, 1.6/h, .5/sz); ch.position.set(.22, .5 + .6/h, (Math.random() - .5)*.4); m.add(ch); }
  } else if (W.roof === 'pagoda'){
    const r = new THREE.Mesh(pagodaGeo, rc); r.scale.set(1.1, 1.2/h, 1.1); r.position.y = .5 + .6/h; m.add(r);
    const t2 = new THREE.Mesh(pagodaGeo, rc); t2.scale.set(.55, .9/h, .55); t2.position.y = .5 + 1.5/h; m.add(t2);
  } else {
    const ledge = new THREE.Mesh(boxGeo, roofMat); ledge.scale.set(1 + .3/sx, .3/h, 1 + .3/sz); ledge.position.y = .5 + .15/h; m.add(ledge);
    if (W.facade === 'arch' && Math.random() < .3){
      const D = Math.min(sx, sz)*.55, dm = new THREE.Mesh(domeGeo, lam(pick([0xf4f0e0, 0x3ab0a0, 0xd8b040])));
      dm.scale.set(D/sx, D/h, D/sz); dm.position.y = .5 + .3/h; m.add(dm);
    } else if (Math.random() < .6){
      const ac = new THREE.Mesh(boxGeo, acMat); ac.scale.set(1.2/sx, .7/h, 1.0/sz);
      ac.position.set((Math.random() - .5)*.5, .5 + .65/h, (Math.random() - .5)*.5); m.add(ac);
    }
    if (W.facade === 'city' && Math.random() < .3){
      const tank = new THREE.Mesh(cylGeo(.6, .6, 1.4, 12), lam(0x8a5a40)); tank.scale.set(1/sx, 1/h, 1/sz);
      tank.position.set((Math.random() - .5)*.4, .5 + 1.0/h, (Math.random() - .5)*.4); m.add(tank);
    }
  }
}
function makeBuildingMesh(W, sx, h, sz){
  const t = makeWindowTex(W, Math.max(2, Math.round(Math.max(sx, sz)/1.6)), Math.max(2, Math.round(h/2)));
  const m = new THREE.Mesh(boxGeo, buildingMat(t));
  m.scale.set(sx, h, sz); m.userData.tex = t.map; m.userData.glow = t.glow; addRoof(m, sx, h, sz, W); return m;
}
const buildings = [];
function skinMainBuilding(b){
  const W = WORLDS[worldIdx], s = buildingSize(W);
  if (b.userData.tex){ b.userData.tex.dispose(); b.userData.glow.dispose(); }
  const t = makeWindowTex(W, Math.max(2, Math.round(s.d/1.6)), Math.max(2, Math.round(s.h/2)));
  b.material.map = t.map; b.material.emissiveMap = t.glow; b.material.needsUpdate = true; b.userData.tex = t.map; b.userData.glow = t.glow;
  b.scale.set(s.w, s.h, s.d); addRoof(b, s.w, s.h, s.d, W);
  b.position.x = b.userData.side*(6.4 + s.w/2); b.position.y = s.h/2;
  b.userData.d = s.d; b.userData.world = W.id;
}

/* --- lamps & decorations (per world) --- */
const PROP_SPACING = 16, PROP_COUNT = 17;
const haloMat = new THREE.SpriteMaterial({map: glowTex, color: 0xffd27a, transparent:true, opacity:.5, blending: THREE.AdditiveBlending, depthWrite:false});
const props = [];
function makeLamp(side){
  const g = new THREE.Group(), dark = std(0x2b2d3a);
  cyl(.08, .11, 4.2, dark, 0, 2.1, 0, g, 10);
  cyl(.18, .2, .2, dark, 0, .1, 0, g, 12);
  rbox(.9, .08, .08, dark, -side*.4, 4.15, 0, g, .03);
  sph(.17, glowMat(0xfff0b0), -side*.8, 4.0, 0, g);
  cone(.3, .24, dark, -side*.8, 4.16, 0, g, 14);
  const halo = new THREE.Sprite(haloMat); halo.scale.set(2.4, 2.4, 1); halo.position.set(-side*.8, 4.0, 0); g.add(halo);
  outlineAll(g); mergeTree(g);
  g.position.x = side*3.7; return g;
}
const goldMat = toon({color:0xffcf3a, emissive:0x5a3a00});
function puffTree(g, trunkCol, cols, scale){
  const s = scale || 1;
  cyl(.13*s, .18*s, 1.5*s, std(trunkCol), 0, .75*s, 0, g, 10);
  const crown = std(cols[0]);
  sph(.8*s, crown, 0, 2.2*s, 0, g);
  sph(.6*s, crown, .45*s, 1.95*s, .2*s, g);
  sph(.55*s, crown, -.4*s, 2.0*s, -.15*s, g);
  sph(.5*s, crown, .05*s, 2.75*s, .1*s, g);
}
function makeDeco(kind, side){
  const g = new THREE.Group();
  if (kind === 'neon'){
    cyl(.06, .06, 3.2, std(0x22232e), 0, 1.6, 0, g, 8);
    rbox(.16, .95, 1.7, glowMat(pick([0xff3fd2, 0x3ff6ff, 0xffe066, 0x7dff7a])), 0, 3.0, 0, g, .06);
  } else if (kind === 'cactus'){
    const m = std(0x4caf50);
    caps(.26, 1.5, m, 0, 1.0, 0, g);
    for (const sx of [-1, 1]){ const yb = sx > 0 ? 1.2 : .85; caps(.14, .45, m, sx*.5, yb + .35, 0, g); caps(.12, .3, m, sx*.3, yb, 0, g).rotation.z = Math.PI/2; }
    sph(.1, std(0xff6ab0), 0, 1.95, 0, g);
  } else if (kind === 'pine'){
    cyl(.12, .16, .9, std(0x6a4026), 0, .45, 0, g, 8);
    for (const [r, h, y] of [[1.15, 1.25, 1.15], [.88, 1.05, 1.85], [.62, .9, 2.5]]) cone(r, h, std(0x2a8a50), 0, y, 0, g, 12);
    cone(.38, .45, std(0xffffff), 0, 2.86, 0, g, 12);
  } else if (kind === 'palm'){
    let y = 0, x = 0;
    for (let i = 0; i < 5; i++){ const s = cyl(.14, .17, .82, std(0x8a6234), 0, 0, 0, g, 10); x -= side*.09; s.position.set(x, y + .41, 0); s.rotation.z = side*.11; y += .78; }
    for (let i = 0; i < 7; i++){ const a = i/7*Math.PI*2; const leaf = rbox(1.7, .07, .4, std(0x34ac46), x + Math.cos(a)*.75, y + .02, Math.sin(a)*.75, g, .03); leaf.rotation.set(0, -a, -.34); }
    for (let i = 0; i < 3; i++) sph(.13, std(0x6a4a2a), x + Math.cos(i*2.1)*.18, y - .15, Math.sin(i*2.1)*.18, g);
  } else if (kind === 'goldtree'){
    cyl(.13, .18, 1.5, goldMat, 0, .75, 0, g, 10);
    sph(.8, goldMat, 0, 2.2, 0, g); sph(.55, goldMat, .45, 2.0, .2, g); sph(.5, goldMat, -.4, 2.6, 0, g);
  } else if (kind === 'blossom'){
    puffTree(g, 0x5a3a3a, [0xffb0d4, 0xff8ac0, 0xffd0e4]);
  } else if (kind === 'jungle'){
    puffTree(g, 0x5a4026, [0x1f8a3a, 0x2aa048, 0x167030], 1.35);
    for (let i = 0; i < 4; i++) sph(.08, std(pick([0xff4a5a, 0xffd23a, 0x3ac8ff])), Math.cos(i)*.8, 2.4 + i*.15, Math.sin(i)*.8, g);
  } else if (kind === 'lantern'){
    cyl(.05, .05, 3.0, std(0x2a1a1a), 0, 1.5, 0, g, 8);
    rbox(.7, .05, .05, std(0x2a1a1a), -side*.3, 2.95, 0, g, .02);
    sph(.32, toon({color:0xff4a3a, emissive:0x902010}), -side*.55, 2.45, 0, g, 1, 1.3, 1);
    cyl(.16, .16, .08, std(0x1a1a1a), -side*.55, 2.88, 0, g, 12); cyl(.16, .16, .08, std(0x1a1a1a), -side*.55, 2.02, 0, g, 12);
  } else if (kind === 'lavender'){
    for (const z of [-.9, 0, .9]){ sph(.42, std(0x9a6ad8), 0, .32, z, g, 1, .75, 1); sph(.3, std(0xb88af0), .05, .55, z, g); }
  } else if (kind === 'bush'){
    sph(.6, std(0x3aa84a), 0, .45, 0, g, 1, .8, 1); sph(.42, std(0x4cbf5a), .4, .55, .2, g);
    for (let i = 0; i < 6; i++) sph(.07, std(pick([0xff6ab0, 0xffd23a, 0xffffff])), Math.cos(i)*.5, .7 + (i % 2)*.12, Math.sin(i)*.5, g);
  } else if (kind === 'umbrella'){
    cyl(.04, .04, 2.4, std(0xf4f4f4), 0, 1.2, 0, g, 8);
    const c = cone(1.1, .5, std(pick([0xff4a5a, 0x3ac8ff, 0xffd23a])), 0, 2.4, 0, g, 12);
    cone(.4, .2, std(0xffffff), 0, 2.62, 0, g, 12);
    rbox(.6, .1, 1.5, std(0xf4f4f4), -side*.2, .35, .6, g, .04).rotation.x = .2;
  } else {
    puffTree(g, 0x6a4026, [0x4cbf4a, 0x3aa840, 0x5ad05a]);
  }
  outlineAll(g); g.traverse(o => { if (o.isMesh && !o.material.isMeshBasicMaterial) o.castShadow = true; }); mergeTree(g);
  g.position.x = side*5.6; return g;
}
function isSharedGeo(geo){
  return geo === boxGeo || geo === tileGeo || geo === sphereGeo || geo === prismGeo || geo === prismEdges || geo === pagodaGeo || geo === domeGeo || geo === edgesGeo || geo.userData.shared;
}
function disposeGroup(g){ g.traverse(o => { if (o.geometry && !isSharedGeo(o.geometry)) o.geometry.dispose(); }); }
function replaceDeco(k){
  const W = WORLDS[worldIdx], p = props[k], n = makeDeco(W.prop, p.userData.side);
  n.position.copy(p.position); n.visible = p.visible; n.userData = Object.assign({}, p.userData, {world: W.id});
  worldG.remove(p); disposeGroup(p); worldG.add(n); props[k] = n;
}

/* --- sky, palette and the backdrop (landmark, clouds, sun or moon) --- */
const skyCanvas = document.createElement('canvas'); skyCanvas.width = 256; skyCanvas.height = 256;
const STARS = Array.from({length: 110}, () => [Math.random()*256, Math.random()*140, Math.random()*1.4 + .5, Math.random()]);
const skyCtx = skyCanvas.getContext('2d'); const skyTex = new THREE.CanvasTexture(skyCanvas);
scene.background = skyTex;
function worldPalette(W){
  const C = c => new THREE.Color(c);
  return {sky: W.sky.map(C), fog: C(W.fog), hemiSky: C(W.hemiSky), hemiGround: C(W.hemiGround), ground: C(W.ground), walk: C(W.walk), road: C(W.road),
          hemiI: W.hemiI, sunI: W.sunI, glow: W.glow, stars: W.stars, clouds: W.clouds ? 1 : 0};
}
const PAL_KEYS = ['fog', 'hemiSky', 'hemiGround', 'ground', 'walk', 'road'];
function lerpPal(a, b, t){
  const L = k => a[k] + (b[k] - a[k])*t;
  const o = {sky: a.sky.map((c, i) => c.clone().lerp(b.sky[i], t)), hemiI: L('hemiI'), sunI: L('sunI'), glow: L('glow'), stars: L('stars'), clouds: L('clouds')};
  for (const k of PAL_KEYS) o[k] = a[k].clone().lerp(b[k], t);
  return o;
}
const backdrop = new THREE.Group(); scene.add(backdrop);
const cloudMat = new THREE.MeshToonMaterial({color: 0xffffff, gradientMap: toonGrad, fog: false, transparent: true, opacity: 1});
const clouds = [];
for (let i = 0; i < 9; i++){
  const c = new THREE.Group();
  const n = 4 + (i % 3);
  for (let k = 0; k < n; k++) sph(4 + Math.random()*3, cloudMat, k*5 - n*2.5, Math.random()*2, Math.random()*2, c, 1, .75, .8);
  c.position.set(-160 + i*40 + Math.random()*15, 45 + Math.random()*35, -280 - Math.random()*40);
  c.scale.setScalar(.8 + Math.random()*.6);
  mergeTree(c); scene.add(c); clouds.push(c);
}
const sunTex = canvasTex(128, 128, (g, w) => {
  const gr = g.createRadialGradient(64, 64, 10, 64, 64, 64);
  gr.addColorStop(0, '#fffbe0'); gr.addColorStop(.35, '#ffe58a'); gr.addColorStop(.45, 'rgba(255,220,120,.5)'); gr.addColorStop(1, 'rgba(255,200,100,0)');
  g.fillStyle = gr; g.fillRect(0, 0, w, w);
});
const moonTex = canvasTex(128, 128, (g, w) => {
  const gr = g.createRadialGradient(64, 64, 20, 64, 64, 64);
  gr.addColorStop(0, 'rgba(200,210,255,.35)'); gr.addColorStop(1, 'rgba(200,210,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, w, w);
  g.fillStyle = '#f2f0e0'; g.beginPath(); g.arc(64, 64, 26, 0, 7); g.fill();
  g.fillStyle = 'rgba(160,160,180,.45)'; for (const [x, y, r] of [[56, 56, 6], [72, 70, 4], [62, 76, 3], [74, 54, 3]]){ g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); }
});
const celestial = new THREE.Sprite(new THREE.SpriteMaterial({map: sunTex, fog: false, depthWrite: false, transparent: true}));
celestial.position.set(70, 85, -340); celestial.scale.set(70, 70, 1); scene.add(celestial);

function lmMats(W){
  const fog = new THREE.Color(W.fog);
  return col => { const k = 'lm' + col + '_' + W.id; return matCache[k] || (matCache[k] = new THREE.MeshToonMaterial({color: new THREE.Color(col).lerp(fog, .38), gradientMap: toonGrad, fog: false})); };
}
// Landmarks are simple cartoon models at the end of the street, far behind everything else.
function buildLandmark(W){
  const g = new THREE.Group(), M = lmMats(W), kind = W.landmark;
  const glowY = (x, y, z, r, col) => { const s = new THREE.Sprite(new THREE.SpriteMaterial({map: glowTex, color: col || 0xfff0a0, fog: false, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false})); s.position.set(x, y, z); s.scale.set(r, r, 1); g.add(s); };
  const night = W.celestial === 'moon';
  const mountain = (x, z, r, h, col, cap) => { cone(r, h, M(col), x, h/2, z, g, 7); if (cap) cone(r*.36, h*.36, M(0xffffff), x, h*.82, z, g, 7); };
  switch (kind){
    case 'capitol':
      rbox(70, 10, 20, M(0xf4f0e6), 0, 5, 0, g, 1);
      for (let i = -3; i <= 3; i++) cyl(1.2, 1.2, 9, M(0xffffff), i*4, 14, 8, g, 10);
      rbox(32, 3, 18, M(0xf4f0e6), 0, 19.5, 0, g, .8);
      cyl(9, 10, 8, M(0xf4f0e6), 0, 25, 0, g, 20); sph(9.5, M(0xffffff), 0, 29, 0, g, 1, .9, 1);
      cyl(1.5, 2, 6, M(0xf4f0e6), 0, 40, 0, g, 10); sph(1.4, M(0xd8c08a), 0, 44, 0, g);
      break;
    case 'liberty':
      rbox(16, 18, 16, M(0x8a8070), 0, 9, 0, g, 1);
      cone(6.5, 26, M(0x5fae9a), 0, 31, 0, g, 12);
      sph(3.4, M(0x5fae9a), 0, 46, 0, g);
      for (let i = 0; i < 7; i++){ const a = -1.2 + i*.4; const s = cone(.8, 4.5, M(0x5fae9a), Math.sin(a)*3.4, 49 + Math.cos(a)*2, 0, g, 6); s.rotation.z = -a; }
      { const arm = cyl(1.1, 1.3, 14, M(0x5fae9a), 4.5, 50, 0, g, 8); arm.rotation.z = -.25; }
      cone(2, 3, M(0xd8a030), 6.3, 57.5, 0, g, 8); glowY(6.3, 60, 1, night ? 16 : 9, 0xffd27a);
      rbox(4, 6, 1.5, M(0x4a9a86), -3.5, 38, -4, g, .5);
      break;
    case 'eiffel': {
      const brown = M(0x8a5a3a);
      for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]){ const leg = rbox(4, 34, 4, brown, sx*9, 15, sz*9, g, .8); leg.rotation.set(sz*.32, 0, -sx*.32); }
      rbox(26, 2.5, 26, brown, 0, 22, 0, g, .5);
      cyl(5.5, 8, 26, brown, 0, 36, 0, g, 4).rotation.y = Math.PI/4;
      rbox(12, 1.6, 12, brown, 0, 49, 0, g, .4);
      cyl(1.4, 4.2, 30, brown, 0, 65, 0, g, 4).rotation.y = Math.PI/4;
      cyl(.3, .6, 8, brown, 0, 84, 0, g, 6);
      if (W.lmGlow){ for (const y of [22, 36, 49, 65]) glowY(0, y, 6, 22, 0xffd27a); glowY(0, 88, 0, 14, 0xffffff); }
      break;
    }
    case 'tokyo': {
      const red = M(0xff5a3a), wht = M(0xffffff);
      for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]){ const leg = rbox(3.5, 30, 3.5, red, sx*8, 13, sz*8, g, .7); leg.rotation.set(sz*.32, 0, -sx*.32); }
      rbox(20, 4, 20, wht, 0, 28, 0, g, .8);
      cyl(4, 7, 22, red, 0, 41, 0, g, 4).rotation.y = Math.PI/4;
      rbox(10, 3, 10, wht, 0, 53, 0, g, .5);
      cyl(1, 3.5, 22, red, 0, 66, 0, g, 4).rotation.y = Math.PI/4;
      for (const y of [58, 66, 74]) cyl(2.6 - (y - 58)*.08, 2.8 - (y - 58)*.08, 2, wht, 0, y, 0, g, 4).rotation.y = Math.PI/4;
      break;
    }
    case 'brandenburg': {
      const st = M(0xe8dcc0);
      rbox(62, 4, 14, st, 0, 2, 0, g, .5);
      for (let i = 0; i < 6; i++) cyl(1.3, 1.5, 20, st, -25 + i*10, 14, 0, g, 12);
      rbox(66, 6, 16, st, 0, 27, 0, g, .8);
      rbox(26, 4, 12, st, 0, 32, 0, g, .6);
      rbox(10, 5, 5, M(0x5a7a6a), 0, 36.5, 0, g, 1);
      for (const sx of [-3, -1, 1, 3]) sph(1.3, M(0x5a7a6a), sx*1.2, 39, -1, g);
      break;
    }
    case 'dom': {
      const st = M(night ? 0x5a5070 : 0x8a7a6a);
      rbox(50, 30, 20, st, 0, 15, 8, g, 1);
      cone(14, 12, st, 0, 36, 8, g, 4).rotation.y = Math.PI/4;
      for (const sx of [-1, 1]){ rbox(12, 55, 12, st, sx*12, 27.5, -6, g, .8); cone(6.5, 34, st, sx*12, 72, -6, g, 8); for (let k = 0; k < 4; k++) cone(1.2, 6, st, sx*12 + (k < 2 ? -5 : 5), 58, -6 + (k % 2 ? -5 : 5), g, 6); }
      if (night) for (const sx of [-1, 1]) glowY(sx*12, 40, 0, 26, 0xffd27a);
      break;
    }
    case 'castle': {
      mountain(-40, 30, 40, 70, 0x7a8aa8, true); mountain(45, 40, 45, 80, 0x6a7a98, true);
      const wall = M(0xf6f2ea), roofB = M(0x3a5a9a);
      rbox(34, 20, 14, wall, 0, 10, 0, g, .8);
      for (const [x, h] of [[-17, 34], [17, 30], [-6, 42], [8, 26]]){ cyl(3.5, 3.5, h, wall, x, h/2, -3, g, 14); cone(4.4, 9, roofB, x, h + 4.5, -3, g, 14); }
      cone(9, 8, M(0x3a5a9a), 0, 24, 0, g, 4).rotation.y = Math.PI/4;
      break;
    }
    case 'pyramids':
      for (const [x, z, s] of [[-30, 10, 1], [18, -10, 1.25], [55, 15, .8]]){ const p = cone(26*s, 36*s, M(0xe8c070), x, 18*s, z, g, 4); p.rotation.y = Math.PI/4; cone(5*s, 7*s, M(0xfff0c0), x, 33*s, z, g, 4).rotation.y = Math.PI/4; }
      if (night) glowY(18, 52, 0, 14, 0xffffff);
      break;
    case 'sphinx':
      for (const [x, z, s] of [[-45, 30, 1], [40, 20, 1.15]]){ cone(26*s, 36*s, M(0xe8c070), x, 18*s, z, g, 4).rotation.y = Math.PI/4; }
      rbox(30, 8, 10, M(0xd8b070), 0, 4, -10, g, 2);
      rbox(9, 14, 8, M(0xd8b070), 0, 14, -16, g, 2);
      rbox(13, 9, 3, M(0x3a7ab0), 0, 16, -15, g, 1);
      rbox(6, 6, 2, M(0xd8b070), 0, 14, -20.5, g, 1);
      break;
    case 'obelisk':
      for (const x of [-26, 26]){ rbox(12, 40, 12, M(0xd8b070), x, 20, 10, g, .6); }
      rbox(64, 6, 10, M(0xc8a060), 0, 37, 10, g, .6);
      rbox(5, 46, 5, M(0xe8c888), 0, 23, -5, g, .4); cone(3.6, 6, M(0xffd23a), 0, 49, -5, g, 4).rotation.y = Math.PI/4;
      break;
    case 'minaret': {
      const st = M(0xc8784a);
      rbox(14, 62, 14, st, 0, 31, 0, g, .5);
      for (let y = 12; y < 60; y += 12) rbox(14.4, 1.5, 14.4, M(0x3aa080), 0, y, 0, g, .3);
      rbox(16, 3, 16, st, 0, 63, 0, g, .5);
      rbox(6, 9, 6, st, 0, 69, 0, g, .4); sph(2.5, M(0x3aa080), 0, 75, 0, g);
      for (const y of [78, 81, 83.5]) sph(1.1, M(0xffd23a), 0, y, 0, g);
      rbox(60, 12, 12, M(0xd8885a), 0, 6, 10, g, .8);
      break;
    }
    case 'mosque': {
      const wht = M(0xf4f4f0);
      rbox(70, 16, 22, wht, 0, 8, 10, g, 1);
      sph(14, M(0x3ab0a0), 0, 16, 10, g, 1, .7, 1);
      rbox(10, 80, 10, wht, 28, 40, 0, g, .6);
      for (let y = 15; y < 78; y += 16) rbox(10.6, 2, 10.6, M(0x3ab0a0), 28, y, 0, g, .4);
      rbox(5, 8, 5, M(0x3ab0a0), 28, 84, 0, g, .4); cone(2.6, 4, M(0xffd23a), 28, 90, 0, g, 6);
      glowY(28, 86, 3, 18, 0x7df9ff); glowY(0, 26, 20, 26, 0xffd27a);
      break;
    }
    case 'pagoda': {
      const wood = M(0x8a3a2a), roofP = M(0x2a2a3a);
      mountain(-45, 30, 45, 40, 0x5a8a5a, false); mountain(50, 40, 50, 46, 0x4a7a5a, false);
      for (let i = 0; i < 5; i++){ const s = 1 - i*.15, y = 6 + i*9; rbox(14*s, 7, 14*s, wood, 0, y, 0, g, .5); cone(13*s, 4, roofP, 0, y + 5, 0, g, 4).rotation.y = Math.PI/4; }
      cyl(.4, .5, 10, M(0xd8a030), 0, 54, 0, g, 6);
      break;
    }
    case 'fuji':
      cone(110, 70, M(0x5a7ab8), 0, 35, 40, g, 18);
      cone(42, 27, M(0xffffff), 0, 57, 40, g, 18);
      mountain(-90, 60, 50, 30, 0x4a8a5a, false); mountain(95, 50, 45, 26, 0x4a8a5a, false);
      break;
    case 'mountains':
      mountain(-40, 20, 55, 75, 0x6a7a9a, true); mountain(25, 0, 48, 92, 0x7a8aaa, true); mountain(80, 30, 50, 66, 0x5a6a8a, true); mountain(-95, 40, 45, 55, 0x5a6a8a, true);
      break;
    case 'hills':
      for (const [x, z, r, c] of [[-60, 20, 50, 0x3a9a4a], [10, 10, 60, 0x4aa850], [75, 30, 50, 0x3a8a44], [-120, 40, 50, 0x4aa850]]) sph(r, M(W.id === 'provence' ? 0x9a7ad0 : c), x, -r*.45, z, g, 1, .7, 1);
      break;
    case 'mesa':
      for (const [x, z, w, h] of [[-50, 20, 40, 34], [20, 0, 34, 46], [80, 30, 44, 28]]){ cyl(w*.42, w*.55, h, M(0xc8603a), x, h/2, z, g, 9); cyl(w*.43, w*.43, 3, M(0xe07848), x, h, z, g, 9); }
      break;
    case 'dunes':
      for (const [x, z, r] of [[-60, 10, 50], [10, 30, 70], [80, 10, 55]]) sph(r, M(0xf0b860), x, -r*.62, z, g, 1.4, .7, 1);
      { const p = cone(22, 30, M(0xe8c070), -10, 15, 60, g, 4); p.rotation.y = Math.PI/4; }
      break;
    case 'lighthouse':
      for (let i = 0; i < 6; i++) cyl(4.6 - i*.35, 5 - i*.35, 8, M(i % 2 ? 0xffffff : 0xe8323c), 0, 4 + i*8, 0, g, 16);
      cyl(3, 3, 6, M(0xf4f4f4), 0, 51, 0, g, 16); cone(3.8, 4, M(0xe8323c), 0, 56, 0, g, 16);
      glowY(0, 51, 4, night ? 36 : 18, 0xfff0a0);
      sph(30, M(0x6a8a5a), 0, -18, 10, g, 1.6, .8, 1);
      break;
    case 'cranes':
      for (const [x, c] of [[-40, 0x2f6bff], [0, 0xe8323c], [40, 0x2f6bff]]){
        for (const sx of [-4, 4]) rbox(1.6, 34, 1.6, M(c), x + sx, 17, 0, g, .3);
        rbox(10, 2.5, 2.5, M(c), x, 34, 0, g, .4); rbox(44, 2, 2, M(c), x - 6, 37, 0, g, .4); rbox(6, 4, 4, M(0x3a3a4a), x + 10, 37, 0, g, .5);
      }
      for (let i = 0; i < 12; i++) rbox(12, 5, 5, M(pick([0xe8323c, 0x2f6bff, 0xffd23a, 0x3ab05a])), -60 + (i % 6)*20, 2.5 + Math.floor(i/6)*5, -10, g, .4);
      break;
    case 'cristo':
      sph(40, M(0x4a8a4a), 0, -12, 20, g, 1, 1.2, 1);
      rbox(6, 8, 6, M(0xd8d0c0), 0, 40, 10, g, 1);
      rbox(5, 20, 4, M(0xf4f0e8), 0, 53, 10, g, 1.6);
      rbox(32, 3.2, 3, M(0xf4f0e8), 0, 60, 10, g, 1.2);
      sph(2.4, M(0xf4f0e8), 0, 65, 10, g);
      break;
    case 'sugarloaf':
      sph(26, M(0x5a7a5a), -20, 10, 10, g, 1, 1.9, 1);
      sph(15, M(0x6a8a5a), 30, 4, 20, g, 1, 1.5, 1);
      if (night) glowY(-20, 58, 0, 20, 0xff6ae0);
      break;
    case 'skyline':
      for (let i = 0; i < 9; i++){
        const h = 30 + Math.random()*50, x = -80 + i*20;
        rbox(12, h, 12, M(pick(W.buildings.map(c => parseInt(c.slice(1), 16)))), x, h/2, Math.random()*20, g, .8);
        glowY(x, h + 2, 8, 12, pick([0xff6ae0, 0x7df9ff, 0xffe066]));
      }
      break;
  }
  // fit the model into the band of sky the running camera sees above the end of the street
  const bb = new THREE.Box3().setFromObject(g), h = Math.max(1, bb.max.y);
  g.userData.s = Math.min(1.5, 50/h);
  mergeTree(g);
  g.position.set(0, -1, -262); g.scale.setScalar(g.userData.s);
  return g;
}
let landmark = null, landmarkRise = 1;
function setLandmark(W, animate){
  if (landmark){ backdrop.remove(landmark); disposeGroup(landmark); landmark = null; }
  if (!W.landmark) return;
  landmark = buildLandmark(W); backdrop.add(landmark);
  const ls = landmark.userData.s; landmarkRise = animate ? 0 : 1; landmark.scale.set(ls, animate ? .01 : ls, ls);
}
function applyPalette(p){
  const gr = skyCtx.createLinearGradient(0, 0, 0, 256);
  [0, .45, .75, 1].forEach((s, i) => gr.addColorStop(s, '#' + p.sky[i].getHexString()));
  skyCtx.fillStyle = gr; skyCtx.fillRect(0, 0, 256, 256);
  if (p.stars > .02) for (const [x, y, r, a] of STARS){ skyCtx.fillStyle = `rgba(255,255,255,${(.35 + a*.65)*p.stars})`; skyCtx.fillRect(x, y, r, r); }
  skyTex.needsUpdate = true;
  scene.fog.color.copy(p.fog); hemi.color.copy(p.hemiSky); hemi.groundColor.copy(p.hemiGround); hemi.intensity = p.hemiI;
  groundMat.color.copy(p.ground); walkMat.color.copy(p.walk); roadMat.color.copy(p.road);
  sun.intensity = p.sunI; haloMat.opacity = .25 + p.glow*.75;
  for (const b of buildings) b.material.emissiveIntensity = p.glow;
  cloudMat.opacity = p.clouds; for (const c of clouds) c.visible = p.clouds > .02;
  cloudMat.color.setRGB(1, 1, 1).lerp(p.sky[3], .22);
}
let worldIdx = 0, appliedWorldId = null;
let palCur = worldPalette(WORLDS[0]), palFrom = palCur, palTo = palCur, palT = 1;
applyPalette(palCur);

for (const side of [-1, 1]){
  for (let i = 0; i < 20; i++){ const b = new THREE.Mesh(boxGeo, toon({emissive:0xffffff, emissiveIntensity:palCur.glow})); b.userData = {side}; b.castShadow = false; skinMainBuilding(b); worldG.add(b); buildings.push(b); }
  for (let i = 0; i < PROP_COUNT; i++){
    const l = makeLamp(side); l.userData = {side, kind:'lamp'}; worldG.add(l); props.push(l);
    const t = makeDeco(WORLDS[0].prop, side); t.userData = {side, kind:'deco', world:WORLDS[0].id}; worldG.add(t); props.push(t);
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
function setCelestial(W){
  celestial.visible = W.celestial !== 'none';
  celestial.material.map = W.celestial === 'moon' ? moonTex : sunTex; celestial.material.needsUpdate = true;
  celestial.position.set(W.celestial === 'moon' ? -80 : 70, W.celestial === 'moon' ? 95 : 70, -340);
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
    setLandmark(W, false); setCelestial(W);
  } else {
    palFrom = palCur; palT = 0;
    setLandmark(W, true); setCelestial(W);
    showWorldBanner(W); sfx('power');
  }
  appliedWorldId = W.id;
}
function setCountry(id){
  WORLDS = countryById(id).worlds;
  setWorld(0, true);
}
function updatePalette(dt){
  if (landmark && landmarkRise < 1){ landmarkRise = Math.min(1, landmarkRise + dt*.6); const e = 1 - Math.pow(1 - landmarkRise, 3); landmark.scale.y = Math.max(.01, e*landmark.userData.s); }
  for (const c of clouds){ c.position.x += dt*2; if (c.position.x > 200) c.position.x -= 400; }
  if (palT >= 1) return;
  palT = Math.min(1, palT + dt/2.5);
  palCur = lerpPal(palFrom, palTo, palT*palT*(3 - 2*palT));
  applyPalette(palCur);
}

/* --- snow for winter worlds --- */
const SNOW_N = 700, snowPos = new Float32Array(SNOW_N*3);
for (let i = 0; i < SNOW_N; i++){ snowPos[i*3] = (Math.random() - .5)*30; snowPos[i*3 + 1] = Math.random()*14; snowPos[i*3 + 2] = -40 + Math.random()*50; }
const snowGeo = new THREE.BufferGeometry(); snowGeo.setAttribute('position', new THREE.BufferAttribute(snowPos, 3));
const snowMat = new THREE.PointsMaterial({color:0xffffff, size:.18, map: glowTex, transparent:true, opacity:0, depthWrite:false});
const snow = new THREE.Points(snowGeo, snowMat); snow.frustumCulled = false; scene.add(snow);
function updateSnow(dt, speed){
  const target = WORLDS[worldIdx].snow ? .95 : 0;
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

/* --- scrolling: everything in worldG moves toward the camera (+z) --- */
function scrollWorld(d){
  roadTex.offset.y += d/10;
  if (G.junction) G.junction.J.position.z += d;
  const J = G.junction && !G.junction.turned ? G.junction.J : null;
  const lim = J ? J.position.z + 6.3 : -Infinity;
  const wid = WORLDS[worldIdx].id;
  for (let k = 0; k < props.length; k++){
    let p = props[k];
    p.position.z += d;
    if (p.position.z > 70){
      p.position.z -= PROP_COUNT*PROP_SPACING;
      if (p.userData.kind === 'deco' && p.userData.world !== wid){ replaceDeco(k); p = props[k]; }
    }
    p.visible = (!J || p.position.z > lim) && p.position.z > -172;
  }
  for (const b of buildings){
    b.position.z += d;
    if (b.position.z - b.userData.d/2 > 70){
      if (b.userData.world !== wid) skinMainBuilding(b);
      let minZ = Infinity;
      for (const o of buildings) if (o.userData.side === b.userData.side && o !== b) minZ = Math.min(minZ, o.position.z - o.userData.d/2);
      b.position.z = minZ - Math.random()*1.5 - b.userData.d/2;
    }
    b.visible = (!J || b.position.z - b.userData.d/2 > lim + 16) && b.position.z + b.userData.d/2 > -175;
    const near = b.position.z > -95;
    if (b.userData.nearShown !== near){ b.userData.nearShown = near; for (const c of b.children) c.visible = near; }
  }
  for (const t of tiles){
    const u = t.userData; u.z += d;
    if (u.z - TILE_LEN/2 > 80) u.z -= TILE_N*TILE_LEN;
    const near = u.z + TILE_LEN/2, far = u.z - TILE_LEN/2;
    if (!J || far >= lim){ t.visible = true; t.position.z = u.z; t.scale.z = TILE_LEN; }
    else if (near <= lim){ t.visible = false; }
    else { t.visible = true; t.position.z = (near + lim)/2; t.scale.z = near - lim; }
  }
  syncTiles();
}
