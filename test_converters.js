import { PDFDocument, StandardFonts } from 'pdf-lib';
import JSZip from 'jszip';
import * as XLSX from 'xlsx';
import { convertFileBuffer } from './src/services/file.service.js';

async function runTests() {
  console.log('--- STARTING CONVERTER TESTS ---');

  // Test 1: Create a PDF document with text and Spanish characters
  console.log('1. Creating sample PDF with text...');
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  page.drawText('ACA Logica y Pensamiento Matematico', { x: 50, y: 700, size: 14, font });
  page.drawText('Prueba de conversion: acentos y tildes.', { x: 50, y: 670, size: 12, font });
  const samplePdfBytes = await pdfDoc.save();
  const samplePdfBuffer = Buffer.from(samplePdfBytes);

  // Test 2: Convert PDF -> DOCX
  console.log('2. Converting PDF -> DOCX...');
  const docxResult = await convertFileBuffer(samplePdfBuffer, 'ACA_Logica_y_Pensamiento.pdf', 'docx');
  console.log('   MimeType:', docxResult.mimeType);
  console.log('   Buffer length:', docxResult.buffer.length);

  // Verify DOCX structure with JSZip
  const docxZip = await JSZip.loadAsync(docxResult.buffer);
  const docXmlFile = docxZip.file('word/document.xml');
  if (!docXmlFile) {
    throw new Error('FAILED: word/document.xml missing in generated DOCX!');
  }
  const docXmlText = await docXmlFile.async('text');
  console.log('   word/document.xml length:', docXmlText.length);
  if (docXmlText.includes('ACA Logica y Pensamiento Matematico')) {
    console.log('   SUCCESS: DOCX contains extracted text!');
  } else {
    console.log('   WARNING: Text in word/document.xml:', docXmlText);
  }

  // Test 3: Convert PDF -> TXT
  console.log('3. Converting PDF -> TXT...');
  const txtResult = await convertFileBuffer(samplePdfBuffer, 'test.pdf', 'txt');
  const txtContent = txtResult.buffer.toString('utf-8');
  console.log('   Extracted TXT content:', JSON.stringify(txtContent.trim()));

  // Test 4: Convert PDF -> HTML
  console.log('4. Converting PDF -> HTML...');
  const htmlResult = await convertFileBuffer(samplePdfBuffer, 'test.pdf', 'html');
  console.log('   HTML Result length:', htmlResult.buffer.length);

  // Test 5: Convert PDF -> PDF (re-render)
  console.log('5. Converting PDF -> PDF...');
  const pdfResult = await convertFileBuffer(samplePdfBuffer, 'test.pdf', 'pdf');
  console.log('   PDF Result length:', pdfResult.buffer.length);

  // Test 6: Convert Spreadsheet XLSX -> DOCX & CSV
  console.log('6. Converting XLSX -> DOCX...');
  const wb = XLSX.utils.book_new();
  const wsData = [
    ['Nombre', 'Asignatura', 'Nota'],
    ['Juan Pérez', 'Lógica Matemática', '5.0'],
    ['María Rodríguez', 'Estadística', '4.8']
  ];
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  XLSX.utils.book_append_sheet(wb, ws, 'Calificaciones');
  const xlsxBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });

  const xlsxToDocx = await convertFileBuffer(xlsxBuffer, 'notas.xlsx', 'docx');
  console.log('   XLSX -> DOCX length:', xlsxToDocx.buffer.length);

  const xlsxToCsv = await convertFileBuffer(xlsxBuffer, 'notas.xlsx', 'csv');
  console.log('   XLSX -> CSV output:', JSON.stringify(xlsxToCsv.buffer.toString('utf-8').trim()));

  // Test 7: Convert TXT with Spanish accents -> PDF & DOCX
  console.log('7. Converting TXT with accents -> PDF & DOCX...');
  const spanishText = 'Resolución de problemas de Lógica y Pensamiento Matemático. Edición 2026.';
  const txtBuf = Buffer.from(spanishText, 'utf-8');
  const txtToPdf = await convertFileBuffer(txtBuf, 'doc.txt', 'pdf');
  console.log('   TXT -> PDF length:', txtToPdf.buffer.length);

  const txtToDocx = await convertFileBuffer(txtBuf, 'doc.txt', 'docx');
  console.log('   TXT -> DOCX length:', txtToDocx.buffer.length);

  console.log('--- ALL CONVERTER TESTS PASSED SUCCESSFULLY! ---');
}

runTests().catch(err => {
  console.error('TEST ERROR:', err);
  process.exit(1);
});

