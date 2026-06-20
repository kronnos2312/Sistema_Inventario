'use client';

import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';

type Props = {
  onScan: (code: string) => void;
};

export default function QrScanButton({ onScan }: Props) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);

  const stop = () => {
    BrowserMultiFormatReader.releaseAllStreams();
    setOpen(false);
    setError('');
  };

  useEffect(() => {
    if (!open) return;
    setError('');
    const reader = new BrowserMultiFormatReader();

    reader
      .decodeFromConstraints(
        { video: { facingMode: { ideal: 'environment' } } },
        videoRef.current!,
        (result, err) => {
          if (result) {
            onScan(result.getText());
            stop();
          }
          if (err && err.name !== 'NotFoundException') {
            setError('No se pudo leer el código');
          }
        },
      )
      .catch(() => setError('Sin acceso a la cámara'));

    return () => { BrowserMultiFormatReader.releaseAllStreams(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <>
      {/* Botón disparador */}
      <button
        type="button"
        onClick={() => (open ? stop() : setOpen(true))}
        title={open ? 'Cerrar cámara' : 'Escanear QR / código de barras'}
        className={`flex-shrink-0 flex items-center justify-center w-11 h-11 rounded-xl border transition touch-manipulation ${
          open
            ? 'bg-red-50 border-red-200 text-red-500 hover:bg-red-100'
            : 'bg-white border-slate-300 text-slate-500 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50'
        }`}
      >
        {open ? (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        )}
      </button>

      {/* Overlay de cámara */}
      {open && (
        <div className="fixed inset-0 z-[1100] flex flex-col bg-black/90" onClick={stop}>
          <div className="flex items-center justify-between px-4 pt-[env(safe-area-inset-top,1rem)] pb-3">
            <p className="text-white text-sm font-semibold">Escanear código</p>
            <button
              onClick={stop}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-white/15 hover:bg-white/25 text-white transition"
              aria-label="Cerrar cámara"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Visor */}
          <div className="flex-1 flex items-center justify-center px-4" onClick={e => e.stopPropagation()}>
            <div className="relative w-full max-w-sm aspect-[3/4] sm:aspect-video rounded-2xl overflow-hidden bg-black">
              <video
                ref={videoRef}
                className="absolute inset-0 w-full h-full object-cover"
                playsInline
                muted
              />
              {/* Retículo de encuadre */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="relative w-52 h-52">
                  {/* Esquinas */}
                  {(['tl','tr','bl','br'] as const).map(c => (
                    <span key={c} className={`absolute w-8 h-8 border-white border-[3px] rounded-sm ${
                      c === 'tl' ? 'top-0 left-0 border-r-0 border-b-0' :
                      c === 'tr' ? 'top-0 right-0 border-l-0 border-b-0' :
                      c === 'bl' ? 'bottom-0 left-0 border-r-0 border-t-0' :
                                   'bottom-0 right-0 border-l-0 border-t-0'
                    }`} />
                  ))}
                  {/* Línea de barrido */}
                  <div className="absolute left-1 right-1 top-1/2 h-px bg-indigo-400/80 animate-[scan_2s_ease-in-out_infinite]" />
                </div>
              </div>
            </div>
          </div>

          {/* Instrucción / error */}
          <div className="px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] text-center">
            {error ? (
              <p className="text-red-400 text-sm">{error}</p>
            ) : (
              <p className="text-white/60 text-sm">Apunta el QR o código de barras al recuadro</p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
