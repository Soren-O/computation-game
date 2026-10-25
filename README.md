# Quantum Odyssey (computation game)

A sci-fi puzzle game about classical bits and single-qubit quantum gates. You place gates on a
timeline, run the simulation, and try to land the bit or qubit on a target state.

Originally generated in Google AI Studio; this folder is the cleaned-up, locally buildable version.
The untouched AI Studio exports are still next to it in `computation-game (1)` / `(2)` and the zips.

## Run it

Requires Node 20.19+ (or 22.12+).

```bash
npm install
npm run dev        # http://localhost:3000
```

| Script | What it does |
| --- | --- |
| `npm run dev` | Dev server with hot reload. Add `-- --host` to open it from a phone on your network. |
| `npm run build` | Typecheck, then production build into `dist/`. |
| `npm run preview` | Serve the production build. |
| `npm test` | Unit tests (engine rules, every puzzle is solvable, tutorial/archive consistency). |
| `npm run typecheck` | TypeScript only. |

No API key is needed. The Gemini dependency from the AI Studio template was never used and has been removed.

## Project layout

```
src/
  game/                 Pure game logic, no React state
    engine.ts           Qubit model, gate rules, timing (what state is shown at time t)
    levels.ts           Campaign map and every puzzle (start, target, slots, allowed gates)
    tutorials.tsx       Instructor scripts and the checks that unlock NEXT
    archives.ts         Data Bank entries (and which level decrypts the locked ones)
    *.test.ts(x)        Vitest tests
  state/GameContext.tsx Settings + campaign progress, saved to localStorage
  components/
    GameLevelScreen.tsx The level player: clock, run checking, tutorial, layout
    level/              Stage (bit/qubit visual), TimerControls (dial), OperatorSidebar
    ...                 Menu, campaign map, archives, settings, loading screen
```

### Adding or changing puzzles

Puzzles are data in `src/game/levels.ts`. A level with an empty `puzzles` list shows as
"In development" on the map. `npm test` brute-forces every puzzle to confirm it can be solved
with the slots and gates it allows, so an impossible puzzle fails the test suite.

If a level has a tutorial in `src/game/tutorials.tsx`, each step names the puzzle it belongs to;
when a puzzle is solved, the instructor jumps to the first step of the next puzzle.

### How the simulation models a qubit

The engine tracks one basis state (|0⟩ or |1⟩) plus a phase in quarter turns (1, i, -1, -i). That's
exact for every gate currently in the game (X, Z, S, Y), because none of them create superposition.
A Hadamard gate, the planned Interference level, or Entanglement would need a real amplitude vector
(two complex numbers per qubit). The engine is isolated in `engine.ts` so that change stays contained.

## Status

Playable: **System Boot** (classical bit tutorial), **Quantum Gates** (8 puzzles: P-X, P-Z, S, P-Y),
and **Sandbox** (free play from the main menu).

Not built yet: Binary Basis, Logic Gates, The Transistor, Entanglement, Interference.
The Report Bug / Send Feedback screens copy a formatted report to the clipboard, because there's no
feedback server.
