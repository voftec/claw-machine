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
scene.background = new THREE.Color(0x04050d);
scene.fog = new THREE.Fog(0x04050d, 16, 38);

const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
camera.position.set(2.6, 6.8, 18.4);
camera.lookAt(0, 5.3, -0.2);

// ---------- lights ----------
scene.add(new THREE.HemisphereLight(0x3550a0, 0x0d0a20, 0.4)); // relleno tenue frío

const key = new THREE.DirectionalLight(0xbfd6ff, 1.6);   // luz fría de noche
key.position.set(6, 10, 7);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
key.shadow.camera.left = key.shadow.camera.bottom = -9;
key.shadow.camera.right = key.shadow.camera.top = 9;
key.shadow.bias = -0.0004;
scene.add(key);

const marquee = new THREE.PointLight(0xff2fd0, 20, 18, 1.8);   // neón rosa
marquee.position.set(0, 9.9, 4.2);
scene.add(marquee);

const innerGlow = new THREE.PointLight(0x22e6ff, 18, 13, 1.8); // neón cyan interior
innerGlow.position.set(0, 6.2, 0.5);
scene.add(innerGlow);

const fill = new THREE.PointLight(0xff2fd0, 9, 14, 2);          // rebote rosa
fill.position.set(-3, 4.5, 2.5);
scene.add(fill);

// spotlight frío sobre la pila
const spot = new THREE.SpotLight(0xcfe8ff, 55, 20, Math.PI / 5, 0.45, 1.4);
spot.position.set(0, 8.1, 0.8);
spot.target.position.set(0, 3.6, 0);
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

// ---------- cabinet ----------
// estructura tipo foto: cuerpo sólido abajo, cabina de vidrio arriba, corona inclinada
const cabinet = new THREE.Group();
scene.add(cabinet);
const W = 10, D = 7, H = 10;
const BASE_H = 3.4;              // tope del cuerpo sólido = piso de la cabina
const GLASS_TOP = H - 1.6;       // tope del vidrio

function box(w, h, d, mat, x, y, z, rx = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  m.rotation.x = rx;
  m.castShadow = m.receiveShadow = true;
  cabinet.add(m);
  return m;
}

// zócalo + cuerpo inferior sólido negro
box(W + 1.0, 0.5, D + 1.0, M.darkMetal, 0, 0.25, 0);
box(W + 0.5, BASE_H, D + 0.5, M.pink, 0, 0.5 + BASE_H / 2, 0);

// puerta PRIZE OUT en el frente del cuerpo inferior
const pc = document.createElement('canvas'); pc.width = 256; pc.height = 160;
const pcx = pc.getContext('2d');
pcx.fillStyle = '#0a0a14'; pcx.fillRect(0, 0, 256, 160);
pcx.strokeStyle = '#ff2fd0'; pcx.lineWidth = 5; pcx.shadowColor = '#ff2fd0'; pcx.shadowBlur = 16;
pcx.strokeRect(8, 8, 240, 144);
pcx.font = '900 30px system-ui, sans-serif'; pcx.textAlign = 'center';
pcx.shadowColor = '#22e6ff'; pcx.shadowBlur = 14; pcx.fillStyle = '#d8faff';
pcx.fillText('PRIZE OUT', 128, 46);
pcx.shadowBlur = 0; pcx.fillStyle = '#14141f'; pcx.fillRect(28, 70, 200, 62);
pcx.strokeStyle = '#ff2fd0'; pcx.strokeRect(28, 70, 200, 62);
const pcTex = new THREE.CanvasTexture(pc); pcTex.colorSpace = THREE.SRGBColorSpace;
const prizeDoor = new THREE.Mesh(
  new THREE.PlaneGeometry(2.2, 1.4),
  new THREE.MeshStandardMaterial({ map: pcTex, emissive: 0xffffff, emissiveMap: pcTex, emissiveIntensity: 0.9, roughness: 0.4 })
);
prizeDoor.position.set(2.6, 1.5, D / 2 + 0.28); cabinet.add(prizeDoor);

