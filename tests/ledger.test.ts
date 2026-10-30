import assert from 'node:assert/strict';
import { test } from 'node:test';
import { LEDGER_KEY, LEGACY_KEYS, emptyLedger, readLedger, writeLedger, parseBackup, exportBackup, mergeBackup, deleteTransactions, undoDelete, type Ledger } from '../src/lib/ledger';
import type { StoredTransaction } from '../src/types';

class MemoryStorage {
  values = new Map<string,string>();
  failWrites = false;
  writes = 0;
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) {
    if (this.failWrites) throw new DOMException('Storage full', 'QuotaExceededError');
    this.writes++; this.values.set(key,value);
  }
}
const tx = (id: string, amount = 1450): StoredTransaction => ({id, amount, currency:'PKR', date:'2026-10-29', time:'14:30', category:'Food & Dining', notes:'Lunch', merchant:'Cafe', source:'manual', createdAt:1, receiptImage:'data:image/png;base64,aGVsbG8='});
const ledger = (): Ledger => ({...emptyLedger(),transactions:[tx('a'),tx('b',200)], notifications:[{id:'n1',title:'Expense',message:'Saved',timestamp:1,read:false,type:'expense'}]});

test('legacy records, receipts, budget and notifications load without overwriting originals', () => {
  const storage = new MemoryStorage();
  const original = ledger();
  storage.values.set(LEGACY_KEYS[0],JSON.stringify(original.transactions));
  storage.values.set(LEGACY_KEYS[1],'50000');
  storage.values.set(LEGACY_KEYS[2],JSON.stringify(original.notifications));
  const loaded = readLedger(storage);
  assert.equal(storage.writes,0);
  assert.deepEqual(loaded.ledger.transactions,original.transactions);
  assert.equal(loaded.ledger.monthlyBudgetPKR,50000);
  const raw = writeLedger(storage,loaded.ledger,loaded.raw);
  assert.equal(storage.writes,1);
  assert.equal(readLedger(storage).raw,raw);
  assert.deepEqual(readLedger(storage).ledger,loaded.ledger);
  assert.equal(storage.getItem(LEGACY_KEYS[0]),JSON.stringify(original.transactions));
});

test('storage quota failure leaves the entire last saved ledger untouched', () => {
  const storage = new MemoryStorage();
  const original = ledger();
  const raw = writeLedger(storage,original,null);
  storage.failWrites = true;
  const changed = {...original, monthlyBudgetPKR:90000,transactions:[tx('new'),...original.transactions],notifications:[]};
  assert.throws(() => writeLedger(storage,changed,raw), /Storage full/);
  assert.equal(storage.getItem(LEDGER_KEY),raw);
  assert.deepEqual(readLedger(storage).ledger,original);
});

test('a newer snapshot from another tab cannot be overwritten by a stale save', () => {
  const storage = new MemoryStorage();
  const initial = writeLedger(storage,ledger(),null);
  const newer = writeLedger(storage,{...ledger(),monthlyBudgetPKR:30000},initial);
  assert.throws(() => writeLedger(storage,ledger(),initial), /another tab/);
  assert.equal(storage.getItem(LEDGER_KEY),newer);
});

test('backup round trip preserves all months, receipt images, notifications and undo', () => {
  const original = deleteTransactions({...ledger(), transactions:[tx('a'),{...tx('b'),date:'2026-09-30'}]},['a']);
  const backup = parseBackup(exportBackup(original));
  assert.deepEqual(backup.ledger,original);
  assert.equal(undoDelete(backup.ledger).transactions.length,2);
});

test('restore merges missing expenses and keeps existing edits without duplicates', () => {
  const current = {...ledger(), transactions:[tx('a',999)], monthlyBudgetPKR:50000};
  const backup = parseBackup(exportBackup(ledger()));
  const restored = mergeBackup(current,backup);
  assert.equal(restored.transactions.length,2);
  assert.equal(restored.transactions.find(item => item.id === 'a')?.amount,999);
  assert.equal(restored.transactions.find(item => item.id === 'b')?.receiptImage,tx('b').receiptImage);
  assert.equal(restored.monthlyBudgetPKR,120000);
  assert.equal(restored.notifications.length,1);
  assert.deepEqual(mergeBackup(restored,backup),restored);
});

test('invalid backups and corrupted saved records fail without modifying storage', () => {
  const valid = JSON.parse(exportBackup(ledger()));
  const corruptions = [
    {...valid,version:99}, {...valid,app:'Other'},
    {...valid,ledger:{...valid.ledger,monthlyBudgetPKR:-1}},
    {...valid,ledger:{...valid.ledger,transactions:[tx('a'),tx('a')]}},
    {...valid,ledger:{...valid.ledger,transactions:[{...tx('a'),amount:'1450'}]}},
    {...valid,ledger:{...valid.ledger,transactions:[{...tx('a'),receiptImage:'javascript:alert(1)'}]}},
    {...valid,ledger:{...valid.ledger,transactions:[{...tx('a'),date:'2026-02-30'}]}},
  ];
  for (const invalid of corruptions) assert.throws(() => parseBackup(JSON.stringify(invalid)));
  assert.throws(() => parseBackup('{broken'));
  const storage = new MemoryStorage();
  storage.values.set(LEDGER_KEY,'{broken');
  assert.throws(() => readLedger(storage));
  assert.equal(storage.getItem(LEDGER_KEY),'{broken');
  assert.equal(storage.writes,0);
});

test('delete and undo survive reload, preserve intervening edits and consume undo once', () => {
  const storage = new MemoryStorage();
  const original = ledger();
  const deleted = deleteTransactions(original,['a']);
  writeLedger(storage,deleted,null);
  const reloaded = readLedger(storage).ledger;
  assert.equal(reloaded.transactions.length,1);
  assert.equal(reloaded.undo[0].transaction.id,'a');
  const edited = {...reloaded,transactions:[{...reloaded.transactions[0],amount:500},tx('new')]};
  const restored = undoDelete(edited);
  assert.deepEqual(restored.transactions.map(item => item.id),['a','b','new']);
  assert.equal(restored.transactions[1].amount,500);
  assert.equal(restored.undo.length,0);
  assert.deepEqual(undoDelete(restored),restored);
});

test('clear all can be undone, and undo never duplicates an expense restored from a backup', () => {
  const original = ledger();
  assert.deepEqual(undoDelete(deleteTransactions(original,['a','b'])),original);
  const deleted = deleteTransactions(original,['a']);
  const restoredFromBackup = mergeBackup(deleted,parseBackup(exportBackup(original)));
  assert.equal(undoDelete(restoredFromBackup).transactions.length,2);
});


test('restoring into a fresh browser also restores pending undo recovery', () => {
  const original = ledger();
  const backup = parseBackup(exportBackup(deleteTransactions(original,['a'])));
  const restored = mergeBackup(emptyLedger(),backup);
  assert.deepEqual(undoDelete(restored),original);
});

test('legacy attached GIF receipts and empty attachments remain readable', () => {
  for (const receiptImage of ['data:image/gif;base64,aGVsbG8=', '']) {
    const original = {...ledger(),transactions:[{...tx('a'),receiptImage}]};
    assert.deepEqual(parseBackup(exportBackup(original)).ledger,original);
  }
});
