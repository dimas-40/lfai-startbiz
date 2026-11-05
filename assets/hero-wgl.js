// hero-wgl — 랜딩 히어로 배경 WebGL 엔진 (three r170)
// 페이지마다 연출 시트(cfg)만 다르게 넘긴다: mount({ host, palette, layers, scenes, sync, tour, ... })
// 원칙: 글자는 3D에 넣지 않는다 · WebGL 실패 시 기존 배경 유지 · 움직임 줄이기 = 정지 한 장 · 화면 밖/탭 숨김 = 멈춤
import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";

const ADD = { transparent: true, depthWrite: false, blending: THREE.AdditiveBlending };
const V = (a) => new THREE.Vector3(...a);
const col = (c) => new THREE.Color(c);

/* ======================= 공용 텍스처 ======================= */
function canvasTex(w, h, draw) {
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  draw(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
let _dot;
function dotTex() {
  return _dot || (_dot = canvasTex(64, 64, (g) => {
    const r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    r.addColorStop(0, "rgba(255,255,255,1)"); r.addColorStop(0.3, "rgba(255,255,255,.75)"); r.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = r; g.fillRect(0, 0, 64, 64);
  }));
}
function rng(seed = 7) { let s = seed >>> 0 || 1; return () => ((s = (s * 16807) % 2147483647) / 2147483647); }

// 선 아이콘 (원 테두리 + 기호). 3D 안에서 쓰는 유일한 "그림 기호". 글자는 없다.
const ICON_DRAW = {
  mic: (g) => { g.beginPath(); g.roundRect(52, 30, 24, 48, 12); g.stroke(); g.beginPath(); g.arc(64, 64, 22, 0.15 * Math.PI, 0.85 * Math.PI); g.stroke(); g.beginPath(); g.moveTo(64, 86); g.lineTo(64, 98); g.moveTo(52, 98); g.lineTo(76, 98); g.stroke(); },
  speaker: (g) => { g.beginPath(); g.moveTo(34, 54); g.lineTo(48, 54); g.lineTo(64, 40); g.lineTo(64, 88); g.lineTo(48, 74); g.lineTo(34, 74); g.closePath(); g.stroke(); [14, 26].forEach((r) => { g.beginPath(); g.arc(66, 64, r, -0.3 * Math.PI, 0.3 * Math.PI); g.stroke(); }); },
  shield: (g) => { g.beginPath(); g.moveTo(64, 30); g.lineTo(90, 40); g.lineTo(88, 66); g.quadraticCurveTo(84, 88, 64, 98); g.quadraticCurveTo(44, 88, 40, 66); g.lineTo(38, 40); g.closePath(); g.stroke(); g.beginPath(); g.moveTo(52, 64); g.lineTo(61, 73); g.lineTo(77, 54); g.stroke(); },
  note: (g) => { g.beginPath(); g.ellipse(52, 82, 12, 9, -0.4, 0, 7); g.stroke(); g.beginPath(); g.moveTo(63, 80); g.lineTo(63, 34); g.quadraticCurveTo(76, 44, 82, 52); g.stroke(); },
  doc: (g) => { g.beginPath(); g.moveTo(44, 30); g.lineTo(74, 30); g.lineTo(86, 42); g.lineTo(86, 98); g.lineTo(44, 98); g.closePath(); g.stroke(); [52, 64, 76].forEach((y) => { g.beginPath(); g.moveTo(52, y); g.lineTo(78, y); g.stroke(); }); },
  heart: (g) => { g.beginPath(); g.moveTo(64, 92); g.bezierCurveTo(30, 70, 34, 38, 56, 42); g.quadraticCurveTo(62, 44, 64, 52); g.quadraticCurveTo(66, 44, 72, 42); g.bezierCurveTo(94, 38, 98, 70, 64, 92); g.stroke(); },
  star: (g) => { g.beginPath(); for (let i = 0; i < 10; i++) { const r = i % 2 ? 14 : 30, a = -Math.PI / 2 + i * Math.PI / 5; g.lineTo(64 + Math.cos(a) * r, 64 + Math.sin(a) * r); } g.closePath(); g.stroke(); },
  frame: (g) => { g.strokeRect(36, 36, 56, 56); g.beginPath(); g.moveTo(36, 64); g.lineTo(92, 64); g.moveTo(64, 36); g.lineTo(64, 64); g.stroke(); },
  play: (g) => { g.beginPath(); g.moveTo(54, 42); g.lineTo(84, 64); g.lineTo(54, 86); g.closePath(); g.stroke(); },
  people: (g) => { [[50, 52], [78, 52]].forEach(([x, y]) => { g.beginPath(); g.arc(x, y, 9, 0, 7); g.stroke(); g.beginPath(); g.arc(x, y + 34, 16, Math.PI, 2 * Math.PI); g.stroke(); }); },
  chart: (g) => { [[42, 80, 70], [58, 62, 70], [74, 46, 70]].forEach(([x, y]) => { g.strokeRect(x, y, 10, 90 - y); }); },
  globe: (g) => { g.beginPath(); g.arc(64, 64, 28, 0, 7); g.stroke(); g.beginPath(); g.ellipse(64, 64, 12, 28, 0, 0, 7); g.stroke(); g.beginPath(); g.moveTo(36, 64); g.lineTo(92, 64); g.stroke(); },
  stamp: (g) => { g.beginPath(); g.arc(64, 60, 22, 0, 7); g.stroke(); g.beginPath(); g.arc(64, 60, 14, 0, 7); g.stroke(); g.beginPath(); g.moveTo(40, 94); g.lineTo(88, 94); g.stroke(); },
  lotus: (g) => { for (let i = -2; i <= 2; i++) { g.beginPath(); g.ellipse(64 + i * 11, 70 - Math.abs(i) * 3, 7, 22 - Math.abs(i) * 4, i * 0.35, 0, 7); g.stroke(); } g.beginPath(); g.moveTo(36, 90); g.lineTo(92, 90); g.stroke(); },
  light: (g) => { g.beginPath(); g.arc(64, 64, 10, 0, 7); g.stroke(); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; g.beginPath(); g.moveTo(64 + Math.cos(a) * 18, 64 + Math.sin(a) * 18); g.lineTo(64 + Math.cos(a) * 30, 64 + Math.sin(a) * 30); g.stroke(); } },
  book: (g) => { g.beginPath(); g.moveTo(64, 40); g.quadraticCurveTo(50, 34, 34, 38); g.lineTo(34, 88); g.quadraticCurveTo(50, 84, 64, 90); g.quadraticCurveTo(78, 84, 94, 88); g.lineTo(94, 38); g.quadraticCurveTo(78, 34, 64, 40); g.lineTo(64, 90); g.stroke(); },
};
const _icons = {};
function iconTex(name, color) {
  const k = name + color;
  return _icons[k] || (_icons[k] = canvasTex(128, 128, (g) => {
    g.strokeStyle = color; g.lineWidth = 6.5; g.lineCap = g.lineJoin = "round";
    g.shadowColor = color; g.shadowBlur = 12;
    g.beginPath(); g.arc(64, 64, 54, 0, 7); g.stroke();
    (ICON_DRAW[name] || ICON_DRAW.star)(g);
  }));
}

/* ======================= 기하 도구 ======================= */
function segs(arr, mat) {
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(arr, 3));
  return new THREE.LineSegments(g, mat);
}
function boxEdges(cx, cy, cz, w, h, d, out) {
  const x0 = cx - w / 2, x1 = cx + w / 2, y0 = cy - h / 2, y1 = cy + h / 2, z0 = cz - d / 2, z1 = cz + d / 2;
  const v = [[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0], [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]];
  [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]].forEach(([a, b]) => out.push(...v[a], ...v[b]));
}
function points(n, size, color, opacity = 1) {
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(n * 3), 3));
  return new THREE.Points(g, new THREE.PointsMaterial({ map: dotTex(), size, color: col(color), opacity, ...ADD }));
}
function lineMat(color, opacity) { return new THREE.LineBasicMaterial({ color: col(color), opacity, ...ADD }); }