// panel de control inclinado sobre el cuerpo (joystick rosa + botón cyan + pantalla de precio)
const deck = box(3.4, 0.18, 1.5, M.darkMetal, 0, BASE_H + 0.5, D / 2 + 0.9, -0.55);
const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.6, 10), M.chrome);
stick.position.set(-0.8, BASE_H + 1.0, D / 2 + 0.85); stick.rotation.x = -0.5; cabinet.add(stick);
const ball = new THREE.Mesh(new THREE.SphereGeometry(0.17, 16, 12), new THREE.MeshStandardMaterial({ color: 0xff2fb3, roughness: 0.25, emissive: 0x550033, emissiveIntensity: 0.4 }));
ball.position.set(-0.8, BASE_H + 1.28, D / 2 + 1.0); cabinet.add(ball);
const btn = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.19, 0.13, 16), new THREE.MeshStandardMaterial({ color: 0x22e6ff, emissive: 0x22e6ff, emissiveIntensity: 1.4, roughness: 0.3 }));
btn.position.set(0.7, BASE_H + 0.82, D / 2 + 1.0); btn.rotation.x = -0.5; cabinet.add(btn);
// pantalla de precio en la cara del cuerpo
const sc = document.createElement('canvas'); sc.width = 256; sc.height = 96;
const scx = sc.getContext('2d');
scx.fillStyle = '#050510'; scx.fillRect(0, 0, 256, 96);
scx.font = '700 26px monospace'; scx.textAlign = 'center';
scx.shadowColor = '#22e6ff'; scx.shadowBlur = 10; scx.fillStyle = '#aef4ff';
scx.fillText('1 PLAY  $1.00', 128, 38);
scx.shadowColor = '#ff2fd0'; scx.fillStyle = '#ffd8f2';
scx.fillText('2 PLAY  $1.50', 128, 72);
const scTex = new THREE.CanvasTexture(sc); scTex.colorSpace = THREE.SRGBColorSpace;
const screen = new THREE.Mesh(
  new THREE.PlaneGeometry(1.9, 0.72),
  new THREE.MeshStandardMaterial({ map: scTex, emissive: 0xffffff, emissiveMap: scTex, emissiveIntensity: 1.1 })
);
screen.position.set(0, 1.9, D / 2 + 0.27); cabinet.add(screen);

// cabina de vidrio (entre BASE_H y GLASS_TOP)
const GH = GLASS_TOP - BASE_H, GY = BASE_H + GH / 2;
// interior floor
const floor = new THREE.Mesh(new THREE.BoxGeometry(W, 0.18, D), M.floor);
floor.position.y = BASE_H + 0.1; floor.receiveShadow = true;
cabinet.add(floor);
// pared trasera con skyline nocturno
const bc = document.createElement('canvas'); bc.width = 512; bc.height = 256;
const bx = bc.getContext('2d');
const bgrad = bx.createLinearGradient(0, 0, 0, 256);
bgrad.addColorStop(0, '#0b1030'); bgrad.addColorStop(1, '#1a1038');
bx.fillStyle = bgrad; bx.fillRect(0, 0, 512, 256);
bx.fillStyle = '#0a0a18';
let bxX = 0;
while (bxX < 512) {
  const bw = 20 + Math.random() * 55, bh = 60 + Math.random() * 150;
  bx.fillRect(bxX, 256 - bh, bw, bh);
  for (let wy = 256 - bh + 8; wy < 248; wy += 14)
    for (let wx = bxX + 6; wx < bxX + bw - 6; wx += 12)
      if (Math.random() < 0.4) {
        bx.fillStyle = Math.random() < 0.5 ? 'rgba(255,47,208,0.85)' : 'rgba(34,230,255,0.85)';
        bx.fillRect(wx, wy, 4, 6);
        bx.fillStyle = '#0a0a18';
      }
  bxX += bw + 4;
}
const bTex = new THREE.CanvasTexture(bc); bTex.colorSpace = THREE.SRGBColorSpace;
const backWall = new THREE.Mesh(
  new THREE.BoxGeometry(W - 0.9, GH - 0.2, 0.12),
  new THREE.MeshStandardMaterial({ map: bTex, emissive: 0xffffff, emissiveMap: bTex, emissiveIntensity: 0.5, roughness: 0.7 })
);
backWall.position.set(0, GY, -D / 2 - 0.02); backWall.receiveShadow = true; cabinet.add(backWall);

