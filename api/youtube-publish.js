// ══════════════════════════════════════════════════════
// YOUTUBE PUBLISH — OAuth + Upload automático via API oficial
// Google YouTube Data API v3
// ══════════════════════════════════════════════════════
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const CLIENT_ID     = process.env.YOUTUBE_CLIENT_ID;
  const CLIENT_SECRET = process.env.YOUTUBE_CLIENT_SECRET;
  const REDIRECT_URI  = process.env.YOUTUBE_REDIRECT_URI || `${process.env.APP_URL}/api/youtube-publish?action=callback`;

  const { action } = req.query;
  const body = req.body || {};

  try {

    // ── AUTH URL — gera URL de autorização do Google ──
    if (action === "auth-url") {
      if (!CLIENT_ID) return res.json({ ok:false, error:"YOUTUBE_CLIENT_ID não configurado no Vercel" });
      const scope = encodeURIComponent("https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube");
      const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=${scope}&access_type=offline&prompt=consent`;
      return res.json({ ok:true, url });
    }

    // ── CALLBACK — troca code por token ──
    if (action === "callback") {
      const { code } = req.query;
      if (!code) return res.redirect(`/?yt_error=no_code`);
      const r = await fetch("https://oauth2.googleapis.com/token", {
        method:"POST",
        headers:{"Content-Type":"application/x-www-form-urlencoded"},
        body: new URLSearchParams({
          code, client_id:CLIENT_ID, client_secret:CLIENT_SECRET,
          redirect_uri:REDIRECT_URI, grant_type:"authorization_code"
        })
      });
      const data = await r.json();
      if (data.access_token) {
        // Redirect back to app with tokens in hash (never in query string)
        const params = new URLSearchParams({
          yt_token:   data.access_token,
          yt_refresh: data.refresh_token || "",
          yt_expires: String(Date.now() + (data.expires_in||3600)*1000),
        });
        return res.redirect(`/?${params.toString()}`);
      }
      return res.redirect(`/?yt_error=${encodeURIComponent(data.error || "auth_failed")}`);
    }

    // ── REFRESH TOKEN ──
    if (action === "refresh") {
      const { refresh_token } = body;
      if (!refresh_token) return res.json({ ok:false, error:"refresh_token obrigatório" });
      const r = await fetch("https://oauth2.googleapis.com/token", {
        method:"POST",
        headers:{"Content-Type":"application/x-www-form-urlencoded"},
        body: new URLSearchParams({
          refresh_token, client_id:CLIENT_ID, client_secret:CLIENT_SECRET,
          grant_type:"refresh_token"
        })
      });
      const data = await r.json();
      if (data.access_token) {
        return res.json({ ok:true, token:data.access_token, expires: Date.now()+(data.expires_in||3600)*1000 });
      }
      return res.json({ ok:false, error:data.error || "Falha ao renovar token" });
    }

    // ── GET CHANNEL INFO ──
    if (action === "channel") {
      const { token } = body;
      const r = await fetch("https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true", {
        headers:{ Authorization:`Bearer ${token}` }
      });
      const data = await r.json();
      const ch = data.items?.[0];
      if (ch) {
        return res.json({ ok:true, channel:{
          id: ch.id, name: ch.snippet.title,
          thumb: ch.snippet.thumbnails?.default?.url,
          subs: ch.statistics?.subscriberCount,
        }});
      }
      return res.json({ ok:false, error:"Canal não encontrado ou token inválido" });
    }

    // ── UPLOAD VIDEO ──
    if (action === "upload") {
      const { token, videoUrl, title, description, tags, privacy, scheduledAt } = body;
      if (!token)    return res.json({ ok:false, error:"Token não fornecido. Conecte sua conta YouTube." });
      if (!videoUrl) return res.json({ ok:false, error:"URL do vídeo obrigatória" });

      // Step 1: Fetch the video file
      const videoRes = await fetch(videoUrl);
      if (!videoRes.ok) return res.json({ ok:false, error:"Não foi possível baixar o vídeo da URL fornecida" });
      const videoBuffer = await videoRes.arrayBuffer();
      const contentType = videoRes.headers.get("content-type") || "video/mp4";
      const contentLength = videoBuffer.byteLength;

      // Step 2: Create upload session (resumable upload)
      const metaRes = await fetch(
        "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status",
        {
          method:"POST",
          headers:{
            Authorization: `Bearer ${token}`,
            "Content-Type":"application/json",
            "X-Upload-Content-Type": contentType,
            "X-Upload-Content-Length": String(contentLength),
          },
          body: JSON.stringify({
            snippet:{
              title:       title || "Vídeo AfiliadoAI",
              description: description || "",
              tags:        tags || ["afiliado","oferta","promoção"],
              categoryId:  "22", // People & Blogs
            },
            status:{
              privacyStatus: scheduledAt ? "private" : (privacy || "public"),
              ...(scheduledAt ? { publishAt: new Date(scheduledAt).toISOString() } : {}),
              selfDeclaredMadeForKids: false,
            }
          })
        }
      );

      const uploadUrl = metaRes.headers.get("location");
      if (!uploadUrl) {
        const errData = await metaRes.json();
        return res.json({ ok:false, error: errData.error?.message || "Falha ao iniciar upload" });
      }

      // Step 3: Upload the actual video bytes
      const uploadRes = await fetch(uploadUrl, {
        method:"PUT",
        headers:{
          "Content-Type": contentType,
          "Content-Length": String(contentLength),
        },
        body: videoBuffer,
      });

      const uploadData = await uploadRes.json();
      if (uploadData.id) {
        return res.json({
          ok:      true,
          videoId: uploadData.id,
          url:     `https://www.youtube.com/watch?v=${uploadData.id}`,
          status:  uploadData.status?.uploadStatus,
          privacy: uploadData.status?.privacyStatus,
          scheduled: scheduledAt || null,
        });
      }
      return res.json({ ok:false, error: uploadData.error?.message || "Falha no upload", details: uploadData });
    }

    // ── LIST SCHEDULED VIDEOS ──
    if (action === "scheduled") {
      const { token } = body;
      const r = await fetch("https://www.googleapis.com/youtube/v3/videos?part=snippet,status&mine=true&myRating=none", {
        headers:{ Authorization:`Bearer ${token}` }
      });
      const data = await r.json();
      const scheduled = (data.items||[]).filter(v => v.status?.privacyStatus === "private" && v.status?.publishAt);
      return res.json({ ok:true, videos: scheduled.map(v=>({
        id:    v.id,
        title: v.snippet?.title,
        publishAt: v.status?.publishAt,
        thumb: v.snippet?.thumbnails?.default?.url,
      }))});
    }

    return res.json({ ok:false, error:`Ação desconhecida: ${action}` });

  } catch(e) {
    return res.status(500).json({ ok:false, error:e.message });
  }
}
