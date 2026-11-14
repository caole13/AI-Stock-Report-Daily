import { HistoricalDailyData, DailyActionPlaybook, ActionPlaybookCandidate } from "../types";
import { derivePlaybookCandidates } from "./playbookEngine.js";

/**
 * 获取或自适应生成每日交易行动剧本 (Daily Action Playbook)
 * 优先读取归档 JSON 中的 actionPlaybook，如未包含则结合当日真实均线与宏观水温动态生成
 */
export function resolveActionPlaybook(data: HistoricalDailyData | null | undefined): DailyActionPlaybook | null {
  if (!data) return null;

  if (data.actionPlaybook && data.actionPlaybook.marketRegime && Array.isArray(data.actionPlaybook.topCandidates)) {
    return data.actionPlaybook;
  }

  const tone = data.marketTone || "防御性震荡";
  const tech = data.technicalIndicators || {};
  const macro: any = data.macro || {};
  const assets: any[] = macro.items || macro.assets || [];

  // 构建个股现价与真实 RVOL 映射表
  const priceMap: Record<string, number> = {};
  const rvolMap: Record<string, number> = {};
  const nameMap: Record<string, string> = {};

  // 1. 从 technicalIndicators 中提取实测量比
  Object.entries(tech).forEach(([ticker, tData]: [string, any]) => {
    if (tData && tData.rvol !== undefined && tData.rvol !== null) {
      const parsed = typeof tData.rvol === "number" ? tData.rvol : parseFloat(String(tData.rvol));
      if (!isNaN(parsed)) rvolMap[ticker] = parsed;
    }
  });

  // 2. 从 sectors leaders 中提取现价与实测量比
  (data.sectors || []).forEach((sec) => {
    (sec.leaders || []).forEach((l) => {
      if (l.ticker && typeof l.price === "number") {
        priceMap[l.ticker] = l.price;
      }
      if (l.ticker && l.name) {
        nameMap[l.ticker] = l.name;
      }
      if (l.ticker && l.rvol !== undefined && l.rvol !== null) {
        const parsed = typeof l.rvol === "number" ? l.rvol : parseFloat(String(l.rvol));
        if (!isNaN(parsed)) rvolMap[l.ticker] = parsed;
      }
    });
  });

  // 3. 从 movers 中提取现价与实测量比
  (data.movers || []).forEach((m) => {
    if (m.ticker && typeof m.price === "number") {
      priceMap[m.ticker] = m.price;
    }
    if (m.ticker && m.name) {
      nameMap[m.ticker] = m.name;
    }
    if (m.ticker && m.rvol !== undefined && m.rvol !== null) {
      const parsed = typeof m.rvol === "number" ? m.rvol : parseFloat(String(m.rvol));
      if (!isNaN(parsed)) rvolMap[m.ticker] = parsed;
    }
  });

  // 获取标普和纳指点位
  const spxItem = assets.find((a: any) => a.ticker === "^GSPC" || a.ticker === "SPX");
  const qqqItem = assets.find((a: any) => a.ticker === "QQQ" || a.ticker === "^IXIC");
  const spxPrice = typeof spxItem?.currentValue === "number" ? spxItem.currentValue : (typeof spxItem?.price === "number" ? spxItem.price : 5870);
  const qqqPrice = typeof qqqItem?.currentValue === "number" ? qqqItem.currentValue : (typeof qqqItem?.price === "number" ? qqqItem.price : 495);

  const spxTech = tech["SPX"] || tech["^GSPC"] || tech["SPY"] || {};
  const qqqTech = tech["QQQ"] || tech["^IXIC"] || {};

  // 1. 市场环境与仓位比例
  let regime = "防御性震荡 (Selective Defense)";
  let longPct = 60;
  let hedgePct = 40;
  let allocNote = "以高现金流必选消费、能源及大金融防守为主，控仓观望科技高估值品种。";

  if (tone === "偏多") {
    regime = "顺势进攻 (Risk-On Growth)";
    longPct = 80;
    hedgePct = 20;
    allocNote = "主线聚焦半导体与科技成长龙头，底仓依托 EMA21 颈线顺势推保护。";
  } else if (tone === "偏空") {
    regime = "收缩防守 (Risk-Off Preservation)";
    longPct = 35;
    hedgePct = 65;
    allocNote = "提升现金比重与做空对冲工具，严禁左侧盲目接飞刀。";
  } else {
    regime = "分化震荡 · 结构性博弈 (Range-Bound Selective)";
    longPct = 55;
    hedgePct = 45;
    allocNote = "轻指数重个股，仓位控制在 5~6 成，重点捕捉均线多头排列且缩量回踩的关键支撑标的。";
  }

  // 2. 关键防守点位
  const spxSupportVal = spxTech.ema21 ? spxTech.ema21 : Math.round(spxPrice * 0.985);
  const spxInvalVal = spxTech.ema55 ? spxTech.ema55 : Math.round(spxPrice * 0.975);
  const qqqSupportVal = qqqTech.ema21 ? qqqTech.ema21 : Number((qqqPrice * 0.982).toFixed(2));
  const qqqInvalVal = qqqTech.ema55 ? qqqTech.ema55 : Number((qqqPrice * 0.972).toFixed(2));

  // 3. 动态提炼具备真实技术面与实测 30 日 RVOL 共振的行动候选标的 (共用统一筛选引擎)
  const candidates: ActionPlaybookCandidate[] = derivePlaybookCandidates({
    tech,
    priceMap,
    rvolMap,
    nameMap
  });

  return {
    marketRegime: regime,
    recommendedAllocation: {
      longEquitiesPct: longPct,
      hedgingOrCashPct: hedgePct,
      notes: allocNote
    },
    defenseLevels: {
      spxKeySupport: `${spxSupportVal} 点 (EMA21/MA50 核心防守位)`,
      spxInvalidation: `跌破 ${spxInvalVal} 点 (确认多头结构失效，触发全面防守)`,
      qqqKeySupport: `$${qqqSupportVal} (科技成长股关键心理承接区)`,
      qqqInvalidation: `跌破 $${qqqInvalVal} (破位下行，需减持高 Beta 半导体与 AI 标的)`
    },
    bullScenario: "若大盘平开高走放量站稳核心支撑，维持既定配置，顺势向突破年线/颈线的强势顺周期及高股息品种调仓。",
    bearScenario: "若长端收益率急升或开盘跌破 SPX 核心防守线，不可盲目抄底，严格按 1:1.5 盈亏比执行防守止损，提升现金头寸等待企稳。",
    topCandidates: candidates
  };
}
