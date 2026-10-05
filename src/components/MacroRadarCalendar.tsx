import React, { useState } from "react";
import {
  Calendar,
  AlertTriangle,
  Flame,
  Clock,
  TrendingUp,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { UpcomingMacroCalendarEvent } from "../types";
import { getUpcomingMacroCalendar } from "../data/radarSignals";
import { getYahooFinanceUrl } from "../utils/volumeHelper";

interface MacroRadarCalendarProps {
  onSelectStock?: (ticker: string) => void;
  selectedDate?: string;
}

export const MacroRadarCalendar: React.FC<MacroRadarCalendarProps> = ({
  onSelectStock,
  selectedDate,
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const calendarEvents = getUpcomingMacroCalendar(selectedDate);

  const getCategoryBadge = (cat: UpcomingMacroCalendarEvent["category"]) => {
    switch (cat) {
      case "FOMC":
        return "bg-rose-950/70 text-rose-300 border-rose-700/60";
      case "OPTIONS":
        return "bg-fuchsia-950/70 text-fuchsia-300 border-fuchsia-700/60";
      case "CPI":
        return "bg-amber-950/70 text-amber-300 border-amber-700/60";
      case "NFP":
        return "bg-purple-950/70 text-purple-300 border-purple-700/60";
      case "PCE":
        return "bg-cyan-950/70 text-cyan-300 border-cyan-700/60";
      case "EARNINGS":
        return "bg-emerald-950/70 text-emerald-300 border-emerald-700/60";
      default:
        return "bg-slate-800 text-slate-300 border-slate-700";
    }
  };

  return (
    <div className="bg-[#101010] border border-slate-800 rounded-sm overflow-hidden">
      {/* Header Banner */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="p-3.5 bg-[#141414] hover:bg-[#181818] cursor-pointer flex items-center justify-between transition-colors select-none"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-sm bg-[#1e1e1e] border border-amber-500/40 flex items-center justify-center text-amber-400">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-serif font-bold text-white tracking-wide">
                核心财报与宏观黑天鹅雷达 (未来 7 天关键日历)
              </h3>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-950/60 text-rose-300 border border-rose-800/60">
                期权 IV 压制预警
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-sans mt-0.5">
              重磅财报公布日 · PCE / CPI 通胀 · 非农数据 (NFP) · FOMC 利率决议 · 期权隐含波动率 (IV Crush) 风险评级
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-slate-400 text-xs font-mono">
          <span>{isOpen ? "收起日历" : "展开未来7天日历"}</span>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </div>

      {/* Calendar Event Cards */}
      {isOpen && (
        <div className="p-3.5 border-t border-slate-850 space-y-2.5">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {calendarEvents.map((event) => {
              const isEarnings = event.category === "EARNINGS";

              return (
                <div
                  key={event.id}
                  onClick={() => {
                    if (event.ticker && onSelectStock) {
                      onSelectStock(event.ticker);
                    }
                  }}
                  className={`p-3 rounded-sm bg-[#151515] border border-slate-800/90 transition-all flex flex-col justify-between ${
                    event.importance === "CRITICAL"
                      ? "hover:border-rose-700/60 hover:shadow-md hover:shadow-rose-950/20"
                      : "hover:border-[#d4af37]/60"
                  } ${event.ticker ? "cursor-pointer" : ""}`}
                >
                  <div>
                    {/* Top Date & Category */}
                    <div className="flex items-center justify-between gap-1.5">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-sm border font-semibold ${getCategoryBadge(
                            event.category
                          )}`}
                        >
                          {event.category}
                        </span>
                        <span className="text-xs font-mono font-bold text-[#d4af37]">
                          {event.date}
                        </span>
                      </div>

                      <span className="text-[10px] font-mono text-slate-400">
                        {event.timeBj}
                      </span>
                    </div>

                    {/* Title & Ticker */}
                    <div className="mt-2 flex items-start justify-between gap-1">
                      <h4 className="text-xs font-serif font-bold text-white line-clamp-1">
                        {event.title}
                      </h4>
                      {event.ticker && (
                        <a
                          href={getYahooFinanceUrl(event.ticker)}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-[10px] font-mono px-1 py-0.2 rounded bg-[#6001d2]/20 hover:bg-[#6001d2]/40 text-[#d8b4fe] hover:text-white border border-[#7b1fa2]/40 shrink-0 flex items-center gap-0.5"
                          title="在 Yahoo 查看"
                        >
                          <span>{event.ticker}</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </div>

                    {/* Forecast vs Previous */}
                    {(event.forecast || event.previous) && (
                      <div className="mt-2 text-[11px] font-mono p-1.5 rounded bg-[#0d0d0d] border border-slate-850/80 flex items-center justify-between text-slate-300">
                        <span>预期: {event.forecast || "--"}</span>
                        <span className="text-slate-500">前值: {event.previous || "--"}</span>
                      </div>
                    )}

                    {/* IV Crush / Risk Warning */}
                    {event.ivCrushWarning && (
                      <div className="mt-2 p-1.5 rounded bg-rose-950/40 border border-rose-900/50 text-[11px] font-sans text-rose-300/90 flex items-start gap-1.5">
                        <ShieldAlert className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                        <span className="line-clamp-2 leading-tight">{event.ivCrushWarning}</span>
                      </div>
                    )}

                    {/* Strategic Impact */}
                    <p className="text-[11px] text-slate-400 font-sans mt-2 line-clamp-2 leading-relaxed">
                      {event.strategicImpact}
                    </p>
                  </div>

                  {/* Footer */}
                  <div className="mt-2.5 pt-2 border-t border-slate-850/80 flex items-center justify-between text-[10px] font-mono text-slate-500">
                    <span>影响权重: {event.importance === "CRITICAL" ? "🔴 极高" : "🟡 偏高"}</span>
                    {event.riskLevel && (
                      <span className="text-amber-400">风险: {event.riskLevel}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
