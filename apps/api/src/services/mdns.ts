import { Bonjour } from "bonjour-service";
import { getSetting } from "./settings.js";

let bonjour: Bonjour | null = null;
let service: ReturnType<Bonjour["publish"]> | null = null;

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
    });
  } catch {
    /* mDNS not available on this platform — no-op */
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
}
