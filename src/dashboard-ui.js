import {get,all} from './db.js';
import {netWorth,portfolioSummary} from './portfolio.js';

const main=document.querySelector('#main');
const PROFILE_ID='owner',SETTINGS_ID='main',DIAGNOSIS_ID='current';
let rendering=false;

function num(v){const n=Number(v);return Number.isFinite(n)?n:0}
function fmt(v,c='USD'){try{return new Intl.NumberFormat('es-VE',{style:'currency',currency:c,maximumFractionDigits:2}).format(num(v))}catch{return `${num(v).toFixed(2)} ${c}`}}
function esc(s=''){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[c]))}
function monthKey(v){const d=new Date(`${v}T12:00:00`);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`}
function todayISO(){const d=new Date();d.setMinutes(d.getMinutes()-d.getTimezoneOffset());return d.toISOString().slice(0,10)}
function isHome(){return !!document.querySelector('#bottomNav .nav-item.active[data-route="home"]')}
function diagnosisAvailable(d){if(!d?.completed)return null;const income=d.incomeType==='variable'?(()=>{const a=(d.variableMonths||[]).map(Number).filter(x=>Number.isFinite(x)&&x>0).sort((a,b)=>a-b).slice(0,3);return a.length===3?a.reduce((s,x)=>s+x,0)/3:0})():num(d.grossMonthly);const net=Math.max(0,income-num(d.taxes));const work=['transport','lunch','phone','tools','workOther'].reduce((a,k)=>a+num(d[k]),0);const adjusted=Math.max(0,net-work);const commitments=['housing','utilities','debtPayments','healthInsurance','education','commitmentOther'].reduce((a,k)=>a+num(d[k]),0);return adjusted-commitments}

async function buildDashboard(){
  if(!isHome()||rendering)return;
  rendering=true;
  try{
    const [profile,settings,diagnosis,transactions,reserve,goals,debts,assets,liabilities,investments]=await Promise.all([
      get('profile',PROFILE_ID),get('settings',SETTINGS_ID),get('diagnosis',DIAGNOSIS_ID),all('transactions'),get('reserves','emergency'),all('goals'),all('debts'),all('assets'),all('liabilities'),all('investments')
    ]);
    if(!profile||!isHome())return;
    const currency=settings?.currency||'USD';
    const currentMonth=monthKey(todayISO());
    const activeTx=transactions.filter(x=>!x.deletedAt&&x.date&&monthKey(x.date)===currentMonth);
    const income=activeTx.filter(x=>x.type==='income').reduce((a,x)=>a+num(x.amount),0);
    const expense=activeTx.filter(x=>x.type==='expense').reduce((a,x)=>a+num(x.amount),0);
    const activeDebts=debts.filter(x=>!x.deletedAt&&num(x.balance)>0);
    const activeGoals=goals.filter(x=>!x.deletedAt);
    const activeInvestments=investments.filter(x=>!x.deletedAt);
    const reserveCurrent=num(reserve?.currentAmount??reserve?.current);
    const reserveTarget=num(reserve?.monthlyEssential)*num(reserve?.targetMonths);
    const goalCurrent=activeGoals.reduce((a,x)=>a+num(x.currentAmount??x.current),0);
    const goalTarget=activeGoals.reduce((a,x)=>a+num(x.targetAmount??x.target),0);
    const debtTotal=activeDebts.reduce((a,x)=>a+num(x.balance),0);
    const portfolio=portfolioSummary(activeInvestments);
    const worth=netWorth({assets:assets.filter(x=>!x.deletedAt),liabilities:liabilities.filter(x=>!x.deletedAt),reserveCurrent,investments:activeInvestments,debts:activeDebts});
    const available=diagnosisAvailable(diagnosis);
    const savingsCurrent=reserveCurrent+goalCurrent;
    const savingsTarget=reserveTarget+goalTarget;
    const savingsPct=savingsTarget>0?Math.min(100,Math.round(savingsCurrent/savingsTarget*100)):0;
    const recent=[...transactions].filter(x=>!x.deletedAt).sort((a,b)=>`${b.date||''}${b.createdAt||''}`.localeCompare(`${a.date||''}${a.createdAt||''}`)).slice(0,4);

    main.innerHTML=`
      <section class="dashboard-welcome"><div><div class="eyebrow">Hola, ${esc(profile.name)}</div><h2>Así va tu dinero</h2><p class="muted">Una vista simple de lo que tienes, lo que gastas y lo que estás construyendo.</p></div></section>
      <section class="card dashboard-networth">
        <div class="row between"><div><div class="dashboard-label">Patrimonio neto</div><div class="dashboard-balance ${worth.net<0?'negative':''}">${fmt(worth.net,currency)}</div></div><button class="dashboard-eye" id="wealthNavShortcut" aria-label="Ver patrimonio">◈</button></div>
        <div class="dashboard-net-meta"><span>Activos ${fmt(worth.assetTotal,currency)}</span><span>Pasivos ${fmt(worth.liabilityTotal,currency)}</span></div>
      </section>
      <section class="dashboard-pair">
        <button class="dashboard-mini income-card" data-route="transactions"><span class="dashboard-icon">↑</span><span><small>Ingresos del mes</small><strong>${fmt(income,currency)}</strong></span></button>
        <button class="dashboard-mini expense-card" data-route="transactions"><span class="dashboard-icon">↓</span><span><small>Gastos del mes</small><strong>${fmt(expense,currency)}</strong></span></button>
      </section>
      ${available!==null?`<section class="card dashboard-available"><div class="row between"><div><div class="dashboard-label">Disponible real</div><strong>${fmt(available,currency)}</strong></div><button class="text-action" data-route="diagnosis">Revisar</button></div><div class="small muted">Tu base real para tomar decisiones este mes.</div></section>`:`<section class="card dashboard-callout"><div><strong>Completa tu diagnóstico financiero</strong><div class="small muted">Así la app podrá decirte cuánto tienes realmente disponible.</div></div><button class="btn inline" data-route="diagnosis">Empezar</button></section>`}
      <section class="card dashboard-progress-card" data-route="reserve"><div class="row between"><div><div class="dashboard-label">Ahorro y metas</div><strong>${fmt(savingsCurrent,currency)}${savingsTarget?` <small class="muted">de ${fmt(savingsTarget,currency)}</small>`:''}</strong></div><span class="dashboard-arrow">›</span></div><div class="dashboard-progress"><span style="width:${savingsPct}%"></span></div><div class="small muted">${savingsTarget?`${savingsPct}% del objetivo combinado`:'Crea tu reserva o una meta para empezar'}</div></section>
      <section class="dashboard-pair">
        <button class="dashboard-mini debt-card" data-route="debts"><span class="dashboard-icon">▤</span><span><small>Deudas</small><strong>${fmt(debtTotal,currency)}</strong><em>${activeDebts.length} activa${activeDebts.length===1?'':'s'}</em></span></button>
        <button class="dashboard-mini investment-card" id="wealthNavInvestment"><span class="dashboard-icon">↗</span><span><small>Inversiones</small><strong>${fmt(portfolio.total,currency)}</strong><em>${activeInvestments.length} posición${activeInvestments.length===1?'':'es'}</em></span></button>
      </section>
      <section class="dashboard-section-head"><h3>Acciones rápidas</h3></section>
      <section class="dashboard-actions"><button data-route="transactions"><span>＋</span><small>Movimiento</small></button><button data-route="reserve"><span>◎</span><small>Ahorrar</small></button><button data-route="debts"><span>▤</span><small>Deuda</small></button><button id="wealthNavAction"><span>◈</span><small>Patrimonio</small></button></section>
      ${recent.length?`<section class="card dashboard-recent"><div class="row between"><h3>Últimos movimientos</h3><button class="text-action" data-route="transactions">Ver todos</button></div>${recent.map(x=>`<div class="dashboard-tx"><span class="tx-dot ${x.type}">${x.type==='income'?'↑':'↓'}</span><span class="tx-copy"><strong>${esc(x.note||x.category||'Movimiento')}</strong><small>${esc(x.category||'')}</small></span><strong class="${x.type==='income'?'income-money':'expense-money'}">${x.type==='income'?'+':'-'}${fmt(Math.abs(num(x.amount)),currency)}</strong></div>`).join('')}</section>`:''}
    `;
    main.dataset.dashboardUi='1';
    ['wealthNavShortcut','wealthNavInvestment','wealthNavAction'].forEach(id=>document.getElementById(id)?.addEventListener('click',()=>document.getElementById('wealthNav')?.click()));
  } finally {rendering=false;}
}

const observer=new MutationObserver(()=>{if(!isHome())return;if(main.dataset.dashboardUi==='1')return;clearTimeout(window.__miDineroDashboardTimer);window.__miDineroDashboardTimer=setTimeout(buildDashboard,20);});
observer.observe(main,{childList:true,subtree:false});
observer.observe(document.querySelector('#bottomNav'),{attributes:true,subtree:true,attributeFilter:['class']});
setTimeout(buildDashboard,80);
