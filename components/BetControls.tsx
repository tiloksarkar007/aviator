import React, { useState, useEffect } from 'react';
import { GameState, BetState } from '../types';

interface BetControlsProps {
  gameState: GameState;
  currentMultiplier: number;
  onPlaceBet: (amount: number) => void;
  onCashout: () => void;
  betState: BetState;
  balance: number;
}

export const BetControls: React.FC<BetControlsProps> = ({
  gameState,
  currentMultiplier,
  onPlaceBet,
  onCashout,
  betState,
  balance
}) => {
  const [betAmount, setBetAmount] = useState(10);

  const isBettingPhase = gameState === GameState.BETTING || gameState === GameState.IDLE;
  const isFlying = gameState === GameState.FLYING;
  
  const handleBet = () => {
    if (balance >= betAmount) {
        onPlaceBet(betAmount);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-slate-800 rounded-xl p-4 shadow-2xl border border-slate-700">
      {/* Bet Input and Quick Actions */}
      <div className="flex items-center justify-between mb-4 gap-2">
        <div className="flex flex-col flex-1">
           <label className="text-xs text-slate-400 mb-1 uppercase font-bold tracking-wider">Bet Amount</label>
           <div className="relative">
              <input 
                type="number" 
                value={betAmount}
                onChange={(e) => setBetAmount(Math.max(1, Number(e.target.value)))}
                disabled={betState.active}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg py-3 px-4 text-white font-mono text-lg focus:outline-none focus:border-rose-500 transition-colors disabled:opacity-50"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                <button onClick={() => setBetAmount(betAmount / 2)} className="px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 rounded text-slate-300" disabled={betState.active}>1/2</button>
                <button onClick={() => setBetAmount(betAmount * 2)} className="px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 rounded text-slate-300" disabled={betState.active}>2x</button>
              </div>
           </div>
        </div>
      </div>

      {/* Main Action Button */}
      <div className="h-16">
        {!betState.active ? (
          <button 
            onClick={handleBet}
            disabled={!isBettingPhase}
            className={`w-full h-full rounded-lg font-bold text-xl uppercase tracking-widest transition-all transform active:scale-95
              ${isBettingPhase 
                ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)]' 
                : 'bg-slate-700 text-slate-400 cursor-not-allowed'
              }`}
          >
            {isBettingPhase ? `BET ${betAmount.toFixed(2)}` : "Waiting..."}
          </button>
        ) : (
          <button 
            onClick={onCashout}
            disabled={!isFlying || betState.cashedOut}
            className={`w-full h-full rounded-lg font-bold text-xl uppercase tracking-widest transition-all transform active:scale-95 border-b-4
              ${betState.cashedOut 
                 ? 'bg-slate-700 border-slate-900 text-green-400'
                 : isFlying
                    ? 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 border-orange-800 text-white shadow-[0_0_20px_rgba(245,158,11,0.4)]'
                    : 'bg-slate-600 border-slate-800 text-slate-300'
              }`}
          >
            {betState.cashedOut ? (
              <div className="flex flex-col leading-tight">
                <span className="text-xs text-slate-400">Cashed Out</span>
                <span>{(betAmount * (betState.cashoutMultiplier || 1)).toFixed(2)}</span>
              </div>
            ) : isFlying ? (
              <div className="flex flex-col leading-tight">
                <span className="text-xs text-orange-200">Cash Out</span>
                <span>{(betAmount * currentMultiplier).toFixed(2)}</span>
              </div>
            ) : (
              "Bet Placed"
            )}
          </button>
        )}
      </div>
    </div>
  );
};
