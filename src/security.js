const enc = new TextEncoder();
const dec = new TextDecoder();
const b64 = bytes => btoa(String.fromCharCode(...new Uint8Array(bytes)));
const unb64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));

export async function hashPassword(password, saltB64){
  const salt = saltB64 ? unb64(saltB64) : crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey('raw', enc.encode(password), {name:'PBKDF2'}, false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({name:'PBKDF2', salt, iterations:180000, hash:'SHA-256'}, key, 256);
  return {salt:b64(salt), hash:b64(bits)};
}
export async function verifyPassword(password,salt,expected){
  const result=await hashPassword(password,salt); return result.hash===expected;
}

async function deriveAesKey(password,salt,iterations=250000){
  const material=await crypto.subtle.importKey('raw',enc.encode(password),{name:'PBKDF2'},false,['deriveKey']);
  return crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations,hash:'SHA-256'},material,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);
}
export async function encryptBackup(data,password){
  if(!password || password.length<8) throw new Error('La contraseña del respaldo debe tener al menos 8 caracteres.');
  const salt=crypto.getRandomValues(new Uint8Array(16));
  const iv=crypto.getRandomValues(new Uint8Array(12));
  const iterations=250000;
  const key=await deriveAesKey(password,salt,iterations);
  const cipher=await crypto.subtle.encrypt({name:'AES-GCM',iv},key,enc.encode(JSON.stringify(data)));
  return JSON.stringify({format:'MiDineroEncryptedBackup',version:1,kdf:'PBKDF2-SHA256',iterations,salt:b64(salt),iv:b64(iv),ciphertext:b64(cipher)});
}
export async function decryptBackup(text,password){
  let pkg;
  try{pkg=JSON.parse(text)}catch{throw new Error('El archivo de respaldo no es válido.');}
  if(pkg?.format!=='MiDineroEncryptedBackup') throw new Error('Este archivo no es un respaldo protegido de Mi Dinero.');
  try{
    const key=await deriveAesKey(password,unb64(pkg.salt),pkg.iterations||250000);
    const plain=await crypto.subtle.decrypt({name:'AES-GCM',iv:unb64(pkg.iv)},key,unb64(pkg.ciphertext));
    return JSON.parse(dec.decode(plain));
  }catch{throw new Error('Contraseña incorrecta o respaldo dañado.');}
}
export function newId(prefix='id'){ return `${prefix}_${crypto.randomUUID()}`; }
