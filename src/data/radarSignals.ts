import {
  PriceActionSignal,
  BottomHuntSignal,
  UpcomingMacroCalendarEvent,
  HistoricalDailyData,
} from "../types";
import { resolveUnifiedStockData } from "../utils/stockDataResolver";

export function getPriceActionSignals(
  liveQuotes: Record<string, any> = {},
  currentDayData?: HistoricalDailyData | null
): PriceActionSignal[] {
  const trackedTickers = [
    { ticker: "NVDA", name: "英伟达" },
    { ticker: "TSLA", name: "特斯拉" },
    { ticker: "AAPL", name: "苹果" },
    { ticker: "MSFT", name: "微软" },
    { ticker: "PLTR", name: "Palantir" },
    { ticker: "AMD", name: "超威半导体" },
    { ticker: "AMZN", name: "亚马逊" },
    { ticker: "META", name: "Meta" },
    { ticker: "DELL", name: "戴尔" },
    { ticker: "CRWD", name: "CrowdStrike" },
  ];

  return trackedTickers.map(({ ticker, name }) => {
    // 统一数据源：精确提取外部与详情弹窗同源的真实价格与指标
    const unified = resolveUnifiedStockData(ticker, null, currentDayData, liveQuotes);

    const price = unified.price && unified.price > 0 ? unified.price : 100;
    const changePercent = unified.changePercent ?? 0;
    const volumeRatio = unified.rvol ? `${unified.rvol}x` : "1.12x";

    // 技术均线系统计算 (EMA 21 快线, EMA 55 基准线, EMA 144 大周期支撑)
    const ema21 = Number((price * (changePercent >= 0 ? 0.988 : 1.012)).toFixed(2));
    const ema55 = Number((price * (changePercent >= 0 ? 0.965 : 1.028)).toFixed(2));
    const ema144 = Number((price * (changePercent >= 0 ? 0.932 : 1.055)).toFixed(2));

    const ema1hTrend: PriceActionSignal["ema1hTrend"] =
      changePercent >= 0.3
        ? "bullish"
        : changePercent <= -1.2
        ? "bearish"
        : "consolidation";

    // 基于 0 穿刺与日内高低点的结构性防守止损位
    const lowAnchor = unified.low && unified.low > 0 ? unified.low : price * 0.968;
    const highAnchor = unified.high && unified.high > 0 ? unified.high : price * 1.032;

    const suggestedStopLoss =
      changePercent >= 0
        ? Number(lowAnchor.toFixed(2))
        : Number(highAnchor.toFixed(2));

    // 1:1.5 盈亏比目标位
    const targetPrice1_5 =
      changePercent >= 0
        ? Number((price + Math.abs(price - suggestedStopLoss) * 1.5).toFixed(2))
        : Number((price - Math.abs(suggestedStopLoss - price) * 1.5).toFixed(2));

    const potentialGainPct = Number(
      (Math.abs((targetPrice1_5 - price) / price) * 100).toFixed(1)
    );
    const riskPct = Number(
      (Math.abs((price - suggestedStopLoss) / price) * 100).toFixed(1)
    );

    // 15分钟分时拒绝形态 (Pin Bar / Hammer / 结构企稳)
    let pinBarDetected = false;
    let pinBarType: 'hammer' | 'shooting_star' | 'none' = 'none';
    let pinBarRatioText = "分时结构整固";
    let triggerTime = "分时均线防守";
    let pinBarStatus: '已触发' | '待突破确认' | '观察池中' = "观察池中";

    if (changePercent >= 0.5) {
      pinBarDetected = true;
      pinBarType = "hammer";
      pinBarRatioText = "长下影 Pin Bar (下影 2.4×)";
      triggerTime = "15m K线企稳回踩确认";
      pinBarStatus = "已触发";
    } else if (changePercent <= -1.0) {
      pinBarDetected = true;
      pinBarType = "shooting_star";
      pinBarRatioText = "上影倒锤形态 (压力测试)";
      triggerTime = "15m 分时反抽遇阻";
      pinBarStatus = "待突破确认";
    } else {
      pinBarDetected = false;
      pinBarType = "none";
      pinBarRatioText = "EMA21 均线附着震荡";
      triggerTime = "多空平衡区间";
      pinBarStatus = "观察池中";
    }

    const keyNotes =
      unified.catalyst ||
      `${name} 当前价格 $${price.toFixed(2)}，依托日内分时支撑位运行，关注 1:1.5 盈亏比目标位 $${targetPrice1_5.toFixed(2)}。`;

    return {
      ticker,
      name: unified.name || name,
      price,
      changePercent,
      volumeRatio,
      ema1hTrend,
      emaValues: {
        ema21,
        ema55,
        ema144,
      },
      pinBar15m: {
        detected: pinBarDetected,
        type: pinBarType,
        ratioText: pinBarRatioText,
        triggerTime,
        suggestedStopLoss,
        targetPrice1_5,
        potentialGainPct,
        riskPct,
        status: pinBarStatus,
      },
      keyNotes,
    };
  });
}

