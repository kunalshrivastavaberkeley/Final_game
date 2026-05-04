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
