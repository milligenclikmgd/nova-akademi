(()=>{
 const root=document.querySelector('#applications-panel');if(!root)return;
 const $=selector=>root.querySelector(selector),dialog=document.querySelector('#application-detail-dialog');
 let page=1,total=0,rows=[],objectUrls=[],busy=false,searchTimer=0;
 const tr=value=>String(value??'').trim()||'—';
 const money=value=>value===null||value===undefined||value===''?'—':Number(value)===0?'Ücretsiz':new Intl.NumberFormat('tr-TR',{style:'currency',currency:'TRY'}).format(Number(value));
 const api=async path=>{const response=await window.novaWorkerApi(path,{method:'GET'});let data;try{data=await response.json()}catch{throw Error(response.redirected?'Panel oturumunuz doğrulanamadı. Panelden yeniden giriş yapın.':'Sunucudan geçerli JSON yanıtı alınamadı (HTTP '+response.status+').')}if(!response.ok)throw Error(data.error||'İstek tamamlanamadı (HTTP '+response.status+').');return data};
 function paymentLabel(value){return ({'dogrulandi':'Ödeme onaylandı','beyan-edildi':'Dekont inceleniyor','odenmedi':'Ödeme bekliyor','odeme-reddedildi':'Dekont reddedildi','yeni-dekont':'Yeni dekont bekleniyor'})[value]||'Durum bilinmiyor'}
 function badge(value,kind='status'){const span=document.createElement('span');span.className='application-badge '+kind+' '+String(value||'').replace(/[^a-z0-9-]/gi,'');span.textContent=kind==='payment'?paymentLabel(value):({yeni:'Yeni',inceleniyor:'İnceleniyor',onaylandi:'Onaylandı',reddedildi:'Reddedildi','eksik-bilgi':'Eksik bilgi',iptal:'İptal',tamamlandi:'Tamamlandı'})[value]||'—';return span}
 function message(value,error=false){const el=$('#applications-message');if(!el)return;el.textContent=value;el.hidden=!value;el.dataset.tone=error?'error':'info'}
 function populateCities(){
  const select=$('#applications-city'),current=select.value,values=[...new Set(rows.map(item=>item.cityName).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'tr'));
  select.replaceChildren(new Option('Tüm iller',''),...values.map(name=>new Option(name,rows.find(item=>item.cityName===name)?.city||'')));
  select.value=[...select.options].some(option=>option.value===current)?current:'';
 }
 function render(){
  const body=$('#applications-rows');body.replaceChildren();
  if(!rows.length){const row=document.createElement('tr'),cell=document.createElement('td');cell.colSpan=6;cell.className='application-empty';cell.textContent=total?'Bu sayfada başvuru yok.':'Henüz başvuru kaydı bulunmuyor.';row.append(cell);body.append(row)}
  for(const item of rows){
   const row=document.createElement('tr');row.className='application-row is-clickable';row.tabIndex=0;row.setAttribute('aria-label','Başvuru ayrıntılarını aç: '+tr(item.name));
   const nameCell=document.createElement('td'),open=document.createElement('button');open.type='button';open.className='application-name';open.textContent=tr(item.name);open.dataset.applicationDetails=String(item.id);const ref=document.createElement('small');ref.textContent=tr(item.reference);open.append(ref);nameCell.append(open);
   const period=document.createElement('td');period.textContent=tr(item.sessionPeriod||item.session?.period);
   const city=document.createElement('td');city.textContent=tr(item.cityName);
   const exam=document.createElement('td');exam.textContent=tr(item.branchName||item.groupName);
   const pay=document.createElement('td');pay.append(badge(item.payment,'payment'));if(item.payment==='dogrulandi'){const check=document.createElement('span');check.className='payment-check';check.setAttribute('aria-label','Ödeme doğrulandı');check.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg>';pay.append(check)}
   const actionCell=document.createElement('td'),detailButton=document.createElement('button');detailButton.type='button';detailButton.className='application-detail-action';detailButton.textContent='Detayları Gör';detailButton.dataset.applicationDetails=String(item.id);actionCell.append(detailButton);row.append(nameCell,period,city,exam,pay,actionCell);row.addEventListener('click',event=>{if(!event.target.closest('button,a'))openDetails(item)});row.addEventListener('keydown',event=>{if((event.key==='Enter'||event.key===' ')&&event.target===row){event.preventDefault();openDetails(item)}});body.append(row)
  }
  $('#applications-total').textContent=String(total);
  $('#applications-page').textContent=total?Math.min((page-1)*30+1,total)+'–'+Math.min(page*30,total)+' / '+total:'0 başvuru';
  $('#applications-prev').disabled=page<=1||busy;$('#applications-next').disabled=page*30>=total||busy;
 }
 $('#applications-rows').addEventListener('click',event=>{const button=event.target.closest('[data-application-details]');if(!button)return;event.preventDefault();event.stopPropagation();const item=rows.find(value=>String(value.id)===button.dataset.applicationDetails);if(item)openDetails(item)});
 async function load(){
  if(busy)return;busy=true;message('Başvurular yükleniyor…');render();
  try{
   const params=new URLSearchParams({page:String(page)}),query=$('#applications-search').value.trim(),city=$('#applications-city').value,payment=$('#applications-payment').value,status=$('#applications-status').value,period=$('#applications-period').value.trim();
   if(query)params.set('q',query);if(city)params.set('city',city);if(payment)params.set('payment',payment);if(status)params.set('status',status);if(period)params.set('period',period);
   const data=await api('/api/panel/applications?'+params.toString());rows=data.applications||[];total=Number(data.total)||0;populateCities();render();message('');
  }catch(error){rows=[];total=0;render();message(error.message,true)}
  finally{busy=false;render()}
 }
 function section(title,entries){
  const box=document.createElement('section');box.className='application-detail-section';const heading=document.createElement('h3');heading.textContent=title;const grid=document.createElement('dl');
  for(const [label,value] of entries){const wrap=document.createElement('div');const dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=label;dd.textContent=tr(value);wrap.append(dt,dd);grid.append(wrap)}
  box.append(heading,grid);$('#application-detail-content').append(box);return box
 }
 function paymentChannel(app){
  const sources=[app.paymentMethod,app.paymentProvider,app.transaction?.provider,app.transaction?.method,app.paymentDetails?.provider,app.paymentDetails?.method,app.registration?.payment?.provider,app.registration?.payment?.method].filter(value=>typeof value==='string'&&value.trim());
  if(sources.length){const value=sources[0];return /ziraat|pos|sanal/i.test(value)?'Sanal POS · '+value:value}
  if(app.receipt)return 'Dekont yüklenmiş · banka transfer bildirimi';
  if(app.paid)return 'Başvuru sahibi ödeme yaptığını beyan etmiş';
  return 'Ödeme kanalı kaydı bulunmuyor';
 }
 function revokeUrls(){for(const url of objectUrls)URL.revokeObjectURL(url);objectUrls=[]}
 function addReceiptSection(label,path){
  const area=document.createElement('section');area.className='application-detail-section receipt-section';const heading=document.createElement('h3');heading.textContent=label;
  const actions=document.createElement('div');actions.className='receipt-actions';const view=document.createElement('button');view.type='button';view.className='compact-button';view.textContent='Görüntüle';const download=document.createElement('button');download.type='button';download.className='compact-button secondary';download.textContent='İndir';const status=document.createElement('p');status.className='receipt-note';status.hidden=true;
  const preview=document.createElement('div');preview.className='receipt-preview';preview.hidden=true;const frame=document.createElement('iframe');frame.title=label+' önizleme';frame.loading='lazy';frame.referrerPolicy='no-referrer';frame.hidden=true;const image=document.createElement('img');image.alt=label;image.hidden=true;preview.append(frame,image);
  actions.append(view,download);area.append(heading,actions,status,preview);$('#application-detail-content').append(area);
  let url='',fileExtension='bin';
  async function fetchFile(){
   if(url)return url;status.hidden=false;status.textContent='Dosya alınıyor…';const response=await window.novaWorkerApi(path,{method:'GET'});if(!response.ok){let data={};try{data=await response.json()}catch{}throw Error(data.error||'Dekont açılamadı.')}
   const blob=await response.blob();url=URL.createObjectURL(blob);objectUrls.push(url);const type=blob.type.toLowerCase();fileExtension=type==='application/pdf'?'pdf':type==='image/png'?'png':type==='image/webp'?'webp':type==='image/jpeg'?'jpg':'bin';if(type.startsWith('image/')){image.src=url;image.hidden=false}else if(type==='application/pdf'||!type){frame.src=url;frame.hidden=false}else{status.textContent='Bu dosyanın tarayıcı önizlemesi desteklenmiyor; indirme düğmesini kullanın.';return url}preview.hidden=false;status.hidden=true;return url;
  }
  view.addEventListener('click',async()=>{try{await fetchFile()}catch(error){status.textContent=error.message;status.hidden=false}});
  download.addEventListener('click',async()=>{try{const fileUrl=await fetchFile(),link=document.createElement('a');link.href=fileUrl;const extension=label.toLocaleLowerCase('tr-TR').includes('kesin')?'kesin-kayit-dekontu':'basvuru-dekontu';link.download=extension+'.'+fileExtension;document.body.append(link);link.click();link.remove()}catch(error){status.textContent=error.message;status.hidden=false}});
 }
 async function openDetails(row){
  revokeUrls();$('#application-detail-content').replaceChildren();$('#application-payment-status').replaceChildren();$('#application-detail-name').textContent=tr(row.name);$('#application-detail-reference').textContent='Başvuru No · '+tr(row.reference);$('#application-detail-loading').hidden=false;$('#application-detail-error').hidden=true;try{if(!dialog)throw Error('Başvuru ayrıntı penceresi sayfada bulunamadı.');if(!dialog.open)dialog.showModal();}catch(error){message(error.message,true);return}
  try{
   const data=await api('/api/panel/applications/'+encodeURIComponent(row.id));if(!data.application)throw Error('Başvuru kaydı bulundu ancak ayrıntı yanıtı boş geldi. Sayfayı yenileyip tekrar deneyin.');const app=data.application;
   $('#application-detail-loading').hidden=true;
   const statusLine=$('#application-payment-status');statusLine.replaceChildren();const verified=app.payment==='dogrulandi';const icon=document.createElement('span');icon.className='payment-status-icon'+(verified?' is-paid':'');icon.innerHTML=verified?'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg>':'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>';const text=document.createElement('div'),title=document.createElement('strong'),note=document.createElement('small');title.textContent=paymentLabel(app.payment);note.textContent=paymentChannel(app);text.append(title,note);statusLine.append(icon,text);
   const exam=app.session||{};section('Sınav bilgileri',[['Dönem',exam.period||app.sessionPeriod],['İl',app.cityName],['Üst kategori',app.groupName],['Başvurduğu sınav',app.branchName],['Sınav tarihi',exam.examAt],['Sınav yeri',exam.address],['Kontenjan',exam.capacity],['Başvuru ücreti',money(app.fee)],['Kesin kayıt ücreti',money(exam.registrationFee)]]);
   const candidate=app.candidate||{};section('Aday bilgileri',[['Ad soyad',[candidate.firstName,candidate.lastName].filter(Boolean).join(' ')||app.name],['T.C. kimlik no',candidate.tc],['Doğum tarihi',candidate.dob],['Cinsiyet',candidate.gender],['Telefon',candidate.phone],['E-posta',candidate.email],['Okul',candidate.school],['Sınıf',candidate.grade],['İkamet ili / ilçe',[candidate.province,candidate.district].filter(Boolean).join(' / ')],['Adres',candidate.address]]);
   for(const contact of app.contacts||[])section(contact.role==='mother'?'Anne bilgileri':contact.role==='father'?'Baba bilgileri':'Veli bilgileri',[['Ad soyad',contact.fullName],['Yakınlık',contact.relationship],['Meslek',contact.occupation],['Telefon',contact.phone],['E-posta',contact.email]]);
   section('Başvuru ve ödeme',[['Başvuru tarihi',app.createdAt],['Başvuru durumu',app.status],['Ödeme durumu',paymentLabel(app.payment)],['Ödeme kanalı',paymentChannel(app)],['Ödeme referansı',app.paymentReference||app.transaction?.reference||app.registration?.payment?.reference],['Başvuru sahibinin ödeme beyanı',app.paid?'Ödeme yaptığını belirtti':'Ödeme yaptığını belirtmedi'],['Sözleşme onayı',app.contractAccepted?'Onaylandı':'Onay yok'],['Yönetici notu',app.note],['İnceleme açıklaması',app.rejectionExplanation]]);
   if(app.applicationContract){const contract=section('Onaylanan sözleşme',[['Sözleşme metni',app.applicationContract]]);contract.querySelector('dl>div:last-child').classList.add('is-wide')}
   section('Başvuru onayları',[['Aile / veli seçimi',app.familyMode],['İletişim kurulacak kişi',(app.contacts||[]).find(item=>item.role===app.primaryContact)?.fullName],['Veli görüşü',app.guardianOpinion],['Sözleşme onay zamanı',app.contractAcceptedAt],['Başvuru onay zamanı',app.confirmationAt]]);
   if(app.receipt)addReceiptSection('Başvuru ödeme dekontu','/api/panel/applications/'+encodeURIComponent(app.id)+'/receipt');
   if(app.paymentReceipt||app.registration?.paymentReceipt)addReceiptSection('Kesin kayıt ödeme dekontu','/api/panel/applications/'+encodeURIComponent(app.id)+'/registration-payment-receipt');
  }catch(error){$('#application-detail-loading').hidden=true;const el=$('#application-detail-error');el.textContent=error.message;el.hidden=false}
 }
 $('#applications-search').addEventListener('input',()=>{clearTimeout(searchTimer);searchTimer=setTimeout(()=>{page=1;load()},280)});
 ['applications-city','applications-payment','applications-status','applications-period'].forEach(id=>$( '#'+id).addEventListener('change',()=>{page=1;load()}));
 $('#applications-prev').addEventListener('click',()=>{if(page>1){page--;load()}});
 $('#applications-next').addEventListener('click',()=>{if(page*30<total){page++;load()}});
 $('#applications-refresh').addEventListener('click',load);
 document.querySelector('#application-detail-close').addEventListener('click',()=>dialog.close());
 dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close()});
 dialog.addEventListener('close',revokeUrls);
 window.addEventListener('nova:panel-ready',()=>{page=1;load()});
})();
