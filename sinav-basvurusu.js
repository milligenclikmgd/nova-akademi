window.novaApplicationEndpoint=path=>(location.hostname==="nova-akademi.vercel.app"?"https://nova-akademi.milligenclikmgd.workers.dev":"")+path;
(()=>{
 const cities=[{"id":"istanbul","name":"İstanbul","provinceId":"istanbul"},{"id":"sakarya","name":"Sakarya","provinceId":"sakarya"},{"id":"bursa","name":"Bursa","provinceId":"bursa"},{"id":"izmir","name":"İzmir","provinceId":"izmir"},{"id":"eskisehir","name":"Eskişehir","provinceId":"eskisehir"},{"id":"ankara","name":"Ankara","provinceId":"ankara"},{"id":"antalya","name":"Antalya","provinceId":"antalya"},{"id":"mersin","name":"Mersin","provinceId":"mersin"},{"id":"adana","name":"Adana","provinceId":"adana"},{"id":"antep","name":"Antep","provinceId":"gaziantep"},{"id":"diyarbakir","name":"Diyarbakır","provinceId":"diyarbakir"},{"id":"erzurum","name":"Erzurum","provinceId":"erzurum"},{"id":"van","name":"Van","provinceId":"van"},{"id":"samsun","name":"Samsun","provinceId":"samsun"},{"id":"ordu","name":"Ordu","provinceId":"ordu"},{"id":"trabzon","name":"Trabzon","provinceId":"trabzon"}];
 const map=document.querySelector("#turkey-map"),mount=document.querySelector("#turkey-map-svg"),cityIndex=document.querySelector("#city-index"),picker=document.querySelector("#city-picker");
 const title=document.querySelector("#city-picker-title"),back=document.querySelector("#picker-back");
 const views=[...picker.querySelectorAll("[data-picker-view]")];
 let selectedCity=null,settings=null,provinceNodes=new Map();
 const assignmentFor=id=>Array.isArray(settings?.cityExams?.[id])?settings.cityExams[id]:[];
 const setView=name=>{views.forEach(view=>view.hidden=view.dataset.pickerView!==name);back.hidden=name==="groups";picker.dataset.view=name};
 const openPicker=city=>{if(!assignmentFor(city.id).length)return;selectedCity=city;title.textContent=city.name;updateChoices(city);setView("groups");picker.showModal()};
 const availableBranches=(group,city=selectedCity)=>group?.branches.filter(branch=>assignmentFor(city?.id).includes(branch.id))||[];
 const branchForAlias=(group,alias,city=selectedCity)=>{const patterns={dance:/dans|halk oyun|bale/i,symphony:/senfoni|orkestra/i,stage:/sahne|tiyatro/i};return availableBranches(group,city).find(branch=>patterns[alias]?.test(branch.name))};
 function updateChoices(city){
  const groups=picker.querySelector('[data-picker-view="groups"]');
  groups.querySelectorAll("[data-group]").forEach(button=>{const group=settings.groups.find(item=>item.id===button.dataset.group);button.hidden=!availableBranches(group,city).length});
  const arts=picker.querySelector('[data-picker-view="arts"]'),artsGroup=settings.groups.find(item=>item.id==="sanat");
  arts.querySelectorAll("[data-branch]").forEach(button=>button.hidden=!branchForAlias(artsGroup,button.dataset.branch,city));
 }
 function launchForm(group,branch){
  if(!selectedCity)return;
  const city=selectedCity;
  picker.addEventListener("close",()=>window.openNovaApplication?.(city,group,branch),{once:true});
  picker.close();
 }
 function createCityIndex(){
  cityIndex.replaceChildren();
  for(const city of cities){
   const active=assignmentFor(city.id).length>0,chip=document.createElement("button");
   chip.type="button";chip.className="city-index__item"+(active?" has-exams":"");chip.disabled=!active;chip.setAttribute("aria-label",city.name+(active?" sınav merkezini seç":" sınav ataması bulunmuyor"));
   const pin=document.createElement("span");pin.className="city-index__pin";pin.setAttribute("aria-hidden","true");chip.append(pin,document.createTextNode(city.name));
   if(active)chip.addEventListener("click",()=>openPicker(city));else chip.title="Bu şehirde henüz sınav tanımlanmadı";
   cityIndex.append(chip);
  }
 }
 function styleMap(){
  for(const [provinceId,group] of provinceNodes){
   const city=cities.find(item=>item.provinceId===provinceId),active=!!city&&assignmentFor(city.id).length>0;
   group.classList.toggle("is-exam-city",active);
   if(active){group.setAttribute("role","button");group.setAttribute("tabindex","0");group.setAttribute("aria-label",city.name+" sınav seçeneklerini aç");group.setAttribute("aria-pressed","false");if(!group.querySelector(":scope > title")){const titleNode=document.createElementNS("http://www.w3.org/2000/svg","title");titleNode.textContent=city.name+" · Sınav merkezi";group.prepend(titleNode)}group.onclick=()=>openPicker(city);group.onkeydown=event=>{if(event.key==="Enter"||event.key===" "){event.preventDefault();openPicker(city)}}}
   else{group.removeAttribute("role");group.removeAttribute("tabindex");group.removeAttribute("aria-label");group.removeAttribute("aria-pressed");group.onclick=null;group.onkeydown=null}
   group.querySelectorAll("path").forEach(path=>{path.style.fill=active?"#2c78b7":"#e5ebf1";path.style.stroke="#ffffff";path.style.strokeWidth="1.35";path.style.vectorEffect="non-scaling-stroke";path.style.opacity="1";path.style.transition="fill .22s ease,opacity .22s ease"});
  }
  createCityIndex();
 }
 async function loadMap(){
  try{
   const response=await fetch("assets/turkey-provinces.svg?v=20261021-1",{cache:"force-cache"});
   if(!response.ok)throw Error("Harita kaynağı yüklenemedi.");
   const source=await response.text(),doc=new DOMParser().parseFromString(source,"image/svg+xml");
   if(doc.querySelector("parsererror"))throw Error("Harita dosyası okunamadı.");
   const svg=document.importNode(doc.documentElement,true);svg.setAttribute("class","turkey-province-svg");svg.setAttribute("role","img");svg.setAttribute("aria-label","Türkiye il sınırları ve sınav merkezleri");
   mount.replaceChildren(svg);
   provinceNodes=new Map([...svg.querySelectorAll(".turkey > g[id]")].map(group=>[group.id,group]));
   map.dataset.mapState="ready";styleMap();
  }catch(error){map.dataset.mapState="error";const loading=map.querySelector(".turkey-map__loading");loading.textContent="Türkiye haritası şu anda yüklenemiyor. Lütfen sayfayı yenileyin."}
 }
 async function loadSettings(){
  try{const response=await fetch(window.novaApplicationEndpoint("/api/applications/config"),{cache:"no-store"}),result=await response.json();if(!response.ok)throw Error(result.error||"Sınav şehirleri yüklenemedi.");settings=result.settings||{};styleMap()}
  catch{settings={cityExams:{}};styleMap()}
 }
 document.querySelector("#picker-close").addEventListener("click",()=>picker.close());
 back.addEventListener("click",()=>setView("groups"));
 picker.addEventListener("click",event=>{if(event.target===picker)picker.close()});
 picker.querySelectorAll("[data-group]").forEach(button=>button.addEventListener("click",()=>{if(button.dataset.group==="sanat")setView("arts");else launchForm(button.dataset.group,"")}));
 picker.querySelectorAll("[data-branch]").forEach(button=>button.addEventListener("click",()=>launchForm("sanat",button.dataset.branch)));
 Promise.all([loadMap(),loadSettings()]);
})();
