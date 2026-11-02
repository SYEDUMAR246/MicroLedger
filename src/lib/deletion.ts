import type { Ledger } from './ledger';
import { deleteTransactions, undoDelete } from './ledger';
import type { RecurringExpense, SavingsGoal } from '../types';

export const UNDO_DURATION=5000;
export type PendingDeletion =
  | {kind:'expenses';label:string;expiresAt:number}
  | {kind:'bill';label:string;expiresAt:number;value:RecurringExpense;index:number}
  | {kind:'goal';label:string;expiresAt:number;value:SavingsGoal;index:number};

export function discardDeletion(ledger:Ledger):Ledger {
  const {deletion,...rest}=ledger;
  return {...rest,undo:[]};
}
export function removeExpenses(ledger:Ledger,ids:string[],now=Date.now()):Ledger {
  const existing=ledger.transactions.filter(tx=>ids.includes(tx.id));
  if(!existing.length)return ledger;
  const next=deleteTransactions(discardDeletion(ledger),ids);
  return {...next,deletion:{kind:'expenses',label:existing.length===1?'Expense deleted':existing.length+' expenses deleted',expiresAt:now+UNDO_DURATION}};
}
export function removeBill(ledger:Ledger,id:string,now=Date.now()):Ledger {
  const index=ledger.recurring?.findIndex(rule=>rule.id===id)??-1;
  if(index<0)throw new Error('This bill has already been removed.');
  const value=ledger.recurring![index];
  return {...discardDeletion(ledger),recurring:ledger.recurring!.filter(rule=>rule.id!==id),deletion:{kind:'bill',value,index,label:'Bill deleted',expiresAt:now+UNDO_DURATION}};
}
export function removeGoal(ledger:Ledger,id:string,now=Date.now()):Ledger {
  const index=ledger.goals?.findIndex(goal=>goal.id===id)??-1;
  if(index<0)throw new Error('This goal has already been removed.');
  const value=ledger.goals![index];
  return {...discardDeletion(ledger),goals:ledger.goals!.filter(goal=>goal.id!==id),deletion:{kind:'goal',value,index,label:'Goal deleted',expiresAt:now+UNDO_DURATION}};
}
export function undoRemaining(deletion:PendingDeletion|undefined,now=Date.now()):number {
  return deletion?Math.max(0,Math.ceil((deletion.expiresAt-now)/1000)):0;
}
export function restoreDeletion(ledger:Ledger,now=Date.now()):Ledger {
  const deletion=ledger.deletion;
  if(!deletion||now>=deletion.expiresAt)throw new Error('The five-second undo window has ended.');
  const base=discardDeletion(ledger);
  if(deletion.kind==='expenses')return undoDelete({...base,undo:ledger.undo});
  if(deletion.kind==='bill'){
    const recurring=[...(base.recurring??[])];
    if(!recurring.some(rule=>rule.id===deletion.value.id))recurring.splice(Math.min(deletion.index,recurring.length),0,deletion.value);
    return {...base,recurring};
  }
  const goals=[...(base.goals??[])];
  if(!goals.some(goal=>goal.id===deletion.value.id))goals.splice(Math.min(deletion.index,goals.length),0,deletion.value);
  return {...base,goals};
}
