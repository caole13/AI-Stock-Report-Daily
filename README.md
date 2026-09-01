

# 📈 AI-Stock-Report-Daily: 自动化每日股市AI复盘与研报生成工具

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python Version](https://img.shields.io/badge/python-3.9+-blue.svg)](https://www.python.org/)

**AI-Stock-Report-Daily** 是一款面向个人投资者、量化交易员及金融研究人员的自动化开源工具。该项目通过整合金融行情接口、财经快讯数据与大语言模型（LLM）推理能力，在每日收盘后自动生成专业、结构化的股市复盘与研报，并支持通过多渠道自动化定时分发。

---

## 📋 核心功能特性

- 📊 **全自动数据抓取**：支持对接 AkShare、Tushare、Yahoo Finance 等数据源，自动获取大盘指数、行业与概念板块涨跌幅、主力资金流向及龙虎榜数据。
- 📰 **资讯与舆情清洗**：自动整合当日核心财经新闻、政策公告及市场快讯，提取关键驱动事件。
- 🤖 **AI 智能复盘与归因**：借助 DeepSeek、OpenAI GPT、Claude 等主流大模型，对行情量价、连板梯队、情绪周期及热点主线进行结构化提炼。
- 🚀 **多渠道定时分发**：原生支持 GitHub Actions 与 Crontab 定时调度，报告一键推送到飞书、企业微信、钉钉机器人或个人邮箱。
- ⚙️ **高可定制化**：支持通过 Markdown 模板自定义自选股监控池、复盘维度与输出风格。

---

## 🛠️ 技术架构

| 模块 | 技术选型 | 功能描述 |
| :--- | :--- | :--- |
| **数据层 (Data)** | Python, AkShare / Tushare / yfinance | 负责获取指数行情、板块涨跌、个股量价及财经资讯 |
| **智能层 (AI/LLM)** | DeepSeek / OpenAI / Anthropic API | 负责 Prompt 组装、市场情绪推演与研报文本生成 |
| **调度层 (Workflow)** | GitHub Actions / Linux Cron | 交易日收盘后自动触发执行工作流 |
| **推送层 (Notifier)** | Webhook / SMTP (Feishu, WeChat, DingTalk) | 将渲染后的 Markdown / 富文本消息实时推送给用户 |

---

## 🚀 快速开始

### 1. 克隆仓库与安装依赖

```bash
git clone [https://github.com/caole13/AI-Stock-Report-Daily.git](https://github.com/caole13/AI-Stock-Report-Daily.git)
cd AI-Stock-Report-Daily
pip install -r requirements.txt

```

### 2. 环境变量配置

复制配置文件模板：

```bash
cp .env.example .env

```

编辑 `.env` 文件填入必要参数：

```ini
# 大模型 API 配置
OPENAI_API_KEY=your_openai_or_deepseek_api_key
OPENAI_BASE_URL=[https://api.deepseek.com/v1](https://api.deepseek.com/v1)
MODEL_NAME=deepseek-chat

# 行情数据源配置 (选填)
TUSHARE_TOKEN=your_tushare_token

# 消息通知 Webhook
FEISHU_WEBHOOK=[https://open.feishu.cn/open-apis/bot/v2/hook/xxxxxx](https://open.feishu.cn/open-apis/bot/v2/hook/xxxxxx)
DINGTALK_WEBHOOK=[https://oapi.dingtalk.com/robot/send?access_token=xxxxxx](https://oapi.dingtalk.com/robot/send?access_token=xxxxxx)
WECOM_WEBHOOK=[https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=xxxxxx](https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=xxxxxx)

```

### 3. 本地运行测试

```bash
python main.py

```

---

## ⏰ 自动化部署 (GitHub Actions)

本项目支持通过 GitHub Actions 实现交易日收盘后的无服务器自动化运行：

1. Fork 本仓库或推送到你的私有仓库。
2. 进入仓库的 **Settings > Secrets and variables > Actions**。
3. 点击 **New repository secret**，将 `.env` 中的变量（如 `OPENAI_API_KEY`、`FEISHU_WEBHOOK`）逐一添加。
4. 默认工作流将在每个交易日收盘后（北京时间 15:30）自动运行。

---

## ⚠️ 免责声明

本软件自动生成的所有报告与分析内容仅供学习交流与参考，不构成任何投资建议或交易依据。金融市场有风险，投资需独立审慎决策。

```

```
