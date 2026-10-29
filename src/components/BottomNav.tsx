import React from 'react';
import { Home, CreditCard, Plus, PieChart, RotateCcw } from 'lucide-react';

interface BottomNavProps {
  activeTab: 'home' | 'expenses' | 'analytics';
  onTabChange: (tab: 'home' | 'expenses' | 'analytics') => void;
  onOpenAddModal: () => void;
  onResetData: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
  onOpenAddModal,
  onResetData,
}) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-100 py-2 sm:py-2.5 px-6 shadow-lg sm:max-w-md sm:mx-auto sm:bottom-4 sm:rounded-3xl sm:border sm:shadow-xl">
      <div className="flex items-center justify-between max-w-sm mx-auto">
        {/* Home */}
        <button
          type="button"
          onClick={() => onTabChange('home')}
          className={`flex flex-col items-center gap-1 p-1.5 transition-colors cursor-pointer ${
            activeTab === 'home' ? 'text-orange-500 font-bold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px]">Home</span>
        </button>

        {/* Expenses */}
        <button
          type="button"
          onClick={() => onTabChange('expenses')}
          className={`flex flex-col items-center gap-1 p-1.5 transition-colors cursor-pointer ${
            activeTab === 'expenses' ? 'text-orange-500 font-bold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <CreditCard className="w-5 h-5" />
          <span className="text-[10px]">Expenses</span>
        </button>

        {/* Center Prominent Orange Plus Button (matching screenshot) */}
        <div className="-mt-6">
          <button
            type="button"
            onClick={onOpenAddModal}
            className="w-12 h-12 rounded-full bg-gradient-to-tr from-orange-600 to-orange-400 text-white flex items-center justify-center shadow-lg shadow-orange-500/40 hover:scale-105 active:scale-95 transition-all cursor-pointer ring-4 ring-white"
            title="Add Expense"
          >
            <Plus className="w-6 h-6 stroke-[3]" />
          </button>
        </div>

        {/* Analytics */}
        <button
          type="button"
          onClick={() => onTabChange('analytics')}
          className={`flex flex-col items-center gap-1 p-1.5 transition-colors cursor-pointer ${
            activeTab === 'analytics' ? 'text-orange-500 font-bold' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <PieChart className="w-5 h-5" />
          <span className="text-[10px]">Analytics</span>
        </button>

        {/* Reset Demo Data */}
        <button
          type="button"
          onClick={onResetData}
          title="Reset to sample data"
          className="flex flex-col items-center gap-1 p-1.5 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
        >
          <RotateCcw className="w-5 h-5" />
          <span className="text-[10px]">Reset</span>
        </button>
      </div>
    </nav>
  );
};