/* ======================= 레이어 부품 =======================
   각 부품: (o, ctx) => { group, update(t, dt, level) }
   level(0~1)은 엔진이 장면 전환에 맞춰 부드럽게 바꿔 준다. 재질 투명도는 엔진이 level로 곱한다. */
const KITS = {};

// 바닥 격자
KITS.grid = (o, { P }) => {
  const grid = new THREE.GridHelper(o.size || 60, o.div || 60, col(o.c1 || P.a), col(o.c2 || P.dim));
  grid.material.transparent = true; grid.material.opacity = o.opacity ?? 0.3; grid.material.depthWrite = false;
  grid.position.y = o.y || 0;
  return { group: grid };
};

// 떠다니는 먼지
KITS.dust = (o, { P, narrow }) => {
  const n = Math.round((o.n || 300) * (narrow ? 0.5 : 1)), p = points(n, o.size || 0.06, o.color || P.a, o.opacity ?? 0.45), a = p.geometry.attributes.position.array, r = rng(o.seed || 3);
  const S = o.spread || [30, 10, 18];
  for (let i = 0; i < n; i++) a.set([(r() - 0.5) * S[0], r() * S[1] + (o.y || 0), (r() - 0.5) * S[2]], i * 3);
  const base = a.slice();
  return { group: p, update(t) { for (let i = 0; i < n; i++) a[i * 3 + 1] = base[i * 3 + 1] + Math.sin(t * 0.3 + i) * 0.15; p.geometry.attributes.position.needsUpdate = true; } };
};

// 음성 · 음향 파형 (여러 가닥)
KITS.wave = (o, { P }) => {
  const grp = new THREE.Group(), N = o.n || 200, x0 = o.x0 ?? -14, x1 = o.x1 ?? -2, y0 = o.y ?? 2, z = o.z ?? 0;
  const strands = (o.strands || 3);
  const ls = [];
  for (let s = 0; s < strands; s++) {
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(N * 3), 3));
    const l = new THREE.Line(g, lineMat(s ? (o.c2 || P.b) : (o.color || P.a), s ? 0.35 : 0.85));
    l.userData = { ph: s * 1.7, amp: 1 - s * 0.25 }; grp.add(l); ls.push(l);
  }
  return {
    group: grp,
    update(t, dt, lv) {
      ls.forEach((l) => {
        const a = l.geometry.attributes.position.array, { ph, amp } = l.userData;
        for (let i = 0; i < N; i++) {
          const u = i / (N - 1), x = x0 + u * (x1 - x0);
          const env = Math.sin(Math.PI * Math.min(1, u * (o.taper ?? 1.15))) * (0.25 + 0.75 * Math.abs(Math.sin(u * 9 - t * 1.3 + ph)));
          a[i * 3] = x; a[i * 3 + 1] = y0 + Math.sin(x * (o.freq || 3.1) - t * 4 + ph) * (o.amp || 0.55) * env * amp * (0.4 + 0.6 * lv); a[i * 3 + 2] = z + (o.zwave ? Math.cos(x * 1.3 + t) * o.zwave : 0);
        }
        l.geometry.attributes.position.needsUpdate = true;
      });
    },
  };
};

// 오선 리본 + 흐르는 음표 (음악)
KITS.staff = (o, { P, narrow }) => {
  const grp = new THREE.Group(), R = o.ribbons || 3, LINES = 5, N = 160, gap = o.gap || 0.12, W = o.width || 26;
  const curves = [];
  for (let r = 0; r < R; r++) {
    const ph = r * 2.1, yb = (o.y || 0) + (r - (R - 1) / 2) * (o.spread || 1.6), zb = (o.z || 0) - r * 1.2;
    const path = (u, t, k) => {
      const x = -W / 2 + u * W;
      return new THREE.Vector3(x, yb + Math.sin(u * 5 + ph + t * 0.35) * 0.7 + k * gap, zb + Math.cos(u * 3.3 + ph + t * 0.25) * 1.4);
    };
    for (let k = 0; k < LINES; k++) {
      const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(N * 3), 3));
      const l = new THREE.Line(g, lineMat(r ? (o.c2 || P.b) : (o.color || P.a), r ? 0.32 : 0.6)); grp.add(l);
      curves.push({ l, r, k, path });
    }
  }
  const NP = narrow ? 40 : 80, notes = points(NP * R, o.noteSize || 0.16, o.noteColor || P.hi, 1); grp.add(notes);
  const na = notes.geometry.attributes.position.array, r0 = rng(11), nk = Array.from({ length: NP * R }, () => Math.floor(r0() * 9) / 2);
  const tmp = new THREE.Vector3();
  return {
    group: grp,
    update(t) {
      curves.forEach(({ l, k, path }) => {
        const a = l.geometry.attributes.position.array;
        for (let i = 0; i < N; i++) { path(i / (N - 1), t, k).toArray(a, i * 3); }
        l.geometry.attributes.position.needsUpdate = true;
      });
      for (let r = 0; r < R; r++) {
        const path = curves[r * LINES].path;
        for (let i = 0; i < NP; i++) {
          const u = (t * (0.025 + r * 0.006) + i / NP) % 1;
          tmp.copy(path(u, t, nk[r * NP + i])); tmp.toArray(na, (r * NP + i) * 3);
        }
      }
      notes.geometry.attributes.position.needsUpdate = true;
    },
  };
};

// 원형 스펙트럼 (막대가 둘러섬)
KITS.spectrum = (o, { P, narrow }) => {
  const n = narrow ? (o.bars || 96) / 2 : (o.bars || 96), R = o.radius || 5;
  const m = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ color: col(o.color || P.a), opacity: 0.7, ...ADD }), n);
  m.frustumCulled = false;
  const grp = new THREE.Group(); grp.add(m); grp.position.set(...(o.pos || [0, 0, 0])); if (o.tilt) grp.rotation.x = o.tilt;
  const M = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3(), up = new THREE.Vector3(0, 0, 1);
  return {
    group: grp,
    update(t, dt, lv) {
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        const h = 0.15 + (0.5 + 0.5 * Math.sin(t * 2.1 + i * 0.37)) * (0.5 + 0.5 * Math.sin(t * 0.7 + i * 0.11)) * (o.amp || 1.6) * (0.3 + 0.7 * lv);
        q.setFromAxisAngle(up, a - Math.PI / 2);
        p.set(Math.cos(a) * (R + h / 2), Math.sin(a) * (R + h / 2), 0);
        s.set(o.w || 0.06, h, 0.06); M.compose(p, q, s); m.setMatrixAt(i, M);
      }
      m.instanceMatrix.needsUpdate = true; grp.rotation.z = t * 0.03;
    },
  };
};

