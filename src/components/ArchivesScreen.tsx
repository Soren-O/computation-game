import { useState } from 'react';
import { ArrowLeft, Database, Lock } from 'lucide-react';
import { ARCHIVE_DATA } from '../game/archives';
import { getLevel } from '../game/levels';
import { useGame } from '../state/GameContext';

interface ArchivesScreenProps {
  onReturn: () => void;
  initialId?: string;
  backLabel?: string;
}

const ArchivesScreen = ({ onReturn, initialId, backLabel = 'Return to Menu' }: ArchivesScreenProps) => {
  const { completedLevels } = useGame();
  const [selectedId, setSelectedId] = useState<string | null>(initialId ?? null);

  const isLocked = (unlockedBy?: string) => !!unlockedBy && !completedLevels.includes(unlockedBy);
  const selectedEntry = ARCHIVE_DATA.find(e => e.id === selectedId) ?? ARCHIVE_DATA[0];
  const selectedLocked = isLocked(selectedEntry.unlockedBy);
  const unlockLevel = selectedEntry.unlockedBy ? getLevel(selectedEntry.unlockedBy) : undefined;

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in zoom-in-95 duration-300 p-4 md:p-8">
      <div className="w-full max-w-7xl h-full md:h-[85vh] flex flex-col gap-4">
        <div>
          <button
            onClick={onReturn}
            className="flex items-center gap-2 px-4 py-2 text-quantum-cyan hover:bg-quantum-cyan/10 rounded border border-transparent hover:border-quantum-cyan/30 transition-all"
          >
            <ArrowLeft size={20} />
            <span className="font-rajdhani font-bold uppercase tracking-wider">{backLabel}</span>
          </button>
        </div>

        <div className="flex-1 min-h-0 flex flex-col md:flex-row gap-6">
          {/* Entry list */}
          <div className="w-full md:w-1/3 flex flex-col gap-4 max-h-[40%] md:max-h-none">
            <div className="bg-[#050510] border border-quantum-cyan/20 p-4 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Database className="text-quantum-magenta" />
                <h2 className="font-orbitron text-xl text-white tracking-wider">DATA BANK</h2>
              </div>
              <span className="text-xs font-mono text-quantum-cyan/60">IDX: {ARCHIVE_DATA.length}</span>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-2">
              {ARCHIVE_DATA.map(entry => {
                const locked = isLocked(entry.unlockedBy);
                const selected = selectedEntry.id === entry.id;
                return (
                  <button
                    key={entry.id}
                    onClick={() => setSelectedId(entry.id)}
                    className={`w-full text-left p-4 rounded border transition-all duration-200 group relative overflow-hidden ${
                      selected ? 'bg-quantum-purple/20 border-quantum-purple' : 'bg-white/5 border-white/5 hover:border-quantum-cyan/50'
                    }`}
                  >
                    <div className="flex items-center gap-3 relative z-10">
                      {locked ? <Lock size={18} className="text-gray-500" /> : <entry.icon size={18} className={selected ? 'text-quantum-magenta' : 'text-quantum-cyan'} />}
                      <div>
                        <div className={`font-orbitron text-sm ${locked ? 'text-gray-500' : 'text-gray-200'}`}>{locked ? 'ENCRYPTED DATA' : entry.title}</div>
                        <div className="text-[10px] font-mono text-gray-500 mt-1">ID: {entry.id} // {entry.category}</div>
                      </div>
                    </div>

                    {!locked && (
                      <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-shimmer" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Detail view */}
          <div className="flex-1 min-h-0 bg-[#0a0a15] border border-quantum-cyan/30 rounded-xl relative overflow-hidden flex flex-col">
            <div className="absolute inset-0 opacity-20 bg-[linear-gradient(to_right,#4cc9f010_1px,transparent_1px),linear-gradient(to_bottom,#4cc9f010_1px,transparent_1px)] bg-[size:2rem_2rem]" />

            {selectedLocked ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-12 z-10">
                <div className="w-24 h-24 rounded-full border-2 border-red-500/30 flex items-center justify-center mb-6 animate-pulse">
                  <Lock size={48} className="text-red-500" />
                </div>
                <h2 className="text-3xl font-orbitron text-red-500 mb-2">ACCESS DENIED</h2>
                <p className="font-rajdhani text-gray-400 max-w-md">
                  This data shard is encrypted using a quantum-resistant algorithm.{' '}
                  {unlockLevel ? `Complete the "${unlockLevel.title}" module to acquire decryption keys.` : 'Decryption keys are not yet available.'}
                </p>
              </div>
            ) : (
              <div className="flex-1 flex flex-col p-6 md:p-12 z-10 overflow-y-auto">
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

                <div className="bg-white/5 p-6 rounded border-l-2 border-quantum-magenta mb-6">
                  <p className="font-rajdhani text-lg leading-relaxed text-gray-200 select-text">{selectedEntry.content}</p>
                </div>

                {/* Decorative raw data */}
                <div className="font-mono text-xs text-quantum-cyan/40 mt-8 p-4 border border-white/5 rounded bg-black/40 break-all">
                  01001000 01100101 01101100 01101100 01101111 00100000 01010111 01101111 01110010 01101100 01100100...
                </div>
              </div>
            )}

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
    </div>
  );
};

export default ArchivesScreen;
