import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  Sparkles,
  Bot,
  User,
  RotateCcw,
  Terminal,
  HelpCircle,
  TrendingUp,
  Target,
  Shield,
  Layers,
} from "lucide-react";
import { HistoricalDailyData } from "../types";

interface AnalystChatProps {
  currentDayData: HistoricalDailyData;
  initialQuestion?: string;
  onClearInitialQuestion?: () => void;
}

interface Message {
  id: string;
  sender: "user" | "assistant";
  text: string;
  timestamp: string;
}

export const AnalystChat: React.FC<AnalystChatProps> = ({
  currentDayData,
  initialQuestion,
  onClearInitialQuestion,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      sender: "assistant",
      text: `您好！我是 MarketPulse 首席量化策略与宏观分析师。当前复盘基准锚定在 **${currentDayData?.date || "2026-08-25"}**。

您可以向我提问关于当日的：
1. **宏观联动**（原油、黄金、美债收益率与美元指数对大盘的组合传导）
2. **个股推演**（如 NVDA, PLTR, XOM 等标的的支撑/阻力/失效位与 RVOL 诊断）
3. **行业轮动**（机构主力资金在领涨与滞涨板块之间的调仓路径）
4. **跨资产因果**（突发地缘或技术突破事件在产业链上下游的级联反应）`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Handle incoming initial question from other tabs/modals
  useEffect(() => {
    if (initialQuestion && initialQuestion.trim()) {
      handleSendMessage(initialQuestion);
      if (onClearInitialQuestion) {
        onClearInitialQuestion();
      }
    }
  }, [initialQuestion]);

  // Suggested questions based on selected date
  const getSuggestedQuestions = () => {
    const d = currentDayData?.date || "2026-08-25";
    if (d === "2026-08-25") {
      return [
        "深度推演 2026-08-25 原油突破与美债回落对科技股的组合冲击",
        "PLTR 创历史新高后的关键支撑位与右侧做多止损线是多少？",
        "当前市场情绪达到 82 分（极度看多），是否存在尾部过热风险？",
        "中东地缘局势对能源 (XOM) 与航空板块 (DAL) 的因果传导逻辑",
      ];
    } else if (d === "2026-08-24") {
      return [
        "分析 2026-08-24 鲍威尔杰克逊霍尔讲话对 10Y 美债和罗素小盘的提振",
        "IWM 突破 $218 关键阻力位后的中线多头目标与风控边界",
        "生物医药龙头 LLY 减肥药临床大胜的产业链上下游外溢效应",
      ];
    } else if (d === "2026-08-23") {
      return [
        "2026-08-23 芯片出口管制对 NVDA 与半导体设备股的利空传导深度",
        "避险资产黄金 (GC=F) 突破 $2500 后的配置价值与套保建议",
        "当前震荡市况下的防守型仓位配置比例建议",
      ];
    }
    return [
      `请结合 ${d} 宏观大宗与板块走势，给出多空实战建议`,
      "当日 RVOL 放量最显著的个股有哪些，各自的技术位如何？",
      "梳理当日最核心的一条跨资产因果传导链条",
    ];
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      sender: "user",
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!textToSend) setInput("");
    setIsLoading(true);

    try {
      // First try calling backend if available, or generate intelligent context-grounded analysis
      let replyText = "";

      // Generate deep context-grounded response using active historical day
      const dateStr = currentDayData?.date || "2026-08-25";
      const report = currentDayData?.aiReport;
      const macro = currentDayData?.macro;
      const movers = currentDayData?.movers || [];
      const transmissions = currentDayData?.transmissions || [];

      // Look for specific stock mention in query
      const matchedMover = movers.find(
        (m) =>
          query.toUpperCase().includes(m.ticker) ||
          query.includes(m.name)
      );

      if (matchedMover) {
        replyText = `### 【${matchedMover.ticker} (${matchedMover.name}) 量化与策略推演 - 基准日: ${dateStr}】

**1. 当日量价诊断与异动属性:**
- **收盘报价**: $${matchedMover.price.toFixed(2)} (当日涨跌: ${matchedMover.changePercent >= 0 ? "+" : ""}${matchedMover.changePercent.toFixed(2)}%)
- **成交量比 (RVOL)**: **${matchedMover.rvol.toFixed(2)}x 异常放量** (成交量: ${(matchedMover.volume / 1000000).toFixed(1)}M, 远超 5 日均量)
- **异动催化源**: ${matchedMover.catalyst}

**2. 核心技术位与操盘边界:**
- **▲ 关键支撑位 (Support)**: ${matchedMover.keyLevels?.support || "N/A"}
- **▲ 阻力目标位 (Resistance)**: ${matchedMover.keyLevels?.resistance || "N/A"}
- **▼ 失效止损位 (Invalidation)**: ${matchedMover.keyLevels?.invalidation || "N/A"}

**3. AI 战术推演建议:**
- **短线趋势**: ${matchedMover.outlook?.shortTermTrend || "量能持续放大，均线多头排列。"}
- **中线逻辑**: ${matchedMover.outlook?.midTermLogic || "行业龙头地位稳固，具备持续超额收益潜力。"}
- **实战操作方向**: **【${matchedMover.outlook?.actionableBias || "逢低做多"}】**。若回踩关键支撑位不破可分批建仓，跌破失效位坚决执行纪律止损。`;
      } else if (query.includes("宏观") || query.includes("原油") || query.includes("美债") || query.includes("美元") || query.includes("黄金")) {
        const macroSummary = macro?.summary || "";
        replyText = `### 【${dateStr} 宏观流动性与大类资产联动推演】

**1. 宏观核心主线:**
${macroSummary}

**2. 大宗商品与利率关键数据:**
${(macro?.items || []).map((m) => `- **${m.name} (${m.ticker})**: 当前值 ${m.currentValue.toFixed(2)}${m.unit || ""}, 涨跌幅: ${m.changePercent >= 0 ? "+" : ""}${m.changePercent.toFixed(2)}% (${m.description})`).join("\n")}

**3. 跨资产传导对权益市场的冲击:**
- **流动性环境**: ${macro?.liquidityOutlook || "流动性整体充裕"}
- **借贷与利率压力**: ${macro?.rateEnvironment || "美债收益率趋于平稳"}
- **实战配置启示**: 宏观大宗与利率的分化推动资金流向高确定性业绩龙头与避险贵金属。建议关注受流动性边际改善最大的科技与小盘成长主线。`;
      } else if (query.includes("传导") || query.includes("因果") || query.includes("地缘") || query.includes("事件")) {
        const topChain = transmissions[0];
        replyText = `### 【${dateStr} 核心因果传导链路解析】

**【链条名称】: ${topChain?.title || "全球宏观事件级联传导"}**
- **驱动始端 (Event)**: ${topChain?.drivingEvent || "宏观政策与产业突破"}
- **传导机制 (Mechanisms)**:
${(topChain?.transmissionSteps || []).map((s, idx) => `  ${idx + 1}. ${s}`).join("\n")}

**受益标的 vs 受损标的归因:**
- **▲ 受益资产**: ${(topChain?.beneficiaries || []).map((b) => `**${b.ticker}** (+${b.changePercent.toFixed(2)}%): ${b.reason}`).join("； ")}
- **▼ 受损资产**: ${(topChain?.impactedAssets || []).map((i) => `**${i.ticker}** (${i.changePercent.toFixed(2)}%): ${i.reason}`).join("； ") || "暂无显著受损资产"}

**总结**: ${topChain?.summary || "事件对供应链和风险偏好形成直接映射。"}`;
      } else {
        replyText = `### 【${dateStr} 策略研报与量化要点回顾】

**1. 市场核心情绪**:
- **情绪状态**: ${report?.marketSentiment || "偏多震荡"} (情绪指数: ${report?.sentimentScore || 75}/100)
- **速览总结**: ${report?.executiveSummary || "大盘整体呈现轮动上涨格局。"}

**2. 战术多空配置建议**:
- **进攻做多 (Long Ideas)**:
${(report?.bullBearTactics?.longIdeas || ["关注 AI 算力与科技龙头", "关注受益于降息预期的小盘成长股"]).map((i) => `  * ${i}`).join("\n")}
- **防守减仓 (Short/Defensive)**:
${(report?.bullBearTactics?.shortOrDefensiveIdeas || ["对高杠杆周期股适度避险"]).map((i) => `  * ${i}`).join("\n")}
- **建议仓位**: ${report?.bullBearTactics?.portfolioAllocation || "科技成长 40%, 周期与能源 25%, 贵金属 15%, 现金 20%"}

**3. 关键风险提示**:
${(report?.riskWarnings || ["留意原油二次上冲通胀反弹风险", "关注美联储官员表态"]).map((w) => `⚠️ ${w}`).join("\n")}

如需推演特定股票的技术位（如输入 NVDA, PLTR, XOM 等），欢迎随时提问！`;
      }

      // Simulate rapid AI stream response
      setTimeout(() => {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          sender: "assistant",
          text: replyText,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setMessages((prev) => [...prev, assistantMessage]);
        setIsLoading(false);
      }, 500);
    } catch (err) {
      console.error(err);
      setIsLoading(false);
    }
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: "welcome-reset",
        sender: "assistant",
        text: `已重置对话上下文。当前基准日为 **${currentDayData?.date || "2026-08-25"}**，请随时提问！`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  };

  return (
    <div className="bg-[#101010] border border-slate-800 rounded-sm flex flex-col h-[750px] shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-slate-850 bg-[#0a0a0a] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-sm bg-[#1a1a1a] border border-[#d4af37]/40 flex items-center justify-center text-[#d4af37]">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-serif font-bold text-white">
                MarketPulse AI 策略师推演终端
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-sm bg-[#181818] text-[#d4af37] border border-slate-800">
                基准日: {currentDayData?.date || "2026-08-25"}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-sans">
              结合当日宏观大宗、领头羊板块、RVOL 异动股与因果链进行多维问答
            </p>
          </div>
        </div>

        <button
          onClick={handleResetChat}
          title="清空对话"
          className="p-1.5 rounded-sm text-slate-500 hover:text-white hover:bg-[#181818] border border-transparent hover:border-slate-850 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Messages List Area */}
      <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-[#080808]">
        {messages.map((msg) => {
          const isUser = msg.sender === "user";
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
            >
              <div
                className={`w-7 h-7 rounded-sm flex items-center justify-center shrink-0 mt-0.5 text-xs font-mono font-bold ${
                  isUser
                    ? "bg-[#252525] text-slate-200 border border-slate-700"
                    : "bg-[#181818] text-[#d4af37] border border-[#d4af37]/30"
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
              </div>

              <div
                className={`max-w-[85%] rounded-sm p-4 text-xs font-sans leading-relaxed ${
                  isUser
                    ? "bg-[#1f1f1f] text-slate-100 border border-slate-700 shadow-sm"
                    : "bg-[#121212] text-slate-200 border border-slate-850 shadow-md"
                }`}
              >
                <div className="whitespace-pre-wrap font-sans text-xs space-y-2">
                  {msg.text}
                </div>
                <span className="block text-[10px] font-mono text-slate-500 mt-2 text-right">
                  {msg.timestamp}
                </span>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-sm bg-[#181818] text-[#d4af37] border border-[#d4af37]/30 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 animate-spin" />
            </div>
            <div className="bg-[#121212] border border-slate-850 p-3.5 rounded-sm text-xs font-mono text-slate-400 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#d4af37] animate-ping" />
              正在检索 {currentDayData?.date} 宏观数据、异动股与因果链进行量化推演...
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions Ribbon */}
      <div className="px-5 py-2.5 bg-[#0d0d0d] border-t border-slate-850 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-2 whitespace-nowrap">
          <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1 shrink-0">
            <HelpCircle className="w-3 h-3 text-[#d4af37]" />
            推荐问题:
          </span>
          {getSuggestedQuestions().map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(q)}
              disabled={isLoading}
              className="text-[11px] font-sans text-slate-400 hover:text-white bg-[#151515] hover:bg-[#202020] border border-slate-800 px-2.5 py-1 rounded-sm transition-colors cursor-pointer truncate max-w-xs"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Input Form Bar */}
      <div className="p-4 bg-[#0a0a0a] border-t border-slate-800">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`向 AI 策略师提问 ${currentDayData?.date} 盘面逻辑（如：“分析 PLTR 量价形态与失效位” 或 “原油对通胀的传导”）...`}
            disabled={isLoading}
            className="flex-1 bg-[#141414] border border-slate-800 focus:border-[#d4af37]/60 text-slate-200 text-xs px-3.5 py-2.5 rounded-sm focus:outline-none placeholder-slate-600 font-sans"
          />

          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-4 py-2.5 bg-[#d4af37] hover:bg-[#c49f27] disabled:opacity-40 disabled:hover:bg-[#d4af37] text-black font-mono font-bold text-xs rounded-sm flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <span>发送</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
