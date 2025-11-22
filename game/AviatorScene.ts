import { Application, Container, Sprite, Graphics, Ticker, Texture, Assets } from 'pixi.js';
import { GameState } from '../types';

/**
 * AviatorScene - Premium, Modern, Performance-Optimized
 * Features:
 * - Modern futuristic aesthetics with gradients and glows
 * - Mobile-first performance optimization
 * - Responsive design with adaptive quality
 * - Smooth animations and premium visual effects
 */
export class AviatorScene {
  private app: Application | null = null;
  private container: HTMLDivElement;
  
  // Display objects - layered for proper rendering
  private stage: Container;
  private backgroundLayer: Container;
  private gridLayer: Container;
  private curveLayer: Container;
  private effectsLayer: Container;
  private planeLayer: Container;
  
  private planeSprite: Sprite | null = null;
  private planeGraphics: Graphics | null = null;
  private planeSpriteBaseScale: number = 1.0;
  private curveGraphics: Graphics;
  private areaGraphics: Graphics;
  private gridGraphics: Graphics;
  private trailGraphics: Graphics;
  private explosionGraphics: Graphics;
  private flashGraphics: Graphics;
  
  // State
  private width: number = 0;
  private height: number = 0;
  private currentState: GameState = GameState.IDLE;
  private currentMultiplier: number = 1.0;
  private elapsedSeconds: number = 0;
  private curvePoints: Array<{ t: number; m: number }> = [];
  private trailPoints: Array<{ x: number; y: number; alpha: number }> = [];
  private exhaustParticles: Array<{ x: number; y: number; vx: number; vy: number; life: number; maxLife: number }> = [];
  private explosionParticles: Array<{ x: number; y: number; vx: number; vy: number; life: number; maxLife: number; size: number; color: number }> = [];
  
  // Animation state
  private planeScale: number = 1.0;
  private planeRotationTarget: number = -0.1;
  private planeRotationCurrent: number = -0.1;
  private flightTime: number = 0;
  
  // Fly-away animation state
  private flyAwayStartX: number = 0;
  private flyAwayStartY: number = 0;
  private flyAwayTime: number = 0;
  private flyAwayDuration: number = 1.5; // seconds
  private isFlyingAway: boolean = false;
  private crashFlashAlpha: number = 0;
  
  // Viewport
  private scaleX: number = 1;
  private scaleY: number = 1;
  private maxTimeWindow: number = 10;
  private maxMultWindow: number = 2.0;
  
  // Performance & Quality
  private isInitialized: boolean = false;
  private isDestroyed: boolean = false;
  private isMobile: boolean = false;
  private quality: number = 1; // 0.5 for mobile, 1 for desktop
  private frameSkip: number = 0; // Skip frames on mobile for performance
  
  // Responsive constants
  private get PADDING_LEFT(): number {
    return this.isMobile ? 40 : 60;
  }
  
  private get PADDING_BOTTOM(): number {
    return this.isMobile ? 40 : 60;
  }
  
  private get PLANE_SIZE(): number {
    return this.isMobile ? 72 : 90; // 1.5x increased size
  }
  
  private get LINE_WIDTH(): number {
    return this.isMobile ? 2.5 : 3.5;
  }
  
  // Modern color palette
  private readonly COLORS = {
    BG_START: 0x0a0e1a,
    BG_END: 0x0f172a,
    CURVE_START: 0xff006e,
    CURVE_END: 0xe11d48,
    AREA_START: 0xff006e,
    AREA_END: 0xe11d48,
    GRID: 0x1e293b,
    GRID_MAJOR: 0x334155,
    GLOW: 0xff006e,
    TRAIL: 0xff006e,
    EXPLOSION: 0xff6b00,
    EXPLOSION_FIRE: 0xffaa00,
    FLASH: 0xffffff,
  };

