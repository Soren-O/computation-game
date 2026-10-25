import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, CircleCheck, ChevronDown, ChevronUp, Construction, Eye, Lock, LockOpen, MessageSquare, PanelLeft, RotateCcw } from 'lucide-react';
import ArchivesScreen from './ArchivesScreen';
import Stage from './level/Stage';
import { STAGE_HEIGHT, STAGE_WIDTH } from './level/stageSize';
import TimerControls from './level/TimerControls';
import OperatorSidebar from './level/OperatorSidebar';
import {
  ALL_GATES,
  activeSlotAt,
  finalState,
  formatState,
  stateAt,
  statesEqual,
  visualStateAt,
  type Circuit,
  type GateId,
  type QubitState,
} from '../game/engine';
import { SANDBOX_LEVEL_ID, SANDBOX_MAX_SLOTS, getLevel, isLevelBuilt, type LevelDef } from '../game/levels';
import { ArchiveLinkContext, TUTORIALS, firstStepOfPuzzle, type LoopRange, type SystemMode, type TutorialContext } from '../game/tutorials';
import { useGame } from '../state/GameContext';

/** Matches the original pacing of 0.01 time units per frame at 60 fps. */
const TIME_UNITS_PER_SECOND = 0.6;
const FLASH_MS = 2500;

interface GameLevelScreenProps {
  levelId: string;
  onExit: () => void;
}

const GameLevelScreen = ({ levelId, onExit }: GameLevelScreenProps) => {
  const level = getLevel(levelId);
  if (!level || !isLevelBuilt(level)) {
    return (
      <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-6 bg-black/90 text-white">
        <Construction size={64} className="text-quantum-magenta" />
        <h2 className="text-3xl font-orbitron">MODULE UNDER CONSTRUCTION</h2>
        <button onClick={onExit} className="flex items-center gap-2 px-6 py-3 bg-quantum-purple hover:bg-quantum-purple/80 rounded border border-white/20 font-bold">
          <ArrowLeft size={18} /> Back
        </button>
      </div>
    );
  }
  return <LevelSession level={level} onExit={onExit} />;
};

const emptyCircuit = (slots: number): Circuit => new Array<GateId | null>(slots).fill(null);
const fullLoop = (circuit: Circuit): LoopRange => ({ enabled: false, start: 0, end: circuit.length + 1 });

interface Flash {
  kind: 'success' | 'fail';
  text: string;
  id: number;
}

