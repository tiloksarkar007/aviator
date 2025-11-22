/**
 * Physics System
 * Handles all physics calculations for the game
 */

import { PHYSICS } from '../config/constants';
import { expDecay } from '../utils/MathUtils';

export class PhysicsSystem {
  /**
   * Apply air resistance to velocity
   */
  public applyAirResistance(vx: number, vy: number, deltaTime: number): { vx: number; vy: number } {
    const decay = expDecay(1, PHYSICS.AIR_RESISTANCE, deltaTime);
    return {
      vx: vx * decay,
      vy: vy * decay
    };
  }

  /**
   * Apply gravity to vertical velocity
   */
  public applyGravity(vy: number, deltaTime: number): number {
    return vy + PHYSICS.GRAVITY * deltaTime;
  }

  /**
   * Apply particle gravity
   */
  public applyParticleGravity(vy: number, deltaTime: number): number {
    return vy + PHYSICS.PARTICLE_GRAVITY * deltaTime;
  }

  /**
   * Apply particle friction
   */
  public applyParticleFriction(vx: number, vy: number, deltaTime: number): { vx: number; vy: number } {
    const decay = expDecay(1, PHYSICS.PARTICLE_FRICTION, deltaTime * 60);
    return {
      vx: vx * decay,
      vy: vy * decay
    };
  }

  /**
   * Update position based on velocity
   */
  public updatePosition(x: number, y: number, vx: number, vy: number, deltaTime: number): { x: number; y: number } {
    return {
      x: x + vx * deltaTime,
      y: y + vy * deltaTime
    };
  }

  /**
   * Calculate thrust velocity
   */
  public calculateThrust(angle: number, thrust: number, deltaTime: number): { vx: number; vy: number } {
    return {
      vx: Math.cos(angle) * thrust * deltaTime,
      vy: -Math.sin(angle) * thrust * deltaTime
    };
  }

  /**
   * Apply angular damping
   */
  public applyAngularDamping(angularVelocity: number, damping: number): number {
    return angularVelocity * damping;
  }
}

