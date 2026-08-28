import React, { useState, useMemo } from "react";
import { Header } from "./components/Header";
import { TickerBar } from "./components/TickerBar";
import { MacroOverview } from "./components/MacroOverview";
import { AiBriefingView } from "./components/AiBriefingView";
import { SectorHeatmap } from "./components/SectorHeatmap";
import { MoversScanner } from "./components/MoversScanner";
import { CausalTransmissionView } from "./components/CausalTransmissionView";
import { AnalystChat } from "./components/AnalystChat";
import { StockDetailModal } from "./components/StockDetailModal";
import { PromptPayloadModal } from "./components/PromptPayloadModal";
import latestReport from "./data/latestReport.json";
import {
  HISTORICAL_MARKET_DATABASE,
  AVAILABLE_DATES,
  getHistoricalDataByDate,
} from "./data/historicalData";
import { Terminal } from "lucide-react";

export function App() {
  const initialDate = latestReport?.date || AVAILABLE_DATES[0]?.date;
  const [selectedDate, setSelectedDate] = useState<string>(initialDate);
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "briefing" | "transmissions" | "movers" | "chat" | "raw"
  >("dashboard");
  const [inspectedStockTicker, setInspectedStockTicker] = useState<string | null>(null);
  const [isPayloadModalOpen, setIsPayloadModalOpen] = useState<boolean>(false);
  const [chatInitialQuestion, setChatInitialQuestion] = useState<string>("");

  const currentDayData = useMemo(() => {
    if (selectedDate === latestReport?.date) {
      const raw: any = latestReport;
      const baseFallback = HISTORICAL_MARKET_DATABASE[0] || {};

      // 1. 深度适配 6 大宏观资产卡片 (融合 raw.macro.assets 与 raw.macroSummary)
      const sourceAssets = raw.macro?.assets || raw.assets || raw.macroSummary?.assets || [];
      const defaultMeta: Record<string, { name: string; subtext: string; price: number; changePct: string }> = {
        SPX: { name: "标普500", subtext: "标普500基准指数", price: 7730.99, changePct: "+0.72%" },
        IXIC: { name: "纳斯达克", subtext: "纳斯达克综合指数", price: 26541.35, changePct: "+1.57%" },
        USO: { name: "美国原油基金ETF", subtext: "美国原油基金ETF (去库存支撑反弹)", price: 129.89, changePct: "+1.99%" },
        "GC=F": { name: "COMEX黄金", subtext: "COMEX黄金主力合约", price: 4620.00, changePct: "+0.60%" },
        "^TNX": { name: "10年期美债", subtext: "10年期美债收益率", price: 4.66, changePct: "0.00%" },
        DXY: { name: "美元指数", subtext: "美元指数 (利率预期带动反弹)", price: 99.20, changePct: "+0.04%" },
      };

      const finalAssets = Object.keys(defaultMeta).map((key) => {
        const found = sourceAssets.find((a: any) => a?.ticker === key || a?.name === defaultMeta[key].name || a?.id === key);
        const meta = defaultMeta[key];
        const price = found?.price ?? meta.price;
        const changePct = found?.changePct ?? meta.changePct;
        const isDown = String(changePct).startsWith("-");
        return {
          id: key,
          ticker: key,
          name: found?.name || meta.name,
          subtext: found?.subtext || meta.subtext,
          price: Number(price),
          change: changePct,
          changePct: changePct,
          trend: found?.trend || (isDown ? "down" : "up"),
          status: found?.status || (isDown ? "down" : "up"),
          history: Array.isArray(found?.history) && found.history.length > 0 
            ? found.history 
            : (isDown ? [55, 52, 50, 48, 45, 43, 40] : [40, 42, 45, 48, 50, 52, 55]),
        };
      });

      const macro = {
        coreThesis: raw.macro?.coreThesis || raw.macroSummary?.coreThesis || baseFallback.macro?.coreThesis || "",
        transmissionDetail: raw.macro?.transmissionDetail || raw.macroSummary?.transmissionDetail || baseFallback.macro?.transmissionDetail || "",
        assets: finalAssets,
      };

      // 2. 深度适配板块数据：将 leaders 真正注入到 stocks 中，并计算真实的板块涨跌幅
      const rawSectors = raw.sectors || raw.leadingSectors || baseFallback.sectors || [];
      const sanitizedSectors = rawSectors.map((sec: any) => {
        const sourceList = (sec.leaders && sec.leaders.length > 0) ? sec.leaders : (sec.stocks || []);
        
        const stocks = sourceList.map((stk: any) => {
          const changeStr = stk.changePct ? String(stk.changePct) : "+0.00%";
          const isDown = changeStr.startsWith("-");
          return {
            ticker: stk.ticker || "UNKNOWN",
            name: stk.name || stk.ticker,
            changePct: changeStr,
            price: stk.price || null,
            reason: stk.catalyst || stk.reason || "【纯技术面/资金轮动，无突发公告】",
            catalyst: stk.catalyst || stk.reason || "【纯技术面/资金轮动，无突发公告】",
            status: stk.status || (isDown ? "down" : "up"),
          };
        });

        // 根据成分股计算板块加权/平均真实涨跌幅
        const numList = stocks
          .map((s: any) => parseFloat(String(s.changePct).replace(/[%+]/g, "")))
          .filter((n: number) => !isNaN(n));
        const avg = numList.length > 0 ? numList.reduce((a: number, b: number) => a + b, 0) / numList.length : 0;
        const formattedAvg = (avg >= 0 ? "+" : "") + avg.toFixed(2) + "%";

        return {
          name: sec.name || "板块",
          code: sec.etf || sec.code || "ETF",
          etf: sec.etf || sec.code || "ETF",
          performance: formattedAvg,
          changePct: formattedAvg,
          comment: sec.comment || sec.reason || "",
          stocks: stocks,
          leaders: stocks,
        };
      });

      // 3. 提取所有个股供 TickerBar 滚动条展示
      const allStocks = sanitizedSectors.flatMap((s: any) => s.stocks);

      // 4. 适配因果链与异动股
      const transmissions = raw.causalChains || raw.transmissions || baseFallback.transmissions || [];
      const movers = raw.movers || raw.moversScanner || baseFallback.movers || [];

      return {
        ...raw,
        date: raw.date,
        marketStatus: raw.marketStatus || "Closed",
        macro,
        assets: finalAssets,
        sectors: sanitizedSectors,
        stocks: allStocks,
        tickerTape: allStocks,
        movers,
        transmissions,
        aiReport: raw.aiReport || {
          summary: macro.coreThesis,
          macroAnalysis: macro.transmissionDetail,
          keyTakeaways: raw.keyTakeaways || [],
        },
      };
    }

    return getHistoricalDataByDate(selectedDate) || HISTORICAL_MARKET_DATABASE[0];
  }, [selectedDate]);

  const handleAskAi = (question: string) => {
    setChatInitialQuestion(question);
    setActiveTab("chat");
  };

  const handleStockClick = (ticker: string) => {
    setInspectedStockTicker(ticker);
  };

  return (
    <div className="min-h-screen bg-[#080808] text-slate-200 flex flex-col selection:bg-[#d4af37] selection:text-black font-sans">
      <Header
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenPayloadModal={() => setIsPayloadModalOpen(true)}
      />

      <TickerBar
        currentDayData={currentDayData}
        onSelectTicker={handleStockClick}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* TAB 1: 全景大盘 & 领头羊 */}
        {activeTab === "dashboard" && (
          <div className="space-y-8 animate-in fade-in duration-150">
            {currentDayData?.macro && (
              <MacroOverview
                macroData={currentDayData.macro}
                selectedDate={selectedDate}
              />
            )}

            {currentDayData?.sectors && currentDayData.sectors.length > 0 && (
              <SectorHeatmap
                sectors={currentDayData.sectors}
                selectedDate={selectedDate}
                onSelectStock={handleStockClick}
              />
            )}
          </div>
        )}

        {/* TAB 2: 当日 AI 深度研报 */}
        {activeTab === "briefing" && currentDayData?.aiReport && (
          <div className="animate-in fade-in duration-150">
            <AiBriefingView
              report={currentDayData.aiReport}
              selectedDate={selectedDate}
              onAskAi={handleAskAi}
            />
          </div>
        )}

        {/* TAB 3: 异动股与关键位 */}
        {activeTab === "movers" && currentDayData?.movers && (
          <div className="animate-in fade-in duration-150">
            <MoversScanner
              movers={currentDayData.movers}
              selectedDate={selectedDate}
              onAskAiForStock={(ticker) =>
                handleAskAi(`请结合 ${selectedDate} 盘面，给出 ${ticker} 的具体操盘计划与多空分界位`)
              }
            />
          </div>
        )}

        {/* TAB 4: 跨资产因果传导 */}
        {activeTab === "transmissions" && currentDayData?.transmissions && (
          <div className="animate-in fade-in duration-150">
            <CausalTransmissionView
              transmissions={currentDayData.transmissions}
              selectedDate={selectedDate}
              onSelectStock={handleStockClick}
            />
          </div>
        )}

        {/* TAB 5: AI 对话推演 */}
        {activeTab === "chat" && (
          <div className="animate-in fade-in duration-150">
            <AnalystChat
              currentDayData={currentDayData}
              initialQuestion={chatInitialQuestion}
              onClearInitialQuestion={() => setChatInitialQuestion("")}
            />
          </div>
        )}

        {/* TAB 6: 原始数据载荷 */}
        {activeTab === "raw" && (
          <div className="bg-[#121212] border border-slate-800 rounded-sm p-6 space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-[#d4af37]" />
                <h3 className="text-base font-serif font-bold text-white">
                  {selectedDate} 原始结构化数据 (JSON Representation)
                </h3>
              </div>
              <button
                onClick={() => setIsPayloadModalOpen(true)}
                className="px-3 py-1.5 rounded-sm bg-[#181818] hover:bg-[#222222] text-[#d4af37] border border-slate-800 text-xs font-mono"
              >
                查看 Prompt 文本
              </button>
            </div>
            <pre className="text-xs font-mono text-slate-300 bg-[#080808] p-4 rounded-sm border border-slate-850 overflow-x-auto max-h-[600px]">
              {JSON.stringify(currentDayData, null, 2)}
            </pre>
          </div>
        )}
      </main>

      {/* 4. 个股弹窗 */}
      <StockDetailModal
        ticker={inspectedStockTicker}
        currentDayData={currentDayData}
        onClose={() => setInspectedStockTicker(null)}
        onAskAi={(ticker) => handleAskAi(`请深度解析 ${ticker} 在 ${selectedDate} 的走势逻辑与阻力支撑位`)}
      />

      {/* 5. Prompt 弹窗 */}
      <PromptPayloadModal
        currentDayData={currentDayData}
        isOpen={isPayloadModalOpen}
        onClose={() => setIsPayloadModalOpen(false)}
      />

      {/* 6. 页脚 */}
      <footer className="border-t border-slate-850 bg-[#070707] py-4 text-center text-xs font-mono text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>MarketPulse Quantitative Research Engine • {selectedDate} 归档</span>
          <span className="text-slate-600">纯前端交互架构 • 零外部爬虫依赖 • 高度防崩溃保护</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
