import { useState, FC } from 'react';
import { ArrowLeft, Database, Lock, Binary, Cpu, Atom, Network, BoxSelect, Activity, Zap, MoveUpRight } from 'lucide-react';

interface ArchivesScreenProps {
  onReturn: () => void;
  initialId?: string;
  backLabel?: string;
}

export interface ArchiveEntry {
  id: string;
  title: string;
  category: 'LORE' | 'SCIENCE' | 'MECHANIC';
  description: string;
  content: string;
  locked: boolean;
  icon: any;
}

export const ARCHIVE_DATA: ArchiveEntry[] = [
  {
    id: '000',
    title: 'Classical Logic',
    category: 'SCIENCE',
    description: 'The deterministic foundation.',
    content: 'Classical computers rely on bits that must be either 0 OR 1. Classical algorithms manipulate these definite states using gates like AND, OR, and NOT. Unlike quantum algorithms, they cannot process multiple possibilities simultaneously via superposition.',
    locked: false,
    icon: BoxSelect
  },
  {
    id: '006',
    title: 'The Bit',
    category: 'SCIENCE',
    description: 'The atom of classical information.',
    content: 'The bit (binary digit) is the most basic unit of information in computing. It represents a logical state with one of two possible values: 0 or 1. Physically, this corresponds to a transistor being off or on, a capacitor being discharged or charged, or a switch being open or closed. In this simulation, the blue ball represents the physical state of a bit.',
    locked: false,
    icon: Binary
  },
  {
    id: '001',
    title: 'The Qubit',
    category: 'SCIENCE',
    description: 'Fundamental unit of quantum information.',
    content: 'Unlike a classical bit which can be 0 or 1, a Qubit exists in a superposition of both states simultaneously until measured. This allows for exponentially greater computational power in specific problem spaces.',
    locked: false,
    icon: Atom
  },
  {
    id: '010',
    title: 'State Vector',
    category: 'SCIENCE',
    description: 'Mathematical description of a quantum state.',
    content: 'A state vector is a mathematical object (specifically a vector in a complex Hilbert space) that completely describes the state of a quantum system. In our visualization, this is represented by the Arrow. The direction and length of the arrow correspond to the properties of the state vector (Phase and Amplitude).',
    locked: false,
    icon: MoveUpRight
  },
  {
    id: '008',
    title: 'Phase',
    category: 'SCIENCE',
    description: 'Direction in the complex plane.',
    content: 'In quantum mechanics, the state of a qubit is described by a vector. The Phase corresponds to the angle of this vector. In our visualization, the direction the arrow points represents the phase. An arrow pointing UP represents a phase of 0. An arrow pointing DOWN represents a phase of 180 degrees (or π), often mathematically denoted as a negative amplitude (-|0⟩).',
    locked: false,
    icon: Activity
  },
  {
    id: '009',
    title: 'Amplitude',
    category: 'SCIENCE',
    description: 'Magnitude of probability.',
    content: 'The Amplitude is related to the probability of finding the qubit in a specific state upon measurement. In the visualization, the length of the arrow represents the amplitude. For a pure qubit state, the total probability must always equal 1 (Unitary).',
    locked: false,
    icon: Zap
  },
  {
    id: '002',
    title: 'Superposition',
    category: 'MECHANIC',
    description: 'Game Mechanic: State duality.',
    content: 'In Quantum Odyssey, Superposition allows a puzzle element to activate multiple pathways at once. However, observing the path collapses the waveform into a single outcome.',
    locked: false,
    icon: Binary
  },
  {
    id: '003',
    title: 'Entanglement',
    category: 'SCIENCE',
    description: 'Spooky action at a distance.',
    content: 'When two particles become entangled, the state of one instantly influences the state of the other, regardless of the distance separating them. Einstein famously referred to this as "spooky action at a distance".',
    locked: false,
    icon: Network
  },
  {
    id: '007',
    title: 'Pauli-X Gate',
    category: 'SCIENCE',
    description: 'The Quantum NOT Gate.',
    content: 'The Pauli-X gate (P-X) acts on a single qubit. It is the quantum equivalent of the classical NOT gate. It swaps the amplitudes of the |0⟩ and |1⟩ states. Visually, this moves the arrow from the |0⟩ node to the |1⟩ node.',
    locked: false,
    icon: Cpu
  },
  {
    id: '004',
    title: 'Project Odyssey',
    category: 'LORE',
    description: 'CLASSIFIED: Origins of the simulation.',
    content: 'Project Odyssey was initiated in 2042 following the Great Silicon Collapse. The goal: create a human-quantum interface capable of stabilizing high-coherence qubit arrays via direct neural link.',
    locked: true,
    icon: Database
  },
  {
    id: '005',
    title: 'Quantum Gates',
    category: 'MECHANIC',
    description: 'Manipulating qubit states.',
    content: 'Gates like Hadamard (H), Pauli-X (Not), and CNOT are used to manipulate the probabilities of qubits. Mastering these gates is essential for solving complex cryptographic puzzles.',
    locked: true,
    icon: Cpu
  }
];

