import React, { useEffect, useState } from 'react';
import { Atom } from 'lucide-react';

interface LoadingScreenProps {
  onComplete: () => void;
}

const PHASES = [
  "Initializing Qubits...",
  "Cooling System to Absolute Zero...",
  "Entangling States...",
  "Calibrating Superposition...",
  "Establishing Uplink...",
  "Ready."
];

const LoadingScreen: React.FC<LoadingScreenProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [phaseIndex, setPhaseIndex] = useState(0);

  useEffect(() => {
    // Simulate loading process
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(onComplete, 500); // Short delay before unmounting
          return 100;
        }
        
        // Dynamic speed for realism
        const jump = Math.random() * 15;
        return Math.min(prev + jump, 100);
      });
    }, 400);

    return () => clearInterval(interval);
  }, [onComplete]);

  useEffect(() => {
    // Update text based on progress chunks
    const newPhase = Math.floor((progress / 100) * (PHASES.length - 1));
    setPhaseIndex(Math.min(newPhase, PHASES.length - 1));
  }, [progress]);

  return (
    <div className="flex flex-col items-center justify-center h-full w-full z-50 relative text-white">
      
      {/* Spinning Atom Icon */}
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-quantum-cyan/30 blur-xl rounded-full animate-pulse" />
        <Atom size={80} className="text-quantum-cyan animate-spin-slow relative z-10" />
      </div>

      {/* Title */}
      <h1 className="text-4xl font-orbitron font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-quantum-cyan to-quantum-magenta mb-8 animate-pulse">
        QUANTUM ODYSSEY
      </h1>

      {/* Progress Bar Container */}
      <div className="w-64 md:w-96 h-2 bg-gray-900 rounded-full overflow-hidden border border-gray-700 relative">
        <div 
          className="h-full bg-gradient-to-r from-quantum-purple via-quantum-magenta to-quantum-cyan transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
        {/* Scanline effect on bar */}
        <div className="absolute inset-0 bg-white/10 w-full h-full animate-pulse" />
      </div>

      {/* Status Text */}
      <div className="mt-4 h-6 text-quantum-cyan font-rajdhani tracking-wider text-lg">
        <span className="mr-2">[{Math.floor(progress)}%]</span>
        {PHASES[phaseIndex]}
      </div>

    </div>
  );
};

export default LoadingScreen;