'use client';

import { useEffect, useRef } from 'react';
import { createChart, CandlestickSeries, HistogramSeries } from 'lightweight-charts';

export default function CandlestickChart({ data, height = 380 }) {
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const candleSeriesRef = useRef(null);
  const volumeSeriesRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { color: 'transparent' },
        textColor: '#94a3b8',
        fontFamily: 'var(--font-mono, monospace)',
        fontSize: 11,
      },
      grid: {
        vertLines: { color: '#1e2535' },
        horzLines: { color: '#1e2535' },
      },
      crosshair: {
        vertLine: { color: '#4a5568', labelBackgroundColor: '#161b24' },
        horzLine: { color: '#4a5568', labelBackgroundColor: '#161b24' },
      },
      rightPriceScale: {
        borderColor: '#1e2535',
        scaleMargins: { top: 0.1, bottom: 0.3 },
      },
      timeScale: {
        borderColor: '#1e2535',
        timeVisible: true,
        secondsVisible: false,
      },
      handleScroll: true,
      handleScale: true,
      width: containerRef.current.clientWidth,
      height,
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#00d68f',
      downColor: '#ff4757',
      borderUpColor: '#00d68f',
      borderDownColor: '#ff4757',
      wickUpColor: '#00d68f',
      wickDownColor: '#ff4757',
    });

    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
    });

    chart.priceScale('volume').applyOptions({
      scaleMargins: { top: 0.75, bottom: 0 },
    });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    volumeSeriesRef.current = volumeSeries;

    const ro = new ResizeObserver(() => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth });
      }
    });
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      chart.remove();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [height]);

  useEffect(() => {
    if (!candleSeriesRef.current || !volumeSeriesRef.current || !data.length) return;

    candleSeriesRef.current.setData(
      data.map((d) => ({
        time: d.time,
        open: d.open,
        high: d.high,
        low: d.low,
        close: d.close,
      }))
    );

    volumeSeriesRef.current.setData(
      data.map((d) => ({
        time: d.time,
        value: d.volume,
        color: d.close >= d.open ? 'rgba(0,214,143,0.4)' : 'rgba(255,71,87,0.4)',
      }))
    );

    chartRef.current.timeScale().fitContent();
  }, [data]);

  return <div ref={containerRef} style={{ width: '100%', height }} />;
}
