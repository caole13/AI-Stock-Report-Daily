import React, { useState } from "react";
import {
  Target,
  ShieldCheck,
  AlertTriangle,
  Flame,
  Activity,
  ArrowDownRight,
  TrendingUp,
  ExternalLink,
  ChevronRight,
  Zap,
  CheckCircle,
  EyeOff,
} from "lucide-react";
import { BottomHuntSignal } from "../types";
import { getYahooFinanceUrl } from "../utils/volumeHelper";

interface BottomHuntingRadarProps {
  signals: BottomHuntSignal[];
  onSelectStock: (ticker: string) => void;
}

export const BottomHuntingRadar: React.FC<BottomHuntingRadarProps> = ({
  signals,
  onSelectStock,
}) => {
  const [filterAction, setFilterAction] = useState<"all" | "fire" | "avoid" | "fuel">("all");

  if (!signals || signals.length === 0) {
    return (
      <div className="bg-[#121212] border border-slate-800 p-8 rounded-sm text-center text-slate-400">
        <Target className="w-8 h-8 mx-auto mb-2 text-[#d4af37]" />
        <h3 className="text-sm font-semibold text-slate-200">暂无左侧抄底雷达信号</h3>
        <p className="text-xs text-slate-500 mt-1">当前交易日各标的处于趋势运行中，未触发底背离或极限出轨阈值。</p>
      </div>
    );
  }

  const safeSignals = signals || [];

  const filtered = safeSignals.filter((s) => {
    if (filterAction === "fire") return s?.divergenceAndBollinger?.action === "发射子弹";
    if (filterAction === "avoid") return s?.divergenceAndBollinger?.action === "只看不碰";
    if (filterAction === "fuel") return s?.divergenceAndBollinger?.action === "空中加油";
    return true;
  });

  const getActionBadge = (action: BottomHuntSignal["divergenceAndBollinger"]["action"]) => {
    switch (action) {
      case "发射子弹":
        return {
          text: "🎯 发射子弹 (底背离确认)",
          className: "bg-emerald-950/80 text-emerald-300 border-emerald-700/80 font-bold",
          icon: Zap,
        };
      case "只看不碰":
        return {
          text: "⛔ 只看不碰 (初次出轨下杀)",
          className: "bg-rose-950/80 text-rose-300 border-rose-700/80 font-bold animate-pulse",
          icon: EyeOff,
        };
      case "空中加油":
        return {
          text: "⛽ 空中加油 (水上中继)",
          className: "bg-amber-950/80 text-amber-300 border-amber-700/80 font-semibold",
          icon: Flame,
        };
      default:
        return {
          text: "⏳ 缩口蓄势 (等待突破)",
          className: "bg-purple-950/80 text-purple-300 border-purple-700/80",
          icon: Activity,
        };
    }
  };

  return (
    <div className="space-y-4">
      {/* Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#111111] border border-slate-800 p-4 rounded-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-sm bg-[#1a1a1a] border border-[#d4af37]/40 flex items-center justify-center text-[#d4af37]">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-serif font-bold text-white tracking-tight">
                左侧抄底“终极捕猎”雷达 (Bottom Hunting Radar)
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-800/60">
                日线底背离 + 布林带下轨检测
              </span>
            </div>
            <p className="text-xs text-slate-400 font-sans mt-0.5">
              MA200 牛熊过滤器 · MACD 零轴状态 (水上空中加油 vs 水下超跌反弹) · 第一次出轨砸穿下轨【只看不碰】vs 第二次探底稳在布林带内【发射子弹】
            </p>
          </div>
        </div>

        {/* Action Filters */}
        <div className="flex flex-wrap items-center gap-1.5 self-start md:self-center">
          <button
            onClick={() => setFilterAction("all")}
            className={`px-3 py-1 text-xs font-mono rounded-sm border transition-all ${
              filterAction === "all"
                ? "bg-[#d4af37] text-black font-semibold border-[#d4af37]"
                : "bg-[#181818] text-slate-400 border-slate-800 hover:text-white"
            }`}
          >
            全部标的 ({signals.length})
          </button>
          <button
            onClick={() => setFilterAction("fire")}
            className={`px-3 py-1 text-xs font-mono rounded-sm border transition-all flex items-center gap-1 ${
              filterAction === "fire"
                ? "bg-emerald-500 text-black font-semibold border-emerald-400"
                : "bg-[#181818] text-emerald-400 border-slate-800 hover:border-emerald-800"
            }`}
          >
            <span>🎯 发射子弹 ({safeSignals.filter((s) => s?.divergenceAndBollinger?.action === "发射子弹").length})</span>
          </button>
          <button
            onClick={() => setFilterAction("avoid")}
            className={`px-3 py-1 text-xs font-mono rounded-sm border transition-all flex items-center gap-1 ${
              filterAction === "avoid"
                ? "bg-rose-500 text-black font-semibold border-rose-400"
                : "bg-[#181818] text-rose-400 border-slate-800 hover:border-rose-800"
            }`}
          >
            <span>⛔ 只看不碰 ({safeSignals.filter((s) => s?.divergenceAndBollinger?.action === "只看不碰").length})</span>
          </button>
          <button
            onClick={() => setFilterAction("fuel")}
            className={`px-3 py-1 text-xs font-mono rounded-sm border transition-all flex items-center gap-1 ${
              filterAction === "fuel"
                ? "bg-amber-500 text-black font-semibold border-amber-400"
                : "bg-[#181818] text-amber-400 border-slate-800 hover:border-amber-800"
            }`}
          >
            <span>⛽ 空中加油 ({safeSignals.filter((s) => s?.divergenceAndBollinger?.action === "空中加油").length})</span>
          </button>
        </div>
      </div>

      {/* Cards List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
        {filtered.map((item) => {
          const actionBadge = getActionBadge(item.divergenceAndBollinger.action);
          const isUp = item.changePercent >= 0;

          return (
            <div
              key={item.ticker}
              onClick={() => onSelectStock(item.ticker)}
              className={`group bg-[#121212] border rounded-sm p-4 transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                item.divergenceAndBollinger.action === "发射子弹"
                  ? "border-emerald-700/60 hover:border-emerald-400 hover:shadow-lg hover:shadow-emerald-950/30"
                  : item.divergenceAndBollinger.action === "只看不碰"
                  ? "border-rose-900/60 hover:border-rose-500"
                  : "border-slate-800 hover:border-[#d4af37]/60"
              }`}
            >
              <div>
                {/* Header: Ticker, Name, Price, Action Badge */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-lg text-white group-hover:text-[#d4af37] transition-colors">
                        {item.ticker}
                      </span>
                      <span className="text-xs text-slate-400 font-sans">{item.name}</span>
                      <a
                        href={getYahooFinanceUrl(item.ticker)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#6001d2]/20 hover:bg-[#6001d2]/40 text-[#d8b4fe] hover:text-white border border-[#7b1fa2]/40 flex items-center gap-0.5 transition-colors"
                        title="在 Yahoo Finance 查看实时行情"
                      >
                        <span>Yahoo</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>

                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-base font-mono font-bold text-white">
                        {item.price != null ? `$${item.price.toFixed(2)}` : <span className="text-slate-500 font-mono">null</span>}
                      </span>
                      {item.changePercent != null ? (
                        <span
                          className={`text-xs font-mono font-semibold ${
                            item.changePercent >= 0 ? "text-emerald-400" : "text-rose-400"
                          }`}
                        >
                          {item.changePercent >= 0 ? "+" : ""}
                          {item.changePercent.toFixed(2)}%
                        </span>
                      ) : (
                        <span className="text-xs text-slate-500 font-mono">null</span>
                      )}
                    </div>
                  </div>

                  {/* Action Pill Badge */}
                  <div className={`px-2.5 py-1 rounded-sm border text-xs font-mono shrink-0 ${actionBadge.className}`}>
                    {actionBadge.text}
                  </div>
                </div>

                {/* State Tag Banner */}
                <div className="mt-3 p-2 rounded-sm bg-[#0d0d0d] border border-slate-800/80">
                  <div className="text-xs font-mono font-medium text-amber-300/90 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                    <span>形态判定: {item.divergenceAndBollinger.badge}</span>
                  </div>
                </div>

                {/* Technical Diagnostic Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 text-xs font-mono">
                  {/* MA200 Filter */}
                  <div className="p-2.5 rounded-sm bg-[#161616] border border-slate-800/80">
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-cyan-400" />
                      <span>MA200 牛熊分界过滤器</span>
                    </div>
                    <div className="text-slate-200 mt-1 font-medium line-clamp-1">
                      {item.ma200Filter.description}
                    </div>
                    {item.ma200Filter.ma200Price != null && (
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        MA200 基准位: ${item.ma200Filter.ma200Price.toFixed(2)}
                      </div>
                    )}
                  </div>

                  {/* MACD Zero Axis */}
                  <div className="p-2.5 rounded-sm bg-[#161616] border border-slate-800/80">
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      <Activity className="w-3 h-3 text-purple-400" />
                      <span>MACD 零轴状态</span>
                    </div>
                    <div
                      className={`mt-1 font-medium line-clamp-1 ${
                        item.macdZeroState.state === "above_zero"
                          ? "text-emerald-400"
                          : item.macdZeroState.state === "below_zero"
                          ? "text-amber-400"
                          : "text-slate-400"
                      }`}
                    >
                      {item.macdZeroState.description}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      柱状线 (Hist): {item.macdZeroState.macdHist != null ? (
                        `${item.macdZeroState.macdHist > 0 ? "+" : ""}${item.macdZeroState.macdHist.toFixed(2)} (${item.macdZeroState.signalType})`
                      ) : (
                        <span className="text-slate-500 font-mono">null</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bollinger Bands Visual Levels */}
                <div className="mt-3 p-2.5 rounded-sm bg-[#0a0a0a] border border-slate-850 text-xs font-mono">
                  <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1.5">
                    <span>布林下轨: {item.divergenceAndBollinger.bollingerLower != null ? `$${item.divergenceAndBollinger.bollingerLower}` : "null"}</span>
                    <span>中轨 (MA20): {item.divergenceAndBollinger.bollingerMid != null ? `$${item.divergenceAndBollinger.bollingerMid}` : "null"}</span>
                    <span>上轨: {item.divergenceAndBollinger.bollingerUpper != null ? `$${item.divergenceAndBollinger.bollingerUpper}` : "null"}</span>
                  </div>
                  {/* Visual Range Bar */}
                  <div className="relative h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="absolute top-0 bottom-0 bg-gradient-to-r from-emerald-600 via-amber-500 to-rose-600 opacity-60 rounded-full w-full"
                    ></div>
                  </div>
                </div>

                {/* Quantitative Logic Note */}
                <p className="text-xs text-slate-400 font-sans mt-2.5 leading-relaxed">
                  {item.divergenceAndBollinger.notes}
                </p>
              </div>

              {/* Footer */}
              <div className="mt-3 pt-2.5 border-t border-slate-850 flex items-center justify-between text-xs font-mono text-slate-400">
                <span className="text-[11px] text-slate-500">日线左侧猎手追踪</span>
                <span className="text-[#d4af37] flex items-center gap-1 group-hover:translate-x-0.5 transition-transform text-[11px]">
                  <span>查看该股详情</span>
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
