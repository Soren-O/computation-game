// Pure simulation engine for a single qubit restricted to basis states with a
// quarter-turn global phase: e^(i·phase·π/2)·|basis⟩. Every gate in the game
// (X, Z, S, Y) maps such states to such states, so this model is exact for now.
//
// Timing model: a run lasts `slots + 1` time units. The first unit is an idle
// lead-in, then slot k (0-based) executes during [k + 1, k + 2).

export type GateId = 'X' | 'Z' | 'S' | 'Y';

/** Quarter turns: 0 = 0°, 1 = 90° (i), 2 = 180° (-1), 3 = 270° (-i). */
export type Phase = 0 | 1 | 2 | 3;

export interface QubitState {
  basis: 0 | 1;
  phase: Phase;
}

/** Continuous state used for animation; values are fractional mid-gate. */
export interface VisualState {
  basis: number;
  phase: number;
}

export type Circuit = (GateId | null)[];

export const ALL_GATES: GateId[] = ['X', 'Z', 'S', 'Y'];

const addPhase = (phase: Phase, quarterTurns: number): Phase =>
  ((((phase + quarterTurns) % 4) + 4) % 4) as Phase;

export function applyGate(gate: GateId | null, state: QubitState): QubitState {
  switch (gate) {
    case 'X':
      return { basis: state.basis === 0 ? 1 : 0, phase: state.phase };
    case 'Z':
      return state.basis === 1 ? { basis: 1, phase: addPhase(state.phase, 2) } : state;
    case 'S':
      return state.basis === 1 ? { basis: 1, phase: addPhase(state.phase, 1) } : state;
    case 'Y':
      // Y|0⟩ = i|1⟩, Y|1⟩ = -i|0⟩
      return state.basis === 0
        ? { basis: 1, phase: addPhase(state.phase, 1) }
        : { basis: 0, phase: addPhase(state.phase, 3) };
    default:
      return state;
  }
}

export const runDuration = (circuit: Circuit): number => circuit.length + 1;

/** Index of the slot executing at time t, or null during the lead-in / after the end. */
export function activeSlotAt(circuit: Circuit, t: number): number | null {
  const slot = Math.floor(t) - 1;
  return slot >= 0 && slot < circuit.length ? slot : null;
}

/** Discrete state after every gate that has fully finished by time t. */
export function stateAt(start: QubitState, circuit: Circuit, t: number): QubitState {
  const completed = Math.min(circuit.length, Math.max(0, Math.floor(t) - 1));
  let state = start;
  for (let i = 0; i < completed; i++) state = applyGate(circuit[i], state);
  return state;
}

export const finalState = (start: QubitState, circuit: Circuit): QubitState =>
  stateAt(start, circuit, runDuration(circuit));

/** Interpolated state for rendering; the active gate is `progress` of the way through. */
export function visualStateAt(start: QubitState, circuit: Circuit, t: number): VisualState {
  const before = stateAt(start, circuit, t);
  const slot = activeSlotAt(circuit, t);
  const visual: VisualState = { basis: before.basis, phase: before.phase };
  if (slot === null) return visual;

  const progress = t - Math.floor(t);
  switch (circuit[slot]) {
    case 'X':
      visual.basis = before.basis === 0 ? progress : 1 - progress;
      break;
    case 'Z':
      if (before.basis === 1) visual.phase = before.phase + 2 * progress;
      break;
    case 'S':
      if (before.basis === 1) visual.phase = before.phase + progress;
      break;
    case 'Y':
      if (before.basis === 0) {
        visual.basis = progress;
        visual.phase = before.phase + progress;
      } else {
        visual.basis = 1 - progress;
        visual.phase = before.phase - progress;
      }
      break;
  }
  return visual;
}

export const statesEqual = (a: QubitState, b: QubitState): boolean =>
  a.basis === b.basis && a.phase === b.phase;

const PHASE_PREFIX = ['', 'i', '-', '-i'] as const;

/** e.g. "|0⟩", "-|1⟩", "i|0⟩", "-i|1⟩" */
export const formatState = (s: QubitState): string => `${PHASE_PREFIX[s.phase]}|${s.basis}⟩`;
