// Realistic sample receipts for 1-click testing in PKR
export interface SampleReceipt {
  id: string;
  name: string;
  merchant: string;
  category: string;
  expectedAmount: number;
  expectedCurrency: 'PKR';
  previewDescription: string;
  generateImageData: () => string;
}

function createReceiptCanvas(
  merchant: string,
  address: string,
  dateStr: string,
  items: Array<{ name: string; price: string }>,
  subtotal: string,
  tax: string,
  total: string,
  currencySymbol: string,
  footerNote: string
): string {
  const canvas = document.createElement('canvas');
  canvas.width = 440;
  canvas.height = 540 + items.length * 28;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Background - textured receipt paper
  ctx.fillStyle = '#fafaf9';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Border & clean receipt style
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

  // Header
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 20px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(merchant.toUpperCase(), canvas.width / 2, 45);

  ctx.font = '12px monospace';
  ctx.fillStyle = '#64748b';
  ctx.fillText(address, canvas.width / 2, 68);
  ctx.fillText(`DATE: ${dateStr}   TIME: 19:40`, canvas.width / 2, 86);
  ctx.fillText(`RECEIPT #: REC-${Math.floor(100000 + Math.random() * 900000)}`, canvas.width / 2, 104);

  // Divider
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(24, 120);
  ctx.lineTo(canvas.width - 24, 120);
  ctx.strokeStyle = '#cbd5e1';
  ctx.stroke();
  ctx.setLineDash([]);

  // Items
  let y = 145;
  ctx.font = '13px monospace';
  items.forEach((item) => {
    ctx.fillStyle = '#1e293b';
    ctx.textAlign = 'left';
    ctx.fillText(item.name, 28, y);

    ctx.textAlign = 'right';
    ctx.fillText(`${currencySymbol} ${item.price}`, canvas.width - 28, y);
    y += 26;
  });

  // Divider
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(24, y + 5);
  ctx.lineTo(canvas.width - 24, y + 5);
  ctx.strokeStyle = '#cbd5e1';
  ctx.stroke();
  ctx.setLineDash([]);
  y += 28;

  // Subtotal & Tax
  ctx.font = '13px monospace';
  ctx.fillStyle = '#64748b';
  ctx.textAlign = 'left';
  ctx.fillText('SUBTOTAL', 28, y);
  ctx.textAlign = 'right';
  ctx.fillText(`${currencySymbol} ${subtotal}`, canvas.width - 28, y);
  y += 24;

  ctx.textAlign = 'left';
  ctx.fillText('GST / TAX (5%)', 28, y);
  ctx.textAlign = 'right';
  ctx.fillText(`${currencySymbol} ${tax}`, canvas.width - 28, y);
  y += 28;

  // TOTAL
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 18px monospace';
  ctx.textAlign = 'left';
  ctx.fillText('TOTAL AMOUNT', 28, y);
  ctx.textAlign = 'right';
  ctx.fillText(`${currencySymbol} ${total}`, canvas.width - 28, y);
  y += 35;

  // Payment method
  ctx.font = '12px monospace';
  ctx.fillStyle = '#475569';
  ctx.textAlign = 'left';
  ctx.fillText('PAID VIA: DEBIT CARD / CASH', 28, y);
  ctx.textAlign = 'right';
  ctx.fillText('STATUS: PAID', canvas.width - 28, y);
  y += 30;

  // Barcode
  const barcodeY = y + 10;
  for (let bx = 60; bx < canvas.width - 60; bx += 4) {
    if (Math.random() > 0.3) {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(bx, barcodeY, Math.random() > 0.5 ? 2.5 : 1.2, 38);
    }
  }

  // Footer Note
  ctx.font = 'italic 11px monospace';
  ctx.fillStyle = '#94a3b8';
  ctx.textAlign = 'center';
  ctx.fillText(footerNote, canvas.width / 2, barcodeY + 60);

  return canvas.toDataURL('image/png');
}

export const SAMPLE_RECEIPTS: SampleReceipt[] = [
  {
    id: 'savour',
    name: 'Dinner Receipt',
    merchant: 'Savour Foods',
    category: 'Food & Dining',
    expectedAmount: 2450.0,
    expectedCurrency: 'PKR',
    previewDescription: 'Chicken Pulao, Shami Kabab, Cold Drinks',
    generateImageData: () =>
      createReceiptCanvas(
        'Savour Foods',
        'Blue Area, Islamabad, Pakistan',
        '2026-10-28',
        [
          { name: '2x Special Chicken Pulao', price: '1,500' },
          { name: '4x Shami Kababs', price: '600' },
          { name: '2x Mint Raita & Fresh Salad', price: '200' },
          { name: '2x Gourmet Soft Drink', price: '150' },
        ],
        '2,330',
        '120',
        '2,450',
        'Rs.',
        'Thank you for dining with Savour Foods!'
      ),
  },
  {
    id: 'alfatah',
    name: 'Grocery Receipt',
    merchant: 'Al-Fatah Store',
    category: 'Groceries',
    expectedAmount: 8650.0,
    expectedCurrency: 'PKR',
    previewDescription: 'Cooking Oil, Rice, Tea, Dairy & Flour',
    generateImageData: () =>
      createReceiptCanvas(
        'Al-Fatah Supermarket',
        'F-6 Super Market, Islamabad',
        '2026-10-27',
        [
          { name: 'Dalda Cooking Oil 5L', price: '2,950' },
          { name: 'Guard Basmati Rice 5kg', price: '2,200' },
          { name: 'Tapal Danedar Tea 900g', price: '1,450' },
          { name: 'Olpers Milk Pack 12x1L', price: '1,750' },
        ],
        '8,350',
        '300',
        '8,650',
        'Rs.',
        'Shop fresh at Al-Fatah Supermarket!'
      ),
  },
  {
    id: 'saeed_books',
    name: 'Books & Stationery',
    merchant: 'Saeed Book Bank',
    category: 'Shopping',
    expectedAmount: 3850.0,
    expectedCurrency: 'PKR',
    previewDescription: 'Hardcover Book, Grid Notebook & Gel Pens',
    generateImageData: () =>
      createReceiptCanvas(
        'Saeed Book Bank',
        'F-7 Markaz, Jinnah Super, Islamabad',
        '2026-10-25',
        [
          { name: '1x Hardcover Economics Book', price: '2,400' },
          { name: '1x Executive Notebook', price: '950' },
          { name: '1x Pack of Gel Pens', price: '500' },
        ],
        '3,850',
        '0',
        '3,850',
        'Rs.',
        'Knowledge is Power. Saeed Book Bank'
      ),
  },
];
