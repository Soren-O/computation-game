import { describe, expect, it } from 'vitest';
import {
  ALL_GATES,
  GATE_MATRIX,
  applyCircuit,
  applyColumn,
  bitsToIndex,
  cAbs,
  cAdd,
  cConj,
  cMul,
  circuit,
  columnMatrix,
  columnStatus,
  cx,
  formatAmplitude,
  formatState,
  indexToBits,
  ket,
  norm,
  parseColumn,
  statesMatch,
  superpose,
  uniform,
  type Complex,
  type QState,
} from './quantum';

const close = (a: QState, b: QState) => statesMatch(a, b);

describe('gates', () => {
  it.each(ALL_GATES)('%s is unitary', g => {
    const [a, b, c, d] = GATE_MATRIX[g];
    const dot = (x: Complex, y: Complex, z: Complex, w: Complex) => cAdd(cMul(cConj(x), y), cMul(cConj(z), w));
    expect(cAbs(cAdd(dot(a, a, c, c), cx(-1)))).toBeLessThan(1e-12);
    expect(cAbs(cAdd(dot(b, b, d, d), cx(-1)))).toBeLessThan(1e-12);
    expect(cAbs(dot(a, b, c, d))).toBeLessThan(1e-12);
  });

  it('acts on |0⟩ and |1⟩ as in the textbook', () => {
    expect(close(applyColumn(ket('0'), ['X']), ket('1'))).toBe(true);
    expect(close(applyColumn(ket('1'), ['Z']), ket('1', -1))).toBe(true);
    expect(close(applyColumn(ket('1'), ['S']), ket('1', cx(0, 1)))).toBe(true);
    expect(close(applyColumn(ket('0'), ['Y']), ket('1', cx(0, 1)))).toBe(true);
    expect(close(applyColumn(ket('1'), ['Y']), ket('0', cx(0, -1)))).toBe(true);
    expect(close(applyColumn(ket('0'), ['H']), superpose(['0', 1], ['1', 1]))).toBe(true);
    expect(close(applyColumn(ket('1'), ['H']), superpose(['0', 1], ['1', -1]))).toBe(true);
  });

  it('satisfies HZH = X, T² = S, S² = Z, S·S† = I', () => {
    for (const s of [ket('0'), ket('1'), superpose(['0', 1], ['1', cx(0, 1)])]) {
      expect(close(applyCircuit(s, circuit('H', 'Z', 'H')), applyColumn(s, ['X']))).toBe(true);
      expect(close(applyCircuit(s, circuit('T', 'T')), applyColumn(s, ['S']))).toBe(true);
      expect(close(applyCircuit(s, circuit('S', 'S')), applyColumn(s, ['Z']))).toBe(true);
      expect(close(applyCircuit(s, circuit('S', 's')), s)).toBe(true);
    }
  });
});

describe('columns', () => {
  it('uses qubit 0 as the first character of a ket', () => {
    expect(bitsToIndex('10')).toBe(1);
    expect(bitsToIndex('01')).toBe(2);
    expect(indexToBits(6, 3)).toBe('011');
  });

  it('applies parallel gates together', () => {
    expect(close(applyColumn(ket('00'), parseColumn('XX')), ket('11'))).toBe(true);
    expect(close(applyColumn(ket('00'), parseColumn('HH')), uniform(2))).toBe(true);
  });

  it('conditions every gate in a column on every control', () => {
    expect(close(applyColumn(ket('10'), parseColumn('@X')), ket('11'))).toBe(true);
    expect(close(applyColumn(ket('00'), parseColumn('@X')), ket('00'))).toBe(true);
    expect(close(applyColumn(ket('110'), parseColumn('@@X')), ket('111'))).toBe(true);
    expect(close(applyColumn(ket('100'), parseColumn('@@X')), ket('100'))).toBe(true);
    expect(close(applyColumn(ket('100'), parseColumn('@XX')), ket('111'))).toBe(true);
  });

  it('swaps pairs, optionally controlled', () => {
    expect(close(applyColumn(ket('10'), parseColumn('##')), ket('01'))).toBe(true);
    expect(close(applyColumn(ket('110'), parseColumn('@##')), ket('101'))).toBe(true);
    expect(close(applyColumn(ket('010'), parseColumn('@##')), ket('010'))).toBe(true);
    expect(columnStatus(parseColumn('#.'))).toBe('unpaired-swap');
    expect(close(applyColumn(ket('10'), parseColumn('#.')), ket('10'))).toBe(true);
  });

  it('reports empty and control-only columns', () => {
    expect(columnStatus(parseColumn('..'))).toBe('empty');
    expect(columnStatus(parseColumn('@.'))).toBe('empty');
    expect(columnStatus(parseColumn('@X'))).toBe('ok');
  });

  it('builds column matrices that agree with applyColumn', () => {
    const col = parseColumn('H@T');
    const m = columnMatrix(3, col);
    const s = superpose(['000', 1], ['110', cx(0, 1)], ['011', -1]);
    const out = applyColumn(s, col);
    m.forEach((row, i) => {
      const value = row.reduce((acc, entry, j) => cAdd(acc, cMul(entry, s[j])), cx(0));
      expect(cAbs(cAdd(value, cMul(cx(-1), out[i])))).toBeLessThan(1e-12);
    });
  });

  it('preserves the norm', () => {
    const s = superpose(['0000', 1], ['1010', cx(0, 1)], ['0111', -2]);
    expect(norm(applyCircuit(s, circuit('HHHH', '@X@T', '#.#S', 'YsZt')))).toBeCloseTo(1, 12);
  });

  it('makes a Bell state', () => {
    expect(close(applyCircuit(ket('00'), circuit('H.', '@X')), superpose(['00', 1], ['11', 1]))).toBe(true);
  });
});

describe('comparison and display', () => {
  it('can ignore a global phase', () => {
    expect(statesMatch(ket('1', -1), ket('1'))).toBe(false);
    expect(statesMatch(ket('1', -1), ket('1'), true)).toBe(true);
    expect(statesMatch(superpose(['0', 1], ['1', 1]), superpose(['0', 1], ['1', -1]), true)).toBe(false);
  });

  it('formats amplitudes and states', () => {
    expect(formatAmplitude(cx(1))).toBe('1');
    expect(formatAmplitude(cx(0, -1))).toBe('-i');
    expect(formatAmplitude(cx(-Math.SQRT1_2))).toBe('-1/√2');
    expect(formatAmplitude(cx(0, 0.5))).toBe('i/2');
    expect(formatState(superpose(['00', 1], ['11', -1]))).toBe('1/√2|00⟩ - 1/√2|11⟩');
    expect(formatState(ket('10', cx(0, 1)))).toBe('i|10⟩');
    expect(formatState(uniform(4))).toContain('(16 terms)');
  });
});
