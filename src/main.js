import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

// ---------- renderer / scene ----------
const canvas = document.getElementById('game');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.9;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x04050d);
scene.fog = new THREE.Fog(0x04050d, 16, 38);

const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
camera.position.set(0.8, 6.6, 15.4);
camera.lookAt(0, 5.6, -0.2);

// ---------- lights ----------
scene.add(new THREE.HemisphereLight(0xdfe8ff, 0x1a1a18, 0.55)); // relleno tenue

const key = new THREE.DirectionalLight(0xfff1d6, 1.1);   // luz cálida suave
key.position.set(6, 12, 8);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
key.shadow.camera.left = key.shadow.camera.bottom = -9;
key.shadow.camera.right = key.shadow.camera.top = 9;
key.shadow.bias = -0.0004;
scene.add(key);

const innerGlow = new THREE.PointLight(0xfff4dd, 5, 7, 1.9);  // luz interior suave
innerGlow.position.set(0, 6.6, 0);
scene.add(innerGlow);

// spotlight suave sobre la pila de premios
const spot = new THREE.SpotLight(0xfff6e0, 18, 12, Math.PI / 4.5, 0.7, 1.6);
spot.position.set(0, 8.5, 0.6);
spot.target.position.set(0, 4.5, 0);
spot.castShadow = true;
spot.shadow.mapSize.set(1024, 1024);
spot.shadow.bias = -0.0004;
scene.add(spot, spot.target);

// ---------- procedural PBR textures ----------
// brushed metal: horizontal streaks in roughness map
function brushedTex(reps = 4) {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const x = c.getContext('2d');
  x.fillStyle = '#888'; x.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 900; i++) {
    const y = Math.random() * 256, w = 20 + Math.random() * 200;
    const v = 90 + Math.random() * 120 | 0;
    x.strokeStyle = `rgba(${v},${v},${v},0.35)`;
    x.lineWidth = Math.random() < 0.2 ? 2 : 1;
    x.beginPath(); x.moveTo(Math.random() * 256 - 100, y); x.lineTo(Math.random() * 256 + w, y + (Math.random() - 0.5) * 2); x.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(reps, reps);
  return t;
}
// painted wood: grain lines + slight color variation
function woodTex(base = '#c2185b') {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const x = c.getContext('2d');
  x.fillStyle = base; x.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 60; i++) {
    const y = Math.random() * 256;
    x.strokeStyle = `rgba(0,0,0,${0.04 + Math.random() * 0.09})`;
    x.lineWidth = 1 + Math.random() * 3;
    x.beginPath();
    x.moveTo(0, y);
    x.bezierCurveTo(85, y + (Math.random() - 0.5) * 8, 170, y + (Math.random() - 0.5) * 8, 256, y);
    x.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
const brushed = brushedTex();
const brushedRough = brushedTex(2);
const woodPink = woodTex('#15151d');   // gabinete negro laqueado
const woodDark = woodTex('#0d0f1a');

// ---------- materials ----------
const M = {
  metal: new THREE.MeshStandardMaterial({ color: 0x9aa7b8, metalness: 0.9, roughness: 0.28, roughnessMap: brushedRough }),
  darkMetal: new THREE.MeshStandardMaterial({ color: 0x2a2f3d, metalness: 0.75, roughness: 0.4, roughnessMap: brushedRough }),
  pink: new THREE.MeshStandardMaterial({ map: woodPink, color: 0x8a8aa0, metalness: 0.55, roughness: 0.35 }), // gabinete negro brillante
  chrome: new THREE.MeshStandardMaterial({ color: 0xf0f0f0, metalness: 1, roughness: 0.12, roughnessMap: brushedRough }),
  glass: new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: 0, roughness: 0.05, transmission: 1, thickness: 0.25, transparent: true, opacity: 0.22 }),
  floor: new THREE.MeshStandardMaterial({ color: 0x0a0a16, roughness: 0.15, metalness: 0.6 }),
  back: new THREE.MeshStandardMaterial({ map: woodDark, color: 0x4a4f7a, roughness: 0.5, metalness: 0.4, emissive: 0x05051a, emissiveIntensity: 0.8 }),
  neonPink: new THREE.MeshStandardMaterial({ color: 0xff2fd0, emissive: 0xff2fd0, emissiveIntensity: 3 }),
  neon: new THREE.MeshStandardMaterial({ color: 0x22e6ff, emissive: 0x22e6ff, emissiveIntensity: 3 }),
  cable: new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.85, metalness: 0.1 }),       // goma/cable
  claw: new THREE.MeshStandardMaterial({ color: 0xd8dee9, metalness: 0.95, roughness: 0.18, map: brushed, roughnessMap: brushedRough }), // metal cepillado
  rubber: new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 0.95, metalness: 0 }),        // ventosas de goma
};

