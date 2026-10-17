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
    {label:'KABUL SÜRECİ',href:'index.html#sistem',children:[
      {label:'Değerlendirme',href:'nova-yetenek-taramasi.html'},
      {label:'Kabul Süreci',href:'ogrenci-kabul-sureci.html'}
    ]},
    {label:'ÖĞRENCİ YOLCULUĞU',href:'index.html#yolculuk',children:[
      {label:'Gelişim Planı',href:'gelisim-plani.html'},
      {label:'Performans Takibi',href:'performans-takibi.html'},
      {label:'Kariyer Hazırlığı',href:'kariyer-hazirligi.html'}
    ]},
    {label:'İLETİŞİM',href:'iletisim.html'}
  ];

  const link=(item,className)=>`<a class="${className}" href="${item.href||'#'}">${item.label}</a>`;
  const renderThird=items=>`<div class="nova-submenu-level3">${items.map(item=>link(item,'nova-submenu-level3-link')).join('')}</div>`;
  const renderSecond=items=>items.map(item=>item.children?.length
    ? `<div class="nova-submenu-group">${link(item,'nova-submenu-level2')}${renderThird(item.children)}</div>`
    : link(item,'nova-submenu-level2')).join('');
  const renderTop=item=>`<div class="nova-nav-item">${link(item,'nova-nav-link')}${item.children?.length?`<div class="nova-submenu">${renderSecond(item.children)}</div>`:''}</div>`;
  const html=`<header class="nova-main-header"><button class="hamb" type="button" aria-label="Menüyü aç">☰</button><a class="nova-brand" href="index.html#top"><img src="assets/nova-logo2.png?v=20261011-6" alt="NOVA Performans Sanatları Gelişim Merkezi"></a><nav class="nova-nav" aria-label="Ana menü">${navigation.map(renderTop).join('')}</nav><a class="nova-results nova-apply" href="sinav-basvurusu.html">SINAV BAŞVURUSU <span aria-hidden="true">↗</span></a><a class="nova-results" href="sinavlar.html">SINAV SONUÇLARI <span aria-hidden="true">↗</span></a></header>`;

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
const mountFooterPhone=()=>document.querySelectorAll('footer#iletisim .footer-bottom').forEach(bottom=>{const kriter=bottom.querySelector('.kriter-media img');if(kriter){kriter.src='assets/kriter-medya-white.png?v=20261017-1';kriter.alt='Kriter Medya'}if(bottom.querySelector('.footer-phone'))return;const phone=document.createElement('a');phone.className='footer-phone';phone.href='tel:+908503038957';phone.setAttribute('aria-label','NOVA telefon numarası 0850 303 89 57');phone.innerHTML='<small>BİZE ULAŞIN</small><strong>0850 303 89 57</strong>';bottom.append(phone)});
/* Production sync: 2026-10-11 · footer phone and transparent Kriter logo */

const mountFooterBrand=()=>document.querySelectorAll('footer .footer-logo').forEach(logo=>{logo.src='assets/nova-logo2.png?v=20261011-6';logo.classList.remove('footer-logo--white');logo.style.removeProperty('filter');logo.alt='NOVA Performans Sanatları Gelişim Merkezi'});




