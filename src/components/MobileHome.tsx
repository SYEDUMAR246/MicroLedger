import {Mascot,type MascotExpression} from './Mascot';
import {DEFAULT_MASCOT} from '../lib/personalization';
import React,{useState,useEffect} from 'react';
import { motion,useReducedMotion } from 'motion/react';
import { CalendarDays,ChevronRight,Keyboard,Mic,ScanLine,Plus } from 'lucide-react';
import type { Ledger } from '../lib/ledger';
import type { StoredTransaction } from '../types';
import { formatPKR } from '../types';
import { localDate,totalPKR,transactionsInMonth } from '../lib/finance';
import { journalEntries } from '../lib/journal';
import { ExpenseTimeline } from './ExpenseTimeline';

export function MobileHome({onCustomizeMascot,ledger,month,name='',onAdd,onActivity,onPlan,onEdit}:{onCustomizeMascot:()=>void;ledger:Ledger;month:string;name?:string;onAdd:(mode?:'text'|'receipt'|'manual'|'voice')=>void;onActivity:()=>void;onPlan:()=>void;onEdit:(tx:StoredTransaction)=>void}){
  const reduced=useReducedMotion();const today=localDate();const total=totalPKR(transactionsInMonth(ledger.transactions,month));const spentToday=totalPKR(ledger.transactions.filter(tx=>tx.date===today));const remaining=Math.round((ledger.monthlyBudgetPKR-total)*100)/100;const percent=total/ledger.monthlyBudgetPKR*100;
  const [play,setPlay]=useState<MascotExpression|null>(null);useEffect(()=>{if(!play)return;const timer=setTimeout(()=>setPlay(null),3500);return()=>clearTimeout(timer);},[play]);
  const accomplished=(ledger.goals??[]).some(goal=>goal.contributions.reduce((sum,item)=>sum+item.amount,0)>=goal.target);
  const expression:MascotExpression=play??(remaining<0?'concerned':accomplished?'celebrate':spentToday>0?'wink':'happy');
  const moments=journalEntries(ledger.transactions.filter(tx=>tx.date===today)).slice(0,2);
  const nextBill=[...(ledger.recurring??[])].filter(rule=>rule.active).sort((a,b)=>a.nextDueDate.localeCompare(b.nextDueDate))[0];
  return <div className="pp-today">
    <p className="pp-current-date">{new Date().toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long'})}{name&&<span className="pp-hello-name">Hello, {name.split(' ')[0]}</span>}</p>
    <div className="pp-hero-heading"><h1 className="pp-title">Your day,<br/>in balance<span>.</span></h1><img src="/images/paper-tea.png" className="pp-tea" alt=""/><span className="pp-coral-stroke"/></div>
    <div className="pp-money-grid"><div><p>{remaining<0?'Over this month':'Left this month'}</p><strong className="pp-main-money">{formatPKR(Math.abs(remaining))}</strong></div><div><p>Spent today</p><strong className="pp-today-money">{formatPKR(spentToday)}</strong></div></div>
    <div className="pp-budget-caption"><span>{formatPKR(total)} of {formatPKR(ledger.monthlyBudgetPKR)} used</span><span>{Math.round(percent)}%</span></div>
    <div className="pp-track" role="progressbar" aria-label="Monthly budget used" aria-valuenow={Math.min(100,Math.round(percent))} aria-valuemin={0} aria-valuemax={100}><motion.div initial={false} animate={{width:Math.min(100,percent)+'%'}} transition={{duration:reduced?0:.3}}/></div>
    <button type="button" onClick={onPlan} className="pp-upcoming"><span className="pp-upcoming-icon"><CalendarDays size={24} strokeWidth={1.6}/></span><span className="pp-upcoming-text"><small>{nextBill?(nextBill.nextDueDate<today?'Overdue':'Coming up'):'Make a little plan'}</small><strong>{nextBill?nextBill.merchant+' · '+new Date(nextBill.nextDueDate+'T12:00:00').toLocaleDateString('en-GB',{day:'numeric',month:'short'}):'Add a bill or subscription'}</strong></span>{nextBill&&<span className="pp-upcoming-amount">{formatPKR(nextBill.amount)}</span>}<ChevronRight size={17}/></button>
    {(ledger.mascot??DEFAULT_MASCOT).visible&&<div className="pp-companion-home"><button type="button" className="pp-companion-poke" aria-label={'Play with '+(ledger.mascot??DEFAULT_MASCOT).name} onClick={()=>setPlay(play==='wink'?'celebrate':'wink')}><Mascot value={ledger.mascot??DEFAULT_MASCOT} expression={expression} decorative/></button><span><strong>{(ledger.mascot??DEFAULT_MASCOT).name} is in your corner.</strong><small>{remaining<0?'A fresh plan is always a small step away.':accomplished?'A savings goal reached. Look how far you’ve come!':total===0?'A fresh page. Take it at your own pace.':'Every little check-in helps you see the bigger picture.'}</small><small>Tap your companion for a little hello.</small></span><button type="button" className="pp-companion-edit" aria-label="Customize your companion" onClick={onCustomizeMascot}>›</button></div>}
    <section className="pp-today-moments"><div className="pp-section-heading"><h2>Today’s moments</h2><button type="button" onClick={onActivity}>View activity <ChevronRight size={14}/></button></div>{moments.length?<ExpenseTimeline entries={moments} onEdit={onEdit}/>:<div className="pp-empty pp-empty-today"><p>A fresh page for your day.</p><span>Your first expense will appear here.</span></div>}</section>
    <section className="pp-log-section"><h2>Log it your way</h2><div className="pp-log-modes">{[{mode:'text' as const,label:'Type',icon:Keyboard},{mode:'voice' as const,label:'Speak',icon:Mic},{mode:'receipt' as const,label:'Scan',icon:ScanLine}].map(item=><button key={item.mode} type="button" onClick={()=>onAdd(item.mode)}><span><item.icon size={19}/></span>{item.label}</button>)}</div><button type="button" className="pp-primary pp-add-expense" onClick={()=>onAdd('text')}><Plus size={22}/>Add expense</button></section>
  </div>;
}
