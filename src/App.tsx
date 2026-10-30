/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from 'motion/react';
import { MobileHome } from './components/MobileHome';
import { SavingsGoals } from './components/SavingsGoals';
import { contributeToGoal, goalSaved } from './lib/mobile-finance';
import type { AppTab } from './components/BottomNav';
import { Navbar } from './components/Navbar';
import { CategoryBudgets } from './components/CategoryBudgets';
import { RecurringPanel } from './components/RecurringPanel';
import { allocatedBudget, logRecurringPayment } from './lib/planning';
import { FinanceCard } from './components/FinanceCard';
import { CalendarStrip } from './components/CalendarStrip';
import { TransactionList } from './components/TransactionList';
import { AnalyticsView } from './components/AnalyticsView';
import { SmartAddModal } from './components/SmartAddModal';
import { EditBudgetModal } from './components/EditBudgetModal';
import { NotificationModal } from './components/NotificationModal';
import { ReceiptViewerModal } from './components/ReceiptViewerModal';
import { BottomNav } from './components/BottomNav';
import { BackupPanel, downloadJSON } from './components/BackupPanel';
import { StoredTransaction, TransactionData, RecurringExpense, ExpenseCategory, formatPKR, getCurrentTimeFormatted } from './types';
import { Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { localDate, totalPKR, transactionsInMonth } from './lib/finance';
import { LEDGER_KEY, LEGACY_KEYS, emptyLedger, readLedger, writeLedger, mergeBackup, deleteTransactions, undoDelete, type Ledger, type Backup } from './lib/ledger';

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('home');
  const [planView,setPlanView] = useState<'budgets'|'analytics'>('budgets');
  const [quickDraft,setQuickDraft] = useState<TransactionData|null>(null);
  const reducedMotion=useReducedMotion();
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(() => localDate().slice(0, 7));
  const [initial] = useState(() => {
    try { return {...readLedger(localStorage), error: null as string | null}; }
    catch {
      let raw: string | null = null;
      try { raw = localStorage.getItem(LEDGER_KEY); } catch { /* Access may be blocked. */ }
      return {ledger: emptyLedger(), raw, error: 'Your saved ledger could not be read. Original data has been preserved. Download a recovery copy, or restore a valid backup.'};
    }
  });
  const [ledger, setLedger] = useState(initial.ledger);
  const ledgerRef = useRef(initial.ledger);
  const rawRef = useRef(initial.raw);
  const [loadError, setLoadError] = useState(initial.error);
  const [storageError, setStorageError] = useState<string | null>(null);
  const {transactions, monthlyBudgetPKR, notifications} = ledger;
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addModalInitialMode, setAddModalInitialMode] = useState<'text' | 'receipt' | 'manual'>('text');
  const [editingTransaction, setEditingTransaction] = useState<StoredTransaction | null>(null);
  const [viewingReceiptTx, setViewingReceiptTx] = useState<StoredTransaction | null>(null);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(toastTimer.current), []);
  const showToast = (message: string) => {
    clearTimeout(toastTimer.current);
    setToastMessage(message);
    toastTimer.current = setTimeout(() => setToastMessage(null), 3000);
  };
  const commit = (next: Ledger, recovering = false): boolean => {
    if (loadError && !recovering) { setStorageError(loadError); return false; }
    try {
      if (recovering && loadError) {
        // Preserve unreadable originals before a deliberate recovery changes the active snapshot.
        const originals = Object.fromEntries([LEDGER_KEY, ...LEGACY_KEYS].map(key => [key, localStorage.getItem(key)]));
        localStorage.setItem('microledger_recovery_' + Date.now(), JSON.stringify(originals));
      }
      rawRef.current = writeLedger(localStorage, next, rawRef.current);
      ledgerRef.current = next;
      setLedger(next);
      setLoadError(null);
      setStorageError(null);
      return true;
    } catch (error) {
      setToastMessage(null);
      setStorageError(error instanceof Error && error.message.includes('another tab') ? error.message : 'Could not save changes. Your last saved records are unchanged. Keep this page open, download a backup, and free browser storage or allow site storage before retrying.');
      return false;
    }
  };

  const handleOpenAddModal = (mode: 'manual' | 'text' | 'receipt' = 'manual') => {
    setQuickDraft(null);setEditingTransaction(null); setAddModalInitialMode(mode); setIsAddModalOpen(true);
  };
  const handleSaveExpense = (txData: TransactionData, aiInsight?: string, receiptImage?: string): boolean => {
    const current = ledgerRef.current;
    const time = txData.time || getCurrentTimeFormatted();
    const merchant = txData.merchant || `${txData.category} Expense`;
    let next: Ledger;
    if (editingTransaction) {
      next = {...current, transactions: current.transactions.map(item => item.id === editingTransaction.id ? {
        ...item, ...txData, merchant, currency: 'PKR', time, aiInsight: aiInsight || item.aiInsight,
        receiptImage: receiptImage || item.receiptImage,
      } : item)};
    } else {
      const id = crypto.randomUUID();
      next = {...current, transactions: [{...txData, merchant, currency: 'PKR', time, id, createdAt: Date.now(), aiInsight, receiptImage,
        source: receiptImage ? 'ai_receipt' : addModalInitialMode === 'manual' ? 'manual' : 'ai_text'}, ...current.transactions],
        notifications: [{id: crypto.randomUUID(), title:'New Expense Added', message:`${merchant}: ${formatPKR(txData.amount)} at ${time}`, timestamp:Date.now(), read:false, type:'expense'}, ...current.notifications]};
    }
    if (!commit(next)) return false;
    showToast(editingTransaction ? `Updated expense for ${merchant}` : `Added ${formatPKR(txData.amount)} at ${merchant}`);
    setSelectedMonth(txData.date.slice(0,7));setSelectedDate('');
    return true;
  };
  const handleDeleteTransaction = (id: string) => {
    if (commit(deleteTransactions(ledgerRef.current, [id]))) showToast('Expense deleted. Undo is available below.');
  };
  const handleResetData = () => {
    if (window.confirm('Clear all expense records? You can undo this until the next deletion.')) {
      if (commit(deleteTransactions(ledgerRef.current, ledgerRef.current.transactions.map(tx => tx.id)))) showToast('Expense records cleared. Undo is available below.');
    }
  };
  const handleSaveBudget = (newBudget: number): boolean => {
    const current = ledgerRef.current;
    if (allocatedBudget(current.categoryBudgets) > newBudget) {setStorageError('Lower your category limits before reducing the monthly budget.');return false;}
    if (!commit({...current, monthlyBudgetPKR:newBudget, notifications:[{id:crypto.randomUUID(), title:'Budget Updated',
      message:`Your monthly budget is now ${formatPKR(newBudget)}.`, timestamp:Date.now(), read:false, type:'budget'}, ...current.notifications]})) return false;
    showToast(`Updated monthly budget to ${formatPKR(newBudget)}`);
    return true;
  };
  const handleMarkAllNotificationsRead = () => {
    const current = ledgerRef.current;
    commit({...current, notifications:current.notifications.map(item => ({...item,read:true}))});
  };
  const handleClearNotifications = () => { commit({...ledgerRef.current, notifications:[]}); };
  const handleRestore = (backup: Backup): boolean => {
    if (!commit(mergeBackup(ledgerRef.current, backup), true)) return false;
    showToast('Backup restored. Existing expenses kept.');
    return true;
  };

  const handleCategoryBudgets = (categoryBudgets: Partial<Record<ExpenseCategory,number>>): boolean => {
    if (!commit({...ledgerRef.current,categoryBudgets})) return false;
    showToast('Category limits saved.');return true;
  };
  const handleRecurringSave = (rule: RecurringExpense): boolean => {
    if (!commit({...ledgerRef.current,recurring:[...(ledgerRef.current.recurring ?? []),rule]})) return false;
    showToast('Monthly payment schedule saved.');return true;
  };
  const handleRecurringToggle = (id:string): boolean => commit({...ledgerRef.current,recurring:(ledgerRef.current.recurring ?? []).map(rule => rule.id===id ? {...rule,active:!rule.active} : rule)});
  const handleRecurringPay = (id:string,due:string,date:string,amount:number): boolean => {
    try {
      const next = logRecurringPayment(ledgerRef.current,id,due,date,amount);
      if(!commit(next)) return false;
      setSelectedMonth(date.slice(0,7));setSelectedDate('');showToast('Payment logged. Next due date updated.');return true;
    } catch(error) {setStorageError(error instanceof Error ? error.message : 'Could not log this payment.');return false;}
  };
  const moveMonth = (offset:number) => {
    const date = new Date(selectedMonth + '-01T12:00:00');date.setMonth(date.getMonth()+offset);
    const month = localDate(date).slice(0,7);
    if (/^\d{4}-\d{2}$/.test(month) && !month.startsWith('0000')) {setSelectedMonth(month);setSelectedDate('');}
  };

  const handleCreateGoal = (name:string,target:number):boolean => {
    const next={...ledgerRef.current,goals:[...(ledgerRef.current.goals??[]),{id:crypto.randomUUID(),name,target,contributions:[]}]};
    if(!commit(next))return false;showToast('Your new goal is ready.');return true;
  };
  const handleContribute = (id:string,amount:number):boolean => {
    try {const next=contributeToGoal(ledgerRef.current,id,amount,crypto.randomUUID());if(!commit(next))return false;
      const goal=next.goals!.find(item=>item.id===id)!;showToast(goalSaved(goal)>=goal.target?'Goal reached. You did it!':'Savings progress updated.');return true;
    }catch(error){setStorageError(error instanceof Error?error.message:'Could not record savings.');return false;}
  };
  const changeTab=(tab:AppTab)=>{setActiveTab(tab);setSelectedDate('');window.scrollTo({top:0,behavior:'instant'});};
  const editExpense=(tx:StoredTransaction)=>{setQuickDraft(null);setEditingTransaction(tx);setIsAddModalOpen(true);};
  const monthTransactions=transactionsInMonth(transactions,selectedMonth);
  const totalSpentPKR=totalPKR(monthTransactions);
  const unreadNotificationsCount=notifications.filter(item=>!item.read).length;

  return <MotionConfig reducedMotion="user"><div className="min-h-screen bg-[#fffdf9] text-slate-800 pb-28 font-sans selection:bg-orange-100">
    <Navbar unreadCount={unreadNotificationsCount} onOpenNotifications={()=>setIsNotificationModalOpen(true)}/>
    <main className="max-w-lg mx-auto px-4 sm:px-6 pt-1 pb-6 space-y-4">
      {activeTab!=='profile'&&<div className="flex justify-between items-center gap-2">
        <span className="text-xs font-medium text-slate-500">{activeTab==='home'?'Your month':activeTab==='expenses'?'Activity':'Your plan'}</span>
        <div className="flex gap-1 items-center"><button type="button" aria-label="Previous month" onClick={()=>moveMonth(-1)} className="w-8 h-8 rounded-full hover:bg-orange-50 flex items-center justify-center"><ChevronLeft className="w-4 h-4"/></button><label htmlFor="ledger-month" className="sr-only">Viewing month</label><input id="ledger-month" type="month" value={selectedMonth} onChange={event=>{if(/^\d{4}-(0[1-9]|1[0-2])$/.test(event.target.value)){setSelectedMonth(event.target.value);setSelectedDate('');}}} className="bg-transparent text-xs font-semibold text-slate-600 max-w-36 min-w-0 p-1"/><button type="button" aria-label="Next month" onClick={()=>moveMonth(1)} className="w-8 h-8 rounded-full hover:bg-orange-50 flex items-center justify-center"><ChevronRight className="w-4 h-4"/></button></div>
      </div>}
      {(loadError||storageError)&&<div role="alert" className="rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm p-4 space-y-2"><p>{storageError||loadError}</p>{loadError&&<button type="button" className="underline font-semibold" onClick={()=>{try{const original=Object.fromEntries([LEDGER_KEY,...LEGACY_KEYS].map(key=>[key,localStorage.getItem(key)]));downloadJSON(JSON.stringify({app:'MicroLedger recovery data',original},null,2),'MicroLedger-recovery-'+localDate()+'.json');}catch{setStorageError('Allow site storage before retrying.');}}}>Download original recovery data</button>}</div>}
      {ledger.undo.length>0&&<div role="status" className="rounded-2xl bg-orange-50 border border-orange-100 p-3 flex gap-3 items-center text-xs"><span className="flex-1">{ledger.undo.length} deleted {ledger.undo.length===1?'expense':'expenses'} can be recovered until the next deletion.</span><button type="button" className="font-semibold text-orange-800 py-2" onClick={()=>{if(commit(undoDelete(ledgerRef.current)))showToast('Deleted expenses restored.');}}>Undo delete</button></div>}
      <motion.div key={activeTab} initial={reducedMotion?false:{opacity:0,y:5}} animate={{opacity:1,y:0}} transition={{duration:.18}}>
        {activeTab==='home'&&<MobileHome ledger={ledger} month={selectedMonth} onQuick={data=>{setQuickDraft(data);setEditingTransaction(null);setAddModalInitialMode('manual');setIsAddModalOpen(true);}} onAdd={()=>handleOpenAddModal('text')} onActivity={()=>changeTab('expenses')} onPlan={()=>changeTab('plan')} onCreateGoal={handleCreateGoal} onContribute={handleContribute} onEdit={editExpense}/>}
        {activeTab==='expenses'&&<div className="space-y-4"><div><h1 className="text-2xl font-bold tracking-tight text-slate-950">Your activity</h1><p className="text-sm text-slate-500 mt-1">{formatPKR(totalSpentPKR)} recorded this month</p></div><details className="bg-white rounded-3xl border border-slate-100 p-4"><summary className="text-sm font-semibold text-slate-700">Filter by day</summary><div className="mt-3"><CalendarStrip month={selectedMonth} selectedDate={selectedDate} onSelectDate={setSelectedDate}/></div></details><TransactionList transactions={monthTransactions} onDeleteTransaction={handleDeleteTransaction} onEditTransaction={editExpense} onViewReceipt={setViewingReceiptTx} onOpenAddModal={()=>handleOpenAddModal('manual')} filterDate={selectedDate} onClearDateFilter={()=>setSelectedDate('')}/></div>}
        {activeTab==='plan'&&<div className="space-y-5"><div><h1 className="text-2xl font-bold tracking-tight text-slate-950">Make room for what matters.</h1><p className="text-sm text-slate-500 mt-2">A plan for today. Something to look forward to.</p></div><div className="grid grid-cols-2 gap-1 p-1 rounded-2xl bg-slate-100" role="group" aria-label="Plan view"><button type="button" aria-pressed={planView==='budgets'} onClick={()=>setPlanView('budgets')} className={'p-3 text-sm rounded-xl font-semibold '+(planView==='budgets'?'bg-white shadow-sm':'text-slate-500')}>Budgets & goals</button><button type="button" aria-pressed={planView==='analytics'} onClick={()=>setPlanView('analytics')} className={'p-3 text-sm rounded-xl font-semibold '+(planView==='analytics'?'bg-white shadow-sm':'text-slate-500')}>Insights</button></div>
          {planView==='analytics'?<AnalyticsView transactions={monthTransactions} monthlyBudgetPKR={monthlyBudgetPKR} onOpenAddModal={()=>handleOpenAddModal('manual')}/>:<><button type="button" onClick={()=>setIsBudgetModalOpen(true)} className="w-full bg-[#101a31] text-white rounded-3xl p-5 text-left flex items-center justify-between"><span><span className="block text-xs text-slate-300">Monthly budget</span><strong className="block text-2xl mt-1">{formatPKR(monthlyBudgetPKR)}</strong></span><span className="text-sm underline">Edit</span></button><SavingsGoals goals={ledger.goals??[]} onCreate={handleCreateGoal} onContribute={handleContribute}/><CategoryBudgets budgets={ledger.categoryBudgets??{}} monthlyBudget={monthlyBudgetPKR} transactions={monthTransactions} onSave={handleCategoryBudgets}/><RecurringPanel rules={ledger.recurring??[]} onSave={handleRecurringSave} onToggle={handleRecurringToggle} onPay={handleRecurringPay}/></>}
        </div>}
        {activeTab==='profile'&&<div className="space-y-5"><div><h1 className="text-2xl font-bold tracking-tight text-slate-950">Your space</h1><p className="text-sm text-slate-500 mt-2">Your records live in this browser. Keep a backup somewhere you trust.</p></div><section className="bg-white border border-slate-100 rounded-3xl p-5"><h2 className="font-bold">Your ledger</h2><p className="text-sm text-slate-500 mt-2">{transactions.length} expenses · {(ledger.goals??[]).length} savings goals</p><p className="text-xs text-slate-500 mt-2">PKR · Local storage · No account required</p></section><BackupPanel ledger={ledger} onRestore={handleRestore} exportDisabled={!!loadError}/><section className="bg-white border border-slate-100 rounded-3xl p-5"><h2 className="font-bold">About your savings</h2><p className="text-sm text-slate-500 mt-2">Goal contributions track money you have already set aside. MicroLedger does not hold or transfer your money.</p></section><details className="bg-white rounded-3xl border border-slate-100 p-5"><summary className="text-sm font-semibold text-slate-700">Manage expense records</summary><p className="text-xs text-slate-500 mt-3">Export a backup first. Clearing expenses keeps goals, budgets and schedules. Undo is available until the next deletion.</p><button type="button" onClick={handleResetData} className="text-sm text-rose-700 font-semibold mt-3 py-2">Clear all expenses</button></details><p className="text-center text-xs text-slate-400">MicroLedger · Your money, in perspective.</p></div>}
      </motion.div>
    </main>
    <BottomNav activeTab={activeTab} onTabChange={changeTab} onOpenAddModal={()=>handleOpenAddModal('text')}/>
    <AnimatePresence>{isAddModalOpen&&<SmartAddModal key="expense-entry" initialMode={addModalInitialMode} initialTransaction={editingTransaction} initialDraft={quickDraft} onSaveExpense={handleSaveExpense} onClose={()=>{setIsAddModalOpen(false);setEditingTransaction(null);setQuickDraft(null);}}/>}</AnimatePresence>
    {isBudgetModalOpen&&<EditBudgetModal currentBudget={monthlyBudgetPKR} minimumBudget={allocatedBudget(ledger.categoryBudgets)} totalSpent={totalSpentPKR} onSaveBudget={handleSaveBudget} onClose={()=>setIsBudgetModalOpen(false)}/>}
    {isNotificationModalOpen&&<NotificationModal notifications={notifications} onMarkAllAsRead={handleMarkAllNotificationsRead} onClearNotifications={handleClearNotifications} onClose={()=>setIsNotificationModalOpen(false)}/>}
    {viewingReceiptTx&&<ReceiptViewerModal transaction={viewingReceiptTx} onClose={()=>setViewingReceiptTx(null)}/>}
    <AnimatePresence>{toastMessage&&<motion.div key={toastMessage} role="status" aria-live="polite" initial={reducedMotion?false:{opacity:0,y:-8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}} transition={{duration:.18}} className="fixed top-16 left-4 right-4 sm:left-1/2 sm:-translate-x-1/2 sm:w-max sm:max-w-md z-[70] rounded-2xl bg-slate-900 text-white shadow-lg px-4 py-3 text-sm flex items-center gap-2"><Check className="w-4 h-4 text-emerald-300 shrink-0"/>{toastMessage}</motion.div>}</AnimatePresence>
  </div></MotionConfig>;
}
