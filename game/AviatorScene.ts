import { Application, Container, Sprite, Graphics, Ticker, Texture, Assets } from 'pixi.js';
import { GameState } from '../types';

/**
 * AviatorScene - Premium, Physics-Based, High-Performance
 * Features:
 * - Physics-based animations with velocity, acceleration, and forces
 * - Modern futuristic aesthetics
 * - Mobile-first performance optimization
 * - Smooth interpolations and premium visual effects
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
  
  // Physics-based particles
  private exhaustParticles: Array<Particle> = [];
  private explosionParticles: Array<ExplosionParticle> = [];
  
  // Animation state
  private planeScale: number = 1.0;
  private planeRotationTarget: number = -0.1;
  private planeRotationCurrent: number = -0.1;
  private flightTime: number = 0;
  
  // Physics-based fly-away animation
  private flyAwayPhysics: {
    x: number;
    y: number;
    vx: number;
    vy: number;
    rotation: number;
    angularVelocity: number;
    scale: number;
    alpha: number;
    active: boolean;
  } = {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    rotation: 0,
    angularVelocity: 0,
    scale: 1.0,
    alpha: 1.0,
    active: false
  };
  
  private flyAwayStartX: number = 0;
  private flyAwayStartY: number = 0;
  private crashFlashAlpha: number = 0;
  private lastFrameTime: number = 0;
  
  // Viewport
  private scaleX: number = 1;
  private scaleY: number = 1;
  private maxTimeWindow: number = 10;
  private maxMultWindow: number = 2.0;
  
  // Performance & Quality
  private isInitialized: boolean = false;
  private isDestroyed: boolean = false;
  private isMobile: boolean = false;
  private quality: number = 1;
  private frameSkip: number = 0;
  private deltaTime: number = 0;
  
  // Performance optimization: Object pooling
  private particlePool: Array<Particle> = [];
  private explosionParticlePool: Array<ExplosionParticle> = [];
  private readonly MAX_POOL_SIZE = 100;
  
  // Responsive constants
  private get PADDING_LEFT(): number {
    return this.isMobile ? 40 : 60;
  }
  
  private get PADDING_BOTTOM(): number {
    return this.isMobile ? 40 : 60;
  }
  
  private get PLANE_SIZE(): number {
    return this.isMobile ? 72 : 90;
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
  
  // Physics constants
  private readonly PHYSICS = {
    GRAVITY: 300, // pixels per second squared
    AIR_RESISTANCE: 0.98, // per second
    EXPLOSION_FORCE: 400, // pixels per second
    FLY_AWAY_THRUST: 800, // pixels per second squared
    FLY_AWAY_ANGULAR_VELOCITY: Math.PI * 3, // radians per second
    PARTICLE_FRICTION: 0.95, // per frame
    PARTICLE_GRAVITY: 150, // pixels per second squared
  };

  constructor(container: HTMLDivElement) {
    if (!container) throw new Error('Container required');
    this.container = container;
    
    const rect = container.getBoundingClientRect();
    this.width = Math.max(rect.width || 800, 400);
    this.height = Math.max(rect.height || 600, 300);
    
    this.isMobile = this.width < 768 || window.innerWidth < 768;
    this.quality = this.isMobile ? 0.5 : 1;

    // Initialize layered containers
    this.stage = new Container();
    this.backgroundLayer = new Container();
    this.gridLayer = new Container();
    this.curveLayer = new Container();
    this.effectsLayer = new Container();
    this.planeLayer = new Container();
    
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
    
    // Initialize particle pools
    this.initParticlePools();
  }

  private initParticlePools(): void {
    // Pre-allocate particles for better performance
    for (let i = 0; i < this.MAX_POOL_SIZE; i++) {
      this.particlePool.push({
        x: 0, y: 0,
        vx: 0, vy: 0,
        life: 0, maxLife: 0
      });
      this.explosionParticlePool.push({
        x: 0, y: 0,
        vx: 0, vy: 0,
        life: 0, maxLife: 0,
        size: 0, color: 0
      });
    }
  }

  private getParticle(): Particle {
    if (this.particlePool.length > 0) {
      return this.particlePool.pop()!;
    }
    return { x: 0, y: 0, vx: 0, vy: 0, life: 0, maxLife: 0 };
  }

  private recycleParticle(particle: Particle): void {
    if (this.particlePool.length < this.MAX_POOL_SIZE) {
      this.particlePool.push(particle);
    }
  }

  private getExplosionParticle(): ExplosionParticle {
    if (this.explosionParticlePool.length > 0) {
      return this.explosionParticlePool.pop()!;
    }
    return { x: 0, y: 0, vx: 0, vy: 0, life: 0, maxLife: 0, size: 0, color: 0 };
  }

  private recycleExplosionParticle(particle: ExplosionParticle): void {
    if (this.explosionParticlePool.length < this.MAX_POOL_SIZE) {
      this.explosionParticlePool.push(particle);
    }
  }

  public async init(): Promise<void> {
    if (this.isInitialized || this.isDestroyed) return;

    try {
      const rect = this.container.getBoundingClientRect();
      this.width = Math.max(rect.width || 800, 400);
      this.height = Math.max(rect.height || 600, 300);
      
      this.isMobile = this.width < 768 || window.innerWidth < 768;
      this.quality = this.isMobile ? 0.5 : 1;

      this.app = new Application();
      await this.app.init({
        width: this.width,
        height: this.height,
        background: this.COLORS.BG_END,
        antialias: !this.isMobile,
        resolution: this.quality,
        autoDensity: true,
        powerPreference: 'high-performance',
      });

      if (this.isDestroyed) {
        this.safeDestroyApp();
        return;
      }

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

      this.drawBackground();
      this.drawGrid();
      await this.createPlane();
      this.resetScene();

      if (this.app.ticker) {
        this.app.ticker.add(this.tickerLoop);
      }

      this.isInitialized = true;
      this.lastFrameTime = performance.now();
      
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
    bg.fill({ color: this.COLORS.BG_START, alpha: 1 });
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
    
    // Vertical lines
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
    
    // Horizontal lines
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
    
    // Outer glow
    this.planeGraphics.circle(0, 0, size * 0.7);
    this.planeGraphics.fill({ color: this.COLORS.GLOW, alpha: 0.15 });
    
    this.planeGraphics.circle(0, 0, size * 0.5);
    this.planeGraphics.fill({ color: this.COLORS.GLOW, alpha: 0.25 });
    
    // Body
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

    // Window
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

    // Calculate deltaTime for physics
    const now = performance.now();
    this.deltaTime = Math.min((now - this.lastFrameTime) / 1000, 0.033); // Cap at 30fps minimum
    this.lastFrameTime = now;

    // Frame skipping for mobile
    this.frameSkip++;
    const shouldUpdate = !this.isMobile || this.frameSkip % 2 === 0;
    if (!shouldUpdate && this.currentState !== GameState.FLYING && !this.flyAwayPhysics.active) {
      return;
    }
    if (this.frameSkip > 1000) this.frameSkip = 0;

    // Update based on state
    if (this.currentState === GameState.FLYING) {
      plane.visible = true;
      plane.alpha = 1;
      this.updateFlight(ticker);
    } else if (this.currentState === GameState.CRASHED && this.flyAwayPhysics.active) {
      plane.visible = true;
      this.updateFlyAway(ticker);
    } else if (this.currentState === GameState.BETTING) {
      plane.visible = true;
      plane.alpha = 1;
      this.updateBetting(ticker);
    } else {
      plane.visible = true;
      plane.alpha = 1;
      this.updateIdle();
    }
  };

  private updateFlight(ticker: Ticker): void {
    const originX = this.PADDING_LEFT;
    const originY = this.height - this.PADDING_BOTTOM;
    
    this.updateViewport();
    this.flightTime += this.deltaTime;
    
    const planeX = originX + (this.elapsedSeconds * this.scaleX);
    const planeY = originY - ((this.currentMultiplier - 1) * this.scaleY);
    
    const plane = this.planeSprite || this.planeGraphics;
    if (plane) {
      // Smooth position interpolation
      const currentX = plane.x || planeX;
      const currentY = plane.y || planeY;
      const smoothFactor = 1 - Math.exp(-15 * this.deltaTime); // Exponential smoothing
      plane.position.set(
        currentX + (planeX - currentX) * smoothFactor,
        currentY + (planeY - currentY) * smoothFactor
      );
      
      // Rotation based on curve direction
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
      this.planeRotationCurrent += rotationDiff * (1 - Math.exp(-10 * this.deltaTime));
      
      if (this.planeSprite) {
        this.planeSprite.rotation = this.planeRotationCurrent;
      }
      
      // Subtle scale pulsing
      const pulseSpeed = 2;
      const pulseAmount = 0.03;
      this.planeScale = 1.0 + Math.sin(this.flightTime * pulseSpeed) * pulseAmount;
      
      if (this.planeSprite) {
        this.planeSprite.scale.set(this.planeSpriteBaseScale * this.planeScale);
      }
    }
    
    this.updateExhaustParticles(planeX, planeY);
    this.updateTrail(planeX, planeY);
    
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

  // Physics-based fly-away animation
  private updateFlyAway(ticker: Ticker): void {
    const physics = this.flyAwayPhysics;
    if (!physics.active) return;

    // Physics update: Apply thrust and forces
    const angle = Math.PI / 4; // 45 degrees up-right
    const thrustX = Math.cos(angle) * this.PHYSICS.FLY_AWAY_THRUST * this.deltaTime;
    const thrustY = -Math.sin(angle) * this.PHYSICS.FLY_AWAY_THRUST * this.deltaTime;
    
    // Update velocity with thrust
    physics.vx += thrustX;
    physics.vy += thrustY;
    
    // Apply air resistance
    physics.vx *= Math.pow(this.PHYSICS.AIR_RESISTANCE, this.deltaTime);
    physics.vy *= Math.pow(this.PHYSICS.AIR_RESISTANCE, this.deltaTime);
    
    // Update position
    physics.x += physics.vx * this.deltaTime;
    physics.y += physics.vy * this.deltaTime;
    
    // Angular velocity (spinning)
    physics.angularVelocity *= 0.98; // Angular damping
    physics.rotation += physics.angularVelocity * this.deltaTime;
    
    // Scale increases smoothly
    physics.scale = 1.0 + (1.0 - Math.exp(-2 * (this.flyAwayPhysics.x - this.flyAwayStartX) / this.width)) * 0.6;
    
    // Fade out based on distance
    const distanceTraveled = Math.sqrt(
      Math.pow(physics.x - this.flyAwayStartX, 2) + 
      Math.pow(physics.y - this.flyAwayStartY, 2)
    );
    const maxDistance = Math.max(this.width, this.height) * 1.5;
    physics.alpha = Math.max(0, 1 - (distanceTraveled / maxDistance));
    
    // Update plane position
    const plane = this.planeSprite || this.planeGraphics;
    if (plane) {
      plane.position.set(physics.x, physics.y);
      plane.alpha = physics.alpha;
      
      if (this.planeSprite) {
        this.planeSprite.rotation = physics.rotation;
        this.planeSprite.scale.set(this.planeSpriteBaseScale * physics.scale);
      } else if (this.planeGraphics) {
        this.planeScale = physics.scale;
        this.drawPlaneGraphics();
      }
    }
    
    // Update effects
    this.updateExplosionParticles(ticker);
    this.updateCrashFlash(ticker);
    this.updateTrail(physics.x, physics.y);
    
    // Fade trail
    this.trailPoints.forEach(point => {
      point.alpha *= 0.92;
    });
    
    // Clean up when off-screen or invisible
    if (physics.alpha <= 0 || 
        physics.x > this.width + 200 || 
        physics.y < -200 || 
        physics.x < -200) {
      plane.visible = false;
      physics.active = false;
      this.explosionParticles = [];
      this.trailPoints = [];
      this.explosionGraphics.clear();
      this.flashGraphics.clear();
    }
  }

  private createExplosion(x: number, y: number): void {
    const particleCount = this.isMobile ? 30 : 50;
    
    for (let i = 0; i < particleCount; i++) {
      const particle = this.getExplosionParticle();
      const angle = (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 0.5;
      const speed = this.PHYSICS.EXPLOSION_FORCE * (0.5 + Math.random() * 0.5);
      const life = 0.5 + Math.random() * 0.5;
      
      particle.x = x + (Math.random() - 0.5) * 20;
      particle.y = y + (Math.random() - 0.5) * 20;
      particle.vx = Math.cos(angle) * speed;
      particle.vy = Math.sin(angle) * speed;
      particle.life = life;
      particle.maxLife = life;
      particle.size = 3 + Math.random() * 8;
      particle.color = Math.random() > 0.5 ? this.COLORS.EXPLOSION : this.COLORS.EXPLOSION_FIRE;
      
      this.explosionParticles.push(particle);
    }
  }

  private updateExplosionParticles(ticker: Ticker): void {
    // Update and filter particles with physics
    const aliveParticles: ExplosionParticle[] = [];
    
    for (const particle of this.explosionParticles) {
      // Apply gravity
      particle.vy += this.PHYSICS.PARTICLE_GRAVITY * this.deltaTime;
      
      // Apply air resistance
      particle.vx *= Math.pow(this.PHYSICS.PARTICLE_FRICTION, this.deltaTime * 60);
      particle.vy *= Math.pow(this.PHYSICS.PARTICLE_FRICTION, this.deltaTime * 60);
      
      // Update position
      particle.x += particle.vx * this.deltaTime;
      particle.y += particle.vy * this.deltaTime;
      
      // Update life
      particle.life -= this.deltaTime;
      
      if (particle.life > 0) {
        aliveParticles.push(particle);
      } else {
        this.recycleExplosionParticle(particle);
      }
    }
    
    this.explosionParticles = aliveParticles;

    // Batch draw particles
    this.explosionGraphics.clear();
    for (const particle of this.explosionParticles) {
      const alpha = particle.life / particle.maxLife;
      const size = particle.size * alpha;
      
      // Core
      this.explosionGraphics.circle(particle.x, particle.y, size);
      this.explosionGraphics.fill({ 
        color: particle.color,
        alpha: alpha * 0.8
      });
      
      // Glow
      this.explosionGraphics.circle(particle.x, particle.y, size * 1.5);
      this.explosionGraphics.fill({ 
        color: particle.color,
        alpha: alpha * 0.3
      });
    }
  }

  private updateCrashFlash(ticker: Ticker): void {
    // Flash effect with exponential decay
    if (this.crashFlashAlpha > 0) {
      this.crashFlashAlpha = Math.max(0, this.crashFlashAlpha - this.deltaTime * 5);
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
    
    const exhaustDistance = this.PLANE_SIZE * 0.8;
    const exhaustX = planeX - Math.cos(rotation) * exhaustDistance;
    const exhaustY = planeY - Math.sin(rotation) * exhaustDistance;
    
    // Add new particles
    const particlesPerFrame = this.isMobile ? 1 : 2;
    for (let i = 0; i < particlesPerFrame; i++) {
      const particle = this.getParticle();
      const angle = rotation + Math.PI + (Math.random() - 0.5) * 0.5;
      const speed = 30 + Math.random() * 50;
      const life = 0.3 + Math.random() * 0.4;
      
      particle.x = exhaustX + (Math.random() - 0.5) * 10;
      particle.y = exhaustY + (Math.random() - 0.5) * 10;
      particle.vx = Math.cos(angle) * speed;
      particle.vy = Math.sin(angle) * speed;
      particle.life = life;
      particle.maxLife = life;
      
      this.exhaustParticles.push(particle);
    }
    
    // Update particles with physics
    const aliveParticles: Particle[] = [];
    for (const particle of this.exhaustParticles) {
      // Air resistance
      particle.vx *= Math.pow(0.95, this.deltaTime * 60);
      particle.vy *= Math.pow(0.95, this.deltaTime * 60);
      
      // Update position
      particle.x += particle.vx * this.deltaTime;
      particle.y += particle.vy * this.deltaTime;
      
      // Update life
      particle.life -= this.deltaTime;
      
      if (particle.life > 0) {
        aliveParticles.push(particle);
      } else {
        this.recycleParticle(particle);
      }
    }
    
    this.exhaustParticles = aliveParticles;
    
    // Limit particle count
    const maxParticles = this.isMobile ? 20 : 40;
    if (this.exhaustParticles.length > maxParticles) {
      const toRecycle = this.exhaustParticles.splice(0, this.exhaustParticles.length - maxParticles);
      toRecycle.forEach(p => this.recycleParticle(p as any));
    }
  }

  private updateTrail(x: number, y: number): void {
    this.trailPoints.push({ x, y, alpha: 1.0 });
    
    const maxTrailLength = this.isMobile ? 20 : 40;
    if (this.trailPoints.length > maxTrailLength) {
      this.trailPoints.shift();
    }
    
    // Smooth gradient fade
    this.trailPoints.forEach((point, i) => {
      const progress = i / this.trailPoints.length;
      point.alpha = (1 - progress) * 0.7;
    });
    
    // Batch draw trail
    this.trailGraphics.clear();
    if (this.trailPoints.length > 1) {
      // Draw exhaust particles
      for (const particle of this.exhaustParticles) {
        const size = this.PLANE_SIZE * 0.15 * (particle.life / particle.maxLife);
        this.trailGraphics.circle(particle.x, particle.y, size);
        this.trailGraphics.fill({ 
          color: this.COLORS.TRAIL,
          alpha: (particle.life / particle.maxLife) * 0.4
        });
      }
      
      // Draw trail line
      if (this.trailPoints.length > 1) {
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
        
        // Glow
        this.trailGraphics.moveTo(this.trailPoints[0].x, this.trailPoints[0].y);
        for (let i = 1; i < this.trailPoints.length; i++) {
          this.trailGraphics.lineTo(this.trailPoints[i].x, this.trailPoints[i].y);
        }
        this.trailGraphics.stroke({ 
          width: this.LINE_WIDTH * 3, 
          color: this.COLORS.TRAIL,
          alpha: 0.15
        });
      }
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

    // Draw area fill
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
    
    this.areaGraphics.fill({ 
      color: this.COLORS.AREA_START, 
      alpha: 0.15 
    });

    // Draw curve line
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
        const plane = this.planeSprite || this.planeGraphics;
        if (plane) {
          // Initialize physics-based fly-away
          this.flyAwayPhysics.x = plane.x;
          this.flyAwayPhysics.y = plane.y;
          this.flyAwayPhysics.vx = 0;
          this.flyAwayPhysics.vy = 0;
          this.flyAwayPhysics.rotation = this.planeRotationCurrent;
          this.flyAwayPhysics.angularVelocity = this.PHYSICS.FLY_AWAY_ANGULAR_VELOCITY;
          this.flyAwayPhysics.scale = 1.0;
          this.flyAwayPhysics.alpha = 1.0;
          this.flyAwayPhysics.active = true;
          this.flyAwayStartX = plane.x;
          this.flyAwayStartY = plane.y;
          
          // Create explosion
          this.createExplosion(plane.x, plane.y);
          this.crashFlashAlpha = 1.0;
          
          // Clear exhaust
          this.exhaustParticles.forEach(p => this.recycleParticle(p as any));
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
    
    // Recycle particles
    this.exhaustParticles.forEach(p => this.recycleParticle(p as any));
    this.explosionParticles.forEach(p => this.recycleExplosionParticle(p));
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

    this.planeScale = 1.0;
    this.planeRotationTarget = -0.1;
    this.planeRotationCurrent = -0.1;
    this.flightTime = 0;
    this.flyAwayPhysics.active = false;
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
    
    const wasMobile = this.isMobile;
    this.isMobile = this.width < 768 || window.innerWidth < 768;
    this.quality = this.isMobile ? 0.5 : 1;
    
    if (wasMobile !== this.isMobile && this.app?.renderer) {
      this.app.renderer.resolution = this.quality;
    }

    if (!this.isInitialized || !this.app || this.isDestroyed) return;
    
    try {
      if (this.app.renderer) {
        this.app.renderer.resize(this.width, this.height);
      }

      this.backgroundLayer.removeChildren();
      this.drawBackground();
      this.drawGrid();

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

// Type definitions for particles
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
}

interface ExplosionParticle extends Particle {
  size: number;
  color: number;
}
