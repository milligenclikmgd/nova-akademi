# NOVA yönetim paneli ve sınav sistemi

## cPanel yönetim paneli

Canlı kullanıcı adı/şifreli cPanel paneli PHP ile çalışır. Mevcut giriş akışı, yönetici hesabı ve slider yönetimi korunmuştur. `/panel/` adresi `/panel/index.php` girişine yönlenir; girişten sonra başlangıç ekranı Sınav Oluştur tasarımıdır.

cPanel Git dağıtımı `.cpanel.yml` içindeki görevle `/home/novasana/public_html/` hedefine `api/`, `assets/`, `panel/` ve `includes/` klasörlerini kopyalar. `config.php` ve `uploads/` dağıtım listesine dahil değildir; cPanel'deki veritabanı ayarı, yönetici hesabı ve yüklenmiş medya yerinde kalır. `includes/bootstrap.php`, cPanel'deki `public_html/config.php` dosyasını kullanır.

## Sınav verisinin akışı

Sınav ve başvuru verisinin tek kaynağı mevcut Cloudflare Worker Durable Object deposudur. Panel, cPanel'deki `api/worker-proxy.php` üzerinden Worker API'sine bağlanır. Bu şekilde cPanel paneli ayrı bir sınav/başvuru kopyası oluşturmaz.

Sınav ekranına ilk girişte Worker panel parolası bir kez istenir. Parola ilk bağlantıda HTTPS üzerinden Worker'a gönderilir; dosyaya, tarayıcı JavaScript'ine veya GitHub'a yazılmaz. Worker oturum anahtarı cPanel veritabanında sunucu tarafında AES-GCM ile şifrelenmiş olarak saklanır ve 30 gün boyunca otomatik kullanılır; cPanel'den çıkış yapılınca kayıt silinir. Bu nedenle menüler arasında gezerken veya sayfayı yenilerken Cloudflare parolası tekrar sorulmaz. cPanel hostingde PHP cURL ve OpenSSL etkin olmalıdır. Bu bağlantı için gereken parola Worker'da `NOVA_PANEL_PASSWORD` Secret olarak ayarlanmış paroladır; cPanel panel kullanıcı parolasıyla aynı olmak zorunda değildir.

Sınav Oluştur ekranında mevcut sınav özeti, il bazlı sınav listesi ve toplu il/sınav seçimi Worker verisine bağlanır. Sınav başvuru ve sonuç ekranları da aynı Worker API'sini kullanır. Yeni sınavlar seçilen illere yayımlandığında başvuru ekranındaki harita bu illeri etkin gösterir. Başvurular ekranı Worker kayıtlarını sayfalı listeler; adayın form bilgilerini, dönem/il/sınav bilgisini ve ödeme durumunu ayrıntıda gösterir. Yüklenmiş başvuru ve kesin kayıt dekontları yetkili panel oturumu üzerinden görüntülenip indirilebilir. Sanal POS sağlayıcısı ve işlem numarası, Ziraat entegrasyonu Worker verisine yazıldığında ödeme ayrıntısında gösterilir; POS tahsilat entegrasyonu bu panel ekranından ayrı bir kurulum adımıdır.

## Alan adı ve başvuru ekranı

Başvuru ve sonuç ekranları `https://nova-akademi.milligenclikmgd.workers.dev` API'sini kullanır; böylece `novasanat.com.tr` üzerindeki cPanel `/api/...` yolunun 404 vermesi aşılır. Worker'da `NOVA_SITE_ORIGIN` değeri tarayıcıda kullanılan tam kökenle aynı olmalıdır (ör. `https://novasanat.com.tr`). Ziyaretçiler `www` adresini de kullanacaksa onu kanonik alan adına yönlendirin veya CORS ayarına ayrıca ekleyin.

## Diğer panel bölümleri

Haberler ve duyurular, yönetim kurulu, iş ortaklarımız ve iletişim ekranlarının içerik yönetimi sonraki aşamalarda eklenecektir. Bu bölümler sınav sisteminin veri kaynağından bağımsızdır.

## Veri güvenliği

- cPanel paneli yöneticiyi mevcut `nova_admins` tablosu ve parola hash'i ile doğrular.
- cPanel dağıtım komutu `config.php` ve `uploads/` dosyalarını kopyalamaz.
- Worker panel parolası GitHub'a, HTML'e veya JavaScript'e eklenmemelidir.
- Üretimde panel dosyaları ve veritabanı için düzenli yedek alınması önerilir.
