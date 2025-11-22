/**
 * Explosion Effect - Premium Edition
 * Handles premium multi-stage explosion particle effects
 */

import { Graphics, Container } from 'pixi.js';
import { ParticleSystem } from '../systems/ParticleSystem';
import { PhysicsSystem } from '../systems/PhysicsSystem';
import { COLORS, PERFORMANCE, PHYSICS } from '../config/constants';
import { ExplosionParticle } from '../types';

export class ExplosionEffect {
  private particles: ExplosionParticle[] = [];
  private graphics: Graphics;
  private elapsedTime: number = 0;
  private stage2Emitted: boolean = false;

  constructor(
    private container: Container,
    private particleSystem: ParticleSystem,
    private physicsSystem: PhysicsSystem,
    private isMobile: boolean
  ) {
    this.graphics = new Graphics();
    this.container.addChild(this.graphics);
  }

  /**
   * Create premium multi-stage explosion at position
   */
  public create(x: number, y: number): void {
    this.elapsedTime = 0;
    this.stage2Emitted = false;
    
    const particleCount = this.isMobile ? PERFORMANCE.MOBILE_EXPLOSION_PARTICLES : PERFORMANCE.DESKTOP_EXPLOSION_PARTICLES;
    
    // Stage 1: Core explosion (bright, fast)
    const coreCount = Math.floor(particleCount * 0.4);
    for (let i = 0; i < coreCount; i++) {
      const particle = this.particleSystem.getExplosionParticle();
      const angle = (Math.PI * 2 * i) / coreCount + (Math.random() - 0.5) * 0.8;
      const speed = PHYSICS.EXPLOSION_FORCE * (0.7 + Math.random() * 0.6);
      const life = 0.6 + Math.random() * 0.4;
      
      particle.x = x + (Math.random() - 0.5) * 15;
      particle.y = y + (Math.random() - 0.5) * 15;
      particle.vx = Math.cos(angle) * speed;
      particle.vy = Math.sin(angle) * speed;
      particle.life = life;
      particle.maxLife = life;
      particle.size = 4 + Math.random() * 12;
      // Core explosion - brighter colors
      particle.color = Math.random() > 0.4 ? COLORS.EXPLOSION : COLORS.EXPLOSION_FIRE;
      
      this.particles.push(particle);
    }
    
    // Stage 2: Sparks (smaller, faster, more)
    const sparkCount = Math.floor(particleCount * 0.3);
    for (let i = 0; i < sparkCount; i++) {
      const particle = this.particleSystem.getExplosionParticle();
      const angle = (Math.PI * 2 * i) / sparkCount + (Math.random() - 0.5) * 0.6;
      const speed = PHYSICS.EXPLOSION_FORCE * (0.8 + Math.random() * 0.7);
      const life = 0.4 + Math.random() * 0.3;
      
      particle.x = x + (Math.random() - 0.5) * 10;
      particle.y = y + (Math.random() - 0.5) * 10;
      particle.vx = Math.cos(angle) * speed;
      particle.vy = Math.sin(angle) * speed;
      particle.life = life;
      particle.maxLife = life;
      particle.size = 2 + Math.random() * 6;
      particle.color = COLORS.EXPLOSION_SPARK;
      
      this.particles.push(particle);
    }
    
    // Stage 3: Debris (larger, slower, longer-lived)
    const debrisCount = Math.floor(particleCount * 0.3);
    for (let i = 0; i < debrisCount; i++) {
      const particle = this.particleSystem.getExplosionParticle();
      const angle = (Math.PI * 2 * i) / debrisCount + (Math.random() - 0.5) * 0.4;
      const speed = PHYSICS.EXPLOSION_SECONDARY_FORCE * (0.5 + Math.random() * 0.5);
      const life = 0.8 + Math.random() * 0.6;
      
      particle.x = x + (Math.random() - 0.5) * 25;
      particle.y = y + (Math.random() - 0.5) * 25;
      particle.vx = Math.cos(angle) * speed;
      particle.vy = Math.sin(angle) * speed;
      particle.life = life;
      particle.maxLife = life;
      particle.size = 5 + Math.random() * 15;
      particle.color = Math.random() > 0.5 ? COLORS.EXPLOSION : COLORS.EXPLOSION_SMOKE;
      
      this.particles.push(particle);
    }
  }

