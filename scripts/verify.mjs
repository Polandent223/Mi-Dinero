import fs from 'node:fs';
import assert from 'node:assert/strict';
import {netWorth,portfolioSummary,investmentReadiness} from '../src/portfolio.js';

const required=[
  'index.html','styles.css','dashboard.css','movements.css','sections.css','manifest.webmanifest','sw.js',
  'src/app.js','src/db.js','src/security.js','src/sync.js','src/portfolio.js','src/wealth-ui.js',
  'src/dashboard-ui.js','src/movements-ui.js','src/sections-ui.js','src/startup-guard.js','src/reset-guard.js','src/integrity.js','src/integrity-ui.js'
];
for(const file of required) assert.ok(fs.existsSync(file),`Falta ${file}`);

const html=fs.readFileSync('index.html','utf8');
for(const asset of ['dashboard.css','movements.css','sections.css','src/startup-guard.js','src/reset-guard.js','src/app.js','src/wealth-ui.js','src/dashboard-ui.js','src/movements-ui.js','src/sections-ui.js','src/integrity.js','src/integrity-ui.js']){
  assert.ok(html.includes(asset),`index.html no carga ${asset}`);
}

const sw=fs.readFileSync('sw.js','utf8');
for(const file of required.filter(x=>x!=='sw.js')) assert.ok(sw.includes(`./${file}`),`Service Worker no precarga ${file}`);
assert.ok(sw.includes("event.request.mode==='navigate'"),'Service Worker debe limitar el fallback HTML a navegaciones');
assert.ok(sw.includes('status:503'),'Service Worker debe responder 503 si falta un recurso offline');
assert.ok(sw.includes("mi-dinero-redesign-v9"),'La PWA debe distribuir la versión con restablecimiento seguro');

const db=fs.readFileSync('src/db.js','utf8');
assert.ok(db.includes("createLocalSnapshot('before_restore')"),'La restauración debe crear snapshot previo');
assert.ok(db.includes('ids.has(item.id)'),'La restauración debe rechazar IDs duplicados');
assert.ok(db.includes('crypto.randomUUID'),'Los snapshots deben evitar colisiones de identificador');
assert.ok(db.includes('export async function resetAllSafely'),'Debe existir un restablecimiento protegido');
assert.ok(db.includes("STORES.filter(s=>s!=='backups')"),'El restablecimiento debe preservar la bóveda de snapshots');
assert.ok(db.includes("get('backups',snapshot.id)"),'El restablecimiento debe verificar la copia de recuperación');

const resetGuard=fs.readFileSync('src/reset-guard.js','utf8');
assert.ok(resetGuard.includes("button[data-action=\"reset-all\"]"),'El guard debe interceptar el borrado total');
assert.ok(resetGuard.includes('stopImmediatePropagation'),'El borrado antiguo no debe ejecutarse después del guard');
assert.ok(resetGuard.includes('resetAllSafely'),'El guard debe usar el restablecimiento protegido');

const security=fs.readFileSync('src/security.js','utf8');
assert.ok(security.includes('BACKUP_MIN_ITERATIONS=100000'),'El respaldo debe tener un mínimo de iteraciones KDF');
assert.ok(security.includes('BACKUP_MAX_ITERATIONS=1000000'),'El respaldo debe limitar iteraciones KDF para evitar abuso');
assert.ok(security.includes('MAX_BACKUP_TEXT_SIZE=50_000_000'),'La importación cifrada debe limitar tamaños anómalos');
assert.ok(security.includes("pkg.version!==1"),'La restauración cifrada debe validar la versión del paquete');
assert.ok(security.includes("pkg.kdf!=='PBKDF2-SHA256'"),'La restauración cifrada debe validar el KDF');
assert.ok(security.includes('salt.length!==16'),'La restauración cifrada debe validar el salt');
assert.ok(security.includes('iv.length!==12'),'La restauración cifrada debe validar el IV');

const integrityUI=fs.readFileSync('src/integrity-ui.js','utf8');
assert.ok(integrityUI.includes('runIntegrityCheck'),'Ajustes debe permitir ejecutar una revisión de integridad');
assert.ok(integrityUI.includes('integrityReport'),'Ajustes debe mostrar el último informe de integridad');
assert.ok(integrityUI.includes('Revisar ahora'),'Ajustes debe exponer una acción visible de revisión');

const nw=netWorth({assets:[{value:1000}],reserveCurrent:500,investments:[{currentValue:750}],liabilities:[{balance:250}],debts:[{balance:300}]});
assert.equal(nw.assetTotal,2250);
assert.equal(nw.liabilityTotal,550);
assert.equal(nw.net,1700);

const ps=portfolioSummary([{contributed:500,currentValue:600,function:'Crecer'},{contributed:400,currentValue:350,function:'Proteger'}]);
assert.equal(ps.cost,900);
assert.equal(ps.total,950);
assert.equal(ps.gain,50);

const dashboard=fs.readFileSync('src/dashboard-ui.js','utf8');
assert.ok(dashboard.includes('worth.assetTotal'),'Dashboard debe mostrar assetTotal del motor de patrimonio');
assert.ok(dashboard.includes('worth.liabilityTotal'),'Dashboard debe mostrar liabilityTotal del motor de patrimonio');
assert.ok(dashboard.includes('portfolio.total'),'Dashboard debe mostrar total de cartera');
assert.ok(!dashboard.includes('worth.totalAssets'),'Dashboard no debe usar totalAssets inexistente');
assert.ok(!dashboard.includes('worth.totalLiabilities'),'Dashboard no debe usar totalLiabilities inexistente');
assert.ok(!dashboard.includes('portfolio.currentValue'),'Dashboard no debe usar currentValue inexistente en portfolioSummary');

const ready=investmentReadiness({reserveCurrent:3000,reserveMonthlyEssential:1000,activeDebts:[],expensiveDebtRate:null});
assert.equal(ready.reserveMonths,3);
assert.equal(ready.checks[0].ok,true);
assert.equal(ready.checks[1].ok,true);
assert.equal(ready.ready,true);

const manualDebtReview=investmentReadiness({reserveCurrent:3000,reserveMonthlyEssential:1000,activeDebts:[{balance:500,annualRate:10}],expensiveDebtRate:null});
assert.equal(manualDebtReview.checks[1].ok,null);
assert.equal(manualDebtReview.ready,false);

console.log('Mi Dinero: verificación estructural, offline, restauración, restablecimiento, seguridad, integridad y financiera OK');
