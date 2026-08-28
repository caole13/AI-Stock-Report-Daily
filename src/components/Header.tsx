import React, { useMemo } from "react";
import latestReport from "../data/latestReport.json";
import { AVAILABLE_DATES } from "../data/historicalData";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Code2,
  Terminal,
} from "lucide-react";

interface HeaderProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  activeTab: string;
  setActiveTab: (tab: any) => void;
  onOpenPayloadModal: () => void;
}

export function Header({
  selectedDate,
  onSelectDate,
  activeTab,
  setActiveTab,
  onOpenPayloadModal,
}: HeaderProps) {
  // 1. 动态合并最新生成的 latestReport.json 日期，确保 27 号排在最前
  const allAvailableDates = useMemo(() => {
    const list = [...AVAILABLE_DATES];
    if (latestReport?.date) {
      const exists = list.some((item) => item.date === latestReport.date);
      if (!exists) {
        list.unshift({
          date: latestReport.date,
          status: latestReport.marketStatus || "Closed",
          label: `${latestReport.date} · 盘后`,
        });
      }
    }
    return list;
  }, []);

  const currentIndex = allAvailableDates.findIndex(
    (item) => item.date === selectedDate
  );

  const handlePrevDate = () => {
    if (currentIndex < allAvailableDates.length - 1) {
      onSelectDate(allAvailableDates[currentIndex + 1].date);
    }
  };

  const handleNextDate = () => {
    if (currentIndex > 0) {
      onSelectDate(allAvailableDates[currentIndex - 1].date);
    }
  };

  const currentItem = allAvailableDates[currentIndex] || allAvailableDates[0];

  return (
    <header className="sticky top-0 z-40 bg-[#0c0c0c]/90 backdrop-blur-md border-b border-slate-800 px-4 sm:px-6 py-3">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand & Subtitle */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-[#d4af37]/10 border border-[#d4af37]/30 flex items-center justify-center text-[#d4af37]">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif font-bold text-lg text-white tracking-wide">
                  MarketPulse
                </span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-[#d4af37]/15 text-[#d4af37] border border-[#d4af37]/30">
                  AI 策略智库 & 历史复盘
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono hidden sm:block">
                大盘缩量窄幅整固，核心个股与宏观资产按真实检索呈现，NVDA、CRM、CRWD...
              </p>
            </div>
          </div>
        </div>

        {/* Date Selector & Action Tools */}
        <div className="flex items-center gap-2 sm:gap-3 w-full md:w-auto justify-between md:justify-end">
          {/* Dynamic Date Switcher */}
          <div className="flex items-center bg-[#151515] border border-slate-800 rounded px-1.5 py-1 text-xs font-mono text-slate-300">
            <button
              onClick={handlePrevDate}
              disabled={currentIndex >= allAvailableDates.length - 1}
              className="p-1 hover:text-white disabled:opacity-30 disabled:hover:text-slate-300 transition-colors"
              title="查看前一日"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1.5 px-2 text-[#d4af37]">
              <Calendar className="w-3.5 h-3.5" />
              <span className="font-semibold">{currentItem?.date || selectedDate}</span>
              <span className="text-slate-500">·</span>
              <span className="text-slate-400">{currentItem?.status || "已收盘"}</span>
            </div>

            <button
              onClick={handleNextDate}
              disabled={currentIndex <= 0}
              className="p-1 hover:text-white disabled:opacity-30 disabled:hover:text-slate-300 transition-colors"
              title="查看后一日"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Prompt Payload Trigger */}
          <button
            onClick={onOpenPayloadModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#151515] hover:bg-[#1f1f1f] text-[#d4af37] border border-slate-800 text-xs font-mono transition-colors"
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Prompt 载荷</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto mt-3 flex items-center gap-2 border-t border-slate-850 pt-2.5 overflow-x-auto no-scrollbar text-xs font-mono">
        {[
          { id: "dashboard", label: "全景大盘 & 领头羊" },
          { id: "briefing", label: "当日 AI 深度研报" },
          { id: "movers", label: "异动股与关键位" },
          { id: "transmissions", label: "跨资产因果传导" },
          { id: "chat", label: "AI 策略师对话推演" },
          { id: "raw", label: ">_ Raw Payload" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1.5 rounded whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? "bg-[#d4af37]/15 text-[#d4af37] border border-[#d4af37]/40 font-semibold"
                : "text-slate-400 hover:text-slate-200 hover:bg-[#141414]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </header>
  );
}

export default Header;