/* Tüm sayfalarda ana sayfa ile aynı footer kullanılır. */
const novaHomeFooter="<img class=\"footer-logo\" src=\"assets/nova-logo2.png?v=20261011-6\" alt=\"NOVA\"><div class=\"footer-nav-grid\" aria-label=\"Footer menüsü\">\n  <div><b>YETENEK SİSTEMİ</b><a href=\"#degerlendirme\">Yetenek Değerlendirmesi</a><a href=\"#model\">Gelişim Aşamaları</a><a href=\"#sistem\">Kabul Süreci</a></div>\n  <div><b>EĞİTİM MODELİ</b><a href=\"#model\">NOVA Eğitim Modeli</a><a href=\"#yolculuk\">Öğrenci Yolculuğu</a><a href=\"#yolculuk\">Öğrenci Pasaportu</a></div>\n  <div><b>SANAT</b><a href=\"#sanat\">NOVA Sanat Akademisi</a><a href=\"#sanat\">Halk Oyunları</a><a href=\"#sanat\">Dans ve Sahne</a></div>\n  <div><b>SPOR</b><a href=\"#spor\">NOVA Spor Akademisi</a><a href=\"#spor\">Branşlar</a><a href=\"#spor\">Sporcu Gelişimi</a></div>\n  <div><b>ÖĞRENCİ YOLCULUĞU</b><a href=\"#yolculuk\">Gelişim Planı</a><a href=\"#yolculuk\">Performans Takibi</a><a href=\"#model\">Kariyer Hazırlığı</a></div>\n  <div><b>NOVA GLOBAL</b><a href=\"#global\">Uluslararası Projeler</a><a href=\"#global\">İş Birlikleri</a><a href=\"#seffaflik\">Şeffaflık</a></div>\n  <div><b>KURUMSAL</b><a href=\"#kurumsal\">NOVA Hakkında</a><a href=\"#kurumsal\">Güven ve Sorumluluk</a><a href=\"#seffaflik\">Şeffaflık Belgeleri</a></div>\n  <div><b>İLETİŞİM</b><a href=\"mailto:info@novaakademi.com\">info@novaakademi.com</a><a href=\"#haberler\">Haberler ve Duyurular</a><a href=\"#ilkeler\">Temel İlkelerimiz</a><div class=\"footer-socials\" aria-label=\"Sosyal medya\"><a href=\"#\" aria-label=\"Instagram\"><svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><rect x=\"3\" y=\"3\" width=\"18\" height=\"18\" rx=\"5\"/><circle cx=\"12\" cy=\"12\" r=\"4\"/><circle cx=\"17.5\" cy=\"6.5\" r=\"1\"/></svg></a><a href=\"#\" aria-label=\"Facebook\"><svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M14 21v-8h3l.5-3H14V8.2c0-.9.3-1.7 1.8-1.7H18V3.8c-.6-.1-1.5-.2-2.5-.2-2.6 0-4.4 1.6-4.4 4.5V10H8v3h3.1v8H14Z\"/></svg></a><a href=\"#\" aria-label=\"YouTube\"><svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M21 12s0-3.2-.4-4.7a2.4 2.4 0 0 0-1.7-1.7C17.4 5.2 12 5.2 12 5.2s-5.4 0-6.9.4a2.4 2.4 0 0 0-1.7 1.7C3 8.8 3 12 3 12s0 3.2.4 4.7a2.4 2.4 0 0 0 1.7 1.7c1.5.4 6.9.4 6.9.4s5.4 0 6.9-.4a2.4 2.4 0 0 0 1.7-1.7c.4-1.5.4-4.7.4-4.7Z\"/><path d=\"m10 15.5 5-3.5-5-3.5v7Z\"/></svg></a><a href=\"#\" aria-label=\"X\"><svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M4 4l6.2 8.3L4.4 20h2.3l4.5-5.9 4.4 5.9H20l-6.6-8.8L18.8 4h-2.3l-4.1 5.4L8.3 4H4Zm3.7 1.7h1.7l6.8 9.1h-1.7L7.7 5.7Z\"/></svg></a></div></div>\n</div><div class=\"footer-bottom\"><small>© 2026 NOVA Sanat ve Spor Kulübü. Tüm hakları saklıdır.</small><span class=\"kriter-media\"><span>Dijital Çözüm Ortağı</span><img src=\"assets/kriter-medya-white.png?v=20261017-1\" alt=\"Kriter Medya\"></span></div>";
const syncNovaFooter=()=>{
 const footers=[...document.querySelectorAll('footer')];if(!footers.length)return;
 const sheets=[...document.querySelectorAll('link[rel="stylesheet"]')].filter(link=>new URL(link.href,location.href).pathname.endsWith('/nova-footer.css'));
 if(sheets.length)sheets.forEach(link=>link.href='nova-footer.css?v=20261017-1');
 else{const link=document.createElement('link');link.rel='stylesheet';link.href='nova-footer.css?v=20261017-1';document.head.append(link)}
 footers.forEach(footer=>{footer.id='iletisim';footer.classList.remove('exam-footer');footer.innerHTML=novaHomeFooter});
 mountFooterBrand();mountFooterPhone();
};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',syncNovaFooter,{once:true});else syncNovaFooter();
