import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import fs from 'fs';
import path from 'path';
import os from 'os';

ffmpeg.setFfmpegPath(ffmpegPath);

async function testOptimizations() {
  const tempInput = path.join(os.tmpdir(), 'test_input_10s.mp4');
  await new Promise((resolve, reject) => {
    ffmpeg()
      .input('testsrc=size=1024x576:rate=30')
      .inputFormat('lavfi')
      .input('sine=frequency=440:sample_rate=44100')
      .inputFormat('lavfi')
      .duration(10)
      .outputOptions(['-c:v libx264', '-c:a aac', '-pix_fmt yuv420p'])
      .save(tempInput)
      .on('end', resolve)
      .on('error', reject);
  });

  const outDefaultWebm = path.join(os.tmpdir(), 'out_def.webm');
  const outFastWebm = path.join(os.tmpdir(), 'out_fast.webm');
  const outVp8Webm = path.join(os.tmpdir(), 'out_vp8.webm');

  console.log('--- Testing VP9 Default ---');
  let t = Date.now();
  await new Promise((res, rej) => {
    ffmpeg(tempInput)
      .format('webm')
      .videoCodec('libvpx-vp9')
      .audioCodec('libopus')
      .save(outDefaultWebm)
      .on('end', res)
      .on('error', rej);
  });
  console.log(`VP9 default time: ${(Date.now() - t) / 1000}s`);

  console.log('--- Testing VP9 Realtime Fast (-deadline realtime -cpu-used 8) ---');
  t = Date.now();
  await new Promise((res, rej) => {
    ffmpeg(tempInput)
      .format('webm')
      .videoCodec('libvpx-vp9')
      .audioCodec('libopus')
      .outputOptions(['-deadline realtime', '-cpu-used 8'])
      .save(outFastWebm)
      .on('end', res)
      .on('error', rej);
  });
  console.log(`VP9 realtime fast time: ${(Date.now() - t) / 1000}s`);

  console.log('--- Testing VP8 Realtime (-c:v libvpx -deadline realtime -cpu-used 8) ---');
  t = Date.now();
  await new Promise((res, rej) => {
    ffmpeg(tempInput)
      .format('webm')
      .videoCodec('libvpx')
      .audioCodec('libopus')
      .outputOptions(['-deadline realtime', '-cpu-used 8'])
      .save(outVp8Webm)
      .on('end', res)
      .on('error', rej);
  });
  console.log(`VP8 realtime fast time: ${(Date.now() - t) / 1000}s`);

  // Cleanup
  await fs.promises.unlink(tempInput).catch(() => {});
  await fs.promises.unlink(outDefaultWebm).catch(() => {});
  await fs.promises.unlink(outFastWebm).catch(() => {});
  await fs.promises.unlink(outVp8Webm).catch(() => {});
}

testOptimizations().catch(console.error);
