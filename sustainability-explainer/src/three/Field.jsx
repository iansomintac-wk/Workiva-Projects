import React, { useRef } from 'react';
import { useThreeScene, pointer, lerp } from './useThreeScene.js';

/* Background drift of wireframe and solid primitives. Fills its positioned
   parent and ignores pointer events. */
export default function Field({ accent = '#333333', density = 18, opacity = 0.25 }) {
  const ref = useRef(null);
  useThreeScene(ref, ({ THREE, scene }) => {
    const color = new THREE.Color(accent);
    const geos = [
      new THREE.IcosahedronGeometry(1, 0), new THREE.OctahedronGeometry(1, 0),
      new THREE.TorusGeometry(0.8, 0.18, 8, 24), new THREE.BoxGeometry(1.2, 1.2, 1.2),
      new THREE.TetrahedronGeometry(1, 0)
    ];
    const group = new THREE.Group(); scene.add(group);
    const items = [];
    const rnd = (a, b) => a + Math.random() * (b - a);
    for (let i = 0; i < density; i++) {
      const wire = i % 3 !== 1;
      const mat = wire
        ? new THREE.MeshBasicMaterial({ color, wireframe: true, transparent: true, opacity })
        : new THREE.MeshStandardMaterial({ color, transparent: true, opacity: opacity * 0.9, roughness: 0.6, metalness: 0.05 });
      const m = new THREE.Mesh(geos[i % geos.length], mat);
      m.position.set(rnd(-13, 13), rnd(-5.5, 5.5), rnd(-10, 1));
      m.scale.setScalar(rnd(0.35, 1.1));
      m.rotation.set(rnd(0, 6), rnd(0, 6), 0);
      m.userData = { spin: rnd(-0.004, 0.004), drift: rnd(0.15, 0.4), phase: rnd(0, 6), y0: m.position.y };
      group.add(m); items.push(m);
    }
    return {
      update(t) {
        for (const m of items) {
          m.rotation.x += m.userData.spin; m.rotation.y += m.userData.spin * 1.3;
          m.position.y = m.userData.y0 + Math.sin(t * m.userData.drift + m.userData.phase) * 0.35;
        }
        group.rotation.y = lerp(group.rotation.y, pointer.x * 0.06, 0.03);
        group.rotation.x = lerp(group.rotation.x, pointer.y * 0.04, 0.03);
      }
    };
  }, [accent, density, opacity]);
  return <div ref={ref} className="three-field" aria-hidden="true" />;
}
