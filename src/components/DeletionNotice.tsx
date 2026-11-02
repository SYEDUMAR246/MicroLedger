import React from 'react';
import { X,Undo2 } from 'lucide-react';
import type { PendingDeletion } from '../lib/deletion';
export function DeletionNotice({deletion,remaining,onUndo,onClose}:{deletion:PendingDeletion;remaining:number;onUndo:()=>void;onClose:()=>void}){
  return <div className="pp-delete-notice" role="status" aria-live="polite"><span>{deletion.label}<small>Undo available for <span aria-live="off">{remaining}s</span></small></span><button type="button" className="pp-undo-button" onClick={onUndo}><Undo2 size={16}/>Undo</button><button type="button" className="pp-notice-close" aria-label="Dismiss delete notification" onClick={onClose}><X size={17}/></button><span className="pp-delete-progress" style={{transform:'scaleX('+remaining/5+')'}}/></div>;
}
