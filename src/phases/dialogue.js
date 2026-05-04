import { registerPhase, setState, GameState } from '../state.js'
import { printLineAsync, showChoices, hideChoices, hideCursor } from '../terminal.js'
import { WRONG_CHOICES, WRONG_RESPONSES, NARROWING_QUESTIONS } from '../dialogue.js'
import { sleep } from '../utils.js'

// ── Sub-step tracker ──────────────────────────────────────────
let step = 0  // 1=intro/wrong, 2=narrow, 3=switch

async function enter() {
  if (GameState.phase !== 'DIALOGUE') return
  step = 1
  hideCursor()

  await sleep(800)
  await printLineAsync('[child]: thank you for waiting.', 55)
  await sleep(500)
  if (GameState.phase !== 'DIALOGUE') return
  await printLineAsync('[child]: my toy is broken. can you help me fix it', 55)
  await sleep(400)

  showWrongChoices()
}

function buildWrongChoices() {
  return WRONG_CHOICES.map(c => ({
    ...c,
    locked: c.id === 'ask' && GameState.wrongChoicesSeen.size < 3,
  }))
}

function showWrongChoices() {
  showChoices(buildWrongChoices(), async (id) => {
    if (id === 'ask') {
      await handleAsk()
    } else {
      GameState.wrongChoicesSeen.add(id)
      await printLineAsync(WRONG_RESPONSES[id], 55)
      await sleep(400)
      if (GameState.phase !== 'DIALOGUE') return
      showWrongChoices()
    }
  })
}

async function handleAsk() {
  if (GameState.phase !== 'DIALOGUE') return
  await printLineAsync("[her]: what's wrong with it?", 55)
  await sleep(500)
  await printLineAsync("[child]: its not broken. i just. i cant find it. i lost it.", 60)
  await sleep(600)
  step = 2
  startNarrowingQuestions()
}

// ── Narrowing questions ───────────────────────────────────────
function startNarrowingQuestions() {
  const answeredIds = new Set()

  function buildNarrowChoices() {
    return NARROWING_QUESTIONS.map(q => ({
      id: q.id,
      label: q.label,
      locked: answeredIds.has(q.id),
    }))
  }

  async function onSelect(id) {
    const q = NARROWING_QUESTIONS.find(q => q.id === id)
    answeredIds.add(id)
    await printLineAsync(q.label.replace('> ', '[her]: '), 55)
    await sleep(400)
    if (GameState.phase !== 'DIALOGUE') return
    await printLineAsync(q.response, 60)
    await sleep(500)

    if (answeredIds.size < NARROWING_QUESTIONS.length) {
      showChoices(buildNarrowChoices(), onSelect)
    } else {
      await allNarrowingDone()
    }
  }

  showChoices(buildNarrowChoices(), onSelect)
}

async function allNarrowingDone() {
  if (GameState.phase !== 'DIALOGUE') return
  await printLineAsync("[her]: I'll go look.", 55)
  await sleep(500)
  step = 3
  showChoices([{ id: 'switch', label: '[ SWITCH TO ROOM ]' }], () => {
    setState('EXPLORATION')
  })
}

function exit() {
  hideChoices()
}

export function initDialogue() {
  registerPhase('DIALOGUE', { enter, update: null, exit })
}
