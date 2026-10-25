
import React, { useState } from 'react';
import { ArrowLeft, Lock, Play, CheckCircle, Cpu, Atom, Zap, LayoutGrid, Network } from 'lucide-react';

interface LevelSelectScreenProps {
  onReturn: () => void;
  onStartLevel: (levelId: string) => void;
  completedLevels: string[];
}

interface LevelNode {
  id: string;
  x: number; // Percentage 0-100
  y: number; // Percentage 0-100
  title: string;
  type: 'ROOT' | 'CLASSICAL' | 'QUANTUM';
  description: string;
  difficulty: number; // 1-5
}

// Defined the level tree structure (Status is now dynamic)
const LEVELS: LevelNode[] = [
  { 
    id: 'root', x: 50, y: 90, 
    title: 'System Boot', 
    type: 'ROOT', 
    description: 'Initialize the simulation environment and verify neural link stability.',
    difficulty: 1 
  },
  // Classical Branch (Left)
  { 
    id: 'c1', x: 35, y: 70, 
    title: 'Binary Basis', 
    type: 'CLASSICAL', 
    description: 'Learn the fundamentals of deterministic bits. 0 is 0. 1 is 1. There is no middle ground.',
    difficulty: 1 
  },
  { 
    id: 'c2', x: 25, y: 50, 
    title: 'Logic Gates', 
    type: 'CLASSICAL', 
    description: 'Combine bits using AND, OR, and NOT gates to create complex logic circuits.',
    difficulty: 2 
  },
  { 
    id: 'c3', x: 35, y: 30, 
    title: 'The Transistor', 
    type: 'CLASSICAL', 
    description: 'The hardware revolution. Manage signal flow and amplification.',
    difficulty: 3 
  },
  // Quantum Branch (Right)
  { 
    id: 'q1', x: 65, y: 70, 
    title: 'Quantum Gates', 
    type: 'QUANTUM', 
    description: 'Introduction to single-qubit gates. Manipulate probability amplitudes using the Pauli-X gate.',
    difficulty: 2 
  },
  { 
    id: 'q2', x: 75, y: 50, 
    title: 'Entanglement', 
    type: 'QUANTUM', 
    description: 'Link two particles across space. Observing one instantly defines the other.',
    difficulty: 3 
  },
  { 
    id: 'q3', x: 65, y: 30, 
    title: 'Interference', 
    type: 'QUANTUM', 
    description: 'Use wave interference to amplify correct answers and cancel out wrong ones.',
    difficulty: 4 
  },
];

// Connections between nodes [source, target]
const CONNECTIONS = [
  ['root', 'c1'],
  ['c1', 'c2'],
  ['c2', 'c3'],
  ['root', 'q1'],
  ['q1', 'q2'],
  ['q2', 'q3'],
];

