export function localDate(date = new Date()): string {
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
}

export function validDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value + 'T12:00:00');
  return !Number.isNaN(date.getTime()) && localDate(date) === value;
}

// Accept whole rupees or up to two decimal places, with standard or South Asian grouping.
export function parsePKR(value: string): number | null {
  const input = value.trim();
  if (!/^(?:\d+|\d{1,3}(?:,\d{3})+|\d{1,2}(?:,\d{2})*,\d{3})(?:\.\d{1,2})?$/.test(input)) return null;
  const amount = Number(input.replace(/,/g, ''));
  return Number.isFinite(amount) && amount > 0 && amount <= Number.MAX_SAFE_INTEGER / 100 ? amount : null;
}

export function extractPKR(text: string): number | null {
  if (/[$€£]|\b(?:USD|EUR|GBP)\b/i.test(text)) return null;
  const clean = text.replace(/\b\d{4}-\d{2}-\d{2}\b/g, ' ').replace(/\b\d{1,2}:\d{2}(?:\s*[ap]m)?\b/gi, ' ');
  const token = '(-?\\d[\\d,]*(?:\\.\\d+)?)';
  const currency = '(?:PKR|Rs\\.?|₨)';
  const explicit = [...clean.matchAll(new RegExp(currency + '\\s*' + token + '|' + token + '\\s*' + currency, 'gi'))];
  if (explicit.length > 0) return explicit.length === 1 ? parsePKR(explicit[0][1] || explicit[0][2]) : null;
  const numbers = [...clean.matchAll(/-?\d[\d,]*(?:\.\d+)?/g)];
  return numbers.length === 1 ? parsePKR(numbers[0][0]) : null;
}

export function transactionsInMonth<T extends { date: string }>(transactions: T[], month: string): T[] {
  return transactions.filter(tx => validDate(tx.date) && tx.date.slice(0, 7) === month);
}

export function totalPKR(transactions: { amount: number }[]): number {
  return transactions.reduce((total, tx) => total + Math.round(tx.amount * 100), 0) / 100;
}

export function validParsedTransaction(tx: any): boolean {
  return !!tx && typeof tx.amount === 'number' && parsePKR(String(tx.amount)) !== null &&
    tx.currency === 'PKR' && validDate(tx.date) &&
    (tx.time === undefined || (typeof tx.time === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(tx.time))) &&
    (tx.merchant === undefined || typeof tx.merchant === 'string') &&
    (tx.notes === undefined || typeof tx.notes === 'string');
}
