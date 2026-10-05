interface Env {
  GEMINI_API_KEY: string;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { params, env } = context;
  const ticker = String(params.ticker).toUpperCase();

  if (!env.GEMINI_API_KEY) {
    return new Response(JSON.stringify({ error: "Missing GEMINI_API_KEY in Cloudflare settings" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    const prompt = `针对美股标的 ${ticker} 输出全中文深度投研分析报告，格式要求为严格的 JSON 结构。包含以下字段：ticker, companyName, currentPrice, peRatio, rvol, ma50, ma200, technicalSignals, riskLevel, catalyst, summary。`;

    // 采用稳定模型 REST API
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${env.GEMINI_API_KEY}`;
    
    const geminiRes = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" }
      })
    });

    const geminiData: any = await geminiRes.json();
    const resultText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

    return new Response(resultText, {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "public, max-age=300"
      }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || "Failed to analyze stock" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};