import assert from 'node:assert/strict';
import { test } from 'node:test';
import { journalEntries,groupJournal,journalDay } from '../src/lib/journal';
import type { StoredTransaction } from '../src/types';
const tx=(id:string,date:string,time:string,amount:number,category:StoredTransaction['category']='Food & Dining'):StoredTransaction=>({id,date,time,amount,category,merchant:id,notes:'Chai with friends',currency:'PKR',createdAt:1,source:'manual'});
const entries=[tx('Lunch','2026-10-30','13:05',450),tx('Careem','2026-10-30','14:14',300,'Transportation'),tx('Groceries','2026-10-29','19:20',2100,'Groceries'),tx('Coffee','2026-10-14','09:15',250)];
test('journal entries are grouped by date with newest transaction first and accurate totals',()=>{
  const groups=groupJournal(entries);
  assert.deepEqual(groups.map(item=>item.date),['2026-10-30','2026-10-29','2026-10-14']);
  assert.deepEqual(groups[0].entries.map(item=>item.id),['Careem','Lunch']);
  assert.equal(groups[0].total,750);
  assert.deepEqual(entries.map(item=>item.id),['Lunch','Careem','Groceries','Coffee']);
});
test('journal search, category chips and date filters compose without altering saved records',()=>{
  assert.equal(journalEntries(entries,{query:'careem'})[0].amount,300);
  assert.equal(journalEntries(entries,{query:' CHAI ',category:'Food & Dining'}).length,2);
  assert.equal(journalEntries(entries,{from:'2026-10-29',to:'2026-10-30'}).length,3);
  assert.equal(journalEntries(entries,{from:'2026-10-30',to:'2026-10-30',category:'Transportation'}).length,1);
  assert.deepEqual(journalEntries(entries,{query:'missing merchant'}),[]);
});
test('day labels handle month and year boundaries using local calendar days',()=>{
  assert.equal(journalDay('2026-10-30','2026-10-30'),'Today');
  assert.equal(journalDay('2025-12-31','2026-01-01'),'Yesterday');
  assert.equal(journalDay('2026-02-28','2026-03-01'),'Yesterday');
  assert.equal(journalDay('2026-10-14','2026-10-30'),'14 October');
});
