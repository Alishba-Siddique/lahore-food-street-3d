import React, { useEffect, useMemo, useRef, useState } from 'react'
import ReactDOM from 'react-dom/client'
import * as THREE from 'three'
import { Canvas, useFrame } from '@react-three/fiber'
import { PerspectiveCamera, Stars } from '@react-three/drei'
import { AnimatePresence, motion } from 'framer-motion'
import anime from 'animejs'
import Protagonist from './character/Protagonist'
import CameraDirector from './camera/CameraDirector'
import './styles.css'

const COLORS = {
  sky: '#07152f',
  road: '#4a332a',
  sandstone: '#b54f35',
  sandstoneDark: '#7f2e27',
  fort: '#c8aa7d',
  fortDark: '#8d6d4c',
  marble: '#fff0dc',
  brass: '#d9aa52',
  warm: '#ffb14f',
  cyan: '#4ec7ca',
  pink: '#ed4f87',
  green: '#278368',
}

const clamp01 = (v) => Math.max(0, Math.min(1, v))

function Box({ position = [0, 0, 0], args = [1, 1, 1], color = '#fff', map = null, emissive, emissiveIntensity = 0, rotation = [0, 0, 0], roughness = 0.76, metalness = 0.02, castShadow = true, receiveShadow = true }) {
  return (
    <mesh position={position} rotation={rotation} castShadow={castShadow} receiveShadow={receiveShadow}>
      <boxGeometry args={args} />
      <meshStandardMaterial color={color} map={map || null} emissive={emissive || color} emissiveIntensity={emissiveIntensity} roughness={roughness} metalness={metalness} />
    </mesh>
  )
}

function Cylinder({ position = [0, 0, 0], args = [1, 1, 1, 16], color = '#fff', rotation = [0, 0, 0], roughness = 0.76, metalness = 0.02 }) {
  return (
    <mesh position={position} rotation={rotation} castShadow receiveShadow>
      <cylinderGeometry args={args} />
      <meshStandardMaterial color={color} roughness={roughness} metalness={metalness} />
    </mesh>
  )
}

function Label({ text, position = [0, 0, 0], size = [2.8, 0.6], bg = '#351510', fg = '#fff6dd', rotation = [0, 0, 0], glow = '#ff9e46' }) {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 900
    canvas.height = 210
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.strokeStyle = '#ffc06a'
    ctx.lineWidth = 10
    ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20)
    ctx.fillStyle = fg
    ctx.font = '900 72px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(text, canvas.width / 2, canvas.height / 2 + 5)
    const t = new THREE.CanvasTexture(canvas)
    t.colorSpace = THREE.SRGBColorSpace
    return t
  }, [text, bg, fg])

  return (
    <mesh position={position} rotation={rotation} castShadow>
      <planeGeometry args={size} />
      <meshStandardMaterial map={texture} emissive={glow} emissiveIntensity={0.5} roughness={0.58} />
    </mesh>
  )
}

function Arch({ position = [0, 0, 0], scale = [1, 1, 1], color = COLORS.sandstone, depth = 0.42, rotation = [0, 0, 0] }) {
  const shape = useMemo(() => {
    const s = new THREE.Shape()
    s.moveTo(-1, -1)
    s.lineTo(-1, 0.2)
    s.quadraticCurveTo(-1, 1.25, 0, 1.48)
    s.quadraticCurveTo(1, 1.25, 1, 0.2)
    s.lineTo(1, -1)
    s.closePath()

    const hole = new THREE.Path()
    hole.moveTo(-0.48, -1)
    hole.lineTo(-0.48, 0.08)
    hole.quadraticCurveTo(-0.48, 0.72, 0, 0.92)
    hole.quadraticCurveTo(0.48, 0.72, 0.48, 0.08)
    hole.lineTo(0.48, -1)
    hole.closePath()
    s.holes.push(hole)
    return s
  }, [])
  const geometry = useMemo(() => new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false }), [shape, depth])
  return (
    <mesh geometry={geometry} position={position} scale={scale} rotation={rotation} castShadow receiveShadow>
      <meshStandardMaterial color={color} roughness={0.78} />
    </mesh>
  )
}

function Dome({ position = [0, 0, 0], scale = 1, color = COLORS.marble }) {
  return (
    <group position={position} scale={scale}>
      <mesh castShadow>
        <sphereGeometry args={[1, 32, 20, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={color} roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.97, 0]} castShadow>
        <coneGeometry args={[0.12, 0.5, 12]} />
        <meshStandardMaterial color={COLORS.brass} metalness={0.55} roughness={0.28} />
      </mesh>
    </group>
  )
}

function Chhatri({ position = [0, 0, 0], scale = 1, color = COLORS.fort }) {
  return (
    <group position={position} scale={scale}>
      <Cylinder position={[0, 0.18, 0]} args={[0.72, 0.82, 0.18, 16]} color={color} />
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * Math.PI * 2
        return <Box key={i} position={[Math.cos(a) * 0.58, 0.68, Math.sin(a) * 0.58]} args={[0.1, 0.95, 0.1]} color={color} />
      })}
      <Cylinder position={[0, 1.16, 0]} args={[0.88, 0.88, 0.16, 16]} color={color} />
      <Dome position={[0, 1.22, 0]} scale={0.82} color={color} />
    </group>
  )
}

function Lantern({ position = [0, 0, 0], phase = 0, color = '#ff9b42' }) {
  const ref = useRef()
  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.z = Math.sin(clock.elapsedTime * 0.9 + phase) * 0.03
  })
  return (
    <group ref={ref} position={position}>
      <mesh castShadow>
        <cylinderGeometry args={[0.16, 0.21, 0.46, 8]} />
        <meshStandardMaterial color="#8c3420" emissive={color} emissiveIntensity={2.4} />
      </mesh>
      <pointLight intensity={5.8} distance={5.5} color={color} />
    </group>
  )
}

function Jharokha({ position = [0, 0, 0], color = '#331d17', accent = '#a84b3c' }) {
  return (
    <group position={position}>
      <Box position={[0, 0, -0.15]} args={[1.46, 1.62, 0.22]} color={color} />
      <Box position={[0, -0.74, 0.2]} args={[1.82, 0.14, 0.74]} color={accent} />
      {[-0.68, -0.22, 0.22, 0.68].map((x) => <Box key={x} position={[x, -0.12, 0.38]} args={[0.08, 1.18, 0.08]} color="#241512" />)}
      <Box position={[0, 0.57, 0.3]} args={[1.72, 0.1, 0.72]} color="#281714" />
      <Box position={[0, 0.04, 0.15]} args={[1.1, 1.06, 0.08]} color="#573021" emissive="#ffb16a" emissiveIntensity={1.35} />
    </group>
  )
}

