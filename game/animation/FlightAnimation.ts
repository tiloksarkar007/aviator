/**
 * Flight Animation
 * Handles flight animation logic
 */

import { Ticker } from 'pixi.js';
import { CurvePoint } from '../types';
import { Viewport } from '../types';
import { SceneDimensions } from '../types';
import { ANIMATION } from '../config/constants';
import { expSmooth } from '../utils/MathUtils';

export class FlightAnimation {
  private flightTime: number = 0;
  private curvePoints: CurvePoint[] = [{ t: 0, m: 1.0 }];

  /**
   * Calculate plane position and rotation during flight
   */
  public update(
    elapsedSeconds: number,
    multiplier: number,
    viewport: Viewport,
    dimensions: SceneDimensions,
    deltaTime: number
  ): {
    x: number;
    y: number;
    rotation: number;
    scale: number;
  } {
    this.flightTime += deltaTime;
    
    const originX = dimensions.paddingLeft;
    const originY = dimensions.height - dimensions.paddingBottom;
    
    const planeX = originX + (elapsedSeconds * viewport.scaleX);
    const planeY = originY - ((multiplier - 1) * viewport.scaleY);
    
    // Calculate rotation based on curve direction
    let rotation = -0.1;
    if (this.curvePoints.length > 1) {
      const prev = this.curvePoints[this.curvePoints.length - 2];
      const dx = (elapsedSeconds - prev.t) * viewport.scaleX;
      const dy = -((multiplier - prev.m) * viewport.scaleY);
      rotation = Math.atan2(dy, dx) * 0.75;
    }
    
    // Subtle scale pulsing
    const scale = 1.0 + Math.sin(this.flightTime * ANIMATION.PULSE_SPEED) * ANIMATION.PULSE_AMOUNT;
    
    return { x: planeX, y: planeY, rotation, scale };
  }

  /**
   * Add curve point
   */
  public addCurvePoint(point: CurvePoint, threshold: number): boolean {
    const lastPoint = this.curvePoints[this.curvePoints.length - 1];
    if (!lastPoint || 
        Math.abs(point.t - lastPoint.t) > threshold || 
        Math.abs(point.m - lastPoint.m) > threshold) {
      this.curvePoints.push(point);
      return true;
    }
    return false;
  }

  /**
   * Get curve points
   */
  public getCurvePoints(): CurvePoint[] {
    return [...this.curvePoints];
  }

  /**
   * Reset animation
   */
  public reset(): void {
    this.curvePoints = [{ t: 0, m: 1.0 }];
    this.flightTime = 0;
  }

  /**
   * Clear curve points
   */
  public clearCurve(): void {
    this.curvePoints = [{ t: 0, m: 1.0 }];
  }
}

