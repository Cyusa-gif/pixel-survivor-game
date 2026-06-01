<template>
  <div class="hud">
    <!-- Score + multiplier -->
    <div class="hud-cell hud-score">
      <span class="cell-icon">⭑</span>
      <div class="cell-body">
        <span class="cell-label">SCORE</span>
        <div class="score-row">
          <span class="cell-value score-val">{{ padded(score) }}</span>
          <span class="mult-badge" :class="multClass">×{{ multiplier }}</span>
        </div>
        <!-- Streak progress bar -->
        <div class="streak-track" title="Streak to next multiplier">
          <div
            class="streak-fill"
            :class="multClass"
            :style="{ width: streakProgress + '%' }"
          />
        </div>
      </div>
    </div>

    <!-- Health -->
    <div class="hud-cell hud-health">
      <span class="cell-icon" :class="healthIconClass">♥</span>
      <div class="cell-body health-body">
        <div class="health-header">
          <span class="cell-label">HULL</span>
          <span class="cell-label health-pct" :class="healthIconClass">{{ health }}%</span>
        </div>
        <div class="health-segments">
          <div
            v-for="i in 10"
            :key="i"
            class="h-seg"
            :class="{
              'seg-active': health >= i * 10,
              'seg-high':   health >= i * 10 && health > 60,
              'seg-mid':    health >= i * 10 && health <= 60 && health > 20,
              'seg-low':    health >= i * 10 && health <= 20,
            }"
          />
        </div>
      </div>
    </div>

    <!-- Level -->
    <div class="hud-cell hud-level">
      <span class="cell-icon level-icon">⚡</span>
      <div class="cell-body">
        <span class="cell-label">LEVEL</span>
        <span class="cell-value level-val">{{ difficulty }}</span>
      </div>
    </div>

    <!-- Best -->
    <div class="hud-cell hud-best">
      <span class="cell-icon best-icon">🏆</span>
      <div class="cell-body">
        <span class="cell-label">BEST</span>
        <span class="cell-value best-val">{{ padded(highScore) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  score: number
  health: number
  difficulty: number
  highScore: number
  multiplier: number
  streakSeconds: number
}>()

function padded(n: number) { return n.toString().padStart(5, '0') }

// Progress toward next multiplier tier (0–100 %)
const streakProgress = computed(() => {
  if (props.multiplier >= 5) return 100
  return (props.streakSeconds % 10) * 10
})

const multClass = computed(() => {
  const map: Record<number, string> = { 1: 'mult-1', 2: 'mult-2', 3: 'mult-3', 4: 'mult-4', 5: 'mult-5' }
  return map[props.multiplier] ?? 'mult-1'
})

const healthIconClass = computed(() => {
  if (props.health > 60) return 'icon-high'
  if (props.health > 20) return 'icon-mid'
  return 'icon-low'
})
</script>

<style lang="scss" scoped>
@use '../styles/main.scss' as *;

@keyframes hud-low-pulse {
  0%, 100% { opacity: 1;   text-shadow: 0 0 8px $color-health-low; }
  50%       { opacity: 0.6; text-shadow: 0 0 20px $color-health-low, 0 0 32px rgba(255,68,68,0.5); }
}

@keyframes mult-shine {
  0%   { box-shadow: 0 0 6px var(--mc), inset 0 0 4px rgba(255,255,255,0.1); }
  50%  { box-shadow: 0 0 14px var(--mc), inset 0 0 8px rgba(255,255,255,0.2); }
  100% { box-shadow: 0 0 6px var(--mc), inset 0 0 4px rgba(255,255,255,0.1); }
}

// ── Multiplier colour tokens ──────────────────────────────────────────────────
.mult-1 { --mc: rgba(255,255,255,0.25); color: rgba(255,255,255,0.35); }
.mult-2 { --mc: #{$color-primary};      color: $color-primary; }
.mult-3 { --mc: #{$color-warn};         color: $color-warn; }
.mult-4 { --mc: #ff8800;                color: #ff8800; }
.mult-5 { --mc: #ff2288;                color: #ff2288; }

// ── HUD layout ────────────────────────────────────────────────────────────────
.hud {
  display: flex;
  gap: 8px;
  align-items: stretch;
  width: 600px;

  @media (max-width: 640px) { width: 100%; flex-wrap: wrap; }
}

.hud-cell {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: rgba(0, 0, 0, 0.55);
  border-radius: $radius-md;
  border: 1px solid rgba(0, 255, 204, 0.15);
  backdrop-filter: blur(10px);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.04);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 1px;
  }
}

.hud-score::before  { background: linear-gradient(90deg, transparent, $color-primary, transparent); }
.hud-health::before { background: linear-gradient(90deg, transparent, $color-health, transparent); }
.hud-level::before  { background: linear-gradient(90deg, transparent, $color-warn, transparent); }
.hud-best::before   { background: linear-gradient(90deg, transparent, rgba(255,215,0,0.6), transparent); }

.cell-icon {
  font-size: 18px;
  line-height: 1;
  flex-shrink: 0;
  filter: drop-shadow(0 0 4px currentColor);

  &.icon-high { color: $color-health; }
  &.icon-mid  { color: $color-warn; }
  &.icon-low  { color: $color-health-low; animation: hud-low-pulse 0.5s ease infinite; }
}

.level-icon { color: $color-warn; font-size: 16px; }
.best-icon  { font-size: 15px; }

.cell-body {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
  flex: 1;
}

.cell-label {
  @include pixel-font;
  font-size: 6px;
  color: $color-text-dim;
  letter-spacing: 0.12em;
  text-transform: uppercase;

  &.health-pct {
    &.icon-high { color: $color-health; }
    &.icon-mid  { color: $color-warn; }
    &.icon-low  { color: $color-health-low; }
  }
}

.cell-value {
  @include pixel-font;
  font-size: 14px;
  line-height: 1;
}

.score-val { color: $color-primary; text-shadow: $glow-primary; }
.level-val { color: $color-warn;    text-shadow: $glow-warn; }
.best-val  { color: rgba(255, 215, 0, 0.7); }

// ── Score row: value + badge ──────────────────────────────────────────────────
.score-row {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.mult-badge {
  @include pixel-font;
  font-size: 9px;
  letter-spacing: 0.08em;
  padding: 2px 6px;
  border-radius: 999px;
  border: 1px solid var(--mc);
  background: rgba(0, 0, 0, 0.4);
  transition: color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
  animation: mult-shine 1.4s ease infinite;

  &.mult-1 { animation: none; }
}

// ── Streak progress bar ───────────────────────────────────────────────────────
.streak-track {
  height: 3px;
  background: rgba(255,255,255,0.08);
  border-radius: 2px;
  overflow: hidden;
}

.streak-fill {
  height: 100%;
  border-radius: 2px;
  background: var(--mc);
  box-shadow: 0 0 6px var(--mc);
  transition: width 0.9s linear, background 0.3s ease;

  &.mult-1 { background: rgba(255,255,255,0.25); box-shadow: none; }
}

// ── Health ────────────────────────────────────────────────────────────────────
.hud-health { flex: 1; }
.health-body { flex: 1; }

.health-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.health-segments {
  display: flex;
  gap: 3px;
  align-items: center;
  margin-top: 2px;
}

.h-seg {
  flex: 1;
  height: 10px;
  border-radius: 2px;
  background: rgba(255,255,255,0.07);
  border: 1px solid rgba(255,255,255,0.08);
  transition: background 0.2s ease, box-shadow 0.2s ease;

  &.seg-high { background: $color-health;     box-shadow: 0 0 6px $color-health;     border-color: $color-health; }
  &.seg-mid  { background: $color-warn;       box-shadow: 0 0 6px $color-warn;       border-color: $color-warn; }
  &.seg-low  { background: $color-health-low; box-shadow: 0 0 8px $color-health-low; border-color: $color-health-low;
               animation: hud-low-pulse 0.5s ease infinite; }
}
</style>
