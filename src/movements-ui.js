const main=document.querySelector('#main');

function markScreen(){
  if(!main)return;
  const firstEyebrow=main.querySelector('.eyebrow')?.textContent?.trim()||'';
  main.classList.toggle('screen-movements',firstEyebrow.includes('Parte 3 · Movimientos'));
}

if(main){
  const observer=new MutationObserver(markScreen);
  observer.observe(main,{childList:true,subtree:true,characterData:true});
  markScreen();
}
