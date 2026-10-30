import React, { useState } from 'react';
import { Repeat2 } from 'lucide-react';
import { CATEGORIES, formatPKR, type ExpenseCategory, type RecurringExpense } from '../types';
import { localDate, parsePKR, validDate } from '../lib/finance';
import { recurringTotal } from '../lib/planning';

interface Props { rules:RecurringExpense[]; onSave:(rule:RecurringExpense)=>boolean; onToggle:(id:string)=>boolean; onPay:(id:string,due:string,date:string,amount:number)=>boolean }
export function RecurringPanel({rules,onSave,onToggle,onPay}:Props) {
  const [adding,setAdding] = useState(false);
  const [merchant,setMerchant] = useState('');
  const [amount,setAmount] = useState('');
  const [category,setCategory] = useState<ExpenseCategory>('Utilities');
  const [due,setDue] = useState(localDate());
  const [error,setError] = useState<string | null>(null);
  const [payment,setPayment] = useState<{id:string;due:string;date:string;amount:string} | null>(null);
  const inputClass = 'w-full rounded-xl border border-slate-200 px-3 py-2 text-sm mt-1';
  return <section className="rounded-3xl bg-white border border-slate-200/70 p-5 sm:p-6">
    <div className="flex items-start justify-between gap-3"><div><div className="flex items-center gap-2"><Repeat2 className="w-4 h-4 text-orange-600"/><h2 className="font-bold text-slate-900">Make the regulars effortless</h2></div><p className="text-xs text-slate-500 mt-1.5">Monthly payments · next due dates across all months</p></div>
      {!adding && <button type="button" className="text-xs text-orange-700 font-semibold underline underline-offset-4 shrink-0" onClick={() => {setAdding(true);setError(null);setPayment(null);}}>Add recurring</button>}
    </div>
    <p className="text-xs text-slate-500 mt-4">{formatPKR(recurringTotal(rules))} planned per month. Review each payment before logging it.</p>
    {adding && <form className="mt-4 space-y-3 p-4 rounded-2xl bg-slate-50" onSubmit={event => {
      event.preventDefault();const parsed = parsePKR(amount);
      if (!merchant.trim() || parsed === null || !validDate(due)) {setError('Enter a name, a positive PKR amount and a valid first due date.');return;}
      if (!onSave({id:crypto.randomUUID(),merchant:merchant.trim(),amount:parsed,category,nextDueDate:due,dayOfMonth:Number(due.slice(8)),active:true})) {setError('Could not save this schedule. Your form is still here; check the saving message and retry.');return;}
      setAdding(false);setMerchant('');setAmount('');setError(null);
    }}>
      <label className="block text-xs font-medium text-slate-600" htmlFor="recurring-name">Payment name<input id="recurring-name" value={merchant} maxLength={100} onChange={event=>setMerchant(event.target.value)} placeholder="Rent, internet or a subscription" className={inputClass}/></label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3"><label className="text-xs text-slate-600" htmlFor="recurring-amount">Monthly amount (PKR)<input id="recurring-amount" inputMode="decimal" value={amount} onChange={event=>setAmount(event.target.value)} className={inputClass}/></label><label className="text-xs text-slate-600" htmlFor="recurring-due">First due date<input id="recurring-due" type="date" value={due} onChange={event=>setDue(event.target.value)} className={inputClass}/></label></div>
      <label className="block text-xs text-slate-600" htmlFor="recurring-category">Payment category<select id="recurring-category" value={category} onChange={event=>setCategory(event.target.value as ExpenseCategory)} className={inputClass}>{CATEGORIES.map(item=><option key={item}>{item}</option>)}</select></label>
      <div className="flex gap-3"><button type="submit" className="bg-slate-900 text-white text-xs font-semibold px-3 py-2 rounded-xl">Save recurring payment</button><button type="button" className="text-xs text-slate-500" onClick={()=>{setAdding(false);setError(null);}}>Cancel</button></div>
    </form>}
    {!rules.length && !adding && <p className="mt-4 text-sm text-slate-500 leading-relaxed">Keep rent, subscriptions and bills in sight. Nothing is added to your expenses until you confirm a payment.</p>}
    <div className="mt-4 space-y-3">{[...rules].sort((a,b)=>Number(b.active)-Number(a.active) || a.nextDueDate.localeCompare(b.nextDueDate)).map(rule=><div key={rule.id} className="rounded-2xl border border-slate-100 p-3.5">
      <div className="flex justify-between gap-3"><div className="min-w-0"><h3 className="text-sm font-semibold text-slate-800 break-words">{rule.merchant}</h3><p className="text-xs text-slate-500 mt-1">{rule.category} · {rule.active ? (rule.nextDueDate < localDate() ? 'Overdue ' : 'Due ') + rule.nextDueDate : 'Paused'}</p></div><span className="text-sm font-bold shrink-0">{formatPKR(rule.amount)}</span></div>
      <div className="flex gap-4 mt-3">{rule.active && <button type="button" className="text-xs font-semibold text-orange-700" aria-label={'Review payment for ' + rule.merchant} onClick={()=>{setPayment({id:rule.id,due:rule.nextDueDate,date:localDate(),amount:String(rule.amount)});setError(null);}}>Review payment</button>}
      <button type="button" className="text-xs text-slate-500" aria-label={(rule.active ? 'Pause ' : 'Resume ') + rule.merchant} onClick={()=>{if (!onToggle(rule.id)) setError('Could not update this schedule. Please retry.');else if (payment?.id === rule.id) setPayment(null);}}>{rule.active ? 'Pause' : 'Resume'}</button></div>
      {payment?.id === rule.id && <form className="mt-4 border-t border-slate-100 pt-3 space-y-3" onSubmit={event=>{
        event.preventDefault();const parsed=parsePKR(payment.amount);
        if(parsed===null || !validDate(payment.date)){setError('Enter a valid amount and payment date.');return;}
        if(onPay(rule.id,payment.due,payment.date,parsed)){setPayment(null);setError(null);}else setError('Could not log this payment. Check the saving message or updated schedule before retrying.');
      }}><p className="text-xs text-slate-500">Confirm what you actually paid. The next due date advances by one month only after saving.</p>
        <label className="block text-xs text-slate-600" htmlFor={'paid-amount-'+rule.id}>Amount paid (PKR)<input id={'paid-amount-'+rule.id} inputMode="decimal" value={payment.amount} onChange={event=>setPayment({...payment,amount:event.target.value})} className={inputClass}/></label>
        <label className="block text-xs text-slate-600" htmlFor={'paid-date-'+rule.id}>Payment date<input id={'paid-date-'+rule.id} type="date" value={payment.date} onChange={event=>setPayment({...payment,date:event.target.value})} className={inputClass}/></label>
        <div className="flex gap-3"><button type="submit" className="rounded-xl bg-orange-600 text-white px-3 py-2 text-xs font-semibold">Confirm payment</button><button type="button" className="text-xs text-slate-500" onClick={()=>setPayment(null)}>Cancel</button></div>
      </form>}
    </div>)}</div>
    {error && <p role="alert" className="text-xs text-rose-700 mt-3">{error}</p>}
  </section>;
}
