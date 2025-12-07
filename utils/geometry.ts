import * as THREE from 'three';
import { ShapeType } from '../types';

// Helper to get random point on sphere
const randomSpherePoint = (radius: number = 1) => {
  const u = Math.random();
  const v = Math.random();
  const theta = 2 * Math.PI * u;
  const phi = Math.acos(2 * v - 1);
  const x = radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.sin(phi) * Math.sin(theta);
  const z = radius * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
};

export const generateTextParticles = (text: string, count: number, size: number = 10): Float32Array => {
  const positions = new Float32Array(count * 3);
  
  // Create off-screen canvas
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return positions;

  const width = 500;
  const height = 500;
  canvas.width = width;
  canvas.height = height;

  // Draw text
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  // Adjust font size based on text length to fit
  const fontSize = text.length > 1 ? 120 : 300; 
  ctx.font = `bold ${fontSize}px Arial, sans-serif`;
  ctx.fillText(text, width / 2, height / 2);

  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const validPixels: {x: number, y: number}[] = [];

  // Scan for white pixels
  for (let y = 0; y < height; y += 4) {
    for (let x = 0; x < width; x += 4) {
      const i = (y * width + x) * 4;
      if (data[i] > 128) { // Red channel > 128
        validPixels.push({ x, y });
      }
    }
  }

  if (validPixels.length === 0) return positions;

  for (let i = 0; i < count; i++) {
    // Randomly sample from valid pixels
    const p = validPixels[Math.floor(Math.random() * validPixels.length)];
    
    // Map 2D pixel to 3D space
    // x: -1 to 1 based on canvas width
    // y: 1 to -1 based on canvas height (inverted)
    // z: slight random depth
    
    const px = (p.x / width) * 2 - 1;
    const py = -((p.y / height) * 2 - 1);
    
    positions[i * 3] = px * size;
    positions[i * 3 + 1] = py * size;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 1; // Flat with some depth
  }

  return positions;
};

export const generateParticles = (count: number, shape: ShapeType): Float32Array => {
  const positions = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    let x = 0, y = 0, z = 0;

    switch (shape) {
      case ShapeType.SPHERE: {
        const p = randomSpherePoint(4);
        x = p.x; y = p.y; z = p.z;
        break;
      }
      case ShapeType.HEART: {
        const phi = Math.random() * Math.PI * 2;
        const theta = Math.random() * Math.PI;
        
        x = 16 * Math.pow(Math.sin(theta), 3) * Math.sin(phi);
        y = (13 * Math.cos(theta) - 5 * Math.cos(2 * theta) - 2 * Math.cos(3 * theta) - Math.cos(4 * theta));
        z = 16 * Math.pow(Math.sin(theta), 3) * Math.cos(phi);
        
        x *= 0.25; y *= 0.25; z *= 0.25;
        
        const scale = Math.pow(Math.random(), 0.5);
        x *= scale; y *= scale; z *= scale;
        break;
      }
      case ShapeType.FLOWER: {
        const angle = i * 137.5 * (Math.PI / 180);
        const radius = 5 * Math.sqrt(i / count);
        x = radius * Math.cos(angle);
        z = radius * Math.sin(angle);
        y = Math.sin(radius * 2) * 2; 
        break;
      }
      case ShapeType.SATURN: {
        const isRing = Math.random() > 0.3;
        if (isRing) {
            const angle = Math.random() * Math.PI * 2;
            const minR = 4;
            const maxR = 8;
            const dist = minR + Math.random() * (maxR - minR);
            x = Math.cos(angle) * dist;
            z = Math.sin(angle) * dist;
            y = (Math.random() - 0.5) * 0.2;
        } else {
            const p = randomSpherePoint(2.5);
            x = p.x; y = p.y; z = p.z;
        }
        const tilt = Math.PI / 6;
        const x_new = x * Math.cos(tilt) - y * Math.sin(tilt);
        const y_new = x * Math.sin(tilt) + y * Math.cos(tilt);
        x = x_new;
        y = y_new;
        break;
      }
      case ShapeType.DNA: {
        const t = (i / count) * Math.PI * 10;
        const radius = 2;
        x = Math.cos(t) * radius;
        z = Math.sin(t) * radius;
        y = (i / count) * 10 - 5;
        if (i % 2 === 0) {
            x = Math.cos(t + Math.PI) * radius;
            z = Math.sin(t + Math.PI) * radius;
        }
        break;
      }
    }

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;
  }

  return positions;
};