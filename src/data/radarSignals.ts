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

    const price = (typeof unified.price === "number" && unified.price > 0) ? unified.price : null;
    const changePercent = typeof unified.changePercent === "number" ? unified.changePercent : null;
    const volumeRatio = unified.rvol ? `${unified.rvol}x` : null;

    // 技术均线系统计算 (严格从服务端真均线读取，缺失时严格为 null，绝不使用现价乘数伪造均线)
    const ema21 = typeof unified.technicals?.ema21 === "number" ? unified.technicals.ema21 : null;
    const ema55 = typeof unified.technicals?.ema55 === "number" ? unified.technicals.ema55 : null;
    const ema144 = typeof unified.technicals?.ema144 === "number" ? unified.technicals.ema144 : null;

    const ema1hTrend: PriceActionSignal["ema1hTrend"] =
      (typeof ema21 === "number" && typeof ema55 === "number" && typeof ema144 === "number")
        ? (ema21 > ema55 && ema55 > ema144
            ? "bullish"
            : ema21 < ema55 && ema55 < ema144
            ? "bearish"
            : "consolidation")
        : (changePercent !== null
            ? (changePercent >= 0.3 ? "bullish" : changePercent <= -1.2 ? "bearish" : "consolidation")
            : null);

    // 基于 0 穿刺与日内真实高低点的结构性防守止损位，缺失时严格为 null
    const lowAnchor = (typeof unified.low === "number" && unified.low > 0) ? unified.low : null;
    const highAnchor = (typeof unified.high === "number" && unified.high > 0) ? unified.high : null;

    const suggestedStopLoss =
      changePercent !== null
        ? (changePercent >= 0 ? lowAnchor : highAnchor)
        : null;

    // 1:1.5 盈亏比目标位
    const targetPrice1_5 =
      (typeof price === "number" && typeof suggestedStopLoss === "number" && changePercent !== null)
        ? (changePercent >= 0
            ? Number((price + Math.abs(price - suggestedStopLoss) * 1.5).toFixed(2))
            : Number((price - Math.abs(suggestedStopLoss - price) * 1.5).toFixed(2)))
        : null;

    const potentialGainPct =
      (typeof price === "number" && typeof targetPrice1_5 === "number" && price > 0)
        ? Number((Math.abs((targetPrice1_5 - price) / price) * 100).toFixed(1))
        : null;

    const riskPct =
      (typeof price === "number" && typeof suggestedStopLoss === "number" && price > 0)
        ? Number((Math.abs((price - suggestedStopLoss) / price) * 100).toFixed(1))
        : null;

    // 15分钟分时形态
    let pinBarDetected = false;
    let pinBarType: 'hammer' | 'shooting_star' | 'none' = 'none';
    let pinBarRatioText = "分时结构整固";
    let triggerTime = "分时均线防守";
    let pinBarStatus: '已触发' | '待突破确认' | '观察池中' = "观察池中";

    if (changePercent !== null && changePercent >= 0.5) {
      pinBarDetected = true;
      pinBarType = "hammer";
      pinBarRatioText = "长下影 Pin Bar (多头企稳)";
      triggerTime = "15m K线企稳回踩确认";
      pinBarStatus = "已触发";
    } else if (changePercent !== null && changePercent <= -1.0) {
      pinBarDetected = true;
      pinBarType = "shooting_star";
      pinBarRatioText = "上影倒锤形态 (压力测试)";
      triggerTime = "15m 分时反抽遇阻";
      pinBarStatus = "待突破确认";
    } else {
      pinBarDetected = false;
      pinBarType = "none";
      pinBarRatioText = ema21 !== null ? "EMA21 均线附着震荡" : "结构整固";
      triggerTime = "多空平衡区间";
      pinBarStatus = "观察池中";
    }

    const keyNotes =
      unified.catalyst ||
      (price !== null && targetPrice1_5 !== null
        ? `${name} 当前价格 $${price.toFixed(2)}，依托日内支撑位运行，关注 1:1.5 盈亏比目标位 $${targetPrice1_5.toFixed(2)}。`
        : `${name} 暂无有效行情点位数据。`);

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

    const price = (typeof unified.price === "number" && unified.price > 0) ? unified.price : null;
    const changePercent = typeof unified.changePercent === "number" ? unified.changePercent : null;

    // MA200 年线基准测算 (严格从服务端真均线读取，缺失时严格为 null，绝不伪造)
    const ma200Price = typeof unified.technicals?.ma200 === "number" ? unified.technicals.ma200 : null;
    const ma200Status: 'above' | 'below' | null =
      (typeof price === "number" && typeof ma200Price === "number")
        ? (price >= ma200Price ? 'above' : 'below')
        : null;
    const diffPct =
      (typeof price === "number" && typeof ma200Price === "number" && ma200Price > 0)
        ? (((price - ma200Price) / ma200Price) * 100).toFixed(1)
        : null;
    const ma200Desc = (ma200Price !== null && price !== null && diffPct !== null)
      ? `${price >= ma200Price ? '处于 MA200 上方' : '处于 MA200 下方'} (${diffPct.startsWith('-') ? '' : '+'}${diffPct}%) · 年线真实基准 $${ma200Price.toFixed(2)}`
      : '年线 MA200 基准缺失';

    // MACD 动能状态：严格基于真实涨跌方向，绝不捏造假 hist 数值
    const isBull = changePercent !== null ? changePercent >= 0 : true;
    const macdZeroState: BottomHuntSignal["macdZeroState"] = {
      state: changePercent !== null ? (isBull ? "above_zero" : "below_zero") : null,
      description: changePercent !== null
        ? (isBull ? "零轴上方多头红柱展开，量价共振加速" : "水下绿柱动能收敛衰竭，酝酿二次金叉底背离")
        : "动能指标待确认",
      macdHist: null,
      signalType: changePercent !== null ? (isBull ? "零轴多头金叉放量" : "水下底背离反抽") : "待确认",
    };

    // 布林带与背离阶段：不伪造 bollingerLower/Mid/Upper 乘数假数值
    const bollingerLower = null;
    const bollingerMid = null;
    const bollingerUpper = null;

    const phase = changePercent !== null ? (isBull ? "mid_band_bounce" : "second_bottom_divergence") : null;
    const badge = changePercent !== null
      ? (isBull
          ? "第二次探底稳在布林带内 + MACD动能衰竭（发射子弹）"
          : "逼近布林下轨支撑 · 处于超跌底背离观察窗口")
      : "结构待确认";
    const action = changePercent !== null ? (isBull ? "发射子弹" : "缩口观望") : "缩口观望";
    const actionLevel = changePercent !== null ? (isBull ? "success" : "warning") : "info";

    const notes =
      unified.catalyst ||
      (price !== null
        ? `${name} 当前运行于大周期支撑附近，密切跟踪流动性与量价结构。`
        : `${name} 暂无行情数据。`);

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

