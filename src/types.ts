export type DeliveryStatus = 'approved' | 'conditional' | 'rejected' | 'pending';

export interface HotelConfig {
  id: string; // 'hotel_1' | 'hotel_2'
  name: string;
  code: string;
  badgeColor?: string; // Tailwind color theme identifier
  companyName?: string;
  contactEmail?: string;
  address?: string;
}

export interface DeliveryItem {
  id: string;
  hotelId?: string; // Multi-tenant hotel identifier ('hotel_1' | 'hotel_2')
  userId?: string;
  uploadId?: string; // Tracks the specific batch upload
  supplierName: string;
  supplierPhone?: string;
  productName: string;
  orderQty: string | number;
  uom: string;
  price?: string | number;
  poNumber: string;
  subject: string;
  department?: string;
  itemCode?: string;
  note?: string;
  expectedDate: string; // YYYY-MM-DD
  month?: string; // YYYY-MM
  status: DeliveryStatus;
  truckCheck: boolean;
  truckTemp: number;
  labelCheck: boolean;
  physicalCheck: boolean;
  productTemp: number;
  expDate?: string; // YYYY-MM-DD
  recordedBy?: string;
  recordedAt?: string;
  updatedBy?: string;
  updatedAt?: string;
}

export interface UploadBatch {
  id: string;
  hotelId?: string; // Multi-tenant hotel identifier
  fileName: string;
  uploadedAt: string;
  timestamp: number;
  uploadedBy: string;
  userId?: string;
  itemCount: number;
  itemIds: string[];
  targetMonths: string[];
  suppliersSummary?: string;
  isReverted?: boolean;
}

export interface EmailTemplate {
  subject: string;
  greeting: string;
  intro: string;
  msgs: string[];
  closing: string;
}

export interface SupplierRule {
  exp?: boolean;
  temp?: boolean;
}

export interface AppSettings {
  hotelId?: string;
  hotels?: HotelConfig[];
  username: string;
  company: string;
  language: 'tr' | 'en';
  pinCode?: string;
  staffList?: string[];
  emails: {
    user: string;
    manager: string;
    foodSafety: string;
    ehcAuditor: string;
  };
  supplierEmails: Record<string, string>;
  supplierPhones: Record<string, string>;
  supplierRules: Record<string, SupplierRule>;
  extraCheckProducts: string[];
  templates: {
    tr: EmailTemplate;
    en: EmailTemplate;
  };
}

export type TabType = 'receiving' | 'historical' | 'reports' | 'analytics' | 'import';

