import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  getDocFromServer,
  collection,
  onSnapshot,
  getDocs,
  deleteDoc,
  writeBatch,
  Firestore,
  Unsubscribe
} from 'firebase/firestore';
import { AppSettings, DeliveryItem, UploadBatch } from '../types';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App singleton
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Target Firestore Database instance
export const db: Firestore = getFirestore(
  app,
  firebaseConfig.firestoreDatabaseId || '(default)'
);

// Quota status state and listeners
let isQuotaExceeded = false;
const quotaListeners: Array<(exceeded: boolean) => void> = [];

export function subscribeToQuotaStatus(callback: (exceeded: boolean) => void): () => void {
  quotaListeners.push(callback);
  callback(isQuotaExceeded);
  return () => {
    const idx = quotaListeners.indexOf(callback);
    if (idx >= 0) quotaListeners.splice(idx, 1);
  };
}

function checkAndNotifyQuotaError(err: any): boolean {
  if (!err) return false;
  const msg = (err?.message || err?.toString?.() || '').toLowerCase();
  const code = (err?.code || '').toLowerCase();
  if (
    code.includes('resource-exhausted') ||
    msg.includes('resource-exhausted') ||
    msg.includes('quota') ||
    msg.includes('free daily write units') ||
    msg.includes('free daily read units')
  ) {
    notifyQuotaExceeded(true);
    return true;
  }
  return false;
}

function notifyQuotaExceeded(exceeded: boolean) {
  if (isQuotaExceeded !== exceeded) {
    isQuotaExceeded = exceeded;
    quotaListeners.forEach((fn) => fn(exceeded));
  }
}

/**
 * Sanitizes arbitrary objects for Firestore by recursively stripping any `undefined` values.
 * Firestore throws a hard runtime error when encountering `undefined` in document payloads.
 */
export function sanitizeForFirestore<T>(data: T): T {
  if (data === null || data === undefined) {
    return null as unknown as T;
  }
  if (Array.isArray(data)) {
    return data.map((item) => sanitizeForFirestore(item)) as unknown as T;
  }
  if (typeof data === 'object') {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        cleaned[key] = sanitizeForFirestore(value);
      }
    }
    return cleaned as T;
  }
  return data;
}

// Debounce timers to coalesce rapid UI events while ensuring immediate sync
const monthDebounceTimers: Record<string, NodeJS.Timeout> = {};
let settingsDebounceTimer: NodeJS.Timeout | null = null;

