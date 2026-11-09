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
// Graphics quality: high = shadows + outlines, mid = outlines, low = neither and a lower resolution
const gfxQ = {level:'high', outline:true};
function setQuality(q){
  gfxQ.level = q; gfxQ.outline = q !== 'low';
  setShadows(q === 'high');
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, q === 'high' ? 2 : q === 'mid' ? 1.5 : 1));
  if (typeof resize === 'function') resize();
}

// Cartoon shading: three hard light bands instead of smooth gradients
const toonGrad = new THREE.DataTexture(new Uint8Array([120, 120, 120, 255, 200, 200, 200, 255, 255, 255, 255, 255]), 3, 1, THREE.RGBAFormat);
toonGrad.minFilter = toonGrad.magFilter = THREE.NearestFilter; toonGrad.generateMipmaps = false; toonGrad.needsUpdate = true;
function toon(opts){ return new THREE.MeshToonMaterial(Object.assign({gradientMap: toonGrad}, opts)); }
const matCache = {};
function lam(color){ const k = 'l' + color; return matCache[k] || (matCache[k] = toon({color})); }
function basic(color){ const k = 'b' + color; return matCache[k] || (matCache[k] = new THREE.MeshBasicMaterial({color})); }
function std(color, rough, metal){
  const k = `s${color}_${metal ? 1 : 0}`;
  return matCache[k] || (matCache[k] = toon({color, emissive: metal ? new THREE.Color(color).multiplyScalar(.12) : 0}));
}
function glossy(color, emissive){
  const k = `g${color}_${emissive || 0}`;
  return matCache[k] || (matCache[k] = toon({color, emissive: emissive ? new THREE.Color(emissive).multiplyScalar(1.6) : new THREE.Color(color).multiplyScalar(.1)}));
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
  g.userData.shared = true; return geoCache[key] = g;
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
function shared(g){ g.userData.shared = true; return g; }
function capsGeo(r, len){ const k = `c${r.toFixed(3)}_${len.toFixed(3)}`; return geoCache[k] || (geoCache[k] = shared(new THREE.CapsuleGeometry(r, len, 6, 14))); }
function caps(r, len, mat, x, y, z, parent){ const m = new THREE.Mesh(capsGeo(r, len), mat); m.position.set(x, y, z); if (parent) parent.add(m); return m; }
function cylGeo(rt, rb, h, seg){ const k = `y${rt}_${rb}_${h}_${seg}`; return geoCache[k] || (geoCache[k] = shared(new THREE.CylinderGeometry(rt, rb, h, seg || 16))); }
function cyl(rt, rb, h, mat, x, y, z, parent, seg){ const m = new THREE.Mesh(cylGeo(rt, rb, h, seg), mat); m.position.set(x, y, z); if (parent) parent.add(m); return m; }
function coneGeo(r, h, seg){ const k = `k${r}_${h}_${seg}`; return geoCache[k] || (geoCache[k] = shared(new THREE.ConeGeometry(r, h, seg || 12))); }
function cone(r, h, mat, x, y, z, parent, seg){ const m = new THREE.Mesh(coneGeo(r, h, seg), mat); m.position.set(x, y, z); if (parent) parent.add(m); return m; }
function torusGeo(r, t, arc){ const k = `t${r}_${t}_${arc}`; return geoCache[k] || (geoCache[k] = shared(new THREE.TorusGeometry(r, t, 8, 20, arc || Math.PI*2))); }
function torus(r, t, mat, x, y, z, parent, arc){ const m = new THREE.Mesh(torusGeo(r, t, arc), mat); m.position.set(x, y, z); if (parent) parent.add(m); return m; }
function castAll(g){ g.traverse(o => { if (o.isMesh && !(o.material && o.material.transparent)) o.castShadow = true; }); outlineAll(g); return g; }

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
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), toon({map:tex, transparent:!!transparent}));
  m.position.set(x, y, z); m.rotation.y = ry || 0; if (parent) parent.add(m); return m;
}
// Soft round glow used for lamps, sparks and dust
const glowTex = canvasTex(64, 64, (g, w, h) => {
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.35, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
});

