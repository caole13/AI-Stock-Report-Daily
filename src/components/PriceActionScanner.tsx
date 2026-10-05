import React, { useState } from "react";
import {
  Compass,
  TrendingUp,
  TrendingDown,
  Activity,
  Filter,
  ShieldCheck,
  Crosshair,
  ExternalLink,
  CheckCircle2,
  Clock,
  BarChart2,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import { PriceActionSignal } from "../types";
import { getYahooFinanceUrl } from "../utils/volumeHelper";

interface PriceActionScannerProps {
  signals: PriceActionSignal[];
  onSelectStock: (ticker: string) => void;
}

export const PriceActionScanner: React.FC<PriceActionScannerProps> = ({
  signals,
  onSelectStock,
}) => {
  const [filterMode, setFilterMode] = useState<"all" | "pinbar" | "bullish_ema" | "triggered">("all");

  if (!signals || signals.length === 0) {
    return (
      <div className="bg-[#121212] border border-slate-800 p-8 rounded-sm text-center text-slate-400">
        <Compass className="w-8 h-8 mx-auto mb-2 text-[#d4af37]" />
        <h3 className="text-sm font-semibold text-slate-200">暂无裸K形态雷达信号</h3>
        <p className="text-xs text-slate-500 mt-1">当前交易日盘后无符合 1H EMA 或 15M Pin Bar 阈值的标的。</p>
      </div>
    );
  }

  const safeSignals = signals || [];

  const filteredSignals = safeSignals.filter((s) => {
    if (filterMode === "pinbar") return s?.pinBar15m?.detected;
    if (filterMode === "bullish_ema") return s?.ema1hTrend === "bullish";
    if (filterMode === "triggered") return s?.pinBar15m?.status === "已触发";
    return true;
  });

  const getTrendBadge = (trend: PriceActionSignal["ema1hTrend"]) => {
    switch (trend) {
      case "bullish":
        return {
          text: "EMA多头排列 (21>55>144)",
          className: "bg-emerald-950/60 text-emerald-400 border-emerald-700/60",
          icon: TrendingUp,
        };
      case "bearish":
        return {
          text: "EMA空头排列 (21<55<144)",
          className: "bg-rose-950/60 text-rose-400 border-rose-700/60",
          icon: TrendingDown,
        };
      case "consolidation":
        return {
          text: "EMA缠绕震荡 (区间整理)",
          className: "bg-amber-950/60 text-amber-300 border-amber-700/60",
          icon: Activity,
        };
      default:
        return {
          text: "EMA指标未提取 (null)",
          className: "bg-slate-900/60 text-slate-400 border-slate-800",
          icon: Activity,
        };
    }
  };

  return (
    <div className="space-y-4">
      {/* Module Title Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#111111] border border-slate-800 p-4 rounded-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-sm bg-[#1a1a1a] border border-[#d4af37]/40 flex items-center justify-center text-[#d4af37]">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-serif font-bold text-white tracking-tight">
                裸K与形态雷达 (Price Action Scanner)
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800/60">
                盘后选股漏斗
              </span>
            </div>
            <p className="text-xs text-slate-400 font-sans mt-0.5">
              1小时级别 $EMA_{21} &gt; EMA_{55} &gt; EMA_{144}$ 趋势判定 · 15分钟 Pin Bar (下影线 ≥ 2×实体) 拒绝形态追踪 · 0穿刺止损与 1:1.5 盈亏比自动测算
            </p>
          </div>
        </div>

        {/* Filter Chips */}
        <div className="flex flex-wrap items-center gap-1.5 self-start md:self-center">
          <button
            onClick={() => setFilterMode("all")}
            className={`px-3 py-1 text-xs font-mono rounded-sm border transition-all ${
              filterMode === "all"
                ? "bg-[#d4af37] text-black font-semibold border-[#d4af37]"
                : "bg-[#181818] text-slate-400 border-slate-800 hover:text-white"
            }`}
          >
            全部标的 ({safeSignals.length})
          </button>
          <button
            onClick={() => setFilterMode("pinbar")}
            className={`px-3 py-1 text-xs font-mono rounded-sm border transition-all flex items-center gap-1 ${
              filterMode === "pinbar"
                ? "bg-[#d4af37] text-black font-semibold border-[#d4af37]"
                : "bg-[#181818] text-slate-400 border-slate-800 hover:text-white"
            }`}
          >
            <span>锤子/Pin Bar</span>
            <span className="text-[10px] px-1 rounded bg-black/40 text-amber-300">
              {safeSignals.filter((s) => s?.pinBar15m?.detected).length}
            </span>
          </button>
          <button
            onClick={() => setFilterMode("bullish_ema")}
            className={`px-3 py-1 text-xs font-mono rounded-sm border transition-all flex items-center gap-1 ${
              filterMode === "bullish_ema"
                ? "bg-[#d4af37] text-black font-semibold border-[#d4af37]"
                : "bg-[#181818] text-slate-400 border-slate-800 hover:text-white"
            }`}
          >
            <span>EMA多头排列</span>
            <span className="text-[10px] px-1 rounded bg-black/40 text-emerald-300">
              {safeSignals.filter((s) => s?.ema1hTrend === "bullish").length}
            </span>
          </button>
          <button
            onClick={() => setFilterMode("triggered")}
            className={`px-3 py-1 text-xs font-mono rounded-sm border transition-all flex items-center gap-1 ${
              filterMode === "triggered"
                ? "bg-[#d4af37] text-black font-semibold border-[#d4af37]"
                : "bg-[#181818] text-slate-400 border-slate-800 hover:text-white"
            }`}
          >
            <span>已触发入场</span>
            <span className="text-[10px] px-1 rounded bg-black/40 text-cyan-300">
              {safeSignals.filter((s) => s?.pinBar15m?.status === "已触发").length}
            </span>
          </button>
        </div>
      </div>

      {/* Signals Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
        {filteredSignals.map((signal) => {
          const trend = getTrendBadge(signal.ema1hTrend);
          const TrendIcon = trend.icon;
          const isUp = signal.changePercent >= 0;

          return (
            <div
              key={signal.ticker}
              onClick={() => onSelectStock(signal.ticker)}
              className="group bg-[#121212] border border-slate-800 hover:border-[#d4af37]/60 rounded-sm p-4 transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between"
            >
              <div>
                {/* Header: Ticker, Name, Price, Trend Badge */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-lg text-white group-hover:text-[#d4af37] transition-colors">
                        {signal.ticker}
                      </span>
                      <span className="text-xs text-slate-400 font-sans">{signal.name}</span>
                      <a
                        href={getYahooFinanceUrl(signal.ticker)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#6001d2]/20 hover:bg-[#6001d2]/40 text-[#d8b4fe] hover:text-white border border-[#7b1fa2]/40 flex items-center gap-0.5 transition-colors"
                        title="在 Yahoo Finance 查看实时盘口"
                      >
                        <span>Yahoo</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-base font-mono font-bold text-white">
                        {signal.price != null ? `$${signal.price.toFixed(2)}` : <span className="text-slate-500 font-mono">null</span>}
                      </span>
                      {signal.changePercent != null ? (
                        <span
                          className={`text-xs font-mono font-semibold ${
                            signal.changePercent >= 0 ? "text-emerald-400" : "text-rose-400"
                          }`}
                        >
                          {signal.changePercent >= 0 ? "+" : ""}
                          {signal.changePercent.toFixed(2)}%
                        </span>
                      ) : (
                        <span className="text-xs text-slate-500 font-mono">null</span>
                      )}
                    </div>
                  </div>

                  {/* 1H EMA Trend Badge */}
                  <div
                    className={`flex items-center gap-1 px-2 py-1 rounded-sm border text-[11px] font-mono shrink-0 ${trend.className}`}
                  >
                    <TrendIcon className="w-3.5 h-3.5" />
                    <span>{trend.text}</span>
                  </div>
                </div>

                {/* EMA Multi-Level Matrix */}
                <div className="grid grid-cols-3 gap-2 mt-3 pt-2.5 border-t border-slate-850/80 text-[11px] font-mono">
                  <div className="bg-[#161616] p-2 rounded-sm border border-slate-800/80">
                    <div className="text-slate-500 text-[10px]">EMA 21 (快线)</div>
                    <div className="text-emerald-400 font-semibold mt-0.5">
                      {signal.emaValues.ema21 != null ? `$${signal.emaValues.ema21.toFixed(2)}` : <span className="text-slate-500">null</span>}
                    </div>
                  </div>
                  <div className="bg-[#161616] p-2 rounded-sm border border-slate-800/80">
                    <div className="text-slate-500 text-[10px]">EMA 55 (基准)</div>
                    <div className="text-cyan-400 font-semibold mt-0.5">
                      {signal.emaValues.ema55 != null ? `$${signal.emaValues.ema55.toFixed(2)}` : <span className="text-slate-500">null</span>}
                    </div>
                  </div>
                  <div className="bg-[#161616] p-2 rounded-sm border border-slate-800/80">
                    <div className="text-slate-500 text-[10px]">EMA 144 (大周期)</div>
                    <div className="text-purple-400 font-semibold mt-0.5">
                      {signal.emaValues.ema144 != null ? `$${signal.emaValues.ema144.toFixed(2)}` : <span className="text-slate-500">null</span>}
                    </div>
                  </div>
                </div>

                {/* 15m Pin Bar / Hammer Detection Box */}
                <div className="mt-3 p-2.5 rounded-sm bg-[#0d0d0d] border border-slate-800">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 font-mono">
                      <Crosshair className="w-3.5 h-3.5 text-[#d4af37]" />
                      <span className="font-semibold text-slate-200">15分钟形态监测:</span>
                      {signal.pinBar15m.detected ? (
                        <span className="px-1.5 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-700/60 text-[10px]">
                          {signal.pinBar15m.ratioText}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">{signal.pinBar15m.ratioText || "分时结构整固"}</span>
                      )}
                    </div>

                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                        signal.pinBar15m.status === "已触发"
                          ? "bg-emerald-950/80 text-emerald-300 border border-emerald-800"
                          : signal.pinBar15m.status === "待突破确认"
                          ? "bg-amber-950/80 text-amber-300 border border-amber-800"
                          : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      {signal.pinBar15m.status || "观察池中"}
                    </span>
                  </div>

                  {/* Calculated Key Levels: 0-Pierce Stop Loss & 1:1.5 RR Target */}
                  <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-850 text-xs font-mono">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-500">建议止损位 (0穿刺)</span>
                      <span className="text-rose-400 font-bold">
                        {signal.pinBar15m.suggestedStopLoss != null ? (
                          <>
                            ${signal.pinBar15m.suggestedStopLoss.toFixed(2)}{" "}
                            <span className="text-[10px] font-normal text-slate-500">
                              (-{signal.pinBar15m.riskPct}%)
                            </span>
                          </>
                        ) : (
                          <span className="text-slate-500 font-normal">null</span>
                        )}
                      </span>
                    </div>

                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-500">1:1.5 盈亏比目标位</span>
                      <span className="text-emerald-400 font-bold">
                        {signal.pinBar15m.targetPrice1_5 != null ? (
                          <>
                            ${signal.pinBar15m.targetPrice1_5.toFixed(2)}{" "}
                            <span className="text-[10px] font-normal text-emerald-500/80">
                              (+{signal.pinBar15m.potentialGainPct}%)
                            </span>
                          </>
                        ) : (
                          <span className="text-slate-500 font-normal">null</span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Tactical Notes */}
                <p className="text-xs text-slate-400 font-sans mt-2.5 leading-relaxed line-clamp-2">
                  {signal.keyNotes}
                </p>
              </div>

              {/* Bottom Card Footer */}
              <div className="mt-3 pt-2.5 border-t border-slate-850 flex items-center justify-between text-xs font-mono text-slate-400">
                <span className="text-[11px] text-slate-500">
                  {signal.pinBar15m.triggerTime ? `监测时间: ${signal.pinBar15m.triggerTime}` : "全天盘后扫描"}
                </span>
                <span className="text-[#d4af37] flex items-center gap-1 group-hover:translate-x-0.5 transition-transform text-[11px]">
                  <span>打开K线走势与归因</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
