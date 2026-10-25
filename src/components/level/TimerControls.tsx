import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { ChevronLeft, ChevronRight, Pause, Play, Repeat, RotateCcw } from 'lucide-react';
import type { LoopRange } from '../../game/tutorials';

const SPEEDS = [0.25, 0.5, 1, 2, 4];

const RADIUS = 60;
const CENTER = 80;
const STROKE = 6;

type Knob = 'START' | 'END' | 'CURRENT';

interface TimerControlsProps {
  time: number;
  duration: number;
  isPlaying: boolean;
  playbackSpeed: number;
  loop: LoopRange;
  onPlayToggle: () => void;
  onSeek: (t: number) => void;
  onStep: (delta: number) => void;
  onReset: () => void;
  onLoopToggle: () => void;
  onLoopChange: (start: number, end: number) => void;
  onSpeedChange: (speed: number) => void;
}

/** Snap loop bounds to whole time steps while keeping at least one step between them. */
function snapLoop(start: number, end: number, duration: number): [number, number] {
  const s = Math.max(0, Math.min(duration - 1, Math.round(start)));
  const e = Math.max(s + 1, Math.min(duration, Math.round(end)));
  return [s, e];
}

const TimerControls = ({
  time, duration, isPlaying, playbackSpeed, loop,
  onPlayToggle, onSeek, onStep, onReset, onLoopToggle, onLoopChange, onSpeedChange,
}: TimerControlsProps) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dragging, setDragging] = useState<Knob | null>(null);
  // While dragging, loop handles move freely; they snap on release.
  const [draftLoop, setDraftLoop] = useState<[number, number] | null>(null);
  const draftRef = useRef<[number, number] | null>(null);

  const loopStart = draftLoop?.[0] ?? loop.start;
  const loopEnd = draftLoop?.[1] ?? loop.end;

  useEffect(() => {
    if (!dragging) return;

    const timeFromPointer = (e: PointerEvent) => {
      const rect = svgRef.current!.getBoundingClientRect();
      const angle = Math.atan2(e.clientY - (rect.top + rect.height / 2), e.clientX - (rect.left + rect.width / 2));
      let degrees = angle * (180 / Math.PI) + 90;
      if (degrees < 0) degrees += 360;
      return Math.max(0, Math.min(duration - 0.01, (degrees / 360) * duration));
    };

    const onMove = (e: PointerEvent) => {
      const t = timeFromPointer(e);
      if (dragging === 'CURRENT') {
        onSeek(t);
        return;
      }
      const [s, en] = draftRef.current ?? [loop.start, loop.end];
      if (dragging === 'START' && t < en) draftRef.current = [t, en];
      if (dragging === 'END' && t > s) draftRef.current = [s, t];
      setDraftLoop(draftRef.current);
    };
    const onUp = () => {
      if (draftRef.current) onLoopChange(...snapLoop(draftRef.current[0], draftRef.current[1], duration));
      draftRef.current = null;
      setDraftLoop(null);
      setDragging(null);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [dragging, duration, loop.start, loop.end, onSeek, onLoopChange]);

  const startDrag = (knob: Knob) => (e: ReactPointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (knob === 'CURRENT') onSeek(time);
    setDragging(knob);
  };

  const pointAt = (t: number, r = RADIUS) => {
    const rad = ((t / duration) * 360 - 90) * (Math.PI / 180);
    return { x: CENTER + r * Math.cos(rad), y: CENTER + r * Math.sin(rad) };
  };

  const ballPos = pointAt(Math.min(time, duration));
  const startPos = pointAt(loopStart);
  const endPos = pointAt(loopEnd);
  const startLabelPos = pointAt(loopStart, RADIUS + 18);
  const endLabelPos = pointAt(loopEnd, RADIUS + 18);
  const loopIsFullRun = loopEnd - loopStart >= duration - 0.001;
  const speedIndex = SPEEDS.indexOf(playbackSpeed);

  return (
    <div className="relative bg-[#050510]/80 backdrop-blur-lg border border-white/10 rounded-full p-3 md:p-4 shadow-2xl">
      <div className="flex items-center gap-4 md:gap-8">
        <div className="flex flex-col gap-2">
          <button onClick={onReset} title="Reset to t=0" aria-label="Reset to t=0" className="p-3 hover:bg-white/10 rounded-full text-white transition-colors border border-white/5 bg-black/40">
            <RotateCcw size={20} />
          </button>
          <button
            onClick={onLoopToggle}
            title="Loop mode"
            aria-label="Loop mode"
            aria-pressed={loop.enabled}
            className={`p-3 rounded-full transition-colors border border-white/5 ${loop.enabled ? 'bg-quantum-magenta text-white' : 'bg-black/40 text-gray-500 hover:text-white'}`}
          >
            <Repeat size={20} />
          </button>
        </div>

        <div className="relative w-40 h-40 touch-none">
          <svg width="160" height="160" viewBox="0 0 160 160" ref={svgRef} className="overflow-visible">
            <circle cx={CENTER} cy={CENTER} r={RADIUS} fill="none" stroke="#1f2937" strokeWidth={STROKE} />

            {loop.enabled && (
              <>
                {loopIsFullRun ? (
                  <circle cx={CENTER} cy={CENTER} r={RADIUS} fill="none" stroke="#f0abfc" strokeWidth={STROKE} className="opacity-50" />
                ) : (
                  <path
                    d={`M ${startPos.x} ${startPos.y} A ${RADIUS} ${RADIUS} 0 ${loopEnd - loopStart > duration / 2 ? 1 : 0} 1 ${endPos.x} ${endPos.y}`}
                    fill="none"
                    stroke="#f0abfc"
                    strokeWidth={STROKE}
                    strokeLinecap="round"
                    className="opacity-50"
                  />
                )}
                <text x={startLabelPos.x} y={startLabelPos.y} fill="#22c55e" fontSize="18" fontWeight="bold" fontFamily="monospace" textAnchor="middle" dominantBaseline="middle" pointerEvents="none">{loopStart.toFixed(1)}</text>
                <text x={endLabelPos.x} y={endLabelPos.y} fill="#ef4444" fontSize="18" fontWeight="bold" fontFamily="monospace" textAnchor="middle" dominantBaseline="middle" pointerEvents="none">{loopEnd.toFixed(1)}</text>
              </>
            )}

            <g transform={`translate(${ballPos.x}, ${ballPos.y})`} onPointerDown={startDrag('CURRENT')} className="cursor-grab active:cursor-grabbing">
              <circle r={8} fill="#facc15" className={`drop-shadow-[0_0_8px_rgba(250,204,21,0.8)] ${!isPlaying ? 'hover:scale-110 transition-transform' : ''}`} />
            </g>

            {loop.enabled && (
              <>
                {/* End is drawn first so the start handle stays grabbable when they overlap at t=0 / t=end. */}
                <g transform={`translate(${endPos.x}, ${endPos.y})`} className="cursor-pointer" onPointerDown={startDrag('END')}>
                  <circle r={8} fill="#ef4444" stroke="white" strokeWidth={2} className="hover:scale-125 transition-transform" />
                </g>
                <g transform={`translate(${startPos.x}, ${startPos.y})`} className="cursor-pointer" onPointerDown={startDrag('START')}>
                  <circle r={8} fill="#22c55e" stroke="white" strokeWidth={2} className="hover:scale-125 transition-transform" />
                </g>
              </>
            )}
          </svg>

          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="flex items-center gap-1 pointer-events-auto">
              <button onClick={() => onStep(-0.1)} aria-label="Step back 0.1" className="p-1 hover:text-quantum-cyan transition-colors"><ChevronLeft size={16} /></button>
              <div className="font-orbitron text-2xl font-bold text-white w-16 text-center tabular-nums">{time.toFixed(1)}</div>
              <button onClick={() => onStep(0.1)} aria-label="Step forward 0.1" className="p-1 hover:text-quantum-cyan transition-colors"><ChevronRight size={16} /></button>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 items-center">
          <button
            onClick={onPlayToggle}
            aria-label={isPlaying ? 'Pause' : 'Play'}
            title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
            className={`p-4 rounded-full text-black transition-transform hover:scale-105 shadow-lg ${isPlaying ? 'bg-quantum-magenta' : 'bg-quantum-cyan'}`}
          >
            {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
          </button>

          <div className="flex items-center gap-1 bg-black/40 rounded-full border border-white/10 px-2 py-1">
            <button onClick={() => onSpeedChange(SPEEDS[speedIndex - 1])} disabled={speedIndex <= 0} aria-label="Slower" className="p-1 text-gray-400 hover:text-white disabled:opacity-30 disabled:hover:text-gray-400 transition-colors">
              <ChevronLeft size={12} />
            </button>
            <span className="font-mono text-[10px] text-quantum-cyan w-8 text-center">{playbackSpeed}x</span>
            <button onClick={() => onSpeedChange(SPEEDS[speedIndex + 1])} disabled={speedIndex >= SPEEDS.length - 1} aria-label="Faster" className="p-1 text-gray-400 hover:text-white disabled:opacity-30 disabled:hover:text-gray-400 transition-colors">
              <ChevronRight size={12} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimerControls;
