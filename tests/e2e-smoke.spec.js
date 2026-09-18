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
