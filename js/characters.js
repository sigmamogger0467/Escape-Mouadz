'use strict';
/* ================= Characters: rounded runners, Trump variants, ICE agents ================= */
const numberTex = labelTex([{t:'10', size:110}], null, '#ffffff', 128, 128);
const WHITE = 0xffffff, INK = 0x15121a;

function addFace(head, o){
  // o: {y, z, spread, skinMat, brow, mouth:'smile'|'flat'|'o'|'grin', eyeMat, pupil, size}
  const size = o.size || 1, y = o.y, z = o.z, sp = o.spread;
  for (const sx of [-1, 1]){
    if (o.eyeMat){ rbox(.1*size, .07*size, .03, o.eyeMat, sx*sp, y, z - .005, head, .02); continue; }
    sph(.068*size, std(WHITE, .35), sx*sp, y, z, head, 1, 1.15, .45);
    sph(.037*size, std(o.pupil || INK, .3), sx*sp, y - .006, z - .026, head, 1, 1.05, .5);
    sph(.012*size, glowMat(WHITE), sx*sp + .016*size, y + .018*size, z - .044, head);
    if (o.brow !== false) rbox(.1*size, .025, .025, o.brow || std(INK), sx*sp, y + .088*size, z - .01, head, .012).rotation.z = -sx*.08;
  }
  if (o.mouth === 'flat') rbox(.12, .025, .02, std(0x6a2a2a), 0, y - .15, z, head, .01);
  else if (o.mouth === 'o') torus(.04, .016, std(0xc0605a), 0, y - .15, z, head);
  else if (o.mouth !== false){
    const m = torus(.055, .014, std(0x6a2a2a), 0, y - .14, z, head, Math.PI); m.rotation.z = Math.PI;
  }
}

