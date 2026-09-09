import {all,put} from './db.js';
import {newId} from './security.js';

export async function enqueue(type,payload){
  const item={id:newId('change'),type,payload,createdAt:new Date().toISOString(),status:'local'};
  await put('outbox',item);
  return item;
}
export async function queueSize(){ return (await all('outbox')).length; }

// Esta versión personal no borra cambios simulando una nube inexistente.
// La cola queda preparada para una futura copia/sincronización opcional.
export async function syncStatus(){
  return {configured:false,pending:await queueSize()};
}