// ---------- máquina real (modelo GLB escaneado) ----------
const W = 4.6, D = 4.6;                    // zona jugable dentro de la cabina
const CABIN_FLOOR = 4.45;                  // bandeja metálica interior del modelo
const CABIN_CEIL = 8.9;                    // techo de la cabina de vidrio
const CHUTE = { x: 1.55, z: 1.55 };        // esquina donde suelta el premio

const dracoLoader = new DRACOLoader().setDecoderPath('draco/');
const machine = (await new GLTFLoader().setDRACOLoader(dracoLoader).loadAsync('claw_machine.glb')).scene;
machine.updateMatrixWorld(true);

// quitar la garra estática horneada en el modelo (la nuestra es animada con spring)
machine.traverse(o => {
  if (!o.isMesh || !o.geometry.index) return;
  const pos = o.geometry.getAttribute('position');
  const idx = o.geometry.getIndex().array;
  const keep = new Uint32Array(idx.length);
  let n = 0;
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  for (let i = 0; i < idx.length; i += 3) {
    a.fromBufferAttribute(pos, idx[i]).applyMatrix4(o.matrixWorld);
    b.fromBufferAttribute(pos, idx[i+1]).applyMatrix4(o.matrixWorld);
    c.fromBufferAttribute(pos, idx[i+2]).applyMatrix4(o.matrixWorld);
    const cx = (a.x+b.x+c.x)/3, cy = (a.y+b.y+c.y)/3, cz = (a.z+b.z+c.z)/3;
    // garra: cuelga del centro del techo de la cabina (unidades del modelo)
    if (Math.abs(cx) < 0.14 && Math.abs(cz) < 0.14 && cy > 0.42 && cy < 0.85) continue;
    keep[n++] = idx[i]; keep[n++] = idx[i+1]; keep[n++] = idx[i+2];
  }
  o.geometry.setIndex(new THREE.BufferAttribute(keep.slice(0, n), 1));
});

const MACHINE_SCALE = 11.2;
machine.scale.setScalar(MACHINE_SCALE);
machine.traverse(o => {
  if (o.isMesh) {
    o.castShadow = o.receiveShadow = true;
    if (o.material && 'envMapIntensity' in o.material) {
      o.material.envMapIntensity = 0.05;                 // matar reflejos plásticos
      if ('roughness' in o.material) o.material.roughness = Math.min(1, o.material.roughness * 1.8 + 0.2);
      if ('metalness' in o.material) o.material.metalness = Math.max(0, o.material.metalness * 0.6);
    }
  }
});
scene.add(machine);

// piso oscuro para que la máquina no flote en el vacío
const ground = new THREE.Mesh(
  new THREE.CircleGeometry(30, 48),
  new THREE.MeshStandardMaterial({ color: 0x0c0c12, roughness: 0.9, metalness: 0 })
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// riel superior decorativo dentro de la cabina (acompaña el movimiento X)
const crossRail = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.08, 2.2), M.darkMetal);
crossRail.position.y = CABIN_CEIL - 0.12;
crossRail.castShadow = true;
scene.add(crossRail);

// ---------- toys ----------
const toys = [];
const toyColors = [0xff2fb3, 0x22e6ff, 0x9b30ff, 0xff5e8a, 0x3d7bff, 0xff3b6b, 0x00e0b8, 0xb06bff, 0xff7ac8, 0x66f0ff];
const rand = (a, b) => a + Math.random() * (b - a);