function buildRunner(s){
  const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
  const metal = s.extra === 'gold' || s.extra === 'robot';
  const M = c => metal ? glossy(c, s.extra === 'gold' ? 0x3a2600 : 0) : std(c);
  const mSkin = M(s.skin), mShirt = M(s.shirt), mPants = M(s.pants), mShoes = M(s.shoes), mHair = M(s.hair), mAcc = M(s.accent);
  const sole = std(0x22222a), dark = std(INK);
  const legs = [], arms = [];
  for (const sx of [-1, 1]){
    const leg = new THREE.Group(); leg.position.set(sx*.15, .87, 0); body.add(leg);
    caps(.115, .5, mPants, 0, -.37, 0, leg);
    rbox(.25, .16, .4, mShoes, 0, -.79, -.05, leg, .07);
    rbox(.26, .05, .41, sole, 0, -.86, -.05, leg, .02);
    legs.push(leg);
  }
  rbox(.6, .66, .36, mShirt, 0, 1.21, 0, body, .15);
  rbox(.56, .2, .34, mPants, 0, .92, 0, body, .08);
  cyl(.08, .09, .14, mSkin, 0, 1.57, 0, body);
  for (const sx of [-1, 1]){
    const arm = new THREE.Group(); arm.position.set(sx*.4, 1.46, 0); body.add(arm);
    sph(.11, mShirt, 0, 0, 0, arm);
    caps(.085, .36, mShirt, 0, -.26, 0, arm);
    sph(.095, mSkin, 0, -.58, 0, arm);
    arms.push(arm);
  }
  const head = new THREE.Group(); head.position.set(0, 1.6, 0); body.add(head);
  const skull = rbox(.5, .48, .46, mSkin, 0, .27, 0, head, .18);
  if (!['astro', 'knight', 'robot'].includes(s.extra)){
    sph(.065, mSkin, -.255, .27, .01, head, .55, 1, 1); sph(.065, mSkin, .255, .27, .01, head, .55, 1, 1);
  }
  if (s.extra !== 'alien' && s.extra !== 'knight') sph(.042, mSkin, 0, .23, -.235, head);
  const faceOpts = {y:.3, z:-.212, spread:.1, brow: std(s.extra === 'mummy' ? 0x8a7a5a : s.hair)};
  if (s.extra === 'robot') faceOpts.eyeMat = glowMat(s.accent);
  if (s.extra === 'zombie'){ faceOpts.pupil = 0xb03030; faceOpts.mouth = 'flat'; }
  if (s.extra === 'mummy'){ faceOpts.pupil = 0xff4a2a; faceOpts.mouth = false; }
  if (s.extra === 'ninja') faceOpts.mouth = false;
  if (s.extra !== 'alien' && s.extra !== 'knight') addFace(head, faceOpts);
  const hairStd = !['robot', 'alien', 'astro', 'knight', 'mummy', 'dino', 'ninja', 'viking'].includes(s.extra);
  if (hairStd){
    rbox(.53, .16, .5, mHair, 0, .5, .01, head, .07);
    rbox(.52, .3, .12, mHair, 0, .36, .19, head, .05);
    rbox(.42, .07, .1, mHair, 0, .46, -.2, head, .03);
  }
  let cape = null;
  const gold = glossy(0xffcf3a, 0x3a2600);
  switch (s.extra){
    case 'cap':
      sph(.272, mAcc, 0, .5, .01, head, 1, .5, 1);
      rbox(.42, .035, .26, mAcc, 0, .48, -.3, head, .015);
      sph(.03, mAcc, 0, .64, .01, head);
      rbox(.2, .16, .03, std(WHITE), 0, 1.27, -.185, body, .02);
      rbox(.5, .16, .16, mShirt, 0, 1.55, .17, body, .07);
      for (const sx of [-.07, .07]) cyl(.012, .012, .2, std(WHITE), sx, 1.4, -.19, body, 6);
      rbox(.36, .14, .04, mShirt, 0, 1.05, -.18, body, .02);
      break;
    case 'ninja':
      rbox(.54, .24, .5, mShirt, 0, .48, 0, head, .1);
      rbox(.52, .2, .08, mShirt, 0, .15, -.2, head, .04);
      rbox(.55, .07, .52, mAcc, 0, .4, 0, head, .03);
      rbox(.06, .05, .3, mAcc, .06, .4, .35, head, .02).rotation.x = -.5;
      rbox(.06, .05, .26, mAcc, -.04, .37, .33, head, .02).rotation.x = -.8;
      rbox(.62, .08, .38, mAcc, 0, .97, 0, body, .03);
      { const sw = new THREE.Group(); sw.position.set(0, 1.25, .22); sw.rotation.z = .7; body.add(sw);
        rbox(.06, .9, .03, std(0xc8ccd4, .2, .6), 0, .1, 0, sw, .015); rbox(.16, .04, .05, std(0x8a6a2a), 0, -.37, 0, sw, .01); cyl(.03, .03, .2, std(0x3a2a1a), 0, -.48, 0, sw, 8); }
      break;
    case 'soccer':
      plane(.4, .4, numberTex, 0, 1.25, .182, 0, body, true);
      sph(.06, std(WHITE), -.15, 1.38, -.18, body, 1, 1, .3);
      for (const leg of legs) caps(.12, .14, std(WHITE), 0, -.55, 0, leg);
      for (const arm of arms) caps(.088, .08, std(WHITE), 0, -.1, 0, arm);
      break;
    case 'hero':
      rbox(.47, .1, .03, std(0x10204a), 0, .3, -.226, head, .02);
      rbox(.22, .22, .03, std(0xffd23a), 0, 1.3, -.185, body, .03).rotation.z = Math.PI/4;
      rbox(.62, .08, .38, std(0xffd23a), 0, .97, 0, body, .03);
      cape = new THREE.Group(); cape.position.set(0, 1.52, .2); body.add(cape);
      rbox(.6, 1.05, .035, mAcc, 0, -.52, 0, cape, .015);
      break;
    case 'astro': {
      const helmet = sph(.4, new THREE.MeshPhongMaterial({color:0xbfe6ff, transparent:true, opacity:.3, shininess:120, specular:0xffffff}), 0, .28, 0, head);
      helmet.renderOrder = 2;
      rbox(.53, .16, .5, mHair, 0, .5, .01, head, .07);
      torus(.36, .04, std(0xcfd3da), 0, .02, 0, head).rotation.x = Math.PI/2;
      rbox(.5, .6, .26, std(0xcfd3da), 0, 1.25, .3, body, .08);
      for (const sx of [-.12, .12]) cyl(.06, .06, .3, std(0x8a8f99), sx, 1.15, .45, body, 10);
      rbox(.24, .14, .03, mAcc, 0, 1.36, -.185, body, .02);
      for (const a of arms) torus(.09, .025, mAcc, 0, -.12, 0, a).rotation.x = Math.PI/2;
      break;
    }
    case 'chef':
      cyl(.22, .24, .26, std(WHITE), 0, .62, 0, head, 18);
      sph(.27, std(WHITE), 0, .82, 0, head, 1, .6, 1);
      rbox(.54, .07, .5, std(WHITE), 0, .5, 0, head, .03);
      for (const sx of [-1, 1]) sph(.06, std(0x3a2a1a), sx*.06, .2, -.24, head, 1.4, .5, .6);
      for (const sy of [1.36, 1.2, 1.04]) for (const sx of [-.1, .1]) sph(.025, std(0x222222), sx, sy, -.185, body);
      rbox(.3, .12, .3, mAcc, 0, 1.53, -.08, body, .04);
      break;
    case 'pirate':
      sph(.272, mAcc, 0, .48, .01, head, 1, .45, 1);
      rbox(.08, .2, .06, mAcc, -.12, .42, .27, head, .02);
      sph(.055, dark, .1, .3, -.235, head, 1, 1, .3);
      rbox(.48, .02, .02, dark, 0, .37, -.23, head, .008).rotation.z = -.25;
      sph(.2, mHair, 0, .1, -.16, head, 1.2, .6, .7);
      sph(.03, gold, -.26, .2, 0, head);
      for (let i = 0; i < 4; i++) torus(.27, .025, mAcc, 0, .97 + i*.15, 0, body).rotation.x = Math.PI/2;
      break;
    case 'gamer':
      torus(.27, .03, std(0x1b1b24), 0, .32, 0, head, Math.PI).rotation.y = Math.PI/2;
      for (const sx of [-1, 1]){ const c = cyl(.09, .09, .07, std(0x1b1b24), sx*.26, .3, 0, head, 16); c.rotation.z = Math.PI/2; cyl(.07, .07, .072, glowMat(s.accent), sx*.27, .3, 0, head, 16).rotation.z = Math.PI/2; }
      cyl(.012, .012, .2, std(0x1b1b24), -.2, .17, -.15, head, 6).rotation.x = 1.2;
      rbox(.5, .16, .16, mShirt, 0, 1.55, .17, body, .07);
      rbox(.4, .05, .04, glowMat(s.accent), 0, 1.15, -.185, body, .015);
      break;
    case 'rapper': {
      cyl(.27, .31, .2, std(0x1b1b1b), 0, .6, 0, head, 18);
      cyl(.4, .4, .03, std(0x1b1b1b), 0, .5, 0, head, 20);
      rbox(.42, .08, .035, std(0x050505, .15), 0, .3, -.235, head, .02);
      const chain = torus(.17, .028, gold, 0, 1.42, -.19, body); chain.scale.y = .9;
      rbox(.1, .1, .03, gold, 0, 1.25, -.2, body, .02);
      break;
    }
    case 'robot':
      cyl(.02, .02, .26, M(0x30353c), 0, .62, 0, head, 6);
      sph(.06, glowMat(s.accent), 0, .77, 0, head);
      rbox(.26, .12, .03, glowMat(s.accent), 0, 1.36, -.185, body, .02);
      for (const sx of [-1, 1]) cyl(.1, .1, .06, M(0x30353c), sx*.26, .28, 0, head, 14).rotation.z = Math.PI/2;
      rbox(.3, .05, .02, M(0x30353c), 0, .14, -.23, head, .01);
      break;
    case 'fire': {
      const red = std(s.accent, .4);
      sph(.29, red, 0, .48, .02, head, 1, .6, 1.05);
      cyl(.42, .44, .04, red, 0, .42, .06, head, 22);
      rbox(.12, .14, .04, std(0xffd23a), 0, .55, -.27, head, .02);
      for (const sy of [1.0, 1.32]) torus(.27, .03, std(0xdfe4ea, .3), 0, sy, 0, body).rotation.x = Math.PI/2;
      for (const a of arms) torus(.09, .022, std(0xdfe4ea, .3), 0, -.35, 0, a).rotation.x = Math.PI/2;
      break;
    }
    case 'zombie':
      rbox(.2, .16, .03, std(0x8fb36b), .15, 1.05, -.185, body, .02);
      rbox(.14, .12, .03, std(0x5a0a0a), -.16, 1.35, -.185, body, .02);
      for (let i = 0; i < 3; i++) rbox(.02, .08, .02, dark, -.12 + i*.04, .45, -.225, head, .005);
      break;
    case 'knight': {
      const steel = std(0xb8c0cc, .3, .55);
      sph(.31, steel, 0, .3, 0, head, 1, 1.05, 1);
      rbox(.36, .05, .03, dark, 0, .32, -.29, head, .015);
      rbox(.03, .22, .03, dark, 0, .2, -.3, head, .01);
      cone(.06, .35, std(s.accent), 0, .72, .05, head).rotation.x = .5;
      sph(.13, steel, -.42, 1.47, 0, body); sph(.13, steel, .42, 1.47, 0, body);
      rbox(.5, .5, .06, steel, 0, 1.25, -.17, body, .05);
      const sh = new THREE.Group(); sh.position.set(-.08, -.35, -.12); arms[0].add(sh);
      rbox(.06, .42, .34, std(s.accent), 0, 0, 0, sh, .04);
      rbox(.07, .3, .05, std(WHITE), 0, 0, 0, sh, .015); rbox(.07, .05, .22, std(WHITE), 0, .05, 0, sh, .015);
      break;
    }
    case 'alien': {
      skull.scale.set(1, 1.2, 1); skull.position.y = .32;
      for (const sx of [-1, 1]){
        const e = sph(.1, std(0x0a0a0a, .15), sx*.11, .33, -.21, head, .8, 1.15, .45); e.rotation.z = sx*.4;
        sph(.02, glowMat(WHITE), sx*.11 + .03, .37, -.25, head);
        cyl(.018, .018, .3, mSkin, sx*.13, .72, 0, head, 6).rotation.z = -sx*.3;
        sph(.05, glowMat(0xb7ff6a), sx*.18, .86, 0, head);
      }
      torus(.05, .012, std(0x2a5a2a), 0, .15, -.23, head, Math.PI).rotation.z = Math.PI;
      rbox(.62, .08, .38, std(0x6a7380), 0, .97, 0, body, .03);
      break;
    }
    case 'viking': {
      const steel = std(0xb8c0cc, .3, .5);
      sph(.28, steel, 0, .46, 0, head, 1, .55, 1);
      torus(.28, .03, std(0x8a6a2a), 0, .42, 0, head).rotation.x = Math.PI/2;
      for (const sx of [-1, 1]){ const h = cone(.07, .32, std(0xf4ecd8), sx*.32, .62, 0, head); h.rotation.z = -sx*.9; }
      sph(.22, mHair, 0, .1, -.15, head, 1.1, .9, .7);
      sph(.1, mHair, 0, -.08, -.2, head, .8, 1.2, .6);
      for (const sx of [-.08, .08]) sph(.05, mHair, sx, .19, -.24, head, 1.6, .5, .5);
      rbox(.64, .5, .4, std(0x8a6a4a, .9), 0, 1.3, 0, body, .12);
      break;
    }
    case 'mummy': {
      const band = std(0xc8bfa4);
      for (let i = 0; i < 5; i++) torus(.25, .018, band, 0, .12 + i*.1, 0, head).rotation.set(Math.PI/2 + (i%2 ? .15 : -.15), 0, 0);
      for (let i = 0; i < 5; i++) torus(.27, .02, band, 0, .95 + i*.12, 0, body).rotation.set(Math.PI/2 + (i%2 ? .12 : -.12), 0, 0);
      for (const l of legs) for (let i = 0; i < 3; i++) torus(.12, .015, band, 0, -.2 - i*.17, 0, l).rotation.x = Math.PI/2 + .2;
      break;
    }
    case 'gold': {
      rbox(.44, .1, .42, gold, 0, .57, 0, head, .03);
      for (let i = 0; i < 6; i++){ const a = i/6*Math.PI*2; cone(.06, .17, gold, Math.cos(a)*.18, .7, Math.sin(a)*.17, head, 6); }
      sph(.045, glowMat(s.accent), 0, .57, -.22, head);
      rbox(.62, .08, .38, mAcc, 0, .97, 0, body, .03);
      break;
    }
    case 'dino': {
      const hood = std(s.shirt), belly = std(0xd8f0a0);
      sph(.31, hood, 0, .38, .05, head, 1, 1, 1.05);
      for (let i = 0; i < 6; i++) cone(.025, .07, std(WHITE), -.15 + i*.06, .14, -.24, head, 6).rotation.x = Math.PI;
      for (const sx of [-1, 1]) sph(.05, std(WHITE), sx*.12, .62, -.18, head);
      rbox(.4, .5, .04, belly, 0, 1.15, -.18, body, .1);
      for (let i = 0; i < 5; i++) cone(.07, .16, mAcc, 0, 1.55 - i*.15, .2, body, 6).rotation.x = -1.2;
      const tail = cone(.16, .8, hood, 0, .95, .5, body, 12); tail.rotation.x = -1.35;
      break;
    }
    case 'ice':
      sph(.272, dark, 0, .5, .01, head, 1, .5, 1);
      rbox(.42, .035, .26, dark, 0, .48, -.3, head, .015);
      rbox(.42, .08, .035, std(0x050505, .15), 0, .3, -.235, head, .02);
      rbox(.64, .5, .4, std(0x15171c), 0, 1.27, 0, body, .1);
      plane(.48, .24, iceTex, 0, 1.3, .202, 0, body);
      plane(.38, .19, iceTex, 0, 1.3, -.202, Math.PI, body);
      rbox(.62, .08, .38, dark, 0, .97, 0, body, .03);
      break;
  }
  // jetpack (shown while the power-up is active)
  const jet = new THREE.Group(); jet.position.set(0, 1.25, .26); body.add(jet); jet.visible = false;
  for (const sx of [-.13, .13]){
    cyl(.1, .1, .5, std(0xc8ccd4, .25, .6), sx, 0, 0, jet, 14);
    cone(.1, .14, std(0xe8323c), sx, .32, 0, jet, 14);
    const fl = cone(.08, .35, glowMat(0xffa030), sx, -.42, 0, jet, 10); fl.rotation.x = Math.PI;
  }
  rbox(.36, .3, .08, std(0x4a4f5a), 0, 0, -.06, jet, .03);
  const shadow = new THREE.Mesh(new THREE.CircleGeometry(.5, 20), new THREE.MeshBasicMaterial({color:0, transparent:true, opacity:.22, depthWrite:false}));
  shadow.rotation.x = -Math.PI/2; shadow.position.y = .02; g.add(shadow);
  castAll(g); mergeTree(g);
  return {group:g, body, legL:legs[0], legR:legs[1], armL:arms[0], armR:arms[1], head, cape, shadow, jet, zombie: s.extra === 'zombie' || s.extra === 'mummy'};
}

