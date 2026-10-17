(()=>{const cities=[
 {id:"ankara",name:"Ankara",active:true,image:"assets/sinav-ankara.webp",alt:"Anıtkabir önünde halk oyunu oynayan çocuklar"},
 {id:"istanbul",name:"İstanbul",active:true,image:"assets/sinav-istanbul.webp",alt:"İstanbul Boğazı ve Kız Kulesi önünde halk oyunu oynayan çocuklar"},
 {id:"izmir",name:"İzmir",active:true,image:"assets/sinav-izmir.webp",alt:"İzmir Saat Kulesi önünde halk oyunu oynayan çocuklar"},
 {id:"kayseri",name:"Kayseri",active:true,image:"assets/sinav-kayseri.webp",alt:"Erciyes Dağı manzarasında halk oyunu oynayan çocuklar"},
 {id:"antalya",name:"Antalya",active:true,image:"assets/sinav-antalya.webp",alt:"Antalya Kaleiçi ve Akdeniz manzarasında halk oyunu oynayan çocuklar"}
];
const exams=[
 {id:"dans-sahne",title:"Dans ve Sahne Sanatları Sınavı",description:"Dans ve sahne sanatları alanlarında yetenek değerlendirmesi."},
 {id:"senfoni",title:"Senfoni Orkestrası Sınavı",description:"Müzikal yeterlilik ve çalgı performansı değerlendirmesi."}
];
const grid=document.querySelector("#city-grid"),searchForm=document.querySelector("#city-search-form"),searchInput=document.querySelector("#city-search-input"),dialog=document.querySelector("#application-dialog"),cityLabel=document.querySelector("#dialog-city"),examLabel=document.querySelector("#dialog-exam");
const normalize=value=>value.toLocaleLowerCase("tr-TR").normalize("NFC").trim();

/* Tüm kapalı satırlar ve en yüksek açık panel için alanı baştan ayır. */
const reserveCitySpace=()=>{
 const cards=[...grid.querySelectorAll(".city-card")];
 if(!cards.length)return;
 const style=getComputedStyle(grid),columns=style.gridTemplateColumns.split(" ").length;
 const rows=Math.ceil(cities.filter(city=>city.active).length/columns);
 const triggerHeight=Math.max(...cards.map(card=>card.querySelector(".city-card__trigger").getBoundingClientRect().height));
 const panelHeight=Math.max(...cards.map(card=>card.querySelector(".city-exams").getBoundingClientRect().height))+1;
 grid.style.minHeight=Math.ceil(rows*(triggerHeight+4)+(rows-1)*(parseFloat(style.rowGap)||0)+panelHeight)+"px";
};

const render=()=>{const activeCities=cities.filter(city=>city.active),term=normalize(searchInput.value),shown=activeCities.filter(city=>normalize(city.name).includes(term));grid.replaceChildren();if(!shown.length){const empty=document.createElement("p");empty.className="city-card__empty";empty.textContent="Aradığınız şehir açık başvuru merkezleri arasında bulunamadı.";grid.append(empty);return}
for(const city of shown){const card=document.createElement("article");card.className="city-card";const panelId="city-panel-"+city.id;card.innerHTML='<button class="city-card__trigger" type="button" aria-expanded="false" aria-controls="'+panelId+'"><span class="city-art"><img src="'+city.image+'" alt="'+city.alt+'" loading="lazy"></span><span class="city-name-row city-card__name-row"><strong class="city-card__name">'+city.name+'</strong><span class="city-card__chevron" aria-hidden="true">›</span></span></button><div class="city-card__panel" id="'+panelId+'"><div class="city-card__panel-inner"><div class="city-exams">'+exams.map((exam,index)=>'<article class="city-exam" style="--exam-index:'+index+'"><p class="city-exam__label">NOVA SINAV BAŞVURUSU · 0'+(index+1)+'</p><h3>'+exam.title+'</h3><p class="city-exam__description">'+exam.description+'</p><button class="city-exam__apply" type="button" data-city="'+city.id+'" data-exam="'+exam.id+'">Sınav Başvurusu Yap <span aria-hidden="true">↗</span></button></article>').join("")+'</div></div></div>';
const trigger=card.querySelector(".city-card__trigger"),panel=card.querySelector(".city-card__panel");panel.style.gridTemplateRows="0fr";panel.inert=true;panel.setAttribute("aria-hidden","true");trigger.addEventListener("click",()=>{const next=!card.classList.contains("is-open");grid.querySelectorAll(".city-card.is-open").forEach(open=>{open.classList.remove("is-open");open.querySelector(".city-card__trigger").setAttribute("aria-expanded","false");const closed=open.querySelector(".city-card__panel");closed.style.gridTemplateRows="0fr";closed.inert=true;closed.setAttribute("aria-hidden","true")});if(next){card.classList.add("is-open");trigger.setAttribute("aria-expanded","true");panel.style.gridTemplateRows="1fr";panel.inert=false;panel.setAttribute("aria-hidden","false")}});
card.querySelectorAll(".city-exam__apply").forEach(button=>button.addEventListener("click",()=>{const exam=exams.find(item=>item.id===button.dataset.exam);cityLabel.textContent=city.name;examLabel.textContent=exam?.title||"";dialog.showModal()}));grid.append(card)}
reserveCitySpace();
};
searchForm.addEventListener("submit",event=>{event.preventDefault();render()});searchInput.addEventListener("input",render);dialog.addEventListener("click",event=>{if(event.target===dialog)dialog.close()});render();
window.addEventListener("resize",reserveCitySpace);
document.fonts?.ready.then(reserveCitySpace);
})();