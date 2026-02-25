// Primary source: VPS Securities (bgapidatafeed.vps.com.vn)
//   - Returns full market during trading hours (9:00–14:30 ICT)
//   - Free, no auth, CORS open
// Fallback: Simplize (api.simplize.vn)
//   - Works outside trading hours for individual symbols
//   - Used as fallback when VPS returns []
// Historical OHLC: Vietstock (finance.vietstock.vn)
//   - Returns full price history, no auth needed

const VPS_BASE = 'https://bgapidatafeed.vps.com.vn';
const SIMPLIZE_BASE = 'https://api.simplize.vn/api/historical/quote';
const SIMPLIZE_HEADERS = { Referer: 'https://simplize.vn/' };
const VIETSTOCK_HISTORY = 'https://finance.vietstock.vn/data/getpricehistory';

// VPS exchange groups
const VPS_EXCHANGES = ['HOSE', 'HNX', 'UPCOM'];

// Top Vietnamese stocks to display when VPS is unavailable
// Covers most actively traded HOSE + HNX stocks
const TOP_HOSE = [
  'VNM','VIC','HPG','VCB','BID','CTG','MBB','TCB','VHM','MSN',
  'MWG','FPT','VRE','VJC','HDB','STB','GVR','SSI','VND','PDR',
  'NVL','DXG','KBC','BCM','ACB','VPB','LPB','SHB','EIB','VIB',
  'PLX','PNJ','REE','GEX','DBC','SAB','BVH','BSR','POW','NT2',
  'GAS','PVS','CII','DPM','DCM','HAG','SJS','HBC','DIG','KDH',
];
const TOP_HNX = [
  'SHS','MBS','PVS','NVB','CEO','VCS','PVT','NTL','ACB','BVS',
];
const TOP_UPCOM = [
  'OIL','VEA','BSR','BAB','MCH','MML','ABI','HHV','LTG','AGG',
];

const FALLBACK_SYMBOLS = [
  ...TOP_HOSE.map((s) => ({ symbol: s, exchange: 'HOSE' })),
  ...TOP_HNX.map((s) => ({ symbol: s, exchange: 'HNX' })),
  ...TOP_UPCOM.map((s) => ({ symbol: s, exchange: 'UPCOM' })),
];

/**
 * Fetch ALL stocks from VPS (full market snapshot).
 * Returns array of { symbol, price, open, high, low, volume, pctChange, exchange }
 * Only available during trading hours. Returns [] outside hours.
 */
export async function getAllMarketData() {
  const results = await Promise.allSettled(
    VPS_EXCHANGES.map((ex) =>
      fetch(`${VPS_BASE}/getliststockdata/${ex}`, { next: { revalidate: 30 } })
        .then((r) => r.json())
        .then((rows) =>
          (Array.isArray(rows) ? rows : []).map((s) => ({
            symbol: s.sym ?? s.mc ?? s.code,
            price: s.lastPrice ?? s.c ?? s.mp,
            open: s.ot ?? s.o ?? s.r,           // reference price as open proxy
            high: s.highPrice ?? s.h,
            low: s.lowPrice ?? s.l,
            volume: s.lot ?? s.vol,
            pctChange: s.persent ?? s.changePc,
            netChange: s.change ?? s.changePrice,
            exchange: ex,
          }))
        )
    )
  );

  return results
    .filter((r) => r.status === 'fulfilled')
    .flatMap((r) => r.value)
    .filter((s) => s.symbol && s.price);
}

/**
 * Get latest price for a single symbol via Simplize (works outside trading hours).
 */
export async function getLatestPrice(symbol) {
  const res = await fetch(`${SIMPLIZE_BASE}/${symbol.toUpperCase()}?limit=1`, {
    headers: SIMPLIZE_HEADERS,
    next: { revalidate: 30 },
  });
  if (!res.ok) throw new Error(`Simplize error ${res.status} for ${symbol}`);
  const json = await res.json();
  const q = json?.data;
  if (!q?.priceClose) return null;

  return {
    symbol: symbol.toUpperCase(),
    price: q.priceClose,
    open: q.priceReference ?? q.priceOpen,
    high: q.priceHigh,
    low: q.priceLow,
    volume: q.totalVolume,
    pctChange: q.pctChange,
    netChange: q.netChange,
    ceiling: q.priceCeiling,
    floor: q.priceFloor,
    time: q.timestamp,
  };
}

