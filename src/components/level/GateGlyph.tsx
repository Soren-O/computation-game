import { GATE_MATRIX, EPS, cAbs, cArg, isGate, type CellId, type Complex } from '../../game/quantum';

/**
 * A small picture of what a gate does, in the stage's own language: the two circles are the
 * 0 and 1 sides of the gate's wire (0 on the left). A walkway means amplitude moves across; a
 * dial means it turns in place, with the faint hand where the arrow was and the bright one
 * where the gate leaves it. Read off the gate's matrix, so it can't disagree with the stage.
 */

const W = 40;
const H = 18;
const MID = H / 2;

const phaseOf = (a: Complex) => (cAbs(a) > EPS ? cArg(a) : 0);
const turned = (turn: number) => Math.abs(turn) > 1e-6;

/** Screen point at a complex-plane angle (counterclockwise, y up). */
const at = (cx: number, cy: number, r: number, angle: number) => ({ x: cx + r * Math.cos(angle), y: cy - r * Math.sin(angle) });

function Arrow({ x1, y1, x2, y2, color, width = 1.4, head = 3 }: { x1: number; y1: number; x2: number; y2: number; color: string; width?: number; head?: number }) {
  const L = Math.hypot(x2 - x1, y2 - y1);
  const ux = (x2 - x1) / L;
  const uy = (y2 - y1) / L;
  const bx = x2 - ux * head;
  const by = y2 - uy * head;
  const w = head * 0.6;
  return (
    <g>
      <line x1={x1} y1={y1} x2={bx + ux * 0.5} y2={by + uy * 0.5} stroke={color} strokeWidth={width} strokeLinecap="round" />
      <polygon points={`${x2},${y2} ${bx - uy * w},${by + ux * w} ${bx + uy * w},${by - ux * w}`} fill={color} />
    </g>
  );
}

/** A circle whose arrow turns by `turn`: a wedge sweeps from the old direction (faint) to the new one. */
function Dial({ cx, cy, r, turn, color }: { cx: number; cy: number; r: number; turn: number; color: string }) {
  const rr = r - 1;
  const end = at(cx, cy, rr, turn);
  // SVG's sweep flag 0 runs counterclockwise on screen.
  const wedge = `M ${cx} ${cy} L ${cx + rr} ${cy} A ${rr} ${rr} 0 ${Math.abs(turn) > Math.PI ? 1 : 0} ${turn > 0 ? 0 : 1} ${end.x} ${end.y} Z`;
  const tip = at(cx, cy, rr - 0.3, turn);
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeOpacity={0.75} strokeWidth={1.1} />
      <path d={wedge} fill={color} fillOpacity={0.3} />
      <line x1={cx} y1={cy} x2={cx + rr - 0.5} y2={cy} stroke={color} strokeOpacity={0.4} strokeWidth={1.1} strokeLinecap="round" />
      <Arrow x1={cx} y1={cy} x2={tip.x} y2={tip.y} color={color} width={1.3} head={Math.min(3, r * 0.5)} />
    </g>
  );
}

function Spinner({ cx, cy, r, color }: { cx: number; cy: number; r: number; color: string }) {
  // Three quarters of a circle, counterclockwise, open on the right and ending in an arrowhead.
  const a0 = Math.PI / 3;
  const a1 = a0 + 1.5 * Math.PI;
  const p0 = at(cx, cy, r, a0);
  const p1 = at(cx, cy, r, a1);
  const t = { x: -Math.sin(a1), y: -Math.cos(a1) }; // screen tangent, counterclockwise
  const n = { x: Math.cos(a1), y: -Math.sin(a1) };
  const h = 2.6;
  return (
    <g>
      <path d={`M ${p0.x} ${p0.y} A ${r} ${r} 0 1 0 ${p1.x} ${p1.y}`} fill="none" stroke={color} strokeWidth={1.2} strokeLinecap="round" />
      <polygon
        points={`${p1.x + t.x * h},${p1.y + t.y * h} ${p1.x + n.x * h * 0.7},${p1.y + n.y * h * 0.7} ${p1.x - n.x * h * 0.7},${p1.y - n.y * h * 0.7}`}
        fill={color}
      />
    </g>
  );
}

