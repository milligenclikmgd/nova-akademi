window.novaApplicationEndpoint=path=>(["nova-akademi.vercel.app","novasanat.com.tr","www.novasanat.com.tr"].includes(location.hostname)?"https://nova-akademi.milligenclikmgd.workers.dev":"")+path;
(()=>{
 let cities=[];
 const map=document.querySelector("#turkey-map"),mount=document.querySelector("#turkey-map-svg"),cityIndex=document.querySelector("#city-index"),picker=document.querySelector("#city-picker");
 const title=document.querySelector("#city-picker-title"),back=document.querySelector("#picker-back");
 const citySearchInput=document.querySelector("#city-search");
 let citySearch="";
 const views=[...picker.querySelectorAll("[data-picker-view]")];
 citySearchInput?.addEventListener("input",()=>{citySearch=citySearchInput.value;createCityIndex()});
 let selectedCity=null,selectedGroupId='',settings=null,provinceNodes=new Map();
 const groupTemplate=picker.querySelector('[data-picker-view="groups"] [data-group]')?.cloneNode(true),branchTemplate=picker.querySelector('[data-picker-view="arts"] [data-branch]')?.cloneNode(true);
 const tooltip=document.createElement("div");tooltip.className="map-province-tooltip";tooltip.hidden=true;tooltip.setAttribute("role","status");document.body.append(tooltip);
 const cityForProvince=id=>cities.find(item=>item.provinceIds?.includes(id));
 function showProvinceTooltip(event,city){if(!city||event.pointerType==="touch")return;tooltip.textContent=city.name;tooltip.hidden=false;const gap=14,rect=tooltip.getBoundingClientRect();tooltip.style.left=Math.min(event.clientX+gap,window.innerWidth-rect.width-8)+"px";tooltip.style.top=Math.min(event.clientY+gap,window.innerHeight-rect.height-8)+"px"}
 const assignmentFor=id=>settings?.accepting&&Array.isArray(settings?.cityExams?.[id])?settings.cityExams[id]:[];
 const setView=name=>{views.forEach(view=>view.hidden=view.dataset.pickerView!==name);back.hidden=name==="groups";picker.dataset.view=name};
 const availableBranches=(group,city=selectedCity)=>(group?.branches||[]).filter(branch=>branch.active!==false&&assignmentFor(city?.id).includes(branch.id));
 function updateChoices(city){
  selectedGroupId='';
  const groups=picker.querySelector('[data-picker-view="groups"]');
  groups.querySelectorAll("[data-group]").forEach(button=>button.remove());
  (settings?.groups||[]).filter(group=>group.active!==false&&availableBranches(group,city).length).forEach(group=>{
   if(!groupTemplate)return;
   const branches=availableBranches(group,city),button=groupTemplate.cloneNode(true);
   button.hidden=false;button.dataset.group=group.id;
   button.querySelector("strong").textContent=group.name;
   button.querySelector("small").textContent=branches.length===1?"1 sınav türü":"Sınav türleri";
   button.addEventListener("click",()=>{
    selectedGroupId=group.id;
    renderBranchChoices(group,city);
    setView("arts");
   });
   groups.append(button);
  });
  const arts=picker.querySelector('[data-picker-view="arts"]');
  arts.querySelectorAll("[data-branch]").forEach(button=>button.remove());
  const prompt=arts.querySelector(".city-picker__prompt");
  if(prompt)prompt.textContent="Önce bir sınav alanı seçin.";
 }
 function renderBranchChoices(group,city){
  const arts=picker.querySelector('[data-picker-view="arts"]');
  arts.querySelectorAll("[data-branch]").forEach(button=>button.remove());
  const prompt=arts.querySelector(".city-picker__prompt");
  if(prompt)prompt.textContent=group.name+" · Sınav türünü seçin.";
  availableBranches(group,city).forEach((branch,index)=>{
   if(!branchTemplate)return;
   const button=branchTemplate.cloneNode(true);
   button.hidden=false;button.dataset.branch=branch.id;
   const number=button.querySelector(".branch-choice__number"),name=button.querySelector("strong");
   if(number)number.textContent=String(index+1).padStart(2,"0");
   if(name)name.textContent=branch.name;
   button.addEventListener("click",()=>launchForm(group.id,branch.id));
   arts.append(button);
  });
 }
 const openPicker=city=>{if(!settings?.accepting||!assignmentFor(city.id).length)return;selectedCity=city;title.textContent=city.name;updateChoices(city);setView("groups");picker.showModal()};
 function launchForm(group,branch){
  if(!selectedCity)return;
  const city=selectedCity;
  picker.addEventListener("close",()=>window.openNovaApplication?.(city,group,branch),{once:true});
  picker.close();
 }
 function createCityIndex(){
  if(!cityIndex)return;
  cityIndex.replaceChildren();
  const query=citySearch.trim().toLocaleLowerCase("tr-TR");
  const activeCities=settings?.accepting?cities.filter(city=>assignmentFor(city.id).length>0):[];
  const visibleCities=activeCities.filter(city=>city.name.toLocaleLowerCase("tr-TR").includes(query));
  if(!visibleCities.length){
   const empty=document.createElement("p");
   empty.className="city-index__empty";
   empty.textContent=query?"Aramanızla eşleşen açık sınav ili bulunamadı.":settings?.accepting?"Şu anda sınav başvurusu açık il bulunmuyor.":"Başvurular henüz açılmadı.";
   cityIndex.append(empty);
   return;
  }
  for(const city of visibleCities){
   const chip=document.createElement("button");
   chip.type="button";chip.className="city-index__item has-exams";chip.setAttribute("aria-label",city.name+" sınav merkezini seç");
   const pin=document.createElement("span");pin.className="city-index__pin";pin.setAttribute("aria-hidden","true");
   const name=document.createElement("span");name.className="city-index__name";name.textContent=city.name;
   const arrow=document.createElement("span");arrow.className="city-index__arrow";arrow.setAttribute("aria-hidden","true");arrow.textContent="›";
   chip.append(pin,name,arrow);
   chip.addEventListener("click",()=>openPicker(city));
   cityIndex.append(chip);
  }
 }
 function styleMap(){
  const closed=!settings?.accepting;map.classList.toggle("is-applications-closed",closed);map.setAttribute("aria-disabled",String(closed));document.querySelector("#applications-closed").hidden=!closed;
  for(const [provinceId,group] of provinceNodes){
   const city=cityForProvince(provinceId),active=!!settings?.accepting&&!!city&&assignmentFor(city.id).length>0;
   group.classList.toggle("is-exam-city",active);
   group.setAttribute("aria-label",(city?.name||group.dataset.cityName||provinceId)+(active?" · Sınav merkezi":""));
   group.removeAttribute("title");group.querySelector(":scope > title")?.remove();
   if(active){group.setAttribute("role","button");group.setAttribute("tabindex","0");group.setAttribute("aria-label",city.name+" sınav seçeneklerini aç");group.setAttribute("aria-pressed","false");group.onclick=()=>openPicker(city);group.onkeydown=event=>{if(event.key==="Enter"||event.key===" "){event.preventDefault();openPicker(city)}}}
   else{group.removeAttribute("role");group.removeAttribute("tabindex");group.removeAttribute("aria-label");group.removeAttribute("aria-pressed");group.onclick=null;group.onkeydown=null}
   group.querySelectorAll("path").forEach(path=>{path.style.fill=active?"#0b4c9c":"#8fc4ef";path.style.stroke="#ffffff";path.style.strokeWidth=".7";path.style.vectorEffect="non-scaling-stroke";path.style.opacity="1";path.style.transition="fill .22s ease,opacity .22s ease"});
  }
  createCityIndex();
 }
 async function loadMap(){
  try{
   const response=await fetch("assets/turkey-provinces.svg?v=20261021-1",{cache:"force-cache"});
   if(!response.ok)throw Error("Harita kaynağı yüklenemedi.");
   const source=await response.text(),doc=new DOMParser().parseFromString(source,"image/svg+xml");
   if(doc.querySelector("parsererror"))throw Error("Harita dosyası okunamadı.");
   const svg=document.importNode(doc.documentElement,true);svg.setAttribute("class","turkey-province-svg");svg.setAttribute("role","group");svg.setAttribute("aria-label","Türkiye il sınırları ve sınav merkezleri");
   mount.replaceChildren(svg);
   provinceNodes=new Map([...svg.querySelectorAll(".turkey > g[id]")].map(group=>[group.id,group]));
   for(const [provinceId,group] of provinceNodes){group.dataset.cityName=group.dataset.cityName||provinceId;group.addEventListener("pointerenter",event=>showProvinceTooltip(event,cityForProvince(provinceId)));group.addEventListener("pointermove",event=>showProvinceTooltip(event,cityForProvince(provinceId)));group.addEventListener("pointerleave",()=>{tooltip.hidden=true})}
   map.dataset.mapState="ready";styleMap();
  }catch(error){map.dataset.mapState="error";const loading=map.querySelector(".turkey-map__loading");loading.textContent="Türkiye haritası şu anda yüklenemiyor. Lütfen sayfayı yenileyin."}
 }
 async function loadSettings(){
  try{const response=await fetch(window.novaApplicationEndpoint("/api/applications/config"),{cache:"no-store"}),result=await response.json();if(!response.ok)throw Error(result.error||"Sınav şehirleri yüklenemedi.");settings=result.settings||{};cities=settings.cities||[];styleMap()}
  catch{settings={cityExams:{}};cities=[];styleMap()}
 }
 document.querySelector("#picker-close").addEventListener("click",()=>picker.close());
 back.addEventListener("click",()=>setView("groups"));
 picker.addEventListener("click",event=>{if(event.target===picker)picker.close()});

 Promise.all([loadMap(),loadSettings()]);
})();
