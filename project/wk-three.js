/* Workiva AI explainer — three.js web components.
   <wk-field accent density opacity>      background drift of wireframe primitives (absolute, fills parent)
   <wk-object shape accent secondary>     chapter hero object: sparkle | ledger | stack | shield | peers | graph | flow | check
   <wk-layers colors selected>            clickable slab stack → dispatches 'layerselect' {index}
   Requires window.THREE (three.min.js loaded first). */
(function () {
  const ready = (cb) => (window.THREE ? cb() : setTimeout(() => ready(cb), 40));
  const col = (hex, fallback) => new THREE.Color(hex || fallback);
  const lerp = (a, b, t) => a + (b - a) * t;
  let pointer = { x: 0, y: 0 };
  window.addEventListener('pointermove', (e) => {
    pointer = { x: (e.clientX / window.innerWidth) * 2 - 1, y: (e.clientY / window.innerHeight) * 2 - 1 };
  }, { passive: true });

  class Base extends HTMLElement {
    connectedCallback() { if (this._init) return; this._init = true; ready(() => this.setup()); }
    setup() {
      this.style.cssText += ';display:block;width:100%;height:100%;min-height:inherit;';
      if (!this.style.position) this.style.position = 'relative';
      const r = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
      r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      r.setClearColor(0x000000, 0);
      r.domElement.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;';
      this.appendChild(r.domElement);
      this.renderer = r;
      this.scene = new THREE.Scene();
      this.camera = new THREE.PerspectiveCamera(32, 1, 0.1, 200);
      this.camera.position.set(0, 0, 14);
      this.scene.add(new THREE.AmbientLight(0xffffff, 0.75));
      const key = new THREE.DirectionalLight(0xffffff, 1.1); key.position.set(4, 6, 8); this.scene.add(key);
      const fill = new THREE.DirectionalLight(0xffffff, 0.35); fill.position.set(-6, -2, 4); this.scene.add(fill);
      this.build();
      const resize = () => {
        const w = this.clientWidth || 1, h = this.clientHeight || 1;
        r.setSize(w, h, false); this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
        if (this.onResize) this.onResize(w, h);
      };
      this._ro = new ResizeObserver(resize); this._ro.observe(this); resize();
      this._visible = true;
      this._io = new IntersectionObserver((en) => { this._visible = en[0].isIntersecting; }, { rootMargin: '120px' });
      this._io.observe(this);
      this._t = 0;
      const tick = () => {
        this._raf = requestAnimationFrame(tick);
        if (!this._visible) return;
        this._t += 0.016;
        this.update(this._t);
        r.render(this.scene, this.camera);
      };
      tick();
    }
    disconnectedCallback() {
      cancelAnimationFrame(this._raf);
      if (this._ro) this._ro.disconnect();
      if (this._io) this._io.disconnect();
      if (this.renderer) { this.renderer.dispose(); this.renderer.forceContextLoss && this.renderer.forceContextLoss(); }
    }
  }

  /* ---------- background field ---------- */
  class Field extends Base {
    setup() { super.setup(); this.style.cssText += ';position:absolute;inset:0;overflow:hidden;pointer-events:none;'; }
    build() {
      const accent = col(this.getAttribute('accent'), '#333333');
      const density = parseInt(this.getAttribute('density') || '18', 10);
      const op = parseFloat(this.getAttribute('opacity') || '0.25');
      const geos = [
        new THREE.IcosahedronGeometry(1, 0), new THREE.OctahedronGeometry(1, 0),
        new THREE.TorusGeometry(0.8, 0.18, 8, 24), new THREE.BoxGeometry(1.2, 1.2, 1.2),
        new THREE.TetrahedronGeometry(1, 0)
      ];
      this.group = new THREE.Group(); this.scene.add(this.group);
      this.items = [];
      const rnd = (a, b) => a + Math.random() * (b - a);
      for (let i = 0; i < density; i++) {
        const wire = i % 3 !== 1;
        const mat = wire
          ? new THREE.MeshBasicMaterial({ color: accent, wireframe: true, transparent: true, opacity: op })
          : new THREE.MeshStandardMaterial({ color: accent, transparent: true, opacity: op * 0.9, roughness: 0.6, metalness: 0.05 });
        const m = new THREE.Mesh(geos[i % geos.length], mat);
        const z = rnd(-10, 1);
        m.position.set(rnd(-13, 13), rnd(-5.5, 5.5), z);
        const s = rnd(0.35, 1.1); m.scale.setScalar(s);
        m.rotation.set(rnd(0, 6), rnd(0, 6), 0);
        m.userData = { spin: rnd(-0.004, 0.004), drift: rnd(0.15, 0.4), phase: rnd(0, 6), y0: m.position.y };
        this.group.add(m); this.items.push(m);
      }
    }
    update(t) {
      for (const m of this.items) {
        m.rotation.x += m.userData.spin; m.rotation.y += m.userData.spin * 1.3;
        m.position.y = m.userData.y0 + Math.sin(t * m.userData.drift + m.userData.phase) * 0.35;
      }
      this.group.rotation.y = lerp(this.group.rotation.y, pointer.x * 0.06, 0.03);
      this.group.rotation.x = lerp(this.group.rotation.x, pointer.y * 0.04, 0.03);
    }
  }

  /* ---------- chapter object ---------- */
  class WkObject extends Base {
    build() {
      const A = col(this.getAttribute('accent'), '#0074E8');
      const B = col(this.getAttribute('secondary'), '#FCF4E8');
      const C = col(this.getAttribute('tertiary'), '#333333');
      const std = (c, o) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.55, metalness: 0.05, transparent: o !== undefined, opacity: o === undefined ? 1 : o });
      const wire = (c, o) => new THREE.MeshBasicMaterial({ color: c, wireframe: true, transparent: true, opacity: o || 0.5 });
      const line = (pts, c, o) => new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts.map((p) => new THREE.Vector3(...p))), new THREE.LineBasicMaterial({ color: c, transparent: true, opacity: o || 0.8 }));
      const g = new THREE.Group(); this.group = g; this.scene.add(g);
      this.anim = [];
      const shape = this.getAttribute('shape') || 'sparkle';
      if (shape === 'sparkle') {
        const core = new THREE.Mesh(new THREE.IcosahedronGeometry(2.1, 1), std(A)); g.add(core);
        const shell = new THREE.Mesh(new THREE.IcosahedronGeometry(3.2, 1), wire(B, 0.55)); g.add(shell);
        const ring = new THREE.Mesh(new THREE.TorusGeometry(4.2, 0.06, 8, 80), std(B)); ring.rotation.x = 1.2; g.add(ring);
        const pts = []; for (let i = 0; i < 260; i++) { const v = new THREE.Vector3().randomDirection().multiplyScalar(4.6 + Math.random() * 1.6); pts.push(v); }
        const cloud = new THREE.Points(new THREE.BufferGeometry().setFromPoints(pts), new THREE.PointsMaterial({ color: B, size: 0.07, transparent: true, opacity: 0.8 })); g.add(cloud);
        this.anim.push((t) => { shell.rotation.y = -t * 0.25; shell.rotation.x = t * 0.1; ring.rotation.z = t * 0.3; cloud.rotation.y = t * 0.08; core.rotation.y = t * 0.2; });
      } else if (shape === 'ledger') {
        const cols = 7, rows = 5, cell = 0.78, gap = 0.16;
        for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
          const h = 0.25 + ((r * 3 + c * 5) % 7) * 0.22 + (r === 0 ? 0.6 : 0);
          const hot = c === 4 && r > 0;
          const m = new THREE.Mesh(new THREE.BoxGeometry(cell, h, cell), std(r === 0 ? C : hot ? A : B));
          m.position.set((c - (cols - 1) / 2) * (cell + gap), h / 2 - 1.6, (r - (rows - 1) / 2) * (cell + gap));
          m.userData = { h, hot }; g.add(m);
          if (hot) this.anim.push((t) => { const s = 1 + Math.sin(t * 2 + c) * 0.08; m.scale.y = s; });
        }
        g.rotation.x = 0.5; g.rotation.y = -0.6;
        this.anim.push((t) => { g.rotation.y = -0.6 + Math.sin(t * 0.3) * 0.18; });
      } else if (shape === 'stack') {
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
            this.anim.push((t) => { badge.position.y = m.position.y + 0.9 + Math.sin(t * 1.6) * 0.18; });
          }
        }
        g.rotation.x = 0.55; g.rotation.y = -0.55;
        this.anim.push((t) => { g.rotation.y = -0.55 + Math.sin(t * 0.25) * 0.15; });
      } else if (shape === 'shield') {
        const core = new THREE.Mesh(new THREE.OctahedronGeometry(1.7, 0), std(A)); g.add(core);
        const r1 = new THREE.Mesh(new THREE.TorusGeometry(3.1, 0.09, 10, 90), std(B)); g.add(r1);
        const r2 = new THREE.Mesh(new THREE.TorusGeometry(3.7, 0.05, 8, 90), std(B, 0.7)); r2.rotation.x = Math.PI / 2; g.add(r2);
        const cage = new THREE.Mesh(new THREE.IcosahedronGeometry(2.6, 1), wire(B, 0.35)); g.add(cage);
        this.anim.push((t) => { core.rotation.y = t * 0.5; r1.rotation.y = t * 0.4; r1.rotation.x = Math.sin(t * 0.3) * 0.5; r2.rotation.z = t * 0.25; cage.rotation.y = -t * 0.15; });
      } else if (shape === 'peers') {
        const hs = [2.2, 3.4, 2.9, 4.6, 2.5, 3.8];
        hs.forEach((h, i) => {
          const hot = i === 3;
          const m = new THREE.Mesh(new THREE.BoxGeometry(0.9, h, 0.9), std(hot ? A : B));
          m.position.set((i - (hs.length - 1) / 2) * 1.35, h / 2 - 2.4, 0); g.add(m);
          this.anim.push((t) => { const s = 1 + Math.sin(t * 1.2 + i * 0.9) * 0.05; m.scale.y = s; m.position.y = (h * s) / 2 - 2.4; });
        });
        const base = new THREE.Mesh(new THREE.BoxGeometry(9.2, 0.14, 2.4), std(C)); base.position.y = -2.5; g.add(base);
        const dash = line([[-4.6, 1.2, 0.5], [4.6, 1.2, 0.5]], A, 0.9); g.add(dash);
        g.rotation.x = 0.35; g.rotation.y = -0.5;
        this.anim.push((t) => { g.rotation.y = -0.5 + Math.sin(t * 0.3) * 0.2; });
      } else if (shape === 'graph') {
        const nodes = [];
        for (let i = 0; i < 14; i++) {
          const v = new THREE.Vector3().randomDirection().multiplyScalar(2.4 + (i % 3) * 0.7);
          const hot = i % 5 === 0;
          const m = new THREE.Mesh(new THREE.SphereGeometry(hot ? 0.36 : 0.22, 20, 14), std(hot ? A : B));
          m.position.copy(v); g.add(m); nodes.push(m);
        }
        for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) {
          if (nodes[i].position.distanceTo(nodes[j].position) < 3.1) g.add(line([nodes[i].position.toArray(), nodes[j].position.toArray()], B, 0.45));
        }
        const cage = new THREE.Mesh(new THREE.IcosahedronGeometry(4.2, 1), wire(B, 0.18)); g.add(cage);
        this.anim.push((t) => { g.rotation.y = t * 0.18; g.rotation.x = Math.sin(t * 0.2) * 0.25; });
      } else if (shape === 'flow') {
        const pts = [[-4.2, 1.6, 0], [-1.4, 1.6, 0], [1.4, 1.6, 0], [1.4, -1.2, 0], [-1.4, -1.2, 0], [-4.2, -1.2, 0]];
        pts.forEach((p, i) => {
          const isDecision = i === 2;
          const m = isDecision
            ? new THREE.Mesh(new THREE.OctahedronGeometry(0.95, 0), std(A))
            : new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.1, 0.5), std(i === 4 ? A : B));
          if (isDecision) m.scale.set(1.2, 0.8, 0.5);
          m.position.set(...p); g.add(m);
        });
        g.add(line(pts, C, 0.9));
        g.add(line([[1.4, 1.6, 0], [4.0, 1.6, 0], [4.0, -1.2, 0], [1.4, -1.2, 0]], C, 0.5));
        const dot = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 12), std(A)); g.add(dot);
        this.anim.push((t) => {
          const k = (t * 0.35) % 1, seg = Math.floor(k * (pts.length - 1)), f = k * (pts.length - 1) - seg;
          const a = pts[seg], b = pts[seg + 1];
          dot.position.set(lerp(a[0], b[0], f), lerp(a[1], b[1], f), 0.55);
          g.rotation.y = Math.sin(t * 0.3) * 0.25; g.rotation.x = Math.sin(t * 0.2) * 0.12;
        });
      } else if (shape === 'check') {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(3.2, 0.32, 16, 90), std(B)); g.add(ring);
        const s1 = new THREE.Mesh(new THREE.BoxGeometry(0.6, 2.0, 0.6), std(A)); s1.position.set(-0.9, -0.5, 0); s1.rotation.z = -0.75; g.add(s1);
        const s2 = new THREE.Mesh(new THREE.BoxGeometry(0.6, 3.6, 0.6), std(A)); s2.position.set(0.55, 0.1, 0); s2.rotation.z = 0.7; g.add(s2);
        const bits = [];
        for (let i = 0; i < 8; i++) {
          const b = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), std(C)); g.add(b); bits.push(b);
        }
        this.anim.push((t) => {
          ring.rotation.y = Math.sin(t * 0.4) * 0.5;
          bits.forEach((b, i) => { const a = t * 0.5 + (i / bits.length) * Math.PI * 2; b.position.set(Math.cos(a) * 4.4, Math.sin(a) * 4.4 * 0.35, Math.sin(a) * 1.2); b.rotation.x = t + i; });
        });
      }
    }
    update(t) {
      for (const f of this.anim) f(t);
      this.group.position.x = lerp(this.group.position.x, pointer.x * 0.5, 0.04);
      this.group.position.y = lerp(this.group.position.y, -pointer.y * 0.35, 0.04);
    }
  }

  /* ---------- clickable layers ---------- */
  class Layers extends Base {
    build() {
      let colors = ['#B2B2B2', '#7CBEFF', '#8C4CBD', '#0074E8', '#66CC66', '#FBAD17', '#DE2800'];
      try { const c = JSON.parse(this.getAttribute('colors') || 'null'); if (Array.isArray(c)) colors = c; } catch (e) { /* ignore */ }
      this.n = colors.length;
      const gap = 0.92;
      this.slabs = [];
      const g = new THREE.Group(); this.group = g; this.scene.add(g);
      for (let i = 0; i < this.n; i++) {
        const m = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.34, 3.8), new THREE.MeshStandardMaterial({ color: col(colors[i]), roughness: 0.5, metalness: 0.05, transparent: true, opacity: 0.95 }));
        m.position.y = (i - (this.n - 1) / 2) * gap;
        m.userData = { i, ox: 0, op: 0.95, sc: 1 };
        const edge = new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry), new THREE.LineBasicMaterial({ color: 0x333333, transparent: true, opacity: 0.35 }));
        m.add(edge);
        g.add(m); this.slabs.push(m);
      }
      g.rotation.y = -0.55;
      this.camera.position.set(0, 4.5, 16); this.camera.lookAt(0, 0, 0);
      this.ray = new THREE.Raycaster(); this.hover = -1;
      const pick = (ev) => {
        const r = this.renderer.domElement.getBoundingClientRect();
        const v = new THREE.Vector2(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
        this.ray.setFromCamera(v, this.camera);
        const hit = this.ray.intersectObjects(this.slabs, false)[0];
        return hit ? hit.object.userData.i : -1;
      };
      const cv = this.renderer.domElement;
      cv.addEventListener('pointermove', (ev) => { this.hover = pick(ev); cv.style.cursor = this.hover >= 0 ? 'pointer' : 'default'; });
      cv.addEventListener('pointerleave', () => { this.hover = -1; });
      cv.addEventListener('click', (ev) => { const i = pick(ev); if (i >= 0) this.dispatchEvent(new CustomEvent('layerselect', { detail: { index: i }, bubbles: true })); });
    }
    onResize(w, h) { const fit = Math.max(1, (this.n * 0.92 + 2.5) / 7.5); this.camera.position.set(0, 4.5 * fit, 16 * fit); this.camera.lookAt(0, 0, 0); }
    update(t) {
      const sel = parseInt(this.getAttribute('selected') || '-1', 10);
      this.group.rotation.y = lerp(this.group.rotation.y, -0.55 + Math.sin(t * 0.25) * 0.06 + pointer.x * 0.08, 0.04);
      for (const m of this.slabs) {
        const d = m.userData, active = d.i === sel, hov = d.i === this.hover;
        d.ox = lerp(d.ox, active ? 1.4 : hov ? 0.5 : 0, 0.12);
        d.op = lerp(d.op, sel === -1 ? 0.95 : active ? 1 : 0.3, 0.12);
        d.sc = lerp(d.sc, active ? 1.06 : 1, 0.12);
        m.position.x = d.ox; m.material.opacity = d.op; m.scale.set(d.sc, 1, d.sc);
        m.children[0].material.opacity = 0.35 * d.op;
      }
    }
  }

  if (!customElements.get('wk-field')) customElements.define('wk-field', Field);
  if (!customElements.get('wk-object')) customElements.define('wk-object', WkObject);
  if (!customElements.get('wk-layers')) customElements.define('wk-layers', Layers);
})();
