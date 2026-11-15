/**
 * 成交量与放量/缩量智能分析辅助工具 (Volume & RVOL Intelligence Helper)
 * 统一作为全市场宏观基准、行业成分股及异动龙头的量能计算与诊断唯一真实数据源。
 */

export interface StockBenchmark {
  name: string;
  sector: string;
  unit?: string;           // 资产价格单位，如 "USD", "点", "USD/盎司", "%", "USD/桶"
  volumeUnit?: string;     // 量能统计单位，如 "股", "手", "亿美元"
  sharesOutstanding?: number; // 总流通股本用于精准计算换手率
}

export const STOCK_BENCHMARKS: Record<string, StockBenchmark> = {
  // === 宏观大盘与核心大类资产 (Macro Assets) ===
  SPX: {
    name: "标普500大盘指数",
    sector: "全球核心资产 / 宏观股指中枢",
    unit: "点",
    volumeUnit: "股",
  },
  IXIC: {
    name: "纳斯达克综合指数",
    sector: "科技成长风向标 / 宏观股指中枢",
    unit: "点",
    volumeUnit: "股",
  },
  "GC=F": {
    name: "COMEX黄金主力期货",
    sector: "贵金属 / 避险与实际利率对冲",
    unit: "USD/盎司",
    volumeUnit: "手",
  },
  USO: {
    name: "美国原油基金ETF",
    sector: "大宗商品 / 原油期货跟踪ETF",
    unit: "USD/股",
    volumeUnit: "股",
  },
  "CL=F": {
    name: "WTI轻质原油主力合约",
    sector: "大宗商品 / 国际原油期货",
    unit: "USD/桶",
    volumeUnit: "手",
  },
  "^TNX": {
    name: "10年期美国国债收益率",
    sector: "全球资产定价之锚 / 无风险基准利率",
    unit: "%",
    volumeUnit: "亿美元",
  },
  DXY: {
    name: "ICE美元指数",
    sector: "全球外汇流动性 / 美元一篮子汇率",
    unit: "点",
    volumeUnit: "手",
  },
  "BTC-USD": {
    name: "比特币现货",
    sector: "数字资产 / 全球流动性风险偏好",
    unit: "USD",
    volumeUnit: "USD",
  },

  // === 行业核心龙头与异动个股 (Sector Leaders & Movers) ===
  // 流通股本 sharesOutstanding 依据标普权威最新股本口径设定，用于精确换手率计算
  NVDA: {
    name: "英伟达",
    sector: "信息技术 / 半导体算力",
    volumeUnit: "股",
    sharesOutstanding: 24_500_000_000,
  },
  MSFT: {
    name: "微软",
    sector: "信息技术 / 云计算与软件",
    volumeUnit: "股",
    sharesOutstanding: 7_430_000_000,
  },
  AAPL: {
    name: "苹果公司",
    sector: "信息技术 / 消费电子与AI",
    volumeUnit: "股",
    sharesOutstanding: 15_200_000_000,
  },
  TSLA: {
    name: "特斯拉",
    sector: "可选消费 / 汽车与AI机器人",
    volumeUnit: "股",
    sharesOutstanding: 3_180_000_000,
  },
  AMZN: {
    name: "亚马逊",
    sector: "非必需消费 / 云计算与电商",
    volumeUnit: "股",
    sharesOutstanding: 10_400_000_000,
  },
  GOOGL: {
    name: "谷歌A",
    sector: "通信服务 / 搜索引擎与AI",
    volumeUnit: "股",
    sharesOutstanding: 12_300_000_000,
  },
  META: {
    name: "Meta",
    sector: "通信服务 / 社交平台与开源AI",
    volumeUnit: "股",
    sharesOutstanding: 2_540_000_000,
  },
  PLTR: {
    name: "Palantir",
    sector: "信息技术 / 企业AI与大数据",
    volumeUnit: "股",
    sharesOutstanding: 2_260_000_000,
  },
  AMD: {
    name: "超威半导体",
    sector: "信息技术 / CPU与AI GPU",
    volumeUnit: "股",
    sharesOutstanding: 1_620_000_000,
  },
  AVGO: {
    name: "博通",
    sector: "信息技术 / 网络芯片与ASIC",
    volumeUnit: "股",
    sharesOutstanding: 4_680_000_000,
  },
  LLY: {
    name: "礼来制药",
    sector: "医疗健康 / 创新药与GLP-1",
    volumeUnit: "股",
    sharesOutstanding: 950_000_000,
  },
  UNH: {
    name: "联合健康",
    sector: "医疗健康 / 综合医保管理",
    volumeUnit: "股",
    sharesOutstanding: 920_000_000,
  },
  JNJ: {
    name: "强生公司",
    sector: "医疗健康 / 医疗器械与制药",
    volumeUnit: "股",
    sharesOutstanding: 2_400_000_000,
  },
  XOM: {
    name: "埃克森美孚",
    sector: "能源 / 石油与天然气巨头",
    volumeUnit: "股",
    sharesOutstanding: 4_020_000_000,
  },
  CVX: {
    name: "雪佛龙",
    sector: "能源 / 综合石油化工",
    volumeUnit: "股",
    sharesOutstanding: 1_820_000_000,
  },
  JPM: {
    name: "摩根大通",
    sector: "金融 / 综合银行巨头",
    volumeUnit: "股",
    sharesOutstanding: 2_830_000_000,
  },
  BAC: {
    name: "美国银行",
    sector: "金融 / 零售与商业银行",
    volumeUnit: "股",
    sharesOutstanding: 7_780_000_000,
  },
  COST: {
    name: "开市客",
    sector: "必需消费 / 仓储式会员零售",
    volumeUnit: "股",
    sharesOutstanding: 443_000_000,
  },
  PG: {
    name: "宝洁公司",
    sector: "必需消费 / 核心日化龙头",
    volumeUnit: "股",
    sharesOutstanding: 2_350_000_000,
  },
  CAT: {
    name: "卡特彼勒",
    sector: "工业 / 重型机械设备",
    volumeUnit: "股",
    sharesOutstanding: 485_000_000,
  },
  DELL: {
    name: "戴尔科技",
    sector: "信息技术 / AI基础设施与服务器",
    volumeUnit: "股",
    sharesOutstanding: 710_000_000,
  },
  PANW: {
    name: "帕洛阿尔托网络",
    sector: "信息技术 / 网络安全与AI",
    volumeUnit: "股",
    sharesOutstanding: 325_000_000,
  },
  CRM: {
    name: "赛富时",
    sector: "信息技术 / 企业软件与AI",
    volumeUnit: "股",
    sharesOutstanding: 965_000_000,
  },
  CRWD: {
    name: "CrowdStrike",
    sector: "信息技术 / 终端与云安全",
    volumeUnit: "股",
    sharesOutstanding: 245_000_000,
  },
  SMCI: {
    name: "超微电脑",
    sector: "信息技术 / AI服务器整机",
    volumeUnit: "股",
    sharesOutstanding: 585_000_000,
  },
  NIO: {
    name: "蔚来汽车",
    sector: "可选消费 / 智能电动车",
    volumeUnit: "股",
    sharesOutstanding: 2_080_000_000,
  },
  GTLB: {
    name: "GitLab",
    sector: "信息技术 / DevSecOps企业软件",
    volumeUnit: "股",
    sharesOutstanding: 156_000_000,
  },

  // 基准 ETF
  SPY: {
    name: "标普500ETF",
    sector: "大盘基准ETF",
    volumeUnit: "股",
    sharesOutstanding: 920_000_000,
  },
  QQQ: {
    name: "纳指100ETF",
    sector: "科技成长ETF",
    volumeUnit: "股",
    sharesOutstanding: 520_000_000,
  },
  GLD: {
    name: "黄金ETF",
    sector: "贵金属现货ETF",
    volumeUnit: "股",
    sharesOutstanding: 240_000_000,
  },
};

