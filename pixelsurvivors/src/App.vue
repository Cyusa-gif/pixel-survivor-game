<template>
  <div class="game-wrapper" :class="{ 'is-shaking': isShaking }">
    <div class="stars">
      <span v-for="i in 60" :key="i" class="star" :style="starStyle(i)" />
    </div>

    <div class="game-container">
      <header class="game-header">
        <h1 class="game-title">PIXEL<span>SURVIVOR</span></h1>
      </header>

      <GameHUD
        v-if="isStarted && !isGameOver"
        :score="score"
        :health="health"
        :difficulty="difficulty"
        :high-score="highScore"
        :multiplier="multiplier"
        :streak-seconds="streakSeconds"
      />

      <div class="board-area">
        <GameBoard
          :player-x="playerX"
          :player-y="playerY"
          :player-width="PLAYER_WIDTH"
          :player-height="PLAYER_HEIGHT"
          :hazards="hazards"
          :board-width="BOARD_WIDTH"
          :board-height="BOARD_HEIGHT"
          :is-started="isStarted"
          :is-game-over="isGameOver"
          :is-flashing="isFlashing"
          :particles="particles"
        />

        <!-- Streak multiplier popup -->
        <Transition name="streak-popup">
          <div
            v-if="showStreakPopup"
            class="streak-popup"
            :class="`tier-${streakPopupTier}`"
          >{{ streakPopupText }}</div>
        </Transition>

        <!-- Start / Home screen overlay -->
        <Transition name="screen-fade">
          <div v-if="!isStarted" class="screen-overlay">
            <div class="start-panel">
              <div class="start-logo">
                <div class="logo-icon">🎮</div>
                <h2 class="start-title">PIXEL<span>SURVIVOR</span></h2>
                <p class="start-sub">Dodge falling hazards. Survive as long as you can.</p>
              </div>

              <div class="difficulty-section">
                <p class="diff-label">SELECT DIFFICULTY</p>
                <div class="diff-buttons">
                  <button
                    v-for="(cfg, key) in PRESETS"
                    :key="key"
                    class="diff-btn"
                    :class="[`diff-${key}`, { active: selectedPreset === key }]"
                    @click="selectedPreset = key"
                  >
                    <span class="diff-name">{{ cfg.label }}</span>
                    <span class="diff-desc">{{ cfg.desc }}</span>
                  </button>
                </div>
              </div>

              <button class="start-btn" @click="startGame">
                <span class="btn-icon">▶</span>
                <span>PLAY NOW</span>
              </button>

              <p class="key-hint">Arrow Keys / WASD to move in all directions</p>

              <!-- Leaderboard -->
              <div v-if="leaderboard.length" class="lb-section">
                <div class="lb-header">
                  <span class="lb-title">🏆 TOP SCORES</span>
                  <button class="lb-clear" @click.stop="clearBoard">CLEAR</button>
                </div>
                <div class="lb-table">
                  <div
                    v-for="(e, i) in leaderboard"
                    :key="i"
                    class="lb-row"
                    :class="{ 'lb-row--gold': i === 0, 'lb-row--new': e.score === score && e.time === timeSurvived }"
                  >
                    <span class="lb-rank">{{ ['🥇','🥈','🥉','4','5'][i] }}</span>
                    <span class="lb-score">{{ e.score.toString().padStart(5,'0') }}</span>
                    <span class="lb-time">{{ fmtTime(e.time) }}</span>
                    <span class="lb-diff" :class="`lb-diff--${e.difficulty.toLowerCase()}`">{{ e.difficulty }}</span>
                    <span class="lb-date">{{ e.date }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Transition>

        <!-- Game Over overlay -->
        <Transition name="screen-fade">
          <GameOver
            v-if="isGameOver"
            :score="score"
            :high-score="highScore"
            :is-new-high="score >= highScore && score > 0"
            :preset-label="PRESETS[selectedPreset].label"
            :preset-color="PRESETS[selectedPreset].color"
            :time-survived="timeSurvived"
            :player-rank="playerRank"
            @restart="restartGame"
            @home="goHome"
          />
        </Transition>
      </div>

      <div v-if="isStarted && !isGameOver" class="mobile-controls">
        <button
          class="ctrl-btn"
          @touchstart.prevent="pressKey('ArrowLeft')"
          @touchend.prevent="releaseKey('ArrowLeft')"
          @mousedown.prevent="pressKey('ArrowLeft')"
          @mouseup.prevent="releaseKey('ArrowLeft')"
        >◀</button>
        <button
          class="ctrl-btn"
          @touchstart.prevent="pressKey('ArrowRight')"
          @touchend.prevent="releaseKey('ArrowRight')"
          @mousedown.prevent="pressKey('ArrowRight')"
          @mouseup.prevent="releaseKey('ArrowRight')"
        >▶</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import GameBoard from './components/GameBoard.vue'
import GameHUD from './components/GameHUD.vue'
import GameOver from './components/GameOver.vue'
import { useLeaderboard } from './composables/useLeaderboard'

// ─── Constants ────────────────────────────────────────────────────────────────
const BOARD_WIDTH = 600
const BOARD_HEIGHT = 380
const PLAYER_WIDTH = 36
const PLAYER_HEIGHT = 44
const PLAYER_Y = BOARD_HEIGHT - PLAYER_HEIGHT - 8
const PLAYER_SPEED = 7
const BASE_SPAWN_INTERVAL = 1400
const MIN_SPAWN_INTERVAL = 350
const SPAWN_STEP = 90

// ─── Difficulty presets ───────────────────────────────────────────────────────
type DifficultyPreset = 'easy' | 'normal' | 'hard'

const PRESETS: Record<DifficultyPreset, {
  label: string; desc: string; color: string
  speedMult: number; spawnMult: number; damage: number
}> = {
  easy:   { label: 'EASY',   desc: 'Chill mode',     color: '#44ff88', speedMult: 0.65, spawnMult: 1.5,  damage: 8  },
  normal: { label: 'NORMAL', desc: 'Balanced',        color: '#ffaa00', speedMult: 1.0,  spawnMult: 1.0,  damage: 12 },
  hard:   { label: 'HARD',   desc: 'Fast & lethal',   color: '#ff4444', speedMult: 1.55, spawnMult: 0.65, damage: 20 },
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface Hazard {
  id: number; x: number; y: number
  width: number; height: number; speed: number
  color: string; shape: 'rect' | 'diamond' | 'circle'
  rotation: number; rotSpeed: number
}

// ─── Reactive state ───────────────────────────────────────────────────────────
const { entries: leaderboard, saveEntry, clearBoard } = useLeaderboard()

const score = ref(0)
const health = ref(100)
const isGameOver = ref(false)
const isStarted = ref(false)
const difficulty = ref(1)
const highScore = ref(0)
// ─── Particles ────────────────────────────────────────────────────────────────
interface Particle {
  id: number
  x: number; y: number   // SVG origin
  tx: number; ty: number // animation end offset
  r: number
  color: string
}
const particles = reactive<Particle[]>([])
let particleNextId = 0

function spawnParticles(cx: number, cy: number, hitColor: string) {
  const COLORS = [hitColor, '#ff6600', '#ffcc00', '#ff4466', '#ffffff', '#ff2244']
  const count = 16
  const ids: number[] = []
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.7
    const dist  = 18 + Math.random() * 42
    const id = particleNextId++
    ids.push(id)
    particles.push({
      id,
      x: cx, y: cy,
      tx: Math.cos(angle) * dist,
      ty: Math.sin(angle) * dist,
      r: 1.5 + Math.random() * 2.8,
      color: COLORS[i % COLORS.length],
    })
  }
  setTimeout(() => {
    for (const id of ids) {
      const idx = particles.findIndex(p => p.id === id)
      if (idx !== -1) particles.splice(idx, 1)
    }
  }, 480)
}

// ─── Streak / multiplier ──────────────────────────────────────────────────────
const streakSeconds    = ref(0)
const multiplier       = computed(() => Math.min(5, Math.floor(streakSeconds.value / 10) + 1))
const showStreakPopup  = ref(false)
const streakPopupText  = ref('')
const streakPopupTier  = ref(1)
let streakPopupTimer: ReturnType<typeof setTimeout> | null = null

const POPUP_MSGS: Record<number, string> = {
  2: '× 2   S T R E A K !',
  3: '× 3   O N   F I R E !',
  4: '× 4   U N S T O P P A B L E !',
  5: '× 5   G O D L I K E !',
}

function triggerStreakPopup(mult: number) {
  streakPopupText.value = POPUP_MSGS[mult] ?? `× ${mult} STREAK!`
  streakPopupTier.value  = mult
  showStreakPopup.value  = true
  if (streakPopupTimer) clearTimeout(streakPopupTimer)
  streakPopupTimer = setTimeout(() => { showStreakPopup.value = false }, 1800)
}

const isShaking = ref(false)
const isFlashing = ref(false)
const timeSurvived = ref(0)
const playerRank = ref<number | null>(null)
const selectedPreset = ref<DifficultyPreset>('normal')
const playerX = ref(BOARD_WIDTH / 2 - PLAYER_WIDTH / 2)
const playerY = ref(PLAYER_Y)
const hazards = reactive<Hazard[]>([])

// ─── Internal loop refs ───────────────────────────────────────────────────────
let gameLoopId: ReturnType<typeof setInterval> | null = null
let scoreLoopId: ReturnType<typeof setInterval> | null = null
let spawnLoopId: ReturnType<typeof setInterval> | null = null
let hazardId = 0
const keysDown = new Set<string>()

// ─── Difficulty helpers ───────────────────────────────────────────────────────
function spawnInterval() {
  const base = Math.max(MIN_SPAWN_INTERVAL, BASE_SPAWN_INTERVAL - (difficulty.value - 1) * SPAWN_STEP)
  return base * PRESETS[selectedPreset.value].spawnMult
}

function hazardSpeed() {
  return (1.8 + (difficulty.value - 1) * 0.65) * PRESETS[selectedPreset.value].speedMult
}

// ─── Game start / stop ────────────────────────────────────────────────────────
function startGame() {
  score.value = 0
  health.value = 100
  isGameOver.value = false
  difficulty.value = 1
  hazards.splice(0)
  playerX.value = BOARD_WIDTH / 2 - PLAYER_WIDTH / 2
  playerY.value = PLAYER_Y
  isStarted.value = true

  timeSurvived.value = 0
  streakSeconds.value = 0

  scoreLoopId = setInterval(() => {
    if (isGameOver.value) return
    const prevMult = multiplier.value
    streakSeconds.value++
    const newMult = multiplier.value
    score.value += newMult        // score reflects multiplier
    timeSurvived.value++
    if (newMult > prevMult) triggerStreakPopup(newMult)
    // Difficulty from time (not score) so streak doesn't spike difficulty
    const next = Math.floor(timeSurvived.value / 10) + 1
    if (next !== difficulty.value) {
      difficulty.value = next
      restartSpawnLoop()
    }
  }, 1000)

  gameLoopId = setInterval(tick, 16)
  startSpawnLoop()
}

function startSpawnLoop() {
  spawnLoopId = setInterval(spawnHazard, spawnInterval())
}

function restartSpawnLoop() {
  if (spawnLoopId) clearInterval(spawnLoopId)
  startSpawnLoop()
}

function stopLoops() {
  if (gameLoopId)  { clearInterval(gameLoopId);  gameLoopId  = null }
  if (scoreLoopId) { clearInterval(scoreLoopId); scoreLoopId = null }
  if (spawnLoopId) { clearInterval(spawnLoopId); spawnLoopId = null }
}

function endGame() {
  isGameOver.value = true
  if (score.value > highScore.value) highScore.value = score.value
  playerRank.value = saveEntry({
    score: score.value,
    time: timeSurvived.value,
    difficulty: PRESETS[selectedPreset.value].label,
    date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
  })
  stopLoops()
}

function restartGame() {
  stopLoops()
  setTimeout(startGame, 80)
}

function goHome() {
  stopLoops()
  hazards.splice(0)
  isStarted.value = false
  isGameOver.value = false
}

// ─── Main tick ────────────────────────────────────────────────────────────────
function tick() {
  if (isGameOver.value) return

  if (keysDown.has('ArrowLeft')  || keysDown.has('a')) playerX.value = Math.max(0, playerX.value - PLAYER_SPEED)
  if (keysDown.has('ArrowRight') || keysDown.has('d')) playerX.value = Math.min(BOARD_WIDTH - PLAYER_WIDTH, playerX.value + PLAYER_SPEED)
  if (keysDown.has('ArrowUp')    || keysDown.has('w')) playerY.value = Math.max(Math.floor(BOARD_HEIGHT * 0.25), playerY.value - PLAYER_SPEED)
  if (keysDown.has('ArrowDown')  || keysDown.has('s')) playerY.value = Math.min(PLAYER_Y, playerY.value + PLAYER_SPEED)

  for (let i = hazards.length - 1; i >= 0; i--) {
    hazards[i].y        += hazards[i].speed
    hazards[i].rotation += hazards[i].rotSpeed

    const px = playerX.value, py = playerY.value + 8
    const pw = PLAYER_WIDTH - 8, ph = PLAYER_HEIGHT - 12
    const { x: hx, y: hy, width: hw, height: hh } = hazards[i]

    if (hy + hh >= py && hy <= py + ph && hx + hw > px && hx < px + pw) {
      const hitColor = hazards[i].color
      const cx = px + pw / 2
      const cy = py + ph / 2
      health.value = Math.max(0, health.value - PRESETS[selectedPreset.value].damage)
      hazards.splice(i, 1)
      streakSeconds.value = 0     // break the streak on hit
      triggerShake()
      spawnParticles(cx, cy, hitColor)
      if (health.value <= 0) { endGame(); return }
      continue
    }
    if (hy > BOARD_HEIGHT + 10) hazards.splice(i, 1)
  }
}

function triggerShake() {
  isShaking.value = true
  isFlashing.value = true
  setTimeout(() => { isShaking.value = false }, 320)
  setTimeout(() => { isFlashing.value = false }, 200)
}

// ─── Hazard spawning ──────────────────────────────────────────────────────────
const HAZARD_COLORS = ['#ff2244','#ff6600','#cc00ff','#0088ff','#ff1177','#ffcc00','#00bbff','#ff4400']
const SHAPES: Hazard['shape'][] = ['rect', 'diamond', 'circle']

function spawnHazard() {
  if (isGameOver.value) return
  const w = 20 + Math.floor(Math.random() * 28)
  hazards.push({
    id: hazardId++,
    x: Math.random() * (BOARD_WIDTH - w - 4) + 2,
    y: -w - 5,
    width: w, height: w,
    speed: hazardSpeed() + Math.random() * 1.2,
    color: HAZARD_COLORS[Math.floor(Math.random() * HAZARD_COLORS.length)],
    shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
    rotation: 0,
    rotSpeed: (Math.random() - 0.5) * 4,
  })
}

// ─── Keyboard handling ────────────────────────────────────────────────────────
function onKeyDown(e: KeyboardEvent) {
  if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','a','d'].includes(e.key)) e.preventDefault()
  keysDown.add(e.key)
  if ((e.key === ' ' || e.key === 'Enter') && !isStarted.value) startGame()
}
function onKeyUp(e: KeyboardEvent) { keysDown.delete(e.key) }
function pressKey(key: string)  { keysDown.add(key) }
function releaseKey(key: string) { keysDown.delete(key) }

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fmtTime(s: number) {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return m > 0 ? `${m}m${sec.toString().padStart(2,'0')}s` : `${s}s`
}

// ─── Star decoration ──────────────────────────────────────────────────────────
function starStyle(i: number) {
  const seed = i * 137.5
  return {
    left: `${seed % 100}%`,
    top: `${(seed * 1.618) % 100}%`,
    width:  `${1 + (i % 3)}px`,
    height: `${1 + (i % 3)}px`,
    animationDelay:    `${(i * 0.23) % 4}s`,
    animationDuration: `${2 + (i % 3)}s`,
  }
}

// ─── Lifecycle ────────────────────────────────────────────────────────────────
onMounted(() => {
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup',   onKeyUp)
})
onUnmounted(() => {
  stopLoops()
  window.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('keyup',   onKeyUp)
})
</script>

<style lang="scss">
@use './styles/main.scss' as *;

.game-wrapper {
  width: 100%; height: 100%;
  display: flex; align-items: center; justify-content: center;
  position: relative; overflow: hidden;
  &.is-shaking { animation: shake 0.3s ease; }
}

.stars {
  position: fixed; inset: 0; pointer-events: none; z-index: 0;
  .star {
    position: absolute; border-radius: 50%;
    background: #fff; animation: twinkle linear infinite; opacity: 0.4;
  }
}

.game-container {
  position: relative; z-index: 1;
  display: flex; flex-direction: column; align-items: center;
  gap: 12px; padding: 16px;
}

.game-header {
  text-align: center;
  .game-title {
    @include pixel-font;
    font-size: clamp(12px, 3vw, 22px);
    color: $color-primary; text-shadow: $glow-primary; letter-spacing: 0.15em;
    span { color: $color-accent; text-shadow: $glow-accent; }
  }
}

// ─── Board area (positions overlays over the SVG) ─────────────────────────────
.board-area {
  position: relative;
}

// ─── Start / Home screen overlay ──────────────────────────────────────────────
.screen-overlay {
  position: absolute; inset: 0; z-index: 10;
  display: flex; align-items: center; justify-content: center;
  background: rgba(5, 5, 20, 0.88);
  backdrop-filter: blur(6px);
  border-radius: $radius-md;
}

.start-panel {
  display: flex; flex-direction: column; align-items: center;
  gap: 22px; padding: 28px 36px; width: 100%;
  max-width: 480px;
}

.start-logo {
  display: flex; flex-direction: column; align-items: center; gap: 8px;
  .logo-icon { font-size: 40px; line-height: 1; filter: drop-shadow(0 0 14px $color-primary); }
  .start-title {
    @include pixel-font;
    font-size: clamp(14px, 3.5vw, 22px);
    color: $color-primary; text-shadow: $glow-primary; letter-spacing: 0.15em;
    span { color: $color-accent; text-shadow: $glow-accent; }
  }
  .start-sub {
    font-family: $font-hud; font-size: 12px;
    color: $color-text-dim; letter-spacing: 0.05em;
  }
}

.difficulty-section {
  width: 100%;
  .diff-label {
    @include pixel-font; font-size: 8px;
    color: $color-text-dim; text-align: center;
    margin-bottom: 12px; letter-spacing: 0.12em;
  }
}

.diff-buttons {
  display: flex; gap: 10px; justify-content: center;
}

.diff-btn {
  flex: 1; max-width: 140px;
  display: flex; flex-direction: column; align-items: center; gap: 4px;
  padding: 12px 10px; border-radius: $radius-md;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.1);
  cursor: pointer;
  transition: all 0.18s ease;
  font-family: $font-pixel;
  color: $color-text-dim;

  .diff-name { font-size: 9px; letter-spacing: 0.1em; }
  .diff-desc  { font-family: $font-hud; font-size: 10px; color: $color-text-dim; }

  &.diff-easy.active  { border-color: #44ff88; background: rgba(68,255,136,0.12); color: #44ff88; box-shadow: 0 0 16px rgba(68,255,136,0.3); .diff-desc { color: #44ff88; } }
  &.diff-normal.active { border-color: $color-warn; background: rgba(255,170,0,0.12); color: $color-warn; box-shadow: 0 0 16px rgba(255,170,0,0.3); .diff-desc { color: $color-warn; } }
  &.diff-hard.active  { border-color: $color-accent; background: rgba(255,68,102,0.12); color: $color-accent; box-shadow: 0 0 16px rgba(255,68,102,0.3); .diff-desc { color: $color-accent; } }

  &:hover:not(.active) {
    border-color: rgba(255,255,255,0.3);
    background: rgba(255,255,255,0.08);
    color: $color-text;
  }
}

.start-btn {
  @include button-glow($color-primary);
  display: flex; align-items: center; justify-content: center;
  gap: 10px; width: 100%; max-width: 260px;
  padding: 16px 32px; border-radius: $radius-md;
  font-size: clamp(10px, 2.5vw, 14px); letter-spacing: 0.14em;

  .btn-icon { font-size: 14px; }
}

.key-hint {
  @include pixel-font; font-size: 7px;
  color: $color-text-dim; letter-spacing: 0.08em;
}

// ─── Leaderboard ─────────────────────────────────────────────────────────────
.lb-section {
  width: 100%;
}

.lb-header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 8px;
}

