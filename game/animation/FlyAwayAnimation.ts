/**
 * Fly-Away Animation
 * Handles physics-based fly-away animation
 */

import { FlyAwayPhysics, SceneDimensions } from '../types';
import { PHYSICS } from '../config/constants';
import { PhysicsSystem } from '../systems/PhysicsSystem';
import { distance } from '../utils/MathUtils';

export class FlyAwayAnimation {
  private physics: FlyAwayPhysics;
  private startX: number = 0;
  private startY: number = 0;

  constructor(private physicsSystem: PhysicsSystem) {
    this.physics = {
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      rotation: 0,
      angularVelocity: 0,
      scale: 1.0,
      alpha: 1.0,
      active: false
    };
  }

  /**
   * Start fly-away animation
   */
  public start(x: number, y: number, rotation: number): void {
    this.startX = x;
    this.startY = y;
    this.physics.x = x;
    this.physics.y = y;
    this.physics.vx = 0;
    this.physics.vy = 0;
    this.physics.rotation = rotation;
    this.physics.angularVelocity = PHYSICS.FLY_AWAY_ANGULAR_VELOCITY;
    this.physics.scale = 1.0;
    this.physics.alpha = 1.0;
    this.physics.active = true;
  }

  /**
   * Update fly-away animation
   */
  public update(dimensions: SceneDimensions, deltaTime: number): {
    x: number;
    y: number;
    rotation: number;
    scale: number;
    alpha: number;
    active: boolean;
  } {
    if (!this.physics.active) {
      return { ...this.physics };
    }

    // Apply thrust
    const angle = Math.PI / 4; // 45 degrees up-right
    const thrust = this.physicsSystem.calculateThrust(angle, PHYSICS.FLY_AWAY_THRUST, deltaTime);
    this.physics.vx += thrust.vx;
    this.physics.vy += thrust.vy;
    
    // Apply air resistance
    const resistance = this.physicsSystem.applyAirResistance(this.physics.vx, this.physics.vy, deltaTime);
    this.physics.vx = resistance.vx;
    this.physics.vy = resistance.vy;
    
    // Update position
    const pos = this.physicsSystem.updatePosition(this.physics.x, this.physics.y, this.physics.vx, this.physics.vy, deltaTime);
    this.physics.x = pos.x;
    this.physics.y = pos.y;
    
    // Angular velocity with damping
    this.physics.angularVelocity = this.physicsSystem.applyAngularDamping(this.physics.angularVelocity, 0.98);
    this.physics.rotation += this.physics.angularVelocity * deltaTime;
    
    // Scale increases smoothly
    const distanceTraveled = distance(this.physics.x, this.physics.y, this.startX, this.startY);
    const maxDistance = Math.max(dimensions.width, dimensions.height) * 1.5;
    const progress = Math.min(distanceTraveled / (maxDistance * 0.6), 1.0);
    this.physics.scale = 1.0 + progress * 0.6;
    
    // Fade out based on distance
    this.physics.alpha = Math.max(0, 1 - (distanceTraveled / maxDistance));
    
    // Check if off-screen or invisible
    if (this.physics.alpha <= 0 || 
        this.physics.x > dimensions.width + 200 || 
        this.physics.y < -200 || 
        this.physics.x < -200) {
      this.physics.active = false;
    }
    
    return { ...this.physics };
  }

  /**
   * Check if active
   */
  public isActive(): boolean {
    return this.physics.active;
  }

  /**
   * Reset animation
   */
  public reset(): void {
    this.physics.active = false;
    this.physics.alpha = 1.0;
  }
}

