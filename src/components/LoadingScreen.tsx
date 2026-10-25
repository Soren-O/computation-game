import { useEffect, useState } from 'react';
import { Atom } from 'lucide-react';

interface LoadingScreenProps {
  onComplete: () => void;
}

const PHASES = [
  'Initializing Qubits...',
  'Cooling System to Absolute Zero...',
  'Entangling States...',
  'Calibrating Superposition...',
  'Establishing Uplink...',
  'Ready.',
];

const LoadingScreen = ({ onComplete }: LoadingScreenProps) => {
  const [progress, setProgress] = useState(0);
  const done = progress >= 100;

  useEffect(() => {
    if (done) return;
    // Random jumps make the boot sequence feel less mechanical.
    const interval = setInterval(() => setProgress(prev => Math.min(prev + Math.random() * 15, 100)), 400);
    return () => clearInterval(interval);
  }, [done]);

  useEffect(() => {
    if (!done) return;
    const timeout = setTimeout(onComplete, 500);
    return () => clearTimeout(timeout);
  }, [done, onComplete]);

  // Any key or click skips the boot sequence.
  useEffect(() => {
    window.addEventListener('keydown', onComplete);
    window.addEventListener('pointerdown', onComplete);
    return () => {
      window.removeEventListener('keydown', onComplete);
      window.removeEventListener('pointerdown', onComplete);
    };
  }, [onComplete]);

  const phaseIndex = Math.min(Math.floor((progress / 100) * (PHASES.length - 1)), PHASES.length - 1);

  return (
    <div className="flex flex-col items-center justify-center h-full w-full z-50 relative text-white px-4">
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-quantum-cyan/30 blur-xl rounded-full animate-pulse" />
        <Atom size={80} className="text-quantum-cyan animate-spin-slow relative z-10" />
      </div>

      <h1 className="text-3xl md:text-4xl text-center font-orbitron font-bold tracking-widest text-transparent bg-clip-text bg-linear-to-r from-quantum-cyan to-quantum-magenta mb-8 animate-pulse">
        QUANTUM ODYSSEY
      </h1>

      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.floor(progress)}
        className="w-64 md:w-96 h-2 bg-gray-900 rounded-full overflow-hidden border border-gray-700 relative"
      >
        <div
          className="h-full bg-linear-to-r from-quantum-purple via-quantum-magenta to-quantum-cyan transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
        <div className="absolute inset-0 bg-white/10 w-full h-full animate-pulse" />
      </div>

      <div className="mt-4 h-6 text-quantum-cyan font-rajdhani tracking-wider text-lg">
        <span className="mr-2">[{Math.floor(progress)}%]</span>
        {PHASES[phaseIndex]}
      </div>

      <div className="absolute bottom-8 text-xs font-rajdhani tracking-[0.3em] uppercase text-gray-600">Press any key to skip</div>
    </div>
  );
};

export default LoadingScreen;
