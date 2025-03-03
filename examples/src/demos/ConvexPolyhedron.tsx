import { BoxGeometry, ConeGeometry } from 'three'
import { Suspense, useMemo, useState } from 'react'
import { Canvas, useLoader } from '@react-three/fiber'
import { Physics, usePlane, useConvexPolyhedron } from '@react-three/cannon'
import { GLTFLoader } from 'three-stdlib/loaders/GLTFLoader'
import { Geometry } from 'three-stdlib/deprecated/Geometry'

import type { ConvexPolyhedronProps, PlaneProps } from '@react-three/cannon'
import type { GLTF } from 'three-stdlib/loaders/GLTFLoader'
import type { BufferGeometry } from 'three'

// Returns legacy geometry vertices, faces for ConvP
function toConvexProps(bufferGeometry: BufferGeometry): ConvexPolyhedronProps['args'] {
  const geo = new Geometry().fromBufferGeometry(bufferGeometry)
  // Merge duplicate vertices resulting from glTF export.
  // Cannon assumes contiguous, closed meshes to work
  geo.mergeVertices()
  return [geo.vertices.map((v) => [v.x, v.y, v.z]), geo.faces.map((f) => [f.a, f.b, f.c]), []]
}

type DiamondGLTF = GLTF & {
  nodes: { Cylinder: { geometry: BufferGeometry } }
}

function Diamond({ position, rotation }: ConvexPolyhedronProps) {
  const {
    nodes: {
      Cylinder: { geometry },
    },
  } = useLoader(GLTFLoader, '/diamond.glb') as DiamondGLTF
  const args = useMemo(() => toConvexProps(geometry), [geometry])
  const [ref] = useConvexPolyhedron(() => ({ args, mass: 100, position, rotation }))

  return (
    <mesh castShadow receiveShadow {...{ geometry, position, ref, rotation }}>
      <meshStandardMaterial wireframe color="white" />
    </mesh>
  )
}

type ConeProps = Pick<ConvexPolyhedronProps, 'position' | 'rotation'> & {
  sides: number
}
// A cone is a convex shape by definition...
function Cone({ position, rotation, sides }: ConeProps) {
  const geometry = new ConeGeometry(0.7, 0.7, sides, 1)
  const args = useMemo(() => toConvexProps(geometry), [geometry])
  const [ref] = useConvexPolyhedron(() => ({ args, mass: 100, position, rotation }))

  return (
    <mesh castShadow {...{ geometry, position, ref, rotation }}>
      <coneBufferGeometry args={[0.7, 0.7, sides, 1]} />
      <meshNormalMaterial />
    </mesh>
  )
}

type CubeProps = Pick<ConvexPolyhedronProps, 'position' | 'rotation'> & {
  size: number
}
// ...And so is a cube!
function Cube({ position, rotation, size }: CubeProps) {
  // note, this is wildly inefficient vs useBox
  const geometry = new BoxGeometry(size, size, size)
  const args = useMemo(() => toConvexProps(geometry), [geometry])
  const [ref] = useConvexPolyhedron(() => ({ args, mass: 100, position, rotation }))
  return (
    <mesh castShadow receiveShadow {...{ geometry, position, ref, rotation }}>
      <boxBufferGeometry args={[size, size, size]} />
      <meshPhysicalMaterial color="rebeccapurple" />
    </mesh>
  )
}

function Plane(props: PlaneProps) {
  const [ref] = usePlane(() => ({ type: 'Static', ...props }))
  return (
    <mesh ref={ref} receiveShadow>
      <planeBufferGeometry args={[10, 10]} />
      <shadowMaterial color="#171717" />
    </mesh>
  )
}

function ConvexPolyhedron() {
  const [invertGravity, setInvertGravity] = useState(false)

  return (
    <>
      <Canvas shadows camera={{ position: [-1, 1, 5], fov: 50 }}>
        <color attach="background" args={['lightpink']} />
        <spotLight
          position={[15, 15, 15]}
          angle={0.3}
          penumbra={1}
          intensity={2}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <Suspense fallback={null}>
          <Physics gravity={[0, invertGravity ? 5 : -10, 0]}>
            <group
              onPointerDown={() => {
                setInvertGravity(!invertGravity)
              }}>
              <Plane rotation={[-Math.PI / 2, 0, 0]} />
              <Diamond position={[1, 5, 0]} rotation={[0.4, 0.1, 0.1]} />
              <Cone position={[-1, 5, 0.5]} rotation={[0.1, 0.2, 0.1]} sides={6} />
              <Cone position={[-1, 6, 0]} rotation={[0.5, 0.1, 0.1]} sides={8} />
              <Cube position={[2, 3, -0.3]} rotation={[0.5, 0.4, -1]} size={0.4} />
              <Cone position={[-0.3, 7, 1]} rotation={[1, 0.4, 0.1]} sides={7} />
            </group>
          </Physics>
        </Suspense>
      </Canvas>
      <div
        style={{
          position: 'absolute',
          top: 20,
          left: 50,
          color: 'white',
          fontSize: '1.2em',
        }}>
        <pre>* click to invert gravity</pre>
      </div>
    </>
  )
}

export default ConvexPolyhedron
