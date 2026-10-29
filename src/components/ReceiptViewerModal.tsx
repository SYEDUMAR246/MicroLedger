import React from 'react';
import { X } from 'lucide-react';
import { CATEGORY_META, StoredTransaction, formatPKR } from '../types';

interface ReceiptViewerModalProps {
  transaction: StoredTransaction;
  onClose: () => void;
}

export const ReceiptViewerModal: React.FC<ReceiptViewerModalProps> = ({ transaction, onClose }) => {
  const meta = CATEGORY_META[transaction.category] || CATEGORY_META['Other'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh] border border-slate-100">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Receipt Document</h3>
            <p className="text-xs text-slate-400">{transaction.merchant} — {transaction.date}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4">
          {transaction.receiptImage ? (
            <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50 flex items-center justify-center p-2">
              <img
                src={transaction.receiptImage}
                alt={`Receipt for ${transaction.merchant}`}
                className="max-h-96 w-auto object-contain rounded-xl shadow-xs"
              />
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-400">
              No receipt image attached to this transaction.
            </div>
          )}

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 font-medium">Amount Paid:</span>
              <span className="font-extrabold text-slate-900 text-sm">
                {formatPKR(transaction.amount)}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 font-medium">Category:</span>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${meta.lightBg} ${meta.text} ${meta.border}`}>
                {transaction.category}
              </span>
            </div>
            {transaction.notes && (
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-medium">Notes / Items:</span>
                <span className="text-slate-700 text-right max-w-[220px] truncate">{transaction.notes}</span>
              </div>
            )}
            {transaction.aiInsight && (
              <div className="pt-2 border-t border-slate-200 text-[11px] text-purple-700">
                💡 <span className="font-bold">Note:</span> {transaction.aiInsight}
              </div>
            )}
          </div>
        </div>

        <div className="px-5 py-3 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
