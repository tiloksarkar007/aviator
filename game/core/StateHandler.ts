/**
 * State Handler
 * Handles game state updates and transitions
 */

import { Ticker } from 'pixi.js';
import { GameState } from '../../types';
import { FlightAnimation } from '../animation/FlightAnimation';
import { FlyAwayAnimation } from '../animation/FlyAwayAnimation';
import { ViewportSystem } from '../systems/ViewportSystem';
import { ExhaustEffect } from '../effects/ExhaustEffect';
import { ExplosionEffect } from '../effects/ExplosionEffect';
import { TrailEffect } from '../effects/TrailEffect';
import { FlashEffect } from '../effects/FlashEffect';
import { Plane } from '../components/Plane';
import { Curve } from '../components/Curve';
import { SceneDimensions } from '../types';

export class StateHandler {
  constructor(
    private plane: Plane,
    private curve: Curve,
    private viewportSystem: ViewportSystem,
    private flightAnimation: FlightAnimation,
    private flyAwayAnimation: FlyAwayAnimation,
    private exhaustEffect: ExhaustEffect,
    private explosionEffect: ExplosionEffect,
    private trailEffect: TrailEffect,
    private flashEffect: FlashEffect,
    private dimensions: SceneDimensions,
    private isMobile: boolean
  ) {}

  /**
   * Get current plane velocity and direction for fly-away continuity
   */
  public getPlaneVelocity(): { vx: number; vy: number; direction: number } {
    // Calculate velocity from curve points for smooth transition
    const curvePoints = this.flightAnimation.getCurvePoints();
    if (curvePoints.length >= 2) {
      const prev = curvePoints[curvePoints.length - 2];
      const curr = curvePoints[curvePoints.length - 1];
      const viewport = this.viewportSystem.getViewport();
      
      const dx = (curr.t - prev.t) * viewport.scaleX;
      const dy = -((curr.m - prev.m) * viewport.scaleY);
      
      // Calculate actual velocity (pixels per second)
      const timeDelta = Math.max(curr.t - prev.t, 0.016); // Minimum 1 frame
      const vx = (dx / timeDelta) * 60; // Convert to per-second
      const vy = (dy / timeDelta) * 60;
      
      // Calculate direction angle
      const direction = Math.atan2(dy, dx);
      
      return { vx, vy, direction };
    }
    return { vx: 0, vy: 0, direction: -0.1 };
  }

  /**
   * Update flight state
   */
  public updateFlight(
    elapsedSeconds: number,
    multiplier: number,
    deltaTime: number,
    frameSkip: number
  ): void {
    this.viewportSystem.update(elapsedSeconds, multiplier, this.dimensions);
    const viewport = this.viewportSystem.getViewport();
    
    const planeState = this.flightAnimation.update(
      elapsedSeconds,
      multiplier,
      viewport,
      this.dimensions,
      deltaTime
    );
    
    this.plane.update(planeState.x, planeState.y, planeState.rotation, planeState.scale, 1.0, deltaTime);
    this.plane.setVisible(true);
    
    const planePos = this.plane.getPosition();
    this.exhaustEffect.emit(planePos.x, planePos.y, this.plane.getRotation(), deltaTime);
    this.exhaustEffect.update(deltaTime);
    
    this.trailEffect.addPoint(planePos.x, planePos.y);
    
    if (frameSkip % (this.isMobile ? 2 : 1) === 0) {
      this.curve.draw(viewport, this.dimensions, planePos.x, planePos.y, elapsedSeconds, this.isMobile);
    }
    
    this.exhaustEffect.render();
    this.trailEffect.render();
  }

