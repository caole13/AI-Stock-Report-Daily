# 📈 AI Macro-Quant Terminal (美股每日 AI 量化研报与多资产复盘终端)

[![Production](https://img.shields.io/badge/Production-Live-emerald?style=flat-square&logo=cloudflarepages)](https://ai-stock-report-daily.pages.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.x-61dafb?style=flat-square&logo=react)](https://react.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38bdf8?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![Gemini](https://img.shields.io/badge/Google-Gemini_3.6-8e75ff?style=flat-square&logo=google)](https://ai.google.dev/)
[![Zero Fake Data](https://img.shields.io/badge/Data_Integrity-Zero_Fake_Data-gold?style=flat-square)](#-核心工程哲学)

> **基于 Google Gemini 3.6 与 Cloudflare Pages Edge Serverless 架构的全自动美股盘后宏观研报与多资产量化复盘系统**  
> 每日美东收盘后自动抓取全市场多资产数据，依托大模型实证归因与边缘行情网关，输出涵盖大类资产流动性中枢、11 大行业板块 ETF、成份股催化异动、主力资金量能意图及宏观因果传导链的专业量化终端。

🔗 **线上生产环境直达**：[https://ai-stock-report-daily.pages.dev](https://ai-stock-report-daily.pages.dev)

---

## 🏛️ 核心工程哲学 (Core Principles)

### 1. 恪守绝对零假数据 (Strict Zero Fake Data Policy)
- **拒绝推测伪造**：严禁任何形式的线性插值、启发式系数（杜绝 `* 0.025`、`* 0.95`）或静态占位冒充真实行情。
- **真实缺失透明化**：数据缺失时诚实展示“暂无”，或者在降级场景中清晰透明注明统计周期（如区分 3 个月日均基准 vs 5 日归档基准），绝不混淆口径。

### 2. 极致零成本架构 (Strict Zero Cost Policy)
- **零付费依赖**：0 采购外部商业行情数据源、0 购买付费 API、0 云主机常驻服务器租赁。
- **Serverless 边缘算力**：依托 Cloudflare Pages Edge Functions 免费算力与 Yahoo Finance 免密官方行情流，构建秒级响应、具备指数重试容灾的高可用边缘网关。

---

## 🔬 核心量化指标与算法工程

```mermaid
flowchart TD
    A["Yahoo Finance 官方行情源 (/v8/finance/chart)"] -->|range=3mo 日K线数组| B["Cloudflare Pages Functions 边缘网关 (market-quotes.ts)"]
    B -->|indicators.quote[0].volume| C["真实3个月日均量计算 (avgVolume)"]
    B -->|indicators.quote[0].close 倒数第二根| D["真实前收盘价确权 (truePrevClose)"]
    B -->|indicators.quote[0].open 当日K线| E["穿透开盘价确权 (open)"]
    C & D & E --> F["实时行情标准化输出 (quotes)"]
    F -->|全要素门禁校验与重试| G["前端股票详情弹窗 (StockDetailModal.tsx)"]
    G --> H["相对成交量比 (RVOL) = 今日量 / 均量"]
    G --> I["日内价格边界与振幅 (High-Low)/Low"]
    G --> J["主力资金量能意图诊断 (8大行为分类)"]
    G --> K["自适应均量口径管理 (3月基准 vs 5日归档)"]
```

### 1. 真实 3 个月日均基准量 (`avgVolume`)
- 网关采用 `range=3mo`（覆盖约 65 根日 K 线），穿透读取 `indicators.quote[0].volume` 历史成交量数组；
- 剔除非交易日、周末休市以及 0 股异常数据后进行真实算术平均：
  $$\text{avgVolume} = \text{round}\left(\frac{\sum_{i=1}^N \text{validVolumes}_i}{N}\right)$$

### 2. 相对成交量比 (`RVOL`) 与主力资金量能意图
- 精确量比计算：
  $$\text{RVOL} = \frac{\text{TodayVolume}}{\text{AvgVolume}}$$
- 结合价格涨跌幅与放缩量偏离度（$\text{Delta}\% = (\text{RVOL} - 1) \times 100\%$），实时诊断主力资金交易意图：
  - **放量突破 / 机构建仓**：RVOL $\ge 1.5$ 且涨幅坚挺，多头动能强劲；
  - **放量滞涨 / 筹码派发**：高位异常放量但涨幅收窄或收阴，警惕分歧；
  - **缩量回踩 / 抛压枯竭**：回调伴随成交量显著收缩，无恐慌盘出逃；
  - **缩量阴跌 / 流动性折价**：弱势格局下买盘承接不足。

### 3. 日内关键价格边界 (Key Price Bounds) 与振幅
- **开盘价穿透**：直接读取当日第一根日 K 线的真实 `open`，彻底规避上游浅层 meta 偶发 `regularMarketDayOpen` 为 `null` 的问题；
- **真实前收盘价校准**：严格提取倒数第二根日 K 线的收盘价作为 `truePrevClose`，确保当日涨跌幅精确反映 T-1 日真实变动（杜绝长周期采样导致把 3 个月累计涨幅错当单日涨幅）；
- **日内振幅精确计算**：
  $$\text{振幅} = \frac{\text{High} - \text{Low}}{\text{Low}} \times 100\%$$

### 4. 自适应口径回退管理 (Adaptive Volume Caliber)
- **自适应标签切换**：
  - 优先读取实时 3 个月均量，卡片标签显示为 **【日均基准量(3月)】**；
  - 若遇网络边缘故障降级回退到归档研报的 5 日均量，卡片标签自适应动态切换为 **【日均基准量(5日)】** 并标注研报归档来源；
  - 均量缺失时卡片显示“暂无”，坚决不将 5 日均量冒充 3 个月均量，100% 确保口径真实透明。
- **重试容灾门禁**：对股票标的实行 `price + volume + avgVolume` 全要素门禁校验；若偶发漏量，自动触发 500ms 渐进式指数退避重试。

### 5. 机构基本面估值锚与事件雷达
- **真实性门禁校验**：引入 `hasAnyValuation` 字段存在性判断；
- **防视觉污染优雅收敛**：若个股暂无真实基本面估值快照，自动收敛为单行诚实提示条（`恪守零假数据不做模拟推测`），杜绝大面积堆砌无意义“暂无”。

---

## 🖥️ 系统核心模块

1. **🌐 全市场宏观流动性透视 (Macro Overview)**
   - 追踪标普 500（SPX）、纳斯达克（IXIC）、美国 10 年期国债收益率（US10Y）、美元指数（DXY）、WTI 原油与现货黄金等跨资产定价中枢；
   - 提炼当日流动性核心主线（Core Thesis）与利率/汇率传导路径。
2. **📊 标普 11 大行业板块热力图 (Sector Heatmap)**
   - 追踪全行业 ETF（XLK、XLF、XLV、XLE、XLI 等）资金流向与涨跌分布；
   - 穿透成份股领涨/领跌标的，归因轮动驱动动向。
3. **🚀 异动个股掘金扫描 (Movers Scanner)**
   - 筛选当日成交量异动放大（RVOL）与高波动代表股票；
   - 穿透催化事件、短线博弈视角、中长期成长逻辑与多空失效分水岭（Invalidation Level）。
4. **🔗 多层级宏观因果传导链 (Causal Transmission Chain)**
   - 拆解「驱动事件 ➔ 传导机制 ➔ 受益/受损行业 ➔ 代表标的」四级因果闭环。
5. **🤖 AI 首席量化策略师对话助手 (Quant Analyst Assistant)**
   - 基于当日结构化市场切片数据进行多轮交互式问答，推演投资逻辑与宏观情景。

---

## 🛠️ 技术栈与架构

| 模块 | 技术选型 | 说明 |
| :--- | :--- | :--- |
| **前端框架** | React 19 + TypeScript + Vite | 现代化高性能 SPA 单页应用 |
| **样式与动效** | Tailwind CSS v4 + Lucide Icons | 极简暗黑金融终端设计风格 |
| **边缘计算** | Cloudflare Pages Functions | Serverless Edge 行情网关与实时聚合 |
| **AI 研报引擎** | Google Gemini 3.6 (`@google/genai`) | 结构化输出（Structured JSON）+ Search Grounding |
| **自动化运维** | GitHub Actions | 美东盘后定时触发全自动复盘生成与代码提交 |

---

## 🚀 本地开发与快速上手

### 1. 克隆仓库与安装依赖

```bash
git clone https://github.com/caole13/AI-Stock-Report-Daily.git
cd AI-Stock-Report-Daily
npm install
```

### 2. 本地开发服务器启动

```bash
npm run dev
```

浏览器访问 `http://localhost:3000` 即可查看本地研报终端。

### 3. 类型安全检查与构建

```bash
# 执行严格 TypeScript 类型安全检查
npm run type-check # 或 npx tsc --noEmit

# 执行生产包构建
npm run build
```

---

## ⏰ 自动化研报工作流 (GitHub Actions)

本项目配置了 `.github/workflows/daily-market.yml` 自动化定时工作流：
- **触发时间**：美东时间周一至周五 17:08（对应 UTC 21:08，错开整点高峰保障执行成功率）；
- **工作流逻辑**：
  1. 自动化检出代码并搭建 Node.js 20 运行环境；
  2. 调用 Google Gemini 3.6 生成强类型结构化盘后数据；
  3. 执行数据校验门禁，自动将生成的研报归档提交至 `src/data/` 目录；
  4. 触发 Cloudflare Pages 自动构建与秒级全球边缘节点分发。

---

## ⚠️ 免责声明 (Disclaimer)

本系统生成的所有内容（包括宏观主线分析、行业轮动归因、量能诊断指标及因果传导链路）均由算法模型与公开市场数据自动化计算生成，**仅供量化研究与学习交流参考，不构成任何投资建议、买卖要约或推荐**。金融市场瞬息万变，投资决策需独立判断并自负盈亏。

---

## 📄 开源许可证

本项目基于 [MIT License](LICENSE) 开源。
