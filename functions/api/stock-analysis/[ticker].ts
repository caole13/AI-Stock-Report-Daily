interface Env {
  GEMINI_API_KEY: string;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { params, env } = context;
  const ticker = String(params.ticker || "").toUpperCase().trim();

  if (!env.GEMINI_API_KEY) {
    return new Response(
      JSON.stringify({ error: "Cloudflare 环境变量中未检测到 GEMINI_API_KEY，请在 Settings 中配置并重新部署" }),
      { status: 500, headers: { "Content-Type": "application/json; charset=utf-8" } }
    );
  }

  const prompt = `你是一名华尔街资深量化投研专家。请针对美股标的 ${ticker} 生成全中文深度量化诊断报告。
必须严格输出合法的单个 JSON 对象（不要用 markdown 代码块标记，不要包含多余文本），必须包含以下字段：
{
  "ticker": "${ticker}",
  "companyName": "公司名称与业务速览",
  "currentPrice": "近期大致参考价格(USD)",
  "peRatio": "市盈率PE估值",
  "rvol": "量比情况(如放量1.5x或缩量)",
  "ma50": "MA50均线关系(站上/跌破)",
  "ma200": "MA200牛熊分界关系",
  "technicalSignals": "裸K量价与关键技术形态",
  "riskLevel": "中/高/极高",
  "catalyst": "近期核心催化剂与财报/业务预期",
  "summary": "150字左右的综合投研结论与防守/进攻策略"
}`;

  // 备用模型降级链路，防止单个模型因地区/版本限制返回 404
  const models = ["gemini-3.5-flash", "gemini-3.8-flash"];
  let lastErrorMsg = "";

  for (const model of models) {
    try {
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${env.GEMINI_API_KEY}`;
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: "application/json"
          }
        })
      });

      const data: any = await res.json();

      if (!res.ok || data.error) {
        lastErrorMsg = data.error?.message || `HTTP ${res.status}`;
        continue; // 尝试下一个模型
      }

      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        lastErrorMsg = "Gemini 返回了空的候选回答";
        continue;
      }

      // 清理可能的 markdown 标记并校验是否是合法 JSON
      const cleanJson = text.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
      JSON.parse(cleanJson); // 校验合法性

      return new Response(cleanJson, {
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": "public, max-age=300"
        }
      });
    } catch (e: any) {
      lastErrorMsg = e.message;
    }
  }

  // 若所有模型均失败，返回具体错误
  return new Response(
    JSON.stringify({ error: `Gemini API 调用失败: ${lastErrorMsg}` }),
    { status: 500, headers: { "Content-Type": "application/json; charset=utf-8" } }
  );
};