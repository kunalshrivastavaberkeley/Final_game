import * as THREE from 'three'
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js'
import { getCollidables, setDevLighting } from './scene.js'
import { GameState } from './state.js'

const SPEED = 3.5
const DEV_SPEED = 9.0
const PLAYER_RADIUS = 0.3
const PLAYER_HALF_Y = 0.9
const PLAYER_Y = 1.65

let controls = null
let _camera  = null
let enabled  = false
let devMode  = false

const keys = { w: false, a: false, s: false, d: false }

const _forward = new THREE.Vector3()
const _right   = new THREE.Vector3()
const _dir     = new THREE.Vector3()

export function initPlayer(camera, canvas) {
  _camera = camera
  controls = new PointerLockControls(camera, canvas)

  controls.addEventListener('lock',   () => { enabled = true })
  controls.addEventListener('unlock', () => { enabled = false })

  canvas.addEventListener('click', () => {
    if (!GameState.terminalMode && !GameState.transitioning) {
      controls.lock()
    }
  })

  window.addEventListener('keydown', e => {
    if (e.code === 'KeyW') keys.w = true
    if (e.code === 'KeyA') keys.a = true
    if (e.code === 'KeyS') keys.s = true
    if (e.code === 'KeyD') keys.d = true
    if (e.code === 'KeyZ') {
      devMode = !devMode
      setDevLighting(devMode)
      if (devMode && !enabled) controls.lock()
    }
  })

  window.addEventListener('keyup', e => {
    if (e.code === 'KeyW') keys.w = false
    if (e.code === 'KeyA') keys.a = false
    if (e.code === 'KeyS') keys.s = false
    if (e.code === 'KeyD') keys.d = false
  })
}

export function lockPointer()   { controls?.lock() }
export function unlockPointer() { controls?.unlock() }
export function getDevMode()    { return devMode }

export function enableDevMode() {
  devMode = true
  setDevLighting(true)
  controls?.lock()
}

export function isNearDesk()  { return _camera && _camera.position.z < -4.5 }
export function isNearTerminal() {
  if (!_camera) return false
  const dx = _camera.position.x - 0
  const dz = _camera.position.z - 1.35
  return Math.sqrt(dx * dx + dz * dz) < 2.0
}
export function isNearShelf() {
  if (!_camera) return false
  const dx = _camera.position.x - 9.0
  const dz = _camera.position.z - (-2.0)
  return Math.sqrt(dx * dx + dz * dz) < 2.0
}

export function updatePlayer(delta, camera) {
  if (!enabled || (GameState.transitioning && !devMode)) return

  if (devMode) {
    // God mode: fly in full 3D along camera direction
    camera.getWorldDirection(_forward)
    _right.crossVectors(_forward, new THREE.Vector3(0, 1, 0)).negate().normalize()

    _dir.set(0, 0, 0)
    if (keys.w) _dir.add(_forward)
    if (keys.s) _dir.sub(_forward)
    if (keys.a) _dir.add(_right)
    if (keys.d) _dir.sub(_right)

    if (_dir.lengthSq() > 0.001) {
      _dir.normalize()
      camera.position.addScaledVector(_dir, DEV_SPEED * delta)
    }
    return
  }

  // Build movement direction from camera facing (flatten Y)
  camera.getWorldDirection(_forward)
  _forward.y = 0
  _forward.normalize()

  _right.crossVectors(_forward, new THREE.Vector3(0, 1, 0)).negate().normalize()

  _dir.set(0, 0, 0)
  if (keys.w) _dir.add(_forward)
  if (keys.s) _dir.sub(_forward)
  if (keys.a) _dir.add(_right)
  if (keys.d) _dir.sub(_right)

  if (_dir.lengthSq() < 0.001) return
  _dir.normalize()

  const dx = _dir.x * SPEED * delta
  const dz = _dir.z * SPEED * delta

  const cur = camera.position
  const { x: resolvedX, z: resolvedZ } = resolveCollisions(cur.x + dx, cur.z + dz, cur.y)

  camera.position.x = resolvedX
  camera.position.z = resolvedZ
  camera.position.y = PLAYER_Y
}

function resolveCollisions(newX, newZ, y) {
  const collidables = getCollidables()
  let px = newX
  let pz = newZ

  for (const box of collidables) {
    if (y + PLAYER_HALF_Y <= box.min.y || y - PLAYER_HALF_Y >= box.max.y) continue

    // Closest point on box to player circle center
    const cx = Math.max(box.min.x, Math.min(px, box.max.x))
    const cz = Math.max(box.min.z, Math.min(pz, box.max.z))
    const dx = px - cx
    const dz = pz - cz
    const dist2 = dx * dx + dz * dz

    if (dist2 < PLAYER_RADIUS * PLAYER_RADIUS) {
      if (dist2 < 0.00001) {
        // Center is inside box — push out along shortest axis
        const ox = Math.min(px - box.min.x, box.max.x - px)
        const oz = Math.min(pz - box.min.z, box.max.z - pz)
        if (ox < oz) px += px > (box.min.x + box.max.x) / 2 ? PLAYER_RADIUS : -PLAYER_RADIUS
        else         pz += pz > (box.min.z + box.max.z) / 2 ? PLAYER_RADIUS : -PLAYER_RADIUS
      } else {
        const dist = Math.sqrt(dist2)
        const push = PLAYER_RADIUS - dist
        px += (dx / dist) * push
        pz += (dz / dist) * push
      }
    }
  }

  return { x: px, z: pz }
}
