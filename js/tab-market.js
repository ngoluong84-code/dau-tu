// ===== Tab 5: Thị trường & Airdrop =====
App.reg({id:'market',label:'Thị trường',render(el){
  const m=S.market,vnd=S.settings.vnd;
  const air=S.airdrops,cost=air.reduce((s,a)=>s+(+a.cost||0),0),exp=air.reduce((s,a)=>s+(+a.expected||0),0);
  el.innerHTML=`<div class="kpis">
   <div class="kpi"><div class="l">Fear & Greed</div><div class="v">${m.fng?m.fng.v:'—'}</div><div class="s">${m.fng?esc(m.fng.c):'cập nhật bằng ⟳ (khi chạy online)'}</div></div>
   <div class="kpi"><div class="l">BTC</div><div class="v">${m.btcPrice?n$(m.btcPrice):'—'}</div></div>
   <div class="kpi"><div class="l">BTC dominance</div><div class="v">${m.btcDom?m.btcDom.toFixed(1)+'%':'—'}</div></div>
   <div class="kpi"><div class="l">Tổng vốn hoá</div><div class="v">${m.totalCap?'$'+fmtBig(m.totalCap):'—'}</div></div>
   <div class="kpi"><div class="l">USD/VND</div><div class="v">${Math.round(vnd).toLocaleString('vi-VN')}</div></div></div>
  <div class="card"><h2>Xu hướng thị trường chung (ảnh hưởng đến TP/SL và gợi ý)</h2>
   <div class="row">${['up','side','down'].map(k=>`<button class="${m.trend===k?'':'ghost'}" data-tr="${k}">${TREND[k][1]} ${TREND[k][0]}</button>`).join('')}</div>
   <div style="margin-top:10px"><label>Nhận định tổng quan của bạn (hiện ở tab Tổng quan, để trống = tự sinh)</label><textarea id="msum">${esc(m.summary)}</textarea></div></div>
  <div class="card"><h2>Narrative (2–4 tuần tới)</h2>
   ${m.narratives.map(n=>`<div class="narr" style="grid-template-columns:1fr 110px 110px 2fr 30px" data-n="${n.id}"><input data-k="name" value="${esc(n.name)}"><select data-k="dir"><option value="up" ${n.dir==='up'?'selected':''}>▲ Tăng</option><option value="side" ${n.dir==='side'?'selected':''}>► Đi ngang</option><option value="down" ${n.dir==='down'?'selected':''}>▼ Giảm</option></select>
    <select data-k="conf">${[1,2,3].map(i=>`<option value="${i}" ${n.conf==i?'selected':''}>${'●'.repeat(i)} tin cậy</option>`).join('')}</select><input data-k="note" placeholder="Lý do / catalyst" value="${esc(n.note)}"><span class="del" data-dn="${n.id}">✕</span></div>`).join('')}
   <button class="ghost sm" id="nadd" style="margin-top:8px">+ Thêm narrative</button></div>
  <div class="card"><h2>Ghi chú thị trường / kinh nghiệm</h2><textarea id="mnotes" style="min-height:110px">${esc(m.notes)}</textarea></div>
  <div class="card"><h2>🪂 Airdrop tracker</h2><div class="mut" style="margin-bottom:6px">Tổng chi phí ${n$(cost)} · Kỳ vọng ${n$(exp)} ${cost?`· Tỷ lệ kỳ vọng/chi phí <b class="${exp>=cost?'pos':'neg'}">${(exp/cost).toFixed(1)}x</b>`:''}</div>
   <table><thead><tr><th>Dự án</th><th class="num">Chi phí (gas, vốn kẹt)</th><th class="num">Kỳ vọng nhận</th><th>Trạng thái</th><th></th></tr></thead><tbody>
   ${air.map(a=>`<tr data-a="${a.id}"><td><input data-k="name" value="${esc(a.name)}"></td><td><input class="num" type="number" data-k="cost" value="${a.cost}"></td><td><input class="num" type="number" data-k="expected" value="${a.expected}"></td>
    <td><select data-k="status">${['Đang làm','Chờ snapshot','Đã nhận','Bỏ'].map(s=>`<option ${a.status===s?'selected':''}>${s}</option>`).join('')}</select></td><td class="del" data-da="${a.id}">✕</td></tr>`).join('')||'<tr><td colspan="5" class="mut">Chưa có airdrop.</td></tr>'}</tbody></table>
   <button class="ghost sm" id="aadd" style="margin-top:8px">+ Thêm airdrop</button></div>`;
  $$('[data-tr]',el).forEach(b=>b.onclick=()=>{m.trend=b.dataset.tr;save();App.render()});
  $('#msum').onchange=e=>{m.summary=e.target.value;save()};$('#mnotes').onchange=e=>{m.notes=e.target.value;save()};
  $$('[data-n] [data-k]',el).forEach(i=>i.onchange=()=>{const n=m.narratives.find(x=>x.id===i.closest('[data-n]').dataset.n);n[i.dataset.k]=i.dataset.k==='conf'?+i.value:i.value;save()});
  $$('[data-dn]',el).forEach(b=>b.onclick=()=>{m.narratives=m.narratives.filter(x=>x.id!==b.dataset.dn);save();App.render()});
  $('#nadd').onclick=()=>{m.narratives.push({id:uid(),name:'Narrative mới',dir:'side',conf:1,note:''});save();App.render()};
  $$('[data-a] [data-k]',el).forEach(i=>i.onchange=()=>{const a=air.find(x=>x.id===i.closest('[data-a]').dataset.a);a[i.dataset.k]=i.type==='number'?+i.value:i.value;save();if(i.type==='number')App.render()});
  $$('[data-da]',el).forEach(b=>b.onclick=()=>{S.airdrops=S.airdrops.filter(x=>x.id!==b.dataset.da);save();App.render()});
  $('#aadd').onclick=()=>{S.airdrops.push({id:uid(),name:'Dự án mới',cost:0,expected:0,status:'Đang làm'});save();App.render()};
}});
