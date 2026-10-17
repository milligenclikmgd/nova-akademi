export { ApplicationStore } from './application-api.js';
import { reply } from './application-api.js';
const systemPrompt =
  "Sen NOVA AI'sın. NOVA Sanat ve Spor Kulübü hakkında Türkçe, nazik, kısa ve doğru yanıtlar ver. Bilmediğin bilgiyi uydurma; iletişim sayfasına yönlendir.";

function jsonResponse(body, status) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

async function handleNovaAi(request, env) {
  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const key = env.GEMINI_API_KEY;
  if (!key) {
    return jsonResponse({ error: "NOVA AI henüz yapılandırılmadı." }, 503);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Geçerli bir JSON mesajı gerekli." }, 400);
  }

  const message = String(body?.message || "").trim();
  const history = Array.isArray(body?.history) ? body.history.slice(-6) : [];
  if (!message) {
    return jsonResponse({ error: "Mesaj gerekli." }, 400);
  }

  const contents = [
    ...history.map((item) => ({
      role: item.role === "assistant" ? "model" : "user",
      parts: [{ text: String(item.text || "") }],
    })),
    { role: "user", parts: [{ text: message }] },
  ];

  try {
    const model = env.GEMINI_MODEL || "gemini-3.8-flash";
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/" +
        model +
        ":generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": key,
        },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents,
          generationConfig: { temperature: 0.55, maxOutputTokens: 450 },
        }),
      },
    );

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.error?.message || "Gemini isteği başarısız.");
    }

    const reply = data?.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || "")
      .join("")
      .trim();
    if (!reply) throw new Error("Yanıt alınamadı.");

    return jsonResponse({ reply }, 200);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (/high demand|resource exhausted|rate limit/i.test(message)) {
      return jsonResponse(
        {
          error:
            "NOVA AI şu an yoğun. Lütfen birkaç saniye sonra tekrar deneyin.",
        },
        503,
      );
    }
    return jsonResponse(
      { error: "NOVA AI şu an yanıt veremiyor. Lütfen tekrar deneyin." },
      502,
    );
  }
}

export default {
  async fetch(request, env) {
    const pathname = new URL(request.url).pathname;
    if (pathname === '/api/applications' || pathname.startsWith('/api/applications/') || pathname.startsWith('/api/panel/')) {
      if (!env.NOVA_APPLICATIONS) return reply({error:'Başvuru veri deposu henüz etkinleştirilmedi.'},503);
      return env.NOVA_APPLICATIONS.get(env.NOVA_APPLICATIONS.idFromName('nova-applications-v1')).fetch(request);
    }
    if (pathname === '/panel' || pathname === '/panel/' || pathname === '/panel.html') {
      const target=new URL(request.url);target.pathname='/panel';
      const response=await env.ASSETS.fetch(new Request(target,request));
      const headers=new Headers(response.headers);
      headers.set('Cache-Control','no-store');headers.set('X-Robots-Tag','noindex, nofollow');
      headers.set('X-Frame-Options','DENY');headers.set('X-Content-Type-Options','nosniff');headers.set('Referrer-Policy','no-referrer');
      headers.set('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'");
      return new Response(response.body,{status:response.status,headers});
    }
    if (pathname === "/api/nova-ai" || pathname === "/api/nova-ai/") {
      return handleNovaAi(request, env);
    }
    return env.ASSETS.fetch(request);
  },
};

