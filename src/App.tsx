import { useState, useMemo, useEffect } from "react";
import { Header } from "./components/Header";
import { TickerBar } from "./components/TickerBar";
import { MacroOverview } from "./components/MacroOverview";
import { AiBriefingView } from "./components/AiBriefingView";
import { SectorHeatmap } from "./components/SectorHeatmap";
import { MoversScanner } from "./components/MoversScanner";
import { CausalTransmissionView } from "./components/CausalTransmissionView";
import { PriceActionScanner } from "./components/PriceActionScanner";
import { BottomHuntingRadar } from "./components/BottomHuntingRadar";
import { HistoryCalendarModal } from "./components/HistoryCalendarModal";
import { StockDetailModal } from "./components/StockDetailModal";
import { PromptPayloadModal } from "./components/PromptPayloadModal";
import { StockAnalysisPanel } from "./components/StockAnalysisPanel";
import { TabType, StockDetail, StockAnalysisResult, StockRecommendation } from "./types";
import { getStockBenchmark, resolveStockVolumeData, parseChangePct } from "./utils/volumeHelper";
import { resolveUnifiedStockData } from "./utils/stockDataResolver";
import { getPriceActionSignals, getBottomHuntSignals } from "./data/radarSignals";
import { generateMasterMarkdownReport } from "./utils/markdownExporter";

// 1. 加载 reports 目录下所有 json 文件
const reportsModules = import.meta.glob("./data/reports/*.json", { eager: true }) as Record<string, any>;

// 2. 提取并按日期排序
const allReportDates = Object.keys(reportsModules)
  .map((p) => p.match(/\/([^/]+)\.json$/)?.[1] || "")
  .filter(Boolean)
  .sort((a, b) => b.localeCompare(a));

// 构建快速日期报告映射
const allReportsMap: Record<string, any> = {};
Object.entries(reportsModules).forEach(([path, module]) => {
  const match = path.match(/\/([^/]+)\.json$/);
  if (match && match[1]) {
    allReportsMap[match[1]] = module.default || module;
  }
});

