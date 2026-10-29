export type ExpenseCategory =
  | 'Food & Dining'
  | 'Groceries'
  | 'Transportation'
  | 'Entertainment'
  | 'Utilities'
  | 'Shopping'
  | 'Healthcare'
  | 'Travel'
  | 'Other';

export interface TransactionData {
  amount: number;
  currency: 'PKR';
  merchant?: string;
  category: ExpenseCategory;
  date: string;
  time?: string;
  notes: string;
}

export interface ParsedExpenseResponse {
  status: 'success' | 'error';
  transaction?: TransactionData;
  ai_insight?: string;
  message?: string;
}

export interface StoredTransaction extends TransactionData {
  id: string;
  createdAt: number;
  time?: string;
  aiInsight?: string;
  receiptImage?: string;
  source: 'ai_text' | 'ai_receipt' | 'manual';
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  type: 'budget' | 'expense' | 'tip' | 'system';
}

export const CATEGORIES: ExpenseCategory[] = [
  'Food & Dining',
  'Groceries',
  'Transportation',
  'Entertainment',
  'Utilities',
  'Shopping',
  'Healthcare',
  'Travel',
  'Other',
];

export const CATEGORY_META: Record<
  ExpenseCategory,
  { icon: string; bg: string; text: string; lightBg: string; border: string; colorHex: string }
> = {
  'Food & Dining': {
    icon: 'Utensils',
    bg: 'bg-amber-500',
    text: 'text-amber-600',
    lightBg: 'bg-amber-50',
    border: 'border-amber-200',
    colorHex: '#f59e0b',
  },
  'Groceries': {
    icon: 'ShoppingCart',
    bg: 'bg-emerald-500',
    text: 'text-emerald-600',
    lightBg: 'bg-emerald-50',
    border: 'border-emerald-200',
    colorHex: '#10b981',
  },
  'Transportation': {
    icon: 'Car',
    bg: 'bg-blue-500',
    text: 'text-blue-600',
    lightBg: 'bg-blue-50',
    border: 'border-blue-200',
    colorHex: '#3b82f6',
  },
  'Entertainment': {
    icon: 'Film',
    bg: 'bg-purple-500',
    text: 'text-purple-600',
    lightBg: 'bg-purple-50',
    border: 'border-purple-200',
    colorHex: '#a855f7',
  },
  'Utilities': {
    icon: 'Zap',
    bg: 'bg-cyan-500',
    text: 'text-cyan-600',
    lightBg: 'bg-cyan-50',
    border: 'border-cyan-200',
    colorHex: '#06b6d4',
  },
  'Shopping': {
    icon: 'ShoppingBag',
    bg: 'bg-orange-500',
    text: 'text-orange-600',
    lightBg: 'bg-orange-50',
    border: 'border-orange-200',
    colorHex: '#f97316',
  },
  'Healthcare': {
    icon: 'HeartPulse',
    bg: 'bg-rose-500',
    text: 'text-rose-600',
    lightBg: 'bg-rose-50',
    border: 'border-rose-200',
    colorHex: '#f43f5e',
  },
  'Travel': {
    icon: 'Plane',
    bg: 'bg-indigo-500',
    text: 'text-indigo-600',
    lightBg: 'bg-indigo-50',
    border: 'border-indigo-200',
    colorHex: '#6366f1',
  },
  'Other': {
    icon: 'CreditCard',
    bg: 'bg-slate-500',
    text: 'text-slate-600',
    lightBg: 'bg-slate-100',
    border: 'border-slate-200',
    colorHex: '#64748b',
  },
};

export function formatPKR(amount: number): string {
  return `Rs. ${Number(amount || 0).toLocaleString('en-PK', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

export function getCurrentTimeFormatted(): string {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function formatDisplayTime(timeStr?: string): string {
  if (!timeStr) return '';
  const parts = timeStr.split(':');
  if (parts.length >= 2) {
    let hours = parseInt(parts[0], 10);
    const minutes = parts[1];
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${hours}:${minutes} ${ampm}`;
  }
  return timeStr;
}
