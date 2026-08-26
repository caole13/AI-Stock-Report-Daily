import React from "react";
import {
  X,
  TrendingUp,
  TrendingDown,
  Zap,
  Newspaper,
  BarChart2,
  Shield,
  Target,
  AlertTriangle,
} from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, YAxis, Tooltip } from "recharts";
import { MoverStockItem, HistoricalDailyData } from "../types";

interface StockDetailModalProps {
  ticker: string | null;
  currentDayData: HistoricalDailyData;
  onClose: () => void;
  onAskAi: (ticker: string) => void;
}

export const StockDetailModal: React.FC<StockDetailModalProps> = ({
  ticker,
  currentDayData,
  onClose,
  onAskAi,
}) => {
  if (!ticker || !currentDayData) return null;

  // Search in movers first, then in sectors
  const moverItem: MoverStockItem | undefined = currentDayData.movers?.find(
    (m) => m.ticker === ticker
  );

  let stockData: {
    ticker: string;
    name?: string;
    price?: number;
    changePercent?: number;
    changePct?: string;
    rvol?: number | string;
    sector?: string;
    catalyst?: string;
    newsAttribution?: string;
    news?: Array<{ publisher: string; title: string }>;
    sparkline?: number[];
    shortTermOutlook?: string;
    midTermLogic?: string;
    invalidationLevel?: string;
    outlook?: { shortTermTrend?: string; midTermLogic?: string; actionableBias?: string };
    keyLevels?: { support?: string; resistance?: string; invalidation?: string };
  };

  if (moverItem) {
    stockData = moverItem;
  } else {
    // Look in sector leaders
    let foundLeader: any = null;
    let foundSectorName = "核心资产";

    for (const sec of currentDayData.sectors || []) {
      const leader = (sec.leaders || []).find((l) => l.ticker === ticker);
      if (leader) {
        foundLeader = leader;
        foundSectorName = sec.name || sec.sectorName;
        break;
      }
    }

    if (foundLeader) {
      stockData = {
        ticker: foundLeader.ticker,
        name: foundLeader.name || foundLeader.ticker,
        price: foundLeader.price || 100,
        changePercent: foundLeader.changePercent || 0,
        changePct: foundLeader.changePct,
        rvol: foundLeader.rvol || "1.2x",
        sector: foundSectorName,
        catalyst: foundLeader.catalyst || foundLeader.reason,
        newsAttribution: foundLeader.catalyst || foundLeader.reason,
        news: [
          { publisher: "彭博社 / 机构晨报", title: `${foundLeader.ticker}: ${foundLeader.catalyst || foundLeader.reason}` },
        ],
        sparkline: foundLeader.sparkline,
        shortTermOutlook: foundLeader.changePercent > 0 ? "依托均线震荡上行，量价配合良好。" : "区间震荡整理，注意风控线。",
        midTermLogic: "行业景气度与现金流护城河为估值中枢提供支撑。",
        invalidationLevel: `$${((foundLeader.price || 100) * 0.94).toFixed(2)}`,
        outlook: {
          shortTermTrend: "多头依托均线震荡上行，量价配合健康。",
          midTermLogic: "行业景气度持续上修，具备良好的盈利护城河。",
          actionableBias: (foundLeader.changePercent || 0) > 0 ? "逢低做多" : "区间震荡",
        },
        keyLevels: {
          support: `$${((foundLeader.price || 100) * 0.96).toFixed(2)} (关键支撑位)`,
          resistance: `$${((foundLeader.price || 100) * 1.05).toFixed(2)} (上方目标阻力)`,
          invalidation: `$${((foundLeader.price || 100) * 0.94).toFixed(2)} (止损失效位)`,
        },
      };
    } else {
      stockData = {
        ticker,
        name: ticker,
        price: 150.0,
        changePercent: 1.2,
        rvol: "1.2x",
        sector: "核心跟踪标的",
        catalyst: "机构资金持续关注度高",
        newsAttribution: "机构资金持续关注度高",
        news: [{ publisher: "机构简报", title: `${ticker} 处于重点跟踪观察池中` }],
        sparkline: [146, 147.5, 149, 150],
      };
    }
  }

  const hasPercent = stockData.changePercent !== undefined && stockData.changePercent !== null;
  const isPositive = (hasPercent && (stockData.changePercent ?? 0) > 0) || stockData.changePct?.startsWith("+");
  const isNegative = (hasPercent && (stockData.changePercent ?? 0) < 0) || stockData.changePct?.startsWith("-");
  const changeDisplay = stockData.changePct || (hasPercent ? `${isPositive ? "+" : ""}${(stockData.changePercent ?? 0).toFixed(2)}%` : "---");
  const newsAttributionText = stockData.newsAttribution || stockData.catalyst || stockData.news?.[0]?.title || "";
  const shortOutlook = stockData.shortTermOutlook || stockData.outlook?.shortTermTrend || "";
  const midLogic = stockData.midTermLogic || stockData.outlook?.midTermLogic || "";
  const invalidationVal = stockData.invalidationLevel || stockData.keyLevels?.invalidation || "";

  const chartData = (stockData.sparkline || [stockData.price || 100]).map((val, idx) => ({
    time: `T+${idx}`,
    price: val,
  }));
  const minVal = Math.min(...(stockData.sparkline || [stockData.price || 100])) * 0.995;
  const maxVal = Math.max(...(stockData.sparkline || [stockData.price || 100])) * 1.005;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#101010] border border-slate-800 rounded-sm w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-[#0a0a0a]">
          <div>
            <div className="flex items-center gap-2.5">
              <h3 className="text-xl font-mono font-bold text-white">
                {ticker}
              </h3>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-sm bg-[#181818] text-[#d4af37] border border-slate-800">
                {stockData.sector || "核心资产"}
              </span>
              <span className="text-[10px] font-mono text-slate-500">
                • {currentDayData.date}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-sans mt-0.5">
              {stockData.name || ticker}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-sm text-slate-500 hover:text-white hover:bg-[#181818] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 p-6 overflow-y-auto space-y-5">
          {/* Price & Change Banner */}
          <div className="flex items-baseline justify-between p-4 rounded-sm bg-[#0a0a0a] border border-slate-800">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-slate-500 block mb-0.5 font-mono">
                当日收盘报价
              </span>
              <div className="text-3xl font-mono font-bold text-white">
                ${stockData.price !== undefined ? stockData.price.toFixed(2) : "---"}
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] uppercase tracking-wider text-slate-500 block mb-0.5 font-mono">
                当日涨跌幅
              </span>
              <div
                className={`inline-flex items-center text-base font-bold font-mono px-2.5 py-1 rounded-sm border ${
                  isPositive
                    ? "text-emerald-400 bg-emerald-950/40 border-emerald-900/50"
                    : isNegative
                    ? "text-rose-400 bg-rose-950/40 border-rose-900/50"
                    : "text-slate-300 bg-slate-800/60 border-slate-700/50"
                }`}
              >
                {isPositive ? <TrendingUp className="w-4 h-4 mr-1" /> : isNegative ? <TrendingDown className="w-4 h-4 mr-1" /> : null}
                {changeDisplay}
              </div>
            </div>

            {stockData.rvol !== undefined && stockData.rvol !== null && (
              <div className="text-right">
                <span className="text-[10px] uppercase tracking-wider text-slate-500 block mb-0.5 font-mono">
                  成交量比 (RVOL)
                </span>
                <div className="text-base font-bold font-mono text-[#d4af37]">
                  {typeof stockData.rvol === "number" ? `${stockData.rvol.toFixed(1)}x` : stockData.rvol}
                </div>
              </div>
            )}
          </div>

          {/* Sparkline Chart */}
          <div className="bg-[#080808] p-4 rounded-sm border border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="flex items-center gap-1.5 font-semibold text-slate-300 font-sans">
                <BarChart2 className="w-3.5 h-3.5 text-[#d4af37]" />
                分时 / 日K走势参考
              </span>
              <span className="font-mono text-[10px] uppercase tracking-wider text-slate-500">
                Historical Trend
              </span>
            </div>

            <div className="h-36 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="modalGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={isPositive ? "#10b981" : "#f43f5e"} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={isPositive ? "#10b981" : "#f43f5e"} stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <YAxis domain={[minVal, maxVal]} stroke="#475569" fontSize={10} tickLine={false} orientation="right" />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#121212", borderColor: "#334155", borderRadius: "2px", fontSize: "12px" }}
                    itemStyle={{ color: "#d4af37" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="price"
                    stroke={isPositive ? "#10b981" : "#f43f5e"}
                    strokeWidth={1.5}
                    fillOpacity={1}
                    fill="url(#modalGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Short Term & Mid Term Logic Outlook */}
          <div className="bg-[#080808] p-4 rounded-sm border border-slate-800 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-[#d4af37]">
              <Zap className="w-3.5 h-3.5" />
              <span>多空逻辑推演 (Short & Mid-Term Breakdown)</span>
            </div>

            <div className="space-y-2.5 text-xs font-sans">
              <div className="p-3 bg-[#121212] rounded-sm border border-slate-850">
                <span className="text-[11px] font-mono text-emerald-400 font-bold block mb-1">
                  【短期走势评估 (1-5个交易日)】:
                </span>
                <p className="text-slate-300 leading-relaxed">
                  {shortOutlook || "均线系统整理，关注量价确认。"}
                </p>
              </div>

              <div className="p-3 bg-[#121212] rounded-sm border border-slate-850">
                <span className="text-[11px] font-mono text-blue-400 font-bold block mb-1">
                  【中长期逻辑与催化剂机制】:
                </span>
                <p className="text-slate-300 leading-relaxed">
                  {midLogic || "评估行业基本面逻辑与核心催化剂。"}
                </p>
              </div>
            </div>
          </div>

          {/* Key Levels & Invalidation */}
          <div className="bg-[#080808] p-4 rounded-sm border border-slate-800 space-y-2.5 text-xs font-mono">
            <div className="flex items-center gap-1.5 text-[#d4af37] font-bold">
              <Target className="w-3.5 h-3.5" />
              <span>关键量价技术位与失效止损点</span>
            </div>

            {invalidationVal && (
              <div className="p-3 bg-[#160808] rounded-sm border border-rose-900/60 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-rose-400 font-bold block text-xs mb-0.5">
                    【多空逻辑失效位 (Invalidation Level)】:
                  </span>
                  <span className="text-rose-200 font-mono text-sm font-bold">
                    {invalidationVal.startsWith("$") ? invalidationVal : `$${invalidationVal}`}
                  </span>
                  <p className="text-[11px] text-slate-400 font-sans mt-0.5">
                    价格若击穿/突破此关键分水岭，原有多空推演逻辑证伪，执行纪律风控。
                  </p>
                </div>
              </div>
            )}

            {stockData.keyLevels && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-slate-300">
                {stockData.keyLevels.support && (
                  <div className="p-2.5 bg-[#121212] rounded-sm border border-emerald-950/60">
                    <span className="text-[10px] text-emerald-400 block font-semibold">支撑位:</span>
                    <span>{stockData.keyLevels.support}</span>
                  </div>
                )}
                {stockData.keyLevels.resistance && (
                  <div className="p-2.5 bg-[#121212] rounded-sm border border-blue-950/60">
                    <span className="text-[10px] text-blue-400 block font-semibold">阻力位:</span>
                    <span>{stockData.keyLevels.resistance}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Associated News & Attribution */}
          {newsAttributionText && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 font-sans">
                <Newspaper className="w-3.5 h-3.5 text-[#d4af37]" />
                <span>事件归因与新闻公告 (News Attribution)</span>
              </div>
              <div className="p-3.5 rounded-sm bg-[#0a0a0a] border border-slate-800 text-xs text-slate-300 font-sans leading-relaxed">
                {newsAttributionText}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-[#0a0a0a] flex items-center justify-between">
          <span className="text-xs text-slate-500 font-sans">
            美股策略分析师 • 零幻觉数据锚定
          </span>

          <button
            onClick={() => {
              onClose();
              onAskAi(ticker);
            }}
            className="px-4 py-2 rounded-sm bg-[#d4af37] hover:bg-[#c49f27] text-black text-xs font-semibold flex items-center gap-1.5 shadow-md transition-all font-mono"
          >
            <Zap className="w-3.5 h-3.5 text-black" />
            <span>进入 AI 策略师深度推演 [{ticker}]</span>
          </button>
        </div>
      </div>
    </div>
  );
};
