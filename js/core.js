// ===== CORE: state, helpers, tính toán, quyết định, rủi ro, giá, đồng bộ =====
const LS_KEY='dashboard-dau-tu-v2';
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const uid=()=>Math.random().toString(36).slice(2,9);
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const today=()=>new Date().toISOString().slice(0,10);
const dayMs=864e5;
const toT=d=>new Date(d+'T00:00:00').getTime();
const daysAgo=n=>new Date(Date.now()-n*dayMs).toISOString().slice(0,10);
const daysBetween=(a,b)=>Math.round((toT(b)-toT(a))/dayMs);
const n$=(n,d=0)=>(n<0?'-':'')+'$'+Math.abs(n).toLocaleString('en-US',{maximumFractionDigits:d});
const nP=n=>{n=+n;if(!isFinite(n))return '—';const a=Math.abs(n);return '$'+n.toLocaleString('en-US',{maximumFractionDigits:a>=100?2:a>=1?3:a>=0.01?5:8})};
const pct=(n,d=1)=>(n>=0?'+':'')+(n*100).toFixed(d)+'%';
const cls=n=>n>0?'pos':n<0?'neg':'mut';
const fd=d=>d?d.split('-').reverse().join('/'):'';
const COLORS=['#f7931a','#3b82f6','#a855f7','#22c55e','#ec4899','#14b8a6','#eab308','#ef4444','#64748b','#f97316'];

// ---------- Trạng thái ----------
function demo(){
  const cats=[
    {id:'btc',name:'BTC',color:'#f7931a',tp:0.5,sl:0.2,maxDays:9999,maxPos:50,cut:'review'},
    {id:'alt',name:'Altcoin',color:'#3b82f6',tp:0.4,sl:0.15,maxDays:180,maxPos:15,cut:'half'},
    {id:'gem',name:'Gem / Low cap',color:'#a855f7',tp:1.0,sl:0.3,maxDays:120,maxPos:5,cut:'all'},
    {id:'meme',name:'Meme',color:'#22c55e',tp:0.8,sl:0.35,maxDays:45,maxPos:3,cut:'all'}
  ];
  const P=(id,cat,name,sym,price,extra={})=>Object.assign({id,cat,name,sym,price,mcap:'',trend:'side',note:'',tp:0,sl:0,cg:'',contract:'',chain:''},extra);
  const projects=[
    P('p1','btc','Bitcoin','BTC',65600,{cg:'bitcoin',mcap:'$1.3T',trend:'up'}),
    P('p2','alt','Ethereum','ETH',1720,{cg:'ethereum',mcap:'$207B',trend:'up'}),
    P('p3','alt','Solana','SOL',70.9,{cg:'solana',mcap:'$40B',trend:'side'}),
    P('p4','gem','Ví dụ Gem AI','GEMAI',0.42,{mcap:'$38M',trend:'up',note:'Dữ liệu mẫu - hãy xoá'}),
    P('p5','meme','COOL (Arc)','COOL',0.0021,{mcap:'$2M',trend:'down',note:'Dữ liệu mẫu - hãy xoá'})
  ];
  const T=(pid,type,d,qty,price)=>({id:uid(),pid,type,date:daysAgo(d),qty,price,fee:0});
  const trades=[T('p1','buy',200,0.05,61000),T('p1','buy',90,0.03,64000),T('p2','buy',120,1.2,1500),T('p3','buy',60,20,62),
    T('p4','buy',70,3000,0.25),T('p5','buy',30,400000,0.0016),T('p5','sell',10,100000,0.0028)];
  return {v:2,settings:{cash:2000,riskPct:1,vnd:26000,gistToken:'',gistId:'',lastSync:''},cats,projects,trades,
    plans:[],journal:[],rules:[{id:uid(),text:'Không FOMO mua đuổi sau khi giá đã tăng >30% trong 24h'},{id:uid(),text:'Luôn đặt SL trước khi vào lệnh'}],
    market:{trend:'side',summary:'',news:[],narratives:[
      {id:uid(),name:'AI',dir:'up',conf:2,note:''},{id:uid(),name:'RWA',dir:'up',conf:2,note:''},
      {id:uid(),name:'Meme Solana',dir:'side',conf:1,note:''},{id:uid(),name:'Stablecoin payments',dir:'up',conf:2,note:''}],
      notes:'',fng:null,btcDom:null,btcPrice:null},
    airdrops:[],equity:[],demo:true};
}
let S=load();
function load(){
  try{const j=localStorage.getItem(LS_KEY);if(j){const s=JSON.parse(j);if(s&&s.v===2)return s}}catch(e){}
  return demo();
}
function save(){try{localStorage.setItem(LS_KEY,JSON.stringify(S))}catch(e){}}
function toast(m){const t=$('#toast');t.textContent=m;t.style.display='block';clearTimeout(toast.t);toast.t=setTimeout(()=>t.style.display='none',2500)}

