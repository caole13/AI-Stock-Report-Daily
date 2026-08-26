import React, { useState } from "react";
import {
  Flame,
  TrendingUp,
  TrendingDown,
  Zap,
  ChevronDown,
  ChevronUp,
  Newspaper,
  Shield,
  Target,
  AlertTriangle,
  ArrowRight,
  BarChart2,
} from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, YAxis } from "recharts";
import { MoverStockItem } from "../types";

interface MoversScannerProps {
  movers: MoverStockItem[];
  selectedDate: string;
  onAskAiForStock: (ticker: string) => void;
}

export const MoversScanner: React.FC<MoversScannerProps> = ({
  movers,
  selectedDate,
  onAskAiForStock,
}) => {
  const [expandedTicker, setExpandedTicker] = useState<string | null>(
    movers && movers.length > 0 ? movers[0].ticker : null
  );

  if (!movers || movers.length === 0) return null;

  const toggleExpand = (ticker: string) => {
    setExpandedTicker(expandedTicker === ticker ? null : ticker);
  };

  const getRvolString = (rvol?: number | string | null) => {
    if (rvol === null || rvol === undefined) return null;
    if (typeof rvol === "string") return rvol.includes("x") ? rvol : `${rvol}x`;
    return `${rvol.toFixed(1)}x`;
  };

  const getBiasBadgeClass = (outlookText: string) => {
    if (outlookText.includes("看多") || outlookText.includes("突破") || outlookText.includes("做多")) {
      return "bg-emerald-950/60 text-emerald-300 border-emerald-800";
    }
    if (outlookText.includes("看空") || outlookText.includes("减仓") || outlookText.includes("下修")) {
      return "bg-rose-950/60 text-rose-300 border-rose-800";
    }
    return "bg-amber-950/60 text-amber-300 border-amber-800";
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-sm bg-[#181818] border border-slate-800 flex items-center justify-center text-[#d4af37]">
            <Flame className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-serif font-bold text-white flex items-center gap-2">
              <span>异动个股深度归因与多空推演 (Movers Breakdown & Invalidation Levels)</span>
              <span className="text-[10px] font-mono font-normal text-slate-400">
                • {selectedDate} 监控
              </span>
            </h2>
            <p className="text-xs text-slate-500 font-sans">
              点击展开查看短期走势、中长期逻辑、失效止损位及新闻归因
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#d4af37] animate-pulse"></span>
            RVOL 放量异动诊断
          </span>
        </div>
      </div>

      {/* Movers List */}
      <div className="space-y-3.5">
        {movers.map((stock) => {
          const isExpanded = expandedTicker === stock.ticker;
          const isPositive = (stock.changePercent !== undefined && stock.changePercent !== null && stock.changePercent > 0) || stock.changePct?.startsWith("+");
          const isNegative = (stock.changePercent !== undefined && stock.changePercent !== null && stock.changePercent < 0) || stock.changePct?.startsWith("-");
          const changeStr = stock.changePct || (stock.changePercent !== undefined && stock.changePercent !== null ? `${isPositive ? "+" : ""}${stock.changePercent.toFixed(2)}%` : "0.00%");
          const newsText = stock.newsAttribution || stock.catalyst || (stock.news?.[0]?.title) || "";
          const shortOutlook = stock.shortTermOutlook || stock.outlook?.shortTermTrend || "";
          const midLogic = stock.midTermLogic || stock.outlook?.midTermLogic || "";
          const invalidation = stock.invalidationLevel || stock.keyLevels?.invalidation || "";

          const chartData = (stock.sparkline || [stock.price || 100]).map((v, i) => ({
            i,
            v,
          }));
          const min = Math.min(...chartData.map((d) => d.v)) * 0.995;
          const max = Math.max(...chartData.map((d) => d.v)) * 1.005;

          return (
            <div
              key={stock.ticker}
              className={`bg-[#121212] border rounded-sm transition-all overflow-hidden ${
                isExpanded
                  ? "border-[#d4af37]/60 shadow-lg"
                  : "border-slate-800 hover:border-slate-700"
              }`}
            >
              {/* Summary Bar (Click to Expand) */}
              <div
                onClick={() => toggleExpand(stock.ticker)}
                className="p-4 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#141414] hover:bg-[#181818] transition-colors select-none"
              >
                {/* Left: Ticker, Name, Sector & Attribution */}
                <div className="flex items-start sm:items-center gap-3">
                  <div className="text-center sm:text-left">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-mono font-bold text-white tracking-wide">
                        {stock.ticker}
                      </span>
                      <span className="text-xs text-slate-400 font-sans hidden sm:inline">
                        {stock.name}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-sm bg-[#1e1e1e] text-slate-300 border border-slate-800">
                        {stock.sector}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 font-sans mt-1 line-clamp-1 text-left">
                      <span className="text-slate-500 font-mono">[归因驱动]: </span>
                      {newsText}
                    </p>
                  </div>
                </div>

                {/* Right: RVOL Badge, Price, Change % & Toggle */}
                <div className="flex items-center justify-between md:justify-end gap-4 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-850">
                  {/* RVOL Badge */}
                  <div className="text-left md:text-right font-mono">
                    <span className="text-[10px] text-slate-500 block uppercase">成交量比 (RVOL)</span>
                    <span className="text-xs font-bold text-[#d4af37] bg-[#1e1e1e] px-2 py-0.5 rounded-sm border border-slate-800 inline-block mt-0.5">
                      {getRvolString(stock.rvol) ? `${getRvolString(stock.rvol)} 异常放量` : "盘后财报放量驱动"}
                    </span>
                  </div>

                  {/* Price & Change % */}
                  <div className="text-right font-mono">
                    {stock.price !== undefined && (
                      <div className="text-sm font-bold text-white">
                        ${stock.price.toFixed(2)}
                      </div>
                    )}
                    <div
                      className={`flex items-center text-xs font-bold px-1.5 py-0.5 rounded-sm border ${
                        isPositive
                          ? "text-emerald-400 bg-emerald-950/40 border-emerald-900/50"
                          : isNegative
                          ? "text-rose-400 bg-rose-950/40 border-rose-900/50"
                          : "text-slate-300 bg-slate-800/60 border-slate-700/50"
                      }`}
                    >
                      {isPositive ? (
                        <TrendingUp className="w-3 h-3 mr-0.5 inline" />
                      ) : isNegative ? (
                        <TrendingDown className="w-3 h-3 mr-0.5 inline" />
                      ) : null}
                      {changeStr}
                    </div>
                  </div>

                  {/* Toggle Arrow */}
                  <div className="p-1 rounded-sm text-slate-400 hover:text-white">
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-[#d4af37]" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded Deep Content */}
              {isExpanded && (
                <div className="p-5 bg-[#0a0a0a] border-t border-slate-800 space-y-5 animate-in fade-in duration-150">
                  
                  {/* 1. News & Catalyst Detail */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-mono text-[#d4af37]">
                      <Newspaper className="w-3.5 h-3.5" />
                      <span>新闻事件归因与财务机制 (News Attribution)</span>
                    </div>
                    <div className="p-3.5 rounded-sm bg-[#121212] border border-slate-800 text-xs text-slate-300 font-sans leading-relaxed">
                      {newsText}
                    </div>
                  </div>

                  {/* 2. Sparkline & Technical Trend Chart (if available) */}
                  {stock.sparkline && (
                    <div className="bg-[#121212] p-4 rounded-sm border border-slate-800">
                      <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                        <span className="flex items-center gap-1 font-mono text-slate-300">
                          <BarChart2 className="w-3.5 h-3.5 text-[#d4af37]" />
                          当日分时量价走势
                        </span>
                        {stock.volume && (
                          <span className="font-mono text-[10px] text-slate-500">
                            Vol: {(stock.volume / 1000000).toFixed(1)}M
                          </span>
                        )}
                      </div>
                      <div className="h-24 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 0 }}>
                            <defs>
                              <linearGradient id={`moverGrad-${stock.ticker}`} x1="0" y1="0" x2="0" y2="1">
                                <stop
                                  offset="0%"
                                  stopColor={isPositive ? "#10b981" : "#f43f5e"}
                                  stopOpacity={0.35}
                                />
                                <stop
                                  offset="100%"
                                  stopColor={isPositive ? "#10b981" : "#f43f5e"}
                                  stopOpacity={0.0}
                                />
                              </linearGradient>
                            </defs>
                            <YAxis domain={[min, max]} hide />
                            <Area
                              type="monotone"
                              dataKey="v"
                              stroke={isPositive ? "#10b981" : "#f43f5e"}
                              strokeWidth={2}
                              fill={`url(#moverGrad-${stock.ticker})`}
                              isAnimationActive={false}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}

                  {/* 3. AI Subsequent Outlook (Short vs Mid Term) & Key Levels Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    
                    {/* Left: AI Outlook (Short-Term & Mid-Term) */}
                    <div className="bg-[#121212] p-4 rounded-sm border border-slate-850 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-[#d4af37] flex items-center gap-1.5">
                          <Zap className="w-3.5 h-3.5" />
                          多空推演与趋势展望
                        </span>
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-sm border font-semibold ${getBiasBadgeClass(
                            shortOutlook
                          )}`}
                        >
                          {shortOutlook.includes("看多") ? "偏多格局" : shortOutlook.includes("看空") ? "偏空格局" : "震荡格局"}
                        </span>
                      </div>

                      <div className="space-y-2.5 text-xs font-sans">
                        <div className="p-3 rounded-sm bg-[#0a0a0a] border border-slate-850">
                          <span className="text-[11px] font-mono text-emerald-400 block mb-1 font-semibold">
                            【短期走势评估 (1-5个交易日)】:
                          </span>
                          <p className="text-slate-300 leading-relaxed">
                            {shortOutlook || "均线系统整理，关注量价确认。"}
                          </p>
                        </div>

                        <div className="p-3 rounded-sm bg-[#0a0a0a] border border-slate-850">
                          <span className="text-[11px] font-mono text-blue-400 block mb-1 font-semibold">
                            【中长期逻辑与基本面机制】:
                          </span>
                          <p className="text-slate-300 leading-relaxed">
                            {midLogic || "评估行业基本面逻辑与核心催化剂。"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Right: Key Price Levels & Invalidation */}
                    <div className="bg-[#121212] p-4 rounded-sm border border-slate-850 space-y-3">
                      <span className="text-xs font-mono font-bold text-[#d4af37] flex items-center gap-1.5">
                        <Target className="w-3.5 h-3.5" />
                        量价技术位与多空失效点 (Invalidation Level)
                      </span>

                      <div className="space-y-2.5 text-xs font-mono">
                        {/* Invalidation Level (High Priority) */}
                        <div className="p-3 rounded-sm bg-[#160808] border border-rose-900/60 flex items-start gap-2.5">
                          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="text-rose-400 font-bold block text-xs mb-0.5">
                              【多空逻辑失效位 / 关键止损点】:
                            </span>
                            <span className="text-rose-200 font-mono text-sm font-bold">
                              ${invalidation}
                            </span>
                            <p className="text-[11px] text-slate-400 font-sans mt-0.5">
                              若价格突破此位置，原有多空逻辑被证伪，强制执行风控。
                            </p>
                          </div>
                        </div>

                        {stock.keyLevels?.support && (
                          <div className="p-2.5 rounded-sm bg-[#0a0a0a] border border-emerald-950/60 flex items-start gap-2">
                            <Shield className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                            <div>
                              <span className="text-emerald-400 font-bold block text-[11px]">
                                关键支撑位 (Support Level):
                              </span>
                              <span className="text-slate-300 font-sans text-xs">
                                {stock.keyLevels.support}
                              </span>
                            </div>
                          </div>
                        )}

                        {stock.keyLevels?.resistance && (
                          <div className="p-2.5 rounded-sm bg-[#0a0a0a] border border-blue-950/60 flex items-start gap-2">
                            <Target className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                            <div>
                              <span className="text-blue-400 font-bold block text-[11px]">
                                阻力目标位 (Resistance / Target):
                              </span>
                              <span className="text-slate-300 font-sans text-xs">
                                {stock.keyLevels.resistance}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 4. Action Button */}
                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => onAskAiForStock(stock.ticker)}
                      className="px-4 py-2 rounded-sm bg-[#181818] hover:bg-[#222222] text-[#d4af37] border border-slate-800 text-xs font-mono font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <span>与 AI 策略师推演 [{stock.ticker}] 操盘计划</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
