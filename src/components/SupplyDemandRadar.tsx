import React, { useState, useMemo } from "react";
import {
  Compass,
  TrendingUp,
  TrendingDown,
  Target,
  Shield,
  ShieldCheck,
  AlertTriangle,
  Zap,
  Info,
  Layers,
  ArrowRight,
  Filter,
  CheckCircle2,
  PieChart,
  Activity,
  Award,
} from "lucide-react";
import { HistoricalDailyData, SupplyDemandCandidate } from "../types";
import { resolveSupplyDemandCandidates } from "../utils/supplyDemandEngine";

interface SupplyDemandRadarProps {
  currentDayData?: HistoricalDailyData | null;
  yahooQuotes?: Record<string, any>;
  onSelectStock?: (ticker: string) => void;
  onAskAiForStock?: (ticker: string) => void;
}

export const SupplyDemandRadar: React.FC<SupplyDemandRadarProps> = ({
  currentDayData,
  yahooQuotes,
  onSelectStock,
  onAskAiForStock,
}) => {
  const [filterMode, setFilterMode] = useState<"all" | "high_rr" | "dbr" | "rbr">("all");
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);

  // 1. Resolve all candidates dynamically
  const allCandidates = useMemo(() => {
    return resolveSupplyDemandCandidates(currentDayData || null, yahooQuotes);
  }, [currentDayData, yahooQuotes]);

  // 2. Filter candidates
  const filteredCandidates = useMemo(() => {
    if (filterMode === "high_rr") {
      return allCandidates.filter((c) => (c.riskRewardRatio ?? 0) >= 2.5);
    }
    if (filterMode === "dbr") {
      return allCandidates.filter((c) => c.zoneType.includes("DBR"));
    }
    if (filterMode === "rbr") {
      return allCandidates.filter((c) => c.zoneType.includes("RBR"));
    }
    return allCandidates;
  }, [allCandidates, filterMode]);

  // 3. Key Metrics summary
  const totalCount = allCandidates.length;
  const highRrCount = allCandidates.filter((c) => (c.riskRewardRatio ?? 0) >= 2.5).length;
  const validRrList = allCandidates.map((c) => c.riskRewardRatio).filter((r): r is number => r != null && r > 0);
  const avgRr = validRrList.length > 0 ? (validRrList.reduce((a, b) => a + b, 0) / validRrList.length).toFixed(1) : "—";
  const freshCount = allCandidates.filter((c) => c.zoneFreshness.includes("新鲜")).length;

  return (
    <div className="space-y-5">
      {/* 1. Header Banner & Methodology Philosophy */}
      <div className="bg-[#111111] border border-slate-800 p-4 sm:p-5 rounded-sm space-y-3.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-sm bg-[#1a1a1a] border border-[#d4af37]/40 flex items-center justify-center text-[#d4af37]">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-serif font-bold text-white tracking-wide">
                  供需区与K线战法进场雷达 (Supply-Demand Action Radar)
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-800/60 font-semibold">
                  KK战法 · 四步闭环进场模型
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                基于 <span className="text-amber-200 font-mono">kking2020</span> 价格行为学教程体系：①道氏大周期定方向 → ②供需区找关键位 (DBR/RBR) → ③K线形态确认 → ④盈亏比 (R:R ≥ 2.0x) + ATR量化风控
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] font-mono text-slate-400">
              数据源: Yahoo 官方实时行情 • 零假数据
            </span>
          </div>
        </div>

        {/* 4 Steps Visual Flow Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2 border-t border-slate-800/80 text-xs font-mono">
          <div className="p-2.5 rounded bg-[#0a0a0a] border border-slate-850 flex items-start gap-2">
            <span className="text-amber-400 font-bold shrink-0">①</span>
            <div>
              <span className="text-slate-200 font-semibold block text-[11px]">方向 · 道氏理论</span>
              <span className="text-[10px] text-slate-500">只认高低点，顺大势做多</span>
            </div>
          </div>
          <div className="p-2.5 rounded bg-[#0a0a0a] border border-slate-850 flex items-start gap-2">
            <span className="text-cyan-400 font-bold shrink-0">②</span>
            <div>
              <span className="text-slate-200 font-semibold block text-[11px]">位置 · 供需区</span>
              <span className="text-[10px] text-slate-500">DBR反转 / RBR顺势回踩</span>
            </div>
          </div>
          <div className="p-2.5 rounded bg-[#0a0a0a] border border-slate-850 flex items-start gap-2">
            <span className="text-emerald-400 font-bold shrink-0">③</span>
            <div>
              <span className="text-slate-200 font-semibold block text-[11px]">时机 · 形态确认</span>
              <span className="text-[10px] text-slate-500">长下影Pin Bar / 看涨吞没</span>
            </div>
          </div>
          <div className="p-2.5 rounded bg-[#0a0a0a] border border-slate-850 flex items-start gap-2">
            <span className="text-rose-400 font-bold shrink-0">④</span>
            <div>
              <span className="text-slate-200 font-semibold block text-[11px]">离场 · 盈亏比≥2.0</span>
              <span className="text-[10px] text-slate-500">远端线防守，不到2倍不做</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Stat Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
        <div className="p-3.5 bg-[#111111] border border-slate-800 rounded-sm">
          <span className="text-[10px] text-slate-400 block mb-1">今日符合战法候选</span>
          <div className="text-xl font-bold text-slate-100 flex items-baseline gap-1">
            <span>{totalCount}</span>
            <span className="text-xs text-slate-500 font-normal">只标的</span>
          </div>
        </div>
        <div className="p-3.5 bg-[#111111] border border-slate-800 rounded-sm">
          <span className="text-[10px] text-emerald-400 block mb-1">优质盈亏比 (R:R ≥ 2.5:1)</span>
          <div className="text-xl font-bold text-emerald-300 flex items-baseline gap-1">
            <span>{highRrCount}</span>
            <span className="text-xs text-slate-500 font-normal">只黄金机会</span>
          </div>
        </div>
        <div className="p-3.5 bg-[#111111] border border-slate-800 rounded-sm">
          <span className="text-[10px] text-[#d4af37] block mb-1">平均盈亏回报比</span>
          <div className="text-xl font-bold text-[#d4af37] flex items-baseline gap-1">
            <span>{avgRr}</span>
            <span className="text-xs text-slate-500 font-normal">:1</span>
          </div>
        </div>
        <div className="p-3.5 bg-[#111111] border border-slate-800 rounded-sm">
          <span className="text-[10px] text-cyan-400 block mb-1">新鲜需求区 (首测)</span>
          <div className="text-xl font-bold text-cyan-300 flex items-baseline gap-1">
            <span>{freshCount}</span>
            <span className="text-xs text-slate-500 font-normal">/ {totalCount} 标的</span>
          </div>
        </div>
      </div>

      {/* 3. Filter Buttons */}
      <div className="flex items-center justify-between gap-3 bg-[#0d0d0d] p-2.5 rounded-sm border border-slate-850">
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-mono">
          <button
            onClick={() => setFilterMode("all")}
            className={`px-3 py-1.5 rounded-sm transition-colors cursor-pointer ${
              filterMode === "all"
                ? "bg-[#d4af37] text-black font-bold"
                : "text-slate-400 hover:text-white hover:bg-slate-800/60"
            }`}
          >
            全部机会 ({allCandidates.length})
          </button>
          <button
            onClick={() => setFilterMode("high_rr")}
            className={`px-3 py-1.5 rounded-sm transition-colors cursor-pointer flex items-center gap-1 ${
              filterMode === "high_rr"
                ? "bg-emerald-500 text-black font-bold"
                : "text-slate-400 hover:text-white hover:bg-slate-800/60"
            }`}
          >
            <Award className="w-3 h-3" />
            <span>优质盈亏比 ≥ 2.5:1 ({highRrCount})</span>
          </button>
          <button
            onClick={() => setFilterMode("dbr")}
            className={`px-3 py-1.5 rounded-sm transition-colors cursor-pointer ${
              filterMode === "dbr"
                ? "bg-cyan-600 text-white font-bold"
                : "text-slate-400 hover:text-white hover:bg-slate-800/60"
            }`}
          >
            DBR 跌-盘-涨 (反转需求)
          </button>
          <button
            onClick={() => setFilterMode("rbr")}
            className={`px-3 py-1.5 rounded-sm transition-colors cursor-pointer ${
              filterMode === "rbr"
                ? "bg-amber-600 text-white font-bold"
                : "text-slate-400 hover:text-white hover:bg-slate-800/60"
            }`}
          >
            RBR 涨-盘-涨 (顺势延续)
          </button>
        </div>

        <span className="text-[11px] text-slate-500 font-mono hidden md:inline">
          已按盈亏比高低与五维评分降序排列
        </span>
      </div>

      {/* 4. Candidate List / Cards */}
      <div className="space-y-3.5">
        {filteredCandidates.map((c) => {
          const isSelected = selectedTicker === c.ticker;
          const isPositive = (c.changePercent ?? 0) >= 0;
          const isHighRr = (c.riskRewardRatio ?? 0) >= 2.5;

          return (
            <div
              key={c.ticker}
              className={`bg-[#111111] border rounded-sm transition-all overflow-hidden ${
                isHighRr ? "border-emerald-900/60 hover:border-emerald-600/80" : "border-slate-800 hover:border-slate-700"
              }`}
            >
              {/* Card Header Row */}
              <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-850 bg-[#0e0e0e]">
                <div className="flex items-center gap-3">
                  <span className="text-base font-bold font-mono text-white tracking-wide">
                    {c.ticker}
                  </span>
                  <span className="text-xs text-slate-400 font-sans">
                    {c.name}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    {c.sector}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#161208] text-amber-300 border border-amber-900/60 font-semibold">
                    {c.zoneType}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#0a1410] text-emerald-300 border border-emerald-950 font-semibold">
                    {c.zoneFreshness}
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  {/* Price & Change */}
                  <div className="text-right font-mono">
                    <span className="text-sm font-bold text-white block">
                      ${c.price?.toFixed(2) ?? "暂无报价"}
                    </span>
                    <span
                      className={`text-xs font-semibold ${
                        isPositive ? "text-emerald-400" : "text-rose-400"
                      }`}
                    >
                      {c.changePercent != null
                        ? `${isPositive ? "+" : ""}${c.changePercent.toFixed(2)}%`
                        : "暂无涨跌幅"}
                    </span>
                  </div>

                  {/* R:R Ratio Badge */}
                  <div
                    className={`px-3 py-1.5 rounded-sm border font-mono text-center shrink-0 ${
                      isHighRr
                        ? "bg-emerald-950/80 text-emerald-300 border-emerald-700/80"
                        : "bg-amber-950/60 text-amber-300 border-amber-700/60"
                    }`}
                  >
                    <span className="text-[10px] block opacity-75">盈亏比 R:R</span>
                    <span className="text-sm font-bold">{c.riskRewardLabel}</span>
                  </div>
                </div>
              </div>

              {/* Card Body: 4-Step Technical Parameters */}
              <div className="p-4 space-y-3.5">
                {/* 4 Quantitative Pillars */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono text-xs">
                  {/* ① Dow Trend */}
                  <div className="p-2.5 rounded bg-[#141414] border border-slate-850">
                    <span className="text-[10px] text-slate-400 block">① 道氏大趋势</span>
                    <span className="text-slate-200 font-bold block mt-0.5">
                      {c.dowTrend}
                    </span>
                    <span className="text-[10px] text-slate-500 mt-0.5 block">顺势开仓基准</span>
                  </div>

                  {/* ② Proximal vs Distal Line */}
                  <div className="p-2.5 rounded bg-[#141414] border border-slate-850">
                    <span className="text-[10px] text-slate-400 block">② 供需区入场 / 止损</span>
                    <div className="flex items-center gap-1.5 text-slate-200 font-bold mt-0.5">
                      <span className="text-cyan-300">${c.proximalLine?.toFixed(2) ?? "暂无"}</span>
                      <span className="text-slate-600">/</span>
                      <span className="text-rose-300">${c.distalLine?.toFixed(2) ?? "暂无"}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 mt-0.5 block">近端线 / 远端线</span>
                  </div>

                  {/* ③ Pattern Confirmation */}
                  <div className="p-2.5 rounded bg-[#141414] border border-slate-850">
                    <span className="text-[10px] text-slate-400 block">③ 时机形态确认</span>
                    <span className="text-emerald-300 font-bold block mt-0.5 truncate" title={c.patternConfirmation}>
                      {c.patternConfirmation}
                    </span>
                    <span className="text-[10px] text-slate-500 mt-0.5 block">K线行为反击</span>
                  </div>

                  {/* ④ Target & Volatility */}
                  <div className="p-2.5 rounded bg-[#141414] border border-slate-850">
                    <span className="text-[10px] text-slate-400 block">④ 目标位 / 14日ATR</span>
                    <div className="flex items-center gap-1.5 text-slate-200 font-bold mt-0.5">
                      <span className="text-[#d4af37]">${c.targetPrice?.toFixed(2) ?? "暂无"}</span>
                      <span className="text-slate-600">/</span>
                      <span className="text-slate-300">±${c.atr14?.toFixed(2) ?? "暂无"}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 mt-0.5 block">上方供给区 / 波幅</span>
                  </div>
                </div>

                {/* Entry Rationale Explanation Box (为什么可以进场) */}
                <div className="p-3 bg-[#0a0a0a] rounded border border-slate-850 text-xs font-sans text-slate-300 leading-relaxed space-y-1">
                  <div className="flex items-center gap-1.5 font-mono font-bold text-amber-400 text-xs">
                    <Zap className="w-3.5 h-3.5" />
                    <span>【为什么可以进场 · KK四步战法逻辑拆解】:</span>
                    <span className="text-[10px] font-normal px-2 py-0.2 rounded bg-amber-950/60 text-amber-300 border border-amber-800/40">
                      操作建议: {c.entryAction}
                    </span>
                  </div>
                  <p className="text-slate-300 text-xs font-sans pl-5 leading-relaxed">
                    {c.entryReason}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-2.5 pt-1">
                  {onSelectStock && (
                    <button
                      onClick={() => onSelectStock(c.ticker)}
                      className="px-3.5 py-1.5 rounded-sm bg-[#161616] hover:bg-[#202020] text-slate-300 hover:text-white border border-slate-800 text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Layers className="w-3.5 h-3.5 text-[#d4af37]" />
                      <span>查看该股详情与完整估值锚</span>
                    </button>
                  )}
                  {onAskAiForStock && (
                    <button
                      onClick={() => onAskAiForStock(c.ticker)}
                      className="px-3.5 py-1.5 rounded-sm bg-[#d4af37] hover:bg-[#c49f27] text-black text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>向 AI 推演 [{c.ticker}] 供需操盘计划</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 5. Educational Methodology & Transparency Reference Card */}
      <div className="p-4 rounded-sm bg-[#080808] border border-slate-800 text-xs font-sans text-slate-400 space-y-2">
        <div className="flex items-center gap-2 font-mono font-bold text-slate-300 text-xs">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>【战法量化定义与免责声明】</span>
        </div>
        <p className="leading-relaxed text-[11px] text-slate-400">
          本页面逻辑严格对照 <span className="text-amber-200 font-mono">kking2020.com/kline/</span> K线战法教程构建：
          近端线（需求区实体上边沿）、远端线（需求区最低影线）、止损点（远端线外侧缓冲区）；
          盈亏比 (R:R) 严格按公式 <code>(目标空间 ÷ 止损空间)</code> 计算，达标门槛为 <code>≥ 2.0x</code>，优选 <code>≥ 2.5x</code>。
          所有行情价格与关键技术位均源自 Yahoo Finance 官方权威接口与当日研报，坚决恪守“零假数据、零估算兜底”原则。
        </p>
      </div>
    </div>
  );
};
