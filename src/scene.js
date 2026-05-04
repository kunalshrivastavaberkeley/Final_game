import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'

export let terminalPanel = null
export let monitorMesh = null
let ambient = null

export function setDevLighting(on) {
  if (!ambient) return
  ambient.intensity = on ? 3.0 : 0.5
}

const collidables = []

export async function buildScene(scene) {
  const darkBrown = new THREE.MeshLambertMaterial({ color: 0x1a1008 })
  const black = new THREE.MeshLambertMaterial({ color: 0x050a05 })

  const loader = new THREE.TextureLoader()
  const base = `${import.meta.env.BASE_URL}Poliigon_ConcreteWorn_8690/2K/Poliigon_ConcreteWorn_8690`
  const albedo    = loader.load(`${base}_BaseColor.jpg`)
  const aoMap     = loader.load(`${base}_AmbientOcclusion.jpg`)
  const normalMap = loader.load(`${base}_Normal.png`)
  const roughMap  = loader.load(`${base}_Roughness.jpg`)
  const metMap    = loader.load(`${base}_Metallic.jpg`)
  for (const t of [albedo, aoMap, normalMap, roughMap, metMap]) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.repeat.set(4, 4)
  }
  const floorMat = new THREE.MeshStandardMaterial({
    map: albedo,
    aoMap,
    normalMap,
    roughnessMap: roughMap,
    metalnessMap: metMap,
    roughness: 1,
    metalness: 0,
  })

  const wBase = `${import.meta.env.BASE_URL}Poliigon_PlasterPainted_7664/2K/Poliigon_PlasterPainted_7664`
  const wAlbedo    = loader.load(`${wBase}_BaseColor.jpg`)
  const wAo        = loader.load(`${wBase}_AmbientOcclusion.jpg`)
  const wNormal    = loader.load(`${wBase}_Normal.png`)
  const wRough     = loader.load(`${wBase}_Roughness.jpg`)
  const wMetal     = loader.load(`${wBase}_Metallic.jpg`)
  for (const t of [wAlbedo, wAo, wNormal, wRough, wMetal]) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.repeat.set(4, 2)
  }
  const wallMat = new THREE.MeshStandardMaterial({
    map: wAlbedo,
    aoMap: wAo,
    normalMap: wNormal,
    roughnessMap: wRough,
    metalnessMap: wMetal,
    roughness: 1,
    metalness: 0,
  })

  // ── Fog ──────────────────────────────────────────────────────
  scene.fog = new THREE.FogExp2(0x0a0a0a, 0.13)

  // ── Floor ────────────────────────────────────────────────────
  // Room is X: -4..+10 (w=14), Z: -3..+10 (d=13), center (3, 0, 3.5)
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(14, 13), floorMat)
  floor.rotation.x = -Math.PI / 2
  floor.position.set(3, 0, 3.5)
  floor.receiveShadow = true
  scene.add(floor)

  // ── Upward fog layers — ceiling fades into darkness ──────────
  const fogLayers = [
    { y: 3.2, opacity: 0.08 },
    { y: 3.8, opacity: 0.18 },
    { y: 4.3, opacity: 0.35 },
    { y: 4.7, opacity: 0.55 },
    { y: 5.1, opacity: 0.80 },
  ]
  for (const { y, opacity } of fogLayers) {
    const fogPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(20, 18),
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity, depthWrite: false, side: THREE.DoubleSide })
    )
    fogPlane.rotation.x = -Math.PI / 2
    fogPlane.position.set(3, y, 3.5)
    scene.add(fogPlane)
  }

  // ── Load table GLB ────────────────────────────────────────────
  const gltfLoader = new GLTFLoader()
  const tableGltf = await gltfLoader.loadAsync(`${import.meta.env.BASE_URL}models/table_with_metal_legs.glb`)
  const tableTemplate = tableGltf.scene
  tableTemplate.traverse(child => {
    if (child.isMesh) {
      child.castShadow = true
      child.receiveShadow = true
    }
  })
  // Compute natural bounding box to derive scale factors
  const tableBox = new THREE.Box3().setFromObject(tableTemplate)
  const tableSize = new THREE.Vector3()
  tableBox.getSize(tableSize)

  // Helper: clone table, scale to target width/depth, seat on floor
  function placeTable(x, z, rotY, targetW, targetD) {
    const t = tableTemplate.clone(true)
    const scaleX = targetW / tableSize.x
    const scaleZ = targetD / tableSize.z
    const scale = Math.min(scaleX, scaleZ)
    t.scale.setScalar(scale)
    // After scaling, re-measure to sit exactly on y=0
    const scaled = new THREE.Box3().setFromObject(t)
    t.position.set(x, -scaled.min.y, z)
    t.rotation.y = rotY
    scene.add(t)
    return new THREE.Box3().setFromObject(t)
  }

  // ── Desk pod (2 × 2) ─────────────────────────────────────────
  // Pod layout (top-down):
  //   [A]  [C]          ← back row,  monitor faces +Z
  //   [B]  [D]          ← front row, monitor faces −Z (face-to-face with back row)
  placeTable(0,   0,   Math.PI * 0.5,        5.0, 2.4)  // A — player's desk
  placeTable(0,   1.2, Math.PI * 1.5,        5.0, 2.4)  // B — faces A
  placeTable(2.5, 0,   Math.PI * 0.5,        5.0, 2.4)  // C — right of A
  placeTable(2.5, 1.2, Math.PI * 1.5,        5.0, 2.4)  // D — faces C
  collidables.push({ min: new THREE.Vector3(-1.4, 0, -0.7),  max: new THREE.Vector3(1.4,  2.0, 0.7)  })
  collidables.push({ min: new THREE.Vector3(-1.4, 0,  0.5),  max: new THREE.Vector3(1.4,  2.0, 1.9)  })
  collidables.push({ min: new THREE.Vector3( 1.1, 0, -0.7),  max: new THREE.Vector3(3.9,  2.0, 0.7)  })
  collidables.push({ min: new THREE.Vector3( 1.1, 0,  0.5),  max: new THREE.Vector3(3.9,  2.0, 1.9)  })


  // ── Monitor on desk A (player's desk) ─────────────────────────
  monitorMesh = addMonitor(scene, black, 0, 0, 0)

  // ── Shelf ─────────────────────────────────────────────────────
  const shelfGroup = new THREE.Group()

  const plank = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.05, 0.3), darkBrown)
  plank.position.set(0, 0, 0)
  plank.castShadow = true
  plank.receiveShadow = true
  shelfGroup.add(plank)

  const bracketL = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.3, 0.3), darkBrown)
  bracketL.position.set(-0.7, -0.175, 0)
  bracketL.castShadow = true
  bracketL.receiveShadow = true
  shelfGroup.add(bracketL)

  const bracketR = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.3, 0.3), darkBrown)
  bracketR.position.set( 0.7, -0.175, 0)
  bracketR.castShadow = true
  bracketR.receiveShadow = true
  shelfGroup.add(bracketR)

  shelfGroup.position.set(9.0, 1.3, -2.0)
  scene.add(shelfGroup)

  // Back wall collidable
  collidables.push({
    min: new THREE.Vector3(-10, 0, 7.0),
    max: new THREE.Vector3( 10, 4.0, 10.5),
  })

  // ── Room wall collidables ─────────────────────────────────────
  // Back (Z = -3)
  collidables.push({ min: new THREE.Vector3(-4, 0, -3.5), max: new THREE.Vector3(10, 4, -2.5) })
  // Front (Z = +10)
  collidables.push({ min: new THREE.Vector3(-4, 0,  9.5), max: new THREE.Vector3(10, 4, 10.5) })
  // Left (X = -4)
  collidables.push({ min: new THREE.Vector3(-4.5, 0, -3), max: new THREE.Vector3(-3.5, 4, 10) })
  // Right (X = +10)
  collidables.push({ min: new THREE.Vector3( 9.5, 0, -3), max: new THREE.Vector3(10.5, 4, 10) })

  // ── Lighting ──────────────────────────────────────────────────
  ambient = new THREE.AmbientLight(0xffffff, 0.5)
  scene.add(ambient)

  // Physical panel in front of desk A's monitor — replaces the old floating point light glow
  const panelMat = new THREE.MeshStandardMaterial({
    color: 0x001500,
    emissive: new THREE.Color(0x003300),
    emissiveIntensity: 100,
    roughness: 0.9,
    metalness: 0.05,
  })
  terminalPanel = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.7, 0.04), panelMat)
  terminalPanel.position.set(0, 1.38, 1.35)
  scene.add(terminalPanel)

  buildHangingLights(scene)
  buildFloorClutter(scene)

  // Trail of spotlights guiding from the desk (0,0,0) to the plushie (9, 1.43, -2)
  // 3 breadcrumb pools on the floor, then the final shelf spotlight
  const trailPoints = [
    { x: 2.5, z: 2 },  // just past the desk pods
    { x: 5.5, z: 1.8 },  // midway across the room
    { x: 8.0, z: 0 },  // closing in on the shelf
  ]
  for (const { x, z } of trailPoints) {
    const s = new THREE.SpotLight(0xffd580, 3.5, 5, Math.PI / 8, 0.55, 1.8)
    s.position.set(x, 3.0, z)
    s.target.position.set(x, 0, z)
    scene.add(s)
    scene.add(s.target)
  }

  // Final spotlight aimed down at the plushie on the shelf (9.0, 1.43, -2.0)
  const plushieSpot = new THREE.SpotLight(0xfff5e0, 8, 6, Math.PI / 10, 0.4, 1.5)
  plushieSpot.position.set(9.0, 3.5, -2.0)
  plushieSpot.target.position.set(9.0, 1.43, -2.0)
  plushieSpot.castShadow = true
  scene.add(plushieSpot)
  scene.add(plushieSpot.target)
}

