import type { LucideIcon } from 'lucide-react';
import {
  Activity, ArrowLeftRight, Atom, Binary, Box, CircleDot, Combine, Cpu, Database, GitBranch, Link2, MoveUpRight,
  Network, Orbit, Repeat2, RotateCw, Search, Sigma, SquareDashed, Undo2, Waves, Zap,
} from 'lucide-react';

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
    id: '018',
    title: 'The Hypercube',
    category: 'MECHANIC',
    description: 'Why the states sit on a cube.',
    content:
      'n bits have 2ⁿ possible values, and each value is drawn as a circle at a corner of one n-dimensional cube: two circles on a line for one bit, a square for two, a cube for three. (Four bits would need a tesseract, which has no clean symmetric drawing, so the simulation stops at three.) The shape never moves; what changes over time is the amplitude on it. Every wire in the circuit is one direction of the shape (the edges share the wire\'s colour), and a gate on a wire moves amplitude along that direction only. Watched over time, X on the first bit looks like a circle sliding to the other circle; on two bits, a line sliding onto the opposite line; on three, a square onto the opposite square. Symmetries of the circuit become symmetries of the shape: X on a wire reflects the cube across that axis, SWAP mirrors it across a diagonal, and a controlled gate moves only the half of the cube where the control is 1.',
    icon: Box,
  },
  {
    id: '000',
    title: 'Classical Logic',
    category: 'SCIENCE',
    description: 'The deterministic foundation.',
    content:
      'Classical computers rely on bits that must be either 0 OR 1. Classical algorithms manipulate these definite states using gates like AND, OR, and NOT. In this simulation a classical state is a single ball on one corner of the cube, and every classical gate moves the ball to another corner.',
    icon: SquareDashed,
  },
  {
    id: '006',
    title: 'The Bit',
    category: 'SCIENCE',
    description: 'The atom of classical information.',
    content:
      'The bit (binary digit) is the most basic unit of information in computing. It represents a logical state with one of two possible values: 0 or 1. Physically, this corresponds to a transistor being off or on, a capacitor being discharged or charged, or a switch being open or closed. In this simulation, the glowing ball shows which value the bit holds.',
    icon: Binary,
  },
  {
    id: '027',
    title: 'Reversible Logic',
    category: 'SCIENCE',
    description: 'Gates that never forget.',
    content:
      'An ordinary AND gate throws information away: from an output of 0 you cannot tell which inputs produced it. Quantum gates can\'t do that, so quantum computers compute reversibly: every gate maps each input to a different output, and can be undone. On the cube this means every gate is a rearrangement of the corners. The trick for AND and OR is to keep the inputs and write the answer into an extra bit.',
    icon: Undo2,
  },
  {
    id: '001',
    title: 'The Qubit',
    category: 'SCIENCE',
    description: 'Fundamental unit of quantum information.',
    content:
      'A classical bit is in one place: 0 or 1. A qubit carries an amplitude for each place at once, a complex number for |0⟩ and one for |1⟩. Measuring it gives a single 0 or 1 at random, with probabilities set by the amplitudes. Until then, the amplitudes can interfere with each other, which is what quantum algorithms exploit.',
    icon: Atom,
  },
  {
    id: '010',
    title: 'State Vector',
    category: 'SCIENCE',
    description: 'Every amplitude, drawn as an arrow.',
    content:
      'The state vector lists one complex amplitude per basis state: 2 for one qubit, 8 for three. Here each amplitude is drawn as an arrow in its own circle. The arrow is the complex number itself, drawn in the complex plane: pointing right is +1, up is +i, left is -1, down is -i. Because the arrows are honest complex numbers, adding amplitudes is adding arrows head-to-tail, which is exactly what you see when pieces of amplitude meet.',
    icon: MoveUpRight,
  },
  {
    id: '008',
    title: 'Phase',
    category: 'SCIENCE',
    description: 'Direction in the complex plane.',
    content:
      'The phase of an amplitude is its angle in the complex plane: the direction its arrow points. Right is a phase of 0, up is 90° (multiplied by i), left is 180° (multiplied by -1), down is 270° (multiplied by -i). Phase changes nothing about probability on its own, but when two pieces of amplitude meet, their phases decide whether they add or cancel.',
    icon: Activity,
  },
  {
    id: '009',
    title: 'Amplitude',
    category: 'SCIENCE',
    description: 'Length of the arrow; area of the disk.',
    content:
      'An amplitude\'s size is the length of its arrow, measured against the circle (the circle has radius 1). The probability of measuring that basis state is the amplitude\'s size squared, drawn as the filled disk: a disk of radius |a| has area proportional to |a|². All the probabilities always add up to 1.',
    icon: Zap,
  },
  {
    id: '021',
    title: 'Global Phase',
    category: 'SCIENCE',
    description: 'Turning every arrow at once.',
    content:
      'Rotating every arrow by the same angle changes no measurement: -|0⟩ and |0⟩ describe the same physical state. Only relative phases (one arrow compared to another) are observable. The puzzles still ask for the exact arrows, because matching them exactly is the clearest way to learn what each gate does, and because once the qubit is part of a bigger superposition that "global" phase becomes a relative one.',
    icon: Orbit,
  },
  {
    id: '002',
    title: 'Superposition',
    category: 'SCIENCE',
    description: 'Amplitude in more than one place.',
    content:
      'A superposition is a state with nonzero amplitude on more than one corner. It is not "secretly one of them": the arrows on different corners can later be brought together and interfere, something a coin that is merely unknown could never do. Measuring a superposition picks one corner at random with probability given by the disks.',
    icon: Combine,
  },
  {
    id: '019',
    title: 'Interference',
    category: 'SCIENCE',
    description: 'Arrows that add and arrows that cancel.',
    content:
      'When a gate sends several pieces of amplitude to the same corner, they add as arrows: head-to-tail. Pieces pointing the same way make a longer arrow (constructive interference); pieces pointing opposite ways cancel (destructive interference). H then H returns |0⟩ to |0⟩ because, at |1⟩, the two pieces point opposite ways and vanish. Quantum algorithms are choreographies of interference.',
    icon: Waves,
  },
  {
    id: '003',
    title: 'Entanglement',
    category: 'SCIENCE',
    description: 'States that don\'t split into parts.',
    content:
      'Two qubits are entangled when their joint state can\'t be written as "this state for the first, that state for the second". (|00⟩ + |11⟩)/√2 is the classic example: each qubit alone is a random 0 or 1, yet the two always agree. On the square you can see it: the amplitude sits on one diagonal, and no single slide along one direction can produce that shape from one corner. Measuring one qubit tells you what the other will show, but entanglement cannot send a message faster than light.',
    icon: Network,
  },
  {
    id: '020',
    title: 'Bell States',
    category: 'SCIENCE',
    description: 'The four maximally entangled pairs.',
    content:
      'The Bell states are (|00⟩ ± |11⟩)/√2 and (|01⟩ ± |10⟩)/√2. On the square they are the two diagonals, each with the arrows pointing the same way or opposite ways. Each one is made by H on one qubit followed by a CNOT, with X or Z gates choosing which of the four you get.',
    icon: Link2,
  },
  {
    id: '025',
    title: 'GHZ State',
    category: 'SCIENCE',
    description: 'Entanglement across many qubits.',
    content:
      'The Greenberger–Horne–Zeilinger state (|00…0⟩ + |11…1⟩)/√2 puts all the amplitude on two opposite corners of the cube: the longest diagonal. Every qubit is random on its own, and all of them always agree.',
    icon: GitBranch,
  },
  {
    id: '007',
    title: 'Pauli-X Gate',
    category: 'SCIENCE',
    description: 'The quantum NOT gate.',
    content:
      'The Pauli-X gate (X) is the quantum equivalent of the classical NOT gate. It swaps the amplitudes of |0⟩ and |1⟩. On the cube, X on a wire slides every arrow across to the opposite face along that wire\'s direction, without turning it.',
    icon: Cpu,
  },
  {
    id: '011',
    title: 'Pauli-Z Gate',
    category: 'SCIENCE',
    description: 'The phase flip.',
    content:
      'The Pauli-Z gate (Z) leaves |0⟩ untouched and multiplies |1⟩ by -1, a 180° phase rotation. Nothing moves between corners: the arrows on the side where the wire is 1 turn half a turn. Applying it twice returns everything to where it started.',
    icon: RotateCw,
  },
  {
    id: '012',
    title: 'S Gate',
    category: 'SCIENCE',
    description: 'The quarter-turn phase gate.',
    content:
      'The S gate leaves |0⟩ untouched and multiplies |1⟩ by i: the arrow turns a quarter turn counterclockwise. It is half of a Z gate (S·S = Z), and S† (S-dagger) turns the other way, undoing it.',
    icon: CircleDot,
  },
  {
    id: '026',
    title: 'T Gate',
    category: 'SCIENCE',
    description: 'The eighth-turn phase gate.',
    content:
      'The T gate multiplies |1⟩ by e^(iπ/4): an eighth of a turn counterclockwise. Two T gates make an S. T† turns the other way. Together with H and CNOT, T is enough to approximate any quantum computation.',
    icon: RotateCw,
  },
  {
    id: '013',
    title: 'Pauli-Y Gate',
    category: 'SCIENCE',
    description: 'Flip and turn at once.',
    content:
      'The Pauli-Y gate (Y) maps |0⟩ to i|1⟩ and |1⟩ to -i|0⟩. It slides the arrow across like X while also turning it a quarter turn. Mathematically, Y = i·X·Z.',
    icon: Repeat2,
  },
  {
    id: '014',
    title: 'Hadamard Gate',
    category: 'SCIENCE',
    description: 'The gate that creates superposition.',
    content:
      'The Hadamard gate (H) splits each arrow in two along its wire\'s direction: one piece stays and one piece slides across, each 1/√2 as long. Only the piece that starts on the 1 side and stays there is flipped. So |0⟩ becomes |+⟩ = (|0⟩ + |1⟩)/√2 and |1⟩ becomes |−⟩ = (|0⟩ − |1⟩)/√2. Applying H twice undoes it, by interference.',
    icon: Sigma,
  },
  {
    id: '015',
    title: 'Controlled Gates',
    category: 'MECHANIC',
    description: 'The control dot.',
    content:
      'A control dot (●) in a column makes every other gate in that column act only where the dot\'s wire is 1. On the cube, the gate moves the half of the shape where the control is 1 and leaves the other half alone. Control + X is the CNOT (controlled-NOT), the workhorse two-qubit gate; two dots + X is the Toffoli gate; control + Z flips the sign of the corner where both wires are 1.',
    icon: CircleDot,
  },
  {
    id: '016',
    title: 'SWAP Gate',
    category: 'SCIENCE',
    description: 'Exchanging two wires.',
    content:
      'SWAP exchanges the values of two wires: place × on both wires in the same column. On the cube it is a mirror across a diagonal plane: |10⟩ and |01⟩ trade places while |00⟩ and |11⟩ stay put. With a control dot it becomes the Fredkin gate.',
    icon: ArrowLeftRight,
  },
  {
    id: '017',
    title: 'Toffoli Gate',
    category: 'SCIENCE',
    description: 'Reversible AND.',
    content:
      'The Toffoli gate flips its target only when both controls are 1: target ⊕= a AND b. Starting from a target of 0, it computes AND while keeping both inputs, which makes it reversible. Toffoli plus NOT can build any classical circuit.',
    icon: Cpu,
  },
  {
    id: '022',
    title: 'Phase Kickback',
    category: 'SCIENCE',
    description: 'When the target pushes back.',
    content:
      'If a controlled gate\'s target is already in a state the gate only multiplies by a phase, nothing moves on the target: the phase lands on the control instead. CNOT onto |−⟩ multiplies |−⟩ by -1, so the control\'s |1⟩ side gets the minus sign. Kickback is how quantum algorithms read out a function into phase.',
    icon: Undo2,
  },
  {
    id: '023',
    title: "Deutsch's Algorithm",
    category: 'SCIENCE',
    description: 'One question, one run.',
    content:
      'Given a hidden one-bit function f, is it constant (f(0) = f(1)) or balanced? Classically you must evaluate f twice. Deutsch\'s algorithm puts the input in |+⟩ and the output in |−⟩, applies f once (as a controlled gate), and uses phase kickback and a final H: the first qubit ends in |0⟩ for constant and |1⟩ for balanced.',
    icon: GitBranch,
  },
  {
    id: '024',
    title: 'Grover Search',
    category: 'SCIENCE',
    description: 'Finding a needle with interference.',
    content:
      'Grover\'s algorithm finds a marked item among N in about √N steps. Start with every corner equal, flip the sign of the marked corner (the oracle), then reflect every arrow about the average (the diffusion step). Each round moves amplitude onto the marked corner. With four states, one round puts all of it there.',
    icon: Search,
  },
  {
    id: '004',
    title: 'Project Hypercube',
    category: 'LORE',
    description: 'CLASSIFIED: Origins of the simulation.',
    content:
      'Project Hypercube was initiated in 2042 following the Great Silicon Collapse. The goal: create a human-quantum interface capable of stabilizing high-coherence qubit arrays via direct neural link.',
    icon: Database,
    unlockedBy: 'q5',
  },
  {
    id: '005',
    title: 'Quantum Gates',
    category: 'MECHANIC',
    description: 'Manipulating qubit states.',
    content:
      'Gates like Hadamard (H), Pauli-X (Not), and CNOT are used to manipulate the amplitudes of qubits. Mastering these gates is essential for solving complex cryptographic puzzles.',
    icon: Cpu,
    unlockedBy: 'q1',
  },
];
