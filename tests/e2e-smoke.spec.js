const {test,expect}=require('@playwright/test');

async function setup(page,name='Prueba E2E'){
  await page.goto('http://127.0.0.1:4173/');
  await expect(page.locator('#setupForm')).toBeVisible();
  await page.locator('#setupForm input[name="name"]').fill(name);
  await page.locator('#setupForm select[name="currency"]').selectOption('USD');
  await page.locator('#setupForm input[name="pin"]').fill('2468');
  await page.locator('#setupForm input[name="pin2"]').fill('2468');
  await page.locator('#setupForm button[type="submit"]').click();
  await expect(page.locator('#bottomNav')).toBeVisible();
}

test('flujo crítico: configurar, bloquear, entrar y recargar offline',async({page,context})=>{
  await setup(page);
  await expect(page.locator('#main')).toContainText('Prueba E2E');

  await page.reload();
  await expect(page.locator('#unlockForm')).toBeVisible();
  await page.waitForTimeout(250);
  const pin=page.locator('#unlockForm input[name="pin"]');
  await expect(pin).toBeVisible();
  await pin.fill('2468');
  await page.locator('#unlockForm button[type="submit"]').click();
  await expect(page.locator('#bottomNav')).toBeVisible();

  await page.waitForFunction(()=>navigator.serviceWorker?.controller||false);
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator('#unlockForm')).toBeVisible();
  await expect(page.locator('#syncBadge')).toContainText('Sin conexión');
});

test('recuperación local: restablecer y recuperar el perfil desde snapshot',async({page})=>{
  await setup(page,'Perfil Recuperable');

  // Ejecuta la misma operación segura usada por el botón de restablecimiento.
  await page.evaluate(async()=>{
    const db=await import('/src/db.js');
    await db.resetAllSafely('prueba e2e recuperación');
  });
  await page.reload();

  await expect(page.locator('#setupForm')).toBeVisible();
  await expect(page.locator('#localRecoveryCard')).toBeVisible();
  await expect(page.locator('#localRecoveryCard')).toContainText('Encontré una copia de tus datos');

  page.once('dialog',dialog=>dialog.accept());
  await page.locator('#restoreLocalSnapshot').click();

  await expect(page.locator('#unlockForm')).toBeVisible();
  await page.waitForTimeout(250);
  await page.locator('#unlockForm input[name="pin"]').fill('2468');
  await page.locator('#unlockForm button[type="submit"]').click();
  await expect(page.locator('#bottomNav')).toBeVisible();
  await expect(page.locator('#main')).toContainText('Perfil Recuperable');
});


test('respaldo cifrado: exportar, descifrar y rechazar contraseña incorrecta',async({page})=>{
  await setup(page,'Perfil Cifrado');
  const result=await page.evaluate(async()=>{
    const db=await import('/src/db.js');
    const security=await import('/src/security.js');
    const original=await db.exportAll();
    const encrypted=await security.encryptBackup(original,'ClaveSegura-2468');
    const restored=await security.decryptBackup(encrypted,'ClaveSegura-2468');
    let wrongPasswordRejected=false;
    try{await security.decryptBackup(encrypted,'ClaveIncorrecta-9999')}
    catch{wrongPasswordRejected=true}
    return {
      format:JSON.parse(encrypted).format,
      profileName:restored.stores.profile?.find(x=>x.id==='owner')?.name,
      wrongPasswordRejected
    };
  });
  expect(result.format).toBe('MiDineroEncryptedBackup');
  expect(result.profileName).toBe('Perfil Cifrado');
  expect(result.wrongPasswordRejected).toBe(true);
});


test('finanzas esenciales: diagnóstico y movimiento persisten tras recarga',async({page})=>{
  await setup(page,'Finanzas E2E');

  await page.locator('button[data-route="diagnosis"]').first().click();
  await expect(page.locator('#diagnosisForm')).toBeVisible();
  await page.locator('#diagnosisForm input[name="grossMonthly"]').fill('2500');
  await page.locator('#diagnosisForm input[name="taxes"]').fill('200');
  await page.locator('#diagnosisForm button[type="submit"]').click();
  await expect(page.locator('#bottomNav')).toBeVisible();

  await page.locator('#bottomNav [data-route="transactions"]').click();
  await expect(page.locator('#transactionForm')).toBeVisible();
  await page.locator('#transactionForm input[name="amount"]').fill('75.50');
  await page.locator('#transactionForm input[name="note"]').fill('Compra prueba persistencia');
  await page.locator('#transactionForm button[type="submit"]').click();
  await expect(page.locator('#main')).toContainText('Compra prueba persistencia');

  const stored=await page.evaluate(async()=>{
    const db=await import('/src/db.js');
    const diagnosis=await db.get('diagnosis','current');
    const transactions=await db.all('transactions');
    return {
      gross:diagnosis?.calculated?.gross,
      available:diagnosis?.calculated?.available,
      movement:transactions.find(x=>x.note==='Compra prueba persistencia')?.amount
    };
  });
  expect(stored.gross).toBe(2500);
  expect(stored.available).toBe(2300);
  expect(stored.movement).toBe(75.5);

  await page.reload();
  await expect(page.locator('#unlockForm')).toBeVisible();
  await page.waitForTimeout(250);
  await page.locator('#unlockForm input[name="pin"]').fill('2468');
  await page.locator('#unlockForm button[type="submit"]').click();
  await page.locator('#bottomNav [data-route="transactions"]').click();
  await expect(page.locator('#main')).toContainText('Compra prueba persistencia');
});