// 노드 그래프 (구 · 와이어 껍질 · 베지어 엣지 · 흐르는 빛)
KITS.graph = (o, { P, narrow }) => {
  const grp = new THREE.Group(), r0 = rng(o.seed || 5);
  let nodes = o.nodes;
  if (!nodes) {
    nodes = []; const n = o.n || 18;
    for (let i = 0; i < n; i++) nodes.push({ p: [(r0() - 0.5) * (o.spread || 10), r0() * (o.h || 5) + (o.y || 0), (r0() - 0.5) * (o.depth || 6)], c: [P.a, P.b, P.hi][i % 3], r: 0.12 + r0() * 0.12 });
  }
  let edges = o.edges;
  if (!edges) { edges = []; nodes.forEach((_, i) => { const k = 1 + Math.floor(r0() * 2); for (let j = 0; j < k; j++) { const b = Math.floor(r0() * nodes.length); if (b !== i) edges.push([i, b]); } }); }
  const shells = [];
  nodes.forEach((nd) => {
    const c = col(nd.c || P.a);
    const core = new THREE.Mesh(new THREE.SphereGeometry(nd.r || 0.18, 20, 20), new THREE.MeshBasicMaterial({ color: c.clone().multiplyScalar(1.6), opacity: 1, transparent: true }));
    core.position.set(...nd.p); grp.add(core);
    const sh = new THREE.Mesh(new THREE.IcosahedronGeometry((nd.r || 0.18) * 2.3, 1), new THREE.MeshBasicMaterial({ color: c, wireframe: true, opacity: 0.3, ...ADD }));
    sh.position.copy(core.position); sh.userData.s = 0.2 + r0() * 0.5; grp.add(sh); shells.push(sh);
    if (nd.icon) { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: iconTex(nd.icon, "#" + c.getHexString()), opacity: 0.9, ...ADD })); sp.position.copy(core.position).add(new THREE.Vector3(0, (nd.r || 0.18) * 3.6, 0)); sp.scale.setScalar(o.iconSize || 0.55); grp.add(sp); }
  });
  const curves = edges.map(([a, b], i) => {
    const A = V(nodes[a].p), B = V(nodes[b].p), M = A.clone().add(B).multiplyScalar(0.5); M.y += (o.arc ?? 0.8) + (i % 3) * 0.25;
    return { c: new THREE.QuadraticBezierCurve3(A, M, B), color: col(nodes[a].c || P.a) };
  });
  const arr = []; curves.forEach(({ c }) => { const p = c.getPoints(32); for (let i = 0; i < 32; i++) arr.push(...p[i].toArray(), ...p[i + 1].toArray()); });
  grp.add(segs(arr, lineMat(o.edgeColor || P.a, 0.28)));
  const per = narrow ? 6 : (o.per || 12), dots = points(curves.length * per, o.dot || 0.09, o.dotColor || P.hi, 1); grp.add(dots);
  const da = dots.geometry.attributes.position.array, tmp = new THREE.Vector3();
  return {
    group: grp,
    update(t, dt) {
      let k = 0;
      curves.forEach(({ c }, j) => { for (let i = 0; i < per; i++) { c.getPoint((t * (0.1 + (j % 4) * 0.025) + i / per) % 1, tmp); tmp.toArray(da, k); k += 3; } });
      dots.geometry.attributes.position.needsUpdate = true;
      shells.forEach((s) => { s.rotation.y += dt * s.userData.s; s.rotation.x += dt * s.userData.s * 0.4; });
      if (o.spin) grp.rotation.y = t * o.spin;
    },
  };
};

// 와이어프레임 건물 (열 = 서비스, 층 = 가정 · 시설)
KITS.building = (o, { P, narrow }) => {
  const grp = new THREE.Group(), cols = o.cols || 3, floors = o.floors || 5, CW = o.cw || 1.3, FH = o.fh || 0.86, D = o.d || 1.15, X0 = -CW * cols / 2;
  const icons = o.icons || [];
  const mats = Array.from({ length: cols }, () => lineMat(o.color || P.a, 0.55));
  for (let c = 0; c < cols; c++) {
    const arr = [], cx = X0 + CW * (c + 0.5);
    for (let f = 0; f < floors; f++) {
      const cy = FH * (f + 0.5);
      boxEdges(cx, cy, 0, CW, FH, D, arr);
      boxEdges(cx + CW * 0.28, cy - FH * 0.1, D / 2, CW * 0.18, FH * 0.5, 0.001, arr);
      if (icons[c]) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: iconTex(icons[c], P.icon || P.hi), opacity: 0.85, ...ADD })); s.position.set(cx - CW * 0.12, cy, D / 2 + 0.02); s.scale.setScalar(0.42); s.userData.col = c; grp.add(s); }
    }
    grp.add(segs(arr, mats[c]));
  }
  const roof = []; boxEdges(X0 + CW * 0.9, FH * floors + 0.3, -0.1, CW * 1.1, 0.6, D * 0.7, roof); boxEdges(-X0 - CW * 0.7, FH * floors + 0.2, 0, CW * 0.9, 0.4, D * 0.8, roof);
  grp.add(segs(roof, lineMat(o.color || P.a, 0.45)));
  const slab = new THREE.MeshBasicMaterial({ color: col(P.b), opacity: 0.05, side: THREE.DoubleSide, ...ADD });
  for (let f = 0; f <= floors; f++) { const p = new THREE.Mesh(new THREE.PlaneGeometry(CW * cols + 0.3, D + 0.3), slab); p.rotation.x = -Math.PI / 2; p.position.y = FH * f; grp.add(p); }
  const XL = X0 - 1.1, XR = -X0 + 0.15, WZ = D / 2 + 0.06, per = narrow ? 20 : 34;
  const wire = []; for (let f = 0; f < floors; f++) wire.push(XL, FH * f + 0.22, WZ, XR, FH * f + 0.22, WZ);
  grp.add(segs(wire, lineMat(P.a, 0.35)));
  const flow = points(floors * per, 0.13, P.hi, 0.95); grp.add(flow);
  const fa = flow.geometry.attributes.position.array;
  grp.position.set(...(o.pos || [0, 0, 0]));
  grp.userData.colMats = mats; grp.userData.entry = [XL, FH * floors / 2, WZ];
  return {
    group: grp,
    focus: (lvls) => { mats.forEach((m, i) => (m.userData.focus = lvls[i] ?? 1)); grp.children.forEach((ch) => { if (ch.isSprite) ch.material.userData.focus = Math.min(1, (lvls[ch.userData.col] ?? 1) + 0.15); }); },
    update(t) {
      let n = 0;
      for (let f = 0; f < floors; f++) for (let i = 0; i < per; i++) { const u = (t * (0.07 + f * 0.008) + i / per + f * 0.13) % 1; fa[n++] = XL + u * (XR - XL); fa[n++] = FH * f + 0.22; fa[n++] = WZ; }
      flow.geometry.attributes.position.needsUpdate = true;
    },
  };
};

