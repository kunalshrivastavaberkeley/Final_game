const ctx = new AudioContext()
const tracks = {}

export let humHandle = null

export async function loadAudio(key, url) {
  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error(res.statusText)
    const buf = await res.arrayBuffer()
    tracks[key] = await ctx.decodeAudioData(buf)
  } catch (e) {
    console.warn(`Audio '${key}' not loaded (${url}):`, e.message)
  }
}

export function playLoop(key, volume = 1.0) {
  if (!tracks[key]) return null
  const gainNode = ctx.createGain()
  gainNode.gain.value = volume
  const src = ctx.createBufferSource()
  src.buffer = tracks[key]
  src.loop = true
  src.connect(gainNode)
  gainNode.connect(ctx.destination)
  src.start()
  return { gainNode, src }
}

export function playOnce(key, volume = 1.0) {
  if (!tracks[key]) return
  const gainNode = ctx.createGain()
  gainNode.gain.value = volume
  const src = ctx.createBufferSource()
  src.buffer = tracks[key]
  src.connect(gainNode)
  gainNode.connect(ctx.destination)
  src.start()
}

export function fadeOut(handle, durationSec) {
  if (!handle?.gainNode) return
  handle.gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + durationSec)
}

export function resumeContext() {
  return ctx.resume()
}

export function setHumHandle(h) { humHandle = h }

export function playHappyBirthday() {
  // [frequency_hz, duration_sec] — 0 freq = rest
  const notes = [
    // "Hap-py Birth-day to you"
    [392, 0.35], [392, 0.15], [440, 0.5], [392, 0.5], [523, 0.5], [494, 1.1], [0, 0.15],
    // "Hap-py Birth-day to you"
    [392, 0.35], [392, 0.15], [440, 0.5], [392, 0.5], [587, 0.5], [523, 1.1], [0, 0.15],
    // "Hap-py Birth-day dear Si-wen"
    [392, 0.35], [392, 0.15], [784, 0.5], [659, 0.5], [523, 0.5], [494, 0.5], [440, 1.1], [0, 0.15],
    // "Hap-py Birth-day to you"
    [698, 0.35], [698, 0.15], [659, 0.5], [523, 0.5], [587, 0.5], [523, 1.4],
  ]

  const masterGain = ctx.createGain()
  masterGain.gain.value = 2.5
  masterGain.connect(ctx.destination)

  let t = ctx.currentTime + 0.05
  for (const [freq, dur] of notes) {
    if (freq > 0) {
      const osc = ctx.createOscillator()
      osc.type = 'triangle'
      osc.frequency.value = freq

      const env = ctx.createGain()
      env.gain.setValueAtTime(0.001, t)
      env.gain.exponentialRampToValueAtTime(1.0, t + 0.02)
      env.gain.setValueAtTime(1.0, t + dur * 0.75)
      env.gain.exponentialRampToValueAtTime(0.001, t + dur * 0.95)

      osc.connect(env)
      env.connect(masterGain)
      osc.start(t)
      osc.stop(t + dur)
    }
    t += dur
  }
}
