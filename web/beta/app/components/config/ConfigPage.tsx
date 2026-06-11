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

  useEffect(() => {
    fetch('/api/network-info')
      .then(r => r.json())
      .then((data: NetworkInfo) => setNetworkInfo(data))
      .finally(() => setLoading(false));
  }, []);

  const openQr = (ip: string) => {
    setQrUrl(`http://${ip}:${networkInfo?.port}`);
    setModalOpen(true);
  };

  return (
    <div className="p-6 space-y-5">

      <div>
        <h2 className="text-lg font-semibold text-slate-800">Configuración</h2>
        <p className="text-sm text-slate-500">Acceso en red local y ajustes del sistema</p>
      </div>

      {/* Dos columnas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">

        {/* Card izquierda: Red local */}
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M5 12h14M12 5l7 7-7 7" />
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M8 9l3 3-3 3m5 0h3" />
                  </svg>
                  <span>Puerto</span>
                  <span className="font-mono text-indigo-600">{networkInfo.port}</span>
                </div>
              </div>

              {/* Lista de IPs */}
              {networkInfo.entries.length === 0 ? (
                <p className="text-sm text-slate-500">No se detectaron IPs en la red local.</p>
              ) : (
                <ul className="space-y-2">
                  {networkInfo.entries.map(({ iface, ip }) => (
                    <li
                      key={ip}
                      className="flex items-center justify-between gap-3 bg-slate-50 border border-slate-100 rounded-lg px-4 py-2.5"
                    >
                      <div className="min-w-0">
                        <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wide">{iface}</p>
                        <p className="text-sm font-mono text-indigo-700 truncate">{`http://${ip}:${networkInfo.port}`}</p>
                      </div>
                      <button
                        onClick={() => openQr(ip)}
                        className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg transition"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h2M4 12h2m0 0h2M4 16h2m0 0v4m6-11h.01M4 4h4v4H4V4zm12 0h4v4h-4V4zM4 16h4v4H4v-4z" />
                        </svg>
                        Ver QR
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>

        {/* Card derecha: APK */}
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
          <button
            disabled
            className="mt-4 flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-400 rounded-lg text-sm cursor-not-allowed"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Descargar APK
          </button>
        </div>

      </div>

      {/* Modal QR */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Código QR de acceso"
      >
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
