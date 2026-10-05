import React from "react";
import { TrendingUp, TrendingDown, Activity } from "lucide-react";
import { HistoricalDailyData } from "../types";
import { resolveUnifiedStockData } from "../utils/stockDataResolver";

interface TickerBarProps {
  currentDayData: HistoricalDailyData;
  yahooQuotes?: Record<string, any>;
  onSelectStock: (ticker: string) => void;
}

export const TickerBar: React.FC<TickerBarProps> = ({ currentDayData, yahooQuotes = {}, onSelectStock }) => {
  if (!currentDayData) return null;

  // Combine macro items and top sector leaders for scrolling ribbon
  const rawMacro = currentDayData.macro?.items || (currentDayData.macro as any)?.assets || [];
  const macroRibbon = rawMacro.map((m: any) => {
    const unified = resolveUnifiedStockData(m.ticker, m, currentDayData, yahooQuotes);
    return {
      name: unified.name || m.name || m.ticker,
      ticker: m.ticker,
      value: unified.price,
      change: unified.changePercent,
      unit: m.unit || "",
    };
  });

  const stockRibbon = (currentDayData.sectors || []).flatMap((s) =>
    (s.leaders || []).map((l: any) => {
      const unified = resolveUnifiedStockData(l.ticker, l, currentDayData, yahooQuotes);
      return {
        name: unified.name || l.name || l.ticker,
        ticker: l.ticker,
        value: unified.price,
        change: unified.changePercent,
        unit: "USD",
      };
    })
  );

  const allItems = [...macroRibbon, ...stockRibbon];
  if (allItems.length === 0) return null;

  // Duplicate items sufficiently for continuous seamless loop across ultrawide displays
  const displayItems = [...allItems, ...allItems, ...allItems];

  return (
    <div className="relative w-full bg-[#0d0d0d] border-y border-slate-850 overflow-hidden py-1 select-none flex items-center">
      {/* Left Live Badge */}
      <div className="relative z-20 shrink-0 bg-[#0d0d0d] px-3 py-1 flex items-center gap-1.5 border-r border-slate-800 text-[10px] font-mono tracking-wider shadow-[4px_0_12px_rgba(0,0,0,0.8)]">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <span className="text-emerald-400 font-bold hidden sm:inline">LIVE TAPE</span>
        <Activity className="w-3 h-3 text-slate-500 sm:hidden" />
      </div>

      {/* Edge Gradient Shadows */}
      <div className="pointer-events-none absolute left-20 top-0 bottom-0 w-8 bg-gradient-to-r from-[#0d0d0d] to-transparent z-10 hidden sm:block" />
      <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-[#0d0d0d] to-transparent z-10" />

      {/* Marquee Ticker Track */}
      <div className="flex w-max animate-ticker hover:[animation-play-state:paused] cursor-pointer">
        {displayItems.map((item, idx) => {
          const isPos = item.change !== undefined && item.change !== null && item.change > 0;
          const isNeg = item.change !== undefined && item.change !== null && item.change < 0;

          return (
            <div
              key={`${item.ticker}-${idx}`}
              onClick={() => onSelectStock(item.ticker)}
              className="inline-flex items-center gap-2 px-3.5 hover:bg-slate-800/60 py-0.5 rounded transition-colors text-xs font-mono group"
            >
              <span className="text-slate-300 font-semibold group-hover:text-[#d4af37] transition-colors">{item.ticker}</span>
              <span className="text-slate-300 font-medium">
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
              <span className="text-slate-800 ml-2">|</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

