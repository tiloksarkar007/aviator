/**
 * Trail Effect - Performance Optimized
 * Flat shading, minimal rendering, battery-efficient
 */

import { Graphics, Container } from 'pixi.js';
import { TrailPoint } from '../types';
import { COLORS, PERFORMANCE, RESPONSIVE } from '../config/constants';

export class TrailEffect {
  private points: TrailPoint[] = [];
  private graphics: Graphics;
  private intensity: number = 1.0;
  private lastRenderTime: number = 0;
  private renderInterval: number = 16; // ~60fps (can skip frames)

  constructor(
    private container: Container,
    private isMobile: boolean
  ) {
    this.graphics = new Graphics();
    this.container.addChild(this.graphics);
  }

  /**
   * Add trail point with intensity
   */
  public addPoint(x: number, y: number, intensity?: number): void {
    const point: TrailPoint = {
      x,
      y,
      alpha: (intensity ?? this.intensity) * 0.8 // Slightly reduced for flat look
    };
    this.points.push(point);
    
    // Reduced trail length for performance
    const maxLength = this.isMobile ? 12 : 24; // Reduced from 20/40
    if (this.points.length > maxLength) {
      this.points.shift();
    }
    
    // Simple linear gradient
    this.updateAlphaGradient();
  }

  /**
   * Update alpha gradient (simplified)
   */
  private updateAlphaGradient(): void {
    const totalPoints = this.points.length;
    this.points.forEach((point, i) => {
      const progress = i / Math.max(totalPoints - 1, 1);
      point.alpha = (1 - progress) * 0.6; // Flat, simple gradient
    });
  }

  /**
   * Set intensity
   */
  public setIntensity(intensity: number): void {
    this.intensity = Math.max(0, Math.min(1, intensity));
  }

  /**
   * Fade trail
   */
  public fade(): void {
    this.points.forEach(point => {
      point.alpha *= 0.92; // Simple multiplication
    });
  }

  /**
   * Render trail with flat shading (minimal draw calls)
   */
  public render(force: boolean = false): void {
    // Frame skipping for performance
    const now = performance.now();
    if (!force && now - this.lastRenderTime < this.renderInterval) {
      return;
    }
    this.lastRenderTime = now;

    this.graphics.clear();
    
    if (this.points.length < 2) return;
    
    const lineWidth = this.isMobile ? RESPONSIVE.MOBILE_LINE_WIDTH : RESPONSIVE.DESKTOP_LINE_WIDTH;
    
    // Flat shading: single pass, no multiple glow layers
    this.graphics.moveTo(this.points[0].x, this.points[0].y);
    
    // Draw trail in single pass with varying width
    for (let i = 1; i < this.points.length; i++) {
      const point = this.points[i];
      const prevPoint = this.points[i - 1];
      const progress = i / this.points.length;
      
      // Simple width taper
      const width = lineWidth * 2 * (0.5 + (1 - progress) * 0.5);
      
      // Flat color, single stroke
      this.graphics.moveTo(prevPoint.x, prevPoint.y);
      this.graphics.lineTo(point.x, point.y);
      this.graphics.stroke({ 
        width: width, 
        color: COLORS.TRAIL,
        alpha: point.alpha * 0.85 // Slightly reduced for flat look
      });
    }
    
    // Single subtle glow (optional, can be disabled for more performance)
    if (!this.isMobile) {
      this.graphics.moveTo(this.points[0].x, this.points[0].y);
      for (let i = 1; i < this.points.length; i++) {
        this.graphics.lineTo(this.points[i].x, this.points[i].y);
      }
      this.graphics.stroke({ 
        width: lineWidth * 2.5, 
        color: COLORS.TRAIL,
        alpha: 0.1 // Very subtle
      });
    }
  }

  /**
   * Clear trail
   */
  public clear(): void {
    this.points = [];
    this.intensity = 1.0;
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