.lb-title {
  @include pixel-font; font-size: 8px;
  color: $color-warn; letter-spacing: 0.12em;
}

.lb-clear {
  @include pixel-font; font-size: 7px; letter-spacing: 0.08em;
  color: $color-text-dim; background: transparent;
  border: 1px solid rgba(255,255,255,0.12); border-radius: $radius-sm;
  padding: 3px 8px; cursor: pointer;
  transition: all 0.15s ease;
  &:hover { color: $color-accent; border-color: $color-accent; }
}

.lb-table {
  display: flex; flex-direction: column; gap: 4px;
}

.lb-row {
  display: grid;
  grid-template-columns: 28px 1fr 56px 56px 52px;
  align-items: center; gap: 8px;
  padding: 7px 12px; border-radius: $radius-sm;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.06);
  font-family: $font-pixel; font-size: 8px;
  transition: background 0.15s;

  &--gold { background: rgba(255,170,0,0.08); border-color: rgba(255,170,0,0.2); }
  &--new  { background: rgba(0,255,204,0.08); border-color: rgba(0,255,204,0.25); }
}

.lb-rank  { font-size: 13px; text-align: center; }
.lb-score { color: $color-primary; letter-spacing: 0.06em; }
.lb-time  { color: $color-text-dim; font-size: 7px; }
.lb-date  { color: $color-text-dim; font-size: 7px; text-align: right; }

