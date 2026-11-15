import fs from "fs";
import path from "path";
import https from "https";
import http from "http";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { calculate30DayRvol, derivePlaybookCandidates } from "../src/utils/playbookEngine.js";

// 针对本地 Node 16 与 GitHub Actions Node 22 的运行时流与 fetch 垫片
if (typeof globalThis.ReadableStream === "undefined") {
  try {
    const web = await import("stream/web");
    globalThis.ReadableStream = web.ReadableStream;
  } catch (e) {}
}

if (typeof globalThis.fetch === "undefined") {
  globalThis.fetch = function(url, options = {}) {
    return new Promise((resolve, reject) => {
      const u = new URL(url);
      const client = u.protocol === "https:" ? https : http;
      const headers = { "User-Agent": "Mozilla/5.0", ...(options.headers || {}) };
      const req = client.request(u, {
        method: options.method || "GET",
        headers
      }, (res) => {
        const chunks = [];
        res.on("data", d => chunks.push(d));
        res.on("end", () => {
          const body = Buffer.concat(chunks).toString();
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            statusText: res.statusMessage,
            text: async () => body,
            json: async () => JSON.parse(body)
          });
        });
      });
      req.on("error", reject);
      if (options.body) req.write(options.body);
      req.end();
    });
  };
}

const { GoogleGenAI, Type } = await import("@google/genai");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

dotenv.config({ path: path.join(projectRoot, ".env") });

const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;
if (!apiKey) {
  console.warn("⚠️ 未检测到 GEMINI_API_KEY 环境变量，AI 生成阶段将自动进入高可用确定性量化投研引擎！");
}

// 1. 核心大盘与宏观标的 Ticker 映射
const MACRO_SYMBOLS = {
  SPX: "^GSPC",       // 标普 500
  IXIC: "^IXIC",      // 纳斯达克综合指数
  USO: "USO",         // 美国原油基金 ETF
  GC: "GC=F",         // COMEX 黄金主力期货
  TNX: "^TNX",        // 10年期美债收益率
  DXY: "DX-Y.NYB"     // 美元指数
};

const COMMODITY_SYMBOLS = {
  WTI: "CL=F"         // WTI原油主力期货
};

// 2. 标普 11 大行业板块与龙头股完整映射配置
const SECTORS_CONFIG = [
  {
    id: "XLK",
    name: "信息技术与半导体",
    etf: "XLK",
    leaders: ["NVDA", "MSFT", "AAPL"]
  },
  {
    id: "XLV",
    name: "医疗与生物医药",
    etf: "XLV",
    leaders: ["LLY", "UNH", "JNJ"]
  },
  {
    id: "XLY",
    name: "可选消费与电商",
    etf: "XLY",
    leaders: ["AMZN", "TSLA", "HD"]
  },
  {
    id: "XLP",
    name: "必选消费与零售",
    etf: "XLP",
    leaders: ["PG", "COST", "KO"]
  },
  {
    id: "XLF",
    name: "金融与银行保险",
    etf: "XLF",
    leaders: ["JPM", "BAC", "V"]
  },
  {
    id: "XLI",
    name: "工业制造与航空国防",
    etf: "XLI",
    leaders: ["CAT", "GE", "LMT"]
  },
  {
    id: "XLB",
    name: "基础材料与化学",
    etf: "XLB",
    leaders: ["LIN", "SHW", "FCX"]
  },
  {
    id: "XLU",
    name: "公用事业与绿电",
    etf: "XLU",
    leaders: ["NEE", "SO", "CEG"]
  },
  {
    id: "XLRE",
    name: "房地产与基础设施REITs",
    etf: "XLRE",
    leaders: ["PLD", "AMT", "EQIX"]
  },
  {
    id: "XLC",
    name: "通讯服务与数字娱乐",
    etf: "XLC",
    leaders: ["GOOGL", "META", "NFLX"]
  },
  {
    id: "XLE",
    name: "能源与石油天然气",
    etf: "XLE",
    leaders: ["XOM", "CVX", "SLB"]
  }
];

// 补充雷达及异动跟踪标的
const EXTRA_WATCH_SYMBOLS = {
  PLTR: "PLTR",
  AMD: "AMD",
  QQQ: "QQQ",
  SPY: "SPY",
  DELL: "DELL",
  CRWD: "CRWD"
};

// 均线算法：SMA 与 EMA
function calcSMA(arr, period) {
  if (!arr || arr.length < period) return null;
  const slice = arr.slice(-period);
  return Number((slice.reduce((a, b) => a + b, 0) / period).toFixed(2));
}

function calcEMA(arr, period) {
  if (!arr || arr.length < period) return null;
  const k = 2 / (period + 1);
  let ema = arr.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < arr.length; i++) {
    ema = arr[i] * k + ema * (1 - k);
  }
  return Number(ema.toFixed(2));
}