const ArchivesScreen: FC<ArchivesScreenProps> = ({ onReturn, initialId, backLabel = "Return to Menu" }) => {
  const [selectedId, setSelectedId] = useState<string | null>(initialId || null);
  
  const selectedEntry = ARCHIVE_DATA.find(e => e.id === selectedId) || ARCHIVE_DATA[0];

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in zoom-in-95 duration-300 p-4 md:p-8">
      <div className="w-full max-w-7xl h-[85vh] flex flex-col md:flex-row gap-6 relative">
        
        {/* Header / Return */}
        <div className="absolute -top-16 left-0 flex items-center gap-4">
            <button 
                onClick={onReturn}
                className="flex items-center gap-2 px-4 py-2 text-quantum-cyan hover:bg-quantum-cyan/10 rounded border border-transparent hover:border-quantum-cyan/30 transition-all"
            >
                <ArrowLeft size={20} />
                <span className="font-rajdhani font-bold uppercase tracking-wider">{backLabel}</span>
            </button>
        </div>

        {/* Left Column: Data Grid */}
        <div className="w-full md:w-1/3 flex flex-col gap-4">
            <div className="bg-[#050510] border border-quantum-cyan/20 p-4 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Database className="text-quantum-magenta" />
                    <h2 className="font-orbitron text-xl text-white tracking-wider">DATA BANK</h2>
                </div>
                <span className="text-xs font-mono text-quantum-cyan/60">IDX: {ARCHIVE_DATA.length}</span>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                {ARCHIVE_DATA.map((entry) => (
                    <button
                        key={entry.id}
                        onClick={() => setSelectedId(entry.id)}
                        className={`w-full text-left p-4 rounded border transition-all duration-200 group relative overflow-hidden ${
                            selectedEntry.id === entry.id 
                            ? 'bg-quantum-purple/20 border-quantum-purple' 
                            : 'bg-white/5 border-white/5 hover:border-quantum-cyan/50'
                        }`}
                    >
                        <div className="flex items-start justify-between relative z-10">
                            <div className="flex items-center gap-3">
                                {entry.locked ? <Lock size={18} className="text-gray-500" /> : <entry.icon size={18} className={selectedEntry.id === entry.id ? "text-quantum-magenta" : "text-quantum-cyan"} />}
                                <div>
                                    <div className={`font-orbitron text-sm ${entry.locked ? "text-gray-500" : "text-gray-200"}`}>
                                        {entry.locked ? "ENCRYPTED DATA" : entry.title}
                                    </div>
                                    <div className="text-[10px] font-mono text-gray-500 mt-1">ID: {entry.id} // {entry.category}</div>
                                </div>
                            </div>
                        </div>
                        
                        {/* Scanning bar effect on hover */}
                        {!entry.locked && (
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-[shimmer_1s_infinite]" />
                        )}
                    </button>
                ))}
            </div>
        </div>

        {/* Right Column: Detail View */}
        <div className="flex-1 bg-[#0a0a15] border border-quantum-cyan/30 rounded-xl relative overflow-hidden flex flex-col">
            {/* Background Grid */}
            <div className="absolute inset-0 opacity-20 bg-[linear-gradient(to_right,#4cc9f010_1px,transparent_1px),linear-gradient(to_bottom,#4cc9f010_1px,transparent_1px)] bg-[size:2rem_2rem]" />
            
            {selectedEntry.locked ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-12 z-10">
                    <div className="w-24 h-24 rounded-full border-2 border-red-500/30 flex items-center justify-center mb-6 animate-pulse">
                        <Lock size={48} className="text-red-500" />
                    </div>
                    <h2 className="text-3xl font-orbitron text-red-500 mb-2">ACCESS DENIED</h2>
                    <p className="font-rajdhani text-gray-400 max-w-md">
                        This data shard is encrypted using a SHA-256 quantum resistant algorithm. Complete Campaign Sector 3 to acquire decryption keys.
                    </p>
                </div>
            ) : (
                <div className="flex-1 flex flex-col p-8 md:p-12 z-10 overflow-y-auto">
                    <div className="flex items-start justify-between mb-8 border-b border-white/10 pb-6">
                        <div>
                            <div className="flex items-center gap-2 text-quantum-cyan mb-2">
                                <selectedEntry.icon size={20} />
                                <span className="font-mono text-xs uppercase tracking-widest">{selectedEntry.category} // DECLASSIFIED</span>
                            </div>
                            <h1 className="text-4xl md:text-5xl font-orbitron font-bold text-white mb-4">{selectedEntry.title}</h1>
                            <p className="text-xl text-gray-400 font-rajdhani">{selectedEntry.description}</p>
                        </div>
                        <div className="hidden md:block text-right font-mono text-xs text-gray-600">
                            <div className="mb-1">SIZE: 245 KB</div>
                            <div>ENC: NONE</div>
                        </div>
                    </div>

                    <div className="prose prose-invert max-w-none">
                        <div className="bg-white/5 p-6 rounded border-l-2 border-quantum-magenta mb-6">
                            <p className="font-rajdhani text-lg leading-relaxed text-gray-200">
                                {selectedEntry.content}
                            </p>
                        </div>
                        
                        {/* Simulated raw data visualization */}
                        <div className="font-mono text-xs text-quantum-cyan/40 mt-8 p-4 border border-white/5 rounded bg-black/40 break-all">
                            01001000 01100101 01101100 01101100 01101111 00100000 01010111 01101111 01110010 01101100 01100100...
                        </div>
                    </div>
                </div>
            )}

            {/* Decorative UI Elements */}
            <div className="absolute bottom-0 right-0 p-4 z-20">
                <div className="flex gap-1">
                    <div className="w-2 h-2 bg-quantum-cyan animate-pulse" />
                    <div className="w-2 h-2 bg-quantum-cyan/50" />
                    <div className="w-2 h-2 bg-quantum-cyan/20" />
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};

export default ArchivesScreen;