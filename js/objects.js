'use strict';
/* ================= Obstacles, coins, power-ups ================= */
const stripeTex = canvasTex(128, 32, (g, w, h) => {
  g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h); g.fillStyle = '#e8323c';
  for (let x = -h; x < w + h; x += 32){ g.beginPath(); g.moveTo(x, h); g.lineTo(x + 16, h); g.lineTo(x + 16 + h, 0); g.lineTo(x + h, 0); g.fill(); }
});
const brickTex = canvasTex(128, 128, (g, w, h) => {
  g.fillStyle = '#8f8a86'; g.fillRect(0, 0, w, h);
  for (let r = 0; r < 8; r++) for (let c = -1; c < 4; c++){
    const x = c*32 + (r % 2 ? 16 : 0), y = r*16;
    g.fillStyle = ['#a8432f','#9a3b2a','#b44f36','#8c3526'][(Math.random()*4)|0];
    g.fillRect(x + 1, y + 1, 30, 14);
  }
});
brickTex.wrapS = brickTex.wrapT = THREE.RepeatWrapping; brickTex.repeat.set(1.5, 2);
function textTex(text, bg, fg){
  return canvasTex(256, 96, (g, w, h) => {
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
    g.strokeStyle = fg; g.lineWidth = 6; g.strokeRect(6, 6, w - 12, h - 12);
    g.fillStyle = fg; g.font = "44px 'Luckiest Guy', Impact, 'Arial Black', sans-serif"; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(text, w/2, h/2 + 2);
  });
}
const BANNERS = [textTex('FAKE NEWS', '#d3122a', '#ffffff'), textTex('DUCKEN!', '#1d2a4a', '#ffd23a'), textTex('NO RUNNING', '#ffffff', '#d3122a'), textTex('ICE ZONE', '#111318', '#ffd23a')];
const wallSignTex = textTex('MAUER', '#ffd23a', '#1d2a4a');
const busSide = canvasTex(256, 96, (g, w, h) => {
  g.fillStyle = '#ffc21a'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#20263a'; for (let i = 0; i < 7; i++) g.fillRect(10 + i*35, 14, 26, 30);
  g.fillStyle = '#1a1a1a'; g.fillRect(0, 56, w, 6); g.fillRect(0, 70, w, 4);
});
const busFront = canvasTex(128, 128, (g, w, h) => {
  g.fillStyle = '#ffc21a'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#20263a'; g.fillRect(10, 12, w - 20, 50);
  g.fillStyle = '#fff6c0'; g.beginPath(); g.arc(24, 92, 10, 0, 7); g.arc(w - 24, 92, 10, 0, 7); g.fill();
  g.fillStyle = '#1a1a1a'; g.fillRect(40, 84, 48, 18);
});
const suvSide = canvasTex(256, 96, (g, w, h) => {
  g.fillStyle = '#16181e'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#ffffff'; g.font = "46px 'Luckiest Guy', Impact, 'Arial Black', sans-serif"; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText('ICE', w/2, h/2 - 4);
  g.fillStyle = '#ffd23a'; g.fillRect(0, h - 18, w, 6);
});
const suvBack = canvasTex(128, 96, (g, w, h) => {
  g.fillStyle = '#16181e'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#ff3030'; g.fillRect(6, 58, 20, 14); g.fillRect(w - 26, 58, 20, 14);
  g.fillStyle = '#ffffff'; g.font = "30px 'Luckiest Guy', Impact, 'Arial Black', sans-serif"; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('ICE', w/2, 64);
});
const suvGlass = canvasTex(128, 64, (g, w, h) => { g.fillStyle = '#16181e'; g.fillRect(0, 0, w, h); g.fillStyle = '#2b3446'; g.fillRect(8, 8, w - 16, h - 16); });
const sirenRed = new THREE.MeshBasicMaterial({color:0xff2020}), sirenBlue = new THREE.MeshBasicMaterial({color:0x2050ff});
const x2Tex = labelTex([{t:'x2', size:84}], '#ffc83d', '#7a3a00', 128, 128);

