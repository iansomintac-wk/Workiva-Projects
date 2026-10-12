import { useEffect } from 'react';
import * as THREE from 'three';

/* Shared pointer position in normalized device coords, used by every scene for
   the subtle parallax drift. One listener for the whole page. */
export const pointer = { x: 0, y: 0 };
if (typeof window !== 'undefined') {
  window.addEventListener('pointermove', (e) => {
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
  }, { passive: true });
}

export const lerp = (a, b, t) => a + (b - a) * t;

/* Mounts a transparent WebGL canvas inside `ref`, with the camera + three-light
   rig every explainer scene shares. `build(ctx)` adds objects to ctx.scene and
   returns { update(t), onResize?(w, h), dispose? }. Rendering pauses while the
   element is off-screen. */
export function useThreeScene(ref, build, deps = []) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.className = 'three-canvas';
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 200);
    camera.position.set(0, 0, 14);
    scene.add(new THREE.AmbientLight(0xffffff, 0.75));
    const key = new THREE.DirectionalLight(0xffffff, 1.1); key.position.set(4, 6, 8); scene.add(key);
    const fill = new THREE.DirectionalLight(0xffffff, 0.35); fill.position.set(-6, -2, 4); scene.add(fill);

    const api = build({ THREE, scene, camera, renderer, el });

    const resize = () => {
      const w = el.clientWidth || 1, h = el.clientHeight || 1;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      if (api.onResize) api.onResize(w, h);
    };
    const ro = new ResizeObserver(resize);
    ro.observe(el);
    resize();

    let visible = true;
    const io = new IntersectionObserver((en) => { visible = en[0].isIntersecting; }, { rootMargin: '120px' });
    io.observe(el);

    let t = 0, raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (!visible) return;
      t += 0.016;
      api.update(t);
      renderer.render(scene, camera);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      if (api.dispose) api.dispose();
      scene.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) [].concat(o.material).forEach((m) => m.dispose());
      });
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
