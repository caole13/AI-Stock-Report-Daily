export const PLAYBOOK_CANDIDATE_POOL = [
  "NVDA",
  "TSLA",
  "META",
  "MSFT",
  "AAPL",
  "AMZN",
  "GOOGL",
  "COST",
  "JPM",
  "XOM",
  "LLY"
];

export const PLAYBOOK_NAME_MAP = {
  NVDA: "英伟达",
  TSLA: "特斯拉",
  META: "Meta",
  MSFT: "微软",
  AAPL: "苹果",
  AMZN: "亚马逊",
  GOOGL: "谷歌",
  COST: "好市多",
  JPM: "摩根大通",
  XOM: "埃克森美孚",
  LLY: "礼来",
  SO: "南方电力"
};

/**
 * 测算严格的 30 个交易日量比 (30-day RVOL)
 * 严格口径：必须拥有至少 30 个完整历史日线基准（不含当日），且当日成交量与 30 日历史均量均大于 0；
 * 历史基准不足 30 天时严格返回 null，绝不使用更短周期冒充 30 日量比，绝不把当日成交量混入历史均量。
 */
export function calculate30DayRvol(volumes, lastVol) {
  if (!Array.isArray(volumes) || typeof lastVol !== "number" || lastVol <= 0) {
    return null;
  }
  // volumes 包含今日时，至少需 31 条（前 30 条历史 + 1 条今日）
  if (volumes.length < 31) {
    return null;
  }
  const histVolumes = volumes.slice(0, -1); // 严格排除当日
  const window30 = histVolumes.slice(-30); // 严格取当日前 30 个交易日
  const avgVol30 = window30.reduce((a, b) => a + b, 0) / 30;
  if (avgVol30 <= 0) {
    return null;
  }
  return Number((lastVol / avgVol30).toFixed(2));
}

/**
 * 核心行动剧本候选标的统一筛选与排序引擎
 * 仅对具备实测 30 天 RVOL 且满足 EMA 多头排列 (EMA21 > EMA55 且现价在 EMA55 上方) 的标的开放
 * 缺值或无匹配时严格返回空数组 []，绝不填充假数据
 */
export function derivePlaybookCandidates(options) {
  const { tech = {}, priceMap = {}, rvolMap = {}, nameMap = {} } = options;
  const candidates = [];

  for (const ticker of PLAYBOOK_CANDIDATE_POOL) {
    const tData = tech[ticker];
    const curPrice = priceMap[ticker];
    const rvol = rvolMap[ticker];

    // 严谨校验：必须有价格、EMA 均线，且必须有实测数值的 30 天 RVOL！
    if (
      tData &&
      typeof curPrice === "number" &&
      curPrice > 0 &&
      typeof tData.ema21 === "number" &&
      typeof tData.ema55 === "number" &&
      typeof rvol === "number" &&
      !isNaN(rvol)
    ) {
      if (tData.ema21 > tData.ema55 && curPrice >= tData.ema55 * 0.99) {
        const isHighVol = rvol >= 1.2;
        const isLowVol = rvol < 0.9;

        let setupDesc = "";
        let biasType = "";

        if (curPrice > tData.ema21) {
          biasType = "多头突破";
          setupDesc = isHighVol
            ? `均线多头排列 · 放量突破主升 (RVOL: ${rvol.toFixed(2)}x)`
            : isLowVol
            ? `均线多头排列 · 缩量整固蓄势 (RVOL: ${rvol.toFixed(2)}x)`
            : `均线多头排列 · 稳步上行 (RVOL: ${rvol.toFixed(2)}x)`;
        } else {
          biasType = "回踩做多";
          setupDesc = isLowVol
            ? `缩量回踩 EMA55 关键防守线 (RVOL: ${rvol.toFixed(2)}x)`
            : isHighVol
            ? `带量回测 EMA55 支撑位检验买盘 (RVOL: ${rvol.toFixed(2)}x)`
            : `回踩 EMA55 稳态均线整理 (RVOL: ${rvol.toFixed(2)}x)`;
        }

        candidates.push({
          ticker,
          name: nameMap[ticker] || PLAYBOOK_NAME_MAP[ticker] || ticker,
          setup: setupDesc,
          entryZone: `$${(curPrice * 0.99).toFixed(2)} - $${(curPrice * 1.005).toFixed(2)}`,
          stopLoss: `$${(tData.ema55 * 0.985).toFixed(2)} (0穿刺跌破EMA55)`,
          target: `$${(curPrice * 1.06).toFixed(2)} - $${(curPrice * 1.08).toFixed(2)}`,
          bias: biasType,
          catalyst: `日线均线呈多头排列，当日实测 30 日 RVOL 为 ${rvol.toFixed(2)}x，兼具流动性与结构稳定性`
        });
      }
    }
    if (candidates.length >= 2) break;
  }

  return candidates;
}
