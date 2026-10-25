import { useEffect, useRef, useState, type DragEvent, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import { Check, Minus, Plus, Trash2, X as XIcon } from 'lucide-react';
import { QUBIT_COLORS } from '../../game/hypercube';
import { columnStatus, type CellId, type Circuit } from '../../game/quantum';
import type { LoopRange } from '../../game/tutorials';
import { CELL_INFO, cellLabel } from './cells';

const LABEL_W = 42;
const UNIT = 52;
const ROW = 42;
const CELL = 36;
const RULER_H = 24;

export interface Hand {
  cell: CellId;
  /** Sticky hands come from the palette and stay after placing; picked-up gates don't. */
  sticky: boolean;
}

export interface CaseTab {
  label: string;
  passed: boolean | null;
}

interface CircuitPanelProps {
  qubits: number;
  circuit: Circuit;
  gates: CellId[];
  classical: boolean;
  time: number;
  duration: number;
  loop: LoopRange;
  activeColumn: number | null;
  hand: Hand | null;
  onHandChange: (hand: Hand | null) => void;
  onPlace: (column: number, qubit: number, cell: CellId, from?: { column: number; qubit: number }) => void;
  onRemove: (column: number, qubit: number) => void;
  onSeek: (t: number) => void;
  onLoopChange: (start: number, end: number) => void;
  onGateInfo: (cell: CellId) => void;
  cases: CaseTab[];
  caseIndex: number;
  onCaseChange: (index: number) => void;
  /** Extra controls at the end of the palette row. */
  toolbar?: ReactNode;
  /** Sandbox level only. */
  resize?: {
    showQubits: boolean;
    onQubits: (delta: number) => void;
    onColumns: (delta: number) => void;
    canAddQubit: boolean;
    canRemoveQubit: boolean;
    canAddColumn: boolean;
    canRemoveColumn: boolean;
  };
}

/** Snap loop bounds to whole time steps while keeping at least one step between them. */
function snapLoop(start: number, end: number, duration: number): [number, number] {
  const s = Math.max(0, Math.min(duration - 1, Math.round(start)));
  const e = Math.max(s + 1, Math.min(duration, Math.round(end)));
  return [s, e];
}

export function GateTile({ cell, classical, size = CELL }: { cell: CellId; classical: boolean; size?: number }) {
  const info = CELL_INFO[cell];
  if (cell === 'CTRL') return <span className="block rounded-full bg-slate-100 shadow-[0_0_10px_rgba(255,255,255,0.6)]" style={{ width: size * 0.34, height: size * 0.34 }} />;
  if (cell === 'SWAP') return <XIcon size={size * 0.62} strokeWidth={3} className="text-slate-100 drop-shadow-[0_0_6px_rgba(255,255,255,0.5)]" />;
  const label = cellLabel(cell, classical);
  return (
    <span
      className="flex items-center justify-center rounded-lg border font-mono font-bold"
      style={{
        width: size,
        height: size,
        color: info.color,
        borderColor: `${info.color}99`,
        background: `linear-gradient(160deg, ${info.color}2e, #0b0b1acc 70%)`,
        boxShadow: `0 0 14px ${info.color}33, inset 0 1px 0 ${info.color}40`,
        fontSize: label.length > 2 ? size * 0.3 : size * 0.42,
      }}
    >
      {label}
    </span>
  );
}

const CircuitPanel = ({
  qubits, circuit, gates, classical, time, duration, loop, activeColumn, hand, onHandChange, onPlace, onRemove,
  onSeek, onLoopChange, onGateInfo, cases, caseIndex, onCaseChange, toolbar, resize,
}: CircuitPanelProps) => {
  const gridRef = useRef<HTMLDivElement>(null);
  const [scrub, setScrub] = useState<'TIME' | 'START' | 'END' | null>(null);
  const [draftLoop, setDraftLoop] = useState<[number, number] | null>(null);
  const draftRef = useRef<[number, number] | null>(null);
  const columns = circuit.length;
  const width = LABEL_W + duration * UNIT + 8;
  const xOf = (t: number) => LABEL_W + t * UNIT;

  const loopStart = draftLoop?.[0] ?? loop.start;
  const loopEnd = draftLoop?.[1] ?? loop.end;

  useEffect(() => {
    if (!scrub) return;
    const timeAt = (e: PointerEvent) => {
      const rect = gridRef.current!.getBoundingClientRect();
      return Math.max(0, Math.min(duration - 0.01, (e.clientX - rect.left - LABEL_W) / UNIT));
    };
    const onMove = (e: PointerEvent) => {
      const t = timeAt(e);
      if (scrub === 'TIME') {
        onSeek(Math.round(t * 10) / 10);
        return;
      }
      const [s, en] = draftRef.current ?? [loop.start, loop.end];
      if (scrub === 'START' && t < en) draftRef.current = [t, en];
      if (scrub === 'END' && t > s) draftRef.current = [s, t];
      setDraftLoop(draftRef.current);
    };
    const onUp = () => {
      if (draftRef.current) onLoopChange(...snapLoop(draftRef.current[0], draftRef.current[1], duration));
      draftRef.current = null;
      setDraftLoop(null);
      setScrub(null);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [scrub, duration, loop.start, loop.end, onSeek, onLoopChange]);

  const startScrub = (kind: 'TIME' | 'START' | 'END') => (e: ReactPointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (kind === 'TIME') {
      const rect = gridRef.current!.getBoundingClientRect();
      onSeek(Math.round(Math.max(0, Math.min(duration - 0.01, (e.clientX - rect.left - LABEL_W) / UNIT)) * 10) / 10);
    }
    setScrub(kind);
  };

  const dragFromPalette = (e: DragEvent, cell: CellId) => {
    e.dataTransfer.setData('text/cell', cell);
    e.dataTransfer.effectAllowed = 'copy';
  };
  const dragFromCell = (e: DragEvent, cell: CellId, column: number, qubit: number) => {
    e.dataTransfer.setData('text/cell', cell);
    e.dataTransfer.setData('text/from', `${column},${qubit}`);
    e.dataTransfer.effectAllowed = 'move';
  };
  const dropOnCell = (e: DragEvent, column: number, qubit: number) => {
    e.preventDefault();
    const cell = e.dataTransfer.getData('text/cell') as CellId;
    if (!gates.includes(cell)) return;
    const from = e.dataTransfer.getData('text/from');
    const [fc, fq] = from ? from.split(',').map(Number) : [];
    onPlace(column, qubit, cell, from ? { column: fc, qubit: fq } : undefined);
  };

  const clickCell = (column: number, qubit: number) => {
    const current = circuit[column][qubit];
    if (hand) {
      onPlace(column, qubit, hand.cell);
      if (!hand.sticky) onHandChange(null);
    } else if (current) {
      // Pick the gate up; tap another slot to put it down.
      onRemove(column, qubit);
      onHandChange({ cell: current, sticky: false });
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Palette */}
      <div className="flex flex-wrap items-center gap-1.5 px-3">
        <span className="mr-1 hidden font-orbitron text-[10px] tracking-[0.25em] text-gray-500 sm:inline">GATES</span>
        {gates.map(cell => {
          const selected = hand?.cell === cell && hand.sticky;
          return (
            <button
              key={cell}
              draggable
              onDragStart={e => dragFromPalette(e, cell)}
              onClick={() => onHandChange(selected ? null : { cell, sticky: true })}
              onContextMenu={e => {
                e.preventDefault();
                onGateInfo(cell);
              }}
              title={`${CELL_INFO[cell].name}: ${CELL_INFO[cell].description} (right-click for more)`}
              aria-label={CELL_INFO[cell].name}
              aria-pressed={selected}
              className={`flex h-10 w-10 items-center justify-center rounded-xl border transition-all ${
                selected ? 'border-quantum-cyan bg-quantum-cyan/15 shadow-[0_0_14px_rgba(76,201,240,0.35)]' : 'border-transparent hover:border-white/15 hover:bg-white/5'
              }`}
            >
              <GateTile cell={cell} classical={classical} size={classical && cell === 'X' ? 36 : 30} />
            </button>
          );
        })}
        <span className="ml-1 hidden max-w-xs truncate text-xs text-gray-500 lg:inline">
          {hand
            ? hand.sticky
              ? `Placing ${CELL_INFO[hand.cell].name}: tap slots, Esc to stop.`
              : `Holding ${CELL_INFO[hand.cell].name}: tap a slot to put it down.`
            : 'Drag a gate onto a wire, or tap a gate then tap slots.'}
        </span>
        {hand && !hand.sticky && (
          <button onClick={() => onHandChange(null)} className="flex items-center gap-1 rounded-md border border-red-500/40 px-2 py-1 text-xs text-red-300 hover:bg-red-500/10">
            <Trash2 size={13} /> Discard
          </button>
        )}
        <div className="ml-auto flex flex-wrap items-center justify-end gap-3 text-xs text-gray-400">
          {resize && (
            <>
              {resize.showQubits && (
                <Stepper label="Qubits" value={qubits} onMinus={() => resize.onQubits(-1)} onPlus={() => resize.onQubits(1)} canMinus={resize.canRemoveQubit} canPlus={resize.canAddQubit} />
              )}
              <Stepper label="Steps" value={columns} onMinus={() => resize.onColumns(-1)} onPlus={() => resize.onColumns(1)} canMinus={resize.canRemoveColumn} canPlus={resize.canAddColumn} />
            </>
          )}
          {toolbar}
        </div>
      </div>

      {/* Input tabs for truth-table puzzles */}
      {cases.length > 1 && (
        <div className="flex flex-wrap items-center gap-1.5 px-3">
          <span className="mr-1 font-orbitron text-[10px] tracking-[0.25em] text-gray-500">INPUTS</span>
          {cases.map((c, k) => (
            <button
              key={k}
              onClick={() => onCaseChange(k)}
              className={`flex items-center gap-1 rounded-md border px-2 py-0.5 font-mono text-xs transition-colors ${
                k === caseIndex ? 'border-quantum-cyan bg-quantum-cyan/10 text-white' : 'border-white/10 text-gray-400 hover:border-white/25'
              }`}
            >
              {c.label}
              {c.passed === true && <Check size={12} className="text-green-400" />}
              {c.passed === false && <XIcon size={12} className="text-red-400" />}
            </button>
          ))}
        </div>
      )}

      {/* Timeline + wires */}
      <div className="overflow-x-auto pb-1">
        <div ref={gridRef} className="relative mx-auto select-none" style={{ width, height: RULER_H + qubits * ROW }}>
          {/* Ruler */}
          <div className="absolute left-0 right-0 top-0 cursor-ew-resize touch-none" style={{ height: RULER_H }} onPointerDown={startScrub('TIME')}>
            {Array.from({ length: duration + 1 }, (_, t) => (
              <div key={t} className="absolute top-0 h-full" style={{ left: xOf(t) }}>
                <div className="absolute bottom-0 h-2 w-px bg-white/25" />
                <span className="absolute -translate-x-1/2 font-mono text-[10px] text-gray-500" style={{ top: 1 }}>{t}</span>
              </div>
            ))}
            <span className="absolute font-orbitron text-[9px] tracking-widest text-gray-600" style={{ left: xOf(0.5), top: 13, transform: 'translateX(-50%)' }}>IN</span>
            <span className="absolute font-orbitron text-[9px] tracking-widest text-gray-600" style={{ left: xOf(duration - 0.5), top: 13, transform: 'translateX(-50%)' }}>OUT</span>
            {loop.enabled && (
              <>
                <div className="absolute rounded bg-fuchsia-300/15 ring-1 ring-fuchsia-300/40" style={{ left: xOf(loopStart), width: (loopEnd - loopStart) * UNIT, top: 3, bottom: 3 }} />
                <LoopHandle x={xOf(loopStart)} color="#22c55e" label={loopStart.toFixed(1)} onPointerDown={startScrub('START')} />
                <LoopHandle x={xOf(loopEnd)} color="#ef4444" label={loopEnd.toFixed(1)} onPointerDown={startScrub('END')} />
              </>
            )}
          </div>

          {/* Wires */}
          {Array.from({ length: qubits }, (_, q) => {
            const y = RULER_H + q * ROW + ROW / 2;
            return (
              <div key={q}>
                <div className="absolute h-0.5 rounded-full" style={{ left: LABEL_W - 4, width: width - LABEL_W, top: y - 1, background: `linear-gradient(90deg, ${QUBIT_COLORS[q]}99, ${QUBIT_COLORS[q]}33)` }} />
                <div className="absolute flex items-center gap-1 font-mono text-xs font-semibold" style={{ left: 4, top: y - 9, color: QUBIT_COLORS[q] }}>
                  <span className="h-2 w-2 rounded-full" style={{ background: QUBIT_COLORS[q] }} />q{q}
                </div>
              </div>
            );
          })}

          {/* Columns */}
          {circuit.map((column, k) => {
            const x = xOf(k + 1);
            const status = columnStatus(column);
            const participants = column.flatMap((cell, q) => (cell ? [q] : []));
            const linked = participants.length >= 2 && column.some(c => c === 'CTRL' || c === 'SWAP');
            const isActive = activeColumn === k;
            return (
              <div key={k}>
                <div
                  className={`absolute rounded-lg transition-colors ${isActive ? 'bg-white/[0.07] ring-1 ring-white/20' : status === 'unpaired-swap' ? 'bg-red-500/10 ring-1 ring-red-500/40' : ''}`}
                  style={{ left: x + 3, width: UNIT - 6, top: RULER_H + 2, height: qubits * ROW - 4 }}
                  title={status === 'unpaired-swap' ? 'SWAP needs exactly two wires in the same column' : undefined}
                />
                {linked && (
                  <div
                    className="absolute w-0.5 bg-slate-200/80 shadow-[0_0_6px_rgba(255,255,255,0.5)]"
                    style={{ left: x + UNIT / 2 - 1, top: RULER_H + Math.min(...participants) * ROW + ROW / 2, height: (Math.max(...participants) - Math.min(...participants)) * ROW }}
                  />
                )}
                {column.map((cell, q) => (
                  <div
                    key={q}
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => dropOnCell(e, k, q)}
                    onClick={() => clickCell(k, q)}
                    onContextMenu={e => {
                      e.preventDefault();
                      if (cell) onRemove(k, q);
                    }}
                    className={`group absolute flex items-center justify-center rounded-lg ${
                      cell ? 'cursor-grab' : hand ? 'cursor-pointer border border-dashed border-quantum-cyan/40 hover:bg-quantum-cyan/10' : 'border border-dashed border-white/[0.07] hover:border-white/20'
                    }`}
                    style={{ left: x + (UNIT - CELL) / 2, top: RULER_H + q * ROW + (ROW - CELL) / 2, width: CELL, height: CELL }}
                  >
                    {cell && (
                      <div draggable onDragStart={e => dragFromCell(e, cell, k, q)} className="flex items-center justify-center">
                        <GateTile cell={cell} classical={classical} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            );
          })}

          {/* Playhead */}
          <div className="pointer-events-none absolute w-0.5 bg-yellow-300 shadow-[0_0_8px_rgba(253,224,71,0.8)]" style={{ left: xOf(Math.min(time, duration)) - 1, top: 6, height: RULER_H - 6 + qubits * ROW }} />
          <div
            className="absolute h-3 w-3 cursor-grab rounded-full bg-yellow-300 shadow-[0_0_8px_rgba(253,224,71,0.9)] touch-none"
            style={{ left: xOf(Math.min(time, duration)) - 6, top: 1 }}
            onPointerDown={startScrub('TIME')}
            aria-label="Playhead"
          />
        </div>
      </div>
    </div>
  );
};

function LoopHandle({ x, color, label, onPointerDown }: { x: number; color: string; label: string; onPointerDown: (e: ReactPointerEvent) => void }) {
  return (
    <div className="absolute top-0 z-10 flex -translate-x-1/2 cursor-ew-resize flex-col items-center touch-none" style={{ left: x }} onPointerDown={onPointerDown}>
      <div className="h-3.5 w-3.5 rounded-full border-2 border-white" style={{ background: color }} />
      <span className="mt-px rounded bg-black/70 px-1 font-mono text-[9px]" style={{ color }}>{label}</span>
    </div>
  );
}

function Stepper({ label, value, onMinus, onPlus, canMinus, canPlus }: { label: string; value: number; onMinus: () => void; onPlus: () => void; canMinus: boolean; canPlus: boolean }) {
  return (
    <div className="flex items-center gap-1">
      <span className="mr-1">{label}</span>
      <button onClick={onMinus} disabled={!canMinus} aria-label={`Fewer ${label.toLowerCase()}`} className="rounded p-1 hover:bg-white/10 hover:text-white disabled:opacity-30"><Minus size={13} /></button>
      <span className="w-4 text-center font-mono text-white">{value}</span>
      <button onClick={onPlus} disabled={!canPlus} aria-label={`More ${label.toLowerCase()}`} className="rounded p-1 hover:bg-white/10 hover:text-white disabled:opacity-30"><Plus size={13} /></button>
    </div>
  );
}

export default CircuitPanel;
