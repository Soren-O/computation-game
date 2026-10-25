// State-vector simulator for up to a handful of qubits.
//
// Basis index convention: bit k of the index is qubit k. Kets are written with
// qubit 0 first, so "|10⟩" means q0 = 1, q1 = 0 (index 1).

export interface Complex {
  re: number;
  im: number;
}

export const cx = (re: number, im = 0): Complex => ({ re, im });
export const ZERO = cx(0);
export const ONE = cx(1);
export const I = cx(0, 1);

export const cAdd = (a: Complex, b: Complex): Complex => cx(a.re + b.re, a.im + b.im);
export const cMul = (a: Complex, b: Complex): Complex => cx(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re);
export const cScale = (a: Complex, s: number): Complex => cx(a.re * s, a.im * s);
export const cConj = (a: Complex): Complex => cx(a.re, -a.im);
export const cAbs = (a: Complex): number => Math.hypot(a.re, a.im);
export const cArg = (a: Complex): number => Math.atan2(a.im, a.re);
export const cPolar = (r: number, theta: number): Complex => cx(r * Math.cos(theta), r * Math.sin(theta));

export const EPS = 1e-9;

export type GateId = 'X' | 'Y' | 'Z' | 'H' | 'S' | 'SDG' | 'T' | 'TDG';
/** What a single circuit cell can hold. CTRL makes the column's other gates conditional. */
export type CellId = GateId | 'CTRL' | 'SWAP';
/** One entry per qubit. */
export type Column = (CellId | null)[];
export type Circuit = Column[];
export type QState = Complex[];

/** Row-major 2x2 matrix [a, b, c, d] = [[a, b], [c, d]]. */
type Mat2 = readonly [Complex, Complex, Complex, Complex];

const R = Math.SQRT1_2;
const W = cPolar(1, Math.PI / 4); // e^(iπ/4)

export const GATE_MATRIX: Record<GateId, Mat2> = {
  X: [ZERO, ONE, ONE, ZERO],
  Y: [ZERO, cx(0, -1), I, ZERO],
  Z: [ONE, ZERO, ZERO, cx(-1)],
  H: [cx(R), cx(R), cx(R), cx(-R)],
  S: [ONE, ZERO, ZERO, I],
  SDG: [ONE, ZERO, ZERO, cx(0, -1)],
  T: [ONE, ZERO, ZERO, W],
  TDG: [ONE, ZERO, ZERO, cConj(W)],
};

export const ALL_GATES: GateId[] = ['X', 'Y', 'Z', 'H', 'S', 'SDG', 'T', 'TDG'];
export const ALL_CELLS: CellId[] = [...ALL_GATES, 'CTRL', 'SWAP'];
export const isGate = (cell: CellId | null): cell is GateId => cell !== null && cell !== 'CTRL' && cell !== 'SWAP';

// --- States ---

export const numQubits = (state: QState): number => Math.round(Math.log2(state.length));

/** "q0 q1 ..." bit string -> basis index. */
export function bitsToIndex(bits: string): number {
  let index = 0;
  for (let k = 0; k < bits.length; k++) if (bits[k] === '1') index |= 1 << k;
  return index;
}

export function indexToBits(index: number, n: number): string {
  let bits = '';
  for (let k = 0; k < n; k++) bits += (index >> k) & 1 ? '1' : '0';
  return bits;
}

export function basisState(n: number, index: number, coefficient: Complex = ONE): QState {
  const state = new Array<Complex>(1 << n).fill(ZERO);
  state[index] = coefficient;
  return state;
}

/** ket('01') = |01⟩; ket('1', cx(-1)) = -|1⟩. */
export const ket = (bits: string, coefficient: Complex | number = 1): QState =>
  basisState(bits.length, bitsToIndex(bits), typeof coefficient === 'number' ? cx(coefficient) : coefficient);

