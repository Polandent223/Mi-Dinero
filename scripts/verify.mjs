import fs from 'node:fs';
import assert from 'node:assert/strict';
import {netWorth,portfolioSummary,investmentReadiness} from '../src/portfolio.js';

const required=[
  'index.html','styles.css','dashboard.css','movements.css','sections.css','manifest.webmanifest','sw.js',
  'src/app.js','src/db.js','src/security.js','src/sync.js','src/portfolio.js','src/wealth-ui.js',
  'src/dashboard-ui.js','src/movements-ui.js','src/sections-ui.js','src/startup-guard.js','src/integrity.js'
];
for(const file of required) assert.ok(fs.existsSync(file),`Falta ${file}`);

const html=fs.readFileSync('index.html','utf8');
for(const asset of ['dashboard.css','movements.css','sections.css','src/startup-guard.js','src/app.js','src/wealth-ui.js','src/dashboard-ui.js','src/movements-ui.js','src/sections-ui.js','src/integrity.js']){
  assert.ok(html.includes(asset),`index.html no carga ${asset}`);
}

const sw=fs.readFileSync('sw.js','utf8');
for(const file of required.filter(x=>x!=='sw.js')) assert.ok(sw.includes(`./${file}`),`Service Worker no precarga ${file}`);
assert.ok(sw.includes("event.request.mode==='navigate'"),'Service Worker debe limitar el fallback HTML a navegaciones');
assert.ok(sw.includes('status:503'),'Service Worker debe responder 503 si falta un recurso offline');

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

console.log('Mi Dinero: verificación estructural, offline y financiera OK');
