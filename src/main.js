import * as THREE from 'three'

import { buildScene } from './scene.js'
import { buildJunk, updateJunk, initPostProcessing, resizePostProcessing, renderWithDOF } from './junk.js'
import { initCamera, updateCamera, setTransitionCallbacks } from './camera.js'
import { initPlayer, updatePlayer, getDevMode, enableDevMode } from './player.js'
import { initFigurine, updateFigurine } from './figurine.js'
import { GameState, setState, getUpdater } from './state.js'
import { loadAudio, resumeContext } from './audio.js'

import { initAmbient }     from './phases/ambient.js'
import { initBoot }        from './phases/boot.js'
import { initWaiting }     from './phases/waiting.js'
import { initDialogue }    from './phases/dialogue.js'
import { initExploration } from './phases/exploration.js'
import { initReturn }      from './phases/return.js'
import { initEnding }      from './phases/ending.js'

// ── Renderer ──────────────────────────────────────────────────
const canvas = document.getElementById('c')
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
renderer.setPixelRatio(window.devicePixelRatio)
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap

const scene = new THREE.Scene()
scene.background = new THREE.Color(0x000000)

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100)

// ── Scene ─────────────────────────────────────────────────────
await buildScene(scene)
buildJunk(scene)
initCamera(camera)
initPostProcessing(renderer, scene, camera)

// Wire camera transitioning flag to GameState
setTransitionCallbacks(
  () => { GameState.transitioning = true  },
  () => { GameState.transitioning = false }
)

// ── Player ────────────────────────────────────────────────────
initPlayer(camera, canvas)

// ── Phases ────────────────────────────────────────────────────
initAmbient()
initBoot()
initWaiting()
initDialogue()
initExploration()
initReturn()
initEnding()

// ── Audio load ────────────────────────────────────────────────
await Promise.all([
  loadAudio('fan',   '/audio/fan.wav'),
  loadAudio('hum',   '/audio/hum.wav'),
  loadAudio('chime', '/audio/chime.flac'),
])

// ── Figurine ──────────────────────────────────────────────────
await initFigurine(scene)

// ── Dev Mode ──────────────────────────────────────────────────
// Set to true to skip boot sequence and go straight to 3D exploration
const DEV_MODE = false

// ── Start Screen ──────────────────────────────────────────────
const startScreen = document.getElementById('start-screen')
const DEV = DEV_MODE || new URLSearchParams(window.location.search).has('dev')

if (DEV) {
  startScreen.style.display = 'none'
  enableDevMode()
  setState('EXPLORATION')
} else {
  startScreen.addEventListener('click', async () => {
    await resumeContext()
    startScreen.style.display = 'none'
    setState('AMBIENT')
  }, { once: true })
}

// ── Resize ────────────────────────────────────────────────────
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
  resizePostProcessing(window.innerWidth, window.innerHeight)
})

// ── RAF Loop ──────────────────────────────────────────────────
let lastTime = performance.now()
let time = 0

function loop(now) {
  requestAnimationFrame(loop)
  const delta = Math.min((now - lastTime) / 1000, 0.1)
  lastTime = now
  time += delta

  updateCamera(delta)
  updatePlayer(delta, camera)
  updateFigurine(delta)
  updateJunk(delta)
  getUpdater()?.(delta)

  renderWithDOF(renderer, scene, camera)
}

requestAnimationFrame(loop)
