/**
 * Particle System
 * Manages particle object pooling for performance
 */

import { Particle, ExplosionParticle } from '../types';
import { PERFORMANCE } from '../config/constants';

export class ParticleSystem {
  private particlePool: Particle[] = [];
  private explosionParticlePool: ExplosionParticle[] = [];

  constructor() {
    this.initPools();
  }

  private initPools(): void {
    for (let i = 0; i < PERFORMANCE.MAX_POOL_SIZE; i++) {
      this.particlePool.push({
        x: 0, y: 0,
        vx: 0, vy: 0,
        life: 0, maxLife: 0
      });
      
      this.explosionParticlePool.push({
        x: 0, y: 0,
        vx: 0, vy: 0,
        life: 0, maxLife: 0,
        size: 0, color: 0
      });
    }
  }

  /**
   * Get a particle from the pool
   */
  public getParticle(): Particle {
    if (this.particlePool.length > 0) {
      return this.particlePool.pop()!;
    }
    return { x: 0, y: 0, vx: 0, vy: 0, life: 0, maxLife: 0 };
  }

  /**
   * Recycle a particle back to the pool
   */
  public recycleParticle(particle: Particle): void {
    if (this.particlePool.length < PERFORMANCE.MAX_POOL_SIZE) {
      this.particlePool.push(particle);
    }
  }

  /**
   * Get an explosion particle from the pool
   */
  public getExplosionParticle(): ExplosionParticle {
    if (this.explosionParticlePool.length > 0) {
      return this.explosionParticlePool.pop()!;
    }
    return { x: 0, y: 0, vx: 0, vy: 0, life: 0, maxLife: 0, size: 0, color: 0 };
  }

  /**
   * Recycle an explosion particle back to the pool
   */
  public recycleExplosionParticle(particle: ExplosionParticle): void {
    if (this.explosionParticlePool.length < PERFORMANCE.MAX_POOL_SIZE) {
      this.explosionParticlePool.push(particle);
    }
  }
}

