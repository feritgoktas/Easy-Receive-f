import { AppSettings, DeliveryItem, HotelConfig, UploadBatch } from '../types';
import { DEFAULT_HOTELS, DEFAULT_SETTINGS, getTodayStr, monthOf } from './helpers';
import { FirebaseService } from './firebase';

const ACTIVE_HOTEL_KEY = 'receiving_easy_active_hotel';
const SETTINGS_KEY_PREFIX = 'receiving_easy_settings_';
const MONTH_KEY_PREFIX = 'receiving_easy_m_';
const UPLOAD_HISTORY_KEY_PREFIX = 'receiving_easy_upload_history_';

// Legacy keys for backward compatibility with pre-multi-hotel records
const LEGACY_SETTINGS_KEY = 'receiving_easy_settings';
const LEGACY_UPLOAD_HISTORY_KEY = 'receiving_easy_upload_history';

/**
 * Intelligently merges local delivery items with remote delivery items.
 * Prevents loss of user edits by checking timestamps and status transitions.
 */
export function mergeDeliveryItems(
  localItems: DeliveryItem[] = [],
  remoteItems: DeliveryItem[] = []
): DeliveryItem[] {
  const map = new Map<string, DeliveryItem>();

  // First populate with remote items
  remoteItems.forEach((rItem) => {
    if (rItem && rItem.id) {
      map.set(rItem.id, rItem);
    }
  });

  // Now merge with local items
  localItems.forEach((lItem) => {
    if (!lItem || !lItem.id) return;

    if (!map.has(lItem.id)) {
      map.set(lItem.id, lItem);
    } else {
      const rItem = map.get(lItem.id)!;
      const lUpdated = lItem.updatedAt || lItem.recordedAt || '';
      const rUpdated = rItem.updatedAt || rItem.recordedAt || '';

      if (lUpdated > rUpdated) {
        map.set(lItem.id, { ...rItem, ...lItem });
      } else if (rUpdated > lUpdated) {
        map.set(lItem.id, { ...lItem, ...rItem });
      } else {
        if (lItem.status !== 'pending' && rItem.status === 'pending') {
          map.set(lItem.id, { ...rItem, ...lItem });
        } else {
          map.set(lItem.id, { ...lItem, ...rItem });
        }
      }
    }
  });

  return Array.from(map.values());
}

export class StorageService {
  private static memMonths: Record<string, Record<string, DeliveryItem[]>> = {};
  private static memSettings: Record<string, AppSettings> = {};
  private static memUploadHistory: Record<string, UploadBatch[]> = {};

  // Active Hotel Selection
  static getActiveHotelId(): string {
    try {
      const stored = localStorage.getItem(ACTIVE_HOTEL_KEY);
      if (stored && (stored === 'hotel_1' || stored === 'hotel_2' || stored.startsWith('hotel_'))) {
        return stored;
      }
    } catch (e) {
      console.warn('LocalStorage getActiveHotelId error:', e);
    }
    return 'hotel_1';
  }

  static setActiveHotelId(hotelId: string): void {
    try {
      localStorage.setItem(ACTIVE_HOTEL_KEY, hotelId);
    } catch (e) {
      console.warn('LocalStorage setActiveHotelId error:', e);
    }
  }

  // Key builders
  static getSettingsKey(hotelId: string = 'hotel_1'): string {
    return `${SETTINGS_KEY_PREFIX}${hotelId}`;
  }

  static getUploadHistoryKey(hotelId: string = 'hotel_1'): string {
    return `${UPLOAD_HISTORY_KEY_PREFIX}${hotelId}`;
  }

  static getMonthKey(month: string, hotelId: string = 'hotel_1'): string {
    return `${MONTH_KEY_PREFIX}${hotelId}_${month}`;
  }

  static getLegacyMonthKey(month: string): string {
    return `${MONTH_KEY_PREFIX}${month}`;
  }

