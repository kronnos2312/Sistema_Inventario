'use client';

import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import Modal from '../base/context/Modal';

interface NetworkEntry {
  iface: string;
  ip: string;
}

interface NetworkInfo {
  entries: NetworkEntry[];
  port: string;
  hostname: string;
  platform: string;
  release: string;
  source: 'env' | 'auto' | 'docker';
}

const PLATFORM_LABEL: Record<string, string> = {
  win32: 'Windows',
  linux: 'Linux',
  darwin: 'macOS',
};

export default function ConfigPage() {
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [qrUrl, setQrUrl] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [customUrl, setCustomUrl] = useState('');
  const [showManual, setShowManual] = useState(false);
  const [copiedIp, setCopiedIp] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/network-info')
      .then(r => r.json())
      .then((data: NetworkInfo) => {
        setNetworkInfo(data);
        if (data.source === 'docker') setShowManual(true);
      })
      .finally(() => setLoading(false));
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

  const isDockerSource = networkInfo?.source === 'docker';

  return (
    <div className="p-6 space-y-5">

      <div>
        <h2 className="text-lg font-semibold text-slate-800">Configuración</h2>
        <p className="text-sm text-slate-500">Acceso en red local y ajustes del sistema</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">

        {/* Card: Red local */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 space-y-4">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
            </svg>
            <h3 className="font-medium text-slate-700">Acceso en red local</h3>
          </div>

          {loading && (
            <p className="text-sm text-slate-400">Detectando interfaces de red...</p>
          )}

          {!loading && networkInfo && (
            <>
              {/* Info del origen */}
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
                  <span className="font-mono">{PLATFORM_LABEL[networkInfo.platform] ?? networkInfo.platform}</span>
                  <span className="text-slate-300">·</span>
                  <span className="font-mono truncate max-w-[100px]" title={networkInfo.release}>{networkInfo.release}</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3" />
                  </svg>
                  <span>Puerto</span>
                  <span className="font-mono text-indigo-600">{networkInfo.port}</span>
                </div>
              </div>

              {/* Advertencia Docker */}
              {isDockerSource && (
                <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5 text-xs text-amber-700">
                  <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                  </svg>
                  <span>
                    Solo se detectaron IPs internas de Docker. Usa el campo de abajo para ingresar la IP real del host,
                    o define <code className="font-mono bg-amber-100 px-1 rounded">HOST_IP</code> en el archivo <code className="font-mono bg-amber-100 px-1 rounded">.env</code>.
                  </span>
                </div>
              )}

              {/* Lista de IPs detectadas — siempre visible */}
              {networkInfo.entries.length === 0 ? (
                <p className="text-sm text-slate-500">No se detectaron IPs en la red local.</p>
              ) : (
                <ul className="space-y-2">
                  {networkInfo.entries.map(({ iface, ip }) => {
                    const url = `http://${ip}:${networkInfo.port}`;
                    const copied = copiedIp === url;
                    return (
                      <li key={ip} className="flex items-center justify-between gap-2 bg-slate-50 border border-slate-100 rounded-lg px-4 py-2.5">
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wide">{iface}</p>
                          <p className="text-sm font-mono text-indigo-700 truncate">{url}</p>
                        </div>
                        <div className="shrink-0 flex items-center gap-1.5">
                          {/* Copiar URL */}
                          <button
                            onClick={() => copyUrl(url)}
                            title="Copiar URL"
                            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition ${
                              copied
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                                : 'bg-white border-slate-200 text-slate-500 hover:border-indigo-300 hover:text-indigo-600'
                            }`}
                          >
                            {copied ? (
                              <>
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Copiado
                              </>
                            ) : (
                              <>
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                                Copiar
                              </>
                            )}
                          </button>
                          {/* Ver QR */}
                          <button
                            onClick={() => openQr(url)}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg transition"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h2M4 12h2m0 0h2M4 16h2m0 0v4m6-11h.01M4 4h4v4H4V4zm12 0h4v4h-4V4zM4 16h4v4H4v-4z" />
                            </svg>
                            QR
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}

              {/* URL personalizada — colapsable */}
              {showManual ? (
                <div className="space-y-2 border-t border-slate-100 pt-3">
                  <label className="text-xs text-slate-500">IP del host (manual)</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customUrl}
                      onChange={e => setCustomUrl(e.target.value)}
                      placeholder="http://192.168.1.100:3000"
                      className="flex-1 text-sm font-mono border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                    <button
                      onClick={() => { if (customUrl) copyUrl(customUrl); }}
                      disabled={!customUrl}
                      title="Copiar URL"
                      className="shrink-0 px-3 py-2 bg-white border border-slate-200 hover:border-indigo-300 disabled:opacity-40 text-slate-500 hover:text-indigo-600 rounded-lg transition"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => { if (customUrl) openQr(customUrl); }}
                      disabled={!customUrl}
                      className="shrink-0 flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-medium rounded-lg transition"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h2M4 12h2m0 0h2M4 16h2m0 0v4m6-11h.01M4 4h4v4H4V4zm12 0h4v4h-4V4zM4 16h4v4H4v-4z" />
                      </svg>
                      QR
                    </button>
                  </div>
                  {!isDockerSource && (
                    <button onClick={() => setShowManual(false)} className="text-xs text-slate-400 hover:text-slate-600">
                      Ocultar
                    </button>
                  )}
                </div>
              ) : (
                <button onClick={() => setShowManual(true)} className="text-xs text-slate-400 hover:text-slate-600">
                  Ingresar URL manualmente
                </button>
              )}
            </>
          )}
        </div>

        {/* Card: APK */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 opacity-50">
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <h3 className="font-medium text-slate-500">Aplicación móvil (APK)</h3>
            <span className="ml-auto text-xs bg-slate-100 text-slate-400 px-2 py-0.5 rounded-full">No disponible</span>
          </div>
          <p className="text-sm text-slate-400">
            La versión Android está descartada. Accede al sistema desde el navegador del dispositivo usando el QR de la red local.
          </p>
          <button disabled className="mt-4 flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-400 rounded-lg text-sm cursor-not-allowed">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Descargar APK
          </button>
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
            <button
              onClick={() => navigator.clipboard.writeText(qrUrl)}
              title="Copiar URL"
              className="shrink-0 text-slate-400 hover:text-indigo-600 transition"
            >
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
