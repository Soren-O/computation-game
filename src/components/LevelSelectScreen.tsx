import { useState } from 'react';
import { ArrowLeft, CircleCheck, Construction, LayoutGrid, Lock, Network, Play, X } from 'lucide-react';
import { CONNECTIONS, LEVELS, isLevelBuilt, levelQubits, prerequisitesOf, type LevelDef } from '../game/levels';
import { ALL_CELLS } from '../game/quantum';
import { cellLabel } from './level/cells';
import HypercubeGlyph from './HypercubeGlyph';
import { useGame } from '../state/GameContext';

interface LevelSelectScreenProps {
  onReturn: () => void;
  onStartLevel: (levelId: string) => void;
}

type LevelStatus = 'LOCKED' | 'UNLOCKED' | 'COMPLETED' | 'IN_DEVELOPMENT';

const typeText = (level: LevelDef) =>
  level.type === 'CLASSICAL' ? 'text-quantum-cyan' : level.type === 'QUANTUM' ? 'text-quantum-magenta' : 'text-white';

const LevelSelectScreen = ({ onReturn, onStartLevel }: LevelSelectScreenProps) => {
  const { completedLevels, settings } = useGame();
  const [selectedLevelId, setSelectedLevelId] = useState<string | null>(null);

  const getLevelStatus = (level: LevelDef): LevelStatus => {
    if (!isLevelBuilt(level)) return 'IN_DEVELOPMENT';
    if (completedLevels.includes(level.id)) return 'COMPLETED';
    if (settings.developerMode) return 'UNLOCKED';
    return prerequisitesOf(level.id).every(id => completedLevels.includes(id)) ? 'UNLOCKED' : 'LOCKED';
  };

  const getNode = (id: string) => LEVELS.find(l => l.id === id);
  const selectedLevel = selectedLevelId ? getNode(selectedLevelId) ?? null : null;
  const selectedStatus = selectedLevel ? getLevelStatus(selectedLevel) : 'LOCKED';
  const canStart = selectedStatus === 'UNLOCKED' || selectedStatus === 'COMPLETED';
  const selectedGates = selectedLevel
    ? ALL_CELLS.filter(g => selectedLevel.puzzles.some(p => p.gates.includes(g)))
    : [];

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-300">
      <div className="absolute top-4 left-4 md:top-8 md:left-8 z-50">
        <button
          onClick={onReturn}
          className="flex items-center gap-2 px-4 py-2 text-quantum-cyan hover:bg-quantum-cyan/10 rounded border border-transparent hover:border-quantum-cyan/30 transition-all"
        >
          <ArrowLeft size={20} />
          <span className="font-bold uppercase tracking-wider">Abort Mission</span>
        </button>
      </div>

      <div className="w-full h-full relative overflow-hidden flex">
        {/* Map */}
        <div
          className="flex-1 relative bg-[radial-gradient(circle_at_center,_#1a1a2e_0%,_#000000_100%)]"
          onClick={e => e.target === e.currentTarget && setSelectedLevelId(null)}
        >
          <div className="absolute inset-0 opacity-20 bg-[linear-gradient(to_right,#4cc9f010_1px,transparent_1px),linear-gradient(to_bottom,#4cc9f010_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />

          {/* Top fade: unexplored sectors */}
          <div className="absolute top-0 left-0 right-0 h-24 bg-linear-to-b from-black to-transparent z-0 pointer-events-none" />

          {/* Branch labels */}
          <div className="absolute bottom-6 left-6 w-64 pointer-events-none opacity-40 z-0 hidden md:block">
            <div className="absolute inset-0 bg-quantum-cyan/5 blur-3xl rounded-full" />
            <div className="relative border-l-4 border-quantum-cyan/30 pl-4 py-2">
              <h2 className="text-4xl font-orbitron font-bold text-transparent bg-clip-text bg-linear-to-b from-quantum-cyan to-transparent opacity-50">CLASSICAL</h2>
              <h2 className="text-4xl font-orbitron font-bold text-quantum-cyan/20">LOGIC</h2>
              <div className="mt-2 flex items-center gap-2 text-quantum-cyan/40 font-mono text-xs">
                <LayoutGrid size={14} /> DETERMINISTIC
              </div>
            </div>
          </div>
          <div className="absolute bottom-6 right-6 w-64 pointer-events-none opacity-40 z-0 hidden md:block text-right">
            <div className="absolute inset-0 bg-quantum-magenta/5 blur-3xl rounded-full" />
            <div className="relative border-r-4 border-quantum-magenta/30 pr-4 py-2">
              <h2 className="text-4xl font-orbitron font-bold text-transparent bg-clip-text bg-linear-to-b from-quantum-magenta to-transparent opacity-50">QUANTUM</h2>
              <h2 className="text-4xl font-orbitron font-bold text-quantum-magenta/20">LOGIC</h2>
              <div className="mt-2 flex items-center justify-end gap-2 text-quantum-magenta/40 font-mono text-xs">
                PROBABILISTIC <Network size={14} />
              </div>
            </div>
          </div>

          {/* Connections. Percent units only work inside SVG shapes that accept lengths, so draw in a 100x100 viewBox. */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
            {CONNECTIONS.map(([startId, endId]) => {
              const start = getNode(startId);
              const end = getNode(endId);
              if (!start || !end) return null;

              const midY = (start.y + end.y) / 2;
              const pathD =
                end.type === 'CLASSICAL'
                  ? `M ${start.x} ${start.y} L ${start.x} ${midY} L ${end.x} ${midY} L ${end.x} ${end.y}`
                  : `M ${start.x} ${start.y} C ${start.x} ${midY} ${end.x} ${midY} ${end.x} ${end.y}`;

              const startStatus = getLevelStatus(start);
              const isActive = startStatus === 'COMPLETED' || (settings.developerMode && startStatus !== 'IN_DEVELOPMENT');

              let stroke = '#333';
              if (isActive) stroke = start.type === 'ROOT' ? '#fff' : end.type === 'CLASSICAL' ? '#4cc9f0' : '#d946ef';

              return (
                <path
                  key={`${startId}-${endId}`}
                  d={pathD}
                  fill="none"
                  stroke={stroke}
                  strokeWidth={isActive ? 2 : 1}
                  strokeDasharray={isActive ? undefined : '5,5'}
                  vectorEffect="non-scaling-stroke"
                  opacity={isActive ? 0.8 : 0.3}
                  className="transition-all duration-1000"
                />
              );
            })}
          </svg>

          {/* Nodes */}
          {LEVELS.map(level => {
            const status = getLevelStatus(level);
            const dimmed = status === 'LOCKED' || status === 'IN_DEVELOPMENT';
            return (
              <button
                key={level.id}
                onClick={() => setSelectedLevelId(level.id)}
                className={`absolute -translate-x-1/2 -translate-y-1/2 w-16 h-16 flex items-center justify-center transition-all duration-300 group z-10 ${
                  dimmed ? 'opacity-50 grayscale' : 'hover:scale-110'
                }`}
                style={{ left: `${level.x}%`, top: `${level.y}%` }}
              >
                <div
                  className={`absolute inset-0 ${level.type === 'CLASSICAL' ? 'rounded-md' : 'rounded-full'} border-2 bg-black/80 backdrop-blur-md
                    ${selectedLevelId === level.id ? 'border-white shadow-[0_0_20px_rgba(255,255,255,0.5)]' : level.type === 'CLASSICAL' ? 'border-quantum-cyan' : level.type === 'QUANTUM' ? 'border-quantum-magenta' : 'border-white'}`}
                />
                <div className="relative z-10 text-white">
                  {status === 'IN_DEVELOPMENT' ? (
                    <Construction size={20} />
                  ) : status === 'LOCKED' ? (
                    <Lock size={20} />
                  ) : (
                    <HypercubeGlyph qubits={levelQubits(level)} size={36} color={level.type === 'CLASSICAL' ? '#4cc9f0' : level.type === 'QUANTUM' ? '#f72585' : '#facc15'} />
                  )}
                </div>
                {status === 'COMPLETED' && (
                  <CircleCheck size={18} className="absolute -right-1 -top-1 z-20 rounded-full bg-black text-green-400" />
                )}
                <div className={`absolute top-full mt-2 whitespace-nowrap font-semibold text-xs tracking-wider px-2 py-0.5 bg-black/60 rounded border border-white/5 ${typeText(level)}`}>
                  {level.title}
                </div>
              </button>
            );
          })}
        </div>

        {/* Mission briefing */}
        <div
          className={`w-96 max-w-full bg-[#050510]/95 border-l border-white/10 p-8 flex flex-col transition-all duration-500 ${
            selectedLevel ? 'translate-x-0' : 'translate-x-full'
          } absolute right-0 top-0 bottom-0 z-30 shadow-2xl`}
          inert={!selectedLevel}
        >
          {selectedLevel && (
            <>
              <button onClick={() => setSelectedLevelId(null)} aria-label="Close briefing" className="absolute top-4 right-4 p-2 text-gray-500 hover:text-white">
                <X size={20} />
              </button>

              <div className="mb-8">
                <div className="flex items-center gap-2 text-xs font-mono text-gray-500 mb-2">
                  <span>ID: {selectedLevel.id.toUpperCase()}</span>
                  <span>//</span>
                  <span>TYPE: {selectedLevel.type}</span>
                </div>
                <h2 className={`text-3xl font-orbitron font-bold mb-2 leading-none ${typeText(selectedLevel)}`}>{selectedLevel.title}</h2>
                <div className="flex gap-1 mt-2">
                  {Array.from({ length: 5 }, (_, i) => (
                    <div
                      key={i}
                      className={`h-1.5 w-6 rounded-full ${i < selectedLevel.difficulty ? (selectedLevel.type === 'CLASSICAL' ? 'bg-quantum-cyan' : 'bg-quantum-magenta') : 'bg-gray-800'}`}
                    />
                  ))}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                <div className="bg-white/5 p-4 rounded border border-white/10 mb-6">
                  <h3 className="text-sm font-bold text-gray-300 mb-2 uppercase tracking-wider">Mission Briefing</h3>
                  <p className="text-gray-400 leading-relaxed">{selectedLevel.description}</p>
                </div>

                {selectedStatus === 'IN_DEVELOPMENT' ? (
                  <p className="text-sm text-quantum-magenta/80">This module hasn't been built yet. Check back in a future update.</p>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm text-gray-400 border-b border-white/5 pb-2">
                      <span>{selectedLevel.visual === 'bit' ? 'Bits' : 'Qubits'}</span>
                      <span className="flex items-center gap-2 text-white font-mono">
                        <HypercubeGlyph qubits={levelQubits(selectedLevel)} size={22} />
                        {levelQubits(selectedLevel)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-400 border-b border-white/5 pb-2">
                      <span>Puzzles</span>
                      <span className="text-white font-mono">{selectedLevel.freePlay ? 'Free play' : selectedLevel.puzzles.length}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4 text-sm text-gray-400 border-b border-white/5 pb-2">
                      <span>Gates</span>
                      <span className="text-right text-white font-mono">
                        {selectedGates.map(g => cellLabel(g, selectedLevel.visual === 'bit')).join('  ')}
                      </span>
                    </div>
                    {selectedStatus === 'LOCKED' && (
                      <p className="text-sm text-gray-500">
                        Complete {prerequisitesOf(selectedLevel.id).map(id => getNode(id)?.title).join(' and ')} to unlock.
                      </p>
                    )}
                  </div>
                )}
              </div>

              <button
                disabled={!canStart}
                onClick={() => onStartLevel(selectedLevel.id)}
                className={`w-full py-4 mt-4 rounded font-orbitron font-bold text-lg tracking-widest transition-all flex items-center justify-center gap-3
                  ${!canStart
                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                    : selectedLevel.type === 'CLASSICAL'
                      ? 'bg-quantum-cyan hover:bg-quantum-cyan/80 text-black'
                      : selectedLevel.type === 'QUANTUM'
                        ? 'bg-quantum-magenta hover:bg-quantum-magenta/80 text-white'
                        : 'bg-white hover:bg-white/80 text-black'}`}
              >
                {selectedStatus === 'IN_DEVELOPMENT' ? (
                  <><Construction size={20} /> IN DEVELOPMENT</>
                ) : selectedStatus === 'LOCKED' ? (
                  <><Lock size={20} /> LOCKED</>
                ) : selectedStatus === 'COMPLETED' ? (
                  <><CircleCheck size={20} /> REPLAY MISSION</>
                ) : (
                  <><Play size={20} className="fill-current" /> INITIALIZE</>
                )}
              </button>

              {settings.developerMode && <div className="mt-4 text-center text-[10px] text-gray-600 font-mono">DEVELOPER OVERRIDE ACTIVE</div>}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LevelSelectScreen;
