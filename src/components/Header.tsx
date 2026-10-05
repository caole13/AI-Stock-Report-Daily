import React from "react";
import {
  Sparkles,
  Compass,
  Code2,
  Calendar,
  BookOpen,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { TabType, StockRecommendation } from "../types";
import { StockSearchBar } from "./StockSearchBar";

interface HeaderProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  availableDates: string[];
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  onOpenPayloadModal: () => void;
  onOpenHistoryCalendar?: () => void;
  onCopyMarkdownReport?: () => void;
  isCopied?: boolean;
  searchQuery: string;
  onSearchQueryChange: (val: string) => void;
  onSearch: (ticker: string) => void;
  isSearchLoading: boolean;
  onClearSearch: () => void;
  recentSearches?: string[];
  onClearRecentSearches?: () => void;
  stockPool?: StockRecommendation[];
}

export const Header: React.FC<HeaderProps> = ({
  selectedDate,
  onSelectDate,
  availableDates = [],
  activeTab,
  setActiveTab,
  onOpenPayloadModal,
  onOpenHistoryCalendar,
  onCopyMarkdownReport,
  isCopied,
  searchQuery,
  onSearchQueryChange,
  onSearch,
  isSearchLoading,
  onClearSearch,
  recentSearches = [],
  onClearRecentSearches,
  stockPool = [],
}) => {
  const currentIndex = availableDates.indexOf(selectedDate);
  const hasOlder = currentIndex < availableDates.length - 1 && currentIndex !== -1;
  const hasNewer = currentIndex > 0;

  const handlePrevDay = () => {
    if (hasOlder) {
      onSelectDate(availableDates[currentIndex + 1]);
    }
  };

  const handleNextDay = () => {
    if (hasNewer) {
      onSelectDate(availableDates[currentIndex - 1]);
    }
  };

  const isSpecializedRadarActive = [
    "bottom-hunter",
    "sectors",
    "movers",
    "transmissions",
  ].includes(activeTab);

  return (
    <header className="w-full max-w-full overflow-hidden bg-[#0a0a0a]/95 backdrop-blur border-b border-neutral-800 text-white sticky top-0 z-40 shadow-xl">
      {/* 第一行（Top Row）：品牌与全局系统控制 (响应式防横向滚动溢出) */}
      <div className="border-b border-neutral-900 w-full max-w-full overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-3 flex-nowrap w-full">
          {/* 左侧：Logo 图标 + “美股每日量化研报” 主副标题 */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded bg-gradient-to-br from-amber-400 to-[#d4af37] p-0.5 flex items-center justify-center shadow-lg shadow-amber-500/10 shrink-0">
              <div className="w-full h-full bg-[#0a0a0a] rounded flex items-center justify-center">
                <span className="font-mono font-black text-[#d4af37] text-sm sm:text-base">α</span>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm sm:text-base font-bold text-white tracking-tight whitespace-nowrap">
                  美股每日量化研报
                </h1>
              </div>
              <p className="text-[10px] text-neutral-400 hidden xl:block leading-none mt-0.5">
                宏观流动性 · 裸K形态 · 专项雷达
              </p>
            </div>
          </div>

          {/* 中间：精简合并主视图 Tab 切换器（2个核心主Tab + 1个紧凑专项雷达下拉菜单） */}
          <nav className="flex items-center gap-1 bg-[#141414] p-1 border border-neutral-800 rounded-sm shrink-0">
            {/* Tab 1: 宏观量化主线 */}
            <button
              onClick={() => setActiveTab("macro")}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 text-xs font-medium rounded-sm transition-all whitespace-nowrap cursor-pointer ${
                activeTab === "macro"
                  ? "bg-[#d4af37] text-black font-semibold shadow-sm"
                  : "text-neutral-300 hover:text-white hover:bg-neutral-800/80"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>宏观量化主线</span>
            </button>

            {/* Tab 2: 裸K形态雷达 */}
            <button
              onClick={() => setActiveTab("price-action")}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 text-xs font-medium rounded-sm transition-all whitespace-nowrap cursor-pointer ${
                activeTab === "price-action"
                  ? "bg-[#d4af37] text-black font-semibold shadow-sm"
                  : "text-neutral-300 hover:text-white hover:bg-neutral-800/80"
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>裸K形态雷达</span>
            </button>

            {/* 专项雷达整合下拉切换器 */}
            <div className="relative">
              <select
                value={isSpecializedRadarActive ? activeTab : "default_specialized"}
                onChange={(e) => {
                  if (e.target.value !== "default_specialized") {
                    setActiveTab(e.target.value as TabType);
                  }
                }}
                className={`text-xs font-medium rounded-sm py-1 pl-2 pr-6 appearance-none cursor-pointer focus:outline-none transition-all ${
                  isSpecializedRadarActive
                    ? "bg-amber-500/20 text-[#d4af37] border border-amber-500/40 font-semibold"
                    : "bg-transparent text-neutral-400 hover:text-white hover:bg-neutral-800/60"
                }`}
                title="切换专项量化雷达视图"
              >
                <option value="default_specialized" disabled className="bg-[#141414] text-neutral-500">
                  专项雷达工具 ▾
                </option>
                <option value="bottom-hunter" className="bg-[#141414] text-neutral-200">
                  🎯 左侧抄底雷达
                </option>
                <option value="sectors" className="bg-[#141414] text-neutral-200">
                  📊 行业热力图
                </option>
                <option value="movers" className="bg-[#141414] text-neutral-200">
                  🔥 异动个股掘金
                </option>
                <option value="transmissions" className="bg-[#141414] text-neutral-200">
                  🔗 因果传导导图
                </option>
              </select>
              <ChevronDown className="w-3 h-3 text-neutral-400 pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2" />
            </div>
          </nav>

          {/* 右侧：紧凑化工具区（复合日期选择器 + Action Group 图标按钮） */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* 复合日期选择器（整合前/后翻页、日历图标与日期切换） */}
            <div className="flex items-center bg-[#141414] border border-neutral-750 hover:border-[#d4af37]/60 rounded-sm transition-colors text-xs">
              <button
                onClick={handlePrevDay}
                disabled={!hasOlder}
                title="前一交易日"
                className="p-1.5 text-neutral-400 hover:text-white disabled:opacity-25 disabled:hover:text-neutral-400 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              <div className="relative flex items-center px-1">
                <Calendar className="w-3 h-3 text-[#d4af37] mr-1 pointer-events-none shrink-0" />
                <select
                  value={selectedDate}
                  onChange={(e) => onSelectDate(e.target.value)}
                  className="bg-transparent text-neutral-200 text-xs font-mono font-semibold py-1 appearance-none cursor-pointer focus:outline-none pr-4"
                  title="切换研报交易日"
                >
                  {availableDates.map((dateStr) => (
                    <option key={dateStr} value={dateStr} className="bg-[#141414] text-neutral-200">
                      {dateStr}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-2.5 h-2.5 text-neutral-400 pointer-events-none absolute right-0.5 top-1/2 -translate-y-1/2" />
              </div>

              <button
                onClick={handleNextDay}
                disabled={!hasNewer}
                title="后一交易日"
                className="p-1.5 text-neutral-400 hover:text-white disabled:opacity-25 disabled:hover:text-neutral-400 transition-colors cursor-pointer"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* 快捷操作图标组 (Action Group) */}
            <div className="flex items-center gap-1 pl-1 border-l border-neutral-800">
              {/* History Calendar Modal Trigger */}
              {onOpenHistoryCalendar && (
                <button
                  onClick={onOpenHistoryCalendar}
                  title="打开多日历史投研档案库 (日历大盘回溯)"
                  className="p-1.5 bg-[#171717] hover:bg-[#202020] text-neutral-300 hover:text-[#d4af37] border border-neutral-800 hover:border-neutral-700 rounded-sm transition-colors cursor-pointer"
                >
                  <BookOpen className="w-3.5 h-3.5 text-[#d4af37]" />
                </button>
              )}

              {/* Copy Report Icon */}
              {onCopyMarkdownReport && (
                <button
                  onClick={onCopyMarkdownReport}
                  title="一键复制当日纯文本研报"
                  className="p-1.5 bg-[#171717] hover:bg-[#202020] text-[#d4af37] border border-amber-500/40 hover:border-[#d4af37] rounded-sm transition-all shadow-sm cursor-pointer"
                >
                  {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              )}

              {/* Payload Icon */}
              <button
                onClick={onOpenPayloadModal}
                title="查看后端 Gemini Prompt 架构与透明 Payload"
                className="p-1.5 bg-[#141414] hover:bg-[#1f1f1f] text-neutral-400 hover:text-[#d4af37] border border-neutral-800 hover:border-neutral-700 rounded-sm transition-colors cursor-pointer"
              >
                <Code2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 第二行（Sub-bar）：个股搜索与快捷入口 */}
      <div className="bg-[#0c0c0c]/95 border-b border-neutral-900 w-full max-w-full overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 w-full">
          <StockSearchBar
            value={searchQuery}
            onChange={onSearchQueryChange}
            onSearch={onSearch}
            isLoading={isSearchLoading}
            onClear={onClearSearch}
            recentSearches={recentSearches}
            onClearRecentSearches={onClearRecentSearches}
            stockPool={stockPool}
          />
        </div>
      </div>
    </header>
  );
};
