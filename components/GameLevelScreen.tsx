import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowLeft, Settings, Play, Pause, RotateCcw, Trash2, LayoutGrid, Binary, MessageSquare, ChevronLeft, Sidebar as SidebarIcon, ChevronRight, Repeat, Lock, Unlock, ArrowRight, ArrowLeft as ArrowLeftIcon, CheckCircle, ArrowUp, RefreshCcw, Eye } from 'lucide-react';
import ArchivesScreen from './ArchivesScreen';

interface GameLevelScreenProps {
  levelId: string;
  onExit: () => void;
  onComplete: () => void;
}

const SPEEDS = [0.25, 0.5, 1.0, 2.0, 4.0];

// Custom Icon for NOT Gate (Parallel Arrows: L->R top, R->L bottom)
const NotGateIcon = ({ className }: { className?: string }) => (
    <div className={`w-full h-full flex flex-col items-center justify-center gap-1 ${className}`}>
        {/* Top: Left to Right */}
        <svg viewBox="0 0 24 8" className="w-8 h-3 stroke-current fill-none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M 2 4 L 22 4" />
            <path d="M 18 1 L 22 4 L 18 7" />
        </svg>
        {/* Bottom: Right to Left */}
        <svg viewBox="0 0 24 8" className="w-8 h-3 stroke-current fill-none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M 22 4 L 2 4" />
            <path d="M 6 1 L 2 4 L 6 7" />
        </svg>
    </div>
);

// Custom Icon for Z Gate (Red, Dot Left, Arrows Right - Text Label External)
const ZGateIcon = ({ className }: { className?: string }) => (
    <div className={`w-full h-full flex items-center justify-center ${className}`}>
        <div className="flex items-center justify-between w-full px-1">
             {/* Dot on LEFT */}
             <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-current shrink-0" />
             
             {/* Rotation arrows on the RIGHT */}
             <div className="w-8 h-8 md:w-10 md:h-10 shrink-0">
                <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
                    {/* Right semicircle arrow: 12 o'clock to 6 o'clock */}
                    <path 
                        d="M 16 6 A 6 6 0 0 1 16 18" 
                        stroke="currentColor" 
                        strokeWidth="3" 
                        strokeLinecap="round"
                        fill="none"
                    />
                    {/* Arrowhead pointing LEFT at 6 o'clock */}
                    <polygon points="10,18 16,14 16,22" fill="currentColor" />
                    
                    {/* Left semicircle arrow: 6 o'clock to 12 o'clock */}
                    <path 
                        d="M 8 18 A 6 6 0 0 1 8 6" 
                        stroke="currentColor" 
                        strokeWidth="3" 
                        strokeLinecap="round"
                        fill="none"
                    />
                    {/* Arrowhead pointing RIGHT at 12 o'clock */}
                    <polygon points="14,6 8,2 8,10" fill="currentColor" />
                </svg>
            </div>
        </div>
    </div>
);

// Custom Icon for S Gate (Green, Dot Left, Spin Arrows Right - Text Label External)
const SGateIcon = ({ className }: { className?: string }) => (
    <div className={`w-full h-full flex items-center justify-center ${className}`}>
        <div className="flex items-center justify-between w-full px-1">
             {/* Dot on LEFT */}
             <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-current shrink-0" />
             
             {/* Spin arrows on the RIGHT - Shifted further right */}
             <div className="w-8 h-8 md:w-10 md:h-10 shrink-0 translate-x-3">
                <svg viewBox="0 0 32 32" fill="none" className="w-full h-full">
                    <path d="M 16 8 A 8 8 0 0 1 21.66 10.34" stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="none" />
                    <polygon points="19.54,12.46 23.78,8.22 25.20,13.88" fill="currentColor" />
                    
                    <path d="M 24 16 A 8 8 0 0 1 21.66 21.66" stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="none" />
                    <polygon points="19.54,19.54 23.78,23.78 18.12,25.20" fill="currentColor" />
                    
                    <path d="M 16 24 A 8 8 0 0 1 10.34 21.66" stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="none" />
                    <polygon points="12.46,19.54 8.22,23.78 6.80,18.12" fill="currentColor" />
                    
                    <path d="M 8 16 A 8 8 0 0 1 10.34 10.34" stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="none" />
                    <polygon points="12.46,12.46 8.22,8.22 13.88,6.80" fill="currentColor" />
                </svg>
            </div>
        </div>
    </div>
);

// Custom Icon for Y Gate (Yellow, Arrows + Spinners - Text Label External)
const YGateIcon = ({ className }: { className?: string }) => (
    <div className={`w-full h-full flex flex-col items-center justify-center gap-0 ${className}`}>
        {/* Top row: -> o -> */}
        <div className="flex items-center gap-0 w-full justify-center">
            <svg viewBox="0 0 24 8" className="w-5 h-2 stroke-current fill-none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M 2 4 L 22 4" />
                <path d="M 18 1 L 22 4 L 18 7" />
            </svg>
            <div className="w-10 h-10 shrink-0">
                <svg viewBox="0 0 32 32" className="w-full h-full fill-current stroke-current">
                     <path d="M 16 8 A 8 8 0 0 1 21.66 10.34" strokeWidth="3" strokeLinecap="round" fill="none" />
                    <polygon points="19.54,12.46 23.78,8.22 25.20,13.88" />
                    <path d="M 24 16 A 8 8 0 0 1 21.66 21.66" strokeWidth="3" strokeLinecap="round" fill="none" />
                    <polygon points="19.54,19.54 23.78,23.78 18.12,25.20" />
                    <path d="M 16 24 A 8 8 0 0 1 10.34 21.66" strokeWidth="3" strokeLinecap="round" fill="none" />
                    <polygon points="12.46,19.54 8.22,23.78 6.80,18.12" />
                    <path d="M 8 16 A 8 8 0 0 1 10.34 10.34" strokeWidth="3" strokeLinecap="round" fill="none" />
                    <polygon points="12.46,12.46 8.22,8.22 13.88,6.80" />
                </svg>
            </div>
            <svg viewBox="0 0 24 8" className="w-5 h-2 stroke-current fill-none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M 2 4 L 22 4" />
                <path d="M 18 1 L 22 4 L 18 7" />
            </svg>
        </div>
        
        {/* Bottom row: <- o <- */}
        <div className="flex items-center gap-0 w-full justify-center">
            <svg viewBox="0 0 24 8" className="w-5 h-2 stroke-current fill-none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M 22 4 L 2 4" />
                <path d="M 6 1 L 2 4 L 6 7" />
            </svg>
             <div className="w-10 h-10 shrink-0 scale-x-[-1]">
                <svg viewBox="0 0 32 32" className="w-full h-full fill-current stroke-current">
                    <path d="M 16 8 A 8 8 0 0 1 21.66 10.34" strokeWidth="3" strokeLinecap="round" fill="none" />
                    <polygon points="19.54,12.46 23.78,8.22 25.20,13.88" />
                    <path d="M 24 16 A 8 8 0 0 1 21.66 21.66" strokeWidth="3" strokeLinecap="round" fill="none" />
                    <polygon points="19.54,19.54 23.78,23.78 18.12,25.20" />
                    <path d="M 16 24 A 8 8 0 0 1 10.34 21.66" strokeWidth="3" strokeLinecap="round" fill="none" />
                    <polygon points="12.46,19.54 8.22,23.78 6.80,18.12" />
                    <path d="M 8 16 A 8 8 0 0 1 10.34 10.34" strokeWidth="3" strokeLinecap="round" fill="none" />
                    <polygon points="12.46,12.46 8.22,8.22 13.88,6.80" />
                </svg>
            </div>
            <svg viewBox="0 0 24 8" className="w-5 h-2 stroke-current fill-none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M 22 4 L 2 4" />
                <path d="M 6 1 L 2 4 L 6 7" />
            </svg>
        </div>
    </div>
);

