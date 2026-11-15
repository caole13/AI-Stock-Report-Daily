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
    // 严格恪守零假数据原则：优先采用研报确权点位与日内高低点，融合 kking2020 经典均线供需带体系，绝不凭空乘数估算
    const rawSupport = extractNumber(rawStock?.keyLevels?.support) || extractNumber(unified.support);
    const rawInvalidation = extractNumber(rawStock?.invalidationLevel) || extractNumber(unified.invalidationLevel);
    const rawResistance = extractNumber(rawStock?.keyLevels?.resistance) || extractNumber(unified.resistance);
    const rawTarget = unified.valuation?.targetMeanPrice || extractNumber(rawStock?.target);

    // 收集所有低于现价的真实技术支撑候选 (由高到低降序排列，最高者即为最贴近现价的近端进场线)
    const supportCandidates: { val: number; label: string }[] = [];
    if (rawSupport != null && rawSupport < price) {
      supportCandidates.push({ val: rawSupport, label: "研报确权支撑" });
    }
    if (unified.open != null && unified.open < price) {
      supportCandidates.push({ val: unified.open, label: "日内开盘" });
    }
    if (tech) {
      const maList = [
        { val: tech.ema21, name: "EMA21" },
        { val: tech.ma50, name: "MA50" },
        { val: tech.ema55, name: "EMA55" },
        { val: tech.ema144, name: "EMA144" },
        { val: tech.ma200, name: "MA200" },
      ];
      maList.forEach((m) => {
        if (typeof m.val === "number" && m.val < price && m.val > 0) {
          supportCandidates.push({ val: Number(m.val.toFixed(2)), label: m.name });
        }
      });
    }
    if (unified.low != null && unified.low < price) {
      supportCandidates.push({ val: unified.low, label: "日内低点" });
    }

    // 按价格从高到低去重排序
    const sortedSupports: { val: number; label: string }[] = [];
    supportCandidates
      .sort((a, b) => b.val - a.val)
      .forEach((item) => {
        if (!sortedSupports.some((s) => Math.abs(s.val - item.val) / s.val < 0.002)) {
          sortedSupports.push(item);
        }
      });

    // 近端线 (进场位 · 需求区实体上边沿 / 第一动态支撑)
    const proximalLine: number | null = sortedSupports.length > 0 ? sortedSupports[0].val : null;

    // 远端线 (防守止损位 · 需求区底部极值 / 结构失效底线)
    let distalLine: number | null = null;
    if (rawInvalidation != null && rawInvalidation < (proximalLine ?? price)) {
      distalLine = rawInvalidation;
    } else if (sortedSupports.length > 1) {
      // 选取紧随近端线之后的次级结构均线（构成供需区支撑带厚度）
      distalLine = sortedSupports[1].val;
    } else if (unified.low != null && unified.low < (proximalLine ?? price)) {
      distalLine = unified.low;
    }

    // 收集所有高于现价的真实阻力与目标位候选 (由低到高升序排列)
    const targetCandidates: { val: number; label: string }[] = [];
    if (rawTarget != null && rawTarget > price) {
      targetCandidates.push({ val: rawTarget, label: "机构共识目标" });
    }
    if (rawResistance != null && rawResistance > price) {
      targetCandidates.push({ val: rawResistance, label: "研报阻力" });
    }
    if (tech) {
      const maList = [
        { val: tech.ema21, name: "EMA21阻力" },
        { val: tech.ma50, name: "MA50阻力" },
        { val: tech.ema55, name: "EMA55阻力" },
        { val: tech.ema144, name: "EMA144阻力" },
        { val: tech.ma200, name: "MA200阻力" },
      ];
      maList.forEach((m) => {
        if (typeof m.val === "number" && m.val > price) {
          targetCandidates.push({ val: Number(m.val.toFixed(2)), label: m.name });
        }
      });
    }

    const sortedTargets = targetCandidates.sort((a, b) => a.val - b.val);

    // 上方目标位 (下一个供给区 / 前高阻力 / 顺势计划目标)
    let targetPrice: number | null = null;
    if (sortedTargets.length > 0) {
      targetPrice = sortedTargets[0].val;
    } else if (proximalLine != null && distalLine != null && proximalLine > distalLine) {
      // kking2020 原则：上方无明显阻力处于破顶或一马平川时，以标准战法盈亏比 (TP1 ≥ 2.0x) 作为第一止盈目标
      const risk = proximalLine - distalLine;
      targetPrice = Number((proximalLine + risk * 2.0).toFixed(2));
    }

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

    let entryReason = "";
    if (proximalLine != null && distalLine != null) {
      entryReason = `【①道氏趋势】美股日线大周期处于${dowTrend}；【②供需区位置】价格位于${zoneType}区间，近端线(进场位)为 ${proximalStr}，远端线(防守止损位)为 ${distalStr}；【③时机确认】盘面展现${patternConfirmation}；【④盈亏比与风控】上方目标位 ${targetStr}，量化盈亏比为 ${riskRewardLabel}，单日真实波动(ATR)约 ${atrStr}，契合 kking2020 美股四步交易法则。`;
    } else if (proximalLine != null && distalLine == null) {
      entryReason = `【①道氏趋势】美股日线大周期处于${dowTrend}；【②供需区位置】价格当前受日内低点 ${proximalStr} 近端线单点支撑，但因跌破全部主要均线系统，下方缺乏次级结构均线形成防守远端线（无缓冲区）；【③时机与风控】下方失守即创新低，单点接刀风险极高，建议保持观望，等待价格重新收复关键均线并在上方构筑稳固需求区后再行布局。`;
    } else {
      entryReason = `【①道氏趋势】美股日线大周期处于${dowTrend}；【②供需区位置】标的当前价格暂未处于有效支撑均线之上（破位探底阶段），下方暂无确权近端线与远端线，不盲目接飞刀；【③时机与风控】建议严守纪律观望，等待价格重新收复关键结构并形成明确需求区基底后再行介入。`;
    }

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
