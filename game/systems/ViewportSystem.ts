/**
 * Viewport System
 * Manages viewport scaling and window adjustments
 */

import { Viewport, SceneDimensions } from '../types';

export class ViewportSystem {
  private viewport: Viewport;

  constructor() {
    this.viewport = {
      scaleX: 1,
      scaleY: 1,
      maxTimeWindow: 10,
      maxMultWindow: 2.0,
    };
  }

  /**
   * Update viewport based on elapsed time and multiplier
   */
  public update(elapsedSeconds: number, multiplier: number, dimensions: SceneDimensions): void {
    // Expand time window if needed
    if (elapsedSeconds > this.viewport.maxTimeWindow * 0.8) {
      this.viewport.maxTimeWindow = Math.max(elapsedSeconds / 0.8, 10);
    }
    
    // Expand multiplier window if needed
    if (multiplier > this.viewport.maxMultWindow * 0.8) {
      this.viewport.maxMultWindow = Math.max(multiplier / 0.8, 2.0);
    }

    // Calculate scaling factors
    const availWidth = Math.max(dimensions.width - dimensions.paddingLeft, 100);
    const availHeight = Math.max(dimensions.height - dimensions.paddingBottom, 100);

    this.viewport.scaleX = availWidth / Math.max(this.viewport.maxTimeWindow, 0.1);
    this.viewport.scaleY = availHeight / Math.max(this.viewport.maxMultWindow - 1, 0.1);
  }

  /**
   * Reset viewport to initial state
   */
  public reset(): void {
    this.viewport.maxTimeWindow = 10;
    this.viewport.maxMultWindow = 2.0;
  }

  /**
   * Get current viewport
   */
  public getViewport(): Viewport {
    return { ...this.viewport };
  }

  /**
   * Calculate screen position from game coordinates
   */
  public toScreen(t: number, m: number, originX: number, originY: number): { x: number; y: number } {
    return {
      x: originX + (t * this.viewport.scaleX),
      y: originY - ((m - 1) * this.viewport.scaleY)
    };
  }
}

