export function getApiUrl(): string {
  const fromEnv = (process.env.NEXT_PUBLIC_API_URL || "").trim();
  if (fromEnv) return fromEnv;
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    return `http://${host}:3001`;
  }
  return "http://localhost:3001";
}