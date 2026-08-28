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

      // 1. 深度对齐 MacroOverview 资产数据规范
      const defaultAssetMeta: Record<string, any> = {
        SPX: { name: "标普500", ticker: "SPX", subtext: "标普500基准指数 (窄幅收平)" },
        IXIC: { name: "纳斯达克", ticker: "IXIC", subtext: "纳斯达克综合指数 (窄幅收平)" },
        USO: { name: "美国原油基金ETF", ticker: "USO", subtext: "美国原油基金ETF (去库存支撑小幅反弹)" },
        "GC=F": { name: "COMEX黄金", ticker: "GC=F", subtext: "COMEX黄金主力合约 (美元走强承压)" },
        "^TNX": { name: "10年期美债", ticker: "^TNX", subtext: "10年期美债收益率 (核心PCE持平微升)" },
        DXY: { name: "美元指数", ticker: "DXY", subtext: "美元指数 (利率预期带动反弹)" },
      };

      const rawAssets = Array.isArray(raw.assets) ? raw.assets : (raw.macro?.assets || []);
      const assets = Object.keys(defaultAssetMeta).map((ticker) => {
        const found = rawAssets.find((a: any) => a.ticker === ticker || a.name === defaultAssetMeta[ticker].name);
        return {
          ...defaultAssetMeta[ticker],
          price: found?.price ?? 0,
          changePct: found?.changePct ?? "0.00%",
          trend: found?.trend ?? (String(found?.changePct || "").startsWith("-") ? "down" : "up"),
          history: found?.history || [40, 45, 42, 48, 52, 50, 55],
        };
      });

      const macro = {
        coreThesis: raw.macroSummary?.coreThesis || raw.macro?.coreThesis || baseFallback.macro?.coreThesis || "",
        transmissionDetail: raw.macroSummary?.transmissionDetail || raw.macro?.transmissionDetail || baseFallback.macro?.transmissionDetail || "",
        assets,
      };

      // 2. 深度对齐 SectorHeatmap 板块与成分股数据
      const rawSectors = raw.sectors || raw.leadingSectors || baseFallback.sectors || [];
      const sectors = rawSectors.map((sec: any) => {
        const stocks = (sec.stocks || []).map((stk: any) => ({
          ticker: stk.ticker,
          name: stk.name || stk.ticker,
          changePct: stk.changePct || (stk.price ? "+0.00%" : "---"),
          reason: stk.reason || "【资金轮动与估值消化】",
          status: stk.status || (String(stk.changePct || "").startsWith("-") ? "down" : "up"),
        }));

        let calculatedChange = sec.changePct || sec.performance;
        if (!calculatedChange && stocks.length > 0) {
          const numList = stocks
            .map((s: any) => parseFloat(String(s.changePct).replace("%", "")))
            .filter((n: number) => !isNaN(n));
          if (numList.length > 0) {
            const avg = numList.reduce((a: number, b: number) => a + b, 0) / numList.length;
            calculatedChange = (avg >= 0 ? "+" : "") + avg.toFixed(2) + "%";
          }
        }

        return {
          ...sec,
          changePct: calculatedChange || "+0.00%",
          performance: calculatedChange || "+0.00%",
          stocks,
        };
      });

      return {
        ...raw,
        date: raw.date,
        marketStatus: raw.marketStatus || "Closed",
        macro,
        sectors,
        movers: raw.movers || raw.moversScanner || baseFallback.movers || [],
        transmissions: raw.transmissions || raw.causalChains || baseFallback.transmissions || [],
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
