import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import fs from 'fs';
import path from 'path';
import os from 'os';

ffmpeg.setFfmpegPath(ffmpegPath);

async function testAvi() {
  const tempInput = path.join(os.tmpdir(), 'test_avi_in.mp4');
  await new Promise((resolve, reject) => {
    ffmpeg()
      .input('testsrc=size=320x240:rate=10')
      .inputFormat('lavfi')
      .input('sine=frequency=440')
      .inputFormat('lavfi')
      .duration(2)
      .save(tempInput)
      .on('end', resolve)
      .on('error', reject);
  });

  const outAvi1 = path.join(os.tmpdir(), 'test_out1.avi');
  const outAvi2 = path.join(os.tmpdir(), 'test_out2.avi');

  console.log('Testing AVI with libmp3lame...');
  try {
    await new Promise((res, rej) => {
      ffmpeg(tempInput)
        .format('avi')
        .videoCodec('libx264')
        .audioCodec('libmp3lame')
        .outputOptions(['-preset ultrafast'])
        .save(outAvi1)
        .on('end', res)
        .on('error', rej);
    });
    console.log('AVI libmp3lame success!');
  } catch (err) {
    console.error('AVI libmp3lame error:', err.message);
  }

  console.log('Testing AVI default audio...');
  try {
    await new Promise((res, rej) => {
      ffmpeg(tempInput)
        .format('avi')
        .videoCodec('libx264')
        .outputOptions(['-preset ultrafast'])
        .save(outAvi2)
        .on('end', res)
        .on('error', rej);
    });
    console.log('AVI default audio success!');
  } catch (err) {
    console.error('AVI default audio error:', err.message);
  }

  await fs.promises.unlink(tempInput).catch(() => {});
  await fs.promises.unlink(outAvi1).catch(() => {});
  await fs.promises.unlink(outAvi2).catch(() => {});
}

testAvi().catch(console.error);
