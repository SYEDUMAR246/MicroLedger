import {Onboarding} from './components/Onboarding';
import {App as PhoneApp} from '@capacitor/app';
import {isAndroid} from './lib/native';
import {DEFAULT_MASCOT,completeSetup,saveMascot,type SetupAnswers,type MascotSettings} from './lib/personalization';
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from 'motion/react';
import { ProfileSettings as ProfileSettingsPanel } from './components/ProfileSettings';
import { DeletionNotice } from './components/DeletionNotice';
import { DEFAULT_PROFILE, addCategory, removeCategory, saveProfile } from './lib/settings';
import { removeExpenses, removeBill, removeGoal, restoreDeletion, discardDeletion, undoRemaining } from './lib/deletion';
import type { ProfileSettings } from './types';
import { MobileHome } from './components/MobileHome';
import { SavingsGoals } from './components/SavingsGoals';
import { contributeToGoal, goalSaved } from './lib/mobile-finance';
import type { AppTab } from './components/BottomNav';
import { Navbar } from './components/Navbar';
import { CategoryBudgets } from './components/CategoryBudgets';
import { RecurringPanel } from './components/RecurringPanel';
import { allocatedBudget, logRecurringPayment } from './lib/planning';
import { JournalView } from './components/JournalView';
import { AnalyticsView } from './components/AnalyticsView';
import { SmartAddModal } from './components/SmartAddModal';
import { EditBudgetModal } from './components/EditBudgetModal';
import { NotificationModal } from './components/NotificationModal';
import { ReceiptViewerModal } from './components/ReceiptViewerModal';
import { BottomNav } from './components/BottomNav';
import { BackupPanel, downloadJSON } from './components/BackupPanel';
import { StoredTransaction, TransactionData, RecurringExpense, ExpenseCategory, formatPKR, getCurrentTimeFormatted } from './types';
import { Check, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { localDate, totalPKR, transactionsInMonth } from './lib/finance';
import { LEDGER_KEY, LEGACY_KEYS, emptyLedger, readLedger, writeLedger, mergeBackup, deleteTransactions, undoDelete, type Ledger, type Backup } from './lib/ledger';

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('home');
  const [planView,setPlanView] = useState<'budgets'|'bills'|'analytics'>('budgets');
  const [quickDraft,setQuickDraft] = useState<TransactionData|null>(null);
  const deviceReducedMotion=useReducedMotion();
  const [entrySpeech,setEntrySpeech]=useState(false);
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
  const [setupOpen,setSetupOpen]=useState(!initial.ledger.onboardingCompleted&&!initial.error);
  const ledgerRef = useRef(initial.ledger);
  const rawRef = useRef(initial.raw);
  const [loadError, setLoadError] = useState(initial.error);
  const [storageError, setStorageError] = useState<string | null>(null);
  const {transactions, monthlyBudgetPKR, notifications} = ledger;
  const preferences=ledger.profile??DEFAULT_PROFILE;
  const reducedMotion=deviceReducedMotion||preferences.reduceMotion;
  const [systemDark,setSystemDark]=useState(()=>window.matchMedia('(prefers-color-scheme: dark)').matches);
  const [undoSeconds,setUndoSeconds]=useState(()=>undoRemaining(ledger.deletion));
  const theme=preferences.theme==='system'?(systemDark?'dark':'light'):preferences.theme;
  useEffect(()=>{const media=window.matchMedia('(prefers-color-scheme: dark)');const update=()=>setSystemDark(media.matches);media.addEventListener('change',update);return()=>media.removeEventListener('change',update);},[]);
  useEffect(()=>{document.querySelector('meta[name="theme-color"]')?.setAttribute('content',theme==='dark'?'#151d26':'#fffaf3');},[theme]);
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

  useEffect(()=>{
    if(!ledger.deletion){setUndoSeconds(0);return;}
    const tick=()=>{const pending=ledgerRef.current.deletion;const seconds=undoRemaining(pending);setUndoSeconds(seconds);if(pending&&seconds===0){clearInterval(timer);commit(discardDeletion(ledgerRef.current));}};
    const timer=setInterval(tick,100);tick();return()=>clearInterval(timer);
  },[ledger.deletion?.expiresAt]);
  const handleUndoDeletion=()=>{try{if(commit(restoreDeletion(ledgerRef.current)))showToast('Deleted item restored.');}catch{setUndoSeconds(0);commit(discardDeletion(ledgerRef.current));}};
  const handleDismissDeletion=()=>{if(commit(discardDeletion(ledgerRef.current)))setUndoSeconds(0);};
  const handleDeleteBill=(id:string)=>{try{setToastMessage(null);commit(removeBill(ledgerRef.current,id));}catch(error){setStorageError(error instanceof Error?error.message:'Could not delete this bill.');}};
  const handleDeleteGoal=(id:string)=>{try{setToastMessage(null);commit(removeGoal(ledgerRef.current,id));}catch(error){setStorageError(error instanceof Error?error.message:'Could not delete this goal.');}};
  const handleProfileSave=(profile:ProfileSettings)=>{try{if(!commit(saveProfile(ledgerRef.current,profile)))return false;showToast('Profile settings saved.');return true;}catch(error){setStorageError(error instanceof Error?error.message:'Could not save settings.');return false;}};
  const handleMascotSave=(value:MascotSettings)=>{try{return commit(saveMascot(ledgerRef.current,value));}catch(error){setStorageError(error instanceof Error?error.message:'Could not save your companion.');return false;}};
  const handleSetupComplete=(answers:SetupAnswers)=>{try{if(!commit(completeSetup(ledgerRef.current,answers,crypto.randomUUID())))return false;setSetupOpen(false);changeTab('home');return true;}catch(error){setStorageError(error instanceof Error?error.message:'Could not finish setup.');return false;}};
  const handleAddCategory=(name:string):string|null=>{try{if(!commit(addCategory(ledgerRef.current,name)))return 'Could not save this category. Check the saving message and retry.';showToast('Category added.');return null;}catch(error){return error instanceof Error?error.message:'Could not add category.';}};
  const handleRemoveCategory=(name:string):string|null=>{try{if(!commit(removeCategory(ledgerRef.current,name)))return 'Could not remove this category.';return null;}catch(error){return error instanceof Error?error.message:'Could not remove category.';}};

  const handleOpenAddModal = (mode: 'manual' | 'text' | 'receipt' | 'voice' = 'manual') => {
    setQuickDraft(null);setEditingTransaction(null); setEntrySpeech(mode==='voice');setAddModalInitialMode(mode==='voice'?'text':mode); setIsAddModalOpen(true);
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
    setSelectedMonth(activeTab==='home'?localDate().slice(0,7):txData.date.slice(0,7));setSelectedDate('');
    return true;
  };
  const handleDeleteTransaction = (id: string) => {
    setToastMessage(null);commit(removeExpenses(ledgerRef.current,[id]));
  };
  const handleResetData = () => {
    setToastMessage(null);commit(removeExpenses(ledgerRef.current,ledgerRef.current.transactions.map(tx=>tx.id)));
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
  const changeTab=(tab:AppTab)=>{setActiveTab(tab);if(tab==='home')setSelectedMonth(localDate().slice(0,7));setSelectedDate('');window.scrollTo({top:0,behavior:'instant'});};
  useEffect(()=>{
    if(!isAndroid)return;
    const listener=PhoneApp.addListener('backButton',()=>{
      if(isAddModalOpen){setIsAddModalOpen(false);setEditingTransaction(null);setQuickDraft(null);setEntrySpeech(false);}
      else if(viewingReceiptTx)setViewingReceiptTx(null);
      else if(isBudgetModalOpen)setIsBudgetModalOpen(false);
      else if(isNotificationModalOpen)setIsNotificationModalOpen(false);
      else if(activeTab!=='home')changeTab('home');
      else void PhoneApp.minimizeApp();
    });
    return()=>{void listener.then(handle=>handle.remove());};
  },[isAddModalOpen,viewingReceiptTx,isBudgetModalOpen,isNotificationModalOpen,activeTab]);
  const editExpense=(tx:StoredTransaction)=>{setQuickDraft(null);setEditingTransaction(tx);setIsAddModalOpen(true);};
  const monthTransactions=transactionsInMonth(transactions,selectedMonth);
  const totalSpentPKR=totalPKR(monthTransactions);
  const unreadNotificationsCount=notifications.filter(item=>!item.read).length;
  const monthPicker=(label:string)=><div className="pp-month-picker"><span>{label}</span><div><button type="button" aria-label="Previous month" onClick={()=>moveMonth(-1)}><ChevronLeft size={16}/></button><label htmlFor="ledger-month" className="sr-only">Viewing month</label><input id="ledger-month" type="month" value={selectedMonth} onChange={event=>{if(/^\d{4}-(0[1-9]|1[0-2])$/.test(event.target.value))setSelectedMonth(event.target.value);}}/><button type="button" aria-label="Next month" onClick={()=>moveMonth(1)}><ChevronRight size={16}/></button></div></div>;

  if(setupOpen&&!loadError)return <MotionConfig reducedMotion={preferences.reduceMotion?"always":"user"}><div className="paper-app" data-theme={theme} data-reduce-motion={preferences.reduceMotion}><Onboarding ledger={ledger} onComplete={handleSetupComplete} onCancel={ledger.onboardingCompleted?()=>setSetupOpen(false):undefined} saveError={storageError}/></div></MotionConfig>;
  return <MotionConfig reducedMotion={preferences.reduceMotion?"always":"user"}><div className="paper-app" data-theme={theme} data-reduce-motion={preferences.reduceMotion}>
    <Navbar unreadCount={unreadNotificationsCount} onOpenNotifications={()=>setIsNotificationModalOpen(true)} onOpenProfile={()=>changeTab(activeTab==='profile'?'home':'profile')} profileActive={activeTab==='profile'} name={preferences.name}/>
    <main className="pp-main">
      {(loadError||storageError)&&<div role="alert" className="rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm p-4 space-y-2 my-3"><p>{storageError||loadError}</p>{loadError&&<button type="button" className="underline font-semibold" onClick={async()=>{try{const original=Object.fromEntries([LEDGER_KEY,...LEGACY_KEYS].map(key=>[key,localStorage.getItem(key)]));await downloadJSON(JSON.stringify({app:'MicroLedger recovery data',original},null,2),'MicroLedger-recovery-'+localDate()+'.json');}catch{setStorageError('Allow site storage before retrying.');}}}>Download original recovery data</button>}</div>}
      <motion.div key={activeTab} initial={reducedMotion?false:{opacity:0,y:5}} animate={{opacity:1,y:0}} transition={{duration:.18}}>
        {activeTab==='home'&&<MobileHome onCustomizeMascot={()=>changeTab('profile')} name={preferences.name} ledger={ledger} month={localDate().slice(0,7)} onAdd={handleOpenAddModal} onActivity={()=>changeTab('expenses')} onPlan={()=>{setPlanView('bills');changeTab('plan');}} onEdit={editExpense}/>}
        {activeTab==='expenses'&&<>{monthPicker('Your month')}<JournalView transactions={monthTransactions} month={selectedMonth} onEdit={editExpense} onDelete={handleDeleteTransaction} onReceipt={setViewingReceiptTx} customCategories={ledger.customCategories??[]} onAdd={()=>handleOpenAddModal('manual')}/></>}
        {activeTab==='goals'&&<SavingsGoals goals={ledger.goals??[]} onCreate={handleCreateGoal} onContribute={handleContribute} onDelete={handleDeleteGoal}/>}
        {activeTab==='plan'&&<section className="pp-plan"><h1 className="pp-title pp-plan-title">Make room for<br/>what matters<span>.</span></h1>{monthPicker('Your monthly plan')}<div className="pp-plan-tabs" role="group" aria-label="Plan view">{[{id:'budgets' as const,label:'Budgets'},{id:'bills' as const,label:'Bills'},{id:'analytics' as const,label:'Insights'}].map(tab=><button type="button" key={tab.id} aria-pressed={planView===tab.id} className={planView===tab.id?'is-active':''} onClick={()=>setPlanView(tab.id)}>{tab.label}</button>)}</div>
          {planView==='analytics'?<AnalyticsView customCategories={ledger.customCategories??[]} transactions={monthTransactions} monthlyBudgetPKR={monthlyBudgetPKR} onOpenAddModal={()=>handleOpenAddModal('manual')}/>:planView==='bills'?<RecurringPanel rules={ledger.recurring??[]} onSave={handleRecurringSave} onToggle={handleRecurringToggle} onPay={handleRecurringPay} onDelete={handleDeleteBill} customCategories={ledger.customCategories??[]}/>:<div className="space-y-4"><button type="button" onClick={()=>setIsBudgetModalOpen(true)} className="pp-budget-edit"><span><small>Monthly budget</small><strong>{formatPKR(monthlyBudgetPKR)}</strong></span><span>Edit</span></button><CategoryBudgets budgets={ledger.categoryBudgets??{}} monthlyBudget={monthlyBudgetPKR} transactions={monthTransactions} onSave={handleCategoryBudgets} customCategories={ledger.customCategories??[]}/></div>}
        </section>}
        {activeTab==='profile'&&<ProfileSettingsPanel onMascotSave={handleMascotSave} onRestartSetup={()=>{setStorageError(null);setSetupOpen(true);window.scrollTo({top:0,behavior:'instant'});}} ledger={ledger} onSave={handleProfileSave} onAddCategory={handleAddCategory} onRemoveCategory={handleRemoveCategory} onRestore={handleRestore} onClear={handleResetData} onBack={()=>changeTab('home')} loadError={!!loadError}/>}

      </motion.div>
    </main>
    {ledger.deletion&&undoSeconds>0&&<DeletionNotice deletion={ledger.deletion} remaining={undoSeconds} onUndo={handleUndoDeletion} onClose={handleDismissDeletion}/>}
    <BottomNav activeTab={activeTab} onTabChange={changeTab} onOpenAddModal={()=>handleOpenAddModal("text")}/>
    <AnimatePresence>{isAddModalOpen&&<SmartAddModal mascot={ledger.mascot??DEFAULT_MASCOT} key="expense-entry" initialMode={addModalInitialMode} initialVoice={entrySpeech} customCategories={ledger.customCategories??[]} onAddCategory={handleAddCategory} initialTransaction={editingTransaction} initialDraft={quickDraft} onSaveExpense={handleSaveExpense} onClose={()=>{setIsAddModalOpen(false);setEditingTransaction(null);setQuickDraft(null);setEntrySpeech(false);}}/>}</AnimatePresence>
    {isBudgetModalOpen&&<EditBudgetModal currentBudget={monthlyBudgetPKR} minimumBudget={allocatedBudget(ledger.categoryBudgets)} totalSpent={totalSpentPKR} onSaveBudget={handleSaveBudget} onClose={()=>setIsBudgetModalOpen(false)}/>}
    {isNotificationModalOpen&&<NotificationModal notifications={notifications} onMarkAllAsRead={handleMarkAllNotificationsRead} onClearNotifications={handleClearNotifications} onClose={()=>setIsNotificationModalOpen(false)}/>}
    {viewingReceiptTx&&<ReceiptViewerModal transaction={viewingReceiptTx} onClose={()=>setViewingReceiptTx(null)}/>}
    <AnimatePresence>{toastMessage&&<motion.div key={toastMessage} role="status" aria-live="polite" initial={reducedMotion?false:{opacity:0,y:-8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}} transition={{duration:.18}} className="fixed top-16 left-4 right-4 sm:left-1/2 sm:-translate-x-1/2 sm:w-max sm:max-w-md z-[70] rounded-2xl bg-slate-900 text-white shadow-lg px-4 py-3 text-sm flex items-center gap-2"><Check className="w-4 h-4 text-emerald-300 shrink-0"/>{toastMessage}<button type="button" aria-label="Dismiss notification" className="ml-2 p-1" onClick={()=>setToastMessage(null)}><X size={16}/></button></motion.div>}</AnimatePresence>
  </div></MotionConfig>;
}
