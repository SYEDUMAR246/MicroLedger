import React from 'react';
import { Bell } from 'lucide-react';
export function Navbar({unreadCount=0,onOpenNotifications}:{unreadCount?:number;onOpenNotifications:()=>void}) {
  return <header className="bg-[#fffdf9]/95 backdrop-blur-md sticky top-0 z-30"><div className="max-w-lg mx-auto px-5 sm:px-6 py-4 flex items-center justify-between"><div className="flex items-center gap-2"><span className="text-2xl text-orange-600 font-black tracking-[-3px] pr-1" aria-hidden="true">ML</span><span className="font-bold text-slate-950 text-base tracking-tight">MicroLedger</span></div><button type="button" onClick={onOpenNotifications} aria-label={'Notifications'+(unreadCount?', '+unreadCount+' unread':'')} className="relative w-10 h-10 rounded-full bg-slate-100/70 text-slate-600 flex items-center justify-center"><Bell className="w-5 h-5"/>{unreadCount>0&&<span className="absolute w-2 h-2 bg-orange-500 rounded-full top-2 right-2 ring-2 ring-[#fffdf9]"/>}</button></div></header>;
}
