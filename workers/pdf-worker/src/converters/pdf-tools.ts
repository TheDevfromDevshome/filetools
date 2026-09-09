import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import { mkdir, readdir, unlink, writeFile } from "node:fs/promises";
import { PDFDocument, StandardFonts, degrees, rgb } from "pdf-lib";

const execFileAsync = promisify(execFile);

// qpdf returns exit code 3 on warnings (operation succeeded, may have problems).
// Treat 0 and 3 as success.
function execFileTolerant(bin: string, args: string[], opts?: Parameters<typeof execFile>[2]): Promise<unknown> {
  return new Promise((resolve, reject) => {
    execFile(bin, args, opts, (error, stdout, stderr) => {
      if (!error) return resolve({ stdout, stderr });
      const code = (error as unknown as { code?: number }).code;
      if (code === 3) return resolve({ stdout, stderr });
      reject(error);
    });
  });
}

const QPDF_BIN = process.env.QPDF_BIN ?? "qpdf";
const PDFUNITE_BIN = process.env.PDFUNITE_BIN ?? "pdfunite";
const PDFTOTEXT_BIN = process.env.PDFTOTEXT_BIN ?? "pdftotext";

const maxBuffer = 50 * 1024 * 1024;

export async function mergePdf(inputPaths: string[], outputPath: string): Promise<string> {
  // Use pdfunite (poppler) for merging - fast and reliable
  await execFileAsync(PDFUNITE_BIN, [...inputPaths, outputPath], {
    timeout: 180_000,
    maxBuffer,
  });
  return outputPath;
}

export async function splitPdf(inputPath: string, outputDir: string): Promise<string[]> {
  // Use qpdf --split-pages to split into separate pages named based on input basename
  const base = path.basename(inputPath, path.extname(inputPath));
  await mkdir(outputDir, { recursive: true });
  const pattern = path.join(outputDir, `${base}-%d.pdf`);
  await execFileTolerant(QPDF_BIN, [inputPath, "--split-pages", pattern], {
    timeout: 180_000,
    maxBuffer,
  });
  const files = (await readdir(outputDir))
    .filter((f) => f.toLowerCase().endsWith(".pdf"))
    .sort((a, b) => {
      const na = parseInt(a.match(/(\d+)/)?.[0] ?? "0", 10);
      const nb = parseInt(b.match(/(\d+)/)?.[0] ?? "0", 10);
      return na - nb;
    })
    .map((f) => path.join(outputDir, f));
  return files;
}

export async function rotatePdf(inputPath: string, outputPath: string, angle: number): Promise<string> {
  await execFileTolerant(QPDF_BIN, [inputPath, `--rotate=+${angle}:1-z`, "--", outputPath], {
    timeout: 180_000,
    maxBuffer,
  });
  return outputPath;
}

export async function compressPdf(inputPath: string, outputPath: string): Promise<string> {
  // qpdf object streams + optimize images to reduce size
  await execFileTolerant(
    QPDF_BIN,
    [inputPath, "--object-streams=generate", "--compress-streams=y", "--recompress-flate", "--optimize-images", outputPath],
    { timeout: 300_000, maxBuffer }
  );
  return outputPath;
}

export async function protectPdf(inputPath: string, outputPath: string, password: string): Promise<string> {
  if (!password) throw new Error("A password is required to protect the PDF");
  await execFileTolerant(
    QPDF_BIN,
    ["--encrypt", password, password, "256", "--", inputPath, outputPath],
    { timeout: 180_000, maxBuffer }
  );
  return outputPath;
}

export async function unlockPdf(inputPath: string, outputPath: string, password?: string): Promise<string> {
  const args = ["--decrypt"];
  if (password) args.push(`--password=${password}`);
  args.push("--", inputPath, outputPath);
  await execFileTolerant(QPDF_BIN, args, { timeout: 180_000, maxBuffer });
  return outputPath;
}

export async function extractPagesPdf(inputPath: string, outputPath: string, range: string): Promise<string> {
  if (!range) range = "1";
  await execFileTolerant(QPDF_BIN, [inputPath, "--pages", inputPath, range, "--", outputPath], {
    timeout: 180_000,
    maxBuffer,
  });
  return outputPath;
}

export async function addWatermarkPdf(inputPath: string, outputPath: string, text: string): Promise<string> {
  if (!text) text = "WATERMARK";
  const srcBytes = (await import("node:fs/promises")).readFile(inputPath);
  const pdfDoc = await PDFDocument.load(await srcBytes);

  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const pages = pdfDoc.getPages();

  const fontSize = Math.max(24, Math.floor(pages[0]?.getWidth() ?? 400) / 12);

  for (const page of pages) {
    const { width, height } = page.getSize();
    page.drawText(text, {
      x: width / 4,
      y: height / 2,
      size: fontSize,
      font,
      color: rgb(0.6, 0.6, 0.6),
      opacity: 0.35,
      rotate: degrees(45),
    });
  }

  const bytes = await pdfDoc.save();
  await writeFile(outputPath, bytes);
  return outputPath;
}

export async function pdfToText(inputPath: string, outputPath: string): Promise<string> {
  await execFileAsync(PDFTOTEXT_BIN, ["-layout", inputPath, outputPath], {
    timeout: 180_000,
    maxBuffer,
  });
  return outputPath;
}

export async function readFirstPageCount(inputPath: string): Promise<number> {
  const pdfDoc = await PDFDocument.load(await (await import("node:fs/promises")).readFile(inputPath));
  return pdfDoc.getPageCount();
}