import React,{useState} from 'react';
import {Mascot,type MascotExpression} from './Mascot';
import {MASCOT_COLORS,type MascotSettings} from '../lib/personalization';
export function MascotCustomizer({value,onChange}:{value:MascotSettings;onChange:(next:MascotSettings)=>void}){
 const [expression,setExpression]=useState<MascotExpression>('happy');
 return <div className="pp-companion-editor"><div className="pp-companion-preview"><Mascot value={value} expression={expression}/><span>A little company for your money journey.</span></div>
  <fieldset><legend>Try their expressions</legend><div className="pp-expression-options">{([{id:'happy',label:'Happy'},{id:'wink',label:'Wink'},{id:'celebrate',label:'Celebrate'},{id:'thinking',label:'Thinking'},{id:'concerned',label:'Concerned'}] as {id:MascotExpression;label:string}[]).map(item=><button type="button" key={item.id} aria-pressed={expression===item.id} onClick={()=>setExpression(item.id)}>{item.label}</button>)}</div><p className="pp-small-note">Your companion reacts to logging and savings. Motion follows your animation settings.</p></fieldset>
  <fieldset><legend>Choose your companion</legend><div className="pp-choice-grid">{[{kind:'sprout' as const,label:'Sprout'},{kind:'cat' as const,label:'Cat'},{kind:'cloud' as const,label:'Cloud'}].map(item=><button type="button" key={item.kind} aria-pressed={value.kind===item.kind} onClick={()=>onChange({...value,kind:item.kind})}><Mascot value={{...value,kind:item.kind}} decorative/>{item.label}</button>)}</div></fieldset>
  <fieldset><legend>Pick a color</legend><div className="pp-color-choices">{Object.entries(MASCOT_COLORS).map(([name,color])=><button type="button" key={name} aria-label={name+' mascot color'} aria-pressed={value.color===name} style={{background:color}} onClick={()=>onChange({...value,color:name as MascotSettings['color']})}>{value.color===name?'✓':''}</button>)}</div></fieldset>
  <fieldset><legend>A finishing touch</legend><div className="pp-accessories">{(['none','bow','star'] as const).map(accessory=><button type="button" key={accessory} aria-pressed={value.accessory===accessory} onClick={()=>onChange({...value,accessory})}>{accessory==='none'?'Just me':accessory==='bow'?'Bow':'Star'}</button>)}</div></fieldset>
  <label>Companion name<input aria-label="Companion name" value={value.name} maxLength={24} onChange={event=>onChange({...value,name:event.target.value})}/></label>
  <label className="pp-switch-row"><span>Show on my home screen<small>You can change this any time.</small></span><input type="checkbox" checked={value.visible} onChange={event=>onChange({...value,visible:event.target.checked})}/></label>
 </div>;
}
