/**
 * Curve Component
 * Handles curve path rendering
 */

import { Graphics, Container } from 'pixi.js';
import { COLORS, RESPONSIVE } from '../config/constants';
import { CurvePoint, SceneDimensions, Viewport } from '../types';

export class Curve {
  private curveGraphics: Graphics;
  private areaGraphics: Graphics;
  private curvePoints: CurvePoint[] = [];

  constructor(private container: Container) {
    this.curveGraphics = new Graphics();
    this.areaGraphics = new Graphics();
    this.container.addChild(this.areaGraphics);
    this.container.addChild(this.curveGraphics);
  }

  /**
   * Add curve point
   */
  public addPoint(point: CurvePoint): void {
    this.curvePoints.push(point);
  }

  /**
   * Clear all points
   */
  public clear(): void {
    this.curvePoints = [{ t: 0, m: 1.0 }];
  }

  /**
   * Get curve points
   */
  public getPoints(): CurvePoint[] {
    return [...this.curvePoints];
  }

  /**
   * Draw curve
   */
  public draw(
    viewport: Viewport,
    dimensions: SceneDimensions,
    planeX: number,
    planeY: number,
    elapsedSeconds: number,
    isMobile: boolean
  ): void {
    this.curveGraphics.clear();
    this.areaGraphics.clear();

    if (this.curvePoints.length === 0) {
      this.curvePoints = [{ t: 0, m: 1.0 }];
    }

    const originX = dimensions.paddingLeft;
    const originY = dimensions.height - dimensions.paddingBottom;
    const lineWidth = isMobile ? RESPONSIVE.MOBILE_LINE_WIDTH : RESPONSIVE.DESKTOP_LINE_WIDTH;

    // Draw area fill
    this.areaGraphics.moveTo(originX, originY);
    for (const point of this.curvePoints) {
      const x = originX + (point.t * viewport.scaleX);
      const y = originY - ((point.m - 1) * viewport.scaleY);
      this.areaGraphics.lineTo(x, y);
    }
    
    this.areaGraphics.lineTo(planeX, planeY);
    
    const endX = originX + (elapsedSeconds * viewport.scaleX);
    this.areaGraphics.lineTo(endX, originY);
    this.areaGraphics.lineTo(originX, originY);
    this.areaGraphics.closePath();
    
    this.areaGraphics.fill({ color: COLORS.AREA_START, alpha: 0.15 });

    // Draw curve line
    this.curveGraphics.moveTo(originX, originY);
    for (const point of this.curvePoints) {
      const x = originX + (point.t * viewport.scaleX);
      const y = originY - ((point.m - 1) * viewport.scaleY);
      this.curveGraphics.lineTo(x, y);
    }
    
    this.curveGraphics.lineTo(planeX, planeY);
    
    // Outer glow
    this.curveGraphics.stroke({ 
      width: lineWidth + 4, 
      color: COLORS.CURVE_START, 
      alpha: 0.2 
    });
    
    // Main line
    this.curveGraphics.stroke({ 
      width: lineWidth, 
      color: COLORS.CURVE_END 
    });
  }

  /**
   * Destroy curve
   */
  public destroy(): void {
    this.curveGraphics.destroy();
    this.areaGraphics.destroy();
  }
}

