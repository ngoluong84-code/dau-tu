// ===== Tab 3: Kế hoạch (quyết định mua) =====
const CHECKS=[['Luận điểm rõ ràng, viết được 1–2 câu',2],['Narrative/catalyst đang chạy',2],['Thanh khoản & volume đủ để thoát lệnh',1],['Tokenomics / unlock không gây áp lực',1],['Vào gần hỗ trợ, không đuổi giá',1],['Có điều kiện thoát rõ ràng',1]];
const CW=CHECKS.reduce((s,c)=>s+c[1],0);
function checkMult(arr){const sc=CHECKS.reduce((s,c,i)=>s+(arr&&arr[i]?c[1]:0),0)/CW;return {sc,mult:sc>=0.7?1:sc>=0.4?0.5:0,label:sc>=0.7?'Vào đủ size':sc>=0.4?'Vào nửa size':'Bỏ qua'}}
App.reg({id:'plan',label:'Kế hoạch',render(el){
  const t=totals();
  const rows=S.plans.slice().sort((a,b)=>(a.status==='plan'?0:1)-(b.status==='plan'?0:1)).map(p=>{
    const rr=p.entry>p.sl&&p.tp>p.entry?(p.tp-p.entry)/(p.entry-p.sl):0,c=getCat(p.cat),m=checkMult(p.checks);
    return `<tr><td><b>${esc(p.name)}</b><div class="mut" style="font-size:.72rem">${esc(p.thesis)}</div></td><td><span class="chip" style="background:${c.color}">${esc(c.name)}</span></td>
     <td class="num">${nP(p.entry)}</td><td class="num neg">${nP(p.sl)}</td><td class="num pos">${nP(p.tp)}</td><td class="num"><b class="${rr>=2?'pos':rr>=1?'warn':'neg'}">${rr.toFixed(1)}</b></td><td class="num">${n$(p.usd)}</td>
     <td>${m.label}</td><td><span class="pill ${p.status==='plan'?'p-warn':p.status==='bought'?'p-buy':'p-hold'}">${{plan:'Chờ',bought:'Đã mua',cancel:'Huỷ'}[p.status]}</span></td>
     <td style="white-space:nowrap">${p.status==='plan'?`<button class="sm" data-bought="${p.id}">Đã mua</button> <button class="sm ghost" data-cancel="${p.id}">Huỷ</button> `:''}<span class="del" data-dp="${p.id}">✕</span></td></tr>`}).join('');
  el.innerHTML=`<div class="card"><h2>Kế hoạch mua / bán</h2><div style="overflow:auto"><table><thead><tr><th>Dự án / luận điểm</th><th>Nhóm</th><th class="num">Vào</th><th class="num">SL</th><th class="num">TP</th><th class="num">R:R</th><th class="num">Vốn</th><th>Checklist</th><th>Trạng thái</th><th></th></tr></thead><tbody>${rows||'<tr><td colspan="10" class="mut">Chưa có kế hoạch.</td></tr>'}</tbody></table></div></div>
  <div class="card"><h2>➕ Kế hoạch mua mới</h2>
   <div class="row">${field('Tên dự án','name')}${sel('Nhóm','cat',S.cats.map(c=>[c.id,c.name]),S.cats[1]?S.cats[1].id:S.cats[0].id)}${field('Giá vào','entry','','number','step="any"')}${field('Cắt lỗ (SL)','sl','','number','step="any"')}${field('Chốt lời (TP)','tp','','number','step="any"')}</div>
   <div class="row" style="margin-top:8px"><div class="f"><label>Luận điểm (bắt buộc)</label><input name="thesis"></div><div class="f"><label>Điều kiện thoát (bắt buộc)</label><input name="exit"></div></div>
   <h3>Checklist có trọng số</h3><div id="chk">${CHECKS.map((c,i)=>`<label style="display:flex;gap:8px;font-size:.85rem;color:var(--text);margin:3px 0"><input type="checkbox" data-i="${i}" style="width:auto"> ${c[0]} <span class="mut">(×${c[1]})</span></label>`).join('')}</div>
   <div class="kpi" style="margin-top:10px"><div class="l">Gợi ý khối lượng mua</div><div class="v" id="szv">—</div><div class="s" id="szs">Nhập giá vào và SL để tính. Công thức: min(vốn × rủi ro% ÷ khoảng cách SL, trần vị thế, tiền mặt) × hệ số checklist.</div></div>
   <div class="row" style="margin-top:10px;justify-content:flex-end"><button id="padd">Lưu kế hoạch</button></div></div>`;
  const root=el;const g=n=>root.querySelector(`[name=${n}]`);
  const calc=()=>{const arr=$$('#chk input').map(i=>i.checked),m=checkMult(arr),c=getCat(g('cat').value);
    const s=sizeCalc(t.equity,S.settings.riskPct,+g('entry').value,+g('sl').value,c.maxPos,t.cash,m.mult);
    $('#szv').textContent=s.usd>0?n$(s.usd):'—';
    $('#szs').textContent=`Checklist ${(m.sc*100).toFixed(0)}% → ${m.label}. ${s.byRisk?`Theo rủi ro ${n$(s.byRisk)} · theo trần ${n$(s.byPos)} · tiền mặt ${n$(t.cash)}`:s.note}`};
  $$('#chk input,[name=entry],[name=sl],[name=cat]',el).forEach(i=>i.oninput=calc);calc();
  $('#padd').onclick=()=>{const v=formVals(el.querySelector('.card:last-child'));
    if(!v.name||!v.thesis||!v.exit){alert('Cần tên dự án, luận điểm và điều kiện thoát');return}
    const checks=$$('#chk input').map(i=>i.checked),m=checkMult(checks),s=sizeCalc(t.equity,S.settings.riskPct,+v.entry,+v.sl,getCat(v.cat).maxPos,t.cash,m.mult);
    S.plans.push({id:uid(),name:v.name,cat:v.cat,entry:+v.entry,sl:+v.sl,tp:+v.tp,thesis:v.thesis,exit:v.exit,checks,usd:s.usd||0,status:'plan'});S.demo=false;save();App.render()};
  $$('[data-bought]',el).forEach(b=>b.onclick=()=>{const p=S.plans.find(x=>x.id===b.dataset.bought);
    const q=prompt(`Số lượng đã mua ${p.name}? (gợi ý ${p.entry?(p.usd/p.entry).toPrecision(4):''})`,p.entry?(p.usd/p.entry).toPrecision(4):'');if(!(+q>0))return;
    let pr=S.projects.find(x=>x.name.toLowerCase()===p.name.toLowerCase());
    if(!pr){pr={id:uid(),cat:p.cat,name:p.name,sym:'',price:p.entry,mcap:'',trend:'side',note:p.thesis,tp:p.tp,sl:p.sl,cg:'',contract:'',chain:''};S.projects.push(pr)}
    S.trades.push({id:uid(),pid:pr.id,type:'buy',date:today(),qty:+q,price:p.entry,fee:0});p.status='bought';save();App.render()});
  $$('[data-cancel]',el).forEach(b=>b.onclick=()=>{S.plans.find(x=>x.id===b.dataset.cancel).status='cancel';save();App.render()});
  $$('[data-dp]',el).forEach(b=>b.onclick=()=>confirmDo('Xoá kế hoạch?',()=>{S.plans=S.plans.filter(x=>x.id!==b.dataset.dp)}));
}});
