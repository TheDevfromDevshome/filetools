import sharp from "sharp";
import path from "node:path";
import { writeFile, readFile } from "node:fs/promises";
import { getExtension } from "@filetools/shared";

interface ImageConvertOptions {
  quality?: number;
  width?: number;
  height?: number;
  maintainAspectRatio?: boolean;
}

const OUTPUT_FORMAT_MAP: Record<string, string> = {
  webp: "webp",
  jpg: "jpeg",
  jpeg: "jpeg",
  png: "png",
  tiff: "tiff",
  tif: "tiff",
  bmp: "bmp",
  gif: "gif",
};

// sharp has no native BMP encoder; write a 24-bit BMP from raw RGBA pixels.
async function writeBmp(raw: Buffer, width: number, height: number, outputPath: string): Promise<void> {
  const rowSize = Math.ceil((width * 3) / 4) * 4;
  const pixelBytes = rowSize * Math.abs(height);
  const fileSize = 54 + pixelBytes;
  const header = Buffer.alloc(54);

  header.write("BM", 0, "ascii");
  header.writeUInt32LE(fileSize, 2);
  header.writeUInt32LE(54, 10);
  header.writeUInt32LE(40, 14);
  header.writeInt32LE(width, 18);
  header.writeInt32LE(height, 22); // bottom-up
  header.writeUInt16LE(1, 26);
  header.writeUInt16LE(24, 28);
  header.writeUInt32LE(pixelBytes, 34);

  const data = Buffer.alloc(pixelBytes);
  for (let y = 0; y < Math.abs(height); y++) {
    const srcRow = raw.subarray(y * width * 4, (y + 1) * width * 4);
    const dstRowOffset = (Math.abs(height) - 1 - y) * rowSize;
    for (let x = 0; x < width; x++) {
      const si = x * 4;
      const r = srcRow[si];
      const g = srcRow[si + 1];
      const b = srcRow[si + 2];
      data[dstRowOffset + x * 3] = b;
      data[dstRowOffset + x * 3 + 1] = g;
      data[dstRowOffset + x * 3 + 2] = r;
    }
  }

  await writeFile(outputPath, Buffer.concat([header, data]));
}

export async function convertImage(
  inputPath: string,
  outputDir: string,
  outputFormat: string,
  options: ImageConvertOptions = {}
): Promise<string> {
  const format = OUTPUT_FORMAT_MAP[outputFormat] ?? outputFormat;
  const baseName = path.basename(inputPath, path.extname(inputPath));
  const outputPath = path.join(outputDir, `${baseName}.${outputFormat}`);

  let pipeline = sharp(inputPath);

  // Apply resize if specified
  if (options.width || options.height) {
    pipeline = pipeline.resize({
      width: options.width,
      height: options.height,
      fit: options.maintainAspectRatio === false ? "fill" : "inside",
      withoutEnlargement: true,
    });
  }

  // BMP has no native sharp encoder - use custom writer
  if (format === "bmp") {
    const { data, info } = await pipeline
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    await writeBmp(data, info.width, info.height, outputPath);
    return outputPath;
  }

  // Apply format-specific options
  const quality = options.quality ?? 80;

  switch (format) {
    case "webp":
      pipeline = pipeline.webp({ quality });
      break;
    case "jpeg":
      pipeline = pipeline.jpeg({
        quality,
        mozjpeg: true,
      });
      break;
    case "png":
      pipeline = pipeline.png({
        compressionLevel: 6,
        quality,
      });
      break;
    case "tiff":
      pipeline = pipeline.tiff({ compression: "lzw" });
      break;
    case "gif":
      pipeline = pipeline.gif();
      break;
    default:
      throw new Error(`Unsupported output format: ${outputFormat}`);
  }

  await pipeline.toFile(outputPath);
  return outputPath;
}

export function getOutputExtension(converterId: string): string {
  const map: Record<string, string> = {
    "jpg-to-webp": "webp",
    "png-to-webp": "webp",
    "webp-to-jpg": "jpg",
    "webp-to-png": "png",
    "png-to-jpg": "jpg",
    "jpg-to-png": "png",
    "png-to-tiff": "tiff",
    "jpg-to-tiff": "tiff",
    "webp-to-tiff": "tiff",
    "tiff-to-png": "png",
    "tiff-to-jpg": "jpg",
    "png-to-bmp": "bmp",
    "jpg-to-bmp": "bmp",
    "webp-to-bmp": "bmp",
    "bmp-to-png": "png",
    "gif-to-webp": "webp",
    "gif-to-png": "png",
    "gif-to-jpg": "jpg",
    "svg-to-png": "png",
    "svg-to-jpg": "jpg",
  };
  return map[converterId] ?? "webp";
}
