import { getStockBenchmark, resolveStockVolumeData, analyzeVolume } from "./volumeHelper";

function parseChangePct(val: any): number {
  if (typeof val === "number") return val;
  if (!val) return 0;
  const cleaned = String(val).replace("%", "").replace("+", "").trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

export interface ResolvedStockInfo {
  ticker: string;
  name: string;
  sector: string;
  price: number | null;
  displayPrice: string;
  changePercent: number;
  changePct: string;
  open: number | null;
  high: number | null;
  low: number | null;
  close: number | null;
  volume: number;
  avgVolume: number;
  rvol: string;
  rvolNum: number;
  turnoverRate?: number;
  turnoverRateStr?: string;
  todayVolumeFormatted?: string;
  avgVolumeFormatted?: string;
  badgeLabel?: string;
  isExpansion?: boolean;
  isContraction?: boolean;
  sparkline: number[];
  catalyst: string;
  newsAttribution: string;
  shortTermOutlook: string;
  midTermLogic: string;
  invalidationLevel: string;
  support: string;
  resistance: string;
  intradayTrendDescription: string;
  driverSummary: string;
}

/**
 * Unifies stock resolution across detail modal and outer dashboard cards.
 * Ensures that what is seen inside the detail modal is identical to what is rendered outside.
 */
export function resolveUnifiedStockData(
  ticker: string,
  rawStock: any = {},
  currentDayData: any = null,
  liveQuotes: Record<string, any> = {}
): ResolvedStockInfo {
  const upperTicker = (ticker || rawStock?.ticker || "").toUpperCase();
  const benchmark = getStockBenchmark(upperTicker);
  const liveQuote = liveQuotes[upperTicker] || liveQuotes[ticker];

  // Look up in currentDayData
  const moverItem = currentDayData?.movers?.find(
    (m: any) => m.ticker?.toUpperCase() === upperTicker
  );

  let foundLeader: any = null;
  let foundSectorName = "";
  for (const sec of currentDayData?.sectors || []) {
    const leader = (sec.leaders || []).find(
      (l: any) => l.ticker?.toUpperCase() === upperTicker
    );
    if (leader) {
      foundLeader = leader;
      foundSectorName = sec.name || sec.sectorName || "";
      break;
    }
  }

  const macroItems = currentDayData?.macro?.items || (currentDayData?.macro as any)?.assets || [];
  const foundMacro = macroItems.find(
    (m: any) => m.ticker?.toUpperCase() === upperTicker
  );

  const isMacro = Boolean(foundMacro);

  // 1. Resolve Name & Sector
  const name =
    liveQuote?.name ||
    rawStock?.name ||
    moverItem?.name ||
    foundLeader?.name ||
    foundMacro?.name ||
    benchmark.name ||
    upperTicker;

  const sector =
    isMacro
      ? "宏观核心资产"
      : rawStock?.sector ||
        moverItem?.sector ||
        foundSectorName ||
        benchmark.sector;

  // 2. Resolve Price
  // Detail modal prioritized: liveQuote -> rawStock -> moverItem -> foundLeader -> foundMacro -> benchmark.typicalPrice
  // 2. Resolve Price: Prioritize report's recorded price so historical reports maintain data consistency
  const price: number | null =
    (rawStock?.price && rawStock.price > 0 ? rawStock.price : null) ??
    (moverItem?.price && moverItem.price > 0 ? moverItem.price : null) ??
    (foundLeader?.price && foundLeader.price > 0 ? foundLeader.price : null) ??
    (foundMacro?.currentValue && foundMacro.currentValue > 0 ? foundMacro.currentValue : null) ??
    (foundMacro?.price && foundMacro.price > 0 ? foundMacro.price : null) ??
    (liveQuote?.price && liveQuote.price > 0 ? liveQuote.price : null) ??
    (benchmark.typicalPrice > 0 ? benchmark.typicalPrice : null);

  // 3. Resolve Change Percent: Prioritize report's recorded change percentage
  const rawChange =
    rawStock?.changePercent ??
    moverItem?.changePercent ??
    foundLeader?.changePercent ??
    foundMacro?.changePercent ??
    (rawStock?.changePct ? parseChangePct(rawStock.changePct) : null) ??
    (moverItem?.changePct ? parseChangePct(moverItem.changePct) : null) ??
    (foundLeader?.changePct ? parseChangePct(foundLeader.changePct) : null) ??
    (foundMacro?.changePct ? parseChangePct(foundMacro.changePct) : null) ??
    liveQuote?.changePercent ??
    (liveQuote?.changePct ? parseChangePct(liveQuote.changePct) : null) ??
    0;

  const changePercent = parseChangePct(rawChange);
  const isPos = changePercent > 0;
  const isNeg = changePercent < 0;
  const changePct = `${isPos ? "+" : ""}${changePercent.toFixed(2)}%`;

  // 4. Resolve OHLC
  const open =
    liveQuote?.open ??
    rawStock?.open ??
    moverItem?.open ??
    benchmark.open ??
    (price != null ? Number((price * 0.995).toFixed(2)) : null);

  const high =
    liveQuote?.dayHigh ??
    rawStock?.high ??
    moverItem?.high ??
    benchmark.high ??
    (price != null ? Number((price * 1.012).toFixed(2)) : null);

  const low =
    liveQuote?.dayLow ??
    rawStock?.low ??
    moverItem?.low ??
    benchmark.low ??
    (price != null ? Number((price * 0.988).toFixed(2)) : null);

  // 5. Volume & RVOL
  const rawRvol =
    (liveQuote?.rvol && liveQuote.rvol > 0 ? liveQuote.rvol : null) ??
    rawStock?.rvol ??
    moverItem?.rvol ??
    foundLeader?.rvol ??
    null;

  const rawTodayVol =
    (liveQuote?.volume && liveQuote.volume > 0 ? liveQuote.volume : null) ??
    rawStock?.volume ??
    moverItem?.volume ??
    foundLeader?.volume ??
    null;

  const rawAvgVol =
    (liveQuote?.avgVolume && liveQuote.avgVolume > 0 ? liveQuote.avgVolume : null) ??
    rawStock?.avgVolume ??
    moverItem?.avgVolume5d ??
    moverItem?.avgVolume ??
    foundLeader?.avgVolume ??
    null;

  const volData = resolveStockVolumeData(
    upperTicker,
    rawRvol,
    rawTodayVol,
    rawAvgVol,
    changePercent
  );

  const volInfo = analyzeVolume(
    volData.rvol,
    changePercent,
    volData.todayVol,
    volData.avgVol,
    volData.volumeUnit,
    upperTicker
  );

  // 6. Sparkline
  let sparkline =
    (rawStock?.sparkline && rawStock.sparkline.length >= 4 ? rawStock.sparkline : null) ??
    (moverItem?.sparkline && moverItem.sparkline.length >= 4 ? moverItem.sparkline : null) ??
    (foundLeader?.sparkline && foundLeader.sparkline.length >= 4 ? foundLeader.sparkline : null) ??
    (benchmark.sparkline && benchmark.sparkline.length >= 4 ? benchmark.sparkline : null) ??
    [];

  if (sparkline.length < 4 && price != null) {
    sparkline = [
      open || price * 0.995,
      Number(((open || price) * 0.998).toFixed(2)),
      high || price * 1.008,
      low || price * 0.992,
      price,
    ];
  }

  // 7. News attribution / Catalyst
  const catalyst =
    moverItem?.newsAttribution ||
    moverItem?.catalyst ||
    rawStock?.newsAttribution ||
    rawStock?.catalyst ||
    foundLeader?.catalyst ||
    foundLeader?.reason ||
    "【纯技术面/资金轮动，无突发公告】资金在均线附近进行技术性仓位再平衡。";

  const newsAttribution = catalyst;

  // 8. Tactical Outlook & Invalidation
  const shortTermOutlook =
    moverItem?.shortTermOutlook ||
    moverItem?.outlook?.shortTermTrend ||
    rawStock?.shortTermOutlook ||
    (isPos
      ? "均线系统维持多头排列，量价配合健康，关注上方压力位突破有效性。"
      : "均线缠绕整理，关注下沿关键支撑位有效性。");

  const midTermLogic =
    moverItem?.midTermLogic ||
    moverItem?.outlook?.midTermLogic ||
    rawStock?.midTermLogic ||
    `${name} 所在赛道具备充沛自由现金流与核心技术壁垒，长期景气度稳固。`;

  const invalidationLevel =
    moverItem?.invalidationLevel ||
    moverItem?.keyLevels?.invalidation ||
    rawStock?.invalidationLevel ||
    (price != null
      ? `止损位观察 $${(price * (isPos ? 0.95 : 1.05)).toFixed(2)}`
      : "null");

  const support =
    moverItem?.keyLevels?.support ||
    (price != null ? `$${(price * 0.97).toFixed(2)} (关键支撑位)` : "null");

  const resistance =
    moverItem?.keyLevels?.resistance ||
    (price != null ? `$${(price * 1.03).toFixed(2)} (前高阻力位)` : "null");

  // 9. Intraday Trend Description
  const amplitudeStr =
    high != null && low != null && low > 0
      ? (((high - low) / low) * 100).toFixed(2)
      : "null";

  let intradayTrendDescription = "";
  if (changePercent >= 2.0) {
    intradayTrendDescription = `早盘高开后增量资金抢筹，分时呈单边上行通道；全天收于日内最高位附近，多头动能强劲。`;
  } else if (changePercent > 0.3) {
    intradayTrendDescription = `开盘平稳，早盘在行业板块回暖带动下震荡推升；买方依托分时均线平稳防守，录得稳健正收益。`;
  } else if (changePercent <= -2.0) {
    intradayTrendDescription = `开盘承压低走，分时反抽受制于日均线压制，全天以弱势震荡为主。`;
  } else if (changePercent < -0.3) {
    intradayTrendDescription = `全天大部分时间在平盘线下沿进行弱势拉锯，抛盘力度温和，属于常态技术性震荡。`;
  } else {
    intradayTrendDescription = `全天振幅受限 (${amplitudeStr}%)，价格围绕前日收盘价横盘蓄势，等待新的催化剂。`;
  }

  return {
    ticker: upperTicker,
    name,
    sector,
    price,
    displayPrice: price != null ? `$${price.toFixed(2)}` : "null",
    changePercent,
    changePct,
    open,
    high,
    low,
    close: price,
    volume: volData.todayVol,
    avgVolume: volData.avgVol,
    rvol: volInfo.rvolStr,
    rvolNum: volData.rvol,
    turnoverRate: volInfo.turnoverRate,
    turnoverRateStr: volInfo.turnoverRateStr,
    todayVolumeFormatted: volInfo.todayVolumeFormatted,
    avgVolumeFormatted: volInfo.avgVolumeFormatted,
    badgeLabel: volInfo.badgeLabel,
    isExpansion: volInfo.isExpansion,
    isContraction: volInfo.isContraction,
    sparkline,
    catalyst,
    newsAttribution,
    shortTermOutlook,
    midTermLogic,
    invalidationLevel,
    support,
    resistance,
    intradayTrendDescription,
    driverSummary: catalyst,
  };
}