// ---------- Tính vị thế ----------
function position(pid){
  const ts=S.trades.filter(t=>t.pid===pid).sort((a,b)=>a.date.localeCompare(b.date));
  let qty=0,cost=0,realized=0,bought=0,first=null,closeDate=null,trips=[],tripBought=0,tripPnl=0,tripStart=null;
  ts.forEach(t=>{
    const q=+t.qty||0,p=+t.price||0,f=+t.fee||0;
    if(t.type==='buy'){
      if(qty<=1e-12){tripStart=t.date;tripBought=0;tripPnl=0}
      cost+=q*p+f;qty+=q;bought+=q*p+f;tripBought+=q*p+f;if(!first)first=t.date;closeDate=null;
    }else{
      const sq=Math.min(q,qty),avg=qty>0?cost/qty:p,pnl=sq*p-f-avg*sq;
      realized+=pnl;tripPnl+=pnl;cost-=avg*sq;qty-=sq;
      if(qty<=1e-12){qty=0;cost=0;closeDate=t.date;trips.push({pid,start:tripStart,end:t.date,bought:tripBought,pnl:tripPnl})}
    }
  });
  return {qty,cost,avg:qty>0?cost/qty:0,realized,bought,first,last:ts.length?ts[ts.length-1].date:null,closeDate,trips,trades:ts,closed:!!closeDate&&qty===0};
}
const getCat=id=>S.cats.find(c=>c.id===id)||{id,name:'?',color:'#64748b',tp:0.5,sl:0.2,maxDays:180,maxPos:10,cut:'review'};
function holdings(){
  return S.projects.map(p=>{
    const pos=position(p.id),cat=getCat(p.cat),price=+p.price||0;
    const value=pos.qty*price,pnl=price&&pos.avg?price/pos.avg-1:0;
    const tpP=p.tp>0?+p.tp:pos.avg*(1+cat.tp),slP=p.sl>0?+p.sl:pos.avg*(1-cat.sl);
    return {p,pos,cat,price,value,pnl,unreal:value-pos.cost,tpP,slP,days:pos.first&&pos.qty>0?daysBetween(pos.first,today()):0};
  });
}
function totals(){
  const hs=holdings();
  const invested=hs.reduce((s,h)=>s+h.value,0),cost=hs.reduce((s,h)=>s+h.pos.cost,0);
  const cash=+S.settings.cash||0,equity=invested+cash;
  const realized=hs.reduce((s,h)=>s+h.pos.realized,0);
  return {hs,invested,cost,cash,equity,unreal:invested-cost,realized};
}
function snapshotEquity(){
  const t=totals(),d=today();
  if(t.equity<=0)return;
  const last=S.equity[S.equity.length-1];
  if(last&&last.d===d)last.v=t.equity;else S.equity.push({d,v:t.equity});
  if(S.equity.length>1500)S.equity.shift();
}