// 도시 블록 (지도 · 행정 · 의정)
KITS.city = (o, { P, narrow }) => {
  const n = narrow ? (o.n || 260) / 2 : (o.n || 260), S = o.size || 16, r0 = rng(o.seed || 9);
  const geo = new THREE.BoxGeometry(1, 1, 1); geo.translate(0, 0.5, 0);
  const fill = new THREE.InstancedMesh(geo, new THREE.MeshBasicMaterial({ color: col(P.b), opacity: 0.12, ...ADD }), n);
  const edgeGeo = new THREE.EdgesGeometry(geo);
  const grp = new THREE.Group(); grp.add(fill);
  const M = new THREE.Matrix4(), hs = [], pos = [];
  const arr = [];
  for (let i = 0; i < n; i++) {
    const gx = Math.round((r0() - 0.5) * S), gz = Math.round((r0() - 0.5) * S), d = Math.hypot(gx, gz);
    const h = Math.max(0.2, (o.hmax || 3) * Math.exp(-d / (S * 0.28)) * (0.3 + r0()));
    const w = 0.5 + r0() * 0.35;
    M.compose(new THREE.Vector3(gx, 0, gz), new THREE.Quaternion(), new THREE.Vector3(w, h, w)); fill.setMatrixAt(i, M);
    hs.push(h); pos.push([gx, gz, w]);
    const e = edgeGeo.attributes.position.array;
    for (let k = 0; k < e.length; k += 3) arr.push(gx + e[k] * w, e[k + 1] * h, gz + e[k + 2] * w);
  }
  const edges = segs(arr, lineMat(o.color || P.a, 0.4)); grp.add(edges);
  // 훑고 지나가는 스캔 링
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.98, 1, 128), new THREE.MeshBasicMaterial({ color: col(P.hi), opacity: 0.8, side: THREE.DoubleSide, ...ADD }));
  ring.rotation.x = -Math.PI / 2; ring.position.y = 0.02; grp.add(ring);
  // 데이터 점: 몇몇 건물 위로 솟는 빛
  const beams = points(40, 0.18, P.hi, 1); grp.add(beams); const ba = beams.geometry.attributes.position.array;
  const pick = Array.from({ length: 40 }, () => Math.floor(r0() * n));
  grp.position.set(...(o.pos || [0, 0, 0]));
  return {
    group: grp,
    update(t) {
      const R = ((t * (o.scan || 0.18)) % 1) * S * 0.75; ring.scale.setScalar(Math.max(0.01, R)); ring.material.opacity = (1 - R / (S * 0.75)) * 0.8 * (ring.material.userData.lv ?? 1);
      pick.forEach((idx, i) => { const [x, z] = pos[idx]; const u = (t * 0.4 + i / 40) % 1; ba[i * 3] = x; ba[i * 3 + 1] = hs[idx] + u * 3; ba[i * 3 + 2] = z; });
      beams.geometry.attributes.position.needsUpdate = true;
      if (o.spin) grp.rotation.y = t * o.spin;
    },
  };
};

// 지구본 (점 대륙 · 경위선 · 호 연결)
KITS.globe = (o, { P, narrow }) => {
  const R = o.radius || 3, grp = new THREE.Group();
  const n = narrow ? 1400 : 2600, dots = points(n, o.dotSize || 0.05, o.color || P.a, 0.9), a = dots.geometry.attributes.position.array;
  const lat = (v) => Math.asin(v), tmp = new THREE.Vector3();
  for (let i = 0; i < n; i++) { const y = 1 - (i / (n - 1)) * 2, r = Math.sqrt(1 - y * y), th = i * 2.399963; tmp.set(Math.cos(th) * r, y, Math.sin(th) * r).multiplyScalar(R); tmp.toArray(a, i * 3); }
  grp.add(dots);
  const lines = []; for (let k = 1; k < 6; k++) { const y = -R + (2 * R * k) / 6, rr = Math.sqrt(R * R - y * y); for (let i = 0; i < 64; i++) { const a0 = i / 64 * Math.PI * 2, a1 = (i + 1) / 64 * Math.PI * 2; lines.push(Math.cos(a0) * rr, y, Math.sin(a0) * rr, Math.cos(a1) * rr, y, Math.sin(a1) * rr); } }
  for (let k = 0; k < 8; k++) { const ph = k / 8 * Math.PI; for (let i = 0; i < 64; i++) { const a0 = i / 64 * Math.PI * 2, a1 = (i + 1) / 64 * Math.PI * 2; lines.push(Math.cos(ph) * Math.cos(a0) * R, Math.sin(a0) * R, Math.sin(ph) * Math.cos(a0) * R, Math.cos(ph) * Math.cos(a1) * R, Math.sin(a1) * R, Math.sin(ph) * Math.cos(a1) * R); } }
  grp.add(segs(lines, lineMat(o.lineColor || P.dim, 0.25)));
  const r0 = rng(o.seed || 13), arcs = [];
  const rp = () => { const u = r0() * 2 - 1, th = r0() * Math.PI * 2, s = Math.sqrt(1 - u * u); return new THREE.Vector3(Math.cos(th) * s, u, Math.sin(th) * s).multiplyScalar(R); };
  const hub = o.hub ? V(o.hub).normalize().multiplyScalar(R) : rp();
  for (let i = 0; i < (o.arcs || 14); i++) { const B = rp(), M = hub.clone().add(B).multiplyScalar(0.5); M.setLength(R * (1.25 + hub.distanceTo(B) / R * 0.25)); arcs.push(new THREE.QuadraticBezierCurve3(hub.clone(), M, B)); }
  const arr = []; arcs.forEach((c) => { const p = c.getPoints(40); for (let i = 0; i < 40; i++) arr.push(...p[i].toArray(), ...p[i + 1].toArray()); });
  grp.add(segs(arr, lineMat(o.arcColor || P.b, 0.5)));
  const per = 6, flow = points(arcs.length * per, 0.12, P.hi, 1); grp.add(flow); const fa = flow.geometry.attributes.position.array;
  const hubDot = new THREE.Mesh(new THREE.SphereGeometry(0.09, 16, 16), new THREE.MeshBasicMaterial({ color: col(P.hi).multiplyScalar(1.6), transparent: true })); hubDot.position.copy(hub); grp.add(hubDot);
  grp.position.set(...(o.pos || [0, 0, 0])); grp.rotation.z = 0.35;
  return {
    group: grp,
    update(t) {
      let k = 0; arcs.forEach((c, j) => { for (let i = 0; i < per; i++) { c.getPoint((t * 0.12 + i / per + j * 0.07) % 1, tmp); tmp.toArray(fa, k); k += 3; } });
      flow.geometry.attributes.position.needsUpdate = true; grp.rotation.y = t * (o.spin ?? 0.06);
    },
  };
};

