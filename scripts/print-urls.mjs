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
const apipa = new Set();
for (const name of Object.keys(nets)) {
  for (const net of nets[name] ?? []) {
    if (net.family === "IPv4" && !net.internal) {
      // 169.254.x.x = APIPA: auto-assigned when no DHCP/DNS is available
      if (net.address.startsWith("169.254.")) {
        apipa.add(net.address);
      } else {
        ips.add(net.address);
      }
    }
  }
}

const line = (host, port, label) => {
  const base = port === "80" ? `http://${host}` : `http://${host}:${port}`;
  return `  ${label.padEnd(10)} ${base}`;
};

console.log("");
if (ips.size === 0) {
  console.log("FileTools is running, but I could not find a usable LAN IP on this");
  console.log("machine. Only localhost is reachable right now:");
} else {
  console.log("FileTools is reachable from this machine/network at:");
}
for (const ip of ips) {
  console.log(line(ip, webPort, `Web (${ip})`));
  console.log(line(ip, apiPort, `API (${ip})`));
}
console.log(line("localhost", webPort, "Web (local)"));
console.log(line("localhost", apiPort, "API (local)"));
if (apipa.size > 0) {
  console.log("");
  console.log("Found APIPA/self-assigned address(es) " + [...apipa].join(", ") + " —");
  console.log("this usually means the device got NO IP from DHCP (no router / offline).");
  console.log("Give the machine a proper network connection or a static IP to be");
  console.log("reachable from other devices.");
}
console.log("");
console.log("  mDNS      http://filetools.local:3000  (after first-run setup)");
console.log("");
console.log("start.sh tried to open ports 3000 + 3001 in the firewall automatically.");
console.log("If a remote device still cannot reach the URLs above, check the firewall using");
console.log("whatever tool your system provides (ufw, firewalld, iptables, Proxmox GUI).");
console.log("Linux examples:");
console.log("  sudo ufw allow 3000/tcp && sudo ufw allow 3001/tcp");
console.log("  sudo firewall-cmd --permanent --add-port=3000/tcp --add-port=3001/tcp && sudo firewall-cmd --reload");
console.log("");
console.log("Proxmox VE: if 'pve-firewall' is enabled it takes precedence — allow the ports in");
console.log("Datacenter > Firewall (or per-node) settings in the Proxmox web UI.");