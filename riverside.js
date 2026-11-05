(function(){
const extraKey=window.EasyTicketTenant.activeId()==="riverside"?"easyticket-riverside-extra-v1":"easyticket-riverside-extra-v1:"+window.EasyTicketTenant.activeId();
let extra;try{extra=JSON.parse(localStorage.getItem(extraKey))||{}}catch(e){extra={}}
extra.schools=Array.isArray(extra.schools)?extra.schools:[];
extra.members=Array.isArray(extra.members)?extra.members:[];
extra.bundles=extra.bundles||{Umum:"Renang + Makan + Minum",Grup:"Renang + Makan + Minum"};
const persist=()=>localStorage.setItem(extraKey,JSON.stringify(extra));
const el=id=>document.getElementById(id);
const esc=x=>String(x).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function refresh(){
el("schoolRows").innerHTML='<table><tr><th>Sekolah</th><th>Kategori</th><th>Tiket bulan ini</th></tr>'+extra.schools.map(x=>'<tr><td>'+esc(x.name)+'</td><td><select class="schoolTier" data-name="'+esc(x.name)+'">'+[1,2,3].map(n=>'<option '+(x.tier==n?'selected':'')+'>'+n+'</option>').join('')+'</select></td><td>'+store.tx.filter(t=>t.school===x.name&&t.at.slice(0,7)===new Date().toISOString().slice(0,7)).reduce((a,t)=>a+t.qty,0)+'</td></tr>').join('')+'</table>';
el("memberRows").innerHTML='<table><tr><th>Nama</th><th>Kode</th><th>Status</th></tr>'+extra.members.map((x,i)=>'<tr><td>'+esc(x.name)+'</td><td>'+esc(x.code)+'</td><td><button class="secondary memberToggle" data-i="'+i+'">'+(x.active?'Aktif':'Nonaktif')+'</button></td></tr>').join('')+'</table>';
el("bundleRows").textContent='Umum: '+extra.bundles.Umum+' | Grup: '+extra.bundles.Grup;
el("bundleComponents").value=extra.bundles[el("bundleType").value]||"";
}
function selection(){
const p=current();if(!p)return;
const school=p[0]==="Grup"&&p[1].startsWith("Sekolah"),member=p[0]==="Grup"&&p[1]==="Member Warga",bundle=p[1]==="Bundling";
el("schoolPick").classList.toggle("hidden",!school);el("memberPick").classList.toggle("hidden",!member);el("bundleInfo").classList.toggle("hidden",!bundle);
if(bundle)el("bundleInfo").textContent="Isi paket: "+(extra.bundles[p[0]]||"Belum ditentukan");
if(school){const prev=el("schoolSelect").value;el("schoolSelect").innerHTML='<option value="">Pilih sekolah</option>'+extra.schools.filter(x=>x.tier===p[1].slice(-1)).map(x=>'<option value="'+esc(x.name)+'">'+esc(x.name)+'</option>').join('');el("schoolSelect").value=prev;}
}
el("addSchool").addEventListener("click",()=>{const name=el("newSchool").value.trim().slice(0,80);if(!name||extra.schools.some(x=>x.name.toLowerCase()===name.toLowerCase()))return alert("Nama sekolah wajib diisi dan unik.");extra.schools.push({name,tier:el("newSchoolTier").value});persist();el("newSchool").value="";refresh();selection()});
el("addMember").addEventListener("click",()=>{const name=el("newMemberName").value.trim().slice(0,80),code=el("newMemberCode").value.trim().toUpperCase().slice(0,40);if(!name||!code||extra.members.some(x=>x.code===code))return alert("Nama dan kode kartu wajib diisi dan kode harus unik.");extra.members.push({name,code,active:true});persist();el("newMemberName").value="";el("newMemberCode").value="";refresh()});
el("saveBundle").addEventListener("click",()=>{const val=el("bundleComponents").value.trim().slice(0,160);if(!val)return alert("Isi komponen paket.");extra.bundles[el("bundleType").value]=val;persist();refresh();selection()});
el("bundleType").addEventListener("change",refresh);
document.addEventListener("click",e=>{if(e.target.classList.contains("memberToggle")){const m=extra.members[Number(e.target.dataset.i)];if(m){m.active=!m.active;persist();refresh()}}});
document.addEventListener("change",e=>{if(e.target.classList.contains("schoolTier")){const x=extra.schools.find(x=>x.name===e.target.dataset.name);if(x){x.tier=e.target.value;persist();refresh();selection()}}});
el("type").addEventListener("change",()=>setTimeout(selection,0));el("category").addEventListener("change",selection);
const originalCheckout=el("checkout");const newCheckout=originalCheckout.cloneNode(true);originalCheckout.replaceWith(newCheckout);
newCheckout.addEventListener("click",()=>{
const shift=window.EasyTicketOperations?.active();if(!shift){alert("Buka shift petugas di menu Petugas & Shift sebelum transaksi.");return;}
const p=current();if(!p)return;
const isSchool=p[0]==="Grup"&&p[1].startsWith("Sekolah"),isMember=p[0]==="Grup"&&p[1]==="Member Warga";
const school=el("schoolSelect").value,memberCode=el("memberCode").value.trim().toUpperCase();
if(isSchool&&!extra.schools.some(x=>x.name===school&&x.tier===p[1].slice(-1)))return alert("Pilih sekolah terdaftar sesuai kategori Riverside.");
if(isMember&&!extra.members.some(x=>x.code===memberCode&&x.active))return alert("Kode kartu member tidak ditemukan atau tidak aktif.");
const q=Number(el("qty").value);if(!Number.isInteger(q)||q<p[4]||q>1000)return alert("Jumlah tiket tidak memenuhi ketentuan.");
const unitPrice=p[el("day").value==="weekday"?2:3],total=q*unitPrice,payment=el("payment").value,received=payment==="Tunai"?Number(el("cashReceived").value):null;
if(payment==="Tunai"&&(!Number.isSafeInteger(received)||received<total))return alert("Uang diterima kurang dari total.");
const t={shiftId:shift.id,cashierId:shift.staffId,terminalId:shift.terminalId,merchantId:window.EasyTicketTenant.activeId(),locationId:window.EasyTicketTenant.data.locations[window.EasyTicketTenant.activeId()],id:"DEMO-"+Date.now(),at:new Date().toISOString(),type:p[0],category:p[1],day:el("day").value,qty:q,unitPrice,payment,buyer:el("buyer").value.slice(0,80),school:isSchool?school:null,memberCode:isMember?memberCode:null,bundle:p[1]==="Bundling"?extra.bundles[p[0]]:null,total,received};
store.tx.unshift(t);save();el("receipt").classList.remove("hidden");makeReceipt(t);el("print").style.display="block";render();refresh();
});
refresh();selection();
})();