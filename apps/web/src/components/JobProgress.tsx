"use client";

import { useT } from "@/lib/i18n";

interface JobProgressProps {
  status: "uploading" | "queued" | "processing" | "completed" | "failed";
  progress?: number;
  error?: string;
  downloadUrl?: string;
  jobId?: string;
}

export function JobProgress({ status, progress, error, downloadUrl, jobId }: JobProgressProps) {
  const t = useT();
  const statusConfig = {
    uploading: {
      label: t.uploading,
      color: "text-blue-600 dark:text-blue-400",
      barColor: "bg-blue-600",
    },
    queued: {
      label: t.queued,
      color: "text-yellow-600 dark:text-yellow-400",
      barColor: "bg-yellow-500",
    },
    processing: {
      label: t.processing,
      color: "text-brand-600 dark:text-brand-400",
      barColor: "bg-brand-600",
    },
    completed: {
      label: t.complete,
      color: "text-green-600 dark:text-green-400",
      barColor: "bg-green-600",
    },
    failed: {
      label: t.failed,
      color: "text-red-600 dark:text-red-400",
      barColor: "bg-red-600",
    },
  };

  const config = statusConfig[status];
  const pct = status === "completed" ? 100 : status === "failed" ? 0 : (progress ?? 0);

  return (
    <div className="animate-fade-in space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {status === "completed" ? (
            <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : status === "failed" ? (
            <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          ) : (
            <div className={`h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-${config.barColor.replace("bg-", "")}`} />
          )}
          <span className={`text-sm font-medium ${config.color}`}>{config.label}</span>
        </div>

        {status === "completed" && downloadUrl && (
          <a
            href={downloadUrl}
            download
            className="btn-primary"
          >
            <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Download
          </a>
        )}
      </div>

      {/* Progress bar */}
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
        <div
          className={`h-full rounded-full transition-all duration-500 ${config.barColor} ${
            status === "processing" || status === "uploading" ? "animate-pulse-slow" : ""
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
          {error}
        </div>
      )}
    </div>
  );
}
