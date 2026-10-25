import { ALL_CELLS, circuit, cx, ket, superpose, uniform, type CellId, type Circuit, type QState } from './quantum';

export interface PuzzleCase {
  start: QState;
  target: QState;
}

export interface Puzzle {
  qubits: number;
  /** Most puzzles have one case; logic puzzles list a truth table, and every row must pass. */
  cases: PuzzleCase[];
  columns: number;
  gates: CellId[];
  /** A known answer. Tests check it fits the puzzle and solves every case. */
  solution: Circuit;
  /** Accept the target times any overall phase. */
  upToGlobalPhase?: boolean;
}

export type LevelType = 'ROOT' | 'CLASSICAL' | 'QUANTUM';

export interface LevelDef {
  id: string;
  title: string;
  type: LevelType;
  description: string;
  difficulty: number; // 1-5
  /** Position on the campaign map, in percent. */
  x: number;
  y: number;
  /** 'bit' draws a single ball (classical); 'qubit' draws amplitude arrows. */
  visual: 'bit' | 'qubit';
  /** Played in order. An empty list means the level hasn't been built yet. */
  puzzles: Puzzle[];
}

const one = (start: QState, target: QState): PuzzleCase[] => [{ start, target }];
/** Truth table rows as "input>output" bit strings. */
const table = (...rows: string[]): PuzzleCase[] =>
  rows.map(row => {
    const [a, b] = row.split('>');
    return { start: ket(a), target: ket(b) };
  });

const i = cx(0, 1);
const minusI = cx(0, -1);
const parity = (index: number) => {
  let bits = 0;
  for (let v = index; v; v >>= 1) bits ^= v & 1;
  return bits ? -1 : 1;
};

