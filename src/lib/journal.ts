import type { StoredTransaction } from '../types';
import { localDate, totalPKR } from './finance';

export function journalEntries(transactions:StoredTransaction[],filters:{query?:string;category?:string;from?:string;to?:string}={}) {
  const query=(filters.query??'').trim().toLocaleLowerCase();
  return transactions.filter(tx=>(!query||[tx.merchant,tx.notes,tx.category].some(value=>value?.toLocaleLowerCase().includes(query)))&&
    (!filters.category||filters.category==='all'||tx.category===filters.category)&&(!filters.from||tx.date>=filters.from)&&(!filters.to||tx.date<=filters.to))
    .sort((a,b)=>b.date.localeCompare(a.date)||(b.time??'').localeCompare(a.time??'')||b.createdAt-a.createdAt);
}

export function groupJournal(transactions:StoredTransaction[]) {
  const groups=new Map<string,StoredTransaction[]>();
  for(const tx of journalEntries(transactions)){const group=groups.get(tx.date)??[];group.push(tx);groups.set(tx.date,group);}
  return [...groups].map(([date,entries])=>({date,entries,total:totalPKR(entries)}));
}

export function journalDay(date:string,today=localDate()):string {
  if(date===today)return 'Today';
  const previous=new Date(today+'T12:00:00');previous.setDate(previous.getDate()-1);
  if(date===localDate(previous))return 'Yesterday';
  return new Date(date+'T12:00:00').toLocaleDateString('en-GB',{day:'numeric',month:'long'});
}
