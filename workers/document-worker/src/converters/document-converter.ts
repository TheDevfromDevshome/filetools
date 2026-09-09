import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdir, readdir, stat } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import path from "node:path";

const execFileAsync = promisify(execFile);

const SOFFICE_BIN = process.env.SOFFICE_BIN ?? "soffice";

const HOME_DIR = process.env.LIBREOFFICE_HOME;

export function getOutputExtension(converterId: string): string {
  const match = converterId.match(/to-(pdf|docx|odt|rtf|xlsx|ods|csv|pptx|odp)$/);
  return match?.[1] ?? "pdf";
}

export async function convertDocument(
  inputPath: string,
  outputDir: string,
  outputFormat: string,
  converterId: string
): Promise<string> {
  await mkdir(outputDir, { recursive: true });

  const env: Record<string, string> = {};
  if (HOME_DIR) env["HOME"] = HOME_DIR;

  const args = ["--headless", "--norestore", "--convert-to", outputFormat, "--outdir", outputDir, inputPath];

  await execFileAsync(SOFFICE_BIN, args, {
    timeout: 300_000,
    maxBuffer: 20 * 1024 * 1024,
    env: { ...process.env, ...env },
  });

  // LibreOffice converts to <basename>.<ext>
  const files = await readdir(outputDir);
  const output = files.find((f) => f.toLowerCase().endsWith(`.${outputFormat}`));
  if (!output) {
    throw new Error(`LibreOffice did not produce a .${outputFormat} output file`);
  }

  const outputPath = path.join(outputDir, output);
  await stat(outputPath);
  return outputPath;
}

export function checkLibreOffice(): boolean {
  try {
    execFileSync(SOFFICE_BIN, ["--version"], { timeout: 15_000, stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
}