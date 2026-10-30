import React, { useRef, useState } from 'react';
import { formatPKR } from '../types';
import { localDate } from '../lib/finance';
import { exportBackup, mergeBackup, parseBackup, type Backup, type Ledger } from '../lib/ledger';

export function downloadJSON(text: string, filename: string) {
  const url = URL.createObjectURL(new Blob([text], {type: 'application/json'}));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function BackupPanel({ledger, onRestore, exportDisabled}: {ledger: Ledger; onRestore: (backup: Backup) => boolean; exportDisabled: boolean}) {
  const input = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<Backup | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reading, setReading] = useState(false);
  const added = preview ? mergeBackup(ledger, preview).transactions.length - ledger.transactions.length : 0;
  return <details className="bg-white rounded-2xl border border-slate-100 p-4">
    <summary className="cursor-pointer text-sm font-semibold text-slate-700">Backups & recovery</summary>
    <p className="text-xs text-slate-500 mt-3">Download a backup of all months, including receipts, budgets, savings goals, recurring schedules and notifications. Keep a copy outside this browser.</p>
    <div className="flex gap-2 mt-3">
      <button type="button" disabled={exportDisabled} className="rounded-xl bg-slate-900 text-white px-3 py-2 text-xs disabled:opacity-40" onClick={() => {
        try { downloadJSON(exportBackup(ledger), 'MicroLedger-backup-' + localDate() + '.json'); setError(null); }
        catch { setError('Could not create the backup. Please try again.'); }
      }}>Download backup</button>
      <button type="button" disabled={reading} className="rounded-xl border border-slate-200 px-3 py-2 text-xs disabled:opacity-40" onClick={() => input.current?.click()}>{reading ? 'Reading backup…' : 'Restore backup'}</button>
      <input ref={input} type="file" accept=".json,application/json" className="hidden" aria-label="Choose MicroLedger backup" onChange={async event => {
        const file = event.target.files?.[0];
        event.target.value = '';
        setPreview(null); setError(null);
        if (!file) return;
        setReading(true);
        try {
          if (file.size > 50 * 1024 * 1024) throw new Error('Choose a backup smaller than 50 MB.');
          setPreview(parseBackup(await file.text()));
        } catch (error) { setError(error instanceof Error ? error.message : 'Could not read this backup.'); }
        finally { setReading(false); }
      }} />
    </div>
    {error && <p role="alert" className="text-xs text-rose-700 mt-3">{error}</p>}
    {preview && <div className="mt-3 p-3 rounded-xl bg-slate-50 text-xs space-y-2">
      <p className="font-semibold">Ready to restore {preview.ledger.transactions.length} backed-up expenses</p>
      <p>Adds {added} missing expenses. Existing expenses and matching records stay as they are. Your monthly budget becomes {formatPKR(preview.ledger.monthlyBudgetPKR)}. Missing savings goals are added; matching goals keep their current contributions. Category limits are restored from the backup. Missing recurring schedules and notifications are added; existing schedules keep their current progress.</p>
      <p>Backup created {new Date(preview.exportedAt).toLocaleString()}.</p>
      <div className="flex gap-3">
        <button type="button" className="rounded-lg bg-orange-500 text-white px-3 py-2 disabled:opacity-40" onClick={() => {if (onRestore(preview)) setPreview(null);}}>Confirm merge & restore</button>
        <button type="button" onClick={() => setPreview(null)}>Cancel</button>
      </div>
    </div>}
  </details>;
}
