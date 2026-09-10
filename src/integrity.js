import {all,get,put} from './db.js';

const active=x=>x&&!x.deletedAt;
const finiteNonNegative=v=>Number.isFinite(Number(v))&&Number(v)>=0;

export async function runIntegrityCheck(){
  const [profile,settings,transactions,contributions,debtPayments,debts,goals,reserves,investments,investmentContributions]=await Promise.all([
    get('profile','owner'),get('settings','main'),all('transactions'),all('contributions'),all('debtPayments'),all('debts'),all('goals'),all('reserves'),all('investments'),all('investmentContributions')
  ]);
  const issues=[];
  if(profile&&!profile.pinHash)issues.push({code:'profile.pin.missing',level:'critical'});
  if(profile&&!settings)issues.push({code:'settings.missing',level:'critical'});

  const txActive=transactions.filter(active), contribActive=contributions.filter(active), debtPayActive=debtPayments.filter(active);
  const txById=new Map(txActive.map(x=>[x.id,x]));
  const contribById=new Map(contribActive.map(x=>[x.id,x]));
  const debtPayById=new Map(debtPayActive.map(x=>[x.id,x]));
  const debtById=new Map(debts.filter(active).map(x=>[x.id,x]));
  const goalById=new Map(goals.filter(active).map(x=>[x.id,x]));
  const invById=new Map(investments.filter(active).map(x=>[x.id,x]));

  for(const tx of txActive){
    if(!finiteNonNegative(tx.amount))issues.push({code:'transaction.amount.invalid',id:tx.id,level:'critical'});
    if(tx.linkedContributionId&&!contribById.has(tx.linkedContributionId))issues.push({code:'transaction.contribution.orphan',id:tx.id,level:'warning'});
    if(tx.linkedDebtPaymentId&&!debtPayById.has(tx.linkedDebtPaymentId))issues.push({code:'transaction.debtPayment.orphan',id:tx.id,level:'warning'});
  }
  for(const c of contribActive){
    if(!finiteNonNegative(c.amount))issues.push({code:'contribution.amount.invalid',id:c.id,level:'critical'});
    const linked=txActive.find(t=>t.linkedContributionId===c.id);
    if(!linked)issues.push({code:'contribution.transaction.missing',id:c.id,level:'warning'});
    if(c.destinationType==='goal'&&!goalById.has(c.destinationId))issues.push({code:'contribution.goal.missing',id:c.id,level:'info'});
    if(c.destinationType==='reserve'&&c.destinationId!=='emergency')issues.push({code:'contribution.reserve.unknown',id:c.id,level:'warning'});
  }
  for(const p of debtPayActive){
    if(!finiteNonNegative(p.amount))issues.push({code:'debtPayment.amount.invalid',id:p.id,level:'critical'});
    if(!debtById.has(p.debtId))issues.push({code:'debtPayment.debt.missing',id:p.id,level:'info'});
    if(!p.transactionId||!txById.has(p.transactionId))issues.push({code:'debtPayment.transaction.missing',id:p.id,level:'warning'});
  }
  for(const d of debts.filter(active))if(!finiteNonNegative(d.balance))issues.push({code:'debt.balance.invalid',id:d.id,level:'critical'});
  for(const r of reserves.filter(active))if(!finiteNonNegative(r.currentAmount))issues.push({code:'reserve.amount.invalid',id:r.id,level:'critical'});
  for(const g of goals.filter(active))if(!finiteNonNegative(g.currentAmount)||!finiteNonNegative(g.targetAmount))issues.push({code:'goal.amount.invalid',id:g.id,level:'critical'});
  for(const i of investments.filter(active))if(!finiteNonNegative(i.contributed)||!finiteNonNegative(i.currentValue))issues.push({code:'investment.amount.invalid',id:i.id,level:'critical'});
  for(const c of investmentContributions.filter(active))if(!invById.has(c.investmentId))issues.push({code:'investmentContribution.investment.missing',id:c.id,level:'info'});

  const critical=issues.filter(x=>x.level==='critical').length;
  const warning=issues.filter(x=>x.level==='warning').length;
  const report={id:'integrity:last',checkedAt:new Date().toISOString(),ok:critical===0&&warning===0,critical,warning,info:issues.filter(x=>x.level==='info').length,issues};
  await put('settings',{...(settings||{id:'main'}),integrityReport:report,updatedAt:new Date().toISOString()});
  return report;
}

if(location.protocol!=='file:'){
  window.addEventListener('DOMContentLoaded',()=>setTimeout(()=>runIntegrityCheck().catch(err=>console.warn('Integrity check failed',err)),1200),{once:true});
}
