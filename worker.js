import { MAX_VIDEO_BYTES } from './site-media.js';
export { ApplicationStore } from './application-api.js';
import { reply, publicOriginAllowed, boundedBody } from './application-api.js';
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
    if (pathname === '/api/applications' || pathname.startsWith('/api/applications/') || pathname==='/api/results' || pathname==='/api/enrollment' || pathname==='/api/enrollment/lookup' || pathname==='/api/enrollment/session' || pathname==='/api/enrollment/payment' || pathname==='/api/site-content' || pathname==='/api/contact-messages' || pathname.startsWith('/api/panel/') || pathname.startsWith('/api/site-media/')) {
      const origin=request.headers.get('Origin'),isPublic=pathname==='/api/applications'||pathname==='/api/applications/config'||pathname==='/api/applications/track'||pathname==='/api/results'||pathname==='/api/enrollment'||pathname==='/api/enrollment/lookup'||pathname==='/api/enrollment/session'||pathname==='/api/enrollment/payment'||pathname==='/api/site-content'||pathname==='/api/contact-messages'||pathname.startsWith('/api/site-media/');
      const cors=isPublic&&origin&&publicOriginAllowed(origin,new URL(request.url).origin,env)?{'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Methods':'GET, HEAD, POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type, Range, If-Range','Access-Control-Expose-Headers':'Content-Range, Accept-Ranges, Content-Length, ETag','Vary':'Origin'}:{};
      if(request.method==='OPTIONS')return new Response(null,{status:cors['Access-Control-Allow-Origin']?204:403,headers:cors});
      // Buffer bounded video uploads before crossing the Durable Object bridge.
      // A rejected upload must not leave the forwarded request stream running.
      if((pathname==='/api/panel/activity-video'&&request.method==='PUT')||(pathname==='/api/panel/cms-media'&&request.method==='POST')){
        try{
          if(origin!==new URL(request.url).origin){if(request.body)await request.body.cancel();return reply({error:'Bu kaynaktan işlem yapılamaz.'},403)}
          const payload=await boundedBody(request,MAX_VIDEO_BYTES);
          request=new Request(request,{body:payload});
        }catch(error){try{if(request.body&&!request.body.locked)await request.body.cancel()}catch{}return reply({error:error.status?error.message:'Video yüklenemedi.'},error.status||500)}
      }
      const response=!env.NOVA_APPLICATIONS?reply({error:'Başvuru veri deposu henüz etkinleştirilmedi.'},503):await env.NOVA_APPLICATIONS.get(env.NOVA_APPLICATIONS.idFromName('nova-applications-v1')).fetch(request);
      const headers=new Headers(response.headers);for(const [key,value] of Object.entries(cors))headers.set(key,value);
      return new Response(response.body,{status:response.status,headers});
    }
    if (pathname === '/panel' || pathname === '/panel/' || pathname === '/panel.html') {
      const target=new URL(request.url);target.pathname='/panel';
      const response=await env.ASSETS.fetch(new Request(target,request));
      const headers=new Headers(response.headers);
      headers.set('Cache-Control','no-store');headers.set('X-Robots-Tag','noindex, nofollow');
      headers.set('X-Frame-Options','DENY');headers.set('X-Content-Type-Options','nosniff');headers.set('Referrer-Policy','no-referrer');
      headers.set('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; media-src 'self' blob:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'");
      return new Response(response.body,{status:response.status,headers});
    }
    if (pathname === "/api/nova-ai" || pathname === "/api/nova-ai/") {
      return handleNovaAi(request, env);
    }
    return env.ASSETS.fetch(request);
  },
};