// 떠 있는 프레임들 (웹툰 컷 · 영상 프레임 · 화면)
KITS.panels = (o, { P, narrow }) => {
  const grp = new THREE.Group(), n = narrow ? Math.ceil((o.n || 18) * 0.6) : (o.n || 18), r0 = rng(o.seed || 17);
  const tex = Array.from({ length: 4 }, (_, k) => canvasTex(256, 320, (g, w, h) => {
    g.fillStyle = "rgba(0,0,0,0)"; g.clearRect(0, 0, w, h);
    g.strokeStyle = P.hi; g.lineWidth = 6; g.strokeRect(6, 6, w - 12, h - 12);
    g.globalAlpha = 0.55; g.lineWidth = 2.4; g.strokeStyle = P.a;
    const rr = rng(31 + k);
    for (let i = 0; i < 7; i++) { g.beginPath(); const x = 30 + rr() * (w - 60), y = 30 + rr() * (h - 60); g.moveTo(x, y); g.bezierCurveTo(x + (rr() - .5) * 120, y + (rr() - .5) * 90, x + (rr() - .5) * 120, y + (rr() - .5) * 90, x + (rr() - .5) * 150, y + (rr() - .5) * 110); g.stroke(); }
    if (k % 2 === 0) { g.globalAlpha = 0.9; g.fillStyle = P.b; g.beginPath(); g.roundRect(w * 0.45, h * 0.66, w * 0.42, h * 0.16, 22); g.fill(); }
    if (k === 3) { g.globalAlpha = 0.8; g.beginPath(); g.arc(w / 2, h * 0.42, 46, 0, 7); g.stroke(); }
  }));
  const items = [];
  for (let i = 0; i < n; i++) {
    const w = 1 + r0() * 1.4, h = w * (1.1 + r0() * 0.5);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex[i % 4], opacity: 0.8, side: THREE.DoubleSide, ...ADD }));
    const L = o.lanes || 3, lane = i % L;
    m.userData = { lane, x0: (r0() - 0.5) * (o.spread || 22), y: (lane - (L - 1) / 2) * (o.laneGap || 2.6) + (o.y || 2.5) + (r0() - 0.5) * 0.6, z: -lane * 2.2 - r0() * 2, sp: 0.35 + r0() * 0.4, rot: (r0() - 0.5) * 0.5 };
    grp.add(m); items.push(m);
  }
  const W = o.spread || 22;
  return {
    group: grp,
    update(t) { items.forEach((m) => { const u = m.userData; let x = ((u.x0 + t * u.sp * (u.lane % 2 ? -1 : 1) + W / 2) % W + W) % W - W / 2; m.position.set(x, u.y + Math.sin(t * 0.6 + u.x0) * 0.12, u.z); m.rotation.y = u.rot + Math.sin(t * 0.3 + u.x0) * 0.15; }); },
  };
};

// 서류 더미 + 도장 (등기 · 법인 · 행정 서류)
KITS.docs = (o, { P }) => {
  const grp = new THREE.Group(), n = o.n || 14;
  const tex = canvasTex(256, 340, (g, w, h) => {
    g.strokeStyle = P.hi; g.lineWidth = 5; g.strokeRect(6, 6, w - 12, h - 12);
    g.globalAlpha = 0.6; g.lineWidth = 3; g.strokeStyle = P.a;
    for (let y = 60; y < h - 40; y += 24) { g.beginPath(); g.moveTo(30, y); g.lineTo(w - 30 - (y % 48 ? 40 : 0), y); g.stroke(); }
    g.globalAlpha = 0.9; g.strokeRect(30, 22, 110, 18);
  });
  const sheets = [];
  for (let i = 0; i < n; i++) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 2.2), new THREE.MeshBasicMaterial({ map: tex, opacity: 0.7, side: THREE.DoubleSide, ...ADD }));
    m.rotation.x = -Math.PI / 2 + 0.02; m.userData.i = i; grp.add(m); sheets.push(m);
  }
  const stamp = new THREE.Mesh(new THREE.RingGeometry(0.42, 0.5, 64), new THREE.MeshBasicMaterial({ color: col(o.stamp || P.b), opacity: 0, side: THREE.DoubleSide, ...ADD }));
  stamp.rotation.x = -Math.PI / 2; grp.add(stamp);
  const stamp2 = new THREE.Mesh(new THREE.RingGeometry(0.26, 0.3, 64), stamp.material); stamp2.rotation.x = -Math.PI / 2; grp.add(stamp2);
  grp.position.set(...(o.pos || [0, 0, 0])); if (o.tilt) grp.rotation.z = o.tilt;
  return {
    group: grp,
    update(t, dt, lv) {
      const cyc = (t * 0.25) % 1; // 한 장씩 날아와 쌓인다
      sheets.forEach((m, i) => {
        const land = i / n, k = Math.min(1, Math.max(0, (cyc - land * 0.8) * 5));
        const y = i * 0.06, fly = 1 - k;
        m.position.set(Math.sin(i * 1.7) * 0.15 + fly * -6, y + fly * 3, Math.cos(i * 1.3) * 0.15 + fly * 2);
        m.rotation.z = Math.sin(i * 2.1) * 0.12 + fly * 1.2;
      });
      const s = Math.max(0, Math.min(1, (cyc - 0.82) * 8)); const top = n * 0.06 + 0.02;
      stamp.position.set(0.3, top, 0.4); stamp2.position.copy(stamp.position);
      stamp.material.opacity = s * 0.95 * lv; stamp.scale.setScalar(1.6 - s * 0.6); stamp2.scale.copy(stamp.scale);
    },
  };
};

// 빛의 고리 (종교 · 의례: 연꽃 · 장미창 · 후광 · 오방색)
KITS.rings = (o, { P }) => {
  const grp = new THREE.Group(), n = o.n || 5, style = o.style || "halo";
  const rings = [];
  for (let i = 0; i < n; i++) {
    const R = (o.r0 || 1) + i * (o.step || 0.8), arr = [], seg = 128;
    for (let k = 0; k < seg; k++) { const a0 = k / seg * Math.PI * 2, a1 = (k + 1) / seg * Math.PI * 2; arr.push(Math.cos(a0) * R, Math.sin(a0) * R, 0, Math.cos(a1) * R, Math.sin(a1) * R, 0); }
    const spokes = style === "rose" ? 12 : style === "lotus" ? 8 + i * 4 : style === "obang" ? 5 : 24;
    for (let k = 0; k < spokes; k++) {
      const a = k / spokes * Math.PI * 2;
      if (style === "lotus") { // 꽃잎
        const pr = R * 0.32, cx = Math.cos(a) * R, cy = Math.sin(a) * R;
        for (let j = 0; j < 24; j++) { const b0 = j / 24 * Math.PI * 2, b1 = (j + 1) / 24 * Math.PI * 2; const f = (b) => [cx + Math.cos(a) * Math.cos(b) * pr - Math.sin(a) * Math.sin(b) * pr * 0.45, cy + Math.sin(a) * Math.cos(b) * pr + Math.cos(a) * Math.sin(b) * pr * 0.45, 0]; arr.push(...f(b0), ...f(b1)); }
      } else if (style === "rose") { // 장미창 트레이서리
        const R2 = R + (o.step || 0.8) * 0.9; arr.push(Math.cos(a) * R, Math.sin(a) * R, 0, Math.cos(a) * R2, Math.sin(a) * R2, 0);
        const m = a + Math.PI / spokes; arr.push(Math.cos(a) * R2, Math.sin(a) * R2, 0, Math.cos(m) * (R + (o.step || 0.8) * 0.45), Math.sin(m) * (R + (o.step || 0.8) * 0.45), 0);
      } else { const r1 = R - 0.1, r2 = R + (k % 3 ? 0.1 : 0.32); arr.push(Math.cos(a) * r1, Math.sin(a) * r1, 0, Math.cos(a) * r2, Math.sin(a) * r2, 0); }
    }
    const c = style === "obang" ? ["#4a7bd8", "#e0483f", "#f2c94c", "#f4f4f4", "#3b3b3b"][i % 5] : [P.a, P.b, P.hi][i % 3];
    const l = segs(arr, lineMat(style === "obang" && i % 5 === 4 ? P.a : c, 0.55)); l.userData.sp = (i % 2 ? -1 : 1) * (0.05 + i * 0.02); grp.add(l); rings.push(l);
  }
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: dotTex(), color: col(o.core || P.hi), opacity: 0.55, ...ADD })); glow.scale.setScalar((o.r0 || 1) * 3.2); grp.add(glow);
  const motes = points(o.motes || 160, 0.08, P.hi, 0.85); grp.add(motes); const ma = motes.geometry.attributes.position.array, r0 = rng(5), base = [];
  for (let i = 0; i < (o.motes || 160); i++) base.push([r0() * Math.PI * 2, (o.r0 || 1) + r0() * n * (o.step || 0.8), r0()]);
  grp.position.set(...(o.pos || [0, 0, 0])); if (o.tilt) grp.rotation.x = o.tilt;
  return {
    group: grp,
    update(t) {
      rings.forEach((l) => (l.rotation.z = t * l.userData.sp));
      base.forEach(([a, r, s], i) => { const aa = a + t * (0.05 + s * 0.08), rr = r + Math.sin(t * 0.5 + i) * 0.1; ma[i * 3] = Math.cos(aa) * rr; ma[i * 3 + 1] = Math.sin(aa) * rr; ma[i * 3 + 2] = Math.sin(t + i) * 0.3; });
      motes.geometry.attributes.position.needsUpdate = true; glow.material.opacity = (0.4 + 0.15 * Math.sin(t * 1.2)) * (glow.material.userData.lv ?? 1);
    },
  };
};

