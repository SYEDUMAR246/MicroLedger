import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';

import { extractPKR, localDate, validDate, validParsedTransaction } from './src/lib/finance';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '30mb' }));
app.use(express.urlencoded({ extended: true, limit: '30mb' }));

// Initialize GoogleGenAI server-side with telemetry header
const apiKey = process.env.GEMINI_API_KEY || '';
let ai: GoogleGenAI | null = null;
if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// 9 Standard Categories
const VALID_CATEGORIES = [
  'Food & Dining',
  'Groceries',
  'Transportation',
  'Entertainment',
  'Utilities',
  'Shopping',
  'Healthcare',
  'Travel',
  'Other',
] as const;

type ValidCategory = (typeof VALID_CATEGORIES)[number];

// Intelligent Financial Assistant Parser for PKR
function parseExpenseInput(
  text?: string,
  image?: { mimeType: string; data: string },
  currentDate?: string,
  currentTime?: string
) {
  const effectiveDate = validDate(currentDate) ? currentDate : localDate();
  const effectiveTime =
    currentTime ||
    new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

  // If text is provided, validate whether it's an expense or non-expense
  if (!text && !image) {
    return {
      status: 'error',
      message: 'Please provide a valid expense description or receipt image.',
    };
  }

  if (image) {
    return { status: 'error', message: "Couldn't read this receipt. Try scanning again or enter the details in Manual Form. No expense has been saved." };
  }
  const cleanText = (text || '').trim();

  // If only text is provided and it looks like a generic query / greeting without monetary intent
  if (!image && cleanText) {
    const isGreetingOrJoke =
      /^(hi|hello|hey|yo|tell me a joke|how are you|who are you|what can you do|good morning|test|weather|joke)/i.test(
        cleanText
      ) && !/\d/.test(cleanText);

    if (isGreetingOrJoke) {
      return {
        status: 'error',
        message: 'Please provide a valid expense description or receipt image.',
      };
    }
  }

  let amount = 0;
  const currency = 'PKR';
  let merchant = 'Expense';
  let category: ValidCategory = 'Other';
  let notes = cleanText;
  let txDate = effectiveDate;
  let txTime = effectiveTime;

  // Time extraction if provided in text (e.g. 14:30 or 2:30 pm)
  const timeMatch = cleanText.match(/\b([01]?\d|2[0-3]):([0-5]\d)(?:\s*(am|pm))?\b/i);
  if (timeMatch) {
    let hours = parseInt(timeMatch[1], 10);
    const mins = timeMatch[2];
    const ampm = timeMatch[3]?.toLowerCase();
    if (ampm === 'pm' && hours < 12) hours += 12;
    if (ampm === 'am' && hours === 12) hours = 0;
    txTime = `${String(hours).padStart(2, '0')}:${mins}`;
  }

  // Date detection if user specified "yesterday", "last week", or a date YYYY-MM-DD
  const datePattern = cleanText.match(/\b(202\d-[01]\d-[0-3]\d)\b/);
  if (datePattern) {
    txDate = datePattern[1];
  } else if (/yesterday/i.test(cleanText)) {
    const d = new Date(effectiveDate + 'T12:00:00');
    d.setDate(d.getDate() - 1);
    txDate = localDate(d);
  }

  const extractedAmount = extractPKR(cleanText);
  if (extractedAmount === null) {
    return { status: 'error', message: 'Enter one clear positive amount in PKR, such as Rs. 1,450. For multiple amounts, use Manual Form.' };
  }
  amount = extractedAmount;

  // Categorization & Merchant detection
  const lower = cleanText.toLowerCase();

  if (/dinner|lunch|breakfast|food|coffee|tea|chai|savour|biryani|burger|pizza|kfc|mcdonald|restaurant|bistro|cafe|roast|karahi|kabab|nihari|haleem|shawarma/i.test(lower)) {
    category = 'Food & Dining';
    if (/savour/i.test(lower)) merchant = 'Savour Foods';
    else if (/kfc/i.test(lower)) merchant = 'KFC';
    else if (/mcdonald/i.test(lower)) merchant = "McDonald's";
    else if (/cheezious/i.test(lower)) merchant = 'Cheezious';
    else if (/monal/i.test(lower)) merchant = 'Monal Restaurant';
    else if (/coffee|tea|chai/i.test(lower)) merchant = 'Cafe / Chai Spot';
    else merchant = 'Restaurant';
  } else if (/grocery|groceries|supermarket|imtiaz|al-fatah|alfatah|carrefour|metro|milk|eggs|bread|oil|flour|atta|rice|vegetable|fruit/i.test(lower)) {
    category = 'Groceries';
    if (/imtiaz/i.test(lower)) merchant = 'Imtiaz Super Market';
    else if (/al-fatah|alfatah/i.test(lower)) merchant = 'Al-Fatah Store';
    else if (/carrefour/i.test(lower)) merchant = 'Carrefour';
    else merchant = 'Grocery Store';
  } else if (/careem|indrive|uber|yangoo|bykea|rickshaw|taxi|cab|fuel|petrol|diesel|cng|toll|parking|metro|bus/i.test(lower)) {
    category = 'Transportation';
    if (/careem/i.test(lower)) merchant = 'Careem';
    else if (/indrive/i.test(lower)) merchant = 'InDrive';
    else if (/bykea/i.test(lower)) merchant = 'Bykea';
    else if (/petrol|fuel|cng/i.test(lower)) merchant = 'Fuel Station';
    else merchant = 'Transportation';
  } else if (/movie|cinema|cinepax|nueplex|netflix|spotify|game|match|cricket|ticket/i.test(lower)) {
    category = 'Entertainment';
    if (/cinepax/i.test(lower)) merchant = 'Cinepax';
    else if (/nueplex/i.test(lower)) merchant = 'Nueplex Cinemas';
    else if (/netflix/i.test(lower)) merchant = 'Netflix';
    else merchant = 'Entertainment';
  } else if (/electric|iesco|lesco|kelectric|k-electric|bill|power|gas|sui gas|water|internet|stormfiber|nayatel|ptcl|jazz|telenor|zong|ufone/i.test(lower)) {
    category = 'Utilities';
    if (/iesco/i.test(lower)) merchant = 'IESCO Electricity';
    else if (/kelectric|k-electric/i.test(lower)) merchant = 'K-Electric';
    else if (/lesco/i.test(lower)) merchant = 'LESCO';
    else if (/sui gas/i.test(lower)) merchant = 'Sui Gas';
    else if (/stormfiber|nayatel|ptcl/i.test(lower)) merchant = 'Internet Provider';
    else merchant = 'Utility Provider';
  } else if (/clothes|shoes|dress|kurta|khaadi|junaid jamshed|outfitters|sapphire|gulahmed|daraz|book|stationery|saeed book/i.test(lower)) {
    category = 'Shopping';
    if (/khaadi/i.test(lower)) merchant = 'Khaadi';
    else if (/outfitters/i.test(lower)) merchant = 'Outfitters';
    else if (/sapphire/i.test(lower)) merchant = 'Sapphire';
    else if (/daraz/i.test(lower)) merchant = 'Daraz';
    else if (/saeed book/i.test(lower)) merchant = 'Saeed Book Bank';
    else merchant = 'Shopping Store';
  } else if (/pharmacy|doctor|hospital|clinic|medicine|shifa|chughtai|d-watson|fazal din|lab/i.test(lower)) {
    category = 'Healthcare';
    if (/chughtai/i.test(lower)) merchant = 'Chughtai Lab & Pharmacy';
    else if (/d-watson|dwatson/i.test(lower)) merchant = 'D.Watson Chemist';
    else if (/fazal din/i.test(lower)) merchant = 'Fazal Din Pharma Plus';
    else merchant = 'Pharmacy / Clinic';
  } else if (/flight|airline|hotel|tour|serena|marriott|pearl continental|airblue|pia|flyjinnah/i.test(lower)) {
    category = 'Travel';
    if (/airblue/i.test(lower)) merchant = 'Airblue';
    else if (/pia/i.test(lower)) merchant = 'PIA';
    else if (/serena/i.test(lower)) merchant = 'Serena Hotel';
    else merchant = 'Travel Agency';
  }

  // Merchant extraction from "at <Store>", "from <Store>", "to <Store>"
  if (merchant === 'Expense') {
    const prepMatch = cleanText.match(/(?:at|from|to|for)\s+([A-Za-z0-9&'.\s]{2,25}?)(?:\s+(?:for|rs\.?|₨|\d+|yesterday|today)|$)/i);
    if (prepMatch && prepMatch[1].trim().length > 1) {
      merchant = prepMatch[1].trim();
    }
  }

  if (!validDate(txDate)) return { status: 'error', message: 'Please enter a valid expense date in Manual Form.' };

  // Generate helpful observation in PKR
  let ai_insight = `Recorded Rs. ${amount.toLocaleString('en-PK')} under ${category}.`;
  if (category === 'Food & Dining') {
    ai_insight = `Good food brings joy! Enjoying meals within your budget keeps finances healthy.`;
  } else if (category === 'Groceries') {
    ai_insight = `Essential home groceries recorded in your monthly budget.`;
  } else if (category === 'Transportation') {
    ai_insight = `Commute expense logged in your travel tracking.`;
  } else if (category === 'Utilities') {
    ai_insight = `Monthly utility bill paid and archived.`;
  } else if (category === 'Shopping') {
    ai_insight = `Shopping purchase logged under your discretionary allowance.`;
  }

  return {
    status: 'success',
    transaction: {
      amount: parseFloat(amount.toFixed(2)),
      currency: 'PKR',
      merchant: merchant === 'Expense' ? '' : merchant,
      category,
      date: txDate,
      time: txTime,
      notes: notes || `Expense under ${category}`,
    },
    ai_insight,
  };
}

// Endpoint POST /api/parse-expense
app.post('/api/parse-expense', async (req, res) => {
  try {
    const { text, image, currentDate, currentTime } = req.body;
    if ((text !== undefined && typeof text !== 'string') ||
        (image !== undefined && (!image || typeof image.data !== 'string' || !/^image\/(png|jpeg|webp)$/.test(image.mimeType)))) {
      return res.status(400).json({ status: 'error', message: 'Provide text or a PNG, JPEG, or WebP receipt.' });
    }
    const effectiveDate = validDate(currentDate) ? currentDate : localDate();
    const effectiveTime =
      currentTime ||
      new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

    if (!text && !image) {
      return res.status(200).json({
        status: 'error',
        message: 'Please provide a valid expense description or receipt image.',
      });
    }

    // Text amounts must be unambiguous even when AI is configured.
    const textAmount = text ? extractPKR(text) : null;
    if (!image && textAmount === null) {
      return res.json({ status: 'error', message: 'Enter one clear positive amount in PKR, such as Rs. 1,450. For multiple amounts, use Manual Form.' });
    }

    // Receipt failures must never fall back to invented transaction details.
    if (ai) {
      try {
        const systemInstruction = `You are a personal financial assistant. Parse the expense text or receipt image.
Only accept expenses explicitly in Pakistani Rupee (PKR), or with no stated currency. Reject foreign currency; do not relabel or convert it. Never invent an amount, merchant, date, or receipt details. If a receipt is unreadable or its total is ambiguous, return status error.
Extract:
- amount: Float number (in PKR)
- currency: "PKR"
- merchant: Vendor or store name (if unknown or empty, leave empty string "")
- category: One of [Food & Dining, Groceries, Transportation, Entertainment, Utilities, Shopping, Healthcare, Travel, Other]
- date: YYYY-MM-DD (defaults to ${effectiveDate})
- time: HH:mm (defaults to ${effectiveTime})
- notes: Brief context or itemized items

If valid, respond in JSON:
{
  "status": "success",
  "transaction": {
    "amount": 0.00,
    "currency": "PKR",
    "merchant": "string",
    "category": "string",
    "date": "YYYY-MM-DD",
    "time": "HH:mm",
    "notes": "string"
  },
  "ai_insight": "A brief, friendly 1-sentence tip in English."
}

If cannot parse or not an expense:
{
  "status": "error",
  "message": "Please provide a valid expense description or receipt image."
}`;

        const parts: any[] = [];
        if (image && image.data && image.mimeType) {
          parts.push({
            inlineData: {
              mimeType: image.mimeType,
              data: image.data,
            },
          });
        }
        if (text) {
          parts.push({ text: `Expense Input: ${text}` });
        } else {
          parts.push({ text: 'Please extract receipt items, total amount in PKR, merchant, and time.' });
        }

        const geminiPromise = ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: { parts },
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
            thinkingConfig: {
              thinkingLevel: ThinkingLevel.LOW,
            },
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                status: { type: Type.STRING },
                transaction: {
                  type: Type.OBJECT,
                  properties: {
                    amount: { type: Type.NUMBER },
                    currency: { type: Type.STRING },
                    merchant: { type: Type.STRING },
                    category: { type: Type.STRING },
                    date: { type: Type.STRING },
                    time: { type: Type.STRING },
                    notes: { type: Type.STRING },
                  },
                },
                ai_insight: { type: Type.STRING },
                message: { type: Type.STRING },
              },
              required: ['status'],
            },
          },
        });

        let timeout: ReturnType<typeof setTimeout> | undefined;
        const timeoutPromise = new Promise((_, reject) => {
          timeout = setTimeout(() => reject(new Error('timeout')), 15000);
        });
        let geminiResult: any;
        try {
          geminiResult = await Promise.race([geminiPromise, timeoutPromise]);
        } finally {
          clearTimeout(timeout);
        }
        let responseText = geminiResult.text?.trim() || '';
        if (responseText.startsWith('```')) {
          responseText = responseText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
        }

        const parsed = JSON.parse(responseText);
        if (parsed.status === 'success' && validParsedTransaction(parsed.transaction)) {
          if (!image) parsed.transaction.amount = textAmount;
          if (!VALID_CATEGORIES.includes(parsed.transaction.category)) {
            parsed.transaction.category = 'Other';
          }
          if (!parsed.transaction.time) {
            parsed.transaction.time = effectiveTime;
          }
          return res.json(parsed);
        } else if (parsed.status === 'error') {
          return res.json(parsed);
        }
      } catch (err: any) {
        // Fallback to local intelligent parser
      }
    }

    // High fidelity fallback parser (instant, strictly PKR, extracts time and amount)
    const result = parseExpenseInput(text, image, effectiveDate, effectiveTime);
    return res.json(result);
  } catch (error: any) {
    console.error('Server error in /api/parse-expense:', error);
    return res.json({
      status: 'error',
      message: 'Please provide a valid expense description or receipt image.',
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

startServer();
