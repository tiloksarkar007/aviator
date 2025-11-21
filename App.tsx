import React, { useEffect, useRef, useState } from 'react';
import { MockGameEngine } from './services/MockGameEngine';
import { AviatorScene } from './game/AviatorScene';
import { BetControls } from './components/BetControls';
import { StatsModal } from './components/StatsModal';
import { GameState, EngineState, BetState, UserStats } from './types';

const INITIAL_BALANCE = 2500;

const App: React.FC = () => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<MockGameEngine | null>(null);
  const sceneRef = useRef<AviatorScene | null>(null);
  
  // Game State
  const [gameState, setGameState] = useState<GameState>(GameState.IDLE);
  const [multiplier, setMultiplier] = useState(1.00);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [history, setHistory] = useState<EngineState['history']>([]);
  
  // User State
  const [balance, setBalance] = useState(INITIAL_BALANCE);
  const [betState, setBetState] = useState<BetState>({
    amount: 0,
    active: false,
    cashedOut: false,
    cashoutMultiplier: null,
    profit: 0
  });

  // Statistics State
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [userStats, setUserStats] = useState<UserStats>({
    roundsPlayed: 0,
    totalWagered: 0,
    totalProfit: 0,
    highestWinMultiplier: 0
  });

  // Initialization
  useEffect(() => {
    const engine = new MockGameEngine();
    engineRef.current = engine;

    let startTime = Date.now();

    const unsubscribe = engine.subscribe((state) => {
      setGameState(state.gameState);
      setMultiplier(state.currentMultiplier);
      setCountdown(state.countdown);
      setHistory(state.history);
      
      if (state.gameState === GameState.FLYING) {
         if (state.currentMultiplier === 1.0) startTime = Date.now(); // Reset on start
         setElapsedTime((Date.now() - startTime) / 1000);
      } else {
         setElapsedTime(0);
      }
    });

    return () => {
      unsubscribe();
      engine.cleanup();
    };
  }, []);

  // Pixi Scene Setup
  useEffect(() => {
    let isMounted = true;
    let resizeObserver: ResizeObserver | null = null;
    
    const initGame = async () => {
       if (canvasRef.current) {
          // Ensure any previous scene is properly destroyed before creating a new one
          if (sceneRef.current) {
             sceneRef.current.destroy();
          }

          const scene = new AviatorScene(canvasRef.current);
          sceneRef.current = scene; 
          
          await scene.init();
          
          if (!isMounted) {
             scene.destroy();
             sceneRef.current = null;
             return;
          }

          // Setup ResizeObserver to handle container resizing robustly
          // This is critical for ensuring the canvas picks up the correct size after layout
          if (canvasRef.current && scene) {
             resizeObserver = new ResizeObserver((entries) => {
                for (const entry of entries) {
                   const { width, height } = entry.contentRect;
                   if (width > 0 && height > 0) {
                      scene.resize(width, height);
                   }
                }
             });
             resizeObserver.observe(canvasRef.current);
          }
       }
    };
    
    initGame();
    
    return () => {
        isMounted = false;
        if (resizeObserver) {
            resizeObserver.disconnect();
        }
        
        if (sceneRef.current) {
             sceneRef.current.destroy();
             sceneRef.current = null;
        }
    };
  }, []);

  // Sync Engine State to Visuals
  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.updateState(gameState, multiplier, elapsedTime);
    }
  }, [gameState, multiplier, elapsedTime]);

  // Logic: Handle Crash vs Bet State
  useEffect(() => {
    if (gameState === GameState.CRASHED && betState.active && !betState.cashedOut) {
      setBetState(prev => ({ ...prev, active: false, cashedOut: false }));
      // Profit already deducted when bet placed (net negative), no update needed here unless we track "losses" explicitly
    } else if (gameState === GameState.BETTING && betState.active && betState.cashedOut) {
        setBetState({
            amount: 0,
            active: false,
            cashedOut: false,
            cashoutMultiplier: null,
            profit: 0
        });
    }
  }, [gameState]);

  const handlePlaceBet = (amount: number) => {
    setBalance(prev => prev - amount);
    setBetState({
      amount,
      active: true,
      cashedOut: false,
      cashoutMultiplier: null,
      profit: 0
    });
    // Update Stats: Count round, add wager, subtract wager from profit (initial cost)
    setUserStats(prev => ({
        ...prev,
        roundsPlayed: prev.roundsPlayed + 1,
        totalWagered: prev.totalWagered + amount,
        totalProfit: prev.totalProfit - amount
    }));
  };

  const handleCashout = () => {
    if (betState.active && !betState.cashedOut && gameState === GameState.FLYING) {
      const winAmount = betState.amount * multiplier;
      setBalance(prev => prev + winAmount);
      setBetState(prev => ({
        ...prev,
        cashedOut: true,
        cashoutMultiplier: multiplier,
        profit: winAmount - prev.amount
      }));
      // Update Stats: Add total return to profit
      setUserStats(prev => ({
          ...prev,
          totalProfit: prev.totalProfit + winAmount,
          highestWinMultiplier: Math.max(prev.highestWinMultiplier, multiplier)
      }));
    }
  };

  // format multiplier color
  const getMultiplierColor = () => {
    if (gameState === GameState.CRASHED) return 'text-rose-500 drop-shadow-[0_0_15px_rgba(225,29,72,0.5)]';
    if (multiplier > 10) return 'text-amber-400 drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]';
    if (multiplier > 2) return 'text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.5)]';
    return 'text-white drop-shadow-md';
  };

  return (
    <div className="flex flex-col h-screen bg-slate-900 text-white font-sans overflow-hidden select-none">
      {/* Header */}
      <header className="flex items-center justify-between px-4 h-16 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 shrink-0 z-20 relative shadow-lg">
        <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-rose-600 rounded-lg flex items-center justify-center shadow-rose-500/20 shadow-lg">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
            </div>
            <div className="text-2xl font-black tracking-tighter text-white">AVIATOR<span className="text-rose-500">PRO</span></div>
        </div>
        
        <div className="flex items-center gap-4 md:gap-6">
             {/* Stats Button */}
            <button 
                onClick={() => setIsStatsOpen(true)}
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all text-slate-300 text-xs font-bold uppercase tracking-wide group"
            >
                <svg className="w-4 h-4 text-slate-400 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Stats
            </button>

            <div className="flex flex-col items-end">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Balance</span>
                <span className="text-emerald-400 font-mono font-black text-xl tracking-tight drop-shadow-sm">${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="hidden md:flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-xs font-bold text-slate-300">LIVE</span>
            </div>
        </div>
      </header>

      {/* History Bar */}
      <div className="h-10 bg-slate-950 flex items-center px-3 gap-2 overflow-hidden shrink-0 border-b border-slate-800 relative z-10">
         <div className="px-2 text-xs font-bold text-slate-500 uppercase tracking-wider border-r border-slate-800 mr-1">History</div>
        {history.map((item) => (
            <div 
                key={item.roundId} 
                className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold transition-all hover:scale-105 cursor-default
                    ${item.multiplier >= 10.0 ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                      item.multiplier >= 2.0 ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 
                      'bg-slate-800 text-slate-400 border border-slate-700'}`}
            >
                {item.multiplier.toFixed(2)}x
            </div>
        ))}
        <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-slate-950 to-transparent z-10 pointer-events-none"></div>
      </div>

      {/* Main Game Area */}
      <main className="flex-1 relative flex flex-col">
        {/* Canvas Container */}
        <div ref={canvasRef} className="absolute inset-0 w-full h-full z-0 bg-[#0f172a]" />
        
        {/* Center Overlay (Multiplier / Loading) */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center pointer-events-none p-6">
            {gameState === GameState.BETTING ? (
                <div className="flex flex-col items-center">
                     <div className="relative mb-4">
                        <div className="absolute inset-0 bg-rose-500 blur-2xl opacity-20 animate-pulse rounded-full"></div>
                        <svg className="w-20 h-20 text-rose-500 animate-spin-slow relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                     </div>
                    <div className="text-4xl md:text-5xl font-black text-white italic tracking-tighter mb-2 drop-shadow-lg">
                        WAITING FOR NEXT ROUND
                    </div>
                    <div className="w-64 h-1.5 bg-slate-800 rounded-full mt-4 overflow-hidden shadow-inner border border-slate-700/50">
                        <div 
                            className="h-full bg-rose-500 shadow-[0_0_10px_rgba(225,29,72,0.8)] transition-all duration-100 ease-linear" 
                            style={{ width: `${(countdown / 5) * 100}%` }}
                        />
                    </div>
                    <div className="text-rose-400 font-mono mt-2 font-bold">STARTING IN {countdown.toFixed(1)}s</div>
                </div>
            ) : gameState === GameState.FLYING ? (
                 <div className={`text-8xl md:text-[10rem] font-black font-mono tracking-tighter transition-all duration-75 transform scale-100 ${getMultiplierColor()}`}>
                    {multiplier.toFixed(2)}x
                 </div>
            ) : gameState === GameState.CRASHED ? (
                <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
                    <div className="text-xl md:text-2xl text-rose-500 font-bold uppercase tracking-[0.2em] mb-2 drop-shadow-md">Round Crashed At</div>
                    <div className="text-7xl md:text-9xl font-black text-slate-200 font-mono drop-shadow-2xl opacity-50">{multiplier.toFixed(2)}x</div>
                    <div className="mt-8 px-8 py-3 bg-rose-500/10 border border-rose-500/50 rounded-full backdrop-blur-md">
                        <span className="text-rose-500 font-bold uppercase tracking-widest text-sm">Plane Flew Away</span>
                    </div>
                </div>
            ) : null}
        </div>

        {/* Bottom Controls Area */}
        <div className="relative z-20 p-4 bg-gradient-to-t from-slate-950 via-slate-900/95 to-transparent pt-12">
            <BetControls 
                gameState={gameState}
                currentMultiplier={multiplier}
                onPlaceBet={handlePlaceBet}
                onCashout={handleCashout}
                betState={betState}
                balance={balance}
            />
        </div>

        {/* Statistics Modal */}
        <StatsModal 
            isOpen={isStatsOpen} 
            onClose={() => setIsStatsOpen(false)} 
            stats={userStats} 
        />
      </main>
    </div>
  );
};

export default App;