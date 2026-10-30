import React, { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Plus, Smartphone, Check } from 'lucide-react';
import { formatPKR, type SavingsGoal } from '../types';
import { goalSaved } from '../lib/mobile-finance';
import { parsePKR } from '../lib/finance';

interface Props {goals:SavingsGoal[]; compact?:boolean; onCreate:(name:string,target:number)=>boolean; onContribute:(id:string,amount:number)=>boolean; onSeeAll?:()=>void}
export function SavingsGoals({goals,compact=false,onCreate,onContribute,onSeeAll}:Props) {
  const reduced=useReducedMotion();
  const [creating,setCreating]=useState(false);
  const [name,setName]=useState('');const [target,setTarget]=useState('');
  const [contributing,setContributing]=useState<string|null>(null);
  const [amount,setAmount]=useState('');const [error,setError]=useState<string|null>(null);
  const displayed=compact?goals.slice(0,1):goals;
  const input='w-full rounded-2xl border border-slate-200 bg-white p-3 text-base mt-1';
  return <section aria-label="Savings goals" className={compact?'':'rounded-3xl bg-white p-5 border border-slate-100'}>
    {!compact && <div className="flex items-center justify-between mb-3"><h2 className="font-bold text-slate-900">Your next big thing</h2><button type="button" className="text-sm text-orange-700 font-semibold" onClick={()=>{setCreating(!creating);setError(null);}}>New goal</button></div>}
    {!goals.length && !creating && <button type="button" onClick={()=>setCreating(true)} className="w-full text-left rounded-3xl bg-[#eee7ff] p-5 flex gap-4 items-center"><Smartphone className="w-8 h-8 text-violet-600 shrink-0"/><span><strong className="block text-slate-900">What are you saving for?</strong><span className="text-sm text-slate-600">A new phone, a trip, your next big thing.</span><span className="block text-violet-700 text-sm font-semibold mt-2">Create your first goal →</span></span></button>}
    {creating && <form className="rounded-3xl bg-[#eee7ff] p-4 space-y-3" onSubmit={event=>{event.preventDefault();const parsed=parsePKR(target);if(!name.trim()||parsed===null){setError('Enter a goal name and a positive target in PKR.');return;}if(onCreate(name.trim(),parsed)){setCreating(false);setName('');setTarget('');setError(null);}else setError('Could not save this goal. Your form is still here; check the saving message and retry.');}}>
      <label className="block text-sm text-slate-700" htmlFor="goal-name">Goal name<input id="goal-name" value={name} maxLength={80} onChange={event=>setName(event.target.value)} placeholder="Next phone" className={input}/></label>
      <label className="block text-sm text-slate-700" htmlFor="goal-target">Target (PKR)<input id="goal-target" inputMode="decimal" value={target} onChange={event=>setTarget(event.target.value)} placeholder="60,000" className={input}/></label>
      <div className="flex items-center gap-4"><button type="submit" className="rounded-xl bg-violet-700 text-white px-4 py-3 text-sm font-semibold">Create goal</button><button type="button" className="text-sm text-slate-600" onClick={()=>setCreating(false)}>Cancel</button></div>
    </form>}
    <div className="space-y-3">{displayed.map(goal=>{
      const saved=goalSaved(goal);const percent=Math.min(100,saved/goal.target*100);const complete=saved>=goal.target;
      return <div key={goal.id} className="rounded-3xl bg-[#eee7ff] p-4 sm:p-5">
        <div className="flex gap-3 items-center"><span className="p-2 rounded-2xl bg-violet-200/60 text-violet-700">{complete?<Check className="w-6 h-6"/>:<Smartphone className="w-6 h-6"/>}</span><div className="flex-1 min-w-0"><h3 className="font-semibold text-slate-900 truncate">{goal.name}</h3><p className="text-base font-bold mt-1">{formatPKR(saved)} <span className="text-xs font-normal text-slate-600">/ {formatPKR(goal.target)}</span></p></div>{!complete&&<button type="button" aria-label={'Add savings to '+goal.name} className="w-10 h-10 rounded-full bg-white text-violet-700 flex items-center justify-center" onClick={()=>{setContributing(goal.id);setAmount('');setError(null);}}><Plus className="w-5 h-5"/></button>}</div>
        <div className="flex gap-3 items-center mt-3"><div className="flex-1 h-2 bg-violet-200 rounded-full overflow-hidden" role="progressbar" aria-label={goal.name+' progress'} aria-valuenow={Math.round(percent)} aria-valuemin={0} aria-valuemax={100}><motion.div className="h-full bg-violet-600 rounded-full" initial={false} animate={{width:percent+'%'}} transition={{duration:reduced?0:.3}}/></div><span className="text-xs font-semibold text-violet-800">{complete?'Goal reached!':Math.floor(percent)+'%'}</span></div>
        {contributing===goal.id&&<form className="mt-4 border-t border-violet-200 pt-3 space-y-3" onSubmit={event=>{event.preventDefault();const parsed=parsePKR(amount);if(parsed===null||parsed>goal.target-saved){setError('Enter a positive amount up to '+formatPKR(Math.round((goal.target-saved)*100)/100)+'.');return;}if(onContribute(goal.id,parsed)){setContributing(null);setError(null);}else setError('Could not record this contribution. Your amount is still here; check the saving message and retry.');}}><label className="block text-sm" htmlFor={'goal-add-'+goal.id}>Amount saved (PKR)<input id={'goal-add-'+goal.id} inputMode="decimal" value={amount} onChange={event=>setAmount(event.target.value)} className={input}/></label><p className="text-xs text-slate-600">Record money you already set aside. This does not move money or add an expense.</p><div className="flex gap-4"><button type="submit" className="bg-violet-700 text-white rounded-xl px-4 py-3 text-sm">Record savings</button><button type="button" className="text-sm text-slate-600" onClick={()=>setContributing(null)}>Cancel</button></div></form>}
      </div>;
    })}</div>
    {error&&<p role="alert" className="text-sm text-rose-700 mt-3">{error}</p>}
    {compact&&goals.length>1&&<button type="button" onClick={onSeeAll} className="mt-2 text-sm text-violet-700 font-semibold">See all goals →</button>}
  </section>;
}
