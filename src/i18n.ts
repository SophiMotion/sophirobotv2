import {chinese} from './zh-CN';
export type Language='en'|'zh-CN';
export const normalizeLanguage=(value:string|null):Language=>value==='zh-CN'?'zh-CN':'en';
const key='sophi-language';
export function getLanguage():Language{try{return normalizeLanguage(localStorage.getItem(key));}catch{return typeof document==='undefined'?'en':normalizeLanguage(document.documentElement.lang);}}
const escapeRegex=(s:string)=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const phrases=new RegExp('(?<![A-Za-z])(?:'+Object.keys(chinese).sort((a,b)=>b.length-a.length).map(escapeRegex).join('|')+')(?![A-Za-z])','g');
export function translate(text:string,language:Language):string{
 if(language==='en')return text;
 const trimmed=text.trim();
 if(chinese[trimmed])return text.replace(trimmed,chinese[trimmed]);
 return text.replace(phrases,match=>chinese[match]);
}
/** Localize presentation only; keep model identifiers, form values and user data intact. */
export function installLanguageSelector(){
 let language=getLanguage();
 const header=document.querySelector('.header-actions')||document.querySelector('header');
 if(!header)return;
 const label=document.createElement('label');label.className='language-setting';label.dataset.noTranslate='';
 label.innerHTML='<span>Language / 语言</span><select aria-label="Language / 语言"><option value="en">English</option><option value="zh-CN">简体中文</option></select>';
 header.append(label);const select=label.querySelector('select')!;select.value=language;
 const texts=new WeakMap<Text,{original:string;shown:string}>();
 const attributes=new WeakMap<Element,Map<string,{original:string;shown:string}>>();
 const skip='script,style,textarea,code,[data-no-translate],[data-motor-select],#selection,.source-filename,.part-list,.source-data dd';
 const options:MutationObserverInit={subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['title','aria-label','placeholder']};
 const observer=new MutationObserver(()=>apply());
 function apply(){
  observer.disconnect();
  document.documentElement.lang=language;
  document.title=language==='zh-CN'?'SophiStudio · SophiRobot 配置器':'SophiStudio · SophiRobot Configurator';
  if(document.querySelector('#bom-app'))document.title=language==='zh-CN'?'SophiRobot · 报价单':'SophiRobot · Quotation';
  // Options without explicit values derive their value from text. Freeze those first.
  document.querySelectorAll('option:not([value])').forEach(option=>option.setAttribute('value',option.textContent||''));
  const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
  let node:Node|null;
  while((node=walker.nextNode())){
   const text=node as Text;if(text.parentElement?.closest(skip)||!text.data.trim())continue;
   const prior=texts.get(text),original=prior&&text.data===prior.shown?prior.original:text.data;
   const shown=translate(original,language);texts.set(text,{original,shown});if(text.data!==shown)text.data=shown;
  }
  document.querySelectorAll('[title],[aria-label],[placeholder]').forEach(element=>{
   if(element.closest('[data-no-translate]'))return;
   const records=attributes.get(element)||new Map();attributes.set(element,records);
   for(const name of ['title','aria-label','placeholder']){
    const current=element.getAttribute(name);if(current===null)continue;
    const prior=records.get(name),original=prior&&prior.shown===current?prior.original:current,shown=translate(original,language);
    records.set(name,{original,shown});if(current!==shown)element.setAttribute(name,shown);
   }
  });
  observer.observe(document.body,options);
 }
 select.onchange=()=>{language=normalizeLanguage(select.value);try{localStorage.setItem(key,language);}catch{/* Session-only when storage is unavailable. */}apply();};
 window.addEventListener('storage',event=>{if(event.key===key){language=normalizeLanguage(event.newValue);select.value=language;apply();}});
 apply();
}

