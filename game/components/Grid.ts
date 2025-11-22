/**
 * Grid Component
 * Handles grid overlay rendering
 */

import { Graphics, Container } from 'pixi.js';
import { COLORS, RESPONSIVE } from '../config/constants';

export class Grid {
  private graphics: Graphics;

  constructor(private container: Container) {
    this.graphics = new Graphics();
    this.container.addChild(this.graphics);
  }

  /**
   * Draw grid overlay
   */
  public draw(
    width: number, 
    height: number, 
    originX: number, 
    originY: number, 
    isMobile: boolean
  ): void {
    this.graphics.clear();
    
    const gridSpacing = isMobile ? RESPONSIVE.MOBILE_GRID_SPACING : RESPONSIVE.DESKTOP_GRID_SPACING;
    const majorLineEvery = 3;
    const availWidth = width - originX;
    const availHeight = height - originY;
    
    // Vertical lines
    for (let i = 0; i <= Math.ceil(availWidth / gridSpacing); i++) {
      const x = originX + (i * gridSpacing);
      const isMajor = i % majorLineEvery === 0;
      
      this.graphics.moveTo(x, 0);
      this.graphics.lineTo(x, height);
      this.graphics.stroke({ 
        width: isMajor ? 1 : 0.5, 
        color: isMajor ? COLORS.GRID_MAJOR : COLORS.GRID,
        alpha: isMajor ? 0.3 : 0.15
      });
    }
    
    // Horizontal lines
    for (let i = 0; i <= Math.ceil(availHeight / gridSpacing); i++) {
      const y = originY - (i * gridSpacing);
      const isMajor = i % majorLineEvery === 0;
      
      this.graphics.moveTo(originX, y);
      this.graphics.lineTo(width, y);
      this.graphics.stroke({ 
        width: isMajor ? 1 : 0.5, 
        color: isMajor ? COLORS.GRID_MAJOR : COLORS.GRID,
        alpha: isMajor ? 0.3 : 0.15
      });
    }
  }

  /**
   * Destroy grid
   */
  public destroy(): void {
    this.graphics.destroy();
  }
}

