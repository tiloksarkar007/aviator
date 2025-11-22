/**
 * Fly-Away Animation - Aesthetic Alignment & Direction
 * Plane aligns with movement direction for intuitive, aesthetic trajectory
 */

import { FlyAwayPhysics, SceneDimensions } from '../types';
import { PHYSICS } from '../config/constants';
import { lerp } from '../utils/MathUtils';

export class FlyAwayAnimation {
  private physics: FlyAwayPhysics;
  private startX: number = 0;
  private startY: number = 0;
  private elapsedTime: number = 0;
  private totalDuration: number = 5.5; // Much slower for better feel: ~50% slower overall
  private initialVelocity: { vx: number; vy: number } = { vx: 0, vy: 0 };
  private initialDirection: number = 0; // Initial flight direction
  private targetDirection: number = 0; // Target fly-away direction
  private frameSkip: number = 0;
  private previousPosition: { x: number; y: number } = { x: 0, y: 0 };

  constructor() {
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
   * Start fly-away with proper direction alignment
   */
  public start(x: number, y: number, rotation: number, velocityX?: number, velocityY?: number): void {
    this.startX = x;
    this.startY = y;
    this.elapsedTime = 0;
    this.frameSkip = 0;
    this.previousPosition = { x, y };
    
    this.physics.x = x;
    this.physics.y = y;
    
    // Calculate initial direction from velocity or rotation
    if (velocityX !== undefined && velocityY !== undefined && 
        (Math.abs(velocityX) > 1 || Math.abs(velocityY) > 1)) {
      // Use actual velocity direction for intuitive alignment
      this.initialDirection = Math.atan2(velocityY, velocityX);
      const speed = Math.sqrt(velocityX * velocityX + velocityY * velocityY);
      this.initialVelocity.vx = velocityX;
      this.initialVelocity.vy = velocityY;
      
      // Much slower: significantly reduced boost for better feel
      const boost = PHYSICS.FLY_AWAY_INITIAL_BOOST * 0.15; // Further reduced for leisurely pace
      this.initialVelocity.vx *= (1 + boost / Math.max(speed, 100)); // Clamp to prevent division by zero
      this.initialVelocity.vy *= (1 + boost / Math.max(speed, 100));
    } else {
      // Fallback: use rotation to determine direction (much slower)
      this.initialDirection = rotation;
      const speed = PHYSICS.FLY_AWAY_INITIAL_BOOST * 0.15; // Significantly reduced for better feel
      this.initialVelocity.vx = Math.cos(rotation) * speed;
      this.initialVelocity.vy = Math.sin(rotation) * speed;
    }
    
    // Target direction: gradually transition to upward arc
    const flyAwayAngle = PHYSICS.FLY_AWAY_TRAJECTORY_ANGLE;
    this.targetDirection = Math.atan2(
      -Math.sin(flyAwayAngle), // Upward component
      Math.cos(flyAwayAngle)  // Rightward component
    );
    
    // Smooth direction transition: start with flight direction, blend to fly-away direction
    this.physics.vx = this.initialVelocity.vx;
    this.physics.vy = this.initialVelocity.vy;
    
    // Initial rotation aligned with movement direction
    const movementAngle = Math.atan2(this.initialVelocity.vy, this.initialVelocity.vx);
    this.physics.rotation = movementAngle * 0.75; // Match flight rotation style
    
    this.physics.angularVelocity = 0; // Start with no spin, align naturally first
    this.physics.scale = 1.0;
    this.physics.alpha = 1.0;
    this.physics.active = true;
  }

  /**
   * Update with direction-aligned movement
   */
  public update(dimensions: SceneDimensions, deltaTime: number): {
    x: number;
    y: number;
    rotation: number;
    scale: number;
    alpha: number;
    active: boolean;
    progress: number;
    blur: number;
  } {
    if (!this.physics.active) {
      return { ...this.physics, progress: 1.0, blur: 0 };
    }

    // Frame skipping for battery efficiency
    this.frameSkip++;
    const updateInterval = 1;
    if (this.frameSkip % updateInterval !== 0 && this.elapsedTime > 0.1) {
      return { ...this.physics, progress: Math.min(this.elapsedTime / this.totalDuration, 1.0), blur: 0 };
    }

    this.elapsedTime += deltaTime;
    const progress = Math.min(this.elapsedTime / this.totalDuration, 1.0);
    
    // Much slower: significantly reduced exponential acceleration
    const accelerationFactor = Math.exp(progress * 0.3); // Much slower acceleration
    const decelerationFactor = 1.0 - Math.pow(progress, 2.5); // Slower deceleration for longer visibility
    
    // Calculate current speed with much reduced multiplier
    const currentSpeed = Math.sqrt(this.initialVelocity.vx ** 2 + this.initialVelocity.vy ** 2);
    const speedMultiplier = 0.35; // Significantly reduced for better feel (was 0.494)
    const acceleratedSpeed = currentSpeed * accelerationFactor * decelerationFactor * speedMultiplier;
    
    // Much slower direction transition for smoother, more visible arc
    const directionBlend = Math.min(progress * 0.5, 1.0); // Slower transition for better visibility
    const currentDirection = lerp(this.initialDirection, this.targetDirection, directionBlend);
    
    // Update velocity with aligned direction
    this.physics.vx = Math.cos(currentDirection) * acceleratedSpeed;
    this.physics.vy = Math.sin(currentDirection) * acceleratedSpeed;
    
    // Update position
    this.physics.x += this.physics.vx * deltaTime;
    this.physics.y += this.physics.vy * deltaTime;
    
    // Calculate actual movement direction for rotation alignment
    const dx = this.physics.x - this.previousPosition.x;
    const dy = this.physics.y - this.previousPosition.y;
    const movementDistance = Math.sqrt(dx * dx + dy * dy);
    
    if (movementDistance > 0.1) {
      // Align rotation with actual movement direction (aesthetic and intuitive)
      const movementAngle = Math.atan2(dy, dx);
      const targetRotation = movementAngle * 0.75; // Match flight style
      
      // Smooth rotation alignment
      const rotationDiff = targetRotation - this.physics.rotation;
      // Normalize angle difference
      let normalizedDiff = rotationDiff;
      while (normalizedDiff > Math.PI) normalizedDiff -= Math.PI * 2;
      while (normalizedDiff < -Math.PI) normalizedDiff += Math.PI * 2;
      
      // Much slower rotation alignment for better visibility
      const rotationSpeed = 2.5; // Significantly reduced for leisurely rotation
      this.physics.rotation += normalizedDiff * Math.min(rotationSpeed * deltaTime, 1.0);
      
      // Add subtle spin after alignment (only after 50% progress, much slower spin)
      if (progress > 0.5) {
        const spinAmount = (progress - 0.5) * 0.4; // Slower, delayed spin
        this.physics.angularVelocity = PHYSICS.FLY_AWAY_ANGULAR_VELOCITY * 0.15 * spinAmount; // Much slower spin
        this.physics.angularVelocity *= 0.99; // Slower damping for longer visibility
        this.physics.rotation += this.physics.angularVelocity * deltaTime;
      }
    }
    
    this.previousPosition = { x: this.physics.x, y: this.physics.y };
    
    // Much slower exponential scaling for better visibility
    const scaleProgress = Math.min(progress * 0.5, 1.0); // Slower scaling
    const scaleEase = 1 - Math.exp(-scaleProgress * 0.8); // Much slower ease
    this.physics.scale = 1.0 + scaleEase * 0.4;
    
    // Much slower blur effect progression
    const blurProgress = Math.min(progress * 0.6, 1.0); // Slower blur build-up
    const blur = blurProgress * 2;
    
    // Much slower exponential alpha fade - plane stays visible longer
    const alphaProgress = Math.min(progress * 0.6, 1.0); // Slower fade start
    this.physics.alpha = Math.max(0, Math.exp(-alphaProgress * 1.5)); // Much slower fade
    
    // Early exit optimization
    if (progress >= 1.0 ||
        this.physics.alpha <= 0.01 || 
        this.physics.x > dimensions.width + 300 || 
        this.physics.y < -300 || 
        this.physics.x < -300) {
      this.physics.active = false;
    }
    
    return { ...this.physics, progress, blur };
  }

  /**
   * Get current velocity
   */
  public getVelocity(): { vx: number; vy: number } {
    return { vx: this.physics.vx, vy: this.physics.vy };
  }

  /**
   * Check if active
   */
  public isActive(): boolean {
    return this.physics.active;
  }

  /**
   * Get current progress
   */
  public getProgress(): number {
    return Math.min(this.elapsedTime / this.totalDuration, 1.0);
  }

  /**
   * Reset animation
   */
  public reset(): void {
    this.physics.active = false;
    this.physics.alpha = 1.0;
    this.elapsedTime = 0;
    this.frameSkip = 0;
    this.previousPosition = { x: 0, y: 0 };
  }
}
