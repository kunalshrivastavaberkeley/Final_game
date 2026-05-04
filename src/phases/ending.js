import { registerPhase, GameState } from '../state.js'
import { clearOutput, printLineAsync, fadeToBlack } from '../terminal.js'
import { humHandle, fadeOut, playHappyBirthday } from '../audio.js'
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
  await sleep(3800)
  if (GameState.phase !== 'ENDING') return
  showBirthdaySurprise()
  playHappyBirthday()
}

function showBirthdaySurprise() {
  const overlay = document.createElement('div')
  overlay.id = 'birthday-overlay'

  const img = document.createElement('img')
  img.id = 'birthday-img'
  img.src = `${import.meta.env.BASE_URL}birthday.png`
  img.alt = ''

  const text = document.createElement('div')
  text.id = 'birthday-text'
  text.textContent = 'Happy Birthday Siwen!!!'

  overlay.appendChild(img)
  overlay.appendChild(text)
  document.body.appendChild(overlay)

  requestAnimationFrame(() => requestAnimationFrame(() => {
    overlay.classList.add('visible')
  }))
}

function exit() {}

export function initEnding() {
  registerPhase('ENDING', { enter, update: null, exit })
}
