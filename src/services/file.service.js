import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

/* ─── Helpers for document parsing ─── */

async function extractTextFromDocx(arrayBuffer) {
  const zip = await JSZip.loadAsync(arrayBuffer);
  const docFile = zip.file("word/document.xml");
  if (!docFile) throw new Error("Documento XML no encontrado en DOCX.");
  const xmlText = await docFile.async("text");
  
  // Clean tags
  const clean = xmlText
    .replace(/<w:p[^>]*>/g, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .trim();
  return clean;
}

async function extractTextFromOdt(arrayBuffer) {
  const zip = await JSZip.loadAsync(arrayBuffer);
  const contentFile = zip.file("content.xml");
  if (!contentFile) throw new Error("content.xml no encontrado en ODT.");
  const xmlText = await contentFile.async("text");
  return xmlText
    .replace(/<text:p[^>]*>/g, '\n')
    .replace(/<[^>]*>/g, '')
    .trim();
}

function extractTextFromRtf(rtfText) {
  let cleanText = rtfText.replace(/\\([a-z]{1,32})(-?\d+)? ?|\\'{1}[0-9a-f]{2}|\\\{|\\\}|[\r\n]/gi, (match) => {
    if (match.startsWith("\\'")) {
      const hex = match.substring(2);
      return String.fromCharCode(parseInt(hex, 16));
    }
    return '';
  });
  return cleanText.replace(/^[^{]*{/g, '').replace(/}$/g, '').trim().replace(/\s+/g, ' ');
}

async function createOdtBuffer(text) {
  const zip = new JSZip();
  zip.file("mimetype", "application/vnd.oasis.opendocument.text");
  
  const manifestXml = `<?xml version="1.0" encoding="UTF-8"?>
<manifest:manifest xmlns:manifest="urn:oasis:names:tc:opendocument:xmlns:manifest:1.0" manifest:version="1.2">
  <manifest:file-entry manifest:full-path="/" manifest:version="1.2" manifest:media-type="application/vnd.oasis.opendocument.text"/>
  <manifest:file-entry manifest:full-path="content.xml" manifest:media-type="text/xml"/>
</manifest:manifest>`;
  zip.folder("META-INF").file("manifest.xml", manifestXml);
  
  const paragraphsXml = text.split('\n').map(line => {
    const escaped = line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return `<text:p>${escaped}</text:p>`;
  }).join('\n');
  
  const contentXml = `<?xml version="1.0" encoding="UTF-8"?>
<office:document-content xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0" xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0" office:version="1.2">
  <office:body>
    <office:text>
      ${paragraphsXml}
    </office:text>
  </office:body>
</office:document-content>`;
  zip.file("content.xml", contentXml);
  
  return await zip.generateAsync({ type: "nodebuffer" });
}

async function createEpubBuffer(text) {
  const zip = new JSZip();
  zip.file("mimetype", "application/epub+zip");
  
  const containerXml = `<?xml version="1.0"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`;
  zip.folder("META-INF").file("container.xml", containerXml);
  
  const contentOpf = `<?xml version="1.0" encoding="utf-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="bookid" version="2.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:title>Documento Convertido</dc:title>
    <dc:language>es</dc:language>
    <dc:identifier id="bookid">urn:uuid:12345</dc:identifier>
  </metadata>
  <manifest>
    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
    <item id="content" href="content.html" media-type="application/xhtml+xml"/>
  </manifest>
  <spine toc="ncx">
    <itemref idref="content"/>
  </spine>
</package>`;
  
  const paragraphsHtml = text.split('\n').map(line => {
    const escaped = line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return `<p>${escaped}</p>`;
  }).join('\n');
  
  const contentHtml = `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
  <head><title>Contenido</title></head>
  <body>
    ${paragraphsHtml}
  </body>
</html>`;
  
  const oebps = zip.folder("OEBPS");
  oebps.file("content.opf", contentOpf);
  oebps.file("content.html", contentHtml);
  
  return await zip.generateAsync({ type: "nodebuffer" });
}

export async function convertFileBuffer(fileBuffer, originalName, targetFormat) {
  const ext = originalName.split('.').pop().toLowerCase();
  const target = targetFormat.toLowerCase();

  // 1. SPREADSHEETS (xlsx, xls, ods, csv, tsv, json)
  const isSpreadsheetInput = ['xlsx', 'xls', 'ods', 'csv', 'tsv'].includes(ext);
  const isSpreadsheetTarget = ['xlsx', 'xls', 'ods', 'csv', 'tsv', 'json'].includes(target);

  if (isSpreadsheetInput && isSpreadsheetTarget) {
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });

    if (target === 'xlsx' || target === 'xls' || target === 'ods') {
      const bookTypeMap = { xlsx: 'xlsx', xls: 'xls', ods: 'ods' };
      const outBuffer = XLSX.write(workbook, { bookType: bookTypeMap[target], type: 'buffer' });
      const mimeMap = {
        xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        xls: 'application/vnd.ms-excel',
        ods: 'application/vnd.oasis.opendocument.spreadsheet'
      };
      return { buffer: outBuffer, mimeType: mimeMap[target], ext: target };
    }
    
    if (target === 'csv' || target === 'tsv') {
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const separator = target === 'tsv' ? '\t' : ',';
      const csvStr = XLSX.utils.sheet_to_csv(worksheet, { FS: separator });
      return {
        buffer: Buffer.from(csvStr, 'utf-8'),
        mimeType: target === 'tsv' ? 'text/tab-separated-values' : 'text/csv',
        ext: target,
      };
    }

    if (target === 'json') {
      const resultJson = {};
      workbook.SheetNames.forEach(sheetName => {
        const worksheet = workbook.Sheets[sheetName];
        resultJson[sheetName] = XLSX.utils.sheet_to_json(worksheet);
      });
      const finalData = workbook.SheetNames.length === 1 ? resultJson[workbook.SheetNames[0]] : resultJson;
      return {
        buffer: Buffer.from(JSON.stringify(finalData, null, 2), 'utf-8'),
        mimeType: 'application/json',
        ext: 'json',
      };
    }
  }

  // 2. ARCHIVES (zip, tar, gz)
  if (ext === 'zip' || ext === 'tar' || ext === 'gz' || target === 'zip' || target === 'tar' || target === 'gz') {
    if (ext === 'zip' && target === 'tar') {
      const zip = await JSZip.loadAsync(fileBuffer);
      const newZip = new JSZip();
      for (const filename of Object.keys(zip.files)) {
        if (!zip.files[filename].dir) {
          const content = await zip.files[filename].async("nodebuffer");
          newZip.file(filename, content);
        }
      }
      const buf = await newZip.generateAsync({ type: "nodebuffer" });
      return { buffer: buf, mimeType: 'application/x-tar', ext: 'tar' };
    }

    const zip = new JSZip();
    zip.file(originalName, fileBuffer);
    const buf = await zip.generateAsync({ type: "nodebuffer" });
    return { buffer: buf, mimeType: 'application/zip', ext: 'zip' };
  }

  // 3. DOCUMENTS (docx, pdf, txt, html, md, xml, tex, rtf, odt, epub)
  let extractedText = '';
  if (['txt', 'md', 'html', 'htm', 'xml', 'tex'].includes(ext)) {
    extractedText = fileBuffer.toString('utf-8');
    if ((ext === 'html' || ext === 'htm') && target === 'txt') {
      extractedText = extractedText.replace(/<[^>]*>/g, '');
    }
  } else if (ext === 'docx') {
    extractedText = await extractTextFromDocx(fileBuffer);
  } else if (ext === 'odt') {
    extractedText = await extractTextFromOdt(fileBuffer);
  } else if (ext === 'rtf') {
    extractedText = extractTextFromRtf(fileBuffer.toString('utf-8'));
  } else {
    extractedText = fileBuffer.toString('utf-8');
  }

  // Generate target document
  if (target === 'txt') {
    return { buffer: Buffer.from(extractedText, 'utf-8'), mimeType: 'text/plain', ext: 'txt' };
  }
  
  if (target === 'pdf') {
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontSize = 11;
    const margin = 40;
    
    let page = pdfDoc.addPage();
    const { width, height } = page.getSize();
    let y = height - margin;

    const lines = extractedText.split('\n');
    for (const line of lines) {
      if (y < margin + fontSize) {
        page = pdfDoc.addPage();
        y = height - margin;
      }
      // Truncate line if too long for simple pdf rendering
      const safeLine = line.substring(0, 90).replace(/[^\x20-\x7E]/g, '');
      page.drawText(safeLine, { x: margin, y, size: fontSize, font, color: rgb(0, 0, 0) });
      y -= fontSize + 4;
    }

    const pdfBytes = await pdfDoc.save();
    return { buffer: Buffer.from(pdfBytes), mimeType: 'application/pdf', ext: 'pdf' };
  }

  if (target === 'docx') {
    const paragraphs = extractedText.split('\n').map(line => {
      return new Paragraph({
        children: [new TextRun({ text: line || '', size: 24 })]
      });
    });
    const doc = new Document({
      sections: [{ children: paragraphs }]
    });
    const buf = await Packer.toBuffer(doc);
    return { buffer: buf, mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', ext: 'docx' };
  }

  if (target === 'html') {
    const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Documento Convertido</title>
</head>
<body>
  ${extractedText.split('\n').map(l => `<p>${l.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>`).join('\n')}
</body>
</html>`;
    return { buffer: Buffer.from(htmlContent, 'utf-8'), mimeType: 'text/html', ext: 'html' };
  }

  if (target === 'md') {
    return { buffer: Buffer.from(extractedText, 'utf-8'), mimeType: 'text/markdown', ext: 'md' };
  }

  if (target === 'xml') {
    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<document>
  <body>
    ${extractedText.split('\n').map(l => `    <p>${l.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>`).join('\n')}
  </body>
</document>`;
    return { buffer: Buffer.from(xmlContent, 'utf-8'), mimeType: 'application/xml', ext: 'xml' };
  }

  if (target === 'odt') {
    const buf = await createOdtBuffer(extractedText);
    return { buffer: buf, mimeType: 'application/vnd.oasis.opendocument.text', ext: 'odt' };
  }

  if (target === 'epub') {
    const buf = await createEpubBuffer(extractedText);
    return { buffer: buf, mimeType: 'application/epub+zip', ext: 'epub' };
  }

  // Default fallback text
  return { buffer: Buffer.from(extractedText, 'utf-8'), mimeType: 'text/plain', ext: 'txt' };
}
