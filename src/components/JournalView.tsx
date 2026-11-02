import { categoriesFor } from '../lib/settings';
import React,{useState} from 'react';
import { Search,CalendarDays,Plus,Utensils,Car,ShoppingBag,X } from 'lucide-react';
import { CATEGORIES,formatPKR,type StoredTransaction } from '../types';
import { totalPKR } from '../lib/finance';
import { groupJournal,journalDay,journalEntries } from '../lib/journal';
import { ExpenseTimeline } from './ExpenseTimeline';

export function JournalView({transactions,month,onEdit,onDelete,onReceipt,onAdd,customCategories=[]}:{customCategories?:string[];transactions:StoredTransaction[];month:string;onEdit:(tx:StoredTransaction)=>void;onDelete:(id:string)=>void;onReceipt:(tx:StoredTransaction)=>void;onAdd:()=>void}){
  const categories=categoriesFor(customCategories);
  const [query,setQuery]=useState('');const [category,setCategory]=useState('all');const [filtersOpen,setFiltersOpen]=useState(false);const [from,setFrom]=useState('');const [to,setTo]=useState('');
  const invalid=!!from&&!!to&&from>to;
  const filtered=invalid?[]:journalEntries(transactions,{query,category,from,to});const groups=groupJournal(filtered);
  const chips=[{id:'all',label:'All',icon:null},{id:'Food & Dining',label:'Food',icon:Utensils},{id:'Transportation',label:'Transport',icon:Car},{id:'Shopping',label:'Shopping',icon:ShoppingBag}];
  return <section className="pp-journal"><h1 className="pp-title pp-journal-title">The money journal<span>.</span></h1>
    <div className="pp-search-row"><label className="pp-search"><Search size={18}/><input aria-label="Find an expense" value={query} onChange={event=>setQuery(event.target.value)} placeholder="Find an expense…"/>{query&&<button type="button" aria-label="Clear search" onClick={()=>setQuery('')}><X size={16}/></button>}</label><button type="button" className="pp-outline pp-filter-button" aria-expanded={filtersOpen} onClick={()=>setFiltersOpen(!filtersOpen)}><CalendarDays size={16}/>Filter dates</button></div>
    {filtersOpen&&<div className="pp-filter-panel"><div className="pp-filter-dates"><label>From<input aria-label="Expenses from date" type="date" value={from} onChange={event=>setFrom(event.target.value)}/></label><label>To<input aria-label="Expenses to date" type="date" value={to} onChange={event=>setTo(event.target.value)}/></label></div><label>All categories<select aria-label="Filter expense category" value={category} onChange={event=>setCategory(event.target.value)}><option value="all">All categories</option>{categories.map(value=><option key={value}>{value}</option>)}</select></label><button type="button" className="pp-text-button" onClick={()=>{setFrom('');setTo('');setCategory('all');setQuery('');}}>Clear filters</button></div>}
    {invalid&&<p role="alert" className="pp-error">Choose an end date on or after the start date.</p>}
    <p className="pp-month-total">{new Date(month+'-01T12:00:00').toLocaleDateString('en-GB',{month:'long'})} · {formatPKR(totalPKR(transactions))} spent</p>
    <div className="pp-chips" aria-label="Quick category filters">{chips.map(chip=><button type="button" key={chip.id} aria-pressed={category===chip.id} onClick={()=>setCategory(chip.id)} className={category===chip.id?'is-active':''}>{chip.icon&&<chip.icon size={17}/>}<span>{chip.label}</span></button>)}</div>
    {(query||category!=='all'||from||to)&&!invalid&&<p className="pp-filter-count">{filtered.length} matches · {formatPKR(totalPKR(filtered))}</p>}
    <div className="pp-journal-groups">{groups.map(group=><section key={group.date} className="pp-day-group"><div className="pp-day-heading"><h2>{journalDay(group.date)} · {formatPKR(group.total)}</h2><time dateTime={group.date}>{new Date(group.date+'T12:00:00').toLocaleDateString('en-GB',{day:'numeric',month:'long'})}</time></div><ExpenseTimeline entries={group.entries} onEdit={onEdit} onDelete={onDelete} onReceipt={onReceipt}/></section>)}{!groups.length&&<div className="pp-empty"><p>{transactions.length?'No expenses match these filters.':'Your money journal starts here.'}</p><button type="button" className="pp-text-button" onClick={onAdd}>Add an expense</button></div>}</div>
    <button type="button" className="pp-journal-add" onClick={onAdd} aria-label="Add expense to journal"><Plus size={26}/><span>Add</span></button>
  </section>;
}
