import { EncryptStorage } from 'encrypt-storage';

// Secret key for client-side encrypted local storage
const ENCRYPTION_SECRET_KEY = 'roundpay-vault-secret-key-353049228215-secure';

let storageInstance: any = null;

try {
  storageInstance = EncryptStorage.create(ENCRYPTION_SECRET_KEY, {
    engine: 'noble',
    prefix: '@roundpay',
  });
} catch (err) {
  console.warn('EncryptStorage initialisation notice, using fallback storage:', err);
}

export const secureStorage = {
  get<T>(key: string, fallback: T): T {
    try {
      if (storageInstance && typeof storageInstance.getItem === 'function') {
        const value = storageInstance.getItem(key);
        if (value !== undefined && value !== null) {
          return value as T;
        }
      }
      // Standard local fallback
      const raw = localStorage.getItem(`@roundpay:${key}`);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  },

  set<T>(key: string, value: T): void {
    try {
      if (storageInstance && typeof storageInstance.setItem === 'function') {
        storageInstance.setItem(key, value);
        return;
      }
      localStorage.setItem(`@roundpay:${key}`, JSON.stringify(value));
    } catch (err) {
      console.error(`Failed to store key: ${key}`, err);
    }
  },

  remove(key: string): void {
    try {
      if (storageInstance && typeof storageInstance.removeItem === 'function') {
        storageInstance.removeItem(key);
      }
      localStorage.removeItem(`@roundpay:${key}`);
    } catch (err) {
      console.error(`Failed to remove key: ${key}`, err);
    }
  },

  clear(): void {
    try {
      if (storageInstance && typeof storageInstance.clear === 'function') {
        storageInstance.clear();
      }
    } catch {
      // ignore
    }
  }
};
