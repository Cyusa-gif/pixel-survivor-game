<template>
  <div class="go-overlay">
    <div class="go-panel">

      <!-- Decorative corner accents -->
      <span class="corner tl"/>
      <span class="corner tr"/>
      <span class="corner bl"/>
      <span class="corner br"/>

      <!-- Death icon -->
      <div class="go-icon">
        <span class="icon-skull">☠</span>
        <div class="icon-ring"/>
      </div>

      <!-- Title -->
      <div class="go-title-wrap">
        <h2 class="go-title" data-text="GAME OVER">GAME OVER</h2>
        <div class="go-title-line"/>
      </div>

      <!-- Difficulty + rank row -->
      <div class="badge-row">
        <div class="diff-badge" :style="{ '--badge-color': presetColor }">
          {{ presetLabel }} MODE
        </div>
        <div v-if="playerRank" class="rank-badge" :class="`rank-${playerRank}`">
          {{ rankIcon }} RANK #{{ playerRank }}
        </div>
      </div>

      <!-- Score block -->
      <div class="score-block">
        <div class="score-item primary">
          <span class="si-label">FINAL SCORE</span>
          <span class="si-value">{{ padded(score) }}</span>
        </div>

        <div class="score-divider"/>

        <div class="stats-row">
          <div class="stat-cell">
            <span class="si-label">TIME SURVIVED</span>
            <span class="si-value stat-time">{{ formattedTime }}</span>
          </div>
          <div class="stat-cell" v-if="isNewHigh">
            <span class="si-label new-high-label">⭐ NEW BEST ⭐</span>
          </div>
          <div class="stat-cell" v-else>
            <span class="si-label">BEST SCORE</span>
            <span class="si-value dim">{{ padded(highScore) }}</span>
          </div>
        </div>
      </div>

      <!-- Action buttons -->
      <div class="go-actions">
        <button class="action-btn btn-play" @click="$emit('restart')">
          <span class="ab-icon">▶</span>
          <div class="ab-text">
            <span class="ab-main">PLAY AGAIN</span>
            <span class="ab-sub">Same difficulty</span>
          </div>
        </button>

        <button class="action-btn btn-home" @click="$emit('home')">
          <span class="ab-icon">⌂</span>
          <div class="ab-text">
            <span class="ab-main">HOME</span>
            <span class="ab-sub">Change difficulty</span>
          </div>
        </button>
      </div>

      <!-- Hint -->
      <p class="go-hint">Press <kbd>Enter</kbd> to play again &nbsp;·&nbsp; <kbd>Esc</kbd> for home</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'

const props = defineProps<{
  score: number
  highScore: number
  isNewHigh: boolean
  presetLabel: string
  presetColor: string
  timeSurvived: number
  playerRank: number | null
}>()

const emit = defineEmits<{ restart: []; home: [] }>()

function padded(n: number) {
  return n.toString().padStart(5, '0')
}

const rankIcon = computed(() => ['🥇','🥈','🥉','4️⃣','5️⃣'][( props.playerRank ?? 1) - 1] ?? '')

const formattedTime = computed(() => {
  const m = Math.floor(props.timeSurvived / 60)
  const s = props.timeSurvived % 60
  return m > 0 ? `${m}m ${s.toString().padStart(2,'0')}s` : `${s}s`
})

function onKey(e: KeyboardEvent) {
  if (e.key === 'Enter' || e.key === ' ') emit('restart')
  if (e.key === 'Escape') emit('home')
}

onMounted(() => window.addEventListener('keydown', onKey))
onUnmounted(() => window.removeEventListener('keydown', onKey))
</script>

<style lang="scss" scoped>
@use '../styles/main.scss' as *;

// ─── Animations ───────────────────────────────────────────────────────────────
@keyframes go-panel-in {
  from { opacity: 0; transform: translateY(28px) scale(0.95); }
  to   { opacity: 1; transform: translateY(0)    scale(1);    }
}

@keyframes skull-bounce {
  0%, 100% { transform: translateY(0) rotate(-4deg); }
  50%       { transform: translateY(-8px) rotate(4deg); }
}

@keyframes ring-pulse {
  0%   { transform: scale(0.8); opacity: 0.8; }
  100% { transform: scale(1.8); opacity: 0; }
}

