/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { FinanceCard } from './components/FinanceCard';
import { CalendarStrip } from './components/CalendarStrip';
import { TransactionList } from './components/TransactionList';
import { AnalyticsView } from './components/AnalyticsView';
import { SmartAddModal } from './components/SmartAddModal';
import { EditBudgetModal } from './components/EditBudgetModal';
import { NotificationModal } from './components/NotificationModal';
import { ReceiptViewerModal } from './components/ReceiptViewerModal';
import { BottomNav } from './components/BottomNav';
import {
  StoredTransaction,
  TransactionData,
  AppNotification,
  formatPKR,
  getCurrentTimeFormatted,
} from './types';
import { Check } from 'lucide-react';

const STORAGE_KEY = 'smartspend_wallet_pkr_v3';
const BUDGET_STORAGE_KEY = 'smartspend_wallet_budget_v3';
const NOTIFICATIONS_KEY = 'smartspend_notifications_v3';

export default function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'expenses' | 'analytics'>('home');
  const [selectedDate, setSelectedDate] = useState<string>('');

  // Transactions - Starts completely clean without dummy sample records
  const [transactions, setTransactions] = useState<StoredTransaction[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Error loading saved transactions:', e);
    }
    return [];
  });

  // Monthly Budget in PKR
  const [monthlyBudgetPKR, setMonthlyBudgetPKR] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(BUDGET_STORAGE_KEY);
      if (saved) return Number(saved);
    } catch (e) {
      // ignore
    }
    return 120000; // Rs. 120,000 default target
  });

  // Notifications
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    try {
      const saved = localStorage.getItem(NOTIFICATIONS_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // ignore
    }
    return [
      {
        id: 'notif-1',
        title: 'Monthly Budget Active',
        message: 'Your monthly target is set to Rs. 120,000 for October.',
        timestamp: Date.now() - 3600000 * 2,
        read: false,
        type: 'budget',
      },
      {
        id: 'notif-2',
        title: 'Welcome to SmartSpend',
        message: 'Tap the orange + button to log your first expense or scan a receipt.',
        timestamp: Date.now() - 3600000 * 5,
        read: false,
        type: 'tip',
      },
    ];
  });

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addModalInitialMode, setAddModalInitialMode] = useState<'text' | 'receipt' | 'manual'>('text');
  const [editingTransaction, setEditingTransaction] = useState<StoredTransaction | null>(null);
  const [viewingReceiptTx, setViewingReceiptTx] = useState<StoredTransaction | null>(null);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
    } catch (e) {
      console.error('Error saving transactions:', e);
    }
  }, [transactions]);

  useEffect(() => {
    try {
      localStorage.setItem(BUDGET_STORAGE_KEY, monthlyBudgetPKR.toString());
    } catch (e) {
      // ignore
    }
  }, [monthlyBudgetPKR]);

  useEffect(() => {
    try {
      localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
    } catch (e) {
      // ignore
    }
  }, [notifications]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const handleOpenAddModal = (mode: 'manual' | 'text' | 'receipt' = 'manual') => {
    setEditingTransaction(null);
    setAddModalInitialMode(mode);
    setIsAddModalOpen(true);
  };

  const handleSaveExpense = (
    txData: TransactionData,
    aiInsight?: string,
    receiptImage?: string
  ) => {
    const txTime = txData.time || getCurrentTimeFormatted();
    const finalMerchant = txData.merchant || `${txData.category} Expense`;

    if (editingTransaction) {
      setTransactions((prev) =>
        prev.map((item) =>
          item.id === editingTransaction.id
            ? {
                ...item,
                ...txData,
                merchant: finalMerchant,
                currency: 'PKR',
                time: txTime,
                aiInsight: aiInsight || item.aiInsight,
                receiptImage: receiptImage || item.receiptImage,
              }
            : item
        )
      );
      showToast(`Updated expense for ${finalMerchant}`);
    } else {
      const newTx: StoredTransaction = {
        ...txData,
        merchant: finalMerchant,
        currency: 'PKR',
        time: txTime,
        id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        createdAt: Date.now(),
        aiInsight,
        receiptImage,
        source: receiptImage ? 'ai_receipt' : 'ai_text',
      };
      setTransactions((prev) => [newTx, ...prev]);

      // Add a notification for new transaction
      const newNotif: AppNotification = {
        id: `notif-${Date.now()}`,
        title: 'New Expense Added',
        message: `${finalMerchant}: ${formatPKR(txData.amount)} at ${txTime}`,
        timestamp: Date.now(),
        read: false,
        type: 'expense',
      };
      setNotifications((prev) => [newNotif, ...prev]);

      showToast(`Added ${formatPKR(txData.amount)} at ${finalMerchant}`);
    }
    setIsAddModalOpen(false);
    setEditingTransaction(null);
  };

  const handleDeleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    showToast('Expense removed from records');
  };

  const handleResetData = () => {
    if (window.confirm('Clear all expense records from your ledger?')) {
      setTransactions([]);
      showToast('All expense records cleared');
    }
  };

  const handleSaveBudget = (newBudget: number) => {
    setMonthlyBudgetPKR(newBudget);
    // Add budget update notification
    const budgetNotif: AppNotification = {
      id: `notif-${Date.now()}`,
      title: 'Budget Updated',
      message: `Your monthly budget is now set to ${formatPKR(newBudget)}.`,
      timestamp: Date.now(),
      read: false,
      type: 'budget',
    };
    setNotifications((prev) => [budgetNotif, ...prev]);
    showToast(`Updated monthly budget to ${formatPKR(newBudget)}`);
  };

  const handleMarkAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleClearNotifications = () => {
    setNotifications([]);
  };

  // Compute total spent in PKR
  const totalSpentPKR = transactions.reduce((acc, t) => acc + t.amount, 0);
  const unreadNotificationsCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans pb-24 selection:bg-orange-500/20 selection:text-orange-900">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        unreadCount={unreadNotificationsCount}
        onTabChange={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenAddModal={() => handleOpenAddModal('text')}
        onOpenNotifications={() => setIsNotificationModalOpen(true)}
      />

      {/* Main Content Container */}
      <main className="flex-1 max-w-xl w-full mx-auto px-4 sm:px-6 py-5 space-y-5">
        {/* VIEW 1: HOME */}
        {activeTab === 'home' && (
          <>
            {/* Card & Budget Overview */}
            <FinanceCard
              totalSpentPKR={totalSpentPKR}
              monthlyBudgetPKR={monthlyBudgetPKR}
              onOpenAddModal={handleOpenAddModal}
              onAdjustBudget={() => setIsBudgetModalOpen(true)}
            />

            {/* Calendar Date Strip */}
            <CalendarStrip
              selectedDate={selectedDate}
              onSelectDate={(d) => setSelectedDate(d)}
            />

            {/* Transactions with Search Bar & Category Dropdown */}
            <TransactionList
              transactions={transactions}
              onDeleteTransaction={handleDeleteTransaction}
              onEditTransaction={(tx) => {
                setEditingTransaction(tx);
                setIsAddModalOpen(true);
              }}
              onViewReceipt={(tx) => setViewingReceiptTx(tx)}
              onOpenAddModal={() => handleOpenAddModal('manual')}
              filterDate={selectedDate}
              onClearDateFilter={() => setSelectedDate('')}
            />
          </>
        )}

        {/* VIEW 2: EXPENSES (FULL LEDGER) */}
        {activeTab === 'expenses' && (
          <div className="space-y-4">
            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                  Total Monthly Expenses
                </span>
                <div className="text-2xl font-extrabold text-slate-900 mt-0.5">
                  {formatPKR(totalSpentPKR)}
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleOpenAddModal('manual')}
                className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow-md shadow-orange-500/20 transition-all cursor-pointer"
              >
                + Add Expense
              </button>
            </div>

            <TransactionList
              transactions={transactions}
              onDeleteTransaction={handleDeleteTransaction}
              onEditTransaction={(tx) => {
                setEditingTransaction(tx);
                setIsAddModalOpen(true);
              }}
              onViewReceipt={(tx) => setViewingReceiptTx(tx)}
              onOpenAddModal={() => handleOpenAddModal('text')}
            />
          </div>
        )}

        {/* VIEW 3: ANALYTICS */}
        {activeTab === 'analytics' && (
          <AnalyticsView
            transactions={transactions}
            monthlyBudgetPKR={monthlyBudgetPKR}
            onOpenAddModal={() => handleOpenAddModal('manual')}
          />
        )}
      </main>

      {/* Floating Bottom Navigation Bar */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenAddModal={() => handleOpenAddModal('manual')}
        onResetData={handleResetData}
      />

      {/* Smart Add Expense Modal */}
      {isAddModalOpen && (
        <SmartAddModal
          initialMode={addModalInitialMode}
          initialTransaction={editingTransaction}
          onSaveExpense={handleSaveExpense}
          onClose={() => {
            setIsAddModalOpen(false);
            setEditingTransaction(null);
          }}
        />
      )}

      {/* Edit Budget Modal */}
      {isBudgetModalOpen && (
        <EditBudgetModal
          currentBudget={monthlyBudgetPKR}
          totalSpent={totalSpentPKR}
          onSaveBudget={handleSaveBudget}
          onClose={() => setIsBudgetModalOpen(false)}
        />
      )}

      {/* Notifications Modal */}
      {isNotificationModalOpen && (
        <NotificationModal
          notifications={notifications}
          onMarkAllAsRead={handleMarkAllNotificationsRead}
          onClearNotifications={handleClearNotifications}
          onClose={() => setIsNotificationModalOpen(false)}
        />
      )}

      {/* Receipt Viewer Modal */}
      {viewingReceiptTx && (
        <ReceiptViewerModal
          transaction={viewingReceiptTx}
          onClose={() => setViewingReceiptTx(null)}
        />
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-3 duration-200">
          <div className="w-4 h-4 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center">
            <Check className="w-3 h-3 stroke-[3]" />
          </div>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