function Corner({ cx, cy, r, color, dim = false, filled = false }: { cx: number; cy: number; r: number; color: string; dim?: boolean; filled?: boolean }) {
  return (
    <circle
      cx={cx}
      cy={cy}
      r={r}
      fill={filled ? color : 'none'}
      fillOpacity={filled ? 0.45 : undefined}
      stroke={color}
      strokeOpacity={dim ? 0.35 : 0.8}
      strokeWidth={1.1}
      strokeDasharray={dim ? '1.6 1.4' : undefined}
    />
  );
}

function GlyphBody({ cell, color }: { cell: CellId; color: string }) {
  if (cell === 'CTRL') {
    // Gates in the column act only where this wire is 1.
    return (
      <>
        <Corner cx={9} cy={MID} r={5.5} color={color} dim />
        <Corner cx={31} cy={MID} r={5.5} color={color} filled />
      </>
    );
  }
  if (cell === 'SWAP') {
    // On the square of two wires, SWAP exchanges the two corners of one diagonal.
    const [l, r, t, b] = [13, 27, 3, 15];
    return (
      <>
        <rect x={l} y={t} width={r - l} height={b - t} fill="none" stroke={color} strokeOpacity={0.25} strokeWidth={1} />
        {[[l, b], [r, t]].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r={1.6} fill={color} fillOpacity={0.35} />)}
        {[[l, t], [r, b]].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r={2.2} fill={color} />)}
        <Arrow x1={20} y1={MID} x2={r - 2.6} y2={b - 2.2} color={color} head={2.6} />
        <Arrow x1={20} y1={MID} x2={l + 2.6} y2={t + 2.2} color={color} head={2.6} />
      </>
    );
  }
  if (!isGate(cell)) return null;
  const [m00, m01, m10, m11] = GATE_MATRIX[cell];
  const moves = cAbs(m10) > EPS || cAbs(m01) > EPS;
  const turn0 = phaseOf(m00);
  const turn1 = phaseOf(m11);
  if (!moves) {
    // Turns in place: the 0 side is left alone, the 1 side gets the dial.
    return (
      <>
        {turned(turn0) ? <Dial cx={8} cy={MID} r={5} turn={turn0} color={color} /> : <Corner cx={8} cy={MID} r={4} color={color} dim />}
        {turned(turn1) ? <Dial cx={29} cy={MID} r={8} turn={turn1} color={color} /> : <Corner cx={29} cy={MID} r={5} color={color} dim />}
      </>
    );
  }
  // Moves across: a two-way walkway, keeping right like the stage's lanes.
  const twist = turned(phaseOf(m10)) || turned(phaseOf(m01));
  const [y0, y1] = twist ? [2.5, 15.5] : [5.5, 12.5];
  return (
    <>
      {turned(turn0) ? <Dial cx={6} cy={MID} r={5.5} turn={turn0} color={color} /> : <Corner cx={6} cy={MID} r={5} color={color} />}
      {turned(turn1) ? <Dial cx={34} cy={MID} r={5.5} turn={turn1} color={color} /> : <Corner cx={34} cy={MID} r={5} color={color} />}
      <Arrow x1={26.5} y1={y0} x2={13} y2={y0} color={color} />
      <Arrow x1={13.5} y1={y1} x2={27} y2={y1} color={color} />
      {twist && <Spinner cx={20} cy={MID} r={3.6} color={color} />}
    </>
  );
}

const GateGlyph = ({ cell, color, width }: { cell: CellId; color: string; width: number }) => (
  <svg viewBox={`0 0 ${W} ${H}`} width={width} height={(width * H) / W} aria-hidden="true" className="overflow-visible">
    <GlyphBody cell={cell} color={color} />
  </svg>
);

export default GateGlyph;
