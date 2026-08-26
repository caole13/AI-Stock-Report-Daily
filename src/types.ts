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
  changePercent?: number | null;
  changePct?: string | null;
  volume?: number;
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
  changePercent?: number | null;
  changePct?: string | null;
  volume?: number;
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