/**
 * 智能解析标的基准对象（涵盖宏观代码、ETF代码及中英简称）
 */
export function getStockBenchmark(ticker: string): StockBenchmark {
  const clean = (ticker || "").toUpperCase().trim();
  if (STOCK_BENCHMARKS[clean]) return STOCK_BENCHMARKS[clean];

  // 别名与大盘宏观资产匹配
  if (clean.includes("SPX") || clean.includes("GSPC") || clean.includes("标普")) return STOCK_BENCHMARKS["SPX"];
  if (clean.includes("IXIC") || clean.includes("NDX") || clean.includes("纳指") || clean.includes("纳斯达克")) return STOCK_BENCHMARKS["IXIC"];
  if (clean.includes("GC") || clean.includes("黄金") || clean.includes("GOLD")) return STOCK_BENCHMARKS["GC=F"];
  if (clean.includes("USO") || clean.includes("原油基金")) return STOCK_BENCHMARKS["USO"];
  if (clean.includes("CL") || clean.includes("WTI") || clean.includes("原油")) return STOCK_BENCHMARKS["CL=F"];
  if (clean.includes("TNX") || clean.includes("美债") || clean.includes("国债")) return STOCK_BENCHMARKS["^TNX"];
  if (clean.includes("DXY") || clean.includes("DX-Y") || clean.includes("美元")) return STOCK_BENCHMARKS["DXY"];
  if (clean.includes("BTC") || clean.includes("比特币")) return STOCK_BENCHMARKS["BTC-USD"];

  // 常见个股别名匹配
  if (clean.includes("英伟达") || clean === "NVDA") return STOCK_BENCHMARKS["NVDA"];
  if (clean.includes("特斯拉") || clean === "TSLA") return STOCK_BENCHMARKS["TSLA"];
  if (clean.includes("苹果") || clean === "AAPL") return STOCK_BENCHMARKS["AAPL"];
  if (clean.includes("微软") || clean === "MSFT") return STOCK_BENCHMARKS["MSFT"];
  if (clean.includes("亚马逊") || clean === "AMZN") return STOCK_BENCHMARKS["AMZN"];
  if (clean.includes("谷歌") || clean === "GOOGL" || clean === "GOOG") return STOCK_BENCHMARKS["GOOGL"];
  if (clean.includes("META")) return STOCK_BENCHMARKS["META"];
  if (clean.includes("礼来") || clean === "LLY") return STOCK_BENCHMARKS["LLY"];
  if (clean.includes("联合健康") || clean === "UNH") return STOCK_BENCHMARKS["UNH"];
  if (clean.includes("强生") || clean === "JNJ") return STOCK_BENCHMARKS["JNJ"];
  if (clean.includes("埃克森") || clean.includes("美孚") || clean === "XOM") return STOCK_BENCHMARKS["XOM"];
  if (clean.includes("雪佛龙") || clean === "CVX") return STOCK_BENCHMARKS["CVX"];
  if (clean.includes("摩根大通") || clean === "JPM") return STOCK_BENCHMARKS["JPM"];
  if (clean.includes("美银") || clean.includes("美国银行") || clean === "BAC") return STOCK_BENCHMARKS["BAC"];
  if (clean.includes("开市客") || clean === "COST") return STOCK_BENCHMARKS["COST"];
  if (clean.includes("宝洁") || clean === "PG") return STOCK_BENCHMARKS["PG"];
  if (clean.includes("卡特彼勒") || clean === "CAT") return STOCK_BENCHMARKS["CAT"];
  if (clean.includes("戴尔") || clean === "DELL") return STOCK_BENCHMARKS["DELL"];
  if (clean.includes("帕洛阿尔托") || clean === "PANW") return STOCK_BENCHMARKS["PANW"];
  if (clean.includes("蔚来") || clean === "NIO") return STOCK_BENCHMARKS["NIO"];
  if (clean.includes("GITLAB") || clean === "GTLB") return STOCK_BENCHMARKS["GTLB"];
  if (clean.includes("超威") || clean === "AMD") return STOCK_BENCHMARKS["AMD"];
  if (clean.includes("博通") || clean === "AVGO") return STOCK_BENCHMARKS["AVGO"];
  if (clean.includes("PALANTIR") || clean === "PLTR") return STOCK_BENCHMARKS["PLTR"];
  if (clean.includes("赛富时") || clean === "CRM") return STOCK_BENCHMARKS["CRM"];
  if (clean.includes("CROWD") || clean === "CRWD") return STOCK_BENCHMARKS["CRWD"];
  if (clean.includes("超微电脑") || clean === "SMCI") return STOCK_BENCHMARKS["SMCI"];

  // 默认兜底（仅提供基础名称与流通股本单位）
  return {
    name: ticker,
    sector: "美股活跃成分标的",
    volumeUnit: "股",
  };
}

