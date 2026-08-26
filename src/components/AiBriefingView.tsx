import React, { useState } from "react";
import {
  Sparkles,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Download,
  Volume2,
  VolumeX,
  ShieldAlert,
  Compass,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Layers,
  Zap,
  CheckCircle2,
} from "lucide-react";
import { DailyAiReport } from "../types";

interface AiBriefingViewProps {
  report: DailyAiReport;
  selectedDate: string;
  onAskAi: (question: string) => void;
}

export const AiBriefingView: React.FC<AiBriefingViewProps> = ({
  report,
  selectedDate,
  onAskAi,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  if (!report) return null;

  const executiveText = report.executiveSnapshot || report.executiveSummary || "";

  const handleCopyReport = () => {
    let markdown = `# 【MarketPulse AI 每日策略研报 - ${selectedDate}】
**市场情绪**: ${report.marketSentiment || "Neutral"} (情绪评分: ${report.sentimentScore || 50}/100)
**生成时间**: ${report.generatedAt || selectedDate}

## 一、核心速览 (Executive Snapshot)
${executiveText}

`;

    if (report.heavyweightInsights && report.heavyweightInsights.length > 0) {
      markdown += `## 二、重磅解读 (Heavyweight Insights)\n`;
      report.heavyweightInsights.forEach((item) => {
        markdown += `### ${item.title}\n${item.impact}\n\n`;
      });
    } else if (report.heavyDeepDive) {
      markdown += `## 二、重磅解读: ${report.heavyDeepDive.title}\n${report.heavyDeepDive.content}\n\n`;
    }

    if (report.sectorRotations) {
      markdown += `## 三、行业分类与轮动路径 (Sector Rotations)\n`;
      markdown += `- **成长科技**: ${report.sectorRotations.growth}\n`;
      markdown += `- **防御价值**: ${report.sectorRotations.defensive}\n`;
      markdown += `- **主力资金流向**: ${report.sectorRotations.capitalFlow}\n\n`;
    } else if (report.sectorClassification) {
      markdown += `## 三、行业分类提炼与轮动 (Sector Classification)\n`;
      markdown += `- **领涨主线**: ${report.sectorClassification.leadingAnalysis}\n`;
      markdown += `- **滞涨板块**: ${report.sectorClassification.laggingAnalysis}\n`;
      markdown += `- **资金轮动**: ${report.sectorClassification.rotationInsight}\n\n`;
    }

    if (report.tacticalOutlook) {
      markdown += `## 四、战术多空展望 (Tactical Outlook)\n`;
      markdown += `- **做多方向 (Bull Ideas)**: ${report.tacticalOutlook.bullIdeas}\n`;
      markdown += `- **做空/防御 (Bear Ideas)**: ${report.tacticalOutlook.bearIdeas}\n\n`;
    } else if (report.bullBearTactics) {
      markdown += `## 四、战术多空建议 (Tactical Ideas)\n`;
      markdown += `### 做多方向:\n${(report.bullBearTactics.longIdeas || []).map((i) => `- ${i}`).join("\n")}\n\n`;
      markdown += `### 防御/减仓:\n${(report.bullBearTactics.shortOrDefensiveIdeas || []).map((i) => `- ${i}`).join("\n")}\n\n`;
    }

    if (report.riskWarnings && report.riskWarnings.length > 0) {
      markdown += `## 五、风险警报 (Risk Warnings)\n${report.riskWarnings.map((w) => `- ⚠️ ${w}`).join("\n")}\n`;
    }

    navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportMarkdown = () => {
    let markdown = `# 【MarketPulse AI 每日策略研报 - ${selectedDate}】
**市场情绪**: ${report.marketSentiment || "Neutral"} (情绪评分: ${report.sentimentScore || 50}/100)
**生成时间**: ${report.generatedAt || selectedDate}

## 一、核心速览
${executiveText}

`;

    if (report.heavyweightInsights && report.heavyweightInsights.length > 0) {
      markdown += `## 二、重磅解读\n`;
      report.heavyweightInsights.forEach((item) => {
        markdown += `### ${item.title}\n${item.impact}\n\n`;
      });
    }

    if (report.sectorRotations) {
      markdown += `## 三、行业轮动\n- 成长科技: ${report.sectorRotations.growth}\n- 防御消费: ${report.sectorRotations.defensive}\n- 资金流向: ${report.sectorRotations.capitalFlow}\n\n`;
    }

    if (report.tacticalOutlook) {
      markdown += `## 四、战术多空\n- 做多方向: ${report.tacticalOutlook.bullIdeas}\n- 做空/防御: ${report.tacticalOutlook.bearIdeas}\n\n`;
    }

    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `MarketPulse-Report-${selectedDate}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleToggleSpeech = () => {
    if (!("speechSynthesis" in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const heavyweightSummary = report.heavyweightInsights?.[0]
      ? `${report.heavyweightInsights[0].title}。${report.heavyweightInsights[0].impact}`
      : report.heavyDeepDive?.content || "";

    const textToRead = `${selectedDate} 市场研报核心速览。${executiveText}。重磅解读：${heavyweightSummary}`;
    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.lang = "zh-CN";
    utterance.rate = 1.05;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  return (
    <div className="bg-[#121212] border border-slate-800 rounded-sm overflow-hidden shadow-xl">
      {/* 1. Header & Executive Summary Bar */}
      <div className="p-5 border-b border-slate-800 bg-[#0f0f0f]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-sm bg-[#1a1a1a] border border-[#d4af37]/40 flex items-center justify-center text-[#d4af37]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-serif font-bold text-white">
                  当日 AI 深度研报 (Macro & Tactical Briefing)
                </h2>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-sm bg-[#181818] text-[#d4af37] border border-slate-800">
                  {report.marketSentiment || "防御性震荡"} • {report.sentimentScore || 54}/100
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-mono">
                Generated: {report.generatedAt}
              </p>
            </div>
          </div>

          {/* Quick Utility Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleSpeech}
              title={isSpeaking ? "停止播报" : "语音播报研报"}
              className={`p-2 rounded-sm border text-xs font-mono flex items-center gap-1 transition-colors ${
                isSpeaking
                  ? "bg-[#d4af37] text-black border-[#d4af37]"
                  : "bg-[#181818] text-slate-400 border-slate-800 hover:text-white"
              }`}
            >
              {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{isSpeaking ? "停止" : "语音播报"}</span>
            </button>

            <button
              onClick={handleCopyReport}
              title="复制研报全文"
              className="px-2.5 py-1.5 rounded-sm bg-[#181818] hover:bg-[#202020] text-slate-300 border border-slate-800 text-xs font-mono flex items-center gap-1 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-[#d4af37]" />}
              <span>{copied ? "已复制" : "复制"}</span>
            </button>

            <button
              onClick={handleExportMarkdown}
              title="导出 Markdown 文件"
              className="px-2.5 py-1.5 rounded-sm bg-[#181818] hover:bg-[#202020] text-slate-300 border border-slate-800 text-xs font-mono flex items-center gap-1 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-[#d4af37]" />
              <span className="hidden sm:inline">导出 .md</span>
            </button>
          </div>
        </div>

        {/* 2-line Executive Summary (Always Visible) */}
        <div className="bg-[#0a0a0a] p-3.5 rounded-sm border border-slate-850">
          <div className="flex items-start gap-2.5">
            <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded-sm bg-[#181818] text-[#d4af37] border border-slate-800 shrink-0 mt-0.5">
              核心速览
            </span>
            <p className="text-xs text-slate-300 font-sans leading-relaxed">
              {executiveText}
            </p>
          </div>
        </div>

        {/* Expand / Collapse Button */}
        <div className="mt-3 text-center">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full py-2 px-4 rounded-sm bg-[#181818] hover:bg-[#222222] border border-slate-800 text-xs font-mono font-medium text-[#d4af37] flex items-center justify-center gap-1.5 transition-colors"
          >
            <span>{isExpanded ? "📖 收起详细研报" : "📖 点击展开完整结构化研报 (重磅解读、行业轮动、战术多空与风险警报)"}</span>
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 2. Collapsible Full Structured Report Content */}
      {isExpanded && (
        <div className="p-6 space-y-6 animate-in fade-in duration-200 divide-y divide-slate-800/80">
          
          {/* Module 1: Macro Liquidity & Transmission */}
          <div className="pt-2">
            <div className="flex items-center gap-2 mb-3">
              <Compass className="w-4 h-4 text-[#d4af37]" />
              <h3 className="text-sm font-serif font-bold text-white uppercase tracking-wide">
                一、宏观流动性与大类资产联动
              </h3>
            </div>
            <p className="text-xs text-slate-300 font-sans leading-relaxed bg-[#0a0a0a] p-4 rounded-sm border border-slate-850">
              {report.macroOverview || executiveText}
            </p>
          </div>

          {/* Module 2: Heavyweight Insights */}
          {(report.heavyweightInsights || report.heavyDeepDive) && (
            <div className="pt-6">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-4 h-4 text-[#d4af37]" />
                <h3 className="text-sm font-serif font-bold text-white uppercase tracking-wide">
                  二、重磅深度解读 (Heavyweight Insights)
                </h3>
              </div>

              {report.heavyweightInsights && report.heavyweightInsights.length > 0 ? (
                <div className="space-y-3">
                  {report.heavyweightInsights.map((insight, idx) => (
                    <div key={idx} className="bg-[#0a0a0a] p-4 rounded-sm border border-slate-850 space-y-2">
                      <div className="text-xs font-mono font-bold text-[#d4af37] flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#d4af37]"></span>
                        {insight.title}
                      </div>
                      <p className="text-xs text-slate-300 font-sans leading-relaxed">
                        {insight.impact}
                      </p>
                    </div>
                  ))}
                </div>
              ) : report.heavyDeepDive ? (
                <div className="bg-[#0a0a0a] p-4 rounded-sm border border-slate-850 space-y-3">
                  <div className="text-xs font-mono font-bold text-[#d4af37]">
                    {report.heavyDeepDive.title}
                  </div>
                  <p className="text-xs text-slate-300 font-sans leading-relaxed">
                    {report.heavyDeepDive.content}
                  </p>
                  {report.heavyDeepDive.affectedSectors && (
                    <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-slate-850">
                      <span className="text-[11px] font-mono text-slate-500">核心受波及板块:</span>
                      {report.heavyDeepDive.affectedSectors.map((sec, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] font-mono px-2 py-0.5 rounded-sm bg-[#181818] text-[#d4af37] border border-slate-800"
                        >
                          {sec}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          )}

          {/* Module 2.5: Earnings Statistics & Macro Impact (if present) */}
          {report.earningsStatisticsAndImpact && (
            <div className="pt-6">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-serif font-bold text-white uppercase tracking-wide">
                  核心龙头财报战报与宏观商业闭环 (Earnings Statistics & Macro Impact)
                </h3>
              </div>

              {/* Earnings Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                {report.earningsStatisticsAndImpact.earningsSummary.map((item, idx) => (
                  <div key={idx} className="bg-[#0a0a0a] p-3.5 rounded-sm border border-slate-850 space-y-2">
                    <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-mono font-bold text-white">{item.ticker}</span>
                        <span className="text-xs text-slate-400 font-sans">{item.name}</span>
                      </div>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-sm bg-[#161616] text-[#d4af37] border border-slate-800">
                        {item.role}
                      </span>
                    </div>

                    <div className="space-y-1 text-xs font-mono">
                      {Object.entries(item.keyMetrics).map(([k, v]) => (
                        <div key={k} className="flex items-center justify-between text-slate-300">
                          <span className="text-[10px] text-slate-500 uppercase">{k}:</span>
                          <span className="text-emerald-400 font-bold text-right ml-2 truncate">{v}</span>
                        </div>
                      ))}
                    </div>

                    <p className="text-[11px] text-slate-400 font-sans border-t border-slate-850 pt-2 leading-relaxed">
                      {item.industryProgress}
                    </p>
                  </div>
                ))}
              </div>

              {/* Macro Market Impact Breakdown */}
              <div className="bg-[#0a0a0a] p-4 rounded-sm border border-slate-850 space-y-2.5">
                <span className="text-xs font-mono font-bold text-[#d4af37] block">
                  [宏观与行业多维传导总结 (Macro Market Transmission)]:
                </span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-sans">
                  <div className="p-2.5 rounded-sm bg-[#121212] border border-slate-850 space-y-1">
                    <span className="text-[10px] font-mono text-emerald-400 block font-bold">1. 资本开支验证 (Capex Validation)</span>
                    <p className="text-slate-300 leading-relaxed text-[11px]">
                      {report.earningsStatisticsAndImpact.macroMarketImpact.capexValidation}
                    </p>
                  </div>
                  <div className="p-2.5 rounded-sm bg-[#121212] border border-slate-850 space-y-1">
                    <span className="text-[10px] font-mono text-blue-400 block font-bold">2. 折现率对冲 (Discount Rate Offset)</span>
                    <p className="text-slate-300 leading-relaxed text-[11px]">
                      {report.earningsStatisticsAndImpact.macroMarketImpact.discountRateOffset}
                    </p>
                  </div>
                  <div className="p-2.5 rounded-sm bg-[#121212] border border-slate-850 space-y-1">
                    <span className="text-[10px] font-mono text-amber-400 block font-bold">3. 资金轮动机制 (Sector Rotation)</span>
                    <p className="text-slate-300 leading-relaxed text-[11px]">
                      {report.earningsStatisticsAndImpact.macroMarketImpact.sectorRotation}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Module 3: Sector Rotations */}
          {(report.sectorRotations || report.sectorClassification) && (
            <div className="pt-6">
              <div className="flex items-center gap-2 mb-3">
                <Layers className="w-4 h-4 text-[#d4af37]" />
                <h3 className="text-sm font-serif font-bold text-white uppercase tracking-wide">
                  三、行业分类提炼与主力轮动路径 (Sector Rotations)
                </h3>
              </div>

              {report.sectorRotations ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-[#0a0a0a] p-4 rounded-sm border border-slate-850 space-y-1.5">
                      <span className="text-[11px] font-mono text-blue-400 block font-semibold">
                        [成长科技板块 (Growth)]
                      </span>
                      <p className="text-xs text-slate-300 font-sans leading-relaxed">
                        {report.sectorRotations.growth}
                      </p>
                    </div>

                    <div className="bg-[#0a0a0a] p-4 rounded-sm border border-slate-850 space-y-1.5">
                      <span className="text-[11px] font-mono text-emerald-400 block font-semibold">
                        [防御与传统消费 (Defensive)]
                      </span>
                      <p className="text-xs text-slate-300 font-sans leading-relaxed">
                        {report.sectorRotations.defensive}
                      </p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-sm bg-[#151515] border border-slate-800 text-xs text-slate-200">
                    <span className="text-[#d4af37] font-mono font-semibold block mb-1">
                      [主力资金流向机制 (Capital Flow)]:
                    </span>
                    <p className="font-sans leading-relaxed text-slate-300">
                      {report.sectorRotations.capitalFlow}
                    </p>
                  </div>
                </div>
              ) : report.sectorClassification ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-[#0a0a0a] p-4 rounded-sm border border-slate-850 space-y-1.5">
                    <span className="text-[11px] font-mono text-emerald-400 block font-semibold">
                      [领涨主线分析]
                    </span>
                    <p className="text-xs text-slate-300 font-sans leading-relaxed">
                      {report.sectorClassification.leadingAnalysis}
                    </p>
                  </div>
                  <div className="bg-[#0a0a0a] p-4 rounded-sm border border-slate-850 space-y-1.5">
                    <span className="text-[11px] font-mono text-slate-400 block font-semibold">
                      [滞涨承压板块]
                    </span>
                    <p className="text-xs text-slate-300 font-sans leading-relaxed">
                      {report.sectorClassification.laggingAnalysis}
                    </p>
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {/* Module 4: Tactical Outlook (Bull / Bear Ideas) */}
          {(report.tacticalOutlook || report.bullBearTactics) && (
            <div className="pt-6">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-[#d4af37]" />
                <h3 className="text-sm font-serif font-bold text-white uppercase tracking-wide">
                  四、战术多空展望与配置建议 (Tactical Outlook)
                </h3>
              </div>

              {report.tacticalOutlook ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-[#0a0a0a] p-4 rounded-sm border border-emerald-950/60 space-y-2">
                    <span className="text-[11px] font-mono text-emerald-400 font-bold block flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5" />
                      做多方向 (Bull Ideas)
                    </span>
                    <p className="text-xs text-slate-300 font-sans leading-relaxed">
                      {report.tacticalOutlook.bullIdeas}
                    </p>
                  </div>

                  <div className="bg-[#0a0a0a] p-4 rounded-sm border border-rose-950/60 space-y-2">
                    <span className="text-[11px] font-mono text-rose-400 font-bold block flex items-center gap-1">
                      <TrendingDown className="w-3.5 h-3.5" />
                      做空 / 防御回避 (Bear Ideas)
                    </span>
                    <p className="text-xs text-slate-300 font-sans leading-relaxed">
                      {report.tacticalOutlook.bearIdeas}
                    </p>
                  </div>
                </div>
              ) : report.bullBearTactics ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-[#0a0a0a] p-4 rounded-sm border border-emerald-950/60 space-y-2">
                    <span className="text-[11px] font-mono text-emerald-400 font-bold block">
                      ▲ 做多方向 (Long Ideas)
                    </span>
                    <ul className="space-y-1.5 text-xs text-slate-300 font-sans">
                      {(report.bullBearTactics.longIdeas || []).map((idea, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-emerald-500 font-mono mt-0.5">•</span>
                          <span>{idea}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-[#0a0a0a] p-4 rounded-sm border border-rose-950/60 space-y-2">
                    <span className="text-[11px] font-mono text-rose-400 font-bold block">
                      ▼ 防御与避险/减仓 (Defensive / Short)
                    </span>
                    <ul className="space-y-1.5 text-xs text-slate-300 font-sans">
                      {(report.bullBearTactics.shortOrDefensiveIdeas || []).map((idea, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-rose-500 font-mono mt-0.5">•</span>
                          <span>{idea}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : null}

              {report.bullBearTactics?.portfolioAllocation && (
                <div className="mt-3 p-3.5 rounded-sm bg-[#151515] border border-slate-800 text-xs text-slate-200">
                  <span className="text-[#d4af37] font-mono font-bold block mb-1">
                    [建议资产配置权重 (Target Portfolio Allocation)]
                  </span>
                  <p className="font-sans leading-relaxed text-slate-300">
                    {report.bullBearTactics.portfolioAllocation}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Module 5: Risk Warnings */}
          {report.riskWarnings && report.riskWarnings.length > 0 && (
            <div className="pt-6">
              <div className="flex items-center gap-2 mb-3">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-serif font-bold text-white uppercase tracking-wide">
                  五、尾部风险雷达与关键防守警报 (Risk Warnings)
                </h3>
              </div>
              <div className="space-y-2">
                {report.riskWarnings.map((warn, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-sm bg-[#161208] border border-amber-950/60 text-xs text-amber-200/90 font-sans flex items-start gap-2"
                  >
                    <span className="font-mono text-amber-400 font-bold">⚠️</span>
                    <span>{warn}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bottom Action: Ask AI about this report */}
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#0a0a0a] p-4 rounded-sm border border-slate-850">
            <span className="text-xs text-slate-400 font-sans">
              想对此研报中的宏观因子或个股标的做进一步推演？
            </span>
            <button
              onClick={() => onAskAi(`请深度解读 ${selectedDate} 研报中关于 [${report.heavyweightInsights?.[0]?.title || "宏观震荡"}] 的实战操作细节与多空分界位`)}
              className="px-4 py-2 rounded-sm bg-[#d4af37] hover:bg-[#c49f27] text-black text-xs font-mono font-bold flex items-center gap-1.5 transition-colors shrink-0"
            >
              <span>与 AI 策略师推演此研报</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
