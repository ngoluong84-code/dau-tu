// ===== Tab 2: Danh mục =====
let tlRange=localStorage.getItem('tlRange')||'180';
function donut(items,size=170){
  const tot=items.reduce((s,i)=>s+i.v,0)||1;let a=-Math.PI/2;const R=size/2-4,r=R*0.6,c=size/2;
  const paths=items.filter(i=>i.v>0).map(i=>{const f=i.v/tot,b=a+f*2*Math.PI;
    if(f>0.9999){a=b;return `<circle cx="${c}" cy="${c}" r="${(R+r)/2}" fill="none" stroke="${i.c}" stroke-width="${R-r}"/>`}
    const x=(rr,ang)=>c+rr*Math.cos(ang),y=(rr,ang)=>c+rr*Math.sin(ang),lg=f>0.5?1:0;
    const d=`M${x(R,a)} ${y(R,a)} A${R} ${R} 0 ${lg} 1 ${x(R,b)} ${y(R,b)} L${x(r,b)} ${y(r,b)} A${r} ${r} 0 ${lg} 0 ${x(r,a)} ${y(r,a)}Z`;a=b;return `<path d="${d}" fill="${i.c}"/>`}).join('');
  return `<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">${paths}<text x="${c}" y="${c+4}" text-anchor="middle" style="fill:#e6e9ef;font-size:12px;font-weight:700">${n$(tot)}</text></svg>`;
}
App.reg({id:'portfolio',label:'Danh mục',render(el){
  const t=totals(),r=risk(),eq=t.equity||1;
  const items=S.cats.map(c=>({n:c.name,c:c.color,v:t.hs.filter(h=>h.cat.id===c.id).reduce((s,h)=>s+h.value,0)}));
  items.push({n:'Tiền mặt',c:'#64748b',v:t.cash});
  // dải thời gian
  const end=toT(today())+3*dayMs;
  let start=end-(+tlRange||0)*dayMs;
  if(tlRange==='all'){const f=t.hs.map(h=>h.pos.first).filter(Boolean).sort()[0];start=f?toT(f)-5*dayMs:end-180*dayMs}
  const X=d=>Math.max(0,Math.min(100,(toT(d)-start)/(end-start)*100));
  const ticks=[];const nT=6;for(let i=0;i<=nT;i++){const ms=start+(end-start)*i/nT;ticks.push(`<span style="left:${i/nT*100}%">${new Date(ms).toLocaleDateString('vi-VN',{day:'2-digit',month:'2-digit'})}</span>`)}
  const axis=`<div class="tl head"><div></div><div class="axis">${ticks.join('')}</div><div>Giá vốn · Hiện tại · Lãi/lỗ · Quyết định</div></div>`;
  const rebal=[];
  S.cats.forEach(c=>{if(c.id==='btc')return;const w=items.find(i=>i.n===c.name).v/eq*100;if(w>c.maxPos)rebal.push(`Nhóm ${c.name}: ${w.toFixed(1)}% > trần ${c.maxPos}% → giảm khoảng ${n$((w-c.maxPos)/100*eq)}`)});
  const catRow=c=>{
    const hs=t.hs.filter(h=>h.cat.id===c.id);
    const sum=hs.reduce((s,h)=>s+h.value,0);
    return `<div class="cathead"><span class="chip" style="background:${c.color}">${esc(c.name)}</span><span class="mut">${n$(sum)} · ${(sum/eq*100).toFixed(1)}% vốn · TP ${c.tp*100}% / SL ${c.sl*100}% / trần ${c.maxPos}%</span><span style="flex:1"></span>
      <button class="sm ghost" data-ecat="${c.id}">⚙ Quy tắc</button><button class="sm" data-addp="${c.id}">+ Thêm dự án</button></div>`+
      (hs.length?hs.map(h=>rowTl(h,X)).join(''):'<div class="mut" style="padding:6px 0 6px 6px">Chưa có dự án - bấm "+ Thêm dự án".</div>');
  };
  el.innerHTML=`
  <div class="grid g2">
   <div class="card"><h2>Phân bổ vốn</h2><div class="row" style="align-items:center">${donut(items)}<div style="flex:1;min-width:180px">${items.map(i=>`<div style="display:flex;gap:6px;align-items:center;padding:2px 0"><i style="width:10px;height:10px;border-radius:2px;background:${i.c}"></i><span style="flex:1">${esc(i.n)}</span><b>${(i.v/eq*100).toFixed(1)}%</b></div>`).join('')}</div></div></div>
   <div class="card"><h2>Gợi ý cân bằng lại</h2>${rebal.length?rebal.map(x=>`<div class="warn">• ${esc(x)}</div>`).join(''):'<div class="pos">Phân bổ nằm trong các trần đã đặt.</div>'}
    <div class="mut" style="margin-top:8px;font-size:.78rem">Trần mỗi nhóm chỉnh ở "⚙ Quy tắc" của nhóm. Tiền mặt ${(r.cashPct*100).toFixed(0)}%.</div></div>
  </div>
  <div class="card"><div class="row" style="justify-content:space-between;align-items:center"><h2 style="margin:0">Timeline từng dự án (từ lần mua đầu đến nay)</h2>
   <div class="row">${[['90','3 tháng'],['180','6 tháng'],['365','1 năm'],['all','Tất cả']].map(([v,l])=>`<button class="sm ${tlRange===v?'':'ghost'}" data-rng="${v}">${l}</button>`).join('')}</div></div>
   <div class="mut" style="font-size:.72rem;margin:4px 0">Thanh = thời gian nắm giữ · vạch trắng = mua · vạch đen viền trắng = bán · vạch đỏ = hôm nay. Bấm tên dự án để sửa ngày/giá/số lượng.</div>
   ${axis}${S.cats.map(catRow).join('')}
   <div class="row" style="margin-top:14px;border-top:1px solid var(--border);padding-top:12px"><div class="f" style="max-width:240px"><label>Tên danh mục mới (vd: Airdrop, Narrative Cat...)</label><input id="ncName"></div>
    <div class="f" style="max-width:300px"><label>Màu</label><div id="ncSw">${COLORS.map((c,i)=>`<span class="sw ${i===4?'on':''}" data-c="${c}" style="background:${c}"></span>`).join('')}</div></div><button id="ncAdd">+ Thêm danh mục</button></div>
  </div>`;
  $$('[data-rng]',el).forEach(b=>b.onclick=()=>{tlRange=b.dataset.rng;localStorage.setItem('tlRange',tlRange);App.render()});
  $$('[data-addp]',el).forEach(b=>b.onclick=()=>editProject(null,b.dataset.addp));
  $$('[data-ecat]',el).forEach(b=>b.onclick=()=>editCat(b.dataset.ecat));
  $$('[data-p]',el).forEach(b=>b.onclick=()=>editTrades(b.dataset.p));
  let swc=COLORS[4];$$('#ncSw .sw').forEach(s=>s.onclick=()=>{$$('#ncSw .sw').forEach(x=>x.classList.remove('on'));s.classList.add('on');swc=s.dataset.c});
  $('#ncAdd').onclick=()=>{const n=$('#ncName').value.trim();if(!n)return;S.cats.push({id:uid(),name:n,color:swc,tp:0.5,sl:0.2,maxDays:180,maxPos:10,cut:'review'});save();App.render()};
}});
function rowTl(h,X){
  const {p,pos,cat}=h,hasPos=pos.first;
  const x0=hasPos?X(pos.first):0,x1=hasPos?X(pos.closeDate||today()):0;
  const d=decide(h)[0];
  const ticks=pos.trades.map(t=>`<i class="tick ${t.type==='buy'?'b':'s'}" style="left:${X(t.date)}%" title="${t.type==='buy'?'Mua':'Bán'} ${fd(t.date)}: ${t.qty} @ ${nP(t.price)}"></i>`).join('');
  return `<div class="tl"><div class="name" data-p="${p.id}"><b>${esc(p.name)}</b><small>${esc(p.sym||'')} ${p.mcap?'· '+esc(p.mcap):''} ${p.trend?`<span class="${TREND[p.trend][2]}">${TREND[p.trend][1]}</span>`:''}</small></div>
   <div class="track">${hasPos?`<div class="fill" style="left:${x0}%;width:${Math.max(0.5,x1-x0)}%;background:${cat.color}"></div>`:''}${ticks}<i class="tick today" style="left:${X(today())}%"></i></div>
   <div style="font-size:.74rem;line-height:1.35">${pos.qty>0?`Vốn ${nP(pos.avg)} → <b>${nP(h.price)}</b> <b class="${cls(h.pnl)}">${pct(h.pnl)}</b><br>${n$(h.value)} · ${d?`<span class="pill ${LVL[d.lvl][1]}">${LVL[d.lvl][0]}</span>`:''}`:pos.closeDate?`<span class="mut">Đã đóng ${fd(pos.closeDate)}</span> · <b class="${cls(pos.realized)}">${n$(pos.realized)}</b>`:'<span class="mut">Chưa mua</span>'}</div></div>`;
}
function editCat(id){
  const c=getCat(id);
  modal('Quy tắc nhóm: '+esc(c.name),`<div class="row">${field('Tên','name',c.name)}${field('Màu','color',c.color,'color')}</div>
   <div class="row" style="margin-top:8px">${field('TP mặc định (%)','tp',c.tp*100,'number','step="any"')}${field('SL mặc định (%)','sl',c.sl*100,'number','step="any"')}${field('Tối đa ngày nắm giữ','maxDays',c.maxDays,'number')}${field('Trần vị thế (% vốn)','maxPos',c.maxPos,'number','step="any"')}</div>
   <div class="row" style="margin-top:8px">${sel('Khi chạm SL','cut',[['all','Cắt hết'],['half','Cắt 50%'],['review','Xem xét']],c.cut)}</div>
   <button class="danger sm" id="delcat" style="margin-top:12px">Xoá danh mục</button>`,
   v=>{Object.assign(c,{name:v.name||c.name,color:v.color,tp:v.tp/100,sl:v.sl/100,maxDays:+v.maxDays||180,maxPos:+v.maxPos||10,cut:v.cut})});
  $('#delcat').onclick=()=>{if(S.projects.some(p=>p.cat===id)){alert('Danh mục còn dự án - hãy chuyển/xoá dự án trước');return}
    if(confirm('Xoá danh mục?')){S.cats=S.cats.filter(x=>x.id!==id);save();$('#modal').style.display='none';App.render()}};
}
function editProject(pid,catId){
  const p=pid?S.projects.find(x=>x.id===pid):{id:uid(),cat:catId,name:'',sym:'',cg:'',contract:'',chain:'',price:'',mcap:'',trend:'side',note:'',tp:0,sl:0};
  const isNew=!pid;
  modal(isNew?'Thêm dự án vào '+esc(getCat(p.cat).name):'Sửa dự án '+esc(p.name),`
   <div class="row">${field('Tên dự án','name',p.name)}${field('Ký hiệu','sym',p.sym)}${sel('Danh mục','cat',S.cats.map(c=>[c.id,c.name]),p.cat)}</div>
   <div class="row" style="margin-top:8px">${field('Giá hiện tại (USD)','price',p.price,'number','step="any"')}${field('Market cap','mcap',p.mcap)}${sel('Xu hướng','trend',[['up','Tăng'],['side','Đi ngang'],['down','Giảm']],p.trend)}</div>
   <div class="row" style="margin-top:8px">${field('TP (giá, trống = theo nhóm)','tp',p.tp||'','number','step="any"')}${field('SL (giá, trống = theo nhóm)','sl',p.sl||'','number','step="any"')}</div>
   <h3>Tự lấy giá (tuỳ chọn)</h3>
   <div class="row">${field('CoinGecko ID (vd: bitcoin)','cg',p.cg)}${field('Contract (meme/DEX)','contract',p.contract)}${field('Chain','chain',p.chain)}</div>
   <div class="row" style="margin-top:8px"><div class="f"><label>Luận điểm / ghi chú</label><textarea name="note">${esc(p.note)}</textarea></div></div>
   ${isNew?`<h3>Lần mua đầu (tuỳ chọn)</h3><div class="row">${field('Ngày','bd',today(),'date')}${field('Số lượng','bq','','number','step="any"')}${field('Giá mua','bp','','number','step="any"')}${field('Phí','bf','0','number','step="any"')}</div>`:'<button class="danger sm" id="delp" style="margin-top:12px">Xoá dự án và mọi lệnh</button>'}`,
   v=>{if(!v.name.trim()){alert('Nhập tên dự án');return false}
     Object.assign(p,{name:v.name.trim(),sym:v.sym.trim(),cat:v.cat,price:+v.price||0,mcap:v.mcap,trend:v.trend,tp:+v.tp||0,sl:+v.sl||0,cg:v.cg.trim(),contract:v.contract.trim(),chain:v.chain.trim(),note:v.note});
     if(isNew){S.projects.push(p);if(+v.bq>0&&+v.bp>0)S.trades.push({id:uid(),pid:p.id,type:'buy',date:v.bd||today(),qty:+v.bq,price:+v.bp,fee:+v.bf||0})}
     S.demo=false});
  if(!isNew)$('#delp').onclick=()=>{if(confirm('Xoá dự án này và toàn bộ lệnh?')){S.projects=S.projects.filter(x=>x.id!==pid);S.trades=S.trades.filter(t=>t.pid!==pid);save();$('#modal').style.display='none';App.render()}};
}
function editTrades(pid){
  const p=S.projects.find(x=>x.id===pid);
  const draw=()=>{
    const pos=position(pid);
    $('#mb').innerHTML=`<div class="mut" style="margin-bottom:8px">Đang giữ ${pos.qty.toLocaleString('en-US',{maximumFractionDigits:6})} · giá vốn ${nP(pos.avg)} · đã chốt <span class="${cls(pos.realized)}">${n$(pos.realized)}</span></div>
    <table><thead><tr><th>Loại</th><th>Ngày</th><th>Số lượng</th><th>Giá</th><th>Phí</th><th></th></tr></thead><tbody>
    ${S.trades.filter(t=>t.pid===pid).sort((a,b)=>a.date.localeCompare(b.date)).map(t=>`<tr data-t="${t.id}"><td><select data-k="type"><option value="buy" ${t.type==='buy'?'selected':''}>Mua</option><option value="sell" ${t.type==='sell'?'selected':''}>Bán</option></select></td>
      <td><input type="date" data-k="date" value="${t.date}"></td><td><input type="number" step="any" data-k="qty" value="${t.qty}"></td><td><input type="number" step="any" data-k="price" value="${t.price}"></td><td><input type="number" step="any" data-k="fee" value="${t.fee||0}"></td><td class="del" data-d="${t.id}">✕</td></tr>`).join('')||'<tr><td colspan="6" class="mut">Chưa có lệnh</td></tr>'}</tbody></table>
    <h3>Thêm lệnh</h3><div class="row"><div class="f"><label>Loại</label><select id="nt"><option value="buy">Mua</option><option value="sell">Bán</option></select></div><div class="f"><label>Ngày</label><input id="nd" type="date" value="${today()}"></div><div class="f"><label>Số lượng</label><input id="nq" type="number" step="any"></div><div class="f"><label>Giá</label><input id="np" type="number" step="any" value="${p.price||''}"></div><div class="f"><label>Phí</label><input id="nf" type="number" step="any" value="0"></div><button id="nadd">Thêm</button></div>
    <div class="row" style="margin-top:10px"><button class="ghost sm" id="pedit">Sửa thông tin dự án</button></div>`;
    $$('tr[data-t] [data-k]').forEach(i=>i.onchange=()=>{const t=S.trades.find(x=>x.id===i.closest('tr').dataset.t);const k=i.dataset.k;t[k]=(k==='type'||k==='date')?i.value:+i.value;save();draw()});
    $$('[data-d]').forEach(i=>i.onclick=()=>{S.trades=S.trades.filter(x=>x.id!==i.dataset.d);save();draw()});
    $('#nadd').onclick=()=>{const q=+$('#nq').value,pr=+$('#np').value;if(!(q>0&&pr>0)){alert('Nhập số lượng và giá');return}
      S.trades.push({id:uid(),pid,type:$('#nt').value,date:$('#nd').value||today(),qty:q,price:pr,fee:+$('#nf').value||0});S.demo=false;save();draw()};
    $('#pedit').onclick=()=>{$('#modal').style.display='none';editProject(pid)};
  };
  modal('Lệnh mua/bán: '+esc(p.name),'',null);draw();
  $('#mx').onclick=()=>{$('#modal').style.display='none';save();App.render()};
}
