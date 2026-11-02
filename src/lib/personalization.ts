import type {Ledger} from './ledger';
import {validateLedger} from './ledger';
import {DEFAULT_PROFILE,saveProfile} from './settings';
import {parsePKR,totalPKR} from './finance';
import type {ProfileSettings} from '../types';

export const MASCOT_COLORS={peach:'#f0a087',sage:'#9fbe9d',lavender:'#b9add9',sky:'#99bfd1'};
export type MascotSettings={kind:'cat'|'sprout'|'cloud';color:keyof typeof MASCOT_COLORS;accessory:'none'|'bow'|'star';name:string;visible:boolean};
export const DEFAULT_MASCOT:MascotSettings={kind:'sprout',color:'sage',accessory:'none',name:'Pip',visible:true};
export function validMascot(value:any):value is MascotSettings{
 return !!value&&['cat','sprout','cloud'].includes(value.kind)&&Object.hasOwn(MASCOT_COLORS,value.color)&&['none','bow','star'].includes(value.accessory)&&typeof value.name==='string'&&value.name.trim().length>0&&value.name.length<=24&&typeof value.visible==='boolean';
}
export function saveMascot(ledger:Ledger,value:MascotSettings):Ledger{
 const mascot={...value,name:value.name.trim().replace(/\s+/g,' ')};
 if(!validMascot(mascot))throw new Error('Choose a companion and give it a name of 1–24 characters.');
 return {...ledger,mascot};
}
export interface SetupAnswers{profile:ProfileSettings;mascot:MascotSettings;budget:string;limits:Record<string,string>;goalName:string;goalTarget:string;}
export function setupAnswers(ledger:Ledger):SetupAnswers{
 return {profile:ledger.profile??DEFAULT_PROFILE,mascot:ledger.mascot??DEFAULT_MASCOT,budget:ledger.onboardingCompleted||ledger.transactions.length||ledger.profile||ledger.monthlyBudgetPKR!==120000?String(ledger.monthlyBudgetPKR):'',limits:Object.fromEntries(Object.entries(ledger.categoryBudgets??{}).map(([name,amount])=>[name,String(amount)])),goalName:'',goalTarget:''};
}
export function completeSetup(ledger:Ledger,answers:SetupAnswers,goalId:string):Ledger{
 if(!answers.profile.name.trim())throw new Error('Tell us your name to continue.');
 const budget=parsePKR(answers.budget);if(budget===null)throw new Error('Enter a monthly spending budget greater than zero.');
 const categoryBudgets:Record<string,number>={};
 for(const [name,input] of Object.entries(answers.limits)){if(!input.trim())continue;const amount=parsePKR(input);if(amount===null)throw new Error('Use a positive amount for '+name+', or leave it blank.');categoryBudgets[name]=amount;}
 if(totalPKR(Object.values(categoryBudgets).map(amount=>({amount})))>budget)throw new Error('Category limits must fit inside your monthly budget.');
 let next=saveMascot(saveProfile(ledger,answers.profile),answers.mascot);
 const goalName=answers.goalName.trim();const hasGoal=!!goalName||!!answers.goalTarget.trim();
 if(hasGoal){const target=parsePKR(answers.goalTarget);if(!goalName||goalName.length>60||target===null)throw new Error('Give your goal a name and a target greater than zero, or leave both blank.');if(!goalId||(ledger.goals??[]).some(goal=>goal.id===goalId))throw new Error('Could not create a unique goal. Please retry.');next={...next,goals:[...(ledger.goals??[]),{id:goalId,name:goalName,target,contributions:[]}]};}
 next={...next,monthlyBudgetPKR:budget,categoryBudgets,onboardingCompleted:true};validateLedger(next);return next;
}

