import type { ComponentType } from 'react';
import type { GateId } from '../game/engine';

type IconProps = { className?: string };

// Custom Icon for NOT Gate (Parallel Arrows: L->R top, R->L bottom)
const NotGateIcon = ({ className }: IconProps) => (
    <div className={`w-full h-full flex flex-col items-center justify-center gap-1 ${className ?? ''}`}>
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
const ZGateIcon = ({ className }: IconProps) => (
    <div className={`w-full h-full flex items-center justify-center ${className ?? ''}`}>
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
const SGateIcon = ({ className }: IconProps) => (
    <div className={`w-full h-full flex items-center justify-center ${className ?? ''}`}>
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
const YGateIcon = ({ className }: IconProps) => (
    <div className={`w-full h-full flex flex-col items-center justify-center gap-0 ${className ?? ''}`}>
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

export interface Operator {
  id: GateId;
  name: string;
  /** Label used on quantum levels, where X is introduced as Pauli-X. */
  quantumName: string;
  description: string;
  icon: ComponentType<IconProps>;
  color: string;
}

export const OPERATORS: Record<GateId, Operator> = {
  X: { id: 'X', name: 'NOT', quantumName: 'P-X', description: 'NOT / Pauli-X gate. Swaps |0⟩ and |1⟩.', icon: NotGateIcon, color: 'text-quantum-cyan' },
  Z: { id: 'Z', name: 'P-Z', quantumName: 'P-Z', description: 'Pauli-Z gate. Rotates the phase by 180° only if the qubit is |1⟩.', icon: ZGateIcon, color: 'text-red-500' },
  S: { id: 'S', name: 'S', quantumName: 'S', description: 'Phase gate. Rotates the phase by 90° (multiplies by i) only if the qubit is |1⟩.', icon: SGateIcon, color: 'text-green-500' },
  Y: { id: 'Y', name: 'P-Y', quantumName: 'P-Y', description: 'Pauli-Y gate. Maps |0⟩ to i|1⟩ and |1⟩ to -i|0⟩.', icon: YGateIcon, color: 'text-yellow-400' },
};