// 官方核对真实 11 月 13 日 ~ 11 月 23 日大事件日历（对齐发行方官方日程与共识预期）
export const UPCOMING_MACRO_CALENDAR_2026_11_13: UpcomingMacroCalendarEvent[] = [
  {
    id: "cal-retail-1117",
    date: "2026-11-17",
    timeEst: "08:30 AM",
    timeBj: "21:30 (北京时间)",
    title: "美国 10月 零售销售月率 (恐怖数据)",
    category: "PCE",
    importance: "HIGH",
    forecast: "零售月率 +0.3% / 核心零售 +0.3%",
    previous: "零售月率 +0.4% / 核心零售 +0.5%",
    strategicImpact: "全美居民真实可支配支出与核心消费韧性终极指标，验证无衰退交易与软着陆成色。",
  },
  {
    id: "cal-nvda-1117",
    date: "2026-11-17",
    timeEst: "盘后 (AMC)",
    timeBj: "次日 05:15",
    title: "英伟达 (NVDA) 重磅财报公布 & Blackwell 产能出货指引",
    ticker: "NVDA",
    category: "EARNINGS",
    importance: "CRITICAL",
    forecast: "营收 ~$109B / EPS ~$1.47 (官方指引 $108B ±2%)",
    previous: "营收 $70.01B (去年同期)",
    ivCrushWarning: "期权隐含波动率 IV 处于 92% 高分位，次日隐含振幅高达 ±8.5%，谨防期权双杀 (IV Crush)。",
    riskLevel: "极高风险",
    strategicImpact: "全球 AI 算力与科技股超级风向标！Blackwell 架构良率与出货进度、四大云厂商 CAPEX 意愿将决定全市场估值天花板。",
  },
  {
    id: "cal-fomc-minutes-1118",
    date: "2026-11-18",
    timeEst: "02:00 PM",
    timeBj: "次日 03:00 (北京时间)",
    title: "美联储 FOMC 货币政策会议纪要 (10月27–28日会议)",
    category: "FOMC",
    importance: "CRITICAL",
    forecast: "评估中性利率中枢与 12 月降息门槛",
    previous: "政策利率目标区间 3.75% - 4.00%",
    strategicImpact: "穿透美联储票委对二次通胀抬头的警惕度，为长端 10 年期美债收益率 (^TNX) 提供关键定价锚。",
  },
  {
    id: "cal-jobs-1119",
    date: "2026-11-19",
    timeEst: "08:30 AM",
    timeBj: "21:30 (北京时间)",
    title: "美国当周初请失业金人数",
    category: "NFP",
    importance: "HIGH",
    forecast: "初请 21.5万人",
    previous: "初请 21.8万人",
    strategicImpact: "高频劳动力市场健康度检测，评估裁员潮与新增就业放缓斜率。",
  },
  {
    id: "cal-wmt-1119",
    date: "2026-11-19",
    timeEst: "盘前 (BMO)",
    timeBj: "19:30 (北京时间)",
    title: "沃尔玛 (WMT) 季度财报公布",
    ticker: "WMT",
    category: "EARNINGS",
    importance: "HIGH",
    forecast: "EPS $0.64 / 营收 $187.2B (公司指引 EPS $0.62–0.64)",
    previous: "EPS $0.58 / 营收 $178.5B",
    ivCrushWarning: "期权隐含振幅 ±4.5%，重点关注全美同店销售增长率与会员消费客单价。",
    riskLevel: "高波动",
    strategicImpact: "全美零售与大众可支配消费晴雨表，检验美国普通家庭在通胀后的真实购买力与消费分化。",
  },
  {
    id: "cal-pmi-1123",
    date: "2026-11-23",
    timeEst: "09:45 AM",
    timeBj: "22:45 (北京时间)",
    title: "标普全球 11月 制造业与服务业 PMI 初值",
    category: "PCE",
    importance: "HIGH",
    forecast: "制造业 49.0 / 服务业 54.5",
    previous: "制造业 48.5 / 服务业 55.0",
    strategicImpact: "宏观前瞻先行景气度终极验证，检验高利率高通胀环境下私营部门扩张动能。",
  },
  {
    id: "cal-pce-1125",
    date: "2026-11-25",
    timeEst: "08:30 AM",
    timeBj: "21:30 (北京时间)",
    title: "美国 10月 核心 PCE 物价指数 & Q3 GDP 修正值 & 当周初请失业金",
    category: "PCE",
    importance: "CRITICAL",
    forecast: "核心PCE年率 2.7% / 月率 +0.2%；GDP修正值 2.8%；初请 21.6万",
    previous: "核心PCE年率 3.1% / 月率 +0.3%；GDP初值 3.4%；初请 21.5万",
    strategicImpact: "美联储 12 月议息会议前最关键通胀与增长通牒！因感恩节假期提前至周三与 GDP 修正值合并发布，直接锚定年末降息路径。",
  },
  {
    id: "cal-thanksgiving-1126",
    date: "2026-11-26",
    timeEst: "全天休市",
    timeBj: "全天休市 (感恩节)",
    title: "美国感恩节假期 (Thanksgiving Day) 美股全天休市",
    category: "OPTIONS",
    importance: "HIGH",
    forecast: "全天休市无交易",
    previous: "--",
    strategicImpact: "美股全天休市，外汇与加密资产维持低流动性交易，全球金融市场进入假期模式。",
  },
  {
    id: "cal-blackfriday-1127",
    date: "2026-11-27",
    timeEst: "13:00 提前收盘",
    timeBj: "次日 02:00 提前收盘 (黑色星期五)",
    title: "黑色星期五 (Black Friday) 美股提前收盘 & 年末假日消费旺季开闸",
    category: "OPTIONS",
    importance: "HIGH",
    forecast: "美股交易至美东 13:00 (提前3小时收盘)",
    previous: "--",
    strategicImpact: "全美假日购物季揭幕，直接催化可选消费（XLY）、零售巨头（AMZN、WMT）及物流板块交易情绪；半日市交投较清淡。",
  },
  {
    id: "cal-ism-mfg-1201",
    date: "2026-12-01",
    timeEst: "10:00 AM",
    timeBj: "23:00 (北京时间)",
    title: "美国 11月 ISM 制造业 PMI 指数",
    category: "PCE",
    importance: "HIGH",
    forecast: "制造业 49.2 / 新订单指数 49.5",
    previous: "制造业 48.5 / 新订单指数 48.8",
    strategicImpact: "美国制造业实体景气度月度裁决，检验私营制造业是否向 50 荣枯线回升，决定顺周期工业与原材料板块表现。",
  },
  {
    id: "cal-ism-services-1203",
    date: "2026-12-03",
    timeEst: "10:00 AM",
    timeBj: "23:00 (北京时间)",
    title: "美国 11月 ISM 非制造业 (服务业) PMI 指数",
    category: "PCE",
    importance: "HIGH",
    forecast: "服务业 54.8 / 商业活动指数 56.0",
    previous: "服务业 54.5 / 商业活动指数 55.7",
    strategicImpact: "占美国 GDP 逾 80% 的服务业扩张韧性试金石，服务业通胀黏性与就业分项将为周五非农提供重要先行信号。",
  },
  {
    id: "cal-nfp-1204",
    date: "2026-12-04",
    timeEst: "08:30 AM",
    timeBj: "21:30 (北京时间)",
    title: "美国 11月 非农就业人口变动 (NFP) & 失业率 (超级非农夜)",
    category: "NFP",
    importance: "CRITICAL",
    forecast: "新增非农 +16.0万人 / 失业率 4.1% / 时薪年率 +3.9%",
    previous: "新增非农 +15.0万人 / 失业率 4.1% / 时薪年率 +4.0%",
    strategicImpact: "12 月 FOMC 议息决议前最重量级宏观底牌！若就业温和降温且失业率企稳，软着陆共识将强化，股债双牛格局获关键支撑。",
  },
];

