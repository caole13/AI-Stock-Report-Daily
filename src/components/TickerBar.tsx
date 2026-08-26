import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { HistoricalDailyData } from "../types";

interface TickerBarProps {
  currentDayData: HistoricalDailyData;
  onSelectTicker?: (ticker: string) => void;
}

export const TickerBar: React.FC<TickerBarProps> = ({ currentDayData, onSelectTicker }) => {
  if (!currentDayData) return null;

  // Combine macro items and top sector leaders for scrolling ribbon
  const macroRibbon = (currentDayData.macro?.items || []).map((m) => ({
    name: m.name,
    ticker: m.ticker,
    value: m.currentValue,
    change: m.changePercent,
    unit: m.unit,
  }));

  const stockRibbon = (currentDayData.sectors || []).flatMap((s) =>
    (s.leaders || []).map((l) => ({
      name: l.name,
      ticker: l.ticker,
      value: l.price,
      change: l.changePercent,
      unit: "USD",
    }))
  );

  const allItems = [...macroRibbon, ...stockRibbon];

  return (
    <div className="bg-[#080808] border-b border-slate-850 py-1.5 px-4 overflow-hidden relative select-none">
      <div className="flex items-center gap-6 animate-none overflow-x-auto no-scrollbar whitespace-nowrap">
        <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-[#d4af37] flex items-center gap-1 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-[#d4af37] animate-pulse"></span>
          {currentDayData.date} 归档行情
        </span>

        <div className="flex items-center gap-5 text-xs font-mono">
          {allItems.map((item, idx) => {
            const hasChange = item.change !== undefined && item.change !== null;
            const isPos = hasChange && item.change > 0;
            const isNeg = hasChange && item.change < 0;
            const valStr = item.value !== undefined && item.value !== null
              ? (item.value >= 1000 ? item.value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : item.value.toFixed(2))
              : "---";

            return (
              <button
                key={`${item.ticker}-${idx}`}
                onClick={() => onSelectTicker && onSelectTicker(item.ticker)}
                className="flex items-center gap-1.5 hover:bg-[#181818] px-2 py-0.5 rounded-sm transition-colors cursor-pointer group"
              >
                <span className="font-semibold text-slate-200 group-hover:text-[#d4af37] transition-colors">
                  {item.ticker}
                </span>
                <span className="text-slate-400">
                  {valStr}
                </span>
                {hasChange && (
                  <span
                    className={`flex items-center text-[11px] font-bold ${
                      isPos ? "text-emerald-400" : isNeg ? "text-rose-400" : "text-slate-400"
                    }`}
                  >
                    {isPos ? (
                      <TrendingUp className="w-3 h-3 mr-0.5 inline" />
                    ) : isNeg ? (
                      <TrendingDown className="w-3 h-3 mr-0.5 inline" />
                    ) : null}
                    {isPos ? "+" : ""}
                    {item.change.toFixed(2)}%
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
