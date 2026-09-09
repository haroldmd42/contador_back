import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import fs from 'fs';
import path from 'path';
import os from 'os';

if (ffmpegPath) {
  ffmpeg.setFfmpegPath(ffmpegPath);
}

const MIME_TYPES = {
  mp4: 'video/mp4',
  webm: 'video/webm',
  avi: 'video/x-msvideo',
  mov: 'video/quicktime',
  mkv: 'video/x-matroska',
  ogv: 'video/ogg',
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  aac: 'audio/aac',
  m4a: 'audio/mp4',
  ogg: 'audio/ogg',
  flac: 'audio/flac',
};

export async function convertMediaBuffer(inputBuffer, originalExt, targetFormat, options = {}) {
  const normTarget = targetFormat.toLowerCase();
  const tempDir = os.tmpdir();
  const inputPath = path.join(tempDir, `input_${Date.now()}_${Math.random().toString(36).substring(7)}.${originalExt}`);
  const outputPath = path.join(tempDir, `output_${Date.now()}_${Math.random().toString(36).substring(7)}.${normTarget}`);

  await fs.promises.writeFile(inputPath, inputBuffer);

  return new Promise((resolve, reject) => {
    let command = ffmpeg(inputPath);

    // Apply format-specific options
    if (normTarget === 'mp4') {
      command = command.format('mp4').videoCodec('libx264').audioCodec('aac');
    } else if (normTarget === 'webm') {
      command = command.format('webm').videoCodec('libvpx-vp9').audioCodec('libopus');
    } else if (normTarget === 'mp3') {
      command = command.format('mp3').audioCodec('libmp3lame');
    } else if (normTarget === 'wav') {
      command = command.format('wav');
    } else if (normTarget === 'ogg' || normTarget === 'ogv') {
      command = command.format('ogg');
    } else {
      command = command.format(normTarget);
    }

    if (options.speed && parseFloat(options.speed) !== 1.0) {
      const speed = parseFloat(options.speed);
      // setpts filter for video speed
      const setpts = (1 / speed).toFixed(2);
      command = command.videoFilters(`setpts=${setpts}*PTS`);
    }

    command
      .on('end', async () => {
        try {
          const outputBuffer = await fs.promises.readFile(outputPath);
          // Cleanup temp files
          await fs.promises.unlink(inputPath).catch(() => {});
          await fs.promises.unlink(outputPath).catch(() => {});

          const mimeType = MIME_TYPES[normTarget] || `application/${normTarget}`;
          resolve({
            buffer: outputBuffer,
            mimeType,
            ext: normTarget,
          });
        } catch (err) {
          reject(err);
        }
      })
      .on('error', async (err) => {
        await fs.promises.unlink(inputPath).catch(() => {});
        await fs.promises.unlink(outputPath).catch(() => {});
        reject(new Error(`FFmpeg error: ${err.message}`));
      })
      .save(outputPath);
  });
}
