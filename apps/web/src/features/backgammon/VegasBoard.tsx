import { Box } from '@mui/material';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars, Float, Text } from '@react-three/drei';
import { Suspense } from 'react';

export const VegasBoard = () => {
  return (
    <Box sx={{ width: '100%', height: '100vh', background: '#000' }}>
      <Canvas camera={{ position: [0, 8, 8], fov: 45 }}>
        {/* אווירת וגאס - כוכבים וניאון */}
        <color attach="background" args={['#050505']} />
        <Stars radius={100} depth={50} count={5000} factor={4} />

        <Suspense fallback={null}>
          <ambientLight intensity={0.4} />
          <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} color="#ff00ff" castShadow />
          <pointLight position={[-10, -10, -10]} color="#00ffff" intensity={2} />

          {/* Cyber-Vegas 2.0: חומרים — זכוכית שחורה / שיש כהה / מתכת מוברשת (יוקרתי) */}
          <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[10, 14]} />
              <meshStandardMaterial
                // @ts-ignore - R3F material props type issue
                color="#1a1a1a"
                roughness={0.15}
                metalness={1}
                emissive="#000"
              />
            </mesh>

            {/* טקסט וגאס מרחף */}
            <Text
              position={[0, 0.1, -7.5]}
              fontSize={1}
              color="#ff00ff"
              font="/fonts/VegasFont.woff"
            >
              NEON OASIS CASINO
            </Text>
          </Float>

          <OrbitControls makeDefault maxPolarAngle={Math.PI / 2} />
        </Suspense>
      </Canvas>
    </Box>
  );
};
