import {all,importAll} from './db.js';

const main=document.querySelector('#main');
let rendering=false;
let lastSetupForm=null;

function esc(s=''){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[c]))}
function dateLabel(v){try{return new Intl.DateTimeFormat('es-VE',{dateStyle:'medium',timeStyle:'short'}).format(new Date(v))}catch{return v||'—'}}

async function renderRecovery(){
  const setupForm=document.querySelector('#setupForm');
  if(!setupForm){lastSetupForm=null;document.querySelector('#localRecoveryCard')?.remove();return}
  if(rendering)return;
  const existing=document.querySelector('#localRecoveryCard');
  if(existing&&lastSetupForm===setupForm)return;

  rendering=true;
  try{
    const snapshots=(await all('backups')).filter(x=>x?.snapshot).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
    if(document.querySelector('#setupForm')!==setupForm)return;
    existing?.remove();
    if(!snapshots.length){lastSetupForm=setupForm;return}
    const card=document.createElement('section');
    card.id='localRecoveryCard';
    card.className='card';
    card.innerHTML=`<div class="eyebrow">Recuperación local</div><h3>Encontré una copia de tus datos</h3><p class="muted">Puedes recuperar una copia guardada en este dispositivo en vez de empezar desde cero.</p><label>Copia disponible</label><select id="localRecoverySelect">${snapshots.map(x=>`<option value="${esc(x.id)}">${dateLabel(x.createdAt)} · ${esc(x.reason||'copia automática')}</option>`).join('')}</select><button class="btn secondary" id="restoreLocalSnapshot" type="button">Recuperar mis datos</button><p class="small muted">La restauración valida la copia antes de reemplazar los datos activos.</p>`;
    setupForm.closest('.card')?.after(card);
    lastSetupForm=setupForm;
    card.querySelector('#restoreLocalSnapshot')?.addEventListener('click',async()=>{
      const id=card.querySelector('#localRecoverySelect')?.value;
      const selected=snapshots.find(x=>x.id===id);
      if(!selected?.snapshot)return;
      if(!confirm('¿Recuperar esta copia local? Los datos activos actuales serán reemplazados.'))return;
      const button=card.querySelector('#restoreLocalSnapshot');button.disabled=true;button.textContent='Recuperando…';
      try{await importAll(selected.snapshot);location.reload()}
      catch(err){button.disabled=false;button.textContent='Recuperar mis datos';alert(err?.message||'No se pudo recuperar la copia local.')}
    });
  } finally {rendering=false}
}

new MutationObserver(()=>setTimeout(renderRecovery,20)).observe(main,{childList:true});
setTimeout(renderRecovery,100);
