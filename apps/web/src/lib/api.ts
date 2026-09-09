const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001").trim();

export interface Converter {
  id: string;
  name: string;
  description: string;
  category: string;
  inputFormats: string[];
  outputFormats: string[];
  options?: Array<{
    key: string;
    label: string;
    type: string;
    min?: number;
    max?: number;
    default: unknown;
    options?: { label: string; value: unknown }[];
  }>;
}

export interface UploadResponse {
  fileId: string;
  originalName: string;
  storedName: string;
  size: number;
  mimeType: string;
}

export interface JobResponse {
  jobId: string;
  status: string;
  converterId: string;
  createdAt: string;
  expiresAt: string;
}

export interface JobStatus {
  jobId: string;
  status: "queued" | "processing" | "completed" | "failed" | "expired";
  error?: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}

export interface JobDetail extends JobResponse {
  inputFiles: Array<{
    id: string;
    originalName: string;
    mimeType: string;
    size: number;
  }>;
  outputFiles: Array<{
    id: string;
    originalName: string;
    mimeType: string;
    size: number;
  }>;
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "API request failed");
  }

  return data;
}

export async function fetchConverters(): Promise<Converter[]> {
  const res = await apiFetch<{ success: boolean; data: Converter[] }>("/api/v1/converters");
  return res.data;
}

export async function uploadFiles(files: File[]): Promise<UploadResponse[]> {
  const formData = new FormData();
  for (const file of files) {
    formData.append("file", file);
  }

  const res = await fetch(`${API_URL}/api/v1/upload`, {
    method: "POST",
    body: formData,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Upload failed");
  return data.data;
}

export async function createJob(
  converterId: string,
  uploadedFiles: UploadResponse[],
  options?: Record<string, unknown>
): Promise<JobResponse> {
  const files = uploadedFiles.map((f) => ({
    fileId: f.fileId,
    originalName: f.originalName,
    storedName: f.storedName,
    mimeType: f.mimeType,
    size: f.size,
  }));

  const res = await apiFetch<{ success: boolean; data: JobResponse }>("/api/v1/jobs", {
    method: "POST",
    body: JSON.stringify({ converterId, files, options }),
  });
  return res.data;
}

export async function getJobStatus(jobId: string): Promise<JobStatus> {
  const res = await apiFetch<{ success: boolean; data: JobStatus }>(
    `/api/v1/jobs/${jobId}/status`
  );
  return res.data;
}

export async function getJob(jobId: string): Promise<JobDetail> {
  const res = await apiFetch<{ success: boolean; data: JobDetail }>(`/api/v1/jobs/${jobId}`);
  return res.data;
}

export function getDownloadUrl(
  jobId: string,
  opts?: { mode?: "zip" | "single"; fileId?: string }
): string {
  const params = new URLSearchParams();
  if (opts?.mode) params.set("mode", opts.mode);
  if (opts?.fileId) params.set("fileId", opts.fileId);
  const qs = params.toString();
  return `${API_URL}/api/v1/jobs/${jobId}/download${qs ? `?${qs}` : ""}`;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}