/* ================= Cartoon outlines ================= */
// Meshes on layer 1 are drawn a second time as slightly inflated back faces in ink color,
// which leaves a clean line around every silhouette. Fog is applied so far objects fade out.
const OUTLINE_LAYER = 1;
const INK_COLOR = 0x1c1230;
const outlineMat = new THREE.ShaderMaterial({
  uniforms: {width: {value: .0042}, color: {value: new THREE.Color(INK_COLOR)}, fogColor: {value: new THREE.Color()}, fogNear: {value: 40}, fogFar: {value: 170}},
  vertexShader: `uniform float width; varying float vDepth;
    void main(){
      vec4 p = vec4(position, 1.0); vec3 nn = normal;
      #ifdef USE_INSTANCING
        p = instanceMatrix * p; nn = mat3(instanceMatrix) * nn;
      #endif
      vec4 mv = modelViewMatrix * p;
      vec3 n = normalize(normalMatrix * nn);
      mv.xyz += n * width * clamp(-mv.z, 2.0, 60.0);
      vDepth = -mv.z;
      gl_Position = projectionMatrix * mv;
    }`,
  fragmentShader: `uniform vec3 color; uniform vec3 fogColor; uniform float fogNear; uniform float fogFar; varying float vDepth;
    void main(){ gl_FragColor = vec4(mix(color, fogColor, smoothstep(fogNear, fogFar, vDepth)), 1.0); }`,
  side: THREE.BackSide
});
function outlineAll(g){
  g.traverse(o => { if (o.isMesh && !(o.material && (o.material.transparent || o.material.isMeshBasicMaterial)) && o.geometry !== boxGeo) o.layers.enable(OUTLINE_LAYER); });
  return g;
}
const edgesGeo = new THREE.EdgesGeometry(boxGeo);
const edgeMat = new THREE.LineBasicMaterial({color: INK_COLOR, transparent: true, opacity: .55});
function renderScene(){
  renderer.render(scene, camera);
  if (!gfxQ.outline) return;
  const bg = scene.background, su = renderer.shadowMap.autoUpdate;
  outlineMat.uniforms.fogColor.value.copy(scene.fog.color);
  outlineMat.uniforms.fogNear.value = scene.fog.near; outlineMat.uniforms.fogFar.value = scene.fog.far;
  scene.background = null; scene.overrideMaterial = outlineMat;
  renderer.autoClear = false; renderer.shadowMap.autoUpdate = false;
  camera.layers.set(OUTLINE_LAYER);
  renderer.render(scene, camera);
  camera.layers.set(0);
  renderer.autoClear = true; renderer.shadowMap.autoUpdate = su; scene.overrideMaterial = null; scene.background = bg;
}

/* ================= Mesh merging (fewer draw calls) ================= */
// Meshes that are direct children of the same group and share a material become one mesh.
function concatGeos(geos){
  let n = 0; for (const g of geos) n += g.attributes.position.count;
  const pos = new Float32Array(n*3), nor = new Float32Array(n*3), uv = new Float32Array(n*2);
  let o = 0;
  for (const g of geos){
    const c = g.attributes.position.count;
    pos.set(g.attributes.position.array, o*3);
    if (g.attributes.normal) nor.set(g.attributes.normal.array, o*3);
    if (g.attributes.uv) uv.set(g.attributes.uv.array, o*2);
    o += c;
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  out.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  out.userData.merged = true;
  out.computeBoundingSphere();
  return out;
}
function mergeChildren(group){
  const buckets = new Map();
  for (const c of group.children){
    if (!c.isMesh || c.isInstancedMesh || Array.isArray(c.material) || c.material.transparent || c.children.length || c.userData.keep) continue;
    const k = c.material.uuid + '|' + c.castShadow + '|' + c.receiveShadow + '|' + c.layers.mask;
    if (!buckets.has(k)) buckets.set(k, []);
    buckets.get(k).push(c);
  }
  for (const list of buckets.values()){
    if (list.length < 2) continue;
    const geos = list.map(m => { m.updateMatrix(); const g = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone(); g.applyMatrix4(m.matrix); return g; });
    const mesh = new THREE.Mesh(concatGeos(geos), list[0].material);
    mesh.castShadow = list[0].castShadow; mesh.receiveShadow = list[0].receiveShadow; mesh.layers.mask = list[0].layers.mask;
    for (const m of list) group.remove(m);
    group.add(mesh);
    for (const g of geos) g.dispose();
  }
}
function mergeTree(root){
  const groups = [];
  root.traverse(o => { if (!o.isMesh && o.children.length) groups.push(o); });
  for (const g of groups) mergeChildren(g);
  return root;
}
function disposeMerged(root){ root.traverse(o => { if (o.geometry && o.geometry.userData.merged && !o.geometry.userData.shared) o.geometry.dispose(); }); }
