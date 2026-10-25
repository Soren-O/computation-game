// Turns "state + circuit + time" into what the stage draws.
//
// Timing: a run lasts columns + 2 time units. [0, 1) shows the input, column k
// plays during [k + 1, k + 2), and the last unit holds the output on screen.
//
// While a column plays, every nonzero matrix entry U[i][j] carries a piece of
// the amplitude at corner j to corner i ("contribution"). The pieces travel
// along the cube, turning to their new phase as they go, then pieces landing
// on the same corner line up head-to-tail and merge into their sum. That last
// step is interference made visible: opposite arrows cancel.

import {
  EPS,
  GATE_MATRIX,
  isGate,
  applyCircuit,
  applyColumn,
  cAbs,
  cArg,
  cConj,
  cMul,
  cPolar,
  columnMatrix,
  numQubits,
  type CellId,
  type Circuit,
  type Column,
  type Complex,
  type QState,
} from './quantum';

export const runDuration = (columns: number): number => columns + 2;

export function activeColumnAt(t: number, columns: number): { index: number; progress: number } | null {
  const index = Math.floor(t) - 1;
  if (index < 0 || index >= columns) return null;
  return { index, progress: t - Math.floor(t) };
}

export const completedColumnsAt = (t: number, columns: number): number =>
  Math.max(0, Math.min(columns, Math.floor(t) - 1));

export interface Contribution {
  from: number;
  to: number;
  start: Complex;
  end: Complex;
}

/** Every piece of amplitude a column moves (or rotates in place). */
export function contributions(state: QState, column: Column): Contribution[] {
  const matrix = columnMatrix(numQubits(state), column);
  const result: Contribution[] = [];
  state.forEach((amp, j) => {
    if (cAbs(amp) < EPS) return;
    matrix.forEach((row, i) => {
      if (cAbs(row[j]) < EPS) return;
      result.push({ from: j, to: i, start: amp, end: cMul(row[j], amp) });
    });
  });
  return result;
}

/**
 * When things happen within one column's time unit (fractions of it). Pieces travel at a steady
 * pace, like riding a walkway. If pieces meet at a corner they then line up head-to-tail and
 * merge, so travel is shorter to leave time for that.
 */
export interface ColumnTiming {
  travelStart: number;
  travelEnd: number;
  chainEnd: number;
  mergeEnd: number;
}
export const SLIDE_TIMING: ColumnTiming = { travelStart: 0.08, travelEnd: 0.9, chainEnd: 0.9, mergeEnd: 0.9 };
export const INTERFERE_TIMING: ColumnTiming = { travelStart: 0.08, travelEnd: 0.58, chainEnd: 0.76, mergeEnd: 0.92 };
/** How long the gate marks take to fade out after the pieces arrive. */
const MARKS_FADE = 0.07;

export interface ArrowSprite {
  key: string;
  /** The arrow's anchor moves from corner `from` to corner `to`; `travel` is 0..1 along the way. */
  from: number;
  to: number;
  travel: number;
  /** Tail position relative to the anchor, in amplitude units (1 = node radius). */
  offset: Complex;
  /** The arrow itself, in amplitude units. */
  value: Complex;
  opacity: number;
  /** 'part' = a piece in motion; 'sum' = an amplitude at rest (or the merged result). */
  kind: 'part' | 'sum';
}

