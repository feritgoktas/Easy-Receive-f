import React, { useRef, useState } from 'react';
import {
  UploadCloud,
  Plus,
  Settings,
  AlertCircle,
  FileSpreadsheet,
  RotateCcw,
  Clock,
  User,
  CheckCircle2,
  Trash2,
  Eye,
  X,
  Layers,
  AlertTriangle
} from 'lucide-react';
import { AppSettings, DeliveryItem, UploadBatch } from '../types';
import { T } from '../utils/i18n';
import { getTodayStr, parseDeliveryCSV, monthOf, getOrCreateUserId } from '../utils/helpers';

interface ImportViewProps {
  settings: AppSettings;
  uploadHistory: UploadBatch[];
  allItems: DeliveryItem[];
  onImportItems: (items: DeliveryItem[], batchInfo?: UploadBatch) => void;
  onRollbackUpload: (uploadId: string) => void;
  onQuickAdd: () => void;
  onOpenSettings: () => void;
}

export const ImportView: React.FC<ImportViewProps> = ({
  settings,
  uploadHistory,
  allItems,
  onImportItems,
  onRollbackUpload,
  onQuickAdd,
  onOpenSettings,
}) => {
  const t = T[settings.language] || T.tr;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Duplicate Warning Modal State
  const [duplicateWarning, setDuplicateWarning] = useState<{
    file: File;
    parsed: DeliveryItem[];
    existingBatch: UploadBatch;
  } | null>(null);

  // Rollback Confirmation Modal State
  const [rollbackConfirm, setRollbackConfirm] = useState<UploadBatch | null>(null);

  // Preview Batch Items Modal State
  const [previewBatch, setPreviewBatch] = useState<UploadBatch | null>(null);

  const executeImport = (file: File, parsedItems: DeliveryItem[]) => {
    const uploadId = 'up_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6);
    const now = new Date();
    const formattedDate = `${now.getDate().toString().padStart(2, '0')}.${(now.getMonth() + 1).toString().padStart(2, '0')}.${now.getFullYear()} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const uid = getOrCreateUserId(settings.username);

    // Attach batch ID to all items
    const taggedItems = parsedItems.map((item) => ({
      ...item,
      uploadId,
      userId: item.userId || uid,
      recordedBy: item.recordedBy || settings.username
    }));

    const uniqueSuppliers = Array.from(new Set(taggedItems.map((i) => i.supplierName))).filter(Boolean);
    const targetMonths = Array.from(new Set(taggedItems.map((i) => monthOf(i.expectedDate))));

    const suppliersSummary =
      uniqueSuppliers.length > 2
        ? `${uniqueSuppliers.slice(0, 2).join(', ')} (+${uniqueSuppliers.length - 2} tedarikçi)`
        : uniqueSuppliers.join(', ') || 'Genel Mal Kabul';

    const batchInfo: UploadBatch = {
      id: uploadId,
      fileName: file.name,
      uploadedAt: formattedDate,
      timestamp: Date.now(),
      uploadedBy: settings.username,
      userId: uid,
      itemCount: taggedItems.length,
      itemIds: taggedItems.map((i) => i.id),
      targetMonths,
      suppliersSummary,
      isReverted: false
    };

    onImportItems(taggedItems, batchInfo);
  };

  const processFile = (file: File) => {
    setErrorMsg(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = String(e.target?.result || '');
        const uid = getOrCreateUserId(settings.username);
        const parsed = parseDeliveryCSV(text, getTodayStr(), uid);
        if (parsed.length === 0) {
          setErrorMsg(t.csv_fail || 'CSV dosyasından geçerli kayıt okunamadı.');
          return;
        }

        // Check for duplicate upload (same filename uploaded recently and still active)
        const historyList = uploadHistory || [];
        const recentDuplicate = historyList.find(
          (b) => b && !b.isReverted && ((b.fileName && b.fileName.toLowerCase() === file.name.toLowerCase()) || (b.itemCount === parsed.length && b.timestamp > Date.now() - 24 * 3600 * 1000))
        );

        if (recentDuplicate) {
          // Trigger duplicate confirmation modal
          setDuplicateWarning({
            file,
            parsed,
            existingBatch: recentDuplicate
          });
          return;
        }

        executeImport(file, parsed);
      } catch {
        setErrorMsg(t.csv_fail || 'Dosya işlenirken hata oluştu.');
      }
    };
    reader.readAsText(file, 'utf-8');
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  // Get only top 7 upload records
  const recentSevenUploads = (uploadHistory || []).slice(0, 7);

  // Items for preview modal
  const previewItemsList = previewBatch
    ? (allItems || []).filter(
        (i) => i && (i.uploadId === previewBatch.id || (Array.isArray(previewBatch.itemIds) && previewBatch.itemIds.includes(i.id)))
      )
    : [];

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* Main Upload Box */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-md text-center space-y-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-xs font-bold mb-2">
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Sipariş & Teslimat İçe Aktarımı (v1.2)</span>
          </div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900">{t.importt}</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-lg mx-auto">
            {t.import_desc}
          </p>
        </div>

        {/* Drag & drop dropzone */}
        <div
          id="dropzone-csv-upload"
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-10 cursor-pointer transition-all ${
            dragActive
              ? 'border-purple-600 bg-purple-50/60 scale-[0.99]'
              : 'border-slate-300 bg-slate-50/60 hover:bg-purple-50/20 hover:border-purple-400'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.txt"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                processFile(e.target.files[0]);
                e.target.value = '';
              }
            }}
            className="hidden"
          />
          <div className="w-14 h-14 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center mx-auto mb-3 shadow-inner">
            <UploadCloud className="w-7 h-7" />
          </div>
          <h3 className="font-extrabold text-sm sm:text-base text-slate-800">{t.drop}</h3>
          <span className="text-[11px] text-slate-500 font-medium block mt-1">
            CSV veya TXT dosyası (Virgül, noktalı virgül veya sekme ayrılmış)
          </span>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-bold flex items-center justify-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Expected CSV format explanation */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 text-left space-y-2">
          <span className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider block">
            Örnek CSV Sütun Formatı
          </span>
          <div className="p-2.5 bg-slate-900 text-slate-200 rounded-xl font-mono text-[11px] leading-relaxed overflow-x-auto">
            Supplier name, Phone/WhatsApp, Product name, Order qty, UOM, Price, PO number, Subject, Department, Item #, Note
          </div>
          <p className="text-[11px] text-slate-500 leading-normal">
            Otomatik sütun eşleştirici standart satınalma ve ERP başlıklarını (tedarikçi, telefon/whatsapp, ürün adı, miktar, birim, PO vb.) otomatik algılar.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            id="btn-import-quick-add"
            type="button"
            onClick={onQuickAdd}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t.quickAdd}</span>
          </button>
          <button
            id="btn-import-open-settings"
            type="button"
            onClick={onOpenSettings}
            className="flex items-center justify-center gap-1.5 py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
          >
            <Settings className="w-4 h-4 text-purple-600" />
            <span>{t.settings}</span>
          </button>
        </div>
      </div>

      {/* SECTION: Son 7 Yükleme Geçmişi ve Mükerrer Silme / Geri Alma */}
      <div id="recent-uploads-panel" className="bg-white p-5 sm:p-7 rounded-3xl border border-slate-200/90 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <span>Son 7 Yükleme Geçmişi & Mükerrer Silme</span>
                <span className="px-2 py-0.5 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-[10px] font-bold">
                  {recentSevenUploads.length} / 7
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Operatör mükerrer veya hatalı dosya yüklediğinde ilgili yüklemeyi buradan tek tıkla sistemden silebilir.
              </p>
            </div>
          </div>
        </div>

        {recentSevenUploads.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
            <RotateCcw className="w-7 h-7 text-slate-400 mx-auto" />
            <p className="text-xs font-bold text-slate-600">Henüz kayıtlı bir yükleme geçmişi bulunmuyor.</p>
            <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
              Yukarıdan içe aktarılan CSV/TXT dosyaları burada listelenecektir.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentSevenUploads.map((batch) => {
              const isReverted = batch.isReverted;
              const activeCountInDb = (allItems || []).filter(
                (i) => i && (i.uploadId === batch.id || (Array.isArray(batch.itemIds) && batch.itemIds.includes(i.id)))
              ).length;

              return (
                <div
                  key={batch.id}
                  id={`upload-batch-card-${batch.id}`}
                  className={`p-4 rounded-2xl border transition-all ${
                    isReverted
                      ? 'bg-slate-50 border-slate-200 opacity-60'
                      : 'bg-white border-slate-200/90 hover:border-purple-300 hover:shadow-xs'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    {/* File & Meta info */}
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          isReverted
                            ? 'bg-slate-200 text-slate-500'
                            : 'bg-purple-100 text-purple-700'
                        }`}
                      >
                        <FileSpreadsheet className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-extrabold text-sm text-slate-900 break-all">
                            {batch.fileName}
                          </span>
                          {isReverted ? (
                            <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 text-[10px] font-bold flex items-center gap-1">
                              <RotateCcw className="w-3 h-3" />
                              <span>Geri Alındı / Silindi</span>
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Aktif ({activeCountInDb} kalem)</span>
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>{batch.uploadedAt}</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3 text-slate-400" />
                            <span>{batch.uploadedBy || 'Operatör'}</span>
                            {batch.userId && (
                              <code className="text-[9px] bg-slate-100 text-slate-600 px-1 rounded">
                                {batch.userId.slice(-6)}
                              </code>
                            )}
                          </span>
                          <span className="font-semibold text-purple-700">
                            {batch.suppliersSummary}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                      {/* Preview Button */}
                      <button
                        type="button"
                        id={`btn-preview-batch-${batch.id}`}
                        onClick={() => setPreviewBatch(batch)}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Kalemleri İncele"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>İncele</span>
                      </button>

                      {/* Delete & Rollback Button */}
                      {!isReverted && (
                        <button
                          type="button"
                          id={`btn-rollback-batch-${batch.id}`}
                          onClick={() => setRollbackConfirm(batch)}
                          className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                          title="Bu yüklemeyi veritabanından tamamen sil ve geri al"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                          <span>Yüklemeyi Sil (Geri Al)</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL: Mükerrer Yükleme Uyarısı (Duplicate Warning) */}
      {duplicateWarning && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-black text-slate-900">Mükerrer Yükleme Uyarısı</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                <strong>'{duplicateWarning.file.name}'</strong> dosyası daha önce{' '}
                <strong>{duplicateWarning.existingBatch.uploadedAt}</strong> tarihinde{' '}
                <strong>{duplicateWarning.existingBatch.uploadedBy}</strong> tarafından{' '}
                <strong>({duplicateWarning.existingBatch.itemCount} kalem)</strong> zaten yüklenmiş görünüyor.
              </p>
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-800 space-y-1">
              <p className="font-bold">Öneri:</p>
              <p>Mükerrer kayıt oluşmaması için önceki yüklemeyi silebilir veya yeni liste olarak devam edebilirsiniz.</p>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDuplicateWarning(null)}
                className="flex-1 py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              >
                İptal Et
              </button>
              <button
                type="button"
                onClick={() => {
                  const { file, parsed } = duplicateWarning;
                  setDuplicateWarning(null);
                  executeImport(file, parsed);
                }}
                className="flex-1 py-2.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Yine de Yükle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Yüklemeyi Geri Al & Sil Onayı (Rollback Confirmation) */}
      {rollbackConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-black text-slate-900">Yüklemeyi Silmek İstiyor musunuz?</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                <strong>'{rollbackConfirm.fileName}'</strong> yüklemesine ait toplam{' '}
                <strong>{rollbackConfirm.itemCount} adet mal kabul kaydı</strong> sistemden ve ortak Firebase veritabanından tamamen silinecektir.
              </p>
            </div>

            <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-[11px] text-rose-800 space-y-1">
              <p className="font-bold">⚠️ Dikkat:</p>
              <p>Bu işlem geri alınamaz. Bu partiyle yüklenen tüm kalemler ortak akıştan kaldırılır.</p>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setRollbackConfirm(null)}
                className="flex-1 py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={() => {
                  const id = rollbackConfirm.id;
                  setRollbackConfirm(null);
                  onRollbackUpload(id);
                }}
                className="flex-1 py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
              >
                Evet, Hepsini Sil
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Kalemleri İncele (Preview Batch Items) */}
      {previewBatch && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[85vh] flex flex-col animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-purple-600" />
                <div>
                  <h3 className="text-sm font-black text-slate-900">{previewBatch.fileName}</h3>
                  <span className="text-[11px] text-slate-500">
                    {previewBatch.uploadedAt} • {previewBatch.uploadedBy} • {previewBatch.itemCount} Kalem
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewBatch(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {previewItemsList.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  Bu yüklemeye ait aktif kalem bulunamadı veya silinmiş.
                </div>
              ) : (
                previewItemsList.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs gap-3"
                  >
                    <div>
                      <span className="font-bold text-slate-800 block">{item.productName}</span>
                      <span className="text-[11px] text-slate-500">{item.supplierName}</span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-extrabold text-purple-700">
                        {item.orderQty} {item.uom}
                      </span>
                      <span className="text-[10px] text-slate-400 block">{item.poNumber}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setPreviewBatch(null)}
                className="py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

