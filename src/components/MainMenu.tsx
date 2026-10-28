import type { ReactNode } from 'react';
import { GameState } from '../types';
import { APP_VERSION } from '../config';
import { Play, Box, Settings, LogOut, Database, Activity } from 'lucide-react';

interface MainMenuProps {
  onNavigate: (state: GameState) => void;
}

const MenuButton = ({ label, icon, onClick, variant = 'primary' }: {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
}) => {
  
  const baseStyles = "group relative w-full md:w-80 h-14 flex items-center px-6 mb-4 [@media(max-height:720px)]:mb-2 [@media(max-height:720px)]:h-12 border-l-4 transition-all duration-300 ease-out hover:translate-x-2 overflow-hidden";
  
  const variants = {
    primary: "border-quantum-cyan bg-linear-to-r from-quantum-cyan/10 to-transparent hover:from-quantum-cyan/20 hover:border-l-8 text-white hover:text-quantum-cyan",
    secondary: "border-quantum-purple bg-linear-to-r from-quantum-purple/10 to-transparent hover:from-quantum-purple/20 hover:border-l-8 text-gray-300 hover:text-quantum-purple",
    danger: "border-red-500/50 bg-linear-to-r from-red-500/5 to-transparent hover:from-red-500/10 hover:border-l-8 text-gray-400 hover:text-red-400",
  };

  return (
    <button onClick={onClick} className={`${baseStyles} ${variants[variant]}`}>
      <span className="mr-4 transition-transform duration-300 group-hover:scale-110">{icon}</span>
      <span className="font-orbitron text-lg tracking-wider uppercase">{label}</span>
      
      {/* Hover Glow Effect */}
      <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </button>
  );
};

const MainMenu = ({ onNavigate }: MainMenuProps) => {
  return (
    <div className="flex flex-col items-start justify-center h-full w-full overflow-y-auto p-8 md:pl-24 z-10 relative animate-in fade-in duration-700 slide-in-from-left-10 [@media(max-height:720px)]:py-4">
      
      {/* Logo Area */}
      <div className="mb-12 [@media(max-height:720px)]:mb-5">
        <div className="flex items-center gap-3 mb-2">
          <Activity className="text-quantum-magenta" size={32} />
          <span className="text-quantum-cyan text-sm tracking-[0.3em] uppercase">System Online v{APP_VERSION}</span>
        </div>
        <h1 className="text-4xl sm:text-6xl md:text-7xl [@media(max-height:720px)]:md:text-6xl font-orbitron font-black text-white leading-none tracking-tighter drop-shadow-[0_0_15px_rgba(76,201,240,0.5)]">
          COMPUTATION<br />
          <span className="text-transparent bg-clip-text bg-linear-to-r from-quantum-purple to-quantum-magenta">GAME</span>
        </h1>
      </div>

      {/* Navigation Buttons */}
      <div className="flex flex-col gap-2">
        <MenuButton 
          label="Campaign" 
          icon={<Play size={24} />} 
          onClick={() => onNavigate(GameState.CAMPAIGN)} 
        />
        <MenuButton 
          label="Sandbox" 
          icon={<Box size={24} />} 
          onClick={() => onNavigate(GameState.SANDBOX)} 
          variant="secondary"
        />
        <MenuButton 
          label="Archives" 
          icon={<Database size={24} />} 
          onClick={() => onNavigate(GameState.ARCHIVES)} 
          variant="secondary"
        />
        <MenuButton 
          label="Settings" 
          icon={<Settings size={24} />} 
          onClick={() => onNavigate(GameState.SETTINGS)} 
          variant="secondary"
        />
        <div className="h-8 [@media(max-height:720px)]:h-2" />
        <MenuButton 
          label="Quit System" 
          icon={<LogOut size={24} />} 
          onClick={() => onNavigate(GameState.QUIT)} 
          variant="danger"
        />
      </div>

    </div>
  );
};

export default MainMenu;