  constructor(container: HTMLDivElement) {
    if (!container) throw new Error('Container required');
    this.container = container;
    
    const rect = container.getBoundingClientRect();
    this.width = Math.max(rect.width || 800, 400);
    this.height = Math.max(rect.height || 600, 300);
    
    // Detect mobile
    this.isMobile = this.width < 768 || window.innerWidth < 768;
    this.quality = this.isMobile ? 0.5 : 1;

    // Initialize layered containers
    this.stage = new Container();
    this.backgroundLayer = new Container();
    this.gridLayer = new Container();
    this.curveLayer = new Container();
    this.effectsLayer = new Container();
    this.planeLayer = new Container();
    
    // Layer order (bottom to top)
    this.stage.addChild(this.backgroundLayer);
    this.stage.addChild(this.gridLayer);
    this.stage.addChild(this.curveLayer);
    this.stage.addChild(this.effectsLayer);
    this.stage.addChild(this.planeLayer);
    
    // Initialize graphics
    this.curveGraphics = new Graphics();
    this.areaGraphics = new Graphics();
    this.gridGraphics = new Graphics();
    this.trailGraphics = new Graphics();
    this.explosionGraphics = new Graphics();
    this.flashGraphics = new Graphics();
    
    this.curveLayer.addChild(this.areaGraphics);
    this.curveLayer.addChild(this.curveGraphics);
    this.gridLayer.addChild(this.gridGraphics);
    this.effectsLayer.addChild(this.trailGraphics);
    this.effectsLayer.addChild(this.explosionGraphics);
    this.effectsLayer.addChild(this.flashGraphics);
  }

