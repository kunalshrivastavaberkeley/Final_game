import * as THREE from 'three'

import { buildScene, spotLight } from './scene.js'
import { initCamera, updateCamera, setTransitionCallbacks } from './camera.js'
import { initPlayer, updatePlayer } from './player.js'
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

const scene = new THREE.Scene()
scene.background = new THREE.Color(0x000000)

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100)

// ── Scene ─────────────────────────────────────────────────────
buildScene(scene)
initCamera(camera)

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
  loadAudio('fan',   '/audio/fan.mp4'),
  loadAudio('hum',   '/audio/hum.mp4'),
  loadAudio('chime', '/audio/chime.mp4'),
])

// ── Figurine ──────────────────────────────────────────────────
await initFigurine(scene)

// ── Start Screen ──────────────────────────────────────────────
const startScreen = document.getElementById('start-screen')

startScreen.addEventListener('click', async () => {
  await resumeContext()
  startScreen.style.display = 'none'
  setState('AMBIENT')
}, { once: true })

// ── Resize ────────────────────────────────────────────────────
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
})

// ── RAF Loop ──────────────────────────────────────────────────
let lastTime = performance.now()
let time = 0

function loop(now) {
  requestAnimationFrame(loop)
  const delta = Math.min((now - lastTime) / 1000, 0.1)
  lastTime = now
  time += delta

  if (spotLight) spotLight.intensity = 4.0 + Math.sin(time * 0.3) * 0.05

  updateCamera(delta)
  updatePlayer(delta, camera)
  updateFigurine(delta)
  getUpdater()?.(delta)

  renderer.render(scene, camera)
}

requestAnimationFrame(loop)
