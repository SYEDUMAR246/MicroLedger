import React, { useState } from 'react';
import { Target } from 'lucide-react';
import { CATEGORIES, CATEGORY_META, formatPKR, type ExpenseCategory, type StoredTransaction } from '../types';
import { parsePKR, totalPKR } from '../lib/finance';
import { allocatedBudget } from '../lib/planning';

type Budgets = Partial<Record<ExpenseCategory,number>>;
export function CategoryBudgets({budgets, monthlyBudget, transactions, onSave}: {budgets:Budgets; monthlyBudget:number; transactions:StoredTransaction[]; onSave:(budgets:Budgets)=>boolean}) {
  const [editing,setEditing] = useState(false);
  const [draft,setDraft] = useState<Partial<Record<ExpenseCategory,string>>>({});
  const [error,setError] = useState<string | null>(null);
  const configured = CATEGORIES.filter(category => budgets[category] !== undefined);
  return <section className="rounded-3xl bg-white border border-slate-200/70 p-5 sm:p-6">
    <div className="flex items-start justify-between gap-3">
      <div><div className="flex items-center gap-2"><Target className="w-4 h-4 text-orange-600"/><h2 className="font-bold text-slate-900">Give every rupee a plan</h2></div><p className="text-xs text-slate-500 mt-1.5">Category limits repeat each month.</p></div>
      {!editing && <button type="button" className="text-xs font-semibold text-orange-700 underline underline-offset-4 shrink-0" onClick={() => {
        setDraft(Object.fromEntries(CATEGORIES.map(category => [category,budgets[category]?.toString() ?? ''])));setError(null);setEditing(true);
      }}>{configured.length ? 'Edit limits' : 'Set limits'}</button>}
    </div>
    {editing ? <form className="mt-4 space-y-4" onSubmit={event => {
      event.preventDefault();
      const next:Budgets = {};
      for (const category of CATEGORIES) {
        if (!draft[category]?.trim()) continue;
        const amount = parsePKR(draft[category]!);
        if (amount === null) {setError('Use a positive PKR amount for ' + category + ', or leave it blank.');return;}
        next[category] = amount;
      }
      if (allocatedBudget(next) > monthlyBudget) {setError('Category limits exceed your monthly budget of ' + formatPKR(monthlyBudget) + '.');return;}
      if (!onSave(next)) {setError('Could not save your category limits. Your changes are still here. Check the saving message and retry.');return;}
      setEditing(false);setError(null);
    }}>
      <p className="text-xs text-slate-500">Leave a category blank to remove its limit. Limits must fit inside {formatPKR(monthlyBudget)}.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{CATEGORIES.map((category,index) => <div key={category}>
        <label htmlFor={'category-limit-' + index} className="block text-xs font-medium text-slate-600 mb-1">{category}</label>
        <input id={'category-limit-' + index} inputMode="decimal" value={draft[category] ?? ''} onChange={event => setDraft({...draft,[category]:event.target.value})} placeholder="No limit" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
      </div>)}</div>
      {error && <p role="alert" className="text-xs text-rose-700">{error}</p>}
      <div className="flex gap-3"><button type="submit" className="bg-slate-900 text-white rounded-xl px-4 py-2 text-xs font-semibold">Save category limits</button><button type="button" className="text-xs text-slate-500" onClick={() => setEditing(false)}>Cancel</button></div>
    </form> : <div className="mt-5 space-y-5">
      {!configured.length && <p className="text-sm text-slate-500 leading-relaxed">Make room for groceries, transport and the things you enjoy. Start with the categories that matter to you.</p>}
      {configured.map(category => {
        const spent = totalPKR(transactions.filter(tx => tx.category === category));
        const limit = budgets[category]!;
        return <div key={category}><div className="flex justify-between items-center gap-3 text-xs"><span className="font-semibold text-slate-700">{category}</span><span className={spent > limit ? 'text-rose-700' : 'text-slate-500'}>{formatPKR(spent)} / {formatPKR(limit)}</span></div>
          <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden mt-2"><div className="h-full rounded-full" style={{width:Math.min(100,spent / limit * 100)+'%',backgroundColor:spent > limit ? '#e11d48' : CATEGORY_META[category].colorHex}} /></div>
          {spent > limit && <p className="text-xs text-rose-700 mt-1">{formatPKR(spent-limit)} over this category limit</p>}
        </div>;
      })}
      <p className="text-xs text-slate-500 border-t border-slate-100 pt-3">{formatPKR(allocatedBudget(budgets))} allocated · {formatPKR(monthlyBudget - allocatedBudget(budgets))} unallocated</p>
    </div>}
  </section>;
}
