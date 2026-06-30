'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { DecodeHintType, BarcodeFormat } from '@zxing/library';
import { useInventoryStore } from '@/app/store/useInventoryStore';
import { InventoryItem } from '@/app/model/InventoryItem';

const fmtCurrency = (v: number | '') =>
  v !== '' ? `$${Number(v).toLocaleString('es-CO')}` : '—';

const fmtDate = (d: string) => (d ? d.split('T')[0] : '—');

function ResultCard({ item }: { item: InventoryItem }) {
  const inStock = !item.outDate;
  return (
    <div className="flex gap-3 px-4 py-3 bg-white hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0">
      {/* Estado badge */}
      <div className="flex-shrink-0 pt-0.5">
        <span
          className={`inline-flex items-center justify-center w-2 h-2 rounded-full mt-1.5 ${
            inStock ? 'bg-emerald-400' : 'bg-amber-400'
          }`}
        />
      </div>

      {/* Info principal */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-800 truncate">
              {item.product.name}
            </p>
            <p className="text-xs text-slate-500 truncate">
              {[item.product.brand, item.product.model].filter(Boolean).join(' · ')}
            </p>
          </div>
          <span className="text-sm font-bold text-slate-800 flex-shrink-0">
            {fmtCurrency(item.price)}
          </span>
        </div>

        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
          <span className="font-mono">{item.barcode}</span>
          <span>·</span>
          <span>{Number(item.quantity)} ud{Number(item.quantity) !== 1 ? 's' : ''}.</span>
          <span>·</span>
          <span>Ingreso: {fmtDate(item.arrivalDate)}</span>
          {!inStock && (
            <>
              <span>·</span>
              <span className="text-amber-500">Salida: {fmtDate(String(item.outDate))}</span>
            </>
          )}
        </div>

        {/* Nota de retiro si existe */}
        {item.withdrawalNote && (
          <p className="mt-1 text-xs text-slate-400 italic truncate">
            Nota: {item.withdrawalNote}
          </p>
        )}
      </div>

      {/* Badge estado */}
      <div className="flex-shrink-0 self-start">
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
            inStock
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-amber-100 text-amber-700'
          }`}
        >
          {inStock ? 'En Stock' : 'Retirado'}
        </span>
      </div>
    </div>
  );
}

const SCAN_HINTS = new Map<DecodeHintType, unknown>([
  [DecodeHintType.TRY_HARDER, true],
  [DecodeHintType.POSSIBLE_FORMATS, [
    BarcodeFormat.QR_CODE,
    BarcodeFormat.EAN_13,
    BarcodeFormat.EAN_8,
    BarcodeFormat.CODE_128,
    BarcodeFormat.CODE_39,
    BarcodeFormat.UPC_A,
    BarcodeFormat.UPC_E,
    BarcodeFormat.DATA_MATRIX,
  ]],
]);

export default function BarcodeScanner() {
  const { inventory } = useInventoryStore();
  const videoRef = useRef<HTMLVideoElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState('');
  const [scanning, setScanning] = useState(false);
  const [camError, setCamError] = useState('');
  const [filter, setFilter] = useState<'all' | 'stock' | 'retired'>('all');

  /* ── Detener cámara ── */
  const stopCamera = () => {
    BrowserMultiFormatReader.releaseAllStreams();
    setScanning(false);
  };

  /* ── Iniciar escaneo ── */
  useEffect(() => {
    if (!scanning) return;
    setCamError('');
    const reader = new BrowserMultiFormatReader(SCAN_HINTS, { delayBetweenScanAttempts: 150 });

    reader
      .decodeFromConstraints(
        { video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } } },
        videoRef.current!,
        (res, err) => {
          if (res) {
            setQuery(res.getText());
            stopCamera();
            inputRef.current?.focus();
          }
          if (err && err.name !== 'NotFoundException') {
            setCamError('Error al leer el código');
          }
        },
      )
      .catch(() => setCamError('No se pudo acceder a la cámara'));

    return () => { BrowserMultiFormatReader.releaseAllStreams(); };
  }, [scanning]);

  /* ── Filtro en tiempo real ── */
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    return inventory.filter(item => {
      const haystack = [
        item.barcode,
        item.product.name,
        item.product.brand,
        item.product.model,
        item.description,
        item.withdrawalNote ?? '',
      ]
        .join(' ')
        .toLowerCase();

      if (!haystack.includes(q)) return false;
      if (filter === 'stock') return !item.outDate;
      if (filter === 'retired') return !!item.outDate;
      return true;
    });
  }, [query, inventory, filter]);

  const inStockCount = results.filter(i => !i.outDate).length;
  const retiredCount = results.filter(i => !!i.outDate).length;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden mb-6">

      {/* ── Header ── */}
      <div className="flex items-center gap-2.5 px-5 py-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white">
        <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-semibold leading-tight">Consulta de Inventario</p>
          <p className="text-xs text-white/70 leading-tight">
            Busca por código, producto, marca o modelo
          </p>
        </div>
      </div>

      <div className="p-5 flex flex-col gap-4">

        {/* ── Input de búsqueda + botón cámara ── */}
        <div>
          <label className="flex items-center gap-1 text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Búsqueda
          </label>
          <div className="flex gap-2">
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Código de barras, nombre del producto, marca..."
              className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm placeholder:text-slate-400 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-violet-500/25 focus:border-violet-500 transition"
              autoFocus
            />
            {/* Botón cámara */}
            <button
              onClick={() => scanning ? stopCamera() : setScanning(true)}
              title={scanning ? 'Detener cámara' : 'Escanear con cámara'}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold rounded-xl transition whitespace-nowrap ${
                scanning
                  ? 'bg-red-100 text-red-600 hover:bg-red-200 border border-red-200'
                  : 'bg-violet-600 hover:bg-violet-700 text-white shadow-sm shadow-violet-200'
              }`}
            >
              {scanning ? (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Detener
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Escanear
                </>
              )}
            </button>
            {/* Limpiar */}
            {query && (
              <button
                onClick={() => { setQuery(''); inputRef.current?.focus(); }}
                className="w-10 flex items-center justify-center rounded-xl border border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition"
                title="Limpiar búsqueda"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          {camError && (
            <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {camError}
            </p>
          )}
        </div>

        {/* ── Visor de cámara ── */}
        {scanning && (
          <div className="relative rounded-xl overflow-hidden bg-black border border-slate-200">
            <video ref={videoRef} className="w-full max-h-52 object-cover" />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-40 h-40 border-2 border-violet-400 rounded-lg opacity-70" />
            </div>
            <p className="absolute bottom-2 left-0 right-0 text-center text-white/80 text-xs">
              Apunta el código al recuadro
            </p>
          </div>
        )}

        {/* ── Filtros de estado ── */}
        {query.trim() && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Mostrar:</span>
            {(
              [
                { key: 'all', label: 'Todos', count: results.length },
                { key: 'stock', label: 'En Stock', count: inStockCount },
                { key: 'retired', label: 'Retirados', count: retiredCount },
              ] as const
            ).map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`px-3 py-1 text-xs font-medium rounded-full transition ${
                  filter === key
                    ? 'bg-violet-600 text-white'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                {label} ({count})
              </button>
            ))}
          </div>
        )}

        {/* ── Resultados ── */}
        {query.trim() && (
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            {results.length > 0 ? (
              <>
                <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">
                    {results.length} coincidencia{results.length !== 1 ? 's' : ''}
                  </span>
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                      {inStockCount} en stock
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
                      {retiredCount} retirado{retiredCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                  {results.map(item => (
                    <ResultCard key={item.id} item={item} />
                  ))}
                </div>
              </>
            ) : (
              <div className="py-10 flex flex-col items-center gap-2 text-slate-400">
                <svg className="w-9 h-9 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <p className="text-sm font-medium">Sin coincidencias</p>
                <p className="text-xs">Intenta con otro código, nombre o marca</p>
              </div>
            )}
          </div>
        )}

        {/* ── Estado inicial ── */}
        {!query.trim() && !scanning && (
          <div className="py-8 flex flex-col items-center gap-2 text-slate-300">
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
            <p className="text-sm">Escribe o escanea para buscar</p>
          </div>
        )}

      </div>
    </div>
  );
}
