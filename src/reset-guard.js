import {resetAllSafely} from './db.js';

let resetting=false;

document.addEventListener('click',async event=>{
  const button=event.target.closest?.('button[data-action="reset-all"]');
  if(!button)return;
  event.preventDefault();
  event.stopImmediatePropagation();
  if(resetting)return;
  if(!confirm('¿Seguro? Se borrarán TODOS los datos activos de Mi Dinero en este dispositivo. Se conservará una copia local de recuperación.'))return;
  resetting=true;button.disabled=true;
  try{
    await resetAllSafely('antes de borrar todos los datos');
    location.reload();
  }catch(err){
    console.error('Safe reset failed',err);
    button.disabled=false;resetting=false;
    alert(err?.message||'No se pudo restablecer Mi Dinero. Tus datos no se borraron de forma intencional.');
  }
},true);
