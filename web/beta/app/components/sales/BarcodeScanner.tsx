'use client';

import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';

export default function BarcodeScanner() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);

  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    if (!scanning) return;

    const codeReader = new BrowserMultiFormatReader();
    readerRef.current = codeReader;

    codeReader
      .decodeFromVideoDevice(undefined, videoRef.current!, (res, err) => {
        if (res) {
          setResult(res.getText());
          setScanning(false);
        }
        if (err && err.name !== 'NotFoundException') {
          setError('Error leyendo el código');
        }
      })
      .catch(() => setError('No se pudo acceder a la cámara'));

    return () => {
      BrowserMultiFormatReader.releaseAllStreams();
    };
  }, [scanning]);

  return (
    <div className="max-w-sm space-y-3">
      <h2 className="text-base font-semibold text-slate-800">Escanear QR / Código de Barras</h2>

      {!scanning && (
        <button
          onClick={() => { setResult(null); setError(null); setScanning(true); }}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg"
        >
          Iniciar escaneo
        </button>
      )}

      {scanning && (
        <div className="space-y-2">
          <video ref={videoRef} className="w-full rounded-lg" />
          <button
            onClick={() => { BrowserMultiFormatReader.releaseAllStreams(); setScanning(false); }}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-sm font-medium rounded-lg"
          >
            Detener
          </button>
        </div>
      )}

      {result && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-sm">
          <span className="font-semibold text-emerald-700">Código detectado: </span>
          <span className="font-mono text-emerald-800">{result}</span>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}
