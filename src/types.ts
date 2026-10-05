export interface MacroAsset {
  name: string;
  ticker: string;
  price?: number;
  currentValue: number;
  prevValue?: number;
  changePercent?: number | null;
  changePct?: string | null;
  trend?: 'up' | 'down' | 'neutral' | string;
  unit?: string;
  description?: string;
  sparkline?: number[];
  volume?: number;
  rvol?: number | string;
}

export interface MacroData {
  items: MacroAsset[];
  summary: string;
  coreThesis?: string;
  transmissionDetail?: string;
  liquidityOutlook?: string;
  rateEnvironment?: string;
  assets?: Array<{
    name: string;
    ticker: string;
    price?: number;
    changePct?: string;
    trend?: string;
  }>;
}

export interface SectorLeaderStock {
  ticker: string;
  name?: string;
  price?: number;
  open?: number;
  high?: number;
  low?: number;
  changePercent?: number | null;
  changePct?: string | null;
  volume?: number;
  avgVolume?: number;
  rvol?: number | string;
  sparkline?: number[];
  reason?: string;
  catalyst?: string;
}

export interface SectorCategory {
  id: string;
  sectorName?: string;
  name?: string;
  etf?: string;
  avgChangePercent?: number | null;
  sentiment?: 'bullish' | 'neutral' | 'bearish';
  thesis?: string;
  leaders: SectorLeaderStock[];
}

export interface KeyLevels {
  support?: string;
  resistance?: string;
  invalidation: string;
}

export interface MoverStockItem {
  ticker: string;
  name: string;
  price?: number;
  open?: number;
  high?: number;
  low?: number;
  changePercent?: number | null;
  changePct?: string | null;
  volume?: number;
  avgVolume?: number;
  avgVolume5d?: number;
  rvol: number | string; // e.g. 2.8 or "2.8x" or "约 2.3x"
  sector: string;
  catalyst?: string;
  newsAttribution?: string;
  news?: Array<{ publisher: string; title: string; time?: string }>;
  sparkline?: number[];
  shortTermOutlook?: string;
  midTermLogic?: string;
  invalidationLevel?: string;
  outlook?: {
    shortTermTrend?: string;
    midTermLogic?: string;
    actionableBias?: '逢低做多' | '右侧突破' | '高抛减仓' | '观望防守' | '区间震荡' | '看多' | '看空' | string;
  };
  keyLevels?: KeyLevels;
}

export interface CausalAssetImpact {
  ticker: string;
  name?: string;
  direction?: 'beneficiary' | 'impacted' | 'neutral';
  changePercent?: number;
  reason?: string;
}

export interface TransmissionChain {
  id: string;
  title?: string;
  driver?: string;
  drivingEvent?: string;
  mechanism?: string;
  transmissionSteps?: string[];
  beneficiary?: string;
  victim?: string;
  category?: '地缘政治' | '宏观利率' | 'AI产业突破' | '大宗商品' | '企业财报' | '产业链成本' | string;
  beneficiaries?: CausalAssetImpact[];
  impactedAssets?: CausalAssetImpact[];
  summary?: string;
}

export interface DailyAiReport {
  id?: string;
  generatedAt?: string;
  marketSentiment?: 'Bullish' | 'Moderately Bullish' | 'Neutral' | 'Cautious' | 'Bearish' | string;
  sentimentScore?: number; // 0 - 100
  executiveSummary?: string;
  executiveSnapshot?: string;
  macroOverview?: string;
  heavyweightInsights?: Array<{
    title: string;
    impact: string;
  }>;
  heavyDeepDive?: {
    title: string;
    content: string;
    affectedSectors?: string[];
  };
  sectorRotations?: {
    growth: string;
    defensive: string;
    capitalFlow: string;
  };
  sectorClassification?: {
    leadingAnalysis: string;
    laggingAnalysis: string;
    rotationInsight: string;
  };
  tacticalOutlook?: {
    bullIdeas: string;
    bearIdeas: string;
  };
  bullBearTactics?: {
    longIdeas: string[];
    shortOrDefensiveIdeas: string[];
    portfolioAllocation?: string;
  };
  riskWarnings?: string[];
  keyTakeaways?: string[];
  earningsStatisticsAndImpact?: {
    earningsSummary: Array<{
      ticker: string;
      name: string;
      role: string;
      keyMetrics: {
        revenue?: string;
        dataCenterRevenue?: string;
        grossMargin?: string;
        nonGAApEPS?: string;
        cRPO?: string;
        aiARR?: string;
        netNewARR?: string;
        falconFlexARR?: string;
        guidance?: string;
        [key: string]: string | undefined;
      };
      industryProgress: string;
    }>;
    macroMarketImpact: {
      capexValidation: string;
      discountRateOffset: string;
      sectorRotation: string;
    };
  };
}

