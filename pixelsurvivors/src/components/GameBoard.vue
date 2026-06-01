<template>
  <div class="board-wrapper">
    <svg
      class="game-board"
      :viewBox="`0 0 ${boardWidth} ${boardHeight}`"
      :width="boardWidth"
      :height="boardHeight"
    >
      <defs>
        <!-- Glow filters -->
        <filter id="player-glow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="5" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="hazard-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="5" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="star-glow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="2.5" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>

        <!-- Nebula gradients -->
        <radialGradient id="neb-purple" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stop-color="#7700ff" stop-opacity="0.22"/>
          <stop offset="100%" stop-color="#7700ff" stop-opacity="0"/>
        </radialGradient>
        <radialGradient id="neb-blue" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stop-color="#0044ff" stop-opacity="0.18"/>
          <stop offset="100%" stop-color="#0044ff" stop-opacity="0"/>
        </radialGradient>
        <radialGradient id="neb-teal" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stop-color="#00ffcc" stop-opacity="0.1"/>
          <stop offset="100%" stop-color="#00ffcc" stop-opacity="0"/>
        </radialGradient>
        <radialGradient id="neb-pink" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stop-color="#ff0066" stop-opacity="0.12"/>
          <stop offset="100%" stop-color="#ff0066" stop-opacity="0"/>
        </radialGradient>

        <!-- Vignette -->
        <radialGradient id="vignette" cx="50%" cy="50%" r="72%" fx="50%" fy="50%">
          <stop offset="50%"  stop-color="transparent" stop-opacity="0"/>
          <stop offset="100%" stop-color="#000"         stop-opacity="0.85"/>
        </radialGradient>

        <!-- Grid -->
        <pattern id="grid-bg" width="50" height="50" patternUnits="userSpaceOnUse">
          <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(0,255,204,0.04)" stroke-width="0.6"/>
        </pattern>

        <!-- Scanlines -->
        <pattern id="scanlines" width="600" height="3" patternUnits="userSpaceOnUse">
          <rect width="600" height="1" y="0" fill="rgba(0,0,0,0.16)"/>
        </pattern>

        <!-- Thruster gradient -->
        <radialGradient id="thruster-glow" cx="50%" cy="60%" r="60%">
          <stop offset="0%"   stop-color="#ffcc00" stop-opacity="1"/>
          <stop offset="40%"  stop-color="#ff5500" stop-opacity="0.9"/>
          <stop offset="100%" stop-color="#ff0033" stop-opacity="0"/>
        </radialGradient>
      </defs>

      <!-- ── Deep space background ── -->
      <rect width="100%" height="100%" fill="#03030e"/>

      <!-- Nebula blobs -->
      <ellipse cx="110" cy="90"  rx="200" ry="130" fill="url(#neb-purple)"/>
      <ellipse cx="500" cy="270" rx="180" ry="120" fill="url(#neb-blue)"/>
      <ellipse cx="280" cy="370" rx="160" ry="90"  fill="url(#neb-teal)"/>
      <ellipse cx="420" cy="80"  rx="130" ry="80"  fill="url(#neb-pink)"/>

      <!-- Grid overlay -->
      <rect width="100%" height="100%" fill="url(#grid-bg)"/>

      <!-- ── Parallax star layers ── -->
      <g class="star-layer star-slow">
        <circle v-for="s in starsL1" :key="s.id" :cx="s.x" :cy="s.y" :r="s.r" fill="white" :opacity="s.o"/>
        <circle v-for="s in starsL1" :key="'b'+s.id" :cx="s.x" :cy="s.y - boardHeight" :r="s.r" fill="white" :opacity="s.o"/>
      </g>
      <g class="star-layer star-medium">
        <circle v-for="s in starsL2" :key="s.id" :cx="s.x" :cy="s.y" :r="s.r" fill="white" :opacity="s.o"/>
        <circle v-for="s in starsL2" :key="'b'+s.id" :cx="s.x" :cy="s.y - boardHeight" :r="s.r" fill="white" :opacity="s.o"/>
      </g>
      <g class="star-layer star-fast" filter="url(#star-glow)">
        <circle v-for="s in starsL3" :key="s.id" :cx="s.x" :cy="s.y" :r="s.r" :fill="s.c" :opacity="s.o"/>
        <circle v-for="s in starsL3" :key="'b'+s.id" :cx="s.x" :cy="s.y - boardHeight" :r="s.r" :fill="s.c" :opacity="s.o"/>
      </g>

      <!-- Vignette -->
      <rect width="100%" height="100%" fill="url(#vignette)" pointer-events="none"/>

      <!-- ── Hazards with motion trails ── -->
      <g v-for="h in hazards" :key="h.id">
        <!-- Trail ghost 2 (furthest back) -->
        <g :opacity="0.12">
          <rect v-if="h.shape==='rect'"
            :x="h.x" :y="h.y - h.speed * 7" :width="h.width" :height="h.height"
            :fill="h.color" :rx="3"
            :transform="`rotate(${h.rotation},${h.x+h.width/2},${h.y-h.speed*7+h.height/2})`"/>
          <polygon v-else-if="h.shape==='diamond'" :points="trailDiamondPoints(h, h.speed*7)" :fill="h.color"/>
          <circle v-else :cx="h.x+h.width/2" :cy="h.y-h.speed*7+h.height/2" :r="h.width/2" :fill="h.color"/>
        </g>
        <!-- Trail ghost 1 -->
        <g :opacity="0.28">
          <rect v-if="h.shape==='rect'"
            :x="h.x" :y="h.y - h.speed * 3.5" :width="h.width" :height="h.height"
            :fill="h.color" :rx="3"
            :transform="`rotate(${h.rotation},${h.x+h.width/2},${h.y-h.speed*3.5+h.height/2})`"/>
          <polygon v-else-if="h.shape==='diamond'" :points="trailDiamondPoints(h, h.speed*3.5)" :fill="h.color"/>
          <circle v-else :cx="h.x+h.width/2" :cy="h.y-h.speed*3.5+h.height/2" :r="h.width/2" :fill="h.color"/>
        </g>
        <!-- Main hazard -->
        <g filter="url(#hazard-glow)">
          <rect v-if="h.shape==='rect'"
            :x="h.x" :y="h.y" :width="h.width" :height="h.height"
            :fill="h.color" :opacity="0.92" :rx="3"
            :transform="`rotate(${h.rotation},${h.x+h.width/2},${h.y+h.height/2})`"/>
          <polygon v-else-if="h.shape==='diamond'"
            :points="diamondPoints(h)" :fill="h.color" :opacity="0.92"
            :transform="`rotate(${h.rotation},${h.x+h.width/2},${h.y+h.height/2})`"/>
          <circle v-else :cx="h.x+h.width/2" :cy="h.y+h.height/2" :r="h.width/2" :fill="h.color" :opacity="0.92"/>
          <!-- Specular highlight -->
          <rect v-if="h.shape==='rect'"
            :x="h.x+3" :y="h.y+3" :width="h.width*0.3" :height="h.height*0.3"
            fill="rgba(255,255,255,0.45)" :rx="1"
            :transform="`rotate(${h.rotation},${h.x+h.width/2},${h.y+h.height/2})`"/>
        </g>
      </g>

      <!-- ── Player spaceship ── -->
      <g
        v-if="isStarted"
        :transform="`translate(${playerX},${playerY})`"
        filter="url(#player-glow)"
        class="player"
      >
        <!-- Thruster flame -->
        <ellipse cx="18" cy="45" rx="9"  ry="6"  fill="url(#thruster-glow)" class="thruster-outer"/>
        <ellipse cx="18" cy="43" rx="5"  ry="4"  fill="#ff7700"             class="thruster-mid"/>
        <ellipse cx="18" cy="42" rx="3"  ry="2.5" fill="#ffdd00"            class="thruster-inner"/>

        <!-- Left engine -->
        <ellipse cx="9"  cy="38" rx="4" ry="2.5" fill="url(#thruster-glow)" opacity="0.7" class="thruster-outer"/>
        <!-- Right engine -->
        <ellipse cx="27" cy="38" rx="4" ry="2.5" fill="url(#thruster-glow)" opacity="0.7" class="thruster-outer"/>

        <!-- Left wing -->
        <polygon points="6,30 18,22 1,44"  fill="#008866"/>
        <!-- Right wing -->
        <polygon points="30,30 18,22 35,44" fill="#008866"/>

        <!-- Wing tips (bright) -->
        <polygon points="1,44 6,30 2,37"   fill="#00ffcc" opacity="0.7"/>
        <polygon points="35,44 30,30 34,37" fill="#00ffcc" opacity="0.7"/>

        <!-- Main fuselage -->
        <polygon points="18,1 30,30 6,30"  fill="#00ffcc"/>

        <!-- Fuselage shading (right half darker) -->
        <polygon points="18,1 30,30 18,30" fill="rgba(0,0,0,0.18)"/>

        <!-- Engine nacelles -->
        <rect x="7"  y="28" width="8" height="6" fill="#00aa88" rx="2"/>
        <rect x="21" y="28" width="8" height="6" fill="#00aa88" rx="2"/>

        <!-- Cockpit recess -->
        <ellipse cx="18" cy="14" rx="7"   ry="10"  fill="#001833"/>
        <!-- Cockpit glass (blue tint) -->
        <ellipse cx="18" cy="13" rx="5"   ry="8"   fill="#0055cc" opacity="0.85"/>
        <!-- Cockpit specular -->
        <ellipse cx="15" cy="8"  rx="1.8" ry="3"   fill="rgba(255,255,255,0.55)"/>
        <!-- Cockpit glow edge -->
        <ellipse cx="18" cy="13" rx="5"   ry="8"   fill="none" stroke="#44aaff" stroke-width="0.5" opacity="0.6"/>

        <!-- Fuselage center stripe -->
        <rect x="16" y="16" width="4" height="12" fill="#00ffcc" opacity="0.35" rx="1"/>

        <!-- Hull rivet details -->
        <circle cx="10" cy="26" r="1" fill="#00ffcc" opacity="0.5"/>
        <circle cx="26" cy="26" r="1" fill="#00ffcc" opacity="0.5"/>
      </g>

      <!-- ── CRT scanlines ── -->
      <rect width="100%" height="100%" fill="url(#scanlines)" pointer-events="none"/>

      <!-- ── Explosion particles ── -->
      <circle
        v-for="p in particles"
        :key="p.id"
        :cx="p.x"
        :cy="p.y"
        :r="p.r"
        :fill="p.color"
        class="particle"
        :style="{
          '--ptx': p.tx + 'px',
          '--pty': p.ty + 'px',
          '--pc': p.color,
        }"
        pointer-events="none"
      />

      <!-- ── Hit flash ── -->
      <rect
        v-if="isFlashing"
        width="100%" height="100%"
        fill="rgba(255,15,15,0.28)"
        class="hit-flash"
        pointer-events="none"
      />
    </svg>
  </div>
