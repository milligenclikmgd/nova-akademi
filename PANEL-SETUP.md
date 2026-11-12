# NOVA yönetim paneli ve başvuru sistemi

## cPanel yönetim paneli

Canlı kullanıcı adı/şifreli cPanel paneli PHP ile çalışır. Bu depoda aynı giriş akışı ve mevcut slider yönetimi korunarak panel kabuğu yenilenmiştir. `/panel/` adresi artık `/panel/index.php` girişine yönlenir; girişten sonra başlangıç ekranı **Sınav Oluştur** tasarımıdır.

cPanel Git dağıtımı `.cpanel.yml` içinde `/home/novasana/public_html/` hedefine `api/`, `assets/`, `panel/` ve `includes/` klasörlerini kopyalar. `config.php` ve `uploads/` bu dağıtım listesine dahil değildir; cPanel'deki veritabanı ayarı, mevcut yönetici hesabı ve yüklenmiş medya yerinde kalır. `includes/bootstrap.php`, cPanel'de `public_html/config.php` dosyasını kullanır.

Menüdeki sınav, başvurular, sonuçlar, haberler, yönetim kurulu, iş ortakları ve iletişim sayfaları ilk aşamada arayüz/yer tutucu durumundadır. Bu depodaki PHP panel şu anda yalnızca eski slider kayıtlarıyla gerçek veri işlemi yapar. Modüller, ilgili tablolar/API'ler hazırlanıp eşleştirildikçe çalışır hale getirilecektir. İletişim formunun mesajlarını da gerçek tabloda/API'de saklama bağlantısı ayrıca kurulmalıdır.

## Cloudflare Worker başvuru uygulaması

Bu depoda ayrıca Cloudflare Worker üzerinde çalışan ayrı bir başvuru ve sınav yönetimi uygulaması bulunur. Worker paneli kendi kimlik doğrulamasını ve Durable Object verisini kullanır; cPanel PHP oturumu veya MySQL veritabanıyla şu anda ortak çalışmaz. Worker dağıtımı, cPanel Git dağıtımından ayrıdır.

Başvuru ekranının kullandığı kanonik site adresi Worker'da `NOVA_SITE_ORIGIN` değişkeni olarak tanımlanmalıdır. Worker panel parolası `NOVA_PANEL_PASSWORD` Secret olarak tutulmalıdır; GitHub'a veya HTML'e yazılmamalıdır.

## Veri güvenliği ve ileriki aşamalar

- cPanel paneli, mevcut yönetici hesabını `nova_admins` tablosunda ve parolanın hash'ini kullanarak doğrular.
- cPanel dağıtım komutunda `config.php` ve `uploads/` yoktur; deploy bu dosyaları ve dizini kopyalayıp üzerine yazmaz.
- Worker başvuruları Durable Object verisinde tutulur. cPanel paneliyle bağlanmadan önce hangi uygulamanın sınav/başvuru verisinin ana kaynağı olacağı netleştirilmeli; aynı kayıtları iki yerde tutmaktan kaçınılmalıdır.
- Üretimde panel ve veritabanı için düzenli yedek alınması önerilir.
