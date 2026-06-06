import * as THREE from "../vendor/three.module.js";

const canvas = document.querySelector("#space-canvas");
const backButton = document.querySelector("#back-button");
const backIcon = document.querySelector("#back-icon");
const mainScroll = document.querySelector("#main-scroll");
const detailScroll = document.querySelector("#detail-scroll");
const detailTitle = document.querySelector("#detail-title");
const detailText = document.querySelector("#detail-text");
const detailStats = document.querySelector("#detail-stats");

backIcon.innerHTML = `
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="m12 19-7-7 7-7" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M19 12H5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
`;

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x02030a, 0.018);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 900);
camera.position.set(2, 7, 34);

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const clock = new THREE.Clock();
const activePointer = { x: 0, y: 0 };
const textureLoader = new THREE.TextureLoader();
const textureCache = new Map();

const PLANETS = {
  sun: {
    name: "Sun",
    radius: 1.65,
    color: "#ffb84d",
    accent: "#fff0a8",
    texture: "../assets/textures/sun.jpg",
    position: [-10.2, 0, 0],
    orbit: 0,
    spin: 0.42,
    star: true,
    sectionCamera: [-8.6, 1.25, 6.9],
    detailCamera: [-11.4, 0.28, 2.65],
    copy: "The Sun is not a solid world but a turbulent star. Up close, its surface becomes a living ocean of plasma, granulation, magnetic loops, and bright active regions.",
    stats: [
      ["Diameter", "1.39M km"],
      ["Surface", "Plasma"],
      ["Core Fusion", "Hydrogen"],
      ["Light to Earth", "8m 20s"]
    ],
    surface: { type: "plasma", sky: 0xff7a20, haze: 0xffbd55, height: 0.42 }
  },
  mercury: {
    name: "Mercury",
    radius: 0.42,
    color: "#b9a58a",
    accent: "#f1d09b",
    texture: "../assets/textures/mercury.jpg",
    position: [-6.6, 0, 1.2],
    orbit: 3.4,
    spin: 1.2,
    sectionCamera: [-4.8, 1.2, 6.2],
    detailCamera: [-6.95, 0.38, 2.05],
    copy: "Mercury is a scarred, airless world of fierce temperature swings. In close view, its cratered surface tells the story of early impacts that shaped the inner Solar System.",
    stats: [
      ["Distance from Sun", "57.9M km"],
      ["Orbital Speed", "47.4 km/s"],
      ["Atmosphere", "Trace exosphere"],
      ["Temperature", "-180 to 430 C"]
    ],
    surface: { type: "rock", sky: 0x07080b, haze: 0xb4aa99, height: 0.26 }
  },
  venus: {
    name: "Venus",
    radius: 0.74,
    color: "#d8ad6b",
    accent: "#fff0b3",
    texture: "../assets/textures/venus.jpg",
    position: [-4.25, 0, -0.4],
    orbit: 4.8,
    spin: -0.32,
    sectionCamera: [-3.25, 1.15, 5.4],
    detailCamera: [-4.95, 0.5, 1.9],
    copy: "Venus looks smooth from space, but beneath the cloud deck is a radar-mapped world of volcanic plains, ridges, impact scars, and crushing amber haze.",
    stats: [
      ["Atmosphere", "96% CO2"],
      ["Surface Pressure", "92x Earth"],
      ["Surface Temp", "465 C"],
      ["Day", "243 Earth days"]
    ],
    surface: { type: "rock", sky: 0xff9f2e, haze: 0xffc05f, height: 0.34 }
  },
  earth: {
    name: "Earth",
    radius: 0.78,
    color: "#2f8fe8",
    accent: "#91f1d7",
    texture: "../assets/textures/earth.jpg",
    clouds: true,
    position: [-1.75, 0, 0.65],
    orbit: 6.3,
    spin: 0.9,
    sectionCamera: [-0.4, 1.15, 5.6],
    detailCamera: [-2.45, 0.52, 1.9],
    copy: "Earth's colors change as ocean, cloud, ice, and continent roll through sunlight. The planet's motion reveals why a living atmosphere makes the blue world feel so alive.",
    stats: [
      ["Average Distance", "149.6M km"],
      ["Atmosphere", "Nitrogen + oxygen"],
      ["Magnetic Field", "Active dynamo"],
      ["Surface", "Ocean and land"]
    ],
    surface: { type: "earth", sky: 0x5ea4ff, haze: 0x91f1d7, height: 0.3 }
  },
  mars: {
    name: "Mars",
    radius: 0.58,
    color: "#cf6042",
    accent: "#ffc59a",
    texture: "../assets/textures/mars.jpg",
    position: [0.95, 0, -0.7],
    orbit: 8,
    spin: 0.85,
    sectionCamera: [2.2, 1.2, 5.6],
    detailCamera: [0.35, 0.45, 0.92],
    copy: "Mars wears its geology in red dust, dark basalt, volcanoes, and canyon shadows. Slow scrolling lets its tilted deserts and polar frost rotate into view.",
    stats: [
      ["Average Distance", "227.9M km"],
      ["Largest Volcano", "Olympus Mons"],
      ["Day", "24h 37m"],
      ["Exploration", "Orbiters and rovers"]
    ],
    surface: { type: "rock", sky: 0xd98a5c, haze: 0xffb280, height: 0.38 }
  },
  jupiter: {
    name: "Jupiter",
    radius: 1.72,
    color: "#d7b28d",
    accent: "#fff2d1",
    texture: "../assets/textures/jupiter.jpg",
    position: [4.45, 0, 0.3],
    orbit: 10.8,
    spin: 1.65,
    sectionCamera: [4.85, 1.55, 7.3],
    detailCamera: [3.0, 0.85, 3.2],
    copy: "Jupiter has no solid surface to stand on. Scrolling inward drops through bright cloud belts, rust-colored turbulence, and storm systems that churn at enormous scale.",
    stats: [
      ["Diameter", "139,820 km"],
      ["Great Red Spot", "Giant storm"],
      ["Day", "9h 56m"],
      ["Moons", "95+"]
    ],
    surface: { type: "gas", sky: 0xd39a62, haze: 0xffd18b, height: 0.18 }
  },
  saturn: {
    name: "Saturn",
    radius: 1.35,
    color: "#d8bd82",
    accent: "#ffe2a0",
    texture: "../assets/textures/saturn.jpg",
    position: [8.25, 0, -0.25],
    orbit: 13.6,
    spin: 1.35,
    ring: true,
    sectionCamera: [8.6, 1.55, 6.8],
    detailCamera: [6.35, 0.85, 3.15],
    copy: "Saturn's pale bands and broad ring plane turn the planet into a moving instrument. From close range, the rings read as a luminous disk of ice and shadow.",
    stats: [
      ["Average Distance", "1.43B km"],
      ["Ring Span", "~282,000 km"],
      ["Composition", "Hydrogen + helium"],
      ["Density", "Less than water"]
    ],
    surface: { type: "gas", sky: 0xd8bd82, haze: 0xffe2a0, height: 0.16 }
  },
  uranus: {
    name: "Uranus",
    radius: 0.96,
    color: "#8dd7d9",
    accent: "#c6ffff",
    texture: "../assets/textures/uranus.jpg",
    position: [11.35, 0, 0.95],
    orbit: 16,
    spin: 0.7,
    sectionCamera: [11.35, 1.15, 5.9],
    detailCamera: [10.35, 0.58, 2.35],
    copy: "Uranus is a quiet-looking ice giant, but the close descent becomes a cold methane haze with soft bands, pale blue light, and a strange sideways world below.",
    stats: [
      ["Axial Tilt", "98 degrees"],
      ["Atmosphere", "H2, He, methane"],
      ["Temperature", "-224 C"],
      ["Moons", "27 known"]
    ],
    surface: { type: "gas", sky: 0x80d8dc, haze: 0xbffcff, height: 0.12 }
  },
  neptune: {
    name: "Neptune",
    radius: 0.92,
    color: "#3d74ff",
    accent: "#93b6ff",
    texture: "../assets/textures/neptune.jpg",
    position: [14.15, 0, -0.55],
    orbit: 18.2,
    spin: 0.95,
    sectionCamera: [14.05, 1.15, 5.8],
    detailCamera: [13.15, 0.55, 1.85],
    copy: "Neptune's blue face resolves into deep atmospheric streaks and dark storm bands. The descent becomes a fast-moving cloudscape in a distant, cold twilight.",
    stats: [
      ["Average Distance", "4.5B km"],
      ["Wind Speed", "2,000 km/h"],
      ["Atmosphere", "Methane blue"],
      ["Moons", "14 known"]
    ],
    surface: { type: "gas", sky: 0x234dff, haze: 0x8fb4ff, height: 0.18 }
  }
};

