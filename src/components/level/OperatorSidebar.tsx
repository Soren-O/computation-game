import type { DragEvent } from 'react';
import { ChevronLeft, LayoutGrid, Minus, PanelLeft, Plus, Trash2 } from 'lucide-react';
import type { Circuit, GateId } from '../../game/engine';
import { OPERATORS, type Operator } from '../gateIcons';

interface OperatorSidebarProps {
  open: boolean;
  onClose: () => void;
  gates: GateId[];
  circuit: Circuit;
  time: number;
  useQuantumNames: boolean;
  /** Tap-to-place: the gate picked in the palette, waiting for a slot. */
  selectedGate: GateId | null;
  onSelectGate: (gate: GateId | null) => void;
  onPlace: (slot: number, gate: GateId, fromSlot?: number) => void;
  onRemove: (slot: number) => void;
  /** Sandbox only: change the number of slots. */
  onResize?: (delta: number) => void;
  minSlots?: number;
  maxSlots?: number;
}

const labelFor = (op: Operator, quantum: boolean) => (quantum ? op.quantumName : op.name);

const OperatorSidebar = ({
  open, onClose, gates, circuit, time, useQuantumNames, selectedGate, onSelectGate, onPlace, onRemove, onResize, minSlots = 1, maxSlots = 8,
}: OperatorSidebarProps) => {
  const startDrag = (e: DragEvent, gate: GateId, fromSlot?: number) => {
    e.dataTransfer.setData('text/gate', gate);
    if (fromSlot !== undefined) e.dataTransfer.setData('text/from-slot', String(fromSlot));
    e.dataTransfer.effectAllowed = fromSlot !== undefined ? 'move' : 'copy';
  };

  const handleDrop = (e: DragEvent, slot: number) => {
    e.preventDefault();
    const gate = e.dataTransfer.getData('text/gate') as GateId;
    if (!gates.includes(gate)) return;
    const from = e.dataTransfer.getData('text/from-slot');
    onPlace(slot, gate, from === '' ? undefined : Number(from));
  };

  return (
    <aside
      aria-hidden={!open}
      inert={!open}
      className={`absolute top-0 bottom-0 left-0 w-80 max-w-[85vw] bg-[#0a0a15]/95 border-r border-quantum-cyan/20 backdrop-blur-xl z-30 transition-transform duration-300 ease-out flex flex-col ${open ? 'translate-x-0' : '-translate-x-full'}`}
    >
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-orbitron text-xs tracking-widest text-quantum-cyan flex items-center gap-2">
            <LayoutGrid size={14} /> OPERATORS
          </h3>
          <button onClick={onClose} aria-label="Close operator sidebar" className="p-1 text-gray-500 hover:text-white">
            <ChevronLeft size={18} />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {gates.map(id => {
            const op = OPERATORS[id];
            const isSelected = selectedGate === id;
            return (
              <button
                key={id}
                draggable
                onDragStart={e => startDrag(e, id)}
                onClick={() => onSelectGate(isSelected ? null : id)}
                title={op.description}
                aria-pressed={isSelected}
                className={`aspect-square border rounded cursor-grab active:cursor-grabbing flex flex-col items-center justify-start pt-3 gap-2 relative transition-all ${
                  isSelected ? 'bg-quantum-cyan/15 border-quantum-cyan shadow-[0_0_15px_rgba(76,201,240,0.3)]' : 'bg-white/5 border-white/10 hover:border-quantum-cyan hover:bg-white/10'
                }`}
              >
                <span className="text-xs font-orbitron font-bold text-gray-300 pointer-events-none">{labelFor(op, useQuantumNames)}</span>
                <div className="scale-150 pointer-events-none">
                  <op.icon className={op.color} />
                </div>
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-[11px] text-gray-500 font-rajdhani leading-snug">
          {selectedGate ? 'Now tap a slot to place it. Esc to cancel.' : 'Drag a gate onto a slot, or tap a gate and then a slot.'}
        </p>
      </div>

      <div className="flex-1 p-6 flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-orbitron text-xs tracking-widest text-quantum-magenta flex items-center gap-2">
            <PanelLeft size={14} className="rotate-90" /> CIRCUIT TIMELINE
          </h3>
          {onResize && (
            <div className="flex items-center gap-1 text-gray-400">
              <button onClick={() => onResize(-1)} disabled={circuit.length <= minSlots} aria-label="Remove slot" className="p-1 hover:text-white disabled:opacity-30"><Minus size={14} /></button>
              <span className="font-mono text-xs w-4 text-center">{circuit.length}</span>
              <button onClick={() => onResize(1)} disabled={circuit.length >= maxSlots} aria-label="Add slot" className="p-1 hover:text-white disabled:opacity-30"><Plus size={14} /></button>
            </div>
          )}
        </div>
        <div className="flex flex-col gap-3 overflow-y-auto items-center pr-1">
          {circuit.map((gate, slot) => {
            const slotStart = slot + 1;
            const isActive = time >= slotStart && time < slotStart + 1;
            const isPast = time >= slotStart + 1;
            const op = gate ? OPERATORS[gate] : null;
            const canPlace = selectedGate !== null;

            return (
              <div
                key={slot}
                onDrop={e => handleDrop(e, slot)}
                onDragOver={e => e.preventDefault()}
                onClick={() => {
                  if (!selectedGate) return;
                  onPlace(slot, selectedGate);
                  onSelectGate(null);
                }}
                className={`w-32 h-32 shrink-0 rounded border flex flex-col items-center justify-center relative transition-colors
                  ${isActive ? 'bg-white/10 border-white/50 shadow-[0_0_15px_rgba(255,255,255,0.1)]' : isPast ? 'border-gray-800 text-gray-600 opacity-60' : 'border-white/10 hover:border-white/20 hover:bg-white/5 border-dashed'}
                  ${op ? 'border-solid bg-white/5' : ''}
                  ${canPlace ? 'cursor-pointer ring-1 ring-quantum-cyan/40' : ''}
                `}
              >
                <div className={`absolute top-2 left-2 font-mono text-xs ${isActive ? 'text-white' : 'text-gray-600'}`}>{slotStart.toFixed(1)}</div>

                {op ? (
                  <div
                    draggable
                    onDragStart={e => startDrag(e, op.id, slot)}
                    onContextMenu={e => {
                      e.preventDefault();
                      onRemove(slot);
                    }}
                    className="flex flex-col items-center justify-center gap-2 w-full relative group/item cursor-grab active:cursor-grabbing"
                  >
                    <div className="scale-150 pointer-events-none">
                      <op.icon className={op.color} />
                    </div>
                    <span className="font-orbitron text-xs text-gray-300 mt-2 pointer-events-none">{labelFor(op, useQuantumNames)}</span>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        onRemove(slot);
                      }}
                      aria-label={`Remove gate at t=${slotStart.toFixed(1)}`}
                      className="absolute -top-6 -right-2 text-gray-500 hover:text-red-400 opacity-60 md:opacity-0 group-hover/item:opacity-100 focus:opacity-100 transition-opacity p-2"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ) : (
                  <span className="text-[10px] text-gray-700 font-mono tracking-widest">EMPTY</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
};

export default OperatorSidebar;
