/**
 * Trail Effect
 * Handles trail rendering behind the plane
 */

import { Graphics, Container } from 'pixi.js';
import { TrailPoint } from '../types';
import { COLORS, PERFORMANCE, RESPONSIVE } from '../config/constants';

export class TrailEffect {
  private points: TrailPoint[] = [];
  private graphics: Graphics;

  constructor(
    private container: Container,
    private isMobile: boolean
  ) {
    this.graphics = new Graphics();
    this.container.addChild(this.graphics);
  }

  /**
   * Add trail point
   */
  public addPoint(x: number, y: number): void {
    this.points.push({ x, y, alpha: 1.0 });
    
    const maxLength = this.isMobile ? PERFORMANCE.MOBILE_TRAIL_LENGTH : PERFORMANCE.DESKTOP_TRAIL_LENGTH;
    if (this.points.length > maxLength) {
      this.points.shift();
    }
    
    // Update alpha gradient
    this.updateAlphaGradient();
  }

  /**
   * Update alpha gradient
   */
  private updateAlphaGradient(): void {
    this.points.forEach((point, i) => {
      const progress = i / this.points.length;
      point.alpha = (1 - progress) * 0.7;
    });
  }

  /**
   * Fade trail
   */
  public fade(): void {
    this.points.forEach(point => {
      point.alpha *= 0.92;
    });
  }

  /**
   * Render trail
   */
  public render(): void {
    this.graphics.clear();
    
    if (this.points.length < 2) return;
    
    const lineWidth = this.isMobile ? RESPONSIVE.MOBILE_LINE_WIDTH : RESPONSIVE.DESKTOP_LINE_WIDTH;
    
    // Draw trail line
    this.graphics.moveTo(this.points[0].x, this.points[0].y);
    for (let i = 1; i < this.points.length; i++) {
      const point = this.points[i];
      const progress = i / this.points.length;
      const width = lineWidth * 2 * (1 - progress * 0.5);
      
      this.graphics.lineTo(point.x, point.y);
      this.graphics.stroke({ 
        width: width, 
        color: COLORS.TRAIL,
        alpha: point.alpha
      });
      this.graphics.moveTo(point.x, point.y);
    }
    
    // Glow effect
    this.graphics.moveTo(this.points[0].x, this.points[0].y);
    for (let i = 1; i < this.points.length; i++) {
      this.graphics.lineTo(this.points[i].x, this.points[i].y);
    }
    this.graphics.stroke({ 
      width: lineWidth * 3, 
      color: COLORS.TRAIL,
      alpha: 0.15
    });
  }

  /**
   * Clear trail
   */
  public clear(): void {
    this.points = [];
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

