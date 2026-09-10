(()=>{
  const byId=id=>document.getElementById(id);
  const safeMessage=(title,text)=>{
    const main=byId('main'),badge=byId('syncBadge');
    if(badge){badge.textContent='Requiere atención';badge.className='sync-badge warn'}
    if(!main)return;
    main.innerHTML=`<section class="card hero"><div class="eyebrow">Mi Dinero</div><h2>${title}</h2><p class="muted">${text}</p><div class="row wrap"><button class="btn" id="guardReload" type="button">Volver a intentar</button></div></section>`;
    byId('guardReload')?.addEventListener('click',()=>location.reload());
  };

  if(location.protocol==='file:'){
    window.__MI_DINERO_UNSUPPORTED_FILE__=true;
    window.addEventListener('DOMContentLoaded',()=>safeMessage('Ábreme desde GitHub Pages','Esta aplicación necesita HTTPS o localhost. No abras index.html directamente desde una carpeta o un ZIP. Usa tu enlace de GitHub Pages para conservar todas las funciones offline y de seguridad.'));
    return;
  }

  let failed=false;
  const markFailure=()=>{failed=true};
  window.addEventListener('error',markFailure,true);
  window.addEventListener('unhandledrejection',markFailure);
  window.addEventListener('DOMContentLoaded',()=>{
    setTimeout(()=>{
      const badge=byId('syncBadge'),main=byId('main');
      const stillStarting=badge?.textContent?.includes('Iniciando');
      if((failed||stillStarting)&&(!main?.textContent?.trim()||stillStarting)){
        safeMessage('No pude iniciar correctamente','Tus datos locales no se borraron. Recarga la página. Si el problema continúa, cierra y vuelve a abrir Mi Dinero desde GitHub Pages.');
      }
    },6000);
  });
})();
