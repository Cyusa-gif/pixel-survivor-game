# PixelSurvivor

A browser-based survival game built with **Vue 3 + Vite** for L3 SOD Learning Outcome 4. The player pilots a spaceship and must dodge an endless rain of falling hazards, surviving as long as possible while their score climbs.

---

## Live URL

> Deployed via Replit — see the published link on the Replit project page.

---

## How to Run Locally

```bash
# Install dependencies
pnpm install

# Start the dev server (defaults to port 5173)
pnpm --filter @workspace/pixelsurvivors run dev
```

Then open `http://localhost:5173` in your browser.

---

## Interaction Model — Justification

| Input | Action | Reason |
|---|---|---|
| **Arrow Keys / WASD** | Move in all 4 directions | Industry-standard dual-scheme supports both left-hand (WASD) and right-hand (Arrow) players without requiring configuration |
| **4-directional movement** | Up, Down, Left, Right | Hazards fall in a 2-D field, so vertical evasion (moving up to avoid a cluster, retreating down) is as important as horizontal dodging. Restricting to left/right only would remove a full axis of skill expression |
| **Keyboard only** | No mouse required | Keeps reaction time low — mouse aim introduces pointer-offset latency that works against fast dodge gameplay |
| **Hold-to-move** | Continuous movement while key is held | Uses a `Set<string>` of live keys sampled every 16 ms game-loop tick, giving smooth analogue-style movement instead of discrete per-keypress jumps |

---

## Component Structure

```
src/
├── App.vue              # Root: game state, game loop, input, collision
├── components/
│   ├── GameBoard.vue    # SVG rendering: background, hazards, player ship, particles
│   ├── GameHUD.vue      # Live HUD: score, hull, level, streak multiplier
│   └── GameOver.vue     # End-screen overlay: final score, rank badge, restart/home
├── composables/
│   └── useLeaderboard.ts  # localStorage top-5 high-score tracker
└── styles/
    └── main.scss        # SASS variables, mixins, shared design tokens
```

**Minimum 3 components met** — 4 components in use.

---

## Game Mechanics

### Core Loop
- A `setInterval` (16 ms) drives the **physics tick**: player movement, hazard positions, collision detection.
- A second `setInterval` (1 000 ms) drives the **score/difficulty tick**: score increments, streak multiplier updates, difficulty level advances.
- A third `setInterval` manages **hazard spawning**, with the spawn interval shrinking as difficulty grows.
- All three intervals are stored in module-level variables and cleared in `stopLoops()`, which is called on game-over, restart, and `onUnmounted`.

### Score & Difficulty
- **Score** increments by the current streak **multiplier** (×1–×5) each second.
- **Difficulty** is based on time survived (not score), so a high multiplier doesn't accidentally spike the hazard rate.
- Hazard **spawn interval** decreases with difficulty; hazard **speed** scales with a preset-specific multiplier.

### Reactive State
All game state (`score`, `health`, `hazards`, `playerX`, `playerY`, `difficulty`, etc.) is held in Vue `ref` / `reactive`. The HUD and board re-render automatically via Vue's reactivity system — zero `document.querySelector` or manual DOM writes.

### Hazard Variety (Math.random())
Each spawned hazard randomises:
- **X position** across the full board width
- **Shape** — rectangle, diamond, or circle
- **Color** — 8-item palette
- **Speed** — base + random variance scaled by difficulty
- **Dimensions** — width/height vary per spawn
- **Rotation speed** — random spin for rect and diamond shapes

---

## SASS Features Used

- **Variables** — `$color-primary`, `$color-bg-board`, `$font-pixel`, `$radius-md`, etc.
- **Mixins** — `pixel-font()`, `glow-border()`, `hud-panel()`, `pulse-glow()`
- **Nesting** — BEM-style rules nested inside component selectors
- **`@use` syntax** — `@use '../styles/main.scss' as *` in each scoped component style block (no deprecated `@import`)

---

## Bonus Features (all implemented)

| Feature | Implementation |
|---|---|
| **High-score tracker** | `useLeaderboard` composable — top 5 scores saved to `localStorage`, shown on home screen with medal badges |
| **SVG character** | Player ship is a fully hand-authored SVG polygon spaceship with cockpit, swept wings, engine nacelles, and animated tri-tone thruster flame |
| **Difficulty settings toggle** | Easy / Normal / Hard presets selectable on the home screen; each tunes speed multiplier, spawn rate, and damage per hit |

---

## Tech Stack

| Layer | Tool |
|---|---|
| Framework | Vue 3 (`<script setup>` Composition API) |
| Build tool | Vite 6 |
| Language | TypeScript |
| Styling | SASS (dart-sass, `@use` syntax) |
| Type-checking | vue-tsc |
| Rendering | SVG (inline, reactive) |
| Persistence | localStorage (leaderboard) |


---

## Running Locally (standalone)

```bash
npm install    # or: pnpm install
npm run dev    # opens http://localhost:5173
```
