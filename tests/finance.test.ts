import assert from 'node:assert/strict';
import { test } from 'node:test';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { localDate, validDate, parsePKR, extractPKR, transactionsInMonth, totalPKR, validParsedTransaction } from '../src/lib/finance';

test('PKR parsing preserves grouped amounts and paise', () => {
  for (const [input, expected] of [['1,450', 1450], ['1,450.75', 1450.75], ['1,20,000', 120000], ['3000', 3000], ['0.50', 0.5]] as const) {
    assert.equal(parsePKR(input), expected);
  }
  for (const input of ['1,45', '-500', '0', 'Infinity', '1.234', '500abc', 'NaN']) assert.equal(parsePKR(input), null);
});

test('Smart Note reads currency amounts without guessing ambiguous numbers', () => {
  for (const input of ['Lunch at KFC Rs. 1,450', 'Paid 1,450 PKR', '2 coffees for Rs. 1,450', 'Lunch 1450 on 2026-10-29 at 14:30']) {
    assert.equal(extractPKR(input), 1450, input);
  }
  for (const input of ['2 coffees 450', 'Rs 200 and Rs 300', 'Rs -500', 'Rs 1,45', '$500', 'USD 500', 'coffee', 'paid 1.234']) {
    assert.equal(extractPKR(input), null, input);
  }
});

test('month totals exclude other months, years and invalid dates', () => {
  const transactions = [
    { date: '2026-10-01', amount: 0.1 }, { date: '2026-10-31', amount: 0.2 },
    { date: '2026-09-30', amount: 900 }, { date: '2026-11-01', amount: 800 },
    { date: '2025-10-01', amount: 700 }, { date: '2026-10-32', amount: 600 },
  ];
  assert.equal(totalPKR(transactionsInMonth(transactions, '2026-10')), 0.3);
  assert.deepEqual(transactionsInMonth(transactions, '2026-12'), []);
  assert.equal(transactionsInMonth([{date:'2025-12-31'},{date:'2026-01-01'}], '2026-01').length, 1);
});

test('dates use local calendar days, including leap days', () => {
  assert.equal(localDate(new Date(2026, 9, 29, 0, 30)), '2026-10-29');
  assert.equal(validDate('2024-02-29'), true);
  assert.equal(validDate('2026-02-29'), false);
  assert.equal(validDate('2026-13-01'), false);
});

test('invalid AI transaction values cannot pass validation', () => {
  const valid = {amount:1450.75, currency:'PKR', date:'2026-10-29', time:'14:30', merchant:'Cafe', notes:''};
  assert.equal(validParsedTransaction(valid), true);
  for (const change of [{amount:-1},{amount:Infinity},{amount:'1450'},{amount:1.234},{currency:'USD'},{date:'2026-02-30'},{time:'25:00'},{merchant:42}]) {
    assert.equal(validParsedTransaction({...valid,...change}),false);
  }
});

test('API fails closed on receipts without AI and validates text amounts', {timeout:30000}, async () => {
  const reservation = createServer();
  await new Promise<void>(resolve => reservation.listen(0,'127.0.0.1',resolve));
  const port = (reservation.address() as {port:number}).port;
  await new Promise<void>(resolve => reservation.close(() => resolve()));
  const child = spawn(process.execPath,['--import','tsx','server.ts'], {
    cwd:process.cwd(), env:{...process.env, PORT:String(port), GEMINI_API_KEY:'', NODE_ENV:'development', DISABLE_HMR:'true'},
    stdio:'ignore', windowsHide:true,
  });
  const url = 'http://127.0.0.1:' + port;
  try {
    let ready = false;
    for (let attempt=0;attempt<80;attempt++) {
      try { await fetch(url); ready=true; break; } catch { await new Promise(resolve=>setTimeout(resolve,100)); }
    }
    assert.equal(ready,true,'Test server should start');
    const post = async (body:object) => (await fetch(url+'/api/parse-expense', {method:'POST', headers:{'Content-Type':'application/json'},body:JSON.stringify(body)})).json();
    for (const text of [undefined, 'Receipt from Savour Foods Rs. 2,450']) {
      const receipt = await post({image:{mimeType:'image/png',data:'aGVsbG8='},text});
      assert.equal(receipt.status,'error');
      assert.equal(receipt.transaction,undefined);
    }
    const lunch = await post({text:'Lunch at KFC Rs. 1,450',currentDate:'2026-10-29',currentTime:'14:30'});
    assert.equal(lunch.transaction.amount,1450);
    assert.equal(lunch.transaction.date,'2026-10-29');
    const yesterday = await post({text:'Petrol 3000 yesterday',currentDate:'2026-01-01'});
    assert.equal(yesterday.transaction.date,'2025-12-31');
    for (const text of ['2 coffees 450','Rs 200 and Rs 300','Rs -100','Lunch USD 20']) {
      assert.equal((await post({text})).status,'error',text);
    }
  } finally {
    child.kill();
  }
});