// 떠오르는 등 · 빛 (연등 · 촛불)
KITS.lanterns = (o, { P, narrow }) => {
  const n = narrow ? (o.n || 70) / 2 : (o.n || 70), p = points(n, o.size || 0.32, o.color || P.b, 0.9), a = p.geometry.attributes.position.array, r0 = rng(o.seed || 19), seed = [];
  for (let i = 0; i < n; i++) seed.push([(r0() - 0.5) * (o.spread || 20), r0() * 8, (r0() - 0.5) * 10 - 3, 0.15 + r0() * 0.25]);
  return { group: p, update(t) { seed.forEach(([x, y, z, s], i) => { a[i * 3] = x + Math.sin(t * 0.4 + i) * 0.3; a[i * 3 + 1] = ((y + t * s) % 9) - 1; a[i * 3 + 2] = z; }); p.geometry.attributes.position.needsUpdate = true; } };
};

// 무대 조명 빔 (셀럽 · 의원 · 런웨이)
KITS.beams = (o, { P }) => {
  const grp = new THREE.Group(), n = o.n || 5, cones = [];
  for (let i = 0; i < n; i++) {
    const h = o.h || 9, g = new THREE.ConeGeometry(o.r || 1.6, h, 48, 1, true); g.translate(0, -h / 2, 0);
    const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: col([P.a, P.b, P.hi][i % 3]), opacity: o.op ?? 0.05, side: THREE.DoubleSide, ...ADD }));
    m.position.set((i - (n - 1) / 2) * (o.gap || 3), o.top || 9, o.z || -2); m.userData.ph = i * 1.3; grp.add(m); cones.push(m);
  }
  const floor = new THREE.Mesh(new THREE.CircleGeometry(o.floorR || 4, 96), new THREE.MeshBasicMaterial({ color: col(P.hi), opacity: 0.07, ...ADD })); floor.rotation.x = -Math.PI / 2; floor.position.y = 0.01; grp.add(floor);
  const rings = []; for (let i = 0; i < 3; i++) { const r = new THREE.Mesh(new THREE.RingGeometry(1, 1.02, 128), new THREE.MeshBasicMaterial({ color: col(P.a), opacity: 0.5, side: THREE.DoubleSide, ...ADD })); r.rotation.x = -Math.PI / 2; r.position.y = 0.02; grp.add(r); rings.push(r); }
  grp.position.set(...(o.pos || [0, 0, 0]));
  return {
    group: grp,
    update(t) {
      cones.forEach((m) => { m.rotation.z = Math.sin(t * 0.5 + m.userData.ph) * 0.35; m.rotation.x = Math.cos(t * 0.37 + m.userData.ph) * 0.2; });
      rings.forEach((r, i) => { const u = (t * 0.25 + i / 3) % 1; r.scale.setScalar(0.5 + u * (o.floorR || 4)); r.material.opacity = (1 - u) * 0.5 * (r.material.userData.lv ?? 1); });
    },
  };
};

// 트랙 (선수: 타원 트랙 · 달리는 빛)
KITS.track = (o, { P }) => {
  const grp = new THREE.Group(), lanes = o.lanes || 6, A = o.a || 7, B = o.b || 3.6, arr = [];
  for (let l = 0; l < lanes; l++) { const a = A + l * 0.35, b = B + l * 0.35; for (let k = 0; k < 160; k++) { const t0 = k / 160 * Math.PI * 2, t1 = (k + 1) / 160 * Math.PI * 2; arr.push(Math.cos(t0) * a, 0, Math.sin(t0) * b, Math.cos(t1) * a, 0, Math.sin(t1) * b); } }
  grp.add(segs(arr, lineMat(P.a, 0.5)));
  const runners = points(lanes * 3, 0.3, P.hi, 1); grp.add(runners); const ra = runners.geometry.attributes.position.array;
  const trails = points(lanes * 3 * 14, 0.12, P.b, 0.7); grp.add(trails); const ta = trails.geometry.attributes.position.array;
  grp.position.set(...(o.pos || [0, 0, 0]));
  return {
    group: grp,
    update(t) {
      let k = 0, q = 0;
      for (let l = 0; l < lanes; l++) for (let r = 0; r < 3; r++) {
        const a = A + l * 0.35, b = B + l * 0.35, ph = t * (0.35 + l * 0.02 + r * 0.03) + r * 2.1;
        ra[k++] = Math.cos(ph) * a; ra[k++] = 0.05; ra[k++] = Math.sin(ph) * b;
        for (let j = 0; j < 14; j++) { const p2 = ph - j * 0.03; ta[q++] = Math.cos(p2) * a; ta[q++] = 0.04; ta[q++] = Math.sin(p2) * b; }
      }
      runners.geometry.attributes.position.needsUpdate = true; trails.geometry.attributes.position.needsUpdate = true;
    },
  };
};

