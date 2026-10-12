import React, { useEffect, useRef } from 'react';
import { useThreeScene, pointer, lerp } from './useThreeScene.js';

/* Clickable slab stack. The selected slab slides out; hovering nudges a slab.
   `onSelect(index)` fires when a slab is clicked. */
export default function Layers({ colors, selected, onSelect, className, label }) {
  const ref = useRef(null);
  const selRef = useRef(selected);
  const onSelectRef = useRef(onSelect);
  useEffect(() => { selRef.current = selected; }, [selected]);
  useEffect(() => { onSelectRef.current = onSelect; }, [onSelect]);

  useThreeScene(ref, ({ THREE, scene, camera, renderer }) => {
    const n = colors.length;
    const gap = 0.92;
    const slabs = [];
    const g = new THREE.Group(); scene.add(g);
    for (let i = 0; i < n; i++) {
      const m = new THREE.Mesh(
        new THREE.BoxGeometry(5.6, 0.34, 3.8),
        new THREE.MeshStandardMaterial({ color: new THREE.Color(colors[i]), roughness: 0.5, metalness: 0.05, transparent: true, opacity: 0.95 })
      );
      m.position.y = (i - (n - 1) / 2) * gap;
      m.userData = { i, ox: 0, op: 0.95, sc: 1 };
      m.add(new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry), new THREE.LineBasicMaterial({ color: 0x333333, transparent: true, opacity: 0.35 })));
      g.add(m); slabs.push(m);
    }
    g.rotation.y = -0.55;
    camera.position.set(0, 4.5, 16); camera.lookAt(0, 0, 0);

    const ray = new THREE.Raycaster();
    let hover = -1;
    const cv = renderer.domElement;
    const pick = (ev) => {
      const r = cv.getBoundingClientRect();
      const v = new THREE.Vector2(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(v, camera);
      const hit = ray.intersectObjects(slabs, false)[0];
      return hit ? hit.object.userData.i : -1;
    };
    const onMove = (ev) => { hover = pick(ev); cv.style.cursor = hover >= 0 ? 'pointer' : 'default'; };
    const onLeave = () => { hover = -1; };
    const onClick = (ev) => { const i = pick(ev); if (i >= 0 && onSelectRef.current) onSelectRef.current(i); };
    cv.addEventListener('pointermove', onMove);
    cv.addEventListener('pointerleave', onLeave);
    cv.addEventListener('click', onClick);

    return {
      onResize() {
        const fit = Math.max(1, (n * 0.92 + 2.5) / 7.5);
        camera.position.set(0, 4.5 * fit, 16 * fit); camera.lookAt(0, 0, 0);
      },
      update(t) {
        const sel = selRef.current;
        g.rotation.y = lerp(g.rotation.y, -0.55 + Math.sin(t * 0.25) * 0.06 + pointer.x * 0.08, 0.04);
        for (const m of slabs) {
          const d = m.userData, active = d.i === sel, hov = d.i === hover;
          d.ox = lerp(d.ox, active ? 1.4 : hov ? 0.5 : 0, 0.12);
          d.op = lerp(d.op, sel === -1 ? 0.95 : active ? 1 : 0.3, 0.12);
          d.sc = lerp(d.sc, active ? 1.06 : 1, 0.12);
          m.position.x = d.ox; m.material.opacity = d.op; m.scale.set(d.sc, 1, d.sc);
          m.children[0].material.opacity = 0.35 * d.op;
        }
      },
      dispose() {
        cv.removeEventListener('pointermove', onMove);
        cv.removeEventListener('pointerleave', onLeave);
        cv.removeEventListener('click', onClick);
      }
    };
  }, [colors.join(',')]);

  return <div ref={ref} className={className} role="img" aria-label={label} />;
}
