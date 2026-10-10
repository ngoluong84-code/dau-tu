// ===== Tab 1: Tổng quan =====
const TREND={up:['Tăng','▲','pos'],side:['Đi ngang','►','warn'],down:['Giảm','▼','neg']};
const LVL={cut:['CẮT','p-cut'],sell:['BÁN/CHỐT','p-sell'],buy:['MUA','p-buy'],hold:['GIỮ','p-hold'],warn:['CHÚ Ý','p-warn']};
function lineSvg(pts,w=560,h=130,color='#14b8a6',fill=true){
  if(pts.length<2)return '<div class="mut" style="padding:20px">Chưa đủ dữ liệu (cần ≥2 ngày mở app).</div>';
  const vs=pts.map(p=>p.v),mn=Math.min(...vs),mx=Math.max(...vs),rg=(mx-mn)||1;
  const X=i=>10+i/(pts.length-1)*(w-20),Y=v=>h-18-(v-mn)/rg*(h-34);
  const d=pts.map((p,i)=>(i?'L':'M')+X(i).toFixed(1)+' '+Y(p.v).toFixed(1)).join(' ');
  return `<svg viewBox="0 0 ${w} ${h}" width="100%" style="display:block"><path d="${d}" fill="none" stroke="${color}" stroke-width="2"/>${fill?`<path d="${d} L${X(pts.length-1)} ${h-18} L${X(0)} ${h-18}Z" fill="${color}" opacity=".12"/>`:''}
  <text x="10" y="${h-4}">${fd(pts[0].d)}</text><text x="${w-10}" y="${h-4}" text-anchor="end">${fd(pts[pts.length-1].d)}</text>
  <text x="10" y="10">${n$(mx)}</text><text x="${w-10}" y="10" text-anchor="end">${n$(vs[vs.length-1])}</text></svg>`;
}
App.reg({id:'overview',label:'Tổng quan',render(el){
  const t=totals(),r=risk(),acts=allActions(),m=S.market,tr=TREND[m.trend];
  const day30=S.equity.slice(-30);
  const sum=m.summary||`Thị trường đang ở trạng thái <b>${tr[0].toLowerCase()}</b>. ${m.fng?`Fear & Greed: ${m.fng.v} (${esc(m.fng.c)}). `:''}${m.btcDom?`BTC dominance ${m.btcDom.toFixed(1)}%. `:''}${m.trend==='down'?'Ưu tiên bảo toàn vốn, siết TP.':m.trend==='up'?'Có thể giải ngân từng phần theo kế hoạch.':'Kiên nhẫn, chờ tín hiệu rõ hơn.'}`;
  el.innerHTML=`
  ${S.demo?'<div class="card warn">Đang dùng <b>dữ liệu mẫu</b>. Vào ⚙ Cài đặt → "Xoá dữ liệu mẫu" để bắt đầu với dữ liệu thật của bạn.</div>':''}
  <div class="kpis">
   <div class="kpi"><div class="l">Tổng tài sản</div><div class="v">${n$(t.equity)}</div><div class="s">≈ ${(t.equity*S.settings.vnd/1e6).toLocaleString('vi-VN',{maximumFractionDigits:1})} triệu ₫</div></div>
   <div class="kpi"><div class="l">Tiền mặt</div><div class="v">${n$(t.cash)}</div><div class="s">${(r.cashPct*100).toFixed(0)}% vốn</div></div>
   <div class="kpi"><div class="l">Lãi/lỗ chưa chốt</div><div class="v ${cls(t.unreal)}">${n$(t.unreal)}</div><div class="s">${t.cost?pct(t.unreal/t.cost):''}</div></div>
   <div class="kpi"><div class="l">Đã chốt</div><div class="v ${cls(t.realized)}">${n$(t.realized)}</div></div>
   <div class="kpi"><div class="l">Điểm rủi ro</div><div class="v ${r.level[1]}">${r.score}/100</div><div class="s">${r.level[0]}</div></div>
  </div>
  <div class="banner"><b>Nhận định tổng quan</b> · Xu hướng: <span class="${tr[2]}">${tr[1]} ${tr[0]}</span><div style="margin-top:6px">${m.summary?esc(m.summary):sum}</div></div>
  <div class="grid g2">
   <div class="card"><h2>📰 Tin tức thị trường</h2><div class="news">${m.news.length?m.news.map(n=>`<div class="act"><span class="mut">${fd(n.date)}</span><div style="flex:1">${n.url?`<a href="${esc(n.url)}" target="_blank" rel="noopener">${esc(n.title)}</a>`:esc(n.title)}<div class="mut" style="font-size:.7rem">${esc(n.src||'')}</div></div><span class="del" data-deln="${n.title&&m.news.indexOf(n)}">✕</span></div>`).join(''):'<div class="mut">Chưa có tin. Bấm "Tải tin" hoặc thêm tay.</div>'}</div>
    <div class="row" style="margin-top:8px"><button class="ghost sm" id="ovNews">⟳ Tải tin</button><input id="ovNewsIn" placeholder="Thêm tin thủ công..." style="flex:1"><button class="sm" id="ovNewsAdd">+</button></div></div>
   <div class="card"><h2>🧭 Xu hướng narrative (2–4 tuần tới)</h2>${m.narratives.length?m.narratives.map(n=>`<div class="narr"><b>${esc(n.name)}</b><span class="${TREND[n.dir][2]}" style="font-size:1.1rem">${TREND[n.dir][1]}</span><span class="mut">${'●'.repeat(n.conf)}${'○'.repeat(3-n.conf)}</span><span class="mut">${esc(n.note)}</span></div>`).join(''):'<div class="mut">Chưa có narrative. Thêm ở tab Thị trường.</div>'}
    <div class="mut" style="font-size:.72rem;margin-top:6px">▲ tăng · ► đi ngang · ▼ giảm; ●●● = độ tin cậy. Sửa ở tab Thị trường.</div></div>
  </div>
  <div class="grid g2">
   <div class="card"><h2>⚡ Hành động cần xem</h2>${acts.length?acts.map(a=>`<div class="act"><span class="pill ${LVL[a.lvl][1]}">${LVL[a.lvl][0]}</span><div><b>${esc(a.h.p.sym||a.h.p.name)}</b> <span class="mut">${esc(a.h.cat.name)}</span><div>${esc(a.text)}</div></div></div>`).join(''):'<div class="mut">Không có hành động khẩn cấp.</div>'}</div>
   <div class="card"><h2>🛡 Đánh giá rủi ro</h2>
    <div class="bar" style="height:12px"><i style="width:${r.score}%;background:${r.score>=65?'var(--red)':r.score>=40?'var(--yellow)':'var(--green)'}"></i></div>
    <div style="margin:8px 0">Mức: <b class="${r.level[1]}">${r.level[0]}</b> · Vị thế lớn nhất: <b>${r.top?esc(r.top.p.sym||r.top.p.name)+' '+(r.topPct*100).toFixed(0)+'%':'—'}</b> · Mất tối đa nếu chạm hết SL: <b class="neg">${n$(r.maxLoss)} (${(r.maxLossPct*100).toFixed(1)}%)</b></div>
    ${r.issues.length?r.issues.map(i=>`<div class="warn">• ${esc(i)}</div>`).join(''):'<div class="pos">Không có cảnh báo vượt trần.</div>'}</div>
  </div>
  <div class="card"><h2>📈 Tài sản 30 ngày gần nhất</h2>${lineSvg(day30)}</div>
  <div class="banner" style="border-color:var(--orange);background:#2b1f0a"><b style="color:var(--orange)">Một quyết định chung</b><div style="margin-top:6px">${esc(overallDecision())}</div></div>`;
  $('#ovNews').onclick=async()=>{await fetchNews();App.render()};
  $('#ovNewsAdd').onclick=()=>{const v=$('#ovNewsIn').value.trim();if(v){m.news.unshift({title:v,date:today(),src:'thủ công'});save();App.render()}};
  $$('[data-deln]',el).forEach(x=>x.onclick=()=>{m.news.splice(+x.dataset.deln,1);save();App.render()});
}});