// ---------- Rủi ro ----------
function risk(){
  const t=totals(),hs=t.hs.filter(h=>h.pos.qty>0&&h.value>0);
  const eq=t.equity||1;
  const top=hs.slice().sort((a,b)=>b.value-a.value)[0];
  const topPct=top?top.value/eq:0;
  const maxLoss=hs.reduce((s,h)=>s+Math.max(0,h.value-h.pos.qty*h.slP),0);
  const byCat={};hs.forEach(h=>byCat[h.cat.id]=(byCat[h.cat.id]||0)+h.value);
  const riskyShare=hs.filter(h=>['meme','gem'].includes(h.cat.id)).reduce((s,h)=>s+h.value,0)/eq;
  const cashPct=t.cash/eq;
  let score=Math.min(100,Math.round(topPct*60+maxLoss/eq*150+riskyShare*80+(cashPct<0.1?10:0)));
  const level=score>=65?['Cao','neg']:score>=40?['Trung bình','warn']:['Thấp','pos'];
  const issues=[];
  hs.forEach(h=>{const w=h.value/eq*100;if(w>h.cat.maxPos&&h.cat.id!=='btc')issues.push(`${h.p.sym||h.p.name} chiếm ${w.toFixed(1)}% vốn, vượt trần ${h.cat.maxPos}% của nhóm ${h.cat.name}`)});
  if(cashPct<0.1)issues.push(`Tiền mặt chỉ ${(cashPct*100).toFixed(0)}% - thấp hơn 10%, khó bắt cơ hội/ứng phó`);
  if(maxLoss/eq>0.2)issues.push(`Nếu tất cả chạm SL sẽ mất ${(maxLoss/eq*100).toFixed(0)}% vốn (>20%)`);
  return {score,level,topPct,top,maxLoss,maxLossPct:maxLoss/eq,byCat,riskyShare,cashPct,issues,eq};
}

// ---------- Động cơ quyết định ----------
function decide(h){
  const out=[],{p,pos,cat}=h;
  if(pos.qty<=0)return out;
  const mkt=S.market.trend,tpAdj=mkt==='down'?0.7:1;
  const tpP=h.tpP,slP=h.slP,price=h.price;
  if(!price){out.push({lvl:'warn',text:'Chưa có giá hiện tại - hãy nhập/cập nhật giá'});return out}
  const R=pos.avg-slP>0?(price-pos.avg)/(pos.avg-slP):0;
  const tpEff=pos.avg+(tpP-pos.avg)*tpAdj;
  const sold=pos.trades.some(t=>t.type==='sell');
  if(price<=slP){
    const m={all:'CẮT HẾT',half:'CẮT 50%',review:'XEM XÉT cắt'}[cat.cut];
    out.push({lvl:'cut',text:`Chạm SL ${nP(slP)} (${pct(h.pnl)}) → ${m} theo quy tắc nhóm ${cat.name}`});
  }else if((price-slP)/price<0.1){
    out.push({lvl:'warn',text:`Cách SL chỉ ${(((price-slP)/price)*100).toFixed(1)}% - chuẩn bị kịch bản cắt`});
  }
  if(price>=tpEff){
    out.push({lvl:'sell',text:`Chạm TP ${nP(tpEff)}${tpAdj<1?' (đã siết vì thị trường xấu)':''} → chốt phần lớn, dời SL lên hoà vốn`});
  }else if(R>=2&&!sold){out.push({lvl:'sell',text:`Lãi +${R.toFixed(1)}R → bán 1/3 vị thế, dời SL lên hoà vốn`})}
  else if(R>=1&&!sold){out.push({lvl:'sell',text:`Lãi +${R.toFixed(1)}R → cân nhắc bán 1/3 để khoá lợi nhuận`})}
  if(h.days>cat.maxDays&&Math.abs(h.pnl)<0.1)out.push({lvl:'warn',text:`Nắm ${h.days} ngày (> ${cat.maxDays}) mà gần như đi ngang → xem xét giải phóng vốn`});
  if(p.trend==='down'&&h.pnl<0&&!out.length)out.push({lvl:'warn',text:'Xu hướng dự án đang giảm và đang lỗ - cần luận điểm rõ để giữ'});
  if(!out.length)out.push({lvl:'hold',text:`Giữ - trong vùng an toàn (${pct(h.pnl)}, ${R.toFixed(1)}R)`});
  return out;
}
function allActions(){
  const list=[];
  holdings().forEach(h=>decide(h).forEach(d=>{if(d.lvl!=='hold')list.push({h,...d})}));
  const w={cut:0,sell:1,warn:2,buy:3};
  return list.sort((a,b)=>w[a.lvl]-w[b.lvl]);
}
function overallDecision(){
  const r=risk(),acts=allActions(),m=S.market.trend;
  const cuts=acts.filter(a=>a.lvl==='cut'),sells=acts.filter(a=>a.lvl==='sell');
  let s='';
  if(cuts.length)s+=`Ưu tiên 1: xử lý ${cuts.map(c=>c.h.p.sym||c.h.p.name).join(', ')} (chạm SL). `;
  if(sells.length)s+=`Ưu tiên 2: chốt lời ${sells.map(c=>c.h.p.sym||c.h.p.name).join(', ')}. `;
  if(r.score>=65)s+='Rủi ro tổng thể cao - KHÔNG mở vị thế mới, giảm các vị thế vượt trần. ';
  else if(m==='down')s+='Thị trường xấu: chỉ giữ tiền mặt, DCA BTC nhỏ, tránh meme/gem mới. ';
  else if(m==='up'&&r.cashPct>0.1)s+='Thị trường tốt và còn tiền mặt: có thể giải ngân từng phần theo kế hoạch. ';
  if(!s)s='Không có tín hiệu khẩn cấp. Duy trì kế hoạch, kiểm tra lại khi có tin lớn.';
  return s.trim();
}
// Gợi ý khối lượng mua
function sizeCalc(equity,riskPct,entry,sl,maxPos,cash,mult){
  if(!(entry>0&&sl>0&&entry>sl))return {usd:0,note:'Cần giá vào > SL'};
  const slDist=(entry-sl)/entry;
  const byRisk=equity*riskPct/100/slDist,byPos=equity*maxPos/100;
  let usd=Math.min(byRisk,byPos,cash)*mult;
  return {usd,byRisk,byPos,slDist,note:usd<=0?'Không đủ điều kiện':''};
}

