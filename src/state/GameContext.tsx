import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export interface Settings {
  /** Unlocks every built level regardless of campaign progress. */
  developerMode: boolean;
  reduceMotion: boolean;
}

const DEFAULT_SETTINGS: Settings = {
  developerMode: false,
  reduceMotion: false,
};

const STORAGE_KEYS = {
  settings: 'computation-game:settings',
  progress: 'computation-game:completed-levels',
};

function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

function writeStorage(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage can be unavailable (private browsing, quota); progress just won't persist.
  }
}

interface GameContextValue {
  settings: Settings;
  updateSettings: (patch: Partial<Settings>) => void;
  completedLevels: string[];
  markLevelComplete: (levelId: string) => void;
  resetProgress: () => void;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => ({
    ...DEFAULT_SETTINGS,
    ...readStorage<Partial<Settings>>(STORAGE_KEYS.settings, {}),
  }));
  const [completedLevels, setCompletedLevels] = useState<string[]>(() => {
    const stored = readStorage<unknown>(STORAGE_KEYS.progress, []);
    return Array.isArray(stored) ? stored.filter((id): id is string => typeof id === 'string') : [];
  });

  useEffect(() => writeStorage(STORAGE_KEYS.settings, settings), [settings]);
  useEffect(() => writeStorage(STORAGE_KEYS.progress, completedLevels), [completedLevels]);

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setSettings(prev => ({ ...prev, ...patch }));
  }, []);

  const markLevelComplete = useCallback((levelId: string) => {
    setCompletedLevels(prev => (prev.includes(levelId) ? prev : [...prev, levelId]));
  }, []);

  const resetProgress = useCallback(() => setCompletedLevels([]), []);

  const value = useMemo(
    () => ({ settings, updateSettings, completedLevels, markLevelComplete, resetProgress }),
    [settings, updateSettings, completedLevels, markLevelComplete, resetProgress],
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used inside <GameProvider>');
  return ctx;
}
