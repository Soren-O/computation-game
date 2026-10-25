import React, { useState, useCallback } from 'react';
import { GameState } from './types';
import LoadingScreen from './components/LoadingScreen';
import MainMenu from './components/MainMenu';
import QuantumBackground from './components/QuantumBackground';
import SettingsMenu from './components/SettingsMenu';
import ArchivesScreen from './components/ArchivesScreen';
import LevelSelectScreen from './components/LevelSelectScreen';
import GameLevelScreen from './components/GameLevelScreen';
import { Construction, RotateCcw } from 'lucide-react';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.LOADING);
  const [activeLevelId, setActiveLevelId] = useState<string | null>(null);
  const [completedLevels, setCompletedLevels] = useState<string[]>([]);

  const handleLoadingComplete = useCallback(() => {
    setGameState(GameState.MENU);
  }, []);

  const navigate = useCallback((state: GameState) => {
    if (state === GameState.QUIT) {
        // Simulate quit by resetting to loading
        alert("Shutting down quantum simulation...");
        setGameState(GameState.LOADING);
        return;
    }
    setGameState(state);
  }, []);

  const handleStartLevel = useCallback((levelId: string) => {
    setActiveLevelId(levelId);
    setGameState(GameState.GAME_LEVEL);
  }, []);

  const handleExitLevel = useCallback(() => {
    setActiveLevelId(null);
    setGameState(GameState.CAMPAIGN);
  }, []);

  const handleLevelComplete = useCallback((levelId: string) => {
    setCompletedLevels(prev => {
        // Add levelId if not already present
        if (prev.includes(levelId)) return prev;
        return [...prev, levelId];
    });
    setActiveLevelId(null);
    setGameState(GameState.CAMPAIGN);
  }, []);

  const renderContent = () => {
    switch (gameState) {
      case GameState.LOADING:
        return <LoadingScreen onComplete={handleLoadingComplete} />;
      
      case GameState.MENU:
        return (
          <>
            <MainMenu onNavigate={navigate} />
          </>
        );

      case GameState.SETTINGS:
        return <SettingsMenu onReturn={() => setGameState(GameState.MENU)} />;

      case GameState.ARCHIVES:
        return <ArchivesScreen onReturn={() => setGameState(GameState.MENU)} />;

      case GameState.CAMPAIGN:
        return (
            <LevelSelectScreen 
                onReturn={() => setGameState(GameState.MENU)} 
                onStartLevel={handleStartLevel} 
                completedLevels={completedLevels}
            />
        );

      case GameState.GAME_LEVEL:
        return (
            <GameLevelScreen 
                levelId={activeLevelId || "root"} 
                onExit={handleExitLevel} 
                onComplete={() => handleLevelComplete(activeLevelId || "root")}
            />
        );

      case GameState.SANDBOX:
        return (
          <div className="z-10 flex flex-col items-center justify-center h-full w-full text-white bg-black/60 backdrop-blur-sm animate-in zoom-in-95 duration-300">
            <Construction size={64} className="text-quantum-magenta mb-4 animate-bounce" />
            <h2 className="text-4xl font-orbitron mb-4">
                {gameState === GameState.SANDBOX && "SANDBOX MODE"}
            </h2>
            <p className="text-quantum-cyan font-rajdhani text-xl mb-8">Module currently under construction.</p>
            <button 
                onClick={() => setGameState(GameState.MENU)}
                className="flex items-center gap-2 px-6 py-3 bg-quantum-purple hover:bg-quantum-purple/80 transition-colors rounded border border-white/20 font-bold"
            >
                <RotateCcw size={20} />
                Return to Menu
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="relative w-full h-screen bg-quantum-dark overflow-hidden selection:bg-quantum-cyan selection:text-black">
      <QuantumBackground />
      
      {/* Main Content Container */}
      <main className="relative w-full h-full flex flex-col">
        {renderContent()}
      </main>

      {/* Global Overlay / Vignette */}
      <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_100px_rgba(0,0,0,0.8)] z-40" />
    </div>
  );
};

export default App;