const LevelSession = ({ level, onExit }: { level: LevelDef; onExit: () => void }) => {
  const { markLevelComplete } = useGame();
  const isSandboxLevel = level.id === SANDBOX_LEVEL_ID;
  const tutorial = TUTORIALS[level.id] ?? null;

  // --- Puzzle & circuit ---
  const [puzzleIndex, setPuzzleIndex] = useState(0);
  const puzzle = level.puzzles[puzzleIndex];
  const [circuit, setCircuit] = useState<Circuit>(() => emptyCircuit(puzzle.slots));
  const [initialState, setInitialState] = useState<QubitState>(puzzle.start);
  const [mode, setMode] = useState<SystemMode>(isSandboxLevel ? 'SANDBOX' : 'PUZZLE');
  const duration = circuit.length + 1;

  // --- Playback ---
  const [time, setTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [loop, setLoop] = useState<LoopRange>(() => fullLoop(circuit));

  // --- UI ---
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedGate, setSelectedGate] = useState<GateId | null>(null);
  const [showTarget, setShowTarget] = useState(false);
  const [activeArchiveId, setActiveArchiveId] = useState<string | null>(null);
  const [flash, setFlash] = useState<Flash | null>(null);
  const [solved, setSolved] = useState(false);
  const [showVictory, setShowVictory] = useState(false);

  // --- Tutorial ---
  const [tutorialStep, setTutorialStep] = useState(0);
  const [tutorialCollapsed, setTutorialCollapsed] = useState(false);
  const [openedArchives, setOpenedArchives] = useState<ReadonlySet<string>>(() => new Set());
  const [hasPausedThisStep, setHasPausedThisStep] = useState(false);
  const [lastResumeTime, setLastResumeTime] = useState<number | null>(null);

  const setPlaying = useCallback((playing: boolean) => {
    setIsPlaying(playing);
    if (!playing) setHasPausedThisStep(true);
  }, []);

  const goToStep = (step: number, playingNow = isPlaying) => {
    setTutorialStep(step);
    setHasPausedThisStep(!playingNow);
    setLastResumeTime(null);
  };

  const showFlash = (kind: Flash['kind'], text: string) => setFlash({ kind, text, id: Date.now() });

  useEffect(() => {
    if (!flash) return;
    const id = setTimeout(() => setFlash(null), FLASH_MS);
    return () => clearTimeout(id);
  }, [flash]);

  useEffect(() => {
    if (!solved) return;
    const id = setTimeout(() => setShowVictory(true), 500);
    return () => clearTimeout(id);
  }, [solved]);

  const loadPuzzle = (index: number) => {
    const next = level.puzzles[index];
    const freshCircuit = emptyCircuit(next.slots);
    setPuzzleIndex(index);
    setCircuit(freshCircuit);
    setInitialState(next.start);
    setTime(0);
    setPlaying(false);
    setLoop(fullLoop(freshCircuit));
    setSelectedGate(null);
    if (tutorial) goToStep(firstStepOfPuzzle(tutorial, index), false);
  };

  const restartLevel = () => {
    loadPuzzle(0);
    setMode(isSandboxLevel ? 'SANDBOX' : 'PUZZLE');
    setSolved(false);
    setShowVictory(false);
  };

  // Scale the stage to whatever space the instructor panel and controls leave.
  const stageAreaRef = useRef<HTMLDivElement>(null);
  const [stageScale, setStageScale] = useState(1);
  useEffect(() => {
    const el = stageAreaRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setStageScale(Math.max(0.3, Math.min(1, width / STAGE_WIDTH, height / STAGE_HEIGHT)));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // --- Simulation clock (frame-rate independent) ---
  const runEnd = loop.enabled ? loop.end : duration;

  useEffect(() => {
    if (!isPlaying) return;
    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000); // don't jump after a backgrounded tab
      last = now;
      setTime(prev => Math.min(prev + dt * TIME_UNITS_PER_SECOND * playbackSpeed, runEnd));
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [isPlaying, playbackSpeed, runEnd]);

  // End of a run: wrap the loop, or check the result and start over.
  useEffect(() => {
    if (!isPlaying || time < runEnd) return;

    if (loop.enabled) {
      setTime(loop.start);
      return;
    }

    const target = puzzle.target;
    if (mode === 'PUZZLE' && target && !solved) {
      const result = finalState(initialState, circuit);
      if (statesEqual(result, target)) {
        if (puzzleIndex < level.puzzles.length - 1) {
          loadPuzzle(puzzleIndex + 1);
          showFlash('success', `Target ${formatState(target)} reached. Next puzzle loaded.`);
        } else {
          setSolved(true);
          setIsPlaying(false);
          markLevelComplete(level.id);
        }
        return;
      }
      if (circuit.some(Boolean)) {
        showFlash('fail', `Result ${formatState(result)} does not match the target ${formatState(target)}.`);
      }
    }
    setTime(0);
    // loadPuzzle/showFlash are omitted: they're recreated each render and only use setters plus `level`/`tutorial`.
  }, [isPlaying, time, runEnd, loop.enabled, loop.start, mode, puzzle, solved, initialState, circuit, puzzleIndex, level, markLevelComplete]);

  // --- Controls ---
  const togglePlay = () => {
    if (!isPlaying) setLastResumeTime(time);
    setPlaying(!isPlaying);
  };

  const seek = useCallback(
    (t: number) => {
      setPlaying(false);
      setTime(t);
    },
    [setPlaying],
  );

  const step = (delta: number) => {
    setPlaying(false);
    setTime(prev => {
      let next = prev + delta;
      if (next >= duration) next = 0;
      if (next < 0) next = duration - 0.1;
      return Number(next.toFixed(1));
    });
  };

  const resetClock = () => {
    setLoop(prev => ({ ...prev, enabled: false }));
    setTime(0);
    setPlaying(false);
  };

  const changeLoop = useCallback((start: number, end: number) => setLoop(prev => ({ ...prev, start, end })), []);

  const availableGates: GateId[] =
    level.visual === 'bit' ? ['X'] : mode === 'SANDBOX' ? ALL_GATES : puzzle.gates;

  const toggleMode = () => {
    if (mode === 'PUZZLE') {
      setMode('SANDBOX');
      return;
    }
    // Back to the puzzle: fixed start state, only the gates this puzzle allows, and no custom
    // loop (solutions are only checked at the end of a full run).
    setMode('PUZZLE');
    setInitialState(puzzle.start);
    setCircuit(prev => prev.map(g => (g && puzzle.gates.includes(g) ? g : null)));
    setLoop(prev => ({ ...prev, enabled: false }));
    setTime(0);
    setPlaying(false);
  };

  const placeGate = (slot: number, gate: GateId, fromSlot?: number) => {
    setCircuit(prev => {
      if (fromSlot === slot) return prev;
      const next = [...prev];
      if (fromSlot !== undefined) next[fromSlot] = prev[slot];
      next[slot] = gate;
      return next;
    });
    setTime(0);
  };

  const removeGate = (slot: number) => {
    setCircuit(prev => prev.map((g, i) => (i === slot ? null : g)));
    setTime(0);
  };

  const resizeSandbox = (delta: number) => {
    const size = Math.max(1, Math.min(SANDBOX_MAX_SLOTS, circuit.length + delta));
    const next = Array.from({ length: size }, (_, i) => circuit[i] ?? null);
    setCircuit(next);
    setLoop(prev => ({ ...fullLoop(next), enabled: prev.enabled }));
    setTime(0);
  };

  const grabBall = () => {
    setPlaying(false);
    setTime(0);
  };

  const switchInitialBasis = () => setInitialState(prev => ({ ...prev, basis: prev.basis === 0 ? 1 : 0 }));

  const openArchive = (id: string) => {
    setActiveArchiveId(id);
    setOpenedArchives(prev => new Set(prev).add(id));
  };

  // Keyboard: Space = play/pause, Esc = close overlay / cancel gate placement.
  const keyHandler = useRef<(e: KeyboardEvent) => void>(() => {});
  useEffect(() => {
    keyHandler.current = (e: KeyboardEvent) => {
      if (activeArchiveId || showVictory) {
        if (e.key === 'Escape' && activeArchiveId) setActiveArchiveId(null);
        return;
      }
      if (e.key === 'Escape') {
        if (selectedGate) setSelectedGate(null);
        else setSidebarOpen(false);
      } else if (e.key === ' ') {
        const target = e.target as HTMLElement | null;
        if (target?.closest('button, input, textarea, select, a')) return;
        e.preventDefault();
        togglePlay();
      }
    };
  });
  useEffect(() => {
    const listener = (e: KeyboardEvent) => keyHandler.current(e);
    window.addEventListener('keydown', listener);
    return () => window.removeEventListener('keydown', listener);
  }, []);

  // --- Tutorial progress ---
  const tutorialCtx: TutorialContext = {
    isPlaying, hasPausedThisStep, lastResumeTime, loop, mode, initialState, playbackSpeed,
    sidebarOpen, circuit, openedArchives,
  };
  const currentStep = tutorial?.[tutorialStep];
  const stepDone = currentStep ? !currentStep.awaitsSolve && (currentStep.isDone?.(tutorialCtx) ?? true) : false;
  const canGoBack = !!tutorial && tutorialStep > 0 && tutorial[tutorialStep - 1].puzzle === puzzleIndex;
  const canGoNext = !!tutorial && stepDone && tutorialStep < tutorial.length - 1;

  // --- Derived view state ---
  const target = puzzle.target;
  const previewing = showTarget && !!target;
  const discrete = stateAt(initialState, circuit, time);
  const shownState = previewing ? target! : discrete;
  const visualState = previewing ? { basis: target!.basis, phase: target!.phase } : visualStateAt(initialState, circuit, time);
  const activeSlot = activeSlotAt(circuit, time);
  const activeGate = activeSlot === null ? null : circuit[activeSlot];
  const isTutorialLevel = !!tutorial;

  return (
    <ArchiveLinkContext.Provider value={openArchive}>
      <div className="absolute inset-0 z-30 flex flex-col bg-black/90 backdrop-blur-md animate-in fade-in zoom-in-95 duration-500 select-none overflow-hidden text-gray-200">
        {activeArchiveId && (
          <div className="absolute inset-0 z-50">
            <ArchivesScreen onReturn={() => setActiveArchiveId(null)} initialId={activeArchiveId} backLabel="Return to Simulation" />
          </div>
        )}

        {/* Header */}
        <header className="h-16 shrink-0 border-b border-white/10 flex items-center justify-between gap-2 px-3 md:px-6 bg-[#050510]/80 backdrop-blur-sm z-40 relative">
          <div className="flex items-center gap-2 md:gap-4 min-w-0">
            <button onClick={onExit} aria-label="Exit level" className="p-2 rounded-full hover:bg-white/10 text-quantum-cyan transition-colors">
              <ArrowLeft size={20} />
            </button>
            <button
              onClick={() => setSidebarOpen(o => !o)}
              aria-label="Toggle operator sidebar"
              aria-expanded={sidebarOpen}
              className={`p-2 rounded border transition-colors ${sidebarOpen ? 'bg-quantum-cyan/20 border-quantum-cyan text-quantum-cyan' : 'bg-black/50 border-white/20 hover:bg-quantum-cyan/20'}`}
            >
              <PanelLeft size={20} />
            </button>
            <div className="hidden sm:block min-w-0">
              <h2 className="font-orbitron text-lg text-white tracking-widest uppercase truncate">
                {isTutorialLevel ? 'Training Module' : 'Simulation'} // {level.title}
              </h2>
              <div className="text-[10px] font-mono text-quantum-cyan/60">
                ID: {level.id.toUpperCase()} //{' '}
                {isSandboxLevel ? 'FREE PLAY' : `PUZZLE ${puzzleIndex + 1} OF ${level.puzzles.length}`}
              </div>
            </div>
          </div>

          {target && (
            <button
              onPointerDown={() => setShowTarget(true)}
              onPointerUp={() => setShowTarget(false)}
              onPointerLeave={() => setShowTarget(false)}
              onPointerCancel={() => setShowTarget(false)}
              onKeyDown={e => (e.key === ' ' || e.key === 'Enter') && setShowTarget(true)}
              onKeyUp={() => setShowTarget(false)}
              onBlur={() => setShowTarget(false)}
              onContextMenu={e => e.preventDefault()}
              className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all duration-300 font-orbitron text-sm tracking-wider touch-none ${
                showTarget
                  ? 'bg-quantum-magenta/20 border-quantum-magenta text-quantum-magenta shadow-[0_0_15px_rgba(247,37,133,0.3)] scale-105'
                  : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10 hover:border-white/20'
              }`}
            >
              <Eye size={18} />
              <span className="hidden sm:inline">HOLD TO VIEW GOAL</span>
              <span className="sm:hidden">GOAL</span>
            </button>
          )}
        </header>

        <div className="flex-1 relative flex min-h-0">
          <OperatorSidebar
            open={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            gates={availableGates}
            circuit={circuit}
            time={time}
            useQuantumNames={level.visual === 'qubit'}
            selectedGate={selectedGate}
            onSelectGate={setSelectedGate}
            onPlace={placeGate}
            onRemove={removeGate}
            onResize={isSandboxLevel ? resizeSandbox : undefined}
            maxSlots={SANDBOX_MAX_SLOTS}
          />

          {/* Stage */}
          <div className={`flex-1 min-w-0 flex flex-col items-center transition-[margin] duration-300 ${sidebarOpen ? 'md:ml-80' : ''}`}>
            {currentStep && (
              <div className="w-full max-w-lg px-3 pt-3 md:pt-6 shrink-0 z-20">
                <div className="bg-black/80 border border-quantum-cyan/30 p-3 md:p-4 rounded-xl backdrop-blur-md shadow-lg flex flex-col gap-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-quantum-cyan/10 rounded-lg text-quantum-cyan shrink-0">
                      <MessageSquare size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-orbitron text-xs text-quantum-cyan tracking-widest mb-1">
                          INSTRUCTOR <span className="text-gray-600">{tutorialStep + 1}/{tutorial!.length}</span>
                        </h4>
                        <button
                          onClick={() => setTutorialCollapsed(c => !c)}
                          aria-label={tutorialCollapsed ? 'Expand instructor' : 'Collapse instructor'}
                          className="p-1 -mt-1 text-gray-500 hover:text-white"
                        >
                          {tutorialCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                        </button>
                      </div>
                      {!tutorialCollapsed && <div className="text-sm text-gray-300 font-rajdhani leading-relaxed select-text">{currentStep.text}</div>}
                    </div>
                  </div>
                  {!tutorialCollapsed && (
                    <div className="flex items-center justify-end gap-2 border-t border-white/5 pt-2">
                      {currentStep.awaitsSolve && (
                        <span className="mr-auto text-[11px] font-orbitron tracking-wider text-quantum-magenta/80">RUN A WORKING CIRCUIT TO CONTINUE</span>
                      )}
                      <button
                        onClick={() => goToStep(tutorialStep - 1)}
                        disabled={!canGoBack}
                        className="px-3 py-1 text-xs font-orbitron text-gray-500 hover:text-white disabled:opacity-30 disabled:hover:text-gray-500"
                      >
                        PREV
                      </button>
                      {!currentStep.awaitsSolve && (
                        <button
                          onClick={() => goToStep(tutorialStep + 1)}
                          disabled={!canGoNext}
                          className="px-4 py-1 text-xs font-orbitron bg-quantum-cyan/10 border border-quantum-cyan/30 text-quantum-cyan rounded hover:bg-quantum-cyan hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-quantum-cyan/10 disabled:hover:text-quantum-cyan"
                        >
                          NEXT
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="relative flex-1 min-h-0 w-full max-w-3xl flex flex-col items-center overflow-hidden">
              <div ref={stageAreaRef} className="flex-1 min-h-0 w-full flex items-center justify-center">
                <div style={{ width: STAGE_WIDTH * stageScale, height: STAGE_HEIGHT * stageScale }}>
                  <div style={{ transform: `scale(${stageScale})`, transformOrigin: 'top left' }}>
                    <Stage
                      visual={level.visual}
                      state={visualState}
                      nodeBasis={shownState.basis}
                      activeGate={activeGate}
                      isPreview={previewing}
                      canDragBall={mode === 'SANDBOX'}
                      scale={stageScale}
                      onBallGrab={grabBall}
                      onBallSwitch={switchInitialBasis}
                    />
                  </div>
                </div>
              </div>
              <div className="shrink-0 flex flex-col items-center gap-1 min-h-12 px-3 text-center">
                <div className="font-mono text-xs tracking-widest text-gray-500">
                  {previewing ? 'TARGET' : 'STATE'} <span className="text-quantum-cyan text-base">{formatState(shownState)}</span>
                  {target && !previewing && (
                    <span className="ml-3">
                      TARGET <span className="text-quantum-magenta text-base">{formatState(target)}</span>
                    </span>
                  )}
                </div>
                {mode === 'PUZZLE' && target && loop.enabled && !flash && (
                  <div className="text-[11px] font-rajdhani tracking-wide text-yellow-400/80">Loop mode is on: the target is only checked after a full run.</div>
                )}
                {flash && (
                  <div
                    key={flash.id}
                    role="status"
                    className={`px-3 py-1 rounded border text-xs font-orbitron tracking-wider animate-in fade-in ${
                      flash.kind === 'success' ? 'border-green-500/50 bg-green-500/10 text-green-400' : 'border-red-500/40 bg-red-500/10 text-red-400'
                    }`}
                  >
                    {flash.text}
                  </div>
                )}
              </div>
            </div>

            <div className="shrink-0 flex flex-col items-center pb-3 md:pb-4 z-20">
              <TimerControls
                time={time}
                duration={duration}
                isPlaying={isPlaying}
                playbackSpeed={playbackSpeed}
                loop={loop}
                onPlayToggle={togglePlay}
                onSeek={seek}
                onStep={step}
                onReset={resetClock}
                onLoopToggle={() => setLoop(prev => ({ ...prev, enabled: !prev.enabled }))}
                onLoopChange={changeLoop}
                onSpeedChange={setPlaybackSpeed}
              />

              {!isSandboxLevel && (
                <button
                  onClick={toggleMode}
                  className={`mt-3 flex items-center gap-2 px-4 py-2 rounded border font-orbitron text-xs tracking-widest transition-all ${
                    mode === 'SANDBOX'
                      ? 'bg-quantum-purple/20 border-quantum-purple text-white shadow-[0_0_15px_rgba(123,44,191,0.3)]'
                      : 'bg-gray-900/80 border-gray-700 text-gray-400 hover:border-gray-500'
                  }`}
                >
                  {mode === 'SANDBOX' ? <LockOpen size={14} /> : <Lock size={14} />}
                  CURRENT SYSTEM MODE: {mode}
                </button>
              )}
            </div>
          </div>
        </div>

        {showVictory && (
          <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300 p-4">
            <div role="dialog" aria-modal="true" className="bg-[#0a0a15] border border-quantum-cyan p-8 rounded-xl shadow-[0_0_50px_rgba(76,201,240,0.3)] max-w-md w-full text-center">
              <h2 className="text-3xl font-orbitron font-bold text-white mb-2">{level.type === 'ROOT' ? 'MODULE COMPLETE' : 'SYSTEM STABILIZED'}</h2>
              <div className="h-1 w-24 bg-linear-to-r from-transparent via-quantum-cyan to-transparent mx-auto mb-6" />
              <p className="text-gray-300 font-rajdhani mb-8 text-lg">
                {level.type === 'ROOT'
                  ? 'You have successfully calibrated the bit. Neural link established.'
                  : 'Every target state achieved. Gate calibration complete.'}
              </p>
              <div className="flex gap-4 justify-center">
                <button onClick={restartLevel} className="px-6 py-3 rounded border border-gray-600 hover:border-white text-gray-300 hover:text-white font-orbitron transition-all">
                  <RotateCcw className="inline-block mr-2" size={18} />
                  Replay
                </button>
                <button
                  autoFocus
                  onClick={onExit}
                  className="px-6 py-3 rounded bg-quantum-cyan hover:bg-quantum-cyan/80 text-black font-bold font-orbitron shadow-[0_0_15px_rgba(76,201,240,0.4)] transition-all"
                >
                  <CircleCheck className="inline-block mr-2" size={18} />
                  Finish
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ArchiveLinkContext.Provider>
  );
};

export default GameLevelScreen;