/**
 * Get latest prices for multiple symbols via Simplize (fallback for off-hours).
 */
export async function getMultiplePrices(symbols) {
  const results = await Promise.allSettled(
    symbols.map((s) => getLatestPrice(s))
  );
  return results
    .filter((r) => r.status === 'fulfilled' && r.value)
    .map((r) => r.value);
}

/**
 * Fetch top ~60 stocks via Simplize when VPS is unavailable.
 * Each symbol is fetched individually and merged with exchange info.
 */
async function getFallbackMarketData() {
  const results = await Promise.allSettled(
    FALLBACK_SYMBOLS.map(async ({ symbol, exchange }) => {
      const data = await getLatestPrice(symbol);
      if (!data) return null;
      return { ...data, exchange };
    })
  );
  return results
    .filter((r) => r.status === 'fulfilled' && r.value)
    .map((r) => r.value);
}

/**
 * Smart fetch: try VPS full market first, fall back to Simplize per-symbol.
 * @param {string[]|null} symbols - if null, returns entire market from VPS (or fallback list)
 */
export async function getMarketPrices(symbols = null) {
  const market = await getAllMarketData();

  // If VPS returned data (trading hours), use it
  if (market.length > 0) {
    if (!symbols) return market;
    const set = new Set(symbols.map((s) => s.toUpperCase()));
    return market.filter((s) => set.has(s.symbol));
  }

  // Outside trading hours — fall back to Simplize
  if (!symbols || symbols.length === 0) {
    // Return the curated top stocks list
    return getFallbackMarketData();
  }
  // Return only the requested symbols
  const withExchange = symbols.map((sym) => {
    const found = FALLBACK_SYMBOLS.find((f) => f.symbol === sym.toUpperCase());
    return { symbol: sym.toUpperCase(), exchange: found?.exchange ?? 'HOSE' };
  });
  const results = await Promise.allSettled(
    withExchange.map(async ({ symbol, exchange }) => {
      const data = await getLatestPrice(symbol);
      if (!data) return null;
      return { ...data, exchange };
    })
  );
  return results
    .filter((r) => r.status === 'fulfilled' && r.value)
    .map((r) => r.value);
}

export async function getOHLC(symbol) {
  const quote = await getLatestPrice(symbol);
  if (!quote) return [];
  return [{
    time: quote.time,
    open: quote.open,
    high: quote.high,
    low: quote.low,
    close: quote.price,
    volume: quote.volume,
  }];
}

/**
 * Fetch historical daily OHLC bars from Vietstock.
 * Returns array of { time, open, high, low, close, volume } sorted oldest→newest.
 * @param {string} symbol
 * @param {number} days - how many calendar days back to fetch (default 365)
 */
export async function getHistory(symbol, days = 365) {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - days);

  const fmt = (d) =>
    `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}/${d.getFullYear()}`;

  const body = new URLSearchParams({
    Code: symbol.toUpperCase(),
    Type: 'D',
    StartDate: fmt(start),
    EndDate: fmt(end),
  });

  const res = await fetch(VIETSTOCK_HISTORY, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
    next: { revalidate: 60 },
  });

  if (!res.ok) throw new Error(`Vietstock error ${res.status} for ${symbol}`);
  const rows = await res.json();
  if (!Array.isArray(rows)) return [];

  return rows
    .map((r) => ({
      // TradingDate is "/Date(ms)/" — extract ms
      time: Math.floor(parseInt(r.TradingDate.replace(/\D/g, ''), 10) / 1000),
      open: r.OpenPrice,
      high: r.HighestPrice,
      low: r.LowestPrice,
      close: r.ClosePrice,
      volume: r.TotalVol,
    }))
    .sort((a, b) => a.time - b.time);
}
