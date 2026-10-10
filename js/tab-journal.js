// ===== Tab 4: Nhật ký & thống kê =====
App.reg({id:'journal',label:'Nhật ký & thống kê',render(el){
  const st=stats(),eq=S.equity;
  // drawdown series
  let pk=0;const dd=eq.map(e=>{pk=Math.max(pk,e.v);return {d:e.d,v:pk?(e.v/pk-1)*100:0}});
  const byCat=S.cats.map(c=>{const ts=st.trips.filter(t=>t.cat.id===c.id);if(!ts.length)return null;
    const w=ts.filter(t=>t.pnl>0).length,e=ts.reduce((s,t)=>s+t.R,0)/ts.length;return {c,n:ts.length,wr:w/ts.length,e,pnl:ts.reduce((s,t)=>s+t.pnl,0)}}).filter(Boolean);
  el.innerHTML=`<div class="kpis">
   <div class="kpi"><div class="l">Giao dịch đã đóng</div><div class="v">${st.n}</div><div class="s">${st.wins} thắng · ${st.loss} thua</div></div>
   <div class="kpi"><div class="l">Tỷ lệ thắng</div><div class="v">${(st.winRate*100).toFixed(0)}%</div></div>
   <div class="kpi"><div class="l">Kỳ vọng / lệnh</div><div class="v ${cls(st.exp)}">${st.exp>=0?'+':''}${st.exp.toFixed(2)}R</div></div>
   <div class="kpi"><div class="l">Profit factor</div><div class="v">${st.pf===Infinity?'∞':st.pf.toFixed(2)}</div></div>
   <div class="kpi"><div class="l">Sụt giảm tối đa</div><div class="v neg">${(st.mdd*100).toFixed(1)}%</div></div>
   <div class="kpi"><div class="l">Tổng lãi/lỗ đã chốt</div><div class="v ${cls(st.total)}">${n$(st.total)}</div></div></div>
  <div class="grid g2"><div class="card"><h2>Đường tài sản</h2>${lineSvg(eq,560,130)}</div><div class="card"><h2>Sụt giảm (drawdown %)</h2>${lineSvg(dd,560,130,'#ef4444')}</div></div>
  <div class="card"><h2>Hiệu quả theo nhóm (edge)</h2><table><thead><tr><th>Nhóm</th><th class="num">Số lệnh</th><th class="num">Thắng</th><th class="num">Kỳ vọng R</th><th class="num">Lãi/lỗ</th></tr></thead><tbody>
   ${byCat.map(b=>`<tr><td><span class="chip" style="background:${b.c.color}">${esc(b.c.name)}</span></td><td class="num">${b.n}</td><td class="num">${(b.wr*100).toFixed(0)}%</td><td class="num ${cls(b.e)}">${b.e.toFixed(2)}R</td><td class="num ${cls(b.pnl)}">${n$(b.pnl)}</td></tr>`).join('')||'<tr><td colspan="5" class="mut">Chưa có giao dịch đã đóng (bán hết vị thế).</td></tr>'}</tbody></table>
   <div class="mut" style="font-size:.72rem;margin-top:6px">R = lãi/lỗ ÷ (vốn bỏ ra × SL% của nhóm). Nhóm nào kỳ vọng âm → giảm tỷ trọng.</div></div>
  <div class="grid g2"><div class="card"><h2>📓 Nhật ký</h2>
   <div class="row"><div class="f"><label>Ghi chú / quyết định</label><input id="jt"></div><div class="f" style="max-width:130px"><label>Tag</label><select id="jg"><option>Quyết định</option><option>Sai lầm</option><option>Bài học</option><option>FOMO</option><option>Kỷ luật tốt</option></select></div></div>
   <div class="row" style="margin-top:6px"><div class="f"><label>Bài học (tuỳ chọn)</label><input id="jl"></div><button id="jadd">Thêm</button></div>
   <div style="margin-top:10px">${S.journal.slice().reverse().map(j=>`<div class="act"><span class="mut">${fd(j.date)}</span><div style="flex:1"><span class="pill ${j.tag==='Sai lầm'||j.tag==='FOMO'?'p-cut':'p-hold'}">${esc(j.tag)}</span> ${esc(j.text)}${j.lesson?`<div class="warn">→ ${esc(j.lesson)}</div>`:''}</div><span class="del" data-dj="${j.id}">✕</span></div>`).join('')||'<div class="mut">Chưa có ghi chú.</div>'}</div></div>
  <div class="card"><h2>🧱 Sai lầm → Quy tắc của tôi</h2>${S.rules.map(r=>`<div class="act"><span style="flex:1">• ${esc(r.text)}</span><span class="del" data-dr="${r.id}">✕</span></div>`).join('')}
   <div class="row" style="margin-top:8px"><input id="rt" placeholder="Quy tắc mới..." style="flex:1"><button id="radd">+</button></div></div></div>`;
  $('#jadd').onclick=()=>{const t=$('#jt').value.trim();if(!t)return;S.journal.push({id:uid(),date:today(),text:t,tag:$('#jg').value,lesson:$('#jl').value.trim()});save();App.render()};
  $('#radd').onclick=()=>{const t=$('#rt').value.trim();if(t){S.rules.push({id:uid(),text:t});save();App.render()}};
  $$('[data-dj]',el).forEach(b=>b.onclick=()=>{S.journal=S.journal.filter(x=>x.id!==b.dataset.dj);save();App.render()});
  $$('[data-dr]',el).forEach(b=>b.onclick=()=>{S.rules=S.rules.filter(x=>x.id!==b.dataset.dr);save();App.render()});
}});