export function App() {
  // 默认日期为最新的一期有效交易日 (Single Source of Truth)
  const defaultDate = allReportDates[0] || "2026-09-16";
  const [selectedDate, setSelectedDate] = useState<string>(defaultDate);
  const [activeTab, setActiveTab] = useState<TabType>("macro");
  const [selectedStockTicker, setSelectedStockTicker] = useState<string | null>(null);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [isPayloadModalOpen, setIsPayloadModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // 个股实时搜索与深度分析模块状态
  const [searchTickerInput, setSearchTickerInput] = useState<string>("");
  const [searchedTicker, setSearchedTicker] = useState<string | null>(null);
  const [stockAnalysisResult, setStockAnalysisResult] = useState<StockAnalysisResult | null>(null);
  const [isAnalysisLoading, setIsAnalysisLoading] = useState<boolean>(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // 最近搜索历史 (存储在 localStorage，保存最多 5 个成功的 Ticker)
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("marketpulse_recent_searches");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed.slice(0, 5);
      }
    } catch (e) {
      console.warn("Failed to load recent searches from localStorage:", e);
    }
    return ["NVDA", "AAPL", "TSLA"];
  });

  const handleClearRecentSearches = () => {
    setRecentSearches([]);
    try {
      localStorage.removeItem("marketpulse_recent_searches");
    } catch {}
  };

  // 实时 Yahoo Finance 行情池（直接挂载并优先应用）
  const [yahooQuotes, setYahooQuotes] = useState<Record<string, any>>({});

  useEffect(() => {
    let isMounted = true;
    const trackedSymbols = [
      "NVDA", "MSFT", "AAPL", "TSLA", "AMZN", "GOOGL", "META", "LLY", "UNH", "JPM",
      "XOM", "COST", "CAT", "DELL", "PANW", "NIO", "GTLB", "AMD", "AVGO", "PLTR",
      "CRM", "CRWD", "SMCI", "^GSPC", "^IXIC", "USO", "CL=F", "GC=F", "^TNX", "DX-Y.NYB"
    ].join(",");

    fetch(`/api/market-quotes?symbols=${encodeURIComponent(trackedSymbols)}`)
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (data?.quotes) {
          const map: Record<string, any> = {};
          const quoteList: any[] = Array.isArray(data.quotes)
            ? data.quotes
            : Object.values(data.quotes);

          quoteList.forEach((q: any) => {
            if (q && q.symbol) {
              const sym = q.symbol.toUpperCase();
              map[sym] = q;
              if (sym === "^GSPC") map["SPX"] = q;
              if (sym === "^IXIC") map["IXIC"] = q;
              if (sym === "^TNX") map["TNX"] = q;
              if (sym === "DX-Y.NYB" || sym === "DX-Y") map["DXY"] = q;
            }
          });
          setYahooQuotes(map);
        }
      })
      .catch(() => {
        // 静默兜底，不阻断渲染
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    setActiveTab("macro");
  };

  // 根据选中的日期加载对应的研报，并与 Yahoo Finance 官方价格直接融合
  const currentDayData = useMemo(() => {
    // 优先从 reports/*.json 中查找对应日期
    const targetModule = reportsModules[`./data/reports/${selectedDate}.json`];
    const report = targetModule?.default || targetModule;

    if (report) {
      const macroData = report.macroSummary || report.macro || {};
      const rawAssets = macroData.assets || report.assets || macroData.items || [];
      const formattedItems = rawAssets.map((a: any) => {
        // 严格以该日期研报中的权威收盘点位为准，确保大盘卡片、所选日期与研报分析三者时刻完全对齐
        const val = a.price ?? a.currentValue ?? (a.prevValue ? a.prevValue * (1 + (a.changePercent || 0) / 100) : 100);
        const changeStr =
          a.changePct ||
          (a.changePercent !== undefined && a.changePercent !== null
            ? `${a.changePercent >= 0 ? "+" : ""}${Number(a.changePercent).toFixed(2)}%`
            : "0.00%");
        const numChange =
          a.changePercent !== undefined && a.changePercent !== null
            ? a.changePercent
            : (a.changePct ? parseFloat(String(a.changePct).replace("%", "").replace("+", "")) : 0);

        return {
          name: a.name || a.ticker,
          ticker: a.ticker || "",
          currentValue: val,
          price: val,
          changePercent: numChange,
          changePct: changeStr,
          trend: a.trend || (numChange > 0 ? "up" : numChange < 0 ? "down" : "neutral"),
          unit: a.unit || (a.ticker?.includes("TNX") ? "%" : a.ticker?.includes("DXY") || a.ticker?.includes("GSPC") || a.ticker?.includes("SPX") || a.ticker?.includes("IXIC") ? "点" : "USD"),
          description: a.description || "",
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
          leaders: (s.leaders || []).map((l: any) => {
            const unified = resolveUnifiedStockData(l.ticker, l, report, yahooQuotes);
            return {
              ...l,
              ...unified,
            };
          }),
        })),
        movers: (report.movers || []).map((m: any, idx: number) => {
          const unified = resolveUnifiedStockData(m.ticker, m, report, yahooQuotes);
          return {
            ...m,
            ...unified,
            id: m.id || m.ticker || `mover-${idx}`,
          };
        }),
        transmissions: ((report.causalChains || report.transmissions || [])).map((t: any, idx: number) => ({
          ...t,
          id: t.id || `trans-${idx}`,
        })),
        aiReport: report.aiReport || {}
      };
    }

    return null;
  }, [selectedDate, yahooQuotes]);

  // 个股及大盘详情弹窗数据抽取 (与外层卡片100%同源)
  const selectedStockData = useMemo<StockDetail | null>(() => {
    if (!selectedStockTicker || !currentDayData) return null;
    const unified = resolveUnifiedStockData(selectedStockTicker, null, currentDayData, yahooQuotes);
    return {
      ticker: unified.ticker,
      name: unified.name,
      sector: unified.sector,
      price: unified.price || 0,
      open: unified.open,
      high: unified.high,
      low: unified.low,
      changePercent: unified.changePercent,
      catalyst: unified.catalyst,
      newsAttribution: unified.newsAttribution,
      shortTermOutlook: unified.shortTermOutlook,
      midTermLogic: unified.midTermLogic,
      invalidationLevel: unified.invalidationLevel,
      rvol: unified.rvol,
      volume: unified.volume,
      avgVolume: unified.avgVolume,
      sparkline: unified.sparkline,
      historicalCatalysts: [],
    };
  }, [selectedStockTicker, currentDayData, yahooQuotes]);

  // 提取当日研报中的龙头股、异动个股及主流标的，用于搜索框动态自动补全推荐
  const reportStockPool = useMemo<StockRecommendation[]>(() => {
    const map = new Map<string, StockRecommendation>();

    if (currentDayData) {
      // 1. 行业板块领头羊
      (currentDayData.sectors || []).forEach((sec: any) => {
        (sec.leaders || []).forEach((l: any) => {
          if (l.ticker) {
            const sym = l.ticker.toUpperCase();
            if (!map.has(sym)) {
              map.set(sym, {
                ticker: sym,
                name: l.name || sym,
                category: sec.name || sec.sectorName || "行业龙头",
                changePct: l.changePct || (l.changePercent ? `${l.changePercent >= 0 ? "+" : ""}${Number(l.changePercent).toFixed(2)}%` : undefined),
              });
            }
          }
        });
      });

      // 2. 核心异动个股
      (currentDayData.movers || []).forEach((m: any) => {
        if (m.ticker) {
          const sym = m.ticker.toUpperCase();
          if (!map.has(sym)) {
            map.set(sym, {
              ticker: sym,
              name: m.name || sym,
              category: m.sector || "异动焦点",
              changePct: m.changePct || (m.changePercent ? `${m.changePercent >= 0 ? "+" : ""}${Number(m.changePercent).toFixed(2)}%` : undefined),
            });
          }
        }
      });
    }

    // 3. 常备高关注度美股标的备选池
    const popularBenchmarks: Array<{ ticker: string; name: string; category: string }> = [
      { ticker: "NVDA", name: "NVIDIA Corporation", category: "AI算力芯片" },
      { ticker: "AAPL", name: "Apple Inc.", category: "消费电子与AI" },
      { ticker: "TSLA", name: "Tesla, Inc.", category: "电动汽车与能源" },
      { ticker: "MSFT", name: "Microsoft Corporation", category: "云计算与软件" },
      { ticker: "GOOGL", name: "Alphabet Inc.", category: "谷歌AI生态" },
      { ticker: "AMZN", name: "Amazon.com, Inc.", category: "电商与AWS云" },
      { ticker: "META", name: "Meta Platforms", category: "开源AI与社交" },
      { ticker: "PLTR", name: "Palantir Technologies", category: "企业AI平台" },
      { ticker: "AMD", name: "Advanced Micro Devices", category: "数据中心算力" },
      { ticker: "AVGO", name: "Broadcom Inc.", category: "网络半导体" },
      { ticker: "LLY", name: "Eli Lilly and Company", category: "创新药GLP-1" },
      { ticker: "UNH", name: "UnitedHealth Group", category: "商业医保龙头" },
      { ticker: "XOM", name: "Exxon Mobil Corp", category: "能源与石油" },
      { ticker: "JPM", name: "JPMorgan Chase & Co.", category: "华尔街综合投行" },
      { ticker: "COST", name: "Costco Wholesale", category: "会员制新零售" },
      { ticker: "DELL", name: "Dell Technologies", category: "AI服务器硬件" },
      { ticker: "GTLB", name: "GitLab Inc.", category: "AI代码开发平台" },
      { ticker: "SMCI", name: "Super Micro Computer", category: "高密液冷服务器" },
    ];

    popularBenchmarks.forEach((item) => {
      const liveQ = yahooQuotes[item.ticker];
      if (!map.has(item.ticker)) {
        map.set(item.ticker, {
          ticker: item.ticker,
          name: liveQ?.name || item.name,
          category: item.category,
          changePct: liveQ?.changePctFormatted || undefined,
        });
      } else if (liveQ) {
        const existing = map.get(item.ticker)!;
        if (!existing.changePct && liveQ.changePctFormatted) {
          existing.changePct = liveQ.changePctFormatted;
        }
      }
    });

    return Array.from(map.values());
  }, [currentDayData, yahooQuotes]);

  const priceActionSignals = useMemo(
    () => getPriceActionSignals(yahooQuotes, currentDayData),
    [yahooQuotes, currentDayData]
  );

  const bottomSignals = useMemo(
    () => getBottomHuntSignals(yahooQuotes, currentDayData),
    [yahooQuotes, currentDayData]
  );

  const handleCopyMasterReport = () => {
    if (!currentDayData) return;
    const text = generateMasterMarkdownReport(
      currentDayData,
      selectedDate,
      yahooQuotes
    );
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  const handleSelectStock = (ticker: string) => {
    setSelectedStockTicker(ticker);
    setIsStockModalOpen(true);
  };

  // 个股深度分析触发处理函数
  const handleTriggerStockAnalysis = async (targetTicker?: string) => {
    const raw = targetTicker !== undefined ? targetTicker : searchTickerInput;
    const clean = raw.trim().toUpperCase();
    if (!clean) return;

    setSearchedTicker(clean);
    setIsAnalysisLoading(true);
    setAnalysisError(null);

    try {
      const res = await fetch("/api/stock-analysis", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ticker: clean }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || `获取个股分析失败 (HTTP ${res.status})`);
      }

      setStockAnalysisResult(data);

      // 成功获取结果后，将该 ticker 加入最近搜索历史 (最多 5 个) 并同步至 localStorage
      if (data?.ticker) {
        const validTicker = data.ticker.toUpperCase();
        setRecentSearches((prev) => {
          const updated = [validTicker, ...prev.filter((t) => t !== validTicker)].slice(0, 5);
          try {
            localStorage.setItem("marketpulse_recent_searches", JSON.stringify(updated));
          } catch (e) {
            console.warn("Failed to save recent searches:", e);
          }
          return updated;
        });
      }
    } catch (err: any) {
      console.error("Failed to fetch stock analysis:", err);
      setAnalysisError(err?.message || "网络请求超时或服务异常，请稍后重试。");
    } finally {
      setIsAnalysisLoading(false);
    }
  };

  const handleRetryStockAnalysis = () => {
    handleTriggerStockAnalysis(searchedTicker || searchTickerInput);
  };

  const handleClearSearch = () => {
    setSearchTickerInput("");
  };

  const handleCloseStockAnalysis = () => {
    setStockAnalysisResult(null);
    setAnalysisError(null);
    setSearchedTicker(null);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-slate-100 flex flex-col selection:bg-[#d4af37] selection:text-black w-full max-w-full overflow-x-hidden">
      <Header
        selectedDate={selectedDate}
        onSelectDate={handleDateChange}
        availableDates={allReportDates}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenPayloadModal={() => setIsPayloadModalOpen(true)}
        onOpenHistoryCalendar={() => setIsHistoryModalOpen(true)}
        onCopyMarkdownReport={handleCopyMasterReport}
        isCopied={isCopied}
        searchQuery={searchTickerInput}
        onSearchQueryChange={setSearchTickerInput}
        onSearch={handleTriggerStockAnalysis}
        isSearchLoading={isAnalysisLoading}
        onClearSearch={handleClearSearch}
        recentSearches={recentSearches}
        onClearRecentSearches={handleClearRecentSearches}
        stockPool={reportStockPool}
      />

      {currentDayData && (
        <TickerBar currentDayData={currentDayData} yahooQuotes={yahooQuotes} onSelectStock={handleSelectStock} />
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* 个股实时搜索与深度分析面板 (支持加载骨架屏、Inline 错误卡片重试与折叠/大盘切换) */}
        <StockAnalysisPanel
          result={stockAnalysisResult}
          isLoading={isAnalysisLoading}
          error={analysisError}
          searchedTicker={searchedTicker}
          onRetry={handleRetryStockAnalysis}
          onClose={handleCloseStockAnalysis}
          onOpenDetailModal={handleSelectStock}
        />

        {!currentDayData ? (
          /* 该交易日暂无数据/休市 优雅占位卡片 (禁止回退串联到最新日) */
          <div className="bg-[#141414] border border-neutral-800 rounded-sm p-8 text-center max-w-xl mx-auto my-12 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 text-[#d4af37] flex items-center justify-center mx-auto mb-4">
              <span className="font-mono text-xl font-bold">📅</span>
            </div>
            <h3 className="text-base font-bold text-white mb-2">
              交易日【{selectedDate}】暂无归档研报 / 美股休市
            </h3>
            <p className="text-xs text-neutral-400 leading-relaxed mb-6">
              所选日期为周末休市、美股法定节假日或尚未生成归档数据。系统已开启严格隔离模式，绝不串联其他日期数据。
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => handleDateChange(allReportDates[0])}
                className="px-4 py-2 bg-[#d4af37] hover:bg-amber-400 text-black text-xs font-semibold rounded-sm transition-colors cursor-pointer shadow"
              >
                返回最新研报 ({allReportDates[0]})
              </button>
              <button
                onClick={() => setIsHistoryModalOpen(true)}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium rounded-sm border border-neutral-700 transition-colors cursor-pointer"
              >
                打开历史归档日历
              </button>
            </div>
            {allReportDates.length > 0 && (
              <div className="mt-6 pt-4 border-t border-neutral-800/80">
                <span className="text-[11px] text-neutral-500 block mb-2 font-mono">快速切换已归档交易日:</span>
                <div className="flex flex-wrap justify-center gap-1.5">
                  {allReportDates.slice(0, 5).map((d) => (
                    <button
                      key={d}
                      onClick={() => handleDateChange(d)}
                      className="px-2 py-1 text-xs font-mono bg-neutral-850 hover:bg-neutral-750 text-neutral-300 hover:text-white rounded border border-neutral-750 transition-colors cursor-pointer"
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            <MacroOverview
              macroData={currentDayData.macro}
              selectedDate={selectedDate}
              onSelectStock={handleSelectStock}
            />

        {activeTab === "macro" && (
          <AiBriefingView
            data={currentDayData}
            selectedDate={selectedDate}
            onSelectStock={handleSelectStock}
            onSwitchTab={setActiveTab}
          />
        )}
        {activeTab === "price-action" && (
          <PriceActionScanner
            signals={priceActionSignals}
            onSelectStock={handleSelectStock}
          />
        )}
        {activeTab === "bottom-hunter" && (
          <BottomHuntingRadar
            signals={bottomSignals}
            onSelectStock={handleSelectStock}
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
            selectedDate={selectedDate}
            onSelectStock={handleSelectStock}
          />
        )}
          </>
        )}
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
        ticker={selectedStockTicker}
        stock={selectedStockData}
        currentDayData={currentDayData}
        isOpen={isStockModalOpen}
        onClose={() => setIsStockModalOpen(false)}
        selectedDate={selectedDate}
        liveQuotes={yahooQuotes}
      />

      <PromptPayloadModal
        isOpen={isPayloadModalOpen}
        onClose={() => setIsPayloadModalOpen(false)}
        currentDayData={currentDayData}
      />

      <HistoryCalendarModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        availableDates={allReportDates}
        selectedDate={selectedDate}
        onSelectDate={handleDateChange}
        allReportsMap={allReportsMap}
      />
    </div>
  );
}

export default App;
