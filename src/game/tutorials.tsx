import { createContext, useContext, type ReactNode } from 'react';
import type { Circuit, QubitState } from './engine';

export interface LoopRange {
  enabled: boolean;
  start: number;
  end: number;
}

export type SystemMode = 'PUZZLE' | 'SANDBOX';

/** Everything a tutorial step may inspect to decide whether the player has done what it asked. */
export interface TutorialContext {
  isPlaying: boolean;
  hasPausedThisStep: boolean;
  lastResumeTime: number | null;
  loop: LoopRange;
  mode: SystemMode;
  initialState: QubitState;
  playbackSpeed: number;
  sidebarOpen: boolean;
  circuit: Circuit;
  openedArchives: ReadonlySet<string>;
}

export interface TutorialStep {
  /** Index of the level puzzle this step belongs to. */
  puzzle: number;
  text: ReactNode;
  /** Enables NEXT. Omitted means the step is informational. */
  isDone?: (ctx: TutorialContext) => boolean;
  /** The step only ends when the current puzzle is solved (the game advances it). */
  awaitsSolve?: boolean;
}

/** Lets tutorial text open an archive entry without threading callbacks through the step data. */
export const ArchiveLinkContext = createContext<(archiveId: string) => void>(() => {});

function Term({ id, children }: { id: string; children: ReactNode }) {
  const openArchive = useContext(ArchiveLinkContext);
  return (
    <button type="button" data-archive={id} onClick={() => openArchive(id)} className="inline text-red-500 font-bold hover:underline">
      {children}
    </button>
  );
}

const resumedNear = (ctx: TutorialContext, t: number) =>
  ctx.hasPausedThisStep && ctx.isPlaying && ctx.lastResumeTime !== null && Math.abs(ctx.lastResumeTime - t) <= 0.2;