  /**
   * Update fly-away state - Performance optimized
   */
  public updateFlyAway(deltaTime: number): void {
    const flyAway = this.flyAwayAnimation.update(this.dimensions, deltaTime);
    
    if (flyAway.active) {
      // Update plane with blur effect (minimal interpolation for performance)
      this.plane.update(flyAway.x, flyAway.y, flyAway.rotation, flyAway.scale, flyAway.alpha, deltaTime, flyAway.blur);
      this.plane.setVisible(true);
      
      // Reduced explosion updates for performance
      const planePos = this.plane.getPosition();
      if (flyAway.progress < 0.6) {
        // Only update explosion in first 60%
        this.explosionEffect.update(deltaTime, planePos.x, planePos.y);
      }
      
      // Flash only in first 30%
      if (flyAway.progress < 0.3) {
        this.flashEffect.update(deltaTime);
      }
      
      // Minimal trail updates for battery efficiency
      const velocity = this.flyAwayAnimation.getVelocity();
      const speed = Math.sqrt(velocity.vx * velocity.vx + velocity.vy * velocity.vy);
      const progress = flyAway.progress;
      
      // Simple intensity calculation
      const trailIntensity = Math.max(0.2, 1.0 - progress * 0.6);
      this.trailEffect.setIntensity(trailIntensity);
      
      // Reduced trail points for performance
      if (progress < 0.6) {
        // Add trail points only in first 60%
        if (speed > 200) {
          // High speed: occasional point
          if (Math.random() > 0.6) {
            this.trailEffect.addPoint(planePos.x, planePos.y, trailIntensity);
          }
        } else if (speed > 100) {
          // Medium speed: less frequent
          if (Math.random() > 0.7) {
            this.trailEffect.addPoint(planePos.x, planePos.y, trailIntensity);
          }
        }
        // Low speed: no trail points (performance)
      }
      
      // Simple fade (reduced updates)
      if (progress > 0.4) {
        this.trailEffect.fade();
      }
      
      // Reduced render calls
      const renderFrame = Math.floor(flyAway.progress * 120); // Render every 8ms
      if (renderFrame % 2 === 0 || flyAway.progress < 0.3) {
        // Render every other frame after 30%, always render early phase
        if (flyAway.progress < 0.6) {
          this.explosionEffect.render();
        }
        if (flyAway.progress < 0.3) {
          this.flashEffect.render();
        }
        this.trailEffect.render(progress < 0.3); // Force render early phase
      }
    } else {
      this.plane.setVisible(false);
      this.explosionEffect.clear();
      this.trailEffect.clear();
    }
  }

  /**
   * Update betting state
   */
  public updateBetting(ticker: Ticker): void {
    const originX = this.dimensions.paddingLeft;
    const originY = this.dimensions.height - this.dimensions.paddingBottom;
    const hoverY = originY + Math.sin(ticker.lastTime * 0.001) * 3;
    
    this.plane.update(originX, hoverY, -0.1, 1.0, 1.0, 0);
    this.plane.setVisible(true);
    
    this.curve.draw(
      this.viewportSystem.getViewport(),
      this.dimensions,
      originX,
      hoverY,
      0,
      this.isMobile
    );
  }

  /**
   * Update idle state
   */
  public updateIdle(): void {
    const originX = this.dimensions.paddingLeft;
    const originY = this.dimensions.height - this.dimensions.paddingBottom;
    
    this.plane.update(originX, originY, -0.1, 1.0, 1.0, 0);
    this.plane.setVisible(true);
    
    this.curve.draw(
      this.viewportSystem.getViewport(),
      this.dimensions,
      originX,
      originY,
      0,
      this.isMobile
    );
  }

  /**
   * Handle state transition with aligned direction
   */
  public handleStateTransition(
    newState: GameState,
    oldState: GameState,
    planePos: { x: number; y: number },
    planeRotation: number
  ): void {
    if (newState === GameState.CRASHED && oldState !== GameState.CRASHED) {
      // Get velocity and direction from flight path for proper alignment
      const velocity = this.getPlaneVelocity();
      
      // Start fly-away with aligned direction
      this.flyAwayAnimation.start(
        planePos.x,
        planePos.y,
        planeRotation,
        velocity.vx,
        velocity.vy
      );
      
      // Create premium explosion
      this.explosionEffect.create(planePos.x, planePos.y);
      
      // Trigger flash
      this.flashEffect.trigger();
      
      // Clear exhaust
      this.exhaustEffect.clear();
    }
  }

  /**
   * Add curve point if threshold met
   */
  public addCurvePoint(elapsedSeconds: number, multiplier: number, threshold: number): boolean {
    return this.flightAnimation.addCurvePoint({ t: elapsedSeconds, m: multiplier }, threshold);
  }

  /**
   * Reset all animations and effects
   */
  public reset(): void {
    this.curve.clear();
    this.flightAnimation.reset();
    this.flyAwayAnimation.reset();
    this.exhaustEffect.clear();
    this.explosionEffect.clear();
    this.trailEffect.clear();
    this.viewportSystem.reset();
    this.plane.reset();
  }

  /**
   * Draw initial curve
   */
  public drawInitialCurve(): void {
    const viewport = this.viewportSystem.getViewport();
    const originX = this.dimensions.paddingLeft;
    const originY = this.dimensions.height - this.dimensions.paddingBottom;
    this.curve.draw(viewport, this.dimensions, originX, originY, 0, this.isMobile);
  }
}