// ---------- Thống kê ----------
function stats(){
  const trips=[];S.projects.forEach(p=>{const pos=position(p.id);const c=getCat(p.cat);pos.trips.forEach(t=>trips.push({...t,cat:c,R:t.bought>0?t.pnl/(t.bought*c.sl):0,name:p.name}))});
  const wins=trips.filter(t=>t.pnl>0),loss=trips.filter(t=>t.pnl<=0);
  const gw=wins.reduce((s,t)=>s+t.pnl,0),gl=Math.abs(loss.reduce((s,t)=>s+t.pnl,0));
  const exp=trips.length?trips.reduce((s,t)=>s+t.R,0)/trips.length:0;
  let peak=0,mdd=0;S.equity.forEach(e=>{peak=Math.max(peak,e.v);if(peak>0)mdd=Math.min(mdd,e.v/peak-1)});
  return {trips,n:trips.length,wins:wins.length,loss:loss.length,winRate:trips.length?wins.length/trips.length:0,exp,pf:gl>0?gw/gl:(gw>0?Infinity:0),mdd,total:trips.reduce((s,t)=>s+t.pnl,0)};
}

// ---------- Giá & dữ liệu thị trường (API miễn phí, lỗi thì bỏ qua) ----------
async function jf(url,ms=8000){const c=new AbortController();const t=setTimeout(()=>c.abort(),ms);try{const r=await fetch(url,{signal:c.signal});if(!r.ok)throw 0;return await r.json()}finally{clearTimeout(t)}}
async function refreshPrices(silent){
  let ok=0,fail=0;
  const cg=S.projects.filter(p=>p.cg),dex=S.projects.filter(p=>p.contract),bn=S.projects.filter(p=>!p.cg&&!p.contract&&p.sym&&p.autoBinance);
  try{
    if(cg.length){const j=await jf('https://api.coingecko.com/api/v3/simple/price?vs_currencies=usd&ids='+cg.map(p=>p.cg).join(','));
      cg.forEach(p=>{if(j[p.cg]&&j[p.cg].usd){p.price=j[p.cg].usd;p.priceAt=Date.now();ok++}else fail++})}
  }catch(e){fail+=cg.length}
  for(const p of dex){try{const j=await jf('https://api.dexscreener.com/latest/dex/tokens/'+p.contract);const pr=j.pairs&&j.pairs.sort((a,b)=>(b.liquidity?.usd||0)-(a.liquidity?.usd||0))[0];
    if(pr&&pr.priceUsd){p.price=+pr.priceUsd;p.priceAt=Date.now();if(pr.fdv)p.mcap='$'+fmtBig(pr.fdv);ok++}else fail++}catch(e){fail++}}
  for(const p of bn){try{const j=await jf('https://api.binance.com/api/v3/ticker/price?symbol='+p.sym.toUpperCase()+'USDT');p.price=+j.price;p.priceAt=Date.now();ok++}catch(e){fail++}}
  await refreshMarket();
  snapshotEquity();save();
  if(!silent)toast(`Cập nhật giá: ${ok} thành công${fail?`, ${fail} lỗi (nhập tay)`:''}`);
  return ok;
}
function fmtBig(n){return n>=1e12?(n/1e12).toFixed(2)+'T':n>=1e9?(n/1e9).toFixed(2)+'B':n>=1e6?(n/1e6).toFixed(1)+'M':n>=1e3?(n/1e3).toFixed(0)+'K':String(Math.round(n))}
async function refreshMarket(){
  try{const j=await jf('https://api.alternative.me/fng/?limit=1');S.market.fng={v:+j.data[0].value,c:j.data[0].value_classification}}catch(e){}
  try{const j=await jf('https://api.coingecko.com/api/v3/global');S.market.btcDom=j.data.market_cap_percentage.btc;S.market.totalCap=j.data.total_market_cap.usd}catch(e){}
  try{const j=await jf('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT');S.market.btcPrice=+j.price}catch(e){}
  try{const j=await jf('https://open.er-api.com/v6/latest/USD');if(j.rates.VND)S.settings.vnd=j.rates.VND}catch(e){}
}
async function fetchNews(){
  try{const j=await jf('https://min-api.cryptocompare.com/data/v2/news/?lang=EN');
    S.market.news=j.Data.slice(0,8).map(n=>({title:n.title,url:n.url,date:new Date(n.published_on*1000).toISOString().slice(0,10),src:n.source}));save();toast('Đã tải tin mới')}
  catch(e){toast('Không tải được tin - hãy nhập tay')}
}