// 방송 화면 벽 (원본 하나 → 여러 채널)
KITS.screens = (o, { P }) => {
  const grp = new THREE.Group(), cols = o.cols || 5, rows = o.rows || 3, W = o.w || 1.6, H = W * 9 / 16;
  const tex = canvasTex(320, 180, (g, w, h) => { g.strokeStyle = P.hi; g.lineWidth = 6; g.strokeRect(4, 4, w - 8, h - 8); g.globalAlpha = 0.5; g.fillStyle = P.b; g.fillRect(20, h - 40, w * 0.55, 10); g.globalAlpha = 0.85; g.beginPath(); g.moveTo(w / 2 - 18, h / 2 - 24); g.lineTo(w / 2 + 24, h / 2); g.lineTo(w / 2 - 18, h / 2 + 24); g.closePath(); g.strokeStyle = P.a; g.lineWidth = 5; g.stroke(); });
  const scr = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(W, H), new THREE.MeshBasicMaterial({ map: tex, opacity: 0.75, side: THREE.DoubleSide, ...ADD }));
    const a = (c - (cols - 1) / 2) * (o.curve || 0.22);
    m.position.set(Math.sin(a) * (o.R || 9), (r - (rows - 1) / 2) * (H + 0.25) + (o.y || 2.5), -Math.cos(a) * (o.R || 9) + (o.R || 9) - 4); m.rotation.y = -a; m.userData.ph = r * cols + c;
    grp.add(m); scr.push(m);
  }
  const src = V(o.src || [0, 1.2, 4]);
  const curves = scr.map((m) => { const B = m.position.clone(), M = src.clone().add(B).multiplyScalar(0.5); M.y += 1; return new THREE.QuadraticBezierCurve3(src, M, B); });
  const arr = []; curves.forEach((c) => { const p = c.getPoints(24); for (let i = 0; i < 24; i++) arr.push(...p[i].toArray(), ...p[i + 1].toArray()); });
  grp.add(segs(arr, lineMat(P.a, 0.22)));
  const per = 4, fl = points(curves.length * per, 0.1, P.hi, 1); grp.add(fl); const fa = fl.geometry.attributes.position.array, tmp = new THREE.Vector3();
  const core = new THREE.Sprite(new THREE.SpriteMaterial({ map: dotTex(), color: col(P.hi), opacity: 0.9, ...ADD })); core.position.copy(src); core.scale.setScalar(1.2); grp.add(core);
  grp.position.set(...(o.pos || [0, 0, 0]));
  return {
    group: grp,
    update(t) {
      let k = 0; curves.forEach((c, j) => { for (let i = 0; i < per; i++) { c.getPoint((t * 0.3 + i / per + j * 0.05) % 1, tmp); tmp.toArray(fa, k); k += 3; } });
      fl.geometry.attributes.position.needsUpdate = true;
      scr.forEach((m) => { m.material.userData.pulse = 0.65 + 0.35 * Math.sin(t * 2 + m.userData.ph); });
    },
  };
};

// 데이터 막대 (기록 · 매출 · 지표)
KITS.bars = (o, { P }) => {
  const cx = o.cols || 14, cz = o.rows || 8, n = cx * cz, geo = new THREE.BoxGeometry(1, 1, 1); geo.translate(0, 0.5, 0);
  const m = new THREE.InstancedMesh(geo, new THREE.MeshBasicMaterial({ color: col(P.a), opacity: 0.35, ...ADD }), n);
  const tops = points(n, 0.14, P.hi, 1), ta = tops.geometry.attributes.position.array;
  const grp = new THREE.Group(); grp.add(m); grp.add(tops);
  const M = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3(), g = o.gap || 0.55;
  grp.position.set(...(o.pos || [0, 0, 0]));
  return {
    group: grp,
    update(t, dt, lv) {
      let i = 0;
      for (let x = 0; x < cx; x++) for (let z = 0; z < cz; z++, i++) {
        const h = 0.1 + (o.hmax || 2.6) * (0.5 + 0.5 * Math.sin(x * 0.55 + t * 0.9) * Math.cos(z * 0.7 - t * 0.6)) * (0.5 + 0.5 * lv) * (0.6 + x / cx * 0.6);
        p.set((x - cx / 2) * g, 0, (z - cz / 2) * g); s.set(g * 0.7, h, g * 0.7); M.compose(p, q, s); m.setMatrixAt(i, M);
        ta[i * 3] = p.x; ta[i * 3 + 1] = h + 0.05; ta[i * 3 + 2] = p.z;
      }
      m.instanceMatrix.needsUpdate = true; tops.geometry.attributes.position.needsUpdate = true;
    },
  };
};

// 필름 띠 (영상: 그림 한 장이 프레임으로 이어짐)
KITS.film = (o, { P }) => {
  const grp = new THREE.Group(), n = o.n || 14, W = 1.6, H = 1.0, gap = 0.25, L = n * (W + gap);
  const tex = canvasTex(320, 220, (g, w, h) => {
    g.strokeStyle = P.hi; g.lineWidth = 6; g.strokeRect(4, 30, w - 8, h - 60);
    g.fillStyle = P.a; for (let x = 12; x < w; x += 28) { g.fillRect(x, 8, 14, 12); g.fillRect(x, h - 20, 14, 12); }
    g.globalAlpha = 0.6; g.strokeStyle = P.b; g.lineWidth = 3; g.beginPath(); g.arc(w * 0.4, h / 2, 34, 0, 7); g.stroke(); g.beginPath(); g.moveTo(w * 0.55, h * 0.65); g.lineTo(w * 0.8, h * 0.35); g.stroke();
  });
  const fr = [];
  for (let i = 0; i < n; i++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(W, H * 1.4), new THREE.MeshBasicMaterial({ map: tex, opacity: 0.8, side: THREE.DoubleSide, ...ADD })); grp.add(m); fr.push(m); }
  grp.position.set(...(o.pos || [0, 0, 0]));
  return {
    group: grp,
    update(t) { fr.forEach((m, i) => { const u = (((i * (W + gap) + t * (o.speed || 0.8)) % L) + L) % L - L / 2; m.position.set(u, Math.sin(u * 0.25 + t * 0.5) * 0.6 + (o.y || 2.4), Math.cos(u * 0.18) * 2 - 2); m.rotation.y = -Math.sin(u * 0.18) * 0.6; m.rotation.z = Math.sin(u * 0.25) * 0.08; }); },
  };
};