function addMonitor(scene, black, x, z, rotY) {
  const group = new THREE.Group()

  const monBase = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.05, 0.3), black)
  monBase.position.set(0, 0.885, -0.1)
  monBase.castShadow = true
  group.add(monBase)

  const monStem = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.45, 0.05), black)
  monStem.position.set(0, 1.11, -0.1)
  monStem.castShadow = true
  group.add(monStem)

  const screen = new THREE.Mesh(
    new THREE.BoxGeometry(1.4, 0.9, 0.05),
    new THREE.MeshLambertMaterial({ color: 0x050a05, emissive: new THREE.Color(0x000000) })
  )
  screen.position.set(0, 1.38, -0.05)
  screen.castShadow = true
  group.add(screen)

  group.position.set(x, 0, z)
  group.rotation.y = rotY
  scene.add(group)

  return screen
}

function buildFloorClutter(scene) {
  // Objects within 1-2 units of player start (near desk A at 0,0,0)
  // — near-field pressure so the darkness feels inhabited, not empty

  const cardboard = new THREE.MeshLambertMaterial({ color: 0xb8935a })
  const darkMetal = new THREE.MeshLambertMaterial({ color: 0x2a2a2a })
  const paper     = new THREE.MeshLambertMaterial({ color: 0xc8bfaf })
  const rust      = new THREE.MeshLambertMaterial({ color: 0x6b3020 })

  // Cardboard box on floor, close to player right side
  const box1 = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.3, 0.28), cardboard)
  box1.position.set(1.8, 0.15, 2.5)
  box1.rotation.y = 0.4
  box1.castShadow = true
  box1.receiveShadow = true
  scene.add(box1)

  // Shorter box stacked on it
  const box2 = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.2, 0.22), cardboard)
  box2.position.set(1.75, 0.40, 2.45)
  box2.rotation.y = 0.7
  box2.castShadow = true
  box2.receiveShadow = true
  scene.add(box2)

  // Flat scatter of papers on the floor
  const scatter1 = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.008, 0.32), paper)
  scatter1.position.set(0.3, 0.004, 2.2)
  scatter1.rotation.y = 0.2
  scatter1.receiveShadow = true
  scene.add(scatter1)

  const scatter2 = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.008, 0.28), paper)
  scatter2.position.set(0.55, 0.004, 2.35)
  scatter2.rotation.y = -0.5
  scatter2.receiveShadow = true
  scene.add(scatter2)

  // Heavy box directly beside player's right shoulder
  const closeBox = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.38, 0.3), cardboard)
  closeBox.position.set(1.5, 0.19, 1.5)
  closeBox.rotation.y = -0.3
  closeBox.castShadow = true
  closeBox.receiveShadow = true
  scene.add(closeBox)
}

