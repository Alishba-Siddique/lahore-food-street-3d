import * as THREE from 'three'

export const CAMERA_BLOCKERS = [
  // Food Street facade masses. These are intentionally conservative boxes that keep the lens out of roofs/walls.
  { name: 'left-facade-50', min: [-12.7, -0.5, 46.0], max: [-7.0, 11.5, 54.0] },
  { name: 'left-facade-42', min: [-12.5, -0.5, 38.2], max: [-7.0, 10.2, 45.8] },
  { name: 'left-facade-34', min: [-12.2, -0.5, 30.0], max: [-6.8, 12.2, 38.0] },
  { name: 'left-facade-25', min: [-11.8, -0.5, 21.1], max: [-6.5, 10.4, 29.0] },
  { name: 'right-facade-50', min: [7.0, -0.5, 46.0], max: [12.7, 11.0, 54.0] },
  { name: 'right-facade-42', min: [7.0, -0.5, 38.0], max: [12.7, 12.0, 46.0] },
  { name: 'right-facade-34', min: [6.8, -0.5, 30.0], max: [12.5, 10.6, 38.0] },
  { name: 'right-facade-25', min: [6.4, -0.5, 21.0], max: [12.2, 11.2, 29.2] },
  { name: 'haveli-rooftop', min: [6.55, -0.5, 23.0], max: [14.45, 8.04, 31.2] },
  { name: 'shahi-paan', min: [-7.5, -0.2, 16.8], max: [-4.0, 3.5, 19.7] },
  // Iqbal Tomb: its front facade faces roughly toward negative world X.
  { name: 'iqbal-tomb', min: [4.45, -0.2, -3.65], max: [9.15, 4.35, 2.65] },
  // Hero monuments, only to prevent accidental entry from branch cameras.
  { name: 'badshahi-prayer-hall', min: [22.0, -0.5, -23.0], max: [32.5, 12.0, 3.0] },
  { name: 'alamgiri-gate', min: [-34.5, -0.5, -18.0], max: [-22.0, 12.0, -2.0] },
]

function vector3(value) {
  return Array.isArray(value) ? new THREE.Vector3(...value) : value
}

function contains(box, point) {
  return point.x > box.min.x && point.x < box.max.x && point.y > box.min.y && point.y < box.max.y && point.z > box.min.z && point.z < box.max.z
}

function segmentHit(start, end, rawBox) {
  const box = { min: vector3(rawBox.min), max: vector3(rawBox.max) }
  const direction = end.clone().sub(start)
  let tMin = 0
  let tMax = 1

  for (const axis of ['x', 'y', 'z']) {
    const s = start[axis]
    const d = direction[axis]
    const min = box.min[axis]
    const max = box.max[axis]

    if (Math.abs(d) < 1e-6) {
      if (s < min || s > max) return null
      continue
    }

    let t1 = (min - s) / d
    let t2 = (max - s) / d
    if (t1 > t2) [t1, t2] = [t2, t1]
    tMin = Math.max(tMin, t1)
    tMax = Math.min(tMax, t2)
    if (tMin > tMax) return null
  }

  if (tMax < 0 || tMin > 1) return null
  return Math.max(0, tMin)
}

function pushOutside(point, rawBox, margin = 0.35) {
  const box = { min: vector3(rawBox.min), max: vector3(rawBox.max) }
  if (!contains(box, point)) return point

  const candidates = [
    { distance: Math.abs(point.x - box.min.x), axis: 'x', value: box.min.x - margin },
    { distance: Math.abs(box.max.x - point.x), axis: 'x', value: box.max.x + margin },
    { distance: Math.abs(point.y - box.min.y), axis: 'y', value: box.min.y - margin },
    { distance: Math.abs(box.max.y - point.y), axis: 'y', value: box.max.y + margin },
    { distance: Math.abs(point.z - box.min.z), axis: 'z', value: box.min.z - margin },
    { distance: Math.abs(box.max.z - point.z), axis: 'z', value: box.max.z + margin },
  ].sort((a, b) => a.distance - b.distance)

  const result = point.clone()
  result[candidates[0].axis] = candidates[0].value
  return result
}

export function resolveCameraPosition(target, desired, blockers = CAMERA_BLOCKERS, margin = 0.55) {
  const direction = desired.clone().sub(target)
  const distance = direction.length()
  if (distance < 0.001) return { position: desired.clone(), blocker: null }

  let earliest = 1
  let hitBlocker = null

  for (const raw of blockers) {
    const box = { min: vector3(raw.min), max: vector3(raw.max) }
    // If the target itself is intentionally on/in a landmark, do not treat that landmark as an obstruction.
    if (contains(box, target)) continue
    const hit = segmentHit(target, desired, raw)
    if (hit !== null && hit < earliest) {
      earliest = hit
      hitBlocker = raw
    }
  }

  let corrected = desired.clone()
  if (hitBlocker) {
    const safeT = Math.max(0.16, earliest - margin / distance)
    corrected = target.clone().add(direction.multiplyScalar(safeT))
  }

  for (const raw of blockers) corrected = pushOutside(corrected, raw, margin)
  corrected.y = Math.max(1.15, corrected.y)

  return { position: corrected, blocker: hitBlocker?.name || null }
}
