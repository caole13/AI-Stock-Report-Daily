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
  ExternalLink,
} from "lucide-react";
import { MacroAsset } from "../types";
import { resolveStockVolumeData, analyzeVolume, getYahooFinanceUrl } from "../utils/volumeHelper";

interface MacroOverviewProps {
  macroData: {
    coreThesis?: string;
    transmissionDetail?: string;
    summary?: string;
    items?: MacroAsset[];
    assets?: any[];
  };
  selectedDate: string;
  onSelectStock?: (ticker: string) => void;
}

export const MacroOverview: React.FC<MacroOverviewProps> = ({
  macroData,
  selectedDate,
  onSelectStock,
}) => {
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

          const getAssetMeta = (t: string, n: string) => {
            if (t.includes("USO") || n.includes("原油基金")) {
              return { label: "原油ETF (跟踪期货)", tip: "标的为ETF基金(每份约$141)，非每桶原油单价", unit: "USD/股" };
            }
            if (t.includes("CL") || n.includes("WTI")) {
              return { label: "WTI主力原油连续", tip: "轻质原油主力期货合约价格", unit: "USD/桶" };
            }
            if (t.includes("GC") || n.includes("黄金")) {
              return { label: "COMEX黄金期货", tip: "纽约商品交易所黄金主力合约", unit: "USD/盎司" };
            }
            if (t.includes("TNX") || n.includes("美债")) {
              return { label: "10年期基准国债", tip: "美国10年期国债基准收益率", unit: "%" };
            }
            if (t.includes("DXY") || t.includes("DX-Y") || n.includes("美元")) {
              return { label: "ICE美元指数", tip: "美元对主要货币一篮子汇率指数", unit: "点" };
            }
            if (t.includes("SPX") || t.includes("GSPC") || n.includes("标普")) {
              return { label: "标普500大盘", tip: "标准普尔500指数", unit: "点" };
            }
            if (t.includes("IXIC") || t.includes("NDX") || n.includes("纳指")) {
              return { label: "纳斯达克综合", tip: "纳斯达克科技成长股风向标", unit: "点" };
            }
            return { label: item.description || "", tip: "", unit: item.unit || "USD" };
          };

          const meta = getAssetMeta(item.ticker || "", item.name || "");

          // Unified macro asset volume & liquidity indicator
          const numChange = item.changePercent !== undefined && item.changePercent !== null
            ? item.changePercent
            : (item.changePct ? parseFloat(String(item.changePct).replace("%", "")) : 0);

          const volData = resolveStockVolumeData(
            item.ticker || item.name,
            undefined,
            item.volume,
            undefined,
            numChange
          );

          const volInfo = analyzeVolume(
            volData.rvol,
            numChange,
            volData.todayVol,
            volData.avgVol,
            volData.volumeUnit
          );

          return (
            <div
              key={`${item.ticker || item.name || 'macro'}-${idx}`}
              onClick={() => onSelectStock?.(item.ticker || item.name)}
              className="bg-[#121212] hover:bg-[#181818] border border-slate-800 hover:border-[#d4af37]/60 rounded-sm p-3 sm:p-3.5 flex flex-col justify-between transition-all group shadow-sm relative cursor-pointer active:scale-[0.99]"
              title={`点击查看 ${item.name} 当日分时走势、成交量及成因归因`}
            >
              {/* Top: Name & Unit */}
              <div className="flex items-center justify-between gap-1 mb-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  {getAssetIcon(item.ticker || item.name)}
                  <span className="text-xs font-medium text-slate-200 group-hover:text-white truncate" title={item.name}>
                    {item.name}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 group-hover:text-[#d4af37] font-mono shrink-0 transition-colors">
                  {item.ticker}
                </span>
              </div>

              {/* Sub-label for clarity + Volume Badge */}
              <div className="flex items-center justify-between gap-1 mb-1.5">
                <div className="text-[10px] text-[#d4af37]/80 truncate font-mono" title={meta.tip}>
                  {meta.label}
                </div>
                <span
                  className={`text-[9px] font-mono px-1.5 py-0.5 rounded border shrink-0 ${
                    volInfo.isExpansion
                      ? "bg-emerald-950/60 text-emerald-400 border-emerald-800/40"
                      : volInfo.isContraction
                      ? "bg-amber-950/40 text-amber-300 border-amber-800/40"
                      : "bg-slate-850 text-slate-400 border-slate-750"
                  }`}
                >
                  {volInfo.badgeLabel}
                </span>
              </div>

              {/* Middle: Price & Change */}
              <div className="my-1">
                <div className="text-lg font-bold font-mono tracking-tight text-white flex items-baseline">
                  {(item.currentValue ?? item.price ?? 0).toLocaleString(undefined, {
                    minimumFractionDigits: (item.currentValue ?? item.price ?? 0) < 10 ? 2 : 2,
                    maximumFractionDigits: 2,
                  })}
                  <span className="text-[10px] text-slate-400 ml-1 font-normal font-sans">
                    {item.unit || meta.unit}
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

              {/* Bottom Insight Tag & Click Affordance */}
              <div className="mt-2.5 pt-2 border-t border-slate-850/60 flex items-center justify-between text-[10px]">
                <a
                  href={getYahooFinanceUrl(item.ticker || item.name)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-[#d8b4fe] hover:text-white font-mono flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-[#6001d2]/20 hover:bg-[#6001d2]/35 border border-[#7b1fa2]/40 transition-colors"
                  title={`在 Yahoo Finance 打开 ${item.name} 行情`}
                >
                  <span>Yahoo</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
                <span className="text-[#d4af37]/80 group-hover:text-[#d4af37] font-mono flex items-center gap-0.5 font-medium transition-colors">
                  <span>走势与归因</span>
                  <span>&gt;</span>
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
