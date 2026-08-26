import React, { useState } from "react";
import {
  Layers,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, YAxis } from "recharts";
import { SectorCategory, SectorLeaderStock } from "../types";

interface SectorHeatmapProps {
  sectors: SectorCategory[];
  selectedDate: string;
  onSelectStock: (ticker: string) => void;
}

export const SectorHeatmap: React.FC<SectorHeatmapProps> = ({
  sectors,
  selectedDate,
  onSelectStock,
}) => {
  // Store expanded sector IDs (all open by default or toggleable)
  const [expandedSectors, setExpandedSectors] = useState<Record<string, boolean>>({
    "tech-growth": true,
    tech: true,
    healthcare: true,
    consumer: true,
    "energy-finance": true,
    energy: true,
  });

  if (!sectors || sectors.length === 0) return null;

  const toggleSector = (id: string) => {
    setExpandedSectors((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const expandAll = () => {
    const allExpanded: Record<string, boolean> = {};
    sectors.forEach((s) => (allExpanded[s.id] = true));
    setExpandedSectors(allExpanded);
  };

  const collapseAll = () => {
    const allCollapsed: Record<string, boolean> = {};
    sectors.forEach((s) => (allCollapsed[s.id] = false));
    setExpandedSectors(allCollapsed);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-sm bg-[#181818] border border-slate-800 flex items-center justify-center text-[#d4af37]">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-serif font-bold text-white flex items-center gap-2">
              <span>行业领头羊与资金偏好雷达 (Sector Leaders Review)</span>
              <span className="text-[10px] font-mono font-normal text-slate-400">
                • {selectedDate} 轮动
              </span>
            </h2>
            <p className="text-xs text-slate-500 font-sans">
              科技、医疗、可选/必选消费、能源等板块核心龙头及驱动归因
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <button
            onClick={expandAll}
            className="text-slate-400 hover:text-white px-2 py-1 bg-[#141414] hover:bg-[#1f1f1f] rounded-sm border border-slate-800 transition-colors"
          >
            全部展开
          </button>
          <button
            onClick={collapseAll}
            className="text-slate-400 hover:text-white px-2 py-1 bg-[#141414] hover:bg-[#1f1f1f] rounded-sm border border-slate-800 transition-colors"
          >
            全部折叠
          </button>
        </div>
      </div>

      {/* Sector Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sectors.map((sec) => {
          const isExpanded = expandedSectors[sec.id] !== false;
          const avgVal = sec.avgChangePercent ?? 0;
          const isPositive = avgVal > 0;
          const isNegative = avgVal < 0;
          const sectorDisplayName = sec.name || sec.sectorName;

          // Strict null-filter: filter out stocks with null or undefined changePct
          const validLeaders = (sec.leaders || []).filter(
            (stock: SectorLeaderStock) => stock.changePct !== null && stock.changePct !== undefined
          );

          return (
            <div
              key={sec.id}
              className="bg-[#121212] border border-slate-800 rounded-sm overflow-hidden transition-all shadow-sm flex flex-col justify-between"
            >
              {/* Sector Header (Click to Toggle) */}
              <button
                onClick={() => toggleSector(sec.id)}
                className="w-full p-4 flex items-center justify-between bg-[#161616] hover:bg-[#1a1a1a] transition-colors border-b border-slate-850 text-left"
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      isPositive
                        ? "bg-emerald-400"
                        : isNegative
                        ? "bg-rose-400"
                        : "bg-slate-400"
                    }`}
                  />
                  <div>
                    <h3 className="text-sm font-serif font-bold text-white flex items-center gap-2">
                      <span>{sectorDisplayName}</span>
                      {sec.etf && (
                        <span className="text-[10px] font-mono font-normal px-1.5 py-0.2 rounded-sm bg-[#1e1e1e] text-[#d4af37] border border-slate-800">
                          {sec.etf}
                        </span>
                      )}
                    </h3>
                    {sec.thesis && (
                      <p className="text-[11px] text-slate-400 font-sans mt-0.5 line-clamp-1">
                        {sec.thesis}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 ml-2">
                  <div
                    className={`text-xs font-mono font-bold px-2 py-0.5 rounded-sm border ${
                      isPositive
                        ? "text-emerald-400 bg-emerald-950/40 border-emerald-900/50"
                        : isNegative
                        ? "text-rose-400 bg-rose-950/40 border-rose-900/50"
                        : "text-slate-300 bg-slate-800/60 border-slate-700/50"
                    }`}
                  >
                    {sec.avgChangePercent !== undefined && sec.avgChangePercent !== null
                      ? `${isPositive ? "+" : ""}${sec.avgChangePercent.toFixed(2)}%`
                      : "---"}
                  </div>
                  <div className="text-slate-500 hover:text-slate-200">
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </div>
              </button>

              {/* Sector Leader Stocks List (Expandable) */}
              {isExpanded && (
                <div className="p-3 space-y-2.5 bg-[#0f0f0f] animate-in fade-in duration-150 flex-1">
                  {validLeaders.length === 0 ? (
                    <div className="p-4 text-center text-xs font-mono text-slate-500 bg-[#121212] rounded-sm border border-slate-850">
                      当日成分股暂无显著异动或数据待更新
                    </div>
                  ) : (
                    validLeaders.map((leader: SectorLeaderStock) => {
                      const numChange = leader.changePercent !== undefined && leader.changePercent !== null
                        ? leader.changePercent
                        : (leader.changePct ? parseFloat(leader.changePct.replace("%", "")) : 0);
                      const isLeadPos = numChange > 0;
                      const isLeadNeg = numChange < 0;
                      const changeStr = leader.changePct !== undefined && leader.changePct !== null
                        ? leader.changePct
                        : (leader.changePercent !== undefined && leader.changePercent !== null
                            ? `${isLeadPos ? "+" : ""}${leader.changePercent.toFixed(2)}%`
                            : "---");
                      const catalystText = leader.catalyst || leader.reason || "";
                      const isNoNews = catalystText.includes("无重大公告") || catalystText.includes("无突发公告") || catalystText.includes("技术面");

                      const chartData = (leader.sparkline || [leader.price || 100]).map((v, i) => ({
                        i,
                        v,
                      }));
                      const min = Math.min(...chartData.map((d) => d.v)) * 0.995;
                      const max = Math.max(...chartData.map((d) => d.v)) * 1.005;

                      return (
                        <div
                          key={leader.ticker}
                          onClick={() => onSelectStock(leader.ticker)}
                          className="bg-[#141414] hover:bg-[#1c1c1c] border border-slate-850 hover:border-slate-700 p-3 rounded-sm cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                        >
                          {/* Stock Left: Ticker & Reason */}
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-mono font-bold text-white group-hover:text-[#d4af37] transition-colors">
                                {leader.ticker}
                              </span>
                              {leader.name && (
                                <span className="text-xs text-slate-400 font-sans">
                                  {leader.name}
                                </span>
                              )}
                              {leader.rvol && (
                                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-sm bg-[#1e1e1e] text-[#d4af37] border border-slate-800">
                                  RVOL {typeof leader.rvol === "number" ? `${leader.rvol.toFixed(1)}x` : leader.rvol}
                                </span>
                              )}
                            </div>
                            
                            {/* Catalyst / Attribution */}
                            <p className={`text-[11px] font-sans mt-1 leading-normal ${
                              isNoNews ? "text-slate-500 italic" : "text-slate-300"
                            }`}>
                              {catalystText}
                            </p>
                          </div>

                          {/* Stock Right: Price, Change & Sparkline */}
                          <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                            {/* Sparkline */}
                            {leader.sparkline && (
                              <div className="w-16 h-7 hidden sm:block">
                                <ResponsiveContainer width="100%" height="100%">
                                  <AreaChart data={chartData} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
                                    <YAxis domain={[min, max]} hide />
                                    <Area
                                      type="monotone"
                                      dataKey="v"
                                      stroke={isLeadPos ? "#10b981" : isLeadNeg ? "#f43f5e" : "#94a3b8"}
                                      strokeWidth={1.5}
                                      fill={isLeadPos ? "#10b981" : isLeadNeg ? "#f43f5e" : "#94a3b8"}
                                      fillOpacity={0.15}
                                      isAnimationActive={false}
                                    />
                                  </AreaChart>
                                </ResponsiveContainer>
                              </div>
                            )}

                            {/* Price & Change */}
                            <div className="text-right font-mono">
                              {leader.price !== undefined && (
                                <div className="text-xs font-bold text-white">
                                  ${leader.price.toFixed(2)}
                                </div>
                              )}
                              <div
                                className={`text-[11px] font-bold px-1.5 py-0.2 rounded-sm border ${
                                  isLeadPos
                                    ? "text-emerald-400 bg-emerald-950/40 border-emerald-900/50"
                                    : isLeadNeg
                                    ? "text-rose-400 bg-rose-950/40 border-rose-900/50"
                                    : "text-slate-300 bg-slate-800/60 border-slate-700/50"
                                }`}
                              >
                                {changeStr}
                              </div>
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
