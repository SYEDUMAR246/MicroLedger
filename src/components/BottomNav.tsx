import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { House, List, ChartNoAxesColumn, UserRound, Plus } from 'lucide-react';
export type AppTab='home'|'expenses'|'plan'|'profile';
export function BottomNav({activeTab,onTabChange,onOpenAddModal}:{activeTab:AppTab;onTabChange:(tab:AppTab)=>void;onOpenAddModal:()=>void}) {
  const reduced=useReducedMotion();
  const tabs=[{id:'home' as const,label:'Home',icon:House},{id:'expenses' as const,label:'Activity',icon:List},{id:'plan' as const,label:'Plan',icon:ChartNoAxesColumn},{id:'profile' as const,label:'Profile',icon:UserRound}];
  const button=(tab:typeof tabs[number])=><motion.button key={tab.id} type="button" whileTap={reduced?undefined:{scale:.94}} aria-current={activeTab===tab.id?'page':undefined} onClick={()=>onTabChange(tab.id)} className={'min-w-12 flex flex-col gap-1 items-center py-2 px-1 text-[10px] '+(activeTab===tab.id?'text-orange-600 font-semibold':'text-slate-500')}><tab.icon className="w-5 h-5"/>{tab.label}</motion.button>;
  return <nav aria-label="Main navigation" className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-100 px-5 pt-1 pb-[max(8px,env(safe-area-inset-bottom))] sm:max-w-lg sm:mx-auto sm:bottom-3 sm:rounded-[28px] sm:border sm:shadow-lg"><div className="flex justify-between items-center max-w-md mx-auto">{tabs.slice(0,2).map(button)}<motion.button type="button" whileTap={reduced?undefined:{scale:.91}} onClick={onOpenAddModal} aria-label="Add expense" className="w-14 h-14 -mt-5 rounded-full bg-orange-500 text-white ring-4 ring-white flex items-center justify-center shadow-lg shadow-orange-500/20"><Plus className="w-7 h-7"/></motion.button>{tabs.slice(2).map(button)}</div></nav>;
}
