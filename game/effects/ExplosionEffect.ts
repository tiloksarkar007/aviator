/**
 * Explosion Effect
 * Handles explosion particle effects
 */

import { Graphics, Container } from 'pixi.js';
import { ParticleSystem } from '../systems/ParticleSystem';
import { PhysicsSystem } from '../systems/PhysicsSystem';
import { COLORS, PERFORMANCE, PHYSICS } from '../config/constants';
import { ExplosionParticle } from '../types';

export class ExplosionEffect {
  private particles: ExplosionParticle[] = [];
  private graphics: Graphics;

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
   * Create explosion at position
   */
  public create(x: number, y: number): void {
    const particleCount = this.isMobile ? PERFORMANCE.MOBILE_EXPLOSION_PARTICLES : PERFORMANCE.DESKTOP_EXPLOSION_PARTICLES;
    
    for (let i = 0; i < particleCount; i++) {
      const particle = this.particleSystem.getExplosionParticle();
      const angle = (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 0.5;
      const speed = PHYSICS.EXPLOSION_FORCE * (0.5 + Math.random() * 0.5);
      const life = 0.5 + Math.random() * 0.5;
      
      particle.x = x + (Math.random() - 0.5) * 20;
      particle.y = y + (Math.random() - 0.5) * 20;
      particle.vx = Math.cos(angle) * speed;
      particle.vy = Math.sin(angle) * speed;
      particle.life = life;
      particle.maxLife = life;
      particle.size = 3 + Math.random() * 8;
      particle.color = Math.random() > 0.5 ? COLORS.EXPLOSION : COLORS.EXPLOSION_FIRE;
      
      this.particles.push(particle);
    }
  }

  /**
   * Update particles
   */
  public update(deltaTime: number): void {
    const aliveParticles: ExplosionParticle[] = [];
    
    for (const particle of this.particles) {
      // Apply gravity
      particle.vy = this.physicsSystem.applyParticleGravity(particle.vy, deltaTime);
      
      // Apply friction
      const friction = this.physicsSystem.applyParticleFriction(particle.vx, particle.vy, deltaTime);
      particle.vx = friction.vx;
      particle.vy = friction.vy;
      
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
   * Render particles
   */
  public render(): void {
    this.graphics.clear();
    
    for (const particle of this.particles) {
      const alpha = particle.life / particle.maxLife;
      const size = particle.size * alpha;
      
      // Core
      this.graphics.circle(particle.x, particle.y, size);
      this.graphics.fill({ 
        color: particle.color,
        alpha: alpha * 0.8
      });
      
      // Glow
      this.graphics.circle(particle.x, particle.y, size * 1.5);
      this.graphics.fill({ 
        color: particle.color,
        alpha: alpha * 0.3
      });
    }
  }

  /**
   * Clear all particles
   */
  public clear(): void {
    this.particles.forEach(p => this.particleSystem.recycleExplosionParticle(p));
    this.particles = [];
    this.graphics.clear();
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

