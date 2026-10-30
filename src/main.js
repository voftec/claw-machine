import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

// ---------- renderer / scene ----------
const canvas = document.getElementById('game');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x141831);
scene.fog = new THREE.Fog(0x141831, 18, 40);

const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
camera.position.set(0, 4.4, 15.2);
camera.lookAt(0, 4.1, -0.4);

// ---------- lights ----------
scene.add(new THREE.HemisphereLight(0x9db8e8, 0x2a1f45, 0.45)); // relleno tenue

const key = new THREE.DirectionalLight(0xffd9a0, 2.4);   // sol cálido de feria
key.position.set(6, 10, 7);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
key.shadow.camera.left = key.shadow.camera.bottom = -9;
key.shadow.camera.right = key.shadow.camera.top = 9;
key.shadow.bias = -0.0004;
scene.add(key);

const marquee = new THREE.PointLight(0xff4fd8, 12, 14, 1.8);
marquee.position.set(0, 5.6, 3.2);
scene.add(marquee);

const innerGlow = new THREE.PointLight(0x66ccff, 10, 12, 1.8);
innerGlow.position.set(0, 4.2, 0.5);
scene.add(innerGlow);

const fill = new THREE.PointLight(0xffd9a0, 8, 12, 2);
fill.position.set(-3, 3, 2.5);
scene.add(fill);

// spotlight onto the toy pile
const spot = new THREE.SpotLight(0xffffff, 60, 20, Math.PI / 5, 0.45, 1.4);
spot.position.set(0, 7.7, 0.8);
spot.target.position.set(0, 1, 0);
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
const woodPink = woodTex('#d4145a');
const woodDark = woodTex('#2a2f3d');

// ---------- materials ----------
const M = {
  metal: new THREE.MeshStandardMaterial({ color: 0x9aa7b8, metalness: 0.9, roughness: 0.28, roughnessMap: brushedRough }),
  darkMetal: new THREE.MeshStandardMaterial({ color: 0x2a2f3d, metalness: 0.75, roughness: 0.4, roughnessMap: brushedRough }),
  pink: new THREE.MeshStandardMaterial({ map: woodPink, metalness: 0.15, roughness: 0.5 }),          // madera pintada
  chrome: new THREE.MeshStandardMaterial({ color: 0xf0f0f0, metalness: 1, roughness: 0.12, roughnessMap: brushedRough }),
  glass: new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: 0, roughness: 0.05, transmission: 1, thickness: 0.25, transparent: true, opacity: 0.22 }),
  floor: new THREE.MeshStandardMaterial({ color: 0x120e2c, roughness: 0.22, metalness: 0.4 }),
  back: new THREE.MeshStandardMaterial({ map: woodDark, color: 0x9a8fd0, roughness: 0.6, metalness: 0.3, emissive: 0x0c0624, emissiveIntensity: 0.7 }),
  neon: new THREE.MeshStandardMaterial({ color: 0x30f6ff, emissive: 0x30f6ff, emissiveIntensity: 2.4 }),
  cable: new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.85, metalness: 0.1 }),       // goma/cable
  claw: new THREE.MeshStandardMaterial({ color: 0xd8dee9, metalness: 0.95, roughness: 0.18, map: brushed, roughnessMap: brushedRough }), // metal cepillado
  rubber: new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 0.95, metalness: 0 }),        // ventosas de goma
};

// ---------- cabinet ----------
const cabinet = new THREE.Group();
scene.add(cabinet);
const W = 10, D = 7, H = 8;

function box(w, h, d, mat, x, y, z) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  m.castShadow = m.receiveShadow = true;
  cabinet.add(m);
  return m;
}

// frame posts + base + roof
for (const sx of [-1, 1]) for (const sz of [-1, 1])
  box(0.45, H, 0.45, M.pink, sx * W / 2, H / 2, sz * D / 2);
