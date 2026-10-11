import { AppSettings, DeliveryItem } from '../types';
import { esc, nowStamp, trDate } from './helpers';

// UTF-8 & CRC32 & ZIP Builder for pure client-side XLSX generation
const _utf8 = (str: string): Uint8Array => {
  if (typeof TextEncoder !== 'undefined') return new TextEncoder().encode(str);
  const bin = unescape(encodeURIComponent(str));
  const a = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i);
  return a;
};

const _crcTable = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

const _crc32 = (u8: Uint8Array): number => {
  let c = 0xffffffff;
  for (let i = 0; i < u8.length; i++) c = _crcTable[(c ^ u8[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};

interface ZipEntry {
  name: string;
  data: Uint8Array;
}

const zipStore = (files: ZipEntry[]): Uint8Array => {
  const parts: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  let offset = 0;

  files.forEach((f) => {
    const name = _utf8(f.name);
    const data = f.data;
    const crc = _crc32(data);

    const lh = new Uint8Array(30 + name.length);
    const lv = new DataView(lh.buffer);
    lv.setUint32(0, 0x04034b50, true);
    lv.setUint16(4, 20, true);
    lv.setUint32(14, crc, true);
    lv.setUint32(18, data.length, true);
    lv.setUint32(22, data.length, true);
    lv.setUint16(26, name.length, true);
    lh.set(name, 30);
    parts.push(lh, data);

    const ch = new Uint8Array(46 + name.length);
    const cv = new DataView(ch.buffer);
    cv.setUint32(0, 0x02014b50, true);
    cv.setUint16(4, 20, true);
    cv.setUint16(6, 20, true);
    cv.setUint32(16, crc, true);
    cv.setUint32(20, data.length, true);
    cv.setUint32(24, data.length, true);
    cv.setUint16(28, name.length, true);
    cv.setUint32(42, offset, true);
    ch.set(name, 46);
    central.push(ch);

    offset += lh.length + data.length;
  });

  const cdSize = central.reduce((a, c) => a + c.length, 0);
  const end = new Uint8Array(22);
  const ev = new DataView(end.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(8, files.length, true);
  ev.setUint16(10, files.length, true);
  ev.setUint32(12, cdSize, true);
  ev.setUint32(16, offset, true);

  const all = [...parts, ...central, end];
  const total = all.reduce((a, c) => a + c.length, 0);
  const out = new Uint8Array(total);
  let pos = 0;
  all.forEach((c) => {
    out.set(c, pos);
    pos += c.length;
  });
  return out;
};

const _xesc = (v: unknown): string =>
  String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

const colName = (n: number): string => {
  let s = '';
  n++;
  while (n > 0) {
    const m = (n - 1) % 26;
    s = String.fromCharCode(65 + m) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
};

const sheetXML = (rows: (string | number | null | undefined)[][], widths?: number[]): string => {
  const colTag =
    widths && widths.length
      ? '<cols>' + widths.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join('') + '</cols>'
      : '';
  const body = rows
    .map(
      (r, ri) =>
        '<row r="' +
        (ri + 1) +
        '">' +
        r
          .map((cell, ci) => {
            const ref = colName(ci) + (ri + 1);
            if (cell === null || cell === undefined || cell === '') return '';
            if (typeof cell === 'number' && isFinite(cell)) return `<c r="${ref}"><v>${cell}</v></c>`;
            return `<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${_xesc(cell)}</t></is></c>`;
          })
          .join('') +
        '</row>'
    )
    .join('');
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">${colTag}<sheetData>${body}</sheetData></worksheet>`;
};

export const buildXLSX = (rows: (string | number | null | undefined)[][], widths: number[], sheetName = 'Sheet1'): Uint8Array => {
  const files: ZipEntry[] = [
    {
      name: '[Content_Types].xml',
      data: _utf8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
</Types>`)
    },
    {
      name: '_rels/.rels',
      data: _utf8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`)
    },
    {
      name: 'xl/workbook.xml',
      data: _utf8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheets><sheet name="${_xesc(sheetName).slice(0, 28)}" sheetId="1" r:id="rId1"/></sheets></workbook>`)
    },
    {
      name: 'xl/_rels/workbook.xml.rels',
      data: _utf8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
</Relationships>`)
    },
    {
      name: 'xl/worksheets/sheet1.xml',
      data: _utf8(sheetXML(rows, widths))
    }
  ];
  return zipStore(files);
};

export const downloadBytes = (bytes: Uint8Array, filename: string, mime: string): boolean => {
  try {
    const blob = new Blob([bytes], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    return true;
  } catch {
    return false;
  }
};

const PRINT_CSS = `
@page { size: A4; margin: 10mm 10mm; }
* { box-sizing: border-box; }
body { margin: 0; font-family: "Segoe UI", -apple-system, system-ui, Roboto, sans-serif; color: #1e293b; font-size: 10.5px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.head { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #0f172a; padding-bottom: 8px; margin-bottom: 12px; }
.head h1 { margin: 0; font-size: 16px; letter-spacing: .06em; text-transform: uppercase; color: #0f172a; font-weight: 900; }
.head .sub { font-size: 10px; color: #475569; margin-top: 3px; font-weight: 700; }
.head .meta { text-align: right; font-size: 9.5px; color: #475569; line-height: 1.6; font-weight: 600; }
.tagline { display: inline-block; background: #0f172a; color: #fff; padding: 2px 8px; border-radius: 4px; font-size: 9px; letter-spacing: .12em; font-weight: 800; }
h2.sec { font-size: 11px; text-transform: uppercase; letter-spacing: .1em; color: #334155; margin: 16px 0 7px; padding-bottom: 4px; border-bottom: 1px solid #cbd5e1; font-weight: 800; }
.kpi-row { display: flex; gap: 8px; margin-bottom: 10px; }
.kpi { flex: 1; border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px 10px; background: #f8fafc; }
.kpi b { display: block; font-size: 18px; line-height: 1.1; font-weight: 900; }
.kpi span { font-size: 8px; text-transform: uppercase; letter-spacing: .09em; color: #64748b; font-weight: 800; }
.track { height: 9px; border: 1px solid #cbd5e1; border-radius: 99px; overflow: hidden; display: flex; margin: 6px 0 4px; }
.track i { display: block; height: 100%; }
.legend { font-size: 8.5px; color: #475569; font-weight: 700; }
table { width: 100%; border-collapse: collapse; margin-top: 4px; }
thead { display: table-header-group; }
tfoot { display: table-footer-group; }
tr { page-break-inside: avoid; }
th { background: #f1f5f9; color: #0f172a; font-size: 8.5px; text-transform: uppercase; letter-spacing: .04em; padding: 6px 7px; text-align: left; border-top: 1px solid #94a3b8; border-bottom: 1.5px solid #0f172a; font-weight: 800; }
td { padding: 5px 6px; border-bottom: 1px solid #e2e8f0; font-size: 9.5px; vertical-align: middle; }
td.c, th.c { text-align: center; }
tr.po-row td { background: #f8fafc; border-bottom: 1px solid #cbd5e1; padding-top: 7px; }
tr.po-row span { font-size: 8.5px; font-weight: 800; letter-spacing: .06em; color: #0f172a; border: 1px solid #cbd5e1; border-radius: 4px; padding: 2px 7px; background: #fff; }
.sup-block { page-break-inside: auto; border-top: 2px solid #0f172a; margin-top: 14px; padding-top: 6px; }
.sup-block:first-of-type { margin-top: 4px; }
table.items { table-layout: fixed; }
table.veh { table-layout: fixed; border-collapse: collapse; margin: 0 0 4px; background: #f8fafc; border-radius: 6px; overflow: hidden; }
table.veh td { border: 0; border-bottom: 1px solid #cbd5e1; padding: 6px 8px; vertical-align: bottom; }
table.veh td.vname { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: .03em; color: #0f172a; width: 38%; }
table.veh .vsub { font-size: 8.5px; font-weight: 600; color: #64748b; text-transform: none; margin-top: 2px; }
table.short { table-layout: fixed; margin-top: 4px; }
table.short td { padding: 4px 6px; font-size: 9.5px; border-bottom: 1px solid #e2e8f0; }
table.short td.sup { font-weight: 800; text-transform: uppercase; font-size: 9px; }
table.short tr.newsup td { border-top: 1.5px solid #0f172a; }
table.short td.blank { border-bottom: 1px solid #94a3b8; }
.pnote { font-style: italic; font-weight: 500; font-size: 8.5px; color: #b45309; margin-top: 2px; line-height: 1.3; }
table.veh .vlbl { display: block; font-size: 7.5px; text-transform: uppercase; letter-spacing: .05em; color: #64748b; font-weight: 800; margin-bottom: 3px; }
.bx { display: inline-block; width: 12px; height: 12px; border: 1.5px solid #64748b; border-radius: 3px; vertical-align: middle; }
.ln { display: inline-block; min-width: 44px; border-bottom: 1px solid #94a3b8; height: 12px; }
.sign { display: flex; gap: 40px; margin-top: 24px; page-break-inside: avoid; }
.sign div { flex: 1; border-top: 1.5px solid #0f172a; padding-top: 6px; font-size: 9.5px; color: #0f172a; font-weight: 800; }
.sign div small { display: block; font-weight: 500; color: #64748b; margin-top: 16px; font-size: 8.5px; }
.foot { margin-top: 16px; border-top: 1px solid #cbd5e1; padding-top: 6px; font-size: 8px; color: #64748b; display: flex; justify-content: space-between; font-weight: 600; }
`;

export const printDoc = (title: string, inner: string, landscape = false): void => {
  const orient = landscape
    ? `<style>
      @page { size: A4 landscape; margin: 9mm 9mm; }
      body { font-size: 10.5px; }
      td { padding: 5px 6px; font-size: 10px; }
      th { font-size: 9px; padding: 6px 7px; }
      .sup-block { margin-top: 14px; }
      .sign { gap: 60px; margin-top: 24px; }
    </style>`
    : '';

  const html = `<!DOCTYPE html><html lang="tr"><head><meta charset="utf-8"><title>${esc(title)}</title><style>${PRINT_CSS}</style>${orient}
    <style media="screen">
      body { background: #f1f5f9; padding: 18px; }
      .toolbar { position: sticky; top: 0; background: #0b1220; color: #fff; padding: 12px 18px; border-radius: 12px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center; font-family: system-ui, sans-serif; box-shadow: 0 10px 25px rgba(0,0,0,0.15); z-index: 100; }
      .toolbar button { background: #7c3aed; color: #fff; border: 0; padding: 10px 18px; border-radius: 9px; font-weight: 800; cursor: pointer; font-size: 13px; }
      .sheet { background: #fff; padding: 20px 24px; border-radius: 12px; box-shadow: 0 8px 30px rgba(15,23,42,.08); max-width: ${landscape ? '1140px' : '840px'}; margin: 0 auto; }
      .toolbar { max-width: ${landscape ? '1140px' : '840px'}; margin: 0 auto 16px; }
    </style>
    <style media="print">
      .toolbar { display: none; }
      .sheet { box-shadow: none; padding: 0; border-radius: 0; }
      body { background: #fff; padding: 0; }
    </style>
    </head><body>
    <div class="toolbar"><span><b>${esc(title)}</b> — Yazdır / PDF Olarak Kaydet</span><button onclick="window.print()">🖨 PDF Olarak Kaydet</button></div>
    <div class="sheet">${inner}</div>
    <script>setTimeout(function(){ try{ window.print(); } catch(e){} }, 600);<\/script>
    </body></html>`;

  const w = window.open('', '_blank');
  if (w && w.document) {
    w.document.open();
    w.document.write(html);
    w.document.close();
    return;
  }

  // Fallback if popup blocked
  const f = document.createElement('iframe');
  f.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;border:0;z-index:9999;background:#fff';
  f.setAttribute('srcdoc', html);
  const close = document.createElement('button');
  close.textContent = '✕ Kapat';
  close.style.cssText =
    'position:fixed;top:14px;right:14px;z-index:10000;background:#0b1220;color:#fff;border-radius:99px;padding:8px 16px;font-size:13px;font-weight:800;border:0;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,0.3)';
  close.onclick = () => {
    f.remove();
    close.remove();
  };
  document.body.appendChild(f);
  document.body.appendChild(close);
};

export const docHeader = (title: string, sub: string, metaLines: string[]): string =>
  `<div class="head">
    <div>
      <span class="tagline">RECEIVING EASY</span>
      <h1 style="margin-top:5px">${esc(title)}</h1>
      <div class="sub">${esc(sub)}</div>
    </div>
    <div class="meta">${metaLines.map((l) => esc(l)).join('<br>')}</div>
  </div>`;

export const docFooter = (settings: AppSettings): string =>
  `<div class="foot">
    <span>${esc(settings.company)}</span>
    <span>Oluşturma: ${nowStamp()} · ${esc(settings.username)}</span>
  </div>`;

// Daily Food Entrance Check List HTML
export const generateDailyChecklistHTML = (
  items: DeliveryItem[],
  dateStr: string,
  withData: boolean,
  settings: AppSettings
): string => {
  const head = docHeader(
    'Günlük Gıda Giriş Kontrol Listesi',
    'Daily Food Entrance Check List',
    [
      'Tarih / Date: ' + trDate(dateStr),
      'Kontrol Eden / Inspector: ' + (withData ? settings.username : '_______________'),
      withData ? 'Kayıt: Sistem Onaylı' : 'Giriş Saati: ____ : ____'
    ]
  );

  if (!items.length) {
    return (
      head +
      `<p style="margin-top:30px;text-align:center;color:#64748b">${esc(trDate(dateStr))} için teslimat kaydı bulunamadı. / No deliveries for this date.</p>` +
      docFooter(settings)
    );
  }

  const mark = (v: boolean) => (withData ? (v ? '✓' : '✗') : '<span class="bx"></span>');
  const na = '<span style="color:#94a3b8">—</span>';
  const temp = (v: number) => (withData ? `${Number(v) || 0} °C` : '<span class="ln"></span> °C');
  const expc = (v?: string) => (withData ? (v ? trDate(v) : '—') : '<span class="ln" style="min-width:80px"></span>');
  const stc = (st: string) =>
    withData
      ? { approved: 'Kabul', conditional: 'Şartlı', rejected: 'Red', pending: 'Bekliyor' }[st] || st
      : '<span class="bx"></span> A &nbsp;<span class="bx"></span> C &nbsp;<span class="bx"></span> R';

  const sups: Record<string, DeliveryItem[]> = {};
  items.forEach((i) => {
    sups[i.supplierName] = sups[i.supplierName] || [];
    sups[i.supplierName].push(i);
  });

  const blocks = Object.keys(sups)
    .sort()
    .map((name) => {
      const list = sups[name];
      const f = list[0];
      const pos = [...new Set(list.map((i) => i.poNumber))];

      const vehicle = `<table class="veh"><tbody><tr>
      <td class="vname">${esc(name)}<div class="vsub">${pos.length} PO · ${list.length} Kalem / Lines</div></td>
      <td class="c"><span class="vlbl">Araç Plaka / Plate</span><span class="ln" style="min-width:96px"></span></td>
      <td class="c"><span class="vlbl">Saat / Time</span>${withData && f.recordedAt ? esc(f.recordedAt.slice(11)) : '<span class="ln" style="min-width:50px"></span>'}</td>
      <td class="c"><span class="vlbl">Araç Hijyen / Truck</span>${mark(f.truckCheck)}</td>
      <td class="c"><span class="vlbl">Araç Sıc. / Truck Temp</span>${temp(f.truckTemp)}</td>
      </tr></tbody></table>`;

      let lastKey = '';
      const rows = list
        .map((i) => {
          const key = i.poNumber + '||' + i.subject;
          let sep = '';
          if (key !== lastKey) {
            lastKey = key;
            sep = `<tr class="po-row"><td colspan="8"><span>${esc(i.poNumber)} &nbsp;·&nbsp; ${esc(i.subject)}${i.department ? ' &nbsp;·&nbsp; ' + esc(i.department) : ''}</span></td></tr>`;
          }
          return (
            sep +
            `<tr>
          <td style="font-weight:700">${esc(i.productName)}${i.note ? `<div class="pnote">✎ ${esc(i.note)}</div>` : ''}</td>
          <td class="c">${esc(i.orderQty)} ${esc(i.uom)}</td>
          <td class="c">${mark(i.labelCheck)}</td>
          <td class="c">${mark(i.physicalCheck)}</td>
          <td class="c">${temp(i.productTemp)}</td>
          <td class="c">${expc(i.expDate)}</td>
          <td class="c">${stc(i.status)}</td>
          <td></td>
        </tr>`
          );
        })
        .join('');

      return `<div class="sup-block">${vehicle}
      <table class="items"><thead><tr>
        <th style="width:30%">Ürün / Product</th>
        <th class="c" style="width:10%">Miktar / Qty</th>
        <th class="c" style="width:8%">Etiket / Label</th>
        <th class="c" style="width:8%">Fiziksel / Phys</th>
        <th class="c" style="width:11%">Ürün Sıc / Temp</th>
        <th class="c" style="width:12%">SKT / Exp Date</th>
        <th class="c" style="width:11%">Sonuç / Result</th>
        <th style="width:10%">İmza/Not</th>
      </tr></thead>
      <tbody>${rows}</tbody></table></div>`;
    })
    .join('');

  const sign = `<div class="sign">
    <div>Teslim Alan / Receiving Agent<small>Ad Soyad – İmza / Name, Surname – Signature</small></div>
    <div>Satınalma / Purchasing Manager<small>Ad Soyad – İmza / Name, Surname – Signature</small></div>
    <div>Gıda Güvenliği / Hygiene Officer<small>Ad Soyad – İmza / Name, Surname – Signature</small></div>
  </div>`;

  return head + blocks + sign + docFooter(settings);
};

// Short Daily Check List HTML
export const generateShortChecklistHTML = (items: DeliveryItem[], dateStr: string, settings: AppSettings): string => {
  const head = docHeader('Short Daily Check List', 'Kısa Günlük Mal Kabul Kontrol Listesi', [
    'Date: ' + trDate(dateStr),
    'Received by: _______________',
    'Signature: _______________'
  ]);

  if (!items.length) {
    return head + '<p style="margin-top:26px;text-align:center;color:#64748b">Bu tarih için beklenen teslimat yok.</p>' + docFooter(settings);
  }

  let lastSup = '';
  const rows = items
    .map((i) => {
      const newSup = i.supplierName !== lastSup;
      lastSup = i.supplierName;
      return `<tr class="${newSup ? 'newsup' : ''}">
      <td class="sup">${newSup ? esc(i.supplierName) : ''}</td>
      <td class="c">${esc(i.poNumber)}</td>
      <td>${esc(i.productName)}${i.note ? `<div class="pnote">✎ ${esc(i.note)}</div>` : ''}</td>
      <td class="c">${esc(i.orderQty)}</td>
      <td class="c">${esc(i.uom)}</td>
      <td class="blank"></td>
    </tr>`;
    })
    .join('');

  return (
    head +
    `<table class="short"><thead><tr>
      <th style="width:20%">Supplier / Tedarikçi</th>
      <th class="c" style="width:11%">PO Number</th>
      <th style="width:33%">Product / Ürün</th>
      <th class="c" style="width:8%">Qty</th>
      <th class="c" style="width:8%">UOM</th>
      <th style="width:20%">Check / Notes / İmza</th>
    </tr></thead><tbody>${rows}</tbody></table>` +
    docFooter(settings)
  );
};

// Short Check List XLSX Generator
export const exportShortChecklistXLSX = (items: DeliveryItem[], dateStr: string): boolean => {
  const rows: (string | number)[][] = [
    ['Short Daily Check List', '', '', '', '', ''],
    ['Date', trDate(dateStr), '', '', '', ''],
    [],
    ['Supplier', 'PO', 'Product', 'Note', 'Qty', 'UOM', 'Check / Notes']
  ];
  items.forEach((i) =>
    rows.push([
      i.supplierName,
      i.poNumber,
      i.productName,
      i.note || '',
      typeof i.orderQty === 'number' ? i.orderQty : Number(i.orderQty) || String(i.orderQty),
      i.uom || '',
      ''
    ])
  );
  const bytes = buildXLSX(rows, [28, 15, 38, 30, 10, 10, 24], 'Short Check List');
  return downloadBytes(bytes, `short-daily-check-list-${dateStr}.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
};
