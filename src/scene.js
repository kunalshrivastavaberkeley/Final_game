import * as THREE from 'three'

export let spotLight = null
export let terminalGlow = null
export let monitorMesh = null

const collidables = []

export function buildScene(scene) {
  const darkBrown = new THREE.MeshLambertMaterial({ color: 0x1a1008 })
  const floorMat  = new THREE.MeshLambertMaterial({ color: 0x111111 })
  const wallMat   = new THREE.MeshLambertMaterial({ color: 0x0d0d0d })

  // ── Floor / Ceiling ──────────────────────────────────────────
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), floorMat)
  floor.rotation.x = -Math.PI / 2
  scene.add(floor)

  const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), wallMat)
  ceiling.rotation.x = Math.PI / 2
  ceiling.position.y = 3.5
  scene.add(ceiling)

  // ── Walls ─────────────────────────────────────────────────────
  // Back wall (Z = -10, faces +Z)
  const wallBack = new THREE.Mesh(new THREE.PlaneGeometry(20, 3.5), wallMat)
  wallBack.position.set(0, 1.75, -10)
  scene.add(wallBack)

  // Front wall (Z = +10, faces -Z)
  const wallFront = new THREE.Mesh(new THREE.PlaneGeometry(20, 3.5), wallMat)
  wallFront.position.set(0, 1.75, 10)
  wallFront.rotation.y = Math.PI
  scene.add(wallFront)

  // Left wall (X = -10, faces +X)
  const wallLeft = new THREE.Mesh(new THREE.PlaneGeometry(20, 3.5), wallMat)
  wallLeft.position.set(-10, 1.75, 0)
  wallLeft.rotation.y = Math.PI / 2
  scene.add(wallLeft)

  // Right wall (X = +10, faces -X)
  const wallRight = new THREE.Mesh(new THREE.PlaneGeometry(20, 3.5), wallMat)
  wallRight.position.set(10, 1.75, 0)
  wallRight.rotation.y = -Math.PI / 2
  scene.add(wallRight)

  // ── Desk ──────────────────────────────────────────────────────
  const deskGroup = new THREE.Group()

  // Tabletop
  const tabletop = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.08, 1.2), darkBrown)
  tabletop.position.set(0, 0.82, 0)
  deskGroup.add(tabletop)

  // Legs
  const legPositions = [
    [ 1.1, 0.41, 0.5],
    [-1.1, 0.41, 0.5],
    [ 1.1, 0.41,-0.5],
    [-1.1, 0.41,-0.5],
  ]
  for (const [x, y, z] of legPositions) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.82, 0.08), darkBrown)
    leg.position.set(x, y, z)
    deskGroup.add(leg)
  }

  // Monitor base
  const monBase = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.05, 0.3), darkBrown)
  monBase.position.set(0, 0.885, -0.25)
  deskGroup.add(monBase)

  // Monitor stem
  const monStem = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.45, 0.05), darkBrown)
  monStem.position.set(0, 1.11, -0.25)
  deskGroup.add(monStem)

  // Monitor screen (face toward +Z, i.e. toward player)
  monitorMesh = new THREE.Mesh(
    new THREE.BoxGeometry(1.4, 0.9, 0.05),
    new THREE.MeshLambertMaterial({ color: 0x050a05, emissive: new THREE.Color(0x000000) })
  )
  monitorMesh.position.set(0, 1.38, -0.05)
  deskGroup.add(monitorMesh)

  deskGroup.position.set(0, 0, -6)
  scene.add(deskGroup)

  // Desk AABB collidable (inflated slightly)
  collidables.push({
    min: new THREE.Vector3(-1.4, 0, -7.0),
    max: new THREE.Vector3( 1.4, 2.0, -4.8),
  })

  // ── Shelf ─────────────────────────────────────────────────────
  const shelfGroup = new THREE.Group()

  const plank = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.05, 0.3), darkBrown)
  plank.position.set(0, 0, 0)
  shelfGroup.add(plank)

  const bracketL = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.3, 0.3), darkBrown)
  bracketL.position.set(-0.7, -0.175, 0)
  shelfGroup.add(bracketL)

  const bracketR = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.3, 0.3), darkBrown)
  bracketR.position.set( 0.7, -0.175, 0)
  shelfGroup.add(bracketR)

  shelfGroup.position.set(0, 1.4, 7.0)
  scene.add(shelfGroup)

  // Back wall collidable (stops player walking into shelf wall)
  collidables.push({
    min: new THREE.Vector3(-10, 0, 7.0),
    max: new THREE.Vector3( 10, 4.0, 10.5),
  })

  // ── Room wall collidables ─────────────────────────────────────
  const wallThick = 0.5
  // Back (Z = -10)
  collidables.push({ min: new THREE.Vector3(-10, 0, -10.5), max: new THREE.Vector3(10, 4, -9.5) })
  // Left (X = -10)
  collidables.push({ min: new THREE.Vector3(-10.5, 0, -10), max: new THREE.Vector3(-9.5, 4, 10) })
  // Right (X = +10)
  collidables.push({ min: new THREE.Vector3( 9.5, 0, -10), max: new THREE.Vector3(10.5, 4, 10) })

  // ── Lighting ──────────────────────────────────────────────────
  const ambient = new THREE.AmbientLight(0x111111, 0.3)
  scene.add(ambient)

  spotLight = new THREE.SpotLight(0xfff5e0, 4.0)
  spotLight.position.set(0, 3.2, -6)
  spotLight.angle = Math.PI / 10
  spotLight.penumbra = 0.3
  const spotTarget = new THREE.Object3D()
  spotTarget.position.set(0, 0.82, -6)
  scene.add(spotTarget)
  spotLight.target = spotTarget
  scene.add(spotLight)

  terminalGlow = new THREE.PointLight(0x33ff33, 0)
  terminalGlow.position.set(0, 1.4, -5.9)
  scene.add(terminalGlow)
}

export function getCollidables() {
  return collidables
}