@keyframes glitch {
  0%   { clip-path: inset(0 0 100% 0); transform: none; }
  10%  { clip-path: inset(20% 0 60% 0); transform: translateX(-4px); }
  20%  { clip-path: inset(60% 0 20% 0); transform: translateX(4px); }
  30%  { clip-path: inset(0 0 80% 0); transform: none; }
  40%  { clip-path: inset(40% 0 40% 0); transform: translateX(-3px); }
  50%  { clip-path: inset(80% 0 5% 0); transform: translateX(3px); }
  100% { clip-path: inset(0 0 0 0); transform: none; }
}

@keyframes scan-go {
  0%   { background-position: 0 -100%; }
  100% { background-position: 0 200%; }
}

// ─── Overlay ──────────────────────────────────────────────────────────────────
.go-overlay {
  position: absolute; inset: 0; z-index: 20;
  display: flex; align-items: center; justify-content: center;
  background: rgba(2, 2, 16, 0.9);
  backdrop-filter: blur(8px);
  border-radius: $radius-md;
}

// ─── Panel ────────────────────────────────────────────────────────────────────
.go-panel {
  position: relative;
  display: flex; flex-direction: column; align-items: center;
  gap: 18px; padding: 36px 40px;
  width: min(480px, 92%);
  background: linear-gradient(160deg, rgba(20,4,32,0.95) 0%, rgba(6,6,30,0.98) 100%);
  border-radius: $radius-lg;
  @include glow-border($color-accent, 1.2);
  animation: go-panel-in 0.35s cubic-bezier(0.22, 1, 0.36, 1) both;

  // Scan-line shimmer on the panel background
  &::before {
    content: '';
    position: absolute; inset: 0; border-radius: inherit;
    background: repeating-linear-gradient(
      0deg,
      transparent 0px,
      transparent 3px,
      rgba(255,255,255,0.012) 3px,
      rgba(255,255,255,0.012) 4px
    );
    pointer-events: none;
  }
}

// ─── Corner accents ───────────────────────────────────────────────────────────
.corner {
  position: absolute; width: 16px; height: 16px;
  border-color: $color-accent; border-style: solid;
  &.tl { top: 8px;  left: 8px;  border-width: 2px 0 0 2px; }
  &.tr { top: 8px;  right: 8px; border-width: 2px 2px 0 0; }
  &.bl { bottom: 8px; left: 8px;  border-width: 0 0 2px 2px; }
  &.br { bottom: 8px; right: 8px; border-width: 0 2px 2px 0; }
}

// ─── Icon ─────────────────────────────────────────────────────────────────────
.go-icon {
  position: relative; display: flex; align-items: center; justify-content: center;
  width: 72px; height: 72px;

  .icon-skull {
    font-size: 48px; line-height: 1; position: relative; z-index: 2;
    filter: drop-shadow(0 0 16px $color-accent);
    animation: skull-bounce 2.2s ease-in-out infinite;
  }

  .icon-ring {
    position: absolute; inset: 0; border-radius: 50%;
    border: 2px solid $color-accent;
    animation: ring-pulse 1.8s ease-out infinite;
  }
}

// ─── Title ────────────────────────────────────────────────────────────────────
.go-title-wrap {
  display: flex; flex-direction: column; align-items: center; gap: 8px;
}

.go-title {
  @include pixel-font;
  font-size: clamp(16px, 4vw, 26px);
  color: $color-accent;
  text-shadow: 0 0 12px $color-accent, 0 0 30px rgba(255,68,102,0.5);
  letter-spacing: 0.18em;
  position: relative;

  // Glitch pseudo-elements
  &::before,
  &::after {
    content: attr(data-text);
    position: absolute; top: 0; left: 0; width: 100%;
    font-family: inherit; font-size: inherit; letter-spacing: inherit;
  }
  &::before {
    color: #00ffff; opacity: 0.7;
    animation: glitch 4s steps(1) infinite;
    animation-delay: 0.5s;
    mix-blend-mode: screen;
  }
  &::after {
    color: #ff00ff; opacity: 0.5;
    animation: glitch 4s steps(1) infinite;
    animation-delay: 1.2s;
    mix-blend-mode: screen;
  }
}

.go-title-line {
  width: 80%; height: 1px;
  background: linear-gradient(90deg, transparent, $color-accent, transparent);
  box-shadow: 0 0 8px $color-accent;
}

// ─── Badge row ────────────────────────────────────────────────────────────────
.badge-row {
  display: flex; align-items: center; gap: 10px; flex-wrap: wrap; justify-content: center;
}

