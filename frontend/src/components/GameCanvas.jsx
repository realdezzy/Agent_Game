import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import useWebSocket from './useWebSocket.js';

/**
 * A simple building component drawn as a box. The height of the
 * building is randomly varied to add visual interest. A color can
 * also be provided.
 */
function Building({ position, color }) {
  const ref = useRef();
  // Memoize the height so it doesn't change on every re‑render
  const height = React.useMemo(() => Math.random() * 2 + 1, []);
  return (
    <mesh position={position} ref={ref} castShadow receiveShadow>
      <boxGeometry args={[1, height, 1]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}

/**
 * A large plane serving as the ground. It's rotated to lie flat on
 * the X/Z plane and given a neutral color so that the buildings and
 * player avatars stand out.
 */
function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      {/* A large plane: width and height both 50 units. */}
      <planeGeometry args={[50, 50]} />
      <meshStandardMaterial color="#2d2d2d" />
    </mesh>
  );
}

/**
 * The core 3D game view. It sets up a basic Three.js scene using
 * React Three Fiber. Random buildings are generated on mount. In a
 * real application these would come from the server via the
 * WebSocket connection.
 */
export default function GameCanvas() {
  // Hook to communicate with the server via a WebSocket.
  const { sendMessage, lastMessage } = useWebSocket();
  // Local state storing the current set of buildings in the world.
  const [buildings, setBuildings] = useState([]);

  // On mount create a handful of random buildings as placeholders.
  useEffect(() => {
    const initial = [];
    for (let i = 0; i < 12; i++) {
      const x = (Math.random() - 0.5) * 20;
      const z = (Math.random() - 0.5) * 20;
      initial.push({ id: i, position: [x, 0.5, z], color: `hsl(${Math.random() * 360}, 60%, 50%)` });
    }
    setBuildings(initial);
  }, []);

  // Listen for incoming server messages to update world state. For now
  // this just logs them; in a complete implementation you would
  // update buildings, player positions, etc.
  useEffect(() => {
    if (lastMessage) {
      try {
        const data = JSON.parse(lastMessage.data);
        // Handle different message types from the server here.
        // For example: { type: 'worldUpdate', buildings: [...] }
        if (data.type === 'worldUpdate' && Array.isArray(data.buildings)) {
          setBuildings(data.buildings);
        }
      } catch (err) {
        console.error('Failed to parse message', err);
      }
    }
  }, [lastMessage]);

  return (
    <Canvas shadows camera={{ position: [0, 8, 12], fov: 60 }} className="w-full h-full">
      {/* Ambient light provides global illumination */}
      <ambientLight intensity={0.3} />
      {/* Directional light acts as a sun casting shadows */}
      <directionalLight position={[5, 10, 5]} intensity={0.8} castShadow />
      {/* The ground and buildings are part of the scene */}
      <Ground />
      {buildings.map((b) => (
        <Building key={b.id} position={b.position} color={b.color} />
      ))}
      {/* OrbitControls allow the user to pan and zoom around the scene */}
      <OrbitControls target={[0, 0.5, 0]} enableDamping={true} />
    </Canvas>
  );
}