import { DEFAULT_VIEW, layoutHypercube } from '../game/hypercube';

/** A tiny drawing of the n-qubit shape: two dots, a square, a cube, or two cubes. */
const HypercubeGlyph = ({ qubits, size = 34, color = 'currentColor' }: { qubits: number; size?: number; color?: string }) => {
  const { points, edges } = layoutHypercube(qubits, DEFAULT_VIEW, size, size, { margin: 1, labels: false });
  const dot = Math.max(1.3, size / (qubits >= 4 ? 20 : qubits === 3 ? 15 : 10));
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      {edges.map(({ a, b }) => (
        <line key={`${a}-${b}`} x1={points[a].x} y1={points[a].y} x2={points[b].x} y2={points[b].y} stroke={color} strokeOpacity={0.55} strokeWidth={1} />
      ))}
      {points.map((p, v) => (
        <circle key={v} cx={p.x} cy={p.y} r={dot} fill={color} />
      ))}
    </svg>
  );
};

export default HypercubeGlyph;
