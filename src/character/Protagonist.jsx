import React, { Suspense, useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { clone as cloneSkeleton } from 'three/examples/jsm/utils/SkeletonUtils.js'
import { getProtagonistPosition, protagonistMode } from './path'

const MICHELLE_URL = 'https://threejs.org/examples/models/gltf/Michelle.glb'
const XBOT_URL = 'https://threejs.org/examples/models/gltf/Xbot.glb'

function removeRootTranslation(clip) {
  const clone = clip.clone()
  clone.tracks = clone.tracks.filter((track) => {
    const name = track.name.toLowerCase()
    return !(name.includes('hips.position') || name.includes('root.position'))
  })
  return clone
}

function AnimatedRig({ progress, routeChoice }) {
  const root = useRef()
  const modelRoot = useRef()
  const michelle = useGLTF(MICHELLE_URL)
  const xbot = useGLTF(XBOT_URL)

  const model = useMemo(() => cloneSkeleton(michelle.scene), [michelle.scene])
  const animationState = useRef({ mixer: null, idle: null, walk: null, active: null })

  useEffect(() => {
    model.traverse((child) => {
      if (!child.isMesh && !child.isSkinnedMesh) return
      child.castShadow = true
      child.receiveShadow = true
      if (child.material) {
        child.material = child.material.clone()
        child.material.roughness = Math.max(0.52, child.material.roughness ?? 0.6)
        child.material.metalness = Math.min(0.12, child.material.metalness ?? 0)
      }
    })

    const mixer = new THREE.AnimationMixer(model)
    const idleClip = xbot.animations.find((clip) => clip.name.toLowerCase() === 'idle')
    const walkClip = xbot.animations.find((clip) => clip.name.toLowerCase() === 'walk')

    // Michelle and Xbot use compatible Mixamo-style bone names in the Three.js examples.
    // We strip root translation so movement remains controlled by the scroll path.
    const idle = idleClip ? mixer.clipAction(removeRootTranslation(idleClip)) : null
    const walk = walkClip ? mixer.clipAction(removeRootTranslation(walkClip)) : null

    idle?.setLoop(THREE.LoopRepeat, Infinity)
    walk?.setLoop(THREE.LoopRepeat, Infinity)
    idle?.play()

    animationState.current = { mixer, idle, walk, active: idle }
    return () => mixer.stopAllAction()
  }, [model, xbot.animations])

  const lastPosition = useRef(new THREE.Vector3())

  useFrame((_, delta) => {
    if (!root.current) return

    const target = getProtagonistPosition(progress, routeChoice)
    const previous = root.current.position.clone()
    root.current.position.lerp(target, 1 - Math.pow(0.0007, delta))

    const velocity = target.clone().sub(previous)
    if (velocity.lengthSq() > 0.00002) {
      const yaw = Math.atan2(velocity.x, velocity.z)
      root.current.rotation.y = THREE.MathUtils.lerp(root.current.rotation.y, yaw, 0.13)
    }

    const mode = protagonistMode(progress)
    const { mixer, idle, walk } = animationState.current
    mixer?.update(delta)

    const desiredAction = mode === 'idle' ? idle : (walk || idle)
    if (desiredAction && desiredAction !== animationState.current.active) {
      animationState.current.active?.fadeOut(0.25)
      desiredAction.reset().fadeIn(0.25).play()
      animationState.current.active = desiredAction
    }

    if (walk) {
      // Slow the animation on stairs so feet do not look like they are sprinting upward.
      walk.timeScale = mode === 'climb' || mode === 'descend' ? 0.62 : 0.95
    }

    if (modelRoot.current) {
      const speed = root.current.position.distanceTo(lastPosition.current) / Math.max(delta, 0.001)
      const microBob = mode === 'idle' ? Math.sin(performance.now() * 0.0012) * 0.006 : Math.min(speed * 0.002, 0.012)
      modelRoot.current.position.y = microBob
    }

    lastPosition.current.copy(root.current.position)
  })

  return (
    <group ref={root} name="protagonist" userData={{ cameraIgnore: true }}>
      <group ref={modelRoot} rotation={[0, Math.PI, 0]}>
        <primitive object={model} />
      </group>
      {/* Small, realistic-scale crossbody bag as a secondary prop; the body itself is a skinned GLB. */}
      <mesh position={[0.28, 1.0, -0.18]} rotation={[0.1, 0.2, -0.18]} castShadow>
        <capsuleGeometry args={[0.16, 0.25, 6, 10]} />
        <meshStandardMaterial color="#714a34" roughness={0.78} />
      </mesh>
      <mesh position={[0.02, 1.35, -0.18]} rotation={[0, 0, -0.48]} castShadow>
        <torusGeometry args={[0.55, 0.025, 8, 28, Math.PI * 1.16]} />
        <meshStandardMaterial color="#9b704b" roughness={0.72} />
      </mesh>
    </group>
  )
}

export default function Protagonist(props) {
  return (
    <Suspense fallback={null}>
      <AnimatedRig {...props} />
    </Suspense>
  )
}

useGLTF.preload(MICHELLE_URL)
useGLTF.preload(XBOT_URL)
