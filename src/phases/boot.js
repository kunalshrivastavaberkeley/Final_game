import { registerPhase, setState, GameState } from '../state.js'
import { showTerminal, printLineAsync, showNameInput, hideNameInput, setTerminalColor, hideCursor } from '../terminal.js'
import { terminalGlow, monitorMesh } from '../scene.js'
import { playLoop, setHumHandle } from '../audio.js'
import { sleep } from '../utils.js'
import * as THREE from 'three'

const BOOT_LINES = [
  { text: 'TERMINAL OS v2.31 — loading...', speed: 15 },
  { text: 'memory check.................. OK',  speed: 15 },
  { text: 'display subsystem............. OK',  speed: 15 },
  { text: 'input subsystem............... OK',  speed: 15 },
  { text: 'network....................... OFFLINE', speed: 15 },
  { text: '>',                                  speed: 15 },
]

async function enter() {
  if (GameState.phase !== 'BOOT') return
  showTerminal()
  setTerminalColor('#33ff33')
  hideCursor()

  if (terminalGlow) terminalGlow.intensity = 0.4
  if (monitorMesh)  monitorMesh.material.emissive = new THREE.Color(0x001a00)

  const humH = playLoop('hum', 0.08)
  setHumHandle(humH)

  for (const { text, speed } of BOOT_LINES) {
    if (GameState.phase !== 'BOOT') return
    await printLineAsync(text, speed)
    await sleep(80)
  }

  await sleep(600)
  if (GameState.phase !== 'BOOT') return
  await printLineAsync('WHO ARE YOU?', 40)

  showNameInput(async (val) => {
    hideNameInput()
    if (GameState.phase !== 'BOOT') return
    GameState.playerName = "I don't remember"
    await printLineAsync(`> ${GameState.playerName}`, 40)
    await sleep(400)
    if (GameState.phase !== 'BOOT') return
    await printLineAsync(`hello, i don't remember.`, 50)
    await sleep(300)
    setState('WAITING')
  })
}

function exit() {}

export function initBoot() {
  registerPhase('BOOT', { enter, update: null, exit })
}
