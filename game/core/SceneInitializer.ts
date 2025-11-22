/**
 * Scene Initializer
 * Handles scene component initialization
 */

import { LayerManager } from './LayerManager';
import { ParticleSystem } from '../systems/ParticleSystem';
import { PhysicsSystem } from '../systems/PhysicsSystem';
import { ViewportSystem } from '../systems/ViewportSystem';
import { Background } from '../components/Background';
import { Grid } from '../components/Grid';
import { Curve } from '../components/Curve';
import { Plane } from '../components/Plane';
import { ExhaustEffect } from '../effects/ExhaustEffect';
import { ExplosionEffect } from '../effects/ExplosionEffect';
import { TrailEffect } from '../effects/TrailEffect';
import { FlashEffect } from '../effects/FlashEffect';
import { FlightAnimation } from '../animation/FlightAnimation';
import { FlyAwayAnimation } from '../animation/FlyAwayAnimation';
import { RESPONSIVE } from '../config/constants';
import { SceneDimensions } from '../types';

export interface SceneComponents {
  layerManager: LayerManager;
  particleSystem: ParticleSystem;
  physicsSystem: PhysicsSystem;
  viewportSystem: ViewportSystem;
  background: Background;
  grid: Grid;
  curve: Curve;
  plane: Plane;
  exhaustEffect: ExhaustEffect;
  explosionEffect: ExplosionEffect;
  trailEffect: TrailEffect;
  flashEffect: FlashEffect;
  flightAnimation: FlightAnimation;
  flyAwayAnimation: FlyAwayAnimation;
}

export class SceneInitializer {
  /**
   * Initialize all scene components
   */
  public static initialize(
    dimensions: SceneDimensions,
    isMobile: boolean
  ): SceneComponents {
    const layerManager = new LayerManager();
    const particleSystem = new ParticleSystem();
    const physicsSystem = new PhysicsSystem();
    const viewportSystem = new ViewportSystem();
    
    const background = new Background(layerManager.background);
    const grid = new Grid(layerManager.grid);
    const curve = new Curve(layerManager.curve);
    const plane = new Plane(layerManager.plane, dimensions, isMobile);
    
    const exhaustEffect = new ExhaustEffect(
      layerManager.effects,
      particleSystem,
      physicsSystem,
      isMobile
    );
    const explosionEffect = new ExplosionEffect(
      layerManager.effects,
      particleSystem,
      physicsSystem,
      isMobile
    );
    const trailEffect = new TrailEffect(layerManager.effects, isMobile);
    const flashEffect = new FlashEffect(layerManager.effects, dimensions.width, dimensions.height);
    
    const flightAnimation = new FlightAnimation();
    const flyAwayAnimation = new FlyAwayAnimation(); // No physics system for performance
    
    return {
      layerManager,
      particleSystem,
      physicsSystem,
      viewportSystem,
      background,
      grid,
      curve,
      plane,
      exhaustEffect,
      explosionEffect,
      trailEffect,
      flashEffect,
      flightAnimation,
      flyAwayAnimation
    };
  }

  /**
   * Get dimensions based on scene manager dimensions
   */
  public static getDimensions(width: number, height: number, isMobile: boolean): SceneDimensions {
    return {
      width,
      height,
      paddingLeft: isMobile ? RESPONSIVE.MOBILE_PADDING : RESPONSIVE.DESKTOP_PADDING,
      paddingBottom: isMobile ? RESPONSIVE.MOBILE_PADDING : RESPONSIVE.DESKTOP_PADDING
    };
  }

  /**
   * Initialize background and grid
   */
  public static initializeBackground(
    background: Background,
    grid: Grid,
    width: number,
    height: number,
    dimensions: SceneDimensions,
    isMobile: boolean
  ): void {
    background.draw(width, height);
    grid.draw(
      width,
      height,
      dimensions.paddingLeft,
      dimensions.height - dimensions.paddingBottom,
      isMobile
    );
  }
}

