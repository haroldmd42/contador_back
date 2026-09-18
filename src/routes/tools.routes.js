import express from 'express';
import multer from 'multer';
import {
  handleEncoder,
  handleImageBase64,
  handleImageResize,
  handleFileConvert,
  handleImageConvert,
  handleVideoConvert,
  handleAudioConvert,
  handleProxyFrame,
} from '../controllers/tools.controller.js';

const router = express.Router();

// Memory storage for multer handling up to 100MB uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 },
});

router.post('/encoder', handleEncoder);
router.post('/image-base64', upload.single('file'), handleImageBase64);
router.post('/image-resize', upload.single('file'), handleImageResize);
router.post('/file-convert', upload.single('file'), handleFileConvert);
router.post('/image-convert', upload.single('file'), handleImageConvert);
router.post('/video-convert', upload.single('file'), handleVideoConvert);
router.post('/audio-convert', upload.single('file'), handleAudioConvert);
router.get('/proxy-frame', handleProxyFrame);

export default router;
