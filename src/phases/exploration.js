import { registerPhase, setState, GameState } from '../state.js'
import { startTransition } from '../camera.js'
import { hideTerminal, showHint, clearHint } from '../terminal.js'
import { lockPointer, unlockPointer, isNearDesk } from '../player.js'
import { monitorMesh } from '../scene.js'
import * as THREE from 'three'

function enter() {
  GameState.terminalMode = false
  hideTerminal()

  if (monitorMesh) monitorMesh.material.emissive = new THREE.Color(0x000000)

  startTransition('terminal', 'free', 1800, () => {
    lockPointer()
    showHint('WASD to move.   E near the shelf to pick up.')
    setTimeout(() => clearHint(), 6000)
  })
}

function update(_delta) {
  if (GameState.hasFigurine && isNearDesk()) {
    setState('RETURN')
  }
}

function exit() {
  unlockPointer()
  clearHint()
}

export function initExploration() {
  registerPhase('EXPLORATION', { enter, update, exit })
}
