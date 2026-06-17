import { NextRequest, NextResponse } from 'next/server';
import os from 'os';

interface NetworkEntry {
  iface: string;
  ip: string;
}

// IPs en el rango de bridge de Docker (172.16.0.0/12) — no son LAN reales
function isDockerIp(ip: string): boolean {
  const parts = ip.split('.').map(Number);
  return parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31;
}

export async function GET(request: NextRequest) {
  const host = request.headers.get('host') || 'localhost:3000';
  const port = host.includes(':') ? host.split(':')[1] : '3000';

  // Puertos: runtime env primero, luego build-time, luego default
  const frontendPort = process.env.HOST_PORT
    || process.env.NEXT_PUBLIC_FRONTEND_PORT
    || port;
  const backendPort = process.env.HOST_PORT_BACKEND
    || process.env.NEXT_PUBLIC_BACKEND_PORT
    || '8080';

  // IP del host: runtime env primero, luego build-time (horneada en imagen)
  const hostIpEnv = process.env.HOST_IP || process.env.NEXT_PUBLIC_HOST_IP;
  if (hostIpEnv) {
    const entries: NetworkEntry[] = hostIpEnv
      .split(',')
      .map(ip => ip.trim())
      .filter(Boolean)
      .map(ip => ({ iface: 'host', ip }));

    return NextResponse.json({
      entries,
      port: frontendPort,
      backendPort,
      hostname: os.hostname(),
      platform: os.platform(),
      release: os.release(),
      source: 'env' as const,
    });
  }

  // Detección automática — filtrar IPs internas de Docker
  const interfaces = os.networkInterfaces();
  const all: NetworkEntry[] = [];
  const real: NetworkEntry[] = [];

  for (const [name, iface] of Object.entries(interfaces)) {
    if (!iface) continue;
    for (const alias of iface) {
      if (alias.family !== 'IPv4' || alias.internal) continue;
      const entry = { iface: name, ip: alias.address };
      all.push(entry);
      if (!isDockerIp(alias.address)) real.push(entry);
    }
  }

  const entries = real.length > 0 ? real : all;
  const source = real.length > 0 ? 'auto' : 'docker';

  return NextResponse.json({
    entries,
    port: frontendPort,
    backendPort,
    hostname: os.hostname(),
    platform: os.platform(),
    release: os.release(),
    source,
  });
}
