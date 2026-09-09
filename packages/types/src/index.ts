export type JobStatus = "queued" | "processing" | "completed" | "failed" | "expired";

export interface Job {
  id: string;
  status: JobStatus;
  converterId: string;
  options: Record<string, unknown>;
  inputFiles: JobFile[];
  outputFiles: JobFile[];
  error: string | null;
  createdAt: Date;
  startedAt: Date | null;
  completedAt: Date | null;
  expiresAt: Date;
}

export interface JobFile {
  id: string;
  jobId: string;
  originalName: string;
  storedName: string;
  mimeType: string;
  size: number;
  role: "input" | "output";
  createdAt: Date;
}

export interface ConverterDefinition {
  id: string;
  name: string;
  description: string;
  category: ConverterCategory;
  inputFormats: string[];
  outputFormats: string[];
  options?: ConverterOptionDefinition[];
}

export type ConverterCategory = "image" | "pdf" | "audio" | "video" | "archive" | "document";

export interface ConverterOptionDefinition {
  key: string;
  label: string;
  type: "number" | "boolean" | "select" | "text";
  min?: number;
  max?: number;
  default: unknown;
  options?: { label: string; value: unknown }[];
}

export interface ConvertOptions {
  quality?: number;
  width?: number;
  height?: number;
  maintainAspectRatio?: boolean;
}

export interface CreateJobRequest {
  converterId: string;
  fileIds: string[];
  options?: ConvertOptions;
}

export interface UploadResponse {
  fileId: string;
  originalName: string;
  size: number;
  mimeType: string;
}

export interface JobStatusResponse {
  jobId: string;
  status: JobStatus;
  progress?: number;
  error?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
