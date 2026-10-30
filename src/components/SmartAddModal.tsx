import { localDate, parsePKR, validDate } from '../lib/finance';
import { motion, useReducedMotion } from 'motion/react';
import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Camera,
  Check,
  Upload,
  ArrowRight,
  AlertCircle,
  Clock,
  Sparkles,
  FileEdit,
  Mic,
} from 'lucide-react';
import {
  CATEGORIES,
  CATEGORY_META,
  ExpenseCategory,
  formatPKR,
  getCurrentTimeFormatted,
  ParsedExpenseResponse,
  StoredTransaction,
  TransactionData,
} from '../types';
import { SAMPLE_RECEIPTS, SampleReceipt } from '../data/sampleReceipts';

interface SmartAddModalProps {
  initialDraft?: TransactionData | null;
  initialMode?: 'manual' | 'text' | 'receipt';
  initialTransaction?: StoredTransaction | null;
  onSaveExpense: (
    txData: TransactionData,
    aiInsight?: string,
    receiptImage?: string
  ) => boolean;
  onClose: () => void;
}

export const SmartAddModal: React.FC<SmartAddModalProps> = ({
  initialMode = 'manual',
  initialDraft = null,
  initialTransaction = null,
  onSaveExpense,
  onClose,
}) => {
  const isEditing = Boolean(initialTransaction);
  const reducedMotion=useReducedMotion();
  const [saved,setSaved]=useState(false);
  const saving=useRef(false);
  const closeTimer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined);
  const dialogRef=useRef<HTMLDivElement>(null);
  useEffect(()=>{const previous=document.activeElement as HTMLElement|null;const overflow=document.body.style.overflow;document.body.style.overflow="hidden";return()=>{clearTimeout(closeTimer.current);document.body.style.overflow=overflow;previous?.focus();};},[]);

  // Tab order: 1. Manual Form, 2. Smart Note, 3. Scan Receipt
  const [activeTab, setActiveTab] = useState<'manual' | 'text' | 'receipt'>(
    isEditing ? 'manual' : initialMode
  );

  // Form fields
  const [amount, setAmount] = useState<string>('');
  const [merchant, setMerchant] = useState<string>('');
  const [category, setCategory] = useState<ExpenseCategory>('Food & Dining');
  const [date, setDate] = useState<string>(localDate());
  const [time, setTime] = useState<string>(getCurrentTimeFormatted());
  const [notes, setNotes] = useState<string>('');

  // Smart note state
  const [smartPrompt, setSmartPrompt] = useState<string>('');
  const [receiptImage, setReceiptImage] = useState<{
    name: string;
    mimeType: string;
    data: string;
    preview: string;
  } | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [aiTip, setAiTip] = useState<string | null>(null);
  const [extractedNotice, setExtractedNotice] = useState<string | null>(null);

  const [canSpeak,setCanSpeak]=useState(false);
  const [listening,setListening]=useState(false);
  const speechRef=useRef<any>(null);
  useEffect(()=>{setCanSpeak(Boolean((window as any).SpeechRecognition||(window as any).webkitSpeechRecognition));return()=>{speechRef.current?.abort();};},[]);
  const startVoice=()=>{
    if(listening){speechRef.current?.stop();return;}
    const Recognition=(window as any).SpeechRecognition||(window as any).webkitSpeechRecognition;
    if(!Recognition)return;
    const recognition=new Recognition();speechRef.current=recognition;recognition.lang='en-PK';recognition.interimResults=false;
    recognition.onstart=()=>setListening(true);recognition.onend=()=>setListening(false);
    recognition.onresult=(event:any)=>setSmartPrompt(event.results[0][0].transcript);
    recognition.onerror=()=>{setListening(false);setErrorMessage('Could not capture voice. Check microphone permission or type your note.');};
    try{recognition.start();}catch{setErrorMessage('Voice is unavailable. Please type your note.');}
  };
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Populate fields when initialTransaction is provided (Edit Mode)
  useEffect(() => {
    if (initialTransaction) {
      setAmount(initialTransaction.amount.toString());
      setMerchant(initialTransaction.merchant || '');
      setCategory(initialTransaction.category);
      setDate(initialTransaction.date);
      setTime(initialTransaction.time || getCurrentTimeFormatted());
      setNotes(initialTransaction.notes || '');
      setAiTip(initialTransaction.aiInsight || null);
      if (initialTransaction.receiptImage) {
        setReceiptImage({
          name: 'Attached Receipt',
          mimeType: 'image/png',
          data: '',
          preview: initialTransaction.receiptImage,
        });
      }
      setActiveTab('manual');
    } else {
      setAmount(initialDraft ? String(initialDraft.amount) : '');
      setMerchant(initialDraft?.merchant ?? '');
      setCategory(initialDraft?.category ?? 'Food & Dining');
      setDate(initialDraft?.date ?? localDate());
      setTime(getCurrentTimeFormatted());
      setNotes(initialDraft?.notes ?? '');
      setAiTip(null);
      setReceiptImage(null);
      setActiveTab(initialMode || 'manual');
    }
  }, [initialTransaction, initialMode, initialDraft]);

  // Quick Pakistani Expense Suggestions for Smart Note
  const quickSuggestions = [
    'Lunch at KFC Rs. 1,450',
    'Aaj petrol pe 1500 kharch hue',
    'Groceries from Imtiaz 5500',
    'Dinner at Savour Foods 2200',
    'Careem ride to office 480',
    'Chai & paratha 350',
  ];

  const handleFileUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select an image file (PNG, JPG, WebP).');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const [header, base64Data] = dataUrl.split(',');
      const mimeMatch = header.match(/data:(.*?);base64/);
      const mimeType = mimeMatch ? mimeMatch[1] : file.type;

      setReceiptImage({
        name: file.name,
        mimeType,
        data: base64Data,
        preview: dataUrl,
      });
      setErrorMessage(null);
    };
    reader.readAsDataURL(file);
  };

  const loadSampleReceipt = (receipt: SampleReceipt) => {
    const dataUrl = receipt.generateImageData();
    const [header, base64Data] = dataUrl.split(',');
    const mimeMatch = header.match(/data:(.*?);base64/);
    setReceiptImage({
      name: `${receipt.name}.png`,
      mimeType: mimeMatch ? mimeMatch[1] : 'image/png',
      data: base64Data,
      preview: dataUrl,
    });
    setSmartPrompt(`Receipt from ${receipt.merchant} Rs. ${receipt.expectedAmount}`);
    setErrorMessage(null);
  };

  // Smart Note & Receipt extractor
  const handleAutoExtract = async () => {
    if (!smartPrompt.trim() && !receiptImage) {
      setErrorMessage('Please write what you spent or upload a receipt.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const payload: any = {
        currentDate: date || localDate(),
        currentTime: time || getCurrentTimeFormatted(),
      };
      if (smartPrompt.trim()) payload.text = smartPrompt.trim();
      if (receiptImage && receiptImage.data) {
        payload.image = {
          mimeType: receiptImage.mimeType,
          data: receiptImage.data,
        };
      }

      const res = await fetch('/api/parse-expense', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data: ParsedExpenseResponse = await res.json();
      setIsLoading(false);

      if (data.status === 'success' && data.transaction) {
        setAmount(data.transaction.amount > 0 ? data.transaction.amount.toString() : '');
        setMerchant(data.transaction.merchant || '');
        setCategory(data.transaction.category || 'Food & Dining');
        setDate(data.transaction.date || localDate());
        setTime(data.transaction.time || getCurrentTimeFormatted());
        setNotes(data.transaction.notes || '');
        setAiTip(data.ai_insight || null);

        // Automatically transition to Manual Form so the user sees the filled fields!
        setExtractedNotice(
          activeTab === 'receipt'
            ? 'Receipt details extracted! Please review and save.'
            : 'Smart note details extracted! Please review and save.'
        );
        setActiveTab('manual');
      } else {
        setErrorMessage(data.message || 'Could not auto-fill. Please type the amount in Manual Form.');
      }
    } catch (e) {
      setIsLoading(false);
      setErrorMessage('Could not process automatically. Please enter details in the Manual Form.');
    }
  };

  const handleFinalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if(saving.current)return;
    const parsedAmount = parsePKR(amount);
    if (parsedAmount === null) {
      setErrorMessage('Please enter a valid expense amount in PKR.');
      return;
    }

    if (!validDate(date)) {
      setErrorMessage('Please enter a valid expense date.');
      return;
    }

    // Merchant store name is OPTIONAL: fallback to Category Name
    const finalMerchant = merchant.trim() || `${category} Expense`;

    saving.current=true;
    const didSave = onSaveExpense(
      {
        amount: parsedAmount,
        currency: 'PKR',
        merchant: finalMerchant,
        category,
        date,
        time: time || getCurrentTimeFormatted(),
        notes: notes.trim(),
      },
      aiTip || undefined,
      receiptImage?.preview
    );
    if (!didSave) {
      saving.current=false;
      setErrorMessage('Could not save. Your form is still here. Allow site storage or free storage space, then retry. If another tab changed the ledger, copy your form details before reloading.');
      return;
    }
    setSaved(true);
    closeTimer.current=setTimeout(onClose,reducedMotion?200:650);
  };

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:reducedMotion?0:.18}} className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/45 backdrop-blur-[2px] sm:p-4">
      <motion.div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="expense-dialog-title" tabIndex={-1} initial={reducedMotion?false:{y:'100%'}} animate={{y:0}} exit={reducedMotion?{opacity:0}:{y:'100%'}} transition={{duration:reducedMotion?0:.26,ease:[.22,.8,.25,1]}} className="bg-[#fffdf9] rounded-t-[28px] sm:rounded-[28px] max-w-lg w-full overflow-hidden shadow-2xl flex flex-col max-h-[92dvh] pb-[env(safe-area-inset-bottom)]" onKeyDown={event=>{
        if(event.key==='Escape'&&!saving.current){onClose();return;}
        if(event.key==='Tab'){const elements=dialogRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled])');const visible=Array.from(elements??[]).filter(element=>element.getClientRects().length>0);const first=visible[0],last=visible[visible.length-1];if(event.shiftKey&&(document.activeElement===first||document.activeElement===dialogRef.current)){last?.focus();event.preventDefault();}else if(!event.shiftKey&&document.activeElement===last){first?.focus();event.preventDefault();}}
      }}>
        <div className="w-9 h-1 rounded-full bg-slate-200 mx-auto mt-3 sm:hidden"/>
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 id="expense-dialog-title" className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              {isEditing ? 'Edit Expense' : 'Add New Expense'}
            </h2>
            <p className="text-xs text-slate-400">
              {isEditing
                ? 'Update your transaction details in PKR'
                : 'Enter your expense details in Pakistani Rupee (PKR)'}
            </p>
          </div>
          <button
            type="button"
            aria-label="Close expense form"
            disabled={saved}
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selector (Manual Form is FIRST, then Smart Note, then Scan Receipt) */}
        {!isEditing && (
          <div className="px-6 pt-3">
            <div className="bg-slate-100 p-1 rounded-2xl flex items-center text-xs font-semibold">
              {/* Tab 1: Manual Form (Default) */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab('manual');
                  setErrorMessage(null);
                }}
                className={`flex-1 py-2 rounded-xl transition-all cursor-pointer ${
                  activeTab === 'manual'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Manual
              </button>

              {/* Tab 2: Smart Note */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab('text');
                  setErrorMessage(null);
                }}
                className={`flex-1 py-2 rounded-xl transition-all cursor-pointer ${
                  activeTab === 'text'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Type
              </button>

              {/* Tab 3: Scan Receipt */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab('receipt');
                  setErrorMessage(null);
                }}
                className={`flex-1 py-2 rounded-xl transition-all cursor-pointer ${
                  activeTab === 'receipt'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Scan
              </button>
            </div>
          </div>
        )}

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {errorMessage && (
            <div role="alert" className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {extractedNotice && activeTab === 'manual' && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-semibold">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>{extractedNotice}</span>
              </div>
              <button
                type="button"
                onClick={() => setExtractedNotice(null)}
                className="text-emerald-700 hover:text-emerald-900"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* TAB 1: MANUAL FORM (FIRST TAB & DEFAULT) */}
          {activeTab === 'manual' && (
            <form onSubmit={handleFinalSubmit} className="space-y-3.5">
              {/* Amount in PKR */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Amount in Pakistani Rupee (PKR) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                    Rs.
                  </span>
                  <input
                    type="number"
                    aria-label="Expense amount in PKR"
                    step="0.01"
                    min="0.01"
                    required
                    autoFocus={!isEditing}
                    placeholder="0"
                    value={amount}
                    onChange={(e) => {
                      setAmount(e.target.value);
                      setErrorMessage(null);
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-2.5 text-base font-extrabold text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* Merchant Store Name (OPTIONAL) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 block">
                    Merchant / Store Name
                  </label>
                  <span className="text-[11px] text-slate-400">Optional</span>
                </div>
                <input
                  type="text"
                  aria-label="Merchant or store name"
                  placeholder="e.g. Savour Foods, Imtiaz, Careem (or leave empty)"
                  value={merchant}
                  onChange={(e) => setMerchant(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-orange-500 focus:bg-white"
                />
              </div>

              {/* Category */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Category</label>
                <select aria-label="Expense category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-orange-500 focus:bg-white cursor-pointer"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date & Time Row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Date</label>
                  <input
                    type="date" aria-label="Expense date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-orange-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Time</label>
                  <div className="relative">
                    <input
                      type="time" aria-label="Expense time"
                      required
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-orange-500 focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Notes (Optional)
                </label>
                <input
                  type="text"
                  aria-label="Expense notes"
                  placeholder="e.g. Lunch with team or monthly groceries"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-orange-500 focus:bg-white"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit" disabled={saved}
                  className="w-full py-3 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-md shadow-orange-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <motion.span key={saved?"saved":"idle"} initial={false} animate={{scale:saved?[.7,1.15,1]:1}} transition={{duration:reducedMotion?0:.25}}><Check className="w-4 h-4 stroke-[2.5]" /></motion.span>
                  <span>{saved ? 'Saved!' : isEditing ? 'Update Expense' : 'Save Expense'}</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: SMART NOTE */}
          {activeTab === 'text' && !isEditing && (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Describe what you spent · English or Roman Urdu
                </label>
                <div className="relative">
                  <textarea aria-label="Expense description in English or Roman Urdu" autoFocus
                    rows={3}
                    value={smartPrompt}
                    onChange={(e) => setSmartPrompt(e.target.value)}
                    placeholder="e.g. 'Dinner at Savour Foods 1450', 'Petrol 3000', or 'Groceries from Imtiaz 5500'"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-orange-500 focus:bg-white transition-all resize-none"
                  />
                </div>
              </div>

              {canSpeak&&<div className="flex items-center gap-3"><button type="button" onClick={startVoice} aria-pressed={listening} className="rounded-xl bg-orange-50 text-orange-800 px-3 py-2 text-sm font-semibold flex items-center gap-2"><Mic className="w-4 h-4"/>{listening?'Stop listening':'Use voice'}</button><p className="text-[11px] text-slate-500 flex-1">Uses your browser’s speech service. Review the transcript before saving.</p></div>}
              {/* Quick suggestions pills */}
              <div>
                <span className="text-[11px] font-semibold text-slate-400 block mb-1.5">
                  Tap to test quick note:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {quickSuggestions.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSmartPrompt(item)}
                      className="text-[11px] px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors cursor-pointer"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={handleAutoExtract}
                disabled={isLoading || !smartPrompt.trim()}
                className="w-full py-3 rounded-2xl bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white font-bold text-xs shadow-md shadow-orange-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Processing in PKR...</span>
                  </>
                ) : (
                  <>
                    <span>Auto-Fill Details</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          )}

          {/* TAB 3: SCAN RECEIPT */}
          {activeTab === 'receipt' && !isEditing && (
            <div className="space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileUpload(e.target.files[0]);
                  }
                }}
              />

              {receiptImage ? (
                <div className="p-3 border border-slate-200 rounded-2xl bg-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={receiptImage.preview}
                      alt="Receipt"
                      className="w-14 h-16 object-cover rounded-xl border border-slate-200 shadow-xs"
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-800">{receiptImage.name}</div>
                      <p className="text-[11px] text-emerald-600 font-medium">Receipt attached</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setReceiptImage(null)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-200 hover:border-orange-500 bg-slate-50 hover:bg-orange-50/20 rounded-2xl p-6 text-center cursor-pointer transition-all space-y-2"
                >
                  <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center mx-auto">
                    <Camera className="w-5 h-5" />
                  </div>
                  <div className="text-xs font-bold text-slate-700">Tap to upload receipt image</div>
                  <p className="text-[11px] text-slate-400">Photo of bill, receipt or invoice</p>
                </div>
              )}

              {/* Sample Receipts */}
              <div>
                <span className="text-[11px] font-semibold text-slate-400 block mb-1.5">
                  Or test with 1-click PKR receipts:
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {SAMPLE_RECEIPTS.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => loadSampleReceipt(r)}
                      className="p-2 rounded-xl border border-slate-200 hover:border-orange-500 bg-white hover:bg-slate-50 text-left transition-all cursor-pointer"
                    >
                      <div className="text-[11px] font-bold text-slate-800 truncate">{r.merchant}</div>
                      <div className="text-[10px] text-orange-600 font-semibold">{formatPKR(r.expectedAmount)}</div>
                    </button>
                  ))}
                </div>
              </div>

              {receiptImage && (
                <button
                  type="button"
                  onClick={handleAutoExtract}
                  disabled={isLoading}
                  className="w-full py-3 rounded-2xl bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white font-bold text-xs shadow-md shadow-orange-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Reading Receipt in PKR...</span>
                    </>
                  ) : (
                    <>
                      <span>Scan & Extract Details</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};
