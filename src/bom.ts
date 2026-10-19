import './bom.css';
import './i18n.css';
import {installLanguageSelector} from './i18n';
import quotation from './quotation.json';
const esc=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const money=(fen:number)=>new Intl.NumberFormat('en-CN',{style:'currency',currency:'CNY'}).format(fen/100);
const total=quotation.sections.reduce((sum,s)=>sum+s.totalFen,0);
document.querySelector('#bom-app')!.innerHTML=`<header><a class="brand" href="./" target="_blank" rel="noopener">Sophi<span>Studio</span></a><span class="project">SophiRobot</span><span class="page-marker">Quotation</span></header>
<main class="quotation"><div class="page-heading"><div><p class="eyebrow">SOPHIROBOT / QUOTATION</p><h1>Quotation</h1><p class="intro">Whole robot · Fixed section prices · Chinese yuan</p></div><div class="actions"><a class="export-excel" href="./SophiRobot-Quotation-CNY.xlsx" download>Export Excel ↓</a></div></div>
<section class="summary" aria-label="Quotation summary"><div><span>Total quotation · CNY</span><strong>${money(total)}</strong></div><div><span>Sections</span><strong>6</strong></div><div><span>Configuration</span><strong class="scope-summary">2 arms · 2 hands · 2 legs</strong></div></section>
<p class="notice">Prices and quantities are fixed from the supplied workbook. Model and motor selections do not change this quotation.</p>
<div class="table-toolbar"><label class="search">Search contents<input id="quotation-search" type="search" placeholder="Search item names…"></label><button id="expand-all">Expand all</button><button id="collapse-all">Collapse all</button></div>
<div id="quotation-sections">${quotation.sections.map((s,index)=>`<details class="quote-section" open><summary><span class="section-title">${esc(s.name)}<small>${esc(s.scope)}</small></span><strong>${money(s.totalFen)}</strong></summary><div class="quote-items"><table><caption class="sr-only">${esc(s.name)}</caption><thead><tr><th scope="col">Content name</th><th scope="col">Quantity</th><th scope="col">Unit / packaging</th></tr></thead><tbody>${s.items.map(item=>`<tr data-search="${esc(item.name.toLowerCase())}"><th scope="row" data-no-translate>${esc(item.name)}</th><td>${item.quantity}</td><td>${esc(item.note||'Pieces')}</td></tr>`).join('')}</tbody></table>${index===1?'<p class="quote-note">Source note: the Head subtotal excludes the three bearing rows. They remain listed as supplied.</p>':''}</div></details>`).join('')}</div>
<p id="no-results" hidden role="status">No matching contents</p><div class="total-bar"><div><strong>Total quotation <small>· CNY</small></strong><span>All six sections; searching does not change totals.</span></div><strong>${money(total)}</strong></div>
<footer>Source: <span data-no-translate>${esc(quotation.source)}</span><br>Arm quotation includes two arms and two hands. Leg quotation includes two legs.<br>Quantities follow the workbook purchasing units; packaging notes are shown where provided.</footer></main>`;
const sections=Array.from(document.querySelectorAll<HTMLDetailsElement>('.quote-section'));
document.querySelector<HTMLInputElement>('#quotation-search')!.oninput=event=>{
 const query=(event.target as HTMLInputElement).value.trim().toLowerCase();let any=false;
 for(const section of sections){let visible=false;section.querySelectorAll<HTMLTableRowElement>('[data-search]').forEach(row=>{row.hidden=!row.dataset.search!.includes(query);visible ||= !row.hidden;});section.hidden=!visible;if(query&&visible)section.open=true;any ||= visible;}
 document.querySelector<HTMLElement>('#no-results')!.hidden=any;
};
document.querySelector<HTMLButtonElement>('#expand-all')!.onclick=()=>sections.forEach(s=>s.open=true);
document.querySelector<HTMLButtonElement>('#collapse-all')!.onclick=()=>sections.forEach(s=>s.open=false);
installLanguageSelector();
