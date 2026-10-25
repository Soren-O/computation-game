import { ChevronLeft, ChevronRight, Eye, EyeOff, Lock, LockOpen, Pause, Play, Repeat, RotateCcw, SkipBack, SkipForward } from 'lucide-react';
import type { SystemMode } from '../../game/tutorials';

export const SPEEDS = [0.25, 0.5, 1, 2, 4];

interface TransportControlsProps {
  isPlaying: boolean;
  time: number;
  duration: number;
  speed: number;
  loopEnabled: boolean;
  onPlayToggle: () => void;
  onReset: () => void;
  onStep: (direction: -1 | 1) => void;
  onLoopToggle: () => void;
  onSpeedChange: (speed: number) => void;
}

const iconButton = 'flex h-8 w-8 items-center justify-center rounded-lg text-gray-300 transition-colors hover:bg-white/10 hover:text-white';

/** Play / step / loop / speed, plus the clock. */
export const TransportControls = ({
  isPlaying, time, duration, speed, loopEnabled, onPlayToggle, onReset, onStep, onLoopToggle, onSpeedChange,
}: TransportControlsProps) => {
  const speedIndex = SPEEDS.indexOf(speed);
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-0.5 rounded-xl border border-white/10 bg-black/30 p-0.5">
        <button onClick={onReset} className={iconButton} title="Reset to t = 0" aria-label="Reset to t=0"><RotateCcw size={16} /></button>
        <button onClick={() => onStep(-1)} className={iconButton} title="Previous step" aria-label="Previous step"><SkipBack size={16} /></button>
        <button
          onClick={onPlayToggle}
          aria-label={isPlaying ? 'Pause' : 'Play'}
          title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
          className={`flex h-9 w-9 items-center justify-center rounded-full text-black shadow-lg transition-transform hover:scale-105 ${isPlaying ? 'bg-quantum-magenta' : 'bg-quantum-cyan'}`}
        >
          {isPlaying ? <Pause size={17} fill="currentColor" /> : <Play size={17} fill="currentColor" className="translate-x-px" />}
        </button>
        <button onClick={() => onStep(1)} className={iconButton} title="Next step" aria-label="Next step"><SkipForward size={16} /></button>
        <button
          onClick={onLoopToggle}
          aria-label="Loop mode"
          aria-pressed={loopEnabled}
          title="Loop part of the timeline"
          className={`${iconButton} ${loopEnabled ? '!bg-quantum-magenta/80 !text-white' : ''}`}
        >
          <Repeat size={16} />
        </button>
      </div>

      <div className="font-mono text-sm tabular-nums text-gray-400">
        t = <span className="text-white" data-testid="time">{Math.min(time, duration).toFixed(1)}</span>
      </div>

      <div className="flex items-center rounded-lg border border-white/10 bg-black/30 px-0.5">
        <button onClick={() => onSpeedChange(SPEEDS[speedIndex - 1])} disabled={speedIndex <= 0} aria-label="Slower" className="rounded p-1 text-gray-400 hover:text-white disabled:opacity-30"><ChevronLeft size={14} /></button>
        <span className="w-9 text-center font-mono text-xs text-quantum-cyan">{speed}x</span>
        <button onClick={() => onSpeedChange(SPEEDS[speedIndex + 1])} disabled={speedIndex >= SPEEDS.length - 1} aria-label="Faster" className="rounded p-1 text-gray-400 hover:text-white disabled:opacity-30"><ChevronRight size={14} /></button>
      </div>
    </div>
  );
};

interface StageTogglesProps {
  mode: SystemMode;
  showModeToggle: boolean;
  /** null hides the goal toggle (nothing to show). */
  showTarget: boolean | null;
  onModeToggle: () => void;
  onTargetToggle: () => void;
}

/** Goal ghost on/off and the PUZZLE / SANDBOX switch. */
export const StageToggles = ({ mode, showModeToggle, showTarget, onModeToggle, onTargetToggle }: StageTogglesProps) => (
  <div className="flex items-center gap-2">
    {showTarget !== null && (
      <button
        onClick={onTargetToggle}
        aria-pressed={showTarget}
        title="Show the goal as dashed ghost arrows"
        className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 font-orbitron text-[10px] tracking-wider transition-colors ${
          showTarget ? 'border-quantum-magenta/60 bg-quantum-magenta/10 text-quantum-magenta' : 'border-white/10 text-gray-400 hover:text-white'
        }`}
      >
        {showTarget ? <Eye size={13} /> : <EyeOff size={13} />} GOAL
      </button>
    )}
    {showModeToggle && (
      <button
        onClick={onModeToggle}
        title="PUZZLE locks the starting state; SANDBOX lets you pick it and use every gate"
        className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 font-orbitron text-[10px] tracking-wider transition-all ${
          mode === 'SANDBOX' ? 'border-quantum-purple bg-quantum-purple/25 text-white shadow-[0_0_14px_rgba(123,44,191,0.35)]' : 'border-white/10 text-gray-400 hover:text-white'
        }`}
      >
        {mode === 'SANDBOX' ? <LockOpen size={12} /> : <Lock size={12} />}
        {mode}
      </button>
    )}
  </div>
);
