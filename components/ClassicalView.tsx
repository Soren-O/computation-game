import React, { useState, useCallback } from 'react';
import { Button } from './Button';
import { ICONS } from '../constants';
import { ClassicalBit, GateType } from '../types';

export const ClassicalView: React.FC = () => {
  const [inputs, setInputs] = useState<ClassicalBit[]>([
    { id: 'A', value: 0, label: 'Input A' },
    { id: 'B', value: 0, label: 'Input B' }
  ]);

  const toggleBit = (id: string) => {
    setInputs(prev => prev.map(bit => 
      bit.id === id ? { ...bit, value: bit.value === 0 ? 1 : 0 } : bit
    ));
  };

  const computeGate = (type: GateType, a: number, b: number) => {
    switch (type) {
      case GateType.AND: return a & b;
      case GateType.OR: return a | b;
      case GateType.XOR: return a ^ b;
      case GateType.NOT: return !a ? 1 : 0; // Uses A only usually
      default: return 0;
    }
  };

  const [selectedGate, setSelectedGate] = useState<GateType>(GateType.AND);
  const result = computeGate(selectedGate, inputs[0].value, inputs[1].value);

  return (
    <div className="flex flex-col h-full">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold text-amber-500 mb-2 flex items-center justify-center gap-3">
          <ICONS.CPU className="w-8 h-8" />
          Classical Logic
        </h2>
        <p className="text-slate-400 max-w-md mx-auto">
          Deterministic bits exist in state 0 or 1. Logic gates combine these inputs to produce a definitive output.
        </p>
      </div>

      <div className="flex-1 flex flex-col md:flex-row gap-8 items-center justify-center p-6 bg-slate-900/50 rounded-xl border border-amber-500/20 backdrop-blur-sm">
        
        {/* Inputs */}
        <div className="flex flex-col gap-6">
          {inputs.map(input => (
            <div key={input.id} className="flex items-center gap-4">
              <div 
                onClick={() => toggleBit(input.id)}
                className={`w-16 h-16 rounded-lg flex items-center justify-center text-2xl font-bold cursor-pointer transition-all duration-300 border-2
                  ${input.value === 1 
                    ? 'bg-amber-500 border-amber-400 text-slate-900 shadow-[0_0_20px_rgba(245,158,11,0.5)]' 
                    : 'bg-slate-800 border-slate-700 text-slate-500'
                  }`}
              >
                {input.value}
              </div>
              <span className="font-mono text-amber-200/70">{input.label}</span>
              {/* Wire segment */}
              <div className={`h-1 w-12 transition-colors duration-300 ${input.value ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]' : 'bg-slate-700'}`} />
            </div>
          ))}
        </div>

        {/* Gate Selector */}
        <div className="flex flex-col items-center gap-4 z-10">
          <div className="bg-slate-800 p-4 rounded-xl border border-slate-600 flex flex-col gap-2">
            <span className="text-xs text-slate-400 uppercase tracking-wider mb-1 text-center">Gate Type</span>
            <div className="flex gap-2">
              {(Object.keys(GateType) as GateType[]).map((gate) => (
                 gate !== GateType.NOT && // Simplification for demo
                <button
                  key={gate}
                  onClick={() => setSelectedGate(gate)}
                  className={`px-3 py-1 rounded text-sm font-bold transition-colors ${
                    selectedGate === gate 
                      ? 'bg-amber-500 text-slate-900' 
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {gate}
                </button>
              ))}
            </div>
          </div>
          
          {/* Gate Visual */}
          <div className="w-24 h-24 bg-slate-800 border-2 border-amber-500/50 rounded-lg flex items-center justify-center relative shadow-xl">
            <div className="absolute -left-4 top-1/2 -translate-y-1/2 flex flex-col gap-8">
               <div className={`w-4 h-4 rounded-full ${inputs[0].value ? 'bg