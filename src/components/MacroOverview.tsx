import React, { useState } from "react";
import {
  Globe,
  TrendingUp,
  TrendingDown,
  Info,
  ChevronDown,
  ChevronUp,
  Landmark,
  Droplets,
  DollarSign,
  Coins,
  ArrowRight,
  Minus,
  Activity,
} from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, YAxis } from "recharts";
import { MacroData, MacroAsset } from "../types";

interface MacroOverviewProps {
  macroData: MacroData;
  selectedDate: string;
}

export const MacroOverview: React.FC<MacroOverviewProps> = ({ macroData, selectedDate }) => {
  const [showFullInsight, setShowFullInsight] = useState(true);

  if (!macroData || !macroData.items) return null;

  const getAssetIcon = (ticker: string) => {
    if (ticker.includes("SPX") || ticker.includes("标普")) return <Activity className="w-3.5 h-3.5 text-blue-400" />;
    if (ticker.includes("IXIC") || ticker.includes("纳指") || ticker.includes("纳斯达克")) return <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />;
    if (ticker.includes("CL=") || ticker.includes("USO") || ticker.includes("WTI") || ticker.includes("原油")) return <Droplets className="w-3.5 h-3.5 text-amber-500" />;
    if (ticker.includes("GC=") || ticker.includes("黄金") || ticker.includes("GLD")) return <Coins className="w-3.5 h-3.5 text-[#d4af37]" />;
    if (ticker.includes("TNX") || ticker.includes("美债")) return <Landmark className="w-3.5 h-3.5 text-purple-400" />;
    if (ticker.includes("DXY") || ticker.includes("DX-Y") || ticker.includes("美元")) return <DollarSign className="w-3.5 h-3.5 text-emerald-400" />;
    return <Globe className="w-3.5 h-3.5 text-[#d4af37]" />;
  };

  const getTrendIcon = (item: MacroAsset) => {
    const isUp = item.trend === "up" || (item.changePercent !== undefined && item.changePercent !== null && item.changePercent > 0) || item.changePct?.startsWith("+");
    const isDown = item.trend === "down" || (item.changePercent !== undefined && item.changePercent !== null && item.changePercent < 0) || item.changePct?.startsWith("-");
    if (isUp) {
      return <TrendingUp className="w-3 h-3 mr-1 text-emerald-400" />;
    }
    if (isDown) {
      return <TrendingDown className="w-3 h-3 mr-1 text-rose-400" />;
    }
    return <Minus className="w-3 h-3 mr-1 text-slate-400" />;
  };

  const getTrendBadgeClass = (item: MacroAsset) => {
    const isUp = item.trend === "up" || (item.changePercent !== undefined && item.changePercent !== null && item.changePercent > 0) || item.changePct?.startsWith("+");
    const isDown = item.trend === "down" || (item.changePercent !== undefined && item.changePercent !== null && item.changePercent < 0) || item.changePct?.startsWith("-");
    if (isUp) {
      return "text-emerald-400 bg-emerald-950/40 border-emerald-900/50";
    }
    if (isDown) {
      return "text-rose-400 bg-rose-950/40 border-rose-900/50";
    }
    return "text-slate-300 bg-slate-800/60 border-slate-700/50";
  };

  const formatChangePct = (item: MacroAsset) => {
    if (item.changePct) return item.changePct;
    if (item.changePercent !== undefined && item.changePercent !== null) {
      const isPos = item.changePercent > 0;
      return `${isPos ? "+" : ""}${item.changePercent.toFixed(2)}%`;
    }
    return "0.00%";
  };

  const formatDisplayValue = (item: MacroAsset) => {
    const val = item.price ?? item.currentValue;
    if (val === undefined || val === null) return "---";
    if (val >= 1000) {
      return val.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    return val.toFixed(2);
  };

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-sm bg-[#181818] border border-slate-800 flex items-center justify-center text-[#d4af37]">
            <Globe className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-serif font-bold text-white flex items-center gap-2">
              <span>宏观水温与跨资产传导 (Macro Dynamics)</span>
              <span className="text-[10px] font-mono font-normal text-slate-400">
                • {selectedDate} 盘后
              </span>
            </h2>
            <p className="text-xs text-slate-500 font-sans">
              原油、黄金、10年期美债与美元指数核心大类资产联动
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowFullInsight(!showFullInsight)}
          className="text-xs font-mono text-slate-400 hover:text-[#d4af37] flex items-center gap-1 transition-colors self-start sm:self-auto"
        >
          <span>{showFullInsight ? "收起宏观传导机制" : "展开宏观传导机制"}</span>
          {showFullInsight ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Macro Insight Callout Banner */}
      {showFullInsight && (
        <div className="p-4 rounded-sm bg-[#121212] border border-slate-800 space-y-3 animate-in fade-in duration-200">
          {/* Core Thesis */}
          <div className="flex items-start gap-2.5">
            <Info className="w-4 h-4 text-[#d4af37] shrink-0 mt-0.5" />
            <div className="text-xs text-slate-300 font-sans leading-relaxed">
              <span className="font-semibold text-white font-serif mr-1">【宏观核心逻辑】:</span>
              {macroData.coreThesis || macroData.summary}
            </div>
          </div>

          {/* Transmission Detail */}
          {(macroData.transmissionDetail || macroData.liquidityOutlook || macroData.rateEnvironment) && (
            <div className="p-3 bg-[#0a0a0a] rounded-sm border border-slate-850 space-y-2 text-xs">
              {macroData.transmissionDetail && (
                <div className="text-slate-300 font-sans leading-relaxed">
                  <span className="text-[11px] font-mono text-[#d4af37] font-semibold block mb-1">
                    【传导机制与资金流向】:
                  </span>
                  {macroData.transmissionDetail}
                </div>
              )}

              {(macroData.liquidityOutlook || macroData.rateEnvironment) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2 border-t border-slate-850/80">
                  {macroData.liquidityOutlook && (
                    <div>
                      <span className="text-[10px] font-mono text-slate-500 block mb-0.5">[流动性与折现率]:</span>
                      <span className="text-slate-400">{macroData.liquidityOutlook}</span>
                    </div>
                  )}
                  {macroData.rateEnvironment && (
                    <div>
                      <span className="text-[10px] font-mono text-slate-500 block mb-0.5">[利率环境展望]:</span>
                      <span className="text-slate-400">{macroData.rateEnvironment}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Macro Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {macroData.items.map((item: MacroAsset) => {
          const isPos = (item.changePercent !== undefined && item.changePercent !== null && item.changePercent > 0) || item.changePct?.startsWith("+") || item.trend === "up";
          const isNeg = (item.changePercent !== undefined && item.changePercent !== null && item.changePercent < 0) || item.changePct?.startsWith("-") || item.trend === "down";
          const chartData = (item.sparkline || [item.price || item.currentValue || 100]).map((val, idx) => ({
            idx,
            val,
          }));
          const minVal = Math.min(...chartData.map((d) => d.val)) * 0.995;
          const maxVal = Math.max(...chartData.map((d) => d.val)) * 1.005;

          return (
            <div
              key={item.ticker}
              className="bg-[#121212] border border-slate-800 hover:border-slate-700 rounded-sm p-3.5 flex flex-col justify-between transition-all group shadow-sm"
            >
              {/* Top: Name & Unit */}
              <div>
                <div className="flex items-center justify-between gap-1 mb-1">
                  <div className="flex items-center gap-1.5">
                    {getAssetIcon(item.ticker)}
                    <span className="text-xs font-serif font-bold text-slate-200 group-hover:text-white transition-colors truncate">
                      {item.name}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 uppercase shrink-0">
                    {item.ticker}
                  </span>
                </div>

                {item.description && (
                  <p className="text-[10px] text-slate-500 font-sans line-clamp-1 mb-1.5">
                    {item.description}
                  </p>
                )}
              </div>

              {/* Middle: Price & Percentage Change */}
              <div className="flex items-baseline justify-between my-1.5">
                <div className="text-lg font-mono font-bold text-white truncate">
                  {formatDisplayValue(item)}
                  {item.unit && (
                    <span className="text-[9px] font-normal text-slate-500 ml-1 font-mono">
                      {item.unit}
                    </span>
                  )}
                </div>

                <div
                  className={`flex items-center text-[11px] font-mono font-bold px-1.5 py-0.2 rounded-sm border shrink-0 ${getTrendBadgeClass(
                    item
                  )}`}
                >
                  {getTrendIcon(item)}
                  {formatChangePct(item)}
                </div>
              </div>

              {/* Bottom: Sparkline AreaChart */}
              <div className="h-10 w-full mt-2 pt-1 border-t border-slate-850">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id={`macroGrad-${item.ticker.replace(/[^a-zA-Z0-9]/g, "")}`} x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="0%"
                          stopColor={isPos ? "#10b981" : isNeg ? "#f43f5e" : "#94a3b8"}
                          stopOpacity={0.35}
                        />
                        <stop
                          offset="100%"
                          stopColor={isPos ? "#10b981" : isNeg ? "#f43f5e" : "#94a3b8"}
                          stopOpacity={0.0}
                        />
                      </linearGradient>
                    </defs>
                    <YAxis domain={[minVal, maxVal]} hide />
                    <Area
                      type="monotone"
                      dataKey="val"
                      stroke={isPos ? "#10b981" : isNeg ? "#f43f5e" : "#94a3b8"}
                      strokeWidth={1.5}
                      fillOpacity={1}
                      fill={`url(#macroGrad-${item.ticker.replace(/[^a-zA-Z0-9]/g, "")})`}
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
