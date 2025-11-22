/**
 * Flash Effect - Premium Edition
 * Handles premium multi-color flash effects
 */

import { Graphics, Container } from 'pixi.js';
import { COLORS } from '../config/constants';
import { easeOutCubic } from '../utils/MathUtils';

export class FlashEffect {
  private graphics: Graphics;
  private alpha: number = 0;
  private colorPhase: number = 0; // 0 = white, 1 = blue
  private duration: number = 0.3; // seconds
  private elapsedTime: number = 0;

  constructor(private container: Container, private width: number, private height: number) {
    this.graphics = new Graphics();
    this.container.addChild(this.graphics);
  }

  /**
   * Trigger premium flash with color transition
   */
  public trigger(): void {
    this.alpha = 1.0;
    this.colorPhase = 0;
    this.elapsedTime = 0;
  }

  /**
   * Update flash with smooth color transition
   */
  public update(deltaTime: number): void {
    if (this.alpha > 0) {
      this.elapsedTime += deltaTime;
      const progress = Math.min(this.elapsedTime / this.duration, 1.0);
      
      // Color transition: white -> blue -> transparent
      if (progress < 0.3) {
        this.colorPhase = progress / 0.3; // 0 to 1
        this.alpha = 1.0 - easeOutCubic(progress / 0.3) * 0.5;
      } else {
        this.colorPhase = 1.0 - ((progress - 0.3) / 0.7);
        this.alpha = (1.0 - easeOutCubic((progress - 0.3) / 0.7)) * 0.5;
      }
      
      if (progress >= 1.0) {
        this.alpha = 0;
      }
    }
  }

  /**
   * Render flash with color blending
   */
  public render(): void {
    this.graphics.clear();
    
    if (this.alpha > 0) {
      // Blend white and blue based on phase
      const whiteIntensity = 1.0 - this.colorPhase;
      const blueIntensity = this.colorPhase;
      
      // White flash layer
      if (whiteIntensity > 0.1) {
        this.graphics.rect(0, 0, this.width, this.height);
        this.graphics.fill({ 
          color: COLORS.FLASH,
          alpha: this.alpha * whiteIntensity * 0.4
        });
      }
      
      // Blue flash layer
      if (blueIntensity > 0.1) {
        this.graphics.rect(0, 0, this.width, this.height);
        this.graphics.fill({ 
          color: COLORS.FLASH_COLD,
          alpha: this.alpha * blueIntensity * 0.25
        });
      }
    }
  }

  /**
   * Destroy effect
   */
  public destroy(): void {
    this.graphics.destroy();
  }
}
