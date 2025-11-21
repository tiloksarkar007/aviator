export enum GameState {
  IDLE = 'IDLE',         // Waiting for next round
  BETTING = 'BETTING',   // Betting phase open
  FLYING = 'FLYING',     // Plane is flying, multiplier increasing
  CRASHED = 'CRASHED',   // Plane crashed, round over
}

export interface GameHistoryItem {
  multiplier: number;
  roundId: number;
  timestamp: number;
}

export interface EngineState {
  gameState: GameState;
  currentMultiplier: number;
  countdown: number; // Seconds remaining in betting phase
  history: GameHistoryItem[];
}

export type EngineEventListener = (state: EngineState) => void;

export interface BetState {
  amount: number;
  active: boolean;
  cashedOut: boolean;
  cashoutMultiplier: number | null;
  profit: number;
}

export interface UserStats {
  roundsPlayed: number;
  totalWagered: number;
  totalProfit: number;
  highestWinMultiplier: number;
}