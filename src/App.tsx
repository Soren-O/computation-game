import { useCallback, useState } from 'react';
import { GameState } from './types';
import LoadingScreen from './components/LoadingScreen';
import MainMenu from './components/MainMenu';
import QuantumBackground from './components/QuantumBackground';
import SettingsMenu from './components/SettingsMenu';
import ArchivesScreen from './components/ArchivesScreen';
import LevelSelectScreen from './components/LevelSelectScreen';
import GameLevelScreen from './components/GameLevelScreen';
import { SANDBOX_LEVEL_ID } from './game/levels';
import { useGame } from './state/GameContext';

const App = () => {
  const { settings } = useGame();
  const [gameState, setGameState] = useState<GameState>(GameState.LOADING);
  const [activeLevelId, setActiveLevelId] = useState<string | null>(null);

  const handleLoadingComplete = useCallback(() => setGameState(GameState.MENU), []);
  const prefersReducedMotion = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

  // There is no real "quit" in a browser tab, so quitting reboots the simulation.
  const navigate = useCallback((state: GameState) => {
    setGameState(state === GameState.QUIT ? GameState.LOADING : state);
  }, []);

  const handleStartLevel = useCallback((levelId: string) => {
    setActiveLevelId(levelId);
    setGameState(GameState.GAME_LEVEL);
  }, []);

  const handleExitLevel = useCallback(() => {
    setActiveLevelId(null);
    setGameState(GameState.CAMPAIGN);
  }, []);

  const returnToMenu = useCallback(() => setGameState(GameState.MENU), []);

  const renderContent = () => {
    switch (gameState) {
      case GameState.LOADING:
        return <LoadingScreen onComplete={handleLoadingComplete} />;
      case GameState.MENU:
        return <MainMenu onNavigate={navigate} />;
      case GameState.SETTINGS:
        return <SettingsMenu onReturn={returnToMenu} />;
      case GameState.ARCHIVES:
        return <ArchivesScreen onReturn={returnToMenu} />;
      case GameState.CAMPAIGN:
        return <LevelSelectScreen onReturn={returnToMenu} onStartLevel={handleStartLevel} />;
      case GameState.GAME_LEVEL:
        return activeLevelId ? (
          <GameLevelScreen key={activeLevelId} levelId={activeLevelId} onExit={handleExitLevel} />
        ) : null;
      case GameState.SANDBOX:
        return <GameLevelScreen key={SANDBOX_LEVEL_ID} levelId={SANDBOX_LEVEL_ID} onExit={returnToMenu} />;
      default:
        return null;
    }
  };

  return (
    <div
      className={`relative w-full h-dvh bg-quantum-dark overflow-hidden selection:bg-quantum-cyan selection:text-black ${
        settings.reduceMotion ? 'reduce-motion' : ''
      }`}
    >
      <QuantumBackground animate={!settings.reduceMotion && !prefersReducedMotion && gameState !== GameState.GAME_LEVEL && gameState !== GameState.SANDBOX} />

      <main className="relative w-full h-full flex flex-col">{renderContent()}</main>

      {/* Global vignette */}
      <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_100px_rgba(0,0,0,0.8)] z-40" />
    </div>
  );
};

export default App;
