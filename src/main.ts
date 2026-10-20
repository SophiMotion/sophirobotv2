import {appearanceDefaults as baseDefaults,appearanceLabels} from './appearance';
import './styles.css';
import './i18n.css';
import {installLanguageSelector} from './i18n';
import {defaults,fields,validate,parseConfig,type BaseVersion,type Params,type Tab,type Key} from './parameters';
import {type Model,type Bounds} from './geometry';
import {ArmControls} from './arm-controls';
import {neutralLimbs,fixedModes,parseLimbConfig} from './limbs';
import {Viewer,type View} from './viewer';
import {icon} from './icons';
import {MotorControls} from './motor-controls';
import {defaultMotors,parseMotors} from './motors';
import {HeadControls} from './head-controls';
import {neutralHead,parseHeadConfig} from './head';
import {createFusionRequest} from './fusion-export';
import {WalkControls} from './walk-controls';
import {platforms,configurationBase,withBaseParameters} from './platforms';

const $=<T extends HTMLElement=HTMLElement>(s:string)=>document.querySelector<T>(s)!;
let baseVersion:BaseVersion='new';
try{if(localStorage.getItem('sophi-base-version')==='old')baseVersion='old';}catch{}
let params:Params=baseDefaults(baseVersion),model:Model,viewer:Viewer,activeTab:Tab='Base';
const baseSettings:Partial<Record<BaseVersion,Params>>={},modelCache=new Map<BaseVersion,Model>();
let switchingBase=false;
const visibility:Record<string,boolean>={cover:true,grid:true,edges:true,axes:false,dimensions:false,...Object.fromEntries(Object.keys(appearanceLabels).map(k=>[k,true]))};
let valid=true,changed=false,toastTimer:number;
const fmt=(v:number)=>v.toLocaleString('en-US',{maximumFractionDigits:2});
const button=(id:string,label:string,ico:string,cls='')=>`<button id="${id}" class="${cls}" title="${label}">${icon(ico)}<span>${label}</span></button>`;

