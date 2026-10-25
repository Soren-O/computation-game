import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import type { GateMarks, StageFrame } from '../../game/animation';
import GateMarksLayer from './GateMarksLayer';
import { QUBIT_COLORS, defaultView, layoutHypercube, type View } from '../../game/hypercube';
import { EPS, cAbs, formatAmplitude, indexToBits, type Complex, type QState } from '../../game/quantum';

interface HypercubeStageProps {
  qubits: number;
  visual: 'bit' | 'qubit';
  frame: StageFrame;
  /** Drawn as dashed ghost arrows / rings. */
  target: QState | null;
  /** Qubits the playing column acts on; their edges glow. */
  activeAxes: number[];
  view: View;
  onViewChange: (view: View) => void;
  /** Sandbox: tap or drag the ball to a corner to start there. */
  onPickStart?: (index: number) => void;
  /** Briefly celebrate a solved puzzle. */
  celebrate: boolean;
  /** What the playing column does: walkways and turn arrows. */
  marks: GateMarks | null;
  marksOpacity: number;
  /** False keeps the marks still (reduce-motion). */
  animateMarks: boolean;
}

interface Size {
  width: number;
  height: number;
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** An arrow from (x, y) along the complex value v, where 1 unit = `unit` px and +i points up. */
function Arrow({ x, y, v, unit, color, opacity, width }: { x: number; y: number; v: Complex; unit: number; color: string; opacity: number; width: number }) {
  const len = cAbs(v) * unit;
  if (len < 0.5 || opacity < 0.01) return null;
  const dx = (v.re * unit) / len;
  const dy = (-v.im * unit) / len;
  // Short arrows keep a readable head; the head never overshoots the arrow's length.
  const head = Math.min(len, Math.max(4.5, Math.min(len * 0.38, unit * 0.24)));
  const tipX = x + dx * len;
  const tipY = y + dy * len;
  const baseX = tipX - dx * head;
  const baseY = tipY - dy * head;
  const halfW = head * 0.55;
  return (
    <g opacity={opacity}>
      <line x1={x} y1={y} x2={baseX + dx * head * 0.2} y2={baseY + dy * head * 0.2} stroke={color} strokeWidth={width} strokeLinecap="round" />
      <polygon points={`${tipX},${tipY} ${baseX - dy * halfW},${baseY + dx * halfW} ${baseX + dy * halfW},${baseY - dx * halfW}`} fill={color} />
    </g>
  );
}

const HypercubeStage = ({ qubits, visual, frame, target, activeAxes, view, onViewChange, onPickStart, celebrate, marks, marksOpacity, animateMarks }: HypercubeStageProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<Size>({ width: 0, height: 0 });
  const [hovered, setHovered] = useState<number | null>(null);
  const [drag, setDrag] = useState<{ kind: 'rotate' | 'ball'; from: number; x: number; y: number; moved: boolean } | null>(null);
  const dragStart = useRef({ x: 0, y: 0, view });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setSize({ width: entry.contentRect.width, height: entry.contentRect.height }));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const layout = useMemo(
    () => (size.width > 0 ? layoutHypercube(qubits, view, size.width, size.height) : null),
    [qubits, view, size.width, size.height],
  );

