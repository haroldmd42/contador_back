import { convertMediaBuffer } from '../src/services/media.service.js';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import fs from 'fs';
import path from 'path';
import os from 'os';

ffmpeg.setFfmpegPath(ffmpegPath);

async function runVerification() {
  console.log('Generating test input video (10s, 640x360)...');
  const tempInput = path.join(os.tmpdir(), 'test_verify_input.mp4');

  await new Promise((resolve, reject) => {
    ffmpeg()
      .input('testsrc=size=640x360:rate=30')
      .inputFormat('lavfi')
      .input('sine=frequency=800:sample_rate=44100')
      .inputFormat('lavfi')
      .duration(10)
      .outputOptions(['-c:v libx264', '-c:a aac', '-pix_fmt yuv420p'])
      .save(tempInput)
      .on('end', resolve)
      .on('error', reject);
  });

  const inputBuffer = await fs.promises.readFile(tempInput);
  console.log(`Input video created (${inputBuffer.length} bytes)\n`);

  const tests = [
    { format: 'webm', speed: 1.0 },
    { format: 'webm', speed: 2.0 },
    { format: 'mp4', speed: 1.0 },
    { format: 'avi', speed: 1.5 },
  ];

  for (const t of tests) {
    const start = Date.now();
    try {
      const res = await convertMediaBuffer(inputBuffer, 'mp4', t.format, { speed: t.speed });
      const elapsed = ((Date.now() - start) / 1000).toFixed(2);
      console.log(`✅ Conversion to .${t.format} (${t.speed}x speed) took ${elapsed}s, output size: ${res.buffer.length} bytes`);
    } catch (err) {
      console.error(`❌ Conversion to .${t.format} failed:`, err.message);
    }
  }

  await fs.promises.unlink(tempInput).catch(() => {});
}

runVerification().catch(console.error);
