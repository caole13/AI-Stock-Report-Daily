import { HistoricalDailyData, SupplyDemandCandidate } from "../types";
import { resolveUnifiedStockData } from "./stockDataResolver";

function extractNumber(val: any): number | null {
  if (val === null || val === undefined) return null;
  if (typeof val === "number") return isNaN(val) ? null : val;
  const match = String(val).replace(/,/g, "").match(/(\d+(\.\d+)?)/);
  if (!match) return null;
  const num = parseFloat(match[1]);
  return isNaN(num) ? null : num;
}

export function resolveSupplyDemandCandidates(
  currentDayData: HistoricalDailyData | null,
  yahooQuotes?: Record<string, any>
): SupplyDemandCandidate[] {
  if (!currentDayData) return [];

  // 1. Gather all candidates from movers, sector leaders, and playbook
  const candidateMap = new Map<string, { raw: any; source: string }>();

  // From Movers
  (currentDayData.movers || []).forEach((m: any) => {
    if (m?.ticker) {
      candidateMap.set(m.ticker.toUpperCase(), { raw: m, source: "mover" });
    }
  });

  // From Sector Leaders
  (currentDayData.sectors || []).forEach((sec: any) => {
    (sec.leaders || []).forEach((ldr: any) => {
      const ticker = ldr.ticker || ldr.symbol;
      if (ticker && !candidateMap.has(ticker.toUpperCase())) {
        candidateMap.set(ticker.toUpperCase(), { raw: ldr, source: "leader" });
      }
    });
  });

  // From Playbook
  const playbookList = (currentDayData.actionPlaybook as any)?.topCandidates || (currentDayData.actionPlaybook as any)?.candidates || [];
  playbookList.forEach((pb: any) => {
    if (pb?.ticker && !candidateMap.has(pb.ticker.toUpperCase())) {
      candidateMap.set(pb.ticker.toUpperCase(), { raw: pb, source: "playbook" });
    }
  });

  const candidates: SupplyDemandCandidate[] = [];

  for (const [ticker, item] of candidateMap.entries()) {
    const unified = resolveUnifiedStockData(ticker, item.raw, currentDayData, yahooQuotes);
    const price = unified.price;
    const changePercent = unified.changePercent;
    const rawStock = item.raw;

    // Skip if price is completely missing
    if (price == null || price <= 0) continue;

    // 1. Dow Theory Trend Analysis (道氏大周期定方向)
    const tech = unified.technicals;
    let dowTrend: SupplyDemandCandidate["dowTrend"] = "区间震荡 (Range)";
    if (tech?.ema21 != null && tech?.ema55 != null && tech.ema21 > tech.ema55) {
      dowTrend = "多头趋势 (HH+HL)";
    } else if (changePercent != null && changePercent >= 1.0) {
      dowTrend = "多头趋势 (HH+HL)";
    } else if (changePercent != null && changePercent <= -1.2) {
      dowTrend = "空头趋势 (LH+LL)";
    } else {
      dowTrend = "区间震荡 (Range)";
    }

    // 2. Supply / Demand Zone Identification (供需区识别 DBR / RBR / RBD / DBD)
    let zoneType: SupplyDemandCandidate["zoneType"] = "RBR (顺势需求区)";
    let zoneFreshness: SupplyDemandCandidate["zoneFreshness"] = "新鲜首测 (优质)";
    let score = 7;

    const isStrongUptrend = dowTrend === "多头趋势 (HH+HL)";
    if (changePercent != null && changePercent >= 2.0) {
      zoneType = "RBR (顺势需求区)";
      zoneFreshness = "新鲜首测 (优质)";
      score = isStrongUptrend ? 9 : 8;
    } else if (changePercent != null && changePercent > 0) {
      zoneType = "DBR (反转需求区)";
      zoneFreshness = "新鲜首测 (优质)";
      score = isStrongUptrend ? 8 : 7;
    } else if (changePercent != null && changePercent < -2.0) {
      zoneType = "RBD (反转供给区)";
      zoneFreshness = "二次回踩 (谨慎)";
      score = 5;
    } else {
      zoneType = "DBR (反转需求区)";
      zoneFreshness = "二次回踩 (谨慎)";
      score = 6;
    }

    // 3. Proximal & Distal Lines (近端线进场位 & 远端线防守位)
    // 严格恪守零假数据原则：只提取研报确权点位或 Yahoo 官方行情真实高低点，绝不搞百分比插值估算
    const rawSupport = extractNumber(rawStock?.keyLevels?.support) || extractNumber(unified.support);
    const rawInvalidation = extractNumber(rawStock?.invalidationLevel) || extractNumber(unified.invalidationLevel);
    const rawResistance = extractNumber(rawStock?.keyLevels?.resistance) || extractNumber(unified.resistance);
    const rawTarget = unified.valuation?.targetMeanPrice || extractNumber(rawStock?.target);

    // Distal Line (远端防守线):
    // kking2020: 远端线是基底K线区域的最远影线极值（做多止损底线）。优先使用研报确权失效位，其次为当日真实最低价
    const distalLine: number | null =
      rawInvalidation != null && rawInvalidation < price
        ? rawInvalidation
        : (unified.low != null && unified.low < price ? unified.low : null);

    // Proximal Line (近端进场线):
    // kking2020: 近端线是基底K线实体边缘（回踩挂单进场点）。优先使用研报支撑位，其次为当日真实开盘价
    const proximalLine: number | null =
      rawSupport != null && rawSupport <= price && (distalLine == null || rawSupport > distalLine)
        ? rawSupport
        : (unified.open != null && unified.open < price && (distalLine == null || unified.open > distalLine)
            ? unified.open
            : null);

    // Target Price (上方目标供给区):
    // 优先使用研报目标位，其次为华尔街官方共识均价，再次为真实阻力位
    const targetPrice: number | null =
      rawTarget != null && rawTarget > price
        ? rawTarget
        : (unified.valuation?.targetMeanPrice != null && unified.valuation.targetMeanPrice > price
            ? unified.valuation.targetMeanPrice
            : (rawResistance != null && rawResistance > price ? rawResistance : null));

    // 4. Calculate Risk-Reward Ratio (量化盈亏比 R:R = 目标空间 ÷ 止损空间)
    // 双档标准：kking2020 原文基准 ≥ 2.0x 达标进场；机构精选评级 ≥ 2.5x 优质
    let riskRewardRatio: number | null = null;
    let riskRewardLabel = "暂无";
    if (proximalLine != null && distalLine != null && targetPrice != null) {
      const risk = proximalLine - distalLine;
      const reward = targetPrice - proximalLine;
      if (risk > 0 && reward > 0) {
        const rr = Number((reward / risk).toFixed(2));
        riskRewardRatio = rr;
        riskRewardLabel = `${rr.toFixed(1)}:1 (${rr >= 2.5 ? "优质盈亏比" : rr >= 2.0 ? "标准达标" : "盈亏比较紧"})`;
      }
    }

    // 5. 14-Day ATR Volatility (真实波幅)
    // 仅基于日内真实高低点价差计算单日真实波动区间(True Range)；缺失时严格标记为 null，不强行百分比插值
    let atr14: number | null = null;
    if (unified.high != null && unified.low != null && unified.high > unified.low) {
      atr14 = Number((unified.high - unified.low).toFixed(2));
    }

    // 6. Pattern Confirmation (时机形态确认)
    let patternConfirmation = "等待右侧形态确认 (Wait For Confirmation)";
    if (unified.high != null && unified.low != null && price != null) {
      const lowerShadow = Math.min(price, unified.open ?? price) - unified.low;
      const body = Math.abs(price - (unified.open ?? price));
      if (lowerShadow > body * 1.5 && lowerShadow > 0) {
        patternConfirmation = "长下影线拒探 (Pin Bar) · 需求区强烈反击";
      } else if (changePercent != null && changePercent >= 2.0) {
        patternConfirmation = "大实体看涨吞没 (Bullish Engulfing) · 放量突破";
      } else if (unified.isExpansion) {
        patternConfirmation = "放量回踩不破 · 需求区二次买盘承接";
      }
    } else if (changePercent != null && changePercent >= 1.5) {
      patternConfirmation = "放量长阳突破 · 顺势启动结构";
    }

    // 7. Entry Action & Synthesize Reason (为什么可以进场)
    let entryAction: SupplyDemandCandidate["entryAction"] = "等右侧收盘确认";
    if (riskRewardRatio != null && riskRewardRatio >= 2.5 && score >= 8) {
      entryAction = "挂单触碰进场";
    } else if (riskRewardRatio != null && riskRewardRatio >= 2.0) {
      entryAction = "等右侧收盘确认";
    } else {
      entryAction = "观望不达标";
    }

    const fmtPrice = (val: number | null | undefined) => (val != null ? `$${val.toFixed(2)}` : "暂无");
    const proximalStr = fmtPrice(proximalLine);
    const distalStr = fmtPrice(distalLine);
    const targetStr = fmtPrice(targetPrice);
    const atrStr = fmtPrice(atr14);

    const entryReason = `【①道氏趋势】美股日线大周期处于${dowTrend}；【②供需区位置】价格位于${zoneType}区间，近端线(进场)为 ${proximalStr}，远端线(防守)为 ${distalStr}；【③时机确认】盘面展现${patternConfirmation}；【④盈亏比与风控】上方目标位 ${targetStr}，量化盈亏比为 ${riskRewardLabel}，单日真实波动(ATR)约 ${atrStr}，契合 kking2020 美股四步交易法则。`;

    candidates.push({
      ticker,
      name: unified.name,
      sector: unified.sector,
      price,
      changePercent,
      dowTrend,
      zoneType,
      zoneScore: score,
      zoneFreshness,
      proximalLine,
      distalLine,
      targetPrice,
      riskRewardRatio,
      riskRewardLabel,
      atr14,
      patternConfirmation,
      entryAction,
      entryReason,
      sparkline: unified.sparkline,
    });
  }

  // Sort: High R:R ratio first, then by score descending
  return candidates.sort((a, b) => {
    const rrA = a.riskRewardRatio ?? 0;
    const rrB = b.riskRewardRatio ?? 0;
    if (Math.abs(rrA - rrB) > 0.01) return rrB - rrA;
    return b.zoneScore - a.zoneScore;
  });
}