  // Rotating the cube, or dragging the start ball in sandbox mode.
  useEffect(() => {
    if (!drag || !layout) return;
    const toLocal = (e: PointerEvent) => {
      const rect = containerRef.current!.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    const onMove = (e: PointerEvent) => {
      const p = toLocal(e);
      const dx = p.x - dragStart.current.x;
      const dy = p.y - dragStart.current.y;
      const moved = drag.moved || Math.hypot(dx, dy) > 6;
      if (drag.kind === 'rotate') {
        const v = dragStart.current.view;
        onViewChange({ yaw: v.yaw + dx * 0.008, pitch: Math.max(-1.3, Math.min(1.3, v.pitch + dy * 0.008)) });
      }
      setDrag({ ...drag, x: p.x, y: p.y, moved });
    };
    const onUp = (e: PointerEvent) => {
      if (drag.kind === 'ball' && onPickStart) {
        const p = toLocal(e);
        let best = drag.from;
        let bestDist = Infinity;
        layout.points.forEach((pt, v) => {
          const d = Math.hypot(pt.x - p.x, pt.y - p.y);
          if (d < bestDist) {
            bestDist = d;
            best = v;
          }
        });
        onPickStart(drag.moved && bestDist < layout.radius * 1.6 ? best : drag.from);
      }
      setDrag(null);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [drag, layout, onPickStart, onViewChange]);

  const startDrag = (e: ReactPointerEvent, kind: 'rotate' | 'ball', from = 0) => {
    const rect = containerRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    dragStart.current = { x, y, view };
    setDrag({ kind, from, x, y, moved: false });
  };

  const canRotate = qubits >= 3;

  if (!layout) return <div ref={containerRef} className="absolute inset-0" />;

  const { points, edges, radius } = layout;
  const order = points.map((_, v) => v).sort((a, b) => points[a].depth - points[b].depth);
  const minDepth = Math.min(...points.map(p => p.depth));
  const maxDepth = Math.max(...points.map(p => p.depth));
  const fade = (v: number) => (maxDepth - minDepth < 1e-6 ? 1 : lerp(0.45, 1, (points[v].depth - minDepth) / (maxDepth - minDepth)));
  const r = (v: number) => radius * points[v].scale;
  const labelSize = Math.max(10, Math.min(15, radius * 0.3));
  const routeSet = new Set(frame.routes.map(([a, b]) => `${Math.min(a, b)}-${Math.max(a, b)}`));
  const arrowWidth = Math.max(1.8, radius * 0.075);

  return (
    <div ref={containerRef} className="absolute inset-0">
      <svg
        width={size.width}
        height={size.height}
        className={`block select-none touch-none ${canRotate ? (drag?.kind === 'rotate' ? 'cursor-grabbing' : 'cursor-grab') : ''}`}
        onPointerDown={e => canRotate && startDrag(e, 'rotate')}
        onDoubleClick={() => canRotate && onViewChange(defaultView(qubits))}
      >
        <defs>
          <filter id="hc-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <radialGradient id="hc-node" cx="50%" cy="40%" r="65%">
            <stop offset="0%" stopColor="#14142e" />
            <stop offset="100%" stopColor="#07070f" />
          </radialGradient>
          <radialGradient id="hc-disk" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#4cc9f0" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#4cc9f0" stopOpacity="0.18" />
          </radialGradient>
          <radialGradient id="hc-ball" cx="35%" cy="32%" r="70%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="55%" stopColor="#a5e8fb" />
            <stop offset="100%" stopColor="#4cc9f0" />
          </radialGradient>
        </defs>

        {/* Edges, coloured by the qubit (wire) they belong to */}
        {edges.map(({ a, b, axis }) => {
          const active = activeAxes.includes(axis);
          const carrying = routeSet.has(`${a}-${b}`);
          const depthFade = Math.min(fade(a), fade(b));
          return (
            <line
              key={`${a}-${b}`}
              x1={points[a].x}
              y1={points[a].y}
              x2={points[b].x}
              y2={points[b].y}
              stroke={QUBIT_COLORS[axis]}
              strokeWidth={carrying ? 3 : active ? 2 : 1.25}
              strokeOpacity={(carrying ? 0.95 : active ? 0.55 : 0.22) * depthFade}
              filter={carrying ? 'url(#hc-glow)' : undefined}
            />
          );
        })}

        {/* Routes that aren't single edges (gates on several wires at once) */}
        {frame.routes
          .filter(([a, b]) => {
            const diff = a ^ b;
            return diff & (diff - 1);
          })
          .map(([a, b]) => (
            <line key={`route-${a}-${b}`} x1={points[a].x} y1={points[a].y} x2={points[b].x} y2={points[b].y} stroke="#ffffff" strokeOpacity={0.25} strokeDasharray="4 6" />
          ))}

        {/* Corners */}
        {order.map(v => {
          const p = points[v];
          const R = r(v);
          const alpha = fade(v);
          const disk = frame.disks[v] ?? 0;
          const t = target?.[v];
          const tLen = t ? cAbs(t) : 0;
          const isStartPick = !!onPickStart;
          return (
            <g
              key={v}
              transform={`translate(${p.x}, ${p.y})`}
              opacity={alpha}
              onPointerEnter={() => setHovered(v)}
              onPointerLeave={() => setHovered(h => (h === v ? null : h))}
              onPointerDown={e => {
                if (!isStartPick) return;
                e.stopPropagation();
                startDrag(e, 'ball', v);
              }}
              className={isStartPick ? 'cursor-pointer' : undefined}
            >
              <circle r={R} fill="url(#hc-node)" stroke={celebrate && tLen > EPS ? '#4ade80' : '#ffffff'} strokeOpacity={celebrate && tLen > EPS ? 0.9 : 0.16} strokeWidth={celebrate && tLen > EPS ? 2.5 : 1.25} />
              {visual === 'qubit' && (
                <>
                  {/* complex-plane axes */}
                  <line x1={-R} y1={0} x2={R} y2={0} stroke="#ffffff" strokeOpacity={0.06} />
                  <line x1={0} y1={-R} x2={0} y2={R} stroke="#ffffff" strokeOpacity={0.06} />
                  {disk > EPS && <circle r={disk * R} fill="url(#hc-disk)" />}
                </>
              )}
              {t && tLen > EPS && (
                <g opacity={0.9}>
                  {visual === 'qubit' ? (
                    <>
                      <circle r={tLen * R} fill="none" stroke="#f72585" strokeOpacity={0.55} strokeDasharray="3 4" strokeWidth={1.25} />
                      <line x1={0} y1={0} x2={t.re * R} y2={-t.im * R} stroke="#f72585" strokeWidth={1.5} strokeDasharray="4 3" />
                      <circle cx={t.re * R} cy={-t.im * R} r={Math.max(2.5, R * 0.06)} fill="#f72585" />
                    </>
                  ) : (
                    <circle r={R * 0.72} fill="none" stroke="#f72585" strokeWidth={2} strokeDasharray="5 5" />
                  )}
                </g>
              )}
              {radius >= 13 && (
                <text y={R + labelSize + 3} textAnchor="middle" fontSize={labelSize} className="font-mono" fill="#cbd5e1" fillOpacity={disk > EPS ? 0.95 : 0.45}>
                  |{indexToBits(v, qubits)}⟩
                </text>
              )}
            </g>
          );
        })}

        {/* What the playing gate does */}
        {marks && <GateMarksLayer marks={marks} points={points} radius={radius} opacity={marksOpacity} animate={animateMarks} />}

        {/* Amplitudes: arrows (qubit) or balls (bit) */}
        <g filter="url(#hc-glow)" pointerEvents="none">
          {frame.arrows.map(a => {
            const from = points[a.from];
            const to = points[a.to];
            const x = lerp(from.x, to.x, a.travel);
            const y = lerp(from.y, to.y, a.travel);
            const R = radius * lerp(from.scale, to.scale, a.travel);
            const alpha = lerp(fade(a.from), fade(a.to), a.travel);
            if (visual === 'bit') {
              if (cAbs(a.value) < 0.5) return null;
              return <circle key={a.key} cx={x} cy={y} r={R * 0.52} fill="url(#hc-ball)" opacity={a.opacity * alpha} />;
            }
            return (
              <Arrow
                key={a.key}
                x={x + a.offset.re * R}
                y={y - a.offset.im * R}
                v={a.value}
                unit={R}
                color={a.kind === 'sum' ? '#e0f7ff' : '#7dd3fc'}
                opacity={a.opacity * Math.max(alpha, 0.7)}
                width={arrowWidth * (a.kind === 'sum' ? 1 : 0.85)}
              />
            );
          })}
        </g>

        {/* Ball being dragged to a new starting corner */}
        {drag?.kind === 'ball' && drag.moved && <circle cx={drag.x} cy={drag.y} r={radius * 0.45} fill="url(#hc-ball)" opacity={0.75} pointerEvents="none" />}
      </svg>

      {hovered !== null && !drag && (
        <div
          className="pointer-events-none absolute z-10 rounded-lg border border-white/10 bg-[#0a0a18]/95 px-3 py-2 text-xs shadow-xl backdrop-blur"
          style={{
            left: Math.min(points[hovered].x + r(hovered) + 8, size.width - 170),
            top: Math.max(4, points[hovered].y - r(hovered)),
          }}
        >
          <div className="font-mono text-sm text-white">|{indexToBits(hovered, qubits)}⟩</div>
          <div className="mt-1 text-gray-400">
            amplitude <span className="font-mono text-quantum-cyan">{formatAmplitude(frame.state[hovered])}</span>
          </div>
          <div className="text-gray-400">
            probability <span className="font-mono text-quantum-cyan">{(cAbs(frame.state[hovered]) ** 2 * 100).toFixed(1)}%</span>
          </div>
          {target && <div className="text-gray-400">goal <span className="font-mono text-quantum-magenta">{formatAmplitude(target[hovered])}</span></div>}
        </div>
      )}
    </div>
  );
};

export default HypercubeStage;
