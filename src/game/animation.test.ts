import { describe, expect, it } from 'vitest';
import { CHAIN_END, TRAVEL_END, activeColumnAt, contributions, gateMarks, runDuration, stageFrame } from './animation';
import { applyColumn, cAbs, cAdd, circuit, ket, parseColumn, statesMatch, superpose, uniform, type Complex, type QState } from './quantum';
import { hypercubeEdges, layoutHypercube, defaultView } from './hypercube';

/** Sum of resting/merged arrows per corner, as a state. */
function restingState(arrows: ReturnType<typeof stageFrame>['arrows'], size: number): QState {
  const out: Complex[] = new Array(size).fill(null).map(() => ({ re: 0, im: 0 }));
  for (const a of arrows) out[a.to] = cAdd(out[a.to], a.value);
  return out;
}

describe('timeline', () => {
  it('leads in, plays each column, then holds', () => {
    expect(runDuration(3)).toBe(5);
    expect(activeColumnAt(0.5, 3)).toBeNull();
    expect(activeColumnAt(1.25, 3)).toEqual({ index: 0, progress: 0.25 });
    expect(activeColumnAt(4.5, 3)).toBeNull();
  });
});

describe('contributions', () => {
  it('sum to the column output at every corner', () => {
    const state = superpose(['000', 1], ['110', -1], ['011', 1]);
    const col = parseColumn('H@X');
    const parts = contributions(state, col);
    const out = applyColumn(state, col);
    const summed = restingState(parts.map(p => ({ key: '', from: p.from, to: p.to, travel: 1, offset: { re: 0, im: 0 }, value: p.end, opacity: 1, kind: 'part' as const })), 8);
    expect(statesMatch(summed, out)).toBe(true);
  });

  it('cancel in pairs when a Hadamard undoes a Hadamard', () => {
    const parts = contributions(superpose(['0', 1], ['1', 1]), ['H']);
    const into1 = parts.filter(p => p.to === 1);
    expect(into1).toHaveLength(2);
    expect(cAbs(cAdd(into1[0].end, into1[1].end))).toBeLessThan(1e-12);
  });
});

describe('stageFrame', () => {
  const c = circuit('H', 'Z');

  it('shows the input before the first column and the output during the hold', () => {
    const start = ket('0');
    expect(statesMatch(restingState(stageFrame(start, c, 0.5).arrows, 2), start)).toBe(true);
    const end = stageFrame(start, c, 3.5);
    expect(end.activeColumn).toBeNull();
    expect(statesMatch(restingState(end.arrows, 2), superpose(['0', 1], ['1', -1]))).toBe(true);
  });

  it('moves pieces along the route of the gate', () => {
    const mid = stageFrame(ket('0'), c, 1 + TRAVEL_END / 2);
    expect(mid.activeColumn).toBe(0);
    expect(mid.routes).toEqual([[0, 1]]);
    expect(mid.arrows.some(a => a.from === 0 && a.to === 1 && a.travel > 0 && a.travel < 1)).toBe(true);
  });

  it('lands exactly on the next state when merged', () => {
    const start = uniform(2);
    const two = circuit('HH');
    const merged = stageFrame(start, two, 1.999999);
    const sums = merged.arrows.filter(a => a.kind === 'sum' || a.opacity > 0.999);
    expect(statesMatch(restingState(sums, 4), ket('00'), false, 1e-4)).toBe(true);
    const chained = stageFrame(start, two, 1 + (TRAVEL_END + CHAIN_END) / 2);
    expect(chained.arrows.some(a => cAbs(a.offset) > 0)).toBe(true);
  });
});