const coinTex = canvasTex(128, 128, (g, w, h) => {
  const gr = g.createRadialGradient(48, 44, 6, 64, 64, 64);
  gr.addColorStop(0, '#fff6c4'); gr.addColorStop(.5, '#ffc83d'); gr.addColorStop(1, '#c98a00');
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.strokeStyle = '#a86e00'; g.lineWidth = 7; g.beginPath(); g.arc(64, 64, 50, 0, 7); g.stroke();
  g.fillStyle = '#b87a00'; g.beginPath();
  for (let i = 0; i < 10; i++){ const a = -Math.PI/2 + i*Math.PI/5, r = i % 2 ? 15 : 34; g.lineTo(64 + Math.cos(a)*r, 66 + Math.sin(a)*r); }
  g.fill();
});
const coinGeo = new THREE.CylinderGeometry(.32, .32, .08, 26); coinGeo.rotateX(Math.PI/2);
const coinMat = toon({map: coinTex, emissive: 0x3a2400});
// all coins are drawn as instances of one mesh; each coin object only holds a transform
const coinIM = new THREE.InstancedMesh(coinGeo, coinMat, 400);
coinIM.count = 0; coinIM.frustumCulled = false; coinIM.layers.enable(OUTLINE_LAYER); worldG.add(coinIM);
function syncCoins(){
  let n = 0;
  for (const o of objs){
    if (o.kind !== 'coin' || !o.mesh.visible || n >= 400) continue;
    o.mesh.updateMatrix(); coinIM.setMatrixAt(n++, o.mesh.matrix);
  }
  coinIM.count = n; coinIM.instanceMatrix.needsUpdate = true;
}
const wheelGeo = new THREE.CylinderGeometry(.45, .45, .3, 18); wheelGeo.rotateZ(Math.PI/2);
const texMatCache = {}, cbCache = {};
function countryBanner(t){ return cbCache[t] || (cbCache[t] = textTex(t, '#ffd23a', '#1d2a4a')); }
function texMat(tex){ const k = tex.uuid; return texMatCache[k] || (texMatCache[k] = toon({map: tex})); }
function wheel(x, y, z, g){
  const w = new THREE.Mesh(wheelGeo, std(0x15151a, .8)); w.position.set(x, y, z); g.add(w);
  const hub = cyl(.2, .2, .32, std(0xb8bcc4, .3, .5), x, y, z, g, 12); hub.rotation.z = Math.PI/2;
}

