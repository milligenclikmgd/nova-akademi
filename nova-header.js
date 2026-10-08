/* NOVA ortak header: Menü eklemek için yalnızca navigation dizisini düzenleyin.
   children alanı olan ana başlıklar 2. seviye panel açar.
   2. seviye başlığa children eklerseniz, seçenekler otomatik sağda 3. seviye panel olarak açılır. */
(()=>{
  const navigation=[
    {label:'KURUMSAL',href:'index.html#kurumsal',children:[
      {label:'Hakkımızda',href:'hakkimizda.html'},
      {label:'Faaliyet Alanları',href:'index.html#faaliyet'},
      {label:'Rakamlarla NOVA',href:'index.html#rakamlar'},
      {label:'Birimler',href:'index.html#birimler',children:[
        {label:'Ölçme Değerlendirme',href:'index.html#olcme'},
        {label:'Program Geliştirme',href:'index.html#program'},
        {label:'Bilgi İşlem Merkezi',href:'index.html#bilgi-islem'},
        {label:'Stratejik Plan',href:'index.html#strateji'},
        {label:'İnsan Kaynakları',href:'index.html#ik'}
      ]},
      {label:'Değerlerimiz',href:'index.html#degerler'},
      {label:'Yönetim Kurulu',href:'index.html#yonetim'},
      {label:'İş Ortakları',href:'index.html#ortaklar'}
    ]},
    {label:'EĞİTİM MODELİMİZ',href:'index.html#model'},
    {label:'YETENEK SİSTEMİ',href:'index.html#sistem'},
    {label:'ÖĞRENCİ YOLCULUĞU',href:'index.html#yolculuk'},
    {label:'NOVA GLOBAL',href:'index.html#global'},
    {label:'İLETİŞİM',href:'index.html#iletisim'}
  ];

  const link=(item,className)=>`<a class="${className}" href="${item.href||'#'}">${item.label}</a>`;
  const renderThird=items=>`<div class="nova-submenu-level3">${items.map(item=>link(item,'nova-submenu-level3-link')).join('')}</div>`;
  const renderSecond=items=>items.map(item=>item.children?.length
    ? `<div class="nova-submenu-group">${link(item,'nova-submenu-level2')}${renderThird(item.children)}</div>`
    : link(item,'nova-submenu-level2')).join('');
  const renderTop=item=>`<div class="nova-nav-item">${link(item,'nova-nav-link')}${item.children?.length?`<div class="nova-submenu">${renderSecond(item.children)}</div>`:''}</div>`;
  const html=`<header class="nova-main-header"><button class="hamb" type="button" aria-label="Menüyü aç">☰</button><a class="nova-brand" href="index.html#top"><img src="assets/nova-3d.webp" alt="NOVA Performans Sanatları Gelişim Merkezi"></a><nav class="nova-nav" aria-label="Ana menü">${navigation.map(renderTop).join('')}</nav><a class="nova-results" href="sinavlar.html">SINAV SONUÇLARI <span aria-hidden="true">↗</span></a></header>`;

  document.querySelectorAll('[data-nova-header]').forEach(slot=>slot.innerHTML=html);
  const close=item=>{item.classList.remove('is-open');item.querySelector('.nova-sub-toggle')?.setAttribute('aria-expanded','false')};
  const open=item=>{document.querySelectorAll('.nova-nav-item.is-open').forEach(other=>{if(other!==item)close(other)});item.classList.add('is-open');item.querySelector('.nova-sub-toggle')?.setAttribute('aria-expanded','true')};
  document.querySelectorAll('.nova-nav-item').forEach(item=>{
    const submenu=item.querySelector('.nova-submenu');
    if(!submenu)return;
    item.classList.add('has-submenu');
    const arrow=document.createElement('span');
    arrow.className='nova-arrow nova-sub-toggle';
    arrow.setAttribute('aria-hidden','true');
    arrow.innerHTML='<svg viewBox="0 0 16 16" aria-hidden="true"><path d="m3 6 5 5 5-5"/></svg>';
    item.querySelector('.nova-nav-link').after(arrow);
    item.addEventListener('mouseenter',()=>open(item));
    item.addEventListener('mouseleave',()=>close(item));
    item.addEventListener('focusin',()=>open(item));
    item.addEventListener('focusout',event=>{if(!item.contains(event.relatedTarget))close(item)});
  });
  document.querySelectorAll('.nova-main-header .hamb').forEach(button=>button.addEventListener('click',()=>button.closest('.nova-main-header').querySelector('.nova-nav').classList.toggle('open')));
})();