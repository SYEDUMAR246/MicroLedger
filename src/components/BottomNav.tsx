import React from 'react';
import { House,NotebookText,Goal,CalendarDays,Plus } from 'lucide-react';
export type AppTab='home'|'expenses'|'goals'|'plan'|'profile';
export function BottomNav({activeTab,onTabChange,onOpenAddModal}:{activeTab:AppTab;onTabChange:(tab:AppTab)=>void;onOpenAddModal?:()=>void}){
  const tabs=[{id:'home' as const,label:'Today',icon:House},{id:'expenses' as const,label:'Activity',icon:NotebookText},{id:'goals' as const,label:'Goals',icon:Goal},{id:'plan' as const,label:'Plan',icon:CalendarDays}];
  return <nav className="pp-bottom-nav" aria-label="Main navigation">{tabs.map((tab,index)=><React.Fragment key={tab.id}>{index===2&&<button type="button" className="pp-nav-add" aria-label="Add expense" onClick={onOpenAddModal}><Plus size={26}/></button>}{<button type="button" key={tab.id} onClick={()=>onTabChange(tab.id)} aria-current={activeTab===tab.id?'page':undefined} className={activeTab===tab.id?'is-active':''}><tab.icon size={23} strokeWidth={1.55} fill={activeTab===tab.id&&tab.id==='home'?'currentColor':'none'}/><span>{tab.label}</span></button>}</React.Fragment>)}</nav>;
}
