import { HistoricalDailyData } from "../types";
import { getPriceActionSignals, getBottomHuntSignals, UPCOMING_MACRO_CALENDAR } from "../data/radarSignals";

export function generateMasterMarkdownReport(
  data: HistoricalDailyData,
  selectedDate: string,
  liveQuotes: Record<string, any> = {}
): string {
  const report: any = data.aiReport || (data as any);
  const macro: any = data.macro || {};
  const assets: any[] = macro.items || macro.assets || [];
  const sectors: any[] = data.sectors || [];
  const movers: any[] = data.movers || [];
  const transmissions: any[] = data.transmissions || (data as any).causalChains || [];
  const priceActionSignals = getPriceActionSignals(liveQuotes);
  const bottomSignals = getBottomHuntSignals(liveQuotes);

  let md = `# 【MarketPulse AI 策略师复盘研报 · ${data.displayDate || selectedDate}】
> 基准日期: ${selectedDate} | 市场基调: ${data.marketTone || "分化"} | 市场状态: ${data.marketStatus || "Closed"}
> 行情校准: Yahoo Finance 官方权威行情对齐 | AI 策略推演: Gemini 3.7 Flash 深度因果引擎

---

## 🏛️ 一、宏观大局与跨资产水温 (Macro Overview)
**核心论点**: ${macro.coreThesis || macro.summary || "宏观流动性平稳，跨资产紧密传导"}

### 核心资产收盘基准 (Ground Truth)
| 资产 | 代码 | 最新价格/点位 | 涨跌幅 | 趋势 |
| :--- | :--- | :--- | :--- | :--- |
${assets
  .map(
    (a: any) =>
      `| ${a.name || a.ticker} | \`${a.ticker}\` | **${typeof a.currentValue === "number" ? a.currentValue.toFixed(2) : a.price || a.currentValue}** ${a.unit || ""} | \`${a.changePct || (a.changePercent >= 0 ? "+" : "") + a.changePercent + "%"}\` | ${a.trend === "up" ? "📈 走强" : a.trend === "down" ? "📉 走弱" : "➖ 震荡"} |`
  )
  .join("\n")}

${macro.transmissionDetail ? `\n**宏观底层传导机制**:\n${macro.transmissionDetail}\n` : ""}

---

## ⚡ 二、核心财报与宏观黑天鹅雷达 (未来 7 天关键日历)
${UPCOMING_MACRO_CALENDAR.map(
  (ev) =>
    `- **${ev.date} (${ev.timeBj})** 【${ev.category}】**${ev.title}** ${ev.ticker ? `(\$${ev.ticker})` : ""}
  - 预期/前值: ${ev.forecast || "--"} / ${ev.previous || "--"}
  - 策略影响: ${ev.strategicImpact}
  ${ev.ivCrushWarning ? `  - ⚠️ **期权预警**: ${ev.ivCrushWarning}` : ""}`
).join("\n")}

---

## 🧭 三、裸K与形态雷达 (Price Action Scanner · 盘后选股漏斗)
*筛选标准: 1小时 $EMA_{21} > EMA_{55} > EMA_{144}$ 趋势排列 + 15分钟 Pin Bar (下影线 ≥ 2×实体) 拒绝形态*

| 代码 | 名称 | 当前价 | 1H EMA 趋势 | 15M 形态 | 建议止损 (0穿刺) | 1:1.5 目标位 | 状态 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
${priceActionSignals
  .map(
    (s) =>
      `| **${s.ticker}** | ${s.name} | $${(s.price ?? 0).toFixed(2)} | ${s.ema1hTrend === "bullish" ? "🟢 多头排列" : s.ema1hTrend === "bearish" ? "🔴 空头排列" : "🟡 震荡缠绕"} | ${s?.pinBar15m?.detected ? `🔨 ${s.pinBar15m.ratioText}` : "➖ 无"} | $${(s?.pinBar15m?.suggestedStopLoss ?? 0).toFixed(2)} | $${(s?.pinBar15m?.targetPrice1_5 ?? 0).toFixed(2)} | \`${s?.pinBar15m?.status || "观察"}\` |`
  )
  .join("\n")}

---

## 🎯 四、左侧抄底“终极捕猎”雷达 (日线底背离 + 布林带检测)
*量化规则: MA200 牛熊过滤器 + MACD 零轴状态 + 第一次砸穿下轨【只看不碰】vs 第二次探底稳在带内【发射子弹】*

