import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import type { GateId, VisualState } from '../../game/engine';
import { STAGE_HEIGHT, STAGE_WIDTH } from './stageSize';

/** Distance between the two node centres, in unscaled px. */
const TRACK = 300;
/** How far the ball must be dragged to switch nodes. */
const DRAG_THRESHOLD = 100;

interface StageProps {
  visual: 'bit' | 'qubit';
  state: VisualState;
  /** Which node is lit. */
  nodeBasis: 0 | 1;
  activeGate: GateId | null;
  isPreview: boolean;
  /** Sandbox mode: the ball can be dragged to change the initial state. */
  canDragBall: boolean;
  /** Current display scale, so pointer movement can be converted to stage px. */
  scale: number;
  onBallGrab: () => void;
  /** Called on release when the ball was dragged far enough toward the other node. */
  onBallSwitch: () => void;
}

const Stage = ({ visual, state, nodeBasis, activeGate, isPreview, canDragBall, scale, onBallGrab, onBallSwitch }: StageProps) => {
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef(0);
  const dragOffsetRef = useRef(0);

  useEffect(() => {
    if (!isDragging) return;
    // Keep the ball on the track between the two nodes.
    const min = state.basis >= 0.5 ? -TRACK : 0;
    const max = state.basis >= 0.5 ? 0 : TRACK;
    const onMove = (e: PointerEvent) => {
      const offset = Math.max(min, Math.min(max, (e.clientX - dragStartX.current) / scale));
      dragOffsetRef.current = offset;
      setDragOffset(offset);
    };
    const onUp = () => {
      if (Math.abs(dragOffsetRef.current) > DRAG_THRESHOLD) onBallSwitch();
      dragOffsetRef.current = 0;
      setDragOffset(0);
      setIsDragging(false);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [isDragging, state.basis, scale, onBallSwitch]);

  const handleBallPointerDown = (e: ReactPointerEvent) => {
    if (!canDragBall) return;
    e.preventDefault();
    onBallGrab();
    dragStartX.current = e.clientX;
    setIsDragging(true);
  };

  const showSwapArrows = !isPreview && (activeGate === 'X' || activeGate === 'Y');
  const showPhaseRing = !isPreview && (activeGate === 'Z' || activeGate === 'S');
  const willSwitch = Math.abs(dragOffset) > DRAG_THRESHOLD;

  return (
    <div className="relative" style={{ width: STAGE_WIDTH, height: STAGE_HEIGHT }}>
      {/* Track */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-16 border-t border-b border-white/10 flex items-center justify-center">
        <div className={`absolute inset-0 flex items-center justify-center gap-8 transition-opacity duration-300 ${showSwapArrows ? 'opacity-100' : 'opacity-0'}`}>
          <div className="flex text-quantum-cyan animate-pulse"><ArrowRight size={24} /><ArrowRight size={24} /><ArrowRight size={24} /></div>
          <div className="flex text-quantum-cyan animate-pulse"><ArrowLeft size={24} /><ArrowLeft size={24} /><ArrowLeft size={24} /></div>
        </div>
      </div>

      <Node basis={0} lit={nodeBasis === 0} />
      <Node basis={1} lit={nodeBasis === 1} showPhaseRing={showPhaseRing} fastRing={activeGate === 'Z'} />

      {/* Ball / arrow */}
      <div
        onPointerDown={handleBallPointerDown}
        aria-label={canDragBall ? 'Drag to change the initial state' : undefined}
        className={`absolute top-1/2 left-1/2 w-12 h-12 z-20 flex items-center justify-center touch-none ${
          canDragBall && !isPreview ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'pointer-events-none'
        }`}
        style={{ transform: `translate(calc(-50% + ${(state.basis - 0.5) * TRACK + dragOffset}px), -50%)` }}
      >
        {visual === 'qubit' ? (
          <div className="relative w-12 h-12 flex items-center justify-center">
            <div
              className="absolute bottom-1/2 left-1/2 h-[64px] w-[24px] origin-bottom will-change-transform"
              style={{ transform: `translateX(-50%) rotate(${state.phase * 90}deg)` }}
            >
              <svg viewBox="0 0 24 64" className="h-full w-full overflow-visible">
                <defs>
                  <linearGradient id="arrowGradient" x1="0" y1="1" x2="0" y2="0">
                    <stop offset="0%" stopColor="#2563eb" stopOpacity="0.7" />
                    <stop offset="60%" stopColor="#3b82f6" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#60a5fa" stopOpacity="1" />
                  </linearGradient>
                </defs>
                <path d="M 11.5 64 L 12.5 64 L 18 10 L 12 0 L 6 10 Z" fill="url(#arrowGradient)" />
              </svg>
            </div>
            {canDragBall && <div className={`absolute w-6 h-6 rounded-full border-2 ${willSwitch ? 'border-quantum-magenta' : 'border-white/40'}`} />}
          </div>
        ) : (
          <>
            <div className="absolute inset-0 bg-quantum-cyan blur-md opacity-60 animate-pulse-glow" />
            <div className={`relative w-full h-full rounded-full bg-white overflow-hidden ${willSwitch ? 'shadow-[0_0_25px_rgba(247,37,133,0.9)]' : 'shadow-[0_0_20px_rgba(76,201,240,0.8)]'}`}>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,_#ffffff_0%,_#4cc9f0_100%)]" />
            </div>
          </>
        )}
      </div>

      {isPreview && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-quantum-magenta/20 border border-quantum-magenta text-quantum-magenta px-4 py-1 rounded-full font-bold font-orbitron animate-pulse">
          TARGET PREVIEW
        </div>
      )}
    </div>
  );
};

const Node = ({ basis, lit, showPhaseRing = false, fastRing = false }: { basis: 0 | 1; lit: boolean; showPhaseRing?: boolean; fastRing?: boolean }) => {
  const offset = basis === 0 ? -TRACK / 2 : TRACK / 2;
  return (
    <>
      <div
        className="absolute top-1/2 left-1/2 w-32 h-32 flex items-center justify-center z-10"
        style={{ transform: `translate(calc(-50% + ${offset}px), -50%)` }}
      >
        <div className={`absolute inset-0 rounded-full border-2 transition-all duration-500 ${lit ? 'border-quantum-cyan bg-[#050510] shadow-[0_0_40px_rgba(76,201,240,0.4)]' : 'border-gray-800 bg-[#050510]/50'}`} />
        <div className={`absolute inset-[18.75px] rounded-full border transition-colors duration-500 ${lit ? 'border-quantum-cyan/50' : 'border-gray-800'}`} />

        {/* Phase-rotation effect for Z / S */}
        <div className={`absolute -inset-2 pointer-events-none transition-opacity duration-300 ${showPhaseRing ? 'opacity-100' : 'opacity-0'}`}>
          <div className={`w-full h-full text-quantum-magenta ${fastRing ? 'animate-[spin_3s_linear_infinite]' : 'animate-[spin_6s_linear_infinite]'}`}>
            <svg viewBox="0 0 100 100" className="w-full h-full fill-current">
              <path d="M 12 50 A 38 38 0 0 1 88 50" fill="none" stroke="currentColor" strokeWidth="3" className="opacity-60" />
              <path d="M 88 50 L 78 44 L 78 56 Z" transform="rotate(-15, 88, 50)" />
              <path d="M 88 50 A 38 38 0 0 1 12 50" fill="none" stroke="currentColor" strokeWidth="3" className="opacity-60" />
              <path d="M 12 50 L 22 56 L 22 44 Z" transform="rotate(-15, 12, 50)" />
            </svg>
          </div>
        </div>
      </div>
      <div className="absolute top-1/2 left-1/2 w-32 flex justify-center" style={{ transform: `translate(calc(-50% + ${offset}px), 80px)` }}>
        <div className={`px-4 py-1 rounded border-2 font-orbitron text-xl font-bold tracking-widest transition-all duration-500 ${lit ? 'bg-quantum-cyan/10 border-quantum-cyan text-quantum-cyan shadow-[0_0_15px_rgba(76,201,240,0.2)]' : 'bg-transparent border-transparent text-gray-700'}`}>
          |{basis}⟩
        </div>
      </div>
    </>
  );
};

export default Stage;