/* ======================= 엔진 ======================= */
export function mount(cfg) {
  const host = typeof cfg.host === "string" ? document.querySelector(cfg.host) : cfg.host;
  if (!host) return;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const vw = () => (cfg.fixed ? innerWidth : host.clientWidth), vh = () => (cfg.fixed ? innerHeight : host.clientHeight);
  const narrowNow = () => vw() / Math.max(1, vh()) < 0.9;

  let renderer;
  try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: !!cfg.light, powerPreference: "low-power" }); } catch (e) { return; }
  if (!renderer.getContext()) return;
  const P = Object.assign({ bg: "#071510", a: "#4ff0a8", b: "#2fbf86", hi: "#c8ffe6", dim: "#0f3a2a" }, cfg.palette || {});
  // 후처리 출력(OutputPass)이 sRGB로 한 번 더 인코딩하므로 배경 · 안개색은 선형으로 되돌려 넘긴다
  const BGL = col(P.bg).convertSRGBToLinear();
  renderer.setClearColor(BGL, cfg.light ? 0 : 1); // 밝은 바탕 모드: 투명 캔버스 위에 진한 선
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, narrowNow() ? 1.25 : 1.5));
  const cv = renderer.domElement; cv.className = "hwgl-c"; cv.setAttribute("aria-hidden", "true");

  const style = document.createElement("style");
  style.textContent = (cfg.fixed
    ? ".hwgl-c{position:fixed;inset:0;width:100vw;height:100vh;display:block;z-index:0;pointer-events:none}"
    : ".hwgl-c{position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none}") + (cfg.css || "");
  document.head.appendChild(style);

  const scene = new THREE.Scene();
  if (cfg.fog !== 0 && !cfg.light) scene.fog = new THREE.FogExp2(BGL, cfg.fog || 0.03);
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 300);
  if (cfg.bgGlow) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: dotTex(), color: col(cfg.bgGlow.color || P.b), opacity: cfg.bgGlow.opacity ?? 0.25, ...ADD, fog: false })); s.position.set(...(cfg.bgGlow.pos || [0, 8, -30])); s.scale.setScalar(cfg.bgGlow.size || 60); scene.add(s); }

  const narrow = narrowNow();
  const ctx = { P, narrow };
  const layers = {};
  Object.entries(cfg.layers || {}).forEach(([name, o]) => {
    const kit = KITS[o.type]; if (!kit) return;
    const L = kit(o, ctx);
    if (o.rot) L.group.rotation.set(...o.rot);
    if (o.scale) L.group.scale.setScalar(o.scale);
    if (o.at) L.group.position.set(...o.at);
    const mats = []; L.group.traverse((ch) => { const m = ch.material; if (m && !mats.includes(m)) { m.userData.base = m.opacity; m.userData.lv = 1; mats.push(m); } });
    if (cfg.light) mats.forEach((m) => { m.blending = THREE.NormalBlending; m.userData.base = Math.min(1, m.userData.base * 1.25); });
    L.mats = mats; L.level = 0; scene.add(L.group); layers[name] = L;
  });

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bl = cfg.bloom || {};
  const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), bl.strength ?? 0.75, bl.radius ?? 0.45, bl.threshold ?? 0.3);
  if (!cfg.light) composer.addPass(bloom);
  composer.addPass(new OutputPass());

  const clock = new THREE.Clock();
  let t = cfg.t0 ?? 3, running = false, visible = true, first = true;
  /* 장면 */
  const scenes = cfg.scenes && cfg.scenes.length ? cfg.scenes : [{ show: Object.fromEntries(Object.keys(layers).map((k) => [k, 1])) }];
  let si = 0, tourT = 0, userAt = -1e9;
  const camPos = new THREE.Vector3(), camTgt = new THREE.Vector3(), goalPos = new THREE.Vector3(), goalTgt = new THREE.Vector3();
  function goals() {
    const s = scenes[si], nr = narrowNow(), c = s.cam || cfg.cam || {};
    const pos = (nr && c.npos) || c.pos || [0, 3, 12], tgt = (nr && c.ntgt) || c.tgt || [0, 2, 0];
    goalPos.set(...pos); goalTgt.set(...tgt);
    if (nr && !c.npos) { goalTgt.x = 0; goalPos.sub(goalTgt).multiplyScalar(cfg.narrowPull || 1.3).add(goalTgt); }
  }
  function setScene(i) { si = ((i % scenes.length) + scenes.length) % scenes.length; tourT = 0; goals(); kick(); }

  /* 캐러셀 · 슬라이드 연동 */
  if (cfg.sync) {
    const el = typeof cfg.sync.el === "string" ? document.querySelector(cfg.sync.el) : cfg.sync.el;
    const read = () => {
      const box = el || (cfg.sync.lazy && document.querySelector(cfg.sync.lazy)); if (!box || !box.children.length) return;
      const r = box.getBoundingClientRect(), cxm = r.left + r.width / 2; let best = 0, bd = 1e9;
      [...box.children].forEach((ch, i) => { const b = ch.getBoundingClientRect(); const d = Math.abs(b.left + b.width / 2 - cxm); if (d < bd) { bd = d; best = i; } });
      const ch = box.children[best], key = cfg.sync.attr ? (ch.getAttribute(cfg.sync.attr) || "") : String(best);
      const map = cfg.sync.map || {}; let idx = map[key];
      if (idx === undefined) { const hit = Object.keys(map).find((k) => key.startsWith(k)); idx = hit !== undefined ? map[hit] : cfg.sync.byIndex ? Math.min(best, scenes.length - 1) : undefined; }
      if (idx !== undefined && idx !== si) { userAt = clock.elapsedTime; setScene(idx); }
    };
    const attach = () => { const box = el || document.querySelector(cfg.sync.lazy); if (!box) return setTimeout(attach, 400); box.addEventListener("scroll", () => { clearTimeout(box._hw); box._hw = setTimeout(read, 90); }, { passive: true }); read(); };
    attach();
  }

  /* 카메라 · 루프 */
  const pointer = new THREE.Vector2();
  addEventListener("pointermove", (e) => pointer.set(e.clientX / innerWidth - 0.5, e.clientY / innerHeight - 0.5), { passive: true });

  function resize() {
    const w = vw(), h = vh(); if (!w || !h) return;
    renderer.setSize(w, h, false); composer.setSize(w, h); bloom.resolution.set(w / 2, h / 2);
    camera.aspect = w / h; camera.fov = narrowNow() ? (cfg.nfov || 52) : (cfg.fov || 40); camera.updateProjectionMatrix();
    goals(); if (!running) frame(0);
  }

  function frame(dt) {
    t += dt;
    if (cfg.tour && scenes.length > 1 && clock.elapsedTime - userAt > (cfg.tourIdle ?? 12)) { tourT += dt; if (tourT > cfg.tour) setScene(si + 1); }
    goals();
    const k = first ? 1 : 1 - Math.pow(cfg.camEase ?? 0.03, dt);
    camPos.lerp(goalPos, k); camTgt.lerp(goalTgt, k);
    camera.position.copy(camPos);
    const drift = cfg.drift ?? 0.5;
    camera.position.x += Math.sin(t * 0.12) * drift + pointer.x * drift * 1.6; camera.position.y += -pointer.y * drift * 0.8;
    camera.lookAt(camTgt);
    const show = scenes[si].show || {};
    const ek = first ? 1 : 1 - Math.pow(0.04, dt);
    for (const [name, L] of Object.entries(layers)) {
      const goal = show[name] ?? 0; L.level += (goal - L.level) * ek;
      if (L.focus && scenes[si].focus && scenes[si].focus[name]) L.focus(scenes[si].focus[name]);
      L.group.visible = L.level > 0.01;
      if (!L.group.visible) continue;
      L.mats.forEach((m) => { const f = m.userData.focus ?? 1; m.userData.fl = (m.userData.fl ?? f) + (f - (m.userData.fl ?? f)) * ek; m.userData.lv = L.level; m.opacity = m.userData.base * L.level * m.userData.fl * (m.userData.pulse ?? 1); });
      L.update && L.update(t, dt, L.level);
    }
    composer.render();
    if (first) {
      first = false; host.classList.add("hwgl-on");
      (cfg.hide || []).forEach((sel) => document.querySelectorAll(sel).forEach((n) => { if (n.tagName === "VIDEO") { n.pause(); n.querySelectorAll("source").forEach((s) => s.remove()); n.removeAttribute("src"); n.load(); } n.style.display = "none"; }));
    }
  }
  function loop() { if (!running) return; frame(Math.min(clock.getDelta(), 0.05)); requestAnimationFrame(loop); }
  function kick() { if (reduce) { frame(0); return; } if (running || !visible || document.hidden) return; running = true; clock.getDelta(); requestAnimationFrame(loop); }
  function halt() { running = false; }

  if (cfg.fixed) document.body.prepend(cv); else host.prepend(cv);
  if (cfg.fixed) addEventListener("resize", resize);
  if (!cfg.fixed) new ResizeObserver(resize).observe(host);
  resize(); goals(); camPos.copy(goalPos); camTgt.copy(goalTgt);
  frame(0);
  const watch = cfg.fixed ? document.body : ((cfg.watch && document.querySelector(cfg.watch)) || host);
  new IntersectionObserver((es) => { visible = es[0].isIntersecting; visible ? kick() : halt(); }).observe(watch);
  document.addEventListener("visibilitychange", () => (document.hidden ? halt() : kick()));
  kick();
  return { setScene, layers };
}
