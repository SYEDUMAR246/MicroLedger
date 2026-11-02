import assert from 'node:assert/strict';
import {test} from 'node:test';
import {emptyLedger,exportBackup,parseBackup,mergeBackup,validateLedger,writeLedger,readLedger} from '../src/lib/ledger';
import {addCategory,removeCategory,saveProfile} from '../src/lib/settings';
import {removeExpenses,removeBill,removeGoal,restoreDeletion,discardDeletion,undoRemaining} from '../src/lib/deletion';
import type {Ledger} from '../src/lib/ledger';

const tx={id:'test',amount:150,currency:'PKR' as const,merchant:'Test',category:'Other',date:'2026-10-30',notes:'',source:'manual' as const,createdAt:1};
const seed=():Ledger=>({...emptyLedger(),transactions:[tx],recurring:[{id:'bill',merchant:'Internet',amount:2500,category:'Utilities',nextDueDate:'2026-10-31',dayOfMonth:31,active:true}],goals:[{id:'goal',name:'Phone',target:60000,contributions:[{id:'c',amount:500,date:'2026-10-30'}]}]});

test('expense undo expires at exactly five seconds and dismissal consumes recovery',()=>{
 const original=seed(), deleted=removeExpenses(original,['test'],1000);
 assert.equal(deleted.transactions.length,0);assert.equal(original.transactions.length,1);
 assert.equal(undoRemaining(deleted.deletion,1000),5);assert.equal(undoRemaining(deleted.deletion,5999),1);
 assert.deepEqual(restoreDeletion(deleted,5999).transactions,original.transactions);
 assert.throws(()=>restoreDeletion(deleted,6000),/ended/);
 assert.equal(undoRemaining(deleted.deletion,6000),0);
 assert.throws(()=>restoreDeletion(discardDeletion(deleted),2000));
});
test('bill deletion keeps payment history and goal undo restores all contributions',()=>{
 const original=seed(), bill=removeBill(original,'bill',1000);
 assert.deepEqual(bill.transactions,original.transactions);assert.deepEqual(bill.recurring,[]);
 assert.deepEqual(restoreDeletion(bill,2000).recurring,original.recurring);
 const goal=removeGoal(original,'goal',1000);assert.deepEqual(goal.goals,[]);
 assert.deepEqual(restoreDeletion(goal,2000).goals,original.goals);
 validateLedger(bill);validateLedger(goal);
});
test('a new deletion replaces the previous undo without restoring unrelated records',()=>{
 const next=removeGoal(removeExpenses(seed(),['test'],1000),'goal',2000);
 assert.deepEqual(next.undo,[]);const restored=restoreDeletion(next,3000);
 assert.equal(restored.transactions.length,0);assert.equal(restored.goals!.length,1);
 assert.throws(()=>restoreDeletion(restored,3001));
});
test('profile and custom categories survive backups and canonicalize merged category names',()=>{
 const profile=saveProfile(addCategory(emptyLedger(),' Education '),{name:'  Umar   Syed ',theme:'dark',reduceMotion:true});
 assert.equal(profile.profile!.name,'Umar Syed');
 const source={...addCategory(emptyLedger(),'education'),transactions:[{...tx,category:'education'}]};
 const merged=mergeBackup(profile,parseBackup(exportBackup(source)));
 assert.deepEqual(merged.customCategories,['Education']);assert.equal(merged.transactions[0].category,'Education');
 assert.equal(merged.profile!.theme,'dark');validateLedger(merged);
 assert.deepEqual(parseBackup(exportBackup(merged)).ledger,merged);
});
test('categories reject duplicates and unsafe names and protect referenced records',()=>{
 let ledger=addCategory(seed(),'Education');
 assert.throws(()=>addCategory(ledger,'education'),/already/);assert.throws(()=>addCategory(ledger,'Food & Dining'),/already/);
 for(const name of ['constructor','__proto__','a'.repeat(31),''])assert.throws(()=>addCategory(ledger,name));
 assert.deepEqual(removeCategory(ledger,'Education').customCategories,[]);
 ledger={...ledger,transactions:[{...tx,category:'Education'}]};
 assert.throws(()=>removeCategory(ledger,'Education'),/in use/);
 assert.throws(()=>removeCategory(removeExpenses(ledger,['test'],1000),'Education'),/in use/);
 validateLedger(ledger);
});
test('pending recovery survives reload but its expired deadline cannot be extended',()=>{
 const deleted=removeBill(seed(),'bill',1000);
 const roundTrip=parseBackup(exportBackup(deleted)).ledger;
 assert.deepEqual(roundTrip,deleted);
 assert.throws(()=>restoreDeletion(roundTrip,6000));
 const raw=JSON.stringify({version:1,ledger:seed()});
 const storage={getItem:()=>raw,setItem:()=>{throw new Error('Storage full');}};
 assert.throws(()=>writeLedger(storage,deleted,raw));assert.deepEqual(readLedger(storage).ledger,seed());
});