function Awning({ position = [0, 0, 0], width = 1.7, color = '#f2c454' }) {
  return (
    <group position={position}>
      <Box position={[0, 0.02, 0]} args={[width, 0.08, 0.76]} color={color} rotation={[0.2, 0, 0]} />
      {[-width / 2 + 0.07, width / 2 - 0.07].map((x) => <Box key={x} position={[x, -0.25, -0.15]} args={[0.05, 0.54, 0.05]} color="#30211b" />)}
    </group>
  )
}


function makeAgedPlasterTexture(baseColor) {
  if (typeof document === 'undefined') return null
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 512
  const ctx = canvas.getContext('2d')
  const c = new THREE.Color(baseColor)
  const r = Math.round(c.r * 255)
  const g = Math.round(c.g * 255)
  const b = Math.round(c.b * 255)
  ctx.fillStyle = `rgb(${r},${g},${b})`
  ctx.fillRect(0, 0, 512, 512)

  // Fine plaster variation and accumulated dust. Kept subtle so it reads as aged masonry rather than procedural noise.
  for (let i = 0; i < 3800; i += 1) {
    const x = (Math.sin(i * 12.9898) * 43758.5453) % 1
    const y = (Math.sin((i + 71) * 78.233) * 19642.349) % 1
    const px = Math.abs(x) * 512
    const py = Math.abs(y) * 512
    const alpha = 0.015 + (i % 9) * 0.002
    ctx.fillStyle = i % 3 === 0 ? `rgba(255,239,210,${alpha})` : `rgba(45,24,18,${alpha})`
    ctx.fillRect(px, py, 1 + (i % 3), 1 + ((i + 1) % 3))
  }

  // Faded repaired patches.
  for (let i = 0; i < 18; i += 1) {
    const x = (i * 83) % 470
    const y = (i * 137) % 460
    ctx.fillStyle = i % 2 ? 'rgba(244,225,192,.045)' : 'rgba(72,40,30,.04)'
    ctx.beginPath()
    ctx.ellipse(x, y, 18 + (i % 5) * 7, 8 + (i % 4) * 6, i * 0.29, 0, Math.PI * 2)
    ctx.fill()
  }

  // Hairline cracks and base grime.
  ctx.strokeStyle = 'rgba(55,31,24,.14)'
  ctx.lineWidth = 1
  for (let i = 0; i < 11; i += 1) {
    const sx = 30 + ((i * 91) % 430)
    const sy = 45 + ((i * 57) % 300)
    ctx.beginPath()
    ctx.moveTo(sx, sy)
    ctx.lineTo(sx + 8 + (i % 3) * 8, sy + 16)
    ctx.lineTo(sx - 3 + (i % 4) * 5, sy + 32 + (i % 2) * 14)
    ctx.stroke()
  }
  const gradient = ctx.createLinearGradient(0, 360, 0, 512)
  gradient.addColorStop(0, 'rgba(55,32,24,0)')
  gradient.addColorStop(1, 'rgba(45,27,21,.19)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 340, 512, 172)

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(1.5, 1.5)
  texture.anisotropy = 4
  return texture
}

function HeritageBuilding({ position, width = 6.8, height = 8, depth = 4.8, color, accent, label, side }) {
  const rotation = side === 'left' ? Math.PI / 2 : -Math.PI / 2
  const faceZ = side === 'left' ? 2.46 : -2.46
  const signRotation = [0, side === 'left' ? 0 : Math.PI, 0]
  const plasterMap = useMemo(() => makeAgedPlasterTexture(color), [color])
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <Box position={[0, height / 2, 0]} args={[width, height, depth]} color="#ffffff" map={plasterMap} roughness={0.78} />
      <Box position={[0, height + 0.14, 0]} args={[width + 0.35, 0.28, depth + 0.35]} color="#4a2720" />
      <Box position={[0, 0.72, faceZ]} args={[width * 0.82, 0.8, 0.14]} color={accent} />
      <Label text={label} position={[0, 1.08, faceZ + (side === 'left' ? 0.09 : -0.09)]} size={[Math.min(width * 0.7, 4.25), 0.66]} rotation={signRotation} />
      {[-1.75, 0, 1.75].filter((x) => Math.abs(x) < width / 2 - 0.55).map((x, i) => (
        <React.Fragment key={x}>
          <group position={[x, 3.0, faceZ]}>
            {i === 1 ? <Jharokha accent={accent} /> : <><Box args={[1.06, 1.22, 0.12]} color="#281914" /><Box position={[0, 0, side === 'left' ? 0.08 : -0.08]} args={[0.72, 0.86, 0.08]} color="#633423" emissive="#ffad63" emissiveIntensity={1.2} /></>}
          </group>
          <group position={[x, 5.45, faceZ]}>
            <Box args={[1.02, 1.12, 0.12]} color="#281914" />
            <Box position={[0, 0, side === 'left' ? 0.08 : -0.08]} args={[0.72, 0.8, 0.08]} color="#4d291f" emissive="#ffd08b" emissiveIntensity={1.05} />
          </group>
          <Awning position={[x, 1.72, faceZ + (side === 'left' ? 0.34 : -0.34)]} width={1.65} color={i % 2 ? '#f3bf37' : '#f7dcc4'} />
        </React.Fragment>
      ))}
      {Array.from({ length: Math.max(5, Math.floor(width / 1.1)) }, (_, i) => <Box key={i} position={[-width / 2 + 0.58 + i * 1.0, height + 0.58, 0]} args={[0.3, 0.7, 0.3]} color={accent} />)}
    </group>
  )
}

function StringLights({ z, span = 11, y = 5.45, phase = 0 }) {
  return (
    <group position={[0, 0, z]}>
      <Box position={[0, y, 0]} args={[span, 0.018, 0.018]} color="#2a1a14" castShadow={false} />
      {Array.from({ length: 13 }, (_, i) => {
        const x = -span / 2 + (span / 12) * i
        const drop = Math.sin((i / 12) * Math.PI) * 0.62
        return <mesh key={i} position={[x, y - drop, 0]}><sphereGeometry args={[0.075, 10, 8]} /><meshStandardMaterial color="#fff2b5" emissive={i % 3 === 0 ? '#ff6d83' : i % 3 === 1 ? '#62d8dc' : '#ffaf42'} emissiveIntensity={2.9 + phase * 0.03} /></mesh>
      })}
    </group>
  )
}

function UtilityWire({ z, y = 8.4, side = 1 }) {
  const curve = useMemo(() => new THREE.CatmullRomCurve3([
    new THREE.Vector3(-7 * side, y, z - 4),
    new THREE.Vector3(-3.5 * side, y - 1.15, z),
    new THREE.Vector3(0, y - 1.35, z + 1),
    new THREE.Vector3(5.8 * side, y - 0.3, z + 4),
  ]), [z, y, side])
  const geom = useMemo(() => new THREE.TubeGeometry(curve, 22, 0.018, 5, false), [curve])
  return <mesh geometry={geom}><meshStandardMaterial color="#181213" roughness={1} /></mesh>
}

