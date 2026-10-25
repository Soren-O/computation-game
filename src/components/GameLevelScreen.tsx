import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ChevronDown, ChevronUp, CircleCheck, Construction, MessageSquare, Move3d, RotateCcw } from 'lucide-react';
import ArchivesScreen from './ArchivesScreen';
import HypercubeStage from './level/HypercubeStage';
import CircuitPanel, { type CaseTab, type Hand } from './level/CircuitPanel';
import { StageToggles, TransportControls } from './level/TransportBar';
import { CELL_INFO } from './level/cells';
import { activeColumnAt, gateMarks, runDuration, stageFrame } from '../game/animation';
import { QUBIT_COLORS, defaultView, type View } from '../game/hypercube';
import {
  ALL_CELLS,
  applyCircuit,
  basisState,
  emptyCircuit,
  formatState,
  indexToBits,
  isGate,
  statesMatch,
  type CellId,
  type Circuit,
  type QState,
} from '../game/quantum';
import { SANDBOX_DEFAULT, SANDBOX_LEVEL_ID, SANDBOX_LIMITS, getLevel, isLevelBuilt, type LevelDef } from '../game/levels';
import { ArchiveLinkContext, TUTORIALS, firstStepOfPuzzle, type LoopRange, type SystemMode, type TutorialContext } from '../game/tutorials';
import { useGame } from '../state/GameContext';

/** Matches the original pacing of 0.01 time units per frame at 60 fps. */
const TIME_UNITS_PER_SECOND = 0.6;
const FLASH_MS = 3000;
const AXIS_NAMES = ['left → right', 'bottom → top', 'front → back', 'outer → inner'];

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
        <h2 className="font-orbitron text-3xl">MODULE UNDER CONSTRUCTION</h2>
        <button onClick={onExit} className="flex items-center gap-2 rounded border border-white/20 bg-quantum-purple px-6 py-3 font-bold hover:bg-quantum-purple/80">
          <ArrowLeft size={18} /> Back
        </button>
      </div>
    );
  }
  return <LevelSession level={level} onExit={onExit} />;
};

const fullLoop = (columns: number): LoopRange => ({ enabled: false, start: 0, end: runDuration(columns) });

interface Flash {
  kind: 'success' | 'fail';
  text: string;
  id: number;
}

