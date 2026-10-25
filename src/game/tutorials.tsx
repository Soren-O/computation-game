import { createContext, useContext, type ReactNode } from 'react';
import { cAbs, type Circuit, type QState } from './quantum';

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
  initialState: QState;
  playbackSpeed: number;
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
    <button type="button" data-archive={id} onClick={() => openArchive(id)} className="inline text-red-400 font-semibold underline decoration-red-400/40 underline-offset-2 hover:decoration-red-400">
      {children}
    </button>
  );
}

/** Direction words, so the text always matches the drawing (arrow = amplitude in the complex plane). */
const Dir = ({ children }: { children: ReactNode }) => <strong className="text-white">{children}</strong>;

const resumedNear = (ctx: TutorialContext, t: number) =>
  ctx.hasPausedThisStep && ctx.isPlaying && ctx.lastResumeTime !== null && Math.abs(ctx.lastResumeTime - t) <= 0.2;

const usesGate = (ctx: TutorialContext, gate: string) => ctx.circuit.some(col => col.some(cell => cell === gate));

const ROOT_TUTORIAL: TutorialStep[] = [
  { puzzle: 0, text: <>Welcome to the Computation Simulation Interface. On screen is the fundamental unit of information: a <Term id="006">bit</Term>.</> },
  { puzzle: 0, text: <>A classical bit is either 0 or 1, so it has two places to be: the circle on the left is |0⟩, the circle on the right is |1⟩. The glowing ball says the bit is 0.</> },
  {
    puzzle: 0,
    text: <>Words in red open the Data Bank. Try it now: click <Term id="006">bit</Term>. (Reading entries is optional.)</>,
    isDone: ctx => ctx.openedArchives.has('006'),
  },
  { puzzle: 0, text: <>The timeline at the bottom tracks time. The playhead sweeps from IN, through each slot of the circuit, to OUT. No instructions have been placed yet, so the ball stays at |0⟩.</> },
  {
    puzzle: 0,
    text: <>You can move through time yourself. Pause, set the clock to t = 2.0 by dragging the playhead or using the step buttons, then press play.</>,
    isDone: ctx => resumedNear(ctx, 2),
  },
  {
    puzzle: 0,
    text: <>Again: pause, go to t = 1.0, and press play.</>,
    isDone: ctx => resumedNear(ctx, 1),
  },
  {
    puzzle: 0,
    text: <>Loops replay part of the timeline. Turn on loop mode, then drag the green handle to t = 1.0 and the red handle to t = 2.0. Loops snap to whole steps.</>,
    isDone: ctx => ctx.loop.enabled && Math.abs(ctx.loop.start - 1) < 0.25 && Math.abs(ctx.loop.end - 2) < 0.25,
  },
  {
    puzzle: 0,
    text: <>Now switch the system mode to SANDBOX.</>,
    isDone: ctx => ctx.mode === 'SANDBOX',
  },
  {
    puzzle: 0,
    text: <>In sandbox mode you choose where the system starts. Drag the ball onto the |1⟩ circle (or just tap that circle), then press play.</>,
    isDone: ctx => cAbs(ctx.initialState[1]) > 0.99 && ctx.isPlaying,
  },
  { puzzle: 0, text: <>Choosing the starting state is a SANDBOX feature. In a puzzle the starting state is fixed and you change the outcome with gates.</> },
  {
    puzzle: 0,
    text: <>You can also change the simulation speed: 0.25x up to 4x, with the arrows beside the speed readout. Try it.</>,
    isDone: ctx => ctx.playbackSpeed !== 1,
  },
  { puzzle: 0, text: <>Gates live in the palette above the timeline. Each one is an instruction applied to a wire at one moment in time.</> },
  {
    puzzle: 0,
    text: <>Let's solve the puzzle. Switch back to PUZZLE mode: this locks the start to |0⟩ and turns the loop off.</>,
    isDone: ctx => ctx.mode === 'PUZZLE',
  },
  {
    puzzle: 0,
    text: <>The goal is |1⟩ (the dashed ring). Drag the NOT gate onto any slot on the wire, or tap the gate and then tap a slot.</>,
    isDone: ctx => usesGate(ctx, 'X'),
  },
  { puzzle: 0, text: <>Press play and watch NOT slide the ball from |0⟩ to |1⟩. The level completes when a run ends on the goal.</>, awaitsSolve: true },
];