describe('hypercube layout', () => {
  it.each([1, 2, 3, 4])('connects corners that differ in one bit (%i qubits)', n => {
    const edges = hypercubeEdges(n);
    expect(edges).toHaveLength(n * 2 ** (n - 1));
    for (const e of edges) expect(e.a ^ e.b).toBe(1 << e.axis);
  });

  it.each([1, 2, 3, 4])('fits inside the stage (%i qubits)', n => {
    for (const [w, h] of [[900, 500], [360, 420]]) {
      const layout = layoutHypercube(n, defaultView(n), w, h);
      for (const p of layout.points) {
        expect(p.x - layout.radius * p.scale).toBeGreaterThanOrEqual(0);
        expect(p.x + layout.radius * p.scale).toBeLessThanOrEqual(w);
        expect(p.y - layout.radius * p.scale).toBeGreaterThanOrEqual(0);
        expect(p.y + layout.radius * p.scale).toBeLessThanOrEqual(h);
      }
    }
  });

  it.each([1, 2, 3, 4])('keeps every circle apart at the default view (%i qubits)', n => {
    const { points, radius } = layoutHypercube(n, defaultView(n), 900, 520);
    for (let a = 0; a < points.length; a++)
      for (let b = a + 1; b < points.length; b++) {
        const gap = Math.hypot(points[a].x - points[b].x, points[a].y - points[b].y);
        expect(gap).toBeGreaterThan(radius * (points[a].scale + points[b].scale));
      }
  });

  it('draws four qubits as one tesseract: the q3 = 1 cube sits inside the q3 = 0 cube', () => {
    const { points } = layoutHypercube(4, defaultView(4), 900, 520);
    const outer = points.filter((_, v) => !(v & 8));
    const inner = points.filter((_, v) => v & 8);
    const mean = (ps: typeof points) => ({ x: ps.reduce((s, p) => s + p.x, 0) / ps.length, y: ps.reduce((s, p) => s + p.y, 0) / ps.length });
    const [mo, mi] = [mean(outer), mean(inner)];
    expect(Math.hypot(mo.x - mi.x, mo.y - mi.y)).toBeLessThan(5);
    const xs = outer.map(p => p.x), ys = outer.map(p => p.y);
    for (const p of inner) {
      expect(p.x).toBeGreaterThan(Math.min(...xs));
      expect(p.x).toBeLessThan(Math.max(...xs));
      expect(p.y).toBeGreaterThan(Math.min(...ys));
      expect(p.y).toBeLessThan(Math.max(...ys));
    }
  });

  it('puts qubit 0 left to right and qubit 1 bottom to top', () => {
    const layout = layoutHypercube(2, defaultView(2), 800, 600);
    const [p00, p10, p01] = [layout.points[0], layout.points[1], layout.points[2]];
    expect(p10.x).toBeGreaterThan(p00.x);
    expect(p01.y).toBeLessThan(p00.y);
  });
});

describe('gateMarks', () => {
  const q = Math.PI / 2;
  const marks = (n: number, spec: string) => gateMarks(n, parseColumn(spec));

  it('gives X a two-way walkway and no rotation', () => {
    const m = marks(1, 'X');
    expect(m.lanes).toEqual([{ from: 0, to: 1, turn: 0, gate: 'X' }, { from: 1, to: 0, turn: 0, gate: 'X' }]);
    expect(m.spins).toEqual([]);
  });

  it('gives Y a walkway that turns +90° one way and -90° the other', () => {
    const m = marks(1, 'Y');
    expect(m.lanes.map(l => [l.from, l.to, l.turn])).toEqual([[0, 1, q], [1, 0, -q]]);
    expect(m.spins).toEqual([]);
  });

  it('gives phase gates a spin on the 1 side only', () => {
    expect(marks(1, 'Z')).toEqual({ lanes: [], spins: [{ at: 1, turn: Math.PI, gate: 'Z' }] });
    expect(marks(1, 'S').spins[0].turn).toBeCloseTo(q);
    expect(marks(1, 's').spins[0].turn).toBeCloseTo(-q);
    expect(marks(1, 'T').spins[0].turn).toBeCloseTo(Math.PI / 4);
  });

  it('gives H a two-way walkway plus a half turn for the piece that stays on the 1 side', () => {
    const m = marks(1, 'H');
    expect(m.lanes.map(l => [l.from, l.to, l.turn])).toEqual([[0, 1, 0], [1, 0, 0]]);
    expect(m.spins).toEqual([{ at: 1, turn: Math.PI, gate: 'H' }]);
  });

  it('only marks the half where the control is 1', () => {
    const m = marks(2, '@X'); // |10⟩ (index 1) <-> |11⟩ (index 3)
    expect(m.lanes.map(l => [l.from, l.to])).toEqual([[1, 3], [3, 1]]);
  });

  it('marks SWAP across the diagonal and nets out phases that cancel', () => {
    expect(marks(2, '##').lanes.map(l => [l.from, l.to])).toEqual([[1, 2], [2, 1]]);
    const zz = marks(2, 'ZZ').spins.map(s => s.at).sort();
    expect(zz).toEqual([1, 2]); // |11⟩ gets (-1)(-1) = +1: no spin
  });
});
