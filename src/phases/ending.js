import { registerPhase, GameState } from '../state.js'
import { clearOutput, printLineAsync, fadeToBlack } from '../terminal.js'
import { humHandle, fadeOut } from '../audio.js'
import { sleep } from '../utils.js'

async function enter() {
  await sleep(2000)
  if (GameState.phase !== 'ENDING') return
  clearOutput()
  await sleep(800)
  await printLineAsync('> whoami', 80)
  await sleep(1200)
  if (GameState.phase !== 'ENDING') return
  await printLineAsync('> Siwen', 90)
  await sleep(2500)
  fadeOut(humHandle, 3)
  fadeToBlack()
}

function exit() {}

export function initEnding() {
  registerPhase('ENDING', { enter, update: null, exit })
}
