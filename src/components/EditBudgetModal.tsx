import React, { useState } from 'react';
import { X, Check, Wallet, ArrowRight } from 'lucide-react';
import { formatPKR } from '../types';

interface EditBudgetModalProps {
  currentBudget: number;
  totalSpent: number;
  onSaveBudget: (newBudget: number) => void;
  onClose: () => void;
}

export const EditBudgetModal: React.FC<EditBudgetModalProps> = ({
  currentBudget,
  totalSpent,
  onSaveBudget,
  onClose,
}) => {
  const [budgetInput, setBudgetInput] = useState<string>(currentBudget.toString());
  const [error, setError] = useState<string | null>(null);

  const presets = [50000, 80000, 100000, 120000, 150000, 200000];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(budgetInput.replace(/,/g, ''));
    if (isNaN(val) || val <= 0) {
      setError('Please enter a valid positive budget amount in PKR.');
      return;
    }
    onSaveBudget(val);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-sm w-full overflow-hidden shadow-2xl border border-slate-100 flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Set Monthly Budget</h2>
              <p className="text-xs text-slate-400">Monthly expense limit in PKR</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-2.5 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">
              {error}
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
              Monthly Budget Amount (PKR)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                Rs.
              </span>
              <input
                type="number"
                step="1000"
                min="1000"
                required
                value={budgetInput}
                onChange={(e) => {
                  setBudgetInput(e.target.value);
                  setError(null);
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-3 text-base font-extrabold text-slate-900 focus:outline-none focus:border-purple-500 focus:bg-white"
              />
            </div>
          </div>

          {/* Quick presets */}
          <div>
            <span className="text-[11px] font-semibold text-slate-400 block mb-1.5">
              Quick presets:
            </span>
            <div className="grid grid-cols-3 gap-1.5">
              {presets.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => {
                    setBudgetInput(amt.toString());
                    setError(null);
                  }}
                  className={`py-1.5 px-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    budgetInput === amt.toString()
                      ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {formatPKR(amt)}
                </button>
              ))}
            </div>
          </div>

          <div className="p-3 bg-purple-50 rounded-2xl border border-purple-100 text-xs text-purple-900">
            <span className="font-bold">Current Spent: </span>
            {formatPKR(totalSpent)}
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-600/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>Save Budget</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
