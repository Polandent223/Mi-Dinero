const main=document.querySelector('#main');
const nav=document.querySelector('#bottomNav');

function activeRoute(){
  const active=nav?.querySelector('.nav-item.active');
  if(!active)return '';
  if(active.id==='wealthNav')return 'wealth';
  return active.dataset.route||'';
}

function mark(){
  if(!main)return;
  const text=(main.querySelector('.eyebrow')?.textContent||main.querySelector('h2')?.textContent||'').toLowerCase();
  const route=activeRoute();
  main.classList.toggle('screen-budget',route==='budget'||text.includes('presupuesto'));
  main.classList.toggle('screen-reserve',route==='reserve'||text.includes('reserva'));
  main.classList.toggle('screen-debts',route==='debts'||text.includes('deudas'));
  main.classList.toggle('screen-settings',route==='settings'||text.includes('ajustes'));
  main.classList.toggle('screen-wealth',route==='wealth'||text.includes('patrimonio e inversiones'));
}

if(main){
  new MutationObserver(mark).observe(main,{childList:true,subtree:true,characterData:true});
  if(nav)new MutationObserver(mark).observe(nav,{attributes:true,subtree:true,attributeFilter:['class']});
  document.addEventListener('click',()=>setTimeout(mark,0),{passive:true});
  mark();
}
