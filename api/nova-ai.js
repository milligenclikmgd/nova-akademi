export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const key = process.env.GEMINI_API_KEY;
  if (!key) return res.status(503).json({ error: "NOVA AI henüz yapılandırılmadı." });

  const message = String(req.body?.message || "").trim();
  const history = Array.isArray(req.body?.history) ? req.body.history.slice(-6) : [];
  if (!message) return res.status(400).json({ error: "Mesaj gerekli." });

  const contents = [
    ...history.map(item => ({
      role: item.role === "assistant" ? "model" : "user",
      parts: [{ text: String(item.text || "") }]
    })),
    { role: "user", parts: [{ text: message }] }
  ];

  try {
    const model = process.env.GEMINI_MODEL || "gemini-3.8-flash";
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": key },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: "Sen NOVA AI'sın. NOVA Sanat ve Spor Kulübü hakkında Türkçe, nazik, kısa ve doğru yanıtlar ver. Bilmediğin bilgiyi uydurma; iletişim sayfasına yönlendir." }]
          },
          contents,
          generationConfig: { temperature: 0.55, maxOutputTokens: 450 }
        })
      }
    );
    const data = await response.json();
    if (!response.ok) throw new Error(data?.error?.message || "Gemini isteği başarısız.");
    const reply = data?.candidates?.[0]?.content?.parts?.map(part => part.text || "").join("").trim();
    if (!reply) throw new Error("Yanıt alınamadı.");
    return res.status(200).json({ reply });
  } catch (error) {
    return res.status(502).json({ error: error.message || "NOVA AI şu an yanıt veremiyor." });
  }
}