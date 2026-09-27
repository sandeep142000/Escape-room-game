/* ============================================================================
   Verify Me — .xlsx writer
   Builds a real Excel workbook in the browser with no external library.

   An .xlsx file is a ZIP of XML parts. We write the ZIP with the "stored"
   method (no compression), which needs only a CRC-32 — a few hundred rows of
   scores is small enough that compression buys nothing.
   ========================================================================== */
(function (global) {
  "use strict";

  /* ------------------------------------------------------------------ CRC */
  var CRC_TABLE = (function () {
    var table = new Uint32Array(256);
    for (var n = 0; n < 256; n++) {
      var c = n;
      for (var k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      table[n] = c >>> 0;
    }
    return table;
  })();

  function crc32(bytes) {
    var c = 0xFFFFFFFF;
    for (var i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xFF] ^ (c >>> 8);
    return (c ^ 0xFFFFFFFF) >>> 0;
  }

  var utf8 = function (str) { return new TextEncoder().encode(str); };

  /* ------------------------------------------------------------------ ZIP */
  function Bytes() { this.parts = []; this.length = 0; }
  Bytes.prototype.push = function (arr) { this.parts.push(arr); this.length += arr.length; };
  Bytes.prototype.u16 = function (v) { this.push(new Uint8Array([v & 0xFF, (v >>> 8) & 0xFF])); };
  Bytes.prototype.u32 = function (v) {
    this.push(new Uint8Array([v & 0xFF, (v >>> 8) & 0xFF, (v >>> 16) & 0xFF, (v >>> 24) & 0xFF]));
  };
  Bytes.prototype.merge = function () {
    var out = new Uint8Array(this.length), at = 0;
    this.parts.forEach(function (p) { out.set(p, at); at += p.length; });
    return out;
  };

  function zip(files) {
    var out = new Bytes(), central = [], offset = 0;

    files.forEach(function (f) {
      var name = utf8(f.name), data = utf8(f.data), crc = crc32(data);
      var start = offset;

      out.u32(0x04034B50); out.u16(20); out.u16(0); out.u16(0);
      out.u16(0); out.u16(0);                                    // DOS time/date
      out.u32(crc); out.u32(data.length); out.u32(data.length);
      out.u16(name.length); out.u16(0);
      out.push(name); out.push(data);
      offset += 30 + name.length + data.length;

      central.push({ name: name, crc: crc, size: data.length, offset: start });
    });

    var cdStart = offset;
    central.forEach(function (e) {
      out.u32(0x02014B50); out.u16(20); out.u16(20); out.u16(0); out.u16(0);
      out.u16(0); out.u16(0);
      out.u32(e.crc); out.u32(e.size); out.u32(e.size);
      out.u16(e.name.length); out.u16(0); out.u16(0); out.u16(0); out.u16(0);
      out.u32(0); out.u32(e.offset);
      out.push(e.name);
      offset += 46 + e.name.length;
    });

    out.u32(0x06054B50); out.u16(0); out.u16(0);
    out.u16(central.length); out.u16(central.length);
    out.u32(offset - cdStart); out.u32(cdStart); out.u16(0);

    return out.merge();
  }

  /* ----------------------------------------------------------------- SHEET */
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" }[c];
    });
  }

  function colName(n) {                       // 0 -> A, 26 -> AA
    var s = "";
    for (n += 1; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + ((n - 1) % 26)) + s;
    return s;
  }

  function sheetXml(rows) {
    var body = rows.map(function (row, r) {
      var cells = row.map(function (value, c) {
        var ref = colName(c) + (r + 1);
        var style = r === 0 ? ' s="1"' : "";
        if (typeof value === "number" && isFinite(value)) {
          return '<c r="' + ref + '"' + style + '><v>' + value + "</v></c>";
        }
        return '<c r="' + ref + '"' + style + ' t="inlineStr"><is><t xml:space="preserve">' +
               esc(value == null ? "" : value) + "</t></is></c>";
      }).join("");
      return '<row r="' + (r + 1) + '">' + cells + "</row>";
    }).join("");

    var widths = (rows[0] || []).map(function (h, i) {
      var longest = rows.reduce(function (m, row) {
        return Math.max(m, String(row[i] == null ? "" : row[i]).length);
      }, 0);
      return '<col min="' + (i + 1) + '" max="' + (i + 1) + '" width="' +
             Math.min(42, Math.max(9, longest + 3)) + '" customWidth="1"/>';
    }).join("");

    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
      "<cols>" + widths + "</cols>" +
      '<sheetData>' + body + "</sheetData></worksheet>";
  }

  /* Builds a single-sheet workbook. rows[0] is the header. */
  function build(sheetTitle, rows) {
    var files = [
      { name: "[Content_Types].xml", data:
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
        '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
        '<Default Extension="xml" ContentType="application/xml"/>' +
        '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
        '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>' +
        '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
        "</Types>" },

      { name: "_rels/.rels", data:
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
        "</Relationships>" },

      { name: "xl/workbook.xml", data:
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" ' +
        'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
        '<sheets><sheet name="' + esc(sheetTitle).slice(0, 31) + '" sheetId="1" r:id="rId1"/></sheets>' +
        "</workbook>" },

      { name: "xl/_rels/workbook.xml.rels", data:
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>' +
        '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>' +
        "</Relationships>" },

      { name: "xl/styles.xml", data:
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
        '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
        '<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font>' +
        '<font><b/><sz val="11"/><name val="Calibri"/></font></fonts>' +
        '<fills count="1"><fill><patternFill patternType="none"/></fill></fills>' +
        '<borders count="1"><border/></borders>' +
        '<cellStyleXfs count="1"><xf/></cellStyleXfs>' +
        '<cellXfs count="2"><xf xfId="0"/><xf xfId="0" fontId="1" applyFont="1"/></cellXfs>' +
        "</styleSheet>" },

      { name: "xl/worksheets/sheet1.xml", data: sheetXml(rows) }
    ];

    return zip(files);
  }

  function download(filename, sheetTitle, rows) {
    var blob = new Blob([build(sheetTitle, rows)], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  global.VM_XLSX = { build: build, download: download };
})(window);
