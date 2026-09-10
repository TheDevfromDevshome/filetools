import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { getSetting, setSetting } from "./settings.js";
import { config } from "@filetools/config";

const execFileAsync = promisify(execFile);

const OWNER = config.updater.owner;
const REPO = config.updater.repo;
const BRANCH = config.updater.branch;
const API_BASE = `https://api.github.com/repos/${OWNER}/${REPO}`;
const STORAGE_PATH = path.resolve(process.env.STORAGE_PATH ?? "./data");

export interface UpdateStatus {
  currentSha: string | null;
  latestSha: string | null;
  updateAvailable: boolean;
  message: string | null;
  publishedAt: string | null;
  url: string | null;
  state: "up-to-date" | "update-available" | "check-error" | "unknown";
  lastCheck: string | null;
  downloaded: boolean;
  downloadedSha: string | null;
  downloadDir: string | null;
}

export async function readUpdateStatus(): Promise<UpdateStatus> {
  return readStoredStatus();
}

async function currentShaFromGit(): Promise<string | null> {
  try {
    const { stdout } = await execFileAsync("git", ["rev-parse", "HEAD"], {
      timeout: 10_000,
    });
    const sha = stdout.trim().slice(0, 40);
    return sha || null;
  } catch {
    return null;
  }
}

function pnpmBin(): string {
  return process.platform === "win32" ? "pnpm.cmd" : "pnpm";
}

async function readStoredStatus(): Promise<UpdateStatus> {
  const [currentSha, latestSha, state, lastCheck, downloadedSha] = await Promise.all([
    getSetting("updater:currentSha"),
    getSetting("updater:latestSha"),
    getSetting("updater:state"),
    getSetting("updater:lastCheck"),
    getSetting("updater:downloadedSha"),
  ]);
  const message = await getSetting("updater:message");
  const publishedAt = await getSetting("updater:publishedAt");
  const url = await getSetting("updater:url");
  const downloadDir = await getSetting("updater:downloadDir");

  return {
    currentSha,
    latestSha,
    updateAvailable: state === "update-available" && latestSha !== undefined && latestSha !== currentSha,
    message,
    publishedAt,
    url,
    state: (state as UpdateStatus["state"]) ?? "unknown",
    lastCheck,
    downloaded: downloadedSha === latestSha && downloadedSha !== null && downloadedSha !== currentSha,
    downloadedSha,
    downloadDir: downloadedSha === latestSha ? downloadDir : null,
  };
}

export async function checkForUpdates(): Promise<UpdateStatus> {
  const stored = await readStoredStatus();
  const now = new Date().toISOString();

  let currentSha = stored.currentSha;
  if (!currentSha || currentSha === "unknown") {
    currentSha = await currentShaFromGit();
    if (currentSha) await setSetting("updater:currentSha", currentSha);
  }

  try {
    const res = await fetch(`${API_BASE}/commits/${BRANCH}`, {
      headers: {
        "User-Agent": "filetools-updater",
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });
    if (!res.ok) throw new Error(`GitHub API responded with ${res.status}`);
    const data = (await res.json()) as {
      sha: string;
      commit: { message: string; author: { date: string } };
      html_url: string;
    };

    const latestSha = data.sha;
    const message = data.commit.message.split("\n")[0] ?? "Update available";
    const publishedAt = data.commit.author.date;
    const url = data.html_url;

    await setSetting("updater:latestSha", latestSha);
    await setSetting("updater:message", message);
    await setSetting("updater:publishedAt", publishedAt);
    await setSetting("updater:url", url);
    await setSetting("updater:state", latestSha === currentSha ? "up-to-date" : "update-available");
    await setSetting("updater:lastCheck", now);
  } catch (err) {
    await setSetting("updater:state", "check-error");
    await setSetting("updater:lastCheck", now);
    return {
      ...stored,
      state: "check-error",
      lastCheck: now,
    };
  }

  return readStoredStatus();
}

export async function downloadUpdate(): Promise<UpdateStatus> {
  const status = await checkForUpdates();
  if (!status.updateAvailable || !status.latestSha) {
    return status;
  }

  const downloadDir = path.join(STORAGE_PATH, "updates", status.latestSha);
  await mkdir(downloadDir, { recursive: true });

  const tarballUrl = `https://codeload.github.com/${OWNER}/${REPO}/tar.gz/${status.latestSha}`;
  const archivePath = path.join(downloadDir, "update.tar.gz");

  try {
    const res = await fetch(tarballUrl, { headers: { "User-Agent": "filetools-updater" } });
    if (!res.ok) throw new Error(`Download failed: ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    const { writeFile } = await import("node:fs/promises");
    await writeFile(archivePath, buf);

    // Extract using system tar (bsdtar ships with Windows 10+, tar with Linux/macOS)
    await execFileAsync("tar", ["-xzf", archivePath, "-C", downloadDir, "--strip-components=1"], {
      timeout: 300_000,
    });

    const downloadedSha = status.latestSha;
    await setSetting("updater:downloadedSha", downloadedSha);
    await setSetting("updater:downloadDir", downloadDir);
  } catch {
    // Keep downloadDir but mark not-downloaded
    await setSetting("updater:downloadedSha", status.currentSha ?? "unknown");
  }

  return readStoredStatus();
}

export async function applyUpdate(): Promise<{ applied: boolean; message: string; gitUpdate: boolean }> {
  // If the project directory is a git clone with our origin, prefer a clean git pull.
  try {
    const { stdout } = await execFileAsync("git", ["rev-parse", "--abbrev-ref", "HEAD"], { timeout: 10_000 });
    const branch = stdout.trim();
    if (branch === BRANCH) {
      await execFileAsync("git", ["fetch", "origin", BRANCH], { timeout: 120_000 });
      await execFileAsync("git", ["reset", "--hard", `origin/${BRANCH}`], { timeout: 120_000 });
      await execFileAsync(pnpmBin(), ["install"], { timeout: 600_000 });
      await execFileAsync(pnpmBin(), ["build"], { timeout: 900_000 });
      await setSetting("updater:downloadedSha", "unknown");
      await setSetting("updater:state", "up-to-date");
      return {
        applied: true,
        message: `Updated ${BRANCH} via git and rebuilt. Restart the services to use the new version.`,
        gitUpdate: true,
      };
    }
  } catch {
    // not a git repo — fall through to staged-tarball instructions
  }

  const status = await readStoredStatus();
  if (!status.downloaded || !status.downloadDir) {
    await downloadUpdate();
  }
  const s2 = await readStoredStatus();
  return {
    applied: false,
    message: s2.downloadDir
      ? `Update downloaded and staged in ${s2.downloadDir}. Replace the project files with this content, then run pnpm install && pnpm build and restart.`
      : "No update was downloaded.",
    gitUpdate: false,
  };
}