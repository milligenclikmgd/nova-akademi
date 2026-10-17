# NOVA başvuru ve yönetim paneli

Panel adresi `/panel` (ana site menüsünde bağlantısı yoktur). Panel dosyası bir giriş ekranıdır; başvuru verileri ve dekontlar yalnızca sunucuda doğrulanan yönetici oturumuyla alınabilir.

Ana site `https://nova-akademi.vercel.app` üzerinde de yayınlandığından bu alan adındaki başvuru ekranı kayıt isteklerini doğrudan Cloudflare Worker'a gönderir. CORS yalnızca bu alan adı ve Worker'ın kendi kaynağı için açılır; yönetici API'leri çapraz kaynağa açılmaz. Vercel'de `/panel` aynı Worker üzerindeki panele yönlenir. Böylece oturum çerezi panelin kendi alan adında kalır ve başvurular tek depoda toplanır. Vercel ana alan adı değişirse istemci alan adı eşlemesini güncelleyin ve Cloudflare'da `NOVA_SITE_ORIGIN` ortam değişkenini yeni tam köken adresi olarak tanımlayın.

## İlk kurulum

1. Mevcut Cloudflare Worker projesini bu deponun `wrangler.jsonc` dosyasıyla deploy edin. SQLite destekli `NOVA_APPLICATIONS` Durable Object bağlaması ve `nova-applications-v1` migration'ı deploy sırasında oluşturulur. Var olan Gemini değişkeni korunur.
2. Cloudflare → Workers & Pages → `nova-akademi` → Settings → Variables and Secrets bölümünde `NOVA_PANEL_PASSWORD` adında **Secret** ekleyin. En az 16 karakterlik, benzersiz bir parola seçin. Parolayı GitHub'a, HTML'e veya normal bir ortam değişkenine yazmayın. CLI alternatifi: `npx wrangler secret put NOVA_PANEL_PASSWORD` (parola gizli istemde girilir).
3. `/panel` adresinde bu parolayla giriş yapın. Sınavlar ve Ücretler bölümünden ana/alt başlıkları düzenleyin. Adaylık ve kesin kayıt ücretlerini ayrı ayrı tanımlayın; boş ücret o başvuru türünü kapatır, 0 ücretsizdir.
4. Ödeme açıklaması ve banka bilgilerini girin. Başvuru alımını açıp ayarları kaydedin.
5. Kendi deneme adayınızla bir başvuru yapıp panelde formu ve dekontu kontrol edin. Gerçek kişilerle ilgili verilerle test yapmayın.

Panel parolası ve kalıcı bağlama hazır olmadan sistem başvuru kabul etmez. Varsayılan parola veya ilk ziyaretçinin yönetici olması gibi bir kurulum akışı yoktur.

## Veri ve davranış

- Başvurular ve en fazla 5 MB PDF dekontlar SQLite destekli Durable Object içinde tutulur. PDF'ler atomik işlemle 64 KB parçalar halinde kaydedilir; herkese açık asset klasöründe tutulmaz.
- Ücret tarayıcıdan alınmaz; sunucu güncel branş ve başvuru türü üzerinden hesaplar. Ücret sürümü değişirse adayın yeni bilgiyi incelemesi gerekir. Eski başvurunun ücret ve başlık kopyası korunur.
- Aynı gönderimin yeniden denenmesi aynı başvuru numarasını döndürür.
- `Ödendi` aday beyanıdır. Panelde `Kontrol bekliyor` görünür; yönetici `Ödeme doğrulandı` yapabilir. Gerçek ödeme veya banka işlemi gerçekleştirilmez.
- HttpOnly, Secure, SameSite=Strict oturum çerezi 8 saat geçerlidir. Giriş ve başvuru uçları hız sınırlıdır. Yazma istekleri aynı kaynakla sınırlandırılır.
- Panel parolası değiştiğinde eski parolayla açılan oturumlar otomatik olarak geçersiz olur.
- Düzenli yedekleme, veri saklama/silme politikası ve çok kullanıcılı yönetici hesapları sonraki aşamada kurumla birlikte belirlenmelidir.

## Yerel kontrol

Cloudflare Workers geliştirme ortamında `npx wrangler dev` kullanın. Yerel test parolasını yalnızca Git tarafından izlenmeyen `.dev.vars` dosyasında tutun. Üretim veritabanına bağlanmadan başvuru, veli alternatifi, ücret değişimi, oturum ve PDF akışlarını kontrol edin.

Otomatik entegrasyon kontrolü için ayrı bir yerel durum diziniyle `npx wrangler dev --port 8788 --persist-to .wrangler/integration-state` çalıştırın. Bu test için `.dev.vars` parolası yalnızca yerelde `nova-local-integration-only-2026` olmalıdır; bunu üretim parolası olarak kullanmayın. Node.js 20+ ile `node tests/applications.integration.cjs` çalıştırmadan önce `NOVA_TEST_URL=http://127.0.0.1:8788` ortam değişkenini tanımlayın. Test sadece loopback URL'lerini kabul eder ve yerel deneme başvuruları oluşturur. Kontrol sonunda yeni kayıtlar yerel test veritabanında kalır; üretime gönderilmez.