$('#app').innerHTML=`
 <header class="header"><a class="brand" href="./" aria-label="SophiStudio home">${icon('cube')}<span>Sophi<span class="brand-x">Studio</span></span></a><div class="project-title">SophiRobot</div><div class="header-actions">${button('reset','Reset','reset')}${button('import','Load configuration','upload','icon-button')}${button('save','Save configuration','save','primary')}</div></header>
 <nav class="project-navigation" aria-label="Project pages"><a href="./" aria-current="page">Configurator</a><a id="open-bom" href="./bom.html">Quotation</a></nav>
 <main class="workspace">
  <aside class="sidebar" aria-label="Assembly parameters"><div class="panel-heading"><h1>Parameters</h1><p>Dimensions in millimeters</p></div>
   <div class="tabs" role="tablist" aria-label="Parameter groups">${(['Base','Wheels','Body','Limbs','Head','Motors','Appearance'] as Tab[]).map(t=>`<button role="tab" id="tab-${t}" aria-controls="fields" aria-selected="${t===activeTab}" data-tab="${t}">${t}</button>`).join('')}</div>
   <div class="panel-scroll"><section id="base-version-panel" class="base-version-panel"><label for="base-version">Base model</label><select id="base-version"><option value="new">V2 (wheel is hiding inside)</option><option value="old">V1 (wheel is outside)</option></select><p class="tab-note">Each base keeps its own dimensions. Upper-body settings are shared.</p><p id="base-loading" role="status" hidden>Loading base model…</p></section><div id="walk-controls"></div><div id="fields" role="tabpanel" aria-labelledby="tab-Base"></div>
    <div id="validation" role="alert" hidden></div>
    <div id="arm-controls"></div><div id="head-controls" hidden></div>
    <section class="visibility"><h2>Visibility</h2>${Object.entries({cover:'Top metal cover',grid:'Grid',edges:'Edges',axes:'Axes',dimensions:'Bounding dimensions'}).map(([id,label])=>`<label class="switch-row" for="show-${id}"><span>${label}</span><input id="show-${id}" type="checkbox" role="switch" ${visibility[id]?'checked':''}><span class="switch" aria-hidden="true"></span></label>`).join('')}</section>
    <details class="derived"><summary>Derived dimensions ${icon('chevron')}</summary><dl id="derived"></dl></details>
    <button id="download-step" class="source-button">${icon('save')}<span>Download STEP</span>${icon('chevron')}</button>
    <p class="step-note">Current model · faceted geometry</p><p id="step-progress" class="step-note" role="status" hidden></p><button id="cancel-step" hidden>Cancel export</button><a id="step-file" class="step-file" download="SophiRobot-preview.step" hidden>Save STEP file</a>
    <button id="fusion-export" class="source-button">${icon('save')}<span>Export via Fusion 360</span>${icon('chevron')}</button>
    <button id="source" class="source-button">${icon('info')}<span>Source & parameter notes</span>${icon('chevron')}</button>
   </div>
  </aside>
  <section class="viewport" aria-label="Assembly preview"><div id="canvas"></div>
   <div class="viewport-heading"><h2>Assembly</h2><p>STEP reference <span>·</span> Parametric preview</p><button id="arm-shortcut" class="arm-status">Limbs fixed · Open joints</button></div>
   <div class="camera-toolbar" aria-label="Camera views"><div class="segments">${(['ISO','Top','Front','Rear','Side'] as View[]).map(v=>`<button data-view="${v}" aria-pressed="${v==='ISO'}">${v}</button>`).join('')}</div><button id="fit" class="icon-button" title="Fit to model" aria-label="Fit to model">${icon('fit')}</button></div>
   <div class="tools" aria-label="Inspection tools"><button id="cover-quick" class="icon-button" title="Hide / show top metal cover" aria-label="Toggle top metal cover" aria-pressed="true">${icon('layers')}</button><button id="measure" class="icon-button" title="Measure between two surface points" aria-label="Measure" aria-pressed="false">${icon('ruler')}</button><button id="snapshot" class="icon-button" title="Download viewport image" aria-label="Download viewport image">${icon('camera')}</button></div>
   <div id="loading" class="loading"><div class="spinner"></div><h3>Loading assembly</h3><p>Preparing your CAD reference…</p></div>
   <div id="selection" class="selection" hidden></div><div id="measurement" class="measurement" aria-live="polite" hidden></div><div id="greeting-caption" class="greeting-caption" role="status" hidden>👋 Hi! I’m SophiRobot.</div>
   <div class="readouts" aria-label="Measured assembly dimensions"><div><strong id="read-length">900 <small>mm</small></strong><span>Length</span></div><div><strong id="read-width">850 <small>mm</small></strong><span>Width</span></div><div><strong id="read-height">1,640 <small>mm</small></strong><span>Height</span></div></div>
   <div class="orbit-hint">${icon('mouse')}<span>Drag to orbit <b>·</b> Right-drag to pan <b>·</b> Scroll to zoom</span></div>
  </section>
 </main>
 <footer class="statusbar"><div><span id="status-dot" class="status-dot"></span><span id="status">Loading model</span><span class="footer-separator">/</span><span id="count">Loading components</span></div><div><span class="source-filename">Assembly_V2_website_new platform .step</span><span class="footer-separator">/</span><span>mm <b>·</b> Z up</span></div></footer>
 <div id="toast" role="status" hidden></div><input id="file-input" type="file" accept=".json,application/json" hidden>
 <dialog id="source-dialog"><div class="dialog-heading"><div><h2>Source & parameter notes</h2><p>Mobile humanoid with AGV platform</p></div><button id="close-dialog" class="icon-button" aria-label="Close source notes">${icon('close')}</button></div><div class="dialog-body" id="source-content"></div></dialog>
 <dialog id="fusion-dialog" aria-labelledby="fusion-title"><div class="dialog-heading"><div><h2 id="fusion-title">Export via Fusion 360</h2><p>Create STEP from your native robot design</p></div><button id="close-fusion" class="icon-button" aria-label="Close Fusion export">${icon('close')}</button></div><div class="dialog-body fusion-body"><ol><li>Open the original parametric SophiRobot design in Fusion 360. A STEP import alone does not contain its parameter history.</li><li><a href="${import.meta.env.BASE_URL}fusion/SophiRobot-Fusion-Export.zip" download>Download the Fusion script ZIP</a>, extract it, and review <code>mapping.json</code> against your native parameter names.</li><li>Download the request below. In Fusion, open <strong>Scripts and Add-Ins</strong>, add the extracted <strong>SophiRobotExport</strong> folder, and run its script.</li><li>Select the request JSON, review the mapping, and choose a new STEP filename.</li></ol><label class="fusion-pose-label" for="fusion-pose">Joint pose for STEP</label><select id="fusion-pose"><option value="fusion">Keep the current Fusion pose</option><option value="website">Apply the website pose (requires angle mappings)</option></select><p class="tab-note">Dimensions are applied in both modes. The first option keeps Fusion's joint positions, even if the website pose differs. Website pose mode requires all 18 native angle parameter mappings, including the head.</p><p class="tab-note">Exports the complete CAD assembly. Website cover visibility is not applied. Motor choices are saved in accompanying JSON; they do not replace CAD parts. Missing mappings or a failed rebuild stop export.</p><button id="download-fusion" class="primary">Download Fusion export request</button><p id="fusion-result" role="status"></p><p><a href="${import.meta.env.BASE_URL}fusion/README.md" download>Download setup and mapping instructions</a></p></div></dialog>`;

