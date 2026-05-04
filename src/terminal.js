import { typewriter } from './typewriter.js'

const MAX_LINES = 20

const terminalEl   = document.getElementById('terminal')
const outputEl     = document.getElementById('terminal-output')
const inputRowEl   = document.getElementById('terminal-input-row')
const inputEl      = document.getElementById('terminal-input')
const choicesEl    = document.getElementById('terminal-choices')
const cursorEl     = document.getElementById('terminal-cursor')
const hintEl       = document.getElementById('hint')

let hintTimeout = null

// ── Visibility ────────────────────────────────────────────────
export function showTerminal() {
  terminalEl.classList.add('visible')
  requestAnimationFrame(() => terminalEl.classList.add('active'))
}

export function hideTerminal() {
  terminalEl.classList.remove('active')
  setTimeout(() => terminalEl.classList.remove('visible'), 650)
}

// ── Output ────────────────────────────────────────────────────
export function clearOutput() {
  outputEl.innerHTML = ''
}

export function printLine(text, speed = 35, onDone) {
  const p = document.createElement('p')
  if (text.startsWith('[child]:'))       p.classList.add('line-child')
  else if (text.startsWith('[WHOAMI]:') ||
           text.startsWith('> '))        p.classList.add('line-player')
  outputEl.appendChild(p)
  trimLines()

  typewriter(text, char => { p.textContent += char }, onDone, speed)
}

export function printLineAsync(text, speed = 35) {
  return new Promise(resolve => printLine(text, speed, resolve))
}

function trimLines() {
  const lines = outputEl.querySelectorAll('p')
  if (lines.length > MAX_LINES) {
    const excess = lines.length - MAX_LINES
    for (let i = 0; i < excess; i++) {
      const old = lines[i]
      old.classList.add('faded')
      setTimeout(() => old.remove(), 900)
    }
  }
}

// ── Cursor ────────────────────────────────────────────────────
export function showCursor() {
  cursorEl.style.display = 'block'
}

export function hideCursor() {
  cursorEl.style.display = 'none'
}

// ── Name Input ────────────────────────────────────────────────
export function showNameInput(onSubmit) {
  inputRowEl.classList.add('visible')
  inputEl.value = ''
  inputEl.focus()

  function handleKey(e) {
    if (e.key === 'Enter') {
      window.removeEventListener('keydown', handleKey)
      const val = inputEl.value
      hideNameInput()
      onSubmit(val)
    }
  }
  window.addEventListener('keydown', handleKey)
}

export function hideNameInput() {
  inputRowEl.classList.remove('visible')
  inputEl.blur()
}

// ── Choices ───────────────────────────────────────────────────
export function showChoices(options, onSelect) {
  choicesEl.innerHTML = ''
  choicesEl.classList.add('visible')

  for (const opt of options) {
    const btn = document.createElement('button')
    btn.textContent = opt.label
    if (opt.locked) btn.classList.add('locked')
    btn.addEventListener('click', () => {
      if (opt.locked) return
      hideChoices()
      onSelect(opt.id)
    })
    choicesEl.appendChild(btn)
  }
}

export function hideChoices() {
  choicesEl.classList.remove('visible')
  choicesEl.innerHTML = ''
}

// ── Hint ──────────────────────────────────────────────────────
export function showHint(text) {
  clearHint()
  hintEl.textContent = text
  hintEl.classList.add('visible')
  hintTimeout = setTimeout(() => clearHint(), 4000)
}

export function clearHint() {
  if (hintTimeout) { clearTimeout(hintTimeout); hintTimeout = null }
  hintEl.classList.remove('visible')
}

// ── Color ─────────────────────────────────────────────────────
export function setTerminalColor(color) {
  terminalEl.style.setProperty('--terminal-color', color)
  hintEl.style.color = color
}

// ── Fade to black ─────────────────────────────────────────────
export function fadeToBlack() {
  const overlay = document.createElement('div')
  overlay.style.cssText = [
    'position:fixed', 'inset:0', 'background:#000',
    'opacity:0', 'transition:opacity 3s ease',
    'z-index:100', 'pointer-events:none',
  ].join(';')
  document.body.appendChild(overlay)
  requestAnimationFrame(() => requestAnimationFrame(() => {
    overlay.style.opacity = '1'
  }))
}