function Smoke({ position, count = 7, spread = 0.45 }) {
  const refs = useRef([])
  useFrame(({ clock }) => {
    refs.current.forEach((m, i) => {
      if (!m) return
      const t = (clock.elapsedTime * 0.17 + i / count) % 1
      m.position.y = position[1] + t * 4
      m.position.x = position[0] + Math.sin(t * 7 + i) * spread * t
      m.position.z = position[2] + Math.cos(t * 6 + i) * spread * t
      m.scale.setScalar(0.5 + t * 1.5)
      m.material.opacity = 0.2 * (1 - t)
    })
  })
  return <>{Array.from({ length: count }, (_, i) => <mesh key={i} ref={(el) => { refs.current[i] = el }} position={position}><sphereGeometry args={[0.34, 10, 8]} /><meshBasicMaterial color="#efe7df" transparent opacity={0.13} depthWrite={false} /></mesh>)}</>
}

function FoodCart({ position, accent, canopy, label }) {
  return (
    <group position={position}>
      <Box position={[0, 0.65, 0]} args={[2.3, 1.08, 1.36]} color="#5a3123" />
      <Box position={[0, 1.38, 0]} args={[2.65, 0.11, 1.65]} color={accent} />
      <Box position={[0, 2.06, 0]} args={[2.8, 0.16, 1.86]} color={canopy} />
      {[-1.15, 1.15].map((x) => <Box key={x} position={[x, 1.6, 0]} args={[0.08, 1.48, 0.08]} color="#332119" />)}
      <Label text={label} position={[0, 1.58, 0.74]} size={[2.0, 0.38]} />
      {[-0.9, 0.9].map((x) => <mesh key={x} position={[x, 0.13, 0.52]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.24, 0.24, 0.18, 16]} /><meshStandardMaterial color="#111" /></mesh>)}
      <pointLight position={[0, 1.75, 0]} intensity={4.5} distance={4.5} color="#ffb55e" />
    </group>
  )
}

function GrillStall({ position }) {
  return (
    <group position={position}>
      <FoodCart position={[0, 0, 0]} accent="#c43d2d" canopy="#f0a928" label="BBQ / TIKKA" />
      <Box position={[0, 1.06, 0.08]} args={[1.55, 0.22, 0.7]} color="#2f2823" />
      <Box position={[0, 1.17, 0.08]} args={[1.36, 0.06, 0.56]} color="#e45626" emissive="#ff5c2d" emissiveIntensity={1.25} />
      <Smoke position={[0, 1.34, 0.08]} />
    </group>
  )
}

function Person({ position, shirt = '#6c2744', skin = '#925f46', scale = 1, seated = false }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, seated ? 1.4 : 2.0, 0]} castShadow><sphereGeometry args={[0.22, 14, 10]} /><meshStandardMaterial color={skin} /></mesh>
      <Box position={[0, seated ? 0.86 : 1.34, 0]} args={[0.56, seated ? 0.68 : 0.92, 0.4]} color={shirt} />
      <Box position={[-0.18, seated ? 0.38 : 0.55, 0]} args={[0.18, seated ? 0.48 : 0.94, 0.22]} color="#ead8c3" />
      <Box position={[0.18, seated ? 0.38 : 0.55, 0]} args={[0.18, seated ? 0.48 : 0.94, 0.22]} color="#ead8c3" />
    </group>
  )
}

function TableSet({ position, long = false }) {
  if (long) {
    return (
      <group position={position}>
        <Box position={[0, 0.72, 0]} args={[4.1, 0.1, 0.9]} color="#6c402d" />
        {[-1.5, -0.5, 0.5, 1.5].map((x) => [-0.78, 0.78].map((z) => <group key={`${x}-${z}`} position={[x, 0, z]}><Box position={[0, 0.42, 0]} args={[0.5, 0.08, 0.5]} color="#2b211f" /><Box position={[0, 0.19, 0]} args={[0.06, 0.42, 0.06]} color="#181414" /></group>))}
      </group>
    )
  }
  return (
    <group position={position}>
      <mesh position={[0, 0.72, 0]} castShadow><cylinderGeometry args={[0.72, 0.72, 0.09, 24]} /><meshStandardMaterial color="#68402e" /></mesh>
      <Box position={[0, 0.38, 0]} args={[0.08, 0.7, 0.08]} color="#211716" />
    </group>
  )
}

function QawwaliCourtyard() {
  return (
    <group position={[0, 0, 33.4]}>
      <Box position={[0, 0.12, 0]} args={[10.6, 0.22, 6.6]} color="#6f222c" />
      <Label text="MEHFIL" position={[0, 2.32, 3.1]} size={[3.2, 0.62]} bg="#701e2c" glow="#ff4779" />
      {[-2.7, -1.35, 0, 1.35, 2.7].map((x, i) => <Person key={x} position={[x, 0.3, 0.7]} seated shirt={i % 2 ? '#f0d9a6' : '#8a2141'} scale={0.8} />)}
      <Box position={[-1.35, 0.5, 1.25]} args={[0.9, 0.3, 0.48]} color="#a66b2b" />
      <Cylinder position={[1.35, 0.52, 1.2]} args={[0.32, 0.32, 0.7, 16]} color="#b46b25" rotation={[Math.PI / 2, 0, 0]} />
      <Lantern position={[-4.4, 3.1, 0]} color="#ff4f82" />
      <Lantern position={[4.4, 3.1, 0]} color="#54d3d6" />
    </group>
  )
}

function PuppetShow() {
  return (
    <group position={[-5.45, 0, 29.3]}>
      <Box position={[0, 1.35, 0]} args={[3.3, 2.7, 1.1]} color="#97263a" />
      <Box position={[0, 1.72, 0.58]} args={[2.45, 1.4, 0.08]} color="#171114" />
      <Label text="PUTLI TAMASHA" position={[0, 2.5, 0.64]} size={[2.7, 0.43]} bg="#711d31" glow="#ff4f87" />
      {[-0.52, 0.52].map((x, i) => <group key={x} position={[x, 1.6, 0.68]}><mesh><sphereGeometry args={[0.15, 10, 8]} /><meshStandardMaterial color="#d49866" /></mesh><Box position={[0, -0.28, 0]} args={[0.34, 0.52, 0.15]} color={i ? '#45b0a6' : '#ffc240'} /></group>)}
    </group>
  )
}

function StairFlight({ origin, axis = 'z', direction = -1, steps = 12, rise = 0.34, run = 0.28, width = 1.6, color = '#d5ad76' }) {
  return (
    <group>
      {Array.from({ length: steps }, (_, i) => {
        const x = origin[0] + (axis === 'x' ? direction * i * run : 0)
        const z = origin[2] + (axis === 'z' ? direction * i * run : 0)
        const y = origin[1] + i * rise
        return <Box key={i} position={[x, y, z]} args={[axis === 'x' ? run + 0.05 : width, rise + 0.04, axis === 'z' ? run + 0.05 : width]} color={color} />
      })}
    </group>
  )
}