.lb-diff {
  font-size: 7px; padding: 2px 6px; border-radius: 999px; text-align: center;
  &--easy   { color: #44ff88; border: 1px solid rgba(68,255,136,0.4); }
  &--normal { color: $color-warn; border: 1px solid rgba(255,170,0,0.4); }
  &--hard   { color: $color-accent; border: 1px solid rgba(255,68,102,0.4); }
}

// ─── Streak popup ─────────────────────────────────────────────────────────────
.streak-popup {
  position: absolute;
  top: 30%;
  left: 50%;
  transform: translateX(-50%);
  @include pixel-font;
  font-size: 18px;
  letter-spacing: 0.15em;
  pointer-events: none;
  z-index: 20;
  white-space: nowrap;
  padding: 10px 24px;
  border-radius: $radius-md;
  border: 1px solid currentColor;
  backdrop-filter: blur(6px);

  &.tier-2 { color: $color-primary; background: rgba(0,255,204,0.12); box-shadow: 0 0 24px rgba(0,255,204,0.3); }
  &.tier-3 { color: $color-warn;    background: rgba(255,170,0,0.12);  box-shadow: 0 0 24px rgba(255,170,0,0.35); }
  &.tier-4 { color: #ff8800;        background: rgba(255,136,0,0.12);  box-shadow: 0 0 28px rgba(255,136,0,0.4); }
  &.tier-5 { color: #ff2288;        background: rgba(255,34,136,0.15); box-shadow: 0 0 32px rgba(255,34,136,0.5); }
}

.streak-popup-enter-active { transition: opacity 0.15s ease, transform 0.18s cubic-bezier(0.2,0.8,0.4,1); }
.streak-popup-leave-active { transition: opacity 0.5s ease, transform 0.5s ease; }
.streak-popup-enter-from   { opacity: 0; transform: translateX(-50%) translateY(12px) scale(0.85); }
.streak-popup-leave-to     { opacity: 0; transform: translateX(-50%) translateY(-22px) scale(1.08); }

// ─── Screen transitions ────────────────────────────────────────────────────────
.screen-fade-enter-active { transition: opacity 0.25s ease, transform 0.25s ease; }
.screen-fade-leave-active { transition: opacity 0.2s ease; }
.screen-fade-enter-from   { opacity: 0; transform: scale(0.97); }
.screen-fade-leave-to     { opacity: 0; }

// ─── Mobile controls ──────────────────────────────────────────────────────────
.mobile-controls {
  display: flex; gap: 24px; margin-top: 8px;
  @media (hover: hover) { display: none; }
  .ctrl-btn {
    @include button-glow($color-primary);
    width: 72px; height: 52px; border-radius: $radius-md;
    font-size: 22px; display: flex; align-items: center; justify-content: center;
    touch-action: none;
  }
}
</style>
