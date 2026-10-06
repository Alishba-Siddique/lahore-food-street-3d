import * as THREE from 'three'

const clamp01 = (v) => Math.max(0, Math.min(1, v))
const smooth = (t) => t * t * (3 - 2 * t)

function sample(frames, progress) {
  if (progress <= frames[0].p) return frames[0].value.clone()
  if (progress >= frames[frames.length - 1].p) return frames[frames.length - 1].value.clone()
  for (let i = 0; i < frames.length - 1; i += 1) {
    const a = frames[i]
    const b = frames[i + 1]
    if (progress >= a.p && progress <= b.p) {
      const t = smooth(clamp01((progress - a.p) / Math.max(0.0001, b.p - a.p)))
      return a.value.clone().lerp(b.value, t)
    }
  }
  return frames[0].value.clone()
}

export function protagonistFrames(routeChoice = 'mosque') {
  const end = routeChoice === 'fort'
    ? new THREE.Vector3(-31.2, 0, -10)
    : new THREE.Vector3(25.6, 1.1, -10)

  return [
    { p: 0.08, value: new THREE.Vector3(-0.6, 0, 53) },
    { p: 0.15, value: new THREE.Vector3(-0.8, 0, 48) },
    { p: 0.22, value: new THREE.Vector3(-2.1, 0, 44) },
    { p: 0.30, value: new THREE.Vector3(-1.5, 0, 38.5) },
    { p: 0.39, value: new THREE.Vector3(-1.5, 0, 33.3) },
    { p: 0.445, value: new THREE.Vector3(5.3, 0.2, 31.0) },
    { p: 0.47, value: new THREE.Vector3(5.3, 4.15, 27.55) },
    { p: 0.495, value: new THREE.Vector3(8.35, 8.15, 27.55) },
    { p: 0.525, value: new THREE.Vector3(9.3, 8.16, 27.1) },
    { p: 0.545, value: new THREE.Vector3(8.35, 8.15, 27.55) },
    { p: 0.565, value: new THREE.Vector3(5.3, 4.15, 27.55) },
    { p: 0.585, value: new THREE.Vector3(5.3, 0.2, 31.0) },
    { p: 0.61, value: new THREE.Vector3(-3.8, 0, 19.4) },
    { p: 0.67, value: new THREE.Vector3(0, 0, 12) },
    { p: 0.73, value: new THREE.Vector3(0, 0, 4.5) },
    { p: 0.78, value: new THREE.Vector3(0, 0, -1) },
    { p: 0.82, value: new THREE.Vector3(4.5, 0, -1) },
    { p: 0.87, value: new THREE.Vector3(4.5, 0, -1) },
    { p: 0.92, value: new THREE.Vector3(routeChoice === 'fort' ? -8 : 11, 0, -5) },
    { p: 0.97, value: new THREE.Vector3(routeChoice === 'fort' ? -20 : 18, routeChoice === 'fort' ? 0 : 0.6, -8) },
    { p: 1, value: end },
  ]
}

export function getProtagonistPosition(progress, routeChoice = 'mosque') {
  return sample(protagonistFrames(routeChoice), progress)
}

export function protagonistIsPaused(progress) {
  return [
    [0.215, 0.235],
    [0.295, 0.315],
    [0.385, 0.405],
    [0.515, 0.535],
    [0.60, 0.62],
    [0.81, 0.835],
  ].some(([a, b]) => progress >= a && progress <= b)
}

export function protagonistMode(progress) {
  if (progress >= 0.445 && progress < 0.495) return 'climb'
  if (progress >= 0.545 && progress < 0.585) return 'descend'
  if (protagonistIsPaused(progress)) return 'idle'
  return progress > 0.08 ? 'walk' : 'idle'
}
