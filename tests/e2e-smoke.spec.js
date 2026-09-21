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
  const txForm=page.locator('#transactionForm');
  await expect(txForm).toBeVisible();
  const validity=await txForm.evaluate(form=>({
    valid:form.checkValidity(),
    invalid:[...form.elements].filter(el=>el.willValidate&&!el.checkValidity()).map(el=>({name:el.name,value:el.value,message:el.validationMessage}))
  }));
  expect(validity).toEqual({valid:true,invalid:[]});
  await txForm.locator('button[type="submit"]').click();

  await expect.poll(async()=>page.evaluate(async()=>{
    const db=await import('/src/db.js');
    const diagnosis=await db.get('diagnosis','current');
    const transactions=await db.all('transactions');
    return {
      gross:diagnosis?.calculated?.gross,
      available:diagnosis?.calculated?.available,
      movement:transactions.find(x=>x.note==='Compra prueba persistencia')?.amount
    };
  })).toEqual({gross:2500,available:2300,movement:75.5});

  await expect(page.locator('#main')).toContainText('Compra prueba persistencia');

  await page.reload();
  await expect(page.locator('#unlockForm')).toBeVisible();
  await page.waitForTimeout(250);
  await page.locator('#unlockForm input[name="pin"]').fill('2468');
  await page.locator('#unlockForm button[type="submit"]').click();
  await page.locator('#bottomNav [data-route="transactions"]').click();
  await expect(page.locator('#main')).toContainText('Compra prueba persistencia');
});


test('presupuesto: guardar límites mensuales y persistir tras recarga', async ({page})=>{
  await setup(page,'Perfil Presupuesto');

  await page.locator('[data-route="budget"]').click();
  const form=page.locator('#budgetForm');
  await expect(form).toBeVisible();
  const firstLimit=form.locator('input[name^="limit_"]').first();
  const limitName=await firstLimit.getAttribute('name');
  expect(limitName).toBeTruthy();
  await firstLimit.fill('350');
  await form.locator('button[type="submit"]').click();

  await expect.poll(async()=>page.evaluate(async(name)=>{
    const db=await import('/src/db.js');
    const rows=await db.all('budgets');
    if(!rows.length)return null;
    const key=name.replace('limit_','');
    return Number(rows[0]?.limits?.[key]);
  },limitName)).toBe(350);

  await page.reload();
  await page.locator('#unlockForm input[name="pin"]').fill('2468');
  await page.locator('#unlockForm button[type="submit"]').click();
  await page.locator('[data-route="budget"]').click();
  await expect(page.locator(`#budgetForm input[name="${limitName}"]`)).toHaveValue('350.00');
});


test('reserva: aporte enlazado y reversión conservan integridad', async ({page})=>{
  await setup(page,'Perfil Reserva');
  await page.locator('[data-route="reserve"]').click();
  const reserve=page.locator('#reserveForm');
  await expect(reserve).toBeVisible();
  await reserve.locator('input[name="monthlyEssential"]').fill('500');
  await reserve.locator('select[name="targetMonths"]').selectOption('3');
  await reserve.locator('input[name="currentAmount"]').fill('100');
  await reserve.locator('button[type="submit"]').click();
  page.once('dialog',d=>d.accept('50'));
  await page.locator('[data-action="add-reserve"]').click();
  const read=()=>page.evaluate(async()=>{const db=await import('/src/db.js');const r=await db.get('reserves','emergency');const cs=(await db.all('contributions')).filter(x=>!x.deletedAt&&x.destinationType==='reserve');const ts=(await db.all('transactions')).filter(x=>!x.deletedAt&&x.linkedContributionId);return {current:Number(r?.currentAmount),c:cs[0]||null,t:ts[0]||null}});
  await expect.poll(async()=>Number((await read()).current)).toBe(150);
  let s=await read(); expect(Number(s.c?.amount)).toBe(50); expect(Number(s.t?.amount)).toBe(50); expect(s.t?.linkedContributionId).toBe(s.c?.id);
  await page.locator('[data-action="undo-contribution"]').first().click();
  await expect.poll(async()=>Number((await read()).current)).toBe(100);
  s=await read(); expect(s.c).toBeNull(); expect(s.t).toBeNull();
});
