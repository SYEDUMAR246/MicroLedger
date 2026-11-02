import {parsePKR,validDate,localDate} from './finance';
import {parseExpenseInput} from './expense-parser';
import type {ParsedExpenseResponse} from '../types';

// Only an explicitly labelled final total is accepted. Item prices, tax and cash tendered are not totals.
export function parseReceiptText(text:string,currentDate=localDate(),currentTime='12:00'):ParsedExpenseResponse{
 const fail=(message:string):ParsedExpenseResponse=>({status:'error',message});
 if(/[$€£]|\b(?:USD|EUR|GBP|AED|INR|SAR)\b/i.test(text))return fail('This receipt uses a currency other than PKR. Enter a PKR expense manually.');
 const lines=text.split(/\r?\n/).map(line=>line.trim()).filter(Boolean);
 const candidates:{amount:number;rank:number}[]=[];
 for(let i=0;i<lines.length;i++){
  const line=lines[i];
  if(/\b(?:sub\s*total|subtotal|tax|discount|cash|tendered|change|saving)\b/i.test(line))continue;
  const label=line.match(/\b(grand\s+total|net\s+(?:total|payable)|total\s+(?:amount|due|payable)|amount\s+(?:due|payable)|total)\b\s*[:=.-]?\s*(.*)$/i);
  if(!label)continue;
  const tail=label[2]||lines[i+1]||'';
  const tokens=tail.replace(/\b(?:PKR|RS\.?)\b|₨/gi,' ').trim().match(/-?\d[\d,]*(?:\.\d+)?/g)??[];
  if(tokens.length!==1)continue;
  const amount=parsePKR(tokens[0]);if(amount===null)continue;
  candidates.push({amount,rank:/grand|payable|due/i.test(label[1])?2:1});
 }
 if(!candidates.length)return fail('Could not find a clear receipt total. Try a sharper photo showing the TOTAL line, or enter it manually.');
 const rank=Math.max(...candidates.map(item=>item.rank));const totals=[...new Set(candidates.filter(item=>item.rank===rank).map(item=>item.amount))];
 if(totals.length!==1)return fail('This receipt has conflicting totals. Review it and enter the amount manually.');
 const amount=totals[0];
 const merchant=lines.find(line=>/[a-z]{2}/i.test(line)&&!/(?:receipt|invoice|date|time|tax|total|tel|phone|www\.|https?:)/i.test(line))?.slice(0,100)??'';
 const explicitDate=text.match(/\b(\d{4}-\d{2}-\d{2})\b/)?.[1];
 const txDate=explicitDate?(validDate(explicitDate)?explicitDate:null):currentDate;
 if(!txDate)return fail('The receipt date is unclear. Enter the date manually.');
 const time=text.match(/\b([01]\d|2[0-3]):([0-5]\d)\b/);
 const classified=parseExpenseInput(`${merchant} Rs. ${amount}`,undefined,txDate,currentTime);
 return {status:'success',transaction:{amount,currency:'PKR',merchant,category:classified.transaction?.category??'Other',date:txDate,time:time?time[0]:currentTime,notes:'Receipt scan · review the total and date before saving.'},ai_insight:'Read from your receipt. Please check the details before saving.'};
}
