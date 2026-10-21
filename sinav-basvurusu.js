window.novaApplicationEndpoint=path=>(location.hostname==="nova-akademi.vercel.app"?"https://nova-akademi.milligenclikmgd.workers.dev":"")+path;
(()=> {
 const cities=[{"id":"istanbul","name":"İstanbul","lat":41.0082,"lon":28.9784},{"id":"sakarya","name":"Sakarya","lat":40.7569,"lon":30.405},{"id":"bursa","name":"Bursa","lat":40.195,"lon":29.0601},{"id":"izmir","name":"İzmir","lat":38.4237,"lon":27.1428},{"id":"eskisehir","name":"Eskişehir","lat":39.7667,"lon":30.5206},{"id":"ankara","name":"Ankara","lat":39.9334,"lon":32.8597},{"id":"antalya","name":"Antalya","lat":36.8969,"lon":30.7133},{"id":"mersin","name":"Mersin","lat":36.8121,"lon":34.6415},{"id":"adana","name":"Adana","lat":37.0017,"lon":35.3213},{"id":"antep","name":"Antep","lat":37.0662,"lon":37.3781},{"id":"diyarbakir","name":"Diyarbakır","lat":37.9144,"lon":40.211},{"id":"erzurum","name":"Erzurum","lat":39.905,"lon":41.2679},{"id":"van","name":"Van","lat":38.501,"lon":43.38},{"id":"samsun","name":"Samsun","lat":41.2867,"lon":36.3361},{"id":"ordu","name":"Ordu","lat":40.9839,"lon":37.8797},{"id":"trabzon","name":"Trabzon","lat":41.0015,"lon":39.7168}];
 const grid=document.querySelector("#map-cities"),cityIndex=document.querySelector("#city-index"),picker=document.querySelector("#city-picker");
 const title=document.querySelector("#city-picker-title"),back=document.querySelector("#picker-back");
 const views=[...picker.querySelectorAll("[data-picker-view]")];
 let selectedCity=null;
 const project=(lon,lat)=>({x:(lon-25.8)*42.4/820*100,y:(42.2-lat)*54/350*100});
 const setView=name=>{views.forEach(view=>view.hidden=view.dataset.pickerView!==name);back.hidden=name==="groups";picker.dataset.view=name};
 const openPicker=city=>{selectedCity=city;title.textContent=city.name;setView("groups");picker.showModal()};
 grid.querySelectorAll(".map-city").forEach(button=>button.addEventListener("click",()=>openPicker(cities.find(city=>city.id===button.dataset.cityId))));
 for(const city of cities){
  const chip=document.createElement("button");chip.type="button";chip.className="city-index__item";chip.innerHTML='<span class="city-index__pin" aria-hidden="true"></span>'+city.name;
  chip.addEventListener("click",()=>openPicker(city));cityIndex.append(chip);
 }
 document.querySelector("#picker-close").addEventListener("click",()=>picker.close());
 back.addEventListener("click",()=>setView("groups"));
 picker.addEventListener("click",event=>{if(event.target===picker)picker.close()});
 picker.querySelectorAll("[data-group]").forEach(button=>button.addEventListener("click",()=>{
  if(button.dataset.group==="sanat")setView("arts");
  else launchForm(button.dataset.group,"");
 }));
 function launchForm(group,branch){
  if(!selectedCity)return;
  const city=selectedCity;
  picker.addEventListener("close",()=>window.openNovaApplication?.(city,group,branch),{once:true});
  picker.close();
 }
 picker.querySelectorAll("[data-branch]").forEach(button=>button.addEventListener("click",()=>launchForm("sanat",button.dataset.branch)));
})();