// Define available operators
interface Operator {
    id: string;
    name: string;
    description: string;
    icon: any;
    color: string;
}

// THIS IS WHERE COLORS ARE DEFINED
const OPERATORS: Operator[] = [
    { id: 'X', name: 'NOT', description: 'Classical NOT Gate. Inverts |0> to |1> and vice versa.', icon: NotGateIcon, color: 'text-quantum-cyan' },
    { id: 'Z', name: 'P-Z', description: 'Pauli-Z Gate. Rotates phase by 180° only if qubit is |1>.', icon: ZGateIcon, color: 'text-red-500' },
    { id: 'S', name: 'S', description: 'Phase Gate. Rotates phase by 90° (multiplies by i) if qubit is |1>.', icon: SGateIcon, color: 'text-green-500' },
    { id: 'Y', name: 'P-Y', description: 'Pauli-Y. Maps |0> to i|1> and |1> to -i|0>.', icon: YGateIcon, color: 'text-yellow-400' },
];

interface QuantumState {
    basis: 0 | 1;
    // Phase is now 0-3 representing multiples of 90 degrees (pi/2)
    // 0 = 0°, 1 = 90° (i), 2 = 180° (-1), 3 = 270° (-i)
    phase: number; 
}

const GameLevelScreen: React.FC<GameLevelScreenProps> = ({ levelId, onExit, onComplete }) => {
  // Level Type Detection
  const isTutorialLevel = levelId === 'root';
  const isQuantumLevel = levelId.startsWith('q');
  
  // --- Puzzle State for Multi-Part Levels (q1) ---
  const [puzzlePhase, setPuzzlePhase] = useState(0); 

  // Dynamic MAX_TIME based on level and puzzle phase
  const getMaxTime = useCallback(() => {
    if (levelId === 'q1') {
        if (puzzlePhase <= 1) return 3.0; // 2 slots
        if (puzzlePhase === 2) return 3.0; // 2 slots (Target -|1>)
        if (puzzlePhase === 3) return 3.0; // 2 slots 

        // New Puzzles:
        if (puzzlePhase === 4) return 3.0; // Target i|1>. Slots 2.
        if (puzzlePhase === 5) return 4.0; // Target i|0>. Slots 3.
        if (puzzlePhase === 6) return 2.0; // Target i|0> from -|1>. Slots 1.
        if (puzzlePhase === 7) return 3.0; // Target -i|0>. Slots 2.
    }
    return 4.0;
  }, [levelId, puzzlePhase]);

  const MAX_TIME = getMaxTime();
  
  // Determine objective based on level and phase
  const getLevelObjective = useCallback((): QuantumState => {
      if (levelId === 'q1') {
          if (puzzlePhase === 0) return { basis: 1, phase: 0 }; // |0> -> |1>
          if (puzzlePhase === 1) return { basis: 0, phase: 0 }; // |1> -> |0>
          if (puzzlePhase === 2) return { basis: 1, phase: 2 }; // |0> -> -|1> (180deg)
          if (puzzlePhase === 3) return { basis: 0, phase: 2 }; // |0> -> -|0> (180deg)
          
          // New Puzzles
          if (puzzlePhase === 4) return { basis: 1, phase: 1 }; // |0> -> i|1> (90deg)
          if (puzzlePhase === 5) return { basis: 0, phase: 1 }; // |0> -> i|0> (90deg)
          if (puzzlePhase === 6) return { basis: 0, phase: 1 }; // -|1> -> i|0> (90deg)
          if (puzzlePhase === 7) return { basis: 0, phase: 3 }; // |0> -> -i|0> (270deg)
      }
      return { basis: 1, phase: 0 }; // Default goal
  }, [levelId, puzzlePhase]);

  const levelObjectiveState = getLevelObjective();
  
  // --- Simulation State ---
  const [time, setTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  
  const [gameMode, setGameMode] = useState<'PUZZLE' | 'SANDBOX'>('PUZZLE');
  const [isCustomLoop, setIsCustomLoop] = useState(false);
  const [loopStart, setLoopStart] = useState(0);
  const [loopEnd, setLoopEnd] = useState(MAX_TIME);
  const [draggingKnob, setDraggingKnob] = useState<'START' | 'END' | 'CURRENT' | null>(null);
  
  // Initial Circuit Setup
  const getInitialCircuit = useCallback(() => {
     const len = Math.ceil(MAX_TIME);
     return new Array(len).fill(null);
  }, [MAX_TIME]);

  const [circuit, setCircuit] = useState<(string | null)[]>(getInitialCircuit);
  
  const [initialState, setInitialState] = useState<QuantumState>({ basis: 0, phase: 0 });
  const [systemState, setSystemState] = useState<QuantumState>({ basis: 0, phase: 0 });
  const [showTargetPreview, setShowTargetPreview] = useState(false);

  // Update circuit size when MAX_TIME changes
  useEffect(() => {
    setCircuit(prev => {
        const requiredLength = Math.ceil(MAX_TIME);
        if (prev.length === requiredLength) return prev;
        const newArr = new Array(requiredLength).fill(null);
        // Preserve existing gates where possible
        for(let i=0; i<Math.min(prev.length, requiredLength); i++) {
            newArr[i] = prev[i];
        }
        return newArr;
    });
    setLoopEnd(MAX_TIME);
  }, [MAX_TIME]);

  // --- UI State ---
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [tutorialStepCompleted, setTutorialStepCompleted] = useState(false);
  const [levelCompleteTriggered, setLevelCompleteTriggered] = useState(false);
  const [showVictoryModal, setShowVictoryModal] = useState(false);
  const [activeArchiveId, setActiveArchiveId] = useState<string | null>(null);
  const [hasClickedBitArchive, setHasClickedBitArchive] = useState(false);
  const [hasPaused, setHasPaused] = useState(false);
  const [lastResumeTime, setLastResumeTime] = useState<number | null>(null);

  // Reset logic when level changes
  useEffect(() => {
    setTutorialStep(0);
    setPuzzlePhase(0);
    setInitialState({ basis: 0, phase: 0 });
    setTime(0);
    setIsPlaying(true);
    setGameMode('PUZZLE');
    setLevelCompleteTriggered(false);
    setShowVictoryModal(false);
    setIsSidebarOpen(false);
    setShowTargetPreview(false);
    
    // Explicitly reset circuit for new level
    if (levelId === 'q1') {
        // q1 Phase 0 has maxTime 3.0 (2 slots)
        setCircuit([null, null, null]);
    } else {
        setCircuit([null, null, null, null]);
    }

    isFirstLoad.current = true;
  }, [levelId]);

  // Reset validation state when step changes
  useEffect(() => {
    setHasPaused(!isPlaying);
    setLastResumeTime(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tutorialStep]);

  useEffect(() => {
    if (!isPlaying) setHasPaused(true);
  }, [isPlaying]);

  const isFirstLoad = useRef(true);
  useEffect(() => {
    if ((isTutorialLevel || isQuantumLevel) && gameMode === 'PUZZLE') {
        let startBasis: 0 | 1 = 0;
        let startPhase: number = 0;
        
        // Q1 Specific Start States
        if (levelId === 'q1') {
             if (puzzlePhase === 1) startBasis = 1; // |1> -> |0>
             else if (puzzlePhase === 6) {
                 // Puzzle 6 starts at -|1> (Basis 1, Phase 2/180deg)
                 startBasis = 1;
                 startPhase = 2;
             }
        }
        
        setInitialState({ basis: startBasis, phase: startPhase });
        setTime(0);
        
        if (!isFirstLoad.current) {
            setIsPlaying(false);
        }
    }
    isFirstLoad.current = false;
  }, [gameMode, isTutorialLevel, isQuantumLevel, levelId, puzzlePhase]);

  const handlePlayToggle = () => {
      const nextIsPlaying = !isPlaying;
      if (nextIsPlaying) {
          setLastResumeTime(time);
      }
      setIsPlaying(nextIsPlaying);
  };

  const [isDraggingBall, setIsDraggingBall] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const dragStartXRef = useRef<number>(0);

  // --- Simulation Engine ---
  
  const processGate = (opId: string | null, state: QuantumState): QuantumState => {
      if (!opId) return state;
      
      const newState = { ...state };
      if (opId === 'X') {
          newState.basis = state.basis === 0 ? 1 : 0;
          // Phase carries over directly
      } else if (opId === 'Z') {
          // If basis is 1, add 180deg (2 steps)
          if (state.basis === 1) {
              newState.phase = (state.phase + 2) % 4;
          }
      } else if (opId === 'S') {
          // If basis is 1, add 90deg (1 step)
          if (state.basis === 1) {
              newState.phase = (state.phase + 1) % 4;
          }
      } else if (opId === 'Y') {
          // Y = [[0, -i], [i, 0]]
          // Y|0> = i|1>  (Basis 0->1, Phase +1)
          // Y|1> = -i|0> (Basis 1->0, Phase -1 aka +3)
          if (state.basis === 0) {
              newState.basis = 1;
              newState.phase = (state.phase + 1) % 4;
          } else {
              newState.basis = 0;
              newState.phase = (state.phase + 3) % 4;
          }
      }
      return newState;
  };

  const calculateStateAt = useCallback((currentTime: number) => {
      let state = { ...initialState };
      const stepsToProcess = Math.floor(currentTime);

      for (let index = 1; index < Math.min(stepsToProcess + 1, circuit.length); index++) {
          if (index <= stepsToProcess) {
              state = processGate(circuit[index], state);
          }
      }
      return state;
  }, [circuit, initialState]);

  const getVisualState = useCallback((currentTime: number) => {
      let state = { ...initialState };
      
      const currentStep = Math.floor(currentTime); 
      const progress = currentTime % 1; 

      for (let index = 1; index < currentStep; index++) {
          if (index < circuit.length) {
              state = processGate(circuit[index], state);
          }
      }
      
      // Values for rendering
      let continuousBasis = state.basis * 1.0;
      let continuousPhase = state.phase * 1.0; // 0..3

      if (currentStep > 0 && currentStep < circuit.length) {
          const opId = circuit[currentStep];
          
          if (opId === 'X') {
              // Interpolate Basis
              continuousBasis = state.basis === 0 ? progress : 1 - progress;
          } 
          else if (opId === 'Z' && state.basis === 1) {
              // Phase +2 (180)
               continuousPhase = state.phase + (progress * 2);
          }
          else if (opId === 'S' && state.basis === 1) {
              // Phase +1 (90)
              continuousPhase = state.phase + progress;
          }
          else if (opId === 'Y') {
              // Y is complex. Basis flips, Phase rotates.
              // Basis 0->1, Phase +1
              if (state.basis === 0) {
                  continuousBasis = progress;
                  continuousPhase = state.phase + progress;
              } else {
              // Basis 1->0, Phase -1 (visually -90 deg)
                  continuousBasis = 1 - progress;
                  continuousPhase = state.phase - progress;
              }
          }
      }

      return { basis: continuousBasis, phase: continuousPhase };
  }, [circuit, initialState]);

  useEffect(() => {
      const newState = calculateStateAt(time);
      setSystemState(newState);
  }, [time, calculateStateAt]);

  useEffect(() => {
    let animationFrameId: number;
    
    const animate = () => {
      if (isPlaying) {
        setTime(prev => {
          const effectiveMax = isCustomLoop ? loopEnd : MAX_TIME;
          const effectiveMin = isCustomLoop ? loopStart : 0;

          let next = prev + (0.01 * playbackSpeed);
          
          if (next >= effectiveMax - 0.01) {
             if (!isCustomLoop && effectiveMax === MAX_TIME) {
                 const finalState = calculateStateAt(MAX_TIME);
                 
                 // --- WIN CONDITION LOGIC ---
                 const isWin = finalState.basis === levelObjectiveState.basis && finalState.phase === levelObjectiveState.phase;

                 if (isWin && !levelCompleteTriggered && gameMode === 'PUZZLE') {
                     
                     // Special Logic for Quantum Gates Level (Multi-Puzzle)
                     if (levelId === 'q1') {
                         if (puzzlePhase < 7) { // Now goes up to 7
                             // Advance Puzzle
                             setIsPlaying(false);
                             setPuzzlePhase(prev => {
                                 const nextPhase = prev + 1;
                                 
                                 // Determine circuit size for next phase
                                 let nextMaxTime = 4.0;
                                 if (nextPhase === 4) nextMaxTime = 3.0; // 2 slots
                                 if (nextPhase === 5) nextMaxTime = 4.0; // 3 slots
                                 if (nextPhase === 6) nextMaxTime = 2.0; // 1 slot
                                 if (nextPhase === 7) nextMaxTime = 3.0; // 2 slots
                                 
                                 // Reset Circuit
                                 setCircuit(new Array(Math.ceil(nextMaxTime)).fill(null));
                                 return nextPhase;
                             });
                             
                             // Update Tutorial Steps
                             const phaseSteps: {[key:number]: number} = {
                                 0: 4,  // To P1
                                 1: 5,  // To P2 Intro
                                 2: 7,  // To P3
                                 3: 8,  // To P4
                                 4: 9,  // To P5
                                 5: 10, // To P6
                                 6: 11  // To P7
                             };
                             
                             if (phaseSteps[puzzlePhase]) {
                                 setTutorialStep(phaseSteps[puzzlePhase]);
                             }
                             
                             setTime(0);
                             return 0;
                         } else {
                             // Victory
                             setLevelCompleteTriggered(true);
                             setIsPlaying(false);
                             setTimeout(() => setShowVictoryModal(true), 500);
                             return MAX_TIME;
                         }
                     } 
                     
                     // Default One-Stage Victory
                     else {
                        setLevelCompleteTriggered(true);
                        setIsPlaying(false);
                        setTimeout(() => setShowVictoryModal(true), 500);
                        return MAX_TIME; 
                     }
                 }
                 return 0;
             }
             return effectiveMin;
          }
          return next;
        });
      }
      animationFrameId = requestAnimationFrame(animate);
    };

    if (isPlaying) {
      animationFrameId = requestAnimationFrame(animate);
    }
    
    return () => cancelAnimationFrame(animationFrameId);
  }, [isPlaying, playbackSpeed, calculateStateAt, levelObjectiveState, onComplete, levelCompleteTriggered, isCustomLoop, loopStart, loopEnd, gameMode, levelId, puzzlePhase, MAX_TIME]);


  // --- Tutorial Logic ---
  useEffect(() => {
    let isComplete = false;

    if (levelId === 'root') {
        // ... (Existing root tutorial logic unchanged)
        switch (tutorialStep) {
            case 0: case 1: case 3: case 9: isComplete = true; break;
            case 2: isComplete = hasClickedBitArchive; break;
            case 4: isComplete = hasPaused && isPlaying && lastResumeTime !== null && Math.abs(lastResumeTime - 2.0) <= 0.2; break;
            case 5: isComplete = hasPaused && isPlaying && lastResumeTime !== null && Math.abs(lastResumeTime - 1.0) <= 0.2; break;
            case 6: isComplete = isCustomLoop && Math.abs(loopStart - 1.0) < 0.25 && Math.abs(loopEnd - 2.0) < 0.25; break;
            case 7: isComplete = gameMode === 'SANDBOX'; break;
            case 8: isComplete = initialState.basis === 1 && isPlaying; break;
            case 10: isComplete = playbackSpeed !== 1.0; break;
            case 11: isComplete = isSidebarOpen; break;
            case 12: isComplete = gameMode === 'PUZZLE'; break;
            case 13: isComplete = circuit.some(op => op === 'X'); break;
            case 14: isComplete = false; break;
            default: isComplete = true;
        }
    } else if (levelId === 'q1') {
        switch (tutorialStep) {
            case 0: case 1: isComplete = true; break;
            case 2: isComplete = circuit.some(op => op === 'X'); break; // Drag X
            case 3: isComplete = false; break; // P0 exec
            case 4: isComplete = false; break; // P1 exec
            case 5: isComplete = true; break;  // P2 intro
            case 6: isComplete = false; break; // P2 exec
            case 7: isComplete = false; break; // P3 exec
            case 8: isComplete = false; break; // P4 exec
            case 9: isComplete = false; break; // P5 exec
            case 10: isComplete = false; break; // P6 exec
            case 11: isComplete = false; break; // P7 exec
            default: isComplete = true;
        }
    } else {
        isComplete = true; 
    }

    setTutorialStepCompleted(isComplete);
    
  }, [tutorialStep, isPlaying, systemState, time, isCustomLoop, loopStart, loopEnd, gameMode, initialState, playbackSpeed, hasClickedBitArchive, levelId, hasPaused, lastResumeTime, isSidebarOpen, circuit]);

  // --- Interaction Handlers ---
  
  const handleGateDragStart = (e: React.DragEvent, operatorId: string, sourceIndex?: number) => {
    e.dataTransfer.setData('operatorId', operatorId);
    if (typeof sourceIndex === 'number') {
        e.dataTransfer.setData('sourceIndex', sourceIndex.toString());
        e.dataTransfer.effectAllowed = 'move';
    } else {
        e.dataTransfer.effectAllowed = 'copy';
    }
  };

  const handleCircuitDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (targetIndex === 0) return;

    const operatorId = e.dataTransfer.getData('operatorId');
    const sourceIndexStr = e.dataTransfer.getData('sourceIndex');

    if (operatorId) {
        setCircuit(prev => {
            const newCircuit = [...prev];
            if (sourceIndexStr && !isNaN(parseInt(sourceIndexStr))) {
                const sourceIndex = parseInt(sourceIndexStr);
                if (sourceIndex !== targetIndex) {
                    const existingAtTarget = newCircuit[targetIndex];
                    newCircuit[targetIndex] = operatorId;
                    newCircuit[sourceIndex] = existingAtTarget; 
                }
            } else {
                newCircuit[targetIndex] = operatorId;
            }
            return newCircuit;
        });
        setTime(0);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
  };

  const removeGate = (index: number) => {
      setCircuit(prev => {
          const newCircuit = [...prev];
          newCircuit[index] = null;
          return newCircuit;
      });
      setTime(0);
  };

  const handleBallMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
      if (gameMode !== 'SANDBOX') return;
      e.stopPropagation();
      
      if (isPlaying) {
          setIsPlaying(false);
          setTime(prev => Math.floor(prev));
      } else {
          setTime(prev => Math.floor(prev));
      }

      setIsDraggingBall(true);
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
      dragStartXRef.current = clientX;
  };

  const handleBallGlobalMove = useCallback((e: MouseEvent | TouchEvent) => {
      if (!isDraggingBall) return;
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      setDragOffset(clientX - dragStartXRef.current);
  }, [isDraggingBall]);

  const handleBallGlobalUp = useCallback(() => {
      if (!isDraggingBall) return;
      const threshold = 100;
      let shouldToggle = false;

      if (systemState.basis === 0 && dragOffset > threshold) {
          shouldToggle = true;
      }
      else if (systemState.basis === 1 && dragOffset < -threshold) {
          shouldToggle = true;
      }

      if (shouldToggle) {
          setInitialState(prev => ({ ...prev, basis: prev.basis === 0 ? 1 : 0 }));
      }

      setIsDraggingBall(false);
      setDragOffset(0);
  }, [isDraggingBall, dragOffset, systemState]);

  useEffect(() => {
      if (isDraggingBall) {
          window.addEventListener('mousemove', handleBallGlobalMove);
          window.addEventListener('mouseup', handleBallGlobalUp);
          window.addEventListener('touchmove', handleBallGlobalMove, { passive: false });
          window.addEventListener('touchend', handleBallGlobalUp);
      }
      return () => {
          window.removeEventListener('mousemove', handleBallGlobalMove);
          window.removeEventListener('mouseup', handleBallGlobalUp);
          window.removeEventListener('touchmove', handleBallGlobalMove);
          window.removeEventListener('touchend', handleBallGlobalUp);
      };
  }, [isDraggingBall, handleBallGlobalMove, handleBallGlobalUp]);


  // --- Circular Timer Interactions ---
  const timerRef = useRef<SVGSVGElement>(null);

  const getAngleFromEvent = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
      if (!timerRef.current) return 0;
      const rect = timerRef.current.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
      
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      let angle = Math.atan2(clientY - centerY, clientX - centerX);
      let degrees = angle * (180 / Math.PI) + 90;
      if (degrees < 0) degrees += 360;
      return degrees;
  };

  const handleTimerMouseDown = (e: React.MouseEvent | React.TouchEvent, knob: 'START' | 'END' | 'CURRENT') => {
      e.stopPropagation();
      if (knob === 'CURRENT' && isPlaying) setIsPlaying(false);
      setDraggingKnob(knob);
  };

  const handleTimerMouseMove = useCallback((e: MouseEvent | TouchEvent) => {
      if (!draggingKnob) return;
      
      const degrees = getAngleFromEvent(e);
      const rawTime = (degrees / 360) * MAX_TIME;
      const validTime = Math.max(0, Math.min(MAX_TIME - 0.01, rawTime));
      
      if (draggingKnob === 'START') {
          if (validTime < loopEnd) setLoopStart(validTime);
      } else if (draggingKnob === 'END') {
          if (validTime > loopStart) setLoopEnd(validTime);
      } else if (draggingKnob === 'CURRENT') {
          setTime(validTime);
          if (isPlaying) setIsPlaying(false);
      }
  }, [draggingKnob, loopStart, loopEnd, MAX_TIME, isPlaying]);

  const handleTimerMouseUp = useCallback(() => {
      if (draggingKnob === 'START') setLoopStart(prev => Math.round(prev));
      else if (draggingKnob === 'END') setLoopEnd(prev => Math.round(prev));
      setDraggingKnob(null);
  }, [draggingKnob]);

  useEffect(() => {
      if (draggingKnob) {
          window.addEventListener('mousemove', handleTimerMouseMove);
          window.addEventListener('mouseup', handleTimerMouseUp);
          window.addEventListener('touchmove', handleTimerMouseMove, { passive: false });
          window.addEventListener('touchend', handleTimerMouseUp);
      }
      return () => {
          window.removeEventListener('mousemove', handleTimerMouseMove);
          window.removeEventListener('mouseup', handleTimerMouseUp);
          window.removeEventListener('touchmove', handleTimerMouseMove);
          window.removeEventListener('touchend', handleTimerMouseUp);
      };
  }, [draggingKnob, handleTimerMouseMove, handleTimerMouseUp]);

  const stepTime = (delta: number) => {
      if (isPlaying) setIsPlaying(false);
      setTime(prev => {
          let next = prev + delta;
          if (next >= MAX_TIME) next = 0;
          if (next < 0) next = MAX_TIME - 0.1;
          return Number(next.toFixed(1));
      });
  };

  // --- Render Helpers ---

  const renderTutorialContent = () => {
      if (levelId === 'root') {
          // ... (Existing Root Text)
           switch (tutorialStep) {
              case 0: return (<>Welcome to the Computation Simulation Interface. Displayed below is the fundamental unit of information: a "bit".</>);
              case 1: return (<>A classical "bit" is either 0 or 1. The bit is initialized to state |0> at the time t=0.0 which is represented by the blue ball appearing in the blue node.</>);
              case 2: return (<>To learn more, click on words that appear in red and the archive will appear. Try it out now: click on <span className="text-red-500 font-bold cursor-pointer hover:underline" onClick={() => { setActiveArchiveId('006'); setHasClickedBitArchive(true); }}>bit</span>. You do not need to do this to learn how to play the game.</>);
              case 3: return "The circular timer below tracks the passage of time. We haven't given any instructions to the bit yet, so the blue ball stays at |0> even as time moves.";
              case 4: return "You can traverse the timeline manually. Use the arrow buttons inside the timer or click and drag the orange ball to advance the clock to t=2.0, then press play.";
              case 5: return "Let's test further. Pause the simulation, use the arrow buttons to set the time to t=1.0, and press play to resume.";
              case 6: return "You can create custom loops to focus on specific timeframes. Click the repeat button to enable loop mode. Then, drag the green start handle to t=1.0 and the red end handle to t=2.0. Note: Custom time loops only snap to integer time steps.";
              case 7: return "Now locate the mode switch at the bottom of the interface and toggle it to 'SANDBOX' mode now.";
              case 8: return "In sandbox mode, you can alter the initial state at the beginning of any loop. First, press the reset button. Then, drag the ball from the |0> state to the |1> state, and press play.";
              case 9: return "The ability to change the state of the system is a feature of \"SANDBOX MODE.\" When solving a puzzle, the starting state of the system will be fixed.";
              case 10: return "Finally, you can change the speed of the simulation to the amounts 0.25x, 0.5x, 1x, 2x, and 4x. Try this out now.";
              case 11: return "To access quantum gates, open the operations sidebar by clicking the icon in the top left corner.";
              case 12: return "Let's apply what we've learned. Switch the mode back to 'PUZZLE' to start the challenge. This will reset and lock the initial state to |0>.";
              case 13: return "The goal is to reach the state |1>. Drag the 'NOT' gate (X) from the sidebar into any empty slot on the timeline.";
              case 14: return "Press play to run the circuit. Observe how the NOT gate inverts the state from |0> to |1>. The level will complete automatically upon success.";
              default: return "Simulation Running.";
          }
      } else if (levelId === 'q1') {
          switch (tutorialStep) {
              case 0: return (<>Welcome to Quantum Logic. While classical bits are strictly 0 or 1, quantum bits (qubits) are described by an arrow (<span className="text-red-500 font-bold cursor-pointer hover:underline" onClick={() => setActiveArchiveId('010')}>state vector</span>).</>);
              case 1: return (<>The arrow is currently in the |0> node. Its direction represents the <span className="text-red-500 font-bold cursor-pointer hover:underline" onClick={() => setActiveArchiveId('008')}>Phase</span> (Up = 0). Its length represents the <span className="text-red-500 font-bold cursor-pointer hover:underline" onClick={() => setActiveArchiveId('009')}>Amplitude</span>.</>);
              case 2: return (<>We want to move the amplitude from the |0> node to the |1> node. Open the sidebar to access your tools. Locate the <span className="text-red-500 font-bold cursor-pointer hover:underline" onClick={() => setActiveArchiveId('007')}>Pauli-X</span> (P-X) gate and drag it onto the timeline.</>);
              case 3: return "Press play. The Pauli-X gate will move the arrow from the |0> node to the |1> node. Note that the direction of the arrow (Phase) stays Up (0).";
              case 4: return "Excellent. The circuit has been reset and the arrow is now initialized in the |1> state. Your goal is to return it to the |0> state using the Pauli-X gate again.";
              case 5: return "New challenge: We can also manipulate Phase. Your goal is to reach -|1> (State |1>, Phase 180°). This is represented by the arrow at |1> pointing DOWN.";
              case 6: return "The P-Z Gate (Phase Gate) flips the phase of the |1> state. It does nothing to |0>. Use it to achieve the target.";
              case 7: return "Challenge: Reach -|0> (State |0>, Phase 180°). This is represented by the arrow at |0> pointing DOWN.";
              case 8: return "Introducing the S-Gate. This gate rotates the phase by 90° (Quarter Turn). Target: i|1> (State |1>, Phase 90° / Right).";
              case 9: return "Challenge: i|0> (State |0>, Phase 90° / Right).";
              case 10: return "Introducing the P-Y Gate (Pauli-Y). It maps |0> to i|1> and |1> to -i|0>. This puzzle starts at -|1> (Down). Your goal is i|0> (Right).";
              case 11: return "Final Challenge: Reach -i|0> (State |0>, Phase 270° / Left).";
              default: return "Quantum Simulation Running.";
          }
      }
      return "Level Loaded.";
  };

  const renderVisualization = () => {
      const isShowingTarget = showTargetPreview;
      
      let visualState = { basis: 0, phase: 0 };
      let nodeState = { basis: 0 };
      
      if (isShowingTarget) {
          visualState = { 
              basis: levelObjectiveState.basis, 
              phase: levelObjectiveState.phase 
          };
          nodeState = { basis: levelObjectiveState.basis };
      } else {
          visualState = getVisualState(time); // { basis: 0.0-1.0, phase: float }
          nodeState = { basis: systemState.basis };
      }
      
      const INNER_RING_INSET = '18.75px'; 
      const currentStep = Math.floor(time);
      const activeGateId = currentStep > 0 && currentStep < circuit.length ? circuit[currentStep] : null;
      const isZGateActive = !isShowingTarget && activeGateId === 'Z';
      const isXGateActive = !isShowingTarget && activeGateId === 'X';
      const isSGateActive = !isShowingTarget && activeGateId === 'S';
      const isYGateActive = !isShowingTarget && activeGateId === 'Y';

      return (
        <div className="relative w-[600px] h-64 shrink-0 scale-[0.6] md:scale-100 transition-transform origin-center">
            
            {/* The Track */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-16 border-t border-b border-white/10 flex items-center justify-center">
                 <div className={`absolute inset-0 flex items-center justify-center gap-8 transition-opacity duration-300 ${
                     ((isXGateActive || isYGateActive) && time < MAX_TIME) ? 'opacity-100' : 'opacity-0'
                 }`}>
                    {/* Visual indicators for swap activity */}
                    <div className="flex text-quantum-cyan animate-pulse"><ArrowRight size={24} /><ArrowRight size={24} /><ArrowRight size={24} /></div>
                    <div className="flex text-quantum-cyan animate-pulse"><ArrowLeftIcon size={24} /><ArrowLeftIcon size={24} /><ArrowLeftIcon size={24} /></div>
                 </div>
            </div>

            {/* Node 0 (Left) */}
            <div className="absolute top-1/2 left-1/2 w-32 h-32 flex items-center justify-center z-10" style={{ transform: 'translate(calc(-50% - 150px), -50%)' }}>
                <div className={`absolute inset-0 rounded-full border-2 transition-all duration-500 ${nodeState.basis === 0 ? 'border-quantum-cyan bg-[#050510] shadow-[0_0_40px_rgba(76,201,240,0.4)]' : 'border-gray-800 bg-[#050510]/50'}`} />
                <div 
                    className={`absolute rounded-full border transition-colors duration-500 ${nodeState.basis === 0 ? 'border-quantum-cyan/50' : 'border-gray-800'}`} 
                    style={{ inset: INNER_RING_INSET }}
                />
            </div>
            <div className="absolute top-1/2 left-1/2 w-32 flex justify-center" style={{ transform: 'translate(calc(-50% - 150px), 80px)' }}>
                 <div className={`px-4 py-1 rounded border-2 font-orbitron text-xl font-bold tracking-widest transition-all duration-500 ${nodeState.basis === 0 ? 'bg-quantum-cyan/10 border-quantum-cyan text-quantum-cyan shadow-[0_0_15px_rgba(76,201,240,0.2)]' : 'bg-transparent border-transparent text-gray-700'}`}>|0⟩</div>
            </div>

            {/* Node 1 (Right) */}
            <div className="absolute top-1/2 left-1/2 w-32 h-32 flex items-center justify-center z-10" style={{ transform: 'translate(calc(-50% + 150px), -50%)' }}>
                <div className={`absolute inset-0 rounded-full border-2 transition-all duration-500 ${nodeState.basis === 1 ? 'border-quantum-cyan bg-[#050510] shadow-[0_0_40px_rgba(76,201,240,0.4)]' : 'border-gray-800 bg-[#050510]/50'}`} />
                <div 
                    className={`absolute rounded-full border transition-colors duration-500 ${nodeState.basis === 1 ? 'border-quantum-cyan/50' : 'border-gray-800'}`} 
                    style={{ inset: INNER_RING_INSET }}
                />

                {/* Z/S Gate Phase Rotation Effect */}
                <div className={`absolute -inset-2 pointer-events-none transition-opacity duration-300 ${isZGateActive || isSGateActive ? 'opacity-100' : 'opacity-0'}`}>
                    <div className={`w-full h-full text-quantum-magenta ${isZGateActive ? 'animate-[spin_3s_linear_infinite]' : 'animate-[spin_6s_linear_infinite]'}`}>
                        <svg viewBox="0 0 100 100" className="w-full h-full fill-current">
                            <path d="M 12 50 A 38 38 0 0 1 88 50" fill="none" stroke="currentColor" strokeWidth="3" className="opacity-60" />
                            <path d="M 88 50 L 78 44 L 78 56 Z" transform="rotate(-15, 88, 50)" />
                            <path d="M 88 50 A 38 38 0 0 1 12 50" fill="none" stroke="currentColor" strokeWidth="3" className="opacity-60" />
                            <path d="M 12 50 L 22 56 L 22 44 Z" transform="rotate(-15, 12, 50)" />
                        </svg>
                    </div>
                </div>

            </div>
            <div className="absolute top-1/2 left-1/2 w-32 flex justify-center" style={{ transform: 'translate(calc(-50% + 150px), 80px)' }}>
                <div className={`px-4 py-1 rounded border-2 font-orbitron text-xl font-bold tracking-widest transition-all duration-500 ${nodeState.basis === 1 ? 'bg-quantum-cyan/10 border-quantum-cyan text-quantum-cyan shadow-[0_0_15px_rgba(76,201,240,0.2)]' : 'bg-transparent border-transparent text-gray-700'}`}>|1⟩</div>
            </div>

            {/* Entity (Ball/Arrow) */}
            <div 
                onMouseDown={handleBallMouseDown}
                onTouchStart={handleBallMouseDown}
                className={`absolute top-1/2 left-1/2 w-12 h-12 z-20 flex items-center justify-center ${gameMode === 'SANDBOX' && !isShowingTarget ? (isDraggingBall ? 'cursor-grabbing' : 'cursor-grab') : 'pointer-events-none'}`}
                style={{
                    transform: `translate(calc(-50% + ${(visualState.basis - 0.5) * 300}px + ${dragOffset}px), -50%)`,
                    transition: isDraggingBall ? 'none' : 'none' 
                }}
             >
                {isQuantumLevel ? (
                    // --- QUANTUM ARROW ---
                    <div className="relative w-12 h-12 flex items-center justify-center">
                        <div 
                            className="absolute bottom-1/2 left-1/2 -translate-x-1/2 h-[64px] w-[24px] origin-bottom transform will-change-transform"
                            style={{
                                transform: `translateX(-50%) rotate(${visualState.phase * 90}deg)` // Rotates 90 deg per unit
                            }}
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
                    </div>
                ) : (
                    // --- CLASSICAL BALL ---
                    <>
                        <div className="absolute inset-0 bg-quantum-cyan blur-md opacity-60 animate-pulse-glow" />
                        <div className="relative w-full h-full rounded-full bg-white shadow-[0_0_20px_rgba(76,201,240,0.8)] overflow-hidden">
                             <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,_#ffffff_0%,_#4cc9f0_100%)]" />
                        </div>
                    </>
                )}
             </div>
             
             {isShowingTarget && (
                 <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-quantum-magenta/20 border border-quantum-magenta text-quantum-magenta px-4 py-1 rounded-full font-bold font-orbitron animate-pulse">
                     TARGET PREVIEW
                 </div>
             )}
        </div>
      );
  };


  // Helper for Circular Timer calculations
  const radius = 60;
  const center = 80;
  const strokeWidth = 6;
  const getCoordinates = (t: number, r: number = radius) => {
      const angle = (t / MAX_TIME) * 360;
      const angleRad = (angle - 90) * (Math.PI / 180);
      return {
          x: center + r * Math.cos(angleRad),
          y: center + r * Math.sin(angleRad)
      };
  };

  const ballPos = getCoordinates(time);
  const loopStartPos = getCoordinates(loopStart, radius);
  const loopEndPos = getCoordinates(loopEnd, radius);
  const loopStartTextPos = getCoordinates(loopStart, radius + 18);
  const loopEndTextPos = getCoordinates(loopEnd, radius + 18);

  let displayTime = time.toFixed(1);
  if (parseFloat(displayTime) >= MAX_TIME) displayTime = "0.0";
  
  let availableOperators = OPERATORS;
  if (levelId === 'q1' && gameMode === 'PUZZLE') {
      if (puzzlePhase <= 1) {
          availableOperators = OPERATORS.filter(op => op.id === 'X');
      } else if (puzzlePhase <= 3) {
          availableOperators = OPERATORS.filter(op => ['X', 'Z'].includes(op.id));
      } else if (puzzlePhase <= 5) {
          availableOperators = OPERATORS.filter(op => ['X', 'Z', 'S'].includes(op.id));
      } else {
          availableOperators = OPERATORS;
      }
  }

  return (
    <div className="absolute inset-0 z-30 flex flex-col bg-black/90 backdrop-blur-md animate-in fade-in zoom-in-95 duration-500 select-none overflow-hidden text-gray-200">
      
      {activeArchiveId && (
        <div className="absolute inset-0 z-50">
            <ArchivesScreen 
                onReturn={() => setActiveArchiveId(null)} 
                initialId={activeArchiveId}
                backLabel="Return to Simulation"
            />
        </div>
      )}

      {/* Header */}
      <div className="h-16 border-b border-white/10 flex items-center justify-center md:justify-between px-6 bg-[#050510]/80 backdrop-blur-sm z-40 relative">
        <div className="flex items-center gap-4">
            <button onClick={onExit} className="p-2 rounded-full hover:bg-white/10 text-quantum-cyan transition-colors">
                <ArrowLeft size={20} />
            </button>
            <div className="hidden md:block">
                <h2 className="font-orbitron text-lg text-white tracking-widest uppercase">
                    {(isTutorialLevel || isQuantumLevel) ? "Training Module" : "Simulation"}
                </h2>
                <div className="text-[10px] font-mono text-quantum-cyan/60">ID: {levelId.toUpperCase()} // PHASE {puzzlePhase + 1}</div>
            </div>
        </div>
        
        <div className="flex items-center gap-6">
            <button
                onMouseDown={() => setShowTargetPreview(true)}
                onMouseUp={() => setShowTargetPreview(false)}
                onMouseLeave={() => setShowTargetPreview(false)}
                onTouchStart={() => setShowTargetPreview(true)}
                onTouchEnd={() => setShowTargetPreview(false)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all duration-300 font-orbitron text-sm tracking-wider
                    ${showTargetPreview 
                        ? 'bg-quantum-magenta/20 border-quantum-magenta text-quantum-magenta shadow-[0_0_15px_rgba(247,37,133,0.3)] scale-105' 
                        : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10 hover:border-white/20'
                    }
                `}
            >
                <Eye size={18} />
                <span className="hidden sm:inline">HOLD TO VIEW GOAL</span>
                <span className="sm:hidden">GOAL</span>
            </button>
            
            <button className="hidden md:block p-2 text-gray-400 hover:text-white transition-colors">
                <Settings size={18} />
            </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 relative flex">
        
        {/* Sidebar */}
        <div className={`absolute top-0 bottom-0 left-0 w-80 bg-[#0a0a15]/95 border-r border-quantum-cyan/20 backdrop-blur-xl z-30 transition-transform duration-300 ease-out flex flex-col ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <div className="p-6 border-b border-white/10">
                <h3 className="font-orbitron text-xs tracking-widest text-quantum-cyan mb-4 flex items-center gap-2">
                    <LayoutGrid size={14} /> OPERATORS
                </h3>
                <div className="grid grid-cols-2 gap-3">
                    {availableOperators.map(op => (
                        <div 
                            key={op.id}
                            draggable
                            onDragStart={(e) => handleGateDragStart(e, op.id)}
                            className="aspect-square bg-white/5 border border-white/10 rounded hover:border-quantum-cyan hover:bg-white/10 cursor-grab active:cursor-grabbing flex flex-col items-center justify-start pt-3 gap-2 group relative transition-all"
                        >
                            <span className="text-xs font-orbitron font-bold text-gray-300 pointer-events-none">
                                {/* Always show label now, since Z and S icons no longer contain text */}
                                {((isQuantumLevel && op.id === 'X') ? 'P-X' : op.name)}
                            </span>
                            <div className="scale-150">
                                {/* THIS IS WHERE THE COLOR IS APPLIED */}
                                <op.icon className={op.color} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex-1 p-6 flex flex-col overflow-hidden">
                <h3 className="font-orbitron text-xs tracking-widest text-quantum-magenta mb-4 flex items-center gap-2">
                    <SidebarIcon size={14} className="rotate-90" /> CIRCUIT TIMELINE
                </h3>
                <div className="flex flex-col gap-3 overflow-y-auto custom-scrollbar content-start pr-1 items-center">
                    {circuit.map((opId, index) => {
                        if (index === 0) return null; // Hide t=0 block

                        const timeLabel = index.toFixed(1);
                        const isPast = time >= index + 1;
                        const isActive = time >= index && time < index + 1;
                        const opConfig = opId ? OPERATORS.find(o => o.id === opId) : null;
                        const isLocked = false; 

                        return (
                            <div 
                                key={index}
                                onDrop={(e) => !isLocked && handleCircuitDrop(e, index)}
                                onDragOver={(e) => !isLocked && handleDragOver(e)}
                                className={`w-32 h-32 shrink-0 rounded border flex flex-col items-center justify-center relative transition-colors
                                    ${isActive 
                                            ? 'bg-white/10 border-white/50 shadow-[0_0_15px_rgba(255,255,255,0.1)]' 
                                            : isPast
                                                ? 'border-gray-800 text-gray-600 opacity-60' 
                                                : 'border-white/10 hover:border-white/20 hover:bg-white/5 border-dashed'
                                    }
                                    ${opId && !isLocked ? 'border-solid bg-white/5' : ''}
                                `}
                            >
                                <div className={`absolute top-2 left-2 font-mono text-xs ${isActive ? 'text-white' : 'text-gray-600'}`}>
                                    {timeLabel}
                                </div>

                                <div className="flex-1 flex items-center justify-center w-full">
                                    {opId && opConfig ? (
                                        <div 
                                            draggable
                                            onDragStart={(e) => handleGateDragStart(e, opId, index)}
                                            onContextMenu={(e) => {
                                                e.preventDefault();
                                                removeGate(index);
                                            }}
                                            className="flex flex-col items-center justify-center gap-2 w-full relative group/item cursor-grab active:cursor-grabbing"
                                        >
                                            <div className="scale-150 pointer-events-none">
                                                <opConfig.icon className={`${opConfig.color}`} />
                                            </div>
                                            <span className="font-orbitron text-xs text-gray-300 mt-2 pointer-events-none">
                                                {/* Always show label */}
                                                {((isQuantumLevel && opId === 'X') ? 'P-X' : opConfig.name)}
                                            </span>
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); removeGate(index); }} 
                                                className="absolute -top-6 -right-2 text-gray-500 hover:text-red-400 opacity-0 group-hover/item:opacity-100 transition-opacity p-2"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    ) : (
                                        <span className="text-[10px] text-gray-700 font-mono tracking-widest">EMPTY</span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
            
            <button onClick={() => setIsSidebarOpen(false)} className="absolute right-4 bottom-4 p-2 text-gray-500 hover:text-white">
                <ChevronLeft size={20} />
            </button>
        </div>

        {!isSidebarOpen && (
             <button onClick={() => setIsSidebarOpen(true)} className="absolute top-4 left-4 z-20 bg-black/50 border border-white/20 p-2 rounded hover:bg-quantum-cyan/20 transition-colors">
                <SidebarIcon size={20} />
            </button>
        )}

        {/* Stage */}
        <div className={`flex-1 relative flex flex-col items-center justify-center transition-all duration-300 ${isSidebarOpen ? 'ml-80' : ''}`}>
             
             {(isTutorialLevel || isQuantumLevel) && (
                <div className="absolute top-8 left-1/2 -translate-x-1/2 w-full max-w-lg z-20">
                    <div className="bg-black/80 border border-quantum-cyan/30 p-4 rounded-xl backdrop-blur-md shadow-lg flex flex-col gap-3">
                         <div className="flex items-start gap-3">
                             <div className="p-2 bg-quantum-cyan/10 rounded-lg text-quantum-cyan">
                                 <MessageSquare size={18} />
                             </div>
                             <div>
                                 <h4 className="font-orbitron text-xs text-quantum-cyan tracking-widest mb-1">INSTRUCTOR</h4>
                                 <div className="text-sm text-gray-300 font-rajdhani leading-relaxed">
                                    {renderTutorialContent()}
                                 </div>
                             </div>
                         </div>
                         <div className="flex justify-end gap-2 border-t border-white/5 pt-2">
                             <button onClick={() => setTutorialStep(Math.max(0, tutorialStep - 1))} className="px-3 py-1 text-xs font-orbitron text-gray-500 hover:text-white">PREV</button>
                             <button 
                                onClick={() => setTutorialStep(prev => prev + 1)} 
                                disabled={!tutorialStepCompleted}
                                className={`px-4 py-1 text-xs font-orbitron bg-quantum-cyan/10 border border-quantum-cyan/30 text-quantum-cyan rounded hover:bg-quantum-cyan hover:text-black transition-colors ${!tutorialStepCompleted ? 'opacity-50 cursor-not-allowed' : ''}`}
                             >
                                {((levelId === 'root' && tutorialStep === 14) || (levelId === 'q1' && tutorialStep === 11)) ? 'FINISH' : 'NEXT'}
                             </button>
                         </div>
                    </div>
                </div>
             )}

             <div className="relative w-full max-w-3xl flex items-center justify-center h-96 select-none perspective-1000 overflow-hidden">
                {renderVisualization()}
             </div>

             {/* Timer Controls */}
             <div className="absolute bottom-4 left-0 right-0 flex flex-col items-center justify-center pointer-events-none z-50">
                 <div className="relative bg-[#050510]/80 backdrop-blur-lg border border-white/10 rounded-full p-4 pointer-events-auto shadow-2xl">
                     
                     <div className="flex items-center gap-8">
                         
                         <div className="flex flex-col gap-2 items-center justify-center h-full">
                             <div className="flex flex-col gap-2">
                                <button onClick={() => { 
                                    setIsCustomLoop(false);
                                    setTime(0); 
                                    setIsPlaying(false); 
                                }} className="p-3 hover:bg-white/10 rounded-full text-white transition-colors border border-white/5 bg-black/40">
                                    <RotateCcw size={20} />
                                </button>
                                <button onClick={() => setIsCustomLoop(!isCustomLoop)} className={`p-3 rounded-full transition-colors border border-white/5 ${isCustomLoop ? 'bg-quantum-magenta text-white' : 'bg-black/40 text-gray-500 hover:text-white'}`}>
                                    <Repeat size={20} />
                                </button>
                             </div>
                         </div>

                         <div className="relative w-40 h-40">
                             <svg width="160" height="160" viewBox="0 0 160 160" ref={timerRef} className="cursor-crosshair">
                                 <circle cx={center} cy={center} r={radius} fill="none" stroke="#1f2937" strokeWidth={strokeWidth} />
                                 
                                 {isCustomLoop && (
                                     <>
                                        <path 
                                            d={`
                                                M ${loopStartPos.x} ${loopStartPos.y}
                                                A ${radius} ${radius} 0 ${loopEnd - loopStart > MAX_TIME/2 ? 1 : 0} 1 ${loopEndPos.x} ${loopEndPos.y}
                                            `}
                                            fill="none" 
                                            stroke="#f0abfc" 
                                            strokeWidth={strokeWidth} 
                                            strokeLinecap="round"
                                            className="opacity-50"
                                        />
                                        <text x={loopStartTextPos.x} y={loopStartTextPos.y} fill="#22c55e" fontSize="18" fontWeight="bold" fontFamily="monospace" textAnchor="middle" dominantBaseline="middle" pointerEvents="none">{loopStart.toFixed(1)}</text>
                                        <text x={loopEndTextPos.x} y={loopEndTextPos.y} fill="#ef4444" fontSize="18" fontWeight="bold" fontFamily="monospace" textAnchor="middle" dominantBaseline="middle" pointerEvents="none">{loopEnd.toFixed(1)}</text>
                                     </>
                                 )}

                                 <g 
                                    transform={`translate(${ballPos.x}, ${ballPos.y})`}
                                    onMouseDown={(e) => handleTimerMouseDown(e, 'CURRENT')}
                                    onTouchStart={(e) => handleTimerMouseDown(e, 'CURRENT')}
                                    className="cursor-grab active:cursor-grabbing"
                                 >
                                    <circle r={8} fill="#facc15" className={`filter drop-shadow-[0_0_8px_rgba(250,204,21,0.8)] ${!isPlaying ? 'hover:scale-110 transition-transform' : ''}`} />
                                 </g>

                                 {isCustomLoop && (
                                     <>
                                        <g transform={`translate(${loopStartPos.x}, ${loopStartPos.y})`} className="cursor-pointer" onMouseDown={(e) => handleTimerMouseDown(e, 'START')} onTouchStart={(e) => handleTimerMouseDown(e, 'START')} >
                                            <circle r={8} fill="#22c55e" stroke="white" strokeWidth={2} className="hover:scale-125 transition-transform" />
                                        </g>
                                        <g transform={`translate(${loopEndPos.x}, ${loopEndPos.y})`} className="cursor-pointer" onMouseDown={(e) => handleTimerMouseDown(e, 'END')} onTouchStart={(e) => handleTimerMouseDown(e, 'END')} >
                                            <circle r={8} fill="#ef4444" stroke="white" strokeWidth={2} className="hover:scale-125 transition-transform" />
                                        </g>
                                     </>
                                 )}
                             </svg>

                             <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none translate-x-3 translate-y-2">
                                 <div className="flex items-center gap-2 pointer-events-auto">
                                     <button onClick={() => stepTime(-0.1)} className="p-1 hover:text-quantum-cyan transition-colors"><ChevronLeft size={16} /></button>
                                     <div className="font-orbitron text-2xl font-bold text-white w-16 text-center">
                                         {displayTime}
                                     </div>
                                     <button onClick={() => stepTime(0.1)} className="p-1 hover:text-quantum-cyan transition-colors"><ChevronRight size={16} /></button>
                                 </div>
                             </div>
                         </div>

                         <div className="flex flex-col gap-2 items-center">
                             <button onClick={handlePlayToggle} className={`p-4 rounded-full text-black transition-transform hover:scale-105 shadow-lg ${isPlaying ? 'bg-quantum-magenta' : 'bg-quantum-cyan'}`}>
                                {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
                             </button>
                             
                             <div className="flex items-center gap-1 bg-black/40 rounded-full border border-white/10 px-2 py-1">
                                <button onClick={() => { const idx = SPEEDS.indexOf(playbackSpeed); if (idx > 0) setPlaybackSpeed(SPEEDS[idx - 1]); }} disabled={playbackSpeed === SPEEDS[0]} className="p-1 text-gray-400 hover:text-white disabled:opacity-30 disabled:hover:text-gray-400 transition-colors">
                                    <ChevronLeft size={12} />
                                </button>
                                <span className="font-mono text-[10px] text-quantum-cyan w-8 text-center">{playbackSpeed}x</span>
                                <button onClick={() => { const idx = SPEEDS.indexOf(playbackSpeed); if (idx < SPEEDS.length - 1) setPlaybackSpeed(SPEEDS[idx + 1]); }} disabled={playbackSpeed === SPEEDS[SPEEDS.length - 1]} className="p-1 text-gray-400 hover:text-white disabled:opacity-30 disabled:hover:text-gray-400 transition-colors">
                                    <ChevronRight size={12} />
                                </button>
                            </div>
                         </div>

                     </div>
                 </div>
                 
                <button 
                    onClick={() => setGameMode(prev => prev === 'SANDBOX' ? 'PUZZLE' : 'SANDBOX')}
                    className={`pointer-events-auto mt-4 flex items-center gap-2 px-4 py-2 rounded border font-orbitron text-xs tracking-widest transition-all ${
                        gameMode === 'SANDBOX' 
                            ? 'bg-quantum-purple/20 border-quantum-purple text-white shadow-[0_0_15px_rgba(123,44,191,0.3)]' 
                            : 'bg-gray-900/80 border-gray-700 text-gray-400 hover:border-gray-500'
                    }`}
                >
                    {gameMode === 'SANDBOX' ? <Unlock size={14} /> : <Lock size={14} />}
                    CURRENT SYSTEM MODE: {gameMode}
                </button>
             </div>

        </div>
      </div>
      
      {showVictoryModal && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-[#0a0a15] border border-quantum-cyan p-8 rounded-xl shadow-[0_0_50px_rgba(76,201,240,0.3)] max-w-md w-full text-center">
                <h2 className="text-3xl font-orbitron font-bold text-white mb-2">
                    {isTutorialLevel ? "MODULE COMPLETE" : "SYSTEM STABILIZED"}
                </h2>
                <div className="h-1 w-24 bg-gradient-to-r from-transparent via-quantum-cyan to-transparent mx-auto mb-6" />
                <p className="text-gray-300 font-rajdhani mb-8 text-lg">
                    {isTutorialLevel 
                        ? "You have successfully calibrated the quantum bit. Neural link established." 
                        : "Target state achieved. Waveform collapsed successfully."}
                </p>
                <div className="flex gap-4 justify-center">
                    <button 
                        onClick={() => {
                            setShowVictoryModal(false);
                            setLevelCompleteTriggered(false);
                            setTime(0);
                        }}
                        className="px-6 py-3 rounded border border-gray-600 hover:border-white text-gray-300 hover:text-white font-orbitron transition-all"
                    >
                        <RotateCcw className="inline-block mr-2" size={18} />
                        Replay
                    </button>
                    <button 
                        onClick={onComplete}
                        className="px-6 py-3 rounded bg-quantum-cyan hover:bg-quantum-cyan/80 text-black font-bold font-orbitron shadow-[0_0_15px_rgba(76,201,240,0.4)] transition-all"
                    >
                        <CheckCircle className="inline-block mr-2" size={18} />
                        Finish
                    </button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};

export default GameLevelScreen;