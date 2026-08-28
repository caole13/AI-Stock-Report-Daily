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
    // 获取基础模板用于兜底结构
    const baseFallback: any = HISTORICAL_MARKET_DATABASE[0] || {};

    if (selectedDate === latestReport?.date) {
      const raw: any = latestReport;

      // 1. 深度对齐 6 大资产（无论组件读取 macro.assets 还是根 assets，都能精准命中）
      const defaultAssetMeta: Record<string, { name: string; subtext: string; fallbackPrice: number; fallbackChange: string }> = {
        SPX: { name: "标普500", subtext: "标普500基准指数", fallbackPrice: 7730.99, fallbackChange: "+0.72%" },
        IXIC: { name: "纳斯达克", subtext: "纳斯达克综合指数", fallbackPrice: 26541.35, fallbackChange: "+1.57%" },
        USO: { name: "美国原油基金ETF", subtext: "美国原油基金ETF", fallbackPrice: 126.87, fallbackChange: "+0.57%" },
        "GC=F": { name: "COMEX黄金", subtext: "COMEX黄金主力合约", fallbackPrice: 4649.90, fallbackChange: "-0.95%" },
        "^TNX": { name: "10年期美债", subtext: "10年期美债收益率", fallbackPrice: 4.66, fallbackChange: "+0.73%" },
        DXY: { name: "美元指数", subtext: "美元指数", fallbackPrice: 99.15, fallbackChange: "+0.24%" },
      };

      const rawAssets = Array.isArray(raw.assets) ? raw.assets : (raw.macro?.assets || []);
      const sanitizedAssets = Object.keys(defaultAssetMeta).map((ticker) => {
        const meta = defaultAssetMeta[ticker];
        const found = rawAssets.find((a: any) => a?.ticker === ticker || a?.name === meta.name);

        let priceNum = found?.price !== null && found?.price !== undefined ? Number(found.price) : meta.fallbackPrice;
        if (isNaN(priceNum)) priceNum = meta.fallbackPrice;

        const changeStr = found?.changePct ? String(found.changePct) : meta.fallbackChange;
        const isDown = changeStr.startsWith("-");

        return {
          id: ticker,
          name: meta.name,
          ticker: ticker,
          subtext: meta.subtext,
          price: priceNum,
          changePct: changeStr,
          change: changeStr,
          trend: found?.trend || (isDown ? "down" : "up"),
          status: isDown ? "down" : "up",
          history: Array.isArray(found?.history) && found.history.length > 0
            ? found.history
            : (isDown ? [55, 52, 50, 48, 45, 43, 40] : [40, 42, 45, 48, 50, 52, 55]),
        };
      });

      // 2. 深度对齐板块与成分股，确保 performance 与 changePct 双写
      const rawSectors = raw.sectors || raw.leadingSectors || baseFallback.sectors || [];
      const sanitizedSectors = rawSectors.map((sec: any) => {
        const stocks = (sec.stocks || []).map((stk: any) => {
          const changeStr = stk.changePct ? String(stk.changePct) : "+0.00%";
          let priceNum = stk.price !== null && stk.price !== undefined ? Number(stk.price) : 100.0;
          if (isNaN(priceNum)) priceNum = 100.0;

          return {
            ticker: stk.ticker || "STOCK",
            name: stk.name || stk.ticker || "成分股",
            changePct: changeStr,
            change: changeStr,
            price: priceNum,
            reason: stk.reason || "【纯技术面/资金轮动】",
            status: stk.status || (changeStr.startsWith("-") ? "down" : "up"),
          };
        });

        let performance = sec.performance || sec.changePct;
        if (!performance && stocks.length > 0) {
          const numList = stocks
            .map((s: any) => parseFloat(String(s.changePct).replace(/[%+]/g, "")))
            .filter((n: number) => !isNaN(n));
          if (numList.length > 0) {
            const avg = numList.reduce((a: number, b: number) => a + b, 0) / numList.length;
            performance = (avg >= 0 ? "+" : "") + avg.toFixed(2) + "%";
          }
        }

        return {
          ...sec,
          name: sec.name || "板块",
          code: sec.code || sec.ticker || "ETF",
          performance: performance || "+0.00%",
          changePct: performance || "+0.00%",
          comment: sec.comment || sec.reason || "",
          stocks,
        };
      });

      const macroCore = {
        coreThesis: raw.macroSummary?.coreThesis || raw.macro?.coreThesis || baseFallback.macro?.coreThesis || "今日美股大盘全天呈现低波动整固格局。",
        transmissionDetail: raw.macroSummary?.transmissionDetail || raw.macro?.transmissionDetail || baseFallback.macro?.transmissionDetail || "美债收益率与美元微升，资金聚集核心标的。",
        assets: sanitizedAssets,
      };

      return {
        ...raw,
        date: raw.date,
        marketStatus: raw.marketStatus || "Closed",
        macro: macroCore,
        assets: sanitizedAssets,
        sectors: sanitizedSectors,
        leadingSectors: sanitizedSectors,
        movers: raw.movers || raw.moversScanner || baseFallback.movers || [],
        transmissions: raw.transmissions || raw.causalChains || baseFallback.transmissions || [],
        aiReport: raw.aiReport || {
          summary: macroCore.coreThesis,
          macroAnalysis: macroCore.transmissionDetail,
          keyTakeaways: raw.keyTakeaways || [],
        },
      };
    }

    return getHistoricalDataByDate(selectedDate) || baseFallback;
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
            {/* 宏观大盘概览与 6 大资产卡片 */}
            <MacroOverview
              macroData={currentDayData?.macro}
              selectedDate={selectedDate}
            />

            {/* 行业领头羊与板块雷达 */}
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
