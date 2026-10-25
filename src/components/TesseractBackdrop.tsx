import { useEffect, useRef } from 'react';
import { QUBIT_COLORS, hypercubeEdges } from '../game/hypercube';

const EDGES = hypercubeEdges(4);
const VERTICES = Array.from({ length: 16 }, (_, v) => [0, 1, 2, 3].map(k => (((v >> k) & 1) - 0.5) * 2));

/** Rotate in the (a, b) plane. */
function rotate(p: number[], a: number, b: number, angle: number) {
  const c = Math.cos(angle), s = Math.sin(angle);
  const pa = p[a], pb = p[b];
  p[a] = pa * c - pb * s;
  p[b] = pa * s + pb * c;
}

function project(t: number, size: number) {
  return VERTICES.map(v => {
    const p = v.slice();
    rotate(p, 0, 3, t * 0.21); // the 4D turn: x into w
    rotate(p, 1, 2, t * 0.13);
    rotate(p, 0, 2, 0.6 + t * 0.07);
    const w = 1 / (3 - p[3]); // 4D -> 3D
    const x = p[0] * w, y = p[1] * w, z = p[2] * w;
    const f = 1 / (2.2 - z); // 3D -> 2D
    return { x: size / 2 + x * f * size * 0.9, y: size / 2 + y * f * size * 0.9, depth: z };
  });
}

/**
 * A slowly turning tesseract (four-bit hypercube) behind the menus. The DOM is
 * updated directly each frame so the menus don't re-render.
 */
const TesseractBackdrop = ({ animate }: { animate: boolean }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const SIZE = 1000;

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const lines = [...svg.querySelectorAll('line')];
    const dots = [...svg.querySelectorAll('circle')];
    const draw = (t: number) => {
      const pts = project(t, SIZE);
      EDGES.forEach(({ a, b }, k) => {
        const line = lines[k];
        line.setAttribute('x1', pts[a].x.toFixed(1));
        line.setAttribute('y1', pts[a].y.toFixed(1));
        line.setAttribute('x2', pts[b].x.toFixed(1));
        line.setAttribute('y2', pts[b].y.toFixed(1));
        line.setAttribute('stroke-opacity', (0.1 + 0.12 * (1 + (pts[a].depth + pts[b].depth) / 2)).toFixed(3));
      });
      pts.forEach((p, v) => {
        dots[v].setAttribute('cx', p.x.toFixed(1));
        dots[v].setAttribute('cy', p.y.toFixed(1));
      });
    };
    if (!animate) {
      draw(4);
      return;
    }
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      draw(4 + (now - start) / 1000);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [animate]);

  return (
    <svg ref={svgRef} viewBox={`0 0 ${SIZE} ${SIZE}`} className="h-full w-full" aria-hidden="true">
      {EDGES.map(({ a, b, axis }) => (
        <line key={`${a}-${b}`} stroke={QUBIT_COLORS[axis]} strokeWidth={1.4} />
      ))}
      {VERTICES.map((_, v) => (
        <circle key={v} r={4} fill="#e0f7ff" fillOpacity={0.35} />
      ))}
    </svg>
  );
};

export default TesseractBackdrop;