/** Normalized sum of basis states with relative coefficients, e.g. superpose(['00', 1], ['11', -1]). */
export function superpose(...terms: [string, Complex | number][]): QState {
  const n = terms[0][0].length;
  const state = new Array<Complex>(1 << n).fill(ZERO);
  for (const [bits, c] of terms) {
    const i = bitsToIndex(bits);
    state[i] = cAdd(state[i], typeof c === 'number' ? cx(c) : c);
  }
  const norm = Math.sqrt(state.reduce((s, a) => s + cAbs(a) ** 2, 0));
  return state.map(a => cScale(a, 1 / norm));
}

/** Equal superposition of all basis states, with an optional ±1 sign per basis state. */
export function uniform(n: number, sign: (index: number) => number = () => 1): QState {
  const amp = 1 / Math.sqrt(1 << n);
  return Array.from({ length: 1 << n }, (_, i) => cx(amp * sign(i)));
}

export const norm = (state: QState): number => Math.sqrt(state.reduce((s, a) => s + cAbs(a) ** 2, 0));

// --- Circuits ---

/** Compact notation for puzzle data: one character per qubit. '.' empty, '@' control, '#' swap, s/t = S†/T†. */
export function parseColumn(spec: string): Column {
  const map: Record<string, CellId | null> = {
    '.': null, '@': 'CTRL', '#': 'SWAP',
    X: 'X', Y: 'Y', Z: 'Z', H: 'H', S: 'S', s: 'SDG', T: 'T', t: 'TDG',
  };
  return [...spec].map(ch => {
    if (!(ch in map)) throw new Error(`Unknown cell "${ch}" in column "${spec}"`);
    return map[ch];
  });
}

export const circuit = (...columns: string[]): Circuit => columns.map(parseColumn);

export const emptyCircuit = (qubits: number, columns: number): Circuit =>
  Array.from({ length: columns }, () => new Array<CellId | null>(qubits).fill(null));

export type ColumnStatus = 'ok' | 'empty' | 'unpaired-swap';

export function columnStatus(column: Column): ColumnStatus {
  const swaps = column.filter(c => c === 'SWAP').length;
  if (swaps !== 0 && swaps !== 2) return 'unpaired-swap';
  if (swaps === 0 && !column.some(isGate)) return 'empty';
  return 'ok';
}

function applySingle(state: QState, qubit: number, m: Mat2, controlMask: number): QState {
  const out = state.slice();
  const bit = 1 << qubit;
  for (let i = 0; i < state.length; i++) {
    if (i & bit || (i & controlMask) !== controlMask) continue;
    const j = i | bit;
    const a0 = state[i];
    const a1 = state[j];
    out[i] = cAdd(cMul(m[0], a0), cMul(m[1], a1));
    out[j] = cAdd(cMul(m[2], a0), cMul(m[3], a1));
  }
  return out;
}

function applySwap(state: QState, a: number, b: number, controlMask: number): QState {
  const out = state.slice();
  for (let i = 0; i < state.length; i++) {
    if ((i & controlMask) !== controlMask) continue;
    const bitA = (i >> a) & 1;
    const bitB = (i >> b) & 1;
    if (bitA === bitB) continue;
    out[i ^ ((1 << a) | (1 << b))] = state[i];
  }
  return out;
}

/**
 * Applies one circuit column. Every gate in the column is conditioned on every
 * control dot in the column (so "@@X" is a Toffoli and "@XX" flips two targets).
 * A column with an odd number of swap cells does nothing.
 */
export function applyColumn(state: QState, column: Column): QState {
  let controlMask = 0;
  column.forEach((cell, q) => {
    if (cell === 'CTRL') controlMask |= 1 << q;
  });
  let out = state;
  column.forEach((cell, q) => {
    if (isGate(cell)) out = applySingle(out, q, GATE_MATRIX[cell], controlMask);
  });
  const swaps = column.flatMap((cell, q) => (cell === 'SWAP' ? [q] : []));
  if (swaps.length === 2) out = applySwap(out, swaps[0], swaps[1], controlMask);
  return out;
}