function RooftopStairs() {
  return (
    <group>
      <StairFlight origin={[5.3, 0.18, 31.0]} axis="z" direction={-1} steps={12} rise={0.34} run={0.28} width={1.65} color="#e0bd85" />
      <Box position={[5.3, 4.16, 27.55]} args={[1.95, 0.18, 1.65]} color="#e4c48d" />
      <StairFlight origin={[5.55, 4.35, 27.55]} axis="x" direction={1} steps={10} rise={0.39} run={0.28} width={1.65} color="#e0bd85" />
      <Box position={[8.45, 8.14, 27.55]} args={[2.0, 0.18, 1.7]} color="#e4c48d" />
      {/* railings */}
      {[4.42, 6.18].map((x) => <Box key={x} position={[x, 2.35, 29.3]} args={[0.07, 4.5, 0.07]} color="#2a2624" />)}
      <Box position={[5.3, 4.55, 29.3]} args={[1.8, 0.07, 0.07]} color="#2a2624" />
      {[6.0, 8.9].map((x) => <Box key={x} position={[x, 6.3, 26.72]} args={[0.07, 4.0, 0.07]} color="#2a2624" />)}
      <Box position={[7.45, 8.4, 26.72]} args={[3.0, 0.07, 0.07]} color="#2a2624" />
      <Lantern position={[5.3, 4.9, 27.4]} color="#ffba5b" />
      <Lantern position={[8.5, 8.85, 27.4]} color="#ff6d88" />
    </group>
  )
}

function RooftopRestaurant() {
  return (
    <group>
      <group position={[10.5, 0, 27.1]}>
        <Box position={[0, 4.0, 0]} args={[7.4, 8, 7.6]} color="#f0b626" />
        <Box position={[0, 8.08, 0]} args={[7.7, 0.18, 7.9]} color="#6b271f" />
        {[-2.35, 0, 2.35].map((x) => <Jharokha key={x} position={[x, 5.1, -3.85]} color="#2b1a17" accent="#b73239" />)}
        <Label text="HAVELI" position={[0, 2.55, -3.84]} size={[3.5, 0.72]} bg="#821d21" glow="#ff5f47" />
        {[-2.2, 0, 2.2].map((x) => <TableSet key={x} position={[x, 8.22, 0.6]} />)}
        {[-2.6, 0, 2.6].map((x, i) => <Person key={x} position={[x, 8.18, -0.65]} seated shirt={i % 2 ? '#3c8a7b' : '#a42c4a'} scale={0.7} />)}
        {/* patterned rooftop tiles */}
        {Array.from({ length: 6 }, (_, ix) => Array.from({ length: 6 }, (_, iz) => <Box key={`${ix}-${iz}`} position={[-3 + ix * 1.2, 8.14, -3 + iz * 1.2]} args={[1.08, 0.03, 1.08]} color={(ix + iz) % 3 === 0 ? '#2c9c9e' : (ix + iz) % 3 === 1 ? '#e67443' : '#f1cf5c'} castShadow={false} />))}
        <pointLight position={[0, 9.1, 0]} intensity={14} distance={13} color="#ffc36c" />
      </group>
      <RooftopStairs />
    </group>
  )
}

function ShahiPaan() {
  return (
    <group position={[-5.75, 0, 18.2]}>
      <Box position={[0, 1.5, 0]} args={[3.1, 3, 2.2]} color="#c51e30" />
      <Box position={[0, 2.95, 0]} args={[3.35, 0.22, 2.45]} color="#78111c" />
      <Label text="SHAHI PAAN" position={[0, 2.26, 1.2]} size={[2.3, 0.5]} bg="#124d31" fg="#eeffd1" glow="#66ff84" />
      <Box position={[0, 1.12, 1.14]} args={[2.45, 1.15, 0.12]} color="#6e3928" emissive="#ff695b" emissiveIntensity={1.0} />
      {[-0.8, -0.4, 0, 0.4, 0.8].map((x, i) => <mesh key={x} position={[x, 1.16, 1.26]}><sphereGeometry args={[0.12, 10, 8]} /><meshStandardMaterial color={['#68cf61', '#f4b82f', '#e44b5b', '#fff0c9', '#65c8df'][i]} /></mesh>)}
      <pointLight position={[0, 2.2, 1.9]} intensity={9} distance={6} color="#79ff8e" />
    </group>
  )
}

function RangeelaRickshaw({ progress }) {
  const ref = useRef()
  const body = useRef()
  const wheelRefs = useRef([])
  const previousZ = useRef(53)

  useFrame((_, delta) => {
    if (!ref.current) return
    // The rickshaw now follows the scroll instead of an independent clock, so it cannot randomly arrive inside the protagonist.
    const start = 0.11
    const end = 0.39
    const t = clamp01((progress - start) / (end - start))
    const z = 53 - t * 23
    ref.current.visible = progress >= 0.08 && progress <= 0.42
    ref.current.position.set(4.85, 0, z)

    const travelled = Math.abs(z - previousZ.current)
    const spin = travelled / 0.36
    wheelRefs.current.forEach((wheel) => {
      if (wheel) wheel.rotation.x -= spin
    })
    previousZ.current = z

    if (body.current) {
      body.current.rotation.z = THREE.MathUtils.lerp(body.current.rotation.z, Math.sin(t * Math.PI * 5) * 0.012, 1 - Math.pow(0.03, delta))
      body.current.position.y = 0.02 + Math.sin(t * Math.PI * 8) * 0.018
    }
  })

  return (
    <group ref={ref} position={[4.85, 0, 53]} scale={0.92} name="rangeela-rickshaw">
      <group ref={body}>
        <Box position={[0, 0.86, 0]} args={[1.72, 1.05, 2.62]} color="#24785d" roughness={0.58} metalness={0.08} />
        <Box position={[0, 1.57, -0.15]} args={[1.77, 0.85, 2.45]} color="#d72f63" roughness={0.52} metalness={0.1} />
        <Box position={[0, 2.08, -0.2]} args={[1.98, 0.12, 2.88]} color="#ffcc2d" roughness={0.45} metalness={0.18} />
        <Box position={[0, 1.43, -1.32]} args={[1.32, 0.72, 0.06]} color="#b8d9d9" roughness={0.18} metalness={0.02} />
        <Box position={[0, 0.9, -1.38]} args={[0.58, 0.22, 0.08]} color="#f6efe4" emissive="#fff0c2" emissiveIntensity={0.9} />
        <Box position={[0, 0.86, 0.55]} args={[1.3, 0.48, 0.72]} color="#5a2a28" roughness={0.72} />
        {[-0.76, 0.76].map((x) => <Cylinder key={`mirror-${x}`} position={[x, 1.75, -1.18]} args={[0.07, 0.07, 0.46, 10]} color="#3d3432" rotation={[0.5, 0, 0]} metalness={0.5} />)}
        {[-0.88, -0.44, 0, 0.44, 0.88].map((x, i) => <mesh key={x} position={[x, 2.18, -1.18]}><sphereGeometry args={[0.12, 10, 8]} /><meshStandardMaterial color={i % 2 ? '#ff5f96' : '#fff2df'} emissive={i % 2 ? '#f11a6f' : '#f1ad55'} emissiveIntensity={0.95} /></mesh>)}
        <Label text="RANGEELA" position={[0, 1.14, 1.34]} size={[1.36, 0.35]} bg="#115e49" glow="#ff4f93" rotation={[0, Math.PI, 0]} />
        <pointLight position={[0, 1.0, -1.6]} intensity={5.2} distance={5} color="#fff0c4" />
      </group>
      {[
        [-0.72, 0.36, 0.82],
        [0.72, 0.36, 0.82],
        [0, 0.36, -0.9],
      ].map((p, i) => (
        <group key={i} position={p} rotation={[0, 0, Math.PI / 2]}>
          <mesh ref={(el) => { wheelRefs.current[i] = el }} castShadow>
            <cylinderGeometry args={[0.36, 0.36, 0.22, 18]} />
            <meshStandardMaterial color="#171416" roughness={0.88} />
          </mesh>
          <mesh><cylinderGeometry args={[0.17, 0.17, 0.235, 16]} /><meshStandardMaterial color="#9d8c79" metalness={0.48} roughness={0.36} /></mesh>
        </group>
      ))}
    </group>
  )
}

