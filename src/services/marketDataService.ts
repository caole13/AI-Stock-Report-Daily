import YahooFinance from 'yahoo-finance2';

// Safely resolve constructor across both ESM (tsx) and bundled CJS environments
const YahooFinanceClass: any =
  typeof YahooFinance === 'function'
    ? YahooFinance
    : (typeof (YahooFinance as any)?.default === 'function'
        ? (YahooFinance as any).default
        : YahooFinance);

// Suppress survey notices
const yf: any =
  typeof YahooFinanceClass === 'function'
    ? new YahooFinanceClass({ suppressNotices: ['yahooSurvey'] })
    : YahooFinanceClass;

// Symbol aliases for standard market tickers
export const SYMBOL_MAP: Record<string, string> = {
  DXY: 'DX-Y.NYB',
  'DX-Y': 'DX-Y.NYB',
  SPX: '^GSPC',
  'S&P500': '^GSPC',
  IXIC: '^IXIC',
  NASDAQ: '^IXIC',
  TNX: '^TNX',
  '10Y': '^TNX',
  GOLD: 'GC=F',
  WTI: 'CL=F',
  OIL: 'CL=F',
  CRUDE: 'CL=F',
  BTC: 'BTC-USD',
};

export interface MarketQuote {
  symbol: string;
  mappedSymbol: string;
  name: string;
  price: number | null;
  change: number | null;
  changePercent: number | null;
  changePctFormatted: string | null;
  prevClose: number | null;
  open: number | null;
  dayHigh: number | null;
  dayLow: number | null;
  volume: number | null;
  avgVolume: number | null;
  rvol: number | null;
  fiftyTwoWeekHigh: number | null;
  fiftyTwoWeekLow: number | null;
  fiftyDayAverage?: number | null;
  twoHundredDayAverage?: number | null;
  marketCap?: number;
  marketTime?: Date | string;
  marketState?: string;
  currency?: string;
  trailingPE?: number | null;
  forwardPE?: number | null;
  priceToBook?: number | null;
  pegRatio?: number | null;
  targetMeanPrice?: number | null;
  earningsDate?: string | null;
  epsTrailingTwelveMonths?: number | null;
}

// In-memory cache to avoid rate limits
interface CacheEntry {
  timestamp: number;
  data: MarketQuote;
}

const quoteCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 60 * 1000; // 60 seconds cache

export function resolveSymbol(symbol: string): string {
  const clean = symbol.trim().toUpperCase();
  return SYMBOL_MAP[clean] || clean;
}

/**
 * 校验清洗原生 Yahoo 行情成交量数据，严格禁止任何乘数放大或人工估算
 */
function calibrateVolumeData(symbol: string, mapped: string, rawVolume?: number | null, rawAvgVolume?: number | null, changePercent?: number | null) {
  const volume: number | null = rawVolume && rawVolume > 0 ? rawVolume : null;
  const avgVolume: number | null = rawAvgVolume && rawAvgVolume > 0 ? rawAvgVolume : null;

  const rvol = (volume && avgVolume && avgVolume > 0 && volume > 0)
    ? Number((volume / avgVolume).toFixed(2))
    : null;

  return { volume, avgVolume, rvol };
}

