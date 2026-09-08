export default async function handler(req,res){
  res.setHeader("Access-Control-Allow-Origin","*");res.setHeader("Access-Control-Allow-Methods","GET,POST,OPTIONS");res.setHeader("Access-Control-Allow-Headers","Content-Type");
  if(req.method==="OPTIONS")return res.status(200).end();
  const{linkId,platform,redirect}=req.query;
  const SU=process.env.SUPABASE_URL,SK=process.env.SUPABASE_ANON_KEY;
  if(SU&&SK&&linkId){try{await fetch(`${SU}/rest/v1/clicks`,{method:"POST",headers:{"Content-Type":"application/json",apikey:SK,Authorization:`Bearer ${SK}`,Prefer:"return=minimal"},body:JSON.stringify({link_id:linkId,platform:platform||"direct",device:req.headers["user-agent"]?.includes("Mobile")?"mobile":"desktop",ip_hash:req.headers["x-forwarded-for"]||""})});}catch{}}
  if(redirect)return res.redirect(302,decodeURIComponent(redirect));
  return res.json({ok:true,tracked:true});
}