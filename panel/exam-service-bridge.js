(()=>{
 const csrf=document.querySelector('meta[name="csrf-token"]')?.content||'';
 const nativeFetch=window.fetch.bind(window);
 const workerOrigin='https://nova-akademi.milligenclikmgd.workers.dev';
 window.novaWorkerApi=async(path,options={})=>{
  const method=(options.method||'GET').toUpperCase(),headers=new Headers(options.headers||{});
  if(method!=='GET'&&method!=='HEAD')headers.set('X-CSRF-Token',csrf);
  const url='/api/worker-proxy.php?path='+encodeURIComponent(path);
  return nativeFetch(url,{...options,method,headers,credentials:'same-origin',cache:'no-store'});
 };
 window.fetch=(input,options={})=>{
  const raw=typeof input==='string'?input:(input instanceof Request?input.url:'');
  if(raw.startsWith('/api/panel/'))return window.novaWorkerApi(raw,options);
  return nativeFetch(input,options);
 };
 const notice=document.querySelector('#worker-connect-notice'),connectDialog=document.querySelector('#worker-connect-dialog'),connectForm=document.querySelector('#worker-connect-form'),connectError=document.querySelector('#worker-connect-error');
 const summaryDialog=document.querySelector('#active-exams-dialog'),summaryList=document.querySelector('#active-exams-by-city'),summaryEmpty=document.querySelector('#active-exams-empty');
 const message=(node,value='')=>{if(!node)return;node.textContent=value;node.hidden=!value};
 const openConnect=()=>{if(connectDialog&&!connectDialog.open)connectDialog.showModal()};
 document.querySelector('#worker-connect-open')?.addEventListener('click',openConnect);
 document.querySelectorAll('[data-close-connect]').forEach(button=>button.addEventListener('click',()=>connectDialog?.close()));
 document.querySelector('[data-close-summary]')?.addEventListener('click',()=>summaryDialog?.close());
 document.querySelector('#active-exams-open')?.addEventListener('click',()=>summaryDialog?.showModal());
 function renderSummary(sessions,settings,applicationSummary){
  const active=sessions.filter(item=>['open','published'].includes(item.status));
  const cities=new Set(active.map(item=>item.city));
  const count=document.querySelector('#active-exam-count'),cityCount=document.querySelector('#active-city-count'),appCount=document.querySelector('#application-total-count');
  if(count)count.textContent=String(active.length);if(cityCount)cityCount.textContent=String(cities.size);if(appCount)appCount.textContent=String(applicationSummary?.summary?.total??0);
  summaryList?.replaceChildren();const grouped=new Map();for(const item of sessions){const city=item.cityName||settings?.cities?.find(city=>city.id===item.city)?.name||item.city||'İl belirtilmemiş';if(!grouped.has(city))grouped.set(city,[]);grouped.get(city).push(item)}
  if(summaryEmpty)summaryEmpty.hidden=grouped.size>0;
  [...grouped.entries()].sort(([a],[b])=>a.localeCompare(b,'tr')).forEach(([city,items])=>{const section=document.createElement('section'),heading=document.createElement('h3'),list=document.createElement('ul');section.className='active-exam-city';heading.textContent=city;items.sort((a,b)=>(a.title||a.branchName||'').localeCompare(b.title||b.branchName||'','tr')).forEach(item=>{const li=document.createElement('li'),name=document.createElement('strong'),meta=document.createElement('small');name.textContent=item.title||item.branchName||'Sınav';meta.textContent=[item.period,item.status==='open'?'Başvuruya açık':item.status==='published'?'Yayında':item.status==='draft'?'Taslak':item.status==='closed'?'Durduruldu':item.status==='archived'?'Arşivlendi':'Tamamlandı'].filter(Boolean).join(' · ');li.append(name,meta);list.append(li)});section.append(heading,list);summaryList?.append(section)});
 }
 function panelUnavailable(text){
  window.dispatchEvent(new CustomEvent('nova:panel-unavailable',{detail:{message:text}}));
 }
 async function loadWorkerData(){
  let session;
  try{session=await window.novaWorkerApi('/api/panel/session')}catch(error){notice.hidden=false;panelUnavailable('Sınav servisine ulaşılamadı. Bağlantıyı yenileyip tekrar deneyin.');throw error}
  if(!session.ok){
   notice.hidden=false;
   if(session.status===401)openConnect();
   let data={};try{data=await session.json()}catch{}
   const text=data.error||'Sınav servisi oturumu doğrulanamadı.';
   panelUnavailable(session.status===401?'Sınav servisi bağlantısı gerekiyor. Üstteki “Bağlantıyı kur” düğmesini kullanın.':text);
   if(session.status!==401)throw Error(text);
   return;
  }
  const [settingsResponse,sessionsResponse,applicationsResponse]=await Promise.all([window.novaWorkerApi('/api/panel/settings'),window.novaWorkerApi('/api/panel/exam-sessions'),window.novaWorkerApi('/api/panel/applications/summary')]);
  const [settingsData,sessionsData,applicationData]=await Promise.all([settingsResponse.json(),sessionsResponse.json(),applicationsResponse.ok?applicationsResponse.json():Promise.resolve({})]);
  if(!settingsResponse.ok||!sessionsResponse.ok){
   notice.hidden=false;
   const failed=!settingsResponse.ok?settingsData:sessionsData;
   const text=failed.error||'Sınav verileri alınamadı.';
   panelUnavailable(text);throw Error(text);
  }
  notice.hidden=true;renderSummary(sessionsData.sessions||[],settingsData.settings||{},applicationData);
  window.dispatchEvent(new CustomEvent('nova:panel-ready',{detail:{settings:settingsData.settings}}));
 }
 connectForm?.addEventListener('submit',async event=>{
  event.preventDefault();const button=connectForm.querySelector('[type="submit"]'),password=connectForm.elements.password.value;
  button.disabled=true;button.textContent='Bağlanıyor…';message(connectError,'');
  try{const response=await nativeFetch('/api/worker-proxy.php?connect=1',{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'Content-Type':'application/json','X-CSRF-Token':csrf},body:JSON.stringify({password})});const data=await response.json();if(!response.ok)throw Error(data.error||'Bağlantı kurulamadı.');connectForm.reset();connectDialog.close();await loadWorkerData()}
  catch(error){message(connectError,error.message)}
  finally{button.disabled=false;button.textContent='Güvenli şekilde bağlan'}
 });
 loadWorkerData().catch(error=>{notice.hidden=false;message(connectError,error.message)});
})();