export async function getQuote(symbol: string, forceRefresh = false): Promise<MarketQuote | null> {
  const mapped = resolveSymbol(symbol);
  const now = Date.now();

  if (!forceRefresh) {
    const cached = quoteCache.get(mapped);
    if (cached && now - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }
  }

  try {
    const raw: any = await yf.quote(mapped);
    if (!raw) return null;

    const rawPrice = raw.regularMarketPrice ?? raw.postMarketPrice;
    const price: number | null = rawPrice != null && rawPrice > 0 ? Number(rawPrice.toFixed(rawPrice < 10 ? 3 : 2)) : null;
    const change: number | null = raw.regularMarketChange != null ? Number(raw.regularMarketChange.toFixed(2)) : null;
    const changePercent: number | null = raw.regularMarketChangePercent != null ? Number(raw.regularMarketChangePercent.toFixed(2)) : null;
    const changePctFormatted: string | null = changePercent != null ? `${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%` : null;
    const rawVolume = raw.regularMarketVolume && raw.regularMarketVolume > 0 ? raw.regularMarketVolume : null;
    const rawAvgVolume = (raw.averageDailyVolume3Month && raw.averageDailyVolume3Month > 0)
      ? raw.averageDailyVolume3Month
      : ((raw.averageDailyVolume10Day && raw.averageDailyVolume10Day > 0) ? raw.averageDailyVolume10Day : null);
    const { volume, avgVolume, rvol } = calibrateVolumeData(symbol, mapped, rawVolume, rawAvgVolume, changePercent);

    const quote: MarketQuote = {
      symbol,
      mappedSymbol: mapped,
      name: raw.shortName || raw.longName || symbol,
      price,
      change,
      changePercent,
      changePctFormatted,
      prevClose: raw.regularMarketPreviousClose != null
        ? Number(raw.regularMarketPreviousClose.toFixed(2))
        : (price != null && change != null ? Number((price - change).toFixed(2)) : null),
      open: raw.regularMarketOpen != null ? Number(raw.regularMarketOpen.toFixed(2)) : null,
      dayHigh: raw.regularMarketDayHigh != null ? Number(raw.regularMarketDayHigh.toFixed(2)) : null,
      dayLow: raw.regularMarketDayLow != null ? Number(raw.regularMarketDayLow.toFixed(2)) : null,
      volume,
      avgVolume,
      rvol,
      fiftyTwoWeekHigh: raw.fiftyTwoWeekHigh != null ? Number(raw.fiftyTwoWeekHigh.toFixed(2)) : null,
      fiftyTwoWeekLow: raw.fiftyTwoWeekLow != null ? Number(raw.fiftyTwoWeekLow.toFixed(2)) : null,
      fiftyDayAverage: raw.fiftyDayAverage != null ? Number(raw.fiftyDayAverage.toFixed(2)) : null,
      twoHundredDayAverage: raw.twoHundredDayAverage != null ? Number(raw.twoHundredDayAverage.toFixed(2)) : null,
      marketCap: raw.marketCap,
      marketTime: raw.regularMarketTime,
      marketState: raw.marketState,
      currency: raw.currency || 'USD',
      trailingPE: raw.trailingPE != null ? Number(raw.trailingPE.toFixed(2)) : null,
      forwardPE: raw.forwardPE != null ? Number(raw.forwardPE.toFixed(2)) : null,
      priceToBook: raw.priceToBook != null ? Number(raw.priceToBook.toFixed(2)) : null,
      pegRatio: raw.pegRatio != null ? Number(raw.pegRatio.toFixed(2)) : null,
      targetMeanPrice: raw.targetMeanPrice != null ? Number(raw.targetMeanPrice.toFixed(2)) : null,
      earningsDate: raw.earningsTimestamp != null
        ? new Date(raw.earningsTimestamp * 1000).toISOString().split('T')[0]
        : (raw.earningsTimestampStart != null
            ? new Date(raw.earningsTimestampStart * 1000).toISOString().split('T')[0]
            : null),
      epsTrailingTwelveMonths: raw.epsTrailingTwelveMonths != null ? Number(raw.epsTrailingTwelveMonths.toFixed(2)) : null,
    };

    quoteCache.set(mapped, { timestamp: now, data: quote });
    return quote;
  } catch (error) {
    console.warn(`[marketDataService] Failed to fetch quote for ${symbol} (${mapped}):`, error);
    // Return stale cache if available
    const stale = quoteCache.get(mapped);
    if (stale) return stale.data;
    return null;
  }
}

