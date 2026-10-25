import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { finalState, statesEqual, type Circuit, type GateId } from './engine';
import { CONNECTIONS, LEVELS, getLevel, isLevelBuilt, type Puzzle } from './levels';
import { TUTORIALS } from './tutorials';
import { ARCHIVE_DATA } from './archives';

/** Every circuit of length `slots` built from `gates` plus empty slots. */
function* allCircuits(slots: number, gates: GateId[]): Generator<Circuit> {
  if (slots === 0) {
    yield [];
    return;
  }
  for (const rest of allCircuits(slots - 1, gates)) {
    for (const g of [null, ...gates]) yield [g, ...rest];
  }
}

const solutionsOf = (p: Puzzle): Circuit[] =>
  [...allCircuits(p.slots, p.gates)].filter(c => statesEqual(finalState(p.start, c), p.target!));

describe('campaign puzzles', () => {
  const puzzles = LEVELS.flatMap(level => level.puzzles.map((p, i) => ({ name: `${level.id} #${i + 1}`, p })));

  it.each(puzzles)('$name is solvable with its slots and gates', ({ p }) => {
    expect(p.target).toBeDefined();
    expect(solutionsOf(p).length).toBeGreaterThan(0);
  });

  it.each(puzzles)('$name is not already solved by an empty circuit', ({ p }) => {
    expect(statesEqual(p.start, p.target!)).toBe(false);
  });

  it('only uses the bit visual for single-gate (NOT) levels', () => {
    for (const level of LEVELS.filter(l => l.visual === 'bit')) {
      for (const p of level.puzzles) expect(p.gates).toEqual(['X']);
    }
  });
});

describe('campaign map', () => {
  it('only connects levels that exist', () => {
    for (const [from, to] of CONNECTIONS) {
      expect(getLevel(from)).toBeDefined();
      expect(getLevel(to)).toBeDefined();
    }
  });

  it('has unique level ids', () => {
    expect(new Set(LEVELS.map(l => l.id)).size).toBe(LEVELS.length);
  });
});

describe('tutorials', () => {
  it.each(Object.entries(TUTORIALS))('%s covers every puzzle of its level, in order', (levelId, steps) => {
    const level = getLevel(levelId);
    expect(level && isLevelBuilt(level)).toBe(true);
    const puzzleOrder = steps.map(s => s.puzzle);
    expect(puzzleOrder).toEqual([...puzzleOrder].sort((a, b) => a - b));
    expect(new Set(puzzleOrder)).toEqual(new Set(level!.puzzles.map((_, i) => i)));
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
