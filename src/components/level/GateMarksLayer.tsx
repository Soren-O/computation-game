import type { GateMarks, Lane, Spin } from '../../game/animation';
import type { ProjectedPoint } from '../../game/hypercube';
import { cPolar, formatAmplitude } from '../../game/quantum';
import { CELL_INFO } from './cells';

interface GateMarksLayerProps {
  marks: GateMarks;
  points: ProjectedPoint[];
  /** Node radius in px before perspective. */
  radius: number;
  opacity: number;
  /** False draws everything still (reduce-motion). */
  animate: boolean;
}

const colorOf = (gate: Lane['gate']) => (gate === 'SWAP' ? '#e2e8f0' : CELL_INFO[gate].color);
const factorLabel = (turn: number) => `×${formatAmplitude(cPolar(1, turn))}`;

/** Points on a circle of radius r, angle in the complex plane's sense (counterclockwise, y up). */
const onCircle = (r: number, angle: number) => ({ x: r * Math.cos(angle), y: -r * Math.sin(angle) });

/**
 * An arc of `count` arrows around a point, each pointing the way the amplitude turns.
 * Two arrows = half turn (Z), four = quarter turn (S), eight = eighth turn (T).
 */
function TurnArrows({ r, turn, color, animate, width }: { r: number; turn: number; color: string; animate: boolean; width: number }) {
  const count = Math.max(2, Math.min(8, Math.round((2 * Math.PI) / Math.abs(turn))));
  const sign = Math.sign(turn);
  const span = ((2 * Math.PI) / count) * 0.62;
  const head = Math.max(3, r * 0.28);
  const arcs = Array.from({ length: count }, (_, k) => {
    const a0 = Math.PI / 2 + (k * 2 * Math.PI) / count;
    const a1 = a0 + sign * span;
    const p0 = onCircle(r, a0);
    const p1 = onCircle(r, a1);
    // Tangent at the arrow tip, in screen coordinates, pointing along the turn.
    const tx = -Math.sin(a1) * sign;
    const ty = -Math.cos(a1) * sign;
    const nx = Math.cos(a1);
    const ny = -Math.sin(a1);
    const tip = { x: p1.x + tx * head * 0.6, y: p1.y + ty * head * 0.6 };
    const left = { x: p1.x - tx * head * 0.4 + nx * head * 0.5, y: p1.y - ty * head * 0.4 + ny * head * 0.5 };
    const right = { x: p1.x - tx * head * 0.4 - nx * head * 0.5, y: p1.y - ty * head * 0.4 - ny * head * 0.5 };
    // SVG sweep flag 0 = counterclockwise on screen.
    const d = `M ${p0.x} ${p0.y} A ${r} ${r} 0 0 ${sign > 0 ? 0 : 1} ${p1.x} ${p1.y}`;
    return (
      <g key={k}>
        <path d={d} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" />
        <polygon points={`${tip.x},${tip.y} ${left.x},${left.y} ${right.x},${right.y}`} fill={color} />
      </g>
    );
  });
  return (
    <g>
      {arcs}
      {animate && (
        <animateTransform attributeName="transform" type="rotate" from="0 0 0" to={`${sign > 0 ? -360 : 360} 0 0`} dur="3.2s" repeatCount="indefinite" />
      )}
    </g>
  );
}

