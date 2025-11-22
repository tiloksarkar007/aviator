/**
 * Layer Manager
 * Manages PixiJS layers for proper rendering order
 */

import { Container } from 'pixi.js';
import { LAYERS } from '../config/constants';

export class LayerManager {
  public readonly stage: Container;
  public readonly background: Container;
  public readonly grid: Container;
  public readonly curve: Container;
  public readonly effects: Container;
  public readonly plane: Container;

  constructor() {
    this.stage = new Container();
    
    // Create layers in rendering order
    this.background = new Container();
    this.grid = new Container();
    this.curve = new Container();
    this.effects = new Container();
    this.plane = new Container();
    
    // Add to stage in correct order
    this.stage.addChild(this.background);
    this.stage.addChild(this.grid);
    this.stage.addChild(this.curve);
    this.stage.addChild(this.effects);
    this.stage.addChild(this.plane);
    
    // Set z-index for clarity
    this.background.zIndex = LAYERS.BACKGROUND;
    this.grid.zIndex = LAYERS.GRID;
    this.curve.zIndex = LAYERS.CURVE;
    this.effects.zIndex = LAYERS.EFFECTS;
    this.plane.zIndex = LAYERS.PLANE;
  }

  /**
   * Destroy all layers
   */
  public destroy(): void {
    this.stage.destroy({ children: true });
  }
}

