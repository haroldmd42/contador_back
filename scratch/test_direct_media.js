import { convertMediaBuffer } from '../src/services/media.service.js';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import fs from 'fs';
import path from 'path';
import os from 'os';

ffmpeg.setFfmpegPath(ffmpegPath);

async function testDirectConversion() {
  console.log('Generating 5-second test video...');
  const tempInput = path.join(os.tmpdir(), 'test_input_5s.mp4');
  
  await new Promise((resolve, reject) => {
    ffmpeg()
      .input('testsrc=size=640x360:rate=30')
      .inputFormat('lavfi')
      .input('sine=frequency=1000:sample_rate=44100')
      .inputFormat('lavfi')
      .duration(5)
      .outputOptions(['-c:v libx264', '-c:a aac', '-pix_fmt yuv420p'])
      .save(tempInput)
      .on('end', resolve)
      .on('error', reject);
  });

  const inputBuffer = await fs.promises.readFile(tempInput);
  console.log('Test video size:', inputBuffer.length, 'bytes');

  console.log('\n--- Testing WEBM conversion with current settings ---');
  const t0 = Date.now();
  try {
    const resultWebm = await convertMediaBuffer(inputBuffer, 'mp4', 'webm', { speed: 1.0 });
    console.log(`WEBM completed in ${(Date.now() - t0) / 1000}s, output size: ${resultWebm.buffer.length}`);
  } catch (err) {
    console.error('WEBM failed:', err);
  }

  console.log('\n--- Testing MP4 conversion with current settings ---');
  const t1 = Date.now();
  try {
    const resultMp4 = await convertMediaBuffer(inputBuffer, 'mp4', 'mp4', { speed: 1.0 });
    console.log(`MP4 completed in ${(Date.now() - t1) / 1000}s, output size: ${resultMp4.buffer.length}`);
  } catch (err) {
    console.error('MP4 failed:', err);
  }

  await fs.promises.unlink(tempInput).catch(() => {});
}

testDirectConversion().catch(console.error);
