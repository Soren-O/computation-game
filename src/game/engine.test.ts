import { describe, expect, it } from 'vitest';
import {
  ALL_GATES,
  activeSlotAt,
  applyGate,
  finalState,
  formatState,
  runDuration,
  stateAt,
  statesEqual,
  visualStateAt,
  type Circuit,
  type GateId,
  type Phase,
  type QubitState,
} from './engine';

const ALL_STATES: QubitState[] = [0, 1].flatMap(basis =>
  [0, 1, 2, 3].map(phase => ({ basis: basis as 0 | 1, phase: phase as Phase })),
);

const applyAll = (gates: GateId[], s: QubitState) => gates.reduce((acc, g) => applyGate(g, acc), s);

describe('applyGate', () => {
  it('matches the textbook action on |0⟩ and |1⟩', () => {
    const k0: QubitState = { basis: 0, phase: 0 };
    const k1: QubitState = { basis: 1, phase: 0 };
    expect(formatState(applyGate('X', k0))).toBe('|1⟩');
    expect(formatState(applyGate('X', k1))).toBe('|0⟩');
    expect(formatState(applyGate('Z', k0))).toBe('|0⟩');
    expect(formatState(applyGate('Z', k1))).toBe('-|1⟩');
    expect(formatState(applyGate('S', k0))).toBe('|0⟩');
    expect(formatState(applyGate('S', k1))).toBe('i|1⟩');
    expect(formatState(applyGate('Y', k0))).toBe('i|1⟩');
    expect(formatState(applyGate('Y', k1))).toBe('-i|0⟩');
  });

  it.each(ALL_STATES)('satisfies X² = Z² = Y² = S⁴ = I and S² = Z for %o', s => {
    expect(applyAll(['X', 'X'], s)).toEqual(s);
    expect(applyAll(['Z', 'Z'], s)).toEqual(s);
    expect(applyAll(['Y', 'Y'], s)).toEqual(s);
    expect(applyAll(['S', 'S', 'S', 'S'], s)).toEqual(s);
    expect(applyAll(['S', 'S'], s)).toEqual(applyGate('Z', s));
  });

  it.each(ALL_STATES)('satisfies Y = i·X·Z for %o', s => {
    const xz = applyAll(['Z', 'X'], s); // Z acts first
    const y = applyGate('Y', s);
    expect(y.basis).toBe(xz.basis);
    expect(y.phase).toBe((xz.phase + 1) % 4);
  });

  it('treats an empty slot as identity', () => {
    for (const s of ALL_STATES) expect(applyGate(null, s)).toBe(s);
  });
});

describe('timing', () => {
  const circuit: Circuit = ['X', 'Z', null];
  const start: QubitState = { basis: 0, phase: 0 };

  it('runs one idle unit plus one unit per slot', () => {
    expect(runDuration(circuit)).toBe(4);
  });

  it('reports the active slot', () => {
    expect(activeSlotAt(circuit, 0.5)).toBeNull();
    expect(activeSlotAt(circuit, 1)).toBe(0);
    expect(activeSlotAt(circuit, 2.99)).toBe(1);
    expect(activeSlotAt(circuit, 4)).toBeNull();
  });

  it('only counts a gate once it has finished', () => {
    expect(stateAt(start, circuit, 1.99)).toEqual(start);
    expect(stateAt(start, circuit, 2)).toEqual({ basis: 1, phase: 0 });
    expect(stateAt(start, circuit, 2.5)).toEqual({ basis: 1, phase: 0 });
    expect(stateAt(start, circuit, 3)).toEqual({ basis: 1, phase: 2 });
    expect(finalState(start, circuit)).toEqual({ basis: 1, phase: 2 });
  });

  it('interpolates the active gate for rendering', () => {
    expect(visualStateAt(start, circuit, 0.5)).toEqual({ basis: 0, phase: 0 });
    expect(visualStateAt(start, circuit, 1.25)).toEqual({ basis: 0.25, phase: 0 });
    expect(visualStateAt(start, circuit, 2.5)).toEqual({ basis: 1, phase: 1 });
    expect(visualStateAt(start, circuit, 4)).toEqual({ basis: 1, phase: 2 });
  });

  it('ends every interpolation on the discrete result', () => {
    for (const gate of ALL_GATES) {
      for (const s of ALL_STATES) {
        const end = visualStateAt(s, [gate], 1.999999);
        const expected = applyGate(gate, s);
        expect(end.basis).toBeCloseTo(expected.basis, 4);
        const quarterTurnsOff = (((end.phase - expected.phase) % 4) + 4) % 4;
        expect(Math.min(quarterTurnsOff, 4 - quarterTurnsOff)).toBeLessThan(1e-4);
      }
    }
  });
});

describe('statesEqual', () => {
  it('compares basis and phase', () => {
    expect(statesEqual({ basis: 0, phase: 1 }, { basis: 0, phase: 1 })).toBe(true);
    expect(statesEqual({ basis: 0, phase: 1 }, { basis: 1, phase: 1 })).toBe(false);
    expect(statesEqual({ basis: 0, phase: 1 }, { basis: 0, phase: 3 })).toBe(false);
  });
});
