const DB_NAME = 'mi-dinero-personal-db';
const DB_VERSION = 15;
const STORES = [
  'profile','settings','outbox','audit','drafts',
  'diagnosis','diagnosisHistory','transactions','recurringTransactions','budgets','leakReviews','reserves','debts','debtPlans','debtPayments','goals','contributions','plannedExpenses','investments','rates','purchaseAssessments','backups'
];

export function openDB(){
  return new Promise((resolve,reject)=>{
    const req=indexedDB.open(DB_NAME,DB_VERSION);
    req.onupgradeneeded=()=>{
      const db=req.result;
      for(const s of STORES){
        if(!db.objectStoreNames.contains(s)) db.createObjectStore(s,{keyPath:'id'});
      }
    };
    req.onsuccess=()=>resolve(req.result);
    req.onerror=()=>reject(req.error);
  });
}
export async function put(store,value){const db=await openDB();return new Promise((resolve,reject)=>{const tx=db.transaction(store,'readwrite');tx.objectStore(store).put(value);tx.oncomplete=()=>resolve(value);tx.onerror=()=>reject(tx.error)})}
export async function get(store,id){const db=await openDB();return new Promise((resolve,reject)=>{const req=db.transaction(store,'readonly').objectStore(store).get(id);req.onsuccess=()=>resolve(req.result||null);req.onerror=()=>reject(req.error)})}
export async function all(store){const db=await openDB();return new Promise((resolve,reject)=>{const req=db.transaction(store,'readonly').objectStore(store).getAll();req.onsuccess=()=>resolve(req.result||[]);req.onerror=()=>reject(req.error)})}
export async function del(store,id){const db=await openDB();return new Promise((resolve,reject)=>{const tx=db.transaction(store,'readwrite');tx.objectStore(store).delete(id);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error)})}
export async function clear(store){const db=await openDB();return new Promise((resolve,reject)=>{const tx=db.transaction(store,'readwrite');tx.objectStore(store).clear();tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error)})}
export async function exportAll({includeBackups=false}={}){
  const data={schema:15,app:'Mi Dinero Personal',exportedAt:new Date().toISOString(),stores:{}};
  for(const s of STORES){if(s==='backups'&&!includeBackups)continue;data.stores[s]=await all(s)}
  return data;
}
export async function importAll(data){
  if(!data || data.app!=='Mi Dinero Personal' || !data.stores) throw new Error('El respaldo no corresponde a Mi Dinero.');
  for(const s of STORES){
    if(s==='backups') continue;
    if(!Array.isArray(data.stores[s])) continue;
    await clear(s);for(const item of data.stores[s]) await put(s,item);
  }
}
export async function createLocalSnapshot(reason='automatic'){
  const snapshot=await exportAll({includeBackups:false});
  const item={id:`snapshot_${Date.now()}`,reason,createdAt:new Date().toISOString(),snapshot};
  await put('backups',item);
  const items=(await all('backups')).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
  for(const old of items.slice(5)) await del('backups',old.id);
  return item;
}
export {STORES};
