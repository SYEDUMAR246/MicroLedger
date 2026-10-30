import React from 'react';
import { ArrowUpRight, Camera, FilePenLine, Sparkles, Wallet, ArrowDownRight } from 'lucide-react';
import { formatPKR, type StoredTransaction } from '../types';
import { monthSummary } from '../lib/planning';

interface FinanceCardProps {
  transactions: StoredTransaction[];
  month: string;
  monthlyBudgetPKR: number;
  onOpenAddModal: (mode?: 'text' | 'receipt' | 'manual') => void;
  onAdjustBudget: () => void;
}

export function FinanceCard({transactions, month, monthlyBudgetPKR, onOpenAddModal, onAdjustBudget}: FinanceCardProps) {
  const summary = monthSummary(transactions, monthlyBudgetPKR, month);
  const usage = summary.spent / monthlyBudgetPKR * 100;
  return <section aria-label="Monthly overview" className="space-y-4">
    <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
      <div className="relative overflow-hidden rounded-3xl bg-slate-950 p-6 sm:p-8 text-white shadow-xl shadow-slate-900/10">
        <div className="absolute -right-12 -top-20 w-64 h-64 rounded-full border-[32px] border-white/[0.035] pointer-events-none" />
        <div className="relative">
          <div className="flex justify-between gap-3 items-start">
            <p className="text-xs font-semibold tracking-[0.18em] uppercase text-slate-300">Your month, in focus</p>
            <Wallet className="w-5 h-5 text-orange-300" />
          </div>
          <p className="text-sm text-slate-300 mt-7">{summary.remaining < 0 ? 'Over your monthly budget' : 'Left in your monthly budget'}</p>
          <p className="text-3xl sm:text-5xl font-bold tracking-tight mt-2 break-words">{formatPKR(Math.abs(summary.remaining))}</p>
          <div className="mt-6 h-2 rounded-full bg-white/10 overflow-hidden" role="progressbar" aria-label="Monthly budget used" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.min(100, Math.round(usage))}>
            <div className={'h-full rounded-full ' + (usage > 100 ? 'bg-rose-400' : 'bg-orange-400')} style={{width:Math.min(100,usage) + '%'}} />
          </div>
          <div className="flex justify-between items-center gap-3 mt-3 text-xs text-slate-300">
            <span>{usage.toFixed(1)}% of {formatPKR(monthlyBudgetPKR)}</span>
            <button type="button" onClick={onAdjustBudget} className="text-white underline underline-offset-4 shrink-0">Edit budget</button>
          </div>
        </div>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-1 gap-4">
        <div className="rounded-3xl border border-slate-200/70 bg-white p-6">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Spent this month</p>
          <p className="text-2xl font-bold text-slate-900 mt-2">{formatPKR(summary.spent)}</p>
          <div className="flex items-start gap-1.5 mt-3 text-xs text-slate-500">
            {summary.difference > 0 ? <ArrowUpRight className="w-4 h-4 shrink-0" /> : <ArrowDownRight className="w-4 h-4 shrink-0" />}
            <span>{formatPKR(Math.abs(summary.difference))} {summary.difference > 0 ? 'more' : summary.difference < 0 ? 'less' : 'change'} vs previous month. Whole-month totals; this month may be incomplete.</span>
          </div>
        </div>
        <div className="rounded-3xl border border-orange-100 bg-orange-50/70 p-6">
          <p className="text-xs font-semibold text-orange-800 uppercase tracking-wider">Daily allowance</p>
          <p className="text-2xl font-bold text-slate-900 mt-2">{summary.dailyAllowance === null ? 'Month complete' : formatPKR(summary.dailyAllowance)}</p>
          <p className="text-xs text-slate-600 mt-3">{summary.daysLeft ? 'Remaining budget ÷ ' + summary.daysLeft + ' calendar days, including today for the current month. Unlogged bills are not deducted.' : 'Choose the current or an upcoming month to plan ahead.'}</p>
        </div>
      </div>
    </div>
    <div className="grid grid-cols-3 gap-2 sm:gap-3">
      {[{mode:'text' as const, label:'Smart Note', icon:Sparkles}, {mode:'receipt' as const,label:'Scan receipt',icon:Camera}, {mode:'manual' as const,label:'Manual entry',icon:FilePenLine}].map(action =>
        <button type="button" key={action.mode} onClick={() => onOpenAddModal(action.mode)} className="rounded-2xl bg-white border border-slate-200/70 px-2 py-3.5 text-xs sm:text-sm font-semibold text-slate-700 hover:border-orange-300 hover:bg-orange-50 transition-colors flex items-center justify-center gap-2">
          <action.icon className="w-4 h-4 text-orange-600 shrink-0" /><span>{action.label}</span>
        </button>)}
    </div>
  </section>;
}
