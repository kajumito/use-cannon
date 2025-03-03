import { Color } from 'three'
import { useMemo, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import niceColors from 'nice-color-palettes'
import { Physics, usePlane, useBox, useSphere } from '@react-three/cannon'

import type { PlaneProps, Triplet } from '@react-three/cannon'

function Plane(props: PlaneProps) {
  const [ref] = usePlane(() => ({ ...props }))
  return (
    <mesh ref={ref} receiveShadow>
      <planeBufferGeometry args={[5, 5]} />
      <shadowMaterial color="#171717" />
    </mesh>
  )
}

type InstancedGeometryProps = {
  colors: Float32Array
  number: number
  size: number
}

const Spheres = ({ colors, number, size }: InstancedGeometryProps) => {
  const [ref, { at }] = useSphere(() => ({
    args: [size],
    mass: 1,
    position: [Math.random() - 0.5, Math.random() * 2, Math.random() - 0.5],
  }))
  useFrame(() => at(Math.floor(Math.random() * number)).position.set(0, Math.random() * 2, 0))
  return (
    <instancedMesh receiveShadow castShadow ref={ref} args={[undefined, undefined, number]}>
      <sphereBufferGeometry args={[size, 48]}>
        <instancedBufferAttribute attachObject={['attributes', 'color']} args={[colors, 3]} />
      </sphereBufferGeometry>
      <meshLambertMaterial vertexColors />
    </instancedMesh>
  )
}

const Boxes = ({ colors, number, size }: InstancedGeometryProps) => {
  const args: Triplet = [size, size, size]
  const [ref, { at }] = useBox(() => ({
    mass: 1,
    args,
    position: [Math.random() - 0.5, Math.random() * 2, Math.random() - 0.5],
  }))
  useFrame(() => at(Math.floor(Math.random() * number)).position.set(0, Math.random() * 2, 0))
  return (
    <instancedMesh receiveShadow castShadow ref={ref} args={[undefined, undefined, number]}>
      <boxBufferGeometry args={args}>
        <instancedBufferAttribute attachObject={['attributes', 'color']} args={[colors, 3]} />
      </boxBufferGeometry>
      <meshLambertMaterial vertexColors />
    </instancedMesh>
  )
}

const instancedGeometry = {
  box: Boxes,
  sphere: Spheres,
}

export default () => {
  const [geometry, setGeometry] = useState<'box' | 'sphere'>('box')
  const [number] = useState(200)
  const [size] = useState(0.1)

  const colors = useMemo(() => {
    const array = new Float32Array(number * 3)
    const color = new Color()
    for (let i = 0; i < number; i++)
      color
        .set(niceColors[17][Math.floor(Math.random() * 5)])
        .convertSRGBToLinear()
        .toArray(array, i * 3)
    return array
  }, [number])

  const InstancedGeometry = instancedGeometry[geometry]

  return (
    <Canvas
      mode="concurrent"
      shadows
      gl={{ alpha: false }}
      camera={{ position: [-1, 1, 2.5], fov: 50 }}
      onPointerMissed={() => setGeometry((geometry) => (geometry === 'box' ? 'sphere' : 'box'))}
      onCreated={({ scene }) => (scene.background = new Color('lightblue'))}>
      <hemisphereLight intensity={0.35} />
      <spotLight
        position={[5, 5, 5]}
        angle={0.3}
        penumbra={1}
        intensity={2}
        castShadow
        shadow-mapSize-width={256}
        shadow-mapSize-height={256}
      />
      <Physics broadphase="SAP">
        <Plane rotation={[-Math.PI / 2, 0, 0]} />
        <InstancedGeometry {...{ colors, number, size }} />
      </Physics>
    </Canvas>
  )
}
