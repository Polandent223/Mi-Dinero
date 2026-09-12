import {get} from './db.js';
import {runIntegrityCheck} from './integrity.js';

const main=document.querySelector('#main');
const nav=document.querySelector('#bottomNav');
let busy=false;

function isSettings(){
  const active=nav?.querySelector('.nav-item.active');
  return active?.dataset.route==='settings'||main?.classList.contains('screen-settings');
}
function fmtDate(v){try{return new Intl.DateTimeFormat('es-VE',{dateStyle:'medium',timeStyle:'short'}).format(new Date(v))}catch{return '—'}}
function statusCopy(r){
  if(!r)return {title:'Aún no verificado',text:'La app revisará automáticamente la coherencia de tus datos.',kind:'muted'};
  if(r.critical>0)return {title:'Revisión necesaria',text:`Se detectaron ${r.critical} problema${r.critical===1?'':'s'} crítico${r.critical===1?'':'s'} y ${r.warning} advertencia${r.warning===1?'':'s'}.`,kind:'danger-soft'};
  if(r.warning>0)return {title:'Hay advertencias',text:`No hay problemas críticos, pero existen ${r.warning} advertencia${r.warning===1?'':'s'} para revisar.`,kind:'warn'};
  return {title:'Datos coherentes',text:r.info?`Sin problemas críticos ni advertencias. Hay ${r.info} nota${r.info===1?'':'s'} informativa${r.info===1?'':'s'}.`:'No se detectaron problemas de integridad.',kind:'ok'};
}

async function renderCard(){
  if(!main||!isSettings())return;
  const existing=main.querySelector('#integrityStatusCard');
  const settings=await get('settings','main');
  if(!isSettings())return;
  const r=settings?.integrityReport||null;
  const s=statusCopy(r);
  const html=`<section class="card" id="integrityStatusCard">
    <div class="row between"><div><div class="eyebrow">Seguridad de datos</div><h3>Integridad local</h3></div><span class="pill">${r?.ok?'OK':'Revisión'}</span></div>
    <div class="alert ${s.kind}"><strong>${s.title}</strong><div class="small">${s.text}</div></div>
    <div class="small muted">${r?.checkedAt?`Última revisión: ${fmtDate(r.checkedAt)}`:'Todavía no hay una revisión registrada.'}</div>
    ${r?`<div class="grid three"><div class="stat"><div class="small muted">Críticos</div><div class="value">${r.critical||0}</div></div><div class="stat"><div class="small muted">Advertencias</div><div class="value">${r.warning||0}</div></div><div class="stat"><div class="small muted">Notas</div><div class="value">${r.info||0}</div></div></div>`:''}
    <button class="btn secondary" id="runIntegrityNow" type="button" ${busy?'disabled':''}>${busy?'Revisando…':'Revisar ahora'}</button>
  </section>`;
  if(existing)existing.outerHTML=html; else main.insertAdjacentHTML('beforeend',html);
  document.querySelector('#runIntegrityNow')?.addEventListener('click',async()=>{
    if(busy)return;busy=true;await renderCard();
    try{await runIntegrityCheck();}catch(err){console.warn('Integrity check failed',err)}finally{busy=false;await renderCard()}
  },{once:true});
}

if(main){
  new MutationObserver(()=>{if(isSettings())setTimeout(renderCard,30)}).observe(main,{childList:true,subtree:false});
  if(nav)new MutationObserver(()=>{if(isSettings())setTimeout(renderCard,30)}).observe(nav,{attributes:true,subtree:true,attributeFilter:['class']});
  document.addEventListener('click',()=>{if(isSettings())setTimeout(renderCard,50)},{passive:true});
  setTimeout(renderCard,200);
}
