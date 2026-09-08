export default async function handler(req,res){
  res.setHeader("Access-Control-Allow-Origin","*");res.setHeader("Access-Control-Allow-Methods","POST,GET,OPTIONS");res.setHeader("Access-Control-Allow-Headers","Content-Type");
  if(req.method==="OPTIONS")return res.status(200).end();
  const TT=process.env.TELEGRAM_BOT_TOKEN,TC=process.env.TELEGRAM_CHAT_ID;
  const{action}=req.query;const body=req.body||{};
  try{
    if(action==="monitor"){
      const t=body.token||TT;if(!t)return res.json({ok:false,error:"TELEGRAM_BOT_TOKEN não configurado"});
      const r=await fetch(`https://api.telegram.org/bot${t}/getUpdates?limit=20`);const d=await r.json();
      const msgs=(d.result||[]).filter(u=>u.channel_post?.text||u.message?.text).map(u=>({id:u.update_id.toString(),text:u.channel_post?.text||u.message?.text||"",chat:u.channel_post?.chat?.title||"Canal",date:new Date((u.channel_post?.date||u.message?.date||0)*1000).toLocaleTimeString("pt-BR")}));
      return res.json({ok:true,messages:msgs});
    }
    const t=body.token||TT,c=body.chatId||TC;
    if(!t||!c)return res.json({ok:false,error:"Token e Chat ID obrigatórios"});
    const{text,photo}=body;
    const url=photo?`https://api.telegram.org/bot${t}/sendPhoto`:`https://api.telegram.org/bot${t}/sendMessage`;
    const payload=photo?{chat_id:c,photo,caption:text,parse_mode:"Markdown"}:{chat_id:c,text,parse_mode:"Markdown"};
    const r=await fetch(url,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
    const d=await r.json();return res.json({ok:d.ok,message_id:d.result?.message_id,error:d.description});
  }catch(e){return res.status(500).json({ok:false,error:e.message});}
}