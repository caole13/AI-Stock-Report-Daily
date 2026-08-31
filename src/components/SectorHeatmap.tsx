import React, { useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Layers,
  ChevronRight,
  Maximize2,
  Minimize2,
  ExternalLink,
} from "lucide-react";
import { SectorPerformance, SectorLeaderStock } from "../types";

interface SectorHeatmapProps {
  sectors: SectorPerformance[];
  onSelectStock: (ticker: string) => void;
}

export const SectorHeatmap: React.FC<SectorHeatmapProps> = ({
  sectors,
  onSelectStock,
}) => {
  const [expandedSectors, setExpandedSectors] = useState<Record<string, boolean>>({});

  if (!sectors || sectors.length === 0) {
    return (
      <div className="bg-[#121212] border border-slate-800 p-8 rounded-sm text-center text-slate-400">
        <Layers className="w-8 h-8 mx-auto mb-2 text-slate-500" />
        <p>暂无行业板块数据</p>
      </div>
    );
  }

  const toggleSector = (id: string) => {
    setExpandedSectors((prev) => ({
      ...prev,
      [id]: prev[id] === false ? true : false,
    }));
  };

  const expandAll = () => {
    const allExpanded: Record<string, boolean> = {};
    sectors.forEach((s, idx) => {
      const k = s.id || s.etf || s.name || `sec-${idx}`;
      allExpanded[k] = true;
      if (s.id) allExpanded[s.id] = true;
    });
    setExpandedSectors(allExpanded);
  };

  const collapseAll = () => {
    const allCollapsed: Record<string, boolean> = {};
    sectors.forEach((s, idx) => {
      const k = s.id || s.etf || s.name || `sec-${idx}`;
      allCollapsed[k] = false;
      if (s.id) allCollapsed[s.id] = false;
    });
    setExpandedSectors(allCollapsed);
  };

  return (
    <div className="space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#141414] p-4 border border-slate-800 rounded-sm">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#d4af37]" />
            <span>行业板块热力与权重领涨/领跌标的</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            涵盖标普 11 大行业 ETF 真实涨跌及重仓股异动催化归因
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={expandAll}
            className="px-2.5 py-1 text-xs bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded flex items-center gap-1 transition-colors"
          >
            <Maximize2 className="w-3 h-3" />
            <span>全部展开</span>
          </button>
          <button
            onClick={collapseAll}
            className="px-2.5 py-1 text-xs bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded flex items-center gap-1 transition-colors"
          >
            <Minimize2 className="w-3 h-3" />
            <span>全部折叠</span>
          </button>
        </div>
      </div>

      {/* Sector Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sectors.map((sec, secIdx) => {
          const secKey = sec.id || sec.etf || sec.name || `sec-${secIdx}`;
          const isExpanded = expandedSectors[secKey] !== false && (sec.id ? expandedSectors[sec.id] !== false : true);
          const avgVal = sec.avgChangePercent ?? 0;
          const isPositive = avgVal > 0;
          const isNegative = avgVal < 0;

          // 过滤掉没有 ticker 或无效占位的数据
          const validLeaders = (sec.leaders || []).filter(
            (l: SectorLeaderStock) => l && l.ticker && l.ticker !== "--" && l.ticker !== ""
          );

          return (
            <div
              key={secKey}
              className="bg-[#121212] border border-slate-800 rounded-sm overflow-hidden transition-all shadow-sm flex flex-col justify-between"
            >
              {/* Sector Header (Click to Toggle) */}
              <button
                onClick={() => toggleSector(secKey)}
                className="w-full p-4 flex items-center justify-between bg-[#161616] hover:bg-[#1a1a1a] transition-colors border-b border-slate-850 text-left"
              >
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-xs px-2 py-0.5 bg-slate-800 text-[#d4af37] rounded border border-slate-700 font-semibold">
                    {sec.etf || "ETF"}
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-100">{sec.name}</h3>
                    {sec.marketCapWeight && (
                      <span className="text-[10px] text-slate-400">
                        标普权重：{sec.marketCapWeight}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {sec.avgChangePercent !== undefined && sec.avgChangePercent !== null && (
                    <span
                      className={`text-xs font-mono font-bold px-2 py-0.5 rounded flex items-center gap-0.5 ${
                        isPositive
                          ? "bg-emerald-950/60 text-emerald-400 border border-emerald-800/40"
                          : isNegative
                          ? "bg-rose-950/60 text-rose-400 border border-rose-800/40"
                          : "bg-slate-800 text-slate-300"
                      }`}
                    >
                      {isPositive ? <TrendingUp className="w-3 h-3" /> : isNegative ? <TrendingDown className="w-3 h-3" /> : null}
                      {sec.avgChangePercent > 0 ? "+" : ""}
                      {sec.avgChangePercent.toFixed(2)}%
                    </span>
                  )}
                  <ChevronRight
                    className={`w-4 h-4 text-slate-400 transition-transform ${
                      isExpanded ? "rotate-90" : ""
                    }`}
                  />
                </div>
              </button>

              {/* Sector Core Narrative / Flow Analysis */}
              {sec.narrative && (
                <div className="px-4 py-2.5 bg-[#141414] text-xs text-slate-300 border-b border-slate-850/80 leading-relaxed font-normal">
                  <span className="text-[#d4af37] font-medium mr-1.5">【板块动向】</span>
                  {sec.narrative}
                </div>
              )}

              {/* Sector Component Stocks List */}
              {isExpanded && (
                <div className="p-3.5 space-y-2.5 bg-[#0f0f0f]/80">
                  <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider flex items-center justify-between px-1">
                    <span>关键领涨 / 领跌标的及催化</span>
                    <span>点击查看个股研报</span>
                  </div>

                  {validLeaders.length === 0 ? (
                    <div className="text-center py-4 text-xs text-slate-400 bg-[#141414] rounded border border-slate-850">
                      当日成分股暂无显著异动或数据待更新
                    </div>
                  ) : (
                    validLeaders.map((leader: SectorLeaderStock, leaderIdx: number) => {
                      const numChange = leader.changePercent !== undefined && leader.changePercent !== null
                        ? leader.changePercent
                        : (leader.changePct ? parseFloat(leader.changePct.replace("%", "")) : 0);
                      const isStockPos = (leader.changePercent !== undefined && leader.changePercent !== null && leader.changePercent > 0) || (leader.changePct && leader.changePct.startsWith("+"));
                      const isStockNeg = (leader.changePercent !== undefined && leader.changePercent !== null && leader.changePercent < 0) || (leader.changePct && leader.changePct.startsWith("-"));

                      const isNoNews =
                        !leader.catalyst ||
                        leader.catalyst.includes("【纯技术面/资金轮动，无突发公告】") ||
                        leader.catalyst.includes("无突发公告");

                      return (
                        <div
                          key={`${leader.ticker || 'stock'}-${leaderIdx}`}
                          onClick={() => onSelectStock(leader.ticker)}
                          className="bg-[#141414] hover:bg-[#1c1c1c] border border-slate-850 hover:border-slate-700 p-3 rounded-sm cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono text-sm font-bold text-white group-hover:text-[#d4af37] transition-colors">
                                {leader.ticker}
                              </span>
                              {leader.name && (
                                <span className="text-xs text-slate-400 truncate">
                                  {leader.name}
                                </span>
                              )}
                              {leader.price && (
                                <span className="text-xs font-mono text-slate-300">
                                  ${leader.price.toFixed(2)}
                                </span>
                              )}
                            </div>

                            <p
                              className={`text-xs mt-1.5 leading-relaxed line-clamp-2 ${
                                isNoNews ? "text-slate-400 italic" : "text-slate-300"
                              }`}
                            >
                              {leader.catalyst || "跟随大盘及板块资金情绪波动"}
                            </p>
                          </div>

                          <div className="flex sm:flex-col items-center sm:items-end justify-between shrink-0 gap-1">
                            <span
                              className={`text-xs font-mono font-bold px-2 py-0.5 rounded flex items-center gap-0.5 ${
                                isStockPos
                                  ? "text-emerald-400 bg-emerald-950/30"
                                  : isStockNeg
                                  ? "text-rose-400 bg-rose-950/30"
                                  : "text-slate-400 bg-slate-900"
                              }`}
                            >
                              {isStockPos ? "+" : ""}
                              {leader.changePct || (numChange ? `${numChange.toFixed(2)}%` : "--")}
                            </span>

                            <div className="text-[10px] text-slate-400 group-hover:text-[#d4af37] flex items-center gap-0.5 transition-colors">
                              <span>详情</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
