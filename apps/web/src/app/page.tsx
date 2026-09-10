"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { FileUpload } from "@/components/FileUpload";
import { FileList } from "@/components/FileList";
import { ToolCard } from "@/components/ToolCard";
import { ConvertOptions } from "@/components/ConvertOptions";
import { JobProgress } from "@/components/JobProgress";
import UpdateBanner from "@/components/UpdateBanner";
import {
  fetchConverters,
  uploadFiles,
  createJob,
  getJobStatus,
  getDownloadUrl,
  getJob,
  formatFileSize,
  type Converter,
  type JobStatus,
  type JobDetail,
} from "@/lib/api";
import { useT, useLang, type Lang } from "@/lib/i18n";

type Step = "select" | "upload" | "configure" | "processing" | "done";

export default function Home() {
  const t = useT();
  const { lang, setLang } = useLang();
  const [converters, setConverters] = useState<Converter[]>([]);
  const [selectedConverter, setSelectedConverter] = useState<Converter | null>(null);
  const [step, setStep] = useState<Step>("select");
  const [files, setFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [convertOptions, setConvertOptions] = useState<Record<string, unknown>>({});
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const [jobDetail, setJobDetail] = useState<JobDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    fetchConverters().then(setConverters).catch(console.error);
  }, []);

  const handleFilesSelected = useCallback((newFiles: File[]) => {
    setFiles((prev) => [...prev, ...newFiles]);
    if (step === "select") {
      setFilter("all");
    }
  }, [step]);

  const handleRemoveFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleStartConverter = useCallback((converter: Converter) => {
    setSelectedConverter(converter);
    setStep("upload");
  }, []);

  const handleConvert = useCallback(async () => {
    if (!selectedConverter || files.length === 0) return;

    try {
      setError(null);
      setStep("processing");
      setUploadProgress(0);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      const uploaded = await uploadFiles(files);

      clearInterval(progressInterval);
      setUploadProgress(100);

      const job = await createJob(selectedConverter.id, uploaded, convertOptions);

      setJobStatus({
        jobId: job.jobId,
        status: "queued",
        createdAt: job.createdAt,
      });

      // Poll for status
      const pollInterval = setInterval(async () => {
        try {
          const status = await getJobStatus(job.jobId);
          setJobStatus(status);

          if (status.status === "completed") {
            try {
              const detail = await getJob(job.jobId);
              setJobDetail(detail);
            } catch {
              // Details optional
            }
            clearInterval(pollInterval);
            setStep("done");
          }

          if (status.status === "failed") {
            clearInterval(pollInterval);
            setStep("done");
          }
        } catch {
          // Keep polling
        }
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setStep("select");
    }
  }, [selectedConverter, files, convertOptions]);

  const handleReset = useCallback(() => {
    setStep("select");
    setSelectedConverter(null);
    setFiles([]);
    setConvertOptions({});
    setJobStatus(null);
    setError(null);
    setUploadProgress(0);
  }, []);

  const categories = ["all", "image", "pdf", "audio", "video", "archive", "document"];

  const fileExts = useMemo(() => {
    const exts = new Set<string>();
    for (const f of files) {
      const name = f.name.toLowerCase();
      const dot = name.lastIndexOf(".");
      if (dot >= 0) exts.add(name.slice(dot + 1));
    }
    return exts;
  }, [files]);

  const filteredConverters = useMemo(() => {
    const byCategory =
      filter === "all" ? converters : converters.filter((c) => c.category === filter);
    if (fileExts.size === 0) return byCategory;
    return byCategory.filter((c) =>
      c.inputFormats.some((fmt) => fileExts.has(fmt.toLowerCase()))
    );
  }, [converters, filter, fileExts]);

  const showCompatibleHint = fileExts.size > 0;

  return (
    <div className="mx-auto min-h-screen max-w-5xl px-4 py-12">
      {/* Header */}
      <header className="mb-12 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
          {t.headerTitle1}<span className="text-brand-600">{t.headerTitle2}</span>
        </h1>
        <p className="mt-3 text-lg text-gray-500 dark:text-gray-400">
          {t.headerSubtitle}
        </p>
        <div className="mt-6">
          <UpdateBanner />
        </div>
        <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
          {t.headerPrivacy}
        </p>
        <div className="mt-4 flex items-center justify-center gap-2">
          <span className="text-xs text-gray-400 dark:text-gray-500">Language:</span>
          {(["en", "de"] as Lang[]).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                lang === l
                  ? "bg-brand-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
              }`}
            >
              {l === "en" ? "English" : "Deutsch"}
            </button>
          ))}
        </div>
      </header>

      {/* Step: Select Tool or Upload */}
      {step === "select" && (
        <>
          {/* Upload area */}
          <FileUpload
            onFilesSelected={handleFilesSelected}
            acceptedTypes={["image/*", "application/pdf", "audio/*", "video/*", "application/zip", "application/x-7z-compressed", "text/*"]}
          />

          {files.length > 0 && (
            <div className="mt-6">
              <FileList files={files} onRemove={handleRemoveFile} />
              <p className="mt-3 text-sm text-brand-600 dark:text-brand-400">
                {t.filesSelected(files.length)}. {t.chooseTool}
              </p>
            </div>
          )}

          {/* Category filter */}
          <div className="mt-8 flex flex-wrap justify-center gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  filter === cat
                    ? "bg-brand-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
                }`}
              >
                {t.category[cat]}
              </button>
            ))}
          </div>

          {/* Tool cards */}
          <div className="mt-8">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              {t.category[filter]}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredConverters.map((converter) => (
                <ToolCard
                  key={converter.id}
                  converter={converter}
                  onStart={handleStartConverter}
                />
              ))}
              {filteredConverters.length === 0 && (
                <div className="col-span-full py-12 text-center text-gray-500 dark:text-gray-400">
                  {t.noConverters}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Step: Upload files */}
      {step === "upload" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <button onClick={handleReset} className="text-sm text-brand-600 hover:text-brand-700">
                {t.back}
              </button>
              <h2 className="mt-2 text-xl font-semibold text-gray-900 dark:text-white">
                {selectedConverter?.name || (lang === "de" ? "Dateien auswählen" : "Select files")}
              </h2>
            </div>
          </div>

          <FileUpload
            onFilesSelected={handleFilesSelected}
            acceptedTypes={
              selectedConverter?.inputFormats.map((f) => `.${f}`) || undefined
            }
          />

          <FileList files={files} onRemove={handleRemoveFile} />

          {/* Options */}
          {selectedConverter?.options && selectedConverter.options.length > 0 && (
            <ConvertOptions
              converterId={selectedConverter.id}
              options={selectedConverter.options}
              onOptionsChange={setConvertOptions}
            />
          )}

          {error && (
            <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
              {error}
            </div>
          )}

          {files.length > 0 && (
            <button onClick={handleConvert} className="btn-primary w-full py-3 text-base">
              {t.convertButton(files.length)}
            </button>
          )}
        </div>
      )}

      {/* Step: Processing */}
      {step === "processing" && (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {selectedConverter?.name}
            </h2>
          </div>

          <div className="card">
            <JobProgress
              status={uploadProgress < 100 ? "uploading" : (jobStatus?.status as "queued" | "processing") || "queued"}
              progress={uploadProgress}
            />
          </div>
        </div>
      )}

      {/* Step: Done */}
      {step === "done" && jobStatus && (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {selectedConverter?.name}
            </h2>
          </div>

          <div className="card">
            <JobProgress
              status={jobStatus.status === "completed" ? "completed" : "failed"}
              error={jobStatus.error}
              jobId={jobStatus.jobId}
            />
          </div>

          {jobStatus.status === "completed" && jobDetail && (
            <div className="card space-y-4">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                {t.downloadResults}
              </h3>

              {(jobDetail.outputFiles?.length ?? 0) > 1 ? (
                <>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t.filesGenerated(jobDetail.outputFiles.length)}.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <a
                      href={getDownloadUrl(jobStatus.jobId, { mode: "zip" })}
                      className="btn-primary"
                    >
                      {t.downloadAllZip}
                    </a>
                    <a
                      href={getDownloadUrl(jobStatus.jobId, { mode: "single" })}
                      className="btn-secondary"
                    >
                      {t.downloadFirst}
                    </a>
                  </div>

                  <div className="max-h-64 space-y-1 overflow-y-auto rounded-lg border border-gray-200 p-2 dark:border-gray-700">
                    {jobDetail.outputFiles.map((f) => (
                      <div
                        key={f.id}
                        className="flex items-center justify-between gap-3 rounded-lg px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-gray-700 dark:text-gray-200">
                            {f.originalName}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {formatFileSize(f.size)}
                          </p>
                        </div>
                        <a
                          href={getDownloadUrl(jobStatus.jobId, { fileId: f.id })}
                          className="btn-secondary shrink-0"
                        >
                          {t.download}
                        </a>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <a
                  href={getDownloadUrl(jobStatus.jobId)}
                  className="btn-primary w-full"
                >
                  {t.download} {jobDetail.outputFiles?.[0]?.originalName ?? "file"}
                </a>
              )}
            </div>
          )}

          <button onClick={handleReset} className="btn-secondary w-full">
            {t.convertMore}
          </button>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-16 border-t border-gray-200 pt-8 text-center text-sm text-gray-400 dark:border-gray-800">
        <p>{t.footerText}</p>
        <p className="mt-1">{t.footerPrivacy}</p>
      </footer>
    </div>
  );
}
