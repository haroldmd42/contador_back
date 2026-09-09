import sharp from 'sharp';
import fs from 'fs';

async function testAll() {
  console.log('--- Testing 1. Encoder ---');
  const encRes = await fetch('http://localhost:3000/api/tools/encoder', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ input: 'QA Tools Test', type: 'base64', action: 'encode' })
  }).then(r => r.json());
  console.log('Encoder Result:', encRes);

  console.log('\n--- Generating sample PNG image ---');
  const pngBuffer = await sharp({
    create: {
      width: 100,
      height: 100,
      channels: 4,
      background: { r: 255, g: 0, b: 0, alpha: 1 }
    }
  }).png().toBuffer();

  console.log('\n--- Testing 2. Image Base64 ---');
  const formDataB64 = new FormData();
  formDataB64.append('file', new Blob([pngBuffer], { type: 'image/png' }), 'test.png');
  const b64Res = await fetch('http://localhost:3000/api/tools/image-base64', {
    method: 'POST',
    body: formDataB64
  }).then(r => r.json());
  console.log('Image Base64 success:', b64Res.success, 'Base64 length:', b64Res.base64?.length);

  console.log('\n--- Testing 3. Image Resize ---');
  const formDataResize = new FormData();
  formDataResize.append('file', new Blob([pngBuffer], { type: 'image/png' }), 'test.png');
  formDataResize.append('width', '50');
  formDataResize.append('height', '50');
  formDataResize.append('format', 'png');
  const resizeRes = await fetch('http://localhost:3000/api/tools/image-resize', {
    method: 'POST',
    body: formDataResize
  });
  console.log('Image Resize status:', resizeRes.status, 'Content-Type:', resizeRes.headers.get('content-type'));

  console.log('\n--- Testing 5. Image Convert ---');
  const formDataImgConv = new FormData();
  formDataImgConv.append('file', new Blob([pngBuffer], { type: 'image/png' }), 'test.png');
  formDataImgConv.append('targetFormat', 'jpg');
  formDataImgConv.append('quality', '0.8');
  const imgConvRes = await fetch('http://localhost:3000/api/tools/image-convert', {
    method: 'POST',
    body: formDataImgConv
  });
  console.log('Image Convert status:', imgConvRes.status, 'Content-Type:', imgConvRes.headers.get('content-type'));

  console.log('\n--- Testing 4. File Convert (TXT to PDF) ---');
  const formDataFileConv = new FormData();
  formDataFileConv.append('file', new Blob(['Hola este es un archivo de prueba para QA TOOLS'], { type: 'text/plain' }), 'documento.txt');
  formDataFileConv.append('targetFormat', 'pdf');
  const fileConvRes = await fetch('http://localhost:3000/api/tools/file-convert', {
    method: 'POST',
    body: formDataFileConv
  });
  console.log('File Convert status:', fileConvRes.status, 'Content-Type:', fileConvRes.headers.get('content-type'));

  console.log('\n--- All tests completed successfully! ---');
}

testAll().catch(console.error);
