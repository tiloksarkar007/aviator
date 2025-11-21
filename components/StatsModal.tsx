import React from 'react';
import { UserStats } from '../types';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: UserStats;
}

export const StatsModal: React.FC<StatsModalProps> = ({ isOpen, onClose, stats }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      {/* Modal Container */}
      <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden transform transition-all animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center border border-slate-700">
                <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">SESSION STATS</h2>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Content Grid */}
        <div className="p-6 grid grid-cols-2 gap-4">
           <StatCard 
             label="Rounds Played" 
             value={stats.roundsPlayed.toString()} 
             icon={
               <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
             }
           />
           <StatCard 
             label="Highest Win" 
             value={`${stats.highestWinMultiplier.toFixed(2)}x`} 
             color="text-amber-400" 
             icon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
             }
           />
           <StatCard 
             label="Total Wagered" 
             value={`$${stats.totalWagered.toLocaleString('en-US', { minimumFractionDigits: 2 })}`} 
             icon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
             }
           />
           <StatCard 
             label="Net Profit/Loss" 
             value={`${stats.totalProfit >= 0 ? '+' : ''}$${stats.totalProfit.toLocaleString('en-US', { minimumFractionDigits: 2 })}`} 
             color={stats.totalProfit > 0 ? 'text-emerald-400' : stats.totalProfit < 0 ? 'text-rose-400' : 'text-slate-200'} 
             highlight 
             icon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
             }
           />
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950/50 border-t border-slate-800 text-center">
           <p className="text-xs text-slate-500">Statistics reset when you refresh the page.</p>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, color = "text-white", highlight = false, icon }: { label: string, value: string, color?: string, highlight?: boolean, icon?: React.ReactNode }) => (
  <div className={`bg-slate-800/40 p-4 rounded-xl border transition-colors hover:bg-slate-800/60 ${highlight ? 'border-slate-600 bg-slate-800/60' : 'border-slate-800'}`}>
    <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
        {icon && <span className="opacity-70">{icon}</span>}
        {label}
    </div>
    <div className={`text-2xl font-mono font-black ${color} tracking-tight truncate`}>{value}</div>
  </div>
);