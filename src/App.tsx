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
  // 1. 动态生成包含最新日期的完整日期列表
  const dynamicDates = useMemo(() => {
    if (!latestReport?.date) return AVAILABLE_DATES;
    const exists = AVAILABLE_DATES.some((d) => d.date === latestReport.date);
    if (!exists) {
      return [
        {
          date: latestReport.date,
          label: `${latestReport.date} · 盘后最新`,
          status: latestReport.marketStatus || "Closed"
        },
        ...AVAILABLE_DATES
      ];
    }
    return AVAILABLE_DATES;
  }, []);

  // 2. 默认选中最新生成的日期 (例如 2026-08-27)
  const defaultDate = latestReport?.date || dynamicDates[0]?.date;
  const [selectedDate, setSelectedDate] = useState<string>(defaultDate);
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "briefing" | "transmissions" | "movers" | "chat" | "raw"
  >("dashboard");
  const [inspectedStockTicker, setInspectedStockTicker] = useState<string | null>(null);
  const [isPayloadModalOpen, setIsPayloadModalOpen] = useState<boolean>(false);
  const [chatInitialQuestion, setChatInitialQuestion] = useState<string>("");

  // 3. 自动适配字段差异，保证全景大盘与宏观卡片完美渲染
  const currentDayData = useMemo(() => {
    if (selectedDate === latestReport?.date) {
      const macroData = latestReport.macroSummary || {};
      return {
        ...latestReport,
        date: latestReport.date,
        marketStatus: latestReport.marketStatus,
        macro: {
          coreThesis: macroData.coreThesis || "",
          transmissionDetail: macroData.transmissionDetail || "",
          assets: macroData.assets || [],
          // 兼容老组件可能用到的别名字段
          thesis: macroData.coreThesis || "",
          details: macroData.transmissionDetail || ""
        },
        sectors: latestReport.sectors || [],
        movers: latestReport.movers || [],
        transmissions: latestReport.causalChains || [],
        aiReport: latestReport.aiReport || {}
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
      {/* 1. 顶部栏与日期切换器 */}
      <Header
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenPayloadModal={() => setIsPayloadModalOpen(true)}
      />

      {/* 2. 行情跑马灯 */}
      <TickerBar
        currentDayData={currentDayData}
        onSelectTicker={handleStockClick}
      />

      {/* 3. 核心内容区域 */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* TAB 1: 全景大盘 & 领头羊 */}
        {activeTab === "dashboard" && (
          <div className="space-y-8 animate-in fade-in duration-150">
            {/* 宏观六大核心资产卡片 (标普、纳指、原油、黄金、美债、美元) */}
            {currentDayData?.macro && (
              <MacroOverview
                macroData={currentDayData.macro}
                selectedDate={selectedDate}
              />
            )}

            {/* 四大板块龙头 */}
            {currentDayData?.sectors && (
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

        {/* TAB 5: AI 策略师对话 */}
        {activeTab === "chat" && (
          <div className="animate-in fade-in duration-150">
            <AnalystChat
              currentDayData={currentDayData}
              initialQuestion={chatInitialQuestion}
              onClearInitialQuestion={() => setChatInitialQuestion("")}
            />
          </div>
        )}

        {/* TAB 6: 原始数据结构 */}
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

      {/* 5. Prompt Modal */}
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