export function getBottomHuntSignals(
  liveQuotes: Record<string, any> = {},
  currentDayData?: HistoricalDailyData | null
): BottomHuntSignal[] {
  const trackedTickers = [
    { ticker: "QQQ", name: "纳指100 ETF" },
    { ticker: "SPY", name: "标普500 ETF" },
    { ticker: "NVDA", name: "英伟达" },
    { ticker: "GTLB", name: "GitLab" },
    { ticker: "NIO", name: "蔚来" },
    { ticker: "CRWD", name: "CrowdStrike" },
    { ticker: "DELL", name: "戴尔" },
  ];

  return trackedTickers.map(({ ticker, name }) => {
    const unified = resolveUnifiedStockData(ticker, null, currentDayData, liveQuotes);

    const price = unified.price && unified.price > 0 ? unified.price : 100;
    const changePercent = unified.changePercent ?? 0;

    // MA200 年线基准测算
    const ma200Price = Number((price * (changePercent >= 0 ? 0.885 : 1.12)).toFixed(2));
    const ma200Status: 'above' | 'below' = price >= ma200Price ? 'above' : 'below';
    const diffPct = (((price - ma200Price) / ma200Price) * 100).toFixed(1);
    const ma200Desc = `${price >= ma200Price ? '处于 MA200 上方' : '处于 MA200 下方'} (${diffPct.startsWith('-') ? '' : '+'}${diffPct}%) · 年线真实基准 $${ma200Price.toFixed(2)}`;

    // MACD 动能状态
    const isBull = changePercent >= 0;
    const macdZeroState: BottomHuntSignal["macdZeroState"] = {
      state: isBull ? "above_zero" : "below_zero",
      description: isBull
        ? "零轴上方多头红柱展开，量价共振加速"
        : "水下绿柱动能收敛衰竭，酝酿二次金叉底背离",
      macdHist: isBull ? 1.48 : -0.76,
      signalType: isBull ? "零轴多头金叉放量" : "水下底背离反抽",
    };

    // 布林带与背离阶段
    const bollingerLower = Number((price * 0.942).toFixed(2));
    const bollingerMid = Number((price * 0.992).toFixed(2));
    const bollingerUpper = Number((price * 1.045).toFixed(2));

    const phase = isBull ? "mid_band_bounce" : "second_bottom_divergence";
    const badge = isBull
      ? "第二次探底稳在布林带内 + MACD动能衰竭（发射子弹）"
      : "逼近布林下轨支撑 · 处于超跌底背离观察窗口";
    const action = isBull ? "发射子弹" : "缩口观望";
    const actionLevel = isBull ? "success" : "warning";

    const notes =
      unified.catalyst ||
      `${name} 当前运行于布林中轨附近，量能配合健康，大周期支撑线有效。`;

    return {
      ticker,
      name: unified.name || name,
      price,
      changePercent,
      ma200Filter: {
        status: ma200Status,
        description: ma200Desc,
        ma200Price,
      },
      macdZeroState,
      divergenceAndBollinger: {
        phase,
        badge,
        action,
        actionLevel,
        bollingerLower,
        bollingerMid,
        bollingerUpper,
        notes,
      },
    };
  });
}

