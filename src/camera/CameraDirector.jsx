import React, { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { getProtagonistPosition } from '../character/path'
import { resolveCameraPosition } from './collision'

const clamp01 = (v) => Math.max(0, Math.min(1, v))
const smooth = (t) => t * t * (3 - 2 * t)

function sampleVector(frames, p) {
  if (p <= frames[0].p) return frames[0].value.clone()
  if (p >= frames[frames.length - 1].p) return frames[frames.length - 1].value.clone()
  for (let i = 0; i < frames.length - 1; i += 1) {
    const a = frames[i]
    const b = frames[i + 1]
    if (p >= a.p && p <= b.p) {
      const t = smooth(clamp01((p - a.p) / Math.max(0.0001, b.p - a.p)))
      return a.value.clone().lerp(b.value, t)
    }
  }
  return frames[0].value.clone()
}

function sampleNumber(frames, p) {
  if (p <= frames[0].p) return frames[0].value
  if (p >= frames[frames.length - 1].p) return frames[frames.length - 1].value
  for (let i = 0; i < frames.length - 1; i += 1) {
    const a = frames[i]
    const b = frames[i + 1]
    if (p >= a.p && p <= b.p) {
      const t = smooth(clamp01((p - a.p) / Math.max(0.0001, b.p - a.p)))
      return THREE.MathUtils.lerp(a.value, b.value, t)
    }
  }
  return frames[0].value
}

function activeShot(progress) {
  if (progress < 0.08) return 'aerial-establishing'
  if (progress < 0.39) return 'food-street-follow'
  if (progress < 0.445) return 'qawwali'
  if (progress < 0.495) return 'stair-climb'
  if (progress < 0.545) return 'rooftop-reveal'
  if (progress < 0.585) return 'stair-descent'
  if (progress < 0.66) return 'paan-stop'
  if (progress < 0.78) return 'roshnai-transition'
  if (progress < 0.87) return 'iqbal-tomb'
  if (progress < 0.93) return 'heritage-overview'
  return 'branch-ending'
}

export default function CameraDirector({ progress, routeChoice }) {
  const { camera } = useThree()
  const [debug, setDebug] = useState(false)
  const desiredMarker = useRef()
  const correctedMarker = useRef()
  const targetMarker = useRef()
  const line = useRef()

  const cameraFrames = useMemo(() => {
    const finalPos = routeChoice === 'fort'
      ? new THREE.Vector3(-19.5, 7.8, -1.0)
      : new THREE.Vector3(18.0, 8.4, -2.5)

    return [
      { p: 0, value: new THREE.Vector3(0, 58, 27) },
      { p: 0.07, value: new THREE.Vector3(0, 30, 58) },
      { p: 0.15, value: new THREE.Vector3(7.2, 7.2, 54) },
      { p: 0.22, value: new THREE.Vector3(6.0, 5.2, 48.2) },
      { p: 0.31, value: new THREE.Vector3(-6.4, 5.0, 41.2) },
      { p: 0.39, value: new THREE.Vector3(-7.2, 5.2, 35.8) },
      { p: 0.445, value: new THREE.Vector3(1.4, 4.7, 34.0) },
      { p: 0.47, value: new THREE.Vector3(2.6, 6.6, 31.0) },
      { p: 0.495, value: new THREE.Vector3(4.1, 10.6, 23.3) },
      { p: 0.525, value: new THREE.Vector3(3.1, 11.8, 20.8) },
      { p: 0.545, value: new THREE.Vector3(4.4, 10.2, 23.8) },
      { p: 0.565, value: new THREE.Vector3(2.8, 6.7, 31.0) },
      { p: 0.61, value: new THREE.Vector3(-10.8, 4.6, 21.4) },
      { p: 0.67, value: new THREE.Vector3(0.0, 5.6, 18.2) },
      { p: 0.74, value: new THREE.Vector3(0.0, 3.4, 8.6) },
      // Iqbal fix: move to the front of the tomb instead of behind/on top of it.
      { p: 0.82, value: new THREE.Vector3(-2.8, 5.0, 4.0) },
      { p: 0.87, value: new THREE.Vector3(0.0, 20.5, 1.0) },
      { p: 0.93, value: routeChoice === 'fort' ? new THREE.Vector3(-7.0, 11.2, -1.5) : new THREE.Vector3(8.0, 11.5, -2.0) },
      { p: 1, value: finalPos },
    ]
  }, [routeChoice])

  const focusFrames = useMemo(() => {
    const finalFocus = routeChoice === 'fort'
      ? new THREE.Vector3(-28.6, 4.6, -10)
      : new THREE.Vector3(27, 4.8, -10)

    return [
      { p: 0, value: new THREE.Vector3(0, 0, 18) },
      { p: 0.12, value: new THREE.Vector3(-0.6, 1.4, 48) },
      { p: 0.39, value: new THREE.Vector3(-1.5, 1.5, 33.3) },
      { p: 0.445, value: new THREE.Vector3(5.3, 2.2, 29.4) },
      { p: 0.495, value: new THREE.Vector3(8.7, 8.1, 27.4) },
      // Rooftop skyline reveal: bias the frame toward the heritage horizon rather than a nearby roof slab.
      { p: 0.525, value: new THREE.Vector3(17.0, 6.5, 8.0) },
      { p: 0.565, value: new THREE.Vector3(5.3, 3.5, 28.5) },
      { p: 0.61, value: new THREE.Vector3(-5.5, 1.8, 18.3) },
      { p: 0.67, value: new THREE.Vector3(0, 2.8, 10) },
      { p: 0.74, value: new THREE.Vector3(0, 1.8, 4.5) },
      // Front facade focal point, outside the tomb's collision volume.
      { p: 0.82, value: new THREE.Vector3(4.25, 1.8, -0.4) },
      { p: 0.87, value: new THREE.Vector3(0, 1.0, -6) },
      { p: 1, value: finalFocus },
    ]
  }, [routeChoice])

  const fovFrames = useMemo(() => [
    { p: 0, value: 46 },
    { p: 0.15, value: 50 },
    { p: 0.39, value: 48 },
    { p: 0.495, value: 46 },
    { p: 0.525, value: 43 },
    { p: 0.74, value: 49 },
    { p: 0.82, value: 46 },
    { p: 0.87, value: 44 },
    { p: 1, value: 47 },
  ], [])

  useEffect(() => {
    const onKey = (event) => {
      if (event.key.toLowerCase() === 'c') setDebug((value) => !value)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useFrame((_, delta) => {
    const desired = sampleVector(cameraFrames, progress)
    let focus = sampleVector(focusFrames, progress)

    // During human-follow sections, bias the target toward the protagonist's upper torso.
    if ((progress >= 0.08 && progress < 0.445) || (progress >= 0.545 && progress < 0.66)) {
      const human = getProtagonistPosition(progress, routeChoice).add(new THREE.Vector3(0, 1.35, 0))
      focus.lerp(human, 0.55)
    }

    const resolved = resolveCameraPosition(focus, desired)
    const damping = 1 - Math.pow(0.0014, delta)
    const next = camera.position.clone().lerp(resolved.position, damping)
    const safeNext = resolveCameraPosition(focus, next).position
    camera.position.copy(safeNext)

    const targetFov = sampleNumber(fovFrames, progress)
    camera.fov = THREE.MathUtils.lerp(camera.fov, targetFov, 1 - Math.pow(0.004, delta))
    camera.updateProjectionMatrix()
    camera.lookAt(focus)

    if (debug) {
      desiredMarker.current?.position.copy(desired)
      correctedMarker.current?.position.copy(resolved.position)
      targetMarker.current?.position.copy(focus)
      if (line.current) {
        line.current.geometry.setFromPoints([focus, resolved.position])
        line.current.geometry.attributes.position.needsUpdate = true
      }
    }

    window.__LAHORE_CAMERA_DEBUG__ = {
      shot: activeShot(progress),
      progress: Number(progress.toFixed(4)),
      blocker: resolved.blocker,
      desired: desired.toArray().map((n) => Number(n.toFixed(2))),
      corrected: resolved.position.toArray().map((n) => Number(n.toFixed(2))),
      target: focus.toArray().map((n) => Number(n.toFixed(2))),
      fov: Number(camera.fov.toFixed(2)),
    }
  })

  return (
    <group visible={debug} userData={{ cameraIgnore: true }}>
      <mesh ref={desiredMarker}><sphereGeometry args={[0.16, 12, 8]} /><meshBasicMaterial color="#ff4d4d" depthTest={false} /></mesh>
      <mesh ref={correctedMarker}><sphereGeometry args={[0.18, 12, 8]} /><meshBasicMaterial color="#51f28a" depthTest={false} /></mesh>
      <mesh ref={targetMarker}><sphereGeometry args={[0.14, 12, 8]} /><meshBasicMaterial color="#63b8ff" depthTest={false} /></mesh>
      <line ref={line}><bufferGeometry /><lineBasicMaterial color="#ffffff" depthTest={false} /></line>
    </group>
  )
}
