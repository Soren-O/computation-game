import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { applyCircuit, columnStatus, norm, numQubits, statesMatch } from './quantum';
import { CONNECTIONS, LEVELS, getLevel, isLevelBuilt } from './levels';
import { TUTORIALS } from './tutorials';
import { ARCHIVE_DATA } from './archives';

const puzzles = LEVELS.flatMap(level => level.puzzles.map((p, i) => ({ name: `${level.id} #${i + 1}`, level, p })));

describe('campaign puzzles', () => {
  it.each(puzzles)('$name: its reference solution fits the puzzle', ({ p }) => {
    expect(p.solution.length).toBeGreaterThan(0);
    expect(p.solution.length).toBeLessThanOrEqual(p.columns);
    for (const column of p.solution) {
      expect(column).toHaveLength(p.qubits);
      expect(columnStatus(column)).not.toBe('unpaired-swap');
      for (const cell of column) if (cell) expect(p.gates).toContain(cell);
    }
  });

  it.each(puzzles)('$name: the solution solves every case', ({ p }) => {
    for (const { start, target } of p.cases) {
      expect(statesMatch(applyCircuit(start, p.solution), target, p.upToGlobalPhase)).toBe(true);
    }
  });

  it.each(puzzles)('$name: states are well formed and the puzzle is not already solved', ({ p }) => {
    for (const { start, target } of p.cases) {
      expect(numQubits(start)).toBe(p.qubits);
      expect(numQubits(target)).toBe(p.qubits);
      expect(norm(start)).toBeCloseTo(1, 9);
      expect(norm(target)).toBeCloseTo(1, 9);
    }
    expect(p.cases.every(({ start, target }) => statesMatch(start, target, p.upToGlobalPhase))).toBe(false);
  });

  it('only uses the bit visual where every gate keeps a single ball (no superposition or phases)', () => {
    for (const level of LEVELS.filter(l => l.visual === 'bit')) {
      for (const p of level.puzzles) for (const g of p.gates) expect(['X', 'CTRL', 'SWAP']).toContain(g);
    }
  });
});

describe('campaign map', () => {
  it('only connects levels that exist, without cycles', () => {
    for (const [from, to] of CONNECTIONS) {
      expect(getLevel(from)).toBeDefined();
      expect(getLevel(to)).toBeDefined();
      expect(LEVELS.findIndex(l => l.id === from)).not.toBe(-1);
    }
    const reachable = new Set(['root']);
    for (let changed = true; changed; ) {
      changed = false;
      for (const level of LEVELS) {
        const parents = CONNECTIONS.filter(([, t]) => t === level.id).map(([s]) => s);
        if (!reachable.has(level.id) && parents.length && parents.every(p => reachable.has(p))) {
          reachable.add(level.id);
          changed = true;
        }
      }
    }
    expect(reachable.size).toBe(LEVELS.length);
  });

  it('has unique level ids', () => {
    expect(new Set(LEVELS.map(l => l.id)).size).toBe(LEVELS.length);
  });
});

describe('tutorials', () => {
  it('exist for every built level', () => {
    for (const level of LEVELS.filter(isLevelBuilt)) expect(TUTORIALS[level.id]).toBeDefined();
  });

  it.each(Object.entries(TUTORIALS))('%s covers every puzzle of its level, in order', (levelId, steps) => {
    const level = getLevel(levelId);
    expect(level && isLevelBuilt(level)).toBe(true);
    const puzzleOrder = steps.map(s => s.puzzle);
    expect(puzzleOrder).toEqual([...puzzleOrder].sort((a, b) => a - b));
    expect(new Set(puzzleOrder)).toEqual(new Set(level!.puzzles.map((_, i) => i)));
    // The last step of each puzzle must wait for the solve, or the player could get stuck.
    level!.puzzles.forEach((_, i) => {
      const last = steps.filter(s => s.puzzle === i).at(-1)!;
      expect(last.awaitsSolve).toBe(true);
    });
  });
});

describe('archives', () => {
  it('has an entry for every term linked from tutorial text', () => {
    const ids = new Set(ARCHIVE_DATA.map(e => e.id));
    const steps = Object.values(TUTORIALS).flat();
    const linked = steps.flatMap(s =>
      [...renderToStaticMarkup(<>{s.text}</>).matchAll(/data-archive="([^"]+)"/g)].map(m => m[1]),
    );
    expect(linked.length).toBeGreaterThan(0);
    for (const id of linked) expect(ids).toContain(id);
  });

  it('has unique ids', () => {
    expect(new Set(ARCHIVE_DATA.map(e => e.id)).size).toBe(ARCHIVE_DATA.length);
  });

  it('only gates entries behind levels that exist', () => {
    for (const entry of ARCHIVE_DATA) {
      if (entry.unlockedBy) expect(getLevel(entry.unlockedBy)).toBeDefined();
    }
  });
});
