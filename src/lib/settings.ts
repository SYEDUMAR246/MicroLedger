import { CATEGORIES, type ExpenseCategory, type ProfileSettings } from '../types';
import type { Ledger } from './ledger';

export const DEFAULT_PROFILE:ProfileSettings={name:'',theme:'system',reduceMotion:false};
export function categoriesFor(custom:string[]=[]):ExpenseCategory[]{return [...CATEGORIES,...custom];}
export function validCategoryName(name:unknown):name is string {
  return typeof name==='string'&&name===name.trim()&&/^[\p{L}\p{N}][\p{L}\p{N} &'()/-]{0,29}$/u.test(name)&&!['constructor','prototype','__proto__','tostring','valueof','hasownproperty'].includes(name.toLowerCase());
}
export function addCategory(ledger:Ledger,input:string):Ledger {
  const name=input.trim().replace(/\s+/g,' ');
  if(!validCategoryName(name))throw new Error('Use 1–30 letters, numbers or simple punctuation for the category name.');
  if(categoriesFor(ledger.customCategories).some(category=>category.toLocaleLowerCase()===name.toLocaleLowerCase()))throw new Error('A category with this name already exists.');
  return {...ledger,customCategories:[...(ledger.customCategories??[]),name]};
}
export function categoryInUse(ledger:Ledger,name:string):boolean {
  return ledger.transactions.some(tx=>tx.category===name)||ledger.undo.some(item=>item.transaction.category===name)||(ledger.recurring??[]).some(rule=>rule.category===name)||ledger.categoryBudgets?.[name]!==undefined||
    (ledger.deletion?.kind==='bill'&&ledger.deletion.value.category===name);
}
export function removeCategory(ledger:Ledger,name:string):Ledger {
  if(categoryInUse(ledger,name))throw new Error('This category is in use. Reassign its expenses, bills and budget before removing it.');
  return {...ledger,customCategories:(ledger.customCategories??[]).filter(category=>category!==name)};
}
export function saveProfile(ledger:Ledger,profile:ProfileSettings):Ledger {
  const name=profile.name.trim().replace(/\s+/g,' ');
  if(name.length>50)throw new Error('Keep your name within 50 characters.');
  if(!['light','dark','system'].includes(profile.theme)||typeof profile.reduceMotion!=='boolean')throw new Error('Choose a valid appearance mode.');
  return {...ledger,profile:{name,theme:profile.theme,reduceMotion:profile.reduceMotion}};
}