</template>

<script setup lang="ts">
interface Particle {
  id: number
  x: number; y: number
  tx: number; ty: number
  r: number
  color: string
}

interface Hazard {
  id: number; x: number; y: number
  width: number; height: number; speed: number
  color: string; shape: 'rect' | 'diamond' | 'circle'
  rotation: number; rotSpeed: number
}

interface Star { id: number; x: number; y: number; r: number; o: number; c: string }

const props = defineProps<{
  playerX: number; playerY: number
  playerWidth: number; playerHeight: number
  hazards: Hazard[]
  boardWidth: number; boardHeight: number
  isStarted: boolean; isGameOver: boolean
  isFlashing: boolean
  particles: Particle[]
}>()

// ─── Star field generation ───────────────────────────────────────────────────
function makeStar(i: number, seed: number, w: number, h: number): Star {
  const a = (i * 127 + seed * 31) % 997
  const b = (i * 251 + seed * 67) % 983
  const c = (i * 37  + seed * 113) % 991
  const starColors = ['#ffffff', '#aaddff', '#ffeedd', '#ddffee', '#ffddff']
  return {
    id: i + seed * 1000,
    x: (a / 997) * w,
    y: (b / 983) * h,
    r: 0.4 + (c % 5) * 0.22,
    o: 0.28 + (c % 7) * 0.09,
    c: starColors[c % starColors.length],
  }
}