function makeToy(i) {
  const g = new THREE.Group();
  const color = toyColors[i % toyColors.length];
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0.05 });
  const belly = new THREE.MeshStandardMaterial({ color: new THREE.Color(color).lerp(new THREE.Color(0xffffff), 0.55), roughness: 0.65 });
  const kind = i % 4;
  if (kind === 0) { // shiny ball
    const r = rand(0.28, 0.42);
    g.add(new THREE.Mesh(new THREE.SphereGeometry(r, 24, 18), new THREE.MeshStandardMaterial({ color, roughness: 0.25, metalness: 0.3 })));
    g.userData.grabR = r; g.userData.weight = r;
  } else if (kind === 1) { // plushie: body + belly + ears
    const r = rand(0.26, 0.38);
    const body = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 18), mat);
    body.scale.y = 1.12; g.add(body);
    const tum = new THREE.Mesh(new THREE.SphereGeometry(r * 0.62, 16, 12), belly);
    tum.position.set(0, -r * 0.18, r * 0.55); tum.scale.set(0.85, 0.95, 0.6); g.add(tum);
    const earGeo = new THREE.SphereGeometry(r * 0.34, 12, 10);
    for (const s of [-1, 1]) {
      const ear = new THREE.Mesh(earGeo, mat);
      ear.position.set(s * r * 0.55, r * 0.95, 0); g.add(ear);
    }
    g.userData.grabR = r; g.userData.weight = r * 1.3;
  } else if (kind === 2) { // capsule pill toy
    const r = rand(0.2, 0.3);
    const cap = new THREE.Mesh(new THREE.CapsuleGeometry(r, rand(0.25, 0.4), 8, 16), mat);
    cap.rotation.z = Math.PI / 2; cap.rotation.y = rand(0, Math.PI); g.add(cap);
    g.userData.grabR = r * 1.1; g.userData.weight = r * 1.6;
  } else { // gift box
    const s = rand(0.4, 0.55);
    const m = new THREE.Mesh(new THREE.BoxGeometry(s, s, s), mat);
    const ribbon = new THREE.Mesh(new THREE.BoxGeometry(s * 1.02, s * 0.2, s * 1.02), belly);
    m.rotation.y = rand(0, Math.PI); g.add(m, ribbon);
    ribbon.rotation.y = m.rotation.y;
    g.userData.grabR = s * 0.6; g.userData.weight = s * 0.8;
  }
  g.scale.setScalar(0.62);   // toys chicos para caber en la cabina del modelo
  g.userData.grabR *= 0.62; g.userData.weight *= 0.62;
  // mound pile: denser toward center, stacked in loose layers
  const ang = rand(0, Math.PI * 2), rad = Math.pow(Math.random(), 0.6);
  const px = Math.cos(ang) * rad * 1.55;
  const pz = Math.sin(ang) * rad * 1.55;
  const py = 4.58 + Math.max(0, (1 - rad)) * rand(0, 0.55) + (i % 3 === 0 ? rand(0.25, 0.5) : 0);
  g.position.set(px, py, pz);
  g.rotation.y = rand(0, Math.PI * 2);
  g.children.forEach(c => { c.castShadow = c.receiveShadow = true; });
  scene.add(g);
  toys.push(g);
}
for (let i = 0; i < 30; i++) makeToy(i);

// ---------- claw assembly ----------
const carriage = new THREE.Group();          // moves XZ
carriage.position.y = CABIN_CEIL - 0.12;
scene.add(carriage);
const carBody = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.3, 0.42), M.darkMetal); // parte móvil del riel
carBody.castShadow = true; carriage.add(carBody);

const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1, 8), M.cable);
carriage.add(cable);

const clawRoot = new THREE.Group();          // hangs from cable end
clawRoot.scale.setScalar(0.62);              // garra a escala de la cabina
carriage.add(clawRoot);
// cabeza tipo imagen: domo metálico con collar y nudillos
const head = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.3, 0.34, 20), M.claw);
head.castShadow = true; clawRoot.add(head);
const dome = new THREE.Mesh(new THREE.SphereGeometry(0.24, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), M.claw);
dome.position.y = 0.17; dome.castShadow = true; clawRoot.add(dome);
const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.32, 0.08, 20), M.darkMetal);
collar.position.y = -0.2; collar.castShadow = true; clawRoot.add(collar);

// luz roja parpadeante sobre la garra (marca que está activa)
const beacon = new THREE.PointLight(0xff2222, 0, 4, 2);
beacon.position.y = 0.35;
clawRoot.add(beacon);
const beaconBulb = new THREE.Mesh(
  new THREE.SphereGeometry(0.06, 10, 8),
  new THREE.MeshStandardMaterial({ color: 0xff2222, emissive: 0xff2222, emissiveIntensity: 0 })
);
beaconBulb.position.y = 0.32;
clawRoot.add(beaconBulb);

