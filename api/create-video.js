export default async function handler(req,res){
  res.setHeader("Access-Control-Allow-Origin","*");res.setHeader("Access-Control-Allow-Methods","POST,GET,OPTIONS");res.setHeader("Access-Control-Allow-Headers","Content-Type");
  if(req.method==="OPTIONS")return res.status(200).end();
  const J2V=process.env.JSON2VIDEO_API_KEY,DID=process.env.DID_API_KEY;
  const{action}=req.query;
  try{
    if(action==="check"){const{movieId}=req.query;if(!movieId)return res.status(400).json({ok:false,error:"movieId required"});if(!J2V)return res.json({ok:false,error:"JSON2VIDEO_API_KEY não configurada"});const r=await fetch(`https://api.json2video.com/v2/movies?movie=${movieId}`,{headers:{"x-api-key":J2V}});const d=await r.json();const m=d.movie||{};return res.json({ok:true,status:m.status,url:m.url,thumbnail:m.thumbnail,progress:m.status==="done"?100:m.status==="rendering"?60:20});}
    if(action==="avatar"||(req.body?.mode==="avatar")){const{script,avatar,lang}=req.body||{};if(!DID)return res.json({ok:false,error:"DID_API_KEY não configurada no Vercel"});const AVATARS={ana:"https://d-id-public-bucket.s3.amazonaws.com/or-roman.jpg",carlos:"https://d-id-public-bucket.s3.amazonaws.com/Elon_Musk.jpeg",julia:"https://d-id-public-bucket.s3.amazonaws.com/amy.jpeg",pedro:"https://d-id-public-bucket.s3.amazonaws.com/or-roman.jpg"};const r=await fetch("https://api.d-id.com/talks",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Basic ${DID}`},body:JSON.stringify({source_url:AVATARS[avatar]||AVATARS.ana,script:{type:"text",input:script,language:lang||"pt-BR"},config:{fluent:true,pad_audio:0.5}})});const d=await r.json();if(d.id)return res.json({ok:true,jobId:d.id,status:"processing"});return res.json({ok:false,error:d.description||"Erro ao criar avatar"});}
    if(!J2V)return res.json({ok:false,error:"JSON2VIDEO_API_KEY não configurada no Vercel"});
    const body=req.body||{};const r=await fetch("https://api.json2video.com/v2/movies",{method:"POST",headers:{"x-api-key":J2V,"Content-Type":"application/json"},body:JSON.stringify(body.payload||{comment:"AfiliadoAI",width:1080,height:1920,scenes:[{duration:5,elements:[{type:"text",text:body.text||"Oferta!",x:"center",y:"center",width:"80%",style:{fontSize:60,color:"#fff"}}]}]})});const d=await r.json();
    if(d.movie)return res.json({ok:true,movieId:d.movie,status:"queued"});
    return res.json({ok:false,error:d.message||"Erro ao criar vídeo"});
  }catch(e){return res.status(500).json({ok:false,error:e.message});}
}