/**
 * 权威生成 Yahoo Finance 官方个股与指数直跳链接
 */
export function getYahooFinanceUrl(ticker: string): string {
  if (!ticker) return "https://finance.yahoo.com/";
  const clean = ticker.trim().toUpperCase();
  if (clean === "SPX" || clean === "^GSPC" || clean.includes("标普")) return "https://finance.yahoo.com/quote/%5EGSPC/";
  if (clean === "IXIC" || clean === "^IXIC" || clean.includes("纳指") || clean.includes("纳斯达克")) return "https://finance.yahoo.com/quote/%5EIXIC/";
  if (clean === "TNX" || clean === "^TNX" || clean.includes("美债") || clean.includes("国债")) return "https://finance.yahoo.com/quote/%5ETNX/";
  if (clean === "DXY" || clean === "DX-Y.NYB" || clean.includes("美元")) return "https://finance.yahoo.com/quote/DX-Y.NYB/";
  if (clean === "GC=F" || clean === "GOLD" || clean.includes("黄金")) return "https://finance.yahoo.com/quote/GC=F/";
  if (clean === "CL=F" || clean === "WTI" || clean === "OIL" || clean.includes("原油连续")) return "https://finance.yahoo.com/quote/CL=F/";
  if (clean === "BTC" || clean === "BTC-USD" || clean.includes("比特币")) return "https://finance.yahoo.com/quote/BTC-USD/";
  if (clean === "USO" || clean.includes("原油基金")) return "https://finance.yahoo.com/quote/USO/";
  return `https://finance.yahoo.com/quote/${encodeURIComponent(clean)}/`;
}

