import { ReactNode } from 'react';

export enum GameState {
    LOADING = 'LOADING',
    MENU = 'MENU',
    CAMPAIGN = 'CAMPAIGN',
    GAME_LEVEL = 'GAME_LEVEL',
    SANDBOX = 'SANDBOX',
    ARCHIVES = 'ARCHIVES',
    SETTINGS = 'SETTINGS',
    QUIT = 'QUIT'
}

export interface MenuItemProps {
    label: string;
    onClick: () => void;
    active?: boolean;
    icon?: ReactNode;
}

export interface QuantumFactResponse {
    fact: string;
}

export interface ClassicalBit {
    id: string;
    value: number;
    label: string;
}

export enum GateType {
    AND = 'AND',
    OR = 'OR',
    XOR = 'XOR',
    NOT = 'NOT'
}