box(W + 0.6, 0.7, D + 0.6, M.darkMetal, 0, 0.35, 0);          // base
box(W + 0.6, 0.9, D + 0.6, M.pink, 0, H + 0.2, 0);           // roof

// marquee sign: canvas texture with glowing CLAW text + bulbs
const mc = document.createElement('canvas'); mc.width = 512; mc.height = 160;
const mctx = mc.getContext('2d');
const grad = mctx.createLinearGradient(0, 0, 0, 160);
grad.addColorStop(0, '#2b0f4f'); grad.addColorStop(1, '#12082a');
mctx.fillStyle = grad; mctx.fillRect(0, 0, 512, 160);
mctx.font = '900 92px system-ui, sans-serif';
mctx.textAlign = 'center'; mctx.textBaseline = 'middle';
mctx.shadowColor = '#ff2d96'; mctx.shadowBlur = 30;
mctx.fillStyle = '#ffd4ec';
mctx.fillText('★ CLAW ★', 256, 84);
const mTex = new THREE.CanvasTexture(mc);
mTex.colorSpace = THREE.SRGBColorSpace;
const sign = new THREE.Mesh(
  new THREE.PlaneGeometry(W - 1, 1.0),
  new THREE.MeshStandardMaterial({ map: mTex, emissive: 0xffffff, emissiveMap: mTex, emissiveIntensity: 1.0, roughness: 0.4 })
);
sign.position.set(0, H + 0.2, D / 2 + 0.32); cabinet.add(sign);
// bulbs along the sign
const bulbGeo = new THREE.SphereGeometry(0.09, 10, 8);
const bulbMat = new THREE.MeshStandardMaterial({ color: 0xfff3b0, emissive: 0xffc63f, emissiveIntensity: 3 });
for (let i = 0; i <= 12; i++) {
  const b = new THREE.Mesh(bulbGeo, bulbMat);
  b.position.set(-W / 2 + 0.5 + i * (W - 1) / 12, H + 0.85, D / 2 + 0.35);
  cabinet.add(b);
}
box(W + 0.7, 0.35, D + 0.7, M.darkMetal, 0, H + 0.85, 0);    // top cap

// control panel with joystick + button
box(2.4, 0.6, 0.9, M.darkMetal, 0, 0.95, D / 2 + 0.4);
const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.5, 10), M.chrome);
stick.position.set(-0.6, 1.45, D / 2 + 0.4); cabinet.add(stick);
const ball = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 12), new THREE.MeshStandardMaterial({ color: 0xff2244, roughness: 0.3 }));
ball.position.set(-0.6, 1.72, D / 2 + 0.4); cabinet.add(ball);
const btn = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.12, 16), new THREE.MeshStandardMaterial({ color: 0x30f6ff, emissive: 0x30f6ff, emissiveIntensity: 1.2, roughness: 0.3 }));
btn.position.set(0.6, 1.3, D / 2 + 0.4); cabinet.add(btn);
// interior floor
const floor = new THREE.Mesh(new THREE.BoxGeometry(W, 0.15, D), M.floor);
floor.position.y = 0.78; floor.receiveShadow = true;
cabinet.add(floor);
// back wall + neon strips
box(W - 0.9, H - 1.4, 0.12, M.back, 0, H / 2 + 0.15, -D / 2 - 0.02);
for (const s of [-1, 1])
  box(0.08, H - 1.6, 0.08, M.neon, s * (W / 2 - 0.28), H / 2 + 0.15, D / 2 - 0.28);
