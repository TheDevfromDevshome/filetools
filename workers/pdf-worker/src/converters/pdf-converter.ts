import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import { readdir } from "node:fs/promises";
import sharp from "sharp";
import { PDFDocument } from "pdf-lib";

const execFileAsync = promisify(execFile);

const PDFTOPPM_BIN = process.env.PDFTOPPM_BIN ?? "pdftoppm";
const IMG2PDF_BIN = process.env.IMG2PDF_BIN ?? "img2pdf";

interface PdfConvertOptions {
  quality?: number;
}

export async function pdfToImages(
  inputPath: string,
  outputDir: string,
  format: "jpg" | "png",
  options: PdfConvertOptions = {}
): Promise<string[]> {
  const dpi = options.quality ?? 150;
  const outputPattern = path.join(outputDir, `page-%03d.${format}`);

  await execFileAsync(PDFTOPPM_BIN, [
    "-r", String(dpi),
    "-"+ (format === "jpg" ? "jpeg" : "png"),
    inputPath,
    path.join(outputDir, "page"),
  ], {
    timeout: 120_000,
    maxBuffer: 50 * 1024 * 1024,
  });

  // pdftoppm outputs files like page-001.jpg, page-002.jpg
  const files = await readdir(outputDir);
  const outputFiles = files
    .filter((f) => f.startsWith("page-") && f.endsWith(`.${format}`))
    .sort()
    .map((f) => path.join(outputDir, f));

  return outputFiles;
}

// Convert any supported image format to a single PDF using sharp + pdf-lib.
// Faster and more format-agnostic than img2pdf (which only handles jpeg/png).
export async function imagesToPdf(
  inputPaths: string[],
  outputPath: string
): Promise<string> {
  const pdfDoc = await PDFDocument.create();

  for (const inputPath of inputPaths) {
    const pngBuffer = await sharp(inputPath)
      .rotate()
      .png()
      .toBuffer();

    const image = await pdfDoc.embedPng(pngBuffer);

    const page = pdfDoc.addPage([image.width, image.height]);
    page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
  }

  const bytes = await pdfDoc.save({ useObjectStreams: true });
  const { writeFile } = await import("node:fs/promises");
  await writeFile(outputPath, bytes);

  return outputPath;
}