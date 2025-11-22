/**
 * AviatorScene - Main Scene Orchestrator
 * Enterprise-grade, modular PixiJS scene implementation
 */

import { Ticker } from 'pixi.js';
import { GameState } from '../types';
import { SceneManager } from './core/SceneManager';
import { SceneInitializer, SceneComponents } from './core/SceneInitializer';
import { StateHandler } from './core/StateHandler';

export class AviatorScene {
  private sceneManager: SceneManager;
  private components: SceneComponents;
  private stateHandler: StateHandler;
  
  // State
  private currentState: GameState = GameState.IDLE;
  private currentMultiplier: number = 1.0;
  private elapsedSeconds: number = 0;
  private frameSkip: number = 0;
  private deltaTime: number = 0;
  private lastFrameTime: number = 0;

  constructor(container: HTMLDivElement) {
    this.sceneManager = new SceneManager(container);
    
    const dims = this.sceneManager.getDimensions();
    const dimensions = SceneInitializer.getDimensions(dims.width, dims.height, dims.isMobile);
    
    this.components = SceneInitializer.initialize(dimensions, dims.isMobile);
    
    this.stateHandler = new StateHandler(
      this.components.plane,
      this.components.curve,
      this.components.viewportSystem,
      this.components.flightAnimation,
      this.components.flyAwayAnimation,
      this.components.exhaustEffect,
      this.components.explosionEffect,
      this.components.trailEffect,
      this.components.flashEffect,
      dimensions,
      dims.isMobile
    );
  }

  /**
   * Initialize scene
   */
  public async init(): Promise<void> {
    await this.sceneManager.init();
    const app = this.sceneManager.getApp();
    if (!app) throw new Error('Failed to initialize PixiJS application');
    
    app.stage.addChild(this.components.layerManager.stage);
    
    const dims = this.sceneManager.getDimensions();
    const dimensions = SceneInitializer.getDimensions(dims.width, dims.height, dims.isMobile);
    
    SceneInitializer.initializeBackground(
      this.components.background,
      this.components.grid,
      dims.width,
      dims.height,
      dimensions,
      dims.isMobile
    );
    
    const spriteLoaded = await this.components.plane.loadSprite();
    if (!spriteLoaded) {
      this.components.plane.createGraphics();
    }
    
    this.resetScene();

    if (app.ticker) {
      app.ticker.add(this.tickerLoop);
    }
    
    if (app.renderer) {
      app.renderer.render(app.stage);
    }
    
    this.lastFrameTime = performance.now();
  }

  /**
   * Main ticker loop
   */
  private tickerLoop = (ticker: Ticker): void => {
    if (!this.sceneManager.isReady()) return;
    
    const app = this.sceneManager.getApp();
    if (!app) return;
    
    // Calculate deltaTime
    const now = performance.now();
    this.deltaTime = Math.min((now - this.lastFrameTime) / 1000, 0.033);
    this.lastFrameTime = now;
    
    const dims = this.sceneManager.getDimensions();
    const shouldUpdate = !dims.isMobile || this.frameSkip % 2 === 0;
    if (!shouldUpdate && this.currentState !== GameState.FLYING && !this.components.flyAwayAnimation.isActive()) {
      return;
    }
    this.frameSkip++;
    if (this.frameSkip > 1000) this.frameSkip = 0;
    
    // Update based on state
    if (this.currentState === GameState.FLYING) {
      this.stateHandler.updateFlight(this.elapsedSeconds, this.currentMultiplier, this.deltaTime, this.frameSkip);
    } else if (this.currentState === GameState.CRASHED && this.components.flyAwayAnimation.isActive()) {
      this.stateHandler.updateFlyAway(this.deltaTime);
    } else if (this.currentState === GameState.BETTING) {
      this.stateHandler.updateBetting(ticker);
    } else {
      this.stateHandler.updateIdle();
    }
  };

  /**
   * Update game state
   */
  public updateState(state: GameState, multiplier: number, elapsedSeconds: number): void {
    if (!this.sceneManager.isReady()) return;
    
    if (typeof multiplier !== 'number' || multiplier < 1 || isNaN(multiplier)) return;
    if (typeof elapsedSeconds !== 'number' || elapsedSeconds < 0 || isNaN(elapsedSeconds)) return;

    this.currentMultiplier = multiplier;
    this.elapsedSeconds = elapsedSeconds;

    if (state !== this.currentState) {
      if (state === GameState.BETTING) {
        this.resetScene();
      } else if (state === GameState.CRASHED) {
        const planePos = this.components.plane.getPosition();
        this.stateHandler.handleStateTransition(
          state,
          this.currentState,
          planePos,
          this.components.plane.getRotation()
        );
      }
      this.currentState = state;
    }

    if (state === GameState.FLYING) {
      this.components.plane.setVisible(true);
      const threshold = this.sceneManager.getDimensions().isMobile ? 0.08 : 0.05;
      this.stateHandler.addCurvePoint(elapsedSeconds, multiplier, threshold);
    }
  }

  /**
   * Reset scene
   */
  private resetScene(): void {
    this.stateHandler.reset();
    this.stateHandler.drawInitialCurve();
  }

  /**
   * Resize scene
   */
  public resize(width: number, height: number): void {
    this.sceneManager.resize(width, height);
    const dims = this.sceneManager.getDimensions();
    const dimensions = SceneInitializer.getDimensions(dims.width, dims.height, dims.isMobile);
    
    SceneInitializer.initializeBackground(
      this.components.background,
      this.components.grid,
      dims.width,
      dims.height,
      dimensions,
      dims.isMobile
    );
    
    if (this.currentState === GameState.IDLE || this.currentState === GameState.BETTING) {
        this.resetScene();
    }
  }

  /**
   * Destroy scene
   */
  public destroy(): void {
    const app = this.sceneManager.getApp();
    if (app?.ticker) {
      app.ticker.remove(this.tickerLoop);
    }
    
    this.components.background.destroy();
    this.components.grid.destroy();
    this.components.curve.destroy();
    this.components.plane.destroy();
    this.components.exhaustEffect.destroy();
    this.components.explosionEffect.destroy();
    this.components.trailEffect.destroy();
    this.components.flashEffect.destroy();
    this.components.layerManager.destroy();
    this.sceneManager.destroy();
  }
}
