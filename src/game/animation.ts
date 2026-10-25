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
  applyCircuit,
  applyColumn,
  cAbs,
  cArg,
  cConj,
  cMul,
  cPolar,
  columnMatrix,
  numQubits,
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

/** Fractions of a column's time unit spent travelling, then lining up head-to-tail, then merging. */
export const TRAVEL_END = 0.55;
export const CHAIN_END = 0.78;

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

export function stageFrame(start: QState, c: Circuit, t: number): StageFrame {
  const columns = c.length;
  const done = completedColumnsAt(t, columns);
  const before = applyCircuit(start, c, done);
  const active = activeColumnAt(t, columns);

  if (!active) {
    return { arrows: restingArrows(before), disks: before.map(cAbs), activeColumn: null, routes: [], state: before };
  }

  const column = c[active.index];
  const after = applyColumn(before, column);
  const parts = contributions(before, column);
  const p = active.progress;
  const arrows: ArrowSprite[] = [];
  const routes = new Map<string, [number, number]>();
  for (const part of parts) if (part.from !== part.to) routes.set(`${part.from}-${part.to}`, [part.from, part.to]);

  if (p < TRAVEL_END) {
    const q = ease(p / TRAVEL_END);
    parts.forEach((part, k) =>
      arrows.push({ key: `part-${k}`, from: part.from, to: part.to, travel: q, offset: { re: 0, im: 0 }, value: inFlight(part, q), opacity: 1, kind: 'part' }),
    );
  } else {
    const chain = ease(clamp01((p - TRAVEL_END) / (CHAIN_END - TRAVEL_END)));
    const merge = ease(clamp01((p - CHAIN_END) / (1 - CHAIN_END)));
    const byDestination = new Map<number, { part: Contribution; k: number }[]>();
    parts.forEach((part, k) => {
      const list = byDestination.get(part.to) ?? [];
      list.push({ part, k });
      byDestination.set(part.to, list);
    });

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

  const blend = ease(clamp01(p / CHAIN_END));
  return {
    arrows,
    disks: before.map((a, v) => lerp(cAbs(a), cAbs(after[v]), blend)),
    activeColumn: active.index,
    routes: [...routes.values()],
    state: before,
  };
}
