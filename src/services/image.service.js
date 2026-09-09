import sharp from 'sharp';
import { PDFDocument } from 'pdf-lib';

/** Converts image buffer to Base64 data URL */
export function imageBufferToBase64(buffer, mimeType = 'image/png') {
  const base64 = buffer.toString('base64');
  return `data:${mimeType};base64,${base64}`;
}

/** Parses base64 data string to buffer and mimeType */
export function base64ToImageBuffer(base64String) {
  if (!base64String) throw new Error('Base64 string es requerido');
  
  let matches = base64String.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  if (matches && matches.length === 3) {
    return {
      mimeType: matches[1],
      buffer: Buffer.from(matches[2], 'base64'),
    };
  }
  
  // Direct base64 string without data prefix
  return {
    mimeType: 'image/png',
    buffer: Buffer.from(base64String, 'base64'),
  };
}

/** Binary scanner to extract embedded JPEG preview from camera RAW files */
function extractJpegFromRawBuffer(buffer) {
  const length = buffer.length;
  const matches = [];

  for (let i = 0; i < length - 4; i++) {
    if (buffer[i] === 0xFF && buffer[i + 1] === 0xD8) {
      for (let j = i + 2; j < length - 1; j++) {
        if (buffer[j] === 0xFF && buffer[j + 1] === 0xD9) {
          const size = (j + 2) - i;
          if (size > 15000) {
            matches.push({ start: i, end: j + 2, size });
          }
          break;
        }
      }
    }
  }

  if (matches.length === 0) {
    throw new Error('No se encontró previsualización JPEG en el archivo RAW.');
  }

  matches.sort((a, b) => b.size - a.size);
  return buffer.subarray(matches[0].start, matches[0].end);
}

/** Resize image using sharp */
export async function resizeImageBuffer(inputBuffer, options = {}) {
  const { width, height, format = 'png', quality = 90, lockRatio = true } = options;

  let targetFormat = format.toLowerCase().replace('image/', '');
  if (targetFormat === 'jpeg') targetFormat = 'jpg';

  let sharpInstance = sharp(inputBuffer);
  
  if (width || height) {
    const resizeOptions = {
      fit: lockRatio ? 'contain' : 'fill',
      withoutEnlargement: false,
    };
    if (width) resizeOptions.width = parseInt(width, 10);
    if (height) resizeOptions.height = parseInt(height, 10);

    sharpInstance = sharpInstance.resize(resizeOptions);
  }

  const q = Math.round((parseFloat(quality) <= 1 ? parseFloat(quality) * 100 : parseFloat(quality)));

  switch (targetFormat) {
    case 'jpg':
      sharpInstance = sharpInstance.jpeg({ quality: Math.max(1, Math.min(100, q)) });
      break;
    case 'webp':
      sharpInstance = sharpInstance.webp({ quality: Math.max(1, Math.min(100, q)) });
      break;
    case 'gif':
      sharpInstance = sharpInstance.gif();
      break;
    case 'png':
    default:
      sharpInstance = sharpInstance.png({ compressionLevel: 9 });
      break;
  }

  const outputBuffer = await sharpInstance.toBuffer();
  const mimeType = targetFormat === 'jpg' ? 'image/jpeg' : `image/${targetFormat}`;

  return {
    buffer: outputBuffer,
    mimeType,
    ext: targetFormat === 'jpg' ? 'jpg' : targetFormat,
  };
}

/** Convert image format using sharp & pdf-lib */
export async function convertImageBuffer(inputBuffer, originalExtension, options = {}) {
  const { targetFormat = 'png', quality = 0.9 } = options;

  let processBuffer = inputBuffer;

  // Handle RAW formats by extracting embedded JPEG
  if (['cr2', 'cr3', 'nef', 'arw', 'dng', 'raf', 'rw2'].includes(originalExtension.toLowerCase())) {
    processBuffer = extractJpegFromRawBuffer(inputBuffer);
  }

  const normTarget = targetFormat.toLowerCase().replace('image/', '');

  // Convert image to PDF document
  if (normTarget === 'pdf') {
    const pngOrJpgBuffer = await sharp(processBuffer).toFormat('png').toBuffer();
    const pdfDoc = await PDFDocument.create();
    const image = await pdfDoc.embedPng(pngOrJpgBuffer);
    const page = pdfDoc.addPage([image.width, image.height]);
    page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
    const pdfBytes = await pdfDoc.save();
    return {
      buffer: Buffer.from(pdfBytes),
      mimeType: 'application/pdf',
      ext: 'pdf',
    };
  }

  return await resizeImageBuffer(processBuffer, {
    format: normTarget,
    quality: quality,
    lockRatio: true,
  });
}