  public async init(): Promise<void> {
    if (this.isInitialized || this.isDestroyed) return;

    try {
      const rect = this.container.getBoundingClientRect();
      this.width = Math.max(rect.width || 800, 400);
      this.height = Math.max(rect.height || 600, 300);
      
      // Re-detect mobile on init
      this.isMobile = this.width < 768 || window.innerWidth < 768;
      this.quality = this.isMobile ? 0.5 : 1;

      // Create PixiJS app with performance settings
      this.app = new Application();
      await this.app.init({
        width: this.width,
        height: this.height,
        background: this.COLORS.BG_END,
        antialias: !this.isMobile, // Disable antialiasing on mobile for performance
        resolution: this.quality,
        autoDensity: true,
        powerPreference: 'high-performance',
      });

      if (this.isDestroyed) {
        this.safeDestroyApp();
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
      this.app.stage.addChild(this.stage);

      // Draw background gradient
      this.drawBackground();
      
      // Draw grid
      this.drawGrid();
      
      // Create plane
      await this.createPlane();
      
      // Initialize scene
      this.resetScene();

      // Start ticker
      if (this.app.ticker) {
        this.app.ticker.add(this.tickerLoop);
      }

      this.isInitialized = true;
      
      // Force initial render
      if (this.app.renderer) {
        this.app.renderer.render(this.app.stage);
      }
    } catch (error) {
      console.error('Init failed', error);
      this.safeDestroyApp();
      throw error;
    }
  }

  private drawBackground(): void {
    const bg = new Graphics();
    bg.rect(0, 0, this.width, this.height);
    bg.fill({ 
      color: this.COLORS.BG_START,
      alpha: 1 
    });
    this.backgroundLayer.addChild(bg);
  }

  private drawGrid(): void {
    if (!this.gridGraphics) return;
    
    this.gridGraphics.clear();
    
    const originX = this.PADDING_LEFT;
    const originY = this.height - this.PADDING_BOTTOM;
    const availWidth = this.width - this.PADDING_LEFT;
    const availHeight = this.height - this.PADDING_BOTTOM;
    
    const gridSpacing = this.isMobile ? 40 : 60;
    const majorLineEvery = 3;
    
    // Vertical lines (time axis)
    for (let i = 0; i <= Math.ceil(availWidth / gridSpacing); i++) {
      const x = originX + (i * gridSpacing);
      const isMajor = i % majorLineEvery === 0;
      
      this.gridGraphics.moveTo(x, 0);
      this.gridGraphics.lineTo(x, this.height);
      this.gridGraphics.stroke({ 
        width: isMajor ? 1 : 0.5, 
        color: isMajor ? this.COLORS.GRID_MAJOR : this.COLORS.GRID,
        alpha: isMajor ? 0.3 : 0.15
      });
    }
    
    // Horizontal lines (multiplier axis)
    for (let i = 0; i <= Math.ceil(availHeight / gridSpacing); i++) {
      const y = originY - (i * gridSpacing);
      const isMajor = i % majorLineEvery === 0;
      
      this.gridGraphics.moveTo(originX, y);
      this.gridGraphics.lineTo(this.width, y);
      this.gridGraphics.stroke({ 
        width: isMajor ? 1 : 0.5, 
        color: isMajor ? this.COLORS.GRID_MAJOR : this.COLORS.GRID,
        alpha: isMajor ? 0.3 : 0.15
      });
    }
  }

  private async createPlane(): Promise<void> {
    try {
      const texture = await this.loadTexture();
      if (texture) {
        this.planeSprite = new Sprite(texture);
        this.planeSprite.anchor.set(0.5, 0.5);
        
        // Store base scale for pulse effect
        this.planeSpriteBaseScale = this.PLANE_SIZE / Math.max(texture.width, texture.height);
        this.planeSprite.scale.set(this.planeSpriteBaseScale);
        
        this.planeSprite.visible = true;
        this.planeSprite.alpha = 1;
        this.planeLayer.addChild(this.planeSprite);
        return;
      }
    } catch (error) {
      console.warn('Sprite failed, using graphics fallback', error);
    }

    // Fallback: Premium graphics plane
    this.planeGraphics = new Graphics();
    this.drawPlaneGraphics();
    this.planeGraphics.visible = true;
    this.planeGraphics.alpha = 1;
    this.planeLayer.addChild(this.planeGraphics);
  }

  private drawPlaneGraphics(): void {
    if (!this.planeGraphics) return;
    
    this.planeGraphics.clear();
    
    const size = this.PLANE_SIZE * this.planeScale;
    
    // Outer glow (premium effect)
    this.planeGraphics.circle(0, 0, size * 0.7);
    this.planeGraphics.fill({ color: this.COLORS.GLOW, alpha: 0.15 });
    
    this.planeGraphics.circle(0, 0, size * 0.5);
    this.planeGraphics.fill({ color: this.COLORS.GLOW, alpha: 0.25 });
    
    // Body with gradient effect (simulated)
    this.planeGraphics.rect(-size * 0.4, -size * 0.15, size * 0.8, size * 0.3);
    this.planeGraphics.fill({ color: this.COLORS.CURVE_START });
    
    // Body highlight
    this.planeGraphics.rect(-size * 0.4, -size * 0.15, size * 0.8, size * 0.1);
    this.planeGraphics.fill({ color: 0xffffff, alpha: 0.2 });
    
    // Cockpit
    this.planeGraphics.moveTo(-size * 0.3, -size * 0.15);
    this.planeGraphics.lineTo(0, -size * 0.4);
    this.planeGraphics.lineTo(size * 0.3, -size * 0.15);
    this.planeGraphics.closePath();
    this.planeGraphics.fill({ color: this.COLORS.CURVE_START });

    // Window with glow
    this.planeGraphics.circle(size * 0.15, 0, size * 0.12);
    this.planeGraphics.fill({ color: 0xffffff, alpha: 0.3 });
    
    this.planeGraphics.circle(size * 0.15, 0, size * 0.08);
    this.planeGraphics.fill({ color: 0x38bdf8 });
    
    // Accent lines
    this.planeGraphics.moveTo(-size * 0.2, size * 0.1);
    this.planeGraphics.lineTo(size * 0.2, size * 0.1);
    this.planeGraphics.stroke({ width: 2, color: 0xffffff, alpha: 0.3 });
  }

  private async loadTexture(): Promise<Texture | null> {
    try {
      if (!Assets.cache.has('plane')) {
        Assets.add({ alias: 'plane', src: '/plane.png' });
      }
      return await Assets.load('plane');
    } catch {
      try {
        return Texture.from('/plane.png');
      } catch {
        return null;
      }
    }
  }

  private tickerLoop = (ticker: Ticker): void => {
    if (!this.app || this.isDestroyed || !this.isInitialized) return;

    const plane = this.planeSprite || this.planeGraphics;
    if (!plane) return;

    // Frame skipping for mobile performance
    this.frameSkip++;
    const shouldUpdate = !this.isMobile || this.frameSkip % 2 === 0;
    if (!shouldUpdate && this.currentState !== GameState.FLYING) {
      return;
    }
    if (this.frameSkip > 1000) this.frameSkip = 0;

    // Update based on state
    if (this.currentState === GameState.FLYING) {
      // Always ensure plane is visible during flight
      plane.visible = true;
      plane.alpha = 1;
      this.updateFlight(ticker);
    } else if (this.currentState === GameState.CRASHED && this.isFlyingAway) {
      // Keep plane visible during fly-away animation
      plane.visible = true;
      this.updateFlyAway(ticker);
    } else if (this.currentState === GameState.BETTING) {
      // Always ensure plane is visible during betting
      plane.visible = true;
      plane.alpha = 1;
      this.updateBetting(ticker);
    } else {
      // Always ensure plane is visible during idle
      plane.visible = true;
      plane.alpha = 1;
      this.updateIdle();
    }
  };

  private updateFlight(ticker: Ticker): void {
    const originX = this.PADDING_LEFT;
    const originY = this.height - this.PADDING_BOTTOM;
    
    this.updateViewport();
    this.flightTime += ticker.deltaMS / 1000;
    
    const planeX = originX + (this.elapsedSeconds * this.scaleX);
    const planeY = originY - ((this.currentMultiplier - 1) * this.scaleY);
    
    const plane = this.planeSprite || this.planeGraphics;
    if (plane) {
      // Smooth position with slight easing
      const currentX = plane.x || planeX;
      const currentY = plane.y || planeY;
      const smoothFactor = 0.15;
      plane.position.set(
        currentX + (planeX - currentX) * smoothFactor,
        currentY + (planeY - currentY) * smoothFactor
      );
      
      // Premium rotation with smooth interpolation
      if (this.curvePoints.length > 1) {
        const prev = this.curvePoints[this.curvePoints.length - 2];
        const dx = (this.elapsedSeconds - prev.t) * this.scaleX;
        const dy = -((this.currentMultiplier - prev.m) * this.scaleY);
        this.planeRotationTarget = Math.atan2(dy, dx) * 0.75;
      } else {
        this.planeRotationTarget = -0.1;
      }
      
      // Smooth rotation interpolation
      const rotationDiff = this.planeRotationTarget - this.planeRotationCurrent;
      this.planeRotationCurrent += rotationDiff * 0.1;
      
      if (this.planeSprite) {
        this.planeSprite.rotation = this.planeRotationCurrent;
      } else if (this.planeGraphics) {
        // For graphics, we'd need to redraw, but rotation is less critical
      }
      
      // Premium scale pulsing effect (subtle breathing)
      const pulseSpeed = 2;
      const pulseAmount = 0.03;
      this.planeScale = 1.0 + Math.sin(this.flightTime * pulseSpeed) * pulseAmount;
      
      if (this.planeSprite) {
        this.planeSprite.scale.set(this.planeSpriteBaseScale * this.planeScale);
      }
    }
    
    // Update exhaust particles
    this.updateExhaustParticles(planeX, planeY);
    
    // Update trail
    this.updateTrail(planeX, planeY);
    
    // Draw curve (optimized - only when needed)
    if (this.frameSkip % (this.isMobile ? 2 : 1) === 0) {
      this.drawCurve();
    }
  }

  private updateBetting(ticker: Ticker): void {
    const originX = this.PADDING_LEFT;
    const originY = this.height - this.PADDING_BOTTOM;
    const hoverY = originY + Math.sin(ticker.lastTime * 0.001) * 3;
    
    const plane = this.planeSprite || this.planeGraphics;
    if (plane) {
      plane.position.set(originX, hoverY);
      if (this.planeSprite) {
        this.planeSprite.rotation = -0.1;
      }
    }
    
    this.drawCurve();
  }

  private updateIdle(): void {
    const originX = this.PADDING_LEFT;
    const originY = this.height - this.PADDING_BOTTOM;
    
    const plane = this.planeSprite || this.planeGraphics;
    if (plane) {
      plane.position.set(originX, originY);
      if (this.planeSprite) {
        this.planeSprite.rotation = -0.1;
      }
    }
    
    this.drawCurve();
  }

  private updateFlyAway(ticker: Ticker): void {
    this.flyAwayTime += ticker.deltaMS / 1000;
    const progress = Math.min(this.flyAwayTime / this.flyAwayDuration, 1.0);
    
    const plane = this.planeSprite || this.planeGraphics;
    if (!plane) return;

    // Easing function for smooth acceleration
    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
    const easedProgress = easeOutCubic(progress);

    // Calculate fly-away trajectory (up and to the right, dramatic angle)
    const angle = Math.PI / 4; // 45 degrees up-right
    const distance = Math.max(this.width, this.height) * 1.5;
    const targetX = this.flyAwayStartX + Math.cos(angle) * distance * easedProgress;
    const targetY = this.flyAwayStartY - Math.sin(angle) * distance * easedProgress;

    // Update position with smooth interpolation
    const currentX = plane.x || this.flyAwayStartX;
    const currentY = plane.y || this.flyAwayStartY;
    plane.position.set(
      currentX + (targetX - currentX) * 0.2,
      currentY + (targetY - currentY) * 0.2
    );

    // Dramatic rotation (spinning as it flies away)
    const rotationSpeed = Math.PI * 2; // Full rotation per second
    if (this.planeSprite) {
      this.planeSprite.rotation = this.planeRotationCurrent + (rotationSpeed * this.flyAwayTime * 0.5);
    }

    // Scale up as it flies away (zoom effect)
    const scaleMultiplier = 1.0 + (easedProgress * 0.5);
    if (this.planeSprite) {
      this.planeSprite.scale.set(this.planeSpriteBaseScale * scaleMultiplier);
    } else if (this.planeGraphics) {
      this.planeScale = scaleMultiplier;
      this.drawPlaneGraphics();
    }

    // Fade out
    plane.alpha = 1.0 - easedProgress;

    // Update explosion particles
    this.updateExplosionParticles(ticker);

    // Update flash effect
    this.updateCrashFlash(ticker);

    // Update trail (fade out)
    this.updateTrail(plane.x, plane.y);
    this.trailPoints.forEach(point => {
      point.alpha *= 0.95;
    });

    // Clean up when animation completes
    if (progress >= 1.0) {
      plane.visible = false;
      this.isFlyingAway = false;
      this.explosionParticles = [];
      this.trailPoints = [];
      this.explosionGraphics.clear();
      this.flashGraphics.clear();
    }
  }

  private createExplosion(x: number, y: number): void {
    const particleCount = this.isMobile ? 30 : 50;
    
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 0.5;
      const speed = 2 + Math.random() * 4;
      const life = 0.5 + Math.random() * 0.5;
      const size = 3 + Math.random() * 8;
      const color = Math.random() > 0.5 ? this.COLORS.EXPLOSION : this.COLORS.EXPLOSION_FIRE;
      
      this.explosionParticles.push({
        x: x + (Math.random() - 0.5) * 20,
        y: y + (Math.random() - 0.5) * 20,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: life,
        maxLife: life,
        size: size,
        color: color
      });
    }
  }