const allPlanets = Object.keys(PLANETS);
const explorePlanets = allPlanets;
const planetMeshes = new Map();
const planetGroups = new Map();
const clickableMeshes = [];
const contextObjects = [];
let surfaceWorld = null;
let mode = "main";
let selectedPlanet = null;
let zoomAnimation = null;
let cameraTarget = new THREE.Vector3(2, 7, 34);
let cameraLook = new THREE.Vector3(1.8, -0.25, 0);
let hoverMesh = null;

scene.add(new THREE.AmbientLight(0x9ab7ff, 0.18));

const sunLight = new THREE.PointLight(0xffe3a3, 6.2, 80, 1.2);
sunLight.position.set(-10, 2.2, 2);
scene.add(sunLight);

const rimLight = new THREE.DirectionalLight(0x7cf4ff, 1.2);
rimLight.position.set(8, 8, 6);
scene.add(rimLight);

createStarfield();
createNebulaDust();
createSolarSystem();
addHint();

window.addEventListener("resize", onResize);
window.addEventListener("pointermove", onPointerMove);
window.addEventListener("click", onCanvasClick);
backButton.addEventListener("click", returnToMain);

requestAnimationFrame(animate);

function createSolarSystem() {
  allPlanets.forEach((key) => {
    const data = PLANETS[key];
    const group = new THREE.Group();
    group.position.set(...data.position);
    group.userData.key = key;
    scene.add(group);

    const material = data.star
      ? new THREE.MeshBasicMaterial({
          map: loadTexture(data.texture),
          color: 0xfff0b8
        })
      : new THREE.MeshStandardMaterial({
          map: loadTexture(data.texture),
          color: 0xffffff,
          roughness: data.surface?.type === "gas" ? 0.62 : 0.86,
          metalness: 0.01,
          emissive: new THREE.Color(data.color).multiplyScalar(data.surface?.type === "gas" ? 0.035 : 0.012)
        });
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(data.radius, 128, 128), material);
    mesh.userData.key = key;
    mesh.userData.clickable = explorePlanets.includes(key);
    group.add(mesh);

    if (data.star) {
      const glow = new THREE.Mesh(
        new THREE.SphereGeometry(data.radius * 1.38, 96, 96),
        new THREE.MeshBasicMaterial({
          color: 0xff9f2f,
          transparent: true,
          opacity: 0.2,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        })
      );
      glow.userData.glow = true;
      group.add(glow);
    }

    if (data.clouds) {
      const clouds = new THREE.Mesh(
        new THREE.SphereGeometry(data.radius * 1.015, 96, 96),
        new THREE.MeshStandardMaterial({
          map: makeCloudTexture(),
          transparent: true,
          opacity: 0.36,
          roughness: 0.9,
          depthWrite: false
        })
      );
      clouds.userData.clouds = true;
      group.add(clouds);
    }

    if (data.ring) {
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(data.radius * 1.45, data.radius * 2.36, 160),
        new THREE.MeshStandardMaterial({
          map: makeRingTexture(),
          color: 0xffe7ad,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.74,
          roughness: 0.62
        })
      );
      ring.rotation.x = Math.PI * 0.58;
      ring.rotation.z = -0.18;
      group.add(ring);
    }

    if (data.orbit > 0) {
      const orbit = makeOrbit(data.orbit);
      scene.add(orbit);
      contextObjects.push(orbit);
    }

    planetGroups.set(key, group);
    planetMeshes.set(key, mesh);
    if (mesh.userData.clickable) clickableMeshes.push(mesh);
  });
}

