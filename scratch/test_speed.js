import { convertMediaBuffer } from '../src/services/media.service.js';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import fs from 'fs';
import path from 'path';
import os from 'os';

ffmpeg.setFfmpegPath(ffmpegPath);

async function testSpeedConversion() {
  console.log('Generating 5-second test video with audio...');
  const tempInput = path.join(os.tmpdir(), 'test_input_audio.mp4');
  
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

  console.log('\n--- Testing WEBM conversion with speed=2.0 ---');
  const t0 = Date.now();
  try {
    const resultWebm = await convertMediaBuffer(inputBuffer, 'mp4', 'webm', { speed: 2.0 });
    console.log(`WEBM 2.0x completed in ${(Date.now() - t0) / 1000}s, output size: ${resultWebm.buffer.length}`);
  } catch (err) {
    console.error('WEBM 2.0x failed:', err);
  }

  await fs.promises.unlink(tempInput).catch(() => {});
}

testSpeedConversion().catch(console.error);
