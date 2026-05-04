import * as THREE from 'three'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass }     from 'three/addons/postprocessing/RenderPass.js'
import { BokehPass }      from 'three/addons/postprocessing/BokehPass.js'
import { getCollidables } from './scene.js'

// ── Particles ─────────────────────────────────────────────────
let particleAttr = null
const particleVel = []

// ── DoF ───────────────────────────────────────────────────────
let composer = null

// ── Equipment clusters ─────────────────────────────────────────
// Four thick perimeter walls of junk replacing the visual walls.
// Room: X -4..+10, Z -3..+10. Desk pod at X -1.5..4, Z -0.8..2.
const CLUSTERS = [
  // Back — stops before the front-right shelf corner
  { xMin: -4.0, xMax:  7.0, zMin: -3.0, zMax: -0.5, yMax: 9.0 },
  // Front
  { xMin: -4.0, xMax: 10.0, zMin:  7.8, zMax: 10.0, yMax: 9.0 },
  // Left
  { xMin: -4.0, xMax: -1.5, zMin: -3.0, zMax: 10.0, yMax: 9.0 },
  // Right — starts past the front-right shelf corner
  { xMin:  7.0, xMax: 10.0, zMin:  0.5, zMax: 10.0, yMax: 9.0 },
]

// ── Public API ────────────────────────────────────────────────

export function buildJunk(scene) {
  _buildParticles(scene)
  _buildClutter(scene)
}

export function updateJunk(delta) {
  if (!particleAttr) return
  const arr = particleAttr.array
  const COUNT = arr.length / 3
  const dt = delta * 60

  for (let i = 0; i < COUNT; i++) {
    const i3 = i * 3
    arr[i3]     += particleVel[i3]     * dt
    arr[i3 + 1] += particleVel[i3 + 1] * dt
    arr[i3 + 2] += particleVel[i3 + 2] * dt

    // Wrap / bounce
    if (arr[i3]     >  10) arr[i3]     = -4
    if (arr[i3]     <  -4) arr[i3]     =  10
    if (arr[i3 + 2] >  10) arr[i3 + 2] = -3
    if (arr[i3 + 2] <  -3) arr[i3 + 2] =  10
    if (arr[i3 + 1] > 3.5) particleVel[i3 + 1] *= -1
    if (arr[i3 + 1] < 0.1) particleVel[i3 + 1] *= -1
  }

  particleAttr.needsUpdate = true
}

export function initPostProcessing(renderer, scene, camera) {
  composer = new EffectComposer(renderer)
  composer.addPass(new RenderPass(scene, camera))

  const bokeh = new BokehPass(scene, camera, {
    focus:    4.5,    // focal distance in world units — keeps desk area sharp
    aperture: 0.00022,
    maxblur:  0.009,
  })
  composer.addPass(bokeh)
}

export function resizePostProcessing(w, h) {
  composer?.setSize(w, h)
}

export function renderWithDOF(renderer, scene, camera) {
  if (composer) {
    composer.render()
  } else {
    renderer.render(scene, camera)
  }
}

// ── Internals ─────────────────────────────────────────────────

function _buildParticles(scene) {
  const COUNT = 700
  const pos = new Float32Array(COUNT * 3)

  for (let i = 0; i < COUNT; i++) {
    const i3 = i * 3
    pos[i3]     = THREE.MathUtils.randFloat(-4,  10)
    pos[i3 + 1] = THREE.MathUtils.randFloat(0.1, 3.5)
    pos[i3 + 2] = THREE.MathUtils.randFloat(-3,  10)
    particleVel.push(
      (Math.random() - 0.5) * 0.006,
      (Math.random() - 0.5) * 0.002,
      (Math.random() - 0.5) * 0.006,
    )
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  particleAttr = geo.attributes.position

  scene.add(new THREE.Points(geo, new THREE.PointsMaterial({
    color: 0xb8a898,
    size: 0.022,
    transparent: true,
    opacity: 0.45,
    sizeAttenuation: true,
    depthWrite: false,
  })))
}

// Scatter centers across the whole cluster — more for bigger areas
function _pileCenters(c) {
  const area = (c.xMax - c.xMin) * (c.zMax - c.zMin)
  const n    = Math.max(6, Math.round(area * 0.4))
  const out  = []
  for (let i = 0; i < n; i++) {
    out.push({
      x: THREE.MathUtils.randFloat(c.xMin + 0.3, c.xMax - 0.3),
      z: THREE.MathUtils.randFloat(c.zMin + 0.3, c.zMax - 0.3),
    })
  }
  return out
}

function _buildClutter(scene) {
  const collidables = getCollidables()

  for (const c of CLUSTERS) {
    collidables.push({
      min: new THREE.Vector3(c.xMin, 0,      c.zMin),
      max: new THREE.Vector3(c.xMax, c.yMax, c.zMax),
    })
  }

  const centers = CLUSTERS.map(_pileCenters)

  const geoTypes = [
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.BoxGeometry(1, 0.55, 1.5),
    new THREE.OctahedronGeometry(0.55, 0),
    new THREE.CylinderGeometry(0.3, 0.38, 1, 5),
    new THREE.TetrahedronGeometry(0.6, 0),
  ]
  const counts = [500, 420, 340, 280, 240]

  const dummy = new THREE.Object3D()
  const color = new THREE.Color()

  for (let g = 0; g < geoTypes.length; g++) {
    const count = counts[g]
    const mesh = new THREE.InstancedMesh(
      geoTypes[g],
      new THREE.MeshLambertMaterial(),
      count,
    )
    mesh.castShadow    = true
    mesh.receiveShadow = true

    for (let i = 0; i < count; i++) {
      const ci   = i % CLUSTERS.length
      const c    = CLUSTERS[ci]
      const pile = centers[ci][Math.floor(Math.random() * centers[ci].length)]

      const angle = Math.random() * Math.PI * 2
      const r = THREE.MathUtils.randFloat(0, 1.5)
      const x = THREE.MathUtils.clamp(pile.x + Math.cos(angle) * r, c.xMin, c.xMax)
      const z = THREE.MathUtils.clamp(pile.z + Math.sin(angle) * r, c.zMin, c.zMax)

      // Big objects — read as actual equipment-sized things
      const s  = THREE.MathUtils.randFloat(0.12, 0.55)
      const sy = s * THREE.MathUtils.randFloat(0.6, 3.5)
      const sz = s * THREE.MathUtils.randFloat(0.6, 2.0)

      // Stack height: exponential-ish distribution so most start low,
      // but a long tail reaches well above the ceiling fog (~3.2m)
      const stackT = Math.pow(Math.random(), 1.8)  // bias toward low, long tail high
      const stackH = stackT * 7.0                   // top of pile can reach y≈7
      const y = sy * 0.5 + stackH

      dummy.position.set(x, y, z)
      dummy.rotation.set(
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
      )
      dummy.scale.set(s, sy, sz)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)

      color.setHSL(
        Math.random(),
        THREE.MathUtils.randFloat(0.1, 0.85),
        THREE.MathUtils.randFloat(0.12, 0.45),
      )
      mesh.setColorAt(i, color)
    }

    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    scene.add(mesh)
  }
}