const prongs = [];
for (let i = 0; i < 3; i++) {
  const pivot = new THREE.Group();
  pivot.rotation.y = (i / 3) * Math.PI * 2;
  clawRoot.add(pivot);
  const prong = new THREE.Group();
  pivot.add(prong);
  // brazo largo curvado hacia adentro, como la garra de la foto
  const knuckle = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), M.darkMetal);
  prong.add(knuckle);
  const upper = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.045, 0.62, 8), M.claw);
  upper.position.set(0.04, -0.4, 0); upper.rotation.z = -0.12; prong.add(upper);
  const mid = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.035, 0.5, 8), M.claw);
  mid.position.set(0.14, -0.85, 0); mid.rotation.z = -0.55; prong.add(mid);
  const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.01, 0.42, 8), M.claw);
  tip.position.set(0.26, -1.18, 0); tip.rotation.z = -1.05; prong.add(tip);
  const pad = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), M.rubber); // ventosa de goma
  pad.position.set(0.34, -1.32, 0); prong.add(pad);
  prong.position.x = 0.26;
  prong.children.forEach(c => c.castShadow = true);
  prongs.push(prong);
}

// ---------- partículas (motas de brillo al agarrar) ----------
const sparkGeo = new THREE.SphereGeometry(0.035, 6, 5);
const sparkMat = new THREE.MeshBasicMaterial({ color: 0xfff0b8, transparent: true });
const sparks = [];
for (let i = 0; i < 4; i++) {
  const s = new THREE.Mesh(sparkGeo, sparkMat.clone());
  s.visible = false; scene.add(s);
  sparks.push({ mesh: s, vel: new THREE.Vector3(), life: 0 });
}
function burstSparks(x, y, z) {
  for (const s of sparks) {
    s.mesh.position.set(x + rand(-0.2, 0.2), y + rand(-0.1, 0.15), z + rand(-0.2, 0.2));
    s.vel.set(rand(-0.7, 0.7), rand(1.2, 2.2), rand(-0.7, 0.7));
    s.life = rand(0.5, 0.9);
    s.mesh.visible = true;
    s.mesh.material.opacity = 1;
  }
}

// ---------- spring model ----------
// cable length follows target with damped spring => overshoot/wobble
const spring = { len: 0.9, vel: 0, target: 0.9, k: 90, damp: 7 };
const HEAD_Y = CABIN_CEIL - 0.12;
const FLOOR_Y = 4.95;                        // tope de la pila de toys

let prongOpen = 0.55;      // 0 closed .. 1 open (applied angle base)
let prongTarget = 0.55;

// ---------- state machine ----------
const MOVE = { minX: -1.55, maxX: 1.55, minZ: -1.45, maxZ: 1.45 };
const SPEED = 4.2;
let state = 'idle';        // idle | drop | grab | lift | carry | release | return
let heldToy = null;
let prizes = 0;
const msg = document.getElementById('msg');
const prizeEl = document.getElementById('prizes');

function setMsg(t) { msg.textContent = t; }

// ---------- audio (WebAudio, sin archivos) ----------
let actx = null, motorOsc = null, motorGain = null;
function audio() { return actx ??= new (window.AudioContext || window.webkitAudioContext)(); }
function motorStart() {
  try {
    const a = audio(); if (a.state === 'suspended') a.resume();
    motorOsc = a.createOscillator(); motorOsc.type = 'sawtooth'; motorOsc.frequency.value = 55;
    const lfo = a.createOscillator(); lfo.frequency.value = 9;
    const lfoG = a.createGain(); lfoG.gain.value = 6;
    lfo.connect(lfoG); lfoG.connect(motorOsc.frequency); lfo.start();
    motorGain = a.createGain();
    motorGain.gain.setValueAtTime(0, a.currentTime);
    motorGain.gain.linearRampToValueAtTime(0.05, a.currentTime + 0.15);
    const lp = a.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 220;
    motorOsc.connect(lp); lp.connect(motorGain); motorGain.connect(a.destination);
    motorOsc.start();
    motorOsc._lfo = lfo;
  } catch {}
}
function motorStop() {
  if (!motorOsc) return;
  try {
    const a = audio();
    motorGain.gain.linearRampToValueAtTime(0, a.currentTime + 0.12);
    setTimeout(() => { motorOsc.stop(); motorOsc._lfo.stop(); }, 200);
  } catch {}
  motorOsc = null; motorGain = null;
}
function ding() {
  try {
    const a = audio(); if (a.state === 'suspended') a.resume();
    const t = a.currentTime;
    for (const [f, d] of [[880, 0], [1318.5, 0.09]]) {
      const o = a.createOscillator(); o.type = 'sine'; o.frequency.value = f;
      const g = a.createGain();
      g.gain.setValueAtTime(0.18, t + d);
      g.gain.exponentialRampToValueAtTime(0.001, t + d + 0.7);
      o.connect(g); g.connect(a.destination);
      o.start(t + d); o.stop(t + d + 0.75);
    }
  } catch {}
}