box(W - 1, 0.08, 0.08, M.neon, 0, H - 0.75, D / 2 - 0.28);
// glass panes
const glassFront = new THREE.Mesh(new THREE.BoxGeometry(W - 0.9, H - 1.4, 0.08), M.glass);
glassFront.position.set(0, H / 2 + 0.15, D / 2 + 0.02); cabinet.add(glassFront);
for (const s of [-1, 1]) {
  const side = new THREE.Mesh(new THREE.BoxGeometry(0.08, H - 1.4, D - 0.9), M.glass);
  side.position.set(s * (W / 2 + 0.02), H / 2 + 0.15, 0); cabinet.add(side);
}
// rails the carriage rides on (X = left/right, Z = fwd/back)
box(W - 0.8, 0.12, 0.3, M.metal, 0, H - 0.55, -1.2);
box(W - 0.8, 0.12, 0.3, M.metal, 0, H - 0.55, 1.2);
const crossRail = box(0.3, 0.12, 2.7, M.metal, 0, H - 0.55, 0); // moves in X
// prize chute
box(1.6, 0.5, 1.6, M.darkMetal, W / 2 - 1.2, 1.0, D / 2 - 1.2);

// ---------- toys ----------
const toys = [];
const toyColors = [0xff3b3b, 0xff9500, 0x00c2ff, 0x2ee66b, 0x9b30ff, 0xff5e3a, 0x3d7bff, 0xff2fb3, 0xffe23f, 0x00e0b8];
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
  // mound pile: denser toward center, stacked in loose layers
  const ang = rand(0, Math.PI * 2), rad = Math.pow(Math.random(), 0.6);
  const px = Math.cos(ang) * rad * (W / 2 - 1.1);
  const pz = Math.sin(ang) * rad * (D / 2 - 1.1);
  const py = 1.1 + Math.max(0, (1 - rad)) * rand(0, 0.9) + (i % 3 === 0 ? rand(0.4, 0.8) : 0);
  g.position.set(px, py, pz);
  g.rotation.y = rand(0, Math.PI * 2);
  g.children.forEach(c => { c.castShadow = c.receiveShadow = true; });
  scene.add(g);
  toys.push(g);
}
for (let i = 0; i < 30; i++) makeToy(i);

// ---------- claw assembly ----------
const carriage = new THREE.Group();          // moves XZ
carriage.position.y = H - 0.55;
scene.add(carriage);
const carBody = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.35, 0.9), M.metal); // partes móviles: otra rugosidad
carBody.castShadow = true; carriage.add(carBody);

const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1, 8), M.cable);
carriage.add(cable);

const clawRoot = new THREE.Group();          // hangs from cable end
carriage.add(clawRoot);
const head = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.34, 0.3, 20), M.claw);
head.castShadow = true; clawRoot.add(head);

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
  const upper = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.55, 8), M.claw);
  upper.position.y = -0.32; prong.add(upper);
  const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.015, 0.45, 8), M.claw);
  tip.position.set(0.1, -0.75, 0); tip.rotation.z = -0.5; prong.add(tip);
  const pad = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), M.rubber); // ventosa de goma
  pad.position.set(0.2, -0.95, 0); prong.add(pad);
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
const HEAD_Y = H - 0.55;
const FLOOR_Y = 1.15;

let prongOpen = 0.55;      // 0 closed .. 1 open (applied angle base)
let prongTarget = 0.55;

// ---------- state machine ----------
const MOVE = { minX: -W / 2 + 0.8, maxX: W / 2 - 0.8, minZ: -D / 2 + 0.8, maxZ: D / 2 - 0.8 };
const SPEED = 4.2;
let state = 'idle';        // idle | drop | grab | lift | carry | release | return
let heldToy = null;
let prizes = 0;
const msg = document.getElementById('msg');
const prizeEl = document.getElementById('prizes');

function setMsg(t) { msg.textContent = t; }

function drop() {
  if (state !== 'idle') return;
  state = 'drop';
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
    const tx = W / 2 - 1.2, tz = D / 2 - 1.2;
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
    }
  } else if (state === 'release') {
    if (prongOpen > 0.9 && heldToy) {
      heldToy.position.set(carriage.position.x, 0.4, carriage.position.z);
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
    if (t.position.y < 0.3) t.userData.falling = false;
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
