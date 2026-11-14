import React, { useState } from "react";
import {
  ShieldCheck,
  Target,
  TrendingUp,
  AlertOctagon,
  Crosshair,
  ChevronDown,
  ChevronUp,
  Sliders,
  ExternalLink,
  Flame,
  ArrowRight,
} from "lucide-react";
import { DailyActionPlaybook as ActionPlaybookType, HistoricalDailyData } from "../types";
import { resolveActionPlaybook } from "../utils/playbookResolver";
import { getYahooFinanceUrl } from "../utils/volumeHelper";

interface DailyActionPlaybookProps {
  data: HistoricalDailyData;
  onSelectStock?: (ticker: string) => void;
}

export const DailyActionPlaybook: React.FC<DailyActionPlaybookProps> = ({
  data,
  onSelectStock,
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const playbook = resolveActionPlaybook(data);

  if (!playbook) return null;

  const {
    marketRegime,
    recommendedAllocation,
    defenseLevels,
    bullScenario,
    bearScenario,
    topCandidates,
  } = playbook;

  return (
    <div className="bg-[#121212] border border-[#d4af37]/30 rounded-sm overflow-hidden shadow-2xl transition-all">
      {/* Header Banner */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="p-4 bg-gradient-to-r from-[#171717] via-[#1a1712] to-[#171717] hover:bg-[#1f1a14] cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 select-none transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-sm bg-[#221c10] border border-[#d4af37]/60 flex items-center justify-center text-[#d4af37] shadow-inner shrink-0">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-serif font-bold text-white tracking-wide flex items-center gap-2">
                明日核心行动剧本 (Daily Action Playbook)
              </h2>
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-sm bg-[#d4af37]/15 text-[#e5c158] border border-[#d4af37]/40">
                {marketRegime}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-sm bg-blue-950/40 text-blue-300 border border-blue-800/50">
                多头仓位 {recommendedAllocation.longEquitiesPct}% · 防守对冲 {recommendedAllocation.hedgingOrCashPct}%
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-sans mt-0.5">
              30 秒决断 · 区分交易信号与宏观背景 · 核心仓位攻防线与标的推荐
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-slate-400 text-xs font-mono self-end sm:self-center">
          <span className="text-[#d4af37] text-[11px]">{isOpen ? "收起剧本" : "展开行动剧本"}</span>
          {isOpen ? <ChevronUp className="w-4 h-4 text-[#d4af37]" /> : <ChevronDown className="w-4 h-4 text-[#d4af37]" />}
        </div>
      </div>

      {/* Main Content Area */}
      {isOpen && (
        <div className="p-4 sm:p-5 space-y-4 bg-[#0d0d0d]">
          {/* Top 3 Strategic Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Card 1: 仓位配置策略 */}
            <div className="p-3.5 rounded-sm bg-[#141414] border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono font-bold text-slate-300 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-[#d4af37]" />
                  建议仓位部署
                </span>
                <span className="text-[10px] font-mono text-emerald-400">
                  多头 {recommendedAllocation.longEquitiesPct}%
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden flex">
                <div
                  className="bg-emerald-500 h-full"
                  style={{ width: `${recommendedAllocation.longEquitiesPct}%` }}
                  title={`多头仓位: ${recommendedAllocation.longEquitiesPct}%`}
                />
                <div
                  className="bg-amber-600/80 h-full"
                  style={{ width: `${recommendedAllocation.hedgingOrCashPct}%` }}
                  title={`防守/对冲: ${recommendedAllocation.hedgingOrCashPct}%`}
                />
              </div>

              <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                {recommendedAllocation.notes}
              </p>
            </div>

            {/* Card 2: 大盘核心防守与失效线 */}
            <div className="p-3.5 rounded-sm bg-[#141414] border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono font-bold text-slate-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-rose-400" />
                  大盘核心失效基准线
                </span>
                <span className="text-[10px] font-mono text-rose-400">0穿刺防守</span>
              </div>

              <div className="space-y-1.5 text-[11px] font-mono">
                <div className="flex items-center justify-between p-1.5 rounded bg-[#0a0a0a] border border-slate-850">
                  <span className="text-slate-400">SPX 核心支撑:</span>
                  <span className="font-bold text-amber-300">{defenseLevels.spxKeySupport}</span>
                </div>
                <div className="flex items-center justify-between p-1.5 rounded bg-[#0a0a0a] border border-slate-850">
                  <span className="text-slate-400">QQQ 承接位:</span>
                  <span className="font-bold text-cyan-300">{defenseLevels.qqqKeySupport}</span>
                </div>
              </div>
            </div>

            {/* Card 3: 顺境与逆境应对法则 */}
            <div className="p-3.5 rounded-sm bg-[#141414] border border-slate-800 space-y-2">
              <span className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5">
                <AlertOctagon className="w-3.5 h-3.5 text-amber-400" />
                推演应对双剧本
              </span>

              <div className="space-y-2 text-[11px] font-sans">
                <div className="flex items-start gap-1.5">
                  <span className="px-1 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/60 font-mono text-[9px] shrink-0 mt-0.5">
                    顺境
                  </span>
                  <p className="text-slate-300 leading-tight">{bullScenario}</p>
                </div>
                <div className="flex items-start gap-1.5">
                  <span className="px-1 py-0.2 rounded bg-rose-950 text-rose-400 border border-rose-800/60 font-mono text-[9px] shrink-0 mt-0.5">
                    逆境
                  </span>
                  <p className="text-slate-400 leading-tight">{bearScenario}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Section: Top Actionable Candidates (形态共振行动标的) */}
          <div className="mt-4 pt-3 border-t border-slate-800/70">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <Crosshair className="w-4 h-4 text-[#d4af37]" />
                <h3 className="text-xs font-serif font-bold text-white uppercase tracking-wider">
                  一级交易信号 · 重点形态共振行动标的 (Top Actionable Setups)
                </h3>
              </div>
              <span className="text-[10px] font-mono text-slate-500">
                结合 Phase 2 原生 EMA 均线与 30天 RVOL 真实算力过滤
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {topCandidates.map((c) => (
                <div
                  key={c.ticker}
                  onClick={() => onSelectStock && onSelectStock(c.ticker)}
                  className="p-3.5 rounded-sm bg-[#141414] hover:bg-[#181818] border border-slate-800 hover:border-[#d4af37]/50 transition-all cursor-pointer flex flex-col justify-between group"
                >
                  <div>
                    {/* Top Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-[#d4af37] group-hover:text-amber-300 transition-colors">
                          ${c.ticker}
                        </span>
                        <span className="text-xs text-slate-300 font-sans font-medium">
                          {c.name}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-sm bg-[#1f1a10] text-[#e5c158] border border-[#d4af37]/40 font-semibold">
                          {c.bias}
                        </span>
                        <a
                          href={getYahooFinanceUrl(c.ticker)}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="p-1 text-slate-500 hover:text-white"
                          title="在 Yahoo 查看"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>

                    {/* Setup Tag */}
                    <div className="mt-2 text-xs font-mono text-slate-300 flex items-center gap-1.5 bg-[#0a0a0a] p-1.5 rounded border border-slate-850">
                      <span className="text-emerald-400">⚡ 形态特征:</span>
                      <span>{c.setup}</span>
                    </div>

                    {/* Entry / Stop / Target Metrics */}
                    <div className="grid grid-cols-3 gap-2 mt-2 text-[11px] font-mono">
                      <div className="p-1.5 rounded bg-[#0e0e0e] border border-slate-850 text-center">
                        <span className="text-slate-500 block text-[9px]">建议介入区间</span>
                        <span className="text-slate-200 font-semibold">{c.entryZone}</span>
                      </div>
                      <div className="p-1.5 rounded bg-rose-950/20 border border-rose-900/40 text-center">
                        <span className="text-rose-400/80 block text-[9px]">严格止损防守</span>
                        <span className="text-rose-300 font-semibold">{c.stopLoss.split(" ")[0]}</span>
                      </div>
                      <div className="p-1.5 rounded bg-emerald-950/20 border border-emerald-900/40 text-center">
                        <span className="text-emerald-400/80 block text-[9px]">预期目标位</span>
                        <span className="text-emerald-300 font-semibold">{c.target}</span>
                      </div>
                    </div>

                    {/* Catalyst description */}
                    {c.catalyst && (
                      <p className="text-[11px] text-slate-400 font-sans mt-2 leading-relaxed">
                        <span className="text-slate-500 font-mono">驱动催化: </span>
                        {c.catalyst}
                      </p>
                    )}
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-850/80 flex items-center justify-between text-[10px] font-mono text-slate-500">
                    <span>点击查看个股 1H / 15M 深度量价结构</span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform text-[#d4af37]" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
