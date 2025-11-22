/**
 * Type definitions for Aviator Scene
 */

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
}

export interface ExplosionParticle extends Particle {
  size: number;
  color: number;
}

export interface TrailPoint {
  x: number;
  y: number;
  alpha: number;
}

export interface CurvePoint {
  t: number;
  m: number;
}

export interface FlyAwayPhysics {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  angularVelocity: number;
  scale: number;
  alpha: number;
  active: boolean;
}

export interface PlaneState {
  x: number;
  y: number;
  rotation: number;
  rotationTarget: number;
  scale: number;
  alpha: number;
}

export interface Viewport {
  scaleX: number;
  scaleY: number;
  maxTimeWindow: number;
  maxMultWindow: number;
}

export interface SceneDimensions {
  width: number;
  height: number;
  paddingLeft: number;
  paddingBottom: number;
}

