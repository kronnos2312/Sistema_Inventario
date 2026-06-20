'use client';

import { useEffect, useState } from 'react';
import { useDeviceConfig } from '@/app/hooks/useDeviceConfig';

type NativeStatus = 'idle' | 'prompt' | 'granted' | 'denied' | 'unavailable';

const SESSION_KEY = 'cam-perm-dismissed';

export default function CameraPermissionBanner() {
  const { status: deviceStatus, saveCameraPermission } = useDeviceConfig();
  const [nativeStatus, setNativeStatus] = useState<NativeStatus>('idle');
  const [dismissed, setDismissed] = useState(false);

  // Verificar permisos nativos inmediatamente al montar,
  // sin esperar al backend. Funciona en Android Chrome y iOS Safari.
  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY)) {
      setDismissed(true);
      return;
    }

    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setNativeStatus('unavailable');
      return;
    }

    if ('permissions' in navigator) {
      navigator.permissions
        .query({ name: 'camera' as PermissionName })
        .then(result => {
          setNativeStatus(result.state as NativeStatus);
          result.addEventListener('change', () =>
            setNativeStatus(result.state as NativeStatus),
          );
        })
        .catch(() => {
          // iOS Safari / algunos Android no soportan query de cámara
          setNativeStatus('prompt');
        });
    } else {
      // Sin Permissions API (navegadores Android más viejos)
      setNativeStatus('prompt');
    }
  }, []); // Solo al montar

  const dismiss = () => {
    sessionStorage.setItem(SESSION_KEY, '1');
    setDismissed(true);
  };

  const requestPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
      });
      stream.getTracks().forEach(t => t.stop());
      setNativeStatus('granted');
      await saveCameraPermission(); // Persistir en backend
    } catch (err) {
      if (err instanceof Error && err.name === 'NotAllowedError') {
        setNativeStatus('denied');
      }
    }
  };

  // Ocultar si: backend confirmó permiso, nativo ya concedido/no-disponible, o descartado.
  // NO ocultar mientras deviceStatus === 'loading' — el nativo ya puede mostrarse.
  if (
    deviceStatus === 'granted' ||
    nativeStatus === 'idle' ||
    nativeStatus === 'granted' ||
    nativeStatus === 'unavailable' ||
    dismissed
  ) {
    return null;
  }

  const wrap = [
    'fixed z-[60] left-3 right-3',
    'sm:left-auto sm:right-4 sm:w-80',
    'bottom-[4.5rem] sm:bottom-4',
    'pb-[env(safe-area-inset-bottom,0px)]',
    'rounded-2xl shadow-2xl border p-4',
    'flex items-start gap-3',
    'animate-[fade-up_0.25s_ease-out]',
  ].join(' ');

  /* ── Cámara bloqueada ── */
  if (nativeStatus === 'denied') {
    return (
      <div className={`${wrap} bg-amber-50 border-amber-200`}>
        <div className="w-9 h-9 flex-shrink-0 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-amber-900 leading-tight">Cámara bloqueada</p>
          <p className="text-xs text-amber-700 mt-0.5 leading-snug">
            Para escanear QR ve a los ajustes del navegador y habilita el acceso a la cámara.
          </p>
        </div>
        <button
          onClick={dismiss}
          aria-label="Cerrar"
          className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full text-amber-500 hover:bg-amber-100 transition touch-manipulation"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    );
  }

  /* ── Solicitar permiso ── */
  return (
    <div className={`${wrap} bg-white border-slate-200`}>
      <div className="w-9 h-9 flex-shrink-0 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-800 leading-tight">Acceso a la cámara</p>
        <p className="text-xs text-slate-500 mt-0.5 leading-snug">
          Permite el uso de la cámara para escanear códigos QR y de barras.
        </p>
        <div className="flex gap-2 mt-2.5">
          <button
            onClick={requestPermission}
            className="flex-1 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-semibold rounded-xl transition touch-manipulation"
          >
            Permitir cámara
          </button>
          <button
            onClick={dismiss}
            className="px-3 py-2 text-slate-500 hover:text-slate-700 text-xs font-medium rounded-xl hover:bg-slate-100 transition touch-manipulation"
          >
            Ahora no
          </button>
        </div>
      </div>
    </div>
  );
}
