'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';

// VPS WebSocket for real-time updates
const VPS_SOCKET_URL = 'https://bgdatafeed.vps.com.vn';

/**
 * Fetch the market via:
 *   1. Simplize API (server route) — snapshot, works 24/7
 *   2. VPS Socket.IO — real-time updates pushed during trading hours
 */
export function useMarket(refreshMs = 30000) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const socketRef = useRef(null);
  const dataMapRef = useRef(new Map()); // symbol → stock object

  // ── Step 1: Load snapshot from Simplize (24/7) ─────────────────────────────
  const loadSnapshot = useCallback(async () => {
    try {
      const res = await fetch('/api/stocks?type=market');
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      const stocks = json.data ?? [];
      // Merge with existing WS data — don't overwrite fresher WS prices
      for (const s of stocks) {
        if (!dataMapRef.current.has(s.symbol)) {
          dataMapRef.current.set(s.symbol, s);
        }
      }
      setData(Array.from(dataMapRef.current.values()));
      setLoading(false);
      return stocks.map((s) => s.symbol);
    } catch (e) {
      setError(e.message);
      setLoading(false);
      return [];
    }
  }, []);

  // ── Step 2: Connect VPS WebSocket for real-time updates ────────────────────
  const connectSocket = useCallback((symbols) => {
    if (!symbols.length) return;
    if (socketRef.current) socketRef.current.disconnect();

    const socket = io(VPS_SOCKET_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionAttempts: 10,
    });

    socket.on('connect', () => {
      // Subscribe in batches of 200
      for (let i = 0; i < symbols.length; i += 200) {
        const chunk = symbols.slice(i, i + 200).join(',');
        socket.emit('regs', JSON.stringify({ action: 'join', list: chunk }));
      }
    });

    // VPS pushes one stock update per 'board' event
    socket.on('board', (payload) => {
      try {
        const raw = typeof payload === 'string' ? JSON.parse(payload) : payload;
        const d = raw?.data ?? raw;
        if (!d) return;
        const sym = d.sym ?? d.mc ?? d.code;
        if (!sym) return;

        const existing = dataMapRef.current.get(sym) ?? {};
        dataMapRef.current.set(sym, {
          ...existing,
          symbol: sym,
          price:     d.lastPrice  ?? d.c              ?? existing.price,
          open:      d.ot         ?? d.o               ?? existing.open,
          high:      d.highPrice  ?? d.h               ?? existing.high,
          low:       d.lowPrice   ?? d.l               ?? existing.low,
          volume:    d.lot        ?? d.vol              ?? existing.volume,
          pctChange: d.persent    ?? d.changePc         ?? existing.pctChange,
          netChange: d.change     ?? d.changePrice      ?? existing.netChange,
          exchange:  existing.exchange ?? 'HOSE',
        });
        setData(Array.from(dataMapRef.current.values()));
      } catch {
        // ignore malformed frame
      }
    });

    socketRef.current = socket;
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadSnapshot().then((symbols) => {
      if (!cancelled) connectSocket(symbols);
    });
    return () => {
      cancelled = true;
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [loadSnapshot, connectSocket]);

  // Re-snapshot periodically to pick up price changes outside trading hours
  useEffect(() => {
    const id = setInterval(loadSnapshot, refreshMs);
    return () => clearInterval(id);
  }, [loadSnapshot, refreshMs]);

  return { data, loading, error };
}

/**
 * Fetch OHLC price history for a single symbol.
 */
export function useOHLC(symbol, refreshMs = 60000) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch_ = useCallback(async () => {
    if (!symbol) return;
    try {
      const res = await fetch(`/api/stocks?type=ohlc&symbol=${symbol}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setData(json.data);
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [symbol]);

  useEffect(() => {
    setLoading(true);
    fetch_();
    const id = setInterval(fetch_, refreshMs);
    return () => clearInterval(id);
  }, [fetch_, refreshMs]);

  return { data, loading, error };
}

/**
 * Fetch daily OHLC history for a single symbol via Vietstock.
 */
export function useHistory(symbol, days = 365) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch_ = useCallback(async () => {
    if (!symbol) return;
    try {
      const res = await fetch(`/api/stocks?type=history&symbol=${symbol}&days=${days}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setData(json.data);
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [symbol, days]);

  useEffect(() => {
    setLoading(true);
    fetch_();
  }, [fetch_]);

  return { data, loading, error };
}

/**
 * Fetch latest prices for multiple symbols.
 */
export function useMultiplePrices(symbols, refreshMs = 30000) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const symbolsKey = symbols.join(',');

  const fetch_ = useCallback(async () => {
    if (!symbols.length) return;
    try {
      const res = await fetch(`/api/stocks?type=prices&symbols=${symbolsKey}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setData(json.data);
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbolsKey]);

  useEffect(() => {
    setLoading(true);
    fetch_();
    const id = setInterval(fetch_, refreshMs);
    return () => clearInterval(id);
  }, [fetch_, refreshMs]);

  return { data, loading, error };
}
