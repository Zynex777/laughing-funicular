export default async function handler(req,res){
  res.setHeader("Access-Control-Allow-Origin","*");res.setHeader("Access-Control-Allow-Methods","POST,OPTIONS");res.setHeader("Access-Control-Allow-Headers","Content-Type");
  if(req.method==="OPTIONS")return res.status(200).end();
  const K=process.env.GROQ_API_KEY;
  if(!K)return res.json({ok:false,error:"GROQ_API_KEY não configurada no Vercel"});
  const{prompt}=req.body||{};
  if(!prompt)return res.json({ok:false,error:"prompt obrigatório"});
  try{
    const r=await fetch("https://api.groq.com/openai/v1/chat/completions",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${K}`},body:JSON.stringify({model:"openai/gpt-oss-120b",max_tokens:1000,messages:[{role:"system",content:"Você é ARIA, assistente de marketing de afiliados brasileiro. Responda sempre em português do Brasil."},{role:"user",content:prompt}]})});
    const d=await r.json();const result=d.choices?.[0]?.message?.content;
    if(result)return res.json({ok:true,result});
    return res.json({ok:false,error:d.error?.message||"Sem resposta da IA"});
  }catch(e){return res.status(500).json({ok:false,error:e.message});}
}