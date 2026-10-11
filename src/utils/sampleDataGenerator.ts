import { DeliveryItem, DeliveryStatus, UploadBatch } from '../types';
import { fmtDate, getTodayStr, monthOf, nowStamp, parseDate } from './helpers';

export interface SampleSupplierInfo {
  name: string;
  phone: string;
  email: string;
  department: string;
  category: 'meat' | 'dairy' | 'fish' | 'produce' | 'bakery' | 'dry' | 'beverage' | 'chemical' | 'packaging' | 'gourmet';
  products: {
    name: string;
    uom: string;
    minQty: number;
    maxQty: number;
    basePrice: number;
    tempType: 'frozen' | 'chilled' | 'ambient';
    expDays: number;
  }[];
}

export const SAMPLE_SUPPLIERS: SampleSupplierInfo[] = [
  {
    name: 'METRO GROSSMARKET',
    phone: '+905321112233',
    email: 'siparis@metro-tr.com',
    department: 'Mutfak Depo / Kuru Gıda',
    category: 'dry',
    products: [
      { name: 'Sızma Zeytinyağı 5L Teneke', uom: 'Adet', minQty: 10, maxQty: 50, basePrice: 1250, tempType: 'ambient', expDays: 365 },
      { name: 'Ayçiçek Yağı 18L Teneke', uom: 'Teneke', minQty: 5, maxQty: 30, basePrice: 950, tempType: 'ambient', expDays: 365 },
      { name: 'Baldo Pirinç 25 Kg Çuval', uom: 'Çuval', minQty: 4, maxQty: 20, basePrice: 1650, tempType: 'ambient', expDays: 180 },
      { name: 'Kırmızı Mercimek 25 Kg Çuval', uom: 'Çuval', minQty: 2, maxQty: 15, basePrice: 980, tempType: 'ambient', expDays: 180 },
      { name: 'Pilavlık Bulgur 25 Kg Çuval', uom: 'Çuval', minQty: 3, maxQty: 12, basePrice: 750, tempType: 'ambient', expDays: 180 },
      { name: 'Barilla Penne Rigate Makarna 5 Kg Koli', uom: 'Koli', minQty: 6, maxQty: 25, basePrice: 420, tempType: 'ambient', expDays: 540 },
      { name: 'Barilla Spaghetti No:5 5 Kg Koli', uom: 'Koli', minQty: 6, maxQty: 25, basePrice: 420, tempType: 'ambient', expDays: 540 },
      { name: 'Domates Salçası 4.5 Kg Teneke', uom: 'Teneke', minQty: 8, maxQty: 40, basePrice: 380, tempType: 'ambient', expDays: 365 },
      { name: 'Biber Salçası Tatlı 4.5 Kg Teneke', uom: 'Teneke', minQty: 4, maxQty: 20, basePrice: 460, tempType: 'ambient', expDays: 365 },
      { name: 'Siyah Zeytin Gemlik Mega 10 Kg Teneke', uom: 'Teneke', minQty: 5, maxQty: 25, basePrice: 1850, tempType: 'ambient', expDays: 240 },
      { name: 'Yeşil Kırma Zeytin 10 Kg Teneke', uom: 'Teneke', minQty: 4, maxQty: 18, basePrice: 1650, tempType: 'ambient', expDays: 240 },
      { name: 'Toz Şeker 50 Kg Çuval', uom: 'Çuval', minQty: 2, maxQty: 10, basePrice: 1750, tempType: 'ambient', expDays: 730 },
      { name: 'İnce Sofra Tuzu 25 Kg Çuval', uom: 'Çuval', minQty: 2, maxQty: 8, basePrice: 280, tempType: 'ambient', expDays: 730 },
      { name: 'Hellmann’s Mayonez 10 Kg Kova', uom: 'Kova', minQty: 4, maxQty: 16, basePrice: 850, tempType: 'ambient', expDays: 180 },
      { name: 'Knorr Ketçap 10 Kg Kova', uom: 'Kova', minQty: 4, maxQty: 16, basePrice: 650, tempType: 'ambient', expDays: 180 },
      { name: 'Knorr Tavuk Bulyon 1 Kg', uom: 'Kutu', minQty: 5, maxQty: 20, basePrice: 210, tempType: 'ambient', expDays: 365 },
      { name: 'Kuru Fasulye İspir 25 Kg Çuval', uom: 'Çuval', minQty: 2, maxQty: 10, basePrice: 2400, tempType: 'ambient', expDays: 180 },
      { name: 'Konserve Mısır 2.5 Kg Teneke', uom: 'Teneke', minQty: 6, maxQty: 30, basePrice: 190, tempType: 'ambient', expDays: 365 },
      { name: 'Konserve Mantar Dilimli 2.5 Kg', uom: 'Teneke', minQty: 4, maxQty: 20, basePrice: 240, tempType: 'ambient', expDays: 365 },
      { name: 'Sirke Beyaz Damıtılmış 5L Bidon', uom: 'Bidon', minQty: 6, maxQty: 24, basePrice: 120, tempType: 'ambient', expDays: 730 }
    ]
  },
  {
    name: 'PINAR ET VE SÜT ÜRÜNLERİ',
    phone: '+905322223344',
    email: 'sevkiyat@pinar.com.tr',
    department: 'Mutfak / Soğuk Depo',
    category: 'dairy',
    products: [
      { name: 'Pınar Tam Yağlı Süt 1L (12’li Koli)', uom: 'Koli', minQty: 15, maxQty: 80, basePrice: 420, tempType: 'chilled', expDays: 120 },
      { name: 'Pınar Profesyonel Yemek Kreması %35 1L (12’li Koli)', uom: 'Koli', minQty: 10, maxQty: 50, basePrice: 960, tempType: 'chilled', expDays: 90 },
      { name: 'Pınar Taze Kaşar Peyniri Blok 2 Kg', uom: 'Adet', minQty: 10, maxQty: 40, basePrice: 680, tempType: 'chilled', expDays: 90 },
      { name: 'Pınar Labne Peyniri 1 Kg', uom: 'Kova', minQty: 8, maxQty: 35, basePrice: 180, tempType: 'chilled', expDays: 45 },
      { name: 'Pınar Rulo Tereyağı 1 Kg', uom: 'Kg', minQty: 20, maxQty: 100, basePrice: 420, tempType: 'chilled', expDays: 90 },
      { name: 'Pınar Klasik Kangal Sucuk 1 Kg', uom: 'Kg', minQty: 10, maxQty: 45, basePrice: 750, tempType: 'chilled', expDays: 60 },
      { name: 'Pınar Dana Salam Dilimli 500g', uom: 'Paket', minQty: 15, maxQty: 60, basePrice: 160, tempType: 'chilled', expDays: 45 },
      { name: 'Pınar Dana Sosis Kokteyl 1 Kg', uom: 'Kg', minQty: 10, maxQty: 40, basePrice: 380, tempType: 'chilled', expDays: 45 },
      { name: 'Pınar Süzme Peynir 1 Kg', uom: 'Adet', minQty: 8, maxQty: 30, basePrice: 210, tempType: 'chilled', expDays: 60 },
      { name: 'Pınar Mascarpone 1 Kg', uom: 'Kutu', minQty: 5, maxQty: 20, basePrice: 340, tempType: 'chilled', expDays: 30 },
      { name: 'Pınar Dana Füme Et 100g Paket', uom: 'Paket', minQty: 20, maxQty: 70, basePrice: 95, tempType: 'chilled', expDays: 45 },
      { name: 'Pınar Yoğurt Tam Yağlı 10 Kg Kova', uom: 'Kova', minQty: 5, maxQty: 25, basePrice: 480, tempType: 'chilled', expDays: 21 }
    ]
  },
  {
    name: 'NAMET ENTEGRE ET',
    phone: '+905333334455',
    email: 'siparis@namet.com.tr',
    department: 'Mutfak / Kasaphane',
    category: 'meat',
    products: [
      { name: 'Dana Bonfile Taze Vakumlu (A Sınıfı)', uom: 'Kg', minQty: 15, maxQty: 80, basePrice: 1150, tempType: 'chilled', expDays: 14 },
      { name: 'Dana Antrikot Taze Mermerli', uom: 'Kg', minQty: 20, maxQty: 100, basePrice: 950, tempType: 'chilled', expDays: 14 },
      { name: 'Dana Kontrfile Taze Vakumlu', uom: 'Kg', minQty: 15, maxQty: 70, basePrice: 780, tempType: 'chilled', expDays: 14 },
      { name: 'Dana Köftelik Kıyma (%15 Yağlı)', uom: 'Kg', minQty: 30, maxQty: 150, basePrice: 580, tempType: 'chilled', expDays: 7 },
      { name: 'Kuzu Pirzola Taze Çift Kalem', uom: 'Kg', minQty: 10, maxQty: 50, basePrice: 1200, tempType: 'chilled', expDays: 10 },
      { name: 'Kuzu Kafes Taze Temizlenmiş', uom: 'Kg', minQty: 8, maxQty: 40, basePrice: 1350, tempType: 'chilled', expDays: 10 },
      { name: 'Kuzu Gerdan & İncik Çorbalık', uom: 'Kg', minQty: 15, maxQty: 60, basePrice: 590, tempType: 'chilled', expDays: 10 },
      { name: 'Dana Roast Beef Pişmiş Dilimli 1 Kg', uom: 'Kg', minQty: 6, maxQty: 30, basePrice: 890, tempType: 'chilled', expDays: 30 },
      { name: 'Kayseri Çemenli Pastırma Dilimli 500g', uom: 'Paket', minQty: 10, maxQty: 40, basePrice: 550, tempType: 'chilled', expDays: 90 },
      { name: 'Dana İlikli Kemik Çorbalık Koli', uom: 'Koli', minQty: 5, maxQty: 25, basePrice: 280, tempType: 'frozen', expDays: 180 },
      { name: 'Dana Burger Köftesi 180g (Dondurulmuş)', uom: 'Koli', minQty: 10, maxQty: 40, basePrice: 1450, tempType: 'frozen', expDays: 120 }
    ]
  },
  {
    name: 'SÜTAŞ SÜT VE SÜT ÜRÜNLERİ',
    phone: '+905354445566',
    email: 'mal-kabul@sutas.com.tr',
    department: 'Mutfak / Kahvaltı & Soğuk',
    category: 'dairy',
    products: [
      { name: 'Sütaş Taze Kaşar Blok 2 Kg', uom: 'Adet', minQty: 12, maxQty: 50, basePrice: 650, tempType: 'chilled', expDays: 90 },
      { name: 'Sütaş Klasik Ezine Beyaz Peynir 18 Kg Teneke', uom: 'Teneke', minQty: 3, maxQty: 15, basePrice: 6200, tempType: 'chilled', expDays: 120 },
      { name: 'Sütaş Lor Peyniri Böreklik 5 Kg Kova', uom: 'Kova', minQty: 4, maxQty: 20, basePrice: 420, tempType: 'chilled', expDays: 30 },
      { name: 'Sütaş Süzme Yoğurt 10 Kg Kova', uom: 'Kova', minQty: 6, maxQty: 30, basePrice: 680, tempType: 'chilled', expDays: 25 },
      { name: 'Sütaş Tava Yoğurt Kaymaklı 5 Kg Kova', uom: 'Kova', minQty: 4, maxQty: 20, basePrice: 390, tempType: 'chilled', expDays: 20 },
      { name: 'Sütaş Ayran 200ml (20’li Koli)', uom: 'Koli', minQty: 15, maxQty: 75, basePrice: 190, tempType: 'chilled', expDays: 20 },
      { name: 'Sütaş Tereyağı Geleneksel Rulo 1 Kg', uom: 'Kg', minQty: 15, maxQty: 80, basePrice: 410, tempType: 'chilled', expDays: 90 },
      { name: 'Sütaş Kaymak 200g Kahvaltılık', uom: 'Paket', minQty: 20, maxQty: 90, basePrice: 75, tempType: 'chilled', expDays: 15 },
      { name: 'Sütaş Krem Peynir 500g', uom: 'Adet', minQty: 10, maxQty: 45, basePrice: 95, tempType: 'chilled', expDays: 60 },
      { name: 'Sütaş Çeçil / Tel Peyniri 1 Kg', uom: 'Kg', minQty: 5, maxQty: 25, basePrice: 380, tempType: 'chilled', expDays: 45 }
    ]
  },
  {
    name: 'HALİÇ BALIKÇILIK VE DENİZ ÜRÜNLERİ',
    phone: '+905365556677',
    email: 'siparis@halicbalik.com',
    department: 'Mutfak / Balık & Deniz Ürünleri',
    category: 'fish',
    products: [
      { name: 'Deniz Levreği Taze Bütün (600-800g)', uom: 'Kg', minQty: 15, maxQty: 60, basePrice: 480, tempType: 'chilled', expDays: 4 },
      { name: 'Deniz Çipurası Taze Bütün (400-600g)', uom: 'Kg', minQty: 15, maxQty: 60, basePrice: 450, tempType: 'chilled', expDays: 4 },
      { name: 'Norveç Somon Taze Bütün (4-5 Kg)', uom: 'Kg', minQty: 20, maxQty: 90, basePrice: 620, tempType: 'chilled', expDays: 6 },
      { name: 'Norveç Somon Fileto Trim E Taze', uom: 'Kg', minQty: 15, maxQty: 70, basePrice: 780, tempType: 'chilled', expDays: 5 },
      { name: 'Jumbo Karides 16/20 Dondurulmuş 1 Kg', uom: 'Kutu', minQty: 10, maxQty: 40, basePrice: 850, tempType: 'frozen', expDays: 180 },
      { name: 'Kalamar Tüp Temizlenmiş U5 Dondurulmuş 1 Kg', uom: 'Kutu', minQty: 8, maxQty: 35, basePrice: 520, tempType: 'frozen', expDays: 180 },
      { name: 'Ahtapot Kolu Haşlanmış Dondurulmuş 1 Kg', uom: 'Paket', minQty: 5, maxQty: 25, basePrice: 1100, tempType: 'frozen', expDays: 180 },
      { name: 'Karadeniz Kalkan Balığı Taze', uom: 'Kg', minQty: 8, maxQty: 30, basePrice: 1450, tempType: 'chilled', expDays: 4 },
      { name: 'Füme Somon Dilimli 500g Paket', uom: 'Paket', minQty: 10, maxQty: 40, basePrice: 460, tempType: 'chilled', expDays: 30 },
      { name: 'Kum Midyesi Taze Kabuklu', uom: 'Kg', minQty: 10, maxQty: 35, basePrice: 260, tempType: 'chilled', expDays: 3 }
    ]
  },
  {
    name: 'ANTALYA TAZE SEBZE VE MEYVE HALİ',
    phone: '+905376667788',
    email: 'hal@antalyatoptan.com',
    department: 'Mutfak / Manav & Soğuk Depo',
    category: 'produce',
    products: [
      { name: 'Salkım Domates 1. Sınıf Kasa', uom: 'Kasa', minQty: 8, maxQty: 35, basePrice: 320, tempType: 'chilled', expDays: 7 },
      { name: 'Çengelköy Badem Salatalık Kasa', uom: 'Kasa', minQty: 6, maxQty: 30, basePrice: 280, tempType: 'chilled', expDays: 6 },
      { name: 'İthal Hass Avokado 18’li Koli', uom: 'Koli', minQty: 4, maxQty: 20, basePrice: 850, tempType: 'chilled', expDays: 10 },
      { name: 'Iceberg Marul 12’li Kasa', uom: 'Kasa', minQty: 5, maxQty: 25, basePrice: 240, tempType: 'chilled', expDays: 7 },
      { name: 'Akdeniz Yeşillik Karışımı Yıkanmış 1 Kg', uom: 'Kutu', minQty: 10, maxQty: 40, basePrice: 140, tempType: 'chilled', expDays: 4 },
      { name: 'Kültür Mantarı Beyaz 5 Kg Kasa', uom: 'Kasa', minQty: 5, maxQty: 20, basePrice: 380, tempType: 'chilled', expDays: 5 },
      { name: 'Portobello Mantar 2 Kg Kutu', uom: 'Kutu', minQty: 4, maxQty: 16, basePrice: 320, tempType: 'chilled', expDays: 5 },
      { name: 'Limon Mayer Sulu 10 Kg Kasa', uom: 'Kasa', minQty: 6, maxQty: 30, basePrice: 420, tempType: 'chilled', expDays: 20 },
      { name: 'Taze Çilek Sera 500g Kap', uom: 'Kap', minQty: 15, maxQty: 60, basePrice: 65, tempType: 'chilled', expDays: 4 },
      { name: 'Sarı Sarımsak Taşköprü File 5 Kg', uom: 'File', minQty: 3, maxQty: 12, basePrice: 480, tempType: 'ambient', expDays: 60 },
      { name: 'Kuru Soğan Sarı 25 Kg Çuval', uom: 'Çuval', minQty: 4, maxQty: 20, basePrice: 350, tempType: 'ambient', expDays: 45 },
      { name: 'Patates Kızartmalık Agria 25 Kg Çuval', uom: 'Çuval', minQty: 6, maxQty: 30, basePrice: 420, tempType: 'ambient', expDays: 45 },
      { name: 'Taze Fesleğen Demet', uom: 'Demet', minQty: 20, maxQty: 80, basePrice: 18, tempType: 'chilled', expDays: 4 },
      { name: 'Brokoli Taze 5 Kg Kasa', uom: 'Kasa', minQty: 4, maxQty: 18, basePrice: 290, tempType: 'chilled', expDays: 6 }
    ]
  },
  {
    name: 'KOMŞU FIRIN & UNLU MAMULLER',
    phone: '+905387778899',
    email: 'siparis@komsufirin.com',
    department: 'Fırın & Pastane / Kahvaltı',
    category: 'bakery',
    products: [
      { name: 'Fransız Tereyağlı Kruvasan 60g (Dondurulmuş Koli 80 Adet)', uom: 'Koli', minQty: 4, maxQty: 20, basePrice: 1280, tempType: 'frozen', expDays: 90 },
      { name: 'Çikolatalı Danish Pain au Chocolat (Koli 70 Adet)', uom: 'Koli', minQty: 3, maxQty: 15, basePrice: 1350, tempType: 'frozen', expDays: 90 },
      { name: 'Artisan Ekşi Mayalı Köy Ekmeği 800g', uom: 'Adet', minQty: 15, maxQty: 60, basePrice: 65, tempType: 'ambient', expDays: 3 },
      { name: 'Fransız Baget Ekmek 250g', uom: 'Adet', minQty: 25, maxQty: 100, basePrice: 28, tempType: 'ambient', expDays: 2 },
      { name: 'Brioche Gurme Hamburger Ekmeği 90g (Koli 40 Adet)', uom: 'Koli', minQty: 6, maxQty: 25, basePrice: 580, tempType: 'ambient', expDays: 5 },
      { name: 'Tost Ekmeği Jumbo Dilimli 1000g', uom: 'Paket', minQty: 10, maxQty: 45, basePrice: 48, tempType: 'ambient', expDays: 10 },
      { name: 'Geleneksel Çıtır Simit 100g', uom: 'Adet', minQty: 30, maxQty: 120, basePrice: 15, tempType: 'ambient', expDays: 1 },
      { name: 'Glutensiz Ekmek Dilimli Paket 400g', uom: 'Paket', minQty: 5, maxQty: 20, basePrice: 85, tempType: 'ambient', expDays: 15 },
      { name: 'Muffin Karışık Çikolata & Yaban Mersini (Koli 30 Adet)', uom: 'Koli', minQty: 4, maxQty: 16, basePrice: 620, tempType: 'ambient', expDays: 7 }
    ]
  },
  {
    name: 'DIVERSEY HİJYEN VE KİMYA',
    phone: '+905398889900',
    email: 'endustriyel@diversey.com',
    department: 'Mutfak / Steward & Kat Hizmetleri',
    category: 'chemical',
    products: [
      { name: 'Suma Nova L6 Endüstriyel Bulaşık Yıkama Sıvısı 20L', uom: 'Bidon', minQty: 2, maxQty: 10, basePrice: 2450, tempType: 'ambient', expDays: 730 },
      { name: 'Suma Select A7 Bulaşık Parlatıcı 20L', uom: 'Bidon', minQty: 2, maxQty: 8, basePrice: 2150, tempType: 'ambient', expDays: 730 },
      { name: 'Suma Grill D9 Ağır Yağ Çözücü Fırın Temizleyici 5L', uom: 'Koli', minQty: 3, maxQty: 12, basePrice: 1180, tempType: 'ambient', expDays: 730 },
      { name: 'Suma Bac D10 Mutfak Yüzey Dezenfektanı 5L (4’lü Koli)', uom: 'Koli', minQty: 2, maxQty: 10, basePrice: 1450, tempType: 'ambient', expDays: 730 },
      { name: 'Soft Care Med Alkol Bazlı El Dezenfektanı 5L', uom: 'Bidon', minQty: 4, maxQty: 15, basePrice: 890, tempType: 'ambient', expDays: 730 },
      { name: 'Clax 100 Sıvı Çamaşır Ana Yıkama Deterjanı 20L', uom: 'Bidon', minQty: 3, maxQty: 12, basePrice: 1950, tempType: 'ambient', expDays: 730 },
      { name: 'Taski Sani Cid Kireç ve Banyo Temizleyici 5L', uom: 'Koli', minQty: 3, maxQty: 10, basePrice: 820, tempType: 'ambient', expDays: 730 },
      { name: 'Bulaşıkhane Mavi Nitril Eldiven L Boy (Koli 1000 Adet)', uom: 'Koli', minQty: 2, maxQty: 8, basePrice: 1100, tempType: 'ambient', expDays: 1095 }
    ]
  },
  {
    name: 'KAHVE DÜNYASI & TCHIBO COFFEE',
    phone: '+905301112233',
    email: 'horeca@tchibo.com.tr',
    department: 'Bar & Servis / İçecek Deposu',
    category: 'beverage',
    products: [
      { name: 'Tchibo Barista Espresso Çekirdek Kahve 1 Kg (Koli 8 Adet)', uom: 'Koli', minQty: 4, maxQty: 20, basePrice: 3600, tempType: 'ambient', expDays: 365 },
      { name: 'Tchibo Eduscho Filtre Kahve 1 Kg (Koli 10 Adet)', uom: 'Koli', minQty: 3, maxQty: 15, basePrice: 3100, tempType: 'ambient', expDays: 365 },
      { name: 'Kahve Dünyası Türk Kahvesi Orta Kavrulmuş 1 Kg Teneke', uom: 'Teneke', minQty: 6, maxQty: 25, basePrice: 480, tempType: 'ambient', expDays: 180 },
      { name: 'Ronnefeldt Earl Grey Dökme Çay 1 Kg Teneke', uom: 'Teneke', minQty: 4, maxQty: 16, basePrice: 1250, tempType: 'ambient', expDays: 730 },
      { name: 'Ronnefeldt Papatya / Nane Bitki Çayı (Kutu 100 Poşet)', uom: 'Kutu', minQty: 5, maxQty: 20, basePrice: 480, tempType: 'ambient', expDays: 730 },
      { name: 'Monin Karamel Kahve Şurubu 1L', uom: 'Şişe', minQty: 6, maxQty: 24, basePrice: 380, tempType: 'ambient', expDays: 540 },
      { name: 'Monin Vanilya Şurubu 1L', uom: 'Şişe', minQty: 6, maxQty: 24, basePrice: 380, tempType: 'ambient', expDays: 540 },
      { name: 'Sıcak Çikolata Tozu Profesyonel 1 Kg', uom: 'Paket', minQty: 8, maxQty: 30, basePrice: 290, tempType: 'ambient', expDays: 365 }
    ]
  },
  {
    name: 'ÖZTİRYAKİLER AMBALAJ & SERVİS',
    phone: '+905312223344',
    email: 'ambalaj@oztiryakiler.com.tr',
    department: 'Mutfak Depo / Ambalaj & Sarf',
    category: 'packaging',
    products: [
      { name: 'Gıda Streç Film 45 cm x 1500 m Profesyonel Kutu', uom: 'Kutu', minQty: 6, maxQty: 30, basePrice: 460, tempType: 'ambient', expDays: 1095 },
      { name: 'Alüminyum Folyo Ağır Hizmet 45 cm x 150 m', uom: 'Rulo', minQty: 10, maxQty: 40, basePrice: 320, tempType: 'ambient', expDays: 1095 },
      { name: 'Pişirme Kağıdı Silikonlu 40x60 cm (Paket 500 Yaprak)', uom: 'Paket', minQty: 5, maxQty: 25, basePrice: 580, tempType: 'ambient', expDays: 1095 },
      { name: 'Vakum Torbası 20x30 cm 90 Mikron (Paket 100 Adet)', uom: 'Paket', minQty: 15, maxQty: 60, basePrice: 190, tempType: 'ambient', expDays: 1095 },
      { name: 'Vakum Torbası 30x40 cm 90 Mikron (Paket 100 Adet)', uom: 'Paket', minQty: 10, maxQty: 45, basePrice: 320, tempType: 'ambient', expDays: 1095 },
      { name: 'Kraft Kağıt Çanta Büküm Saplı (Koli 250 Adet)', uom: 'Koli', minQty: 4, maxQty: 20, basePrice: 650, tempType: 'ambient', expDays: 1095 },
      { name: 'Tek Kullanımlık Şeffaf Pudrasız Eldiven M (Koli 1000 Adet)', uom: 'Koli', minQty: 5, maxQty: 25, basePrice: 420, tempType: 'ambient', expDays: 1095 }
    ]
  },
  {
    name: 'ERİKLİ & COCA COLA İÇECEK',
    phone: '+905323334455',
    email: 'siparis@coca-cola.com.tr',
    department: 'İçecek Depo / Bar & Restoran',
    category: 'beverage',
    products: [
      { name: 'Erikli Doğal Kaynak Suyu Cam Şişe 330ml (Kasa 24 Adet)', uom: 'Kasa', minQty: 20, maxQty: 100, basePrice: 280, tempType: 'ambient', expDays: 365 },
      { name: 'Erikli Doğal Kaynak Suyu Cam Şişe 750ml (Kasa 12 Adet)', uom: 'Kasa', minQty: 15, maxQty: 80, basePrice: 240, tempType: 'ambient', expDays: 365 },
      { name: 'Coca-Cola Orijinal Cam Şişe 250ml (Kasa 24 Adet)', uom: 'Kasa', minQty: 15, maxQty: 90, basePrice: 420, tempType: 'ambient', expDays: 365 },
      { name: 'Coca-Cola Zero Sugar Cam Şişe 250ml (Kasa 24 Adet)', uom: 'Kasa', minQty: 12, maxQty: 70, basePrice: 420, tempType: 'ambient', expDays: 365 },
      { name: 'Fanta Portakal Cam Şişe 250ml (Kasa 24 Adet)', uom: 'Kasa', minQty: 8, maxQty: 40, basePrice: 420, tempType: 'ambient', expDays: 365 },
      { name: 'Sprite Limon Cam Şişe 250ml (Kasa 24 Adet)', uom: 'Kasa', minQty: 8, maxQty: 40, basePrice: 420, tempType: 'ambient', expDays: 365 },
      { name: 'San Pellegrino Doğal Mineralli Su 750ml (Koli 15 Adet)', uom: 'Koli', minQty: 10, maxQty: 50, basePrice: 850, tempType: 'ambient', expDays: 365 },
      { name: 'Schweppes Tonik Cam Şişe 200ml (Kasa 24 Adet)', uom: 'Kasa', minQty: 6, maxQty: 30, basePrice: 460, tempType: 'ambient', expDays: 365 },
      { name: 'Cappy %100 Portakal Suyu 1L (12’li Koli)', uom: 'Koli', minQty: 8, maxQty: 35, basePrice: 520, tempType: 'ambient', expDays: 180 }
    ]
  },
  {
    name: 'GURME İTHAL GIDA VE ŞARKÜTERİ',
    phone: '+905334445566',
    email: 'ithalat@gurmegida.com',
    department: 'Fine Dining Mutfak / Soğuk Depo',
    category: 'gourmet',
    products: [
      { name: 'Parmigiano Reggiano DOP 24 Ay Blok (Tekerlek 5 Kg)', uom: 'Kg', minQty: 5, maxQty: 25, basePrice: 1450, tempType: 'chilled', expDays: 180 },
      { name: 'Grana Padano DOP 16 Ay Blok 1 Kg', uom: 'Kg', minQty: 8, maxQty: 35, basePrice: 980, tempType: 'chilled', expDays: 180 },
      { name: 'İtalyan Taze Burrata Peyniri 125g x 2 (Paket)', uom: 'Paket', minQty: 15, maxQty: 60, basePrice: 220, tempType: 'chilled', expDays: 14 },
      { name: 'İtalyan Buffalo Mozzarella DOP 125g', uom: 'Paket', minQty: 20, maxQty: 80, basePrice: 160, tempType: 'chilled', expDays: 14 },
      { name: 'İtalyan Beyaz Trüf Yağı 250ml Şişe', uom: 'Şişe', minQty: 4, maxQty: 18, basePrice: 890, tempType: 'ambient', expDays: 540 },
      { name: 'Modena Balsamik Sirke IGP 250ml', uom: 'Şişe', minQty: 6, maxQty: 24, basePrice: 450, tempType: 'ambient', expDays: 730 },
      { name: 'Dijon Hardal Orijinal Taneli 1 Kg Kavanoz', uom: 'Kavanoz', minQty: 6, maxQty: 20, basePrice: 380, tempType: 'ambient', expDays: 365 },
      { name: 'İspanyol Jamón Serrano Dilimli 500g Paket', uom: 'Paket', minQty: 8, maxQty: 30, basePrice: 750, tempType: 'chilled', expDays: 90 },
      { name: 'Peru Organik Beyaz Kinoa 5 Kg Paket', uom: 'Paket', minQty: 4, maxQty: 16, basePrice: 620, tempType: 'ambient', expDays: 365 },
      { name: 'Fransız Kurbağa Bacağı & Salyangoz Dondurulmuş 1 Kg', uom: 'Kutu', minQty: 3, maxQty: 12, basePrice: 1250, tempType: 'frozen', expDays: 180 }
    ]
  }
];