${bottomSignals
  .map(
    (b) =>
      `### [${b?.divergenceAndBollinger?.action === "发射子弹" ? "🎯 发射子弹" : b?.divergenceAndBollinger?.action === "只看不碰" ? "⛔ 只看不碰" : "⛽ 空中加油"}] ${b.ticker} (${b.name}) - $${(b.price ?? 0).toFixed(2)} (${(b.changePercent ?? 0) >= 0 ? "+" : ""}${(b.changePercent ?? 0).toFixed(2)}%)
- **判定结论**: ${b?.divergenceAndBollinger?.badge || "评估中"}
- **MA200 过滤器**: ${b?.ma200Filter?.description || "均线整理"}
- **MACD 零轴状态**: ${b?.macdZeroState?.description || "零轴附近"} (柱状线: ${b?.macdZeroState?.macdHist || "0.00"})
- **布林轨道参考**: 下轨 $${b?.divergenceAndBollinger?.bollingerLower || "N/A"} | 中轨 $${b?.divergenceAndBollinger?.bollingerMid || "N/A"} | 上轨 $${b?.divergenceAndBollinger?.bollingerUpper || "N/A"}
- **量化逻辑**: ${b?.divergenceAndBollinger?.notes || "观察筹码结构"}
`
  )
  .join("\n")}

---

## 🗺️ 五、跨资产因果传导链路 (Causal Chains)
${transmissions
  .map((chain: any, idx: number) => {
    const driver = chain.driver || chain.drivingEvent || chain.title;
    const mechanism = chain.mechanism || chain.summary;
    const steps = chain.transmissionSteps || [];
    return `### 链路 ${idx + 1}: 【${chain.category || "跨市场联动"}】${driver}
- **传导机制**: ${mechanism}
${steps.length > 0 ? `- **因果演进**: ${steps.join(" ➔ ")}` : ""}
- **核心受益端**: ${chain.beneficiary || "科技龙头/成长型资产"}
- **承压受损端**: ${chain.victim || "高杠杆/传统能源"}`;
  })
  .join("\n\n")}

---

## 📊 六、主力板块轮动与领头羊 (Sector Heatmap & Leaders)
${sectors
  .map((sec: any) => {
    const leaders = (sec.leaders || [])
      .map(
        (l: any) =>
          `  - **${l.ticker}** (${l.price ? `$${l.price.toFixed(2)}` : ""}, \`${l.changePct || (l.changePercent >= 0 ? "+" : "") + l.changePercent + "%"}\`): ${l.reason || l.catalyst || "板块资金合力"}`
      )
      .join("\n");
    return `### ${sec.name || sec.sectorName} (${sec.etf || ""}) | 涨跌: ${sec.avgChangePercent !== undefined ? `${sec.avgChangePercent >= 0 ? "+" : ""}${sec.avgChangePercent}%` : "0.00%"}
${sec.thesis ? `*逻辑*: ${sec.thesis}\n` : ""}
${leaders}`;
  })
  .join("\n\n")}

---

## 🔥 七、RVOL 异动股掘金与归因 (Top Movers & Volume Screener)
${movers
  .slice(0, 6)
  .map((m: any) => {
    return `- **${m.ticker}** (${m.name}) | 现价: $${typeof m.price === "number" ? m.price.toFixed(2) : m.price} | 涨跌: \`${m.changePct || (m.changePercent >= 0 ? "+" : "") + m.changePercent + "%"}\` | RVOL: **${m.rvol}**
  - **核心催化归因**: ${m.catalyst || m.newsAttribution || "资金放量主升"}
  - **失效止损参考**: \`${m.invalidationLevel || "跌破入场K线低点"}\``;
  })
  .join("\n\n")}

---

## 🛡️ 八、战术多空展望与风控纪律
${
  report.tacticalOutlook
    ? `- **多头主线 (Bull Ideas)**: ${report.tacticalOutlook.bullIdeas}
- **防御/减仓 (Bear Ideas)**: ${report.tacticalOutlook.bearIdeas}`
    : report.bullBearTactics
    ? `- **做多方向**: ${(report.bullBearTactics.longIdeas || []).join("; ")}
- **减仓防守**: ${(report.bullBearTactics.shortOrDefensiveIdeas || []).join("; ")}`
    : "- 维持仓位动态平衡，严格遵守单笔交易风险上限 (≤1.5% 本金)。"
}

${
  report.riskWarnings && report.riskWarnings.length > 0
    ? `\n### ⚠️ 核心风险提示:\n${report.riskWarnings.map((w: string) => `- ${w}`).join("\n")}`
    : ""
}

---
*免责声明：本投研复盘由 MarketPulse AI 与 Yahoo Finance 权威行情接口自动生成，仅供研究参考，不构成任何投资建议。*
`;

  return md;
}
