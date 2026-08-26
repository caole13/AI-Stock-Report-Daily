import React, { useState } from "react";
import { X, Copy, Check, Terminal, Code2 } from "lucide-react";
import { HistoricalDailyData } from "../types";

interface PromptPayloadModalProps {
  currentDayData: HistoricalDailyData;
  isOpen: boolean;
  onClose: () => void;
}

export const PromptPayloadModal: React.FC<PromptPayloadModalProps> = ({
  currentDayData,
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);
  const [activeView, setActiveView] = useState<"payload" | "python">("payload");

  if (!isOpen || !currentDayData) return null;

  // Generate python raw data string representation
  const macroItems = (currentDayData.macro?.items || [])
    .map((m) => `- ${m.name} (${m.ticker}): 当前值 ${m.currentValue.toFixed(2)}${m.unit ? " " + m.unit : ""}, 涨跌幅: ${m.changePercent >= 0 ? "+" : ""}${m.changePercent.toFixed(2)}%`)
    .join("\n");

  const sectorItems = (currentDayData.sectors || [])
    .map((s) => {
      const leaders = (s.leaders || [])
        .map((l) => `  * ${l.ticker} (${l.name}): 现价 $${l.price.toFixed(2)}, 涨跌幅: ${l.changePercent >= 0 ? "+" : ""}${l.changePercent.toFixed(2)}%, RVOL: ${l.rvol}x [${l.reason}]`)
        .join("\n");
      return `【${s.sectorName}】 (均涨跌: ${s.avgChangePercent >= 0 ? "+" : ""}${s.avgChangePercent.toFixed(2)}%)\n${leaders}`;
    })
    .join("\n\n");

  const moverItems = (currentDayData.movers || [])
    .map((m) => `- ${m.ticker} (${m.name}): $${m.price.toFixed(2)} (${m.changePercent >= 0 ? "+" : ""}${m.changePercent.toFixed(2)}%), RVOL: ${m.rvol}x\n  异动催化: ${m.catalyst}\n  技术位: 支撑 ${m.keyLevels?.support || "N/A"} | 阻力 ${m.keyLevels?.resistance || "N/A"} | 失效 ${m.keyLevels?.invalidation || "N/A"}`)
    .join("\n");

  const transmissionItems = (currentDayData.transmissions || [])
    .map((t) => `【链条: ${t.title}】\n- 驱动事件: ${t.drivingEvent}\n- 机制: ${t.transmissionSteps.join(" -> ")}\n- 受益: ${(t.beneficiaries || []).map((b) => `${b.ticker}(+${b.changePercent}%)`).join(", ")}\n- 受损: ${(t.impactedAssets || []).map((i) => `${i.ticker}(${i.changePercent}%)`).join(", ")}`)
    .join("\n\n");

  const formattedPromptPayload = `### 【市场原始数据汇总 - 日期: ${currentDayData.date}】

#### 1. 宏观与大宗商品：
${macroItems}

#### 2. 行业领头羊板块及个股：
${sectorItems}

#### 3. 当日异动股与 RVOL 异常标的：
${moverItems}

#### 4. 跨资产因果传导链路：
${transmissionItems}

==================================================
【SYSTEM PROMPT / 研报生成指令】:
你是一名资深买方宏观对冲基金首席策略分析师。请结合以上结构化市场数据，输出一份专业的《每日美股与全球宏观量化推演研报》。
请严格遵循以下六大模块：
1. 宏观流动性与大类资产联动速览（包含美元、美债、原油对风险偏好的综合传导）
2. 当日最核心重磅突发事件深度因果解读（溯源驱动逻辑并定位主要受冲击行业）
3. 领头羊行业分类提炼与资金机构轮动轨迹
4. 战术多空实战建议（明确做多 Long Ideas 与防御 Short/Defensive 标的，并给出具体仓位配置权重建议）
5. 尾部风险雷达与关键失效止损警报
6. 异动股量价关键位（支撑/阻力/失效分界线）
`;

  const pythonScript = `import yfinance as yf
import datetime

def get_market_data_for_date():
    target_date = "${currentDayData.date}"
    print(f"### 【市场原始数据汇总 - 日期: {target_date}】\\n")
    # 宏观大宗与利率
    macro_tickers = {"WTI原油": "CL=F", "COMEX黄金": "GC=F", "10年期美债": "^TNX", "美元指数": "DX-Y.NYB"}
    # 提取历史行情并组装 Prompt Payload
    ...
`;

  const textToCopy = activeView === "payload" ? formattedPromptPayload : pythonScript;

  const handleCopy = () => {
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#101010] border border-slate-800 rounded-sm w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-[#0a0a0a]">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-[#d4af37]" />
            <h3 className="text-base font-serif font-bold text-white">
              Prompt Payload 提示词载荷与数据提取
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-sm bg-[#181818] text-[#d4af37] border border-slate-800">
              {currentDayData.date}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-sm text-slate-500 hover:text-white hover:bg-[#181818] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* View Switcher Bar */}
        <div className="px-6 py-2 border-b border-slate-850 bg-[#121212] flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-mono">
            <button
              onClick={() => setActiveView("payload")}
              className={`px-3 py-1 rounded-sm flex items-center gap-1.5 ${
                activeView === "payload"
                  ? "bg-[#1f1f1f] text-[#d4af37] border border-[#d4af37]/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Prompt 载荷 (Raw Text)</span>
            </button>

            <button
              onClick={() => setActiveView("python")}
              className={`px-3 py-1 rounded-sm flex items-center gap-1.5 ${
                activeView === "python"
                  ? "bg-[#1f1f1f] text-[#d4af37] border border-[#d4af37]/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Python 采集脚本结构</span>
            </button>
          </div>

          <button
            onClick={handleCopy}
            className="px-3 py-1 rounded-sm bg-[#181818] hover:bg-[#222222] text-slate-300 border border-slate-800 text-xs font-mono flex items-center gap-1 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-[#d4af37]" />}
            <span>{copied ? "已复制载荷" : "复制载荷"}</span>
          </button>
        </div>

        {/* Payload Content Area */}
        <div className="flex-1 p-6 overflow-y-auto bg-[#070707]">
          <pre className="text-xs font-mono text-slate-300 leading-relaxed whitespace-pre-wrap selection:bg-[#d4af37] selection:text-black">
            {textToCopy}
          </pre>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-[#0a0a0a] flex items-center justify-between text-xs text-slate-500 font-sans">
          <span>可直接将此文本粘贴至 Google AI Studio / Gemini 提示词窗口进行策略回测与推演</span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-sm bg-[#181818] hover:bg-[#222222] text-slate-300 border border-slate-800 text-xs font-mono"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
};
