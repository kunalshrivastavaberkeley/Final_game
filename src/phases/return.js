import { registerPhase, setState, GameState } from '../state.js'
import { startTransition } from '../camera.js'
import { showTerminal, printLineAsync, hideCursor } from '../terminal.js'
import { terminalGlow, monitorMesh } from '../scene.js'
import { sleep } from '../utils.js'
import * as THREE from 'three'

async function enter() {
  GameState.terminalMode = true
  startTransition('free', 'terminal', 1800, async () => {
    showTerminal()
    if (terminalGlow) terminalGlow.intensity = 0.4
    if (monitorMesh)  monitorMesh.material.emissive = new THREE.Color(0x001a00)
    hideCursor()

    await sleep(500)
    if (GameState.phase !== 'RETURN') return
    await printLineAsync("[her]: I found it. I'll leave it somewhere safe for you.", 55)
    await sleep(600)
    await printLineAsync('[child]: wait', 55)
    await sleep(500)
    if (GameState.phase !== 'RETURN') return
    await printLineAsync('[child]: i think. i think that one is yours actually', 60)
    await sleep(800)
    await printLineAsync('[her]: what do you mean', 55)
    await sleep(400)
    if (GameState.phase !== 'RETURN') return
    await printLineAsync('[child]: someone left it there for you. i just needed you to find it.', 60)
    await sleep(1200)
    if (GameState.phase !== 'RETURN') return
    await printLineAsync('> ...', 80)
    await sleep(1000)
    await printLineAsync('[child]: thank you for always helping. even when nobody asks you to. even when nobody says thank you.', 65)
    await sleep(800)
    if (GameState.phase !== 'RETURN') return
    await printLineAsync('[child]: thank you.', 80)
    await sleep(600)
    await printLineAsync('> CONNECTION CLOSED', 40)
    await sleep(800)
    setState('ENDING')
  })
}

function exit() {}

export function initReturn() {
  registerPhase('RETURN', { enter, update: null, exit })
}