function StreetCrowd() {
  const people = [
    [-5.55, 0, 50, '#337eb7'], [5.85, 0, 48.8, '#d94a35'], [-5.7, 0, 44.5, '#6bb04d'], [5.9, 0, 42.3, '#7650a4'],
    [-5.6, 0, 38.0, '#ef8b2d'], [5.85, 0, 35.9, '#d42758'], [-5.7, 0, 31.0, '#2a9a79'], [5.9, 0, 28.8, '#416ecc'],
    [-5.55, 0, 23.8, '#db6f37'], [5.8, 0, 21.7, '#a153bf'], [-5.6, 0, 17.0, '#59a65c'],
  ]
  return <>{people.map((p, i) => <Person key={i} position={[p[0], p[1], p[2]]} shirt={p[3]} scale={0.82 + (i % 3) * 0.05} />)}</>
}

function RoshnaiGate() {
  return (
    <group position={[0, 0, 10]}>
      <Box position={[-5.25, 3.1, 0]} args={[5, 6.2, 3]} color={COLORS.fort} />
      <Box position={[5.25, 3.1, 0]} args={[5, 6.2, 3]} color={COLORS.fort} />
      <Arch position={[0, 2.65, -1.55]} scale={[2.0, 2.1, 0.7]} color={COLORS.fort} depth={0.4} />
      <Box position={[0, 6.15, 0]} args={[14.8, 0.35, 3.35]} color={COLORS.fortDark} />
      {Array.from({ length: 14 }, (_, i) => <Box key={i} position={[-6.4 + i, 6.66, 0]} args={[0.5, 0.82, 0.7]} color={COLORS.fort} />)}
      {[-4.6, 0, 4.6].map((x, i) => <Lantern key={x} position={[x, 3.35, -1.9]} phase={i} color={i === 1 ? '#57d6dc' : '#ffaf4e'} />)}
      <Label text="ROSHNAI" position={[0, 5.35, -1.73]} size={[3.2, 0.62]} bg="#725037" />
      <pointLight position={[0, 3, -3]} intensity={15} distance={12} color="#ffc273" />
    </group>
  )
}

function GateHall() {
  return (
    <group position={[0, 0, 5.2]}>
      <Box position={[0, 2.2, 0]} args={[9, 4.4, 5.2]} color="#a18767" />
      <Arch position={[0, 1.85, -2.68]} scale={[1.6, 1.5, 0.65]} color="#a18767" depth={0.35} />
      <Arch position={[0, 1.85, 2.33]} scale={[1.6, 1.5, 0.65]} color="#a18767" depth={0.35} rotation={[0, Math.PI, 0]} />
      <pointLight position={[0, 2.5, 0]} intensity={10} distance={7} color="#ffd291" />
    </group>
  )
}

function Shrub({ position, scale = 1 }) {
  return <mesh position={position} scale={scale} castShadow><sphereGeometry args={[0.7, 16, 12]} /><meshStandardMaterial color="#2f7a4a" roughness={1} /></mesh>
}

function HazuriBagh() {
  return (
    <group position={[0, 0, -6]}>
      <Box position={[0, 0.02, 0]} args={[42, 0.12, 24]} color="#4e8b52" />
      {[-15, -8, 8, 15].map((x) => [-8, -4, 0, 4, 8].map((z, i) => <Shrub key={`${x}-${z}`} position={[x, 0.6, z]} scale={0.85 + (i % 2) * 0.18} />))}
      <group position={[0, 0, -7]}>
        <Box position={[0, 0.08, 0]} args={[7.2, 0.15, 7.2]} color="#fff0d7" />
        <Box position={[0, 1.7, 0]} args={[6.2, 0.3, 6.2]} color="#fff3df" />
        {[[-2.2, 0, -2.2], [2.2, 0, -2.2], [-2.2, 0, 2.2], [2.2, 0, 2.2]].map((p, i) => <Box key={i} position={[p[0], 1.1, p[2]]} args={[0.28, 2.2, 0.28]} color="#fff3df" />)}
        <Dome position={[0, 2.0, 0]} scale={1.2} color="#fff4df" />
      </group>
    </group>
  )
}

function IqbalTomb() {
  return (
    <group position={[6.8, 0, -0.5]} rotation={[0, -Math.PI / 2, 0]}>
      <Box position={[0, 0.18, 0]} args={[7.3, 0.36, 5.5]} color="#d16b4e" />
      <Box position={[0, 1.9, 0]} args={[5.8, 3.4, 4.2]} color="#b64f39" />
      <Arch position={[0, 1.55, -2.15]} scale={[0.86, 0.95, 0.65]} color="#b64f39" depth={0.3} />
      {[-1.8, 1.8].map((x) => <group key={x} position={[x, 1.8, -2.15]}><Box args={[0.85, 1.25, 0.16]} color="#87392d" /><Box position={[0, 0, -0.1]} args={[0.58, 0.92, 0.08]} color="#f2ddb6" /></group>)}
      <Box position={[0, 3.72, 0]} args={[6.2, 0.28, 4.6]} color="#87392e" />
      <pointLight position={[0, 2.4, -3]} intensity={11} distance={7} color="#ffb56c" />
    </group>
  )
}