export const LEVELS: LevelDef[] = [
  {
    id: 'root', x: 50, y: 90,
    title: 'System Boot',
    type: 'ROOT',
    description: 'Initialize the simulation environment and verify neural link stability. One bit: a ball that slides between two circles.',
    difficulty: 1,
    visual: 'bit',
    puzzles: [{ qubits: 1, cases: one(ket('0'), ket('1')), columns: 3, gates: ['X'], solution: circuit('X') }],
  },

  // --- Classical branch: one ball on the cube, moved by reversible logic ---
  {
    id: 'c1', x: 26, y: 72,
    title: 'Binary Basis',
    type: 'CLASSICAL',
    description: 'Two bits: four states on a square. Flipping a bit slides a line onto the opposite line.',
    difficulty: 1,
    visual: 'bit',
    puzzles: [
      { qubits: 2, cases: one(ket('00'), ket('10')), columns: 2, gates: ['X'], solution: circuit('X.') },
      { qubits: 2, cases: one(ket('00'), ket('01')), columns: 2, gates: ['X'], solution: circuit('.X') },
      { qubits: 2, cases: one(ket('00'), ket('11')), columns: 1, gates: ['X'], solution: circuit('XX') },
      { qubits: 2, cases: one(ket('10'), ket('01')), columns: 1, gates: ['SWAP'], solution: circuit('##') },
      { qubits: 2, cases: one(ket('11'), ket('00')), columns: 1, gates: ['X', 'SWAP'], solution: circuit('XX') },
    ],
  },
  {
    id: 'c2', x: 17, y: 50,
    title: 'Logic Gates',
    type: 'CLASSICAL',
    description: 'Three bits: eight states on a cube, where flipping a bit slides a square onto the opposite square. Control dots turn NOT into reversible logic: copy, XOR, AND, OR.',
    difficulty: 2,
    visual: 'bit',
    puzzles: [
      { qubits: 3, cases: one(ket('000'), ket('111')), columns: 1, gates: ['X'], solution: circuit('XXX') },
      { qubits: 2, cases: table('00>00', '10>11'), columns: 1, gates: ['CTRL', 'X'], solution: circuit('@X') },
      { qubits: 2, cases: table('10>01', '01>10', '11>11'), columns: 3, gates: ['CTRL', 'X'], solution: circuit('@X', 'X@', '@X') },
      { qubits: 3, cases: table('000>000', '100>100', '010>010', '110>111'), columns: 1, gates: ['CTRL', 'X'], solution: circuit('@@X') },
      { qubits: 3, cases: table('000>000', '100>101', '010>011', '110>111'), columns: 3, gates: ['CTRL', 'X'], solution: circuit('@.X', '.@X', '@@X') },
    ],
  },
  {
    id: 'c3', x: 26, y: 27,
    title: 'Binary Counter',
    type: 'CLASSICAL',
    description: 'Three bits count from 0 to 7. Build counters that walk the ball around all eight corners of the cube.',
    difficulty: 3,
    visual: 'bit',
    puzzles: [
      { qubits: 2, cases: table('00>10', '10>01', '01>11', '11>00'), columns: 2, gates: ['CTRL', 'X'], solution: circuit('@X', 'X.') },
      { qubits: 3, cases: table('000>010', '100>110', '010>001', '011>000', '111>100'), columns: 2, gates: ['CTRL', 'X'], solution: circuit('.@X', '.X.') },
      { qubits: 3, cases: table('000>100', '100>010', '110>001', '101>011', '011>111', '111>000'), columns: 3, gates: ['CTRL', 'X'], solution: circuit('@@X', '@X.', 'X..') },
      { qubits: 3, cases: table('100>000', '000>111', '001>110', '010>100', '111>011'), columns: 3, gates: ['CTRL', 'X'], solution: circuit('X..', '@X.', '@@X') },
    ],
  },

  // --- Quantum branch: amplitudes as arrows ---
  {
    id: 'q1', x: 70, y: 78,
    title: 'Quantum Gates',
    type: 'QUANTUM',
    description: 'One qubit. Its amplitudes are arrows: turn them with Pauli-X, Pauli-Z, S and Pauli-Y.',
    difficulty: 2,
    visual: 'qubit',
    puzzles: [
      { qubits: 1, cases: one(ket('0'), ket('1')), columns: 2, gates: ['X'], solution: circuit('X') },
      { qubits: 1, cases: one(ket('1'), ket('0')), columns: 2, gates: ['X'], solution: circuit('X') },
      { qubits: 1, cases: one(ket('0'), ket('1', -1)), columns: 2, gates: ['X', 'Z'], solution: circuit('X', 'Z') },
      { qubits: 1, cases: one(ket('0'), ket('0', -1)), columns: 3, gates: ['X', 'Z'], solution: circuit('X', 'Z', 'X') },
      { qubits: 1, cases: one(ket('0'), ket('1', i)), columns: 2, gates: ['X', 'Z', 'S'], solution: circuit('X', 'S') },
      { qubits: 1, cases: one(ket('0'), ket('0', i)), columns: 3, gates: ['X', 'Z', 'S'], solution: circuit('X', 'S', 'X') },
      { qubits: 1, cases: one(ket('1', -1), ket('0', i)), columns: 1, gates: ['X', 'Z', 'S', 'Y'], solution: circuit('Y') },
      { qubits: 1, cases: one(ket('0'), ket('0', minusI)), columns: 2, gates: ['X', 'Z', 'S', 'Y'], solution: circuit('X', 'Y') },
    ],
  },
  {
    id: 'q2', x: 84, y: 63,
    title: 'Superposition',
    type: 'QUANTUM',
    description: 'The Hadamard gate splits an arrow between both circles. Split, recombine, and watch arrows cancel.',
    difficulty: 2,
    visual: 'qubit',
    puzzles: [
      { qubits: 1, cases: one(ket('0'), superpose(['0', 1], ['1', 1])), columns: 2, gates: ['H'], solution: circuit('H') },
      { qubits: 1, cases: one(ket('1'), superpose(['0', 1], ['1', -1])), columns: 2, gates: ['H'], solution: circuit('H') },
      { qubits: 1, cases: one(superpose(['0', 1], ['1', 1]), ket('0')), columns: 2, gates: ['H'], solution: circuit('H') },
      { qubits: 1, cases: one(ket('0'), ket('1')), columns: 3, gates: ['H', 'Z'], solution: circuit('H', 'Z', 'H') },
      { qubits: 1, cases: one(ket('0'), superpose(['0', 1], ['1', -1])), columns: 2, gates: ['H', 'X', 'Z'], solution: circuit('X', 'H') },
      { qubits: 1, cases: one(ket('0'), superpose(['0', 1], ['1', i])), columns: 2, gates: ['H', 'X', 'Z', 'S'], solution: circuit('H', 'S') },
      { qubits: 1, cases: one(superpose(['0', 1], ['1', 1]), superpose(['0', 1], ['1', -1])), columns: 1, gates: ['H', 'X', 'Z', 'S'], solution: circuit('Z') },
    ],
  },
  {
    id: 'q3', x: 62, y: 53,
    title: 'Entanglement',
    type: 'QUANTUM',
    description: 'Two qubits on a square. A controlled gate slides only one side of it, and the two qubits stop having states of their own.',
    difficulty: 3,
    visual: 'qubit',
    puzzles: [
      { qubits: 2, cases: one(ket('00'), superpose(['00', 1], ['10', 1])), columns: 2, gates: ['H', 'X'], solution: circuit('H.') },
      { qubits: 2, cases: one(ket('00'), uniform(2)), columns: 1, gates: ['H', 'X'], solution: circuit('HH') },
      { qubits: 2, cases: one(ket('00'), superpose(['00', 1], ['11', 1])), columns: 2, gates: ['H', 'CTRL', 'X'], solution: circuit('H.', '@X') },
      { qubits: 2, cases: one(ket('00'), superpose(['00', 1], ['11', -1])), columns: 3, gates: ['H', 'CTRL', 'X', 'Z'], solution: circuit('H.', '@X', 'Z.') },
      { qubits: 2, cases: one(ket('00'), superpose(['01', 1], ['10', 1])), columns: 3, gates: ['H', 'CTRL', 'X', 'Z'], solution: circuit('HX', '@X') },
      { qubits: 2, cases: one(uniform(2), superpose(['00', 1], ['10', 1], ['01', 1], ['11', -1])), columns: 1, gates: ['CTRL', 'Z', 'X'], solution: circuit('@Z') },
    ],
  },
  {
    id: 'q4', x: 82, y: 40,
    title: 'Interference',
    type: 'QUANTUM',
    description: 'Use phase to steer interference: phase kickback, Deutsch\'s algorithm and a Grover search on four states.',
    difficulty: 4,
    visual: 'qubit',
    puzzles: [
      {
        qubits: 2,
        cases: one(superpose(['00', 1], ['01', -1], ['10', 1], ['11', -1]), superpose(['00', 1], ['01', -1], ['10', -1], ['11', 1])),
        columns: 1,
        gates: ['CTRL', 'X', 'H'],
        solution: circuit('@X'),
      },
      { qubits: 2, cases: one(ket('01'), superpose(['10', 1], ['11', -1])), columns: 3, gates: ['H', 'CTRL', 'X'], solution: circuit('HH', '@X', 'H.') },
      { qubits: 2, cases: one(ket('00'), ket('11')), columns: 6, gates: ['H', 'CTRL', 'Z'], solution: circuit('HH', '@Z', 'HH', 'ZZ', '@Z', 'HH') },
      { qubits: 2, cases: one(ket('00'), ket('01')), columns: 8, gates: ['H', 'CTRL', 'X', 'Z'], solution: circuit('HH', 'X.', '@Z', 'X.', 'HH', 'ZZ', '@Z', 'HH') },
    ],
  },
  {
    id: 'q5', x: 56, y: 17,
    title: 'Quantum Cube',
    type: 'QUANTUM',
    description: 'Three qubits on a cube: spread over all eight corners, entangle three ways, and mark a single corner.',
    difficulty: 4,
    visual: 'qubit',
    puzzles: [
      { qubits: 3, cases: one(ket('000'), uniform(3)), columns: 1, gates: ['H', 'X'], solution: circuit('HHH') },
      { qubits: 3, cases: one(ket('000'), superpose(['000', 1], ['111', 1])), columns: 3, gates: ['H', 'CTRL', 'X'], solution: circuit('H..', '@XX') },
      { qubits: 3, cases: one(uniform(3), uniform(3, v => (v === 7 ? -1 : 1))), columns: 1, gates: ['CTRL', 'Z', 'H'], solution: circuit('@@Z') },
      { qubits: 3, cases: one(superpose(['010', 1], ['110', 1]), superpose(['010', 1], ['101', 1])), columns: 1, gates: ['CTRL', 'SWAP'], solution: circuit('@##') },
      { qubits: 3, cases: one(ket('000'), uniform(3, parity)), columns: 2, gates: ['H', 'X', 'Z'], solution: circuit('HHH', 'ZZZ') },
    ],
  },
];

