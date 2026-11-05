import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { RoundedBox, Environment, Sparkles, ContactShadows } from '@react-three/drei'

// opposite faces sum to 7: +Y=1, -Y=6, +X=2, -X=5, +Z=3, -Z=4
const SETTLE = {
  1: [0, 0, 0],
  2: [0, 0, Math.PI / 2],
  3: [-Math.PI / 2, 0, 0],
  4: [Math.PI / 2, 0, 0],
  5: [0, 0, -Math.PI / 2],
  6: [Math.PI, 0, 0],
}

// pip centers in a 3x3 grid, in tangent-space units (-0.26..0.26)
const LAYOUT = {
  1: ['c'],
  2: ['tl', 'br'],
  3: ['tl', 'c', 'br'],
  4: ['tl', 'tr', 'bl', 'br'],
  5: ['tl', 'tr', 'c', 'bl', 'br'],
  6: ['tl', 'tr', 'ml', 'mr', 'bl', 'br'],
}
const SLOT = {
  tl: [-0.26, 0.26], tr: [0.26, 0.26],
  ml: [-0.26, 0], mr: [0.26, 0],
  bl: [-0.26, -0.26], br: [0.26, -0.26],
  c: [0, 0],
}

// face normal + the two in-plane tangent axes (u, v) that place a pip on that face
const FACES = {
  1: { normal: [0, 0.51, 0], u: [1, 0, 0], v: [0, 0, 1] },   // +Y
  6: { normal: [0, -0.51, 0], u: [1, 0, 0], v: [0, 0, -1] }, // -Y
  2: { normal: [0.51, 0, 0], u: [0, 0, -1], v: [0, 1, 0] },  // +X
  5: { normal: [-0.51, 0, 0], u: [0, 0, 1], v: [0, 1, 0] },  // -X
  3: { normal: [0, 0, 0.51], u: [1, 0, 0], v: [0, 1, 0] },   // +Z
  4: { normal: [0, 0, -0.51], u: [-1, 0, 0], v: [0, 1, 0] }, // -Z
}

function Pips() {
  const pips = []
  for (let face = 1; face <= 6; face++) {
    const { normal, u, v } = FACES[face]
    for (const slot of LAYOUT[face]) {
      const [su, sv] = SLOT[slot]
      const pos = [
        normal[0] + u[0] * su + v[0] * sv,
        normal[1] + u[1] * su + v[1] * sv,
        normal[2] + u[2] * su + v[2] * sv,
      ]
      pips.push(pos)
    }
  }
  return pips.map((p, i) => (
    <mesh key={i} position={p}>
      <sphereGeometry args={[0.072, 16, 16]} />
      <meshStandardMaterial color="#3a1f0d" roughness={0.35} metalness={0.05} />
    </mesh>
  ))
}

function Die({ value, rolling, seed }) {
  const group = useRef()
  const start = useRef(0)
  const spin = useMemo(() => [
    (Math.random() * 2 + 3) * (Math.random() < 0.5 ? -1 : 1),
    (Math.random() * 2 + 3) * (Math.random() < 0.5 ? -1 : 1),
    (Math.random() * 2 + 3) * (Math.random() < 0.5 ? -1 : 1),
  ], [seed])

  useEffect(() => { start.current = performance.now() }, [rolling, seed])

  useFrame(() => {
    if (!group.current) return
    const target = SETTLE[value] || SETTLE[1]
    if (rolling) {
      const t = (performance.now() - start.current) / 1000
      group.current.rotation.set(spin[0] * t, spin[1] * t, spin[2] * t)
      group.current.position.y = Math.abs(Math.sin(t * 9)) * 0.22
    } else {
      const t = Math.min(1, (performance.now() - start.current) / 700)
      // decaying bounce landing on the settle orientation
      const ease = 1 - Math.pow(1 - t, 3)
      group.current.rotation.x += (target[0] - group.current.rotation.x) * 0.28
      group.current.rotation.y += (target[1] - group.current.rotation.y) * 0.28
      group.current.rotation.z += (target[2] - group.current.rotation.z) * 0.28
      const bounce = Math.max(0, Math.sin(t * Math.PI * 2.4)) * (1 - ease) * 0.18
      group.current.position.y = bounce
      if (t >= 1) group.current.rotation.set(target[0], target[1], target[2])
    }
  })

  return (
    <group ref={group}>
      <RoundedBox args={[1, 1, 1]} radius={0.08} smoothness={4} castShadow receiveShadow>
        <meshPhysicalMaterial
          color="#f3e6cf"
          roughness={0.22}
          clearcoat={1}
          clearcoatRoughness={0.15}
          metalness={0.02}
        />
      </RoundedBox>
      <Pips />
    </group>
  )
}

function Pedestal() {
  return (
    <mesh position={[0, -0.62, 0]} receiveShadow>
      <cylinderGeometry args={[1.5, 1.6, 0.22, 48]} />
      <meshStandardMaterial color="#2a1708" roughness={0.65} metalness={0.08} />
    </mesh>
  )
}

export default function Dice3D({ values, rolling, size = 118 }) {
  const [burst, setBurst] = useState(0)
  const wasRolling = useRef(rolling)
  useEffect(() => {
    if (wasRolling.current && !rolling && values && values[0] === values[1]) {
      setBurst((b) => b + 1)
    }
    wasRolling.current = rolling
  }, [rolling, values])

  const v = values || [1, 1]

  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {[0, 1].map((i) => (
        <div key={i} style={{ width: size, height: size, flex: 'none' }}>
          <Canvas shadows camera={{ position: [1.7, 1.9, 2.4], fov: 32 }} dpr={[1, 2]}>
            <ambientLight intensity={0.5} />
            <directionalLight
              position={[3, 4, 2]}
              intensity={1.4}
              color="#ffd9a0"
              castShadow
              shadow-mapSize={[512, 512]}
            />
            <Suspense fallback={null}>
              <Environment preset="city" background={false} />
            </Suspense>
            <Pedestal />
            <Die value={v[i]} rolling={rolling} seed={rolling ? `${i}-${Date.now()}` : i} />
            <ContactShadows position={[0, -0.63, 0]} opacity={0.55} scale={3} blur={2} far={1.5} />
            {burst > 0 && (
              <Sparkles
                key={burst}
                count={36}
                scale={[2, 1.4, 2]}
                size={3}
                speed={0.6}
                color="#ffb300"
                position={[0, 0, 0]}
              />
            )}
          </Canvas>
        </div>
      ))}
    </div>
  )
}
