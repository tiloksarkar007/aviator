/**
 * Flash Effect
 * Handles screen flash effect
 */

import { Graphics, Container } from 'pixi.js';
import { COLORS } from '../config/constants';

export class FlashEffect {
  private graphics: Graphics;
  private alpha: number = 0;

  constructor(private container: Container, private width: number, private height: number) {
    this.graphics = new Graphics();
    this.container.addChild(this.graphics);
  }

  /**
   * Trigger flash
   */
  public trigger(): void {
    this.alpha = 1.0;
  }

  /**
   * Update flash
   */
  public update(deltaTime: number): void {
    if (this.alpha > 0) {
      this.alpha = Math.max(0, this.alpha - deltaTime * 5);
    }
  }

  /**
   * Render flash
   */
  public render(): void {
    this.graphics.clear();
    
    if (this.alpha > 0) {
      this.graphics.rect(0, 0, this.width, this.height);
      this.graphics.fill({ 
        color: COLORS.FLASH,
        alpha: this.alpha * 0.3
      });
    }
  }

  /**
   * Destroy effect
   */
  public destroy(): void {
    this.graphics.destroy();
  }
}

