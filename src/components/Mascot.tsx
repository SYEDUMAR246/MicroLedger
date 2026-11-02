import React from 'react';
import {DEFAULT_MASCOT,MASCOT_COLORS,type MascotSettings} from '../lib/personalization';
export type MascotExpression='happy'|'wink'|'celebrate'|'thinking'|'concerned';
export function Mascot({value=DEFAULT_MASCOT,decorative=false,expression='happy'}:{value?:MascotSettings;decorative?:boolean;expression?:MascotExpression}){
 const color=MASCOT_COLORS[value.color];const eyeY=value.kind==='sprout'?119:value.kind==='cat'?93:104;const mouthY=eyeY+22;
 return <svg className="pp-mascot-art" data-expression={expression} viewBox="0 0 180 170" role={decorative?undefined:'img'} aria-hidden={decorative||undefined} aria-label={decorative?undefined:`${value.name}, your ${expression} ${value.kind} companion`}>
  <ellipse cx="90" cy="153" rx="48" ry="7" fill="currentColor" opacity=".07"/>
  <g className="pp-mascot-bob" stroke="#273641" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
   {value.kind==='cat'?<><path d="M43 75 40 29 72 48Q90 42 107 49L141 29 137 78Q156 115 129 139Q91 157 53 139Q25 118 43 75Z" fill={color}/><path className="pp-mascot-ears" d="m49 44 3 24 16-14m47 0 15-10-3 25" fill="#fff2e8" stroke="none"/><path d="m38 103-14-3m15 13-15 3m118-13 14-3m-15 13 15 3"/></>:value.kind==='sprout'?<><g className="pp-mascot-leaves"><path d="M87 62Q54 64 51 31Q82 23 90 57Q95 21 128 21Q132 56 94 63" fill={color}/><path d="M91 55v22" fill="none"/></g><path d="M43 88Q90 72 137 88L129 134Q91 158 51 134Z" fill={color}/><path d="M42 86q48-12 96 0v17q-48 12-96 0Z" fill="#fff0dd"/></>:<path d="M38 132C9 119 24 82 47 83C41 39 89 28 109 56C136 47 153 67 146 88C177 102 155 140 132 141H54Z" fill={color}/>}
   <g className="pp-mascot-face">
    <g className="pp-mascot-eyes" style={{transformOrigin:`90px ${eyeY}px`}}>
     {expression==='celebrate'?<path d={`M61 ${eyeY+3}q7-13 14 0m29 0q7-13 14 0`} fill="none"/>:expression==='wink'?<><path d={`M61 ${eyeY+2}q7-10 14 0`} fill="none"/><path d={`M112 ${eyeY-2}v6`} strokeWidth="5"/></>:<><path d={`M68 ${eyeY-2}v5m44-5v5`} strokeWidth="5"/>{expression==='concerned'&&<path d={`m60 ${eyeY-10}14-5m29 0 14 5`} fill="none"/>}</>}
    </g>
    {expression==='celebrate'?<><path d={`M78 ${mouthY-6}h24q-2 20-12 17t-12-17Z`} fill="#76424b"/><path d={`M84 ${mouthY+6}q6-4 12 0`} stroke="#f1a4a3" strokeWidth="4"/></>:expression==='thinking'?<ellipse className="pp-mascot-mouth" cx="91" cy={mouthY} rx="4" ry="5" fill="#76424b"/>:expression==='concerned'?<path d={`M82 ${mouthY+2}q8-7 16 0`} fill="none"/>:<path d={`M78 ${mouthY-3}q12 15 24 0`} fill="none"/>}
    <ellipse cx="57" cy={eyeY+12} rx="8" ry="4" fill="#e57870" opacity=".5" stroke="none"/><ellipse cx="123" cy={eyeY+12} rx="8" ry="4" fill="#e57870" opacity=".5" stroke="none"/>
   </g>
   {expression==='thinking'&&<g className="pp-mascot-thought" fill="#fff6e9"><circle cx="147" cy="46" r="4"/><circle cx="156" cy="32" r="7"/><circle cx="161" cy="14" r="10"/></g>}
   {expression==='celebrate'&&<g className="pp-mascot-sparkles" stroke="#b78233"><path d="M25 45v14m-7-7h14m122 9v14m-7-7h14M92 12v12m-6-6h12"/></g>}
   {value.accessory==='bow'&&<><path d="m116 68-15-12v24l15-8 16 9V56Z" fill="#c26766"/><circle cx="116" cy="69" r="5" fill="#ffdbb9"/></>}
   {value.accessory==='star'&&<path d="m133 51 4 10 11 1-9 7 3 11-9-6-10 6 3-11-9-7 12-1Z" fill="#ffdb8e"/>}
  </g>
 </svg>;
}
