/**
 * Scene Manager
 * Handles PixiJS application initialization and lifecycle
 */

import { Application } from 'pixi.js';
import { RESPONSIVE, COLORS } from '../config/constants';

export class SceneManager {
  private app: Application | null = null;
  private isInitialized: boolean = false;
  private isDestroyed: boolean = false;
  private isMobile: boolean = false;
  private quality: number = 1;
  private width: number = 0;
  private height: number = 0;

  constructor(private container: HTMLDivElement) {
    if (!container) throw new Error('Container required');
    
    const rect = container.getBoundingClientRect();
    this.width = Math.max(rect.width || 800, 400);
    this.height = Math.max(rect.height || 600, 300);
    
    this.isMobile = this.width < RESPONSIVE.MOBILE_BREAKPOINT || window.innerWidth < RESPONSIVE.MOBILE_BREAKPOINT;
    this.quality = this.isMobile ? RESPONSIVE.MOBILE_QUALITY : RESPONSIVE.DESKTOP_QUALITY;
  }

  /**
   * Initialize PixiJS application
   */
  public async init(): Promise<void> {
    if (this.isInitialized || this.isDestroyed) return;

    try {
      const rect = this.container.getBoundingClientRect();
      this.width = Math.max(rect.width || 800, 400);
      this.height = Math.max(rect.height || 600, 300);
      
      this.isMobile = this.width < RESPONSIVE.MOBILE_BREAKPOINT || window.innerWidth < RESPONSIVE.MOBILE_BREAKPOINT;
      this.quality = this.isMobile ? RESPONSIVE.MOBILE_QUALITY : RESPONSIVE.DESKTOP_QUALITY;

      this.app = new Application();
      await this.app.init({
        width: this.width,
        height: this.height,
        background: COLORS.BG_END,
        antialias: !this.isMobile,
        resolution: this.quality,
        autoDensity: true,
        powerPreference: 'high-performance',
      });

      if (this.isDestroyed) {
        this.destroy();
        return;
      }

      // Style canvas
      const canvas = this.app.canvas as HTMLCanvasElement;
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      canvas.style.display = 'block';
      canvas.style.position = 'absolute';
      canvas.style.top = '0';
      canvas.style.left = '0';
      canvas.style.pointerEvents = 'none';

      this.container.appendChild(canvas);
      this.isInitialized = true;
    } catch (error) {
      console.error('SceneManager init failed', error);
      this.destroy();
      throw error;
    }
  }

  /**
   * Get PixiJS application
   */
  public getApp(): Application | null {
    return this.app;
  }

  /**
   * Resize application
   */
  public resize(width: number, height: number): void {
    this.width = Math.max(width, 400);
    this.height = Math.max(height, 300);
    
    const wasMobile = this.isMobile;
    this.isMobile = this.width < RESPONSIVE.MOBILE_BREAKPOINT || window.innerWidth < RESPONSIVE.MOBILE_BREAKPOINT;
    this.quality = this.isMobile ? RESPONSIVE.MOBILE_QUALITY : RESPONSIVE.DESKTOP_QUALITY;
    
    if (wasMobile !== this.isMobile && this.app?.renderer) {
      this.app.renderer.resolution = this.quality;
    }

    if (this.app?.renderer) {
      this.app.renderer.resize(this.width, this.height);
    }
  }

  /**
   * Get dimensions
   */
  public getDimensions(): { width: number; height: number; isMobile: boolean; quality: number } {
    return {
      width: this.width,
      height: this.height,
      isMobile: this.isMobile,
      quality: this.quality
    };
  }

  /**
   * Check if initialized
   */
  public isReady(): boolean {
    return this.isInitialized && !this.isDestroyed && this.app !== null;
  }

  /**
   * Destroy application
   */
  public destroy(): void {
    if (this.isDestroyed) return;
    this.isDestroyed = true;
    this.isInitialized = false;

    if (this.app) {
      try {
        if (this.app.renderer && this.app.stage) {
          this.app.destroy({ removeView: true }, { children: true });
        }
      } catch (e) {
        console.warn('SceneManager destroy error', e);
      } finally {
        this.app = null;
      }
    }
  }
}

