export default async function handler(req,res){
  res.setHeader("Access-Control-Allow-Origin","*");res.setHeader("Access-Control-Allow-Methods","POST,OPTIONS");res.setHeader("Access-Control-Allow-Headers","Content-Type");
  if(req.method==="OPTIONS")return res.status(200).end();
  const K=process.env.GROQ_API_KEY;if(!K)return res.json({ok:false,error:"GROQ_API_KEY não configurada"});
  const{url,productName,price,store}=req.body||{};
  try{
    const r=await fetch("https://api.groq.com/openai/v1/chat/completions",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${K}`},body:JSON.stringify({model:"openai/gpt-oss-120b",max_tokens:500,messages:[{role:"system",content:"Especialista em marketing de afiliados. Responda em JSON válido."},{role:"user",content:`Produto:${productName},Preço:${price},Loja:${store},URL:${url}. Gere JSON: {"title":"...","description":"...","hashtags":"#tag1 #tag2 #tag3 #tag4 #tag5"}`}]})});
    const d=await r.json();const text=d.choices?.[0]?.message?.content||"{}";
    const clean=text.replace(/\`\`\`json|\`\`\`/g,"").trim();
    return res.json({ok:true,...JSON.parse(clean)});
  }catch(e){return res.status(500).json({ok:false,error:e.message});}
}