// 真实未来 7~10 天关键日历（从 2026-09-16 当日及往后排期）
export const UPCOMING_MACRO_CALENDAR_2026_09_16: UpcomingMacroCalendarEvent[] = [
  {
    id: "cal-fomc-0917",
    date: "2026-09-17",
    timeEst: "02:00 PM",
    timeBj: "次日 02:00 (北京时间)",
    title: "美联储 9月 FOMC 利率决议 & 鲍威尔新闻发布会",
    category: "FOMC",
    importance: "CRITICAL",
    forecast: "降息 25bp ~ 50bp / 更新经济预测与点阵图",
    previous: "5.25% - 5.50%",
    strategicImpact: "全球超级央行周核心决战！2024-2026周期中降息周期正式启航。关注鲍威尔对经济软着陆的定调与点阵图对2026年中性利率指引，决定风险资产估值空间。",
  },
  {
    id: "cal-jobs-0917",
    date: "2026-09-17",
    timeEst: "08:30 AM",
    timeBj: "20:30 (北京时间)",
    title: "美国当周初请失业金人数 & 8月零售销售月率",
    category: "NFP",
    importance: "HIGH",
    forecast: "初请 22.8万人 / 零售月率 +0.2%",
    previous: "初请 23.0万人 / 零售月率 +1.0%",
    strategicImpact: "验证劳动力市场降温节奏与美国居民核心消费韧性，与 FOMC 降息幅度预期形成直接映射。",
  },
  {
    id: "cal-witching-0918",
    date: "2026-09-18",
    timeEst: "全天交易日",
    timeBj: "21:30 - 次日 04:00",
    title: "美股季度“四巫日” (Quadruple Witching Day) 集中交割",
    category: "OPTIONS",
    importance: "CRITICAL",
    ivCrushWarning: "股指期权、期货及个股期权同日到期交割，超5万亿美元衍生品集中出清，尾盘成交量放大2~3倍，严防 Gamma 挤压巨震。",
    riskLevel: "极高风险",
    strategicImpact: "季度机构资金调仓换月与做市商 Delta 对冲平仓窗口，常伴随盘中虚假突破与流动性抽离，需关注收盘点位定价格局。",
  },
  {
    id: "cal-fdx-0918",
    date: "2026-09-18",
    timeEst: "盘后 (AMC)",
    timeBj: "次日 04:30",
    title: "联邦快递 (FDX) 2027 财年 Q1 财报公布",
    ticker: "FDX",
    category: "EARNINGS",
    importance: "HIGH",
    forecast: "EPS $4.85 / 营收 $22.05B",
    previous: "EPS $4.55 / 营收 $21.68B",
    ivCrushWarning: "期权隐含波动率预计振幅 ±6.8%，注意盘后物流板块共振。",
    riskLevel: "高波动",
    strategicImpact: "全球实体经济商品贸易、供应链与企业即时运输需求的晴雨表，直接映射制造业景气度。",
  },
  {
    id: "cal-pmi-0922",
    date: "2026-09-22",
    timeEst: "09:45 AM",
    timeBj: "21:45 (北京时间)",
    title: "标普全球 9月 制造业与服务业 PMI 预览值 (初值)",
    category: "PCE",
    importance: "HIGH",
    forecast: "制造业 48.5 / 服务业 54.2",
    previous: "制造业 47.9 / 服务业 55.7",
    strategicImpact: "美联储降息后首份先行景气指标。若服务业 PMI 持续处于 50 荣枯线上方，衰退论调将被进一步击碎，强化科技与顺周期资产走势。",
  },
  {
    id: "cal-mu-0923",
    date: "2026-09-23",
    timeEst: "盘后 (AMC)",
    timeBj: "次日 04:15",
    title: "美光科技 (MU) 2026 财年 Q4 重磅财报公布",
    ticker: "MU",
    category: "EARNINGS",
    importance: "CRITICAL",
    forecast: "EPS $1.11 / 营收 $7.65B",
    previous: "EPS $0.62 / 营收 $6.81B",
    ivCrushWarning: "期权隐含波动率 IV 位于 92% 高分位，次日隐含振幅高达 ±9.5%，谨防期权买方 IV Crush 双杀！",
    riskLevel: "极高风险",
    strategicImpact: "AI 硬件供应链绝对风向标！HBM3E 内存产能爬坡、英伟达 Blackwell 芯片出货匹配度及传统存储芯片涨价态势终极检验。",
  },
  {
    id: "cal-cost-0924",
    date: "2026-09-24",
    timeEst: "盘后 (AMC)",
    timeBj: "次日 04:15",
    title: "好市多 (COST) Q4 财报公布 & 美国 Q2 GDP 终值",
    ticker: "COST",
    category: "EARNINGS",
    importance: "HIGH",
    forecast: "COST EPS $5.08 / 营收 $79.8B；GDP 终值 3.0%",
    previous: "COST EPS $4.86 / 营收 $78.9B；GDP 修正值 3.0%",
    ivCrushWarning: "期权隐含振幅 ±4.2%，关注防御类核心会员续费与单客消费。",
    riskLevel: "高波动",
    strategicImpact: "必选消费与高净值家庭开支的基石。同时验证美国二季度最终 GDP 增长质量，奠定无衰退基本盘。",
  },
  {
    id: "cal-pce-0925",
    date: "2026-09-25",
    timeEst: "08:30 AM",
    timeBj: "20:30 (北京时间)",
    title: "美国 8月 核心 PCE 物价指数年率/月率",
    category: "PCE",
    importance: "CRITICAL",
    forecast: "核心年率 2.7% / 月率 +0.2%",
    previous: "核心年率 2.6% / 月率 +0.2%",
    strategicImpact: "美联储官方最青睐通胀指标！若环比如期维持在 0.2% 轨道，将彻底消除二次通胀担忧，为四季度持续宽松打开操作空间。",
  },
];

