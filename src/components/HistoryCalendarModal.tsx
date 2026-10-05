import React from "react";
import {
  Calendar,
  X,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Sparkles,
  BookOpen,
  CheckCircle2,
  Clock,
} from "lucide-react";

interface HistoryCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableDates: string[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
  allReportsMap: Record<string, any>;
}

export const HistoryCalendarModal: React.FC<HistoryCalendarModalProps> = ({
  isOpen,
  onClose,
  availableDates,
  selectedDate,
  onSelectDate,
  allReportsMap,
}) => {
  if (!isOpen) return null;

  const currentIndex = availableDates.indexOf(selectedDate);
  const hasPrev = currentIndex < availableDates.length - 1; // older date
  const hasNext = currentIndex > 0; // newer date

  const handlePrevDay = () => {
    if (hasPrev) {
      onSelectDate(availableDates[currentIndex + 1]);
    }
  };

  const handleNextDay = () => {
    if (hasNext) {
      onSelectDate(availableDates[currentIndex - 1]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-[#121212] border border-slate-800 rounded-md w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-[#161616]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-sm bg-[#1e1e1e] border border-[#d4af37]/50 flex items-center justify-center text-[#d4af37]">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-serif font-bold text-white tracking-wide flex items-center gap-2">
                <span>历史投研档案库 (Historical Research Archive)</span>
                <span className="text-xs font-mono font-normal text-slate-400">
                  共已归档 {availableDates.length} 个交易日
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-sans mt-0.5">
                支持多日历史自由回溯 · 电子杂志式复盘翻阅 · 完整保留宏观水温与异动归因
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Prev / Next Arrows */}
            <div className="flex items-center gap-1 bg-[#101010] p-1 border border-slate-800 rounded-sm">
              <button
                onClick={handlePrevDay}
                disabled={!hasPrev}
                title="前一交易日"
                className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 hover:bg-slate-800 rounded-sm transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono px-2 text-slate-300">
                {selectedDate}
              </span>
              <button
                onClick={handleNextDay}
                disabled={!hasNext}
                title="后一交易日"
                className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 hover:bg-slate-800 rounded-sm transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-sm transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: Archive Cards */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="text-xs font-mono text-slate-400 flex items-center justify-between">
            <span>点击任意日期卡片，即刻全盘载入当日历史投研数据与因果图谱：</span>
            <span className="text-[#d4af37]">当前基准日: {selectedDate}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {availableDates.map((dateStr) => {
              const isSelected = dateStr === selectedDate;
              const rep = allReportsMap[dateStr] || {};
              const tone = rep.marketTone || rep.aiReport?.marketSentiment || "分化";
              const summary =
                rep.tagline ||
                rep.aiReport?.dailyExecutiveSummary ||
                rep.aiReport?.executiveSnapshot ||
                rep.aiReport?.executiveSummary ||
                rep.macro?.coreThesis ||
                rep.macroSummary?.coreThesis ||
                "美股全市场量化复盘与跨资产因果推演";

              const isToneUp = tone.includes("偏多") || tone.includes("多");
              const isToneDown = tone.includes("偏空") || tone.includes("空");

              return (
                <div
                  key={dateStr}
                  onClick={() => {
                    onSelectDate(dateStr);
                    onClose();
                  }}
                  className={`p-4 rounded-sm border transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden group ${
                    isSelected
                      ? "bg-[#1a1708] border-[#d4af37] shadow-lg shadow-amber-950/20"
                      : "bg-[#151515] border-slate-800 hover:border-slate-600 hover:bg-[#191919]"
                  }`}
                >
                  {isSelected && (
                    <div className="absolute top-0 right-0 bg-[#d4af37] text-black text-[10px] font-mono font-bold px-2 py-0.5 rounded-bl-sm flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>正在查看</span>
                    </div>
                  )}

                  <div>
                    {/* Date & Weekday */}
                    <div className="flex items-baseline gap-2">
                      <span className="font-mono font-black text-lg text-white group-hover:text-[#d4af37] transition-colors">
                        {dateStr}
                      </span>
                      <span className="text-xs font-sans text-slate-400">
                        {rep.weekday || "交易日"}
                      </span>
                    </div>

                    {/* Tone Badge */}
                    <div className="mt-2 flex items-center gap-2">
                      <span
                        className={`text-[11px] font-mono px-2 py-0.5 rounded-sm border font-semibold flex items-center gap-1 ${
                          isToneUp
                            ? "bg-emerald-950/60 text-emerald-300 border-emerald-800"
                            : isToneDown
                            ? "bg-rose-950/60 text-rose-300 border-rose-800"
                            : "bg-[#202020] text-amber-300 border-slate-700"
                        }`}
                      >
                        {isToneUp ? (
                          <TrendingUp className="w-3 h-3" />
                        ) : isToneDown ? (
                          <TrendingDown className="w-3 h-3" />
                        ) : (
                          <Sparkles className="w-3 h-3" />
                        )}
                        <span>{tone}</span>
                      </span>

                      {rep.displayDate && (
                        <span className="text-[10px] font-mono text-slate-500">
                          {rep.displayDate}
                        </span>
                      )}
                    </div>

                    {/* Summary Snippet */}
                    <p className="mt-3 text-xs text-slate-400 font-sans line-clamp-3 leading-relaxed">
                      {summary}
                    </p>
                  </div>

                  {/* Card Bottom Meta */}
                  <div className="mt-4 pt-3 border-t border-slate-850 flex items-center justify-between text-[11px] font-mono text-slate-500">
                    <span>
                      {rep.movers ? `${rep.movers.length} 只异动股` : "包含异动归因"}
                    </span>
                    <span className="text-[#d4af37] group-hover:underline">
                      {isSelected ? "当前正在浏览" : "翻阅本期复盘 ➔"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-[#141414] flex items-center justify-between text-xs text-slate-400 font-mono">
          <span>提示：每日收盘后 GitHub Actions 自动化 Pipeline 会自动生成并归档新一期研报。</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#202020] hover:bg-slate-700 text-white rounded-sm text-xs font-mono transition-colors"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
};
