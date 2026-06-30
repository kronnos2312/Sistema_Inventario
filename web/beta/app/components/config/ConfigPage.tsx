'use client';

import { useEffect, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import Modal from '../base/context/Modal';
import { useDeviceConfig } from '@/app/hooks/useDeviceConfig';
import { useInventoryStore } from '@/app/store/useInventoryStore';
import { useProductGroupStore } from '@/app/store/useProductGroupStore';

const EXPORT_URL_KEY = 'inventory_export_url';

interface NetworkEntry {
  iface: string;
  ip: string;
}

interface NetworkInfo {
  entries: NetworkEntry[];
  backendPort: string;
  hostname: string;
  platform: string;
  osVersion: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

async function detectLocalIpWebRTC(): Promise<string | null> {
  if (typeof window === 'undefined' || !('RTCPeerConnection' in window)) return null;
  return new Promise(resolve => {
    try {
      const pc = new RTCPeerConnection({ iceServers: [] });
      const found = new Set<string>();
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        try { pc.close(); } catch { /* noop */ }
        const ips = [...found]
          .filter(ip =>
            /^\d{1,3}(\.\d{1,3}){3}$/.test(ip) &&
            ip !== '127.0.0.1' &&
            !ip.startsWith('169.254')
          )
          .sort((a, b) =>
            (a.startsWith('192.168') ? 0 : a.startsWith('10.') ? 1 : 2) -
            (b.startsWith('192.168') ? 0 : b.startsWith('10.') ? 1 : 2)
          );
        resolve(ips[0] ?? null);
      };
      pc.onicecandidate = e => {
        if (!e.candidate) { finish(); return; }
        const m = /(\d{1,3}(?:\.\d{1,3}){3})/.exec(e.candidate.candidate);
        if (m) found.add(m[1]);
      };
      pc.createDataChannel('');
      pc.createOffer().then(o => pc.setLocalDescription(o)).catch(finish);
      setTimeout(finish, 2000);
    } catch {
      resolve(null);
    }
  });
}

type CamNative = 'idle' | 'prompt' | 'granted' | 'denied' | 'unavailable';

type TabId = 'network' | 'webhook' | 'logo' | 'camera' | 'export';

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  {
    id: 'network',
    label: 'Red local',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
      </svg>
    ),
  },
  {
    id: 'webhook',
    label: 'Webhook stock',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
    ),
  },
  {
    id: 'logo',
    label: 'Logo',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    id: 'camera',
    label: 'Cámara',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    id: 'export',
    label: 'Exportar',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
      </svg>
    ),
  },
];