// tubos de neón en todas las aristas de la cabina
for (const s of [-1, 1]) {
  box(0.09, GH, 0.09, M.neonPink, s * (W / 2 - 0.15), GY, D / 2 - 0.15);      // verticales front
  box(0.09, GH, 0.09, M.neon, s * (W / 2 - 0.15), GY, -D / 2 + 0.15);        // verticales back
}
box(W - 0.6, 0.09, 0.09, M.neonPink, 0, GLASS_TOP - 0.1, D / 2 - 0.15);
box(W - 0.6, 0.09, 0.09, M.neon, 0, GLASS_TOP - 0.1, -D / 2 + 0.15);
box(0.09, 0.09, D - 0.6, M.neon, -W / 2 + 0.15, GLASS_TOP - 0.1, 0);
box(0.09, 0.09, D - 0.6, M.neonPink, W / 2 - 0.15, GLASS_TOP - 0.1, 0);
box(W - 0.6, 0.09, 0.09, M.neon, 0, BASE_H + 0.25, D / 2 - 0.15);
box(W - 0.6, 0.09, 0.09, M.neonPink, 0, BASE_H + 0.25, -D / 2 + 0.15);

// marco de la cabina + corona superior inclinada con el cartel
box(W + 0.7, 0.55, D + 0.7, M.pink, 0, GLASS_TOP + 0.3, 0);            // cornisa
box(W + 0.5, 1.7, D + 0.4, M.pink, 0, GLASS_TOP + 1.4, -0.15, -0.16);  // corona
box(W + 0.9, 0.3, D + 0.9, M.darkMetal, 0, GLASS_TOP + 2.35, -0.35);   // remate

// cartel DREAM CATCHER con osito, tipo pantalla neón
const mc = document.createElement('canvas'); mc.width = 512; mc.height = 224;
const mctx = mc.getContext('2d');
mctx.fillStyle = '#05030f'; mctx.fillRect(0, 0, 512, 224);
mctx.strokeStyle = '#ff2fd0'; mctx.lineWidth = 7; mctx.shadowColor = '#ff2fd0'; mctx.shadowBlur = 20;
mctx.strokeRect(10, 10, 492, 204);
// osito de neón a la izquierda
mctx.lineWidth = 5; mctx.shadowColor = '#22e6ff'; mctx.strokeStyle = '#22e6ff';
mctx.beginPath(); mctx.arc(72, 96, 26, 0, Math.PI * 2); mctx.stroke();
mctx.beginPath(); mctx.arc(50, 66, 11, 0, Math.PI * 2); mctx.stroke();
mctx.beginPath(); mctx.arc(94, 66, 11, 0, Math.PI * 2); mctx.stroke();
mctx.beginPath(); mctx.arc(72, 158, 30, Math.PI, Math.PI * 2); mctx.stroke(); // panza arco
mctx.beginPath(); mctx.arc(52, 180, 12, 0, Math.PI * 2); mctx.stroke();
mctx.beginPath(); mctx.arc(92, 180, 12, 0, Math.PI * 2); mctx.stroke();
mctx.font = '900 56px system-ui, sans-serif'; mctx.textAlign = 'center'; mctx.textBaseline = 'middle';
mctx.shadowColor = '#ff2fd0'; mctx.shadowBlur = 24; mctx.fillStyle = '#ffd8f2';
mctx.fillText('DREAM', 310, 78);
mctx.shadowColor = '#22e6ff'; mctx.shadowBlur = 24; mctx.fillStyle = '#d8faff';
mctx.fillText('CATCHER', 310, 148);
const mTex = new THREE.CanvasTexture(mc); mTex.colorSpace = THREE.SRGBColorSpace;
const sign = new THREE.Mesh(
  new THREE.PlaneGeometry(W - 1.2, 1.9),
  new THREE.MeshStandardMaterial({ map: mTex, emissive: 0xffffff, emissiveMap: mTex, emissiveIntensity: 1.05, roughness: 0.4 })
);
sign.position.set(0, GLASS_TOP + 1.42, D / 2 + 0.36); sign.rotation.x = -0.16; cabinet.add(sign);
// neón en el perímetro de la corona
box(W + 0.6, 0.08, 0.08, M.neonPink, 0, GLASS_TOP + 2.2, D / 2 + 0.25);
for (const s of [-1, 1]) box(0.08, 1.7, 0.08, M.neonPink, s * (W / 2 + 0.2), GLASS_TOP + 1.35, D / 2 + 0.22);

