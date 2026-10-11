/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { AppSettings, DeliveryItem, DeliveryStatus, HotelConfig, TabType, UploadBatch } from './types';
import { StorageService, mergeDeliveryItems } from './utils/storage';
import { FirebaseService, subscribeToQuotaStatus } from './utils/firebase';
import { DEFAULT_HOTELS } from './utils/helpers';
import { T } from './utils/i18n';
import { getTodayStr, monthOf, nowStamp, trDate, getOrCreateUserId } from './utils/helpers';
import { AlertCircle, ExternalLink, X } from 'lucide-react';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { ReceivingView } from './components/ReceivingView';
import { HistoricalView } from './components/HistoricalView';
import { ReportsView } from './components/ReportsView';
import { AnalyticsView } from './components/AnalyticsView';
import { ImportView } from './components/ImportView';
import { QuickAddModal } from './components/QuickAddModal';
import { SettingsModal } from './components/SettingsModal';
import { MailModal } from './components/MailModal';
import { ChecklistModal } from './components/ChecklistModal';
import { ShortChecklistModal } from './components/ShortChecklistModal';
import { ReportMailModal } from './components/ReportMailModal';
import { ConfirmDialog } from './components/ConfirmDialog';
import { Toast } from './components/Toast';
import { PinAuthModal } from './components/PinAuthModal';
import { UnderConstructionView } from './components/UnderConstructionView';