function Minaret({ position, scale = 1 }) {
  return (
    <group position={position} scale={scale}>
      <Cylinder position={[0, 0.28, 0]} args={[0.9, 1.02, 0.55, 8]} color={COLORS.sandstoneDark} />
      <Cylinder position={[0, 3.45, 0]} args={[0.52, 0.72, 6.4, 8]} color={COLORS.sandstone} />
      {[1.15, 3.55, 5.75].map((y) => <Cylinder key={y} position={[0, y, 0]} args={[0.8, 0.8, 0.18, 16]} color={COLORS.marble} />)}
      <Chhatri position={[0, 6.45, 0]} scale={0.78} color={COLORS.sandstone} />
    </group>
  )
}

function MosqueEntranceGateway() {
  return (
    <group position={[0, 0.9, 8.4]}>
      <Box position={[0, 3.15, 0]} args={[9.2, 6.3, 2.9]} color={COLORS.sandstone} />
      <Arch position={[0, 2.55, -1.5]} scale={[1.62, 2.05, 0.7]} color={COLORS.sandstone} depth={0.35} />
      {[-3.75, 3.75].map((x) => <group key={x} position={[x, 0, 0]}><Box position={[0, 3.2, 0]} args={[1.45, 6.4, 3.15]} color={COLORS.sandstoneDark} /><Chhatri position={[0, 6.4, 0]} scale={0.7} color={COLORS.sandstone} /></group>)}
      {Array.from({ length: 11 }, (_, i) => <Box key={i} position={[-4.45 + i * 0.89, 6.52, 0]} args={[0.36, 0.65, 0.52]} color={COLORS.sandstone} />)}
      <pointLight position={[0, 2.7, -2]} intensity={12} distance={9} color="#ffbf78" />
    </group>
  )
}

function CourtyardArcade({ position, rotation = [0, 0, 0] }) {
  return (
    <group position={position} rotation={rotation}>
      <Box position={[0, 1.85, 0]} args={[18, 3.7, 1.3]} color={COLORS.sandstoneDark} />
      {Array.from({ length: 7 }, (_, i) => <Arch key={i} position={[-7.2 + i * 2.4, 1.35, 0.68]} scale={[0.58, 0.9, 0.32]} color={COLORS.sandstone} depth={0.2} />)}
    </group>
  )
}

function BadshahiMosque() {
  return (
    <group position={[27, 0, -10]} rotation={[0, -Math.PI / 2, 0]}>
      <Box position={[0, 0.42, 0]} args={[33.5, 0.84, 24]} color="#bd684d" />
      {/* 22-step eastern approach */}
      {Array.from({ length: 22 }, (_, i) => <Box key={i} position={[0, 0.05 + i * 0.055, 13.2 + i * 0.13]} args={[9.0 + i * 0.18, 0.07, 0.28]} color="#cf8264" />)}
      <Box position={[0, 0.87, 0.8]} args={[28.8, 0.08, 17.9]} color="#eed7b6" roughness={0.5} />
      <Box position={[0, 0.95, 1.2]} args={[5.8, 0.14, 4.3]} color="#b58a68" />
      <Box position={[0, 1.02, 1.2]} args={[4.9, 0.06, 3.45]} color="#4a8ca0" roughness={0.14} metalness={0.08} />
      <MosqueEntranceGateway />
      <CourtyardArcade position={[-14, 0.9, 0]} rotation={[0, Math.PI / 2, 0]} />
      <CourtyardArcade position={[14, 0.9, 0]} rotation={[0, -Math.PI / 2, 0]} />
      <Box position={[0, 4.0, -8]} args={[25.6, 6.4, 3]} color={COLORS.sandstone} />
      <Arch position={[0, 3.15, -6.45]} scale={[2.35, 2.65, 0.84]} color={COLORS.sandstone} depth={0.38} />
      {[-8.8, -6.1, -3.4, 3.4, 6.1, 8.8].map((x) => <Arch key={x} position={[x, 2.35, -6.45]} scale={[0.72, 1.34, 0.62]} color={COLORS.sandstone} depth={0.28} />)}
      <Dome position={[0, 7.1, -8]} scale={2.25} />
      <Dome position={[-7.4, 6.65, -8]} scale={1.62} />
      <Dome position={[7.4, 6.65, -8]} scale={1.62} />
      <Minaret position={[-14.5, 0.82, -8.9]} scale={1.17} />
      <Minaret position={[14.5, 0.82, -8.9]} scale={1.17} />
      <Minaret position={[-14.5, 0.82, 9]} scale={1.17} />
      <Minaret position={[14.5, 0.82, 9]} scale={1.17} />
      <pointLight position={[0, 6, -2]} intensity={30} distance={28} color="#ffc66d" />
    </group>
  )
}

