import { CATEGORIES, type AppNotification, type StoredTransaction, type ExpenseCategory, type RecurringExpense, type SavingsGoal } from '../types';
import { parsePKR, validDate, validParsedTransaction } from './finance';

export const LEDGER_KEY = 'microledger_snapshot_v1';
export const LEGACY_KEYS = ['smartspend_wallet_pkr_v3', 'smartspend_wallet_budget_v3', 'smartspend_notifications_v3'] as const;
export interface Ledger {
  goals?: SavingsGoal[];
  categoryBudgets?: Partial<Record<ExpenseCategory, number>>;
  recurring?: RecurringExpense[];
  transactions: StoredTransaction[];
  monthlyBudgetPKR: number;
  notifications: AppNotification[];
  undo: { transaction: StoredTransaction; index: number }[];
}
export interface Backup { app: 'MicroLedger'; version: 1; exportedAt: string; ledger: Ledger }
type StorageAccess = Pick<Storage, 'getItem' | 'setItem'>;

export function emptyLedger(): Ledger {
  return { transactions: [], monthlyBudgetPKR: 120000, notifications: [], undo: [] };
}

function transaction(value: any): value is StoredTransaction {
  return validParsedTransaction(value) && typeof value.id === 'string' && value.id.length > 0 &&
    Number.isFinite(value.createdAt) && typeof value.notes === 'string' && CATEGORIES.includes(value.category) &&
    ['manual', 'ai_text', 'ai_receipt'].includes(value.source) &&
    (value.aiInsight === undefined || typeof value.aiInsight === 'string') &&
    (value.receiptImage === undefined || (typeof value.receiptImage === 'string' && (value.receiptImage === '' || /^data:image\/[a-z0-9.+-]+;base64,[A-Za-z0-9+/=\s]+$/.test(value.receiptImage))));
}

function notification(value: any): value is AppNotification {
  return !!value && typeof value.id === 'string' && value.id.length > 0 && typeof value.title === 'string' &&
    typeof value.message === 'string' && Number.isFinite(value.timestamp) && typeof value.read === 'boolean' &&
    ['budget', 'expense', 'tip', 'system'].includes(value.type);
}

function uniqueIds(values: {id: string}[]): boolean {
  return new Set(values.map(value => value.id)).size === values.length;
}

export function validateLedger(value: any): asserts value is Ledger {
  if (value?.goals !== undefined && (!Array.isArray(value.goals) || !uniqueIds(value.goals) || !value.goals.every((goal:any) =>
    goal && typeof goal.id === 'string' && goal.id.length > 0 && typeof goal.name === 'string' && goal.name.trim().length > 0 &&
    typeof goal.target === 'number' && parsePKR(String(goal.target)) !== null && Array.isArray(goal.contributions) && uniqueIds(goal.contributions) &&
    goal.contributions.every((entry:any) => entry && typeof entry.id === 'string' && entry.id.length > 0 && typeof entry.amount === 'number' && parsePKR(String(entry.amount)) !== null && validDate(entry.date)) &&
    goal.contributions.reduce((sum:number, entry:any) => sum + Math.round(entry.amount * 100), 0) <= Math.round(goal.target * 100)))) {
    throw new Error('This ledger contains invalid savings goals or contributions.');
  }
  if (value?.categoryBudgets !== undefined && (!value.categoryBudgets || Array.isArray(value.categoryBudgets) || typeof value.categoryBudgets !== 'object' ||
    !Object.entries(value.categoryBudgets).every(([category, amount]) => CATEGORIES.includes(category as ExpenseCategory) && typeof amount === 'number' && parsePKR(String(amount)) !== null) ||
    Object.values(value.categoryBudgets).reduce((sum: number, amount: any) => sum + Math.round(amount * 100), 0) > Math.round(value.monthlyBudgetPKR * 100))) {
    throw new Error('Category budgets must be positive and fit within your monthly budget.');
  }
  if (value?.recurring !== undefined && (!Array.isArray(value.recurring) || !value.recurring.every((rule: any) =>
    rule && typeof rule.id === 'string' && rule.id.length > 0 && typeof rule.merchant === 'string' && rule.merchant.trim().length > 0 &&
    CATEGORIES.includes(rule.category) && typeof rule.amount === 'number' && parsePKR(String(rule.amount)) !== null && validDate(rule.nextDueDate) &&
    Number.isInteger(rule.dayOfMonth) && rule.dayOfMonth >= 1 && rule.dayOfMonth <= 31 && typeof rule.active === 'boolean') || !uniqueIds(value.recurring))) {
    throw new Error('This ledger contains invalid or duplicate recurring schedules.');
  }
  if (!value || !Array.isArray(value.transactions) || !value.transactions.every(transaction) || !uniqueIds(value.transactions) ||
    typeof value.monthlyBudgetPKR !== 'number' || parsePKR(String(value.monthlyBudgetPKR)) === null ||
    !Array.isArray(value.notifications) || !value.notifications.every(notification) || !uniqueIds(value.notifications) ||
    !Array.isArray(value.undo) || !value.undo.every((entry: any) => entry && transaction(entry.transaction) && Number.isInteger(entry.index) && entry.index >= 0) ||
    !uniqueIds(value.undo.map((entry: any) => entry.transaction))) {
    throw new Error('This ledger contains invalid or duplicate records. Your current records have not been changed.');
  }
}