const W = 600, H = 380
const starsL1 = Array.from({ length: 28 }, (_, i) => makeStar(i, 1, W, H))
const starsL2 = Array.from({ length: 18 }, (_, i) => makeStar(i, 2, W, H))
const starsL3 = Array.from({ length: 10 }, (_, i) => makeStar(i, 3, W, H))

// ─── Shape helpers ───────────────────────────────────────────────────────────
function diamondPoints(h: Hazard): string {
  const cx = h.x + h.width / 2, cy = h.y + h.height / 2
  const rx = h.width / 2,       ry = h.height / 2
  return `${cx},${cy-ry} ${cx+rx},${cy} ${cx},${cy+ry} ${cx-rx},${cy}`
}

function trailDiamondPoints(h: Hazard, yOffset: number): string {
  const cx = h.x + h.width / 2, cy = h.y - yOffset + h.height / 2
  const rx = h.width / 2,       ry = h.height / 2
  return `${cx},${cy-ry} ${cx+rx},${cy} ${cx},${cy+ry} ${cx-rx},${cy}`
}
</script>

<style lang="scss" scoped>
@use '../styles/main.scss' as *;

@keyframes scroll-stars-board {
  from { transform: translateY(0); }
  to   { transform: translateY(380px); }
}

@keyframes thruster-pulse {
  0%, 100% { opacity: 1;   transform: scaleX(1)   scaleY(1); }
  50%       { opacity: 0.6; transform: scaleX(0.75) scaleY(0.6); }
}

