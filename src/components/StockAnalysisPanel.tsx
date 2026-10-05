import React, { useState } from "react";
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  ShieldAlert,
  Zap,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  X,
  Layers,
  LineChart,
  Clock,
  Activity,
} from "lucide-react";
import { StockAnalysisResult } from "../types";

interface StockAnalysisPanelProps {
  result: StockAnalysisResult | null;
  isLoading: boolean;
  error: string | null;
  searchedTicker: string | null;
  onRetry: () => void;
  onClose: () => void;
  onOpenDetailModal?: (ticker: string) => void;
}

export const StockAnalysisPanel: React.FC<StockAnalysisPanelProps> = ({
  result,
  isLoading,
  error,
  searchedTicker,
  onRetry,
  onClose,
  onOpenDetailModal,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // If no search has been initiated and not loading or error, don't show the panel
  if (!isLoading && !error && !result) {
    return null;
  }

  // Format ISO timestamp to user-friendly local date-time
  const formattedTime = (isoString?: string) => {
    if (!isoString) return "";
    try {
      const date = new Date(isoString);
      return date.toLocaleString("zh-CN", {
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      });
    } catch {
      return isoString;
    }
  };

  // 1. Loading State: Skeleton Screen + Progress Animation
  if (isLoading) {
    return (
      <section className="bg-[#111111] border border-amber-500/30 rounded-sm p-5 shadow-2xl relative overflow-hidden transition-all animate-pulse">
        {/* Shimmer overlay effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-500/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]"></div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-sm bg-slate-800 flex items-center justify-center">
              <RefreshCw className="w-5 h-5 text-[#d4af37] animate-spin" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-white text-lg">
                  {searchedTicker || "美股标的"}
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-amber-500/10 text-[#d4af37] border border-amber-500/30 font-mono flex items-center gap-1">
                  <Activity className="w-3 h-3 animate-pulse" />
                  实时拉取中
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                正在拉取市场数据并生成分析报告...
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-300 p-1 transition-colors self-end sm:self-auto"
            title="取消查询"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Skeleton Body */}
        <div className="mt-4 space-y-4">
          {/* Summary Skeleton */}
          <div className="bg-[#161616] p-4 rounded-sm border border-slate-800/80 space-y-2">
            <div className="h-4 bg-slate-800 rounded w-1/4"></div>
            <div className="h-3 bg-slate-850 rounded w-full"></div>
            <div className="h-3 bg-slate-850 rounded w-5/6"></div>
          </div>

          {/* Metrics Grid Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-[#161616] p-3 rounded-sm border border-slate-800/80 space-y-2"
              >
                <div className="h-3 bg-slate-800 rounded w-1/2"></div>
                <div className="h-5 bg-slate-850 rounded w-3/4"></div>
              </div>
            ))}
          </div>

          {/* Catalysts & Risks Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-[#161616] p-3 rounded-sm border border-slate-800/80 space-y-2">
              <div className="h-4 bg-slate-800 rounded w-1/3"></div>
              <div className="h-3 bg-slate-850 rounded w-full"></div>
              <div className="h-3 bg-slate-850 rounded w-4/5"></div>
            </div>
            <div className="bg-[#161616] p-3 rounded-sm border border-slate-800/80 space-y-2">
              <div className="h-4 bg-slate-800 rounded w-1/3"></div>
              <div className="h-3 bg-slate-850 rounded w-full"></div>
              <div className="h-3 bg-slate-850 rounded w-4/5"></div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // 2. Error State: Inline Error Card with Retry Button
  if (error) {
    return (
      <section className="bg-rose-950/20 border border-rose-500/40 rounded-sm p-5 shadow-xl transition-all">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-sm bg-rose-900/40 border border-rose-500/30 flex items-center justify-center shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5 text-rose-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-rose-200">
                  个股分析请求未完成
                </h3>
                {searchedTicker && (
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-rose-900/50 text-rose-300 border border-rose-700/50">
                    {searchedTicker}
                  </span>
                )}
              </div>
              <p className="text-xs text-rose-300/80 mt-1 leading-relaxed">
                {error}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0">
            <button
              onClick={onRetry}
              className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-sm text-xs font-semibold shadow transition-all cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>一键重试</span>
            </button>
            <button
              onClick={onClose}
              className="flex items-center justify-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-sm text-xs transition-colors"
            >
              <span>关闭并查看大盘</span>
            </button>
          </div>
        </div>
      </section>
    );
  }

  // 3. Success State: Structured Analysis Result Panel
  if (!result) return null;

  const isPositive = result.currentPrice?.includes("+") ?? false;
  const isNegative = result.currentPrice?.includes("-") ?? false;

  return (
    <section className="bg-gradient-to-b from-[#131313] to-[#0e0e0e] border border-[#d4af37]/40 rounded-sm shadow-2xl transition-all overflow-hidden">
      {/* Top Header Bar */}
      <div className="p-4 sm:p-5 border-b border-slate-800 bg-[#161616]/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-10 h-10 rounded-sm bg-[#1a1a1a] border border-[#d4af37]/50 flex items-center justify-center shrink-0 shadow-inner">
            <Sparkles className="w-5 h-5 text-[#d4af37]" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono font-black text-xl text-white tracking-wider">
                {result.ticker}
              </span>
              <span className="text-xs text-slate-400 font-medium max-w-[200px] sm:max-w-xs truncate">
                {result.companyName}
              </span>
              {result.currentPrice && (
                <span
                  className={`text-xs font-mono font-bold px-2 py-0.5 rounded-sm border flex items-center gap-1 ${
                    isPositive
                      ? "bg-emerald-950/60 text-emerald-400 border-emerald-700/60"
                      : isNegative
                      ? "bg-rose-950/60 text-rose-400 border-rose-700/60"
                      : "bg-slate-800 text-slate-300 border-slate-700"
                  }`}
                >
                  {isPositive ? (
                    <TrendingUp className="w-3.5 h-3.5" />
                  ) : isNegative ? (
                    <TrendingDown className="w-3.5 h-3.5" />
                  ) : null}
                  {result.currentPrice}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-400">
              <span className="flex items-center gap-1 text-slate-400">
                <Clock className="w-3 h-3 text-[#d4af37]" />
                报告时间: {formattedTime(result.timestamp)}
              </span>
              <span className="text-slate-600">·</span>
              <span className="text-emerald-400/90 font-mono">
                Yahoo Finance 行情对齐 + Gemini 深度结构化归因
              </span>
            </div>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
          {onOpenDetailModal && (
            <button
              onClick={() => onOpenDetailModal(result.ticker)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#1e1e1e] hover:bg-[#282828] text-slate-200 border border-slate-700 hover:border-[#d4af37] rounded-sm text-xs font-mono transition-colors"
              title="打开完整技术指标与K线图表详情"
            >
              <LineChart className="w-3.5 h-3.5 text-[#d4af37]" />
              <span className="hidden sm:inline">深度K线</span>
            </button>
          )}

          <button
            onClick={onRetry}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-[#1e1e1e] hover:bg-[#282828] text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 rounded-sm text-xs font-mono transition-colors"
            title="重新触发该标的分析"
          >
            <RefreshCw className="w-3 h-3" />
            <span className="hidden sm:inline">刷新</span>
          </button>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-[#1e1e1e] hover:bg-[#282828] text-[#d4af37] border border-amber-500/40 rounded-sm text-xs font-mono transition-colors"
            title={isCollapsed ? "展开分析详情" : "折叠分析卡片"}
          >
            {isCollapsed ? (
              <>
                <ChevronDown className="w-3.5 h-3.5" />
                <span>展开</span>
              </>
            ) : (
              <>
                <ChevronUp className="w-3.5 h-3.5" />
                <span>折叠</span>
              </>
            )}
          </button>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-800 rounded-sm transition-colors"
            title="关闭个股面板，返回大盘看板"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content Area (Collapsible) */}
      {!isCollapsed && (
        <div className="p-4 sm:p-6 space-y-5">
          {/* Section 1: Market Summary (核心驱动逻辑与近期走势总结) */}
          <div className="bg-[#171717] border border-slate-800 p-4 rounded-sm relative">
            <div className="flex items-center gap-2 mb-2 text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
              <span className="w-1.5 h-3.5 bg-[#d4af37] rounded-xs"></span>
              <span>核心驱动逻辑与近期走势总结</span>
            </div>
            <p className="text-sm text-slate-200 leading-relaxed font-sans">
              {result.marketSummary}
            </p>
          </div>

          {/* Section 2: Key Metrics Cards (关键指标) */}
          {result.keyMetrics && result.keyMetrics.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3 text-xs font-bold text-slate-400 font-mono">
                <span className="w-1.5 h-3 bg-slate-600 rounded-xs"></span>
                <span>关键量化与估值指标</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {result.keyMetrics.map((metric, idx) => {
                  const sentiment = metric.sentiment || "neutral";
                  const isBull = sentiment === "bullish";
                  const isBear = sentiment === "bearish";

                  return (
                    <div
                      key={idx}
                      className="bg-[#161616] border border-slate-800/90 hover:border-slate-700 p-3.5 rounded-sm flex flex-col justify-between transition-all"
                    >
                      <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
                        <span>{metric.label}</span>
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.5 rounded uppercase font-semibold ${
                            isBull
                              ? "bg-emerald-950/70 text-emerald-400 border border-emerald-800/60"
                              : isBear
                              ? "bg-rose-950/70 text-rose-400 border border-rose-800/60"
                              : "bg-slate-800 text-slate-300 border border-slate-700"
                          }`}
                        >
                          {isBull ? "偏多" : isBear ? "偏空" : "中性"}
                        </span>
                      </div>
                      <div className="mt-2 text-base font-mono font-bold text-white tracking-tight">
                        {metric.value}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section 3: Catalysts & Risks (催化剂与风险点两栏对比) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left: Catalysts */}
            <div className="bg-[#151515] border border-emerald-900/30 p-4 rounded-sm">
              <div className="flex items-center gap-2 mb-3 text-xs font-bold text-emerald-400 font-mono">
                <Zap className="w-4 h-4 text-emerald-400" />
                <span>近期核心催化剂 (Catalysts)</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-300">
                {result.catalysts && result.catalysts.length > 0 ? (
                  result.catalysts.map((cat, i) => (
                    <li key={i} className="flex items-start gap-2 leading-relaxed">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{cat}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-slate-500 italic">暂无明确催化剂披露</li>
                )}
              </ul>
            </div>

            {/* Right: Risks */}
            <div className="bg-[#151515] border border-rose-900/30 p-4 rounded-sm">
              <div className="flex items-center gap-2 mb-3 text-xs font-bold text-rose-400 font-mono">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <span>潜在风险点 (Risks)</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-300">
                {result.risks && result.risks.length > 0 ? (
                  result.risks.map((risk, i) => (
                    <li key={i} className="flex items-start gap-2 leading-relaxed">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                      <span>{risk}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-slate-500 italic">无重大短期风险警报</li>
                )}
              </ul>
            </div>
          </div>

          {/* Section 4: Technical View (技术面与量价结构) */}
          {result.technicalView && (
            <div className="bg-[#171717] border border-slate-800 p-4 rounded-sm">
              <div className="flex items-center gap-2 mb-3 text-xs font-bold text-slate-300 font-mono">
                <Layers className="w-4 h-4 text-[#d4af37]" />
                <span>技术面与量价结构 (Technical View)</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[#121212] p-3 rounded-sm border border-slate-850">
                  <span className="text-[11px] text-slate-400 block mb-1">
                    形态与量价趋势
                  </span>
                  <span className="text-xs font-semibold text-[#d4af37]">
                    {result.technicalView.trend || "均线整理"}
                  </span>
                </div>
                <div className="bg-[#121212] p-3 rounded-sm border border-slate-850">
                  <span className="text-[11px] text-slate-400 block mb-1">
                    核心支撑位区间 (Support)
                  </span>
                  <span className="text-xs font-mono font-bold text-emerald-400">
                    {result.technicalView.supportLevel || "参考近期低点"}
                  </span>
                </div>
                <div className="bg-[#121212] p-3 rounded-sm border border-slate-850">
                  <span className="text-[11px] text-slate-400 block mb-1">
                    关键阻力位区间 (Resistance)
                  </span>
                  <span className="text-xs font-mono font-bold text-amber-400">
                    {result.technicalView.resistanceLevel || "参考近期高点"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Bottom Bar: Switch View & Quick Return to Market Dashboard */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs text-slate-400">
            <span className="hidden sm:inline">
              提示：点击右上角「折叠」可收起此面板并继续对照下方大盘看板
            </span>
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                onClick={onClose}
                className="px-3 py-1.5 bg-[#1b1b1b] hover:bg-[#252525] text-slate-300 hover:text-white border border-slate-700 rounded-sm font-mono text-xs transition-colors"
              >
                切换查看大盘看板 / 历史归档
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