export interface StageFrame {
  arrows: ArrowSprite[];
  /** Probability disk radius per corner, in amplitude units (|amplitude|). */
  disks: number[];
  /** Index of the column being played, if any. */
  activeColumn: number | null;
  /** Corner pairs that pieces are travelling between in this column. */
  routes: [number, number][];
  /** State with every finished column applied. */
  state: QState;
  /** 0..1 progress of the pieces' travel in the playing column (0 when none is playing). */
  travel: number;
  /** How visible the gate marks are: up while pieces move, faded out otherwise. */
  marksOpacity: number;
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const clamp01 = (t: number) => Math.min(1, Math.max(0, t));

/** How far (in radians, counterclockwise) a piece turns on its way: the phase of U[i][j]. */
function turnOf(c: Contribution): number {
  const ratio = cMul(c.end, cConj(c.start));
  const turn = cArg(ratio);
  return turn <= -Math.PI + 1e-9 ? Math.PI : turn;
}

function inFlight(c: Contribution, q: number): Complex {
  const r = lerp(cAbs(c.start), cAbs(c.end), q);
  return cPolar(r, cArg(c.start) + turnOf(c) * q);
}

const restingArrows = (state: QState): ArrowSprite[] =>
  state.flatMap((amp, v) =>
    cAbs(amp) < EPS ? [] : [{ key: `rest-${v}`, from: v, to: v, travel: 1, offset: { re: 0, im: 0 }, value: amp, opacity: 1, kind: 'sum' as const }],
  );

// --- What a gate does, independent of the state: lanes and spins ---

/** Amplitude moving from corner `from` to `to`, multiplied by e^(i·turn) on the way. */
export interface Lane {
  from: number;
  to: number;
  turn: number;
  gate: CellId;
}

/** Amplitude staying at corner `at`, turned in place by `turn` radians (counterclockwise positive). */
export interface Spin {
  at: number;
  turn: number;
  gate: CellId;
}

export interface GateMarks {
  lanes: Lane[];
  spins: Spin[];
}

/** Angle in (-π, π], with a half turn reported as +π. */
const wrapTurn = (a: number) => {
  let x = Math.atan2(Math.sin(a), Math.cos(a));
  if (x <= -Math.PI + 1e-9) x = Math.PI;
  return Math.abs(x) < 1e-9 ? 0 : x;
};

/**
 * Reads a column's matrix gate by gate: each off-diagonal entry is a lane along
 * that gate's wire, each diagonal entry with a phase is a spin. Only corners
 * where every control dot is 1 are marked, so a CNOT marks half the square.
 */
export function gateMarks(n: number, column: Column): GateMarks {
  let controlMask = 0;
  column.forEach((cell, q) => {
    if (cell === 'CTRL') controlMask |= 1 << q;
  });
  const size = 1 << n;
  const lanes: Lane[] = [];
  const spinAt = new Map<number, Spin>();
  const addSpin = (at: number, turn: number, gate: CellId) => {
    const prev = spinAt.get(at);
    spinAt.set(at, { at, turn: (prev?.turn ?? 0) + turn, gate: prev?.gate ?? gate });
  };

  column.forEach((cell, k) => {
    if (!isGate(cell)) return;
    const [m00, m01, m10, m11] = GATE_MATRIX[cell];
    const bit = 1 << k;
    for (let a = 0; a < size; a++) {
      if (a & bit || (a & controlMask) !== controlMask) continue;
      const b = a | bit;
      if (cAbs(m10) > EPS) lanes.push({ from: a, to: b, turn: wrapTurn(cArg(m10)), gate: cell });
      if (cAbs(m01) > EPS) lanes.push({ from: b, to: a, turn: wrapTurn(cArg(m01)), gate: cell });
      if (cAbs(m00) > EPS && wrapTurn(cArg(m00)) !== 0) addSpin(a, cArg(m00), cell);
      if (cAbs(m11) > EPS && wrapTurn(cArg(m11)) !== 0) addSpin(b, cArg(m11), cell);
    }
  });

  const swaps = column.flatMap((cell, q) => (cell === 'SWAP' ? [q] : []));
  if (swaps.length === 2) {
    const [j, k] = swaps;
    for (let x = 0; x < size; x++) {
      if ((x & controlMask) !== controlMask || ((x >> j) & 1) === ((x >> k) & 1)) continue;
      lanes.push({ from: x, to: x ^ ((1 << j) | (1 << k)), turn: 0, gate: 'SWAP' });
    }
  }

  const spins = [...spinAt.values()].map(s => ({ ...s, turn: wrapTurn(s.turn) })).filter(s => s.turn !== 0);
  return { lanes, spins };
}

export function stageFrame(start: QState, c: Circuit, t: number): StageFrame {
  const columns = c.length;
  const done = completedColumnsAt(t, columns);
  const before = applyCircuit(start, c, done);
  const active = activeColumnAt(t, columns);

  if (!active) {
    return { arrows: restingArrows(before), disks: before.map(cAbs), activeColumn: null, routes: [], state: before, travel: 0, marksOpacity: 0 };
  }

  const column = c[active.index];
  const after = applyColumn(before, column);
  const parts = contributions(before, column);
  const p = active.progress;
  const arrows: ArrowSprite[] = [];
  const routes = new Map<string, [number, number]>();
  for (const part of parts) if (part.from !== part.to) routes.set(`${part.from}-${part.to}`, [part.from, part.to]);

  const byDestination = new Map<number, { part: Contribution; k: number }[]>();
  parts.forEach((part, k) => {
    const list = byDestination.get(part.to) ?? [];
    list.push({ part, k });
    byDestination.set(part.to, list);
  });
  const interferes = [...byDestination.values()].some(group => group.length > 1);
  const timing = interferes ? INTERFERE_TIMING : SLIDE_TIMING;
  const q = clamp01((p - timing.travelStart) / (timing.travelEnd - timing.travelStart));

  if (p < timing.travelEnd) {
    parts.forEach((part, k) =>
      arrows.push({ key: `part-${k}`, from: part.from, to: part.to, travel: q, offset: { re: 0, im: 0 }, value: inFlight(part, q), opacity: 1, kind: 'part' }),
    );
  } else {
    const chain = ease(clamp01((p - timing.travelEnd) / Math.max(1e-9, timing.chainEnd - timing.travelEnd)));
    const merge = ease(clamp01((p - timing.chainEnd) / Math.max(1e-9, timing.mergeEnd - timing.chainEnd)));

    for (const [to, group] of byDestination) {
      if (group.length === 1) {
        const { part, k } = group[0];
        arrows.push({ key: `part-${k}`, from: part.from, to, travel: 1, offset: { re: 0, im: 0 }, value: part.end, opacity: 1, kind: 'part' });
        continue;
      }
      // Line the pieces up head-to-tail, then fade them into their sum.
      let tail: Complex = { re: 0, im: 0 };
      for (const { part, k } of group) {
        arrows.push({ key: `part-${k}`, from: part.from, to, travel: 1, offset: { re: tail.re * chain, im: tail.im * chain }, value: part.end, opacity: 1 - merge, kind: 'part' });
        tail = { re: tail.re + part.end.re, im: tail.im + part.end.im };
      }
      if (merge > 0 && cAbs(after[to]) > EPS) {
        arrows.push({ key: `sum-${to}`, from: to, to, travel: 1, offset: { re: 0, im: 0 }, value: after[to], opacity: merge, kind: 'sum' });
      }
    }
  }

  const blend = ease(clamp01((p - timing.travelStart) / (timing.chainEnd - timing.travelStart)));
  const marksOpacity = Math.min(clamp01(p / timing.travelStart), clamp01(1 - (p - timing.travelEnd) / MARKS_FADE));
  return {
    arrows,
    disks: before.map((a, v) => lerp(cAbs(a), cAbs(after[v]), blend)),
    activeColumn: active.index,
    routes: [...routes.values()],
    state: before,
    travel: q,
    marksOpacity,
  };
}
