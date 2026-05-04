import * as THREE from 'three'
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js'
import { getCollidables } from './scene.js'
import { GameState } from './state.js'

const SPEED = 3.5
const PLAYER_HALF = new THREE.Vector3(0.3, 0.9, 0.3)
const PLAYER_Y = 1.65

let controls = null
let _camera  = null
let enabled  = false

const keys = { w: false, a: false, s: false, d: false }

const _forward   = new THREE.Vector3()
const _right     = new THREE.Vector3()
const _dir       = new THREE.Vector3()
const _playerMin = new THREE.Vector3()
const _playerMax = new THREE.Vector3()

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

export function isNearDesk()  { return _camera && _camera.position.z < -4.5 }
export function isNearShelf() { return _camera && _camera.position.z > 5.5 }

export function updatePlayer(delta, camera) {
  if (!enabled || GameState.transitioning) return

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

  // Resolve X
  const newX = cur.x + dx
  const resolvedX = resolveAxis(newX, cur.z, cur.y, 'x')

  // Resolve Z
  const resolvedZ = resolveAxis(resolvedX, cur.z + dz, cur.y, 'z')

  camera.position.x = resolvedX
  camera.position.z = resolvedZ
  camera.position.y = PLAYER_Y
}

function resolveAxis(candidateX, candidateZ, y, axis) {
  const collidables = getCollidables()
  let value = axis === 'x' ? candidateX : candidateZ

  _playerMin.set(
    candidateX  - PLAYER_HALF.x,
    y           - PLAYER_HALF.y,
    candidateZ  - PLAYER_HALF.z,
  )
  _playerMax.set(
    candidateX  + PLAYER_HALF.x,
    y           + PLAYER_HALF.y,
    candidateZ  + PLAYER_HALF.z,
  )

  for (const box of collidables) {
    if (
      _playerMax.x > box.min.x && _playerMin.x < box.max.x &&
      _playerMax.y > box.min.y && _playerMin.y < box.max.y &&
      _playerMax.z > box.min.z && _playerMin.z < box.max.z
    ) {
      if (axis === 'x') {
        if (candidateX > (box.min.x + box.max.x) / 2) {
          value = box.max.x + PLAYER_HALF.x
        } else {
          value = box.min.x - PLAYER_HALF.x
        }
      } else {
        if (candidateZ > (box.min.z + box.max.z) / 2) {
          value = box.max.z + PLAYER_HALF.z
        } else {
          value = box.min.z - PLAYER_HALF.z
        }
      }
    }
  }

  return value
}
