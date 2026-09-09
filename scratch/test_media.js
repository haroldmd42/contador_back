import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import fs from 'fs';
import path from 'path';
import os from 'os';

ffmpeg.setFfmpegPath(ffmpegPath);

async function testAudioVideo() {
  console.log('--- Creating tiny WAV audio file with FFmpeg ---');
  const tempWav = path.join(os.tmpdir(), 'test_audio.wav');
  
  await new Promise((resolve, reject) => {
    ffmpeg()
      .input('anullsrc=r=44100:cl=mono')
      .inputFormat('lavfi')
      .duration(1) // 1 second
      .save(tempWav)
      .on('end', resolve)
      .on('error', reject);
  });

  const wavBuffer = await fs.promises.readFile(tempWav);
  console.log('Generated test WAV audio buffer, size:', wavBuffer.length);

  console.log('\n--- Testing 7. Audio Convert (WAV to MP3) ---');
  const formDataAudio = new FormData();
  formDataAudio.append('file', new Blob([wavBuffer], { type: 'audio/wav' }), 'test.wav');
  formDataAudio.append('targetFormat', 'mp3');

  const audioRes = await fetch('http://localhost:3000/api/tools/audio-convert', {
    method: 'POST',
    body: formDataAudio
  });
  console.log('Audio Convert status:', audioRes.status, 'Content-Type:', audioRes.headers.get('content-type'));

  console.log('\n--- Creating tiny test video file with FFmpeg ---');
  const tempVideo = path.join(os.tmpdir(), 'test_video.webm');
  await new Promise((resolve, reject) => {
    ffmpeg()
      .input('testsrc=size=320x240:rate=10')
      .inputFormat('lavfi')
      .duration(1) // 1 second
      .save(tempVideo)
      .on('end', resolve)
      .on('error', reject);
  });

  const videoBuffer = await fs.promises.readFile(tempVideo);
  console.log('Generated test WebM video buffer, size:', videoBuffer.length);

  console.log('\n--- Testing 6. Video Convert (WebM to MP4) ---');
  const formDataVideo = new FormData();
  formDataVideo.append('file', new Blob([videoBuffer], { type: 'video/webm' }), 'test.webm');
  formDataVideo.append('targetFormat', 'mp4');

  const videoRes = await fetch('http://localhost:3000/api/tools/video-convert', {
    method: 'POST',
    body: formDataVideo
  });
  console.log('Video Convert status:', videoRes.status, 'Content-Type:', videoRes.headers.get('content-type'));

  await fs.promises.unlink(tempWav).catch(() => {});
  await fs.promises.unlink(tempVideo).catch(() => {});
}

testAudioVideo().catch(console.error);
