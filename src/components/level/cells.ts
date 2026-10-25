import type { CellId } from '../../game/quantum';

export interface CellInfo {
  label: string;
  /** Label on classical (bit) levels, where X is introduced as NOT. */
  classicalLabel?: string;
  name: string;
  description: string;
  color: string;
  /** Data Bank entry with the full explanation. */
  archiveId: string;
}

export const CELL_INFO: Record<CellId, CellInfo> = {
  X: { label: 'X', classicalLabel: 'NOT', name: 'Pauli-X', description: 'Slides every arrow across along this wire. Classical NOT.', color: '#4cc9f0', archiveId: '007' },
  Y: { label: 'Y', name: 'Pauli-Y', description: 'Slides across and turns: |0⟩ → i|1⟩, |1⟩ → -i|0⟩.', color: '#facc15', archiveId: '013' },
  Z: { label: 'Z', name: 'Pauli-Z', description: 'Turns arrows on the 1 side half a turn (×-1).', color: '#fb7185', archiveId: '011' },
  H: { label: 'H', name: 'Hadamard', description: 'Splits each arrow along this wire: half stays, half slides across.', color: '#a78bfa', archiveId: '014' },
  S: { label: 'S', name: 'S (phase)', description: 'Turns arrows on the 1 side a quarter turn counterclockwise (×i).', color: '#34d399', archiveId: '012' },
  SDG: { label: 'S†', name: 'S-dagger', description: 'Turns arrows on the 1 side a quarter turn clockwise (×-i). Undoes S.', color: '#34d399', archiveId: '012' },
  T: { label: 'T', name: 'T', description: 'Turns arrows on the 1 side an eighth of a turn counterclockwise.', color: '#fb923c', archiveId: '026' },
  TDG: { label: 'T†', name: 'T-dagger', description: 'Turns arrows on the 1 side an eighth of a turn clockwise. Undoes T.', color: '#fb923c', archiveId: '026' },
  CTRL: { label: '●', name: 'Control', description: 'Other gates in this column only act where this wire is 1.', color: '#e2e8f0', archiveId: '015' },
  SWAP: { label: '×', name: 'Swap', description: 'Place on two wires in one column to exchange them.', color: '#e2e8f0', archiveId: '016' },
};

export const cellLabel = (cell: CellId, classical: boolean) =>
  (classical && CELL_INFO[cell].classicalLabel) || CELL_INFO[cell].label;
