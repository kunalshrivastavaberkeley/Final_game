import { registerPhase, setState } from '../state.js'
import { startTransition } from '../camera.js'
import { playLoop, fadeOut } from '../audio.js'

let fanHandle = null

function enter() {
  fanHandle = playLoop('fan', 0.6)
  setTimeout(() => {
    startTransition('free', 'terminal', 2100, () => {
      fadeOut(fanHandle, 1.5)
      setState('BOOT')
    })
  }, 400)
}

function exit() {}

export function initAmbient() {
  registerPhase('AMBIENT', { enter, update: null, exit })
}
