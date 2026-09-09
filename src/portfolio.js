export const ASSET_TYPES=['Efectivo / cuenta','Vehículo','Inmueble','Negocio','Otro'];
export const LIABILITY_TYPES=['Tarjeta','Préstamo','Vehículo','Hipoteca','Familiar','Otro'];
export const PORTFOLIO_FUNCTIONS=['Crecer','Proteger','Cubrir','Estar disponible'];

export function moneyNumber(v){const n=Number(String(v??'').replace(',','.'));return Number.isFinite(n)&&n>=0?n:0}
export function netWorth({assets=[],liabilities=[],reserveCurrent=0,investments=[],debts=[]}={}){
  const manualAssets=assets.filter(x=>!x.deletedAt).reduce((s,x)=>s+moneyNumber(x.value),0);
  const investmentValue=investments.filter(x=>!x.deletedAt).reduce((s,x)=>s+moneyNumber(x.currentValue),0);
  const reserveValue=moneyNumber(reserveCurrent);
  const manualLiabilities=liabilities.filter(x=>!x.deletedAt).reduce((s,x)=>s+moneyNumber(x.balance),0);
  const debtValue=debts.filter(x=>!x.deletedAt).reduce((s,x)=>s+moneyNumber(x.balance),0);
  const assetTotal=manualAssets+reserveValue+investmentValue;
  const liabilityTotal=manualLiabilities+debtValue;
  return {manualAssets,reserveValue,investmentValue,manualLiabilities,debtValue,assetTotal,liabilityTotal,net:assetTotal-liabilityTotal};
}
export function portfolioSummary(investments=[]){
  const active=investments.filter(x=>!x.deletedAt);
  const total=active.reduce((s,x)=>s+moneyNumber(x.currentValue),0);
  const cost=active.reduce((s,x)=>s+moneyNumber(x.contributed),0);
  const byFunction=PORTFOLIO_FUNCTIONS.map(name=>{
    const value=active.filter(x=>x.function===name).reduce((s,x)=>s+moneyNumber(x.currentValue),0);
    return {name,value,share:total>0?value/total:0};
  });
  return {total,cost,gain:total-cost,returnPct:cost>0?(total-cost)/cost:0,byFunction};
}
export function investmentReadiness({reserveCurrent=0,reserveMonthlyEssential=0,activeDebts=[],expensiveDebtRate=null}={}){
  const reserveMonths=moneyNumber(reserveMonthlyEssential)>0?moneyNumber(reserveCurrent)/moneyNumber(reserveMonthlyEssential):0;
  const debts=(activeDebts||[]).filter(d=>!d.deletedAt&&moneyNumber(d.balance)>0);
  const hasRateThreshold=Number.isFinite(Number(expensiveDebtRate))&&Number(expensiveDebtRate)>0;
  const expensiveDebt=hasRateThreshold?debts.some(d=>moneyNumber(d.annualRate)>=Number(expensiveDebtRate)):null;
  const checks=[{id:'reserve',label:'Reserva de al menos 3 meses',ok:reserveMonths>=3,status:reserveMonths>=3?'ok':'review'}];
  if(!debts.length)checks.push({id:'debt',label:'Sin deudas activas',ok:true,status:'ok'});
  else if(hasRateThreshold)checks.push({id:'debt',label:`Sin deuda con tasa igual o mayor a ${Number(expensiveDebtRate).toFixed(1)}% anual`,ok:!expensiveDebt,status:expensiveDebt?'review':'ok'});
  else checks.push({id:'debt',label:'Revisar si alguna deuda tiene un costo demasiado alto para ti',ok:null,status:'manual'});
  return {reserveMonths,expensiveDebt,hasRateThreshold,checks,ready:checks.every(x=>x.ok===true)};
}
