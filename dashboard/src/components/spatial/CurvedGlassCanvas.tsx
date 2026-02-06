"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useRef, useMemo } from "react";
import * as THREE from "three";

/**
 * Curved Glass Frame Component
 * Creates a subtle curved glass panel that sits behind the dashboard content
 * giving the appearance of a Vision Pro-style curved display
 */
function CurvedGlassFrame() {
  const meshRef = useRef<THREE.Mesh>(null);

  // Create a curved cylinder segment geometry
  // This creates the "curved screen" effect
  const geometry = useMemo(() => {
    // Parameters tuned for Vision Pro-like subtle curvature
    const radius = 3; // Distance from center (larger = subtler curve)
    const height = 7; // Height of the curved panel
    const radialSegments = 64; // Smoothness of curve
    const heightSegments = 1;
    const openEnded = true; // No caps
    const thetaStart = Math.PI * 0.75; // Start angle (facing camera)
    const thetaLength = Math.PI * 0.15; // Arc length (90 degrees of curve)

    const geo = new THREE.CylinderGeometry(
      radius,
      radius,
      height,
      radialSegments,
      heightSegments,
      openEnded,
      thetaStart,
      thetaLength
    );

    // Rotate to face the camera (cylinder is vertical by default)
    geo.rotateX(Math.PI / 2);

    return geo;
  }, []);

  // Subtle animation for glass shimmer effect
  useFrame((state) => {
    if (meshRef.current) {
      // Very subtle floating animation
      meshRef.current.position.y =
        Math.sin(state.clock.elapsedTime * 0.3) * 0.02;
    }
  });

  return (
    <mesh ref={meshRef} geometry={geometry} position={[0, 0, -2]}>
      <meshPhysicalMaterial
        // Glass-like properties
        color="#1a1a2e"
        metalness={0.1}
        roughness={0.05}
        transmission={0.92} // High transparency
        thickness={0.5} // Glass thickness for refraction
        ior={1.5} // Index of refraction (glass)
        envMapIntensity={0.3}
        clearcoat={1}
        clearcoatRoughness={0.1}
        transparent
        opacity={0.15}
        side={THREE.BackSide} // Render inside of cylinder
      />
    </mesh>
  );
}

/**
 * Edge glow rings for the curved frame
 * Adds subtle light at the edges for depth
 */
function EdgeGlow() {
  return (
    <>
      {/* Top edge glow */}
      <mesh position={[0, 3.4, -2]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[11.8, 0.02, 8, 64, Math.PI * 0.52]} />
        <meshBasicMaterial color="#4f8cff" transparent opacity={0.3} />
      </mesh>
      {/* Bottom edge glow */}
      <mesh position={[0, -3.4, -2]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[11.8, 0.02, 8, 64, Math.PI * 0.52]} />
        <meshBasicMaterial color="#3dd6c6" transparent opacity={0.2} />
      </mesh>
    </>
  );
}

/**
 * Ambient lighting for the scene
 */
function Lighting() {
  return (
    <>
      <ambientLight intensity={0.4} />
      <pointLight position={[10, 10, 10]} intensity={0.5} color="#ffffff" />
      <pointLight position={[-10, -10, 5]} intensity={0.3} color="#4f8cff" />
    </>
  );
}

/**
 * Main CurvedGlassCanvas component
 * Renders a WebGL canvas with curved glass frame behind the dashboard
 */
export function CurvedGlassCanvas() {
  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }}>
      <Canvas
        camera={{
          position: [0, 0, 8],
          fov: 5000,
          near: 0.1,
          far: 100,
        }}
        gl={{
          antialias: true,
          alpha: true, // Transparent background
          powerPreference: "high-performance",
        }}
        style={{ background: "transparent" }}
      >
        <Lighting />
        <CurvedGlassFrame />
        <EdgeGlow />
      </Canvas>
    </div>
  );
}
