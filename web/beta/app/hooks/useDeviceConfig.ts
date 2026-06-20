'use client';

import { useEffect, useState, useCallback } from 'react';

export type DeviceCameraStatus = 'loading' | 'granted' | 'unknown';

async function buildFingerprint(ip: string): Promise<string> {
  const raw = [
    ip,
    navigator.userAgent,
    String(screen.width),
    String(screen.height),
    String(screen.colorDepth),
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    navigator.language,
    String(window.devicePixelRatio ?? 1),
  ].join('|');

  try {
    const data = new TextEncoder().encode(raw);
    const buffer = await crypto.subtle.digest('SHA-256', data);
    const arr = Array.from(new Uint8Array(buffer));
    return 'cam_' + arr.slice(0, 8).map(b => b.toString(16).padStart(2, '0')).join('');
  } catch {
    // Fallback si crypto.subtle no está disponible (contexto no seguro)
    let h = 5381;
    for (let i = 0; i < raw.length; i++) {
      h = (((h << 5) + h) + raw.charCodeAt(i)) & 0xFFFFFFFF;
    }
    return 'cam_' + Math.abs(h).toString(36);
  }
}

export function useDeviceConfig() {
  const [status, setStatus] = useState<DeviceCameraStatus>('loading');
  const [fingerprint, setFingerprint] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const ipRes = await fetch('/api/client-ip');
        if (!ipRes.ok) throw new Error('ip-fetch-failed');
        const { ip } = await ipRes.json() as { ip: string };

        const fp = await buildFingerprint(ip);
        if (cancelled) return;
        setFingerprint(fp);

        const configRes = await fetch(`/api-proxy/config/${fp}`);
        if (cancelled) return;

        if (configRes.ok) {
          const config = await configRes.json() as { key: string; value: string };
          if (config.value === 'granted') {
            setStatus('granted');
            return;
          }
        }
        // 404 o valor distinto → todavía sin confirmación del dispositivo
        setStatus('unknown');
      } catch {
        if (!cancelled) setStatus('unknown');
      }
    }

    init();
    return () => { cancelled = true; };
  }, []);

  const saveCameraPermission = useCallback(async () => {
    if (!fingerprint) return;
    try {
      await fetch('/api-proxy/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: fingerprint, value: 'granted' }),
      });
      setStatus('granted');
    } catch {
      // Fallo silencioso — el banner vuelve a mostrarse en la próxima sesión
    }
  }, [fingerprint]);

  return { status, saveCameraPermission };
}
