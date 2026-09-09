import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdir, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { execFileSync } from "node:child_process";

const execFileAsync = promisify(execFile);

const SEVENZ_BIN = process.env.SEVENZ_BIN ?? "7z";

export function getOutputExtension(converterId: string): string {
  const match = converterId.match(/to-(zip|7z|tar|tgz|tbz2)$/);
  return match?.[1] ?? "zip";
}

function targetFlags(format: string): string[] {
  switch (format) {
    case "zip":
      return ["-tzip"];
    case "7z":
      return ["-t7z"];
    case "tar":
      return ["-ttar"];
    case "tgz":
      return ["-ttar", "-tgzip"];
    case "tbz2":
      return ["-ttar", "-tbzip2"];
    default:
      return ["-tzip"];
  }
}

async function listEntries(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const names: string[] = [];
  for (const e of entries) {
    names.push(e.name);
    if (e.isDirectory()) {
      const sub = await listEntries(path.join(dir, e.name));
      names.push(...sub.map((s) => path.join(e.name, s)));
    }
  }
  return names;
}

export async function repackArchive(
  inputPath: string,
  outputDir: string,
  outputFormat: string,
  workDir: string
): Promise<string> {
  await mkdir(workDir, { recursive: true });
  await mkdir(outputDir, { recursive: true });

  // Extract input archive into workDir
  await execFileAsync(SEVENZ_BIN, ["x", "-y", `-o${workDir}`, inputPath], {
    timeout: 300_000,
    maxBuffer: 20 * 1024 * 1024,
  });

  const entries = await listEntries(workDir);
  if (entries.length === 0) {
    throw new Error("Archive contains no files");
  }

  const outputName =
    outputFormat === "tgz"
      ? "output.tar.gz"
      : outputFormat === "tbz2"
        ? "output.tar.bz2"
        : `output.${outputFormat}`;
  const outputPath = path.join(outputDir, outputName);

  const flags = targetFlags(outputFormat);

  await execFileAsync(SEVENZ_BIN, ["a", "-y", ...flags, outputPath, ".*", "*"], {
    cwd: workDir,
    timeout: 300_000,
    maxBuffer: 20 * 1024 * 1024,
  });

  await stat(outputPath);

  return outputPath;
}

// Verify the binary is available at startup
export function checkSevenZip(): boolean {
  try {
    execFileSync(SEVENZ_BIN, ["i"], { timeout: 10_000, stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
}