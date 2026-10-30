import assert from 'node:assert/strict';
import { test } from 'node:test';
import { contributeToGoal, goalSaved, pendingBills } from '../src/lib/mobile-finance';
import { emptyLedger, exportBackup, parseBackup, mergeBackup, validateLedger, writeLedger, readLedger } from '../src/lib/ledger';
import { logRecurringPayment } from '../src/lib/planning';
import type { SavingsGoal, RecurringExpense } from '../src/types';

const goal:SavingsGoal={id:'phone',name:'Next phone',target:60000,contributions:[]};
const rule:RecurringExpense={id:'internet',merchant:'Internet',amount:3000,category:'Utilities',nextDueDate:'2026-10-30',dayOfMonth:30,active:true};

test('savings contributions record real progress without inventing an expense or changing the budget',()=>{
  const original={...emptyLedger(),goals:[goal]};
  const next=contributeToGoal(original,'phone',500,'contribution-1','2026-10-30');
  assert.equal(goalSaved(next.goals![0]),500);assert.equal(goalSaved(original.goals[0]),0);
  assert.deepEqual(next.transactions,[]);assert.equal(next.monthlyBudgetPKR,original.monthlyBudgetPKR);
  assert.throws(()=>contributeToGoal(next,'phone',500,'contribution-1','2026-10-30'),/already recorded/);
  assert.throws(()=>contributeToGoal(next,'phone',60000,'contribution-2','2026-10-30'),/exceeds/);
});

test('goals can reach their exact target and use integer-paisa calculations',()=>{
  const original={...emptyLedger(),goals:[{...goal,target:0.3}]};
  const first=contributeToGoal(original,'phone',0.1,'a','2026-10-30');
  const complete=contributeToGoal(first,'phone',0.2,'b','2026-10-30');
  assert.equal(goalSaved(complete.goals![0]),0.3);validateLedger(complete);
  assert.throws(()=>contributeToGoal(complete,'phone',0.01,'c','2026-10-30'));
});

test('a failed savings save preserves both the ledger and goal progress',()=>{
  const original={...emptyLedger(),goals:[goal]};
  const raw=JSON.stringify({version:1,ledger:original});
  const storage={getItem:()=>raw,setItem:()=>{throw new Error('Storage full');}};
  assert.throws(()=>writeLedger(storage,contributeToGoal(original,'phone',500,'a','2026-10-30'),raw));
  assert.deepEqual(readLedger(storage).ledger,original);
});

test('backups preserve savings and merge new goals without rolling back current contributions',()=>{
  const original={...emptyLedger(),goals:[goal]};
  const older=parseBackup(exportBackup(original));
  const newer=contributeToGoal(original,'phone',500,'a','2026-10-30');
  assert.deepEqual(parseBackup(exportBackup(newer)).ledger,newer);
  assert.equal(goalSaved(mergeBackup(newer,older).goals![0]),500);
  assert.deepEqual(mergeBackup(emptyLedger(),parseBackup(exportBackup(newer))),newer);
  assert.deepEqual(mergeBackup(newer,parseBackup(exportBackup(emptyLedger()))),newer);
});

test('invalid goals and contributions cannot be imported',()=>{
  for(const goals of [[{...goal,target:-1}],[{...goal,name:''}],[goal,goal],[{...goal,contributions:[{id:'x',amount:-2,date:'2026-10-30'}]}],[{...goal,contributions:[{id:'x',amount:70000,date:'2026-10-30'}]}],[{...goal,contributions:[{id:'x',amount:5,date:'2026-02-30'}]}]])assert.throws(()=>validateLedger({...emptyLedger(),goals}));
});

test('planned bills reserve unpaid monthly obligations and exclude paused or future bills',()=>{
  assert.deepEqual(pendingBills([rule],'2026-10','2026-10-30'),{amount:3000,count:1});
  assert.deepEqual(pendingBills([rule],'2026-11','2026-10-30'),{amount:6000,count:2});
  assert.deepEqual(pendingBills([{...rule,active:false}],'2026-10','2026-10-30'),{amount:0,count:0});
  assert.deepEqual(pendingBills([{...rule,nextDueDate:'2026-11-30'}],'2026-10','2026-10-30'),{amount:0,count:0});
  assert.deepEqual(pendingBills([rule],'2026-09','2026-10-30'),{amount:0,count:0});
});

test('recording a scheduled bill removes its reservation instead of double-counting it',()=>{
  const ledger={...emptyLedger(),recurring:[rule]};
  const before=pendingBills(ledger.recurring,'2026-10','2026-10-30').amount;
  const paid=logRecurringPayment(ledger,rule.id,rule.nextDueDate,'2026-10-30',3000);
  const after=pendingBills(paid.recurring!,'2026-10','2026-10-30').amount;
  assert.equal(before,paid.transactions[0].amount+after);
});
