// ===== Tab cuối: DCA BTC (chuyển từ dự án dca-btc, giữ mã hoá bằng mật khẩu cũ) =====
const DCA=(()=>{
  const b64=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
  const tob64=a=>btoa(String.fromCharCode(...new Uint8Array(a)));
  async function deriveKey(pw){const km=await crypto.subtle.importKey('raw',new TextEncoder().encode(pw),'PBKDF2',false,['deriveKey']);
    return crypto.subtle.deriveKey({name:'PBKDF2',salt:b64(ENC.salt),iterations:ENC.iter,hash:'SHA-256'},km,{name:'AES-GCM',length:256},true,['encrypt','decrypt'])}
  async function decObj(key,o){const pt=await crypto.subtle.decrypt({name:'AES-GCM',iv:b64(o.iv)},key,b64(o.ct));return JSON.parse(new TextDecoder().decode(pt))}
  async function encObj(key,data){const iv=crypto.getRandomValues(new Uint8Array(12));const ct=await crypto.subtle.encrypt({name:'AES-GCM',iv},key,new TextEncoder().encode(JSON.stringify(data)));return{iv:tob64(iv),ct:tob64(ct)}}
  let KEY=null,SEED={buys:[],plans:[]},buys=[],plans=[],unlocked=false,chart=null,timer=null;
  let open=JSON.parse(localStorage.getItem('dca_open')||'{}');
  let curPrice=parseFloat(localStorage.getItem('dca_price'))||null;
  let lastEdited=[];
  const g=id=>document.getElementById(id);
  const vndRate=()=>S.settings.vnd||26000;
  const f$=n=>'$'+n.toLocaleString('en-US',{maximumFractionDigits:0});
  const f$2=n=>'$'+n.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
  const fB=n=>n.toFixed(8);
  const fV=n=>{const v=n*vndRate(),s=v<0?'-':'',a=Math.abs(v);
    if(a>=1e9)return s+'≈ '+(a/1e9).toLocaleString('vi-VN',{maximumFractionDigits:2})+' tỷ ₫';
    if(a>=1e6)return s+'≈ '+(a/1e6).toLocaleString('vi-VN',{maximumFractionDigits:1})+' triệu ₫';
    return s+'≈ '+a.toLocaleString('vi-VN',{maximumFractionDigits:0})+' ₫'};
  const mk=d=>{const[y,m]=d.split('-');return parseInt(m)+'/'+y};
  function persist(){localStorage.setItem('dca_open',JSON.stringify(open));if(!KEY)return;
    encObj(KEY,buys).then(o=>localStorage.setItem('dca_buys_e',JSON.stringify(o)));encObj(KEY,plans).then(o=>localStorage.setItem('dca_plans_e',JSON.stringify(o)))}
  const tot=list=>{const inv=list.reduce((s,b)=>s+b.usd,0),btc=list.reduce((s,b)=>s+b.usd/b.price,0);return{inv,btc,avg:btc?inv/btc:0}};

  function shell(el){
    el.innerHTML=`
    <div id="dcaLock" class="card ${unlocked?'hide':''}"><h2>🔒 ₿ DCA Bitcoin</h2><p class="mut">Nhập mật khẩu DCA (mật khẩu cũ của dự án dca-btc) để mở khoá</p>
      <input type="password" id="dPw" placeholder="Mật khẩu"><button style="width:100%" onclick="DCA.login()">Mở khoá</button><div id="dErr" class="neg" style="margin-top:8px;min-height:1em"></div></div>
    <div id="dApp" class="${unlocked?'':'hide'}">
     <div class="row" style="justify-content:space-between"><div><h2 style="color:var(--orange);font-size:1.15rem">₿ DCA Bitcoin Tracker</h2><div class="mut" style="margin-bottom:12px">Mục tiêu: 2.1 BTC — Giữ 10 năm, không bán. Dữ liệu được mã hoá bằng mật khẩu của bạn.</div></div><button class="ghost sm" onclick="DCA.logout()" style="align-self:flex-start">Đăng xuất 🔒</button></div>
     <div class="kpis">
      <div class="kpi"><div class="l">Tổng đã đầu tư</div><div class="v" id="cInv">—</div><div class="s" id="vInv"></div></div>
      <div class="kpi"><div class="l">Tổng BTC</div><div class="v" id="cBtc">—</div></div>
      <div class="kpi" style="border-color:var(--orange)"><div class="l">Giá trung bình DCA</div><div class="v" style="color:var(--orange)" id="cAvg">—</div><div class="s" id="vAvg"></div></div>
      <div class="kpi"><div class="l">Giá BTC hiện tại</div><div class="v" id="cPrice">—</div><div class="s" id="vPrice"></div><div class="s" id="priceNote"></div></div>
      <div class="kpi"><div class="l">Giá trị hiện tại</div><div class="v" id="cVal">—</div><div class="s" id="vVal"></div></div>
      <div class="kpi"><div class="l">Lãi / Lỗ</div><div class="v" id="cPnl">—</div><div class="s" id="vPnl"></div></div>
      <div class="kpi"><div class="l">Tiến độ 2.1 BTC</div><div class="v" id="cGoal">—</div><div class="bar" style="margin-top:6px"><i id="goalBar" style="width:0"></i></div></div></div>
     <div class="card"><h2>📅 Kế hoạch DCA thời gian tới (theo tháng)</h2><div id="planSummary" class="plan" style="margin-bottom:12px;border-color:var(--orange)"></div><div class="plan-grid" id="planGrid"></div>
      <div class="row" style="margin-top:12px"><div class="f" style="max-width:160px"><label>Tháng (vd: 11/2026)</label><input id="planMonth" placeholder="11/2026"></div><div class="f" style="max-width:160px"><label>Kế hoạch (USD)</label><input type="number" id="planAmt" placeholder="2500"></div><button class="ghost" onclick="DCA.addPlan()">+ Thêm tháng</button></div></div>
     <div class="card"><h2>➕ Thêm lần mua — nhập 2 trong 3 ô, ô còn lại tự tính</h2><div class="row">
      <div class="f"><label>Ngày</label><input type="date" id="inDate"></div><div class="f"><label>Số tiền (USDT)</label><input type="number" id="inUsd" step="any" oninput="DCA.calc3('inUsd')"></div>
      <div class="f"><label>Giá BTC (USD)</label><input type="number" id="inPrice" step="any" oninput="DCA.calc3('inPrice')"></div><div class="f"><label>Số lượng BTC</label><input type="number" id="inBtc" step="any" oninput="DCA.calc3('inBtc')"></div>
      <div class="f"><label>Ghi chú</label><input id="inNote"></div><button onclick="DCA.addBuy()">Mua ✓</button></div><div class="mut" id="btcPreview" style="margin-top:4px"></div></div>
     <div class="card"><h2>📋 Nhật ký mua theo tháng</h2><div class="row" style="margin-bottom:10px"><button class="ghost sm" onclick="DCA.setAll(true)">Mở tất cả</button><button class="ghost sm" onclick="DCA.setAll(false)">Thu gọn</button><button class="ghost sm" onclick="DCA.exportCSV()">⬇ Xuất CSV</button>
      <label class="ghost sm" style="cursor:pointer;border:1px solid var(--border);padding:3px 9px;border-radius:8px;margin:0;color:var(--muted)">⬆ Nhập CSV (lần mua mới từ web cũ)<input type="file" accept=".csv" class="hide" onchange="DCA.importCSV(this.files[0])"></label><button class="ghost sm" onclick="DCA.reset()">↺ Khôi phục dữ liệu gốc</button></div>
      <table id="dTbl"><thead><tr><th>Ngày / Tháng</th><th class="num">Số tiền</th><th class="num">Giá BTC</th><th class="num">BTC nhận</th><th>Ghi chú</th><th></th></tr></thead><tbody></tbody></table></div>
     <div class="card"><h2>📈 Biểu đồ giá mua & giá trung bình DCA</h2><canvas id="dChart" style="max-height:300px"></canvas></div></div>`;
    const pw=g('dPw');if(pw)pw.addEventListener('keydown',e=>{if(e.key==='Enter')login()});
    if(unlocked){g('inDate').valueAsDate=new Date();draw()}
  }
  function draw(){
    if(!g('cInv'))return;
    buys.sort((a,b)=>a.date.localeCompare(b.date));
    const t=tot(buys);
    g('cInv').textContent=f$2(t.inv);g('vInv').textContent=fV(t.inv);g('cBtc').textContent=fB(t.btc)+' ₿';
    g('cAvg').textContent=t.avg?f$(t.avg):'—';g('vAvg').textContent=t.avg?fV(t.avg):'';
    g('cGoal').textContent=(t.btc/2.1*100).toFixed(2)+'%';g('goalBar').style.width=Math.min(100,t.btc/2.1*100)+'%';
    if(curPrice){g('cPrice').textContent=f$(curPrice);g('vPrice').textContent=fV(curPrice);
      const val=t.btc*curPrice,pnl=val-t.inv;g('cVal').textContent=f$2(val);g('vVal').textContent=fV(val);
      const e=g('cPnl');e.textContent=(pnl>=0?'+':'')+f$2(pnl)+' ('+(t.inv?pnl/t.inv*100:0).toFixed(1)+'%)';e.className='v '+(pnl>=0?'pos':'neg');g('vPnl').textContent=fV(pnl)}
    const order=[],by={};buys.forEach((b,i)=>{const k=mk(b.date);if(!by[k]){by[k]=[];order.push(k)}by[k].push({...b,idx:i})});
    const last=order[order.length-1],tb=document.querySelector('#dTbl tbody');tb.innerHTML='';
    tb.insertAdjacentHTML('beforeend',`<tr class="grand"><td>★ TỔNG TẤT CẢ — ${buys.length} lần mua</td><td class="num">${f$2(t.inv)}</td><td class="num">TB ${f$(t.avg)}</td><td class="num">${fB(t.btc)}</td><td colspan="2"></td></tr>`);
    order.forEach(k=>{const gr=by[k],gt=tot(gr),isOpen=(k in open)?open[k]:(k===last);
      tb.insertAdjacentHTML('beforeend',`<tr class="month-row" onclick="DCA.toggle('${k}')"><td><span class="caret ${isOpen?'open':''}">▶</span> THÁNG ${k} — ${gr.length} lần</td><td class="num">${f$2(gt.inv)}</td><td class="num">TB ${f$(gt.avg)}</td><td class="num">${fB(gt.btc)}</td><td colspan="2"></td></tr>`);
      if(isOpen)gr.forEach(b=>tb.insertAdjacentHTML('beforeend',`<tr><td style="padding-left:26px">${b.date.split('-').reverse().join('/')}</td><td class="num">${f$2(b.usd)}</td><td class="num">${f$(b.price)}</td><td class="num">${fB(b.usd/b.price)}</td><td>${esc(b.note||'')}</td><td class="del" onclick="DCA.del(${b.idx},event)">✕</td></tr>`))});
    plans.sort((a,b)=>{const[ma,ya]=a.month.split('/'),[mb,yb]=b.month.split('/');return(ya-yb)||(ma-mb)});
    const now=new Date(),cur=now.getFullYear()*12+now.getMonth()+1,mN=m=>{const[mm,yy]=m.split('/');return parseInt(yy)*12+parseInt(mm)};
    let tp=0,td=0,tl=0;
    g('planGrid').innerHTML=plans.map((p,pi)=>{const done=buys.filter(b=>mk(b.date)===p.month).reduce((s,b)=>s+b.usd,0),left=Math.max(0,p.amt-done);
      if(mN(p.month)<cur)return '';tp+=p.amt;td+=Math.min(done,p.amt);tl+=left;
      const st=done>=p.amt?['done','✔ Hoàn thành']:done>0?['doing','⏳ Đang mua']:['todo','Chưa bắt đầu'];
      return `<div class="plan"><span class="tag ${st[0]}">${st[1]}</span><b>Tháng ${p.month}</b><br>Kế hoạch: <input type="number" value="${p.amt}" step="any" style="width:90px;padding:3px 6px" onchange="DCA.updPlan(${pi},this.value)"> USDT<br>Đã mua: ${f$(done)} · Còn lại: <b>${f$(left)}</b><div class="bar" style="margin-top:6px"><i style="width:${Math.min(100,done/p.amt*100)}%"></i></div></div>`}).join('');
    g('planSummary').innerHTML=`<b>TỔNG KẾ HOẠCH (từ tháng ${now.getMonth()+1}/${now.getFullYear()}): ${f$(tp)} USDT</b> · Đã mua theo KH: ${f$(td)} · <b style="color:var(--orange)">USDT còn phải DCA: ${f$(tl)}</b><div class="bar" style="margin-top:6px"><i style="width:${tp?Math.min(100,td/tp*100):0}%"></i></div>`;
    chartDraw();persist();
  }
  function chartDraw(){
    if(typeof Chart==='undefined'||!g('dChart'))return;
    const pts=buys.filter(b=>b.usd&&b.price);let cu=0,cb=0;
    const labels=pts.map(b=>b.date.split('-').reverse().slice(0,2).join('/')),pr=pts.map(b=>b.price),av=pts.map(b=>{cu+=b.usd;cb+=b.usd/b.price;return cu/cb}),vol=pts.map(b=>b.usd);
    if(chart)chart.destroy();
    chart=new Chart(g('dChart'),{data:{labels,datasets:[
      {type:'line',label:'Giá mua',data:pr,borderColor:'#3b82f6',backgroundColor:'#3b82f6',pointRadius:3,borderWidth:1.5,tension:.2,yAxisID:'y',order:1},
      {type:'line',label:'Giá TB DCA',data:av,borderColor:'#f7931a',backgroundColor:'#f7931a',pointRadius:0,borderWidth:2.5,tension:.2,yAxisID:'y',order:0},
      {type:'bar',label:'Volume (USD)',data:vol,backgroundColor:'rgba(34,197,94,.35)',borderColor:'rgba(34,197,94,.8)',borderWidth:1,yAxisID:'y1',order:2}]},
      options:{responsive:true,interaction:{mode:'index',intersect:false},plugins:{legend:{labels:{color:'#e6e9ef'}},tooltip:{callbacks:{label:c=>c.dataset.label+': $'+c.parsed.y.toLocaleString('en-US',{maximumFractionDigits:0})}}},
      scales:{x:{ticks:{color:'#8b96a8',maxTicksLimit:12},grid:{color:'#2a3548'}},y:{position:'left',ticks:{color:'#8b96a8',callback:v=>'$'+(v/1000)+'k'},grid:{color:'#2a3548'}},
        y1:{position:'right',max:vol.length?Math.max(...vol)*3:undefined,ticks:{color:'#22c55e'},grid:{drawOnChartArea:false}}}}});
  }
  async function start(seed){
    SEED=seed;const sb=localStorage.getItem('dca_buys_e'),sp=localStorage.getItem('dca_plans_e');
    try{buys=sb?await decObj(KEY,JSON.parse(sb)):null}catch(e){buys=null}
    try{plans=sp?await decObj(KEY,JSON.parse(sp)):null}catch(e){plans=null}
    if(!buys)buys=structuredClone(seed.buys);if(!plans)plans=structuredClone(seed.plans);
    unlocked=true;
  }
  async function fetchPrice(){
    try{const r=await fetch('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT');curPrice=parseFloat((await r.json()).price);setNote('Binance · '+new Date().toLocaleTimeString('vi-VN'))}
    catch(e){try{const r=await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd');curPrice=(await r.json()).bitcoin.usd;setNote('CoinGecko · '+new Date().toLocaleTimeString('vi-VN'))}
      catch(e2){setNote('Không lấy được giá tự động'+(curPrice?' - dùng giá cũ':''));
        if(!curPrice&&unlocked&&g('cInv')){curPrice=parseFloat(prompt('Nhập giá BTC hiện tại (USD):','62000'))||null}}}
    if(curPrice)localStorage.setItem('dca_price',curPrice);draw();
  }
  const setNote=t=>{const e=g('priceNote');if(e)e.textContent=t};
  async function login(){
    const pw=g('dPw').value;if(!pw)return;g('dErr').textContent='Đang kiểm tra...';
    try{const key=await deriveKey(pw);const seed=await decObj(key,ENC.seed);KEY=key;localStorage.setItem('dca_key',tob64(await crypto.subtle.exportKey('raw',KEY)));await start(seed);App.render()}
    catch(e){g('dErr').textContent='Sai mật khẩu, thử lại';g('dPw').value=''}
  }
  function logout(){localStorage.removeItem('dca_key');KEY=null;unlocked=false;buys=[];plans=[];App.render()}
  async function autoUnlock(){
    if(unlocked)return true;const saved=localStorage.getItem('dca_key');if(!saved)return false;
    try{KEY=await crypto.subtle.importKey('raw',b64(saved),{name:'AES-GCM'},true,['encrypt','decrypt']);await start(await decObj(KEY,ENC.seed));return true}
    catch(e){KEY=null;localStorage.removeItem('dca_key');return false}
  }
  function calc3(id){
    lastEdited=lastEdited.filter(x=>x!==id);if(g(id).value)lastEdited.push(id);if(lastEdited.length>2)lastEdited=lastEdited.slice(-2);
    const u=parseFloat(g('inUsd').value),p=parseFloat(g('inPrice').value),b=parseFloat(g('inBtc').value),has={inUsd:u>0,inPrice:p>0,inBtc:b>0};
    if(lastEdited.length===2){const target=['inUsd','inPrice','inBtc'].find(x=>!lastEdited.includes(x));
      if(target==='inBtc'&&has.inUsd&&has.inPrice){g('inBtc').value=(u/p).toFixed(8);g('btcPreview').textContent='→ BTC = '+(u/p).toFixed(8)}
      if(target==='inPrice'&&has.inUsd&&has.inBtc){g('inPrice').value=(u/b).toFixed(2);g('btcPreview').textContent='→ Giá = '+f$(u/b)}
      if(target==='inUsd'&&has.inPrice&&has.inBtc){g('inUsd').value=(p*b).toFixed(2);g('btcPreview').textContent='→ USDT = '+f$2(p*b)}}
  }
  function addBuy(){
    let usd=parseFloat(g('inUsd').value),price=parseFloat(g('inPrice').value),btc=parseFloat(g('inBtc').value);
    if((usd>0)+(price>0)+(btc>0)<2){alert('Nhập ít nhất 2 trong 3 ô: USDT, Giá, BTC');return}
    if(!(usd>0))usd=price*btc;if(!(price>0))price=usd/btc;
    let d=g('inDate').value||today();buys.push({date:d,usd,price,note:g('inNote').value});open[mk(d)]=true;lastEdited=[];draw();
    ['inUsd','inPrice','inBtc','inNote'].forEach(i=>g(i).value='');g('btcPreview').textContent='';
  }
  function parseCSVLine(l){const o=[];let c='',q=false;for(const ch of l){if(ch==='"')q=!q;else if(ch===','&&!q){o.push(c);c=''}else c+=ch}o.push(c);return o}
  function importCSV(file){if(!file)return;const r=new FileReader();r.onload=()=>{
    const lines=r.result.replace(/^﻿/,'').split(/\r?\n/).slice(1).filter(Boolean);let n=0;
    lines.forEach(l=>{const c=parseCSVLine(l);const d=c[1],usd=parseFloat(c[2]),price=parseFloat(c[3]);if(!/^\d{4}-\d\d-\d\d$/.test(d)||!(usd>0)||!(price>0))return;
      if(buys.some(b=>b.date===d&&Math.abs(b.usd-usd)<0.01&&Math.abs(b.price-price)<0.01))return;buys.push({date:d,usd,price,note:c[5]||''});n++});
    draw();toast(n?`Đã nhập ${n} lần mua mới`:'Không có lần mua mới (đã có đủ)')};r.readAsText(file)}
  return {render:async el=>{
      clearInterval(timer);
      if(!unlocked)await autoUnlock();
      if(App.cur!=='dca')return;
      shell(el);
      if(unlocked){fetchPrice();timer=setInterval(()=>{if(App.cur==='dca')fetchPrice();else clearInterval(timer)},60000)}
    },
    login,logout,calc3,addBuy,importCSV,
    toggle(k){const order=[...new Set(buys.map(b=>mk(b.date)))],last=order[order.length-1];open[k]=!((k in open)?open[k]:(k===last));draw()},
    setAll(v){[...new Set(buys.map(b=>mk(b.date)))].forEach(k=>open[k]=v);draw()},
    del(i,e){e.stopPropagation();if(confirm('Xoá lần mua này?')){buys.splice(i,1);draw()}},
    updPlan(i,v){const a=parseFloat(v);if(a>0){plans[i].amt=a}else alert('Số tiền không hợp lệ');draw()},
    addPlan(){const m=g('planMonth').value.trim(),a=parseFloat(g('planAmt').value);if(!/^\d{1,2}\/\d{4}$/.test(m)||!a){alert('Nhập tháng dạng 11/2026 và số tiền');return}
      plans.push({month:m.replace(/^0/,''),amt:a});g('planMonth').value='';g('planAmt').value='';draw()},
    exportCSV(){let csv='﻿Tháng,Ngày,Số tiền (USD),Giá BTC (USD),BTC nhận,Ghi chú\n';buys.forEach(b=>{csv+=`T${mk(b.date)},${b.date},${b.usd},${b.price},${(b.usd/b.price).toFixed(8)},"${b.note||''}"\n`});
      const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));a.download='DCA_Bitcoin.csv';a.click()},
    reset(){if(confirm('Khôi phục về dữ liệu gốc? Các lần mua thêm sau này sẽ mất.')){buys=structuredClone(SEED.buys);plans=structuredClone(SEED.plans);open={};draw()}}
  };
})();
App.reg({id:'dca',label:'₿ DCA BTC',render:el=>DCA.render(el)});
