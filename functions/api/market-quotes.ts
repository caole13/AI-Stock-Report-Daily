type PagesFunction = (context: {
  params: Record<string, string | string[]>;
  request: Request;
  env: Record<string, any>;
}) => Promise<Response> | Response;

interface ParsedQuote {
  symbol: string;
  price: number | null;
  change: number | null;
  changePercent: number | null;
  open: number | null;
  dayHigh: number | null;
  dayLow: number | null;
  prevClose: number | null;
  volume: number | null;
  avgVolume?: number | null;
  rvol?: number | null;
  fiftyTwoWeekHigh?: number | null;
  fiftyTwoWeekLow?: number | null;
}

export const onRequestGet: PagesFunction = async (context) => {
  const url = new URL(context.request.url);
  const symbolsParam =
    url.searchParams.get("symbols") ||
    "SPX,IXIC,USO,CL=F,GC=F,TNX,DXY,NVDA,AAPL,MSFT,TSLA,AMZN,GOOGL,META,LLY,UNH,JPM";

  const symbols = symbolsParam
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);

  const quotesMap: Record<string, ParsedQuote> = {};

  const fetchPromises = symbols.map(async (sym) => {
    // Map ticker symbols for Yahoo Finance
    let mapped = sym;
    if (sym === "SPX") mapped = "^GSPC";
    else if (sym === "IXIC") mapped = "^IXIC";
    else if (sym === "TNX") mapped = "^TNX";
    else if (sym === "DXY") mapped = "DX-Y.NYB";

    try {
      const resp = await fetch(
        `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(mapped)}?interval=1d&range=3mo`,
        {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          },
        }
      );

      if (!resp.ok) return;

      const data: any = await resp.json();
      const meta = data?.chart?.result?.[0]?.meta;
      if (!meta) return;

      const quoteObj = data?.chart?.result?.[0]?.indicators?.quote?.[0] || {};
      const rawOpens = quoteObj.open;
      const rawHighs = quoteObj.high;
      const rawLows = quoteObj.low;
      const rawCloses = quoteObj.close;
      const rawVolumes = quoteObj.volume;

      const validCloses = Array.isArray(rawCloses)
        ? rawCloses.filter((v: any) => typeof v === "number" && v > 0)
        : [];
      const currentClose = validCloses.slice(-1)[0] ?? null;
      const truePrevClose = validCloses.length >= 2 ? validCloses.slice(-2)[0] : null;

      const price =
        typeof meta.regularMarketPrice === "number"
          ? Number(meta.regularMarketPrice.toFixed(2))
          : typeof currentClose === "number"
          ? Number(currentClose.toFixed(2))
          : null;

      // Muse calibration: prevClose MUST be true previous trading day's close (倒数第二根日K), NOT 3 months ago chartPreviousClose!
      const prevClose =
        typeof truePrevClose === "number"
          ? Number(truePrevClose.toFixed(2))
          : typeof meta.previousClose === "number"
          ? Number(meta.previousClose.toFixed(2))
          : typeof meta.chartPreviousClose === "number"
          ? Number(meta.chartPreviousClose.toFixed(2))
          : null;

      let change: number | null = null;
      let changePercent: number | null = null;
      if (price != null && prevClose != null && prevClose > 0) {
        change = Number((price - prevClose).toFixed(2));
        changePercent = Number((((price - prevClose) / prevClose) * 100).toFixed(2));
      }

      const lastOpen = Array.isArray(rawOpens)
        ? rawOpens.filter((v: any) => typeof v === "number" && v > 0).slice(-1)[0]
        : null;
      const lastHigh = Array.isArray(rawHighs)
        ? rawHighs.filter((v: any) => typeof v === "number" && v > 0).slice(-1)[0]
        : null;
      const lastLow = Array.isArray(rawLows)
        ? rawLows.filter((v: any) => typeof v === "number" && v > 0).slice(-1)[0]
        : null;
      const lastVol = Array.isArray(rawVolumes)
        ? rawVolumes.filter((v: any) => typeof v === "number" && v > 0).slice(-1)[0]
        : null;

      const open =
        typeof meta.regularMarketDayOpen === "number"
          ? Number(meta.regularMarketDayOpen.toFixed(2))
          : typeof lastOpen === "number"
          ? Number(lastOpen.toFixed(2))
          : null;

      const dayHigh =
        typeof meta.regularMarketDayHigh === "number"
          ? Number(meta.regularMarketDayHigh.toFixed(2))
          : typeof lastHigh === "number"
          ? Number(lastHigh.toFixed(2))
          : null;

      const dayLow =
        typeof meta.regularMarketDayLow === "number"
          ? Number(meta.regularMarketDayLow.toFixed(2))
          : typeof lastLow === "number"
          ? Number(lastLow.toFixed(2))
          : null;

      const volume =
        typeof meta.regularMarketVolume === "number" && meta.regularMarketVolume > 0
          ? meta.regularMarketVolume
          : typeof lastVol === "number"
          ? lastVol
          : null;

      // Extract real historical volume array to compute 3-month daily average volume
      let avgVolume: number | null = null;
      let rvol: number | null = null;
      if (Array.isArray(rawVolumes)) {
        const validVolumes = rawVolumes.filter((v: any) => typeof v === "number" && v > 0);
        if (validVolumes.length > 0) {
          avgVolume = Math.round(
            validVolumes.reduce((acc: number, cur: number) => acc + cur, 0) / validVolumes.length
          );
          if (volume != null && volume > 0 && avgVolume > 0) {
            rvol = Number((volume / avgVolume).toFixed(2));
          }
        }
      }

      const q: ParsedQuote = {
        symbol: sym,
        price,
        change,
        changePercent,
        open,
        dayHigh,
        dayLow,
        prevClose,
        volume,
        avgVolume,
        rvol,
        fiftyTwoWeekHigh:
          typeof meta.fiftyTwoWeekHigh === "number"
            ? Number(meta.fiftyTwoWeekHigh.toFixed(2))
            : null,
        fiftyTwoWeekLow:
          typeof meta.fiftyTwoWeekLow === "number"
            ? Number(meta.fiftyTwoWeekLow.toFixed(2))
            : null,
      };

      quotesMap[sym] = q;
      if (mapped !== sym) {
        quotesMap[mapped] = q;
      }
    } catch {
      // Ignore individual fetch failure
    }
  });

  await Promise.allSettled(fetchPromises);

  return new Response(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      dataSource: "Yahoo Finance Cloudflare Worker Gateway",
      quotes: quotesMap,
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=10, s-maxage=10",
      },
    }
  );
};