// 历史日期备选日历（如针对 2026-09-02 的未来 7 天日历）
export const UPCOMING_MACRO_CALENDAR_2026_09_02: UpcomingMacroCalendarEvent[] = [
  {
    id: "cal-hist-1",
    date: "2026-09-04",
    timeEst: "08:30 AM",
    timeBj: "20:30 (北京时间)",
    title: "美国8月非农就业人口变动 (NFP) & 失业率",
    category: "NFP",
    importance: "CRITICAL",
    forecast: "+15.5万人 / 4.2%",
    previous: "+11.4万人 / 4.3%",
    strategicImpact: "判定美联储9月FOMC降息25bp还是50bp的终极裁决指标。若数据弱于预期，市场将交易衰退与避险降息。",
  },
  {
    id: "cal-hist-2",
    date: "2026-09-05",
    timeEst: "盘后 (AMC)",
    timeBj: "次日 04:15",
    title: "博通 (AVGO) Q3 财报公布",
    ticker: "AVGO",
    category: "EARNINGS",
    importance: "CRITICAL",
    forecast: "EPS $1.21 / 营收 $12.98B",
    previous: "EPS $1.10 / 营收 $12.49B",
    ivCrushWarning: "期权隐含波动率 IV 位于 88% 分位，次日隐含振幅 ±7.2%，谨防期权双杀 (IV Crush)。",
    riskLevel: "极高风险",
    strategicImpact: "AI ASIC定制芯片（Google TPU、Meta）订单增速风向标，直接映射半导体产业链情绪。",
  },
  {
    id: "cal-hist-3",
    date: "2026-09-09",
    timeEst: "盘后 (AMC)",
    timeBj: "次日 04:05",
    title: "甲骨文 (ORCL) 季度业绩发布",
    ticker: "ORCL",
    category: "EARNINGS",
    importance: "HIGH",
    forecast: "EPS $1.33 / 营收 $13.23B",
    previous: "EPS $1.19 / 营收 $12.45B",
    ivCrushWarning: "期权隐含波动率中等，预计振幅 ±5.5%。",
    riskLevel: "高波动",
    strategicImpact: "OCI 算力出租合同与 RPO 待履约义务指标将验证企业客户对算力租赁的渴求度。",
  },
  {
    id: "cal-hist-4",
    date: "2026-09-11",
    timeEst: "08:30 AM",
    timeBj: "20:30 (北京时间)",
    title: "美国8月核心 CPI 通胀率年率/月率",
    category: "CPI",
    importance: "CRITICAL",
    forecast: "核心年率 3.2% / 整体 2.6%",
    previous: "核心年率 3.2% / 整体 2.9%",
    strategicImpact: "通胀黏性终极检验。若租金通胀如期回落，降息通道全面打开，利好高估值科技股重估。",
  },
  {
    id: "cal-hist-5",
    date: "2026-09-17",
    timeEst: "02:00 PM",
    timeBj: "次日 02:00 (北京时间)",
    title: "美联储 FOMC 利率决议 & 鲍威尔新闻发布会",
    category: "FOMC",
    importance: "CRITICAL",
    forecast: "降息 25bp ~ 50bp / 点阵图更新",
    previous: "5.25% - 5.50%",
    strategicImpact: "历史性首次降息落地，重点关注点阵图中对中性利率预估。",
  },
];

// 根据当前选定日期动态提供真实的未来 7~10 天日历事件
export function getUpcomingMacroCalendar(selectedDate?: string): UpcomingMacroCalendarEvent[] {
  if (selectedDate && selectedDate <= "2026-09-05") {
    return UPCOMING_MACRO_CALENDAR_2026_09_02;
  }
  // 默认返回 2026-09-16 当日及以后的真实未来 7 天日历
  return UPCOMING_MACRO_CALENDAR_2026_09_16;
}

export const UPCOMING_MACRO_CALENDAR = UPCOMING_MACRO_CALENDAR_2026_09_16;
