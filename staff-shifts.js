(function(){
const tenant=window.EasyTicketTenant,mid=tenant.activeId(),key="et-pos-operations-v1:"+mid;
let data;try{data=JSON.parse(localStorage.getItem(key))||{}}catch(e){data={}}
data.staff=Array.isArray(data.staff)?data.staff:[];data.terminals=Array.isArray(data.terminals)?data.terminals:[];data.shifts=Array.isArray(data.shifts)?data.shifts:[];
const $=id=>document.getElementById(id),saveOps=()=>localStorage.setItem(key,JSON.stringify(data)),esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const active=()=>data.shifts.find(s=>!s.closedAt);
const selectedLocation=()=>tenant.data.locations[mid]||tenant.active().locations[0].id;
function renderOps(){
$("staffList").innerHTML='<table><tr><th>Petugas</th><th>Peran</th></tr>'+data.staff.map(x=>'<tr><td>'+esc(x.name)+'</td><td>'+esc(x.role)+'</td></tr>').join('')+'</table>';
$("terminalLocation").innerHTML=tenant.active().locations.map(l=>'<option value="'+esc(l.id)+'">'+esc(l.name)+'</option>').join('');$("terminalLocation").value=selectedLocation();
$("terminalList").innerHTML='<table><tr><th>PC</th><th>Lokasi</th></tr>'+data.terminals.map(x=>'<tr><td>'+esc(x.code)+'</td><td>'+esc(tenant.active().locations.find(l=>l.id===x.locationId)?.name||x.locationId)+'</td></tr>').join('')+'</table>';
$("shiftStaff").innerHTML=data.staff.map(x=>'<option value="'+esc(x.id)+'">'+esc(x.name)+'</option>').join('');
$("shiftTerminal").innerHTML=data.terminals.filter(x=>x.locationId===selectedLocation()).map(x=>'<option value="'+esc(x.id)+'">'+esc(x.code)+'</option>').join('');
const s=active();$("openShift").disabled=!!s;$("closeShift").disabled=!s;
$("shiftStatus").textContent=s?'Shift aktif: '+(data.staff.find(x=>x.id===s.staffId)?.name||'?')+' · '+(data.terminals.find(x=>x.id===s.terminalId)?.code||'?')+' · mulai '+new Date(s.openedAt).toLocaleString("id-ID"):'Tidak ada shift aktif. Buka shift sebelum transaksi.';
$("shiftHistory").innerHTML='<table><tr><th>Petugas / PC</th><th>Waktu</th><th>Status / Selisih</th></tr>'+data.shifts.slice().reverse().map(x=>'<tr><td>'+esc(data.staff.find(z=>z.id===x.staffId)?.name||'?')+' / '+esc(data.terminals.find(z=>z.id===x.terminalId)?.code||'?')+'</td><td>'+new Date(x.openedAt).toLocaleString("id-ID")+'</td><td>'+(x.closedAt?'Tutup · Selisih Rp'+Number(x.difference).toLocaleString("id-ID"):'Aktif')+'</td></tr>').join('')+'</table>';
}
$("addStaff").addEventListener("click",()=>{const name=$("staffName").value.trim().slice(0,80);if(!name)return alert("Isi nama petugas.");data.staff.push({id:"s-"+Date.now(),name,role:$("staffRole").value});saveOps();$("staffName").value="";renderOps()});
$("addTerminal").addEventListener("click",()=>{const code=$("terminalCode").value.trim().toUpperCase().slice(0,30),locationId=$("terminalLocation").value;if(!code||data.terminals.some(x=>x.code===code))return alert("Kode PC wajib unik.");data.terminals.push({id:"t-"+Date.now(),code,locationId});saveOps();$("terminalCode").value="";renderOps()});
$("openShift").addEventListener("click",()=>{if(active())return alert("Tutup shift aktif dahulu.");const staffId=$("shiftStaff").value,terminalId=$("shiftTerminal").value,openingCash=Number($("openingCash").value);if(!staffId||!terminalId||!Number.isSafeInteger(openingCash)||openingCash<0)return alert("Pilih petugas, PC, dan saldo awal yang valid.");data.shifts.push({id:"shift-"+Date.now(),staffId,terminalId,locationId:selectedLocation(),openedAt:new Date().toISOString(),openingCash});saveOps();renderOps()});
$("closeShift").addEventListener("click",()=>{const s=active();if(!s)return;const closingCash=Number($("closingCash").value);if(!Number.isSafeInteger(closingCash)||closingCash<0)return alert("Masukkan kas fisik yang valid.");const sales=store.tx.filter(t=>t.shiftId===s.id&&t.payment==="Tunai").reduce((a,t)=>a+t.total,0);const expected=s.openingCash+sales;const difference=closingCash-expected;if(!confirm("Kas seharusnya Rp"+expected.toLocaleString("id-ID")+". Selisih Rp"+difference.toLocaleString("id-ID")+". Tutup shift?"))return;s.closedAt=new Date().toISOString();s.closingCash=closingCash;s.expectedCash=expected;s.difference=difference;saveOps();renderOps()});
window.EasyTicketOperations={active,staff:()=>data.staff,terminals:()=>data.terminals,refresh:renderOps};
renderOps();
})();