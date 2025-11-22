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
   * Update fly-away state
   */
  public updateFlyAway(deltaTime: number): void {
    const flyAway = this.flyAwayAnimation.update(this.dimensions, deltaTime);
    
    if (flyAway.active) {
      this.plane.update(flyAway.x, flyAway.y, flyAway.rotation, flyAway.scale, flyAway.alpha, deltaTime);
      this.plane.setVisible(true);
      
      this.explosionEffect.update(deltaTime);
      this.flashEffect.update(deltaTime);
      this.trailEffect.fade();
      
      const planePos = this.plane.getPosition();
      this.trailEffect.addPoint(planePos.x, planePos.y);
      
      this.explosionEffect.render();
      this.flashEffect.render();
      this.trailEffect.render();
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
   * Handle state transition
   */
  public handleStateTransition(
    newState: GameState,
    oldState: GameState,
    planePos: { x: number; y: number },
    planeRotation: number
  ): void {
    if (newState === GameState.CRASHED && oldState !== GameState.CRASHED) {
      this.flyAwayAnimation.start(planePos.x, planePos.y, planeRotation);
      this.explosionEffect.create(planePos.x, planePos.y);
      this.flashEffect.trigger();
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