export default function ConfigPage() {
  const [activeTab, setActiveTab] = useState<TabId>('network');

  const [networkInfo, setNetworkInfo] = useState<NetworkInfo | null>(null);
  const [wifiIp, setWifiIp] = useState<string | null>(null);
  const [frontendPort, setFrontendPort] = useState('3000');
  const [loading, setLoading] = useState(true);
  const [qrUrl, setQrUrl] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [copiedIp, setCopiedIp] = useState<string | null>(null);

  // ── Cámara ───────────────────────────────────────────────────────────────
  const { status: deviceCamStatus, saveCameraPermission } = useDeviceConfig();
  const [camNative, setCamNative] = useState<CamNative>('idle');
  const [camRequesting, setCamRequesting] = useState(false);

  const isInsecureHttp =
    typeof window !== 'undefined' &&
    window.location.protocol === 'http:' &&
    window.location.hostname !== 'localhost' &&
    window.location.hostname !== '127.0.0.1';

  const siteOrigin =
    typeof window !== 'undefined' ? window.location.origin : '';

  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setCamNative('unavailable');
      return;
    }
    if ('permissions' in navigator) {
      navigator.permissions
        .query({ name: 'camera' as PermissionName })
        .then(r => {
          setCamNative(r.state as CamNative);
          r.addEventListener('change', () => setCamNative(r.state as CamNative));
        })
        .catch(() => setCamNative('prompt'));
    } else {
      setCamNative('prompt');
    }
  }, []);

  const requestCamPermission = async () => {
    setCamRequesting(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
      });
      stream.getTracks().forEach(t => t.stop());
      setCamNative('granted');
      await saveCameraPermission();
    } catch (err) {
      if (err instanceof Error && err.name === 'NotAllowedError') setCamNative('denied');
    } finally {
      setCamRequesting(false);
    }
  };

  const camGranted = deviceCamStatus === 'granted' || camNative === 'granted';

  // ── Exportar inventario ───────────────────────────────────────────────────
  const fetchInventory = useInventoryStore(s => s.fetchInventory);
  const [exportUrl, setExportUrl] = useState('');
  const [exportSaved, setExportSaved] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(EXPORT_URL_KEY);
    if (saved) setExportUrl(saved);
  }, []);

  const saveExportUrl = () => {
    localStorage.setItem(EXPORT_URL_KEY, exportUrl);
    setExportSaved(true);
    setTimeout(() => setExportSaved(false), 1500);
  };

  const sendInventory = async () => {
    const url = exportUrl.trim();
    if (!url) return;
    setExporting(true);
    setExportStatus(null);
    try {
      await fetchInventory();
      const inStock = useInventoryStore.getState().inventory.filter(item => !item.outDate);
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inStock),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setExportStatus({ type: 'ok', text: `${inStock.length} artículo${inStock.length !== 1 ? 's' : ''} enviado${inStock.length !== 1 ? 's' : ''} correctamente.` });
    } catch (err) {
      setExportStatus({ type: 'error', text: `Error al enviar: ${err instanceof Error ? err.message : err}` });
    } finally {
      setExporting(false);
    }
  };

  // ── Webhook stock ─────────────────────────────────────────────────────────
  const { groups, fetchGroups } = useProductGroupStore();
  const [webhookGroupId, setWebhookGroupId] = useState<number | null>(null);
  const [webhookCopied, setWebhookCopied] = useState<string | null>(null);
  const [webhookTestStatus, setWebhookTestStatus] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);
  const [webhookTesting, setWebhookTesting] = useState(false);

  useEffect(() => {
    if (activeTab === 'webhook') fetchGroups();
  }, [activeTab, fetchGroups]);

  const buildWebhookUrl = (ip: string, backendPort: string) =>
    webhookGroupId !== null
      ? `http://${ip}:${backendPort}/inventory/stock/group/${webhookGroupId}`
      : `http://${ip}:${backendPort}/inventory/stock`;

  const copyWebhook = (url: string) => {
    navigator.clipboard.writeText(url);
    setWebhookCopied(url);
    setTimeout(() => setWebhookCopied(null), 1500);
  };

  const testWebhook = async (url: string) => {
    setWebhookTesting(true);
    setWebhookTestStatus(null);
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const count = Array.isArray(data) ? data.length : '?';
      setWebhookTestStatus({ type: 'ok', text: `Respuesta OK — ${count} producto${count !== 1 ? 's' : ''} en stock.` });
    } catch (err) {
      setWebhookTestStatus({ type: 'error', text: `Error: ${err instanceof Error ? err.message : err}` });
    } finally {
      setWebhookTesting(false);
    }
  };

  // ── Logo del sistema ──────────────────────────────────────────────────────
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoName, setLogoName] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api-proxy/files/config/logo')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.url) {
          setLogoUrl(`/api-proxy${data.url}`);
          setLogoName(data.originalName ?? null);
        }
      })
      .catch(() => null);
  }, []);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadMsg(null);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api-proxy/files/config/logo', { method: 'POST', body: form });
      if (!res.ok) throw new Error();
      const data = await res.json();
      const newUrl = `/api-proxy${data.url}`;
      setLogoUrl(newUrl);
      setLogoName(data.originalName ?? file.name);
      setUploadMsg({ type: 'ok', text: 'Logo actualizado correctamente.' });
    } catch {
      setUploadMsg({ type: 'error', text: 'Error al subir el logo. Intenta de nuevo.' });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  useEffect(() => {
    setFrontendPort(window.location.port || '3000');

    const clientHostname = window.location.hostname;
    const clientIsIp =
      /^\d{1,3}(\.\d{1,3}){3}$/.test(clientHostname) && clientHostname !== '127.0.0.1';
    if (clientIsIp) setWifiIp(clientHostname);

    const fetchInfo = fetch(`${API_BASE_URL}/network-info`)
      .then(r => r.json() as Promise<NetworkInfo>)
      .then(data => { setNetworkInfo(data); return data; })
      .catch((): null => null);

    // WebRTC ICE gathering: el navegador descubre sus IPs de red local
    // incluso cuando la app se abre por localhost en Docker.
    const detectWebRTC = clientIsIp
      ? Promise.resolve<string | null>(null)
      : detectLocalIpWebRTC();

    Promise.all([fetchInfo, detectWebRTC]).then(([data, webrtcIp]) => {
      if (!clientIsIp) {
        if (webrtcIp) {
          setWifiIp(webrtcIp);
        } else if (data && data.entries.length > 0) {
          setWifiIp(data.entries[0].ip);
        }
      }
      setLoading(false);
    });
  }, []);

  const openQr = (url: string) => {
    setQrUrl(url);
    setModalOpen(true);
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedIp(url);
    setTimeout(() => setCopiedIp(null), 1500);
  };

  // ── Badge por tab ─────────────────────────────────────────────────────────
  const tabBadge = (id: TabId): React.ReactNode => {
    if (id === 'camera') {
      if (camGranted) return <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />;
      if (camNative === 'denied') return <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />;
    }
    return null;
  };

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-slate-800">Configuración</h2>
        <p className="text-sm text-slate-500">Gestiona acceso en red, integraciones y ajustes del sistema</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-start">

        {/* Sidebar de tabs */}
        <nav className="w-full md:w-48 shrink-0 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition text-left border-b border-slate-100 last:border-b-0 ${
                activeTab === tab.id
                  ? 'bg-indigo-50 text-indigo-700 border-l-2 border-l-indigo-500'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <span className={activeTab === tab.id ? 'text-indigo-600' : 'text-slate-400'}>
                {tab.icon}
              </span>
              <span className="flex-1">{tab.label}</span>
              {tabBadge(tab.id)}
            </button>
          ))}
        </nav>

        {/* Contenido de la tab activa */}
        <div className="flex-1 min-w-0">

          {/* ── Tab: Red local ─────────────────────────────────────────── */}
          {activeTab === 'network' && (
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 space-y-4">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
                </svg>
                <h3 className="font-medium text-slate-700">Acceso en red local</h3>
              </div>

              {loading && <p className="text-sm text-slate-400">Cargando información del servidor...</p>}

              {!loading && networkInfo && (
                <>
                  <div className="bg-slate-50 border border-slate-100 rounded-lg px-4 py-3 space-y-1.5 text-xs text-slate-500">
                    <p className="font-medium text-slate-600 text-[11px] uppercase tracking-wide mb-2">Origen del servidor</p>
                    <div className="flex items-center gap-2">
                      <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                      <span className="font-mono">{networkInfo.hostname}</span>
                      <span className="text-slate-300">·</span>
                      <span>Hostname</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
                      </svg>
                      <span className="font-mono">{networkInfo.platform}</span>
                      <span className="text-slate-300">·</span>
                      <span className="font-mono truncate max-w-[100px]" title={networkInfo.osVersion}>{networkInfo.osVersion}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3" />
                      </svg>
                      <span>Puerto</span>
                      <span className="font-mono text-indigo-600">{frontendPort}</span>
                    </div>
                  </div>

                  {!wifiIp ? (
                    <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                      <svg className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
                      </svg>
                      <div>
                        <p className="text-sm font-semibold text-amber-800">Acceso por WiFi no disponible</p>
                        <p className="text-xs text-amber-700 mt-0.5">
                          Estás usando <code className="font-mono bg-amber-100 px-1 rounded">localhost</code>. Para compartir acceso y ver los QR, abre la aplicación desde la IP WiFi del equipo, por ejemplo:{' '}
                          <code className="font-mono bg-amber-100 px-1 rounded">http://192.168.x.x:{frontendPort}</code>
                        </p>
                      </div>
                    </div>
                  ) : (
                    <ul className="space-y-3">
                      {(() => {
                        const frontUrl = `http://${wifiIp}:${frontendPort}`;
                        const backUrl  = `http://${wifiIp}:${networkInfo.backendPort}`;
                        return (
                          <li className="bg-slate-50 border border-slate-100 rounded-lg px-4 py-3 space-y-2">
                            <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wide">
                              {networkInfo?.entries.find(e => e.ip === wifiIp)?.iface ?? 'Red'} · {wifiIp}
                            </p>

                            <div className="flex items-center justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <span className="text-[10px] text-indigo-400 font-semibold uppercase tracking-wide">Frontend</span>
                                <p className="text-sm font-mono text-indigo-700 truncate">{frontUrl}</p>
                              </div>
                              <div className="shrink-0 flex items-center gap-1.5">
                                <button onClick={() => copyUrl(frontUrl)} title="Copiar URL"
                                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition ${copiedIp === frontUrl ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-white border-slate-200 text-slate-500 hover:border-indigo-300 hover:text-indigo-600'}`}>
                                  {copiedIp === frontUrl ? (
                                    <><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>Copiado</>
                                  ) : (
                                    <><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>Copiar</>
                                  )}
                                </button>
                                <button onClick={() => openQr(frontUrl)}
                                  className="flex items-center gap-1 px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg transition">
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h2M4 12h2m0 0h2M4 16h2m0 0v4m6-11h.01M4 4h4v4H4V4zm12 0h4v4h-4V4zM4 16h4v4H4v-4z" /></svg>
                                  QR
                                </button>
                              </div>
                            </div>

                            <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-2">
                              <div className="min-w-0 flex-1">
                                <span className="text-[10px] text-emerald-500 font-semibold uppercase tracking-wide">Backend API</span>
                                <p className="text-sm font-mono text-emerald-700 truncate">{backUrl}</p>
                              </div>
                              <div className="shrink-0 flex items-center gap-1.5">
                                <button onClick={() => copyUrl(backUrl)} title="Copiar URL"
                                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition ${copiedIp === backUrl ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-white border-slate-200 text-slate-500 hover:border-emerald-300 hover:text-emerald-600'}`}>
                                  {copiedIp === backUrl ? (
                                    <><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>Copiado</>
                                  ) : (
                                    <><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>Copiar</>
                                  )}
                                </button>
                                <button onClick={() => openQr(backUrl)}
                                  className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg transition">
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h2M4 12h2m0 0h2M4 16h2m0 0v4m6-11h.01M4 4h4v4H4V4zm12 0h4v4h-4V4zM4 16h4v4H4v-4z" /></svg>
                                  QR
                                </button>
                              </div>
                            </div>
                          </li>
                        );
                      })()}
                    </ul>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── Tab: Webhook de stock ───────────────────────────────────── */}
          {activeTab === 'webhook' && (
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 space-y-5">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                <h3 className="font-medium text-slate-700">Webhook — Productos en stock</h3>
                <span className="ml-auto text-xs bg-emerald-100 text-emerald-700 font-semibold px-2 py-0.5 rounded-full">GET</span>
              </div>

              <div className="bg-slate-50 border border-slate-100 rounded-lg px-4 py-3 text-sm">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">¿Qué es este endpoint?</p>
                <p className="text-slate-600 leading-relaxed">
                  Endpoint público de solo lectura que devuelve en JSON los productos en stock.
                  Puedes filtrarlo por <strong className="text-slate-800">grupo</strong> para exponer solo los productos de una categoría específica a sistemas externos.
                </p>
                <p className="text-xs text-slate-400 mt-2">Método: <code className="font-mono bg-slate-100 px-1 rounded">GET</code> · Content-Type: <code className="font-mono bg-slate-100 px-1 rounded">application/json</code></p>
              </div>

              {/* Selector de grupo */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">Filtrar por grupo</label>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => { setWebhookGroupId(null); setWebhookTestStatus(null); }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                      webhookGroupId === null
                        ? 'bg-indigo-600 border-indigo-600 text-white'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600'
                    }`}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                    </svg>
                    Todos los productos
                  </button>
                  {groups.map(g => (
                    <button
                      key={g.id}
                      onClick={() => { setWebhookGroupId(Number(g.id)); setWebhookTestStatus(null); }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                        webhookGroupId === Number(g.id)
                          ? 'bg-indigo-600 border-indigo-600 text-white'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600'
                      }`}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      {g.name}
                      <span className={`text-[10px] px-1 rounded ${webhookGroupId === Number(g.id) ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                        {g.categories.length}
                      </span>
                    </button>
                  ))}
                  {groups.length === 0 && (
                    <p className="text-xs text-slate-400 italic self-center">
                      Sin grupos creados — ve a Productos → Grupos para crear uno.
                    </p>
                  )}
                </div>
                {webhookGroupId !== null && (
                  <p className="text-xs text-indigo-600">
                    Grupo seleccionado: <strong>{groups.find(g => Number(g.id) === webhookGroupId)?.name}</strong>
                    {' '}· {groups.find(g => Number(g.id) === webhookGroupId)?.categories.length ?? 0} categorías asignadas
                  </p>
                )}
              </div>

              {/* URLs por IP detectada */}
              {loading && <p className="text-sm text-slate-400">Cargando información del servidor...</p>}

              {!loading && !wifiIp && (
                <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                  <svg className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
                  </svg>
                  <div>
                    <p className="text-sm font-semibold text-amber-800">Acceso por WiFi no disponible</p>
                    <p className="text-xs text-amber-700 mt-0.5">
                      Estás usando <code className="font-mono bg-amber-100 px-1 rounded">localhost</code>. Para generar las URLs del webhook, abre la aplicación desde la IP WiFi del equipo.
                    </p>
                  </div>
                </div>
              )}

              {!loading && wifiIp && networkInfo && (
                <div className="space-y-3">
                  <p className="text-xs font-medium text-slate-600 uppercase tracking-wide">URLs generadas</p>
                  {(() => {
                    const webhookUrl = buildWebhookUrl(wifiIp, networkInfo.backendPort);
                    return (
                      <div className="border border-slate-200 rounded-xl overflow-hidden">
                        <div className="bg-slate-50 px-4 py-2 flex items-center gap-2 border-b border-slate-200">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wide">
                            {networkInfo?.entries.find(e => e.ip === wifiIp)?.iface ?? 'Red'} · {wifiIp}
                          </span>
                          {webhookGroupId !== null && (
                            <span className="ml-auto text-[10px] bg-indigo-100 text-indigo-600 font-semibold px-1.5 py-0.5 rounded">
                              {groups.find(g => Number(g.id) === webhookGroupId)?.name}
                            </span>
                          )}
                        </div>
                        <div className="px-4 py-3 flex items-center gap-3">
                          <code className="flex-1 text-sm font-mono text-indigo-700 break-all">{webhookUrl}</code>
                          <div className="shrink-0 flex items-center gap-1.5">
                            <button
                              onClick={() => copyWebhook(webhookUrl)}
                              title="Copiar URL"
                              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition ${
                                webhookCopied === webhookUrl
                                  ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                                  : 'bg-white border-slate-200 text-slate-500 hover:border-indigo-300 hover:text-indigo-600'
                              }`}
                            >
                              {webhookCopied === webhookUrl ? (
                                <><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>Copiado</>
                              ) : (
                                <><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>Copiar</>
                              )}
                            </button>
                            <button
                              onClick={() => testWebhook(webhookUrl)}
                              disabled={webhookTesting}
                              className="flex items-center gap-1 px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-medium rounded-lg transition"
                            >
                              {webhookTesting ? (
                                <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                </svg>
                              ) : (
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              )}
                              Probar
                            </button>
                            <button
                              onClick={() => openQr(webhookUrl)}
                              className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-700 hover:bg-slate-800 text-white text-xs font-medium rounded-lg transition"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h2M4 12h2m0 0h2M4 16h2m0 0v4m6-11h.01M4 4h4v4H4V4zm12 0h4v4h-4V4zM4 16h4v4H4v-4z" />
                              </svg>
                              QR
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {webhookTestStatus && (
                    <div className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm ${
                      webhookTestStatus.type === 'ok'
                        ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                        : 'bg-red-50 border border-red-200 text-red-600'
                    }`}>
                      {webhookTestStatus.type === 'ok' ? (
                        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      ) : (
                        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      )}
                      {webhookTestStatus.text}
                    </div>
                  )}
                </div>
              )}

              {/* Ejemplo de respuesta */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-slate-600 uppercase tracking-wide">Ejemplo de respuesta</p>
                <pre className="bg-slate-900 text-emerald-400 text-xs rounded-xl p-4 overflow-x-auto leading-relaxed">{`[
  {
    "id": 1,
    "barcode": "ABC123",
    "quantity": 5,
    "arrivalDate": "2025-01-15",
    "outDate": null,
    "price": 150000,
    "netValue": 750000,
    "description": "Producto en perfectas condiciones",
    "product": {
      "id": 1,
      "name": "RTX 4060",
      "brand": "NVIDIA"
    }
  }
]`}</pre>
              </div>
            </div>
          )}

          {/* ── Tab: Logo ──────────────────────────────────────────────── */}
          {activeTab === 'logo' && (
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 space-y-4">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <h3 className="font-medium text-slate-700">Logo del sistema</h3>
              </div>

              <div className="flex items-center gap-5">
                <div className="w-20 h-20 shrink-0 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden">
                  {logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={logoUrl} alt="Logo actual" className="w-full h-full object-contain p-1" />
                  ) : (
                    <svg className="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <p className="text-sm font-medium text-slate-700">Logo actual</p>
                  {logoName ? (
                    <p className="text-xs text-slate-400 font-mono truncate">{logoName}</p>
                  ) : (
                    <p className="text-xs text-slate-400">No hay logo configurado — se usa el logo por defecto.</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <label className={`cursor-pointer flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition border ${
                  uploading ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 border-indigo-600 text-white'
                }`}>
                  {uploading ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      Subiendo...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      Cambiar logo
                    </>
                  )}
                  <input ref={fileInputRef} type="file" accept="image/*" disabled={uploading} onChange={handleLogoUpload} className="hidden" />
                </label>

                {uploadMsg && (
                  <span className={`text-sm flex items-center gap-1.5 ${uploadMsg.type === 'ok' ? 'text-emerald-600' : 'text-red-500'}`}>
                    {uploadMsg.type === 'ok' ? (
                      <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    ) : (
                      <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    )}
                    {uploadMsg.text}
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-400">
                El nuevo logo se aplica en toda la aplicación de forma inmediata. Formatos soportados: PNG, JPG, SVG, WEBP.
              </p>
            </div>
          )}

          {/* ── Tab: Cámara ────────────────────────────────────────────── */}
          {activeTab === 'camera' && (
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 space-y-4">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <h3 className="font-medium text-slate-700">Cámara y escáner QR</h3>
                {camGranted && (
                  <span className="ml-auto text-xs bg-emerald-100 text-emerald-700 font-semibold px-2 py-0.5 rounded-full">Activo</span>
                )}
                {camNative === 'denied' && (
                  <span className="ml-auto text-xs bg-amber-100 text-amber-700 font-semibold px-2 py-0.5 rounded-full">Bloqueado</span>
                )}
              </div>

              <p className="text-sm text-slate-500">
                Autoriza el uso de la cámara para escanear códigos QR y de barras en los formularios de inventario y ventas.
              </p>

              {camGranted && (
                <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                  <svg className="w-5 h-5 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-sm font-semibold text-emerald-800">Acceso concedido</p>
                    <p className="text-xs text-emerald-600 mt-0.5">La cámara está disponible para escanear códigos en toda la aplicación.</p>
                  </div>
                </div>
              )}

              {!camGranted && camNative === 'denied' && (
                <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                  <svg className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                  </svg>
                  <div>
                    <p className="text-sm font-semibold text-amber-800">Acceso bloqueado por el navegador</p>
                    <p className="text-xs text-amber-700 mt-0.5">
                      Ve a los ajustes del navegador → Privacidad → Permisos del sitio → Cámara, y habilita el acceso para este sitio.
                    </p>
                  </div>
                </div>
              )}

              {!camGranted && camNative !== 'denied' && camNative !== 'unavailable' && (
                <button onClick={requestCamPermission} disabled={camRequesting}
                  className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:bg-slate-200 disabled:text-slate-400 text-white text-sm font-semibold rounded-xl transition touch-manipulation">
                  {camRequesting ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      Solicitando acceso...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round"
                          d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Autorizar cámara
                    </>
                  )}
                </button>
              )}

              {camNative === 'unavailable' && (
                isInsecureHttp ? (
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                      <svg className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round"
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <div>
                        <p className="text-sm font-semibold text-amber-800">Conexión HTTP — cámara bloqueada</p>
                        <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                          Chrome en Android solo permite cámara en conexiones seguras (HTTPS). Para habilitarla en red local sigue estos pasos:
                        </p>
                      </div>
                    </div>

                    <ol className="text-xs text-slate-600 space-y-2 pl-1">
                      <li className="flex gap-2">
                        <span className="w-5 h-5 shrink-0 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-[10px]">1</span>
                        <span>En Chrome Android abre <span className="font-mono font-semibold">chrome://flags</span> en la barra de direcciones.</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="w-5 h-5 shrink-0 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-[10px]">2</span>
                        <span>Busca <span className="font-mono font-semibold">Insecure origins treated as secure</span> y actívalo (Enable).</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="w-5 h-5 shrink-0 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-[10px]">3</span>
                        <span>Agrega esta URL en el campo de texto:</span>
                      </li>
                    </ol>

                    {siteOrigin && (
                      <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                        <span className="font-mono text-sm text-indigo-700 flex-1 break-all">{siteOrigin}</span>
                        <button onClick={() => navigator.clipboard?.writeText(siteOrigin)} title="Copiar"
                          className="shrink-0 text-slate-400 hover:text-indigo-600 transition">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round"
                              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                      </div>
                    )}

                    <p className="text-xs text-slate-400">
                      Después reinicia Chrome y vuelve a esta página para autorizar la cámara.
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-slate-400">Este dispositivo o navegador no permite el acceso a la cámara.</p>
                )
              )}
            </div>
          )}

          {/* ── Tab: Exportar inventario ────────────────────────────────── */}
          {activeTab === 'export' && (
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 space-y-4">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                <h3 className="font-medium text-slate-700">Exportar inventario en stock</h3>
              </div>

              <p className="text-sm text-slate-500">
                Envía el inventario actualmente en stock a un sistema externo mediante una petición POST con cuerpo JSON.
              </p>

              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-600">URL de destino</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={exportUrl}
                    onChange={e => setExportUrl(e.target.value)}
                    placeholder="https://ejemplo.com/api/inventario"
                    className="flex-1 text-sm font-mono border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                  <button
                    onClick={saveExportUrl}
                    disabled={!exportUrl.trim()}
                    className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition ${
                      exportSaved
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                        : 'bg-white border-slate-200 text-slate-500 hover:border-indigo-300 hover:text-indigo-600 disabled:opacity-40'
                    }`}
                  >
                    {exportSaved ? (
                      <><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>Guardada</>
                    ) : (
                      <><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>Guardar</>
                    )}
                  </button>
                </div>
                <p className="text-xs text-slate-400">La URL se guarda localmente en este dispositivo.</p>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <button
                  onClick={sendInventory}
                  disabled={exporting || !exportUrl.trim()}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:bg-slate-200 disabled:text-slate-400 text-white text-sm font-semibold rounded-xl transition"
                >
                  {exporting ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      Enviando...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                      Enviar inventario en stock
                    </>
                  )}
                </button>

                {exportStatus && (
                  <span className={`text-sm flex items-center gap-1.5 ${exportStatus.type === 'ok' ? 'text-emerald-600' : 'text-red-500'}`}>
                    {exportStatus.type === 'ok' ? (
                      <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    ) : (
                      <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    )}
                    {exportStatus.text}
                  </span>
                )}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Modal QR */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Código QR de acceso">
        <div className="flex flex-col items-center gap-4 py-2">
          <p className="text-sm text-slate-500 text-center">
            Escanea desde cualquier dispositivo en la misma red
          </p>
          <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
            <QRCodeSVG value={qrUrl} size={200} level="M" />
          </div>
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-lg px-4 py-2 w-full">
            <span className="text-sm font-mono text-indigo-700 break-all flex-1">{qrUrl}</span>
            <button onClick={() => navigator.clipboard.writeText(qrUrl)} title="Copiar URL"
              className="shrink-0 text-slate-400 hover:text-indigo-600 transition">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