  // Upload history per hotel
  static loadUploadHistory(hotelId: string = this.getActiveHotelId()): UploadBatch[] {
    if (this.memUploadHistory[hotelId] && this.memUploadHistory[hotelId].length > 0) {
      return this.memUploadHistory[hotelId];
    }
    try {
      const primaryKey = this.getUploadHistoryKey(hotelId);
      let data = localStorage.getItem(primaryKey);
      
      // Fallback for hotel_1 to legacy key
      if (!data && hotelId === 'hotel_1') {
        data = localStorage.getItem(LEGACY_UPLOAD_HISTORY_KEY);
      }

      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          this.memUploadHistory[hotelId] = parsed.slice(0, 10);
          return this.memUploadHistory[hotelId];
        }
      }
    } catch (e) {
      console.warn(`LocalStorage loadUploadHistory (${hotelId}) error:`, e);
    }
    this.memUploadHistory[hotelId] = [];
    return [];
  }

  static saveUploadHistoryLocallyOnly(
    history: UploadBatch[],
    hotelId: string = this.getActiveHotelId()
  ): void {
    this.memUploadHistory[hotelId] = history.slice(0, 10);
    try {
      localStorage.setItem(this.getUploadHistoryKey(hotelId), JSON.stringify(this.memUploadHistory[hotelId]));
      if (hotelId === 'hotel_1') {
        localStorage.setItem(LEGACY_UPLOAD_HISTORY_KEY, JSON.stringify(this.memUploadHistory[hotelId]));
      }
    } catch (e) {
      console.warn(`LocalStorage saveUploadHistory (${hotelId}) error:`, e);
    }
  }

  static saveUploadHistory(
    history: UploadBatch[],
    hotelId: string = this.getActiveHotelId()
  ): void {
    this.saveUploadHistoryLocallyOnly(history, hotelId);
    FirebaseService.saveUploadHistory(hotelId, this.memUploadHistory[hotelId]).catch((err) => {
      console.warn(`Firebase upload history sync (${hotelId}):`, err);
    });
  }

  static addUploadBatch(
    batch: UploadBatch,
    hotelId: string = this.getActiveHotelId()
  ): UploadBatch[] {
    const current = this.loadUploadHistory(hotelId).filter((b) => b.id !== batch.id);
    const batchWithHotel: UploadBatch = { ...batch, hotelId };
    const updated = [batchWithHotel, ...current].slice(0, 10);
    this.saveUploadHistory(updated, hotelId);
    return updated;
  }

  static updateUploadBatch(
    batchId: string,
    patch: Partial<UploadBatch>,
    hotelId: string = this.getActiveHotelId()
  ): UploadBatch[] {
    const current = this.loadUploadHistory(hotelId);
    const updated = current.map((b) => (b.id === batchId ? { ...b, ...patch } : b));
    this.saveUploadHistory(updated, hotelId);
    return updated;
  }

  static removeUploadBatch(
    batchId: string,
    hotelId: string = this.getActiveHotelId()
  ): UploadBatch[] {
    const current = this.loadUploadHistory(hotelId);
    const updated = current.filter((b) => b.id !== batchId);
    this.saveUploadHistory(updated, hotelId);
    return updated;
  }

  // Settings per hotel
  static loadSettings(hotelId: string = this.getActiveHotelId()): AppSettings {
    if (this.memSettings[hotelId]) {
      return this.memSettings[hotelId];
    }
    try {
      const primaryKey = this.getSettingsKey(hotelId);
      let data = localStorage.getItem(primaryKey);

      // Fallback for hotel_1
      if (!data && hotelId === 'hotel_1') {
        data = localStorage.getItem(LEGACY_SETTINGS_KEY);
      }

      if (data) {
        const parsed = JSON.parse(data);
        const hotelsList: HotelConfig[] = Array.isArray(parsed.hotels) && parsed.hotels.length > 0
          ? parsed.hotels.map((h: HotelConfig) => {
              if (h.id === 'hotel_1') {
                return {
                  ...DEFAULT_HOTELS[0],
                  ...h,
                  name: h.name.includes('1. Otel') ? 'Bosphorus' : h.name,
                  code: (h.code === 'HTL-1' || h.code === 'BOSPHORUS') ? 'BOP' : h.code
                };
              }
              if (h.id === 'hotel_2') {
                return {
                  ...DEFAULT_HOTELS[1],
                  ...h,
                  name: h.name.includes('2. Otel') ? 'Istanbul' : h.name,
                  code: (h.code === 'HTL-2' || h.code === 'ISTANBUL') ? 'IST' : h.code
                };
              }
              return h;
            })
          : DEFAULT_HOTELS;

        const merged: AppSettings = {
          ...DEFAULT_SETTINGS,
          ...parsed,
          hotelId,
          hotels: hotelsList,
          pinCode: parsed.pinCode !== undefined ? String(parsed.pinCode) : DEFAULT_SETTINGS.pinCode,
          staffList: Array.isArray(parsed.staffList) && parsed.staffList.length > 0 ? parsed.staffList : DEFAULT_SETTINGS.staffList,
          emails: { ...DEFAULT_SETTINGS.emails, ...(parsed.emails || {}) },
          supplierEmails: { ...DEFAULT_SETTINGS.supplierEmails, ...(parsed.supplierEmails || {}) },
          supplierPhones: { ...DEFAULT_SETTINGS.supplierPhones, ...(parsed.supplierPhones || {}) },
          supplierRules: { ...DEFAULT_SETTINGS.supplierRules, ...(parsed.supplierRules || {}) },
          extraCheckProducts: Array.isArray(parsed.extraCheckProducts)
            ? parsed.extraCheckProducts
            : DEFAULT_SETTINGS.extraCheckProducts,
          templates: {
            tr: { ...DEFAULT_SETTINGS.templates.tr, ...(parsed.templates?.tr || {}) },
            en: { ...DEFAULT_SETTINGS.templates.en, ...(parsed.templates?.en || {}) }
          }
        };
        this.memSettings[hotelId] = merged;
        return merged;
      }
    } catch (e) {
      console.warn(`LocalStorage loadSettings (${hotelId}) error:`, e);
    }
    const defaultForHotel: AppSettings = {
      ...DEFAULT_SETTINGS,
      hotelId,
      company: hotelId === 'hotel_2' ? 'Four Seasons Sultanahmet – Mal Kabul' : 'Four Seasons Bosphorus – Mal Kabul'
    };
    this.memSettings[hotelId] = defaultForHotel;
    return defaultForHotel;
  }

  static saveSettingsLocallyOnly(
    settings: AppSettings,
    hotelId: string = settings.hotelId || this.getActiveHotelId()
  ): void {
    const updated = { ...settings, hotelId };
    this.memSettings[hotelId] = updated;
    try {
      localStorage.setItem(this.getSettingsKey(hotelId), JSON.stringify(updated));
      if (hotelId === 'hotel_1') {
        localStorage.setItem(LEGACY_SETTINGS_KEY, JSON.stringify(updated));
      }
    } catch (e) {
      console.warn(`LocalStorage saveSettings (${hotelId}) error:`, e);
    }
  }

  static saveSettings(
    settings: AppSettings,
    hotelId: string = settings.hotelId || this.getActiveHotelId()
  ): void {
    this.saveSettingsLocallyOnly(settings, hotelId);
    FirebaseService.saveSettings(hotelId, this.memSettings[hotelId]).catch((err) => {
      console.warn(`Firebase settings sync (${hotelId}):`, err);
    });
  }

  // Month data per hotel
  static loadMonth(
    month: string,
    hotelId: string = this.getActiveHotelId()
  ): DeliveryItem[] {
    if (!this.memMonths[hotelId]) {
      this.memMonths[hotelId] = {};
    }
    if (this.memMonths[hotelId][month] && this.memMonths[hotelId][month].length > 0) {
      return this.memMonths[hotelId][month];
    }
    try {
      const primaryKey = this.getMonthKey(month, hotelId);
      let data = localStorage.getItem(primaryKey);

      // Fallback for hotel_1
      if (!data && hotelId === 'hotel_1') {
        data = localStorage.getItem(this.getLegacyMonthKey(month));
      }

      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed.deliveries)) {
          const seen = new Set<string>();
          const deduped: DeliveryItem[] = [];
          parsed.deliveries.forEach((item: DeliveryItem) => {
            if (item && item.id && !seen.has(item.id)) {
              seen.add(item.id);
              deduped.push({ ...item, hotelId: item.hotelId || hotelId });
            }
          });
          this.memMonths[hotelId][month] = deduped;
          return deduped;
        }
      }
    } catch (e) {
      console.warn(`LocalStorage loadMonth (${hotelId}/${month}) error:`, e);
    }
    this.memMonths[hotelId][month] = [];
    return [];
  }

  static loadAllMonths(hotelId: string = this.getActiveHotelId()): Record<string, DeliveryItem[]> {
    const months = this.listMonths(hotelId);
    const result: Record<string, DeliveryItem[]> = {};
    months.forEach((m) => {
      result[m] = this.loadMonth(m, hotelId);
    });
    return result;
  }

  static saveMonthLocallyOnly(
    month: string,
    items: DeliveryItem[],
    username: string,
    hotelId: string = this.getActiveHotelId()
  ): void {
    if (!this.memMonths[hotelId]) {
      this.memMonths[hotelId] = {};
    }

    const seen = new Set<string>();
    const deduped: DeliveryItem[] = [];
    items.forEach((item) => {
      if (item && item.id && !seen.has(item.id)) {
        seen.add(item.id);
        deduped.push({ ...item, hotelId: item.hotelId || hotelId });
      }
    });

    this.memMonths[hotelId][month] = deduped;
    try {
      const payload = {
        schemaVersion: 5,
        app: 'RECEIVING EASY',
        hotelId,
        month,
        savedAt: new Date().toISOString(),
        savedBy: username,
        count: deduped.length,
        deliveries: deduped
      };
      localStorage.setItem(this.getMonthKey(month, hotelId), JSON.stringify(payload));
      if (hotelId === 'hotel_1') {
        localStorage.setItem(this.getLegacyMonthKey(month), JSON.stringify(payload));
      }
    } catch (e) {
      console.warn(`LocalStorage saveMonth (${hotelId}/${month}) error:`, e);
    }
  }

  static saveMonth(
    month: string,
    items: DeliveryItem[],
    username: string,
    hotelId: string = this.getActiveHotelId()
  ): void {
    this.saveMonthLocallyOnly(month, items, username, hotelId);
    FirebaseService.saveMonthDeliveries(hotelId, month, items).catch((err) => {
      console.warn(`Firebase month sync (${hotelId}/${month}):`, err);
    });
  }

  static listMonths(hotelId: string = this.getActiveHotelId()): string[] {
    if (!this.memMonths[hotelId]) {
      this.memMonths[hotelId] = {};
    }
    const list = new Set<string>(Object.keys(this.memMonths[hotelId]));
    const prefix = `${MONTH_KEY_PREFIX}${hotelId}_`;

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;

        if (key.startsWith(prefix)) {
          list.add(key.substring(prefix.length));
        } else if (hotelId === 'hotel_1' && key.startsWith(MONTH_KEY_PREFIX) && !key.includes('_hotel_')) {
          const raw = key.replace(MONTH_KEY_PREFIX, '');
          if (/^\d{4}-\d{2}$/.test(raw)) {
            list.add(raw);
          }
        }
      }
    } catch (e) {
      console.warn(`LocalStorage listMonths (${hotelId}) error:`, e);
    }
    const current = monthOf(getTodayStr());
    list.add(current);
    return Array.from(list).sort().reverse();
  }

  static clearPastMonthsData(
    keepMonth: string,
    hotelId: string = this.getActiveHotelId()
  ): void {
    if (this.memMonths[hotelId]) {
      const nextMem: Record<string, DeliveryItem[]> = {};
      if (this.memMonths[hotelId][keepMonth]) {
        nextMem[keepMonth] = this.memMonths[hotelId][keepMonth];
      }
      this.memMonths[hotelId] = nextMem;
    }

    try {
      const prefix = `${MONTH_KEY_PREFIX}${hotelId}_`;
      const keepKey = this.getMonthKey(keepMonth, hotelId);
      const keysToRemove: string[] = [];

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(prefix) && key !== keepKey) {
          keysToRemove.push(key);
        } else if (hotelId === 'hotel_1' && key && key.startsWith(MONTH_KEY_PREFIX) && !key.includes('_hotel_') && key !== this.getLegacyMonthKey(keepMonth)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
    } catch (e) {
      console.warn(`LocalStorage clearPast (${hotelId}) error:`, e);
    }

    FirebaseService.clearPastDeliveries(hotelId, keepMonth).catch((err) => {
      console.warn(`Firebase clearPastDeliveries (${hotelId}) error:`, err);
    });
  }

  static wipeAllData(hotelId?: string): void {
    const targetHotel = hotelId || this.getActiveHotelId();
    if (hotelId) {
      delete this.memMonths[targetHotel];
      delete this.memUploadHistory[targetHotel];
    } else {
      this.memMonths = {};
      this.memUploadHistory = {};
    }

    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;
        if (hotelId) {
          if (key.includes(targetHotel)) {
            keysToRemove.push(key);
          }
        } else if (key.startsWith('receiving_easy_')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
    } catch (e) {
      console.warn('LocalStorage wipe error:', e);
    }

    FirebaseService.wipeAllDatabase(hotelId).catch((err) => {
      console.warn('Firebase wipe error:', err);
    });
  }
}
