# NOVA başvuru ve yönetim paneli

Bu depodaki Worker paneli `/panel` yolunda çalışır ve `NOVA_PANEL_PASSWORD` gizli anahtarıyla doğrulama yapar. Canlı `https://novasanat.com.tr/panel/` adresinde görünen kullanıcı adı/şifreli cPanel paneli ayrı bir uygulamadır; bu depodaki Worker paneli onun oturum bilgilerini kullanmaz. Mevcut cPanel girişini korumak için bu deponun `panel/` klasörünü canlı `public_html/panel/` içine kopyalamayın. Önce mevcut cPanel panelinin kaynak kodunu bu depo ile eşleştirmek gerekir.

Site özel alan adında ve cPanel'de yayınlanıyorsa, başvuru ekranının kullandığı **tek kanonik adresin** kökeni Cloudflare Worker'da `NOVA_SITE_ORIGIN` ortam değişkeni olarak tanımlanmalıdır; örneğin `https://www.ornekalanadi.com` (sonunda yol veya `/panel` olmamalı). Siteyi www ile açacaksanız www adresini; www olmadan açacaksanız kök alan adını kullanın. Diğer biçimi bu kanonik adrese yönlendirin. Bu ayar, başvuru ekranının Worker API'sine güvenli biçimde istek göndermesini sağlar. Yönetici API'leri çapraz kaynağa açılmaz; panel kendi Worker kaynağında çalışır ve oturum çerezi bu kaynakta kalır.

## İlk kurulum

1. cPanel panel girişini koruyacaksanız, yalnızca bu deponun `.cpanel.yml` ile tanımlı dağıtımını kullanın; `panel/` klasörünü ayrıca canlı panele kopyalamayın. Bu GitHub deposu Worker uygulamasını ve NOVA ana sitesini içerir, ancak mevcut kullanıcı adı/şifreli cPanel panelinin kaynak kodu henüz bu depo ile eşleştirilmedi.
2. Cloudflare Workers & Pages → `nova-akademi` → Settings → Variables and Secrets bölümünde `NOVA_SITE_ORIGIN` adında ortam değişkeni oluşturup sitenizin kanonik tam köken adresini girin.
3. Aynı yerde `NOVA_PANEL_PASSWORD` adında **Secret** ekleyin. En az 8 karakterlik, benzersiz bir parola seçin. Parolayı GitHub'a, HTML'e veya normal bir ortam değişkenine yazmayın. CLI alternatifi: `npx wrangler secret put NOVA_PANEL_PASSWORD` (parola gizli istemde girilir).
4. Bu deponun güncel `wrangler.jsonc` dosyasıyla mevcut Cloudflare Worker'ı deploy edin. SQLite destekli `NOVA_APPLICATIONS` Durable Object bağlaması ve `nova-applications-v1` migration'ı deploy sırasında oluşturulur. Gemini değişkeni varsa korunur.
5. Worker panelini `https://nova-akademi.milligenclikmgd.workers.dev/panel` adresinde açıp `NOVA_PANEL_PASSWORD` ile giriş yapın. Bu adım canlı cPanel panelinin kurulumu değildir. Sınavlar ve Ücretler bölümünden ana/alt başlıkları ve ücretleri düzenleyin; boş ücret o sınavı kapatır, 0 ücretsizdir.
6. Ödeme açıklaması ve banka bilgilerini girin. Başvuru alımını açıp ayarları kaydedin.
7. Kendi deneme adayınızla başvuru yapıp panelde formu ve dekontu kontrol edin. Gerçek kişilerin bilgileriyle test yapmayın.

Panel parolası ve kalıcı veri bağlaması hazır olmadan sistem başvuru kabul etmez. Varsayılan parola veya ilk ziyaretçinin yönetici olması gibi bir kurulum akışı yoktur.

## Veri ve davranış

- Başvurular ve en fazla 5 MB PDF dekontlar SQLite destekli Durable Object içinde tutulur. PDF'ler atomik işlemle 64 KB parçalar halinde kaydedilir; herkese açık dosya klasöründe tutulmaz.
- Ücret sunucuda doğrulanır. Eski başvurunun ücret ve sınav başlığı kopyası korunur.
- Aday başvuru durumunu numarasıyla sorgulayabilir. Reddedilen başvurularda paneldeki **Ret açıklaması** adaya gösterilir.
- Paneldeki **Başvuruları ve sınavları sıfırla** işlemi tüm başvuruları, sonuçları, kesin kayıtları ve bağlı dekont/sağlık belgelerini kalıcı olarak siler; sınav merkezi atamalarını boşaltır ve başvuru alımını kapatır. Sınav şablonları korunur.
- İl, sınav/branş, durum ve aday adı filtreleri kullanılabilir. Excel dışa aktarımı geçerli filtreleri uygular.
- `Ödendi` aday beyanıdır. Yönetici ödemeyi panelden doğrulayabilir; sistem banka işlemi yapmaz.
- HttpOnly, Secure, SameSite=Strict oturum çerezi 8 saat geçerlidir. Giriş ve başvuru uçları hız sınırlıdır. Yazma istekleri aynı kaynakla sınırlandırılır.
- Panel parolası değişince eski oturumlar geçersiz olur.
- Düzenli yedekleme, veri saklama/silme politikası ve çok kullanıcılı yönetici hesapları sonraki aşamada belirlenmelidir.

## Yerel geliştirme

Cloudflare Workers geliştirme ortamında `npx wrangler dev` kullanın. Yerel parola yalnızca Git tarafından izlenmeyen `.dev.vars` dosyasında tutulmalıdır. Üretim veritabanına bağlanmadan başvuru, oturum ve PDF akışlarını kontrol edin.

## Faaliyet Alanları hero videosu

Panel → **Site Videosu** bölümünden en fazla 25 MB MP4 (H.264/AAC önerilir) veya WebM yükleyin. Önizlemenin ardından **Videoyu yükle ve yayınla** ile kaydedin. Yükleme başarısızsa önceki video korunur. **Varsayılan videoya dön** sitedeki `assets/activity-intro.mp4` dosyasını yeniden kullanır.

Video aynı Durable Object deposunda saklanır; yeni bucket veya secret gerekmez. Bu özellikte yalnızca cPanel'deki statik dosyaları dağıtmak yeterli olmaz; panel API'sinin bulunduğu Worker da güncel `wrangler.jsonc` ile yeniden deploy edilmelidir.
