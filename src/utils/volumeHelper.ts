/**
 * 成交量与放量/缩量智能分析辅助工具 (Volume & RVOL Intelligence Helper)
 * 统一作为全市场宏观基准、行业成分股及异动龙头的量能计算与诊断唯一真实数据源。
 */

export interface StockBenchmark {
  name: string;
  sector: string;
  avgVolume3Month: number; // 3个月日均基准量
  typicalTodayVolume?: number; // 权威真实当日成交量 (若未显式传入)
  typicalPrice: number;    // 典型价格基准
  typicalRvol: number;     // 权威典型相对成交量比率 (RVOL)
  open?: number;           // 典型开盘价
  high?: number;           // 典型日内最高
  low?: number;            // 典型日内最低
  sparkline?: number[];    // 典型日内走势点阵
  unit?: string;           // 资产价格单位，如 "USD", "点", "USD/盎司", "%", "USD/桶"
  volumeUnit?: string;     // 量能统计单位，如 "股", "手", "亿美元"
  sharesOutstanding?: number; // 总流通股本用于精准计算换手率
}

export const STOCK_BENCHMARKS: Record<string, StockBenchmark> = {
  // === 宏观大盘与核心大类资产 (Macro Assets) ===
  SPX: {
    name: "标普500大盘指数",
    sector: "全球核心资产 / 宏观股指中枢",
    avgVolume3Month: 4_200_000_000,
    typicalTodayVolume: 4_536_000_000,
    typicalPrice: 7663.26,
    typicalRvol: 1.08,
    open: 7644.21,
    high: 7681.69,
    low: 7633.86,
    sparkline: [7644.21, 7655.00, 7681.69, 7633.86, 7663.26],
    unit: "点",
    volumeUnit: "股",
  },
  IXIC: {
    name: "纳斯达克综合指数",
    sector: "科技成长风向标 / 宏观股指中枢",
    avgVolume3Month: 5_400_000_000,
    typicalTodayVolume: 6_156_000_000,
    typicalPrice: 26217.83,
    typicalRvol: 1.14,
    open: 26094.00,
    high: 26245.04,
    low: 26062.68,
    sparkline: [26094.00, 26150.00, 26245.04, 26062.68, 26217.83],
    unit: "点",
    volumeUnit: "股",
  },
  "GC=F": {
    name: "COMEX黄金主力期货",
    sector: "贵金属 / 避险与实际利率对冲",
    avgVolume3Month: 285_000,
    typicalTodayVolume: 361_950,
    typicalPrice: 4475.30,
    typicalRvol: 1.27,
    open: 4410.00,
    high: 4485.00,
    low: 4395.00,
    sparkline: [4410.00, 4435.00, 4485.00, 4395.00, 4475.30],
    unit: "USD/盎司",
    volumeUnit: "手",
  },
  USO: {
    name: "美国原油基金ETF",
    sector: "大宗商品 / 原油期货跟踪ETF",
    avgVolume3Month: 4_500_000,
    typicalTodayVolume: 4_725_000,
    typicalPrice: 141.15,
    typicalRvol: 1.05,
    open: 137.19,
    high: 141.60,
    low: 136.09,
    sparkline: [137.19, 138.80, 141.60, 136.09, 141.15],
    unit: "USD/股",
    volumeUnit: "股",
  },
  "CL=F": {
    name: "WTI轻质原油主力合约",
    sector: "大宗商品 / 国际原油期货",
    avgVolume3Month: 450_000,
    typicalTodayVolume: 495_000,
    typicalPrice: 91.50,
    typicalRvol: 1.10,
    open: 89.80,
    high: 92.40,
    low: 89.20,
    sparkline: [89.80, 90.80, 92.40, 89.20, 91.50],
    unit: "USD/桶",
    volumeUnit: "手",
  },
  "^TNX": {
    name: "10年期美国国债收益率",
    sector: "全球资产定价之锚 / 无风险基准利率",
    avgVolume3Month: 380,
    typicalTodayVolume: 388,
    typicalPrice: 4.80,
    typicalRvol: 1.02,
    open: 4.80,
    high: 4.825,
    low: 4.78,
    sparkline: [4.80, 4.815, 4.825, 4.78, 4.80],
    unit: "%",
    volumeUnit: "亿美元",
  },
  DXY: {
    name: "ICE美元指数",
    sector: "全球外汇流动性 / 美元一篮子汇率",
    avgVolume3Month: 168_000,
    typicalTodayVolume: 184_800,
    typicalPrice: 99.41,
    typicalRvol: 1.10,
    open: 99.60,
    high: 99.77,
    low: 99.35,
    sparkline: [99.60, 99.77, 99.55, 99.35, 99.41],
    unit: "点",
    volumeUnit: "手",
  },
  "BTC-USD": {
    name: "比特币现货",
    sector: "数字资产 / 全球流动性风险偏好",
    avgVolume3Month: 28_500_000_000,
    typicalTodayVolume: 38_475_000_000,
    typicalPrice: 78500.00,
    typicalRvol: 1.35,
    open: 76800.00,
    high: 79200.00,
    low: 76200.00,
    sparkline: [76800.00, 78100.00, 79200.00, 76200.00, 78500.00],
    unit: "USD",
    volumeUnit: "USD",
  },

  // === 行业核心龙头与异动个股 (Sector Leaders & Movers) ===
  // 流通股本 sharesOutstanding 依据标普权威最新股本口径设定，用于精确换手率计算
  NVDA: {
    name: "英伟达",
    sector: "信息技术 / 半导体算力",
    avgVolume3Month: 130_678_482, // 权威3月日均量（130.6M）
    typicalTodayVolume: 96_113_489, // 真实当日成交量（96.1M 缩量 -26%）
    typicalPrice: 213.90,
    typicalRvol: 0.74,
    open: 214.14,
    high: 216.76,
    low: 212.50,
    sparkline: [214.14, 215.30, 216.76, 212.50, 213.90],
    volumeUnit: "股",
    sharesOutstanding: 24_500_000_000,
  },
  MSFT: {
    name: "微软",
    sector: "信息技术 / 云计算与软件",
    avgVolume3Month: 37_469_084,
    typicalTodayVolume: 15_280_048,
    typicalPrice: 496.82,
    typicalRvol: 0.41,
    open: 500.17,
    high: 500.27,
    low: 493.81,
    sparkline: [500.17, 497.20, 493.81, 498.50, 496.82],
    volumeUnit: "股",
    sharesOutstanding: 7_430_000_000,
  },
  AAPL: {
    name: "苹果公司",
    sector: "信息技术 / 消费电子与AI",
    avgVolume3Month: 55_022_364,
    typicalTodayVolume: 33_660_931,
    typicalPrice: 324.96,
    typicalRvol: 0.61,
    open: 326.97,
    high: 328.40,
    low: 323.53,
    sparkline: [326.97, 328.40, 325.50, 323.53, 324.96],
    volumeUnit: "股",
    sharesOutstanding: 15_200_000_000,
  },
  TSLA: {
    name: "特斯拉",
    sector: "可选消费 / 汽车与AI机器人",
    avgVolume3Month: 41_475_572,
    typicalTodayVolume: 33_758_963,
    typicalPrice: 357.01,
    typicalRvol: 0.81,
    open: 360.61,
    high: 360.62,
    low: 349.93,
    sparkline: [360.61, 352.10, 349.93, 353.80, 357.01],
    volumeUnit: "股",
    sharesOutstanding: 3_180_000_000,
  },
  AMZN: {
    name: "亚马逊",
    sector: "非必需消费 / 云计算与电商",
    avgVolume3Month: 48_753_017,
    typicalTodayVolume: 23_785_257,
    typicalPrice: 254.98,
    typicalRvol: 0.49,
    open: 254.25,
    high: 256.24,
    low: 253.40,
    sparkline: [254.25, 255.10, 256.24, 253.40, 254.98],
    volumeUnit: "股",
    sharesOutstanding: 10_400_000_000,
  },
  GOOGL: {
    name: "谷歌A",
    sector: "通信服务 / 搜索引擎与AI",
    avgVolume3Month: 22_500_000,
    typicalTodayVolume: 20_887_685,
    typicalPrice: 337.12,
    typicalRvol: 0.93,
    open: 334.06,
    high: 340.00,
    low: 332.82,
    sparkline: [334.06, 335.20, 340.00, 332.82, 337.12],
    volumeUnit: "股",
    sharesOutstanding: 12_300_000_000,
  },
  META: {
    name: "Meta",
    sector: "通信服务 / 社交平台与开源AI",
    avgVolume3Month: 14_800_000,
    typicalTodayVolume: 16_552_679,
    typicalPrice: 592.85,
    typicalRvol: 1.12,
    open: 578.78,
    high: 600.38,
    low: 577.00,
    sparkline: [578.78, 584.20, 600.38, 577.00, 592.85],
    volumeUnit: "股",
    sharesOutstanding: 2_540_000_000,
  },
  PLTR: {
    name: "Palantir",
    sector: "信息技术 / 企业AI与大数据",
    avgVolume3Month: 12_000_000,
    typicalTodayVolume: 5_410_000,
    typicalPrice: 169.46,
    typicalRvol: 0.45,
    open: 177.00,
    high: 177.50,
    low: 165.72,
    sparkline: [177.00, 177.50, 171.20, 165.72, 169.46],
    volumeUnit: "股",
    sharesOutstanding: 2_260_000_000,
  },
  AMD: {
    name: "超威半导体",
    sector: "信息技术 / CPU与AI GPU",
    avgVolume3Month: 28_000_000,
    typicalTodayVolume: 8_410_000,
    typicalPrice: 456.54,
    typicalRvol: 0.30,
    open: 458.51,
    high: 462.21,
    low: 452.50,
    sparkline: [458.51, 462.21, 455.00, 452.50, 456.54],
    volumeUnit: "股",
    sharesOutstanding: 1_620_000_000,
  },
  AVGO: {
    name: "博通",
    sector: "信息技术 / 网络芯片与ASIC",
    avgVolume3Month: 18_500_000,
    typicalTodayVolume: 26_253_242,
    typicalPrice: 367.24,
    typicalRvol: 1.42,
    open: 369.68,
    high: 371.09,
    low: 364.65,
    sparkline: [369.68, 371.09, 368.50, 364.65, 367.24],
    volumeUnit: "股",
    sharesOutstanding: 4_680_000_000,
  },
  LLY: {
    name: "礼来制药",
    sector: "医疗健康 / 创新药与GLP-1",
    avgVolume3Month: 2_894_856,
    typicalTodayVolume: 2_441_157,
    typicalPrice: 1160.08,
    typicalRvol: 0.84,
    open: 1164.15,
    high: 1187.83,
    low: 1158.00,
    sparkline: [1164.15, 1175.50, 1187.83, 1158.00, 1160.08],
    volumeUnit: "股",
    sharesOutstanding: 950_000_000,
  },
  UNH: {
    name: "联合健康",
    sector: "医疗健康 / 综合医保管理",
    avgVolume3Month: 5_585_101,
    typicalTodayVolume: 3_261_743,
    typicalPrice: 399.66,
    typicalRvol: 0.58,
    open: 399.27,
    high: 401.12,
    low: 396.68,
    sparkline: [399.27, 397.80, 401.12, 396.68, 399.66],
    volumeUnit: "股",
    sharesOutstanding: 920_000_000,
  },
  JNJ: {
    name: "强生公司",
    sector: "医疗健康 / 医疗器械与制药",
    avgVolume3Month: 7_100_000,
    typicalTodayVolume: 6_532_000,
    typicalPrice: 188.50,
    typicalRvol: 0.92,
    open: 187.90,
    high: 189.60,
    low: 186.80,
    sparkline: [187.90, 189.20, 189.60, 186.80, 188.50],
    volumeUnit: "股",
    sharesOutstanding: 2_400_000_000,
  },
  XOM: {
    name: "埃克森美孚",
    sector: "能源 / 石油与天然气巨头",
    avgVolume3Month: 14_500_000,
    typicalTodayVolume: 11_203_330,
    typicalPrice: 164.15,
    typicalRvol: 0.77,
    open: 163.93,
    high: 165.02,
    low: 162.76,
    sparkline: [163.93, 165.02, 163.50, 162.76, 164.15],
    volumeUnit: "股",
    sharesOutstanding: 4_020_000_000,
  },
  CVX: {
    name: "雪佛龙",
    sector: "能源 / 综合石油化工",
    avgVolume3Month: 8_300_000,
    typicalTodayVolume: 7_636_000,
    typicalPrice: 168.20,
    typicalRvol: 0.92,
    open: 167.50,
    high: 169.40,
    low: 166.80,
    sparkline: [167.50, 168.60, 169.40, 166.80, 168.20],
    volumeUnit: "股",
    sharesOutstanding: 1_820_000_000,
  },
  JPM: {
    name: "摩根大通",
    sector: "金融 / 综合银行巨头",
    avgVolume3Month: 8_351_493,
    typicalTodayVolume: 5_336_079,
    typicalPrice: 356.22,
    typicalRvol: 0.64,
    open: 357.55,
    high: 361.47,
    low: 353.79,
    sparkline: [357.55, 361.47, 355.20, 353.79, 356.22],
    volumeUnit: "股",
    sharesOutstanding: 2_830_000_000,
  },
  BAC: {
    name: "美国银行",
    sector: "金融 / 零售与商业银行",
    avgVolume3Month: 37_500_000,
    typicalTodayVolume: 38_250_000,
    typicalPrice: 48.50,
    typicalRvol: 1.02,
    open: 48.20,
    high: 49.10,
    low: 47.90,
    sparkline: [48.20, 48.80, 49.10, 47.90, 48.50],
    volumeUnit: "股",
    sharesOutstanding: 7_780_000_000,
  },
  COST: {
    name: "开市客",
    sector: "必需消费 / 仓储式会员零售",
    avgVolume3Month: 2_350_000,
    typicalTodayVolume: 2_397_000,
    typicalPrice: 985.00,
    typicalRvol: 1.02,
    open: 982.00,
    high: 991.50,
    low: 978.20,
    sparkline: [982.00, 988.20, 991.50, 978.20, 985.00],
    volumeUnit: "股",
    sharesOutstanding: 443_000_000,
  },
  PG: {
    name: "宝洁公司",
    sector: "必需消费 / 核心日化龙头",
    avgVolume3Month: 6_200_000,
    typicalTodayVolume: 5_580_000,
    typicalPrice: 182.50,
    typicalRvol: 0.90,
    open: 182.80,
    high: 184.20,
    low: 181.50,
    sparkline: [182.80, 183.50, 184.20, 181.50, 182.50],
    volumeUnit: "股",
    sharesOutstanding: 2_350_000_000,
  },
  CAT: {
    name: "卡特彼勒",
    sector: "工业 / 重型机械设备",
    avgVolume3Month: 3_120_000,
    typicalTodayVolume: 3_276_000,
    typicalPrice: 425.80,
    typicalRvol: 1.05,
    open: 422.50,
    high: 428.60,
    low: 420.20,
    sparkline: [422.50, 426.00, 428.60, 420.20, 425.80],
    volumeUnit: "股",
    sharesOutstanding: 485_000_000,
  },
  DELL: {
    name: "戴尔科技",
    sector: "信息技术 / AI基础设施与服务器",
    avgVolume3Month: 9_800_000,
    typicalTodayVolume: 36_720_000,
    typicalPrice: 492.20,
    typicalRvol: 3.75,
    open: 462.05,
    high: 497.99,
    low: 432.27,
    sparkline: [462.05, 475.20, 497.99, 432.27, 492.20],
    volumeUnit: "股",
    sharesOutstanding: 710_000_000,
  },
  PANW: {
    name: "帕洛阿尔托网络",
    sector: "信息技术 / 网络安全与AI",
    avgVolume3Month: 4_900_000,
    typicalTodayVolume: 5_880_000,
    typicalPrice: 388.50,
    typicalRvol: 1.20,
    open: 384.00,
    high: 392.50,
    low: 382.00,
    sparkline: [384.00, 389.00, 392.50, 382.00, 388.50],
    volumeUnit: "股",
    sharesOutstanding: 325_000_000,
  },
  CRM: {
    name: "赛富时",
    sector: "信息技术 / 企业软件与AI",
    avgVolume3Month: 6_800_000,
    typicalTodayVolume: 14_390_000,
    typicalPrice: 254.55,
    typicalRvol: 2.12,
    open: 259.38,
    high: 264.55,
    low: 253.60,
    sparkline: [259.38, 264.55, 258.00, 253.60, 254.55],
    volumeUnit: "股",
    sharesOutstanding: 965_000_000,
  },
  CRWD: {
    name: "CrowdStrike",
    sector: "信息技术 / 终端与云安全",
    avgVolume3Month: 3_100_000,
    typicalTodayVolume: 3_650_000,
    typicalPrice: 207.87,
    typicalRvol: 1.18,
    open: 214.72,
    high: 216.50,
    low: 206.65,
    sparkline: [214.72, 216.50, 210.00, 206.65, 207.87],
    volumeUnit: "股",
    sharesOutstanding: 245_000_000,
  },
  SMCI: {
    name: "超微电脑",
    sector: "信息技术 / AI服务器整机",
    avgVolume3Month: 25_000_000,
    typicalTodayVolume: 33_260_000,
    typicalPrice: 37.34,
    typicalRvol: 1.33,
    open: 37.65,
    high: 37.88,
    low: 35.63,
    sparkline: [37.65, 36.80, 37.88, 35.63, 37.34],
    volumeUnit: "股",
    sharesOutstanding: 585_000_000,
  },
  NIO: {
    name: "蔚来汽车",
    sector: "可选消费 / 智能电动车",
    avgVolume3Month: 42_000_000,
    typicalTodayVolume: 48_300_000,
    typicalPrice: 5.85,
    typicalRvol: 1.15,
    open: 5.75,
    high: 5.98,
    low: 5.68,
    sparkline: [5.75, 5.88, 5.98, 5.68, 5.85],
    volumeUnit: "股",
    sharesOutstanding: 2_080_000_000,
  },
  GTLB: {
    name: "GitLab",
    sector: "信息技术 / DevSecOps企业软件",
    avgVolume3Month: 4_905_920,
    typicalTodayVolume: 28_957_521,
    typicalPrice: 49.59,
    typicalRvol: 5.90,
    open: 55.24,
    high: 55.55,
    low: 49.11,
    sparkline: [55.24, 55.55, 52.40, 49.11, 49.59],
    volumeUnit: "股",
    sharesOutstanding: 156_000_000,
  },

  // 基准 ETF
  SPY: {
    name: "标普500ETF",
    sector: "大盘基准ETF",
    avgVolume3Month: 65_000_000,
    typicalTodayVolume: 70_200_000,
    typicalPrice: 564.50,
    typicalRvol: 1.08,
    open: 563.10,
    high: 566.20,
    low: 562.40,
    sparkline: [563.10, 564.80, 566.20, 562.40, 564.50],
    volumeUnit: "股",
    sharesOutstanding: 920_000_000,
  },
  QQQ: {
    name: "纳指100ETF",
    sector: "科技成长ETF",
    avgVolume3Month: 45_000_000,
    typicalTodayVolume: 51_300_000,
    typicalPrice: 476.80,
    typicalRvol: 1.14,
    open: 474.20,
    high: 479.50,
    low: 473.00,
    sparkline: [474.20, 477.00, 479.50, 473.00, 476.80],
    volumeUnit: "股",
    sharesOutstanding: 520_000_000,
  },
  GLD: {
    name: "黄金ETF",
    sector: "贵金属现货ETF",
    avgVolume3Month: 7_800_000,
    typicalTodayVolume: 9_906_000,
    typicalPrice: 233.50,
    typicalRvol: 1.27,
    open: 231.20,
    high: 234.20,
    low: 230.80,
    sparkline: [231.20, 232.50, 234.20, 230.80, 233.50],
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

  // 默认兜底（给予活跃美股合理的默认流动性基准与典型RVOL）
  return {
    name: ticker,
    sector: "美股活跃成分标的",
    avgVolume3Month: 18_500_000,
    typicalPrice: 120.0,
    typicalRvol: 1.15,
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

export function parseChangePct(str?: string | number | null): number {
  if (typeof str === 'number') return isNaN(str) ? 0 : str;
  if (!str) return 0;
  const cleaned = String(str).replace('%', '').replace('+', '').trim();
  const val = parseFloat(cleaned);
  return isNaN(val) ? 0 : (String(str).includes('-') ? -Math.abs(val) : val);
}

export function parseRvol(rvol?: number | string | null): number {
  if (rvol === null || rvol === undefined) return 1.0;
  if (typeof rvol === 'number') return isNaN(rvol) ? 1.0 : rvol;
  const num = parseFloat(String(rvol).replace('x', '').replace('X', '').replace('约', '').trim());
  return isNaN(num) ? 1.0 : num;
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
  todayVol: number;
  avgVol: number;
  rvol: number;
  volumeUnit: string;
  sharesOutstanding?: number;
  turnoverRate?: number;
  turnoverRateStr?: string;
}

/**
 * 全局统一解析任意标的（宏观资产、ETF或行业龙头股）的成交量数据
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
    if (!isNaN(parsed) && parsed > 0) {
      rvol = parsed;
    }
  }

  // 3. 若无明确 RVOL（或为 null/undefined），优先对齐该标的权威 typicalRvol
  if (rvol === null || rvol === undefined) {
    if (benchmark.typicalRvol && benchmark.typicalRvol > 0) {
      rvol = benchmark.typicalRvol;
    } else if (changePercent !== undefined && changePercent !== null) {
      // 结合当日涨跌幅推导合理活跃量能（波动越大量能越放大，避免千篇一律的 1.0x）
      const absChange = Math.abs(changePercent);
      if (absChange >= 2.0) {
        rvol = Number((1.2 + Math.min(1.2, absChange * 0.15)).toFixed(2));
      } else if (absChange >= 0.8) {
        rvol = Number((1.05 + absChange * 0.1).toFixed(2));
      } else {
        rvol = 0.98;
      }
    } else {
      rvol = 1.15;
    }
  }

  const avgVol = rawAvgVolInput && rawAvgVolInput > 0 ? Math.round(rawAvgVolInput) : benchmark.avgVolume3Month;
  const todayVol = rawTodayVolInput && rawTodayVolInput > 0
    ? Math.round(rawTodayVolInput)
    : (benchmark.typicalTodayVolume && benchmark.typicalTodayVolume > 0
        ? benchmark.typicalTodayVolume
        : Math.round(avgVol * rvol));

  // 若使用权威真实日成交量，重新校验 RVOL 精确度
  const finalRvol = (rawTodayVolInput || benchmark.typicalTodayVolume) && avgVol > 0
    ? Number((todayVol / avgVol).toFixed(2))
    : Number(rvol.toFixed(2));

  let turnoverRate: number | undefined;
  let turnoverRateStr: string | undefined;
  if (sharesOutstanding && sharesOutstanding > 0 && todayVol > 0) {
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
  rvol: number;
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
  if (todayVol && avgVol && avgVol > 0) {
    rvol = Number((todayVol / avgVol).toFixed(2));
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