const Q1_TUTORIAL: TutorialStep[] = [
  { puzzle: 0, text: <>Welcome to Quantum Logic. A classical bit sits in one circle. A <Term id="001">qubit</Term> has an amplitude in every circle, drawn as an arrow: the <Term id="010">state vector</Term>.</> },
  {
    puzzle: 0,
    text: <>Each arrow is a complex number. Its direction is the <Term id="008">phase</Term>: <Dir>right</Dir> = +1, <Dir>up</Dir> = +i, <Dir>left</Dir> = -1, <Dir>down</Dir> = -i. Its length is the <Term id="009">amplitude</Term>, and the filled disk's area is the probability.</>,
  },
  {
    puzzle: 0,
    text: <>Move the amplitude from |0⟩ to |1⟩. Drag the <Term id="007">Pauli-X</Term> (X) gate onto the wire.</>,
    isDone: ctx => usesGate(ctx, 'X'),
  },
  { puzzle: 0, text: <>Press play. X slides the arrow from |0⟩ to |1⟩, and the arrow keeps pointing <Dir>right</Dir>: its phase doesn't change.</>, awaitsSolve: true },
  { puzzle: 1, text: <>The circuit has been reset and the arrow now starts in |1⟩. Send it back to |0⟩.</>, awaitsSolve: true },
  { puzzle: 2, text: <>New goal: -|1⟩, the arrow in |1⟩ pointing <Dir>left</Dir>. The dashed ghost arrow always shows the goal.</> },
  { puzzle: 2, text: <>The <Term id="011">Z gate</Term> turns the arrow in |1⟩ half a turn (multiplies it by -1) and leaves |0⟩ alone.</>, awaitsSolve: true },
  { puzzle: 3, text: <>Reach -|0⟩: the arrow in |0⟩ pointing <Dir>left</Dir>. You have three slots.</>, awaitsSolve: true },
  { puzzle: 4, text: <>The <Term id="012">S gate</Term> turns the arrow in |1⟩ a quarter turn counterclockwise (multiplies by i). Reach i|1⟩: <Dir>up</Dir> in |1⟩.</>, awaitsSolve: true },
  { puzzle: 5, text: <>Reach i|0⟩: <Dir>up</Dir> in |0⟩.</>, awaitsSolve: true },
  { puzzle: 6, text: <>The <Term id="013">Y gate</Term> slides and turns at once: |0⟩ becomes i|1⟩ and |1⟩ becomes -i|0⟩. Start: -|1⟩ (<Dir>left</Dir>). Goal: i|0⟩ (<Dir>up</Dir>). One slot.</>, awaitsSolve: true },
  { puzzle: 7, text: <>Final challenge: reach -i|0⟩, <Dir>down</Dir> in |0⟩.</>, awaitsSolve: true },
];

const Q2_TUTORIAL: TutorialStep[] = [
  {
    puzzle: 0,
    text: <>The <Term id="014">Hadamard</Term> (H) gate splits each arrow along the edge: a piece stays and a piece slides across, each 1/√2 long. Make |+⟩ from |0⟩: two arrows pointing <Dir>right</Dir>, one in each circle. That's <Term id="002">superposition</Term>.</>,
    awaitsSolve: true,
  },
  { puzzle: 1, text: <>Start from |1⟩ and apply H. This time the piece that stays in |1⟩ is flipped to point <Dir>left</Dir>: the state |−⟩.</>, awaitsSolve: true },
  {
    puzzle: 2,
    text: <>Start from |+⟩ and apply H again. Watch the pieces meet: in |0⟩ they point the same way and add up; in |1⟩ they point opposite ways and cancel. That's <Term id="019">interference</Term>.</>,
    awaitsSolve: true,
  },
  { puzzle: 3, text: <>Turn |0⟩ into |1⟩ using only H and Z. Hint: while the qubit is spread across both circles, Z can flip one of the arrows.</>, awaitsSolve: true },
  { puzzle: 4, text: <>Reach |−⟩ (<Dir>right</Dir> in |0⟩, <Dir>left</Dir> in |1⟩) in two slots.</>, awaitsSolve: true },
  { puzzle: 5, text: <>Reach (|0⟩ + i|1⟩)/√2: the arrow in |1⟩ points <Dir>up</Dir>.</>, awaitsSolve: true },
  { puzzle: 6, text: <>Start from |+⟩ and reach |−⟩ in one slot. Probability doesn't move at all; only a phase changes.</>, awaitsSolve: true },
];

const C1_TUTORIAL: TutorialStep[] = [
  {
    puzzle: 0,
    text: <>Two bits have four combinations, so there are four circles, on the corners of a square (see <Term id="018">the hypercube</Term>). Each wire is one direction of the square: the first wire (q0) moves the ball left–right. Labels list the bits in wire order, |q0 q1⟩. Reach |10⟩.</>,
    awaitsSolve: true,
  },
  { puzzle: 1, text: <>The second wire (q1) moves the ball bottom-to-top. Reach |01⟩.</>, awaitsSolve: true },
  { puzzle: 2, text: <>Gates in the same column act at the same moment. Reach |11⟩ in one step: the ball cuts straight across the diagonal.</>, awaitsSolve: true },
  { puzzle: 3, text: <><Term id="016">SWAP</Term> exchanges two bits: place it on both wires in one column. It mirrors the square across its diagonal. Turn |10⟩ into |01⟩.</>, awaitsSolve: true },
  { puzzle: 4, text: <>Back to |00⟩ from |11⟩, in a single step.</>, awaitsSolve: true },
];

const C2_TUTORIAL: TutorialStep[] = [
  { puzzle: 0, text: <>Three bits: eight circles on the corners of a cube. q2 is the third direction, front-to-back. Drag to rotate the cube. Reach the far corner, |111⟩, in one step.</>, awaitsSolve: true },
  {
    puzzle: 1,
    text: <>A <Term id="015">control dot</Term> (●) makes the other gates in its column act only when its wire is 1. This puzzle has two inputs, shown as tabs above the timeline; both must end right. Copy q0 into q1.</>,
    awaitsSolve: true,
  },
  { puzzle: 2, text: <>Three controlled-NOTs, alternating direction, swap two bits without a SWAP gate. Check every input tab.</>, awaitsSolve: true },
  { puzzle: 3, text: <>Two control dots: X fires only when both are 1. That's <Term id="017">AND</Term>, written into q2, and it's reversible because q0 and q1 are kept.</>, awaitsSolve: true },
  { puzzle: 4, text: <>Now OR: q2 should end up 1 if either input is 1. You have three columns. (a XOR b XOR ab = a OR b.)</>, awaitsSolve: true },
];

const C3_TUTORIAL: TutorialStep[] = [
  { puzzle: 0, text: <>Counting in binary: q0 is the 1s bit and q1 the 2s bit, so |10⟩ is 1 and |01⟩ is 2. Build +1 (wrapping 3 back to 0) that works for every input tab.</>, awaitsSolve: true },
  { puzzle: 1, text: <>Three bits count to 7: q0 is 1s, q1 is 2s, q2 is 4s. Add 2 (wrapping past 7). Adding 2 never touches the 1s bit, so it's the two-bit counter again, one face over.</>, awaitsSolve: true },
  { puzzle: 2, text: <>A full 3-bit counter: +1 for every input, with 7 wrapping to 0. A bit flips when all the bits below it are 1, so carry from the top down.</>, awaitsSolve: true },
  { puzzle: 3, text: <>Now count down: -1, with 0 wrapping to 7. Every gate here is its own inverse, so undoing a circuit means running it backwards.</>, awaitsSolve: true },
];

const Q3_TUTORIAL: TutorialStep[] = [
  { puzzle: 0, text: <>Two qubits: every corner of the square holds its own arrow. H on q0 splits arrows along the q0 direction only: the left line slides halfway onto the right line.</>, awaitsSolve: true },
  { puzzle: 1, text: <>H on both wires at once spreads the arrow over all four corners, each 1/2 long.</>, awaitsSolve: true },
  {
    puzzle: 2,
    text: <>A controlled-X (CNOT) slides arrows only along the side of the square where the control is 1. Make (|00⟩ + |11⟩)/√2. The qubits are now <Term id="003">entangled</Term>: a <Term id="020">Bell state</Term>.</>,
    awaitsSolve: true,
  },
  { puzzle: 3, text: <>Another Bell state: (|00⟩ − |11⟩)/√2, with the |11⟩ arrow pointing <Dir>left</Dir>.</>, awaitsSolve: true },
  { puzzle: 4, text: <>Bell state (|01⟩ + |10⟩)/√2: the arrows sit on the other diagonal.</>, awaitsSolve: true },
  { puzzle: 5, text: <>A controlled-Z flips only the |11⟩ corner, so it doesn't matter which wire holds the dot: it's symmetric. Flip |11⟩ in one step.</>, awaitsSolve: true },
];

const Q4_TUTORIAL: TutorialStep[] = [
  {
    puzzle: 0,
    text: <>The target qubit starts in |−⟩. A CNOT onto |−⟩ moves no probability at all; instead the minus sign kicks back onto the control's |1⟩ side. That's <Term id="022">phase kickback</Term>.</>,
    awaitsSolve: true,
  },
  {
    puzzle: 1,
    text: <><Term id="023">Deutsch's algorithm</Term>: the CNOT is a hidden function f(x) = x. One run, with H before and after, tells whether f is constant or balanced: q0 ends in |1⟩ for balanced.</>,
    awaitsSolve: true,
  },
  {
    puzzle: 2,
    text: <><Term id="024">Grover search</Term> over four states. Spread out (H H), mark |11⟩ with a CZ, then reflect about the average (H H, Z Z, CZ, H H). Interference piles every arrow onto |11⟩.</>,
    awaitsSolve: true,
  },
  { puzzle: 3, text: <>Search for |01⟩ instead. Mark it by surrounding the CZ with X gates on q0, so the flip lands on the corner where q0 is 0.</>, awaitsSolve: true },
];

const Q5_TUTORIAL: TutorialStep[] = [
  { puzzle: 0, text: <>Three qubits on a cube. Spread the arrow evenly over all eight corners in one step.</>, awaitsSolve: true },
  { puzzle: 1, text: <>The <Term id="025">GHZ state</Term>: (|000⟩ + |111⟩)/√2, arrows only on two opposite corners. One control dot can drive several targets in the same column.</>, awaitsSolve: true },
  { puzzle: 2, text: <>Flip the sign of the single corner |111⟩: a doubly controlled Z.</>, awaitsSolve: true },
  { puzzle: 3, text: <>A control dot works on SWAP too (the Fredkin gate). Exchange q1 and q2, but only on the half of the cube where q0 is 1.</>, awaitsSolve: true },
  { puzzle: 4, text: <>Spread over the cube with each arrow's sign set by parity: <Dir>right</Dir> for an even number of 1s, <Dir>left</Dir> for odd.</>, awaitsSolve: true },
];

const LAB_TUTORIAL: TutorialStep[] = [
  {
    puzzle: 0,
    text: <>Four qubits, sixteen corners: one <Term id="018">hypercube</Term>, drawn in its most symmetric view. Each wire is one direction, q0 → , q1 ↑, q2 ↗, q3 ↖, all the same length, so a gate on a wire shifts amplitude by the same arrow everywhere on the shape.</>,
  },
  {
    puzzle: 0,
    text: <>The circuit runs one of every kind of gate. Watch the marks: a walkway for amplitude that moves (X), a walkway with spinners for amplitude that moves and turns (Y), arrows around the circle for amplitude that turns in place (Z, S, T), and both at once for H. A control dot limits a gate to half the tesseract; SWAP walks across diagonals.</>,
  },
  {
    puzzle: 0,
    text: <>Everything is editable, and tapping a corner restarts from that state. The VIEW button switches to the cube-inside-a-cube drawing, which you can drag to rotate.</>,
  },
];

export const TUTORIALS: Record<string, TutorialStep[]> = {
  root: ROOT_TUTORIAL,
  q1: Q1_TUTORIAL,
  q2: Q2_TUTORIAL,
  q3: Q3_TUTORIAL,
  q4: Q4_TUTORIAL,
  q5: Q5_TUTORIAL,
  c1: C1_TUTORIAL,
  c2: C2_TUTORIAL,
  c3: C3_TUTORIAL,
  lab4: LAB_TUTORIAL,
};

export const firstStepOfPuzzle = (steps: TutorialStep[], puzzle: number): number =>
  Math.max(0, steps.findIndex(s => s.puzzle === puzzle));
