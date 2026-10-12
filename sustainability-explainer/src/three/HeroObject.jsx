import React, { useRef } from 'react';
import { useThreeScene, pointer, lerp } from './useThreeScene.js';

/* Chapter hero objects. Each builder adds meshes to `g` and returns a list of
   per-frame animation callbacks. */
const shapes = {
  // 01 what it is: core + wire shell + ring + point cloud
  sparkle({ THREE, g, A, B, std, wire }) {
    const core = new THREE.Mesh(new THREE.IcosahedronGeometry(2.1, 1), std(A)); g.add(core);
    const shell = new THREE.Mesh(new THREE.IcosahedronGeometry(3.2, 1), wire(B, 0.55)); g.add(shell);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(4.2, 0.06, 8, 80), std(B)); ring.rotation.x = 1.2; g.add(ring);
    const pts = [];
    for (let i = 0; i < 260; i++) pts.push(new THREE.Vector3().randomDirection().multiplyScalar(4.6 + Math.random() * 1.6));
    const cloud = new THREE.Points(new THREE.BufferGeometry().setFromPoints(pts), new THREE.PointsMaterial({ color: B, size: 0.07, transparent: true, opacity: 0.8 }));
    g.add(cloud);
    return [(t) => { shell.rotation.y = -t * 0.25; shell.rotation.x = t * 0.1; ring.rotation.z = t * 0.3; cloud.rotation.y = t * 0.08; core.rotation.y = t * 0.2; }];
  },

  // 02 capabilities: stacked document slabs with a floating badge
  stack({ THREE, g, A, B, C, std }) {
    const anim = [];
    const n = 6;
    for (let i = 0; i < n; i++) {
      const top = i === n - 1;
      const m = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.16, 6.2), std(top ? B : i % 2 ? C : B, top ? 1 : 0.95));
      m.position.set(Math.sin(i * 1.7) * 0.28, (i - n / 2) * 0.42, Math.cos(i * 1.3) * 0.2);
      m.rotation.y = Math.sin(i * 2.1) * 0.12; g.add(m);
      if (top) {
        for (let k = 0; k < 6; k++) {
          const w = k === 1 ? 2.2 : 3.4 - (k % 3) * 0.4;
          const ln = new THREE.Mesh(new THREE.BoxGeometry(w, 0.05, 0.22), std(k === 1 ? A : C));
          ln.position.set(-2.3 + w / 2 + 0.6, m.position.y + 0.11, -2.4 + k * 0.85); g.add(ln);
        }
        const badge = new THREE.Mesh(new THREE.SphereGeometry(0.42, 24, 16), std(A));
        badge.position.set(1.7, m.position.y + 0.9, 2.2); g.add(badge);
        anim.push((t) => { badge.position.y = m.position.y + 0.9 + Math.sin(t * 1.6) * 0.18; });
      }
    }
    g.rotation.x = 0.55; g.rotation.y = -0.55;
    anim.push((t) => { g.rotation.y = -0.55 + Math.sin(t * 0.25) * 0.15; });
    return anim;
  },

  // 03 use cases: a ledger grid with one pulsing column
  ledger({ THREE, g, A, B, C, std }) {
    const anim = [];
    const cols = 7, rows = 5, cell = 0.78, gap = 0.16;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const h = 0.25 + ((r * 3 + c * 5) % 7) * 0.22 + (r === 0 ? 0.6 : 0);
      const hot = c === 4 && r > 0;
      const m = new THREE.Mesh(new THREE.BoxGeometry(cell, h, cell), std(r === 0 ? C : hot ? A : B));
      m.position.set((c - (cols - 1) / 2) * (cell + gap), h / 2 - 1.6, (r - (rows - 1) / 2) * (cell + gap));
      g.add(m);
      if (hot) anim.push((t) => { m.scale.y = 1 + Math.sin(t * 2 + c) * 0.08; });
    }
    g.rotation.x = 0.5; g.rotation.y = -0.6;
    anim.push((t) => { g.rotation.y = -0.6 + Math.sin(t * 0.3) * 0.18; });
    return anim;
  },

  // 04 walkthrough: bar row with a benchmark line
  peers({ THREE, g, A, B, C, std, line }) {
    const anim = [];
    const hs = [2.2, 3.4, 2.9, 4.6, 2.5, 3.8];
    hs.forEach((h, i) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(0.9, h, 0.9), std(i === 3 ? A : B));
      m.position.set((i - (hs.length - 1) / 2) * 1.35, h / 2 - 2.4, 0); g.add(m);
      anim.push((t) => { const s = 1 + Math.sin(t * 1.2 + i * 0.9) * 0.05; m.scale.y = s; m.position.y = (h * s) / 2 - 2.4; });
    });
    const base = new THREE.Mesh(new THREE.BoxGeometry(9.2, 0.14, 2.4), std(C)); base.position.y = -2.5; g.add(base);
    g.add(line([[-4.6, 1.2, 0.5], [4.6, 1.2, 0.5]], A, 0.9));
    g.rotation.x = 0.35; g.rotation.y = -0.5;
    anim.push((t) => { g.rotation.y = -0.5 + Math.sin(t * 0.3) * 0.2; });
    return anim;
  },

  // 05 questions: octahedron core inside rings and a wire cage
  shield({ THREE, g, A, B, std, wire }) {
    const core = new THREE.Mesh(new THREE.OctahedronGeometry(1.7, 0), std(A)); g.add(core);
    const r1 = new THREE.Mesh(new THREE.TorusGeometry(3.1, 0.09, 10, 90), std(B)); g.add(r1);
    const r2 = new THREE.Mesh(new THREE.TorusGeometry(3.7, 0.05, 8, 90), std(B, 0.7)); r2.rotation.x = Math.PI / 2; g.add(r2);
    const cage = new THREE.Mesh(new THREE.IcosahedronGeometry(2.6, 1), wire(B, 0.35)); g.add(cage);
    return [(t) => { core.rotation.y = t * 0.5; r1.rotation.y = t * 0.4; r1.rotation.x = Math.sin(t * 0.3) * 0.5; r2.rotation.z = t * 0.25; cage.rotation.y = -t * 0.15; }];
  },

  // 06 roadmap: check mark in a ring with orbiting blocks
  check({ THREE, g, A, B, C, std }) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(3.2, 0.32, 16, 90), std(B)); g.add(ring);
    const s1 = new THREE.Mesh(new THREE.BoxGeometry(0.6, 2.0, 0.6), std(A)); s1.position.set(-0.9, -0.5, 0); s1.rotation.z = -0.75; g.add(s1);
    const s2 = new THREE.Mesh(new THREE.BoxGeometry(0.6, 3.6, 0.6), std(A)); s2.position.set(0.55, 0.1, 0); s2.rotation.z = 0.7; g.add(s2);
    const bits = [];
    for (let i = 0; i < 8; i++) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), std(C)); g.add(b); bits.push(b); }
    return [(t) => {
      ring.rotation.y = Math.sin(t * 0.4) * 0.5;
      bits.forEach((b, i) => {
        const a = t * 0.5 + (i / bits.length) * Math.PI * 2;
        b.position.set(Math.cos(a) * 4.4, Math.sin(a) * 4.4 * 0.35, Math.sin(a) * 1.2);
        b.rotation.x = t + i;
      });
    }];
  }
};