function animRunner(r, t, mode){
  const {legL, legR, armL, armR, body, cape, head} = r;
  const armBase = r.zombie ? 1.45 : 0;
  body.rotation.set(0, 0, 0); body.position.set(0, 0, 0); head.rotation.set(0, 0, 0);
  armL.rotation.set(0, 0, 0); armR.rotation.set(0, 0, 0); legL.rotation.set(0, 0, 0); legR.rotation.set(0, 0, 0);
  if (mode === 'run'){
    const s = Math.sin(t*15), c = Math.cos(t*15);
    legL.rotation.x = s*1.0; legR.rotation.x = -s*1.0;
    armL.rotation.x = armBase - s*(r.zombie ? .15 : .9); armR.rotation.x = armBase + s*(r.zombie ? .15 : .9);
    armL.rotation.z = -.12; armR.rotation.z = .12;
    body.position.y = Math.abs(c)*.09; body.rotation.x = -.14; body.rotation.y = s*.06;
    head.rotation.x = .06; head.rotation.y = -s*.04;
    if (cape) cape.rotation.x = -.8 + Math.sin(t*22)*.12;
  } else if (mode === 'jump'){
    legL.rotation.x = 1.1; legR.rotation.x = -.4;
    armL.rotation.x = r.zombie ? armBase : 2.6; armR.rotation.x = r.zombie ? armBase : 2.3;
    armL.rotation.z = -.3; armR.rotation.z = .3;
    body.rotation.x = -.18; head.rotation.x = -.1;
    if (cape) cape.rotation.x = -.35;
  } else if (mode === 'fly'){
    legL.rotation.x = .3 + Math.sin(t*6)*.15; legR.rotation.x = .1 - Math.sin(t*6)*.15;
    armL.rotation.set(-.2, 0, -1.1); armR.rotation.set(-.2, 0, 1.1);
    body.rotation.x = -.35; body.position.y = Math.sin(t*4)*.06;
    if (cape) cape.rotation.x = -1.3;
  } else if (mode === 'slide'){
    body.rotation.x = 1.2; body.position.y = .18;
    legL.rotation.x = .25; legR.rotation.x = .15;
    armL.rotation.x = r.zombie ? armBase : -.6; armR.rotation.x = r.zombie ? armBase : -.4;
    head.rotation.x = -.5;
    if (cape) cape.rotation.x = -1.2;
  } else if (mode === 'fall'){
    body.rotation.x = -1.45; body.position.y = .2;
    legL.rotation.x = -.4; legR.rotation.x = -.1;
    armL.rotation.x = 2.8; armR.rotation.x = 2.6;
    if (cape) cape.rotation.x = .6;
  } else if (mode === 'grab'){
    armL.rotation.x = 1.3 + Math.sin(t*3)*.05; armR.rotation.x = .2;
  } else if (mode === 'cheer'){
    const s = Math.sin(t*8);
    armL.rotation.set(2.7 + s*.2, 0, -.3); armR.rotation.set(2.7 - s*.2, 0, .3);
    body.position.y = Math.abs(s)*.12;
  } else {
    const s = Math.sin(t*2.2);
    armL.rotation.x = armBase + s*.05; armR.rotation.x = armBase - s*.05;
    armL.rotation.z = -.08; armR.rotation.z = .08;
    body.position.y = s*.015; head.rotation.y = Math.sin(t*.7)*.2;
    if (cape) cape.rotation.x = -.12 + s*.05;
  }
}