export default function App() {
  const today = getTodayStr();
  const currentMonth = monthOf(today);

  // Active Hotel State (hotel_1 or hotel_2)
  const [activeHotelId, setActiveHotelId] = useState<string>(() => StorageService.getActiveHotelId());

  // Settings state scoped to active hotel
  const [settings, setSettings] = useState<AppSettings>(() => StorageService.loadSettings(activeHotelId));
  const t = T[settings.language] || T.tr;
  const [cloudConnected, setCloudConnected] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [quotaNoticeVisible, setQuotaNoticeVisible] = useState<boolean>(false);

  // Monthly data state - load all months for active hotel
  const [monthsCache, setMonthsCache] = useState<Record<string, DeliveryItem[]>>(() => {
    return StorageService.loadAllMonths(activeHotelId);
  });

  const [availableMonths, setAvailableMonths] = useState<string[]>(() => StorageService.listMonths(activeHotelId));
  const [selectedHistMonth, setSelectedHistMonth] = useState<string>(currentMonth);

  // Upload History state scoped to active hotel
  const [uploadHistory, setUploadHistory] = useState<UploadBatch[]>(() => StorageService.loadUploadHistory(activeHotelId));

  // PIN Authentication & Under Construction Lockout States
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('receiving_easy_auth_done') === 'true';
    } catch {
      return false;
    }
  });

  const [isPinModalOpen, setIsPinModalOpen] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('receiving_easy_auth_done') !== 'true';
    } catch {
      return true;
    }
  });

  const [isLockedOut, setIsLockedOut] = useState<boolean>(false);

  // Modals state
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isChecklistOpen, setIsChecklistOpen] = useState(false);
  const [isShortChecklistOpen, setIsShortChecklistOpen] = useState(false);
  const [isReportMailOpen, setIsReportMailOpen] = useState(false);
  const [reportMailRange, setReportMailRange] = useState<{ from: string; to: string }>({ from: today, to: today });
  const [mailSupplier, setMailSupplier] = useState<string | null>(null);

  // Toasts
  const [toastInfo, setToastInfo] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastInfo({ message, type });
    toastTimerRef.current = setTimeout(() => {
      setToastInfo(null);
    }, 2800);
  }, []);

  // Switch Active Hotel Handler
  const handleSelectHotel = useCallback((newHotelId: string) => {
    if (newHotelId === activeHotelId) return;

    StorageService.setActiveHotelId(newHotelId);
    setActiveHotelId(newHotelId);

    // Load state for selected hotel
    const loadedSettings = StorageService.loadSettings(newHotelId);
    const loadedMonths = StorageService.loadAllMonths(newHotelId);
    const loadedHistory = StorageService.loadUploadHistory(newHotelId);
    const monthsList = StorageService.listMonths(newHotelId);

    setSettings(loadedSettings);
    setMonthsCache(loadedMonths);
    setUploadHistory(loadedHistory);
    setAvailableMonths(monthsList);
    setSelectedHistMonth(currentMonth);

    const hotelName =
      (loadedSettings.hotels || DEFAULT_HOTELS).find((h) => h.id === newHotelId)?.name ||
      (newHotelId === 'hotel_2' ? 'Istanbul' : 'Bosphorus');
    
    showToast(`Aktif Otel Değiştirildi: ${hotelName}`, 'success');
  }, [activeHotelId, currentMonth, showToast]);

  // Firestore Realtime Synchronization across all browsers & devices for ACTIVE HOTEL
  useEffect(() => {
    let isMounted = true;

    // 1. Connection check
    FirebaseService.checkConnection().then((connected) => {
      if (isMounted) setCloudConnected(connected);
    });

    // 2. Track Firestore quota status
    const unsubscribeQuota = subscribeToQuotaStatus((exceeded) => {
      if (isMounted) {
        setQuotaNoticeVisible(exceeded);
      }
    });

    // 3. Live realtime listener for ALL deliveries for the ACTIVE HOTEL
    const unsubscribeMonths = FirebaseService.subscribeToMonthsMap(activeHotelId, (remoteMonthsMap) => {
      if (!isMounted) return;
      if (remoteMonthsMap && typeof remoteMonthsMap === 'object') {
        setMonthsCache((prev) => {
          const merged: Record<string, DeliveryItem[]> = { ...prev };
          const allMonthKeys = Array.from(
            new Set([
              ...Object.keys(prev),
              ...Object.keys(remoteMonthsMap),
              ...StorageService.listMonths(activeHotelId)
            ])
          );

          allMonthKeys.forEach((m) => {
            const localItems = prev[m] || StorageService.loadMonth(m, activeHotelId);
            const remoteItems = remoteMonthsMap[m] || [];
            const combined = mergeDeliveryItems(localItems, remoteItems);
            merged[m] = combined;
            StorageService.saveMonthLocallyOnly(m, combined, settings.username, activeHotelId);

            // Sync difference to cloud if local had more items
            if (
              combined.length > remoteItems.length ||
              combined.some((c, idx) => c.updatedAt !== remoteItems[idx]?.updatedAt)
            ) {
              FirebaseService.saveMonthDeliveries(activeHotelId, m, combined, false);
            }
          });

          return merged;
        });
        setAvailableMonths(StorageService.listMonths(activeHotelId));
      }
    });

    // 4. Live realtime listener for Application Settings of ACTIVE HOTEL
    const unsubscribeSettings = FirebaseService.subscribeToSettings(activeHotelId, (remoteSettings) => {
      if (!isMounted) return;
      if (remoteSettings) {
        setSettings((prev) => ({ ...prev, ...remoteSettings, hotelId: activeHotelId }));
        StorageService.saveSettingsLocallyOnly(remoteSettings, activeHotelId);
      }
    });

    // 5. Live realtime listener for Upload History of ACTIVE HOTEL
    const unsubscribeUploadHistory = FirebaseService.subscribeToUploadHistory(activeHotelId, (remoteBatches) => {
      if (!isMounted) return;
      if (remoteBatches && Array.isArray(remoteBatches)) {
        setUploadHistory(remoteBatches);
        StorageService.saveUploadHistoryLocallyOnly(remoteBatches, activeHotelId);
      }
    });

    return () => {
      isMounted = false;
      unsubscribeQuota();
      unsubscribeMonths();
      unsubscribeSettings();
      unsubscribeUploadHistory();
    };
  }, [activeHotelId, settings.username]);

  // Periodic automatic sync to Firebase every 30 seconds for all cached months of active hotel
  useEffect(() => {
    const syncInterval = setInterval(() => {
      if (cloudConnected && !quotaNoticeVisible) {
        Object.keys(monthsCache).forEach((m) => {
          const list = monthsCache[m];
          if (list && list.length > 0) {
            FirebaseService.saveMonthDeliveries(activeHotelId, m, list, false);
          }
        });
      }
    }, 30000);

    return () => clearInterval(syncInterval);
  }, [activeHotelId, monthsCache, cloudConnected, quotaNoticeVisible]);

  // Keyboard Shortcuts for Speed & Efficiency
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid triggering when focused inside text inputs, textareas, or modals
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable;

      // Global hotkeys (Alt + 1 / Alt + 2 for hotel switch)
      if (e.altKey && e.key === '1') {
        e.preventDefault();
        handleSelectHotel('hotel_1');
        return;
      }
      if (e.altKey && e.key === '2') {
        e.preventDefault();
        handleSelectHotel('hotel_2');
        return;
      }

      // Quick Search hotkey (Ctrl + K or Alt + S)
      if ((e.ctrlKey && e.key === 'k') || (e.altKey && (e.key === 's' || e.key === 'S'))) {
        e.preventDefault();
        const searchInput = document.getElementById('input-search-receiving');
        if (searchInput) {
          searchInput.focus();
        }
        return;
      }

      // Quick Add hotkey (Alt + Q)
      if (e.altKey && (e.key === 'q' || e.key === 'Q')) {
        e.preventDefault();
        setIsQuickAddOpen(true);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSelectHotel]);

  // Navigation & Filter States
  const [activeTab, setActiveTab] = useState<TabType>('receiving');
  const [hideDone, setHideDone] = useState<boolean>(true);
  const [showPrev, setShowPrev] = useState<boolean>(false);
  const [selectedSupplier, setSelectedSupplier] = useState<string>('ALL');

  // Confirm dialog state
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title?: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    message: '',
    onConfirm: () => {}
  });

  // PIN Authentication Handlers
  const handlePinSuccess = (selectedUser: string) => {
    try {
      sessionStorage.setItem('receiving_easy_auth_done', 'true');
    } catch {}
    setIsAuthenticated(true);
    setIsPinModalOpen(false);
    setIsLockedOut(false);

    if (selectedUser && selectedUser !== settings.username) {
      const updated: AppSettings = {
        ...settings,
        username: selectedUser,
        staffList: Array.from(new Set([...(settings.staffList || []), selectedUser]))
      };
      setSettings(updated);
      StorageService.saveSettings(updated, activeHotelId);
    }
    showToast(`Giriş Başarılı: ${selectedUser}`, 'success');
  };

  const handlePinFail = () => {
    setIsPinModalOpen(false);
    setIsLockedOut(true);
    setIsAuthenticated(false);
    try {
      sessionStorage.removeItem('receiving_easy_auth_done');
    } catch {}
  };

  const handleSwitchUser = () => {
    setIsPinModalOpen(true);
  };

  // Ensure historical month is cached
  const ensureMonthLoaded = (month: string) => {
    if (!monthsCache[month]) {
      const loaded = StorageService.loadMonth(month, activeHotelId);
      setMonthsCache((prev) => ({ ...prev, [month]: loaded }));
    }
  };

  useEffect(() => {
    ensureMonthLoaded(selectedHistMonth);
  }, [selectedHistMonth, activeHotelId]);

  // Persist settings changes to LocalStorage and Firestore
  const handleSaveSettings = (newSettings: AppSettings) => {
    const withHotel = { ...newSettings, hotelId: activeHotelId };
    setSettings(withHotel);
    StorageService.saveSettings(withHotel, activeHotelId);
  };

  // Get flat list of all loaded items for active hotel
  const getAllLoadedItems = (): DeliveryItem[] => {
    const list: DeliveryItem[] = [];
    Object.values(monthsCache).forEach((mList) => {
      if (Array.isArray(mList)) list.push(...mList);
    });
    return list;
  };

  // Update a single item in LocalStorage and Firestore Database
  const handleUpdateItem = (id: string, patch: Partial<DeliveryItem>) => {
    setMonthsCache((prev) => {
      const next = { ...prev };
      for (const m of Object.keys(next)) {
        const idx = next[m].findIndex((i) => i.id === id);
        if (idx >= 0) {
          const updatedItem: DeliveryItem = {
            ...next[m][idx],
            ...patch,
            hotelId: activeHotelId,
            updatedBy: settings.username,
            updatedAt: nowStamp()
          };
          const nextList = [...next[m]];
          nextList[idx] = updatedItem;
          next[m] = nextList;
          StorageService.saveMonthLocallyOnly(m, nextList, settings.username, activeHotelId);
          FirebaseService.saveMonthDeliveries(activeHotelId, m, nextList);
          break;
        }
      }
      return next;
    });
  };

  // Update status of item
  const handleSetStatus = (id: string, status: DeliveryStatus, note?: string) => {
    const extra = status === 'approved' ? { labelCheck: true, physicalCheck: true, truckCheck: true } : {};
    const recorded =
      status === 'pending'
        ? { recordedBy: '', recordedAt: '' }
        : { recordedBy: settings.username, recordedAt: nowStamp() };
    const noteUpdate = note !== undefined ? { note } : {};

    handleUpdateItem(id, {
      status,
      ...extra,
      ...recorded,
      ...noteUpdate
    });
  };

  // Bulk approve all items in a PO
  const handleApproveAll = (supplier: string, po: string) => {
    const stamp = nowStamp();
    setMonthsCache((prev) => {
      const next = { ...prev };
      for (const m of Object.keys(next)) {
        let changed = false;
        const nextList = next[m].map((item) => {
          if (item.supplierName === supplier && item.poNumber === po && item.status === 'pending') {
            changed = true;
            const updated: DeliveryItem = {
              ...item,
              status: 'approved' as DeliveryStatus,
              truckCheck: true,
              labelCheck: true,
              physicalCheck: true,
              hotelId: activeHotelId,
              recordedBy: settings.username,
              recordedAt: stamp,
              updatedBy: settings.username,
              updatedAt: stamp
            };
            return updated;
          }
          return item;
        });
        if (changed) {
          next[m] = nextList;
          StorageService.saveMonthLocallyOnly(m, nextList, settings.username, activeHotelId);
          FirebaseService.saveMonthDeliveries(activeHotelId, m, nextList);
        }
      }
      return next;
    });
    showToast(`${po} içindeki tüm bekleyen kalemler kabul edildi!`, 'success');
  };

  // Supplier-level truck check / temperature change
  const handleSupplierTruckChange = (supplier: string, truckCheck: boolean, truckTemp?: number) => {
    setMonthsCache((prev) => {
      const next = { ...prev };
      for (const m of Object.keys(next)) {
        let changed = false;
        const nextList = next[m].map((item) => {
          if (item.supplierName === supplier && item.expectedDate <= today) {
            changed = true;
            const updated = {
              ...item,
              truckCheck,
              truckTemp: truckTemp !== undefined ? truckTemp : item.truckTemp,
              hotelId: activeHotelId,
              updatedBy: settings.username,
              updatedAt: nowStamp()
            };
            return updated;
          }
          return item;
        });
        if (changed) {
          next[m] = nextList;
          StorageService.saveMonthLocallyOnly(m, nextList, settings.username, activeHotelId);
          FirebaseService.saveMonthDeliveries(activeHotelId, m, nextList);
        }
      }
      return next;
    });
  };

  // Pull previous delivery expiration date for an item
  const handlePullPrevExp = (id: string) => {
    const all = getAllLoadedItems();
    const current = all.find((x) => x.id === id);
    if (!current) return;

    const prevCandidate = all
      .filter(
        (x) =>
          x.id !== id &&
          x.expDate &&
          x.supplierName === current.supplierName &&
          x.productName.toLowerCase() === current.productName.toLowerCase() &&
          x.expectedDate <= current.expectedDate
      )
      .sort((a, b) => b.expectedDate.localeCompare(a.expectedDate))[0];

    if (!prevCandidate || !prevCandidate.expDate) {
      showToast(t.prev_none, 'info');
      return;
    }

    handleUpdateItem(id, { expDate: prevCandidate.expDate });
    showToast(`${t.prev_found}: ${trDate(prevCandidate.expDate)}`, 'success');
  };

  // Add a new item manually with current userId and hotelId
  const handleAddItem = (newItem: DeliveryItem) => {
    const itemWithHotel: DeliveryItem = {
      ...newItem,
      hotelId: activeHotelId,
      userId: newItem.userId || getOrCreateUserId(settings.username),
      updatedBy: settings.username
    };
    const itemMonth = monthOf(itemWithHotel.expectedDate);
    setMonthsCache((prev) => {
      const currentList = prev[itemMonth] || StorageService.loadMonth(itemMonth, activeHotelId);
      const nextList = [itemWithHotel, ...currentList];
      StorageService.saveMonthLocallyOnly(itemMonth, nextList, settings.username, activeHotelId);
      FirebaseService.saveMonthDeliveries(activeHotelId, itemMonth, nextList);
      return { ...prev, [itemMonth]: nextList };
    });
    setAvailableMonths(StorageService.listMonths(activeHotelId));
    showToast('Yeni mal kabul kalemi ortak akışa eklendi', 'success');
  };

  // Import batch of items from CSV with audit history
  const handleImportItems = (newItems: DeliveryItem[], batchInfo?: UploadBatch) => {
    if (!newItems.length) return;
    const updatedPhones = { ...(settings.supplierPhones || {}) };
    let phonesUpdated = false;
    const currentUid = getOrCreateUserId(settings.username);

    const enrichedItems = newItems.map((item) => {
      if (item.supplierPhone && !updatedPhones[item.supplierName]) {
        updatedPhones[item.supplierName] = item.supplierPhone;
        phonesUpdated = true;
      }
      return {
        ...item,
        hotelId: activeHotelId,
        userId: item.userId || currentUid,
        supplierPhone: item.supplierPhone || updatedPhones[item.supplierName] || undefined
      };
    });

    if (phonesUpdated) {
      const nextSettings = { ...settings, supplierPhones: updatedPhones };
      setSettings(nextSettings);
      StorageService.saveSettings(nextSettings, activeHotelId);
    }

    const byMonth: Record<string, DeliveryItem[]> = {};
    enrichedItems.forEach((i) => {
      const m = monthOf(i.expectedDate);
      byMonth[m] = byMonth[m] || [];
      byMonth[m].push(i);
    });

    setMonthsCache((prev) => {
      const next = { ...prev };
      Object.keys(byMonth).forEach((m) => {
        const existing = next[m] || StorageService.loadMonth(m, activeHotelId);
        const existingMap = new Map<string, DeliveryItem>(existing.map((item) => [item.id, item]));
        byMonth[m].forEach((item) => {
          existingMap.set(item.id, item);
        });
        const combined: DeliveryItem[] = Array.from(existingMap.values());
        next[m] = combined;
        StorageService.saveMonthLocallyOnly(m, combined, settings.username, activeHotelId);
        FirebaseService.saveMonthDeliveries(activeHotelId, m, combined);
      });
      return next;
    });

    if (batchInfo) {
      const batchWithHotel: UploadBatch = { ...batchInfo, hotelId: activeHotelId };
      const updatedHistory = StorageService.addUploadBatch(batchWithHotel, activeHotelId);
      setUploadHistory(updatedHistory);
    }

    setAvailableMonths(StorageService.listMonths(activeHotelId));
    setActiveTab('receiving');
    showToast(`${enrichedItems.length} ${t.csv_done}`, 'success');
  };

  // Rollback and delete a specific upload batch across all months
  const handleRollbackUpload = (uploadId: string) => {
    const batch = uploadHistory.find((b) => b.id === uploadId);
    const targetItemIds = new Set(batch ? batch.itemIds : []);
    const fileName = batch?.fileName || 'Yükleme';

    setMonthsCache((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((m) => {
        const initialCount = next[m].length;
        const filtered = next[m].filter(
          (item) => item.uploadId !== uploadId && !targetItemIds.has(item.id)
        );
        if (filtered.length !== initialCount) {
          next[m] = filtered;
          StorageService.saveMonthLocallyOnly(m, filtered, settings.username, activeHotelId);
          FirebaseService.saveMonthDeliveries(activeHotelId, m, filtered);
        }
      });
      return next;
    });

    const updatedHistory = StorageService.updateUploadBatch(uploadId, { isReverted: true }, activeHotelId);
    setUploadHistory(updatedHistory);
    showToast(`'${fileName}' yüklemesine ait kayıtlar silindi ve başarıyla geri alındı.`, 'success');
  };

  // Manual Cloud Sync for all cached deliveries and settings of active hotel
  const handleManualSyncToCloud = async () => {
    setIsSyncing(true);
    try {
      const months = Object.keys(monthsCache);
      for (const m of months) {
        await FirebaseService.saveMonthDeliveries(activeHotelId, m, monthsCache[m] || []);
      }
      await FirebaseService.saveSettings(activeHotelId, settings);
      showToast('Tüm veriler Firebase ortak veritabanına başarıyla kaydedildi!', 'success');
    } catch (err) {
      console.error('Cloud sync error:', err);
      showToast('Bulut eşitleme tamamlanırken uyarı alındı, yerel depolama korundu.', 'info');
    } finally {
      setIsSyncing(false);
    }
  };

  // Save historical staged edits
  const handleSaveHistEdits = (edits: Record<string, Partial<DeliveryItem>>) => {
    const ids = Object.keys(edits);
    if (!ids.length) return;

    setMonthsCache((prev) => {
      const next = { ...prev };
      const affectedMonths = new Set<string>();

      for (const m of Object.keys(next)) {
        let monthChanged = false;
        const nextList = next[m].map((item) => {
          if (edits[item.id]) {
            monthChanged = true;
            return {
              ...item,
              ...edits[item.id],
              hotelId: activeHotelId,
              updatedBy: settings.username,
              updatedAt: nowStamp()
            };
          }
          return item;
        });

        if (monthChanged) {
          next[m] = nextList;
          affectedMonths.add(m);
        }
      }

      affectedMonths.forEach((m) => {
        StorageService.saveMonth(m, next[m], settings.username, activeHotelId);
      });

      return next;
    });

    showToast(`${ids.length} ${t.hist_saved}`, 'success');
  };

  // Delete single item with confirmation
  const handleDeleteItem = (id: string) => {
    setConfirmState({
      isOpen: true,
      title: t.del,
      message: t.del_confirm,
      onConfirm: () => {
        setMonthsCache((prev) => {
          const next = { ...prev };
          for (const m of Object.keys(next)) {
            const idx = next[m].findIndex((i) => i.id === id);
            if (idx >= 0) {
              const nextList = next[m].filter((i) => i.id !== id);
              next[m] = nextList;
              StorageService.saveMonth(m, nextList, settings.username, activeHotelId);
              break;
            }
          }
          return next;
        });
        setConfirmState((p) => ({ ...p, isOpen: false }));
        showToast(t.deleted, 'info');
      }
    });
  };

  // Reset supplier directory only (phones, emails, rules) for active hotel
  const handleResetSuppliersOnly = () => {
    const nextSettings: AppSettings = {
      ...settings,
      supplierEmails: {},
      supplierPhones: {},
      supplierRules: {}
    };
    setSettings(nextSettings);
    StorageService.saveSettings(nextSettings, activeHotelId);
    FirebaseService.resetSupplierDirectory(activeHotelId);
    showToast('Tedarikçi rehberi ve iletişim bilgileri temizlendi.', 'success');
  };

  // Clear past deliveries for active hotel
  const handleClearPastDeliveries = () => {
    StorageService.clearPastMonthsData(currentMonth, activeHotelId);
    setMonthsCache((prev) => ({
      [currentMonth]: prev[currentMonth] || []
    }));
    setAvailableMonths([currentMonth]);
    setSelectedHistMonth(currentMonth);
    showToast('Geçmiş aylara ait teslimat kayıtları temizlendi.', 'success');
  };

  // Wipe all data and database for active hotel
  const handleResetAll = () => {
    StorageService.wipeAllData(activeHotelId);
    setMonthsCache({ [currentMonth]: [] });
    setAvailableMonths([currentMonth]);
    setIsSettingsOpen(false);
    setActiveTab('receiving');
    showToast(t.reset_done, 'info');
  };

  const allItems = getAllLoadedItems();
  const pendingReceivingCount = allItems.filter(
    (i) => i.expectedDate <= today && i.status === 'pending'
  ).length;

  const allKnownSuppliers = Array.from(
    new Set([...allItems.map((i) => i.supplierName), ...Object.keys(settings.supplierEmails || {})])
  ).filter(Boolean).sort((a, b) => a.localeCompare(b, 'tr'));

  const hotelList = settings.hotels && settings.hotels.length > 0 ? settings.hotels : DEFAULT_HOTELS;

  // If locked out due to wrong PIN -> Render Under Construction view
  if (isLockedOut) {
    return (
      <UnderConstructionView
        settings={settings}
        onRetryPin={() => {
          setIsLockedOut(false);
          setIsPinModalOpen(true);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-purple-100 selection:text-purple-900 pb-16 md:pb-6">
      {/* Top Header with 2-Hotel Switcher & Speed Tools */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        settings={settings}
        activeHotelId={activeHotelId}
        onSelectHotel={handleSelectHotel}
        hotels={hotelList}
        cloudConnected={cloudConnected && !quotaNoticeVisible}
        isSyncing={isSyncing}
        onSaveToCloud={handleManualSyncToCloud}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onQuickAdd={() => setIsQuickAddOpen(true)}
        onSwitchUser={handleSwitchUser}
      />

      {/* Firestore Quota Notice Banner */}
      {quotaNoticeVisible && (
        <div id="firestore-quota-notice-banner" className="bg-amber-500/10 border-b border-amber-500/30 px-4 py-2.5 text-xs text-amber-900 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 max-w-5xl">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Bulut Veritabanı Kota Uyarısı:</strong> Günlük ücretsiz Firestore yazma kotası sınırına ulaşıldı. Verileriniz güvenle <strong>Yerel Depolamada (LocalStorage)</strong> kaydedilmeye devam etmektedir ve hiçbir veri kaybı yaşanmaz. Kota yarın otomatik sıfırlanacaktır.
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <a
              href="https://console.firebase.google.com/project/expanded-furnace-lc9s2/firestore/databases/ai-studio-receivingeasy-c5be2f0c-6157-424c-bc3b-418ea02d1b8e/data?openUpgradeDialog=true"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] transition-colors shadow-2xs"
            >
              <span>Firebase Planı Yükselt</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <button
              type="button"
              onClick={() => setQuotaNoticeVisible(false)}
              className="p-1 text-amber-700 hover:text-amber-900 rounded"
              title="Kapat"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6">
        {activeTab === 'receiving' && (
          <ReceivingView
            items={allItems}
            settings={settings}
            hideDone={hideDone}
            setHideDone={setHideDone}
            showPrev={showPrev}
            setShowPrev={setShowPrev}
            selectedSupplier={selectedSupplier}
            setSelectedSupplier={setSelectedSupplier}
            onUpdateItem={handleUpdateItem}
            onSetStatus={handleSetStatus}
            onApproveAll={handleApproveAll}
            onSupplierTruckChange={handleSupplierTruckChange}
            onPullPrevExp={handlePullPrevExp}
            onOpenMailModal={(sup) => setMailSupplier(sup)}
            onQuickAdd={() => setIsQuickAddOpen(true)}
            onSaveToCloud={handleManualSyncToCloud}
            isSyncing={isSyncing}
          />
        )}

        {activeTab === 'historical' && (
          <HistoricalView
            items={monthsCache[selectedHistMonth] || []}
            availableMonths={availableMonths}
            selectedMonth={selectedHistMonth}
            onSelectMonth={setSelectedHistMonth}
            settings={settings}
            onSaveEdits={handleSaveHistEdits}
            onDeleteItem={handleDeleteItem}
            onSaveToCloud={handleManualSyncToCloud}
            isSyncing={isSyncing}
          />
        )}

        {activeTab === 'reports' && (
          <ReportsView
            items={allItems}
            settings={settings}
            onOpenChecklistModal={() => setIsChecklistOpen(true)}
            onOpenShortChecklistModal={() => setIsShortChecklistOpen(true)}
            onOpenReportMailModal={(from, to) => {
              setReportMailRange({ from, to });
              setIsReportMailOpen(true);
            }}
            onCopied={() => showToast(t.copied, 'success')}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsView
            items={allItems}
            settings={settings}
          />
        )}

        {activeTab === 'import' && (
          <ImportView
            settings={settings}
            uploadHistory={uploadHistory}
            allItems={allItems}
            onImportItems={handleImportItems}
            onRollbackUpload={handleRollbackUpload}
            onQuickAdd={() => setIsQuickAddOpen(true)}
            onOpenSettings={() => setIsSettingsOpen(true)}
          />
        )}
      </main>

      {/* Bottom Navigation for Mobile / Tablet */}
      <BottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        language={settings.language}
        pendingCount={pendingReceivingCount}
        onQuickAdd={() => setIsQuickAddOpen(true)}
      />

      {/* PIN Authentication Modal Gatekeeper */}
      <PinAuthModal
        isOpen={isPinModalOpen}
        settings={settings}
        onSuccess={handlePinSuccess}
        onFail={handlePinFail}
      />

      {/* Modals */}
      <QuickAddModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        onAdd={handleAddItem}
        settings={settings}
        existingSuppliers={allKnownSuppliers}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        activeHotelId={activeHotelId}
        onSelectHotel={handleSelectHotel}
        onSaveSettings={handleSaveSettings}
        onResetAll={handleResetAll}
        onResetSuppliersOnly={handleResetSuppliersOnly}
        onClearPastDeliveries={handleClearPastDeliveries}
        onLoadSampleData={(items, batch) => handleImportItems(items, batch)}
        allSuppliers={allKnownSuppliers}
        totalRecordsCount={allItems.length}
      />

      <ChecklistModal
        isOpen={isChecklistOpen}
        onClose={() => setIsChecklistOpen(false)}
        items={allItems}
        settings={settings}
      />

      <ShortChecklistModal
        isOpen={isShortChecklistOpen}
        onClose={() => setIsShortChecklistOpen(false)}
        items={allItems}
        settings={settings}
        onDownloaded={(msg) => showToast(msg, 'success')}
      />

      <ReportMailModal
        isOpen={isReportMailOpen}
        onClose={() => setIsReportMailOpen(false)}
        items={allItems.filter(
          (i) => i.expectedDate >= reportMailRange.from && i.expectedDate <= reportMailRange.to
        )}
        from={reportMailRange.from}
        to={reportMailRange.to}
        settings={settings}
        onPrintPdf={() => {
          showToast(t.pdf_ready, 'info');
        }}
      />

      {mailSupplier && (
        <MailModal
          isOpen={true}
          onClose={() => setMailSupplier(null)}
          supplierName={mailSupplier}
          items={allItems.filter(
            (i) => i.supplierName === mailSupplier && i.status === 'pending' && i.expectedDate <= today
          )}
          settings={settings}
          onCopied={() => showToast(t.copied, 'success')}
        />
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        onConfirm={confirmState.onConfirm}
        onCancel={() => setConfirmState((p) => ({ ...p, isOpen: false }))}
      />

      {/* Global Floating Toast */}
      <Toast message={toastInfo?.message || null} type={toastInfo?.type} />
    </div>
  );
}