const LevelSelectScreen: React.FC<LevelSelectScreenProps> = ({ onReturn, onStartLevel, completedLevels }) => {
  const [selectedLevelId, setSelectedLevelId] = useState<string | null>(null);

  // DEV MODE: Set to true to unlock all levels
  const DEVELOPER_MODE = true;

  // Helper to determine status dynamically
  const getLevelStatus = (id: string): 'LOCKED' | 'UNLOCKED' | 'COMPLETED' => {
    if (completedLevels.includes(id)) return 'COMPLETED';
    
    // Developer Override
    if (DEVELOPER_MODE) return 'UNLOCKED';

    // Find all parents
    const parents = CONNECTIONS.filter(([_, target]) => target === id).map(([source]) => source);
    
    // If no parents (Root), it's unlocked (or completed if checked above)
    if (parents.length === 0) return 'UNLOCKED';

    // Must complete ALL parents to unlock
    const allParentsCompleted = parents.every(parentId => completedLevels.includes(parentId));
    
    return allParentsCompleted ? 'UNLOCKED' : 'LOCKED';
  };

  const selectedLevel = selectedLevelId ? LEVELS.find(l => l.id === selectedLevelId) : null;
  const selectedLevelStatus = selectedLevelId ? getLevelStatus(selectedLevelId) : 'LOCKED';

  const getNode = (id: string) => LEVELS.find(l => l.id === id);

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-300">
      
      {/* Return Button */}
      <div className="absolute top-8 left-8 z-50">
        <button 
            onClick={onReturn}
            className="flex items-center gap-2 px-4 py-2 text-quantum-cyan hover:bg-quantum-cyan/10 rounded border border-transparent hover:border-quantum-cyan/30 transition-all"
        >
            <ArrowLeft size={20} />
            <span className="font-rajdhani font-bold uppercase tracking-wider">Abort Mission</span>
        </button>
      </div>

      {/* Main Map Container */}
      <div className="w-full h-full relative overflow-hidden flex">
        
        {/* Map Area */}
        <div className="flex-1 relative bg-[radial-gradient(circle_at_center,_#1a1a2e_0%,_#000000_100%)]">
          {/* Grid Background */}
          <div className="absolute inset-0 opacity-20 bg-[linear-gradient(to_right,#4cc9f010_1px,transparent_1px),linear-gradient(to_bottom,#4cc9f010_1px,transparent_1px)] bg-[size:4rem_4rem]" />

          {/* Top Fade - Unknown Vista */}
          <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-black via-[#050510] to-transparent z-20 pointer-events-none" />
          <div className="absolute top-8 left-0 right-0 text-center z-20 pointer-events-none opacity-30">
             <div className="font-orbitron tracking-[0.5em] text-sm text-gray-500">UNEXPLORED SECTORS</div>
          </div>

          {/* Branch Labels */}
          {/* Classical Logic Zone */}
          <div className="absolute top-[40%] left-[10%] md:left-[15%] w-64 -translate-y-1/2 pointer-events-none opacity-40 z-0 hidden md:block">
             <div className="absolute inset-0 bg-quantum-cyan/5 blur-3xl rounded-full" />
             <div className="relative border-l-4 border-quantum-cyan/30 pl-4 py-2">
                 <h2 className="text-4xl font-orbitron font-bold text-transparent bg-clip-text bg-gradient-to-b from-quantum-cyan to-transparent opacity-50">CLASSICAL</h2>
                 <h2 className="text-4xl font-orbitron font-bold text-quantum-cyan/20">LOGIC</h2>
                 <div className="mt-2 flex items-center gap-2 text-quantum-cyan/40 font-mono text-xs">
                    <LayoutGrid size={14} /> DETERMINISTIC
                 </div>
             </div>
          </div>

          {/* Quantum Logic Zone */}
          <div className="absolute top-[40%] right-[10%] md:right-[15%] w-64 -translate-y-1/2 pointer-events-none opacity-40 z-0 hidden md:block text-right">
             <div className="absolute inset-0 bg-quantum-magenta/5 blur-3xl rounded-full" />
             <div className="relative border-r-4 border-quantum-magenta/30 pr-4 py-2">
                 <h2 className="text-4xl font-orbitron font-bold text-transparent bg-clip-text bg-gradient-to-b from-quantum-magenta to-transparent opacity-50">QUANTUM</h2>
                 <h2 className="text-4xl font-orbitron font-bold text-quantum-magenta/20">LOGIC</h2>
                 <div className="mt-2 flex items-center justify-end gap-2 text-quantum-magenta/40 font-mono text-xs">
                    PROBABILISTIC <Network size={14} />
                 </div>
             </div>
          </div>

          {/* SVG Connections */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {CONNECTIONS.map(([startId, endId]) => {
              const start = getNode(startId);
              const end = getNode(endId);
              if (!start || !end) return null;

              const isClassical = end.type === 'CLASSICAL';
              // Path logic: Straight for Classical, Curved for Quantum
              const pathD = isClassical 
                ? `M ${start.x}% ${start.y}% L ${start.x}% ${(start.y + end.y)/2}% L ${end.x}% ${(start.y + end.y)/2}% L ${end.x}% ${end.y}%`
                : `M ${start.x}% ${start.y}% C ${start.x}% ${(start.y + end.y)/2}% ${end.x}% ${(start.y + end.y)/2}% ${end.x}% ${end.y}%`;

              // Line Color Logic
              // The line should be active if the START node is COMPLETED.
              const startStatus = getLevelStatus(startId);
              const isPathActive = startStatus === 'COMPLETED' || (startStatus === 'UNLOCKED' && DEVELOPER_MODE && startId === 'root'); 
              // Refined logic: If start is completed, path is lit. If Dev mode is on, all paths might be dimly lit? 
              // Let's stick to "If start is completed" OR "If dev mode, maybe show as active if start exists".
              // Actually, simply: if start is unlocked/completed in dev mode, show path?
              // Let's keep strict "completed" for full brightness, but maybe dim brightness for unlocked?
              // Existing logic used 'isPathActive' for stroke width and dash.
              
              // In dev mode, everything is unlocked. So if we want to visualize the path to an unlocked level, 
              // we can treat it as active if the start node is accessible.
              
              const isEffectiveActive = isPathActive || DEVELOPER_MODE;

              let strokeColor = '#333'; // Default inactive/locked
              if (isEffectiveActive) {
                 if (end.type === 'CLASSICAL') strokeColor = '#4cc9f0';
                 if (end.type === 'QUANTUM') strokeColor = '#d946ef'; 
                 // If root to unlocked node
                 if (start.type === 'ROOT') strokeColor = '#fff';
              }
              
              // Dim slightly if only active due to dev mode and not actually completed? 
              // For now, full brightness is fine for dev mode.

              return (
                <path 
                  key={`${startId}-${endId}`}
                  d={pathD}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth={isEffectiveActive ? "2" : "1"}
                  strokeDasharray={!isEffectiveActive ? "5,5" : "none"}
                  className="transition-all duration-1000"
                  opacity={isEffectiveActive ? 0.8 : 0.3}
                />
              );
            })}
          </svg>

          {/* Nodes */}
          {LEVELS.map((level) => {
            const status = getLevelStatus(level.id);
            return (
              <button
                key={level.id}
                onClick={() => setSelectedLevelId(level.id)}
                className={`absolute transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 flex items-center justify-center transition-all duration-300 group z-10
                  ${status === 'LOCKED' ? 'opacity-50 grayscale cursor-not-allowed' : 'cursor-pointer hover:scale-110'}
                `}
                style={{ left: `${level.x}%`, top: `${level.y}%` }}
              >
                {/* Node Shape: Square for Classical, Circle for Quantum/Root */}
                <div className={`absolute inset-0 ${level.type === 'CLASSICAL' ? 'rounded-md' : 'rounded-full'} border-2 bg-black/80 backdrop-blur-md
                  ${selectedLevelId === level.id ? 'border-white shadow-[0_0_20px_rgba(255,255,255,0.5)]' : ''}
                  ${level.type === 'CLASSICAL' ? 'border-quantum-cyan' : level.type === 'QUANTUM' ? 'border-quantum-magenta' : 'border-white'}
                `} />
                
                {/* Inner Icon */}
                <div className="relative z-10 text-white">
                  {status === 'LOCKED' ? (
                    <Lock size={20} />
                  ) : status === 'COMPLETED' ? (
                    <CheckCircle size={24} className="text-green-400" />
                  ) : (
                      <>
                          {level.type === 'CLASSICAL' && <Cpu size={24} className="text-quantum-cyan" />}
                          {level.type === 'QUANTUM' && <Atom size={24} className="text-quantum-magenta" />}
                          {level.type === 'ROOT' && <Zap size={24} className="text-yellow-400" />}
                      </>
                  )}
                </div>

                {/* Label Below */}
                <div className={`absolute top-full mt-2 whitespace-nowrap font-rajdhani font-bold text-sm tracking-wider px-2 py-1 bg-black/60 rounded border border-white/5
                  ${level.type === 'CLASSICAL' ? 'text-quantum-cyan' : level.type === 'QUANTUM' ? 'text-quantum-magenta' : 'text-white'}
                `}>
                  {level.title}
                </div>
              </button>
            );
          })}
        </div>

        {/* Mission Briefing Panel (Right Side) */}
        <div className={`w-96 bg-[#050510]/95 border-l border-white/10 p-8 flex flex-col transition-all duration-500 transform ${selectedLevel ? 'translate-x-0' : 'translate-x-full'} absolute right-0 top-0 bottom-0 z-30 shadow-2xl`}>
            {selectedLevel ? (
                <>
                    <div className="mb-8">
                        <div className="flex items-center gap-2 text-xs font-mono text-gray-500 mb-2">
                            <span>ID: {selectedLevel.id.toUpperCase()}</span>
                            <span>//</span>
                            <span>TYPE: {selectedLevel.type}</span>
                        </div>
                        <h2 className={`text-3xl font-orbitron font-bold mb-2 leading-none
                            ${selectedLevel.type === 'CLASSICAL' ? 'text-quantum-cyan' : selectedLevel.type === 'QUANTUM' ? 'text-quantum-magenta' : 'text-white'}
                        `}>
                            {selectedLevel.title}
                        </h2>
                        <div className="flex gap-1 mt-2">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className={`h-1.5 w-6 rounded-full ${i < selectedLevel.difficulty ? (selectedLevel.type === 'CLASSICAL' ? 'bg-quantum-cyan' : 'bg-quantum-magenta') : 'bg-gray-800'}`} />
                            ))}
                        </div>
                    </div>

                    <div className="flex-1">
                        <div className="bg-white/5 p-4 rounded border border-white/10 mb-6">
                            <h3 className="text-sm font-bold text-gray-300 mb-2 uppercase tracking-wider">Mission Briefing</h3>
                            <p className="text-gray-400 font-rajdhani leading-relaxed">
                                {selectedLevel.description}
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between text-sm text-gray-400 border-b border-white/5 pb-2">
                                <span>Rewards</span>
                                <span className="text-white font-mono">150 XP</span>
                            </div>
                            <div className="flex items-center justify-between text-sm text-gray-400 border-b border-white/5 pb-2">
                                <span>Est. Duration</span>
                                <span className="text-white font-mono">5-10 min</span>
                            </div>
                        </div>
                    </div>

                    <button 
                        disabled={selectedLevelStatus === 'LOCKED'}
                        onClick={() => onStartLevel(selectedLevel.id)}
                        className={`w-full py-4 mt-4 rounded font-orbitron font-bold text-lg tracking-widest transition-all flex items-center justify-center gap-3 group
                            ${selectedLevelStatus === 'LOCKED' 
                                ? 'bg-gray-800 text-gray-500 cursor-not-allowed' 
                                : selectedLevel.type === 'CLASSICAL'
                                    ? 'bg-quantum-cyan hover:bg-quantum-cyan/80 text-black'
                                    : 'bg-quantum-magenta hover:bg-quantum-magenta/80 text-white'
                            }
                        `}
                    >
                        {selectedLevelStatus === 'LOCKED' ? (
                            <>
                                <Lock size={20} /> LOCKED
                            </>
                        ) : selectedLevelStatus === 'COMPLETED' ? (
                            <>
                                <CheckCircle size={20} /> REPLAY MISSION
                            </>
                        ) : (
                            <>
                                <Play size={20} className="fill-current" /> INITIALIZE
                            </>
                        )}
                    </button>
                    
                    {DEVELOPER_MODE && (
                         <div className="mt-4 text-center text-[10px] text-gray-600 font-mono">
                             DEVELOPER OVERRIDE ACTIVE
                         </div>
                    )}
                </>
            ) : (
                <div className="h-full flex items-center justify-center text-gray-600 font-rajdhani text-lg animate-pulse">
                    Select a node to view details...
                </div>
            )}
        </div>

      </div>
    </div>
  );
};

export default LevelSelectScreen;
