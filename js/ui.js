// ===== UI: khung ứng dụng, tab, modal, cài đặt =====
const App={tabs:[],cur:localStorage.getItem('dau-tu-tab')||'overview',
  reg(t){this.tabs.push(t)},
  render(){
    const nav=$('#tabs');
    nav.innerHTML=this.tabs.map(t=>`<button data-tab="${t.id}" class="${t.id===this.cur?'on':''}">${t.label}</button>`).join('');
    const t=this.tabs.find(x=>x.id===this.cur)||this.tabs[0];
    const el=$('#view');
    try{t.render(el)}catch(e){el.innerHTML='<div class="card neg">Lỗi hiển thị tab: '+esc(e.message)+'</div>';console.error(e)}
  },
  go(id){this.cur=id;try{localStorage.setItem('dau-tu-tab',id)}catch(e){}this.render();window.scrollTo(0,0)}
};
function modal(title,html,onOk,okLabel){
  const m=$('#modal');
  m.innerHTML=`<div class="box"><h2>${title}</h2><div id="mb">${html}</div><div class="row" style="margin-top:14px;justify-content:flex-end"><button class="ghost" id="mx">Đóng</button>${onOk?`<button id="mok">${okLabel||'Lưu'}</button>`:''}</div></div>`;
  m.style.display='flex';
  const close=()=>{m.style.display='none';m.innerHTML=''};
  $('#mx').onclick=close;
  if(onOk)$('#mok').onclick=()=>{const v=formVals($('#mb'));if(onOk(v)!==false){close();save();App.render()}};
  m.onmousedown=e=>{if(e.target===m)close()};
  return close;
}
function formVals(root){const o={};$$('[name]',root).forEach(i=>{o[i.name]=i.type==='checkbox'?i.checked:i.value});return o}
const field=(label,name,val='',type='text',extra='')=>`<div class="f"><label>${label}</label><input name="${name}" type="${type}" value="${esc(val)}" ${extra}></div>`;
const sel=(label,name,opts,val)=>`<div class="f"><label>${label}</label><select name="${name}">${opts.map(o=>`<option value="${esc(o[0])}" ${o[0]==val?'selected':''}>${esc(o[1])}</option>`).join('')}</select></div>`;
function confirmDo(msg,fn){if(confirm(msg)){fn();save();App.render()}}

function openSettings(){
  const s=S.settings;
  modal('⚙ Cài đặt & dữ liệu',`
   <div class="row">${field('Tiền mặt hiện có (USD)','cash',s.cash,'number','step="any"')}${field('Rủi ro mỗi lệnh (% vốn)','riskPct',s.riskPct,'number','step="any"')}${field('Tỷ giá USD→VND','vnd',s.vnd,'number')}</div>
   <h3>Đồng bộ qua GitHub Gist (tuỳ chọn, để dùng nhiều thiết bị)</h3>
   <p class="mut" style="font-size:.78rem;margin-bottom:6px">Tạo token tại github.com/settings/tokens (chỉ cần quyền "gist"). Token lưu trong trình duyệt này; Gist là bí mật (secret).</p>
   <div class="row">${field('GitHub token','gistToken',s.gistToken,'password')}${field('Gist ID (tự tạo khi đẩy lần đầu)','gistId',s.gistId)}</div>
   <div class="row" style="margin-top:8px"><button class="ghost" id="gpush">⬆ Đẩy lên Gist</button><button class="ghost" id="gpull">⬇ Kéo từ Gist</button><span class="mut">${s.lastSync?'Lần cuối: '+esc(s.lastSync):''}</span></div>
   <h3>Sao lưu file</h3>
   <div class="row"><button class="ghost" id="bex">⬇ Xuất JSON</button><label class="ghost" style="cursor:pointer;border:1px solid var(--border);padding:8px 14px;border-radius:8px;margin:0">⬆ Nhập JSON<input type="file" id="bim" accept=".json" class="hide"></label>
   <button class="danger" id="bclr">Xoá dữ liệu mẫu / làm mới</button></div>
   <p class="mut" style="font-size:.78rem;margin-top:10px">Dữ liệu lưu trong trình duyệt (localStorage) của từng thiết bị. Hãy xuất JSON định kỳ hoặc dùng Gist.</p>`,
   v=>{Object.assign(S.settings,{cash:+v.cash||0,riskPct:+v.riskPct||1,vnd:+v.vnd||26000,gistToken:v.gistToken.trim(),gistId:v.gistId.trim()})});
  const gp=()=>{S.settings.gistToken=$('[name=gistToken]').value.trim();S.settings.gistId=$('[name=gistId]').value.trim()};
  $('#gpush').onclick=()=>{gp();gist('push')};$('#gpull').onclick=()=>{gp();gist('pull')};
  $('#bex').onclick=exportJSON;$('#bim').onchange=e=>{if(e.target.files[0]){importJSON(e.target.files[0]);$('#modal').style.display='none'}};
  $('#bclr').onclick=()=>{if(confirm('Xoá TOÀN BỘ dữ liệu hiện tại và bắt đầu trống (giữ danh mục mặc định)?')){const d=demo();d.projects=[];d.trades=[];d.demo=false;d.settings=S.settings;d.market.narratives=[];S=d;save();$('#modal').style.display='none';App.render()}};
}
document.addEventListener('click',e=>{
  const b=e.target.closest('[data-tab]');if(b&&b.closest('#tabs'))App.go(b.dataset.tab);
});
window.addEventListener('DOMContentLoaded',()=>{
  $('#btnRefresh').onclick=async()=>{$('#btnRefresh').textContent='⏳';await refreshPrices();$('#btnRefresh').textContent='⟳ Cập nhật giá';App.render()};
  $('#btnSet').onclick=openSettings;
  snapshotEquity();save();App.render();
  refreshPrices(true).then(()=>App.render());
});
