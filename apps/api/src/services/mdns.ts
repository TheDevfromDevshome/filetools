import { Bonjour } from "bonjour-service";
import { getSetting } from "./settings.js";
import { networkInterfaces } from "node:os";
import { execFile } from "node:child_process";

let bonjour: Bonjour | null = null;
let service: ReturnType<Bonjour["publish"]> | null = null;
let avahiProc: ReturnType<typeof execFile> | null = null;

function firstIPv4(): string | null {
  for (const nets of Object.values(networkInterfaces())) {
    for (const net of nets ?? []) {
      if (net.family === "IPv4" && !net.internal) return net.address;
    }
  }
  return null;
}

export async function startMdns(): Promise<void> {
  const domainName = await getSetting("domainName");
  const webPort = parseInt(process.env.WEB_PORT ?? "3000", 10);
  if (!domainName) return;
  const serviceName = domainName.replace(/\.local$/i, "").split(":")[0];
  stopMdns();
  try {
    bonjour = new Bonjour();
    service = bonjour.publish({
      name: serviceName,
      type: "http",
      port: webPort,
      protocol: "tcp",
      host: serviceName,
    });
  } catch {
    /* mDNS not available on this platform — no-op */
  }

  // Also publish via Avahi (more reliable on Linux, resolves .local on the LAN)
  if (!avahiProc) {
    const ip = firstIPv4();
    if (ip) {
      try {
        avahiProc = execFile(
          "avahi-publish-address",
          [domainName, ip],
          { timeout: 0 },
          () => { avahiProc = null; },
        );
      } catch {
        /* avahi-publish not installed — bonjour-service is our only option */
      }
    }
  }
}

export function stopMdns(): void {
  try {
    service?.stop();
    bonjour?.destroy();
  } catch {
    /* ignore */
  }
  service = null;
  bonjour = null;
  if (avahiProc) {
    avahiProc.kill("SIGTERM");
    avahiProc = null;
  }
}
