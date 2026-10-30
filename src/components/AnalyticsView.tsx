import React from 'react';
import { totalPKR } from '../lib/finance';
import {
  CATEGORIES,
  CATEGORY_META,
  ExpenseCategory,
  formatPKR,
  StoredTransaction,
} from '../types';
import {
  PieChart,
  TrendingUp,
  Wallet,
  ArrowUpRight,
  Calendar,
  Layers,
  Store,
  AlertTriangle,
  CheckCircle2,
  Plus,
} from 'lucide-react';

interface AnalyticsViewProps {
  transactions: StoredTransaction[];
  monthlyBudgetPKR: number;
  onOpenAddModal?: () => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  transactions,
  monthlyBudgetPKR,
  onOpenAddModal,
}) => {
  // Real calculations
  const totalSpent = totalPKR(transactions);
  const transactionCount = transactions.length;
  const remainingBudget = Math.max(0, monthlyBudgetPKR - totalSpent);
  const budgetUsagePercent = monthlyBudgetPKR > 0 ? (totalSpent / monthlyBudgetPKR) * 100 : 0;
  const averageTransaction = transactionCount > 0 ? totalSpent / transactionCount : 0;

  // Highest transaction
  const sortedByAmount = [...transactions].sort((a, b) => b.amount - a.amount);
  const highestExpense = sortedByAmount[0] || null;

  // Aggregate by category
  const categoryMap: Record<
    ExpenseCategory,
    { total: number; count: number }
  > = CATEGORIES.reduce((acc, cat) => {
    acc[cat] = { total: 0, count: 0 };
    return acc;
  }, {} as Record<ExpenseCategory, { total: number; count: number }>);

  transactions.forEach((tx) => {
    if (categoryMap[tx.category]) {
      categoryMap[tx.category].total += tx.amount;
      categoryMap[tx.category].count += 1;
    }
  });

  const activeCategories = CATEGORIES.map((cat) => ({
    category: cat,
    total: categoryMap[cat].total,
    count: categoryMap[cat].count,
    percentage: totalSpent > 0 ? Math.round((categoryMap[cat].total / totalSpent) * 100) : 0,
    meta: CATEGORY_META[cat],
  }))
    .filter((c) => c.total > 0)
    .sort((a, b) => b.total - a.total);

  // Group by date for Daily Spending Breakdown
  const dateMap: Record<string, number> = {};
  transactions.forEach((tx) => {
    dateMap[tx.date] = (dateMap[tx.date] || 0) + tx.amount;
  });

  const dailyEntries = Object.entries(dateMap)
    .map(([date, amt]) => ({ date, amount: amt }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const maxDailySpend = Math.max(...dailyEntries.map((d) => d.amount), 1);
  const uniqueDaysCount = Object.keys(dateMap).length;
  const dailyAverageSpend = uniqueDaysCount > 0 ? totalSpent / uniqueDaysCount : 0;

  // Top Merchants
  const merchantMap: Record<string, { total: number; count: number; category: ExpenseCategory }> = {};
  transactions.forEach((tx) => {
    const name = tx.merchant || tx.category;
    if (!merchantMap[name]) {
      merchantMap[name] = { total: 0, count: 0, category: tx.category };
    }
    merchantMap[name].total += tx.amount;
    merchantMap[name].count += 1;
  });

  const topMerchants = Object.entries(merchantMap)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  // Health status
  const isOverBudget = totalSpent > monthlyBudgetPKR;
  const isWarningBudget = budgetUsagePercent >= 80 && !isOverBudget;

  if (transactionCount === 0) {
    return (
      <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm text-center space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto">
          <PieChart className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            Financial Analytics Empty
          </h2>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 leading-relaxed">
            No expenses logged yet. Once you add transactions, accurate category proportions, daily spending velocity, and budget health will display here.
          </p>
        </div>
        {onOpenAddModal && (
          <button
            type="button"
            onClick={onOpenAddModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-md shadow-orange-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add First Expense</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Overview Metric Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {/* Total Spent */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Total Spent
          </div>
          <div className="text-lg sm:text-xl font-extrabold text-slate-900 mt-1">
            {formatPKR(totalSpent)}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {transactionCount} {transactionCount === 1 ? 'transaction' : 'transactions'}
          </div>
        </div>

        {/* Budget Remaining */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Remaining Budget
          </div>
          <div
            className={`text-lg sm:text-xl font-extrabold mt-1 ${
              isOverBudget ? 'text-rose-600' : 'text-emerald-600'
            }`}
          >
            {formatPKR(remainingBudget)}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {isOverBudget
              ? 'Limit exceeded'
              : `${(100 - budgetUsagePercent).toFixed(1)}% remaining`}
          </div>
        </div>

        {/* Average per Transaction */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs col-span-2 sm:col-span-1">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Average Spend
          </div>
          <div className="text-lg sm:text-xl font-extrabold text-slate-900 mt-1">
            {formatPKR(averageTransaction)}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Per transaction average</div>
        </div>
      </div>

      {/* Budget Pacing & Health Bar */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-100 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Budget Health</h2>
            <p className="text-xs text-slate-400">Pacing against your monthly target</p>
          </div>
          <span
            className={`text-xs font-bold px-3 py-1 rounded-full border ${
              isOverBudget
                ? 'bg-rose-50 text-rose-700 border-rose-200'
                : isWarningBudget
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}
          >
            {isOverBudget
              ? 'Exceeded Budget'
              : isWarningBudget
              ? 'Approaching Limit'
              : 'Healthy Pacing'}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5 pt-1">
          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                isOverBudget
                  ? 'bg-rose-500'
                  : isWarningBudget
                  ? 'bg-amber-500'
                  : 'bg-gradient-to-r from-purple-600 to-indigo-600'
              }`}
              style={{ width: `${Math.min(100, budgetUsagePercent)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Spent: {formatPKR(totalSpent)}</span>
            <span className="font-semibold text-slate-800">
              {budgetUsagePercent.toFixed(1)}% of {formatPKR(monthlyBudgetPKR)}
            </span>
          </div>
        </div>
      </div>

      {/* Category Breakdown (Real Data & Accurate Percentages) */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Category Distribution
            </h2>
            <p className="text-xs text-slate-400">Proportional spending across active categories</p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
            {activeCategories.length} {activeCategories.length === 1 ? 'Category' : 'Categories'}
          </span>
        </div>

        {/* Multi-segment Proportional Bar */}
        <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden flex">
          {activeCategories.map((item) => (
            <div
              key={item.category}
              style={{
                width: `${item.percentage}%`,
                backgroundColor: item.meta.colorHex,
              }}
              title={`${item.category}: ${formatPKR(item.total)} (${item.percentage}%)`}
              className="h-full first:rounded-l-full last:rounded-r-full transition-all hover:opacity-90"
            />
          ))}
        </div>

        {/* Category List Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {activeCategories.map((item) => (
            <div
              key={item.category}
              className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-3 hover:bg-slate-100/60 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span
                  className="w-3.5 h-3.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: item.meta.colorHex }}
                />
                <div>
                  <h3 className="text-xs font-bold text-slate-900">{item.category}</h3>
                  <div className="text-[11px] text-slate-400">
                    {item.count} {item.count === 1 ? 'transaction' : 'transactions'} • {item.percentage}%
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-xs font-extrabold text-slate-900">
                  {formatPKR(item.total)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Daily Spending Timeline (Real Transaction Dates) */}
      {dailyEntries.length > 0 && (
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Spending Activity by Day
              </h2>
              <p className="text-xs text-slate-400">Timeline of actual logged expenses</p>
            </div>
            <span className="text-xs text-slate-500 font-medium">
              Daily Avg: <span className="font-bold text-slate-800">{formatPKR(dailyAverageSpend)}</span>
            </span>
          </div>

          <div className="pt-2 flex items-end justify-between gap-2 h-36 px-1">
            {dailyEntries.map((d) => {
              const heightPercent = Math.max(15, Math.round((d.amount / maxDailySpend) * 100));
              const displayDate = d.date.split('-').slice(1).join('/'); // MM/DD

              return (
                <div key={d.date} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                  <span className="text-[10px] text-slate-400 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                    {formatPKR(d.amount)}
                  </span>
                  <div className="w-full max-w-[42px] bg-slate-100 rounded-xl h-full flex items-end p-0.5">
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className="w-full rounded-lg bg-orange-500 hover:bg-orange-600 transition-all shadow-xs"
                      title={`${d.date}: ${formatPKR(d.amount)}`}
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium">{displayDate}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Top Merchants / Stores */}
      {topMerchants.length > 0 && (
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-100 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">Top Payees & Stores</h2>
              <p className="text-xs text-slate-400">Where you spend the most</p>
            </div>
            <Store className="w-4 h-4 text-slate-400" />
          </div>

          <div className="divide-y divide-slate-100">
            {topMerchants.map((m, idx) => (
              <div key={m.name} className="py-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 font-bold text-[10px] flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <div>
                    <div className="font-bold text-slate-800">{m.name}</div>
                    <div className="text-[10px] text-slate-400">
                      {m.count} {m.count === 1 ? 'time' : 'times'} • {m.category}
                    </div>
                  </div>
                </div>
                <div className="font-extrabold text-slate-900">{formatPKR(m.total)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Highest Single Expense Spotlight */}
      {highestExpense && (
        <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-3xl p-5 text-white shadow-md space-y-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
            Highest Single Expense
          </div>
          <div className="flex items-baseline justify-between pt-1">
            <div>
              <div className="text-lg font-bold text-white">
                {highestExpense.merchant || highestExpense.category}
              </div>
              <div className="text-xs text-slate-300">
                {highestExpense.date} • {highestExpense.category}
              </div>
            </div>
            <div className="text-xl font-extrabold text-white">
              {formatPKR(highestExpense.amount)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