const LevelSession = ({ level, onExit }: { level: LevelDef; onExit: () => void }) => {
  const { markLevelComplete, settings } = useGame();
  const isSandboxLevel = level.id === SANDBOX_LEVEL_ID;
  const tutorial = TUTORIALS[level.id] ?? null;
  const classical = level.visual === 'bit';

  // --- Puzzle & circuit ---
  const [puzzleIndex, setPuzzleIndex] = useState(0);
  const puzzle = level.puzzles[puzzleIndex];
  const [sandboxQubits, setSandboxQubits] = useState(SANDBOX_DEFAULT.qubits);
  const qubits = isSandboxLevel ? sandboxQubits : puzzle.qubits;
  const [circuit, setCircuit] = useState<Circuit>(() => emptyCircuit(qubits, puzzle.columns));
  const [caseIndex, setCaseIndex] = useState(0);
  const [caseResults, setCaseResults] = useState<(boolean | null)[]>([]);
  const [mode, setMode] = useState<SystemMode>(isSandboxLevel ? 'SANDBOX' : 'PUZZLE');
  const [sandboxStart, setSandboxStart] = useState<QState | null>(null);
  const currentCase = puzzle.cases[Math.min(caseIndex, puzzle.cases.length - 1)];
  const initialState: QState =
    mode === 'SANDBOX' && sandboxStart ? sandboxStart : isSandboxLevel ? basisState(qubits, 0) : currentCase.start;
  const duration = runDuration(circuit.length);

  // --- Playback ---
  const [time, setTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [loop, setLoop] = useState<LoopRange>(() => fullLoop(circuit.length));

  // --- UI ---
  const [hand, setHand] = useState<Hand | null>(null);
  const [showTarget, setShowTarget] = useState(true);
  const [view, setView] = useState<View>(() => defaultView(qubits));
  const [activeArchiveId, setActiveArchiveId] = useState<string | null>(null);
  const [flash, setFlash] = useState<Flash | null>(null);
  const [celebrate, setCelebrate] = useState(false);
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
    if (!celebrate) return;
    const id = setTimeout(() => setCelebrate(false), 1200);
    return () => clearTimeout(id);
  }, [celebrate]);

  useEffect(() => {
    if (!solved) return;
    const id = setTimeout(() => setShowVictory(true), 700);
    return () => clearTimeout(id);
  }, [solved]);

  const editCircuit = (next: Circuit) => {
    setCircuit(next);
    setCaseResults([]);
    setTime(0);
  };

  const loadPuzzle = (index: number) => {
    const next = level.puzzles[index];
    setPuzzleIndex(index);
    setCircuit(emptyCircuit(next.qubits, next.columns));
    setCaseIndex(0);
    setCaseResults([]);
    setTime(0);
    setPlaying(false);
    setLoop(fullLoop(next.columns));
    setHand(null);
    if (next.qubits !== puzzle.qubits) setView(defaultView(next.qubits));
    if (tutorial) goToStep(firstStepOfPuzzle(tutorial, index), false);
  };

  const restartLevel = () => {
    loadPuzzle(0);
    setMode(isSandboxLevel ? 'SANDBOX' : 'PUZZLE');
    setSandboxStart(null);
    setSolved(false);
    setShowVictory(false);
  };

  // --- Simulation clock (frame-rate independent) ---
  const runEnd = loop.enabled ? Math.min(loop.end, duration) : duration;

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

    if (mode === 'PUZZLE' && !isSandboxLevel && !solved) {
      const outputs = puzzle.cases.map(c => applyCircuit(c.start, circuit));
      const results = puzzle.cases.map((c, k) => statesMatch(outputs[k], c.target, puzzle.upToGlobalPhase));
      setCaseResults(results);
      if (results.every(Boolean)) {
        setCelebrate(true);
        if (puzzleIndex < level.puzzles.length - 1) {
          loadPuzzle(puzzleIndex + 1);
          showFlash('success', puzzle.cases.length > 1 ? 'Every input passes. Next puzzle loaded.' : 'Goal reached. Next puzzle loaded.');
        } else {
          setSolved(true);
          setIsPlaying(false);
          markLevelComplete(level.id);
        }
        return;
      }
      if (circuit.some(col => col.some(Boolean))) {
        const k = results[caseIndex] === false ? caseIndex : results.findIndex(r => !r);
        const failing = results.filter(r => !r).length;
        const prefix = puzzle.cases.length > 1 ? `${failing} of ${results.length} inputs wrong. Input ${k + 1}: ` : '';
        showFlash('fail', `${prefix}got ${formatState(outputs[k])}, goal ${formatState(puzzle.cases[k].target)}.`);
      }
    }
    setTime(0);
    // loadPuzzle/showFlash are omitted: they're recreated each render and only use setters plus `level`/`tutorial`.
  }, [isPlaying, time, runEnd, loop.enabled, loop.start, mode, puzzle, solved, circuit, puzzleIndex, caseIndex, level, isSandboxLevel, markLevelComplete]);

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

  const stepTo = (direction: -1 | 1) => {
    setPlaying(false);
    setTime(prev => {
      const next = direction === 1 ? Math.floor(prev + 1e-6) + 1 : Math.ceil(prev - 1e-6) - 1;
      return Math.max(0, Math.min(duration, next));
    });
  };

  const resetClock = () => {
    setLoop(prev => ({ ...prev, enabled: false }));
    setTime(0);
    setPlaying(false);
  };

  const changeLoop = useCallback((start: number, end: number) => setLoop(prev => ({ ...prev, start, end })), []);

  const toggleMode = () => {
    if (mode === 'PUZZLE') {
      setMode('SANDBOX');
      return;
    }
    // Back to the puzzle: fixed start, only this puzzle's gates, and no custom loop
    // (solutions are only checked at the end of a full run).
    setMode('PUZZLE');
    setSandboxStart(null);
    editCircuit(circuit.map(col => col.map(cell => (cell && puzzle.gates.includes(cell) ? cell : null))));
    setLoop(prev => ({ ...prev, enabled: false }));
    setPlaying(false);
  };

  const palette: CellId[] = mode === 'SANDBOX' && !classical ? ALL_CELLS : puzzle.gates;

  const placeCell = (column: number, qubit: number, cell: CellId, from?: { column: number; qubit: number }) => {
    const next = circuit.map(col => col.slice());
    if (from) {
      if (from.column === column && from.qubit === qubit) return;
      next[from.column][from.qubit] = circuit[column][qubit];
    }
    next[column][qubit] = cell;
    editCircuit(next);
  };

  const removeCell = (column: number, qubit: number) => {
    editCircuit(circuit.map((col, k) => (k === column ? col.map((c, q) => (q === qubit ? null : c)) : col)));
  };

  const resizeSandbox = (dQubits: number, dColumns: number) => {
    const nq = Math.max(SANDBOX_LIMITS.minQubits, Math.min(SANDBOX_LIMITS.maxQubits, qubits + dQubits));
    const nc = Math.max(SANDBOX_LIMITS.minColumns, Math.min(SANDBOX_LIMITS.maxColumns, circuit.length + dColumns));
    const next = Array.from({ length: nc }, (_, k) => Array.from({ length: nq }, (_, q) => circuit[k]?.[q] ?? null));
    if (nq !== qubits) {
      setSandboxQubits(nq);
      setSandboxStart(null);
      setView(defaultView(nq));
    }
    editCircuit(next);
    setLoop(prev => ({ ...fullLoop(nc), enabled: prev.enabled }));
  };

  const pickStart = useCallback(
    (index: number) => {
      setSandboxStart(basisState(qubits, index));
      setPlaying(false);
      setTime(0);
    },
    [qubits, setPlaying],
  );

  const openArchive = (id: string) => {
    setActiveArchiveId(id);
    setOpenedArchives(prev => new Set(prev).add(id));
  };

  // Keyboard: Space = play/pause, Esc = close overlay / drop the held gate.
  const keyHandler = useRef<(e: KeyboardEvent) => void>(() => {});
  useEffect(() => {
    keyHandler.current = (e: KeyboardEvent) => {
      if (activeArchiveId || showVictory) {
        if (e.key === 'Escape' && activeArchiveId) setActiveArchiveId(null);
        return;
      }
      if (e.key === 'Escape') {
        setHand(null);
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
    isPlaying, hasPausedThisStep, lastResumeTime, loop, mode, initialState, playbackSpeed, circuit, openedArchives,
  };
  const currentStep = tutorial?.[tutorialStep];
  const stepDone = currentStep ? !currentStep.awaitsSolve && (currentStep.isDone?.(tutorialCtx) ?? true) : false;
  const canGoBack = !!tutorial && tutorialStep > 0 && tutorial[tutorialStep - 1].puzzle === puzzleIndex;
  const canGoNext = !!tutorial && stepDone && tutorialStep < tutorial.length - 1;

  // --- Derived view state ---
  const frame = useMemo(() => stageFrame(initialState, circuit, time), [initialState, circuit, time]);
  const target = !isSandboxLevel && mode === 'PUZZLE' ? currentCase.target : null;
  const active = activeColumnAt(time, circuit.length);
  const activeIndex = active?.index ?? null;
  const marks = useMemo(
    () => (activeIndex === null ? null : gateMarks(qubits, circuit[activeIndex])),
    [activeIndex, circuit, qubits],
  );
  // Fade the marks in as a column starts and out as it ends.
  const marksOpacity = active ? Math.max(0, Math.min(1, active.progress / 0.08, (1 - active.progress) / 0.12)) : 0;
  const prefersReducedMotion = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const activeAxes = active
    ? circuit[active.index].flatMap((cell, q) => (isGate(cell) || cell === 'SWAP' ? [q] : []))
    : [];
  const caseTabs: CaseTab[] =
    puzzle.cases.length > 1
      ? puzzle.cases.map((c, k) => ({
          label: `${indexToBits(c.start.findIndex(a => a.re !== 0 || a.im !== 0), qubits)}→${indexToBits(c.target.findIndex(a => a.re !== 0 || a.im !== 0), qubits)}`,
          passed: caseResults[k] ?? null,
        }))
      : [];

  return (
    <ArchiveLinkContext.Provider value={openArchive}>
      <div className="absolute inset-0 z-30 flex flex-col overflow-hidden bg-[#04040c]/95 text-gray-200 backdrop-blur-md animate-in fade-in zoom-in-95 duration-500 select-none">
        {activeArchiveId && (
          <div className="absolute inset-0 z-50">
            <ArchivesScreen onReturn={() => setActiveArchiveId(null)} initialId={activeArchiveId} backLabel="Return to Simulation" />
          </div>
        )}

        {/* Header */}
        <header className="relative z-40 flex min-h-14 shrink-0 flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b border-white/10 bg-[#050510]/80 px-3 py-1.5 backdrop-blur-sm md:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <button onClick={onExit} aria-label="Exit level" className="rounded-full p-2 text-quantum-cyan transition-colors hover:bg-white/10">
              <ArrowLeft size={20} />
            </button>
            <div className="min-w-0">
              <h2 className="truncate font-orbitron text-sm tracking-widest text-white uppercase md:text-base">{level.title}</h2>
              <div className="font-mono text-[10px] text-quantum-cyan/60">
                {qubits} {classical ? 'BIT' : 'QUBIT'}
                {qubits > 1 ? 'S' : ''} //{' '}
                {isSandboxLevel ? 'FREE PLAY' : `PUZZLE ${puzzleIndex + 1} OF ${level.puzzles.length}`}
              </div>
            </div>
          </div>
          <TransportControls
            isPlaying={isPlaying}
            time={time}
            duration={duration}
            speed={playbackSpeed}
            loopEnabled={loop.enabled}
            onPlayToggle={togglePlay}
            onReset={resetClock}
            onStep={stepTo}
            onLoopToggle={() => setLoop(prev => ({ ...prev, enabled: !prev.enabled }))}
            onSpeedChange={setPlaybackSpeed}
          />
          {!isSandboxLevel && (
            <div className="hidden w-40 flex-wrap items-center justify-end gap-1 lg:flex" aria-label="Puzzle progress">
              {level.puzzles.map((_, k) => (
                <span key={k} className={`h-1.5 w-4 rounded-full ${k < puzzleIndex || solved ? 'bg-green-400/80' : k === puzzleIndex ? 'bg-quantum-cyan' : 'bg-white/10'}`} />
              ))}
            </div>
          )}
        </header>

        {/* Instructor */}
        {currentStep && (
          <div className="z-20 mx-auto w-full max-w-2xl shrink-0 px-3 pt-3">
            <div className="flex flex-col gap-2 rounded-xl border border-quantum-cyan/25 bg-black/60 p-3 shadow-lg backdrop-blur-md">
              <div className="flex items-start gap-3">
                <div className="shrink-0 rounded-lg bg-quantum-cyan/10 p-2 text-quantum-cyan">
                  <MessageSquare size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-orbitron text-[11px] tracking-widest text-quantum-cyan">
                      INSTRUCTOR <span className="text-gray-600">{tutorialStep + 1}/{tutorial!.length}</span>
                    </h4>
                    <button
                      onClick={() => setTutorialCollapsed(c => !c)}
                      aria-label={tutorialCollapsed ? 'Expand instructor' : 'Collapse instructor'}
                      className="-mt-1 p-1 text-gray-500 hover:text-white"
                    >
                      {tutorialCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                    </button>
                  </div>
                  {!tutorialCollapsed && <div className="text-sm leading-relaxed text-gray-300 select-text">{currentStep.text}</div>}
                </div>
              </div>
              {!tutorialCollapsed && (
                <div className="flex items-center justify-end gap-2 border-t border-white/5 pt-2">
                  {currentStep.awaitsSolve && (
                    <span className="mr-auto font-orbitron text-[10px] tracking-wider text-quantum-magenta/80">RUN A WORKING CIRCUIT TO CONTINUE</span>
                  )}
                  <button
                    onClick={() => goToStep(tutorialStep - 1)}
                    disabled={!canGoBack}
                    className="px-3 py-1 font-orbitron text-xs text-gray-500 hover:text-white disabled:opacity-30 disabled:hover:text-gray-500"
                  >
                    PREV
                  </button>
                  {!currentStep.awaitsSolve && (
                    <button
                      onClick={() => goToStep(tutorialStep + 1)}
                      disabled={!canGoNext}
                      className="rounded border border-quantum-cyan/30 bg-quantum-cyan/10 px-4 py-1 font-orbitron text-xs text-quantum-cyan transition-colors hover:bg-quantum-cyan hover:text-black disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-quantum-cyan/10 disabled:hover:text-quantum-cyan"
                    >
                      NEXT
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Stage */}
        <div className="relative min-h-0 flex-1">
          <HypercubeStage
            qubits={qubits}
            visual={level.visual}
            frame={frame}
            target={showTarget ? target : null}
            activeAxes={activeAxes}
            view={view}
            onViewChange={setView}
            onPickStart={mode === 'SANDBOX' ? pickStart : undefined}
            celebrate={celebrate}
            marks={marks}
            marksOpacity={marksOpacity}
            animateMarks={!settings.reduceMotion && !prefersReducedMotion}
          />
          {/* Axis legend */}
          {qubits > 1 && (
            <div className="pointer-events-none absolute right-3 top-3 hidden flex-col gap-1 rounded-lg border border-white/5 bg-black/40 px-3 py-2 text-[11px] backdrop-blur sm:flex">
              {Array.from({ length: qubits }, (_, q) => (
                <div key={q} className="flex items-center gap-2">
                  <span className="h-0.5 w-4 rounded-full" style={{ background: QUBIT_COLORS[q] }} />
                  <span className="font-mono" style={{ color: QUBIT_COLORS[q] }}>q{q}</span>
                  <span className="text-gray-500">{AXIS_NAMES[q]}</span>
                </div>
              ))}
              {qubits >= 3 && (
                <div className="mt-1 flex items-center gap-1.5 text-gray-600">
                  <Move3d size={12} /> drag to rotate
                </div>
              )}
            </div>
          )}
        </div>

        {/* Readout */}
        <div className="flex min-h-9 shrink-0 flex-col items-center justify-center gap-1 px-3 pb-1 text-center">
          {flash ? (
            <div
              key={flash.id}
              role="status"
              className={`rounded-md border px-3 py-1 font-mono text-xs animate-in fade-in ${
                flash.kind === 'success' ? 'border-green-500/50 bg-green-500/10 text-green-300' : 'border-red-500/40 bg-red-500/10 text-red-300'
              }`}
            >
              {flash.text}
            </div>
          ) : (
            <div className="font-mono text-xs text-gray-500">
              STATE <span className="text-sm text-quantum-cyan">{formatState(frame.state, qubits >= 3 ? 2 : 4)}</span>
              {target && (
                <span className="ml-4">
                  GOAL <span className="text-sm text-quantum-magenta">{formatState(target, qubits >= 3 ? 2 : 4)}</span>
                </span>
              )}
              {mode === 'PUZZLE' && target && loop.enabled && (
                <span className="ml-4 text-yellow-400/80">loop on: the goal is only checked after a full run</span>
              )}
            </div>
          )}
        </div>

        {/* Controls */}
        <footer className="z-20 flex shrink-0 flex-col gap-1.5 border-t border-white/10 bg-[#06060f]/90 pb-1.5 pt-2 backdrop-blur">
          <CircuitPanel
            toolbar={
              <StageToggles
                mode={mode}
                showModeToggle={!isSandboxLevel}
                showTarget={target ? showTarget : null}
                onModeToggle={toggleMode}
                onTargetToggle={() => setShowTarget(s => !s)}
              />
            }
            qubits={qubits}
            circuit={circuit}
            gates={palette}
            classical={classical}
            time={time}
            duration={duration}
            loop={loop}
            activeColumn={active?.index ?? null}
            hand={hand}
            onHandChange={setHand}
            onPlace={placeCell}
            onRemove={removeCell}
            onSeek={seek}
            onLoopChange={changeLoop}
            onGateInfo={cell => openArchive(CELL_INFO[cell].archiveId)}
            cases={caseTabs}
            caseIndex={caseIndex}
            onCaseChange={k => {
              setCaseIndex(k);
              setTime(0);
            }}
            resize={
              isSandboxLevel
                ? {
                    onQubits: d => resizeSandbox(d, 0),
                    onColumns: d => resizeSandbox(0, d),
                    canAddQubit: qubits < SANDBOX_LIMITS.maxQubits,
                    canRemoveQubit: qubits > SANDBOX_LIMITS.minQubits,
                    canAddColumn: circuit.length < SANDBOX_LIMITS.maxColumns,
                    canRemoveColumn: circuit.length > SANDBOX_LIMITS.minColumns,
                  }
                : undefined
            }
          />
        </footer>

        {showVictory && (
          <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-300">
            <div role="dialog" aria-modal="true" className="w-full max-w-md rounded-2xl border border-quantum-cyan bg-[#0a0a15] p-8 text-center shadow-[0_0_50px_rgba(76,201,240,0.3)]">
              <h2 className="mb-2 font-orbitron text-3xl font-bold text-white">{level.type === 'ROOT' ? 'MODULE COMPLETE' : 'SYSTEM STABILIZED'}</h2>
              <div className="mx-auto mb-6 h-1 w-24 bg-linear-to-r from-transparent via-quantum-cyan to-transparent" />
              <p className="mb-8 text-lg text-gray-300">
                {level.type === 'ROOT'
                  ? 'You have successfully calibrated the bit. Neural link established.'
                  : `All ${level.puzzles.length} puzzles solved. ${level.title} complete.`}
              </p>
              <div className="flex justify-center gap-4">
                <button onClick={restartLevel} className="rounded-lg border border-gray-600 px-6 py-3 font-orbitron text-gray-300 transition-all hover:border-white hover:text-white">
                  <RotateCcw className="mr-2 inline-block" size={18} />
                  Replay
                </button>
                <button
                  autoFocus
                  onClick={onExit}
                  className="rounded-lg bg-quantum-cyan px-6 py-3 font-orbitron font-bold text-black shadow-[0_0_15px_rgba(76,201,240,0.4)] transition-all hover:bg-quantum-cyan/80"
                >
                  <CircleCheck className="mr-2 inline-block" size={18} />
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
