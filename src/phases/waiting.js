import { registerPhase, setState, GameState } from '../state.js'
import { printLineAsync, showCursor } from '../terminal.js'

const WAIT_DURATION = 30000 // ms — shorten to 3000 during dev
let elapsed = 0
let active  = false

async function enter() {
  elapsed = 0
  active  = true
  showCursor()
  await printLineAsync('...', 60)
}

function update(delta) {
  if (!active) return
  elapsed += delta * 1000
  if (elapsed >= WAIT_DURATION) {
    active = false
    setState('DIALOGUE')
  }
}

function exit() {
  active = false
}

export function initWaiting() {
  registerPhase('WAITING', { enter, update, exit })
}
