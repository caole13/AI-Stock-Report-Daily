import React from "react";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Terminal,
  Activity,
  RotateCcw,
  BarChart3,
  Flame,
  GitFork,
  MessageSquareText,
  FileText,
} from "lucide-react";
import { AVAILABLE_DATES } from "../data/historicalData";

interface HeaderProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  activeTab: "dashboard" | "briefing" | "transmissions" | "movers" | "chat" | "raw";
  setActiveTab: (tab: "dashboard" | "briefing" | "transmissions" | "movers" | "chat" | "raw") => void;
  onOpenPayloadModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  selectedDate,
  onSelectDate,
  activeTab,
  setActiveTab,
  onOpenPayloadModal,
}) => {
  const currentIndex = AVAILABLE_DATES.findIndex((d) => d.date === selectedDate);
  const currentItem = AVAILABLE_DATES[currentIndex] || AVAILABLE_DATES[0];

  const hasPrev = currentIndex < AVAILABLE_DATES.length - 1;
  const hasNext = currentIndex > 0;

  const handlePrevDay = () => {
    if (hasPrev) {
      onSelectDate(AVAILABLE_DATES[currentIndex + 1].date);
    }
  };

  const handleNextDay = () => {
    if (hasNext) {
      onSelectDate(AVAILABLE_DATES[currentIndex - 1].date);
    }
  };

  const handleLatestDay = () => {
    onSelectDate(AVAILABLE_DATES[0].date);
  };

  return (
    <header className="border-b border-slate-800 bg-[#0c0c0c]/95 backdrop-blur-md sticky top-0 z-40">
      {/* Top Banner & Date Switcher */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Brand & Tagline */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-sm bg-[#181818] border border-[#d4af37]/40 flex items-center justify-center text-[#d4af37] shadow-sm">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-serif font-bold text-white tracking-wide">
                MarketPulse
              </h1>
              <span className="text-[10px] uppercase font-mono tracking-widest px-2 py-0.5 rounded-sm bg-[#181818] text-[#d4af37] border border-slate-800">
                AI 策略智库 & 历史复盘
              </span>
            </div>
            <p className="text-xs text-slate-500 font-sans truncate max-w-md hidden sm:block">
              {currentItem.tagline}
            </p>
          </div>
        </div>

        {/* Center: Interactive Date Switcher & Fast Jumper */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Quick Prev / Next Buttons */}
          <div className="flex items-center bg-[#141414] border border-slate-800 rounded-sm p-0.5">
            <button
              onClick={handlePrevDay}
              disabled={!hasPrev}
              title="切换至上一历史交易日"
              className="p-1.5 rounded-sm text-slate-400 hover:text-white hover:bg-[#202020] disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Date Select Dropdown */}
            <div className="relative flex items-center px-2">
              <Calendar className="w-3.5 h-3.5 text-[#d4af37] mr-1.5 pointer-events-none" />
              <select
                value={selectedDate}
                onChange={(e) => onSelectDate(e.target.value)}
                className="bg-transparent text-xs font-mono font-medium text-white appearance-none cursor-pointer focus:outline-none pr-4"
              >
                {AVAILABLE_DATES.map((item) => (
                  <option
                    key={item.date}
                    value={item.date}
                    className="bg-[#121212] text-slate-200 py-1"
                  >
                    {item.displayDate} ({item.weekday}) • {item.marketTone}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleNextDay}
              disabled={!hasNext}
              title="切换至下一历史交易日"
              className="p-1.5 rounded-sm text-slate-400 hover:text-white hover:bg-[#202020] disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Quick "Latest" Button if not on latest */}
          {currentIndex > 0 && (
            <button
              onClick={handleLatestDay}
              className="px-2.5 py-1.5 rounded-sm bg-[#181818] hover:bg-[#222222] text-[#d4af37] border border-slate-800 text-xs font-mono flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>最新日</span>
            </button>
          )}

          {/* Prompt Payload Modal Opener */}
          <button
            onClick={onOpenPayloadModal}
            className="px-3 py-1.5 rounded-sm bg-[#181818] hover:bg-[#222222] text-slate-300 border border-slate-800 text-xs font-mono flex items-center gap-1.5 transition-colors"
            title="查看当前日期的 Prompt Payload 原始提示词"
          >
            <Terminal className="w-3.5 h-3.5 text-[#d4af37]" />
            <span className="hidden sm:inline">Prompt 载荷</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar border-t border-slate-850/60 pt-1 pb-1">
        <button
          onClick={() => setActiveTab("dashboard")}
          className={`px-3 py-1.5 rounded-sm text-xs font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap ${
            activeTab === "dashboard"
              ? "bg-[#181818] text-[#d4af37] border border-[#d4af37]/30"
              : "text-slate-400 hover:text-slate-200 hover:bg-[#141414]"
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>全景大盘 & 领头羊</span>
        </button>

        <button
          onClick={() => setActiveTab("briefing")}
          className={`px-3 py-1.5 rounded-sm text-xs font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap ${
            activeTab === "briefing"
              ? "bg-[#181818] text-[#d4af37] border border-[#d4af37]/30"
              : "text-slate-400 hover:text-slate-200 hover:bg-[#141414]"
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>当日 AI 深度研报</span>
        </button>

        <button
          onClick={() => setActiveTab("movers")}
          className={`px-3 py-1.5 rounded-sm text-xs font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap ${
            activeTab === "movers"
              ? "bg-[#181818] text-[#d4af37] border border-[#d4af37]/30"
              : "text-slate-400 hover:text-slate-200 hover:bg-[#141414]"
          }`}
        >
          <Flame className="w-3.5 h-3.5" />
          <span>异动股与关键位</span>
        </button>

        <button
          onClick={() => setActiveTab("transmissions")}
          className={`px-3 py-1.5 rounded-sm text-xs font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap ${
            activeTab === "transmissions"
              ? "bg-[#181818] text-[#d4af37] border border-[#d4af37]/30"
              : "text-slate-400 hover:text-slate-200 hover:bg-[#141414]"
          }`}
        >
          <GitFork className="w-3.5 h-3.5" />
          <span>跨资产因果传导</span>
        </button>

        <button
          onClick={() => setActiveTab("chat")}
          className={`px-3 py-1.5 rounded-sm text-xs font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap ${
            activeTab === "chat"
              ? "bg-[#181818] text-[#d4af37] border border-[#d4af37]/30"
              : "text-slate-400 hover:text-slate-200 hover:bg-[#141414]"
          }`}
        >
          <MessageSquareText className="w-3.5 h-3.5" />
          <span>AI 策略师对话推演</span>
        </button>

        <button
          onClick={() => setActiveTab("raw")}
          className={`px-3 py-1.5 rounded-sm text-xs font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap ml-auto ${
            activeTab === "raw"
              ? "bg-[#181818] text-[#d4af37] border border-[#d4af37]/30"
              : "text-slate-500 hover:text-slate-300"
          }`}
        >
          <Terminal className="w-3 h-3" />
          <span className="font-mono text-[11px]">Raw Payload</span>
        </button>
      </div>
    </header>
  );
};