function drop() {
  if (state !== 'idle') return;
  state = 'drop';
  dropT = 0; dropFrom = spring.len; dropTo = HEAD_Y - FLOOR_Y;
  motorStart();
  prongTarget = 1;
  setMsg('¡Bajando!');
}

// input
const keys = {};
addEventListener('keydown', e => {
  if (e.code === 'Space') { e.preventDefault(); drop(); }
  keys[e.code] = true;
});
addEventListener('keyup', e => keys[e.code] = false);
for (const [id, code] of [['btnL','ArrowLeft'],['btnR','ArrowRight'],['btnU','ArrowUp'],['btnD','ArrowDown']]) {
  const el = document.getElementById(id);
  const on = e => { e.preventDefault(); keys[code] = true; };
  const off = e => { e.preventDefault(); keys[code] = false; };
  el.addEventListener('pointerdown', on);
  el.addEventListener('pointerup', off);
  el.addEventListener('pointerleave', off);
  el.addEventListener('pointercancel', off);
}
document.getElementById('btnDrop').addEventListener('pointerdown', e => { e.preventDefault(); drop(); });
document.getElementById('btnReset').addEventListener('click', () => location.reload());

// ---------- update ----------
const clock = new THREE.Clock();
let grabTimer = 0;
let dropT = 0, dropFrom = 0.9, dropTo = 0;
let squeezeTimer = 0;

const easeInOutCubic = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