/** Campaign map edges: [prerequisite, unlocks]. A level needs every prerequisite. */
export const CONNECTIONS: [string, string][] = [
  ['root', 'c1'],
  ['c1', 'c2'],
  ['c2', 'c3'],
  ['root', 'q1'],
  ['q1', 'q2'],
  ['q2', 'q3'],
  ['c1', 'q3'],
  ['q3', 'q4'],
  ['q4', 'q5'],
  ['c2', 'q5'],
];

export const SANDBOX_LEVEL_ID = 'sandbox';
export const SANDBOX_DEFAULT = { qubits: 2, columns: 6 };
export const SANDBOX_LIMITS = { minQubits: 1, maxQubits: 3, minColumns: 1, maxColumns: 12 };

const SANDBOX_LEVEL: LevelDef = {
  id: SANDBOX_LEVEL_ID, x: 0, y: 0,
  title: 'Sandbox',
  type: 'QUANTUM',
  description: 'Free play with every gate, on up to three qubits.',
  difficulty: 1,
  visual: 'qubit',
  puzzles: [
    {
      qubits: SANDBOX_DEFAULT.qubits,
      cases: [{ start: ket('00'), target: ket('00') }],
      columns: SANDBOX_DEFAULT.columns,
      gates: ALL_CELLS,
      solution: [],
    },
  ],
};

export function getLevel(id: string): LevelDef | undefined {
  return id === SANDBOX_LEVEL_ID ? SANDBOX_LEVEL : LEVELS.find(l => l.id === id);
}

export const isLevelBuilt = (level: LevelDef): boolean => level.puzzles.length > 0;

export const levelQubits = (level: LevelDef): number => Math.max(...level.puzzles.map(p => p.qubits));

export const prerequisitesOf = (id: string): string[] =>
  CONNECTIONS.filter(([, target]) => target === id).map(([source]) => source);
