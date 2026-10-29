import React from 'react';
import { formatPKR } from '../types';
import { CreditCard, ArrowUpRight, ArrowDownLeft, Plus, Camera, Sparkles, TrendingUp } from 'lucide-react';

interface FinanceCardProps {
  totalSpentPKR: number;
  monthlyBudgetPKR: number;
  onOpenAddModal: (mode?: 'text' | 'receipt' | 'manual') => void;
  onAdjustBudget: () => void;
}

export const FinanceCard: React.FC<FinanceCardProps> = ({
  totalSpentPKR,
  monthlyBudgetPKR,
  onOpenAddModal,
  onAdjustBudget,
}) => {
  // Assume a base salary or starting balance
  const remainingBudget = Math.max(0, monthlyBudgetPKR - totalSpentPKR);
  const spentPercent = Math.min(Math.round((totalSpentPKR / (monthlyBudgetPKR || 1)) * 100), 100);

  return (
    <div className="space-y-4">
      {/* Dark Luxury Credit / Balance Card (Matching Reference 1 & Reference 2) */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 p-6 sm:p-7 text-white shadow-xl shadow-slate-900/15">
        {/* Subtle geometric pattern rings */}
        <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-white/5 blur-2xl pointer-events-none" />
        <div className="absolute right-10 -bottom-10 w-44 h-44 rounded-full bg-indigo-500/10 blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col justify-between h-48 sm:h-52">
          {/* Card Top Row */}
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-medium text-slate-300 tracking-wide uppercase">
                Available Balance
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1 text-white">
                {formatPKR(remainingBudget)}
              </div>
            </div>

            {/* Mastercard Style Circles */}
            <div className="flex items-center -space-x-2">
              <div className="w-8 h-8 rounded-full bg-rose-500/90 shadow-sm" />
              <div className="w-8 h-8 rounded-full bg-amber-400/90 shadow-sm" />
            </div>
          </div>

          {/* Chip and Contactless representation */}
          <div className="flex items-center justify-between">
            <div className="w-9 h-7 rounded-md bg-gradient-to-tr from-amber-200 to-amber-400 border border-amber-500/40 shadow-xs flex items-center justify-center">
              <div className="w-6 h-4 border border-amber-800/30 rounded-xs" />
            </div>
            <div className="text-xs text-slate-400 font-mono tracking-wider">
              VISA / MASTERCARD
            </div>
          </div>

          {/* Card Bottom Row */}
          <div className="flex items-end justify-between text-xs font-mono tracking-widest text-slate-300">
            <div>2944 •••• •••• 1905</div>
            <div className="text-[11px] font-sans text-slate-400">10 / 28</div>
          </div>
        </div>
      </div>

      {/* Two Colorful Stats Cards (Matching Screenshot 2: Purple & Orange Cards) */}
      <div className="grid grid-cols-2 gap-3.5 sm:gap-4">
        {/* Purple Card: Monthly Budget */}
        <div
          onClick={onAdjustBudget}
          className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-2xl p-4 sm:p-5 text-white shadow-md shadow-purple-600/20 relative overflow-hidden cursor-pointer hover:shadow-lg transition-all group"
        >
          <div className="absolute top-2 right-2 p-1.5 rounded-full bg-white/10 opacity-70 group-hover:opacity-100 transition-opacity">
            <ArrowDownLeft className="w-4 h-4" />
          </div>
          <div className="text-xs font-medium text-purple-200">Total Budget</div>
          <div className="text-lg sm:text-xl font-bold tracking-tight mt-1">
            {formatPKR(monthlyBudgetPKR)}
          </div>
          <div className="mt-2 text-[11px] text-purple-200 flex items-center gap-1">
            <span>Tap to edit</span>
          </div>
        </div>

        {/* Orange Card: Total Expense */}
        <div className="bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl p-4 sm:p-5 text-white shadow-md shadow-orange-500/20 relative overflow-hidden">
          <div className="absolute top-2 right-2 p-1.5 rounded-full bg-white/10">
            <ArrowUpRight className="w-4 h-4" />
          </div>
          <div className="text-xs font-medium text-orange-100">Total Expense</div>
          <div className="text-lg sm:text-xl font-bold tracking-tight mt-1">
            {formatPKR(totalSpentPKR)}
          </div>
          <div className="mt-2 text-[11px] text-orange-100 font-medium">
            {spentPercent}% of monthly limit
          </div>
        </div>
      </div>

      {/* Action Shortcut Pills */}
      <div className="flex items-center gap-2 pt-1">
        <button
          type="button"
          onClick={() => onOpenAddModal('text')}
          className="flex-1 py-2.5 px-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-medium text-xs shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 text-orange-500" />
          <span>Quick Note / AI</span>
        </button>

        <button
          type="button"
          onClick={() => onOpenAddModal('receipt')}
          className="flex-1 py-2.5 px-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-medium text-xs shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <Camera className="w-4 h-4 text-indigo-500" />
          <span>Scan Receipt</span>
        </button>

        <button
          type="button"
          onClick={() => onOpenAddModal('manual')}
          className="flex-1 py-2.5 px-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-medium text-xs shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <CreditCard className="w-4 h-4 text-emerald-500" />
          <span>Manual Entry</span>
        </button>
      </div>
    </div>
  );
};
