import React, { useState } from "react";
import {
  GitFork,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Zap,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Shield,
  Activity,
  Layers,
} from "lucide-react";
import { TransmissionChain, CausalAssetImpact } from "../types";

interface CausalTransmissionViewProps {
  transmissions: TransmissionChain[];
  selectedDate: string;
  onSelectStock: (ticker: string) => void;
}

export const CausalTransmissionView: React.FC<CausalTransmissionViewProps> = ({
  transmissions,
  selectedDate,
  onSelectStock,
}) => {
  const [expandedChainId, setExpandedChainId] = useState<string | null>(
    transmissions && transmissions.length > 0 ? transmissions[0].id : null
  );

  if (!transmissions || transmissions.length === 0) {
    return (
      <div className="bg-[#121212] border border-slate-800 rounded-sm p-6 text-center text-slate-400 text-xs font-mono">
        当日暂无高置信度因果传导链条记录
      </div>
    );
  }

  const toggleExpand = (id: string) => {
    setExpandedChainId(expandedChainId === id ? null : id);
  };

  const getCategoryBadge = (cat?: string) => {
    switch (cat) {
      case "产业链成本":
        return "bg-cyan-950/60 text-cyan-300 border-cyan-800";
      case "地缘政治":
        return "bg-amber-950/60 text-amber-300 border-amber-800";
      case "宏观利率":
        return "bg-purple-950/60 text-purple-300 border-purple-800";
      default:
        return "bg-[#1e1e1e] text-[#d4af37] border-slate-800";
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-sm bg-[#181818] border border-slate-800 flex items-center justify-center text-[#d4af37]">
            <GitFork className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-serif font-bold text-white flex items-center gap-2">
              <span>全市场因果传导图与跨资产联动 (Causal Chains)</span>
              <span className="text-[10px] font-mono font-normal text-slate-400">
                • {selectedDate} 链条
              </span>
            </h2>
            <p className="text-xs text-slate-500 font-sans">
              [驱动事件 / 大宗变动] → [宏观传导机制] → [受力行业] → [具体受益 / 受损标的反馈]
            </p>
          </div>
        </div>

        <div className="text-xs font-mono text-slate-400">
          共 {transmissions.length} 条闭环传导链
        </div>
      </div>

      {/* Transmission Cards List */}
      <div className="space-y-4">
        {transmissions.map((chain) => {
          const isExpanded = expandedChainId === chain.id;
          const driverText = chain.driver || chain.drivingEvent || chain.title || "";
          const mechanismText = chain.mechanism || chain.summary || "";
          const beneficiaryText = chain.beneficiary || "";
          const victimText = chain.victim || "";

          return (
            <div
              key={chain.id}
              className={`bg-[#121212] border rounded-sm transition-all overflow-hidden ${
                isExpanded
                  ? "border-[#d4af37]/60 shadow-lg"
                  : "border-slate-800 hover:border-slate-700"
              }`}
            >
              {/* Card Header (Click to Toggle) */}
              <div
                onClick={() => toggleExpand(chain.id)}
                className="p-4 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#161616] hover:bg-[#1a1a1a] transition-colors select-none"
              >
                <div className="flex items-start sm:items-center gap-3">
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-sm border shrink-0 font-semibold ${getCategoryBadge(
                      chain.category
                    )}`}
                  >
                    {chain.category || "全市场联动"}
                  </span>
                  <div>
                    <h3 className="text-sm font-serif font-bold text-white flex items-center gap-2">
                      <span>{driverText}</span>
                    </h3>
                    <p className="text-xs text-slate-400 font-sans mt-0.5 line-clamp-1">
                      <span className="text-slate-500 font-mono">[传导机制]: </span>
                      {mechanismText}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                  <div className="text-slate-400">
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-[#d4af37]" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </div>
              </div>

              {/* 3-Step Flow Pill Banner (Always visible summary flow) */}
              <div className="px-4 py-3 bg-[#0d0d0d] border-b border-slate-850 flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs">
                {/* 1. Driver */}
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-sm bg-[#1e1e1e] text-[#d4af37] border border-slate-800 shrink-0 font-bold">
                    1. 驱动事件
                  </span>
                  <span className="text-slate-200 font-medium truncate">{driverText}</span>
                </div>

                <ArrowRight className="w-4 h-4 text-slate-600 shrink-0 hidden lg:block" />

                {/* 2. Mechanism */}
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-sm bg-[#1e1e1e] text-blue-400 border border-slate-800 shrink-0 font-bold">
                    2. 传导机制
                  </span>
                  <span className="text-slate-300 truncate">{mechanismText}</span>
                </div>

                <ArrowRight className="w-4 h-4 text-slate-600 shrink-0 hidden lg:block" />

                {/* 3. Beneficiary & Victim Summary */}
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-sm bg-emerald-950/60 text-emerald-300 border border-emerald-900/50">
                    受益: {beneficiaryText || `${chain.beneficiaries?.length || 0} 个`}
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-sm bg-rose-950/60 text-rose-300 border border-rose-900/50">
                    受损: {victimText || `${chain.impactedAssets?.length || 0} 个`}
                  </span>
                </div>
              </div>

              {/* Expanded Transmission Step Flow */}
              {isExpanded && (
                <div className="p-5 bg-[#0a0a0a] space-y-5 animate-in fade-in duration-150">
                  
                  {/* 1. Detailed Transmission Steps */}
                  {chain.transmissionSteps && chain.transmissionSteps.length > 0 && (
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-1.5 text-xs font-mono text-[#d4af37]">
                        <Zap className="w-3.5 h-3.5" />
                        <span>多级传导链条拆解 (Step-by-Step Mechanism)</span>
                      </div>

                      <div className="space-y-2">
                        {chain.transmissionSteps.map((step, idx) => (
                          <div
                            key={idx}
                            className="flex items-start gap-3 bg-[#121212] p-3 rounded-sm border border-slate-800"
                          >
                            <div className="w-5 h-5 rounded-sm bg-[#1c1c1c] border border-slate-700 text-[#d4af37] text-[11px] font-mono font-bold flex items-center justify-center shrink-0 mt-0.5">
                              {idx + 1}
                            </div>
                            <p className="text-xs text-slate-300 font-sans leading-relaxed">
                              {step}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 2. Beneficiaries & Impacted Assets Cards Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                    
                    {/* Beneficiaries */}
                    <div className="bg-[#121212] p-4 rounded-sm border border-emerald-950/60 space-y-3">
                      <div className="flex items-center justify-between border-b border-emerald-900/30 pb-2">
                        <span className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1.5">
                          <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                          受益板块与标的 (Beneficiaries)
                        </span>
                      </div>

                      {beneficiaryText && (
                        <div className="p-2.5 rounded-sm bg-[#0a0a0a] border border-emerald-950/80 text-xs font-sans text-emerald-200">
                          <span className="font-mono text-[10px] text-emerald-400 font-bold block mb-0.5">
                            [受力受益领域]:
                          </span>
                          {beneficiaryText}
                        </div>
                      )}

                      {chain.beneficiaries && chain.beneficiaries.filter((a: CausalAssetImpact) => a.changePercent !== null && a.changePercent !== undefined).length > 0 && (
                        <div className="space-y-2 pt-1">
                          {chain.beneficiaries
                            .filter((a: CausalAssetImpact) => a.changePercent !== null && a.changePercent !== undefined)
                            .map((asset: CausalAssetImpact) => (
                            <div
                              key={asset.ticker}
                              onClick={() => onSelectStock(asset.ticker)}
                              className="p-2.5 rounded-sm bg-[#0a0a0a] hover:bg-[#181818] border border-slate-850 hover:border-emerald-800 transition-colors cursor-pointer flex items-start justify-between gap-2 group"
                            >
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-mono font-bold text-white group-hover:text-emerald-400 transition-colors">
                                    {asset.ticker}
                                  </span>
                                  {asset.name && (
                                    <span className="text-xs text-slate-400 font-sans">
                                      {asset.name}
                                    </span>
                                  )}
                                </div>
                                {asset.reason && (
                                  <p className="text-[11px] text-slate-400 font-sans mt-0.5">
                                    {asset.reason}
                                  </p>
                                )}
                              </div>

                              {asset.changePercent !== undefined && asset.changePercent !== null && (
                                <span
                                  className={`text-xs font-mono font-bold shrink-0 ${
                                    asset.changePercent > 0
                                      ? "text-emerald-400"
                                      : asset.changePercent < 0
                                      ? "text-rose-400"
                                      : "text-slate-400"
                                  }`}
                                >
                                  {asset.changePercent > 0 ? `+${asset.changePercent.toFixed(2)}%` : `${asset.changePercent.toFixed(2)}%`}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Impacted / Impaired Assets */}
                    <div className="bg-[#121212] p-4 rounded-sm border border-rose-950/60 space-y-3">
                      <div className="flex items-center justify-between border-b border-rose-900/30 pb-2">
                        <span className="text-xs font-mono font-bold text-rose-400 flex items-center gap-1.5">
                          <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
                          受损 / 承压标的 (Victims & Impacted)
                        </span>
                      </div>

                      {victimText && (
                        <div className="p-2.5 rounded-sm bg-[#0a0a0a] border border-rose-950/80 text-xs font-sans text-rose-200">
                          <span className="font-mono text-[10px] text-rose-400 font-bold block mb-0.5">
                            [受力受损领域]:
                          </span>
                          {victimText}
                        </div>
                      )}

                      {chain.impactedAssets && chain.impactedAssets.filter((a: CausalAssetImpact) => a.changePercent !== null && a.changePercent !== undefined).length > 0 && (
                        <div className="space-y-2 pt-1">
                          {chain.impactedAssets
                            .filter((a: CausalAssetImpact) => a.changePercent !== null && a.changePercent !== undefined)
                            .map((asset: CausalAssetImpact) => (
                            <div
                              key={asset.ticker}
                              onClick={() => onSelectStock(asset.ticker)}
                              className="p-2.5 rounded-sm bg-[#0a0a0a] hover:bg-[#181818] border border-slate-850 hover:border-rose-800 transition-colors cursor-pointer flex items-start justify-between gap-2 group"
                            >
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-mono font-bold text-white group-hover:text-rose-400 transition-colors">
                                    {asset.ticker}
                                  </span>
                                  {asset.name && (
                                    <span className="text-xs text-slate-400 font-sans">
                                      {asset.name}
                                    </span>
                                  )}
                                </div>
                                {asset.reason && (
                                  <p className="text-[11px] text-slate-400 font-sans mt-0.5">
                                    {asset.reason}
                                  </p>
                                )}
                              </div>

                              {asset.changePercent !== undefined && asset.changePercent !== null && (
                                <span
                                  className={`text-xs font-mono font-bold shrink-0 ${
                                    asset.changePercent > 0
                                      ? "text-emerald-400"
                                      : asset.changePercent < 0
                                      ? "text-rose-400"
                                      : "text-slate-400"
                                  }`}
                                >
                                  {asset.changePercent > 0 ? `+${asset.changePercent.toFixed(2)}%` : `${asset.changePercent.toFixed(2)}%`}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 3. Chain Summary Callout */}
                  {chain.summary && (
                    <div className="p-3.5 rounded-sm bg-[#151515] border border-slate-800 text-xs text-slate-300 font-sans flex items-start gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-[#d4af37] shrink-0 mt-0.5" />
                      <div>
                        <span className="font-mono text-[#d4af37] font-semibold mr-1">
                          【因果闭环总结】:
                        </span>
                        {chain.summary}
                      </div>
                    </div>
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
