import React,{useState} from 'react';
import { motion,useReducedMotion } from 'motion/react';
import { Utensils,Car,ShoppingBag,ShoppingCart,Coffee,HeartPulse,Plane,Zap,Film,ReceiptText,MoreHorizontal,Pencil,Trash2,Image } from 'lucide-react';
import { formatPKR,formatDisplayTime,type StoredTransaction,type ExpenseCategory } from '../types';

export const CATEGORY_STYLE:Record<ExpenseCategory,{icon:typeof Utensils;color:string;background:string}>={
  'Food & Dining':{icon:Utensils,color:'#c9664e',background:'#fce7dc'},
  'Transportation':{icon:Car,color:'#42806b',background:'#e1eee6'},
  'Groceries':{icon:ShoppingCart,color:'#8463ae',background:'#ede5f5'},
  'Shopping':{icon:ShoppingBag,color:'#c9664e',background:'#fce7dc'},
  'Utilities':{icon:Zap,color:'#bc8e3f',background:'#f7edda'},
  'Healthcare':{icon:HeartPulse,color:'#b55c74',background:'#f6e2e7'},
  'Travel':{icon:Plane,color:'#558aa0',background:'#e0edf1'},
  'Entertainment':{icon:Film,color:'#8463ae',background:'#ede5f5'},
  'Other':{icon:ReceiptText,color:'#727a83',background:'#eceae6'},
};

export function ExpenseTimeline({entries,onEdit,onDelete,onReceipt}:{entries:StoredTransaction[];onEdit:(tx:StoredTransaction)=>void;onDelete?:(id:string)=>void;onReceipt?:(tx:StoredTransaction)=>void}){
  const [menu,setMenu]=useState<string|null>(null);const reduced=useReducedMotion();
  return <div className="pp-timeline">{entries.map(tx=>{
    const style=CATEGORY_STYLE[tx.category]??CATEGORY_STYLE.Other;const Icon=/chai|coffee|tea/i.test(tx.merchant??'')?Coffee:style.icon;
    return <motion.div key={tx.id} initial={reduced?false:{opacity:0,y:5}} animate={{opacity:1,y:0}} transition={{duration:.2}} className="pp-entry" style={{'--entry-color':style.color,'--entry-fill':style.background} as React.CSSProperties}>
      <span className="pp-dot"/><span className="pp-entry-icon"><Icon size={23} strokeWidth={1.6}/></span>
      <button type="button" onClick={()=>onEdit(tx)} className="pp-entry-main" aria-label={'Edit '+(tx.merchant||tx.category)}><strong>{tx.merchant||tx.category}</strong><span>{formatDisplayTime(tx.time)||tx.category}</span></button>
      <strong className="pp-entry-amount">− {formatPKR(tx.amount)}</strong>
      {(onDelete||onReceipt)&&<div className="pp-entry-options"><button type="button" className="pp-more" aria-label={'More options for '+(tx.merchant||tx.category)} aria-expanded={menu===tx.id} onClick={()=>setMenu(menu===tx.id?null:tx.id)}><MoreHorizontal size={17}/></button>{menu===tx.id&&<div className="pp-entry-menu"><button type="button" onClick={()=>{setMenu(null);onEdit(tx);}}><Pencil size={14}/>Edit</button>{tx.receiptImage&&onReceipt&&<button type="button" onClick={()=>{setMenu(null);onReceipt(tx);}}><Image size={14}/>Receipt</button>}{onDelete&&<button type="button" onClick={()=>{setMenu(null);onDelete(tx.id);}}><Trash2 size={14}/>Delete</button>}</div>}</div>}
    </motion.div>;
  })}</div>;
}