export const FirebaseService = {
  /**
   * Check connection to Firestore database using live server fetch
   */
  async checkConnection(): Promise<boolean> {
    try {
      const settingsDoc = doc(db, 'settings', 'app_settings');
      await getDocFromServer(settingsDoc).catch(() => getDoc(settingsDoc));
      if (isQuotaExceeded) {
        notifyQuotaExceeded(false);
      }
      return true;
    } catch (e: any) {
      console.warn('[Firebase] Connection check:', e);
      checkAndNotifyQuotaError(e);
      return false;
    }
  },

  /**
   * Manually attempt to re-verify cloud connection & quota status
   */
  async retryQuotaCheck(): Promise<boolean> {
    try {
      const settingsDoc = doc(db, 'settings', 'app_settings');
      await getDocFromServer(settingsDoc).catch(() => getDoc(settingsDoc));
      notifyQuotaExceeded(false);
      return true;
    } catch (e: any) {
      if (checkAndNotifyQuotaError(e)) {
        return false;
      }
      return false;
    }
  },

  /**
   * Real-time subscription to ALL months data for a specific hotel.
   * Returns a map: { [monthKey]: DeliveryItem[] }
   * When any browser adds/edits/deletes an item in this hotel, all connected devices update instantly!
   */
  subscribeToMonthsMap(
    hotelId: string = 'hotel_1',
    callback: (monthsMap: Record<string, DeliveryItem[]>) => void
  ): Unsubscribe {
    const monthsCol = collection(db, 'months');
    return onSnapshot(
      monthsCol,
      (snapshot) => {
        const monthsMap: Record<string, DeliveryItem[]> = {};
        const prefix = `${hotelId}_`;

        snapshot.forEach((docSnap) => {
          const docId = docSnap.id;
          const data = docSnap.data();
          if (!data || !Array.isArray(data.deliveries)) return;

          if (docId.startsWith(prefix)) {
            const mKey = docId.substring(prefix.length);
            monthsMap[mKey] = data.deliveries;
          } else if (hotelId === 'hotel_1' && !docId.includes('_')) {
            // Legacy documents without underscore prefix map to hotel_1
            if (!monthsMap[docId]) {
              monthsMap[docId] = data.deliveries;
            }
          }
        });

        if (isQuotaExceeded) notifyQuotaExceeded(false);
        callback(monthsMap);
      },
      (err) => {
        console.warn(`[Firebase] subscribeToMonthsMap (${hotelId}) error:`, err);
        checkAndNotifyQuotaError(err);
      }
    );
  },

  /**
   * Real-time subscription to application settings for a specific hotel across ALL browsers
   */
  subscribeToSettings(
    hotelId: string = 'hotel_1',
    callback: (settings: AppSettings) => void
  ): Unsubscribe {
    const targetDocId = hotelId === 'hotel_1' ? 'app_settings' : `app_settings_${hotelId}`;
    const settingsDoc = doc(db, 'settings', targetDocId);

    return onSnapshot(
      settingsDoc,
      (snap) => {
        if (snap.exists()) {
          if (isQuotaExceeded) notifyQuotaExceeded(false);
          callback(snap.data() as AppSettings);
        }
      },
      (err) => {
        console.warn(`[Firebase] subscribeToSettings (${hotelId}) error:`, err);
        checkAndNotifyQuotaError(err);
      }
    );
  },

  /**
   * Save app settings to Cloud Database with immediate write or minimal debounce
   */
  async saveSettings(
    hotelId: string = 'hotel_1',
    settings: AppSettings,
    immediate = true
  ): Promise<void> {
    if (isQuotaExceeded) {
      return;
    }

    const writeOp = async () => {
      if (isQuotaExceeded) return;
      try {
        const targetDocId = hotelId === 'hotel_1' ? 'app_settings' : `app_settings_${hotelId}`;
        const settingsDoc = doc(db, 'settings', targetDocId);
        const payload = sanitizeForFirestore({
          ...settings,
          hotelId,
          updatedAt: new Date().toISOString()
        });
        await setDoc(settingsDoc, payload, { merge: true });

        // If hotel_1, also keep app_settings_hotel_1 synced
        if (hotelId === 'hotel_1') {
          const secondaryDoc = doc(db, 'settings', 'app_settings_hotel_1');
          await setDoc(secondaryDoc, payload, { merge: true }).catch(() => {});
        }
      } catch (e: any) {
        console.warn(`[Firebase] saveSettings (${hotelId}) error:`, e);
        checkAndNotifyQuotaError(e);
      }
    };

    if (immediate) {
      if (settingsDebounceTimer) clearTimeout(settingsDebounceTimer);
      return writeOp();
    }

    if (settingsDebounceTimer) clearTimeout(settingsDebounceTimer);
    settingsDebounceTimer = setTimeout(writeOp, 200);
  },

  /**
   * Load app settings from Cloud Database
   */
  async loadSettings(hotelId: string = 'hotel_1'): Promise<AppSettings | null> {
    try {
      const targetDocId = hotelId === 'hotel_1' ? 'app_settings' : `app_settings_${hotelId}`;
      const settingsDoc = doc(db, 'settings', targetDocId);
      const snap = await getDoc(settingsDoc);
      if (snap.exists()) {
        return snap.data() as AppSettings;
      }
    } catch (e: any) {
      console.warn(`[Firebase] loadSettings (${hotelId}) error:`, e);
      checkAndNotifyQuotaError(e);
    }
    return null;
  },

  /**
   * Save a monthly delivery batch to Cloud Firestore as a SINGLE aggregated document.
   * Real-time sync across PC, Mobile, and all team members.
   */
  async saveMonthDeliveries(
    hotelId: string = 'hotel_1',
    month: string,
    items: DeliveryItem[],
    immediate = true
  ): Promise<void> {
    if (isQuotaExceeded) {
      return;
    }

    const timerKey = `${hotelId}_${month}`;
    const writeOp = async () => {
      if (isQuotaExceeded) return;
      try {
        const docName = `${hotelId}_${month}`;
        const monthDoc = doc(db, 'months', docName);
        const payload = sanitizeForFirestore({
          hotelId,
          month,
          itemCount: items.length,
          deliveries: items,
          updatedAt: new Date().toISOString()
        });
        await setDoc(monthDoc, payload, { merge: true });

        // If hotel_1, also keep legacy doc updated for backward compatibility
        if (hotelId === 'hotel_1') {
          const legacyDoc = doc(db, 'months', month);
          await setDoc(legacyDoc, payload, { merge: true }).catch(() => {});
        }
      } catch (e: any) {
        console.warn(`[Firebase] saveMonthDeliveries (${hotelId}/${month}) error:`, e);
        checkAndNotifyQuotaError(e);
      }
    };

    if (immediate) {
      if (monthDebounceTimers[timerKey]) clearTimeout(monthDebounceTimers[timerKey]);
      return writeOp();
    }

    if (monthDebounceTimers[timerKey]) clearTimeout(monthDebounceTimers[timerKey]);
    monthDebounceTimers[timerKey] = setTimeout(writeOp, 250);
  },

  /**
   * Fetch all months data once on app startup for a hotel
   */
  async loadMonthsMap(hotelId: string = 'hotel_1'): Promise<Record<string, DeliveryItem[]>> {
    try {
      const monthsMap: Record<string, DeliveryItem[]> = {};
      const snap = await getDocs(collection(db, 'months'));
      const prefix = `${hotelId}_`;

      snap.forEach((docSnap) => {
        const docId = docSnap.id;
        const data = docSnap.data();
        if (!data || !Array.isArray(data.deliveries)) return;

        if (docId.startsWith(prefix)) {
          const mKey = docId.substring(prefix.length);
          monthsMap[mKey] = data.deliveries;
        } else if (hotelId === 'hotel_1' && !docId.includes('_')) {
          if (!monthsMap[docId]) {
            monthsMap[docId] = data.deliveries;
          }
        }
      });
      return monthsMap;
    } catch (e) {
      console.warn(`[Firebase] loadMonthsMap (${hotelId}) error:`, e);
      return {};
    }
  },

  /**
   * Clear past / older delivery records from Firestore for a hotel
   */
  async clearPastDeliveries(hotelId: string = 'hotel_1', keepMonth: string): Promise<void> {
    try {
      const monthsSnap = await getDocs(collection(db, 'months'));
      const batch = writeBatch(db);
      const keepDocName = `${hotelId}_${keepMonth}`;

      monthsSnap.forEach((d) => {
        if (d.id.startsWith(`${hotelId}_`) && d.id !== keepDocName) {
          batch.delete(d.ref);
        } else if (hotelId === 'hotel_1' && !d.id.includes('_') && d.id !== keepMonth) {
          batch.delete(d.ref);
        }
      });
      await batch.commit();
    } catch (e) {
      console.warn(`[Firebase] clearPastDeliveries (${hotelId}) error:`, e);
    }
  },

  /**
   * Reset supplier directory (emails, phones, rules) from cloud settings
   */
  async resetSupplierDirectory(hotelId: string = 'hotel_1'): Promise<void> {
    try {
      const targetDocId = hotelId === 'hotel_1' ? 'app_settings' : `app_settings_${hotelId}`;
      const settingsDoc = doc(db, 'settings', targetDocId);
      await setDoc(
        settingsDoc,
        {
          supplierEmails: {},
          supplierPhones: {},
          supplierRules: {},
          updatedAt: new Date().toISOString()
        },
        { merge: true }
      );
    } catch (e) {
      console.warn(`[Firebase] resetSupplierDirectory (${hotelId}) error:`, e);
    }
  },

  /**
   * Real-time subscription to upload history (last uploads) for a hotel
   */
  subscribeToUploadHistory(
    hotelId: string = 'hotel_1',
    callback: (history: UploadBatch[]) => void
  ): Unsubscribe {
    const targetDocId = hotelId === 'hotel_1' ? 'upload_history' : `upload_history_${hotelId}`;
    const historyDoc = doc(db, 'settings', targetDocId);
    return onSnapshot(
      historyDoc,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (data && Array.isArray(data.batches)) {
            callback(data.batches as UploadBatch[]);
          }
        }
      },
      (err) => {
        console.warn(`[Firebase] subscribeToUploadHistory (${hotelId}) error:`, err);
      }
    );
  },

  /**
   * Save upload history batches to Firebase
   */
  async saveUploadHistory(hotelId: string = 'hotel_1', history: UploadBatch[]): Promise<void> {
    if (isQuotaExceeded) return;
    try {
      const targetDocId = hotelId === 'hotel_1' ? 'upload_history' : `upload_history_${hotelId}`;
      const historyDoc = doc(db, 'settings', targetDocId);
      const payload = sanitizeForFirestore({
        batches: history.slice(0, 10),
        hotelId,
        updatedAt: new Date().toISOString()
      });
      await setDoc(historyDoc, payload, { merge: true });
    } catch (e: any) {
      console.warn(`[Firebase] saveUploadHistory (${hotelId}) error:`, e);
      checkAndNotifyQuotaError(e);
    }
  },

  /**
   * Wipe all records from Cloud Database for a specific hotel or all
   */
  async wipeAllDatabase(hotelId?: string): Promise<void> {
    try {
      const monthsSnap = await getDocs(collection(db, 'months'));
      const batch = writeBatch(db);
      monthsSnap.forEach((m) => {
        if (!hotelId) {
          batch.delete(m.ref);
        } else if (m.id.startsWith(`${hotelId}_`)) {
          batch.delete(m.ref);
        } else if (hotelId === 'hotel_1' && !m.id.includes('_')) {
          batch.delete(m.ref);
        }
      });
      await batch.commit();
    } catch (e) {
      console.warn('[Firebase] wipeAllDatabase error:', e);
    }
  }
};


