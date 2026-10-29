import React from 'react';
import { Bell, Plus } from 'lucide-react';

interface NavbarProps {
  activeTab: 'home' | 'expenses' | 'analytics';
  unreadCount?: number;
  onTabChange: (tab: 'home' | 'expenses' | 'analytics') => void;
  onOpenAddModal: () => void;
  onOpenNotifications: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  unreadCount = 0,
  onTabChange,
  onOpenAddModal,
  onOpenNotifications,
}) => {
  return (
    <header className="bg-white border-b border-slate-100 sticky top-0 z-30 shadow-xs">
      <div className="max-w-xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
        {/* User Profile Greeting */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-600 p-0.5 shadow-sm">
            <div className="w-full h-full bg-slate-100 rounded-full flex items-center justify-center text-sm font-bold text-indigo-700">
              UM
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Welcome back,</div>
            <h1 className="text-base font-bold text-slate-800 leading-tight">Mumar's Wallet</h1>
          </div>
        </div>

        {/* Desktop Navigation Tabs */}
        <nav className="hidden sm:flex items-center bg-slate-100/80 p-1 rounded-2xl border border-slate-200/60">
          <button
            type="button"
            onClick={() => onTabChange('home')}
            className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'home'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Home
          </button>
          <button
            type="button"
            onClick={() => onTabChange('expenses')}
            className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'expenses'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Transactions
          </button>
          <button
            type="button"
            onClick={() => onTabChange('analytics')}
            className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'analytics'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Analytics
          </button>
        </nav>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onOpenNotifications}
            title="Notifications"
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer relative"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500 absolute top-1.5 right-1.5 ring-2 ring-white" />
            )}
          </button>

          <button
            type="button"
            onClick={onOpenAddModal}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 active:scale-95 text-white text-xs font-semibold shadow-md shadow-orange-500/25 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span className="hidden sm:inline">Add Expense</span>
          </button>
        </div>
      </div>
    </header>
  );
};