  /**
   * Emit secondary explosion (delayed effect)
   */
  private emitSecondary(x: number, y: number): void {
    if (this.stage2Emitted) return;
    this.stage2Emitted = true;
    
    const secondaryCount = this.isMobile ? 15 : 25;
    for (let i = 0; i < secondaryCount; i++) {
      const particle = this.particleSystem.getExplosionParticle();
      const angle = Math.random() * Math.PI * 2;
      const speed = PHYSICS.EXPLOSION_SECONDARY_FORCE * (0.4 + Math.random() * 0.4);
      const life = 0.5 + Math.random() * 0.4;
      
      particle.x = x + (Math.random() - 0.5) * 30;
      particle.y = y + (Math.random() - 0.5) * 30;
      particle.vx = Math.cos(angle) * speed;
      particle.vy = Math.sin(angle) * speed;
      particle.life = life;
      particle.maxLife = life;
      particle.size = 3 + Math.random() * 10;
      particle.color = Math.random() > 0.6 ? COLORS.EXPLOSION_FIRE : COLORS.EXPLOSION_SMOKE;
      
      this.particles.push(particle);
    }
  }

  /**
   * Update particles with premium physics
   */
  public update(deltaTime: number, explosionX?: number, explosionY?: number): void {
    this.elapsedTime += deltaTime;
    
    // Emit secondary explosion after delay
    if (!this.stage2Emitted && this.elapsedTime > 0.1 && explosionX !== undefined && explosionY !== undefined) {
      this.emitSecondary(explosionX, explosionY);
    }
    
    const aliveParticles: ExplosionParticle[] = [];
    
    for (const particle of this.particles) {
      // Apply gravity (less for sparks)
      if (particle.color !== COLORS.EXPLOSION_SPARK) {
        particle.vy = this.physicsSystem.applyParticleGravity(particle.vy, deltaTime);
      }
      
      // Apply friction with variation
      const frictionMultiplier = particle.color === COLORS.EXPLOSION_SPARK ? 0.97 : 0.95;
      const friction = this.physicsSystem.applyParticleFriction(particle.vx, particle.vy, deltaTime);
      particle.vx = friction.vx * frictionMultiplier;
      particle.vy = friction.vy * frictionMultiplier;
      
      // Update position
      const pos = this.physicsSystem.updatePosition(particle.x, particle.y, particle.vx, particle.vy, deltaTime);
      particle.x = pos.x;
      particle.y = pos.y;
      
      // Update life
      particle.life -= deltaTime;
      
      if (particle.life > 0) {
        aliveParticles.push(particle);
      } else {
        this.particleSystem.recycleExplosionParticle(particle);
      }
    }
    
    this.particles = aliveParticles;
  }

  /**
   * Render particles with premium effects
   */
  public render(): void {
    this.graphics.clear();
    
    for (const particle of this.particles) {
      const alpha = particle.life / particle.maxLife;
      const size = particle.size * (0.5 + alpha * 0.5); // Size variation
      
      // Main particle with glow
      if (particle.color === COLORS.EXPLOSION_SPARK) {
        // Bright sparks with intense glow
        this.graphics.circle(particle.x, particle.y, size * 2);
        this.graphics.fill({ 
          color: COLORS.EXPLOSION_SPARK,
          alpha: alpha * 0.4
        });
      }
      
      this.graphics.circle(particle.x, particle.y, size);
      this.graphics.fill({ 
        color: particle.color,
        alpha: alpha * 0.9
      });
      
      // Outer glow for larger particles
      if (particle.size > 8) {
        this.graphics.circle(particle.x, particle.y, size * 1.8);
        this.graphics.fill({ 
          color: particle.color,
          alpha: alpha * 0.25
        });
      }
    }
  }

  /**
   * Clear all particles
   */
  public clear(): void {
    this.particles.forEach(p => this.particleSystem.recycleExplosionParticle(p));
    this.particles = [];
    this.graphics.clear();
    this.elapsedTime = 0;
    this.stage2Emitted = false;
  }

  /**
   * Check if has active particles
   */
  public hasActive(): boolean {
    return this.particles.length > 0;
  }

  /**
   * Destroy effect
   */
  public destroy(): void {
    this.clear();
    this.graphics.destroy();
  }
}
