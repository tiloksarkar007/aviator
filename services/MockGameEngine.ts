import { GameState, EngineState, GameHistoryItem, EngineEventListener } from '../types';

export class MockGameEngine {
  private state: EngineState = {
    gameState: GameState.IDLE,
    currentMultiplier: 1.00,
    countdown: 0,
    history: []
  };

  private listeners: Set<EngineEventListener> = new Set();
  private crashPoint: number = 1.00;
  private startTime: number = 0;
  private loopInterval: number | null = null;
  private roundIdCounter: number = 1;

  // Constants
  private readonly GROWTH_RATE = 0.00006; // Controls how fast the curve accelerates
  private readonly BETTING_DURATION = 5; // Seconds
  private readonly POST_CRASH_DURATION = 3; // Seconds

  constructor() {
    this.startLoop();
  }

  public subscribe(listener: EngineEventListener): () => void {
    this.listeners.add(listener);
    listener(this.state); // Immediate update
    return () => this.listeners.delete(listener);
  }

  private emit() {
    this.listeners.forEach(listener => listener({ ...this.state }));
  }

  private startLoop() {
    // Start the first round sequence
    this.enterBettingPhase();

    // Main ticker (runs at ~60fps logic for smoothness)
    this.loopInterval = window.setInterval(() => {
      this.tick();
    }, 16);
  }

  private tick() {
    const now = Date.now();

    switch (this.state.gameState) {
      case GameState.BETTING:
        // Handle countdown
        const elapsed = (now - this.startTime) / 1000;
        const remaining = Math.max(0, this.BETTING_DURATION - elapsed);
        this.state.countdown = remaining;
        
        if (remaining <= 0) {
          this.enterFlyingPhase();
        }
        break;

      case GameState.FLYING:
        // Calculate multiplier based on exponential growth
        const flightTime = now - this.startTime;
        // Simple exponential curve: 1.0 * e^(kt)
        // Using a slightly adjusted formula for "feel"
        // Multiplier = 1 + (0.06 * t) + (growth * t^2)... 
        // Let's use standard E: M = E ^ (0.065 * seconds)
        const seconds = flightTime / 1000;
        const rawMultiplier = Math.exp(0.065 * seconds);
        
        this.state.currentMultiplier = parseFloat(rawMultiplier.toFixed(2));

        if (this.state.currentMultiplier >= this.crashPoint) {
          this.enterCrashedPhase();
        }
        break;

      case GameState.CRASHED:
        if ((now - this.startTime) / 1000 > this.POST_CRASH_DURATION) {
          this.enterBettingPhase();
        }
        break;
        
      case GameState.IDLE:
        // Should generally not stay here long in this loop
        break;
    }

    this.emit();
  }

  private enterBettingPhase() {
    this.state.gameState = GameState.BETTING;
    this.state.currentMultiplier = 1.00;
    this.startTime = Date.now();
    this.generateNextCrashPoint();
  }

  private enterFlyingPhase() {
    this.state.gameState = GameState.FLYING;
    this.state.currentMultiplier = 1.00;
    this.startTime = Date.now(); // Reset start time for flight calculation
  }

  private enterCrashedPhase() {
    this.state.gameState = GameState.CRASHED;
    this.state.currentMultiplier = this.crashPoint; // Snap to exact crash point
    this.startTime = Date.now(); // Reset for post-crash delay
    
    // Add to history
    const newItem: GameHistoryItem = {
      multiplier: this.crashPoint,
      roundId: this.roundIdCounter++,
      timestamp: Date.now()
    };
    
    // Keep last 20 items
    this.state.history = [newItem, ...this.state.history].slice(0, 20);
  }

  private generateNextCrashPoint() {
    // Provably fair-ish simulation
    // 1% instant crash chance (1.00x)
    if (Math.random() < 0.01) {
      this.crashPoint = 1.00;
      return;
    }

    // Inverse distribution: 0.99 / (1 - random)
    // This mimics the distribution of real crash games
    const r = Math.random();
    let crash = 0.99 / (1 - r);
    
    // Cap at reasonable max for prototype (e.g., 100x)
    if (crash > 100) crash = 100;
    if (crash < 1) crash = 1;

    this.crashPoint = parseFloat(crash.toFixed(2));
    console.log(`[MOCK ENGINE] Next crash point: ${this.crashPoint}x`);
  }
  
  // API for UI interactions
  public getCurrentMultiplier() {
    return this.state.currentMultiplier;
  }
  
  public cleanup() {
    if (this.loopInterval) clearInterval(this.loopInterval);
    this.listeners.clear();
  }
}
