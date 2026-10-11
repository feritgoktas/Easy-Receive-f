# 📦 Receiving Easy — Mal Kabul ve Günlük Gıda Giriş Kontrol Sistemi

**Receiving Easy**, otel, restoran, catering ve kurumsal mutfak operasyonları için geliştirilmiş profesyonel bir **Mal Kabul, Gıda Güvenliği (HACCP), Sıcaklık/SKT Takip ve Tedarikçi Yönetim Sistemidir**.

Web ve Android/mobil cihazlarla tam uyumlu çalışan uygulama; sevkiyatların kabulünden kalite kontrol adımlarına, şarta bağlı kabullerden PDF/Excel raporlamaya kadar tüm süreci dijitalleştirir ve arşivler.

---

## 🚀 Temel Yetenekler ve Özellikler

### 1. 📥 Günlük Mal Kabul Yönetimi (`ReceivingView`)
- **Tedarikçi ve PO Bazlı Gruplama:** Günlük gelen ürünler tedarikçilere ve Satınalma Sipariş (PO) numaralarına göre otomatik gruplanır.
- **Tek Tıkla Kalite Kontrolü (HACCP):**
  - 🏷️ **Etiket Kontrolü:** Parti no, üretim ve son tüketim tarihi doğrulaması.
  - 📦 **Fiziksel & Ambalaj Kontrolü:** Ambalaj bütünlüğü, sızıntı/yırtık kontrolü.
  - 🌡️ **Sıcaklık Ölçümü:** Ürün ve araç içi sıcaklık girişi (°C) ile soğuk zincir denetimi.
  - 📅 **SKT / Son Tüketim Tarihi:** Kritik raf ömrü takibi.
  - 🚚 **Araç Temizlik ve Hijyen Kontrolü:** Sevkiyat aracının hijyen durumu.
- **Hızlı Durum Değiştirme:**
  - `[✓ Kabul]`: Tüm kriterleri sağlayan ürünlerin hızlı kabulü.
  - `[⚠️ Şartlı Kabul]`: Açıklama notu eklenerek mutfak/şef onaylı kontrollü kabul.
  - `[✕ Red]`: Kusurlu, soğuk zinciri kırılmış veya hasarlı ürünlerin gerekçeli reddi.
  - `[Beklemede]`: Henüz teslim alınmamış açık siparişler.
- **Toplu İşlemler:** Tedarikçi bazında "Tümünü Onayla", "Tümünü Beklemeye Al" veya tek tıkla teslimat tamamlama.

---

### 2. 📱 Android & Mobil Optimize Arayüz (Ultra-Kompakt Mod)
- **Yüksek Yoğunluklu Kart Görünümü (High-Density):** Küçük ekranlarda ve Android tablet/el terminallerinde tek ekranda 5-7 kalem ürünü kaydırma yapmadan görebilme.
- **Kompakt Mod Açma/Kapatma:** Kullanıcı tercihine göre tek dokunuşla geniş tablo veya kompakt kart formatına geçiş.
- **Geniş Dokunma Alanları:** Eldivenli veya saha kullanımına uygun 44px+ ergonomik dokunma hedefleri.
- **Hızlı İletişim Aksiyonları:** Tedarikçiye doğrudan sistem üzerinden **WhatsApp Mesajı**, **Telefon Araması** veya **E-posta Bildirimi** gönderme.

---

### 3. 📑 Excel ve Veri İçe Aktarımı (`ImportView`)
- **Sürükle-Bırak Excel Desteği:** Satınalma sistemlerinden (ERP, SAP, Fidelio vb.) alınan `.xlsx` veya `.xls` sipariş listelerinin otomatik analizi.
- **Akıllı Sütun Eşleme:** Ürün adı, tedarikçi, miktar, birim, PO no, departman ve teslimat tarihi sütunlarını otomatik tanıma.
- **Yükleme Geçmişi ve Geri Alma (Batch Rollback):** Hatalı yüklenen bir Excel dosyasını tek tıkla geri alma (`Rollback`) ve tüm kalemlerini sistemden temizleme.

---

### 4. 🗄️ Geçmiş Kayıtlar & Arşiv Yönetimi (`HistoricalView`)
- **Aylık ve Tarih Filtreleme:** Geçmiş aylara ve özel tarih aralıklarına ait mal kabul arşivini görüntüleme.
- **Gelişmiş Arama:** Ürün adı, tedarikçi adı, PO numarası ve kayıt tarihine göre anlık arama ve filtreleme.
- **Tablo ve Kart Görünümü Seçeneği:** Masaüstü monitörlerde yatay kaydırma çubuğu, mobilde ise pratik kart modu.
- **Toplu Düzenleme & Kayıt:** Geçmiş kayıtlar üzerinde düzeltmeler yapabilme ve tek tıkla kaydetme.

