#!/usr/bin/env node
// FileTools — print the URLs this machine can reach the app at.
// Usage: node scripts/print-urls.mjs [--web-port 3000] [--api-port 3001]
import { createRequire } from "node:module";
import os from "node:os";

const require = createRequire(import.meta.url);
const args = process.argv.slice(2);
const getArg = (flag) => {
  const i = args.indexOf(flag);
  return i >= 0 && args[i + 1] ? args[i + 1] : undefined;
};
const webPort = getArg("--web-port") ?? process.env.WEB_PORT ?? "3000";
const apiPort = getArg("--api-port") ?? process.env.API_PORT ?? "3001";

const nets = os.networkInterfaces();
const ips = new Set();
for (const name of Object.keys(nets)) {
  for (const net of nets[name] ?? []) {
    if (net.family === "IPv4" && !net.internal) {
      ips.add(net.address);
    }
  }
}

const line = (host, port, label) => {
  const base = port === "80" ? `http://${host}` : `http://${host}:${port}`;
  return `  ${label.padEnd(10)} ${base}`;
};

console.log("");
console.log("FileTools is reachable from this machine/network at:");
for (const ip of ips) {
  console.log(line(ip, webPort, `Web (${ip})`));
  console.log(line(ip, apiPort, `API (${ip})`));
}
console.log(line("localhost", webPort, "Web (local)"));
console.log(line("localhost", apiPort, "API (local)"));
console.log("");
console.log("  mDNS      http://filetools.local:3000  (after first-run setup)");
console.log("");
console.log("If a remote device cannot open the URLs above, allow the ports in the");
console.log("firewall first, e.g. on Linux:");
console.log("  sudo ufw allow 3000/tcp && sudo ufw allow 3001/tcp");
console.log("");