/**
 * Exhaust Effect
 * Handles exhaust particle effects behind the plane
 */

import { Graphics, Container } from 'pixi.js';
import { Particle, ParticleSystem } from '../systems/ParticleSystem';
import { PhysicsSystem } from '../systems/PhysicsSystem';
import { COLORS, PERFORMANCE, RESPONSIVE } from '../config/constants';
import { Particle as ParticleType } from '../types';

export class ExhaustEffect {
  private particles: ParticleType[] = [];
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
   * Emit exhaust particles
   */
  public emit(x: number, y: number, rotation: number, deltaTime: number): void {
    const exhaustDistance = (this.isMobile ? RESPONSIVE.MOBILE_PLANE_SIZE : RESPONSIVE.DESKTOP_PLANE_SIZE) * 0.8;
    const exhaustX = x - Math.cos(rotation) * exhaustDistance;
    const exhaustY = y - Math.sin(rotation) * exhaustDistance;
    
    const particlesPerFrame = this.isMobile ? 1 : 2;
    for (let i = 0; i < particlesPerFrame; i++) {
      const particle = this.particleSystem.getParticle();
      const angle = rotation + Math.PI + (Math.random() - 0.5) * 0.5;
      const speed = 30 + Math.random() * 50;
      const life = 0.3 + Math.random() * 0.4;
      
      particle.x = exhaustX + (Math.random() - 0.5) * 10;
      particle.y = exhaustY + (Math.random() - 0.5) * 10;
      particle.vx = Math.cos(angle) * speed;
      particle.vy = Math.sin(angle) * speed;
      particle.life = life;
      particle.maxLife = life;
      
      this.particles.push(particle);
    }
    
    // Limit particle count
    const maxParticles = this.isMobile ? PERFORMANCE.MOBILE_MAX_PARTICLES : PERFORMANCE.DESKTOP_MAX_PARTICLES;
    if (this.particles.length > maxParticles) {
      const toRecycle = this.particles.splice(0, this.particles.length - maxParticles);
      toRecycle.forEach(p => this.particleSystem.recycleParticle(p as any));
    }
  }

  /**
   * Update particles
   */
  public update(deltaTime: number): void {
    const aliveParticles: ParticleType[] = [];
    
    for (const particle of this.particles) {
      // Apply physics
      const friction = this.physicsSystem.applyParticleFriction(particle.vx, particle.vy, deltaTime);
      particle.vx = friction.vx;
      particle.vy = friction.vy;
      
      const pos = this.physicsSystem.updatePosition(particle.x, particle.y, particle.vx, particle.vy, deltaTime);
      particle.x = pos.x;
      particle.y = pos.y;
      
      particle.life -= deltaTime;
      
      if (particle.life > 0) {
        aliveParticles.push(particle);
      } else {
        this.particleSystem.recycleParticle(particle as any);
      }
    }
    
    this.particles = aliveParticles;
  }

  /**
   * Render particles
   */
  public render(): void {
    this.graphics.clear();
    
    const planeSize = this.isMobile ? RESPONSIVE.MOBILE_PLANE_SIZE : RESPONSIVE.DESKTOP_PLANE_SIZE;
    
    for (const particle of this.particles) {
      const size = planeSize * 0.15 * (particle.life / particle.maxLife);
      this.graphics.circle(particle.x, particle.y, size);
      this.graphics.fill({ 
        color: COLORS.TRAIL,
        alpha: (particle.life / particle.maxLife) * 0.4
      });
    }
  }

  /**
   * Clear all particles
   */
  public clear(): void {
    this.particles.forEach(p => this.particleSystem.recycleParticle(p as any));
    this.particles = [];
    this.graphics.clear();
  }

  /**
   * Destroy effect
   */
  public destroy(): void {
    this.clear();
    this.graphics.destroy();
  }
}