let objs = [];
function addObj(o){ if (o.kind !== 'coin') worldG.add(o.mesh); objs.push(o); return o; }
const BLOCKING = t => t === 'wall' || t === 'bus' || t === 'ice' || t === 'train' || t === 'mtrain';
const TRAIN_H = 2.6, TRAIN_LEN = 14;
const trainTexCache = {};
function trainTex(color){
  if (trainTexCache[color]) return trainTexCache[color];
  const side = canvasTex(512, 128, (g, w, h) => {
    g.fillStyle = color; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(0, h - 26, w, 26);
    g.fillStyle = '#ffffff'; g.fillRect(0, h - 34, w, 6);
    g.fillStyle = '#1d2433'; for (let i = 0; i < 9; i++) g.fillRect(18 + i*55, 20, 40, 46);
  });
  const front = canvasTex(128, 128, (g, w, h) => {
    g.fillStyle = color; g.fillRect(0, 0, w, h);
    g.fillStyle = '#1d2433'; g.fillRect(14, 14, w - 28, 46);
    g.fillStyle = '#fff6c0'; g.beginPath(); g.arc(26, 90, 10, 0, 7); g.arc(w - 26, 90, 10, 0, 7); g.fill();
    g.fillStyle = '#ffffff'; g.fillRect(0, h - 30, w, 6);
  });
  return trainTexCache[color] = {side, front};
}
// Jump-over obstacle; the look changes with the world, the hitbox stays the same
function lowObstacle(kind, g){
  if (kind === 'cones'){
    for (const sx of [-.62, 0, .62]){
      rbox(.44, .05, .44, std(0x2a2a2a), sx, .025, 0, g, .02);
      cone(.2, .64, std(0xff6a1a, .5), sx, .36, 0, g, 18);
      cyl(.125, .155, .1, std(0xffffff, .4), sx, .38, 0, g, 18);
    }
    rbox(1.6, .07, .07, std(0xffd23a), 0, .56, 0, g, .03);
  } else if (kind === 'hay'){
    const hay = std(0xe0b850, .95);
    cyl(.4, .4, 1.75, hay, 0, .41, 0, g, 20).rotation.z = Math.PI/2;
    for (const sx of [-.45, .45]) torus(.405, .025, std(0x8a5a2a), sx, .41, 0, g).rotation.y = Math.PI/2;
  } else if (kind === 'snowman'){
    const snow = std(0xffffff, .8);
    sph(.3, snow, 0, .3, 0, g); sph(.21, snow, 0, .66, 0, g); sph(.14, snow, 0, .92, 0, g);
    cone(.035, .18, std(0xff7a1a), 0, .92, -.2, g, 8).rotation.x = -Math.PI/2;
    for (const sx of [-.05, .05]) sph(.02, std(0x111111), sx, .96, -.12, g);
    cyl(.12, .12, .16, std(0x15151a), 0, 1.1, 0, g, 14); cyl(.17, .17, .02, std(0x15151a), 0, 1.03, 0, g, 16);
    torus(.16, .035, std(0xd62b2b), 0, .8, 0, g).rotation.x = Math.PI/2;
    for (const sx of [-.68, .68]) sph(.3, snow, sx, .1, 0, g, 1, .55, 1);
  } else if (kind === 'sandcastle'){
    const sand = std(0xe8c88a, .95);
    rbox(1.8, .3, .6, sand, 0, .15, 0, g, .08);
    for (const sx of [-.62, 0, .62]){
      cyl(.17, .2, .4 + (sx ? 0 : .15), sand, sx, .45 + (sx ? 0 : .07), 0, g, 14);
      cone(.21, .22, sand, sx, sx ? .76 : .9, 0, g, 14);
    }
    cyl(.01, .01, .3, std(0x5a3a1a), 0, 1.13, 0, g, 4); rbox(.14, .09, .01, std(0xd62b2b), .07, 1.24, 0, g, .005);
  } else if (kind === 'crates'){
    const wood = std(0xc8904a), dark = std(0x8a5a2a);
    for (const [x, y, sz] of [[-.5, .3, .6], [.15, .3, .6], [.75, .25, .5], [-.18, .82, .45]]){
      rbox(sz, sz, sz, wood, x, y, 0, g, .04);
      rbox(sz + .02, .07, sz + .02, dark, x, y, 0, g, .02); rbox(.07, sz + .02, sz + .02, dark, x, y, 0, g, .02);
    }
  } else if (kind === 'pots'){
    for (const [x, s, c] of [[-.6, 1, 0xd8784a], [0, 1.15, 0x3aa0a0], [.62, .95, 0xe8b04a]]){
      sph(.3*s, std(c), x, .33*s, 0, g, 1, 1.1, 1);
      cyl(.13*s, .17*s, .2*s, std(c), x, .72*s, 0, g, 14);
      torus(.2*s, .03, std(0xffffff), x, .38*s, 0, g).rotation.x = Math.PI/2;
    }
  } else if (kind === 'camel'){
    const fur = std(0xd8a860);
    sph(.42, fur, 0, .45, 0, g, 1.6, .75, .9);
    sph(.28, fur, -.05, .82, 0, g, 1, 1, .9); sph(.24, fur, .45, .74, 0, g, 1, 1, .9);
    caps(.1, .45, fur, -.72, .62, 0, g).rotation.z = -.6;
    sph(.17, fur, -.92, .82, 0, g, 1.3, .9, .9);
    for (const sx of [-1, 1]) sph(.035, std(0x15121a), -1.03, .88, sx*.09, g);
    for (const x of [-.45, .45]) for (const z of [-.22, .22]) caps(.07, .12, fur, x, .14, z, g);
    rbox(.5, .08, .7, std(0xe8323c), -.05, .98, 0, g, .03);
  } else if (kind === 'cafe'){
    cyl(.45, .45, .05, std(0xffffff), -.35, .72, 0, g, 18); cyl(.04, .04, .7, std(0x2a2a33), -.35, .36, 0, g, 8);
    cyl(.22, .26, .04, std(0x2a2a33), -.35, .02, 0, g, 14);
    for (const x of [.35, .8]){ rbox(.36, .05, .36, std(0xd8323c), x, .45, 0, g, .02); rbox(.36, .4, .05, std(0xd8323c), x, .66, .16, g, .02); for (const lx of [-.14, .14]) cyl(.025, .025, .45, std(0x2a2a33), x + lx, .22, -.12, g, 6); }
    cyl(.07, .06, .14, std(0xffffff), -.45, .82, .08, g, 10); sph(.08, std(0xd8a040), -.2, .8, -.1, g, 1.6, .6, .8);
  } else if (kind === 'drums'){
    for (const [x, c] of [[-.6, 0xffd23a], [0, 0x3ac850], [.6, 0x2f6bff]]){
      cyl(.27, .27, .62, std(c), x, .31, 0, g, 18); cyl(.28, .28, .04, std(0xf4f0e8), x, .63, 0, g, 18);
      for (const y of [.12, .5]) torus(.28, .02, std(0xffffff), x, y, 0, g).rotation.x = Math.PI/2;
    }
  } else if (kind === 'lanterns'){
    for (const x of [-.62, .62]){
      rbox(.4, .12, .4, std(0x9a9aa0), x, .06, 0, g, .03); cyl(.08, .1, .38, std(0x9a9aa0), x, .31, 0, g, 10);
      rbox(.34, .24, .34, std(0x8a8a90), x, .62, 0, g, .04); rbox(.18, .12, .36, glowMat(0xffd27a), x, .62, 0, g, .02);
      cone(.34, .2, std(0x6a6a72), x, .84, 0, g, 4).rotation.y = Math.PI/4;
    }
    rbox(.5, .05, .5, std(0x3aa84a), 0, .03, 0, g, .02);
  } else if (kind === 'goldbars'){
    const gold = glossy(0xffcf3a, 0x3a2600);
    const rows = [[-.56, -.18, .2, .56], [-.37, 0, .37], [-.18, .18]];
    rows.forEach((row, r) => { for (const x of row) rbox(.34, .17, .4, gold, x, .09 + r*.18, 0, g, .04); });
  } else {
    for (const sx of [-.8, .8]){ rbox(.1, .8, .1, std(0x2b2d3a), sx, .4, 0, g, .03); rbox(.34, .05, .3, std(0x2b2d3a), sx, .025, 0, g, .02); }
    const board = new THREE.Mesh(roundBoxGeo(1.9, .34, .12, .05), [std(0xffffff), std(0xffffff), std(0xffffff), std(0xffffff), texMat(stripeTex), texMat(stripeTex)]);
    board.position.y = .62; g.add(board);
    sph(.08, glowMat(0xff9a2a), .8, .9, 0, g);
  }
}
// Obstacles are built once per look, merged, and then cloned (clones share geometry and materials)
const obstacleTemplates = new Map();
function makeObstacle(type, lane, z){
  const W = WORLDS[worldIdx];
  let variant = '', bannerTex = null;
  if (type === 'barrier') variant = W.low;
  else if (type === 'train' || type === 'mtrain') variant = W.train;
  else if (type === 'bar'){
    const cb = countryById(save.country).banner;
    if (cb && Math.random() < .5){ variant = 'c' + cb; bannerTex = countryBanner(cb); }
    else { const i = (Math.random()*BANNERS.length)|0; variant = 'b' + i; bannerTex = BANNERS[i]; }
  }
  const key = type + '|' + variant;
  let tpl = obstacleTemplates.get(key);
  if (!tpl){ tpl = buildObstacle(type, bannerTex); obstacleTemplates.set(key, tpl); }
  const g = tpl.g.clone(true), o = Object.assign({}, tpl.o);
  g.position.set(LANES[lane], 0, z);
  o.mesh = g; o.lane = lane; o.kind = 'obstacle';
  return addObj(o);
}
function buildObstacle(type, bannerTex){
  const g = new THREE.Group();
  let o;
  if (type === 'barrier'){
    lowObstacle(WORLDS[worldIdx].low, g);
    o = {type, hw:.95, hd:.2, y0:0, y1:.82};
  } else if (type === 'bar'){
    for (const sx of [-1, 1]){ cyl(.07, .08, 2.45, std(0x2b2d3a, .4, .3), sx, 1.22, 0, g, 12); sph(.1, std(0x2b2d3a), sx, 2.47, 0, g); }
    const bm = texMat(bannerTex);
    const banner = new THREE.Mesh(roundBoxGeo(2.0, .85, .1, .04), [std(0x888888), std(0x888888), std(0x888888), std(0x888888), bm, bm]);
    banner.position.y = 1.78; g.add(banner);
    o = {type, hw:1.0, hd:.18, y0:1.3, y1:2.4};
  } else if (type === 'wall'){
    rbox(2.05, 2.62, .7, texMat(brickTex, {roughness:.9}), 0, 1.31, 0, g, .05);
    rbox(2.2, .16, .86, std(0xb8b0a8, .9), 0, 2.68, 0, g, .05);
    plane(1.4, .52, wallSignTex, 0, 1.7, .36, 0, g);
    o = {type, hw:1.02, hd:.35, y0:0, y1:2.7};
  } else if (type === 'ice'){
    const sideM = texMat(suvSide, {roughness:.35}), backM = texMat(suvBack, {roughness:.35}), glassM = texMat(suvGlass, {roughness:.2});
    const lower = new THREE.Mesh(roundBoxGeo(2.0, 1.15, 4.4, .22), [sideM, sideM, std(0x16181e, .35), std(0x111111), backM, backM]);
    lower.position.y = .95; g.add(lower);
    const cab = new THREE.Mesh(roundBoxGeo(1.84, .78, 3.0, .2), [glassM, glassM, std(0x16181e, .35), std(0x16181e), glassM, glassM]);
    cab.position.set(0, 1.9, .2); g.add(cab);
    rbox(.5, .14, .3, sirenRed, -.3, 2.36, 0, g, .05); rbox(.5, .14, .3, sirenBlue, .3, 2.36, 0, g, .05);
    rbox(2.06, .22, .2, std(0x0a0a0d, .5), 0, .5, 2.22, g, .08);
    for (const sx of [-.92, .92]) for (const sz of [-1.4, 1.4]) wheel(sx, .45, sz, g);
    o = {type, hw:1.0, hd:2.2, y0:0, y1:2.45};
  } else if (type === 'train' || type === 'mtrain'){
    const tx = trainTex(WORLDS[worldIdx].train);
    const sideM = texMat(tx.side, {roughness:.4}), frontM = texMat(tx.front, {roughness:.4});
    const body = new THREE.Mesh(roundBoxGeo(2.0, TRAIN_H - .3, TRAIN_LEN, .28), [sideM, sideM, std(0x9aa0aa, .5), std(0x222222), frontM, frontM]);
    body.position.y = .3 + (TRAIN_H - .3)/2; g.add(body);
    rbox(1.6, .1, TRAIN_LEN - 1.2, std(0x7a808a, .5, .3), 0, TRAIN_H + .02, 0, g, .04);
    rbox(1.7, .3, TRAIN_LEN - 1, std(0x1a1a1a), 0, .15, 0, g, .05);
    for (const sz of [-TRAIN_LEN/2 + 2, TRAIN_LEN/2 - 2]) for (const sx of [-.7, .7]){ const w = cyl(.28, .28, .14, std(0x2a2a2a, .5, .4), sx, .28, sz, g, 14); w.rotation.z = Math.PI/2; }
    if (type === 'mtrain') for (const sx of [-.62, .62]){
      sph(.17, glowMat(0xfff3b0), sx, .95, TRAIN_LEN/2 + .02, g);
      const s = new THREE.Sprite(headlightMat); s.scale.set(2.2, 2.2, 1); s.position.set(sx, .95, TRAIN_LEN/2 + .3); g.add(s);
    }
    o = {type, hw:1.0, hd:TRAIN_LEN/2, y0:0, y1:TRAIN_H - .4, vz: type === 'mtrain' ? 11 : 0};
  } else if (type === 'ramp'){
    const ang = Math.atan2(TRAIN_H, 5.2), len = Math.hypot(TRAIN_H, 5.2);
    rbox(1.9, .14, len, std(0x5a5f6a, .5, .4), 0, TRAIN_H/2, 0, g, .04).rotation.x = ang;
    for (const sx of [-.95, .95]) rbox(.08, .22, len, std(0xffc21a), sx, TRAIN_H/2 + .06, 0, g, .03).rotation.x = ang;
    for (let i = 0; i < 6; i++){ const k = -2.2 + i*.88, hy = TRAIN_H*(2.6 - k)/5.2 + .08; rbox(1.6, .03, .1, std(0xffc21a), 0, hy, k, g, .01).rotation.x = ang; }
    for (const k of [-1.6, 0, 1.6]){
      const hh = TRAIN_H*(2.6 - k)/5.2 - .1;
      cyl(.06, .06, hh, std(0x2b2d3a, .4, .4), -.8, hh/2, k, g, 8); cyl(.06, .06, hh, std(0x2b2d3a, .4, .4), .8, hh/2, k, g, 8);
    }
    o = {type, hw:1.0, hd:2.6, y0:0, y1:0};
  } else {
    const sideM = texMat(busSide, {roughness:.45}), frontM = texMat(busFront, {roughness:.45});
    const bus = new THREE.Mesh(roundBoxGeo(2.0, 2.3, 6, .3), [sideM, sideM, std(0xffc21a, .45), std(0x222222), frontM, frontM]);
    bus.position.y = 1.5; g.add(bus);
    rbox(1.6, .14, 4.6, std(0xe8a810, .5), 0, 2.7, 0, g, .06);
    for (const sx of [-.92, .92]) for (const sz of [-2, 2]) wheel(sx, .45, sz, g);
    o = {type, hw:1.0, hd:3.0, y0:0, y1:2.7};
  }
  castAll(g); mergeTree(g);
  g.traverse(m => { if (m.geometry) m.geometry.userData.shared = true; });
  return {g, o};
}
// Height of what you can stand on at (x, z): train roofs and ramps
function groundAt(x, z){
  let h = 0, ramp = false;
  for (const o of objs){
    if (o.kind !== 'obstacle' || o.hit || (o.type !== 'train' && o.type !== 'ramp')) continue;
    const p = o.mesh.position;
    if (Math.abs(p.x - x) > 1.2) continue;
    const dz = z - p.z;
    if (o.type === 'train'){ if (Math.abs(dz) < o.hd + .05 && TRAIN_H > h){ h = TRAIN_H; ramp = false; } }
    else if (Math.abs(dz) <= 2.6){ const v = TRAIN_H*(2.6 - dz)/5.2; if (v > h){ h = v; ramp = true; } }
  }
  return {h, ramp};
}
function makeCoin(lane, z, y){
  const m = new THREE.Object3D(); m.position.set(LANES[lane], y, z);
  return addObj({kind:'coin', mesh:m});
}
const POWER_INFO = {
  magnet: {label:'🧲 Magnet'}, shield: {label:'🛡️ Schild'}, double: {label:'💰 x2 Münzen'}, turbo: {label:'🚀 Turbo'}, jet: {label:'🎒 Jetpack'}
};
const headlightMat = new THREE.SpriteMaterial({map: glowTex, color: 0xfff0a0, transparent:true, opacity:.9, blending: THREE.AdditiveBlending, depthWrite:false});
function makePower(type, lane, z){
  const g = new THREE.Group(), inner = new THREE.Group(); g.add(inner);
  if (type === 'magnet'){
    const u = torus(.26, .11, glossy(0xe8323c), 0, 0, 0, inner, Math.PI); u.rotation.z = Math.PI;
    for (const sx of [-.26, .26]) cyl(.11, .11, .18, glossy(0xdddddd), sx, -.08, 0, inner, 14);
  } else if (type === 'shield'){
    inner.add(new THREE.Mesh(new THREE.IcosahedronGeometry(.34, 2), new THREE.MeshPhongMaterial({color:0x4aa8ff, emissive:0x1a4a99, transparent:true, opacity:.88, shininess:120, specular:0xffffff})));
    sph(.12, glowMat(0xdff2ff), 0, 0, 0, inner);
  } else if (type === 'double'){
    rbox(.55, .55, .55, toon({map:x2Tex, emissive:0x3a2000}), 0, 0, 0, inner, .1);
  } else if (type === 'jet'){
    for (const sx of [-.13, .13]){ cyl(.1, .1, .46, glossy(0xc8ccd4), sx, 0, 0, inner, 14); cone(.1, .14, glossy(0xe8323c), sx, .3, 0, inner, 14); cone(.07, .2, glowMat(0xffa030), sx, -.33, 0, inner, 10).rotation.x = Math.PI; }
    rbox(.34, .28, .08, std(0x4a4f5a), 0, 0, .1, inner, .03);
  } else {
    caps(.13, .3, glossy(0xf4f4f4), 0, 0, 0, inner);
    cone(.13, .22, glossy(0xe8323c), 0, .34, 0, inner, 14);
    for (let i = 0; i < 3; i++){ const f = rbox(.03, .16, .14, glossy(0xe8323c), Math.cos(i*2.09)*.12, -.2, Math.sin(i*2.09)*.12, inner, .01); f.rotation.y = -i*2.09; }
    cone(.09, .22, glowMat(0xff9a2a), 0, -.38, 0, inner, 10).rotation.x = Math.PI;
    inner.rotation.z = -.5;
  }
  const colors = {magnet:0xff7a7a, shield:0x9fd4ff, double:0xffd36a, turbo:0xffa040, jet:0x9affc8};
  torus(.5, .03, glowMat(colors[type]), 0, -.55, 0, g).rotation.x = Math.PI/2;
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({map: glowTex, color: colors[type], transparent:true, opacity:.55, blending: THREE.AdditiveBlending, depthWrite:false}));
  glow.scale.set(1.8, 1.8, 1); g.add(glow);
  outlineAll(g); mergeTree(g);
  g.position.set(LANES[lane], 1.0, z);
  return addObj({kind:'power', type, mesh:g, inner});
}
function clearObjs(){ for (const o of objs) worldG.remove(o.mesh); objs = []; }
function coinLine(lane, zStart, n, shape){
  for (let i = 0; i < n; i++){
    const z = zStart - i*2.2;
    let y = .9;
    if (shape === 'arc'){ const u = (i - (n - 1)/2)/((n - 1)/2); y = .9 + 1.6*(1 - u*u); }
    if (shape === 'low') y = .55;
    if (shape === 'air') y = 6.4;
    makeCoin(lane, z, y);
  }
}


