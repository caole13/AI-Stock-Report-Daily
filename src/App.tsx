import { useState, useMemo } from "react";
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

// 1. 加载 reports 目录下所有 json 文件
const reportsModules = import.meta.glob("./data/reports/*.json", { eager: true }) as Record<string, any>;

// 2. 提取并按日期排序
const allReportDates = Object.keys(reportsModules)
  .map((p) => p.match(/\/([^/]+)\.json$/)?.[1] || "")
  .filter(Boolean)
  .sort((a, b) => b.localeCompare(a));

export function App() {
  // 默认日期为最新的一天
  const defaultDate = allReportDates[0] || "2026-09-01";
  const [selectedDate, setSelectedDate] = useState<string>(defaultDate);
  const [activeTab, setActiveTab] = useState<TabType>("macro");
  const [selectedStockTicker, setSelectedStockTicker] = useState<string | null>(null);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [isPayloadModalOpen, setIsPayloadModalOpen] = useState(false);

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    setActiveTab("macro");
  };

  // 根据选中的日期加载对应的研报
  const currentDayData = useMemo(() => {
    // 优先从 reports/*.json 中查找对应日期
    const targetModule = reportsModules[`./data/reports/${selectedDate}.json`];
    const report = targetModule?.default || targetModule;

    if (report) {
      const macroData = report.macroSummary || report.macro || {};
      const rawAssets = macroData.assets || macroData.items || [];
      const formattedItems = rawAssets.map((a: any) => {
        const numChange =
          a.changePercent !== undefined && a.changePercent !== null
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
        ...report,
        date: report.date || selectedDate,
        marketStatus: report.marketStatus || "Closed",
        macro: {
          coreThesis: macroData.coreThesis || macroData.summary || "",
          transmissionDetail: macroData.transmissionDetail || "",
          summary: macroData.summary || macroData.coreThesis || "",
          items: formattedItems,
          assets: rawAssets,
          thesis: macroData.coreThesis || "",
          details: macroData.transmissionDetail || ""
        },
        sectors: (report.sectors || []).map((s: any, idx: number) => ({
          ...s,
          id: s.id || s.etf || s.name || `sec-${idx}`,
        })),
        movers: (report.movers || []).map((m: any, idx: number) => ({
          ...m,
          id: m.id || m.ticker || `mover-${idx}`,
        })),
        transmissions: ((report.causalChains || report.transmissions || [])).map((t: any, idx: number) => ({
          ...t,
          id: t.id || `trans-${idx}`,
        })),
        aiReport: report.aiReport || {}
      };
    }

    return null;
  }, [selectedDate]);

  // 个股详情弹窗数据抽取
  const selectedStockData = useMemo<StockDetail | null>(() => {
    if (!selectedStockTicker || !currentDayData) return null;
    const mover = (currentDayData.movers || []).find(
      (m: any) => m.ticker.toUpperCase() === selectedStockTicker.toUpperCase()
    );
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

  if (!currentDayData) {
    return <div className="min-h-screen bg-[#0a0a0a] text-slate-400 p-8 text-center">暂无该日期研报数据</div>;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-slate-100 flex flex-col selection:bg-[#d4af37] selection:text-black">
      <Header
        selectedDate={selectedDate}
        onSelectDate={handleDateChange}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenPayloadModal={() => setIsPayloadModalOpen(true)}
      />

      <TickerBar currentDayData={currentDayData} onSelectStock={handleSelectStock} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <MacroOverview macroData={currentDayData.macro} selectedDate={selectedDate} />

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

        <div className="pt-4">
          <AnalystChat currentDayData={currentDayData} selectedDate={selectedDate} />
        </div>
      </main>

      <footer className="border-t border-slate-900 bg-[#0d0d0d] py-6 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span>AI Macro-Quant Terminal · 自动归档系统</span>
          </div>
          <p>声明：所有研报与传导链仅供参考，不构成任何投资建议。</p>
        </div>
      </footer>

      <StockDetailModal
        stock={selectedStockData}
        isOpen={isStockModalOpen}
        onClose={() => setIsStockModalOpen(false)}
        selectedDate={selectedDate}
      />

      <PromptPayloadModal
        isOpen={isPayloadModalOpen}
        onClose={() => setIsPayloadModalOpen(false)}
        currentDayData={currentDayData}
      />
    </div>
  );
}

export default App;