export const applyCircuit = (state: QState, c: Circuit, columns = c.length): QState =>
  c.slice(0, columns).reduce(applyColumn, state);

/** Full matrix of a column: entry [i][j] = ⟨i|U|j⟩. */
export function columnMatrix(n: number, column: Column): Complex[][] {
  const size = 1 << n;
  const matrix = Array.from({ length: size }, () => new Array<Complex>(size).fill(ZERO));
  for (let j = 0; j < size; j++) {
    const image = applyColumn(basisState(n, j), column);
    for (let i = 0; i < size; i++) matrix[i][j] = image[i];
  }
  return matrix;
}

// --- Comparison & display ---

export function statesMatch(a: QState, b: QState, upToGlobalPhase = false, tolerance = 1e-6): boolean {
  if (a.length !== b.length) return false;
  let phase = ONE;
  if (upToGlobalPhase) {
    let k = 0;
    for (let i = 1; i < b.length; i++) if (cAbs(b[i]) > cAbs(b[k])) k = i;
    if (cAbs(a[k]) < EPS) return false;
    // phase = a[k] / b[k], normalized to unit length
    const ratio = cMul(a[k], cConj(b[k]));
    phase = cScale(ratio, 1 / cAbs(ratio));
  }
  return a.every((amp, i) => cAbs(cAdd(amp, cScale(cMul(phase, b[i]), -1))) < tolerance);
}

const near = (x: number, y: number) => Math.abs(x - y) < 1e-6;

/** Pretty amplitude: "1", "-i", "1/√2", "-1/2", "i/2√2", "e^(iπ/4)/√2", or decimals as a fallback. */
export function formatAmplitude(a: Complex): string {
  const r = cAbs(a);
  if (r < EPS) return '0';
  const magnitudes: [number, string][] = [
    [1, ''], [R, '/√2'], [0.5, '/2'], [R / 2, '/2√2'], [0.25, '/4'],
  ];
  const mag = magnitudes.find(([m]) => near(r, m));
  const quarterTurns = cArg(a) / (Math.PI / 4);
  const eighth = Math.round(quarterTurns);
  if (!mag || !near(quarterTurns, eighth)) {
    const re = Math.abs(a.re) < 1e-6 ? '' : a.re.toFixed(2);
    const im = Math.abs(a.im) < 1e-6 ? '' : `${a.im >= 0 && re ? '+' : ''}${a.im.toFixed(2)}i`;
    return re && im ? `(${re}${im})` : re || im;
  }
  const phaseNames = ['1', 'e^(iπ/4)', 'i', 'e^(3iπ/4)', '-1', 'e^(-3iπ/4)', '-i', 'e^(-iπ/4)'];
  const phase = phaseNames[((eighth % 8) + 8) % 8];
  if (!mag[1]) return phase;
  if (phase === '1') return `1${mag[1]}`;
  if (phase === '-1') return `-1${mag[1]}`;
  return `${phase}${mag[1]}`;
}

/** e.g. "1/√2|00⟩ + 1/√2|11⟩". Long superpositions are summarized. */
export function formatState(state: QState, maxTerms = 4): string {
  const n = numQubits(state);
  const terms = state.flatMap((a, i) => (cAbs(a) > EPS ? [{ a, i }] : []));
  if (terms.length === 0) return '0';
  const shown = terms.slice(0, maxTerms).map(({ a, i }, k) => {
    let coef = formatAmplitude(a);
    const ketText = `|${indexToBits(i, n)}⟩`;
    let sign = k === 0 ? '' : ' + ';
    if (k > 0 && coef.startsWith('-')) {
      sign = ' - ';
      coef = coef.slice(1);
    }
    if (coef === '1') coef = '';
    else if (coef === '-1') coef = '-';
    return `${sign}${coef}${ketText}`;
  });
  const rest = terms.length - maxTerms;
  return shown.join('') + (rest > 0 ? ` + … (${terms.length} terms)` : '');
}