export default function HeroObject({ shape, accent = '#0074E8', secondary = '#FCF4E8', tertiary = '#333333' }) {
  const ref = useRef(null);
  useThreeScene(ref, ({ THREE, scene }) => {
    const A = new THREE.Color(accent), B = new THREE.Color(secondary), C = new THREE.Color(tertiary);
    const std = (c, o) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.55, metalness: 0.05, transparent: o !== undefined, opacity: o === undefined ? 1 : o });
    const wire = (c, o) => new THREE.MeshBasicMaterial({ color: c, wireframe: true, transparent: true, opacity: o || 0.5 });
    const line = (pts, c, o) => new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(pts.map((p) => new THREE.Vector3(...p))),
      new THREE.LineBasicMaterial({ color: c, transparent: true, opacity: o || 0.8 })
    );
    const g = new THREE.Group(); scene.add(g);
    const anim = shapes[shape]({ THREE, g, A, B, C, std, wire, line });
    return {
      update(t) {
        for (const f of anim) f(t);
        g.position.x = lerp(g.position.x, pointer.x * 0.5, 0.04);
        g.position.y = lerp(g.position.y, -pointer.y * 0.35, 0.04);
      }
    };
  }, [shape, accent, secondary, tertiary]);
  return <div ref={ref} className="three-object" aria-hidden="true" />;
}