const STAFF_MEMBERS = ['Veysel', 'Ferit Göktaş', 'Ahmet Yılmaz', 'Mehmet Demir', 'Caner Korkmaz'];

const CONDITIONAL_NOTES = [
  'Koli köşesinde hafif ezilme vardı, içerik sağlam kontrol edilerek teslim alındı.',
  'Araç sıcaklığı sınır değerde (+5.4°C), şef onayı ile hızlı tüketime yönlendirildi.',
  'Etiket üzerinde parti numarası silikti, tedarikçi teyit alınarak onaylandı.',
  'Sipariş miktarından 2 koli eksik geldi, irsaliyeye şerh düşüldü.',
  'Palet ambalajı gevşemişti, ürün sağlamlığı teyit edilerek teslim alındı.',
  'SKT süresi 15 gün kalmış, 3 gün içinde mutfakta kullanılmak üzere kabul edildi.',
  'Fatura henüz kesilmemiş, e-irsaliye referansı ile geçici teslim alındı.'
];

const REJECT_NOTES = [
  'Soğuk zincir kırılmış; ürün sıcaklığı +12.8°C ölçüldü, teslim alınmadı.',
  'Ambalaj patlak ve ürün dışarı sızmış, hijyen standartlarına aykırı.',
  'Son kullanma tarihi 3 gün geçmiş ürün tespit edildi, sevkiyat reddedildi.',
  'Kasa içinde çürük ve ezik ürün oranı %30 üzeri çıktı.',
  'Araç içi hijyen yetersiz ve ağır koku mevcuttu.',
  'Sipariş edilen ürün yerine farklı marka ve gramaj getirilmiş.'
];

