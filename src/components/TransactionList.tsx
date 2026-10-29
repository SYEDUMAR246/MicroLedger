import React, { useState } from 'react';
import {
  Search,
  X,
  Trash2,
  Edit3,
  Camera,
  Utensils,
  ShoppingCart,
  Car,
  Film,
  Zap,
  ShoppingBag,
  HeartPulse,
  Plane,
  CreditCard,
  ChevronDown,
  Clock,
  Plus,
} from 'lucide-react';
import {
  CATEGORIES,
  CATEGORY_META,
  ExpenseCategory,
  formatPKR,
  formatDisplayTime,
  StoredTransaction,
} from '../types';

interface TransactionListProps {
  transactions: StoredTransaction[];
  onDeleteTransaction: (id: string) => void;
  onEditTransaction: (tx: StoredTransaction) => void;
  onViewReceipt: (tx: StoredTransaction) => void;
  onOpenAddModal: () => void;
  filterDate?: string;
  onClearDateFilter?: () => void;
}

const CategoryIcon: React.FC<{ category: ExpenseCategory; className?: string }> = ({
  category,
  className = 'w-4 h-4',
}) => {
  switch (category) {
    case 'Food & Dining':
      return <Utensils className={className} />;
    case 'Groceries':
      return <ShoppingCart className={className} />;
    case 'Transportation':
      return <Car className={className} />;
    case 'Entertainment':
      return <Film className={className} />;
    case 'Utilities':
      return <Zap className={className} />;
    case 'Shopping':
      return <ShoppingBag className={className} />;
    case 'Healthcare':
      return <HeartPulse className={className} />;
    case 'Travel':
      return <Plane className={className} />;
    default:
      return <CreditCard className={className} />;
  }
};

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  onDeleteTransaction,
  onEditTransaction,
  onViewReceipt,
  onOpenAddModal,
  filterDate,
  onClearDateFilter,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Filter transactions by search query (merchant or notes) and category
  const filtered = transactions.filter((tx) => {
    const merchantStr = tx.merchant || '';
    const notesStr = tx.notes || '';
    const matchesSearch =
      merchantStr.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
      notesStr.toLowerCase().includes(searchQuery.toLowerCase().trim());
    const matchesCategory = selectedCategory === 'all' || tx.category === selectedCategory;
    const matchesDate = !filterDate || tx.date === filterDate;
    return matchesSearch && matchesCategory && matchesDate;
  });

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-100 shadow-sm space-y-4">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
            Recent Transactions
          </h2>
          <p className="text-xs text-slate-500">
            {filtered.length} {filtered.length === 1 ? 'expense' : 'expenses'} recorded
          </p>
        </div>

        {filterDate && onClearDateFilter && (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-orange-50 border border-orange-200 text-orange-700 text-xs rounded-full">
            <span>Filtered by: {filterDate}</span>
            <button
              type="button"
              onClick={onClearDateFilter}
              className="p-0.5 hover:text-orange-900 cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* Search Bar & Category Dropdown */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
        {/* Search Bar */}
        <div className="sm:col-span-7 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search merchant or notes..."
            className="w-full bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-2xl pl-10 pr-9 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="p-1 text-slate-400 hover:text-slate-600 absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Category Dropdown */}
        <div className="sm:col-span-5 relative">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full appearance-none bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-2xl pl-3.5 pr-8 py-2.5 text-xs text-slate-700 font-medium focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 transition-all cursor-pointer"
          >
            <option value="all">All Categories</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* Transactions List */}
      <div className="divide-y divide-slate-100">
        {filtered.length === 0 ? (
          <div className="text-center py-10 px-4 space-y-3">
            <div className="w-12 h-12 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center mx-auto">
              {transactions.length === 0 ? <Plus className="w-6 h-6" /> : <Search className="w-5 h-5" />}
            </div>
            <p className="text-xs font-bold text-slate-700">
              {transactions.length === 0 ? 'No transactions logged yet' : 'No matching expenses'}
            </p>
            <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
              {transactions.length === 0
                ? 'Your ledger is clean. Tap the button below to add your first expense!'
                : 'Try adjusting your search query or category filter.'}
            </p>
            {transactions.length === 0 ? (
              <button
                type="button"
                onClick={onOpenAddModal}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow-md shadow-orange-500/25 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add First Expense</span>
              </button>
            ) : (
              (searchQuery || selectedCategory !== 'all' || filterDate) && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                    if (onClearDateFilter) onClearDateFilter();
                  }}
                  className="text-xs font-semibold text-orange-500 hover:text-orange-600 cursor-pointer"
                >
                  Clear all filters
                </button>
              )
            )}
          </div>
        ) : (
          filtered.map((tx) => {
            const meta = CATEGORY_META[tx.category] || CATEGORY_META['Other'];
            const displayTitle = tx.merchant || tx.category;
            const displayTime = formatDisplayTime(tx.time);

            return (
              <div
                key={tx.id}
                className="py-3.5 flex items-center justify-between gap-3 group hover:bg-slate-50/70 -mx-2 px-2 rounded-2xl transition-colors"
              >
                {/* Left: Icon and merchant info */}
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-11 h-11 rounded-2xl ${meta.lightBg} ${meta.text} flex items-center justify-center flex-shrink-0 shadow-xs border ${meta.border}`}
                  >
                    <CategoryIcon category={tx.category} className="w-5 h-5" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-800 truncate">{displayTitle}</h3>
                      {tx.receiptImage && (
                        <button
                          type="button"
                          onClick={() => onViewReceipt(tx)}
                          title="View Receipt Image"
                          className="text-indigo-500 hover:text-indigo-700 cursor-pointer"
                        >
                          <Camera className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5 flex-wrap">
                      <span>{tx.date}</span>
                      {displayTime && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-0.5 text-slate-500 font-medium">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {displayTime}
                          </span>
                        </>
                      )}
                      <span>•</span>
                      <span className="truncate">{tx.category}</span>
                      {tx.notes && (
                        <>
                          <span>•</span>
                          <span className="truncate max-w-[120px] sm:max-w-[180px] text-slate-500">
                            {tx.notes}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Amount & action buttons */}
                <div className="flex items-center gap-2.5 flex-shrink-0">
                  <div className="text-right">
                    <div className="text-sm font-extrabold text-slate-900 tracking-tight">
                      -{formatPKR(tx.amount)}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => onEditTransaction(tx)}
                      title="Edit"
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteTransaction(tx.id)}
                      title="Delete"
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