function buildHangingLights(scene) {
  // 3 columns (X) × 2 rows (Z) = 6 pendant LED strip lights
  // Panels oriented along X axis, parallel to the back/front long walls
  const PANEL_LEN   = 3.2
  const PANEL_H     = 0.06
  const PANEL_D     = 0.11
  const PANEL_Y     = 3.85   // underside of fixture — sits inside the fog band
  const CABLE_TOP_Y = 5.05   // ceiling attachment — swallowed by dense fog

  const housingMat = new THREE.MeshStandardMaterial({ color: 0xb2bac0, roughness: 0.2, metalness: 0.8 })
  const emissiveMat = new THREE.MeshStandardMaterial({
    color: 0xfffaf2,
    emissive: new THREE.Color(0xfffaf2),
    emissiveIntensity: 100,
    roughness: 1,
    metalness: 0,
  })
  const cableMat = new THREE.MeshStandardMaterial({ color: 0x909898, roughness: 0.3, metalness: 0.9 })

  // 2 evenly-spaced columns across room width (X: -4 to +10)
  const xCols = [0.7, 5.3]
  // 3 rows along room depth (Z: -3 to +10)
  const zRows = [0.25, 3.5, 6.75]

  const cableLen = CABLE_TOP_Y - (PANEL_Y + PANEL_H)
  const cableGeo  = new THREE.CylinderGeometry(0.004, 0.004, cableLen, 6)
  const canopyGeo = new THREE.CylinderGeometry(0.072, 0.072, 0.028, 16)

  for (const x of xCols) {
    for (const z of zRows) {
      const group = new THREE.Group()
      group.position.set(x, 0, z)

      // Aluminum housing bar
      const housing = new THREE.Mesh(new THREE.BoxGeometry(PANEL_LEN, PANEL_H, PANEL_D), housingMat)
      housing.position.set(0, PANEL_Y + PANEL_H * 0.5, 0)
      group.add(housing)

      // Glowing diffuser strip on the bottom face
      const glow = new THREE.Mesh(new THREE.BoxGeometry(PANEL_LEN - 0.05, 0.007, PANEL_D - 0.03), emissiveMat)
      glow.position.set(0, PANEL_Y, 0)
      group.add(glow)

      // Two suspension cables + ceiling canopies (one at each end)
      for (const side of [-1, 1]) {
        const cx = side * (PANEL_LEN * 0.5 - 0.18)

        const cable = new THREE.Mesh(cableGeo, cableMat)
        cable.position.set(cx, PANEL_Y + PANEL_H + cableLen * 0.5, 0)
        group.add(cable)

      
      }

      scene.add(group)
    }
  }
}

export function getCollidables() {
  return collidables
}
