/**
 * Zero-Knowledge Client-Side Encryption for Personal Organizer Backups
 * Uses Web Crypto API: PBKDF2 (100,000 iterations, SHA-256) + AES-GCM (256-bit)
 */

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

function bufToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function hexToBuf(hex: string): Uint8Array<ArrayBuffer> {
  const buffer = new ArrayBuffer(hex.length / 2);
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

export interface EncryptedBackupPackage {
  app: 'personal_organizer_encrypted_backup';
  version: 1;
  createdAt: string;
  salt: string;
  iv: string;
  ciphertext: string;
}

export async function encryptBackup(data: any, passphrase: string): Promise<string> {
  const enc = new TextEncoder();
  const passwordBuffer = enc.encode(passphrase);

  // 1. Generate 16-byte random salt
  const salt = window.crypto.getRandomValues(new Uint8Array(16));

  // 2. Import password as key material
  const baseKey = await window.crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveKey']
  );

  // 3. Derive 256-bit AES-GCM key using PBKDF2 (100,000 iterations)
  const aesKey = await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );

  // 4. Generate 12-byte random IV
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  // 5. Encrypt data
  const plainTextBytes = enc.encode(JSON.stringify(data));
  const cipherBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    aesKey,
    plainTextBytes
  );

  const backupPackage: EncryptedBackupPackage = {
    app: 'personal_organizer_encrypted_backup',
    version: 1,
    createdAt: new Date().toISOString(),
    salt: bufToHex(salt.buffer),
    iv: bufToHex(iv.buffer),
    ciphertext: arrayBufferToBase64(cipherBuffer),
  };

  return JSON.stringify(backupPackage, null, 2);
}

export async function decryptBackup(encryptedPackageString: string, passphrase: string): Promise<any> {
  let pkg: EncryptedBackupPackage;
  try {
    pkg = JSON.parse(encryptedPackageString);
  } catch {
    throw new Error('ไฟล์สำรองข้อมูลชำรุดหรือไม่ถูกต้อง');
  }

  if (pkg.app !== 'personal_organizer_encrypted_backup') {
    throw new Error('รูปแบบไฟล์ไม่ใช่ไฟล์สำรองข้อมูลที่เข้ารหัสของ Personal Organizer');
  }

  const enc = new TextEncoder();
  const passwordBuffer = enc.encode(passphrase);
  const salt = hexToBuf(pkg.salt);
  const iv = hexToBuf(pkg.iv);
  const cipherBuffer = base64ToArrayBuffer(pkg.ciphertext);

  const baseKey = await window.crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveKey']
  );

  const aesKey = await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );

  try {
    const plainBuffer = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv,
      },
      aesKey,
      cipherBuffer
    );

    const dec = new TextDecoder();
    const jsonString = dec.decode(plainBuffer);
    return JSON.parse(jsonString);
  } catch (err) {
    throw new Error('รหัสผ่านหรือ PIN ไม่ถูกต้อง ไม่สามารถถอดรหัสข้อมูลได้');
  }
}
