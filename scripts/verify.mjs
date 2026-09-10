import fs from 'node:fs';
import assert from 'node:assert/strict';
import {netWorth,portfolioSummary,investmentReadiness} from '../src/portfolio.js';

const required=['index.html','styles.css','manifest.webmanifest','sw.js','src/app.js','src/db.js','src/security.js','src/sync.js','src/portfolio.js','src/wealth-ui.js','src/startup-guard.js','src/integrity.js'];
for(const file of required) assert.ok(fs.existsSync(file),`Falta ${file}`);

const html=fs.readFileSync('index.html','utf8');
for(const src of ['src/startup-guard.js','src/app.js','src/wealth-ui.js','src/integrity.js']) assert.ok(html.includes(src),`index.html no carga ${src}`);

const sw=fs.readFileSync('sw.js','utf8');
for(const file of required.filter(x=>x!=='sw.js')) assert.ok(sw.includes(`./${file}`),`Service Worker no precarga ${file}`);

const nw=netWorth({assets:[{value:1000}],reserveCurrent:500,investments:[{currentValue:750}],liabilities:[{balance:250}],debts:[{balance:300}]});
assert.equal(nw.assetTotal,2250);
assert.equal(nw.liabilityTotal,550);
assert.equal(nw.net,1700);

const ps=portfolioSummary([{contributed:500,currentValue:600,function:'Crecer'},{contributed:400,currentValue:350,function:'Proteger'}]);
assert.equal(ps.cost,900);
assert.equal(ps.total,950);
assert.equal(ps.gain,50);

const ready=investmentReadiness({reserveCurrent:3000,reserveMonthlyEssential:1000,activeDebts:[],expensiveDebtRate:null});
assert.equal(ready.reserveMonths,3);
assert.equal(ready.checks[0].ok,true);
assert.equal(ready.checks[1].ok,true);
assert.equal(ready.ready,true);

const manualDebtReview=investmentReadiness({reserveCurrent:3000,reserveMonthlyEssential:1000,activeDebts:[{balance:500,annualRate:10}],expensiveDebtRate:null});
assert.equal(manualDebtReview.checks[1].ok,null);
assert.equal(manualDebtReview.ready,false);

console.log('Mi Dinero: verificación básica OK');