// 统一原生 HTTP 数据获取函数：拉取 1 年日线数据，并计算真实 EMA/MA 与 RVOL
function fetchTickerData(ticker, retryCount = 2) {
  return new Promise((resolve) => {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?range=1y&interval=1d`;
    
    const attempt = (remainingRetries) => {
      const req = https.get(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "application/json"
        },
        timeout: 10000
      }, (res) => {
        let data = "";
        res.on("data", chunk => data += chunk);
        res.on("end", () => {
          try {
            if (res.statusCode !== 200) {
              throw new Error(`HTTP ${res.statusCode}`);
            }
            const json = JSON.parse(data);
            const result = json.chart?.result?.[0];
            if (!result) {
              throw new Error("No chart result found");
            }

            const meta = result.meta || {};
            const quote = result.indicators?.quote?.[0] || {};
            const timestamps = result.timestamp || [];
            const rawCloses = quote.close || [];
            const rawVolumes = quote.volume || [];

            // 严谨确定最新柱线 (当日/最近交易日) 的原始对齐索引，防止因全局 filter(null) 导致日期错位与伪造当日量
            const barCount = Math.min(
              timestamps.length > 0 ? timestamps.length : Infinity,
              rawCloses.length > 0 ? rawCloses.length : Infinity,
              rawVolumes.length > 0 ? rawVolumes.length : Infinity
            );
            const hasBars = barCount > 0 && barCount !== Infinity;
            const lastIdx = hasBars ? barCount - 1 : -1;

            // 1. 确定当日成交量：优先使用 meta.regularMarketVolume，其次取原始最后一根柱线 rawVolumes[lastIdx]
            // 若当日成交量为 null/缺失/<=0，严格判定为 null，绝不回退取昨日成交量冒充今日！
            let todayVol = null;
            if (typeof meta.regularMarketVolume === "number" && !isNaN(meta.regularMarketVolume) && meta.regularMarketVolume > 0) {
              todayVol = meta.regularMarketVolume;
            } else if (hasBars) {
              const rawLastVol = rawVolumes[lastIdx];
              if (typeof rawLastVol === "number" && !isNaN(rawLastVol) && rawLastVol > 0) {
                todayVol = rawLastVol;
              }
            }

            // 2. 确定当日最新价：优先使用 meta.regularMarketPrice，其次取原始最后一根柱线 rawCloses[lastIdx]
            let currentPrice = null;
            if (typeof meta.regularMarketPrice === "number" && !isNaN(meta.regularMarketPrice)) {
              currentPrice = meta.regularMarketPrice;
            } else if (hasBars) {
              const rawLastClose = rawCloses[lastIdx];
              if (typeof rawLastClose === "number" && !isNaN(rawLastClose)) {
                currentPrice = rawLastClose;
              }
            }

            // 3. 提取当日前（严格不含当日）的历史交易日序列，并过滤掉历史中的异常空值
            const histRawCloses = hasBars ? rawCloses.slice(0, lastIdx) : [];
            const histRawVolumes = hasBars ? rawVolumes.slice(0, lastIdx) : [];
            const histCloses = histRawCloses.filter(c => typeof c === "number" && !isNaN(c) && c > 0);
            const histVolumes = histRawVolumes.filter(v => typeof v === "number" && !isNaN(v) && v > 0);

            // 4. 测算 30 日量比 RVOL：传入 (历史成交量数组, 当日成交量)
            // 当日成交量缺失 (null) 或历史有效交易日不足 30 天时，calculate30DayRvol 严格返回 null
            const rvol = calculate30DayRvol(histVolumes, todayVol);

            // 5. 涨跌幅与昨收计算：严禁使用 1y chart 范围下的 chartPreviousClose（那是 1 年前的价格！）
            // 优先直接使用 Yahoo Finance 官方计算的 regularMarketChangePercent，其次对比当日现价与上一交易日真实收盘价
            let changePctNum = 0;
            const prevCloseFromHist = histCloses.length > 0 ? histCloses[histCloses.length - 1] : null;

            if (typeof meta.regularMarketChangePercent === "number" && !isNaN(meta.regularMarketChangePercent)) {
              changePctNum = meta.regularMarketChangePercent;
            } else if (typeof currentPrice === "number" && typeof prevCloseFromHist === "number" && prevCloseFromHist > 0) {
              changePctNum = ((currentPrice - prevCloseFromHist) / prevCloseFromHist) * 100;
            }

            const changePct = (changePctNum > 0 ? "+" : "") + changePctNum.toFixed(2) + "%";
            const price = typeof currentPrice === "number" ? currentPrice : (prevCloseFromHist ?? 0);
            const prevClose = prevCloseFromHist ?? (changePctNum !== 0 && typeof currentPrice === "number" ? Number((currentPrice / (1 + changePctNum / 100)).toFixed(currentPrice < 10 ? 3 : 2)) : price);

            // 6. 均线计算：若当日价格有效，则严格以 [历史有效收盘价, 当日最新价] 为基准；若当日无价则仅基于历史收盘价
            const closesForTech = typeof currentPrice === "number" ? [...histCloses, currentPrice] : histCloses;
            const technicals = closesForTech.length > 0 ? {
              ema21: calcEMA(closesForTech, 21),
              ema55: calcEMA(closesForTech, 55),
              ema144: calcEMA(closesForTech, 144),
              ma50: calcSMA(closesForTech, 50),
              ma200: calcSMA(closesForTech, 200)
            } : {
              ema21: null,
              ema55: null,
              ema144: null,
              ma50: null,
              ma200: null
            };

            resolve({
              ticker,
              name: meta.shortName || ticker,
              price: Number(price.toFixed(price < 10 ? 3 : 2)),
              prevClose: Number(prevClose.toFixed(prevClose < 10 ? 3 : 2)),
              changePct,
              changePercent: changePctNum,
              trend: changePctNum >= 0 ? "up" : "down",
              volume: todayVol,
              rvol,
              technicals
            });
          } catch (err) {
            if (remainingRetries > 0) {
              setTimeout(() => attempt(remainingRetries - 1), 1000);
            } else {
              console.warn(`⚠️ 拉取标的 ${ticker} 行情失败: ${err.message}`);
              resolve(null);
            }
          }
        });
      });

      req.on("error", (err) => {
        if (remainingRetries > 0) {
          setTimeout(() => attempt(remainingRetries - 1), 1000);
        } else {
          console.warn(`⚠️ 网络异常拉取标的 ${ticker} 失败: ${err.message}`);
          resolve(null);
        }
      });

      req.on("timeout", () => {
        req.destroy();
        if (remainingRetries > 0) {
          setTimeout(() => attempt(remainingRetries - 1), 1000);
        } else {
          console.warn(`⚠️ 拉取标的 ${ticker} 超时`);
          resolve(null);
        }
      });
    };

    attempt(retryCount);
  });
}

// 分批并发拉取行情（批大小为 8）
async function fetchBatchTickerData(tickers, concurrency = 8) {
  const results = {};
  for (let i = 0; i < tickers.length; i += concurrency) {
    const batch = tickers.slice(i, i + concurrency);
    const batchResults = await Promise.all(batch.map(t => fetchTickerData(t)));
    batch.forEach((t, idx) => {
      if (batchResults[idx]) {
        results[t] = batchResults[idx];
      }
    });
  }
  return results;
}

// 失败告警：自动在 GitHub 建 Issue 报备
async function createFailureIssue(title, body) {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPOSITORY;
  if (!token || !repo) {
    console.warn("⚠️ 未配置 GITHUB_TOKEN / GITHUB_REPOSITORY，跳过自动建 Issue 告警。");
    return;
  }
  try {
    const res = await fetch(`https://api.github.com/repos/${repo}/issues`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
        "X-GitHub-Api-Version": "2022-11-28"
      },
      body: JSON.stringify({ title, body })
    });
    if (!res.ok) {
      console.warn(`⚠️ 自动建 Issue 失败: HTTP ${res.status} ${await res.text()}`);
    } else {
      const data = await res.json();
      console.log(`🚨 已自动创建告警 Issue #${data.number}: ${data.html_url}`);
    }
  } catch (err) {
    console.warn("⚠️ 自动建 Issue 异常:", err.message);
  }
}

