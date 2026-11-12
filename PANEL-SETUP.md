# NOVA yönetim paneli ve başvuru sistemi

## cPanel yönetim paneli

Canlı kullanıcı adı/şifreli cPanel paneli PHP ile çalışır. Bu depoda aynı giriş akışı ve mevcut slider yönetimi korunarak panel kabuğu yenilenmiştir. `/panel/` adresi artık `/panel/index.php` girişine yönlenir; girişten sonra başlangıç ekranı **Sınav Oluştur** tasarımıdır. Sınav/başvuru verisi var olan Cloudflare Worker Durable Object deposunda kalır. PHP paneli güvenli bir cPanel sunucu tarafı proxy ile bu API'ye bağlanır; ayrı bir sınav kopyası oluşturmaz.

cPanel Git dağıtımı `.cpanel.yml` içinde `/home/novasana/public_html/` hedefine `api/`, `assets/`, `panel/` ve `includes/` klasörlerini kopyalar. `config.php` ve `uploads/` bu dağıtım listesine dahil değildir; cPanel'deki veritabanı ayarı, mevcut yönetici hesabı ve yüklenmiş medya yerinde kalır. `includes/bootstrap.php`, cPanel'de `public_html/config.php` dosyasını kullanır.

Sınav oluşturma ekranı mevcut Worker API'sine bağlıdır: kategoriler, sınav türleri, başvuru/kesin kayıt ücretleri, sözleşmeler, iller, oturumlar ve başvuru özeti aynı kalıcı veriden okunur/yazılır. Sınav ekranına ilk girişte Cloudflare Worker panel parolası bir defa sorulur; parolayı PHP sunucusu Worker'a iletir ve yalnızca Worker oturum çerezini PHP oturumunda tutar. Parola GitHub'a ya da dosyalara yazılmaz. Hosting hesabında PHP cURL etkin olmalıdır. Diğer yönetim bölümleri (haber, kurul, ortaklar, iletişim) ayrı sırayla bağlanacaktır.

## Cloudflare Worker başvuru uygulaması

Bu depoda ayrıca Cloudflare Worker üzerinde çalışan ayrı bir başvuru ve sınav yönetimi uygulaması bulunur. Worker paneli kendi kimlik doğrulamasını ve Durable Object verisini kullanır; cPanel PHP oturumu veya MySQL veritabanıyla şu anda ortak çalışmaz. Worker dağıtımı, cPanel Git dağıtımından ayrıdır.

Başvuru ve sonuç ekranları `https://nova-akademi.milligenclikmgd.workers.dev` API'sini kullanır; `novasanat.com.tr` üzerindeki cPanel `/api/...` yolunun 404 vermesi böylece aşılır. Worker'da `NOVA_SITE_ORIGIN` değeri, tarayıcıda kullanılan tam kökenle aynı olmalıdır (ör. `https://novasanat.com.tr`; www kullanılıyorsa www alan adını kanonikleştirip bu kökeni ayarlayın). Worker panel parolası `NOVA_PANEL_PASSWORD` Secret olarak tutulmalıdır; GitHub'a veya HTML'e yazılmamalıdır.

## Veri güvenliği ve ileriki aşamalar

- cPanel paneli, mevcut yönetici hesabını `nova_admins` tablosunda ve parolanın hash'ini kullanarak doğrular.
- cPanel dağıtım komutunda `config.php` ve `uploads/` yoktur; deploy bu dosyaları ve dizini kopyalayıp üzerine yazmaz.
- Worker başvuruları Durable Object verisinde tutulur. cPanel paneliyle bağlanmadan önce hangi uygulamanın sınav/başvuru verisinin ana kaynağı olacağı netleştirilmeli; aynı kayıtları iki yerde tutmaktan kaçınılmalıdır.
- Üretimde panel ve veritabanı için düzenli yedek alınması önerilir.