export interface HistoricalDailyData {
  date: string;
  displayDate: string;
  weekday: string;
  tagline: string;
  marketStatus?: string;
  marketTone: '偏多' | '偏空' | '震荡' | '分化' | '高波动' | '防御性震荡';
  macro: MacroData;
  aiReport: DailyAiReport;
  sectors: SectorCategory[];
  movers: MoverStockItem[];
  transmissions: TransmissionChain[];
  causalChains?: TransmissionChain[];
  earningsStatisticsAndImpact?: {
    earningsSummary: Array<{
      ticker: string;
      name: string;
      role: string;
      keyMetrics: {
        revenue?: string;
        dataCenterRevenue?: string;
        grossMargin?: string;
        nonGAApEPS?: string;
        cRPO?: string;
        aiARR?: string;
        netNewARR?: string;
        falconFlexARR?: string;
        guidance?: string;
        [key: string]: string | undefined;
      };
      industryProgress: string;
    }>;
    macroMarketImpact: {
      capexValidation: string;
      discountRateOffset: string;
      sectorRotation: string;
    };
  };
  rawPromptPayload?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  groundingSources?: Array<{ title: string; uri: string }>;
}

export type TabType =
  | 'macro'
  | 'price-action'
  | 'bottom-hunter'
  | 'sectors'
  | 'movers'
  | 'transmissions';

export interface PriceActionSignal {
  ticker: string;
  name: string;
  price: number | null;
  changePercent: number | null;
  volumeRatio?: string | null;
  ema1hTrend?: 'bullish' | 'bearish' | 'consolidation' | null; // EMA21 > EMA55 > EMA144
  emaValues: {
    ema21: number | null;
    ema55: number | null;
    ema144: number | null;
  };
  pinBar15m: {
    detected: boolean;
    type?: 'hammer' | 'shooting_star' | 'none' | null;
    ratioText?: string | null; // e.g. "下影线 2.8x 实体"
    triggerTime?: string | null;
    suggestedStopLoss: number | null; // 基于 0 穿刺的建议止损
    targetPrice1_5: number | null; // 1:1.5 盈亏比目标位
    potentialGainPct: number | null;
    riskPct: number | null;
    status: '已触发' | '待突破确认' | '观察池中' | string | null;
  };
  keyNotes: string;
}

export interface BottomHuntSignal {
  ticker: string;
  name: string;
  price: number | null;
  changePercent: number | null;
  ma200Filter: {
    status: 'above' | 'below' | 'bb_mid_up' | null;
    description: string; // e.g. "处于 MA200 上方 (结构健康)"
    ma200Price?: number | null;
  };
  macdZeroState: {
    state: 'above_zero' | 'below_zero' | null;
    description: string; // "水上空中加油" vs "水下超跌反弹"
    macdHist: number | null;
    signalType: string;
  };
  divergenceAndBollinger: {
    phase: 'first_breakout' | 'second_bottom_divergence' | 'bb_squeeze' | 'mid_band_bounce' | null;
    badge: string; // "第一次出轨砸穿下轨（只看不碰）" vs "第二次探底稳在布林带内 + MACD 动能明显衰竭（发射子弹）"
    action: '只看不碰' | '发射子弹' | '空中加油' | '缩口观望' | string;
    actionLevel: 'danger' | 'success' | 'warning' | 'info';
    bollingerLower: number | null;
    bollingerUpper: number | null;
    bollingerMid: number | null;
    notes: string;
  };
}

export interface UpcomingMacroCalendarEvent {
  id: string;
  date: string;
  timeEst: string;
  timeBj: string;
  title: string;
  category: 'FOMC' | 'CPI' | 'PCE' | 'NFP' | 'EARNINGS' | 'OPTIONS' | string;
  ticker?: string;
  importance: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  forecast?: string;
  previous?: string;
  ivCrushWarning?: string; // e.g. "期权隐含波动率 IV 处于 92% 分位，谨防财报后 IV 暴跌砸盘"
  riskLevel?: '极高风险' | '高波动' | '中等敏感';
  strategicImpact: string;
}

export type SectorPerformance = SectorCategory;

export interface StockDetail {
  ticker: string;
  name: string;
  sector: string;
  price: number | null;
  open?: number | null;
  high?: number | null;
  low?: number | null;
  changePercent: number | null;
  catalyst?: string;
  newsAttribution?: string;
  shortTermOutlook?: string;
  midTermLogic?: string;
  invalidationLevel?: string;
  volume?: number;
  avgVolume?: number;
  rvol?: number | string;
  news?: Array<{ publisher: string; title: string; time?: string }>;
  sparkline?: number[];
  outlook?: {
    shortTermTrend?: string;
    midTermLogic?: string;
    actionableBias?: '逢低做多' | '右侧突破' | '高抛减仓' | '观望防守' | '区间震荡' | '看多' | '看空' | string;
  };
  keyLevels?: KeyLevels;
}

export interface StockAnalysisResult {
  ticker: string;              // 股票代码，如 "NVDA"
  companyName: string;         // 公司名称
  currentPrice?: string;       // 最新价格/涨跌幅概览
  marketSummary: string;       // 100~200字核心驱动逻辑与近期走势总结
  keyMetrics: {                // 关键指标（估值、动量、成交量异动）
    label: string;
    value: string;
    sentiment: 'bullish' | 'bearish' | 'neutral';
  }[];
  catalysts: string[];         // 近期核心催化剂（财报预期、新品发布、政策等）
  risks: string[];             // 潜在风险点
  technicalView: {             // 技术面与量价结构
    trend: string;             // 如 "突破颈线", "均线多头排列"
    supportLevel: string;      // 支撑位区间
    resistanceLevel: string;   // 阻力位区间
  };
  timestamp: string;           // 分析生成时间 (ISO)
}

export interface StockRecommendation {
  ticker: string;
  name: string;
  category?: string;
  changePct?: string;
  isRecent?: boolean;
}
