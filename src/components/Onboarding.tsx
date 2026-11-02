import React,{useEffect,useRef,useState} from 'react';
import {ArrowLeft,ArrowRight,Check} from 'lucide-react';
import type {Ledger} from '../lib/ledger';
import {categoriesFor} from '../lib/settings';
import {setupAnswers,type SetupAnswers} from '../lib/personalization';
import {parsePKR,totalPKR} from '../lib/finance';
import {formatPKR} from '../types';
import {Mascot} from './Mascot';
import {MascotCustomizer} from './MascotCustomizer';
const steps=['Your name','Your companion','Your budget','Your categories','Your goal','Your fresh start'];
export function Onboarding({ledger,onComplete,onCancel,saveError}:{ledger:Ledger;onComplete:(answers:SetupAnswers)=>boolean;onCancel?:()=>void;saveError:string|null}){
 const [answers,setAnswers]=useState(()=>setupAnswers(ledger));const [step,setStep]=useState(0);const [error,setError]=useState('');const heading=useRef<HTMLHeadingElement>(null);
 useEffect(()=>{heading.current?.focus();window.scrollTo({top:0,behavior:'instant'});},[step]);
 const allocated=totalPKR(Object.values(answers.limits).filter(value=>parsePKR(value)!==null).map(value=>({amount:parsePKR(value)!})));
 const budget=parsePKR(answers.budget);const name=answers.profile.name.trim().split(' ')[0];
 const advance=()=>{
  if(step===0&&!answers.profile.name.trim()){setError('Tell us what you would like to be called.');return;}
  if(step===1&&!answers.mascot.name.trim()){setError('Give your companion a name.');return;}
  if(step===2&&budget===null){setError('Enter a spending budget greater than zero in PKR.');return;}
  if(step===3&&(Object.values(answers.limits).some(value=>value.trim()&&parsePKR(value)===null)||allocated>budget!)){setError('Use positive category amounts and keep the total within your monthly budget.');return;}
  if(step===4&&(answers.goalName.trim()||answers.goalTarget.trim())&&(!answers.goalName.trim()||parsePKR(answers.goalTarget)===null)){setError('Add a goal name and a positive target, or leave both blank.');return;}
  setError('');if(step===5){onComplete(answers);return;}setStep(step+1);
 };
 return <main className="pp-setup"><header><span className="pp-setup-brand">Micro<span>Ledger</span></span>{onCancel&&<button type="button" className="pp-text-button" onClick={onCancel}>Exit setup</button>}</header>
  <div className="pp-setup-progress" aria-label={`Setup step ${step+1} of ${steps.length}`}><span>{String(step+1).padStart(2,'0')} / 06</span><div>{steps.map((label,index)=><i key={label} className={index<=step?'is-done':''}/>)}</div></div>
  <p className="pp-setup-eyebrow">A LITTLE MORE YOU</p>
  <h1 ref={heading} tabIndex={-1} className="pp-title">{['First things first.\nWhat’s your name?','Meet your little\nmoney companion.',`Let’s make room\nfor your month.`,`Give your money\na little direction.`,`What are you\nlooking forward to?`,`Your next chapter,\n${name||'made for you'}.`][step]}</h1>
  <p className="pp-setup-intro">{['A name, a plan, a companion. Let’s make this space feel like yours.','Choose their look and name. You can always change your mind.','How much do you want to spend in a typical month? This is your spending limit, not your income.','Optional limits for the things you spend on. Leave anything blank to keep it flexible.','Start with one savings goal, or leave it for later. We’ll start its progress at zero.','Here’s the space we’ll create for you. Review it, then make it yours.'][step]}</p>
  <form className="pp-setup-form" onSubmit={event=>{event.preventDefault();advance();}}>
   {step===0&&<div className="pp-name-step"><label>Your name<input autoComplete="given-name" aria-label="Your name" maxLength={50} placeholder="What should we call you?" value={answers.profile.name} onChange={event=>setAnswers({...answers,profile:{...answers.profile,name:event.target.value}})}/></label><Mascot value={answers.mascot}/><p>Small steps. Your own pace.</p></div>}
   {step===1&&<><MascotCustomizer value={answers.mascot} onChange={mascot=>setAnswers({...answers,mascot})}/><fieldset><legend>App appearance</legend><div className="pp-accessories">{(['light','dark','system'] as const).map(theme=><button type="button" key={theme} aria-pressed={answers.profile.theme===theme} onClick={()=>setAnswers({...answers,profile:{...answers.profile,theme}})}>{theme[0].toUpperCase()+theme.slice(1)}</button>)}</div></fieldset></>}
   {step===2&&<><label>Monthly spending budget (PKR)<div className="pp-budget-input"><span>Rs.</span><input aria-label="Monthly spending budget (PKR)" inputMode="decimal" placeholder="e.g. 30,000" value={answers.budget} onChange={event=>setAnswers({...answers,budget:event.target.value})}/></div></label><p className="pp-small-note">Set an amount that suits your life. You can edit it later in Plan.</p><div className="pp-setup-tip"><Mascot value={answers.mascot} decorative/><p>No perfect budgets here.<br/>Just a starting point.</p></div></>}
   {step===3&&<><div className="pp-setup-allocation"><span>Monthly budget <strong>{formatPKR(budget??0)}</strong></span><span>Still flexible <strong>{formatPKR((budget??0)-allocated)}</strong></span></div><div className="pp-setup-limits">{categoriesFor(ledger.customCategories).map(category=><label key={category}>{category}<input aria-label={category+' setup limit'} inputMode="decimal" placeholder="No limit" value={answers.limits[category]??''} onChange={event=>setAnswers({...answers,limits:{...answers.limits,[category]:event.target.value}})}/></label>)}</div></>}
   {step===4&&<><label>Something you’re saving for<input aria-label="Setup goal name" placeholder="e.g. A new phone, a rainy day" maxLength={60} value={answers.goalName} onChange={event=>setAnswers({...answers,goalName:event.target.value})}/></label><label>Target amount (PKR)<input aria-label="Setup goal target" inputMode="decimal" placeholder="e.g. 60,000" value={answers.goalTarget} onChange={event=>setAnswers({...answers,goalTarget:event.target.value})}/></label><button type="button" className="pp-text-button" onClick={()=>{setAnswers({...answers,goalName:'',goalTarget:''});setError('');setStep(5);}}>I’ll add a goal later →</button><div className="pp-setup-tip"><Mascot value={answers.mascot} decorative/><p>Big plans begin<br/>with small steps.</p></div></>}
   {step===5&&<div className="pp-setup-review"><Mascot value={answers.mascot}/><p>{answers.mascot.name} is ready when you are.</p><dl><div><dt>Your name</dt><dd>{answers.profile.name}</dd></div><div><dt>Monthly budget</dt><dd>{formatPKR(budget??0)}</dd></div><div><dt>Category limits</dt><dd>{Object.values(answers.limits).filter(value=>value.trim()).length} · {formatPKR(allocated)}</dd></div><div><dt>First goal</dt><dd>{answers.goalName.trim()?answers.goalName+' · '+formatPKR(parsePKR(answers.goalTarget)??0):'Add one when you’re ready'}</dd></div><div><dt>Appearance</dt><dd>{answers.profile.theme}</dd></div></dl><p className="pp-small-note">Saved on this device. Your existing expenses, bills and goals stay in place. Download backups from Profile to keep a copy.</p></div>}
   {(error||saveError)&&<p role="alert" className="pp-error">{error||saveError}</p>}
   <footer className="pp-setup-actions">{step>0&&<button type="button" className="pp-setup-back" aria-label="Previous setup step" onClick={()=>{setStep(step-1);setError('');}}><ArrowLeft size={20}/></button>}<button type="submit" className="pp-primary">{step===5?<>Make it mine <Check size={18}/></>:<>Continue <ArrowRight size={18}/></>}</button></footer>
  </form><p className="pp-setup-footnote">Your money. Your pace. Your space.</p>
 </main>;
}