function buildTrump(c){
  const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
  const metal = c.extra === 'gold' || c.extra === 'robot';
  const M = col => metal ? glossy(col, c.extra === 'gold' ? 0x3a2600 : 0) : std(col);
  const suit = M(c.suit), pantsM = M(c.pants), shirt = M(c.shirt), skin = M(c.skin || 0xf0a457),
        hair = M(c.hair || 0xf6d672), shoe = M(c.shoes || 0x15151a), pale = M(metal ? (c.skin || 0xf0a457) : 0xfbe0bc),
        lips = M(metal ? 0x888888 : 0xd77b6a), eyeM = c.eyes ? glowMat(c.eyes) : std(0x2a2320);
  const dark = std(INK), gold = glossy(0xffcf3a, 0x3a2600);
  const legs = [], arms = [];
  for (const sx of [-1, 1]){
    const leg = new THREE.Group(); leg.position.set(sx*.24, 1.0, 0); body.add(leg);
    caps(.17, .55, pantsM, 0, -.45, 0, leg);
    rbox(.36, .18, .54, shoe, 0, -.91, -.07, leg, .08);
    legs.push(leg);
  }
  rbox(1.0, .96, .72, suit, 0, 1.5, 0, body, .3);
  sph(.46, suit, 0, 1.3, -.17, body, 1.0, .85, .8);
  if (c.shirt !== c.suit){
    rbox(.3, .44, .06, shirt, 0, 1.75, -.34, body, .03);
    for (const sx of [-1, 1]) rbox(.12, .4, .05, M(c.suit), sx*.17, 1.74, -.36, body, .02).rotation.z = sx*.25;
  }
  if (c.tie){
    const tie = M(c.tie);
    rbox(.13, .11, .07, tie, 0, 1.9, -.4, body, .03);
    rbox(.13, .32, .045, tie, 0, 1.7, -.43, body, .02).rotation.x = -.35;
    rbox(.16, .62, .045, tie, 0, 1.25, -.55, body, .02);
    rbox(.12, .12, .045, tie, 0, .94, -.54, body, .01).rotation.z = Math.PI/4;
  }
  if (c.id === 'classic'){ sph(.035, std(0x2b56d6), -.3, 1.82, -.36, body); }
  for (const sx of [-1, 1]){
    const arm = new THREE.Group(); arm.position.set(sx*.6, 1.84, 0); body.add(arm);
    sph(.18, suit, 0, 0, 0, arm);
    caps(.14, .46, suit, 0, -.37, 0, arm);
    if (c.shirt !== c.suit) cyl(.13, .13, .08, shirt, 0, -.73, 0, arm);
    sph(.13, skin, 0, -.85, 0, arm);
    arms.push(arm);
  }
  const head = new THREE.Group(); head.position.set(0, 1.97, 0); body.add(head);
  cyl(.17, .19, .16, skin, 0, .05, 0, head);
  rbox(.62, .62, .58, skin, 0, .4, 0, head, .24);
  sph(.3, skin, 0, .18, -.06, head, 1.02, .6, .95);
  for (const sx of [-1, 1]){
    rbox(.19, .12, .03, pale, sx*.14, .47, -.283, head, .045);
    if (c.extra === 'pirate' && sx > 0) sph(.07, dark, sx*.14, .47, -.29, head, 1, 1, .3);
    else rbox(.09, .035, .02, eyeM, sx*.14, .47, -.298, head, .012);
    rbox(.17, .045, .035, hair, sx*.14, .555, -.29, head, .015).rotation.z = sx*.06;
    sph(.085, skin, sx*.31, .43, 0, head, .5, 1, .8);
  }
  sph(.075, skin, 0, .37, -.305, head, .9, 1.15, 1);
  torus(.045, .022, lips, 0, .235, -.3, head);
  sph(.026, std(0x5a2020), 0, .235, -.29, head);
  // the hair
  sph(.34, hair, 0, .7, .04, head, 1.0, .48, 1.0);
  const swoop = sph(.26, hair, .07, .69, -.22, head, 1.45, .42, .9); swoop.rotation.z = -.15;
  for (const sx of [-1, 1]) sph(.13, hair, sx*.29, .58, .06, head, .55, 1, 1.7);
  rbox(.6, .3, .16, hair, 0, .55, .27, head, .07);

  let cape = null;
  switch (c.extra){
    case 'golf': {
      const red = std(0xd3122a);
      sph(.34, red, 0, .76, .02, head, 1.02, .5, 1.02); rbox(.5, .04, .3, red, 0, .76, -.42, head, .02);
      rbox(.5, .07, .12, shirt, 0, 1.96, -.3, body, .03);
      cyl(.025, .025, 1.15, std(0xb0b4bc, .3, .6), 0, -1.4, 0, arms[1], 8);
      rbox(.1, .09, .26, std(0x30333a), 0, -1.97, -.08, arms[1], .03);
      break;
    }
    case 'cowboy': {
      const hat = std(0x6b4423);
      const brim = cyl(.62, .62, .05, hat, 0, .83, .02, head, 24); brim.scale.z = .9;
      rbox(.6, .32, .56, hat, 0, 1.0, .02, head, .12); torus(.31, .03, std(0x2a1a10), 0, .88, .02, head).rotation.x = Math.PI/2;
      rbox(1.02, .1, .76, std(0x3a2414), 0, 1.05, 0, body, .04);
      rbox(.18, .12, .04, gold, 0, 1.05, -.6, body, .02);
      break;
    }
    case 'pirate': {
      const hat = std(0x15151a);
      const tri = cyl(.5, .5, .1, hat, 0, .86, .02, head, 3); tri.rotation.y = Math.PI;
      sph(.32, hat, 0, .9, .02, head, 1, .45, 1);
      sph(.06, std(WHITE), 0, 1.0, -.25, head);
      for (const sx of [-1, 1]) rbox(.2, .5, .06, std(0xd4a020), sx*.25, 1.5, -.37, body, .02);
      rbox(1.04, .1, .76, std(0x2a1a10), 0, 1.07, 0, body, .04);
      break;
    }
    case 'santa': {
      const white = std(WHITE);
      torus(.33, .07, white, 0, .82, .02, head).rotation.x = Math.PI/2;
      const hatC = cone(.34, .62, std(0xc81d25), .04, 1.16, .04, head, 18); hatC.rotation.z = -.35;
      sph(.1, white, .17, 1.45, .04, head);
      sph(.33, white, 0, .15, -.14, head, 1, .75, .8); sph(.07, white, -.07, .3, -.33, head, 1.8, .55, .6); sph(.07, white, .07, .3, -.33, head, 1.8, .55, .6);
      rbox(1.04, .12, .78, std(0x111111), 0, 1.12, 0, body, .05); rbox(.18, .14, .04, gold, 0, 1.12, -.63, body, .02);
      for (const a of arms) cyl(.155, .155, .1, white, 0, -.73, 0, a);
      break;
    }
    case 'ninja':
      rbox(.66, .1, .62, std(0xd3122a), 0, .62, 0, head, .04);
      rbox(.07, .06, .32, std(0xd3122a), .05, .62, .4, head, .02).rotation.x = -.5;
      rbox(.6, .26, .12, std(0x1b1b24), 0, .2, -.22, head, .06);
      break;
    case 'cape':
      cape = new THREE.Group(); cape.position.set(0, 1.93, .36); body.add(cape);
      rbox(.95, 1.45, .04, std(0xd62b2b), 0, -.72, 0, cape, .02);
      rbox(.62, .1, .03, std(0x10204a), 0, .47, -.3, head, .02);
      { const tt = new THREE.Group(); tt.position.set(0, 1.62, -.37); body.add(tt);
        rbox(.3, .3, .04, gold, 0, 0, 0, tt, .05).rotation.z = Math.PI/4;
        rbox(.16, .04, .02, std(0xd62b2b), 0, .05, -.03, tt, .01); rbox(.04, .14, .02, std(0xd62b2b), 0, -.02, -.03, tt, .01); }
      break;
    case 'ice':
      sph(.34, dark, 0, .76, .02, head, 1.02, .5, 1.02); rbox(.5, .04, .3, dark, 0, .76, -.42, head, .02);
      rbox(.5, .09, .03, std(0x050505, .15), 0, .47, -.305, head, .03);
      plane(.8, .4, iceTex, 0, 1.6, .37, 0, body);
      plane(.44, .22, iceTex, .2, 1.75, -.37, Math.PI, body);
      break;
    case 'astro': {
      const helmet = sph(.55, new THREE.MeshPhongMaterial({color:0xbfe6ff, transparent:true, opacity:.28, shininess:120, specular:0xffffff}), 0, .45, 0, head);
      helmet.renderOrder = 2;
      torus(.45, .05, std(0xcfd3da), 0, .02, 0, head).rotation.x = Math.PI/2;
      rbox(.8, .8, .3, std(0xcfd3da), 0, 1.5, .48, body, .1);
      rbox(.3, .16, .04, std(0xff7a00), 0, 1.7, -.38, body, .02);
      break;
    }
    case 'robot':
      cyl(.025, .025, .35, M(0x30353c), 0, .98, 0, head, 6);
      sph(.08, glowMat(0xff2a2a), 0, 1.18, 0, head);
      rbox(.3, .14, .04, glowMat(0xff2a2a), .2, 1.7, -.37, body, .02);
      break;
    case 'zombie':
      rbox(.3, .22, .04, std(0x8fb36b), .25, 1.35, -.53, body, .03);
      rbox(.2, .18, .04, std(0x5a1010), -.28, 1.6, -.37, body, .03);
      break;
    case 'gold':
      rbox(.56, .1, .52, gold, 0, .88, .02, head, .03);
      for (let i = 0; i < 7; i++){ const a = i/7*Math.PI*2; cone(.07, .2, gold, Math.cos(a)*.24, 1.0, Math.sin(a)*.22 + .02, head, 6); }
      break;
    case 'king': {
      rbox(.56, .12, .52, gold, 0, .9, .02, head, .03);
      for (let i = 0; i < 7; i++){ const a = i/7*Math.PI*2; cone(.07, .22, gold, Math.cos(a)*.24, 1.04, Math.sin(a)*.22 + .02, head, 6); sph(.03, glowMat(0xff3b6b), Math.cos(a)*.24, 1.16, Math.sin(a)*.22 + .02, head); }
      cape = new THREE.Group(); cape.position.set(0, 1.95, .36); body.add(cape);
      rbox(1.05, 1.7, .05, std(0xb0151a), 0, -.85, 0, cape, .02);
      rbox(1.1, .2, .12, std(0xf4f1ea), 0, 0, 0, cape, .06);
      const sc = cyl(.03, .03, .9, gold, 0, -1.25, 0, arms[1], 8); sc.rotation.x = .1;
      sph(.08, glowMat(0x7df9ff), 0, -1.7, 0, arms[1]);
      break;
    }
    case 'baby':
      head.scale.setScalar(1.45); head.position.y = 1.9;
      rbox(1.04, .44, .8, std(WHITE), 0, 1.06, -.02, body, .15);
      rbox(.12, .22, .04, dark, 0, -.98, -.12, arms[0], .02);
      break;
    case 'bling': {
      for (const [r, y] of [[.3, 1.75], [.36, 1.6]]){ const ch = torus(r, .03, gold, 0, y, -.3, body); ch.rotation.x = 1.2; }
      rbox(.22, .22, .05, gold, 0, 1.42, -.56, body, .03);
      rbox(.56, .11, .04, std(0x050505, .1), 0, .47, -.305, head, .03);
      for (const sx of [-1, 1]) sph(.05, glowMat(0xbff6ff), sx*.33, .32, 0, head);
      break;
    }
  }
  castAll(g); mergeTree(g);
  g.scale.setScalar(.9);
  return {group:g, body, legL:legs[0], legR:legs[1], armL:arms[0], armR:arms[1], head, cape, zombie: c.extra === 'zombie'};
}
function animTrump(r, t, mode){
  const {legL, legR, armL, armR, body, head, cape} = r;
  body.rotation.set(0, 0, 0); body.position.set(0, 0, 0); head.rotation.set(0, 0, 0);
  armL.rotation.set(0, 0, 0); armR.rotation.set(0, 0, 0); legL.rotation.set(0, 0, 0); legR.rotation.set(0, 0, 0);
  if (mode === 'run'){
    const s = Math.sin(t*13);
    legL.rotation.x = s*.85; legR.rotation.x = -s*.85;
    if (r.zombie){ armL.rotation.x = 1.45 + s*.1; armR.rotation.x = 1.45 - s*.1; }
    else { armL.rotation.x = -s*1.1; armR.rotation.x = s*1.1; armL.rotation.z = -.35; armR.rotation.z = .35; }
    body.position.y = Math.abs(Math.cos(t*13))*.1; body.rotation.x = -.14; body.rotation.y = s*.05;
    head.rotation.z = Math.sin(t*6.5)*.06;
    if (cape) cape.rotation.x = -.7 + Math.sin(t*20)*.1;
  } else if (mode === 'angry'){
    const s = Math.sin(t*14);
    armL.rotation.set(2.5 + s*.3, 0, -.4); armR.rotation.set(2.5 - s*.3, 0, .4);
    body.position.y = Math.abs(s)*.1; head.rotation.z = s*.08;
    if (cape) cape.rotation.x = -.2;
  } else {
    const s = Math.sin(t*3);
    armR.rotation.x = 1.5 + s*.08; armR.rotation.z = .05;
    armL.rotation.z = -.25 + s*.05; armL.rotation.x = .1;
    head.rotation.y = s*.12; head.rotation.x = -.05;
    body.position.y = Math.abs(s)*.02;
    if (cape) cape.rotation.x = -.15 + s*.04;
  }
}

let runner = buildRunner(skinById(save.skin)); scene.add(runner.group);
let trump = buildTrump(chaserById(save.chaser)); scene.add(trump.group);
const agents = [buildRunner(AGENT), buildRunner(AGENT)];
for (const a of agents){ a.group.scale.setScalar(1.06); scene.add(a.group); }
function setRunnerSkin(id){ scene.remove(runner.group); disposeMerged(runner.group); runner = buildRunner(skinById(id)); scene.add(runner.group); }
function setChaserSkin(id){ scene.remove(trump.group); disposeMerged(trump.group); trump = buildTrump(chaserById(id)); scene.add(trump.group); }
