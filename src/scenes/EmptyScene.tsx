import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';

export function EmptyScene() {
  return (
    <Canvas camera={{ position: [0, 0, 5] }}>
      <ambientLight intensity={0.5} />
      <mesh>
        <boxGeometry />
        <meshStandardMaterial color="#888" />
      </mesh>
      <OrbitControls />
    </Canvas>
  );
}