/* ================= Particles: sparkles, dust, debris ================= */
const particles = [], partPool = [], partMats = {};
function partMat(color){ return partMats[color] || (partMats[color] = new THREE.SpriteMaterial({map: glowTex, color, transparent:true, blending: THREE.AdditiveBlending, depthWrite:false})); }
function emit(x, y, z, n, color, speed, life, size, up){
  for (let i = 0; i < n; i++){
    if (particles.length > 160) break;
    const s = partPool.pop() || new THREE.Sprite(partMat(color));
    s.material = partMat(color); s.position.set(x, y, z); scene.add(s);
    const a = Math.random()*Math.PI*2, v = speed*(.4 + Math.random()*.6);
    particles.push({s, vx: Math.cos(a)*v, vy: (up || 0) + (Math.random()*.8 + .2)*speed, vz: Math.sin(a)*v, life, max: life, size});
  }
}
function updateParticles(dt, d){
  for (let i = particles.length - 1; i >= 0; i--){
    const p = particles[i];
    p.life -= dt;
    if (p.life <= 0){ scene.remove(p.s); partPool.push(p.s); particles.splice(i, 1); continue; }
    p.vy -= 6*dt;
    p.s.position.x += p.vx*dt; p.s.position.y += p.vy*dt; p.s.position.z += p.vz*dt + d;
    const k = p.life/p.max; p.s.scale.setScalar(p.size*(.4 + .6*k)); p.s.material.opacity = k;
  }
}
function clearParticles(){ for (const p of particles){ scene.remove(p.s); partPool.push(p.s); } particles.length = 0; }
