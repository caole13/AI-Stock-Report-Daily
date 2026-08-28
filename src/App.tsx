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

      // 1. 标准化宏观 6 大资产
      const rawAssets = raw.macroSummary?.assets || raw.assets || [];
      const sanitizedAssets = rawAssets.map((asset: any) => {
        let priceNum = typeof asset.price === "number" ? asset.price : parseFloat(asset.price);
        if (isNaN(priceNum)) priceNum = 0;
        const changeStr = asset.changePct || "0.00%";
        const isDown = changeStr.startsWith("-");

        return {
          ...asset,
          name: asset.name || asset.ticker,
          ticker: asset.ticker,
          price: priceNum,
          changePct: changeStr,
          change: changeStr,
          trend: asset.trend || (isDown ? "down" : "up"),
          history: [40, 42, 45, 48, 50, 52, 55],
        };
      });

      // 2. 核心映射：将 leaders 映射为 stocks，catalyst 映射为 reason，etf 映射为 code
      const rawSectors = raw.sectors || [];
      const sanitizedSectors = rawSectors.map((sec: any) => {
        const rawStockList = sec.stocks || sec.leaders || [];
        const stocks = rawStockList.map((stk: any) => {
          const changeStr = stk.changePct ? String(stk.changePct) : "0.00%";
          const isDown = changeStr.startsWith("-");
          return {
            ticker: stk.ticker,
            name: stk.name || stk.ticker,
            changePct: changeStr,
            change: changeStr,
            price: stk.price || 100.0,
            reason: stk.reason || stk.catalyst || "【纯技术面/资金轮动，无突发公告】",
            catalyst: stk.catalyst || stk.reason || "",
            status: isDown ? "down" : "up",
          };
        });

        // 自动计算板块平均涨跌幅
        let performance = sec.performance || sec.changePct;
        if (!performance && stocks.length > 0) {
          const validNums = stocks
            .map((s: any) => parseFloat(String(s.changePct).replace(/[%+]/g, "")))
            .filter((n: number) => !isNaN(n));
          if (validNums.length > 0) {
            const avg = validNums.reduce((a: number, b: number) => a + b, 0) / validNums.length;
            performance = (avg >= 0 ? "+" : "") + avg.toFixed(2) + "%";
          }
        }

        return {
          name: sec.name,
          code: sec.code || sec.etf || "ETF",
          etf: sec.etf || sec.code || "ETF",
          performance: performance || "0.00%",
          changePct: performance || "0.00%",
          comment: sec.comment || "",
          stocks,
          leaders: stocks,
        };
      });

      // 3. 构造完整上下文
      const macro = {
        coreThesis: raw.macroSummary?.coreThesis || "",
        transmissionDetail: raw.macroSummary?.transmissionDetail || "",
        assets: sanitizedAssets,
      };

      return {
        ...raw,
        date: raw.date,
        marketStatus: raw.marketStatus || "closed",
        macro,
        assets: sanitizedAssets,
        sectors: sanitizedSectors,
        leadingSectors: sanitizedSectors,
        movers: raw.movers || [],
        transmissions: raw.causalChains || raw.transmissions || [],
        causalChains: raw.causalChains || [],
        aiReport: {
          summary: raw.aiReport?.executiveSnapshot || raw.macroSummary?.coreThesis || "",
          macroAnalysis: raw.aiReport?.dailyExecutiveSummary || raw.macroSummary?.transmissionDetail || "",
          keyTakeaways: raw.aiReport?.heavyweightInsights || [],
          ...raw.aiReport,
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

        {activeTab === "briefing" && currentDayData?.aiReport && (
          <div className="animate-in fade-in duration-150">
            <AiBriefingView
              report={currentDayData.aiReport}
              selectedDate={selectedDate}
              onAskAi={handleAskAi}
            />
          </div>
        )}

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

        {activeTab === "transmissions" && currentDayData?.transmissions && (
          <div className="animate-in fade-in duration-150">
            <CausalTransmissionView
              transmissions={currentDayData.transmissions}
              selectedDate={selectedDate}
              onSelectStock={handleStockClick}
            />
          </div>
        )}

        {activeTab === "chat" && (
          <div className="animate-in fade-in duration-150">
            <AnalystChat
              currentDayData={currentDayData}
              initialQuestion={chatInitialQuestion}
              onClearInitialQuestion={() => setChatInitialQuestion("")}
            />
          </div>
        )}

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

      <StockDetailModal
        ticker={inspectedStockTicker}
        currentDayData={currentDayData}
        onClose={() => setInspectedStockTicker(null)}
        onAskAi={(ticker) => handleAskAi(`请深度解析 ${ticker} 在 ${selectedDate} 的走势逻辑与阻力支撑位`)}
      />

      <PromptPayloadModal
        currentDayData={currentDayData}
        isOpen={isPayloadModalOpen}
        onClose={() => setIsPayloadModalOpen(false)}
      />

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