function tick() {
  const dt = Math.min(clock.getDelta(), 0.05);

  // movement
  if (state === 'idle') {
    let dx = (keys.ArrowRight ? 1 : 0) - (keys.ArrowLeft ? 1 : 0);
    let dz = (keys.ArrowDown ? 1 : 0) - (keys.ArrowUp ? 1 : 0);
    if (dx && dz) { dx *= 0.707; dz *= 0.707; }
    carriage.position.x = THREE.MathUtils.clamp(carriage.position.x + dx * SPEED * dt, MOVE.minX, MOVE.maxX);
    carriage.position.z = THREE.MathUtils.clamp(carriage.position.z + dz * SPEED * dt, MOVE.minZ, MOVE.maxZ);
    crossRail.position.x = carriage.position.x;
  }

  // spring integration (damped harmonic oscillator)
  const acc = -spring.k * (spring.len - spring.target) - spring.damp * spring.vel;
  spring.vel += acc * dt;
  spring.len += spring.vel * dt;

  // prongs ease toward open/closed
  prongOpen += (prongTarget - prongOpen) * Math.min(1, dt * 6);
  for (const p of prongs) p.rotation.z = 0.15 + prongOpen * 0.5;

  // apply cable visuals
  cable.scale.y = spring.len;
  cable.position.y = -spring.len / 2;
  clawRoot.position.y = -spring.len;
  // pendulum sway while moving
  clawRoot.rotation.z = THREE.MathUtils.lerp(clawRoot.rotation.z, -((keys.ArrowRight?1:0)-(keys.ArrowLeft?1:0)) * 0.12, dt * 5);
  clawRoot.rotation.x = THREE.MathUtils.lerp(clawRoot.rotation.x, ((keys.ArrowDown?1:0)-(keys.ArrowUp?1:0)) * 0.12, dt * 5);

  const clawWorldY = HEAD_Y - spring.len;

  // state machine
  if (state === 'drop') {
    // bajada con easing suave (no lineal)
    dropT = Math.min(1, dropT + dt / 1.5);
    spring.target = dropFrom + (dropTo - dropFrom) * easeInOutCubic(dropT);
    if (dropT >= 1 && clawWorldY <= FLOOR_Y + 0.08 && Math.abs(spring.vel) < 0.6) {
      state = 'grab'; grabTimer = 0; prongTarget = 0; setMsg('¡Cerrando!');
    }
  } else if (state === 'grab') {
    grabTimer += dt;
    if (grabTimer > 0.9) {
      // pausa de apretón antes de subir
      motorStop();
      state = 'squeeze'; squeezeTimer = 0;
    }
  } else if (state === 'squeeze') {
    squeezeTimer += dt;
    if (squeezeTimer > 0.5) {
      // pick nearest toy under claw
      let best = null, bd = 1e9;
      for (const t of toys) {
        const d = Math.hypot(t.position.x - carriage.position.x, t.position.z - carriage.position.z);
        if (d < bd) { bd = d; best = t; }
      }
      const reach = 0.55;
      if (best && bd < reach + best.userData.grabR) {
        // success chance: better centered + lighter toys grab easier
        const fit = THREE.MathUtils.clamp(1 - bd / (reach + best.userData.grabR), 0, 1);
        const chance = 0.35 + fit * 0.55 - best.userData.weight * 0.15;
        if (Math.random() < chance) {
          heldToy = best;
          toys.splice(toys.indexOf(best), 1);
          burstSparks(best.position.x, best.position.y + 0.4, best.position.z);
          ding();
          state = 'lift'; spring.target = 0.9; setMsg('¡Atrapado!');
        } else {
          state = 'lift'; spring.target = 0.9; setMsg('¡Se escapó!');
        }
      } else {
        state = 'lift'; spring.target = 0.9; setMsg('¡Falló!');
      }
    }
  } else if (state === 'lift') {
    if (spring.len < 1.0) {
      if (heldToy) { state = 'carry'; setMsg('Llevándolo al buzón…'); }
      else { state = 'idle'; prongTarget = 0.55; setMsg('Mové la garra y bajala'); }
    }
  } else if (state === 'carry') {
    // auto-drive to chute
    const tx = CHUTE.x, tz = CHUTE.z;
    const vx = tx - carriage.position.x, vz = tz - carriage.position.z;
    const dist = Math.hypot(vx, vz);
    if (dist > 0.05) {
      const s = Math.min(dist, SPEED * 0.7 * dt);
      carriage.position.x += vx / dist * s;
      carriage.position.z += vz / dist * s;
      crossRail.position.x = carriage.position.x;
    } else {
      state = 'release'; prongTarget = 1; setMsg('🎉 ¡Premio!');
      prizes++; prizeEl.textContent = prizes;
      prizeEl.classList.add('pop'); setTimeout(() => prizeEl.classList.remove('pop'), 200);
    }
  } else if (state === 'release') {
    if (prongOpen > 0.9 && heldToy) {
      heldToy.position.set(carriage.position.x, CABIN_FLOOR + 0.4, carriage.position.z);
      heldToy.userData.falling = true;
      heldToy = null;
      state = 'idle'; prongTarget = 0.55; setMsg('Mové la garra y bajala');
    }
  }

  // held toy follows claw tips
  if (heldToy && !heldToy.userData.falling) {
    heldToy.position.set(carriage.position.x, clawWorldY - heldToy.userData.grabR - 0.55, carriage.position.z);
  }
  // simple fall for released toy
  for (const t of scene.children) if (t.userData && t.userData.falling) {
    t.position.y -= 6 * dt;
    if (t.position.y < CABIN_FLOOR + 0.2) t.userData.falling = false;
  }

  // partículas
  for (const s of sparks) {
    if (s.life <= 0) continue;
    s.life -= dt;
    s.mesh.position.addScaledVector(s.vel, dt);
    s.vel.y -= 2.5 * dt;
    s.mesh.material.opacity = Math.max(0, s.life);
    if (s.life <= 0) s.mesh.visible = false;
  }

  // beacon: parpadea siempre que la garra está activa (no idle)
  const active = state !== 'idle';
  const blink = active ? (Math.sin(clock.elapsedTime * 9) > 0 ? 1 : 0.12) : 0.35;
  beacon.intensity = blink * 6;
  beaconBulb.material.emissiveIntensity = blink * 3;

  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}

function resize() {
  const w = innerWidth, h = innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
addEventListener('resize', resize);
resize();
setMsg('Mové la garra y bajala');
tick();
