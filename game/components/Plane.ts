/**
 * Plane Component
 * Handles plane rendering and animation
 */

import { Sprite, Graphics, Container, Texture, Assets } from 'pixi.js';
import { COLORS, RESPONSIVE } from '../config/constants';
import { PlaneState, SceneDimensions } from '../types';
import { expSmooth } from '../utils/MathUtils';

export class Plane {
  private sprite: Sprite | null = null;
  private graphics: Graphics | null = null;
  private baseScale: number = 1.0;
  private state: PlaneState;

  constructor(
    private container: Container,
    private dimensions: SceneDimensions,
    private isMobile: boolean
  ) {
    this.state = {
      x: dimensions.paddingLeft,
      y: dimensions.height - dimensions.paddingBottom,
      rotation: -0.1,
      rotationTarget: -0.1,
      scale: 1.0,
      alpha: 1.0,
    };
  }

  /**
   * Load plane sprite
   */
  public async loadSprite(): Promise<boolean> {
    try {
      let texture: Texture | null = null;
      
      if (!Assets.cache.has('plane')) {
        Assets.add({ alias: 'plane', src: '/plane.png' });
      }
      texture = await Assets.load('plane');
      
      if (!texture) {
        texture = Texture.from('/plane.png');
      }
      
      if (texture) {
        this.sprite = new Sprite(texture);
        this.sprite.anchor.set(0.5, 0.5);
        
        const planeSize = this.isMobile ? RESPONSIVE.MOBILE_PLANE_SIZE : RESPONSIVE.DESKTOP_PLANE_SIZE;
        this.baseScale = planeSize / Math.max(texture.width, texture.height);
        this.sprite.scale.set(this.baseScale);
        
        this.sprite.visible = true;
        this.sprite.alpha = 1;
        this.container.addChild(this.sprite);
        return true;
      }
    } catch (error) {
      console.warn('Failed to load plane sprite', error);
    }
    
    return false;
  }

  /**
   * Create fallback graphics plane
   */
  public createGraphics(): void {
    this.graphics = new Graphics();
    this.drawGraphics();
    this.graphics.visible = true;
    this.graphics.alpha = 1;
    this.container.addChild(this.graphics);
  }

  /**
   * Draw graphics plane
   */
  private drawGraphics(): void {
    if (!this.graphics) return;
    
    this.graphics.clear();
    const planeSize = this.isMobile ? RESPONSIVE.MOBILE_PLANE_SIZE : RESPONSIVE.DESKTOP_PLANE_SIZE;
    const size = planeSize * this.state.scale;
    
    // Outer glow
    this.graphics.circle(0, 0, size * 0.7);
    this.graphics.fill({ color: COLORS.GLOW, alpha: 0.15 });
    
    this.graphics.circle(0, 0, size * 0.5);
    this.graphics.fill({ color: COLORS.GLOW, alpha: 0.25 });
    
    // Body
    this.graphics.rect(-size * 0.4, -size * 0.15, size * 0.8, size * 0.3);
    this.graphics.fill({ color: COLORS.CURVE_START });
    
    // Body highlight
    this.graphics.rect(-size * 0.4, -size * 0.15, size * 0.8, size * 0.1);
    this.graphics.fill({ color: 0xffffff, alpha: 0.2 });
    
    // Cockpit
    this.graphics.moveTo(-size * 0.3, -size * 0.15);
    this.graphics.lineTo(0, -size * 0.4);
    this.graphics.lineTo(size * 0.3, -size * 0.15);
    this.graphics.closePath();
    this.graphics.fill({ color: COLORS.CURVE_START });

    // Window
    this.graphics.circle(size * 0.15, 0, size * 0.12);
    this.graphics.fill({ color: 0xffffff, alpha: 0.3 });
    
    this.graphics.circle(size * 0.15, 0, size * 0.08);
    this.graphics.fill({ color: 0x38bdf8 });
    
    // Accent lines
    this.graphics.moveTo(-size * 0.2, size * 0.1);
    this.graphics.lineTo(size * 0.2, size * 0.1);
    this.graphics.stroke({ width: 2, color: 0xffffff, alpha: 0.3 });
  }

  /**
   * Update plane position and rotation
   */
  public update(x: number, y: number, rotation: number, scale: number, alpha: number, deltaTime: number): void {
    // Smooth position interpolation
    const smoothFactor = expSmooth(15, deltaTime);
    this.state.x += (x - this.state.x) * smoothFactor;
    this.state.y += (y - this.state.y) * smoothFactor;
    
    // Smooth rotation interpolation
    this.state.rotationTarget = rotation;
    const rotationSmooth = expSmooth(10, deltaTime);
    this.state.rotation += (this.state.rotationTarget - this.state.rotation) * rotationSmooth;
    
    this.state.scale = scale;
    this.state.alpha = alpha;
    
    // Apply to sprite or graphics
    if (this.sprite) {
      this.sprite.position.set(this.state.x, this.state.y);
      this.sprite.rotation = this.state.rotation;
      this.sprite.scale.set(this.baseScale * this.state.scale);
      this.sprite.alpha = this.state.alpha;
    } else if (this.graphics) {
      this.graphics.position.set(this.state.x, this.state.y);
      this.graphics.alpha = this.state.alpha;
      this.drawGraphics();
    }
  }

  /**
   * Get current position
   */
  public getPosition(): { x: number; y: number } {
    return { x: this.state.x, y: this.state.y };
  }

  /**
   * Get current rotation
   */
  public getRotation(): number {
    return this.state.rotation;
  }

  /**
   * Set visible
   */
  public setVisible(visible: boolean): void {
    if (this.sprite) this.sprite.visible = visible;
    if (this.graphics) this.graphics.visible = visible;
  }

  /**
   * Reset to initial position
   */
  public reset(): void {
    this.state.x = this.dimensions.paddingLeft;
    this.state.y = this.dimensions.height - this.dimensions.paddingBottom;
    this.state.rotation = -0.1;
    this.state.rotationTarget = -0.1;
    this.state.scale = 1.0;
    this.state.alpha = 1.0;
  }

  /**
   * Destroy plane
   */
  public destroy(): void {
    if (this.sprite) {
      this.sprite.destroy();
      this.sprite = null;
    }
    if (this.graphics) {
      this.graphics.destroy();
      this.graphics = null;
    }
  }
}

