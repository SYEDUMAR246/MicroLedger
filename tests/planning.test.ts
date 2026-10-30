import assert from 'node:assert/strict';
import { test } from 'node:test';
import { allocatedBudget, monthSummary, nextMonthlyDate, logRecurringPayment, recurringTotal } from '../src/lib/planning';
import { emptyLedger, exportBackup, parseBackup, mergeBackup, readLedger, writeLedger, validateLedger } from '../src/lib/ledger';
import type { RecurringExpense, StoredTransaction } from '../src/types';

const tx = (date:string,amount:number):StoredTransaction => ({id:date,amount,currency:'PKR',date,category:'Utilities',notes:'Bill',source:'manual',createdAt:1});
const rule:RecurringExpense = {id:'internet',merchant:'Internet',amount:3000,category:'Utilities',nextDueDate:'2026-01-31',dayOfMonth:31,active:true};

test('month summary uses calendar days and integer-paisa totals, with closed and future months',()=>{
  const transactions=[tx('2026-10-01',1000),tx('2026-10-30',1000.5),tx('2026-09-01',500)];
  const summary=monthSummary(transactions,10000,'2026-10','2026-10-30');
  assert.equal(summary.spent,2000.5);
  assert.equal(summary.daysLeft,2);
  assert.equal(summary.dailyAllowance,3999.75);
  assert.equal(summary.previousSpent,500);
  assert.equal(summary.difference,1500.5);
  assert.equal(monthSummary(transactions,10000,'2026-09','2026-10-30').dailyAllowance,null);
  assert.equal(monthSummary(transactions,10000,'2026-11','2026-10-30').daysLeft,30);
  assert.equal(monthSummary(transactions,10000,'2024-02','2024-02-29').daysLeft,1);
});

test('overspending shows a shortfall and zero daily allowance',()=>{
  const summary=monthSummary([tx('2026-10-01',1500)],1000,'2026-10','2026-10-30');
  assert.equal(summary.remaining,-500);assert.equal(summary.dailyAllowance,0);
});

test('category allocations fit inside the monthly budget and reject malformed caps',()=>{
  assert.equal(allocatedBudget({'Food & Dining':0.1,Utilities:0.2}),0.3);
  validateLedger({...emptyLedger(),categoryBudgets:{Utilities:120000}});
  for(const categoryBudgets of [{Utilities:120001},{Utilities:-1},{Utilities:0},{Unknown:500},{Utilities:'500'},[]]) {
    assert.throws(()=>validateLedger({...emptyLedger(),categoryBudgets}));
  }
});

test('monthly schedules preserve day 31 through February and cross year boundaries',()=>{
  assert.equal(nextMonthlyDate('2026-01-31',31),'2026-02-28');
  assert.equal(nextMonthlyDate('2026-02-28',31),'2026-03-31');
  assert.equal(nextMonthlyDate('2024-01-31',31),'2024-02-29');
  assert.equal(nextMonthlyDate('2026-12-31',31),'2027-01-31');
});

test('logging records the confirmed amount and actual date, and advances only one occurrence',()=>{
  const original={...emptyLedger(),recurring:[rule]};
  const paid=logRecurringPayment(original,rule.id,rule.nextDueDate,'2026-02-02',3200,1000);
  assert.equal(original.transactions.length,0);
  assert.equal(original.recurring[0].nextDueDate,'2026-01-31');
  assert.equal(paid.transactions[0].amount,3200);
  assert.equal(paid.transactions[0].date,'2026-02-02');
  assert.equal(paid.recurring?.[0].nextDueDate,'2026-02-28');
  assert.throws(()=>logRecurringPayment(paid,rule.id,rule.nextDueDate,'2026-02-02',3200),/already logged/);
});

test('paused schedules and duplicate occurrence records cannot create payments',()=>{
  const ledger={...emptyLedger(),recurring:[{...rule,active:false}]};
  assert.equal(recurringTotal(ledger.recurring),0);
  assert.throws(()=>logRecurringPayment(ledger,rule.id,rule.nextDueDate,'2026-01-31',3000));
  const active={...ledger,recurring:[rule]};
  const paid=logRecurringPayment(active,rule.id,rule.nextDueDate,'2026-01-31',3000);
  assert.throws(()=>logRecurringPayment({...paid,recurring:[rule]},rule.id,rule.nextDueDate,'2026-01-31',3000),/already recorded/);
  assert.throws(()=>logRecurringPayment(active,rule.id,rule.nextDueDate,'2026-02-30',3000));
});

test('failed persistence leaves both the payment and schedule unchanged',()=>{
  const original={...emptyLedger(),recurring:[rule]};
  const raw=JSON.stringify({version:1,ledger:original});
  const storage={getItem:()=>raw,setItem:()=>{throw new Error('Storage full');}};
  const next=logRecurringPayment(original,rule.id,rule.nextDueDate,'2026-01-31',3000);
  assert.throws(()=>writeLedger(storage,next,raw),/Storage full/);
  assert.deepEqual(readLedger(storage).ledger,original);
});

test('new planning fields round trip through backups, preserving existing schedule progress on merge',()=>{
  const saved={...emptyLedger(),categoryBudgets:{Utilities:5000},recurring:[rule]};
  const backup=parseBackup(exportBackup(saved));
  assert.deepEqual(backup.ledger,saved);
  const current=logRecurringPayment(saved,rule.id,rule.nextDueDate,'2026-01-31',3000);
  const merged=mergeBackup(current,backup);
  assert.equal(merged.recurring?.length,1);
  assert.equal(merged.recurring?.[0].nextDueDate,'2026-02-28');
  assert.deepEqual(merged.categoryBudgets,{Utilities:5000});
  assert.deepEqual(mergeBackup(merged,backup),merged);
});

test('older backups remain restorable after adding planning fields',()=>{
  const old=emptyLedger();
  const backup=parseBackup(exportBackup(old));
  assert.deepEqual(mergeBackup(emptyLedger(),backup),old);
  const merged=mergeBackup({...emptyLedger(),categoryBudgets:{Utilities:5000},recurring:[rule]},backup);
  assert.deepEqual(merged.categoryBudgets,{});
  assert.deepEqual(merged.recurring,[rule]);
});

test('invalid or duplicate recurring schedules are rejected before restore',()=>{
  for(const recurring of [[{...rule,amount:-1}],[{...rule,dayOfMonth:0}],[{...rule,nextDueDate:'2026-02-30'}],[{...rule,active:'yes'}],[rule,rule]]) {
    assert.throws(()=>validateLedger({...emptyLedger(),recurring}));
  }
});