function LaneMark({ lane, points, radius, animate }: { lane: Lane; points: ProjectedPoint[]; radius: number; animate: boolean }) {
  const P = points[lane.from];
  const Q = points[lane.to];
  const Ra = radius * P.scale;
  const Rb = radius * Q.scale;
  const dx = Q.x - P.x;
  const dy = Q.y - P.y;
  const L = Math.hypot(dx, dy);
  if (L < 1) return null;
  const ux = dx / L;
  const uy = dy / L;
  // Keep to the right of the direction of travel, so the two directions of a walkway sit side by side.
  const off = Math.max(3.5, Math.min(10, Math.min(Ra, Rb) * 0.3));
  const px = -uy * off;
  const py = ux * off;
  const sx = P.x + ux * (Ra + 4) + px;
  const sy = P.y + uy * (Ra + 4) + py;
  const ex = Q.x - ux * (Rb + 4) + px;
  const ey = Q.y - uy * (Rb + 4) + py;
  const len = Math.hypot(ex - sx, ey - sy);
  if (len < 10) return null;
  const color = colorOf(lane.gate);
  const d = `M ${sx} ${sy} L ${ex} ${ey}`;
  const count = Math.max(2, Math.round(len / 20));
  const dur = Math.max(0.9, len / 42);
  const chevron = Math.max(3, Math.min(5, off * 0.55));
  const angle = (Math.atan2(uy, ux) * 180) / Math.PI;
  const spinR = Math.max(5, Math.min(9, off * 0.9));
  // Spinner and its label sit just outside the lane, on the lane's own side of the walkway.
  const mid = { x: (sx + ex) / 2 + (px / off) * (off * 0.6 + spinR), y: (sy + ey) / 2 + (py / off) * (off * 0.6 + spinR) };
  const label = { x: (px / off) * (spinR + 10), y: (py / off) * (spinR + 10) };

  return (
    <g>
      <path d={d} stroke={color} strokeOpacity={0.22} strokeWidth={off * 0.9} strokeLinecap="round" fill="none" />
      {Array.from({ length: count }, (_, k) => {
        const shape = <polyline points={`${-chevron},${-chevron} 0,0 ${-chevron},${chevron}`} fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />;
        if (!animate) {
          const f = (k + 0.5) / count;
          return (
            <g key={k} transform={`translate(${sx + (ex - sx) * f}, ${sy + (ey - sy) * f}) rotate(${angle})`}>
              {shape}
            </g>
          );
        }
        return (
          <g key={k}>
            {shape}
            <animateMotion path={d} dur={`${dur}s`} begin={`${(-dur * k) / count}s`} repeatCount="indefinite" rotate="auto" />
          </g>
        );
      })}
      {lane.turn !== 0 && (
        <g transform={`translate(${mid.x}, ${mid.y})`}>
          <circle r={spinR + 3} fill="#05050f" fillOpacity={0.85} />
          <TurnArrows r={spinR} turn={lane.turn} color={color} animate={animate} width={1.5} />
          <text x={label.x} y={label.y} textAnchor="middle" dominantBaseline="middle" fontSize={10} className="font-mono" fill={color}>
            {factorLabel(lane.turn)}
          </text>
        </g>
      )}
    </g>
  );
}

function SpinMark({ spin, points, radius, animate }: { spin: Spin; points: ProjectedPoint[]; radius: number; animate: boolean }) {
  const p = points[spin.at];
  const R = radius * p.scale;
  const color = colorOf(spin.gate);
  const r = R + Math.max(5, R * 0.16);
  return (
    <g transform={`translate(${p.x}, ${p.y})`}>
      <TurnArrows r={r} turn={spin.turn} color={color} animate={animate} width={Math.max(1.5, R * 0.05)} />
      <text x={r * 0.78} y={-r * 0.78} fontSize={Math.max(10, Math.min(13, R * 0.28))} className="font-mono" fill={color}>
        {factorLabel(spin.turn)}
      </text>
    </g>
  );
}

const GateMarksLayer = ({ marks, points, radius, opacity, animate }: GateMarksLayerProps) => {
  if (opacity <= 0.01) return null;
  return (
    <g opacity={opacity} pointerEvents="none">
      {marks.lanes.map((lane, k) => (
        <LaneMark key={`lane-${lane.from}-${lane.to}-${k}`} lane={lane} points={points} radius={radius} animate={animate} />
      ))}
      {marks.spins.map(spin => (
        <SpinMark key={`spin-${spin.at}`} spin={spin} points={points} radius={radius} animate={animate} />
      ))}
    </g>
  );
};

export default GateMarksLayer;
