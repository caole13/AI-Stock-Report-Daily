import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { HistoricalDailyData } from "../types";

interface TickerBarProps {
  currentDayData: HistoricalDailyData;
  onSelectStock: (ticker: string) => void;
}

export const TickerBar: React.FC<TickerBarProps> = ({ currentDayData, onSelectStock }) => {
  if (!currentDayData) return null;

  // Combine macro items and top sector leaders for scrolling ribbon
  const rawMacro = currentDayData.macro?.items || (currentDayData.macro as any)?.assets || [];
  const macroRibbon = rawMacro.map((m: any) => {
    const numChange = m.changePercent !== undefined && m.changePercent !== null
      ? m.changePercent
      : (m.changePct ? parseFloat(String(m.changePct).replace("%", "").replace("+", "")) : 0);
    return {
      name: m.name || m.ticker,
      ticker: m.ticker,
      value: m.currentValue ?? m.price ?? 0,
      change: numChange,
      unit: m.unit || "",
    };
  });

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
  if (allItems.length === 0) return null;

  // Duplicate items for continuous seamless loop
  const displayItems = [...allItems, ...allItems];

  return (
    <div className="w-full bg-[#0d0d0d] border-y border-slate-850 overflow-hidden py-1.5 select-none">
      <div className="flex w-max animate-ticker hover:[animation-play-state:paused]">
        {displayItems.map((item, idx) => {
          const isPos = item.change !== undefined && item.change !== null && item.change > 0;
          const isNeg = item.change !== undefined && item.change !== null && item.change < 0;

          return (
            <div
              key={`${item.ticker}-${idx}`}
              onClick={() => onSelectStock(item.ticker)}
              className="inline-flex items-center gap-2 px-4 cursor-pointer hover:bg-slate-850/60 py-0.5 rounded transition-colors text-xs font-mono"
            >
              <span className="text-slate-300 font-semibold">{item.ticker}</span>
              <span className="text-slate-400">
                {item.value ? item.value.toLocaleString(undefined, { maximumFractionDigits: 2 }) : "-"}
              </span>
              <span
                className={`flex items-center gap-0.5 text-[11px] font-medium ${
                  isPos ? "text-emerald-400" : isNeg ? "text-rose-400" : "text-slate-400"
                }`}
              >
                {isPos ? <TrendingUp className="w-2.5 h-2.5" /> : isNeg ? <TrendingDown className="w-2.5 h-2.5" /> : null}
                {item.change !== undefined && item.change !== null
                  ? `${isPos ? "+" : ""}${item.change.toFixed(2)}%`
                  : "-"}
              </span>
              <span className="text-slate-700 ml-2">|</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
