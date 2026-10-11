/* NOVA ortak header: Menü eklemek için yalnızca navigation dizisini düzenleyin.
   children alanı olan ana başlıklar 2. seviye panel açar.
   2. seviye başlığa children eklerseniz, seçenekler otomatik sağda 3. seviye panel olarak açılır. */
(()=>{
  const navigation=[
    {label:'KURUMSAL',href:'index.html#kurumsal',children:[
      {label:'Hakkımızda',href:'hakkimizda.html'},
      {label:'Faaliyet Alanları',href:'faaliyet-alanlari.html'},
      {label:'Rakamlarla NOVA',href:'rakamlarla-nova.html'},
      {label:'Değerlerimiz',href:'degerlerimiz.html'},
      {label:'Birimler',href:'index.html#birimler',children:[
        {label:'Ölçme Değerlendirme',href:'olcme-degerlendirme.html'},
        {label:'Program Geliştirme',href:'program-gelistirme.html'},
        {label:'Bilgi İşlem Merkezi',href:'bilgi-islem-veri-yonetimi.html'},
        {label:'Stratejik Plan',href:'stratejik-plan-gelisim.html'},
        {label:'İnsan Kaynakları',href:'insan-kaynaklari-egitici-gelisimi.html'}
      ]},
      {label:'Yönetim Kurulu',href:'yonetim-kurulu.html'},
      {label:'İş Ortaklarımız',href:'is-ortaklarimiz.html'}
    ]},
    {label:'EĞİTİM MODELİ',href:'index.html#model',children:[
      {label:'Nova Eğitim Modeli',href:'nova-egitim-modeli.html'},
      {label:'Nova Öğrenci Pasaportu',href:'nova-ogrenci-pasaportu.html'}
    ]},
    {label:'YETENEK SİSTEMİ',href:'index.html#sistem',children:[
      {label:'Değerlendirme',href:'nova-yetenek-taramasi.html'},
      {label:'Kabul Süreci',href:'ogrenci-kabul-sureci.html'}
    ]},
    {label:'ÖĞRENCİ YOLCULUĞU',href:'index.html#yolculuk',children:[
      {label:'Gelişim Planı',href:'gelisim-plani.html'},
      {label:'Performans Takibi',href:'performans-takibi.html'},
      {label:'Kariyer Hazırlığı',href:'kariyer-hazirligi.html'}
    ]},
    {label:'NOVA GLOBAL',href:'index.html#global'},
    {label:'İLETİŞİM',href:'iletisim.html'}
  ];

  const link=(item,className)=>`<a class="${className}" href="${item.href||'#'}">${item.label}</a>`;
  const renderThird=items=>`<div class="nova-submenu-level3">${items.map(item=>link(item,'nova-submenu-level3-link')).join('')}</div>`;
  const renderSecond=items=>items.map(item=>item.children?.length
    ? `<div class="nova-submenu-group">${link(item,'nova-submenu-level2')}${renderThird(item.children)}</div>`
    : link(item,'nova-submenu-level2')).join('');
  const renderTop=item=>`<div class="nova-nav-item">${link(item,'nova-nav-link')}${item.children?.length?`<div class="nova-submenu">${renderSecond(item.children)}</div>`:''}</div>`;
  const html=`<header class="nova-main-header"><button class="hamb" type="button" aria-label="Menüyü aç">☰</button><a class="nova-brand" href="index.html#top"><img src="assets/nova-logo2.png?v=20261011-6" alt="NOVA Performans Sanatları Gelişim Merkezi"></a><nav class="nova-nav" aria-label="Ana menü">${navigation.map(renderTop).join('')}</nav><a class="nova-results" href="sinavlar.html">SINAV SONUÇLARI <span aria-hidden="true">↗</span></a></header>`;

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
const mountFooterPhone=()=>document.querySelectorAll('footer#iletisim .footer-bottom').forEach(bottom=>{const kriter=bottom.querySelector('.kriter-media img');if(kriter){kriter.src='assets/kriter-medya-transparent.png?v=20261011-1';kriter.alt='Kriter Medya'}if(bottom.querySelector('.footer-phone'))return;const phone=document.createElement('a');phone.className='footer-phone';phone.href='tel:+908503038957';phone.setAttribute('aria-label','NOVA telefon numarası 0850 303 89 57');phone.innerHTML='<small>BİZE ULAŞIN</small><strong>0850 303 89 57</strong>';bottom.append(phone)});if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mountFooterPhone,{once:true});else mountFooterPhone();
/* Production sync: 2026-10-11 · footer phone and transparent Kriter logo */

const mountFooterBrand=()=>document.querySelectorAll('footer .footer-logo').forEach(logo=>{logo.src='assets/nova-logo2.png?v=20261011-6';logo.classList.add('footer-logo--white');logo.style.filter='brightness(0) invert(1)';logo.alt='NOVA Performans Sanatları Gelişim Merkezi'});if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mountFooterBrand,{once:true});else mountFooterBrand();

const ensureFooterWhiteLogo=()=>{if(document.getElementById('nova-footer-white-logo'))return;const style=document.createElement('style');style.id='nova-footer-white-logo';style.textContent='footer .footer-logo.footer-logo--white{filter:brightness(0) invert(1)!important;opacity:1!important}';document.head.append(style)};ensureFooterWhiteLogo();
