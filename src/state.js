export const GameState = {
  phase: 'AMBIENT',
  playerName: '',
  hasFigurine: false,
  terminalMode: false,
  transitioning: false,
  wrongChoicesSeen: new Set(), // 'hammer' | 'screwdriver' | 'radar'
}

const phaseHandlers = {}

export function registerPhase(name, { enter, update, exit }) {
  phaseHandlers[name] = { enter, update, exit }
}

export function setState(newPhase) {
  phaseHandlers[GameState.phase]?.exit?.()
  GameState.phase = newPhase
  phaseHandlers[newPhase]?.enter?.()
}

export function getUpdater() {
  return phaseHandlers[GameState.phase]?.update ?? null
}
