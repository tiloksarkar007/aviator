import { Application, Container, Graphics, Ticker, Texture, Color, Matrix } from 'pixi.js';
import { GameState } from '../types';

// --- Particle System Types ---
interface Particle {
  sprite: Graphics;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  rotationSpeed: number;
  type: 'trail' | 'debris' | 'shockwave' | 'smoke' | 'fire';
}

export class AviatorScene {
  private app: Application | null = null;
  private container: HTMLDivElement;
  
  // Layers
  private backgroundLayer: Container;
  private gameLayer: Container;
  private effectsLayer: Container; // Particles behind plane
  private uiLayer: Container;      // Explosions on top
  
  // Visual Elements
  private planeContainer: Container;
  private planeBody: Graphics | null = null;
  private planeProp: Graphics | null = null;
  private curveGraphics: Graphics;
  private areaGraphics: Graphics;
  private bgRays: Graphics;
  private gridGraphics: Graphics;
  
  // Resources
  private gradientTexture: Texture | null = null;
  
  // State Tracking
  private width: number = 0;
  private height: number = 0;
  private curvePoints: { t: number, m: number }[] = [];
  private currentState: GameState = GameState.IDLE;
  
  // Camera / Viewport
  private maxTimeWindow: number = 10;
  private maxMultWindow: number = 2.0;
  private scaleX: number = 1;
  private scaleY: number = 1;
  
  private isInitialized: boolean = false;
  private isInitializing: boolean = false;
  private isDestroyed: boolean = false;
  
  // Animation & FX
  private time: number = 0;
  private particles: Particle[] = [];
  private shakeIntensity: number = 0;
  private trailTimer: number = 0;

  constructor(container: HTMLDivElement) {
    this.container = container;
    // Use fallback dimensions if container is currently hidden/zero
    this.width = container.clientWidth || 800;
    this.height = container.clientHeight || 600;

    this.backgroundLayer = new Container();
    this.gameLayer = new Container();
    this.effectsLayer = new Container();
    this.uiLayer = new Container();

    this.bgRays = new Graphics();
    this.gridGraphics = new Graphics();
    this.curveGraphics = new Graphics();
    this.areaGraphics = new Graphics();
    
    this.planeContainer = new Container();
    
    // Layer Hierarchy
    this.backgroundLayer.addChild(this.bgRays);
    this.backgroundLayer.addChild(this.gridGraphics);
    
    this.gameLayer.addChild(this.areaGraphics);
    this.gameLayer.addChild(this.curveGraphics);
    this.gameLayer.addChild(this.effectsLayer); // Trail behind plane
    this.gameLayer.addChild(this.planeContainer);
  }

  public async init() {
    // Prevent re-entry or init if already destroyed
    if (this.isInitialized || this.isDestroyed || this.isInitializing) return;

    this.isInitializing = true;
    this.app = new Application();

    try {
      // PixiJS v8 Init
      await this.app.init({
        width: this.width,
        height: this.height,
        background: '#0f172a',
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
        preference: 'webgl', // FORCE WebGL to avoid WebGPU blank screen issues on some devices
      });
    } catch (error) {
      console.warn("AviatorScene: Pixi init cancelled or failed", error);
      this.isInitializing = false;
      return;
    }

    this.isInitializing = false;

    // Handle race condition: Destroy called WHILE we were awaiting init
    if (this.isDestroyed) {
      this.safeDestroyApp();
      return;
    }

    // Explicitly style the canvas to ensure it fills the container
    this.app.canvas.style.width = '100%';
    this.app.canvas.style.height = '100%';
    this.app.canvas.style.display = 'block';
    this.app.canvas.style.position = 'absolute';
    this.app.canvas.style.top = '0';
    this.app.canvas.style.left = '0';

    this.container.appendChild(this.app.canvas);
    
    this.app.stage.addChild(this.backgroundLayer);
    this.app.stage.addChild(this.gameLayer);
    this.app.stage.addChild(this.uiLayer);

    // Generate Assets
    this.createPlaneVisuals();
    this.createGradientTexture();
    this.drawRays();
    this.resetScene();

    // Animation Loop
    this.app.ticker.add(this.tickerLoop);

    this.isInitialized = true;
  }

  // --- Asset Generation ---

