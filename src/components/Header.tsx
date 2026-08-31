import React, { useMemo } from "react";
import {
  Layers,
  Sparkles,
  Flame,
  GitCommit,
  Calendar,
  Code2,
} from "lucide-react";
import { AVAILABLE_DATES } from "../data/historicalData";
import latestReport from "../data/latestReport.json";
import { TabType } from "../types";

interface HeaderProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  onOpenPayloadModal: () => void;
}

export function Header({
  selectedDate,
  onSelectDate,
  activeTab,
  setActiveTab,
  onOpenPayloadModal,
}: HeaderProps) {
  // 1. 动态合并最新生成的 latestReport.json 日期，确保最新日期排在最前
  const allAvailableDates = useMemo(() => {
    const list = [...AVAILABLE_DATES];
    if (latestReport?.date) {
      const exists = list.some((item) => item.date === latestReport.date);
      if (!exists) {
        list.unshift({
          date: latestReport.date,
          displayDate: `${latestReport.date} (最新研报)`,
          weekday: "今日盘后",
          tagline: (latestReport as any).tagline || (latestReport as any).marketStatus || "AI 策略师每日复盘",
          marketTone: ((latestReport as any).marketTone || "震荡") as any,
        });
      }
    }
    return list;
  }, []);

  const navItems = [
    { id: "macro", label: "AI 研报主线", icon: Sparkles },
    { id: "sectors", label: "行业热力图", icon: Layers },
    { id: "movers", label: "异动个股掘金", icon: Flame },
    { id: "transmissions", label: "因果传导链", icon: GitCommit },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#0d0d0d]/95 backdrop-blur border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Terminal Title */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded bg-gradient-to-br from-amber-400 to-[#d4af37] p-0.5 flex items-center justify-center shadow-lg shadow-amber-500/10">
              <div className="w-full h-full bg-[#0a0a0a] rounded flex items-center justify-center">
                <span className="font-mono font-black text-[#d4af37] text-base">α</span>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-white tracking-tight flex items-center gap-1.5">
                  <span>美股每日量化研报</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 bg-[#d4af37]/20 text-[#d4af37] border border-[#d4af37]/30 rounded">
                    GEMINI PRO
                  </span>
                </h1>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                宏观流动性 · 行业轮动 · 个股催化 · 因果归因
              </p>
            </div>
          </div>

          {/* Center: Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-[#141414] p-1 border border-slate-800 rounded-sm">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as TabType)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-sm transition-all ${
                    isActive
                      ? "bg-[#d4af37] text-black font-semibold shadow-sm"
                      : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right: Date Picker & Payload Prompt Inspect */}
          <div className="flex items-center gap-2.5">
            {/* Date Selector */}
            <div className="relative flex items-center">
              <div className="absolute left-2.5 pointer-events-none text-slate-400">
                <Calendar className="w-3.5 h-3.5 text-[#d4af37]" />
              </div>
              <select
                value={selectedDate}
                onChange={(e) => onSelectDate(e.target.value)}
                className="bg-[#141414] hover:bg-[#1a1a1a] text-slate-200 text-xs font-mono font-medium pl-8 pr-7 py-1.5 border border-slate-700 hover:border-[#d4af37]/60 rounded-sm appearance-none cursor-pointer focus:outline-none focus:border-[#d4af37] transition-all"
              >
                {allAvailableDates.map((item) => (
                  <option key={item.date} value={item.date} className="bg-[#141414] text-slate-200">
                    {item.displayDate} ({item.weekday})
                  </option>
                ))}
              </select>
            </div>

            {/* Prompt Payload Modal Button */}
            <button
              onClick={onOpenPayloadModal}
              title="查看后端 Gemini Prompt 架构与透明 Payload"
              className="p-1.5 bg-[#141414] hover:bg-[#1f1f1f] text-slate-300 hover:text-[#d4af37] border border-slate-800 hover:border-slate-700 rounded-sm transition-colors flex items-center gap-1 text-xs"
            >
              <Code2 className="w-4 h-4" />
              <span className="hidden lg:inline text-[11px] font-mono">Payload</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Tabs */}
        <div className="flex md:hidden items-center justify-around border-t border-slate-850 py-2 gap-1 overflow-x-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as TabType)}
                className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded transition-all whitespace-nowrap ${
                  isActive
                    ? "bg-[#d4af37] text-black font-semibold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Icon className="w-3 h-3" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
