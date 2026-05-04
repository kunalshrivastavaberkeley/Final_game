import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { GameState } from './state.js'
import { isNearShelf } from './player.js'
import { showHint, clearHint } from './terminal.js'
import { playOnce } from './audio.js'

let figurineRef = null
let _scene = null

function makePlaceholder() {
  const g = new THREE.Group()
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.07, 0.18, 8),
    new THREE.MeshLambertMaterial({ color: 0x4a0080 })
  )
  const hat = new THREE.Mesh(
    new THREE.ConeGeometry(0.09, 0.14, 8),
    new THREE.MeshLambertMaterial({ color: 0x1a0040 })
  )
  hat.position.y = 0.16
  g.add(body, hat)
  return g
}

export async function initFigurine(scene) {
  _scene = scene
  let model
  try {
    const loader = new GLTFLoader()
    const gltf = await loader.loadAsync(`${import.meta.env.BASE_URL}models/figurine.glb`)
    model = gltf.scene
    model.scale.setScalar(0.1)
  } catch {
    model = makePlaceholder()
  }
  model.position.set(9.0, 1.43, -2.0)
  model.name = 'figurine'
  scene.add(model)
  figurineRef = model

  window.addEventListener('keydown', handlePickup)
}

export function updateFigurine(delta) {
  if (figurineRef && figurineRef.parent) {
    figurineRef.rotation.y += delta * 0.3
  }
}

function handlePickup(e) {
  if (e.code !== 'KeyE') return
  if (GameState.phase !== 'EXPLORATION') return
  if (!isNearShelf()) return
  if (GameState.hasFigurine) return

  GameState.hasFigurine = true
  _scene.remove(figurineRef)
  showHint("you pick it up. it fits in your hand like it always did.")
  playOnce('chime', 0.7)
}
