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
        `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(mapped)}?interval=1d&range=5d`,
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

      const price =
        typeof meta.regularMarketPrice === "number" ? Number(meta.regularMarketPrice.toFixed(2)) : null;
      const prevClose =
        typeof meta.chartPreviousClose === "number"
          ? Number(meta.chartPreviousClose.toFixed(2))
          : typeof meta.previousClose === "number"
          ? Number(meta.previousClose.toFixed(2))
          : null;

      let change: number | null = null;
      let changePercent: number | null = null;
      if (price != null && prevClose != null && prevClose > 0) {
        change = Number((price - prevClose).toFixed(2));
        changePercent = Number((((price - prevClose) / prevClose) * 100).toFixed(2));
      }

      const open =
        typeof meta.regularMarketDayOpen === "number"
          ? Number(meta.regularMarketDayOpen.toFixed(2))
          : null;
      const dayHigh =
        typeof meta.regularMarketDayHigh === "number"
          ? Number(meta.regularMarketDayHigh.toFixed(2))
          : null;
      const dayLow =
        typeof meta.regularMarketDayLow === "number"
          ? Number(meta.regularMarketDayLow.toFixed(2))
          : null;
      const volume =
        typeof meta.regularMarketVolume === "number" ? meta.regularMarketVolume : null;

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
        "Cache-Control": "public, max-age=60, s-maxage=60",
      },
    }
  );
};
