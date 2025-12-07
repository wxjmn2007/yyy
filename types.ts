export enum ShapeType {
  SPHERE = 'Sphere',
  HEART = 'Heart',
  FLOWER = 'Flower',
  SATURN = 'Saturn',
  DNA = 'DNA'
}

export interface GestureState {
  isHandDetected: boolean;
  spreadFactor: number; // 0 (closed) to 1 (open)
  centerX: number; // Normalized -1 to 1
  centerY: number; // Normalized -1 to 1
  detectedNumber: 0 | 1 | 2 | 3; // 0 = none/other
}

export interface ParticleConfig {
  count: number;
  color: string;
  shape: ShapeType;
}