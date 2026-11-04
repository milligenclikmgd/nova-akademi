(()=>{
 const root=document.querySelector('[data-home-slides]'),dotsRoot=document.querySelector('[data-home-slider-dots]');
 if(!root||!dotsRoot)return;
 const fallback=[{id:'fallback-nova-home',image:'/assets/nova-folkdance-hero.jpg?v=20261104-1',alt:'NOVA öğrencileri sahnede',hotspot:{enabled:false}}];
 let slides=fallback,index=0,timer=0,startX=0;
 const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
 const safeLink=value=>{try{const url=new URL(value,location.href);return ['http:','https:'].includes(url.protocol)?url.href:''}catch{return ''}};
 function render(){
  root.replaceChildren();dotsRoot.replaceChildren();
  slides.forEach((slide,i)=>{
   const item=document.createElement('div');item.className='home-slider__slide'+(i===index?' is-active':'')+(i<index?' is-before':'');item.setAttribute('role','group');item.setAttribute('aria-label',(i+1)+' / '+slides.length);
   const picture=document.createElement('picture');picture.className='home-slider-picture';
   if(slide.mobileImage){const source=document.createElement('source');source.media='(max-width:760px)';source.srcset=slide.mobileImage;picture.append(source)}
   const img=document.createElement('img');img.src=slide.image;img.alt=slide.alt||'';img.loading=i===0?'eager':'lazy';if(i===0)img.fetchPriority='high';picture.append(img);item.append(picture);
   const hotspot=slide.hotspot||{},link=hotspot.enabled&&safeLink(slide.link);
   if(link){const anchor=document.createElement('a');anchor.className='home-slider-hotspot';anchor.href=link;anchor.setAttribute('aria-label',slide.alt||'Slider bağlantısını aç');anchor.style.left=hotspot.x+'%';anchor.style.top=hotspot.y+'%';anchor.style.width=hotspot.width+'%';anchor.style.height=hotspot.height+'%';anchor.addEventListener('click',event=>event.stopPropagation());item.append(anchor)}
   root.append(item);
   const dot=document.createElement('button');dot.type='button';dot.className=i===index?'is-active':'';dot.setAttribute('aria-label','Slider görseli '+(i+1));dot.setAttribute('aria-current',String(i===index));dot.addEventListener('click',()=>{go(i);restart()});dotsRoot.append(dot);
  });
  dotsRoot.hidden=slides.length<2;
 }
 function go(next){index=(next+slides.length)%slides.length;root.querySelectorAll('.home-slider__slide').forEach((slide,i)=>{slide.classList.toggle('is-active',i===index);slide.classList.toggle('is-before',i<index)});dotsRoot.querySelectorAll('button').forEach((dot,i)=>{const active=i===index;dot.classList.toggle('is-active',active);dot.setAttribute('aria-current',String(active))})}
 function stop(){clearInterval(timer);timer=0}
 function restart(){stop();if(slides.length<2||reduced.matches||document.hidden)return;timer=setInterval(()=>{if(!root.matches(':hover')&&!root.contains(document.activeElement))go(index+1)},6500)}
 root.addEventListener('mouseenter',stop);root.addEventListener('mouseleave',restart);root.addEventListener('focusin',stop);root.addEventListener('focusout',restart);
 root.addEventListener('pointerdown',event=>{startX=event.clientX},{passive:true});root.addEventListener('pointerup',event=>{const delta=event.clientX-startX;if(Math.abs(delta)>55&&slides.length>1){go(index+(delta<0?1:-1));restart()}},{passive:true});
 document.addEventListener('visibilitychange',()=>document.hidden?stop():restart());reduced.addEventListener?.('change',restart);
 render();
 fetch('/api/site-content',{cache:'no-store'}).then(response=>response.ok?response.json():Promise.reject()).then(data=>{const current=(data.slides||[]).filter(item=>item.published&&item.mediaType==='image'&&item.image);slides=current.length?current:fallback;index=0;render();restart()}).catch(restart);
})();