function LotusBase({ position, radius = 2.5 }) {
  return (
    <group position={position}>
      {Array.from({ length: 14 }, (_, i) => {
        const a = (i / 14) * Math.PI * 2
        return <mesh key={i} position={[Math.cos(a) * radius * 0.82, 0.55, Math.sin(a) * radius * 0.82]} rotation={[0.1, -a, 0.22]} castShadow><sphereGeometry args={[0.56, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshStandardMaterial color={COLORS.fort} roughness={0.84} /></mesh>
      })}
      <Cylinder position={[0, 0.24, 0]} args={[radius, radius * 1.08, 0.48, 32]} color={COLORS.fort} />
    </group>
  )
}

function FlutedBastion({ x }) {
  return (
    <group position={[x, 0, 0]}>
      <LotusBase position={[0, 0.12, 0]} radius={2.55} />
      <Cylinder position={[0, 3.7, 0]} args={[2.15, 2.42, 6.4, 32]} color={COLORS.fort} />
      {Array.from({ length: 16 }, (_, i) => {
        const a = (i / 16) * Math.PI * 2
        return <Cylinder key={i} position={[Math.cos(a) * 2.16, 3.6, Math.sin(a) * 2.16]} args={[0.12, 0.12, 5.65, 8]} color="#a98863" />
      })}
      <Cylinder position={[0, 6.9, 0]} args={[2.35, 2.35, 0.34, 32]} color={COLORS.fortDark} />
      <Chhatri position={[0, 7.2, 0]} scale={0.92} color={COLORS.fort} />
    </group>
  )
}

function LahoreFortGate() {
  return (
    <group position={[-28, 0, -10]} rotation={[0, Math.PI / 2, 0]}>
      <Box position={[0, 3.6, 0]} args={[13.8, 7.2, 3.7]} color={COLORS.fort} />
      <FlutedBastion x={-7.35} />
      <FlutedBastion x={7.35} />
      <Arch position={[0, 2.9, -1.88]} scale={[2.15, 2.36, 0.62]} color={COLORS.fort} depth={0.42} />
      {Array.from({ length: 13 }, (_, i) => <Box key={i} position={[-5.8 + i * 0.97, 7.35, 0]} args={[0.48, 0.8, 0.78]} color={COLORS.fort} />)}
      <pointLight position={[0, 4, -5]} intensity={20} distance={20} color="#ffd08d" />
    </group>
  )
}

function StreetWorld({ progress, routeChoice }) {
  const left = [
    { p: [-9.8, 0, 50], h: 8.8, w: 7.2, c: '#1ca6a2', a: '#d94a38', l: 'ANDAAZ' },
    { p: [-9.7, 0, 42], h: 7.7, w: 6.9, c: '#f07832', a: '#168b79', l: 'DESI KITCHEN' },
    { p: [-9.2, 0, 34], h: 9.3, w: 7.1, c: '#7faf45', a: '#d2325d', l: 'ROOFTOP' },
    { p: [-8.9, 0, 25], h: 7.8, w: 6.8, c: '#36a9b0', a: '#e26434', l: 'OLD LAHORE' },
  ]
  const right = [
    { p: [9.8, 0, 50], h: 8.2, w: 7.0, c: '#d94c32', a: '#188d7b', l: 'FOOD STREET' },
    { p: [9.7, 0, 42], h: 9.5, w: 7.1, c: '#f2b82e', a: '#bd2946', l: 'HAVELI' },
    { p: [9.3, 0, 34], h: 7.9, w: 6.9, c: '#bd5d32', a: '#15917d', l: 'COOCO’S DEN' },
    { p: [8.9, 0, 25], h: 8.6, w: 6.9, c: '#238e82', a: '#d94343', l: 'FORT VIEW' },
  ]

  return (
    <>
      <color attach="background" args={[COLORS.sky]} />
      <fog attach="fog" args={['#15305a', 55, 145]} />
      <hemisphereLight intensity={1.25} color="#8bc9ff" groundColor="#ff9c64" />
      <ambientLight intensity={0.95} />
      <directionalLight position={[12, 25, 14]} intensity={2.7} castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} color="#fff0cd" />
      <directionalLight position={[-20, 18, -15]} intensity={0.9} color="#6ac7ff" />
      <Stars radius={130} depth={55} count={2200} factor={3.0} saturation={0.2} fade speed={0.22} />

      <Box position={[0, -0.35, 17]} args={[88, 0.6, 100]} color="#291b1b" />
      <Box position={[0, -0.02, 35]} args={[12.5, 0.16, 44]} color={COLORS.road} />
      {Array.from({ length: 18 }, (_, i) => <Box key={`tile-l-${i}`} position={[-4.2, 0.02, 14 + i * 2.4]} args={[2.15, 0.03, 1.65]} color={i % 2 ? '#684a3b' : '#765342'} castShadow={false} />)}
      {Array.from({ length: 18 }, (_, i) => <Box key={`tile-r-${i}`} position={[4.2, 0.02, 14 + i * 2.4]} args={[2.15, 0.03, 1.65]} color={i % 2 ? '#684a3b' : '#765342'} castShadow={false} />)}

      {left.map((b, i) => <HeritageBuilding key={`l${i}`} position={b.p} height={b.h} width={b.w} color={b.c} accent={b.a} label={b.l} side="left" />)}
      {right.map((b, i) => <HeritageBuilding key={`r${i}`} position={b.p} height={b.h} width={b.w} color={b.c} accent={b.a} label={b.l} side="right" />)}

      {[49, 44, 39, 34, 29, 24].map((z, i) => <StringLights key={z} z={z} y={5.25 + (i % 2) * 0.28} phase={i} />)}
      <UtilityWire z={42} side={1} />
      <UtilityWire z={31} y={8.8} side={-1} />
      <UtilityWire z={24} y={7.9} side={1} />

      <GrillStall position={[-2.8, 0, 46.5]} />
      <FoodCart position={[2.6, 0, 43.0]} accent="#d54b36" canopy="#ffd35c" label="JALEBI / KULFI" />
      <FoodCart position={[-2.6, 0, 39.4]} accent="#2b8b61" canopy="#f1df8b" label="KASHMIRI CHAI" />
      <FoodCart position={[2.55, 0, 36.2]} accent="#d82d59" canopy="#ffbd47" label="ANDA TIKKI" />
      <TableSet position={[0, 0, 47.6]} long />
      <TableSet position={[0, 0, 41.1]} long />

      <QawwaliCourtyard />
      <PuppetShow />
      <RooftopRestaurant />
      <ShahiPaan />
      <RangeelaRickshaw progress={progress} />
      <StreetCrowd />
      <RoshnaiGate />
      <GateHall />
      <HazuriBagh />
      <IqbalTomb />
      <BadshahiMosque />
      <LahoreFortGate />
      {Array.from({ length: 10 }, (_, i) => <Lantern key={i} position={[i % 2 ? 5.0 : -5.0, 4.5, 18 + i * 3.55]} phase={i * 0.4} color={i % 3 === 0 ? '#58d4d8' : i % 3 === 1 ? '#ff5c8a' : '#ffae4d'} />)}

      <Protagonist progress={progress} routeChoice={routeChoice} />
      <CameraDirector progress={progress} routeChoice={routeChoice} />
    </>
  )
}

const CHAPTERS = [
  { id: 'arrival', anchor: 'left', n: '01', title: 'Pull up hungry', copy: 'The first view is the whole district from above. Then the camera drops into Fort Road, where the color and noise start immediately.' },
  { id: 'stalls', anchor: 'right', n: '02', title: 'Follow the smoke', copy: 'BBQ, anda tikki, jalebi, kulfi and Kashmiri chai sit along the edges so the middle remains a real walking lane.' },
  { id: 'rickshaw', anchor: 'left', n: '03', title: 'Rangeela moment', copy: 'The decorated rickshaw has its own right-side lane and now moves with scroll, so it cannot randomly clip through visitors.' },
  { id: 'qawwali', anchor: 'right', n: '04', title: 'Wait, there’s music', copy: 'A little mehfil makes you stop. Harmonium, dholak energy, bright rugs, lanterns and a putli tamasha nearby.' },
  { id: 'restaurant', anchor: 'left', n: '05', title: 'Actually go upstairs', copy: 'No teleporting. You climb two visible flights, hit the landing, reach the patterned rooftop terrace, pause for the mosque view, then walk back down.' },
  { id: 'paan', anchor: 'left', n: '06', title: 'Shahi paan stop', copy: 'Back at street level, the red paan kiosk is the last playful stop before the heritage complex takes over.' },
  { id: 'gate', anchor: 'right', n: '07', title: 'Through Roshnai', copy: 'The street compresses into the gate, then opens again into Hazuri Bagh.' },
  { id: 'hall', anchor: 'left', n: '08', title: 'Into Hazuri Bagh', copy: 'Green lawn, the white baradari, Iqbal’s Tomb, Badshahi Mosque and Alamgiri Gate finally share one monumental frame.' },
  { id: 'iqbal', anchor: 'bottom-left', n: '09', title: 'Iqbal’s Tomb', copy: 'The camera now stays in front of the tomb instead of clipping behind the roof. A quieter red-sandstone pause before the route splits.' },
  { id: 'choice', anchor: 'bottom-right', n: '10', title: 'Which way?', copy: 'Choose the mosque or Shahi Qila. The camera and girl both continue into the selected space.' },
  { id: 'final', anchor: 'left', n: '11', title: 'Look back', copy: 'The route stays behind you. Scroll upward to rewind the whole Lahore night.' },
]

function ChapterCard({ chapter, routeChoice, setRouteChoice }) {
  const isChoice = chapter.id === 'choice'
  return (
    <section className={`chapter chapter-${chapter.id} chapter-anchor-${chapter.anchor || 'left'}`}>
      <motion.div className="chapter-card" initial={{ opacity: 0, y: 34, scale: 0.97 }} whileInView={{ opacity: 1, y: 0, scale: 1 }} viewport={{ amount: 0.55, once: false }} transition={{ duration: 0.5 }}>
        <div className="chapter-number">{chapter.n}</div>
        <div>
          <div className="chapter-kicker">LAHORE NIGHT OUT</div>
          <h2>{chapter.title}</h2>
          <p>{chapter.copy}</p>
          {isChoice && <div className="route-choice"><button className={routeChoice === 'mosque' ? 'active' : ''} onClick={() => setRouteChoice('mosque')}>BADSHAHI MOSQUE</button><button className={routeChoice === 'fort' ? 'active' : ''} onClick={() => setRouteChoice('fort')}>SHAHI QILA</button></div>}
        </div>
      </motion.div>
    </section>
  )
}

function ProgressRail({ progress }) {
  return <div className="progress-rail" aria-hidden="true"><div className="progress-track"><div className="progress-fill" style={{ transform: `scaleY(${progress})` }} /></div><div className="progress-label">{Math.round(progress * 100).toString().padStart(2, '0')}</div></div>
}

function LahoreLoader() {
  return (
    <motion.div className="lahore-loader" initial={{ opacity: 1 }} exit={{ opacity: 0, scale: 1.03, transition: { duration: 0.72, ease: [0.76, 0, 0.24, 1] } }}>
      <div className="loader-sun" />
      <div className="loader-grid" />
      <div className="loader-copy">
        <motion.div className="loader-kicker" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12, duration: 0.45 }}>FORT ROAD · LAHORE</motion.div>
        <div className="loader-title" aria-label="Lahore! Lahore aey!">
          {'Lahore! Lahore aey!'.split('').map((c, i) => <motion.span key={i} initial={{ opacity: 0, y: 36, rotate: 3 }} animate={{ opacity: 1, y: 0, rotate: 0 }} transition={{ delay: 0.18 + i * 0.034, duration: 0.52, ease: [0.22, 1, 0.36, 1] }}>{c === ' ' ? '\u00A0' : c}</motion.span>)}
        </div>
        <motion.div className="loader-sub" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.85, duration: 0.4 }}>loading the city lights<span className="loader-dots">...</span></motion.div>
      </div>
    </motion.div>
  )
}

