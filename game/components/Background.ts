/**
 * Background Component
 * Handles background rendering
 */

import { Graphics, Container } from 'pixi.js';
import { COLORS } from '../config/constants';

export class Background {
  private graphics: Graphics;

  constructor(private container: Container) {
    this.graphics = new Graphics();
    this.container.addChild(this.graphics);
  }

  /**
   * Draw background
   */
  public draw(width: number, height: number): void {
    this.graphics.clear();
    this.graphics.rect(0, 0, width, height);
    this.graphics.fill({ color: COLORS.BG_START, alpha: 1 });
  }

  /**
   * Destroy background
   */
  public destroy(): void {
    this.graphics.destroy();
  }
}

