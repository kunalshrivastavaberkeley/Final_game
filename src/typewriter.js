export function typewriter(text, onChar, onDone, speed = 35) {
  let i = 0
  function tick() {
    if (i >= text.length) { onDone?.(); return }
    onChar(text[i++])
    setTimeout(tick, speed + Math.random() * 20)
  }
  tick()
  return { cancel: () => { i = text.length } }
}