function makeOrbit(radius) {
  const points = [];
  for (let i = 0; i <= 240; i += 1) {
    const angle = (i / 240) * Math.PI * 2;
    points.push(new THREE.Vector3(-10.2 + Math.cos(angle) * radius, -0.05, Math.sin(angle) * radius * 0.18));
  }
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({
    color: 0xb7d0ff,
    transparent: true,
    opacity: 0.16
  });
  return new THREE.Line(geometry, material);
}

function loadTexture(path) {
  if (textureCache.has(path)) return textureCache.get(path);
  const texture = textureLoader.load(path);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  textureCache.set(path, texture);
  return texture;
}

function createStarfield() {
  const count = 9000;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const color = new THREE.Color();

  for (let i = 0; i < count; i += 1) {
    const radius = 80 + Math.random() * 260;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(THREE.MathUtils.randFloatSpread(2));
    positions[i * 3] = Math.sin(phi) * Math.cos(theta) * radius;
    positions[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * radius * 0.6;
    positions[i * 3 + 2] = Math.cos(phi) * radius - 60;

    color.setHSL(THREE.MathUtils.randFloat(0.55, 0.13), 0.42, THREE.MathUtils.randFloat(0.72, 1));
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  const stars = new THREE.Points(
    geometry,
    new THREE.PointsMaterial({
      size: 1.15,
      vertexColors: true,
      transparent: true,
      opacity: 0.88,
      sizeAttenuation: false,
      fog: false
    })
  );
  scene.add(stars);
}

function createNebulaDust() {
  const group = new THREE.Group();
  const colors = [0x6fe7ff, 0xffb455, 0xc49cff];

  colors.forEach((color, index) => {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(18 + index * 8, 48, 48),
      new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.025,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.BackSide
      })
    );
    mesh.position.set(index * 16 - 8, index * 4 - 4, -38 - index * 16);
    mesh.scale.set(1.6, 0.52, 0.8);
    group.add(mesh);
  });

  scene.add(group);
}

