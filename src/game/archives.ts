import type { LucideIcon } from 'lucide-react';
import { Activity, Atom, Binary, CircleDot, Cpu, Database, Network, RotateCw, SquareDashed, Waves, Zap, MoveUpRight } from 'lucide-react';

export interface ArchiveEntry {
  id: string;
  title: string;
  category: 'LORE' | 'SCIENCE' | 'MECHANIC';
  description: string;
  content: string;
  icon: LucideIcon;
  /** Level that decrypts this entry. Omitted = always readable. */
  unlockedBy?: string;
}

export const ARCHIVE_DATA: ArchiveEntry[] = [
  {
    id: '000',
    title: 'Classical Logic',
    category: 'SCIENCE',
    description: 'The deterministic foundation.',
    content: 'Classical computers rely on bits that must be either 0 OR 1. Classical algorithms manipulate these definite states using gates like AND, OR, and NOT. Unlike quantum algorithms, they cannot process multiple possibilities simultaneously via superposition.',
    icon: SquareDashed,
  },
  {
    id: '006',
    title: 'The Bit',
    category: 'SCIENCE',
    description: 'The atom of classical information.',
    content: 'The bit (binary digit) is the most basic unit of information in computing. It represents a logical state with one of two possible values: 0 or 1. Physically, this corresponds to a transistor being off or on, a capacitor being discharged or charged, or a switch being open or closed. In this simulation, the blue ball represents the physical state of a bit.',
    icon: Binary,
  },
  {
    id: '001',
    title: 'The Qubit',
    category: 'SCIENCE',
    description: 'Fundamental unit of quantum information.',
    content: 'Unlike a classical bit which can be 0 or 1, a Qubit exists in a superposition of both states simultaneously until measured. This allows for exponentially greater computational power in specific problem spaces.',
    icon: Atom,
  },
  {
    id: '010',
    title: 'State Vector',
    category: 'SCIENCE',
    description: 'Mathematical description of a quantum state.',
    content: 'A state vector is a mathematical object (specifically a vector in a complex Hilbert space) that completely describes the state of a quantum system. In our visualization, this is represented by the Arrow. The direction and length of the arrow correspond to the properties of the state vector (Phase and Amplitude).',
    icon: MoveUpRight,
  },
  {
    id: '008',
    title: 'Phase',
    category: 'SCIENCE',
    description: 'Direction in the complex plane.',
    content: 'In quantum mechanics, the state of a qubit is described by a vector. The Phase corresponds to the angle of this vector. In our visualization, the direction the arrow points represents the phase. An arrow pointing UP represents a phase of 0. An arrow pointing DOWN represents a phase of 180 degrees (or π), often mathematically denoted as a negative amplitude (-|0⟩).',
    icon: Activity,
  },
  {
    id: '009',
    title: 'Amplitude',
    category: 'SCIENCE',
    description: 'Magnitude of probability.',
    content: 'The Amplitude is related to the probability of finding the qubit in a specific state upon measurement. In the visualization, the length of the arrow represents the amplitude. For a pure qubit state, the total probability must always equal 1 (Unitary).',
    icon: Zap,
  },
  {
    id: '002',
    title: 'Superposition',
    category: 'MECHANIC',
    description: 'Game Mechanic: State duality.',
    content: 'In Quantum Odyssey, Superposition allows a puzzle element to activate multiple pathways at once. However, observing the path collapses the waveform into a single outcome.',
    icon: Binary,
  },
  {
    id: '003',
    title: 'Entanglement',
    category: 'SCIENCE',
    description: 'Spooky action at a distance.',
    content: 'When two particles become entangled, measuring one immediately tells you what a measurement of the other will show, regardless of the distance separating them. Einstein famously referred to this as "spooky action at a distance". Entanglement cannot be used to send messages faster than light.',
    icon: Network,
  },
  {
    id: '007',
    title: 'Pauli-X Gate',
    category: 'SCIENCE',
    description: 'The Quantum NOT Gate.',
    content: 'The Pauli-X gate (P-X) acts on a single qubit. It is the quantum equivalent of the classical NOT gate. It swaps the amplitudes of the |0⟩ and |1⟩ states. Visually, this moves the arrow from the |0⟩ node to the |1⟩ node.',
    icon: Cpu,
  },
  {
    id: '011',
    title: 'Pauli-Z Gate',
    category: 'SCIENCE',
    description: 'The phase flip.',
    content: 'The Pauli-Z gate (P-Z) leaves |0⟩ untouched and multiplies |1⟩ by -1, a 180° phase rotation. Visually, an arrow sitting in the |1⟩ node flips from pointing UP to pointing DOWN, while an arrow in the |0⟩ node does not move. Applying it twice returns the qubit to where it started.',
    icon: RotateCw,
  },
  {
    id: '012',
    title: 'S Gate',
    category: 'SCIENCE',
    description: 'The quarter-turn phase gate.',
    content: 'The S gate leaves |0⟩ untouched and multiplies |1⟩ by i, a 90° phase rotation. It is "half" of a Pauli-Z: two S gates in a row act exactly like one P-Z, and four S gates bring the arrow all the way around.',
    icon: CircleDot,
  },
  {
    id: '013',
    title: 'Pauli-Y Gate',
    category: 'SCIENCE',
    description: 'Flip and rotate at once.',
    content: 'The Pauli-Y gate (P-Y) maps |0⟩ to i|1⟩ and |1⟩ to -i|0⟩. It moves the arrow between nodes like Pauli-X while also turning its phase by a quarter. Mathematically, Y = i·X·Z.',
    icon: Waves,
  },
  {
    id: '004',
    title: 'Project Odyssey',
    category: 'LORE',
    description: 'CLASSIFIED: Origins of the simulation.',
    content: 'Project Odyssey was initiated in 2042 following the Great Silicon Collapse. The goal: create a human-quantum interface capable of stabilizing high-coherence qubit arrays via direct neural link.',
    icon: Database,
    unlockedBy: 'q3',
  },
  {
    id: '005',
    title: 'Quantum Gates',
    category: 'MECHANIC',
    description: 'Manipulating qubit states.',
    content: 'Gates like Hadamard (H), Pauli-X (Not), and CNOT are used to manipulate the probabilities of qubits. Mastering these gates is essential for solving complex cryptographic puzzles.',
    icon: Cpu,
    unlockedBy: 'q1',
  },
];
