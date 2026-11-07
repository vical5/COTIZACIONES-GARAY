import { Quotation } from '../types/quotation';
import { db, auth } from '../services/firebase';
import {
  saveQuotationToSupabase,
  getQuotationsFromSupabase,
  deleteQuotationFromSupabase,
  isSupabaseConfigured,
} from '../services/supabase';
import {
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
} from 'firebase/firestore';

const DB_NAME = 'ComercialGarayDB';
const DB_VERSION = 1;
const STORE_NAME = 'quotations_history';
const STORAGE_KEY_HISTORY = 'pachitea_quotations_history';
const FIRESTORE_COLLECTION = 'quotations';

export const isCloudDatabaseConnected = (): {
  supabase: boolean;
  firestore: boolean;
} => {
  return {
    supabase: isSupabaseConfigured(),
    firestore: Boolean(db),
  };
};

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
}

/**
 * Opens or initializes the native browser IndexedDB database.
 * Completely persistent, reliable, and handles offline caching.
 */
function openIndexedDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB no está disponible en este entorno'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const idb = (event.target as IDBOpenDBRequest).result;
      if (!idb.objectStoreNames.contains(STORE_NAME)) {
        const store = idb.createObjectStore(STORE_NAME, { keyPath: 'correlativeNumber' });
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
 * Saves a quotation into Supabase and Firestore cloud database with automatic IndexedDB & localStorage caching.
 */
export async function saveQuotationToDatabase(quotation: Quotation): Promise<void> {
  // 1. Synchronize to localStorage immediately for instant UI feedback
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

  // 2. Persist in IndexedDB local database (offline persistence)
  try {
    const idb = await openIndexedDatabase();
    await new Promise<void>((resolve, reject) => {
      const tx = idb.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const putRequest = store.put(quotation);

      putRequest.onsuccess = () => resolve();
      putRequest.onerror = () => reject(putRequest.error);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('IndexedDB write warning:', err);
  }

  // 3. Persist in Supabase (https://supabase.com) if configured
  if (isSupabaseConfigured()) {
    try {
      const savedToSupa = await saveQuotationToSupabase(quotation);
      if (savedToSupa) {
        console.log(`[Supabase] Cotización ${quotation.correlativeNumber} sincronizada exitosamente.`);
      }
    } catch (supaErr) {
      console.warn('[Supabase] Error al sincronizar:', supaErr);
    }
  }

  // 4. Persist in Firestore Cloud Database as dual cloud backup
  if (db) {
    try {
      const quoteDocRef = doc(db, FIRESTORE_COLLECTION, quotation.correlativeNumber);
      await setDoc(quoteDocRef, quotation, { merge: true });
      console.log(`[Firestore] Cotización ${quotation.correlativeNumber} sincronizada exitosamente.`);
    } catch (err) {
      console.error('Error guardando en Firestore cloud:', err);
      handleFirestoreError(err, OperationType.WRITE, `${FIRESTORE_COLLECTION}/${quotation.correlativeNumber}`);
    }
  }
}

/**
 * Retrieves all stored quotations from Supabase (or Firestore/IndexedDB fallback).
 */
export async function getAllQuotationsFromDatabase(): Promise<Quotation[]> {
  // 1. Try reading from Supabase (https://supabase.com) first if configured
  if (isSupabaseConfigured()) {
    try {
      const supaQuotations = await getQuotationsFromSupabase();
      if (supaQuotations && supaQuotations.length > 0) {
        console.log(`[Supabase] Se cargaron ${supaQuotations.length} cotizaciones desde la base de datos Supabase.`);
        
        // Cache Supabase records into localStorage and IndexedDB
        try {
          localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(supaQuotations));
          const idb = await openIndexedDatabase();
          const tx = idb.transaction(STORE_NAME, 'readwrite');
          const store = tx.objectStore(STORE_NAME);
          for (const item of supaQuotations) {
            store.put(item);
          }
        } catch (cacheErr) {
          console.warn('Cache sync warning:', cacheErr);
        }

        return supaQuotations;
      }
    } catch (supaErr) {
      console.warn('[Supabase] Error obteniendo datos, intentando proveedores secundarios:', supaErr);
    }
  }

  // 2. Try reading from Firestore cloud database
  if (db) {
    try {
      const querySnapshot = await getDocs(collection(db, FIRESTORE_COLLECTION));
      if (!querySnapshot.empty) {
        const cloudQuotations: Quotation[] = querySnapshot.docs.map((docSnap) => docSnap.data() as Quotation);
        
        cloudQuotations.sort(
          (a, b) =>
            new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime()
        );

        // Sync cloud data back to local storage and IndexedDB
        try {
          localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(cloudQuotations));
          const idb = await openIndexedDatabase();
          const tx = idb.transaction(STORE_NAME, 'readwrite');
          const store = tx.objectStore(STORE_NAME);
          for (const item of cloudQuotations) {
            store.put(item);
          }
        } catch (cacheErr) {
          console.warn('Cache sync warning:', cacheErr);
        }

        return cloudQuotations;
      }
    } catch (err) {
      console.warn('No se pudo consultar Firestore cloud, usando base de datos local:', err);
    }
  }

  // 3. Fallback to IndexedDB (local offline database)
  try {
    const idb = await openIndexedDatabase();
    return await new Promise<Quotation[]>((resolve, reject) => {
      const tx = idb.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const result = (request.result as Quotation[]) || [];
        result.sort(
          (a, b) =>
            new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime()
        );
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
 * Deletes a quotation from Supabase, Firestore, IndexedDB, and localStorage.
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
    const idb = await openIndexedDatabase();
    await new Promise<void>((resolve, reject) => {
      const tx = idb.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(correlativeNumber);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('Error eliminando de IndexedDB:', err);
  }

  // 3. Remove from Supabase if configured
  if (isSupabaseConfigured()) {
    try {
      await deleteQuotationFromSupabase(correlativeNumber);
      console.log(`[Supabase] Cotización ${correlativeNumber} eliminada de Supabase.`);
    } catch (supaErr) {
      console.warn('[Supabase] Error al eliminar:', supaErr);
    }
  }

  // 4. Remove from Firestore cloud database
  if (db) {
    try {
      const quoteDocRef = doc(db, FIRESTORE_COLLECTION, correlativeNumber);
      await deleteDoc(quoteDocRef);
      console.log(`[Firestore] Cotización ${correlativeNumber} eliminada de Firestore.`);
    } catch (err) {
      console.error('Error eliminando de Firestore:', err);
      handleFirestoreError(err, OperationType.DELETE, `${FIRESTORE_COLLECTION}/${correlativeNumber}`);
    }
  }
}
