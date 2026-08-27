import { GoogleGenAI, Type } from "@google/genai";
import fs from "fs";
import path from "path";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("❌ 缺少 GEMINI_API_KEY 环境变量！");
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });

const reportSchema = {
  type: Type.OBJECT,
  properties: {
    date: { type: Type.STRING },
    marketStatus: { type: Type.STRING },
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
              price: { type: Type.NUMBER, nullable: true },
              changePct: { type: Type.STRING, nullable: true },
              trend: { type: Type.STRING, enum: ["up", "down", "neutral"] }
            },
            required: ["name", "ticker", "trend"]
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
                changePct: { type: Type.STRING, nullable: true },
                catalyst: { type: Type.STRING }
              },
              required: ["ticker", "catalyst"]
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
          changePct: { type: Type.STRING, nullable: true },
          rvol: { type: Type.STRING, nullable: true },
          sector: { type: Type.STRING },
          newsAttribution: { type: Type.STRING },
          shortTermOutlook: { type: Type.STRING },
          midTermLogic: { type: Type.STRING },
          invalidationLevel: { type: Type.STRING }
        },
        required: ["ticker", "name", "sector", "newsAttribution", "shortTermOutlook", "midTermLogic", "invalidationLevel"]
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
  required: ["date", "marketStatus", "macroSummary", "aiReport", "sectors", "movers", "causalChains"]
};

async function runAutomation() {
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date());

  console.log(`[${new Date().toISOString()}] 启动自动化流水线，目标交易日: ${today}...`);

  const prompt = `请启用 Google Search 工具，检索美股【${today}】今日盘后真实的收盘数据与突发重大新闻（如重磅财报、宏观指标），严格按预设 Schema 生成结构化 JSON 研报。

==================== 【必须检索与固定的资产清单】 ====================
请确保 macroSummary.assets 数组必须且仅包含以下 6 个固定标的（原油部分必须使用 USO，严禁使用 WTI 或 CL=F）：
1. {"name": "标普500", "ticker": "SPX"}
2. {"name": "纳斯达克", "ticker": "IXIC"}
3. {"name": "美国原油基金ETF", "ticker": "USO"}
4. {"name": "COMEX黄金", "ticker": "GC=F"}
5. {"name": "10年期美债", "ticker": "^TNX"}
6. {"name": "美元指数", "ticker": "DXY"}

==================== 【核心板块与领头羊覆盖】 ====================
请对以下四大板块的代表龙头进行行情与财报催化检索并填入 sectors：
- 科技成长 (XLK): NVDA, MSFT, AAPL
- 医疗健康 (XLV): LLY, UNH
- 可选/必选消费 (XLY): AMZN, TSLA
- 能源与金融 (XLE): XOM, JPM

==================== 【核心总结与字数硬性约束 (200-300字)】 ====================
请在 aiReport.dailyExecutiveSummary 中提供一段字数在 200~300 字的今日大局精炼总结：
- 涵盖内容：宏观利率/大宗/指数变动与底层传导机制、核心财报业绩超预期点、资金主线轮动方向。
- 语言风格：专业华尔街策略师口吻，穿透底层逻辑，信息高密度，杜绝废话。

==================== 【检索建议 Query（分阶段精确检索）】 ====================
- Query 1（宏观与大盘）："US stock market close ${today} SPX IXIC USO ETF Gold 10Y Treasury DXY"
- Query 2（板块巨头行情）："NVDA MSFT AAPL LLY UNH AMZN TSLA XOM JPM stock price change ${today}"
- Query 3（异动与财报大事件）："Stock market biggest movers ${today} earnings news volume"

==================== 【格式与零幻觉铁律】 ====================
1. 【禁止数字脑补】：若某标的的收盘价或涨跌幅未在搜索结果中明确出现，对应 price 或 changePct 字段必须直接填 null。
2. 【无新闻标记】：若个股异动仅为技术面反弹或资金轮动，在 newsAttribution/catalyst 中必须明确填写：“【纯技术面/资金轮动，无突发公告】”。
3. 【纯文本 JSON】：严禁在字符串内部插入任何 Markdown 链接、URL 或角标引用（如 [[1](...)]）。`;

  console.log(`📡 正在调用 Gemini 3.6 Flash 生成研报...`);
  const response = await ai.models.generateContent({
    model: "gemini-3.6-flash",
    contents: prompt,
    config: {
      systemInstruction: `你是一名兼具顶级宏观策略视野与量化视角的华尔街股票策略分析师。
你的职责是在美股收盘后，根据联网搜索到的真实盘后数据，生成严谨、专业、零幻觉的结构化 JSON 投研复盘。
严禁编造数据，查不到的点位一律返回 null；严禁插入任何 Markdown 链接或 URL 格式。`,
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: reportSchema
    }
  });

  const reportJson = JSON.parse(response.text);

  const dataDir = path.resolve("./src/data/reports");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  fs.writeFileSync(path.join(dataDir, `${today}.json`), JSON.stringify(reportJson, null, 2));
  fs.writeFileSync(path.resolve("./src/data/latestReport.json"), JSON.stringify(reportJson, null, 2));

  console.log(`✅ [${today}] 美股投研研报已成功写入并归档！`);
}

runAutomation().catch((err) => {
  console.error("❌ 执行失败:", err);
  process.exit(1);
});