export function parseChangePct(str?: string | number | null): number | null {
  if (str === null || str === undefined) return null;
  if (typeof str === 'number') return isNaN(str) ? null : str;
  const cleaned = String(str).replace('%', '').replace('+', '').trim();
  if (!cleaned) return null;
  const val = parseFloat(cleaned);
  return isNaN(val) ? null : (String(str).includes('-') ? -Math.abs(val) : val);
}

export function parseRvol(rvol?: number | string | null): number | null {
  if (rvol === null || rvol === undefined) return null;
  if (typeof rvol === 'number') return isNaN(rvol) ? null : rvol;
  const cleaned = String(rvol).replace('x', '').replace('X', '').replace('约', '').trim();
  if (!cleaned) return null;
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

export function formatVolumeNumber(vol?: number, unit: string = "股"): string | undefined {
  if (!vol || isNaN(vol) || vol <= 0) return undefined;
  if (unit === "手") {
    if (vol >= 1e6) {
      const val = Math.floor((vol / 1e6) * 10) / 10;
      return `${val.toFixed(1)}M 手`;
    }
    if (vol >= 1e3) {
      const val = Math.floor((vol / 1e3) * 10) / 10;
      return `${val.toFixed(1)}K 手`;
    }
    return `${Math.round(vol).toLocaleString()} 手`;
  }
  if (unit === "亿美元") {
    return `${vol >= 1000 ? (vol / 1000).toFixed(1) + "万亿" : Math.round(vol)} 亿美元`;
  }
  if (vol >= 1e9) {
    const val = Math.floor((vol / 1e9) * 100) / 100;
    return `${val.toFixed(2)}B ${unit}`;
  }
  if (vol >= 1e6) {
    // 证券金融终端（如用户截图中的 155,979,384 对应 155.9M）统一采用一位小数向下截断标准 (Floor Truncation)
    const millions = Math.floor((vol / 1e6) * 10) / 10;
    return `${millions.toFixed(1)}M ${unit}`;
  }
  if (vol >= 1e3) {
    const thousands = Math.floor((vol / 1e3) * 10) / 10;
    return `${thousands.toFixed(1)}K ${unit}`;
  }
  return `${Math.round(vol).toLocaleString()} ${unit}`;
}

export interface ResolvedStockVolume {
  todayVol?: number;
  avgVol?: number;
  rvol?: number | null;
  volumeUnit: string;
  sharesOutstanding?: number;
  turnoverRate?: number;
  turnoverRateStr?: string;
}

/**
 * 全局统一解析任意标的（宏观资产、ETF或行业龙头股）的成交量数据
 * 严格秉持真实原则，绝不使用典型值或波动率公式捏造假数据
 */
export function resolveStockVolumeData(
  ticker: string,
  rawRvolInput?: number | string | null,
  rawTodayVolInput?: number,
  rawAvgVolInput?: number,
  changePercent?: number | null
): ResolvedStockVolume {
  const benchmark = getStockBenchmark(ticker);
  const volumeUnit = benchmark.volumeUnit || "股";
  const sharesOutstanding = benchmark.sharesOutstanding;

  // 1. 如果有明确且真实的今日量与均量输入，且两者均大于0
  if (rawTodayVolInput && rawTodayVolInput > 0 && rawAvgVolInput && rawAvgVolInput > 0) {
    const computedRvol = Number((rawTodayVolInput / rawAvgVolInput).toFixed(2));
    const todayVol = Math.round(rawTodayVolInput);
    const avgVol = Math.round(rawAvgVolInput);
    let turnoverRate: number | undefined;
    let turnoverRateStr: string | undefined;
    if (sharesOutstanding && sharesOutstanding > 0) {
      const rate = (todayVol / sharesOutstanding) * 100;
      turnoverRate = Number(rate.toFixed(2));
      turnoverRateStr = `${rate.toFixed(2)}%`;
    }

    return {
      todayVol,
      avgVol,
      rvol: computedRvol,
      volumeUnit,
      sharesOutstanding,
      turnoverRate,
      turnoverRateStr,
    };
  }

  // 2. 尝试解析明确传入的 RVOL
  let rvol: number | null = null;
  if (rawRvolInput !== null && rawRvolInput !== undefined && String(rawRvolInput).trim() !== "") {
    const parsed = parseRvol(rawRvolInput);
    if (typeof parsed === "number" && !isNaN(parsed) && parsed > 0) {
      rvol = parsed;
    }
  }

  // 3. 严格禁止伪造！若无明确实测 RVOL，严格保持 null，绝不使用估算或涨跌幅公式推算！
  // 严格禁止假数据与静态基准冒充实测！均量缺失时保持 undefined，绝不回退静态基准表
  const avgVol = rawAvgVolInput && rawAvgVolInput > 0 ? Math.round(rawAvgVolInput) : undefined;
  const todayVol = rawTodayVolInput && rawTodayVolInput > 0 ? Math.round(rawTodayVolInput) : undefined;

  // 若今日量和历史均量均真实有效且 rvol 缺失，可真实计算
  const finalRvol = (rvol !== null && rvol > 0)
    ? Number(rvol.toFixed(2))
    : (todayVol && avgVol && todayVol > 0 && avgVol > 0 ? Number((todayVol / avgVol).toFixed(2)) : null);

  let turnoverRate: number | undefined;
  let turnoverRateStr: string | undefined;
  if (sharesOutstanding && sharesOutstanding > 0 && todayVol && todayVol > 0) {
    const rate = (todayVol / sharesOutstanding) * 100;
    turnoverRate = Number(rate.toFixed(2));
    turnoverRateStr = `${rate.toFixed(2)}%`;
  }

  return {
    todayVol,
    avgVol,
    rvol: finalRvol,
    volumeUnit,
    sharesOutstanding,
    turnoverRate,
    turnoverRateStr,
  };
}

export interface VolumeAnalysis {
  rvol: number | null;
  rvolStr: string;
  isExpansion: boolean;     // 放量 (RVOL >= 1.05)
  isContraction: boolean;   // 缩量 (RVOL <= 0.95)
  isNeutral: boolean;       // 平量 (0.95 < RVOL < 1.05)
  deltaPercent: number;     // 相对均量的百分比变化 (如 +24% 或 -18%)
  deltaPercentStr: string;  // 格式化字符串 (如 "+24%" 或 "-18%")
  badgeLabel: string;       // 如 "放量 +24%" 或 "缩量 -18%"
  badgeVariant: 'expansion' | 'contraction' | 'neutral';
  interpretation: string;   // 量能行为专业交易解释
  todayVol?: number;
  avgVol?: number;
  todayVolumeFormatted?: string;
  avgVolumeFormatted?: string;
  turnoverRate?: number;    // 换手率数值，例如 0.64 (%)
  turnoverRateStr?: string; // 格式化换手率，例如 "0.64%"
}

/**
 * 精准计算换手率工具函数
 */
export function calculateTurnoverRate(
  ticker: string,
  todayVol?: number,
  customShares?: number
): { turnover: number; turnoverStr: string } | null {
  const benchmark = getStockBenchmark(ticker);
  const shares = customShares && customShares > 0 ? customShares : benchmark.sharesOutstanding;
  if (!todayVol || todayVol <= 0 || !shares || shares <= 0) {
    return null;
  }
  const rate = (todayVol / shares) * 100;
  return {
    turnover: Number(rate.toFixed(2)),
    turnoverStr: `${rate.toFixed(2)}%`,
  };
}

export function analyzeVolume(
  rvolInput?: number | string | null,
  changePercent?: number | null,
  todayVol?: number,
  avgVol?: number,
  volumeUnit: string = "股",
  tickerOrShares?: string | number
): VolumeAnalysis {
  let rvol = parseRvol(rvolInput);

  // If todayVol and avgVol are provided, derive precise rvol
  if (todayVol && avgVol && avgVol > 0 && todayVol > 0) {
    rvol = Number((todayVol / avgVol).toFixed(2));
  }

  // 计算换手率
  let turnoverRate: number | undefined;
  let turnoverRateStr: string | undefined;
  let shares: number | undefined;
  if (typeof tickerOrShares === "number" && tickerOrShares > 0) {
    shares = tickerOrShares;
  } else if (typeof tickerOrShares === "string" && tickerOrShares) {
    const benchmark = getStockBenchmark(tickerOrShares);
    shares = benchmark.sharesOutstanding;
  }

  if (todayVol && todayVol > 0 && shares && shares > 0) {
    const rate = (todayVol / shares) * 100;
    turnoverRate = Number(rate.toFixed(2));
    turnoverRateStr = `${rate.toFixed(2)}%`;
  }

  // 若量比缺失或无效，严格返回空状态诊断，绝不伪造
  if (rvol === null || rvol <= 0) {
    return {
      rvol: null,
      rvolStr: "暂无",
      isExpansion: false,
      isContraction: false,
      isNeutral: false,
      deltaPercent: 0,
      deltaPercentStr: "--",
      badgeLabel: "量比缺失",
      badgeVariant: "neutral",
      interpretation: "当日成交量或量比数据缺失，未生成量能判断。",
      todayVol: (todayVol && todayVol > 0) ? todayVol : undefined,
      avgVol: (avgVol && avgVol > 0) ? avgVol : undefined,
      todayVolumeFormatted: (todayVol && todayVol > 0) ? formatVolumeNumber(todayVol, volumeUnit) : undefined,
      avgVolumeFormatted: (avgVol && avgVol > 0) ? formatVolumeNumber(avgVol, volumeUnit) : undefined,
      turnoverRate,
      turnoverRateStr,
    };
  }

  // Calculate percentage vs average (rvol 1.14 => +14%, rvol 0.72 => -28%)
  const deltaPercent = Math.round((rvol - 1.0) * 100);
  const deltaPercentStr = `${deltaPercent > 0 ? '+' : ''}${deltaPercent}%`;

  const isExpansion = rvol >= 1.05;
  const isContraction = rvol <= 0.95;
  const isNeutral = !isExpansion && !isContraction;

  let badgeLabel = '平量 1.0x';
  let badgeVariant: 'expansion' | 'contraction' | 'neutral' = 'neutral';

  if (isExpansion) {
    badgeLabel = `放量 ${deltaPercentStr}`;
    badgeVariant = 'expansion';
  } else if (isContraction) {
    badgeLabel = `缩量 ${deltaPercentStr}`;
    badgeVariant = 'contraction';
  } else {
    badgeLabel = `平量 ${rvol.toFixed(2)}x`;
    badgeVariant = 'neutral';
  }

  // Generate trading interpretation based on price direction & volume behavior
  const isUp = (changePercent ?? 0) > 0.1;
  const isDown = (changePercent ?? 0) < -0.1;

  let interpretation = '';
  if (isExpansion && isUp) {
    interpretation = `【量价齐升 · 买盘积极】当日成交量较平均水平放大 ${Math.abs(deltaPercent)}% (RVOL ${rvol.toFixed(2)}x)${turnoverRateStr ? `，换手率达 ${turnoverRateStr}` : ''}，增量资金主动推升，多头在关键技术位有显著的主动买盘承接，持筹信心强。`;
  } else if (isExpansion && isDown) {
    interpretation = `【放量下跌 · 筹码松动】当日成交量较均量放大 ${Math.abs(deltaPercent)}% (RVOL ${rvol.toFixed(2)}x)${turnoverRateStr ? `，换手率达 ${turnoverRateStr}` : ''}，下跌伴随抛盘集中释放，提示局部获利盘兑现或风险偏好降温，需密切关注风控失效位。`;
  } else if (isContraction && isUp) {
    interpretation = `【缩量上攻 · 筹码锁仓良好】价格录得涨幅但成交量较均线萎缩 ${Math.abs(deltaPercent)}% (RVOL ${rvol.toFixed(2)}x)${turnoverRateStr ? `，换手率约 ${turnoverRateStr}` : ''}，表明盘面抛压极轻、主力筹码锁定度高，但若要拓展上方空间仍需后续补量确认。`;
  } else if (isContraction && isDown) {
    interpretation = `【缩量调整 · 抛压逐步枯竭】回调伴随成交量收缩 ${Math.abs(deltaPercent)}% (RVOL ${rvol.toFixed(2)}x)${turnoverRateStr ? `，换手率仅 ${turnoverRateStr}` : ''}，无明显恐慌盘出逃迹象，属于技术面常态休整或洗盘，下行阻力趋于增大。`;
  } else if (isNeutral && isUp) {
    interpretation = `【温和收红 · 常态换手】成交量与均量基本持平 (RVOL ${rvol.toFixed(2)}x)${turnoverRateStr ? `，换手率 ${turnoverRateStr}` : ''}，市场交投秩序井然，多头依托均线平稳推进。`;
  } else if (isNeutral && isDown) {
    interpretation = `【微幅整理 · 均量拉锯】成交量处于近期平均水准 (RVOL ${rvol.toFixed(2)}x)${turnoverRateStr ? `，换手率 ${turnoverRateStr}` : ''}，多空双方处于博弈均衡态，静待新的宏观或事件催化剂破局。`;
  } else {
    interpretation = `【窄幅震荡 · 存量博弈】成交量与平均日均量相当 (RVOL ${rvol.toFixed(2)}x)${turnoverRateStr ? `，换手率 ${turnoverRateStr}` : ''}，市场观望情绪主导，资金以日内调仓防守为主。`;
  }

  return {
    rvol,
    rvolStr: `${rvol.toFixed(2)}x`,
    isExpansion,
    isContraction,
    isNeutral,
    deltaPercent,
    deltaPercentStr,
    badgeLabel,
    badgeVariant,
    interpretation,
    todayVol,
    avgVol,
    todayVolumeFormatted: formatVolumeNumber(todayVol, volumeUnit),
    avgVolumeFormatted: formatVolumeNumber(avgVol, volumeUnit),
    turnoverRate,
    turnoverRateStr,
  };
}

export function formatMarketCap(cap?: number | null): string | null {
  if (cap == null || isNaN(cap) || cap <= 0) return null;
  if (cap >= 1e12) return `$${(cap / 1e12).toFixed(2)}T`;
  if (cap >= 1e9) return `$${(cap / 1e9).toFixed(2)}B`;
  if (cap >= 1e6) return `$${(cap / 1e6).toFixed(2)}M`;
  return `$${cap.toLocaleString()}`;
}
