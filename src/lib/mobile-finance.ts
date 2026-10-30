import type { RecurringExpense, SavingsGoal } from '../types';
import { localDate, parsePKR, totalPKR, validDate } from './finance';
import type { Ledger } from './ledger';

export function goalSaved(goal: SavingsGoal): number {
  return totalPKR(goal.contributions.map(entry => ({amount: entry.amount})));
}

export function contributeToGoal(ledger: Ledger, goalId: string, amount: number, id: string, date = localDate()): Ledger {
  const goal = ledger.goals?.find(item => item.id === goalId);
  if (!goal || parsePKR(String(amount)) === null || !validDate(date)) throw new Error('Choose a goal and a valid savings amount.');
  if (goal.contributions.some(entry => entry.id === id)) throw new Error('This contribution is already recorded.');
  if (Math.round((goalSaved(goal) + amount) * 100) > Math.round(goal.target * 100)) throw new Error('This exceeds your goal. Enter the remaining amount or less.');
  return {...ledger, goals:ledger.goals!.map(item => item.id === goalId ? {...item,contributions:[...item.contributions,{id,amount,date}]} : item)};
}

// The schedule stores the next unpaid occurrence. Reserve every outstanding monthly
// occurrence through the selected month; paused schedules are excluded.
export function pendingBills(rules: RecurringExpense[], month: string, today = localDate()): {amount:number; count:number} {
  if (month < today.slice(0,7)) return {amount:0,count:0};
  const [year, monthNumber] = month.split('-').map(Number);
  let count = 0;
  const amounts: {amount:number}[] = [];
  for (const rule of rules) {
    if (!rule.active || rule.nextDueDate.slice(0,7) > month) continue;
    const [dueYear,dueMonth] = rule.nextDueDate.split('-').map(Number);
    const occurrences = (year-dueYear)*12 + monthNumber-dueMonth + 1;
    count += occurrences;
    amounts.push({amount:Math.round(rule.amount*100)*occurrences/100});
  }
  return {amount:totalPKR(amounts),count};
}

export const QUICK_EXPENSES = [
  {name:'Chai', amount:150, category:'Food & Dining' as const, icon:'coffee'},
  {name:'Lunch', amount:450, category:'Food & Dining' as const, icon:'utensils'},
  {name:'Ride', amount:300, category:'Transportation' as const, icon:'car'},
];
