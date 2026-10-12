/* bg-three: floating 3D-projected accent field; context-layers-3d: clickable layer stack.
   Self-contained Canvas 2D pseudo-3D — no external libraries, safe for offline/published bundles. */
(function () {
  const DPR = () => Math.min(window.devicePixelRatio || 1, 2);
  function hexRGB(hex) {
    const h = hex.replace('#', '');
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }
  const rgba = (c, a) => 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')';
  const shade = (c, f) => [Math.round(c[0] * f), Math.round(c[1] * f), Math.round(c[2] * f)];

  class BgThree extends HTMLElement {
    connectedCallback() {
      if (this._init) return; this._init = true;
      this.style.cssText += ';display:block;position:absolute;inset:0;overflow:hidden;pointer-events:none;';
      const accent = hexRGB(this.getAttribute('accent') || '#0074E8');
      const density = parseInt(this.getAttribute('density') || '24', 10);
      const baseOp = parseFloat(this.getAttribute('opacity') || '0.4');
      const canvas = document.createElement('canvas');
      canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;';
      this.appendChild(canvas);
      const ctx = canvas.getContext('2d');
      let W = 1, H = 1;
      const size = () => {
        W = this.clientWidth || 1; H = this.clientHeight || 1;
        canvas.width = W * DPR(); canvas.height = H * DPR();
        ctx.setTransform(DPR(), 0, 0, DPR(), 0, 0);
      };
      this._ro = new ResizeObserver(size); this._ro.observe(this); size();
      const rnd = (a, b) => a + Math.random() * (b - a);
      const shapes = [];
      for (let i = 0; i < density; i++) {
        shapes.push({
          x: rnd(-1.15, 1.15), y: rnd(-0.6, 0.6), z: rnd(0.5, 2.2),
          r: rnd(10, 30), kind: i % 4, wire: i % 3 === 0,
          rot: rnd(0, Math.PI * 2), spin: rnd(-0.006, 0.006),
          drift: rnd(0.1, 0.35), phase: rnd(0, Math.PI * 2)
        });
      }
      let t = 0;
      const drawShape = (s, px, py, pr, op) => {
        ctx.save();
        ctx.translate(px, py); ctx.rotate(s.rot);
        ctx.beginPath();
        if (s.kind === 0) { // triangle
          for (let k = 0; k < 3; k++) { const a = k * 2.094 - Math.PI / 2; k ? ctx.lineTo(Math.cos(a) * pr, Math.sin(a) * pr) : ctx.moveTo(Math.cos(a) * pr, Math.sin(a) * pr); }
          ctx.closePath();
        } else if (s.kind === 1) { // ring
          ctx.arc(0, 0, pr, 0, Math.PI * 2);
          if (!s.wire) { ctx.arc(0, 0, pr * 0.55, 0, Math.PI * 2, true); }
        } else if (s.kind === 2) { // hexagon
          for (let k = 0; k < 6; k++) { const a = k * 1.047; k ? ctx.lineTo(Math.cos(a) * pr, Math.sin(a) * pr) : ctx.moveTo(Math.cos(a) * pr, Math.sin(a) * pr); }
          ctx.closePath();
        } else { // square
          ctx.rect(-pr * 0.8, -pr * 0.8, pr * 1.6, pr * 1.6);
        }
        if (s.wire) { ctx.strokeStyle = rgba(accent, op * 0.7); ctx.lineWidth = 1.5; ctx.stroke(); }
        else { ctx.fillStyle = rgba(accent, op); ctx.fill(); }
        ctx.restore();
      };
      const tick = () => {
        this._raf = requestAnimationFrame(tick);
        t += 0.016;
        ctx.clearRect(0, 0, W, H);
        const sway = Math.sin(t * 0.12) * 0.03;
        for (const s of shapes) {
          s.rot += s.spin;
          const yy = s.y + Math.sin(t * s.drift + s.phase) * 0.045;
          const persp = 1 / s.z;
          const px = (s.x + sway * s.z) * persp * W * 0.55 + W / 2;
          const py = yy * persp * H * 0.9 + H / 2;
          drawShape(s, px, py, s.r * persp * 1.6, baseOp * Math.min(1, 1.4 / s.z));
        }
      };
      tick();
    }
    disconnectedCallback() { cancelAnimationFrame(this._raf); if (this._ro) this._ro.disconnect(); }
  }
  if (!customElements.get('bg-three')) customElements.define('bg-three', BgThree);

  class ContextLayers3D extends HTMLElement {
    connectedCallback() {
      if (this._init) return; this._init = true;
      this.style.cssText += ';display:block;position:relative;';
      let colors = ['#B2B2B2', '#7CBEFF', '#8C4CBD', '#0074E8', '#66CC66', '#FBAD17', '#DE2800'];
      try { const c = JSON.parse(this.getAttribute('colors') || 'null'); if (Array.isArray(c)) colors = c; } catch (e) {}
      const n = parseInt(this.getAttribute('count') || String(colors.length), 10);
      const rgb = colors.map(hexRGB);
      const canvas = document.createElement('canvas');
      canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;';
      this.appendChild(canvas);
      const ctx = canvas.getContext('2d');
      let W = 1, H = 1;
      const size = () => {
        W = this.clientWidth || 1; H = this.clientHeight || 1;
        canvas.width = W * DPR(); canvas.height = H * DPR();
        ctx.setTransform(DPR(), 0, 0, DPR(), 0, 0);
      };
      this._ro = new ResizeObserver(size); this._ro.observe(this); size();
      // slab geometry (world units)
      const bw = 5.6, bd = 3.8, bh = 0.34, gap = 0.92;
      const state = [];
      for (let i = 0; i < n; i++) state.push({ ox: 0, op: 0.92, sc: 1 });
      let angle = -0.5, t = 0, hover = -1;
      let lastQuads = [];
      const project = (x, y, z, scale, cx, cy) => {
        const rx = x * Math.cos(angle) - z * Math.sin(angle);
        const rz = x * Math.sin(angle) + z * Math.cos(angle);
        return [cx + rx * scale, cy - y * scale * 0.86 + rz * scale * 0.36];
      };
      const tick = () => {
        this._raf = requestAnimationFrame(tick);
        t += 0.016;
        const sel = parseInt(this.getAttribute('selected') || '-1', 10);
        angle += ((-0.5 + Math.sin(t * 0.25) * 0.06) - angle) * 0.04;
        ctx.clearRect(0, 0, W, H);
        const scale = Math.min(W / 11.5, H / ((n + 1.6) * gap * 1.02));
        const cx = W / 2, cy = H / 2 + ((n - 1) / 2) * gap * scale * 0.86 * 0 + 0;
        lastQuads = [];
        for (let i = 0; i < n; i++) {
          const st = state[i];
          const active = i === sel, hov = i === hover;
          st.ox += ((active ? 1.15 : (hov ? 0.45 : 0)) - st.ox) * 0.12;
          st.op += ((sel === -1 ? 0.92 : (active ? 1 : 0.28)) - st.op) * 0.12;
          st.sc += ((active ? 1.05 : 1) - st.sc) * 0.12;
          const y = (i - (n - 1) / 2) * gap;
          const hw = (bw / 2) * st.sc, hd = (bd / 2) * st.sc, x0 = st.ox;
          const yTop = y + bh / 2, yBot = y - bh / 2;
          const cT = [
            project(x0 - hw, yTop, -hd, scale, cx, cy), project(x0 + hw, yTop, -hd, scale, cx, cy),
            project(x0 + hw, yTop, hd, scale, cx, cy), project(x0 - hw, yTop, hd, scale, cx, cy)
          ];
          const cB = [
            project(x0 - hw, yBot, -hd, scale, cx, cy), project(x0 + hw, yBot, -hd, scale, cx, cy),
            project(x0 + hw, yBot, hd, scale, cx, cy), project(x0 - hw, yBot, hd, scale, cx, cy)
          ];
          const col = rgb[i % rgb.length];
          const poly = (pts) => { ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (let k = 1; k < pts.length; k++) ctx.lineTo(pts[k][0], pts[k][1]); ctx.closePath(); };
          // side faces (front two, depending on rotation sign both z+ face and x- or x+ face show)
          poly([cT[3], cT[2], cB[2], cB[3]]); ctx.fillStyle = rgba(shade(col, 0.72), st.op); ctx.fill();
          poly([cT[0], cT[3], cB[3], cB[0]]); ctx.fillStyle = rgba(shade(col, 0.55), st.op); ctx.fill();
          // top face
          poly(cT); ctx.fillStyle = rgba(col, st.op); ctx.fill();
          ctx.strokeStyle = 'rgba(51,51,51,' + (0.3 * st.op) + ')'; ctx.lineWidth = 1; ctx.stroke();
          lastQuads.push({ i, quad: cT });
        }
      };
      tick();
      const inPoly = (px, py, q) => {
        let inside = false;
        for (let a = 0, b = q.length - 1; a < q.length; b = a++) {
          if ((q[a][1] > py) !== (q[b][1] > py) && px < (q[b][0] - q[a][0]) * (py - q[a][1]) / (q[b][1] - q[a][1]) + q[a][0]) inside = !inside;
        }
        return inside;
      };
      const pick = (ev) => {
        const r = canvas.getBoundingClientRect();
        const px = ev.clientX - r.left, py = ev.clientY - r.top;
        for (let k = lastQuads.length - 1; k >= 0; k--) if (inPoly(px, py, lastQuads[k].quad)) return lastQuads[k].i;
        return -1;
      };
      canvas.addEventListener('pointermove', (ev) => { hover = pick(ev); canvas.style.cursor = hover >= 0 ? 'pointer' : 'default'; });
      canvas.addEventListener('pointerleave', () => { hover = -1; });
      canvas.addEventListener('click', (ev) => {
        const i = pick(ev);
        if (i >= 0) this.dispatchEvent(new CustomEvent('layerselect', { detail: { index: i }, bubbles: true }));
      });
    }
    disconnectedCallback() { cancelAnimationFrame(this._raf); if (this._ro) this._ro.disconnect(); }
  }
  if (!customElements.get('context-layers-3d')) customElements.define('context-layers-3d', ContextLayers3D);
})();