export function readLedger(storage: StorageAccess): { ledger: Ledger; raw: string | null } {
  const raw = storage.getItem(LEDGER_KEY);
  if (raw !== null) {
    const saved = JSON.parse(raw);
    if (saved.version !== 1) throw new Error('Unsupported saved ledger version.');
    validateLedger(saved.ledger);
    return { ledger: saved.ledger, raw };
  }
  const [transactions, budget, notifications] = LEGACY_KEYS.map(key => storage.getItem(key));
  const ledger: Ledger = {
    transactions: transactions === null ? [] : JSON.parse(transactions),
    monthlyBudgetPKR: budget === null ? 120000 : Number(budget),
    notifications: notifications === null ? [] : JSON.parse(notifications), undo: [],
  };
  validateLedger(ledger);
  return { ledger, raw: null };
}

// A single setItem either writes the complete snapshot or leaves the previous value intact.
export function writeLedger(storage: StorageAccess, ledger: Ledger, expectedRaw: string | null): string {
  validateLedger(ledger);
  if (storage.getItem(LEDGER_KEY) !== expectedRaw) {
    throw new Error('Your ledger changed in another tab. Reload this page before saving.');
  }
  const raw = JSON.stringify({version: 1, ledger});
  storage.setItem(LEDGER_KEY, raw);
  return raw;
}

export function exportBackup(ledger: Ledger): string {
  validateLedger(ledger);
  return JSON.stringify({app: 'MicroLedger', version: 1, exportedAt: new Date().toISOString(), ledger} satisfies Backup, null, 2);
}

export function parseBackup(text: string): Backup {
  let backup: any;
  try { backup = JSON.parse(text); } catch { throw new Error('This file is not a valid JSON backup.'); }
  if (backup?.app !== 'MicroLedger' || backup.version !== 1 || typeof backup.exportedAt !== 'string' || !Number.isFinite(Date.parse(backup.exportedAt))) {
    throw new Error('Choose a supported MicroLedger backup (version 1).');
  }
  validateLedger(backup.ledger);
  return backup;
}

export function mergeBackup(current: Ledger, backup: Backup): Ledger {
  validateLedger(current);
  validateLedger(backup.ledger);
  const ids = new Set(current.transactions.map(tx => tx.id));
  const goalIds = new Set((current.goals ?? []).map(goal => goal.id));
  const recurringIds = new Set((current.recurring ?? []).map(rule => rule.id));
  const notificationIds = new Set(current.notifications.map(item => item.id));
  return {
    transactions: [...current.transactions, ...backup.ledger.transactions.filter(tx => !ids.has(tx.id))],
    monthlyBudgetPKR: backup.ledger.monthlyBudgetPKR,
    ...((backup.ledger.goals || current.goals) ? {goals:[...(current.goals ?? []),...(backup.ledger.goals ?? []).filter(goal => !goalIds.has(goal.id))]} : {}),
    ...((backup.ledger.categoryBudgets || current.categoryBudgets) ? {categoryBudgets: backup.ledger.categoryBudgets ?? {}} : {}),
    ...((backup.ledger.recurring || current.recurring) ? {recurring: [...(current.recurring ?? []), ...(backup.ledger.recurring ?? []).filter(rule => !recurringIds.has(rule.id))]} : {}),
    notifications: [...current.notifications, ...backup.ledger.notifications.filter(item => !notificationIds.has(item.id))],
    undo: current.undo.length > 0 ? current.undo : backup.ledger.undo.filter(entry =>
      !current.transactions.some(tx => tx.id === entry.transaction.id) &&
      !backup.ledger.transactions.some(tx => tx.id === entry.transaction.id)),
  };
}

export function deleteTransactions(ledger: Ledger, ids: string[]): Ledger {
  const removed = new Set(ids);
  return {...ledger, transactions: ledger.transactions.filter(tx => !removed.has(tx.id)),
    undo: ledger.transactions.flatMap((tx, index) => removed.has(tx.id) ? [{transaction: tx, index}] : [])};
}

export function undoDelete(ledger: Ledger): Ledger {
  const transactions = [...ledger.transactions];
  for (const entry of [...ledger.undo].sort((a,b) => a.index - b.index)) {
    if (!transactions.some(tx => tx.id === entry.transaction.id)) transactions.splice(Math.min(entry.index, transactions.length), 0, entry.transaction);
  }
  return {...ledger, transactions, undo: []};
}