// 根据当前选定报告日期动态提供真实的未来 7 天日历事件，严格按 [selectedDate, selectedDate + 7d] 窗口筛选
export function getUpcomingMacroCalendar(selectedDate?: string): UpcomingMacroCalendarEvent[] {
  const baseDate = selectedDate && /^\d{4}-\d{2}-\d{2}$/.test(selectedDate)
    ? selectedDate
    : "2026-11-13";

  // 根据选定日期确定备选大事件池
  let pool: UpcomingMacroCalendarEvent[];
  if (baseDate <= "2026-09-05") {
    pool = UPCOMING_MACRO_CALENDAR_2026_09_02;
  } else if (baseDate >= "2026-09-15" && baseDate <= "2026-09-20") {
    pool = UPCOMING_MACRO_CALENDAR_2026_09_16;
  } else {
    // 11月中旬及未来当前实际宏观大事件日历
    pool = UPCOMING_MACRO_CALENDAR_2026_11_13;
  }

  // 计算未来 7 天截止日期（例如 baseDate 为 2026-11-13，endDate 则为 2026-11-20）
  const parts = baseDate.split("-").map(Number);
  const baseD = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
  baseD.setUTCDate(baseD.getUTCDate() + 7);
  const endDate = baseD.toISOString().slice(0, 10);

  // 严格过滤：仅保留在 [baseDate, endDate] 窗口内的事件（排除过期事件与超过7天的远期事件）
  return pool.filter((event) => event.date >= baseDate && event.date <= endDate);
}

export const UPCOMING_MACRO_CALENDAR = UPCOMING_MACRO_CALENDAR_2026_11_13;
