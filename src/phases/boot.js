import { registerPhase, setState, GameState } from '../state.js'
import { showTerminal, printLineAsync, showNameInput, hideNameInput, setTerminalColor, hideCursor } from '../terminal.js'
import { monitorMesh } from '../scene.js'
import { playLoop, setHumHandle } from '../audio.js'
import { sleep } from '../utils.js'
import * as THREE from 'three'

const boot_text_speed = 10
const BOOT_LINES = [
  { text: 'TERMINAL OS v5.04 — loading...', speed: boot_text_speed },
  { text: 'memory check.................. OK',  speed: boot_text_speed },
  { text: 'display subsystem............. OK',  speed: boot_text_speed },
  { text: 'input subsystem............... OK',  speed: boot_text_speed },
  { text: 'network....................... OFFLINE', speed: boot_text_speed },
  { text: '>',                                  speed: boot_text_speed },
]

async function enter() {
  if (GameState.phase !== 'BOOT') return
  showTerminal()
  setTerminalColor('#33ff33')
  hideCursor()

  if (monitorMesh) monitorMesh.material.emissive.set(0x000000)

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
    GameState.playerName = "WHOAMI"
    await printLineAsync(`> ${GameState.playerName}`, 40)
    await sleep(400)
    if (GameState.phase !== 'BOOT') return
    await printLineAsync(`hello, Mrs. WHOAMI.`, 50)
    if (GameState.phase !== 'BOOT') return
    await sleep(300)
    if (GameState.phase !== 'BOOT') return
    await printLineAsync(`-. . .-. -.`, 400)
    await printLineAsync(`please wait`, 500)
    await sleep(15000)
    setState('WAITING')
  })
}

function exit() {}

export function initBoot() {
  registerPhase('BOOT', { enter, update: null, exit })
}
