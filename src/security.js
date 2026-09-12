const enc = new TextEncoder();
const dec = new TextDecoder();
const b64 = bytes => btoa(String.fromCharCode(...new Uint8Array(bytes)));
const unb64 = s => {
  if(typeof s!=='string'||!s) throw new Error('Base64 inválido');
  try{return Uint8Array.from(atob(s), c => c.charCodeAt(0));}
  catch{throw new Error('Base64 inválido');}
};

const PIN_ITERATIONS=180000;
const BACKUP_ITERATIONS=250000;
const BACKUP_MIN_ITERATIONS=100000;
const BACKUP_MAX_ITERATIONS=1000000;
const MAX_BACKUP_TEXT_SIZE=50_000_000;

export async function hashPassword(password, saltB64){
  const salt = saltB64 ? unb64(saltB64) : crypto.getRandomValues(new Uint8Array(16));
  if(salt.length!==16) throw new Error('Salt de PIN inválido.');
  const key = await crypto.subtle.importKey('raw', enc.encode(password), {name:'PBKDF2'}, false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({name:'PBKDF2', salt, iterations:PIN_ITERATIONS, hash:'SHA-256'}, key, 256);
  return {salt:b64(salt), hash:b64(bits)};
}
export async function verifyPassword(password,salt,expected){
  const result=await hashPassword(password,salt); return result.hash===expected;
}

function validIterations(value){
  const n=Number(value);
  return Number.isInteger(n)&&n>=BACKUP_MIN_ITERATIONS&&n<=BACKUP_MAX_ITERATIONS?n:null;
}
async function deriveAesKey(password,salt,iterations=BACKUP_ITERATIONS){
  const safeIterations=validIterations(iterations);
  if(!safeIterations) throw new Error('Parámetros criptográficos inválidos.');
  const material=await crypto.subtle.importKey('raw',enc.encode(password),{name:'PBKDF2'},false,['deriveKey']);
  return crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations:safeIterations,hash:'SHA-256'},material,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);
}
export async function encryptBackup(data,password){
  if(!password || password.length<8) throw new Error('La contraseña del respaldo debe tener al menos 8 caracteres.');
  const salt=crypto.getRandomValues(new Uint8Array(16));
  const iv=crypto.getRandomValues(new Uint8Array(12));
  const iterations=BACKUP_ITERATIONS;
  const key=await deriveAesKey(password,salt,iterations);
  const cipher=await crypto.subtle.encrypt({name:'AES-GCM',iv},key,enc.encode(JSON.stringify(data)));
  return JSON.stringify({format:'MiDineroEncryptedBackup',version:1,kdf:'PBKDF2-SHA256',iterations,salt:b64(salt),iv:b64(iv),ciphertext:b64(cipher)});
}
export async function decryptBackup(text,password){
  if(typeof text!=='string'||!text.trim()) throw new Error('El archivo de respaldo no es válido.');
  if(text.length>MAX_BACKUP_TEXT_SIZE) throw new Error('El archivo de respaldo es demasiado grande o no es válido.');
  if(!password) throw new Error('Debes indicar la contraseña del respaldo.');
  let pkg;
  try{pkg=JSON.parse(text)}catch{throw new Error('El archivo de respaldo no es válido.');}
  if(pkg?.format!=='MiDineroEncryptedBackup'||pkg.version!==1||pkg.kdf!=='PBKDF2-SHA256') throw new Error('El formato o la versión del respaldo no es compatible con Mi Dinero.');
  const iterations=validIterations(pkg.iterations);
  if(!iterations) throw new Error('El respaldo contiene parámetros criptográficos fuera de los límites permitidos.');
  let salt,iv,ciphertext;
  try{
    salt=unb64(pkg.salt);iv=unb64(pkg.iv);ciphertext=unb64(pkg.ciphertext);
  }catch{throw new Error('El respaldo está incompleto o dañado.');}
  if(salt.length!==16||iv.length!==12||ciphertext.length<17) throw new Error('El respaldo contiene parámetros criptográficos inválidos.');
  try{
    const key=await deriveAesKey(password,salt,iterations);
    const plain=await crypto.subtle.decrypt({name:'AES-GCM',iv},key,ciphertext);
    return JSON.parse(dec.decode(plain));
  }catch{throw new Error('Contraseña incorrecta o respaldo dañado.');}
}
export function newId(prefix='id'){ return `${prefix}_${crypto.randomUUID()}`; }
