export default async function handler(req,res){
  res.setHeader("Access-Control-Allow-Origin","*");res.setHeader("Access-Control-Allow-Methods","POST,OPTIONS");res.setHeader("Access-Control-Allow-Headers","Content-Type");
  if(req.method==="OPTIONS")return res.status(200).end();
  const{category,limit}=req.body||{};
  try{
    const r=await fetch(`https://api.mercadolibre.com/sites/MLB/search?category=${category||"MLB1051"}&sort=relevance&limit=${limit||20}`);
    const d=await r.json();
    const items=(d.results||[]).filter(i=>i.original_price&&i.original_price>i.price).sort((a,b)=>Math.round((1-b.price/b.original_price)*100)-Math.round((1-a.price/a.original_price)*100)).slice(0,12).map(i=>({id:i.id,name:i.title,price:`R$ ${i.price.toFixed(2).replace(".",",")}`,original:`R$ ${i.original_price.toFixed(2).replace(".",",")}`,discount:Math.round((1-i.price/i.original_price)*100),url:i.permalink,thumb:i.thumbnail?.replace("http://","https://"),store:"Mercado Livre",freeShip:i.shipping?.free_shipping,sold:i.sold_quantity||0}));
    return res.json({ok:true,items});
  }catch(e){return res.status(500).json({ok:false,error:e.message});}
}