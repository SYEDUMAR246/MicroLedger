import { type ExpenseCategory, type RecurringExpense, type StoredTransaction } from '../types';
import { localDate, parsePKR, totalPKR, transactionsInMonth, validDate } from './finance';
import type { Ledger } from './ledger';

export function allocatedBudget(budgets: Partial<Record<ExpenseCategory, number>> = {}): number {
  return totalPKR(Object.values(budgets).map(amount => ({amount: amount!})));
}

export function monthSummary(transactions: StoredTransaction[], budget: number, month: string, today = localDate()) {
  const spent = totalPKR(transactionsInMonth(transactions, month));
  const first = new Date(month + '-01T12:00:00');
  const days = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  const currentMonth = today.slice(0, 7);
  const daysLeft = month < currentMonth ? 0 : month > currentMonth ? days : days - Number(today.slice(8)) + 1;
  const previous = new Date(first); previous.setMonth(first.getMonth() - 1);
  const previousSpent = totalPKR(transactionsInMonth(transactions, localDate(previous).slice(0, 7)));
  const remaining = Math.round((budget - spent) * 100) / 100;
  return {spent, remaining, daysLeft, dailyAllowance: daysLeft ? Math.floor(Math.max(0, remaining) * 100 / daysLeft) / 100 : null,
    previousSpent, difference: Math.round((spent - previousSpent) * 100) / 100};
}

export function nextMonthlyDate(dueDate: string, day: number): string {
  if (!validDate(dueDate) || !Number.isInteger(day) || day < 1 || day > 31) throw new Error('Invalid recurring schedule.');
  const date = new Date(dueDate + 'T12:00:00');
  const next = new Date(date.getFullYear(), date.getMonth() + 1, 1, 12);
  const lastDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
  next.setDate(Math.min(day, lastDay));
  return localDate(next);
}

export function logRecurringPayment(ledger: Ledger, ruleId: string, expectedDue: string, paidDate: string, amount: number, now = Date.now()): Ledger {
  const rule = ledger.recurring?.find(item => item.id === ruleId);
  if (!rule?.active || rule.nextDueDate !== expectedDue) throw new Error('This payment changed or was already logged. Review the updated schedule.');
  if (!validDate(paidDate) || parsePKR(String(amount)) === null) throw new Error('Enter a valid payment amount and date.');
  const id = 'recurring:' + rule.id + ':' + expectedDue;
  if ([...ledger.transactions, ...ledger.undo.map(entry => entry.transaction)].some(tx => tx.id === id)) {
    throw new Error('This payment was already recorded. Check your ledger or undo the deletion.');
  }
  const transaction: StoredTransaction = {id, amount, currency:'PKR', merchant:rule.merchant, category:rule.category,
    date:paidDate, time:new Date(now).toTimeString().slice(0,5), notes:'Recurring payment · due ' + expectedDue, source:'manual', createdAt:now};
  return {...ledger, transactions:[transaction,...ledger.transactions], recurring:ledger.recurring!.map(item => item.id === ruleId ? {...item,nextDueDate:nextMonthlyDate(item.nextDueDate,item.dayOfMonth)} : item)};
}

export function recurringTotal(rules: RecurringExpense[] = []): number {
  return totalPKR(rules.filter(rule => rule.active).map(rule => ({amount:rule.amount})));
}
