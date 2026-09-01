# 📈 AI Macro-Quant Terminal (美股每日 AI 量化研报终端)

> **基于 Google Gemini 2.5 全自动驱动的美股盘后宏观研报与因果传导量化复盘系统**  
> 每日美东收盘后自动抓取全市场多资产数据，利用大模型 Google Search Grounding 实证归因，输出涵盖流动性中枢、11 大行业板块 ETF、权重成份股催化及宏观因果传导链的深度研报终端。

---

## ✨ 核心特性

- 🌐 **全市场宏观流动性透视 (Macro Overview)**
  - 追踪标普 500、纳斯达克 100、美国 10 年期国债收益率（US10Y）、美元指数（DXY）、WTI 原油与现货黄金等跨资产定价中枢。
  - 自动提炼当日宏观核心主线（Core Thesis）与利率/汇率流动性传导路径。
- 📊 **标普 11 大行业板块热力图 (Sector Heatmap)**
  - 追踪全行业 ETF（XLK、XLF、XLV、XLE 等）涨跌幅与权重分布。
  - 穿透成份股领涨/领跌标的，归因资金轮动动向与核心催化事件。
- 🚀 **异动个股掘金扫描 (Movers Scanner)**
  - 智能筛选当日成交量异常放大（RVOL）与高波动股票。
  - 提供新闻异动精准归因、短线博弈视角、中长期成长逻辑与多空失效分水岭（Invalidation Level）。
- 🔗 **多层级宏观因果传导链 (Causal Transmission Chain)**
  - 拆解「驱动事件 ➔ 传导机制 ➔ 受益/受损行业 ➔ 代表标的」四级因果链路。
- 🤖 **AI 首席量化策略师对话助手 (Quant Analyst Assistant)**
  - 基于当日结构化市场切片数据进行多轮交互式问答，深度推演投资假设。
- ⚡ **全自动化 GitHub Actions 流水线**
  - 美东每个交易日收盘后（17:08 ET）自动执行 Node.js 脚本，调用 Gemini 生成强结构化 JSON，自动归档并触发前端展示。

---

## 🛠️ 技术架构

- **前端框架**: React 19 + TypeScript + Vite
- **UI & 样式**: Tailwind CSS v4 + Lucide Icons + Recharts
- **AI 引擎**: Google Gemini 3.6 (`@google/genai` SDK + Structured Outputs JSON Schema + Google Search Grounding)
- **自动化运维**: GitHub Actions CI/CD Pipeline
- **后端支持**: Express (API 代理与静态托管)

---

## 🚀 快速开始

### 1. 克隆仓库与安装依赖

```bash
git clone https://github.com/caole13/AI-Stock-Report-Daily.git
cd AI-Stock-Report-Daily
npm install
```

### 2. 配置环境变量

在根目录创建 `.env` 文件，填入你的 Gemini API Key：

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. 本地启动开发服务器

```bash
npm run dev
```

打开浏览器访问 `http://localhost:3000` 即可查看本地研报终端。

### 4. 手动运行自动化研报生成脚本

如需手动触发最新一天的美股研报生成：

```bash
node scripts/auto-daily-report.mjs
```

生成的报告将自动写入 `src/data/latestReport.json` 与历史数据库中。

---

## ⏰ GitHub Actions 自动化定时任务说明

本项目配置了 `.github/workflows/daily-market.yml` 自动化定时工作流：

- **触发时间**：美东时间周一至周五 17:08（对应 UTC 21:08，错开整点高峰以保障准时执行）。
- **运行流程**：
  1. 检出仓库代码并搭建 Node.js 20 环境。
  2. 读取 GitHub Secret `GEMINI_API_KEY` 运行生成脚本。
  3. 将生成的每日研报自动提交推送到 `src/data/` 目录。

### GitHub 仓库配置步骤：
1. 进入 GitHub 仓库 **Settings** ➔ **Secrets and variables** ➔ **Actions**。
2. 新增 Secret：`GEMINI_API_KEY`，填入 Google AI Studio 获取的 API 密钥。
3. 进入 **Settings** ➔ **Actions** ➔ **General** ➔ **Workflow permissions**，选择 **"Read and write permissions"** 并保存。

---

## ⚠️ 免责声明 (Disclaimer)

本系统生成的所有内容（包括但不限于宏观主线分析、行业轮动研报、个股催化归因及因果传导逻辑）均由 Google Gemini 大模型自动化生成与公开信息整理，**仅供量化研究与学习交流参考，不构成任何投资建议、买卖要约或推荐**。金融市场有风险，投资决策需独立判断并自负盈亏。

---

## 📄 开源许可证

本项目基于 [MIT License](LICENSE) 开源。
