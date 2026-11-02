import {test} from 'node:test';
import assert from 'node:assert/strict';
import {emptyLedger,exportBackup,parseBackup,mergeBackup,validateLedger,readLedger,writeLedger} from '../src/lib/ledger';
import {completeSetup,DEFAULT_MASCOT,saveMascot,setupAnswers,type SetupAnswers} from '../src/lib/personalization';

const answers=()=>({...setupAnswers(emptyLedger()),profile:{name:'  Umar  ',theme:'dark' as const,reduceMotion:true},mascot:{...DEFAULT_MASCOT,kind:'cat' as const,name:'  Mochi ',accessory:'bow' as const,color:'peach' as const},budget:'28,500',limits:{'Food & Dining':'5000',Transportation:'3000'},goalName:'Phone',goalTarget:'60000'});
test('setup applies name, companion, budget, allocations and an unfunded goal atomically',()=>{
 const original=emptyLedger(),next=completeSetup(original,answers(),'goal-1');
 assert.equal(next.onboardingCompleted,true);assert.equal(next.profile!.name,'Umar');assert.equal(next.profile!.theme,'dark');assert.equal(next.mascot!.name,'Mochi');assert.equal(next.mascot!.kind,'cat');assert.equal(next.monthlyBudgetPKR,28500);assert.deepEqual(next.categoryBudgets,{'Food & Dining':5000,Transportation:3000});assert.deepEqual(next.goals,[{id:'goal-1',name:'Phone',target:60000,contributions:[]}]);assert.deepEqual(original,emptyLedger());assert.deepEqual(next.transactions,[]);
});
test('setup rejects blank names, invalid amounts, excess allocations and incomplete goals',()=>{
 for(const bad of [{profile:{...answers().profile,name:' '}},{budget:'0'},{budget:'-5'},{budget:'banana'},{limits:{Utilities:'30000'}},{limits:{Utilities:'oops'}},{limits:{Invalid:'10'}},{goalName:''},{goalTarget:''},{mascot:{...DEFAULT_MASCOT,name:' '}}])assert.throws(()=>completeSetup(emptyLedger(),{...answers(),...bad} as SetupAnswers,'g'));
});
test('optional limits and goals can be skipped; revisiting keeps expenses, bills and funded goals',()=>{
 const original={...emptyLedger(),monthlyBudgetPKR:30000,transactions:[{id:'expense',amount:50,currency:'PKR' as const,category:'Other',date:'2026-11-02',notes:'',createdAt:1,source:'manual' as const}],recurring:[{id:'rent',merchant:'Rent',amount:1000,category:'Utilities',nextDueDate:'2026-11-03',dayOfMonth:3,active:true}],goals:[{id:'old',name:'Existing',target:1000,contributions:[{id:'c',amount:50,date:'2026-11-02'}]}]};
 const next=completeSetup(original,{...answers(),limits:{},goalName:'',goalTarget:''},'unused');
 assert.deepEqual(next.transactions,original.transactions);assert.deepEqual(next.recurring,original.recurring);assert.deepEqual(next.goals,original.goals);assert.deepEqual(next.categoryBudgets,{});
 assert.throws(()=>completeSetup(next,answers(),'old'),/unique/);
});
test('all mascot choices persist through save and backup, and hidden companions stay hidden',()=>{
 for(const kind of ['sprout','cat','cloud'] as const)for(const color of ['peach','sage','lavender','sky'] as const)for(const accessory of ['none','bow','star'] as const){const next=saveMascot(emptyLedger(),{...DEFAULT_MASCOT,kind,color,accessory,visible:false});assert.deepEqual(parseBackup(exportBackup(next)).ledger,next);assert.equal(next.mascot!.visible,false);}
 for(const invalid of [{kind:'dog'},{color:'constructor'},{accessory:'hat'},{name:''},{visible:'yes'}])assert.throws(()=>validateLedger({...emptyLedger(),mascot:{...DEFAULT_MASCOT,...invalid}}));
 assert.throws(()=>validateLedger({...emptyLedger(),onboardingCompleted:'true'}));
});
test('backup merge supports older ledgers and preserves current companion and setup preferences',()=>{
 const next=completeSetup(emptyLedger(),answers(),'g');const restored=mergeBackup(emptyLedger(),parseBackup(exportBackup(next)));assert.equal(restored.onboardingCompleted,true);assert.deepEqual(restored.mascot,next.mascot);
 const changed=saveMascot(next,{...DEFAULT_MASCOT,name:'Leaf'});assert.deepEqual(mergeBackup(changed,parseBackup(exportBackup(next))).mascot,changed.mascot);
 assert.deepEqual(mergeBackup(emptyLedger(),parseBackup(exportBackup(emptyLedger()))),emptyLedger());
});
test('failed setup storage leaves last saved records intact and supports retry',()=>{
 const original=emptyLedger();const raw=JSON.stringify({version:1,ledger:original});const storage={getItem:()=>raw,setItem:()=>{throw Error('quota');}};const next=completeSetup(original,answers(),'g');assert.throws(()=>writeLedger(storage,next,raw));assert.deepEqual(readLedger(storage).ledger,original);assert.equal(readLedger(storage).ledger.onboardingCompleted,undefined);
});

test('fresh setup asks for a budget while existing custom budgets are retained',()=>{assert.equal(setupAnswers(emptyLedger()).budget,'');assert.equal(setupAnswers({...emptyLedger(),monthlyBudgetPKR:28500}).budget,'28500');});

