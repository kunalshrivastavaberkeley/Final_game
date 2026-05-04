import * as THREE from 'three'

const POSITIONS = {
  terminal: {
    position: new THREE.Vector3(0, 1.38, 1.5),
    lookAt:   new THREE.Vector3(0, 1.38, -0.05),
  },
  free: {
    position: new THREE.Vector3(0, 1.65, 3.0),
    lookAt:   new THREE.Vector3(0, 1.2, -6.0),
  },
}

let _camera = null

// Active lerp state
let lerping = false
let lerpElapsed = 0
let lerpDuration = 0
let lerpFromPos = new THREE.Vector3()
let lerpFromLook = new THREE.Vector3()
let lerpToPos = new THREE.Vector3()
let lerpToLook = new THREE.Vector3()
let currentLookAt = new THREE.Vector3()
let _onComplete = null

// Optional callbacks set by main.js to keep state.js decoupled from camera.js
let _onTransitionStart = null
let _onTransitionEnd = null

export function setTransitionCallbacks(onStart, onEnd) {
  _onTransitionStart = onStart
  _onTransitionEnd = onEnd
}

function smoothstep(t) {
  return t * t * (3 - 2 * t)
}

export function initCamera(camera) {
  _camera = camera
  camera.position.set(0, 1.65, 1.0)
  currentLookAt.set(2.5, 1.38, -0.05)
  camera.lookAt(currentLookAt)
}

export function snapTo(posKey) {
  const pos = POSITIONS[posKey]
  if (!pos || !_camera) return
  _camera.position.copy(pos.position)
  currentLookAt.copy(pos.lookAt)
  _camera.lookAt(currentLookAt)
  lerping = false
}

export function startTransition(fromKey, toKey, durationMs, onComplete) {
  if (!_camera) return
  lerpFromPos.copy(POSITIONS[fromKey].position)
  lerpFromLook.copy(POSITIONS[fromKey].lookAt)
  lerpToPos.copy(POSITIONS[toKey].position)
  lerpToLook.copy(POSITIONS[toKey].lookAt)
  lerpElapsed = 0
  lerpDuration = durationMs / 1000
  _onComplete = onComplete
  lerping = true
  _onTransitionStart?.()
}

export function updateCamera(delta) {
  if (!lerping || !_camera) return

  lerpElapsed += delta
  const raw = Math.min(lerpElapsed / lerpDuration, 1.0)
  const t = smoothstep(raw)

  _camera.position.lerpVectors(lerpFromPos, lerpToPos, t)
  currentLookAt.lerpVectors(lerpFromLook, lerpToLook, t)
  _camera.lookAt(currentLookAt)

  if (raw >= 1.0) {
    lerping = false
    _onTransitionEnd?.()
    _onComplete?.()
    _onComplete = null
  }
}

export function getCameraRef() {
  return _camera
}