// ─── Rank badge ───────────────────────────────────────────────────────────────
.rank-badge {
  @include pixel-font;
  font-size: 9px; letter-spacing: 0.12em;
  padding: 5px 14px; border-radius: 999px;
  display: flex; align-items: center; gap: 6px;

  &.rank-1 { color: #ffd700; border: 1px solid #ffd700; background: rgba(255,215,0,0.12); box-shadow: 0 0 10px rgba(255,215,0,0.3); }
  &.rank-2 { color: #c0c0c0; border: 1px solid #c0c0c0; background: rgba(192,192,192,0.1); }
  &.rank-3 { color: #cd7f32; border: 1px solid #cd7f32; background: rgba(205,127,50,0.1); }
  &.rank-4, &.rank-5 { color: $color-text-dim; border: 1px solid rgba(255,255,255,0.15); background: rgba(255,255,255,0.05); }
}

// ─── Difficulty badge ─────────────────────────────────────────────────────────
.diff-badge {
  @include pixel-font;
  font-size: 9px; letter-spacing: 0.14em;
  padding: 5px 14px; border-radius: 999px;
  color: var(--badge-color);
  border: 1px solid var(--badge-color);
  background: color-mix(in srgb, var(--badge-color) 12%, transparent);
  box-shadow: 0 0 10px color-mix(in srgb, var(--badge-color) 40%, transparent);
}

// ─── Score block ──────────────────────────────────────────────────────────────
.score-block {
  @include hud-panel;
  width: 100%; padding: 4px 0;
  display: flex; flex-direction: column;
}

.score-divider {
  height: 1px; margin: 0 20px;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
}

.score-item {
  display: flex; align-items: center;
  justify-content: space-between;
  padding: 12px 20px;

  &.primary { padding: 16px 20px; }
}

.si-label {
  @include pixel-font; font-size: 8px;
  color: $color-text-dim; letter-spacing: 0.1em;
}

.si-value {
  @include pixel-font; font-size: 20px;
  color: $color-primary; text-shadow: $glow-primary;

  .score-item.primary & { font-size: 26px; }
  &.dim { color: $color-text-dim; text-shadow: none; font-size: 16px; }
}

.stats-row {
  display: flex;
  align-items: stretch;
}

.stat-cell {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 12px 20px;
  justify-content: center;

  &:not(:last-child) {
    border-right: 1px solid rgba(255, 255, 255, 0.07);
  }
}

.stat-time {
  color: $color-primary !important;
  font-size: 16px !important;
  text-shadow: $glow-primary !important;
}

.new-high-label {
  color: $color-warn !important;
  text-shadow: $glow-warn;
  font-size: 9px !important;
  text-align: center; width: 100%;
}

// ─── Action buttons ───────────────────────────────────────────────────────────
.go-actions {
  display: flex; gap: 12px; width: 100%;
}

.action-btn {
  flex: 1; display: flex; align-items: center;
  gap: 12px; padding: 14px 18px; border-radius: $radius-md;
  cursor: pointer; border: none; font-family: $font-pixel;
  transition: all 0.18s ease; text-align: left;

  .ab-icon { font-size: 18px; flex-shrink: 0; }
  .ab-text  { display: flex; flex-direction: column; gap: 3px; }
  .ab-main  { font-size: clamp(8px, 2vw, 11px); letter-spacing: 0.1em; }
  .ab-sub   { font-family: $font-hud; font-size: 10px; opacity: 0.7; }
}

.btn-play {
  background: rgba(0, 255, 204, 0.1);
  border: 1.5px solid $color-primary;
  color: $color-primary;
  box-shadow: 0 0 16px rgba(0,255,204,0.25), inset 0 0 16px rgba(0,255,204,0.05);

  &:hover {
    background: rgba(0, 255, 204, 0.18);
    box-shadow: 0 0 28px rgba(0,255,204,0.5), inset 0 0 20px rgba(0,255,204,0.1);
    transform: translateY(-2px);
  }
  &:active { transform: translateY(0); }
}

.btn-home {
  background: rgba(255, 255, 255, 0.04);
  border: 1.5px solid rgba(255, 255, 255, 0.2);
  color: $color-text;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255,255,255,0.4);
    transform: translateY(-2px);
  }
  &:active { transform: translateY(0); }
}

// ─── Hint ─────────────────────────────────────────────────────────────────────
.go-hint {
  @include pixel-font; font-size: 7px;
  color: $color-text-dim; letter-spacing: 0.06em; text-align: center;

  kbd {
    font-family: $font-pixel;
    background: rgba(255,255,255,0.1);
    border: 1px solid rgba(255,255,255,0.2);
    border-radius: 3px; padding: 1px 5px;
    font-size: 7px;
  }
}
</style>
