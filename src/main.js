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

const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
camera.position.set(0, 4.6, 11.5);
camera.lookAt(0, 2.4, 0);

// ---------- lights ----------
scene.add(new THREE.HemisphereLight(0xbcd4ff, 0x3a2a55, 0.9));

const key = new THREE.DirectionalLight(0xfff2dd, 2.2);
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

const innerGlow = new THREE.PointLight(0x66ccff, 14, 12, 1.8);
innerGlow.position.set(0, 4.2, 0.5);
scene.add(innerGlow);

const fill = new THREE.PointLight(0xffd9a0, 10, 12, 2);
fill.position.set(-3, 3, 2.5);
scene.add(fill);

// ---------- materials ----------
const M = {
  metal: new THREE.MeshStandardMaterial({ color: 0x9aa7b8, metalness: 0.9, roughness: 0.28 }),
  darkMetal: new THREE.MeshStandardMaterial({ color: 0x2a2f3d, metalness: 0.75, roughness: 0.4 }),
  pink: new THREE.MeshStandardMaterial({ color: 0xff2d78, metalness: 0.15, roughness: 0.35 }),
  glass: new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: 0, roughness: 0.05, transmission: 1, thickness: 0.25, transparent: true, opacity: 0.22 }),
  floor: new THREE.MeshStandardMaterial({ color: 0x342a5e, roughness: 0.55, metalness: 0.2 }),
  back: new THREE.MeshStandardMaterial({ color: 0x3d2b6e, roughness: 0.7, emissive: 0x1a0f38, emissiveIntensity: 0.8 }),
  neon: new THREE.MeshStandardMaterial({ color: 0x30f6ff, emissive: 0x30f6ff, emissiveIntensity: 2.4 }),
  cable: new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.5 }),
  claw: new THREE.MeshStandardMaterial({ color: 0xd8dee9, metalness: 0.95, roughness: 0.18 }),
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
box(W + 0.7, 0.35, D + 0.7, M.darkMetal, 0, H + 0.75, 0);    // marquee base
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
const toyColors = [0xff5252, 0xffb142, 0x34ace0, 0x2ed573, 0xa55eea, 0xff7f50, 0x70a1ff, 0xf368e0];
const rand = (a, b) => a + Math.random() * (b - a);

function makeToy(i) {
  const g = new THREE.Group();
  const color = toyColors[i % toyColors.length];
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.7, metalness: 0.05 });
  const kind = i % 3;
  if (kind === 0) { // ball
    const r = rand(0.28, 0.42);
    g.add(new THREE.Mesh(new THREE.SphereGeometry(r, 24, 18), mat));
    g.userData.grabR = r; g.userData.weight = r;
  } else if (kind === 1) { // plush blob: body + ears
    const r = rand(0.26, 0.36);
    const body = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 18), mat);
    body.scale.y = 1.15; g.add(body);
    const earGeo = new THREE.SphereGeometry(r * 0.35, 12, 10);
    for (const s of [-1, 1]) {
      const ear = new THREE.Mesh(earGeo, mat);
      ear.position.set(s * r * 0.55, r * 0.95, 0); g.add(ear);
    }
    g.userData.grabR = r; g.userData.weight = r * 1.3;
  } else { // cube-y prize
    const s = rand(0.4, 0.55);
    const m = new THREE.Mesh(new THREE.BoxGeometry(s, s, s), mat);
    m.rotation.y = rand(0, Math.PI); g.add(m);
    g.userData.grabR = s * 0.6; g.userData.weight = s * 0.8;
  }
  const layer = i % 2 ? 0.55 : 0;
  g.position.set(rand(-W / 2 + 0.9, W / 2 - 0.9), 1.05 + layer, rand(-D / 2 + 0.9, D / 2 - 0.9));
  g.children.forEach(c => { c.castShadow = c.receiveShadow = true; });
  scene.add(g);
  toys.push(g);
}
for (let i = 0; i < 18; i++) makeToy(i);

// ---------- claw assembly ----------
const carriage = new THREE.Group();          // moves XZ
carriage.position.y = H - 0.55;
scene.add(carriage);
const carBody = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.35, 0.9), M.darkMetal);
carBody.castShadow = true; carriage.add(carBody);

const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1, 8), M.cable);
carriage.add(cable);

const clawRoot = new THREE.Group();          // hangs from cable end
carriage.add(clawRoot);
const head = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.34, 0.3, 20), M.claw);
head.castShadow = true; clawRoot.add(head);

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
  prong.position.x = 0.26;
  prong.children.forEach(c => c.castShadow = true);
  prongs.push(prong);
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
    spring.target = HEAD_Y - FLOOR_Y; // reach floor
    if (clawWorldY <= FLOOR_Y + 0.08 && Math.abs(spring.vel) < 0.6) {
      state = 'grab'; grabTimer = 0; prongTarget = 0; setMsg('¡Cerrando!');
    }
  } else if (state === 'grab') {
    grabTimer += dt;
    if (grabTimer > 0.9) {
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
