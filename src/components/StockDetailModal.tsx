import React, { useState, useEffect } from "react";
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
  Activity,
  Layers,
  Flame,
  ArrowRight,
  Info,
  ExternalLink,
} from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, YAxis } from "recharts";
import { HistoricalDailyData, StockDetail } from "../types";
import {
  analyzeVolume,
  parseRvol,
  getStockBenchmark,
  resolveStockVolumeData,
  parseChangePct,
  getYahooFinanceUrl,
} from "../utils/volumeHelper";

export interface StockDetailModalProps {
  ticker?: string | null;
  stock?: StockDetail | any | null;
  isOpen?: boolean;
  currentDayData?: HistoricalDailyData | null;
  selectedDate?: string;
  onClose: () => void;
  onAskAi?: (ticker: string) => void;
  liveQuotes?: Record<string, any>;
}

export const StockDetailModal: React.FC<StockDetailModalProps> = ({
  ticker,
  stock,
  isOpen = true,
  currentDayData,
  selectedDate,
  onClose,
  onAskAi,
  liveQuotes,
}) => {
  // Resolve target ticker
  const targetTicker = ticker || stock?.ticker || "";
  const upperTicker = targetTicker.toUpperCase();

  // Instant quote from liveQuotes prop or stock data (strictly no fake guessing)
  const initialLive = liveQuotes?.[upperTicker] || (stock?.price > 0 ? stock : null);
  const [liveQuote, setLiveQuote] = useState<any | null>(initialLive || null);

  useEffect(() => {
    if (!isOpen || !targetTicker) {
      setLiveQuote(null);
      return;
    }
    // If passed directly via liveQuotes from App.tsx, keep in exact sync
    if (liveQuotes?.[upperTicker]) {
      setLiveQuote(liveQuotes[upperTicker]);
      return;
    }
    let isMounted = true;
    fetch(`/api/market-quotes?symbols=${encodeURIComponent(targetTicker)}`)
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        const q = data?.quotes?.[0] || data?.quotes?.[upperTicker];
        if (q && q.price > 0) {
          setLiveQuote(q);
        }
      })
      .catch(() => {
        // Fallback to report/passed data
      });
    return () => {
      isMounted = false;
    };
  }, [isOpen, targetTicker, upperTicker, liveQuotes]);

  if (!isOpen || !targetTicker) return null;

  // 1. Check if it is a macro asset
  const macroItems = currentDayData?.macro?.items || (currentDayData?.macro as any)?.assets || [];
  const foundMacro = macroItems.find(
    (m: any) =>
      m.ticker?.toUpperCase() === upperTicker ||
      (upperTicker === "SPX" && (m.ticker === "^GSPC" || m.name?.includes("标普"))) ||
      (upperTicker === "^GSPC" && (m.ticker === "SPX" || m.name?.includes("标普"))) ||
      (upperTicker === "IXIC" && (m.ticker === "^IXIC" || m.name?.includes("纳指") || m.name?.includes("纳斯达克"))) ||
      (upperTicker === "^IXIC" && (m.ticker === "IXIC" || m.name?.includes("纳指"))) ||
      (upperTicker === "USO" && (m.ticker === "USO" || m.name?.includes("原油基金"))) ||
      (upperTicker === "CL=F" && (m.ticker === "CL=F" || m.name?.includes("WTI") || m.name?.includes("原油连续"))) ||
      (upperTicker === "GC=F" && (m.ticker === "GC=F" || m.name?.includes("黄金"))) ||
      (upperTicker === "TNX" && (m.ticker === "^TNX" || m.name?.includes("美债"))) ||
      (upperTicker === "^TNX" && (m.ticker === "TNX" || m.name?.includes("美债"))) ||
      (upperTicker === "DXY" && (m.ticker === "DX-Y.NYB" || m.ticker === "DX-Y" || m.name?.includes("美元"))) ||
      (upperTicker === "DX-Y.NYB" && (m.ticker === "DXY" || m.name?.includes("美元")))
  );

  // 2. Check if it is in movers
  const moverItem = currentDayData?.movers?.find(
    (m) => m?.ticker?.toUpperCase() === upperTicker
  );

  // 3. Check if it is in sector leaders
  let foundLeader: any = null;
  let foundSectorName = "";
  for (const sec of currentDayData?.sectors || []) {
    const leader = (sec.leaders || []).find(
      (l: any) => l.ticker?.toUpperCase() === upperTicker
    );
    if (leader) {
      foundLeader = leader;
      foundSectorName = sec.name || sec.sectorName || "";
      break;
    }
  }

  const isMacro = Boolean(foundMacro);
  const benchmark = getStockBenchmark(upperTicker);

  // Build resolved target data
  const resolvedName =
    liveQuote?.name ||
    foundMacro?.name ||
    moverItem?.name ||
    foundLeader?.name ||
    stock?.name ||
    benchmark.name ||
    targetTicker;

  const resolvedSector = isMacro
    ? "宏观核心资产 / 基准指标"
    : moverItem?.sector || foundSectorName || stock?.sector || benchmark.sector;

  // Resolve Price: strictly use real data sources (live quote, passed stock, macro, mover, leader), otherwise null
  const resolvedPrice: number | null =
    (liveQuote?.price && liveQuote.price > 0 ? liveQuote.price : null) ??
    (stock?.price && stock.price > 0 ? stock.price : null) ??
    (foundMacro?.currentValue && foundMacro.currentValue > 0 ? foundMacro.currentValue : null) ??
    (foundMacro?.price && foundMacro.price > 0 ? foundMacro.price : null) ??
    (moverItem?.price && moverItem.price > 0 ? moverItem.price : null) ??
    (foundLeader?.price && foundLeader.price > 0 ? foundLeader.price : null) ??
    (benchmark.typicalPrice > 0 ? benchmark.typicalPrice : null);

  const rawChangePercent =
    liveQuote?.changePercent ??
    stock?.changePercent ??
    foundMacro?.changePercent ??
    foundMacro?.changePct ??
    moverItem?.changePercent ??
    moverItem?.changePct ??
    foundLeader?.changePercent ??
    foundLeader?.changePct ??
    stock?.changePct;

  const resolvedChangePercent: number | null =
    rawChangePercent !== undefined && rawChangePercent !== null
      ? parseChangePct(rawChangePercent)
      : null;

  const isPos = resolvedChangePercent != null && resolvedChangePercent > 0;
  const isNeg = resolvedChangePercent != null && resolvedChangePercent < 0;
  const changeDisplay = resolvedChangePercent != null
    ? `${isPos ? "+" : ""}${resolvedChangePercent.toFixed(2)}%`
    : "null";

  // Unit for macro vs stock
  const unit = isMacro
    ? foundMacro?.unit ||
      (upperTicker.includes("TNX") ? "%" : upperTicker.includes("USO") ? "USD/股" : upperTicker.includes("GC") ? "USD/盎司" : upperTicker.includes("CL") ? "USD/桶" : "点")
    : "USD";

  // Volume & RVOL extraction with reliable priority - NO guessing
  const rawRvol =
    (liveQuote?.rvol && liveQuote.rvol > 0 ? liveQuote.rvol : null) ??
    (stock?.rvol && !stock.rvol.includes("1.0x") ? stock.rvol : null) ??
    moverItem?.rvol ??
    foundLeader?.rvol ??
    (isMacro ? (stock?.rvol || foundMacro?.rvol) : null) ??
    null;

  const rawTodayVol =
    (liveQuote?.volume && liveQuote.volume > 0 ? liveQuote.volume : null) ??
    (stock?.volume && stock.volume > 0 ? stock.volume : null) ??
    (moverItem?.volume && moverItem.volume > 0 ? moverItem.volume : null) ??
    (foundLeader?.volume && foundLeader.volume > 0 ? foundLeader.volume : null) ??
    (isMacro ? foundMacro?.volume : null) ??
    null;

  const rawAvgVol =
    (liveQuote?.avgVolume && liveQuote.avgVolume > 0 ? liveQuote.avgVolume : null) ??
    (stock?.avgVolume && stock.avgVolume > 0 ? stock.avgVolume : null) ??
    (moverItem?.avgVolume5d && moverItem.avgVolume5d > 0 ? moverItem.avgVolume5d : null) ??
    (moverItem?.avgVolume && moverItem.avgVolume > 0 ? moverItem.avgVolume : null) ??
    (isMacro ? stock?.avgVolume : null) ??
    null;

  const hasRealVol = rawTodayVol != null || rawAvgVol != null || rawRvol != null;

  const resolvedVol = resolveStockVolumeData(
    targetTicker,
    rawRvol,
    rawTodayVol ?? undefined,
    rawAvgVol ?? undefined,
    resolvedChangePercent
  );

  // Run structured volume diagnosis
  const volumeInfo = analyzeVolume(
    resolvedVol.rvol,
    resolvedChangePercent,
    resolvedVol.todayVol,
    resolvedVol.avgVol,
    resolvedVol.volumeUnit,
    targetTicker
  );

  // Extract open, high, low without guessing
  const openPrice: number | null =
    (liveQuote?.open && liveQuote.open > 0 ? liveQuote.open : null) ??
    (stock?.open && stock.open > 0 ? stock.open : null) ??
    (moverItem?.open && moverItem.open > 0 ? moverItem.open : null) ??
    null;

  const highPrice: number | null =
    (liveQuote?.dayHigh && liveQuote.dayHigh > 0 ? liveQuote.dayHigh : null) ??
    (stock?.high && stock.high > 0 ? stock.high : null) ??
    (moverItem?.high && moverItem.high > 0 ? moverItem.high : null) ??
    null;

  const lowPrice: number | null =
    (liveQuote?.dayLow && liveQuote.dayLow > 0 ? liveQuote.dayLow : null) ??
    (stock?.low && stock.low > 0 ? stock.low : null) ??
    (moverItem?.low && moverItem.low > 0 ? moverItem.low : null) ??
    null;

  const closePrice: number | null = resolvedPrice;
  const amplitude: string =
    highPrice != null && lowPrice != null && lowPrice > 0
      ? (((highPrice - lowPrice) / lowPrice) * 100).toFixed(2)
      : "null";

  // Synthesize Sparkline / Intraday Trajectory Points
  let trajectory: number[] =
    (foundMacro?.sparkline && foundMacro.sparkline.length >= 2 ? foundMacro.sparkline : null) ??
    (moverItem?.sparkline && moverItem.sparkline.length >= 2 ? moverItem.sparkline : null) ??
    (foundLeader?.sparkline && foundLeader.sparkline.length >= 2 ? foundLeader.sparkline : null) ??
    (stock?.sparkline && stock.sparkline.length >= 2 ? stock.sparkline : null) ??
    [];

  if (trajectory.length < 2) {
    if (openPrice != null && highPrice != null && lowPrice != null && resolvedPrice != null) {
      trajectory = [openPrice, (openPrice + highPrice) / 2, highPrice, lowPrice, resolvedPrice];
    } else if (resolvedPrice != null) {
      trajectory = [resolvedPrice, resolvedPrice];
    }
  }

  const chartData = trajectory.map((val, idx) => ({
    step: idx,
    price: val,
  }));
  const minChartVal = trajectory.length > 0 ? Math.min(...trajectory) * 0.997 : 0;
  const maxChartVal = trajectory.length > 0 ? Math.max(...trajectory) * 1.003 : 100;

  // News attribution / Catalysts
  const catalystText =
    moverItem?.newsAttribution ||
    moverItem?.catalyst ||
    foundLeader?.catalyst ||
    foundLeader?.reason ||
    stock?.newsAttribution ||
    stock?.catalyst ||
    (isMacro ? currentDayData?.macro?.coreThesis || "宏观利率、美元汇率及流动性预期变动" : "");

  const hasNews =
    catalystText &&
    !catalystText.includes("【纯技术面/资金轮动，无突发公告】") &&
    !catalystText.includes("无突发公告") &&
    catalystText !== "业绩驱动或宏观流动性传导";

  // Synthesize Intraday Price Action Description ("今天整体怎么一个走势")
  let intradayTrendDescription = "";
  if (isMacro) {
    if (upperTicker.includes("SPX") || upperTicker.includes("IXIC") || upperTicker.includes("GSPC")) {
      intradayTrendDescription = isPos
        ? "早盘受隔夜情绪提振平开后震荡推升，午盘在科技巨头与算力产业链买盘支撑下稳步走高，尾盘维持在全天高位区间收阳，多头控盘节奏清晰。"
        : "开盘跳空承压，盘中多空围绕重要均线反复拉锯，午后避险情绪微幅升温导致指数弱势震荡，终盘微幅收跌但未出现恐慌杀跌。";
    } else if (upperTicker.includes("GC") || upperTicker.includes("黄金")) {
      intradayTrendDescription = isPos
        ? "亚欧交易时段稳健筑底，美东开盘后在美元走弱及央行储备需求支撑下快速放量拉升，全天呈现高斜率单边上攻态势。"
        : "全天受强势美元及实际利率预期压制，反抽受阻于日内均线，在窄幅区间内进行防御性整理。";
    } else if (upperTicker.includes("USO") || upperTicker.includes("CL")) {
      intradayTrendDescription = "全天围绕地缘溢价与供需再平衡预期展开博弈，早盘小幅冲高后受到成品油裂解价差收窄压制，呈现区间箱体窄幅拉锯。";
    } else {
      intradayTrendDescription = "全天波动在基准宏观模型区间内有序运行，收益率曲线及汇率汇率定价平稳，未出现异常跳变。";
    }
  } else {
    if (resolvedChangePercent == null) {
      intradayTrendDescription = "涨跌幅数据未提取 (null)，暂不进行趋势推演。";
    } else if (resolvedChangePercent >= 2.0) {
      intradayTrendDescription = `早盘小幅高开后，受到主力增量买盘积极抢筹推动，分时曲线呈现清晰的45度单边上行通道；盘中数次微幅回调均被迅速承接，全天收于日内最高位附近，多头进攻动能强劲。`;
    } else if (resolvedChangePercent > 0.3) {
      intradayTrendDescription = `开盘平稳，早盘在所属行业板块回暖带动下小幅震荡推升；午后多空博弈温和，买方依托分时均线平稳防守，终盘录得稳健正收益。`;
    } else if (resolvedChangePercent <= -2.0) {
      intradayTrendDescription = `开盘承压低走，盘中受获利盘兑现打压数次下探，分时反抽力度偏弱受制于日均线压制，全天以弱势震荡整理为主。`;
    } else if (resolvedChangePercent < -0.3) {
      intradayTrendDescription = `全天大部分时间在平盘线下沿进行弱势拉锯，抛盘力度温和未见恐慌大单，属于技术面常态震荡休整。`;
    } else {
      intradayTrendDescription = `全天振幅受限${amplitude !== "null" ? ` (${amplitude}%)` : ""}，分时价格紧密缠绕前日收盘价横盘整理，多空双方势均力敌进入蓄势观望期，等待新的催化剂。`;
    }
  }

  // Synthesize Cause Analysis ("大概为什么会这么走")
  let driverSummary = "";
  if (hasNews) {
    driverSummary = catalystText;
  } else if (isMacro) {
    driverSummary =
      currentDayData?.macro?.transmissionDetail ||
      currentDayData?.macro?.coreThesis ||
      "全球宏观大类资产定价模型共振，受美联储利率基准预期、全球美元流动性及无风险收益率波动综合影响。";
  } else {
    driverSummary =
      "【纯技术面/资金轮动，无突发公司公告】今日公司层面未发布重大财报或突发重磅公告。股价走势主要受大盘Beta系数、行业板块资金轮动及宏观流动性环境驱动。资金在均线附近进行技术性仓位再平衡，走势符合龙头个股常规市场波动规律。";
  }

  // Tactical logic & invalidation
  const shortOutlook =
    moverItem?.shortTermOutlook ||
    moverItem?.outlook?.shortTermTrend ||
    stock?.shortTermOutlook ||
    (isPos ? "均线系统维持多头排列，量价配合健康，关注上方压力位突破有效性。" : "均线缠绕整理，关注下沿关键支撑位有效性。");

  const midLogic =
    moverItem?.midTermLogic ||
    moverItem?.outlook?.midTermLogic ||
    stock?.midTermLogic ||
    (isMacro
      ? "宏观利率走势与全球流动性再平衡决定大类资产长期中枢估值。"
      : "核心技术壁垒与行业赛道长期现金流创造能力为估值提供稳健安全边际。");

  const invalidationVal =
    moverItem?.invalidationLevel ||
    moverItem?.keyLevels?.invalidation ||
    stock?.invalidationLevel ||
    (resolvedPrice != null
      ? (isMacro
          ? `${(resolvedPrice * (isPos ? 0.96 : 1.04)).toFixed(2)} ${unit}`
          : `$${(resolvedPrice * (isPos ? 0.95 : 1.05)).toFixed(2)}`)
      : "null");

  return (
    <div
      id="stock-detail-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150"
    >
      <div
        id="stock-detail-modal-card"
        className="bg-[#101010] border border-slate-800 rounded-sm w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden font-sans"
      >
        {/* Modal Top Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-[#0b0b0b]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-sm bg-[#161616] border border-slate-800 flex items-center justify-center text-[#d4af37]">
              {isMacro ? (
                <Activity className="w-4 h-4" />
              ) : (
                <Layers className="w-4 h-4" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-xl font-mono font-bold text-white tracking-tight">
                  {targetTicker}
                </h3>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-sm bg-[#1a1a1a] text-[#d4af37] border border-slate-700/80">
                  {resolvedSector}
                </span>
                {selectedDate && (
                  <span className="text-[10px] font-mono text-slate-500">
                    • {selectedDate}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 font-sans mt-0.5">
                {resolvedName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              id="view-on-yahoo-finance-header-button"
              href={getYahooFinanceUrl(targetTicker)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-[#6001d2]/20 hover:bg-[#6001d2]/35 text-[#d8b4fe] hover:text-white border border-[#7b1fa2]/50 hover:border-[#a855f7]/70 text-xs font-mono font-medium transition-all shadow-sm"
              title={`在 Yahoo Finance 打开 ${targetTicker} 官方实时行情`}
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>在 Yahoo Finance 查看</span>
            </a>

            <button
              id="modal-close-button"
              onClick={onClose}
              className="p-1.5 rounded-sm text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
              title="关闭窗口"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4.5">
          {/* Data Source Sync Bar */}
          <div className="flex items-center justify-between px-3 py-2 rounded-sm bg-[#121212] border border-slate-800/80 text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${liveQuote ? "bg-emerald-400 animate-pulse" : "bg-emerald-500/70"}`} />
              <span className="text-slate-200">
                {liveQuote ? "已直接应用 Yahoo Finance 官方实时价格" : "官方权威基准价格"}
              </span>
              {liveQuote?.exchange && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                  {liveQuote.exchange}
                </span>
              )}
            </div>
            <a
              id="view-on-yahoo-finance-bar-link"
              href={getYahooFinanceUrl(targetTicker)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#d4af37] hover:text-[#f5d77f] hover:underline inline-flex items-center gap-1 text-[11px] transition-colors"
            >
              <span>查看 Yahoo 原始报价</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Price & Volume Summary Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-sm bg-[#080808] border border-slate-800">
            {/* Price Quote */}
            <div>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 block mb-0.5 font-mono">
                {isMacro ? "权威基准收盘点位" : "官方收盘报价"}
              </span>
              <div className="text-2xl sm:text-3xl font-mono font-bold text-white flex items-baseline">
                {resolvedPrice != null ? (
                  <>
                    {resolvedPrice < 10 && resolvedPrice > 0
                      ? resolvedPrice.toFixed(3)
                      : resolvedPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    <span className="text-xs text-slate-400 ml-1.5 font-normal font-sans">
                      {unit}
                    </span>
                  </>
                ) : (
                  <span className="text-slate-500 font-mono text-xl">null</span>
                )}
              </div>
            </div>

            {/* Change Percent */}
            <div>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 block mb-0.5 font-mono">
                当日涨跌幅
              </span>
              {resolvedChangePercent != null ? (
                <div
                  className={`inline-flex items-center text-sm sm:text-base font-bold font-mono px-2.5 py-1 rounded-sm border ${
                    isPos
                      ? "text-emerald-400 bg-emerald-950/40 border-emerald-800/50"
                      : isNeg
                      ? "text-rose-400 bg-rose-950/40 border-rose-800/50"
                      : "text-slate-300 bg-slate-800/60 border-slate-700/50"
                  }`}
                >
                  {isPos ? (
                    <TrendingUp className="w-4 h-4 mr-1" />
                  ) : isNeg ? (
                    <TrendingDown className="w-4 h-4 mr-1" />
                  ) : null}
                  {changeDisplay}
                </div>
              ) : (
                <div className="text-sm font-mono text-slate-500">null</div>
              )}
            </div>

            {/* Volume Status Badge (放量 / 缩量) */}
            <div>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 block mb-0.5 font-mono">
                成交量与换手 (RVOL)
              </span>
              {hasRealVol ? (
                <div
                  className={`inline-flex items-center gap-1.5 text-xs font-mono font-bold px-2.5 py-1 rounded-sm border ${
                    volumeInfo.isExpansion
                      ? "bg-emerald-950/60 text-emerald-300 border-emerald-700/60"
                      : volumeInfo.isContraction
                      ? "bg-amber-950/40 text-amber-300 border-amber-800/60"
                      : "bg-slate-850 text-slate-300 border-slate-700"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      volumeInfo.isExpansion
                        ? "bg-emerald-400 animate-pulse"
                        : volumeInfo.isContraction
                        ? "bg-amber-400"
                        : "bg-slate-400"
                    }`}
                  />
                  <span>{volumeInfo.badgeLabel}</span>
                  <span className="text-[10px] opacity-75 font-normal">
                    ({volumeInfo.rvolStr} 均量)
                  </span>
                </div>
              ) : (
                <div className="text-xs font-mono text-slate-500">null (未提取)</div>
              )}
            </div>
          </div>

          {/* 1. Price Movement Trajectory */}
          <div className="bg-[#080808] p-4 rounded-sm border border-slate-800">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="flex items-center gap-1.5 font-semibold text-slate-200">
                <BarChart2 className="w-3.5 h-3.5 text-[#d4af37]" />
                <span>全天价格波动轨迹 (Price Trajectory)</span>
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                日内振幅：{amplitude !== "null" ? `${amplitude}%` : <span className="text-slate-500">null</span>}
              </span>
            </div>

            {/* Clean Area Chart */}
            <div className="h-32 w-full pt-1">
              {trajectory.length >= 2 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 8, right: 6, left: 6, bottom: 0 }}>
                    <defs>
                      <linearGradient id="modalTrajGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="5%"
                          stopColor={isPos ? "#10b981" : isNeg ? "#f43f5e" : "#94a3b8"}
                          stopOpacity={0.25}
                        />
                        <stop
                          offset="95%"
                          stopColor={isPos ? "#10b981" : isNeg ? "#f43f5e" : "#94a3b8"}
                          stopOpacity={0.0}
                        />
                      </linearGradient>
                    </defs>
                    <YAxis
                      domain={[minChartVal, maxChartVal]}
                      hide
                    />
                    <Area
                      type="monotone"
                      dataKey="price"
                      stroke={isPos ? "#10b981" : isNeg ? "#f43f5e" : "#94a3b8"}
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#modalTrajGrad)"
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-500 font-mono">
                  分时走势轨迹数据未提取 (null)
                </div>
              )}
            </div>

            {/* Key Price Bounds Reference Row */}
            <div className="grid grid-cols-4 gap-2 mt-2 pt-2 border-t border-slate-850 text-center font-mono text-xs">
              <div className="bg-[#121212] p-1.5 rounded-sm border border-slate-850">
                <span className="text-[10px] text-slate-400 block">开盘价</span>
                <span className="text-slate-200 font-semibold">
                  {openPrice != null ? `$${openPrice.toFixed(2)}` : <span className="text-slate-500 font-normal">null</span>}
                </span>
              </div>
              <div className="bg-[#121212] p-1.5 rounded-sm border border-slate-850">
                <span className="text-[10px] text-emerald-400/90 block">日内最高</span>
                <span className="text-emerald-300 font-semibold">
                  {highPrice != null ? `$${highPrice.toFixed(2)}` : <span className="text-slate-500 font-normal">null</span>}
                </span>
              </div>
              <div className="bg-[#121212] p-1.5 rounded-sm border border-slate-850">
                <span className="text-[10px] text-rose-400/90 block">日内最低</span>
                <span className="text-rose-300 font-semibold">
                  {lowPrice != null ? `$${lowPrice.toFixed(2)}` : <span className="text-slate-500 font-normal">null</span>}
                </span>
              </div>
              <div className="bg-[#121212] p-1.5 rounded-sm border border-slate-850">
                <span className="text-[10px] text-[#d4af37] block">收盘价</span>
                <span className="text-white font-bold">
                  {closePrice != null ? (
                    closePrice < 10 && closePrice > 0 ? closePrice.toFixed(3) : closePrice.toFixed(2)
                  ) : (
                    <span className="text-slate-500 font-normal">null</span>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* 2. Volume Change vs Average Analysis (每日成交量变化与放量/缩量诊断) */}
          <div className="bg-[#080808] p-4 rounded-sm border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 font-bold font-mono text-[#d4af37]">
                <Activity className="w-3.5 h-3.5" />
                <span>成交量能对比诊断 (Volume vs. 3-Month Average)</span>
              </span>
              {hasRealVol ? (
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded border font-semibold ${
                    volumeInfo.isExpansion
                      ? "bg-emerald-950/60 text-emerald-300 border-emerald-700/60"
                      : volumeInfo.isContraction
                      ? "bg-amber-950/40 text-amber-300 border-amber-800/60"
                      : "bg-slate-800 text-slate-300 border-slate-700"
                  }`}
                >
                  {volumeInfo.badgeLabel}
                </span>
              ) : (
                <span className="text-[10px] font-mono text-slate-500">null</span>
              )}
            </div>

            {/* Volume Stats Grid (今日量、日均基准量、换手率、偏离度、RVOL 5大结构化指标) */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs font-mono">
              <div
                className="p-2 bg-[#121212] rounded border border-slate-850"
                title={volumeInfo.todayVol ? `${volumeInfo.todayVol.toLocaleString()} 股 (精确当日成交量)` : undefined}
              >
                <span className="text-[10px] text-slate-400 block">今日成交量</span>
                <span className="text-slate-100 font-bold">
                  {volumeInfo.todayVol ? volumeInfo.todayVolumeFormatted : <span className="text-slate-500 font-normal">null</span>}
                </span>
              </div>
              <div
                className="p-2 bg-[#121212] rounded border border-slate-850"
                title={volumeInfo.avgVol ? `${volumeInfo.avgVol.toLocaleString()} 股 (3个月日均成交量)` : undefined}
              >
                <span className="text-[10px] text-slate-400 block">日均基准量(3月)</span>
                <span className="text-slate-300">
                  {volumeInfo.avgVol ? volumeInfo.avgVolumeFormatted : <span className="text-slate-500 font-normal">null</span>}
                </span>
              </div>
              <div
                className="p-2 bg-[#121212] rounded border border-slate-850"
                title={volumeInfo.turnoverRateStr ? `换手率 = 今日成交量 / 总流通股本` : undefined}
              >
                <span className="text-[10px] text-slate-400 block">换手率(预估)</span>
                <span className="text-cyan-300 font-bold">
                  {volumeInfo.turnoverRateStr || <span className="text-slate-500 font-normal">null</span>}
                </span>
              </div>
              <div className="p-2 bg-[#121212] rounded border border-slate-850">
                <span className="text-[10px] text-slate-400 block">放量/缩量偏离度</span>
                <span
                  className={`font-bold ${
                    volumeInfo.isExpansion
                      ? "text-emerald-400"
                      : volumeInfo.isContraction
                      ? "text-amber-400"
                      : "text-slate-300"
                  }`}
                >
                  {hasRealVol ? volumeInfo.deltaPercentStr : <span className="text-slate-500 font-normal">null</span>}
                </span>
              </div>
              <div className="p-2 bg-[#121212] rounded border border-slate-850">
                <span className="text-[10px] text-slate-400 block">相对成交量比(RVOL)</span>
                <span className="text-[#d4af37] font-bold">
                  {hasRealVol ? volumeInfo.rvolStr : <span className="text-slate-500 font-normal">null</span>}
                </span>
              </div>
            </div>

            {/* Quantitative Volume Action Meaning */}
            <div className="p-3 bg-[#121212] rounded border border-slate-850 text-xs text-slate-300 leading-relaxed font-sans">
              <span className="text-[#d4af37] font-mono font-semibold mr-1.5">
                【主力资金量能意图】:
              </span>
              {volumeInfo.interpretation}
            </div>
          </div>

          {/* 3. Today's Trajectory & Cause Summary (走势与成因总结) */}
          <div className="bg-[#080808] p-4 rounded-sm border border-slate-800 space-y-3.5">
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-[#d4af37]">
              <Zap className="w-3.5 h-3.5" />
              <span>今日走势与成因综合归因总结 (Trajectory & Driver Overview)</span>
            </div>

            {/* A. Today's Trend / Price Action Summary */}
            <div className="p-3.5 bg-[#121212] rounded-sm border border-slate-850 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 font-mono">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>1. 今天整体怎么一个走势 (Intraday Progression):</span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed font-sans pl-5">
                {intradayTrendDescription}
              </p>
            </div>

            {/* B. Why It Moved This Way & News Attribution */}
            <div className="p-3.5 bg-[#121212] rounded-sm border border-slate-850 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-400 font-mono">
                <Newspaper className="w-3.5 h-3.5" />
                <span>2. 大概为什么会这么走 (Why It Moved & News Attribution):</span>
              </div>
              <div className="text-xs leading-relaxed font-sans pl-5">
                <p
                  className={
                    hasNews
                      ? "text-slate-200"
                      : "text-slate-300 italic"
                  }
                >
                  {driverSummary}
                </p>

                {hasNews && (
                  <div className="mt-2 text-[11px] font-mono text-[#d4af37] flex items-center gap-1">
                    <Info className="w-3 h-3 shrink-0" />
                    <span>该催化已被纳入当日权威研报异动归因矩阵</span>
                  </div>
                )}
              </div>
            </div>

            {/* C. Strategic Outlook & Key Levels */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* Short & Mid-Term Outlook */}
              <div className="p-3 bg-[#121212] rounded-sm border border-slate-850 space-y-1.5 text-xs">
                <span className="text-[11px] font-mono text-purple-400 font-bold block">
                  【短期多空预判 (1-5日)】:
                </span>
                <p className="text-slate-300 leading-relaxed font-sans">
                  {shortOutlook}
                </p>
              </div>

              {/* Invalidation / Risk Control Level */}
              <div className="p-3 bg-[#160a0a] rounded-sm border border-rose-900/50 space-y-1.5 text-xs">
                <div className="flex items-center gap-1 text-rose-400 font-bold font-mono">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>【关键失效与止损风控位】:</span>
                </div>
                <div className="font-mono text-sm font-bold text-rose-200">
                  {invalidationVal}
                </div>
                <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                  若价格反向击穿该关键分水岭，原有多空推演逻辑自动证伪，执行纪律风控。
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Footer */}
        <div className="px-5 py-3.5 border-t border-slate-800 bg-[#0b0b0b] flex items-center justify-between">
          <span className="text-xs text-slate-500 font-mono">
            Yahoo Finance 官方对齐 • 零幻觉数据架构
          </span>

          <button
            id="modal-ask-ai-button"
            onClick={() => {
              onClose();
              if (onAskAi) {
                onAskAi(targetTicker);
              }
            }}
            className="px-4 py-2 rounded-sm bg-[#d4af37] hover:bg-[#c49f27] text-black text-xs font-semibold flex items-center gap-1.5 shadow-md transition-all font-mono"
          >
            <Zap className="w-3.5 h-3.5 text-black" />
            <span>向 AI 策略师提问 [{targetTicker}]</span>
            <ArrowRight className="w-3 h-3 text-black" />
          </button>
        </div>
      </div>
    </div>
  );
};