function makePlanetTexture(key, data) {
  const size = 1024;
  const canvasTexture = document.createElement("canvas");
  canvasTexture.width = size;
  canvasTexture.height = size / 2;
  const ctx = canvasTexture.getContext("2d");
  const base = new THREE.Color(data.color);
  const accent = new THREE.Color(data.accent);

  ctx.fillStyle = data.color;
  ctx.fillRect(0, 0, canvasTexture.width, canvasTexture.height);

  if (["earth", "mars", "mercury"].includes(key)) {
    drawRockyTexture(ctx, canvasTexture, base, accent, key);
  } else if (key === "saturn" || key === "jupiter") {
    drawGasBands(ctx, canvasTexture, base, accent, key);
  } else {
    drawIceBands(ctx, canvasTexture, base, accent);
  }

  const texture = new THREE.CanvasTexture(canvasTexture);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.anisotropy = 8;
  return texture;
}

function drawRockyTexture(ctx, textureCanvas, base, accent, key) {
  const w = textureCanvas.width;
  const h = textureCanvas.height;
  const rng = seeded(key);

  if (key === "mercury") {
    const mercury = ctx.createLinearGradient(0, 0, w, h);
    mercury.addColorStop(0, "#7c766d");
    mercury.addColorStop(0.45, "#b4aa99");
    mercury.addColorStop(1, "#5d5850");
    ctx.fillStyle = mercury;
    ctx.fillRect(0, 0, w, h);

    for (let i = 0; i < 150; i += 1) {
      const x = rng() * w;
      const y = rng() * h;
      const radius = 3 + rng() * 24;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 241, 209, ${0.04 + rng() * 0.11})`;
      ctx.fill();
      ctx.strokeStyle = `rgba(28, 25, 22, ${0.08 + rng() * 0.18})`;
      ctx.lineWidth = 1 + rng() * 2;
      ctx.stroke();
    }
    return;
  }

  if (key === "earth") {
    const ocean = ctx.createLinearGradient(0, 0, 0, h);
    ocean.addColorStop(0, "#1d63b9");
    ocean.addColorStop(0.5, "#2c9cd8");
    ocean.addColorStop(1, "#143b89");
    ctx.fillStyle = ocean;
    ctx.fillRect(0, 0, w, h);

    for (let i = 0; i < 18; i += 1) {
      const x = rng() * w;
      const y = rng() * h;
      const rx = 80 + rng() * 190;
      const ry = 26 + rng() * 74;
      ctx.fillStyle = i % 2 ? "#4d9d72" : "#b8a36b";
      blob(ctx, x, y, rx, ry, 18, rng);
    }
    return;
  }

  for (let i = 0; i < 46; i += 1) {
    const shade = base.clone().lerp(accent, rng() * 0.65).offsetHSL(0, 0, rng() * 0.16 - 0.08);
    ctx.fillStyle = `#${shade.getHexString()}`;
    blob(ctx, rng() * w, rng() * h, 16 + rng() * 95, 10 + rng() * 46, 12, rng);
  }

  for (let i = 0; i < 90; i += 1) {
    ctx.beginPath();
    ctx.arc(rng() * w, rng() * h, 1 + rng() * (key === "mercury" ? 11 : 5), 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 238, 201, ${0.05 + rng() * 0.22})`;
    ctx.fill();
  }
}

function drawGasBands(ctx, textureCanvas, base, accent, key) {
  const w = textureCanvas.width;
  const h = textureCanvas.height;
  const rng = seeded(key);

  for (let y = 0; y < h; y += 8) {
    const t = y / h;
    const wave = Math.sin(t * Math.PI * (key === "jupiter" ? 16 : 10)) * 0.16;
    const shade = base.clone().lerp(accent, 0.2 + wave + rng() * 0.25);
    ctx.fillStyle = `#${shade.getHexString()}`;
    ctx.fillRect(0, y, w, 9 + rng() * 12);
  }

  if (key === "jupiter") {
    ctx.fillStyle = "rgba(184, 78, 52, 0.66)";
    blob(ctx, w * 0.67, h * 0.56, 105, 36, 24, rng);
  }
}