const motorControls=new MotorControls(()=>{$('#save').toggleAttribute('disabled',!valid||!armControls.valid||!motorControls.valid||!headControls.valid||!model);});
function renderFields(){
 const selected=fields.filter(f=>f.tab===activeTab);let section='';
 $('#fields').setAttribute('aria-labelledby',`tab-${activeTab}`);
 $('#arm-controls').hidden=activeTab!=='Limbs';
 $('#head-controls').hidden=activeTab!=='Head';
 $('#base-version-panel').hidden=activeTab!=='Base';
 if(activeTab==='Appearance'){$('#fields').innerHTML='<section class="field-section"><h2>Appearance covers</h2><p class="tab-note">Show or hide the outer covers. Covers follow their corresponding joints.</p>'+Object.entries(appearanceLabels).map(([key,label])=>`<label class="switch-row"><span>${label}</span><input type="checkbox" role="switch" data-appearance="${key}" ${visibility[key]?'checked':''}><span class="switch" aria-hidden="true"></span></label>`).join('')+'</section>';$('#fields').querySelectorAll<HTMLInputElement>('[data-appearance]').forEach(input=>input.onchange=()=>setVisibility(input.dataset.appearance!,input.checked));return;}
 if(activeTab==='Head'){$('#fields').innerHTML='';return;}
 if(activeTab==='Motors'){motorControls.render($('#fields'));return;}
 $('#fields').innerHTML=selected.map(f=>{const heading=section!==f.section?`${section?'</section>':''}<section class="field-section"><h2>${f.section}</h2>`:'';section=f.section;
 return `${heading}<div class="field-row"><label for="${f.key}" title="${f.help}">${f.label}</label><div class="number-input"><input id="${f.key}" name="${f.key}" type="number" min="${f.min}" max="${f.max}" step="${f.step}" value="${params[f.key]}" ${f.key==='structural_sheet'?'disabled':''} aria-describedby="help-${f.key}" inputmode="decimal"><span>${f.unit}</span></div><span class="field-help" id="help-${f.key}">${baseVersion==='old'&&f.key==='wheel_base'?'Front-to-rear wheel center spacing.':baseVersion==='old'&&f.key==='base_length'?'Main tray length; the cover adds 3 mm at each end at default settings.':baseVersion==='old'&&f.key==='base_width'?'Overall platform width including side panels.':baseVersion==='old'&&f.key==='base_height'?'Main tray height above its 49 mm reference floor.':f.help}</span></div>`;}).join('')+'</section>'+ (activeTab==='Wheels'&&baseVersion==='old'?'<p class="tab-note">Four wheels: 606 mm track, 600 mm wheel base and 190 mm tire diameter at source defaults.</p>':activeTab==='Wheels'?'<p class="tab-note">Track is measured between wheel centers. The source track is 600 mm; tire width stays 50 mm.</p>':activeTab==='Body'?'<p class="tab-note">Hip position is above the base deck. Total height includes the head in the neutral pose.</p>':activeTab==='Limbs'?'<p class="tab-note">Shared tube settings: outside diameter and radial wall thickness. Tube settings apply to both arms and both legs. Select each limb below to move it independently.</p>':'');
 $('#fields').querySelectorAll<HTMLInputElement>('input[name]').forEach(input=>input.addEventListener('input',applyInputs));
 if(activeTab==='Base'){const host=document.createElement('div');host.id='base-motors';$('#fields').append(host);motorControls.render(host,true);}
}
function applyInputs(){
 const candidate={...params};$('#fields').querySelectorAll<HTMLInputElement>('input[name]').forEach(i=>candidate[i.name as Key]=i.value===''?NaN:Number(i.value));
 const errors=validate(candidate,baseVersion);valid=errors.length===0;
 $('#validation').hidden=valid;$('#validation').textContent=errors.join(' ');
 $('#fields').querySelectorAll<HTMLInputElement>('input[name]').forEach(i=>i.setAttribute('aria-invalid',String(!Number.isFinite(candidate[i.name as Key])||candidate[i.name as Key]<Number(i.min)||candidate[i.name as Key]>Number(i.max))));
 $('#save').toggleAttribute('disabled',!valid||!armControls.valid||!motorControls.valid||!headControls.valid||!model);
 if(!valid){$('#status').textContent='Last valid model retained';$('#status-dot').classList.add('warning');return;}
 params=candidate;update();
}
function update(){
 if(!viewer||!model)return;const bounds=viewer.update(params);
 updateReadouts(bounds);
 changed=fields.some(f=>params[f.key]!==baseDefaults(baseVersion)[f.key]);$('#status').textContent=changed?'Configuration updated':'Model ready';$('#status-dot').classList.remove('warning');$('#count').textContent=`${viewer.visibleCount} / ${model.meshes.length} components`;
 $('#derived').innerHTML=Object.entries({'Tube inner diameter':params.tube_diameter-2*params.tube_thickness,'Rim diameter':params.od_tire-params.tire_thickness,'Radial tire wall':params.tire_thickness/2,'Drive axle height':params.od_tire/2+(baseVersion==='old'?4:0),'Base deck height':(baseVersion==='old'?49:50)+params.base_height,'Hip above ground':50+params.base_height+params.hip_position,'Ground clearance':baseVersion==='old'?49:50,'Frame profile':40}).map(([k,v])=>`<div><dt>${k}</dt><dd>${fmt(v)} mm</dd></div>`).join('');
 $('#selection').hidden=true;
}
function updateReadouts(bounds:Bounds){
 for(const [id,v] of [['length',bounds.size[1]],['width',bounds.size[0]],['height',bounds.size[2]]] as const)$(`#read-${id}`).innerHTML=`${fmt(v)} <small>mm</small>`;
}
const armControls=new ArmControls($('#arm-controls'),(pose,movable,armValid)=>{
 $('#arm-shortcut').textContent=Object.values(movable).some(Boolean)?'Limbs movable · Open joints':'Limbs fixed · Open joints';
 $('#save').toggleAttribute('disabled',!valid||!armValid||!motorControls.valid||!headControls.valid||!model);
 if(model&&viewer&&armValid){updateReadouts(viewer.setPose(pose));$('#selection').hidden=true;}
});
const headControls=new HeadControls($('#head-controls'),(pose,headValid)=>{
 $('#save').toggleAttribute('disabled',!valid||!armControls.valid||!motorControls.valid||!headValid||!model);
 if(model&&viewer&&headValid){updateReadouts(viewer.setHeadPose(pose));$('#selection').hidden=true;}
});
const walkControls=new WalkControls($('#walk-controls'),()=>{
 if(!model||!valid||!armControls.valid||!headControls.valid||!motorControls.valid){toast('Load the model and correct invalid values before playing.');return null;}
 viewer.measure(false);$('#measure').setAttribute('aria-pressed','false');$('#measurement').hidden=true;$('#selection').hidden=true;
 return armControls.pose;
},(pose,preview)=>{
 const bounds=viewer.setPose(pose,!preview);
 if(!preview)updateReadouts(bounds);
},visible=>{$('#greeting-caption').hidden=!visible;});
// Restore the configured pose before edits, snapshots, measurements or exports.
for(const event of ['click','input','change'])$('#app').addEventListener(event,e=>{
 const target=e.target as HTMLElement;
 if(!target.closest('#walk-controls')&&target.closest('.sidebar,.header-actions,#snapshot,#measure,#open-bom'))walkControls.stop();
},true);
function toast(message:string){clearTimeout(toastTimer);$('#toast').textContent=message;$('#toast').hidden=false;toastTimer=window.setTimeout(()=>$('#toast').hidden=true,3800);}
function download(url:string,name:string){const a=document.createElement('a');a.href=url;a.download=name;a.click();}
function sourceContent(){
 $('#source-content').innerHTML=`<section><h3>${platforms[baseVersion].label}</h3><p>${baseVersion==='old'?'V1 (wheel is outside): four wheels and one top cover. Source tray is 1000 × 700 × 200 mm; cover overhang extends overall length to 1006 mm.':'V2 (wheel is hiding inside): two drive wheels, two casters and two top covers.'}</p></section><section><h3>Original assembly</h3><dl class="source-data"><div><dt>File</dt><dd>${model.metadata.source}</dd></div><div><dt>Source bodies</dt><dd>${model.meshes.length}</dd></div><div><dt>Axes</dt><dd>X width · Y length · Z height</dd></div><div><dt>Neutral envelope</dt><dd>${[model.metadata.bounds.size[1],model.metadata.bounds.size[0],model.metadata.bounds.size[2]].map(fmt).join(' × ')} mm</dd></div></dl><p class="hash-label">SHA-256</p><code>${model.metadata.sha256}</code></section>
 <section><h3>Appearance reference</h3><p>Assembly_V2_Appearance mounting .step provides the updated skeleton and mounting parts. Thirteen outer covers are retained from Appearance 2. Source arm tubes are 120 mm and 200 mm; thigh tubes are 320 mm and lower-leg tubes are 400 mm. Shoulder span is 350 mm and hip span is 320 mm. The appearance head top is 1810 mm above the ground reference. The V1 source tires sit approximately 4 mm above this reference, so measured envelope height is approximately 1806 mm.</p><p>The Appearance panel controls head, chest, hip, shoulder, arm and leg covers independently. The head, shoulder, arm and leg covers follow their joint chains. Chest and hip covers resize with the frame as a mesh preview. Motion is not collision checked. V2 combines this upper assembly with the existing enclosed-wheel platform.</p></section>
 <section><h3>How the controls work</h3><p>Each update starts with an immutable copy of the original mesh. Wheels, hubs and motors translate together; tires and rims adapt around the fixed hub. Shoulder and hip beams extend along their extrusion axes. Both cover bodies follow the base envelope and hide together.</p><p>The screenshot defines tire thickness as a diameter difference: rim diameter = tire OD − tire thickness. Actual radial rubber thickness is half this value. Wheel width remains 50 mm and the frame profile remains 40 mm.</p></section>
 <section><h3>Preview limits</h3><p>This STEP contains static solids, without the original Fusion parameter equations or assembly joints. Adjustments here are mesh-based design previews. Base folds, bend radii and holes use interpolated deformation; changing thickness does not reconstruct exact sheet-metal offsets. Purchased components retain their shape, except the explicitly adjustable tire and rim.</p><p>The source does not provide separate drive-to-frame mounting brackets. Wheel spacing and diameter changes therefore need a mounting design review. Validation checks known envelope clearances, not full collision, strength or manufacturability.</p><p>Download STEP directly exports the current displayed model as faceted surface geometry, including dimensions, pose and top-cover visibility. It does not contain smooth analytic solids or a feature timeline. Export via Fusion 360 downloads a configuration request for the companion Fusion script. STEP is generated from the original native design after parameter mapping and rebuild checks. It requires the original Fusion design; it does not convert this mesh preview into a parametric solid. Save configuration downloads JSON; the camera button exports a preview image.</p></section>
 <section><h3>Assembly contents</h3><ul class="part-list">${model.meshes.map(m=>`<li><span>${m.name}</span><small>#${String(m.id+1).padStart(2,'0')}</small></li>`).join('')}</ul></section>`;
}

