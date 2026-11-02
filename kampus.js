(()=> {
  const gallery=document.querySelector('[data-campus-gallery]');
  if(!gallery)return;
  const photo=gallery.querySelector('.campus-gallery__photo');
  const dots=[...gallery.querySelectorAll('.campus-gallery__dots button')];
  const scenes=[
    {name:'study',label:'NOVA etüt ve çalışma alanı'},
    {name:'dance',label:'NOVA aynalı hareket stüdyosu'},
    {name:'gym',label:'NOVA spor salonu'}
  ];
  let active=0;
  const show=index=>{
    active=(index+scenes.length)%scenes.length;
    photo.classList.remove('campus-scene--study','campus-scene--dance','campus-scene--gym');
    photo.classList.add('campus-scene--'+scenes[active].name);
    photo.setAttribute('aria-label',scenes[active].label);
    dots.forEach((dot,n)=>{
      dot.classList.toggle('is-active',n===active);
      dot.setAttribute('aria-pressed',String(n===active));
    });
  };
  gallery.querySelector('.campus-gallery__arrow--prev').addEventListener('click',()=>show(active-1));
  gallery.querySelector('.campus-gallery__arrow--next').addEventListener('click',()=>show(active+1));
  dots.forEach((dot,index)=>dot.addEventListener('click',()=>show(index)));
})();