export async function getQuotes(symbols: string[], forceRefresh = false): Promise<Record<string, MarketQuote>> {
  const result: Record<string, MarketQuote> = {};
  const needed: string[] = [];

  const now = Date.now();
  for (const s of symbols) {
    const mapped = resolveSymbol(s);
    const cached = quoteCache.get(mapped);
    if (!forceRefresh && cached && now - cached.timestamp < CACHE_TTL_MS) {
      result[s] = cached.data;
    } else {
      needed.push(s);
    }
  }

  if (needed.length === 0) return result;

  try {
    const mappedList = Array.from(new Set(needed.map(resolveSymbol)));
    const rawList: any[] = await yf.quote(mappedList);

    const lookupByMapped = new Map<string, any>();
    for (const r of rawList) {
      if (r && r.symbol) lookupByMapped.set(r.symbol.toUpperCase(), r);
    }

    for (const s of needed) {
      const mapped = resolveSymbol(s);
      const raw = lookupByMapped.get(mapped.toUpperCase());
      if (raw) {
        const rawPrice = raw.regularMarketPrice ?? raw.postMarketPrice;
        const price: number | null = rawPrice != null && rawPrice > 0 ? Number(rawPrice.toFixed(rawPrice < 10 ? 3 : 2)) : null;
        const change: number | null = raw.regularMarketChange != null ? Number(raw.regularMarketChange.toFixed(2)) : null;
        const changePercent: number | null = raw.regularMarketChangePercent != null ? Number(raw.regularMarketChangePercent.toFixed(2)) : null;
        const changePctFormatted: string | null = changePercent != null ? `${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%` : null;
        const rawVolume = raw.regularMarketVolume && raw.regularMarketVolume > 0 ? raw.regularMarketVolume : null;
        const rawAvgVolume = (raw.averageDailyVolume3Month && raw.averageDailyVolume3Month > 0)
          ? raw.averageDailyVolume3Month
          : ((raw.averageDailyVolume10Day && raw.averageDailyVolume10Day > 0) ? raw.averageDailyVolume10Day : null);
        const { volume, avgVolume, rvol } = calibrateVolumeData(s, mapped, rawVolume, rawAvgVolume, changePercent);

        const quote: MarketQuote = {
          symbol: s,
          mappedSymbol: mapped,
          name: raw.shortName || raw.longName || s,
          price,
          change,
          changePercent,
          changePctFormatted,
          prevClose: raw.regularMarketPreviousClose != null
            ? Number(raw.regularMarketPreviousClose.toFixed(2))
            : (price != null && change != null ? Number((price - change).toFixed(2)) : null),
          open: raw.regularMarketOpen != null ? Number(raw.regularMarketOpen.toFixed(2)) : null,
          dayHigh: raw.regularMarketDayHigh != null ? Number(raw.regularMarketDayHigh.toFixed(2)) : null,
          dayLow: raw.regularMarketDayLow != null ? Number(raw.regularMarketDayLow.toFixed(2)) : null,
          volume,
          avgVolume,
          rvol,
          fiftyTwoWeekHigh: raw.fiftyTwoWeekHigh != null ? Number(raw.fiftyTwoWeekHigh.toFixed(2)) : null,
          fiftyTwoWeekLow: raw.fiftyTwoWeekLow != null ? Number(raw.fiftyTwoWeekLow.toFixed(2)) : null,
          fiftyDayAverage: raw.fiftyDayAverage != null ? Number(raw.fiftyDayAverage.toFixed(2)) : null,
          twoHundredDayAverage: raw.twoHundredDayAverage != null ? Number(raw.twoHundredDayAverage.toFixed(2)) : null,
          marketCap: raw.marketCap,
          marketTime: raw.regularMarketTime,
          marketState: raw.marketState,
          currency: raw.currency || 'USD',
          trailingPE: raw.trailingPE != null ? Number(raw.trailingPE.toFixed(2)) : null,
          forwardPE: raw.forwardPE != null ? Number(raw.forwardPE.toFixed(2)) : null,
          priceToBook: raw.priceToBook != null ? Number(raw.priceToBook.toFixed(2)) : null,
          pegRatio: raw.pegRatio != null ? Number(raw.pegRatio.toFixed(2)) : null,
          targetMeanPrice: raw.targetMeanPrice != null ? Number(raw.targetMeanPrice.toFixed(2)) : null,
          earningsDate: raw.earningsTimestamp != null
            ? new Date(raw.earningsTimestamp * 1000).toISOString().split('T')[0]
            : (raw.earningsTimestampStart != null
                ? new Date(raw.earningsTimestampStart * 1000).toISOString().split('T')[0]
                : null),
          epsTrailingTwelveMonths: raw.epsTrailingTwelveMonths != null ? Number(raw.epsTrailingTwelveMonths.toFixed(2)) : null,
        };

        quoteCache.set(mapped, { timestamp: now, data: quote });
        result[s] = quote;
      }
    }
  } catch (err) {
    console.error('[marketDataService] Batch quote fetch failed, falling back to individual:', err);
    // Fallback one by one
    await Promise.all(
      needed.map(async (s) => {
        const q = await getQuote(s, forceRefresh);
        if (q) result[s] = q;
      })
    );
  }

  return result;
}

export async function getSparkline(symbol: string, days = 10): Promise<number[]> {
  const mapped = resolveSymbol(symbol);
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (days * 2 + 5));
    const period1 = startDate.toISOString().split('T')[0];

    const chart = await yf.chart(mapped, { period1, interval: '1d' });
    if (chart && chart.quotes && chart.quotes.length > 0) {
      const validCloses = chart.quotes
        .map((q) => q.close)
        .filter((c): c is number => typeof c === 'number' && !isNaN(c));
      const recent = validCloses.slice(-days);
      if (recent.length >= 3) {
        return recent.map((n) => Number(n.toFixed(2)));
      }
    }
  } catch (err) {
    console.warn(`[marketDataService] Sparkline chart fetch failed for ${symbol}:`, err);
  }
  return [];
}

/**
 * Resolve ticker from search query (supports ticker or company name search)
 */
export async function searchTicker(query: string): Promise<string> {
  const clean = query.trim().toUpperCase();
  if (!clean) return "";
  if (SYMBOL_MAP[clean]) return SYMBOL_MAP[clean];

  // Try direct quote first
  try {
    const directQuote = await getQuote(clean);
    if (directQuote && directQuote.price && directQuote.price > 0) {
      return directQuote.symbol || clean;
    }
  } catch {}

  // Try search
  try {
    const searchRes: any = await yf.search(query.trim());
    if (searchRes && searchRes.quotes && searchRes.quotes.length > 0) {
      const topQuote = searchRes.quotes.find(
        (q: any) => (q.quoteType === 'EQUITY' || q.isYahooFinance) && q.symbol
      ) || searchRes.quotes[0];
      if (topQuote && topQuote.symbol) {
        return topQuote.symbol.toUpperCase();
      }
    }
  } catch (err) {
    console.warn('[marketDataService] searchTicker error:', err);
  }

  return clean;
}