document.querySelectorAll<HTMLButtonElement>('[data-tab]').forEach(b=>b.addEventListener('click',()=>{
 if(!valid||!armControls.valid||!motorControls.valid||!headControls.valid){toast('Correct the highlighted parameter values before changing tabs.');return;}
 activeTab=b.dataset.tab as Tab;document.querySelectorAll('[data-tab]').forEach(t=>t.setAttribute('aria-selected',String(t===b)));renderFields();$('.panel-scroll').scrollTop=0;
}));
$('.tabs').addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const tabs=Array.from(document.querySelectorAll<HTMLButtonElement>('[data-tab]'));let i=tabs.indexOf(document.activeElement as HTMLButtonElement);i=e.key==='Home'?0:e.key==='End'?tabs.length-1:(i+(e.key==='ArrowRight'?1:tabs.length-1))%tabs.length;tabs[i].click();tabs[i].focus();});
$('#arm-shortcut').addEventListener('click',()=>{$('#tab-Limbs').click();if(activeTab==='Limbs')$('#arm-controls').scrollIntoView({block:'nearest'});});
document.querySelectorAll<HTMLButtonElement>('[data-view]').forEach(b=>b.addEventListener('click',()=>{if(!model)return;viewer.setView(b.dataset.view as View);document.querySelectorAll('[data-view]').forEach(v=>v.setAttribute('aria-pressed',String(v===b)))}));
function setVisibility(key:string,value:boolean){visibility[key]=value;const input=document.querySelector<HTMLInputElement>(`#show-${key}`);if(input)input.checked=value;viewer?.toggle(key,value);if(key==='cover')$('#cover-quick').setAttribute('aria-pressed',String(value));if(model)$('#count').textContent=`${viewer.visibleCount} / ${model.meshes.length} components`;}
for(const key of Object.keys(visibility).filter(k=>!k.startsWith('appearance_')))$<HTMLInputElement>(`#show-${key}`).addEventListener('change',e=>setVisibility(key,(e.target as HTMLInputElement).checked));
$('#cover-quick').addEventListener('click',()=>setVisibility('cover',!visibility.cover));
$('#fit').addEventListener('click',()=>viewer?.fit());
$('#reset').addEventListener('click',()=>{params=baseDefaults(baseVersion);valid=true;motorControls.load(defaultMotors());headControls.load(neutralHead(),false);armControls.load(neutralLimbs(),fixedModes());$('#validation').hidden=true;$('#save').toggleAttribute('disabled',!model);renderFields();update();viewer?.fit();toast('Dimensions, poses and motor choices reset.');});
$('#save').addEventListener('click',()=>{if(!model||!valid||!armControls.valid||!motorControls.valid||!headControls.valid)return;const data={version:1,baseVersion,appearanceVisibility:visibility,source:model.metadata.source,sourceSha256:model.metadata.sha256,parameters:params,limbs:{pose:armControls.pose,movable:armControls.movable},head:{pose:headControls.pose,movable:headControls.movable},motors:motorControls.state};const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));download(url,'SophiRobot-configuration.json');setTimeout(()=>URL.revokeObjectURL(url),1000);toast('Configuration, limb poses and motor selections saved as JSON.');});
$('#import').addEventListener('click',()=>$<HTMLInputElement>('#file-input').click());
$('#file-input').addEventListener('change',async()=>{const input=$<HTMLInputElement>('#file-input');const file=input.files?.[0];if(!file||!model)return;try{if(file.size>100000)throw new Error('Configuration file is too large. Use a saved parameter JSON file.');const data=JSON.parse(await file.text()),targetBase=configurationBase(data),nextParams=parseConfig({...data,baseVersion:targetBase},platforms[targetBase].sha256),arm=parseLimbConfig(data.limbs),motors=parseMotors(data.motors),head=parseHeadConfig(data.head);if(targetBase!==baseVersion)await switchBase(targetBase,nextParams);motorControls.load(motors);headControls.load(head.pose,head.movable);params=nextParams;for(const key of Object.keys(appearanceLabels)){if(typeof data.appearanceVisibility?.[key]==='boolean')setVisibility(key,data.appearanceVisibility[key]);}valid=true;armControls.load(arm.pose,arm.movable);$('#validation').hidden=true;$('#save').removeAttribute('disabled');renderFields();update();viewer.fit();toast('Configuration, limb poses and motor selections loaded.');}catch(e){toast(e instanceof Error?e.message:'Unable to load configuration.');}input.value='';});
$('#measure').addEventListener('click',()=>{if(!model)return;const state=$('#measure').getAttribute('aria-pressed')!=='true';$('#measure').setAttribute('aria-pressed',String(state));$('#measurement').hidden=!state;viewer.measure(state);});
$('#snapshot').addEventListener('click',()=>{if(model){download(viewer.screenshot(),'SophiRobot-preview.png');toast('Viewport image saved.');}});
let stepWorker:Worker|undefined,stepUrl:string|undefined;
const finishStep=()=>{stepWorker?.terminate();stepWorker=undefined;$('#download-step').removeAttribute('disabled');$('#cancel-step').hidden=true;};
$('#download-step').addEventListener('click',()=>{
 if(!model||!valid||!armControls.valid||!motorControls.valid||!headControls.valid){toast('Load the model and correct invalid values before exporting.');return;}
 if(stepWorker)return;
 if(stepUrl){URL.revokeObjectURL(stepUrl);stepUrl=undefined;}$('#step-file').hidden=true;
 $('#download-step').setAttribute('disabled','');$('#cancel-step').hidden=false;$('#step-progress').hidden=false;$('#step-progress').textContent='Preparing STEP from the current model…';
 try{
  stepWorker=new Worker(new URL('./step-worker.ts',import.meta.url),{type:'module'});
  stepWorker.onmessage=event=>{
   const data=event.data;
   if(data.type==='progress')$('#step-progress').textContent=`Creating STEP: ${Math.round(data.done/data.total*100)}% (${data.done}/${data.total} parts)`;
   else if(data.type==='complete'){
    stepUrl=URL.createObjectURL(data.blob);const link=$<HTMLAnchorElement>('#step-file');link.href=stepUrl;link.hidden=false;
    $('#step-progress').textContent=`STEP ready · ${data.bodyCount} parts · ${(data.blob.size/1048576).toFixed(1)} MB. Faceted surfaces; large CAD imports may take time.`;
    finishStep();link.click();
   }else{finishStep();$('#step-progress').textContent=data.message||'STEP export failed.';}
  };
  stepWorker.onerror=()=>{finishStep();$('#step-progress').textContent='STEP export failed. Reload and try again, or use the Fusion export.';};
  const config={version:1,baseVersion,sourceSha256:model.metadata.sha256,parameters:params,limbs:{pose:armControls.pose,movable:armControls.movable},head:{pose:headControls.pose,movable:headControls.movable}};
  stepWorker.postMessage({modelUrl:new URL(`${import.meta.env.BASE_URL}${platforms[baseVersion].url}`,location.href).href,config,cover:visibility.cover,appearance:visibility});
 }catch(error){finishStep();$('#step-progress').textContent=error instanceof Error?error.message:'Unable to start STEP export.';}
});
$('#cancel-step').addEventListener('click',()=>{finishStep();$('#step-progress').textContent='Export cancelled.';});
$('#fusion-export').addEventListener('click',()=>{
 if(!model||!valid||!armControls.valid||!motorControls.valid||!headControls.valid){toast('Load the model and correct invalid values before exporting.');return;}
 document.querySelectorAll<HTMLAnchorElement>('#fusion-dialog a').forEach(a=>{if(a.href.includes('SophiRobot-Fusion-Export'))a.href=`${import.meta.env.BASE_URL}${baseVersion==='old'?'fusion-old':'fusion'}/SophiRobot-Fusion-Export.zip`;else if(a.href.endsWith('/README.md'))a.href=`${import.meta.env.BASE_URL}${baseVersion==='old'?'fusion-old':'fusion'}/README.md`;});$('#fusion-result').textContent='';$<HTMLDialogElement>('#fusion-dialog').showModal();
});
$('#close-fusion').addEventListener('click',()=>$<HTMLDialogElement>('#fusion-dialog').close());
$('#fusion-dialog').addEventListener('click',e=>{if(e.target===$('#fusion-dialog'))$<HTMLDialogElement>('#fusion-dialog').close();});
$('#download-fusion').addEventListener('click',()=>{
 try{
  if(!model||!valid||!armControls.valid||!motorControls.valid||!headControls.valid)throw new Error('Correct invalid values before exporting.');
  const config={version:1,baseVersion,appearanceVisibility:visibility,source:model.metadata.source,sourceSha256:model.metadata.sha256,parameters:params,limbs:{pose:armControls.pose,movable:armControls.movable},head:{pose:headControls.pose,movable:headControls.movable},motors:motorControls.state};
  const request=createFusionRequest(config,model.metadata.sha256,$<HTMLSelectElement>('#fusion-pose').value as 'fusion'|'website');
  const url=URL.createObjectURL(new Blob([JSON.stringify(request,null,2)],{type:'application/json'}));download(url,'SophiRobot-fusion-request.json');setTimeout(()=>URL.revokeObjectURL(url),1000);
  $('#fusion-result').textContent='Request downloaded. Run the companion script in Fusion to create the STEP file.';
 }catch(error){$('#fusion-result').textContent=error instanceof Error?error.message:'Unable to prepare the export request.';}
});
$('#source').addEventListener('click',()=>{if(model)$<HTMLDialogElement>('#source-dialog').showModal();});
$('#close-dialog').addEventListener('click',()=>$<HTMLDialogElement>('#source-dialog').close());
$('#source-dialog').addEventListener('click',e=>{if(e.target===$('#source-dialog'))$<HTMLDialogElement>('#source-dialog').close();});
async function switchBase(next:BaseVersion,imported?:Params){
 if(switchingBase)return;
 if(!model)throw new Error('Loading base model…');
 if(!valid||!armControls.valid||!headControls.valid||!motorControls.valid)throw new Error('Correct invalid values before switching the base.');
 const nextParams=imported||withBaseParameters(params,next,baseSettings[next]);
 const errors=validate(nextParams,next);if(errors.length)throw new Error(errors.join(' '));
 switchingBase=true;walkControls.stop();finishStep();$('#step-file').hidden=true;$('#step-progress').hidden=true;
 if(stepUrl){URL.revokeObjectURL(stepUrl);stepUrl=undefined;}
 $('#base-loading').hidden=false;$('.sidebar').inert=true;$('.header-actions').inert=true;
 try{
  let nextModel=modelCache.get(next);
  if(!nextModel){const response=await fetch(`${import.meta.env.BASE_URL}${platforms[next].url}`);if(!response.ok)throw new Error('Unable to load base model.');nextModel=await response.json() as Model;if(nextModel.metadata.sha256!==platforms[next].sha256)throw new Error('Base model source mismatch.');modelCache.set(next,nextModel);}
  baseSettings[baseVersion]={...params};viewer.load(nextModel,nextParams);model=nextModel;baseVersion=next;params=nextParams;
  viewer.setPose(armControls.pose);viewer.setHeadPose(headControls.pose);
  for(const key of Object.keys(visibility))viewer.toggle(key,visibility[key]);
  try{localStorage.setItem('sophi-base-version',baseVersion);}catch{}
  renderFields();update();sourceContent();updateBaseSource();viewer.fit();
 }finally{switchingBase=false;$('#base-loading').hidden=true;$('.sidebar').inert=false;$('.header-actions').inert=false;$<HTMLSelectElement>('#base-version').value=baseVersion;}
}
function updateBaseSource(){
 $<HTMLSelectElement>('#base-version').value=baseVersion;$('.source-filename').textContent=model.metadata.source;
}
$('#base-version').addEventListener('change',async()=>{const next=$<HTMLSelectElement>('#base-version').value as BaseVersion;try{if(next!==baseVersion)await switchBase(next);}catch(e){$<HTMLSelectElement>('#base-version').value=baseVersion;toast(e instanceof Error?e.message:'Unable to load base model.');}});
renderFields();
$('#save').setAttribute('disabled','');
$<HTMLSelectElement>('#base-version').disabled=true;
async function boot(){
 try{
  viewer=new Viewer($('#canvas'));viewer.onSelect=(name,size)=>{const el=$('#selection');el.hidden=!name;el.replaceChildren();if(name){const strong=document.createElement('strong');strong.textContent=name;const small=document.createElement('span');small.textContent=`${size.map(fmt).join(' × ')} mm · X / Y / Z`;el.append(strong,small);}};
  viewer.onMeasure=text=>{$('#measurement').textContent=text;};
  const response=await fetch(`${import.meta.env.BASE_URL}${platforms[baseVersion].url}`);if(!response.ok)throw new Error(`Model asset unavailable (HTTP ${response.status}).`);model=await response.json();modelCache.set(baseVersion,model);viewer.load(model,params);updateBaseSource();for(const key of Object.keys(visibility))viewer.toggle(key,visibility[key]);update();sourceContent();$('#loading').hidden=true;$<HTMLSelectElement>('#base-version').disabled=false;$('#save').toggleAttribute('disabled',!valid||!armControls.valid||!motorControls.valid||!headControls.valid);
 }catch(error){$('#loading').replaceChildren();const title=document.createElement('h3');title.textContent='Unable to load the 3D assembly';const detail=document.createElement('p');detail.textContent=error instanceof Error?error.message:'Unknown loading error.';const help=document.createElement('p');help.textContent='Use Launch Website.cmd and a browser with WebGL enabled, then reload.';$('#loading').append(title,detail,help);$('#status').textContent='Model unavailable';$('#status-dot').classList.add('warning');}
}
boot();

installLanguageSelector();

