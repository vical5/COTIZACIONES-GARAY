import { Quotation } from '../types/quotation';

const DB_NAME = 'ComercialGarayDB';
const DB_VERSION = 1;
const STORE_NAME = 'quotations_history';
const STORAGE_KEY_HISTORY = 'pachitea_quotations_history';

/**
 * Opens or initializes the native browser IndexedDB database.
 * Completely persistent, reliable, and handles unlimited quotations.
 */
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB no está disponible en este entorno'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'correlativeNumber' });
        store.createIndex('updatedAt', 'updatedAt', { unique: false });
        store.createIndex('date', 'date', { unique: false });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

/**
 * Saves a quotation into the IndexedDB database and synchronizes with localStorage.
 */
export async function saveQuotationToDatabase(quotation: Quotation): Promise<void> {
  // 1. Synchronize to localStorage first as an immediate cache
  try {
    const cachedStr = localStorage.getItem(STORAGE_KEY_HISTORY);
    let history: Quotation[] = cachedStr ? JSON.parse(cachedStr) : [];
    const existingIndex = history.findIndex((q) => q.correlativeNumber === quotation.correlativeNumber);
    if (existingIndex >= 0) {
      history[existingIndex] = quotation;
    } else {
      history.unshift(quotation);
    }
    localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(history));
  } catch (err) {
    console.warn('LocalStorage sync warning:', err);
  }

  // 2. Persist in IndexedDB database
  try {
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const putRequest = store.put(quotation);

      putRequest.onsuccess = () => resolve();
      putRequest.onerror = () => reject(putRequest.error);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.error('Error guardando en la base de datos IndexedDB:', err);
  }
}

/**
 * Retrieves all stored quotations from the database.
 */
export async function getAllQuotationsFromDatabase(): Promise<Quotation[]> {
  try {
    const db = await openDatabase();
    return await new Promise<Quotation[]>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const result = (request.result as Quotation[]) || [];
        // Sort descending by date/time
        result.sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());
        resolve(result);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('Fallback a localStorage para historial:', err);
    try {
      const cachedStr = localStorage.getItem(STORAGE_KEY_HISTORY);
      return cachedStr ? JSON.parse(cachedStr) : [];
    } catch {
      return [];
    }
  }
}

/**
 * Deletes a quotation from the database.
 */
export async function deleteQuotationFromDatabase(correlativeNumber: string): Promise<void> {
  // 1. Remove from localStorage
  try {
    const cachedStr = localStorage.getItem(STORAGE_KEY_HISTORY);
    if (cachedStr) {
      const history: Quotation[] = JSON.parse(cachedStr);
      const filtered = history.filter((q) => q.correlativeNumber !== correlativeNumber);
      localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(filtered));
    }
  } catch (err) {
    console.error(err);
  }

  // 2. Remove from IndexedDB database
  try {
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(correlativeNumber);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('Error eliminando de la base de datos:', err);
  }
}
