export default async function handler(req,res){
  res.setHeader("Access-Control-Allow-Origin","*");res.setHeader("Access-Control-Allow-Methods","POST,OPTIONS");res.setHeader("Access-Control-Allow-Headers","Content-Type");
  if(req.method==="OPTIONS")return res.status(200).end();
  const TT=process.env.TELEGRAM_BOT_TOKEN,TC=process.env.TELEGRAM_CHAT_ID;
  const{posts}=req.body||{};
  if(!TT||!TC)return res.json({ok:false,error:"Telegram não configurado"});
  const results=[];
  for(const post of(posts||[])){
    try{const r=await fetch(`https://api.telegram.org/bot${TT}/sendMessage`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({chat_id:TC,text:post.text||"",parse_mode:"Markdown"})});const d=await r.json();results.push({id:post.id,ok:d.ok,message_id:d.result?.message_id});}
    catch(e){results.push({id:post.id,ok:false,error:e.message});}
  }
  return res.json({ok:true,results});
}