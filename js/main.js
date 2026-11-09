'use strict';
/* ================= Boot ================= */
setQuality(save.settings.quality);
setCountry(save.country);
goMenu();
requestAnimationFrame(frame);
initCloud().finally(() => setTimeout(() => { refreshMenu(); if (state === 'menu' && dailyAvailable()) openDaily(); }, 400));
window.__escape = {G, get state(){ return state; }, get save(){ return save; }, get world(){ return worldIdx; }, startGame, moveLane, jump, slide, cloud, makeObstacle, setWorld, clearObjs, startJet, setCountry, setQuality, get objs(){ return objs; }, nWorlds: () => WORLDS.length, scene, worldG, goMenu, BLOCKING, LANES, junctionWindow, update, groundAt, renderer, objsInfo: () => objs.filter(o=>o.kind==='obstacle').map(o=>o.type+':'+o.lane+':'+o.mesh.position.z.toFixed(1))};