function App() {
  const [progress, setProgress] = useState(0)
  const [routeChoice, setRouteChoice] = useState('mosque')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    document.body.classList.add('is-loading')
    const timer = window.setTimeout(() => {
      setLoading(false)
      document.body.classList.remove('is-loading')
    }, 2350)
    return () => {
      window.clearTimeout(timer)
      document.body.classList.remove('is-loading')
    }
  }, [])

  useEffect(() => {
    const update = () => {
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight)
      setProgress(clamp01(window.scrollY / max))
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [])

  useEffect(() => {
    if (loading) return
    anime({ targets: '.hero-letter', opacity: [0, 1], translateY: [36, 0], rotateZ: [3, 0], delay: anime.stagger(26), duration: 850, easing: 'easeOutExpo' })
  }, [loading])

  const title = 'COME, I’LL SHOW YOU LAHORE'

  return (
    <main className="app-shell">
      <AnimatePresence>{loading && <LahoreLoader />}</AnimatePresence>
      <div className="world-canvas">
        <Canvas shadows dpr={[1, 1.6]} gl={{ antialias: true, powerPreference: 'high-performance', alpha: false }} onCreated={({ gl }) => { gl.outputColorSpace = THREE.SRGBColorSpace; gl.toneMapping = THREE.ACESFilmicToneMapping; gl.toneMappingExposure = 1.35; gl.shadowMap.type = THREE.PCFSoftShadowMap }}>
          <PerspectiveCamera makeDefault position={[0, 58, 27]} fov={47} near={0.1} far={240} />
          <StreetWorld progress={progress} routeChoice={routeChoice} />
        </Canvas>
      </div>

      <div className="top-hud"><div className="brand-lockup"><span>FORT ROAD</span><strong>LAHORE</strong></div><div className="top-copy">SCROLL TO WALK · BRIGHT, COLORFUL, ALIVE</div></div>
      <ProgressRail progress={progress} />

      <div className="scroll-story">
        <section className="hero-section">
          <div className="hero-copy">
            <div className="hero-pill">A SCROLLABLE 3D NIGHT OUT</div>
            <h1 aria-label={title}>{title.split('').map((c, i) => <span key={i} className="hero-letter">{c === ' ' ? '\u00A0' : c}</span>)}</h1>
            <p>Built like you are taking a friend through your Lahore night: street food, music, stairs to the rooftop, paan, Roshnai Gate, Iqbal’s Tomb, then Badshahi Mosque or Shahi Qila.</p>
            <div className="research-note">ORIGINAL WEBGL GEOMETRY, VISUALLY GUIDED BY YOUR SHARED SKETCHFAB REFERENCES, PUBLIC VLOGS, PHOTOS AND HERITAGE SOURCES.</div>
            <div className="scroll-cue"><span /> KEEP SCROLLING</div>
          </div>
        </section>

        {CHAPTERS.map((chapter) => <ChapterCard key={chapter.id} chapter={chapter} routeChoice={routeChoice} setRouteChoice={setRouteChoice} />)}

        <section className="end-section">
          <AnimatePresence mode="wait">
            <motion.div key={routeChoice} className="end-card" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="chapter-kicker">YOUR ROUTE</div>
              <h2>{routeChoice === 'fort' ? 'Shahi Qila ending.' : 'Badshahi Mosque ending.'}</h2>
              <p>Run it back and choose differently at Iqbal’s Tomb.</p>
              <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>RUN IT BACK ↑</button>
            </motion.div>
          </AnimatePresence>
        </section>
      </div>
    </main>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />)