  private updateExplosionParticles(ticker: Ticker): void {
    // Update existing particles
    this.explosionParticles = this.explosionParticles.filter(particle => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vx *= 0.98; // Friction
      particle.vy *= 0.98;
      particle.vy += 0.1; // Gravity
      particle.life -= ticker.deltaMS / 1000;
      return particle.life > 0;
    });

    // Draw particles
    this.explosionGraphics.clear();
    for (const particle of this.explosionParticles) {
      const alpha = particle.life / particle.maxLife;
      const size = particle.size * alpha;
      
      this.explosionGraphics.circle(particle.x, particle.y, size);
      this.explosionGraphics.fill({ 
        color: particle.color,
        alpha: alpha * 0.8
      });
      
      // Outer glow
      this.explosionGraphics.circle(particle.x, particle.y, size * 1.5);
      this.explosionGraphics.fill({ 
        color: particle.color,
        alpha: alpha * 0.3
      });
    }
  }

  private updateCrashFlash(ticker: Ticker): void {
    // Flash effect on crash
    if (this.flyAwayTime < 0.1) {
      this.crashFlashAlpha = 1.0;
    } else {
      this.crashFlashAlpha = Math.max(0, this.crashFlashAlpha - ticker.deltaMS / 200);
    }

    this.flashGraphics.clear();
    if (this.crashFlashAlpha > 0) {
      this.flashGraphics.rect(0, 0, this.width, this.height);
      this.flashGraphics.fill({ 
        color: this.COLORS.FLASH,
        alpha: this.crashFlashAlpha * 0.3
      });
    }
  }

  private updateExhaustParticles(planeX: number, planeY: number): void {
    if (!this.planeSprite && !this.planeGraphics) return;
    
    const plane = this.planeSprite || this.planeGraphics;
    const rotation = this.planeRotationCurrent;
    
    // Calculate exhaust position (behind plane)
    const exhaustDistance = this.PLANE_SIZE * 0.8;
    const exhaustX = planeX - Math.cos(rotation) * exhaustDistance;
    const exhaustY = planeY - Math.sin(rotation) * exhaustDistance;
    
    // Add new particles
    const particlesPerFrame = this.isMobile ? 1 : 2;
    for (let i = 0; i < particlesPerFrame; i++) {
      const angle = rotation + (Math.PI) + (Math.random() - 0.5) * 0.5;
      const speed = 0.5 + Math.random() * 1.0;
      this.exhaustParticles.push({
        x: exhaustX + (Math.random() - 0.5) * 10,
        y: exhaustY + (Math.random() - 0.5) * 10,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1.0,
        maxLife: 0.3 + Math.random() * 0.4
      });
    }
    
    // Update and remove dead particles
    this.exhaustParticles = this.exhaustParticles.filter(particle => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.life -= (1 / 60) / particle.maxLife; // Assuming 60fps
      particle.vx *= 0.95; // Friction
      particle.vy *= 0.95;
      return particle.life > 0;
    });
    
    // Limit particle count for performance
    const maxParticles = this.isMobile ? 20 : 40;
    if (this.exhaustParticles.length > maxParticles) {
      this.exhaustParticles = this.exhaustParticles.slice(-maxParticles);
    }
  }

  private updateTrail(x: number, y: number): void {
    // Add new trail point
    this.trailPoints.push({ x, y, alpha: 1.0 });
    
    // Limit trail length for performance
    const maxTrailLength = this.isMobile ? 20 : 40;
    if (this.trailPoints.length > maxTrailLength) {
      this.trailPoints.shift();
    }
    
    // Fade trail points with smooth gradient
    this.trailPoints.forEach((point, i) => {
      const progress = i / this.trailPoints.length;
      point.alpha = (1 - progress) * 0.7;
    });
    
    // Draw trail with gradient effect
    this.trailGraphics.clear();
    if (this.trailPoints.length > 1) {
      // Draw exhaust particles
      for (const particle of this.exhaustParticles) {
        const size = this.PLANE_SIZE * 0.15 * particle.life;
        this.trailGraphics.circle(particle.x, particle.y, size);
        this.trailGraphics.fill({ 
          color: this.COLORS.TRAIL,
          alpha: particle.life * 0.4
        });
      }
      
      // Draw trail line with varying width
      this.trailGraphics.moveTo(this.trailPoints[0].x, this.trailPoints[0].y);
      for (let i = 1; i < this.trailPoints.length; i++) {
        const point = this.trailPoints[i];
        const progress = i / this.trailPoints.length;
        const width = this.LINE_WIDTH * 2 * (1 - progress * 0.5);
        this.trailGraphics.lineTo(point.x, point.y);
        this.trailGraphics.stroke({ 
          width: width, 
          color: this.COLORS.TRAIL,
          alpha: point.alpha
        });
        this.trailGraphics.moveTo(point.x, point.y);
      }
      
      // Glow effect
      this.trailGraphics.moveTo(this.trailPoints[0].x, this.trailPoints[0].y);
      for (let i = 1; i < this.trailPoints.length; i++) {
        const point = this.trailPoints[i];
        this.trailGraphics.lineTo(point.x, point.y);
      }
      this.trailGraphics.stroke({ 
        width: this.LINE_WIDTH * 3, 
        color: this.COLORS.TRAIL,
        alpha: 0.15
      });
    }
  }

  private drawCurve(): void {
    if (!this.curveGraphics || !this.areaGraphics) return;

    const originX = this.PADDING_LEFT;
    const originY = this.height - this.PADDING_BOTTOM;

    this.curveGraphics.clear();
    this.areaGraphics.clear();

    if (this.curvePoints.length === 0) {
      this.curvePoints = [{ t: 0, m: 1.0 }];
    }

    // Draw area fill with gradient effect (simulated)
    this.areaGraphics.moveTo(originX, originY);
    for (const point of this.curvePoints) {
      const x = originX + (point.t * this.scaleX);
      const y = originY - ((point.m - 1) * this.scaleY);
      this.areaGraphics.lineTo(x, y);
    }
    
    const plane = this.planeSprite || this.planeGraphics;
    if (plane) {
      this.areaGraphics.lineTo(plane.x, plane.y);
    }
    
    const endX = originX + (this.elapsedSeconds * this.scaleX);
    this.areaGraphics.lineTo(endX, originY);
    this.areaGraphics.lineTo(originX, originY);
    this.areaGraphics.closePath();
    
    // Gradient fill (simulated with alpha gradient)
    this.areaGraphics.fill({ 
      color: this.COLORS.AREA_START, 
      alpha: 0.15 
    });

    // Draw curve line with glow effect
    this.curveGraphics.moveTo(originX, originY);
    for (const point of this.curvePoints) {
      const x = originX + (point.t * this.scaleX);
      const y = originY - ((point.m - 1) * this.scaleY);
      this.curveGraphics.lineTo(x, y);
    }
    
    if (plane) {
      this.curveGraphics.lineTo(plane.x, plane.y);
    }
    
    // Outer glow
    this.curveGraphics.stroke({ 
      width: this.LINE_WIDTH + 4, 
      color: this.COLORS.CURVE_START, 
      alpha: 0.2 
    });
    
    // Main line
    this.curveGraphics.stroke({ 
      width: this.LINE_WIDTH, 
      color: this.COLORS.CURVE_END 
    });
  }

  public updateState(state: GameState, multiplier: number, elapsedSeconds: number): void {
    if (!this.isInitialized || this.isDestroyed) return;
    
    if (typeof multiplier !== 'number' || multiplier < 1 || isNaN(multiplier)) return;
    if (typeof elapsedSeconds !== 'number' || elapsedSeconds < 0 || isNaN(elapsedSeconds)) return;

    this.currentMultiplier = multiplier;
    this.elapsedSeconds = elapsedSeconds;

    if (state !== this.currentState) {
      if (state === GameState.BETTING) {
        this.resetScene();
      } else if (state === GameState.CRASHED) {
        // Start fly-away animation
        const plane = this.planeSprite || this.planeGraphics;
        if (plane) {
          this.flyAwayStartX = plane.x;
          this.flyAwayStartY = plane.y;
          this.isFlyingAway = true;
          this.flyAwayTime = 0;
          
          // Create explosion at crash point
          this.createExplosion(plane.x, plane.y);
          
          // Clear exhaust but keep trail for fly-away
          this.exhaustParticles = [];
        }
      }
      this.currentState = state;
    }

    if (state === GameState.FLYING) {
      const plane = this.planeSprite || this.planeGraphics;
      if (plane) {
        plane.visible = true;
        plane.alpha = 1;
      }

      // Optimized curve point sampling
      const lastPoint = this.curvePoints[this.curvePoints.length - 1];
      const threshold = this.isMobile ? 0.08 : 0.05;
      if (!lastPoint || 
          Math.abs(elapsedSeconds - lastPoint.t) > threshold || 
          Math.abs(multiplier - lastPoint.m) > threshold) {
        this.curvePoints.push({ t: elapsedSeconds, m: multiplier });
      }
    }
  }

  private resetScene(): void {
    this.curvePoints = [{ t: 0, m: 1.0 }];
    this.trailPoints = [];
    this.exhaustParticles = [];
    this.explosionParticles = [];
    this.curveGraphics.clear();
    this.areaGraphics.clear();
    this.trailGraphics.clear();
    this.explosionGraphics.clear();
    this.flashGraphics.clear();
    
    const plane = this.planeSprite || this.planeGraphics;
    if (plane) {
      plane.visible = true;
      plane.alpha = 1;
      const originX = this.PADDING_LEFT;
      const originY = this.height - this.PADDING_BOTTOM;
      plane.position.set(originX, originY);
      if (this.planeSprite) {
        this.planeSprite.rotation = -0.1;
      }
    }

    // Reset animation state
    this.planeScale = 1.0;
    this.planeRotationTarget = -0.1;
    this.planeRotationCurrent = -0.1;
    this.flightTime = 0;
    this.isFlyingAway = false;
    this.flyAwayTime = 0;
    this.crashFlashAlpha = 0;

    this.maxTimeWindow = 10;
    this.maxMultWindow = 2.0;
    this.currentMultiplier = 1.0;
    this.elapsedSeconds = 0;
    this.updateViewport();
    this.drawCurve();
  }

  private updateViewport(): void {
    if (this.elapsedSeconds > this.maxTimeWindow * 0.8) {
      this.maxTimeWindow = Math.max(this.elapsedSeconds / 0.8, 10);
    }
    if (this.currentMultiplier > this.maxMultWindow * 0.8) {
      this.maxMultWindow = Math.max(this.currentMultiplier / 0.8, 2.0);
    }

    const availWidth = Math.max(this.width - this.PADDING_LEFT, 100);
    const availHeight = Math.max(this.height - this.PADDING_BOTTOM, 100);

    this.scaleX = availWidth / Math.max(this.maxTimeWindow, 0.1);
    this.scaleY = availHeight / Math.max(this.maxMultWindow - 1, 0.1);
  }

  public resize(width: number, height: number): void {
    this.width = Math.max(width, 400);
    this.height = Math.max(height, 300);
    
    // Re-detect mobile
    const wasMobile = this.isMobile;
    this.isMobile = this.width < 768 || window.innerWidth < 768;
    this.quality = this.isMobile ? 0.5 : 1;
    
    // Update quality if mobile status changed
    if (wasMobile !== this.isMobile && this.app?.renderer) {
      this.app.renderer.resolution = this.quality;
    }

    if (!this.isInitialized || !this.app || this.isDestroyed) return;
    
    try {
      if (this.app.renderer) {
        this.app.renderer.resize(this.width, this.height);
      }

      // Redraw background and grid
      this.backgroundLayer.removeChildren();
      this.drawBackground();
      this.drawGrid();

      // Redraw plane graphics if using fallback
      if (this.planeGraphics) {
        this.drawPlaneGraphics();
      }
    
      if (this.currentState === GameState.IDLE || this.currentState === GameState.BETTING) {
        this.resetScene();
      } else if (this.currentState === GameState.FLYING) {
        this.updateViewport();
        const plane = this.planeSprite || this.planeGraphics;
        if (plane) {
          const originX = this.PADDING_LEFT;
          const originY = this.height - this.PADDING_BOTTOM;
          const planeX = originX + (this.elapsedSeconds * this.scaleX);
          const planeY = originY - ((this.currentMultiplier - 1) * this.scaleY);
          plane.position.set(planeX, planeY);
        }
        this.drawCurve();
      }
    } catch (error) {
      console.error('Resize failed', error);
    }
  }

  private safeDestroyApp(): void {
    if (!this.app) return;

    try {
      if (this.app.ticker) {
        this.app.ticker.remove(this.tickerLoop);
      }

      if (this.planeSprite) {
        try {
          if (this.planeLayer.children.includes(this.planeSprite)) {
            this.planeLayer.removeChild(this.planeSprite);
          }
          this.planeSprite.destroy();
        } catch (e) {}
        this.planeSprite = null;
      }

      if (this.planeGraphics) {
        try {
          if (this.planeLayer.children.includes(this.planeGraphics)) {
            this.planeLayer.removeChild(this.planeGraphics);
          }
          this.planeGraphics.destroy();
        } catch (e) {}
        this.planeGraphics = null;
      }

      if (this.app.renderer && this.app.stage) {
        this.app.destroy({ removeView: true }, { children: true });
      }
    } catch (e) {
      console.warn('Destroy error', e);
    } finally {
      this.app = null;
    }
  }

  public destroy(): void {
    if (this.isDestroyed) return;
    this.isDestroyed = true;
    this.isInitialized = false;
    this.safeDestroyApp();
  }
}