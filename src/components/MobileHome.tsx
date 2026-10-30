import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Coffee, Utensils, Car, Wallet, ArrowUpRight, ReceiptText } from 'lucide-react';
import type { Ledger } from '../lib/ledger';
import { formatPKR, type TransactionData, type StoredTransaction } from '../types';
import { localDate, transactionsInMonth } from '../lib/finance';
import { monthSummary } from '../lib/planning';
import { pendingBills, QUICK_EXPENSES } from '../lib/mobile-finance';
import { SavingsGoals } from './SavingsGoals';

interface Props {ledger:Ledger; month:string; onQuick:(data:TransactionData)=>void; onAdd:()=>void; onActivity:()=>void; onPlan:()=>void; onCreateGoal:(name:string,target:number)=>boolean; onContribute:(id:string,amount:number)=>boolean; onEdit:(tx:StoredTransaction)=>void}
export function MobileHome({ledger,month,onQuick,onAdd,onActivity,onPlan,onCreateGoal,onContribute,onEdit}:Props) {
  const reduced=useReducedMotion();
  const summary=monthSummary(ledger.transactions,ledger.monthlyBudgetPKR,month);
  const bills=pendingBills(ledger.recurring??[],month);
  const available=Math.round((summary.remaining-bills.amount)*100)/100;
  const recent=[...transactionsInMonth(ledger.transactions,month)].sort((a,b)=>b.date.localeCompare(a.date)||b.createdAt-a.createdAt).slice(0,3);
  const percent=Math.max(0,Math.min(100,(summary.spent+bills.amount)/ledger.monthlyBudgetPKR*100));
  const shortcuts=[Coffee,Utensils,Car];
  return <div className="space-y-4">
    <div className="pt-1"><h1 className="text-3xl font-bold tracking-tight text-slate-950">A little clarity.</h1><p className="text-sm text-slate-500 mt-1">Your money, in perspective.</p></div>
    <section aria-label="Monthly spending overview" className="relative overflow-hidden rounded-[28px] bg-[#101a31] text-white p-5 sm:p-6">
      <div className="absolute -right-8 -top-12 w-48 h-48 rounded-full border-[26px] border-white/[.035] pointer-events-none"/>
      <div className="relative"><div className="flex justify-between gap-3 items-center"><span className="text-sm text-slate-200">{available<0?'Over your plan':'Left this month'}</span><Wallet className="w-5 h-5 text-orange-300"/></div>
        <motion.p className="text-4xl font-bold tracking-tight mt-2 break-words" key={available} initial={false} animate={{opacity:1}}>{formatPKR(Math.abs(available))}</motion.p>
        <p className="text-xs text-slate-300 mt-1">{month<localDate().slice(0,7)?'Budget less recorded expenses':'After planned bills'} · <button type="button" onClick={onPlan} className="underline underline-offset-2">View plan</button></p>
        <div className="h-2 bg-white/15 rounded-full mt-5 overflow-hidden" role="progressbar" aria-label="Budget spent or reserved" aria-valuenow={Math.round(percent)} aria-valuemin={0} aria-valuemax={100}><motion.div className="h-full bg-orange-400 rounded-full" initial={false} animate={{width:percent+'%'}} transition={{duration:reduced?0:.25}}/></div>
        <div className="flex justify-between gap-3 text-xs text-slate-300 mt-2"><span>{formatPKR(summary.spent)} spent</span><span>{formatPKR(bills.amount)} reserved</span></div>
        {bills.count>0&&<p className="mt-2 text-[11px] text-slate-300">Reserves {bills.count} unpaid monthly {bills.count===1?'bill':'bills'} due by month-end, including overdue bills.</p>}
      </div>
    </section>
    <SavingsGoals goals={ledger.goals??[]} compact onCreate={onCreateGoal} onContribute={onContribute} onSeeAll={onPlan}/>
    <section aria-label="Quick expense shortcuts"><div className="flex justify-between items-center mb-2"><h2 className="text-base font-bold text-slate-900">Quick add</h2><button type="button" className="text-xs text-slate-500 py-2" onClick={onAdd}>Smart Note <ArrowUpRight className="inline w-3 h-3"/></button></div>
      <div className="grid grid-cols-3 gap-2">{QUICK_EXPENSES.map((item,index)=>{const Icon=shortcuts[index];return <motion.button whileTap={reduced?undefined:{scale:.96}} type="button" key={item.name} onClick={()=>onQuick({amount:item.amount,merchant:item.name,category:item.category,date:localDate(),notes:'Quick entry',currency:'PKR'})} className={'rounded-2xl p-3 flex gap-2 items-center text-left '+(index===2?'bg-violet-50':'bg-orange-50')}><Icon className={'w-5 h-5 shrink-0 '+(index===2?'text-violet-600':'text-orange-600')}/><span className="min-w-0"><strong className="text-xs text-slate-900 block">{item.name}</strong><span className="text-[11px] text-slate-500">{formatPKR(item.amount)}</span></span></motion.button>;})}</div>
    </section>
    <section aria-label="Recent activity"><div className="flex items-center justify-between mb-1"><h2 className="text-base font-bold text-slate-900">Recent activity</h2><button type="button" onClick={onActivity} className="text-xs text-slate-500 py-2">See all →</button></div>
      {!recent.length?<div className="rounded-3xl bg-white p-5 border border-slate-100 text-center"><ReceiptText className="w-7 h-7 text-orange-500 mx-auto mb-2"/><p className="text-sm text-slate-600">Your first expense starts the story.</p><button type="button" onClick={onAdd} className="text-orange-700 font-semibold text-sm mt-3">Add an expense</button></div>:<div className="divide-y divide-slate-100">{recent.map(tx=><motion.button key={tx.id} type="button" initial={reduced?false:{opacity:0,y:-6}} animate={{opacity:1,y:0}} transition={{duration:.2}} onClick={()=>onEdit(tx)} className="w-full flex gap-3 items-center py-3 text-left"><span className="w-10 h-10 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600 shrink-0"><ReceiptText className="w-5 h-5"/></span><span className="flex-1 min-w-0"><strong className="text-sm text-slate-900 block truncate">{tx.merchant||tx.category}</strong><span className="text-[11px] text-slate-500">{tx.date===localDate()?'Today':tx.date} · {tx.category}</span></span><strong className="text-sm text-slate-900 shrink-0">− {formatPKR(tx.amount)}</strong></motion.button>)}</div>}
    </section>
  </div>;
}
