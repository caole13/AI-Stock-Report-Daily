import React, { useState, useMemo } from "react";
import {
  Network,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Zap,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ShieldAlert,
  ShieldCheck,
  Activity,
  Layers,
  List,
  ExternalLink,
  GitBranch,
  Flame,
  ArrowUpRight,
  ArrowDownRight,
  Split,
  Maximize2,
} from "lucide-react";
import { TransmissionChain, CausalAssetImpact } from "../types";

interface CausalTransmissionViewProps {
  transmissions: TransmissionChain[];
  selectedDate: string;
  onSelectStock: (ticker: string) => void;
}

// 常见标的与中文名称映射表（用于文本解析与名称丰富化）
const KNOWN_TICKER_NAMES: Record<string, string> = {
  SPX: "标普500",
  SPY: "标普500 ETF",
  IXIC: "纳斯达克",
  QQQ: "纳斯达克100 ETF",
  USO: "原油基金 ETF",
  XOM: "埃克森美孚",
  CVX: "雪佛龙",
  "GC=F": "COMEX黄金",
  GLD: "黄金 ETF",
  "^TNX": "10年期美债",
  TLT: "20年期美债 ETF",
  DXY: "美元指数",
  UUP: "美元ETF",
  NVDA: "英伟达",
  AMD: "超威半导体",
  AAPL: "苹果",
  MSFT: "微软",
  GOOGL: "谷歌",
  AMZN: "亚马逊",
  TSLA: "特斯拉",
  META: "Meta",
  AVGO: "博通",
  DELL: "戴尔科技",
  GTLB: "GitLab",
  CRWD: "CrowdStrike",
  CRM: "赛富时",
  JPM: "摩根大通",
  LLY: "礼来",
  UNH: "联合健康",
  XLE: "能源精选 ETF",
  XLK: "科技精选 ETF",
  XLF: "金融精选 ETF",
  XLY: "可选消费 ETF",
  SMH: "半导体 ETF",
};

interface ParsedAssetChip {
  ticker: string;
  name: string;
  changePct?: string;
  sentiment: "beneficiary" | "victim";
}

/**
 * 从文本或结构化数据中智能提取资产 Chip
 */
function extractAssetChips(
  impacts: CausalAssetImpact[] | undefined,
  textDescription: string | undefined,
  sentiment: "beneficiary" | "victim"
): ParsedAssetChip[] {
  const chips: ParsedAssetChip[] = [];
  const seenTickers = new Set<string>();

  // 1. 若已有结构化 impacts
  if (impacts && impacts.length > 0) {
    impacts.forEach((imp) => {
      const sym = imp.ticker?.trim().toUpperCase();
      if (sym && !seenTickers.has(sym)) {
        seenTickers.add(sym);
        chips.push({
          ticker: sym,
          name: imp.name || KNOWN_TICKER_NAMES[sym] || sym,
          changePct:
            imp.changePercent !== undefined
              ? `${imp.changePercent >= 0 ? "+" : ""}${imp.changePercent}%`
              : undefined,
          sentiment,
        });
      }
    });
  }

  // 2. 从文本描述中智能正则提取 (如 "USO", "XOM", "（GC=F）", "(NVDA, DELL)")
  if (textDescription) {
    // 匹配括号内的代码
    const parenMatches = textDescription.matchAll(/[（(]([A-Za-z0-9=^_,\s、]+)[）)]/g);
    for (const match of parenMatches) {
      const inner = match[1];
      const candidates = inner.split(/[,、\s]+/);
      for (const raw of candidates) {
        const cleaned = raw.trim().toUpperCase();
        if (
          cleaned &&
          cleaned.length >= 2 &&
          cleaned.length <= 6 &&
          /^[A-Z0-9=^]+$/.test(cleaned) &&
          !seenTickers.has(cleaned)
        ) {
          seenTickers.add(cleaned);
          chips.push({
            ticker: cleaned,
            name: KNOWN_TICKER_NAMES[cleaned] || cleaned,
            sentiment,
          });
        }
      }
    }

    // 匹配常见的关键中文名映射
    Object.entries(KNOWN_TICKER_NAMES).forEach(([ticker, name]) => {
      if (!seenTickers.has(ticker) && textDescription.includes(name)) {
        seenTickers.add(ticker);
        chips.push({
          ticker,
          name,
          sentiment,
        });
      }
    });
  }

  return chips;
}

