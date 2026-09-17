const {test,expect}=require('@playwright/test');

test('flujo crítico: configurar, bloquear, entrar y recargar offline',async({page,context})=>{
  await page.goto('http://127.0.0.1:4173/');
  await expect(page.locator('#setupForm')).toBeVisible();
  await page.locator('#setupForm input[name="name"]').fill('Prueba E2E');
  await page.locator('#setupForm select[name="currency"]').selectOption('USD');
  await page.locator('#setupForm input[name="pin"]').fill('2468');
  await page.locator('#setupForm input[name="pin2"]').fill('2468');
  await page.locator('#setupForm button[type="submit"]').click();
  await expect(page.locator('#bottomNav')).toBeVisible();
  await expect(page.locator('#main')).toContainText('Prueba E2E');

  await page.reload();
  await expect(page.locator('#unlockForm')).toBeVisible();
  await page.locator('#unlockForm input[name="pin"]').fill('2468');
  await page.locator('#unlockForm button[type="submit"]').click();
  await expect(page.locator('#bottomNav')).toBeVisible();

  await page.waitForFunction(()=>navigator.serviceWorker?.controller||false);
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator('#unlockForm')).toBeVisible();
  await expect(page.locator('#syncBadge')).toContainText('Sin conexión');
});
