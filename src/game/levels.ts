import { ALL_GATES, type GateId, type QubitState } from './engine';

export interface Puzzle {
  start: QubitState;
  /** Omitted for free play (sandbox). */
  target?: QubitState;
  slots: number;
  gates: GateId[];
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
  /** 'bit' renders a classical ball, 'qubit' renders the phase arrow. */
  visual: 'bit' | 'qubit';
  /** Played in order. An empty list means the level hasn't been built yet. */
  puzzles: Puzzle[];
}

const KET_0: QubitState = { basis: 0, phase: 0 };
const KET_1: QubitState = { basis: 1, phase: 0 };

export const LEVELS: LevelDef[] = [
  {
    id: 'root', x: 50, y: 90,
    title: 'System Boot',
    type: 'ROOT',
    description: 'Initialize the simulation environment and verify neural link stability.',
    difficulty: 1,
    visual: 'bit',
    puzzles: [{ start: KET_0, target: KET_1, slots: 3, gates: ['X'] }],
  },
  // Classical branch (left)
  {
    id: 'c1', x: 35, y: 70,
    title: 'Binary Basis',
    type: 'CLASSICAL',
    description: 'Learn the fundamentals of deterministic bits. 0 is 0. 1 is 1. There is no middle ground.',
    difficulty: 1,
    visual: 'bit',
    puzzles: [],
  },
  {
    id: 'c2', x: 25, y: 50,
    title: 'Logic Gates',
    type: 'CLASSICAL',
    description: 'Combine bits using AND, OR, and NOT gates to create complex logic circuits.',
    difficulty: 2,
    visual: 'bit',
    puzzles: [],
  },
  {
    id: 'c3', x: 35, y: 30,
    title: 'The Transistor',
    type: 'CLASSICAL',
    description: 'The hardware revolution. Manage signal flow and amplification.',
    difficulty: 3,
    visual: 'bit',
    puzzles: [],
  },
  // Quantum branch (right)
  {
    id: 'q1', x: 65, y: 70,
    title: 'Quantum Gates',
    type: 'QUANTUM',
    description: 'Introduction to single-qubit gates. Manipulate amplitude and phase using the Pauli-X, Pauli-Z, S and Pauli-Y gates.',
    difficulty: 2,
    visual: 'qubit',
    puzzles: [
      { start: KET_0, target: KET_1, slots: 2, gates: ['X'] },
      { start: KET_1, target: KET_0, slots: 2, gates: ['X'] },
      { start: KET_0, target: { basis: 1, phase: 2 }, slots: 2, gates: ['X', 'Z'] },
      { start: KET_0, target: { basis: 0, phase: 2 }, slots: 3, gates: ['X', 'Z'] },
      { start: KET_0, target: { basis: 1, phase: 1 }, slots: 2, gates: ['X', 'Z', 'S'] },
      { start: KET_0, target: { basis: 0, phase: 1 }, slots: 3, gates: ['X', 'Z', 'S'] },
      { start: { basis: 1, phase: 2 }, target: { basis: 0, phase: 1 }, slots: 1, gates: ALL_GATES },
      { start: KET_0, target: { basis: 0, phase: 3 }, slots: 2, gates: ALL_GATES },
    ],
  },
  {
    id: 'q2', x: 75, y: 50,
    title: 'Entanglement',
    type: 'QUANTUM',
    description: 'Link two particles across space. Observing one instantly defines the other.',
    difficulty: 3,
    visual: 'qubit',
    puzzles: [],
  },
  {
    id: 'q3', x: 65, y: 30,
    title: 'Interference',
    type: 'QUANTUM',
    description: 'Use wave interference to amplify correct answers and cancel out wrong ones.',
    difficulty: 4,
    visual: 'qubit',
    puzzles: [],
  },
];

/** Campaign map edges: [prerequisite, unlocks]. */
export const CONNECTIONS: [string, string][] = [
  ['root', 'c1'],
  ['c1', 'c2'],
  ['c2', 'c3'],
  ['root', 'q1'],
  ['q1', 'q2'],
  ['q2', 'q3'],
];

export const SANDBOX_LEVEL_ID = 'sandbox';
export const SANDBOX_DEFAULT_SLOTS = 5;
export const SANDBOX_MAX_SLOTS = 8;

const SANDBOX_LEVEL: LevelDef = {
  id: SANDBOX_LEVEL_ID, x: 0, y: 0,
  title: 'Sandbox',
  type: 'QUANTUM',
  description: 'Free play with every gate.',
  difficulty: 1,
  visual: 'qubit',
  puzzles: [{ start: KET_0, slots: SANDBOX_DEFAULT_SLOTS, gates: ALL_GATES }],
};

export function getLevel(id: string): LevelDef | undefined {
  return id === SANDBOX_LEVEL_ID ? SANDBOX_LEVEL : LEVELS.find(l => l.id === id);
}

export const isLevelBuilt = (level: LevelDef): boolean => level.puzzles.length > 0;

export const prerequisitesOf = (id: string): string[] =>
  CONNECTIONS.filter(([, target]) => target === id).map(([source]) => source);