// glass panes
const glassFront = new THREE.Mesh(new THREE.BoxGeometry(W - 0.9, GH - 0.2, 0.08), M.glass);
glassFront.position.set(0, GY, D / 2 + 0.02); cabinet.add(glassFront);
for (const s of [-1, 1]) {
  const side = new THREE.Mesh(new THREE.BoxGeometry(0.08, GH - 0.2, D - 0.9), M.glass);
  side.position.set(s * (W / 2 + 0.02), GY, 0); cabinet.add(side);
}
// rails the carriage rides on (X = left/right, Z = fwd/back)
box(W - 0.8, 0.12, 0.3, M.metal, 0, GLASS_TOP - 0.45, -1.2);
box(W - 0.8, 0.12, 0.3, M.metal, 0, GLASS_TOP - 0.45, 1.2);
const crossRail = box(0.3, 0.12, 2.7, M.metal, 0, GLASS_TOP - 0.45, 0); // moves in X
// prize chute inside (bajó al nivel del piso de cabina)
box(1.6, 0.5, 1.6, M.darkMetal, W / 2 - 1.2, BASE_H + 0.35, D / 2 - 1.2);

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
  // mound pile: denser toward center, stacked in loose layers
  const ang = rand(0, Math.PI * 2), rad = Math.pow(Math.random(), 0.6);
  const px = Math.cos(ang) * rad * (W / 2 - 1.1);
  const pz = Math.sin(ang) * rad * (D / 2 - 1.1);
  const py = 3.65 + Math.max(0, (1 - rad)) * rand(0, 0.9) + (i % 3 === 0 ? rand(0.4, 0.8) : 0);
  g.position.set(px, py, pz);
  g.rotation.y = rand(0, Math.PI * 2);
  g.children.forEach(c => { c.castShadow = c.receiveShadow = true; });
  scene.add(g);
  toys.push(g);
}
for (let i = 0; i < 30; i++) makeToy(i);

// ---------- claw assembly ----------
const carriage = new THREE.Group();          // moves XZ
carriage.position.y = GLASS_TOP - 0.45;
scene.add(carriage);
const carBody = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.35, 0.9), M.metal); // partes móviles: otra rugosidad
carBody.castShadow = true; carriage.add(carBody);

const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1, 8), M.cable);
carriage.add(cable);

const clawRoot = new THREE.Group();          // hangs from cable end
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
const HEAD_Y = GLASS_TOP - 0.45;
const FLOOR_Y = BASE_H + 0.75;

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
      prizeEl.classList.add('pop'); setTimeout(() => prizeEl.classList.remove('pop'), 200);
    }
  } else if (state === 'release') {
    if (prongOpen > 0.9 && heldToy) {
      heldToy.position.set(carriage.position.x, BASE_H + 0.9, carriage.position.z);
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
    if (t.position.y < BASE_H + 0.55) t.userData.falling = false;
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