---

### 5. 📊 Kalite & Performans Raporları (`ReportsView`)
- **Tedarikçi Kalite Skorlaması:** Tedarikçilerin zamanında teslimat, kabul, şartlı kabul ve red oranları.
- **Gıda Güvenliği & Sıcaklık İhlal Analizleri:** Soğuk zincir sınırlarını aşan ürünlerin istatistiksel dağılımı.
- **Ret ve Şartlı Kabul Sebepleri Raporu:** En çok karşılaşılan kalite sorunlarının grafiksel dökümü.
- **PDF ve Excel Dışa Aktarma:** Resmi denetimler (ISO 22000, Tarım Bakanlığı, HACCP) için resmi PDF/Excel formatında anlık rapor üretimi.

---

### 6. 📄 PDF Kontrol Listesi & Yazdırma (`ChecklistModal` / `ShortChecklistModal`)
- **Resmi Mal Kabul Kontrol Listesi:** Günlük veya seçili teslimatlar için A4 formatında imzalı, onaylı mal kabul fişi / kontrol listesi çıktısı.
- **Kısa (Özet) ve Detaylı PDF Seçenekleri:** İster hızlı depo teslim fişi, ister ayrıntılı HACCP sıcaklık log formu olarak çıktı alma veya e-posta ile gönderme.

---

### 7. ⚙️ Sistem Ayarları & Tedarikçi Rehberi (`SettingsModal`)
- **Tedarikçi Rehberi:** Tedarikçi telefonları, WhatsApp numaraları, sipariş e-postaları ve özel kabul kriterleri.
- **E-Posta Şablonları:** Şartlı kabul ve red durumlarında tedarikçiye otomatik gidecek e-posta şablonlarını özelleştirme.
- **Güvenli Sıfırlama Seçenekleri:**
  - *Tedarikçi Rehberini Sıfırla* (Mal kabuller korunur).
  - *Geçmiş Kayıtları Temizle* (Rehber ve ayarlar korunur).
  - *Tüm Sistemi ve DB'yi Sıfırla* (PIN / onay korumalı).

---

### 8. ✨ Şifre Korumalı Örnek Veri Yükleme (Demo Dataset)
- **Yükleme Şifresi:** `1364`
- **İçerik:**
  - **12 Farklı Gerçekçi Tedarikçi** (Metro, Pınar, Namet, Sütaş, Haliç Balık, Antalya Hal, Komşu Fırın, Diversey vb.).
  - **500 Kalem Ürün:** Farklı günlere, farklı departmanlara dağılmış; kabul edilmiş, şartlı, reddedilmiş ve bekleyen zengin veri kümesi.
  - Sistemin tüm filtrelerini, raporlarını ve mobil kartlarını anında test etme imkânı sağlar.

---

### 9. ☁️ Bulut Senkronizasyonu & Güvenlik (Firebase Firestore)
- **Gerçek Zamanlı Senkronizasyon:** Birden fazla cihazda (depo görevlisi el terminali, şef tableti, satınalma ofisi PC'si) yapılan işlemler anlık senkronize edilir.
- **Çevrimdışı / Yerel Yedek:** İnternet bağlantısı kesildiğinde yerel depolama (`localStorage`) ile kesintisiz çalışma.

---

## 🛠️ Teknoloji Yığını

- **Frontend:** React 18+, TypeScript, Vite
- **Stil & Tasarım:** Tailwind CSS, Lucide Icons, Motion (Framer Motion)
- **Veritabanı & Bulut:** Firebase Firestore
- **Raporlama:** jsPDF, SheetJS (XLSX), Recharts / D3
- **Mobil Desteği:** Responsive PWA/Webview uyumlu tasarım

---

## 🔐 Erişim ve Şifreler

| Özellik | Şifre / PIN | Açıklama |
| :--- | :---: | :--- |
| **Örnek Data Yükleme** | `1364` | Settings > Veri Yönetimi > 500 Kalem Örnek Veri Yükleme |
| **Yönetici / Fabrika Ayarları** | Onay / PIN | Sistem verilerini sıfırlama işlemlerinde güvenlik koruması |

---

*Receiving Easy — Mal Kabul, Kalite ve Gıda Güvenliğinde Hız ve Güven.*
