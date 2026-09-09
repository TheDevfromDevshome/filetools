function env(key: string, fallback?: string): string {
  const value = process.env[key] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing environment variable: ${key}`);
  }
  return value;
}

function envInt(key: string, fallback: number): number {
  const raw = process.env[key];
  return raw ? parseInt(raw, 10) : fallback;
}

export const config = {
  database: {
    url: env("DATABASE_URL", "postgresql://filetools:filetools@localhost:5432/filetools"),
  },
  redis: {
    url: env("REDIS_URL", "redis://localhost:6379"),
  },
  storage: {
    path: env("STORAGE_PATH", "./data"),
  },
  maxFileSize: envInt("MAX_FILE_SIZE", 100 * 1024 * 1024),
  jobTtl: envInt("JOB_TTL", 3600),
  api: {
    port: envInt("API_PORT", 3001),
    corsOrigin: env("CORS_ORIGIN", "http://localhost:3000"),
  },
  web: {
    port: envInt("WEB_PORT", 3000),
  },
} as const;