export const CausalTransmissionView: React.FC<CausalTransmissionViewProps> = ({
  transmissions,
  selectedDate,
  onSelectStock,
}) => {
  const [viewMode, setViewMode] = useState<"flowchart" | "cards">("flowchart");
  const [activeChainIndex, setActiveChainIndex] = useState<number>(0);
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);

  if (!transmissions || transmissions.length === 0) {
    return (
      <div className="bg-neutral-900/60 backdrop-blur border border-neutral-800 rounded-xl p-10 text-center shadow-lg border-t border-t-white/10">
        <div className="w-12 h-12 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center mx-auto mb-3 text-neutral-400">
          <Network className="w-6 h-6 text-amber-400" />
        </div>
        <h3 className="text-sm font-semibold text-neutral-200">
          当日暂无高置信度因果传导链条
        </h3>
        <p className="text-xs text-neutral-400 mt-1">
          当前交易日无显著跨资产扰动或已归档为单一震荡格局。
        </p>
      </div>
    );
  }

  const currentChain = transmissions[activeChainIndex] || transmissions[0];

  // 提取当前链条的受益与受损资产 Chip 胶囊
  const beneficiaryChips = useMemo(() => {
    return extractAssetChips(
      currentChain.beneficiaries,
      currentChain.beneficiary,
      "beneficiary"
    );
  }, [currentChain]);

  const victimChips = useMemo(() => {
    return extractAssetChips(
      currentChain.impactedAssets,
      currentChain.victim,
      "victim"
    );
  }, [currentChain]);

  // 解析中间机制的要点分行
  const mechanismPoints = useMemo(() => {
    const raw = currentChain.mechanism || currentChain.summary || "";
    if (currentChain.transmissionSteps && currentChain.transmissionSteps.length > 0) {
      return currentChain.transmissionSteps;
    }
    // 智能按照标点切分为要点清单
    const parts = raw
      .split(/[；;。]/)
      .map((s) => s.trim())
      .filter((s) => s.length > 3);
    return parts.length > 0 ? parts : [raw];
  }, [currentChain]);

  const getCategoryTheme = (cat?: string) => {
    switch (cat) {
      case "产业链成本":
        return {
          bg: "bg-cyan-500/10",
          text: "text-cyan-400",
          border: "border-cyan-500/30",
          glow: "shadow-[0_0_12px_rgba(6,182,212,0.15)]",
        };
      case "地缘政治":
        return {
          bg: "bg-amber-500/10",
          text: "text-amber-400",
          border: "border-amber-500/30",
          glow: "shadow-[0_0_12px_rgba(245,158,11,0.15)]",
        };
      case "宏观利率":
        return {
          bg: "bg-indigo-500/10",
          text: "text-indigo-400",
          border: "border-indigo-500/30",
          glow: "shadow-[0_0_12px_rgba(99,102,241,0.15)]",
        };
      case "AI产业突破":
        return {
          bg: "bg-emerald-500/10",
          text: "text-emerald-400",
          border: "border-emerald-500/30",
          glow: "shadow-[0_0_12px_rgba(16,185,129,0.15)]",
        };
      default:
        return {
          bg: "bg-amber-500/10",
          text: "text-[#d4af37]",
          border: "border-amber-500/30",
          glow: "shadow-[0_0_12px_rgba(212,175,55,0.15)]",
        };
    }
  };

  const theme = getCategoryTheme(currentChain.category);

  return (
    <div className="space-y-4">
      {/* 1. 顶部控制栏与标题 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-neutral-900/60 backdrop-blur border border-neutral-800 rounded-xl p-4 shadow-lg border-t border-t-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-neutral-800/90 border border-neutral-700/80 flex items-center justify-center text-[#d4af37] shadow-inner shrink-0">
            <Network className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm md:text-base font-bold text-white tracking-tight flex items-center gap-2">
                全市场因果传导导图与跨资产联动 (Causal Dynamics)
              </h2>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-neutral-800 border border-neutral-700 text-neutral-300">
                {selectedDate}
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              驱动源事件 ➔ 宏观定价与利率机制 ➔ 多头受益与承压资产二元分流
            </p>
          </div>
        </div>

        {/* 模式切换 (Flowchart vs Cards) */}
        <div className="flex items-center gap-1 bg-neutral-950/80 p-1 border border-neutral-800 rounded-lg self-start sm:self-center shrink-0">
          <button
            onClick={() => setViewMode("flowchart")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded-md transition-all cursor-pointer ${
              viewMode === "flowchart"
                ? "bg-[#d4af37] text-neutral-950 font-bold shadow"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <GitBranch className="w-3.5 h-3.5" />
            <span>流动树状图 (Tree)</span>
          </button>
          <button
            onClick={() => setViewMode("cards")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded-md transition-all cursor-pointer ${
              viewMode === "cards"
                ? "bg-[#d4af37] text-neutral-950 font-bold shadow"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>卡片清单 (Cards)</span>
          </button>
        </div>
      </div>

      {/* 2. 顶部事件切换 Tabs (紧凑药丸状，高亮态为琥珀金) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {transmissions.map((chain, idx) => {
          const isActive = idx === activeChainIndex;
          const chainTitle =
            chain.title || chain.driver || chain.drivingEvent || `事件链路 ${idx + 1}`;

          return (
            <button
              key={chain.id || idx}
              onClick={() => setActiveChainIndex(idx)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-2 whitespace-nowrap shrink-0 border cursor-pointer ${
                isActive
                  ? "bg-amber-500/15 text-[#d4af37] border-amber-500/60 shadow-[0_0_14px_rgba(212,175,55,0.18)] font-semibold"
                  : "bg-neutral-900/80 text-neutral-400 border-neutral-800 hover:text-neutral-200 hover:border-neutral-700"
              }`}
            >
              <span
                className={`w-4 h-4 rounded-full text-[10px] font-mono font-bold flex items-center justify-center shrink-0 ${
                  isActive
                    ? "bg-[#d4af37] text-black"
                    : "bg-neutral-800 text-neutral-400"
                }`}
              >
                {idx + 1}
              </span>
              <span className="max-w-[240px] truncate">{chainTitle}</span>
            </button>
          );
        })}
      </div>

      {/* 3. FLOWCHART 核心视图：分栏流动树状结构 (Pipeline Tree) */}
      {viewMode === "flowchart" && (
        <div className="bg-neutral-900/60 backdrop-blur border border-neutral-800 rounded-xl p-5 md:p-6 shadow-xl border-t border-t-white/10 relative overflow-hidden">
          {/* 顶栏信息指示 */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-neutral-800/80">
            <div className="flex items-center gap-2.5">
              <span
                className={`text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full border font-bold ${theme.bg} ${theme.text} ${theme.border} ${theme.glow}`}
              >
                {currentChain.category || "跨资产宏观传导"}
              </span>
              <span className="text-xs text-neutral-400 font-mono">
                链路 #{activeChainIndex + 1} / 共 {transmissions.length} 组核心逻辑
              </span>
            </div>

            <div className="text-[11px] text-neutral-500 font-mono hidden md:flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>实时资产价格与传导逻辑同步中</span>
            </div>
          </div>

          {/* 核心分栏流向：左（驱动源） -> 中（机制桥梁） -> 右（二元分流分支） */}
          <div className="flex flex-col lg:flex-row items-stretch gap-4 xl:gap-5 relative">
            
            {/* COLUMN 1: 左侧（驱动源 CATALYST / DRIVER） */}
            <div className="w-full lg:w-1/4 shrink-0 flex flex-col justify-between bg-neutral-900/90 backdrop-blur border border-neutral-800 rounded-xl p-5 shadow-lg border-t border-t-white/10 relative group hover:border-amber-500/40 transition-colors">
              <div>
                {/* 顶部标签 */}
                <div className="flex items-center justify-between mb-3">
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold tracking-wider px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.15)]">
                    <Flame className="w-3 h-3 text-amber-400" />
                    <span>CATALYST / DRIVER</span>
                  </span>
                  <span className="text-[10px] font-mono text-neutral-500">STAGE 01</span>
                </div>

                {/* 驱动源标题与内容 */}
                <h3 className="text-sm md:text-base font-bold text-white leading-snug mt-2">
                  {currentChain.driver || currentChain.drivingEvent || currentChain.title}
                </h3>

                <p className="text-xs text-neutral-400 font-sans leading-relaxed mt-3">
                  核心外生扰动变量，打破资产定价原有稳态平衡，引发全市场风险溢价重估。
                </p>
              </div>

              {/* 底部信息标签 */}
              <div className="mt-5 pt-3 border-t border-neutral-800/80 flex items-center justify-between text-[11px] font-mono text-neutral-400">
                <span className="flex items-center gap-1 text-amber-400/90">
                  <Activity className="w-3.5 h-3.5" />
                  <span>驱动源脉冲</span>
                </span>
                <span className="text-neutral-500">T+0 反应</span>
              </div>
            </div>

            {/* CONNECTOR 1: 桌面端平滑连接指示 (左到中) */}
            <div className="hidden lg:flex items-center justify-center shrink-0 -mx-1 text-neutral-600">
              <div className="flex flex-col items-center gap-1">
                <div className="w-6 h-[2px] bg-gradient-to-r from-amber-500/50 to-sky-500/50"></div>
                <ArrowRight className="w-4 h-4 text-sky-400" />
              </div>
            </div>

            {/* COLUMN 2: 中间（传导逻辑桥梁 TRANSMISSION / PRICING） */}
            <div className="flex-1 min-w-[280px] flex flex-col justify-between bg-neutral-900/90 backdrop-blur border border-neutral-800 rounded-xl p-5 shadow-lg border-t border-t-white/10 relative group hover:border-sky-500/40 transition-colors">
              <div>
                {/* 顶部标签 */}
                <div className="flex items-center justify-between mb-3">
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold tracking-wider px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/30 shadow-[0_0_12px_rgba(14,165,233,0.15)]">
                    <Zap className="w-3 h-3 text-sky-400" />
                    <span>MECHANISM / PRICING</span>
                  </span>
                  <span className="text-[10px] font-mono text-neutral-500">STAGE 02</span>
                </div>

                <div className="text-xs font-semibold text-neutral-200 mb-2 flex items-center gap-1.5">
                  <span>宏观定价与利率传导链条:</span>
                </div>

                {/* 传导要点清单（要点分行排列，字号紧凑） */}
                <div className="space-y-2.5 mt-2">
                  {mechanismPoints.map((point, pIdx) => (
                    <div
                      key={pIdx}
                      className="flex items-start gap-2.5 p-2.5 rounded-lg bg-neutral-950/60 border border-neutral-800/80 hover:border-neutral-700/80 transition-colors"
                    >
                      <span className="w-4 h-4 rounded bg-sky-500/15 border border-sky-500/30 text-sky-400 text-[10px] font-mono font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {pIdx + 1}
                      </span>
                      <p className="text-xs leading-relaxed text-neutral-300 font-sans">
                        {point}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 底部传导模型说明 */}
              <div className="mt-5 pt-3 border-t border-neutral-800/80 flex items-center justify-between text-[11px] font-mono text-neutral-400">
                <span className="flex items-center gap-1 text-sky-400/90">
                  <Layers className="w-3.5 h-3.5" />
                  <span>流动性 / WACC 折现模型</span>
                </span>
                <span className="text-neutral-500">跨市场溢出</span>
              </div>
            </div>

            {/* CONNECTOR 2: 桌面端平滑连接指示 (中到右分叉) */}
            <div className="hidden lg:flex items-center justify-center shrink-0 -mx-1 text-neutral-600">
              <div className="flex flex-col items-center gap-1">
                <div className="w-6 h-[2px] bg-gradient-to-r from-sky-500/50 to-emerald-500/50"></div>
                <Split className="w-4 h-4 text-emerald-400 rotate-90" />
              </div>
            </div>

            {/* COLUMN 3: 右侧（二元分流分支 BENEFICIARIES & PRESSURES） */}
            <div className="w-full lg:w-[38%] shrink-0 flex flex-col gap-3.5">
              
              {/* 上方【多头确定性受益资产】 */}
              <div className="flex-1 flex flex-col justify-between bg-emerald-950/30 border border-emerald-800/40 backdrop-blur rounded-xl p-4.5 shadow-lg border-t border-t-emerald-400/20 relative group hover:border-emerald-700/60 transition-colors">
                <div>
                  {/* 卡片头部 */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-300">
                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                      <span>多头受益资产 (Beneficiaries)</span>
                    </span>
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-950/90 text-emerald-300 border border-emerald-800/60">
                      估值扩张 / 溢价注入
                    </span>
                  </div>

                  {/* 逻辑描述 */}
                  <p className="text-xs text-neutral-300 leading-relaxed font-sans mb-3">
                    {currentChain.beneficiary || "高壁垒行业龙头、现金流充沛及避险对冲标的"}
                  </p>

                  {/* 标的 Chip 胶囊列表 */}
                  {beneficiaryChips.length > 0 ? (
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-emerald-900/40">
                      {beneficiaryChips.map((chip) => (
                        <button
                          key={chip.ticker}
                          onClick={() => onSelectStock(chip.ticker)}
                          title={`点击查看 ${chip.ticker} 实时走势与深度分析`}
                          className="px-2.5 py-1.5 rounded-md bg-neutral-900/90 hover:bg-emerald-950/80 border border-emerald-700/50 hover:border-emerald-400 text-xs font-mono font-semibold text-emerald-300 flex items-center gap-1.5 transition-all cursor-pointer shadow-sm group hover:scale-[1.03]"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"></span>
                          <span>{chip.ticker}</span>
                          <span className="text-[11px] text-neutral-400 font-normal">
                            {chip.name !== chip.ticker ? chip.name : ""}
                          </span>
                          {chip.changePct && (
                            <span className="text-[10px] text-emerald-400 font-bold ml-0.5">
                              {chip.changePct}
                            </span>
                          )}
                          <ArrowUpRight className="w-3 h-3 text-emerald-500 opacity-60 group-hover:opacity-100 transition-opacity" />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 pt-2 border-t border-emerald-900/40">
                      <button
                        onClick={() => onSelectStock("SPY")}
                        className="px-2.5 py-1 rounded-md bg-neutral-900/80 border border-emerald-800/40 text-xs font-mono text-emerald-300 hover:border-emerald-500 cursor-pointer flex items-center gap-1"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                        <span>SPY 标普500 ETF</span>
                      </button>
                    </div>
                  )}
                </div>

                <div className="mt-2 text-[10px] font-mono text-emerald-400/70 flex items-center justify-end gap-1">
                  <span>点击 Chip 联动个股量化分析 ↗</span>
                </div>
              </div>

              {/* 下方【承压受损资产】 */}
              <div className="flex-1 flex flex-col justify-between bg-rose-950/30 border border-rose-800/40 backdrop-blur rounded-xl p-4.5 shadow-lg border-t border-t-rose-400/20 relative group hover:border-rose-700/60 transition-colors">
                <div>
                  {/* 卡片头部 */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-rose-300">
                      <TrendingDown className="w-4 h-4 text-rose-400" />
                      <span>承压受损资产 (Pressured / Victims)</span>
                    </span>
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-rose-950/90 text-rose-300 border border-rose-800/60">
                      利润承压 / 估值折现
                    </span>
                  </div>

                  {/* 逻辑描述 */}
                  <p className="text-xs text-neutral-300 leading-relaxed font-sans mb-3">
                    {currentChain.victim || "高杠杆无盈利成长股、重资产高能耗及敏感周期板块"}
                  </p>

                  {/* 标的 Chip 胶囊列表 */}
                  {victimChips.length > 0 ? (
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-rose-900/40">
                      {victimChips.map((chip) => (
                        <button
                          key={chip.ticker}
                          onClick={() => onSelectStock(chip.ticker)}
                          title={`点击查看 ${chip.ticker} 实时走势与深度分析`}
                          className="px-2.5 py-1.5 rounded-md bg-neutral-900/90 hover:bg-rose-950/80 border border-rose-700/50 hover:border-rose-400 text-xs font-mono font-semibold text-rose-300 flex items-center gap-1.5 transition-all cursor-pointer shadow-sm group hover:scale-[1.03]"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.8)]"></span>
                          <span>{chip.ticker}</span>
                          <span className="text-[11px] text-neutral-400 font-normal">
                            {chip.name !== chip.ticker ? chip.name : ""}
                          </span>
                          {chip.changePct && (
                            <span className="text-[10px] text-rose-400 font-bold ml-0.5">
                              {chip.changePct}
                            </span>
                          )}
                          <ArrowDownRight className="w-3 h-3 text-rose-500 opacity-60 group-hover:opacity-100 transition-opacity" />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 pt-2 border-t border-rose-900/40">
                      <button
                        onClick={() => onSelectStock("QQQ")}
                        className="px-2.5 py-1 rounded-md bg-neutral-900/80 border border-rose-800/40 text-xs font-mono text-rose-300 hover:border-rose-500 cursor-pointer flex items-center gap-1"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                        <span>QQQ 纳斯达克 ETF</span>
                      </button>
                    </div>
                  )}
                </div>

                <div className="mt-2 text-[10px] font-mono text-rose-400/70 flex items-center justify-end gap-1">
                  <span>点击 Chip 联动个股量化分析 ↗</span>
                </div>
              </div>

            </div>
          </div>

          {/* 顺序演进推演链条（若存在特定 transmissionSteps） */}
          {currentChain.transmissionSteps && currentChain.transmissionSteps.length > 0 && (
            <div className="mt-5 p-3.5 rounded-xl bg-neutral-950/80 border border-neutral-800/80">
              <div className="text-xs font-mono text-[#d4af37] font-semibold mb-2.5 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-[#d4af37]" />
                <span>详细推演流水线 (Sequential Execution Path):</span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs font-sans">
                {currentChain.transmissionSteps.map((step, idx) => (
                  <React.Fragment key={idx}>
                    <span className="px-3 py-1 rounded-lg bg-neutral-900 border border-neutral-750 text-neutral-200 font-medium shadow-sm">
                      {step}
                    </span>
                    {idx < (currentChain.transmissionSteps?.length || 0) - 1 && (
                      <ArrowRight className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. CARDS VIEW 视图模式 */}
      {viewMode === "cards" && (
        <div className="space-y-3.5">
          {transmissions.map((chain, index) => {
            const isExpanded =
              expandedCardId === chain.id || (expandedCardId === null && index === 0);
            const driverText =
              chain.driver || chain.drivingEvent || chain.title || "因果传导事件";
            const mechanismText = chain.mechanism || chain.summary || "";
            const bChips = extractAssetChips(
              chain.beneficiaries,
              chain.beneficiary,
              "beneficiary"
            );
            const vChips = extractAssetChips(
              chain.impactedAssets,
              chain.victim,
              "victim"
            );

            return (
              <div
                key={chain.id || index}
                className={`bg-neutral-900/70 backdrop-blur border rounded-xl transition-all overflow-hidden border-t border-t-white/10 ${
                  isExpanded
                    ? "border-amber-500/50 shadow-xl"
                    : "border-neutral-800 hover:border-neutral-700"
                }`}
              >
                <div
                  onClick={() =>
                    setExpandedCardId(isExpanded ? "NONE" : chain.id || `${index}`)
                  }
                  className="p-4 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-neutral-900/90 hover:bg-neutral-850 transition-colors select-none"
                >
                  <div className="flex items-start sm:items-center gap-3">
                    <span className="w-6 h-6 rounded-md bg-neutral-800 border border-neutral-700 text-[#d4af37] text-xs font-mono font-bold flex items-center justify-center shrink-0">
                      {index + 1}
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <span>{driverText}</span>
                      </h3>
                      <p className="text-xs text-neutral-400 font-sans mt-0.5 line-clamp-1">
                        <span className="text-neutral-500 font-mono">[机制]: </span>
                        {mechanismText}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <span className="text-[11px] font-mono text-neutral-500 hidden sm:inline">
                      {isExpanded ? "折叠详情" : "展开推演"}
                    </span>
                    <div className="text-neutral-400">
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-[#d4af37]" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="p-4 sm:p-5 border-t border-neutral-800/80 space-y-4 bg-neutral-950/60">
                    <div className="p-3.5 bg-neutral-900/60 border border-neutral-800 rounded-lg">
                      <div className="text-xs font-mono text-sky-400 font-bold mb-1.5 flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-sky-400" />
                        <span>定价传导机理:</span>
                      </div>
                      <p className="text-xs text-neutral-300 leading-relaxed font-sans">
                        {mechanismText}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs">
                      {/* 受益卡 */}
                      <div className="p-3.5 bg-emerald-950/30 border border-emerald-800/40 rounded-xl space-y-2">
                        <div className="text-emerald-400 font-bold flex items-center gap-1.5 font-mono">
                          <TrendingUp className="w-3.5 h-3.5" />
                          <span>多头确定性受益方向:</span>
                        </div>
                        <p className="text-neutral-300 font-sans leading-relaxed">
                          {chain.beneficiary || "--"}
                        </p>
                        {bChips.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-2 border-t border-emerald-900/40">
                            {bChips.map((c) => (
                              <button
                                key={c.ticker}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onSelectStock(c.ticker);
                                }}
                                className="px-2 py-0.5 rounded bg-neutral-900 border border-emerald-700/60 text-emerald-300 font-mono text-[11px] font-semibold hover:border-emerald-400 cursor-pointer flex items-center gap-1"
                              >
                                <span>{c.ticker}</span>
                                <span className="text-[10px] text-neutral-400 font-normal">
                                  {c.name !== c.ticker ? c.name : ""}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* 受损卡 */}
                      <div className="p-3.5 bg-rose-950/30 border border-rose-800/40 rounded-xl space-y-2">
                        <div className="text-rose-400 font-bold flex items-center gap-1.5 font-mono">
                          <TrendingDown className="w-3.5 h-3.5" />
                          <span>承压回撤方向:</span>
                        </div>
                        <p className="text-neutral-300 font-sans leading-relaxed">
                          {chain.victim || "--"}
                        </p>
                        {vChips.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-2 border-t border-rose-900/40">
                            {vChips.map((c) => (
                              <button
                                key={c.ticker}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onSelectStock(c.ticker);
                                }}
                                className="px-2 py-0.5 rounded bg-neutral-900 border border-rose-700/60 text-rose-300 font-mono text-[11px] font-semibold hover:border-rose-400 cursor-pointer flex items-center gap-1"
                              >
                                <span>{c.ticker}</span>
                                <span className="text-[10px] text-neutral-400 font-normal">
                                  {c.name !== c.ticker ? c.name : ""}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
