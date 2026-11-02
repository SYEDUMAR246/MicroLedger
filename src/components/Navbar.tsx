import React from 'react';
import { Bell,UserRound } from 'lucide-react';
export function Navbar({unreadCount=0,onOpenNotifications,onOpenProfile,profileActive=false,name='' }:{unreadCount?:number;onOpenNotifications:()=>void;onOpenProfile:()=>void;profileActive?:boolean;name?:string}){
  return <header className="pp-header"><div className="pp-header-inner"><div className="pp-wordmark">Micro<span>Ledger</span></div><div className="pp-header-actions"><button type="button" className="pp-bell" aria-label={'Notifications'+(unreadCount?', '+unreadCount+' unread':'')} onClick={onOpenNotifications}><Bell size={21} strokeWidth={1.5}/>{unreadCount>0&&<span/>}</button><button type="button" className="pp-avatar" aria-label="Profile and backups" aria-pressed={profileActive} onClick={onOpenProfile}>{name?<span className="pp-avatar-initials">{name.split(/\s+/).map(word=>word[0]).slice(0,2).join('').toUpperCase()}</span>:<UserRound size={20} strokeWidth={1.6}/>}</button></div></div></header>;
}
