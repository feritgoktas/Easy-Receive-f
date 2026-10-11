import { AppSettings, DeliveryItem, EmailTemplate, HotelConfig } from '../types';

export const fmtDate = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export const parseDate = (s: string): Date => {
  const parts = String(s || '').split('-');
  const y = Number(parts[0]) || new Date().getFullYear();
  const m = Number(parts[1]) || 1;
  const d = Number(parts[2]) || 1;
  return new Date(y, m - 1, d);
};

export const getTodayStr = (): string => fmtDate(new Date());

export const trDate = (ds: string): string => {
  if (!ds) return '—';
  const d = parseDate(ds);
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
};

export const monthOf = (ds: string): string => String(ds || '').slice(0, 7);

export const nowStamp = (): string => {
  const d = new Date();
  return `${fmtDate(d)} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

export const esc = (s: unknown): string =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] || c));

export const byText = (a: string, b: string): number => String(a || '').localeCompare(String(b || ''), 'tr');

export const DEFAULT_TEMPLATES: Record<'tr' | 'en', EmailTemplate> = {
  tr: {
    subject: 'Teslim Edilmeyen Sipariş Hk. – {date}',
    greeting: 'Sayın {supplier} Yetkilisi,',
    intro: 'Aşağıda detayları yer alan siparişimiz teslim edilmemiştir.',
    msgs: [
      'Teslimatın bugün içinde tamamlanmasını rica ederiz.',
      'Teslimatın hangi gün ve saatte yapılacağı konusunda acilen bilgi verilmesini rica ederiz.',
      'Eksik ürünler operasyonumuzu aksatmaktadır; en geç yarın sabah 08:00’e kadar teslim edilmesini talep ediyoruz.',
      'Teslimat yapılamayacaksa siparişin iptali için tarafımıza yazılı bilgi verilmesini rica ederiz.'
    ],
    closing: 'Bilgilerinize sunar, iyi çalışmalar dileriz.'
  },
  en: {
    subject: 'Outstanding Delivery Notice – {date}',
    greeting: 'Dear {supplier} Representative,',
    intro: 'The order detailed below has not been delivered.',
    msgs: [
      'We kindly ask that the delivery be completed today.',
      'Please inform us urgently of the exact date and time of delivery.',
      'The missing items disrupt our operation; we require delivery by 08:00 tomorrow at the latest.',
      'If the delivery cannot be made, please confirm the cancellation of the order in writing.'
    ],
    closing: 'Thank you for your prompt attention.'
  }
};

export const DEFAULT_HOTELS: HotelConfig[] = [
  {
    id: 'hotel_1',
    name: 'Bosphorus',
    code: 'BOP',
    badgeColor: 'blue',
    companyName: 'Four Seasons Hotel Istanbul at the Bosphorus',
    contactEmail: 'malkabul.bosphorus@fourseasons.com',
    address: 'Çırağan Cad. No:28, Beşiktaş / İstanbul'
  },
  {
    id: 'hotel_2',
    name: 'Istanbul',
    code: 'IST',
    badgeColor: 'emerald',
    companyName: 'Four Seasons Hotel Istanbul at Sultanahmet',
    contactEmail: 'malkabul.istanbul@fourseasons.com',
    address: 'Tevkifhane Sok. No:1, Sultanahmet / İstanbul'
  }
];

export const DEFAULT_SETTINGS: AppSettings = {
  hotelId: 'hotel_1',
  hotels: DEFAULT_HOTELS,
  username: 'Veysel',
  company: 'Four Seasons – Satınalma / Mal Kabul',
  language: 'tr',
  pinCode: '1800',
  staffList: ['Veysel', 'Ferit Göktaş', 'Ahmet Yılmaz', 'Mehmet Demir', 'Depo Görevlisi'],
  emails: {
    user: '',
    manager: 'Ferit.goktas@fourseasons.com',
    foodSafety: 'ozge.sali@fourseasons.com, elif.uzun@fourseasons.com',
    ehcAuditor: ''
  },
  supplierEmails: {},
  supplierPhones: {},
  supplierRules: {},
  extraCheckProducts: ['süt', 'krema', 'peynir', 'yoğurt', 'et', 'tavuk', 'balık', 'kıyma', 'dondurma', 'salam', 'sucuk', 'sosis'],
  templates: JSON.parse(JSON.stringify(DEFAULT_TEMPLATES))
};

export const toIntTemp = (val: unknown, defaultVal = 4): number => {
  if (val === undefined || val === null || val === '') return defaultVal;
  const num = typeof val === 'number' ? val : parseFloat(String(val));
  if (isNaN(num)) return defaultVal;
  return Math.round(num);
};

export const splitCSVLine = (line: string, sep: string): string[] => {
  const out: string[] = [];
  let cur = '';
  let q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (q && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        q = !q;
      }
    } else if (c === sep && !q) {
      out.push(cur);
      breakLine(out, cur);
      cur = '';
    } else {
      cur += c;
    }
  }
  out.push(cur);
  return out.map((v) => v.trim().replace(/^"|"$/g, ''));
};

function breakLine(out: string[], cur: string) {
  // helper
}

export const getOrCreateUserId = (username?: string): string => {
  try {
    let id = localStorage.getItem('receiving_easy_user_id');
    if (!id) {
      id = 'usr_' + Math.random().toString(36).slice(2, 8) + '_' + Date.now().toString(36);
      localStorage.setItem('receiving_easy_user_id', id);
    }
    return id;
  } catch {
    return 'usr_' + (username || 'guest').replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
  }
};

export const parseDeliveryCSV = (text: string, todayStr: string, currentUserId?: string, uploadId?: string): DeliveryItem[] => {
  const lines = String(text || '').replace(/\r/g, '').split('\n').filter((l) => l.trim());
  if (!lines.length) return [];
  const seps = [',', ';', '\t'];
  const sep = seps.map((x) => [x, lines[0].split(x).length] as [string, number]).sort((a, b) => b[1] - a[1])[0][0];

  const head = splitCSVLine(lines[0], sep).map((h) => h.toLowerCase());
  const find = (re: RegExp) => head.findIndex((h) => re.test(h));

  let idx: Record<string, number> = {
    supplier: find(/supplier|tedarik|firma|vendor/),
    phone: find(/phone|tel|telefon|gsm|mobile|whatsapp|iletişim|iletisim|contact/),
    product: find(/product|ürün|urun|malzeme|item name/),
    qty: find(/qty|quantity|miktar|adet/),
    uom: find(/uom|unit|birim|ölçü/),
    price: find(/price|fiyat|tutar/),
    po: find(/\bpo\b|po ?number|po ?no|sipariş|order no/),
    subject: find(/subject|konu|açıklama/),
    dept: find(/department|departman|dept|bölüm/),
    code: find(/item ?#|item ?no|item ?code|stok|kod/),
    note: find(/comment|note|not\b|açıklama|spec|buyer/)
  };

  let start = 1;
  if (idx.product < 0 && idx.supplier < 0) {
    // If no header found, assume standard default column layout
    idx = { supplier: 0, product: 1, qty: 2, uom: 3, price: 4, po: 5, subject: 6, dept: 7, code: 8, note: 9, phone: 10 };
    start = 0;
  }

  const g = (c: string[], k: string): string => (idx[k] >= 0 ? c[idx[k]] || '' : '').trim();
  const out: DeliveryItem[] = [];
  const uid = currentUserId || getOrCreateUserId();
  const upId = uploadId || ('up_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6));

  for (let r = start; r < lines.length; r++) {
    const c = splitCSVLine(lines[r], sep);
    const product = g(c, 'product');
    if (!product) continue;

    out.push({
      id: 'imp_' + Date.now() + '_' + r + '_' + Math.random().toString(36).slice(2, 6),
      userId: uid,
      uploadId: upId,
      supplierName: g(c, 'supplier') || 'Bilinmeyen Tedarikçi',
      supplierPhone: g(c, 'phone') || '',
      productName: product,
      orderQty: g(c, 'qty') || '1',
      uom: g(c, 'uom') || 'Adet',
      price: g(c, 'price') || '',
      poNumber: g(c, 'po') || 'PO-' + todayStr.replace(/-/g, '').slice(2),
      subject: g(c, 'subject') || 'Genel Mal Kabul',
      department: g(c, 'dept') || '',
      itemCode: g(c, 'code') || '',
      note: g(c, 'note') || '',
      expectedDate: todayStr,
      status: 'pending',
      truckCheck: false,
      truckTemp: 4,
      labelCheck: false,
      physicalCheck: false,
      productTemp: 4,
      expDate: '',
      recordedBy: '',
      recordedAt: '',
      updatedBy: '',
      updatedAt: ''
    });
  }

  return out;
};
