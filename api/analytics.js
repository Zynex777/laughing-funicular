export default async function handler(req,res){
  res.setHeader("Access-Control-Allow-Origin","*");res.setHeader("Access-Control-Allow-Methods","POST,GET,OPTIONS");res.setHeader("Access-Control-Allow-Headers","Content-Type");
  if(req.method==="OPTIONS")return res.status(200).end();
  const SU=process.env.SUPABASE_URL,SK=process.env.SUPABASE_ANON_KEY;
  if(!SU||!SK)return res.json({ok:false,error:"Supabase não configurado"});
  const{linkId,days}=req.query;
  try{
    const since=new Date(Date.now()-(Number(days)||7)*86400000).toISOString();
    const url=linkId?`${SU}/rest/v1/clicks?link_id=eq.${linkId}&clicked_at=gte.${since}&select=*`:`${SU}/rest/v1/clicks?clicked_at=gte.${since}&select=*&limit=1000`;
    const r=await fetch(url,{headers:{apikey:SK,Authorization:`Bearer ${SK}`}});const d=await r.json();
    return res.json({ok:true,clicks:d,total:d.length});
  }catch(e){return res.status(500).json({ok:false,error:e.message});}
}