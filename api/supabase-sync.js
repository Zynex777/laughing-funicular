export default async function handler(req,res){
  res.setHeader("Access-Control-Allow-Origin","*");res.setHeader("Access-Control-Allow-Methods","POST,OPTIONS");res.setHeader("Access-Control-Allow-Headers","Content-Type");
  if(req.method==="OPTIONS")return res.status(200).end();
  const SU=process.env.SUPABASE_URL,SK=process.env.SUPABASE_ANON_KEY;
  const{action,data}=req.body||{};
  if(action==="ping"){if(!SU||!SK)return res.json({ok:false,error:"Supabase não configurado"});return res.json({ok:true,message:"Supabase configurado!"});}
  if(!SU||!SK)return res.json({ok:false,error:"SUPABASE_URL e SUPABASE_ANON_KEY não configurados"});
  try{
    const r=await fetch(`${SU}/rest/v1/clicks`,{method:"POST",headers:{"Content-Type":"application/json",apikey:SK,Authorization:`Bearer ${SK}`,Prefer:"return=minimal"},body:JSON.stringify(data||{})});
    return res.json({ok:r.status<300});
  }catch(e){return res.status(500).json({ok:false,error:e.message});}
}