import { encodeInput, decodeInput, cleanWeirdJSON } from '../services/encoder.service.js';
import { imageBufferToBase64, base64ToImageBuffer, resizeImageBuffer, convertImageBuffer } from '../services/image.service.js';
import { convertFileBuffer } from '../services/file.service.js';
import { convertMediaBuffer } from '../services/media.service.js';

export async function handleEncoder(req, res) {
  try {
    const { input = '', type = 'base64', action = 'encode' } = req.body;
    let result = '';

    if (action === 'encode') {
      result = encodeInput(input, type);
    } else if (action === 'decode') {
      result = decodeInput(input, type);
    } else if (action === 'format') {
      result = cleanWeirdJSON(input);
    } else {
      return res.status(400).json({ success: false, message: 'Acción no soportada' });
    }

    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}

export async function handleImageBase64(req, res) {
  try {
    if (req.file) {
      const mimeType = req.file.mimetype || 'image/png';
      const base64 = imageBufferToBase64(req.file.buffer, mimeType);
      return res.json({ success: true, base64 });
    }

    const { base64 } = req.body;
    if (base64) {
      const { buffer, mimeType } = base64ToImageBuffer(base64);
      const dataUrl = imageBufferToBase64(buffer, mimeType);
      return res.json({ success: true, base64: dataUrl });
    }

    res.status(400).json({ success: false, message: 'No se envió ninguna imagen o Base64' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function handleImageResize(req, res) {
  try {
    let inputBuffer;
    let originalMime = 'image/png';

    if (req.file) {
      inputBuffer = req.file.buffer;
      originalMime = req.file.mimetype;
    } else if (req.body.base64) {
      const parsed = base64ToImageBuffer(req.body.base64);
      inputBuffer = parsed.buffer;
      originalMime = parsed.mimeType;
    } else {
      return res.status(400).json({ success: false, message: 'Se requiere una imagen para redimensionar' });
    }

    const { width, height, format = 'png', quality = 0.9, lockRatio = true } = req.body;

    const result = await resizeImageBuffer(inputBuffer, {
      width,
      height,
      format,
      quality,
      lockRatio: lockRatio === 'true' || lockRatio === true,
    });

    res.setHeader('Content-Type', result.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="resized.${result.ext}"`);
    res.send(result.buffer);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function handleFileConvert(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Archivo no proporcionado' });
    }

    const { targetFormat } = req.body;
    if (!targetFormat) {
      return res.status(400).json({ success: false, message: 'Formato destino no especificado' });
    }

    const result = await convertFileBuffer(req.file.buffer, req.file.originalname, targetFormat);

    const baseName = req.file.originalname.substring(0, req.file.originalname.lastIndexOf('.')) || 'converted';
    res.setHeader('Content-Type', result.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${baseName}_converted.${result.ext}"`);
    res.send(result.buffer);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function handleImageConvert(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Imagen no proporcionada' });
    }

    const { targetFormat = 'png', quality = 0.9 } = req.body;
    const ext = req.file.originalname.split('.').pop().toLowerCase();

    const result = await convertImageBuffer(req.file.buffer, ext, {
      targetFormat,
      quality: parseFloat(quality),
    });

    const baseName = req.file.originalname.substring(0, req.file.originalname.lastIndexOf('.')) || 'converted';
    res.setHeader('Content-Type', result.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${baseName}_converted.${result.ext}"`);
    res.send(result.buffer);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function handleVideoConvert(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Video no proporcionado' });
    }

    const { targetFormat = 'mp4', speed = 1.0 } = req.body;
    const ext = req.file.originalname.split('.').pop().toLowerCase();

    const result = await convertMediaBuffer(req.file.buffer, ext, targetFormat, { speed });

    const baseName = req.file.originalname.substring(0, req.file.originalname.lastIndexOf('.')) || 'converted';
    res.setHeader('Content-Type', result.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${baseName}_converted.${result.ext}"`);
    res.send(result.buffer);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function handleAudioConvert(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Audio no proporcionado' });
    }

    const { targetFormat = 'mp3' } = req.body;
    const ext = req.file.originalname.split('.').pop().toLowerCase();

    const result = await convertMediaBuffer(req.file.buffer, ext, targetFormat);

    const baseName = req.file.originalname.substring(0, req.file.originalname.lastIndexOf('.')) || 'converted';
    res.setHeader('Content-Type', result.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${baseName}_converted.${result.ext}"`);
    res.send(result.buffer);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}