// ---------- Xuất / nhập / Gist ----------
function exportJSON(){
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(S,null,1)],{type:'application/json'}));
  a.download='dau-tu-backup-'+today()+'.json';a.click();
}
function importJSON(file){
  const r=new FileReader();r.onload=()=>{try{const s=JSON.parse(r.result);if(s.v!==2)throw 0;S=s;save();App.render();toast('Đã nhập dữ liệu')}catch(e){alert('File không hợp lệ')}};r.readAsText(file);
}
async function gist(act){
  const st=S.settings;if(!st.gistToken){alert('Nhập GitHub token (quyền gist) trong Cài đặt');return}
  const H={Authorization:'token '+st.gistToken,Accept:'application/vnd.github+json'};
  try{
    if(act==='push'){
      const body={description:'dashboard-dau-tu data',public:false,files:{'data.json':{content:JSON.stringify(S)}}};
      const r=await fetch(st.gistId?'https://api.github.com/gists/'+st.gistId:'https://api.github.com/gists',{method:st.gistId?'PATCH':'POST',headers:H,body:JSON.stringify(body)});
      if(!r.ok)throw 0;const j=await r.json();st.gistId=j.id;st.lastSync=new Date().toLocaleString('vi-VN');save();toast('Đã đẩy dữ liệu lên Gist')
    }else{
      if(!st.gistId){alert('Chưa có Gist ID');return}
      const r=await fetch('https://api.github.com/gists/'+st.gistId,{headers:H});if(!r.ok)throw 0;const j=await r.json();
      const d=JSON.parse(j.files['data.json'].content);const keep={gistToken:st.gistToken,gistId:st.gistId};
      S=d;S.settings=Object.assign(S.settings||{},keep);S.settings.lastSync=new Date().toLocaleString('vi-VN');save();App.render();toast('Đã kéo dữ liệu từ Gist')
    }
  }catch(e){alert('Đồng bộ Gist lỗi - kiểm tra token/ID/mạng')}
}
