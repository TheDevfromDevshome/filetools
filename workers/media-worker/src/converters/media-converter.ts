import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";

const execFileAsync = promisify(execFile);

const FFMPEG_BIN = process.env.FFMPEG_BIN ?? "ffmpeg";

const AUDIO_CODECS: Record<string, string[]> = {
  mp3: ["-c:a", "libmp3lame", "-b:a", "192k"],
  wav: ["-c:a", "pcm_s16le"],
  flac: ["-c:a", "flac"],
  ogg: ["-c:a", "libvorbis"],
  m4a: ["-c:a", "aac", "-b:a", "192k"],
  aac: ["-c:a", "aac", "-b:a", "192k"],
  opus: ["-c:a", "libopus", "-b:a", "192k"],
};

const VIDEO_CODECS: Record<string, string[]> = {
  mp4: ["-c:v", "libx264", "-preset", "medium", "-crf", "23", "-pix_fmt", "yuv420p", "-c:a", "aac", "-movflags", "+faststart"],
  webm: ["-c:v", "libvpx-vp9", "-b:v", "0", "-crf", "30", "-c:a", "libopus"],
  mkv: ["-c:v", "libx264", "-preset", "medium", "-crf", "23", "-c:a", "aac"],
  mov: ["-c:v", "libx264", "-preset", "medium", "-crf", "23", "-pix_fmt", "yuv420p", "-c:a", "aac"],
  avi: ["-c:v", "libx264", "-preset", "medium", "-crf", "23", "-c:a", "aac"],
};

interface MediaConvertOptions {
  quality?: number;
  fps?: number;
  bitrate?: number;
}

export function getOutputExtension(converterId: string): string {
  const match = converterId.match(/to-(mp4|webm|mkv|mov|avi|gif|mp3|wav|flac|ogg|m4a|aac|opus)$/);
  return match?.[1] ?? "mp4";
}

export async function convertMedia(
  inputPath: string,
  outputDir: string,
  outputFormat: string,
  options: MediaConvertOptions = {}
): Promise<string> {
  const baseName = path.basename(inputPath, path.extname(inputPath));
  const outputPath = path.join(outputDir, `${baseName}.${outputFormat}`);
  const isAudio = outputFormat in AUDIO_CODECS;

  const args = ["-y", "-i", inputPath];

  if (isAudio) {
    // Strip video track, keep/extract audio (also works for video inputs)
    args.push("-vn");
    const codec = [...AUDIO_CODECS[outputFormat]];
    const bIdx = codec.indexOf("-b:a");
    if (bIdx >= 0 && options.bitrate) {
      codec[bIdx + 1] = `${options.bitrate}k`;
    }
    args.push(...codec, "-map_metadata", "-1", outputPath);
  } else if (outputFormat === "gif") {
    args.push(
      "-vf",
      `fps=${options.fps ?? 10},scale=iw:-2:flags=lanczos`,
      "-loop", "0",
      outputPath
    );
  } else {
    const codec = [...VIDEO_CODECS[outputFormat]];

    if (outputFormat === "mp4") {
      const vIdx = codec.indexOf("-crf");
      if (vIdx >= 0 && options.quality) {
        codec[vIdx + 1] = String(options.quality);
      }
    }

    args.push(...codec, outputPath);
  }

  await execFileAsync(FFMPEG_BIN, args, {
    timeout: 600_000,
    maxBuffer: 20 * 1024 * 1024,
  });

  return outputPath;
}