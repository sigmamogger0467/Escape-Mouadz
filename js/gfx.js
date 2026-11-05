'use strict';
/* ================= Renderer, lights and shape helpers ================= */
const canvas = $('c');
let renderer;
try{
  renderer = new THREE.WebGLRenderer({canvas, antialias:true, powerPreference:'high-performance'});
}catch(e){
  document.body.insertAdjacentHTML('beforeend', '<div id="err">WebGL wird von diesem Browser nicht unterstützt.</div>');
  throw e;
}
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(62, 1, 0.1, 400);

function canvasTex(w, h, draw){
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.anisotropy = 4;
  return t;
}
scene.fog = new THREE.Fog(0xb5607a, 40, 170);
const hemi = new THREE.HemisphereLight(0xffe2c8, 0x3a3060, 0.95); scene.add(hemi);
// The sun follows the runner (who always stays at the origin), so one small shadow map covers the action.
const sun = new THREE.DirectionalLight(0xffd2a8, 0.9);
sun.position.set(-6, 14, 5); sun.target.position.set(0, 0, -5);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
Object.assign(sun.shadow.camera, {left:-11, right:11, top:16, bottom:-9, near:1, far:45});
sun.shadow.bias = -0.0015; sun.shadow.normalBias = .02;
scene.add(sun); scene.add(sun.target);
function setShadows(on){ renderer.shadowMap.enabled = on; sun.castShadow = on; scene.traverse(o => { if (o.material) o.material.needsUpdate = true; }); }

const matCache = {};
function lam(color){ const k = 'l' + color; return matCache[k] || (matCache[k] = new THREE.MeshLambertMaterial({color})); }
function basic(color){ const k = 'b' + color; return matCache[k] || (matCache[k] = new THREE.MeshBasicMaterial({color})); }
function std(color, rough, metal){
  const r = rough === undefined ? .62 : rough, m = metal || 0, k = `s${color}_${r}_${m}`;
  return matCache[k] || (matCache[k] = new THREE.MeshStandardMaterial({color, roughness:r, metalness:m}));
}
function glossy(color, emissive){
  const k = `g${color}_${emissive || 0}`;
  return matCache[k] || (matCache[k] = new THREE.MeshPhongMaterial({color, shininess:90, specular:0xffffff, emissive: emissive || 0}));
}
function glowMat(color){ const k = 'e' + color; return matCache[k] || (matCache[k] = new THREE.MeshBasicMaterial({color, toneMapped:false})); }

const boxGeo = new THREE.BoxGeometry(1, 1, 1);
function box(w, h, d, mat, x, y, z, parent){
  const m = new THREE.Mesh(boxGeo, mat); m.scale.set(w, h, d); m.position.set(x, y, z); if (parent) parent.add(m); return m;
}
// Rounded box: the flat middle strip of each face is stretched, every other segment forms the rounded edge.
const geoCache = {};
function roundBoxGeo(w, h, d, r, seg){
  r = Math.max(.001, Math.min(r, w/2 - .001, h/2 - .001, d/2 - .001));
  const s = seg || 2, key = `rb${w.toFixed(3)}_${h.toFixed(3)}_${d.toFixed(3)}_${r.toFixed(3)}_${s}`;
  if (geoCache[key]) return geoCache[key];
  const n = s*2 + 1, g = new THREE.BoxGeometry(1, 1, 1, n, n, n);
  const pos = g.attributes.position, nor = g.attributes.normal, half = .5/n;
  const bx = w/2 - r, by = h/2 - r, bz = d/2 - r, v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++){
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const sx = Math.sign(x), sy = Math.sign(y), sz = Math.sign(z);
    v.set(x - sx*half, y - sy*half, z - sz*half).normalize();
    pos.setXYZ(i, sx*bx + v.x*r, sy*by + v.y*r, sz*bz + v.z*r);
    nor.setXYZ(i, v.x, v.y, v.z);
  }
  return geoCache[key] = g;
}
function rbox(w, h, d, mat, x, y, z, parent, r){
  const m = new THREE.Mesh(roundBoxGeo(w, h, d, r === undefined ? Math.min(w, h, d)*.32 : r), mat);
  m.position.set(x, y, z); if (parent) parent.add(m); return m;
}
const sphereGeo = new THREE.SphereGeometry(1, 22, 16);
function sph(r, mat, x, y, z, parent, sx, sy, sz){
  const m = new THREE.Mesh(sphereGeo, mat); m.scale.set(r*(sx || 1), r*(sy || 1), r*(sz || 1));
  m.position.set(x, y, z); if (parent) parent.add(m); return m;
}
function capsGeo(r, len){ const k = `c${r.toFixed(3)}_${len.toFixed(3)}`; return geoCache[k] || (geoCache[k] = new THREE.CapsuleGeometry(r, len, 6, 14)); }
function caps(r, len, mat, x, y, z, parent){ const m = new THREE.Mesh(capsGeo(r, len), mat); m.position.set(x, y, z); if (parent) parent.add(m); return m; }
function cylGeo(rt, rb, h, seg){ const k = `y${rt}_${rb}_${h}_${seg}`; return geoCache[k] || (geoCache[k] = new THREE.CylinderGeometry(rt, rb, h, seg || 16)); }
function cyl(rt, rb, h, mat, x, y, z, parent, seg){ const m = new THREE.Mesh(cylGeo(rt, rb, h, seg), mat); m.position.set(x, y, z); if (parent) parent.add(m); return m; }
function coneGeo(r, h, seg){ const k = `k${r}_${h}_${seg}`; return geoCache[k] || (geoCache[k] = new THREE.ConeGeometry(r, h, seg || 12)); }
function cone(r, h, mat, x, y, z, parent, seg){ const m = new THREE.Mesh(coneGeo(r, h, seg), mat); m.position.set(x, y, z); if (parent) parent.add(m); return m; }
function torusGeo(r, t, arc){ const k = `t${r}_${t}_${arc}`; return geoCache[k] || (geoCache[k] = new THREE.TorusGeometry(r, t, 8, 20, arc || Math.PI*2)); }
function torus(r, t, mat, x, y, z, parent, arc){ const m = new THREE.Mesh(torusGeo(r, t, arc), mat); m.position.set(x, y, z); if (parent) parent.add(m); return m; }
function castAll(g){ g.traverse(o => { if (o.isMesh && !(o.material && o.material.transparent)) o.castShadow = true; }); return g; }

function labelTex(lines, bg, fg, w, h){
  return canvasTex(w || 256, h || 128, (g, W, H) => {
    if (bg){ g.fillStyle = bg; g.fillRect(0, 0, W, H); }
    g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle';
    const n = lines.length;
    lines.forEach((ln, i) => {
      const size = ln.size || Math.floor(H/(n + .4));
      g.font = `900 ${size}px Impact, 'Arial Black', sans-serif`;
      g.fillText(ln.t, W/2, H*(i + .5)/n + 2);
    });
  });
}
const iceTex = labelTex([{t:'POLICE', size:30}, {t:'ICE', size:64}], '#111318', '#ffd23a');
function plane(w, h, tex, x, y, z, ry, parent, transparent){
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshLambertMaterial({map:tex, transparent:!!transparent}));
  m.position.set(x, y, z); m.rotation.y = ry || 0; if (parent) parent.add(m); return m;
}
// Soft round glow used for lamps, sparks and dust
const glowTex = canvasTex(64, 64, (g, w, h) => {
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.35, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
});
