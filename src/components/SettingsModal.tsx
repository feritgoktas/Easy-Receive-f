import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  X,
  Settings,
  Mail,
  Truck,
  FileText,
  ShieldCheck,
  Trash2,
  Plus,
  Info,
  Phone,
  MessageSquare,
  KeyRound,
  Users,
  AlertTriangle,
  History,
  Check,
  Eye,
  EyeOff,
  Sparkles,
  Database,
  Lock,
  Loader2,
  Building2
} from 'lucide-react';
import { AppSettings, DeliveryItem, EmailTemplate, HotelConfig, SupplierRule, UploadBatch } from '../types';
import { DEFAULT_HOTELS } from '../utils/helpers';
import { T } from '../utils/i18n';
import { generateSampleDataset, SAMPLE_SUPPLIERS } from '../utils/sampleDataGenerator';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  activeHotelId?: string;
  onSelectHotel?: (hotelId: string) => void;
  onSaveSettings: (settings: AppSettings) => void;
  onResetAll: () => void;
  onResetSuppliersOnly?: () => void;
  onClearPastDeliveries?: () => void;
  onLoadSampleData?: (items: DeliveryItem[], batch: UploadBatch) => void;
  allSuppliers: string[];
  totalRecordsCount: number;
}

type SettingsTab = 'general' | 'hotels' | 'emails' | 'suppliers' | 'rules' | 'templates';

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  activeHotelId,
  onSelectHotel,
  onSaveSettings,
  onResetAll,
  onResetSuppliersOnly,
  onClearPastDeliveries,
  onLoadSampleData,
  allSuppliers,
  totalRecordsCount
}) => {
  const t = T[settings.language] || T.tr;
  const [currentTab, setCurrentTab] = useState<SettingsTab>('general');
  const [formState, setFormState] = useState<AppSettings>(JSON.parse(JSON.stringify(settings)));
  const [newSupName, setNewSupName] = useState('');
  const [newSupEmail, setNewSupEmail] = useState('');
  const [newSupPhone, setNewSupPhone] = useState('');
  const [pasteText, setPasteText] = useState('');
  const [newExtraKeyword, setNewExtraKeyword] = useState('');
  const [newStaffInput, setNewStaffInput] = useState('');
  const [showPin, setShowPin] = useState<boolean>(false);

  // Confirmation dialog states
  const [confirmAction, setConfirmAction] = useState<{
    type: 'suppliers' | 'past' | 'all';
    title: string;
    description: string;
    buttonText: string;
    dangerLevel: 'amber' | 'rose' | 'red';
  } | null>(null);

  // Sample data password modal states
  const [isSamplePasswordModalOpen, setIsSamplePasswordModalOpen] = useState(false);
  const [samplePasswordInput, setSamplePasswordInput] = useState('');
  const [samplePasswordError, setSamplePasswordError] = useState('');
  const [showSamplePassword, setShowSamplePassword] = useState(false);
  const [isGeneratingSample, setIsGeneratingSample] = useState(false);

  if (!isOpen) return null;

  const handleFieldChange = (key: keyof AppSettings, value: unknown) => {
    const updated = { ...formState, [key]: value };
    setFormState(updated);
    onSaveSettings(updated);
  };

  const handleEmailChange = (field: keyof AppSettings['emails'], value: string) => {
    const updated = {
      ...formState,
      emails: { ...formState.emails, [field]: value }
    };
    setFormState(updated);
    onSaveSettings(updated);
  };

  const handleSupplierEmailChange = (supplier: string, email: string) => {
    const updated = {
      ...formState,
      supplierEmails: { ...formState.supplierEmails, [supplier]: email.trim() }
    };
    setFormState(updated);
    onSaveSettings(updated);
  };

  const handleSupplierPhoneChange = (supplier: string, phone: string) => {
    const updated = {
      ...formState,
      supplierPhones: { ...(formState.supplierPhones || {}), [supplier]: phone.trim() }
    };
    setFormState(updated);
    onSaveSettings(updated);
  };

  const handleHotelConfigChange = (hotelId: string, field: keyof HotelConfig, value: string) => {
    const currentHotels = formState.hotels && formState.hotels.length > 0 ? formState.hotels : DEFAULT_HOTELS;
    const updatedHotels = currentHotels.map((h) => (h.id === hotelId ? { ...h, [field]: value } : h));
    const updated = { ...formState, hotels: updatedHotels };
    setFormState(updated);
    onSaveSettings(updated);
  };

  const handleAddSupplier = () => {
    if (!newSupName.trim()) return;
    const name = newSupName.trim();
    const updated = {
      ...formState,
      supplierEmails: {
        ...formState.supplierEmails,
        [name]: newSupEmail.trim()
      },
      supplierPhones: {
        ...(formState.supplierPhones || {}),
        [name]: newSupPhone.trim()
      }
    };
    setFormState(updated);
    onSaveSettings(updated);
    setNewSupName('');
    setNewSupEmail('');
    setNewSupPhone('');
  };

  const handleDeleteSupplier = (supplier: string) => {
    const nextEmails = { ...formState.supplierEmails };
    delete nextEmails[supplier];
    const nextPhones = { ...(formState.supplierPhones || {}) };
    delete nextPhones[supplier];
    const nextRules = { ...(formState.supplierRules || {}) };
    delete nextRules[supplier];
    const updated = { ...formState, supplierEmails: nextEmails, supplierPhones: nextPhones, supplierRules: nextRules };
    setFormState(updated);
    onSaveSettings(updated);
  };

  const handlePasteImport = () => {
    if (!pasteText.trim()) return;
    const lines = pasteText.split('\n');
    const newEmails = { ...formState.supplierEmails };
    const newPhones = { ...(formState.supplierPhones || {}) };

    lines.forEach((line) => {
      const parts = line.split(/[;,|\t]/);
      if (parts.length >= 2) {
        const name = parts[0].trim();
        const second = parts[1].trim();
        const third = (parts[2] || '').trim();

        if (name) {
          if (second.includes('@')) {
            newEmails[name] = second;
            if (third) newPhones[name] = third;
          } else {
            newPhones[name] = second;
            if (third && third.includes('@')) newEmails[name] = third;
          }
        }
      }
    });

    const updated = { ...formState, supplierEmails: newEmails, supplierPhones: newPhones };
    setFormState(updated);
    onSaveSettings(updated);
    setPasteText('');
  };

  const handleRuleToggle = (supplier: string, field: 'exp' | 'temp', checked: boolean) => {
    const currentRule = formState.supplierRules[supplier] || {};
    const updatedRules: Record<string, SupplierRule> = {
      ...formState.supplierRules,
      [supplier]: {
        ...currentRule,
        [field]: checked
      }
    };
    const updated = { ...formState, supplierRules: updatedRules };
    setFormState(updated);
    onSaveSettings(updated);
  };

  const handleAddExtraKeyword = () => {
    if (!newExtraKeyword.trim()) return;
    const kw = newExtraKeyword.trim().toLowerCase();
    if (!formState.extraCheckProducts.includes(kw)) {
      const updated = {
        ...formState,
        extraCheckProducts: [...formState.extraCheckProducts, kw]
      };
      setFormState(updated);
      onSaveSettings(updated);
    }
    setNewExtraKeyword('');
  };

  const handleRemoveExtraKeyword = (index: number) => {
    const updated = {
      ...formState,
      extraCheckProducts: formState.extraCheckProducts.filter((_, i) => i !== index)
    };
    setFormState(updated);
    onSaveSettings(updated);
  };

  const handleTemplateChange = (
    lang: 'tr' | 'en',
    field: keyof EmailTemplate,
    val: unknown
  ) => {
    const updated = {
      ...formState,
      templates: {
        ...formState.templates,
        [lang]: {
          ...formState.templates[lang],
          [field]: val
        }
      }
    };
    setFormState(updated);
    onSaveSettings(updated);
  };

  const handleTemplateMsgChange = (lang: 'tr' | 'en', index: number, val: string) => {
    const msgs = [...formState.templates[lang].msgs];
    msgs[index] = val;
    handleTemplateChange(lang, 'msgs', msgs);
  };

  const executeConfirmedAction = () => {
    if (!confirmAction) return;
    if (confirmAction.type === 'suppliers') {
      const wipedState: AppSettings = {
        ...formState,
        supplierEmails: {},
        supplierPhones: {},
        supplierRules: {}
      };
      setFormState(wipedState);
      onSaveSettings(wipedState);
      if (onResetSuppliersOnly) onResetSuppliersOnly();
    } else if (confirmAction.type === 'past') {
      if (onClearPastDeliveries) onClearPastDeliveries();
    } else if (confirmAction.type === 'all') {
      onResetAll();
    }
    setConfirmAction(null);
  };

  const handleConfirmSampleDataImport = () => {
    if (samplePasswordInput.trim() !== '1364') {
      setSamplePasswordError('Hatalı şifre! Lütfen doğru şifreyi giriniz (1364).');
      return;
    }
    setSamplePasswordError('');
    setIsGeneratingSample(true);

    try {
      const { items, batch } = generateSampleDataset(500, activeHotelId || 'hotel_1');

      // Populate supplier emails and phones in settings if missing
      const newEmails = { ...formState.supplierEmails };
      const newPhones = { ...(formState.supplierPhones || {}) };
      SAMPLE_SUPPLIERS.forEach((sup) => {
        if (!newEmails[sup.name]) newEmails[sup.name] = sup.email;
        if (!newPhones[sup.name]) newPhones[sup.name] = sup.phone;
      });

      const updatedSettings: AppSettings = {
        ...formState,
        supplierEmails: newEmails,
        supplierPhones: newPhones
      };
      setFormState(updatedSettings);
      onSaveSettings(updatedSettings);

      if (onLoadSampleData) {
        onLoadSampleData(items, batch);
      }

      setIsSamplePasswordModalOpen(false);
      setSamplePasswordInput('');
      onClose();
    } catch (err) {
      console.error('Error generating sample dataset:', err);
      setSamplePasswordError('Örnek veri oluşturulurken bir hata meydana geldi.');
    } finally {
      setIsGeneratingSample(false);
    }
  };

  // Combine known suppliers from settings and actual item lists
  const knownSuppliers = Array.from(
    new Set([
      ...allSuppliers,
      ...Object.keys(formState.supplierEmails || {}),
      ...Object.keys(formState.supplierPhones || {}),
      ...Object.keys(formState.supplierRules || {})
    ])
  ).filter(Boolean).sort((a, b) => a.localeCompare(b, 'tr'));

  const tabs: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
    { id: 'general', label: t.s_general, icon: <Settings className="w-4 h-4" /> },
    { id: 'hotels', label: t.hotel_management, icon: <Building2 className="w-4 h-4" /> },
    { id: 'emails', label: t.s_emails, icon: <Mail className="w-4 h-4" /> },
    { id: 'suppliers', label: t.s_suppliers, icon: <Truck className="w-4 h-4" /> },
    { id: 'rules', label: t.s_rules, icon: <ShieldCheck className="w-4 h-4" /> },
    { id: 'templates', label: t.s_templates, icon: <FileText className="w-4 h-4" /> }
  ];

  return (
    <div
      id="settings-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-600 flex items-center justify-center">
              <Settings className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-black tracking-wide">{t.settings}</h2>
                <span className="px-1.5 py-0.5 rounded bg-purple-500/30 text-purple-200 text-[10px] font-mono font-bold">
                  v1.1
                </span>
              </div>
              <span className="text-[11px] text-purple-300 font-semibold">{settings.company}</span>
            </div>
          </div>
          <button
            id="btn-settings-close-x"
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-3 overflow-x-auto shrink-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              id={`settings-tab-btn-${tab.id}`}
              type="button"
              onClick={() => setCurrentTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-3 text-xs font-bold border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
                currentTab === tab.id
                  ? 'border-purple-600 text-purple-700 bg-white'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Contents */}
        <div className="p-5 overflow-y-auto flex-1">
          {/* GENERAL TAB */}
          {currentTab === 'general' && (
            <div className="space-y-6">
              {/* Profile and Hotel Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    {t.username}
                  </label>
                  <input
                    id="input-settings-username"
                    type="text"
                    value={formState.username}
                    onChange={(e) => handleFieldChange('username', e.target.value)}
                    placeholder="Veysel"
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:border-purple-600 outline-none font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    {t.company}
                  </label>
                  <input
                    id="input-settings-company"
                    type="text"
                    value={formState.company}
                    onChange={(e) => handleFieldChange('company', e.target.value)}
                    placeholder="Four Seasons – Satınalma / Mal Kabul"
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:border-purple-600 outline-none font-semibold"
                  />
                </div>
              </div>

              {/* Language Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  {t.language}
                </label>
                <select
                  id="select-settings-language"
                  value={formState.language}
                  onChange={(e) => handleFieldChange('language', e.target.value as 'tr' | 'en')}
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:border-purple-600 outline-none bg-white font-semibold"
                >
                  <option value="tr">Türkçe (Turkish)</option>
                  <option value="en">English (İngilizce)</option>
                </select>
              </div>

              {/* Security PIN Code */}
              <div className="bg-purple-50/70 border border-purple-200 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <KeyRound className="w-4 h-4 text-purple-700" />
                  <label className="block text-xs font-bold text-purple-900 uppercase tracking-wider">
                    Depo Güvenlik PIN Kodu
                  </label>
                </div>
                <p className="text-xs text-purple-800/80 mb-3">
                  Tüm ekip için ortak güvenlik şifresidir. Yetkisiz girişleri engellemek için kullanılır.
                </p>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <input
                      id="input-settings-pin"
                      type={showPin ? 'text' : 'password'}
                      maxLength={6}
                      value={formState.pinCode || '1800'}
                      onChange={(e) => handleFieldChange('pinCode', e.target.value.trim())}
                      className="w-36 pl-3 pr-9 py-2 text-sm font-mono font-bold tracking-widest text-center border-2 border-purple-300 bg-white rounded-xl focus:border-purple-600 outline-none shadow-2xs text-slate-800"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPin(!showPin)}
                      title={showPin ? 'PIN Kodunu Gizle' : 'PIN Kodunu Göster'}
                      className="absolute right-2.5 top-2.5 text-purple-600 hover:text-purple-800 cursor-pointer"
                    >
                      {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <span className="text-xs text-purple-700 font-semibold">4-6 Haneli Güvenlik Kodu</span>
                </div>
              </div>

              {/* Staff List Management */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <Users className="w-4 h-4 text-slate-700" />
                  <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Yetkili Mal Kabul Personeli Listesi
                  </label>
                </div>
                <p className="text-xs text-slate-500 mb-3">
                  Giriş ekranında personelin tek dokunuşla kendi adını seçebilmesi için tanımlı isimler.
                </p>

                <div className="flex flex-wrap gap-2 mb-3">
                  {(formState.staffList || ['Veysel', 'Ferit Göktaş', 'Ahmet Yılmaz', 'Mehmet Demir', 'Depo Görevlisi']).map((staff, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 shadow-2xs"
                    >
                      <span>{staff}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const current = formState.staffList || ['Veysel', 'Ferit Göktaş', 'Ahmet Yılmaz', 'Mehmet Demir', 'Depo Görevlisi'];
                          const filtered = current.filter((_, i) => i !== idx);
                          handleFieldChange('staffList', filtered);
                        }}
                        className="text-slate-400 hover:text-rose-600 transition-colors p-0.5 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newStaffInput}
                    onChange={(e) => setNewStaffInput(e.target.value)}
                    placeholder="Yeni personel adı (Örn: Caner Korkmaz)"
                    className="flex-1 px-3 py-1.5 text-xs font-semibold border border-slate-300 rounded-xl focus:border-purple-600 outline-none bg-white"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (newStaffInput.trim()) {
                          const current = formState.staffList || ['Veysel', 'Ferit Göktaş', 'Ahmet Yılmaz', 'Mehmet Demir', 'Depo Görevlisi'];
                          handleFieldChange('staffList', [...current, newStaffInput.trim()]);
                          setNewStaffInput('');
                        }
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newStaffInput.trim()) {
                        const current = formState.staffList || ['Veysel', 'Ferit Göktaş', 'Ahmet Yılmaz', 'Mehmet Demir', 'Depo Görevlisi'];
                        handleFieldChange('staffList', [...current, newStaffInput.trim()]);
                        setNewStaffInput('');
                      }
                    }}
                    className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Ekle</span>
                  </button>
                </div>
              </div>

              {/* REFINED DATA & SUPPLIER PURGE / RESET SECTION */}
              <div className="border-t border-slate-200 pt-5 space-y-3">
                <div>
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    Veri & Tedarikçi Yönetimi / Sıfırlama
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    İhtiyacınıza uygun silme veya temizleme işlemini güvenle seçebilirsiniz.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {/* Card 1: Sample Dataset Import (Password Protected: 1364) */}
                  <div className="p-4 rounded-2xl bg-indigo-50/75 border border-indigo-200/90 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1.5 text-indigo-950 font-bold text-xs">
                          <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
                          <span>Örnek Data Yükle (500 Parça)</span>
                        </div>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-200/70 text-indigo-900 border border-indigo-300/60">
                          <Lock className="w-2.5 h-2.5" /> 1364
                        </span>
                      </div>
                      <p className="text-[11px] text-indigo-900/80 mt-1.5 leading-relaxed">
                        12 tedarikçiye ait 500 ürün kalemi, farklı günlere ait teslimatlar (kabul edilmiş, şartlı, red ve bekleyen) sisteme yüklenir.
                      </p>
                    </div>
                    <button
                      id="btn-load-sample-dataset"
                      type="button"
                      onClick={() => {
                        setSamplePasswordInput('');
                        setSamplePasswordError('');
                        setIsSamplePasswordModalOpen(true);
                      }}
                      className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-bold rounded-xl shadow-2xs transition-colors cursor-pointer"
                    >
                      <Database className="w-3.5 h-3.5" />
                      <span>Örnek Veriyi Yükle</span>
                    </button>
                  </div>

                  {/* Card 2: Supplier Directory Only */}
                  <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/90 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center gap-1.5 text-amber-900 font-bold text-xs">
                        <Truck className="w-4 h-4 text-amber-700 shrink-0" />
                        <span>Tedarikçi Rehberini Sıfırla</span>
                      </div>
                      <p className="text-[11px] text-amber-800/80 mt-1.5 leading-relaxed">
                        Kayıtlı tedarikçi telefon, WhatsApp, e-posta ve özel kalite kurallarını temizler. Mal kabul kayıtlarınız <strong>korunur</strong>.
                      </p>
                    </div>
                    <button
                      id="btn-reset-suppliers-only"
                      type="button"
                      onClick={() =>
                        setConfirmAction({
                          type: 'suppliers',
                          title: 'Tedarikçi Rehberini Sıfırla',
                          description:
                            'Tüm kayıtlı tedarikçi telefonları, WhatsApp numaraları, e-posta adresleri ve özel sıcaklık/SKT kuralları silinecektir. Mal kabul teslimat kayıtlarınız KORUNACAKTIR. Onaylıyor musunuz?',
                          buttonText: 'Evet, Tedarikçi Rehberini Temizle',
                          dangerLevel: 'amber'
                        })
                      }
                      className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-2xs transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Rehberi Temizle</span>
                    </button>
                  </div>

                  {/* Card 3: Clear Past Deliveries */}
                  <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200/90 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center gap-1.5 text-rose-900 font-bold text-xs">
                        <History className="w-4 h-4 text-rose-700 shrink-0" />
                        <span>Geçmiş Kayıtları Temizle</span>
                      </div>
                      <p className="text-[11px] text-rose-800/80 mt-1.5 leading-relaxed">
                        Geçmiş aylara ait teslimat ve arşiv kayıtlarını temizler. Tedarikçi rehberiniz ve sistem ayarlarınız <strong>korunur</strong>.
                      </p>
                    </div>
                    <button
                      id="btn-clear-past-deliveries"
                      type="button"
                      onClick={() =>
                        setConfirmAction({
                          type: 'past',
                          title: 'Geçmiş Kayıtları Temizle',
                          description:
                            'Geçmiş aylara ait tamamlanmış ve arşivlenmiş tüm teslimat kayıtları veritabanından silinecektir. Tedarikçi rehberiniz ve ayarlarınız korunacaktır. Onaylıyor musunuz?',
                          buttonText: 'Evet, Geçmiş Kayıtları Sil',
                          dangerLevel: 'rose'
                        })
                      }
                      className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-2xs transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Geçmişi Temizle</span>
                    </button>
                  </div>

                  {/* Card 4: Factory Reset / Wipe All */}
                  <div className="p-4 rounded-2xl bg-red-50/70 border border-red-300/90 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center gap-1.5 text-red-950 font-bold text-xs">
                        <Trash2 className="w-4 h-4 text-red-700 shrink-0" />
                        <span>Tüm Sistemi ve DB'yi Sıfırla</span>
                      </div>
                      <p className="text-[11px] text-red-800/80 mt-1.5 leading-relaxed">
                        Tüm teslimatları, aylık kayıtları, tedarikçi rehberini ve bulut veritabanını tamamen sıfırlar.
                      </p>
                    </div>
                    <button
                      id="btn-wipe-all-database"
                      type="button"
                      onClick={() =>
                        setConfirmAction({
                          type: 'all',
                          title: 'Tüm Sistemi ve Veritabanını Sıfırla',
                          description:
                            'Tüm teslimatlar, geçmiş kayıtlar, tedarikçi iletişim bilgileri ve veritabanı kalıcı olarak tamamen silinecektir. Bu işlem geri alınamaz! Emin misiniz?',
                          buttonText: 'Evet, Her Şeyi Tamamen Sil',
                          dangerLevel: 'red'
                        })
                      }
                      className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-red-700 hover:bg-red-800 text-white text-xs font-bold rounded-xl shadow-2xs transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Fabrika Ayarlarına Dön</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* HOTELS & BRANCHES TAB */}
          {currentTab === 'hotels' && (
            <div className="space-y-6">
              {/* Hotel Isolation Overview */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-900/10 via-indigo-900/10 to-emerald-900/10 border border-indigo-200/80">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-indigo-600 text-white shrink-0 shadow-sm">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      {t.hotel_management}
                    </h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      {t.hotel_isolated_hint}
                    </p>
                  </div>
                </div>
              </div>

              {/* Active Hotel Switcher inside Settings */}
              {onSelectHotel && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    {t.hotel_selector}
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(formState.hotels || DEFAULT_HOTELS).map((h) => {
                      const isActive = (formState.hotelId || activeHotelId) === h.id;
                      return (
                        <button
                          key={h.id}
                          type="button"
                          onClick={() => {
                            handleFieldChange('hotelId', h.id);
                            onSelectHotel(h.id);
                          }}
                          className={`flex items-center justify-between p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                            isActive
                              ? h.id === 'hotel_1'
                                ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-500/20 text-blue-950 shadow-sm'
                                : 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20 text-emerald-950 shadow-sm'
                              : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-3 h-3 rounded-full ${
                                h.id === 'hotel_1' ? 'bg-blue-600' : 'bg-emerald-600'
                              }`}
                            />
                            <div>
                              <div className="text-xs font-black">{h.name}</div>
                              <div className="text-[11px] text-slate-500 font-mono">{h.code}</div>
                            </div>
                          </div>
                          {isActive && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-600 text-white">
                              Aktif
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Edit Hotel 1 & Hotel 2 Definitions */}
              <div className="space-y-4">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                  Otel Tanımları ve Şube Bilgileri
                </h4>

                {(formState.hotels || DEFAULT_HOTELS).map((h, hIdx) => {
                  const isH1 = h.id === 'hotel_1';
                  return (
                    <div
                      key={h.id}
                      className={`p-4 rounded-2xl border ${
                        isH1 ? 'bg-blue-50/40 border-blue-200' : 'bg-emerald-50/40 border-emerald-200'
                      } space-y-3`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Building2
                            className={`w-4 h-4 ${isH1 ? 'text-blue-600' : 'text-emerald-600'}`}
                          />
                          <span className="text-xs font-black text-slate-900">
                            {hIdx + 1}. Otel: {h.name}
                          </span>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                            isH1
                              ? 'bg-blue-100 text-blue-800 border border-blue-200'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}
                        >
                          ID: {h.id}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">
                            Otel / Tesis Adı
                          </label>
                          <input
                            type="text"
                            value={h.name}
                            onChange={(e) => handleHotelConfigChange(h.id, 'name', e.target.value)}
                            placeholder="Otel Adı"
                            className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-xl bg-white focus:border-purple-600 outline-none font-medium"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">
                            Kısa Kod (Header / Etiket)
                          </label>
                          <input
                            type="text"
                            value={h.code}
                            onChange={(e) => handleHotelConfigChange(h.id, 'code', e.target.value.toUpperCase())}
                            placeholder="KOD"
                            className="w-full px-3 py-1.5 text-xs font-mono font-bold border border-slate-300 rounded-xl bg-white focus:border-purple-600 outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">
                            Departman / Şube Başlığı
                          </label>
                          <input
                            type="text"
                            value={h.companyName || ''}
                            onChange={(e) => handleHotelConfigChange(h.id, 'companyName', e.target.value)}
                            placeholder="Four Seasons – Mal Kabul"
                            className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-xl bg-white focus:border-purple-600 outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">
                            Şube Sorumlusu / E-posta
                          </label>
                          <input
                            type="text"
                            value={h.contactEmail || ''}
                            onChange={(e) => handleHotelConfigChange(h.id, 'contactEmail', e.target.value)}
                            placeholder="malkabul.sube@fourseasons.com"
                            className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-xl bg-white focus:border-purple-600 outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* EMAILS TAB */}
          {currentTab === 'emails' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  {t.e_user}
                </label>
                <input
                  type="email"
                  value={formState.emails.user}
                  onChange={(e) => handleEmailChange('user', e.target.value)}
                  placeholder="ad.soyad@fourseasons.com"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:border-purple-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  {t.e_manager}
                </label>
                <input
                  type="email"
                  value={formState.emails.manager}
                  onChange={(e) => handleEmailChange('manager', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:border-purple-600 outline-none font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  {t.e_food}
                </label>
                <input
                  type="text"
                  value={formState.emails.foodSafety}
                  onChange={(e) => handleEmailChange('foodSafety', e.target.value)}
                  placeholder="ozge.sali@fourseasons.com, elif.uzun@fourseasons.com"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:border-purple-600 outline-none"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">{t.multi_mail}</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  {t.e_ehc}
                </label>
                <input
                  type="email"
                  value={formState.emails.ehcAuditor}
                  onChange={(e) => handleEmailChange('ehcAuditor', e.target.value)}
                  placeholder="ehc.auditor@fourseasons.com"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:border-purple-600 outline-none"
                />
              </div>
            </div>
          )}

          {/* SUPPLIERS TAB (EMAILS & WHATSAPP / PHONE DIRECTORY) */}
          {currentTab === 'suppliers' && (
            <div className="space-y-4">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  {t.sup_add}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={newSupName}
                    onChange={(e) => setNewSupName(e.target.value)}
                    placeholder={t.sup_name}
                    className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg outline-none font-semibold bg-white"
                  />
                  <input
                    type="email"
                    value={newSupEmail}
                    onChange={(e) => setNewSupEmail(e.target.value)}
                    placeholder="siparis@tedarikci.com"
                    className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg outline-none bg-white"
                  />
                  <input
                    type="tel"
                    value={newSupPhone}
                    onChange={(e) => setNewSupPhone(e.target.value)}
                    placeholder="+90532..."
                    className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg outline-none bg-white font-mono"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddSupplier}
                  className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{t.add}</span>
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  {t.sup_paste}
                </label>
                <textarea
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  placeholder="METRO GROSSMARKET;siparis@metro.com;+905321112233&#10;PINAR ET SUT;sevkiyat@pinar.com;+905322223344"
                  rows={2}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-mono outline-none"
                />
                <button
                  type="button"
                  onClick={handlePasteImport}
                  className="mt-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg cursor-pointer"
                >
                  {t.paste_import}
                </button>
              </div>

              <div className="border-t border-slate-200 pt-3">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    {t.sup_contacts} ({knownSuppliers.length})
                  </label>
                  <span className="text-[11px] text-slate-500">{t.sup_contacts_hint}</span>
                </div>
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {knownSuppliers.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      Kayıtlı tedarikçi bulunmamaktadır.
                    </div>
                  ) : (
                    knownSuppliers.map((s) => (
                      <div
                        key={s}
                        className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-black text-slate-900 truncate mb-1">{s}</div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div className="flex items-center gap-1.5 bg-white px-2 py-1 border border-slate-200 rounded-lg">
                              <Mail className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                              <input
                                type="email"
                                value={formState.supplierEmails?.[s] || ''}
                                onChange={(e) => handleSupplierEmailChange(s, e.target.value)}
                                placeholder="E-posta tanımlanmamış"
                                className="w-full text-xs outline-none font-medium bg-transparent"
                              />
                            </div>
                            <div className="flex items-center gap-1.5 bg-white px-2 py-1 border border-slate-200 rounded-lg">
                              <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <input
                                type="tel"
                                value={formState.supplierPhones?.[s] || ''}
                                onChange={(e) => handleSupplierPhoneChange(s, e.target.value)}
                                placeholder="WhatsApp / Tel no (+90...)"
                                className="w-full text-xs outline-none font-mono font-medium bg-transparent"
                              />
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteSupplier(s)}
                          className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg self-end sm:self-center shrink-0 cursor-pointer"
                          title={t.del}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {/* Reset all suppliers button */}
                <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between">
                  <span className="text-xs text-slate-500">{t.reset_sup_hint}</span>
                  <button
                    type="button"
                    onClick={() =>
                      setConfirmAction({
                        type: 'suppliers',
                        title: 'Tedarikçi Rehberini Sıfırla',
                        description:
                          'Tüm kayıtlı tedarikçi telefonları, WhatsApp numaraları, e-posta adresleri ve özel kalite kuralları silinecektir. Mal kabul teslimat kayıtlarınız korunacaktır. Onaylıyor musunuz?',
                        buttonText: 'Evet, Rehberi Sıfırla',
                        dangerLevel: 'amber'
                      })
                    }
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{t.reset_sup_btn}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* RULES TAB */}
          {currentTab === 'rules' && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  {t.rules_sup}
                </label>
                <p className="text-[11px] text-slate-500 mb-2">{t.rules_hint}</p>
                <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 max-h-64 overflow-y-auto">
                  <div className="grid grid-cols-12 px-3 py-2 bg-slate-100 text-[10px] font-black text-slate-600 uppercase">
                    <span className="col-span-6">{t.supplier}</span>
                    <span className="col-span-3 text-center">SKT (Exp Date)</span>
                    <span className="col-span-3 text-center">Sıcaklık (Temp)</span>
                  </div>
                  {knownSuppliers.map((s) => {
                    const r = formState.supplierRules[s] || {};
                    return (
                      <div key={s} className="grid grid-cols-12 px-3 py-2 items-center text-xs">
                        <span className="col-span-6 font-bold text-slate-800 truncate">{s}</span>
                        <div className="col-span-3 flex justify-center">
                          <input
                            type="checkbox"
                            checked={!!r.exp}
                            onChange={(e) => handleRuleToggle(s, 'exp', e.target.checked)}
                            className="w-4 h-4 text-purple-600 rounded"
                          />
                        </div>
                        <div className="col-span-3 flex justify-center">
                          <input
                            type="checkbox"
                            checked={!!r.temp}
                            onChange={(e) => handleRuleToggle(s, 'temp', e.target.checked)}
                            className="w-4 h-4 text-purple-600 rounded"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  {t.rules_extra}
                </label>
                <p className="text-[11px] text-slate-500 mb-2">{t.rules_extra_hint}</p>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {formState.extraCheckProducts.map((kw, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-50 text-purple-800 text-xs font-semibold border border-purple-200"
                    >
                      <span>{kw}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveExtraKeyword(i)}
                        className="text-purple-400 hover:text-purple-800 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newExtraKeyword}
                    onChange={(e) => setNewExtraKeyword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddExtraKeyword()}
                    placeholder={t.rules_extra_ph}
                    className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded-lg outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddExtraKeyword}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg cursor-pointer"
                  >
                    {t.add}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TEMPLATES TAB */}
          {currentTab === 'templates' && (
            <div className="space-y-4">
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-xs text-purple-900 leading-relaxed flex items-start gap-2">
                <Info className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
                <span>{t.tpl_hint}</span>
              </div>

              {(['tr', 'en'] as const).map((lng) => {
                const tpl = formState.templates[lng];
                return (
                  <div key={lng} className="border border-slate-200 rounded-xl p-4 space-y-3 bg-slate-50/50">
                    <div className="text-xs font-black uppercase text-purple-700 tracking-wider">
                      {lng === 'tr' ? '🇹🇷 Türkçe Şablon' : '🇬🇧 English Template'}
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        {t.tpl_subject}
                      </label>
                      <input
                        type="text"
                        value={tpl.subject}
                        onChange={(e) => handleTemplateChange(lng, 'subject', e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg outline-none bg-white font-semibold"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                          {t.tpl_greeting}
                        </label>
                        <input
                          type="text"
                          value={tpl.greeting}
                          onChange={(e) => handleTemplateChange(lng, 'greeting', e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg outline-none bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                          {t.tpl_closing}
                        </label>
                        <input
                          type="text"
                          value={tpl.closing}
                          onChange={(e) => handleTemplateChange(lng, 'closing', e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg outline-none bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        {t.tpl_intro}
                      </label>
                      <textarea
                        value={tpl.intro}
                        onChange={(e) => handleTemplateChange(lng, 'intro', e.target.value)}
                        rows={2}
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg outline-none bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        {t.tpl_msgs}
                      </label>
                      <div className="space-y-1.5">
                        {tpl.msgs.map((m, idx) => (
                          <input
                            key={idx}
                            type="text"
                            value={m}
                            onChange={(e) => handleTemplateMsgChange(lng, idx, e.target.value)}
                            className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg outline-none bg-white"
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-500 font-medium">
            {totalRecordsCount} {t.records}
          </span>
          <button
            id="btn-settings-save-and-close"
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            {t.save} / {t.close}
          </button>
        </div>
      </motion.div>

      {/* Confirmation Modal */}
      {confirmAction && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4"
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                  confirmAction.dangerLevel === 'red'
                    ? 'bg-red-100 text-red-600'
                    : confirmAction.dangerLevel === 'rose'
                    ? 'bg-rose-100 text-rose-600'
                    : 'bg-amber-100 text-amber-600'
                }`}
              >
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900">{confirmAction.title}</h4>
                <span className="text-xs text-slate-500 font-semibold">Bu işlem geri alınamaz</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              {confirmAction.description}
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmAction(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={executeConfirmedAction}
                className={`px-4 py-2 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer ${
                  confirmAction.dangerLevel === 'red'
                    ? 'bg-red-600 hover:bg-red-700'
                    : confirmAction.dangerLevel === 'rose'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-amber-600 hover:bg-amber-700'
                }`}
              >
                {confirmAction.buttonText}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Sample Data Password Modal (Required password: 1364) */}
      {isSamplePasswordModalOpen && (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900">Örnek Veri Yükleme Şifresi</h4>
                  <span className="text-xs text-slate-500 font-medium">500 Parça Ürün & 12 Tedarikçi</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsSamplePasswordModalOpen(false);
                  setSamplePasswordInput('');
                  setSamplePasswordError('');
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-indigo-50/60 p-3.5 rounded-2xl border border-indigo-100 text-xs text-indigo-950/85 leading-relaxed space-y-2">
              <div className="flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  Bu işlem sisteme <strong>12 farklı tedarikçiden 500 kalem ürün</strong> yükler. Kayıtlar geçmiş ve gelecek günlere dağıtılır; kabul edilmiş, şartlı, red ve bekleyen teslimat durumlarını içerir.
                </div>
              </div>
              <div className="text-[11px] text-indigo-700 font-semibold pl-6">
                🔒 İşlemi onaylamak için lütfen yetkili şifresini giriniz.
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Yükleme Şifresi
              </label>
              <div className="relative">
                <input
                  id="input-sample-password"
                  type={showSamplePassword ? 'text' : 'password'}
                  value={samplePasswordInput}
                  onChange={(e) => {
                    setSamplePasswordInput(e.target.value);
                    if (samplePasswordError) setSamplePasswordError('');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleConfirmSampleDataImport();
                    }
                  }}
                  placeholder="Şifreyi giriniz (Örn: 1364)"
                  autoFocus
                  className={`w-full text-xs font-semibold px-3.5 py-2.5 bg-slate-50 border rounded-xl outline-hidden transition-all pr-10 ${
                    samplePasswordError
                      ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100 bg-red-50/30'
                      : 'border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowSamplePassword(!showSamplePassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                >
                  {showSamplePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {samplePasswordError && (
                <p className="text-[11px] text-red-600 font-semibold flex items-center gap-1 mt-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {samplePasswordError}
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setIsSamplePasswordModalOpen(false);
                  setSamplePasswordInput('');
                  setSamplePasswordError('');
                }}
                disabled={isGeneratingSample}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                {t.cancel}
              </button>
              <button
                id="btn-submit-sample-password"
                type="button"
                onClick={handleConfirmSampleDataImport}
                disabled={isGeneratingSample || !samplePasswordInput}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                {isGeneratingSample ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Yükleniyor...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Onayla ve 500 Kalemi Yükle</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