function drawIceBands(ctx, textureCanvas, base, accent) {
  const w = textureCanvas.width;
  const h = textureCanvas.height;
  for (let y = 0; y < h; y += 10) {
    const t = y / h;
    const shade = base.clone().lerp(accent, 0.18 + Math.sin(t * Math.PI * 6) * 0.12);
    ctx.fillStyle = `#${shade.getHexString()}`;
    ctx.fillRect(0, y, w, 12);
  }
}

function makeCloudTexture() {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 512;
  const ctx = c.getContext("2d");
  const rng = seeded("clouds");
  ctx.clearRect(0, 0, c.width, c.height);
  for (let i = 0; i < 58; i += 1) {
    ctx.fillStyle = `rgba(255, 255, 255, ${0.16 + rng() * 0.28})`;
    blob(ctx, rng() * c.width, rng() * c.height, 60 + rng() * 190, 10 + rng() * 32, 14, rng);
  }
  const texture = new THREE.CanvasTexture(c);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  return texture;
}

function makeRingTexture() {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 32;
  const ctx = c.getContext("2d");
  const gradient = ctx.createLinearGradient(0, 0, c.width, 0);
  gradient.addColorStop(0, "rgba(255,255,255,0)");
  gradient.addColorStop(0.08, "rgba(255,236,191,0.25)");
  gradient.addColorStop(0.24, "rgba(255,246,220,0.86)");
  gradient.addColorStop(0.48, "rgba(126,101,76,0.3)");
  gradient.addColorStop(0.62, "rgba(255,225,161,0.85)");
  gradient.addColorStop(0.92, "rgba(255,238,207,0.22)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, c.width, c.height);
  const texture = new THREE.CanvasTexture(c);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function makeSunTexture() {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 256;
  const ctx = c.getContext("2d");
  const rng = seeded("sun");
  const gradient = ctx.createLinearGradient(0, 0, 0, c.height);
  gradient.addColorStop(0, "#ffe28a");
  gradient.addColorStop(0.5, "#ff9e36");
  gradient.addColorStop(1, "#ffcf68");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, c.width, c.height);
  for (let i = 0; i < 90; i += 1) {
    ctx.strokeStyle = `rgba(255,255,210,${0.04 + rng() * 0.12})`;
    ctx.lineWidth = 1 + rng() * 5;
    ctx.beginPath();
    ctx.moveTo(0, rng() * c.height);
    ctx.bezierCurveTo(c.width * 0.3, rng() * c.height, c.width * 0.65, rng() * c.height, c.width, rng() * c.height);
    ctx.stroke();
  }
  const texture = new THREE.CanvasTexture(c);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  return texture;
}

function blob(ctx, x, y, rx, ry, points, rng) {
  ctx.beginPath();
  for (let i = 0; i <= points; i += 1) {
    const angle = (i / points) * Math.PI * 2;
    const wobble = 0.68 + rng() * 0.62;
    const px = x + Math.cos(angle) * rx * wobble;
    const py = y + Math.sin(angle) * ry * wobble;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
}

function seeded(seed) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return () => {
    h += h << 13;
    h ^= h >>> 7;
    h += h << 3;
    h ^= h >>> 17;
    h += h << 5;
    return ((h >>> 0) % 10000) / 10000;
  };
}

function onPointerMove(event) {
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
  activePointer.x = pointer.x;
  activePointer.y = pointer.y;
}

function onCanvasClick(event) {
  if (mode !== "main") return;
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(clickableMeshes, false);
  if (hits.length) enterDetail(hits[0].object.userData.key);
}

function enterDetail(key) {
  const data = PLANETS[key];
  const group = planetGroups.get(key);
  const currentCamera = camera.position.clone();
  const currentLook = cameraLook.clone();
  buildSurfaceWorld(key);
  setSurfaceOpacity(0);
  setBodyOpacity(key, 1);
  selectedPlanet = key;
  mode = "detail";
  document.body.classList.add("is-detail");
  detailTitle.textContent = data.name;
  detailText.textContent = data.copy;
  detailStats.innerHTML = `<dl>${data.stats
    .map(([label, value]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`)
    .join("")}</dl>`;

  detailScroll.scrollTop = 0;
  window.scrollTo({ top: 0, behavior: "instant" });

  const targetPosition = new THREE.Vector3(...data.detailCamera);
  const targetLook = group.position.clone();
  zoomAnimation = {
    start: performance.now(),
    duration: 1350,
    fromPosition: currentCamera,
    toPosition: targetPosition,
    fromLook: currentLook,
    toLook: targetLook,
    onComplete: () => setDetailIsolation(key, true)
  };
}

function returnToMain() {
  const key = selectedPlanet || "earth";
  const data = PLANETS[key];
  const fromPosition = camera.position.clone();
  const fromLook = cameraLook.clone();
  mode = "main";
  selectedPlanet = null;
  setDetailIsolation(key, false);
  setSurfaceOpacity(0);
  document.body.classList.remove("is-detail");
  const section = document.querySelector(`[data-planet="${key}"]`);
  if (section) section.scrollIntoView({ behavior: "instant", block: "center" });
  zoomAnimation = {
    start: performance.now(),
    duration: 850,
    fromPosition,
    toPosition: new THREE.Vector3(...data.sectionCamera),
    fromLook,
    toLook: planetGroups.get(key).position.clone()
  };
}

function animate() {
  const elapsed = clock.getElapsedTime();
  updateHover();
  updateCamera();
  updatePlanets(elapsed);
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

function updatePlanets(elapsed) {
  allPlanets.forEach((key) => {
    const data = PLANETS[key];
    const group = planetGroups.get(key);
    const mesh = planetMeshes.get(key);
    mesh.rotation.y += 0.0035 * data.spin;
    mesh.rotation.x = Math.sin(elapsed * 0.2 + data.orbit) * 0.035;

    const clouds = group.children.find((child) => child.userData.clouds);
    if (clouds) clouds.rotation.y += 0.0048;

    const isSelected = key === selectedPlanet;
    const targetScale = hoverMesh === mesh || isSelected ? 1.08 : 1;
    group.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.06);
  });

  if (mode === "detail" && selectedPlanet) {
    const mesh = planetMeshes.get(selectedPlanet);
    const progress = scrollProgress();
    mesh.rotation.y = progress * Math.PI * 5.4 + performance.now() * 0.00014;
    mesh.rotation.x = Math.sin(progress * Math.PI * 2) * 0.24;
  }
}

function updateHover() {
  if (mode !== "main") {
    hoverMesh = null;
    canvas.style.cursor = "default";
    return;
  }

  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(clickableMeshes, false);
  hoverMesh = hits[0]?.object || null;
  canvas.style.cursor = hoverMesh ? "pointer" : "default";
}

function updateCamera() {
  if (zoomAnimation) {
    const t = Math.min(1, (performance.now() - zoomAnimation.start) / zoomAnimation.duration);
    const eased = easeInOutCubic(t);
    camera.position.lerpVectors(zoomAnimation.fromPosition, zoomAnimation.toPosition, eased);
    cameraLook.lerpVectors(zoomAnimation.fromLook, zoomAnimation.toLook, eased);
    camera.lookAt(cameraLook);
    if (t >= 1) {
      const done = zoomAnimation.onComplete;
      zoomAnimation = null;
      if (done) done();
    }
    return;
  }

  if (mode === "detail" && selectedPlanet) {
    const data = PLANETS[selectedPlanet];
    const group = planetGroups.get(selectedPlanet);
    const progress = scrollProgress();
    const descent = smoothstep(0.42, 0.92, progress);
    const angle = progress * Math.PI * 1.5 - 0.2;
    const distance = data.ring ? 4.3 : Math.max(1.55, data.radius * 2.6);
    const orbitTarget = new THREE.Vector3(
      group.position.x + Math.sin(angle) * distance * 0.42,
      group.position.y + 0.55 + Math.sin(progress * Math.PI) * 0.22,
      group.position.z + Math.cos(angle) * distance
    );
    const surfaceAngle = progress * Math.PI * 4 + data.orbit;
    const surfaceTarget = new THREE.Vector3(
      group.position.x + Math.sin(surfaceAngle) * 1.5,
      group.position.y - data.radius * 0.66 + 0.34,
      group.position.z + Math.cos(surfaceAngle) * 1.5
    );
    const target = orbitTarget.clone().lerp(surfaceTarget, descent);
    const surfaceLook = new THREE.Vector3(
      group.position.x + Math.sin(surfaceAngle + 0.7) * 3.8,
      group.position.y - data.radius * 0.66 + 0.18,
      group.position.z + Math.cos(surfaceAngle + 0.7) * 3.8
    );
    setBodyOpacity(selectedPlanet, 1 - descent * 0.92);
    setSurfaceOpacity(descent);
    camera.position.lerp(target, 0.075);
    cameraLook.lerp(group.position.clone().lerp(surfaceLook, descent), 0.09);
    camera.lookAt(cameraLook);
    return;
  }

  const targetState = getMainCameraState();
  cameraTarget.lerp(targetState.position, 0.075);
  cameraLook.lerp(targetState.look, 0.08);
  camera.position.copy(cameraTarget);
  camera.position.x += activePointer.x * 0.18;
  camera.position.y += activePointer.y * 0.1;
  camera.lookAt(cameraLook);
}

function getMainCameraState() {
  const sections = [...document.querySelectorAll("[data-planet]")];
  const center = window.innerHeight * 0.52;
  let nearest = null;
  let nearestDistance = Number.POSITIVE_INFINITY;

  sections.forEach((section) => {
    const rect = section.getBoundingClientRect();
    const distance = Math.abs(rect.top + rect.height * 0.5 - center);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearest = section;
    }
  });

  if (window.scrollY < window.innerHeight * 0.58) {
    return {
      position: new THREE.Vector3(2, 7, 34),
      look: new THREE.Vector3(1.8, -0.25, 0)
    };
  }

  const key = nearest?.dataset.planet || "earth";
  const data = PLANETS[key];
  const group = planetGroups.get(key);
  return {
    position: new THREE.Vector3(...data.sectionCamera),
    look: group.position.clone()
  };
}

function scrollProgress() {
  const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  return THREE.MathUtils.clamp(window.scrollY / max, 0, 1);
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function smoothstep(edge0, edge1, value) {
  const t = THREE.MathUtils.clamp((value - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

function onResize() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
}

function buildSurfaceWorld(key) {
  if (surfaceWorld) {
    scene.remove(surfaceWorld);
    surfaceWorld.traverse((child) => {
      child.geometry?.dispose?.();
    });
  }

  const data = PLANETS[key];
  const group = planetGroups.get(key);
  const surface = data.surface || {};
  const world = new THREE.Group();
  world.position.copy(group.position);
  world.visible = false;
  world.userData.materials = [];

  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(18, 64, 64),
    new THREE.MeshBasicMaterial({
      color: surface.sky || 0x101828,
      side: THREE.BackSide,
      transparent: true,
      opacity: 0,
      depthWrite: false
    })
  );
  world.add(sky);
  world.userData.materials.push(sky.material);

  const terrainGeometry = new THREE.PlaneGeometry(18, 18, 160, 160);
  const rng = seeded(`${key}-surface`);
  const positions = terrainGeometry.attributes.position;
  const height = surface.height ?? 0.24;
  for (let i = 0; i < positions.count; i += 1) {
    const x = positions.getX(i);
    const y = positions.getY(i);
    const wave =
      Math.sin(x * 0.9 + data.orbit) * 0.5 +
      Math.cos(y * 1.2 - data.orbit) * 0.32 +
      (rng() - 0.5) * 0.48;
    positions.setZ(i, wave * height);
  }
  terrainGeometry.computeVertexNormals();

  const terrainMaterial = new THREE.MeshStandardMaterial({
    map: loadTexture(data.texture),
    color: 0xffffff,
    roughness: surface.type === "gas" || surface.type === "plasma" ? 0.5 : 0.92,
    metalness: 0,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0
  });
  const terrain = new THREE.Mesh(terrainGeometry, terrainMaterial);
  terrain.rotation.x = -Math.PI / 2;
  terrain.position.y = -data.radius * 0.72;
  world.add(terrain);
  world.userData.materials.push(terrainMaterial);

  for (let i = 0; i < 5; i += 1) {
    const haze = new THREE.Mesh(
      new THREE.PlaneGeometry(18, 4.5, 48, 8),
      new THREE.MeshBasicMaterial({
        color: surface.haze || data.accent,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide
      })
    );
    haze.position.set(0, -data.radius * 0.25 + i * 0.24, -4 + i * 1.9);
    haze.rotation.x = -0.08 + i * 0.02;
    haze.rotation.z = i % 2 ? 0.06 : -0.05;
    world.add(haze);
    world.userData.materials.push(haze.material);
  }

  if (surface.type === "plasma") {
    const corona = new THREE.PointLight(surface.haze || 0xffbd55, 2.8, 24, 1.4);
    corona.position.set(0, 2, 2);
    world.add(corona);
  }

  surfaceWorld = world;
  scene.add(world);
}

function setSurfaceOpacity(opacity) {
  if (!surfaceWorld) return;
  surfaceWorld.visible = opacity > 0.01;
  surfaceWorld.userData.materials.forEach((material, index) => {
    material.opacity = index === 0 ? opacity * 0.5 : Math.min(0.95, opacity * (index === 1 ? 1 : 0.2));
  });
}

function setBodyOpacity(key, opacity) {
  const group = planetGroups.get(key);
  if (!group) return;

  group.traverse((child) => {
    if (!child.material) return;
    const materials = Array.isArray(child.material) ? child.material : [child.material];
    materials.forEach((material) => {
      if (material.userData.baseOpacity === undefined) material.userData.baseOpacity = material.opacity ?? 1;
      material.transparent = opacity < 0.99 || material.userData.baseOpacity < 1;
      material.opacity = material.userData.baseOpacity * opacity;
      material.depthWrite = opacity > 0.35;
    });
  });
}

function addHint() {
  const hint = document.createElement("div");
  hint.className = "hint";
  hint.textContent = "Click any world";
  document.body.appendChild(hint);
}

function setDetailIsolation(key, isolated) {
  allPlanets.forEach((planetKey) => {
    const group = planetGroups.get(planetKey);
    if (group) group.visible = !isolated || planetKey === key;
    setBodyOpacity(planetKey, 1);
  });

  contextObjects.forEach((object) => {
    object.visible = !isolated;
  });

  if (!isolated && surfaceWorld) {
    surfaceWorld.visible = false;
  }
}