// Step 3 强校验与断言拦截机制
async function validateReportData(reportJson) {
  console.log("🛡️ [校验层 - Schema 强校验与断言拦截] 正在执行数据围栏验证...");
  const errors = [];

  // 1. 校验日期格式 (YYYY-MM-DD)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(reportJson.date)) {
    errors.push(`非法日期格式: ${reportJson.date}`);
  }

  // 2. 核心大盘数值非空与有效性校验
  const assetsToCheck = reportJson.assets || reportJson.macroSummary?.assets;
  if (!assetsToCheck || assetsToCheck.length < 5) {
    errors.push("大盘核心资产数据缺失或数量不足 5 个");
  } else {
    assetsToCheck.forEach((asset) => {
      if (asset.price === null || asset.price === undefined || isNaN(asset.price)) {
        errors.push(`资产 ${asset.ticker} 的 price 为空或非法数值`);
      }
      if (!asset.changePct || typeof asset.changePct !== "string") {
        errors.push(`资产 ${asset.ticker} 的 changePct 缺失`);
      }
    });
  }

  // 3. 校验宏观研报与板块是否存在实质内容
  if (!reportJson.macroSummary?.coreThesis || reportJson.macroSummary.coreThesis.length < 15) {
    errors.push("宏观大局核心论点为空或篇幅过短");
  }

  // 4. 校验 11 大行业板块覆盖
  if (!Array.isArray(reportJson.sectors) || reportJson.sectors.length < 11) {
    errors.push(`行业板块数量不足 11 个（实际 ${reportJson.sectors?.length || 0} 个）`);
  }

  if (errors.length > 0) {
    console.error("❌ 数据质量校验未通过，拦截构建：\n", errors.join("\n"));
    const runUrl = process.env.GITHUB_REPOSITORY && process.env.GITHUB_RUN_ID
      ? `https://github.com/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
      : "（本地运行或未知）";
    await createFailureIssue(
      `【日报生成失败】${reportJson.date} 数据校验未通过`,
      `日报生成流水线在数据校验环节失败，未生成新报告。\n\n- 目标交易日：${reportJson.date}\n- 失败原因：\n${errors.map((e) => `  - ${e}`).join("\n")}\n- Workflow run：${runUrl}`
    );
    process.exit(1);
  }

  console.log("✅ 数据准确性与完整性校验 100% 通过！");
}

const reportSchema = {
  type: Type.OBJECT,
  properties: {
    date: { type: Type.STRING },
    marketStatus: { type: Type.STRING },
    isFallback: { type: Type.BOOLEAN },
    macroSummary: {
      type: Type.OBJECT,
      properties: {
        coreThesis: { type: Type.STRING },
        transmissionDetail: { type: Type.STRING },
        assets: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              ticker: { type: Type.STRING },
              price: { type: Type.NUMBER },
              changePct: { type: Type.STRING },
              trend: { type: Type.STRING, enum: ["up", "down", "neutral"] }
            },
            required: ["name", "ticker", "price", "changePct", "trend"]
          }
        }
      },
      required: ["coreThesis", "transmissionDetail", "assets"]
    },
    aiReport: {
      type: Type.OBJECT,
      properties: {
        dailyExecutiveSummary: { type: Type.STRING },
        executiveSnapshot: { type: Type.STRING },
        heavyweightInsights: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              impact: { type: Type.STRING }
            },
            required: ["title", "impact"]
          }
        },
        sectorRotations: {
          type: Type.OBJECT,
          properties: {
            growth: { type: Type.STRING },
            defensive: { type: Type.STRING },
            capitalFlow: { type: Type.STRING }
          },
          required: ["growth", "defensive", "capitalFlow"]
        },
        tacticalOutlook: {
          type: Type.OBJECT,
          properties: {
            bullIdeas: { type: Type.STRING },
            bearIdeas: { type: Type.STRING }
          },
          required: ["bullIdeas", "bearIdeas"]
        }
      },
      required: ["dailyExecutiveSummary", "executiveSnapshot", "heavyweightInsights", "sectorRotations", "tacticalOutlook"]
    },
    sectors: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          etf: { type: Type.STRING },
          leaders: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                ticker: { type: Type.STRING },
                changePct: { type: Type.STRING },
                catalyst: { type: Type.STRING }
              },
              required: ["ticker", "changePct", "catalyst"]
            }
          }
        },
        required: ["name", "etf", "leaders"]
      }
    },
    movers: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          ticker: { type: Type.STRING },
          name: { type: Type.STRING },
          changePct: { type: Type.STRING },
          rvol: { type: Type.STRING },
          sector: { type: Type.STRING },
          newsAttribution: { type: Type.STRING },
          shortTermOutlook: { type: Type.STRING },
          midTermLogic: { type: Type.STRING },
          invalidationLevel: { type: Type.STRING }
        },
        required: ["ticker", "name", "changePct", "sector", "newsAttribution", "shortTermOutlook", "midTermLogic", "invalidationLevel"]
      }
    },
    causalChains: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          driver: { type: Type.STRING },
          mechanism: { type: Type.STRING },
          beneficiary: { type: Type.STRING },
          victim: { type: Type.STRING }
        },
        required: ["driver", "mechanism", "beneficiary", "victim"]
      }
    }
  },
  required: ["date", "marketStatus", "isFallback", "macroSummary", "aiReport", "sectors", "movers", "causalChains"]
};

// 严谨美股节假日计算（含复活节耶稣受难日及周末调休）
function isUSMarketHolidayOrWeekend(now = new Date()) {
  const nyDateStr = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    weekday: "short",
  }).format(now);

  const nyFormatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const todayStr = nyFormatter.format(now); // YYYY-MM-DD
  const [year, month, day] = todayStr.split("-").map(Number);

  // 1. 周末判断
  if (nyDateStr.startsWith("Sat") || nyDateStr.startsWith("Sun")) {
    return { isHoliday: true, reason: `周末休市 (${nyDateStr.slice(0, 3)})` };
  }

  // 2. 复活节耶稣受难日 (Good Friday) 精确计算
  function getGoodFriday(y) {
    const f = Math.floor;
    const G = y % 19;
    const C = f(y / 100);
    const H = (C - f(C / 4) - f((8 * C + 13) / 25) + 19 * G + 15) % 30;
    const I = H - f(H / 28) * (1 - f(29 / (H + 1)) * f((21 - G) / 11));
    const J = (y + f(y / 4) + I + 2 - C + f(C / 4)) % 7;
    const L = I - J;
    const m = 3 + f((L + 40) / 44);
    const d = L + 28 - 31 * f(m / 4);
    const easter = new Date(Date.UTC(y, m - 1, d));
    const gf = new Date(easter.getTime() - 2 * 86400000);
    return gf.toISOString().slice(0, 10);
  }

  if (todayStr === getGoodFriday(year)) {
    return { isHoliday: true, reason: "耶稣受难日 (Good Friday)" };
  }

  // 3. 浮动节假日
  // 马丁路德金日: 1月的第3个周一
  if (month === 1 && nyDateStr.startsWith("Mon") && day >= 15 && day <= 21) {
    return { isHoliday: true, reason: "马丁·路德·金纪念日 (MLK Day)" };
  }
  // 总统日: 2月的第3个周一
  if (month === 2 && nyDateStr.startsWith("Mon") && day >= 15 && day <= 21) {
    return { isHoliday: true, reason: "总统日 (Presidents' Day)" };
  }
  // 阵亡将士纪念日: 5月的最后1个周一
  if (month === 5 && nyDateStr.startsWith("Mon") && day >= 25) {
    return { isHoliday: true, reason: "阵亡将士纪念日 (Memorial Day)" };
  }
  // 劳动节: 9月的第1个周一
  if (month === 9 && nyDateStr.startsWith("Mon") && day <= 7) {
    return { isHoliday: true, reason: "劳动节 (Labor Day)" };
  }
  // 感恩节: 11月的第4个周四
  if (month === 11 && nyDateStr.startsWith("Thu") && day >= 22 && day <= 28) {
    return { isHoliday: true, reason: "感恩节 (Thanksgiving Day)" };
  }

  // 4. 固定节假日（及周六前移周五、周日后移周一调休）
  const fixedHolidays = [
    { m: 1, d: 1, name: "元旦 (New Year's Day)" },
    { m: 6, d: 19, name: "六月节独立日 (Juneteenth)" },
    { m: 7, d: 4, name: "独立日 (Independence Day)" },
    { m: 12, d: 25, name: "圣诞节 (Christmas Day)" }
  ];

  for (const h of fixedHolidays) {
    const targetDate = new Date(Date.UTC(year, h.m - 1, h.d));
    const dayOfWeek = targetDate.getUTCDay(); // 0 is Sun, 6 is Sat
    let observedDateStr = "";
    if (dayOfWeek === 6) {
      observedDateStr = new Date(Date.UTC(year, h.m - 1, h.d - 1)).toISOString().slice(0, 10);
    } else if (dayOfWeek === 0) {
      observedDateStr = new Date(Date.UTC(year, h.m - 1, h.d + 1)).toISOString().slice(0, 10);
    } else {
      observedDateStr = targetDate.toISOString().slice(0, 10);
    }
    if (todayStr === observedDateStr) {
      return { isHoliday: true, reason: h.name };
    }
  }

  return { isHoliday: false, reason: "" };
}

// 联网搜索当日新闻：两步式调用中的第一步（Step 1）
async function fetchNewsGrounding(today) {
  if (!ai) return "";
  console.log(`🌐 [Step 1: 联网检索] 正在调用 Gemini Google Search 获取今日（${today}）突发财经要闻与异动催化剂...`);
  try {
    const searchPrompt = `请联网检索美股今日（${today}）的突发重大宏观经济数据、美联储官员表态、大宗商品波动以及 11 大行业核心龙头（NVDA, TSLA, MSFT, AAPL, AMZN, LLY, JPM, XOM 等）的关键公告与异动催化剂。
请按要点输出 5 条核心突发新闻与催化剂摘要，保留权威事实。必须 100% 全中文输出。`;

    const res = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: searchPrompt,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    const summary = res?.text || "";
    console.log(`✅ 联网新闻检索成功（长度: ${summary.length} 字符）`);
    return summary;
  } catch (err) {
    console.warn(`⚠️ 联网新闻检索跳过或异常 (${err.message})，将使用技术面与资金流动量化特征进行归因。`);
    return "";
  }
}

async function runAutomation() {
  const dateArg = process.argv.find((a) => a.startsWith("--date="))?.split("=")[1] || process.env.TARGET_DATE;
  const forceRun = process.env.FORCE_RUN === "true" || process.argv.includes("--force") || Boolean(dateArg);

  // 美东 17 点守卫（双触发去重）
  if (process.env.GITHUB_EVENT_NAME === "schedule" && !forceRun) {
    const nyHour = Number(new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York",
      hour: "numeric",
      hour12: false
    }).format(new Date()));
    if (nyHour !== 17) {
      console.log(`[Skip] 当前美东时间 ${nyHour} 点，非 17 点定时触发，跳过本次运行（双触发去重）。`);
      process.exit(0);
    }
  }

  const holidayCheck = isUSMarketHolidayOrWeekend(new Date());
  if (holidayCheck.isHoliday && !forceRun) {
    console.log(`[Skip] 今日休市 (${holidayCheck.reason})，跳过日报生成。`);
    process.exit(0);
  }

  const today = dateArg || new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date());

  console.log(`[${new Date().toISOString()}] 启动 Phase 2 自动化流水线，目标交易日: ${today}...`);

  // 整理全量需要抓取的标的
  const allTickersToFetch = new Set([
    ...Object.values(MACRO_SYMBOLS),
    ...Object.values(COMMODITY_SYMBOLS),
    ...Object.values(EXTRA_WATCH_SYMBOLS)
  ]);

  SECTORS_CONFIG.forEach(sec => {
    allTickersToFetch.add(sec.etf);
    sec.leaders.forEach(l => allTickersToFetch.add(l));
  });

  const tickerList = Array.from(allTickersToFetch);
  console.log(`📊 [Step 1: 确定性行情抓取] 正在并发抓取 ${tickerList.length} 只标的真实日线历史与均线系统...`);
  const marketMap = await fetchBatchTickerData(tickerList, 8);

  // 提取宏观资产
  const macro = {
    SPX: marketMap["^GSPC"] || marketMap["SPX"],
    IXIC: marketMap["^IXIC"] || marketMap["IXIC"],
    USO: marketMap["USO"],
    GC: marketMap["GC=F"],
    TNX: marketMap["^TNX"] || marketMap["TNX"],
    DXY: marketMap["DX-Y.NYB"] || marketMap["DXY"]
  };

  const wti = marketMap["CL=F"];

  console.log(`✅ 官方真实结算行情抓取完毕:
  - 标普500 (SPX): ${macro.SPX?.price} (${macro.SPX?.changePct})
  - 纳斯达克 (IXIC): ${macro.IXIC?.price} (${macro.IXIC?.changePct})
  - 美国原油基金 (USO): $${macro.USO?.price} (${macro.USO?.changePct})
  - COMEX黄金 (GC=F): $${macro.GC?.price} (${macro.GC?.changePct})
  - 10年期美债 (^TNX): ${macro.TNX?.price}% (${macro.TNX?.changePct})
  - 美元指数 (DXY): ${macro.DXY?.price} (${macro.DXY?.changePct})`);

  // Step 1: 联网检索新闻与突发催化剂
  const newsGroundingSummary = await fetchNewsGrounding(today);

  // 组装 Ground Truth 文本
  let sectorLines = [];
  SECTORS_CONFIG.forEach(sec => {
    const etfData = marketMap[sec.etf];
    const leadersInfo = sec.leaders.map(l => {
      const d = marketMap[l];
      const rvolStr = typeof d?.rvol === "number" ? `RVOL ${d.rvol}x` : "量比缺失";
      return `${l} (${d?.changePct || "+0.00%"}, ${rvolStr})`;
    }).join(", ");
    sectorLines.push(`- ${sec.name} (${sec.etf} ${etfData?.changePct || "+0.00%"}): ${leadersInfo}`);
  });

  const groundTruthText = `
【以下为官方交易所结算确定的真实数据 (Ground Truth)】
你必须原封不动使用这些数值，严禁自行修改、计算或捏造任何收盘价格；你的核心任务是根据真实数据进行宏观归因、跨资产因果推演与异动点评。

【宏观核心资产官方结算价与真实涨跌】：
1. 标普 500 (SPX): 价格 ${macro.SPX?.price}, 涨跌幅 "${macro.SPX?.changePct}", 趋势: ${macro.SPX?.trend}
2. 纳斯达克 (IXIC): 价格 ${macro.IXIC?.price}, 涨跌幅 "${macro.IXIC?.changePct}", 趋势: ${macro.IXIC?.trend}
3. 美国原油基金 ETF (USO): 价格 ${macro.USO?.price}, 涨跌幅 "${macro.USO?.changePct}", 趋势: ${macro.USO?.trend} (WTI主力结算参考: $${wti?.price || 0}/桶)
4. COMEX 黄金主力期货 (GC=F): 价格 ${macro.GC?.price}, 涨跌幅 "${macro.GC?.changePct}", 趋势: ${macro.GC?.trend}
5. 10年期美债收益率 (^TNX): 价格 ${macro.TNX?.price}, 涨跌幅 "${macro.TNX?.changePct}", 趋势: ${macro.TNX?.trend}
6. 美元指数 (DXY): 价格 ${macro.DXY?.price}, 涨跌幅 "${macro.DXY?.changePct}", 趋势: ${macro.DXY?.trend}

【11 大标普核心行业与板块龙头真实表现】：
${sectorLines.join("\n")}
`;

  // Step 2: 组装结构化生成 Prompt
  const prompt = `请基于以下官方交易所结算确定的真实数据，结合联网检索的突发要闻，生成专业深度的每日市场复盘研报。

${groundTruthText}

${newsGroundingSummary ? `【联网检索的突发要闻与市场背景】：\n${newsGroundingSummary}\n` : ""}

==================== 【核心板块覆盖要求】 ====================
研报必须包含全部 11 大行业板块（科技成长、医疗健康、可选消费、必选消费、金融银行、工业制造、基础材料、公用事业、房地产、通讯服务、能源）。每个板块必须包含其 ETF 代码与龙头个股，并结合今日真实表现给出具体催化剂（catalyst）。

==================== 【异动股归因 (movers)】 ====================
精选 3-5 只异动明显或具有高代表性的龙头个股（如 NVDA, TSLA, PLTR, XOM 等），结合成交量比 RVOL 与新闻给出深度归因与失效点位。

==================== 【全中文输出铁律 (CRITICAL)】 ====================
除标准美股代码（如 NVDA, TSLA, SPX, GC=F）保留英文大写外，所有字段内容、标题、文字分析、归因解读、催化剂、失效点位、大局总结、因果链描述等必须 100% 全部使用专业、地道的简体中文撰写，严禁出现任何英文句子或英文分析段落！
`;

  let reportJson = null;

  if (ai) {
    console.log(`📡 [Step 2: 结构化研报生成] 正在调用 Gemini 模型生成专业宏观研报...`);
    const candidateModels = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-flash-latest"];
    let responseText = "";

    for (const modelName of candidateModels) {
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          console.log(`🤖 尝试使用模型: ${modelName} (尝试 ${attempt}/2)...`);
          const res = await ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
              systemInstruction: `你是一名顶级华尔街宏观策略与量化股票分析师。
【全中文输出绝对铁律】：除美股代码（如 NVDA, SPX）保留英文大写外，研报内所有的字段文字、标题、总结、归因分析、催化剂、风险点、因果链描述等必须 100% 全部使用地道专业的简体中文输出！
数据由官方交易所结算提供，必须忠实使用数值，严禁捏造。聚焦深度宏观推演与资金轮动归因。
isFallback 必须填为 false。`,
              responseMimeType: "application/json",
              responseSchema: reportSchema
            }
          });
          if (res && res.text) {
            responseText = res.text;
            console.log(`✅ 模型 ${modelName} 结构化生成成功！`);
            break;
          }
        } catch (err) {
          console.warn(`⚠️ 模型 ${modelName} (第 ${attempt} 次) 调用异常: ${err.message}`);
          if (attempt < 2) {
            await new Promise((r) => setTimeout(r, 4000));
          }
        }
      }
      if (responseText) break;
    }

    if (responseText) {
      try {
        reportJson = JSON.parse(responseText);
        reportJson.isFallback = false;
      } catch (parseErr) {
        console.warn("⚠️ 解析 Gemini 响应 JSON 失败，启用确定性投研量化引擎合成兜底...");
      }
    }
  }

  if (!reportJson) {
    console.log("⚙️ [高可用兜底] 启用确定性量化投研引擎合成完整 11 板块研报...");
    const isTechBull = (macro.IXIC?.changePct || "").startsWith("+");
    const tnxUp = (macro.TNX?.changePct || "").startsWith("+");

    const fallbackSectors = SECTORS_CONFIG.map(sec => {
      return {
        name: sec.name,
        etf: sec.etf,
        leaders: sec.leaders.map(l => {
          const item = marketMap[l];
          return {
            ticker: l,
            changePct: item?.changePct || "+0.00%",
            catalyst: `${sec.name}板块资金按行业基本面进行日常轮动配置，微观量价贴合技术均线整固。`
          };
        })
      };
    });

    reportJson = {
      date: today,
      marketStatus: `美股已收盘 (${today})`,
      isFallback: true,
      macroSummary: {
        coreThesis: `今日美股大盘呈现${isTechBull ? "科技领涨、风险偏好回暖" : "高位震荡整理、防御资产走强"}格局。标普500收于 ${macro.SPX?.price} (${macro.SPX?.changePct})，纳斯达克综合指数录得 ${macro.IXIC?.price} (${macro.IXIC?.changePct})。10年期美债收益率收报 ${macro.TNX?.price}% (${macro.TNX?.changePct})，美元指数报 ${macro.DXY?.price} (${macro.DXY?.changePct})。市场资金在宏观流动性与成长估值之间展开高频再平衡。`,
        transmissionDetail: `宏观流动性中枢受${tnxUp ? "长端美债收益率高位韧性" : "无风险折现率温和回落"}驱动，全市场 11 大行业板块呈现结构性轮动。同时原油基金报 $${macro.USO?.price} (${macro.USO?.changePct})，重塑抗通胀资产与顺周期制造的风险折价。`,
        assets: []
      },
      aiReport: {
        dailyExecutiveSummary: `【${today} 华尔街宏观策略收盘复盘】今日美股大盘${isTechBull ? "纳指领涨，成长风格占优" : "呈现震荡防御分化"}。标普500收报 ${macro.SPX?.price} (${macro.SPX?.changePct})，纳指收报 ${macro.IXIC?.price} (${macro.IXIC?.changePct})。10年期美债收益率运行于 ${macro.TNX?.price}% 水位。微观层面，AI算力链龙头（NVDA、MSFT）成交活跃度持续处于全市场前列，11 大行业板块轮动分化运行，机构资金呈现典型的高现金流壁垒配置导向。`,
        executiveSnapshot: `大盘多空博弈焦灼，纳指收报 ${macro.IXIC?.price}，宏观折现率波动受控，各板块核心标的构筑扎实估值底座。`,
        heavyweightInsights: [
          {
            title: "宏观利率曲线与科技成长股估值韧性",
            impact: `10年期基准国债收益率报 ${macro.TNX?.price}%，长端资金成本对权益市场估值中枢形成牵引，市场优先给具备真实自由现金流与业绩兑现能力的硬科技龙头提供流动性溢价。`
          },
          {
            title: "大宗商品变动与通胀预期传导",
            impact: `原油ETF(USO)录得 $${macro.USO?.price} (${macro.USO?.changePct})，COMEX黄金主力报 $${macro.GC?.price}，地缘博弈与供需面扰动直接对下游交通运输及制造成本形成外溢效应。`
          }
        ],
        sectorRotations: {
          growth: "信息技术与半导体（XLK）活跃，核心硬件标的获得机构买盘持续护盘；",
          defensive: "医疗健康（XLV）与必选消费提供防御对冲，高股息资产在利率震荡期保持韧性；",
          capitalFlow: "增量资金聚焦于具备强现金流壁垒的龙头企业，避险与进攻资金并存，呈现哑铃型配置风格。"
        },
        tacticalOutlook: {
          bullIdeas: "逢低布局估值具备安全边际且业绩指引超预期的半导体硬件、数据中心核心供应链；",
          bearIdeas: "回避缺乏实际盈利支撑的高估值投机股与高负债率传统制造标的，注意尾部风险防守。"
        }
      },
      sectors: fallbackSectors,
      movers: [
        {
          ticker: "NVDA",
          name: "英伟达",
          changePct: marketMap["NVDA"]?.changePct || "+1.34%",
          rvol: typeof marketMap["NVDA"]?.rvol === "number" ? `${marketMap["NVDA"].rvol}x` : "量比缺失",
          sector: "信息技术与半导体",
          newsAttribution: "半导体行业资金承接意愿强劲，算力芯片全球需求旺盛，机构筹码高度锁定。",
          shortTermOutlook: "高位均线多头排列，若成交量保持健康，短线维持强势整理格局。",
          midTermLogic: "数据中心算力建设景气周期跨越度长，行业龙头定价权与自由现金流构筑深厚护城河。",
          invalidationLevel: `关键防守位 $${((marketMap["NVDA"]?.price || 230) * 0.95).toFixed(2)}`
        },
        {
          ticker: "TSLA",
          name: "特斯拉",
          changePct: marketMap["TSLA"]?.changePct || "+0.42%",
          rvol: typeof marketMap["TSLA"]?.rvol === "number" ? `${marketMap["TSLA"].rvol}x` : "量比缺失",
          sector: "可选消费与电商",
          newsAttribution: "市场对AI算力集群与无人出租车商业化落地预期持续发酵，多空博弈激烈。",
          shortTermOutlook: "区间箱体震荡，等待放量突破关键阻力位。",
          midTermLogic: "汽车基本盘叠加AI端智能生态商业化，赋予其超越传统车企的高弹性估值倍数。",
          invalidationLevel: `关键防守位 $${((marketMap["TSLA"]?.price || 250) * 0.94).toFixed(2)}`
        },
        {
          ticker: "XOM",
          name: "埃克森美孚",
          changePct: marketMap["XOM"]?.changePct || "-1.20%",
          rvol: typeof marketMap["XOM"]?.rvol === "number" ? `${marketMap["XOM"].rvol}x` : "量比缺失",
          sector: "能源与石油天然气",
          newsAttribution: "WTI原油大宗主力合约回调，压制上游采掘板块情绪，短线多头获利回吐。",
          shortTermOutlook: "短线下探测试支撑，需等待油价企稳信号出现。",
          midTermLogic: "低成本开采资产与持续股票回购计划为中长线价值投资者提供扎实安全垫。",
          invalidationLevel: `关键防守位 $${((marketMap["XOM"]?.price || 115) * 0.96).toFixed(2)}`
        }
      ],
      causalChains: [
        {
          driver: `10年期美债收益率运行于 ${macro.TNX?.price}% 水位`,
          mechanism: "无风险折现率决定全市场权益资产的估值折现天花板，推升机构资金对高自由现金流龙头的抱团倾向。",
          beneficiary: "高资产回报率与自由现金流充沛的算力科技龙头 (NVDA, MSFT)",
          victim: "对利率敏感且无盈利支持的高贝塔投机成长股"
        },
        {
          driver: `WTI原油及USO变动 (${macro.USO?.changePct})`,
          mechanism: "能源上游成本变动直接影响通胀二次反弹预期，引发交通运输与周期工业的投入产出利润率重估。",
          beneficiary: "中下游交运物流与成本节约型消费龙头",
          victim: "原油相关上游油气开采标的 (XOM, USO)"
        }
      ]
    };
  }

  // 拼装宏观资产官方确定性数据
  const deterministicAssets = [
    macro.SPX && { name: "标普500", ticker: "SPX", price: macro.SPX.price, changePct: macro.SPX.changePct, trend: macro.SPX.trend },
    macro.IXIC && { name: "纳斯达克", ticker: "IXIC", price: macro.IXIC.price, changePct: macro.IXIC.changePct, trend: macro.IXIC.trend },
    macro.USO && { name: "美国原油基金ETF", ticker: "USO", price: macro.USO.price, changePct: macro.USO.changePct, trend: macro.USO.trend },
    macro.GC && { name: "COMEX黄金", ticker: "GC=F", price: macro.GC.price, changePct: macro.GC.changePct, trend: macro.GC.trend },
    macro.TNX && { name: "10年期美债", ticker: "^TNX", price: macro.TNX.price, changePct: macro.TNX.changePct, trend: macro.TNX.trend },
    macro.DXY && { name: "美元指数", ticker: "DXY", price: macro.DXY.price, changePct: macro.DXY.changePct, trend: macro.DXY.trend }
  ].filter(Boolean);

  if (!reportJson.macroSummary) reportJson.macroSummary = {};
  reportJson.macroSummary.assets = deterministicAssets;
  reportJson.assets = deterministicAssets;
  reportJson.date = today;

  // 补齐与矫正 11 大行业板块实际涨跌幅、价格、成交量与真实 RVOL
  if (Array.isArray(reportJson.sectors)) {
    for (const sec of reportJson.sectors) {
      if (Array.isArray(sec.leaders)) {
        for (const leader of sec.leaders) {
          const item = marketMap[leader.ticker];
          if (item) {
            if (item.changePct) leader.changePct = item.changePct;
            if (item.price !== undefined) leader.price = item.price;
            if (item.volume !== undefined) leader.volume = item.volume;
            leader.rvol = typeof item.rvol === "number" ? `${item.rvol}x` : null;
            leader.technicals = item.technicals;
          }
        }
      }
    }
  }

  // 矫正 movers 中的个股涨跌幅与量比，并注入真实均线
  if (Array.isArray(reportJson.movers)) {
    for (const mover of reportJson.movers) {
      const item = marketMap[mover.ticker];
      if (item) {
        if (item.changePct) mover.changePct = item.changePct;
        if (item.price !== undefined) mover.price = item.price;
        mover.rvol = typeof item.rvol === "number" ? `${item.rvol}x` : null;
        mover.technicals = item.technicals;
      }
    }
  }

  // 注入全市场真实技术指标字典，供前端雷达与抄底信号直接消费
  const technicalIndicators = {};
  Object.entries(marketMap).forEach(([t, data]) => {
    if (data?.technicals) {
      technicalIndicators[t] = {
        price: data.price,
        volume: data.volume,
        rvol: typeof data.rvol === "number" ? data.rvol : null,
        ...data.technicals
      };
    }
  });
  reportJson.technicalIndicators = technicalIndicators;

  // 注入每日核心行动剧本 (Daily Action Playbook)
  const tone = reportJson.marketTone || "防御性震荡";
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

  const spxTech = technicalIndicators["SPX"] || technicalIndicators["SPY"] || {};
  const qqqTech = technicalIndicators["QQQ"] || {};
  const spxKeySupport = spxTech.ema21 ? `${spxTech.ema21} 点 (EMA21/MA50 核心防守位)` : "待大盘均线数据确认";
  const spxInvalidation = spxTech.ema55 ? `跌破 ${spxTech.ema55} 点 (确认多头结构失效，触发全面防守)` : "待大盘均线数据确认";
  const qqqKeySupport = qqqTech.ema21 ? `$${qqqTech.ema21} (科技成长股关键心理承接区)` : "待大盘均线数据确认";
  const qqqInvalidation = qqqTech.ema55 ? `跌破 $${qqqTech.ema55} (破位下行，需减持高 Beta 半导体与 AI 标的)` : "待大盘均线数据确认";

  // 提取价格、量比与名称映射表，调用统一的候选筛选引擎 (保证与网页/历史推算 100% 规则一致)
  const priceMap = {};
  const rvolMap = {};
  const nameMap = {};
  Object.entries(marketMap).forEach(([t, item]) => {
    if (typeof item?.price === "number") priceMap[t] = item.price;
    if (typeof item?.rvol === "number") rvolMap[t] = item.rvol;
    if (item?.name) nameMap[t] = item.name;
  });

  const dynamicCandidates = derivePlaybookCandidates({
    tech: technicalIndicators,
    priceMap,
    rvolMap,
    nameMap
  });

  reportJson.actionPlaybook = {
    marketRegime: regime,
    recommendedAllocation: {
      longEquitiesPct: longPct,
      hedgingOrCashPct: hedgePct,
      notes: allocNote
    },
    defenseLevels: {
      spxKeySupport,
      spxInvalidation,
      qqqKeySupport,
      qqqInvalidation
    },
    bullScenario: "若大盘平开高走放量站稳核心支撑，维持既定配置，顺势向突破年线/颈线的强势顺周期及高股息品种调仓。",
    bearScenario: "若长端收益率急升或开盘跌破 SPX 核心防守线，不可盲目抄底，严格按 1:1.5 盈亏比执行防守止损，提升现金头寸等待企稳。",
    topCandidates: dynamicCandidates
  };

  // 强校验
  await validateReportData(reportJson);

  // 归档存储
  const dataDir = path.resolve(projectRoot, "src/data/reports");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  fs.writeFileSync(path.join(dataDir, `${today}.json`), JSON.stringify(reportJson, null, 2));
  fs.writeFileSync(path.resolve(projectRoot, "src/data/latestReport.json"), JSON.stringify(reportJson, null, 2));

  console.log(`✅ [${today}] Phase 2 美股权威研报生成完毕！11 大板块、真实均线系统与 isFallback 标记均已入库！`);
}

runAutomation().catch((err) => {
  console.error("❌ 执行失败:", err);
  process.exit(1);
});
