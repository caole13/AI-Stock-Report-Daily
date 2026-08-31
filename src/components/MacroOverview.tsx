import React, { useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Layers,
  ChevronDown,
  ChevronUp,
  Flame,
  Info,
} from "lucide-react";
import { MacroAsset } from "../types";

interface MacroOverviewProps {
  macroData: {
    coreThesis?: string;
    transmissionDetail?: string;
    summary?: string;
    items?: MacroAsset[];
    assets?: any[];
  };
  selectedDate: string;
}

export const MacroOverview: React.FC<MacroOverviewProps> = ({ macroData, selectedDate }) => {
  const [showFullInsight, setShowFullInsight] = useState(true);

  if (!macroData) return null;

  const rawItems = macroData.items || (macroData as any).assets || [];
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    if (!macroData.coreThesis && !macroData.summary) return null;
  }

  const items: MacroAsset[] = rawItems.map((item: any) => {
    const numChange = item.changePercent !== undefined && item.changePercent !== null
      ? item.changePercent
      : (item.changePct ? parseFloat(String(item.changePct).replace("%", "").replace("+", "")) : 0);
    const val = item.currentValue ?? item.price ?? 0;
    return {
      name: item.name || item.ticker,
      ticker: item.ticker || "",
      price: val,
      currentValue: val,
      changePercent: numChange,
      changePct: item.changePct || `${numChange >= 0 ? "+" : ""}${numChange.toFixed(2)}%`,
      trend: item.trend || (numChange > 0 ? "up" : numChange < 0 ? "down" : "neutral"),
      unit: item.unit || "",
      description: item.description || "",
      sparkline: item.sparkline || [val * 0.99, val * 0.995, val * 1.002, val],
    };
  });

  const getAssetIcon = (ticker: string) => {
    if (ticker.includes("SPX") || ticker.includes("标普")) return <Activity className="w-3.5 h-3.5 text-blue-400" />;
    if (ticker.includes("NDX") || ticker.includes("IXIC") || ticker.includes("纳指")) return <Layers className="w-3.5 h-3.5 text-indigo-400" />;
    if (ticker.includes("USO") || ticker.includes("CL") || ticker.includes("原油")) return <Flame className="w-3.5 h-3.5 text-amber-500" />;
    if (ticker.includes("GC") || ticker.includes("黄金")) return <TrendingUp className="w-3.5 h-3.5 text-yellow-400" />;
    if (ticker.includes("TNX") || ticker.includes("美债")) return <Activity className="w-3.5 h-3.5 text-rose-400" />;
    return <Activity className="w-3.5 h-3.5 text-emerald-400" />;
  };

  const thesisText = macroData.coreThesis || macroData.summary || "宏观流动性与全景驱动主线";

  return (
    <div className="space-y-4">
      {/* Core Macro Thesis Card */}
      <div className="bg-gradient-to-r from-[#141414] via-[#161616] to-[#121212] border border-slate-800 rounded-sm p-4 sm:p-5 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-32 bg-amber-500/5 blur-3xl rounded-full pointer-events-none"></div>

        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-[#d4af37]/10 border border-[#d4af37]/30 rounded text-[#d4af37] shrink-0 mt-0.5">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                  <span>宏观逻辑主线透视 · {selectedDate}</span>
                </h2>
                <span className="text-[11px] px-2 py-0.5 bg-[#d4af37]/10 text-[#d4af37] border border-[#d4af37]/20 rounded-full font-mono">
                  全市场跨资产定价中枢
                </span>
              </div>
              <p className="text-sm text-slate-300 mt-1.5 leading-relaxed font-normal">
                {thesisText}
              </p>
            </div>
          </div>

          {macroData.transmissionDetail && (
            <button
              onClick={() => setShowFullInsight(!showFullInsight)}
              className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 shrink-0 px-2 py-1 bg-slate-900 border border-slate-800 rounded transition-colors"
            >
              <span>{showFullInsight ? "收起传导" : "展开传导"}</span>
              {showFullInsight ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          )}
        </div>

        {/* Detailed Transmission Context Box */}
        {showFullInsight && macroData.transmissionDetail && (
          <div className="mt-3.5 pt-3.5 border-t border-slate-800/80 flex items-start gap-2 text-xs text-slate-400 bg-slate-950/40 p-3 rounded">
            <Info className="w-4 h-4 text-[#d4af37] shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span className="text-slate-300 font-medium mr-1">流动性与传导路径：</span>
              {macroData.transmissionDetail}
            </div>
          </div>
        )}
      </div>

      {/* Macro Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {items.map((item: MacroAsset, idx: number) => {
          const isPos = (item.changePercent !== undefined && item.changePercent !== null && item.changePercent > 0) || item.changePct?.startsWith("+") || item.trend === "up";
          const isNeg = (item.changePercent !== undefined && item.changePercent !== null && item.changePercent < 0) || item.changePct?.startsWith("-") || item.trend === "down";
          const chartData = (item.sparkline || [item.price || item.currentValue || 100]).map((val, cIdx) => ({
            idx: cIdx,
            val,
          }));
          const minVal = Math.min(...chartData.map((d) => d.val)) * 0.995;
          const maxVal = Math.max(...chartData.map((d) => d.val)) * 1.005;

          return (
            <div
              key={`${item.ticker || item.name || 'macro'}-${idx}`}
              className="bg-[#121212] border border-slate-800 hover:border-slate-700 rounded-sm p-3.5 flex flex-col justify-between transition-all group shadow-sm"
            >
              {/* Top: Name & Unit */}
              <div className="flex items-center justify-between gap-1 mb-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  {getAssetIcon(item.ticker || item.name)}
                  <span className="text-xs font-medium text-slate-200 truncate" title={item.name}>
                    {item.name}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono shrink-0">
                  {item.ticker}
                </span>
              </div>

              {/* Middle: Price & Change */}
              <div className="my-1">
                <div className="text-lg font-bold font-mono tracking-tight text-white">
                  {(item.currentValue ?? item.price ?? 0).toLocaleString(undefined, {
                    minimumFractionDigits: (item.currentValue ?? item.price ?? 0) < 10 ? 2 : 2,
                    maximumFractionDigits: 2,
                  })}
                  <span className="text-[10px] text-slate-400 ml-1 font-normal">
                    {item.unit || ""}
                  </span>
                </div>

                <div className="flex items-center justify-between mt-1">
                  <span
                    className={`text-xs font-mono font-medium flex items-center gap-0.5 ${
                      isPos ? "text-emerald-400" : isNeg ? "text-rose-400" : "text-slate-400"
                    }`}
                  >
                    {isPos ? <TrendingUp className="w-3 h-3" /> : isNeg ? <TrendingDown className="w-3 h-3" /> : null}
                    {item.changePct || `${(item.changePercent ?? 0) >= 0 ? "+" : ""}${(item.changePercent ?? 0).toFixed(2)}%`}
                  </span>

                  <span className="text-[10px] text-slate-400">
                    {item.trend === "up" ? "偏强" : item.trend === "down" ? "承压" : "平稳"}
                  </span>
                </div>
              </div>

              {/* Sparkline Visual (SVG Lightweight) */}
              <div className="h-6 w-full mt-2 pt-1 border-t border-slate-850 flex items-end">
                <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox={`0 0 ${chartData.length - 1 || 1} 20`}>
                  <path
                    d={chartData.reduce((acc, point, i) => {
                      const x = i;
                      const range = maxVal - minVal || 1;
                      const y = 20 - ((point.val - minVal) / range) * 18;
                      return `${acc} ${i === 0 ? "M" : "L"} ${x} ${y}`;
                    }, "")}
                    fill="none"
                    stroke={isPos ? "#10b981" : isNeg ? "#f43f5e" : "#94a3b8"}
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              {/* Bottom Insight Tag */}
              {item.description && (
                <div className="mt-2 text-[10px] text-slate-400 line-clamp-1 group-hover:line-clamp-none transition-all">
                  {item.description}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
