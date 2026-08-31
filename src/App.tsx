import { useState, useMemo, useEffect } from "react";
import {
  HISTORICAL_MARKET_DATABASE,
  getHistoricalDataByDate,
  AVAILABLE_DATES,
} from "./data/historicalData";
import latestReport from "./data/latestReport.json";
import { Header } from "./components/Header";
import { TickerBar } from "./components/TickerBar";
import { MacroOverview } from "./components/MacroOverview";
import { AiBriefingView } from "./components/AiBriefingView";
import { SectorHeatmap } from "./components/SectorHeatmap";
import { MoversScanner } from "./components/MoversScanner";
import { CausalTransmissionView } from "./components/CausalTransmissionView";
import { StockDetailModal } from "./components/StockDetailModal";
import { PromptPayloadModal } from "./components/PromptPayloadModal";
import { AnalystChat } from "./components/AnalystChat";
import { TabType, StockDetail } from "./types";

export function App() {
  // 1. 优先将默认日期设为 latestReport 中的最新日期
  const defaultDate = latestReport?.date || AVAILABLE_DATES[0]?.date || "2026-08-28";
  const [selectedDate, setSelectedDate] = useState<string>(defaultDate);
  const [activeTab, setActiveTab] = useState<TabType>("macro");
  const [selectedStockTicker, setSelectedStockTicker] = useState<string | null>(null);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [isPayloadModalOpen, setIsPayloadModalOpen] = useState(false);

  // 当 latestReport 更新时，自动同步为最新日期
  useEffect(() => {
    if (latestReport?.date && latestReport.date !== selectedDate) {
      setSelectedDate(latestReport.date);
    }
  }, [latestReport?.date]);

  // 2. 切换日期时自动回到宏观大盘首页
  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    setActiveTab("macro");
  };

  // 3. 自动适配字段差异，保证全景大盘与宏观卡片完美渲染
  const currentDayData = useMemo(() => {
    if (selectedDate === latestReport?.date) {
      const macroData = (latestReport as any).macroSummary || (latestReport as any).macro || {};
      const rawAssets = macroData.assets || macroData.items || [];
      const formattedItems = rawAssets.map((a: any) => {
        const numChange = a.changePercent !== undefined && a.changePercent !== null
          ? a.changePercent
          : (a.changePct ? parseFloat(String(a.changePct).replace("%", "").replace("+", "")) : 0);
        const val = a.currentValue ?? a.price ?? (a.prevValue ? a.prevValue * (1 + numChange / 100) : 100);
        return {
          name: a.name || a.ticker,
          ticker: a.ticker || "",
          currentValue: val,
          price: val,
          changePercent: numChange,
          changePct: a.changePct || `${numChange >= 0 ? "+" : ""}${numChange.toFixed(2)}%`,
          trend: a.trend || (numChange > 0 ? "up" : numChange < 0 ? "down" : "neutral"),
          unit: a.unit || (a.ticker?.includes("TNX") ? "%" : a.ticker?.includes("DXY") || a.ticker?.includes("GSPC") ? "pts" : "USD"),
          description: a.description || "",
          sparkline: a.sparkline || [val * 0.992, val * 0.996, val * 1.002, val],
        };
      });

      return {
        ...latestReport,
        date: latestReport.date,
        marketStatus: latestReport.marketStatus || "Closed",
        macro: {
          coreThesis: macroData.coreThesis || macroData.summary || "",
          transmissionDetail: macroData.transmissionDetail || "",
          summary: macroData.summary || macroData.coreThesis || "",
          items: formattedItems,
          assets: rawAssets,
          thesis: macroData.coreThesis || "",
          details: macroData.transmissionDetail || ""
        },
        sectors: ((latestReport as any).sectors || []).map((s: any, idx: number) => ({
          ...s,
          id: s.id || s.etf || s.name || `sec-${idx}`,
        })),
        movers: ((latestReport as any).movers || []).map((m: any, idx: number) => ({
          ...m,
          id: m.id || m.ticker || `mover-${idx}`,
        })),
        transmissions: (((latestReport as any).causalChains || (latestReport as any).transmissions || [])).map((t: any, idx: number) => ({
          ...t,
          id: t.id || `trans-${idx}`,
        })),
        aiReport: (latestReport as any).aiReport || {}
      };
    }
    return getHistoricalDataByDate(selectedDate) || HISTORICAL_MARKET_DATABASE[0];
  }, [selectedDate]);

  // 从当前数据和历史数据中提取所选股票的详尽上下文
  const selectedStockData = useMemo<StockDetail | null>(() => {
    if (!selectedStockTicker) return null;

    // 1. 查找当天 movers
    const mover = (currentDayData.movers || []).find(
      (m: any) => m.ticker.toUpperCase() === selectedStockTicker.toUpperCase()
    );

    // 2. 查找板块成份股
    let sectorLeader: any = null;
    let sectorName = "";
    (currentDayData.sectors || []).forEach((sec: any) => {
      const found = (sec.leaders || []).find(
        (l: any) => l.ticker.toUpperCase() === selectedStockTicker.toUpperCase()
      );
      if (found) {
        sectorLeader = found;
        sectorName = sec.name;
      }
    });

    if (!mover && !sectorLeader) {
      return {
        ticker: selectedStockTicker,
        name: selectedStockTicker,
        sector: "美股市场主要资产",
        price: 0,
        changePercent: 0,
        catalyst: "当日跟随指数及板块整体情绪波动",
        newsAttribution: "当日跟随指数及板块整体情绪波动",
        shortTermOutlook: "关注大盘宏观主线及关键均线支撑位",
        midTermLogic: "依托行业中长期成长逻辑与资金流向",
        invalidationLevel: "视大盘关键点位而定",
      };
    }

    return {
      ticker: selectedStockTicker,
      name: mover?.name || sectorLeader?.name || selectedStockTicker,
      sector: mover?.sector || sectorName || "核心标的",
      price: mover?.price || sectorLeader?.price || 0,
      changePercent: mover?.changePercent ?? sectorLeader?.changePercent ?? 0,
      catalyst: mover?.newsAttribution || sectorLeader?.catalyst || "业绩驱动或宏观流动性传导",
      newsAttribution: mover?.newsAttribution || sectorLeader?.catalyst || "业绩驱动或宏观流动性传导",
      shortTermOutlook: mover?.shortTermOutlook || "维持高位震荡整理或跟随板块轮动",
      midTermLogic: mover?.midTermLogic || "核心业务壁垒与行业赛道长期空间",
      invalidationLevel: mover?.invalidationLevel || "跌破前期平台支撑位",
      rvol: mover?.rvol || "1.2x",
      historicalCatalysts: mover?.historicalCatalysts || [],
    };
  }, [selectedStockTicker, currentDayData]);

  const handleSelectStock = (ticker: string) => {
    setSelectedStockTicker(ticker);
    setIsStockModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-slate-100 flex flex-col selection:bg-[#d4af37] selection:text-black">
      {/* 顶部主导航栏 */}
      <Header
        selectedDate={selectedDate}
        onSelectDate={handleDateChange}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenPayloadModal={() => setIsPayloadModalOpen(true)}
      />

      {/* 实时/盘后滚动行情指示条 */}
      <TickerBar currentDayData={currentDayData} onSelectStock={handleSelectStock} />

      {/* 主体视口区域 */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* 全局大盘与跨资产宏观透视 */}
        <MacroOverview macroData={currentDayData.macro} selectedDate={selectedDate} />

        {/* 核心工作台标签页 */}
        {activeTab === "macro" && (
          <AiBriefingView
            data={currentDayData}
            onSelectStock={handleSelectStock}
            onSwitchTab={setActiveTab}
          />
        )}

        {activeTab === "sectors" && (
          <SectorHeatmap
            sectors={currentDayData.sectors || []}
            onSelectStock={handleSelectStock}
          />
        )}

        {activeTab === "movers" && (
          <MoversScanner
            movers={currentDayData.movers || []}
            onSelectStock={handleSelectStock}
          />
        )}

        {activeTab === "transmissions" && (
          <CausalTransmissionView
            transmissions={currentDayData.transmissions || []}
            onSelectStock={handleSelectStock}
          />
        )}

        {/* AI 首席量化策略师对话助手 */}
        <div className="pt-4">
          <AnalystChat currentDayData={currentDayData} selectedDate={selectedDate} />
        </div>
      </main>

      {/* 底部版权与免责声明 */}
      <footer className="border-t border-slate-900 bg-[#0d0d0d] py-6 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span>AI Macro-Quant Terminal · v2.5.0 Production Ready</span>
          </div>
          <p>
            声明：本系统由 Google Gemini 2.5 Pro / Flash 全自动化驱动，所有研报与传导链仅供参考，不构成任何投资买卖建议。
          </p>
        </div>
      </footer>

      {/* 个股深度研报弹窗 */}
      <StockDetailModal
        stock={selectedStockData}
        isOpen={isStockModalOpen}
        onClose={() => setIsStockModalOpen(false)}
        selectedDate={selectedDate}
      />

      {/* Prompt Payload 架构与调试透明弹窗 */}
      <PromptPayloadModal
        isOpen={isPayloadModalOpen}
        onClose={() => setIsPayloadModalOpen(false)}
        currentDayData={currentDayData}
      />
    </div>
  );
}

export default App;
