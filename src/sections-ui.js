const main=document.querySelector('#main');

function mark(){
  if(!main)return;
  const text=(main.querySelector('.eyebrow')?.textContent||main.querySelector('h2')?.textContent||'').toLowerCase();
  main.classList.toggle('screen-budget',text.includes('presupuesto'));
  main.classList.toggle('screen-reserve',text.includes('reserva'));
}

if(main){
  new MutationObserver(mark).observe(main,{childList:true,subtree:true,characterData:true});
  mark();
}
