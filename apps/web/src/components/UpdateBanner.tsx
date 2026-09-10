"use client";

import { useState, useEffect, useCallback } from "react";
import { useT } from "@/lib/i18n";

interface UpdateStatus {
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

interface UpdateResponse {
  success: boolean;
  data?: UpdateStatus;
  message?: string;
  applied?: boolean;
}

async function getStatus(): Promise<UpdateStatus> {
  const res = await fetch("/api/v1/update/status");
  const json = (await res.json()) as UpdateResponse;
  return (
    json.data ?? {
      currentSha: null,
      latestSha: null,
      updateAvailable: false,
      message: null,
      publishedAt: null,
      url: null,
      state: "unknown",
      lastCheck: null,
      downloaded: false,
      downloadedSha: null,
      downloadDir: null,
    }
  );
}

async function post(path: string): Promise<UpdateResponse> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  });
  return (await res.json()) as UpdateResponse;
}

export default function UpdateBanner() {
  const t = useT();
  const [status, setStatus] = useState<UpdateStatus | null>(null);
  const [busy, setBusy] = useState<"downloading" | "applying" | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const refresh = useCallback(() => {
    getStatus().then(setStatus).catch(() => setStatus({ currentSha: null, latestSha: null, updateAvailable: false, message: null, publishedAt: null, url: null, state: "check-error", lastCheck: null, downloaded: false, downloadedSha: null, downloadDir: null }));
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [refresh]);

  if (!status) return null;

  const handleCheck = async () => {
    setBusy(null);
    setNotice(null);
    const res = await post("/api/v1/update/check");
    if (res.data) {
      setStatus(res.data);
      if (res.data.state === "check-error") setNotice(t.updateCheckError);
      else if (res.data.updateAvailable) setNotice(res.data.message ?? t.updateAvailable);
      else setNotice(t.updateUpToDate);
    } else {
      setNotice(t.updateCheckError);
    }
  };

  const handleApply = async () => {
    setBusy("downloading");
    setNotice(null);
    await post("/api/v1/update/download");
    setBusy("applying");
    const res = await post("/api/v1/update/apply");
    setBusy(null);
    if (res.success) {
      setNotice(`${t.updateApplied}. ${t.updateRestart}`);
      await refresh();
    } else {
      setNotice(res.message ?? t.updateCheckError);
    }
  };

  const configured = status.state !== "unknown" || status.lastCheck !== null;

  return (
    <div className="mb-6">
      {status.updateAvailable ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-brand-200 bg-brand-50 px-4 py-3 dark:border-brand-800 dark:bg-brand-900/20">
          <div className="min-w-0">
            <p className="text-sm font-medium text-brand-800 dark:text-brand-200">
              {t.updateAvailable}
            </p>
            {status.message && (
              <p className="truncate text-xs text-brand-700 dark:text-brand-300">
                {status.message}
              </p>
            )}
            {status.currentSha && status.latestSha && (
              <p className="text-xs text-brand-600 dark:text-brand-400">
                {status.currentSha.slice(0, 7)} → {status.latestSha.slice(0, 7)}
              </p>
            )}
          </div>
          <div className="flex shrink-0 gap-2">
            {status.downloaded ? (
              <button onClick={handleApply} disabled={busy !== null} className="btn-primary text-xs">
                {busy === "applying" ? t.updateApplying : t.updateApplied}
              </button>
            ) : (
              <>
                <button onClick={handleApply} disabled={busy !== null} className="btn-primary text-xs">
                  {busy === "downloading" ? t.updateDownloading : t.updateNow}
                </button>
                {status.url && (
                  <a href={status.url} target="_blank" rel="noreferrer" className="btn-secondary text-xs">
                    GitHub
                  </a>
                )}
              </>
            )}
          </div>
        </div>
      ) : status.state === "check-error" ? (
        <div className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-300">{t.updateCheckError}</p>
        </div>
      ) : !configured ? (
        <p className="text-center text-xs text-gray-400">{t.updateNotConfigured}</p>
      ) : (
        <p className="text-center text-xs text-gray-400">{t.updateUpToDate}</p>
      )}

      {notice && (
        <p className="mt-2 text-center text-xs text-gray-500 dark:text-gray-400">{notice}</p>
      )}
    </div>
  );
}