const ROOT_TUTORIAL: TutorialStep[] = [
  { puzzle: 0, text: <>Welcome to the Computation Simulation Interface. Displayed below is the fundamental unit of information: a "bit".</> },
  { puzzle: 0, text: <>A classical "bit" is either 0 or 1. The bit is initialized to state |0⟩ at time t=0.0, represented by the blue ball sitting in the left node.</> },
  {
    puzzle: 0,
    text: <>To learn more, click on words that appear in red and the archive will appear. Try it out now: click on <Term id="006">bit</Term>. You do not need to do this to learn how to play the game.</>,
    isDone: ctx => ctx.openedArchives.has('006'),
  },
  { puzzle: 0, text: <>The circular timer below tracks the passage of time. We haven't given any instructions to the bit yet, so the blue ball stays at |0⟩ even as time moves.</> },
  {
    puzzle: 0,
    text: <>You can traverse the timeline manually. Pause, then use the arrow buttons inside the timer or drag the yellow marker to set the clock to t=2.0, then press play.</>,
    isDone: ctx => resumedNear(ctx, 2),
  },
  {
    puzzle: 0,
    text: <>Let's test further. Pause the simulation, use the arrow buttons to set the time to t=1.0, and press play to resume.</>,
    isDone: ctx => resumedNear(ctx, 1),
  },
  {
    puzzle: 0,
    text: <>You can create custom loops to focus on specific timeframes. Click the repeat button to enable loop mode. Then drag the green start handle to t=1.0 and the red end handle to t=2.0. Custom loops snap to whole time steps.</>,
    isDone: ctx => ctx.loop.enabled && Math.abs(ctx.loop.start - 1) < 0.25 && Math.abs(ctx.loop.end - 2) < 0.25,
  },
  {
    puzzle: 0,
    text: <>Now locate the mode switch at the bottom of the interface and toggle it to SANDBOX mode.</>,
    isDone: ctx => ctx.mode === 'SANDBOX',
  },
  {
    puzzle: 0,
    text: <>In sandbox mode you can alter the initial state of the system. Drag the ball from the |0⟩ node over to the |1⟩ node, then press play.</>,
    isDone: ctx => ctx.initialState.basis === 1 && ctx.isPlaying,
  },
  { puzzle: 0, text: <>Changing the starting state is a feature of SANDBOX mode. When solving a puzzle, the starting state of the system is fixed.</> },
  {
    puzzle: 0,
    text: <>You can also change the simulation speed to 0.25x, 0.5x, 1x, 2x or 4x using the arrows under the play button. Try it now.</>,
    isDone: ctx => ctx.playbackSpeed !== 1,
  },
  {
    puzzle: 0,
    text: <>Gates live in the operator sidebar. Open it by clicking the panel icon in the top left corner.</>,
    isDone: ctx => ctx.sidebarOpen,
  },
  {
    puzzle: 0,
    text: <>Let's apply what we've learned. Switch the mode back to PUZZLE to start the challenge. This resets and locks the initial state to |0⟩.</>,
    isDone: ctx => ctx.mode === 'PUZZLE',
  },
  {
    puzzle: 0,
    text: <>The goal is to reach the state |1⟩. Drag the NOT gate from the sidebar into any empty slot on the timeline (or tap the gate, then tap a slot).</>,
    isDone: ctx => ctx.circuit.some(g => g === 'X'),
  },
  {
    puzzle: 0,
    text: <>Press play to run the circuit and watch the NOT gate flip the bit from |0⟩ to |1⟩. The level completes automatically on success.</>,
    awaitsSolve: true,
  },
];

const Q1_TUTORIAL: TutorialStep[] = [
  { puzzle: 0, text: <>Welcome to Quantum Logic. While classical bits are strictly 0 or 1, quantum bits (qubits) are described by an arrow, the <Term id="010">state vector</Term>.</> },
  { puzzle: 0, text: <>The arrow is currently in the |0⟩ node. Its direction represents the <Term id="008">phase</Term> (up = 0°). Its length represents the <Term id="009">amplitude</Term>.</> },
  {
    puzzle: 0,
    text: <>We want to move the amplitude from the |0⟩ node to the |1⟩ node. Open the sidebar and drag the <Term id="007">Pauli-X</Term> (P-X) gate onto the timeline.</>,
    isDone: ctx => ctx.circuit.some(g => g === 'X'),
  },
  { puzzle: 0, text: <>Press play. The Pauli-X gate moves the arrow from the |0⟩ node to the |1⟩ node. Notice that the arrow's direction (phase) stays up.</>, awaitsSolve: true },
  { puzzle: 1, text: <>Excellent. The circuit has been reset and the arrow now starts in |1⟩. Return it to |0⟩ using the Pauli-X gate again.</>, awaitsSolve: true },
  { puzzle: 2, text: <>New challenge: we can also manipulate phase. Your goal is -|1⟩ (state |1⟩, phase 180°): the arrow at |1⟩ pointing DOWN.</> },
  { puzzle: 2, text: <>The <Term id="011">P-Z gate</Term> flips the phase of the |1⟩ state and does nothing to |0⟩. Use it to reach the target.</>, awaitsSolve: true },
  { puzzle: 3, text: <>Challenge: reach -|0⟩ (state |0⟩, phase 180°): the arrow at |0⟩ pointing DOWN. You now have three slots.</>, awaitsSolve: true },
  { puzzle: 4, text: <>Introducing the <Term id="012">S gate</Term>. It rotates the phase of |1⟩ by 90° (a quarter turn). Target: i|1⟩ (state |1⟩, phase 90°, pointing RIGHT).</>, awaitsSolve: true },
  { puzzle: 5, text: <>Challenge: reach i|0⟩ (state |0⟩, phase 90°, pointing RIGHT).</>, awaitsSolve: true },
  { puzzle: 6, text: <>Introducing the <Term id="013">P-Y gate</Term> (Pauli-Y). It maps |0⟩ to i|1⟩ and |1⟩ to -i|0⟩. This puzzle starts at -|1⟩ (DOWN) and you only get one slot. Your goal is i|0⟩ (RIGHT).</>, awaitsSolve: true },
  { puzzle: 7, text: <>Final challenge: reach -i|0⟩ (state |0⟩, phase 270°, pointing LEFT).</>, awaitsSolve: true },
];

export const TUTORIALS: Record<string, TutorialStep[]> = {
  root: ROOT_TUTORIAL,
  q1: Q1_TUTORIAL,
};

export const firstStepOfPuzzle = (steps: TutorialStep[], puzzle: number): number =>
  Math.max(0, steps.findIndex(s => s.puzzle === puzzle));
