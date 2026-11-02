import assert from 'node:assert/strict';
import {test} from 'node:test';
import {parseReceiptText} from '../src/lib/receipt-parser';
import {parseExpenseInput} from '../src/lib/expense-parser';
test('receipt reader selects the labelled total, never item prices, tax or cash tendered',()=>{
 const input='SAVOUR FOODS\nDATE: 2026-10-28 TIME: 19:40\nChicken Rs. 1500\nDrinks Rs. 750\nSUBTOTAL Rs. 2250\nGST / TAX Rs. 200\nTOTAL AMOUNT Rs. 2,450.00\nCASH Rs. 3000\nCHANGE Rs. 550';
 const result=parseReceiptText(input,'2026-11-02','12:00');assert.equal(result.status,'success');assert.equal(result.transaction!.amount,2450);assert.equal(result.transaction!.merchant,'SAVOUR FOODS');assert.equal(result.transaction!.date,'2026-10-28');assert.equal(result.transaction!.time,'19:40');assert.equal(result.transaction!.category,'Food & Dining');
});
test('receipt totals reject missing, conflicting, negative and foreign-currency amounts',()=>{
 for(const input of ['Shop\nApple 500\nTax 20','Shop\nSubtotal 300\nCash 500\nChange 200','Shop\nTOTAL Rs 100\nTOTAL Rs 200','Shop\nTOTAL Rs -400','Shop\nTOTAL USD 20','Shop\nTOTAL AED 20','Shop\nTOTAL Rs 1,45','Shop\nTOTAL Rs 0'])assert.equal(parseReceiptText(input).status,'error',input);
});
test('a grand total overrides a subtotal or intermediate total and repeated identical totals agree',()=>{
 assert.equal(parseReceiptText('KFC\nTotal 1000\nGRAND TOTAL Rs. 1200').transaction!.amount,1200);
 assert.equal(parseReceiptText('KFC\nTOTAL Rs. 1000\nTOTAL Rs. 1000').transaction!.amount,1000);
 assert.equal(parseReceiptText('KFC\nTOTAL AMOUNT\nRs 1000').transaction!.amount,1000);
});
test('Type parses locally with no receipt or AI dependency, retaining money and calendar boundaries',()=>{
 const input=parseExpenseInput('Aaj petrol pe 1500 kharch hue',undefined,'2026-11-02','12:30');assert.equal(input.status,'success');assert.equal(input.transaction!.amount,1500);assert.equal(input.transaction!.category,'Transportation');assert.equal(input.transaction!.date,'2026-11-02');assert.equal(input.transaction!.time,'12:30');
 assert.equal(parseExpenseInput('Lunch 450 yesterday',undefined,'2027-01-01').transaction!.date,'2026-12-31');
 for(const value of ['hello','2 coffees 450','Rs 200 and Rs 300','USD 20'])assert.equal(parseExpenseInput(value).status,'error');
});
