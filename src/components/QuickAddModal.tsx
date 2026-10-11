import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Plus, Package } from 'lucide-react';
import { AppSettings, DeliveryItem } from '../types';
import { T } from '../utils/i18n';
import { getTodayStr, getOrCreateUserId } from '../utils/helpers';

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (item: DeliveryItem) => void;
  settings: AppSettings;
  existingSuppliers: string[];
}

export const QuickAddModal: React.FC<QuickAddModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  settings,
  existingSuppliers
}) => {
  const t = T[settings.language] || T.tr;
  const today = getTodayStr();

  const [supplierName, setSupplierName] = useState('');
  const [supplierPhone, setSupplierPhone] = useState('');
  const [productName, setProductName] = useState('');
  const [orderQty, setOrderQty] = useState('1');
  const [uom, setUom] = useState('KG');
  const [poNumber, setPoNumber] = useState(`PO-${today.replace(/-/g, '').slice(2)}`);
  const [subject, setSubject] = useState('Günlük Mal Kabul');
  const [department, setDepartment] = useState('Main Kitchen');
  const [note, setNote] = useState('');
  const [productTemp, setProductTemp] = useState<number>(4);
  const [truckTemp, setTruckTemp] = useState<number>(4);
  const [expDate, setExpDate] = useState('');

  if (!isOpen) return null;

  const handleSupplierChange = (val: string) => {
    setSupplierName(val);
    if (settings.supplierPhones?.[val]) {
      setSupplierPhone(settings.supplierPhones[val]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierName.trim() || !productName.trim()) return;

    const newItem: DeliveryItem = {
      id: 'item_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      userId: getOrCreateUserId(settings.username),
      supplierName: supplierName.trim(),
      supplierPhone: supplierPhone.trim() || settings.supplierPhones?.[supplierName.trim()] || undefined,
      productName: productName.trim(),
      orderQty: orderQty || '1',
      uom: uom || 'Adet',
      poNumber: poNumber.trim() || 'PO-GENEL',
      subject: subject.trim() || 'Genel Mal Kabul',
      department: department.trim(),
      note: note.trim(),
      expectedDate: today,
      status: 'pending',
      truckCheck: true,
      truckTemp,
      labelCheck: false,
      physicalCheck: false,
      productTemp,
      expDate,
      recordedBy: '',
      recordedAt: '',
      updatedBy: settings.username,
      updatedAt: new Date().toISOString()
    };

    onAdd(newItem);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto"
      >
        <div className="flex items-center justify-between px-5 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-purple-400" />
            <h3 className="font-bold text-sm sm:text-base">{t.add_item_title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Supplier Name & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                {t.supplier} *
              </label>
              <input
                type="text"
                required
                list="supplier-suggestions"
                value={supplierName}
                onChange={(e) => handleSupplierChange(e.target.value)}
                placeholder="Örn: METRO GROSSMARKET"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:border-purple-600 focus:ring-2 focus:ring-purple-100 outline-none font-semibold"
              />
              <datalist id="supplier-suggestions">
                {existingSuppliers.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                {t.sup_phone}
              </label>
              <input
                type="tel"
                value={supplierPhone}
                onChange={(e) => setSupplierPhone(e.target.value)}
                placeholder="+90532..."
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:border-purple-600 focus:ring-2 focus:ring-purple-100 outline-none font-mono"
              />
            </div>
          </div>

          {/* Product Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              {t.product} *
            </label>
            <input
              type="text"
              required
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="Örn: Günlük Taze Süt 1 Lt"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:border-purple-600 focus:ring-2 focus:ring-purple-100 outline-none font-semibold"
            />
          </div>

          {/* Qty & UOM */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                {t.qty}
              </label>
              <input
                type="text"
                value={orderQty}
                onChange={(e) => setOrderQty(e.target.value)}
                placeholder="Örn: 24"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:border-purple-600 outline-none font-semibold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Birim (UOM)
              </label>
              <input
                type="text"
                value={uom}
                onChange={(e) => setUom(e.target.value)}
                placeholder="KG / Adet / Koli / Şişe"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:border-purple-600 outline-none font-semibold"
              />
            </div>
          </div>

          {/* PO Number & Department */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                {t.po_number}
              </label>
              <input
                type="text"
                value={poNumber}
                onChange={(e) => setPoNumber(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:border-purple-600 outline-none font-semibold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                {t.dept}
              </label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="Main Kitchen / Pastry / Bar"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:border-purple-600 outline-none font-semibold"
              />
            </div>
          </div>

          {/* Note / Spec */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              {t.note}
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Örn: +4°C soğuk zincirde teslim edilecek"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:border-purple-600 outline-none"
            />
          </div>

          {/* Temperatures & Exp Date */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                {t.ttemp} (°C)
              </label>
              <input
                type="number"
                step="1"
                value={truckTemp}
                onChange={(e) => setTruckTemp(Math.round(parseFloat(e.target.value) || 0))}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg outline-none font-bold"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                {t.ptemp} (°C)
              </label>
              <input
                type="number"
                step="1"
                value={productTemp}
                onChange={(e) => setProductTemp(Math.round(parseFloat(e.target.value) || 0))}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg outline-none font-bold"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                {t.exp}
              </label>
              <input
                type="date"
                value={expDate}
                onChange={(e) => setExpDate(e.target.value)}
                className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-lg outline-none font-medium"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="flex items-center gap-1 px-5 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>{t.add}</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