/**
 * Generates realistic delivery items across 12 suppliers and various dates.
 */
export function generateSampleDataset(targetCount = 500, hotelId = 'hotel_1'): { items: DeliveryItem[]; batch: UploadBatch } {
  const today = getTodayStr();
  const todayDate = parseDate(today);

  // Generate target dates: 7 days in the past, today, 4 days in future
  const datePool: string[] = [];
  for (let offset = -7; offset <= 4; offset++) {
    const d = new Date(todayDate);
    d.setDate(todayDate.getDate() + offset);
    datePool.push(fmtDate(d));
  }

  const items: DeliveryItem[] = [];
  const uploadId = `sample_batch_${hotelId}_${Date.now()}`;
  let itemCounter = 1;

  // We have 12 suppliers. We distribute ~41-42 items per supplier to reach exactly targetCount.
  const targetPerSupplier = Math.floor(targetCount / SAMPLE_SUPPLIERS.length);
  const remainder = targetCount % SAMPLE_SUPPLIERS.length;

  SAMPLE_SUPPLIERS.forEach((sup, supIndex) => {
    const countForThisSupplier = targetPerSupplier + (supIndex < remainder ? 1 : 0);
    const poPrefix = `PO-${hotelId === 'hotel_2' ? 'IST' : 'BOS'}-2026-${String(supIndex + 1).padStart(2, '0')}`;

    for (let k = 0; k < countForThisSupplier; k++) {
      const prod = sup.products[k % sup.products.length];
      
      // Distribute dates: some past, some today, some future
      // Weighted so today and yesterday have high density
      const dateIndex = (k + supIndex * 3) % datePool.length;
      const expectedDate = datePool[dateIndex];
      const poNum = `${poPrefix}${String(Math.floor(k / 4) + 1).padStart(3, '0')}`;
      
      // Determine status based on date
      let status: DeliveryStatus = 'pending';
      let truckCheck = false;
      let labelCheck = false;
      let physicalCheck = false;
      let productTemp = prod.tempType === 'frozen' ? -18 : prod.tempType === 'chilled' ? 3 : 20;
      let truckTemp = prod.tempType === 'frozen' ? -20 : prod.tempType === 'chilled' ? 2 : 22;
      let note = '';
      let recordedBy: string | undefined = undefined;
      let recordedAt: string | undefined = undefined;

      const randomStaff = STAFF_MEMBERS[(k + supIndex) % STAFF_MEMBERS.length];
      const stampHour = 8 + (k % 9);
      const stampMin = (k * 7) % 60;
      const timeStamp = `${expectedDate} ${String(stampHour).padStart(2, '0')}:${String(stampMin).padStart(2, '0')}`;

      if (expectedDate < today) {
        // Past deliveries: 70% approved, 15% conditional, 5% rejected, 10% pending (missed/overdue)
        const rand = (k * 17 + supIndex * 13) % 100;
        if (rand < 70) {
          status = 'approved';
          truckCheck = true;
          labelCheck = true;
          physicalCheck = true;
          recordedBy = randomStaff;
          recordedAt = timeStamp;
        } else if (rand < 85) {
          status = 'conditional';
          truckCheck = true;
          labelCheck = true;
          physicalCheck = false;
          note = CONDITIONAL_NOTES[(k + supIndex) % CONDITIONAL_NOTES.length];
          recordedBy = randomStaff;
          recordedAt = timeStamp;
        } else if (rand < 90) {
          status = 'rejected';
          truckCheck = false;
          labelCheck = false;
          physicalCheck = false;
          note = REJECT_NOTES[(k + supIndex) % REJECT_NOTES.length];
          recordedBy = randomStaff;
          recordedAt = timeStamp;
          if (prod.tempType === 'chilled') productTemp = 11 + (k % 4);
        } else {
          status = 'pending'; // missed delivery
        }
      } else if (expectedDate === today) {
        // Today deliveries: 45% approved, 12% conditional, 5% rejected, 38% pending (in progress)
        const rand = (k * 23 + supIndex * 7) % 100;
        if (rand < 45) {
          status = 'approved';
          truckCheck = true;
          labelCheck = true;
          physicalCheck = true;
          recordedBy = randomStaff;
          recordedAt = timeStamp;
        } else if (rand < 57) {
          status = 'conditional';
          truckCheck = true;
          labelCheck = true;
          physicalCheck = false;
          note = CONDITIONAL_NOTES[(k + supIndex) % CONDITIONAL_NOTES.length];
          recordedBy = randomStaff;
          recordedAt = timeStamp;
        } else if (rand < 62) {
          status = 'rejected';
          truckCheck = false;
          labelCheck = false;
          physicalCheck = false;
          note = REJECT_NOTES[(k + supIndex) % REJECT_NOTES.length];
          recordedBy = randomStaff;
          recordedAt = timeStamp;
          if (prod.tempType === 'chilled') productTemp = 12;
        } else {
          status = 'pending';
        }
      } else {
        // Future deliveries: 100% pending
        status = 'pending';
      }

      // Quantity variation
      const qtySpan = prod.maxQty - prod.minQty;
      const orderQty = prod.minQty + ((k * 3) % (qtySpan + 1));

      // Calculate Expiry Date
      let expDate: string | undefined = undefined;
      if (prod.tempType !== 'ambient' || prod.expDays <= 365) {
        const expD = new Date(parseDate(expectedDate));
        expD.setDate(expD.getDate() + prod.expDays);
        expDate = fmtDate(expD);
      }

      const item: DeliveryItem = {
        id: `DEMO-${hotelId === 'hotel_2' ? 'IST' : 'BOS'}-${String(itemCounter).padStart(4, '0')}`,
        hotelId,
        uploadId,
        supplierName: sup.name,
        supplierPhone: sup.phone,
        productName: prod.name,
        orderQty,
        uom: prod.uom,
        price: prod.basePrice,
        poNumber: poNum,
        subject: `Sipariş: ${prod.name} (${sup.department})`,
        department: sup.department,
        itemCode: `ITM-${(supIndex + 1) * 100 + (k % sup.products.length) + 1}`,
        note: note || undefined,
        expectedDate,
        month: monthOf(expectedDate),
        status,
        truckCheck,
        truckTemp,
        labelCheck,
        physicalCheck,
        productTemp,
        expDate,
        recordedBy,
        recordedAt,
        updatedBy: recordedBy,
        updatedAt: recordedAt
      };

      items.push(item);
      itemCounter++;
    }
  });

  const targetMonths = Array.from(new Set(items.map((i) => i.month || monthOf(i.expectedDate))));
  const batch: UploadBatch = {
    id: uploadId,
    hotelId,
    fileName: `ornek_veri_${hotelId === 'hotel_2' ? 'istanbul' : 'bosphorus'}_500_kalem.xlsx`,
    uploadedAt: nowStamp(),
    timestamp: Date.now(),
    uploadedBy: 'Sistem (Demo Import)',
    itemCount: items.length,
    itemIds: items.map((i) => i.id),
    targetMonths,
    suppliersSummary: '12 Tedarikçi (Metro, Pınar, Namet, Sütaş, Haliç Balık, Antalya Hal, Komşu Fırın, Diversey, Kahve Dünyası, Öztiryakiler, Erikli/Coca Cola, Gurme Gıda)'
  };

  return { items, batch };
}
