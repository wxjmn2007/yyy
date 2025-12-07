import React, { useLayoutEffect, useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ParticleConfig, GestureState } from '../types';
import { generateParticles, generateTextParticles } from '../utils/geometry';

interface ParticleSystemProps {
  config: ParticleConfig;
  gestureRef: React.MutableRefObject<GestureState>;
}

const ParticleSystem: React.FC<ParticleSystemProps> = ({ config, gestureRef }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const count = config.count;
  const dummy = useMemo(() => new THREE.Object3D(), []);
  
  // Current positions of particles
  const particles = useRef<Float32Array>(new Float32Array(count * 3));
  // Target positions based on shape
  const targetPositions = useRef<Float32Array>(new Float32Array(count * 3));
  
  // Cache for special shapes (Text/Numbers)
  const textShapes = useRef<Record<string, Float32Array>>({});

  // Initialize Standard Shape
  useEffect(() => {
    targetPositions.current = generateParticles(count, config.shape);
    // If it's the first load, set current to target to avoid explosion
    if (particles.current[0] === 0 && particles.current[1] === 0) {
        particles.current.set(targetPositions.current);
    }
  }, [config.shape, count]);

  // Pre-generate Text Shapes on mount/count change
  useEffect(() => {
    textShapes.current['1'] = generateTextParticles("1", count, 6);
    textShapes.current['2'] = generateTextParticles("2", count, 6);
    textShapes.current['3'] = generateTextParticles("3", count, 6);
    textShapes.current['name'] = generateTextParticles("吴鑫檑", count, 8);
  }, [count]);

  useLayoutEffect(() => {
    if (meshRef.current) {
      const color = new THREE.Color(config.color);
      for (let i = 0; i < count; i++) {
        dummy.position.set(targetPositions.current[i*3], targetPositions.current[i*3+1], targetPositions.current[i*3+2]);
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.matrix);
        meshRef.current.setColorAt(i, color);
      }
      meshRef.current.instanceMatrix.needsUpdate = true;
      meshRef.current.instanceColor!.needsUpdate = true;
    }
  }, [count]);

  useFrame((state) => {
    if (!meshRef.current) return;

    const { spreadFactor, isHandDetected, centerX, centerY, detectedNumber } = gestureRef.current;
    
    // Determine Target Buffer
    let currentTargetBuffer = targetPositions.current; // Default to selected shape
    let useSpread = true; // Should we apply explosion effect?

    // 1. Priority: Detected Number
    if (detectedNumber > 0 && textShapes.current[detectedNumber.toString()]) {
        currentTargetBuffer = textShapes.current[detectedNumber.toString()];
        useSpread = false; // Numbers should stay formed
    } 
    // 2. Priority: Fully Open Hand -> "吴鑫檑"
    else if (spreadFactor > 0.8 && textShapes.current['name']) {
        currentTargetBuffer = textShapes.current['name'];
        useSpread = false;
    }

    const targetSpread = isHandDetected ? spreadFactor : 0.2;
    const time = state.clock.getElapsedTime();
    const targetColor = new THREE.Color(config.color);
    
    // Update positions
    for (let i = 0; i < count; i++) {
      const ix = i * 3;
      const iy = i * 3 + 1;
      const iz = i * 3 + 2;

      const tx = currentTargetBuffer[ix];
      const ty = currentTargetBuffer[iy];
      const tz = currentTargetBuffer[iz];

      // Calculate Target with Spread (only if not a text shape)
      let targetX = tx;
      let targetY = ty;
      let targetZ = tz;

      if (useSpread) {
          const scaleHand = 1.0 + (targetSpread * 3.0);
          targetX *= scaleHand;
          targetY *= scaleHand;
          targetZ *= scaleHand;
      }

      // Move particle towards target
      const speed = 0.05 + (Math.random() * 0.02);
      
      particles.current[ix] += (targetX - particles.current[ix]) * speed;
      particles.current[iy] += (targetY - particles.current[iy]) * speed;
      particles.current[iz] += (targetZ - particles.current[iz]) * speed;

      // Add Noise
      const noiseAmp = 0.05 + (targetSpread * 0.1);
      particles.current[ix] += Math.sin(time * 2 + i) * noiseAmp;
      particles.current[iy] += Math.cos(time * 1.5 + i) * noiseAmp;
      particles.current[iz] += Math.sin(time * 1 + i) * noiseAmp;

      dummy.position.set(
        particles.current[ix],
        particles.current[iy],
        particles.current[iz]
      );
      
      // Scale particles
      const scale = 0.15 * (1 + targetSpread * 0.5) * (0.8 + Math.random() * 0.4); 
      dummy.scale.set(scale, scale, scale);
      
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    
    // Rotation Logic
    if (isHandDetected) {
      meshRef.current.rotation.x = THREE.MathUtils.lerp(meshRef.current.rotation.x, centerY * 0.5, 0.05);
      meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, centerX * 0.5, 0.05);
    } else {
      meshRef.current.rotation.y += 0.002;
      meshRef.current.rotation.x = THREE.MathUtils.lerp(meshRef.current.rotation.x, 0, 0.02);
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
    
    // Bloom Intensity
    if (meshRef.current.material instanceof THREE.MeshStandardMaterial) {
        meshRef.current.material.color.lerp(targetColor, 0.1);
        meshRef.current.material.emissive.lerp(targetColor, 0.1);
        // High emission for bloom, pulsing with spread
        meshRef.current.material.emissiveIntensity = 0.5 + targetSpread * 2.0; 
    }
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <dodecahedronGeometry args={[0.15, 0]} />
      <meshStandardMaterial 
        attach="material"
        color={config.color} 
        emissive={config.color}
        emissiveIntensity={0.8}
        roughness={0.2}
        metalness={0.8}
        toneMapped={false}
      />
    </instancedMesh>
  );
};

export default ParticleSystem;