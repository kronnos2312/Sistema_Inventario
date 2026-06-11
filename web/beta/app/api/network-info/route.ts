import { NextRequest, NextResponse } from 'next/server';
import os from 'os';

export async function GET(request: NextRequest) {
  const interfaces = os.networkInterfaces();

  const entries: { iface: string; ip: string }[] = [];

  for (const [name, iface] of Object.entries(interfaces)) {
    if (!iface) continue;
    for (const alias of iface) {
      if (alias.family === 'IPv4' && !alias.internal) {
        entries.push({ iface: name, ip: alias.address });
      }
    }
  }

  const host = request.headers.get('host') || 'localhost:3000';
  const port = host.includes(':') ? host.split(':')[1] : '3000';

  return NextResponse.json({
    entries,
    port,
    hostname: os.hostname(),
    platform: os.platform(),
    release: os.release(),
  });
}
