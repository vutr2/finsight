'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { createChart, AreaSeries, HistogramSeries } from 'lightweight-charts';

// ── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n) => (n != null ? n.toLocaleString('vi-VN') : '—');
const fmtVol = (n) => {
  if (n == null) return '—';
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(2) + 'T';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(0) + 'K';
  return n.toLocaleString('vi-VN');
};
const fmtDate = (unixSec) => {
  const d = new Date(unixSec * 1000);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};

const RANGES = [
  { label: '1T', days: 30 },
  { label: '3T', days: 90 },
  { label: '6T', days: 180 },
  { label: '1N', days: 365 },
  { label: '3N', days: 1095 },
  { label: '5N', days: 1825 },
];

// ── Component ─────────────────────────────────────────────────────────────────
// Props:
//   symbol  — ticker string, e.g. "VNM"  (self-fetching mode)
//   data    — OHLCV array                (controlled mode — no range bar)
//   height  — chart area px
//   quote   — live quote object { price, open, high, low, volume, pctChange }
export default function CandlestickChart({
  symbol,
  data: dataProp,
  height = 320,
  quote = null,
}) {
  const containerRef = useRef(null);
  const chartRef     = useRef(null);
  const areaRef      = useRef(null);
  const volumeRef    = useRef(null);

  const [rangeDays,   setRangeDays]   = useState(365);
  const [data,        setData]        = useState(dataProp ?? []);
  const [loading,     setLoading]     = useState(!!symbol);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [hoverPrice,  setHoverPrice]  = useState(null);
  const [hoverDate,   setHoverDate]   = useState(null);

  const dataRef = useRef(data);
  useEffect(() => { dataRef.current = data; }, [data]);

  // ── Derived stats from data ───────────────────────────────────────────────
  const latest    = data.at(-1) ?? null;
  const first     = data.at(0)  ?? null;

  // Use live quote values when available, fallback to history data
  const livePrice  = quote?.price  ?? latest?.close  ?? null;
  const liveOpen   = quote?.open   ?? latest?.open   ?? null;
  const liveHigh   = quote?.high   ?? latest?.high   ?? null;
  const liveLow    = quote?.low    ?? latest?.low    ?? null;
  const liveVol    = quote?.volume ?? latest?.volume ?? null;

  // Price change vs first bar in range
  const firstClose = first?.close ?? null;
  const priceChange = livePrice && firstClose ? livePrice - firstClose : null;
  const pctChange   = priceChange && firstClose ? (priceChange / firstClose) * 100 : null;
  const isUp = (pctChange ?? 0) >= 0;

  const upColor   = '#0a8f5c';
  const downColor = '#d92638';
  const lineColor = isUp ? upColor : downColor;
  const fillTop   = isUp ? 'rgba(10,143,92,0.18)' : 'rgba(217,38,56,0.18)';
  const fillBot   = 'rgba(0,0,0,0)';

  // 52-week high/low from data
  const allCloses = data.map((d) => d.close).filter(Boolean);
  const high52 = allCloses.length ? Math.max(...allCloses) : null;
  const low52  = allCloses.length ? Math.min(...allCloses) : null;
  const avgVol  = data.length
    ? Math.round(data.reduce((s, d) => s + (d.volume ?? 0), 0) / data.length)
    : null;

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchData = useCallback((sym, days, showLoading = true) => {
    if (!sym) return () => {};
    let cancelled = false;
    if (showLoading) setLoading(true);
    fetch(`/api/stocks?type=history&symbol=${sym}&days=${days}&_=${Date.now()}`)
      .then((r) => r.json())
      .then((j) => {
        if (!cancelled) {
          setData(j.data ?? []);
          setLastUpdated(new Date());
          setLoading(false);
        }
      })
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!symbol) { setData(dataProp ?? []); return; }
    setData([]);
    return fetchData(symbol, rangeDays, true);
  }, [symbol, rangeDays, dataProp, fetchData]);

  // Auto-refresh every 30s for short ranges
  useEffect(() => {
    if (!symbol || rangeDays > 90) return;
    const id = setInterval(() => fetchData(symbol, rangeDays, false), 30_000);
    return () => clearInterval(id);
  }, [symbol, rangeDays, fetchData]);

  useEffect(() => {
    if (!symbol && dataProp) setData(dataProp);
  }, [dataProp, symbol]);

  // ── Push data into series ─────────────────────────────────────────────────
  const pushData = useCallback((rows) => {
    if (!areaRef.current || !rows.length) return;
    const sorted = [...rows].sort((a, b) => a.time - b.time);
    try {
      areaRef.current.setData(sorted.map((d) => ({ time: d.time, value: d.close })));
      volumeRef.current?.setData(sorted.map((d) => ({
        time: d.time,
        value: d.volume ?? 0,
        color: (d.close >= d.open) ? 'rgba(10,143,92,0.25)' : 'rgba(217,38,56,0.25)',
      })));
      chartRef.current?.timeScale().fitContent();
    } catch { /* ignore */ }
  }, []);

  // ── Build chart (once per mount) ──────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { color: 'transparent' },
        textColor: '#94a3b8',
        fontFamily: "'Geist Mono', monospace",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: 'rgba(148,163,184,0.1)' },
        horzLines: { color: 'rgba(148,163,184,0.1)' },
      },
      crosshair: {
        mode: 1,
        vertLine: { color: '#94a3b8', width: 1, style: 2, labelBackgroundColor: '#334155' },
        horzLine: { color: '#94a3b8', width: 1, style: 2, labelBackgroundColor: '#334155' },
      },
      rightPriceScale: {
        borderVisible: false,
        scaleMargins: { top: 0.08, bottom: 0.28 },
        textColor: '#94a3b8',
      },
      timeScale: {
        borderVisible: false,
        timeVisible: false,
        fixLeftEdge: true,
      },
      handleScroll: true,
      handleScale: true,
      width:  containerRef.current.clientWidth,
      height,
    });

    const areaSeries = chart.addSeries(AreaSeries, {
      lineColor,
      topColor:    fillTop,
      bottomColor: fillBot,
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerRadius: 4,
      crosshairMarkerBorderColor: '#fff',
      crosshairMarkerBackgroundColor: lineColor,
    });

    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat:      { type: 'volume' },
      priceScaleId:     'vol',
      lastValueVisible: false,
      priceLineVisible: false,
    });
    chart.priceScale('vol').applyOptions({ scaleMargins: { top: 0.78, bottom: 0 } });

    // Crosshair hover → update header price display
    chart.subscribeCrosshairMove((param) => {
      if (!param.time || !param.point) {
        setHoverPrice(null);
        setHoverDate(null);
        return;
      }
      const val = param.seriesData.get(areaSeries);
      if (val?.value != null) {
        setHoverPrice(val.value);
        setHoverDate(fmtDate(param.time));
      } else {
        setHoverPrice(null);
        setHoverDate(null);
      }
    });

    const ro = new ResizeObserver(() => {
      if (containerRef.current)
        chart.applyOptions({ width: containerRef.current.clientWidth });
    });
    ro.observe(containerRef.current);

    chartRef.current  = chart;
    areaRef.current   = areaSeries;
    volumeRef.current = volumeSeries;

    pushData(dataRef.current);

    return () => {
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [height]);

  // Update area colors when trend direction changes
  useEffect(() => {
    areaRef.current?.applyOptions({
      lineColor,
      topColor:    fillTop,
      bottomColor: fillBot,
    });
  }, [lineColor, fillTop, fillBot]);

  // Re-push data whenever it changes
  useEffect(() => { pushData(data); }, [data, pushData]);

  // Displayed price: hover overrides live
  const displayPrice  = hoverPrice  ?? livePrice;
  const displayChange = hoverPrice
    ? (firstClose ? ((hoverPrice - firstClose) / firstClose) * 100 : null)
    : pctChange;
  const displayIsUp   = (displayChange ?? 0) >= 0;
  const displayColor  = displayIsUp ? upColor : downColor;

  const changeSign = displayChange != null
    ? (displayIsUp ? '+' : '') + displayChange.toFixed(2) + '%'
    : null;

  // Stats grid items
  const stats = [
    { label: 'Mở cửa',      value: fmt(liveOpen) },
    { label: 'Cao nhất',     value: fmt(liveHigh),  color: upColor },
    { label: 'Thấp nhất',    value: fmt(liveLow),   color: downColor },
    { label: 'Khối lượng',   value: fmtVol(liveVol) },
    { label: `${rangeDays >= 365 ? '52t' : rangeDays + 'n'} Cao`, value: fmt(high52), color: upColor },
    { label: `${rangeDays >= 365 ? '52t' : rangeDays + 'n'} Thấp`, value: fmt(low52), color: downColor },
    { label: 'TB Khối lượng', value: fmtVol(avgVol) },
  ];

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ width: '100%', fontFamily: "'Geist Mono', monospace" }}>

      {/* ── Price header ── */}
      <div style={{ padding: '20px 20px 12px' }}>
        {/* Symbol row */}
        {symbol && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '0.04em' }}>
              {symbol}
            </span>
            {lastUpdated && rangeDays <= 90 && (
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                · {lastUpdated.getHours().toString().padStart(2,'0')}:{lastUpdated.getMinutes().toString().padStart(2,'0')}
              </span>
            )}
          </div>
        )}

        {/* Price + change */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', flexWrap: 'wrap' }}>
          <span style={{
            fontSize: '28px',
            fontWeight: 700,
            color: loading ? 'var(--text-muted)' : displayColor,
            transition: 'color 0.15s',
          }}>
            {loading ? '—' : fmt(displayPrice)}
          </span>
          {!loading && changeSign && (
            <span style={{
              fontSize: '13px',
              fontWeight: 600,
              color: displayColor,
              background: displayIsUp ? 'rgba(10,143,92,0.12)' : 'rgba(217,38,56,0.12)',
              padding: '3px 8px',
              borderRadius: '5px',
            }}>
              {changeSign}
            </span>
          )}
          {hoverDate && (
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              {hoverDate}
            </span>
          )}
        </div>
      </div>

      {/* ── Range selector ── */}
      <div style={{
        display: 'flex',
        gap: '2px',
        padding: '0 16px 8px',
        borderBottom: '1px solid var(--bg-border)',
      }}>
        {RANGES.map((r) => {
          const active = symbol ? rangeDays === r.days : false;
          return (
            <button
              key={r.label}
              onClick={() => symbol && setRangeDays(r.days)}
              disabled={!symbol}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                border: 'none',
                cursor: symbol ? 'pointer' : 'default',
                fontSize: '11px',
                fontWeight: active ? 700 : 500,
                fontFamily: "'Geist Mono', monospace",
                background: active
                  ? (isUp ? 'rgba(10,143,92,0.12)' : 'rgba(217,38,56,0.12)')
                  : 'transparent',
                color: active ? lineColor : 'var(--text-muted)',
                transition: 'all 0.15s',
              }}
            >
              {r.label}
            </button>
          );
        })}
      </div>

      {/* ── Chart canvas ── */}
      <div style={{ position: 'relative' }}>
        {loading && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(255,255,255,0.75)',
            zIndex: 5,
            fontSize: '12px',
            color: 'var(--text-muted)',
            gap: '7px',
          }}>
            <span style={{
              display: 'inline-block',
              width: '12px', height: '12px',
              border: '2px solid var(--bg-border)',
              borderTopColor: lineColor,
              borderRadius: '50%',
              animation: 'spin 0.7s linear infinite',
            }} />
            Đang tải...
          </div>
        )}
        <div ref={containerRef} style={{ width: '100%', height }} />
      </div>

      {/* ── Stats grid ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
        gap: '0',
        borderTop: '1px solid var(--bg-border)',
      }}>
        {stats.map(({ label, value, color }, i) => (
          <div key={label} style={{
            padding: '12px 16px',
            borderRight: (i + 1) % 4 === 0 ? 'none' : '1px solid var(--bg-border)',
            borderBottom: i < stats.length - (stats.length % 4 || 4) ? '1px solid var(--bg-border)' : 'none',
          }}>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {label}
            </div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: color ?? 'var(--text-primary)' }}>
              {value}
            </div>
          </div>
        ))}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