  private createGradientTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (ctx) {
        const grd = ctx.createLinearGradient(0, 0, 0, 256);
        grd.addColorStop(0, 'rgba(225, 29, 72, 0.6)'); // Rose-600 with opacity
        grd.addColorStop(1, 'rgba(225, 29, 72, 0.0)'); // Fade to transparent
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, 1, 256);
    }
    this.gradientTexture = Texture.from(canvas);
  }

  private createPlaneVisuals() {
    // 1. Fuselage
    this.planeBody = new Graphics();
    const gBody = this.planeBody;
    
    // Main Body
    gBody.roundRect(-40, -15, 80, 30, 8);
    gBody.fill({ color: 0xe11d48 }); // Rose-600
    
    // Upper Curve / Cockpit
    gBody.beginPath();
    gBody.moveTo(-15, -15);
    gBody.quadraticCurveTo(0, -30, 30, -15);
    gBody.fill({ color: 0xe11d48 });

    // Tail Fin
    gBody.beginPath();
    gBody.moveTo(-35, -15);
    gBody.lineTo(-45, -40);
    gBody.lineTo(-15, -15);
    gBody.fill({ color: 0xbe123c }); // Rose-700

    // Wing (Side View)
    gBody.beginPath();
    gBody.moveTo(-10, 5);
    gBody.lineTo(-25, 20);
    gBody.lineTo(15, 10);
    gBody.fill({ color: 0xbe123c });

    // Window
    gBody.ellipse(10, -10, 12, 8);
    gBody.fill({ color: 0x38bdf8 }); // Sky Blue
    gBody.stroke({ width: 2, color: 0xffffff, alpha: 0.6 });
    
    // Shadow/Highlight (simulated with line)
    gBody.moveTo(-40, 0);
    gBody.lineTo(40, 0);
    gBody.stroke({ width: 2, color: 0xffffff, alpha: 0.1 });

    // 2. Propeller
    this.planeProp = new Graphics();
    const gProp = this.planeProp;
    
    gProp.ellipse(0, 0, 4, 25);
    gProp.fill({ color: 0xe2e8f0 }); // Slate-200
    gProp.stroke({ width: 1, color: 0x94a3b8 });
    gProp.circle(0, 0, 6); // Hub
    gProp.fill({ color: 0x475569 }); // Slate-600
    
    gProp.position.set(42, 0); // Position at nose

    // Assemble Plane
    this.planeContainer.addChild(this.planeBody);
    this.planeContainer.addChild(this.planeProp);
  }

  // --- Game Loop ---

  private tickerLoop = (ticker: Ticker) => {
    if (!this.app || this.isDestroyed || !this.isInitialized) return;

    const dt = ticker.deltaTime;
    this.time += dt;

    // 1. Background Animation
    this.bgRays.rotation += 0.0005 * dt;

    // 2. Plane Animation (Idle Hover or Flying)
    if (this.currentState === GameState.FLYING || this.currentState === GameState.BETTING) {
       // Propeller spin
       if (this.planeProp) {
          // Spin faster when flying
          const speed = this.currentState === GameState.FLYING ? 0.8 : 0.1;
          this.planeProp.rotation += speed * dt;
          // Visual blur effect on propeller when fast
          this.planeProp.scale.y = this.currentState === GameState.FLYING ? 0.8 + Math.sin(this.time) * 0.2 : 1; 
       }
       
       // Gentle hover
       if (this.currentState === GameState.BETTING) {
         this.planeContainer.y += Math.sin(this.time * 0.05) * 0.5;
       }
    }

    // 3. Trail Emission
    if (this.currentState === GameState.FLYING) {
        this.trailTimer += dt;
        if (this.trailTimer > 3) { // Emit every ~3 frames
            this.spawnTrailParticle();
            this.trailTimer = 0;
        }
    }

    // 4. Particle Updates
    this.updateParticles(dt);

    // 5. Screen Shake
    if (this.shakeIntensity > 0) {
        const shakeX = (Math.random() * 2 - 1) * this.shakeIntensity;
        const shakeY = (Math.random() * 2 - 1) * this.shakeIntensity;
        
        if (this.app.stage) {
           this.app.stage.position.set(shakeX, shakeY);
        }
        
        this.shakeIntensity *= 0.9; // Decay
        if (this.shakeIntensity < 0.5) {
            this.shakeIntensity = 0;
            if (this.app.stage) this.app.stage.position.set(0, 0);
        }
    }
  };

  private spawnTrailParticle() {
      const g = new Graphics();
      g.circle(0, 0, Math.random() * 4 + 2);
      g.fill({ color: 0xffffff, alpha: 0.4 }); // White/Smoke
      
      // Position at back of plane, relative to scene
      const offset = -35;
      const angle = this.planeContainer.rotation;
      const startX = this.planeContainer.x + Math.cos(angle) * offset;
      const startY = this.planeContainer.y + Math.sin(angle) * offset;

      g.position.set(startX, startY);
      
      this.effectsLayer.addChild(g);
      
      this.particles.push({
          sprite: g,
          vx: -Math.cos(angle) * 2 + (Math.random() - 0.5),
          vy: Math.sin(angle) * 2 + (Math.random() - 0.5),
          life: 1.0,
          maxLife: 1.0,
          rotationSpeed: 0,
          type: 'trail'
      });
  }

  private updateParticles(dt: number) {
      for (let i = this.particles.length - 1; i >= 0; i--) {
          const p = this.particles[i];
          p.life -= 0.02 * dt;
          
          if (p.life <= 0) {
              p.sprite.destroy();
              this.particles.splice(i, 1);
              continue;
          }

          const progress = 1 - (p.life / p.maxLife);

          p.sprite.x += p.vx * dt;
          p.sprite.y += p.vy * dt;
          p.sprite.rotation += p.rotationSpeed * dt;

          if (p.type === 'trail') {
              p.sprite.alpha = p.life * 0.5;
              p.sprite.scale.set(1 + progress); 
          } else if (p.type === 'debris') {
              p.sprite.alpha = Math.min(1, p.life);
              p.vy += 0.15 * dt; // Stronger gravity
          } else if (p.type === 'shockwave') {
              p.sprite.alpha = p.life / p.maxLife;
              p.sprite.scale.set(1 + progress * 3);
          } else if (p.type === 'fire') {
               p.sprite.alpha = p.life / p.maxLife;
               p.sprite.scale.set(1 + progress * 0.5);
          } else if (p.type === 'smoke') {
               p.sprite.alpha = (p.life / p.maxLife) * 0.5;
               p.sprite.scale.set(1 + progress * 3);
               p.vx *= 0.95;
               p.vy *= 0.95;
          }
      }
  }

  // --- State Management ---

  public updateState(state: GameState, multiplier: number, elapsedSeconds: number) {
    if (!this.isInitialized || this.isDestroyed) return;

    if (state !== this.currentState) {
      this.handleStateChange(state);
      this.currentState = state;
    }

    if (state === GameState.FLYING) {
      const lastPoint = this.curvePoints[this.curvePoints.length - 1];
      if (!lastPoint || elapsedSeconds - lastPoint.t > 0.05 || multiplier - lastPoint.m > 0.05) {
         this.curvePoints.push({ t: elapsedSeconds, m: multiplier });
      }
      
      this.updateViewport(elapsedSeconds, multiplier);
      this.drawGameLoop(elapsedSeconds, multiplier);
    } else if (state === GameState.BETTING) {
      this.resetViewport();
    }
  }

  private handleStateChange(newState: GameState) {
    if (newState === GameState.BETTING) {
      this.resetScene();
    } else if (newState === GameState.CRASHED) {
      this.triggerCrashSequence();
    }
  }

  private resetScene() {
    this.curvePoints = [{ t: 0, m: 1.0 }];
    this.curveGraphics.clear();
    this.areaGraphics.clear();
    
    // Clear all effects
    this.effectsLayer.removeChildren();
    this.uiLayer.removeChildren();
    this.particles = [];
    
    this.planeContainer.visible = true;
    this.planeContainer.alpha = 1;
    this.resetViewport();
    
    this.updateViewport(0, 1.0);
    this.drawGameLoop(0, 1.0);
  }

  private resetViewport() {
    this.maxTimeWindow = 8;
    this.maxMultWindow = 2.0;
  }

  private updateViewport(currentT: number, currentM: number) {
    if (currentT > this.maxTimeWindow * 0.8) {
        this.maxTimeWindow = currentT / 0.8;
    }
    if (currentM > this.maxMultWindow * 0.8) {
        this.maxMultWindow = currentM / 0.8;
    }

    const paddingLeft = 40;
    const paddingBottom = 40;
    // Ensure we don't use 0 if init failed to detect size
    const availWidth = (this.width || 800) - paddingLeft;
    const availHeight = (this.height || 600) - paddingBottom;

    this.scaleX = availWidth / this.maxTimeWindow;
    this.scaleY = availHeight / (this.maxMultWindow - 1);
  }

  private drawGameLoop(currentT: number, currentM: number) {
     const paddingLeft = 40;
     const paddingBottom = 40;
     const originX = paddingLeft;
     const originY = (this.height || 600) - paddingBottom;

     // 1. Plane Physics
     const planeX = originX + (currentT * this.scaleX);
     const planeY = originY - ((currentM - 1) * this.scaleY);

     this.planeContainer.position.set(planeX, planeY);
     
     // Calculate angle
     if (this.curvePoints.length > 1) {
        const last = this.curvePoints[this.curvePoints.length - 2];
        const dx = (currentT - last.t) * this.scaleX;
        const dy = -((currentM - last.m) * this.scaleY);
        const angle = Math.atan2(dy, dx);
        this.planeContainer.rotation = angle * 0.6; // Smoother rotation
     } else {
        this.planeContainer.rotation = -0.1; // Initial take-off tilt
     }

     // 2. Draw Curve & Area
     this.curveGraphics.clear();
     this.areaGraphics.clear();

     if (this.curvePoints.length > 0) {
        this.curveGraphics.moveTo(originX, originY);
        this.areaGraphics.moveTo(originX, originY);

        for (const p of this.curvePoints) {
            const px = originX + (p.t * this.scaleX);
            const py = originY - ((p.m - 1) * this.scaleY);
            this.curveGraphics.lineTo(px, py);
            this.areaGraphics.lineTo(px, py);
        }

        this.curveGraphics.lineTo(planeX, planeY);
        this.areaGraphics.lineTo(planeX, planeY);
        this.areaGraphics.lineTo(planeX, originY);
        this.areaGraphics.lineTo(originX, originY);
        
        this.curveGraphics.stroke({ width: 5, color: 0xe11d48 });
        
        // Gradient Fill
        if (this.gradientTexture) {
             const matrix = new Matrix();
             // Scale vertical gradient to fit screen height approximately
             const scaleY = (this.height || 600) / 256; 
             matrix.scale(1, scaleY);

             this.areaGraphics.fill({ 
                 texture: this.gradientTexture,
                 matrix: matrix
             });
        } else {
             this.areaGraphics.fill({ color: 0xe11d48, alpha: 0.3 });
        }
     }

     // 3. Grid
     this.gridGraphics.clear();
     this.gridGraphics.moveTo(originX, 0);
     this.gridGraphics.lineTo(originX, (this.height || 600));
     this.gridGraphics.moveTo(0, originY);
     this.gridGraphics.lineTo((this.width || 800), originY);
     this.gridGraphics.stroke({ width: 2, color: 0x334155 });
  }

  private triggerCrashSequence() {
    this.planeContainer.visible = false;
    const { x, y } = this.planeContainer;

    // 1. Intense Screen Shake
    this.shakeIntensity = 45; 

    // 2. Flash
    const flash = new Graphics();
    flash.rect(0, 0, this.width || 800, this.height || 600);
    flash.fill({ color: 0xffffff, alpha: 0.8 });
    this.uiLayer.addChild(flash);
    
    // Flash Animation
    const fadeFlash = () => {
        flash.alpha -= 0.1;
        if (flash.alpha > 0) {
            requestAnimationFrame(fadeFlash);
        } else {
            flash.destroy();
        }
    };
    fadeFlash();

    // 3. Shockwaves (Multiple)
    for(let i=0; i<3; i++) {
        const ring = new Graphics();
        ring.circle(0, 0, 10 + i*5);
        ring.stroke({ width: 4 - i, color: 0xffffff, alpha: 0.8 });
        ring.position.set(x, y);
        this.uiLayer.addChild(ring);
        this.particles.push({
            sprite: ring,
            vx: 0, vy: 0,
            life: 0.8 + (i * 0.2),
            maxLife: 0.8 + (i * 0.2),
            rotationSpeed: 0,
            type: 'shockwave'
        });
    }

    // 4. Fireball
    const fireColors = [0xffb700, 0xff5e00, 0xff0000];
    for(let i=0; i<10; i++) {
        const f = new Graphics();
        f.circle(0, 0, Math.random() * 20 + 15);
        f.fill({ color: fireColors[i % fireColors.length], alpha: 0.9 });
        f.position.set(x + (Math.random()-0.5)*20, y + (Math.random()-0.5)*20);
        this.uiLayer.addChild(f);
        this.particles.push({
            sprite: f,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2,
            life: 0.5 + Math.random() * 0.3,
            maxLife: 0.8,
            rotationSpeed: 0,
            type: 'fire'
        });
    }

    // 5. Debris (More intense)
    const debrisColors = [0xe11d48, 0xbe123c, 0x334155, 0x94a3b8, 0x000000];
    for (let i = 0; i < 40; i++) {
        const d = new Graphics();
        const shapeType = Math.floor(Math.random() * 3);
        if(shapeType === 0) {
             d.poly([0,0, 8 + Math.random()*10, -5, 4, 10]);
        } else if (shapeType === 1) {
             d.rect(0, 0, Math.random()*12+4, Math.random()*6+2);
        } else {
             d.circle(0,0, Math.random()*4+2);
        }
        
        d.fill({ color: debrisColors[i % debrisColors.length] });
        d.position.set(x, y);
        
        this.uiLayer.addChild(d);
        
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 15 + 5; 
        
        this.particles.push({
            sprite: d,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 2.0 + Math.random(),
            maxLife: 3.0,
            rotationSpeed: (Math.random() - 0.5) * 2,
            type: 'debris'
        });
    }

    // 6. Smoke Plumes
    for (let i = 0; i < 25; i++) {
        const s = new Graphics();
        s.circle(0, 0, Math.random() * 15 + 5);
        s.fill({ color: 0x475569, alpha: 0.6 });
        s.position.set(x + (Math.random()-0.5)*30, y + (Math.random()-0.5)*30);
        this.uiLayer.addChild(s);

        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 4;

        this.particles.push({
            sprite: s,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 1, // Slight upward drift
            life: 1.5 + Math.random() * 1.5,
            maxLife: 3.0,
            rotationSpeed: (Math.random() - 0.5) * 0.1,
            type: 'smoke'
        });
    }
  }

  private drawRays() {
    const g = this.bgRays;
    const cx = (this.width || 800) / 2;
    const cy = (this.height || 600) * 2;
    const radius = Math.max((this.width || 800), (this.height || 600)) * 2.5;
    
    g.clear();
    const rays = 24;
    const step = (Math.PI * 2) / rays;
    
    for (let i = 0; i < rays; i++) {
        g.moveTo(cx, cy);
        const angle = i * step;
        const angle2 = angle + (step * 0.5);
        g.arc(cx, cy, radius, angle, angle2);
        g.lineTo(cx, cy);
        g.fill({ color: 0xffffff, alpha: 0.03 });
    }
    g.pivot.set(cx, cy);
    g.position.set(cx, cy);
  }

  public resize(width: number, height: number) {
    // Update internal dimensions immediately
    this.width = width;
    this.height = height;

    if (!this.isInitialized || !this.app || this.isDestroyed) return;
    
    // Safety check before accessing renderer
    if (this.app.renderer) {
       this.app.renderer.resize(width, height);
    }
    
    this.drawRays();
    this.createGradientTexture(); 
    
    if (this.currentState === GameState.IDLE || this.currentState === GameState.BETTING) {
        this.resetScene();
    }
  }

  private safeDestroyApp() {
     if (this.app) {
         try {
             this.app.ticker.remove(this.tickerLoop);
             // Only attempt destroy if renderer is likely valid or app was created
             // destroy({removeView: true}) handles context loss usually
             this.app.destroy({ removeView: true }, { children: true });
         } catch (e) {
             console.warn("AviatorScene: Error during app destroy", e);
         }
         this.app = null;
     }
  }

  public destroy() {
    this.isDestroyed = true;
    this.isInitialized = false;

    // If initializing, defer destruction to init()
    if (this.isInitializing) {
        return;
    }

    this.safeDestroyApp();
  }
}