@keyframes hit-flash {
  from { opacity: 1; }
  to   { opacity: 0; }
}

.board-wrapper {
  @include glow-border($color-primary);
  border-radius: $radius-md;
  overflow: hidden;
  max-width: 100%;
  position: relative;
}

.game-board {
  display: block;
  max-width: 100%;
  height: auto;
}

.player { transition: transform 0.05s linear; }

// Star layers — different scroll speeds
.star-layer { will-change: transform; }
.star-slow   { animation: scroll-stars-board 16s linear infinite; }
.star-medium { animation: scroll-stars-board 9s  linear infinite; }
.star-fast   { animation: scroll-stars-board 5s  linear infinite; }

// Thruster animations
.thruster-outer { animation: thruster-pulse 0.18s ease-in-out infinite; transform-origin: 18px 45px; }
.thruster-mid   { animation: thruster-pulse 0.18s ease-in-out infinite 0.04s; transform-origin: 18px 43px; }
.thruster-inner { animation: thruster-pulse 0.14s ease-in-out infinite reverse; transform-origin: 18px 42px; }

// Hit flash
.hit-flash { animation: hit-flash 0.22s ease-out forwards; }

// Explosion particles
@keyframes particle-burst {
  0%   { opacity: 1;    transform: translate(0, 0)                     scale(1); }
  60%  { opacity: 0.85; transform: translate(calc(var(--ptx) * 0.75), calc(var(--pty) * 0.75)) scale(0.8); }
  100% { opacity: 0;    transform: translate(var(--ptx), var(--pty))   scale(0.2); }
}

.particle {
  animation: particle-burst 0.46s cubic-bezier(0.2, 0.8, 0.4, 1) forwards;
  filter: drop-shadow(0 0 3px var(--pc));
}
</style>
